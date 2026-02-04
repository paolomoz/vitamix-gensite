Create a professional infographic following these specifications:

## Image Specifications

- **Type**: Infographic
- **Layout**: structural-breakdown
- **Style**: ikea-manual
- **Aspect Ratio**: 16:9 (landscape)
- **Language**: English

## Layout Guidelines (structural-breakdown)

Internal structure visualization showing the three-stage AI pipeline as an exploded system diagram.

- Central subject: the AI pipeline system
- Three stages shown as connected modules with callout labels
- Exploded/separated view showing how parts connect
- Labels with callout lines pointing to each component
- Input (visitor context) on the left, output (personalized page) on the right

## Style Guidelines (ikea-manual)

Minimal line art assembly instruction style.

- **Color Palette**: Black lines on white/cream background. Blue for data flow arrows, red for important callouts.
- **Visual Elements**: Simple line drawings, numbered components, arrow indicators showing data flow, exploded assembly view style, clean geometric shapes
- **Typography**: Minimal text, step numbers prominent, technical labels, simple sans-serif

---

Generate the infographic based on the content below:

# How It Works: The AI Pipeline

Structural breakdown showing the three-stage edge AI pipeline as an assembly diagram.

### Input (Left Side): Visitor Context
- Three signal types flowing in:
  - Explicit: search queries, filter selections, stated preferences
  - Implicit: browse behavior, click patterns, scroll depth
  - Session: pages visited, products viewed
- Visual: Three simple input arrows merging into the pipeline, each with a small icon (keyboard, eye, clock)
- Label: "VISITOR SIGNALS"

### Stage 1: CLASSIFY (Cerebras)
- Component number: ①
- Fast intent classification
- Outputs: intent type, journey stage, entities, confidence score
- Visual: A filter/funnel shape with input going in and structured data coming out. Simple geometric shape.
- Label: "① CLASSIFY — Intent Type, Journey Stage, Entities"
- Callout: "CEREBRAS — Speed Optimized"

### Stage 2: REASON (Claude)
- Component number: ②
- Deep reasoning — the AI content strategist
- Selects from 72 block types, picks products, generates content guidance
- Confidence thresholds: ≥70% = single recommendation, 50-70% = best pick + alternatives, <50% = comparison/discovery
- Visual: A brain/decision-tree shape with multiple outputs. Shows the 72-block library as a grid of small squares with some highlighted.
- Label: "② REASON — Block Selection, Product Match, Guidance"
- Callout: "CLAUDE — Judgment Optimized"

### Stage 3: GENERATE (Cerebras)
- Component number: ③
- Parallel content generation, SSE streaming
- Hero in <3s, below-fold blocks stream progressively
- Visual: Multiple parallel output arrows streaming into a page layout. Page assembling block-by-block.
- Label: "③ GENERATE — HTML, Images, Streaming SSE"
- Callout: "CEREBRAS — Throughput Optimized"

### Output (Right Side): Personalized Page
- Adapted copy, relevant images, smart comparisons
- Layout choices, new blocks, follow-up suggestions
- Visual: A complete webpage wireframe with blocks snapped into place, each block slightly different, with a checkmark
- Label: "PERSONALIZED OUTPUT"
- Performance callout: "LCP ≤ 2.5s above fold"

### The Block System (Bottom callout):
- 72 pre-designed block types across 6 categories
- Brand controls visual design, AI controls which blocks appear
- Visual: A simple grid showing block categories as labeled boxes: Product, Recipe, Support, Engagement, Specialized, Layout
- Label: "72 BLOCK TYPES — Brand-Safe by Design"

Text labels (in English):
- Title: "The AI Pipeline"
- Subtitle: "Three Stages at the Edge"
- Flow: "Signals → ① Classify → ② Reason → ③ Generate → Page"
- Stage labels: "CLASSIFY", "REASON", "GENERATE"
- Providers: "Cerebras", "Claude", "Cerebras"
- Block system: "72 Blocks × 6 Categories"
