# Vitamix Brand Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align AI-generated pages with the official Vitamix brand guidelines (corebook.io) across color palette, typography patterns, and component styling.

**Architecture:** Three phases of increasing scope. Phase 1 is CSS-only token/style fixes. Phase 2 adds CSS + minor JS for comparison table and vortex divider. Phase 3 modifies the Cloudflare worker prompt templates and section-style mapping in `orchestrator.ts` to improve generated content at the source.

**Tech Stack:** CSS custom properties, vanilla JS (EDS block decorators), Cloudflare Workers (TypeScript)

**Reference:** Visual before/after comparison at `demo/brand-audit.html`

---

## File Map

### Phase 1 — CSS-Only (Issues #9, #3, #4, #8)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `styles/styles.css:13-48` | Add secondary palette tokens to `:root` |
| Modify | `styles/styles.css:399-408` | Verify eyebrow styles (already correct — audit confirmed) |
| Modify | `blocks/noise-context/noise-context.css:96-118` | Swap scale-segment colors to brand palette |
| Modify | `blocks/noise-context/noise-context.css:158-204` | Swap comparison row border + dB colors |
| Verify | `blocks/follow-up/follow-up.css` | Audit confirms already on navy bg — no changes needed |

### Phase 2 — CSS + Block JS (Issues #7, #10)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `blocks/comparison-table/comparison-table.css:174-217` | Warm bg for recommended column, pistachio recommendation banner |
| Modify | `styles/styles.css:759-814` | Add `.section.warm` style for warm neutral backgrounds |
| Create | `blocks/section-divider/section-divider.css` | Vortex divider component styles |
| Create | `blocks/section-divider/section-divider.js` | Vortex SVG injection + divider decoration |

### Phase 3 — Worker + CSS (Issues #1, #2, #5, #6)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts:1631-1638` | Expand `getSectionStyle()` with `warm` mapping |
| Modify | `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts:587-593` | Replace CTA text guidelines with model-specific copy |
| Modify | `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts:509-527` | Add icon references to use-case-cards template |
| Modify | `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts:613-643` | Add icon references to feature-highlights template |
| Modify | `scripts/scripts.js:256-274` | Handle new `warm` sectionStyle in SSE listener |

---

## Phase 1: CSS-Only Fixes

### Task 1: Add Secondary Brand Palette Tokens (#9)

**Files:**
- Modify: `styles/styles.css:13-48` (`:root` color block)

These tokens come from the official Vitamix brand guidelines at corebook.io. They enable all subsequent brand-aligned styling.

- [ ] **Step 1: Add secondary palette tokens after the existing Brand Colors block**

In `styles/styles.css`, after line 48 (`--color-star-gold: #ffd700;`), add:

```css
  /* Brand Secondary Palette (from corebook.io guidelines) */
  --color-neutral-cool: #dce0e7;
  --color-neutral-warm: #f6ece4;
  --color-mustard: #ddb247;
  --color-ginger: #cd7e59;
  --color-blueberry: #a2b2bd;
  --color-pistachio: #7b997c;

  /* Web Palette (from corebook.io guidelines) */
  --color-web-neutral: #f5f5f5;
  --color-web-offer: #5e7d61;
  --color-web-links: #1b68b4;
```

- [ ] **Step 2: Verify tokens render correctly**

Open http://localhost:3000 and inspect `:root` in DevTools. Confirm all new custom properties appear with correct hex values.

- [ ] **Step 3: Commit**

```bash
git add styles/styles.css
git commit -m "feat: add Vitamix secondary brand palette tokens from corebook.io guidelines"
```

---

### Task 2: Verify Eyebrow Text Styling (#3)

**Files:**
- Verify: `styles/styles.css:399-408`

The eyebrow styles were audited and are already correct per brand guidelines: `font-family: var(--sans-serif-font-family)` (Gotham Narrow), `font-size: 11px`, `font-weight: var(--weight-medium)` (500), `letter-spacing: 0.14em`, `text-transform: uppercase`, `color: var(--color-red)`.

- [ ] **Step 1: Visually confirm eyebrow rendering**

Open http://localhost:3000/?q=Looking%20to%20buy%20a%20Vitamix%20blender&preset=all-cerebras and check that eyebrow text (e.g., "OUR TOP PICK") renders as: uppercase, red, Gotham Narrow, wide letter-spacing. If it does, no code change is needed — mark this issue as resolved.

- [ ] **Step 2: If any block overrides eyebrow styles incorrectly, fix the override**

Search for conflicting `.eyebrow` styles:
```bash
grep -rn "\.eyebrow" blocks/ --include="*.css" | grep -v "node_modules"
```

If any block CSS overrides the global `.eyebrow` with serif font, lowercase, or gray color, remove the override so the global style applies.

---

### Task 3: Swap Noise Scale to Brand Colors (#4)

**Files:**
- Modify: `blocks/noise-context/noise-context.css:96-118` (scale segments)
- Modify: `blocks/noise-context/noise-context.css:158-204` (comparison rows)

Replace generic success/warning/error semantic colors with brand secondary palette: Pistachio for quiet, Mustard for moderate, Ginger for loud, Vitamix Red for very loud.

- [ ] **Step 1: Replace scale-segment background colors**

In `blocks/noise-context/noise-context.css`, replace lines 96-118:

```css
/* Quiet - Pistachio (brand secondary) */
.scale-segment.quiet {
  background: var(--color-pistachio);
  color: var(--color-white);
}

/* Moderate - Mustard (brand secondary) */
.scale-segment.moderate {
  background: var(--color-mustard);
  color: var(--color-charcoal);
}

/* Loud - Ginger (brand secondary) */
.scale-segment.loud {
  background: var(--color-ginger);
  color: var(--color-white);
}

/* Very Loud - Vitamix Red (brand primary) */
.scale-segment.very-loud {
  background: var(--color-red);
  color: var(--color-white);
}
```

- [ ] **Step 2: Replace comparison row border-left colors**

In the same file, replace lines 158-172:

```css
/* Level-specific border colors */
.noise-comparison.quiet {
  border-left-color: var(--color-pistachio);
}

.noise-comparison.moderate {
  border-left-color: var(--color-mustard);
}

.noise-comparison.loud {
  border-left-color: var(--color-ginger);
}

.noise-comparison.very-loud {
  border-left-color: var(--color-red);
}
```

- [ ] **Step 3: Replace color-coded dB text colors**

In the same file, replace lines 190-204:

```css
/* Color-coded dB display */
.noise-comparison.quiet .comparison-db {
  color: var(--color-pistachio);
}

.noise-comparison.moderate .comparison-db {
  color: var(--color-mustard);
}

.noise-comparison.loud .comparison-db {
  color: var(--color-ginger);
}

.noise-comparison.very-loud .comparison-db {
  color: var(--color-red);
}
```

- [ ] **Step 4: Verify visually**

Open http://localhost:3000/?q=I%20need%20something%20quiet%20for%20morning%20smoothies&preset=all-cerebras and confirm the noise scale bar and comparison rows use Pistachio/Mustard/Ginger/Red instead of generic green/yellow/orange/red.

- [ ] **Step 5: Commit**

```bash
git add blocks/noise-context/noise-context.css
git commit -m "feat: swap noise-context colors to brand secondary palette (pistachio/mustard/ginger/red)"
```

---

### Task 4: Verify Follow-up Block Styling (#8)

**Files:**
- Verify: `blocks/follow-up/follow-up.css`

The follow-up block already uses navy (`--color-charcoal`) background with outlined chips and red hover accent. The audit comparison page (issue #8) shows the "before" as red-bordered cards on white — but that's actually the `next-questions` section rendered differently in some generation modes, not the follow-up block itself.

- [ ] **Step 1: Visually confirm follow-up rendering**

Open a generated page and scroll to the bottom. Confirm the "What would help you next?" section shows: navy background, outlined chip buttons, red border on hover. If it matches the "after" panel in `demo/brand-audit.html`, mark as resolved.

- [ ] **Step 2: If the bottom section renders as red-bordered cards on white, identify which block is responsible**

Check if it's `follow-up` or `next-questions` block:
```bash
grep -rn "next-questions\|follow-up" scripts/scripts.js --include="*.js"
```

If a different block is rendering the off-brand version, note it for a separate fix.

---

## Phase 2: CSS + Block JS

### Task 5: Comparison Table Brand Styling (#7)

**Files:**
- Modify: `blocks/comparison-table/comparison-table.css:174-217`

The JS logic in `comparison-table.js` already detects the recommended product and adds `.recommended-column` class + `.recommended-ribbon` badge. We only need to update the CSS to use brand warm neutral instead of plain gray, and style the recommendation banner with Pistachio.

- [ ] **Step 1: Update recommended column background to warm neutral**

In `blocks/comparison-table/comparison-table.css`, replace lines 174-183:

```css
/* ===== Recommended Column Highlight ===== */
.comparison-table-grid th.recommended-column,
.comparison-table-grid td.recommended-column {
  background: var(--color-neutral-warm);
  position: relative;
}

.comparison-table-grid th.recommended-column {
  background: var(--color-neutral-warm);
}
```

- [ ] **Step 2: Verify the ribbon badge**

The existing ribbon at lines 206-217 already uses `--color-red` background — this is correct per brand guidelines. No change needed.

- [ ] **Step 3: Update recommendation banner (tfoot) to use Pistachio**

In the same file, find the `.comparison-table-recommendation-cell` styles (around line 224) and ensure the recommendation banner uses brand pistachio:

```css
.comparison-table-recommendation-cell {
  background: var(--color-pistachio);
  color: var(--color-white);
  padding: var(--spacing-200) var(--spacing-300);
  border-radius: var(--rounding-s);
  font-family: var(--body-font-family);
  font-size: var(--body-size-s);
  font-weight: var(--weight-medium);
  text-align: center;
}
```

- [ ] **Step 4: Verify visually**

Open http://localhost:3000/?q=compare%20X5%20vs%20X4&preset=all-cerebras and confirm the comparison table shows: warm neutral highlight on the recommended column, red "BEST PICK" ribbon badge, and pistachio "Best for..." banner at the bottom.

- [ ] **Step 5: Commit**

```bash
git add blocks/comparison-table/comparison-table.css
git commit -m "feat: comparison table uses warm neutral highlight and pistachio recommendation banner"
```

---

### Task 6: Add Warm Section Style (#10 prep + #1 prep)

**Files:**
- Modify: `styles/styles.css` (after line 814, after the `.section.accent` block)

Add a new `.section.warm` style using the brand warm neutral. This is needed by Phase 3 (issue #1) when the worker starts assigning `warm` as a sectionStyle, and can also be used by the vortex divider section.

- [ ] **Step 1: Add warm section style**

In `styles/styles.css`, after the `.section.accent` block (around line 814), add:

```css
/* Warm section - alternating background for visual rhythm (Brand Secondary: Neutral Warm) */
main .section.warm {
  background-color: var(--color-neutral-warm);
  margin: 0;
  padding: 40px 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add styles/styles.css
git commit -m "feat: add .section.warm style using brand neutral-warm background"
```

---

### Task 7: Vortex Section Divider (#10)

**Files:**
- Create: `blocks/section-divider/section-divider.css`
- Create: `blocks/section-divider/section-divider.js`

A subtle brand-reinforcing divider using the Vitamix vortex shape. Used between major content sections. The vortex is a simplified SVG leaf/flame shape — not the full logo (per brand guidelines, the vortex is a supplemental graphic, not a logo replacement).

- [ ] **Step 1: Create the section-divider CSS**

Create `blocks/section-divider/section-divider.css`:

```css
/**
 * Section Divider Block - Vortex Brand Element
 *
 * Subtle divider using the Vitamix vortex shape between sections.
 * Per brand guidelines: vortex is supplemental, not a logo replacement.
 * Grey preferred on white/light backgrounds.
 */

.section-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-300);
  padding: var(--spacing-200) var(--spacing-400);
  max-width: var(--max-width-content);
  margin: 0 auto;
}

.section-divider .divider-line {
  flex: 1;
  height: 1px;
  background: var(--color-gray-300);
}

.section-divider .vortex-mark {
  width: 28px;
  height: 28px;
  opacity: 0.2;
  flex-shrink: 0;
}

.section-divider .vortex-mark svg {
  width: 100%;
  height: 100%;
  fill: var(--color-charcoal);
}

/* Dark section variant */
.section.dark .section-divider .divider-line {
  background: rgba(255, 255, 255, 0.15);
}

.section.dark .section-divider .vortex-mark svg {
  fill: var(--color-white);
}
```

- [ ] **Step 2: Create the section-divider JS**

Create `blocks/section-divider/section-divider.js`:

```js
/**
 * Section Divider Block
 * Renders a horizontal line with the Vitamix vortex mark centered.
 */
export default function decorate(block) {
  const vortexSVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5C50 5 85 25 85 50C85 75 50 95 50 95C50 95 15 75 15 50C15 25 50 5 50 5Z"/>
    <path d="M50 15C50 15 75 30 75 50C75 70 50 85 50 85C50 85 25 70 25 50C25 30 50 15 50 15Z" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>
  </svg>`;

  block.innerHTML = `
    <div class="divider-line"></div>
    <div class="vortex-mark">${vortexSVG}</div>
    <div class="divider-line"></div>
  `;
}
```

- [ ] **Step 3: Verify the block loads**

Add a test section to a page or use the block in a test query. Confirm the vortex divider renders as a centered leaf shape with faint lines on either side.

- [ ] **Step 4: Commit**

```bash
git add blocks/section-divider/section-divider.css blocks/section-divider/section-divider.js
git commit -m "feat: add section-divider block with vortex brand element"
```

---

## Phase 3: Worker + Frontend Changes

### Task 8: Expand Section Style Mapping (#1)

**Files:**
- Modify: `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts:1631-1638`
- Modify: `scripts/scripts.js:256-274`

Add `warm` as a new section style for recipe-related and product-cards blocks to create visual rhythm with alternating backgrounds.

- [ ] **Step 1: Update `getSectionStyle()` in the worker**

In `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts`, replace lines 1631-1638:

```typescript
function getSectionStyle(blockType: string): string {
  const darkBlocks = ['hero', 'product-hero', 'product-recommendation', 'best-pick'];
  const highlightBlocks = ['reasoning', 'reasoning-user', 'testimonials'];
  const warmBlocks = ['recipe-cards', 'noise-context', 'faq'];

  if (darkBlocks.includes(blockType)) return 'dark';
  if (highlightBlocks.includes(blockType)) return 'highlight';
  if (warmBlocks.includes(blockType)) return 'warm';
  return 'default';
}
```

Note: `recipe-cards` moved from `highlightBlocks` to `warmBlocks`. This gives recipe sections the warm neutral background instead of the generic off-white highlight.

- [ ] **Step 2: Handle `warm` in the frontend SSE listener**

In `scripts/scripts.js`, the existing code at line ~268 already handles any non-default sectionStyle:

```js
if (data.sectionStyle && data.sectionStyle !== 'default') {
  section.classList.add(data.sectionStyle);
}
```

This will automatically add `.warm` to the section, which the CSS from Task 6 already styles. No frontend code change needed — just verify this logic exists.

- [ ] **Step 3: Deploy worker and test**

```bash
cd workers/vitamix-gensite-recommender && npx wrangler deploy
```

Open a generated page and confirm recipe sections show the warm neutral background, while product/hero sections remain dark charcoal.

- [ ] **Step 4: Commit**

```bash
git add workers/vitamix-gensite-recommender/src/lib/orchestrator.ts
git commit -m "feat: add warm section style for recipe-cards, noise-context, faq blocks"
```

---

### Task 9: Add Icon References to Feature Templates (#2)

**Files:**
- Modify: `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts:509-527` (use-case-cards template)
- Modify: `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts:613-643` (feature-highlights template)

Replace emoji icons with SVG icon references from the project's `/icons/` directory. The cards.grid block already supports `<img>` elements — the worker just needs to reference them.

- [ ] **Step 1: Update use-case-cards template**

In `orchestrator.ts`, replace lines 509-527:

```typescript
    'use-case-cards': `
## HTML Template (REQUIRED: header + 3-4 cards):

YOU MUST OUTPUT THIS HEADER FIRST - IT IS REQUIRED:
<div class="ucheader">
  <h2 class="uctitle">[WRITE A TITLE TAILORED TO THE USER'S QUESTION]</h2>
  <p class="ucsubtitle">[Brief subtitle about what these use cases help accomplish]</p>
</div>

THEN output 3-4 use case cards:
<div class="use-case-card">
  <div class="use-case-icon"><img src="/icons/ICON_NAME.svg" alt="Icon description" loading="lazy"></div>
  <div class="use-case-content">
    <h4 class="use-case-title">Use Case Name</h4>
    <p class="use-case-description">Brief description of this use case.</p>
  </div>
</div>

AVAILABLE ICONS (pick the most relevant for each card):
- smoothie.svg, soup.svg, frozen.svg, dessert.svg, drinks.svg (food types)
- blend.svg, pulse.svg, chop.svg, puree.svg, mix.svg, grind.svg (actions)
- breakfast.svg, lunch.svg, dinner.svg (meal times)
- fruit.svg, vegetable.svg, protein.svg, dairy.svg, nuts.svg (ingredients)
- timer.svg, self-cleaning.svg, noise.svg, speed.svg, power.svg (features)

CRITICAL: The header element MUST be the first thing in your output. Do not skip it.`,
```

- [ ] **Step 2: Update feature-highlights template**

In the same file, replace lines 613-643:

```typescript
    'feature-highlights': `
## HTML Template (REQUIRED: header + 3-4 feature rows):

YOU MUST OUTPUT THIS HEADER FIRST - IT IS REQUIRED:
<div class="fhheader">
  <h2 class="fhtitle">[WRITE A TITLE TAILORED TO THE USER'S QUESTION]</h2>
  <p class="fhsubtitle">[Brief subtitle about what these features help accomplish]</p>
</div>

THEN output 3-4 feature rows like this:
<div>
  <div>
    <picture><img src="/icons/ICON_NAME.svg" alt="Feature icon" loading="lazy"></picture>
  </div>
  <div>
    <h3>Feature Name</h3>
    <p>Description of this feature and its benefits.</p>
  </div>
</div>

AVAILABLE ICONS (pick the most relevant for each feature):
- motor.svg, noise.svg, self-cleaning.svg, speed.svg, power.svg (product features)
- capacity.svg, warranty.svg, blender.svg, timer.svg (specs)
- smoothie.svg, soup.svg, frozen.svg (use cases)

SPECIAL GUIDANCE FOR FAMILY/KIDS QUERIES:
If the user mentions kids, family, picky eaters, or hiding vegetables, ALWAYS include these features:
1. Hot Soup Program (icon: soup.svg) - Highlight how it creates silky-smooth soups that hide vegetables completely. Kids can't detect spinach, kale, or other greens when blended to perfection.
2. Self-Cleaning (icon: self-cleaning.svg) - Emphasize the 60-second cleanup for busy parents.
3. Variable Speed Control (icon: speed.svg) - Explain how it lets you get the exact texture kids prefer - no chunks!
4. Smoothie Capabilities (icon: smoothie.svg) - For kids who love fruity drinks, mention how you can sneak spinach into berry smoothies.

CRITICAL: The header element MUST be the first thing in your output. Do not skip it.`,
```

- [ ] **Step 3: Deploy worker and test**

```bash
cd workers/vitamix-gensite-recommender && npx wrangler deploy
```

Open http://localhost:3000/?q=quiet+blender+for+smoothies&preset=all-cerebras and confirm feature sections now show SVG icons instead of emoji or no icons.

- [ ] **Step 4: Commit**

```bash
git add workers/vitamix-gensite-recommender/src/lib/orchestrator.ts
git commit -m "feat: use SVG icon references in use-case and feature-highlights templates"
```

---

### Task 10: Improve Product Card CTA Text (#6)

**Files:**
- Modify: `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts:587-593`

Replace the repetitive CTA guidelines with model-specific copy that matches the Vitamix voice (witty, discerning, considered).

- [ ] **Step 1: Update CTA text guidelines**

In `orchestrator.ts`, replace lines 587-593:

```typescript
CTA TEXT GUIDELINES - vary the text per product, never repeat the same CTA:
- Primary recommendation: "Explore the [Product Name]"
- Runner-up: "Discover the [Product Name]"
- Budget option: "See the [Product Name]"
- If product excels at user's specific need: "Built for [User's Need]" (e.g., "Built for Quiet Mornings")
- NEVER repeat the same CTA text across multiple cards
- NEVER use generic CTAs like "View Details", "Learn More", "Shop Now", or "Perfect for Your Smoothies"
```

- [ ] **Step 2: Deploy worker and test**

```bash
cd workers/vitamix-gensite-recommender && npx wrangler deploy
```

Generate a page with multiple product cards. Confirm each card has a unique CTA referencing the product name (e.g., "Explore the Ascent X5", "Discover the Propel 750") rather than identical "PERFECT FOR YOUR SMOOTHIES" on every card.

- [ ] **Step 3: Commit**

```bash
git add workers/vitamix-gensite-recommender/src/lib/orchestrator.ts
git commit -m "feat: product card CTAs use model-specific copy per Vitamix voice guidelines"
```

---

### Task 11: Category Card Overlay Colors (#5)

**Files:**
- Modify: `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts` (overlay card template, if exists)
- Modify: `blocks/cards/cards.css:544-619` (overlay variant)

Category overlay cards currently use arbitrary dark teal/green inline styles or fallback colors. Constrain them to the brand secondary palette.

- [ ] **Step 1: Search for overlay card color assignment in worker**

```bash
grep -n "overlay\|background.*color\|style=" workers/vitamix-gensite-recommender/src/lib/orchestrator.ts | head -30
```

Identify where overlay card background colors are set. If the LLM generates inline `style="background: ..."`, add a constraint to the prompt template limiting to brand colors. If colors are purely CSS, adjust the overlay card CSS.

- [ ] **Step 2: Update overlay card CSS fallback colors**

In `blocks/cards/cards.css`, update the overlay variant's `::after` overlay to use brand-aligned defaults. Replace line 589-595:

```css
.cards.overlay > ul > li::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgba(51, 63, 72, 0.6);
  transition: background 0.3s;
}
```

This uses Vitamix Navy (rgb 51, 63, 72) as the overlay instead of generic black.

- [ ] **Step 3: If worker uses inline colors, add brand constraint to prompt**

Add to the relevant template:

```
For overlay/category cards, use ONLY these background colors:
- Navy: #333f48
- Pistachio: #7b997c
- Ginger: #cd7e59
Do NOT use arbitrary dark colors.
```

- [ ] **Step 4: Deploy and test**

Generate a page that includes category cards (e.g., frozen margaritas query). Confirm overlays use Navy/Pistachio/Ginger instead of arbitrary dark teal.

- [ ] **Step 5: Commit**

```bash
git add blocks/cards/cards.css workers/vitamix-gensite-recommender/src/lib/orchestrator.ts
git commit -m "feat: constrain category card overlay colors to brand secondary palette"
```

---

### Task 12: Final Visual QA + Audit Page Update

**Files:**
- Modify: `demo/brand-audit.html`

- [ ] **Step 1: Run all three test queries and screenshot results**

1. http://localhost:3000/?q=I%20need%20something%20quiet%20for%20morning%20smoothies&preset=all-cerebras
2. http://localhost:3000/?q=frozen%20margaritas%20for%2030%20people&preset=all-cerebras
3. http://localhost:3000/?q=compare%20X5%20vs%20X4&preset=all-cerebras

Verify each issue from the audit page is resolved.

- [ ] **Step 2: Update brand-audit.html with completion status**

Add a "Status: Implemented" badge to each issue section header.

- [ ] **Step 3: Final commit**

```bash
git add demo/brand-audit.html
git commit -m "feat: update brand audit page with implementation status"
```
