/**
 * Header Block - Vitamix Design
 *
 * Matches vitamix.com header design exactly.
 * Works with the existing nav fragment structure.
 */

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { SessionContextManager } from '../../scripts/session-context.js';

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
 * Creates the AI Generate panel that expands from the header
 * @returns {Object} - Object containing the button and panel elements
 */
function createAIGeneratePanel() {
  // Create the AI Generate button for nav-tools
  const aiGenerateBtn = document.createElement('button');
  aiGenerateBtn.className = 'icon-wrapper ai-generate-btn';
  aiGenerateBtn.setAttribute('aria-expanded', 'false');
  aiGenerateBtn.setAttribute('aria-controls', 'ai-generate-panel');
  aiGenerateBtn.setAttribute('title', 'Ask');
  aiGenerateBtn.innerHTML = `
    <span class="icon icon-sparkle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
        <circle cx="18" cy="5" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="6" cy="18" r="2" fill="currentColor" stroke="none"/>
      </svg>
    </span>
    <span>Ask</span>
  `;

  // Create the expandable panel
  const panel = document.createElement('div');
  panel.className = 'ai-generate-panel';
  panel.id = 'ai-generate-panel';
  panel.innerHTML = `
    <div class="ai-generate-content">
      <form class="ai-generate-form">
        <input
          type="text"
          class="ai-generate-input"
          placeholder="What would you like to generate?"
          autocomplete="off"
          aria-label="Generation query"
        />
        <button type="submit" class="ai-generate-submit" title="Generate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </form>
      <div class="ai-generate-context"></div>
    </div>
  `;

  const form = panel.querySelector('.ai-generate-form');
  const input = panel.querySelector('.ai-generate-input');
  const contextDiv = panel.querySelector('.ai-generate-context');

  // Update context display
  function updateContext() {
    const context = SessionContextManager.getContext();
    const queryCount = context.queries.length;

    if (queryCount > 0) {
      contextDiv.innerHTML = `<span class="context-indicator">
        <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 12.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zM7.25 4.5v4l3 1.5.5-.87-2.5-1.25V4.5h-1z"/>
        </svg>
        ${queryCount} previous ${queryCount === 1 ? 'query' : 'queries'} in context
      </span>`;
    } else {
      contextDiv.innerHTML = '';
    }
  }

  // Toggle panel
  function togglePanel(forceState = null) {
    const isExpanded = forceState !== null
      ? forceState
      : aiGenerateBtn.getAttribute('aria-expanded') !== 'true';

    aiGenerateBtn.setAttribute('aria-expanded', isExpanded);
    panel.classList.toggle('expanded', isExpanded);
    aiGenerateBtn.classList.toggle('active', isExpanded);

    if (isExpanded) {
      updateContext();
      input.focus();
    }
  }

  // Handle button click
  aiGenerateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel();
  });

  // Handle form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) {
      input.focus();
      return;
    }

    // Build URL with query, preset, and context
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('preset', 'all-cerebras');

    // Add context if we have previous queries (use buildContextParam, not encoded version)
    if (SessionContextManager.hasContext()) {
      const contextParam = SessionContextManager.buildContextParam();
      params.set('ctx', JSON.stringify(contextParam));
    }

    // Navigate
    window.location.href = `/?${params.toString()}`;
  });

  // Handle keyboard shortcuts
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      togglePanel(false);
      aiGenerateBtn.focus();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !aiGenerateBtn.contains(e.target)) {
      togglePanel(false);
    }
  });

  // Global keyboard shortcut (Cmd/Ctrl + G)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'g' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
      e.preventDefault();
      togglePanel();
    }
  });

  return { button: aiGenerateBtn, panel };
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

    // Create AI Generate panel
    const { button: aiGenerateBtn, panel: aiGeneratePanel } = createAIGeneratePanel();

    // Create tools list with AI Generate button first
    const toolsList = document.createElement('ul');

    // Add AI Generate button as first item in tools
    const aiGenerateLi = document.createElement('li');
    aiGenerateLi.className = 'nav-tools-ai-generate';
    aiGenerateLi.appendChild(aiGenerateBtn);
    toolsList.appendChild(aiGenerateLi);

    if (sections[2]) {
      const toolsUl = sections[2].querySelector('ul');
      if (toolsUl) {
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
      }
    }
    toolsSection.appendChild(toolsList);

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

    // Wrap and append
    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.appendChild(nav);
    navWrapper.appendChild(aiGeneratePanel);
    block.appendChild(navWrapper);

    // Handle responsive
    toggleMenu(nav, isDesktop.matches);
    isDesktop.addEventListener('change', () => toggleMenu(nav, isDesktop.matches));
  }
}
