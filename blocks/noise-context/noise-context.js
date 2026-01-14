/**
 * Noise Context Block
 * Real-world noise comparisons for noise-sensitive users.
 * Helps them understand what the decibel levels actually mean.
 */

export default function decorate(block) {
  // Expected structure from AI:
  // Row 1: Title
  // Row 2+: Comparison rows (model | dB level | context comparison)

  const rows = [...block.children];
  if (rows.length < 2) {
    console.warn('noise-context: Expected at least 2 rows');
    return;
  }

  const title = rows[0]?.textContent?.trim() || 'Real-World Noise Comparison';

  // Clear the block
  block.innerHTML = '';

  // Create header
  const header = document.createElement('div');
  header.className = 'noise-context-header';

  const icon = document.createElement('div');
  icon.className = 'noise-context-icon';
  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
  header.appendChild(icon);

  const titleEl = document.createElement('h2');
  titleEl.className = 'noise-context-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  block.appendChild(header);

  // Reference scale
  const scale = document.createElement('div');
  scale.className = 'noise-scale';
  scale.innerHTML = `
    <div class="scale-title">Decibel Reference Scale</div>
    <div class="scale-bar">
      <div class="scale-segment quiet" style="width: 25%">
        <span class="segment-label">Quiet</span>
        <span class="segment-range">30-50 dB</span>
      </div>
      <div class="scale-segment moderate" style="width: 25%">
        <span class="segment-label">Moderate</span>
        <span class="segment-range">50-70 dB</span>
      </div>
      <div class="scale-segment loud" style="width: 25%">
        <span class="segment-label">Loud</span>
        <span class="segment-range">70-85 dB</span>
      </div>
      <div class="scale-segment very-loud" style="width: 25%">
        <span class="segment-label">Very Loud</span>
        <span class="segment-range">85+ dB</span>
      </div>
    </div>
  `;
  block.appendChild(scale);

  // Comparisons
  const comparisons = document.createElement('div');
  comparisons.className = 'noise-comparisons';

  // Process comparison rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = [...row.children];

    if (cells.length < 2) continue;

    const item = cells[0]?.textContent?.trim() || '';
    const db = cells[1]?.textContent?.trim() || '';
    const context = cells[2]?.textContent?.trim() || '';

    const comparison = document.createElement('div');
    comparison.className = 'noise-comparison';

    // Determine color based on dB level
    const dbNum = parseInt(db, 10);
    let levelClass = 'quiet';
    if (dbNum >= 85) levelClass = 'very-loud';
    else if (dbNum >= 70) levelClass = 'loud';
    else if (dbNum >= 50) levelClass = 'moderate';

    comparison.classList.add(levelClass);

    comparison.innerHTML = `
      <div class="comparison-item">${item}</div>
      <div class="comparison-db">${db}</div>
      <div class="comparison-context">${context}</div>
    `;

    comparisons.appendChild(comparison);
  }

  block.appendChild(comparisons);

  // Tips for apartment dwellers
  const tips = document.createElement('div');
  tips.className = 'noise-tips';
  tips.innerHTML = `
    <h3>🏠 Tips for Apartment Living</h3>
    <ul>
      <li><strong>Best times:</strong> 8am-10pm on weekdays, 9am-9pm on weekends</li>
      <li><strong>Sound dampening:</strong> Place on a rubber mat or folded towel</li>
      <li><strong>Shorter blends:</strong> Most recipes finish in under 60 seconds</li>
      <li><strong>Quiet settings:</strong> Lower speeds are significantly quieter</li>
      <li><strong>Room placement:</strong> Keep away from shared walls if possible</li>
    </ul>
  `;
  block.appendChild(tips);

  // Direct answer
  const answer = document.createElement('div');
  answer.className = 'noise-answer';
  answer.innerHTML = `
    <div class="answer-icon">💬</div>
    <div class="answer-content">
      <strong>"Can I use it during a Zoom call?"</strong>
      <p>Honestly, no. Even the quieter models will disrupt a call. Plan to blend before or after your meetings, or use the mute button liberally.</p>
    </div>
  `;
  block.appendChild(answer);
}
