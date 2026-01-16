# Vitamix Intent Inference Demo Extension

A Chrome browser extension that captures real user behavior on vitamix.com, builds an intent profile in real-time, generates synthetic queries based on accumulated signals, and enables page generation on the POC site.

## Installation

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension` folder from this repository
5. The extension icon should appear in your toolbar

## Usage

### Basic Flow

1. **Navigate to vitamix.com** - The extension only captures signals on vitamix.com
2. **Open the side panel** - Click the extension icon to open the side panel
3. **Browse normally** - Signals are captured automatically as you:
   - View product pages
   - Search for products
   - View recipes
   - Click on reviews
   - Use the compare tool
   - And more...
4. **Watch the profile build** - As signals accumulate, the inferred profile updates in real-time
5. **Generate a page** - Once confidence reaches 45%+, a synthetic query is generated. Click "Generate Page" to navigate to the POC site with this query.

### Panel Sections

- **Live Signal Feed** - Real-time list of captured signals with weights and timestamps
- **Inferred Profile** - Shows segments, use cases, products considered, and other inferred attributes
- **Synthetic Query** - Auto-generated natural language query based on the profile
- **Custom Query** - Enter and execute your own custom queries
- **Example Scenarios** - Pre-configured examples from the demo tool (New Parent, Gift Giver, Kitchen Upgrader)

### Signal Types Captured

**Tier 1 (Essential):**
- Product page views
- Search queries
- Recipe page views
- Article page views
- Reviews "Load More" clicks
- Compare tool usage
- Return visits

**Tier 2 (Enhanced):**
- Scroll depth
- Time on page
- Video play/completion
- Review filters
- Referrer context

**Tier 3 (Advanced):**
- Image gallery interactions
- Spec tab opens
- "What's in the box" expansions
- Add to cart clicks
- Shipping/return policy views

## Development

### File Structure

```
extension/
├── manifest.json           # Extension configuration (V3)
├── background.js           # Service worker
├── content-script.js       # Injected on vitamix.com
├── panel/
│   ├── panel.html          # Side panel markup
│   ├── panel.js            # Panel UI logic
│   └── panel.css           # Dark theme styling
├── lib/
│   ├── signals.js          # Signal definitions & weights
│   ├── profile-engine.js   # Profile inference logic
│   ├── query-generator.js  # Synthetic query generation
│   └── examples.js         # Pre-configured example scenarios
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### Key Components

**Signals (`lib/signals.js`):**
- Defines all trackable signals with weights
- URL pattern matching for page detection
- Product/recipe extraction from URLs

**Profile Engine (`lib/profile-engine.js`):**
- Inference rules that map signal combinations to profile attributes
- Confidence scoring based on accumulated signals
- Session persistence via chrome.storage

**Query Generator (`lib/query-generator.js`):**
- Template-based query generation
- Adapts complexity based on confidence level
- Multiple templates for different user segments

### Testing

1. Load the extension in developer mode
2. Navigate to vitamix.com
3. Open the side panel
4. Browse products, recipes, use search
5. Verify signals appear in the feed
6. Verify profile updates as signals accumulate
7. Test example scenarios from the Examples section

## POC Integration

Generated pages are created on:
```
https://main--vitamix-gensite--paolomoz.aem.live/?q={query}&preset={preset}
```

Presets:
- `production` - Claude (quality)
- `all-cerebras` - Cerebras (speed)
