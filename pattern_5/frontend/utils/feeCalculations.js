/**
 * Fee calculation utilities for Split Lease
 * Implements 1.5% split fee model (0.75% platform + 0.75% landlord)
 *
 * @module feeCalculations
 * @version 1.0.0
 * @production
 */

// ============================================================================
// FEE STRUCTURE CONSTANTS
// ============================================================================

/**
 * Core fee rates for the platform
 * @constant
 */
export const FEE_RATES = {
  PLATFORM_RATE: 0.0075,      // 0.75%
  LANDLORD_RATE: 0.0075,      // 0.75%
  TOTAL_RATE: 0.015,          // 1.5%
  TRADITIONAL_MARKUP: 0.17,   // 17% (old model comparison)
  MIN_FEE_AMOUNT: 5.00,       // Minimum $5 fee
  MAX_FEE_PERCENTAGE: 0.05    // Cap at 5% for very small amounts
};

/**
 * Transaction type configurations
 * Defines how fees apply to different transaction types
 * @constant
 */
export const TRANSACTION_CONFIGS = {
  date_change: {
    applyToTenant: true,
    applyToLandlord: true,
    description: 'Date change request',
    splitModel: true,
    urgencyMultiplierApplies: true
  },
  lease_takeover: {
    applyToTenant: true,
    applyToLandlord: true,
    description: 'Lease takeover',
    splitModel: true,
    urgencyMultiplierApplies: false
  },
  sublet: {
    applyToTenant: true,
    applyToLandlord: false,
    description: 'Sublet arrangement',
    splitModel: false,
    urgencyMultiplierApplies: false
  },
  lease_renewal: {
    applyToTenant: true,
    applyToLandlord: true,
    description: 'Lease renewal',
    splitModel: true,
    urgencyMultiplierApplies: false
  },
  buyout: {
    applyToTenant: true,
    applyToLandlord: true,
    description: 'Room buyout',
    splitModel: true,
    urgencyMultiplierApplies: true
  },
  swap: {
    applyToTenant: false,
    applyToLandlord: false,
    description: 'Room swap',
    splitModel: false,
    urgencyMultiplierApplies: false,
    flatFee: 5.00
  }
};

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate comprehensive fee breakdown for a transaction
 *
 * @param {number} basePrice - Base price (e.g., monthly rent)
 * @param {string} transactionType - Type of transaction
 * @param {Object} options - Additional calculation options
 * @param {number} options.urgencyMultiplier - Urgency multiplier for dynamic pricing
 * @param {number} options.buyoutMultiplier - Buyout premium multiplier
 * @param {boolean} options.applyMinimumFee - Whether to apply minimum fee (default: true)
 * @returns {Object} Fee breakdown object
 * @throws {Error} If base price is invalid
 */
export const calculateFeeBreakdown = (
  basePrice,
  transactionType = 'date_change',
  options = {}
) => {
  // ========================================
  // Input Validation
  // ========================================
  if (!basePrice || typeof basePrice !== 'number') {
    throw new Error('Base price must be a valid number');
  }

  if (basePrice < 0) {
    throw new Error('Base price must be a positive number');
  }

  const config = TRANSACTION_CONFIGS[transactionType] || TRANSACTION_CONFIGS.date_change;
  const {
    urgencyMultiplier = 1.0,
    buyoutMultiplier = 1.0,
    applyMinimumFee = true,
    swapSettlement = 0
  } = options;

  // ========================================
  // Handle Special Cases
  // ========================================

  // CASE 1: Pure swap (no money exchange)
  if (transactionType === 'swap' && swapSettlement === 0) {
    return {
      basePrice: 0,
      platformFee: config.flatFee || 5.00,
      landlordShare: 0,
      tenantShare: config.flatFee || 5.00,
      totalFee: config.flatFee || 5.00,
      totalPrice: config.flatFee || 5.00,
      effectiveRate: 0,
      savingsVsTraditional: 0,
      transactionType: config.description,
      isSwap: true,
      isFlatFee: true,
      breakdown: {
        platformRate: 0,
        landlordRate: 0,
        totalRate: 0,
        flatFeeAmount: config.flatFee || 5.00
      },
      components: []
    };
  }

  // CASE 2: Swap with settlement
  if (transactionType === 'swap' && swapSettlement > 0) {
    const settlementFee = Math.max(
      config.flatFee || 5.00,
      Math.round(swapSettlement * FEE_RATES.TOTAL_RATE * 100) / 100
    );

    return {
      basePrice: swapSettlement,
      platformFee: settlementFee,
      landlordShare: 0,
      tenantShare: settlementFee,
      totalFee: settlementFee,
      totalPrice: swapSettlement + settlementFee,
      effectiveRate: parseFloat(((settlementFee / swapSettlement) * 100).toFixed(2)),
      savingsVsTraditional: (swapSettlement * FEE_RATES.TRADITIONAL_MARKUP) - settlementFee,
      transactionType: config.description,
      isSwap: true,
      hasSettlement: true,
      breakdown: {
        platformRate: FEE_RATES.TOTAL_RATE,
        landlordRate: 0,
        totalRate: FEE_RATES.TOTAL_RATE,
        settlementAmount: swapSettlement
      },
      components: [
        {
          label: 'Price settlement',
          amount: swapSettlement,
          type: 'settlement'
        },
        {
          label: 'Platform fee',
          amount: settlementFee,
          type: 'fee'
        }
      ]
    };
  }

  // ========================================
  // Standard Fee Calculation
  // ========================================

  // Calculate adjusted base price with multipliers
  let adjustedPrice = basePrice;
  const priceComponents = [];

  // Add base price component
  priceComponents.push({
    label: 'Base price',
    amount: basePrice,
    description: 'Monthly rent or transaction base',
    type: 'base',
    percentage: null
  });

  // Apply urgency multiplier if applicable
  if (config.urgencyMultiplierApplies && urgencyMultiplier > 1.0) {
    const urgencyPremium = basePrice * (urgencyMultiplier - 1.0);
    adjustedPrice += urgencyPremium;

    priceComponents.push({
      label: `Urgency premium (${urgencyMultiplier.toFixed(1)}x)`,
      amount: urgencyPremium,
      description: 'Price increase for short notice',
      type: 'urgency',
      percentage: ((urgencyMultiplier - 1.0) * 100).toFixed(1)
    });
  }

  // Apply buyout multiplier if applicable
  if (buyoutMultiplier > 1.0) {
    const buyoutPremium = adjustedPrice * (buyoutMultiplier - 1.0);
    const preBuyoutPrice = adjustedPrice;
    adjustedPrice += buyoutPremium;

    priceComponents.push({
      label: `Buyout premium (${buyoutMultiplier.toFixed(1)}x)`,
      amount: buyoutPremium,
      description: 'Exclusive access and roommate compensation',
      type: 'premium',
      percentage: ((buyoutMultiplier - 1.0) * 100).toFixed(1)
    });
  }

  // Calculate component fees
  const platformFee = adjustedPrice * FEE_RATES.PLATFORM_RATE;
  const landlordShare = config.applyToLandlord
    ? adjustedPrice * FEE_RATES.LANDLORD_RATE
    : 0;

  let totalFee = platformFee + landlordShare;

  // Apply minimum fee if enabled
  if (applyMinimumFee && totalFee < FEE_RATES.MIN_FEE_AMOUNT) {
    totalFee = FEE_RATES.MIN_FEE_AMOUNT;
  }

  // Round to 2 decimal places
  const roundedPlatformFee = Math.round(platformFee * 100) / 100;
  const roundedLandlordShare = Math.round(landlordShare * 100) / 100;
  const roundedTotalFee = Math.round(totalFee * 100) / 100;

  // Tenant pays the total fee (in most cases)
  const tenantShare = config.applyToTenant ? roundedTotalFee : 0;

  // Calculate total price
  const totalPrice = Math.round((adjustedPrice + tenantShare) * 100) / 100;

  // Calculate savings vs traditional model
  const traditionalFee = adjustedPrice * FEE_RATES.TRADITIONAL_MARKUP;
  const savingsVsTraditional = Math.round((traditionalFee - roundedTotalFee) * 100) / 100;

  // Calculate effective rate as percentage
  const effectiveRate = parseFloat(((roundedTotalFee / adjustedPrice) * 100).toFixed(2));

  // Add fee component
  priceComponents.push({
    label: `Platform fee (${effectiveRate}%)`,
    amount: roundedTotalFee,
    description: 'Transaction processing, support, and protection',
    type: 'fee',
    percentage: effectiveRate
  });

  // Add total component
  priceComponents.push({
    label: 'Total',
    amount: totalPrice,
    description: 'All-inclusive final cost',
    type: 'total',
    percentage: null
  });

  // ========================================
  // Return Comprehensive Breakdown
  // ========================================
  return {
    basePrice,
    adjustedPrice,
    platformFee: roundedPlatformFee,
    landlordShare: roundedLandlordShare,
    tenantShare,
    totalFee: roundedTotalFee,
    totalPrice,
    effectiveRate,
    savingsVsTraditional,
    transactionType: config.description,
    breakdown: {
      platformRate: FEE_RATES.PLATFORM_RATE,
      landlordRate: FEE_RATES.LANDLORD_RATE,
      totalRate: FEE_RATES.TOTAL_RATE,
      traditionalRate: FEE_RATES.TRADITIONAL_MARKUP
    },
    multipliers: {
      urgency: urgencyMultiplier,
      buyout: buyoutMultiplier
    },
    components: priceComponents,
    metadata: {
      calculatedAt: new Date().toISOString(),
      minimumFeeApplied: applyMinimumFee && roundedTotalFee === FEE_RATES.MIN_FEE_AMOUNT,
      splitModel: config.splitModel
    }
  };
};

/**
 * Calculate total price including fees (simplified version)
 *
 * @param {number} basePrice - Base price
 * @param {string} transactionType - Type of transaction
 * @param {Object} options - Additional options
 * @returns {number} Total price
 */
export const calculateTotalPrice = (basePrice, transactionType = 'date_change', options = {}) => {
  const breakdown = calculateFeeBreakdown(basePrice, transactionType, options);
  return breakdown.totalPrice;
};

/**
 * Format fee breakdown for storage in database (JSONB)
 *
 * @param {number} basePrice - Base price
 * @param {string} transactionType - Type of transaction
 * @param {Object} options - Additional options
 * @returns {Object} JSONB-ready fee breakdown
 */
export const formatFeeBreakdownForDB = (basePrice, transactionType = 'date_change', options = {}) => {
  const breakdown = calculateFeeBreakdown(basePrice, transactionType, options);

  return {
    base_price: breakdown.basePrice,
    adjusted_price: breakdown.adjustedPrice,
    platform_fee: breakdown.platformFee,
    landlord_share: breakdown.landlordShare,
    tenant_share: breakdown.tenantShare,
    total_fee: breakdown.totalFee,
    total_price: breakdown.totalPrice,
    effective_rate: breakdown.effectiveRate,
    savings_vs_traditional: breakdown.savingsVsTraditional,
    transaction_type: transactionType,
    multipliers: breakdown.multipliers,
    calculated_at: new Date().toISOString(),
    fee_structure_version: '1.5_split_model_v1',
    minimum_fee_applied: breakdown.metadata.minimumFeeApplied
  };
};

/**
 * Calculate landlord net receipt (what they actually receive)
 *
 * @param {number} basePrice - Base price
 * @param {string} transactionType - Type of transaction
 * @param {Object} options - Additional options
 * @returns {Object} Landlord financial breakdown
 */
export const calculateLandlordNetReceipt = (basePrice, transactionType = 'date_change', options = {}) => {
  const breakdown = calculateFeeBreakdown(basePrice, transactionType, options);

  // Landlord receives base price minus their share of the fee
  const netReceipt = breakdown.adjustedPrice - breakdown.landlordShare;

  return {
    basePrice: breakdown.basePrice,
    adjustedPrice: breakdown.adjustedPrice,
    landlordShare: breakdown.landlordShare,
    netReceipt: Math.round(netReceipt * 100) / 100,
    effectiveReceiptRate: parseFloat(((netReceipt / breakdown.adjustedPrice) * 100).toFixed(2)),
    savingsPassedToLandlord: breakdown.landlordShare
  };
};

/**
 * Calculate tenant payment breakdown (what they pay and why)
 *
 * @param {number} basePrice - Base price
 * @param {string} transactionType - Type of transaction
 * @param {Object} options - Additional options
 * @returns {Object} Tenant payment breakdown
 */
export const calculateTenantPayment = (basePrice, transactionType = 'date_change', options = {}) => {
  const breakdown = calculateFeeBreakdown(basePrice, transactionType, options);

  return {
    basePrice: breakdown.basePrice,
    adjustedPrice: breakdown.adjustedPrice,
    tenantShare: breakdown.tenantShare,
    totalPayment: breakdown.totalPrice,
    savingsVsTraditional: breakdown.savingsVsTraditional,
    effectiveRate: breakdown.effectiveRate,
    components: breakdown.components
  };
};

/**
 * Validate fee calculation parameters
 *
 * @param {number} basePrice - Base price
 * @param {string} transactionType - Type of transaction
 * @param {Object} options - Additional options
 * @returns {Object} Validation result
 */
export const validateFeeCalculation = (basePrice, transactionType, options = {}) => {
  const errors = [];
  const warnings = [];

  // Validate base price
  if (!basePrice || typeof basePrice !== 'number') {
    errors.push('Base price must be a valid number');
  } else if (basePrice < 0) {
    errors.push('Base price must be greater than or equal to zero');
  } else if (basePrice === 0 && transactionType !== 'swap') {
    warnings.push('Zero base price is unusual for non-swap transactions');
  }

  // Validate transaction type
  if (transactionType && !TRANSACTION_CONFIGS[transactionType]) {
    errors.push(`Invalid transaction type: ${transactionType}. Valid types: ${Object.keys(TRANSACTION_CONFIGS).join(', ')}`);
  }

  // Validate multipliers
  if (options.urgencyMultiplier !== undefined) {
    if (typeof options.urgencyMultiplier !== 'number' || options.urgencyMultiplier < 1.0) {
      errors.push('Urgency multiplier must be a number >= 1.0');
    } else if (options.urgencyMultiplier > 10.0) {
      warnings.push('Urgency multiplier > 10x is unusually high');
    }
  }

  if (options.buyoutMultiplier !== undefined) {
    if (typeof options.buyoutMultiplier !== 'number' || options.buyoutMultiplier < 1.0) {
      errors.push('Buyout multiplier must be a number >= 1.0');
    } else if (options.buyoutMultiplier > 10.0) {
      warnings.push('Buyout multiplier > 10x is unusually high');
    }
  }

  // Validate swap settlement
  if (options.swapSettlement !== undefined) {
    if (typeof options.swapSettlement !== 'number' || options.swapSettlement < 0) {
      errors.push('Swap settlement must be a non-negative number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Compare fee across different transaction types
 *
 * @param {number} basePrice - Base price
 * @returns {Array} Comparison results
 */
export const compareFeesByType = (basePrice) => {
  const types = Object.keys(TRANSACTION_CONFIGS);
  return types.map(type => {
    const breakdown = calculateFeeBreakdown(basePrice, type);
    return {
      type,
      description: TRANSACTION_CONFIGS[type].description,
      totalFee: breakdown.totalFee,
      effectiveRate: breakdown.effectiveRate,
      totalPrice: breakdown.totalPrice
    };
  });
};

/**
 * Calculate fee for multiple line items (batch calculation)
 *
 * @param {Array} items - Array of {basePrice, transactionType, options}
 * @returns {Object} Aggregated fee breakdown
 */
export const calculateBatchFees = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Items must be a non-empty array');
  }

  const breakdowns = items.map(item =>
    calculateFeeBreakdown(item.basePrice, item.transactionType, item.options)
  );

  const totalBasePrice = breakdowns.reduce((sum, b) => sum + b.basePrice, 0);
  const totalPlatformFee = breakdowns.reduce((sum, b) => sum + b.platformFee, 0);
  const totalLandlordShare = breakdowns.reduce((sum, b) => sum + b.landlordShare, 0);
  const totalFee = breakdowns.reduce((sum, b) => sum + b.totalFee, 0);
  const totalPrice = breakdowns.reduce((sum, b) => sum + b.totalPrice, 0);

  return {
    itemCount: items.length,
    totalBasePrice: Math.round(totalBasePrice * 100) / 100,
    totalPlatformFee: Math.round(totalPlatformFee * 100) / 100,
    totalLandlordShare: Math.round(totalLandlordShare * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    effectiveRate: parseFloat(((totalFee / totalBasePrice) * 100).toFixed(2)),
    items: breakdowns
  };
};

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format currency for display
 *
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {boolean} showCents - Whether to show cents (default: true)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', showCents = true) => {
  if (typeof amount !== 'number') return '$0.00';

  const options = {
    style: 'currency',
    currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0
  };

  return new Intl.NumberFormat('en-US', options).format(amount);
};

/**
 * Format percentage for display
 *
 * @param {number} rate - Rate as decimal (e.g., 0.015 for 1.5%)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (rate, decimals = 2) => {
  if (typeof rate !== 'number') return '0%';
  return `${(rate * 100).toFixed(decimals)}%`;
};

/**
 * Format fee breakdown for display
 *
 * @param {Object} breakdown - Fee breakdown object
 * @returns {Object} Display-ready breakdown
 */
export const formatBreakdownForDisplay = (breakdown) => {
  return {
    basePrice: formatCurrency(breakdown.basePrice),
    adjustedPrice: formatCurrency(breakdown.adjustedPrice),
    platformFee: formatCurrency(breakdown.platformFee),
    landlordShare: formatCurrency(breakdown.landlordShare),
    tenantShare: formatCurrency(breakdown.tenantShare),
    totalFee: formatCurrency(breakdown.totalFee),
    totalPrice: formatCurrency(breakdown.totalPrice),
    effectiveRate: formatPercentage(breakdown.effectiveRate / 100),
    savingsVsTraditional: formatCurrency(breakdown.savingsVsTraditional),
    components: breakdown.components.map(comp => ({
      ...comp,
      amount: formatCurrency(comp.amount),
      percentage: comp.percentage ? `${comp.percentage}%` : null
    }))
  };
};

// Export constants for use in other modules
export const FEE_CONSTANTS = FEE_RATES;
export const SUPPORTED_TRANSACTION_TYPES = Object.keys(TRANSACTION_CONFIGS);

/**
 * Get transaction config by type
 *
 * @param {string} type - Transaction type
 * @returns {Object|null} Transaction configuration
 */
export const getTransactionConfig = (type) => {
  return TRANSACTION_CONFIGS[type] || null;
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  calculateFeeBreakdown,
  calculateTotalPrice,
  formatFeeBreakdownForDB,
  calculateLandlordNetReceipt,
  calculateTenantPayment,
  validateFeeCalculation,
  compareFeesByType,
  calculateBatchFees,
  formatCurrency,
  formatPercentage,
  formatBreakdownForDisplay,
  FEE_CONSTANTS,
  SUPPORTED_TRANSACTION_TYPES,
  getTransactionConfig
};
