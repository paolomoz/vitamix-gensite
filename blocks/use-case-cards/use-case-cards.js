/**
 * Use Case Cards Block
 * Displays use cases in solid color filled cards with clickable navigation
 *
 * Design: Vitamix filled cards pattern - solid color backgrounds,
 * eyebrow + title with arrow + description, centered white text
 */

import { createCTAIcon } from '../../scripts/cta-utils.js';

/**
 * Get page context for generating contextual queries
 * @returns {string} - Context string (e.g., product name, page title)
 */
function getPageContext() {
  const productHero = document.querySelector('.product-hero .product-hero-title, .product-hero h1');
  if (productHero) return productHero.textContent.trim();

  const productInfo = document.querySelector('.product-info-title, .product-info h1');
  if (productInfo) return productInfo.textContent.trim();

  const recommendation = document.querySelector('.product-recommendation-headline');
  if (recommendation) return recommendation.textContent.trim();

  const hero = document.querySelector('.hero h1, .hero-title');
  if (hero) {
    const text = hero.textContent.trim();
    if (!text.toLowerCase().includes('welcome') && !text.toLowerCase().includes('discover')) {
      return text;
    }
  }

  const pageTitle = document.title.split('|')[0].trim();
  if (pageTitle && pageTitle !== 'Vitamix') return pageTitle;

  return '';
}

/**
 * Build a contextual query for the use case
 */
function buildUseCaseQuery(useCaseTitle, context) {
  const title = useCaseTitle.toLowerCase();
  if (context) {
    return `Tell me about making ${title} with the ${context}`;
  }
  return `Tell me about making ${title} with a Vitamix blender`;
}

/**
 * Handle card click - navigate to generated page
 */
function handleCardClick(event, useCaseTitle) {
  event.preventDefault();
  const context = getPageContext();
  const query = buildUseCaseQuery(useCaseTitle, context);
  const aiMode = sessionStorage.getItem('ai-mode') || 'speed';
  const preset = aiMode === 'speed' ? 'all-cerebras' : 'production';
  window.location.href = `/?q=${encodeURIComponent(query)}&preset=${preset}`;
}

/**
 * Set up click handler on a card
 */
function setupCardClickHandler(card) {
  const titleEl = card.querySelector('.use-case-title, h3, h4, strong');
  if (!titleEl) return;

  const title = titleEl.textContent.trim();
  if (!title) return;

  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Explore ${title}`);

  card.addEventListener('click', (e) => handleCardClick(e, title));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(e, title);
    }
  });
}

export default function decorate(block) {
  // Handle header element if present
  const header = block.querySelector('.ucheader');
  if (header) {
    header.classList.add('use-case-cards-header');
  }

  const rows = [...block.children].filter((el) => !el.classList.contains('ucheader'));

  // If already has proper structure, enhance it
  const existingCards = block.querySelectorAll('.use-case-card');
  if (existingCards.length > 0) {
    block.classList.add('use-case-cards-grid');
    block.dataset.cardCount = existingCards.length;
    existingCards.forEach((card) => setupCardClickHandler(card));
    return;
  }

  // Build cards from rows
  const cards = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 0) return;

    const card = document.createElement('div');
    card.className = 'use-case-card';

    // Content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'use-case-content';

    // Skip image cells (first cell if it only contains an image)
    let startIndex = 0;
    const firstCell = cells[0];
    if (firstCell?.querySelector('img') && !firstCell.textContent?.trim()) {
      startIndex = 1;
    }

    // Process cells
    const textCells = cells.slice(startIndex);
    let hasEyebrow = false;
    let hasTitle = false;

    textCells.forEach((cell) => {
      const text = cell.textContent?.trim();
      if (!text) return;

      const hasHeading = cell.querySelector('h3, h4, strong, b');

      // First short text without heading = eyebrow
      if (!hasEyebrow && !hasHeading && text.length < 40) {
        const eyebrow = document.createElement('span');
        eyebrow.className = 'use-case-eyebrow';
        eyebrow.textContent = text;
        contentDiv.appendChild(eyebrow);
        hasEyebrow = true;
      }
      // Heading or first significant text = title
      else if (!hasTitle && (hasHeading || text.length < 60)) {
        const title = document.createElement('h3');
        title.className = 'use-case-title';
        title.textContent = hasHeading ? hasHeading.textContent.trim() : text;
        contentDiv.appendChild(title);
        hasTitle = true;
      }
      // Everything else = description
      else if (hasTitle) {
        const desc = document.createElement('p');
        desc.className = 'use-case-description';
        desc.textContent = text;
        contentDiv.appendChild(desc);
      }
    });

    if (contentDiv.children.length > 0) {
      card.appendChild(contentDiv);
      cards.push(card);
    }
  });

  // Clear and rebuild
  if (cards.length > 0) {
    block.innerHTML = '';
    if (header) {
      block.appendChild(header);
    }
    block.classList.add('use-case-cards-grid');
    block.dataset.cardCount = cards.length;
    cards.forEach((card) => {
      setupCardClickHandler(card);
      block.appendChild(card);
    });
  }
}
