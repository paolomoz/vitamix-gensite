# Cerebras Capacity Reservation - 2026 Estimate

## Executive Summary

We need Cerebras inference capacity to power AI-generated content across **100 demo sites** and **10 production sites**. Each page generation triggers 7 Cerebras API calls across 3 models. At production peak (10 sites, 5,000 PV/min each, 10% generative), we need up to **~7,350 RPM** and **~26.4M tokens/min**. With prompt prefix caching, uncached demand drops to **~12.2M tokens/min**.

---

## 1. Models of Interest

| Model | Current Role | Notes |
|-------|-------------|-------|
| **gpt-oss-120b** | Reasoning (block selection, intent analysis, journey planning) | Heaviest per-call token usage (~13.5K tokens/call). 1 call/page. |
| **llama-3.3-70b** | Content generation (HTML blocks, hero, follow-up suggestions) | Most frequent: 5 calls/page. ~2,240 tokens/call avg. |
| **llama-3.1-8b** | Classification (intent type, entities, journey stage) | Lightest: 1 call/page. ~430 tokens/call. |
| **zai-glm-4.7** | Under evaluation | Not yet implemented. Potential replacement for reasoning or content roles. Capacity TBD based on benchmarking. |

**Primary models for capacity reservation: `gpt-oss-120b` and `llama-3.3-70b`** (together represent >99% of token volume).

---

## 2. Per-Page Generation Resource Profile

Using the **all-cerebras** preset (Cerebras for all AI roles):

### Token Breakdown by Call

| # | Role | Model | Input Tokens | Output Tokens | Total |
|---|------|-------|-------------|---------------|-------|
| 1 | Classification | llama-3.1-8b | 350 | 80 | 430 |
| 2 | Reasoning | gpt-oss-120b | 11,500 | 2,000 | 13,500 |
| 3 | Hero content | llama-3.3-70b | 1,500 | 500 | 2,000 |
| 4 | Content block 1 | llama-3.3-70b | 1,800 | 600 | 2,400 |
| 5 | Content block 2 | llama-3.3-70b | 1,800 | 600 | 2,400 |
| 6 | Content block 3 | llama-3.3-70b | 1,500 | 500 | 2,000 |
| 7 | Suggestion enhancement | llama-3.3-70b | 1,800 | 600 | 2,400 |
| | **TOTAL** | | **20,250** | **4,880** | **25,130** |

- **Requests per page: 7**
- **Avg tokens per page: ~25,000**
- Typical page has 5-6 blocks; hero + 3 LLM-generated blocks + follow-up (template) + enhancement
- Some block types (allergen-safety, follow-up-advisor) bypass LLM entirely

### Per-Model Summary (per page generation)

| Model | Requests | Input Tokens | Output Tokens | Total Tokens |
|-------|----------|-------------|---------------|--------------|
| gpt-oss-120b | 1 | 11,500 | 2,000 | 13,500 |
| llama-3.3-70b | 5 | 8,400 | 2,800 | 11,200 |
| llama-3.1-8b | 1 | 350 | 80 | 430 |

### What Drives Token Count

The **reasoning call** (gpt-oss-120b) dominates input tokens because it includes:
- System prompt with 28 block types, 17 special handling rules, and output schema (~8,000 tokens)
- Full product catalog of 35 products (~1,750 tokens)
- User context, session history, persona analysis (~1,750 tokens)

Content generation calls are smaller (~1,500-1,800 input each) because they receive:
- Block-specific HTML template (~400 tokens)
- Filtered RAG context (products/recipes/FAQs relevant to that block) (~800 tokens)
- Generation rules and instructions (~300 tokens)

---

## 3. Capacity Requirements

### Scenario A: 100 Demo Sites

| Parameter | Value |
|-----------|-------|
| Sites | 100 |
| Page views per site | 500-2,000 over 1-3 weeks |
| Generative PVs per site | 50-200 (10% of total) |
| Total generations | ~12,500 |
| Duration | 3 weeks |
| Sustained rate | ~1.2 gen/min (business hours) |
| **Peak rate** | **~5 gen/min** |

**Demo Peak Capacity Needs:**

| Model | RPM | Tokens/Min |
|-------|-----|------------|
| gpt-oss-120b | 5 | 67,500 |
| llama-3.3-70b | 25 | 56,000 |
| llama-3.1-8b | 5 | 2,150 |
| **Total** | **35** | **~126K** |

Demo sites are negligible relative to production.

### Scenario B: 10 Production Sites

| Parameter | Value |
|-----------|-------|
| Sites | 10 |
| Page views per site per month | 1,000,000 |
| Generative PVs per site per month | 100,000 (10%) |
| Peak PV/min per site | 5,000 |
| Generative peak per site | 500 gen/min |

#### Sustained Rate (business hours)

Each site: 100K gen/month = ~5.8 gen/min (16h/day, 22 business days)
10 sites: **~58 gen/min**

| Model | RPM | Tokens/Min |
|-------|-----|------------|
| gpt-oss-120b | 58 | 783,000 |
| llama-3.3-70b | 290 | 649,600 |
| llama-3.1-8b | 58 | 24,940 |
| **Total** | **406** | **~1.46M** |

#### Peak Rate (2-3 sites peaking simultaneously + others at baseline)

Assumption: 2 sites at 500 gen/min + 8 sites at 5.8 gen/min = **~1,050 gen/min**

| Model | RPM | Tokens/Min |
|-------|-----|------------|
| gpt-oss-120b | 1,050 | 14,175,000 |
| llama-3.3-70b | 5,250 | 11,760,000 |
| llama-3.1-8b | 1,050 | 451,500 |
| **Total** | **7,350** | **~26.4M** |

#### Worst Case (all 10 sites at peak simultaneously)

| Model | RPM | Tokens/Min |
|-------|-----|------------|
| gpt-oss-120b | 5,000 | 67,500,000 |
| llama-3.3-70b | 25,000 | 56,000,000 |
| llama-3.1-8b | 5,000 | 2,150,000 |
| **Total** | **35,000** | **~126M** |

### Combined Summary (Demo + Production)

| Scenario | Generations/Min | Requests/Min | Total Tokens/Min |
|----------|----------------|-------------|-----------------|
| Demo peak | 5 | 35 | 126K |
| Prod sustained | 58 | 406 | 1.46M |
| **Prod peak (realistic)** | **1,050** | **7,350** | **26.4M** |
| Prod peak (worst case) | 5,000 | 35,000 | 126M |

---

## 4. Cacheability Analysis

### Prompt Prefix Caching (per request)

The following content is **identical across all requests** and cacheable via prompt prefix:

| Component | Tokens | Applies To |
|-----------|--------|-----------|
| Reasoning system prompt (rules, block types, output schema) | ~8,000 | gpt-oss-120b reasoning |
| Product catalog | ~1,750 | gpt-oss-120b reasoning |
| Classification prompt | ~250 | llama-3.1-8b classification |
| Block HTML templates (per block type) | ~400-600 | llama-3.3-70b content (×5) |
| Enhancement system message | ~20 | llama-3.3-70b enhancement |

**Per-model cacheability:**

| Model | Cacheable Input | Total Input | Cache Rate |
|-------|----------------|-------------|------------|
| gpt-oss-120b | ~9,750 | 11,500 | **85%** |
| llama-3.3-70b (per call avg) | ~500 | 1,680 | **30%** |
| llama-3.3-70b (5 calls total) | ~2,500 | 8,400 | **30%** |
| llama-3.1-8b | ~250 | 350 | **71%** |
| **Overall per page** | **~12,500** | **20,250** | **62%** |

### With Prompt Caching Applied

| Scenario | Total Tokens/Min | Uncached Tokens/Min | Savings |
|----------|-----------------|--------------------:|--------:|
| Prod sustained | 1.46M | ~568K | 61% |
| **Prod peak (realistic)** | **26.4M** | **~10.3M** | **61%** |
| Prod peak (worst case) | 126M | ~49M | 61% |

### Query-Level Response Caching (not yet implemented, potential optimization)

If we add query-level deduplication/caching:
- Popular queries ("best Vitamix for smoothies", "Vitamix A3500 vs X5") would hit cache
- Estimated **20-40%** of production queries are repeat/similar
- Could reduce generation RPM and token consumption by an additional **20-40%**

### Cacheability by Phase

| Phase | Prompt Prefix Cache | Query Response Cache | Net Uncached Rate |
|-------|--------------------:|--------------------:|-----------------:|
| Experimentation (demos) | 62% | 10-20% | ~30-35% of total |
| Production | 62% | 20-40% | ~23-30% of total |

---

## 5. Recommended Capacity Request

Based on realistic peak (2-3 sites peaking simultaneously), with prompt caching:

### Primary Request

| Metric | Value |
|--------|-------|
| **Models** | gpt-oss-120b, llama-3.3-70b, (llama-3.1-8b), zai-glm-4.7 (evaluation) |
| **Uncached Tokens/Min** | **~10M** (realistic peak) / **~49M** (worst case) |
| **Requests/Min** | **~7,350** (realistic peak) / **~35,000** (worst case) |
| **Prompt Prefix Cacheability** | **62%** of input tokens are identical across requests |
| **Query Response Cacheability** | **20-40%** in production (not yet implemented) |

### Per-Model Breakdown (realistic peak, before caching)

| Model | RPM | Input TPM | Output TPM | Cacheable Input |
|-------|-----|-----------|-----------|----------------|
| gpt-oss-120b | 1,050 | 12.1M | 2.1M | 85% |
| llama-3.3-70b | 5,250 | 8.8M | 2.9M | 30% |
| llama-3.1-8b | 1,050 | 368K | 84K | 71% |
| **Total** | **7,350** | **21.3M** | **5.1M** | **62% avg** |

### Monthly Token Volume (production steady-state)

| Model | Monthly Requests | Monthly Tokens |
|-------|-----------------|---------------|
| gpt-oss-120b | ~1M | ~13.5B |
| llama-3.3-70b | ~5M | ~11.2B |
| llama-3.1-8b | ~1M | ~0.43B |
| **Total** | **~7M** | **~25.1B** |

*(Based on 10 sites × 100K generations/month × 7 requests/generation)*

---

## 6. zai-glm-4.7 Evaluation Note

`zai-glm-4.7` is not yet implemented in the codebase. Capacity requirements for this model depend on which role it would fill:

| If replacing | Estimated impact |
|-------------|-----------------|
| gpt-oss-120b (reasoning) | ~13,500 tokens/call, 1 call/page. Would need same ~1,050 RPM at peak. |
| llama-3.3-70b (content) | ~2,240 tokens/call avg, 5 calls/page. Would need same ~5,250 RPM at peak. |
| Both | Would become the sole model. 7 calls/page, ~25K tokens/page, ~7,350 RPM at peak. |

We recommend reserving evaluation capacity for zai-glm-4.7 equivalent to the role it would replace, plus 20% headroom for A/B testing alongside existing models.

---

## 7. Optimization Opportunities (to reduce capacity needs)

1. **Query deduplication** - Cache generated pages by normalized query. Could reduce generation volume by 20-40% in production.
2. **Tiered generation** - Use llama-3.1-8b for simple intent routing, skip full reasoning for quick-answer queries (~15% of traffic).
3. **Block-level caching** - Cache individual block outputs (e.g., product-cards for same products). Reuse across queries.
4. **Rate limiting** - Cap generation requests per user session (e.g., 10/min) to prevent abuse during peak traffic.
5. **Reasoning prompt compression** - The 8K-token reasoning system prompt could be condensed by ~30% without quality loss.

---

## References

- Model factory: `workers/vitamix-gensite-recommender/src/ai-clients/model-factory.ts`
- Orchestrator: `workers/vitamix-gensite-recommender/src/lib/orchestrator.ts`
- Reasoning engine: `workers/vitamix-gensite-recommender/src/ai-clients/reasoning-engine.ts`
- Cost analysis: `docs/page-generation-cost-analysis.md`
