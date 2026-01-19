/**
 * Vitamix Recommender Worker
 *
 * Main entry point for the Cloudflare Worker that powers the
 * AI-driven Vitamix Blender Recommender.
 *
 * Endpoints:
 * - GET /generate?q=...&slug=...&ctx=... - Stream page generation via SSE
 *   - q: User query (takes precedence over context)
 *   - ctx: Context ID (ctx_xxx) or legacy session context JSON
 *   - slug: URL slug for the page
 *   - preset: Model preset (production, fast, all-cerebras)
 * - GET /health - Health check
 *
 * NOTE: 'query' parameter is deprecated - use 'q' instead
 */

import type { Env, SessionContext, SSEEvent, IntentClassification, ExtensionContext } from './types';
import { orchestrate, orchestrateFromContext } from './lib/orchestrator';
import { persistAndPublish, buildPageHtml, unescapeHtml } from './lib/da-client';
import { classifyCategory, generateSemanticSlug, buildCategorizedPath } from './lib/category-classifier';

// Context storage key prefix
const CONTEXT_PREFIX = 'ctx_';
// Context TTL: 1 hour
const CONTEXT_TTL = 60 * 60;

// ============================================
// CORS Headers
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ============================================
// SSE Stream Handler
// ============================================

function createSSEStream(): {
  readable: ReadableStream;
  write: (event: SSEEvent) => void;
  close: () => void;
} {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const readable = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      // Client disconnected
    },
  });

  return {
    readable,
    write: (event: SSEEvent) => {
      const data = JSON.stringify(event.data);
      const message = `event: ${event.event}\ndata: ${data}\n\n`;
      controller.enqueue(encoder.encode(message));
    },
    close: () => {
      controller.close();
    },
  };
}

// ============================================
// Request Handlers
// ============================================

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  // Prefer 'q' parameter, fall back to 'query' for backward compatibility
  const query = url.searchParams.get('q') || url.searchParams.get('query');
  const slug = url.searchParams.get('slug');
  const ctxParam = url.searchParams.get('ctx');
  const preset = url.searchParams.get('preset') || undefined;

  // Check if ctx is a stored context ID (full context mode)
  // Pass query to override context.query when explicit query is provided
  if (ctxParam && ctxParam.startsWith(CONTEXT_PREFIX)) {
    return handleGenerateFromContext(ctxParam, slug, preset, env, query);
  }

  // Original query-based flow
  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Parse session context if provided (legacy inline JSON format)
  let sessionContext: SessionContext | undefined;
  if (ctxParam) {
    try {
      sessionContext = JSON.parse(ctxParam);
    } catch (e) {
      console.error('Failed to parse session context:', e);
    }
  }

  // Create SSE stream
  const { readable, write, close } = createSSEStream();

  // Start orchestration in background
  const orchestrationPromise = orchestrate(
    query,
    slug || generateSlug(query),
    env,
    write,
    sessionContext,
    preset
  )
    .catch((error) => {
      console.error('Orchestration error:', error);
      write({
        event: 'error',
        data: { message: error.message || 'Generation failed' },
      });
    })
    .finally(() => {
      close();
    });

  // Return SSE response immediately
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Handle generation from stored full context (extension flow)
 * @param explicitQuery - Optional query from URL that overrides context.query
 */
async function handleGenerateFromContext(
  contextId: string,
  slug: string | null,
  preset: string | undefined,
  env: Env,
  explicitQuery?: string | null
): Promise<Response> {
  // Fetch context from KV
  if (!env.SESSIONS) {
    return new Response(JSON.stringify({ error: 'KV storage not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const contextData = await env.SESSIONS.get(contextId);
  if (!contextData) {
    return new Response(JSON.stringify({ error: 'Context not found or expired' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  let context: ExtensionContext;
  try {
    context = JSON.parse(contextData);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid context data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // IMPORTANT: If explicit query provided via q= parameter, it takes precedence
  // Context signals become secondary supporting information
  if (explicitQuery) {
    console.log(`[handleGenerateFromContext] Explicit query provided: "${explicitQuery}"`);
    console.log(`[handleGenerateFromContext] Original context query: "${context.query || 'none'}"`);
    context.query = explicitQuery;
  }

  // Create SSE stream
  const { readable, write, close } = createSSEStream();

  // Determine slug - use query if available, otherwise generate from context
  const effectiveSlug = slug || generateSlugFromContext(context);

  // Start orchestration from full context
  const orchestrationPromise = orchestrateFromContext(
    context,
    effectiveSlug,
    env,
    write,
    preset
  )
    .catch((error) => {
      console.error('Context orchestration error:', error);
      write({
        event: 'error',
        data: { message: error.message || 'Generation failed' },
      });
    })
    .finally(() => {
      close();
    });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Store context from extension and return short ID
 */
async function handleStoreContext(request: Request, env: Env): Promise<Response> {
  if (!env.SESSIONS) {
    return new Response(JSON.stringify({ error: 'KV storage not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  try {
    const context: ExtensionContext = await request.json();

    // Validate context has some data
    const hasSignals = context.signals && context.signals.length > 0;
    const hasQuery = context.query && context.query.trim().length > 0;
    const hasPreviousQueries = context.previousQueries && context.previousQueries.length > 0;

    if (!hasSignals && !hasQuery && !hasPreviousQueries) {
      return new Response(JSON.stringify({ error: 'Context must have signals, query, or previous queries' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // Generate unique ID
    const id = `${CONTEXT_PREFIX}${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

    // Store in KV with TTL
    await env.SESSIONS.put(id, JSON.stringify(context), {
      expirationTtl: CONTEXT_TTL,
    });

    console.log(`[StoreContext] Stored context ${id} with ${context.signals?.length || 0} signals`);

    return new Response(JSON.stringify({ id }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    console.error('[StoreContext] Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}

function handleHealth(): Response {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'vitamix-recommender',
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    }
  );
}

/**
 * Handle hint generation request from extension
 */
interface HintRequest {
  pageContext: {
    url: string;
    path: string;
    title: string;
    h1: string;
    h2s: string[];
    metaDesc: string;
  };
  sections: Array<{
    selector: string;
    tagName: string;
    className: string;
    text: string;
  }>;
  profile: {
    segments: string[];
    use_cases: string[];
    products_considered: string[];
    price_sensitivity: string;
    decision_style: string;
    confidence_score: number;
  };
  signals: Array<{
    label: string;
    type: string;
    product?: string;
    data?: Record<string, unknown>;
  }>;
}

interface HintResponse {
  injectionPoint: {
    selector: string;
    position: 'before' | 'after';
  };
  hint: {
    eyebrow: string;
    headline: string;
    body: string;
    cta: string;
    query: string;
  };
}

async function handleGenerateHint(request: Request, env: Env): Promise<Response> {
  try {
    const hintRequest: HintRequest = await request.json();
    const { pageContext, sections, profile, signals } = hintRequest;

    // Build prompt for Claude
    const sectionsText = sections
      .slice(0, 8)
      .map((s, i) => `${i + 1}. [${s.selector}] ${s.text.slice(0, 200)}...`)
      .join('\n');

    const signalsText = signals
      .slice(-10)
      .map((s) => `- ${s.label}${s.product ? ` (${s.product})` : ''}`)
      .join('\n');

    // Build specificity requirements based on available data
    const hasProducts = profile.products_considered?.length > 0;
    const hasUseCases = profile.use_cases?.length > 0;
    const hasSignals = signals.length > 0;

    const specificityRequirement = hasProducts
      ? `You MUST mention at least one of these products by name: ${profile.products_considered.join(', ')}`
      : hasUseCases
      ? `You MUST reference their interest in: ${profile.use_cases.join(', ')}`
      : hasSignals
      ? `You MUST reference their browsing behavior from the signals above`
      : `Reference the specific page content they're viewing`;

    const prompt = `You are creating a HIGHLY PERSONALIZED content section for a specific user on vitamix.com.

CURRENT PAGE: ${pageContext.url}
Page H1: ${pageContext.h1 || pageContext.title}

USER'S BROWSING CONTEXT:
- Products they've viewed: ${profile.products_considered?.join(', ') || 'none yet'}
- Their interests: ${profile.use_cases?.join(', ') || 'exploring'}
- User segments: ${profile.segments?.join(', ') || 'new visitor'}
- Decision style: ${profile.decision_style || 'unknown'}

THEIR RECENT ACTIONS:
${signalsText || 'Just arrived on this page'}

PAGE SECTIONS (for injection targeting):
${sectionsText || 'Standard page layout'}

═══════════════════════════════════════════════════════════════
CRITICAL REQUIREMENT: ${specificityRequirement}
═══════════════════════════════════════════════════════════════

Your content MUST be specific to THIS user's journey. Generic content is FORBIDDEN.

BANNED GENERIC PHRASES (never use these):
- "Find what fits your kitchen"
- "Explore our blenders"
- "Start here"
- "Take the quiz"
- "Find your match"
- "Discover what's possible"
- Any content that could apply to ANY visitor

REQUIRED: Your headline and body MUST include at least ONE of:
- A specific product name (A3500, E310, Ascent, etc.)
- A specific feature (self-detect, hot soup program, variable speed)
- A specific use case (smoothies, soups, nut butter)
- A reference to their comparison/research behavior

EXAMPLES OF GREAT SPECIFIC CONTENT:

If they viewed A3500 and E310:
- eyebrow: "A3500 VS E310"
- headline: "The $200 Question, Answered"
- body: "You've looked at both. The A3500's touchscreen and app connectivity are the key differences—here's whether they're worth it for you."
- cta: "See Full Comparison"

If they're interested in soups:
- eyebrow: "FOR SOUP LOVERS"
- headline: "The Hot Soup Program Changes Everything"
- body: "Heat and blend in one step—no stovetop needed. See which models have it and the best soup recipes to try."
- cta: "Explore Soup Blenders"

If they viewed the A3500 product page:
- eyebrow: "ABOUT THE A3500"
- headline: "What Makes It the Flagship"
- body: "The A3500 is Vitamix's most advanced home blender. Here's whether its premium features match what you need."
- cta: "Deep Dive on A3500"

Return ONLY valid JSON:
{
  "injectionPoint": {
    "selector": "CSS selector from sections list",
    "position": "after"
  },
  "hint": {
    "eyebrow": "SPECIFIC CONTEXTUAL LABEL",
    "headline": "Headline With Specific Product/Feature/Use Case",
    "body": "Sentence referencing their specific journey and what they'll learn.",
    "cta": "Specific Action",
    "query": "Detailed query for AI page generator mentioning specific products/features"
  }
}`;

    // Call Claude for hint generation
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('[GenerateHint] Anthropic API error:', errorText);
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
    }

    const completion = await anthropicResponse.json() as {
      content: Array<{ type: string; text: string }>;
    };

    // Parse JSON from response
    const responseText = completion.content[0]?.text || '';
    console.log('[GenerateHint] Raw response:', responseText);

    // Extract JSON from response (in case it includes markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const hintData: HintResponse = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (!hintData.hint?.headline || !hintData.hint?.query) {
      throw new Error('Invalid hint structure');
    }

    console.log('[GenerateHint] Generated hint:', hintData.hint.headline);

    return new Response(JSON.stringify(hintData), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    console.error('[GenerateHint] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
}

/**
 * Persist request body structure
 */
interface PersistRequest {
  query: string;
  blocks: Array<{ html: string; sectionStyle?: string }>;
  intent?: IntentClassification;
  title?: string;
}

/**
 * Handle page persistence to DA
 */
async function handlePersist(request: Request, env: Env): Promise<Response> {
  try {
    const body: PersistRequest = await request.json();
    const { query, blocks, intent, title } = body;

    if (!query || !blocks || blocks.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing query or blocks' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
      );
    }

    // Create a default intent if not provided, normalizing entities to ensure arrays exist
    const effectiveIntent: IntentClassification = {
      intentType: intent?.intentType || 'discovery',
      confidence: intent?.confidence || 0.5,
      entities: {
        products: intent?.entities?.products || [],
        useCases: intent?.entities?.useCases || [],
        features: intent?.entities?.features || [],
      },
      journeyStage: intent?.journeyStage || 'exploring',
    };

    // Classify category and generate slug
    const category = classifyCategory(effectiveIntent, query);
    const slug = generateSemanticSlug(query, effectiveIntent);
    const path = buildCategorizedPath(category, slug);

    // Build page title - use provided title or extract from first h1 in blocks
    let pageTitle = title || 'Your Vitamix Experience';
    if (!title) {
      for (const block of blocks) {
        const h1Match = block.html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match) {
          // Unescape HTML entities since the extracted text may contain &amp; etc.
          pageTitle = unescapeHtml(h1Match[1]);
          break;
        }
      }
    }

    // Build page description from query
    const pageDescription = `Personalized Vitamix content for: ${query}`;

    // Build the HTML page
    const html = buildPageHtml(pageTitle, pageDescription, blocks);

    // Persist and publish
    console.log(`[Persist] Saving page to ${path}`);
    const result = await persistAndPublish(path, html, env);

    if (!result.success) {
      console.error(`[Persist] Failed: ${result.error}`);
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
      );
    }

    console.log(`[Persist] Success: ${result.urls?.live}`);
    return new Response(
      JSON.stringify({
        success: true,
        path,
        urls: result.urls,
      }),
      { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    );
  } catch (error) {
    console.error('[Persist] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    );
  }
}

function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// ============================================
// Utility Functions
// ============================================

function generateSlug(query: string): string {
  let slug = query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);

  const hash = Math.abs(
    query.split('').reduce((acc, char) => {
      const code = char.charCodeAt(0);
      return ((acc << 5) - acc) + code;
    }, 0)
  )
    .toString(36)
    .slice(0, 6);

  return `${slug}-${hash}`;
}

/**
 * Generate slug from extension context
 */
function generateSlugFromContext(context: ExtensionContext): string {
  // Priority: query > first segment + use case > generic
  if (context.query) {
    return generateSlug(context.query);
  }

  const parts: string[] = [];

  // Add primary segment
  if (context.profile.segments.length > 0) {
    parts.push(context.profile.segments[0]);
  }

  // Add primary use case
  if (context.profile.use_cases.length > 0) {
    parts.push(context.profile.use_cases[0]);
  }

  // Add first product considered
  if (context.profile.products_considered.length > 0) {
    parts.push(context.profile.products_considered[0]);
  }

  if (parts.length === 0) {
    parts.push('personalized-recommendation');
  }

  const base = parts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 60);
  const hash = context.timestamp.toString(36).slice(-6);

  return `${base}-${hash}`;
}

// ============================================
// Main Handler
// ============================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Route requests
    switch (path) {
      case '/generate':
        return handleGenerate(request, env);
      case '/store-context':
        if (request.method === 'POST') {
          return handleStoreContext(request, env);
        }
        return new Response('Method not allowed', { status: 405 });
      case '/generate-hint':
        if (request.method === 'POST') {
          return handleGenerateHint(request, env);
        }
        return new Response('Method not allowed', { status: 405 });
      case '/api/persist':
        if (request.method === 'POST') {
          return handlePersist(request, env);
        }
        return new Response('Method not allowed', { status: 405 });
      case '/health':
        return handleHealth();
      default:
        // Serve hero images from R2: /hero-images/{filename}
        if (path.startsWith('/hero-images/') && env.HERO_IMAGES) {
          const filename = path.replace('/hero-images/', '');
          const object = await env.HERO_IMAGES.get(filename);
          if (object) {
            const headers = new Headers();
            headers.set('Content-Type', object.httpMetadata?.contentType || 'image/png');
            headers.set('Cache-Control', 'public, max-age=31536000');
            headers.set('Access-Control-Allow-Origin', '*');
            return new Response(object.body, { headers });
          }
          return new Response('Image not found', { status: 404, headers: CORS_HEADERS });
        }
        return new Response('Not Found', { status: 404 });
    }
  },
};
