# Privacy Policy for AEM Generative Websites Extension

**Last Updated:** January 2025

## Overview

AEM Generative Websites is a developer demo tool for intent inference and AI-powered content generation. This policy explains what data is collected and how it is used.

## Data Collection

### What We Collect

When you browse supported sites (vitamix.com, *.aem.live) with the extension active, it captures:

- **Page views** - URLs and page types visited
- **Click interactions** - Buttons and links clicked (e.g., "Add to Cart", "View Reviews")
- **Scroll depth** - How far down a page you scrolled
- **Time on page** - Duration spent on each page
- **Video engagement** - Play/pause/completion of embedded videos
- **Search queries** - Terms entered in site search

### What We DO NOT Collect

- Personal information (name, email, address)
- Login credentials or payment information
- Browsing activity on sites other than vitamix.com and *.aem.live
- Data from browser history or other tabs

## Data Storage

- All captured signals are stored **locally in your browser** using Chrome's storage API
- Data is stored per-session and can be cleared at any time via the extension panel
- No data is stored on external servers without explicit user action

## Data Transmission

Data is only transmitted when you explicitly click "Generate Page":

- Captured signals and inferred profile are sent to our Cloudflare Workers
- Workers use this context to generate personalized content via AI services (Anthropic Claude, Cerebras)
- Generated content is returned and displayed; your signals are not permanently stored on servers

## Third-Party Services

When generating content, the extension communicates with:

- **Cloudflare Workers** (vitamix-gensite-recommender.paolo-moz.workers.dev) - Content generation orchestration
- **Anthropic Claude** - AI reasoning and intent analysis
- **Cerebras** - Content generation

These services receive only the data necessary to generate your requested content.

## Permissions Explained

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Store captured signals and preferences locally |
| `tabs` | Detect active tab for signal capture |
| `activeTab` | Access current tab's URL and content |
| `webNavigation` | Track page navigation events |
| `sidePanel` | Display the intent inference panel |
| Host permissions | Capture signals only on vitamix.com and aem.live |

## Your Controls

- **Clear Session** - Wipe all captured signals instantly
- **Disable Extension** - Stop all signal capture
- **Uninstall** - Remove all local data

## Contact

For questions about this privacy policy, please contact the development team or open an issue at the project repository.

## Changes

We may update this policy as the extension evolves. Significant changes will be noted in the extension's changelog.
