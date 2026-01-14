/**
 * Testimonials Block
 *
 * Displays customer testimonials with quote, author, and source link.
 * Single column layout with centered text, no images.
 */

export default function decorate(block) {
  const rows = [...block.children];

  // First row is the title
  if (rows[0]) {
    rows[0].classList.add('testimonials-header');
  }

  // Remaining rows are testimonial cards
  rows.slice(1).forEach((row) => {
    row.classList.add('testimonial-card');

    const cells = [...row.children];
    // Hide avatar/image cell
    if (cells[0]) {
      cells[0].style.display = 'none';
    }
    if (cells[1]) {
      cells[1].classList.add('testimonial-content');

      // Add classes to content elements
      const paragraphs = cells[1].querySelectorAll('p');
      paragraphs.forEach((p, index) => {
        if (index === 0 && p.textContent.includes('★')) {
          p.classList.add('testimonial-rating');
        } else if (p.querySelector('a[href^="http"]')) {
          // Source link - links to original testimonial
          p.classList.add('testimonial-source');
        } else if (p.querySelector('strong')) {
          p.classList.add('testimonial-author');
        } else if (p.textContent.startsWith('"') || p.textContent.includes('"')) {
          p.classList.add('testimonial-quote');
        } else if (p.textContent.toLowerCase().includes('purchased')) {
          p.classList.add('testimonial-product');
        }
      });
    }
  });
}
