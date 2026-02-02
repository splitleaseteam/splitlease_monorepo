// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - FEE CALCULATIONS
// ============================================================================
// Core fee calculation logic for the 1.5% split model
// Used across frontend components for consistency

export const FEE_RATES = {
    PLATFORM_RATE: 0.0075,      // 0.75%
    LANDLORD_RATE: 0.0075,      // 0.75%
    TOTAL_RATE: 0.015,          // 1.5%
    TRADITIONAL_MARKUP: 0.17,   // 17% (old model comparison)
    MIN_FEE_AMOUNT: 5.00,       // Minimum $5 fee
};

export const TRANSACTION_CONFIGS = {
    date_change: {
        baseLabel: 'Monthly Rent',
        description: 'Change lease dates',
    },
    lease_takeover: {
        baseLabel: 'Prorated Rent',
        description: 'Transfer lease',
    },
    sublet: {
        baseLabel: 'Monthly Rent',
        description: 'Sublet agreement',
    },
    renewal: {
        baseLabel: 'Monthly Rent',
        description: 'Lease renewal',
    }
};

/**
 * Calculate fee breakdown for a transaction
 * @param {number} basePrice - Base transaction amount
 * @param {string} transactionType - Type of transaction
 * @returns {Object|null} Fee breakdown object or null if invalid input
 */
export const calculateFeeBreakdown = (basePrice, transactionType = 'date_change') => {
    if (!basePrice || typeof basePrice !== 'number') return null;

    const platformFee = basePrice * FEE_RATES.PLATFORM_RATE;
    const landlordShare = basePrice * FEE_RATES.LANDLORD_RATE;
    let totalFee = platformFee + landlordShare;

    // Apply minimum fee
    if (totalFee < FEE_RATES.MIN_FEE_AMOUNT) {
        totalFee = FEE_RATES.MIN_FEE_AMOUNT;
    }

    // Round to 2 decimal places
    const roundedPlatformFee = Math.round(platformFee * 100) / 100;
    const roundedLandlordShare = Math.round(landlordShare * 100) / 100;
    const roundedTotalFee = Math.round(totalFee * 100) / 100;
    const totalPrice = Math.round((basePrice + roundedTotalFee) * 100) / 100;

    // Calculate savings comparison
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
        transactionType,
        config: TRANSACTION_CONFIGS[transactionType] || TRANSACTION_CONFIGS.date_change,
        components: [
            { label: 'Base price', amount: basePrice, type: 'base' },
            { label: `Platform fee (${effectiveRate}%)`, amount: roundedTotalFee, type: 'fee' },
            { label: 'Total', amount: totalPrice, type: 'total' }
        ]
    };
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};

/**
 * Format percentage for display
 * @param {number} rate - Rate as decimal (e.g., 0.015 for 1.5%)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (rate) => {
    return `${(rate * 100).toFixed(2)}%`;
};
