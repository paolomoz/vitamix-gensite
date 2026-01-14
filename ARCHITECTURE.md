# Vitamix POC - Architecture Documentation

An AI-powered content generation platform built on AEM Edge Delivery Services that creates personalized product pages, recipes, and support content through real-time streaming.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Technologies](#technologies)
- [AI Pipeline](#ai-pipeline)
- [Block System](#block-system)
- [Persistence Layer](#persistence-layer)
- [Session Management](#session-management)

---

## System Overview

The platform transforms natural language queries into fully-rendered, personalized web pages. Users ask questions like "What's the best blender for smoothies?" and receive AI-generated content featuring relevant products, recipes, comparisons, and recommendations—all streamed in real-time and persisted to AEM Document Authoring.

**Key Capabilities:**
- Real-time SSE streaming for progressive page rendering
- Multi-stage AI reasoning (intent → block selection → content generation)
- Session-aware personalization with conversational context
- 73 reusable blocks spanning products, recipes, analytics, and layout
- Automatic persistence to AEM Document Authoring

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER BROWSER                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌──────────────┐    ┌─────────────────┐    ┌──────────────────────────────────┐   │
│   │  Query Form  │───▶│  scripts.js     │───▶│  stream-renderer.js              │   │
│   │  Block       │    │  (Orchestrator) │    │  (SSE Handler + Block Decorator) │   │
│   └──────────────┘    └────────┬────────┘    └──────────────┬───────────────────┘   │
│                                │                            │                        │
│                                │ ?q=user+query              │ Progressive Render     │
│                                ▼                            ▼                        │
│   ┌────────────────────────────────────────────────────────────────────────────┐    │
│   │                         73 DECORATED BLOCKS                                 │    │
│   │  ┌─────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐  │    │
│   │  │  Hero   │ │Product Cards│ │Recipe Cards  │ │ Comparison │ │Reasoning │  │    │
│   │  └─────────┘ └─────────────┘ └──────────────┘ └────────────┘ └──────────┘  │    │
│   └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ SSE Stream
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           CLOUDFLARE WORKERS EDGE                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                      vitamix-recommender (Main Worker)                       │   │
│   │                                                                              │   │
│   │   ┌───────────────┐    ┌────────────────┐    ┌─────────────────────────┐    │   │
│   │   │   index.ts    │───▶│ orchestrator.ts│───▶│  reasoning-engine.ts    │    │   │
│   │   │ (HTTP Router) │    │ (Pipeline Mgr) │    │  (Claude Integration)   │    │   │
│   │   └───────────────┘    └───────┬────────┘    └─────────────────────────┘    │   │
│   │                                │                                             │   │
│   │                                ▼                                             │   │
│   │   ┌────────────────────────────────────────────────────────────────────┐    │   │
│   │   │                    AI MODEL FACTORY                                 │    │   │
│   │   │  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────────┐  │    │   │
│   │   │  │ Claude Opus  │  │  Cerebras     │  │    Content Service      │  │    │   │
│   │   │  │ (Reasoning)  │  │  (Generation) │  │ (Products/Recipes/FAQs) │  │    │   │
│   │   │  └──────────────┘  └───────────────┘  └─────────────────────────┘  │    │   │
│   │   └────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                              │   │
│   │   ┌────────────────┐    ┌──────────────────┐                                │   │
│   │   │  da-client.ts  │───▶│ da-token-service │                                │   │
│   │   │ (Persistence)  │    │ (S2S Auth Cache) │                                │   │
│   │   └────────────────┘    └──────────────────┘                                │   │
│   │                                                                              │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│   ┌─────────────────────────┐    ┌─────────────────────────┐                        │
│   │  vitamix-analytics      │    │    embed-recipes        │                        │
│   │  (Event Tracking)       │    │    (Vector Embeddings)  │                        │
│   └─────────────────────────┘    └─────────────────────────┘                        │
│                                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                      CLOUDFLARE SERVICES                                     │   │
│   │   ┌─────────────┐    ┌───────────────┐    ┌──────────────────────────────┐  │   │
│   │   │     KV      │    │   Vectorize   │    │        Workers AI            │  │   │
│   │   │  (Sessions) │    │(Recipe Search)│    │       (Embeddings)           │  │   │
│   │   └─────────────┘    └───────────────┘    └──────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ POST /api/persist
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌─────────────────────────┐    ┌──────────────────────────────────────────────┐   │
│   │    AI PROVIDERS         │    │      AEM DOCUMENT AUTHORING                   │   │
│   │                         │    │                                               │   │
│   │   ┌─────────────────┐   │    │   ┌───────────────┐    ┌─────────────────┐   │   │
│   │   │   Anthropic     │   │    │   │  admin.da.live│───▶│  Live Pages     │   │   │
│   │   │   Claude API    │   │    │   │  (Source API) │    │  (Published)    │   │   │
│   │   └─────────────────┘   │    │   └───────────────┘    └─────────────────┘   │   │
│   │                         │    │                                               │   │
│   │   ┌─────────────────┐   │    │   Authentication:                            │   │
│   │   │    Cerebras     │   │    │   - S2S Client Credentials                   │   │
│   │   │   Inference API │   │    │   - Adobe IMS JWT Tokens                     │   │
│   │   └─────────────────┘   │    │                                               │   │
│   │                         │    │   Content Storage:                            │   │
│   │   ┌─────────────────┐   │    │   - /source/{org}/{repo}/{path}.html         │   │
│   │   │   OpenAI +      │   │    │   - Auto-categorized paths                   │   │
│   │   │   Google Gemini │   │    │   - Preview + Live URLs                      │   │
│   │   │   (Analytics)   │   │    │                                               │   │
│   │   └─────────────────┘   │    └──────────────────────────────────────────────┘   │
│   │                         │                                                        │
│   └─────────────────────────┘                                                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                              REQUEST FLOW                                           │
└────────────────────────────────────────────────────────────────────────────────────┘

  User Query                                                              Rendered Page
      │                                                                        ▲
      ▼                                                                        │
┌──────────┐   ┌─────────────┐   ┌───────────────┐   ┌──────────────┐   ┌──────────┐
│  Query   │──▶│  Intent     │──▶│    Block      │──▶│   Content    │──▶│   SSE    │
│  Input   │   │Classification│  │   Selection   │   │  Generation  │   │ Streaming│
└──────────┘   └─────────────┘   └───────────────┘   └──────────────┘   └──────────┘
                 Cerebras 8B       Claude Opus         Cerebras 120B      EventSource
                 (~200ms)          (~2-4s)             (parallel)         (real-time)

                              ┌─────────────────┐
                              │ Session Context │
                              │ (Previous 10    │
                              │  queries)       │
                              └────────┬────────┘
                                       │
                                       ▼
                              Personalized Recommendations
```

---

## Core Components

### Frontend (`/scripts/`)

| Component | File | Responsibility |
|-----------|------|----------------|
| **Orchestrator** | `scripts.js` | Route handling, generation mode detection, session context injection |
| **EDS Utilities** | `aem.js` | Block loading, decoration, image optimization, DOM manipulation |
| **Stream Renderer** | `stream-renderer.js` | SSE connection handling, progressive block rendering, skeleton loaders |
| **Session Manager** | `session-context.js` | Query history storage (max 10), context encoding for worker requests |
| **Analytics** | `analytics-tracker.js` | Event tracking (respects DNT), session/query/conversion metrics |
| **CTA Utils** | `cta-utils.js` | Purchase-intent sanitization, link classification |

### Workers (`/workers/`)

| Worker | URL | Purpose |
|--------|-----|---------|
| **vitamix-recommender** | `vitamix-gensite-recommender.paolo-moz.workers.dev` | Main AI generation pipeline with Claude + Cerebras |
| **vitamix-analytics** | `vitamix-gensite-analytics.paolo-moz.workers.dev` | Event aggregation, multi-agent analysis |
| **embed-recipes** | Internal | Recipe vector embeddings for semantic search |

### Main Worker Architecture (`vitamix-recommender`)

```
workers/vitamix-recommender/src/
├── index.ts                 # HTTP routing, SSE stream creation
├── lib/
│   ├── orchestrator.ts      # Multi-stage pipeline coordinator
│   ├── reasoning-engine.ts  # Claude integration for block selection
│   └── content-service.ts   # Product/recipe/FAQ data bundling
├── ai-clients/
│   ├── model-factory.ts     # AI model abstraction (3 presets)
│   ├── anthropic-client.ts  # Claude API wrapper
│   └── cerebras-client.ts   # Cerebras API wrapper
└── da/
    ├── da-client.ts         # Document Authoring API integration
    └── da-token-service.ts  # S2S token caching + refresh
```

---

## Data Flow

### Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: INTENT CLASSIFICATION (Fast - ~200ms)                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Input:  "What's the best blender for hot soups?"                               │
│                    │                                                             │
│                    ▼                                                             │
│            ┌──────────────┐                                                      │
│            │ Cerebras 8B  │                                                      │
│            └──────┬───────┘                                                      │
│                   │                                                              │
│                   ▼                                                              │
│  Output: {                                                                       │
│    "intentType": "product-recommendation",                                       │
│    "confidence": 0.92,                                                           │
│    "entities": { "useCases": ["hot soups"], "features": ["heating"] },          │
│    "journeyStage": "exploring"                                                   │
│  }                                                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: DEEP REASONING (Quality - ~2-4s)                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Input:  Intent + Session Context + Product/Recipe RAG                          │
│                    │                                                             │
│                    ▼                                                             │
│            ┌──────────────┐                                                      │
│            │ Claude Opus  │                                                      │
│            └──────┬───────┘                                                      │
│                   │                                                              │
│                   ▼                                                              │
│  Output: {                                                                       │
│    "selectedBlocks": ["hero", "product-cards", "recipe-cards", "faq"],          │
│    "rationale": "User seeking hot soup capabilities...",                         │
│    "blockConfigs": { "hero": { "headline": "..." }, ... }                        │
│  }                                                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: CONTENT GENERATION (Parallel - ~1-2s per block)                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  For each selected block (in parallel):                                          │
│                                                                                  │
│   ┌───────────┐   ┌───────────────┐   ┌──────────────┐   ┌─────────────┐        │
│   │   Hero    │   │ Product Cards │   │ Recipe Cards │   │    FAQ      │        │
│   │           │   │               │   │              │   │             │        │
│   │ Cerebras  │   │   Cerebras    │   │  Cerebras    │   │  Cerebras   │        │
│   │  120B     │   │    120B       │   │   120B       │   │   120B      │        │
│   └─────┬─────┘   └───────┬───────┘   └──────┬───────┘   └──────┬──────┘        │
│         │                 │                  │                  │               │
│         ▼                 ▼                  ▼                  ▼               │
│      HTML #1           HTML #2            HTML #3            HTML #4            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ SSE Events
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: STREAMING & RENDERING                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  event: block-content                                                            │
│  data: {"html": "<div class='hero'>...</div>", "sectionStyle": "highlight"}     │
│                                                                                  │
│  event: block-content                                                            │
│  data: {"html": "<div class='product-cards'>...</div>", "imageId": "img-123"}   │
│                                                                                  │
│  event: image-ready                                                              │
│  data: {"imageId": "img-123", "url": "https://..."}                             │
│                                                                                  │
│  event: reasoning                                                                │
│  data: {"reasoning": "Based on your interest in hot soups..."}                  │
│                                                                                  │
│  event: complete                                                                 │
│  data: {"blocks": [...], "intent": {...}, "paths": {...}}                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Persistence Flow

```
Generated Page                 vitamix-recommender              Document Authoring
      │                               │                               │
      │  POST /api/persist            │                               │
      │  {html, intent, slug}         │                               │
      │──────────────────────────────▶│                               │
      │                               │                               │
      │                               │  1. Get/refresh S2S token     │
      │                               │─────────────────────────────▶│
      │                               │◀─────────────────────────────│
      │                               │                               │
      │                               │  2. PUT /source/{org}/{repo}/ │
      │                               │     {category}/{slug}.html    │
      │                               │─────────────────────────────▶│
      │                               │                               │
      │                               │  3. Return preview/live URLs  │
      │                               │◀─────────────────────────────│
      │                               │                               │
      │  {previewUrl, liveUrl}        │                               │
      │◀──────────────────────────────│                               │
```

---

## Technologies

### Platform & Infrastructure

| Technology | Purpose |
|------------|---------|
| **AEM Edge Delivery Services** | Lightweight decoupling from AEM, block-based architecture |
| **Cloudflare Workers** | Serverless compute at the edge (TypeScript) |
| **Cloudflare KV** | Session persistence, analytics storage |
| **Cloudflare Vectorize** | Vector database for recipe semantic search |
| **Cloudflare Workers AI** | Embedding generation |

### AI/ML Services

| Service | Model | Use Case |
|---------|-------|----------|
| **Anthropic** | Claude Opus 4.5 | Deep reasoning, block selection |
| **Anthropic** | Claude Sonnet 4.5 | Fast reasoning (optional preset) |
| **Cerebras** | Llama 8B | Intent classification (~200ms) |
| **Cerebras** | Llama 120B | Content generation |
| **OpenAI** | GPT-4 | Analytics multi-agent analysis |
| **Google** | Gemini | Analytics consensus |

### Model Presets

```typescript
// Configured in wrangler.toml
const presets = {
  production: {
    reasoning: "claude-opus-4-5-20241101",    // High quality
    content: "cerebras/llama-3.3-70b"         // Fast generation
  },
  fast: {
    reasoning: "claude-sonnet-4-5-20241101",  // 2x faster
    content: "cerebras/llama-3.3-70b"
  },
  "all-cerebras": {
    reasoning: "cerebras/llama-3.3-70b",      // Cost optimized
    content: "cerebras/llama-3.3-70b"
  }
};
```

### Development Tools

| Tool | Purpose |
|------|---------|
| **Wrangler** | Cloudflare Workers CLI |
| **TypeScript** | Type safety in workers |
| **ESLint/Stylelint** | Code quality |
| **AEM CLI (`aem up`)** | Local development server |

---

## AI Pipeline

### Reasoning Engine

The reasoning engine uses a two-phase approach:

**Phase 1: Fast Classification**
- Model: Cerebras Llama 8B
- Latency: ~200ms
- Output: Intent type, confidence, entities, journey stage

**Phase 2: Deep Block Selection**
- Model: Claude Opus 4.5
- Latency: 2-4 seconds
- Output: Selected blocks (4-8), configuration, rationale

### Block Selection Constraints

The reasoning engine enforces rules:
- No consecutive hero blocks
- Product cards require product entities
- Recipe cards require recipe context
- Maximum 8 blocks per page
- Journey stage influences block mix

### Content Generation

Each block is generated in parallel using Cerebras:
- Block-specific prompt templates
- Product/recipe data injection
- CTA sanitization (purchase → informational)
- HTML structure validation

---

## Block System

### Block Categories (73 Total)

| Category | Count | Examples |
|----------|-------|----------|
| **AI/Search** | 6 | `query-form`, `cerebras-generated`, `reasoning`, `support-triage` |
| **Products** | 10 | `product-cards`, `product-hero`, `product-compare`, `comparison-table` |
| **Recipes** | 8 | `recipe-cards`, `recipe-hero`, `recipe-steps`, `recipe-tabs` |
| **Layout** | 12 | `hero`, `cards`, `columns`, `split-content`, `fragment` |
| **Analytics** | 6 | `analytics-queries`, `analytics-dashboard`, `analytics-metrics` |
| **Specialized** | 31 | `best-pick`, `allergen-safety`, `accessibility-specs`, `noise-context` |

### Block Structure

```
blocks/{block-name}/
├── {block-name}.js    # Decorator function
└── {block-name}.css   # Block styles
```

### Decorator Pattern

```javascript
// blocks/product-cards/product-cards.js
export default function decorate(block) {
  const rows = [...block.children];

  // Transform DA table structure to presentational HTML
  block.innerHTML = `
    <div class="product-cards-container">
      ${rows.map(row => `
        <div class="product-card">
          <img src="${row.querySelector('img')?.src}" alt="...">
          <h3>${row.querySelector('h3')?.textContent}</h3>
          <p class="price">${row.querySelector('.price')?.textContent}</p>
          <a href="..." class="cta">Learn More</a>
        </div>
      `).join('')}
    </div>
  `;
}
```

### Block Decoration Lifecycle

```
1. Page Load
      │
      ▼
2. decorateSections()     ─── Add .section class
      │
      ▼
3. decorateBlocks()       ─── Identify blocks, add classes
      │
      ▼
4. loadBlock(block)       ─── Async load block JS/CSS
      │
      ▼
5. decorate(block)        ─── Transform DA table → HTML
      │
      ▼
6. decorateButtons()      ─── Style button links
      │
      ▼
7. decorateIcons()        ─── Replace icon placeholders
      │
      ▼
8. waitForImages()        ─── Lazy-load optimization
```

---

## Persistence Layer

### Document Authoring Integration

The system persists generated pages to AEM Document Authoring:

**Base URL:** `https://admin.da.live`

**Authentication:** Service-to-Service (S2S)
- Client ID + Client Secret
- JWT token exchange via Adobe IMS
- Automatic token refresh on 401

**Endpoints:**
- `PUT /source/{org}/{repo}/{path}.html` - Create/update page
- `PUT` for media - Upload images alongside pages

### Path Generation

Pages are auto-categorized based on intent:

```
Intent: product-recommendation
Query: "best blender for smoothies"
     │
     ▼
Path: /products/best-blender-smoothies-abc123.html
```

Categories: `products`, `recipes`, `support`, `comparisons`, `guides`

---

## Session Management

### SessionContextManager

Stores query history in sessionStorage:

```json
{
  "sessionId": "uuid-v4",
  "sessionStart": 1704067200000,
  "queries": [
    {
      "query": "best blender for smoothies",
      "intent": "product-recommendation",
      "entities": {
        "products": ["A3500", "A2500"],
        "useCases": ["smoothies"]
      },
      "generatedPath": "/products/best-blender-smoothies-abc123",
      "blockTypes": ["hero", "product-cards", "recipe-cards"],
      "journeyStage": "exploring",
      "confidence": 0.92
    }
  ]
}
```

### Context Flow

```
User submits query
      │
      ▼
SessionContextManager.buildEncodedContextParam()
      │
      ▼
Worker receives: ?query=...&ctx=base64(previous_queries)
      │
      ▼
Reasoning engine uses context for:
  - Conversational follow-ups
  - Journey stage progression
  - Entity disambiguation
```

---

## Generation Modes

| Mode | URL Parameter | Worker | Features |
|------|---------------|--------|----------|
| **Recommender** | `?q=` or `?query=` | vitamix-recommender | Full pipeline, session context, auto-persist |
| **Standard** | `?generate=` | vitamix-generative | Two-phase generation, manual save |
| **Fast** | `?fast=` | vitamix-generative-fast | Speed-optimized, simplified pipeline |
| **Experiment** | `?experiment=` | Client-side | Fade-in animations, POC mode |

---

## Analytics

### Event Tracking

| Event | Trigger | Data |
|-------|---------|------|
| `session_start` | New browser session | Session ID, timestamp |
| `query` | User search | Query text, intent, entities |
| `page_published` | Generated page saved | Path, block types |
| `conversion` | CTA click to vitamix.com | Source block, destination URL |

### Multi-Agent Analysis

The analytics worker uses OpenAI and Google Gemini for consensus-based analysis of query patterns and user behavior.

---

## Environment Configuration

### Required Secrets

```bash
# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
CEREBRAS_API_KEY=csk-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIza...

# Document Authoring
DA_CLIENT_ID=...
DA_CLIENT_SECRET=...
```

### Wrangler Configuration

```toml
[vars]
MODEL_PRESET = "production"
DA_ORG = "paolomoz"
DA_REPO = "vitamix-poc"

[[kv_namespaces]]
binding = "SESSIONS"

[[vectorize]]
binding = "VECTORIZE"
index_name = "vitamix-content"

[ai]
binding = "AI"
```

---

## Key Design Decisions

1. **SSE over WebSockets**: Server-Sent Events provide simpler unidirectional streaming with automatic reconnection, ideal for progressive page rendering.

2. **Two-Phase Reasoning**: Fast classification (~200ms) enables early UI feedback while deep reasoning (~2-4s) ensures quality block selection.

3. **Parallel Content Generation**: Blocks are generated concurrently, reducing total latency from O(n) to O(1) for n blocks.

4. **Session Context**: Maintaining query history enables conversational experiences ("What about the A3500?" follows "best blender for smoothies").

5. **CTA Sanitization**: Purchase-intent language is automatically softened to comply with content guidelines while maintaining user intent.

6. **Block-Based Architecture**: EDS blocks provide reusable, composable UI components that work identically for authored and AI-generated content.
