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
   * Inject hint as full-width content section right above the footer
   */
  function injectHint(hintData) {
    const { hint } = hintData;

    // Always inject right above the footer
    const footer = document.querySelector('footer, [role="contentinfo"], .footer, #footer');

    if (!footer) {
      console.log('[VitamixIntent] Could not find footer for hint injection');
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

    // Insert right before the footer
    footer.parentNode.insertBefore(section, footer);

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

  // ============================================
  // Support Chatbot UI
  // ============================================

  // Chatbot state
  let chatbotOpen = false;
  let chatbotOverlay = null;
  let chatbotButton = null;
  let chatbotHidden = false;

  /**
   * SVG Icons for chatbot
   */
  const CHATBOT_ICONS = {
    chat: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7z"/></svg>`,
    reset: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    send: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
    support: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>`,
    external: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`,
  };

  /**
   * Inject the chatbot button (replaces vitamix.com chatbot)
   */
  function injectChatbotButton() {
    // Skip if already injected
    if (document.querySelector('.vitamix-chatbot-button')) return;

    // Create the button
    chatbotButton = document.createElement('button');
    chatbotButton.className = 'vitamix-chatbot-button';
    chatbotButton.setAttribute('aria-label', 'Open support chat');
    chatbotButton.innerHTML = CHATBOT_ICONS.chat;

    // Click handler
    chatbotButton.addEventListener('click', handleChatbotButtonClick);

    // Append to body
    document.body.appendChild(chatbotButton);

    console.log('[VitamixIntent] Chatbot button injected');

    // Load saved state
    loadChatbotState();
  }

  /**
   * Handle chatbot button click
   */
  function handleChatbotButtonClick() {
    if (chatbotOpen) {
      // If open and clicking reset icon, show confirmation
      if (chatbotButton.classList.contains('active')) {
        if (confirm('Clear conversation and start over?')) {
          resetChatbot();
        }
      }
    } else {
      openChatbot();
    }
  }

  /**
   * Open the chatbot overlay
   */
  function openChatbot() {
    if (!chatbotOverlay) {
      createChatbotOverlay();
    }
    chatbotOverlay.classList.add('open');
    chatbotButton.classList.add('active');
    chatbotButton.innerHTML = CHATBOT_ICONS.reset;
    chatbotButton.setAttribute('aria-label', 'Reset conversation');
    chatbotOpen = true;
    saveChatbotState();

    // Focus input
    setTimeout(() => {
      const input = chatbotOverlay.querySelector('.vitamix-chatbot-input');
      if (input) input.focus();
    }, 200);
  }

  /**
   * Close the chatbot overlay
   */
  function closeChatbot() {
    if (chatbotOverlay) {
      chatbotOverlay.classList.remove('open');
    }
    chatbotButton.classList.remove('active');
    chatbotButton.innerHTML = CHATBOT_ICONS.chat;
    chatbotButton.setAttribute('aria-label', 'Open support chat');
    chatbotOpen = false;
    saveChatbotState();
  }

  /**
   * Reset chatbot conversation
   */
  function resetChatbot() {
    chrome.runtime.sendMessage({ type: 'CHATBOT_RESET' }).catch(() => {});
    if (chatbotOverlay) {
      const messagesContainer = chatbotOverlay.querySelector('.vitamix-chatbot-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = getEmptyStateHTML();
      }
    }
    closeChatbot();
  }

  /**
   * Create the chatbot overlay panel
   */
  function createChatbotOverlay() {
    chatbotOverlay = document.createElement('div');
    chatbotOverlay.className = 'vitamix-chatbot-overlay';
    chatbotOverlay.innerHTML = `
      <div class="vitamix-chatbot-header">
        <div class="vitamix-chatbot-header-left">
          <div class="vitamix-chatbot-logo">${CHATBOT_ICONS.support}</div>
          <div>
            <h2 class="vitamix-chatbot-title">Vitamix Support</h2>
            <p class="vitamix-chatbot-subtitle">AI-powered assistance</p>
          </div>
        </div>
        <button class="vitamix-chatbot-close" aria-label="Close chat">${CHATBOT_ICONS.close}</button>
      </div>
      <div class="vitamix-chatbot-messages">
        ${getEmptyStateHTML()}
      </div>
      <div class="vitamix-chatbot-input-area">
        <div class="vitamix-chatbot-input-wrapper">
          <input type="text" class="vitamix-chatbot-input" placeholder="Ask about your Vitamix..." />
          <button class="vitamix-chatbot-send" aria-label="Send message">${CHATBOT_ICONS.send}</button>
        </div>
      </div>
    `;

    // Event listeners
    chatbotOverlay.querySelector('.vitamix-chatbot-close').addEventListener('click', closeChatbot);

    const input = chatbotOverlay.querySelector('.vitamix-chatbot-input');
    const sendButton = chatbotOverlay.querySelector('.vitamix-chatbot-send');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    sendButton.addEventListener('click', sendMessage);

    document.body.appendChild(chatbotOverlay);

    // Load existing conversation
    loadConversation();
  }

  /**
   * Get empty state HTML
   */
  function getEmptyStateHTML() {
    return `
      <div class="vitamix-chatbot-empty">
        <svg class="vitamix-chatbot-empty-icon" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
        </svg>
        <p class="vitamix-chatbot-empty-text">
          Ask me anything about your Vitamix!<br/>
          Cleaning, troubleshooting, recipes, and more.
        </p>
      </div>
    `;
  }

  /**
   * Send a message to the support chat
   */
  function sendMessage() {
    const input = chatbotOverlay.querySelector('.vitamix-chatbot-input');
    const query = input.value.trim();
    if (!query) return;

    // Clear input
    input.value = '';

    // Add user message to UI
    addMessageToUI('user', query);

    // Show loading state
    showLoading();

    // Get page context
    const pageContext = {
      url: window.location.href,
      productViewed: extractProductFromPage(),
    };

    // Send to background for API call
    chrome.runtime.sendMessage({
      type: 'CHATBOT_MESSAGE',
      query,
      pageContext,
    }).then((response) => {
      hideLoading();
      if (response && response.quickAnswer) {
        addAssistantMessage(response);
      } else if (response && response.error) {
        showError(response.error);
      } else {
        // Fallback for unexpected response format
        showError('Could not get a response. Please try again.');
      }
    }).catch((e) => {
      hideLoading();
      showError('Could not connect to support. Please try again.');
      console.error('[VitamixIntent] Chatbot error:', e);
    });
  }

  /**
   * Extract product name from current page (if on product page)
   */
  function extractProductFromPage() {
    const url = window.location.pathname;
    // Product page URL patterns
    if (url.includes('/shop/') || url.includes('/products/')) {
      const h1 = document.querySelector('h1')?.textContent?.trim();
      if (h1) return h1;
    }
    return null;
  }

  /**
   * Format markdown-style text to HTML for assistant messages
   */
  function formatMarkdown(text) {
    // Escape HTML first to prevent XSS
    let html = escapeHtml(text);

    // Convert **bold** to <strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Split into lines for processing
    const lines = html.split('\n');
    const result = [];
    let inList = false;
    let listType = null;
    let currentParagraph = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for numbered list (1. 2. 3. etc)
      const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
      // Check for bullet list (- or *)
      const bulletMatch = line.match(/^[-*]\s+(.+)$/);

      if (numberedMatch) {
        // Flush current paragraph
        if (currentParagraph.length > 0) {
          result.push(`<p>${currentParagraph.join(' ')}</p>`);
          currentParagraph = [];
        }
        // Start or continue ordered list
        if (!inList || listType !== 'ol') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        result.push(`<li>${numberedMatch[2]}</li>`);
      } else if (bulletMatch) {
        // Flush current paragraph
        if (currentParagraph.length > 0) {
          result.push(`<p>${currentParagraph.join(' ')}</p>`);
          currentParagraph = [];
        }
        // Start or continue unordered list
        if (!inList || listType !== 'ul') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        result.push(`<li>${bulletMatch[1]}</li>`);
      } else if (line === '') {
        // Empty line - end list and paragraph
        if (inList) {
          result.push(`</${listType}>`);
          inList = false;
          listType = null;
        }
        if (currentParagraph.length > 0) {
          result.push(`<p>${currentParagraph.join(' ')}</p>`);
          currentParagraph = [];
        }
      } else {
        // Regular text line
        if (inList) {
          result.push(`</${listType}>`);
          inList = false;
          listType = null;
        }
        // Check if line ends with colon (likely a heading)
        if (line.endsWith(':') && line.length < 60) {
          if (currentParagraph.length > 0) {
            result.push(`<p>${currentParagraph.join(' ')}</p>`);
            currentParagraph = [];
          }
          result.push(`<h4>${line}</h4>`);
        } else {
          currentParagraph.push(line);
        }
      }
    }

    // Flush remaining content
    if (inList) {
      result.push(`</${listType}>`);
    }
    if (currentParagraph.length > 0) {
      result.push(`<p>${currentParagraph.join(' ')}</p>`);
    }

    return result.join('');
  }

  /**
   * Add a message to the UI
   */
  function addMessageToUI(role, content, fullPageUrl = null, relatedTopics = null) {
    const messagesContainer = chatbotOverlay.querySelector('.vitamix-chatbot-messages');

    // Remove empty state if present
    const emptyState = messagesContainer.querySelector('.vitamix-chatbot-empty');
    if (emptyState) emptyState.remove();

    const messageEl = document.createElement('div');
    messageEl.className = `vitamix-chatbot-message ${role}`;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let extraContent = '';
    if (fullPageUrl) {
      extraContent += `
        <a href="${fullPageUrl}" class="vitamix-chatbot-fullpage-link" target="_blank">
          ${CHATBOT_ICONS.external}
          See full guide
        </a>
      `;
    }
    if (relatedTopics && relatedTopics.length > 0) {
      extraContent += `
        <div class="vitamix-chatbot-topics">
          ${relatedTopics.map(topic => `<button class="vitamix-chatbot-topic" data-query="${escapeHtml(topic)}">${escapeHtml(topic)}</button>`).join('')}
        </div>
      `;
    }

    // Format assistant messages with markdown, escape user messages
    const formattedContent = role === 'assistant' ? formatMarkdown(content) : escapeHtml(content);

    messageEl.innerHTML = `
      <div class="vitamix-chatbot-message-bubble">${formattedContent}</div>
      ${extraContent}
      <div class="vitamix-chatbot-message-time">${time}</div>
    `;

    // Add click handlers for topic buttons
    messageEl.querySelectorAll('.vitamix-chatbot-topic').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = chatbotOverlay.querySelector('.vitamix-chatbot-input');
        input.value = btn.dataset.query;
        sendMessage();
      });
    });

    messagesContainer.appendChild(messageEl);

    // Scroll behavior: user messages scroll to bottom, assistant messages scroll to show the start
    if (role === 'user') {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
      // Scroll to show the beginning of the assistant message
      messageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Add assistant message with optional extras
   */
  function addAssistantMessage(response) {
    addMessageToUI('assistant', response.quickAnswer, response.fullPageUrl, response.relatedTopics);
  }

  /**
   * Show loading indicator
   */
  function showLoading() {
    const messagesContainer = chatbotOverlay.querySelector('.vitamix-chatbot-messages');

    // Remove any existing loading
    const existingLoading = messagesContainer.querySelector('.vitamix-chatbot-loading');
    if (existingLoading) existingLoading.remove();

    const loadingEl = document.createElement('div');
    loadingEl.className = 'vitamix-chatbot-loading';
    loadingEl.innerHTML = `
      <div class="vitamix-chatbot-loading-dots">
        <div class="vitamix-chatbot-loading-dot"></div>
        <div class="vitamix-chatbot-loading-dot"></div>
        <div class="vitamix-chatbot-loading-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(loadingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Hide loading indicator
   */
  function hideLoading() {
    const messagesContainer = chatbotOverlay.querySelector('.vitamix-chatbot-messages');
    const loadingEl = messagesContainer.querySelector('.vitamix-chatbot-loading');
    if (loadingEl) loadingEl.remove();
  }

  /**
   * Show error message
   */
  function showError(message) {
    const messagesContainer = chatbotOverlay.querySelector('.vitamix-chatbot-messages');
    const errorEl = document.createElement('div');
    errorEl.className = 'vitamix-chatbot-error';
    errorEl.textContent = message;
    messagesContainer.appendChild(errorEl);

    // Auto-remove after 5 seconds
    setTimeout(() => errorEl.remove(), 5000);
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Save chatbot state to background
   */
  function saveChatbotState() {
    chrome.runtime.sendMessage({
      type: 'CHATBOT_STATE_SAVE',
      chatbotOpen,
    }).catch(() => {});
  }

  /**
   * Load chatbot state from background
   */
  function loadChatbotState() {
    chrome.runtime.sendMessage({ type: 'CHATBOT_STATE_LOAD' }).then((state) => {
      if (state && state.chatbotOpen) {
        openChatbot();
      }
    }).catch(() => {});
  }

  /**
   * Load conversation history
   */
  function loadConversation() {
    chrome.runtime.sendMessage({ type: 'CHATBOT_GET_CONVERSATION' }).then((response) => {
      if (response && response.conversation && response.conversation.length > 0) {
        const messagesContainer = chatbotOverlay.querySelector('.vitamix-chatbot-messages');
        messagesContainer.innerHTML = '';

        response.conversation.forEach(msg => {
          if (msg.role === 'user') {
            addMessageToUI('user', msg.content);
          } else {
            addMessageToUI('assistant', msg.content, msg.fullPageUrl, msg.relatedTopics);
          }
        });
      }
    }).catch(() => {});
  }

  /**
   * Listen for conversation updates from background
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHATBOT_CONVERSATION_UPDATED') {
      if (chatbotOverlay && chatbotOpen) {
        loadConversation();
      }
      sendResponse({ success: true });
      return false;
    }

    if (message.type === 'TOGGLE_CHATBOT_VISIBILITY') {
      chatbotHidden = !chatbotHidden;
      if (chatbotButton) {
        chatbotButton.style.display = chatbotHidden ? 'none' : 'flex';
      }
      if (chatbotOverlay) {
        chatbotOverlay.style.display = chatbotHidden ? 'none' : 'flex';
        if (chatbotHidden) {
          chatbotOverlay.classList.remove('open');
          chatbotOpen = false;
        }
      }
      sendResponse({ visible: !chatbotHidden });
      return false;
    }

    return false;
  });

  /**
   * Initialize chatbot on vitamix.com only
   */
  function initChatbot() {
    const isVitamixCom = window.location.hostname.includes('vitamix.com');
    if (!isVitamixCom) return;

    // Wait a bit for the page to fully load and original chatbot to appear
    setTimeout(() => {
      injectChatbotButton();
    }, 1000);
  }

  // Initialize signal capture only (no panel auto-injection)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      captureQueryFromUrl();
      setupGenerationCapture();
      initChatbot();
    });
  } else {
    init();
    captureQueryFromUrl();
    setupGenerationCapture();
    initChatbot();
  }
})();
