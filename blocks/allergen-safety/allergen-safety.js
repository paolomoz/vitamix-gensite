/**
 * Allergen Safety Block
 * Cross-contamination prevention and sanitization protocols
 * for users with severe food allergies.
 */

export default function decorate(block) {
  // Expected structure from AI:
  // Row 1: Title
  // Row 2: Sanitization protocol
  // Row 3: Container strategy
  // Row 4: Material safety info

  const rows = [...block.children];
  if (rows.length < 3) {
    console.warn('allergen-safety: Expected at least 3 rows');
    return;
  }

  const title = rows[0]?.textContent?.trim() || 'Allergen Safety Guide';

  // Clear the block
  block.innerHTML = '';

  // Create header with warning
  const header = document.createElement('div');
  header.className = 'allergen-safety-header';

  const icon = document.createElement('div');
  icon.className = 'allergen-safety-icon';
  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
  header.appendChild(icon);

  const titleEl = document.createElement('h2');
  titleEl.className = 'allergen-safety-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  block.appendChild(header);

  // Important notice
  const notice = document.createElement('div');
  notice.className = 'allergen-notice';
  notice.innerHTML = `
    <strong>⚠️ Important Safety Note</strong>
    <p>While thorough cleaning significantly reduces allergen residue, no cleaning method can guarantee 100% removal. For severe allergies, dedicated equipment is the safest approach.</p>
  `;
  block.appendChild(notice);

  // Sections
  const sections = [
    {
      icon: '🧼',
      title: 'Sanitization Protocol',
      row: 1,
      defaultContent: `
        <ol>
          <li>Disassemble: Remove blade assembly from container</li>
          <li>Hot wash: Clean all parts with hot soapy water (140°F+)</li>
          <li>Rinse thoroughly with clean water</li>
          <li>Sanitize: Soak in diluted bleach solution (1 tsp per gallon) for 2 minutes</li>
          <li>Final rinse with clean water</li>
          <li>Air dry completely before use</li>
        </ol>
      `,
    },
    {
      icon: '📦',
      title: 'Dedicated Container Strategy',
      row: 2,
      defaultContent: `
        <p>Consider purchasing multiple containers for allergen separation:</p>
        <ul>
          <li><strong>Container 1:</strong> Allergen-free recipes only</li>
          <li><strong>Container 2:</strong> Recipes containing allergens</li>
          <li>Label containers clearly with color-coded tape</li>
          <li>Store separately to prevent cross-contact</li>
        </ul>
      `,
    },
    {
      icon: '🔬',
      title: 'Material Safety',
      row: 3,
      defaultContent: `
        <ul>
          <li>All Vitamix containers are <strong>BPA-free</strong></li>
          <li>Tritan plastic is non-porous and easier to sanitize</li>
          <li>Stainless steel blades can be sanitized with high heat</li>
          <li>Gaskets should be inspected regularly for wear</li>
        </ul>
      `,
    },
  ];

  const grid = document.createElement('div');
  grid.className = 'allergen-sections';

  sections.forEach((section) => {
    const card = document.createElement('div');
    card.className = 'allergen-section';

    const cardIcon = document.createElement('span');
    cardIcon.className = 'section-icon';
    cardIcon.textContent = section.icon;
    card.appendChild(cardIcon);

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'section-title';
    cardTitle.textContent = section.title;
    card.appendChild(cardTitle);

    const cardContent = document.createElement('div');
    cardContent.className = 'section-content';
    cardContent.innerHTML = rows[section.row]?.innerHTML || section.defaultContent;
    card.appendChild(cardContent);

    grid.appendChild(card);
  });

  block.appendChild(grid);

  // Container options
  const containers = document.createElement('div');
  containers.className = 'allergen-containers';
  containers.innerHTML = `
    <h3>Recommended: Additional Containers</h3>
    <p>Vitamix offers various container sizes compatible with your base:</p>
    <div class="container-options">
      <div class="container-option">
        <span class="option-size">64 oz</span>
        <span class="option-use">Large batches, soups</span>
      </div>
      <div class="container-option">
        <span class="option-size">48 oz</span>
        <span class="option-use">Family portions</span>
      </div>
      <div class="container-option">
        <span class="option-size">20 oz</span>
        <span class="option-use">Personal smoothies</span>
      </div>
      <div class="container-option">
        <span class="option-size">8 oz</span>
        <span class="option-use">Sauces, dressings</span>
      </div>
    </div>
    <a href="https://www.vitamix.com/us/en_us/shop/containers" target="_blank" class="containers-link">Shop Containers →</a>
  `;
  block.appendChild(containers);

  // Consult note
  const consult = document.createElement('div');
  consult.className = 'allergen-consult';
  consult.innerHTML = `
    <p>🩺 <strong>Always consult with your allergist</strong> about safe food preparation practices specific to your allergies.</p>
  `;
  block.appendChild(consult);
}
