#!/usr/bin/env node
// One-off script: generates the triptych background for titles3 via Gemini 3 Pro Image Preview.
// Run from the repo root: node demo/titles3/generate-bg.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load API key from .env
const envPath = resolve(__dirname, '../../.env');
const envText = readFileSync(envPath, 'utf8');
const match = envText.match(/^GOOGLE_API_KEY=(.+)$/m);
if (!match) {
  console.error('GOOGLE_API_KEY not found in .env');
  process.exit(1);
}
const apiKey = match[1].trim();

const MODEL = 'gemini-3-pro-image-preview';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

const prompt = `An ultra-wide panoramic editorial illustration, 21:9 aspect ratio, depicting three connected scenes in one continuous landscape that reads left-to-right as a visual narrative of how websites evolve. Cinematic painterly illustration style. Rich atmospheric lighting. Muted, filmic color palette inspired by concept art from Pixar and editorial illustrations from The New Yorker. The three scenes blend seamlessly — no hard borders or panel dividers. Terrain, sky, and light transition smoothly across the full width.

LEFT THIRD — "The Same Page":
A vast gray urban plaza under overcast, monochromatic light. Hundreds of nearly identical silhouetted human figures stand in rigid, repeating rows, all facing a single enormous billboard that displays the exact same webpage. Cold blue-gray palette. Minimal color variation. Feeling: uniformity, conformity, mass-produced sameness.

MIDDLE THIRD — "Audience Variants":
The rigid crowd loosens into 6 or 7 distinct smaller clusters of people, each gathered around a slightly different medium-sized screen showing a slightly different webpage variant. The people in each cluster wear subtly different colored clothing that matches their variant. The terrain gently warms; amber and teal accents emerge in the sky. Feeling: segmentation, categories, effortful manual work.

RIGHT THIRD — "Audiences of One":
The scene opens into a luminous golden-hour landscape where each individual person has their own unique personalized screen floating beside them, every screen different, every person visually distinct — diverse ages, genders, cultures, styles. Warm sunset tones, rich color, abundant detail. Feeling: individuality, possibility, a page imagined for each person.

Composition notes:
- Treat it as ONE continuous mural, not three separate panels.
- Leave the top third of the image softer, with atmospheric sky, haze, and negative space — room for text overlay.
- Horizon line should run consistently across all three scenes.
- Do NOT include any text, words, letters, numbers, labels, or UI text anywhere in the image.
- No borders, frames, or dividers between scenes.`;

console.log(`Calling ${MODEL}…`);
const t0 = Date.now();

const res = await fetch(URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '21:9' },
    },
  }),
});

const json = await res.json();
if (!res.ok) {
  console.error('API error:', JSON.stringify(json, null, 2));
  process.exit(1);
}

const parts = json?.candidates?.[0]?.content?.parts || [];
const imagePart = parts.find((p) => p.inlineData?.data);
if (!imagePart) {
  console.error('No image in response:', JSON.stringify(json, null, 2));
  process.exit(1);
}

const buf = Buffer.from(imagePart.inlineData.data, 'base64');
const outPath = resolve(__dirname, 'bg.png');
writeFileSync(outPath, buf);
console.log(`Saved ${outPath} (${buf.length} bytes, ${Date.now() - t0}ms)`);
