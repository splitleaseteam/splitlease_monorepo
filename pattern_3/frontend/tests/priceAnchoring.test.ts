/**
 * PATTERN 3: PRICE ANCHORING - UNIT TESTS
 * Comprehensive tests for price anchoring utilities
 */

import {
  calculateTierPrices,
  calculateTierPrice,
  getTierFromPrice,
  calculateSavings,
  getSavingsTier,
  getAnchorContext,
  getRecommendedTier,
  formatTierComparison,
  calculatePriceComparisons,
  validatePrice,
  detectEdgeCase,
  formatCurrency,
  formatSavingsText,
  PRICE_TIERS,
  DEFAULT_TIER_MULTIPLIERS,
} from '../utils';

describe('Price Tier Calculations', () => {
  const basePrice = 450;

  test('calculateTierPrices returns correct prices for all tiers', () => {
    const result = calculateTierPrices(basePrice);

    expect(result.budget).toBe(405); // 450 * 0.90
    expect(result.recommended).toBe(450); // 450 * 1.00
    expect(result.premium).toBe(517.5); // 450 * 1.15
  });

  test('calculateTierPrice returns correct price for specific tier', () => {
    expect(calculateTierPrice(basePrice, 'budget')).toBe(405);
    expect(calculateTierPrice(basePrice, 'recommended')).toBe(450);
    expect(calculateTierPrice(basePrice, 'premium')).toBe(517.5);
  });

  test('getTierFromPrice identifies correct tier', () => {
    expect(getTierFromPrice(405, basePrice)).toBe('budget');
    expect(getTierFromPrice(450, basePrice)).toBe('recommended');
    expect(getTierFromPrice(517.5, basePrice)).toBe('premium');
  });

  test('getTierFromPrice returns custom for non-standard prices', () => {
    expect(getTierFromPrice(425, basePrice)).toBe('custom');
    expect(getTierFromPrice(500, basePrice)).toBe('custom');
  });
});

describe('Savings Calculations', () => {
  test('calculateSavings returns correct savings info', () => {
    const result = calculateSavings(324, 2835);

    expect(result.amount).toBe(2511);
    expect(result.percentage).toBeCloseTo(88.6, 1);
    expect(result.formattedAmount).toBe('$2511.00');
    expect(result.tier).toBe('massive');
  });

  test('calculateSavings handles zero savings', () => {
    const result = calculateSavings(450, 450);

    expect(result.amount).toBe(0);
    expect(result.percentage).toBe(0);
  });

  test('getSavingsTier categorizes correctly', () => {
    expect(getSavingsTier(90)).toBe('massive');
    expect(getSavingsTier(80)).toBe('massive');
    expect(getSavingsTier(70)).toBe('good');
    expect(getSavingsTier(50)).toBe('good');
    expect(getSavingsTier(30)).toBe('modest');
    expect(getSavingsTier(10)).toBe('modest');
  });
});

describe('Anchor Context', () => {
  test('getAnchorContext calculates correct comparisons', () => {
    const result = getAnchorContext(324, 450, 2835);

    // vs base
    expect(result.comparedToBase.amount).toBe(126);
    expect(result.comparedToBase.direction).toBe('below');
    expect(result.comparedToBase.formatted).toBe('-$126.00');

    // vs original
    expect(result.comparedToOriginal.amount).toBe(2511);
    expect(result.comparedToOriginal.direction).toBe('saving');
    expect(result.comparedToOriginal.formatted).toBe('Save $2511.00');
  });

  test('getAnchorContext handles price above base', () => {
    const result = getAnchorContext(500, 450, 450);

    expect(result.comparedToBase.direction).toBe('above');
    expect(result.comparedToBase.formatted).toBe('+$50.00');
  });

  test('getAnchorContext handles extra cost', () => {
    const result = getAnchorContext(500, 450, 400);

    expect(result.comparedToOriginal.direction).toBe('paying');
    expect(result.comparedToOriginal.formatted).toBe('Pay $100.00 extra');
  });
});

describe('Tier Recommendation', () => {
  test('getRecommendedTier returns premium for high urgency', () => {
    const result = getRecommendedTier({ urgency: 'high' });
    expect(result).toBe('premium');
  });

  test('getRecommendedTier returns budget for tight budget', () => {
    const result = getRecommendedTier({ budget: 'tight' });
    expect(result).toBe('budget');
  });

  test('getRecommendedTier returns premium for premium history', () => {
    const result = getRecommendedTier({
      history: { hasAcceptedPremium: true },
    });
    expect(result).toBe('premium');
  });

  test('getRecommendedTier returns recommended by default', () => {
    const result = getRecommendedTier({});
    expect(result).toBe('recommended');
  });
});

describe('Tier Comparison Formatting', () => {
  const basePrice = 450;

  test('formatTierComparison returns all tiers with formatted data', () => {
    const result = formatTierComparison(basePrice);

    expect(result).toHaveLength(3);

    const budget = result.find((t) => t.id === 'budget');
    expect(budget?.price).toBe(405);
    expect(budget?.formattedPrice).toBe('$405.00');
    expect(budget?.acceptanceRateFormatted).toBe('45%');
    expect(budget?.responseTimeFormatted).toBe('2d');

    const recommended = result.find((t) => t.id === 'recommended');
    expect(recommended?.price).toBe(450);
    expect(recommended?.acceptanceRateFormatted).toBe('73%');
    expect(recommended?.responseTimeFormatted).toBe('12h');

    const premium = result.find((t) => t.id === 'premium');
    expect(premium?.price).toBe(517.5);
    expect(premium?.acceptanceRateFormatted).toBe('89%');
    expect(premium?.responseTimeFormatted).toBe('4h');
  });
});

describe('Price Anchoring Context', () => {
  const platformFees = {
    buyout: 43,
    crash: 5,
    swap: 5,
  };

  test('calculatePriceComparisons creates correct anchor', () => {
    const result = calculatePriceComparisons(2835, 324, 0, platformFees);

    expect(result.anchor.anchorType).toBe('buyout');
    expect(result.anchor.anchorPrice).toBe(2878); // 2835 + 43
    expect(result.anchor.confidence).toBe(1.0);
  });

  test('calculatePriceComparisons creates correct options', () => {
    const result = calculatePriceComparisons(2835, 324, 0, platformFees);

    expect(result.options).toHaveLength(3);

    // Buyout
    const buyout = result.options.find((o) => o.optionType === 'buyout');
    expect(buyout?.isAnchor).toBe(true);
    expect(buyout?.totalCost).toBe(2878);
    expect(buyout?.savingsVsAnchor).toBe(0);

    // Crash
    const crash = result.options.find((o) => o.optionType === 'crash');
    expect(crash?.totalCost).toBe(329);
    expect(crash?.savingsVsAnchor).toBe(2549);
    expect(crash?.savingsPercentage).toBeCloseTo(88.6, 1);

    // Swap
    const swap = result.options.find((o) => o.optionType === 'swap');
    expect(swap?.totalCost).toBe(5);
    expect(swap?.savingsVsAnchor).toBe(2873);
    expect(swap?.savingsPercentage).toBeCloseTo(99.8, 1);
  });

  test('calculatePriceComparisons assigns correct ranks', () => {
    const result = calculatePriceComparisons(2835, 324, 0, platformFees);

    const buyout = result.options.find((o) => o.optionType === 'buyout');
    const crash = result.options.find((o) => o.optionType === 'crash');
    const swap = result.options.find((o) => o.optionType === 'swap');

    expect(buyout?.rank).toBe(1);
    expect(crash?.rank).toBe(2);
    expect(swap?.rank).toBe(3);
  });
});

describe('Price Validation', () => {
  const basePrice = 450;

  test('validatePrice accepts prices within range', () => {
    const result = validatePrice(400, basePrice, 0.8, 1.3);
    expect(result.isValid).toBe(true);
  });

  test('validatePrice rejects prices below minimum', () => {
    const result = validatePrice(300, basePrice, 0.8, 1.3);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('too low');
  });

  test('validatePrice rejects prices above maximum', () => {
    const result = validatePrice(600, basePrice, 0.8, 1.3);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('too high');
  });
});

describe('Edge Case Detection', () => {
  const basePrice = 450;

  test('detectEdgeCase identifies small savings', () => {
    const result = detectEdgeCase(440, basePrice, 3);
    expect(result.type).toBe('small_savings');
    expect(result.showWarning).toBe(true);
  });

  test('detectEdgeCase identifies similar prices', () => {
    const result = detectEdgeCase(445, basePrice, 1);
    expect(result.type).toBe('similar_prices');
    expect(result.showWarning).toBe(true);
  });

  test('detectEdgeCase returns none for normal case', () => {
    const result = detectEdgeCase(324, basePrice, 28);
    expect(result.type).toBe('none');
    expect(result.showWarning).toBe(false);
  });
});

describe('Currency Formatting', () => {
  test('formatCurrency formats with cents', () => {
    expect(formatCurrency(2511.5, true)).toBe('2511.50');
  });

  test('formatCurrency formats without cents', () => {
    expect(formatCurrency(2511.5, false)).toBe('2512');
  });
});

describe('Savings Text Formatting', () => {
  test('formatSavingsText handles zero savings', () => {
    const savings = { amount: 0, percentage: 0, formattedAmount: '$0.00', formattedPercentage: '0%' };
    const result = formatSavingsText(savings);
    expect(result).toBe('Reference price');
  });

  test('formatSavingsText handles massive savings (>99%)', () => {
    const savings = { amount: 2873, percentage: 99.8, formattedAmount: '$2873.00', formattedPercentage: '99.8%' };
    const result = formatSavingsText(savings);
    expect(result).toContain('Basically free');
  });

  test('formatSavingsText handles large savings (>80%)', () => {
    const savings = { amount: 2511, percentage: 88.6, formattedAmount: '$2511.00', formattedPercentage: '88.6%' };
    const result = formatSavingsText(savings);
    expect(result).toContain('88.6% off!');
  });

  test('formatSavingsText handles moderate savings', () => {
    const savings = { amount: 100, percentage: 50, formattedAmount: '$100.00', formattedPercentage: '50%' };
    const result = formatSavingsText(savings);
    expect(result).toContain('$100.00');
    expect(result).toContain('50% off');
  });
});

describe('Tier Definitions', () => {
  test('PRICE_TIERS has all required tiers', () => {
    expect(PRICE_TIERS.budget).toBeDefined();
    expect(PRICE_TIERS.recommended).toBeDefined();
    expect(PRICE_TIERS.premium).toBeDefined();
    expect(PRICE_TIERS.custom).toBeDefined();
  });

  test('PRICE_TIERS have correct multipliers', () => {
    expect(PRICE_TIERS.budget.multiplier).toBe(0.90);
    expect(PRICE_TIERS.recommended.multiplier).toBe(1.00);
    expect(PRICE_TIERS.premium.multiplier).toBe(1.15);
  });

  test('PRICE_TIERS have correct priorities', () => {
    expect(PRICE_TIERS.recommended.priority).toBe(1);
    expect(PRICE_TIERS.premium.priority).toBe(2);
    expect(PRICE_TIERS.budget.priority).toBe(3);
  });

  test('DEFAULT_TIER_MULTIPLIERS matches PRICE_TIERS', () => {
    expect(DEFAULT_TIER_MULTIPLIERS.budget).toBe(PRICE_TIERS.budget.multiplier);
    expect(DEFAULT_TIER_MULTIPLIERS.recommended).toBe(PRICE_TIERS.recommended.multiplier);
    expect(DEFAULT_TIER_MULTIPLIERS.premium).toBe(PRICE_TIERS.premium.multiplier);
  });
});
