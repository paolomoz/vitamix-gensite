/**
 * Synthetic Query Generator
 * Generates natural language queries from inferred profiles
 */

// Query templates based on user segment
const TEMPLATES = {
  USE_CASE: {
    id: 'use_case',
    pattern: 'I want to {intent} {context}. {products}. {constraints}. {action}',
    weight: 1,
  },
  GIFT: {
    id: 'gift',
    pattern: "I'm looking for a blender {context}. {products}. {constraints}",
    weight: 2,
  },
  UPGRADER: {
    id: 'upgrader',
    pattern: 'I want {intent}. {context}. {products}. {action}',
    weight: 2,
  },
  COMPARISON: {
    id: 'comparison',
    pattern: '{products} for {intent}. {constraints}. {action}',
    weight: 1.5,
  },
  DIETARY: {
    id: 'dietary',
    pattern: '{context} and I need to {intent}. {products}. {constraints}',
    weight: 1.5,
  },
  SIMPLE: {
    id: 'simple',
    pattern: '{intent}. {action}',
    weight: 0.5,
  },
};

// Intent phrase mappings
const INTENT_PHRASES = {
  baby_food: 'make homemade baby food',
  purees: 'make smooth purees',
  smoothies: 'make smoothies',
  soups: 'make hot soups',
  frozen_desserts: 'make frozen desserts and ice cream',
  nut_butters: 'make nut butters',
  sauces: 'make sauces and dips',
  gift: 'find a gift',
  upgrade: 'upgrade my blender',
  replacement: 'replace my old blender',
  feature_upgrade: 'upgrade to something with more modern features',
};

// Context phrase mappings
const CONTEXT_PHRASES = {
  new_parent: 'for my baby',
  infant_caregiver: 'for my infant',
  gift_buyer: 'as a gift',
  wedding: 'for a wedding',
  existing_owner: 'I already have a Vitamix',
  loyal_customer: 'as a long-time Vitamix fan',
  first_time_buyer: 'this would be my first Vitamix',
  premium_preference: 'I want something premium',
  value_conscious: 'I want good value',
};

// Constraint phrase mappings
const CONSTRAINT_PHRASES = {
  high: "I'm on a budget",
  moderate: 'I want good value for money',
  low: "budget isn't a concern",
  time_sensitive: 'I need it to arrive soon',
  thorough_researcher: "I've been doing a lot of research",
};

// Action phrase mappings by confidence level
const ACTION_PHRASES = {
  very_high: 'Which should I choose?',
  high: 'Is this the right choice for me?',
  medium: 'What do you recommend?',
  low: 'What are my options?',
};

/**
 * Generate a synthetic query from profile
 */
export function generateQuery(profile, signals = []) {
  // Check minimum confidence
  if (profile.confidence_score < 0.45) {
    return {
      query: null,
      reason: 'Not enough signals to generate a confident query',
      minConfidence: 0.45,
      currentConfidence: profile.confidence_score,
    };
  }

  // Select template based on segments
  const template = selectTemplate(profile);

  // Build query components
  const components = buildComponents(profile, signals);

  // Generate query from template
  const query = fillTemplate(template, components, profile.confidence_score);

  return {
    query,
    template: template.id,
    components,
    confidence: profile.confidence_score,
  };
}

/**
 * Select the best template based on profile
 */
function selectTemplate(profile) {
  const segments = profile.segments || [];

  // Gift buyer
  if (segments.includes('gift_buyer')) {
    return TEMPLATES.GIFT;
  }

  // Upgrader / existing owner
  if (segments.includes('existing_owner') || segments.includes('upgrade_intent')) {
    return TEMPLATES.UPGRADER;
  }

  // Comparison shopper with multiple products
  if (segments.includes('comparison_shopper') && (profile.products_considered?.length || 0) >= 2) {
    return TEMPLATES.COMPARISON;
  }

  // Low confidence - use simple template
  if (profile.confidence_score < 0.55) {
    return TEMPLATES.SIMPLE;
  }

  // Default to use case template
  return TEMPLATES.USE_CASE;
}

/**
 * Build query components from profile
 */
function buildComponents(profile, signals) {
  const components = {
    intent: null,
    context: null,
    products: null,
    constraints: null,
    action: null,
  };

  // Intent - from use cases
  if (profile.use_cases?.length > 0) {
    const useCases = profile.use_cases
      .map(uc => INTENT_PHRASES[uc])
      .filter(Boolean);
    if (useCases.length > 0) {
      components.intent = useCases.slice(0, 2).join(' and ');
    }
  }

  // Fallback intent from search queries
  if (!components.intent) {
    const searchSignal = signals.find(s => s.type === 'search_query');
    if (searchSignal?.data?.query) {
      components.intent = `find information about ${searchSignal.data.query}`;
    }
  }

  // Context - from segments and life stage
  const contextParts = [];
  if (profile.life_stage && CONTEXT_PHRASES[profile.life_stage]) {
    contextParts.push(CONTEXT_PHRASES[profile.life_stage]);
  }
  if (profile.occasion && CONTEXT_PHRASES[profile.occasion]) {
    contextParts.push(CONTEXT_PHRASES[profile.occasion]);
  }
  if (profile.segments) {
    for (const segment of profile.segments) {
      if (CONTEXT_PHRASES[segment] && !contextParts.includes(CONTEXT_PHRASES[segment])) {
        contextParts.push(CONTEXT_PHRASES[segment]);
      }
    }
  }
  if (contextParts.length > 0) {
    components.context = contextParts.slice(0, 2).join(' and ');
  }

  // Products
  if (profile.products_considered?.length > 0) {
    const products = profile.products_considered;
    if (products.length === 1) {
      components.products = `I've been looking at the ${products[0]}`;
    } else if (products.length === 2) {
      components.products = `I'm comparing the ${products[0]} and ${products[1]}`;
    } else {
      components.products = `I'm considering the ${products.slice(0, -1).join(', ')} and ${products[products.length - 1]}`;
    }
  }

  // Constraints - from price sensitivity and other factors
  const constraintParts = [];
  if (profile.price_sensitivity && CONSTRAINT_PHRASES[profile.price_sensitivity]) {
    constraintParts.push(CONSTRAINT_PHRASES[profile.price_sensitivity]);
  }
  if (profile.time_sensitive) {
    constraintParts.push(CONSTRAINT_PHRASES.time_sensitive);
  }
  if (constraintParts.length > 0) {
    components.constraints = constraintParts.join(' and ');
  }

  // Action - based on confidence level
  const confLevel = getConfidenceActionLevel(profile.confidence_score);
  components.action = ACTION_PHRASES[confLevel];

  return components;
}

/**
 * Get action phrase confidence level
 */
function getConfidenceActionLevel(score) {
  if (score >= 0.85) return 'very_high';
  if (score >= 0.70) return 'high';
  if (score >= 0.55) return 'medium';
  return 'low';
}

/**
 * Fill template with components
 */
function fillTemplate(template, components, confidence) {
  let query = template.pattern;

  // Replace placeholders
  for (const [key, value] of Object.entries(components)) {
    const placeholder = `{${key}}`;
    if (value) {
      query = query.replace(placeholder, value);
    } else {
      // Remove placeholder and surrounding punctuation/whitespace
      query = query.replace(new RegExp(`\\s*${placeholder}\\.?\\s*`, 'g'), ' ');
    }
  }

  // Clean up the query
  query = query
    .replace(/\s+/g, ' ')           // Multiple spaces to single
    .replace(/\s+\./g, '.')         // Space before period
    .replace(/\.\s*\./g, '.')       // Double periods
    .replace(/,\s*\./g, '.')        // Comma before period
    .replace(/^\s+|\s+$/g, '')      // Trim
    .replace(/\.\s*$/g, '')         // Remove trailing period (we'll add one)
    .replace(/\s+,/g, ',');         // Space before comma

  // Capitalize first letter
  if (query.length > 0) {
    query = query.charAt(0).toUpperCase() + query.slice(1);
  }

  // Add question mark if it's a question, period otherwise
  if (query.includes('?') || query.endsWith('?')) {
    // Already has question mark
  } else if (
    query.toLowerCase().includes('what') ||
    query.toLowerCase().includes('which') ||
    query.toLowerCase().includes('should i') ||
    query.toLowerCase().includes('is this') ||
    query.toLowerCase().includes('is the')
  ) {
    query = query.replace(/[.?!]*$/, '?');
  } else if (!query.endsWith('.') && !query.endsWith('?') && !query.endsWith('!')) {
    query += '.';
  }

  return query;
}

/**
 * Get query complexity description
 */
export function getQueryComplexity(confidence) {
  if (confidence >= 0.86) return 'Comprehensive';
  if (confidence >= 0.71) return 'Rich';
  if (confidence >= 0.56) return 'Standard';
  return 'Minimal';
}
