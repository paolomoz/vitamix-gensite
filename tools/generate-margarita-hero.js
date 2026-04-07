#!/usr/bin/env node
/**
 * Generate a party-scale frozen margarita hero image using Gemini 2.0 Flash.
 *
 * Uses the Gemini image generation API with a prompt aligned to Vitamix brand
 * photography guidelines: editorial, premium, wide 16:9, no blender.
 *
 * Usage:
 *   node tools/generate-margarita-hero.js
 *
 * Requires GOOGLE_API_KEY in .env
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env manually (no dotenv dependency)
const envFile = await fs.readFile(path.join(__dirname, '../.env'), 'utf-8');
const envVars = Object.fromEntries(
  envFile.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const idx = l.indexOf('=');
    return [l.slice(0, idx), l.slice(idx + 1)];
  }),
);

const GOOGLE_API_KEY = envVars.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.error('Missing GOOGLE_API_KEY in .env');
  process.exit(1);
}

// Brand-aligned prompt for party-scale frozen margaritas
const PROMPT = `Professional editorial food and beverage photography. A beautiful spread of frozen margaritas for a large party: multiple salt-rimmed glasses filled with vibrant lime-green frozen margaritas, arranged on a sleek dark marble countertop. Fresh-cut limes, scattered sea salt crystals, and a large glass pitcher of frozen margarita in the background. Festive but sophisticated mood — this is a premium house party, not a dive bar. Soft warm ambient lighting with a slightly shallow depth of field. Wide 16:9 horizontal composition with generous space on the right side for text overlay. No blender or kitchen appliances visible. No people. No text or logos in the image.`;

const MODEL = 'gemini-3-pro-image-preview';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`;

async function generate() {
  console.log('Generating party margarita hero image with Gemini...');
  console.log(`Prompt: ${PROMPT}\n`);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: PROMPT }],
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`API error ${response.status}: ${text}`);
    process.exit(1);
  }

  const data = await response.json();

  // Extract image from response
  const parts = data.candidates?.[0]?.content?.parts || [];
  let imageData = null;
  let mimeType = 'image/png';

  for (const part of parts) {
    if (part.inlineData) {
      imageData = part.inlineData.data;
      mimeType = part.inlineData.mimeType || 'image/png';
      break;
    }
  }

  if (!imageData) {
    console.error('No image returned. Response:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
  const outputDir = path.join(__dirname, '../generated-images');
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `hero-margarita-party.${ext}`);
  await fs.writeFile(outputPath, Buffer.from(imageData, 'base64'));

  console.log(`Image saved to: ${outputPath}`);
  console.log(`Size: ${(Buffer.from(imageData, 'base64').length / 1024).toFixed(0)} KB`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review the image`);
  console.log(`  2. Upload to R2: wrangler r2 object put vitamix-hero-images/hero-margarita-party.${ext} --file=${outputPath}`);
  console.log(`  3. Add metadata to hero-images.ts`);
}

generate().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
