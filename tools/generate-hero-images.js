#!/usr/bin/env node
/**
 * Hero Image Generation Tool
 *
 * Generates hero images using Google Vertex AI Imagen 3 and uploads to R2.
 * Images are food/drinks only - no Vitamix products.
 *
 * Prerequisites:
 *   1. Google Cloud project with Vertex AI API enabled
 *   2. Service account with Vertex AI User role
 *   3. GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
 *   4. R2 bucket created (vitamix-hero-images)
 *
 * Usage:
 *   node tools/generate-hero-images.js [options]
 *
 * Options:
 *   --dry-run      Preview prompts without generating images
 *   --prompt N     Generate only prompt N (0-indexed)
 *   --list         List all prompts with their indices
 *   --upload-only  Skip generation, just upload existing images from ./generated-images/
 *   --local        Use local worker for R2 upload
 *   --no-upscale   Skip 2x upscaling (outputs 1408x768 instead of 2816x1536)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================
// Configuration
// ============================================

const VERTEX_AI_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const OUTPUT_DIR = path.join(__dirname, '../generated-images');
const HERO_IMAGES_TS = path.join(
  __dirname,
  '../workers/vitamix-gensite-recommender/src/lib/hero-images.ts'
);
const SEEDS_JSON = path.join(__dirname, '../content/manifests/hero-image-seeds.json');

// R2 bucket configuration
const R2_BUCKET = 'vitamix-hero-images';
const R2_PUBLIC_URL = 'https://pub-vitamix-hero-images.r2.dev'; // Update with actual public URL

// ============================================
// Image Generation Prompts
// ============================================

const IMAGE_PROMPTS = [
  // Dessert/Frozen (3 images)
  {
    id: 'nice-cream-bowl',
    category: 'dessert',
    prompt: `Professional food photography of a creamy frozen banana nice cream bowl topped with sliced strawberries, blueberries, and coconut flakes. Served in a white ceramic bowl on white marble surface. Soft natural lighting, shallow depth of field. Premium editorial food styling. Wide 16:9 aspect ratio with negative space on left for text. No blender or kitchen appliances visible.`,
    metadata: {
      primary_category: 'dessert',
      secondary_tags: ['frozen', 'healthy', 'fresh'],
      dominant_colors: ['white', 'pink', 'blue'],
      mood: 'refreshing',
      text_placement: 'left',
      background_tone: 'light',
    },
  },
  {
    id: 'frozen-fruit-sorbet',
    category: 'dessert',
    prompt: `Professional food photography of vibrant mango and raspberry sorbet scoops in a clear glass dessert bowl. Fresh mint garnish, scattered berries on white marble countertop. Bright, clean studio lighting with warm highlights. Editorial food magazine style. Wide 16:9 composition, ample negative space. No appliances or products visible.`,
    metadata: {
      primary_category: 'dessert',
      secondary_tags: ['frozen', 'colorful', 'premium'],
      dominant_colors: ['orange', 'pink', 'white'],
      mood: 'vibrant',
      text_placement: 'right',
      background_tone: 'light',
    },
  },
  {
    id: 'chocolate-ice-cream',
    category: 'dessert',
    prompt: `Professional food photography of rich dark chocolate frozen dessert in elegant white bowl, topped with chocolate shavings and fresh raspberries. Minimalist white background, dramatic studio lighting. Premium dessert styling, wide horizontal composition. No kitchen appliances visible.`,
    metadata: {
      primary_category: 'dessert',
      secondary_tags: ['indulgent', 'premium', 'frozen'],
      dominant_colors: ['brown', 'white', 'red'],
      mood: 'indulgent',
      text_placement: 'left',
      background_tone: 'light',
    },
  },

  // Cocktail/Frozen Drinks (2 images)
  {
    id: 'frozen-margarita',
    category: 'cocktail',
    prompt: `Professional beverage photography of a frozen margarita in a salt-rimmed glass with lime wheel garnish. Fresh limes and sea salt scattered on light wooden surface. Bright, refreshing mood with clean white background. Condensation on glass showing freshness. Wide 16:9 format, editorial style. No blender visible.`,
    metadata: {
      primary_category: 'cocktail',
      secondary_tags: ['frozen', 'refreshing', 'premium'],
      dominant_colors: ['green', 'white', 'lime'],
      mood: 'refreshing',
      text_placement: 'right',
      background_tone: 'light',
    },
  },
  {
    id: 'tropical-frozen-cocktail',
    category: 'cocktail',
    prompt: `Professional beverage photography of colorful layered frozen tropical drink in tall hurricane glass. Pineapple wedge and cherry garnish, tropical flowers as props. Bright, vibrant summer mood. Clean white marble surface, soft shadows. Wide composition with space for text overlay. No appliances visible.`,
    metadata: {
      primary_category: 'cocktail',
      secondary_tags: ['tropical', 'colorful', 'summer'],
      dominant_colors: ['orange', 'pink', 'yellow'],
      mood: 'tropical',
      text_placement: 'left',
      background_tone: 'light',
    },
  },

  // Sauce/Dip (2 images)
  {
    id: 'hummus-platter',
    category: 'sauce',
    prompt: `Professional food photography of creamy golden hummus in ceramic bowl with olive oil drizzle and paprika, surrounded by fresh vegetables - cucumber, carrots, bell peppers, cherry tomatoes. Warm terracotta surface, Mediterranean styling. Soft natural lighting. Wide 16:9 aspect ratio. No kitchen appliances.`,
    metadata: {
      primary_category: 'sauce',
      secondary_tags: ['healthy', 'mediterranean', 'fresh'],
      dominant_colors: ['beige', 'orange', 'green'],
      mood: 'warm',
      text_placement: 'bottom-center',
      background_tone: 'light',
    },
  },
  {
    id: 'fresh-pesto',
    category: 'sauce',
    prompt: `Professional food photography of vibrant green basil pesto in white marble mortar, surrounded by fresh basil leaves, pine nuts, parmesan, and garlic. Rustic wooden board, warm natural lighting. Italian culinary styling. Wide horizontal composition with negative space. No blender or products visible.`,
    metadata: {
      primary_category: 'sauce',
      secondary_tags: ['italian', 'fresh', 'premium'],
      dominant_colors: ['green', 'white', 'brown'],
      mood: 'rustic',
      text_placement: 'right',
      background_tone: 'light',
    },
  },

  // Green Smoothie (2 images)
  {
    id: 'vibrant-green-smoothie',
    category: 'smoothie',
    prompt: `Professional beverage photography of bright green spinach kale smoothie in tall clear glass with glass straw. Fresh spinach leaves, kale, green apple slices, and ginger arranged nearby on white marble. Clean, healthy aesthetic with bright natural lighting. Wide 16:9 composition. No blender visible.`,
    metadata: {
      primary_category: 'smoothie',
      secondary_tags: ['healthy', 'green', 'fresh'],
      dominant_colors: ['green', 'white'],
      mood: 'healthy',
      text_placement: 'left',
      background_tone: 'light',
    },
  },
  {
    id: 'detox-green-juice',
    category: 'drink',
    prompt: `Professional food photography of vibrant green juice in mason jar, surrounded by fresh celery, cucumber, green apple, lemon, and leafy greens. Bright white background, clean healthy mood. Morning light feel, editorial wellness styling. Wide format with text space. No appliances visible.`,
    metadata: {
      primary_category: 'drink',
      secondary_tags: ['healthy', 'detox', 'green'],
      dominant_colors: ['green', 'white', 'yellow'],
      mood: 'healthy',
      text_placement: 'right',
      background_tone: 'light',
    },
  },

  // Breakfast (2 images)
  {
    id: 'acai-bowl',
    category: 'smoothie',
    prompt: `Professional food photography of purple acai smoothie bowl topped with sliced banana, fresh berries, granola, coconut flakes, and chia seeds. White ceramic bowl on light wooden board. Bright, healthy morning mood. Clean composition, wide 16:9 format. No kitchen appliances visible.`,
    metadata: {
      primary_category: 'smoothie',
      secondary_tags: ['healthy', 'breakfast', 'colorful'],
      dominant_colors: ['purple', 'white', 'yellow'],
      mood: 'energizing',
      text_placement: 'left',
      background_tone: 'light',
    },
  },
  {
    id: 'overnight-oats',
    category: 'healthy',
    prompt: `Professional food photography of creamy overnight oats in glass jar layered with fresh berries, sliced almonds, and honey drizzle. Scattered oats and berries on white marble surface. Soft morning light, cozy breakfast aesthetic. Wide horizontal composition. No blender visible.`,
    metadata: {
      primary_category: 'healthy',
      secondary_tags: ['breakfast', 'premium', 'fresh'],
      dominant_colors: ['beige', 'red', 'white'],
      mood: 'cozy',
      text_placement: 'right',
      background_tone: 'light',
    },
  },

  // Baby Food (1 image)
  {
    id: 'baby-purees',
    category: 'healthy',
    prompt: `Professional food photography of three small glass jars containing colorful baby food purees - orange carrot, green pea, purple beet. Fresh vegetables arranged nearby. Soft, nurturing aesthetic with pastel tones. Clean white background, gentle lighting. Wide 16:9 composition. No appliances visible.`,
    metadata: {
      primary_category: 'healthy',
      secondary_tags: ['baby', 'colorful', 'fresh'],
      dominant_colors: ['orange', 'green', 'purple'],
      mood: 'nurturing',
      text_placement: 'center',
      background_tone: 'light',
    },
  },

  // Commercial/Professional (2 images)
  {
    id: 'juice-bar-drinks',
    category: 'commercial',
    prompt: `Professional food photography of colorful fresh juice lineup - green, orange, red, purple juices in clear bottles. Fresh fruits and vegetables artfully arranged. Bright, energetic mood. Clean white counter surface, commercial presentation style. Wide 16:9 format. No blenders or equipment visible.`,
    metadata: {
      primary_category: 'commercial',
      secondary_tags: ['juice', 'colorful', 'professional'],
      dominant_colors: ['green', 'orange', 'red'],
      mood: 'energetic',
      text_placement: 'bottom-center',
      background_tone: 'light',
    },
  },
  {
    id: 'restaurant-soup',
    category: 'soup',
    prompt: `Professional food photography of elegant butternut squash soup in white fine dining bowl with cream swirl and microgreen garnish. Sophisticated restaurant plating on dark slate. Dramatic lighting, premium dining aesthetic. Wide composition with negative space. No kitchen equipment visible.`,
    metadata: {
      primary_category: 'soup',
      secondary_tags: ['premium', 'restaurant', 'warm'],
      dominant_colors: ['orange', 'white', 'dark gray'],
      mood: 'sophisticated',
      text_placement: 'left',
      background_tone: 'dark',
    },
  },

  // Seasonal/Tropical (2 images)
  {
    id: 'tropical-smoothie',
    category: 'smoothie',
    prompt: `Professional beverage photography of bright yellow-orange tropical smoothie in coconut shell bowl, topped with passion fruit, mango cubes, and edible flowers. Palm leaf props, bright summer mood. Clean white background, vacation aesthetic. Wide 16:9 format. No blender visible.`,
    metadata: {
      primary_category: 'smoothie',
      secondary_tags: ['tropical', 'summer', 'colorful'],
      dominant_colors: ['yellow', 'orange', 'green'],
      mood: 'tropical',
      text_placement: 'right',
      background_tone: 'light',
    },
  },
  {
    id: 'pumpkin-soup',
    category: 'soup',
    prompt: `Professional food photography of creamy pumpkin soup in rustic ceramic bowl with pepita seeds and sage garnish. Small decorative pumpkins, autumn leaves as props. Warm, cozy fall aesthetic with golden lighting. Wide horizontal composition. No appliances visible.`,
    metadata: {
      primary_category: 'soup',
      secondary_tags: ['fall', 'warm', 'cozy'],
      dominant_colors: ['orange', 'brown', 'cream'],
      mood: 'cozy',
      text_placement: 'left',
      background_tone: 'light',
    },
  },
];

// ============================================
// Google Cloud Auth
// ============================================

/**
 * Get access token from gcloud CLI or service account
 */
async function getAccessToken() {
  // Try gcloud CLI first (for local development)
  try {
    const token = execSync('gcloud auth print-access-token', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (token) {
      console.log('  Using gcloud CLI authentication');
      return token;
    }
  } catch {
    // gcloud not available or not logged in
  }

  // Try service account file
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    try {
      const creds = JSON.parse(await fs.readFile(credPath, 'utf-8'));
      const token = await getServiceAccountToken(creds);
      console.log('  Using service account authentication');
      return token;
    } catch (err) {
      console.error('  Failed to load service account:', err.message);
    }
  }

  throw new Error(
    'No Google Cloud authentication found.\n' +
      'Either:\n' +
      '  1. Run "gcloud auth login" and "gcloud auth application-default login"\n' +
      '  2. Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file'
  );
}

/**
 * Get access token using service account JWT
 */
async function getServiceAccountToken(creds) {
  const { createSign } = await import('crypto');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: creds.client_email,
    sub: creds.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  };

  const header = { alg: 'RS256', typ: 'JWT' };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(creds.private_key, 'base64url');

  const jwt = `${signatureInput}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get Google Cloud project ID
 */
async function getProjectId() {
  // Check env var first
  if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
    return process.env.GOOGLE_CLOUD_PROJECT_ID;
  }

  // Try gcloud config
  try {
    const projectId = execSync('gcloud config get-value project', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (projectId && projectId !== '(unset)') {
      return projectId;
    }
  } catch {
    // gcloud not available
  }

  // Try service account file
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    try {
      const creds = JSON.parse(await fs.readFile(credPath, 'utf-8'));
      if (creds.project_id) {
        return creds.project_id;
      }
    } catch {
      // Ignore
    }
  }

  throw new Error(
    'No Google Cloud project ID found.\n' +
      'Set GOOGLE_CLOUD_PROJECT_ID environment variable.'
  );
}

// ============================================
// Image Generation
// ============================================

/**
 * Generate image using Vertex AI Imagen 3
 */
async function generateImage(prompt, accessToken, projectId) {
  const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/imagen-3.0-generate-001:predict`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '16:9', // Wide hero format
        safetyFilterLevel: 'block_few',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Imagen API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.predictions || data.predictions.length === 0) {
    throw new Error('No image generated');
  }

  // Response contains base64-encoded image
  const base64Image = data.predictions[0].bytesBase64Encoded;
  if (!base64Image) {
    throw new Error('No image data in response');
  }

  return base64Image;
}

/**
 * Upscale image using Vertex AI Imagen upscaler
 * Doubles the resolution (2x)
 */
async function upscaleImage(base64Image, accessToken, projectId) {
  const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/imagen-3.0-generate-001:predict`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [
        {
          prompt: '', // Empty prompt for upscaling
          image: { bytesBase64Encoded: base64Image },
        },
      ],
      parameters: {
        sampleCount: 1,
        mode: 'upscale',
        upscaleConfig: {
          upscaleFactor: 'x2', // 2x upscale: 1408x768 -> 2816x1536
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    // If upscaling fails, return original image
    console.warn(`  Upscaling failed (${response.status}), using original resolution`);
    return base64Image;
  }

  const data = await response.json();

  if (!data.predictions || data.predictions.length === 0 || !data.predictions[0].bytesBase64Encoded) {
    console.warn('  Upscaling returned no data, using original resolution');
    return base64Image;
  }

  return data.predictions[0].bytesBase64Encoded;
}

// ============================================
// R2 Upload
// ============================================

/**
 * Upload image to R2 bucket using wrangler
 */
async function uploadToR2(imageBuffer, filename) {
  const tempPath = path.join(OUTPUT_DIR, filename);

  // Write to temp file
  await fs.writeFile(tempPath, imageBuffer);

  // Upload using wrangler
  try {
    execSync(`npx wrangler r2 object put ${R2_BUCKET}/${filename} --file="${tempPath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(`  Uploaded to R2: ${filename}`);
    return `${R2_PUBLIC_URL}/${filename}`;
  } catch (err) {
    console.error(`  Failed to upload to R2: ${err.message}`);
    throw err;
  }
}

// ============================================
// Code Generation
// ============================================

/**
 * Generate TypeScript entry for hero-images.ts
 */
function generateTsEntry(url, promptData, generatedAt) {
  const { metadata, prompt, id } = promptData;

  return `  '${url}': {
    primary_category: '${metadata.primary_category}',
    secondary_tags: [${metadata.secondary_tags.map((t) => `'${t}'`).join(', ')}],
    dominant_colors: [${metadata.dominant_colors.map((c) => `'${c}'`).join(', ')}],
    mood: '${metadata.mood}',
    content_description: '${prompt.slice(0, 150).replace(/'/g, "\\'")}...',
    quality_score: 8,
    hero_suitable: true,
    hero_notes: 'AI-generated image for ${id.replace(/-/g, ' ')} category',
    text_placement: '${metadata.text_placement}',
    background_tone: '${metadata.background_tone}',
    aspect_ratio: 'wide',
    source: 'generated',
    generated_prompt: \`${prompt.replace(/`/g, '\\`')}\`,
    generated_at: '${generatedAt}',
  },`;
}

// ============================================
// Main
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const listOnly = args.includes('--list');
  const uploadOnly = args.includes('--upload-only');
  const useLocal = args.includes('--local');
  const noUpscale = args.includes('--no-upscale');

  // Find specific prompt index
  const promptIdx = args.findIndex((a) => a === '--prompt');
  const specificPrompt = promptIdx >= 0 ? parseInt(args[promptIdx + 1], 10) : null;

  console.log('Hero Image Generation Tool\n');

  // List mode
  if (listOnly) {
    console.log('Available prompts:\n');
    IMAGE_PROMPTS.forEach((p, i) => {
      console.log(`  ${i.toString().padStart(2)}: ${p.id.padEnd(25)} (${p.category})`);
    });
    console.log(`\nTotal: ${IMAGE_PROMPTS.length} prompts`);
    return;
  }

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Get prompts to process
  const promptsToProcess =
    specificPrompt !== null ? [IMAGE_PROMPTS[specificPrompt]] : IMAGE_PROMPTS;

  if (specificPrompt !== null) {
    console.log(`Processing single prompt: ${specificPrompt} (${promptsToProcess[0]?.id})\n`);
  } else {
    console.log(`Processing all ${promptsToProcess.length} prompts\n`);
  }

  // Dry run mode
  if (dryRun) {
    console.log('DRY RUN - Showing prompts without generating:\n');
    for (const p of promptsToProcess) {
      console.log(`--- ${p.id} (${p.category}) ---`);
      console.log(p.prompt);
      console.log(`\nMetadata: ${JSON.stringify(p.metadata, null, 2)}\n`);
    }
    return;
  }

  // Get authentication
  console.log('Authenticating with Google Cloud...');
  let accessToken, projectId;

  if (!uploadOnly) {
    accessToken = await getAccessToken();
    projectId = await getProjectId();
    console.log(`  Project: ${projectId}`);
    console.log(`  Location: ${VERTEX_AI_LOCATION}\n`);
  }

  // Process each prompt
  const generatedImages = [];
  const generatedAt = new Date().toISOString();

  for (let i = 0; i < promptsToProcess.length; i++) {
    const promptData = promptsToProcess[i];
    const index = specificPrompt !== null ? specificPrompt : i;

    console.log(`[${i + 1}/${promptsToProcess.length}] Generating: ${promptData.id}`);

    try {
      let base64Image;
      const filename = `hero-${promptData.id}.png`;
      const localPath = path.join(OUTPUT_DIR, filename);

      if (uploadOnly) {
        // Read existing image
        try {
          const buffer = await fs.readFile(localPath);
          base64Image = buffer.toString('base64');
          console.log(`  Loaded existing: ${filename}`);
        } catch {
          console.log(`  Skipping (not found): ${filename}`);
          continue;
        }
      } else {
        // Generate new image
        console.log(`  Generating image...`);
        base64Image = await generateImage(promptData.prompt, accessToken, projectId);

        // Upscale to 2x resolution (1408x768 -> 2816x1536)
        if (!noUpscale) {
          console.log(`  Upscaling to 2x...`);
          base64Image = await upscaleImage(base64Image, accessToken, projectId);
        }

        // Save locally
        const imageBuffer = Buffer.from(base64Image, 'base64');
        await fs.writeFile(localPath, imageBuffer);
        console.log(`  Saved locally: ${filename}`);
      }

      // Upload to R2
      console.log(`  Uploading to R2...`);
      const imageBuffer = Buffer.from(base64Image, 'base64');
      const r2Url = await uploadToR2(imageBuffer, filename);

      generatedImages.push({
        ...promptData,
        url: r2Url,
        filename,
        generatedAt,
      });

      console.log(`  ✓ Complete\n`);

      // Rate limiting (Imagen has quotas)
      if (!uploadOnly && i < promptsToProcess.length - 1) {
        console.log('  Waiting 2s for rate limit...\n');
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}\n`);
    }
  }

  // Generate output
  if (generatedImages.length > 0) {
    console.log('\n=== Generated Images ===\n');

    // TypeScript entries
    console.log('TypeScript entries for hero-images.ts:\n');
    for (const img of generatedImages) {
      console.log(generateTsEntry(img.url, img, img.generatedAt));
      console.log();
    }

    // JSON manifest entries
    const manifestEntries = generatedImages.map((img) => ({
      id: `generated-${img.id}`,
      url: img.url,
      source: 'generated',
      category: img.metadata.primary_category,
      prompt: img.prompt,
      generated_at: img.generatedAt,
    }));

    console.log('\nJSON manifest entries:\n');
    console.log(JSON.stringify(manifestEntries, null, 2));

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Generated: ${generatedImages.length} images`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
    console.log(`\nNext steps:`);
    console.log(`  1. Review images in ${OUTPUT_DIR}`);
    console.log(`  2. Add TypeScript entries to hero-images.ts`);
    console.log(`  3. Run: node tools/embed-hero-images.js`);
  } else {
    console.log('No images were generated.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
