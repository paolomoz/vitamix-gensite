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
- `/test-blocks/` - Visual test pages
- `/test-results/` - Test result reports
- Blocks support both authored (DA table) and AI-generated content

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

---

## Extension Design Context

The `/extension/` directory contains a Chrome extension for intent inference demos. This UI uses **Adobe Spectrum** design system, distinct from the Vitamix brand used elsewhere.

### Users
Internal team and developers testing intent inference on vitamix.com. Context: debugging, demoing, and validating AI-generated content recommendations. Job to be done: quickly understand what signals are being captured and how the system interprets user intent.

### Brand Personality
**Technical, Precise, Professional.** This is a developer tool, not consumer-facing. The voice is informative and utilitarian. Every element should serve a clear purpose—no decoration for its own sake.

### Aesthetic Direction
**Reference**: Adobe Spectrum Design System (spectrum.adobe.com)
**Visual Tone**: Dark theme, dense information display, clear hierarchy
**Anti-references**: Consumer-facing chrome, playful interfaces, high-contrast gaming aesthetics

### Design System (Adobe Spectrum Dark Theme)

#### Colors
```css
/* Backgrounds (Dark Theme) */
--spectrum-gray-25: rgb(17, 17, 17);       /* Deepest background */
--spectrum-gray-50: rgb(27, 27, 27);       /* Background */
--spectrum-gray-75: rgb(34, 34, 34);       /* Surface */
--spectrum-gray-100: rgb(44, 44, 44);      /* Surface hover */
--spectrum-gray-200: rgb(50, 50, 50);      /* Surface selected */
--spectrum-gray-300: rgb(57, 57, 57);      /* Border */
--spectrum-gray-400: rgb(68, 68, 68);      /* Border light */
--spectrum-gray-500: rgb(109, 109, 109);   /* Muted text */
--spectrum-gray-700: rgb(175, 175, 175);   /* Secondary text */
--spectrum-gray-900: rgb(227, 227, 227);   /* Primary text */
--spectrum-gray-1000: rgb(255, 255, 255);  /* High contrast text */

/* Accent */
--spectrum-blue-900: rgb(86, 129, 255);    /* Primary accent */
--spectrum-blue-1000: rgb(105, 149, 254);  /* Accent hover */

/* Semantic */
--spectrum-green-900: rgb(45, 157, 120);   /* Success */
--spectrum-orange-900: rgb(230, 134, 25);  /* Warning */
--spectrum-red-900: rgb(215, 50, 32);      /* Error */
```

#### Typography
```css
font-family: adobe-clean, "Adobe Clean", "Source Sans Pro",
             -apple-system, BlinkMacSystemFont, "Segoe UI",
             Roboto, Ubuntu, sans-serif;
font-family-mono: "Source Code Pro", Monaco, monospace;
```
- Base size: 13px
- Line height: 1.5 for body, 1.2 for headings
- Weight: 400 normal, 500 medium, 600 semibold

#### Spacing
```css
--spectrum-spacing-50: 2px;
--spectrum-spacing-75: 4px;
--spectrum-spacing-100: 8px;
--spectrum-spacing-200: 12px;
--spectrum-spacing-300: 16px;
--spectrum-spacing-400: 24px;
--spectrum-spacing-500: 32px;
--spectrum-spacing-600: 40px;
```

#### Border Radius
```css
--spectrum-corner-radius-75: 4px;   /* Small elements, tags */
--spectrum-corner-radius-100: 8px;  /* Cards, buttons */
--spectrum-corner-radius-200: 10px; /* Large containers */
```

#### Animation
```css
--spectrum-animation-duration-100: 130ms;
--spectrum-animation-duration-200: 160ms;
--spectrum-animation-ease-in-out: cubic-bezier(0.45, 0, 0.4, 1);
```

### Design Principles (Extension)

1. **Spectrum tokens over hardcodes** — Use `var(--spectrum-*)` tokens exclusively. No raw hex colors or pixel values.

2. **Information density is acceptable** — Unlike consumer UI, developer tools can be denser. Prioritize utility over whitespace.

3. **Dark theme consistency** — All panel and overlay components use Spectrum dark theme. Light theme reserved for injected hints on vitamix.com.

4. **Functional animation** — Animations should be fast (130-160ms) and purposeful. No decorative motion.

5. **Clear visual hierarchy** — Use typography weight and color (not size alone) to establish hierarchy in dense layouts.

### Dual-Design Boundary

| Component | Design System | Theme |
|-----------|---------------|-------|
| `panel/panel.css` | Adobe Spectrum | Dark |
| `overlay-panel.css` | Adobe Spectrum | Dark |
| `hint-styles.css` | Vitamix | Light (matches vitamix.com) |

The hint section uses Vitamix branding because it's injected directly into vitamix.com pages and should blend with the site's aesthetic.
