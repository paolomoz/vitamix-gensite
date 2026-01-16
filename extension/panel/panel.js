/**
 * Panel UI Logic
 * Handles rendering and interaction for the side panel
 */

import { examples, getConfidenceLevel, getWeightColor } from '../lib/examples.js';

// State
let currentProfile = null;
let currentSignals = [];
let currentQuery = null;
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
      currentQuery = message.syntheticQuery;
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

  // Clear button
  document.getElementById('clear-btn').addEventListener('click', async () => {
    if (confirm('Clear all captured signals and profile?')) {
      await chrome.runtime.sendMessage({ type: 'CLEAR_PROFILE' });
      selectedExample = null;
      await refreshState();
    }
  });

  // Settings button (placeholder)
  document.getElementById('settings-btn').addEventListener('click', () => {
    alert('Settings coming soon!');
  });

  // Custom query execution
  const customInput = document.getElementById('custom-input');
  const customExecuteBtn = document.getElementById('custom-execute-btn');

  customExecuteBtn.addEventListener('click', () => {
    executeCustomQuery();
  });

  customInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      executeCustomQuery();
    }
  });
}

/**
 * Execute custom query
 */
function executeCustomQuery() {
  const query = document.getElementById('custom-input').value.trim();
  if (!query) return;

  const preset = document.querySelector('input[name="preset"]:checked').value;

  chrome.runtime.sendMessage({
    type: 'EXECUTE_QUERY',
    query,
    preset,
  });
}

/**
 * Refresh state from background
 */
async function refreshState() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_PROFILE' });
  currentProfile = response.profile;
  currentSignals = response.signals;
  currentQuery = response.syntheticQuery;
  render();
}

/**
 * Render all UI components
 */
function render() {
  renderSignalFeed();
  renderProfile();
  renderQuery();
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

  if (signal.data.query) return `"${signal.data.query}"`;
  if (signal.data.product) return signal.data.product;
  if (signal.data.path) return signal.data.path;
  if (signal.data.signal) return signal.data.signal;
  if (signal.data.referrer) return signal.data.referrer;

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
 * Render synthetic query section
 */
function renderQuery() {
  const container = document.getElementById('query-content');

  if (!currentQuery || !currentQuery.query) {
    const reason = currentQuery?.reason || 'Not enough signals to generate a query';
    const current = currentQuery?.currentConfidence || currentProfile?.confidence_score || 0;

    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">💬</div>
        <p>${reason}</p>
        <p class="hint">Current: ${Math.round(current * 100)}% / Required: 45%</p>
      </div>
    `;
    return;
  }

  const preset = document.querySelector('input[name="preset"]:checked')?.value || 'production';

  container.innerHTML = `
    <div class="query-text">"${currentQuery.query}"</div>
    <div class="query-meta">
      <span>Template: ${currentQuery.template}</span>
      <span>•</span>
      <span>Confidence: ${Math.round(currentQuery.confidence * 100)}%</span>
    </div>
    <button class="btn btn-primary" id="execute-query-btn">
      <span class="icon">▶</span>
      <span>Generate Page</span>
    </button>
  `;

  document.getElementById('execute-query-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'EXECUTE_QUERY',
      query: currentQuery.query,
      preset,
    });
  });
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

        // Expand profile and query sections
        document.querySelector('[data-section="profile"]').classList.remove('collapsed');
        document.querySelector('[data-section="query"]').classList.remove('collapsed');

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
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/[{}[\]]/g, '<span class="json-bracket">$&</span>');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
