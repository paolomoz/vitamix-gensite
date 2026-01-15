/**
 * Demo Overlay Tool - Bundled version for cross-origin loading
 * This single file works on any site (including vitamix.com) via bookmarklet.
 */
(function() {
  'use strict';

  // Prevent double-loading
  if (window.__demoOverlay) {
    window.__demoOverlay.toggle();
    return;
  }

  // POC site base URL - where generated pages are created
  const POC_BASE_URL = 'https://main--vitamix-gensite--paolomoz.aem.live';

  // ============================================
  // DEMO EXAMPLES DATA
  // ============================================
  const demoExamples = [
    {
      id: 'new-parent-short',
      name: 'New Parent',
      version: 'Short Journey',
      icon: '👶',
      persona: 'First-time parent researching how to make homemade baby food',
      emotionalDriver: 'Safety, nutrition control, cost savings on commercial baby food',
      signals: [
        { step: 1, action: 'Searches: "baby food blender"', signal: 'search: baby food blender', weight: 'Very High' },
        { step: 2, action: 'Visits "Baby Food Recipes" article', signal: 'article_view: baby-food-recipes', weight: 'High' },
        { step: 3, action: 'Clicks "Load More" on reviews', signal: 'reviews_expanded: 1', weight: 'High' },
      ],
      inferredProfile: {
        segments: ['new_parent', 'baby_feeding'],
        life_stage: 'infant_caregiver',
        use_cases: ['baby_food'],
        decision_style: 'safety_conscious',
        confidence_score: 0.52,
      },
      syntheticQuery: "I'm looking for a blender to make baby food. What do you recommend?",
    },
    {
      id: 'new-parent-long',
      name: 'New Parent',
      version: 'Long Journey',
      icon: '👶',
      persona: 'First-time parent researching how to make homemade baby food',
      emotionalDriver: 'Safety, nutrition control, cost savings on commercial baby food',
      signals: [
        { step: 1, action: 'Arrives from parenting blog referrer', signal: 'referrer: momresource.com/best-baby-food-makers', weight: 'High' },
        { step: 2, action: 'Visits Explorian E310 product page', signal: 'product_view: explorian-e310', weight: 'Medium' },
        { step: 3, action: 'Searches: "baby food"', signal: 'search: baby food', weight: 'Very High' },
        { step: 4, action: 'Visits "Baby Food Recipes" article', signal: 'article_view: baby-food-recipes', weight: 'High' },
        { step: 5, action: 'Views 3 individual baby food recipes', signal: 'recipe_views: 3, category: baby', weight: 'High' },
        { step: 6, action: 'Returns to E310, expands "What\'s in the box"', signal: 'product_detail: whats_in_box', weight: 'Medium' },
      ],
      inferredProfile: {
        segments: ['new_parent', 'baby_feeding', 'first_time_buyer'],
        life_stage: 'infant_caregiver',
        products_considered: ['E310'],
        price_sensitivity: 'high',
        use_cases: ['baby_food', 'purees'],
        decision_style: 'thorough_researcher',
        content_engagement: 'high',
        purchase_readiness: 'medium_high',
        confidence_score: 0.78,
      },
      syntheticQuery: "I want to make homemade baby food and purees for my baby. I've been looking at the E310 and reading through baby food recipes. I'm on a budget and this would be my first Vitamix. Is the E310 the right choice for making baby food?",
    },
    {
      id: 'gift-giver-short',
      name: 'Gift Giver',
      version: 'Short Journey',
      icon: '🎁',
      persona: 'Shopping for a blender as a gift (wedding, holiday, housewarming)',
      emotionalDriver: 'Want to give an impressive, useful gift without being an expert',
      signals: [
        { step: 1, action: 'Arrives from Google: "best blender wedding gift 2025"', signal: 'referrer_search: best blender wedding gift', weight: 'Very High' },
        { step: 2, action: 'Immediately uses Compare tool (X5 vs X4)', signal: 'compare_tool: [X5, X4]', weight: 'Very High' },
      ],
      inferredProfile: {
        segments: ['gift_buyer'],
        shopping_for: 'someone_else',
        occasion: 'wedding',
        use_cases: ['gift'],
        decision_style: 'efficient',
        confidence_score: 0.65,
      },
      syntheticQuery: "I'm looking for a blender as a wedding gift. I'm comparing the X5 and X4. Which one makes a better gift?",
    },
    {
      id: 'gift-giver-long',
      name: 'Gift Giver',
      version: 'Long Journey',
      icon: '🎁',
      persona: 'Shopping for a blender as a gift (wedding, holiday, housewarming)',
      emotionalDriver: 'Want to give an impressive, useful gift without being an expert',
      signals: [
        { step: 1, action: 'Arrives from Google: "best blender wedding gift"', signal: 'referrer_search: best blender wedding gift', weight: 'Very High' },
        { step: 2, action: 'Browses 3 product pages rapidly (< 30s each)', signal: 'product_views: 3, time_avg: 25s', weight: 'Medium' },
        { step: 3, action: 'Uses Compare tool (X5 vs A3500)', signal: 'compare_tool: [X5, A3500]', weight: 'Very High' },
        { step: 4, action: 'Checks shipping information', signal: 'shipping_info_viewed: true', weight: 'High' },
        { step: 5, action: 'Skips recipe pages entirely', signal: 'recipe_views: 0', weight: 'Medium' },
        { step: 6, action: 'Views return policy page', signal: 'return_policy_viewed: true', weight: 'Medium' },
      ],
      inferredProfile: {
        segments: ['gift_buyer', 'premium_preference'],
        shopping_for: 'someone_else',
        occasion: 'wedding',
        products_considered: ['X5', 'A3500'],
        price_sensitivity: 'low',
        use_cases: ['gift'],
        decision_style: 'efficient_comparison',
        content_engagement: 'low',
        purchase_readiness: 'high',
        time_sensitive: true,
        confidence_score: 0.82,
      },
      syntheticQuery: "I need a premium Vitamix as a wedding gift. I'm comparing the X5 and A3500 — I want something impressive that looks great when they open it. I need it to arrive soon, and I want to make sure they can return it easily if they already have one. Which should I choose?",
    },
    {
      id: 'upgrader-short',
      name: 'Kitchen Upgrader',
      version: 'Short Journey',
      icon: '🔄',
      persona: 'Owns an older blender (possibly a Vitamix), researching an upgrade',
      emotionalDriver: 'Current blender showing age, wants newer features, or kitchen renovation',
      signals: [
        { step: 1, action: 'Direct visit to vitamix.com (typed URL)', signal: 'referrer: direct', weight: 'Medium' },
        { step: 2, action: 'Searches: "upgrade old vitamix"', signal: 'search: upgrade old vitamix', weight: 'Very High' },
      ],
      inferredProfile: {
        segments: ['existing_owner', 'upgrade_intent'],
        brand_relationship: 'loyal_customer',
        use_cases: ['replacement', 'upgrade'],
        decision_style: 'informed',
        confidence_score: 0.58,
      },
      syntheticQuery: 'I want to upgrade my old Vitamix. What are my options?',
    },
    {
      id: 'upgrader-long',
      name: 'Kitchen Upgrader',
      version: 'Long Journey',
      icon: '🔄',
      persona: 'Owns an older blender (possibly a Vitamix), researching an upgrade',
      emotionalDriver: 'Current blender showing age, wants newer features, or kitchen renovation',
      signals: [
        { step: 1, action: 'Direct visit to vitamix.com', signal: 'referrer: direct', weight: 'Medium' },
        { step: 2, action: 'Searches: "5200 vs ascent"', signal: 'search: 5200 vs ascent', weight: 'Very High' },
        { step: 3, action: 'Visits Ascent Series landing page', signal: 'category_view: ascent-series', weight: 'Medium' },
        { step: 4, action: 'Checks "Compatible with" on X5 page', signal: 'compatibility_checked: true', weight: 'High' },
        { step: 5, action: 'Visits Certified Reconditioned page', signal: 'page_view: certified-reconditioned', weight: 'Medium' },
        { step: 6, action: 'Compares Reconditioned A3500 vs new X5', signal: 'compare_tool: [recon-a3500, X5]', weight: 'Very High' },
      ],
      inferredProfile: {
        segments: ['existing_owner', 'upgrade_intent', 'value_conscious'],
        brand_relationship: 'loyal_customer',
        current_product: '5200_series_likely',
        products_considered: ['X5', 'Reconditioned A3500'],
        price_sensitivity: 'moderate',
        use_cases: ['replacement', 'upgrade', 'feature_upgrade'],
        decision_style: 'informed_comparison',
        accessory_owner: true,
        purchase_readiness: 'medium',
        confidence_score: 0.85,
      },
      syntheticQuery: "I have a Vitamix 5200 and I'm looking to upgrade to something with more modern features. I'm comparing the new X5 with a reconditioned A3500. I already have containers and accessories I'd like to keep using. I want good value but also want the smart features. What's the best upgrade path for me?",
    },
  ];

  function getConfidenceLevel(score) {
    if (score >= 0.76) return { label: 'Very High', color: 'success' };
    if (score >= 0.56) return { label: 'High', color: 'success' };
    if (score >= 0.31) return { label: 'Medium', color: 'warning' };
    return { label: 'Low', color: 'low' };
  }

  function getWeightColor(weight) {
    switch (weight) {
      case 'Very High': return 'weight-very-high';
      case 'High': return 'weight-high';
      case 'Medium': return 'weight-medium';
      case 'Low': return 'weight-low';
      default: return 'weight-medium';
    }
  }

  // ============================================
  // INJECT STYLES
  // ============================================
  const styles = `
    :root {
      --demo-bg: #1e1e1e;
      --demo-surface: #2d2d2d;
      --demo-surface-hover: #363636;
      --demo-surface-selected: #3d3d3d;
      --demo-border: #404040;
      --demo-border-light: #505050;
      --demo-text: #ffffff;
      --demo-text-secondary: #b0b0b0;
      --demo-text-muted: #808080;
      --demo-accent: #0265dc;
      --demo-accent-hover: #0a7ff5;
      --demo-success: #12805c;
      --demo-success-bg: rgba(18, 128, 92, 0.15);
      --demo-warning: #e68619;
      --demo-warning-bg: rgba(230, 134, 25, 0.15);
      --demo-low: #666666;
      --demo-low-bg: rgba(102, 102, 102, 0.15);
      --demo-panel-width: 420px;
      --demo-radius: 8px;
      --demo-radius-sm: 4px;
      --demo-shadow: 0 0 24px rgba(0, 0, 0, 0.5);
      --demo-font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --demo-font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    }
    .demo-overlay { position: fixed; top: 0; right: 0; width: var(--demo-panel-width); height: 100vh; background: var(--demo-bg); border-left: 1px solid var(--demo-border); box-shadow: var(--demo-shadow); z-index: 2147483647; font-family: var(--demo-font-sans); font-size: 13px; color: var(--demo-text); display: flex; flex-direction: column; overflow: hidden; transition: transform 0.3s ease; }
    .demo-overlay.hidden { transform: translateX(100%); }
    .demo-overlay * { box-sizing: border-box; }
    .demo-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--demo-surface); border-bottom: 1px solid var(--demo-border); flex-shrink: 0; }
    .demo-header-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
    .demo-close-btn { background: none; border: none; color: var(--demo-text-secondary); cursor: pointer; padding: 4px 8px; border-radius: var(--demo-radius-sm); font-size: 18px; line-height: 1; transition: all 0.15s ease; }
    .demo-close-btn:hover { background: var(--demo-surface-hover); color: var(--demo-text); }
    .demo-content { flex: 1; overflow-y: auto; overflow-x: hidden; }
    .demo-section { border-bottom: 1px solid var(--demo-border); }
    .demo-section:last-child { border-bottom: none; }
    .demo-section-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; cursor: pointer; user-select: none; transition: background 0.15s ease; }
    .demo-section-header:hover { background: var(--demo-surface-hover); }
    .demo-section-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--demo-text-secondary); }
    .demo-section-toggle { color: var(--demo-text-muted); transition: transform 0.2s ease; }
    .demo-section.collapsed .demo-section-toggle { transform: rotate(-90deg); }
    .demo-section-content { padding: 0 16px 16px; }
    .demo-section.collapsed .demo-section-content { display: none; }
    .demo-examples-grid { display: flex; flex-direction: column; gap: 8px; }
    .demo-example-card { background: var(--demo-surface); border: 1px solid var(--demo-border); border-radius: var(--demo-radius); padding: 12px; cursor: pointer; transition: all 0.15s ease; }
    .demo-example-card:hover { background: var(--demo-surface-hover); border-color: var(--demo-border-light); }
    .demo-example-card.selected { background: var(--demo-surface-selected); border-color: var(--demo-accent); }
    .demo-example-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .demo-example-icon { font-size: 18px; }
    .demo-example-name { font-weight: 600; flex: 1; }
    .demo-example-version { font-size: 11px; color: var(--demo-text-muted); background: var(--demo-bg); padding: 2px 6px; border-radius: var(--demo-radius-sm); }
    .demo-example-meta { display: flex; align-items: center; gap: 12px; font-size: 11px; color: var(--demo-text-secondary); }
    .demo-confidence-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: var(--demo-radius-sm); font-weight: 500; }
    .demo-confidence-badge.success { background: var(--demo-success-bg); color: #2ecc71; }
    .demo-confidence-badge.warning { background: var(--demo-warning-bg); color: var(--demo-warning); }
    .demo-confidence-badge.low { background: var(--demo-low-bg); color: var(--demo-text-secondary); }
    .demo-profile { background: var(--demo-surface); border-radius: var(--demo-radius); overflow: hidden; }
    .demo-profile-header { display: flex; align-items: center; gap: 8px; padding: 12px; border-bottom: 1px solid var(--demo-border); }
    .demo-profile-icon { font-size: 24px; }
    .demo-profile-info { flex: 1; }
    .demo-profile-name { font-weight: 600; font-size: 14px; }
    .demo-profile-version { font-size: 11px; color: var(--demo-text-secondary); }
    .demo-profile-section { padding: 12px; border-bottom: 1px solid var(--demo-border); }
    .demo-profile-section:last-child { border-bottom: none; }
    .demo-profile-section-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--demo-text-muted); margin-bottom: 8px; }
    .demo-signals-list { display: flex; flex-direction: column; gap: 6px; }
    .demo-signal-item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 8px; background: var(--demo-bg); border-radius: var(--demo-radius-sm); font-size: 11px; }
    .demo-signal-step { color: var(--demo-text-muted); font-weight: 500; min-width: 16px; }
    .demo-signal-action { flex: 1; color: var(--demo-text-secondary); }
    .demo-signal-weight { padding: 1px 6px; border-radius: var(--demo-radius-sm); font-size: 10px; font-weight: 500; }
    .demo-signal-weight.weight-very-high { background: var(--demo-success-bg); color: #2ecc71; }
    .demo-signal-weight.weight-high { background: rgba(52, 152, 219, 0.15); color: #5dade2; }
    .demo-signal-weight.weight-medium { background: var(--demo-warning-bg); color: var(--demo-warning); }
    .demo-signal-weight.weight-low { background: var(--demo-low-bg); color: var(--demo-text-secondary); }
    .demo-json-block { background: var(--demo-bg); border-radius: var(--demo-radius-sm); padding: 10px; font-family: var(--demo-font-mono); font-size: 10px; line-height: 1.5; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 180px; overflow-y: auto; }
    .demo-json-key { color: #9cdcfe; }
    .demo-json-string { color: #ce9178; }
    .demo-json-number { color: #b5cea8; }
    .demo-json-boolean { color: #569cd6; }
    .demo-json-bracket { color: var(--demo-text-secondary); }
    .demo-query-text { background: var(--demo-bg); border-radius: var(--demo-radius-sm); padding: 12px; font-size: 12px; line-height: 1.6; color: var(--demo-text); font-style: italic; border-left: 3px solid var(--demo-accent); }
    .demo-execute-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px 16px; background: var(--demo-accent); color: white; border: none; border-radius: var(--demo-radius); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; margin-top: 12px; }
    .demo-execute-btn:hover { background: var(--demo-accent-hover); }
    .demo-custom-query { display: flex; flex-direction: column; gap: 12px; }
    .demo-query-input { width: 100%; padding: 12px; background: var(--demo-surface); border: 1px solid var(--demo-border); border-radius: var(--demo-radius); color: var(--demo-text); font-family: var(--demo-font-sans); font-size: 13px; resize: vertical; min-height: 80px; transition: border-color 0.15s ease; }
    .demo-query-input:focus { outline: none; border-color: var(--demo-accent); }
    .demo-query-input::placeholder { color: var(--demo-text-muted); }
    .demo-generate-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; background: var(--demo-surface); color: var(--demo-text); border: 1px solid var(--demo-border); border-radius: var(--demo-radius); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
    .demo-generate-btn:hover { background: var(--demo-surface-hover); border-color: var(--demo-border-light); }
    .demo-empty-state { text-align: center; padding: 24px; color: var(--demo-text-muted); }
    .demo-empty-state .icon { font-size: 32px; margin-bottom: 8px; opacity: 0.5; }
    .demo-empty-state p { margin: 0; font-size: 12px; }
    .demo-toggle-btn { position: fixed; top: 50%; right: 0; transform: translateY(-50%); background: var(--demo-bg); border: 1px solid var(--demo-border); border-right: none; border-radius: var(--demo-radius) 0 0 var(--demo-radius); padding: 12px 8px; cursor: pointer; z-index: 2147483646; color: var(--demo-text); font-size: 16px; transition: all 0.15s ease; box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3); }
    .demo-toggle-btn:hover { background: var(--demo-surface); padding-right: 12px; }
    .demo-toggle-btn.hidden { display: none; }
    .demo-persona-desc { font-size: 11px; color: var(--demo-text-muted); margin-top: 4px; line-height: 1.4; }
    .demo-content::-webkit-scrollbar, .demo-json-block::-webkit-scrollbar { width: 8px; }
    .demo-content::-webkit-scrollbar-track, .demo-json-block::-webkit-scrollbar-track { background: var(--demo-bg); }
    .demo-content::-webkit-scrollbar-thumb, .demo-json-block::-webkit-scrollbar-thumb { background: var(--demo-border); border-radius: 4px; }
    @media (max-width: 768px) { .demo-overlay { width: 100%; } }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // ============================================
  // DEMO OVERLAY CLASS
  // ============================================
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
          <div class="demo-section" data-section="examples">
            <div class="demo-section-header">
              <div class="demo-section-title"><span>Intent Inference Examples</span></div>
              <span class="demo-section-toggle">▼</span>
            </div>
            <div class="demo-section-content">
              <div class="demo-examples-grid" id="demo-examples-grid"></div>
            </div>
          </div>
          <div class="demo-section" data-section="profile">
            <div class="demo-section-header">
              <div class="demo-section-title"><span>Selected Example Profile</span></div>
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
          <div class="demo-section" data-section="custom">
            <div class="demo-section-header">
              <div class="demo-section-title"><span>Custom Query</span></div>
              <span class="demo-section-toggle">▼</span>
            </div>
            <div class="demo-section-content">
              <div class="demo-custom-query">
                <textarea class="demo-query-input" id="demo-custom-input" placeholder="Enter a custom query to generate a page..."></textarea>
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
      this.panel.querySelector('.demo-close-btn').addEventListener('click', () => this.hide());
      this.panel.querySelectorAll('.demo-section-header').forEach((header) => {
        header.addEventListener('click', () => {
          header.closest('.demo-section').classList.toggle('collapsed');
        });
      });
      const customInput = this.panel.querySelector('#demo-custom-input');
      const generateBtn = this.panel.querySelector('#demo-generate-btn');
      generateBtn.addEventListener('click', () => {
        const query = customInput.value.trim();
        if (query) this.executeQuery(query);
      });
      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          const query = customInput.value.trim();
          if (query) this.executeQuery(query);
        }
      });
    }

    renderExamples() {
      const grid = this.panel.querySelector('#demo-examples-grid');
      grid.innerHTML = demoExamples.map((example) => this.renderExampleCard(example)).join('');
      grid.querySelectorAll('.demo-example-card').forEach((card) => {
        card.addEventListener('click', () => this.selectExample(card.dataset.id));
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
            <span>${example.signals.length} signals</span>
            <span class="demo-confidence-badge ${confidence.color}">${confidencePercent}%</span>
          </div>
        </div>
      `;
    }

    selectExample(exampleId) {
      this.selectedExample = demoExamples.find((e) => e.id === exampleId);
      this.panel.querySelectorAll('.demo-example-card').forEach((card) => {
        card.classList.toggle('selected', card.dataset.id === exampleId);
      });
      this.renderProfile();
      this.panel.querySelector('[data-section="profile"]').classList.remove('collapsed');
    }

    renderProfile() {
      const container = this.panel.querySelector('#demo-profile-content');
      if (!this.selectedExample) {
        container.innerHTML = `<div class="demo-empty-state"><div class="icon">👆</div><p>Select an example above to view its inferred profile</p></div>`;
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
      const preset = 'all-cerebras'; // Always use fast mode for demos
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
      if (this.isVisible) this.hide();
      else this.show();
    }

    destroy() {
      this.panel?.remove();
      this.toggleBtn?.remove();
      styleEl?.remove();
      delete window.__demoOverlay;
    }
  }

  // Initialize
  new DemoOverlay();
})();
