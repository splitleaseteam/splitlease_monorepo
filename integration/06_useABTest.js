/**
 * A/B TESTING INFRASTRUCTURE
 * Gap 7: Framework to test archetype defaults, urgency thresholds, tier pricing
 *
 * Simple localStorage-based A/B testing with deterministic variant assignment
 *
 * PRODUCTION-READY: Client-side variant assignment with consistent bucketing
 * FUTURE ENHANCEMENT: Integrate with LaunchDarkly, Optimizely, or custom service
 */

import { useState, useEffect } from 'react';

/**
 * A/B test configurations
 * Each test defines variants with different parameter values
 */
const AB_TESTS = {
  /**
   * Test: Big Spender archetype default percentage
   * Control: 120% (original)
   * Variant A: 110% (less aggressive)
   * Variant B: 130% (more aggressive)
   */
  archetype_default_big_spender: {
    name: 'Big Spender Default Percentage',
    description: 'Test optimal default price for big spender archetype',
    variants: [
      { id: 'control', value: 120, weight: 34 },
      { id: 'variant_a', value: 110, weight: 33 },
      { id: 'variant_b', value: 130, weight: 33 }
    ]
  },

  /**
   * Test: Critical urgency threshold (days)
   * Control: 7 days
   * Variant A: 5 days (more urgent sooner)
   * Variant B: 3 days (very aggressive)
   */
  urgency_threshold_critical: {
    name: 'Critical Urgency Threshold',
    description: 'Test when to apply critical urgency pricing',
    variants: [
      { id: 'control', value: 7, weight: 34 },
      { id: 'variant_a', value: 5, weight: 33 },
      { id: 'variant_b', value: 3, weight: 33 }
    ]
  },

  /**
   * Test: Price tier multipliers
   * Control: [0.90, 1.00, 1.15]
   * Variant A: [0.85, 1.00, 1.20] (wider spread)
   * Variant B: [0.90, 1.00, 1.25] (higher premium)
   */
  price_tier_multipliers: {
    name: 'Price Tier Multipliers',
    description: 'Test optimal tier pricing spread',
    variants: [
      { id: 'control', value: [0.90, 1.00, 1.15], weight: 34 },
      { id: 'variant_a', value: [0.85, 1.00, 1.20], weight: 33 },
      { id: 'variant_b', value: [0.90, 1.00, 1.25], weight: 33 }
    ]
  },

  /**
   * Test: Urgency multiplier values
   * Control: { critical: 1.5, high: 1.25, medium: 1.1, low: 1.0 }
   * Variant A: { critical: 1.6, high: 1.3, medium: 1.15, low: 1.0 } (higher)
   * Variant B: { critical: 1.4, high: 1.2, medium: 1.05, low: 1.0 } (lower)
   */
  urgency_multipliers: {
    name: 'Urgency Price Multipliers',
    description: 'Test optimal urgency-based price adjustments',
    variants: [
      {
        id: 'control',
        value: { critical: 1.5, high: 1.25, medium: 1.1, low: 1.0 },
        weight: 34
      },
      {
        id: 'variant_a',
        value: { critical: 1.6, high: 1.3, medium: 1.15, low: 1.0 },
        weight: 33
      },
      {
        id: 'variant_b',
        value: { critical: 1.4, high: 1.2, medium: 1.05, low: 1.0 },
        weight: 33
      }
    ]
  }
};

/**
 * Get A/B test variant for a user
 * Uses deterministic hashing for consistent assignment
 *
 * @param {string} testName - Name of A/B test
 * @param {string} userId - User ID for consistent bucketing
 * @returns {Object|null} Assigned variant or null if test not found
 */
export function useABTest(testName, userId) {
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testName || !userId) {
      setLoading(false);
      return;
    }

    const test = AB_TESTS[testName];

    if (!test) {
      console.warn(`[A/B Test] Unknown test: ${testName}`);
      setLoading(false);
      return;
    }

    // Check localStorage for existing assignment
    const storageKey = `ab_test_${testName}_${userId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const storedData = JSON.parse(stored);
        const storedVariant = test.variants.find(v => v.id === storedData.variantId);

        if (storedVariant) {
          setVariant({
            ...storedVariant,
            testName,
            assignedAt: storedData.assignedAt
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn('[A/B Test] Invalid stored variant, reassigning:', error);
      }
    }

    // Assign new variant using deterministic hashing
    const hash = hashUserId(userId + testName);
    const assignedVariant = assignVariantByWeight(test.variants, hash);

    // Store assignment
    const assignmentData = {
      variantId: assignedVariant.id,
      assignedAt: new Date().toISOString(),
      testName,
      userId
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(assignmentData));
    } catch (error) {
      console.error('[A/B Test] Failed to store assignment:', error);
    }

    // Track assignment in analytics
    trackABTestExposure(testName, assignedVariant.id, userId);

    setVariant({
      ...assignedVariant,
      testName,
      assignedAt: assignmentData.assignedAt
    });
    setLoading(false);

    console.log(
      `[A/B Test] ${testName} → ${assignedVariant.id}`,
      assignedVariant.value
    );
  }, [testName, userId]);

  return { variant, loading };
}

/**
 * Simple hash function for consistent variant assignment
 * Uses string hash modulo to bucket users
 *
 * @param {string} str - String to hash (userId + testName)
 * @returns {number} Hash value
 */
function hashUserId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Assign variant based on weighted distribution
 *
 * @param {Array} variants - Variants with weights
 * @param {number} hash - Hash value for bucketing
 * @returns {Object} Selected variant
 */
function assignVariantByWeight(variants, hash) {
  // Calculate total weight
  const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);

  // Normalize hash to 0-100 range
  const bucket = (hash % 100);

  // Find variant based on weighted ranges
  let cumulativeWeight = 0;
  for (const variant of variants) {
    const weight = variant.weight || 1;
    const percentage = (weight / totalWeight) * 100;
    cumulativeWeight += percentage;

    if (bucket < cumulativeWeight) {
      return variant;
    }
  }

  // Fallback to first variant (shouldn't reach here)
  return variants[0];
}

/**
 * Track A/B test exposure event
 *
 * @param {string} testName - Test name
 * @param {string} variantId - Variant ID
 * @param {string} userId - User ID
 */
export function trackABTestExposure(testName, variantId, userId) {
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track('AB Test Exposed', {
      test_name: testName,
      variant_id: variantId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get all active A/B tests
 *
 * @returns {Object} All test configurations
 */
export function getAllABTests() {
  return AB_TESTS;
}

/**
 * Get A/B test configuration
 *
 * @param {string} testName - Test name
 * @returns {Object|null} Test configuration or null
 */
export function getABTestConfig(testName) {
  return AB_TESTS[testName] || null;
}

/**
 * Reset user's A/B test assignments (for debugging)
 *
 * @param {string} userId - User ID
 */
export function resetABTestAssignments(userId) {
  if (typeof localStorage === 'undefined') return;

  const testNames = Object.keys(AB_TESTS);

  testNames.forEach(testName => {
    const storageKey = `ab_test_${testName}_${userId}`;
    localStorage.removeItem(storageKey);
  });

  console.log(`[A/B Test] Reset ${testNames.length} assignments for user ${userId}`);
}

/**
 * Get user's current A/B test assignments
 *
 * @param {string} userId - User ID
 * @returns {Object} Map of test name to variant ID
 */
export function getUserABTestAssignments(userId) {
  if (typeof localStorage === 'undefined') return {};

  const assignments = {};
  const testNames = Object.keys(AB_TESTS);

  testNames.forEach(testName => {
    const storageKey = `ab_test_${testName}_${userId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const data = JSON.parse(stored);
        assignments[testName] = data.variantId;
      } catch (error) {
        console.warn(`[A/B Test] Invalid assignment for ${testName}:`, error);
      }
    }
  });

  return assignments;
}

/**
 * Force user into specific variant (for testing/debugging)
 *
 * @param {string} testName - Test name
 * @param {string} variantId - Variant ID to force
 * @param {string} userId - User ID
 */
export function forceVariant(testName, variantId, userId) {
  if (typeof localStorage === 'undefined') return;

  const test = AB_TESTS[testName];
  if (!test) {
    console.error(`[A/B Test] Unknown test: ${testName}`);
    return;
  }

  const variant = test.variants.find(v => v.id === variantId);
  if (!variant) {
    console.error(`[A/B Test] Unknown variant ${variantId} for test ${testName}`);
    return;
  }

  const storageKey = `ab_test_${testName}_${userId}`;
  const assignmentData = {
    variantId,
    assignedAt: new Date().toISOString(),
    testName,
    userId,
    forced: true
  };

  localStorage.setItem(storageKey, JSON.stringify(assignmentData));
  console.log(`[A/B Test] Forced ${testName} → ${variantId} for user ${userId}`);
}

// Export hook as default
export default useABTest;

// Export utilities
export {
  AB_TESTS,
  hashUserId,
  assignVariantByWeight,
  getAllABTests,
  getABTestConfig,
  resetABTestAssignments,
  getUserABTestAssignments,
  forceVariant
};
