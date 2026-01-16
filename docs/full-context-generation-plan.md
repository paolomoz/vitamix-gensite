# Full Context Generation Plan

## Overview

Refactor the browser extension and worker to support a unified "full context" generation flow that sends all available context (signals, query, conversation history) to the worker for page generation.

---

## Goals

1. **Single unified flow** - One "Generate Page" button that sends everything available
2. **Retain backward compatibility** - Keep `?q=` flow working at worker level
3. **Solve URL length limits** - Use POST + KV storage for context
4. **Remove synthetic query** - Let the LLM reason on raw signals instead of lossy phrase mappings
5. **Support conversation** - Include previous queries for conversational continuity

---

## Context Package

The extension sends a full context package to the worker:

```javascript
{
  // Captured browsing behavior (from content script)
  signals: [
    {
      id: "page_view_1705420800000_a1b2c",
      type: "page_view",
      category: "product",
      label: "Product Page View",
      weight: 0.10,
      timestamp: 1705420800000,
      data: { url, path, title, h1, ... },
      product: "A3500"
    },
    // ...
  ],

  // Current user query (optional - from text input)
  query: "Which one is better for baby food?",

  // Previous queries in session (for conversation continuity)
  previousQueries: [
    "What's the best blender for smoothies?",
    "How does the A3500 compare to E310?"
  ],

  // Inferred profile (derived from signals via rules)
  profile: {
    segments: ["new_parent", "comparison_shopper"],
    use_cases: ["baby_food"],
    products_considered: ["A3500", "E310"],
    confidence_score: 0.62,
    // ...
  }
}
```

---

## Worker Flows

### Flow 1: Query Only (existing - unchanged)

```
GET /?q=best+blender+for+smoothies&preset=all-cerebras
```

- Worker parses query from URL
- Generates page based on query alone
- **No changes needed** - keep working as-is

### Flow 2: Full Context (new)

```
POST /store-context
Body: { signals, query, previousQueries, profile }
Response: { id: "ctx_abc123" }

GET /?ctx=ctx_abc123&preset=all-cerebras
```

- Extension POSTs full context to worker
- Worker stores in Cloudflare KV with UUID
- Worker returns short ID
- Extension navigates to URL with context ID
- Worker fetches context from KV
- Worker generates page using full context

---

## Panel UI Changes

### Before (current)
```
┌─────────────────────────────────────────────────────────────────┐
│ Signal Feed                                                      │
├─────────────────────────────────────────────────────────────────┤
│ Profile                                                          │
├─────────────────────────────────────────────────────────────────┤
│ Synthetic Query  ← REMOVE                                        │
│ "I want to make baby food..."                                    │
│ [Generate Page]                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Custom Query                                                     │
│ [________________] [Execute]                                     │
├─────────────────────────────────────────────────────────────────┤
│ Example Scenarios                                                │
└─────────────────────────────────────────────────────────────────┘
```

### After (new)
```
┌─────────────────────────────────────────────────────────────────┐
│ 🎯 Intent Demo                         [Clear Session] [⚙️]     │
├─────────────────────────────────────────────────────────────────┤
│ Signal Feed                                        [12 signals] │
├─────────────────────────────────────────────────────────────────┤
│ Profile                                       Confidence: 62%   │
├─────────────────────────────────────────────────────────────────┤
│ Conversation History  ← NEW                       [2 queries]   │
│ • "What's the best blender for smoothies?"                      │
│ • "How does the A3500 compare to E310?"                         │
├─────────────────────────────────────────────────────────────────┤
│ Query (optional)  ← RENAMED                                     │
│ [Which one is better for baby food?_______________]             │
├─────────────────────────────────────────────────────────────────┤
│ [          Generate Page                                    ▶]  │
│ Context: 12 signals • 2 previous queries • 1 new query          │
├─────────────────────────────────────────────────────────────────┤
│ Example Scenarios  ← KEEP                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Clear Session

The "Clear Session" button clears:
- Signals array
- Profile (reset to default)
- Previous queries (conversation history)
- Chrome storage (local)

---

## File Changes

### Extension

| File | Action | Changes |
|------|--------|---------|
| `background.js` | Modify | Remove synthetic query, add context storage, add previousQueries tracking, update clear to clear session |
| `panel/panel.js` | Modify | Remove synthetic query section, add conversation history section, rename query section, single generate button, context summary |
| `panel/panel.html` | Modify | Update markup for new sections |
| `panel/panel.css` | Modify | Styles for new sections |
| `lib/query-generator.js` | Delete | No longer needed |
| `lib/examples.js` | Keep | Unchanged |

### Worker

| File | Action | Changes |
|------|--------|---------|
| `workers/vitamix-recommender/index.js` | Modify | Add POST /store-context endpoint, add ?ctx= handling, update prompt for full context |
| `workers/vitamix-recommender/wrangler.toml` | Modify | Add KV namespace binding |

---

## Implementation Order

### Phase 1: Extension Changes
1. [ ] Update `background.js` - remove synthetic query, add previousQueries tracking
2. [ ] Update `panel/panel.html` - new markup structure
3. [ ] Update `panel/panel.css` - styles for new sections
4. [ ] Update `panel/panel.js` - new UI logic, context summary
5. [ ] Delete `lib/query-generator.js`
6. [ ] Test extension locally (signals capture, UI)

### Phase 2: Worker Changes
7. [ ] Add KV namespace to `wrangler.toml`
8. [ ] Create KV namespace in Cloudflare dashboard
9. [ ] Add POST `/store-context` endpoint
10. [ ] Add `?ctx=` parameter handling
11. [ ] Update generation prompt for full context mode
12. [ ] Deploy worker

### Phase 3: Integration
13. [ ] Update extension to call worker `/store-context`
14. [ ] Test full flow end-to-end
15. [ ] Test example scenarios
16. [ ] Test conversation history
17. [ ] Verify `?q=` flow still works

---

## KV Storage Schema

```javascript
// Key format
`ctx_${uuid}`

// Value (JSON stringified)
{
  signals: [...],
  query: "...",
  previousQueries: [...],
  profile: {...},
  createdAt: 1705420800000
}

// TTL: 1 hour (contexts are ephemeral)
```

---

## Worker Prompt Update

The worker prompt needs to handle the full context:

```
You are generating a personalized page for a Vitamix customer.

## Available Context

### User Query (if provided)
{query}

### Conversation History (if any)
{previousQueries}

### Browsing Signals
The user has been browsing vitamix.com. Here are their captured signals:
{signals formatted as readable list}

### Inferred Profile
Based on their behavior, we've inferred:
- Segments: {segments}
- Use cases: {use_cases}
- Products considered: {products}
- Confidence: {confidence}%

## Instructions
- If a query is provided, answer it directly while using signals/profile as context
- If no query, infer the user's intent from signals and generate a relevant page
- Consider conversation history for continuity
- Personalize content based on inferred segments and use cases
```

---

## Rollback Plan

If issues arise:
1. Worker `?q=` flow remains unchanged - always works
2. Extension can be reverted to previous commit
3. KV storage is isolated - doesn't affect existing functionality
