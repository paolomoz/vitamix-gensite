/**
 * Header Block
 *
 * Clean, professional header matching vitamix.com.
 * Features: Logo, navigation, AI-powered search, tools.
 */

// Media query for desktop
const isDesktop = window.matchMedia('(min-width: 1000px)');

/**
 * Toggles mobile menu state
 * @param {HTMLElement} nav - Navigation element
 * @param {boolean} forceExpanded - Force expand/collapse state
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
 * Creates the search bar component
 * @returns {HTMLElement} Search container element
 */
function createSearchBar() {
  const searchContainer = document.createElement('div');
  searchContainer.className = 'nav-search';
  searchContainer.innerHTML = `
    <div class="header-search-container">
      <input type="text" placeholder="What would you like to explore?" aria-label="Search query">
      <button type="button" class="header-explore-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
          <path d="M20 3v4"/><path d="M22 5h-4"/>
          <path d="M4 17v2"/><path d="M5 18H3"/>
        </svg>
        <span>Explore</span>
      </button>
    </div>
  `;
  return searchContainer;
}

/**
 * Creates AI mode toggle
 * @returns {HTMLElement} Toggle element
 */
function createAIModeToggle() {
  const savedMode = sessionStorage.getItem('ai-mode') || 'speed';
  const toggle = document.createElement('div');
  toggle.className = 'nav-ai-toggle';
  toggle.innerHTML = `
    <button type="button" class="ai-toggle-option${savedMode === 'speed' ? ' active' : ''}" data-value="speed" title="Fast generation with Cerebras">Speed</button>
    <button type="button" class="ai-toggle-option${savedMode === 'quality' ? ' active' : ''}" data-value="quality" title="Quality generation with Claude">Quality</button>
  `;

  // Toggle click handler
  toggle.querySelectorAll('.ai-toggle-option').forEach((option) => {
    option.addEventListener('click', () => {
      toggle.querySelectorAll('.ai-toggle-option').forEach((opt) => opt.classList.remove('active'));
      option.classList.add('active');
      sessionStorage.setItem('ai-mode', option.dataset.value);
    });
  });

  return toggle;
}

/**
 * Creates share button
 * @returns {HTMLElement} Share button element
 */
function createShareButton() {
  const shareButton = document.createElement('button');
  shareButton.className = 'header-share-btn';
  shareButton.type = 'button';
  shareButton.title = 'Share link will be available after page is saved';
  shareButton.disabled = true;
  shareButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
    <span>Share</span>
  `;

  let publishedUrl = null;

  // Show notification helper
  const showCopyNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(notification);
    requestAnimationFrame(() => notification.classList.add('show'));
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  };

  // Click handler
  shareButton.addEventListener('click', async () => {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      showCopyNotification('Link copied to clipboard!');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = publishedUrl;
      textArea.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showCopyNotification('Link copied to clipboard!');
    }
  });

  // Listen for page-published event
  window.addEventListener('page-published', (e) => {
    publishedUrl = e.detail.url;
    shareButton.disabled = false;
    shareButton.title = 'Copy link to this page';
  });

  return shareButton;
}

/**
 * Loads and decorates the header
 * @param {Element} block - The header block element
 */
export default async function decorate(block) {
  block.textContent = '';

  // Create nav structure
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // Logo
  const logo = document.createElement('div');
  logo.className = 'nav-logo';
  logo.innerHTML = `
    <a href="/" aria-label="Vitamix Home">
      <img src="/icons/logo.svg" alt="Vitamix" width="160" height="35">
    </a>
  `;

  // Nav sections (main navigation links)
  const sections = document.createElement('div');
  sections.className = 'nav-sections';
  sections.innerHTML = `
    <ul>
      <li><a href="https://www.vitamix.com/us/en_us/shop">Shop</a></li>
      <li><a href="https://www.vitamix.com/us/en_us/why-vitamix">Why Vitamix</a></li>
      <li><a href="https://www.vitamix.com/us/en_us/recipes">Recipes</a></li>
      <li><a href="https://www.vitamix.com/us/en_us/support">Support</a></li>
    </ul>
  `;

  // Tools (Account, Cart)
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  tools.innerHTML = `
    <a href="https://www.vitamix.com/us/en_us/customer/account" aria-label="Account">
      <span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
      <span>Account</span>
    </a>
    <a href="https://www.vitamix.com/us/en_us/checkout/cart" aria-label="Cart">
      <span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></span>
      <span>Cart</span>
    </a>
  `;

  // Hamburger menu (mobile)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `
    <button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>
  `;
  hamburger.addEventListener('click', () => toggleMenu(nav));

  // Create search bar and controls
  const searchContainer = createSearchBar();
  const aiToggle = createAIModeToggle();
  const shareButton = createShareButton();

  // Search functionality
  const searchInput = searchContainer.querySelector('input');
  const searchButton = searchContainer.querySelector('.header-explore-btn');

  const doSearch = () => {
    const query = searchInput.value.trim();
    if (!query) return;

    // Show spinner
    searchButton.disabled = true;
    searchInput.disabled = true;
    searchButton.innerHTML = '<div class="header-search-spinner"></div>';

    // Get selected AI mode
    const aiMode = sessionStorage.getItem('ai-mode') || 'quality';
    const preset = aiMode === 'quality' ? 'production' : 'all-cerebras';
    window.location.href = `/?q=${encodeURIComponent(query)}&preset=${preset}`;
  };

  searchButton.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  });

  // Update AI toggle to reflect current page mode
  const urlParams = new URLSearchParams(window.location.search);
  const currentPreset = urlParams.get('preset');
  const aiToggleOptions = aiToggle.querySelectorAll('.ai-toggle-option');

  if (currentPreset === 'all-cerebras') {
    aiToggleOptions.forEach((opt) => opt.classList.remove('active'));
    aiToggle.querySelector('[data-value="speed"]').classList.add('active');
    sessionStorage.setItem('ai-mode', 'speed');
  } else if (currentPreset === 'production' || urlParams.has('q')) {
    aiToggleOptions.forEach((opt) => opt.classList.remove('active'));
    aiToggle.querySelector('[data-value="quality"]').classList.add('active');
    sessionStorage.setItem('ai-mode', 'quality');
  }

  // Assemble nav
  nav.appendChild(hamburger);
  nav.appendChild(logo);
  nav.appendChild(sections);

  // Only show search on non-home pages
  const isHomePage = window.location.pathname === '/' && !window.location.search;
  if (!isHomePage) {
    nav.appendChild(searchContainer);
    nav.appendChild(aiToggle);
    nav.appendChild(shareButton);
  }

  nav.appendChild(tools);

  // Responsive handling
  toggleMenu(nav, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, isDesktop.matches));

  // Wrap and append
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.appendChild(nav);
  block.appendChild(navWrapper);
}
