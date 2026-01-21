#!/usr/bin/env node
/**
 * Vitamix Support Manual Scraper
 *
 * Downloads PDFs from vitamix.com, parses them, and chunks into
 * segments suitable for vector embedding.
 *
 * Usage:
 *   node tools/scrape-support-manuals.js
 *
 * Output:
 *   content/support/manuals/*.json - Chunked manual content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../content/support/manuals');
const CACHE_DIR = path.join(__dirname, '../.cache/manuals');

// Manual definitions with metadata
const MANUALS = [
  {
    id: 'ascent-a2300-a2500',
    name: 'Ascent A2300 & A2500',
    series: 'ascent',
    models: ['A2300', 'A2500'],
    url: 'https://www.vitamix.com/content/dam/vitamix/files/product-manuals/Ascent%20A2300%20and%20A2500%20Domestic%20Owners%20Manual.pdf',
  },
  {
    id: 'ascent-a3300-a3500',
    name: 'Ascent A3300 & A3500',
    series: 'ascent',
    models: ['A3300', 'A3500'],
    url: 'https://www.vitamix.com/content/dam/vitamix/files/product-manuals/Ascent%20A3300%20and%20A3500%20Domestic%20Owners%20Manual.pdf',
  },
  {
    id: 'ascent-x2',
    name: 'Ascent X2',
    series: 'ascent',
    models: ['X2'],
    url: 'https://www.vitamix.com/content/dam/vitamix/files/product-manuals/Ascent%20X2%20Owners%20Manual%20Rev%20B.pdf',
  },
  {
    id: 'ascent-x3-x4-x5',
    name: 'Ascent X3, X4 & X5',
    series: 'ascent',
    models: ['X3', 'X4', 'X5'],
    url: 'https://www.vitamix.com/content/dam/vitamix/files/product-manuals/Ascent%20X3%2c%20X4%2c%20X5%20Owners%20Manual%20Rev%20B.pdf',
  },
  {
    id: 'propel-410-510-750',
    name: 'Propel 410, 510 & 750',
    series: 'propel',
    models: ['Propel 410', 'Propel 510', 'Propel 750'],
    url: 'https://www.vitamix.com/content/dam/vitamix/files/149979_Propel%20410%2c%20510%2c%20%20750_Rev%20A_2024-04-15LR.pdf',
  },
  {
    id: 'explorian-e310',
    name: 'Explorian E310',
    series: 'explorian',
    models: ['E310'],
    url: 'https://www.vitamix.com/content/dam/vitamix/files/product-manuals/E310%20Owner\'s%20Manual.pdf',
  },
  {
    id: 'explorian-e320',
    name: 'Explorian E320',
    series: 'explorian',
    models: ['E320'],
    url: 'https://www.vitamix.com/content/dam/vitamix/files/131719_Explorian%20E320%20Domestic_Rev%20B_2023-07-12LR.pdf',
  },
  {
    id: 'venturist-v1200',
    name: 'Venturist V1200',
    series: 'venturist',
    models: ['V1200'],
    url: 'https://www.vitamix.com/content/dam/vitamix/files/product-manuals/Venturist%20Domestic%20Owners%20Manual.pdf',
  },
];

// Section patterns to identify content type
const SECTION_PATTERNS = {
  safety: /safety|warning|caution|danger|important|hazard/i,
  assembly: /assembl|setup|install|attach|connect|position/i,
  operation: /operat|use|blend|speed|program|start|stop|variable|pulse/i,
  cleaning: /clean|wash|care|maintain|dishwasher|rinse/i,
  troubleshooting: /troubleshoot|problem|issue|error|not working|won't|doesn't/i,
  warranty: /warranty|repair|service|return|replace|coverage/i,
};

/**
 * Download PDF to cache
 */
async function downloadPdf(manual) {
  const cachePath = path.join(CACHE_DIR, `${manual.id}.pdf`);

  // Check cache
  if (fs.existsSync(cachePath)) {
    console.log(`  [cache] Using cached PDF for ${manual.id}`);
    return fs.readFileSync(cachePath);
  }

  console.log(`  [download] Fetching ${manual.url}`);

  const response = await fetch(manual.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${manual.url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  // Save to cache
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath, buffer);

  return buffer;
}

/**
 * Parse PDF and extract text using pdfjs-dist
 */
async function parsePdf(buffer) {
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdfDoc = await loadingTask.promise;

  let fullText = '';

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

/**
 * Detect content type based on text
 */
function detectContentType(text) {
  for (const [type, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(text)) {
      return type;
    }
  }
  return 'general';
}

/**
 * Split text into sections based on headings
 */
function splitIntoSections(text) {
  // Common section heading patterns in Vitamix manuals
  const sectionPatterns = [
    /^(IMPORTANT SAFEGUARDS|SAFETY INSTRUCTIONS|READ ALL INSTRUCTIONS)/mi,
    /^(GETTING STARTED|BEFORE FIRST USE|ASSEMBLY)/mi,
    /^(OPERATING|OPERATION|HOW TO USE|USING YOUR)/mi,
    /^(CLEANING|CARE AND CLEANING|MAINTENANCE)/mi,
    /^(TROUBLESHOOTING|PROBLEMS|IF YOUR BLENDER)/mi,
    /^(WARRANTY|LIMITED WARRANTY|SERVICE)/mi,
    /^(SPECIFICATIONS|SPECS)/mi,
  ];

  const sections = [];
  let currentSection = { title: 'Introduction', content: '' };

  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line is a section header
    let isHeader = false;
    for (const pattern of sectionPatterns) {
      if (pattern.test(trimmed)) {
        // Save previous section if it has content
        if (currentSection.content.trim()) {
          sections.push(currentSection);
        }
        currentSection = { title: trimmed, content: '' };
        isHeader = true;
        break;
      }
    }

    if (!isHeader) {
      currentSection.content += trimmed + ' ';
    }
  }

  // Add final section
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Chunk text into ~500 token segments with overlap
 */
function chunkText(text, maxTokens = 500, overlapTokens = 50) {
  // Rough approximation: 1 token ~= 4 characters
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;

  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap from end of previous chunk
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlapChars / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Process a single manual
 */
async function processManual(manual) {
  console.log(`\nProcessing: ${manual.name}`);

  try {
    // Download PDF
    const pdfBuffer = await downloadPdf(manual);

    // Parse PDF
    console.log(`  [parse] Extracting text...`);
    const text = await parsePdf(pdfBuffer);

    // Split into sections
    const sections = splitIntoSections(text);
    console.log(`  [sections] Found ${sections.length} sections`);

    // Process each section into chunks
    const allChunks = [];

    for (const section of sections) {
      const contentType = detectContentType(section.title + ' ' + section.content);
      const chunks = chunkText(section.content);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk.length < 50) continue; // Skip tiny chunks

        allChunks.push({
          id: `${manual.id}-${section.title.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}-${i}`,
          content: chunk,
          metadata: {
            content_type: contentType,
            product_series: manual.series,
            models: manual.models,
            section_title: section.title,
            manual_name: manual.name,
            chunk_index: i,
            total_chunks: chunks.length,
          },
        });
      }
    }

    console.log(`  [chunks] Created ${allChunks.length} chunks`);

    return allChunks;
  } catch (error) {
    console.error(`  [error] Failed to process ${manual.name}:`, error.message);
    return [];
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Vitamix Support Manual Scraper');
  console.log('==============================\n');

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allChunks = [];

  // Process each manual
  for (const manual of MANUALS) {
    const chunks = await processManual(manual);
    allChunks.push(...chunks);

    // Save individual manual chunks
    const outputPath = path.join(OUTPUT_DIR, `${manual.id}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(chunks, null, 2));
    console.log(`  [save] Saved to ${outputPath}`);

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save combined file
  const combinedPath = path.join(OUTPUT_DIR, '_all-manuals.json');
  fs.writeFileSync(combinedPath, JSON.stringify(allChunks, null, 2));

  console.log('\n==============================');
  console.log(`Total chunks: ${allChunks.length}`);
  console.log(`Combined file: ${combinedPath}`);

  // Print stats by content type
  const byType = {};
  for (const chunk of allChunks) {
    const type = chunk.metadata.content_type;
    byType[type] = (byType[type] || 0) + 1;
  }
  console.log('\nChunks by content type:');
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
}

main().catch(console.error);
