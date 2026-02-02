/**
 * PATTERN 3: PRICE ANCHORING - useSavingsCalculations Hook
 * Hook for savings calculations and anchor context
 */

import { useCallback, useMemo } from 'react';
import type {
  SavingsInfo,
  AnchorContextInfo,
  UseSavingsCalculationsReturn,
} from '../types';
import {
  calculateSavings,
  getAnchorContext,
  getSavingsTier,
  formatSavingsText,
} from '../utils';

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook for savings calculations and formatting
 *
 * @example
 * ```tsx
 * const { calculateSavings, getAnchorContext, formatSavings } = useSavingsCalculations();
 *
 * const savings = calculateSavings(324, 2835);
 * // { amount: 2511, percentage: 88.6, ... }
 * ```
 */
export function useSavingsCalculations(): UseSavingsCalculationsReturn {
  // ========================================================================
  // CALLBACKS
  // ========================================================================

  /**
   * Calculate savings information
   */
  const calculateSavingsCallback = useCallback(
    (offerPrice: number, originalPrice: number): SavingsInfo => {
      return calculateSavings(offerPrice, originalPrice);
    },
    []
  );

  /**
   * Get anchor context information
   */
  const getAnchorContextCallback = useCallback(
    (
      selectedPrice: number,
      basePrice: number,
      originalPrice: number
    ): AnchorContextInfo => {
      return getAnchorContext(selectedPrice, basePrice, originalPrice);
    },
    []
  );

  /**
   * Format savings for display
   */
  const formatSavingsCallback = useCallback((savings: SavingsInfo): string => {
    return formatSavingsText(savings);
  }, []);

  /**
   * Get savings tier
   */
  const getSavingsTierCallback = useCallback(
    (savingsPercentage: number): 'massive' | 'good' | 'modest' => {
      return getSavingsTier(savingsPercentage);
    },
    []
  );

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    calculateSavings: calculateSavingsCallback,
    getAnchorContext: getAnchorContextCallback,
    formatSavings: formatSavingsCallback,
    getSavingsTier: getSavingsTierCallback,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useSavingsCalculations;
