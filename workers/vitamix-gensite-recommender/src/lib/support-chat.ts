/**
 * Support Chat Handler
 *
 * Processes support queries and returns quick answers.
 * For complex issues, also provides a link to a full support page.
 */

import type {
  Env,
  SupportChatRequest,
  SupportChatResponse,
  SupportIntent,
} from '../types';

// POC site base URL for full support pages
const POC_BASE_URL = 'https://main--vitamix-gensite--paolomoz.aem.live';

/**
 * Handle support chat request
 */
export async function handleSupportChat(
  request: SupportChatRequest,
  env: Env
): Promise<SupportChatResponse> {
  const { query, conversationHistory, pageContext } = request;

  console.log('[SupportChat] Processing query:', query);

  // Step 1: Classify the support intent
  const intent = await classifySupportIntent(query, pageContext, env);
  console.log('[SupportChat] Intent:', intent.category, '| Complex:', intent.isComplex);

  // Step 2: Query SUPPORT_VECTORIZE for relevant content (if available)
  let relevantContent: string[] = [];
  if (env.SUPPORT_VECTORIZE) {
    relevantContent = await querySuportContent(query, intent, env);
    console.log('[SupportChat] Found', relevantContent.length, 'relevant content chunks');
  }

  // Step 3: Generate quick answer
  const quickAnswer = await generateQuickAnswer(
    query,
    intent,
    relevantContent,
    conversationHistory || [],
    pageContext,
    env
  );

  // Step 4: Determine if we should offer a full page
  let fullPageUrl: string | undefined;
  if (shouldOfferFullPage(intent, relevantContent)) {
    fullPageUrl = buildFullPageUrl(query);
    console.log('[SupportChat] Offering full page:', fullPageUrl);
  }

  // Step 5: Generate related topics
  const relatedTopics = generateRelatedTopics(intent, query);

  return {
    quickAnswer,
    fullPageUrl,
    relatedTopics,
  };
}

/**
 * Classify the support intent using fast model
 */
async function classifySupportIntent(
  query: string,
  pageContext: SupportChatRequest['pageContext'],
  env: Env
): Promise<SupportIntent> {
  const productContext = pageContext?.productViewed
    ? `User is currently viewing: ${pageContext.productViewed}`
    : '';

  const prompt = `Classify this Vitamix support question.

Query: "${query}"
${productContext}

Respond with JSON only:
{
  "category": "cleaning" | "troubleshooting" | "warranty" | "operation" | "assembly" | "recipes" | "safety" | "general",
  "product": "product name or null",
  "isComplex": true/false (true if: needs 3+ steps, involves safety, requires images/diagrams, is an assembly procedure),
  "confidence": 0.0-1.0
}`;

  try {
    // Use Cerebras for fast classification
    const cerebrasKey = env.CEREBRAS_API_KEY || env.CEREBRAS_KEY;
    if (cerebrasKey) {
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cerebrasKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0,
        }),
      });

      if (response.ok) {
        const data = await response.json() as { choices: Array<{ message: { content: string } }> };
        const content = data.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    }
  } catch (e) {
    console.error('[SupportChat] Classification error:', e);
  }

  // Fallback: simple keyword-based classification
  return classifyByKeywords(query);
}

/**
 * Fallback keyword-based classification
 */
function classifyByKeywords(query: string): SupportIntent {
  const q = query.toLowerCase();

  if (q.includes('clean') || q.includes('wash') || q.includes('dishwasher')) {
    return { category: 'cleaning', isComplex: false, confidence: 0.7 };
  }
  if (q.includes('not working') || q.includes('error') || q.includes('broken') || q.includes('problem')) {
    return { category: 'troubleshooting', isComplex: true, confidence: 0.7 };
  }
  if (q.includes('warranty') || q.includes('repair') || q.includes('return') || q.includes('replace')) {
    return { category: 'warranty', isComplex: true, confidence: 0.7 };
  }
  if (q.includes('assemble') || q.includes('setup') || q.includes('install') || q.includes('attach')) {
    return { category: 'assembly', isComplex: true, confidence: 0.7 };
  }
  if (q.includes('recipe') || q.includes('make') || q.includes('blend') || q.includes('smoothie')) {
    return { category: 'recipes', isComplex: false, confidence: 0.7 };
  }
  if (q.includes('safe') || q.includes('hot') || q.includes('burn') || q.includes('danger')) {
    return { category: 'safety', isComplex: true, confidence: 0.8 };
  }
  if (q.includes('speed') || q.includes('program') || q.includes('button') || q.includes('use')) {
    return { category: 'operation', isComplex: false, confidence: 0.6 };
  }

  return { category: 'general', isComplex: false, confidence: 0.5 };
}

/**
 * Query SUPPORT_VECTORIZE for relevant content
 */
async function querySuportContent(
  query: string,
  intent: SupportIntent,
  env: Env
): Promise<string[]> {
  if (!env.SUPPORT_VECTORIZE) {
    return [];
  }

  try {
    // Generate embedding for query using Cloudflare AI
    const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [query],
    }) as { data: number[][] };

    if (!embedding.data?.[0]) {
      return [];
    }

    // Query Vectorize
    const results = await env.SUPPORT_VECTORIZE.query(embedding.data[0], {
      topK: 5,
      returnMetadata: 'all',
    });

    // Extract content from results
    return results.matches
      .filter(m => m.score > 0.5)
      .map(m => {
        const metadata = m.metadata as Record<string, unknown>;
        return metadata?.content as string || '';
      })
      .filter(Boolean);
  } catch (e) {
    console.error('[SupportChat] Vectorize query error:', e);
    return [];
  }
}

/**
 * Generate quick answer using Claude Sonnet
 */
async function generateQuickAnswer(
  query: string,
  intent: SupportIntent,
  relevantContent: string[],
  conversationHistory: Array<{ role: string; content: string }>,
  pageContext: SupportChatRequest['pageContext'],
  env: Env
): Promise<string> {
  const contentContext = relevantContent.length > 0
    ? `\n\nRelevant manual content:\n${relevantContent.slice(0, 3).join('\n\n')}`
    : '';

  const productContext = pageContext?.productViewed
    ? `\nUser is viewing: ${pageContext.productViewed}`
    : '';

  const historyText = conversationHistory.length > 0
    ? `\n\nConversation history:\n${conversationHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}`
    : '';

  const systemPrompt = `You are a helpful Vitamix support assistant. Provide clear, concise answers to support questions.

Guidelines:
- Keep responses under 150 words
- Be direct and helpful
- If the issue requires hands-on steps, summarize the key points
- For complex issues, mention that a detailed guide is available
- Never recommend third-party repairs (Vitamix has excellent warranty service)
- Be warm but efficient${contentContext}`;

  const userPrompt = `${productContext}${historyText}

User question: ${query}

Provide a helpful, concise answer.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error('[SupportChat] Anthropic error:', await response.text());
      throw new Error('Failed to generate answer');
    }

    const data = await response.json() as { content: Array<{ text: string }> };
    return data.content[0]?.text || 'I apologize, but I couldn\'t generate an answer. Please try rephrasing your question.';
  } catch (e) {
    console.error('[SupportChat] Answer generation error:', e);
    return getFallbackAnswer(intent, query);
  }
}

/**
 * Fallback answer when API fails
 */
function getFallbackAnswer(intent: SupportIntent, query: string): string {
  const fallbacks: Record<string, string> = {
    cleaning: 'For cleaning your Vitamix, add warm water and a drop of dish soap, then blend on high for 30-60 seconds. Rinse and air dry. The container is also top-rack dishwasher safe.',
    troubleshooting: 'For troubleshooting issues, please ensure the container is properly seated and the lid is secure. If problems persist, Vitamix customer service at 1-800-848-2649 can help diagnose the issue.',
    warranty: 'Vitamix blenders come with an industry-leading warranty (up to 10 years for home models). For warranty claims, contact Vitamix directly at 1-800-848-2649 or vitamix.com/support.',
    assembly: 'For assembly help, make sure the container clicks into place on the motor base and the lid is properly seated with the plug inserted. Check your owner\'s manual for specific guidance.',
    recipes: 'Vitamix can make smoothies, soups, nut butters, and more! Start with liquids at the bottom, then add soft ingredients, and frozen items last. Begin on low speed and increase gradually.',
    safety: 'Important safety tips: Never put your hands in the container while blending. Always use the tamper with the lid in place. Let hot liquids cool slightly before blending.',
    operation: 'For basic operation, start on the lowest speed and gradually increase. Use the tamper to push ingredients toward the blades. Programs (on digital models) automate the process for specific tasks.',
    general: 'I\'m here to help with your Vitamix questions! For specific product support, you can also reach Vitamix customer service at 1-800-848-2649.',
  };

  return fallbacks[intent.category] || fallbacks.general;
}

/**
 * Determine if we should offer a full support page
 */
function shouldOfferFullPage(intent: SupportIntent, relevantContent: string[]): boolean {
  // Complex issues always get a full page offer
  if (intent.isComplex) return true;

  // Categories that benefit from visual guides
  const visualCategories = ['assembly', 'troubleshooting', 'safety'];
  if (visualCategories.includes(intent.category)) return true;

  // If we found substantial content, offer the full page
  if (relevantContent.length >= 3) return true;

  return false;
}

/**
 * Build URL for full support page
 */
function buildFullPageUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query);
  return `${POC_BASE_URL}/?q=${encodedQuery}&mode=support&preset=all-cerebras`;
}

/**
 * Generate related topics based on intent
 */
function generateRelatedTopics(intent: SupportIntent, query: string): string[] {
  const topicsByCategory: Record<string, string[]> = {
    cleaning: ['Deep cleaning tips', 'Remove stubborn residue', 'Container care'],
    troubleshooting: ['Common error codes', 'Motor issues', 'Container seal problems'],
    warranty: ['Warranty registration', 'Repair process', 'Replacement parts'],
    assembly: ['Container setup', 'Blade installation', 'Self-Detect containers'],
    recipes: ['Smoothie basics', 'Hot soup programs', 'Nut butter tips'],
    safety: ['Safe blending temps', 'Tamper usage', 'Lid safety'],
    operation: ['Variable speed tips', 'Program settings', 'Processing techniques'],
    general: ['Vitamix care guide', 'Product registration', 'Contact support'],
  };

  const topics = topicsByCategory[intent.category] || topicsByCategory.general;
  return topics.slice(0, 3);
}
