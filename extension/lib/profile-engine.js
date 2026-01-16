/**
 * Profile Inference Engine
 * Analyzes captured signals to infer user intent and build profile
 */

import { SIGNAL_WEIGHTS } from './signals.js';

// Default empty profile
export const DEFAULT_PROFILE = {
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

  confidence_score: 0.0,
  signals_count: 0,
  session_count: 1,
  first_visit: null,
  last_visit: null,
};

// Inference rules - updated for category-based signals
const INFERENCE_RULES = [
  // New Parent Detection
  {
    id: 'new_parent_search',
    conditions: (signals) => signals.some(s =>
      s.type === 'search' && s.data?.query?.toLowerCase().match(/baby|infant|toddler|puree/)
    ),
    infer: {
      segments: ['new_parent'],
      life_stage: 'infant_caregiver',
      use_cases: ['baby_food'],
    },
    confidence: 0.20,
  },
  {
    id: 'new_parent_page',
    conditions: (signals) => signals.some(s =>
      s.type === 'page_view' && (
        s.data?.h1?.toLowerCase().includes('baby') ||
        s.data?.path?.includes('baby') ||
        s.data?.title?.toLowerCase().includes('baby')
      )
    ),
    infer: {
      segments: ['new_parent', 'baby_feeding'],
      use_cases: ['baby_food', 'purees'],
    },
    confidence: 0.15,
  },

  // Gift Buyer Detection
  {
    id: 'gift_buyer_referrer',
    conditions: (signals) => signals.some(s =>
      s.type === 'referrer' && (
        s.data?.domain?.includes('gift') ||
        s.data?.searchQuery?.toLowerCase().includes('gift') ||
        s.data?.searchQuery?.toLowerCase().includes('wedding')
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
      s.type === 'search' && s.data?.query?.toLowerCase().match(/gift|wedding|registry|present/)
    ),
    infer: {
      segments: ['gift_buyer'],
      shopping_for: 'someone_else',
      occasion: 'gift',
      use_cases: ['gift'],
    },
    confidence: 0.20,
  },

  // Existing Owner / Upgrader Detection
  {
    id: 'upgrader_search',
    conditions: (signals) => signals.some(s =>
      s.type === 'search' && s.data?.query?.toLowerCase().match(/upgrade|vs|compare|replace|old/)
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
      signals.some(s => s.type === 'referrer' && s.data?.type === 'direct') &&
      signals.some(s => s.type === 'search'),
    infer: {
      segments: ['existing_owner'],
      brand_relationship: 'loyal_customer',
    },
    confidence: 0.10,
  },
  {
    id: 'upgrader_reconditioned',
    conditions: (signals) => signals.some(s =>
      s.category === 'reconditioned' ||
      s.data?.path?.includes('reconditioned') ||
      s.data?.h1?.toLowerCase().includes('reconditioned')
    ),
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
      const reviewClicks = signals.filter(s => s.category === 'reviews');
      const recipeViews = signals.filter(s => s.category === 'recipe');
      return reviewClicks.length >= 1 && recipeViews.length >= 2;
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
      const recipeViews = signals.filter(s => s.category === 'recipe');
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
      signals.some(s => s.category === 'compare') &&
      signals.filter(s => s.category === 'product').length >= 2,
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
      (s.type === 'search' && s.data?.query?.toLowerCase().includes('smoothie')) ||
      (s.data?.h1?.toLowerCase().includes('smoothie')) ||
      (s.data?.path?.includes('smoothie'))
    ),
    infer: {
      use_cases: ['smoothies'],
    },
    confidence: 0.08,
  },
  {
    id: 'soup_maker',
    conditions: (signals) => signals.some(s =>
      (s.type === 'search' && s.data?.query?.toLowerCase().includes('soup')) ||
      (s.data?.h1?.toLowerCase().includes('soup')) ||
      (s.data?.path?.includes('soup'))
    ),
    infer: {
      use_cases: ['soups', 'hot_blending'],
    },
    confidence: 0.08,
  },
  {
    id: 'nut_butter_maker',
    conditions: (signals) => signals.some(s =>
      (s.type === 'search' && s.data?.query?.toLowerCase().match(/nut butter|almond butter|peanut/)) ||
      (s.data?.path?.includes('nut-butter'))
    ),
    infer: {
      use_cases: ['nut_butters'],
    },
    confidence: 0.08,
  },

  // Price Sensitivity Detection
  {
    id: 'price_sensitive',
    conditions: (signals) => signals.some(s =>
      s.category === 'financing' ||
      s.category === 'reconditioned' ||
      s.data?.path?.includes('financing') ||
      s.data?.path?.includes('affirm')
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
      const premiumProducts = ['X5', 'A3500', 'A3500i', 'A2500', 'A2500i'];
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
      signals.some(s => s.category === 'add_to_cart') ||
      signals.some(s => s.category === 'shipping'),
    infer: {
      purchase_readiness: 'high',
    },
    confidence: 0.15,
  },
  {
    id: 'medium_purchase_intent',
    conditions: (signals, profile) =>
      profile.products_considered?.length >= 1 &&
      signals.some(s => s.category === 'reviews'),
    infer: {
      purchase_readiness: 'medium_high',
    },
    confidence: 0.10,
  },

  // Time Sensitivity Detection
  {
    id: 'time_sensitive_buyer',
    conditions: (signals) =>
      signals.some(s => s.category === 'shipping') &&
      signals.some(s => s.category === 'returns'),
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
      signals.some(s => s.category === 'whats_in_box'),
    infer: {
      segments: ['first_time_buyer'],
    },
    confidence: 0.10,
  },

  // Video Engagement
  {
    id: 'video_engaged',
    conditions: (signals) => signals.some(s => s.type === 'video_complete'),
    infer: {
      decision_style: 'visual',
      content_engagement: 'high',
    },
    confidence: 0.12,
  },

  // Support/FAQ visitor
  {
    id: 'support_visitor',
    conditions: (signals) => signals.some(s => s.category === 'support'),
    infer: {
      segments: ['support_seeker'],
    },
    confidence: 0.08,
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

    // Extract product from signals
    if (signal.product) {
      this.addProductConsidered(signal.product);
    }

    // Also check for product in page title/h1 for product pages
    if (signal.category === 'product' && signal.data) {
      const name = signal.data.h1 || signal.product;
      if (name) {
        // Clean up the product name
        const cleanName = name.replace(/®|™/g, '').trim().split(' - ')[0].trim();
        this.addProductConsidered(cleanName);
      }
    }

    // Run inference rules
    this.runInference();

    return this.profile;
  }

  /**
   * Add product to considered list (deduped)
   */
  addProductConsidered(product) {
    if (!product) return;
    // Normalize product name
    const normalized = product.trim();
    if (normalized && !this.profile.products_considered.includes(normalized)) {
      this.profile.products_considered.push(normalized);
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
    const signalConfidence = this.signals.reduce((sum, s) => sum + (s.weight || 0), 0);
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
        if (!this.profile[key]) {
          this.profile[key] = [];
        }
        for (const item of value) {
          if (!this.profile[key].includes(item)) {
            this.profile[key].push(item);
          }
        }
      } else if (value !== null && value !== undefined) {
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
