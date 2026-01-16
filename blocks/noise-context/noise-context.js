/**
 * Noise Context Block - Vitamix Design System
 *
 * Real-world noise comparisons for noise-sensitive users.
 * Helps them understand what the decibel levels actually mean.
 *
 * Content Model:
 * | Noise Context |
 * | --- |
 * | Title |
 * | Model/Item | dB Level | Context Comparison |
 * | Model/Item | dB Level | Context Comparison |
 */

// SVG Icons (Vitamix design system - clean, minimal strokes)
const ICONS = {
  volume: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
  </svg>`,
  home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>`,
  messageCircle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>`,
};

/**
 * Determine noise level category based on decibel value
 * @param {number} db - Decibel level
 * @returns {string} - Level class name
 */
function getNoiseLevel(db) {
  if (db >= 85) return 'very-loud';
  if (db >= 70) return 'loud';
  if (db >= 50) return 'moderate';
  return 'quiet';
}

/**
 * Create the reference scale component
 * @returns {HTMLElement}
 */
function createNoiseScale() {
  const scale = document.createElement('div');
  scale.className = 'noise-scale';
  scale.setAttribute('role', 'img');
  scale.setAttribute('aria-label', 'Decibel reference scale showing quiet (30-50 dB), moderate (50-70 dB), loud (70-85 dB), and very loud (85+ dB) ranges');

  scale.innerHTML = `
    <div class="scale-title">Decibel Reference Scale</div>
    <div class="scale-bar">
      <div class="scale-segment quiet">
        <span class="segment-label">Quiet</span>
        <span class="segment-range">30–50 dB</span>
      </div>
      <div class="scale-segment moderate">
        <span class="segment-label">Moderate</span>
        <span class="segment-range">50–70 dB</span>
      </div>
      <div class="scale-segment loud">
        <span class="segment-label">Loud</span>
        <span class="segment-range">70–85 dB</span>
      </div>
      <div class="scale-segment very-loud">
        <span class="segment-label">Very Loud</span>
        <span class="segment-range">85+ dB</span>
      </div>
    </div>
  `;

  return scale;
}

/**
 * Create a comparison row
 * @param {string} item - Item/model name
 * @param {string} db - Decibel value string
 * @param {string} context - Context description
 * @returns {HTMLElement}
 */
function createComparison(item, db, context) {
  const dbNum = parseInt(db, 10);
  const levelClass = getNoiseLevel(dbNum);

  const comparison = document.createElement('div');
  comparison.className = `noise-comparison ${levelClass}`;
  comparison.setAttribute('role', 'listitem');

  comparison.innerHTML = `
    <div class="comparison-item">${item}</div>
    <div class="comparison-db" aria-label="${db} decibels">${db}</div>
    <div class="comparison-context">${context}</div>
  `;

  return comparison;
}

/**
 * Create the tips section
 * @returns {HTMLElement}
 */
function createTipsSection() {
  const tips = document.createElement('div');
  tips.className = 'noise-tips';

  tips.innerHTML = `
    <div class="noise-tips-header">
      <div class="noise-tips-icon">${ICONS.home}</div>
      <h3>Tips for Apartment Living</h3>
    </div>
    <ul>
      <li><strong>Best times:</strong> 8am–10pm on weekdays, 9am–9pm on weekends</li>
      <li><strong>Sound dampening:</strong> Place on a rubber mat or folded towel</li>
      <li><strong>Shorter blends:</strong> Most recipes finish in under 60 seconds</li>
      <li><strong>Quiet settings:</strong> Lower speeds are significantly quieter</li>
      <li><strong>Room placement:</strong> Keep away from shared walls if possible</li>
    </ul>
  `;

  return tips;
}

/**
 * Create the direct answer callout
 * @returns {HTMLElement}
 */
function createAnswerSection() {
  const answer = document.createElement('div');
  answer.className = 'noise-answer';

  answer.innerHTML = `
    <div class="answer-icon">${ICONS.messageCircle}</div>
    <div class="answer-content">
      <strong>"Can I use it during a Zoom call?"</strong>
      <p>Honestly, no. Even the quieter models will disrupt a call. Plan to blend before or after your meetings, or use the mute button liberally.</p>
    </div>
  `;

  return answer;
}

export default function decorate(block) {
  const rows = [...block.children];

  if (rows.length < 2) {
    // eslint-disable-next-line no-console
    console.warn('[noise-context] Expected at least 2 rows (title + comparisons)');
    return;
  }

  // Extract title from first row
  const title = rows[0]?.textContent?.trim() || 'Real-World Noise Comparison';

  // Clear the block
  block.innerHTML = '';

  // Create header
  const header = document.createElement('div');
  header.className = 'noise-context-header';

  const icon = document.createElement('div');
  icon.className = 'noise-context-icon';
  icon.innerHTML = ICONS.volume;
  icon.setAttribute('aria-hidden', 'true');
  header.appendChild(icon);

  const titleEl = document.createElement('h2');
  titleEl.className = 'noise-context-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  block.appendChild(header);

  // Add reference scale
  block.appendChild(createNoiseScale());

  // Create comparisons list
  const comparisons = document.createElement('div');
  comparisons.className = 'noise-comparisons';
  comparisons.setAttribute('role', 'list');
  comparisons.setAttribute('aria-label', 'Noise level comparisons');

  // Process comparison rows (skip first row which is title)
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const cells = [...row.children];

    if (cells.length >= 2) {
      const item = cells[0]?.textContent?.trim() || '';
      const db = cells[1]?.textContent?.trim() || '';
      const context = cells[2]?.textContent?.trim() || '';

      if (item && db) {
        comparisons.appendChild(createComparison(item, db, context));
      }
    }
  }

  block.appendChild(comparisons);

  // Add tips section
  block.appendChild(createTipsSection());

  // Add direct answer callout
  block.appendChild(createAnswerSection());
}
