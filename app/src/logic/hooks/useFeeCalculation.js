import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    calculateFeeBreakdown,
    formatCurrency
} from '../calculators/feeCalculations';

/**
 * Hook for calculating and managing fee breakdowns
 * 
 * @param {number} basePrice - Base price for calculation
 * @param {string} transactionType - Type of transaction
 * @param {Object} options - Additional options
 * @returns {Object} Fee calculation state and methods
 */
export function useFeeCalculation(basePrice, transactionType = 'date_change', options = {}) {
    const { autoCalculate = true } = options;
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState(null);

    // Memoize fee breakdown calculation
    const feeBreakdown = useMemo(() => {
        if (!autoCalculate || !basePrice) return null;

        try {
            setError(null);
            return calculateFeeBreakdown(basePrice, transactionType);
        } catch (err) {
            setError(err.message);
            return null;
        }
    }, [basePrice, transactionType, autoCalculate]);

    // Simulate brief calculation for UX (optional)
    useEffect(() => {
        if (autoCalculate && basePrice) {
            setIsCalculating(true);
            const timer = setTimeout(() => setIsCalculating(false), 200);
            return () => clearTimeout(timer);
        }
    }, [basePrice, transactionType, autoCalculate]);

    // Manual recalculation method
    const recalculate = useCallback((newBasePrice, newTransactionType) => {
        try {
            setError(null);
            return calculateFeeBreakdown(
                newBasePrice || basePrice,
                newTransactionType || transactionType
            );
        } catch (err) {
            setError(err.message);
            return null;
        }
    }, [basePrice, transactionType]);

    return {
        feeBreakdown,
        isCalculating,
        error,
        recalculate,
        formatCurrency
    };
}
