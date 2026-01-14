/**
 * Smart Features Block
 * Shows connected/smart capabilities for tech-forward users.
 * Honest about what the app can and cannot do.
 */

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

  // Create header
  const header = document.createElement('div');
  header.className = 'smart-features-header';

  const icon = document.createElement('div');
  icon.className = 'smart-features-icon';
  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><circle cx="12" cy="20" r="1"></circle></svg>';
  header.appendChild(icon);

  const titleEl = document.createElement('h2');
  titleEl.className = 'smart-features-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  block.appendChild(header);

  // App features section
  if (rows[1]) {
    const appSection = document.createElement('div');
    appSection.className = 'smart-section app-features';

    const appHeader = document.createElement('h3');
    appHeader.innerHTML = '📱 Vitamix Perfect Blend App';
    appSection.appendChild(appHeader);

    const appContent = document.createElement('div');
    appContent.className = 'section-content';
    appContent.innerHTML = rows[1].innerHTML;
    appSection.appendChild(appContent);

    block.appendChild(appSection);
  }

  // Voice assistant section
  if (rows[2]) {
    const voiceSection = document.createElement('div');
    voiceSection.className = 'smart-section voice-assistant';

    const voiceHeader = document.createElement('h3');
    voiceHeader.innerHTML = '🎤 Voice Assistant Compatibility';
    voiceSection.appendChild(voiceHeader);

    const voiceContent = document.createElement('div');
    voiceContent.className = 'section-content';
    voiceContent.innerHTML = rows[2].innerHTML;
    voiceSection.appendChild(voiceContent);

    block.appendChild(voiceSection);
  }

  // Can do / Can't do sections
  const compareGrid = document.createElement('div');
  compareGrid.className = 'smart-compare-grid';

  // What you CAN do
  if (rows[3]) {
    const canDo = document.createElement('div');
    canDo.className = 'smart-can can-do';

    const canHeader = document.createElement('h3');
    canHeader.innerHTML = '✅ What You Can Do';
    canDo.appendChild(canHeader);

    const canContent = document.createElement('div');
    canContent.className = 'can-content';
    canContent.innerHTML = rows[3].innerHTML;
    canDo.appendChild(canContent);

    compareGrid.appendChild(canDo);
  }

  // What you CAN'T do (limitations)
  if (rows[4]) {
    const cantDo = document.createElement('div');
    cantDo.className = 'smart-can cant-do';

    const cantHeader = document.createElement('h3');
    cantHeader.innerHTML = '⚠️ Limitations';
    cantDo.appendChild(cantHeader);

    const cantContent = document.createElement('div');
    cantContent.className = 'can-content';
    cantContent.innerHTML = rows[4].innerHTML;
    cantDo.appendChild(cantContent);

    compareGrid.appendChild(cantDo);
  }

  block.appendChild(compareGrid);

  // Honest assessment
  const assessment = document.createElement('div');
  assessment.className = 'smart-assessment';
  assessment.innerHTML = `
    <div class="assessment-icon">💡</div>
    <div class="assessment-content">
      <strong>Honest Take</strong>
      <p>The smart features are nice-to-have but not essential. The app provides guided recipes and timers, but you can't remotely start your blender (for safety reasons). If smart home integration is critical, this may not be the deciding factor.</p>
    </div>
  `;
  block.appendChild(assessment);

  // Compatible models
  const models = document.createElement('div');
  models.className = 'smart-models';
  models.innerHTML = `
    <h4>WiFi-Enabled Models</h4>
    <div class="model-badges">
      <span class="model-badge">Ascent A3500</span>
      <span class="model-badge">Ascent A2500</span>
      <span class="model-badge">Ascent X5</span>
      <span class="model-badge">Ascent X4</span>
    </div>
  `;
  block.appendChild(models);
}
