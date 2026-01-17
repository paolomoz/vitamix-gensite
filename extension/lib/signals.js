/**
 * Signal Definitions & Classification
 * Generic signals with context-based classification
 */

/**
 * Strip null, undefined, and empty string values from an object
 * Recursively cleans nested objects
 */
export function stripNulls(obj) {
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    const cleaned = obj.map(stripNulls).filter(v => v !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined || value === '') continue;
    const cleaned = stripNulls(value);
    if (cleaned !== undefined) {
      result[key] = cleaned;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

// Signal weight mappings
export const SIGNAL_WEIGHTS = {
  VERY_HIGH: 0.20,
  HIGH: 0.15,
  MEDIUM: 0.10,
  LOW: 0.05,
};

// Base signal types (what the content script sends)
export const BASE_SIGNAL_TYPES = {
  page_view: { icon: '📄', baseWeight: SIGNAL_WEIGHTS.MEDIUM },
  click: { icon: '👆', baseWeight: SIGNAL_WEIGHTS.LOW },
  search: { icon: '🔍', baseWeight: SIGNAL_WEIGHTS.VERY_HIGH },
  scroll: { icon: '📜', baseWeight: SIGNAL_WEIGHTS.LOW },
  referrer: { icon: '🌐', baseWeight: SIGNAL_WEIGHTS.MEDIUM },
  video_complete: { icon: '🎬', baseWeight: SIGNAL_WEIGHTS.VERY_HIGH },
};

// Classification rules for page views (based on URL/title/content patterns)
const PAGE_CLASSIFIERS = [
  { pattern: /\/shop\/(blenders|accessories|containers)\/[^/]+/i, category: 'product', weight: SIGNAL_WEIGHTS.MEDIUM },
  { pattern: /\/shop\/[^/]+$/i, category: 'product', weight: SIGNAL_WEIGHTS.MEDIUM },
  { pattern: /\/recipes?\//i, category: 'recipe', weight: SIGNAL_WEIGHTS.HIGH },
  { pattern: /\/compare/i, category: 'compare', weight: SIGNAL_WEIGHTS.VERY_HIGH },
  { pattern: /\/shop\/(blenders|accessories|containers)(?:\/)?$/i, category: 'category', weight: SIGNAL_WEIGHTS.LOW },
  { pattern: /\/(articles?|blog|learn|inspiration)\//i, category: 'article', weight: SIGNAL_WEIGHTS.HIGH },
  { pattern: /\/(support|help|faq|customer-service)/i, category: 'support', weight: SIGNAL_WEIGHTS.HIGH },
  { pattern: /\/(shipping|delivery)/i, category: 'shipping', weight: SIGNAL_WEIGHTS.HIGH },
  { pattern: /\/(returns?|return-policy|refund)/i, category: 'returns', weight: SIGNAL_WEIGHTS.HIGH },
  { pattern: /\/(financing|affirm|payment|klarna)/i, category: 'financing', weight: SIGNAL_WEIGHTS.MEDIUM },
  { pattern: /\/(warranty|guarantee)/i, category: 'warranty', weight: SIGNAL_WEIGHTS.HIGH },
  { pattern: /\/(certified-reconditioned|reconditioned|refurbished)/i, category: 'reconditioned', weight: SIGNAL_WEIGHTS.HIGH },
];

// Classification rules for clicks (based on text/href/context)
const CLICK_CLASSIFIERS = [
  { pattern: /add.*(cart|bag)|buy\s*now|purchase/i, category: 'add_to_cart', weight: SIGNAL_WEIGHTS.VERY_HIGH },
  { pattern: /compare/i, category: 'compare', weight: SIGNAL_WEIGHTS.VERY_HIGH },
  { pattern: /review|rating|star/i, category: 'reviews', weight: SIGNAL_WEIGHTS.HIGH },
  { pattern: /spec|feature|detail/i, category: 'specs', weight: SIGNAL_WEIGHTS.MEDIUM },
  { pattern: /what.*box|included|contents/i, category: 'whats_in_box', weight: SIGNAL_WEIGHTS.MEDIUM },
  { pattern: /warranty|guarantee/i, category: 'warranty', weight: SIGNAL_WEIGHTS.HIGH },
  { pattern: /shipping|delivery/i, category: 'shipping', weight: SIGNAL_WEIGHTS.HIGH },
  { pattern: /financing|payment|affirm/i, category: 'financing', weight: SIGNAL_WEIGHTS.MEDIUM },
  { pattern: /recipe/i, category: 'recipe', weight: SIGNAL_WEIGHTS.HIGH },
  { pattern: /video|play|watch/i, category: 'video', weight: SIGNAL_WEIGHTS.HIGH },
];

// Product name mappings from URLs
export const PRODUCT_MAPPINGS = {
  'a3500': 'A3500',
  'a3500i': 'A3500i',
  'a2500': 'A2500',
  'a2500i': 'A2500i',
  'a2300': 'A2300',
  'a2300i': 'A2300i',
  'explorian-e310': 'E310',
  'e310': 'E310',
  'x5': 'X5',
  'venturist-v1200': 'V1200',
  'venturist-v1200i': 'V1200i',
  'v1200': 'V1200',
  'v1200i': 'V1200i',
  '5200': '5200',
  '5300': '5300',
  '7500': '7500',
  'propel-series': 'Propel Series',
  'immersion-blender': 'Immersion Blender',
  'foodcycler': 'FoodCycler',
  'storewide': 'Storewide',
};

/**
 * Classify a page view based on its context
 */
export function classifyPageView(data) {
  const { url = '', path = '', title = '', h1 = '' } = data;
  const textToMatch = `${url} ${path} ${title} ${h1}`.toLowerCase();

  for (const classifier of PAGE_CLASSIFIERS) {
    if (classifier.pattern.test(textToMatch)) {
      return {
        category: classifier.category,
        weight: classifier.weight,
      };
    }
  }

  return { category: 'page', weight: SIGNAL_WEIGHTS.LOW };
}

/**
 * Classify a click based on its context
 */
export function classifyClick(data) {
  const { text = '', href = '', ariaLabel = '', className = '' } = data;
  const textToMatch = `${text} ${href} ${ariaLabel} ${className}`.toLowerCase();

  for (const classifier of CLICK_CLASSIFIERS) {
    if (classifier.pattern.test(textToMatch)) {
      return {
        category: classifier.category,
        weight: classifier.weight,
      };
    }
  }

  // Check if clicking to a product or recipe link
  if (href) {
    const pageClass = classifyPageView({ url: href, path: new URL(href, 'https://vitamix.com').pathname });
    if (pageClass.category !== 'page') {
      return {
        category: `nav_to_${pageClass.category}`,
        weight: SIGNAL_WEIGHTS.LOW,
      };
    }
  }

  return { category: 'interaction', weight: SIGNAL_WEIGHTS.LOW };
}

/**
 * Extract product name from URL or title
 */
export function extractProductName(data) {
  const { path = '', title = '', h1 = '' } = data;

  // Try URL path
  const pathMatch = path.match(/\/shop\/(?:blenders\/|accessories\/)?([^/?]+)/);
  if (pathMatch) {
    const slug = pathMatch[1].toLowerCase();
    if (PRODUCT_MAPPINGS[slug]) {
      return PRODUCT_MAPPINGS[slug];
    }
    // Convert slug to title case
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Try h1
  if (h1) {
    // Look for known product names
    for (const [slug, name] of Object.entries(PRODUCT_MAPPINGS)) {
      if (h1.toLowerCase().includes(slug.replace(/-/g, ' '))) {
        return name;
      }
    }
  }

  return null;
}

/**
 * Create a signal event object with classification
 */
export function createSignal(type, data = {}) {
  const baseType = BASE_SIGNAL_TYPES[type] || { icon: '📍', baseWeight: SIGNAL_WEIGHTS.LOW };
  let classification = { category: type, weight: baseType.baseWeight };
  let label = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  let product = null;

  // Classify based on type
  if (type === 'page_view') {
    classification = classifyPageView(data);
    label = `${classification.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Page View`;
    product = extractProductName(data);
  } else if (type === 'click') {
    classification = classifyClick(data);
    label = `Click: ${classification.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
  } else if (type === 'search') {
    label = 'Search Query';
    classification.weight = SIGNAL_WEIGHTS.VERY_HIGH;
  } else if (type === 'scroll') {
    label = `Scroll ${data.depth || 0}%`;
  }

  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    category: classification.category,
    label,
    weight: classification.weight,
    weightLabel: getWeightLabel(classification.weight),
    icon: baseType.icon,
    timestamp: Date.now(),
    data: stripNulls(data) || {},
    product,
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
