/**
 * Session Context Manager
 *
 * Manages query history for contextual browsing within a browser tab session.
 * Uses sessionStorage - context resets when tab closes.
 */

const CONTEXT_KEY = 'vitamix-session-context';
const MAX_HISTORY = 10;

/**
 * @typedef {Object} QueryHistoryEntry
 * @property {string} query - The user's query
 * @property {number} timestamp - When this query was made
 * @property {string} intent - Intent type (recipe, product_info, comparison, etc.)
 * @property {Object} entities - Extracted entities
 * @property {string[]} entities.products - Product mentions (A3500, etc.)
 * @property {string[]} entities.ingredients - Ingredient mentions
 * @property {string[]} entities.goals - User goals (energy, weight loss, etc.)
 * @property {string} generatedPath - The path of the generated page
 * @property {string[]} [recommendedProducts] - Products shown in response
 * @property {string[]} [recommendedRecipes] - Recipes shown in response
 * @property {string[]} [blockTypes] - Block types that were generated
 * @property {string} [journeyStage] - 'exploring' | 'comparing' | 'deciding'
 * @property {number} [confidence] - AI confidence 0-1
 * @property {string} [nextBestAction] - What AI suggests next
 */

/**
 * @typedef {Object} SessionContext
 * @property {QueryHistoryEntry[]} queries - Array of query history entries
 * @property {number} sessionStart - Timestamp when session started
 * @property {number} lastUpdated - Timestamp of last update
 * @property {string} sessionId - Unique session identifier for analytics
 */

/**
 * Session Context Manager - handles reading/writing query history for contextual browsing
 */
export class SessionContextManager {
  /**
   * Get the current session context from sessionStorage
   * @returns {SessionContext}
   */
  static getContext() {
    try {
      const stored = sessionStorage.getItem(CONTEXT_KEY);
      if (stored) {
        const context = JSON.parse(stored);
        // Ensure sessionId exists for older sessions
        if (!context.sessionId) {
          context.sessionId = crypto.randomUUID();
          sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
        }
        return context;
      }
    } catch (e) {
      // Ignore parse errors, return fresh context
    }
    return {
      queries: [],
      sessionStart: Date.now(),
      lastUpdated: Date.now(),
      sessionId: crypto.randomUUID(),
    };
  }

  /**
   * Add a query to the session history
   * @param {QueryHistoryEntry} entry - The query entry to add
   */
  static addQuery(entry) {
    const context = this.getContext();

    // Ensure entry has required fields + enriched context fields
    const normalizedEntry = {
      query: entry.query || '',
      timestamp: entry.timestamp || Date.now(),
      intent: entry.intent || 'general',
      entities: {
        products: entry.entities?.products || [],
        ingredients: entry.entities?.ingredients || [],
        goals: entry.entities?.goals || [],
      },
      generatedPath: entry.generatedPath || '',
      // Enriched context fields
      recommendedProducts: entry.recommendedProducts || [],
      recommendedRecipes: entry.recommendedRecipes || [],
      blockTypes: entry.blockTypes || [],
      journeyStage: entry.journeyStage || 'exploring',
      confidence: entry.confidence || 0.5,
      nextBestAction: entry.nextBestAction || '',
    };

    context.queries.push(normalizedEntry);

    // Keep only the last MAX_HISTORY queries
    if (context.queries.length > MAX_HISTORY) {
      context.queries = context.queries.slice(-MAX_HISTORY);
    }

    context.lastUpdated = Date.now();
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
  }

  /**
   * Build the context parameter object to pass to the worker
   * @returns {Object} Context param with previousQueries array
   */
  static buildContextParam() {
    const context = this.getContext();
    return {
      previousQueries: context.queries.map((q) => ({
        query: q.query,
        intent: q.intent,
        entities: q.entities,
        // Include enriched context for conversational flow
        recommendedProducts: q.recommendedProducts,
        recommendedRecipes: q.recommendedRecipes,
        blockTypes: q.blockTypes,
        journeyStage: q.journeyStage,
        confidence: q.confidence,
        nextBestAction: q.nextBestAction,
      })),
    };
  }

  /**
   * Build a URL-safe encoded context parameter string
   * @returns {string} URL-encoded JSON string
   */
  static buildEncodedContextParam() {
    const contextParam = this.buildContextParam();
    return encodeURIComponent(JSON.stringify(contextParam));
  }

  /**
   * Check if we have any previous queries in this session
   * @returns {boolean}
   */
  static hasContext() {
    const context = this.getContext();
    return context.queries.length > 0;
  }

  /**
   * Get the session ID for analytics tracking
   * @returns {string}
   */
  static getSessionId() {
    const context = this.getContext();
    return context.sessionId;
  }

  /**
   * Get the consecutive query count for this session
   * @returns {number}
   */
  static getConsecutiveQueryCount() {
    const context = this.getContext();
    return context.queries.length;
  }

  /**
   * Get the most recent query (if any)
   * @returns {QueryHistoryEntry|null}
   */
  static getLastQuery() {
    const context = this.getContext();
    if (context.queries.length === 0) return null;
    return context.queries[context.queries.length - 1];
  }

  /**
   * Get all products mentioned across all queries in this session
   * @returns {string[]}
   */
  static getAllProducts() {
    const context = this.getContext();
    const products = new Set();
    context.queries.forEach((q) => {
      q.entities.products.forEach((p) => products.add(p));
    });
    return [...products];
  }

  /**
   * Get all ingredients mentioned across all queries in this session
   * @returns {string[]}
   */
  static getAllIngredients() {
    const context = this.getContext();
    const ingredients = new Set();
    context.queries.forEach((q) => {
      q.entities.ingredients.forEach((i) => ingredients.add(i));
    });
    return [...ingredients];
  }

  /**
   * Clear the session context (useful for testing)
   */
  static clear() {
    sessionStorage.removeItem(CONTEXT_KEY);
  }

  /**
   * Format context as a human-readable summary (for debugging)
   * @returns {string}
   */
  static formatSummary() {
    const context = this.getContext();
    if (context.queries.length === 0) {
      return 'No previous queries in this session.';
    }
    return context.queries
      .map((q, i) => `${i + 1}. "${q.query}" (${q.intent})`)
      .join('\n');
  }
}

// Export for use in other scripts
export default SessionContextManager;
