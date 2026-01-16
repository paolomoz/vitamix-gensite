/**
 * Signal Interpreter - Direct LLM-based signal interpretation
 *
 * Replaces rule-based profile engine for understanding user intent.
 * Sends raw browsing signals directly to LLM for holistic interpretation.
 *
 * Benefits over rule-based approach:
 * - Flexibility: Understands "kids recipes" without explicit rule
 * - Specificity: Captures nuances ("hiding vegetables from picky toddler")
 * - Zero maintenance: No rules to update for new use cases
 * - Contextual: Combines signals intelligently
 */

import type {
  Env,
  ExtensionSignal,
  ExtensionContext,
  IntentClassification,
  SignalInterpretation,
} from '../types';
import { createModelFactory, type Message } from '../ai-clients/model-factory';

// Re-export SignalInterpretation for convenience
export type { SignalInterpretation } from '../types';

// ============================================
// Prompts
// ============================================

/**
 * Direct Signal Interpretation Prompt
 *
 * Instead of mapping signals to predefined categories via rules,
 * we let the LLM interpret the full signal stream holistically.
 */
const SIGNAL_INTERPRETATION_PROMPT = `You are analyzing a user's browsing behavior on Vitamix.com to understand their intent.

## Your Task
Interpret the browsing signals to understand:
1. What is this person trying to accomplish?
2. What specific needs or concerns do they have?
3. Where are they in their decision journey?
4. What would be most helpful to show them?

## Signal Format (Compact JSON)
You'll receive signals in this format:
{
  "searches": ["query1", "query2"],           // HIGHEST PRIORITY - explicit intent
  "ref": "google:\\"search terms\\"",          // How they arrived (referrer + search query)
  "journey": [                                // Chronological actions
    {"t": 0, "a": "page", "d": "Home"},       // t=seconds, a=action, d=description
    {"t": 5, "a": "click", "d": "Recipes"},
    {"t": 8, "a": "page", "d": "Recipe Center", "c": "recipe"},  // c=category when significant
    {"t": 15, "a": "click", "d": "A3500", "p": "A3500"}          // p=product when applicable
  ],
  "products": ["A3500", "E310"],              // Products they've viewed
  "scrolls": {"/recipes": 100, "/a3500": 50}, // Max scroll depth per page
  "timeSpent": {"/a3500": 120}                // Seconds spent (when significant)
}

Action types: page, click, video, video_done

## Key Interpretation Guidelines
- SEARCH QUERIES reveal explicit intent - prioritize these
- Journey sequence shows browsing patterns (e.g., multiple product pages = comparison shopping)
- High scroll depth + time spent = strong interest
- "ref" with search query shows what brought them to the site
- Categories (c field): recipe, product, compare, support, etc.

## Common Patterns
- "kids", "children", "family", "picky eater" → Family-focused, may want to hide vegetables
- "baby", "infant", "toddler", "puree" → New parent, needs baby food guidance
- "gift", "wedding", "registry" → Buying for someone else
- Multiple products in journey → Comparison shopping
- Compare pages or "vs" searches → Active comparison
- Financing/reconditioned pages → Price-sensitive

## Output Format (JSON only)
{
  "interpretation": {
    "primaryIntent": "What they're trying to do (be specific)",
    "specificNeeds": ["Specific needs/concerns from signals"],
    "emotionalContext": "What they might be feeling",
    "journeyStage": "exploring | comparing | deciding",
    "keyInsights": ["Important observations"]
  },
  "classification": {
    "intentType": "discovery|comparison|product-detail|use-case|specs|reviews|price|recommendation|support|gift|medical|accessibility|partnership",
    "confidence": 0.0-1.0,
    "entities": {
      "products": ["products they're interested in"],
      "useCases": ["e.g. 'smoothies', 'soups', 'kids_recipes', 'baby_food'"],
      "features": ["features they care about"],
      "priceRange": "budget|mid|premium|null"
    },
    "journeyStage": "exploring|comparing|deciding"
  },
  "contentRecommendation": {
    "heroTone": "How should the hero speak to them?",
    "prioritizeBlocks": ["Block types most helpful"],
    "avoidBlocks": ["Irrelevant blocks"],
    "specialGuidance": "Content guidance based on signals"
  }
}`;

// ============================================
// Helper Functions
// ============================================

/**
 * Signal type abbreviations for compact format
 */
const TYPE_ABBREV: Record<string, string> = {
  page_view: 'page',
  click: 'click',
  search: 'search',
  scroll: 'scroll',
  referrer: 'ref',
  time_on_page: 'time',
  video_play: 'video',
  video_complete: 'video_done',
};

/**
 * Extract the essential descriptive content from a signal
 * Returns only what's needed to understand the action
 */
function extractEssence(signal: ExtensionSignal): string {
  const data = signal.data as Record<string, unknown> | undefined;

  switch (signal.type) {
    case 'search':
      return String(data?.query || '');

    case 'page_view': {
      // Prefer h1, fall back to path
      const h1 = data?.h1 as string | undefined;
      const path = data?.path as string | undefined;
      const price = data?.price as string | undefined;
      let result = h1 || path || '';
      if (price) result += ` ($${price.replace(/[^0-9.]/g, '')})`;
      return result;
    }

    case 'click': {
      // Prefer meaningful text, fall back to imgAlt or category
      const text = data?.text as string | undefined;
      const imgAlt = data?.imgAlt as string | undefined;
      return text || imgAlt || signal.category || '';
    }

    case 'scroll':
      return `${data?.depth || 0}%`;

    case 'referrer': {
      const domain = data?.domain as string | undefined;
      const searchQuery = data?.searchQuery as string | undefined;
      return searchQuery ? `${domain}:"${searchQuery}"` : (domain || 'direct');
    }

    case 'time_on_page':
      return `${data?.seconds || 0}s`;

    case 'video_play':
    case 'video_complete':
      return String(data?.title || data?.src || 'video');

    default:
      return signal.label || signal.type;
  }
}

/**
 * Format signals as compact JSON for LLM interpretation
 * Optimized for token efficiency while preserving semantic meaning
 *
 * Output format:
 * {
 *   "searches": ["query1", "query2"],
 *   "ref": "google:\"blender for smoothies\"",
 *   "journey": [
 *     {"t": 0, "a": "page", "d": "Home", "p": null},
 *     {"t": 5, "a": "click", "d": "Recipes", "p": null},
 *     {"t": 8, "a": "page", "d": "Recipe Center", "p": null, "c": "recipe"}
 *   ],
 *   "products": ["A3500", "E310"],
 *   "scrolls": {"Recipe Center": 100, "A3500": 50},
 *   "timeSpent": {"A3500": 120}
 * }
 */
function formatSignalsForInterpretation(signals: ExtensionSignal[]): string {
  if (signals.length === 0) {
    return JSON.stringify({ journey: [], products: [] });
  }

  // Sort by timestamp (oldest first for journey narrative)
  const sorted = [...signals].sort((a, b) => a.timestamp - b.timestamp);
  const startTime = sorted[0].timestamp;

  // Extract searches (highest priority - shown separately)
  const searches = sorted
    .filter(s => s.type === 'search')
    .map(s => (s.data as Record<string, unknown>)?.query as string)
    .filter(Boolean);

  // Extract referrer
  const referrer = sorted.find(s => s.type === 'referrer');
  const refStr = referrer ? extractEssence(referrer) : null;

  // Build journey array (exclude searches, referrers, and aggregate scrolls/time)
  const scrollsByPage: Record<string, number> = {};
  const timeByPage: Record<string, number> = {};

  const journey = sorted
    .filter(s => !['search', 'referrer', 'scroll', 'time_on_page'].includes(s.type))
    .map(s => {
      const entry: Record<string, unknown> = {
        t: Math.round((s.timestamp - startTime) / 1000), // seconds since start
        a: TYPE_ABBREV[s.type] || s.type,
        d: extractEssence(s),
      };

      // Add product if present
      if (s.product) {
        entry.p = s.product;
      }

      // Add category for high-weight signals
      if (s.weight >= 0.15 && s.category && s.category !== s.type) {
        entry.c = s.category;
      }

      return entry;
    });

  // Aggregate scroll depths by page
  sorted
    .filter(s => s.type === 'scroll')
    .forEach(s => {
      const data = s.data as Record<string, unknown>;
      const path = (data?.page as Record<string, unknown>)?.path as string || 'unknown';
      const depth = (data?.depth as number) || 0;
      if (!scrollsByPage[path] || depth > scrollsByPage[path]) {
        scrollsByPage[path] = depth;
      }
    });

  // Aggregate time on page
  sorted
    .filter(s => s.type === 'time_on_page')
    .forEach(s => {
      const data = s.data as Record<string, unknown>;
      const path = (data?.page as Record<string, unknown>)?.path as string || 'unknown';
      const seconds = (data?.seconds as number) || 0;
      if (!timeByPage[path] || seconds > timeByPage[path]) {
        timeByPage[path] = seconds;
      }
    });

  // Extract unique products
  const products = [...new Set(
    sorted
      .filter(s => s.product)
      .map(s => s.product as string)
  )];

  // Build compact output object
  const output: Record<string, unknown> = {};

  if (searches.length > 0) {
    output.searches = searches;
  }

  if (refStr && refStr !== 'direct') {
    output.ref = refStr;
  }

  output.journey = journey;

  if (products.length > 0) {
    output.products = products;
  }

  if (Object.keys(scrollsByPage).length > 0) {
    output.scrolls = scrollsByPage;
  }

  if (Object.keys(timeByPage).length > 0) {
    output.timeSpent = timeByPage;
  }

  return JSON.stringify(output);
}

/**
 * Build products considered summary from signals
 */
function extractProductsFromSignals(signals: ExtensionSignal[]): string[] {
  const products = new Set<string>();

  for (const signal of signals) {
    if (signal.product) {
      products.add(signal.product);
    }
    // Also check page data for product names
    if (signal.category === 'product' && signal.data?.h1) {
      const name = String(signal.data.h1).replace(/®|™/g, '').trim().split(' - ')[0].trim();
      if (name) products.add(name);
    }
  }

  return Array.from(products).slice(0, 10);
}

// ============================================
// Main Interpretation Function
// ============================================

/**
 * Interpret signals directly via LLM
 * This replaces the rule-based profile engine for understanding intent
 */
export async function interpretSignals(
  context: ExtensionContext,
  env: Env,
  preset?: string
): Promise<SignalInterpretation> {
  const modelFactory = createModelFactory(env, preset);

  // Format signals as compact JSON
  const signalsJson = formatSignalsForInterpretation(context.signals);

  // Extract products from signals for context (already in the JSON, but needed for fallback)
  const productsConsidered = extractProductsFromSignals(context.signals);

  // Build additional context as compact additions to the signal object
  const additionalContext: Record<string, unknown> = {};

  // Include conversation history if available
  if (context.previousQueries.length > 0) {
    additionalContext.previousQueries = context.previousQueries;
  }

  // Include explicit query if present (highest priority)
  if (context.query) {
    additionalContext.currentQuery = context.query;
  }

  // Include profile hints if useful
  if (context.profile.segments.length > 0 || context.profile.use_cases.length > 0) {
    additionalContext.profileHints = {
      segments: context.profile.segments,
      useCases: context.profile.use_cases,
    };
  }

  // Merge additional context into signals JSON
  let fullContext: string;
  if (Object.keys(additionalContext).length > 0) {
    const signalsObj = JSON.parse(signalsJson);
    Object.assign(signalsObj, additionalContext);
    fullContext = JSON.stringify(signalsObj);
  } else {
    fullContext = signalsJson;
  }

  console.log('[SignalInterpreter] Interpreting signals for context:', {
    signalCount: context.signals.length,
    query: context.query,
    previousQueries: context.previousQueries.length,
    productsConsidered: productsConsidered.length,
  });

  const messages: Message[] = [
    { role: 'system', content: SIGNAL_INTERPRETATION_PROMPT },
    { role: 'user', content: fullContext },
  ];

  try {
    // Use reasoning model for interpretation (more capable)
    const response = await modelFactory.call('reasoning', messages, env);

    // Extract JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as SignalInterpretation;

      // Merge products from signals into classification entities
      if (productsConsidered.length > 0 && (!parsed.classification.entities.products || parsed.classification.entities.products.length === 0)) {
        parsed.classification.entities.products = productsConsidered;
      }

      console.log('[SignalInterpreter] Interpretation result:', {
        primaryIntent: parsed.interpretation.primaryIntent,
        emotionalContext: parsed.interpretation.emotionalContext,
        journeyStage: parsed.interpretation.journeyStage,
        useCases: parsed.classification.entities.useCases,
      });

      return parsed;
    }

    console.warn('[SignalInterpreter] Could not parse JSON from response');
  } catch (error) {
    console.error('[SignalInterpreter] Error interpreting signals:', error);
  }

  // Fallback interpretation based on basic signal analysis
  return buildFallbackInterpretation(context, productsConsidered);
}

/**
 * Build a fallback interpretation when LLM fails
 * Uses basic heuristics similar to the old profile engine
 */
function buildFallbackInterpretation(
  context: ExtensionContext,
  productsConsidered: string[]
): SignalInterpretation {
  const signals = context.signals;

  // Extract search queries
  const searchQueries = signals
    .filter(s => s.type === 'search' && s.data?.query)
    .map(s => String(s.data?.query || '').toLowerCase());

  // Basic intent detection from queries
  let primaryIntent = 'Find the right Vitamix blender';
  let emotionalContext = 'curious shopper';
  const useCases: string[] = [];
  const specificNeeds: string[] = [];

  // Check for common patterns
  if (searchQueries.some(q => q.includes('kid') || q.includes('child') || q.includes('family') || q.includes('picky'))) {
    primaryIntent = 'Find family-friendly recipes and blender options';
    emotionalContext = 'parent looking for solutions';
    useCases.push('kids_recipes', 'family_meals');
    specificNeeds.push('Kid-friendly recipes', 'Ways to make healthy food appealing to children');
  } else if (searchQueries.some(q => q.includes('baby') || q.includes('puree') || q.includes('infant'))) {
    primaryIntent = 'Make homemade baby food';
    emotionalContext = 'caring new parent';
    useCases.push('baby_food', 'purees');
    specificNeeds.push('Baby food preparation', 'Safe puree textures');
  } else if (searchQueries.some(q => q.includes('smoothie'))) {
    primaryIntent = 'Make great smoothies';
    useCases.push('smoothies');
  } else if (searchQueries.some(q => q.includes('soup'))) {
    primaryIntent = 'Make hot soups';
    useCases.push('soups', 'hot_blending');
  } else if (searchQueries.some(q => q.includes('gift') || q.includes('wedding'))) {
    primaryIntent = 'Find the perfect Vitamix as a gift';
    emotionalContext = 'thoughtful gift-giver';
    useCases.push('gift');
  }

  // Determine journey stage
  let journeyStage: 'exploring' | 'comparing' | 'deciding' = 'exploring';
  if (productsConsidered.length >= 2 || signals.some(s => s.category === 'compare')) {
    journeyStage = 'comparing';
  }
  if (signals.some(s => s.category === 'add_to_cart' || s.category === 'shipping')) {
    journeyStage = 'deciding';
  }

  return {
    interpretation: {
      primaryIntent,
      specificNeeds,
      emotionalContext,
      journeyStage,
      keyInsights: [`Based on ${signals.length} browsing signals`],
    },
    classification: {
      intentType: productsConsidered.length >= 2 ? 'comparison' : 'discovery',
      confidence: 0.5,
      entities: {
        products: productsConsidered,
        useCases,
        features: [],
      },
      journeyStage,
    },
    contentRecommendation: {
      heroTone: 'welcoming and helpful',
      prioritizeBlocks: ['hero', 'product-cards'],
      avoidBlocks: [],
      specialGuidance: '',
    },
  };
}

/**
 * Quick interpretation for simple queries without full signal context
 * Used when there are few signals or explicit query is clear
 */
export async function interpretQuery(
  query: string,
  env: Env,
  preset?: string
): Promise<SignalInterpretation> {
  // Create a minimal context with just the query
  const context: ExtensionContext = {
    signals: [{
      id: 'query-signal',
      type: 'search',
      category: 'search',
      label: 'Search Query',
      weight: 0.20,
      weightLabel: 'VERY_HIGH',
      icon: '🔍',
      timestamp: Date.now(),
      data: { query },
    }],
    query,
    previousQueries: [],
    profile: {
      segments: [],
      life_stage: null,
      use_cases: [],
      products_considered: [],
      price_sensitivity: null,
      decision_style: null,
      purchase_readiness: null,
      shopping_for: null,
      occasion: null,
      brand_relationship: null,
      content_engagement: null,
      time_sensitive: null,
      confidence_score: 0,
      signals_count: 1,
      session_count: 1,
      first_visit: Date.now(),
      last_visit: Date.now(),
    },
    timestamp: Date.now(),
  };

  return interpretSignals(context, env, preset);
}
