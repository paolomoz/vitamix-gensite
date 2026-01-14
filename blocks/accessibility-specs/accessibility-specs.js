/**
 * Accessibility Specs Block
 * Shows physical and ergonomic specifications for users with
 * mobility concerns (arthritis, grip strength, lifting limitations).
 */

export default function decorate(block) {
  // Expected structure from AI:
  // Row 1: Header/title
  // Row 2+: Product specs rows (product name | weight | lid | controls | notes)

  const rows = [...block.children];
  if (rows.length < 2) {
    console.warn('accessibility-specs: Expected at least 2 rows');
    return;
  }

  const title = rows[0]?.textContent?.trim() || 'Ease of Use Specifications';

  // Clear the block
  block.innerHTML = '';

  // Create header
  const header = document.createElement('div');
  header.className = 'accessibility-specs-header';

  const icon = document.createElement('div');
  icon.className = 'accessibility-specs-icon';
  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>';
  header.appendChild(icon);

  const titleEl = document.createElement('h2');
  titleEl.className = 'accessibility-specs-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  block.appendChild(header);

  // Create specs table
  const table = document.createElement('div');
  table.className = 'accessibility-specs-table';
  table.setAttribute('role', 'table');

  // Table header
  const tableHeader = document.createElement('div');
  tableHeader.className = 'specs-row specs-header';
  tableHeader.setAttribute('role', 'row');
  tableHeader.innerHTML = `
    <div class="specs-cell" role="columnheader">Model</div>
    <div class="specs-cell" role="columnheader">Weight</div>
    <div class="specs-cell" role="columnheader">Lid</div>
    <div class="specs-cell" role="columnheader">Controls</div>
  `;
  table.appendChild(tableHeader);

  // Data rows
  let bestForArthritis = null;
  let lightest = { name: '', weight: Infinity };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = [...row.children];

    if (cells.length < 4) continue;

    const productName = cells[0]?.textContent?.trim() || '';
    const weight = cells[1]?.textContent?.trim() || '';
    const lid = cells[2]?.textContent?.trim() || '';
    const controls = cells[3]?.textContent?.trim() || '';
    const productUrl = cells[0]?.querySelector('a')?.href || '#';

    // Track lightest for recommendation
    const weightNum = parseFloat(weight.replace(/[^\d.]/g, ''));
    if (weightNum && weightNum < lightest.weight) {
      lightest = { name: productName, weight: weightNum };
    }

    // Check for arthritis-friendly (dial controls, lighter weight)
    if (/dial/i.test(controls) && weightNum < 12) {
      bestForArthritis = productName;
    }

    const dataRow = document.createElement('div');
    dataRow.className = 'specs-row';
    dataRow.setAttribute('role', 'row');

    dataRow.innerHTML = `
      <div class="specs-cell product-name" role="cell">
        <a href="${productUrl}" target="_blank">${productName}</a>
      </div>
      <div class="specs-cell" role="cell">
        <span class="weight-value">${weight}</span>
      </div>
      <div class="specs-cell" role="cell">
        <span class="lid-rating ${/easy/i.test(lid) ? 'easy' : ''}">${lid}</span>
      </div>
      <div class="specs-cell" role="cell">
        <span class="controls-type">${controls}</span>
      </div>
    `;

    table.appendChild(dataRow);
  }

  block.appendChild(table);

  // Recommendation
  if (bestForArthritis || lightest.name) {
    const recommendation = document.createElement('div');
    recommendation.className = 'accessibility-recommendation';

    const recIcon = document.createElement('span');
    recIcon.className = 'rec-icon';
    recIcon.textContent = '🏆';
    recommendation.appendChild(recIcon);

    const recText = document.createElement('div');
    recText.className = 'rec-text';

    if (bestForArthritis) {
      recText.innerHTML = `<strong>Best for arthritis:</strong> ${bestForArthritis}<br><small>Simple dial control, lighter weight, easier grip</small>`;
    } else if (lightest.name) {
      recText.innerHTML = `<strong>Lightest option:</strong> ${lightest.name}<br><small>At ${lightest.weight} lbs, easiest to lift and move</small>`;
    }

    recommendation.appendChild(recText);
    block.appendChild(recommendation);
  }

  // Tips section
  const tips = document.createElement('div');
  tips.className = 'accessibility-tips';
  tips.innerHTML = `
    <h3>Tips for Easier Use</h3>
    <ul>
      <li><strong>Dial controls</strong> are easier to operate with limited grip strength than touchscreens</li>
      <li><strong>Smaller containers</strong> (48oz or personal cups) are lighter when full</li>
      <li>Keep your blender on the counter to avoid lifting</li>
      <li>Consider a <strong>blending station mat</strong> to prevent slipping</li>
    </ul>
  `;
  block.appendChild(tips);
}
