/**
 * Header Block - Vitamix Design
 *
 * Matches vitamix.com header design exactly.
 * Works with the existing nav fragment structure.
 */

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// Media query for desktop
const isDesktop = window.matchMedia('(min-width: 1000px)');

/**
 * Toggles the mobile menu
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';

  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';

  const button = nav.querySelector('.nav-hamburger button');
  if (button) {
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
}

/**
 * Decorates the header block
 */
export default async function decorate(block) {
  // Load nav fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';

  // Create nav structure
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // Extract content from fragment
  if (fragment) {
    const sections = [...fragment.querySelectorAll(':scope > div > div')];

    // Logo/Title section (first div)
    const logoSection = document.createElement('div');
    logoSection.className = 'nav-logo';
    if (sections[0]) {
      const picture = sections[0].querySelector('picture');
      const link = document.createElement('a');
      link.href = '/';
      link.setAttribute('aria-label', 'Vitamix Home');
      if (picture) {
        link.appendChild(picture.cloneNode(true));
      } else {
        // Fallback to SVG logo
        link.innerHTML = '<img src="/icons/logo.svg" alt="Vitamix" width="160" height="35">';
      }
      logoSection.appendChild(link);
    }

    // Navigation links section (second div)
    const navSections = document.createElement('div');
    navSections.className = 'nav-sections';
    navSections.id = 'nav-sections';
    if (sections[1]) {
      const ul = sections[1].querySelector('ul');
      if (ul) {
        const navUl = ul.cloneNode(true);
        // Clean up links
        navUl.querySelectorAll('a').forEach((a) => {
          a.classList.remove('button');
          // Remove strong tags but keep link text
          const strong = a.querySelector('strong');
          if (strong) {
            a.textContent = strong.textContent;
          }
        });
        navSections.appendChild(navUl);
      }
    }

    // Tools section (search icon, etc.)
    const toolsSection = document.createElement('div');
    toolsSection.className = 'nav-tools';
    toolsSection.id = 'nav-tools';

    // Add Account link
    const accountLink = document.createElement('a');
    accountLink.href = 'https://www.vitamix.com/us/en_us/customer/account';
    accountLink.setAttribute('aria-label', 'Account');
    accountLink.innerHTML = `
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </span>
      <span>Account</span>
    `;
    toolsSection.appendChild(accountLink);

    // Add Cart link
    const cartLink = document.createElement('a');
    cartLink.href = 'https://www.vitamix.com/us/en_us/checkout/cart';
    cartLink.setAttribute('aria-label', 'Cart');
    cartLink.innerHTML = `
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      </span>
      <span>Cart</span>
    `;
    toolsSection.appendChild(cartLink);

    // Hamburger menu for mobile
    const hamburger = document.createElement('div');
    hamburger.className = 'nav-hamburger';
    hamburger.innerHTML = `
      <button type="button" aria-controls="nav-sections nav-tools" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>
    `;
    hamburger.querySelector('button').addEventListener('click', () => toggleMenu(nav));

    // Assemble nav
    nav.appendChild(hamburger);
    nav.appendChild(logoSection);
    nav.appendChild(navSections);
    nav.appendChild(toolsSection);
  }

  // Handle responsive
  toggleMenu(nav, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, isDesktop.matches));

  // Wrap and append
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.appendChild(nav);
  block.appendChild(navWrapper);
}
