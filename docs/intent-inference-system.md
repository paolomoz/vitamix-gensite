# Intent Inference System

This document describes the browser extension's intent inference system, which captures user behavior signals on vitamix.com, builds user profiles, and generates synthetic queries for personalized content.

---

## 1. Signal Acquisition

### Overview

The content script (`content-script.js`) captures user behavior signals on vitamix.com pages. Signals are captured generically and then classified based on context (URL, title, content patterns).

### Signal Types

| Signal Type | Trigger | Weight | Description |
|-------------|---------|--------|-------------|
| `page_view` | Page load | Context-dependent | Captured on every page navigation |
| `click` | User click | Context-dependent | Captured on interactive elements |
| `search` | Search form | Very High (0.20) | Search query submissions |
| `scroll` | Scroll thresholds | Low (0.05) | 25%, 50%, 75%, 100% depth |
| `referrer` | Page load | Medium (0.10) | External referrer analysis |
| `time_on_page` | Time milestones | Medium (0.10) | 30s, 60s, 2m, 5m thresholds |
| `video_play` | Video starts | High (0.15) | Video engagement begins |
| `video_complete` | Video ends | Very High (0.20) | Full video watched |

### Signal Categories (Classification)

Signals are classified into categories based on context patterns:

#### Page View Categories

| Category | URL Pattern | Weight |
|----------|-------------|--------|
| `product` | `/shop/(blenders\|accessories\|containers)/[product]` | Medium |
| `product` | `/shop/[product]` (direct) | Medium |
| `recipe` | `/recipes/` | High |
| `compare` | `/compare` | Very High |
| `category` | `/shop/(blenders\|accessories\|containers)` | Low |
| `article` | `/articles/`, `/blog/`, `/learn/` | High |
| `support` | `/support/`, `/help/`, `/faq/` | High |
| `shipping` | `/shipping/`, `/delivery/` | High |
| `returns` | `/returns/`, `/return-policy/` | High |
| `financing` | `/financing/`, `/affirm/` | Medium |
| `warranty` | `/warranty/`, `/guarantee/` | High |
| `reconditioned` | `/certified-reconditioned/` | High |

#### Click Categories

| Category | Pattern Match | Weight |
|----------|---------------|--------|
| `add_to_cart` | "add to cart", "buy now", "purchase" | Very High |
| `compare` | "compare" | Very High |
| `reviews` | "review", "rating", "star" | High |
| `specs` | "spec", "feature", "detail" | Medium |
| `whats_in_box` | "what's in box", "included" | Medium |
| `warranty` | "warranty", "guarantee" | High |
| `shipping` | "shipping", "delivery" | High |
| `financing` | "financing", "payment", "affirm" | Medium |
| `recipe` | "recipe" | High |
| `video` | "video", "play", "watch" | High |

### Context Data Captured

#### Page View Context
```javascript
{
  url: "https://www.vitamix.com/us/en_us/shop/blenders/a3500",
  path: "/us/en_us/shop/blenders/a3500",
  title: "A3500 Ascent Series Blender | Vitamix",
  h1: "A3500 Ascent Series",
  h2s: ["Features", "What's in the box", "Specifications"],
  metaDesc: "The A3500 is our most advanced blender...",
  canonical: "https://www.vitamix.com/us/en_us/shop/blenders/a3500",
  price: "$649.95",
  breadcrumbs: ["Home", "Shop", "Blenders", "Ascent Series"]
}
```

#### Click Context
```javascript
{
  text: "Add to Cart",
  href: "/cart/add?product=a3500",
  ariaLabel: "Add A3500 to cart",
  title: null,
  role: "button",
  tagName: "button",
  className: "add-to-cart-btn primary",
  id: "add-to-cart",
  dataAction: "add-to-cart",
  sectionType: "main.product-page",
  isImage: false,
  imgAlt: null
}
```

---

## 2. Signal Feed Format

### Signal Object Structure

Each captured signal is transformed into a standardized format:

```javascript
{
  id: "page_view_1705420800000_a1b2c",
  type: "page_view",
  category: "product",
  label: "Product Page View",
  weight: 0.10,
  weightLabel: "Medium",
  icon: "📄",
  timestamp: 1705420800000,
  data: {
    url: "https://www.vitamix.com/...",
    path: "/us/en_us/shop/blenders/a3500",
    title: "A3500 Ascent Series Blender",
    h1: "A3500 Ascent Series",
    // ... additional context
  },
  product: "A3500"  // Extracted product name (if applicable)
}
```

### Weight Labels

| Weight Value | Label | Examples |
|--------------|-------|----------|
| 0.20 | Very High | Search query, compare page, add to cart |
| 0.15 | High | Recipe view, article view, video complete |
| 0.10 | Medium | Product page view, referrer, time on page |
| 0.05 | Low | Scroll depth, category browse, generic click |

### Signal Storage

Signals are stored in Chrome extension storage:
- **Session signals**: Accumulated during the browsing session
- **Persistence**: Survives page navigations and browser restart
- **Limit**: Most recent 50 signals displayed in the panel

---

## 3. Profile Definition

### Profile Schema

The profile is an inferred representation of user intent:

```javascript
{
  // Inferred Segments
  segments: [],              // e.g., ["new_parent", "gift_buyer", "existing_owner"]

  // Life Stage
  life_stage: null,          // e.g., "infant_caregiver", "fitness_enthusiast"

  // Intent Indicators
  use_cases: [],             // e.g., ["baby_food", "smoothies", "soups"]
  products_considered: [],   // e.g., ["A3500", "E310", "V1200i"]

  // Behavioral Attributes
  price_sensitivity: null,   // "high", "moderate", "low"
  decision_style: null,      // "thorough_researcher", "efficient", "visual"
  purchase_readiness: null,  // "awareness", "consideration", "decision", "high"
  shopping_for: null,        // "self", "someone_else"
  occasion: null,            // "gift", "wedding", "everyday"
  brand_relationship: null,  // "loyal_customer", "first_time_buyer"
  content_engagement: null,  // "high", "medium", "low"
  time_sensitive: null,      // true/false

  // Metadata
  confidence_score: 0.0,     // 0.0 - 1.0
  signals_count: 0,
  session_count: 1,
  first_visit: null,         // timestamp
  last_visit: null           // timestamp
}
```

### Inference Rules

Profile attributes are inferred from signal patterns:

| Rule ID | Signal Pattern | Inference | Confidence |
|---------|----------------|-----------|------------|
| `new_parent_search` | Search contains "baby", "infant", "toddler", "puree" | segments: `new_parent`, life_stage: `infant_caregiver`, use_cases: `baby_food` | +0.20 |
| `new_parent_page` | Page h1/path contains "baby" | segments: `new_parent`, `baby_feeding` | +0.15 |
| `gift_buyer_referrer` | Referrer domain contains "gift" or search query contains "gift", "wedding" | segments: `gift_buyer`, shopping_for: `someone_else` | +0.18 |
| `gift_buyer_search` | Search contains "gift", "wedding", "registry" | segments: `gift_buyer`, occasion: `gift` | +0.20 |
| `upgrader_search` | Search contains "upgrade", "vs", "compare", "replace" | segments: `existing_owner`, `upgrade_intent` | +0.18 |
| `upgrader_direct` | Direct referrer + search activity | segments: `existing_owner` | +0.10 |
| `thorough_researcher` | 1+ review clicks + 2+ recipe views | decision_style: `thorough_researcher` | +0.12 |
| `content_engaged` | 4+ recipe views | segments: `content_engaged` | +0.12 |
| `comparison_shopper` | Compare page + 2+ product views | segments: `comparison_shopper` | +0.15 |
| `price_sensitive` | Financing or reconditioned page view | price_sensitivity: `high` | +0.10 |
| `premium_buyer` | Products considered include X5, A3500, A2500 | price_sensitivity: `low`, segments: `premium_preference` | +0.08 |
| `high_purchase_intent` | Add to cart click or shipping page | purchase_readiness: `high` | +0.15 |

### Confidence Score Calculation

```
confidence_score = min(1.0, rule_confidence_sum + (signal_weights_sum × 0.3))
```

- **Minimum threshold**: Signals present but no rules match = `min(0.3, signals_count × 0.05)`
- **Maximum**: Capped at 1.0

### Confidence Levels

| Score Range | Level | Description |
|-------------|-------|-------------|
| 0.76 - 1.00 | Very High | Strong user intent identified |
| 0.56 - 0.75 | High | Good understanding of user needs |
| 0.31 - 0.55 | Medium | Partial profile, more signals needed |
| 0.00 - 0.30 | Low | Insufficient data |

---

## 4. Synthetic Query Generation

### Overview

When confidence reaches the minimum threshold (0.45), the system generates a natural language query that represents the user's inferred intent.

### Query Templates

| Template | Trigger | Pattern |
|----------|---------|---------|
| `USE_CASE` | Default | "I want to {intent} {context}. {products}. {constraints}. {action}" |
| `GIFT` | `gift_buyer` segment | "I'm looking for a blender {context}. {products}. {constraints}" |
| `UPGRADER` | `existing_owner` segment | "I want {intent}. {context}. {products}. {action}" |
| `COMPARISON` | 2+ products considered | "{products} for {intent}. {constraints}. {action}" |
| `SIMPLE` | Confidence < 0.55 | "{intent}. {action}" |

### Component Generation

#### Intent Phrases
Derived from `use_cases` array:

| Use Case | Phrase |
|----------|--------|
| `baby_food` | "make homemade baby food" |
| `smoothies` | "make smoothies" |
| `soups` | "make hot soups" |
| `nut_butters` | "make nut butters" |
| `upgrade` | "upgrade my blender" |
| `gift` | "find a gift" |

#### Context Phrases
Derived from `segments` and `life_stage`:

| Source | Phrase |
|--------|--------|
| `new_parent` | "for my baby" |
| `gift_buyer` | "as a gift" |
| `existing_owner` | "I already have a Vitamix" |
| `first_time_buyer` | "this would be my first Vitamix" |
| `premium_preference` | "I want something premium" |

#### Product Phrases
Derived from `products_considered`:

| Products | Generated Phrase |
|----------|------------------|
| 1 product | "I've been looking at the A3500" |
| 2 products | "I'm comparing the A3500 and E310" |
| 3+ products | "I'm considering the A3500, E310 and V1200i" |

#### Constraint Phrases
Derived from `price_sensitivity` and `time_sensitive`:

| Source | Phrase |
|--------|--------|
| price_sensitivity: `high` | "I'm on a budget" |
| price_sensitivity: `moderate` | "I want good value for money" |
| price_sensitivity: `low` | "budget isn't a concern" |
| time_sensitive: `true` | "I need it to arrive soon" |

#### Action Phrases
Based on confidence level:

| Confidence | Action |
|------------|--------|
| ≥ 0.85 | "Which should I choose?" |
| ≥ 0.70 | "Is this the right choice for me?" |
| ≥ 0.55 | "What do you recommend?" |
| < 0.55 | "What are my options?" |

### Example Generated Queries

**New Parent (confidence 0.68)**
```
I want to make homemade baby food for my baby. I've been looking at the E310.
I want good value for money. What do you recommend?
```

**Gift Buyer (confidence 0.72)**
```
I'm looking for a blender as a gift. I'm comparing the A3500 and A2500.
Is this the right choice for me?
```

**Upgrader (confidence 0.65)**
```
I want to upgrade my blender. I already have a Vitamix. I've been looking
at the X5. What do you recommend?
```

**Comparison Shopper (confidence 0.78)**
```
I'm comparing the A3500 and V1200i for make smoothies. Budget isn't a concern.
Is this the right choice for me?
```

### Query Complexity by Confidence

| Confidence | Complexity | Components Included |
|------------|------------|---------------------|
| 0.45 - 0.55 | Minimal | Intent + action only |
| 0.56 - 0.70 | Standard | Intent + context + products + action |
| 0.71 - 0.85 | Rich | All components + constraints |
| 0.86+ | Comprehensive | Full narrative with detailed scenarios |

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER BROWSING                                 │
│  vitamix.com page views, clicks, searches, scrolls, video plays     │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CONTENT SCRIPT                                  │
│  • Captures raw events with rich context                            │
│  • Sends generic signals to background                              │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND SERVICE WORKER                         │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐  │
│  │  Signal         │    │  Profile        │    │  Query         │  │
│  │  Classification │ => │  Inference      │ => │  Generation    │  │
│  │  (signals.js)   │    │  (profile-      │    │  (query-       │  │
│  │                 │    │   engine.js)    │    │   generator.js)│  │
│  └─────────────────┘    └─────────────────┘    └────────────────┘  │
│                                                                      │
│  Chrome Storage: profile, signals                                   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SIDE PANEL UI                                 │
│  • Real-time signal feed                                            │
│  • Profile visualization with confidence                            │
│  • Synthetic query display                                          │
│  • "Generate Page" button → POC site with query                     │
└─────────────────────────────────────────────────────────────────────┘
```
