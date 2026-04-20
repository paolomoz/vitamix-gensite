/**
 * Demo Controller — keyboard shortcuts for Summit Sneaks presentation
 *
 * Option+1 through Option+6: Jump to each act
 * Option+0: Toggle HUD overlay (act cheat sheet)
 * Option+S: Start Act 6 simulation animation
 *
 * Only active when no input/textarea is focused.
 */

const SITE_BASE = 'https://vitamix.of1.live';
const VITAMIX_ASCENT_URL = 'https://www.vitamix.com/us/en_us/shop/ascent-x-series-blenders';

const ACT2_QUERY = 'I need something quiet for morning smoothies — I have a newborn, kitchen is next to the nursery, and my older kid is obsessed with protein shakes.';
const ACT3_QUERY = 'frozen margaritas for 30 people at a house party, and I don\'t want to clean it after, show me some models';
const ACT3_HERO = 'https://vitamix-gensite-recommender.paolo-moz.workers.dev/hero-images/hero-margarita-party.jpg';

let pendingQueryAct = null; // 2 or 3 — waiting for → to trigger typing

const ACTS = [
  null, // index 0 unused
  { key: '1', label: 'Act 1 — Intro', url: `${SITE_BASE}/intro.html` },
  { key: '2', label: 'Act 2 — Query Wow (→ to type)', url: `${SITE_BASE}/?clear=1` },
  { key: '3', label: 'Act 3 — Iliza (→ to type)', url: `${SITE_BASE}/?clear=1` },
  {
    key: '4', label: 'Act 4 — Browsing (vitamix.com)', url: VITAMIX_ASCENT_URL, external: true,
  },
  { key: '5', label: 'Act 5 — Brand Insights', url: `${SITE_BASE}/dashboard.html` },
];

let hudVisible = false;
let hudEl = null;

/**
 * Create the HUD overlay element
 */
function createHUD() {
  const hud = document.createElement('div');
  hud.id = 'demo-hud';
  hud.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.88);
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 13px;
    padding: 16px 20px;
    border-radius: 12px;
    z-index: 99999;
    display: none;
    min-width: 280px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    line-height: 1.6;
  `;
  hud.innerHTML = `
    <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #ff4d4d;">
      PagePoof Demo Controller
    </div>
    ${ACTS.filter(Boolean).map((act) => `
      <div style="display: flex; justify-content: space-between; gap: 16px;">
        <span style="opacity: 0.6;">⌥${act.key}</span>
        <span>${act.label}</span>
      </div>
    `).join('')}
    <div style="border-top: 1px solid rgba(255,255,255,0.15); margin-top: 8px; padding-top: 8px; font-size: 11px; color: #888; margin-bottom: 4px;">
      Local backups (localhost:3000):
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px;">
      <span style="opacity: 0.6;">⌥W</span>
      <span>Act 2 generated page</span>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px;">
      <span style="opacity: 0.6;">⌥R</span>
      <span>Act 4 generated page</span>
    </div>
    <div style="border-top: 1px solid rgba(255,255,255,0.15); margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; gap: 16px;">
      <span style="opacity: 0.6;">⌥0</span>
      <span>Toggle this HUD</span>
    </div>
  `;
  document.body.appendChild(hud);
  return hud;
}

/**
 * Show a brief toast notification for act transitions
 */
function showToast(text) {
  let toast = document.getElementById('demo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'demo-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 15px;
      font-weight: 600;
      padding: 10px 24px;
      border-radius: 8px;
      z-index: 99999;
      backdrop-filter: blur(10px);
      transition: opacity 0.3s;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.style.opacity = '1';
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 1500);
}

/**
 * Simulate typing a query into an input for dramatic effect
 */
function typeQuery(input, query) {
  input.value = '';
  input.focus();
  let i = 0;
  const interval = setInterval(() => {
    if (i < query.length) {
      input.value += query[i];
      i += 1;
    } else {
      clearInterval(interval);
    }
  }, 15);
}

/**
 * Pre-fill the query form input with the given query
 */
function prefillQuery(query) {
  const input = document.querySelector('#vitamix-form input, #cerebras-form input, .query-form input[type="text"]');
  if (!input) {
    // Retry briefly — block may not be decorated yet
    setTimeout(() => {
      const retryInput = document.querySelector('#vitamix-form input, #cerebras-form input, .query-form input[type="text"]');
      if (retryInput) {
        typeQuery(retryInput, query);
      }
    }, 1000);
    return;
  }
  typeQuery(input, query);
}

/**
 * Navigate to an act
 */
function goToAct(actNum) {
  const act = ACTS[actNum];
  if (!act) return;

  if (act.external) {
    window.open(act.url, '_blank');
    showToast(act.label);
    return;
  }

  // Acts 2 & 3: navigate to clear page, wait for → to trigger typing
  if (actNum === 2 || actNum === 3) {
    pendingQueryAct = actNum;
    const clearUrl = `${SITE_BASE}/?clear=1`;
    if (window.location.href !== clearUrl) {
      window.location.href = `${clearUrl}&demo-pending=${actNum}`;
    }
    return;
  }

  showToast(act.label);

  if (act.url && window.location.href.startsWith(act.url)) {
    return;
  }

  if (act.url) window.location.href = act.url;
}

/**
 * Handle keyboard shortcuts
 */
function handleKeydown(e) {
  // Right arrow: trigger pending query typing (Act 2/3)
  if (e.code === 'ArrowRight' && !e.altKey && !e.metaKey && !e.ctrlKey && pendingQueryAct) {
    e.preventDefault();
    const query = pendingQueryAct === 3 ? ACT3_QUERY : ACT2_QUERY;
    // Set hero override for Act 3 so the generated page uses the party margarita image
    if (pendingQueryAct === 3) {
      sessionStorage.setItem('demo-hero-override', ACT3_HERO);
    }
    pendingQueryAct = null;
    prefillQuery(query);
    return;
  }

  // Down arrow: append " compare the best blenders" to current query
  if (e.code === 'ArrowDown' && !e.altKey && !e.metaKey && !e.ctrlKey) {
    const input = document.querySelector('#vitamix-form input, #cerebras-form input, .query-form input[type="text"]');
    if (input) {
      e.preventDefault();
      const suffix = ' compare the best blenders';
      input.value += suffix;
      input.focus();
      return;
    }
  }

  // Require Option (Alt) key
  if (!e.altKey) return;

  // On Mac, Option+key produces special characters (e.g. Option+1 = ¡)
  // so we use e.code (physical key) instead of e.key
  const digit = e.code.startsWith('Digit') ? parseInt(e.code.replace('Digit', ''), 10) : -1;

  // Option+0: Toggle HUD
  if (digit === 0) {
    e.preventDefault();
    if (!hudEl) hudEl = createHUD();
    hudVisible = !hudVisible;
    hudEl.style.display = hudVisible ? 'block' : 'none';
    return;
  }

  // Option+W: Open local Act 2 backup
  if (e.code === 'KeyW') {
    e.preventDefault();
    window.open('http://localhost:3000/demo/act2', '_blank');
    return;
  }

  // Option+R: Open local Act 4 generated page
  if (e.code === 'KeyR') {
    e.preventDefault();
    window.open('http://localhost:3000/demo/act4-generated', '_blank');
    return;
  }

  // Option+1-5: Navigate to act
  if (digit >= 1 && digit <= 5) {
    e.preventDefault();
    pendingQueryAct = null; // reset when switching acts
    goToAct(digit);
    return;
  }
}

/**
 * Check for demo-prefill param on page load (Act 2 flow)
 */
function checkPrefill() {
  const params = new URLSearchParams(window.location.search);

  // New flow: arrived via demo-pending, waiting for → to trigger typing
  const pending = params.get('demo-pending');
  if (pending) {
    // Keep ?clear=1 if present, strip demo-pending
    params.delete('demo-pending');
    const remaining = params.toString();
    window.history.replaceState({}, '', remaining ? `/?${remaining}` : '/');
    pendingQueryAct = parseInt(pending, 10);
    return;
  }

  // Legacy: demo-prefill auto-types on arrival
  if (params.has('demo-prefill')) {
    window.history.replaceState({}, '', '/');
    setTimeout(() => prefillQuery(ACT2_QUERY), 500);
  }
}

/**
 * Initialize demo controller
 */
/**
 * Watch for hero image and swap it if Act 3 override is set
 */
function watchHeroOverride() {
  const heroOverrideUrl = sessionStorage.getItem('demo-hero-override');
  if (!heroOverrideUrl) return;
  sessionStorage.removeItem('demo-hero-override');

  const observer = new MutationObserver(() => {
    const heroImg = document.querySelector('.hero img, .product-hero img, .hero picture img');
    if (heroImg) {
      heroImg.src = heroOverrideUrl;
      heroImg.removeAttribute('srcset');
      const picture = heroImg.closest('picture');
      if (picture) {
        picture.querySelectorAll('source').forEach((s) => s.remove());
      }
      observer.disconnect();
      // eslint-disable-next-line no-console
      console.log('[Demo] Hero image overridden for Act 3');
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 30000);
}

export default function initDemoController() {
  document.addEventListener('keydown', handleKeydown);
  checkPrefill();
  watchHeroOverride();

  if (window.location.origin === 'https://vitamix.of1.live' && window.location.pathname === '/') {
    pendingQueryAct = 2;
  }
  // eslint-disable-next-line no-console
  console.log('[Demo] Controller ready — Option+0 for HUD');
}
