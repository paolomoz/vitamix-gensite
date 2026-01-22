/**
 * Constraint-Based Block Selection Rules
 *
 * This module implements an additive rule system for block selection.
 * Instead of rules providing complete sequences, each rule expresses constraints:
 * - requires: blocks that MUST be included when triggered
 * - excludes: blocks that MUST NOT appear when triggered
 * - enhances: blocks that SHOULD be included if coherent
 * - contentGuidance: messaging hints when this rule applies
 *
 * When multiple rules trigger, their constraints are merged:
 * 1. Union of all required blocks
 * 2. Union of all excluded blocks
 * 3. Union of all enhanced blocks (minus excludes)
 * 4. Combined content guidance
 */

import type { BlockType } from '../types';

// ============================================
// Rule Types
// ============================================

export interface BlockRule {
  /** Unique identifier for the rule */
  id: string;
  /** Human-readable name */
  name: string;
  /** Rule category for grouping */
  category: 'structure' | 'context' | 'enhancement';
  /** Keywords/patterns that trigger this rule */
  triggers: TriggerCondition[];
  /** Blocks that MUST be included when triggered */
  requires: BlockType[];
  /** Blocks that MUST NOT appear when triggered */
  excludes: BlockType[];
  /** Blocks that SHOULD be included if space/coherence allows */
  enhances: BlockType[];
  /** Where required blocks should appear in sequence */
  sequenceHints: SequenceHint[];
  /** Content/messaging guidance when this rule applies */
  contentGuidance?: string;
  /** Priority for conflict resolution (higher = more important) */
  priority: number;
}

export interface TriggerCondition {
  type: 'keyword' | 'pattern' | 'intent' | 'entity';
  /** For keyword/pattern: the value to match */
  value?: string | RegExp;
  /** For intent: the intent type to match */
  intentType?: string;
  /** For entity: the entity type to check */
  entityType?: 'products' | 'useCases' | 'features' | 'ingredients';
  /** Minimum count for entity triggers */
  minCount?: number;
  /** Patterns that prevent this trigger from firing (for disambiguation) */
  negativePatterns?: string[];
}

export interface SequenceHint {
  block: BlockType;
  position: 'early' | 'middle' | 'late';
  /** Block that this should appear after (if any) */
  after?: BlockType;
  /** Block that this should appear before (if any) */
  before?: BlockType;
}

export interface MergedBlockRequirements {
  /** All required blocks (union of triggered rules) */
  required: BlockType[];
  /** All excluded blocks (union of triggered rules) */
  excluded: BlockType[];
  /** Enhanced blocks (union minus excludes) */
  enhanced: BlockType[];
  /** Sequence hints for ordering */
  sequenceHints: SequenceHint[];
  /** Combined content guidance */
  contentGuidance: string[];
  /** Which rules were triggered */
  triggeredRules: string[];
}

// ============================================
// Rule Definitions
// ============================================

export const BLOCK_RULES: BlockRule[] = [
  // ----------------------------------------
  // STRUCTURE RULES (Primary flow determiners)
  // ----------------------------------------
  {
    id: 'comparison',
    name: 'Product Comparison',
    category: 'structure',
    triggers: [
      { type: 'keyword', value: '\\bvs\\b' },
      { type: 'keyword', value: '\\bversus\\b' },
      { type: 'keyword', value: '\\bcompare\\b' },
      { type: 'keyword', value: '\\bcomparison\\b' },
      { type: 'keyword', value: '\\bdifference between\\b' },
      { type: 'keyword', value: '\\bwhich is better\\b' },
      { type: 'keyword', value: '\\bwhich one\\b' },
      { type: 'keyword', value: '\\bshould i choose\\b' },
      { type: 'intent', intentType: 'comparison' },
    ],
    requires: ['best-pick', 'comparison-table'],
    excludes: [],
    enhances: ['product-cards'],
    sequenceHints: [
      { block: 'best-pick', position: 'early', after: 'hero' },
      { block: 'comparison-table', position: 'middle', after: 'best-pick' },
    ],
    contentGuidance: 'Focus on differentiating features between models. Highlight which is best for their specific use case.',
    priority: 80,
  },
  {
    id: 'support',
    name: 'Support/Frustrated Customer',
    category: 'structure',
    triggers: [
      { type: 'keyword', value: '\\bproblem\\b' },
      { type: 'keyword', value: '\\bbroken\\b' },
      { type: 'keyword', value: '\\bfrustrated\\b' },
      {
        type: 'keyword',
        value: '\\bwarranty\\b',
        // Don't trigger support flow for research queries about warranty as a feature
        negativePatterns: [
          '\\bspecs\\b',
          '\\bspecifications\\b',
          '\\bfeatures\\b',
          '\\bwhat (does|is).*warranty.*cover',
          '\\bhow long.*warranty',
          '\\bwarranty (length|period|coverage|duration)',
          '\\byear.*warranty',
          '\\bwarranty.*year',
        ],
      },
      { type: 'keyword', value: '\\breturn\\b' },
      { type: 'keyword', value: '\\bissue\\b' },
      { type: 'keyword', value: '\\bnot working\\b' },
      { type: 'keyword', value: '\\bleak' },
      { type: 'keyword', value: '\\brepair\\b' },
      { type: 'intent', intentType: 'support' },
    ],
    requires: ['support-triage', 'faq'],
    excludes: ['product-recommendation', 'best-pick', 'product-cards', 'comparison-table'],
    enhances: [],
    sequenceHints: [
      { block: 'support-triage', position: 'early' },
      { block: 'faq', position: 'middle' },
    ],
    contentGuidance: 'Lead with empathy. Prioritize resolution over sales. Never recommend products to frustrated customers.',
    priority: 100, // Highest priority - support always wins
  },
  {
    id: 'discovery',
    name: 'General Discovery',
    category: 'structure',
    triggers: [
      { type: 'intent', intentType: 'discovery' },
      { type: 'keyword', value: '\\bwhat can\\b' },
      { type: 'keyword', value: '\\bshow me\\b' },
      { type: 'keyword', value: '\\bexplore\\b' },
    ],
    requires: ['hero', 'use-case-cards'],
    excludes: [],
    enhances: ['feature-highlights', 'product-cards'],
    sequenceHints: [
      { block: 'hero', position: 'early' },
      { block: 'use-case-cards', position: 'middle' },
    ],
    contentGuidance: 'Inspire and educate. Help them understand what\'s possible with a Vitamix.',
    priority: 30,
  },

  // ----------------------------------------
  // CONTEXT RULES (Lifestyle/situational)
  // ----------------------------------------
  {
    id: 'picky-eaters',
    name: 'Family with Picky Eaters',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\bpicky eater' },
      { type: 'keyword', value: '\\bkids\\b' },
      { type: 'keyword', value: '\\bchildren\\b' },
      { type: 'keyword', value: '\\bfamily of\\b' },
      { type: 'keyword', value: '\\bson\\b' },
      { type: 'keyword', value: '\\bdaughter\\b' },
      { type: 'keyword', value: "doesn't like veg" },
      { type: 'keyword', value: "won't eat veg" },
      { type: 'keyword', value: '\\bhiding vegetables\\b' },
      { type: 'keyword', value: '\\bsneak vegetables\\b' },
    ],
    requires: ['recipe-cards'],
    excludes: [],
    enhances: ['feature-highlights'],
    sequenceHints: [
      { block: 'recipe-cards', position: 'middle' },
    ],
    contentGuidance: 'Emphasize soup-making as a solution for hiding vegetables. Mention that soups can sneak in nutrition without kids noticing. Include smoothie content for kids who love them.',
    priority: 70,
  },
  {
    id: 'recipes-cooking',
    name: 'Recipe/Cooking Interest',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\brecipe' },
      { type: 'keyword', value: '\\bsoup' },
      { type: 'keyword', value: '\\bhot soup\\b' },
      { type: 'keyword', value: '\\bmake a\\b' },
      { type: 'keyword', value: '\\bcook\\b' },
      { type: 'keyword', value: '\\bprepare\\b' },
      { type: 'keyword', value: '\\bmeal ideas\\b' },
      { type: 'keyword', value: '\\bwhat can i make\\b' },
      { type: 'keyword', value: '\\bsmoothie' },
      { type: 'keyword', value: '\\bpuree\\b' },
      { type: 'keyword', value: '\\bnut butter\\b' },
    ],
    requires: ['recipe-cards'],
    excludes: [],
    enhances: ['feature-highlights'],
    sequenceHints: [
      { block: 'recipe-cards', position: 'middle' },
    ],
    contentGuidance: 'Focus on inspiring them with what they can create. For soup queries, emphasize hot-blending and friction-heat technology.',
    priority: 65,
  },
  {
    id: 'budget-conscious',
    name: 'Budget-Conscious User',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\bbudget\\b' },
      { type: 'keyword', value: '\\bafford\\b' },
      { type: 'keyword', value: '\\bcheap\\b' },
      { type: 'keyword', value: '\\bworth it\\b' },
      { type: 'keyword', value: '\\bexpensive\\b' },
      { type: 'keyword', value: '\\bstudent\\b' },
      { type: 'keyword', value: '\\bprice\\b' },
    ],
    requires: ['budget-breakdown'],
    excludes: [],
    enhances: ['product-cards'],
    sequenceHints: [
      { block: 'budget-breakdown', position: 'middle' },
    ],
    contentGuidance: 'Be honest about value and alternatives. Show price transparency.',
    priority: 60,
  },
  {
    id: 'gift-purchase',
    name: 'Gift Purchase',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\bgift\\b' },
      { type: 'keyword', value: '\\bfor my (mom|dad|wife|husband|friend|sister|brother)\\b' },
      { type: 'keyword', value: '\\bbirthday\\b' },
      { type: 'keyword', value: '\\bwedding\\b' },
      { type: 'keyword', value: '\\bchristmas\\b' },
      { type: 'keyword', value: '\\bpresent\\b' },
      { type: 'intent', intentType: 'gift' },
    ],
    requires: ['best-pick'],
    excludes: [],
    enhances: ['product-cards'],
    sequenceHints: [
      { block: 'best-pick', position: 'early', after: 'hero' },
    ],
    contentGuidance: 'Focus on recipient\'s needs. Only recommend NEW products (never reconditioned for gifts). Emphasize premium presentation and warranty.',
    priority: 65,
  },
  {
    id: 'medical-accessibility',
    name: 'Medical/Accessibility Needs',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\barthritis\\b' },
      { type: 'keyword', value: '\\bdisability\\b' },
      { type: 'keyword', value: '\\bdysphagia\\b' },
      { type: 'keyword', value: '\\bstroke\\b' },
      { type: 'keyword', value: '\\bmobility\\b' },
      { type: 'keyword', value: '\\bgrip\\b' },
      { type: 'keyword', value: '\\bheavy\\b' },
      { type: 'keyword', value: '\\baging\\b' },
      { type: 'intent', intentType: 'medical' },
      { type: 'intent', intentType: 'accessibility' },
    ],
    requires: ['empathy-hero', 'accessibility-specs'],
    excludes: ['hero'], // Use empathy-hero instead
    enhances: ['product-recommendation'],
    sequenceHints: [
      { block: 'empathy-hero', position: 'early' },
      { block: 'accessibility-specs', position: 'middle' },
    ],
    contentGuidance: 'Lead with empathy. Acknowledge their situation. Focus on physical considerations and ease of use.',
    priority: 85,
  },
  {
    id: 'sustainability',
    name: 'Eco-Conscious User',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\beco\\b' },
      { type: 'keyword', value: '\\beco-friendly\\b' },
      { type: 'keyword', value: '\\bsustainable\\b' },
      { type: 'keyword', value: '\\benvironment(al)?\\b' },
      { type: 'keyword', value: '\\bgreen (product|choice|option|alternative)' },
      { type: 'keyword', value: '\\breduce waste\\b' },
      { type: 'keyword', value: '\\blandfill\\b' },
      { type: 'keyword', value: '\\bplastic free\\b' },
      { type: 'keyword', value: '\\bcarbon footprint\\b' },
    ],
    requires: ['sustainability-info'],
    excludes: [],
    enhances: ['product-recommendation'],
    sequenceHints: [
      { block: 'sustainability-info', position: 'middle' },
    ],
    contentGuidance: 'Focus on longevity and repairability as eco-benefits.',
    priority: 55,
  },
  {
    id: 'noise-sensitive',
    name: 'Noise-Sensitive User',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\bnoise\\b' },
      { type: 'keyword', value: '\\bquiet\\b' },
      { type: 'keyword', value: '\\bloud\\b' },
      { type: 'keyword', value: '\\bapartment\\b' },
      { type: 'keyword', value: '\\broommate\\b' },
      { type: 'keyword', value: '\\bneighbor' },
      { type: 'keyword', value: '\\bdB\\b' },
      { type: 'keyword', value: '\\bdecibel\\b' },
    ],
    requires: ['noise-context'],
    excludes: [],
    enhances: ['product-cards'],
    sequenceHints: [
      { block: 'noise-context', position: 'middle' },
    ],
    contentGuidance: 'Be honest about limitations - blenders are loud. Provide real-world comparisons.',
    priority: 55,
  },
  {
    id: 'allergen-concerns',
    name: 'Allergy/Cross-Contamination',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\ballergy\\b' },
      { type: 'keyword', value: '\\ballergen\\b' },
      { type: 'keyword', value: '\\bcross.?contamination\\b' },
      { type: 'keyword', value: '\\bpeanut\\b' },
      { type: 'keyword', value: '\\bgluten\\b' },
      { type: 'keyword', value: '\\bceliac\\b' },
      { type: 'keyword', value: '\\banaphylaxis\\b' },
    ],
    requires: ['allergen-safety'],
    excludes: [],
    enhances: ['product-recommendation'],
    sequenceHints: [
      { block: 'allergen-safety', position: 'middle' },
    ],
    contentGuidance: 'Include cleaning protocols. Emphasize dedicated container strategy for allergen safety.',
    priority: 75,
  },
  {
    id: 'smart-tech',
    name: 'Smart Home/Tech Integration',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\bapp\\b' },
      { type: 'keyword', value: '\\bwifi\\b' },
      { type: 'keyword', value: '\\bconnected\\b' },
      { type: 'keyword', value: '\\bsmart\\b' },
      { type: 'keyword', value: '\\balexa\\b' },
      { type: 'keyword', value: '\\bvoice\\b' },
      { type: 'keyword', value: '\\bbluetooth\\b' },
    ],
    requires: ['smart-features'],
    excludes: [],
    enhances: ['comparison-table'],
    sequenceHints: [
      { block: 'smart-features', position: 'middle' },
    ],
    contentGuidance: 'Be transparent about smart feature limitations while highlighting genuine benefits.',
    priority: 50,
  },
  {
    id: 'engineering-specs',
    name: 'Deep Technical Interest',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\bwattage\\b' },
      { type: 'keyword', value: '\\brpm\\b' },
      { type: 'keyword', value: '\\bmotor\\b' },
      { type: 'keyword', value: '\\bspecs\\b' },
      { type: 'keyword', value: '\\bspecifications\\b' },
      { type: 'keyword', value: '\\btechnical\\b' },
      { type: 'keyword', value: '\\bengineer\\b' },
      { type: 'intent', intentType: 'specs' },
    ],
    requires: ['engineering-specs'],
    excludes: ['specs-table'], // Prevent redundant spec blocks
    enhances: ['comparison-table'],
    sequenceHints: [
      { block: 'engineering-specs', position: 'middle' },
    ],
    contentGuidance: 'Focus on raw data and measurements. No marketing fluff.',
    priority: 55,
  },
  {
    id: 'commercial-b2b',
    name: 'Commercial/B2B Interest',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\brestaurant\\b' },
      { type: 'keyword', value: '\\bbusiness\\b' },
      { type: 'keyword', value: '\\bcommercial\\b' },
      { type: 'keyword', value: '\\bbulk\\b' },
      { type: 'keyword', value: '\\bb2b\\b' },
      { type: 'keyword', value: '\\bprofessional kitchen\\b' },
      { type: 'keyword', value: '\\bbar\\b' },
      { type: 'keyword', value: '\\bcafe\\b' },
      { type: 'keyword', value: '\\bjuice bar\\b' },
    ],
    requires: ['specs-table'],
    excludes: ['engineering-specs'], // Prevent redundant spec blocks
    enhances: ['comparison-table'],
    sequenceHints: [
      { block: 'specs-table', position: 'middle' },
    ],
    contentGuidance: 'Focus on durability, warranty, volume capacity. Mention commercial support contact.',
    priority: 70,
  },
  {
    id: 'cleaning',
    name: 'Cleaning & Maintenance',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\bclean' },
      { type: 'keyword', value: '\\bwash' },
      { type: 'keyword', value: '\\bmaintenance\\b' },
      { type: 'keyword', value: '\\bcare\\b' },
      { type: 'keyword', value: '\\bresidue\\b' },
      { type: 'keyword', value: '\\bstain' },
      { type: 'keyword', value: '\\bself.?clean' },
      { type: 'keyword', value: '\\bdishwasher\\b' },
      { type: 'keyword', value: '\\bsanitize\\b' },
    ],
    requires: ['troubleshooting-steps'],
    excludes: ['product-recommendation', 'best-pick', 'comparison-table'],
    enhances: ['faq'],
    sequenceHints: [
      { block: 'troubleshooting-steps', position: 'early', after: 'hero' },
      { block: 'faq', position: 'middle' },
    ],
    contentGuidance: 'Focus on step-by-step cleaning instructions. Mention self-cleaning feature. Include tips for stubborn residue.',
    priority: 72,
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting & Problem Resolution',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\bfix\\b' },
      { type: 'keyword', value: '\\berror\\b' },
      { type: 'keyword', value: '\\bburning\\b' },
      { type: 'keyword', value: '\\bsmell' },
      { type: 'keyword', value: '\\bwon\'?t\\b' },
      { type: 'keyword', value: '\\bdoesn\'?t\\b' },
      { type: 'keyword', value: '\\btroubleshoot' },
      { type: 'keyword', value: '\\bstuck\\b' },
      { type: 'keyword', value: '\\bjammed\\b' },
      { type: 'keyword', value: '\\boverheating\\b' },
      { type: 'keyword', value: '\\bnot blending\\b' },
      { type: 'keyword', value: '\\bstopped working\\b' },
      {
        type: 'keyword',
        value: '\\bhow (do i|to) fix\\b',
      },
    ],
    requires: ['troubleshooting-steps', 'faq'],
    excludes: ['product-recommendation', 'best-pick', 'product-cards', 'comparison-table'],
    enhances: [],
    sequenceHints: [
      { block: 'troubleshooting-steps', position: 'early', after: 'hero' },
      { block: 'faq', position: 'middle' },
    ],
    contentGuidance: 'Provide clear step-by-step troubleshooting. Lead with the most common fix. Be reassuring - most issues are easily resolved.',
    priority: 90, // High priority - troubleshooting queries need immediate help
  },
  {
    id: 'technique',
    name: 'Technique & Operation Guidance',
    category: 'context',
    triggers: [
      { type: 'keyword', value: '\\bhow (do i|to)\\b' },
      { type: 'keyword', value: '\\btechnique\\b' },
      { type: 'keyword', value: '\\btips\\b' },
      { type: 'keyword', value: '\\bsettings?\\b' },
      { type: 'keyword', value: '\\bspeed\\b' },
      { type: 'keyword', value: '\\bproper way\\b' },
      { type: 'keyword', value: '\\bbest way\\b' },
      { type: 'keyword', value: '\\bmethod\\b' },
      { type: 'keyword', value: '\\blayer' },
      { type: 'keyword', value: '\\btamper\\b' },
      { type: 'keyword', value: '\\bprogram' },
      { type: 'keyword', value: '\\btime\\b' },
      { type: 'keyword', value: '\\bminutes?\\b' },
      { type: 'keyword', value: '\\bduration\\b' },
    ],
    requires: ['technique-spotlight'],
    excludes: [],
    enhances: ['faq', 'recipe-cards'],
    sequenceHints: [
      { block: 'technique-spotlight', position: 'early', after: 'hero' },
      { block: 'faq', position: 'middle' },
      { block: 'recipe-cards', position: 'late' },
    ],
    contentGuidance: 'Focus on practical how-to guidance. Include specific speed/time recommendations. Visual step-by-step is ideal.',
    priority: 68,
  },

  // ----------------------------------------
  // ENHANCEMENT RULES (Always-add patterns)
  // ----------------------------------------
  {
    id: 'quick-question',
    name: 'Quick Yes/No Question',
    category: 'enhancement',
    triggers: [
      { type: 'keyword', value: '^can vitamix\\b' },
      { type: 'keyword', value: '^will it\\b' },
      { type: 'keyword', value: '^does it\\b' },
      { type: 'keyword', value: '^is it worth\\b' },
      { type: 'keyword', value: '^should i\\b' },
      { type: 'keyword', value: '^can i\\b' },
    ],
    requires: ['quick-answer'],
    excludes: [],
    enhances: [],
    sequenceHints: [
      { block: 'quick-answer', position: 'early' },
    ],
    contentGuidance: 'Lead with a direct answer. Be concise.',
    priority: 40,
  },
  {
    id: 'follow-up-always',
    name: 'Always Include Follow-up',
    category: 'enhancement',
    triggers: [
      // This rule always triggers (universal)
      { type: 'keyword', value: '.' }, // Matches any query
    ],
    requires: ['follow-up'],
    excludes: [],
    enhances: [],
    sequenceHints: [
      { block: 'follow-up', position: 'late' },
    ],
    contentGuidance: 'Provide contextual next steps.',
    priority: 10,
  },
  {
    id: 'hero-default',
    name: 'Default Hero Block',
    category: 'enhancement',
    triggers: [
      { type: 'keyword', value: '.' }, // Matches any query
    ],
    requires: ['hero'],
    excludes: [],
    enhances: [],
    sequenceHints: [
      { block: 'hero', position: 'early' },
    ],
    contentGuidance: '',
    priority: 5, // Lowest priority - can be overridden by empathy-hero
  },
];

// ============================================
// Rule Evaluation Functions
// ============================================

/**
 * Check if a trigger condition matches the query/context
 */
function evaluateTrigger(
  trigger: TriggerCondition,
  query: string,
  intent?: { intentType?: string; entities?: { products?: string[]; useCases?: string[]; features?: string[]; ingredients?: string[] } }
): boolean {
  const lowerQuery = query.toLowerCase();

  // Check negative patterns first - if any match, this trigger doesn't fire
  if (trigger.negativePatterns && trigger.negativePatterns.length > 0) {
    for (const negPattern of trigger.negativePatterns) {
      const negRegex = new RegExp(negPattern, 'i');
      if (negRegex.test(lowerQuery)) {
        return false;
      }
    }
  }

  switch (trigger.type) {
    case 'keyword': {
      if (!trigger.value) return false;
      const pattern = typeof trigger.value === 'string'
        ? new RegExp(trigger.value, 'i')
        : trigger.value;
      return pattern.test(lowerQuery);
    }
    case 'pattern': {
      if (!trigger.value) return false;
      const pattern = typeof trigger.value === 'string'
        ? new RegExp(trigger.value, 'i')
        : trigger.value;
      return pattern.test(lowerQuery);
    }
    case 'intent': {
      return intent?.intentType === trigger.intentType;
    }
    case 'entity': {
      if (!trigger.entityType || !intent?.entities) return false;
      const entities = intent.entities[trigger.entityType];
      const count = entities?.length || 0;
      return count >= (trigger.minCount || 1);
    }
    default:
      return false;
  }
}

/**
 * Check if a rule should trigger based on query and context
 */
function shouldRuleTrigger(
  rule: BlockRule,
  query: string,
  intent?: { intentType?: string; entities?: { products?: string[]; useCases?: string[]; features?: string[]; ingredients?: string[] } }
): boolean {
  // A rule triggers if ANY of its trigger conditions match
  return rule.triggers.some(trigger => evaluateTrigger(trigger, query, intent));
}

/**
 * Evaluate all rules against a query and merge their requirements
 */
export function evaluateRules(
  query: string,
  intent?: { intentType?: string; entities?: { products?: string[]; useCases?: string[]; features?: string[]; ingredients?: string[] } }
): MergedBlockRequirements {
  const triggeredRules: BlockRule[] = [];

  // Find all triggered rules
  for (const rule of BLOCK_RULES) {
    if (shouldRuleTrigger(rule, query, intent)) {
      triggeredRules.push(rule);
    }
  }

  // Sort by priority (higher first)
  triggeredRules.sort((a, b) => b.priority - a.priority);

  // Merge requirements
  const requiredSet = new Set<BlockType>();
  const excludedSet = new Set<BlockType>();
  const enhancedSet = new Set<BlockType>();
  const allSequenceHints: SequenceHint[] = [];
  const allContentGuidance: string[] = [];

  for (const rule of triggeredRules) {
    // Add required blocks
    for (const block of rule.requires) {
      requiredSet.add(block);
    }

    // Add excluded blocks
    for (const block of rule.excludes) {
      excludedSet.add(block);
    }

    // Add enhanced blocks
    for (const block of rule.enhances) {
      enhancedSet.add(block);
    }

    // Collect sequence hints
    allSequenceHints.push(...rule.sequenceHints);

    // Collect content guidance
    if (rule.contentGuidance) {
      allContentGuidance.push(`[${rule.name}] ${rule.contentGuidance}`);
    }
  }

  // Remove excluded blocks from required and enhanced
  for (const excluded of excludedSet) {
    requiredSet.delete(excluded);
    enhancedSet.delete(excluded);
  }

  // Remove required blocks from enhanced (no duplicates)
  for (const required of requiredSet) {
    enhancedSet.delete(required);
  }

  // Filter sequence hints to only include relevant blocks
  const relevantBlocks = new Set([...requiredSet, ...enhancedSet]);
  const filteredHints = allSequenceHints.filter(hint => relevantBlocks.has(hint.block));

  return {
    required: Array.from(requiredSet),
    excluded: Array.from(excludedSet),
    enhanced: Array.from(enhancedSet),
    sequenceHints: filteredHints,
    contentGuidance: allContentGuidance,
    triggeredRules: triggeredRules.map(r => r.id),
  };
}

/**
 * Order blocks based on sequence hints
 */
export function orderBlocks(
  blocks: BlockType[],
  hints: SequenceHint[]
): BlockType[] {
  // Create position scores: early=-10, middle=0, late=10
  const positionScores: Record<string, number> = {};
  const afterConstraints: Record<string, BlockType[]> = {};
  const beforeConstraints: Record<string, BlockType[]> = {};

  for (const hint of hints) {
    const block = hint.block;
    if (!blocks.includes(block)) continue;

    // Set base position score
    switch (hint.position) {
      case 'early':
        positionScores[block] = Math.min(positionScores[block] ?? 0, -10);
        break;
      case 'middle':
        positionScores[block] = positionScores[block] ?? 0;
        break;
      case 'late':
        positionScores[block] = Math.max(positionScores[block] ?? 0, 10);
        break;
    }

    // Collect constraints
    if (hint.after && blocks.includes(hint.after)) {
      afterConstraints[block] = afterConstraints[block] || [];
      afterConstraints[block].push(hint.after);
    }
    if (hint.before && blocks.includes(hint.before)) {
      beforeConstraints[block] = beforeConstraints[block] || [];
      beforeConstraints[block].push(hint.before);
    }
  }

  // Sort blocks by position score, respecting after/before constraints
  const result = [...blocks].sort((a, b) => {
    const scoreA = positionScores[a] ?? 0;
    const scoreB = positionScores[b] ?? 0;

    // Check explicit constraints
    if (afterConstraints[a]?.includes(b)) return 1; // a comes after b
    if (afterConstraints[b]?.includes(a)) return -1; // b comes after a
    if (beforeConstraints[a]?.includes(b)) return -1; // a comes before b
    if (beforeConstraints[b]?.includes(a)) return 1; // b comes before a

    // Fall back to position scores
    return scoreA - scoreB;
  });

  return result;
}

/**
 * Build the final block list from merged requirements
 */
export function buildBlockList(requirements: MergedBlockRequirements): BlockType[] {
  // Combine required and enhanced blocks
  const allBlocks = [...requirements.required, ...requirements.enhanced];

  // Remove duplicates while preserving order
  const uniqueBlocks = [...new Set(allBlocks)];

  // Order based on sequence hints
  return orderBlocks(uniqueBlocks, requirements.sequenceHints);
}

/**
 * Format content guidance for LLM prompt
 */
export function formatContentGuidance(requirements: MergedBlockRequirements): string {
  if (requirements.contentGuidance.length === 0) {
    return '';
  }

  return `## Content Guidance from Triggered Rules\n\n${requirements.contentGuidance.join('\n\n')}`;
}
