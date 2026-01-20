/**
 * Smart Features Block
 * Shows connected/smart capabilities for tech-forward users.
 * Honest about what the app can and cannot do.
 * Design: Aligned to Vitamix design system (premium, professional, clean)
 */

// SVG Icons - Clean, minimal strokes matching Vitamix aesthetic
const ICONS = {
  wifi: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <circle cx="12" cy="20" r="1"/>
  </svg>`,
  app: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>`,
  voice: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`,
  alert: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>`,
};

export default function decorate(block) {
  // Expected structure from AI:
  // Row 1: Title
  // Row 2: App features list
  // Row 3: Voice assistant compatibility
  // Row 4: What you CAN do
  // Row 5: Limitations (what you CAN'T do)

  const rows = [...block.children];
  if (rows.length < 4) {
    console.warn('smart-features: Expected at least 4 rows');
    return;
  }

  const title = rows[0]?.textContent?.trim() || 'Smart & Connected Features';

  // Clear the block
  block.innerHTML = '';

  // Create header (following engineering-specs pattern)
  const header = document.createElement('div');
  header.className = 'smart-features-header';

  const icon = document.createElement('div');
  icon.className = 'smart-features-icon';
  icon.innerHTML = ICONS.wifi;
  header.appendChild(icon);

  const titleEl = document.createElement('h2');
  titleEl.className = 'smart-features-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  block.appendChild(header);

  // Feature sections grid
  const sectionsGrid = document.createElement('div');
  sectionsGrid.className = 'smart-sections-grid';

  // App features section
  if (rows[1]) {
    const appSection = document.createElement('div');
    appSection.className = 'smart-section';

    const appHeader = document.createElement('div');
    appHeader.className = 'smart-section-header';
    appHeader.innerHTML = `
      <span class="smart-section-icon">${ICONS.app}</span>
      <h3>Vitamix Perfect Blend App</h3>
    `;
    appSection.appendChild(appHeader);

    const appContent = document.createElement('div');
    appContent.className = 'smart-section-content';
    appContent.innerHTML = rows[1].innerHTML;
    appSection.appendChild(appContent);

    sectionsGrid.appendChild(appSection);
  }

  // Voice assistant section
  if (rows[2]) {
    const voiceSection = document.createElement('div');
    voiceSection.className = 'smart-section';

    const voiceHeader = document.createElement('div');
    voiceHeader.className = 'smart-section-header';
    voiceHeader.innerHTML = `
      <span class="smart-section-icon">${ICONS.voice}</span>
      <h3>Voice Assistant Compatibility</h3>
    `;
    voiceSection.appendChild(voiceHeader);

    const voiceContent = document.createElement('div');
    voiceContent.className = 'smart-section-content';
    voiceContent.innerHTML = rows[2].innerHTML;
    voiceSection.appendChild(voiceContent);

    sectionsGrid.appendChild(voiceSection);
  }

  block.appendChild(sectionsGrid);

  // Can do / Can't do sections
  const compareGrid = document.createElement('div');
  compareGrid.className = 'smart-compare-grid';

  // What you CAN do
  if (rows[3]) {
    const canDo = document.createElement('div');
    canDo.className = 'smart-compare-card smart-compare-can';

    const canHeader = document.createElement('div');
    canHeader.className = 'smart-compare-header';
    canHeader.innerHTML = `
      <span class="smart-compare-icon">${ICONS.check}</span>
      <h3>What You Can Do</h3>
    `;
    canDo.appendChild(canHeader);

    const canContent = document.createElement('div');
    canContent.className = 'smart-compare-content';
    canContent.innerHTML = rows[3].innerHTML;
    canDo.appendChild(canContent);

    compareGrid.appendChild(canDo);
  }

  // What you CAN'T do (limitations)
  if (rows[4]) {
    const cantDo = document.createElement('div');
    cantDo.className = 'smart-compare-card smart-compare-cant';

    const cantHeader = document.createElement('div');
    cantHeader.className = 'smart-compare-header';
    cantHeader.innerHTML = `
      <span class="smart-compare-icon">${ICONS.alert}</span>
      <h3>Limitations</h3>
    `;
    cantDo.appendChild(cantHeader);

    const cantContent = document.createElement('div');
    cantContent.className = 'smart-compare-content';
    cantContent.innerHTML = rows[4].innerHTML;
    cantDo.appendChild(cantContent);

    compareGrid.appendChild(cantDo);
  }

  block.appendChild(compareGrid);

  // Honest assessment callout
  const assessment = document.createElement('div');
  assessment.className = 'smart-assessment';
  assessment.innerHTML = `
    <div class="smart-assessment-icon">${ICONS.info}</div>
    <div class="smart-assessment-body">
      <p class="smart-assessment-label">Honest Take</p>
      <p class="smart-assessment-text">The smart features are nice-to-have but not essential. The app provides guided recipes and timers, but you can't remotely start your blender (for safety reasons). If smart home integration is critical, this may not be the deciding factor.</p>
    </div>
  `;
  block.appendChild(assessment);

  // Compatible models
  const models = document.createElement('div');
  models.className = 'smart-models';
  models.innerHTML = `
    <p class="smart-models-label">WiFi-Enabled Models</p>
    <div class="smart-models-list">
      <span class="smart-model-badge">Ascent A3500</span>
      <span class="smart-model-badge">Ascent A2500</span>
      <span class="smart-model-badge">Ascent X5</span>
      <span class="smart-model-badge">Ascent X4</span>
    </div>
  `;
  block.appendChild(models);
}
