/**
 * Content Script - Injected on vitamix.com
 * Captures DOM events and sends signals to background
 */

(function() {
  'use strict';

  console.log('[VitamixIntent] Content script loaded');

  // Track page load time
  const pageLoadTime = Date.now();
  let scrollDepthMax = 0;
  let lastScrollUpdate = 0;

  /**
   * Send signal to background
   */
  function sendSignal(type, data = {}) {
    chrome.runtime.sendMessage({
      type: 'SIGNAL',
      data: { type, data },
    }).catch(e => {
      // Background might not be ready yet
      console.log('[VitamixIntent] Could not send signal:', e.message);
    });
  }

  /**
   * Initialize signal capture
   */
  function init() {
    // Capture referrer on page load
    captureReferrer();

    // Set up event listeners
    setupSearchCapture();
    setupClickCapture();
    setupScrollCapture();
    setupVideoCapture();
    setupFormCapture();
    setupTimeOnPage();

    console.log('[VitamixIntent] Event listeners initialized');
  }

  /**
   * Capture referrer context
   */
  function captureReferrer() {
    const referrer = document.referrer;

    if (!referrer) {
      sendSignal('referrer_context', { referrer: 'direct' });
      return;
    }

    try {
      const refUrl = new URL(referrer);

      // Check if it's from a search engine
      const searchEngines = ['google', 'bing', 'duckduckgo', 'yahoo'];
      const isSearch = searchEngines.some(se => refUrl.hostname.includes(se));

      if (isSearch) {
        // Try to extract search query from referrer
        const params = new URLSearchParams(refUrl.search);
        const query = params.get('q') || params.get('query') || params.get('p');

        sendSignal('referrer_context', {
          referrer: referrer,
          type: 'search',
          searchEngine: refUrl.hostname,
          searchQuery: query,
        });
      } else if (refUrl.hostname !== window.location.hostname) {
        // External referrer
        sendSignal('referrer_context', {
          referrer: referrer,
          type: 'external',
          domain: refUrl.hostname,
        });
      }
    } catch (e) {
      console.log('[VitamixIntent] Error parsing referrer:', e);
    }
  }

  /**
   * Capture search form submissions
   */
  function setupSearchCapture() {
    // Look for search forms/inputs
    const searchSelectors = [
      'input[type="search"]',
      'input[name="q"]',
      'input[name="query"]',
      'input[name="search"]',
      'input[placeholder*="search" i]',
      '.search-input',
      '#search-input',
    ];

    function handleSearch(input) {
      const query = input.value.trim();
      if (query.length >= 2) {
        console.log('[VitamixIntent] Search query captured:', query);
        sendSignal('search_query', { query });
      }
    }

    // Monitor search inputs
    document.querySelectorAll(searchSelectors.join(', ')).forEach(input => {
      // Capture on enter key
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleSearch(e.target);
        }
      });

      // Capture on blur with debounce
      let blurTimeout;
      input.addEventListener('blur', (e) => {
        clearTimeout(blurTimeout);
        blurTimeout = setTimeout(() => handleSearch(e.target), 500);
      });
    });

    // Also capture form submissions
    document.querySelectorAll('form').forEach(form => {
      if (form.querySelector('input[type="search"], input[name*="search" i]')) {
        form.addEventListener('submit', (e) => {
          const input = form.querySelector('input[type="search"], input[name*="search" i], input[type="text"]');
          if (input) {
            handleSearch(input);
          }
        });
      }
    });
  }

  /**
   * Capture clicks on important elements
   */
  function setupClickCapture() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button, [role="button"]');
      if (!target) return;

      const text = target.textContent?.toLowerCase() || '';
      const href = target.href || '';
      const className = target.className || '';

      // Reviews "Load More" or "Show More"
      if (
        (text.includes('load more') || text.includes('show more') || text.includes('see all')) &&
        (text.includes('review') || className.includes('review') || target.closest('[class*="review"]'))
      ) {
        console.log('[VitamixIntent] Reviews load more clicked');
        sendSignal('reviews_load_more', { buttonText: text });
        return;
      }

      // Review filter
      if (target.closest('[class*="filter"]') && target.closest('[class*="review"]')) {
        console.log('[VitamixIntent] Review filter applied');
        sendSignal('review_filter_applied', { filter: text });
        return;
      }

      // Add to cart
      if (
        text.includes('add to cart') ||
        text.includes('add to bag') ||
        className.includes('add-to-cart')
      ) {
        console.log('[VitamixIntent] Add to cart clicked');
        sendSignal('add_to_cart', { product: getProductFromPage() });
        return;
      }

      // Spec/Details tabs
      if (
        text.includes('specification') ||
        text.includes('tech specs') ||
        text.includes('details')
      ) {
        console.log('[VitamixIntent] Spec tab opened');
        sendSignal('spec_tab_opened', { tab: text });
        return;
      }

      // What's in the box
      if (
        text.includes("what's in the box") ||
        text.includes('whats in the box') ||
        text.includes('package contents')
      ) {
        console.log('[VitamixIntent] What\'s in box expanded');
        sendSignal('whats_in_box_expanded', {});
        return;
      }

      // Image gallery
      if (
        target.closest('[class*="gallery"]') ||
        target.closest('[class*="carousel"]') ||
        target.closest('[class*="slider"]')
      ) {
        if (target.tagName === 'IMG' || target.closest('button')) {
          console.log('[VitamixIntent] Image gallery interaction');
          sendSignal('image_gallery_interaction', {});
          return;
        }
      }
    }, true);
  }

  /**
   * Capture scroll depth
   */
  function setupScrollCapture() {
    let ticking = false;

    function updateScrollDepth() {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const depth = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

      if (depth > scrollDepthMax) {
        scrollDepthMax = depth;

        // Only send signal at 25%, 50%, 75%, 100% thresholds
        const thresholds = [25, 50, 75, 100];
        const threshold = thresholds.find(t => depth >= t && scrollDepthMax < t + 5);

        if (threshold && Date.now() - lastScrollUpdate > 1000) {
          console.log('[VitamixIntent] Scroll depth:', threshold);
          sendSignal('scroll_depth', { depth: threshold, maxDepth: scrollDepthMax });
          lastScrollUpdate = Date.now();
        }
      }

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDepth);
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Capture video engagement
   */
  function setupVideoCapture() {
    // Track video elements
    const trackVideo = (video) => {
      if (video.dataset.intentTracked) return;
      video.dataset.intentTracked = 'true';

      video.addEventListener('play', () => {
        console.log('[VitamixIntent] Video play');
        sendSignal('video_play', {
          duration: video.duration,
          src: video.currentSrc,
        });
      });

      video.addEventListener('ended', () => {
        console.log('[VitamixIntent] Video completed');
        sendSignal('video_completion', {
          duration: video.duration,
          src: video.currentSrc,
        });
      });
    };

    // Track existing videos
    document.querySelectorAll('video').forEach(trackVideo);

    // Track dynamically added videos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'VIDEO') {
            trackVideo(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('video').forEach(trackVideo);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Capture form interactions
   */
  function setupFormCapture() {
    // Track compare tool usage
    const compareLinks = document.querySelectorAll('a[href*="compare"]');
    compareLinks.forEach(link => {
      link.addEventListener('click', () => {
        console.log('[VitamixIntent] Compare link clicked');
        sendSignal('compare_tool_used', { source: 'link_click' });
      });
    });
  }

  /**
   * Track time on page
   */
  function setupTimeOnPage() {
    // Send time on page before leaving
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - pageLoadTime;

      // Only send if meaningful (> 10 seconds)
      if (timeOnPage > 10000) {
        const minutes = Math.floor(timeOnPage / 60000);
        const seconds = Math.floor((timeOnPage % 60000) / 1000);

        // Use sendBeacon for reliability
        const data = {
          type: 'SIGNAL',
          data: {
            type: 'time_on_page',
            data: {
              duration: timeOnPage,
              formatted: `${minutes}m ${seconds}s`,
              url: window.location.href,
            },
          },
        };

        // Can't use chrome.runtime in beforeunload reliably, so just log
        console.log('[VitamixIntent] Time on page:', data.data.data.formatted);
      }
    });

    // Also track at intervals while on page
    let lastTimeUpdate = 0;
    setInterval(() => {
      const timeOnPage = Date.now() - pageLoadTime;
      const thresholds = [30000, 60000, 120000, 300000]; // 30s, 1m, 2m, 5m

      const threshold = thresholds.find(t =>
        timeOnPage >= t && lastTimeUpdate < t
      );

      if (threshold) {
        lastTimeUpdate = threshold;
        console.log('[VitamixIntent] Time milestone:', threshold / 1000, 'seconds');
        sendSignal('time_on_page', {
          duration: timeOnPage,
          milestone: threshold,
        });
      }
    }, 5000);
  }

  /**
   * Get product name from current page
   */
  function getProductFromPage() {
    // Try to extract from URL
    const pathMatch = window.location.pathname.match(/\/shop\/(?:blenders|accessories)\/([^/?]+)/);
    if (pathMatch) {
      return pathMatch[1].replace(/-/g, ' ');
    }

    // Try to extract from page title
    const title = document.title;
    if (title.includes('|')) {
      return title.split('|')[0].trim();
    }

    return null;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
