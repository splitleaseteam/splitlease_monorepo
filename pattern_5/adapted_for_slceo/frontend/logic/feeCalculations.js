/**
 * Fee calculation utilities for Split Lease (SLCEO Adapted)
 * Implements 1.5% split fee model (0.75% platform + 0.75% landlord)
 */

export const FEE_RATES = {
    PLATFORM_RATE: 0.0075,      // 0.75%
    LANDLORD_RATE: 0.0075,      // 0.75%
    TOTAL_RATE: 0.015,          // 1.5%
    TRADITIONAL_MARKUP: 0.17,   // 17% (old model comparison)
    MIN_FEE_AMOUNT: 5.00,       // Minimum $5 fee
};

export const TRANSACTION_CONFIGS = {
    date_change: {
        description: 'Date change request',
        splitModel: true,
    },
    lease_takeover: {
        description: 'Lease takeover',
        splitModel: true,
    }
};

/**
 * Calculate fee breakdown
 */
export const calculateFeeBreakdown = (basePrice, transactionType = 'date_change') => {
    if (!basePrice || typeof basePrice !== 'number') return null;

    const platformFee = basePrice * FEE_RATES.PLATFORM_RATE;
    const landlordShare = basePrice * FEE_RATES.LANDLORD_RATE;
    let totalFee = platformFee + landlordShare;

    if (totalFee < FEE_RATES.MIN_FEE_AMOUNT) {
        totalFee = FEE_RATES.MIN_FEE_AMOUNT;
    }

    const roundedPlatformFee = Math.round(platformFee * 100) / 100;
    const roundedLandlordShare = Math.round(landlordShare * 100) / 100;
    const roundedTotalFee = Math.round(totalFee * 100) / 100;
    const totalPrice = Math.round((basePrice + roundedTotalFee) * 100) / 100;

    const traditionalFee = basePrice * FEE_RATES.TRADITIONAL_MARKUP;
    const savingsVsTraditional = Math.round((traditionalFee - roundedTotalFee) * 100) / 100;
    const effectiveRate = parseFloat(((roundedTotalFee / basePrice) * 100).toFixed(2));

    return {
        basePrice,
        platformFee: roundedPlatformFee,
        landlordShare: roundedLandlordShare,
        totalFee: roundedTotalFee,
        totalPrice,
        effectiveRate,
        savingsVsTraditional,
        components: [
            { label: 'Base price', amount: basePrice, type: 'base' },
            { label: `Platform fee (${effectiveRate}%)`, amount: roundedTotalFee, type: 'fee' },
            { label: 'Total', amount: totalPrice, type: 'total' }
        ]
    };
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const formatPercentage = (rate) => {
    return `${(rate * 100).toFixed(2)}%`;
};

export default {
    calculateFeeBreakdown,
    formatCurrency,
    formatPercentage,
    FEE_RATES,
};
