# Icon Library Integration Plan

This document outlines the plan to integrate the Spectrum-style icon library (`scripts/icons.js`) into all applicable blocks.

## Overview

- **Total blocks to update**: 27
- **Icon library location**: `/scripts/icons.js`
- **Icon files location**: `/icons/*.svg`
- **Preview page**: `/test-blocks/icon-preview.html`

---

## Phase 1: High-Priority Refactors (Blocks with Inline SVGs)

These blocks already have hardcoded SVG icons that should be replaced with the library for consistency.

### 1.1 product-compare
**File**: `blocks/product-compare/product-compare.js`
**Current**: Inline SVG for check/close icons in comparison cells
**Changes**:
```javascript
import { createIcon } from '../../scripts/icons.js';

// Replace inline SVG with:
const checkIcon = await createIcon('check-circle', { size: 20, color: 'var(--color-green)' });
const closeIcon = await createIcon('close', { size: 20, color: 'var(--color-gray-500)' });
```

### 1.2 smart-features
**File**: `blocks/smart-features/smart-features.js`
**Current**: Inline SVG WiFi icon
**Changes**:
- Add `wifi.svg` to icon library if needed, or use existing icons
- Import and use `createIcon()` for feature indicators

### 1.3 engineering-specs
**File**: `blocks/engineering-specs/engineering-specs.js`
**Current**: Inline SVG wrench icon
**Changes**:
```javascript
import { createIcon } from '../../scripts/icons.js';

// Use product icons for spec categories
const icons = {
  motor: await createIcon('motor', { size: 24 }),
  power: await createIcon('power', { size: 24 }),
  capacity: await createIcon('capacity', { size: 24 }),
  noise: await createIcon('noise', { size: 24 }),
};
```

### 1.4 allergen-safety
**File**: `blocks/allergen-safety/allergen-safety.js`
**Current**: Inline SVGs for cleaning, container, materials sections
**Changes**:
- Replace with `gluten-free`, `vegan`, `organic`, `warning`, `check` icons
- Use `autoDecorateIcons()` for automatic detection

### 1.5 budget-breakdown
**File**: `blocks/budget-breakdown/budget-breakdown.js`
**Current**: Inline SVG info icon
**Changes**:
```javascript
import { createIcon } from '../../scripts/icons.js';
const infoIcon = await createIcon('info', { size: 18 });
```

### 1.6 support-triage
**File**: `blocks/support-triage/support-triage.js`
**Current**: Inline SVG help/document icon
**Changes**:
- Replace with `info`, `warning`, `check` icons based on triage outcome

### 1.7 benefits-grid
**File**: `blocks/benefits-grid/benefits-grid.js`
**Current**: Expects `:icon-*:` markdown syntax
**Changes**:
- Implement icon markdown parser that maps to library icons
- Example: `:icon-check:` → `createIcon('check')`

---

## Phase 2: Recipe Blocks

### 2.1 recipe-hero-detail
**File**: `blocks/recipe-hero-detail/recipe-hero-detail.js`
**Changes**:
```javascript
import { createIcon } from '../../scripts/icons.js';

// Add metadata icons
const metaIcons = {
  'prep-time': await createIcon('prep-time', { size: 18 }),
  'cook-time': await createIcon('timer', { size: 18 }),
  'servings': await createIcon('servings', { size: 18 }),
  'difficulty': await createIcon('difficulty', { size: 18 }),
};
```
**CSS**: Add `.recipe-meta-item { display: flex; align-items: center; gap: 6px; }`

### 2.2 recipe-sidebar
**File**: `blocks/recipe-sidebar/recipe-sidebar.js`
**Changes**:
- Use `autoDecorateIcons()` for nutrition labels
- Map: calories→`calories`, protein→`protein`, fiber→`fiber`, etc.

### 2.3 recipe-steps
**File**: `blocks/recipe-steps/recipe-steps.js`
**Changes**:
- Detect action keywords in step text
- Add icons: blend→`blend`, pulse→`pulse`, chop→`chop`, puree→`puree`
```javascript
import { findIconsByTag, decorateWithIcon } from '../../scripts/icons.js';

// Auto-detect cooking actions in step text
const actionKeywords = ['blend', 'pulse', 'chop', 'puree', 'mix', 'grind'];
```

### 2.4 recipe-directions
**File**: `blocks/recipe-directions/recipe-directions.js`
**Changes**: Same as recipe-steps - detect action keywords

### 2.5 recipe-cards
**File**: `blocks/recipe-cards/recipe-cards.js`
**Changes**:
- Add category badge icons (breakfast, lunch, dinner, etc.)
- Add metadata icons (timer, servings)
```javascript
const categoryIcons = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  dessert: 'dessert',
  smoothie: 'smoothie',
  soup: 'soup',
};
```

### 2.6 recipe-tips
**File**: `blocks/recipe-tips/recipe-tips.js`
**Changes**:
- Add `info` icon to tip headers
- Detect variation types and add relevant icons

### 2.7 recipe-tabs
**File**: `blocks/recipe-tabs/recipe-tabs.js`
**Changes**:
- Optional: Add icons to tab labels (ingredients, directions, nutrition)

### 2.8 recipe-filter-bar
**File**: `blocks/recipe-filter-bar/recipe-filter-bar.js`
**Changes**:
- Add category icons to filter buttons
- Map filter values to recipe category icons

---

## Phase 3: Product Blocks

### 3.1 product-cards
**File**: `blocks/product-cards/product-cards.js`
**Changes**:
```javascript
import { createIcon } from '../../scripts/icons.js';

// Star rating icons
const starIcon = await createIcon('star', { size: 16 });
const starFilledIcon = await createIcon('star', { size: 16, className: 'star-filled' });

// Wishlist heart
const heartIcon = await createIcon('heart', { size: 20 });

// View details arrow
const arrowIcon = await createIcon('arrow-right', { size: 16 });
```

### 3.2 product-info
**File**: `blocks/product-info/product-info.js`
**Changes**:
- Add icons to feature list items
- Map features to: speed, power, capacity, warranty, self-cleaning

### 3.3 feature-highlights
**File**: `blocks/feature-highlights/feature-highlights.js`
**Changes**:
- Add icons to highlight cards
- Use product category icons

### 3.4 included-accessories
**File**: `blocks/included-accessories/included-accessories.js`
**Changes**:
- Add icons to accessory items
- Use: blender, capacity icons

### 3.5 best-pick
**File**: `blocks/best-pick/best-pick.js`
**Changes**:
- Add `star` or `check-circle` badge icon

---

## Phase 4: Nutrition Blocks

### 4.1 nutrition-facts
**File**: `blocks/nutrition-facts/nutrition-facts.js`
**Changes**:
```javascript
import { autoDecorateIcons } from '../../scripts/icons.js';

// Custom mapping for nutrition labels
const nutritionMapping = {
  calories: 'calories',
  protein: 'protein',
  fiber: 'fiber',
  'vitamin': 'vitamins',
  fat: 'nutrition',
};

await autoDecorateIcons(block, nutritionMapping);
```

### 4.2 sustainability-info
**File**: `blocks/sustainability-info/sustainability-info.js`
**Changes**:
- Add `organic` icon for eco-friendly features
- Add `check` icons for certification badges

---

## Phase 5: UI/Interaction Blocks

### 5.1 comparison-table
**File**: `blocks/comparison-table/comparison-table.js`
**Changes**:
- Replace text ✓/✗ with `check`/`close` icons
- Add `info` icon for tooltips

### 5.2 faq
**File**: `blocks/faq/faq.js`
**Changes**:
- Add `plus`/`minus` icons for expand/collapse
- Or `arrow-right` that rotates on expand

### 5.3 accordion
**File**: `blocks/accordion/accordion.js`
**Changes**:
- Add `plus`/`minus` toggle icons
```javascript
const expandIcon = await createIcon('plus', { size: 20 });
const collapseIcon = await createIcon('minus', { size: 20 });
```

### 5.4 accessibility-specs
**File**: `blocks/accessibility-specs/accessibility-specs.js`
**Changes**:
- Add `check-circle` icons for accessibility features
- Add `info` icons for tooltips

### 5.5 quick-view-modal
**File**: `blocks/quick-view-modal/quick-view-modal.js`
**Changes**:
- Add `close` icon for modal dismiss button
- Add `arrow-left`/`arrow-right` for navigation

---

## Phase 6: Add Missing Icons

During integration, add any missing icons needed:

| Icon Name | Category | Use Case |
|-----------|----------|----------|
| `wifi` | product | Smart features connectivity |
| `wrench` | product | Engineering/specs |
| `leaf` | nutrition | Sustainability |
| `chevron-down` | ui | Dropdowns |
| `chevron-up` | ui | Dropdowns |
| `filter` | ui | Filter bars |
| `sort` | ui | Sort controls |
| `refresh` | ui | Reset/reload |
| `share` | ui | Social sharing |
| `print` | ui | Print recipe |
| `download` | ui | Save/export |

---

## Implementation Pattern

For each block, follow this pattern:

```javascript
// 1. Import at top of file
import { createIcon, decorateWithIcon, autoDecorateIcons } from '../../scripts/icons.js';

// 2. In decorate function, create icons
export default async function decorate(block) {
  // ... existing code ...

  // Option A: Create specific icons
  const icon = await createIcon('timer', { size: 20 });
  element.prepend(icon);

  // Option B: Auto-decorate based on text
  await autoDecorateIcons(block);

  // Option C: Decorate specific elements
  const label = block.querySelector('.label');
  await decorateWithIcon(label, 'check', { size: 16 });
}
```

---

## CSS Additions

Add to each block's CSS file:

```css
/* Icon alignment */
.icon {
  flex-shrink: 0;
}

/* Icon + text alignment */
.has-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Icon color variants */
.icon-success { color: var(--color-green, #2d9d78); }
.icon-warning { color: var(--color-orange, #e68619); }
.icon-error { color: var(--color-red, #c8102e); }
.icon-muted { color: var(--color-gray-500, #6d6d6d); }
```

---

## Testing Checklist

For each block integration:

- [ ] Icons render correctly at intended size
- [ ] Icons inherit correct color (currentColor works)
- [ ] Icons align properly with adjacent text
- [ ] Icons scale on responsive breakpoints
- [ ] Icons work on both light and dark backgrounds
- [ ] Accessibility: icons have proper aria-labels or are decorative (aria-hidden)
- [ ] No console errors for missing icons
- [ ] Performance: icons load efficiently (check network tab)

---

## Rollout Order

Recommended order for minimal risk:

1. **Week 1**: Phase 1 (refactor inline SVGs) - 7 blocks
2. **Week 2**: Phase 2 (recipe blocks) - 8 blocks
3. **Week 3**: Phase 3 (product blocks) - 5 blocks
4. **Week 4**: Phase 4-5 (nutrition + UI blocks) - 7 blocks
5. **Week 5**: Phase 6 (add missing icons) + final testing

---

## Success Metrics

- [ ] All 27 blocks updated
- [ ] Zero inline SVG icons remaining (except brand logos)
- [ ] Consistent icon sizing across blocks
- [ ] Icon library used for all new block development
- [ ] Documentation updated in CLAUDE.md
