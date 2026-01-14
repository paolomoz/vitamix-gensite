# Video Integration Plan: Vitamix YouTube Content

## Overview

Integrate official Vitamix YouTube videos into generated pages, showing relevant video content based on user queries (e.g., recipe demos for smoothie queries, product tours for comparison queries).

---

## Research Findings

### Official Vitamix YouTube Channel
- **Channel:** [@vitamixcorporation](https://www.youtube.com/@vitamixcorporation)
- **Channel ID:** `UCmEreaE58Iyxx9WFNA-rlug`
- **Stats:** ~81K subscribers, 161 videos, 23M+ views
- **Content types:** Recipe demos, product features, how-to tutorials
- **Average video length:** ~2 minutes

### Vitamix Video Hosting Strategy
Vitamix uses a hybrid approach:
1. **Self-hosted MP4s** on AEM CDN (e.g., `main--vitamix--aemsites.aem.live/.../media_xxx.mp4`)
2. **YouTube channel** for broader reach

The vitamix.com website primarily embeds self-hosted videos, but YouTube offers easier embedding.

---

## Implementation Plan

### Step 1: Create Video Data Structure

**File:** `content/metadata/videos.json`

```json
{
  "videos": [
    {
      "id": "vid-001",
      "youtubeId": "YOUTUBE_VIDEO_ID",
      "title": "Video Title",
      "description": "Brief description of video content",
      "category": "recipe-demo | product-tour | how-to | comparison | testimonial",
      "products": ["ascent-x5", "ascent-a3500"],
      "useCases": ["smoothies", "soups", "frozen-desserts"],
      "duration": "3:45",
      "thumbnail": "https://img.youtube.com/vi/YOUTUBE_VIDEO_ID/maxresdefault.jpg",
      "sourceUrl": "https://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID"
    }
  ]
}
```

**Video categories to curate:**
- `recipe-demo` - Specific recipe walkthroughs (smoothies, soups, nut butters)
- `product-tour` - Product feature demonstrations (A3500, X5, E310)
- `how-to` - General usage tutorials (cleaning, programs, tips)
- `comparison` - Side-by-side product comparisons
- `testimonial` - Customer/chef video testimonials

### Step 2: Update Types

**File:** `workers/vitamix-recommender/src/types.ts`

```typescript
export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description?: string;
  category: 'recipe-demo' | 'product-tour' | 'how-to' | 'comparison' | 'testimonial';
  products?: string[];
  useCases?: string[];
  duration?: string;
  thumbnail?: string;
  sourceUrl: string;
}
```

### Step 3: Add Video Queries to Content Service

**File:** `workers/vitamix-recommender/src/content/content-service.ts`

```typescript
import videosData from '../../../../content/metadata/videos.json';

export function getAllVideos(): Video[] {
  return videos;
}

export function getVideosByProduct(productId: string): Video[] {
  return videos.filter(v => v.products?.includes(productId));
}

export function getVideosByUseCase(useCase: string): Video[] {
  return videos.filter(v => v.useCases?.includes(useCase));
}

export function getVideosByCategory(category: string): Video[] {
  return videos.filter(v => v.category === category);
}
```

### Step 4: Create Video Block

**File:** `blocks/video/video.js`

```javascript
/**
 * Video Block
 * Embeds YouTube videos with responsive iframe
 */
export default function decorate(block) {
  const rows = [...block.children];

  rows.forEach(row => {
    const cells = [...row.children];
    const youtubeId = cells[0]?.textContent?.trim();
    const title = cells[1]?.textContent?.trim() || 'Video';

    if (youtubeId) {
      row.innerHTML = `
        <div class="video-container">
          <iframe
            src="https://www.youtube.com/embed/${youtubeId}"
            title="${title}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        <p class="video-title">${title}</p>
      `;
      row.classList.add('video-wrapper');
    }
  });
}
```

**File:** `blocks/video/video.css`

```css
.video {
  padding: 40px 24px;
  max-width: 800px;
  margin: 0 auto;
}

.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  border-radius: 12px;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-title {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
  text-align: center;
}
```

### Step 5: Update Orchestrator

**File:** `workers/vitamix-recommender/src/lib/orchestrator.ts`

Add video block template:

```typescript
'video': `
## HTML Template (embed a relevant YouTube video):
Use the EXACT youtubeId from the video data provided.

<div>
  <div>YOUTUBE_VIDEO_ID</div>
  <div>Video Title</div>
</div>
<div>
  <div>ANOTHER_VIDEO_ID</div>
  <div>Another Video Title</div>
</div>`,
```

Add video context injection:

```typescript
} else if (['video'].includes(block.type)) {
  const allVideos = getAllVideos();
  // Select videos based on query context
  const relevantVideos = allVideos.filter(v =>
    ragContext.relevantProducts.some(p => v.products?.includes(p.id)) ||
    ragContext.relevantUseCases.some(uc => v.useCases?.includes(uc.id))
  ).slice(0, 2);
  dataContext = `\n\n## Available Videos (use these EXACT youtubeIds):\n${buildVideoContext(relevantVideos)}`;
}
```

Add helper function:

```typescript
function buildVideoContext(videos: Video[]): string {
  if (!videos.length) return 'No videos available.';
  return videos.map(v => `
- ${v.title}
  YouTube ID: ${v.youtubeId}
  Category: ${v.category}
  Duration: ${v.duration || 'Unknown'}
  URL: ${v.sourceUrl}
`).join('\n');
}
```

### Step 6: Add Video to Block Types

**File:** `workers/vitamix-recommender/src/types.ts`

```typescript
export type BlockType =
  | 'hero'
  | 'video'  // Add this
  // ... rest of types
```

---

## Video Curation Task

### Manual Steps Required

1. **Browse the Vitamix YouTube channel:**
   https://www.youtube.com/@vitamixcorporation/videos

2. **For each video, collect:**
   - YouTube video ID (from URL: `youtube.com/watch?v=VIDEO_ID`)
   - Title
   - Duration
   - Relevant products mentioned
   - Use case category (smoothies, soups, etc.)

3. **Recommended videos to curate (15-20 total):**
   - 3-4 product demos (A3500, X5, E310, Propel)
   - 4-5 recipe demos (smoothies, soups, nut butters, frozen desserts)
   - 2-3 how-to/tips videos (cleaning, programs)
   - 2-3 comparison videos
   - 2-3 chef/testimonial videos

4. **Populate `content/metadata/videos.json`** with collected data

### YouTube Thumbnail URLs

Thumbnails are auto-generated by YouTube:
- Max resolution: `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`
- High quality: `https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg`
- Medium: `https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg`

---

## Integration Points

### When to Show Videos

| Query Type | Video Category | Example |
|------------|---------------|---------|
| Recipe queries | `recipe-demo` | "smoothie recipes" → smoothie demo video |
| Product questions | `product-tour` | "tell me about A3500" → A3500 tour |
| Comparison queries | `comparison` | "X5 vs A3500" → comparison video |
| How-to questions | `how-to` | "how to clean" → cleaning tutorial |
| General discovery | `testimonial` | "why vitamix" → chef testimonial |

### Reasoning Engine Update

Update `reasoning-engine.ts` to consider video blocks when:
- User asks "show me" or "how do I"
- Query involves specific recipes or use cases
- Product comparison is requested
- User is in "exploring" journey stage

---

## Testing Checklist

- [ ] Video block renders correctly with YouTube embed
- [ ] Responsive design works on mobile
- [ ] Videos are contextually relevant to queries
- [ ] Fallback behavior when no relevant videos found
- [ ] YouTube thumbnail images load correctly
- [ ] Video plays without leaving the page

---

## Future Enhancements

1. **Video carousel block** - Show multiple videos in a scrollable row
2. **Lazy loading** - Only load iframe when scrolled into view
3. **Video chapter links** - Deep link to specific timestamps
4. **Self-hosted fallback** - Use Vitamix CDN videos as backup
5. **Analytics tracking** - Track video plays for optimization
