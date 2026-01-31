/**
 * Pricing Strategy Hook for ScheduleDashboard
 * @module hooks/usePricingStrategy
 *
 * Manages pricing strategy state and preferences saving state.
 * Extracted from useScheduleDashboardLogic.js for better separation of concerns.
 */

import { useState } from 'react';
import { DEFAULT_NOTICE_MULTIPLIERS } from '../helpers/priceCalculations.js';

/**
 * Default pricing strategy configuration
 */
const DEFAULT_PRICING_STRATEGY = {
  baseRate: 150,
  noticeMultipliers: DEFAULT_NOTICE_MULTIPLIERS,
  edgePreference: 'neutral',
  sharingWillingness: 'standard'
};

/**
 * Hook for managing pricing strategy state in ScheduleDashboard
 * @returns {object} Pricing strategy state and handlers
 */
export function usePricingStrategy() {
  // -------------------------------------------------------------------------
  // PRICING STRATEGY STATE (with localStorage initialization and migration)
  // -------------------------------------------------------------------------
  const [pricingStrategy, setPricingStrategy] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('pricingStrategy');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Old schema had baseCostType/baseCostValue, new has baseRate/sharingWillingness
        if (parsed.baseCostType !== undefined) {
          return {
            baseRate: parsed.baseCostValue || 150,
            noticeMultipliers: parsed.noticeMultipliers ?? DEFAULT_NOTICE_MULTIPLIERS,
            edgePreference: parsed.edgePreference ?? 'neutral',
            sharingWillingness: 'standard'
          };
        }
        return { ...DEFAULT_PRICING_STRATEGY, ...parsed };
      } catch (_e) {
        // Invalid JSON in localStorage, fall back to defaults
        console.warn('Invalid pricingStrategy JSON in localStorage, using defaults');
      }
    }
    return DEFAULT_PRICING_STRATEGY;
  });

  // -------------------------------------------------------------------------
  // PREFERENCES SAVING STATE
  // -------------------------------------------------------------------------
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------
  return {
    // State
    pricingStrategy,
    isSavingPreferences,

    // Constants for external use
    DEFAULT_PRICING_STRATEGY,

    // Direct setters (for cross-hook coordination)
    setPricingStrategy,
    setIsSavingPreferences,
  };
}
