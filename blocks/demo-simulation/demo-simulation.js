/**
 * Demo Simulation Block — Act 6 "16,000 Pages"
 *
 * Opens with existing traffic already flowing — counters populated,
 * personas already discovered, pages already generated.
 * New visitors trickle in at ~1 per 500ms for realism.
 *
 * Option+S triggers the Iliza callback moment.
 */

const INITIAL_PERSONAS = [
  { name: 'Health-Conscious Parent', color: '#22c55e', sessions: 842 },
  { name: 'Fitness Enthusiast', color: '#3b82f6', sessions: 631 },
  { name: 'Home Baker', color: '#f59e0b', sessions: 418 },
  { name: 'Restaurant Owner', color: '#ef4444', sessions: 287 },
  { name: 'College Smoothie', color: '#8b5cf6', sessions: 524 },
  { name: 'Gift Shopper', color: '#ec4899', sessions: 193 },
  { name: 'Fitness Parent', color: '#14b8a6', sessions: 376 },
  { name: 'Weekend Entertainer', color: '#f97316', sessions: 215 },
  { name: 'Juice Bar Operator', color: '#06b6d4', sessions: 89 },
  { name: 'New Parent', color: '#84cc16', sessions: 461 },
  { name: 'Keto Dieter', color: '#d946ef', sessions: 312 },
  { name: 'Culinary Student', color: '#fbbf24', sessions: 147 },
];

const ILIZA_PERSONA = {
  name: 'Margarita Enthusiast', color: '#ff4d4d', sessions: 1, highlight: true,
};

const PAGE_PREVIEWS = [
  { title: 'Quiet Blending for Nursery Mornings', persona: 'New Parent', color: '#84cc16' },
  { title: 'Commercial Blenders: 300 Drinks/Day', persona: 'Juice Bar Operator', color: '#06b6d4' },
  { title: 'Keto Smoothie Meal Prep Guide', persona: 'Keto Dieter', color: '#d946ef' },
  { title: 'Protein Shake Recipes for Athletes', persona: 'Fitness Enthusiast', color: '#3b82f6' },
  { title: 'Artisan Bread & Dough Prep Guide', persona: 'Home Baker', color: '#f59e0b' },
  { title: 'Budget Smoothie Setup for Dorms', persona: 'College Smoothie', color: '#8b5cf6' },
];

const ILIZA_PAGE = {
  title: 'Party Margaritas for 30 — No Cleanup Required',
  persona: 'Margarita Enthusiast',
  color: '#ff4d4d',
};

// Starting values — looks like it's been running for a while
let visitorCount = 4283;
let signalCount = 71490;
let pageCount = 4283;

function createPagePreview(page) {
  const preview = document.createElement('div');
  preview.className = 'demo-sim-page-preview';
  preview.style.setProperty('--page-color', page.color);
  preview.innerHTML = `
    <div class="demo-sim-page-bar" style="background: ${page.color}"></div>
    <div class="demo-sim-page-title">${page.title}</div>
    <div class="demo-sim-page-persona">${page.persona}</div>
    <div class="demo-sim-page-lines">
      <div class="demo-sim-page-line" style="width: 90%"></div>
      <div class="demo-sim-page-line" style="width: 70%"></div>
      <div class="demo-sim-page-line" style="width: 80%"></div>
      <div class="demo-sim-page-line" style="width: 55%"></div>
    </div>
  `;
  return preview;
}

export default function decorate(block) {
  block.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'demo-sim-header';
  header.innerHTML = `
    <h1>Live Traffic — vitamix.com</h1>
    <p class="demo-sim-subtitle">Real-time audience discovery and page generation</p>
  `;
  block.appendChild(header);

  // Counters — start populated
  const counters = document.createElement('div');
  counters.className = 'demo-sim-counters';
  counters.innerHTML = `
    <div class="demo-sim-counter">
      <span class="demo-sim-counter-value" id="sim-visitors">${visitorCount.toLocaleString()}</span>
      <span class="demo-sim-counter-label">Visitors Today</span>
    </div>
    <div class="demo-sim-counter">
      <span class="demo-sim-counter-value" id="sim-signals">${signalCount.toLocaleString()}</span>
      <span class="demo-sim-counter-label">Signals Collected</span>
    </div>
    <div class="demo-sim-counter">
      <span class="demo-sim-counter-value" id="sim-pages">${pageCount.toLocaleString()}</span>
      <span class="demo-sim-counter-label">Pages Generated</span>
    </div>
    <div class="demo-sim-counter">
      <span class="demo-sim-counter-value" id="sim-personas">${INITIAL_PERSONAS.length}</span>
      <span class="demo-sim-counter-label">Personas Discovered</span>
    </div>
  `;
  block.appendChild(counters);

  // Personas grid — pre-populated
  const personasSection = document.createElement('div');
  personasSection.className = 'demo-sim-section';
  personasSection.innerHTML = `
    <h2>Discovered Audiences</h2>
    <div class="demo-sim-personas" id="sim-personas-grid"></div>
  `;
  block.appendChild(personasSection);

  const personasGrid = personasSection.querySelector('#sim-personas-grid');
  INITIAL_PERSONAS.forEach((persona) => {
    const card = document.createElement('div');
    card.className = 'demo-sim-persona-card';
    card.style.setProperty('--persona-color', persona.color);
    card.innerHTML = `
      <div class="demo-sim-persona-dot" style="background: ${persona.color}"></div>
      <span>${persona.name}</span>
      <span class="demo-sim-persona-count">${persona.sessions}</span>
    `;
    personasGrid.appendChild(card);
  });

  // Page montage — pre-populated
  const montage = document.createElement('div');
  montage.className = 'demo-sim-section';
  montage.innerHTML = `
    <h2>Recent Generated Pages <span class="demo-sim-subtle">— every one unique, every one on-brand</span></h2>
    <div class="demo-sim-montage" id="sim-montage"></div>
  `;
  block.appendChild(montage);

  const montageEl = montage.querySelector('#sim-montage');
  PAGE_PREVIEWS.forEach((page) => {
    montageEl.appendChild(createPagePreview(page));
  });

  // Live ticker — 1 new visitor every ~500ms
  const visitorsEl = document.getElementById('sim-visitors');
  const signalsEl = document.getElementById('sim-signals');
  const pagesEl = document.getElementById('sim-pages');

  const tickerInterval = setInterval(() => {
    visitorCount += 1;
    signalCount += Math.floor(Math.random() * 12) + 5;
    pageCount += 1;

    visitorsEl.textContent = visitorCount.toLocaleString();
    signalsEl.textContent = signalCount.toLocaleString();
    pagesEl.textContent = pageCount.toLocaleString();

    // Randomly bump a persona's session count
    const cards = personasGrid.querySelectorAll('.demo-sim-persona-count');
    if (cards.length > 0) {
      const idx = Math.floor(Math.random() * cards.length);
      const current = parseInt(cards[idx].textContent, 10);
      cards[idx].textContent = current + 1;
    }
  }, 500);

  // Iliza callback — triggered by Option+S
  let ilizaRevealed = false;
  function revealIliza() {
    if (ilizaRevealed) return;
    ilizaRevealed = true;

    // Add Iliza persona with pop-in
    const personaCountEl = document.getElementById('sim-personas');
    personaCountEl.textContent = INITIAL_PERSONAS.length + 1;

    const card = document.createElement('div');
    card.className = 'demo-sim-persona-card highlight';
    card.style.setProperty('--persona-color', ILIZA_PERSONA.color);
    card.innerHTML = `
      <div class="demo-sim-persona-dot" style="background: ${ILIZA_PERSONA.color}"></div>
      <span>${ILIZA_PERSONA.name}</span>
      <span class="demo-sim-persona-count">1</span>
    `;
    card.style.animation = 'sim-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    personasGrid.appendChild(card);

    // Add Iliza's page to montage
    setTimeout(() => {
      const ilizaPreview = createPagePreview(ILIZA_PAGE);
      ilizaPreview.style.animation = 'sim-slide-up 0.5s ease-out';
      ilizaPreview.classList.add('demo-sim-page-highlight');
      montageEl.appendChild(ilizaPreview);
    }, 800);

    // Glow effect
    setTimeout(() => {
      card.classList.add('demo-sim-iliza-glow');
    }, 1200);
  }

  window.addEventListener('demo-start-simulation', revealIliza);

  // Cleanup on navigation
  window.addEventListener('beforeunload', () => {
    clearInterval(tickerInterval);
  });
}
