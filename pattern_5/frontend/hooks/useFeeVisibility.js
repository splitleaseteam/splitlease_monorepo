/**
 * useFeeVisibility Hook
 * Manages progressive disclosure of fee information based on user behavior
 *
 * @hook useFeeVisibility
 * @version 1.0.0
 * @production
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * User interaction tracking
 */
const trackInteraction = (eventName, data = {}) => {
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track(eventName, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user transaction count from localStorage or API
 */
const getUserTransactionCount = () => {
  if (typeof window === 'undefined') return 0;

  const stored = localStorage.getItem('userTransactionCount');
  return stored ? parseInt(stored, 10) : 0;
};

/**
 * Update user transaction count
 */
const updateUserTransactionCount = (count) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userTransactionCount', count.toString());
};

/**
 * Hook for managing fee visibility and progressive disclosure
 *
 * @param {Object} options - Configuration options
 * @returns {Object} Visibility state and methods
 */
export const useFeeVisibility = (options = {}) => {
  const {
    feeAmount = 0,
    transactionType = 'date_change',
    userId = null,
    autoExpand = null, // null = auto-determine, true = always expanded, false = always collapsed
    trackAnalytics = true
  } = options;

  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [viewDuration, setViewDuration] = useState(0);
  const [userTransactionCount, setUserTransactionCount] = useState(0);
  const [explainerOpened, setExplainerOpened] = useState(false);

  // Load user transaction count
  useEffect(() => {
    const count = getUserTransactionCount();
    setUserTransactionCount(count);
  }, []);

  // Determine initial expansion state
  const shouldAutoExpand = useMemo(() => {
    if (autoExpand !== null) return autoExpand;

    // Auto-expand rules:
    // 1. First-time users (no transaction history)
    if (userTransactionCount === 0) return true;

    // 2. Large fee amounts (> $50)
    if (feeAmount > 50) return true;

    // 3. Returning users with few transactions (<5)
    if (userTransactionCount < 5) return false;

    // 4. Experienced users (5+ transactions) - collapsed
    return false;
  }, [autoExpand, userTransactionCount, feeAmount]);

  // Set initial expansion
  useEffect(() => {
    setIsExpanded(shouldAutoExpand);
  }, [shouldAutoExpand]);

  // Track view duration
  useEffect(() => {
    if (!hasViewed) return;

    const startTime = Date.now();

    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      setViewDuration(duration);

      if (trackAnalytics && duration > 0) {
        trackInteraction('Fee Breakdown Viewed', {
          transactionType,
          feeAmount,
          viewDuration: duration,
          userTransactionCount,
          autoExpanded: shouldAutoExpand
        });
      }
    };
  }, [hasViewed, trackAnalytics, transactionType, feeAmount, userTransactionCount, shouldAutoExpand]);

  // Handlers
  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    setHasViewed(true);

    if (trackAnalytics) {
      trackInteraction('Fee Breakdown Expanded', {
        transactionType,
        feeAmount,
        userTransactionCount,
        trigger: 'user_click'
      });
    }
  }, [trackAnalytics, transactionType, feeAmount, userTransactionCount]);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);

    if (trackAnalytics) {
      trackInteraction('Fee Breakdown Collapsed', {
        transactionType,
        feeAmount,
        viewDuration,
        userTransactionCount
      });
    }
  }, [trackAnalytics, transactionType, feeAmount, viewDuration, userTransactionCount]);

  const handleToggle = useCallback(() => {
    if (isExpanded) {
      handleCollapse();
    } else {
      handleExpand();
    }
  }, [isExpanded, handleExpand, handleCollapse]);

  const handleExplainerOpen = useCallback(() => {
    setExplainerOpened(true);

    if (trackAnalytics) {
      trackInteraction('Fee Explainer Opened', {
        transactionType,
        feeAmount,
        userTransactionCount,
        trigger: 'info_icon_click'
      });
    }
  }, [trackAnalytics, transactionType, feeAmount, userTransactionCount]);

  const handleFeeAccepted = useCallback(() => {
    if (trackAnalytics) {
      trackInteraction('Fee Accepted', {
        transactionType,
        feeAmount,
        viewDuration,
        userTransactionCount,
        explainerViewed: explainerOpened
      });
    }

    // Increment transaction count
    const newCount = userTransactionCount + 1;
    setUserTransactionCount(newCount);
    updateUserTransactionCount(newCount);
  }, [trackAnalytics, transactionType, feeAmount, viewDuration, userTransactionCount, explainerOpened]);

  const handleFeeRejected = useCallback(() => {
    if (trackAnalytics) {
      trackInteraction('Fee Rejected', {
        transactionType,
        feeAmount,
        viewDuration,
        userTransactionCount,
        explainerViewed: explainerOpened
      });
    }
  }, [trackAnalytics, transactionType, feeAmount, viewDuration, userTransactionCount, explainerOpened]);

  // User experience level
  const userExperienceLevel = useMemo(() => {
    if (userTransactionCount === 0) return 'new';
    if (userTransactionCount < 5) return 'beginner';
    if (userTransactionCount < 20) return 'intermediate';
    return 'expert';
  }, [userTransactionCount]);

  // Recommended variant based on experience
  const recommendedVariant = useMemo(() => {
    switch (userExperienceLevel) {
      case 'new':
        return 'detailed'; // Full explanation for new users
      case 'beginner':
        return 'default'; // Standard breakdown
      case 'intermediate':
      case 'expert':
        return 'minimal'; // Compact display for experienced users
      default:
        return 'default';
    }
  }, [userExperienceLevel]);

  return {
    // State
    isExpanded,
    hasViewed,
    viewDuration,
    userTransactionCount,
    explainerOpened,
    shouldAutoExpand,
    userExperienceLevel,
    recommendedVariant,

    // Handlers
    handleExpand,
    handleCollapse,
    handleToggle,
    handleExplainerOpen,
    handleFeeAccepted,
    handleFeeRejected,

    // Utilities
    setIsExpanded,
    setHasViewed
  };
};

/**
 * Hook for tracking fee comparison views
 *
 * @param {Object} options - Configuration options
 * @returns {Object} Comparison tracking state
 */
export const useFeeComparisonTracking = (options = {}) => {
  const { trackAnalytics = true } = options;

  const [comparisonViewed, setComparisonViewed] = useState(false);
  const [viewStartTime, setViewStartTime] = useState(null);

  const handleComparisonView = useCallback(() => {
    setComparisonViewed(true);
    setViewStartTime(Date.now());

    if (trackAnalytics) {
      trackInteraction('Fee Comparison Viewed', {
        timestamp: new Date().toISOString()
      });
    }
  }, [trackAnalytics]);

  const handleComparisonClose = useCallback(() => {
    if (viewStartTime && trackAnalytics) {
      const duration = Math.floor((Date.now() - viewStartTime) / 1000);
      trackInteraction('Fee Comparison Closed', {
        viewDuration: duration
      });
    }

    setViewStartTime(null);
  }, [viewStartTime, trackAnalytics]);

  return {
    comparisonViewed,
    handleComparisonView,
    handleComparisonClose
  };
};

/**
 * Hook for managing fee transparency messaging A/B tests
 *
 * @param {string} testName - Name of the A/B test
 * @returns {Object} A/B test state
 */
export const useFeeMessagingTest = (testName = 'fee_display_test') => {
  const [variant, setVariant] = useState('control');
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for existing variant assignment
    const storedVariant = localStorage.getItem(`ab_test_${testName}`);

    if (storedVariant) {
      setVariant(storedVariant);
      setHasLoaded(true);
      return;
    }

    // Assign new variant (50/50 split for now)
    const variants = ['control', 'variant_a', 'variant_b'];
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];

    localStorage.setItem(`ab_test_${testName}`, randomVariant);
    setVariant(randomVariant);
    setHasLoaded(true);

    // Track assignment
    if (window.analytics) {
      window.analytics.track('A/B Test Assigned', {
        testName,
        variant: randomVariant
      });
    }
  }, [testName]);

  const trackConversion = useCallback((eventName, data = {}) => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track(eventName, {
        ...data,
        testName,
        variant
      });
    }
  }, [testName, variant]);

  return {
    variant,
    hasLoaded,
    trackConversion,
    isControl: variant === 'control',
    isVariantA: variant === 'variant_a',
    isVariantB: variant === 'variant_b'
  };
};

/**
 * Hook for managing fee acceptance flow
 *
 * @returns {Object} Acceptance flow state
 */
export const useFeeAcceptanceFlow = () => {
  const [step, setStep] = useState('review'); // review | acknowledge | accepted
  const [acknowledged, setAcknowledged] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [startTime] = useState(Date.now());

  const handleAcknowledge = useCallback(() => {
    setAcknowledged(true);
    setStep('acknowledge');

    trackInteraction('Fee Acknowledged', {
      timeToAcknowledge: Math.floor((Date.now() - startTime) / 1000)
    });
  }, [startTime]);

  const handleAccept = useCallback(() => {
    setAccepted(true);
    setStep('accepted');

    trackInteraction('Fee Accepted', {
      timeToAccept: Math.floor((Date.now() - startTime) / 1000),
      acknowledged
    });
  }, [startTime, acknowledged]);

  const reset = useCallback(() => {
    setStep('review');
    setAcknowledged(false);
    setAccepted(false);
  }, []);

  return {
    step,
    acknowledged,
    accepted,
    handleAcknowledge,
    handleAccept,
    reset,
    canProceed: acknowledged,
    isComplete: accepted
  };
};

export default useFeeVisibility;
