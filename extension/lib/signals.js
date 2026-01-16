/**
 * Signal Definitions & Weights
 * Defines all trackable user signals on vitamix.com
 */

// Signal weight mappings
export const SIGNAL_WEIGHTS = {
  // Tier 1: Essential signals
  VERY_HIGH: 0.20,
  HIGH: 0.15,
  MEDIUM: 0.10,
  LOW: 0.05,
};

// Language-agnostic path prefix pattern (matches /vr/en_us/, /us/en_us/, etc.)
const LANG_PREFIX = /\/[^/]+\/[a-z]{2}_[a-z]{2}/;

// Signal type definitions
export const SIGNAL_TYPES = {
  // Tier 1: MVP Signals (Essential)
  PRODUCT_PAGE_VIEW: {
    id: 'product_page_view',
    label: 'Product Page View',
    weight: SIGNAL_WEIGHTS.MEDIUM,
    tier: 1,
    icon: '📦',
    // Matches: /vr/en_us/shop/blenders/e310, /us/en_us/shop/blenders/a3500, etc.
    urlPattern: /\/shop\/blenders\/([^/?]+)/,
  },
  SEARCH_QUERY: {
    id: 'search_query',
    label: 'Search Query',
    weight: SIGNAL_WEIGHTS.VERY_HIGH,
    tier: 1,
    icon: '🔍',
  },
  RECIPE_PAGE_VIEW: {
    id: 'recipe_page_view',
    label: 'Recipe Page View',
    weight: SIGNAL_WEIGHTS.HIGH,
    tier: 1,
    icon: '🍳',
    urlPattern: /\/recipes\/([^/?]+)/,
  },
  ARTICLE_PAGE_VIEW: {
    id: 'article_page_view',
    label: 'Article Page View',
    weight: SIGNAL_WEIGHTS.HIGH,
    tier: 1,
    icon: '📄',
    urlPattern: /\/(articles?|blog|learn|inspiration)\/([^/?]+)/,
  },
  REVIEWS_LOAD_MORE: {
    id: 'reviews_load_more',
    label: 'Reviews Load More',
    weight: SIGNAL_WEIGHTS.HIGH,
    tier: 1,
    icon: '⭐',
  },
  COMPARE_TOOL_USED: {
    id: 'compare_tool_used',
    label: 'Compare Tool Used',
    weight: SIGNAL_WEIGHTS.VERY_HIGH,
    tier: 1,
    icon: '⚖️',
    urlPattern: /\/compare/,
  },
  RETURN_VISIT: {
    id: 'return_visit',
    label: 'Return Visit',
    weight: SIGNAL_WEIGHTS.MEDIUM,
    tier: 1,
    icon: '🔄',
  },

  // Tier 2: Enhanced Signals
  SCROLL_DEPTH: {
    id: 'scroll_depth',
    label: 'Scroll Depth',
    weight: SIGNAL_WEIGHTS.LOW,
    tier: 2,
    icon: '📜',
  },
  TIME_ON_PAGE: {
    id: 'time_on_page',
    label: 'Time on Page',
    weight: SIGNAL_WEIGHTS.MEDIUM,
    tier: 2,
    icon: '⏱️',
  },
  VIDEO_PLAY: {
    id: 'video_play',
    label: 'Video Play',
    weight: SIGNAL_WEIGHTS.HIGH,
    tier: 2,
    icon: '▶️',
  },
  VIDEO_COMPLETION: {
    id: 'video_completion',
    label: 'Video Completion',
    weight: SIGNAL_WEIGHTS.VERY_HIGH,
    tier: 2,
    icon: '🎬',
  },
  REVIEW_FILTER_APPLIED: {
    id: 'review_filter_applied',
    label: 'Review Filter Applied',
    weight: SIGNAL_WEIGHTS.MEDIUM,
    tier: 2,
    icon: '🔧',
  },
  ACCESSORY_PAGE_VIEW: {
    id: 'accessory_page_view',
    label: 'Accessory Page View',
    weight: SIGNAL_WEIGHTS.MEDIUM,
    tier: 2,
    icon: '🔌',
    urlPattern: /\/shop\/accessories\/([^/?]+)/,
  },
  REFERRER_CONTEXT: {
    id: 'referrer_context',
    label: 'Referrer Context',
    weight: SIGNAL_WEIGHTS.HIGH,
    tier: 2,
    icon: '🌐',
  },
  SESSION_DURATION: {
    id: 'session_duration',
    label: 'Session Duration',
    weight: SIGNAL_WEIGHTS.LOW,
    tier: 2,
    icon: '⌛',
  },

  // Tier 3: Advanced Signals
  IMAGE_GALLERY_INTERACTION: {
    id: 'image_gallery_interaction',
    label: 'Image Gallery Interaction',
    weight: SIGNAL_WEIGHTS.MEDIUM,
    tier: 3,
    icon: '🖼️',
  },
  SPEC_TAB_OPENED: {
    id: 'spec_tab_opened',
    label: 'Spec Tab Opened',
    weight: SIGNAL_WEIGHTS.MEDIUM,
    tier: 3,
    icon: '📋',
  },
  WHATS_IN_BOX_EXPANDED: {
    id: 'whats_in_box_expanded',
    label: "What's in Box Expanded",
    weight: SIGNAL_WEIGHTS.MEDIUM,
    tier: 3,
    icon: '📦',
  },
  ADD_TO_CART: {
    id: 'add_to_cart',
    label: 'Add to Cart',
    weight: SIGNAL_WEIGHTS.VERY_HIGH,
    tier: 3,
    icon: '🛒',
  },
  SHIPPING_INFO_VIEWED: {
    id: 'shipping_info_viewed',
    label: 'Shipping Info Viewed',
    weight: SIGNAL_WEIGHTS.HIGH,
    tier: 3,
    icon: '🚚',
    urlPattern: /\/(shipping|delivery)/,
  },
  RETURN_POLICY_VIEWED: {
    id: 'return_policy_viewed',
    label: 'Return Policy Viewed',
    weight: SIGNAL_WEIGHTS.MEDIUM,
    tier: 3,
    icon: '↩️',
    urlPattern: /\/(returns?|return-policy|policy)/,
  },
  FINANCING_VIEWED: {
    id: 'financing_viewed',
    label: 'Financing Viewed',
    weight: SIGNAL_WEIGHTS.MEDIUM,
    tier: 3,
    icon: '💳',
    urlPattern: /\/(financing|affirm|payment|klarna)/,
  },
  CATEGORY_PAGE_VIEW: {
    id: 'category_page_view',
    label: 'Category Page View',
    weight: SIGNAL_WEIGHTS.MEDIUM,
    tier: 3,
    icon: '📂',
    urlPattern: /\/shop\/(blenders|accessories|containers)(?:\?|$)/,
  },
  CERTIFIED_RECONDITIONED_VIEW: {
    id: 'certified_reconditioned_view',
    label: 'Certified Reconditioned View',
    weight: SIGNAL_WEIGHTS.HIGH,
    tier: 3,
    icon: '♻️',
    urlPattern: /\/(certified-reconditioned|reconditioned|refurbished)/,
  },
};

// Product name mappings from URLs
export const PRODUCT_MAPPINGS = {
  'a3500': 'A3500',
  'a2500': 'A2500',
  'a2300': 'A2300',
  'explorian-e310': 'E310',
  'e310': 'E310',
  'x5': 'X5',
  'venturist-v1200': 'V1200',
  '5200': '5200',
  '5300': '5300',
  '7500': '7500',
  'storewide': 'Storewide',
  'propel-series': 'Propel Series',
  'immersion-blender': 'Immersion Blender',
  'foodcycler': 'FoodCycler',
};

// Recipe category mappings
export const RECIPE_CATEGORIES = {
  'baby-food': 'baby_food',
  'smoothies': 'smoothies',
  'soups': 'soups',
  'frozen-desserts': 'frozen_desserts',
  'nut-butters': 'nut_butters',
  'sauces': 'sauces',
  'dressings': 'dressings',
  'cocktails': 'cocktails',
  'juices': 'juices',
};

/**
 * Create a signal event object
 */
export function createSignal(type, data = {}) {
  const signalDef = typeof type === 'string'
    ? Object.values(SIGNAL_TYPES).find(s => s.id === type)
    : type;

  if (!signalDef) {
    console.warn('[Signals] Unknown signal type:', type);
    return null;
  }

  return {
    id: `${signalDef.id}_${Date.now()}`,
    type: signalDef.id,
    label: signalDef.label,
    weight: signalDef.weight,
    weightLabel: getWeightLabel(signalDef.weight),
    icon: signalDef.icon,
    tier: signalDef.tier,
    timestamp: Date.now(),
    data,
  };
}

/**
 * Get human-readable weight label
 */
export function getWeightLabel(weight) {
  if (weight >= SIGNAL_WEIGHTS.VERY_HIGH) return 'Very High';
  if (weight >= SIGNAL_WEIGHTS.HIGH) return 'High';
  if (weight >= SIGNAL_WEIGHTS.MEDIUM) return 'Medium';
  return 'Low';
}

/**
 * Get weight CSS class
 */
export function getWeightClass(weight) {
  if (weight >= SIGNAL_WEIGHTS.VERY_HIGH) return 'weight-very-high';
  if (weight >= SIGNAL_WEIGHTS.HIGH) return 'weight-high';
  if (weight >= SIGNAL_WEIGHTS.MEDIUM) return 'weight-medium';
  return 'weight-low';
}

/**
 * Detect page type from URL
 */
export function detectPageType(url) {
  const urlObj = new URL(url);
  const path = urlObj.pathname;

  // Check each signal type with URL pattern
  for (const [key, signal] of Object.entries(SIGNAL_TYPES)) {
    if (signal.urlPattern && signal.urlPattern.test(path)) {
      const match = path.match(signal.urlPattern);
      return {
        signalType: signal,
        match,
        path,
      };
    }
  }

  return null;
}

/**
 * Extract product name from URL path (language-agnostic)
 */
export function extractProductName(path) {
  // Match /shop/blenders/{product} regardless of language prefix
  const match = path.match(/\/shop\/(?:blenders|accessories|containers)\/([^/?]+)/);
  if (match && match[1]) {
    const slug = match[1].toLowerCase();
    return PRODUCT_MAPPINGS[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return null;
}

/**
 * Extract recipe category from URL path (language-agnostic)
 */
export function extractRecipeCategory(path) {
  // Match /recipes/{slug} regardless of language prefix
  const match = path.match(/\/recipes\/([^/?]+)/);
  if (match && match[1]) {
    const slug = match[1].toLowerCase();
    // Check if it's a category page
    if (RECIPE_CATEGORIES[slug]) {
      return RECIPE_CATEGORIES[slug];
    }
    // Otherwise it's a specific recipe - try to infer category from URL
    for (const [category, value] of Object.entries(RECIPE_CATEGORIES)) {
      if (slug.includes(category.replace('-', ''))) {
        return value;
      }
    }
  }
  return null;
}
