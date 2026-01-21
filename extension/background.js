/**
 * Background Service Worker
 * Handles signal aggregation, profile management, and cross-tab state
 */

import { ProfileEngine, DEFAULT_PROFILE } from './lib/profile-engine.js';
import { createSignal, getWeightLabel } from './lib/signals.js';

// POC site base URL
const POC_BASE_URL = 'https://main--vitamix-gensite--paolomoz.aem.live';

// Worker API URL for context storage
const WORKER_API_URL = 'https://vitamix-gensite-recommender.paolo-moz.workers.dev';

// Analytics worker URL for self-improve analysis
const ANALYTICS_WORKER_URL = 'https://vitamix-gensite-analytics.paolo-moz.workers.dev';

// Supported domains for the extension
const SUPPORTED_DOMAINS = [
  'vitamix.com',
  'www.vitamix.com',
  'main--vitamix-gensite--paolomoz.aem.live',
];

/**
 * Check if a URL is on a supported domain
 */
function isSupportedDomain(url) {
  if (!url) return false;
  return SUPPORTED_DOMAINS.some(domain => url.includes(domain));
}

// Profile engine instance
let profileEngine = new ProfileEngine();

// Previous queries for conversation history
let previousQueries = [];

// Track session start
let sessionStartTime = Date.now();

/**
 * Initialize on install
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Background] Extension installed');

  // Load any existing profile from storage
  await loadProfileFromStorage();
});

/**
 * Handle extension icon click - open side panel
 * Must be synchronous to preserve user gesture
 */
chrome.action.onClicked.addListener((tab) => {
  if (isSupportedDomain(tab.url)) {
    // Direct call without await to preserve user gesture
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

/**
 * Listen for navigation to supported pages
 * - Enable/disable side panel based on domain
 * - Check for return visits (signals)
 */
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const isSupported = isSupportedDomain(details.url);

  // Enable or disable side panel based on domain
  await chrome.sidePanel.setOptions({
    tabId: details.tabId,
    enabled: isSupported,
  });

  if (!isSupported) return;

  console.log('[Background] Navigation to supported domain:', details.url);

  // Check for return visit (signals)
  await checkReturnVisit();
}, { url: [{ hostContains: 'vitamix.com' }, { hostContains: 'aem.live' }] });

/**
 * Disable side panel on unsupported domains
 */
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  // If not a supported domain, disable the side panel
  if (!isSupportedDomain(details.url)) {
    await chrome.sidePanel.setOptions({
      tabId: details.tabId,
      enabled: false,
    });
  }
});

/**
 * Listen for messages from content script and panel
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message.type);

  switch (message.type) {
    case 'SIGNAL':
      handleSignalMessage(message.data).then(() => {
        sendResponse({ success: true });
      });
      return true;

    case 'GET_PROFILE':
      sendResponse({
        profile: profileEngine.getProfile(),
        signals: profileEngine.getSignals(),
        previousQueries,
      });
      return false;

    case 'CLEAR_SESSION':
      handleClearSession().then(() => {
        sendResponse({ success: true });
      });
      return true;

    case 'GENERATE_PAGE':
      handleGeneratePage(message.query, message.preset).then((result) => {
        sendResponse(result);
      });
      return true;

    case 'LOAD_EXAMPLE':
      handleLoadExample(message.example).then(() => {
        sendResponse({ success: true });
      });
      return true;

    case 'GENERATE_HINT':
      handleGenerateHint().then((result) => {
        sendResponse(result);
      });
      return true;

    case 'HINT_CLICKED':
      // Note: Hint queries are signal-inferred, don't add to history
      // The user didn't type or select this query - it was generated from signals
      handleHintClicked(message.query).then((result) => {
        sendResponse(result);
      });
      return true;

    case 'QUERY_FROM_URL':
      // Add follow-up query from POC site URL to conversation history
      // This captures explicit user choices (clicking follow-up suggestions)
      handleQueryFromUrl(message.query).then(() => {
        sendResponse({ success: true });
      });
      return true;

    case 'PAGE_TIME_UPDATE':
      // Update page_view signal weight based on time on page
      handlePageTimeUpdate(message.data).then(() => {
        sendResponse({ success: true });
      });
      return true;

    case 'GENERATION_DATA':
      // Forward generation data to panel (for Generation Reasoning feature)
      handleGenerationData(message.data);
      sendResponse({ success: true });
      return false;

    // Self-Improve: Analysis handlers
    case 'RUN_ANALYSIS':
      handleRunAnalysis(message.force).then(sendResponse);
      return true;

    case 'GET_CACHED_ANALYSIS':
      handleGetCachedAnalysis().then(sendResponse);
      return true;

    case 'EXECUTE_IMPROVEMENT':
      handleExecuteImprovement(message.improvement, message.pageUrl).then(sendResponse);
      return true;

    case 'EXECUTE_BATCH':
      handleExecuteBatch(message.improvements).then(sendResponse);
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

// Auto-hint configuration
const AUTO_HINT_CONFIDENCE_THRESHOLD = 0.5; // 50% confidence
let lastAutoHintUrl = null; // Prevent duplicate hints on same page

/**
 * Handle signal from content script
 */
async function handleSignalMessage(signalData) {
  console.log('[Background] Signal received:', signalData.type, signalData.data);

  if (!signalData || !signalData.type) {
    console.error('[Background] Invalid signal data:', signalData);
    return;
  }

  const signal = createSignal(signalData.type, signalData.data);
  console.log('[Background] Created signal:', signal.label, '| category:', signal.category);

  if (signal) {
    await addSignal(signal);

    // Auto-trigger hint on page_view if confidence >= threshold
    if (signal.type === 'page_view') {
      await checkAndTriggerAutoHint(signalData.data?.url);
    }
  }
}

/**
 * Notify panel of hint generation status
 */
function notifyHintStatus(status, message = null) {
  try {
    chrome.runtime.sendMessage({
      type: 'HINT_STATUS',
      status, // 'generating' | 'success' | 'error'
      message,
    });
  } catch (e) {
    // Panel might not be open
  }
}

/**
 * Check if we should auto-trigger a hint based on profile confidence
 */
async function checkAndTriggerAutoHint(pageUrl) {
  const profile = profileEngine.getProfile();
  const confidence = profile.confidence_score || 0;

  console.log('[Background] Checking auto-hint: confidence =', confidence, '| threshold =', AUTO_HINT_CONFIDENCE_THRESHOLD);

  // Only trigger if confidence meets threshold
  if (confidence < AUTO_HINT_CONFIDENCE_THRESHOLD) {
    console.log('[Background] Confidence below threshold, skipping auto-hint');
    return;
  }

  // Prevent duplicate hints on the same page
  if (pageUrl && pageUrl === lastAutoHintUrl) {
    console.log('[Background] Already showed hint on this page, skipping');
    return;
  }

  // Don't show hints on the POC site (aem.live) - only on vitamix.com
  if (pageUrl && pageUrl.includes('aem.live')) {
    console.log('[Background] Skipping auto-hint on POC site');
    return;
  }

  console.log('[Background] Auto-triggering hint (confidence:', Math.round(confidence * 100) + '%)');
  lastAutoHintUrl = pageUrl;

  // Notify panel that hint generation is starting
  notifyHintStatus('generating');

  // Small delay to let the page fully render
  await new Promise(resolve => setTimeout(resolve, 1500));

  const result = await handleGenerateHint();
  if (result.success) {
    console.log('[Background] Auto-hint injected successfully');
    notifyHintStatus('success', 'Hint added!');
  } else {
    console.log('[Background] Auto-hint failed:', result.error);
    notifyHintStatus('error', result.error);
    // Reset lastAutoHintUrl on failure so we can retry
    lastAutoHintUrl = null;
  }
}

/**
 * Add signal and notify panel
 */
async function addSignal(signal) {
  console.log('[Background] Adding signal:', signal.label);

  profileEngine.addSignal(signal);
  await saveProfileToStorage();
  await notifyPanel();
}

/**
 * Clear entire session - signals, profile, and conversation history
 */
async function handleClearSession() {
  profileEngine.reset();
  previousQueries = [];
  sessionStartTime = Date.now();
  lastAutoHintUrl = null; // Reset so hints can show again
  await chrome.storage.local.remove(['profile', 'signals', 'previousQueries']);
  await notifyPanel();
}

/**
 * Generate page - store context on worker and navigate
 */
async function handleGeneratePage(query, preset = 'all-cerebras') {
  // Public API always adds query to history
  return handleGeneratePageInternal(query, preset, true);
}

/**
 * Internal generate page function with control over history addition
 * @param {string|null} query - The query to use
 * @param {string} preset - The model preset to use
 * @param {boolean} addToHistory - Whether to add query to conversation history
 */
async function handleGeneratePageInternal(query, preset = 'all-cerebras', addToHistory = true) {
  try {
    // Build full context package
    const context = {
      signals: profileEngine.getSignals(),
      query: query || null,
      previousQueries,
      profile: profileEngine.getProfile(),
      timestamp: Date.now(),
    };

    // If we have a query AND should add to history, add it to conversation history
    // Signal-inferred queries (from hints) set addToHistory=false
    if (addToHistory && query && query.trim()) {
      previousQueries.push(query.trim());
      // Keep only last 10 queries
      if (previousQueries.length > 10) {
        previousQueries = previousQueries.slice(-10);
      }
      await chrome.storage.local.set({ previousQueries });
    }

    // Check if we have any context to send
    const hasContext = context.signals.length > 0 || context.query || context.previousQueries.length > 0;

    if (!hasContext) {
      return { success: false, error: 'No context available. Browse the site or enter a query.' };
    }

    // Store context on worker and get short ID
    const response = await fetch(`${WORKER_API_URL}/store-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    });

    if (!response.ok) {
      throw new Error(`Worker returned ${response.status}`);
    }

    const { id } = await response.json();

    // Navigate to POC site with context ID (same tab for seamless experience)
    const url = `${POC_BASE_URL}/?ctx=${id}&preset=${preset}`;
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
      await chrome.tabs.update(activeTab.id, { url });
    } else {
      chrome.tabs.create({ url });
    }

    // Notify panel of updated state (new query added to history)
    await notifyPanel();

    return { success: true, contextId: id };
  } catch (error) {
    console.error('[Background] Error generating page:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load example scenario
 */
async function handleLoadExample(example) {
  profileEngine.reset();

  profileEngine.profile = {
    ...DEFAULT_PROFILE,
    ...example.inferredProfile,
    first_visit: Date.now() - 60000,
    last_visit: Date.now(),
    signals_count: example.signals.length,
  };

  profileEngine.signals = example.signals.map((s, i) => ({
    id: `example_${i}_${Date.now()}`,
    type: 'example_signal',
    category: 'example',
    label: s.action,
    weight: s.weight === 'Very High' ? 0.20 : s.weight === 'High' ? 0.15 : s.weight === 'Medium' ? 0.10 : 0.05,
    weightLabel: s.weight,
    icon: '📍',
    timestamp: Date.now() - (example.signals.length - i) * 10000,
    data: { signal: s.signal, step: s.step },
  }));

  await saveProfileToStorage();
  await notifyPanel();
}

/**
 * Generate hint via worker API
 */
async function handleGenerateHint() {
  try {
    // Get active tab on supported domain
    const tabs = await chrome.tabs.query({
      active: true,
      url: [
        '*://www.vitamix.com/*',
        '*://vitamix.com/*',
        '*://main--vitamix-gensite--paolomoz.aem.live/*',
      ],
    });

    if (tabs.length === 0) {
      return { success: false, error: 'Open a supported page first (vitamix.com or aem.live)' };
    }

    const tab = tabs[0];

    // Get page sections from content script
    let pageData;
    try {
      pageData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_SECTIONS' });
    } catch (e) {
      console.error('[Background] Failed to get page sections:', e);
      return { success: false, error: 'Could not read page content. Try refreshing the page.' };
    }

    if (!pageData || !pageData.pageContext) {
      return { success: false, error: 'Could not extract page content' };
    }

    // Build hint request
    const hintRequest = {
      pageContext: pageData.pageContext,
      sections: pageData.sections || [],
      profile: profileEngine.getProfile(),
      signals: profileEngine.getSignals().slice(-20), // Last 20 signals
    };

    console.log('[Background] Generating hint for:', pageData.pageContext.url);

    // Call worker API
    const response = await fetch(`${WORKER_API_URL}/generate-hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hintRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Background] Worker error:', errorText);
      throw new Error(`Worker returned ${response.status}`);
    }

    const hintData = await response.json();
    console.log('[Background] Hint generated:', hintData);

    // Send hint to content script for injection
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'INJECT_HINT',
        hintData,
      });
    } catch (e) {
      console.error('[Background] Failed to inject hint:', e);
      return { success: false, error: 'Could not inject hint into page' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Background] Error generating hint:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle hint click - generate page but DON'T add query to conversation history
 * The hint query is signal-inferred (AI-generated from browsing context),
 * not an explicit user choice, so it shouldn't appear in conversation history.
 */
async function handleHintClicked(query) {
  return handleGeneratePageInternal(query, 'all-cerebras', false);
}

/**
 * Handle time update for a page - updates the corresponding page_view signal
 * Time on page increases the weight of the page_view signal (engagement indicator)
 */
async function handlePageTimeUpdate(data) {
  const { url, timeOnPage, seconds } = data;
  if (!url) return;

  // Find the most recent page_view signal for this URL
  const signals = profileEngine.getSignals();
  const pageViewSignal = [...signals].reverse().find(
    s => s.type === 'page_view' && s.data?.url === url
  );

  if (!pageViewSignal) {
    console.log('[Background] No page_view signal found for URL:', url);
    return;
  }

  // Calculate total weight boost based on time spent (not incremental)
  // These are absolute boosts from base weight, not additive
  const timeBoosts = {
    30: 0.02,   // +0.02 from base
    60: 0.04,   // +0.04 from base
    120: 0.06,  // +0.06 from base
    300: 0.08,  // +0.08 from base
  };
  const totalBoost = timeBoosts[seconds] || 0;

  // Store original base weight if not already stored
  if (pageViewSignal.data.baseWeight === undefined) {
    pageViewSignal.data.baseWeight = pageViewSignal.weight;
  }

  // Update the signal - use base weight + total boost (not additive)
  pageViewSignal.data.timeOnPage = timeOnPage;
  pageViewSignal.data.timeSeconds = seconds;
  pageViewSignal.weight = Math.min(0.20, pageViewSignal.data.baseWeight + totalBoost); // Cap at VERY_HIGH
  pageViewSignal.weightLabel = getWeightLabel(pageViewSignal.weight);

  // Update label (remove previous time suffix if present, then add new one)
  const baseLabel = pageViewSignal.label.replace(/\s*\(\d+s\)$/, '');
  pageViewSignal.label = `${baseLabel} (${seconds}s)`;

  console.log('[Background] Updated page_view weight:', pageViewSignal.weight, 'for', url);

  await saveProfileToStorage();
  await notifyPanel();
}

/**
 * Handle generation data from content script
 * Forwards to panel for Generation Reasoning display
 */
function handleGenerationData(data) {
  console.log('[Background] Received generation data:', data?.query);
  // Broadcast to panel
  try {
    chrome.runtime.sendMessage({
      type: 'GENERATION_DATA',
      data,
    });
  } catch (e) {
    // Panel might not be open
    console.log('[Background] Could not forward generation data:', e.message);
  }
}

/**
 * Handle query captured from POC site URL (follow-up clicks)
 * These ARE explicit user choices and SHOULD be in conversation history.
 */
async function handleQueryFromUrl(query) {
  if (!query || !query.trim()) return;

  // Add to conversation history
  previousQueries.push(query.trim());

  // Keep only last 10 queries
  if (previousQueries.length > 10) {
    previousQueries = previousQueries.slice(-10);
  }

  await chrome.storage.local.set({ previousQueries });

  // Notify panel of updated state
  await notifyPanel();

  console.log('[Background] Added follow-up query to history:', query);
}

/**
 * Check for return visit
 */
async function checkReturnVisit() {
  const data = await chrome.storage.local.get(['lastVisitTime']);

  if (data.lastVisitTime) {
    const timeSinceLastVisit = Date.now() - data.lastVisitTime;
    const oneHour = 60 * 60 * 1000;

    if (timeSinceLastVisit > oneHour) {
      const signal = createSignal('referrer', {
        type: 'return_visit',
        timeSinceLastVisit,
        lastVisit: new Date(data.lastVisitTime).toISOString(),
      });
      if (signal) {
        await addSignal(signal);
      }
    }
  }

  await chrome.storage.local.set({ lastVisitTime: Date.now() });
}

/**
 * Load profile and session from storage
 */
async function loadProfileFromStorage() {
  try {
    const data = await chrome.storage.local.get(['profile', 'signals', 'previousQueries']);
    if (data.profile || data.signals) {
      profileEngine.loadFromStorage(data);
      console.log('[Background] Loaded profile from storage');
    }
    if (data.previousQueries) {
      previousQueries = data.previousQueries;
      console.log('[Background] Loaded', previousQueries.length, 'previous queries');
    }
  } catch (e) {
    console.error('[Background] Error loading profile:', e);
  }
}

/**
 * Save profile to storage
 */
async function saveProfileToStorage() {
  try {
    const data = profileEngine.exportForStorage();
    await chrome.storage.local.set({
      profile: data.profile,
      signals: data.signals,
    });
  } catch (e) {
    console.error('[Background] Error saving profile:', e);
  }
}

/**
 * Notify panel of updates
 */
async function notifyPanel() {
  try {
    await chrome.runtime.sendMessage({
      type: 'PROFILE_UPDATED',
      profile: profileEngine.getProfile(),
      signals: profileEngine.getSignals(),
      previousQueries,
    });
  } catch (e) {
    // Panel might not be open
  }
}

// ============================================
// Self-Improve: Analysis and Execution Handlers
// ============================================

/**
 * Run AI analysis on recent pages
 * @param {boolean} force - Bypass rate limiting
 */
async function handleRunAnalysis(force = false) {
  try {
    const url = force
      ? `${ANALYTICS_WORKER_URL}/api/analytics/analyze?force=true`
      : `${ANALYTICS_WORKER_URL}/api/analytics/analyze`;

    const response = await fetch(url, { method: 'POST' });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Analysis failed' };
    }

    const data = await response.json();

    // Broadcast result to panel
    try {
      chrome.runtime.sendMessage({
        type: 'ANALYSIS_RESULT',
        analysis: data.analysis,
        cached: data.cached,
      });
    } catch (e) {
      // Panel might not be open
    }

    return { success: true, analysis: data.analysis, cached: data.cached };
  } catch (error) {
    console.error('[Background] Analysis failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get cached analysis data (if available)
 */
async function handleGetCachedAnalysis() {
  try {
    const response = await fetch(`${ANALYTICS_WORKER_URL}/api/analytics/summary`);

    if (!response.ok) {
      return { success: false, analysis: null };
    }

    const data = await response.json();

    if (data.lastAnalysis && data.lastAnalysis.overallScore !== undefined) {
      return { success: true, analysis: data.lastAnalysis };
    }

    return { success: true, analysis: null };
  } catch (error) {
    console.error('[Background] Failed to get cached analysis:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a single improvement by regenerating the page
 * @param {object} improvement - The improvement suggestion
 * @param {string} pageUrl - The identifier for this improvement (used for tracking state)
 */
async function handleExecuteImprovement(improvement, pageUrl) {
  try {
    // Build an enhanced query based on the improvement
    const enhancedQuery = buildEnhancedQuery(improvement);

    console.log('[Background] Executing improvement:', improvement.text);
    console.log('[Background] Enhanced query:', enhancedQuery);

    // Notify panel that we're starting
    notifyExecutionProgress(pageUrl, 'Analyzing improvement...');

    // Generate the page using the recommender worker
    const context = {
      signals: profileEngine.getSignals(),
      query: enhancedQuery,
      previousQueries,
      profile: profileEngine.getProfile(),
      timestamp: Date.now(),
      improvement: {
        text: improvement.text,
        category: improvement.category,
        impact: improvement.impact,
        effort: improvement.effort,
      },
    };

    // Store context
    notifyExecutionProgress(pageUrl, 'Storing context...');
    const storeResponse = await fetch(`${WORKER_API_URL}/store-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    });

    if (!storeResponse.ok) {
      throw new Error('Failed to store context');
    }

    const { id: contextId } = await storeResponse.json();

    // Generate page with SSE streaming
    notifyExecutionProgress(pageUrl, 'Generating improved page...');

    const generateUrl = `${POC_BASE_URL}/?ctx=${contextId}&preset=all-cerebras`;

    // For now, just navigate to the generated page
    // The SSE streaming happens in the browser, and page auto-persists
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
      await chrome.tabs.update(activeTab.id, { url: generateUrl });
    }

    // Notify completion
    try {
      chrome.runtime.sendMessage({
        type: 'EXECUTION_COMPLETE',
        pageUrl,
        newUrl: generateUrl,
      });
    } catch (e) {
      // Panel might not be open
    }

    return { success: true, newUrl: generateUrl };
  } catch (error) {
    console.error('[Background] Execution failed:', error);

    try {
      chrome.runtime.sendMessage({
        type: 'EXECUTION_ERROR',
        pageUrl,
        error: error.message,
      });
    } catch (e) {
      // Panel might not be open
    }

    return { success: false, error: error.message };
  }
}

/**
 * Execute multiple improvements in batch
 * @param {array} improvements - Array of improvement suggestions
 */
async function handleExecuteBatch(improvements) {
  const results = [];

  for (let i = 0; i < improvements.length; i++) {
    const improvement = improvements[i];
    const pageUrl = `batch_${i}`;

    notifyExecutionProgress(pageUrl, `Processing ${i + 1}/${improvements.length}...`);

    const result = await handleExecuteImprovement(improvement, pageUrl);
    results.push(result);

    // Small delay between executions to avoid rate limiting
    if (i < improvements.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.length - succeeded;

  return {
    success: true,
    results,
    summary: `${succeeded} succeeded, ${failed} failed`,
  };
}

/**
 * Build an enhanced query from an improvement suggestion
 */
function buildEnhancedQuery(improvement) {
  const categoryContext = {
    content: 'focus on content quality and completeness',
    layout: 'focus on visual hierarchy and structure',
    conversion: 'focus on CTAs and conversion optimization',
  };

  // If we have a recent query in history, use it as a base
  const baseQuery = previousQueries.length > 0
    ? previousQueries[previousQueries.length - 1]
    : 'Vitamix products and recipes';

  return `${baseQuery} - ${improvement.text} (${categoryContext[improvement.category] || improvement.category})`;
}

/**
 * Notify panel of execution progress
 */
function notifyExecutionProgress(pageUrl, stage, blockIndex = null) {
  try {
    chrome.runtime.sendMessage({
      type: 'EXECUTION_PROGRESS',
      pageUrl,
      stage,
      blockIndex,
    });
  } catch (e) {
    // Panel might not be open
  }
}
