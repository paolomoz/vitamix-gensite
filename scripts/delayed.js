/**
 * Delayed functionality - loaded after critical content
 *
 * This module initializes non-critical features like analytics tracking.
 */

import { AnalyticsTracker } from './analytics-tracker.js';

// Analytics worker URL
const ANALYTICS_ENDPOINT = 'https://vitamix-gensite-analytics.paolo-moz.workers.dev';

/**
 * Initialize analytics tracking
 */
function initAnalytics() {
  try {
    const tracker = new AnalyticsTracker({
      endpoint: ANALYTICS_ENDPOINT,
    });

    // Make tracker available globally
    window.analyticsTracker = tracker;

    // Initialize the tracker
    tracker.init();

    console.log('[Delayed] Analytics tracker initialized');
  } catch (e) {
    console.warn('[Delayed] Failed to initialize analytics:', e);
  }
}

// Initialize when this module loads
initAnalytics();
