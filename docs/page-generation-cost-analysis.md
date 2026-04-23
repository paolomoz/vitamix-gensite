# Page Generation Cost Analysis

Cost analysis for AI-powered page generation in the vitamix-recommender worker, comparing presets and identifying optimization opportunities.

## Model Presets

The recommender worker supports multiple presets defined in `workers/vitamix-gensite-recommender/src/ai-clients/model-factory.ts`:

### Production Preset (Default)

| Role | Provider | Model | Max Tokens |
|------|----------|-------|------------|
| Reasoning | Anthropic | Claude Opus 4.5 | 4,096 |
| Content | Cerebras | GPT-OSS-120B | 4,096 |
| Classification | Cerebras | GPT-OSS-120B | 500 |
| Validation | Cerebras | GPT-OSS-120B | 300 |

### All-Cerebras Preset (Cost-Optimized)

| Role | Provider | Model | Max Tokens |
|------|----------|-------|------------|
| Reasoning | Cerebras | GPT-OSS-120B | 4,096 |
| Content | Cerebras | Llama 3.3-70B | 1,024 |
| Classification | Cerebras | Llama 3.1-8B | 200 |
| Validation | Cerebras | Llama 3.1-8B | 150 |

---

## API Pricing (January 2026)

| Provider | Model | Input ($/1M) | Output ($/1M) |
|----------|-------|--------------|---------------|
| Anthropic | Claude Opus 4.5 | $5.00 | $25.00 |
| Cerebras | GPT-OSS-120B | $0.25 | $0.69 |
| Cerebras | Llama 3.3-70B | ~$0.20 | ~$0.60 |
| Cerebras | Llama 3.1-8B | ~$0.10 | ~$0.10 |

---

## API Call Flow Per Page

Standard orchestration flow in `orchestrator.ts`:

| Step | Role | Purpose |
|------|------|---------|
| 1 | Classification | Intent classification (discovery/comparison/support) |
| 2 | Reasoning | Deep analysis, block selection, product matching |
| 3 | Content | Hero block generation (parallel with reasoning) |
| 4-8 | Content | 4-5 additional content blocks |
| 9 | Content | Follow-up suggestions |

---

## Token Estimates Per Page

| Call Type | Input Tokens | Output Tokens |
|-----------|--------------|---------------|
| Classification | ~200 | ~100 |
| Reasoning | ~3,000 | ~1,200 |
| Content (×5 blocks) | ~900 each | ~350 each |
| Enhancements | ~800 | ~300 |
| **Total** | **~8,500** | **~3,400** |

---

## Cost Comparison

### Production Preset: ~$0.055/page

| Component | Model | Input Cost | Output Cost | Subtotal |
|-----------|-------|------------|-------------|----------|
| Classification | GPT-OSS-120B | $0.00005 | $0.00007 | $0.00012 |
| Reasoning | Opus 4.5 | $0.01500 | $0.03750 | **$0.05250** |
| Content (×5) | GPT-OSS-120B | $0.00113 | $0.00138 | $0.00251 |
| Enhancements | GPT-OSS-120B | $0.00020 | $0.00021 | $0.00041 |

**Key insight:** Claude Opus 4.5 reasoning accounts for **95%** of production costs.

### All-Cerebras Preset: ~$0.004/page

| Component | Model | Input Cost | Output Cost | Subtotal |
|-----------|-------|------------|-------------|----------|
| Classification | Llama 3.1-8B | $0.00002 | $0.00001 | $0.00003 |
| Reasoning | GPT-OSS-120B | $0.00075 | $0.00083 | $0.00158 |
| Content (×5) | Llama 3.3-70B | $0.00090 | $0.00105 | $0.00195 |
| Enhancements | Llama 3.3-70B | $0.00016 | $0.00015 | $0.00031 |

### Volume Projections

| Preset | Cost/Page | 1K Pages | 10K Pages | 100K Pages |
|--------|-----------|----------|-----------|------------|
| Production | $0.055 | $55 | $550 | $5,500 |
| All-Cerebras | $0.004 | $4 | $40 | $400 |

**All-Cerebras is 14× cheaper than Production.**

---

## Prompt Caching Analysis

### Cerebras Caching Behavior

Cerebras implements automatic implicit caching:

| Feature | Behavior |
|---------|----------|
| Activation | Automatic on all requests |
| TTL | 5 minutes guaranteed, up to 1 hour |
| Storage | DRAM (fast, ephemeral) |
| Pricing | No discount (unlike Anthropic's 90% off) |

### Cacheable Content

| Component | Tokens | Cacheable? |
|-----------|--------|------------|
| System prompt | ~3,200 | Yes |
| Product catalog | ~2,000 | Yes (if ordered first) |
| Block definitions | ~400 | Yes |
| **Total cacheable** | **~5,600** | **~65% of input** |

### Caching Optimization

Current prompt structure in `buildReasoningPrompt()` places dynamic content before static:

```
User Query (dynamic) → Intent (dynamic) → Product Catalog (static)
```

**Recommendation:** Reorder to maximize cache prefix:

```
Product Catalog (static) → User Query (dynamic) → Intent (dynamic)
```

### Caching Value for All-Cerebras

| Aspect | Impact |
|--------|--------|
| Cost savings | None (Cerebras doesn't discount cached tokens) |
| Latency improvement | 30-40% faster time-to-first-token |
| Implementation | Automatic, zero code changes |

---

## Output Token Reduction Strategies

Output tokens represent **47%** of all-cerebras costs. Key reduction strategies:

### 1. Slim Reasoning Schema (High Impact)

Current reasoning output at ~1,200 tokens includes fields not rendered to users:

| Field | Current Size | Action | Savings |
|-------|-------------|--------|---------|
| `blockSelectionRationale[]` | ~150 tokens | Remove | 150 |
| `alternativesConsidered[]` | ~50 tokens | Remove | 50 |
| `advisorFollowUp.whyBullets` | ~100 tokens | Remove | 100 |
| `advisorFollowUp.gaps` | ~150 tokens | Limit to 1 | 100 |
| `confidence.productMatchRationale` | ~30 tokens | Remove | 30 |

**Potential savings: ~460 tokens (38% of reasoning output)**

Proposed minimal schema:

```json
{
  "blocks": [{"type": "hero", "variant": "discovery", "guidance": "..."}],
  "products": [{"id": "x5", "primary": true}],
  "reasoning": {"intent": "...", "plan": "..."},
  "journey": {"stage": "exploring", "followUps": ["...", "..."]},
  "confidence": {"intent": 0.92, "product": 0.45}
}
```

### 2. Reduce Content Block Output (Medium Impact)

Options:
- **Abbreviated HTML:** Use short class names, expand server-side
- **Structured data:** Return JSON, render HTML client-side (60-70% reduction)
- **Trim template examples:** Shorter prompts encourage terser output

**Potential savings: 500-1,000 tokens across 5 blocks**

### 3. Lower maxTokens Limits (Easy Win)

| Role | Current Max | Typical Actual | Proposed Max |
|------|-------------|----------------|--------------|
| Reasoning | 4,096 | ~1,200 | 2,048 |
| Content | 1,024 | ~350 | 512 |
| Classification | 200 | ~80 | 128 |
| Validation | 150 | ~50 | 100 |

### 4. Eliminate Redundant Calls (Medium Impact)

- **Merge Classification + Reasoning:** Saves ~80 output tokens + 1 roundtrip
- **Skip Enhancement for high-confidence queries:** Saves ~250 tokens

### 5. Use Smaller Models (High Impact)

| Role | Current | Alternative | Savings |
|------|---------|-------------|---------|
| Content | Llama 70B ($0.60/M) | Llama 8B ($0.10/M) | 83% on content output |

Aggressive preset for testing:

```typescript
'all-cerebras-aggressive': {
  reasoning: { model: 'llama-3.3-70b', maxTokens: 2048 },
  content: { model: 'llama-3.1-8b', maxTokens: 512 },
  classification: { model: 'llama-3.1-8b', maxTokens: 128 },
  validation: { model: 'llama-3.1-8b', maxTokens: 100 },
}
```

---

## Projected Optimized Costs

### All-Cerebras with Optimizations

| Strategy | Token Reduction | Cost Impact | Effort |
|----------|-----------------|-------------|--------|
| Slim reasoning schema | 460 tokens | ~15% | Medium |
| Structured content output | 700 tokens | ~20% | High |
| Lower maxTokens | Minor | ~5% | Low |
| Merge classification | 80 tokens | ~3% | Medium |
| 8B for content | — | ~40% output | Low |

**Combined projection:**

| Metric | Current | Optimized | Change |
|--------|---------|-----------|--------|
| Output tokens | ~3,080 | ~1,800 | -42% |
| Output cost | $0.00185 | $0.00090 | -51% |
| **Total cost** | **$0.0039** | **$0.0029** | **-26%** |

---

## Recommendations

### Implementation Priority

1. **Slim reasoning schema** — Biggest impact, minimal risk
2. **Lower maxTokens** — Zero effort, encourages concise output
3. **A/B test 8B for simple blocks** — Validate quality vs cost
4. **Merge classification into reasoning** — Reduces latency + cost
5. **Structured content output** — Most effort, best for scale

### When to Use Each Preset

| Use Case | Preset | Rationale |
|----------|--------|-----------|
| Customer-facing production | Production | Opus reasoning quality worth 14× premium |
| Internal testing/preview | All-Cerebras | Cost-effective iteration |
| High-volume batch generation | All-Cerebras + optimizations | Minimize costs at scale |
| Quality-critical pages | Production | Best block selection accuracy |

---

## References

- [Anthropic Claude Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Cerebras Pricing](https://www.cerebras.ai/pricing)
- [Cerebras Prompt Caching](https://inference-docs.cerebras.ai/capabilities/prompt-caching)
- Model factory: `workers/vitamix-gensite-recommender/src/ai-clients/model-factory.ts`
- Orchestrator: `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts`
- Reasoning engine: `workers/vitamix-gensite-recommender/src/ai-clients/reasoning-engine.ts`
