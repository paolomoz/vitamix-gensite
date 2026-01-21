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
   * Extract compared products from DOM on compare pages
   * Looks for product names in various locations typical of compare page layouts
   */
  function extractComparedProductsFromDOM() {
    const products = [];
    const seen = new Set();

    // Helper to add product if valid and not duplicate
    const addProduct = (name) => {
      if (!name) return;
      const cleaned = name.replace(/®|™/g, '').trim();
      if (cleaned && cleaned.length > 1 && cleaned.length < 100 && !seen.has(cleaned.toLowerCase())) {
        seen.add(cleaned.toLowerCase());
        products.push(cleaned);
      }
    };

    // Strategy 1: Look for product name elements in compare table/grid
    // Common patterns: .product-name, .product-title, [data-product-name], etc.
    const productNameSelectors = [
      '.product-item-name',
      '.product-name',
      '.product-title',
      '[data-product-name]',
      '.compare-product-name',
      '.product-item-link',
      '.product-info-main .page-title span',
      // Vitamix-specific selectors based on their compare page structure
      '.cell.product .product-item-name',
      '.product-item-details .product-item-name',
      'td.cell.product a',
      '.comparison-product-name',
    ];

    for (const selector of productNameSelectors) {
      document.querySelectorAll(selector).forEach(el => {
        const text = el.textContent?.trim() || el.getAttribute('data-product-name');
        addProduct(text);
      });
    }

    // Strategy 2: Look for product images with alt text containing model names
    document.querySelectorAll('.product-image-photo, .compare img, [class*="compare"] img, [class*="product"] img').forEach(img => {
      const alt = img.alt || img.getAttribute('data-alt');
      if (alt) {
        addProduct(alt);
      }
    });

    // Strategy 3: Look for links to product pages within compare context
    document.querySelectorAll('a[href*="/shop/"][href*="blenders"], a[href*="/product/"]').forEach(link => {
      // Only consider links that look like they're in a compare context
      const parent = link.closest('[class*="compare"], table, .product-item, .product-info');
      if (parent) {
        const text = link.textContent?.trim();
        // Filter out generic text like "View Details", "Add to Cart", etc.
        if (text && !/(view|add|buy|cart|details|compare|remove)/i.test(text)) {
          addProduct(text);
        }
      }
    });

    // Strategy 4: Parse product names from the page heading if it mentions "vs" or "compare"
    const h1 = document.querySelector('h1')?.textContent || '';
    if (/compare|vs\b/i.test(h1)) {
      // Try to extract product names from patterns like "A3500 vs V1200" or "Compare A3500, V1200"
      const vsMatch = h1.match(/([A-Z][A-Za-z0-9\-]+)\s*(?:vs\.?|versus)\s*([A-Z][A-Za-z0-9\-]+)/i);
      if (vsMatch) {
        addProduct(vsMatch[1]);
        addProduct(vsMatch[2]);
      }
    }

    // Strategy 5: Look for data attributes that might contain product info
    document.querySelectorAll('[data-product-id], [data-sku], [data-name]').forEach(el => {
      const name = el.getAttribute('data-name') || el.getAttribute('data-product-name');
      if (name) {
        addProduct(name);
      }
    });

    console.log('[VitamixIntent] Extracted compared products from DOM:', products);
    return products.length > 0 ? products : null;
  }

  /**
   * Check if current page is a compare page
   */
  function isComparePage() {
    const path = window.location.pathname;
    const url = window.location.href;
    return /compare|product_compare/i.test(path) || /compare/i.test(url);
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

    // Extract compared products from DOM if on a compare page
    const comparedProducts = isComparePage() ? extractComparedProductsFromDOM() : null;

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
      comparedProducts,
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
    // Ignore synthetic/programmatic clicks (e.g., from video player initialization)
    if (!e.isTrusted) {
      return;
    }

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
   * Capture scroll depth - emits single signal with max depth reached
   * Debounced to avoid multiple events, sent when scrolling stops or page unloads
   */
  function setupScrollCapture() {
    let debounceTimer = null;
    let lastSentDepth = 0;

    function updateScrollDepth() {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const depth = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

      if (depth > scrollDepthMax) {
        scrollDepthMax = depth;
      }
    }

    function sendScrollSignal() {
      // Only send if we've scrolled past a meaningful threshold and it's new
      const threshold = Math.floor(scrollDepthMax / 25) * 25; // Round to nearest 25%
      if (threshold > 0 && threshold > lastSentDepth) {
        lastSentDepth = threshold;
        console.log('[VitamixIntent] Scroll depth:', scrollDepthMax + '%');
        sendSignal('scroll', {
          depth: scrollDepthMax,
          page: {
            url: window.location.href,
            path: window.location.pathname,
          }
        });
      }
    }

    window.addEventListener('scroll', () => {
      updateScrollDepth();
      // Debounce: send signal 1s after scrolling stops
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(sendScrollSignal, 1000);
    }, { passive: true });

    // Also send on page unload to capture final depth
    window.addEventListener('beforeunload', sendScrollSignal);

    // Initial check after page load
    setTimeout(updateScrollDepth, 500);
  }

  /**
   * Capture video engagement
   */
  function setupVideoCapture() {
    const trackVideo = (video) => {
      if (video.dataset.intentTracked) return;
      video.dataset.intentTracked = 'true';

      // Only track video completion (not play - too noisy on Vitamix site)
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
   * Track time on page - updates weight of corresponding page_view signal
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
        console.log('[VitamixIntent] Time milestone:', seconds, 'seconds - updating page view weight');
        // Send time update to background (updates page_view signal weight, not a new signal)
        chrome.runtime.sendMessage({
          type: 'PAGE_TIME_UPDATE',
          data: {
            url: window.location.href,
            path: window.location.pathname,
            timeOnPage,
            milestone: threshold,
            seconds,
          },
        }).catch(e => {
          console.log('[VitamixIntent] Could not send time update:', e.message);
        });
      }
    }, 5000);
  }

  // ============================================
  // Page Sections Extraction (for AI Hint)
  // ============================================

  /**
   * Generate unique CSS selector for element
   */
  function getUniqueSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.split(' ').filter(c => c && !c.startsWith('_')).slice(0, 2);
      if (classes.length) return `${el.tagName.toLowerCase()}.${classes.join('.')}`;
    }
    return el.tagName.toLowerCase();
  }

  /**
   * Extract page sections for LLM context
   */
  function getPageSections() {
    const sections = [];
    const selectors = [
      'section',
      '[class*="feature"]',
      '[class*="spec"]',
      '[class*="ingredient"]',
      '[class*="instruction"]',
      '[class*="product"]',
      '[class*="recipe"]',
      '[class*="hero"]',
      'main > div',
      'article > div',
    ];

    const seen = new Set();
    document.querySelectorAll(selectors.join(', ')).forEach((el) => {
      if (sections.length >= 10) return; // Limit to first 10 sections
      const text = el.textContent?.trim().slice(0, 500);
      if (text && text.length > 50) {
        const selector = getUniqueSelector(el);
        // Avoid duplicates
        if (!seen.has(selector)) {
          seen.add(selector);
          sections.push({
            selector,
            tagName: el.tagName.toLowerCase(),
            className: el.className?.toString().slice(0, 100) || '',
            text,
          });
        }
      }
    });
    return sections;
  }

  // ============================================
  // Hint Injection (for AI Hint)
  // ============================================

  /**
   * Inject hint as full-width content section
   */
  function injectHint(hintData) {
    const { injectionPoint, hint } = hintData;

    // Find injection target - prefer major section boundaries
    let target = null;
    if (injectionPoint && injectionPoint.selector) {
      try {
        target = document.querySelector(injectionPoint.selector);
      } catch (e) {
        console.log('[VitamixIntent] Invalid selector:', injectionPoint.selector);
      }
    }

    // Fallback: find a good section boundary
    if (!target) {
      target = document.querySelector(
        'main section, article section, [class*="section"], main > div, article > div'
      );
    }

    // Last resort: first h2
    if (!target) {
      target = document.querySelector('main h2, article h2, h2');
    }

    if (!target) {
      console.log('[VitamixIntent] Could not find injection target');
      return false;
    }

    // Create full-width hint section
    const section = document.createElement('section');
    section.className = 'vitamix-ai-hint-section';
    section.innerHTML = `
      <button class="vitamix-ai-hint-dismiss" aria-label="Dismiss">×</button>
      <div class="vitamix-ai-hint-content">
        <p class="vitamix-ai-hint-eyebrow">${hint.eyebrow || 'Personalized for You'}</p>
        <h2 class="vitamix-ai-hint-headline">${hint.headline || hint.text}</h2>
        <p class="vitamix-ai-hint-body">${hint.body || ''}</p>
        <button class="vitamix-ai-hint-cta">${hint.cta || 'Learn More'}</button>
      </div>
    `;

    // Insert based on position - for full-width, prefer after sections
    const position = injectionPoint?.position || 'after';
    const insertTarget = target.closest('section') || target;

    if (position === 'before') {
      insertTarget.parentNode.insertBefore(section, insertTarget);
    } else {
      insertTarget.parentNode.insertBefore(section, insertTarget.nextSibling);
    }

    // Handle CTA click - open POC with query
    section.querySelector('.vitamix-ai-hint-cta').addEventListener('click', () => {
      console.log('[VitamixIntent] Hint CTA clicked, query:', hint.query);
      chrome.runtime.sendMessage({
        type: 'HINT_CLICKED',
        query: hint.query,
      });
    });

    // Handle dismiss
    section.querySelector('.vitamix-ai-hint-dismiss').addEventListener('click', () => {
      section.style.animation = 'vitamix-hint-fade-out 0.3s ease forwards';
      setTimeout(() => section.remove(), 300);
    });

    console.log('[VitamixIntent] Hint section injected:', hint.headline);
    return true;
  }

  /**
   * Listen for messages from background
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_PAGE_SECTIONS') {
      const pageContext = getPageContext();
      const sections = getPageSections();
      sendResponse({ pageContext, sections });
      return false;
    }

    if (message.type === 'INJECT_HINT') {
      const success = injectHint(message.hintData);
      sendResponse({ success });
      return false;
    }

    return false;
  });

  // ============================================
  // Query Capture from URL (for POC site follow-ups)
  // ============================================

  /**
   * Check if current page is on POC site and has a query parameter
   * If so, send it to background to add to conversation history
   * This captures follow-up clicks on the POC site
   */
  function captureQueryFromUrl() {
    const url = new URL(window.location.href);
    const isPocSite = url.hostname.includes('aem.live');
    const hasContextParam = url.searchParams.has('ctx');
    const query = url.searchParams.get('query') || url.searchParams.get('q');

    // Only capture if on POC site, has context (extension flow), and has a query
    if (isPocSite && hasContextParam && query && query.trim()) {
      console.log('[VitamixIntent] Capturing follow-up query from URL:', query);
      chrome.runtime.sendMessage({
        type: 'QUERY_FROM_URL',
        query: query.trim(),
      }).catch(e => {
        console.log('[VitamixIntent] Could not send query:', e.message);
      });
    }
  }

  // ============================================
  // Generation Reasoning Capture (for POC site)
  // ============================================

  /**
   * Check if this is a generated page on the POC site
   */
  function isGeneratedPage() {
    const url = new URL(window.location.href);
    const isPocSite = url.hostname.includes('aem.live');
    const hasCtxParam = url.searchParams.has('ctx');
    const hasQueryParam = url.searchParams.has('q') || url.searchParams.has('query');
    return isPocSite && (hasCtxParam || hasQueryParam);
  }

  /**
   * Forward generation data to panel via background
   */
  function forwardGenerationData(data) {
    if (!data) return;
    console.log('[VitamixIntent] Forwarding generation data to panel:', data.query);
    chrome.runtime.sendMessage({
      type: 'GENERATION_DATA',
      data,
    }).catch(e => {
      console.log('[VitamixIntent] Could not forward generation data:', e.message);
    });
  }

  /**
   * Set up generation data capture for POC site
   */
  function setupGenerationCapture() {
    if (!isGeneratedPage()) return;

    console.log('[VitamixIntent] Setting up generation data capture');

    // Listen for postMessage from page (content scripts are in isolated world)
    window.addEventListener('message', (e) => {
      // Only accept messages from same window
      if (e.source !== window) return;
      if (e.data?.type === 'VITAMIX_GENERATION_COMPLETE') {
        console.log('[VitamixIntent] Received VITAMIX_GENERATION_COMPLETE message');
        forwardGenerationData(e.data.data);
      }
    });

    // Also poll for data (page may have already completed generation before listener was set up)
    // We inject a script to read from page context since window objects are isolated
    const checkForExistingData = () => {
      const script = document.createElement('script');
      script.textContent = `
        if (window.__vitamixGenerationData) {
          window.postMessage({
            type: 'VITAMIX_GENERATION_COMPLETE',
            data: window.__vitamixGenerationData
          }, '*');
        }
      `;
      document.documentElement.appendChild(script);
      script.remove();
    };

    // Check after a delay to allow page scripts to run
    setTimeout(checkForExistingData, 2000);
    setTimeout(checkForExistingData, 5000);
  }

  // Initialize signal capture only (no panel auto-injection)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      captureQueryFromUrl();
      setupGenerationCapture();
    });
  } else {
    init();
    captureQueryFromUrl();
    setupGenerationCapture();
  }
})();
