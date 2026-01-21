/**
 * Vitamix Recommender Types
 * Core type definitions for the AI-driven recommendation system
 */

// ============================================
// Product Types
// ============================================

export interface Product {
  id: string;
  sku?: string;
  name: string;
  series: string;
  url: string;
  price: number;
  originalPrice?: number | null;
  availability?: 'in-stock' | 'out-of-stock' | 'limited';
  description?: string;
  tagline?: string;
  features?: string[];
  bestFor?: string[];
  warranty?: string;
  specs?: ProductSpecs;
  images?: ProductImages;
  crawledAt?: string;
  sourceUrl?: string;
  contentHash?: string;
  isCommercial?: boolean;
  /**
   * Match metadata from LLM product selection (attached at runtime).
   * Explains why this product was selected for the user's query.
   */
  matchRationale?: string;
  /**
   * Whether this is the primary/top recommendation from LLM selection.
   */
  isPrimaryMatch?: boolean;
}

export interface ProductSpecs {
  watts: number;
  capacity: string;
  programs: number;
  dimensions?: string;
  weight?: string;
  motorHP?: string;
  containerMaterial?: string;
  bladeType?: string;
}

export interface ProductImages {
  primary: string;
  gallery: string[];
  remoteUrls: string[];
}

// ============================================
// Recipe Types
// ============================================

export interface Recipe {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'advanced';
  time?: string;
  ingredients?: Ingredient[];
  instructions?: string[];
  tips?: string[];
  prepTime?: string;
  blendTime?: string;
  totalTime?: string;
  servings?: number;
  yield?: string;
  nutrition?: NutritionInfo;
  dietaryTags?: string[];
  requiredContainer?: string;
  recommendedProgram?: string;
  blenderSpeed?: string;
  recommendedProducts?: string[];
  requiredFeatures?: string[];
  images?: RecipeImages;
  url?: string;
  crawledAt?: string;
  contentHash?: string;
}

export interface Ingredient {
  item: string;
  quantity: string;
  unit?: string;
  notes?: string;
}

export interface NutritionInfo {
  calories?: number;
  protein?: string;
  carbs?: string;
  fat?: string;
  fiber?: string;
  sugar?: string;
  sodium?: string;
}

export interface RecipeImages {
  primary: string;
  steps?: string[];
  remoteUrl: string;
}

// ============================================
// Accessory Types
// ============================================

export interface Accessory {
  id: string;
  name: string;
  type: 'container' | 'tamper' | 'food-processor' | 'immersion-blender' | 'blade' | 'lid' | 'accessory';
  url: string;
  price: number;
  originalPrice?: number | null;
  availability?: 'in-stock' | 'out-of-stock' | 'limited';
  description?: string;
  features?: string[];
  specs?: AccessorySpecs;
  compatibility?: AccessoryCompatibility;
  includedItems?: string[];
  images?: ProductImages;
  crawledAt?: string;
  sourceUrl?: string;
}

export interface AccessorySpecs {
  capacity?: string;
  dimensions?: string;
  weight?: string;
  material?: string;
  dishwasherSafe?: boolean;
  bpaFree?: boolean;
}

export interface AccessoryCompatibility {
  series?: string[];
  machines?: string[];
  selfDetect?: boolean;
}

// ============================================
// Article Types (Commercial B2B Content)
// ============================================

export interface Article {
  id: string;
  title: string;
  url: string;
  category: 'commercial' | 'tco' | 'engineering' | 'sustainability';
  summary: string;
  keyPoints: string[];
  keywords: string[];
  relatedProducts?: string[];
  targetAudience: string[];
  businessContext?: ArticleBusinessContext;
  mainContent?: string;
  images?: {
    primary: string;
  };
  crawledAt?: string;
}

export interface ArticleBusinessContext {
  industryFocus?: string[];
  decisionFactors?: string[];
}

// ============================================
// Use Case Types
// ============================================

export interface UseCase {
  id: string;
  name: string;
  description: string;
  icon: string;
  relevantFeatures: string[];
  recommendedSeries: string[];
  difficultyLevel?: string;
  timeInvestment?: string;
  popularRecipes?: string[];
}

// ============================================
// Feature Types
// ============================================

export interface Feature {
  id: string;
  name: string;
  description: string;
  benefit: string;
  availableIn: string[];
}

// ============================================
// Review Types
// ============================================

export interface Review {
  id: string;
  productId?: string;
  author: string;
  authorTitle?: string;
  rating?: number;
  title?: string;
  content: string;
  verifiedPurchase?: boolean;
  useCase?: string;
  date?: string;
  sourceUrl?: string;
  sourceType?: 'bazaarvoice' | 'editorial' | 'chef' | 'customer-story' | 'third-party';
}

// ============================================
// User Persona Types
// ============================================

export interface UserPersona {
  personaId: string;
  name: string;
  demographics: {
    householdType: string;
    typicalAge?: string;
    timeAvailability: string;
    cookingSkill: string;
  };
  primaryGoals: string[];
  keyBarriers: string[];
  emotionalState: {
    frustrations: string[];
    hopes: string[];
    fears: string[];
  };
  productPriorities: { attribute: string; importance: string }[];
  effectiveMessaging: {
    validationPhrases: string[];
    benefitEmphasis: string[];
    proofPoints: string[];
    visualizations: string[];
  };
  triggerPhrases: string[];
  recommendedProducts: string[];
}

// ============================================
// Product Profile Types
// ============================================

export interface ProductProfile {
  useCaseScores: Record<string, number>;
  priceTier: 'budget' | 'mid' | 'premium';
  householdFit: ('solo' | 'couple' | 'family')[];
  standoutFeatures: string[];
  notIdealFor: string[];
}

// ============================================
// Intent & Classification Types
// ============================================

export interface IntentClassification {
  intentType: IntentType;
  confidence: number;
  entities: {
    products: string[];
    useCases: string[];
    features: string[];
    priceRange?: string;
    ingredients?: string[];  // Ingredient terms detected in query
  };
  journeyStage: JourneyStage;
}

export type IntentType =
  | 'discovery'
  | 'comparison'
  | 'product-detail'
  | 'use-case'
  | 'specs'
  | 'reviews'
  | 'price'
  | 'recommendation'
  | 'support'        // Product issues, warranty, returns
  | 'partnership'    // Affiliate, creator, B2B inquiries
  | 'gift'           // Buying for someone else
  | 'medical'        // Healthcare/therapeutic use
  | 'accessibility'; // Physical limitations focus

// User mode for adapting response style
export type UserMode =
  | 'quick'      // Wants fast answer
  | 'research'   // Wants depth
  | 'gift'       // Buying for others
  | 'support'    // Has a problem
  | 'commercial'; // B2B inquiry

export type JourneyStage = 'exploring' | 'comparing' | 'deciding';

// ============================================
// Block Selection Types
// ============================================

export interface BlockSelection {
  type: BlockType;
  variant?: string;
  priority: number;
  rationale: string;
  contentGuidance: string;
}

export type BlockType =
  | 'hero'
  | 'product-hero'
  | 'reasoning'
  | 'reasoning-user'
  | 'product-cards'
  | 'recipe-cards'
  | 'comparison-table'
  | 'specs-table'
  | 'product-recommendation'
  | 'feature-highlights'
  | 'use-case-cards'
  | 'testimonials'
  | 'faq'
  | 'follow-up'
  | 'follow-up-advisor'   // Insightful follow-up with journey awareness
  | 'split-content'
  | 'columns'
  | 'text'
  // New blocks for improved user experience
  | 'quick-answer'        // Simple direct answer for quick questions
  | 'support-triage'      // Help frustrated customers
  | 'budget-breakdown'    // Price/value transparency
  | 'accessibility-specs' // Physical/ergonomic specs
  | 'empathy-hero'        // Warm, acknowledging hero variant
  | 'best-pick'           // Prominent "Best Pick" callout before comparisons
  // Phase 2 blocks
  | 'sustainability-info' // Environmental responsibility
  | 'smart-features'      // Connected/app capabilities
  | 'engineering-specs'   // Deep technical specifications
  | 'noise-context'       // Real-world noise comparisons
  | 'allergen-safety';    // Cross-contamination protocols

// ============================================
// Product Selection Types (LLM-driven)
// ============================================

/**
 * LLM-selected product with rationale.
 * The reasoning engine selects products from the full catalog based on
 * user context, replacing hardcoded keyword filters.
 */
export interface ProductSelection {
  /** Product ID from the catalog */
  id: string;
  /** Why this product was selected for this query */
  rationale: string;
  /** Whether this is the primary recommendation */
  isPrimary: boolean;
  /** Context type that drove selection */
  contextType: 'commercial' | 'consumer' | 'either';
}

// ============================================
// Reasoning Types
// ============================================

export interface ReasoningResult {
  selectedBlocks: BlockSelection[];
  reasoning: ReasoningTrace;
  userJourney: UserJourneyPlan;
  /**
   * Dual confidence scores for more nuanced recommendation decisions.
   *
   * - intentConfidence: How well we understand what the user wants (0-1)
   *   Example: "kids recipes" → 0.94 (clear intent)
   *
   * - productMatchConfidence: How confident we are that a specific product
   *   is clearly the best choice for their needs (0-1)
   *   Example: "kids recipes" → 0.35 (many products work equally well)
   *
   * Product recommendations require high productMatchConfidence, not just
   * high intentConfidence. A user might have a clear need but no single
   * product is obviously best for that need.
   */
  confidence: {
    intent: number;
    productMatch: number;
  };
  /** @deprecated Use confidence.intent instead. Kept for backward compatibility. */
  confidenceLegacy?: number;
  /**
   * LLM-selected products from the full catalog.
   * These override RAG context products when present.
   */
  selectedProducts?: ProductSelection[];
  /** Rationale for overall product selection strategy */
  productSelectionRationale?: string;
}

export interface ReasoningTrace {
  intentAnalysis: string;
  userNeedsAssessment: string;
  blockSelectionRationale: BlockRationale[];
  alternativesConsidered: string[];
  finalDecision: string;
}

export interface BlockRationale {
  blockType: BlockType;
  reason: string;
  contentFocus: string;
}

export interface UserJourneyPlan {
  currentStage: JourneyStage;
  nextBestAction: string;
  suggestedFollowUps: string[];
  /** Structured advisor follow-up data (optional, generated separately) */
  advisorFollowUp?: AdvisorFollowUp;
}

// ============================================
// Session Context Types
// ============================================

export interface SessionContext {
  previousQueries: QueryHistoryItem[];
  profile?: UserProfile;
}

// ============================================
// Extension Context Types (Full Context Mode)
// ============================================

/**
 * Full context from the browser extension
 * Contains signals, query, conversation history, and inferred profile
 */
export interface ExtensionContext {
  /** Captured browsing signals from vitamix.com */
  signals: ExtensionSignal[];
  /** Current user query (optional) */
  query: string | null;
  /** Previous queries in the session for conversation continuity */
  previousQueries: string[];
  /** Inferred user profile from signals */
  profile: ExtensionProfile;
  /** Timestamp when context was created */
  timestamp: number;
}

export interface ExtensionSignal {
  id: string;
  type: string;
  category: string;
  label: string;
  weight: number;
  weightLabel: string;
  icon: string;
  timestamp: number;
  data: Record<string, unknown>;
  product?: string;
}

export interface ExtensionProfile {
  segments: string[];
  life_stage: string | null;
  use_cases: string[];
  products_considered: string[];
  price_sensitivity: string | null;
  decision_style: string | null;
  purchase_readiness: string | null;
  shopping_for: string | null;
  occasion: string | null;
  brand_relationship: string | null;
  content_engagement: string | null;
  time_sensitive: boolean | null;
  confidence_score: number;
  signals_count: number;
  session_count: number;
  first_visit: number | null;
  last_visit: number | null;
}

export interface QueryHistoryItem {
  query: string;
  intent: string;
  entities?: {
    products: string[];
    ingredients: string[];
    goals: string[];
  };
  // Enriched context fields
  recommendedProducts?: string[];
  recommendedRecipes?: string[];
  blockTypes?: string[];
  journeyStage?: JourneyStage;
  confidence?: number;
  nextBestAction?: string;
}

export interface UserProfile {
  useCases?: string[];
  priceRange?: 'budget' | 'mid' | 'premium';
  productsViewed?: string[];
  concerns?: string[];
  journeyStage: JourneyStage;
}

// ============================================
// RAG Context Types
// ============================================

export interface RAGContext {
  chunks: ContentChunk[];
  products: Product[];
  recipes: Recipe[];
}

export interface ContentChunk {
  id: string;
  text: string;
  metadata: {
    contentType: string;
    pageTitle: string;
    sourceUrl: string;
  };
  score: number;
}

// ============================================
// SSE Event Types
// ============================================

export type SSEEvent =
  | { event: 'generation-start'; data: { query: string; estimatedBlocks: number } }
  | { event: 'reasoning-start'; data: { model: string; preset?: string; heroFastPath?: boolean } }
  | { event: 'reasoning-step'; data: { stage: string; title: string; content: string } }
  | { event: 'reasoning-complete'; data: { confidence: { intent: number; productMatch: number }; duration: number } }
  | { event: 'block-start'; data: { blockType: BlockType; index: number; fastPath?: boolean } }
  | { event: 'block-content'; data: { html: string; sectionStyle?: string; heroComposition?: { textPlacement: string; backgroundTone: string; aspectRatio: string } } }
  | { event: 'block-rationale'; data: { blockType: BlockType; rationale: string } }
  | { event: 'image-ready'; data: { imageId: string; url: string } }
  | { event: 'suggestion-enhancement'; data: SuggestionEnhancementData }
  | { event: 'generation-complete'; data: GenerationCompleteData }
  | { event: 'error'; data: { message: string; code?: string } };

/**
 * Enhanced suggestions from background AI reasoning.
 * Sent after all blocks are streamed, providing deeper insights.
 */
export interface SuggestionEnhancementData {
  /** Enhanced suggestions with deeper rationale */
  suggestions: StructuredSuggestion[];
  /** Detected research gaps */
  gaps: ResearchGap[];
}

// Enriched generation-complete event data
export interface GenerationCompleteData {
  totalBlocks: number;
  duration: number;
  intent?: IntentClassification;
  reasoning?: {
    journeyStage: JourneyStage;
    confidence: { intent: number; productMatch: number };
    nextBestAction: string;
    suggestedFollowUps: string[];
  };
  recommendations?: {
    products: string[];
    recipes: string[];
    blockTypes: string[];
  };
}

// ============================================
// Model Configuration Types
// ============================================

export type ModelRole = 'reasoning' | 'content' | 'classification' | 'validation';

export type ModelProvider = 'anthropic' | 'cerebras' | 'google';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ModelPreset {
  reasoning: ModelConfig;
  content: ModelConfig;
  classification: ModelConfig;
  validation: ModelConfig;
}

// ============================================
// Environment Bindings
// ============================================

export interface Env {
  // AI Services
  ANTHROPIC_API_KEY: string;
  CEREBRAS_API_KEY?: string;
  CEREBRAS_KEY?: string;  // Alternative name used in some deployments
  GOOGLE_API_KEY?: string;

  // Cloudflare Bindings
  AI: Ai;
  VECTORIZE?: VectorizeIndex;
  SESSIONS?: KVNamespace;
  HERO_IMAGES?: R2Bucket;

  // DA (Document Authoring) Configuration
  DA_ORG: string;
  DA_REPO: string;
  // S2S Authentication (preferred)
  DA_CLIENT_ID?: string;
  DA_CLIENT_SECRET?: string;
  DA_SERVICE_TOKEN?: string;
  // Legacy static token (fallback)
  DA_TOKEN?: string;

  // Configuration
  MODEL_PRESET?: string;
  DEBUG?: string;
}

// ============================================
// Signal Interpretation Types (Direct LLM Analysis)
// ============================================

/**
 * Result of direct LLM interpretation of browsing signals.
 * This replaces the rule-based profile engine for understanding user intent.
 *
 * Benefits over rule-based approach:
 * - Flexibility: Understands "kids recipes" without explicit rule
 * - Specificity: Captures nuances like "hiding vegetables from picky toddler"
 * - Zero maintenance: No rules to update for new use cases
 */
export interface SignalInterpretation {
  interpretation: {
    /** What the user is fundamentally trying to accomplish (specific) */
    primaryIntent: string;
    /** List of specific needs/concerns extracted from signals */
    specificNeeds: string[];
    /** Emotional context (e.g., "frustrated parent", "excited gift-giver") */
    emotionalContext: string;
    /** Where they are in their decision journey */
    journeyStage: 'exploring' | 'comparing' | 'deciding';
    /** Important observations about this user */
    keyInsights: string[];
  };
  /** Intent classification derived from signal interpretation */
  classification: IntentClassification;
  /** Content recommendations based on signal analysis */
  contentRecommendation: {
    /** How should the hero speak to them */
    heroTone: string;
    /** Which block types would be most helpful */
    prioritizeBlocks: string[];
    /** Which blocks would be irrelevant */
    avoidBlocks: string[];
    /** Specific content guidance based on their signals */
    specialGuidance: string;
  };
}

// ============================================
// Follow-up Advisor Types (Insightful Suggestions)
// ============================================

/** Available icon types for suggestion cards */
export type SuggestionIcon = 'compare' | 'recipes' | 'star' | 'shield' | 'gear' | 'lightbulb' | 'help' | 'accessories';

/**
 * A structured follow-up suggestion with context and rationale.
 * Unlike simple text chips, these explain WHY a suggestion is relevant.
 */
export interface StructuredSuggestion {
  /** The actual search query to execute */
  query: string;
  /** Display text (conversational headline) */
  headline: string;
  /** 1-2 sentence explanation of why this helps */
  rationale: string;
  /** Category for visual grouping */
  category: 'go-deeper' | 'explore-more' | 'fill-gap';
  /** Priority: 1 = primary (featured), 2-4 = secondary */
  priority: 1 | 2 | 3 | 4;
  /** Confidence score for this suggestion */
  confidence: number;
  /** Data points for "Why I suggest this" expandable section */
  whyBullets: string[];
  /** Icon to display on the card (optional, falls back to category-based icon) */
  icon?: SuggestionIcon;
}

/**
 * Research gap - something the user hasn't explored yet that would help.
 */
export interface ResearchGap {
  /** Type of content gap */
  type: 'recipes' | 'reviews' | 'warranty' | 'accessories' | 'specs' | 'comparisons';
  /** Query to fill this gap */
  query: string;
  /** Display label (e.g., "Warranty Coverage") */
  label: string;
  /** Brief explanation of why this matters (e.g., "10-year warranty — worth knowing") */
  explanation: string;
}

/**
 * Complete advisor follow-up data with journey awareness and gap detection.
 */
export interface AdvisorFollowUp {
  /** Current journey stage for progress indicator */
  journeyStage: JourneyStage;
  /** Structured suggestions (1 primary + 2 secondary max) */
  suggestions: StructuredSuggestion[];
  /** Detected research gaps based on session history */
  gaps: ResearchGap[];
}

// ============================================
// Content Types
// ============================================

export type ContentType = 'recipes' | 'reviews' | 'specs' | 'warranty' | 'comparison' | 'accessories';
