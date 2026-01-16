/**
 * Vitamix Recommender Worker
 *
 * Main entry point for the Cloudflare Worker that powers the
 * AI-driven Vitamix Blender Recommender.
 *
 * Endpoints:
 * - GET /generate?query=...&slug=...&ctx=... - Stream page generation via SSE
 * - GET /health - Health check
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
  const query = url.searchParams.get('query') || url.searchParams.get('q');
  const slug = url.searchParams.get('slug');
  const ctxParam = url.searchParams.get('ctx');
  const preset = url.searchParams.get('preset') || undefined;

  // Check if ctx is a stored context ID (full context mode)
  if (ctxParam && ctxParam.startsWith(CONTEXT_PREFIX)) {
    return handleGenerateFromContext(ctxParam, slug, preset, env);
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
 */
async function handleGenerateFromContext(
  contextId: string,
  slug: string | null,
  preset: string | undefined,
  env: Env
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

    // Create a default intent if not provided
    const effectiveIntent: IntentClassification = intent || {
      intentType: 'discovery',
      confidence: 0.5,
      entities: { products: [], useCases: [], features: [] },
      journeyStage: 'exploring',
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
      case '/api/persist':
        if (request.method === 'POST') {
          return handlePersist(request, env);
        }
        return new Response('Method not allowed', { status: 405 });
      case '/health':
        return handleHealth();
      default:
        return new Response('Not Found', { status: 404 });
    }
  },
};
