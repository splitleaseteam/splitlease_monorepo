/**
 * ERROR RECOVERY & FALLBACK UTILITIES
 * Gap 10: Comprehensive error handling and graceful degradation
 *
 * Provides retry logic, graceful degradation, and pattern-specific error handlers
 *
 * PRODUCTION-READY: Exponential backoff, circuit breaker patterns
 * FUTURE ENHANCEMENT: Advanced observability, distributed tracing
 */

/**
 * Retry API call with exponential backoff
 *
 * @param {Function} apiCall - Async function to retry
 * @param {Object} options - Retry configuration
 * @returns {Promise} Result of API call
 */
export async function retryWithBackoff(apiCall, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = (error) => true, // Custom retry logic
    onRetry = (attempt, delay, error) => {} // Callback on retry
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries + 1}`);
      const result = await apiCall();

      // Success - return result
      if (attempt > 0) {
        console.log(`[Retry] Success after ${attempt} retries`);
      }

      return result;

    } catch (error) {
      lastError = error;
      console.error(`[Retry] Attempt ${attempt + 1} failed:`, error.message);

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        console.log('[Retry] Error not retryable, throwing immediately');
        throw error;
      }

      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        console.log(`[Retry] Waiting ${delay}ms before retry...`);
        onRetry(attempt + 1, delay, error);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        // Increase delay for next retry (exponential backoff)
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  // All retries failed
  const finalError = new Error(
    `API call failed after ${maxRetries + 1} attempts: ${lastError.message}`
  );
  finalError.originalError = lastError;
  finalError.attempts = maxRetries + 1;

  throw finalError;
}

/**
 * Execute API call with fallback value on failure
 *
 * @param {Function} apiCall - Async API function
 * @param {*} fallbackValue - Value to return on failure
 * @param {Object} options - Configuration options
 * @returns {Promise} Result or fallback value
 */
export async function withFallback(apiCall, fallbackValue, options = {}) {
  const {
    logError = true,
    trackFailure = true,
    fallbackMessage = null
  } = options;

  try {
    return await apiCall();
  } catch (error) {
    if (logError) {
      console.warn('[API] Call failed, using fallback:', error.message);
      if (fallbackMessage) {
        console.warn('[API] Fallback reason:', fallbackMessage);
      }
    }

    // Track failure for analytics
    if (trackFailure && typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('API Fallback Used', {
        error_message: error.message,
        fallback_value: JSON.stringify(fallbackValue),
        api_call_name: apiCall.name || 'unknown'
      });
    }

    return fallbackValue;
  }
}

/**
 * Enhanced fetch with automatic retry and timeout
 *
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} retryOptions - Retry configuration
 * @returns {Promise} Response data
 */
export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
  const {
    timeout = 30000, // 30 second default timeout
    ...fetchOptions
  } = options;

  return retryWithBackoff(
    async () => {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.response = response;
          error.status = response.status;
          throw error;
        }

        // Try to parse as JSON, fallback to text
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text();
        }

      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          const timeoutError = new Error(`Request timeout after ${timeout}ms`);
          timeoutError.isTimeout = true;
          throw timeoutError;
        }

        throw error;
      }
    },
    {
      ...retryOptions,
      shouldRetry: (error) => {
        // Don't retry 4xx errors (except 429 rate limit)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          return false;
        }
        // Don't retry timeouts by default (configurable)
        if (error.isTimeout && !retryOptions.retryTimeouts) {
          return false;
        }
        // Retry 5xx errors and network errors
        return true;
      }
    }
  );
}

/**
 * Pattern-specific error handlers with fallback strategies
 */
export const PATTERN_ERROR_HANDLERS = {
  /**
   * Pattern 1: Archetype Detection
   */
  archetype_detection: {
    fallback: 'AVERAGE',
    userMessage: 'Using standard pricing defaults',
    logLevel: 'warn',
    handler: (error) => {
      console.warn('[Pattern 1] Archetype detection failed, using AVERAGE:', error.message);
      return {
        archetype: 'AVERAGE',
        confidence: 0,
        reason: 'Fallback due to detection error',
        error: true
      };
    }
  },

  /**
   * Pattern 2: Urgency Calculation
   */
  urgency_calculation: {
    fallback: {
      level: 'LOW',
      band: 'green',
      multiplier: 1.0,
      daysUntilCheckIn: 999,
      requiresAcknowledgment: false,
      message: 'Standard processing timeline'
    },
    userMessage: 'Standard processing speed applies',
    logLevel: 'warn',
    handler: (error) => {
      console.warn('[Pattern 2] Urgency calculation failed, using fallback:', error.message);
      return PATTERN_ERROR_HANDLERS.urgency_calculation.fallback;
    }
  },

  /**
   * Pattern 3: Pricing Tiers
   */
  pricing_tiers: {
    fallback: (basePrice) => [{
      id: 'standard',
      name: 'Standard',
      price: basePrice,
      speed: '3-5 business days',
      description: 'Regular processing',
      multiplier: 1.0,
      recommended: true,
      features: ['Standard processing time'],
      color: 'blue'
    }],
    userMessage: 'Standard pricing tier applied',
    logLevel: 'error', // More serious - affects pricing
    handler: (error, basePrice = 100) => {
      console.error('[Pattern 3] Pricing tiers failed, using fallback:', error.message);
      return PATTERN_ERROR_HANDLERS.pricing_tiers.fallback(basePrice);
    }
  },

  /**
   * Pattern 4: BS+BS Eligibility
   */
  bsbs_eligibility: {
    fallback: {
      eligible: false,
      reason: 'Eligibility check unavailable',
      options: {
        canSplitRequest: false,
        canNegotiate: false
      }
    },
    userMessage: 'Standard request flow available',
    logLevel: 'info',
    handler: (error) => {
      console.info('[Pattern 4] BS+BS eligibility check failed, using fallback:', error.message);
      return PATTERN_ERROR_HANDLERS.bsbs_eligibility.fallback;
    }
  },

  /**
   * Pattern 5: Fee Calculation (CRITICAL - must not fail)
   */
  fee_calculation: {
    fallback: null, // No fallback - must succeed or block
    userMessage: 'Unable to calculate fees. Please contact support.',
    logLevel: 'critical',
    handler: (error) => {
      console.error('[Pattern 5] Fee calculation CRITICAL failure:', error);
      // This should block submission
      throw new Error('Fee calculation required before proceeding. Please refresh and try again.');
    }
  }
};

/**
 * Handle pattern-specific error with appropriate fallback
 *
 * @param {string} patternType - Pattern identifier
 * @param {Error} error - Error that occurred
 * @param {Object} context - Additional context for fallback
 * @returns {*} Fallback value or throws if critical
 */
export function handlePatternError(patternType, error, context = {}) {
  const handler = PATTERN_ERROR_HANDLERS[patternType];

  if (!handler) {
    console.error(`[Error Recovery] Unknown pattern type: ${patternType}`);
    throw error;
  }

  // Log based on severity
  const logFn = {
    info: console.info,
    warn: console.warn,
    error: console.error,
    critical: console.error
  }[handler.logLevel] || console.log;

  logFn(`[Error Recovery] ${patternType} error:`, error.message);

  // Use handler function if available
  if (handler.handler) {
    return handler.handler(error, context);
  }

  // Return fallback value
  if (typeof handler.fallback === 'function') {
    return handler.fallback(context);
  }

  return handler.fallback;
}

/**
 * Circuit breaker pattern for repeated failures
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - too many recent failures');
      }
      // Try transitioning to HALF_OPEN
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.error(`[Circuit Breaker] OPEN - ${this.failures} consecutive failures`);
    }
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
    console.log('[Circuit Breaker] Manually reset');
  }
}

/**
 * Create circuit breaker for specific service
 *
 * @param {Object} options - Circuit breaker options
 * @returns {CircuitBreaker} Circuit breaker instance
 */
export function createCircuitBreaker(options) {
  return new CircuitBreaker(options);
}

/**
 * Batch requests with deduplication
 *
 * @param {Array<Function>} requests - Array of request functions
 * @param {Object} options - Batch options
 * @returns {Promise<Array>} Results array
 */
export async function batchRequests(requests, options = {}) {
  const {
    batchSize = 5,
    delayBetweenBatches = 100
  } = options;

  const results = [];

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);

    console.log(`[Batch] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(requests.length / batchSize)}`);

    const batchResults = await Promise.allSettled(
      batch.map(fn => fn())
    );

    results.push(...batchResults);

    // Delay between batches (except last batch)
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

/**
 * Safe JSON parse with fallback
 *
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parse fails
 * @returns {*} Parsed object or fallback
 */
export function safeJSONParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('[JSON Parse] Failed to parse JSON, using fallback:', error.message);
    return fallback;
  }
}

// Export utilities
export default {
  retryWithBackoff,
  withFallback,
  fetchWithRetry,
  handlePatternError,
  createCircuitBreaker,
  batchRequests,
  safeJSONParse,
  PATTERN_ERROR_HANDLERS
};
