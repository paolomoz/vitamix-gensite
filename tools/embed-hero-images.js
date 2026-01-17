#!/usr/bin/env node
/**
 * Hero Image Embedding Tool
 *
 * Extracts hero image data from hero-images.ts and posts to the embed worker.
 *
 * Usage:
 *   node tools/embed-hero-images.js [--local]
 *
 * Options:
 *   --local   Use local worker (http://localhost:8787) instead of production
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WORKER_URL_PROD = 'https://vitamix-gensite-embed-recipes.paolo-moz.workers.dev';
const WORKER_URL_LOCAL = 'http://localhost:8787';

/**
 * Parse hero-images.ts to extract ANALYZED_IMAGES data
 */
async function extractHeroImages() {
  const heroImagesPath = path.join(
    __dirname,
    '../workers/vitamix-gensite-recommender/src/lib/hero-images.ts'
  );

  const content = await fs.readFile(heroImagesPath, 'utf-8');

  // Extract the ANALYZED_IMAGES object
  const match = content.match(/const ANALYZED_IMAGES[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!match) {
    throw new Error('Could not find ANALYZED_IMAGES in hero-images.ts');
  }

  const images = [];

  // Parse each image entry
  // Match URL keys and their objects
  const urlPattern = /'(https:\/\/[^']+)':\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let urlMatch;

  while ((urlMatch = urlPattern.exec(match[1])) !== null) {
    const url = urlMatch[1];
    const objContent = urlMatch[2];

    // Extract fields from the object
    const getString = (field) => {
      const m = objContent.match(new RegExp(`${field}:\\s*['"]([^'"]+)['"]`));
      return m ? m[1] : '';
    };

    const getNumber = (field) => {
      const m = objContent.match(new RegExp(`${field}:\\s*(\\d+)`));
      return m ? parseInt(m[1], 10) : 0;
    };

    const getArray = (field) => {
      const m = objContent.match(new RegExp(`${field}:\\s*\\[([^\\]]+)\\]`));
      if (!m) return [];
      return m[1]
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    };

    const getBool = (field) => {
      const m = objContent.match(new RegExp(`${field}:\\s*(true|false)`));
      return m ? m[1] === 'true' : false;
    };

    // Only include hero-suitable images
    if (!getBool('hero_suitable')) {
      console.log(`  Skipping (not hero_suitable): ${url.split('/').pop().split('?')[0]}`);
      continue;
    }

    images.push({
      url,
      primary_category: getString('primary_category'),
      secondary_tags: getArray('secondary_tags'),
      dominant_colors: getArray('dominant_colors'),
      mood: getString('mood'),
      content_description: getString('content_description'),
      quality_score: getNumber('quality_score'),
      text_placement: getString('text_placement'),
      background_tone: getString('background_tone'),
      aspect_ratio: getString('aspect_ratio'),
    });
  }

  return images;
}

/**
 * Post images to embed worker
 */
async function embedImages(images, workerUrl) {
  console.log(`\nPosting ${images.length} images to ${workerUrl}/embed-images...\n`);

  const response = await fetch(`${workerUrl}/embed-images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ images }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Worker error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Query to test embeddings
 */
async function testQuery(query, workerUrl) {
  console.log(`\nTesting query: "${query}"\n`);

  const response = await fetch(`${workerUrl}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, topK: 5 }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Query error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function main() {
  const args = process.argv.slice(2);
  const useLocal = args.includes('--local');
  const testMode = args.includes('--test');
  const workerUrl = useLocal ? WORKER_URL_LOCAL : WORKER_URL_PROD;

  console.log('Hero Image Embedding Tool\n');
  console.log(`Worker URL: ${workerUrl}`);

  if (testMode) {
    // Just test query
    const query = args.find((a) => !a.startsWith('--')) || 'warm soup cozy kitchen';
    const results = await testQuery(query, workerUrl);
    console.log('Results:');
    for (const r of results.results || []) {
      console.log(`  ${r.score.toFixed(3)} | ${r.id} | ${r.title || r.category}`);
    }
    return;
  }

  // Extract images from hero-images.ts
  console.log('\nExtracting images from hero-images.ts...');
  const images = await extractHeroImages();
  console.log(`Found ${images.length} hero-suitable images`);

  // Show what we're embedding
  console.log('\nImages to embed:');
  for (const img of images) {
    const shortUrl = img.url.split('media_')[1]?.split('?')[0] || img.url.slice(-40);
    console.log(`  ${img.primary_category.padEnd(10)} | ${img.mood.padEnd(12)} | ${shortUrl}`);
  }

  // Embed
  const result = await embedImages(images, workerUrl);

  console.log('\nResult:');
  console.log(`  Success: ${result.success}`);
  console.log(`  Processed: ${result.processed}`);
  if (result.errors?.length) {
    console.log(`  Errors: ${result.errors.join(', ')}`);
  }

  // Test query
  console.log('\n--- Testing semantic search ---');
  const testQueries = [
    'warm soup cozy kitchen',
    'green healthy smoothie',
    'premium black blender professional',
    'colorful fruits tropical',
  ];

  for (const query of testQueries) {
    const results = await testQuery(query, workerUrl);
    console.log(`\n"${query}":`);
    for (const r of (results.results || []).slice(0, 3)) {
      if (r.id.startsWith('hero-')) {
        console.log(`  ${r.score.toFixed(3)} | ${r.category || r.id}`);
      }
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
