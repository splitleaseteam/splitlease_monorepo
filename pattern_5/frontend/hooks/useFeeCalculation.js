/**
 * useFeeCalculation Hook
 * Custom React hook for fee calculation with caching and validation
 *
 * @hook useFeeCalculation
 * @version 1.0.0
 * @production
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  calculateFeeBreakdown,
  validateFeeCalculation,
  formatCurrency
} from '../utils/feeCalculations';

/**
 * Hook for calculating and managing fee breakdowns
 *
 * @param {number} basePrice - Base price for calculation
 * @param {string} transactionType - Type of transaction
 * @param {Object} options - Additional calculation options
 * @returns {Object} Fee calculation state and methods
 */
export const useFeeCalculation = (
  basePrice,
  transactionType = 'date_change',
  options = {}
) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);
  const [lastCalculation, setLastCalculation] = useState(null);

  // Extract options with defaults
  const {
    urgencyMultiplier = 1.0,
    buyoutMultiplier = 1.0,
    applyMinimumFee = true,
    swapSettlement = 0,
    autoCalculate = true,
    debounceMs = 300
  } = options;

  // Validation
  const validation = useMemo(() => {
    return validateFeeCalculation(basePrice, transactionType, {
      urgencyMultiplier,
      buyoutMultiplier,
      swapSettlement
    });
  }, [basePrice, transactionType, urgencyMultiplier, buyoutMultiplier, swapSettlement]);

  // Fee breakdown calculation (memoized)
  const feeBreakdown = useMemo(() => {
    if (!validation.isValid) {
      return null;
    }

    try {
      setIsCalculating(true);
      const breakdown = calculateFeeBreakdown(basePrice, transactionType, {
        urgencyMultiplier,
        buyoutMultiplier,
        applyMinimumFee,
        swapSettlement
      });

      setLastCalculation(new Date());
      setCalculationError(null);
      return breakdown;
    } catch (error) {
      console.error('Fee calculation error:', error);
      setCalculationError(error.message);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [
    basePrice,
    transactionType,
    urgencyMultiplier,
    buyoutMultiplier,
    applyMinimumFee,
    swapSettlement,
    validation.isValid
  ]);

  // Recalculate method (for manual triggering)
  const recalculate = useCallback(() => {
    setCalculationError(null);
    // Force re-calculation by creating new timestamp
    setLastCalculation(new Date());
  }, []);

  // Effect for auto-calculation with debounce
  useEffect(() => {
    if (!autoCalculate) return;

    const timer = setTimeout(() => {
      if (validation.isValid) {
        recalculate();
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [basePrice, transactionType, urgencyMultiplier, buyoutMultiplier, autoCalculate, debounceMs, recalculate, validation.isValid]);

  return {
    feeBreakdown,
    isCalculating,
    calculationError,
    validation,
    lastCalculation,
    recalculate,
    // Convenience getters
    totalPrice: feeBreakdown?.totalPrice || 0,
    totalFee: feeBreakdown?.totalFee || 0,
    effectiveRate: feeBreakdown?.effectiveRate || 0,
    savingsVsTraditional: feeBreakdown?.savingsVsTraditional || 0,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings
  };
};

/**
 * Hook for batch fee calculations
 *
 * @param {Array} items - Array of calculation items
 * @returns {Object} Batch calculation results
 */
export const useBatchFeeCalculation = (items) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!items || items.length === 0) {
      setResults([]);
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      const calculatedResults = items.map(item => {
        try {
          return {
            ...item,
            feeBreakdown: calculateFeeBreakdown(
              item.basePrice,
              item.transactionType || 'date_change',
              item.options || {}
            ),
            error: null
          };
        } catch (error) {
          return {
            ...item,
            feeBreakdown: null,
            error: error.message
          };
        }
      });

      setResults(calculatedResults);
    } catch (error) {
      setCalculationError(error.message);
    } finally {
      setIsCalculating(false);
    }
  }, [items]);

  // Calculate totals
  const totals = useMemo(() => {
    if (results.length === 0) return null;

    const validResults = results.filter(r => r.feeBreakdown !== null);

    return {
      totalBasePrice: validResults.reduce((sum, r) => sum + r.feeBreakdown.basePrice, 0),
      totalFees: validResults.reduce((sum, r) => sum + r.feeBreakdown.totalFee, 0),
      totalPrice: validResults.reduce((sum, r) => sum + r.feeBreakdown.totalPrice, 0),
      itemCount: validResults.length,
      errorCount: results.length - validResults.length
    };
  }, [results]);

  return {
    results,
    totals,
    isCalculating,
    calculationError,
    hasErrors: results.some(r => r.error !== null)
  };
};

/**
 * Hook for comparing fees across transaction types
 *
 * @param {number} basePrice - Base price for comparison
 * @returns {Object} Comparison results
 */
export const useFeeComparison = (basePrice) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    if (!basePrice || basePrice <= 0) {
      setComparison(null);
      return;
    }

    setIsCalculating(true);

    try {
      const types = ['date_change', 'lease_takeover', 'sublet', 'lease_renewal', 'buyout'];
      const comparisons = types.map(type => {
        const breakdown = calculateFeeBreakdown(basePrice, type);
        return {
          type,
          typeName: breakdown.transactionType,
          totalFee: breakdown.totalFee,
          effectiveRate: breakdown.effectiveRate,
          totalPrice: breakdown.totalPrice,
          savingsVsTraditional: breakdown.savingsVsTraditional
        };
      });

      // Sort by total fee (lowest first)
      comparisons.sort((a, b) => a.totalFee - b.totalFee);

      setComparison({
        items: comparisons,
        lowestFee: comparisons[0],
        highestFee: comparisons[comparisons.length - 1],
        averageFee: comparisons.reduce((sum, c) => sum + c.totalFee, 0) / comparisons.length
      });
    } catch (error) {
      console.error('Comparison error:', error);
      setComparison(null);
    } finally {
      setIsCalculating(false);
    }
  }, [basePrice]);

  return {
    comparison,
    isCalculating
  };
};

/**
 * Hook for tracking fee calculation history
 *
 * @param {number} maxHistory - Maximum number of calculations to store
 * @returns {Object} Calculation history and methods
 */
export const useFeeCalculationHistory = (maxHistory = 10) => {
  const [history, setHistory] = useState([]);

  const addCalculation = useCallback((calculation) => {
    setHistory(prev => {
      const newHistory = [
        {
          ...calculation,
          timestamp: new Date(),
          id: Date.now()
        },
        ...prev
      ];

      // Limit history size
      return newHistory.slice(0, maxHistory);
    });
  }, [maxHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getCalculation = useCallback((id) => {
    return history.find(h => h.id === id);
  }, [history]);

  const removeCalculation = useCallback((id) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  }, []);

  return {
    history,
    addCalculation,
    clearHistory,
    getCalculation,
    removeCalculation,
    count: history.length
  };
};

export default useFeeCalculation;
