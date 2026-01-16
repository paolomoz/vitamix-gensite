/**
 * Example Scenarios - Pre-configured intent inference examples
 * Ported from demo-tool/demo-examples.js for use in the extension
 */

export const examples = [
  // USE CASE 1: THE NEW PARENT
  {
    id: 'new-parent-short',
    name: 'New Parent',
    version: 'Short Journey',
    icon: '👶',
    persona: 'First-time parent researching how to make homemade baby food',
    emotionalDriver: 'Safety, nutrition control, cost savings on commercial baby food',
    signals: [
      { step: 1, action: 'Searches: "baby food blender"', signal: 'search: baby food blender', weight: 'Very High' },
      { step: 2, action: 'Visits "Baby Food Recipes" article', signal: 'article_view: baby-food-recipes', weight: 'High' },
      { step: 3, action: 'Clicks "Load More" on reviews', signal: 'reviews_expanded: 1', weight: 'High' },
    ],
    inferredProfile: {
      segments: ['new_parent', 'baby_feeding'],
      life_stage: 'infant_caregiver',
      use_cases: ['baby_food'],
      decision_style: 'safety_conscious',
      confidence_score: 0.52,
    },
    syntheticQuery: "I'm looking for a blender to make baby food. What do you recommend?",
  },

  {
    id: 'new-parent-long',
    name: 'New Parent',
    version: 'Long Journey',
    icon: '👶',
    persona: 'First-time parent researching how to make homemade baby food',
    emotionalDriver: 'Safety, nutrition control, cost savings on commercial baby food',
    signals: [
      { step: 1, action: 'Arrives from parenting blog referrer', signal: 'referrer: momresource.com/best-baby-food-makers', weight: 'High' },
      { step: 2, action: 'Visits Explorian E310 product page', signal: 'product_view: explorian-e310', weight: 'Medium' },
      { step: 3, action: 'Searches: "baby food"', signal: 'search: baby food', weight: 'Very High' },
      { step: 4, action: 'Visits "Baby Food Recipes" article', signal: 'article_view: baby-food-recipes', weight: 'High' },
      { step: 5, action: 'Views 3 individual baby food recipes', signal: 'recipe_views: 3, category: baby', weight: 'High' },
      { step: 6, action: 'Returns to E310, expands "What\'s in the box"', signal: 'product_detail: whats_in_box', weight: 'Medium' },
    ],
    inferredProfile: {
      segments: ['new_parent', 'baby_feeding', 'first_time_buyer'],
      life_stage: 'infant_caregiver',
      products_considered: ['E310'],
      price_sensitivity: 'high',
      use_cases: ['baby_food', 'purees'],
      decision_style: 'thorough_researcher',
      content_engagement: 'high',
      purchase_readiness: 'medium_high',
      confidence_score: 0.78,
    },
    syntheticQuery: "I want to make homemade baby food and purees for my baby. I've been looking at the E310 and reading through baby food recipes. I'm on a budget and this would be my first Vitamix. Is the E310 the right choice for making baby food?",
  },

  // USE CASE 2: THE GIFT GIVER
  {
    id: 'gift-giver-short',
    name: 'Gift Giver',
    version: 'Short Journey',
    icon: '🎁',
    persona: 'Shopping for a blender as a gift (wedding, holiday, housewarming)',
    emotionalDriver: 'Want to give an impressive, useful gift without being an expert',
    signals: [
      { step: 1, action: 'Arrives from Google: "best blender wedding gift 2025"', signal: 'referrer_search: best blender wedding gift', weight: 'Very High' },
      { step: 2, action: 'Immediately uses Compare tool (X5 vs X4)', signal: 'compare_tool: [X5, X4]', weight: 'Very High' },
    ],
    inferredProfile: {
      segments: ['gift_buyer'],
      shopping_for: 'someone_else',
      occasion: 'wedding',
      use_cases: ['gift'],
      decision_style: 'efficient',
      confidence_score: 0.65,
    },
    syntheticQuery: "I'm looking for a blender as a wedding gift. I'm comparing the X5 and X4. Which one makes a better gift?",
  },

  {
    id: 'gift-giver-long',
    name: 'Gift Giver',
    version: 'Long Journey',
    icon: '🎁',
    persona: 'Shopping for a blender as a gift (wedding, holiday, housewarming)',
    emotionalDriver: 'Want to give an impressive, useful gift without being an expert',
    signals: [
      { step: 1, action: 'Arrives from Google: "best blender wedding gift"', signal: 'referrer_search: best blender wedding gift', weight: 'Very High' },
      { step: 2, action: 'Browses 3 product pages rapidly (< 30s each)', signal: 'product_views: 3, time_avg: 25s', weight: 'Medium' },
      { step: 3, action: 'Uses Compare tool (X5 vs A3500)', signal: 'compare_tool: [X5, A3500]', weight: 'Very High' },
      { step: 4, action: 'Checks shipping information', signal: 'shipping_info_viewed: true', weight: 'High' },
      { step: 5, action: 'Skips recipe pages entirely', signal: 'recipe_views: 0', weight: 'Medium' },
      { step: 6, action: 'Views return policy page', signal: 'return_policy_viewed: true', weight: 'Medium' },
    ],
    inferredProfile: {
      segments: ['gift_buyer', 'premium_preference'],
      shopping_for: 'someone_else',
      occasion: 'wedding',
      products_considered: ['X5', 'A3500'],
      price_sensitivity: 'low',
      use_cases: ['gift'],
      decision_style: 'efficient_comparison',
      content_engagement: 'low',
      purchase_readiness: 'high',
      time_sensitive: true,
      confidence_score: 0.82,
    },
    syntheticQuery: "I need a premium Vitamix as a wedding gift. I'm comparing the X5 and A3500 — I want something impressive that looks great when they open it. I need it to arrive soon, and I want to make sure they can return it easily if they already have one. Which should I choose?",
  },

  // USE CASE 3: THE KITCHEN UPGRADER
  {
    id: 'upgrader-short',
    name: 'Kitchen Upgrader',
    version: 'Short Journey',
    icon: '🔄',
    persona: 'Owns an older blender (possibly a Vitamix), researching an upgrade',
    emotionalDriver: 'Current blender showing age, wants newer features, or kitchen renovation',
    signals: [
      { step: 1, action: 'Direct visit to vitamix.com (typed URL)', signal: 'referrer: direct', weight: 'Medium' },
      { step: 2, action: 'Searches: "upgrade old vitamix"', signal: 'search: upgrade old vitamix', weight: 'Very High' },
    ],
    inferredProfile: {
      segments: ['existing_owner', 'upgrade_intent'],
      brand_relationship: 'loyal_customer',
      use_cases: ['replacement', 'upgrade'],
      decision_style: 'informed',
      confidence_score: 0.58,
    },
    syntheticQuery: 'I want to upgrade my old Vitamix. What are my options?',
  },

  {
    id: 'upgrader-long',
    name: 'Kitchen Upgrader',
    version: 'Long Journey',
    icon: '🔄',
    persona: 'Owns an older blender (possibly a Vitamix), researching an upgrade',
    emotionalDriver: 'Current blender showing age, wants newer features, or kitchen renovation',
    signals: [
      { step: 1, action: 'Direct visit to vitamix.com', signal: 'referrer: direct', weight: 'Medium' },
      { step: 2, action: 'Searches: "5200 vs ascent"', signal: 'search: 5200 vs ascent', weight: 'Very High' },
      { step: 3, action: 'Visits Ascent Series landing page', signal: 'category_view: ascent-series', weight: 'Medium' },
      { step: 4, action: 'Checks "Compatible with" on X5 page', signal: 'compatibility_checked: true', weight: 'High' },
      { step: 5, action: 'Visits Certified Reconditioned page', signal: 'page_view: certified-reconditioned', weight: 'Medium' },
      { step: 6, action: 'Compares Reconditioned A3500 vs new X5', signal: 'compare_tool: [recon-a3500, X5]', weight: 'Very High' },
    ],
    inferredProfile: {
      segments: ['existing_owner', 'upgrade_intent', 'value_conscious'],
      brand_relationship: 'loyal_customer',
      current_product: '5200_series_likely',
      products_considered: ['X5', 'Reconditioned A3500'],
      price_sensitivity: 'moderate',
      use_cases: ['replacement', 'upgrade', 'feature_upgrade'],
      decision_style: 'informed_comparison',
      accessory_owner: true,
      purchase_readiness: 'medium',
      confidence_score: 0.85,
    },
    syntheticQuery: "I have a Vitamix 5200 and I'm looking to upgrade to something with more modern features. I'm comparing the new X5 with a reconditioned A3500. I already have containers and accessories I'd like to keep using. I want good value but also want the smart features. What's the best upgrade path for me?",
  },
];

/**
 * Get confidence level label and color
 */
export function getConfidenceLevel(score) {
  if (score >= 0.76) return { label: 'Very High', color: 'success' };
  if (score >= 0.56) return { label: 'High', color: 'success' };
  if (score >= 0.31) return { label: 'Medium', color: 'warning' };
  return { label: 'Low', color: 'low' };
}

/**
 * Get weight color class
 */
export function getWeightColor(weight) {
  switch (weight) {
    case 'Very High': return 'weight-very-high';
    case 'High': return 'weight-high';
    case 'Medium': return 'weight-medium';
    case 'Low': return 'weight-low';
    default: return 'weight-medium';
  }
}
