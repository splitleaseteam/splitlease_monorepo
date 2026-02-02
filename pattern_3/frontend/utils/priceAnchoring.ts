/**
 * PATTERN 3: PRICE ANCHORING - UTILITY FUNCTIONS
 * Core price anchoring calculations and tier management
 */

import type {
  PriceTier,
  PriceTierId,
  TierMultipliers,
  PriceAnchor,
  PriceComparison,
  AnchoringContext,
  SavingsInfo,
  AnchorContextInfo,
  UserContext,
  PlatformFees,
} from '../types';

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

/**
 * Default tier multipliers
 */
export const DEFAULT_TIER_MULTIPLIERS: TierMultipliers = {
  budget: 0.90,
  recommended: 1.00,
  premium: 1.15,
};

/**
 * Tier acceptance rates (historical data)
 */
export const TIER_ACCEPTANCE_RATES = {
  budget: 0.45,
  recommended: 0.73,
  premium: 0.89,
};

/**
 * Average response times (hours)
 */
export const TIER_RESPONSE_TIMES = {
  budget: 48,
  recommended: 12,
  premium: 4,
};

/**
 * Complete price tier definitions
 */
export const PRICE_TIERS: Record<PriceTierId, Omit<PriceTier, 'icon'>> = {
  budget: {
    id: 'budget',
    name: 'Budget',
    multiplier: 0.90,
    badge: null,
    description: 'Basic offer',
    features: [
      'Standard processing',
      'May take longer to accept',
      'Lower priority',
    ],
    color: 'gray',
    acceptanceRate: 0.45,
    avgResponseTime: 48,
    priority: 3,
  },
  recommended: {
    id: 'recommended',
    name: 'Recommended',
    multiplier: 1.00,
    badge: 'Most Popular',
    description: 'Best value',
    features: [
      'Fair market rate',
      'Faster acceptance',
      'Preferred by 73% of users',
    ],
    color: 'blue',
    highlighted: true,
    acceptanceRate: 0.73,
    avgResponseTime: 12,
    priority: 1,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    multiplier: 1.15,
    badge: 'Fastest',
    description: 'Priority handling',
    features: [
      'Highest acceptance rate',
      'Same-day response typical',
      'VIP processing',
    ],
    color: 'purple',
    acceptanceRate: 0.89,
    avgResponseTime: 4,
    priority: 2,
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    multiplier: 1.00,
    badge: null,
    description: 'Your custom amount',
    features: ['Set your own price'],
    color: 'gray',
    priority: 4,
  },
};

// ============================================================================
// TIER PRICE CALCULATIONS
// ============================================================================

/**
 * Calculate prices for all tiers based on base price
 */
export function calculateTierPrices(basePrice: number): Record<PriceTierId, number> {
  return {
    budget: basePrice * DEFAULT_TIER_MULTIPLIERS.budget,
    recommended: basePrice * DEFAULT_TIER_MULTIPLIERS.recommended,
    premium: basePrice * DEFAULT_TIER_MULTIPLIERS.premium,
    custom: basePrice,
  };
}

/**
 * Calculate price for a specific tier
 */
export function calculateTierPrice(basePrice: number, tierId: PriceTierId): number {
  const tier = PRICE_TIERS[tierId];
  return basePrice * tier.multiplier;
}

/**
 * Get tier from a custom price (find closest match)
 */
export function getTierFromPrice(price: number, basePrice: number): PriceTierId {
  const multiplier = price / basePrice;
  const tiers: Array<{ id: PriceTierId; multiplier: number }> = [
    { id: 'budget', multiplier: DEFAULT_TIER_MULTIPLIERS.budget },
    { id: 'recommended', multiplier: DEFAULT_TIER_MULTIPLIERS.recommended },
    { id: 'premium', multiplier: DEFAULT_TIER_MULTIPLIERS.premium },
  ];

  let closestTier: PriceTierId = 'recommended';
  let smallestDiff = Infinity;

  for (const tier of tiers) {
    const diff = Math.abs(tier.multiplier - multiplier);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestTier = tier.id;
    }
  }

  // If difference is too large, consider it custom
  if (smallestDiff > 0.05) {
    return 'custom';
  }

  return closestTier;
}

// ============================================================================
// SAVINGS CALCULATIONS
// ============================================================================

/**
 * Calculate savings vs original price
 */
export function calculateSavings(
  offerPrice: number,
  originalPrice: number
): SavingsInfo {
  const savings = originalPrice - offerPrice;
  const percentageSaved = (savings / originalPrice) * 100;

  return {
    amount: savings,
    percentage: percentageSaved,
    formattedAmount: `$${savings.toFixed(2)}`,
    formattedPercentage: `${percentageSaved.toFixed(0)}%`,
    tier: getSavingsTier(percentageSaved),
  };
}

/**
 * Get savings tier based on percentage
 */
export function getSavingsTier(
  savingsPercentage: number
): 'massive' | 'good' | 'modest' {
  if (savingsPercentage >= 80) return 'massive';
  if (savingsPercentage >= 50) return 'good';
  return 'modest';
}

/**
 * Get anchor context (what user is "saving" or "paying extra")
 */
export function getAnchorContext(
  selectedPrice: number,
  basePrice: number,
  originalPrice: number
): AnchorContextInfo {
  const vsBase = selectedPrice - basePrice;
  const vsOriginal = originalPrice - selectedPrice;

  return {
    comparedToBase: {
      amount: Math.abs(vsBase),
      direction: vsBase > 0 ? 'above' : vsBase < 0 ? 'below' : 'equal',
      formatted:
        vsBase > 0
          ? `+$${vsBase.toFixed(2)}`
          : vsBase < 0
          ? `-$${Math.abs(vsBase).toFixed(2)}`
          : '$0.00',
    },
    comparedToOriginal: {
      amount: Math.abs(vsOriginal),
      direction: vsOriginal > 0 ? 'saving' : vsOriginal < 0 ? 'paying' : 'equal',
      formatted:
        vsOriginal > 0
          ? `Save $${vsOriginal.toFixed(2)}`
          : vsOriginal < 0
          ? `Pay $${Math.abs(vsOriginal).toFixed(2)} extra`
          : 'Same price',
    },
  };
}

// ============================================================================
// TIER RECOMMENDATION
// ============================================================================

/**
 * Determine recommended tier based on user context
 */
export function getRecommendedTier(userContext: UserContext = {}): PriceTierId {
  const { urgency, budget, history } = userContext;

  // If user has accepted premium offers before
  if (history?.hasAcceptedPremium) {
    return 'premium';
  }

  // If very urgent
  if (urgency === 'high') {
    return 'premium';
  }

  // If budget-conscious
  if (budget === 'tight') {
    return 'budget';
  }

  // Default to recommended
  return 'recommended';
}

// ============================================================================
// TIER COMPARISON FORMATTING
// ============================================================================

/**
 * Format tier comparison for display
 */
export function formatTierComparison(
  basePrice: number
): Array<
  Omit<PriceTier, 'icon'> & {
    price: number;
    formattedPrice: string;
    acceptanceRateFormatted: string;
    responseTimeFormatted: string;
  }
> {
  const tierIds: PriceTierId[] = ['budget', 'recommended', 'premium'];

  return tierIds.map((id) => {
    const tier = PRICE_TIERS[id];
    const price = basePrice * tier.multiplier;
    const responseTime = tier.avgResponseTime || 0;

    return {
      ...tier,
      price,
      formattedPrice: `$${price.toFixed(2)}`,
      acceptanceRateFormatted: `${((tier.acceptanceRate || 0) * 100).toFixed(0)}%`,
      responseTimeFormatted:
        responseTime < 24
          ? `${responseTime}h`
          : `${Math.round(responseTime / 24)}d`,
    };
  });
}

// ============================================================================
// PRICE ANCHORING CONTEXT
// ============================================================================

/**
 * Calculate complete price comparisons for anchoring
 */
export function calculatePriceComparisons(
  buyoutPrice: number,
  crashPrice: number,
  swapPrice: number,
  platformFees: PlatformFees
): AnchoringContext {
  // Buyout is always the anchor
  const anchor: PriceAnchor = {
    anchorType: 'buyout',
    anchorPrice: buyoutPrice + platformFees.buyout,
    source: 'Exclusive buyout rate',
    confidence: 1.0,
  };

  // Calculate comparisons
  const buyoutOption: PriceComparison = {
    optionType: 'buyout',
    price: buyoutPrice,
    platformFee: platformFees.buyout,
    totalCost: buyoutPrice + platformFees.buyout,
    savingsVsAnchor: 0,
    savingsPercentage: 0,
    rank: 1,
    isAnchor: true,
  };

  const crashTotal = crashPrice + platformFees.crash;
  const crashOption: PriceComparison = {
    optionType: 'crash',
    price: crashPrice,
    platformFee: platformFees.crash,
    totalCost: crashTotal,
    savingsVsAnchor: anchor.anchorPrice - crashTotal,
    savingsPercentage:
      ((anchor.anchorPrice - crashTotal) / anchor.anchorPrice) * 100,
    rank: 2,
    isAnchor: false,
  };

  const swapTotal = swapPrice + platformFees.swap;
  const swapOption: PriceComparison = {
    optionType: 'swap',
    price: swapPrice,
    platformFee: platformFees.swap,
    totalCost: swapTotal,
    savingsVsAnchor: anchor.anchorPrice - swapTotal,
    savingsPercentage:
      ((anchor.anchorPrice - swapTotal) / anchor.anchorPrice) * 100,
    rank: 3,
    isAnchor: false,
  };

  return {
    anchor,
    options: [buyoutOption, crashOption, swapOption],
  };
}

// ============================================================================
// TIER SORTING
// ============================================================================

/**
 * Sort tiers by visual hierarchy (descending price)
 */
export function sortTiersByHierarchy(tiers: PriceTier[]): PriceTier[] {
  return [...tiers].sort((a, b) => {
    // Sort by priority first (1 = highest)
    if (a.priority !== b.priority) {
      return (a.priority || 99) - (b.priority || 99);
    }
    // Then by multiplier descending
    return b.multiplier - a.multiplier;
  });
}

/**
 * Sort options by price descending (for visual cascade)
 */
export function sortOptionsByPrice(options: PriceComparison[]): PriceComparison[] {
  return [...options].sort((a, b) => b.totalCost - a.totalCost);
}

// ============================================================================
// PRICE VALIDATION
// ============================================================================

/**
 * Validate if a price is within acceptable range
 */
export function validatePrice(
  price: number,
  basePrice: number,
  minMultiplier: number = 0.8,
  maxMultiplier: number = 1.3
): { isValid: boolean; reason?: string } {
  const minPrice = basePrice * minMultiplier;
  const maxPrice = basePrice * maxMultiplier;

  if (price < minPrice) {
    return {
      isValid: false,
      reason: `Price too low. Minimum: $${minPrice.toFixed(2)}`,
    };
  }

  if (price > maxPrice) {
    return {
      isValid: false,
      reason: `Price too high. Maximum: $${maxPrice.toFixed(2)}`,
    };
  }

  return { isValid: true };
}

// ============================================================================
// EDGE CASE DETECTION
// ============================================================================

/**
 * Detect edge case scenarios
 */
export function detectEdgeCase(
  selectedPrice: number,
  basePrice: number,
  savingsPercentage: number
): {
  type: 'small_savings' | 'similar_prices' | 'none';
  warning?: string;
  showWarning: boolean;
} {
  // Small savings (<5%)
  if (savingsPercentage > 0 && savingsPercentage < 5) {
    return {
      type: 'small_savings',
      warning: 'Small price difference - choose based on preference',
      showWarning: true,
    };
  }

  // Prices very similar
  const priceDiff = Math.abs(selectedPrice - basePrice);
  if (priceDiff < basePrice * 0.05) {
    return {
      type: 'similar_prices',
      warning: 'Prices are very similar',
      showWarning: true,
    };
  }

  return {
    type: 'none',
    showWarning: false,
  };
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  showCents: boolean = true
): string {
  if (showCents) {
    return amount.toFixed(2);
  }
  return Math.round(amount).toString();
}

/**
 * Format savings display text
 */
export function formatSavingsText(savings: SavingsInfo): string {
  if (savings.amount === 0) return 'Reference price';

  if (savings.percentage >= 99) {
    return `Save ${savings.formattedAmount} (Basically free!)`;
  }

  if (savings.percentage >= 80) {
    return `Save ${savings.formattedAmount} (${savings.formattedPercentage} off!)`;
  }

  return `Save ${savings.formattedAmount} (${savings.formattedPercentage} off)`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Types are imported from '../types'
};
