/**
 * Panel UI Logic
 * Handles rendering and interaction for the side panel
 */

import { examples, getConfidenceLevel, getWeightColor } from '../lib/examples.js';

// State
let currentProfile = null;
let currentSignals = [];
let previousQueries = [];
let selectedExample = null;

/**
 * Initialize panel
 */
async function init() {
  console.log('[Panel] Initializing');

  // Set up event listeners
  setupEventListeners();

  // Render examples
  renderExamples();

  // Get initial state from background
  await refreshState();

  // Listen for updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PROFILE_UPDATED') {
      currentProfile = message.profile;
      currentSignals = message.signals;
      previousQueries = message.previousQueries || [];
      render();
    }
  });

  console.log('[Panel] Initialized');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Section toggles
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.panel-section');
      section.classList.toggle('collapsed');
    });
  });

  // Clear session button
  document.getElementById('clear-btn').addEventListener('click', async () => {
    if (confirm('Clear all signals, profile, and conversation history?')) {
      await chrome.runtime.sendMessage({ type: 'CLEAR_SESSION' });
      selectedExample = null;
      await refreshState();
    }
  });

  // Settings button (placeholder)
  document.getElementById('settings-btn').addEventListener('click', () => {
    alert('Settings coming soon!');
  });

  // Copy signals button
  document.getElementById('copy-signals-btn').addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent section toggle
    copySignalsToClipboard();
  });

  // Generate page button
  document.getElementById('generate-btn').addEventListener('click', () => {
    handleGenerate();
  });

  // Add AI Hint button
  document.getElementById('add-hint-btn').addEventListener('click', () => {
    handleAddHint();
  });

  // Query input keyboard shortcut
  const queryInput = document.getElementById('query-input');
  queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  });
}

/**
 * Handle generate page
 */
async function handleGenerate() {
  const query = document.getElementById('query-input').value.trim();
  const btn = document.getElementById('generate-btn');

  // Disable button while processing
  btn.disabled = true;
  btn.innerHTML = '<span class="icon">⏳</span><span>Generating...</span>';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_PAGE',
      query: query || null,
      preset: 'all-cerebras',
    });

    if (!response.success) {
      alert(response.error || 'Failed to generate page');
    } else {
      // Clear the query input after successful generation
      document.getElementById('query-input').value = '';
    }
  } catch (error) {
    console.error('[Panel] Generate error:', error);
    alert('Failed to generate page: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="icon">▶</span><span>Generate Page</span>';
  }
}

/**
 * Handle add AI hint to vitamix.com page
 */
async function handleAddHint() {
  const btn = document.getElementById('add-hint-btn');
  const statusEl = document.getElementById('hint-status');

  // Disable button while processing
  btn.disabled = true;
  btn.innerHTML = '<span class="icon">⏳</span><span>Generating...</span>';
  statusEl.textContent = 'Generating hint...';
  statusEl.className = 'hint-status hint-status-loading';

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GENERATE_HINT' });

    if (response.success) {
      statusEl.textContent = 'Hint added to page!';
      statusEl.className = 'hint-status hint-status-success';
      // Clear status after 3 seconds
      setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'hint-status';
      }, 3000);
    } else {
      statusEl.textContent = response.error || 'Failed to generate hint';
      statusEl.className = 'hint-status hint-status-error';
    }
  } catch (error) {
    console.error('[Panel] Hint error:', error);
    statusEl.textContent = 'Failed: ' + error.message;
    statusEl.className = 'hint-status hint-status-error';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="icon">✨</span><span>Add AI Hint</span>';
    updateHintButton();
  }
}

/**
 * Update hint button enabled state
 */
function updateHintButton() {
  const btn = document.getElementById('add-hint-btn');
  // Enable only if we have signals (need context for hint generation)
  btn.disabled = currentSignals.length < 1;
}

/**
 * Refresh state from background
 */
async function refreshState() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_PROFILE' });
  currentProfile = response.profile;
  currentSignals = response.signals;
  previousQueries = response.previousQueries || [];
  render();
}

/**
 * Render all UI components
 */
function render() {
  renderSignalFeed();
  renderProfile();
  renderHistory();
  renderContextSummary();
  updateHintButton();
}

/**
 * Render signal feed
 */
function renderSignalFeed() {
  const container = document.getElementById('signal-feed');
  const countBadge = document.getElementById('signal-count');

  countBadge.textContent = currentSignals.length;

  if (currentSignals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📡</div>
        <p>No signals captured yet</p>
        <p class="hint">Browse vitamix.com to capture signals</p>
      </div>
    `;
    return;
  }

  // Sort by timestamp, newest first (but show up to 50)
  const signalsToShow = [...currentSignals]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);

  container.innerHTML = signalsToShow.map(signal => {
    const time = formatTime(signal.timestamp);
    const weightClass = getWeightClassFromLabel(signal.weightLabel);
    const detail = getSignalDetail(signal);

    return `
      <div class="signal-item">
        <span class="signal-icon">${signal.icon || '📍'}</span>
        <div class="signal-content">
          <div class="signal-label">${signal.label}</div>
          ${detail ? `<div class="signal-detail">${detail}</div>` : ''}
        </div>
        <div class="signal-meta">
          <span class="signal-weight ${weightClass}">${signal.weightLabel}</span>
          <span class="signal-time">${time}</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Get signal detail text
 */
function getSignalDetail(signal) {
  if (!signal.data) return null;

  // Product from classification
  if (signal.product) return signal.product;

  // Search query
  if (signal.data.query) return `"${signal.data.query}"`;

  // Click text or href
  if (signal.type === 'click') {
    if (signal.data.text) return signal.data.text;
    if (signal.data.href) return new URL(signal.data.href, 'https://vitamix.com').pathname;
  }

  // Page view - show h1 or path
  if (signal.type === 'page_view') {
    if (signal.data.h1) return signal.data.h1;
    if (signal.data.path) return signal.data.path;
  }

  // Scroll depth
  if (signal.data.depth) return `${signal.data.depth}%`;

  // Referrer
  if (signal.data.domain) return signal.data.domain;
  if (signal.data.type === 'direct') return 'Direct visit';

  // Time on page
  if (signal.data.seconds) return `${signal.data.seconds}s`;

  // Generic path fallback
  if (signal.data.path) return signal.data.path;

  // Example signals
  if (signal.data.signal) return signal.data.signal;

  return null;
}

/**
 * Render profile
 */
function renderProfile() {
  const container = document.getElementById('profile-content');

  if (!currentProfile || currentProfile.signals_count === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">👤</div>
        <p>Profile will appear as signals are captured</p>
      </div>
    `;
    return;
  }

  const confidence = currentProfile.confidence_score;
  const confidencePercent = Math.round(confidence * 100);
  const confidenceLevel = getConfidenceLevel(confidence);
  const confidenceClass = confidence >= 0.56 ? 'high' : confidence >= 0.31 ? 'medium' : 'low';

  container.innerHTML = `
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-confidence">
          <div class="confidence-label">
            <span>Confidence</span>
            <span class="confidence-badge ${confidenceLevel.color}">${confidencePercent}%</span>
          </div>
          <div class="confidence-bar">
            <div class="confidence-fill ${confidenceClass}" style="width: ${confidencePercent}%"></div>
          </div>
        </div>
      </div>

      ${renderProfileSection('Segments', currentProfile.segments, true)}
      ${renderProfileSection('Use Cases', currentProfile.use_cases)}
      ${renderProductsSection()}
      ${renderAttributesSection()}
      ${renderJsonSection()}
    </div>
  `;
}

/**
 * Render a profile section with tags
 */
function renderProfileSection(title, items, primary = false) {
  if (!items || items.length === 0) return '';

  return `
    <div class="profile-section">
      <div class="profile-section-title">${title}</div>
      <div class="tags">
        ${items.map(item => `<span class="tag ${primary ? 'primary' : ''}">${formatLabel(item)}</span>`).join('')}
      </div>
    </div>
  `;
}

/**
 * Render products section
 */
function renderProductsSection() {
  const products = currentProfile.products_considered;
  if (!products || products.length === 0) return '';

  return `
    <div class="profile-section">
      <div class="profile-section-title">Products Considered</div>
      <div class="products-list">
        ${products.map(p => `
          <div class="product-item">
            <span class="product-icon">📦</span>
            <span class="product-name">${p}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render attributes section
 */
function renderAttributesSection() {
  const attrs = [];

  if (currentProfile.life_stage) attrs.push({ label: 'Life Stage', value: formatLabel(currentProfile.life_stage) });
  if (currentProfile.decision_style) attrs.push({ label: 'Decision Style', value: formatLabel(currentProfile.decision_style) });
  if (currentProfile.price_sensitivity) attrs.push({ label: 'Price Sensitivity', value: formatLabel(currentProfile.price_sensitivity) });
  if (currentProfile.purchase_readiness) attrs.push({ label: 'Purchase Readiness', value: formatLabel(currentProfile.purchase_readiness) });
  if (currentProfile.brand_relationship) attrs.push({ label: 'Brand Relationship', value: formatLabel(currentProfile.brand_relationship) });

  if (attrs.length === 0) return '';

  return `
    <div class="profile-section">
      <div class="profile-section-title">Attributes</div>
      <div class="tags">
        ${attrs.map(a => `<span class="tag">${a.label}: ${a.value}</span>`).join('')}
      </div>
    </div>
  `;
}

/**
 * Render JSON section
 */
function renderJsonSection() {
  // Filter out empty/null values for cleaner display
  const cleanProfile = {};
  for (const [key, value] of Object.entries(currentProfile)) {
    if (value !== null && value !== undefined && (!Array.isArray(value) || value.length > 0)) {
      cleanProfile[key] = value;
    }
  }

  return `
    <div class="profile-section">
      <div class="profile-section-title">Raw Profile</div>
      <div class="json-block">${formatJSON(cleanProfile)}</div>
    </div>
  `;
}

/**
 * Render conversation history
 */
function renderHistory() {
  const container = document.getElementById('history-content');
  const countBadge = document.getElementById('history-count');

  countBadge.textContent = previousQueries.length;

  if (previousQueries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">💬</div>
        <p>No previous queries</p>
        <p class="hint">Generate pages to build conversation history</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="history-list">
      ${previousQueries.map((query, i) => `
        <div class="history-item">
          <span class="icon">${i + 1}.</span>
          <span class="text">${escapeHtml(query)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render context summary
 */
function renderContextSummary() {
  const container = document.getElementById('context-summary');
  const btn = document.getElementById('generate-btn');
  const queryInput = document.getElementById('query-input');

  const parts = [];

  if (currentSignals.length > 0) {
    parts.push(`${currentSignals.length} signal${currentSignals.length !== 1 ? 's' : ''}`);
  }

  if (previousQueries.length > 0) {
    parts.push(`${previousQueries.length} previous quer${previousQueries.length !== 1 ? 'ies' : 'y'}`);
  }

  // Check if query input has text
  const hasQuery = queryInput.value.trim().length > 0;
  if (hasQuery) {
    parts.push('1 new query');
  }

  if (parts.length === 0) {
    container.textContent = 'No context available - browse vitamix.com or enter a query';
    btn.disabled = true;
  } else {
    container.textContent = `Context: ${parts.join(' • ')}`;
    btn.disabled = false;
  }
}

/**
 * Render examples grid
 */
function renderExamples() {
  const container = document.getElementById('examples-grid');

  container.innerHTML = examples.map(example => {
    const confidence = getConfidenceLevel(example.inferredProfile.confidence_score);
    const confidencePercent = Math.round(example.inferredProfile.confidence_score * 100);

    return `
      <div class="example-card" data-id="${example.id}">
        <div class="example-header">
          <span class="example-icon">${example.icon}</span>
          <span class="example-name">${example.name}</span>
          <span class="example-version">${example.version}</span>
        </div>
        <div class="example-meta">
          <span>${example.signals.length} signals</span>
          <span class="confidence-badge ${confidence.color}">${confidencePercent}%</span>
        </div>
        <div class="example-persona">${example.persona}</div>
      </div>
    `;
  }).join('');

  // Bind click events
  container.querySelectorAll('.example-card').forEach(card => {
    card.addEventListener('click', async () => {
      const exampleId = card.dataset.id;
      const example = examples.find(e => e.id === exampleId);

      if (example) {
        // Update selection state
        container.querySelectorAll('.example-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedExample = example;

        // Load example into profile
        await chrome.runtime.sendMessage({
          type: 'LOAD_EXAMPLE',
          example,
        });

        // Expand profile section
        document.querySelector('[data-section="profile"]').classList.remove('collapsed');

        await refreshState();
      }
    });
  });
}

/**
 * Format timestamp to relative time
 */
function formatTime(timestamp) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 10) return `${seconds}s ago`;
  return 'now';
}

/**
 * Format snake_case to Title Case
 */
function formatLabel(str) {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get weight class from label
 */
function getWeightClassFromLabel(label) {
  switch (label) {
    case 'Very High': return 'weight-very-high';
    case 'High': return 'weight-high';
    case 'Medium': return 'weight-medium';
    default: return 'weight-low';
  }
}

/**
 * Format JSON with syntax highlighting
 */
function formatJSON(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/[{}[\]]/g, '<span class="json-bracket">$&</span>');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Copy raw signals to clipboard
 */
async function copySignalsToClipboard() {
  const btn = document.getElementById('copy-signals-btn');

  if (currentSignals.length === 0) {
    btn.textContent = '❌';
    setTimeout(() => { btn.textContent = '📋'; }, 1000);
    return;
  }

  try {
    const rawSignals = JSON.stringify(currentSignals, null, 2);
    await navigator.clipboard.writeText(rawSignals);
    btn.textContent = '✅';
    setTimeout(() => { btn.textContent = '📋'; }, 1000);
    console.log('[Panel] Copied', currentSignals.length, 'signals to clipboard');
  } catch (err) {
    console.error('[Panel] Failed to copy:', err);
    btn.textContent = '❌';
    setTimeout(() => { btn.textContent = '📋'; }, 1000);
  }
}

// Update context summary when query input changes
document.addEventListener('DOMContentLoaded', () => {
  const queryInput = document.getElementById('query-input');
  if (queryInput) {
    queryInput.addEventListener('input', renderContextSummary);
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
