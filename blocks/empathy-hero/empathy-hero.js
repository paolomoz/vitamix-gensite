/**
 * Empathy Hero Block
 * A warm, acknowledging hero variant that validates the user's
 * specific situation before presenting solutions.
 * Used for medical, emotional, or challenging situations.
 *
 * NOTE: This block intentionally has NO CTA - it's purely for
 * acknowledgment and comfort. Actionable content follows in
 * subsequent blocks.
 */

export default function decorate(block) {
  // Expected structure from AI:
  // Row 1: Empathy headline (acknowledging their situation)
  // Row 2: Supportive message
  // Row 3: Promise/transition to help
  // (No CTA - empathy blocks are for acknowledgment only)

  const rows = [...block.children];
  if (rows.length < 3) {
    console.warn('empathy-hero: Expected at least 3 rows');
    return;
  }

  const headline = rows[0]?.textContent?.trim() || 'We Understand';
  const message = rows[1]?.textContent?.trim() || '';
  const promise = rows[2]?.textContent?.trim() || '';

  // Clear the block
  block.innerHTML = '';

  // Create the hero content
  const hero = document.createElement('div');
  hero.className = 'empathy-hero-content';

  // Decorative element
  const decoration = document.createElement('div');
  decoration.className = 'empathy-decoration';
  decoration.innerHTML = `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>
      <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.2"/>
      <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
    </svg>
  `;
  hero.appendChild(decoration);

  // Main content
  const content = document.createElement('div');
  content.className = 'empathy-content';

  // Icon
  const icon = document.createElement('div');
  icon.className = 'empathy-icon';
  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
  content.appendChild(icon);

  // Headline
  const headlineEl = document.createElement('h1');
  headlineEl.className = 'empathy-headline';
  headlineEl.textContent = headline;
  content.appendChild(headlineEl);

  // Message
  if (message) {
    const messageEl = document.createElement('p');
    messageEl.className = 'empathy-message';
    messageEl.textContent = message;
    content.appendChild(messageEl);
  }

  // Promise/transition
  if (promise) {
    const promiseEl = document.createElement('p');
    promiseEl.className = 'empathy-promise';
    promiseEl.textContent = promise;
    content.appendChild(promiseEl);
  }

  // No CTA - empathy hero is purely for acknowledgment

  hero.appendChild(content);
  block.appendChild(hero);

  // Add subtle animation
  setTimeout(() => {
    hero.classList.add('animate-in');
  }, 100);
}
