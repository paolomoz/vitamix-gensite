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

import { SessionContextManager } from '../../scripts/session-context.js';

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

/**
 * Enhance gaps using client-side session context if server-provided gaps are empty
 * @param {Array} serverGaps - Gaps from server
 * @param {string} journeyStage - Current journey stage
 * @returns {Array}
 */
function enhanceGapsWithSessionContext(serverGaps, journeyStage) {
  // If server provided gaps, use them
  if (serverGaps && serverGaps.length > 0) {
    return serverGaps;
  }

  // Try to get gaps from session context (client-side)
  try {
    if (SessionContextManager && typeof SessionContextManager.getResearchGaps === 'function') {
      const clientGaps = SessionContextManager.getResearchGaps(journeyStage);
      if (clientGaps && clientGaps.length > 0) {
        return clientGaps;
      }
    }
  } catch (e) {
    // Session context not available, continue without gaps
  }

  return [];
}

// ============================================
// Component Creation Functions
// ============================================

/**
 * Create the journey indicator dots
 * @param {string} stage - 'exploring' | 'comparing' | 'deciding'
 * @returns {HTMLElement}
 */
function createJourneyIndicator(stage) {
  const stages = ['exploring', 'comparing', 'deciding'];
  const stageLabels = {
    exploring: 'Exploring',
    comparing: 'Comparing',
    deciding: 'Deciding',
  };

  const currentIndex = stages.indexOf(stage);

  const indicator = document.createElement('div');
  indicator.className = 'journey-indicator';

  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'journey-dots';

  stages.forEach((s, i) => {
    if (i > 0) {
      const line = document.createElement('span');
      line.className = `journey-line${i <= currentIndex ? ' active' : ''}`;
      dotsContainer.appendChild(line);
    }

    const dot = document.createElement('span');
    dot.className = `journey-dot${i <= currentIndex ? ' active' : ''}${i === currentIndex ? ' current' : ''}`;
    dot.setAttribute('aria-label', stageLabels[s]);
    dotsContainer.appendChild(dot);
  });

  indicator.appendChild(dotsContainer);

  const label = document.createElement('span');
  label.className = 'journey-label';
  label.textContent = stageLabels[stage] || 'Exploring';
  indicator.appendChild(label);

  return indicator;
}

/**
 * Create a primary advisor card with full rationale
 * @param {Object} suggestion
 * @returns {HTMLElement}
 */
function createPrimaryCard(suggestion) {
  const card = document.createElement('div');
  card.className = 'advisor-card advisor-card-primary';

  // Badge
  const badge = document.createElement('div');
  badge.className = 'advisor-badge';
  badge.innerHTML = '<span class="badge-star">&#9733;</span> RECOMMENDED';
  card.appendChild(badge);

  // Headline
  const headline = document.createElement('h3');
  headline.className = 'advisor-headline';
  headline.textContent = suggestion.headline;
  card.appendChild(headline);

  // Rationale
  const rationale = document.createElement('p');
  rationale.className = 'advisor-rationale';
  rationale.textContent = suggestion.rationale;
  card.appendChild(rationale);

  // Expandable "Why I suggest this" section
  if (suggestion.whyBullets?.length > 0) {
    const whySection = document.createElement('details');
    whySection.className = 'advisor-why';

    const summary = document.createElement('summary');
    summary.innerHTML = '<span class="why-chevron">&#9660;</span> Why I suggest this';
    whySection.appendChild(summary);

    const bulletList = document.createElement('ul');
    bulletList.className = 'advisor-bullets';
    suggestion.whyBullets.forEach((bullet) => {
      const li = document.createElement('li');
      li.textContent = bullet;
      bulletList.appendChild(li);
    });
    whySection.appendChild(bulletList);

    card.appendChild(whySection);
  }

  // CTA Button
  const cta = document.createElement('button');
  cta.className = 'advisor-cta';
  cta.setAttribute('type', 'button');
  cta.innerHTML = '<span>Explore this</span><span class="cta-arrow">&#8594;</span>';
  cta.addEventListener('click', () => navigateToQuery(suggestion.query));
  card.appendChild(cta);

  return card;
}

/**
 * Create a secondary advisor card with brief rationale
 * @param {Object} suggestion
 * @returns {HTMLElement}
 */
function createSecondaryCard(suggestion) {
  const card = document.createElement('button');
  card.className = 'advisor-card advisor-card-secondary';
  card.setAttribute('type', 'button');

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

  // Click handler on entire card
  card.addEventListener('click', () => navigateToQuery(suggestion.query));

  return card;
}

/**
 * Create the gaps section
 * @param {Array} gaps
 * @returns {HTMLElement|null}
 */
function createGapsSection(gaps) {
  if (!gaps || gaps.length === 0) return null;

  const section = document.createElement('div');
  section.className = 'advisor-gaps';

  const header = document.createElement('div');
  header.className = 'gaps-header';
  header.innerHTML = `
    <h4>GAPS IN YOUR RESEARCH</h4>
    <p>Most buyers also explore these before deciding:</p>
  `.trim();
  section.appendChild(header);

  const gapsList = document.createElement('div');
  gapsList.className = 'gaps-list';

  gaps.forEach((gap) => {
    const gapItem = document.createElement('button');
    gapItem.className = 'gap-chip';
    gapItem.setAttribute('type', 'button');

    const gapLabel = document.createElement('span');
    gapLabel.className = 'gap-label';
    gapLabel.textContent = gap.label;
    gapItem.appendChild(gapLabel);

    const explanation = document.createElement('span');
    explanation.className = 'gap-explanation';
    explanation.textContent = gap.explanation;
    gapItem.appendChild(explanation);

    gapItem.addEventListener('click', () => navigateToQuery(gap.query));
    gapsList.appendChild(gapItem);
  });

  section.appendChild(gapsList);
  return section;
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
  title.textContent = 'WHAT WOULD HELP YOU NEXT?';
  headerSection.appendChild(title);

  if (advisorData.journeyStage) {
    headerSection.appendChild(createJourneyIndicator(advisorData.journeyStage));
  }

  block.appendChild(headerSection);

  // Sort suggestions by priority
  const suggestions = (advisorData.suggestions || []).sort((a, b) => a.priority - b.priority);

  // Primary card (priority 1)
  const primarySuggestion = suggestions.find((s) => s.priority === 1);
  if (primarySuggestion) {
    block.appendChild(createPrimaryCard(primarySuggestion));
  }

  // Secondary cards container
  const secondarySuggestions = suggestions.filter((s) => s.priority > 1).slice(0, 2);
  if (secondarySuggestions.length > 0) {
    const secondaryContainer = document.createElement('div');
    secondaryContainer.className = 'advisor-secondary-container';

    secondarySuggestions.forEach((suggestion) => {
      secondaryContainer.appendChild(createSecondaryCard(suggestion));
    });

    block.appendChild(secondaryContainer);
  }

  // Gaps section - enhance with session context if needed
  const enhancedGaps = enhanceGapsWithSessionContext(
    advisorData.gaps,
    advisorData.journeyStage || 'exploring',
  );
  const gapsSection = createGapsSection(enhancedGaps);
  if (gapsSection) {
    block.appendChild(gapsSection);
  }
}
