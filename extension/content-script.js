/**
 * Content Script - Injected on vitamix.com
 * Captures ALL page views and clicks, sending rich context for classification
 */

(function() {
  'use strict';

  console.log('[VitamixIntent] Content script loaded');

  // Track page load time
  const pageLoadTime = Date.now();
  let scrollDepthMax = 0;

  /**
   * Send signal to background
   */
  function sendSignal(type, data = {}) {
    chrome.runtime.sendMessage({
      type: 'SIGNAL',
      data: { type, data },
    }).catch(e => {
      console.log('[VitamixIntent] Could not send signal:', e.message);
    });
  }

  /**
   * Extract page context - URL, title, headings, meta
   */
  function getPageContext() {
    const url = window.location.href;
    const path = window.location.pathname;
    const title = document.title || '';
    const h1 = document.querySelector('h1')?.textContent?.trim() || '';
    const h2s = [...document.querySelectorAll('h2')].slice(0, 3).map(el => el.textContent?.trim()).filter(Boolean);
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.href || '';

    // Try to extract product price if present
    const priceEl = document.querySelector('[class*="price"], [data-price], .price');
    const price = priceEl?.textContent?.trim() || null;

    // Try to extract breadcrumbs for context
    const breadcrumbs = [...document.querySelectorAll('[class*="breadcrumb"] a, nav[aria-label*="breadcrumb"] a')]
      .map(a => a.textContent?.trim())
      .filter(Boolean);

    return {
      url,
      path,
      title,
      h1,
      h2s,
      metaDesc,
      canonical,
      price,
      breadcrumbs,
    };
  }

  /**
   * Get clean text from element (excluding scripts/styles)
   */
  function getCleanText(element, maxLength = 100) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());
    return (clone.textContent || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  /**
   * Extract click context from element
   */
  function getClickContext(element) {
    const text = getCleanText(element);
    const href = element.href || element.closest('a')?.href || null;
    const ariaLabel = element.getAttribute('aria-label') || null;
    const title = element.getAttribute('title') || null;
    const role = element.getAttribute('role') || null;
    const tagName = element.tagName.toLowerCase();
    const className = (element.className || '').toString();
    const id = element.id || null;
    const dataAction = element.dataset?.action || null;

    // Get section context - what part of page was clicked
    const section = element.closest('header, footer, nav, main, aside, [role="main"], [class*="hero"], [class*="product"], [class*="recipe"]');
    const sectionType = section ? (section.tagName.toLowerCase() + (section.className ? '.' + section.className.split(' ')[0] : '')) : null;

    // Check if it's an image
    const isImage = tagName === 'img' || element.querySelector('img') !== null;
    const imgAlt = element.querySelector('img')?.alt || element.alt || null;

    return {
      text,
      href,
      ariaLabel,
      title,
      role,
      tagName,
      className: className.slice(0, 100),
      id,
      dataAction,
      sectionType,
      isImage,
      imgAlt,
    };
  }

  /**
   * Initialize signal capture
   */
  function init() {
    console.log('[VitamixIntent] Initializing on:', window.location.pathname);

    // Send page view signal with full context
    sendPageViewSignal();

    // Capture referrer
    captureReferrer();

    // Set up event listeners
    setupClickCapture();
    setupScrollCapture();
    setupVideoCapture();
    setupSearchCapture();
    setupTimeOnPage();

    console.log('[VitamixIntent] Event listeners initialized');
  }

  /**
   * Send page view signal with rich context
   */
  function sendPageViewSignal() {
    const context = getPageContext();
    console.log('[VitamixIntent] Page view:', context.path, '| Title:', context.title);
    sendSignal('page_view', context);
  }

  /**
   * Capture referrer context
   */
  function captureReferrer() {
    const referrer = document.referrer;
    if (!referrer) {
      sendSignal('referrer', { type: 'direct' });
      return;
    }

    try {
      const refUrl = new URL(referrer);
      const searchEngines = ['google', 'bing', 'duckduckgo', 'yahoo', 'ecosia'];
      const isSearch = searchEngines.some(se => refUrl.hostname.includes(se));
      const isInternal = refUrl.hostname === window.location.hostname;

      if (isInternal) {
        return; // Don't track internal navigation as referrer
      }

      const params = new URLSearchParams(refUrl.search);
      const searchQuery = params.get('q') || params.get('query') || params.get('p') || null;

      sendSignal('referrer', {
        type: isSearch ? 'search' : 'external',
        domain: refUrl.hostname,
        searchQuery,
        fullUrl: referrer,
      });
    } catch (e) {
      console.log('[VitamixIntent] Error parsing referrer:', e);
    }
  }

  /**
   * Capture all clicks with context
   */
  function setupClickCapture() {
    document.addEventListener('click', handleClick, true);
    console.log('[VitamixIntent] Click capture set up');
  }

  function handleClick(e) {
    // Find the nearest interactive element or use direct target
    const target = e.target.closest('a, button, [role="button"], [onclick], [data-action], input[type="submit"], [tabindex], img, video') || e.target;

    if (!target || target === document.body || target === document.documentElement) {
      return;
    }

    const clickContext = getClickContext(target);
    const pageContext = {
      url: window.location.href,
      path: window.location.pathname,
      pageTitle: document.title,
    };

    console.log('[VitamixIntent] Click:', clickContext.text || clickContext.tagName, '| href:', clickContext.href);

    sendSignal('click', {
      ...clickContext,
      page: pageContext,
    });
  }

  /**
   * Capture search queries
   */
  function setupSearchCapture() {
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
        console.log('[VitamixIntent] Search query:', query);
        sendSignal('search', {
          query,
          page: {
            url: window.location.href,
            path: window.location.pathname,
          }
        });
      }
    }

    document.querySelectorAll(searchSelectors.join(', ')).forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleSearch(e.target);
        }
      });

      let blurTimeout;
      input.addEventListener('blur', (e) => {
        clearTimeout(blurTimeout);
        blurTimeout = setTimeout(() => handleSearch(e.target), 500);
      });
    });

    // Form submissions
    document.querySelectorAll('form').forEach(form => {
      if (form.querySelector('input[type="search"], input[name*="search" i]')) {
        form.addEventListener('submit', () => {
          const input = form.querySelector('input[type="search"], input[name*="search" i], input[type="text"]');
          if (input) handleSearch(input);
        });
      }
    });
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

      if (depth > scrollDepthMax) {
        scrollDepthMax = depth;
      }

      const thresholds = [25, 50, 75, 100];
      for (const threshold of thresholds) {
        if (depth >= threshold && !triggeredThresholds.has(threshold)) {
          triggeredThresholds.add(threshold);
          console.log('[VitamixIntent] Scroll depth:', threshold + '%');
          sendSignal('scroll', {
            depth: threshold,
            maxDepth: scrollDepthMax,
            page: {
              url: window.location.href,
              path: window.location.pathname,
            }
          });
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

    setTimeout(updateScrollDepth, 500);
  }

  /**
   * Capture video engagement
   */
  function setupVideoCapture() {
    const trackVideo = (video) => {
      if (video.dataset.intentTracked) return;
      video.dataset.intentTracked = 'true';

      video.addEventListener('play', () => {
        console.log('[VitamixIntent] Video play');
        sendSignal('video_play', {
          duration: video.duration,
          src: video.currentSrc,
          page: {
            url: window.location.href,
            path: window.location.pathname,
          }
        });
      });

      video.addEventListener('ended', () => {
        console.log('[VitamixIntent] Video completed');
        sendSignal('video_complete', {
          duration: video.duration,
          src: video.currentSrc,
          page: {
            url: window.location.href,
            path: window.location.pathname,
          }
        });
      });
    };

    document.querySelectorAll('video').forEach(trackVideo);

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

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  /**
   * Track time on page
   */
  function setupTimeOnPage() {
    let lastTimeUpdate = 0;
    const thresholds = [30000, 60000, 120000, 300000]; // 30s, 1m, 2m, 5m

    setInterval(() => {
      const timeOnPage = Date.now() - pageLoadTime;

      const threshold = thresholds.find(t => timeOnPage >= t && lastTimeUpdate < t);

      if (threshold) {
        lastTimeUpdate = threshold;
        const seconds = Math.floor(threshold / 1000);
        console.log('[VitamixIntent] Time milestone:', seconds, 'seconds');
        sendSignal('time_on_page', {
          duration: timeOnPage,
          milestone: threshold,
          seconds,
          page: {
            url: window.location.href,
            path: window.location.pathname,
          }
        });
      }
    }, 5000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
