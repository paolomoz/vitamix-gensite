/**
 * Hero Image Configuration
 *
 * AI-analyzed hero images with intelligent selection based on categories, tags, and quality scores.
 * Images are selected based on the classified intent, use cases, and query keywords.
 */

// ============================================
// Types
// ============================================

export type TextPlacement = 'left' | 'right' | 'center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
export type BackgroundTone = 'light' | 'dark' | 'mixed';
export type AspectRatio = 'wide' | 'square';

/** Result from hero image selection including composition metadata */
export interface HeroImageSelection {
  url: string;
  textPlacement: TextPlacement;
  backgroundTone: BackgroundTone;
  aspectRatio: AspectRatio;
}

interface ImageAnalysis {
  primary_category: string;
  secondary_tags: string[];
  dominant_colors: string[];
  mood: string;
  content_description: string;
  quality_score: number;
  hero_suitable: boolean;
  hero_notes: string;
  /** Where text should be placed based on image composition */
  text_placement: TextPlacement;
  /** Whether the image background is predominantly light or dark (affects text color) */
  background_tone: BackgroundTone;
  /** Image aspect ratio: 'wide' (>1.4) for full-width hero, 'square' (<=1.4) for split layout */
  aspect_ratio: AspectRatio;
}

// ============================================
// Analyzed Image Data (AI-generated)
// ============================================

const ANALYZED_IMAGES: Record<string, ImageAnalysis> = {
  // Seed images (high-quality marketing images)
  'https://www.vitamix.com/vr/en_us/media_1e3c9537df82d212a4b48020802855aee927b1c39.jpg?width=2880&format=webply&optimize=medium': {
    primary_category: 'product',
    secondary_tags: ['premium', 'colorful', 'kitchen'],
    dominant_colors: ['black', 'white'],
    mood: 'premium',
    content_description: 'A lineup of various Vitamix blenders with different colored fruits and ingredients',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero banner composition with clean white background',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'wide', // 2880x960 = 3.00
  },
  'https://www.vitamix.com/vr/en_us/media_1a7165d05e047cd6a2f5911a6b435911f6e6831c3.jpg?width=2000&format=webply&optimize=medium': {
    primary_category: 'product',
    secondary_tags: ['premium', 'sleek', 'professional'],
    dominant_colors: ['black', 'gray'],
    mood: 'sophisticated',
    content_description: 'Sleek black Vitamix blender with digital display against dramatic dark background',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero banner with dramatic lighting, product on right',
    text_placement: 'left',
    background_tone: 'dark',
    aspect_ratio: 'wide', // 2000x667 = 3.00
  },
  'https://www.vitamix.com/vr/en_us/media_1cb9b388991002a446ef15505cee322d580ad7c70.png?width=2000&format=webply&optimize=medium': {
    primary_category: 'product',
    secondary_tags: ['premium', 'kitchen', 'professional'],
    dominant_colors: ['gray', 'black'],
    mood: 'premium',
    content_description: 'Two Vitamix blenders side by side against white textured wall',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero banner with professional product photography',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'wide', // 2000x667 = 3.00
  },
  'https://www.vitamix.com/vr/en_us/media_1d07ef5e65686be3cfb2316dfd4bb114dc8a23cfa.png?width=2000&format=webply&optimize=medium': {
    primary_category: 'drink',
    secondary_tags: ['citrus', 'premium', 'lifestyle'],
    dominant_colors: ['terracotta orange', 'black'],
    mood: 'sophisticated',
    content_description: 'Black Vitamix blender with orange citrus drinks and warm terracotta wall',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with warm sophisticated color palette, blender on left',
    text_placement: 'right',
    background_tone: 'mixed',
    aspect_ratio: 'wide', // 2000x667 = 3.00
  },
  'https://www.vitamix.com/vr/en_us/media_173b0af31e9a6005fb510fb98a5f8564e0c303743.png?width=2000&format=webply&optimize=medium': {
    primary_category: 'smoothie',
    secondary_tags: ['fresh', 'colorful', 'healthy'],
    dominant_colors: ['coral-pink', 'white'],
    mood: 'refreshing',
    content_description: 'Two coral-pink smoothies with fresh fruits including oranges, limes, and strawberries',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with clean white background, drinks on left',
    text_placement: 'right',
    background_tone: 'light',
    aspect_ratio: 'wide', // 2000x1316 = 1.52
  },
  'https://www.vitamix.com/vr/en_us/media_17286266c121381b60a6f884769cacb659f79857f.png?width=2000&format=webply&optimize=medium': {
    primary_category: 'drink',
    secondary_tags: ['creamy', 'indulgent', 'premium'],
    dominant_colors: ['beige', 'white'],
    mood: 'sophisticated',
    content_description: 'Three iced coffee drinks with caramel swirls alongside coffee beans',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with minimalist composition, drinks on right',
    text_placement: 'left',
    background_tone: 'light',
    aspect_ratio: 'wide', // 2000x1316 = 1.52
  },
  'https://www.vitamix.com/us/en_us/media_1f845f3ad5b1a676ae33657c7020c136058716dcb.jpg?width=2880&format=webply&optimize=medium': {
    primary_category: 'product',
    secondary_tags: ['kitchen', 'premium', 'versatile'],
    dominant_colors: ['black', 'beige'],
    mood: 'premium',
    content_description: 'Complete Vitamix food processing system with multiple attachments',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero showing product versatility, products spread across',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'wide', // 2880x1871 = 1.54
  },
  'https://www.vitamix.com/us/en_us/media_1f46d4f073301a5a107d943a2e0582c5a5730f75c.jpg?width=2000&format=webply&optimize=medium': {
    primary_category: 'soup',
    secondary_tags: ['warm', 'creamy', 'premium'],
    dominant_colors: ['orange', 'black'],
    mood: 'sophisticated',
    content_description: 'Orange creamy soup in white bowl with Vitamix blender',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with premium styling, soup on left, blender on right',
    text_placement: 'bottom-center',
    background_tone: 'dark',
    aspect_ratio: 'wide', // 2000x465 = 4.30
  },
  'https://www.vitamix.com/us/en_us/media_1859c4336854855200d7f4e3fdb348d58c7c79ad3.png?width=2000&format=webply&optimize=medium': {
    primary_category: 'drink',
    secondary_tags: ['fresh', 'premium', 'kitchen'],
    dominant_colors: ['yellow', 'beige'],
    mood: 'premium',
    content_description: 'Two golden smoothies with peach garnish next to Vitamix blender',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with aspirational lifestyle setting, drinks left, blender right',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'wide', // 2000x1316 = 1.52
  },
  'https://www.vitamix.com/us/en_us/media_1b534edd91b082175239ebe6a0169bfde676dae77.png?width=2000&format=webply&optimize=medium': {
    primary_category: 'lifestyle',
    secondary_tags: ['premium', 'kitchen', 'creamy'],
    dominant_colors: ['beige', 'black'],
    mood: 'premium',
    content_description: 'Vitamix blender on marble counter with smoothies and fresh strawberries',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with premium lifestyle context, blender on right',
    text_placement: 'left',
    background_tone: 'light',
    aspect_ratio: 'wide', // 2000x1316 = 1.52
  },
  'https://www.vitamix.com/us/en_us/media_1473ee7bbcdfc96b4f65f4e66e4a2f16e1fe9d9c8.png?width=2000&format=webply&optimize=medium': {
    primary_category: 'smoothie',
    secondary_tags: ['colorful', 'fresh', 'premium'],
    dominant_colors: ['pink', 'beige'],
    mood: 'healthy',
    content_description: 'Pink smoothie bowl topped with fresh berries',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with dramatic lighting, bowl centered',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'wide', // 2000x1316 = 1.52
  },

  // Discovered images from vitamix.com
  'https://www.vitamix.com/us/en_us/media_104aa11fe9cafe1d33a0e4e1103b5463a3e8ebf89.png?width=2000&format=webply&optimize=medium': {
    primary_category: 'healthy',
    secondary_tags: ['fresh', 'premium', 'kitchen'],
    dominant_colors: ['dark gray', 'deep red'],
    mood: 'sophisticated',
    content_description: 'Overhead view of fresh vegetables around Vitamix blender',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with premium dark aesthetic, blender centered',
    text_placement: 'center',
    background_tone: 'dark',
    aspect_ratio: 'wide', // 1920x450 = 4.27
  },
  'https://www.vitamix.com/content/dam/vitamix/home/home-page/AscentX4_Image_PopUpWindow.jpg': {
    primary_category: 'product',
    secondary_tags: ['colorful', 'fresh', 'premium'],
    dominant_colors: ['gray', 'red'],
    mood: 'premium',
    content_description: 'Vitamix blender with mixed berries against corrugated metal background',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with clean product focus, product centered',
    text_placement: 'bottom-center',
    background_tone: 'dark',
    aspect_ratio: 'square', // 3612x5418 = 0.67 (portrait)
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipes/recipe-center-icons/GETTING%20STARTED.jpg': {
    primary_category: 'product',
    secondary_tags: ['kitchen', 'fresh', 'premium'],
    dominant_colors: ['black', 'green'],
    mood: 'premium',
    content_description: 'Hand operating Vitamix blender with green vegetables',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero showing product in use, action on right',
    text_placement: 'left',
    background_tone: 'light',
    aspect_ratio: 'square', // 236x236 = 1.00
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipes/recipe-center-icons/SMOOTHIES%20NON-DIARY%20MILKS%20%20BEVERAGES.jpg': {
    primary_category: 'smoothie',
    secondary_tags: ['healthy', 'colorful', 'fresh'],
    dominant_colors: ['purple', 'pink'],
    mood: 'healthy',
    content_description: 'Multiple glasses of vibrant purple berry smoothies',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'Excellent hero with clean composition, glasses spread across',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'square', // 236x236 = 1.00
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipes/recipe-center-icons/SOUPS.jpg': {
    primary_category: 'soup',
    secondary_tags: ['creamy', 'warm', 'premium'],
    dominant_colors: ['green', 'brown'],
    mood: 'comforting',
    content_description: 'Two bowls of creamy green soup with herbs',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with sophisticated food styling, bowls centered',
    text_placement: 'bottom-center',
    background_tone: 'mixed',
    aspect_ratio: 'square', // 236x236 = 1.00
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipes/recipe-center-icons/ICE%20CREAM%20%20FROZEN%20TREATS.jpg': {
    primary_category: 'dessert',
    secondary_tags: ['indulgent', 'creamy', 'premium'],
    dominant_colors: ['pink', 'brown'],
    mood: 'indulgent',
    content_description: 'Bowl of ice cream scoops with chocolate chips',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero showing frozen dessert, bowl centered',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'square', // 236x236 = 1.00
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipes/recipe-center-icons/DIPS%20SPREADS%20%20NUT%20BUTTERS.jpg': {
    primary_category: 'sauce',
    secondary_tags: ['green', 'fresh', 'premium'],
    dominant_colors: ['green', 'pink'],
    mood: 'premium',
    content_description: 'Hand dipping carrot into vibrant green sauce',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero showcasing blended sauce, action on left',
    text_placement: 'right',
    background_tone: 'light',
    aspect_ratio: 'square', // 236x236 = 1.00
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipes/recipe-center-icons/AER%20DISC.jpg': {
    primary_category: 'drink',
    secondary_tags: ['green', 'fresh', 'premium'],
    dominant_colors: ['green', 'terracotta'],
    mood: 'sophisticated',
    content_description: 'Hand pouring layered green smoothie from pitcher',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero showing product in action, pouring on left',
    text_placement: 'right',
    background_tone: 'mixed',
    aspect_ratio: 'square', // 236x236 = 1.00
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipes/recipe-center-icons/FOOD%20PROCESSOR%20ATTACHMENT.jpg': {
    primary_category: 'dessert',
    secondary_tags: ['indulgent', 'premium', 'kitchen'],
    dominant_colors: ['mint green', 'brown'],
    mood: 'indulgent',
    content_description: 'Overhead view of Vitamix with chocolate dessert mixture',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with premium styling, overhead composition',
    text_placement: 'center',
    background_tone: 'mixed',
    aspect_ratio: 'square', // 236x236 = 1.00
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipe-center/TrendingRecipes_BlueSpirulinaTropicalSmoothie_1.jpg': {
    primary_category: 'smoothie',
    secondary_tags: ['creamy', 'fresh', 'premium'],
    dominant_colors: ['blue', 'white'],
    mood: 'premium',
    content_description: 'Blue smoothie in clear glass mug with fresh berries',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with unusual blue color, drink on left',
    text_placement: 'right',
    background_tone: 'light',
    aspect_ratio: 'square', // 500x500 = 1.00
  },
  'https://www.vitamix.com/content/dam/vitamix/global/Triple-Berry-Smoothie-square.jpg': {
    primary_category: 'smoothie',
    secondary_tags: ['healthy', 'fresh', 'colorful'],
    dominant_colors: ['purple', 'white'],
    mood: 'healthy',
    content_description: 'Two purple berry smoothies surrounded by fresh berries',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero with wide horizontal layout, drinks centered',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'square', // 470x449 = 1.05
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipes/recipe-center-icons/COCKTAILS.jpg': {
    primary_category: 'cocktail',
    secondary_tags: ['fresh', 'premium', 'sophisticated'],
    dominant_colors: ['golden yellow', 'pale green'],
    mood: 'sophisticated',
    content_description: 'Hand garnishing pale green cocktail with cucumber',
    quality_score: 7,
    hero_suitable: true,
    hero_notes: 'Good composition, drink on left with blender',
    text_placement: 'right',
    background_tone: 'mixed',
    aspect_ratio: 'square', // 236x236 = 1.00
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipes/recipe-center-icons/baby-food-purees.jpg': {
    primary_category: 'sauce',
    secondary_tags: ['creamy', 'premium', 'kitchen'],
    dominant_colors: ['golden yellow', 'cream white'],
    mood: 'sophisticated',
    content_description: 'Two bowls of golden creamy sauces on marble surface',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'Excellent composition with sophisticated styling, bowls centered',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'square', // 236x236 = 1.00
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipe-center/TrendingRecipes_RaspberryChiaSpread_3.jpg': {
    primary_category: 'sauce',
    secondary_tags: ['colorful', 'fresh', 'premium'],
    dominant_colors: ['pink', 'orange'],
    mood: 'sophisticated',
    content_description: 'Artisanal pink jam in glass jars with orange slices',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'Excellent composition with premium aesthetic, jars spread',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'square', // 500x500 = 1.00
  },
  'https://www.vitamix.com/content/dam/vitamix/home/recipes/recipe-center-icons/IMMERSION%20BLENDER.jpg': {
    primary_category: 'soup',
    secondary_tags: ['warm', 'kitchen', 'premium'],
    dominant_colors: ['red', 'white'],
    mood: 'warm',
    content_description: 'Hand using immersion blender in red soup',
    quality_score: 7,
    hero_suitable: true,
    hero_notes: 'Good composition showing product in use, action centered',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'square', // 236x236 = 1.00
  },

  // Commercial Product Images
  'https://www.vitamix.com/vr/en_us/media_18fbdf0060d121273469bde5e1717c19e7024b7ea.avif?width=2000&format=webply&optimize=medium': {
    primary_category: 'commercial',
    secondary_tags: ['professional', 'quick-quiet', 'high-volume', 'juice-bar'],
    dominant_colors: ['black', 'silver'],
    mood: 'professional',
    content_description: 'Vitamix Quick & Quiet commercial blender for high-volume operations',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero for commercial/B2B, product centered',
    text_placement: 'left',
    background_tone: 'dark',
    aspect_ratio: 'square', // 520x730 = 0.71 (portrait)
  },
  'https://www.vitamix.com/vr/en_us/media_10e23c3177a71c88f42d49908b8e97e7b0ba4f96b.avif?width=2000&format=webply&optimize=medium': {
    primary_category: 'commercial',
    secondary_tags: ['professional', 'vita-prep', 'kitchen', 'restaurant'],
    dominant_colors: ['black', 'silver'],
    mood: 'professional',
    content_description: 'Vitamix Vita-Prep commercial blender for professional kitchens',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero for commercial/B2B, product centered',
    text_placement: 'left',
    background_tone: 'dark',
    aspect_ratio: 'square', // 520x730 = 0.71 (portrait)
  },
  'https://www.vitamix.com/vr/en_us/media_1ade32ab77d597fe18650da3242beecef488955b7.avif?width=2000&format=webply&optimize=medium': {
    primary_category: 'commercial',
    secondary_tags: ['professional', 'xl', 'high-capacity', 'batch'],
    dominant_colors: ['black', 'silver'],
    mood: 'professional',
    content_description: 'Vitamix XL commercial blender for large batch preparation',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero for commercial/B2B, dramatic angle',
    text_placement: 'left',
    background_tone: 'dark',
    aspect_ratio: 'square', // 520x730 = 0.71 (portrait)
  },
  'https://www.vitamix.com/vr/en_us/media_1a218a4d1ddefd76a4988312570922a56401af0c9.avif?width=2000&format=webply&optimize=medium': {
    primary_category: 'commercial',
    secondary_tags: ['professional', 'quiet-one', 'front-of-house', 'cafe'],
    dominant_colors: ['black', 'silver'],
    mood: 'professional',
    content_description: 'Vitamix The Quiet One commercial blender for front-of-house operations',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero for commercial/B2B, product centered',
    text_placement: 'left',
    background_tone: 'dark',
    aspect_ratio: 'square', // 520x730 = 0.71 (portrait)
  },
};

// ============================================
// Category Mappings
// ============================================

/**
 * Maps use case keywords to image categories
 * Ordered from most specific to least specific
 */
const USE_CASE_TO_CATEGORY: Record<string, string> = {
  // Smoothies
  'smoothie': 'smoothie',
  'smoothies': 'smoothie',
  'green smoothie': 'smoothie',
  'protein shake': 'smoothie',
  'shake': 'smoothie',
  'smoothie bowl': 'smoothie',
  // Soups
  'soup': 'soup',
  'soups': 'soup',
  'hot soup': 'soup',
  'bisque': 'soup',
  'chowder': 'soup',
  // Drinks
  'drink': 'drink',
  'drinks': 'drink',
  'beverage': 'drink',
  'juice': 'drink',
  'lemonade': 'drink',
  'tea': 'drink',
  'latte': 'drink',
  'coffee': 'drink',
  // Cocktails
  'cocktail': 'cocktail',
  'cocktails': 'cocktail',
  'margarita': 'cocktail',
  'martini': 'cocktail',
  'mojito': 'cocktail',
  'daiquiri': 'cocktail',
  // Desserts
  'dessert': 'dessert',
  'desserts': 'dessert',
  'ice cream': 'dessert',
  'frozen': 'dessert',
  'nice cream': 'dessert',
  'sorbet': 'dessert',
  // Sauces
  'sauce': 'sauce',
  'sauces': 'sauce',
  'dip': 'sauce',
  'dips': 'sauce',
  'spread': 'sauce',
  'dressing': 'sauce',
  'nut butter': 'sauce',
  'hummus': 'sauce',
  'guacamole': 'sauce',
  // Healthy
  'healthy': 'healthy',
  'wellness': 'healthy',
  'diet': 'healthy',
  'nutrition': 'healthy',
  // Product
  'product': 'product',
  'blender': 'product',
  'vitamix': 'product',
  'compare': 'product',
  'comparison': 'product',
  // Lifestyle
  'lifestyle': 'lifestyle',
  'kitchen': 'lifestyle',
  // Commercial
  'commercial': 'commercial',
  'restaurant': 'commercial',
  'cafe': 'commercial',
  'juice bar': 'commercial',
  'smoothie bar': 'commercial',
  'food service': 'commercial',
  'foodservice': 'commercial',
  'professional': 'commercial',
  'high volume': 'commercial',
  'high-volume': 'commercial',
  'b2b': 'commercial',
  'business': 'commercial',
  'hotel': 'commercial',
  'chain': 'commercial',
  'franchise': 'commercial',
};

/**
 * Maps intent types to preferred categories (rebalanced to reduce smoothie bias)
 */
const INTENT_TO_CATEGORIES: Record<string, string[]> = {
  'discovery': ['product', 'drink', 'soup', 'lifestyle', 'healthy'],
  'comparison': ['product', 'lifestyle'],
  'product-detail': ['product'],
  'use-case': ['smoothie', 'soup', 'drink', 'dessert'],
  'specs': ['product', 'lifestyle'],
  'reviews': ['product', 'lifestyle'],
  'price': ['product'],
  'recommendation': ['product', 'soup', 'drink', 'dessert'],
  'support': ['product', 'lifestyle'],
  'gift': ['dessert', 'drink', 'lifestyle'],
  'medical': ['soup', 'healthy', 'smoothie'],
  'accessibility': ['soup', 'product', 'lifestyle'],
  'partnership': ['commercial', 'product', 'lifestyle'],
};

// ============================================
// Selection Functions
// ============================================

/**
 * Gets all hero-suitable images filtered by minimum quality score
 */
function getHeroSuitableImages(minScore = 7): Array<{ url: string; analysis: ImageAnalysis }> {
  return Object.entries(ANALYZED_IMAGES)
    .filter(([, analysis]) => analysis.hero_suitable && analysis.quality_score >= minScore)
    .map(([url, analysis]) => ({ url, analysis }));
}

/**
 * Scores an image based on how well it matches the query/intent
 */
function scoreImageMatch(
  analysis: ImageAnalysis,
  targetCategory: string | null,
  query?: string
): number {
  let score = 0;

  // Primary category match (highest priority)
  if (targetCategory && analysis.primary_category === targetCategory) {
    score += 10;
  }

  // Secondary tag matches
  if (targetCategory && analysis.secondary_tags.includes(targetCategory)) {
    score += 5;
  }

  // Query keyword matches in tags
  if (query) {
    const queryLower = query.toLowerCase();
    for (const tag of analysis.secondary_tags) {
      if (queryLower.includes(tag)) {
        score += 3;
      }
    }
    // Check mood match
    if (queryLower.includes(analysis.mood)) {
      score += 2;
    }
  }

  // Quality bonus
  score += analysis.quality_score;

  return score;
}

/**
 * Selects an appropriate hero image based on intent, use cases, and query
 *
 * @param intentType - The classified intent type
 * @param useCases - Array of extracted use cases from the query
 * @param query - The original user query (for keyword matching)
 * @returns Full URL to a hero image
 */
// Commercial keywords that should take priority for hero selection
const COMMERCIAL_QUERY_KEYWORDS = [
  'commercial', 'restaurant', 'cafe', 'coffee shop', 'juice bar', 'smoothie bar',
  'food service', 'foodservice', 'professional', 'high volume', 'high-volume',
  'b2b', 'business', 'hotel', 'chain', 'franchise', 'catering',
];

export function selectHeroImage(
  intentType?: string,
  useCases?: string[],
  query?: string
): string {
  const candidates = getHeroSuitableImages(7);

  if (candidates.length === 0) {
    // Fallback to first analyzed image if no candidates
    const firstUrl = Object.keys(ANALYZED_IMAGES)[0];
    return firstUrl;
  }

  let targetCategory: string | null = null;

  // PRIORITY 1: Check for commercial keywords in query (highest priority for B2B)
  if (query) {
    const queryLower = query.toLowerCase();
    for (const keyword of COMMERCIAL_QUERY_KEYWORDS) {
      if (queryLower.includes(keyword)) {
        targetCategory = 'commercial';
        break;
      }
    }
  }

  // PRIORITY 2: Try to determine target category from use cases
  if (!targetCategory && useCases && useCases.length > 0) {
    for (const useCase of useCases) {
      const normalizedUseCase = useCase.toLowerCase().trim();
      if (USE_CASE_TO_CATEGORY[normalizedUseCase]) {
        targetCategory = USE_CASE_TO_CATEGORY[normalizedUseCase];
        break;
      }
      // Partial match
      for (const [keyword, category] of Object.entries(USE_CASE_TO_CATEGORY)) {
        if (normalizedUseCase.includes(keyword)) {
          targetCategory = category;
          break;
        }
      }
      if (targetCategory) break;
    }
  }

  // PRIORITY 3: Try to match from query keywords (non-commercial)
  if (!targetCategory && query) {
    const queryLower = query.toLowerCase();
    for (const [keyword, category] of Object.entries(USE_CASE_TO_CATEGORY)) {
      if (queryLower.includes(keyword)) {
        targetCategory = category;
        break;
      }
    }
  }

  // Fall back to intent-based category selection
  if (!targetCategory && intentType) {
    const intentCategories = INTENT_TO_CATEGORIES[intentType] || ['product', 'lifestyle'];
    targetCategory = intentCategories[Math.floor(Math.random() * intentCategories.length)];
  }

  // Score all candidates
  const scoredCandidates = candidates.map(({ url, analysis }) => ({
    url,
    analysis,
    score: scoreImageMatch(analysis, targetCategory, query),
  }));

  // Sort by score (highest first)
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Take top candidates (with some randomization for variety)
  const topCandidates = scoredCandidates.slice(0, Math.min(5, scoredCandidates.length));

  // Weighted random selection from top candidates
  const totalScore = topCandidates.reduce((sum, c) => sum + c.score, 0);
  let random = Math.random() * totalScore;

  for (const candidate of topCandidates) {
    random -= candidate.score;
    if (random <= 0) {
      return candidate.url;
    }
  }

  // Fallback to top candidate
  return topCandidates[0].url;
}

/**
 * Selects an appropriate hero image with full composition metadata
 *
 * @param intentType - The classified intent type
 * @param useCases - Array of extracted use cases from the query
 * @param query - The original user query (for keyword matching)
 * @returns HeroImageSelection with URL and composition metadata
 */
export function selectHeroImageWithMetadata(
  intentType?: string,
  useCases?: string[],
  query?: string
): HeroImageSelection {
  const candidates = getHeroSuitableImages(7);

  // Default fallback values
  const defaultResult: HeroImageSelection = {
    url: Object.keys(ANALYZED_IMAGES)[0],
    textPlacement: 'center',
    backgroundTone: 'dark',
    aspectRatio: 'wide',
  };

  if (candidates.length === 0) {
    return defaultResult;
  }

  let targetCategory: string | null = null;

  // PRIORITY 1: Check for commercial keywords in query (highest priority for B2B)
  if (query) {
    const queryLower = query.toLowerCase();
    for (const keyword of COMMERCIAL_QUERY_KEYWORDS) {
      if (queryLower.includes(keyword)) {
        targetCategory = 'commercial';
        break;
      }
    }
  }

  // PRIORITY 2: Try to determine target category from use cases
  if (!targetCategory && useCases && useCases.length > 0) {
    for (const useCase of useCases) {
      const normalizedUseCase = useCase.toLowerCase().trim();
      if (USE_CASE_TO_CATEGORY[normalizedUseCase]) {
        targetCategory = USE_CASE_TO_CATEGORY[normalizedUseCase];
        break;
      }
      // Partial match
      for (const [keyword, category] of Object.entries(USE_CASE_TO_CATEGORY)) {
        if (normalizedUseCase.includes(keyword)) {
          targetCategory = category;
          break;
        }
      }
      if (targetCategory) break;
    }
  }

  // PRIORITY 3: Try to match from query keywords (non-commercial)
  if (!targetCategory && query) {
    const queryLower = query.toLowerCase();
    for (const [keyword, category] of Object.entries(USE_CASE_TO_CATEGORY)) {
      if (queryLower.includes(keyword)) {
        targetCategory = category;
        break;
      }
    }
  }

  // Fall back to intent-based category selection
  if (!targetCategory && intentType) {
    const intentCategories = INTENT_TO_CATEGORIES[intentType] || ['product', 'lifestyle'];
    targetCategory = intentCategories[Math.floor(Math.random() * intentCategories.length)];
  }

  // Score all candidates
  const scoredCandidates = candidates.map(({ url, analysis }) => ({
    url,
    analysis,
    score: scoreImageMatch(analysis, targetCategory, query),
  }));

  // Sort by score (highest first)
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Take top candidates (with some randomization for variety)
  const topCandidates = scoredCandidates.slice(0, Math.min(5, scoredCandidates.length));

  // Weighted random selection from top candidates
  const totalScore = topCandidates.reduce((sum, c) => sum + c.score, 0);
  let random = Math.random() * totalScore;

  for (const candidate of topCandidates) {
    random -= candidate.score;
    if (random <= 0) {
      return {
        url: candidate.url,
        textPlacement: candidate.analysis.text_placement,
        backgroundTone: candidate.analysis.background_tone,
        aspectRatio: candidate.analysis.aspect_ratio,
      };
    }
  }

  // Fallback to top candidate
  const topCandidate = topCandidates[0];
  return {
    url: topCandidate.url,
    textPlacement: topCandidate.analysis.text_placement,
    backgroundTone: topCandidate.analysis.background_tone,
    aspectRatio: topCandidate.analysis.aspect_ratio,
  };
}

/**
 * Gets composition metadata for a specific image URL
 */
export function getImageComposition(imageUrl: string): { textPlacement: TextPlacement; backgroundTone: BackgroundTone } | null {
  const analysis = ANALYZED_IMAGES[imageUrl];
  if (!analysis) return null;
  return {
    textPlacement: analysis.text_placement,
    backgroundTone: analysis.background_tone,
  };
}

/**
 * Gets all available categories for debugging/testing
 */
export function getAvailableCategories(): string[] {
  const categories = new Set<string>();
  for (const analysis of Object.values(ANALYZED_IMAGES)) {
    categories.add(analysis.primary_category);
  }
  return [...categories];
}

/**
 * Gets image count per category for debugging/testing
 */
export function getImageCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const analysis of Object.values(ANALYZED_IMAGES)) {
    const cat = analysis.primary_category;
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

/**
 * Gets total number of hero-suitable images
 */
export function getHeroSuitableCount(): number {
  return getHeroSuitableImages(7).length;
}
