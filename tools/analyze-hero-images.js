#!/usr/bin/env node
/**
 * Hero Image Analyzer
 *
 * Analyzes seed images with Claude Vision, scrapes vitamix.com for more hero images,
 * and generates a categorized manifest for intelligent image selection.
 *
 * Uses native fetch (Node 18+) and manual .env loading to avoid dependencies.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../content');
const MANIFESTS_DIR = path.join(CONTENT_DIR, 'manifests');

// Load .env manually (no dotenv dependency)
async function loadEnv() {
  try {
    const envPath = path.join(__dirname, '../.env');
    const envContent = await fs.readFile(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  } catch (e) {
    console.log('Warning: Could not load .env file');
  }
}

await loadEnv();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

// Rate limiting
const DELAY_MS = 1500;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Pages to scrape for hero images
const PAGES_TO_SCRAPE = [
  'https://www.vitamix.com/us/en_us',
  'https://www.vitamix.com/us/en_us/shop/blenders',
  'https://www.vitamix.com/us/en_us/shop/ascent-series',
  'https://www.vitamix.com/us/en_us/recipes',
  'https://www.vitamix.com/us/en_us/why-vitamix',
  'https://www.vitamix.com/vr/en_us',
];

// ============================================
// Image Analysis with Claude Vision
// ============================================

const IMAGE_ANALYSIS_PROMPT = `Analyze this image for use as a hero banner on a Vitamix blender website.

Return ONLY valid JSON with this structure:
{
  "primary_category": "one of: smoothie, soup, dessert, drink, cocktail, entree, sauce, salad, breakfast, frozen-treat, healthy, lifestyle, product",
  "secondary_tags": ["up to 3 descriptive tags like: tropical, green, creamy, colorful, warm, fresh, indulgent, family, kitchen"],
  "dominant_colors": ["top 2 colors"],
  "mood": "one of: energizing, comforting, refreshing, indulgent, healthy, sophisticated, premium, warm, vibrant",
  "content_description": "brief description of what's in the image",
  "quality_score": 8,
  "hero_suitable": true,
  "hero_notes": "why this is or isn't suitable as a hero banner (composition, resolution, text overlays, etc.)"
}

Quality score 1-10 based on:
- Visual appeal and composition
- Lighting quality
- Hero banner suitability (wide aspect ratio works, no distracting elements)
- Brand alignment with premium Vitamix aesthetic
- No text overlays that would conflict with hero text

hero_suitable should be true if:
- Image has good composition for hero use
- Would work at wide aspect ratios
- No prominent text overlays
- High visual quality`;

async function analyzeImageWithVision(imageUrl) {
  console.log(`  Analyzing: ${imageUrl.split('/').pop().split('?')[0]}`);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'url',
                  url: imageUrl,
                },
              },
              {
                type: 'text',
                text: IMAGE_ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '{}';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (e) {
    console.log(`  Failed to analyze: ${e.message}`);
    return null;
  }
}

// ============================================
// Scrape Vitamix Pages for Hero Images
// ============================================

async function fetchPage(url) {
  console.log(`  Fetching: ${url}`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function extractImageUrlsFromPage(pageUrl) {
  try {
    const html = await fetchPage(pageUrl);

    // Extract media_* URLs (hero images)
    const mediaPattern = /https:\/\/www\.vitamix\.com\/[^"'\s]+media_[a-f0-9]+\.(jpg|png|jpeg)[^"'\s]*/gi;
    const mediaMatches = html.match(mediaPattern) || [];

    // Extract /content/dam/ URLs (DAM images)
    const damPattern = /\/content\/dam\/vitamix\/[^"'\s]+\.(jpg|png|jpeg)/gi;
    const damMatches = html.match(damPattern) || [];

    // Normalize URLs
    const urls = new Set();

    for (const url of mediaMatches) {
      // Clean up the URL - remove query params for deduplication, but keep for fetching
      const cleanUrl = url.split('?')[0];
      // Add back high-quality params
      urls.add(`${cleanUrl}?width=2000&format=webply&optimize=medium`);
    }

    for (const path of damMatches) {
      // Skip thumbnails and small images
      if (path.includes('470x449') || path.includes('500x500') || path.includes('thumbnail')) {
        continue;
      }
      urls.add(`https://www.vitamix.com${path}`);
    }

    return [...urls];
  } catch (e) {
    console.log(`  Failed to scrape ${pageUrl}: ${e.message}`);
    return [];
  }
}

async function discoverHeroImages() {
  console.log('\n🔍 Discovering hero images from Vitamix website...\n');

  const allUrls = new Set();

  for (const pageUrl of PAGES_TO_SCRAPE) {
    console.log(`Scraping: ${pageUrl}`);
    const urls = await extractImageUrlsFromPage(pageUrl);
    console.log(`  Found ${urls.length} candidate images`);

    for (const url of urls) {
      allUrls.add(url);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nTotal unique images discovered: ${allUrls.size}`);
  return [...allUrls];
}

// ============================================
// Main Analysis Pipeline
// ============================================

async function loadSeedImages() {
  const seedsPath = path.join(MANIFESTS_DIR, 'hero-image-seeds.json');
  try {
    const data = await fs.readFile(seedsPath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.seeds || [];
  } catch (e) {
    console.log('No seed images found at', seedsPath);
    return [];
  }
}

async function analyzeImages(urls, label = 'images') {
  console.log(`\n🔬 Analyzing ${urls.length} ${label}...\n`);

  const results = {};
  let analyzed = 0;
  let failed = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const shortName = url.split('/').pop().split('?')[0];
    console.log(`[${i + 1}/${urls.length}] ${shortName}`);

    const analysis = await analyzeImageWithVision(url);

    if (analysis) {
      results[url] = analysis;
      analyzed++;
      console.log(`  ✓ ${analysis.primary_category} | score: ${analysis.quality_score} | hero: ${analysis.hero_suitable}`);
    } else {
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nAnalyzed: ${analyzed}, Failed: ${failed}`);
  return results;
}

async function main() {
  if (!ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('🎨 Hero Image Analyzer\n');
  console.log(`Manifests directory: ${MANIFESTS_DIR}`);

  const args = process.argv.slice(2);
  const seedsOnly = args.includes('--seeds-only');
  const scrapeOnly = args.includes('--scrape-only');
  const skipScrape = args.includes('--skip-scrape');

  // Load seed images
  const seedUrls = await loadSeedImages();
  console.log(`\nSeed images: ${seedUrls.length}`);

  let allAnalysis = {};

  // Analyze seed images first
  if (!scrapeOnly && seedUrls.length > 0) {
    console.log('\n📌 Phase 1: Analyzing seed images...');
    const seedAnalysis = await analyzeImages(seedUrls, 'seed images');
    allAnalysis = { ...allAnalysis, ...seedAnalysis };
  }

  // Discover and analyze more images
  if (!seedsOnly && !skipScrape) {
    console.log('\n🌐 Phase 2: Discovering more hero images...');
    const discoveredUrls = await discoverHeroImages();

    // Filter out seeds (already analyzed)
    const newUrls = discoveredUrls.filter((url) => !seedUrls.includes(url));
    console.log(`New images to analyze: ${newUrls.length}`);

    if (newUrls.length > 0) {
      // Limit to reasonable number for API costs
      const urlsToAnalyze = newUrls.slice(0, 50);
      console.log(`Analyzing first ${urlsToAnalyze.length} (limit for API costs)`);

      const discoveredAnalysis = await analyzeImages(urlsToAnalyze, 'discovered images');
      allAnalysis = { ...allAnalysis, ...discoveredAnalysis };
    }
  }

  // Generate manifest
  console.log('\n📝 Generating manifest...');

  // Filter for hero-suitable images
  const heroSuitable = {};
  const categories = {};

  for (const [url, analysis] of Object.entries(allAnalysis)) {
    if (analysis.hero_suitable && analysis.quality_score >= 6) {
      heroSuitable[url] = analysis;

      // Track categories
      const cat = analysis.primary_category;
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(url);
    }
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    total_analyzed: Object.keys(allAnalysis).length,
    hero_suitable_count: Object.keys(heroSuitable).length,
    categories: Object.fromEntries(
      Object.entries(categories).map(([cat, urls]) => [cat, urls.length])
    ),
    images: allAnalysis,
  };

  // Save manifest
  const manifestPath = path.join(MANIFESTS_DIR, 'hero-image-analysis.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Saved manifest to ${manifestPath}`);

  // Summary
  console.log('\n📊 Summary:');
  console.log(`  Total analyzed: ${manifest.total_analyzed}`);
  console.log(`  Hero suitable: ${manifest.hero_suitable_count}`);
  console.log('  By category:');
  for (const [cat, count] of Object.entries(manifest.categories)) {
    console.log(`    ${cat}: ${count}`);
  }

  console.log('\n🎉 Analysis complete!\n');
}

main().catch(console.error);
