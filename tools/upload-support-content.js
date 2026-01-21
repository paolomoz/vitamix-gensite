#!/usr/bin/env node
/**
 * Upload scraped support manual content to SUPPORT_VECTORIZE
 *
 * Usage:
 *   node tools/upload-support-content.js [--local] [--batch-size=100]
 *
 * Options:
 *   --local       Use local worker (http://localhost:8787)
 *   --batch-size  Number of chunks per request (default: 100)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Worker URLs
const LOCAL_URL = 'http://localhost:8787';
const DEPLOYED_URL = 'https://vitamix-gensite-recommender.paolo-moz.workers.dev';

async function main() {
  const args = process.argv.slice(2);
  const useLocal = args.includes('--local');
  const batchSizeArg = args.find(a => a.startsWith('--batch-size='));
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 100;

  const workerUrl = useLocal ? LOCAL_URL : DEPLOYED_URL;

  console.log('📤 Uploading support content to Vectorize');
  console.log(`   Worker: ${workerUrl}`);
  console.log(`   Batch size: ${batchSize}`);

  // Load chunks
  const chunksPath = path.join(__dirname, '../content/support/manuals/_all-manuals.json');
  console.log(`   Loading: ${chunksPath}`);

  try {
    const data = await fs.readFile(chunksPath, 'utf-8');
    const chunks = JSON.parse(data);

    console.log(`   Total chunks: ${chunks.length}\n`);

    // Upload in batches
    let totalProcessed = 0;
    let totalErrors = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(chunks.length / batchSize);

      console.log(`[${batchNum}/${totalBatches}] Uploading ${batch.length} chunks...`);

      try {
        const response = await fetch(`${workerUrl}/embed-support`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chunks: batch }),
        });

        const result = await response.json();

        if (result.success) {
          totalProcessed += result.processed;
          console.log(`   ✓ Processed: ${result.processed}, Batches: ${result.batches}`);
          if (result.errors?.length) {
            totalErrors += result.errors.length;
            result.errors.forEach(e => console.log(`   ⚠ ${e}`));
          }
        } else {
          console.log(`   ✗ Error: ${result.error}`);
          totalErrors++;
        }
      } catch (error) {
        console.log(`   ✗ Request failed: ${error.message}`);
        totalErrors++;
      }

      // Small delay between batches
      if (i + batchSize < chunks.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log('\n✅ Upload complete!');
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   Total errors: ${totalErrors}`);

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ _all-manuals.json not found. Run the scraper first:');
      console.error('   node tools/scrape-support-manuals.js');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

main();
