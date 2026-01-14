/**
 * Analytics Tracker
 *
 * Client-side analytics tracking for Vitamix POC.
 * Tracks sessions, queries, page publications, and CTA conversions.
 */

const ANALYTICS_SESSION_KEY = 'vitamix-analytics-session';

/**
 * @typedef {Object} TrackingEvent
 * @property {string} sessionId - Unique session identifier
 * @property {number} timestamp - Event timestamp
 * @property {'session_start' | 'query' | 'page_published' | 'conversion'} eventType
 * @property {Object} data - Event-specific data
 */

/**
 * @typedef {Object} AnalyticsSession
 * @property {string} sessionId - Unique session identifier
 * @property {number} startTime - Session start timestamp
 * @property {number} queryCount - Number of queries in this session
 * @property {string} lastQuery - Most recent query text
 * @property {string} lastPageUrl - Most recent generated page URL
 */

export class AnalyticsTracker {
  /**
   * @param {Object} options
   * @param {string} options.endpoint - Analytics worker URL
   */
  constructor(options = {}) {
    this.endpoint = options.endpoint || 'https://vitamix-gensite-analytics.paolo-moz.workers.dev';
    this.session = null;
    this.eventQueue = [];
    this.flushTimeout = null;
    this.initialized = false;
  }

  /**
   * Initialize the tracker
   * Sets up session and event listeners
   */
  init() {
    if (this.initialized) return;

    // Respect Do Not Track
    if (navigator.doNotTrack === '1') {
      console.log('[Analytics] Do Not Track enabled, skipping initialization');
      return;
    }

    this.session = this.getOrCreateSession();
    this.setupEventListeners();
    this.initialized = true;

    // Track session start if this is a new session
    if (this.session.isNew) {
      this.trackSessionStart();
    }

    console.log('[Analytics] Initialized with session:', this.session.sessionId);
  }

  /**
   * Get existing session or create a new one
   * @returns {AnalyticsSession & { isNew: boolean }}
   */
  getOrCreateSession() {
    try {
      const stored = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        return { ...session, isNew: false };
      }
    } catch (e) {
      // Ignore parse errors
    }

    // Create new session
    const session = {
      sessionId: crypto.randomUUID(),
      startTime: Date.now(),
      queryCount: 0,
      lastQuery: '',
      lastPageUrl: '',
    };

    this.saveSession(session);
    return { ...session, isNew: true };
  }

  /**
   * Save session to sessionStorage
   * @param {AnalyticsSession} session
   */
  saveSession(session) {
    try {
      const { isNew, ...sessionData } = session;
      sessionStorage.setItem(ANALYTICS_SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('[Analytics] Failed to save session:', e);
    }
  }

  /**
   * Get current session ID
   * @returns {string}
   */
  getSessionId() {
    return this.session?.sessionId || '';
  }

  /**
   * Get consecutive query count for this session
   * @returns {number}
   */
  getQueryCount() {
    return this.session?.queryCount || 0;
  }

  /**
   * Set up event listeners for page-published events
   */
  setupEventListeners() {
    // Listen for page-published events to capture generated page URLs
    window.addEventListener('page-published', (e) => {
      const { url, path } = e.detail || {};
      if (url) {
        this.trackPagePublished(url, path);
      }
    });

    // Send queued events on page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    // Also flush on visibility change (mobile)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(true);
      }
    });
  }

  /**
   * Track session start event
   */
  trackSessionStart() {
    this.queueEvent({
      sessionId: this.session.sessionId,
      timestamp: this.session.startTime,
      eventType: 'session_start',
      data: {
        referrer: document.referrer || '',
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    });
  }

  /**
   * Track a query event
   * @param {Object} queryData
   * @param {string} queryData.query - The user's query text
   * @param {string} [queryData.intent] - Query intent classification
   * @param {string} [queryData.journeyStage] - User's journey stage
   */
  trackQuery(queryData) {
    if (!this.initialized || !this.session) return;

    // Increment query count
    this.session.queryCount += 1;
    this.session.lastQuery = queryData.query || '';
    this.saveSession(this.session);

    this.queueEvent({
      sessionId: this.session.sessionId,
      timestamp: Date.now(),
      eventType: 'query',
      data: {
        query: queryData.query || '',
        intent: queryData.intent || '',
        journeyStage: queryData.journeyStage || '',
        consecutiveQueryNumber: this.session.queryCount,
      },
    });

    console.log('[Analytics] Tracked query:', queryData.query, '(#' + this.session.queryCount + ')');
  }

  /**
   * Track a page published event (when page is saved to DA)
   * @param {string} url - The live URL of the generated page
   * @param {string} [path] - The path of the generated page
   */
  trackPagePublished(url, path) {
    if (!this.initialized || !this.session) return;

    this.session.lastPageUrl = url;
    this.saveSession(this.session);

    this.queueEvent({
      sessionId: this.session.sessionId,
      timestamp: Date.now(),
      eventType: 'page_published',
      data: {
        generatedPageUrl: url,
        generatedPagePath: path || '',
        query: this.session.lastQuery,
      },
    });

    console.log('[Analytics] Tracked page published:', url);
  }

  /**
   * Track a CTA conversion (click to vitamix.com)
   * @param {string} ctaUrl - The URL clicked
   * @param {string} [ctaText] - The CTA text
   */
  trackConversion(ctaUrl, ctaText) {
    if (!this.initialized || !this.session) return;

    this.queueEvent({
      sessionId: this.session.sessionId,
      timestamp: Date.now(),
      eventType: 'conversion',
      data: {
        ctaUrl: ctaUrl || '',
        ctaText: ctaText || '',
        sourceQuery: this.session.lastQuery,
        queryCountAtConversion: this.session.queryCount,
      },
    });

    // Flush immediately for conversions (user is leaving)
    this.flush(true);

    console.log('[Analytics] Tracked conversion:', ctaUrl);
  }

  /**
   * Queue an event for sending
   * @param {TrackingEvent} event
   */
  queueEvent(event) {
    this.eventQueue.push(event);

    // Debounce flush
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flushTimeout = setTimeout(() => this.flush(), 2000);
  }

  /**
   * Flush queued events to the server
   * @param {boolean} [useBeacon=false] - Use sendBeacon for reliability
   */
  flush(useBeacon = false) {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    const payload = JSON.stringify({ events });

    if (useBeacon && navigator.sendBeacon) {
      // Use sendBeacon for page unload
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${this.endpoint}/api/track`, blob);
      console.log('[Analytics] Sent', events.length, 'events via beacon');
    } else {
      // Use fetch for normal operation
      fetch(`${this.endpoint}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch((err) => {
        console.warn('[Analytics] Failed to send events:', err);
        // Re-queue failed events
        this.eventQueue.push(...events);
      });
      console.log('[Analytics] Sent', events.length, 'events via fetch');
    }
  }
}

// Export singleton instance
let trackerInstance = null;

/**
 * Get or create the analytics tracker instance
 * @param {Object} [options]
 * @returns {AnalyticsTracker}
 */
export function getAnalyticsTracker(options) {
  if (!trackerInstance) {
    trackerInstance = new AnalyticsTracker(options);
  }
  return trackerInstance;
}

export default AnalyticsTracker;
