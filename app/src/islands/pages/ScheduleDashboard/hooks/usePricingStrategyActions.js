import { useCallback } from 'react';
import { DEFAULT_NOTICE_MULTIPLIERS } from '../helpers/priceCalculations.js';

/**
 * @param {Object} params
 * @param {Object} params.pricing - Pricing state/actions.
 */
export function usePricingStrategyActions({ pricing }) {
  /**
   * Update a single pricing strategy field.
   */
  const handlePricingStrategyChange = useCallback((key, value) => {
    pricing.setPricingStrategy((prev) => ({
      ...prev,
      [key]: value
    }));
  }, [pricing]);

  /**
   * Save pricing strategy to localStorage.
   */
  const handleSavePricingStrategy = useCallback(async () => {
    try {
      pricing.setIsSavingPreferences(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      localStorage.setItem('pricingStrategy', JSON.stringify(pricing.pricingStrategy));
    } catch (err) {
      console.error('Failed to save pricing strategy:', err);
    } finally {
      pricing.setIsSavingPreferences(false);
    }
  }, [pricing]);

  /**
   * Reset pricing strategy to defaults.
   */
  const handleResetPricingStrategy = useCallback(() => {
    const defaults = {
      baseRate: 150,
      noticeMultipliers: DEFAULT_NOTICE_MULTIPLIERS,
      edgePreference: 'neutral',
      sharingWillingness: 'standard'
    };
    pricing.setPricingStrategy(defaults);
  }, [pricing]);

  return {
    handlePricingStrategyChange,
    handleSavePricingStrategy,
    handleResetPricingStrategy
  };
}
