# Vitamix POC - AEM Edge Delivery Services

An AI-powered content generation platform built on AEM Edge Delivery Services (aem.live) that creates personalized product pages, recipes, and support content based on user queries.

## Quick Start
- `npm i` - Install dependencies
- `aem up` - Start local dev server at http://localhost:3000
- `npm run lint` - Run ESLint

## Architecture Overview

### Core Flow
```
User Query → Worker API (SSE) → Block Streaming → Page Decoration → DA Persistence
```

### Key Directories
- `/blocks/` - 72 custom blocks (see Block Categories below)
- `/scripts/` - Core decoration, utilities, analytics
- `/styles/` - Global CSS
- `/workers/` - Cloudflare Workers (recommender, analytics, embeddings)
- `/.claude/skills/` - Claude Code skills for development workflows

### Cloudflare Workers
| Worker | URL | Purpose |
|--------|-----|---------|
| vitamix-recommender | `vitamix-gensite-recommender.paolo-moz.workers.dev` | Main AI generation (Claude + Cerebras) |
| vitamix-analytics | `vitamix-gensite-analytics.paolo-moz.workers.dev` | Tracking & multi-agent analysis |
| embed-recipes | (internal) | Recipe vector embeddings |

## Key Files

### Entry Points
- `scripts/scripts.js` - Main orchestrator, handles generation modes
- `scripts/aem.js` - Standard EDS utilities (decoration, block loading)
- `scripts/delayed.js` - Analytics setup (loads after page)

### Utilities
- `scripts/session-context.js` - Query history in sessionStorage (max 10)
- `scripts/analytics-tracker.js` - Event tracking (respects DNT)
- `scripts/cta-utils.js` - Link classification, purchase-intent sanitization

## Block Categories (72 total)

### AI/Search (Core)
`query-form`, `cerebras-generated`, `ingredient-search`, `quick-answer`, `reasoning`, `support-triage`

### Products
`product-cards`, `product-recommendation`, `product-hero`, `product-compare`, `product-cta`, `product-info`

### Recipes
`recipe-cards`, `recipe-hero`, `recipe-steps`, `recipe-tabs`, `recipe-filter-bar`, `recipe-grid`

### Analytics
`analytics-queries`, `analytics-last-queries`, `analytics-analysis`, `analytics-metrics`, `analytics-dashboard`

### Layout/Content
`hero`, `cards`, `columns`, `split-content`, `fragment`, `header`, `footer`, `faq`, `testimonials`

### Specialized
`accessibility-specs`, `budget-breakdown`, `engineering-specs`, `sustainability-info`, `allergen-safety`, `smart-features`

## Generation Modes

| Mode | URL Param | Worker | Features |
|------|-----------|--------|----------|
| Recommender | `?q=` or `?query=` | vitamix-recommender | Session context, auto-persist, journey tracking |
| Fast | `?fast=` | vitamix-generative-fast | Two-phase (hero first), manual save |
| Standard | `?generate=` | vitamix-generative | Full streaming, progress indicators |
| Experiment | `?experiment=` | N/A | Fade-in animations, POC |

## AI Model Configuration

### Presets (in vitamix-recommender)
- **production**: Claude Opus (reasoning) + Cerebras (content)
- **fast**: Claude Sonnet (reasoning) + Cerebras (content)
- **all-cerebras**: Pure Cerebras stack (cost-optimized)

### Services Used
- **Anthropic**: Intent analysis, block selection reasoning
- **Cerebras**: Content generation, classification
- **OpenAI/Gemini**: Multi-agent analysis consensus (analytics)
- **Cloudflare Vectorize**: Recipe semantic search

## Environment Variables (.env)
```
ANTHROPIC_API_KEY=sk-ant-...
CEREBRAS_API_KEY=csk-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIza...
DA_IMS_TOKEN=eyJ... (Adobe IMS JWT)
FAL_API_KEY=... (optional, video generation)
```

## Conventions

### Code Style
- ESM modules (no CommonJS)
- kebab-case for CSS classes, camelCase for JS properties
- JSDoc for complex functions
- `[ModuleName]` prefix for console logging

### Block Structure
```
blocks/{block-name}/
  ├── {block-name}.js   # export default function decorate(block) {...}
  └── {block-name}.css
```

### Block JS Pattern
```javascript
export default function decorate(block) {
  const rows = [...block.children];
  // Transform DA table to presentational HTML
  block.innerHTML = '<div class="block-content">...</div>';
}
```

### Image Handling
- `data-gen-image="{id}"` for AI-generated images
- `data-original-src` stores original URL during generation
- Cache-busting: `url + '?_t=' + Date.now()`
- Use `createOptimizedPicture()` for authored images (skip for generated)

### CTA Sanitization
Purchase-intent language is auto-converted:
- "Buy Now" → "Learn More"
- "Add to Cart" → "View Details"
- "Purchase" → "Explore"

## Development Workflow

**IMPORTANT**: For ALL block development, start with the `content-driven-development` skill:
```
Using Skill: content-driven-development
```

### Available Skills (in /.claude/skills/)
- `content-driven-development` - Main development workflow
- `building-blocks` - Create/modify blocks
- `content-modeling` - Design block content models
- `block-inventory` - Survey available blocks
- `block-collection-and-party` - Reference implementations
- `testing-blocks` - Test code changes
- `page-import` - Import external pages

## Frontend & Block Design

For frontend design work—especially block design—use **impeccable** capabilities to create distinctive, brand-aligned interfaces that match the Vitamix design system documented above.

### When to Use Impeccable
- Creating new blocks or components
- Redesigning or enhancing existing blocks
- Building any user-facing UI elements
- Reviewing design quality before shipping

### Key Impeccable Capabilities
| Capability | When to Use |
|------------|-------------|
| `impeccable:frontend-design` | Primary tool for creating new blocks and components. Generates production-grade code aligned with brand aesthetics. |
| `impeccable:normalize` | After creating/modifying blocks, ensure consistency with the Vitamix design system (colors, typography, spacing tokens). |
| `impeccable:polish` | Final pass before shipping. Fixes alignment, spacing, and detail issues. |
| `impeccable:audit` | Comprehensive quality check across accessibility, performance, theming, and responsive design. |
| `impeccable:critique` | Evaluate design effectiveness—visual hierarchy, information architecture, and overall UX quality. |
| `impeccable:clarify` | Improve labels, error messages, and microcopy for better usability. |
| `impeccable:adapt` | Ensure blocks work across different screen sizes and devices. |

### Design Alignment Checklist
When designing blocks, ensure:
- Colors use Vitamix tokens (`--color-red`, `--color-charcoal`, etc.)
- Typography follows Sentinel (headings) + Gotham Narrow (body) hierarchy
- Spacing uses system tokens (`--spacing-100`, `--spacing-400`, etc.)
- Visual tone matches: clean, premium, editorial, photography-forward
- Reference `../vitamix/` (EDS production site) as the source of truth

## Testing

### Visual Testing
- `/test-blocks/` - Visual test pages
- `/test-results/` - Test result reports
- Blocks support both authored (DA table) and AI-generated content

### Browser Extension Testing with Playwright

The Chrome extension (`/extension/`) can be tested with Playwright, but requires specific configuration:

#### Prerequisites
```bash
npm install  # playwright is a dev dependency
```

#### Key Configuration for Chrome Extensions

```javascript
import { chromium } from 'playwright';

const extensionPath = '/path/to/extension';
const userDataDir = '/path/to/test-profile';

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,  // Extensions REQUIRE headed mode
  channel: 'chrome', // Use installed Chrome, not Chromium
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
  ],
  // CRITICAL: Playwright disables extensions by default - must override
  ignoreDefaultArgs: ['--disable-extensions'],
});
```

#### Important Gotchas

1. **Extensions require headed mode** - `headless: false` is mandatory
2. **Use Chrome, not Chromium** - `channel: 'chrome'` required for full extension support
3. **Override default args** - Playwright adds `--disable-extensions` by default; use `ignoreDefaultArgs` to prevent this
4. **Service worker initialization** - MV3 extensions need 3-5 seconds to initialize:
   ```javascript
   await sleep(5000);
   const serviceWorkers = context.serviceWorkers();
   ```
5. **Side panels are inaccessible** - Chrome security prevents direct navigation to `chrome-extension://[id]/panel/panel.html`. Workaround: test the API flow directly instead of UI

#### Testing the Full Context Flow

Since the side panel UI can't be accessed directly, test the extension's API integration:

```javascript
// 1. Check extension loaded
const serviceWorkers = context.serviceWorkers();
const extensionSW = serviceWorkers.find(sw => sw.url().includes('chrome-extension://'));

// 2. Test context storage API directly from page
const page = await context.newPage();
await page.goto('https://www.vitamix.com/us/en_us');

const response = await page.evaluate(async (testContext) => {
  const resp = await fetch('https://vitamix-gensite-recommender.paolo-moz.workers.dev/store-context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testContext)
  });
  return resp.json();
}, { signals: [...], query: '...', profile: {...}, timestamp: Date.now() });

// 3. Test generation with stored context
const pocPage = await context.newPage();
await pocPage.goto(`https://main--vitamix-gensite--paolomoz.aem.live/?ctx=${response.id}&preset=all-cerebras`);

// 4. Verify generation completed
await sleep(20000);
const bodyClass = await pocPage.evaluate(() => document.body.className);
const success = bodyClass.includes('vitamix-recommender-mode');
```

#### Manual Extension Testing

For full UI testing, load the extension manually:
1. Navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `/extension/` folder
4. Browse vitamix.com to capture signals
5. Click extension icon to open side panel
6. Click "Generate Page" to test full flow

## Key Patterns

### SSE Streaming
```javascript
const eventSource = new EventSource(url);
eventSource.addEventListener('block-content', (e) => {
  const { html, sectionStyle, imageId } = JSON.parse(e.data);
  // Render block progressively
});
eventSource.addEventListener('image-ready', (e) => {
  const { imageId, url } = JSON.parse(e.data);
  // Replace placeholder image
});
```

### Session Context
```javascript
import { SessionContextManager } from './session-context.js';
const ctx = SessionContextManager.buildEncodedContextParam();
// Sends previous queries to worker for conversational flow
```

### Analytics Events
- `session_start` - New session
- `query` - User search
- `page_published` - Generated page saved
- `conversion` - CTA click to vitamix.com

## Design Context

### Users
Home cooks and kitchen enthusiasts researching high-performance blenders. They arrive via search queries seeking recipes, product comparisons, and support content. Context: often mid-purchase decision or exploring what's possible with a Vitamix. The job to be done: get confident answers quickly—whether finding the right product, discovering recipes, or solving a problem.

### Brand Personality
**Professional, Premium, Trusted.** Vitamix is the gold standard in blending—built to last, backed by decades of expertise. The voice is knowledgeable but never condescending, confident but warm. Every interaction should reinforce that this is a serious tool for people who care about quality.

### Emotional Goals
**Confidence & Trust.** Users should feel assured in their decisions. The interface removes doubt through clear information hierarchy, consistent patterns, and professional polish. No gimmicks, no overwhelming choices—just clarity that builds trust.

### Aesthetic Direction
**Reference**: The canonical Vitamix design system at `../vitamix/` (EDS production site)
**Visual Tone**: Clean, premium, editorial. Generous whitespace. Photography-forward. Typography that breathes.
**Anti-references**: Cluttered e-commerce sites, aggressive promotional aesthetics, generic Bootstrap looks

### Design System (Reference: ../vitamix/)

#### Colors
```css
/* Brand */
--color-red: #c8102e;           /* Primary accent */
--color-charcoal: #333f48;      /* Primary text, dark backgrounds */
--color-madder: #a01e2a;        /* Red dark variant */

/* Neutrals */
--color-gray-100: #fafafa;      /* Lightest */
--color-gray-200: #f3f1eb;      /* Off-white/cream */
--color-gray-300: #e9e9e9;      /* Borders */
--color-gray-900: #666;         /* Secondary text */

/* Accent */
--color-robin: #3dcbda;         /* Teal accent */
--color-asparagus: #799a3c;     /* Green accent */
```

#### Typography
- **Headings**: Sentinel (serif), weight 300, tight line-height (1.2)
- **Body**: Gotham Narrow (sans-serif), weight 400, relaxed line-height (1.3-1.6)
- **Scale**: 10px to 75px in 20 steps (base: 16px)

#### Spacing
```css
--spacing-60: 8px;    --spacing-200: 20px;   --spacing-600: 40px;
--spacing-100: 16px;  --spacing-400: 32px;   --spacing-800: 64px;
```

#### Border Radius
```css
--rounding-s: 2px;    /* Subtle, buttons */
--rounding-m: 5px;    /* Cards, inputs */
--rounding-l: 10px;   /* Larger cards */
--rounding-xl: 16px;  /* Hero elements */
```

### Design Principles

1. **Defer to the reference** — When in doubt, match `../vitamix/` exactly. It's the source of truth.

2. **Tokens over hardcodes** — Never use raw hex colors or pixel values. Every color is `var(--color-*)`, every space is `var(--spacing-*)`.

3. **Typography hierarchy matters** — Sentinel serif for headlines creates premium feel. Gotham Narrow for body ensures readability. Don't mix them arbitrarily.

4. **Restraint is premium** — Fewer colors, more whitespace, less decoration. Let photography and content breathe.

5. **Consistency builds trust** — Same button styles, same card patterns, same hover states. Predictability signals professionalism.

### Accessibility
Match reference site standards (WCAG AA baseline). Ensure:
- 4.5:1 contrast ratio for text
- Visible focus states on all interactive elements
- Keyboard navigability
- Semantic HTML structure
