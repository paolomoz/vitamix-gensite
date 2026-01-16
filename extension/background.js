/**
 * Background Service Worker
 * Handles signal aggregation, profile management, and cross-tab state
 */

import { ProfileEngine, DEFAULT_PROFILE } from './lib/profile-engine.js';
import { createSignal } from './lib/signals.js';

// POC site base URL
const POC_BASE_URL = 'https://main--vitamix-gensite--paolomoz.aem.live';

// Worker API URL for context storage
const WORKER_API_URL = 'https://vitamix-gensite-recommender.paolo-moz.workers.dev';

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
 * Handle extension icon click - toggle overlay panel on/off
 */
chrome.action.onClicked.addListener(async (tab) => {
  // Only toggle on supported domains
  if (isSupportedDomain(tab.url)) {
    try {
      // Check current panel state on the page
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PANEL_STATE' });
      const isEnabled = response?.enabled;

      if (isEnabled) {
        // Disable panel
        await chrome.tabs.sendMessage(tab.id, { type: 'DISABLE_PANEL' });
        await chrome.storage.local.set({ panelEnabled: false });
        console.log('[Background] Panel disabled');
      } else {
        // Enable panel
        await chrome.tabs.sendMessage(tab.id, { type: 'ENABLE_PANEL' });
        await chrome.storage.local.set({ panelEnabled: true });
        console.log('[Background] Panel enabled');
      }
    } catch (e) {
      console.log('[Background] Could not toggle panel:', e.message);
    }
  }
});

/**
 * Listen for navigation to supported pages
 * - Check for return visits (signals)
 * - Restore panel state if enabled
 */
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (!isSupportedDomain(details.url)) return;

  console.log('[Background] Navigation to supported domain:', details.url);

  // Check for return visit (signals)
  await checkReturnVisit();

  // Check if panel should be enabled (restore state)
  const data = await chrome.storage.local.get(['panelEnabled']);
  if (data.panelEnabled) {
    try {
      await chrome.tabs.sendMessage(details.tabId, { type: 'ENABLE_PANEL' });
      console.log('[Background] Panel restored on navigation');
    } catch (e) {
      // Content script may not be ready yet, retry after a delay
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(details.tabId, { type: 'ENABLE_PANEL' });
        } catch (e2) {
          console.log('[Background] Could not restore panel:', e2.message);
        }
      }, 500);
    }
  }
}, { url: [{ hostContains: 'vitamix.com' }, { hostContains: 'aem.live' }] });

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
      handleHintClicked(message.query).then((result) => {
        sendResponse(result);
      });
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

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
  await chrome.storage.local.remove(['profile', 'signals', 'previousQueries']);
  await notifyPanel();
}

/**
 * Generate page - store context on worker and navigate
 */
async function handleGeneratePage(query, preset = 'all-cerebras') {
  try {
    // Build full context package
    const context = {
      signals: profileEngine.getSignals(),
      query: query || null,
      previousQueries,
      profile: profileEngine.getProfile(),
      timestamp: Date.now(),
    };

    // If we have a query, add it to conversation history
    if (query && query.trim()) {
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

    // Navigate to POC site with context ID
    const url = `${POC_BASE_URL}/?ctx=${id}&preset=${preset}`;
    chrome.tabs.create({ url });

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
 * Handle hint click - same as generate page but with hint query
 */
async function handleHintClicked(query) {
  return handleGeneratePage(query, 'all-cerebras');
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
