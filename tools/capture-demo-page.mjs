#!/usr/bin/env node
/**
 * Capture a web page as static HTML for demo backup.
 *
 * Usage:
 *   node tools/capture-demo-page.mjs <url> <output-file> [--static]
 *
 * Options:
 *   --static   Skip waiting for SSE generation (for regular pages like vitamix.com)
 *
 * Examples:
 *   node tools/capture-demo-page.mjs \
 *     "https://vitamix.of1.live/?q=protein+shakes&preset=all-cerebras" \
 *     demo/act2.html
 *
 *   node tools/capture-demo-page.mjs --static \
 *     "https://www.vitamix.com/us/en_us/recipes" \
 *     demo/act4-recipes.html
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
const isStatic = args.includes('--static');
const positional = args.filter((a) => !a.startsWith('--'));
const url = positional[0];
const outFile = positional[1];

if (!url || !outFile) {
  console.error('Usage: node tools/capture-demo-page.mjs [--static] <url> <output-file>');
  process.exit(1);
}

const TIMEOUT_MS = 120_000;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`Navigating to ${url} ...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  if (isStatic) {
    // Regular page — just wait for network to settle
    console.log('Waiting for page to load ...');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);
  } else {
    // Generated page — wait for SSE generation to complete
    console.log('Waiting for generation to complete ...');
    try {
      await page.waitForFunction(() => {
        return document.querySelector('.generation-complete')
          || document.body.dataset.generationComplete === 'true'
          || (document.querySelectorAll('main .section').length > 2
              && !document.querySelector('.skeleton, .loading'));
      }, { timeout: TIMEOUT_MS, polling: 2000 });
    } catch {
      console.log('Timeout reached — saving whatever is rendered.');
    }
    await page.waitForTimeout(5000);
  }

  // Extract rendered HTML, stripping generation-triggering scripts
  const staticHtml = await page.evaluate(() => {
    document.querySelectorAll('script[src*="scripts.js"], script[src*="vitamix-scripts"]').forEach((s) => s.remove());
    document.querySelectorAll('.skeleton, .loading, .generation-progress').forEach((el) => el.remove());

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      try {
        const u = new URL(canonical.href);
        u.search = '';
        canonical.href = u.toString();
      } catch { /* ignore */ }
    }

    return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
  });

  const outPath = resolve(process.cwd(), outFile);
  writeFileSync(outPath, staticHtml, 'utf-8');
  console.log(`Saved to ${outPath} (${(staticHtml.length / 1024).toFixed(0)} KB)`);

  await browser.close();
})();
