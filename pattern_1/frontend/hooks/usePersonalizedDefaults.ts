/**
 * usePersonalizedDefaults Hook - Pattern 1: Personalized Defaults
 *
 * React hook for fetching and managing personalized transaction recommendations.
 * Integrates with Supabase Edge Functions for archetype detection and recommendation engine.
 *
 * @module hooks/usePersonalizedDefaults
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  TransactionType,
  TransactionOption,
  TransactionRecommendationsResponse,
} from '../types';

/**
 * Hook parameters
 */
export interface UsePersonalizedDefaultsParams {
  /** Current user ID */
  userId: string;
  /** Target date for transaction */
  targetDate: Date;
  /** Roommate ID */
  roommateId: string;
  /** Whether to fetch immediately on mount */
  immediate?: boolean;
}

/**
 * Hook return value
 */
export interface UsePersonalizedDefaultsReturn {
  /** Primary recommended option */
  primaryOption: TransactionType | null;
  /** All transaction options sorted by priority */
  sortedOptions: TransactionOption[] | null;
  /** Reasoning for recommendation */
  reasoning: string[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refetch recommendations */
  refetch: () => Promise<void>;
  /** User archetype type */
  archetypeType: string | null;
  /** Archetype confidence (0-1) */
  archetypeConfidence: number | null;
}

/**
 * Custom hook for personalized transaction defaults
 *
 * Fetches user archetype and transaction recommendations from backend.
 * Automatically refetches when parameters change.
 *
 * @param params - Hook parameters
 * @returns Hook state and methods
 *
 * @example
 * ```tsx
 * const {
 *   primaryOption,
 *   sortedOptions,
 *   reasoning,
 *   loading,
 *   error,
 *   refetch
 * } = usePersonalizedDefaults({
 *   userId: 'user_123',
 *   targetDate: new Date('2026-02-01'),
 *   roommateId: 'user_456'
 * });
 * ```
 */
export function usePersonalizedDefaults({
  userId,
  targetDate,
  roommateId,
  immediate = true,
}: UsePersonalizedDefaultsParams): UsePersonalizedDefaultsReturn {
  const [state, setState] = useState<{
    primaryOption: TransactionType | null;
    sortedOptions: TransactionOption[] | null;
    reasoning: string[];
    loading: boolean;
    error: Error | null;
    archetypeType: string | null;
    archetypeConfidence: number | null;
  }>({
    primaryOption: null,
    sortedOptions: null,
    reasoning: [],
    loading: false,
    error: null,
    archetypeType: null,
    archetypeConfidence: null,
  });

  /**
   * Fetch transaction recommendations from API
   */
  const fetchRecommendations = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // STEP 1: Fetch user archetype
      const archetypeResponse = await fetch(
        `/api/users/${userId}/archetype`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!archetypeResponse.ok) {
        throw new Error(
          `Failed to fetch archetype: ${archetypeResponse.statusText}`
        );
      }

      const archetypeData = await archetypeResponse.json();

      // STEP 2: Fetch transaction recommendations
      const params = new URLSearchParams({
        userId,
        targetDate: targetDate.toISOString(),
        roommateId,
      });

      const recsResponse = await fetch(
        `/api/transaction-recommendations?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!recsResponse.ok) {
        throw new Error(
          `Failed to fetch recommendations: ${recsResponse.statusText}`
        );
      }

      const recommendations: TransactionRecommendationsResponse =
        await recsResponse.json();

      // Find recommended option
      const recommendedOption = recommendations.options.find(
        (opt) => opt.recommended
      );

      setState({
        primaryOption: recommendations.primaryRecommendation,
        sortedOptions: recommendations.options,
        reasoning: recommendedOption?.reasoning || [],
        loading: false,
        error: null,
        archetypeType: recommendations.userArchetype.type,
        archetypeConfidence: recommendations.userArchetype.confidence,
      });

      // Log analytics event
      logAnalyticsEvent('Transaction Options Viewed', {
        userId,
        primaryRecommendation: recommendations.primaryRecommendation,
        archetypeType: recommendations.userArchetype.type,
        archetypeConfidence: recommendations.userArchetype.confidence,
        daysUntilCheckIn: recommendations.contextFactors.daysUntilCheckIn,
        pricing: {
          buyout: recommendations.options.find((o) => o.type === 'buyout')
            ?.totalCost || 0,
          crash: recommendations.options.find((o) => o.type === 'crash')
            ?.totalCost || 0,
          swap: recommendations.options.find((o) => o.type === 'swap')
            ?.totalCost || 0,
        },
      });
    } catch (err) {
      const error = err as Error;
      console.error('[usePersonalizedDefaults] Fetch failed:', error);

      setState((prev) => ({
        ...prev,
        loading: false,
        error,
      }));

      // Log error
      logAnalyticsEvent('Transaction Recommendations Error', {
        userId,
        error: error.message,
      });
    }
  }, [userId, targetDate, roommateId]);

  /**
   * Auto-fetch on mount and when params change
   */
  useEffect(() => {
    if (immediate && userId && roommateId && targetDate) {
      fetchRecommendations();
    }
  }, [immediate, userId, roommateId, targetDate, fetchRecommendations]);

  return {
    ...state,
    refetch: fetchRecommendations,
  };
}

/**
 * Log analytics event
 *
 * SCAFFOLDING: Replace with actual analytics service (Segment, Mixpanel, etc.)
 *
 * @param eventName - Event name
 * @param properties - Event properties
 */
function logAnalyticsEvent(eventName: string, properties: unknown): void {
  // SCAFFOLDING: Implement actual analytics tracking
  console.log('[Analytics]', eventName, properties);

  // Example integration:
  // if (window.analytics) {
  //   window.analytics.track(eventName, properties);
  // }
}

/**
 * Hook variant with mock data for testing/Storybook
 */
export function usePersonalizedDefaultsMock(
  params: UsePersonalizedDefaultsParams
): UsePersonalizedDefaultsReturn {
  const mockOptions: TransactionOption[] = [
    {
      type: 'buyout',
      price: 283500,
      platformFee: 4300,
      totalCost: 287800,
      targetDate: params.targetDate,
      roommate: {
        id: params.roommateId,
        name: 'Alex',
        acceptanceRate: 0.72,
        avgResponseTimeHours: 4.2,
        isOnline: true,
      },
      confidence: 0.85,
      estimatedAcceptanceProbability: 0.87,
      urgencyMultiplier: 1.5,
      recommended: true,
      priority: 1,
      roommateReceives: 279200,
      reasoning: [
        'High urgency booking',
        'Your typical preference for guaranteed access',
        'Similar users choose buyout 70% of the time',
      ],
    },
    {
      type: 'crash',
      price: 32400,
      platformFee: 500,
      totalCost: 32900,
      targetDate: params.targetDate,
      roommate: {
        id: params.roommateId,
        name: 'Alex',
        acceptanceRate: 0.72,
        avgResponseTimeHours: 4.2,
        isOnline: true,
      },
      confidence: 0.65,
      estimatedAcceptanceProbability: 0.68,
      urgencyMultiplier: 1.5,
      recommended: false,
      priority: 2,
      roommateReceives: 31900,
      savingsVsBuyout: 254900,
    },
    {
      type: 'swap',
      price: 0,
      platformFee: 500,
      totalCost: 500,
      targetDate: params.targetDate,
      roommate: {
        id: params.roommateId,
        name: 'Alex',
        acceptanceRate: 0.72,
        avgResponseTimeHours: 4.2,
        isOnline: true,
      },
      confidence: 0.45,
      estimatedAcceptanceProbability: 0.55,
      urgencyMultiplier: 1.0,
      recommended: false,
      priority: 3,
      requiresUserNight: true,
      potentialMatches: 2,
      savingsVsBuyout: 287300,
    },
  ];

  return {
    primaryOption: 'buyout',
    sortedOptions: mockOptions,
    reasoning: mockOptions[0].reasoning || [],
    loading: false,
    error: null,
    refetch: async () => {
      console.log('[Mock] Refetch called');
    },
    archetypeType: 'big_spender',
    archetypeConfidence: 0.87,
  };
}
