/**
 * Follow-up Advisor Block
 *
 * Displays insightful, contextual follow-up suggestions with journey awareness.
 * Unlike simple chips, this block explains WHY each suggestion is relevant and
 * shows research gaps the user hasn't explored yet.
 *
 * Data Structure (passed via data-advisor-follow-up attribute or DA table):
 * {
 *   journeyStage: 'exploring' | 'comparing' | 'deciding',
 *   suggestions: [{
 *     query: string,
 *     headline: string,
 *     rationale: string,
 *     category: 'go-deeper' | 'explore-more' | 'fill-gap',
 *     priority: 1 | 2 | 3 | 4,
 *     confidence: number,
 *     whyBullets: string[],
 *     icon: string (optional - icon key for visual hint)
 *   }],
 *   gaps: [{
 *     type: 'recipes' | 'reviews' | 'warranty' | 'accessories' | 'specs' | 'comparisons',
 *     query: string,
 *     label: string,
 *     explanation: string
 *   }]
 * }
 */

// ============================================
// Spectrum-inspired SVG Icons (18x18 viewBox)
// Preloaded for use in suggestion cards
// ============================================

const ADVISOR_ICONS = {
  // Compare - two items side by side
  compare: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <rect x="1" y="3" width="6" height="12" rx="1" opacity="0.4"/>
    <rect x="11" y="3" width="6" height="12" rx="1"/>
    <path d="M8 9h2" stroke="currentColor" stroke-width="1.5" fill="none"/>
  </svg>`,

  // Recipes - chef hat / cooking
  recipes: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <path d="M9 2C6.5 2 4.5 3.5 4.5 5.5c0 1 .5 2 1.5 2.5v7a1 1 0 001 1h4a1 1 0 001-1v-7c1-.5 1.5-1.5 1.5-2.5C13.5 3.5 11.5 2 9 2z"/>
    <circle cx="9" cy="5" r="1.5" fill="white" opacity="0.5"/>
  </svg>`,

  // Reviews - star rating
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <path d="M9 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L9 14.01l-4.94 2.69.94-5.49-4-3.9 5.53-.8L9 1.5z"/>
  </svg>`,

  // Warranty / Protection - shield
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <path d="M9 1L3 4v5c0 4.5 2.5 7.5 6 9 3.5-1.5 6-4.5 6-9V4L9 1z"/>
    <path d="M7.5 9l1.5 1.5 3-3" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Specs / Technical - gear
  gear: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <path d="M9 6a3 3 0 100 6 3 3 0 000-6zm7.5 2.5h-1.7a5.5 5.5 0 00-.8-1.9l1.2-1.2-1.1-1.1-1.2 1.2a5.5 5.5 0 00-1.9-.8V3h-1.5v1.7a5.5 5.5 0 00-1.9.8L6.4 4.3 5.3 5.4l1.2 1.2a5.5 5.5 0 00-.8 1.9H4v1.5h1.7a5.5 5.5 0 00.8 1.9l-1.2 1.2 1.1 1.1 1.2-1.2a5.5 5.5 0 001.9.8V15h1.5v-1.7a5.5 5.5 0 001.9-.8l1.2 1.2 1.1-1.1-1.2-1.2a5.5 5.5 0 00.8-1.9h1.7V8.5z"/>
  </svg>`,

  // Explore / Discover - lightbulb
  lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <path d="M9 1.5a5 5 0 00-3 9v2.5a1 1 0 001 1h4a1 1 0 001-1V10.5a5 5 0 00-3-9z"/>
    <rect x="7" y="15" width="4" height="1.5" rx="0.5"/>
    <path d="M9 4v3M7 6h4" stroke="white" stroke-width="1" fill="none" opacity="0.5"/>
  </svg>`,

  // Help / Support - question mark
  help: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <circle cx="9" cy="9" r="8"/>
    <path d="M7 7a2 2 0 114 0c0 1-1 1.5-1 2.5v.5" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <circle cx="9" cy="13" r="1" fill="white"/>
  </svg>`,

  // Accessories / Add-ons - puzzle piece
  accessories: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <path d="M14 7h-1V5a2 2 0 00-2-2H9a1.5 1.5 0 010-3 1.5 1.5 0 010 3H7a2 2 0 00-2 2v2H4a1.5 1.5 0 000 3h1v2a2 2 0 002 2h2a1.5 1.5 0 010 3 1.5 1.5 0 010-3h2a2 2 0 002-2v-2h1a1.5 1.5 0 000-3z"/>
  </svg>`,

  // Go Deeper - magnifying glass with plus
  'go-deeper': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <circle cx="7.5" cy="7.5" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="11.5" y1="11.5" x2="16" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M5.5 7.5h4M7.5 5.5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  // Explore More - compass
  'explore-more': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
    <polygon points="9,4 11,8 9,9 7,8" fill="currentColor"/>
    <polygon points="9,14 7,10 9,9 11,10" opacity="0.4"/>
  </svg>`,

  // Fill Gap - checklist / missing item
  'fill-gap': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <rect x="2" y="3" width="4" height="4" rx="1"/>
    <rect x="8" y="4" width="8" height="2" rx="0.5" opacity="0.6"/>
    <rect x="2" y="11" width="4" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 1"/>
    <rect x="8" y="12" width="8" height="2" rx="0.5" opacity="0.6"/>
  </svg>`,

  // Default / Recommendation - thumbs up
  default: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <path d="M5 8v7a1 1 0 001 1h1V7H6a1 1 0 00-1 1z" opacity="0.4"/>
    <path d="M14.5 8h-3l.7-3.5a1 1 0 00-1-1.2L8 7v9h5.5a1.5 1.5 0 001.4-1l1-4a1.5 1.5 0 00-1.4-2z"/>
  </svg>`,
};

// Map categories and types to icons
const ICON_MAP = {
  // Category-based
  'go-deeper': 'go-deeper',
  'explore-more': 'explore-more',
  'fill-gap': 'fill-gap',
  // Type-based (from gaps)
  recipes: 'recipes',
  reviews: 'star',
  warranty: 'shield',
  accessories: 'accessories',
  specs: 'gear',
  comparisons: 'compare',
  comparison: 'compare',
  // Explicit icon names
  compare: 'compare',
  star: 'star',
  shield: 'shield',
  gear: 'gear',
  lightbulb: 'lightbulb',
  help: 'help',
};

// ============================================
// Utility Functions
// ============================================

/**
 * Get the SVG icon HTML for a given key
 * @param {string} key - Icon key (category, type, or explicit icon name)
 * @returns {string} SVG HTML
 */
function getIconSvg(key) {
  const iconKey = ICON_MAP[key] || key;
  return ADVISOR_ICONS[iconKey] || ADVISOR_ICONS.default;
}

/**
 * Navigate to a new query
 * @param {string} query
 */
function navigateToQuery(query) {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('query');
  currentUrl.searchParams.set('q', query);
  window.location.href = currentUrl.toString();
}

/**
 * Parse advisor follow-up data from the block
 * @param {HTMLElement} block
 * @returns {Object|null}
 */
function parseAdvisorData(block) {
  // Try data attribute first (preferred for AI-generated content)
  const dataAttr = block.getAttribute('data-advisor-follow-up');
  if (dataAttr) {
    try {
      return JSON.parse(dataAttr);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[FollowUpAdvisor] Failed to parse data attribute:', e);
    }
  }

  // Fallback: Parse from DA table structure
  // Row 0: JSON data
  const rows = [...block.children];
  if (rows.length > 0) {
    const firstCell = rows[0].querySelector('div');
    if (firstCell) {
      try {
        return JSON.parse(firstCell.textContent?.trim() || '');
      } catch (e) {
        // Not JSON, might be legacy format
      }
    }
  }

  return null;
}

// ============================================
// Component Creation Functions
// ============================================

/**
 * Create an advisor card with icon
 * @param {Object} suggestion
 * @param {boolean} isPrimary
 * @returns {HTMLElement}
 */
function createAdvisorCard(suggestion, isPrimary = false) {
  const card = document.createElement('a');
  card.className = `advisor-card ${isPrimary ? 'advisor-card-primary' : 'advisor-card-secondary'}`;
  card.href = '#';
  card.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToQuery(suggestion.query);
  });

  // Icon
  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'advisor-icon';
  const iconKey = suggestion.icon || suggestion.category || 'default';
  iconWrapper.innerHTML = getIconSvg(iconKey);
  card.appendChild(iconWrapper);

  // Content wrapper
  const content = document.createElement('div');
  content.className = 'advisor-card-content';

  // Headline
  const headline = document.createElement('h4');
  headline.className = 'advisor-headline';
  headline.textContent = suggestion.headline;
  content.appendChild(headline);

  // Rationale
  const rationale = document.createElement('p');
  rationale.className = 'advisor-rationale';
  rationale.textContent = suggestion.rationale;
  content.appendChild(rationale);

  card.appendChild(content);

  return card;
}

/**
 * Create the shimmer loading state with message
 * @returns {HTMLElement}
 */
function createShimmerState() {
  const container = document.createElement('div');
  container.className = 'advisor-shimmer-container';

  // Loading message
  const message = document.createElement('div');
  message.className = 'advisor-shimmer-message';
  message.innerHTML = `
    <div class="shimmer-spinner"></div>
    <span>Finding personalized recommendations...</span>
  `;
  container.appendChild(message);

  // Shimmer cards grid
  const cardsGrid = document.createElement('div');
  cardsGrid.className = 'advisor-cards advisor-cards-shimmer';

  // Create 2 shimmer placeholder cards
  for (let i = 0; i < 2; i++) {
    const card = document.createElement('div');
    card.className = 'advisor-card advisor-card-shimmer';

    // Shimmer icon
    const icon = document.createElement('div');
    icon.className = 'advisor-icon shimmer-element';
    card.appendChild(icon);

    // Content
    const content = document.createElement('div');
    content.className = 'advisor-card-content';

    // Shimmer headline
    const headline = document.createElement('div');
    headline.className = 'shimmer-element shimmer-headline';
    content.appendChild(headline);

    // Shimmer rationale lines
    const rationale1 = document.createElement('div');
    rationale1.className = 'shimmer-element shimmer-rationale';
    content.appendChild(rationale1);

    const rationale2 = document.createElement('div');
    rationale2.className = 'shimmer-element shimmer-rationale shimmer-rationale-short';
    content.appendChild(rationale2);

    card.appendChild(content);
    cardsGrid.appendChild(card);
  }

  container.appendChild(cardsGrid);

  return container;
}

/**
 * Check if suggestions are AI-enhanced (have real rationales) or placeholders
 * @param {Array} suggestions
 * @returns {boolean}
 */
function hasEnhancedSuggestions(suggestions) {
  if (!suggestions || suggestions.length === 0) return false;
  // Check if at least one suggestion has a meaningful rationale
  return suggestions.some((s) => s.rationale && s.rationale.length > 20);
}

// ============================================
// Main Block Decorator
// ============================================

/**
 * Main block decorator
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const advisorData = parseAdvisorData(block);

  if (!advisorData) {
    // Fallback to legacy follow-up behavior if no advisor data
    block.innerHTML = '';
    return;
  }

  // Clear existing content
  block.innerHTML = '';

  // Header with journey indicator
  const headerSection = document.createElement('div');
  headerSection.className = 'advisor-header';

  const title = document.createElement('h3');
  title.className = 'advisor-title';
  title.textContent = 'What would help you next?';
  headerSection.appendChild(title);

  block.appendChild(headerSection);

  // Sort suggestions by priority
  const suggestions = (advisorData.suggestions || []).sort((a, b) => a.priority - b.priority);

  // Check if we have enhanced suggestions or should show shimmer loading state
  const isEnhanced = hasEnhancedSuggestions(suggestions);

  if (isEnhanced) {
    // Cards grid container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'advisor-cards';

    // Primary card (priority 1)
    const primarySuggestion = suggestions.find((s) => s.priority === 1);
    if (primarySuggestion) {
      cardsContainer.appendChild(createAdvisorCard(primarySuggestion, true));
    }

    // Secondary cards (priority > 1) - up to 3 more for total of 4
    const secondarySuggestions = suggestions.filter((s) => s.priority > 1).slice(0, 3);
    secondarySuggestions.forEach((suggestion) => {
      cardsContainer.appendChild(createAdvisorCard(suggestion, false));
    });

    block.appendChild(cardsContainer);
  } else {
    // Show shimmer loading state
    block.appendChild(createShimmerState());
  }
}
