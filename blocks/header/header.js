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
    const sections = [...fragment.querySelectorAll(':scope > div')];

    // Logo/Title section (first div)
    const logoSection = document.createElement('div');
    logoSection.className = 'nav-logo';
    if (sections[0]) {
      const picture = sections[0].querySelector('picture');
      const link = document.createElement('a');
      link.href = 'https://www.vitamix.com/';
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

    // Tools section (from nav fragment 3rd section)
    const toolsSection = document.createElement('div');
    toolsSection.className = 'nav-tools';
    toolsSection.id = 'nav-tools';

    if (sections[2]) {
      const toolsUl = sections[2].querySelector('ul');
      if (toolsUl) {
        const toolsList = document.createElement('ul');
        toolsUl.querySelectorAll(':scope > li').forEach((li) => {
          const newLi = document.createElement('li');
          // Handle both li > a and li > p > a structures
          const link = li.querySelector(':scope > a') || li.querySelector(':scope > p > a');
          const nestedUl = li.querySelector('ul');

          if (link && !nestedUl) {
            // Simple link item (Search, Sign Up, Log In)
            const newLink = link.cloneNode(true);
            newLink.classList.add('icon-wrapper');
            // Ensure icon is loaded
            const icon = newLink.querySelector('.icon');
            if (icon) {
              const iconName = [...icon.classList].find((c) => c.startsWith('icon-') && c !== 'icon')?.replace('icon-', '');
              if (iconName && !icon.querySelector('svg, img')) {
                icon.innerHTML = `<img data-icon-name="${iconName}" src="/icons/${iconName}.svg" alt="" loading="lazy">`;
              }
            }
            newLi.appendChild(newLink);
          } else if (nestedUl) {
            // Language dropdown
            newLi.className = 'nav-tools-language';

            // Create button trigger
            const button = document.createElement('button');
            button.className = 'icon-wrapper';
            button.setAttribute('aria-haspopup', 'true');
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-controls', 'language-menu');
            button.setAttribute('aria-label', 'Choose Language');

            // Get icon and label from <p> elements
            const iconP = li.querySelector(':scope > p .icon');
            const pElements = li.querySelectorAll(':scope > p');
            // Label could be in second <p> or as text in first <p> after icon
            let labelText = pElements[1]?.textContent?.trim();
            if (!labelText && pElements[0]) {
              // Get text content excluding the icon
              const firstP = pElements[0].cloneNode(true);
              firstP.querySelector('.icon')?.remove();
              labelText = firstP.textContent?.trim();
            }
            if (!labelText) labelText = 'English (US)'; // Default

            if (iconP) {
              const iconClone = iconP.cloneNode(true);
              const iconName = [...iconClone.classList].find((c) => c.startsWith('icon-') && c !== 'icon')?.replace('icon-', '');
              if (iconName && !iconClone.querySelector('svg, img')) {
                iconClone.innerHTML = `<img data-icon-name="${iconName}" src="/icons/${iconName}.svg" alt="" loading="lazy">`;
              }
              button.appendChild(iconClone);
            }
            button.appendChild(document.createTextNode(labelText));

            // Create dropdown menu
            const menu = document.createElement('ul');
            menu.setAttribute('role', 'menu');
            menu.id = 'language-menu';

            nestedUl.querySelectorAll('li').forEach((langLi) => {
              const menuItem = document.createElement('li');
              const links = langLi.querySelectorAll('a');
              const langIcon = langLi.querySelector('.icon');

              // Handle both linked and text-only language items
              if (links.length >= 1) {
                // Has at least one link
                const menuLink = document.createElement('a');
                menuLink.href = links[0].href;
                menuLink.className = 'icon-wrapper';

                if (langIcon) {
                  const iconClone = langIcon.cloneNode(true);
                  const iconName = [...iconClone.classList].find((c) => c.startsWith('icon-') && c !== 'icon')?.replace('icon-', '');
                  if (iconName && !iconClone.querySelector('svg, img')) {
                    iconClone.innerHTML = `<img data-icon-name="${iconName}" src="/icons/${iconName}.svg" alt="" loading="lazy">`;
                  }
                  menuLink.appendChild(iconClone);
                }

                const textContainer = document.createElement('p');
                if (links.length >= 2) {
                  const countrySpan = document.createElement('span');
                  countrySpan.textContent = links[1].textContent;
                  const langSpan = document.createElement('span');
                  langSpan.textContent = links[0].textContent.replace(/<\/?strong>/g, '');
                  textContainer.appendChild(countrySpan);
                  textContainer.appendChild(langSpan);
                } else {
                  textContainer.textContent = links[0].textContent;
                }
                menuLink.appendChild(textContainer);
                menuItem.appendChild(menuLink);
              } else if (langIcon || langLi.textContent.trim()) {
                // Text-only item (no links)
                const menuSpan = document.createElement('span');
                menuSpan.className = 'icon-wrapper';

                if (langIcon) {
                  const iconClone = langIcon.cloneNode(true);
                  const iconName = [...iconClone.classList].find((c) => c.startsWith('icon-') && c !== 'icon')?.replace('icon-', '');
                  if (iconName && !iconClone.querySelector('svg, img')) {
                    iconClone.innerHTML = `<img data-icon-name="${iconName}" src="/icons/${iconName}.svg" alt="" loading="lazy">`;
                  }
                  menuSpan.appendChild(iconClone);
                }

                // Get text without icon
                const textClone = langLi.cloneNode(true);
                textClone.querySelector('.icon')?.remove();
                const itemText = textClone.textContent.trim();
                if (itemText) {
                  const textP = document.createElement('p');
                  textP.textContent = itemText;
                  menuSpan.appendChild(textP);
                }

                menuItem.appendChild(menuSpan);
              }
              if (menuItem.children.length) menu.appendChild(menuItem);
            });

            newLi.appendChild(button);
            newLi.appendChild(menu);

            // Add click handler for dropdown
            button.addEventListener('click', (e) => {
              e.stopPropagation();
              const expanded = button.getAttribute('aria-expanded') === 'true';
              button.setAttribute('aria-expanded', !expanded);
              newLi.classList.toggle('open', !expanded);
            });

            // Close on outside click
            document.addEventListener('click', () => {
              button.setAttribute('aria-expanded', 'false');
              newLi.classList.remove('open');
            });
          }

          toolsList.appendChild(newLi);
        });
        toolsSection.appendChild(toolsList);
      }
    }

    // Add Cart link from 4th section
    if (sections[3]) {
      const cartLink = sections[3].querySelector('a');
      if (cartLink) {
        const cartLi = document.createElement('li');
        const newCartLink = cartLink.cloneNode(true);
        newCartLink.classList.add('icon-wrapper');
        const icon = newCartLink.querySelector('.icon');
        if (icon) {
          const iconName = [...icon.classList].find((c) => c.startsWith('icon-') && c !== 'icon')?.replace('icon-', '');
          if (iconName && !icon.querySelector('svg, img')) {
            icon.innerHTML = `<img data-icon-name="${iconName}" src="/icons/${iconName}.svg" alt="" loading="lazy">`;
          }
        }
        cartLi.appendChild(newCartLink);
        const toolsList = toolsSection.querySelector('ul') || document.createElement('ul');
        if (!toolsSection.querySelector('ul')) toolsSection.appendChild(toolsList);
        toolsList.appendChild(cartLi);
      }
    }

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
