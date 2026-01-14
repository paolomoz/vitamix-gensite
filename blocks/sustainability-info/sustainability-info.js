/**
 * Sustainability Info Block
 * Shows environmental responsibility information for eco-conscious buyers.
 * Covers manufacturing, materials, lifespan, and recycling.
 */

export default function decorate(block) {
  // Expected structure from AI:
  // Row 1: Title
  // Row 2: Manufacturing info
  // Row 3: Materials info
  // Row 4: Lifespan info
  // Row 5: Recycling/end-of-life info

  const rows = [...block.children];
  if (rows.length < 4) {
    console.warn('sustainability-info: Expected at least 4 rows');
    return;
  }

  const title = rows[0]?.textContent?.trim() || 'Environmental Responsibility';

  // Clear the block
  block.innerHTML = '';

  // Create header
  const header = document.createElement('div');
  header.className = 'sustainability-header';

  const icon = document.createElement('div');
  icon.className = 'sustainability-icon';
  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 8a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.4V20h4v-4.6c1.2-.6 2-1.9 2-3.4a4 4 0 0 0-4-4z"></path><path d="M12 2v2"></path></svg>';
  header.appendChild(icon);

  const titleEl = document.createElement('h2');
  titleEl.className = 'sustainability-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  block.appendChild(header);

  // Info sections
  const sections = [
    { icon: '🏭', label: 'Manufacturing', row: 1 },
    { icon: '🧪', label: 'Materials', row: 2 },
    { icon: '⏱️', label: 'Lifespan', row: 3 },
    { icon: '♻️', label: 'End of Life', row: 4 },
  ];

  const grid = document.createElement('div');
  grid.className = 'sustainability-grid';

  sections.forEach((section) => {
    if (rows[section.row]) {
      const content = rows[section.row]?.innerHTML || '';
      if (content.trim()) {
        const card = document.createElement('div');
        card.className = 'sustainability-card';

        const cardIcon = document.createElement('span');
        cardIcon.className = 'card-icon';
        cardIcon.textContent = section.icon;
        card.appendChild(cardIcon);

        const cardLabel = document.createElement('h3');
        cardLabel.className = 'card-label';
        cardLabel.textContent = section.label;
        card.appendChild(cardLabel);

        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        cardContent.innerHTML = content;
        card.appendChild(cardContent);

        grid.appendChild(card);
      }
    }
  });

  block.appendChild(grid);

  // Longevity highlight
  const highlight = document.createElement('div');
  highlight.className = 'sustainability-highlight';
  highlight.innerHTML = `
    <div class="highlight-icon">🌱</div>
    <div class="highlight-content">
      <strong>Built to Last, Not to Landfill</strong>
      <p>Vitamix blenders are designed to last 10-20+ years, reducing waste compared to replacing cheaper blenders every few years.</p>
    </div>
  `;
  block.appendChild(highlight);

  // Certifications if available
  const certifications = document.createElement('div');
  certifications.className = 'sustainability-certifications';
  certifications.innerHTML = `
    <span class="cert-badge">✓ BPA-Free Containers</span>
    <span class="cert-badge">✓ Made in USA</span>
    <span class="cert-badge">✓ Repairable Design</span>
  `;
  block.appendChild(certifications);
}
