/**
 * TRANSACTION TYPE CLASSIFICATION
 * Gap 2: Classify transactions as Buyout/Crash/Swap
 *
 * Based on simulation findings:
 * - BUYOUT: Exclusive use, highest price (3.5x multiplier)
 * - CRASH: Shared space with roommate, medium price (40% of buyout = 1.4x base)
 * - SWAP: Exchange nights, $0 + price difference settlement
 *
 * PRODUCTION-READY: Rule-based classification
 * FUTURE ENHANCEMENT: Allow users to explicitly choose transaction type in UI
 */

/**
 * Determine transaction type from date change request parameters
 *
 * @param {Object} params
 * @param {string} params.requestType - 'adding', 'removing', 'swapping'
 * @param {Array<number>} params.userNights - Nights user currently has
 * @param {Array<number>} params.requestedNights - Nights user wants
 * @param {Object} params.roommate - Roommate info (if exists)
 * @param {number} params.priceOffered - Price user is offering
 * @param {number} params.basePrice - Base nightly price
 * @returns {Object} Transaction classification with reasoning
 */
export function classifyTransactionType({
  requestType,
  userNights = [],
  requestedNights = [],
  roommate = null,
  priceOffered,
  basePrice
}) {
  // Validate inputs
  if (!requestType || !basePrice || basePrice <= 0) {
    throw new Error('Invalid transaction parameters: requestType and basePrice are required');
  }

  // ============================================================================
  // SWAP: User is exchanging nights (removing one, adding another)
  // ============================================================================
  if (requestType === 'swapping') {
    const priceRatio = priceOffered / basePrice;

    // Pure swap: price is near zero or exactly base price
    if (priceRatio <= 0.1 || Math.abs(priceRatio - 1.0) < 0.05) {
      return {
        transactionType: 'SWAP',
        reasoning: 'Equal value exchange of nights with no premium',
        feeStructure: 'flat_$5',
        exclusiveUse: false,
        multiplier: 0,
        confidence: 0.95
      };
    }

    // Swap with settlement: price difference exists
    return {
      transactionType: 'SWAP_WITH_SETTLEMENT',
      reasoning: `Swapping nights with $${(priceOffered - basePrice).toFixed(2)} settlement`,
      feeStructure: '1.5%_of_settlement',
      exclusiveUse: false,
      multiplier: priceRatio,
      settlementAmount: priceOffered - basePrice,
      confidence: 0.90
    };
  }

  // ============================================================================
  // CRASH: User is adding nights that roommate already has (shared space)
  // ============================================================================
  if (requestType === 'adding' && roommate) {
    const requestedNightsSet = new Set(requestedNights);
    const roommateNightsSet = new Set(roommate.nights || []);

    // Check if any requested nights overlap with roommate's nights
    const overlaps = [...requestedNightsSet].filter(n => roommateNightsSet.has(n));

    if (overlaps.length > 0) {
      // Requesting nights that roommate already has = CRASH
      const priceRatio = priceOffered / basePrice;

      // Crash pricing should be 40% of buyout price
      // Buyout would be ~3.5x base, so crash ~1.4x base (40% of 3.5x)
      if (priceRatio >= 0.3 && priceRatio <= 0.6) {
        return {
          transactionType: 'CRASH',
          reasoning: 'Shared space arrangement with alternating roommate',
          feeStructure: '1.5%_of_crash_price',
          exclusiveUse: false,
          multiplier: priceRatio,
          overlappingNights: overlaps,
          roommateId: roommate.id,
          confidence: 0.85
        };
      }

      // Price doesn't fit crash pattern, but still overlapping
      return {
        transactionType: 'CRASH',
        reasoning: 'Shared space arrangement (price may need adjustment)',
        feeStructure: '1.5%_of_crash_price',
        exclusiveUse: false,
        multiplier: priceRatio,
        overlappingNights: overlaps,
        roommateId: roommate.id,
        confidence: 0.70,
        warning: 'Price outside typical crash range (30%-60% of base)'
      };
    }
  }

  // ============================================================================
  // BUYOUT: User wants exclusive use, willing to pay premium
  // ============================================================================
  if (requestType === 'adding' || requestType === 'swapping') {
    const priceRatio = priceOffered / basePrice;

    // Buyout pricing is 2.5x-4x base price (from simulation)
    if (priceRatio >= 2.0) {
      return {
        transactionType: 'BUYOUT',
        reasoning: 'Premium price for exclusive use of space',
        feeStructure: '1.5%_of_buyout_price',
        exclusiveUse: true,
        multiplier: priceRatio,
        confidence: 0.90
      };
    }
  }

  // ============================================================================
  // STANDARD_CHANGE: Default fallback for regular date modifications
  // ============================================================================
  const priceRatio = priceOffered / basePrice;

  return {
    transactionType: 'STANDARD_CHANGE',
    reasoning: 'Regular date modification without special conditions',
    feeStructure: '1.5%_of_price',
    exclusiveUse: true,
    multiplier: priceRatio,
    confidence: 1.0
  };
}

/**
 * Calculate price for each transaction type based on base price and urgency
 *
 * @param {string} transactionType - BUYOUT, CRASH, SWAP, SWAP_WITH_SETTLEMENT, STANDARD_CHANGE
 * @param {number} basePrice - Base nightly price
 * @param {Object} urgency - Urgency data from Pattern 2
 * @param {number} [settlementAmount=0] - For swap with settlement
 * @returns {number} Calculated price in dollars
 */
export function calculateTransactionPrice(
  transactionType,
  basePrice,
  urgency = null,
  settlementAmount = 0
) {
  const urgencyMultiplier = urgency?.multiplier || 1.0;

  switch (transactionType) {
    case 'BUYOUT':
      // Simulation finding: 3.5x base × urgency
      return basePrice * 3.5 * urgencyMultiplier;

    case 'CRASH':
      // Simulation finding: 40% of buyout
      const buyoutPrice = basePrice * 3.5 * urgencyMultiplier;
      return buyoutPrice * 0.40;

    case 'SWAP':
      // Pure swap: $0 base price (no premium)
      return 0;

    case 'SWAP_WITH_SETTLEMENT':
      // Settlement amount already calculated
      return settlementAmount;

    case 'STANDARD_CHANGE':
    default:
      // Regular price with urgency multiplier
      return basePrice * urgencyMultiplier;
  }
}

/**
 * Get human-readable transaction type label
 *
 * @param {string} transactionType - Transaction type identifier
 * @returns {string} Display label
 */
export function getTransactionTypeLabel(transactionType) {
  const labels = {
    BUYOUT: 'Exclusive Buyout',
    CRASH: 'Shared Space (Crash)',
    SWAP: 'Night Swap',
    SWAP_WITH_SETTLEMENT: 'Night Swap with Settlement',
    STANDARD_CHANGE: 'Standard Date Change'
  };

  return labels[transactionType] || 'Unknown';
}

/**
 * Get transaction type description for UI
 *
 * @param {string} transactionType - Transaction type identifier
 * @returns {string} User-friendly description
 */
export function getTransactionTypeDescription(transactionType) {
  const descriptions = {
    BUYOUT: 'You\'ll have exclusive use of the space during these nights. Premium pricing applies.',
    CRASH: 'You\'ll share the space with your alternating roommate during these nights. Discounted from exclusive pricing.',
    SWAP: 'You\'re exchanging nights of equal value. No additional charge.',
    SWAP_WITH_SETTLEMENT: 'You\'re exchanging nights with a price adjustment for the difference in value.',
    STANDARD_CHANGE: 'Regular date change request with standard pricing.'
  };

  return descriptions[transactionType] || '';
}

/**
 * Validate transaction classification logic
 *
 * @param {Object} classification - Classification result
 * @returns {Object} Validation result
 */
export function validateTransactionClassification(classification) {
  const errors = [];
  const warnings = [];

  // Check required fields
  if (!classification.transactionType) {
    errors.push('Transaction type is required');
  }

  if (!classification.reasoning) {
    warnings.push('No reasoning provided');
  }

  // Check multiplier ranges
  if (classification.multiplier !== undefined) {
    if (classification.multiplier < 0) {
      errors.push('Multiplier cannot be negative');
    }

    if (classification.transactionType === 'BUYOUT' && classification.multiplier < 2.0) {
      warnings.push('Buyout multiplier is lower than expected (should be 2.5x-4x)');
    }

    if (classification.transactionType === 'CRASH' && classification.multiplier > 1.5) {
      warnings.push('Crash multiplier is higher than expected (should be ~1.4x)');
    }
  }

  // Check confidence score
  if (classification.confidence !== undefined) {
    if (classification.confidence < 0 || classification.confidence > 1) {
      errors.push('Confidence score must be between 0 and 1');
    }

    if (classification.confidence < 0.5) {
      warnings.push('Low confidence in classification');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidence: classification.confidence || 0
  };
}

/**
 * Get recommended transaction type based on user context
 *
 * @param {Object} context
 * @param {boolean} context.hasRoommate - Whether user has a roommate
 * @param {boolean} context.isFlexible - Whether user is open to sharing
 * @param {number} context.budget - User's budget level (1-10)
 * @returns {string} Recommended transaction type
 */
export function getRecommendedTransactionType(context = {}) {
  const { hasRoommate, isFlexible, budget } = context;

  // No roommate: recommend buyout or standard
  if (!hasRoommate) {
    return budget >= 7 ? 'BUYOUT' : 'STANDARD_CHANGE';
  }

  // Has roommate and flexible: recommend crash
  if (hasRoommate && isFlexible && budget < 7) {
    return 'CRASH';
  }

  // Has roommate but wants exclusive: recommend buyout
  if (hasRoommate && !isFlexible) {
    return 'BUYOUT';
  }

  // Default to standard change
  return 'STANDARD_CHANGE';
}

/**
 * Calculate potential savings by choosing crash over buyout
 *
 * @param {number} basePrice - Base nightly price
 * @param {Object} urgency - Urgency data
 * @returns {Object} Savings breakdown
 */
export function calculateCrashSavings(basePrice, urgency = null) {
  const buyoutPrice = calculateTransactionPrice('BUYOUT', basePrice, urgency);
  const crashPrice = calculateTransactionPrice('CRASH', basePrice, urgency);
  const savings = buyoutPrice - crashPrice;
  const savingsPercentage = (savings / buyoutPrice) * 100;

  return {
    buyoutPrice,
    crashPrice,
    savings,
    savingsPercentage: savingsPercentage.toFixed(1),
    formattedSavings: `$${savings.toFixed(2)}`
  };
}
