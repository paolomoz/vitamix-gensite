/**
 * Background Service Worker
 * Handles signal aggregation, profile management, and cross-tab state
 */

import { ProfileEngine, DEFAULT_PROFILE } from './lib/profile-engine.js';
import { createSignal, detectPageType, extractProductName, SIGNAL_TYPES } from './lib/signals.js';
import { generateQuery } from './lib/query-generator.js';

// POC site base URL
const POC_BASE_URL = 'https://main--vitamix-gensite--paolomoz.aem.live';

// Profile engine instance
let profileEngine = new ProfileEngine();

// Track session start
let sessionStartTime = Date.now();

/**
 * Initialize on install
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Background] Extension installed');

  // Load any existing profile from storage
  await loadProfileFromStorage();

  // Set up side panel behavior
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

/**
 * Handle extension icon click - open side panel
 */
chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

/**
 * Listen for navigation events to detect page views
 */
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Only main frame, vitamix.com
  if (details.frameId !== 0) return;

  const url = details.url;
  if (!url.includes('vitamix.com')) return;

  console.log('[Background] Navigation completed:', url);

  // Detect page type from URL
  const pageInfo = detectPageType(url);
  if (pageInfo) {
    const { signalType, match, path } = pageInfo;
    const signalData = { url, path };

    // Extract additional data based on signal type
    if (signalType.id === 'product_page_view') {
      signalData.product = extractProductName(path);
    }

    const signal = createSignal(signalType, signalData);
    if (signal) {
      await addSignal(signal);
    }
  }

  // Check for return visit
  await checkReturnVisit();

}, { url: [{ hostContains: 'vitamix.com' }] });

/**
 * Listen for messages from content script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message.type);

  switch (message.type) {
    case 'SIGNAL':
      handleSignalMessage(message.data).then(() => {
        sendResponse({ success: true });
      });
      return true; // Keep channel open for async response

    case 'GET_PROFILE':
      sendResponse({
        profile: profileEngine.getProfile(),
        signals: profileEngine.getSignals(),
        syntheticQuery: generateQuery(profileEngine.getProfile(), profileEngine.getSignals()),
      });
      return false;

    case 'CLEAR_PROFILE':
      handleClearProfile().then(() => {
        sendResponse({ success: true });
      });
      return true;

    case 'EXECUTE_QUERY':
      handleExecuteQuery(message.query, message.preset, sender.tab?.id);
      sendResponse({ success: true });
      return false;

    case 'LOAD_EXAMPLE':
      handleLoadExample(message.example).then(() => {
        sendResponse({ success: true });
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
  console.log('[Background] handleSignalMessage received:', signalData);

  if (!signalData || !signalData.type) {
    console.error('[Background] Invalid signal data:', signalData);
    return;
  }

  const signal = createSignal(signalData.type, signalData.data);
  console.log('[Background] createSignal result:', signal);

  if (signal) {
    await addSignal(signal);
  } else {
    console.error('[Background] Failed to create signal for type:', signalData.type);
  }
}

/**
 * Add signal and notify panel
 */
async function addSignal(signal) {
  console.log('[Background] Adding signal:', signal.type, signal.data);

  profileEngine.addSignal(signal);
  await saveProfileToStorage();
  await notifyPanel();
}

/**
 * Clear profile
 */
async function handleClearProfile() {
  profileEngine.reset();
  sessionStartTime = Date.now();
  await chrome.storage.local.remove(['profile', 'signals']);
  await notifyPanel();
}

/**
 * Execute query - open POC site with query
 */
function handleExecuteQuery(query, preset = 'production', tabId) {
  const url = `${POC_BASE_URL}/?q=${encodeURIComponent(query)}&preset=${preset}`;

  // Open in new tab
  chrome.tabs.create({ url });
}

/**
 * Load example scenario
 */
async function handleLoadExample(example) {
  // Reset current profile
  profileEngine.reset();

  // Set profile from example
  profileEngine.profile = {
    ...DEFAULT_PROFILE,
    ...example.inferredProfile,
    first_visit: Date.now() - 60000, // 1 minute ago
    last_visit: Date.now(),
    signals_count: example.signals.length,
  };

  // Convert example signals to our format (for display)
  profileEngine.signals = example.signals.map((s, i) => ({
    id: `example_${i}_${Date.now()}`,
    type: 'example_signal',
    label: s.action,
    weight: s.weight === 'Very High' ? 0.20 : s.weight === 'High' ? 0.15 : s.weight === 'Medium' ? 0.10 : 0.05,
    weightLabel: s.weight,
    icon: '📍',
    tier: 1,
    timestamp: Date.now() - (example.signals.length - i) * 10000,
    data: { signal: s.signal, step: s.step },
  }));

  await saveProfileToStorage();
  await notifyPanel();
}

/**
 * Check for return visit
 */
async function checkReturnVisit() {
  const data = await chrome.storage.local.get(['lastVisitTime']);

  if (data.lastVisitTime) {
    const timeSinceLastVisit = Date.now() - data.lastVisitTime;
    const oneHour = 60 * 60 * 1000;

    // If more than an hour since last visit, it's a return visit
    if (timeSinceLastVisit > oneHour) {
      const signal = createSignal(SIGNAL_TYPES.RETURN_VISIT, {
        timeSinceLastVisit,
        lastVisit: new Date(data.lastVisitTime).toISOString(),
      });
      if (signal) {
        await addSignal(signal);
      }
    }
  }

  // Update last visit time
  await chrome.storage.local.set({ lastVisitTime: Date.now() });
}

/**
 * Load profile from storage
 */
async function loadProfileFromStorage() {
  try {
    const data = await chrome.storage.local.get(['profile', 'signals']);
    if (data.profile || data.signals) {
      profileEngine.loadFromStorage(data);
      console.log('[Background] Loaded profile from storage:', profileEngine.getProfile());
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
      syntheticQuery: generateQuery(profileEngine.getProfile(), profileEngine.getSignals()),
    });
  } catch (e) {
    // Panel might not be open, that's ok
  }
}
