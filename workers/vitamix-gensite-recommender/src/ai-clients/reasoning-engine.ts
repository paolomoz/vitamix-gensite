/**
 * Reasoning Engine - Claude Opus-powered intent analysis and block selection
 *
 * This module handles the high-level reasoning:
 * - Deep intent analysis
 * - User needs assessment
 * - Dynamic block selection with rationale
 * - User journey planning
 */

import type {
  Env,
  IntentClassification,
  SessionContext,
  ReasoningResult,
  ReasoningTrace,
  BlockSelection,
  BlockType,
  UserJourneyPlan,
  SignalInterpretation,
  ProductSelection,
  AdvisorFollowUp,
  StructuredSuggestion,
  ResearchGap,
} from '../types';
import type { RAGContext } from '../content/content-service';
import { buildCompactProductCatalog } from '../content/content-service';
import { ModelFactory, type Message } from './model-factory';
import {
  evaluateRules,
  buildBlockList,
  formatContentGuidance,
  type MergedBlockRequirements,
} from './block-rules';

// ============================================
// Confidence Thresholds
// ============================================

/**
 * Confidence thresholds for product recommendation blocks.
 *
 * These thresholds ensure that low-confidence scenarios don't make specific
 * product recommendations. Instead, they default to comparison or discovery modes.
 *
 * Rationale:
 * - A page visit alone (e.g., viewing E320) shouldn't recommend that product
 * - Search queries like "kids recipes" need stronger signals to recommend specific models
 * - The system should show options, not push products, when uncertain
 */
const CONFIDENCE_THRESHOLDS = {
  /** >= 70%: Single product recommendation allowed (product-recommendation block) */
  SINGLE_RECOMMENDATION: 0.7,
  /** >= 50%: Best pick with comparison allowed (best-pick + comparison-table) */
  BEST_PICK_WITH_COMPARISON: 0.5,
  /** >= 35%: Comparison only, no "best" labels (comparison-table, product-cards) */
  COMPARISON_ONLY: 0.35,
  /** < 35%: Discovery mode - use-case-cards, feature-highlights, no recommendations */
};

// ============================================
// Reasoning System Prompt
// ============================================

const REASONING_SYSTEM_PROMPT = `You are the reasoning engine for a Vitamix Blender Recommender.

Your role is to:
1. Deeply analyze user intent and needs
2. Plan an optimal user journey
3. Select which content blocks best serve the user
4. Explain your thinking transparently

CRITICAL - Your reasoning will be shown directly to users. Write like you're talking to them:
- Use "you" and "your" - speak directly to them
- Keep it SHORT: each reasoning field must be under 50 words
- Be warm, friendly, and conversational - like a helpful friend
- NO technical jargon, NO bullet points, NO numbered lists
- Focus on understanding and helping, not analyzing
- Example tone: "You're looking for a blender that can handle your morning smoothies. I've got you covered!"

## Available Blocks

| Block | Purpose |
|-------|---------|
| hero | Full-width banner with headline and image - for landing/discovery |
| product-cards | Grid of 3-4 product cards - for browsing products |
| recipe-cards | Grid of 3-4 recipe cards - for inspiration |
| comparison-table | Side-by-side product comparison - for comparing models |
| specs-table | Technical specifications table - for detail-oriented users |
| product-recommendation | Featured product with full details - for final recommendation |
| feature-highlights | Key features showcase - for use-case exploration |
| use-case-cards | Use case selection grid - for discovery |
| testimonials | Customer reviews - for social proof |
| faq | Common questions - for support |
| follow-up | Suggestion chips for next actions (always include at end) |
| quick-answer | Simple direct answer - for yes/no questions or quick confirmations |
| support-triage | Help frustrated customers - for product issues/warranty |
| budget-breakdown | Price/value transparency - for budget-conscious users |
| accessibility-specs | Physical/ergonomic specs - for mobility/accessibility concerns |
| empathy-hero | Warm, acknowledging hero - for medical/emotional situations |
| sustainability-info | Environmental responsibility - for eco-conscious buyers |
| smart-features | Connected/app capabilities - for tech-forward users |
| engineering-specs | Deep technical data - for engineers/spec-focused buyers |
| noise-context | Real-world noise comparisons - for noise-sensitive users |
| allergen-safety | Cross-contamination protocols - for allergy-concerned users |
| best-pick | Prominent "Best Pick" callout with visual emphasis - ALWAYS use before comparison-table |
| technique-spotlight | Pro blending techniques with speed/time guidance - for operation/settings questions |
| troubleshooting-steps | Step-by-step problem resolution - for fixing issues (distinct from support-triage) |

## Block Selection Guidelines

1. NEVER include 'reasoning' or 'reasoning-user' blocks - they are not displayed
2. ALWAYS include 'follow-up' block at the end
3. NEVER place 'hero', 'product-recommendation', or 'best-pick' blocks consecutively - they use similar dark visual styling and must be separated by other content blocks
4. Match blocks to user journey stage:
   - Exploring: hero, use-case-cards, feature-highlights, follow-up
   - Comparing: hero, comparison-table, product-cards, follow-up
   - Deciding: product-recommendation, recipe-cards, follow-up

## SPECIAL HANDLING RULES (CRITICAL - Follow These First!)

### 1. Support/Frustrated Customer Detection
Keywords: "problem", "broken", "frustrated", "warranty", "return", "issue", "not working", "third container"
- ALWAYS lead with support-triage block
- NEVER show product recommendations to frustrated customers
- Prioritize empathy and resolution over sales
- Block sequence: support-triage, faq, follow-up

### 2. Simple Yes/No or Quick Questions
Keywords: "can vitamix", "will it", "does it", "is it worth", "should I", "can I"
- Lead with quick-answer block for direct confirmation
- Use for questions that can be answered simply
- Block sequence: quick-answer, follow-up (add product-recommendation if they need details)

### 3. Medical/Accessibility Queries
Keywords: "arthritis", "disability", "dysphagia", "stroke", "mobility", "grip", "heavy", "aging"
- Lead with empathy-hero to acknowledge their situation
- Include accessibility-specs for physical considerations
- Block sequence: empathy-hero, accessibility-specs, product-recommendation, follow-up

### 4. Budget-Conscious Users
Keywords: "budget", "afford", "cheap", "worth it", "broke", "student", "expensive"
- Include budget-breakdown block prominently
- Be honest about alternatives
- Block sequence: hero, budget-breakdown, product-cards, follow-up

### 5. Gift Queries
Keywords: "gift", "for my", "birthday", "wedding", "christmas", "present"
- Focus on recipient's needs, not the buyer's expertise
- Offer "safe bet" recommendations with NEW products only
- CRITICAL: NEVER recommend "Certified Reconditioned" or "Refurbished" products for gifts
  - Reconditioned products are inappropriate for gift-giving - nobody wants to give a used item as a gift
  - Always recommend brand-new products with full warranties
  - If comparing products, exclude all reconditioned variants from comparison
- Surface gift card option as fallback
- Emphasize premium presentation, warranty length, and return policy
- Block sequence: hero, best-pick, product-cards, follow-up

### 5b. Family with Picky Eaters / Kids Queries
Keywords: "picky eater", "picky eaters", "kids", "children", "family of", "son", "daughter", "doesn't like veggies", "won't eat vegetables", "hiding vegetables", "sneak vegetables"
- Lead with empathetic hero acknowledging the parenting challenge
- EMPHASIZE soup-making capabilities as a solution for hiding vegetables
- Highlight that soups can sneak in nutrition without kids noticing
- Include smoothie-making for kids who love them
- Focus on self-cleaning and quick prep for busy parents
- Block sequence: hero (family-focused), feature-highlights (soup + smoothie capabilities), recipe-cards (kid-friendly soups AND smoothies), product-recommendation, follow-up
- Content guidance should mention: "Your Vitamix can make creamy, delicious soups that hide vegetables in plain sight - even green ones! Kids love the smooth texture and won't detect the hidden nutrition."

### 6. Commercial/B2B Queries
Keywords: "restaurant", "business", "commercial", "bulk", "b2b", "professional kitchen"
- Focus on durability, warranty, volume
- Mention commercial support contact
- Block sequence: hero, specs-table, comparison-table, follow-up

### 7. Sustainability/Eco-Conscious Queries
Keywords: "eco", "sustainable", "environment", "green", "waste", "landfill", "plastic", "carbon"
- Include sustainability-info block prominently
- Focus on longevity and repairability as eco-benefits
- Block sequence: hero, sustainability-info, product-recommendation, follow-up

### 8. Noise-Sensitive Users
Keywords: "noise", "quiet", "loud", "apartment", "roommate", "neighbors", "dB", "decibel"
- Include noise-context block with real-world comparisons
- Be honest about limitations - blenders are loud
- Block sequence: hero, noise-context, product-cards, follow-up

### 9. Allergy/Cross-Contamination Concerns
Keywords: "allergy", "allergen", "cross-contamination", "peanut", "gluten", "celiac", "anaphylaxis"
- Include allergen-safety block with cleaning protocols
- Emphasize dedicated container strategy
- Block sequence: hero, allergen-safety, product-recommendation, follow-up

### 10. Smart Home/Tech Integration Queries
Keywords: "app", "wifi", "connected", "smart", "alexa", "voice", "bluetooth", "smart home"
- Include smart-features block with honest assessment
- Be transparent about limitations
- Block sequence: hero, smart-features, comparison-table, follow-up

### 11. Engineering/Deep Specs Queries
Keywords: "wattage", "rpm", "motor", "specs", "specifications", "technical", "engineer"
- Include engineering-specs block - no marketing fluff
- Focus on raw data and measurements
- Block sequence: hero, engineering-specs, comparison-table, follow-up

### 12. Competitor Comparison Queries
Keywords: "blendtec", "ninja", "nutribullet", "kitchenaid", "cuisinart", "breville"
- IMPORTANT: We only have Vitamix data - cannot make direct competitor comparisons
- Acknowledge the competitor honestly in the response
- Focus on Vitamix strengths without false claims about competitors
- Suggest user research competitors separately for fair comparison
- Never fabricate competitor specs or make up comparison data
- Block sequence: hero, feature-highlights (Vitamix strengths), product-recommendation, follow-up

### 13. Vitamix Model Comparison Queries (CRITICAL)
Detection: Query or URL contains:
- "vs" or "versus" with Vitamix model names (e.g., "X5 vs X4", "A3500 vs A2500")
- Multiple Vitamix model identifiers (X5, X4, X3, A3500, A2500, E310, etc.)
- "compare", "difference between", "which is better" with Vitamix models

WHEN COMPARISON IS DETECTED:
- ALWAYS include best-pick block BEFORE comparison-table
- ALWAYS include comparison-table block
- The best-pick should highlight the recommended model based on user's use case
- Block sequence: hero, best-pick, comparison-table, product-cards, follow-up

IMPORTANT for soup/hot food queries during comparison:
- The best-pick MUST be a product with Hot Soup Program (A3500, A2500, Propel 750, Ascent X3/X4/X5)
- Add "Hot Soup Program" row to comparison table
- Clearly indicate which models have this feature

### 14. Recipe/Soup/Cooking Queries (CRITICAL)
Keywords: "recipe", "recipes", "soup", "soups", "hot soup", "make a", "cook", "prepare", "meal ideas", "what can I make", "show me more"
Detection: Query asks for recipes, cooking ideas, or specific food items to make
- ALWAYS include recipe-cards block to show relevant recipes from the Vitamix recipe database
- Lead with hero acknowledging their cooking interest and Vitamix capabilities
- For soup-specific queries, emphasize hot-blending and friction-heat technology in hero
- Can optionally include feature-highlights about cooking capabilities if user seems new
- Block sequence: hero (cooking-focused), recipe-cards, follow-up
- Content guidance: Focus on inspiring them with what they can create, not on selling products

IMPORTANT: This rule takes priority over generic discovery/comparison flows when recipe keywords are present.

### 15. Cleaning & Maintenance Queries
Keywords: "clean", "wash", "maintenance", "care", "residue", "stain", "self-clean", "dishwasher", "sanitize"
Detection: Query asks about cleaning, maintaining, or caring for the blender
- Lead with troubleshooting-steps block showing step-by-step cleaning instructions
- Include faq for common cleaning questions
- DO NOT show product recommendations - they already own a blender
- Block sequence: hero, troubleshooting-steps, faq, follow-up
- Content guidance: Practical, step-by-step. Mention self-cleaning (drop of soap + warm water + 60 seconds on high).

### 16. Troubleshooting & Problem Resolution
Keywords: "fix", "error", "burning", "smell", "won't", "doesn't", "troubleshoot", "stuck", "jammed", "overheating", "not blending", "stopped working"
Detection: Query asks HOW TO FIX a problem (distinct from support-triage which handles warranty/returns)
- Lead with troubleshooting-steps showing the fix
- Include faq for related questions
- DO NOT show product recommendations - focus on solving their problem
- Block sequence: hero (reassuring), troubleshooting-steps, faq, follow-up
- Content guidance: Reassure them most issues are easily fixed. Lead with the most common solution.

NOTE: Troubleshooting is for "how do I fix X?" questions. Support-triage is for frustrated customers seeking warranty help or returns.

### 17. Technique & Operation Settings Queries
Keywords: "how do I", "technique", "tips", "settings", "speed", "proper way", "best way", "method", "layer", "tamper", "program", "time", "minutes"
Detection: Query asks for operational guidance, technique tips, or recommended settings
- Lead with technique-spotlight block showing visual techniques with speed/time guidance
- Include faq for related operational questions
- Can include recipe-cards if the technique is food-specific (e.g., "settings for making baby food")
- Block sequence: hero, technique-spotlight, faq, recipe-cards (optional), follow-up
- Content guidance: Specific and actionable. Include exact speeds, times, and pro tips.

## Product Selection (CRITICAL)

You MUST select products from the catalog provided below. Do NOT rely on pre-filtered products.

### Commercial vs Consumer Decision Tree

| User Context Signals | Product Selection |
|---------------------|-------------------|
| "bar", "cocktail bar", "juice bar", "smoothie bar" | Commercial products (Drink Machine Advance, The Quiet One, Vita-Prep) |
| "restaurant", "cafe", "hotel", "catering", "food service" | Commercial products |
| "for my business", "high volume", "professional kitchen" | Commercial products |
| "home", "family", "personal", "kitchen", "apartment" | Consumer products (Ascent, Explorian, Venturist) |
| Ambiguous (no clear home/commercial signal) | Include BOTH or ask clarifying question |

### Selection Rules

1. **Always select 3-5 products** that best match the user's context
2. **Mark ONE product as isPrimary=true** - your top recommendation
3. **Provide rationale** for each selection explaining why it fits
4. **Set contextType** to 'commercial', 'consumer', or 'either'
5. **NEVER filter out commercial products for queries mentioning bars, restaurants, or businesses**

### Product Catalog Reference
The full product catalog will be provided in the prompt. Use product IDs exactly as shown.

## Output Format

Respond with valid JSON only:
{
  "selectedBlocks": [
    {
      "type": "hero",
      "variant": "discovery",
      "priority": 1,
      "rationale": "User is exploring options...",
      "contentGuidance": "Focus on empowering headline about possibilities..."
    }
  ],
  "selectedProducts": [
    {
      "id": "drink-machine-advance",
      "rationale": "Commercial bar needs high-volume frozen drink capability",
      "isPrimary": true,
      "contextType": "commercial"
    },
    {
      "id": "the-quiet-one",
      "rationale": "Alternative for noise-sensitive bar environments",
      "isPrimary": false,
      "contextType": "commercial"
    }
  ],
  "productSelectionRationale": "User mentioned 'cocktail bar' indicating commercial use. Selected commercial-grade blenders designed for bar environments.",
  "reasoning": {
    "intentAnalysis": "You're looking for... (UNDER 50 WORDS, speak directly to user with 'you')",
    "userNeedsAssessment": "What matters most to you is... (UNDER 50 WORDS, warm and understanding)",
    "blockSelectionRationale": [
      { "blockType": "hero", "reason": "...", "contentFocus": "..." }
    ],
    "alternativesConsidered": ["..."],
    "finalDecision": "Here's my plan for you... (UNDER 50 WORDS, helpful and confident)"
  },
  "userJourney": {
    "currentStage": "exploring",
    "nextBestAction": "explore_use_cases",
    "suggestedFollowUps": ["What can I make with a Vitamix?", "Compare top models"],
    "advisorFollowUp": {
      "journeyStage": "exploring",
      "suggestions": [
        {
          "query": "Compare A3500 vs X5 for soups",
          "headline": "Let me help you narrow it down",
          "rationale": "You've been comparing the A3500 and X5. Based on your soup focus, let me show you the $200 price difference and what you get.",
          "category": "go-deeper",
          "priority": 1,
          "confidence": 0.85,
          "whyBullets": ["You've viewed both models", "Both match your soup use-case", "Price comparison not yet shown"]
        },
        {
          "query": "Vitamix soup recipes for beginners",
          "headline": "See soup recipes",
          "rationale": "Know what you'll actually make with it.",
          "category": "explore-more",
          "priority": 2,
          "confidence": 0.75,
          "whyBullets": ["Recipes help visualize ownership"]
        }
      ],
      "gaps": [
        {
          "type": "warranty",
          "query": "Vitamix warranty coverage details",
          "label": "Warranty Coverage",
          "explanation": "Vitamix has industry-leading 10-year warranty — worth knowing."
        }
      ]
    }
  },
  "confidence": {
    "intent": 0.92,
    "productMatch": 0.45,
    "productMatchRationale": "Brief explanation of why product match is high or low"
  }
}

## CRITICAL: Dual Confidence Scores

You must provide TWO separate confidence scores:

1. **intent** (0.0-1.0): How confident are you that you understand what the user wants?
   - HIGH (0.8+): Clear, specific request ("quietest blender", "best for soups", "X4 vs X5")
   - MEDIUM (0.5-0.8): General but understandable ("kids recipes", "smoothies")
   - LOW (<0.5): Vague or ambiguous ("blender", "help me decide")

2. **productMatch** (0.0-1.0): How confident are you that ONE specific product is clearly best?
   - HIGH (0.8+): One product is objectively best for their stated need
     Examples: "quietest" → Vitamix ONE, "under $350" → E320, "most programs" → X5
   - MEDIUM (0.5-0.8): A product stands out but others are close
     Examples: "soups" → X5 (but X4, A3500 also good), "families" → X5 (but X4 works too)
   - LOW (<0.5): Multiple products work equally well, no clear winner
     Examples: "kids recipes" → ANY blender works, "smoothies" → ALL models excel

**IMPORTANT**: A user can have HIGH intent confidence but LOW product match confidence.
"kids recipes" = HIGH intent (we know what they want) + LOW product match (any Vitamix works).

Only recommend a single product (product-recommendation block) when productMatch >= 0.8.
If productMatch < 0.8, prefer comparison-table or product-cards to show options.

## CRITICAL: Follow-up Suggestion Guidelines

suggestedFollowUps MUST:
1. Be contextually relevant to BOTH the current query AND products/content shown
2. Offer BOTH directions when appropriate:
   - NARROWING: "Tell me more about [specific product shown]", "Compare the top 2 options"
   - BROADENING: "What other use cases work for me?", "Show me budget alternatives"
3. Be phrased as natural questions or prompts users would actually ask
4. NEVER include purchase-intent language:
   - NO: "Buy now", "Add to cart", "Shop now", "Purchase", "Checkout"
   - YES: "View details", "Learn more", "Explore options", "See full specs"

## CRITICAL: Advisor Follow-Up Structure (advisorFollowUp)

The advisorFollowUp provides rich, contextual suggestions that explain WHY they're relevant.
ALWAYS generate this structure with meaningful, personalized content.

### Suggestions Array (1 primary + up to 2 secondary)

**CRITICAL: The "query" field must be a NATURAL SEARCH QUERY** - something a user would actually type:
- GOOD queries: "Compare Vitamix X5 vs X4", "Vitamix X5 soup recipes", "quietest Vitamix blender"
- BAD queries: "View details for X5", "Learn more about X5", "See the comparison"
The query is sent to the search system, so it must be searchable text, NOT action descriptions.

**Primary suggestion (priority: 1)** - The MOST helpful next step:
- query: A natural search query the user would type (e.g., "Compare X5 vs X4 for soups")
- headline: Conversational, like advice from a friend ("Let me help you narrow it down")
- rationale: 2-3 sentences explaining WHY this helps based on their specific situation
- whyBullets: 2-4 data points that justify this suggestion (what they've seen, gaps, patterns)
- category: "go-deeper" (drill down), "explore-more" (broaden), or "fill-gap" (missing info)

**Secondary suggestions (priority: 2-3)** - Alternative paths:
- query: Natural search query (NOT action text like "View" or "See")
- Shorter rationale (1 sentence)
- 1-2 whyBullets
- Offer different directions than the primary

### Gaps Array - Research gaps based on session history

Analyze the blockTypes from previousQueries to detect what's missing:
- "recipes" gap: No recipe-cards shown yet → "What can I make with a Vitamix?"
- "reviews" gap: No testimonials shown yet → "What do real owners say?"
- "warranty" gap: Not discussed yet → "What's the warranty coverage?"
- "accessories" gap: No accessory info → "What accessories expand capabilities?"
- "specs" gap: No specs-table shown → "See detailed specifications"
- "comparisons" gap: No comparison-table yet → "Compare models side by side"

Only include gaps that are RELEVANT to their journey stage:
- exploring: All gaps valid
- comparing: Focus on specs, reviews, comparisons
- deciding: Focus on warranty, accessories, reviews

### Journey Stage Logic

Set journeyStage based on:
- "exploring": First 1-2 queries, broad questions, no specific products
- "comparing": User has seen 2+ products, asking "vs" or "which", comparing features
- "deciding": User focused on 1 product, asking about warranty, price, reviews

## CRITICAL: "Back to..." Session Reference Rules

ONLY include a "Back to [previous topic]" suggestion when ALL these conditions are met:
1. The previous topic is SEMANTICALLY RELATED to the current query
2. The user might genuinely want to return to that context

SEMANTIC RELEVANCE EXAMPLES:
- Current: "soup recipes" + Previous: "hot soup capability" → YES, related
- Current: "soup recipes" + Previous: "A3500 vs A2500" → NO, unrelated comparison
- Current: "green smoothie recipe" + Previous: "best blender for smoothies" → YES, related
- Current: "green smoothie recipe" + Previous: "my vitamix is leaking" → NEVER (support context)
- Current: "accessories" + Previous: "X5 comparison" → MAYBE, only if accessories are X5-related

NEVER reference session history when:
- Previous query was a SUPPORT issue (leaking, broken, warranty problem, return)
- Previous query topic has NO semantic connection to current query
- It would create a jarring or confusing user experience
- The previous topic was 3+ queries ago (stale context)

When in doubt, OMIT the "Back to..." suggestion and use a forward-looking discovery suggestion instead.

Example good follow-ups:
- "What makes the A3500 worth the extra cost?"
- "Show me recipes I can make with this blender"
- "Compare this with budget options"
- "Tell me about the warranty"

Example BAD follow-ups (never use):
- "Buy the A3500 now"
- "Add to cart"
- "Shop now"
- "Back to your leaking blender issue" (never reference support in shopping)
- "Back to comparing A3500 vs A2500" (when current query is about spinach recipes)`;

// ============================================
// Comparison Detection Helpers
// ============================================

/**
 * Detect if query is asking for a Vitamix model comparison
 */
function detectComparisonQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();

  // Check for explicit comparison keywords
  const comparisonKeywords = [
    /\bvs\b/,
    /\bversus\b/,
    /\bcompare\b/,
    /\bcomparison\b/,
    /\bdifference between\b/,
    /\bwhich is better\b/,
    /\bwhich one\b/,
    /\bshould i choose\b/,
    /\bshould i get\b/,
  ];

  const hasComparisonKeyword = comparisonKeywords.some((pattern) => pattern.test(lowerQuery));

  // Check for multiple Vitamix model identifiers
  const modelPatterns = [
    /\bx5\b/gi,
    /\bx4\b/gi,
    /\bx3\b/gi,
    /\bx2\b/gi,
    /\ba3500\b/gi,
    /\ba2500\b/gi,
    /\ba2300\b/gi,
    /\be310\b/gi,
    /\be320\b/gi,
    /\bpropel\b/gi,
    /\bpropel\s*750\b/gi,
    /\bpropel\s*510\b/gi,
    /\bexplorian\b/gi,
    /\bascent\b/gi,
    /\bv1200\b/gi,
    /\bventurist\b/gi,
    /\b5200\b/gi,
    /\bvitamix\s*one\b/gi,
    /\bs55\b/gi,
    /\bs50\b/gi,
  ];

  const modelMatches = modelPatterns.filter((pattern) => pattern.test(lowerQuery));
  const hasMultipleModels = modelMatches.length >= 2;

  return hasComparisonKeyword || hasMultipleModels;
}

/**
 * Extract comparison details from query for context
 */
function getComparisonDetails(query: string): string {
  const lowerQuery = query.toLowerCase();

  const modelMatches: string[] = [];
  const modelPatterns: [RegExp, string][] = [
    [/\bx5\b/gi, 'Ascent X5'],
    [/\bx4\b/gi, 'Ascent X4'],
    [/\bx3\b/gi, 'Ascent X3'],
    [/\bx2\b/gi, 'Ascent X2'],
    [/\ba3500\b/gi, 'A3500'],
    [/\ba2500\b/gi, 'A2500'],
    [/\ba2300\b/gi, 'A2300'],
    [/\be310\b/gi, 'E310'],
    [/\be320\b/gi, 'E320'],
    [/\bpropel\s*750\b/gi, 'Propel 750'],
    [/\bpropel\s*510\b/gi, 'Propel 510'],
    [/\bv1200\b/gi, 'V1200'],
    [/\bventurist\b/gi, 'Venturist'],
    [/\b5200\b/gi, '5200'],
    [/\bvitamix\s*one\b/gi, 'Vitamix ONE'],
    [/\bs55\b/gi, 'S55'],
    [/\bs50\b/gi, 'S50'],
  ];

  for (const [pattern, name] of modelPatterns) {
    if (pattern.test(lowerQuery)) {
      modelMatches.push(name);
    }
  }

  if (modelMatches.length > 0) {
    return `Models mentioned: ${modelMatches.join(' vs ')}`;
  }

  return 'General comparison request';
}

// ============================================
// Reasoning Engine Functions
// ============================================

/**
 * Build the reasoning prompt with context
 */
function buildReasoningPrompt(
  query: string,
  intent: IntentClassification,
  ragContext: RAGContext,
  sessionContext?: SessionContext,
  signalInterpretation?: SignalInterpretation,
  blockRequirements?: MergedBlockRequirements
): string {
  // Build compact product catalog for LLM product selection
  const compactCatalog = buildCompactProductCatalog();
  const catalogSection = compactCatalog
    .map(p => `- ${p.id}: ${p.name} (${p.series}) | $${p.price || 'N/A'} | ${p.isCommercial ? 'COMMERCIAL' : 'Consumer'} | Best for: ${p.bestFor.join(', ') || 'general use'}`)
    .join('\n');

  const productContext = ragContext.relevantProducts
    .slice(0, 5)
    .map((p) => `- ${p.name} (${p.series}): $${p.price} - ${p.tagline || (p.description?.slice(0, 100) ?? '')}`)
    .join('\n');

  const recipeContext = ragContext.relevantRecipes
    .slice(0, 3)
    .map((r) => `- ${r.name}: ${r.category} - ${r.time || r.prepTime || 'quick'} prep`)
    .join('\n');

  const useCaseContext = ragContext.relevantUseCases
    .map((uc) => `- ${uc.name}: ${uc.description}`)
    .join('\n');

  const personaContext = ragContext.detectedPersona
    ? `Detected Persona: ${ragContext.detectedPersona.name}
  - Goals: ${ragContext.detectedPersona.primaryGoals.join(', ')}
  - Concerns: ${ragContext.detectedPersona.keyBarriers.join(', ')}`
    : 'No specific persona detected';

  // Helper to detect if a query is support-related
  const isSupportQuery = (q: { query: string; intent?: string; journeyStage?: string }) => {
    const supportKeywords = /\b(leak|broken|problem|issue|warranty|return|not working|repair|fix|help|support|frustrated|refund)\b/i;
    return supportKeywords.test(q.query) ||
           q.intent === 'support' ||
           q.journeyStage === 'support';
  };

  // Determine if current query is support-related
  const currentIsSupport = isSupportQuery({ query, intent: intent.intentType, journeyStage: intent.journeyStage });

  // Segment session history by query type
  const allPreviousQueries = sessionContext?.previousQueries || [];

  // Filter queries to same context type (support vs shopping/recipe)
  const relevantQueries = allPreviousQueries
    .filter(q => currentIsSupport ? isSupportQuery(q) : !isSupportQuery(q))
    .slice(-3);

  const sessionHistory = relevantQueries.length > 0
    ? relevantQueries.map((q) => `  - "${q.query}" (${q.intent})`).join('\n')
    : 'New session (or no related queries in history)';

  // Get last RELEVANT query's enriched context (same type as current)
  const lastRelevantQuery = relevantQueries.slice(-1)[0];

  // Also note if there were support queries that we're excluding (for transparency)
  const excludedSupportQueries = currentIsSupport ? [] : allPreviousQueries.filter(isSupportQuery);
  const supportExclusionNote = excludedSupportQueries.length > 0
    ? `\n⚠️ Note: ${excludedSupportQueries.length} support-related queries excluded from session context (do NOT reference these in follow-ups)`
    : '';

  const lastQueryContext = lastRelevantQuery ? `
## Last Query Context (IMPORTANT for conversational flow)
- Query: "${lastRelevantQuery.query}"
- Journey Stage: ${lastRelevantQuery.journeyStage || 'exploring'}
- Confidence: ${lastRelevantQuery.confidence || 0.5}
- Products Shown: ${lastRelevantQuery.recommendedProducts?.join(', ') || 'None'}
- Recipes Shown: ${lastRelevantQuery.recommendedRecipes?.join(', ') || 'None'}
- Blocks Used: ${lastRelevantQuery.blockTypes?.join(', ') || 'None'}
- Next Best Action Suggested: ${lastRelevantQuery.nextBestAction || 'None'}${supportExclusionNote}` : '';

  return `## User Query
"${query}"

## Intent Classification
- Type: ${intent.intentType}
- Confidence: ${intent.confidence}
- Journey Stage: ${intent.journeyStage}
- Detected Products: ${intent.entities?.products?.join(', ') || 'None'}
- Use Cases: ${intent.entities?.useCases?.join(', ') || 'None'}
- Features: ${intent.entities?.features?.join(', ') || 'None'}

## User Profile Analysis
${personaContext}

## Available Products (pre-filtered, ${ragContext.contentSummary.productCount} total)
${productContext || 'No products matched'}

## FULL PRODUCT CATALOG (for product selection)
Select products from this complete list based on user context. Use exact product IDs.
${catalogSection}

## Relevant Use Cases
${useCaseContext || 'No specific use cases matched'}

## Available Recipes (${ragContext.contentSummary.recipeCount} total)
${recipeContext || 'No recipes matched'}

## Session History
${sessionHistory}
${lastQueryContext}

## User Profile
${sessionContext?.profile ? JSON.stringify(sessionContext.profile, null, 2) : 'No profile data'}

${signalInterpretation ? `
## BROWSING CONTEXT (provides additional context, does NOT override query)
This interpretation was generated by analyzing the user's browsing signals.
Use it to ADD CONTEXT to your response, but the User Query above is the PRIMARY driver of intent.

**Interpreted Intent**: ${signalInterpretation.interpretation.primaryIntent}
**Emotional Context**: ${signalInterpretation.interpretation.emotionalContext}
**Specific Needs**: ${signalInterpretation.interpretation.specificNeeds.join(', ') || 'None identified'}
**Journey Stage**: ${signalInterpretation.interpretation.journeyStage}
**Key Insights**:
${signalInterpretation.interpretation.keyInsights.map(i => `  - ${i}`).join('\n') || '  - No specific insights'}

### Content Context from Browsing Behavior
**Hero Tone**: ${signalInterpretation.contentRecommendation.heroTone}
**Suggested Blocks**: ${signalInterpretation.contentRecommendation.prioritizeBlocks.join(', ') || 'None specified'}
**Avoid Blocks**: ${signalInterpretation.contentRecommendation.avoidBlocks.join(', ') || 'None specified'}
**Additional Guidance**: ${signalInterpretation.contentRecommendation.specialGuidance || 'None'}

CRITICAL PRIORITY ORDER:
1. The User Query above is the PRIMARY source of intent (explicit, high confidence)
2. This browsing context provides SECONDARY context (inferred, lower confidence)
3. If query asks for recipes → include recipe-cards, even if browsing context suggests products
4. If query asks for comparisons → include comparison-table, even if context suggests recipes
5. Use browsing context to ENRICH the response (e.g., add commercial context), not to REPLACE query intent
` : ''}
${blockRequirements ? `
## PRE-COMPUTED BLOCK REQUIREMENTS (CRITICAL - Follow These!)

The following block requirements were computed by analyzing the query against all context rules.
You MUST include all REQUIRED blocks. You SHOULD include ENHANCED blocks if they add value.

**Triggered Rules**: ${blockRequirements.triggeredRules.join(', ')}

**REQUIRED Blocks** (MUST include all of these):
${blockRequirements.required.map(b => `- ${b}`).join('\n')}

**ENHANCED Blocks** (SHOULD include if relevant):
${blockRequirements.enhanced.map(b => `- ${b}`).join('\n') || '- None'}

**EXCLUDED Blocks** (MUST NOT include):
${blockRequirements.excluded.map(b => `- ${b}`).join('\n') || '- None'}

${formatContentGuidance(blockRequirements)}
` : `${detectComparisonQuery(query) ? `
## COMPARISON QUERY DETECTED (MANDATORY BLOCKS)
This query is asking for a Vitamix model comparison. You MUST include:
1. best-pick block - Highlight the recommended model BEFORE the comparison
2. comparison-table block - Side-by-side comparison of the models
Block sequence: hero, best-pick, comparison-table, product-cards, follow-up

Detected comparison elements: ${getComparisonDetails(query)}
` : ''}`}

## Your Task
Analyze this query deeply and select the optimal blocks to render.
Include your reasoning so users understand how you approached their question.
Consider the user's journey stage and what would move them closer to a confident decision.

## CRITICAL: Conversational Flow Detection
If there's a Last Query Context above, determine the conversation flow:

1. **NARROWING** (user drilling down): Keywords like "which is best", "the best one", "tell me more about X", "just one"
   - If high confidence (>0.8) on a single product: Use product-recommendation block
   - If moderate confidence: Use comparison-table with filtered options
   - Reference previously shown products in your reasoning

2. **EXPANDING** (user wants alternatives): Keywords like "what else", "other options", "not sure", "different", "more"
   - Show different products than last time
   - Add a follow-up like "Back to comparing [previous products] →"
   - Acknowledge they've already seen certain options

3. **NEW_TOPIC** (unrelated query): Completely different intent/topic
   - Treat as fresh query but keep user preferences in mind
   - Don't reference previous products unless relevant

**Follow-up chip rules:**
- If NARROWING: "View this model on Vitamix →", "See full specs →", "Find recipes for this →"
- If EXPANDING: "Back to comparing X vs Y →", "Try a different approach →"
- Always make one follow-up reference what they saw before
- NEVER use purchase language like "Buy", "Add to cart", "Shop now"`;
}

/**
 * Parse the reasoning response from the model
 */
function parseReasoningResponse(content: string): ReasoningResult {
  // Extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in reasoning response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.selectedBlocks || !Array.isArray(parsed.selectedBlocks)) {
      throw new Error('Missing or invalid selectedBlocks');
    }
    if (!parsed.reasoning) {
      throw new Error('Missing reasoning');
    }
    if (!parsed.userJourney) {
      throw new Error('Missing userJourney');
    }

    // Parse confidence - handle both old (single number) and new (object) formats
    let confidence: { intent: number; productMatch: number };
    if (typeof parsed.confidence === 'object' && parsed.confidence !== null) {
      // New format: { intent: 0.92, productMatch: 0.45 }
      confidence = {
        intent: parsed.confidence.intent ?? 0.8,
        productMatch: parsed.confidence.productMatch ?? 0.5,
      };
      if (parsed.confidence.productMatchRationale) {
        console.log('[ReasoningEngine] Product match rationale:', parsed.confidence.productMatchRationale);
      }
    } else if (typeof parsed.confidence === 'number') {
      // Old format: single number - use as intent, assume moderate product match
      console.log('[ReasoningEngine] Legacy confidence format detected, converting to dual format');
      confidence = {
        intent: parsed.confidence,
        productMatch: 0.5, // Conservative default when not specified
      };
    } else {
      // Fallback defaults
      confidence = {
        intent: 0.8,
        productMatch: 0.5,
      };
    }

    // Parse product selections (new field for LLM-driven product selection)
    let selectedProducts: ProductSelection[] | undefined;
    let productSelectionRationale: string | undefined;

    if (parsed.selectedProducts && Array.isArray(parsed.selectedProducts)) {
      const parsedProducts: ProductSelection[] = parsed.selectedProducts.map((p: Record<string, unknown>) => ({
        id: String(p.id || ''),
        rationale: String(p.rationale || ''),
        isPrimary: Boolean(p.isPrimary),
        contextType: (p.contextType as 'commercial' | 'consumer' | 'either') || 'either',
      })).filter((p: ProductSelection) => p.id); // Filter out empty IDs

      if (parsedProducts.length > 0) {
        selectedProducts = parsedProducts;
        console.log('[ReasoningEngine] LLM selected products:', parsedProducts.map(p => `${p.id} (${p.contextType}${p.isPrimary ? ', PRIMARY' : ''})`).join(', '));
      }
    }

    if (parsed.productSelectionRationale) {
      productSelectionRationale = String(parsed.productSelectionRationale);
      console.log('[ReasoningEngine] Product selection rationale:', productSelectionRationale);
    }

    // Parse advisor follow-up data if present
    let userJourney: UserJourneyPlan = parsed.userJourney;
    if (parsed.userJourney?.advisorFollowUp) {
      const advisorData = parsed.userJourney.advisorFollowUp;
      const advisorFollowUp: AdvisorFollowUp = {
        journeyStage: advisorData.journeyStage || parsed.userJourney.currentStage || 'exploring',
        suggestions: (advisorData.suggestions || []).map((s: Record<string, unknown>): StructuredSuggestion => ({
          query: String(s.query || ''),
          headline: String(s.headline || ''),
          rationale: String(s.rationale || ''),
          category: (s.category as 'go-deeper' | 'explore-more' | 'fill-gap') || 'go-deeper',
          priority: (s.priority as 1 | 2 | 3) || 2,
          confidence: Number(s.confidence) || 0.7,
          whyBullets: Array.isArray(s.whyBullets) ? s.whyBullets.map(String) : [],
        })).filter((s: StructuredSuggestion) => s.query && s.headline),
        gaps: (advisorData.gaps || []).map((g: Record<string, unknown>): ResearchGap => ({
          type: (g.type as ResearchGap['type']) || 'specs',
          query: String(g.query || ''),
          label: String(g.label || ''),
          explanation: String(g.explanation || ''),
        })).filter((g: ResearchGap) => g.query && g.label),
      };
      userJourney = {
        ...parsed.userJourney,
        advisorFollowUp,
      };
      console.log('[ReasoningEngine] Parsed advisor follow-up:', {
        journeyStage: advisorFollowUp.journeyStage,
        suggestionsCount: advisorFollowUp.suggestions.length,
        gapsCount: advisorFollowUp.gaps.length,
      });
    }

    return {
      selectedBlocks: parsed.selectedBlocks,
      reasoning: parsed.reasoning,
      userJourney,
      confidence,
      confidenceLegacy: typeof parsed.confidence === 'number' ? parsed.confidence : confidence.intent,
      selectedProducts,
      productSelectionRationale,
    };
  } catch (e) {
    throw new Error(`Failed to parse reasoning JSON: ${e}`);
  }
}

/**
 * Normalize block type names - remove common suffixes the AI might add
 */
function normalizeBlockType(type: string): string {
  // Map common AI variations to correct block names
  const blockNameMap: Record<string, string> = {
    'hero-block': 'hero',
    'faq-block': 'faq',
    'reasoning': 'reasoning-user', // Always use the user-focused reasoning block
  };

  return blockNameMap[type] || type;
}

/**
 * Prevent hero-like blocks from being consecutive
 * These blocks all use similar dark styling, so they should be visually separated
 */
function separateHeroAndProductRecommendation(blocks: BlockSelection[]): BlockSelection[] {
  const heroLikeBlocks = ['hero', 'product-recommendation', 'best-pick'];
  const result: BlockSelection[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const currentBlock = blocks[i];
    const prevBlock = result[result.length - 1];

    // Check if current and previous are both hero-like blocks
    if (prevBlock && heroLikeBlocks.includes(currentBlock.type) && heroLikeBlocks.includes(prevBlock.type)) {
      // Insert a separator block between them
      // Choose separator based on the context
      const separatorType = 'feature-highlights';
      result.push({
        type: separatorType as BlockSelection['type'],
        priority: result.length + 1,
        rationale: 'Visual separator between hero-style blocks',
        contentGuidance: 'Highlight key features relevant to the user query',
      });
    }

    result.push(currentBlock);
  }

  return result;
}

/**
 * Ensure required blocks are present based on rule requirements
 */
function ensureRequiredBlocks(
  blocks: BlockSelection[],
  blockRequirements?: MergedBlockRequirements
): BlockSelection[] {
  // Normalize block type names first
  blocks = blocks.map(block => ({
    ...block,
    type: normalizeBlockType(block.type) as BlockSelection['type'],
  }));

  // Filter out any reasoning blocks - they should never be included
  blocks = blocks.filter((b) => b.type !== 'reasoning' && b.type !== 'reasoning-user');

  // Remove excluded blocks if requirements provided
  if (blockRequirements?.excluded?.length) {
    const excludedSet = new Set(blockRequirements.excluded);
    blocks = blocks.filter((b) => !excludedSet.has(b.type));
  }

  // Ensure rule-required blocks are present
  if (blockRequirements?.required?.length) {
    const existingTypes = new Set(blocks.map(b => b.type));
    const missingRequired: BlockType[] = [];

    for (const requiredBlock of blockRequirements.required) {
      if (!existingTypes.has(requiredBlock)) {
        missingRequired.push(requiredBlock);
      }
    }

    if (missingRequired.length > 0) {
      console.log('[ReasoningEngine] Adding missing required blocks:', missingRequired);

      // Add missing blocks with appropriate positioning based on sequence hints
      for (const blockType of missingRequired) {
        const hint = blockRequirements.sequenceHints.find(h => h.block === blockType);

        let insertIndex = blocks.length; // Default to end

        if (hint) {
          if (hint.position === 'early') {
            // Find position after hero if present, otherwise at start
            const heroIndex = blocks.findIndex(b => b.type === 'hero' || b.type === 'empathy-hero');
            insertIndex = heroIndex >= 0 ? heroIndex + 1 : 0;
          } else if (hint.position === 'late') {
            // Before follow-up if present
            const followUpIndex = blocks.findIndex(b => b.type === 'follow-up');
            insertIndex = followUpIndex >= 0 ? followUpIndex : blocks.length;
          } else if (hint.after) {
            // After specific block
            const afterIndex = blocks.findIndex(b => b.type === hint.after);
            insertIndex = afterIndex >= 0 ? afterIndex + 1 : blocks.length;
          } else {
            // Middle position - after early blocks, before late blocks
            const heroIndex = blocks.findIndex(b => b.type === 'hero' || b.type === 'empathy-hero');
            const followUpIndex = blocks.findIndex(b => b.type === 'follow-up');
            if (followUpIndex >= 0) {
              insertIndex = followUpIndex;
            } else if (heroIndex >= 0) {
              insertIndex = heroIndex + 1;
            }
          }
        }

        // Find content guidance for this block from requirements
        const guidanceForBlock = blockRequirements.contentGuidance
          .find(g => g.toLowerCase().includes(blockType.toLowerCase()));

        blocks.splice(insertIndex, 0, {
          type: blockType,
          priority: insertIndex + 1,
          rationale: `Required by triggered rules: ${blockRequirements.triggeredRules.join(', ')}`,
          contentGuidance: guidanceForBlock || `Generate appropriate ${blockType} content`,
        });
      }
    }
  }

  // Prevent hero and product-recommendation from being consecutive
  blocks = separateHeroAndProductRecommendation(blocks);

  const hasFollowUp = blocks.some((b) => b.type === 'follow-up');

  // Add follow-up at end if missing
  if (!hasFollowUp) {
    blocks.push({
      type: 'follow-up',
      priority: blocks.length + 1,
      rationale: 'Enable continued exploration',
      contentGuidance: 'Provide contextual follow-up suggestions',
    });
  }

  // Re-assign priorities
  return blocks.map((block, index) => ({
    ...block,
    priority: index + 1,
  }));
}

/**
 * Enforce confidence thresholds for recommendation blocks.
 *
 * Uses DUAL confidence scores:
 * - intentConfidence: How well we understand what the user wants
 * - productMatchConfidence: How confident we are that a specific product is best
 *
 * Product recommendations require high productMatchConfidence, not just high intentConfidence.
 * A user might have a clear need ("kids recipes" = 94% intent) but no single product
 * is obviously best for that need (productMatch = 35%).
 *
 * Thresholds (based on productMatchConfidence):
 * - >= 70%: Allow product-recommendation
 * - >= 50%: Allow best-pick + comparison
 * - >= 35%: Comparison only, no "best" labels
 * - < 35%: Discovery mode with use-case-cards (if intent also low)
 */
function enforceConfidenceThresholds(
  result: ReasoningResult,
  intent: IntentClassification
): ReasoningResult {
  const { confidence, selectedBlocks } = result;

  // Extract dual confidence scores
  const intentConfidence = confidence.intent;
  const productMatchConfidence = confidence.productMatch;

  // Blocks that require high product match confidence
  const singleRecommendationBlocks = ['product-recommendation'];
  const bestPickBlocks = ['best-pick'];

  // Log for debugging
  console.log(`[ReasoningEngine] Dual confidence check:`);
  console.log(`  - Intent: ${(intentConfidence * 100).toFixed(0)}% (do we understand what they want?)`);
  console.log(`  - Product Match: ${(productMatchConfidence * 100).toFixed(0)}% (is one product clearly best?)`);
  console.log(`[ReasoningEngine] Original blocks: ${selectedBlocks.map(b => b.type).join(', ')}`);

  let filteredBlocks = [...selectedBlocks];
  const substitutionsMade: string[] = [];

  // ----------------------------------------
  // Check 1: If productMatchConfidence < 70%, remove product-recommendation
  // This is the key change - we use productMatchConfidence, not general confidence
  // ----------------------------------------
  if (productMatchConfidence < CONFIDENCE_THRESHOLDS.SINGLE_RECOMMENDATION) {
    const hasProductRec = filteredBlocks.some(b =>
      singleRecommendationBlocks.includes(b.type)
    );

    if (hasProductRec) {
      // Remove product-recommendation blocks
      filteredBlocks = filteredBlocks.filter(b =>
        !singleRecommendationBlocks.includes(b.type)
      );
      substitutionsMade.push(
        `Removed product-recommendation (productMatch ${(productMatchConfidence * 100).toFixed(0)}% < ${CONFIDENCE_THRESHOLDS.SINGLE_RECOMMENDATION * 100}% threshold)`
      );

      // Add comparison-table if not present and productMatch >= 40%
      if (
        productMatchConfidence >= CONFIDENCE_THRESHOLDS.COMPARISON_ONLY &&
        !filteredBlocks.some(b => b.type === 'comparison-table')
      ) {
        // Find best insertion point (after hero or best-pick, or at position 1)
        const heroIndex = filteredBlocks.findIndex(b => b.type === 'hero');
        const bestPickIndex = filteredBlocks.findIndex(b => b.type === 'best-pick');
        const insertAfter = Math.max(heroIndex, bestPickIndex);
        const insertIndex = insertAfter >= 0 ? insertAfter + 1 : Math.min(1, filteredBlocks.length);

        filteredBlocks.splice(insertIndex, 0, {
          type: 'comparison-table',
          priority: insertIndex + 1,
          rationale: 'Showing comparison instead of single recommendation - multiple products work well for this need',
          contentGuidance: 'Compare relevant products based on user signals without declaring a winner',
        });
        substitutionsMade.push('Added comparison-table as substitute');
      }

      // Add product-cards if not present (gives options without recommending)
      if (!filteredBlocks.some(b => b.type === 'product-cards')) {
        const compTableIndex = filteredBlocks.findIndex(b => b.type === 'comparison-table');
        const insertIndex = compTableIndex >= 0 ? compTableIndex + 1 : filteredBlocks.length - 1;

        filteredBlocks.splice(insertIndex, 0, {
          type: 'product-cards',
          priority: insertIndex + 1,
          rationale: 'Showing product options for user to explore',
          contentGuidance: 'Display relevant products without ranking or declaring a best choice',
        });
        substitutionsMade.push('Added product-cards for exploration');
      }
    }
  }

  // ----------------------------------------
  // Check 2: If productMatchConfidence < 50%, remove best-pick
  // ----------------------------------------
  if (productMatchConfidence < CONFIDENCE_THRESHOLDS.BEST_PICK_WITH_COMPARISON) {
    const hasBestPick = filteredBlocks.some(b =>
      bestPickBlocks.includes(b.type)
    );

    if (hasBestPick) {
      // Remove best-pick blocks
      filteredBlocks = filteredBlocks.filter(b =>
        !bestPickBlocks.includes(b.type)
      );
      substitutionsMade.push(
        `Removed best-pick (productMatch ${(productMatchConfidence * 100).toFixed(0)}% < ${CONFIDENCE_THRESHOLDS.BEST_PICK_WITH_COMPARISON * 100}% threshold)`
      );
    }
  }

  // ----------------------------------------
  // Check 3: If BOTH confidences are low, switch to discovery mode
  // Low intent + low product match = user needs help exploring
  // ----------------------------------------
  if (intentConfidence < CONFIDENCE_THRESHOLDS.COMPARISON_ONLY &&
      productMatchConfidence < CONFIDENCE_THRESHOLDS.COMPARISON_ONLY) {
    // Check if we have discovery blocks
    const hasDiscoveryBlocks = filteredBlocks.some(b =>
      ['use-case-cards', 'feature-highlights'].includes(b.type)
    );

    if (!hasDiscoveryBlocks) {
      // Add use-case-cards for discovery mode
      const heroIndex = filteredBlocks.findIndex(b => b.type === 'hero');
      const insertIndex = heroIndex >= 0 ? heroIndex + 1 : Math.min(1, filteredBlocks.length);

      filteredBlocks.splice(insertIndex, 0, {
        type: 'use-case-cards',
        priority: insertIndex + 1,
        rationale: 'Low confidence on both intent and product match - help user explore use cases first',
        contentGuidance: 'Show use cases relevant to user signals to help narrow down their needs',
      });
      substitutionsMade.push(`Added use-case-cards for discovery mode (intent ${(intentConfidence * 100).toFixed(0)}%, productMatch ${(productMatchConfidence * 100).toFixed(0)}%)`);
    }
  }

  // Log substitutions made
  if (substitutionsMade.length > 0) {
    console.log('[ReasoningEngine] Confidence threshold enforcement:');
    substitutionsMade.forEach(s => console.log(`  - ${s}`));
  } else {
    console.log('[ReasoningEngine] No confidence threshold adjustments needed');
  }

  // Re-assign priorities
  filteredBlocks = filteredBlocks.map((block, index) => ({
    ...block,
    priority: index + 1,
  }));

  console.log(`[ReasoningEngine] Final blocks: ${filteredBlocks.map(b => b.type).join(', ')}`);

  return {
    ...result,
    selectedBlocks: filteredBlocks,
  };
}

/**
 * Main reasoning function - analyzes intent and selects blocks
 *
 * @param signalInterpretation - Optional direct signal interpretation from LLM
 *                               When provided, this takes priority over rule-based profile data
 */
export async function analyzeAndSelectBlocks(
  query: string,
  intent: IntentClassification,
  ragContext: RAGContext,
  env: Env,
  sessionContext?: SessionContext,
  preset?: string,
  signalInterpretation?: SignalInterpretation,
  profileConfidence?: number
): Promise<ReasoningResult> {
  const modelFactory = new ModelFactory(preset || env.MODEL_PRESET || 'production');

  // Debug: Log session context
  const lastQuery = sessionContext?.previousQueries?.slice(-1)[0];
  console.log('[ReasoningEngine] Session context queries:', sessionContext?.previousQueries?.length || 0);
  if (lastQuery) {
    console.log('[ReasoningEngine] Last query:', lastQuery.query);
    console.log('[ReasoningEngine] Last query products:', lastQuery.recommendedProducts);
    console.log('[ReasoningEngine] Last query journey stage:', lastQuery.journeyStage);
  }

  // Log signal interpretation if available
  if (signalInterpretation) {
    console.log('[ReasoningEngine] Using signal interpretation:', {
      primaryIntent: signalInterpretation.interpretation.primaryIntent,
      useCases: signalInterpretation.classification.entities.useCases,
      heroTone: signalInterpretation.contentRecommendation.heroTone,
    });
  }

  // Evaluate constraint-based block rules
  const blockRequirements = evaluateRules(query, {
    intentType: intent.intentType,
    entities: intent.entities,
  });

  console.log('[ReasoningEngine] Block rules evaluation:', {
    triggeredRules: blockRequirements.triggeredRules,
    required: blockRequirements.required,
    enhanced: blockRequirements.enhanced,
    excluded: blockRequirements.excluded,
  });

  const reasoningPrompt = buildReasoningPrompt(query, intent, ragContext, sessionContext, signalInterpretation, blockRequirements);
  // Log if lastQueryContext is present
  console.log('[ReasoningEngine] Has lastQueryContext:', reasoningPrompt.includes('Last Query Context'));
  console.log('[ReasoningEngine] Has signalInterpretation:', reasoningPrompt.includes('DIRECT SIGNAL INTERPRETATION'));

  const messages: Message[] = [
    {
      role: 'system',
      content: REASONING_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: reasoningPrompt,
    },
  ];

  try {
    const response = await modelFactory.call('reasoning', messages, env);
    let result = parseReasoningResponse(response.content);

    // CRITICAL: Apply external confidence modifiers to the dual confidence scores
    // External sources (profile, signal interpretation) provide context about signal quality
    // These should cap the productMatchConfidence when signals are weak

    // Gather external confidence sources (single numbers representing signal quality)
    const externalConfidenceSources = [
      intent.confidence,                                    // Intent classification confidence
      signalInterpretation?.classification.confidence,      // Signal interpretation confidence
      profileConfidence,                                    // Profile confidence from rule-based engine
    ].filter((c): c is number => typeof c === 'number' && !isNaN(c));

    // External confidence is the minimum of all external sources (how good are our signals?)
    const externalConfidence = externalConfidenceSources.length > 0
      ? Math.min(...externalConfidenceSources)
      : 1.0;

    // For intentConfidence: LLM's assessment of query clarity, moderated by external sources
    const effectiveIntentConfidence = Math.min(
      result.confidence.intent,
      Math.max(externalConfidence, 0.5) // Don't let external sources reduce intent below 50%
    );

    // Determine if this is an explicit comparison or recommendation query
    // These query types deserve higher confidence floors since user intent is clear
    const isComparisonQuery = detectComparisonQuery(query);
    const isRecommendationQuery = /\b(best|recommend|which|should i|for me)\b/i.test(query);
    const hasExplicitIntent = isComparisonQuery || isRecommendationQuery;

    // Set floor based on query type:
    // - Explicit comparison/recommendation queries: floor at 0.55 (allows best-pick at 0.5 threshold)
    // - Regular queries: floor at 0.4 (allows comparison-only at 0.35 threshold)
    const productMatchFloor = hasExplicitIntent ? 0.55 : 0.4;

    // For productMatchConfidence: Apply floor to prevent over-suppression of recommendations
    // The LLM's assessment should be respected more when user intent is clear
    const effectiveProductMatchConfidence = Math.min(
      result.confidence.productMatch,
      Math.max(externalConfidence, productMatchFloor)
    );

    if (hasExplicitIntent) {
      console.log(`[ReasoningEngine] Explicit intent detected (comparison=${isComparisonQuery}, recommendation=${isRecommendationQuery}) - using floor ${productMatchFloor}`);
    }

    console.log('[ReasoningEngine] Dual confidence calculation:', {
      llmIntent: result.confidence.intent,
      llmProductMatch: result.confidence.productMatch,
      externalSources: {
        intent: intent.confidence,
        signalInterpretation: signalInterpretation?.classification.confidence,
        profile: profileConfidence,
      },
      externalMin: externalConfidence,
      productMatchFloor,
      hasExplicitIntent,
      effective: {
        intent: effectiveIntentConfidence,
        productMatch: effectiveProductMatchConfidence,
      },
    });

    // Override the result's confidence with the effective dual confidence
    result = {
      ...result,
      confidence: {
        intent: effectiveIntentConfidence,
        productMatch: effectiveProductMatchConfidence,
      },
    };

    // CRITICAL: Enforce confidence thresholds BEFORE block normalization
    // This uses productMatchConfidence to gate product recommendations
    result = enforceConfidenceThresholds(result, intent);

    // Ensure required blocks are present (pass block requirements for rule enforcement)
    result.selectedBlocks = ensureRequiredBlocks(result.selectedBlocks, blockRequirements);

    console.log('[ReasoningEngine] Final block list after rule enforcement:', result.selectedBlocks.map(b => b.type));

    return result;
  } catch (error) {
    console.error('[ReasoningEngine] Error:', error instanceof Error ? error.message : error);
    // Return fallback result
    return getFallbackReasoningResult(intent);
  }
}

/**
 * Get fallback reasoning result when the model fails
 */
function getFallbackReasoningResult(
  intent: IntentClassification
): ReasoningResult {
  const blocksByIntent: Record<string, BlockType[]> = {
    discovery: ['hero', 'use-case-cards', 'product-cards', 'follow-up'],
    comparison: ['hero', 'comparison-table', 'product-cards', 'follow-up'],
    'product-detail': ['product-recommendation', 'specs-table', 'recipe-cards', 'follow-up'],
    'use-case': ['hero', 'feature-highlights', 'recipe-cards', 'product-recommendation', 'follow-up'],
    specs: ['hero', 'specs-table', 'comparison-table', 'follow-up'],
    reviews: ['hero', 'testimonials', 'product-recommendation', 'follow-up'],
    price: ['hero', 'budget-breakdown', 'product-cards', 'follow-up'],
    recommendation: ['product-recommendation', 'follow-up'],
    // New intent types
    support: ['support-triage', 'faq', 'follow-up'],
    partnership: ['hero', 'feature-highlights', 'testimonials', 'follow-up'],
    gift: ['hero', 'product-recommendation', 'product-cards', 'follow-up'],
    medical: ['empathy-hero', 'accessibility-specs', 'product-recommendation', 'follow-up'],
    accessibility: ['empathy-hero', 'accessibility-specs', 'product-recommendation', 'follow-up'],
    // Operational guidance intent types
    cleaning: ['hero', 'troubleshooting-steps', 'faq', 'follow-up'],
    troubleshooting: ['hero', 'troubleshooting-steps', 'faq', 'follow-up'],
    technique: ['hero', 'technique-spotlight', 'faq', 'follow-up'],
  };

  const blocks = blocksByIntent[intent.intentType] || blocksByIntent.discovery;

  return {
    selectedBlocks: blocks.map((type, index) => ({
      type,
      priority: index + 1,
      rationale: `Default block for ${intent.intentType} intent`,
      contentGuidance: `Generate appropriate ${type} content`,
    })),
    reasoning: {
      intentAnalysis: `User intent classified as ${intent.intentType}`,
      userNeedsAssessment: 'Using default assessment based on intent classification',
      blockSelectionRationale: blocks.map((type) => ({
        blockType: type,
        reason: 'Default selection for intent type',
        contentFocus: 'Standard content approach',
      })),
      alternativesConsidered: ['Fallback mode - no alternatives analyzed'],
      finalDecision: 'Using fallback layout due to reasoning engine error',
    },
    userJourney: {
      currentStage: intent.journeyStage,
      nextBestAction: 'continue_exploration',
      suggestedFollowUps: [
        'Tell me more about Vitamix blenders',
        'What can I make?',
        'Compare models',
      ],
      advisorFollowUp: {
        journeyStage: intent.journeyStage,
        suggestions: [
          {
            query: 'What can I make with a Vitamix?',
            headline: 'Discover what you can create',
            rationale: 'See the full range of recipes and possibilities with a Vitamix blender.',
            category: 'explore-more',
            priority: 1,
            confidence: 0.7,
            whyBullets: ['Great starting point for exploring', 'Helps visualize daily use'],
          },
          {
            query: 'Compare Vitamix models',
            headline: 'Compare your options',
            rationale: 'See how different models stack up side by side.',
            category: 'go-deeper',
            priority: 2,
            confidence: 0.7,
            whyBullets: ['Multiple models to consider'],
          },
        ],
        gaps: [
          {
            type: 'recipes',
            query: 'vitamix recipes',
            label: 'Recipes',
            explanation: 'See what you can make with a Vitamix.',
          },
          {
            type: 'reviews',
            query: 'vitamix reviews',
            label: 'Customer Reviews',
            explanation: 'Hear from real Vitamix owners.',
          },
        ],
      },
    },
    confidence: {
      intent: 0.6,
      productMatch: 0.4, // Conservative - fallback shouldn't recommend specific products
    },
  };
}

/**
 * Format reasoning for display in the reasoning block
 */
export function formatReasoningForDisplay(
  reasoning: ReasoningTrace
): {
  steps: { stage: string; title: string; content: string }[];
} {
  return {
    steps: [
      {
        stage: 'understanding',
        title: 'Understanding Your Question',
        content: reasoning.intentAnalysis,
      },
      {
        stage: 'assessment',
        title: 'Assessing Your Needs',
        content: reasoning.userNeedsAssessment,
      },
      {
        stage: 'decision',
        title: 'My Recommendation',
        content: reasoning.finalDecision,
      },
    ],
  };
}
