/**
 * Hero Image Configuration
 *
 * Maps user intents and use cases to curated, high-quality hero images.
 * Images are selected based on the classified intent and use cases extracted from the query.
 */

const VITAMIX_CDN = 'https://www.vitamix.com';

/**
 * Hero images organized by category/use-case
 * Each category has multiple images for variety
 */
export const HERO_IMAGES: Record<string, string[]> = {
  // Smoothies - bright, colorful, healthy
  smoothies: [
    '/content/dam/vitamix/home/recipes/smoothies/Mango_Smoothie - Hero.png',
    '/content/dam/vitamix/home/recipes/smoothies/Avo_Hero.jpg',
    '/content/dam/vitamix/home/recipes/smoothies/Avocado Smoothie Bowl.png',
    '/content/dam/vitamix/home/recipes/smoothies/CinnamonRollSmoothie_Static_470x449.png',
    '/content/dam/vitamix/home/recipes/smoothies/PBJSmoothieBowl.jpg',
    '/content/dam/vitamix/home/recipes/smoothies/Tropical%20Slushie.jpg',
    '/content/dam/vitamix/home/recipes/smoothies/Marry-Me-Smoothie.jpg',
  ],

  // Soups - warm, comforting
  soups: [
    '/content/dam/vitamix/home/ascent-x/Try_Anything_Soup.png',
    '/content/dam/vitamix/home/recipes/soups/Moroccan-SpicedSweetPotatoSoup_470x449.jpg',
    '/content/dam/vitamix/home/recipes/soups/RoastedCauliflowerandBlackPepperBisque.png',
    '/content/dam/vitamix/home/recipes/soups/CashewCreamOfMushroom_470x449.jpg',
    '/content/dam/vitamix/home/recipes/soups/CarrotCanelliniBeanSoup_470x449.jpg',
    '/content/dam/vitamix/home/partnerships/Curried_Coconut_Squash_Soup_470x449.png',
    '/content/dam/vitamix/home/recipes/soups/Tomato%20Soup_IB_470x449.jpg',
  ],

  // Frozen treats / desserts - indulgent, fun
  'frozen-treats': [
    '/content/dam/vitamix/home/ascent-x/Try_Anything_NiceCream.png',
    '/content/dam/vitamix/home/recipes/desserts---baking/Blackberry%20Whip.jpg',
    '/content/dam/vitamix/home/recipes/smoothies/Smores-470x449.png',
  ],

  // Drinks / beverages - refreshing
  drinks: [
    '/content/dam/vitamix/home/recipes/beverages-/3500_StrawberryHoney_PineappleLime_Frose.png',
    '/content/dam/vitamix/home/recipes/beverages-/GoldenMilk_470x449.jpg',
    '/content/dam/vitamix/home/recipes/beverages-/Grape Lime - Hero 01.png',
    '/content/dam/vitamix/home/recipes/beverages-/Mango Fresno - Hero 01.png',
    '/content/dam/vitamix/home/recipes/beverages-/E310_TangerineSpritz.png',
    '/content/dam/vitamix/home/recipes/beverages-/MatchaWhipFoam_v2_ccexpress.jpeg',
  ],

  // Cocktails - sophisticated
  cocktails: [
    '/content/dam/vitamix/home/recipes/beverages-/Cranberry_Margarita_470x449.png',
    '/content/dam/vitamix/home/recipes/beverages-/CitrusWhiskeySour_470x449.jpg',
    '/content/dam/vitamix/home/recipes/beverages-/Honey Bourbon_470x449.png',
    '/content/dam/vitamix/home/recipes/beverages-/Strawberry%20Gin%20-%20Hero%2001.png',
    '/content/dam/vitamix/home/recipes/beverages-/Orange Vodka - Hero 01.png',
  ],

  // Nut butters - wholesome, natural
  'nut-butters': [
    '/content/dam/vitamix/home/recipes/nut-butters/MixedNutButter_470x449.jpg',
    '/content/dam/vitamix/home/recipes/nut-butters/PistachioButter_470x449.jpg',
    '/content/dam/vitamix/home/recipes/nut-butters/PistachioChocolateButter_470x449.jpg',
  ],

  // Sauces / dips - culinary, cooking
  sauces: [
    '/content/dam/vitamix/home/ascent-x/Try_Anything_Hollandaise.png',
    '/content/dam/vitamix/home/partnerships/HarissaSpiceBlend_470x449.png',
    '/content/dam/vitamix/global/recipe-types/Dips_Spreads_Recipe_Center_500x500.jpg',
  ],

  // Breakfast - morning, energizing
  breakfast: [
    '/content/dam/vitamix/home/recipes/batters/banana-pancakes.png',
    '/content/dam/vitamix/home/recipes/desserts---baking/FruitOvernightOats.jpg',
    '/content/dam/vitamix/home/recipes/desserts---baking/OatmealRaisinMuffins_470x449.png',
  ],

  // Baby food - family, nurturing
  'baby-food': [
    '/content/dam/vitamix/global/recipe-types/Baby_Food_Recipe_Center_500x500.jpg',
  ],

  // Desserts / baking - treats, special occasions
  desserts: [
    '/content/dam/vitamix/home/recipes/desserts---baking/Cheesecake470x449.png',
    '/content/dam/vitamix/home/recipes/desserts---baking/Mini%20Raspberry%20Cheesecakes_470x449.png',
    '/content/dam/vitamix/home/recipes/desserts---baking/MangoCashewCreamTart.png',
    '/content/dam/vitamix/home/recipes/desserts---baking/ChocolateDateTruffles_470x449.jpg',
    '/content/dam/vitamix/home/recipes/desserts---baking/Bettina_HolidayBites_470x449.png',
  ],

  // Salads - fresh, healthy
  salads: [
    '/content/dam/vitamix/home/recipes/appetizers/64oz_CitrusPoppyseedFruitSalad.jpg',
    '/content/dam/vitamix/home/recipes/appetizers/Garden-Salad.png',
    '/content/dam/vitamix/home/recipes/appetizers/GrilledCornSalad_CilantroLImeVinaigrette.png',
    '/content/dam/vitamix/home/recipes/appetizers/BroccoliSalad.png',
  ],

  // Healthy / wellness - clean eating
  healthy: [
    '/content/dam/vitamix/home/recipes/smoothies/Carrot%20Turmeric%20Juice%20470x449.jpg',
    '/content/dam/vitamix/home/recipes/desserts---baking/CoconutChocolateChipEnergyBites_470x449.jpg',
    '/content/dam/vitamix/home/recipes/desserts---baking/GingersnapGranolaBars_470x449.png',
    '/content/dam/vitamix/home/recipes/desserts---baking/PB%20Protein%20Bars.jpg',
  ],

  // Cooking / culinary - savory, sophisticated
  cooking: [
    '/content/dam/vitamix/home/ascent-x/Try_Anything_Fish.png',
    '/content/dam/vitamix/home/articles/Beef_Slider_470x450.jpg',
    '/content/dam/vitamix/home/partnerships/Toasted_Hazelnut_Pear_470x449.png',
  ],

  // Default / general - versatile lifestyle images
  default: [
    '/content/dam/vitamix/home/partnerships/daily-harvest-3qtr-overhead.jpg',
    '/content/dam/vitamix/home/articles/Self-Care and Mealtime article 470x450.jpg',
    '/content/dam/vitamix/home/recipes/smoothies/Mango_Smoothie - Hero.png',
    '/content/dam/vitamix/home/ascent-x/Try_Anything_Soup.png',
    '/content/dam/vitamix/home/recipes/beverages-/GoldenMilk_470x449.jpg',
    '/content/dam/vitamix/home/recipes/desserts---baking/Cheesecake470x449.png',
  ],
};

/**
 * Maps intent types to relevant hero image categories
 */
const INTENT_TO_CATEGORIES: Record<string, string[]> = {
  'discovery': ['default', 'smoothies', 'soups', 'drinks'],
  'comparison': ['default', 'cooking'],
  'product-detail': ['default'],
  'use-case': ['default'], // Will be overridden by specific use cases
  'specs': ['default', 'cooking'],
  'reviews': ['default'],
  'price': ['default'],
  'recommendation': ['default', 'smoothies', 'soups'],
  'support': ['default'],
  'gift': ['desserts', 'smoothies', 'default'],
  'medical': ['soups', 'smoothies', 'baby-food', 'healthy'],
  'accessibility': ['smoothies', 'soups', 'default'],
  'partnership': ['cooking', 'default'],
};

/**
 * Maps use case keywords to hero image categories
 */
const USE_CASE_TO_CATEGORY: Record<string, string> = {
  // Smoothies
  'smoothies': 'smoothies',
  'smoothie': 'smoothies',
  'green smoothie': 'smoothies',
  'protein shake': 'smoothies',
  'shake': 'smoothies',
  // Soups
  'soups': 'soups',
  'soup': 'soups',
  'hot soup': 'soups',
  'bisque': 'soups',
  'chowder': 'soups',
  // Frozen treats
  'frozen': 'frozen-treats',
  'ice cream': 'frozen-treats',
  'nice cream': 'frozen-treats',
  'sorbet': 'frozen-treats',
  'frozen dessert': 'frozen-treats',
  'gelato': 'frozen-treats',
  // Drinks
  'drinks': 'drinks',
  'beverage': 'drinks',
  'juice': 'drinks',
  'lemonade': 'drinks',
  'tea': 'drinks',
  'latte': 'drinks',
  // Cocktails - check these BEFORE general drinks
  'cocktail': 'cocktails',
  'cocktails': 'cocktails',
  'margarita': 'cocktails',
  'martini': 'cocktails',
  'mojito': 'cocktails',
  'daiquiri': 'cocktails',
  'whiskey sour': 'cocktails',
  'mixed drink': 'cocktails',
  'nut butter': 'nut-butters',
  'nut butters': 'nut-butters',
  'almond butter': 'nut-butters',
  'peanut butter': 'nut-butters',
  'sauce': 'sauces',
  'sauces': 'sauces',
  'dip': 'sauces',
  'dips': 'sauces',
  'dressing': 'sauces',
  'breakfast': 'breakfast',
  'pancake': 'breakfast',
  'pancakes': 'breakfast',
  'baby food': 'baby-food',
  'puree': 'baby-food',
  'dessert': 'desserts',
  'desserts': 'desserts',
  'baking': 'desserts',
  'salad': 'salads',
  'salads': 'salads',
  'healthy': 'healthy',
  'wellness': 'healthy',
  'diet': 'healthy',
  'cooking': 'cooking',
  'meal prep': 'cooking',
  'dinner': 'cooking',
};

/**
 * Selects an appropriate hero image based on intent, use cases, and query
 *
 * @param intentType - The classified intent type
 * @param useCases - Array of extracted use cases from the query
 * @param query - The original user query (for fallback keyword matching)
 * @returns Full URL to a hero image
 */
export function selectHeroImage(
  intentType?: string,
  useCases?: string[],
  query?: string
): string {
  let selectedCategory = 'default';
  let candidateImages: string[] = [];

  // First, try to match based on specific use cases (most specific)
  if (useCases && useCases.length > 0) {
    for (const useCase of useCases) {
      const normalizedUseCase = useCase.toLowerCase().trim();

      // Check for exact match
      if (USE_CASE_TO_CATEGORY[normalizedUseCase]) {
        selectedCategory = USE_CASE_TO_CATEGORY[normalizedUseCase];
        break;
      }

      // Check for partial match
      for (const [keyword, category] of Object.entries(USE_CASE_TO_CATEGORY)) {
        if (normalizedUseCase.includes(keyword) || keyword.includes(normalizedUseCase)) {
          selectedCategory = category;
          break;
        }
      }

      if (selectedCategory !== 'default') break;
    }
  }

  // If no use case match, try matching keywords directly from the query
  if (selectedCategory === 'default' && query) {
    const normalizedQuery = query.toLowerCase();
    for (const [keyword, category] of Object.entries(USE_CASE_TO_CATEGORY)) {
      if (normalizedQuery.includes(keyword)) {
        selectedCategory = category;
        break;
      }
    }
  }

  // If still no match, fall back to intent-based selection
  if (selectedCategory === 'default' && intentType) {
    const intentCategories = INTENT_TO_CATEGORIES[intentType] || ['default'];
    // Pick a random category from the intent's associated categories
    selectedCategory = intentCategories[Math.floor(Math.random() * intentCategories.length)];
  }

  // Get images from the selected category
  candidateImages = HERO_IMAGES[selectedCategory] || HERO_IMAGES['default'];

  // If category has no images, fall back to default
  if (!candidateImages || candidateImages.length === 0) {
    candidateImages = HERO_IMAGES['default'];
  }

  // Randomly select an image from the candidates
  const selectedImage = candidateImages[Math.floor(Math.random() * candidateImages.length)];

  // Return full URL
  return `${VITAMIX_CDN}${selectedImage}`;
}

/**
 * Gets all available categories for debugging/testing
 */
export function getAvailableCategories(): string[] {
  return Object.keys(HERO_IMAGES);
}

/**
 * Gets image count per category for debugging/testing
 */
export function getImageCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [category, images] of Object.entries(HERO_IMAGES)) {
    counts[category] = images.length;
  }
  return counts;
}
