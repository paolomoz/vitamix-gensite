/**
 * Quick Answer Block
 * Premium quick answer display with dark section background and white card.
 * Follows Vitamix design system patterns from accessibility-specs block.
 */

export default function decorate(block) {
  // Expected structure from AI:
  // Row 1: Headline (short, direct answer)
  // Row 2: Brief explanation
  // Row 3 (optional): Expanded details for "Tell me more"

  const rows = [...block.children];
  if (rows.length < 2) {
    console.warn('quick-answer: Expected at least 2 rows');
    return;
  }

  const headline = rows[0]?.textContent?.trim() || 'Here\'s your answer.';
  const explanation = rows[1]?.textContent?.trim() || '';
  const expandedDetails = rows[2]?.textContent?.trim() || '';

  // Clear the block
  block.innerHTML = '';

  // Create wrapper for dark background
  const wrapper = document.createElement('div');
  wrapper.className = 'quick-answer-wrapper';

  // Create card container
  const card = document.createElement('div');
  card.className = 'quick-answer-card';

  // Header section
  const header = document.createElement('div');
  header.className = 'quick-answer-header';

  // Icon - lightbulb for "quick answer" semantic
  const icon = document.createElement('div');
  icon.className = 'quick-answer-icon';
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18h6"></path>
      <path d="M10 22h4"></path>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
    </svg>
  `;
  header.appendChild(icon);

  // Eyebrow text
  const eyebrow = document.createElement('span');
  eyebrow.className = 'quick-answer-eyebrow';
  eyebrow.textContent = 'Quick Answer';
  header.appendChild(eyebrow);

  // Headline
  const headlineEl = document.createElement('h2');
  headlineEl.className = 'quick-answer-headline';
  headlineEl.textContent = headline;
  header.appendChild(headlineEl);

  card.appendChild(header);

  // Body content
  if (explanation) {
    const body = document.createElement('div');
    body.className = 'quick-answer-body';

    const explanationEl = document.createElement('p');
    explanationEl.className = 'quick-answer-explanation';
    explanationEl.textContent = explanation;
    body.appendChild(explanationEl);

    card.appendChild(body);
  }

  // Expandable "Tell me more" section
  if (expandedDetails) {
    const expander = document.createElement('div');
    expander.className = 'quick-answer-expander';

    const toggleId = `quick-answer-toggle-${Date.now()}`;
    const contentId = `quick-answer-content-${Date.now()}`;

    const toggle = document.createElement('button');
    toggle.className = 'quick-answer-toggle';
    toggle.id = toggleId;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', contentId);
    toggle.innerHTML = `
      <span class="toggle-text">Learn More</span>
      <span class="toggle-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    `;

    const content = document.createElement('div');
    content.className = 'quick-answer-details';
    content.id = contentId;
    content.setAttribute('role', 'region');
    content.setAttribute('aria-labelledby', toggleId);

    const contentInner = document.createElement('div');
    contentInner.className = 'quick-answer-details-content';
    contentInner.textContent = expandedDetails;
    content.appendChild(contentInner);

    toggle.addEventListener('click', () => {
      const isExpanded = expander.classList.toggle('expanded');
      toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      toggle.querySelector('.toggle-text').textContent = isExpanded ? 'Show Less' : 'Learn More';
    });

    expander.appendChild(toggle);
    expander.appendChild(content);
    card.appendChild(expander);
  }

  wrapper.appendChild(card);
  block.appendChild(wrapper);
}
