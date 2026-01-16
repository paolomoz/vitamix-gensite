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
    console.log('[VitamixIntent] Initializing on:', window.location.pathname);

    // Send page view signal from content script (more reliable than webNavigation)
    sendPageViewSignal();

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
   * Send page view signal based on current URL
   */
  function sendPageViewSignal() {
    const path = window.location.pathname;
    const url = window.location.href;

    // Product page: /shop/blenders/{product}
    const productMatch = path.match(/\/shop\/blenders\/([^/?]+)/);
    if (productMatch) {
      const product = productMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      console.log('[VitamixIntent] Product page view:', product);
      sendSignal('product_page_view', { product, path, url });
      return;
    }

    // Accessory page: /shop/accessories/{product}
    const accessoryMatch = path.match(/\/shop\/accessories\/([^/?]+)/);
    if (accessoryMatch) {
      const product = accessoryMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      console.log('[VitamixIntent] Accessory page view:', product);
      sendSignal('accessory_page_view', { product, path, url });
      return;
    }

    // Recipe page: /recipes/{slug}
    const recipeMatch = path.match(/\/recipes\/([^/?]+)/);
    if (recipeMatch) {
      const recipe = recipeMatch[1];
      console.log('[VitamixIntent] Recipe page view:', recipe);
      sendSignal('recipe_page_view', { recipe, path, url });
      return;
    }

    // Category page: /shop/blenders or /shop/accessories
    const categoryMatch = path.match(/\/shop\/(blenders|accessories|containers)(?:\?|$)/);
    if (categoryMatch) {
      const category = categoryMatch[1];
      console.log('[VitamixIntent] Category page view:', category);
      sendSignal('category_page_view', { category, path, url });
      return;
    }

    // Compare page
    if (path.includes('/compare')) {
      console.log('[VitamixIntent] Compare page view');
      sendSignal('compare_tool_used', { source: 'page_view', path, url });
      return;
    }

    // Article/blog pages
    const articleMatch = path.match(/\/(articles?|blog|learn|inspiration)\/([^/?]+)/);
    if (articleMatch) {
      const article = articleMatch[2];
      console.log('[VitamixIntent] Article page view:', article);
      sendSignal('article_page_view', { article, path, url });
      return;
    }
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
      const target = e.target.closest('a, button, [role="button"], [onclick], [data-action]');
      if (!target) return;

      const text = (target.textContent || '').toLowerCase().trim();
      const href = target.href || '';
      const className = (target.className || '').toString().toLowerCase();
      const ariaLabel = (target.getAttribute('aria-label') || '').toLowerCase();
      const dataAction = (target.dataset.action || '').toLowerCase();

      // Combine all text sources for matching
      const allText = `${text} ${ariaLabel} ${dataAction}`;

      // Reviews interactions
      if (
        allText.match(/load\s*more|show\s*more|see\s*(all|more)|read\s*more/i) &&
        (allText.includes('review') || className.includes('review') || target.closest('[class*="review"], [id*="review"], [data-component*="review"]'))
      ) {
        console.log('[VitamixIntent] Reviews load more clicked');
        sendSignal('reviews_load_more', { buttonText: text.slice(0, 50) });
        return;
      }

      // Review filter/sort
      if (
        target.closest('[class*="filter"], [class*="sort"], [id*="filter"], [id*="sort"]') ||
        allText.match(/filter|sort|rating|stars/i)
      ) {
        if (target.closest('[class*="review"], [id*="review"]') || allText.includes('review')) {
          console.log('[VitamixIntent] Review filter applied');
          sendSignal('review_filter_applied', { filter: text.slice(0, 50) });
          return;
        }
      }

      // Add to cart (multiple patterns)
      if (
        allText.match(/add\s*to\s*(cart|bag|basket)|buy\s*now|purchase/i) ||
        className.match(/add.*cart|cart.*add|buy.*btn/i) ||
        dataAction.includes('cart')
      ) {
        console.log('[VitamixIntent] Add to cart clicked');
        sendSignal('add_to_cart', { product: getProductFromPage() });
        return;
      }

      // Spec/Details tabs (look for tab-like behavior)
      if (
        allText.match(/specification|tech\s*spec|features|details|overview/i) ||
        (target.getAttribute('role') === 'tab' && allText.match(/spec|detail|feature/i))
      ) {
        console.log('[VitamixIntent] Spec tab opened');
        sendSignal('spec_tab_opened', { tab: text.slice(0, 50) });
        return;
      }

      // What's in the box / Package contents
      if (allText.match(/what.*in.*box|package\s*content|included|in\s*the\s*box/i)) {
        console.log('[VitamixIntent] What\'s in box expanded');
        sendSignal('whats_in_box_expanded', {});
        return;
      }

      // Image gallery/carousel interactions
      const galleryContainer = target.closest('[class*="gallery"], [class*="carousel"], [class*="slider"], [class*="lightbox"], [class*="media"], [class*="image"]');
      if (galleryContainer) {
        const isNavButton = target.closest('button, [role="button"]') || allText.match(/next|prev|arrow|thumb/i);
        const isImage = target.tagName === 'IMG' || target.closest('picture');
        if (isNavButton || isImage) {
          console.log('[VitamixIntent] Image gallery interaction');
          sendSignal('image_gallery_interaction', {});
          return;
        }
      }

      // Compare product links
      if (href.includes('compare') || allText.match(/compare|vs\b/i)) {
        console.log('[VitamixIntent] Compare clicked');
        sendSignal('compare_tool_used', { source: 'click' });
        return;
      }
    }, true);
  }

  /**
   * Capture scroll depth
   */
  function setupScrollCapture() {
    let ticking = false;
    const triggeredThresholds = new Set();

    function updateScrollDepth() {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const depth = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

      // Update max depth
      if (depth > scrollDepthMax) {
        scrollDepthMax = depth;
      }

      // Check thresholds - send signal when crossing each threshold for the first time
      const thresholds = [25, 50, 75, 100];
      for (const threshold of thresholds) {
        if (depth >= threshold && !triggeredThresholds.has(threshold)) {
          triggeredThresholds.add(threshold);
          console.log('[VitamixIntent] Scroll depth reached:', threshold + '%');
          sendSignal('scroll_depth', { depth: threshold, maxDepth: scrollDepthMax });
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

    // Also check initial scroll position (in case page loads scrolled)
    setTimeout(updateScrollDepth, 500);
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
