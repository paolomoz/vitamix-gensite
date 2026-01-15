/**
 * Allergen Safety Block
 * Premium Vitamix design with full-width layout and editorial typography.
 *
 * IMPORTANT: This block displays only vetted content from official Vitamix sources.
 * No medical or safety claims are generated - all content comes from vitamix.com.
 */

// SVG Icons for each section
const ICONS = {
  cleaning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`,
  containers: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>`,
  materials: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0-6v6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>`,
};

export default function decorate(block) {
  // Expected structure from AI (using vetted content only):
  // Row 1: Title
  // Row 2: Cleaning information (from official Vitamix guides)
  // Row 3: Container strategy (with real product link)
  // Row 4: Material information (from product specs)

  const rows = [...block.children];
  if (rows.length < 3) {
    console.warn('allergen-safety: Expected at least 3 rows');
    return;
  }

  const title = rows[0]?.textContent?.trim() || 'Allergen Safety Guide';

  // Clear the block
  block.innerHTML = '';

  // ===== Hero Header Section =====
  const header = document.createElement('div');
  header.className = 'allergen-header';
  header.innerHTML = `
    <div class="allergen-header-inner">
      <p class="allergen-eyebrow">Official Vitamix Resources</p>
      <h2 class="allergen-title">${title}</h2>
      <p class="allergen-subtitle">Everything you need to know about keeping your Vitamix clean and safe for allergen-sensitive food preparation.</p>
    </div>
  `;
  block.appendChild(header);

  // ===== Disclaimer Banner =====
  const disclaimer = document.createElement('div');
  disclaimer.className = 'allergen-disclaimer';
  disclaimer.innerHTML = `
    <p><strong>Important:</strong> For specific allergen safety guidance, consult your allergist or healthcare provider. The information below is sourced from official Vitamix documentation.</p>
  `;
  block.appendChild(disclaimer);

  // ===== Content Grid =====
  const sections = [
    {
      icon: ICONS.cleaning,
      title: 'Cleaning Your Container',
      row: 1,
    },
    {
      icon: ICONS.containers,
      title: 'Dedicated Container Strategy',
      row: 2,
    },
    {
      icon: ICONS.materials,
      title: 'Material Information',
      row: 3,
    },
  ];

  const grid = document.createElement('div');
  grid.className = 'allergen-grid';

  sections.forEach((section) => {
    const rowContent = rows[section.row]?.innerHTML?.trim();
    if (!rowContent) return;

    const card = document.createElement('div');
    card.className = 'allergen-card';

    const cardIcon = document.createElement('div');
    cardIcon.className = 'allergen-card-icon';
    cardIcon.innerHTML = section.icon;
    card.appendChild(cardIcon);

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'allergen-card-title';
    cardTitle.textContent = section.title;
    card.appendChild(cardTitle);

    const cardContent = document.createElement('div');
    cardContent.className = 'allergen-card-content';
    cardContent.innerHTML = rowContent;
    card.appendChild(cardContent);

    grid.appendChild(card);
  });

  block.appendChild(grid);

  // ===== Container Sizes Section =====
  const containers = document.createElement('div');
  containers.className = 'allergen-containers';
  containers.innerHTML = `
    <div class="allergen-containers-inner">
      <div class="allergen-containers-header">
        <h3 class="allergen-containers-title">Available Container Sizes</h3>
        <p class="allergen-containers-subtitle">Choose dedicated containers for allergen-free preparation</p>
      </div>
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
      <div class="containers-cta">
        <a href="https://www.vitamix.com/us/en_us/shop/containers" target="_blank" rel="noopener" class="containers-link">Shop Containers on Vitamix.com</a>
      </div>
    </div>
  `;
  block.appendChild(containers);

  // ===== Resources Section =====
  const resources = document.createElement('div');
  resources.className = 'allergen-resources';
  resources.innerHTML = `
    <div class="allergen-resources-inner">
      <div class="resources-content">
        <h4>Official Guides</h4>
        <ul>
          <li><a href="https://www.vitamix.com/us/en_us/articles/how-to-clean-a-blender-guide" target="_blank" rel="noopener">How to Clean Your Vitamix</a></li>
          <li><a href="https://www.vitamix.com/us/en_us/owners-resources/product-support/faqs/care-and-maintenance" target="_blank" rel="noopener">Care & Maintenance FAQs</a></li>
        </ul>
      </div>
      <div class="resources-content">
        <h4>Allergen Solutions</h4>
        <ul>
          <li><a href="https://www.vitamix.com/us/en_us/products/48-ounce-color-containers-with-self-detect" target="_blank" rel="noopener">Color Containers for Separation</a></li>
          <li><a href="https://www.vitamix.com/us/en_us/support" target="_blank" rel="noopener">Vitamix Support Center</a></li>
        </ul>
      </div>
    </div>
  `;
  block.appendChild(resources);

  // ===== Consult CTA =====
  const consult = document.createElement('div');
  consult.className = 'allergen-consult';
  consult.innerHTML = `
    <p><strong>Always consult with your allergist</strong> about safe food preparation practices specific to your allergies.</p>
  `;
  block.appendChild(consult);
}
