/**
 * Background Service Worker
 * Handles signal aggregation, profile management, and cross-tab state
 */

import { ProfileEngine, DEFAULT_PROFILE } from './lib/profile-engine.js';
import { createSignal } from './lib/signals.js';
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
 * Listen for navigation to check for return visits
 */
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (!details.url.includes('vitamix.com')) return;

  console.log('[Background] Navigation to vitamix.com:', details.url);
  await checkReturnVisit();

}, { url: [{ hostContains: 'vitamix.com' }] });

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
function handleExecuteQuery(query, preset = 'all-cerebras', tabId) {
  const url = `${POC_BASE_URL}/?q=${encodeURIComponent(query)}&preset=${preset}`;
  chrome.tabs.create({ url });
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
 * Load profile from storage
 */
async function loadProfileFromStorage() {
  try {
    const data = await chrome.storage.local.get(['profile', 'signals']);
    if (data.profile || data.signals) {
      profileEngine.loadFromStorage(data);
      console.log('[Background] Loaded profile from storage');
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
    // Panel might not be open
  }
}
