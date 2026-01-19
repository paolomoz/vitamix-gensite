/**
 * Question Templates for Instant Follow-up
 *
 * Pre-computed question templates that provide instant follow-up options
 * without waiting for LLM reasoning. Templates are selected based on
 * intent, journey stage, and session context.
 */

import type {
  QuestionTemplate,
  InterpolationContext,
  RenderedQuestion,
  RenderedOption,
  QuestionOption,
  JourneyStage,
  QuestionIntentType,
  ContentType,
} from '../types';

// Re-export type for use in orchestrator
export type { QuestionIntentType };

// ============================================
// Template Collection
// ============================================

export const QUESTION_TEMPLATES: QuestionTemplate[] = [
  // ============================================
  // EXPLORING STAGE TEMPLATES
  // ============================================
  {
    id: 'explore-product-interest',
    intents: ['product_info', 'general'],
    stages: ['exploring'],
    questionTemplate: 'What matters most to you?',
    questionFallback: 'What matters most to you?',
    options: [
      {
        id: 'price-value',
        labelTemplate: 'Getting the best value',
        labelFallback: 'Getting the best value',
        queryTemplate: 'best value vitamix comparison',
        queryFallback: 'best value vitamix comparison',
        icon: 'price',
      },
      {
        id: 'specific-use',
        labelTemplate: 'Making ${goal}',
        labelFallback: 'Specific recipes or tasks',
        queryTemplate: '${goal} vitamix recipes',
        queryFallback: 'popular vitamix recipes',
        icon: 'recipe',
        showWhen: { hasGoal: true },
      },
      {
        id: 'features',
        labelTemplate: 'Understanding the differences',
        labelFallback: 'Understanding the differences',
        queryTemplate: 'compare vitamix models features',
        queryFallback: 'compare vitamix models features',
        icon: 'compare',
      },
      {
        id: 'reviews',
        labelTemplate: 'What real owners say',
        labelFallback: 'What real owners say',
        queryTemplate: 'vitamix customer reviews',
        queryFallback: 'vitamix customer reviews',
        icon: 'review',
      },
    ],
    priority: 10,
  },

  {
    id: 'explore-recipe-interest',
    intents: ['recipe'],
    stages: ['exploring'],
    questionTemplate: 'What would you like to explore?',
    questionFallback: 'What would you like to explore?',
    options: [
      {
        id: 'more-recipes',
        labelTemplate: 'More ${goal} ideas',
        labelFallback: 'More recipe ideas',
        queryTemplate: 'more ${goal} vitamix recipes',
        queryFallback: 'popular vitamix recipes',
        icon: 'recipe',
      },
      {
        id: 'best-blender',
        labelTemplate: 'Best blender for ${goal}',
        labelFallback: 'Best blender for this',
        queryTemplate: 'best vitamix for ${goal}',
        queryFallback: 'best vitamix model',
        icon: 'compare',
      },
      {
        id: 'techniques',
        labelTemplate: 'Tips and techniques',
        labelFallback: 'Tips and techniques',
        queryTemplate: 'vitamix tips techniques',
        queryFallback: 'vitamix tips techniques',
        icon: 'help',
      },
      {
        id: 'different-category',
        labelTemplate: 'Different recipe types',
        labelFallback: 'Different recipe types',
        queryTemplate: 'vitamix recipe categories',
        queryFallback: 'vitamix recipe categories',
        icon: 'recipe',
      },
    ],
    priority: 10,
  },

  {
    id: 'explore-first-query',
    intents: ['general', 'product_info'],
    stages: ['exploring'],
    questionTemplate: 'What brings you here today?',
    questionFallback: 'What brings you here today?',
    options: [
      {
        id: 'shopping',
        labelTemplate: 'Shopping for a Vitamix',
        labelFallback: 'Shopping for a Vitamix',
        queryTemplate: 'help me choose a vitamix',
        queryFallback: 'help me choose a vitamix',
        icon: 'compare',
      },
      {
        id: 'recipes',
        labelTemplate: 'Finding recipes to make',
        labelFallback: 'Finding recipes to make',
        queryTemplate: 'vitamix recipes',
        queryFallback: 'vitamix recipes',
        icon: 'recipe',
      },
      {
        id: 'owner',
        labelTemplate: "I already own one",
        labelFallback: "I already own one",
        queryTemplate: 'vitamix tips for owners',
        queryFallback: 'vitamix tips for owners',
        icon: 'help',
      },
      {
        id: 'learn',
        labelTemplate: 'Just learning about them',
        labelFallback: 'Just learning about them',
        queryTemplate: 'what makes vitamix special',
        queryFallback: 'what makes vitamix special',
        icon: 'specs',
      },
    ],
    priority: 5,
    conditions: { maxQueries: 1 },
  },

  // ============================================
  // COMPARING STAGE TEMPLATES
  // ============================================
  {
    id: 'compare-products',
    intents: ['product_info', 'comparison'],
    stages: ['comparing'],
    questionTemplate: 'What would help you compare?',
    questionFallback: 'What would help you compare?',
    options: [
      {
        id: 'side-by-side',
        labelTemplate: 'Compare ${product1} vs ${product2}',
        labelFallback: 'Side-by-side comparison',
        queryTemplate: 'compare ${product1} vs ${product2}',
        queryFallback: 'compare vitamix models',
        icon: 'compare',
        showWhen: { hasMultipleProducts: true },
      },
      {
        id: 'specs',
        labelTemplate: 'Detailed specifications',
        labelFallback: 'Detailed specifications',
        queryTemplate: '${product1} specifications',
        queryFallback: 'vitamix specifications',
        icon: 'specs',
      },
      {
        id: 'price-diff',
        labelTemplate: 'Price differences explained',
        labelFallback: 'Price differences explained',
        queryTemplate: 'vitamix price comparison worth it',
        queryFallback: 'vitamix price comparison worth it',
        icon: 'price',
      },
      {
        id: 'reviews',
        labelTemplate: 'Real owner experiences',
        labelFallback: 'Real owner experiences',
        queryTemplate: 'vitamix owner reviews comparison',
        queryFallback: 'vitamix owner reviews',
        icon: 'review',
        showWhen: { notYetSeen: ['reviews'] },
      },
    ],
    priority: 15,
    conditions: { requiresProducts: true },
  },

  {
    id: 'compare-use-case',
    intents: ['product_info', 'comparison', 'recipe'],
    stages: ['comparing'],
    questionTemplate: 'For your ${goal} needs:',
    questionFallback: 'Based on your needs:',
    options: [
      {
        id: 'best-for-use',
        labelTemplate: 'Best model for ${goal}',
        labelFallback: 'Best model for this',
        queryTemplate: 'best vitamix for ${goal}',
        queryFallback: 'best vitamix model',
        icon: 'compare',
      },
      {
        id: 'recipes-examples',
        labelTemplate: '${goal} recipes to try',
        labelFallback: 'Recipe examples',
        queryTemplate: '${goal} vitamix recipes',
        queryFallback: 'vitamix recipes',
        icon: 'recipe',
      },
      {
        id: 'accessories',
        labelTemplate: 'Helpful accessories',
        labelFallback: 'Helpful accessories',
        queryTemplate: 'vitamix accessories for ${goal}',
        queryFallback: 'vitamix accessories',
        icon: 'accessories',
        showWhen: { notYetSeen: ['accessories'] },
      },
      {
        id: 'techniques',
        labelTemplate: 'Expert tips',
        labelFallback: 'Expert tips',
        queryTemplate: 'vitamix tips for ${goal}',
        queryFallback: 'vitamix tips',
        icon: 'help',
      },
    ],
    priority: 12,
    conditions: { requiresGoal: true },
  },

  // ============================================
  // DECIDING STAGE TEMPLATES
  // ============================================
  {
    id: 'decide-final-questions',
    intents: ['product_info', 'comparison'],
    stages: ['deciding'],
    questionTemplate: 'Before you decide:',
    questionFallback: 'Before you decide:',
    options: [
      {
        id: 'warranty',
        labelTemplate: 'Warranty coverage',
        labelFallback: 'Warranty coverage',
        queryTemplate: 'vitamix warranty what is covered',
        queryFallback: 'vitamix warranty what is covered',
        icon: 'warranty',
        showWhen: { notYetSeen: ['warranty'] },
      },
      {
        id: 'reviews',
        labelTemplate: 'Final reviews check',
        labelFallback: 'Final reviews check',
        queryTemplate: '${product1} owner reviews honest',
        queryFallback: 'vitamix reviews honest',
        icon: 'review',
        showWhen: { notYetSeen: ['reviews'] },
      },
      {
        id: 'accessories',
        labelTemplate: 'What comes included',
        labelFallback: 'What comes included',
        queryTemplate: '${product1} what is included accessories',
        queryFallback: 'vitamix what is included',
        icon: 'accessories',
      },
      {
        id: 'alternatives',
        labelTemplate: 'Any alternatives to consider',
        labelFallback: 'Any alternatives to consider',
        queryTemplate: 'alternatives to ${product1}',
        queryFallback: 'vitamix alternatives comparison',
        icon: 'compare',
      },
    ],
    priority: 20,
    conditions: { minQueries: 2 },
  },

  {
    id: 'decide-confident',
    intents: ['product_info', 'comparison'],
    stages: ['deciding'],
    questionTemplate: 'Anything else before deciding?',
    questionFallback: 'Anything else before deciding?',
    options: [
      {
        id: 'nothing',
        labelTemplate: "I'm ready to decide",
        labelFallback: "I'm ready to decide",
        queryTemplate: 'where to buy ${product1}',
        queryFallback: 'where to buy vitamix',
        icon: 'price',
      },
      {
        id: 'more-recipes',
        labelTemplate: 'See what I can make',
        labelFallback: 'See what I can make',
        queryTemplate: '${product1} recipe ideas',
        queryFallback: 'vitamix recipe ideas',
        icon: 'recipe',
      },
      {
        id: 'support',
        labelTemplate: 'Customer support info',
        labelFallback: 'Customer support info',
        queryTemplate: 'vitamix customer support service',
        queryFallback: 'vitamix customer support service',
        icon: 'help',
      },
      {
        id: 'reconsider',
        labelTemplate: 'Compare one more time',
        labelFallback: 'Compare one more time',
        queryTemplate: 'compare ${productsFormatted}',
        queryFallback: 'compare vitamix models',
        icon: 'compare',
        showWhen: { hasMultipleProducts: true },
      },
    ],
    priority: 18,
    conditions: { minQueries: 3 },
  },

  // ============================================
  // SUPPORT TEMPLATES
  // ============================================
  {
    id: 'support-issue',
    intents: ['support'],
    stages: ['exploring', 'comparing', 'deciding'],
    questionTemplate: 'How can we help?',
    questionFallback: 'How can we help?',
    options: [
      {
        id: 'troubleshoot',
        labelTemplate: 'Troubleshooting guides',
        labelFallback: 'Troubleshooting guides',
        queryTemplate: 'vitamix troubleshooting guide',
        queryFallback: 'vitamix troubleshooting guide',
        icon: 'help',
      },
      {
        id: 'warranty-claim',
        labelTemplate: 'Warranty information',
        labelFallback: 'Warranty information',
        queryTemplate: 'vitamix warranty claim process',
        queryFallback: 'vitamix warranty claim process',
        icon: 'warranty',
      },
      {
        id: 'contact',
        labelTemplate: 'Contact customer service',
        labelFallback: 'Contact customer service',
        queryTemplate: 'vitamix customer service contact',
        queryFallback: 'vitamix customer service contact',
        icon: 'help',
      },
      {
        id: 'parts',
        labelTemplate: 'Replacement parts',
        labelFallback: 'Replacement parts',
        queryTemplate: 'vitamix replacement parts',
        queryFallback: 'vitamix replacement parts',
        icon: 'accessories',
      },
    ],
    priority: 25,
  },
];

// ============================================
// Template Selection Logic
// ============================================

/**
 * Select the best matching template for the current context
 */
export function selectTemplate(
  intent: QuestionIntentType,
  context: InterpolationContext
): QuestionTemplate | null {
  // Filter templates that match intent and stage
  const candidates = QUESTION_TEMPLATES.filter((template) => {
    // Must match intent
    if (!template.intents.includes(intent)) return false;

    // Must match journey stage
    if (!template.stages.includes(context.journeyStage)) return false;

    // Check conditions
    if (template.conditions) {
      const { minQueries, maxQueries, requiresProducts, requiresGoal } = template.conditions;

      if (minQueries !== undefined && context.queryCount < minQueries) return false;
      if (maxQueries !== undefined && context.queryCount > maxQueries) return false;
      if (requiresProducts && context.products.length === 0) return false;
      if (requiresGoal && !context.goal) return false;
    }

    return true;
  });

  if (candidates.length === 0) return null;

  // Sort by priority (highest first) and return best match
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0];
}

// ============================================
// Interpolation Logic
// ============================================

/**
 * Interpolate template strings with context values
 */
function interpolate(template: string, context: InterpolationContext): string {
  return template
    .replace(/\$\{product1\}/g, context.product1 || 'Vitamix')
    .replace(/\$\{product2\}/g, context.product2 || '')
    .replace(/\$\{productsFormatted\}/g, context.productsFormatted || 'Vitamix models')
    .replace(/\$\{goal\}/g, context.goal || 'your goals')
    .replace(/\$\{ingredients\}/g, context.ingredients.join(', ') || 'ingredients');
}

/**
 * Check if an option should be shown based on its conditions
 */
function shouldShowOption(option: QuestionOption, context: InterpolationContext): boolean {
  if (!option.showWhen) return true;

  const { hasMultipleProducts, hasGoal, notYetSeen, alreadySeen } = option.showWhen;

  if (hasMultipleProducts && context.products.length < 2) return false;
  if (hasGoal && !context.goal) return false;
  if (notYetSeen && notYetSeen.some((type) => context.contentSeen.includes(type))) return false;
  if (alreadySeen && !alreadySeen.some((type) => context.contentSeen.includes(type))) return false;

  return true;
}

/**
 * Render an option with interpolated values
 */
function renderOption(option: QuestionOption, context: InterpolationContext): RenderedOption {
  // Determine if we can use template or need fallback
  const canInterpolateLabel = !option.labelTemplate.includes('${') ||
    (option.labelTemplate.includes('${goal}') && context.goal) ||
    (option.labelTemplate.includes('${product1}') && context.product1) ||
    (option.labelTemplate.includes('${product2}') && context.product2) ||
    (option.labelTemplate.includes('${productsFormatted}') && context.productsFormatted);

  const canInterpolateQuery = !option.queryTemplate.includes('${') ||
    (option.queryTemplate.includes('${goal}') && context.goal) ||
    (option.queryTemplate.includes('${product1}') && context.product1) ||
    (option.queryTemplate.includes('${product2}') && context.product2) ||
    (option.queryTemplate.includes('${productsFormatted}') && context.productsFormatted);

  return {
    id: option.id,
    label: canInterpolateLabel
      ? interpolate(option.labelTemplate, context)
      : option.labelFallback,
    query: canInterpolateQuery
      ? interpolate(option.queryTemplate, context)
      : option.queryFallback,
    icon: option.icon,
  };
}

// ============================================
// Main Entry Point
// ============================================

/**
 * Build a rendered question from context
 *
 * @param intent - The classified intent type
 * @param context - Interpolation context with entities and session state
 * @returns Rendered question ready for display, or null if no template matches
 */
export function buildQuestion(
  intent: QuestionIntentType,
  context: InterpolationContext
): RenderedQuestion | null {
  const template = selectTemplate(intent, context);
  if (!template) return null;

  // Filter options based on conditions
  const visibleOptions = template.options.filter((opt) => shouldShowOption(opt, context));

  // Need at least 2 options for a meaningful question
  if (visibleOptions.length < 2) return null;

  // Render options (max 4)
  const renderedOptions = visibleOptions
    .slice(0, 4)
    .map((opt) => renderOption(opt, context));

  // Render question text
  const canInterpolateQuestion = !template.questionTemplate.includes('${') ||
    (template.questionTemplate.includes('${goal}') && context.goal) ||
    (template.questionTemplate.includes('${product1}') && context.product1);

  const questionText = canInterpolateQuestion
    ? interpolate(template.questionTemplate, context)
    : template.questionFallback;

  return {
    templateId: template.id,
    question: questionText,
    options: renderedOptions,
  };
}

// ============================================
// Context Builder Helper
// ============================================

/**
 * Build interpolation context from session data
 *
 * @param sessionContext - Session context from request
 * @param currentIntent - Current query's classified intent
 * @param currentEntities - Current query's extracted entities
 * @param contentSeen - Content types already shown in session
 * @param journeyStage - Current journey stage
 */
export function buildInterpolationContext(
  sessionContext: {
    previousQueries?: Array<{
      query: string;
      entities?: { products?: string[]; ingredients?: string[]; goals?: string[] };
    }>;
  } | null,
  currentIntent: string,
  currentEntities: { products?: string[]; ingredients?: string[]; goals?: string[] },
  contentSeen: ContentType[],
  journeyStage: JourneyStage
): InterpolationContext {
  // Collect all products from session + current
  const allProducts = new Set<string>();
  sessionContext?.previousQueries?.forEach((q) => {
    q.entities?.products?.forEach((p) => allProducts.add(p));
  });
  currentEntities.products?.forEach((p) => allProducts.add(p));
  const products = Array.from(allProducts);

  // Get goal from current or most recent query with a goal
  let goal = currentEntities.goals?.[0];
  if (!goal && sessionContext?.previousQueries) {
    for (let i = sessionContext.previousQueries.length - 1; i >= 0; i--) {
      const q = sessionContext.previousQueries[i];
      if (q.entities?.goals?.length) {
        goal = q.entities.goals[0];
        break;
      }
    }
  }

  // Collect ingredients
  const allIngredients = new Set<string>();
  sessionContext?.previousQueries?.forEach((q) => {
    q.entities?.ingredients?.forEach((i) => allIngredients.add(i));
  });
  currentEntities.ingredients?.forEach((i) => allIngredients.add(i));

  // Calculate query count
  const queryCount = (sessionContext?.previousQueries?.length || 0) + 1;

  return {
    products,
    product1: products[0],
    product2: products[1],
    productsFormatted: products.length >= 2 ? `${products[0]} vs ${products[1]}` : products[0],
    goal,
    ingredients: Array.from(allIngredients),
    contentSeen,
    journeyStage,
    queryCount,
  };
}
