/**
 * Profile Inference Engine
 * Analyzes captured signals to infer user intent and build profile
 */

import { SIGNAL_WEIGHTS } from './signals.js';

// Default empty profile
export const DEFAULT_PROFILE = {
  // Inferred attributes
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
  current_product: null,
  content_engagement: null,
  accessory_owner: null,
  time_sensitive: null,

  // Metadata
  confidence_score: 0.0,
  signals_count: 0,
  session_count: 1,
  first_visit: null,
  last_visit: null,
};

// Inference rules - each rule specifies conditions and what to infer
const INFERENCE_RULES = [
  // New Parent Detection
  {
    id: 'new_parent_search',
    conditions: (signals) => signals.some(s =>
      s.type === 'search_query' && s.data?.query?.toLowerCase().includes('baby')
    ),
    infer: {
      segments: ['new_parent'],
      life_stage: 'infant_caregiver',
      use_cases: ['baby_food'],
    },
    confidence: 0.20,
  },
  {
    id: 'new_parent_recipe',
    conditions: (signals) => signals.some(s =>
      s.type === 'recipe_page_view' && s.data?.category === 'baby_food'
    ),
    infer: {
      segments: ['new_parent', 'baby_feeding'],
      use_cases: ['baby_food', 'purees'],
    },
    confidence: 0.15,
  },
  {
    id: 'new_parent_article',
    conditions: (signals) => signals.some(s =>
      s.type === 'article_page_view' && s.data?.path?.includes('baby')
    ),
    infer: {
      segments: ['new_parent'],
      use_cases: ['baby_food'],
    },
    confidence: 0.15,
  },

  // Gift Buyer Detection
  {
    id: 'gift_buyer_referrer',
    conditions: (signals) => signals.some(s =>
      s.type === 'referrer_context' && (
        s.data?.referrer?.includes('gift') ||
        s.data?.referrer?.includes('wedding') ||
        s.data?.referrer?.includes('registry')
      )
    ),
    infer: {
      segments: ['gift_buyer'],
      shopping_for: 'someone_else',
      use_cases: ['gift'],
    },
    confidence: 0.18,
  },
  {
    id: 'gift_buyer_search',
    conditions: (signals) => signals.some(s =>
      s.type === 'search_query' && (
        s.data?.query?.toLowerCase().includes('gift') ||
        s.data?.query?.toLowerCase().includes('wedding')
      )
    ),
    infer: {
      segments: ['gift_buyer'],
      shopping_for: 'someone_else',
      occasion: 'wedding',
      use_cases: ['gift'],
    },
    confidence: 0.20,
  },
  {
    id: 'gift_buyer_compare',
    conditions: (signals, profile) =>
      profile.segments.includes('gift_buyer') &&
      signals.some(s => s.type === 'compare_tool_used'),
    infer: {
      decision_style: 'efficient_comparison',
      segments: ['premium_preference'],
    },
    confidence: 0.10,
  },

  // Existing Owner / Upgrader Detection
  {
    id: 'upgrader_search',
    conditions: (signals) => signals.some(s =>
      s.type === 'search_query' && (
        s.data?.query?.toLowerCase().includes('upgrade') ||
        s.data?.query?.toLowerCase().includes('vs') ||
        s.data?.query?.toLowerCase().includes('compare')
      )
    ),
    infer: {
      segments: ['existing_owner', 'upgrade_intent'],
      brand_relationship: 'loyal_customer',
      use_cases: ['replacement', 'upgrade'],
    },
    confidence: 0.18,
  },
  {
    id: 'upgrader_direct',
    conditions: (signals) =>
      signals.some(s => s.type === 'referrer_context' && s.data?.referrer === 'direct') &&
      signals.some(s => s.type === 'search_query'),
    infer: {
      segments: ['existing_owner'],
      brand_relationship: 'loyal_customer',
    },
    confidence: 0.10,
  },
  {
    id: 'upgrader_reconditioned',
    conditions: (signals) => signals.some(s => s.type === 'certified_reconditioned_view'),
    infer: {
      segments: ['value_conscious'],
      price_sensitivity: 'moderate',
    },
    confidence: 0.12,
  },

  // Research Behavior Detection
  {
    id: 'thorough_researcher',
    conditions: (signals) => {
      const reviewSignals = signals.filter(s => s.type === 'reviews_load_more');
      const recipeViews = signals.filter(s => s.type === 'recipe_page_view');
      return reviewSignals.length >= 1 && recipeViews.length >= 2;
    },
    infer: {
      decision_style: 'thorough_researcher',
      content_engagement: 'high',
    },
    confidence: 0.12,
  },
  {
    id: 'content_engaged',
    conditions: (signals) => {
      const recipeViews = signals.filter(s => s.type === 'recipe_page_view');
      return recipeViews.length >= 4;
    },
    infer: {
      segments: ['content_engaged'],
      content_engagement: 'high',
    },
    confidence: 0.12,
  },
  {
    id: 'comparison_shopper',
    conditions: (signals) =>
      signals.some(s => s.type === 'compare_tool_used') &&
      signals.filter(s => s.type === 'product_page_view').length >= 2,
    infer: {
      segments: ['comparison_shopper'],
      decision_style: 'informed_comparison',
    },
    confidence: 0.15,
  },

  // Use Case Detection
  {
    id: 'smoothie_maker',
    conditions: (signals) => signals.some(s =>
      (s.type === 'search_query' && s.data?.query?.toLowerCase().includes('smoothie')) ||
      (s.type === 'recipe_page_view' && s.data?.category === 'smoothies')
    ),
    infer: {
      use_cases: ['smoothies'],
    },
    confidence: 0.08,
  },
  {
    id: 'soup_maker',
    conditions: (signals) => signals.some(s =>
      (s.type === 'search_query' && s.data?.query?.toLowerCase().includes('soup')) ||
      (s.type === 'recipe_page_view' && s.data?.category === 'soups')
    ),
    infer: {
      use_cases: ['soups', 'hot_blending'],
    },
    confidence: 0.08,
  },

  // Price Sensitivity Detection
  {
    id: 'price_sensitive',
    conditions: (signals) => signals.some(s =>
      s.type === 'financing_viewed' || s.type === 'certified_reconditioned_view'
    ),
    infer: {
      price_sensitivity: 'high',
    },
    confidence: 0.10,
  },
  {
    id: 'premium_buyer',
    conditions: (signals, profile) => {
      const products = profile.products_considered || [];
      const premiumProducts = ['X5', 'A3500', 'A2500'];
      return products.some(p => premiumProducts.includes(p));
    },
    infer: {
      price_sensitivity: 'low',
      segments: ['premium_preference'],
    },
    confidence: 0.08,
  },

  // Purchase Readiness Detection
  {
    id: 'high_purchase_intent',
    conditions: (signals) =>
      signals.some(s => s.type === 'add_to_cart') ||
      signals.some(s => s.type === 'shipping_info_viewed'),
    infer: {
      purchase_readiness: 'high',
    },
    confidence: 0.15,
  },
  {
    id: 'medium_purchase_intent',
    conditions: (signals, profile) =>
      profile.products_considered?.length >= 1 &&
      signals.some(s => s.type === 'reviews_load_more'),
    infer: {
      purchase_readiness: 'medium_high',
    },
    confidence: 0.10,
  },

  // Time Sensitivity Detection
  {
    id: 'time_sensitive_buyer',
    conditions: (signals) =>
      signals.some(s => s.type === 'shipping_info_viewed') &&
      signals.some(s => s.type === 'return_policy_viewed'),
    infer: {
      time_sensitive: true,
    },
    confidence: 0.08,
  },

  // First Time Buyer Detection
  {
    id: 'first_time_buyer',
    conditions: (signals, profile) =>
      !profile.segments.includes('existing_owner') &&
      signals.some(s => s.type === 'whats_in_box_expanded'),
    infer: {
      segments: ['first_time_buyer'],
    },
    confidence: 0.10,
  },

  // Video Engagement
  {
    id: 'video_engaged',
    conditions: (signals) => signals.some(s => s.type === 'video_completion'),
    infer: {
      decision_style: 'visual',
      content_engagement: 'high',
    },
    confidence: 0.12,
  },
];

/**
 * Profile Engine class
 */
export class ProfileEngine {
  constructor() {
    this.profile = { ...DEFAULT_PROFILE };
    this.signals = [];
  }

  /**
   * Add a signal and re-run inference
   */
  addSignal(signal) {
    if (!signal) return this.profile;

    this.signals.push(signal);
    this.profile.signals_count = this.signals.length;
    this.profile.last_visit = Date.now();

    if (!this.profile.first_visit) {
      this.profile.first_visit = Date.now();
    }

    // Extract product from product page views
    if (signal.type === 'product_page_view' && signal.data?.product) {
      this.addProductConsidered(signal.data.product);
    }

    // Run inference rules
    this.runInference();

    return this.profile;
  }

  /**
   * Add product to considered list (deduped)
   */
  addProductConsidered(product) {
    if (!this.profile.products_considered.includes(product)) {
      this.profile.products_considered.push(product);
    }
  }

  /**
   * Run all inference rules
   */
  runInference() {
    let totalConfidence = 0;
    const appliedRules = [];

    for (const rule of INFERENCE_RULES) {
      try {
        if (rule.conditions(this.signals, this.profile)) {
          this.applyInference(rule.infer);
          totalConfidence += rule.confidence;
          appliedRules.push(rule.id);
        }
      } catch (e) {
        console.warn('[ProfileEngine] Rule error:', rule.id, e);
      }
    }

    // Calculate confidence score (capped at 1.0)
    // Base confidence from signal weights
    const signalConfidence = this.signals.reduce((sum, s) => sum + (s.weight || 0), 0);

    // Combined confidence from rules and signals
    this.profile.confidence_score = Math.min(1.0, (totalConfidence + signalConfidence * 0.3));

    // Ensure confidence is at least proportional to signals
    if (this.signals.length > 0 && this.profile.confidence_score < 0.1) {
      this.profile.confidence_score = Math.min(0.3, this.signals.length * 0.05);
    }
  }

  /**
   * Apply inference results to profile
   */
  applyInference(infer) {
    for (const [key, value] of Object.entries(infer)) {
      if (Array.isArray(value)) {
        // Merge arrays (dedupe)
        if (!this.profile[key]) {
          this.profile[key] = [];
        }
        for (const item of value) {
          if (!this.profile[key].includes(item)) {
            this.profile[key].push(item);
          }
        }
      } else if (value !== null && value !== undefined) {
        // Only set if not already set or if this is a stronger signal
        if (!this.profile[key]) {
          this.profile[key] = value;
        }
      }
    }
  }

  /**
   * Get current profile
   */
  getProfile() {
    return { ...this.profile };
  }

  /**
   * Get all signals
   */
  getSignals() {
    return [...this.signals];
  }

  /**
   * Reset profile and signals
   */
  reset() {
    this.profile = { ...DEFAULT_PROFILE };
    this.signals = [];
    return this.profile;
  }

  /**
   * Load from storage
   */
  loadFromStorage(data) {
    if (data.profile) {
      this.profile = { ...DEFAULT_PROFILE, ...data.profile };
    }
    if (data.signals) {
      this.signals = data.signals;
    }
    // Increment session count on load
    this.profile.session_count = (this.profile.session_count || 0) + 1;
  }

  /**
   * Export for storage
   */
  exportForStorage() {
    return {
      profile: this.profile,
      signals: this.signals,
    };
  }
}

/**
 * Get confidence level label and color
 */
export function getConfidenceLevel(score) {
  if (score >= 0.76) return { label: 'Very High', color: 'success' };
  if (score >= 0.56) return { label: 'High', color: 'success' };
  if (score >= 0.31) return { label: 'Medium', color: 'warning' };
  return { label: 'Low', color: 'low' };
}
