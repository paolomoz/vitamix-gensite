/**
 * SSE Prefetch Module
 *
 * Pre-warms the recommender SSE connection on hover so that by the time
 * the user clicks, the hero block (and possibly more) are already buffered.
 *
 * Flow:
 * 1. On hover over a ?q= link or the query-form submit button, start the SSE request
 * 2. Buffer all incoming events in memory
 * 3. On click, use history.pushState (no full navigation) and render in-place
 * 4. Replay buffered events immediately, continue streaming new ones
 */

import { SessionContextManager } from './session-context.js';

const VITAMIX_RECOMMENDER_URL = 'https://vitamix-gensite-recommender.paolo-moz.workers.dev';
const HOVER_DEBOUNCE_MS = 150;

let activePrefetch = null;

/**
 * Generate a URL-safe slug from a query (mirrors scripts.js logic)
 */
function generateSlug(query) {
  const slug = query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);

  let hash = 0;
  const str = query + Date.now();
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = ((hash << 5) - hash) + char;
    // eslint-disable-next-line no-bitwise
    hash &= hash;
  }
  const hashStr = Math.abs(hash).toString(36).slice(0, 6);
  return `${slug}-${hashStr}`;
}

/**
 * Build the SSE stream URL for a query
 */
function buildStreamUrl(query, slug, preset) {
  const contextParam = SessionContextManager.buildEncodedContextParam();
  return `${VITAMIX_RECOMMENDER_URL}/generate?q=${encodeURIComponent(query)}&slug=${encodeURIComponent(slug)}&preset=${encodeURIComponent(preset)}&ctx=${contextParam}`;
}

/**
 * Cancel the active prefetch
 */
function cancelPrefetch() {
  if (activePrefetch) {
    activePrefetch.eventSource.close();
    // eslint-disable-next-line no-console
    console.log(`[Prefetch] Cancelled for: "${activePrefetch.query}"`);
    activePrefetch = null;
  }
}

/**
 * Start prefetching SSE events for a query.
 * Returns a prefetch handle that can be consumed by the renderer.
 */
function startPrefetch(query, preset = 'production') {
  // Cancel any existing prefetch for a different query
  if (activePrefetch && activePrefetch.query !== query) {
    cancelPrefetch();
  }

  // Don't re-prefetch if already running for same query
  if (activePrefetch && activePrefetch.query === query) {
    return activePrefetch;
  }

  const slug = generateSlug(query);
  const streamUrl = buildStreamUrl(query, slug, preset);
  const eventSource = new EventSource(streamUrl);
  const bufferedEvents = [];
  let status = 'streaming';

  // All SSE event types we care about
  const eventTypes = [
    'generation-start',
    'reasoning-start',
    'reasoning-step',
    'reasoning-complete',
    'block-start',
    'block-content',
    'block-rationale',
    'image-ready',
    'suggestion-enhancement',
    'generation-complete',
    'error',
  ];

  eventTypes.forEach((type) => {
    eventSource.addEventListener(type, (e) => {
      bufferedEvents.push({ type, data: e.data, timestamp: Date.now() });
    });
  });

  eventSource.onerror = () => {
    if (eventSource.readyState === EventSource.CLOSED) {
      status = 'closed';
    }
  };

  activePrefetch = {
    query,
    slug,
    preset,
    streamUrl,
    eventSource,
    bufferedEvents,
    get status() { return status; },
    startTime: Date.now(),
  };

  // eslint-disable-next-line no-console
  console.log(`[Prefetch] Started for: "${query}" (slug: ${slug})`);

  return activePrefetch;
}

/**
 * Consume the active prefetch — returns the handle and clears it.
 * The caller takes ownership of the EventSource and buffered events.
 */
function consumePrefetch(query) {
  if (activePrefetch && activePrefetch.query === query) {
    const prefetch = activePrefetch;
    activePrefetch = null;
    // eslint-disable-next-line no-console
    console.log(`[Prefetch] Consumed for: "${query}" — ${prefetch.bufferedEvents.length} buffered events, ${Date.now() - prefetch.startTime}ms head start`);
    return prefetch;
  }
  return null;
}

/**
 * Get preset from URL or default
 */
function getPresetFromUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.searchParams.get('preset') || 'production';
  } catch {
    return 'production';
  }
}

/**
 * Attach hover-to-prefetch behavior on a link element with ?q= param
 */
function attachLinkPrefetch(link) {
  if (link.dataset.prefetchAttached) return;
  link.dataset.prefetchAttached = 'true';

  let hoverTimer = null;

  link.addEventListener('mouseenter', () => {
    const url = new URL(link.href, window.location.origin);
    const query = url.searchParams.get('q');
    if (!query) return;

    const preset = getPresetFromUrl(link.href);
    hoverTimer = setTimeout(() => {
      startPrefetch(query, preset);
    }, HOVER_DEBOUNCE_MS);
  });

  link.addEventListener('mouseleave', () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    // Don't cancel prefetch on mouseleave — user might be moving to click
    // Cancel after a longer timeout if no click happens
    setTimeout(() => {
      if (activePrefetch && !activePrefetch.consumed) {
        cancelPrefetch();
      }
    }, 3000);
  });

  // Intercept click: SPA-style navigation instead of full page load
  link.addEventListener('click', (e) => {
    const url = new URL(link.href, window.location.origin);
    const query = url.searchParams.get('q');
    if (!query) return;

    e.preventDefault();

    // If no prefetch running, start one now
    const preset = getPresetFromUrl(link.href);
    if (!activePrefetch || activePrefetch.query !== query) {
      startPrefetch(query, preset);
    }

    // SPA navigation: pushState + render
    window.history.pushState({}, '', link.href);
    window.dispatchEvent(new CustomEvent('prefetch-navigate', {
      detail: { query, preset },
    }));
  });
}

/**
 * Attach hover-to-prefetch on a query form's submit button
 */
function attachFormPrefetch(form, getQuery, getPreset = () => 'production') {
  const submitBtn = form.querySelector('button[type="submit"]');
  if (!submitBtn || submitBtn.dataset.prefetchAttached) return;
  submitBtn.dataset.prefetchAttached = 'true';

  let hoverTimer = null;

  submitBtn.addEventListener('mouseenter', () => {
    const query = getQuery();
    if (!query) return;

    hoverTimer = setTimeout(() => {
      startPrefetch(query, getPreset());
    }, HOVER_DEBOUNCE_MS);
  });

  submitBtn.addEventListener('mouseleave', () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  });
}

export {
  startPrefetch,
  cancelPrefetch,
  consumePrefetch,
  attachLinkPrefetch,
  attachFormPrefetch,
  generateSlug,
};
