/**
 * Vitamix Content Embedding Worker
 *
 * Generates embeddings for recipes and hero images, uploads to Vectorize.
 *
 * Usage:
 *   POST /embed - Process recipes from JSON body
 *   POST /embed-images - Process hero images from JSON body
 *   POST /query - Query Vectorize (testing)
 *   GET /status - Check index status
 */

interface Env {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  BATCH_SIZE: string;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  difficulty: string;
  ingredients: Array<{ item: string; quantity?: string; unit?: string; notes?: string }>;
  instructions: string[];
  tips?: string[];
  prepTime?: string;
  blendTime?: string;
  totalTime?: string;
  servings?: number;
  yield?: string;
  nutrition?: Record<string, any>;
  dietaryTags?: string[];
  requiredContainer?: string;
  recommendedProgram?: string;
  blenderSpeed?: string;
  recommendedProducts?: string[];
  url: string;
  images?: {
    primary?: string;
  };
}

interface RecipesFile {
  recipes: Recipe[];
  count: number;
}

// ============================================
// Hero Image Types
// ============================================

interface HeroImage {
  url: string;
  primary_category: string;
  secondary_tags: string[];
  dominant_colors: string[];
  mood: string;
  content_description: string;
  quality_score: number;
  text_placement: string;
  background_tone: string;
  aspect_ratio: string;
}

interface HeroImagesFile {
  images: HeroImage[];
}

/**
 * Create searchable text for hero image embedding
 * Combines description, category, tags, mood, colors for rich semantic matching
 */
function createHeroImageSearchableText(image: HeroImage): string {
  const parts: string[] = [];

  // Description is most important for semantic matching
  parts.push(image.content_description);

  // Category and mood
  parts.push(`Category: ${image.primary_category}`);
  parts.push(`Mood: ${image.mood}`);

  // Tags for additional context
  if (image.secondary_tags?.length) {
    parts.push(`Style: ${image.secondary_tags.join(', ')}`);
  }

  // Colors can help match visual queries
  if (image.dominant_colors?.length) {
    parts.push(`Colors: ${image.dominant_colors.join(', ')}`);
  }

  // Composition info
  parts.push(`Layout: ${image.aspect_ratio}, text placement ${image.text_placement}, ${image.background_tone} background`);

  return parts.join('. ');
}

/**
 * Create Vectorize vector from hero image
 */
function createHeroImageVector(image: HeroImage, embedding: number[]): VectorizeVector {
  // Create a stable ID from URL hash
  const urlHash = image.url.split('media_')[1]?.split('.')[0] || image.url.slice(-32);

  return {
    id: `hero-${urlHash}`,
    values: embedding,
    metadata: {
      content_type: 'hero-image',
      source_url: image.url,
      chunk_text: createHeroImageSearchableText(image).slice(0, 2000),
      primary_category: image.primary_category,
      secondary_tags: image.secondary_tags.join(','),
      mood: image.mood,
      dominant_colors: image.dominant_colors.join(','),
      text_placement: image.text_placement,
      background_tone: image.background_tone,
      aspect_ratio: image.aspect_ratio,
      quality_score: image.quality_score.toString(),
      indexed_at: new Date().toISOString(),
    },
  };
}

/**
 * Create searchable text for embedding from recipe data
 * Combines name, description, ingredients, category, dietary tags
 */
function createSearchableText(recipe: Recipe): string {
  const parts: string[] = [];

  // Name and description are most important
  parts.push(recipe.name);
  if (recipe.description) {
    parts.push(recipe.description);
  }

  // Category info
  if (recipe.category) {
    parts.push(`Category: ${recipe.category}`);
  }
  if (recipe.subcategory) {
    parts.push(`Type: ${recipe.subcategory}`);
  }

  // Ingredients (just the item names)
  if (recipe.ingredients?.length) {
    const ingredientList = recipe.ingredients
      .map(i => i.item)
      .filter(Boolean)
      .join(', ');
    parts.push(`Ingredients: ${ingredientList}`);
  }

  // Dietary tags are crucial for filtering
  if (recipe.dietaryTags?.length) {
    parts.push(`Dietary: ${recipe.dietaryTags.join(', ')}`);
  }

  // Time and difficulty
  if (recipe.difficulty) {
    parts.push(`Difficulty: ${recipe.difficulty}`);
  }
  if (recipe.totalTime) {
    parts.push(`Time: ${recipe.totalTime}`);
  }

  // Equipment/program
  if (recipe.requiredContainer) {
    parts.push(`Container: ${recipe.requiredContainer}`);
  }
  if (recipe.recommendedProgram) {
    parts.push(`Program: ${recipe.recommendedProgram}`);
  }

  return parts.join('. ');
}

/**
 * Generate embeddings for multiple texts in one call
 */
async function generateEmbeddings(texts: string[], ai: Ai): Promise<number[][]> {
  const result = await ai.run('@cf/baai/bge-base-en-v1.5', {
    text: texts,
  }) as { data: number[][] };

  return result.data;
}

/**
 * Create Vectorize vector from recipe
 */
function createVector(recipe: Recipe, embedding: number[]): VectorizeVector {
  return {
    id: `recipe-${recipe.id}`,
    values: embedding,
    metadata: {
      content_type: 'recipe',
      source_url: recipe.url,
      page_title: recipe.name,
      chunk_text: createSearchableText(recipe).slice(0, 2000), // Vectorize metadata limit
      recipe_category: recipe.category,
      recipe_image_url: recipe.images?.primary || '',
      difficulty: recipe.difficulty,
      dietary_tags: recipe.dietaryTags?.join(',') || '',
      servings: recipe.servings?.toString() || '',
      total_time: recipe.totalTime || '',
      indexed_at: new Date().toISOString(),
    },
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Status endpoint
      if (url.pathname === '/status') {
        const described = await env.VECTORIZE.describe();
        return Response.json({
          status: 'ok',
          vectorize: described,
        }, { headers: corsHeaders });
      }

      // Embed endpoint - process recipes from POST body
      if (url.pathname === '/embed' && request.method === 'POST') {
        const data = await request.json() as RecipesFile;
        const recipes = data.recipes;

        if (!recipes?.length) {
          return Response.json({ error: 'No recipes provided' }, {
            status: 400,
            headers: corsHeaders
          });
        }

        const batchSize = parseInt(env.BATCH_SIZE) || 100;
        const results: { processed: number; batches: number; errors: string[] } = {
          processed: 0,
          batches: 0,
          errors: [],
        };

        // Process in batches
        for (let i = 0; i < recipes.length; i += batchSize) {
          const batch = recipes.slice(i, i + batchSize);

          try {
            // Generate searchable texts
            const texts = batch.map(r => createSearchableText(r));

            // Generate embeddings
            const embeddings = await generateEmbeddings(texts, env.AI);

            // Create vectors
            const vectors = batch.map((recipe, idx) =>
              createVector(recipe, embeddings[idx])
            );

            // Upsert to Vectorize
            await env.VECTORIZE.upsert(vectors);

            results.processed += batch.length;
            results.batches++;

            console.log(`Processed batch ${results.batches}: ${batch.length} recipes`);
          } catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Unknown error';
            results.errors.push(`Batch ${results.batches + 1}: ${errMsg}`);
            console.error(`Batch ${results.batches + 1} failed:`, error);
          }
        }

        return Response.json({
          success: true,
          ...results,
          totalRecipes: recipes.length,
        }, { headers: corsHeaders });
      }

      // Embed hero images endpoint
      if (url.pathname === '/embed-images' && request.method === 'POST') {
        const data = await request.json() as HeroImagesFile;
        const images = data.images;

        if (!images?.length) {
          return Response.json({ error: 'No images provided' }, {
            status: 400,
            headers: corsHeaders
          });
        }

        const results: { processed: number; errors: string[] } = {
          processed: 0,
          errors: [],
        };

        try {
          // Generate searchable texts
          const texts = images.map(img => createHeroImageSearchableText(img));

          // Generate embeddings in one batch (small dataset)
          const embeddings = await generateEmbeddings(texts, env.AI);

          // Create vectors
          const vectors = images.map((image, idx) =>
            createHeroImageVector(image, embeddings[idx])
          );

          // Upsert to Vectorize
          await env.VECTORIZE.upsert(vectors);

          results.processed = images.length;
          console.log(`Embedded ${images.length} hero images`);
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(errMsg);
          console.error('Hero image embedding failed:', error);
        }

        return Response.json({
          success: results.errors.length === 0,
          ...results,
          totalImages: images.length,
        }, { headers: corsHeaders });
      }

      // Embed single recipe (for testing)
      if (url.pathname === '/embed-single' && request.method === 'POST') {
        const recipe = await request.json() as Recipe;

        const text = createSearchableText(recipe);
        const embeddings = await generateEmbeddings([text], env.AI);
        const vector = createVector(recipe, embeddings[0]);

        await env.VECTORIZE.upsert([vector]);

        return Response.json({
          success: true,
          id: vector.id,
          textLength: text.length,
        }, { headers: corsHeaders });
      }

      // Query endpoint (for testing retrieval)
      if (url.pathname === '/query' && request.method === 'POST') {
        const { query, topK = 5, contentType } = await request.json() as {
          query: string;
          topK?: number;
          contentType?: 'recipe' | 'hero-image';
        };

        const embeddings = await generateEmbeddings([query], env.AI);

        // Build query options with optional filter
        const queryOptions: { topK: number; returnMetadata: 'all'; filter?: Record<string, string> } = {
          topK,
          returnMetadata: 'all',
        };
        if (contentType) {
          queryOptions.filter = { content_type: contentType };
        }

        const results = await env.VECTORIZE.query(embeddings[0], queryOptions);

        return Response.json({
          query,
          contentType: contentType || 'all',
          results: results.matches.map(m => ({
            id: m.id,
            score: m.score,
            title: (m.metadata as any)?.page_title,
            category: (m.metadata as any)?.recipe_category || (m.metadata as any)?.primary_category,
            mood: (m.metadata as any)?.mood,
            url: (m.metadata as any)?.source_url,
          })),
        }, { headers: corsHeaders });
      }

      // Default: instructions
      return Response.json({
        endpoints: {
          'POST /embed': 'Process recipes JSON and upload to Vectorize',
          'POST /embed-images': 'Process hero images JSON and upload to Vectorize',
          'POST /embed-single': 'Process single recipe (testing)',
          'POST /query': 'Query Vectorize (testing)',
          'GET /status': 'Check Vectorize index status',
        },
        usage: 'POST recipes.json to /embed or hero images to /embed-images',
      }, { headers: corsHeaders });

    } catch (error) {
      console.error('Error:', error);
      return Response.json({
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500, headers: corsHeaders });
    }
  },
};
