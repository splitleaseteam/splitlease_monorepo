// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - FEE CALCULATIONS
// ============================================================================
// Core fee calculation logic for Split Lease transactions
// Used across frontend components for consistency

export const FEE_RATES = {
    PLATFORM_RATE: 0.0075,      // 0.75%
    LANDLORD_RATE: 0.0075,      // 0.75%
    TOTAL_RATE: 0.015,          // 1.5%
    TRADITIONAL_MARKUP: 0.17,   // 17% (old model comparison)
};

// ============================================================================
// SCHEDULE DASHBOARD FEE STRUCTURE
// ============================================================================
// Buyout: 1.5% per party (both requestor and recipient pay 1.5%)
// Swap: $5 flat (initiator only)
// Share: $5 flat (initiator only)

export const FEE_STRUCTURE = {
    buyout: {
        type: 'percentage',
        rate: 0.015,       // 1.5% per party
        minFee: null,
        maxFee: null,
        perParty: true,
        label: 'Service Fee (1.5%)',
        description: 'Each party pays 1.5% of the buyout amount'
    },
    swap: {
        type: 'flat',
        amount: 5.00,
        initiatorOnly: true,
        label: 'Swap Fee',
        description: 'Initiator pays a $5 fee'
    },
    share: {
        type: 'flat',
        amount: 5.00,
        initiatorOnly: true,
        label: 'Share Fee',
        description: 'Initiator pays a $5 fee'
    }
};

/**
 * Calculate transaction fee based on type
 * @param {string} transactionType - 'buyout', 'swap', or 'share'
 * @param {number} baseAmount - Base transaction amount (for buyout)
 * @returns {Object} Fee breakdown with totalFee, requestorFee, recipientFee
 */
export const calculateTransactionFee = (transactionType, baseAmount = 0) => {
    const feeConfig = FEE_STRUCTURE[transactionType];

    if (!feeConfig) {
        return { totalFee: 0, requestorFee: 0, recipientFee: 0, type: 'unknown' };
    }

    if (feeConfig.type === 'none') {
        return {
            totalFee: 0,
            requestorFee: 0,
            recipientFee: 0,
            type: 'none',
            label: feeConfig.label,
            description: feeConfig.description
        };
    }

    if (feeConfig.type === 'flat') {
        if (feeConfig.initiatorOnly) {
            return {
                totalFee: feeConfig.amount,
                requestorFee: feeConfig.amount,
                recipientFee: 0,
                type: 'flat',
                label: feeConfig.label,
                description: feeConfig.description
            };
        }
        return {
            totalFee: feeConfig.amount,
            requestorFee: feeConfig.amount / 2,
            recipientFee: feeConfig.amount / 2,
            type: 'flat',
            label: feeConfig.label,
            description: feeConfig.description
        };
    }

    if (feeConfig.type === 'percentage') {
        const perPartyFee = Math.round(baseAmount * feeConfig.rate * 100) / 100;
        return {
            totalFee: perPartyFee * 2,
            requestorFee: perPartyFee,
            recipientFee: perPartyFee,
            type: 'percentage',
            rate: feeConfig.rate,
            effectiveRate: (feeConfig.rate * 100).toFixed(1),
            label: feeConfig.label,
            description: feeConfig.description
        };
    }

    return { totalFee: 0, requestorFee: 0, recipientFee: 0, type: 'unknown' };
};

/**
 * Calculate what requestor pays and what recipient receives
 * @param {string} transactionType - 'buyout', 'swap', or 'share'
 * @param {number} baseAmount - The offer/buyout amount
 * @returns {Object} Payment breakdown
 */
export const calculatePaymentBreakdown = (transactionType, baseAmount) => {
    const fees = calculateTransactionFee(transactionType, baseAmount);

    return {
        baseAmount,
        fees,
        requestorPays: Math.round((baseAmount + fees.requestorFee) * 100) / 100,
        recipientReceives: Math.round((baseAmount - fees.recipientFee) * 100) / 100
    };
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
