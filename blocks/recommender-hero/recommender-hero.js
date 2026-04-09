/**
 * Recommender Hero Block
 *
 * A full-width hero with background image, title, and query input form.
 * Used for the Blender Recommender landing page.
 *
 * Content Model:
 * | Recommender Hero |
 * |------------------|
 * | [background-image-url] |
 * | Title text |
 * | Placeholder text |
 * | Button text |
 */

/**
 * Handle form submission - navigates to generation URL
 * Uses the q parameter and respects the speed/quality toggle from header
 * @param {Event} event - Submit event
 * @param {HTMLFormElement} form - The form element
 */
/**
 * Get the preset based on current AI mode setting
 * @returns {string} preset value
 */
function getPreset() {
  const aiMode = sessionStorage.getItem('ai-mode') || 'speed';
  return aiMode === 'speed' ? 'all-cerebras' : 'production';
}

function handleSubmit(event, form) {
  event.preventDefault();

  const textarea = form.querySelector('textarea');
  const submitButton = form.querySelector('button[type="submit"]');
  const query = textarea.value.trim();

  if (!query) {
    textarea.focus();
    return;
  }

  // Show loading state
  submitButton.disabled = true;
  submitButton.classList.add('loading');
  submitButton.textContent = 'Finding your match...';

  const preset = getPreset();

  // Start prefetch if not already running (in case hover didn't fire)
  import('../../scripts/prefetch.js').then((mod) => {
    mod.startPrefetch(query, preset);
  }).catch(() => { /* prefetch is optional */ });

  // SPA navigation: pushState + trigger in-place render
  const url = `/?q=${encodeURIComponent(query)}&preset=${preset}`;
  window.history.pushState({}, '', url);
  window.dispatchEvent(new CustomEvent('prefetch-navigate', {
    detail: { query, preset },
  }));
}

/**
 * Decorate the recommender-hero block
 * @param {HTMLElement} block - The block element
 */
export default function decorate(block) {
  // Get configuration from block content
  const rows = [...block.children];
  let backgroundUrl = 'https://www.vitamix.com/content/dam/vitamix/home/design-system/component/ognm-header-static-image/blender-recommender-lp-header-desktop.jpg';
  let title = 'Blender Recommender';
  let placeholder = 'What will you make with your Vitamix?';
  let buttonText = 'Find My Match';

  rows.forEach((row, index) => {
    const text = row.textContent.trim();
    if (index === 0 && text.startsWith('http')) {
      backgroundUrl = text;
    } else if (index === 0 || (index === 1 && !rows[0].textContent.trim().startsWith('http'))) {
      title = text || title;
    } else if (index === 1 || index === 2) {
      if (text && !text.startsWith('http')) {
        placeholder = text;
      }
    } else if (index === 2 || index === 3) {
      if (text) {
        buttonText = text;
      }
    }
  });

  // Clear block and rebuild
  block.innerHTML = '';

  // Set background image as inline style
  block.style.backgroundImage = `url('${backgroundUrl}')`;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'recommender-hero-overlay';

  // Create content container
  const content = document.createElement('div');
  content.className = 'recommender-hero-content';

  // Add icon
  const icon = document.createElement('div');
  icon.className = 'recommender-hero-icon';
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  `;

  // Add title
  const titleEl = document.createElement('h1');
  titleEl.className = 'recommender-hero-title';
  titleEl.textContent = title;

  // Create form
  const form = document.createElement('form');
  form.className = 'recommender-hero-form';
  form.innerHTML = `
    <div class="recommender-hero-input-wrapper">
      <textarea
        name="query"
        placeholder="${placeholder}"
        autocomplete="off"
        required
        rows="3"
      ></textarea>
      <button type="submit" class="button primary">
        ${buttonText}
      </button>
    </div>
  `;

  // Assemble content
  content.appendChild(icon);
  content.appendChild(titleEl);
  content.appendChild(form);

  block.appendChild(overlay);
  block.appendChild(content);

  // Set up form submission
  form.addEventListener('submit', (event) => handleSubmit(event, form));

  // Pre-warm SSE on submit button hover (if query is typed)
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.addEventListener('mouseenter', () => {
    const textarea2 = form.querySelector('textarea');
    const query = textarea2.value.trim();
    if (query) {
      import('../../scripts/prefetch.js').then((mod) => {
        mod.startPrefetch(query, getPreset());
      }).catch(() => { /* prefetch is optional */ });
    }
  });

  // Submit on Enter key (without Shift)
  const textarea = form.querySelector('textarea');
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  // Focus textarea after a short delay
  setTimeout(() => {
    const textarea2 = form.querySelector('textarea');
    textarea2.focus();
  }, 100);
}
