/**
 * Engineering Specs Block
 * Deep technical specifications for engineers and spec-focused buyers.
 * No marketing fluff - just the numbers.
 */

export default function decorate(block) {
  // Expected structure from AI:
  // Row 1: Title (or product name)
  // Row 2+: Spec rows with label | value | notes

  const rows = [...block.children];
  if (rows.length < 3) {
    console.warn('engineering-specs: Expected at least 3 rows');
    return;
  }

  const title = rows[0]?.textContent?.trim() || 'Technical Specifications';

  // Clear the block
  block.innerHTML = '';

  // Create header
  const header = document.createElement('div');
  header.className = 'engineering-specs-header';

  const icon = document.createElement('div');
  icon.className = 'engineering-specs-icon';
  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>';
  header.appendChild(icon);

  const titleEl = document.createElement('h2');
  titleEl.className = 'engineering-specs-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  const subtitle = document.createElement('p');
  subtitle.className = 'engineering-specs-subtitle';
  subtitle.textContent = 'Raw data. No marketing fluff.';
  header.appendChild(subtitle);

  block.appendChild(header);

  // Create specs table
  const table = document.createElement('div');
  table.className = 'engineering-specs-table';

  // Process spec rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = [...row.children];

    if (cells.length < 2) continue;

    const label = cells[0]?.textContent?.trim() || '';
    const value = cells[1]?.textContent?.trim() || '';
    const notes = cells[2]?.textContent?.trim() || '';

    const specRow = document.createElement('div');
    specRow.className = 'spec-row';

    const labelEl = document.createElement('div');
    labelEl.className = 'spec-label';
    labelEl.textContent = label;
    specRow.appendChild(labelEl);

    const valueEl = document.createElement('div');
    valueEl.className = 'spec-value';
    valueEl.textContent = value;
    specRow.appendChild(valueEl);

    if (notes) {
      const notesEl = document.createElement('div');
      notesEl.className = 'spec-notes';
      notesEl.textContent = notes;
      specRow.appendChild(notesEl);
    }

    table.appendChild(specRow);
  }

  block.appendChild(table);

  // Methodology note
  const methodology = document.createElement('div');
  methodology.className = 'engineering-methodology';
  methodology.innerHTML = `
    <h4>Measurement Notes</h4>
    <ul>
      <li><strong>Motor power:</strong> Continuous output, not peak marketing numbers</li>
      <li><strong>Sound levels:</strong> Measured at 1 meter, A-weighted (dBA)</li>
      <li><strong>RPM:</strong> No-load maximum blade speed</li>
      <li><strong>Thermal protection:</strong> Auto-shutoff temperature threshold</li>
    </ul>
  `;
  block.appendChild(methodology);

  // Download link
  const download = document.createElement('div');
  download.className = 'engineering-download';
  download.innerHTML = `
    <a href="https://www.vitamix.com/support/product-manuals" target="_blank" class="download-link">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      Download Full Product Manual (PDF)
    </a>
  `;
  block.appendChild(download);
}
