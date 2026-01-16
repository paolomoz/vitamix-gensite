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
Interpret the raw browsing signals below to understand:
1. What is this person actually trying to accomplish?
2. What specific needs or concerns do they have?
3. Where are they in their decision journey?
4. What would be most helpful to show them?

## Signal Types You'll See
- **search**: User searched for something (query field contains their search)
- **page_view**: User viewed a page (h1, path, title describe the page)
- **click**: User clicked something (category indicates what type)
- **referrer**: How they arrived (domain, searchQuery if from search engine)
- **video_play/video_complete**: Video engagement
- **time_on_page**: How long they spent (indicates interest level)

## Important Guidelines
- Pay close attention to SEARCH QUERIES - they reveal explicit intent
- Look for patterns across signals (e.g., multiple product views = comparison shopping)
- Recent signals are more relevant than older ones
- High-weight signals (VERY_HIGH, HIGH) indicate stronger intent signals
- Don't just categorize - UNDERSTAND the human behind the signals
- Be specific: "find kid-friendly recipes to hide vegetables" not just "recipes"

## Common Patterns to Recognize
- "kids", "children", "family", "picky eater" → Family-focused, may want to hide vegetables
- "baby", "infant", "toddler", "puree" → New parent, needs baby food guidance
- "gift", "wedding", "registry" → Buying for someone else
- "upgrade", "vs", "compare", "replace" → Existing owner considering upgrade
- Multiple product pages → Comparison shopping
- Reviews + product pages → Thorough researcher
- Financing/reconditioned pages → Price-sensitive

## Output Format (JSON only, no markdown)
{
  "interpretation": {
    "primaryIntent": "What they're fundamentally trying to do (be specific)",
    "specificNeeds": ["List of specific needs/concerns extracted from signals"],
    "emotionalContext": "What might they be feeling? (e.g., 'frustrated parent', 'excited gift-giver')",
    "journeyStage": "exploring | comparing | deciding",
    "keyInsights": ["Important observations about this user"]
  },
  "classification": {
    "intentType": "discovery|comparison|product-detail|use-case|specs|reviews|price|recommendation|support|gift|medical|accessibility|partnership",
    "confidence": 0.0-1.0,
    "entities": {
      "products": ["products they're interested in"],
      "useCases": ["specific use cases like 'smoothies', 'soups', 'kids_recipes', 'hiding_vegetables', 'baby_food'"],
      "features": ["features they care about"],
      "priceRange": "budget|mid|premium|null"
    },
    "journeyStage": "exploring|comparing|deciding"
  },
  "contentRecommendation": {
    "heroTone": "How should the hero speak to them? (e.g., 'empathetic - acknowledge parenting challenge')",
    "prioritizeBlocks": ["Which block types would be most helpful"],
    "avoidBlocks": ["Which blocks would be irrelevant"],
    "specialGuidance": "Any specific content guidance based on their signals"
  }
}`;

// ============================================
// Helper Functions
// ============================================

/**
 * Format timestamp as relative time
 */
function formatTimestamp(ts: number): string {
  const ago = Date.now() - ts;
  if (ago < 60000) return '(just now)';
  if (ago < 3600000) return `(${Math.floor(ago / 60000)}m ago)`;
  if (ago < 86400000) return `(${Math.floor(ago / 3600000)}h ago)`;
  return `(${Math.floor(ago / 86400000)}d ago)`;
}

/**
 * Format signals for direct LLM interpretation
 * Unlike the old formatSignalsForPrompt, this preserves MORE context
 * and organizes signals by type for clarity
 */
function formatSignalsForInterpretation(signals: ExtensionSignal[]): string {
  if (signals.length === 0) {
    return 'No browsing signals captured yet.';
  }

  // Sort by timestamp (most recent first)
  const sorted = [...signals]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50); // Increased from 20 to 50 for better context

  const sections: string[] = [];

  // Group by signal type for clarity
  const searches = sorted.filter(s => s.type === 'search');
  const pageViews = sorted.filter(s => s.type === 'page_view');
  const clicks = sorted.filter(s => s.type === 'click');
  const referrers = sorted.filter(s => s.type === 'referrer');
  const videos = sorted.filter(s => s.type === 'video_play' || s.type === 'video_complete');
  const other = sorted.filter(s =>
    !['search', 'page_view', 'click', 'referrer', 'video_play', 'video_complete'].includes(s.type)
  );

  // Search queries are the most important - explicit intent
  if (searches.length > 0) {
    sections.push(`### Search Queries (HIGHEST PRIORITY - explicit intent)\n${searches.map(s =>
      `- "${s.data?.query || 'unknown'}" [${s.weightLabel}] ${formatTimestamp(s.timestamp)}`
    ).join('\n')}`);
  }

  // Referrers show how they arrived
  if (referrers.length > 0) {
    sections.push(`### How They Arrived\n${referrers.map(s => {
      const domain = s.data?.domain || 'direct';
      const searchQuery = s.data?.searchQuery ? ` (searched: "${s.data.searchQuery}")` : '';
      return `- From ${domain}${searchQuery} [${s.weightLabel}]`;
    }).join('\n')}`);
  }

  // Page views show browsing patterns
  if (pageViews.length > 0) {
    sections.push(`### Pages Viewed\n${pageViews.map(s => {
      const page = s.data?.h1 || s.data?.title || s.data?.path || 'unknown page';
      const product = s.product ? ` [Product: ${s.product}]` : '';
      const category = s.category ? ` (${s.category})` : '';
      return `- ${page}${product}${category} [${s.weightLabel}] ${formatTimestamp(s.timestamp)}`;
    }).join('\n')}`);
  }

  // Clicks show engagement
  if (clicks.length > 0) {
    sections.push(`### Clicks & Interactions\n${clicks.map(s => {
      const detail = s.data?.text || s.category || s.label || 'click';
      const product = s.product ? ` [Product: ${s.product}]` : '';
      return `- ${detail}${product} [${s.weightLabel}] ${formatTimestamp(s.timestamp)}`;
    }).join('\n')}`);
  }

  // Video engagement
  if (videos.length > 0) {
    sections.push(`### Video Engagement\n${videos.map(s => {
      const action = s.type === 'video_complete' ? 'Completed' : 'Started';
      const title = s.data?.title || 'video';
      return `- ${action}: ${title} [${s.weightLabel}]`;
    }).join('\n')}`);
  }

  // Other signals
  if (other.length > 0) {
    sections.push(`### Other Signals\n${other.map(s =>
      `- ${s.label}: ${s.type} [${s.weightLabel}]`
    ).join('\n')}`);
  }

  return sections.join('\n\n');
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

  // Format signals for interpretation
  const signalsText = formatSignalsForInterpretation(context.signals);

  // Extract products from signals for context
  const productsConsidered = extractProductsFromSignals(context.signals);
  const productsText = productsConsidered.length > 0
    ? `\n\n### Products They've Viewed\n${productsConsidered.map(p => `- ${p}`).join('\n')}`
    : '';

  // Include conversation history if available
  const historyText = context.previousQueries.length > 0
    ? `\n\n### Conversation History (previous questions in this session)\n${context.previousQueries.map((q, i) => `${i + 1}. "${q}"`).join('\n')}`
    : '';

  // Include explicit query if present
  const queryText = context.query
    ? `\n\n### Current Query (IMPORTANT - what they just asked)\nThe user just asked: "${context.query}"`
    : '';

  // Include profile hints from rule-based engine (as supplementary info, not primary)
  const profileHints = context.profile.segments.length > 0 || context.profile.use_cases.length > 0
    ? `\n\n### Profile Hints (from rule-based pre-processing, use as supplementary info)\nSegments: ${context.profile.segments.join(', ') || 'none'}\nUse Cases: ${context.profile.use_cases.join(', ') || 'none'}`
    : '';

  const fullContext = `## Browsing Signals (${context.signals.length} total)\n\n${signalsText}${productsText}${historyText}${queryText}${profileHints}`;

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
