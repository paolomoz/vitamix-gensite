#!/usr/bin/env node
/**
 * Regenerate Hero Images with Improved Composition
 *
 * This script regenerates hero images that have centered subjects,
 * repositioning them to the left or right to allow clear text placement.
 *
 * Usage:
 *   node tools/regenerate-centered-images.js [options]
 *
 * Options:
 *   --dry-run      Preview prompts without generating images
 *   --prompt N     Generate only prompt N (0-indexed)
 *   --list         List all prompts with their indices
 *   --upload-only  Skip generation, just upload existing images
 *   --no-upscale   Skip 2x upscaling
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
const R2_BUCKET = 'vitamix-hero-images';
const R2_PUBLIC_URL = 'https://pub-vitamix-hero-images.r2.dev';

// ============================================
// IMPROVED Prompts - Subjects positioned LEFT or RIGHT
// ============================================

const IMPROVED_PROMPTS = [
  // Centered images that need regeneration with better composition
  {
    id: 'hummus-platter',
    category: 'sauce',
    position: 'left', // Subject on LEFT, text goes on RIGHT
    prompt: `Professional food photography of creamy golden hummus in ceramic bowl with olive oil drizzle and paprika. Bowl positioned on the LEFT SIDE of frame with fresh vegetables (cucumber, carrots, bell peppers) arranged to the left. Large empty negative space on the RIGHT SIDE for text overlay. Warm terracotta surface, Mediterranean styling. Soft natural lighting. Wide 16:9 aspect ratio. No kitchen appliances.`,
    metadata: {
      primary_category: 'sauce',
      secondary_tags: ['healthy', 'mediterranean', 'fresh'],
      dominant_colors: ['beige', 'orange', 'green'],
      mood: 'warm',
      text_placement: 'right',
      background_tone: 'light',
    },
  },
  {
    id: 'baby-purees',
    category: 'healthy',
    position: 'right', // Subject on RIGHT, text goes on LEFT
    prompt: `Professional food photography of three small glass jars containing colorful baby food purees - orange carrot, green pea, purple beet. Jars arranged on the RIGHT SIDE of frame with fresh vegetables nearby. Large empty negative space on the LEFT SIDE for text overlay. Soft, nurturing aesthetic with pastel mint green background. Gentle lighting. Wide 16:9 composition. No appliances visible.`,
    metadata: {
      primary_category: 'healthy',
      secondary_tags: ['baby', 'colorful', 'fresh'],
      dominant_colors: ['orange', 'green', 'purple'],
      mood: 'nurturing',
      text_placement: 'left',
      background_tone: 'light',
    },
  },
  {
    id: 'juice-bar-drinks',
    category: 'commercial',
    position: 'left', // Subject on LEFT, text goes on RIGHT
    prompt: `Professional food photography of colorful fresh juice lineup - green, orange, red, purple juices in clear bottles. Bottles arranged in a diagonal line on the LEFT SIDE of frame with fresh fruits nearby. Large empty dark gradient space on the RIGHT SIDE for text overlay. Bright, energetic mood. Clean counter surface, commercial presentation style. Wide 16:9 format. No blenders or equipment visible.`,
    metadata: {
      primary_category: 'commercial',
      secondary_tags: ['juice', 'colorful', 'professional'],
      dominant_colors: ['green', 'orange', 'red'],
      mood: 'energetic',
      text_placement: 'right',
      background_tone: 'dark',
    },
  },
  {
    id: 'frozen-fruit-sorbet',
    category: 'dessert',
    position: 'right', // Subject on RIGHT, text goes on LEFT
    prompt: `Professional food photography of vibrant mango and raspberry sorbet scoops in a clear glass dessert bowl. Bowl positioned on the RIGHT SIDE of frame with fresh mint garnish and scattered berries. Large empty dark gradient space on the LEFT SIDE for text overlay. Bright, clean studio lighting with warm highlights. Editorial food magazine style. Wide 16:9 composition. No appliances visible.`,
    metadata: {
      primary_category: 'dessert',
      secondary_tags: ['frozen', 'colorful', 'premium'],
      dominant_colors: ['orange', 'pink', 'white'],
      mood: 'vibrant',
      text_placement: 'left',
      background_tone: 'dark',
    },
  },
  {
    id: 'acai-bowl',
    category: 'smoothie',
    position: 'right', // Subject on RIGHT, text goes on LEFT
    prompt: `Professional food photography of purple acai smoothie bowl topped with sliced banana, fresh berries, granola, coconut flakes, and chia seeds. White ceramic bowl positioned on the RIGHT SIDE of frame on light wooden board. Large empty white/cream space on the LEFT SIDE for text overlay. Bright, healthy morning mood. Clean composition, wide 16:9 format. No kitchen appliances visible.`,
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
    id: 'fresh-pesto',
    category: 'sauce',
    position: 'left', // Subject on LEFT, text goes on RIGHT
    prompt: `Professional food photography of vibrant green basil pesto in white marble mortar with pestle. Mortar positioned on the LEFT SIDE of frame, surrounded by fresh basil leaves, pine nuts, parmesan, and garlic on the left. Large empty dark wooden space on the RIGHT SIDE for text overlay. Rustic wooden board, warm natural lighting. Italian culinary styling. Wide horizontal composition. No blender visible.`,
    metadata: {
      primary_category: 'sauce',
      secondary_tags: ['italian', 'fresh', 'premium'],
      dominant_colors: ['green', 'white', 'brown'],
      mood: 'rustic',
      text_placement: 'right',
      background_tone: 'dark',
    },
  },
  {
    id: 'vibrant-green-smoothie',
    category: 'smoothie',
    position: 'right', // Subject on RIGHT, text goes on LEFT
    prompt: `Professional beverage photography of bright green spinach kale smoothie in tall clear glass with glass straw. Glass positioned on the RIGHT SIDE of frame with fresh spinach leaves, kale, and apple slices arranged nearby on the right. Large empty dark space on the LEFT SIDE for text overlay. Clean, healthy aesthetic with bright natural lighting. Wide 16:9 composition. No blender visible.`,
    metadata: {
      primary_category: 'smoothie',
      secondary_tags: ['healthy', 'green', 'fresh'],
      dominant_colors: ['green', 'white'],
      mood: 'healthy',
      text_placement: 'left',
      background_tone: 'dark',
    },
  },
  {
    id: 'detox-green-juice',
    category: 'drink',
    position: 'left', // Subject on LEFT, text goes on RIGHT
    prompt: `Professional food photography of vibrant green juice in mason jar with cucumber slice on rim. Jar positioned on the LEFT SIDE of frame with fresh celery, cucumber, green apple, and lemon arranged nearby on the left. Large empty light grey/white space on the RIGHT SIDE for text overlay. Bright white background, clean healthy mood. Morning light feel. Wide format. No appliances visible.`,
    metadata: {
      primary_category: 'drink',
      secondary_tags: ['healthy', 'detox', 'green'],
      dominant_colors: ['green', 'white', 'yellow'],
      mood: 'healthy',
      text_placement: 'right',
      background_tone: 'light',
    },
  },
  {
    id: 'restaurant-soup',
    category: 'soup',
    position: 'right', // Subject on RIGHT, text goes on LEFT
    prompt: `Professional food photography of elegant butternut squash soup in white fine dining bowl with cream swirl and microgreen garnish. Bowl positioned on the RIGHT SIDE of frame on dark slate. Large empty dark space on the LEFT SIDE for text overlay. Sophisticated restaurant plating. Dramatic lighting from the right, premium dining aesthetic. Wide composition. No kitchen equipment visible.`,
    metadata: {
      primary_category: 'soup',
      secondary_tags: ['premium', 'restaurant', 'warm'],
      dominant_colors: ['orange', 'white', 'dark gray'],
      mood: 'sophisticated',
      text_placement: 'left',
      background_tone: 'dark',
    },
  },
  {
    id: 'pumpkin-soup',
    category: 'soup',
    position: 'left', // Subject on LEFT, text goes on RIGHT
    prompt: `Professional food photography of creamy pumpkin soup in rustic ceramic bowl with pepita seeds and sage garnish. Bowl positioned on the LEFT SIDE of frame with small decorative pumpkins behind it on the left. Large empty dark brown/moody space on the RIGHT SIDE for text overlay. Warm, cozy fall aesthetic with golden lighting. Wide horizontal composition. No appliances visible.`,
    metadata: {
      primary_category: 'soup',
      secondary_tags: ['fall', 'warm', 'cozy'],
      dominant_colors: ['orange', 'brown', 'cream'],
      mood: 'cozy',
      text_placement: 'right',
      background_tone: 'dark',
    },
  },
];

// ============================================
// Google Cloud Auth (same as original)
// ============================================

async function getAccessToken() {
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
    // gcloud not available
  }

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

  throw new Error('No Google Cloud authentication found.');
}

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

async function getProjectId() {
  if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
    return process.env.GOOGLE_CLOUD_PROJECT_ID;
  }

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

  throw new Error('No Google Cloud project ID found.');
}

// ============================================
// Image Generation
// ============================================

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
        aspectRatio: '16:9',
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

  return data.predictions[0].bytesBase64Encoded;
}

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
          prompt: '',
          image: { bytesBase64Encoded: base64Image },
        },
      ],
      parameters: {
        sampleCount: 1,
        mode: 'upscale',
        upscaleConfig: {
          upscaleFactor: 'x2',
        },
      },
    }),
  });

  if (!response.ok) {
    console.warn(`  Upscaling failed, using original resolution`);
    return base64Image;
  }

  const data = await response.json();

  if (!data.predictions?.[0]?.bytesBase64Encoded) {
    console.warn('  Upscaling returned no data, using original resolution');
    return base64Image;
  }

  return data.predictions[0].bytesBase64Encoded;
}

// ============================================
// R2 Upload
// ============================================

async function uploadToR2(imageBuffer, filename) {
  const tempPath = path.join(OUTPUT_DIR, filename);
  await fs.writeFile(tempPath, imageBuffer);

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
// Main
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const listOnly = args.includes('--list');
  const uploadOnly = args.includes('--upload-only');
  const noUpscale = args.includes('--no-upscale');

  const promptIdx = args.findIndex((a) => a === '--prompt');
  const specificPrompt = promptIdx >= 0 ? parseInt(args[promptIdx + 1], 10) : null;

  console.log('Hero Image Regeneration Tool (Improved Composition)\n');
  console.log('This script regenerates images that had centered subjects,');
  console.log('repositioning them to the left or right for better text placement.\n');

  if (listOnly) {
    console.log('Images to regenerate:\n');
    IMPROVED_PROMPTS.forEach((p, i) => {
      console.log(`  ${i.toString().padStart(2)}: ${p.id.padEnd(25)} → subject ${p.position.toUpperCase()}, text ${p.metadata.text_placement.toUpperCase()}`);
    });
    console.log(`\nTotal: ${IMPROVED_PROMPTS.length} images`);
    return;
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const promptsToProcess =
    specificPrompt !== null ? [IMPROVED_PROMPTS[specificPrompt]] : IMPROVED_PROMPTS;

  if (specificPrompt !== null) {
    console.log(`Processing single prompt: ${specificPrompt} (${promptsToProcess[0]?.id})\n`);
  } else {
    console.log(`Processing all ${promptsToProcess.length} prompts\n`);
  }

  if (dryRun) {
    console.log('DRY RUN - Showing improved prompts:\n');
    for (const p of promptsToProcess) {
      console.log(`--- ${p.id} (subject ${p.position}, text ${p.metadata.text_placement}) ---`);
      console.log(p.prompt);
      console.log();
    }
    return;
  }

  console.log('Authenticating with Google Cloud...');
  let accessToken, projectId;

  if (!uploadOnly) {
    accessToken = await getAccessToken();
    projectId = await getProjectId();
    console.log(`  Project: ${projectId}`);
    console.log(`  Location: ${VERTEX_AI_LOCATION}\n`);
  }

  const generatedImages = [];
  const generatedAt = new Date().toISOString();

  for (let i = 0; i < promptsToProcess.length; i++) {
    const promptData = promptsToProcess[i];

    console.log(`[${i + 1}/${promptsToProcess.length}] Regenerating: ${promptData.id} (subject ${promptData.position})`);

    try {
      let base64Image;
      const filename = `hero-${promptData.id}.png`;
      const localPath = path.join(OUTPUT_DIR, filename);

      if (uploadOnly) {
        try {
          const buffer = await fs.readFile(localPath);
          base64Image = buffer.toString('base64');
          console.log(`  Loaded existing: ${filename}`);
        } catch {
          console.log(`  Skipping (not found): ${filename}`);
          continue;
        }
      } else {
        console.log(`  Generating image...`);
        base64Image = await generateImage(promptData.prompt, accessToken, projectId);

        if (!noUpscale) {
          console.log(`  Upscaling to 2x...`);
          base64Image = await upscaleImage(base64Image, accessToken, projectId);
        }

        const imageBuffer = Buffer.from(base64Image, 'base64');
        await fs.writeFile(localPath, imageBuffer);
        console.log(`  Saved locally: ${filename}`);
      }

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

      if (!uploadOnly && i < promptsToProcess.length - 1) {
        console.log('  Waiting 2s for rate limit...\n');
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}\n`);
    }
  }

  if (generatedImages.length > 0) {
    console.log('\n=== Summary ===');
    console.log(`Regenerated: ${generatedImages.length} images`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
    console.log(`\nComposition improvements:`);
    for (const img of generatedImages) {
      console.log(`  - ${img.id}: subject ${img.position}, text_placement: ${img.metadata.text_placement}`);
    }
    console.log(`\nNext steps:`);
    console.log(`  1. Review images in ${OUTPUT_DIR}`);
    console.log(`  2. Update hero-images.ts with corrected text_placement values`);
    console.log(`  3. Run: node tools/embed-hero-images.js`);
  } else {
    console.log('No images were regenerated.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
