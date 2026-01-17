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
  /** Source of the image: 'vitamix' for official images, 'generated' for AI-generated */
  source?: 'vitamix' | 'generated';
  /** For generated images: the prompt used to create this image */
  generated_prompt?: string;
  /** For generated images: ISO timestamp when the image was generated */
  generated_at?: string;
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
    hero_notes: 'Excellent hero with warm sophisticated color palette, blender on right',
    text_placement: 'left',
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
  'https://www.vitamix.com/us/en_us/media_13a74a0b736f835e518d9fd38a172823796d1af25.png?width=2000&format=webply&optimize=medium': {
    primary_category: 'product',
    secondary_tags: ['premium', 'kitchen', 'fresh'],
    dominant_colors: ['black', 'green'],
    mood: 'sophisticated',
    content_description: 'Sleek black Vitamix blender on marble countertop in modern kitchen with fresh herbs and elegant lighting',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero banner candidate with professional lighting, premium kitchen setting',
    text_placement: 'left',
    background_tone: 'dark',
    aspect_ratio: 'wide',
  },
  'https://www.vitamix.com/us/en_us/media_1636e7411e91e1e7bb2f92178c5f0af89236e2036.jpg?width=2000&format=webply&optimize=medium': {
    primary_category: 'soup',
    secondary_tags: ['warm', 'creamy', 'premium'],
    dominant_colors: ['coral pink', 'golden orange'],
    mood: 'warm',
    content_description: 'Vitamix blender alongside a bowl of creamy orange soup with butternut squash, coconut, lime on coral pink surface',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero banner composition with beautiful food styling and warm lighting',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'wide',
  },
  'https://www.vitamix.com/us/en_us/media_1c29551e255c94966b94f25ad6c849a2ff5b0d939.jpg?width=2000&format=webply&optimize=medium': {
    primary_category: 'product',
    secondary_tags: ['kitchen', 'premium', 'warm'],
    dominant_colors: ['navy blue', 'orange'],
    mood: 'premium',
    content_description: 'Person pouring golden liquid from pitcher into bowl next to Vitamix blender with fresh ingredients',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero banner with professional lighting and premium lifestyle aesthetic',
    text_placement: 'bottom-center',
    background_tone: 'dark',
    aspect_ratio: 'wide',
  },
  'https://www.vitamix.com/us/en_us/media_15c9938cc0da7325e8f694aeac469af9af75ab4da.jpg?width=2000&format=webply&optimize=medium': {
    primary_category: 'product',
    secondary_tags: ['colorful', 'premium', 'kitchen'],
    dominant_colors: ['black', 'white'],
    mood: 'premium',
    content_description: 'Professional product lineup showing multiple Vitamix blenders with colorful ingredients against white background',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero banner with clean white background and professional product photography',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'wide',
  },
  'https://www.vitamix.com/us/en_us/media_13242b35104493d92b269313bb04a92ec72c0fbb1.jpg?width=2000&format=webply&optimize=medium': {
    primary_category: 'lifestyle',
    secondary_tags: ['healthy', 'kitchen', 'fresh'],
    dominant_colors: ['green', 'yellow'],
    mood: 'healthy',
    content_description: 'Green smoothie bowl with cucumber slices on cutting board, Vitamix blender in background on yellow surface',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero banner with healthy lifestyle context and warm yellow tones',
    text_placement: 'left',
    background_tone: 'light',
    aspect_ratio: 'wide',
  },
  'https://www.vitamix.com/us/en_us/media_1923c2bf50e9608c88968e73b6576c72cc263150c.jpg?width=2000&format=webply&optimize=medium': {
    primary_category: 'product',
    secondary_tags: ['premium', 'kitchen', 'fresh'],
    dominant_colors: ['light blue', 'white'],
    mood: 'premium',
    content_description: 'Modern white Vitamix blender with attachments on clean counter with fresh fruits against light blue wall',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero banner with clean premium aesthetic and ample space for text overlay',
    text_placement: 'left',
    background_tone: 'light',
    aspect_ratio: 'wide',
  },
  'https://www.vitamix.com/us/en_us/media_13f3ada307f6cc6f098746a04ac511fd49c317362.png?width=2000&format=webply&optimize=medium': {
    primary_category: 'product',
    secondary_tags: ['professional', 'kitchen', 'premium'],
    dominant_colors: ['black', 'gray'],
    mood: 'premium',
    content_description: 'Professional chef in Vitamix apron standing behind black Vitamix blender in modern kitchen',
    quality_score: 9,
    hero_suitable: true,
    hero_notes: 'Excellent hero banner with professional lighting and strong brand presence',
    text_placement: 'bottom-center',
    background_tone: 'mixed',
    aspect_ratio: 'wide',
  },

  // ============================================
  // AI-Generated Images (Imagen 3)
  // ============================================

  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-nice-cream-bowl.png': {
    primary_category: 'dessert',
    secondary_tags: ['frozen', 'healthy', 'fresh'],
    dominant_colors: ['white', 'pink', 'blue'],
    mood: 'refreshing',
    content_description: 'Creamy frozen banana nice cream bowl topped with sliced strawberries, blueberries, and coconut flakes in white ceramic bowl on white marble',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for nice cream bowl category',
    text_placement: 'left',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of a creamy frozen banana nice cream bowl topped with sliced strawberries, blueberries, and coconut flakes. Served in a white ceramic bowl on white marble surface. Soft natural lighting, shallow depth of field. Premium editorial food styling. Wide 16:9 aspect ratio with negative space on left for text. No blender or kitchen appliances visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-frozen-fruit-sorbet.png': {
    primary_category: 'dessert',
    secondary_tags: ['frozen', 'colorful', 'premium'],
    dominant_colors: ['orange', 'pink', 'white'],
    mood: 'vibrant',
    content_description: 'Vibrant mango and raspberry sorbet scoops in clear glass dessert bowl with fresh mint garnish on white marble',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for frozen fruit sorbet category',
    text_placement: 'right',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of vibrant mango and raspberry sorbet scoops in a clear glass dessert bowl. Fresh mint garnish, scattered berries on white marble countertop. Bright, clean studio lighting with warm highlights. Editorial food magazine style. Wide 16:9 composition, ample negative space. No appliances or products visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-chocolate-ice-cream.png': {
    primary_category: 'dessert',
    secondary_tags: ['indulgent', 'premium', 'frozen'],
    dominant_colors: ['brown', 'white', 'red'],
    mood: 'indulgent',
    content_description: 'Rich dark chocolate frozen dessert in elegant white bowl with chocolate shavings and fresh raspberries',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for chocolate ice cream category',
    text_placement: 'left',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of rich dark chocolate frozen dessert in elegant white bowl, topped with chocolate shavings and fresh raspberries. Minimalist white background, dramatic studio lighting. Premium dessert styling, wide horizontal composition. No kitchen appliances visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-frozen-margarita.png': {
    primary_category: 'cocktail',
    secondary_tags: ['frozen', 'refreshing', 'premium'],
    dominant_colors: ['green', 'white', 'lime'],
    mood: 'refreshing',
    content_description: 'Frozen margarita in salt-rimmed glass with lime wheel garnish, fresh limes and sea salt on light wooden surface',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for frozen margarita category',
    text_placement: 'right',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional beverage photography of a frozen margarita in a salt-rimmed glass with lime wheel garnish. Fresh limes and sea salt scattered on light wooden surface. Bright, refreshing mood with clean white background. Condensation on glass showing freshness. Wide 16:9 format, editorial style. No blender visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-tropical-frozen-cocktail.png': {
    primary_category: 'cocktail',
    secondary_tags: ['tropical', 'colorful', 'summer'],
    dominant_colors: ['orange', 'pink', 'yellow'],
    mood: 'tropical',
    content_description: 'Colorful layered frozen tropical drink in tall hurricane glass with pineapple wedge and cherry garnish',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for tropical frozen cocktail category',
    text_placement: 'left',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional beverage photography of colorful layered frozen tropical drink in tall hurricane glass. Pineapple wedge and cherry garnish, tropical flowers as props. Bright, vibrant summer mood. Clean white marble surface, soft shadows. Wide composition with space for text overlay. No appliances visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-hummus-platter.png': {
    primary_category: 'sauce',
    secondary_tags: ['healthy', 'mediterranean', 'fresh'],
    dominant_colors: ['beige', 'orange', 'green'],
    mood: 'warm',
    content_description: 'Creamy golden hummus in ceramic bowl with olive oil drizzle and paprika, surrounded by fresh vegetables',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for hummus platter category',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of creamy golden hummus in ceramic bowl with olive oil drizzle and paprika, surrounded by fresh vegetables - cucumber, carrots, bell peppers, cherry tomatoes. Warm terracotta surface, Mediterranean styling. Soft natural lighting. Wide 16:9 aspect ratio. No kitchen appliances.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-fresh-pesto.png': {
    primary_category: 'sauce',
    secondary_tags: ['italian', 'fresh', 'premium'],
    dominant_colors: ['green', 'white', 'brown'],
    mood: 'rustic',
    content_description: 'Vibrant green basil pesto in white marble mortar with fresh basil leaves, pine nuts, parmesan, and garlic',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for fresh pesto category',
    text_placement: 'right',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of vibrant green basil pesto in white marble mortar, surrounded by fresh basil leaves, pine nuts, parmesan, and garlic. Rustic wooden board, warm natural lighting. Italian culinary styling. Wide horizontal composition with negative space. No blender or products visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-vibrant-green-smoothie.png': {
    primary_category: 'smoothie',
    secondary_tags: ['healthy', 'green', 'fresh'],
    dominant_colors: ['green', 'white'],
    mood: 'healthy',
    content_description: 'Bright green spinach kale smoothie in tall clear glass with fresh greens and apple slices nearby on white marble',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for vibrant green smoothie category',
    text_placement: 'left',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional beverage photography of bright green spinach kale smoothie in tall clear glass with glass straw. Fresh spinach leaves, kale, green apple slices, and ginger arranged nearby on white marble. Clean, healthy aesthetic with bright natural lighting. Wide 16:9 composition. No blender visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-detox-green-juice.png': {
    primary_category: 'drink',
    secondary_tags: ['healthy', 'detox', 'green'],
    dominant_colors: ['green', 'white', 'yellow'],
    mood: 'healthy',
    content_description: 'Vibrant green juice in mason jar with fresh celery, cucumber, green apple, lemon, and leafy greens',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for detox green juice category',
    text_placement: 'right',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of vibrant green juice in mason jar, surrounded by fresh celery, cucumber, green apple, lemon, and leafy greens. Bright white background, clean healthy mood. Morning light feel, editorial wellness styling. Wide format with text space. No appliances visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-acai-bowl.png': {
    primary_category: 'smoothie',
    secondary_tags: ['healthy', 'breakfast', 'colorful'],
    dominant_colors: ['purple', 'white', 'yellow'],
    mood: 'energizing',
    content_description: 'Purple acai smoothie bowl topped with sliced banana, fresh berries, granola, coconut flakes, and chia seeds',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for acai bowl category',
    text_placement: 'left',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of purple acai smoothie bowl topped with sliced banana, fresh berries, granola, coconut flakes, and chia seeds. White ceramic bowl on light wooden board. Bright, healthy morning mood. Clean composition, wide 16:9 format. No kitchen appliances visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-overnight-oats.png': {
    primary_category: 'healthy',
    secondary_tags: ['breakfast', 'premium', 'fresh'],
    dominant_colors: ['beige', 'red', 'white'],
    mood: 'cozy',
    content_description: 'Creamy overnight oats in glass jar layered with fresh berries, sliced almonds, and honey drizzle',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for overnight oats category',
    text_placement: 'right',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of creamy overnight oats in glass jar layered with fresh berries, sliced almonds, and honey drizzle. Scattered oats and berries on white marble surface. Soft morning light, cozy breakfast aesthetic. Wide horizontal composition. No blender visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-baby-purees.png': {
    primary_category: 'healthy',
    secondary_tags: ['baby', 'colorful', 'fresh'],
    dominant_colors: ['orange', 'green', 'purple'],
    mood: 'nurturing',
    content_description: 'Three small glass jars containing colorful baby food purees - orange carrot, green pea, purple beet with fresh vegetables',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for baby purees category',
    text_placement: 'center',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of three small glass jars containing colorful baby food purees - orange carrot, green pea, purple beet. Fresh vegetables arranged nearby. Soft, nurturing aesthetic with pastel tones. Clean white background, gentle lighting. Wide 16:9 composition. No appliances visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-juice-bar-drinks.png': {
    primary_category: 'commercial',
    secondary_tags: ['juice', 'colorful', 'professional'],
    dominant_colors: ['green', 'orange', 'red'],
    mood: 'energetic',
    content_description: 'Colorful fresh juice lineup - green, orange, red, purple juices in clear bottles with fresh fruits and vegetables',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for juice bar drinks category',
    text_placement: 'bottom-center',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of colorful fresh juice lineup - green, orange, red, purple juices in clear bottles. Fresh fruits and vegetables artfully arranged. Bright, energetic mood. Clean white counter surface, commercial presentation style. Wide 16:9 format. No blenders or equipment visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-restaurant-soup.png': {
    primary_category: 'soup',
    secondary_tags: ['premium', 'restaurant', 'warm'],
    dominant_colors: ['orange', 'white', 'dark gray'],
    mood: 'sophisticated',
    content_description: 'Elegant butternut squash soup in white fine dining bowl with cream swirl and microgreen garnish on dark slate',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for restaurant soup category',
    text_placement: 'left',
    background_tone: 'dark',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of elegant butternut squash soup in white fine dining bowl with cream swirl and microgreen garnish. Sophisticated restaurant plating on dark slate. Dramatic lighting, premium dining aesthetic. Wide composition with negative space. No kitchen equipment visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-tropical-smoothie.png': {
    primary_category: 'smoothie',
    secondary_tags: ['tropical', 'summer', 'colorful'],
    dominant_colors: ['yellow', 'orange', 'green'],
    mood: 'tropical',
    content_description: 'Bright yellow-orange tropical smoothie in coconut shell bowl with passion fruit, mango cubes, and edible flowers',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for tropical smoothie category',
    text_placement: 'right',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional beverage photography of bright yellow-orange tropical smoothie in coconut shell bowl, topped with passion fruit, mango cubes, and edible flowers. Palm leaf props, bright summer mood. Clean white background, vacation aesthetic. Wide 16:9 format. No blender visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
  },
  'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-pumpkin-soup.png': {
    primary_category: 'soup',
    secondary_tags: ['fall', 'warm', 'cozy'],
    dominant_colors: ['orange', 'brown', 'cream'],
    mood: 'cozy',
    content_description: 'Creamy pumpkin soup in rustic ceramic bowl with pepita seeds and sage garnish, decorative pumpkins and autumn leaves',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for pumpkin soup category',
    text_placement: 'left',
    background_tone: 'light',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: 'Professional food photography of creamy pumpkin soup in rustic ceramic bowl with pepita seeds and sage garnish. Small decorative pumpkins, autumn leaves as props. Warm, cozy fall aesthetic with golden lighting. Wide horizontal composition. No appliances visible.',
    generated_at: '2026-01-17T12:42:31.013Z',
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

// ============================================
// Semantic Search (Vectorize)
// ============================================

/** Vectorize match result */
interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: {
    source_url?: string;
    primary_category?: string;
    mood?: string;
    text_placement?: string;
    background_tone?: string;
    aspect_ratio?: string;
    quality_score?: string;
    [key: string]: string | undefined;
  };
}

/** Environment with AI and Vectorize bindings */
interface HeroImageEnv {
  AI?: {
    run: (model: string, input: { text: string[] }) => Promise<{ data: number[][] }>;
  };
  VECTORIZE?: {
    query: (
      vector: number[],
      options: { topK: number; filter?: Record<string, string>; returnMetadata?: string }
    ) => Promise<{ matches: VectorizeMatch[] }>;
  };
}

/**
 * Generate embedding for a query using Workers AI
 */
async function generateQueryEmbedding(query: string, env: HeroImageEnv): Promise<number[] | null> {
  if (!env.AI) return null;

  try {
    const result = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [query],
    });
    return result.data[0];
  } catch (error) {
    console.error('[HeroImages] Failed to generate embedding:', error);
    return null;
  }
}

/**
 * Query Vectorize for semantically similar hero images
 */
async function querySemanticImages(
  embedding: number[],
  env: HeroImageEnv,
  topK = 10
): Promise<VectorizeMatch[]> {
  if (!env.VECTORIZE) return [];

  try {
    const results = await env.VECTORIZE.query(embedding, {
      topK,
      filter: { content_type: 'hero-image' },
      returnMetadata: 'all',
    });
    return results.matches;
  } catch (error) {
    console.error('[HeroImages] Vectorize query failed:', error);
    return [];
  }
}

/**
 * Selects a hero image using semantic search with fallback to keyword matching
 *
 * @param query - The user's query for semantic matching
 * @param intentType - The classified intent type (fallback scoring)
 * @param useCases - Array of extracted use cases (fallback scoring)
 * @param env - Environment with AI and VECTORIZE bindings (optional)
 * @returns HeroImageSelection with URL and composition metadata
 */
export async function selectHeroImageSemantic(
  query: string,
  intentType?: string,
  useCases?: string[],
  env?: HeroImageEnv
): Promise<HeroImageSelection> {
  // Try semantic search if env is available
  if (env?.AI && env?.VECTORIZE && query) {
    const embedding = await generateQueryEmbedding(query, env);

    if (embedding) {
      const semanticMatches = await querySemanticImages(embedding, env, 10);

      if (semanticMatches.length > 0) {
        // Filter to only hero images and get their analysis
        const validMatches = semanticMatches
          .filter((m) => m.id.startsWith('hero-') && m.metadata?.source_url)
          .map((m) => {
            const url = m.metadata!.source_url!;
            const analysis = ANALYZED_IMAGES[url];
            return {
              url,
              semanticScore: m.score,
              analysis,
              metadata: m.metadata,
            };
          })
          .filter((m) => m.analysis); // Must have local analysis data

        if (validMatches.length > 0) {
          // Hybrid scoring: combine semantic similarity with intent matching
          const scored = validMatches.map((m) => {
            // Determine target category from intent/use cases
            let targetCategory: string | null = null;
            if (useCases?.length) {
              for (const useCase of useCases) {
                const normalized = useCase.toLowerCase().trim();
                if (USE_CASE_TO_CATEGORY[normalized]) {
                  targetCategory = USE_CASE_TO_CATEGORY[normalized];
                  break;
                }
              }
            }
            if (!targetCategory && intentType) {
              const categories = INTENT_TO_CATEGORIES[intentType];
              if (categories?.length) {
                targetCategory = categories[0];
              }
            }

            // Calculate intent score (0-1 normalized)
            const intentScore = scoreImageMatch(m.analysis, targetCategory, query) / 20;

            // Combined score: 70% semantic, 30% intent
            const combinedScore = m.semanticScore * 0.7 + intentScore * 0.3;

            return { ...m, combinedScore };
          });

          // Sort by combined score
          scored.sort((a, b) => b.combinedScore - a.combinedScore);

          // Take top 3 and add some randomization
          const topMatches = scored.slice(0, 3);
          const totalScore = topMatches.reduce((sum, m) => sum + m.combinedScore, 0);
          let random = Math.random() * totalScore;

          for (const match of topMatches) {
            random -= match.combinedScore;
            if (random <= 0) {
              console.log(
                `[HeroImages] Semantic selection: ${match.url.split('media_')[1]?.split('?')[0]} ` +
                  `(semantic: ${match.semanticScore.toFixed(3)}, combined: ${match.combinedScore.toFixed(3)})`
              );
              return {
                url: match.url,
                textPlacement: match.analysis.text_placement,
                backgroundTone: match.analysis.background_tone,
                aspectRatio: match.analysis.aspect_ratio,
              };
            }
          }

          // Fallback to top match
          const best = topMatches[0];
          return {
            url: best.url,
            textPlacement: best.analysis.text_placement,
            backgroundTone: best.analysis.background_tone,
            aspectRatio: best.analysis.aspect_ratio,
          };
        }
      }
    }
  }

  // Fallback to keyword-based selection
  console.log('[HeroImages] Falling back to keyword-based selection');
  return selectHeroImageWithMetadata(intentType, useCases, query);
}
