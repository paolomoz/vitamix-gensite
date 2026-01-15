/**
 * Demo Overlay Tool - Bookmarklet-based demo delivery panel
 * Provides intent inference examples and custom query execution
 *
 * Can be loaded on any site (including vitamix.com) via bookmarklet.
 * Query execution always navigates to the POC site for generation.
 */

import { demoExamples, getConfidenceLevel, getWeightColor } from './demo-examples.js';

// POC site base URL - where generated pages are created
// Use localhost for local testing, aem.live for production
const POC_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://main--vitamix-gensite--paolomoz.aem.live';

class DemoOverlay {
  constructor() {
    this.selectedExample = null;
    this.isVisible = true;
    this.panel = null;
    this.toggleBtn = null;

    this.init();
  }

  init() {
    this.createPanel();
    this.createToggleButton();
    this.renderExamples();

    // Expose for bookmarklet toggle
    window.__demoOverlay = this;
  }

  createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'demo-overlay';
    this.panel.innerHTML = `
      <div class="demo-header">
        <div class="demo-header-title">
          <span class="icon">🎯</span>
          <span>Demo Delivery Tool</span>
        </div>
        <button class="demo-close-btn" aria-label="Close panel">×</button>
      </div>
      <div class="demo-content">
        <!-- Intent Inference Examples Section -->
        <div class="demo-section" data-section="examples">
          <div class="demo-section-header">
            <div class="demo-section-title">
              <span>Intent Inference Examples</span>
            </div>
            <span class="demo-section-toggle">▼</span>
          </div>
          <div class="demo-section-content">
            <div class="demo-examples-grid" id="demo-examples-grid"></div>
          </div>
        </div>

        <!-- Selected Example Profile Section -->
        <div class="demo-section" data-section="profile">
          <div class="demo-section-header">
            <div class="demo-section-title">
              <span>Selected Example Profile</span>
            </div>
            <span class="demo-section-toggle">▼</span>
          </div>
          <div class="demo-section-content">
            <div id="demo-profile-content">
              <div class="demo-empty-state">
                <div class="icon">👆</div>
                <p>Select an example above to view its inferred profile</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Query Section -->
        <div class="demo-section" data-section="custom">
          <div class="demo-section-header">
            <div class="demo-section-title">
              <span>Custom Query</span>
            </div>
            <span class="demo-section-toggle">▼</span>
          </div>
          <div class="demo-section-content">
            <div class="demo-custom-query">
              <textarea
                class="demo-query-input"
                id="demo-custom-input"
                placeholder="Enter a custom query to generate a page..."
              ></textarea>
              <button class="demo-generate-btn" id="demo-generate-btn">
                <span class="icon">⚡</span>
                <span>Generate Page</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.bindEvents();
  }

  createToggleButton() {
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.className = 'demo-toggle-btn hidden';
    this.toggleBtn.innerHTML = '🎯';
    this.toggleBtn.setAttribute('aria-label', 'Open demo panel');
    this.toggleBtn.addEventListener('click', () => this.show());
    document.body.appendChild(this.toggleBtn);
  }

  bindEvents() {
    // Close button
    this.panel.querySelector('.demo-close-btn').addEventListener('click', () => this.hide());

    // Section toggles
    this.panel.querySelectorAll('.demo-section-header').forEach((header) => {
      header.addEventListener('click', () => {
        const section = header.closest('.demo-section');
        section.classList.toggle('collapsed');
      });
    });

    // Custom query input
    const customInput = this.panel.querySelector('#demo-custom-input');
    const generateBtn = this.panel.querySelector('#demo-generate-btn');

    generateBtn.addEventListener('click', () => {
      const query = customInput.value.trim();
      if (query) {
        this.executeQuery(query);
      }
    });

    // Allow Enter+Cmd/Ctrl to submit
    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        const query = customInput.value.trim();
        if (query) {
          this.executeQuery(query);
        }
      }
    });
  }

  renderExamples() {
    const grid = this.panel.querySelector('#demo-examples-grid');
    grid.innerHTML = demoExamples.map((example) => this.renderExampleCard(example)).join('');

    // Bind click events
    grid.querySelectorAll('.demo-example-card').forEach((card) => {
      card.addEventListener('click', () => {
        const exampleId = card.dataset.id;
        this.selectExample(exampleId);
      });
    });
  }

  renderExampleCard(example) {
    const confidence = getConfidenceLevel(example.inferredProfile.confidence_score);
    const confidencePercent = Math.round(example.inferredProfile.confidence_score * 100);

    return `
      <div class="demo-example-card" data-id="${example.id}">
        <div class="demo-example-card-header">
          <span class="demo-example-icon">${example.icon}</span>
          <span class="demo-example-name">${example.name}</span>
          <span class="demo-example-version">${example.version}</span>
        </div>
        <div class="demo-example-meta">
          <span class="demo-example-signals">
            ${example.signals.length} signals
          </span>
          <span class="demo-example-confidence">
            <span class="demo-confidence-badge ${confidence.color}">${confidencePercent}%</span>
          </span>
        </div>
      </div>
    `;
  }

  selectExample(exampleId) {
    // Update selection state
    this.selectedExample = demoExamples.find((e) => e.id === exampleId);

    // Update card visual state
    this.panel.querySelectorAll('.demo-example-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.id === exampleId);
    });

    // Render profile
    this.renderProfile();

    // Make sure profile section is expanded
    const profileSection = this.panel.querySelector('[data-section="profile"]');
    profileSection.classList.remove('collapsed');
  }

  renderProfile() {
    const container = this.panel.querySelector('#demo-profile-content');

    if (!this.selectedExample) {
      container.innerHTML = `
        <div class="demo-empty-state">
          <div class="icon">👆</div>
          <p>Select an example above to view its inferred profile</p>
        </div>
      `;
      return;
    }

    const example = this.selectedExample;
    const confidence = getConfidenceLevel(example.inferredProfile.confidence_score);
    const confidencePercent = Math.round(example.inferredProfile.confidence_score * 100);

    container.innerHTML = `
      <div class="demo-profile">
        <div class="demo-profile-header">
          <span class="demo-profile-icon">${example.icon}</span>
          <div class="demo-profile-info">
            <div class="demo-profile-name">${example.name}</div>
            <div class="demo-profile-version">${example.version} • ${example.signals.length} signals • <span class="demo-confidence-badge ${confidence.color}">${confidencePercent}%</span></div>
          </div>
        </div>

        <div class="demo-profile-section">
          <div class="demo-profile-section-title">Persona</div>
          <div class="demo-persona-desc">${example.persona}</div>
          <div class="demo-persona-desc" style="margin-top: 4px;"><strong>Driver:</strong> ${example.emotionalDriver}</div>
        </div>

        <div class="demo-profile-section">
          <div class="demo-profile-section-title">Signals Captured</div>
          <div class="demo-signals-list">
            ${example.signals.map((signal) => `
              <div class="demo-signal-item">
                <span class="demo-signal-step">${signal.step}.</span>
                <span class="demo-signal-action">${signal.action}</span>
                <span class="demo-signal-weight ${getWeightColor(signal.weight)}">${signal.weight}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="demo-profile-section">
          <div class="demo-profile-section-title">Inferred Profile</div>
          <div class="demo-json-block">${this.formatJSON(example.inferredProfile)}</div>
        </div>

        <div class="demo-profile-section">
          <div class="demo-profile-section-title">Synthetic Query</div>
          <div class="demo-query-text">"${example.syntheticQuery}"</div>
          <button class="demo-execute-btn" id="demo-execute-example">
            <span class="icon">▶</span>
            <span>Execute Query</span>
          </button>
        </div>
      </div>
    `;

    // Bind execute button
    container.querySelector('#demo-execute-example').addEventListener('click', () => {
      this.executeQuery(example.syntheticQuery);
    });
  }

  formatJSON(obj) {
    const json = JSON.stringify(obj, null, 2);
    return json
      .replace(/"([^"]+)":/g, '<span class="demo-json-key">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="demo-json-string">"$1"</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="demo-json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="demo-json-boolean">$1</span>')
      .replace(/[{}[\]]/g, '<span class="demo-json-bracket">$&</span>');
  }

  executeQuery(query) {
    // Get AI mode from sessionStorage (same as recommender-hero)
    // Default to 'speed' for faster demo performance
    const aiMode = sessionStorage.getItem('ai-mode') || 'speed';
    const preset = aiMode === 'speed' ? 'all-cerebras' : 'production';

    // Always navigate to POC site for generation (works from any site including vitamix.com)
    const url = `${POC_BASE_URL}/?q=${encodeURIComponent(query)}&preset=${preset}`;
    window.location.href = url;
  }

  show() {
    this.isVisible = true;
    this.panel.classList.remove('hidden');
    this.toggleBtn.classList.add('hidden');
  }

  hide() {
    this.isVisible = false;
    this.panel.classList.add('hidden');
    this.toggleBtn.classList.remove('hidden');
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  destroy() {
    this.panel?.remove();
    this.toggleBtn?.remove();
    delete window.__demoOverlay;
  }
}

// Auto-initialize when script loads
new DemoOverlay();
