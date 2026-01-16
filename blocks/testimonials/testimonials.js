/**
 * Testimonials Block - Vitamix Design System
 *
 * Displays customer testimonials with editorial-style presentation.
 * Supports variants: default, dark (via section), minimal, grid
 *
 * Content Model:
 * | Testimonials |
 * | --- |
 * | Title (h2) |
 * | Avatar | Quote, Author, Product, Source Link |
 * | Avatar | Quote, Author, Product, Source Link |
 */

export default function decorate(block) {
  const rows = [...block.children];

  // Check for grid variant
  const isGrid = block.classList.contains('grid');

  // First row is the title/header
  if (rows[0]) {
    rows[0].classList.add('testimonials-header');
    // Ensure h2 exists for proper styling
    const firstCell = rows[0].querySelector('div');
    if (firstCell && !firstCell.querySelector('h2')) {
      const text = firstCell.textContent.trim();
      if (text) {
        firstCell.innerHTML = `<h2>${text}</h2>`;
      }
    }
  }

  // Create grid wrapper if grid variant
  let gridWrapper = null;
  if (isGrid && rows.length > 1) {
    gridWrapper = document.createElement('div');
    gridWrapper.className = 'testimonials-grid';
  }

  // Process testimonial cards (rows after header)
  rows.slice(1).forEach((row) => {
    row.classList.add('testimonial-card');

    const cells = [...row.children];

    // First cell: Avatar/image (hidden by default but keep for potential future use)
    if (cells[0]) {
      cells[0].classList.add('testimonial-avatar');
    }

    // Second cell: Content (quote, author, product, source)
    if (cells[1]) {
      cells[1].classList.add('testimonial-content');

      // Process content elements
      const paragraphs = cells[1].querySelectorAll('p');
      paragraphs.forEach((p) => {
        const text = p.textContent.trim();

        // Star rating (contains ★ characters)
        if (text.includes('★')) {
          p.classList.add('testimonial-rating');
          // Enhance accessibility
          const starCount = (text.match(/★/g) || []).length;
          p.setAttribute('aria-label', `${starCount} out of 5 stars`);
          return;
        }

        // Source link (contains external link)
        if (p.querySelector('a[href^="http"]')) {
          p.classList.add('testimonial-source');
          // Add external link indicator for accessibility
          const link = p.querySelector('a');
          if (link && !link.getAttribute('target')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
          }
          return;
        }

        // Author (contains strong/bold text)
        if (p.querySelector('strong')) {
          p.classList.add('testimonial-author');
          return;
        }

        // Quote (starts with quote mark or contains quoted text)
        if (text.startsWith('"') || text.startsWith('"') || text.includes('"')) {
          p.classList.add('testimonial-quote');
          // Clean up quote marks - they're decorative via CSS
          return;
        }

        // Product info (mentions purchased/verified/model)
        const productKeywords = ['purchased', 'verified', 'owner', 'model', 'vitamix'];
        if (productKeywords.some((keyword) => text.toLowerCase().includes(keyword))) {
          p.classList.add('testimonial-product');
          return;
        }

        // Default: treat as quote if no other classification
        if (!p.classList.contains('testimonial-rating')
            && !p.classList.contains('testimonial-source')
            && !p.classList.contains('testimonial-author')
            && !p.classList.contains('testimonial-product')) {
          // If it's a substantial paragraph, it's likely the quote
          if (text.length > 20) {
            p.classList.add('testimonial-quote');
          }
        }
      });
    }

    // Add to grid wrapper if using grid variant
    if (gridWrapper) {
      gridWrapper.appendChild(row);
    }
  });

  // Append grid wrapper after header if using grid variant
  if (gridWrapper && rows[0]) {
    block.appendChild(gridWrapper);
  }
}
