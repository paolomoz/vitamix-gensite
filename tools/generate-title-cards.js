/**
 * Generate sumi-e style title card images using Gemini 2.0 Flash
 * Usage: node tools/generate-title-cards.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach((line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) process.env[key.trim()] = val.join('=').trim();
});

const API_KEY = process.env.GOOGLE_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '..', 'demo', 'titles');

const MODEL = 'gemini-3-pro-image-preview';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const STYLE_PREFIX = 'Modern vibrant editorial illustration, soft pastel gradient background (pink to peach to lavender), clean rounded shapes, bright saturated colors, friendly and approachable. Style similar to Adobe Express marketing — colorful, polished, professional. No text or words in the image. 16:9 aspect ratio.';

const CARDS = [
  {
    filename: 'card-same-page.png',
    prompt: `${STYLE_PREFIX} A giant glowing laptop or tablet screen in the center showing a generic website layout. Three diverse people approaching it from different angles — a young parent with a baby carrier, a chef in white coat, and a college student with headphones and backpack. They all look at the SAME screen showing the SAME content. Soft pink-to-peach gradient background. The people are rendered in a warm, friendly, slightly stylized editorial photo-illustration style. Feeling: everyone gets the same experience regardless of who they are.`,
  },
  {
    filename: 'card-manual-fix.png',
    prompt: `${STYLE_PREFIX} A tired but determined marketing professional sitting at a modern desk surrounded by floating webpage mockups and variant cards — maybe 6-8 different versions of the same page fanned out around them. They're manually dragging and arranging content blocks. A calendar on the wall shows months passing. Soft lavender-to-mint gradient background. UI elements and browser windows float around them. Feeling: painstaking manual work, beautiful but impossibly slow.`,
  },
  {
    filename: 'card-imagination-gap.png',
    prompt: `${STYLE_PREFIX} A large colorful question mark made of swirling gradient colors (coral, purple, gold) dominates the center-right. On the left, a crowd of diverse silhouetted people in vibrant colors walking away into a soft misty gradient — families, professionals, young people, elderly. Small thought bubbles with question marks float above them. Soft peach-to-lavender gradient background. Feeling: all the visitors whose needs were never imagined, a vast unknown of missed opportunities.`,
  },
];

async function generateImage(card) {
  console.log(`Generating: ${card.filename}...`);

  const body = {
    contents: [
      {
        parts: [
          { text: card.prompt },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  Error for ${card.filename}: ${res.status} ${err}`);
    return false;
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData);

  if (!imagePart) {
    console.error(`  No image returned for ${card.filename}`);
    console.error('  Parts:', JSON.stringify(parts.map((p) => Object.keys(p))));
    return false;
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const outPath = path.join(OUTPUT_DIR, card.filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`  Saved: ${outPath} (${Math.round(buffer.length / 1024)}KB)`);
  return true;
}

async function main() {
  console.log('Generating sumi-e title card images...\n');

  for (const card of CARDS) {
    const success = await generateImage(card);
    if (!success) {
      console.log(`  Skipping ${card.filename}\n`);
    }
    console.log('');
  }

  console.log('Done!');
}

main();
