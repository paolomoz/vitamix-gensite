/**
 * Troubleshooting Steps Block
 *
 * Numbered step-by-step instructions with optional header and illustrations.
 * Matches Vitamix.com design: eyebrow + title header, clean numbered steps.
 *
 * Content Model (DA Table):
 * | Troubleshooting Steps                                                |
 * |----------------------------------------------------------------------|
 * | eyebrow | STEP-BY-STEP GUIDE                                         |
 * | title   | Cleaning Your Vitamix                                      |
 * | 1       | Unplug your Vitamix | Always disconnect power... | safety:.|
 * | 2       | Check for trapped ingredients | Remove the container...    |
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  let eyebrow = '';
  let title = '';
  const steps = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 0) return;

    const firstCell = cells[0]?.textContent?.trim().toLowerCase() || '';
    const secondCell = cells[1]?.textContent?.trim() || '';

    // Check for header rows
    if (firstCell === 'eyebrow' && secondCell) {
      eyebrow = secondCell;
      return;
    }

    if (firstCell === 'title' && secondCell) {
      title = secondCell;
      return;
    }

    // Table row format: | number | title | instructions | safety? |
    const numberText = cells[0]?.textContent?.trim() || '';
    const stepTitle = cells[1]?.textContent?.trim() || '';
    const instructions = cells[2]?.textContent?.trim() || '';
    const safetyCell = cells[3]?.textContent?.trim() || '';

    if (/^\d{1,2}$/.test(numberText) && stepTitle) {
      steps.push({
        number: parseInt(numberText, 10),
        title: stepTitle,
        instructions,
        safetyNote: safetyCell.replace(/^safety[:\s]*/i, ''),
      });
    }
  });

  if (steps.length === 0) return;

  // Build header if eyebrow or title exists
  let headerHTML = '';
  if (eyebrow || title) {
    headerHTML = `
      <div class="troubleshooting-header">
        ${eyebrow ? `<p class="troubleshooting-eyebrow">${eyebrow}</p>` : ''}
        ${title ? `<h2 class="troubleshooting-title">${title}</h2>` : ''}
      </div>
    `;
  }

  // Build steps
  const stepsHTML = steps.map((step) => `
    <div class="troubleshooting-step">
      <span class="step-number">${step.number}</span>
      <div class="step-content">
        <h3 class="step-title">${step.title}</h3>
        ${step.instructions ? `<p class="step-instructions">${step.instructions}</p>` : ''}
        ${step.safetyNote ? `
          <div class="step-safety-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span>${step.safetyNote}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');

  // Render block
  block.innerHTML = `
    ${headerHTML}
    <div class="troubleshooting-timeline">
      ${stepsHTML}
    </div>
  `;
}
