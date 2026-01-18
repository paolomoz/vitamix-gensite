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
 * Normalize a product slug to its canonical name
 */
export function normalizeProductName(slug) {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();

  // Direct mapping lookup
  if (PRODUCT_MAPPINGS[normalized]) {
    return PRODUCT_MAPPINGS[normalized];
  }

  // Try with hyphens replaced
  const withHyphens = normalized.replace(/\s+/g, '-');
  if (PRODUCT_MAPPINGS[withHyphens]) {
    return PRODUCT_MAPPINGS[withHyphens];
  }

  // Try partial match for known products
  for (const [key, name] of Object.entries(PRODUCT_MAPPINGS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return name;
    }
  }

  // Return title-cased version if no mapping found
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extract compared products from a compare URL or href
 * Handles patterns like:
 *   - /compare?products=X5,A3500
 *   - /compare?p=X5&p=A3500
 *   - /compare/X5-vs-A3500
 *   - /compare/X5/A3500
 */
export function extractComparedProducts(urlOrHref) {
  if (!urlOrHref) return null;

  try {
    // Normalize to full URL for parsing
    const url = new URL(urlOrHref, 'https://vitamix.com');
    const path = url.pathname;
    const params = url.searchParams;

    const products = [];

    // Pattern 1: Query param with comma-separated list (?products=X5,A3500)
    const productsParam = params.get('products') || params.get('product') || params.get('compare');
    if (productsParam) {
      productsParam.split(',').forEach((p) => {
        const name = normalizeProductName(p);
        if (name && !products.includes(name)) {
          products.push(name);
        }
      });
    }

    // Pattern 2: Multiple query params (?p=X5&p=A3500)
    const multiParams = params.getAll('p') || params.getAll('item') || params.getAll('model');
    if (multiParams.length > 0) {
      multiParams.forEach((p) => {
        const name = normalizeProductName(p);
        if (name && !products.includes(name)) {
          products.push(name);
        }
      });
    }

    // Pattern 3: Path-based comparison (/compare/X5-vs-A3500 or /compare/X5/A3500)
    if (path.includes('/compare')) {
      // Extract segment after /compare
      const compareMatch = path.match(/\/compare\/(.+)/i);
      if (compareMatch) {
        const segment = compareMatch[1];

        // Try "vs" pattern first (X5-vs-A3500, X5_vs_A3500, X5 vs A3500)
        const vsMatch = segment.match(/([^-_\s/]+)[-_\s]+vs[-_\s]+([^-_\s/]+)/i);
        if (vsMatch) {
          [vsMatch[1], vsMatch[2]].forEach((p) => {
            const name = normalizeProductName(p);
            if (name && !products.includes(name)) {
              products.push(name);
            }
          });
        } else {
          // Try slash-separated (/compare/X5/A3500)
          segment.split('/').forEach((p) => {
            if (p && p !== 'compare') {
              const name = normalizeProductName(p);
              if (name && !products.includes(name)) {
                products.push(name);
              }
            }
          });
        }
      }
    }

    // Return null if no products found, array otherwise
    return products.length > 0 ? products : null;
  } catch (e) {
    // URL parsing failed, try simple pattern matching
    const vsMatch = urlOrHref.match(/([a-z0-9-]+)[-_\s]+vs[-_\s]+([a-z0-9-]+)/i);
    if (vsMatch) {
      const products = [];
      [vsMatch[1], vsMatch[2]].forEach((p) => {
        const name = normalizeProductName(p);
        if (name && !products.includes(name)) {
          products.push(name);
        }
      });
      return products.length > 0 ? products : null;
    }
    return null;
  }
}

/**
 * Create a signal event object with classification
 */
export function createSignal(type, data = {}) {
  const baseType = BASE_SIGNAL_TYPES[type] || { icon: '📍', baseWeight: SIGNAL_WEIGHTS.LOW };
  let classification = { category: type, weight: baseType.baseWeight };
  let label = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  let product = null;
  let comparedProducts = null;

  // Classify based on type
  if (type === 'page_view') {
    classification = classifyPageView(data);
    label = `${classification.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Page View`;
    product = extractProductName(data);

    // For compare page views, prefer DOM-extracted products, fall back to URL parsing
    if (classification.category === 'compare') {
      // Priority 1: DOM-extracted products from content-script
      if (data.comparedProducts && data.comparedProducts.length > 0) {
        comparedProducts = data.comparedProducts.map((p) => normalizeProductName(p) || p);
      } else {
        // Priority 2: URL-based extraction
        comparedProducts = extractComparedProducts(data.url || data.path);
      }
    }
  } else if (type === 'click') {
    classification = classifyClick(data);
    label = `Click: ${classification.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;

    // For compare clicks, extract compared products from href
    if (classification.category === 'compare') {
      comparedProducts = extractComparedProducts(data.href);
    }
  } else if (type === 'search') {
    label = 'Search Query';
    classification.weight = SIGNAL_WEIGHTS.VERY_HIGH;
  } else if (type === 'scroll') {
    label = `Scroll ${data.depth || 0}%`;
  }

  // Update label to include compared products if available
  if (comparedProducts && comparedProducts.length > 0) {
    const productList = comparedProducts.join(' vs ');
    if (type === 'page_view') {
      label = `Compare: ${productList}`;
    } else {
      label = `Click: Compare ${productList}`;
    }
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
    comparedProducts,
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
