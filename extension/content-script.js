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

  // ============================================
  // Overlay Panel Injection (on-demand)
  // ============================================

  let overlayContainer = null;
  let panelIframe = null;
  let stylesInjected = false;

  /**
   * Inject overlay panel CSS (once)
   */
  function injectOverlayStyles() {
    if (stylesInjected) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = 'vitamix-intent-overlay-styles';
    link.href = chrome.runtime.getURL('overlay-panel.css');
    document.head.appendChild(link);
    stylesInjected = true;
  }

  /**
   * Create and inject the overlay panel
   */
  function enableOverlayPanel() {
    // Don't inject if already present
    if (document.querySelector('.vitamix-intent-overlay-container')) {
      return;
    }

    // Check saved collapsed state BEFORE creating elements
    const savedState = localStorage.getItem('vitamix-intent-panel-collapsed');
    const shouldBeCollapsed = savedState !== 'false'; // Default to collapsed if no saved state

    // Create container with correct initial state
    overlayContainer = document.createElement('div');
    overlayContainer.className = 'vitamix-intent-overlay-container';
    if (shouldBeCollapsed) {
      overlayContainer.classList.add('collapsed');
    }

    // Apply critical inline styles immediately (before CSS loads)
    overlayContainer.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 2147483647;
      pointer-events: none;
    `;

    // Create toggle button (for collapse/expand, not enable/disable)
    const toggle = document.createElement('button');
    toggle.className = 'vitamix-intent-toggle';
    toggle.setAttribute('aria-label', 'Collapse/Expand Panel');
    toggle.setAttribute('title', 'Collapse/Expand Panel');
    toggle.innerHTML = `
      <span class="vitamix-intent-toggle-icon">🎯</span>
      <span class="vitamix-intent-toggle-chevron">◀</span>
    `;

    // Apply critical inline styles to toggle (before CSS loads)
    toggle.style.cssText = `
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      right: ${shouldBeCollapsed ? '0' : '380px'};
      width: 36px;
      height: 80px;
      z-index: 2147483647;
      pointer-events: auto;
      cursor: pointer;
      background: linear-gradient(180deg, #2d2d2d 0%, #1e1e1e 100%);
      border: 1px solid #404040;
      border-right: none;
      border-radius: 8px 0 0 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
    `;

    // Create panel container
    const panel = document.createElement('div');
    panel.className = 'vitamix-intent-panel';

    // Apply critical inline styles to panel (before CSS loads)
    panel.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 380px;
      height: 100%;
      background: #1e1e1e;
      pointer-events: auto;
      transform: ${shouldBeCollapsed ? 'translateX(100%)' : 'translateX(0)'};
    `;

    // Create iframe for panel content
    panelIframe = document.createElement('iframe');
    panelIframe.src = chrome.runtime.getURL('panel/panel.html');
    panelIframe.setAttribute('allow', 'clipboard-write');
    panelIframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    panel.appendChild(panelIframe);

    // Assemble
    overlayContainer.appendChild(toggle);
    overlayContainer.appendChild(panel);
    document.body.appendChild(overlayContainer);

    // Inject styles (will override inline styles but maintain state)
    injectOverlayStyles();

    // After CSS loads, clear inline styles to let CSS take over
    // but keep the state classes for proper styling
    setTimeout(() => {
      overlayContainer.style.cssText = '';
      toggle.style.cssText = '';
      panel.style.cssText = '';
    }, 100);

    // Toggle click handler (collapse/expand)
    toggle.addEventListener('click', () => {
      overlayContainer.classList.toggle('collapsed');
      const isCollapsed = overlayContainer.classList.contains('collapsed');
      localStorage.setItem('vitamix-intent-panel-collapsed', isCollapsed ? 'true' : 'false');
    });

    console.log('[VitamixIntent] Overlay panel enabled, collapsed:', shouldBeCollapsed);
  }

  /**
   * Remove the overlay panel from the page
   */
  function disableOverlayPanel() {
    if (overlayContainer) {
      overlayContainer.remove();
      overlayContainer = null;
      panelIframe = null;
      console.log('[VitamixIntent] Overlay panel disabled');
    }
  }

  /**
   * Check if panel is currently enabled on page
   */
  function isPanelEnabled() {
    return !!document.querySelector('.vitamix-intent-overlay-container');
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

    if (message.type === 'ENABLE_PANEL') {
      enableOverlayPanel();
      sendResponse({ success: true, enabled: true });
      return false;
    }

    if (message.type === 'DISABLE_PANEL') {
      disableOverlayPanel();
      sendResponse({ success: true, enabled: false });
      return false;
    }

    if (message.type === 'GET_PANEL_STATE') {
      sendResponse({ enabled: isPanelEnabled() });
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

  // Initialize signal capture only (no panel auto-injection)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      captureQueryFromUrl();
    });
  } else {
    init();
    captureQueryFromUrl();
  }
})();
