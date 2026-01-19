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
 *     priority: 1 | 2 | 3,
 *     confidence: number,
 *     whyBullets: string[]
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
// Utility Functions
// ============================================

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
// Icon Mapping
// ============================================

const QUESTION_ICONS = {
  price: '💰',
  recipe: '🍳',
  review: '⭐',
  compare: '⚖️',
  specs: '📋',
  warranty: '🛡️',
  accessories: '🔧',
  help: '❓',
};

// ============================================
// Component Creation Functions
// ============================================

/**
 * Create the question section with clickable options
 * @param {Object} question - { templateId, question, options }
 * @returns {HTMLElement}
 */
function createQuestionSection(question) {
  const section = document.createElement('div');
  section.className = 'advisor-question-section';

  // Question text
  const questionText = document.createElement('div');
  questionText.className = 'advisor-question-text';
  questionText.textContent = question.question;
  section.appendChild(questionText);

  // Options container
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'advisor-question-options';

  question.options.forEach((option) => {
    const optionEl = document.createElement('button');
    optionEl.className = 'advisor-question-option';
    optionEl.type = 'button';

    // Icon
    if (option.icon && QUESTION_ICONS[option.icon]) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'option-icon';
      iconSpan.textContent = QUESTION_ICONS[option.icon];
      optionEl.appendChild(iconSpan);
    }

    // Label
    const labelSpan = document.createElement('span');
    labelSpan.className = 'option-label';
    labelSpan.textContent = option.label;
    optionEl.appendChild(labelSpan);

    optionEl.addEventListener('click', () => {
      navigateToQuery(option.query);
    });

    optionsContainer.appendChild(optionEl);
  });

  section.appendChild(optionsContainer);

  return section;
}

/**
 * Create a primary advisor card with clickable headline
 * @param {Object} suggestion
 * @returns {HTMLElement}
 */
function createPrimaryCard(suggestion) {
  const card = document.createElement('a');
  card.className = 'advisor-card advisor-card-primary';
  card.href = '#';
  card.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToQuery(suggestion.query);
  });

  // Badge
  const badge = document.createElement('div');
  badge.className = 'advisor-badge';
  badge.innerHTML = '<span class="badge-icon">★</span> Recommended';
  card.appendChild(badge);

  // Headline
  const headline = document.createElement('h4');
  headline.className = 'advisor-headline';
  headline.textContent = suggestion.headline;
  card.appendChild(headline);

  // Rationale
  const rationale = document.createElement('p');
  rationale.className = 'advisor-rationale';
  rationale.textContent = suggestion.rationale;
  card.appendChild(rationale);

  return card;
}

/**
 * Create a secondary advisor card
 * @param {Object} suggestion
 * @returns {HTMLElement}
 */
function createSecondaryCard(suggestion) {
  const card = document.createElement('a');
  card.className = 'advisor-card advisor-card-secondary';
  card.href = '#';
  card.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToQuery(suggestion.query);
  });

  // Badge
  const badge = document.createElement('div');
  badge.className = 'advisor-badge';
  badge.textContent = 'Also consider';
  card.appendChild(badge);

  // Headline
  const headline = document.createElement('h4');
  headline.className = 'advisor-headline';
  headline.textContent = suggestion.headline;
  card.appendChild(headline);

  // Short rationale
  const rationale = document.createElement('p');
  rationale.className = 'advisor-rationale';
  rationale.textContent = suggestion.rationale;
  card.appendChild(rationale);

  return card;
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

  // Render question section if available (instant template-based question)
  if (advisorData.question && advisorData.question.options?.length >= 2) {
    const questionSection = createQuestionSection(advisorData.question);
    block.appendChild(questionSection);
  }

  // Sort suggestions by priority
  const suggestions = (advisorData.suggestions || []).sort((a, b) => a.priority - b.priority);

  // Cards grid container
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'advisor-cards';

  // Primary card (priority 1)
  const primarySuggestion = suggestions.find((s) => s.priority === 1);
  if (primarySuggestion) {
    cardsContainer.appendChild(createPrimaryCard(primarySuggestion));
  }

  // Secondary cards (priority > 1)
  const secondarySuggestions = suggestions.filter((s) => s.priority > 1).slice(0, 3);
  secondarySuggestions.forEach((suggestion) => {
    cardsContainer.appendChild(createSecondaryCard(suggestion));
  });

  block.appendChild(cardsContainer);
}
