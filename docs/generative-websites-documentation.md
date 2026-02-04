# Generative Websites: 1:1 Personalization at Web Scale

## A Documentation Brief for Whitepaper and Visual Storytelling

---

## Part 1: What Are Generative Websites?

### The Concept

Generative Websites are a new category of web experience where pages are not pre-authored for a generic audience but are composed in real time by AI models for each individual visitor. Text, images, layout, and recommendations adjust dynamically based on what the system knows about the person viewing the page.

This is fundamentally different from traditional personalization, which swaps pre-built content blocks between audience segments (e.g., "show banner A to segment X"). Generative Websites produce page elements that **didn't exist until the moment they were needed**. A product comparison page for a parent of four highlights capacity, noise level, and ease of cleaning. The same page, for a fitness enthusiast, emphasizes nutrient preservation and single-serve capability. Neither version was authored in advance. Both were generated on-the-fly from the same underlying product data, using AI models running at the edge.

The core premise: **every visitor sees the same *intent* of a page, but the *expression* of that intent adapts to make it maximally helpful for that specific person.**

### Not a Chatbot. A Website.

Generative Websites preserve the browse experience—navigation, links, images, editorial structure—that visitors expect from websites. This distinguishes them from Brand Concierge or chatbot experiences, which serve a conversational "search" mindset ("Help me find the right blender"). Generative Websites serve the "browse" mindset ("I'm curious about blenders, let me look around") while ensuring that every page the visitor lands on has already been tuned to what they've revealed through their journey.

The two approaches are complementary. A visitor might begin browsing a Generative Website, and as context accumulates, the system can surface an invitation to shift into a conversational Concierge experience for deeper guidance—or vice versa.

### Where in the Website Architecture

Within the 2026 Website Archetype framework, brand websites serve five page types:

| Page Type | Purpose | Generative Fit |
|-----------|---------|----------------|
| **Topic Pages** | Informational content for search citations | Low — factual, stable content |
| **Persuasive Pages** | PDPs, comparisons, recommendations | **Primary target** — high commercial intent |
| **Generative Pages & Brand Concierge** | AI-composed pages and conversational experiences | **Core capability** |
| **Actions** | Transactional: checkout, forms | Low — structured workflows |
| **Demand Pages** | Campaign landing pages from paid/social/email | Medium — personalized by entry context |

The highest-value application is **Persuasive Pages**: product detail pages, comparison pages, recommendation pages—anywhere visitors are actively evaluating options and personalization directly impacts conversion.

---

## Part 2: Why 1:1 Personalization Is Now Possible

### The Marketer's Unfulfilled Promise

For two decades, 1:1 personalization has been the stated goal of digital marketing. The vision was simple: show each customer exactly the content that matters to them. The reality was segmentation—bucketing millions of visitors into a handful of personas and showing each persona slightly different hero banners. True 1:1 was technically impossible (you can't pre-author millions of page variants), operationally impractical (who would manage all that content?), and computationally infeasible (real-time generation was too slow and too expensive).

### Three Breakthroughs Changed This

**1. Inference-Optimized Infrastructure at the Edge**
AI models can now run on globally distributed, inference-optimized silicon (Cloudflare Workers, edge compute). Latency dropped from seconds to sub-second. A visitor in Tokyo gets personalized content from an edge node in Tokyo, not from a centralized data center. The Vitamix POC uses Cloudflare Workers with Cerebras for content generation (optimized for throughput) and Anthropic Claude for reasoning (optimized for judgment)—both callable from the edge with acceptable latency.

**2. Dramatically Faster and Cheaper LLM Inference**
The cost and speed of generating content with LLMs improved by orders of magnitude between 2023 and 2026. Cerebras inference delivers content generation at speeds that make streaming page sections viable in real time. What would have cost dollars per page view in 2023 now costs fractions of a cent.

**3. Model Capabilities for On-Brand Content**
Modern LLMs produce contextually appropriate, brand-consistent content without extensive prompt engineering. They can reason about user intent, select appropriate content structures, and generate copy that matches a brand's voice and guidelines. The Vitamix system provides brand context, product catalogs, and block templates—the models handle the creative assembly.

### The Result: Content Generation Becomes Infrastructure

The shift is conceptual: personalization moves from a **content management problem** (requiring human authors to produce variants) to an **infrastructure problem** (requiring compute and models). Infrastructure scales. Infrastructure gets cheaper over time. Infrastructure doesn't require editorial approval for each variant. The brand defines the voice, the boundaries, the product data, and the block library. The AI assembles within those constraints, optimizing for each visitor.

---

## Part 3: Why This Is Valuable to Customers

### Less Work for Visitors

Traditional product pages force visitors to do cognitive work: decode feature matrices, mentally filter irrelevant information, figure out which specification matters for their use case, and wonder whether there's a better page elsewhere on the site. A parent comparing blenders doesn't care about commercial RPM specifications—they care about "can it handle frozen fruit?" and "will it wake up the baby?"

Generative Websites eliminate this translation layer. **The page the visitor sees is already the best version of that page for them.**

### Relevant from the First Interaction

Context accumulates across the session. The first query provides intent. Each subsequent interaction adds signal. By the third page, the system understands not just what the visitor searched for, but the underlying need:

- **Query 1:** "green smoothies for kids" — The system learns: parent, health-conscious, kids involved
- **Query 2:** "which blenders are quietest?" — Refines: noise is a concern, likely early morning use
- **Query 3:** "A3500 vs V1200" — Narrows: comparing specific models, moving toward a decision

Each page is generated with the full accumulated context. The comparison page doesn't just list specs—it highlights noise levels (because the visitor cared about that earlier), includes a recipe for kid-friendly green smoothies (because that was the entry point), and focuses the recommendation on family-sized capacity (because the system inferred household size from the recipe query).

### Answers the Question They Actually Have

People don't arrive at product websites with abstract curiosity. They arrive with specific situations: "I have a family of four, my older son drinks smoothies daily, and my younger son won't eat vegetables—but he'll eat soup, even green-looking ones." Traditional websites require the visitor to map this personal context onto generic product information. Generative Websites invert this: the system maps its product knowledge onto the visitor's context, surfacing what's relevant and omitting what isn't.

### Trust Through Transparency

The Vitamix implementation includes reasoning transparency—visitors can see *why* the system recommended what it did. This isn't a black-box recommendation engine. The AI's reasoning is surfaced: "Recommended the A3500 because your previous queries indicate you need a blender for both hot soups and frozen smoothies, and the A3500's variable speed control handles both without overheating."

---

## Part 4: How It Works — Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    VISITOR CONTEXT                       │
│                                                         │
│  Explicit              Implicit              Session    │
│  • Search queries      • Browse behavior     • Pages    │
│  • Filter selections   • Click patterns        visited  │
│  • Stated preferences  • Device / location   • Products │
│                        • Scroll depth          viewed   │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│              EDGE AI PIPELINE (Cloudflare Workers)       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │   CLASSIFY    │  │   REASON     │  │   GENERATE    │ │
│  │   (Cerebras)  │→ │   (Claude)   │→ │   (Cerebras)  │ │
│  │              │  │              │  │               │ │
│  │ Intent type  │  │ Block select │  │ HTML content  │ │
│  │ Journey stage│  │ Product pick │  │ Images        │ │
│  │ Entities     │  │ Guidance     │  │ Streaming SSE │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
│                                                         │
│  RAG Context: Product catalog, recipes, FAQs            │
└───────────────┬─────────────────────────────────────────┘
                │ SSE Stream
                ▼
┌─────────────────────────────────────────────────────────┐
│              PERSONALIZED OUTPUT                        │
│                                                         │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────┐│
│  │  Adapted   │ │  Relevant  │ │  Smart Comparisons   ││
│  │  Copy      │ │  Images    │ │  (dimensions that    ││
│  │            │ │            │ │   matter to visitor)  ││
│  └────────────┘ └────────────┘ └──────────────────────┘│
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────┐│
│  │  Layout    │ │  New Below-│ │  Follow-up           ││
│  │  Choices   │ │  Fold      │ │  Suggestions         ││
│  │            │ │  Blocks    │ │                      ││
│  └────────────┘ └────────────┘ └──────────────────────┘│
│                                                         │
│  Performance: LCP ≤ 2.5s above fold, ≤ 5s below fold   │
└─────────────────────────────────────────────────────────┘
```

### The Three-Stage AI Pipeline

#### Stage 1: Intent Classification (Cerebras — fast, cost-efficient)

The visitor's query (explicit) or accumulated signals (implicit) are classified into a structured intent:

- **Intent type**: discovery, comparison, product-detail, use-case, support, gift, accessibility, etc.
- **Journey stage**: exploring → comparing → deciding
- **Entities extracted**: specific products mentioned, use cases, features, price sensitivity
- **Confidence score**: 0–1, determines how specific the recommendation can be

Special intent detection rules handle edge cases: support queries ("broken," "warranty") route to troubleshooting blocks; gift queries ("for my mom") avoid recommending refurbished products; medical-context queries ("arthritis," "dysphagia") trigger empathetic hero content with accessibility focus.

#### Stage 2: Deep Reasoning (Claude — high judgment)

The reasoning engine performs the critical editorial work that would traditionally require a human content strategist:

1. **Analyzes the query** in full context (including session history and implicit signals)
2. **Selects blocks** from a library of 72 block types — choosing which content structures best serve this visitor's need
3. **Picks products** with explicit rationale — matching products to the inferred use case, not just keyword matching
4. **Generates content guidance** — e.g., "emphasize kid-friendly soup recipes that hide vegetables" or "compare noise levels prominently since the visitor asked about quiet operation"
5. **Plans the journey** — suggests follow-up queries that fill gaps in what the visitor has explored

The reasoning engine uses confidence thresholds to calibrate how assertive the recommendation should be:

| Confidence | Recommendation Style |
|------------|---------------------|
| ≥ 70% | Single product recommendation with conviction |
| 50–70% | Best pick presented alongside alternatives |
| 35–50% | Comparison only, no single recommendation |
| < 35% | Discovery mode — help the visitor explore |

#### Stage 3: Parallel Content Generation (Cerebras — high throughput)

For each selected block, content is generated in parallel and streamed to the browser via Server-Sent Events (SSE):

- **Block HTML** is generated with the reasoning engine's guidance embedded
- **Hero images** are selected or generated based on the semantic context
- **The page assembles progressively** — the hero appears first, then blocks stream in below the fold
- **Each block includes a rationale** explaining why it was chosen (for transparency and debugging)

### The Block System: 72 Composable Content Structures

The system doesn't generate free-form HTML. It selects from and fills **72 pre-designed block types** — each with defined structure, styling, and behavior. This is the key architectural decision that makes generative content brand-safe:

| Category | Example Blocks | Purpose |
|----------|----------------|---------|
| Product | product-hero, product-compare, best-pick, product-cards | Product discovery and evaluation |
| Recipe | recipe-hero, recipe-steps, recipe-cards, recipe-tabs | Recipe discovery and instruction |
| Support | troubleshooting-steps, faq, quick-answer, support-triage | Problem resolution |
| Engagement | testimonials, follow-up-advisor, follow-up | Social proof and next steps |
| Specialized | budget-breakdown, engineering-specs, allergen-safety, noise-context | Domain-specific deep content |
| Layout | hero, cards, columns, split-content | Page structure |

The brand controls every block's visual design, the AI controls which blocks appear and what content fills them. This separation ensures brand consistency while enabling infinite personalization.

### Session Context and Progressive Personalization

Each visitor session maintains a rolling context (up to 10 queries) that enriches subsequent interactions:

```
Session Context Store
├── Query 1: "green smoothies for kids"
│   ├── Intent: discovery
│   ├── Entities: { ingredients: ["spinach"], goals: ["healthy"] }
│   ├── Recommended products: [A3500, E320]
│   ├── Blocks shown: [hero, recipe-cards, follow-up-advisor]
│   └── Journey stage: exploring
│
├── Query 2: "which model is quietest"
│   ├── Intent: comparison
│   ├── Entities: { features: ["noise-level"] }
│   ├── Recommended products: [A3500, V1200]
│   ├── Blocks shown: [product-compare, noise-context, best-pick]
│   └── Journey stage: comparing
│
└── Research gaps detected:
    ├── "reviews" — not yet explored
    ├── "warranty" — not yet explored
    └── Suggested: "What do owners say about the A3500?"
```

The system actively tracks **research coverage** — what content types the visitor has and hasn't seen — and uses this to suggest productive next queries that fill knowledge gaps.

### Performance Architecture

Generative Websites are worthless if they're slow. The implementation enforces strict performance constraints:

- **Above-the-fold content (hero)**: Delivered within 2.5 seconds LCP via fast-path generation
- **Below-fold blocks**: Stream progressively within 5 seconds total
- **Two-phase rendering**: Hero content generates first (separate fast path), remaining blocks stream in parallel
- **Edge execution**: Cloudflare Workers eliminate round-trips to origin servers
- **Streaming SSE**: No waiting for the full page to generate — blocks appear as they're ready

### Page Persistence

Generated pages are not ephemeral. Once generated, a page can be persisted to Adobe's Document Authoring (DA) system at a permanent URL:

```
Generated page → /api/persist → /discover/{slug}/index.html
```

This means:
- Visitors can bookmark and share personalized pages
- The system builds a growing library of generated content
- Analytics can track performance of generated vs. authored pages
- Content strategists can review what the AI is producing

---

## Part 5: Use Cases Implemented for Vitamix

### Use Case A: Explicit Query-Based Page Generation

**The scenario:** A visitor arrives at the Vitamix site and types a natural-language query into a search/question box.

**Example query:**
> "Looking to buy a Vitamix blender — can you compare X5 vs X4 and others if you think they make sense to look into. I have a family of 4 — my older son is into smoothies and my younger son doesn't like veggies — but when I make soups he likes them — even if they are green looking."

**What happens:**

1. **The query hits the recommender worker** at the edge (Cloudflare)
2. **Intent classification** (Cerebras) identifies: comparison intent, family context, two distinct use cases (smoothies + soups), kid-focused, picky-eater signal
3. **Deep reasoning** (Claude) determines:
   - Primary need: a versatile blender that handles both hot soups and frozen smoothies
   - Hidden need: the parent is using soup-making as a strategy to get vegetables into the younger child
   - Product match: models with variable speed (smooth soups), large capacity (family of 4), and hot-blend capability
   - Block selection: hero (empathetic, family-focused), product-compare (emphasizing capacity + soup capability), recipe-cards (kid-friendly soups that hide vegetables), best-pick (with rationale), follow-up-advisor
4. **Content generates and streams** — hero appears in under 3 seconds, comparison table highlights noise level and capacity (not commercial RPM), recipe section features "Green Monster Soup" and "Hidden Veggie Smoothie," follow-up suggestions include "What accessories work with these models?" and "What's the warranty?"
5. **The page persists** at a permanent URL the visitor can share or return to

**Key differentiator from search:** The visitor didn't get a list of links. They got a page composed specifically for their situation — a parent of four with two kids who have different needs, one a smoothie drinker, the other a picky eater who will eat soup. No pre-authored page on vitamix.com addresses this exact scenario. The generative website created one.

**Conversational refinement:** The visitor can ask follow-up queries. Each subsequent page incorporates everything learned so far. By the third interaction, the system knows the family size, dietary constraints, noise sensitivity, and budget range — and every recommendation reflects that accumulated understanding.

**Blocks used in this scenario:**
- `hero` — Empathetic headline: "The Right Vitamix for Your Family's Kitchen"
- `product-compare` — X5 vs X4 vs A3500, columns emphasize capacity, noise, hot-blend capability
- `recipe-cards` — Kid-friendly soups and smoothies with "hiding vegetables" angle
- `best-pick` — Single recommendation with confidence rationale
- `noise-context` — Contextual block about noise levels (because family context implies early-morning use)
- `follow-up-advisor` — Smart next-step suggestions based on research gaps

### Use Case B: Implicit Signal-Based Content Injection and Page Generation

**The scenario:** A visitor is browsing vitamix.com normally — no explicit queries. A Chrome extension (or future embedded script) observes their behavior and infers intent from implicit signals.

**What the extension captures:**

| Signal Type | Example | Weight |
|-------------|---------|--------|
| Page views | Visited /products/a3500, /products/v1200 | High |
| Click patterns | Clicked "Compare" button, clicked "Noise Level" filter | High |
| Scroll depth | Scrolled 90% on A3500 page, only 30% on V1200 | Medium |
| Time on page | 4 minutes on comparison page | Medium |
| Navigation path | Products → Recipes → Back to Products | Medium |
| Content extraction | Read price, viewed ratings, checked accessories | Low–Medium |

**How signals become personalization:**

1. **Signal capture** — The content script observes all interactions on vitamix.com (page views with full context extraction, clicks with element data, scroll depth, comparison page analysis)

2. **Profile inference** — The background worker aggregates signals into an inferred profile:
   ```
   {
     primaryIntent: "Parent comparing high-end blenders for family use",
     specificNeeds: ["Large capacity", "Hot soup capability", "Quiet operation"],
     emotionalContext: "Invested but undecided — deep comparison behavior",
     journeyStage: "comparing",
     keyInsights: [
       "Spent 4x more time on A3500 than V1200",
       "Clicked noise-related content 3 times",
       "Viewed kid-friendly recipe section"
     ]
   }
   ```

3. **Context packaging** — The full signal history is stored with a context ID (`ctx_xxxxx`) in Cloudflare KV (1-hour TTL) and passed to the recommender worker

4. **Personalized page generation** — The system generates a page without the visitor ever typing a query. The page is composed entirely from behavioral inference:
   - Hero content addresses the visitor's inferred situation directly
   - Product comparison is pre-focused on the dimensions they've been evaluating
   - Recipes match the dietary patterns observed in their browsing
   - The recommendation reflects confidence calibrated to signal strength

5. **Content injection** — On the current vitamix.com page, hints or supplementary content blocks can be injected below the fold, personalized to the visitor's inferred needs — without disrupting the existing page structure

**The two modes of implicit personalization:**

| Mode | Mechanism | Disruption Level |
|------|-----------|-----------------|
| **Content injection** | Add personalized blocks below the fold of existing pages | Minimal — enhances current page |
| **Page generation** | Generate an entirely new page based on accumulated signals | Significant — creates new navigation path |

**Example flow:**

1. Visitor views the A3500 product page (signal: high-end interest)
2. Clicks "Compare" and views A3500 vs V1200 (signal: narrowing decision)
3. Scrolls to noise specifications on both pages (signal: noise is a concern)
4. Visits recipes section, clicks "Soups" filter (signal: hot-blend use case)
5. Returns to A3500 page

At step 5, the system has enough context to:
- **Inject** a personalized block below the fold: "Based on what you've been exploring — here's how the A3500 handles hot soups while keeping noise low"
- **Generate** a full page if the visitor asks: a comparison pre-focused on noise + soup capability + family capacity, with recipes included, and a clear recommendation

**The critical insight:** The visitor never typed a word. Every personalization signal came from behavior. The system inferred intent the same way an experienced sales associate would: by watching what someone picks up, examines, puts back, and returns to.

### How Both Use Cases Connect

The explicit and implicit approaches are not separate systems. They share the same AI pipeline, the same block library, the same reasoning engine, and the same session context. A visitor can:

1. **Start implicit** — Browse vitamix.com, accumulating behavioral signals
2. **Shift explicit** — Type a query informed by their browsing ("Is the A3500 quiet enough for early morning?")
3. **Continue implicit** — Browse the generated page, and the system tracks what they engage with
4. **Return explicit** — Ask a follow-up that builds on everything prior

This fluid movement between explicit and implicit personalization mirrors how real conversations work. You observe, you ask, you observe the response, you refine. The system supports the same rhythm.

---

## Appendix A: Whitepaper Structure Guide

The content above maps to a whitepaper in the following structure:

| Whitepaper Section | Source from This Document |
|-------------------|--------------------------|
| **Executive Summary** | Part 1 (What They Are) — opening paragraphs |
| **The Personalization Gap** | Part 2 (Why Now) — "The Marketer's Unfulfilled Promise" |
| **What Changed: Three Breakthroughs** | Part 2 — "Three Breakthroughs Changed This" |
| **How Generative Websites Work** | Part 4 — Full technical architecture |
| **Value to the Customer** | Part 3 — all three subsections |
| **Use Cases: The Vitamix Implementation** | Part 5 — both use cases |
| **Generative Websites vs. Brand Concierge** | Part 1 — "Not a Chatbot. A Website." |
| **Implementation Philosophy** | Part 2 — "Content Generation Becomes Infrastructure" + Part 4 — "Block System" |
| **The Shift** | Synthesis: "one page, many visitors" → "many pages, each for one visitor" |

**Recommended whitepaper length:** 3,000–4,000 words (this document provides ~3,500 words of source material).

**Key visual assets for the whitepaper:**
1. The three-stage AI pipeline diagram (Part 4)
2. The session context progressive personalization diagram (Part 4)
3. The website archetype table showing where generative websites fit (Part 1)
4. The explicit vs. implicit signal comparison table (Part 5)
5. The confidence threshold table (Part 4)

---

## Appendix B: 3-Minute Visual Infographic Voiceover Script

### Slide 1 — The Problem (0:00–0:30)

**Visual:** Split screen. Left: a mother at her phone, thought bubbles showing family dinner, kids, a blender. Right: a generic product page with a dense comparison table and tiny text.

**Voiceover:**
"When Sarah searches for a blender for her family, she gets the same product page as everyone else. A wall of specifications. A comparison table with 40 rows she has to decode. She's a parent with two kids — one loves smoothies, one hates vegetables but eats soup. None of that matters to the page she's looking at. She has to do the work of figuring out which features matter for her life.

What if the website already knew?"

---

### Slide 2 — What Are Generative Websites (0:30–1:00)

**Visual:** Animation showing the same page URL loading, but the content morphing for three different visitors — a parent (capacity + noise highlighted), a fitness enthusiast (nutrient preservation + single-serve), a professional chef (power + durability). Same page structure, different content expression.

**Voiceover:**
"Generative Websites are a new kind of web experience. Instead of showing everyone the same pre-built page, AI models running at the edge compose each page in real time — adjusting text, images, comparisons, and recommendations based on what the system knows about you.

The brand controls the intent — what the page is for. The AI controls the expression — how it serves each visitor. Same product. Different lens. Personalized at the individual level."

---

### Slide 3 — Why Now (1:00–1:30)

**Visual:** Three pillars appearing one by one: (1) a globe with edge nodes lighting up, (2) a cost curve dropping sharply, (3) an AI model producing on-brand content. Each pillar lights up as it's described.

**Voiceover:**
"Marketers have talked about one-to-one personalization for twenty years. It was always technically impossible. Three things changed.

First — AI inference moved to the edge. Models now run on servers in every major city, not one data center.

Second — the cost of AI generation dropped by orders of magnitude. What cost dollars per page in 2023 now costs fractions of a cent.

Third — models got good enough. They produce content that's on-brand, contextually appropriate, and trustworthy — without needing a human to review every variant.

Personalization shifted from a content problem to an infrastructure problem. And infrastructure scales."

---

### Slide 4 — How It Works (1:30–2:15)

**Visual:** Animated pipeline. Visitor context (signals flowing in from the left) → three-stage pipeline (Classify → Reason → Generate) → page assembling block-by-block on the right. Blocks snap into place like Lego.

**Voiceover:**
"Here's how it works. When a visitor arrives, the system gathers context — what they've typed, where they've clicked, what they've browsed.

Stage one: a fast AI model classifies their intent. Are they exploring? Comparing? Ready to decide?

Stage two: a reasoning engine — think of it as an AI content strategist — selects which content blocks to show and what to emphasize. It draws from a library of 72 pre-designed block types: product comparisons, recipe cards, troubleshooting guides, expert recommendations.

Stage three: content generates in parallel and streams to the browser. The hero section appears in under three seconds. Remaining blocks fill in below the fold.

The result: a page that looks like a website — navigation, images, editorial structure — but with every element tuned to this specific visitor."

---

### Slide 5 — The Vitamix Implementation (2:15–2:50)

**Visual:** Two parallel flows. Left side: "Explicit" — visitor types a query, page generates. Right side: "Implicit" — visitor browses normally, signals accumulate, personalized content appears. Both flows converge at the same AI pipeline in the center.

**Voiceover:**
"We built this for Vitamix with two approaches.

Explicit: a visitor types what they need — 'Compare blenders for a family of four, my kids have different needs.' The system generates a complete page: the right products compared on the right dimensions, recipes that match their family's situation, a recommendation with reasoning.

Implicit: a visitor just browses. The system watches — which pages they visit, what they click, how far they scroll, what they come back to. From pure behavior, it infers intent: 'This person cares about noise levels and hot soup capability.' And it personalizes the next page they see — without them ever typing a word.

Both approaches share the same AI pipeline, the same block library, the same reasoning. The visitor can move fluidly between asking and browsing."

---

### Slide 6 — The Shift (2:50–3:00)

**Visual:** Text morphs from "One page, many visitors" → "Many pages, each for one visitor." Below: the brand logo stays constant while page content adapts around it.

**Voiceover:**
"This is the shift. From one page that serves many visitors — to many pages, each composed for one visitor. The brand stays in control. The AI works within its boundaries. And for the first time, every visitor sees the best version of the page — for them."

---

## Appendix C: Key Technical References (Codebase)

For implementers and technical audiences, the following files in the Vitamix POC codebase contain the core logic described in this document:

| Component | File | Key Function |
|-----------|------|-------------|
| Page orchestration & SSE rendering | `scripts/scripts.js` | `renderVitamixRecommenderPage()` |
| Session context management | `scripts/session-context.js` | `SessionContextManager` class |
| Intent classification | `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts` | `classifyIntent()` |
| Deep reasoning & block selection | `workers/vitamix-gensite-recommender/src/ai-clients/reasoning-engine.ts` | System prompt + block selection logic |
| Content generation & streaming | `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts` | Block generation loop |
| Implicit signal capture | `extension/content-script.js` | Page view, click, scroll tracking |
| Signal aggregation & profile | `extension/background.js` | Profile engine, context packaging |
| Signal interpretation | `workers/vitamix-gensite-recommender/src/lib/signal-interpreter.ts` | `SignalInterpretation` interface |
| Page persistence to DA | `workers/vitamix-gensite-recommender/src/lib/da-client.ts` | Persist to AEM Document Authoring |
| Analytics & tracking | `workers/vitamix-gensite-analytics/src/index.ts` | Event tracking, multi-agent analysis |
| CTA sanitization | `scripts/cta-utils.js` | Purchase-intent language normalization |

### AI Model Configuration

| Stage | Model | Optimized For |
|-------|-------|---------------|
| Intent classification | Cerebras (8B) | Speed, cost |
| Deep reasoning | Claude Opus | Judgment, nuance |
| Content generation | Cerebras (70B) | Throughput, streaming |
| Multi-agent analysis | OpenAI + Gemini | Consensus validation |

### Infrastructure

| Service | Platform | Purpose |
|---------|----------|---------|
| AI pipeline | Cloudflare Workers | Edge execution, SSE streaming |
| Context storage | Cloudflare KV | Session & signal persistence |
| Image storage | Cloudflare R2 | Generated hero images |
| Content management | AEM Edge Delivery Services | Block authoring, page hosting |
| Page persistence | Adobe Document Authoring (DA) | Permanent URL generation |
