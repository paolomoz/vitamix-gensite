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
let generationData = null;
let previousConfidence = 0; // Track for animation

// Self-Improve state
let analysisResults = null;
let analysisLoading = false;
let executionState = {}; // { [pageUrl]: { status: 'pending'|'executing'|'complete'|'error', message: string } }

// Insights state
let insightsData = null;

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

    if (message.type === 'GENERATION_DATA') {
      generationData = message.data;
      renderGenerationReasoning();
    }

    // Self-Improve messages
    if (message.type === 'ANALYSIS_RESULT') {
      analysisResults = message.analysis;
      analysisLoading = false;
      renderImproveView();
    }

    if (message.type === 'EXECUTION_PROGRESS') {
      executionState[message.pageUrl] = {
        status: 'executing',
        message: message.stage,
        blockIndex: message.blockIndex,
      };
      renderImproveView();
    }

    if (message.type === 'EXECUTION_COMPLETE') {
      executionState[message.pageUrl] = {
        status: 'complete',
        message: 'Completed',
        newUrl: message.newUrl,
      };
      renderImproveView();
    }

    if (message.type === 'EXECUTION_ERROR') {
      executionState[message.pageUrl] = {
        status: 'error',
        message: message.error,
      };
      renderImproveView();
    }

    // Hint generation status (for auto-triggered hints)
    if (message.type === 'HINT_STATUS') {
      handleHintStatusUpdate(message.status, message.message);
    }
  });

  console.log('[Panel] Initialized');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Navigation tabs - switch between Intent Inference, Generation Reasoning, and Self-Improve views
  document.getElementById('tab-inference').addEventListener('click', () => switchView('inference'));
  document.getElementById('tab-generation').addEventListener('click', () => switchView('generation'));
  document.getElementById('tab-improve').addEventListener('click', () => {
    switchView('improve');
    // Fetch analysis data when switching to improve tab
    fetchAnalysisData();
  });

  document.getElementById('tab-insights').addEventListener('click', () => {
    switchView('insights');
    loadInsightsData();
  });

  // Section toggles (within each view)
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.panel-section');
      section.classList.toggle('collapsed');
    });
  });

  // Infographic button - opens Content Generation Spectrum in new tab
  document.getElementById('infographic-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/infographic/content-generation.html' });
  });

  // Clear session button
  document.getElementById('clear-btn').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_SESSION' });
    selectedExample = null;
    generationData = null;
    previousConfidence = 0; // Reset confidence tracking for animations
    // Reset generation view to empty state
    renderGenerationReasoning();
    // Switch back to inference view
    switchView('inference');
    await refreshState();
  });

  // Generate page button
  document.getElementById('generate-btn').addEventListener('click', () => {
    handleGenerate();
  });

  // Add AI Hint button
  document.getElementById('add-hint-btn').addEventListener('click', () => {
    handleAddHint();
  });

  // Toggle Chatbot button
  document.getElementById('toggle-chatbot-btn').addEventListener('click', () => {
    handleToggleChatbot();
  });

  // Query input keyboard shortcut
  const queryInput = document.getElementById('query-input');
  queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  });

  // Global keyboard shortcut for hint generation (Cmd/Ctrl + .)
  document.addEventListener('keydown', (e) => {
    if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      // Only trigger if we have signals (button would be enabled)
      if (currentSignals.length >= 1) {
        handleAddHint();
      }
    }
  });
}

/**
 * Switch between views (inference / generation / improve)
 */
function switchView(viewId) {
  // Update tab active states and get the active tab's title
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const isActive = tab.id === `tab-${viewId}`;
    tab.classList.toggle('active', isActive);
    if (isActive) {
      // Update header title from data-title attribute
      const title = tab.dataset.title || viewId;
      document.getElementById('panel-title').textContent = title;
    }
  });

  // Update view visibility
  document.querySelectorAll('.panel-view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewId}`);
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
  btn.innerHTML = '<svg class="icon icon-loading"><use href="#icon-loading"/></svg>';

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
    btn.innerHTML = '<svg class="icon"><use href="#icon-play"/></svg>';
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
  btn.innerHTML = '<svg class="icon icon-loading"><use href="#icon-loading"/></svg>';
  statusEl.textContent = 'Generating hint...';
  statusEl.className = 'hint-status hint-status-loading';

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GENERATE_HINT' });

    if (response.success) {
      statusEl.textContent = 'Hint added!';
      statusEl.className = 'hint-status hint-status-success';
      // Clear status after 3 seconds
      setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'hint-status';
      }, 3000);
    } else {
      statusEl.textContent = response.error || 'Failed';
      statusEl.className = 'hint-status hint-status-error';
    }
  } catch (error) {
    console.error('[Panel] Hint error:', error);
    statusEl.textContent = 'Failed: ' + error.message;
    statusEl.className = 'hint-status hint-status-error';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg class="icon"><use href="#icon-sparkle"/></svg>';
    updateHintButton();
  }
}

/**
 * Handle toggle chatbot visibility on vitamix.com
 */
async function handleToggleChatbot() {
  const btn = document.getElementById('toggle-chatbot-btn');

  try {
    const response = await chrome.runtime.sendMessage({ type: 'TOGGLE_CHATBOT' });

    if (response.success) {
      // Update button appearance based on chatbot visibility
      btn.classList.toggle('active', response.visible);
      btn.title = response.visible ? 'Hide Chatbot' : 'Show Chatbot';
    }
  } catch (error) {
    console.error('[Panel] Toggle chatbot error:', error);
  }
}

/**
 * Update hint button enabled state
 */
function updateHintButton() {
  const btn = document.getElementById('add-hint-btn');
  // Enable only if we have signals (need context for hint generation)
  // But don't change disabled state if currently generating
  if (!btn.classList.contains('generating')) {
    btn.disabled = currentSignals.length < 1;
  }
}

/**
 * Handle hint status updates from background (for auto-triggered hints)
 */
function handleHintStatusUpdate(status, message) {
  const btn = document.getElementById('add-hint-btn');
  const statusEl = document.getElementById('hint-status');

  if (status === 'generating') {
    btn.disabled = true;
    btn.classList.add('generating');
    btn.innerHTML = '<svg class="icon icon-loading"><use href="#icon-loading"/></svg>';
    statusEl.textContent = 'Generating hint...';
    statusEl.className = 'hint-status hint-status-loading';
  } else if (status === 'success') {
    btn.classList.remove('generating');
    btn.disabled = false;
    btn.innerHTML = '<svg class="icon"><use href="#icon-sparkle"/></svg>';
    statusEl.textContent = message || 'Hint added!';
    statusEl.className = 'hint-status hint-status-success';
    // Clear status after 3 seconds
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'hint-status';
    }, 3000);
    updateHintButton();
  } else if (status === 'error') {
    btn.classList.remove('generating');
    btn.disabled = false;
    btn.innerHTML = '<svg class="icon"><use href="#icon-sparkle"/></svg>';
    statusEl.textContent = message || 'Failed';
    statusEl.className = 'hint-status hint-status-error';
    updateHintButton();
  }
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
        <svg class="icon icon-lg"><use href="#icon-broadcast"/></svg>
        <p>No signals captured yet</p>
        <p class="hint">Browse the site to capture signals</p>
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
    const iconId = getSignalIconId(signal.type);

    return `
      <div class="signal-item">
        <svg class="icon signal-icon"><use href="#icon-${iconId}"/></svg>
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
 * Map signal type to SVG icon ID
 */
function getSignalIconId(type) {
  const iconMap = {
    page_view: 'pin',
    click: 'target',
    scroll: 'chevron-down',
    search: 'edit',
    time_on_page: 'loading',
    referrer: 'broadcast',
    example: 'sparkle',
  };
  return iconMap[type] || 'pin';
}

/**
 * Map example emoji to SVG icon ID
 */
function getExampleIconId(emoji) {
  const iconMap = {
    '👶': 'user',
    '🎁': 'box',
    '🏥': 'user',
    '💪': 'target',
    '🌱': 'sparkle',
    '👨‍🍳': 'settings', // Professional chef
    '🔄': 'loading',
    '❓': 'chat',
  };
  return iconMap[emoji] || 'sparkle';
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
    previousConfidence = 0;
    container.innerHTML = `
      <div class="empty-state">
        <svg class="icon icon-lg"><use href="#icon-user"/></svg>
        <p>Profile will appear as signals are captured</p>
      </div>
    `;
    return;
  }

  const confidence = currentProfile.confidence_score;
  const confidencePercent = Math.round(confidence * 100);
  const previousPercent = Math.round(previousConfidence * 100);
  const confidenceLevel = getConfidenceLevel(confidence);
  const confidenceClass = confidence >= 0.56 ? 'high' : confidence >= 0.31 ? 'medium' : 'low';
  const confidenceChanged = confidencePercent !== previousPercent;
  const confidenceIncreased = confidencePercent > previousPercent;

  container.innerHTML = `
    <div class="profile-card">
      <!-- Large Confidence Display for Demo -->
      <div class="confidence-hero ${confidenceChanged ? 'confidence-changed' : ''} ${confidenceIncreased ? 'confidence-increased' : ''}">
        <div class="confidence-hero-value ${confidenceClass}">
          <span class="confidence-number">${confidencePercent}</span>
          <span class="confidence-percent">%</span>
        </div>
        <div class="confidence-hero-label">Confidence</div>
        <div class="confidence-hero-bar">
          <div class="confidence-fill ${confidenceClass}" style="width: ${confidencePercent}%"></div>
        </div>
        ${confidenceChanged && previousPercent > 0 ? `
          <div class="confidence-change ${confidenceIncreased ? 'up' : 'down'}">
            ${confidenceIncreased ? '↑' : '↓'} ${Math.abs(confidencePercent - previousPercent)}%
          </div>
        ` : ''}
      </div>

      ${renderProfileSection('Segments', currentProfile.segments, true)}
      ${currentProfile.life_stage ? renderProfileField('Life Stage', currentProfile.life_stage) : ''}
      ${renderProfileSection('Use Cases', currentProfile.use_cases)}
      ${renderProductsSection()}
      ${renderAttributesSection()}
      ${renderJsonSection()}
    </div>
  `;

  // Update previous confidence for next render
  previousConfidence = confidence;
}

/**
 * Render a single profile field (key: value)
 */
function renderProfileField(label, value) {
  if (!value) return '';
  return `
    <div class="profile-section profile-field">
      <span class="profile-field-label">${label}:</span>
      <span class="profile-field-value">${formatLabel(value)}</span>
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
            <svg class="icon product-icon"><use href="#icon-box"/></svg>
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
        <svg class="icon icon-lg"><use href="#icon-chat"/></svg>
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
    container.textContent = 'No context available - browse the site or enter a query';
    btn.disabled = true;
  } else {
    container.textContent = `Context: ${parts.join(' • ')}`;
    btn.disabled = false;
  }
}

/**
 * Render Generation Reasoning view
 * Shows reasoning steps, confidence, and block rationales from AI generation
 */
function renderGenerationReasoning() {
  const container = document.getElementById('generation-content');

  if (!generationData) {
    // Show empty state
    container.innerHTML = `
      <div class="empty-state">
        <svg class="icon icon-lg"><use href="#icon-sparkle"/></svg>
        <p>No generation data available</p>
        <p class="hint">Navigate to a generated page (?q= URL) to see reasoning</p>
      </div>
    `;
    return;
  }

  const {
    query,
    reasoningSteps = [],
    reasoningComplete,
    blockRationales = [],
    intent,
    reasoning,
    recommendations,
    duration,
  } = generationData;

  // Format duration
  const durationSec = duration ? (duration / 1000).toFixed(1) : '?';

  // Build reasoning steps HTML - full content, no truncation
  const stepsHtml = reasoningSteps.map(step => {
    const iconId = getReasoningStageIcon(step.stage);
    return `
      <div class="reasoning-step">
        <svg class="icon reasoning-step-icon"><use href="#icon-${iconId}"/></svg>
        <div class="reasoning-step-content">
          <div class="reasoning-step-stage">${formatLabel(step.stage)}</div>
          ${step.title ? `<div class="reasoning-step-title">${escapeHtml(step.title)}</div>` : ''}
          ${step.content ? `<div class="reasoning-step-detail">${escapeHtml(step.content)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Build block rationales HTML - full content, no truncation
  const rationalesHtml = blockRationales.map(br => `
    <div class="block-rationale-item">
      <span class="block-type-tag">${br.blockType}</span>
      <span class="block-rationale-text">${escapeHtml(br.rationale)}</span>
    </div>
  `).join('');

  // Build confidence display
  const confidence = reasoning?.confidence || reasoningComplete?.confidence;
  const confidencePercent = confidence ? Math.round(confidence * 100) : null;
  const confidenceClass = confidence >= 0.7 ? 'high' : confidence >= 0.4 ? 'medium' : 'low';

  // Build block types tags
  const blockTypes = recommendations?.blockTypes || [];
  const blockTypesHtml = blockTypes.map(type => `<span class="block-type-tag">${type}</span>`).join('');

  container.innerHTML = `
    <div class="generation-reasoning-card">
      <!-- Query -->
      <div class="gen-section">
        <div class="gen-section-title">Query</div>
        <div class="gen-query">"${escapeHtml(query || 'No query')}"</div>
      </div>

      <!-- Confidence & Duration -->
      <div class="gen-meta-row">
        ${confidencePercent !== null ? `
          <div class="gen-confidence">
            <span class="gen-confidence-label">Confidence</span>
            <span class="confidence-badge ${confidenceClass}">${confidencePercent}%</span>
          </div>
        ` : ''}
        <div class="gen-duration">
          <span class="gen-duration-label">Duration</span>
          <span class="gen-duration-value">${durationSec}s</span>
        </div>
      </div>

      <!-- Journey Stage -->
      ${reasoning?.journeyStage ? `
        <div class="gen-section">
          <div class="gen-section-title">Journey Stage</div>
          <div class="gen-journey-stage">${formatLabel(reasoning.journeyStage)}</div>
          ${reasoning.nextBestAction ? `<div class="gen-next-action">Next: ${escapeHtml(reasoning.nextBestAction)}</div>` : ''}
        </div>
      ` : ''}

      <!-- Reasoning Steps -->
      ${stepsHtml ? `
        <div class="gen-section">
          <div class="gen-section-title">Reasoning Steps</div>
          <div class="reasoning-steps-list">
            ${stepsHtml}
          </div>
        </div>
      ` : ''}

      <!-- Block Types -->
      ${blockTypesHtml ? `
        <div class="gen-section">
          <div class="gen-section-title">Generated Blocks</div>
          <div class="block-types-list">
            ${blockTypesHtml}
          </div>
        </div>
      ` : ''}

      <!-- Block Rationales -->
      ${rationalesHtml ? `
        <div class="gen-section">
          <div class="gen-section-title">Block Rationales</div>
          <div class="block-rationales-list">
            ${rationalesHtml}
          </div>
        </div>
      ` : ''}

      <!-- Follow-ups -->
      ${reasoning?.suggestedFollowUps?.length ? `
        <div class="gen-section">
          <div class="gen-section-title">Suggested Follow-ups</div>
          <div class="gen-followups">
            ${reasoning.suggestedFollowUps.map(f => `<div class="gen-followup-item">${escapeHtml(f)}</div>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Get icon ID for reasoning stage
 */
function getReasoningStageIcon(stage) {
  const iconMap = {
    signals: 'broadcast',
    understanding: 'user',
    history: 'chat',
    intent: 'target',
    layout: 'box',
    blocks: 'box',
    content: 'edit',
  };
  return iconMap[stage] || 'sparkle';
}

/**
 * Render examples grid
 */
function renderExamples() {
  const container = document.getElementById('examples-grid');

  container.innerHTML = examples.map(example => {
    const confidence = getConfidenceLevel(example.inferredProfile.confidence_score);
    const confidencePercent = Math.round(example.inferredProfile.confidence_score * 100);
    const iconId = getExampleIconId(example.icon);

    return `
      <div class="example-card" data-id="${example.id}">
        <div class="example-header">
          <svg class="icon example-icon"><use href="#icon-${iconId}"/></svg>
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
 * Fetch analysis data from background (cached or run new)
 */
async function fetchAnalysisData(force = false) {
  const container = document.getElementById('improve-content');
  if (!container) return;

  if (!force && analysisResults) {
    // Already have data, just render
    renderImproveView();
    return;
  }

  analysisLoading = true;
  renderImproveView();

  try {
    const response = await chrome.runtime.sendMessage({
      type: force ? 'RUN_ANALYSIS' : 'GET_CACHED_ANALYSIS',
      force,
    });

    if (response.analysis) {
      analysisResults = response.analysis;
    }
    analysisLoading = false;
    renderImproveView();
  } catch (error) {
    console.error('[Panel] Failed to fetch analysis:', error);
    analysisLoading = false;
    renderImproveView();
  }
}

/**
 * Handle execute improvement click
 */
async function handleExecuteImprovement(improvement, pageUrl) {
  executionState[pageUrl || 'current'] = {
    status: 'executing',
    message: 'Starting...',
  };
  renderImproveView();

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'EXECUTE_IMPROVEMENT',
      improvement,
      pageUrl,
    });

    if (!response.success) {
      executionState[pageUrl || 'current'] = {
        status: 'error',
        message: response.error || 'Execution failed',
      };
    }
    // Success state will be set by EXECUTION_COMPLETE message
  } catch (error) {
    console.error('[Panel] Execution error:', error);
    executionState[pageUrl || 'current'] = {
      status: 'error',
      message: error.message,
    };
    renderImproveView();
  }
}

/**
 * Handle copy prompt to clipboard (for non-executable improvements)
 */
async function handleCopyPrompt(improvement) {
  const categoryContext = {
    content: 'content quality, relevance, and information completeness',
    layout: 'visual hierarchy, formatting, and page structure',
    conversion: 'CTAs, product links, and conversion optimization',
  };

  const prompt = `# Improvement Task: ${improvement.category.charAt(0).toUpperCase() + improvement.category.slice(1)}

## Issue to Address
${improvement.text}

## Category Focus
This improvement focuses on ${categoryContext[improvement.category] || improvement.category}.

## Instructions
1. Analyze the relevant blocks and templates in this AEM Edge Delivery Services project
2. Identify the specific code changes needed to address this improvement
3. Implement the changes following existing code patterns and styles
4. Test the changes locally before committing

## Project Context
- This is a Vitamix product recommendation site built on AEM Edge Delivery Services
- Generated pages are created dynamically based on user queries
- Focus on improving the user experience and conversion rate

Please implement this improvement across the affected components.`;

  try {
    await navigator.clipboard.writeText(prompt);
    return { success: true };
  } catch (error) {
    console.error('[Panel] Failed to copy prompt:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a score gauge element
 */
function createScoreGauge(score, label) {
  const color = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  return `
    <div class="score-gauge">
      <div class="gauge-circle ${color}" style="--score: ${score}">
        <span class="gauge-value">${score}</span>
      </div>
      <div class="gauge-label">${label}</div>
    </div>
  `;
}

/**
 * Calculate priority score for sorting (higher = do first)
 */
function calculatePriority(impact, effort) {
  const impactScore = { high: 3, medium: 2, low: 1 };
  const effortScore = { low: 3, medium: 2, high: 1 };
  return impactScore[impact] * 2 + effortScore[effort];
}

/**
 * Normalize a suggestion to ensure consistent format
 */
function normalizeSuggestion(suggestion, category) {
  if (typeof suggestion === 'object' && suggestion.text) {
    return {
      text: suggestion.text,
      impact: suggestion.impact || 'medium',
      effort: suggestion.effort || 'medium',
      category,
      executable: suggestion.executable !== false, // Default to executable
    };
  }
  return {
    text: String(suggestion),
    impact: 'medium',
    effort: 'medium',
    category,
    executable: true,
  };
}

/**
 * Render Self-Improve view
 */
function renderImproveView() {
  const container = document.getElementById('improve-content');
  if (!container) return;

  // Loading state
  if (analysisLoading) {
    container.innerHTML = `
      <div class="improve-loading">
        <svg class="icon icon-loading"><use href="#icon-loading"/></svg>
        <p>Running AI analysis...</p>
        <p class="hint">This may take 30-60 seconds</p>
      </div>
    `;
    return;
  }

  // Empty state
  if (!analysisResults) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="icon icon-lg"><use href="#icon-settings"/></svg>
        <p>No analysis data available</p>
        <p class="hint">Click "Run Analysis" to get improvement suggestions</p>
      </div>
      <div class="improve-actions">
        <button class="btn btn-primary" id="run-analysis-btn">
          <svg class="icon"><use href="#icon-play"/></svg>
          <span>Run Analysis</span>
        </button>
      </div>
    `;

    document.getElementById('run-analysis-btn')?.addEventListener('click', () => {
      fetchAnalysisData(true);
    });
    return;
  }

  // Collect and sort all suggestions
  const allSuggestions = [];
  if (analysisResults.suggestions?.content) {
    analysisResults.suggestions.content.forEach(s => {
      allSuggestions.push(normalizeSuggestion(s, 'content'));
    });
  }
  if (analysisResults.suggestions?.layout) {
    analysisResults.suggestions.layout.forEach(s => {
      allSuggestions.push(normalizeSuggestion(s, 'layout'));
    });
  }
  if (analysisResults.suggestions?.conversion) {
    analysisResults.suggestions.conversion.forEach(s => {
      allSuggestions.push(normalizeSuggestion(s, 'conversion'));
    });
  }

  allSuggestions.sort((a, b) => {
    const priorityA = calculatePriority(a.impact, a.effort);
    const priorityB = calculatePriority(b.impact, b.effort);
    return priorityB - priorityA;
  });

  // Build HTML
  const scoresHtml = `
    <div class="improve-scores">
      ${createScoreGauge(analysisResults.overallScore || 0, 'Overall')}
      ${createScoreGauge(analysisResults.contentScore || 0, 'Content')}
      ${createScoreGauge(analysisResults.layoutScore || 0, 'Layout')}
      ${createScoreGauge(analysisResults.conversionScore || 0, 'Conversion')}
    </div>
  `;

  const topIssuesHtml = analysisResults.topIssues?.length > 0 ? `
    <div class="improve-section">
      <div class="improve-section-title">Top Issues</div>
      <ul class="top-issues-list">
        ${analysisResults.topIssues.map(issue => `<li>${escapeHtml(issue)}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  const improvementsHtml = allSuggestions.length > 0 ? `
    <div class="improve-section">
      <div class="improve-section-title">Actionable Improvements</div>
      <p class="improve-section-hint">Sorted by priority. Select and execute, or copy prompt for code changes.</p>
      <div class="select-controls">
        <label class="select-all-label">
          <input type="checkbox" class="select-all-checkbox" id="select-all">
          <span>Select All</span>
        </label>
        <button class="btn btn-secondary execute-selected-btn" id="execute-selected" disabled>
          Execute Selected
        </button>
      </div>
      <ul class="improvements-list">
        ${allSuggestions.map((s, i) => {
          const execState = executionState[`improvement_${i}`] || {};
          const statusClass = execState.status || '';
          const isExecutable = s.executable;

          return `
            <li class="improvement-item ${statusClass}" data-index="${i}">
              <input type="checkbox" class="item-checkbox" data-index="${i}">
              <div class="improvement-content">
                <div class="improvement-header">
                  <span class="order-badge">#${i + 1}</span>
                  <span class="category-badge ${s.category}">${s.category}</span>
                  <span class="metric-badge impact-${s.impact}">Impact: ${s.impact}</span>
                  <span class="metric-badge effort-${s.effort}">Effort: ${s.effort}</span>
                </div>
                <div class="improvement-text">${escapeHtml(s.text)}</div>
                ${execState.status === 'executing' ? `<div class="improvement-progress">${escapeHtml(execState.message)}</div>` : ''}
                ${execState.status === 'complete' ? `<div class="improvement-success"><a href="${execState.newUrl}" target="_blank">View Page</a></div>` : ''}
                ${execState.status === 'error' ? `<div class="improvement-error">${escapeHtml(execState.message)}</div>` : ''}
              </div>
              <button class="improvement-action-btn ${isExecutable ? 'execute-btn' : 'copy-btn'}" data-index="${i}" ${execState.status === 'executing' ? 'disabled' : ''}>
                ${isExecutable ? (execState.status === 'executing' ? '<svg class="icon icon-loading"><use href="#icon-loading"/></svg>' : 'Execute') : 'Copy Prompt'}
              </button>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  ` : '';

  const lastAnalysisTime = analysisResults.timestamp
    ? formatRelativeTime(analysisResults.timestamp)
    : 'Unknown';

  container.innerHTML = `
    <div class="improve-card">
      <div class="improve-header">
        <span class="improve-meta">Last analysis: ${lastAnalysisTime}</span>
        <button class="btn btn-secondary btn-sm" id="refresh-analysis-btn">
          <svg class="icon"><use href="#icon-loading"/></svg>
          <span>Refresh</span>
        </button>
      </div>
      ${scoresHtml}
      ${topIssuesHtml}
      ${improvementsHtml}
    </div>
  `;

  // Add event listeners
  document.getElementById('refresh-analysis-btn')?.addEventListener('click', () => {
    fetchAnalysisData(true);
  });

  // Select all checkbox
  const selectAllCheckbox = document.getElementById('select-all');
  const executeSelectedBtn = document.getElementById('execute-selected');
  const itemCheckboxes = container.querySelectorAll('.item-checkbox');

  selectAllCheckbox?.addEventListener('change', () => {
    itemCheckboxes.forEach(cb => {
      cb.checked = selectAllCheckbox.checked;
    });
    updateExecuteSelectedState();
  });

  itemCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateExecuteSelectedState);
  });

  function updateExecuteSelectedState() {
    const selectedCount = [...itemCheckboxes].filter(cb => cb.checked).length;
    if (executeSelectedBtn) {
      executeSelectedBtn.disabled = selectedCount === 0;
      executeSelectedBtn.textContent = selectedCount > 0
        ? `Execute Selected (${selectedCount})`
        : 'Execute Selected';
    }
  }

  // Execute selected
  executeSelectedBtn?.addEventListener('click', async () => {
    const selectedItems = [...itemCheckboxes]
      .filter(cb => cb.checked)
      .map(cb => ({
        index: parseInt(cb.dataset.index),
        ...allSuggestions[parseInt(cb.dataset.index)],
      }));

    if (selectedItems.length === 0) return;

    // Execute sequentially
    for (const item of selectedItems) {
      if (item.executable) {
        await handleExecuteImprovement(item, `improvement_${item.index}`);
      } else {
        await handleCopyPrompt(item);
      }
    }
  });

  // Individual action buttons
  container.querySelectorAll('.improvement-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = parseInt(btn.dataset.index);
      const suggestion = allSuggestions[index];

      if (suggestion.executable) {
        await handleExecuteImprovement(suggestion, `improvement_${index}`);
      } else {
        const result = await handleCopyPrompt(suggestion);
        if (result.success) {
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.textContent = 'Copy Prompt';
          }, 2000);
        }
      }
    });
  });
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Never';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

// ========================================
// Insights Tab - Mock Data & Render Functions
// ========================================

/**
 * Mock insights data
 * Realistic data based on existing analytics patterns
 */
const mockInsightsData = {
  kpis: {
    engagement: { value: 78, trend: '+5.2%', trendUp: true },
    effectiveness: { value: 72, trend: '+3.8%', trendUp: true },
    conversion: { value: 14.2, trend: '+1.4%', trendUp: true },
    trust: { value: 81, trend: '+2.1%', trendUp: true },
  },

  contentPerformance: {
    segments: ['New Parent', 'Health', 'Gift Buyer', 'Upgrader'],
    blocks: ['recipe-cards', 'product-compare', 'product-hero', 'faq', 'troubleshooting'],
    scores: [
      [76, 92, 58, 71], // recipe-cards
      [62, 71, 88, 85], // product-compare
      [84, 79, 65, 91], // product-hero
      [81, 64, 72, 79], // faq
      [45, 52, 38, 89], // troubleshooting
    ],
  },

  journey: {
    stages: [
      { name: 'Exploring', pct: 52, conversion: 4.2, color: 'blue' },
      { name: 'Comparing', pct: 33, conversion: 18.7, color: 'warning' },
      { name: 'Deciding', pct: 15, conversion: 42.3, color: 'success' },
    ],
    topTriggers: [
      'Product comparison pages',
      'Recipe success stories',
      'Warranty information',
    ],
  },

  contentGaps: [
    { topic: 'Noise level comparisons', queries: 89, satisfaction: 42, opportunity: 'high' },
    { topic: 'Container size guide', queries: 76, satisfaction: 51, opportunity: 'high' },
    { topic: 'Competitor comparisons', queries: 124, satisfaction: 38, opportunity: 'medium' },
    { topic: 'Cleaning & maintenance', queries: 45, satisfaction: 67, opportunity: 'low' },
  ],

  opportunities: [
    {
      title: 'Enhance baby food content',
      segment: 'New Parent',
      impact: 'high',
      effort: 'medium',
      lift: '+15% engagement',
      rationale: 'New parents show 3x higher engagement with recipe content but convert at lower rates',
    },
    {
      title: 'Add gift registry CTA',
      segment: 'Gift Buyer',
      impact: 'high',
      effort: 'low',
      lift: '+22% conversion',
      rationale: 'Gift buyers often abandon due to lack of registry integration',
    },
    {
      title: 'Create upgrade calculator',
      segment: 'Upgrader',
      impact: 'medium',
      effort: 'medium',
      lift: '+8% conversion',
      rationale: 'Existing owners need clearer differentiation between models',
    },
    {
      title: 'Add noise level comparisons',
      segment: 'Health',
      impact: 'medium',
      effort: 'low',
      lift: '+12% satisfaction',
      rationale: 'Top content gap identified in search queries',
    },
  ],

  chatbotIssues: [
    {
      issue: 'Blender making loud grinding noise',
      frequency: 187,
      coverage: 'moderate',
      satisfaction: 48,
      status: 'needs-improvement',
      insight: 'Users report unusual sounds but troubleshooting steps lack audio/video examples to diagnose issue type',
      suggestion: 'Add audio clips of normal vs problem sounds with corresponding fixes',
    },
    {
      issue: 'How do I check my warranty status?',
      frequency: 156,
      coverage: 'excellent',
      satisfaction: 89,
      status: 'good',
      insight: 'Warranty lookup and registration process is clear and well-documented',
      suggestion: null,
    },
    {
      issue: 'Motor overheating and shutting off',
      frequency: 134,
      coverage: 'poor',
      satisfaction: 35,
      status: 'needs-improvement',
      insight: 'Thermal protection info exists but users need clearer guidance on load limits and cool-down times',
      suggestion: 'Create interactive load calculator and add specific cool-down time recommendations by model',
    },
    {
      issue: 'Blade assembly not spinning properly',
      frequency: 121,
      coverage: 'good',
      satisfaction: 74,
      status: 'good',
      insight: 'Drive socket and blade seating troubleshooting guides are helpful',
      suggestion: null,
    },
    {
      issue: 'Container leaking from bottom',
      frequency: 108,
      coverage: 'moderate',
      satisfaction: 51,
      status: 'needs-improvement',
      insight: 'Seal replacement info available but users struggle to identify if leak is seal vs crack',
      suggestion: 'Add visual diagnostic guide to differentiate seal wear from container damage',
    },
    {
      issue: 'Error code E31 on display',
      frequency: 94,
      coverage: 'poor',
      satisfaction: 38,
      status: 'needs-improvement',
      insight: 'Error codes are documented but explanations are too technical for most users',
      suggestion: 'Rewrite error code guide in plain language with step-by-step resolution paths',
    },
    {
      issue: 'How to order replacement parts',
      frequency: 89,
      coverage: 'excellent',
      satisfaction: 86,
      status: 'good',
      insight: 'Parts ordering process and compatibility guides work well',
      suggestion: null,
    },
    {
      issue: 'Blender not starting at all',
      frequency: 76,
      coverage: 'good',
      satisfaction: 71,
      status: 'good',
      insight: 'Power and safety interlock troubleshooting is comprehensive',
      suggestion: null,
    },
    {
      issue: 'How to send unit in for repair',
      frequency: 67,
      coverage: 'moderate',
      satisfaction: 54,
      status: 'needs-improvement',
      insight: 'Repair process is documented but users want shipping label generation and tracking integration',
      suggestion: 'Add self-service shipping label generator and real-time repair status tracker',
    },
    {
      issue: 'Tamper stuck in container',
      frequency: 52,
      coverage: 'good',
      satisfaction: 82,
      status: 'good',
      insight: 'Tamper removal techniques and safety info are well-covered',
      suggestion: null,
    },
  ],
};

/**
 * Load insights data (simulated delay for demo)
 */
function loadInsightsData() {
  const container = document.getElementById('insights-content');
  if (!container) return;

  // If we already have data, just render
  if (insightsData) {
    renderInsightsView();
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="insights-loading">
      <svg class="icon icon-loading"><use href="#icon-loading"/></svg>
      <p>Loading insights...</p>
    </div>
  `;

  // Simulate API delay
  setTimeout(() => {
    insightsData = mockInsightsData;
    renderInsightsView();
  }, 800);
}

/**
 * Main render function for Insights view
 */
function renderInsightsView() {
  const container = document.getElementById('insights-content');
  if (!container || !insightsData) return;

  container.innerHTML = `
    <div class="insights-dashboard">
      ${renderInsightsKPIs()}
      ${renderPerformanceMatrix()}
      ${renderJourneyFunnel()}
      ${renderContentGaps()}
      ${renderOpportunities()}
      ${renderChatbotIssues()}
    </div>
  `;

  // Add collapsible section behavior
  container.querySelectorAll('.insights-section-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.insights-section');
      section.classList.toggle('collapsed');
    });
  });
}

/**
 * Render KPI hero section
 */
function renderInsightsKPIs() {
  const { kpis } = insightsData;

  const kpiCards = [
    { key: 'engagement', label: 'Engagement', suffix: '%' },
    { key: 'effectiveness', label: 'Content Effectiveness', suffix: '%' },
    { key: 'conversion', label: 'Conversion Rate', suffix: '%' },
    { key: 'trust', label: 'Customer Trust', suffix: '%' },
  ];

  return `
    <div class="insights-kpi-hero">
      ${kpiCards.map(({ key, label, suffix }) => {
        const kpi = kpis[key];
        const colorClass = kpi.value >= 70 ? 'high' : kpi.value >= 50 ? 'medium' : 'low';
        return `
          <div class="insights-kpi-card">
            <div class="kpi-value ${colorClass}">${kpi.value}${suffix}</div>
            <div class="kpi-label">${label}</div>
            <div class="kpi-trend ${kpi.trendUp ? 'up' : 'down'}">${kpi.trend}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render content performance matrix (heatmap)
 */
function renderPerformanceMatrix() {
  const { contentPerformance } = insightsData;
  const { segments, blocks, scores } = contentPerformance;

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    if (score >= 40) return 'score-low';
    return 'score-very-low';
  };

  return `
    <div class="insights-section" data-section="matrix">
      <div class="insights-section-header">
        <div class="insights-section-title">
          <svg class="icon"><use href="#icon-box"/></svg>
          <span>Content Performance Matrix</span>
        </div>
        <button class="section-toggle">
          <svg class="icon icon-sm"><use href="#icon-chevron-down"/></svg>
        </button>
      </div>
      <div class="insights-section-content">
        <p class="insights-section-hint">Block type effectiveness by user segment (engagement score 0-100)</p>
        <div class="performance-matrix">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="matrix-corner"></th>
                ${segments.map(seg => `<th class="matrix-header">${seg}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${blocks.map((block, i) => `
                <tr>
                  <td class="matrix-row-label">${block}</td>
                  ${scores[i].map(score => `
                    <td class="matrix-cell ${getScoreClass(score)}">${score}</td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render journey funnel visualization
 */
function renderJourneyFunnel() {
  const { journey } = insightsData;

  return `
    <div class="insights-section" data-section="journey">
      <div class="insights-section-header">
        <div class="insights-section-title">
          <svg class="icon"><use href="#icon-user"/></svg>
          <span>Journey Intelligence</span>
        </div>
        <button class="section-toggle">
          <svg class="icon icon-sm"><use href="#icon-chevron-down"/></svg>
        </button>
      </div>
      <div class="insights-section-content">
        <div class="journey-funnel">
          ${journey.stages.map(stage => `
            <div class="funnel-stage" style="flex: ${stage.pct}">
              <div class="funnel-bar funnel-${stage.color}">
                <span class="funnel-pct">${stage.pct}%</span>
              </div>
              <div class="funnel-label">${stage.name}</div>
              <div class="funnel-conversion">${stage.conversion}% convert</div>
            </div>
          `).join('')}
        </div>
        <div class="journey-triggers">
          <div class="triggers-title">Top Conversion Triggers</div>
          <ul class="triggers-list">
            ${journey.topTriggers.map(trigger => `<li>${trigger}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render content gaps section
 */
function renderContentGaps() {
  const { contentGaps } = insightsData;

  const opportunityClass = (opp) => {
    if (opp === 'high') return 'opportunity-high';
    if (opp === 'medium') return 'opportunity-medium';
    return 'opportunity-low';
  };

  return `
    <div class="insights-section" data-section="gaps">
      <div class="insights-section-header">
        <div class="insights-section-title">
          <svg class="icon"><use href="#icon-target"/></svg>
          <span>Content Gaps</span>
        </div>
        <button class="section-toggle">
          <svg class="icon icon-sm"><use href="#icon-chevron-down"/></svg>
        </button>
      </div>
      <div class="insights-section-content">
        <p class="insights-section-hint">Topics where current content underperforms user expectations</p>
        <div class="content-gaps-list">
          ${contentGaps.map(gap => `
            <div class="gap-item">
              <div class="gap-header">
                <span class="gap-topic">${gap.topic}</span>
                <span class="gap-opportunity ${opportunityClass(gap.opportunity)}">${gap.opportunity}</span>
              </div>
              <div class="gap-metrics">
                <span class="gap-metric"><strong>${gap.queries}</strong> queries/week</span>
                <span class="gap-metric"><strong>${gap.satisfaction}%</strong> satisfaction</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render opportunities board
 */
function renderOpportunities() {
  const { opportunities } = insightsData;

  return `
    <div class="insights-section" data-section="opportunities">
      <div class="insights-section-header">
        <div class="insights-section-title">
          <svg class="icon"><use href="#icon-sparkle"/></svg>
          <span>Opportunities</span>
        </div>
        <button class="section-toggle">
          <svg class="icon icon-sm"><use href="#icon-chevron-down"/></svg>
        </button>
      </div>
      <div class="insights-section-content">
        <p class="insights-section-hint">Actionable recommendations sorted by impact/effort ratio</p>
        <div class="opportunities-board">
          ${opportunities.map((opp, i) => `
            <div class="opportunity-card">
              <div class="opportunity-header">
                <span class="opportunity-rank">#${i + 1}</span>
                <span class="opportunity-title">${opp.title}</span>
              </div>
              <div class="opportunity-badges">
                <span class="segment-badge">${opp.segment}</span>
                <span class="metric-badge impact-${opp.impact}">Impact: ${opp.impact}</span>
                <span class="metric-badge effort-${opp.effort}">Effort: ${opp.effort}</span>
              </div>
              <div class="opportunity-lift">${opp.lift}</div>
              <div class="opportunity-rationale">${opp.rationale}</div>
              <button class="insight-action-btn" title="Generate content with AI">
                <svg class="icon"><use href="#icon-sparkle"/></svg>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render chatbot issues section
 * Shows top issues from chatbot conversations with coverage and satisfaction
 */
function renderChatbotIssues() {
  const { chatbotIssues } = insightsData;

  // Separate good vs needs improvement
  const goodIssues = chatbotIssues.filter(i => i.status === 'good');
  const needsImprovementIssues = chatbotIssues.filter(i => i.status === 'needs-improvement');

  const getCoverageClass = (coverage) => {
    if (coverage === 'excellent') return 'coverage-excellent';
    if (coverage === 'good') return 'coverage-good';
    if (coverage === 'moderate') return 'coverage-moderate';
    return 'coverage-poor';
  };

  const getSatisfactionClass = (score) => {
    if (score >= 80) return 'satisfaction-high';
    if (score >= 60) return 'satisfaction-medium';
    return 'satisfaction-low';
  };

  const renderIssueCard = (issue) => `
    <div class="chatbot-issue-card ${issue.status}">
      <div class="issue-header">
        <span class="issue-question">"${issue.issue}"</span>
        <span class="issue-frequency">${issue.frequency} asks/week</span>
      </div>
      <div class="issue-metrics">
        <div class="issue-metric">
          <span class="metric-label">Coverage</span>
          <span class="metric-value ${getCoverageClass(issue.coverage)}">${issue.coverage}</span>
        </div>
        <div class="issue-metric">
          <span class="metric-label">Satisfaction</span>
          <span class="metric-value ${getSatisfactionClass(issue.satisfaction)}">${issue.satisfaction}%</span>
        </div>
      </div>
      <div class="issue-insight">${issue.insight}</div>
      ${issue.suggestion ? `
        <div class="issue-suggestion">
          <svg class="icon"><use href="#icon-sparkle"/></svg>
          <span>${issue.suggestion}</span>
          <button class="insight-action-btn" title="Fix with AI">
            <svg class="icon"><use href="#icon-play"/></svg>
          </button>
        </div>
      ` : ''}
    </div>
  `;

  return `
    <div class="insights-section" data-section="chatbot-issues">
      <div class="insights-section-header">
        <div class="insights-section-title">
          <svg class="icon"><use href="#icon-chatbot"/></svg>
          <span>Chatbot Issues Analysis</span>
        </div>
        <button class="section-toggle">
          <svg class="icon icon-sm"><use href="#icon-chevron-down"/></svg>
        </button>
      </div>
      <div class="insights-section-content">
        <p class="insights-section-hint">Top questions from chatbot conversations and how well they're addressed</p>

        <div class="chatbot-summary">
          <div class="summary-stat good">
            <span class="stat-value">${goodIssues.length}</span>
            <span class="stat-label">Well Covered</span>
          </div>
          <div class="summary-stat needs-improvement">
            <span class="stat-value">${needsImprovementIssues.length}</span>
            <span class="stat-label">Needs Work</span>
          </div>
          <div class="summary-stat neutral">
            <span class="stat-value">${Math.round(chatbotIssues.reduce((sum, i) => sum + i.satisfaction, 0) / chatbotIssues.length)}%</span>
            <span class="stat-label">Avg Satisfaction</span>
          </div>
        </div>

        ${needsImprovementIssues.length > 0 ? `
          <div class="issues-group">
            <div class="issues-group-header needs-improvement">
              <svg class="icon"><use href="#icon-target"/></svg>
              <span>Needs Improvement</span>
            </div>
            <div class="issues-list">
              ${needsImprovementIssues.map(renderIssueCard).join('')}
            </div>
          </div>
        ` : ''}

        ${goodIssues.length > 0 ? `
          <div class="issues-group">
            <div class="issues-group-header good">
              <svg class="icon"><use href="#icon-sparkle"/></svg>
              <span>Well Covered</span>
            </div>
            <div class="issues-list">
              ${goodIssues.map(renderIssueCard).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
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
