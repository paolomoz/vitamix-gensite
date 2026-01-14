/**
 * Support Triage Block
 * Handles frustrated customers with empathy and clear resolution paths.
 * Prioritizes acknowledgment over sales.
 */

export default function decorate(block) {
  // Expected structure from AI:
  // Row 1: Issue type (e.g., "Container Wobble", "Motor Issue")
  // Row 2: Empathy message
  // Row 3: Resolution info
  // Row 4: Primary CTA (e.g., "Start Warranty Claim")
  // Row 5: Secondary CTA (e.g., "Chat with Support")
  // Row 6 (optional): Troubleshooting steps

  const rows = [...block.children];
  if (rows.length < 5) {
    console.warn('support-triage: Expected at least 5 rows');
    return;
  }

  const issueType = rows[0]?.textContent?.trim() || 'Your Issue';
  const empathyMsg = rows[1]?.textContent?.trim() || 'We understand this is frustrating.';
  const resolution = rows[2]?.textContent?.trim() || '';
  const primaryCtaEl = rows[3]?.querySelector('a');
  const primaryCtaText = primaryCtaEl?.textContent || rows[3]?.textContent?.trim() || 'Get Help';
  const primaryCtaUrl = primaryCtaEl?.href || 'https://www.vitamix.com/support';
  const secondaryCtaEl = rows[4]?.querySelector('a');
  const secondaryCtaText = secondaryCtaEl?.textContent || rows[4]?.textContent?.trim() || 'Chat with Support';
  const secondaryCtaUrl = secondaryCtaEl?.href || 'https://www.vitamix.com/contact';
  const troubleshooting = rows[5]?.innerHTML || '';

  // Clear the block
  block.innerHTML = '';

  // Create the support card
  const card = document.createElement('div');
  card.className = 'support-triage-card';

  // Header with icon
  const header = document.createElement('div');
  header.className = 'support-triage-header';

  const icon = document.createElement('div');
  icon.className = 'support-triage-icon';
  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14,2 14,8 20,8"></polyline><path d="M12 18v-6"></path><path d="M9 15l3 3 3-3"></path></svg>';
  header.appendChild(icon);

  const title = document.createElement('h2');
  title.className = 'support-triage-title';
  title.textContent = "We're Here to Help";
  header.appendChild(title);

  card.appendChild(header);

  // Empathy section
  const empathy = document.createElement('div');
  empathy.className = 'support-triage-empathy';

  const issueLabel = document.createElement('span');
  issueLabel.className = 'support-triage-issue';
  issueLabel.textContent = issueType;
  empathy.appendChild(issueLabel);

  const empathyText = document.createElement('p');
  empathyText.className = 'support-triage-message';
  empathyText.textContent = empathyMsg;
  empathy.appendChild(empathyText);

  card.appendChild(empathy);

  // Resolution info
  if (resolution) {
    const resolutionBox = document.createElement('div');
    resolutionBox.className = 'support-triage-resolution';

    const checkIcon = document.createElement('span');
    checkIcon.className = 'resolution-check';
    checkIcon.innerHTML = '✓';
    resolutionBox.appendChild(checkIcon);

    const resolutionText = document.createElement('span');
    resolutionText.textContent = resolution;
    resolutionBox.appendChild(resolutionText);

    card.appendChild(resolutionBox);
  }

  // CTAs
  const actions = document.createElement('div');
  actions.className = 'support-triage-actions';

  const primaryCta = document.createElement('a');
  primaryCta.className = 'support-triage-cta primary';
  primaryCta.href = primaryCtaUrl;
  primaryCta.target = '_blank';
  primaryCta.textContent = primaryCtaText;
  actions.appendChild(primaryCta);

  const secondaryCta = document.createElement('a');
  secondaryCta.className = 'support-triage-cta secondary';
  secondaryCta.href = secondaryCtaUrl;
  secondaryCta.target = '_blank';
  secondaryCta.textContent = secondaryCtaText;
  actions.appendChild(secondaryCta);

  card.appendChild(actions);

  // Troubleshooting steps (if provided)
  if (troubleshooting) {
    const troubleSection = document.createElement('div');
    troubleSection.className = 'support-triage-troubleshoot';

    const troubleToggle = document.createElement('button');
    troubleToggle.className = 'troubleshoot-toggle';
    troubleToggle.innerHTML = '<span>Try these steps first</span><span class="toggle-arrow">↓</span>';
    troubleToggle.setAttribute('aria-expanded', 'false');

    const troubleContent = document.createElement('div');
    troubleContent.className = 'troubleshoot-content';
    troubleContent.innerHTML = troubleshooting;
    troubleContent.hidden = true;

    troubleToggle.addEventListener('click', () => {
      const isExpanded = troubleToggle.getAttribute('aria-expanded') === 'true';
      troubleToggle.setAttribute('aria-expanded', !isExpanded);
      troubleContent.hidden = isExpanded;
      troubleToggle.querySelector('.toggle-arrow').textContent = isExpanded ? '↓' : '↑';
    });

    troubleSection.appendChild(troubleToggle);
    troubleSection.appendChild(troubleContent);
    card.appendChild(troubleSection);
  }

  // Support hours note
  const note = document.createElement('p');
  note.className = 'support-triage-note';
  note.textContent = 'Support available Mon-Fri 8am-5pm CT';
  card.appendChild(note);

  block.appendChild(card);
}
