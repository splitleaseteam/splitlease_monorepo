/**
 * Pattern 2: Urgency Countdown - useCountdown Hook
 *
 * Production-ready countdown hook with auto-updating timer
 * Optimized for performance with adaptive update intervals
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TimeRemaining,
  UrgencyLevel,
} from '../types';
import {
  calculateTimeRemaining,
  differenceInHours,
} from '../utils/dateFormatting';
import { getUrgencyLevel, getUpdateInterval } from '../utils/urgencyCalculations';

/**
 * Countdown hook configuration
 */
export interface UseCountdownConfig {
  onTick?: (remaining: TimeRemaining) => void;
  onUrgencyChange?: (level: UrgencyLevel) => void;
  onComplete?: () => void;
  enabled?: boolean;
}

/**
 * Countdown hook return value
 */
export interface UseCountdownReturn {
  timeRemaining: TimeRemaining;
  urgencyLevel: UrgencyLevel;
  isComplete: boolean;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

/**
 * useCountdown - Auto-updating countdown timer with urgency levels
 *
 * Features:
 * - Adaptive update intervals based on urgency
 * - Automatic urgency level detection
 * - Performance optimized with cleanup
 * - Pause/resume functionality
 *
 * @param targetDate - Target date to count down to
 * @param config - Configuration options
 * @returns Countdown state and controls
 */
export function useCountdown(
  targetDate: Date,
  config: UseCountdownConfig = {}
): UseCountdownReturn {
  const {
    onTick,
    onUrgencyChange,
    onComplete,
    enabled = true,
  } = config;

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetDate)
  );
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>(() =>
    getUrgencyLevel(timeRemaining.days)
  );
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(!enabled);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousUrgencyRef = useRef<UrgencyLevel>(urgencyLevel);

  /**
   * Update countdown state
   */
  const updateCountdown = useCallback(() => {
    const remaining = calculateTimeRemaining(targetDate);
    setTimeRemaining(remaining);

    // Check if countdown is complete
    if (remaining.totalSeconds <= 0) {
      setIsComplete(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      onComplete?.();
      return;
    }

    // Update urgency level
    const newUrgencyLevel = getUrgencyLevel(remaining.days);
    if (newUrgencyLevel !== previousUrgencyRef.current) {
      setUrgencyLevel(newUrgencyLevel);
      onUrgencyChange?.(newUrgencyLevel);
      previousUrgencyRef.current = newUrgencyLevel;
    }

    // Call tick callback
    onTick?.(remaining);
  }, [targetDate, onTick, onUrgencyChange, onComplete]);

  /**
   * Calculate appropriate update interval based on time remaining
   */
  const getAdaptiveInterval = useCallback((): number => {
    const hoursUntil = differenceInHours(targetDate);
    return getUpdateInterval(hoursUntil);
  }, [targetDate]);

  /**
   * Start countdown interval
   */
  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const intervalMs = getAdaptiveInterval();

    intervalRef.current = setInterval(() => {
      updateCountdown();

      // Recalculate interval in case urgency changed
      const newIntervalMs = getAdaptiveInterval();
      if (newIntervalMs !== intervalMs && intervalRef.current) {
        clearInterval(intervalRef.current);
        startInterval();
      }
    }, intervalMs);
  }, [updateCountdown, getAdaptiveInterval]);

  /**
   * Pause countdown
   */
  const pause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Resume countdown
   */
  const resume = useCallback(() => {
    setIsPaused(false);
    updateCountdown();
    startInterval();
  }, [updateCountdown, startInterval]);

  /**
   * Reset countdown to target date
   */
  const reset = useCallback(() => {
    setIsComplete(false);
    updateCountdown();
    if (!isPaused) {
      startInterval();
    }
  }, [isPaused, updateCountdown, startInterval]);

  /**
   * Initialize countdown on mount
   */
  useEffect(() => {
    if (!enabled || isPaused) {
      return;
    }

    // Initial update
    updateCountdown();

    // Start interval
    startInterval();

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isPaused, updateCountdown, startInterval]);

  /**
   * Update immediately when target date changes
   */
  useEffect(() => {
    updateCountdown();
  }, [targetDate, updateCountdown]);

  return {
    timeRemaining,
    urgencyLevel,
    isComplete,
    isPaused,
    pause,
    resume,
    reset,
  };
}

/**
 * useCountdownWithVisibility - Countdown that pauses when page is hidden
 *
 * Optimizes battery usage by pausing countdown when tab is not visible
 *
 * @param targetDate - Target date to count down to
 * @param config - Configuration options
 * @returns Countdown state and controls
 */
export function useCountdownWithVisibility(
  targetDate: Date,
  config: UseCountdownConfig = {}
): UseCountdownReturn {
  const [isVisible, setIsVisible] = useState(true);

  const countdown = useCountdown(targetDate, {
    ...config,
    enabled: config.enabled !== false && isVisible,
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return countdown;
}
