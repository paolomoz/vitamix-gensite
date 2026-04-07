/**
 * Demo Dashboard Block — Acts 5 & 6 Marketer's View
 * Matches AEM Experience Manager shell (Figma UCX Demo 2026)
 * Spectrum 2 light theme, stage-optimized
 *
 * Act 5: Content Intelligence — metrics + table (left) + live feed (right), above the fold
 * Act 6: Gaps + Opportunities merged into one screen
 *
 * Keyboard: Option+5 → Act 5, Option+6 → Act 6
 */

/* ── Data ── */

const METRICS = [
  {
    label: 'Engagement', value: '78%', trend: '+15%', trendDir: 'up', spark: [32, 38, 35, 42, 48, 52, 58, 62, 68, 72, 78],
  },
  {
    label: 'Conversion rate', value: '14.2%', trend: '+3.4%', trendDir: 'up', spark: [6, 7, 7.5, 8, 9, 10, 10.5, 11, 12, 13, 14.2],
  },
  {
    label: 'Trust score', value: '81%', trend: '+9%', trendDir: 'up', spark: [52, 55, 58, 62, 64, 68, 70, 74, 76, 79, 81],
  },
];

const SEGMENTS = [
  { name: 'Health-Conscious', content: 'Recipe Cards', impact: 92, status: 'high', color: '#079355' },
  { name: 'Busy Parents', content: 'Quick-Start Guides', impact: 78, status: 'high', color: '#3b63fb' },
  { name: 'Gift Buyers', content: 'Product Comparisons', impact: 54, status: 'medium', color: '#e68619' },
  { name: 'Pro / Commercial', content: 'Spec Sheets', impact: 31, status: 'low', color: '#d73220' },
];

const LIVE_FEED = [
  { time: 'just now', query: '"quiet blender nursery"', blocks: 4 },
  { time: '4s ago', query: '"protein smoothie college"', blocks: 6 },
  { time: '9s ago', query: '"margarita party 30 people"', blocks: 5 },
  { time: '15s ago', query: '"baby food puree vitamix"', blocks: 4 },
  { time: '22s ago', query: '"commercial blender restaurant"', blocks: 7 },
  { time: '30s ago', query: '"gift for mom who cooks"', blocks: 5 },
  { time: '38s ago', query: '"hot soup blender safe"', blocks: 4 },
  { time: '44s ago', query: '"keto smoothie meal prep"', blocks: 5 },
  { time: '51s ago', query: '"vitamix vs ninja comparison"', blocks: 6 },
  { time: '1m ago', query: '"acai bowl thick consistency"', blocks: 4 },
  { time: '1m ago', query: '"blender under 300 dollars"', blocks: 5 },
  { time: '1m ago', query: '"self cleaning blender easy"', blocks: 3 },
];

const GAPS = [
  { name: 'Noise level comparisons', queries: 89, satisfaction: 42, demand: 75, coverage: 35 },
  { name: 'Competitor comparisons', queries: 124, satisfaction: 38, demand: 90, coverage: 30 },
  { name: 'Baby food & toddler nutrition', queries: 67, satisfaction: 29, demand: 58, coverage: 20 },
];

const OPPORTUNITIES = [
  { rank: 1, title: 'Enhance baby food content', metric: '+15%', metricLabel: 'engagement', queries: 67, segment: 'Parents + Health' },
  { rank: 2, title: 'Add gift registry integration', metric: '+22%', metricLabel: 'conversion', queries: 124, segment: 'Gift buyers' },
  { rank: 3, title: 'Create upgrade path calculator', metric: '+8%', metricLabel: 'conversion', queries: 89, segment: 'Existing owners' },
];

/* ── SVG Icons ── */

const ICONS = {
  home: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l7-5 7 5v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"/><path d="M8 17V10h4v7"/></svg>',
  chart: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16H4V4"/><path d="M4 12l4-4 3 3 5-5"/></svg>',
  content: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 7h6M7 10h4M7 13h5"/></svg>',
  target: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3.5"/><circle cx="10" cy="10" r="0.5" fill="currentColor"/></svg>',
  download: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v10m0 0l-3-3m3 3l3-3M4 15v1a1 1 0 001 1h10a1 1 0 001-1v-1"/></svg>',
  assets: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="2"/><circle cx="7.5" cy="7.5" r="1.5"/><path d="M17 12l-4-4L5 17"/></svg>',
  layers: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2L2 7l8 5 8-5-8-5z"/><path d="M2 13l8 5 8-5"/><path d="M2 10l8 5 8-5"/></svg>',
  link: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12l4-4"/><path d="M11.5 14.5l1.5-1.5a3.5 3.5 0 000-5l-1-1a3.5 3.5 0 00-5 0L5.5 8.5"/><path d="M8.5 5.5L7 7a3.5 3.5 0 000 5l1 1a3.5 3.5 0 005 0l1.5-1.5"/></svg>',
  chat: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h12a1 1 0 011 1v8a1 1 0 01-1 1H7l-3 3V5a1 1 0 011-1z"/></svg>',
  copy: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M13 7V4.5A1.5 1.5 0 0011.5 3h-8A1.5 1.5 0 002 4.5v8A1.5 1.5 0 004.5 14H7"/></svg>',
  heart: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17s-7-4.35-7-8.5A3.5 3.5 0 0110 5.97 3.5 3.5 0 0117 8.5C17 12.65 10 17 10 17z"/></svg>',
  edit: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z"/></svg>',
  lock: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="9" width="10" height="8" rx="1.5"/><path d="M7 9V6a3 3 0 016 0v3"/></svg>',
  folder: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5.5A1.5 1.5 0 014.5 4H8l2 2h5.5A1.5 1.5 0 0117 7.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 14.5v-9z"/></svg>',
  settings: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="3"/><path d="M16.5 12.5a1.5 1.5 0 00.3 1.65l.05.05a1.82 1.82 0 01-1.29 3.1 1.82 1.82 0 01-1.29-.53l-.05-.05a1.5 1.5 0 00-2.56 1.06V18a1.82 1.82 0 01-3.64 0v-.09A1.5 1.5 0 006.4 16.8"/></svg>',
  help: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8"/><path d="M7.5 7.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5"/><circle cx="10" cy="14" r="0.5" fill="currentColor"/></svg>',
  bell: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17.5a1.5 1.5 0 003 0H7a1.5 1.5 0 003 0zM15 11V8a5 5 0 00-10 0v3l-2 3h14l-2-3z"/></svg>',
  grid: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="5.5" height="5.5" rx="1"/><rect x="11.5" y="3" width="5.5" height="5.5" rx="1"/><rect x="3" y="11.5" width="5.5" height="5.5" rx="1"/><rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1"/></svg>',
  chevron: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7l6 6 6-6"/></svg>',
};

/* ── Render helpers ── */

function renderSparkline(data, width = 80, height = 24) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return `<svg class="dd-spark" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <polyline points="${points}" fill="none" stroke="#e68619" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function renderBar(pct, status) {
  const colors = { high: '#079355', medium: '#e68619', low: '#d73220' };
  return `<div class="dd-bar"><div class="dd-bar-fill" style="width:${pct}%;background:${colors[status] || '#3b63fb'}"></div></div>`;
}

function statusBadge(status, label) {
  return `<span class="dd-badge" data-status="${status}">${label}</span>`;
}

/* ── Shell ── */

function buildShell() {
  return `
    <header class="dd-header" role="banner">
      <div class="dd-header-left">
        <button class="dd-header-menu" aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>
        </button>
        <div class="dd-header-logo">
          <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
            <path d="M9.2 0H0v20l9.2-20zM14.8 0H24v20l-9.2-20zM12 7.4L16.6 20h-3.4l-1.4-3.8H8.2L12 7.4z" fill="#eb1000"/>
          </svg>
        </div>
        <span class="dd-header-title">Adobe Experience Manager</span>
      </div>
      <div class="dd-header-right">
        <span class="dd-header-org">Adobe Inc.</span>
        <button class="dd-header-action" aria-label="Help">${ICONS.help}</button>
        <button class="dd-header-action" aria-label="Notifications">${ICONS.bell}</button>
        <button class="dd-header-action" aria-label="Apps">${ICONS.grid}</button>
        <div class="dd-avatar">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#e1e1e1"/>
            <circle cx="16" cy="12" r="5" fill="#717171"/>
            <path d="M6 28a10 10 0 0120 0" fill="#717171"/>
          </svg>
        </div>
      </div>
    </header>
    <div class="dd-body">
      <nav class="dd-sidebar" role="navigation" aria-label="Main navigation">
        <div class="dd-sidebar-top">
          <button class="dd-nav-item dd-nav-active" aria-label="Home" aria-current="page">${ICONS.home}</button>
          <button class="dd-nav-item" aria-label="Workflows">${ICONS.chart}</button>
          <button class="dd-nav-item" aria-label="Content">${ICONS.content}</button>
          <button class="dd-nav-item" aria-label="Analytics">${ICONS.target}</button>
          <button class="dd-nav-item" aria-label="Downloads">${ICONS.download}</button>
          <button class="dd-nav-item" aria-label="Assets">${ICONS.assets}</button>
          <button class="dd-nav-item" aria-label="Layers">${ICONS.layers}</button>
          <button class="dd-nav-item" aria-label="Links">${ICONS.link}</button>
          <button class="dd-nav-item" aria-label="Chat">${ICONS.chat}</button>
          <button class="dd-nav-item" aria-label="Pages">${ICONS.copy}</button>
        </div>
        <div class="dd-sidebar-bottom">
          <button class="dd-nav-item" aria-label="Favorites">${ICONS.heart}</button>
          <button class="dd-nav-item" aria-label="Edit">${ICONS.edit}</button>
          <button class="dd-nav-item" aria-label="Security">${ICONS.lock}</button>
          <button class="dd-nav-item" aria-label="Projects">${ICONS.folder}</button>
          <button class="dd-nav-item" aria-label="Expand">${ICONS.chevron}</button>
          <button class="dd-nav-item" aria-label="Settings">${ICONS.settings}</button>
        </div>
      </nav>
      <main class="dd-main" role="main">
        <div class="dd-content" id="dd-content"></div>
      </main>
    </div>`;
}

/* ── Act 5: Content Intelligence (above the fold, feed as right sidebar) ── */

function buildAct5() {
  return `
    <div class="dd-view dd-act5-layout" id="dd-act5">
      <div class="dd-act5-left">
        <div class="dd-section">
          <div class="dd-section-header">
            <div class="dd-section-icon dd-section-icon-chart">${ICONS.chart}</div>
            <h2 class="dd-section-title">Content performance</h2>
            <div class="dd-card-actions">
              <span class="dd-live-badge"><span class="dd-live-dot"></span>Live</span>
              <span class="dd-meta">2.4K sessions today</span>
            </div>
          </div>
          <p class="dd-card-desc">Project Page Turner is generating personalized pages with <strong>78% engagement</strong> across all segments. <strong>Trust score trending up 9%.</strong></p>
          <div class="dd-metrics-row">
            ${METRICS.map((m) => `
              <div class="dd-metric-card">
                <div class="dd-metric-label">${m.label} <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#717171" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8"/><path d="M10 9v4M10 7h.01"/></svg></div>
                <div class="dd-metric-main">
                  <div class="dd-metric-value">${m.value}</div>
                  ${renderSparkline(m.spark, 64, 28)}
                </div>
                <div class="dd-metric-trend dd-trend-${m.trendDir}">${m.trend} vs last month</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="dd-section">
          <div class="dd-section-header">
            <div class="dd-section-icon dd-section-icon-target">${ICONS.target}</div>
            <h2 class="dd-section-title">What's working</h2>
            <button class="dd-text-btn">View all</button>
          </div>
          <table class="dd-table">
            <thead>
              <tr>
                <th>Segment</th>
                <th>Top content</th>
                <th>Status</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              ${SEGMENTS.map((s) => `
                <tr class="dd-table-accent" style="--row-accent:${s.color}">
                  <td><span class="dd-segment-pill" style="--pill-color:${s.color}">${s.name}</span></td>
                  <td>${s.content}</td>
                  <td>${statusBadge(s.status, s.status === 'high' ? 'High' : s.status === 'medium' ? 'Medium' : 'Low')}</td>
                  <td class="dd-impact-cell">
                    ${renderBar(s.impact, s.status)}
                    <span class="dd-impact-num">${s.impact}%</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <aside class="dd-act5-feed">
        <div class="dd-card dd-card-feed">
          <div class="dd-section-header dd-feed-header">
            <div class="dd-section-icon dd-section-icon-feed">${ICONS.chat}</div>
            <h2 class="dd-section-title">Live feed</h2>
          </div>
          <div class="dd-feed" id="dd-feed">
            ${LIVE_FEED.map((f) => `
              <div class="dd-feed-row">
                <span class="dd-feed-time">${f.time}</span>
                <span class="dd-feed-query">${f.query}</span>
                <span class="dd-feed-result">· ${f.blocks} blocks</span>
              </div>
            `).join('')}
          </div>
        </div>
      </aside>
    </div>`;
}

/* ── Act 6: Gaps + Opportunities (merged) ── */

function buildAct6() {
  const gapColors = ['#3b63fb', '#e68619', '#9256d9'];
  return `
    <div class="dd-view dd-hidden" id="dd-act6">
      <div class="dd-section">
        <div class="dd-section-header">
          <div class="dd-section-icon dd-section-icon-gaps">${ICONS.layers}</div>
          <h2 class="dd-section-title">Content gaps</h2>
          <span class="dd-meta">Surfaced by visitor intent</span>
        </div>
        <div class="dd-gap-cards">
          ${GAPS.map((g, i) => `
            <div class="dd-gap-card" style="--gap-accent:${gapColors[i]}">
              <div class="dd-gap-top">
                <span class="dd-gap-name">${g.name}</span>
                <span class="dd-gap-queries">${g.queries} queries/week</span>
              </div>
              <div class="dd-gap-meta-row">
                <span class="dd-gap-sat-label">Satisfaction</span>
                <span class="dd-gap-sat-value">${g.satisfaction}%</span>
              </div>
              <div class="dd-gap-bars">
                <div class="dd-gap-bar-row">
                  <span class="dd-gap-bar-label">Demand</span>
                  <div class="dd-bar dd-bar-lg"><div class="dd-bar-fill" style="width:${g.demand}%;background:var(--gap-accent)"></div></div>
                  <span class="dd-gap-bar-pct">${g.demand}%</span>
                </div>
                <div class="dd-gap-bar-row">
                  <span class="dd-gap-bar-label">Coverage</span>
                  <div class="dd-bar dd-bar-lg"><div class="dd-bar-fill" style="width:${g.coverage}%;background:#d73220"></div></div>
                  <span class="dd-gap-bar-pct">${g.coverage}%</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="dd-section">
        <div class="dd-section-header">
          <div class="dd-section-icon dd-section-icon-opps">${ICONS.target}</div>
          <h2 class="dd-section-title">Opportunities</h2>
          <span class="dd-meta">Your content roadmap, written by your visitors</span>
        </div>
        <table class="dd-table">
          <thead>
            <tr>
              <th></th>
              <th>Opportunity</th>
              <th>Projected impact</th>
              <th>Queries/week</th>
              <th>Segment</th>
            </tr>
          </thead>
          <tbody>
            ${OPPORTUNITIES.map((o) => `
              <tr class="dd-table-accent" style="--row-accent:${o.rank === 1 ? '#079355' : o.rank === 2 ? '#3b63fb' : '#e68619'}">
                <td><span class="dd-opp-rank">#${o.rank}</span></td>
                <td class="dd-opp-name">${o.title}</td>
                <td class="dd-opp-impact-cell">
                  <div class="dd-bar dd-bar-lg"><div class="dd-bar-fill" style="width:${parseInt(o.metric, 10) * 4}%;background:linear-gradient(90deg,#079355,#2dd4a0)"></div></div>
                  <span class="dd-opp-metric">${o.metric} ${o.metricLabel}</span>
                </td>
                <td>${o.queries}</td>
                <td><span class="dd-opp-segment-pill">${o.segment}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="dd-tagline">Your content roadmap — written by your visitors.</div>
    </div>`;
}

/* ── Live Feed Ticker ── */

function startLiveFeed() {
  const feed = document.getElementById('dd-feed');
  if (!feed) return;

  const extraQueries = [
    { query: '"gift for mom who cooks"', blocks: 5 },
    { query: '"vitamix vs ninja quiet"', blocks: 6 },
    { query: '"toddler smoothie picky eater"', blocks: 4 },
    { query: '"meal prep weekly soups"', blocks: 5 },
    { query: '"self cleaning blender"', blocks: 3 },
    { query: '"acai bowl thick consistency"', blocks: 4 },
    { query: '"blender under 300 dollars"', blocks: 5 },
    { query: '"hot soup blender safe"', blocks: 4 },
    { query: '"frozen fruit smoothie tips"', blocks: 4 },
    { query: '"best blender for nut butter"', blocks: 5 },
    { query: '"soup from scratch winter"', blocks: 6 },
    { query: '"green smoothie beginner"', blocks: 4 },
    { query: '"restaurant grade blender home"', blocks: 7 },
    { query: '"vitamix refurbished worth it"', blocks: 5 },
    { query: '"ice cream maker attachment"', blocks: 3 },
    { query: '"quiet blender apartment living"', blocks: 4 },
    { query: '"wedding registry blender"', blocks: 5 },
    { query: '"protein shake gym morning"', blocks: 4 },
    { query: '"baby puree stage 1 recipes"', blocks: 5 },
    { query: '"juicing vs blending health"', blocks: 6 },
    { query: '"dorm room smoothie setup"', blocks: 3 },
    { query: '"cocktail blender frozen drinks"', blocks: 5 },
    { query: '"grain flour homemade vitamix"', blocks: 4 },
    { query: '"family breakfast smoothie pack"', blocks: 5 },
  ];
  let idx = 0;
  let elapsed = 0;

  function addFeedItem() {
    const q = extraQueries[idx % extraQueries.length];
    const item = document.createElement('div');
    item.className = 'dd-feed-row dd-feed-new';
    item.innerHTML = `
      <span class="dd-feed-time">just now</span>
      <span class="dd-feed-query">${q.query}</span>
      <span class="dd-feed-result">· ${q.blocks} blocks</span>
    `;
    feed.prepend(item);

    // Update previous timestamps
    elapsed += 1;
    const items = feed.querySelectorAll('.dd-feed-row');
    items.forEach((row, i) => {
      if (i === 0) return;
      const timeEl = row.querySelector('.dd-feed-time');
      if (!timeEl) return;
      const secs = i * 3 + elapsed;
      timeEl.textContent = secs < 60 ? `${secs}s ago` : `${Math.floor(secs / 60)}m ago`;
    });

    while (feed.children.length > 14) {
      feed.removeChild(feed.lastChild);
    }

    idx += 1;
    // Random delay between 500ms and 8000ms
    const delay = 500 + Math.random() * 7500;
    setTimeout(addFeedItem, delay);
  }

  // Start with a random initial delay
  setTimeout(addFeedItem, 1000 + Math.random() * 2000);
}

/* ── View Switching ── */

function showView(viewId) {
  document.querySelectorAll('.dd-view').forEach((v) => {
    v.classList.add('dd-hidden');
  });
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.remove('dd-hidden');
    target.classList.add('dd-fade-in');
  }
  // Scroll main content area to top, then for Act 6 scroll to bottom
  const main = document.querySelector('.dd-main');
  if (main) {
    main.scrollTo({ top: 0, behavior: 'instant' });
    if (viewId === 'dd-act6') {
      requestAnimationFrame(() => {
        main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
      });
    }
  }
}

/* ── Main ── */

export default function decorate(block) {
  block.innerHTML = '';

  const shell = document.createElement('div');
  shell.className = 'dd-shell';
  shell.innerHTML = buildShell();
  block.appendChild(shell);

  const content = shell.querySelector('#dd-content');
  content.innerHTML = buildAct5() + buildAct6();

  startLiveFeed();

  // Keyboard: Option+5 = Act 5, Option+6 = Act 6
  window.addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    if (e.key === '5' || e.code === 'Digit5') {
      e.preventDefault();
      showView('dd-act5');
    } else if (e.key === '6' || e.code === 'Digit6') {
      e.preventDefault();
      showView('dd-act6');
    }
  });

  // Extension demo controller events
  window.addEventListener('demo-dashboard-view', (e) => {
    if (e.detail) showView(e.detail);
  });

  // URL param for cross-page navigation
  const viewParam = new URLSearchParams(window.location.search).get('view');
  if (viewParam) {
    showView(viewParam);
    window.history.replaceState({}, '', window.location.pathname);
  }
}
