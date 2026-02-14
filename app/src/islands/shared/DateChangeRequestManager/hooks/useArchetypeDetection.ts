/**
 * useArchetypeDetection Hook - Pattern 1: Personalized Defaults
 *
 * React hook for detecting and managing user archetype classification.
 *
 * @module hooks/useArchetypeDetection
 */

import { useState, useEffect, useCallback } from 'react';
import { detectUserArchetype, getArchetypeLabel } from '../utils/archetypeLogic';
import type {
  ArchetypeType,
  ArchetypeDetectionResult,
  BookingHistory,
  DateChangeHistory,
} from '../types';

/**
 * Hook parameters
 */
export interface UseArchetypeDetectionParams {
  /** User ID to analyze */
  userId: string;
  /** Whether to fetch immediately on mount */
  immediate?: boolean;
}

/**
 * Hook return value
 */
export interface UseArchetypeDetectionReturn {
  /** Detected archetype */
  archetype: ArchetypeType | null;
  /** Confidence in detection (0-1) */
  confidence: number | null;
  /** Reason for classification */
  reason: string | null;
  /** Human-readable label */
  label: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refetch archetype */
  refetch: () => Promise<void>;
  /** Full detection result */
  detectionResult: ArchetypeDetectionResult | null;
}

/**
 * Custom hook for archetype detection
 *
 * Fetches user booking and date change history, then classifies archetype.
 *
 * @param params - Hook parameters
 * @returns Hook state and methods
 *
 * @example
 * ```tsx
 * const {
 *   archetype,
 *   confidence,
 *   reason,
 *   label,
 *   loading,
 *   error
 * } = useArchetypeDetection({
 *   userId: 'user_123'
 * });
 * ```
 */
export function useArchetypeDetection({
  userId,
  immediate = true,
}: UseArchetypeDetectionParams): UseArchetypeDetectionReturn {
  const [state, setState] = useState<{
    archetype: ArchetypeType | null;
    confidence: number | null;
    reason: string | null;
    label: string | null;
    isLoading: boolean;
    error: Error | null;
    detectionResult: ArchetypeDetectionResult | null;
  }>({
    archetype: null,
    confidence: null,
    reason: null,
    label: null,
    isLoading: false,
    error: null,
    detectionResult: null,
  });

  /**
   * Fetch user history and detect archetype
   */
  const detectArchetype = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // STEP 1: Fetch booking history
      const bookingResponse = await fetch(
        `/api/users/${userId}/booking-history`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!bookingResponse.ok) {
        throw new Error(
          `Failed to fetch booking history: ${bookingResponse.statusText}`
        );
      }

      const bookingHistory: BookingHistory[] = await bookingResponse.json();

      // STEP 2: Fetch date change history
      const dateChangeResponse = await fetch(
        `/api/users/${userId}/date-change-history`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!dateChangeResponse.ok) {
        throw new Error(
          `Failed to fetch date change history: ${dateChangeResponse.statusText}`
        );
      }

      const dateChangeHistory: DateChangeHistory[] =
        await dateChangeResponse.json();

      // STEP 3: Detect archetype using local logic
      const result = detectUserArchetype({
        userId,
        bookingHistory,
        dateChangeHistory,
      });

      const label = getArchetypeLabel(result.archetype);

      setState({
        archetype: result.archetype,
        confidence: result.confidence,
        reason: result.reason,
        label,
        isLoading: false,
        error: null,
        detectionResult: result,
      });

      // Log analytics event
      logAnalyticsEvent('Archetype Detected', {
        userId,
        archetype: result.archetype,
        confidence: result.confidence,
        bookingCount: bookingHistory.length,
        dateChangeCount: dateChangeHistory.length,
      });
    } catch (err) {
      const error = err as Error;
      console.error('[useArchetypeDetection] Detection failed:', error);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error,
      }));

      // Log error
      logAnalyticsEvent('Archetype Detection Error', {
        userId,
        error: error.message,
      });
    }
  }, [userId]);

  /**
   * Auto-detect on mount and when userId changes
   */
  useEffect(() => {
    if (immediate && userId) {
      detectArchetype();
    }
  }, [immediate, userId, detectArchetype]);

  return {
    ...state,
    refetch: detectArchetype,
  };
}

/**
 * Log analytics event
 *
 * SCAFFOLDING: Replace with actual analytics service
 *
 * @param eventName - Event name
 * @param properties - Event properties
 */
function logAnalyticsEvent(eventName: string, properties: unknown): void {
  console.log('[Analytics]', eventName, properties);
}

/**
 * Hook variant with mock data for testing/Storybook
 */
export function useArchetypeDetectionMock(
  params: UseArchetypeDetectionParams
): UseArchetypeDetectionReturn {
  return {
    archetype: 'big_spender',
    confidence: 0.87,
    reason: 'Average transaction value of $1850, High willingness to pay for convenience, Prefer buyouts (70% of time)',
    label: 'Premium Booker',
    isLoading: false,
    error: null,
    refetch: async () => {
      console.log('[Mock] Refetch called');
    },
    detectionResult: {
      archetype: 'big_spender',
      confidence: 0.87,
      reason: 'Average transaction value of $1850, High willingness to pay for convenience',
    },
  };
}
