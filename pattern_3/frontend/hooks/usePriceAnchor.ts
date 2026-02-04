/**
 * PATTERN 3: PRICE ANCHORING - usePriceAnchor Hook
 * Main hook for managing price anchoring state and calculations
 */

import { useState, useMemo, useCallback } from 'react';
import type {
  PriceAnchor,
  PriceComparison,
  UsePriceAnchorReturn,
  PlatformFees,
} from '../types';
import { calculatePriceComparisons, sortOptionsByPrice } from '../utils';

// ============================================================================
// HOOK CONFIGURATION
// ============================================================================

interface UsePriceAnchorProps {
  buyoutPrice: number;
  crashPrice: number;
  swapPrice: number;
  platformFees: PlatformFees;
  defaultSelection?: 'buyout' | 'crash' | 'swap';
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook for managing price anchoring state and calculations
 *
 * @example
 * ```tsx
 * const { anchor, sortedOptions, selectedOption, selectOption } = usePriceAnchor({
 *   buyoutPrice: 2835,
 *   crashPrice: 324,
 *   swapPrice: 0,
 *   platformFees: { buyout: 43, crash: 5, swap: 5 }
 * });
 * ```
 */
export function usePriceAnchor({
  buyoutPrice,
  crashPrice,
  swapPrice,
  platformFees,
  defaultSelection,
}: UsePriceAnchorProps): UsePriceAnchorReturn {
  // ========================================================================
  // STATE
  // ========================================================================

  const [selectedOptionType, setSelectedOptionType] = useState<string | null>(
    defaultSelection || null
  );

  // ========================================================================
  // MEMOIZED CALCULATIONS
  // ========================================================================

  /**
   * Calculate anchoring context with all price comparisons
   */
  const anchoringContext = useMemo(() => {
    return calculatePriceComparisons(
      buyoutPrice,
      crashPrice,
      swapPrice,
      platformFees
    );
  }, [buyoutPrice, crashPrice, swapPrice, platformFees]);

  /**
   * Extract anchor from context
   */
  const anchor: PriceAnchor = useMemo(() => {
    return anchoringContext.anchor;
  }, [anchoringContext]);

  /**
   * Sort options by price (descending) for visual cascade
   */
  const sortedOptions: PriceComparison[] = useMemo(() => {
    return sortOptionsByPrice(anchoringContext.options);
  }, [anchoringContext.options]);

  /**
   * Get currently selected option
   */
  const selectedOption: PriceComparison | null = useMemo(() => {
    if (!selectedOptionType) return null;
    return (
      sortedOptions.find((opt) => opt.optionType === selectedOptionType) || null
    );
  }, [sortedOptions, selectedOptionType]);

  /**
   * Calculate tier prices (for compatibility with tier-based UI)
   */
  const tierPrices = useMemo(() => {
    // Use crash price as base for tier calculations
    const basePrice = crashPrice;
    return {
      budget: basePrice * 0.9,
      recommended: basePrice * 1.0,
      premium: basePrice * 1.15,
    };
  }, [crashPrice]);

  // ========================================================================
  // CALLBACKS
  // ========================================================================

  /**
   * Select an option by type
   */
  const selectOption = useCallback((optionType: string) => {
    setSelectedOptionType(optionType);
  }, []);

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    anchor,
    sortedOptions,
    selectedOption,
    selectOption,
    tierPrices,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default usePriceAnchor;
