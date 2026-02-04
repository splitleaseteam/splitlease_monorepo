import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    calculateFeeBreakdown,
    formatCurrency
} from '../logic/feeCalculations';

/**
 * Hook for calculating and managing fee breakdowns (SLCEO Adapted)
 * 
 * @param {number} basePrice - Base price for calculation
 * @param {string} transactionType - Type of transaction
 * @param {Object} options - Additional calculation options
 */
export const useFeeCalculation = (
    basePrice,
    transactionType = 'date_change',
    options = {}
) => {
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculationError, setCalculationError] = useState(null);
    const [lastCalculation, setLastCalculation] = useState(null);

    const {
        autoCalculate = true,
        debounceMs = 300
    } = options;

    // Fee breakdown calculation (memoized)
    const feeBreakdown = useMemo(() => {
        if (!basePrice || basePrice <= 0) {
            return null;
        }

        try {
            setIsCalculating(true);
            const breakdown = calculateFeeBreakdown(basePrice, transactionType);

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
    }, [basePrice, transactionType]);

    return {
        feeBreakdown,
        isCalculating,
        calculationError,
        lastCalculation,
        // Convenience getters
        totalPrice: feeBreakdown?.totalPrice || 0,
        totalFee: feeBreakdown?.totalFee || 0,
        effectiveRate: feeBreakdown?.effectiveRate || 0,
        savingsVsTraditional: feeBreakdown?.savingsVsTraditional || 0,
    };
};

export default useFeeCalculation;
