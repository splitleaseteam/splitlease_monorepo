/**
 * PATTERN 3: PRICE ANCHORING - FORMATTING UTILITIES
 * Currency formatting, number display, and text formatting
 */

import type { CurrencyFormatOptions, SavingsInfo } from '../types';

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Default currency format options
 */
const DEFAULT_CURRENCY_OPTIONS: CurrencyFormatOptions = {
  currency: 'USD',
  locale: 'en-US',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  showCurrencySymbol: true,
};

/**
 * Format number as currency
 */
export function formatCurrency(
  amount: number,
  options: Partial<CurrencyFormatOptions> = {}
): string {
  const opts = { ...DEFAULT_CURRENCY_OPTIONS, ...options };

  const formatter = new Intl.NumberFormat(opts.locale, {
    style: opts.showCurrencySymbol ? 'currency' : 'decimal',
    currency: opts.currency,
    minimumFractionDigits: opts.minimumFractionDigits,
    maximumFractionDigits: opts.maximumFractionDigits,
  });

  return formatter.format(amount);
}

/**
 * Format currency with explicit symbol
 */
export function formatCurrencyWithSymbol(
  amount: number,
  symbol: string = '$'
): string {
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Format currency without cents
 */
export function formatCurrencyRounded(amount: number): string {
  return formatCurrency(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format large currency amounts with K/M suffix
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

// ============================================================================
// PERCENTAGE FORMATTING
// ============================================================================

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 0
): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format percentage with sign
 */
export function formatPercentageWithSign(
  value: number,
  decimals: number = 0
): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// ============================================================================
// SAVINGS FORMATTING
// ============================================================================

/**
 * Format savings amount with appropriate messaging
 */
export function formatSavings(savings: SavingsInfo): string {
  const { amount, percentage } = savings;

  if (amount === 0) {
    return 'Reference price';
  }

  if (percentage >= 99) {
    return `Save ${formatCurrencyWithSymbol(amount)} (Basically free!)`;
  }

  if (percentage >= 80) {
    return `Save ${formatCurrencyWithSymbol(amount)} (${formatPercentage(percentage)} off!)`;
  }

  if (percentage >= 50) {
    return `Save ${formatCurrencyWithSymbol(amount)} (${formatPercentage(percentage)} off)`;
  }

  return `Save ${formatCurrencyWithSymbol(amount)}`;
}

/**
 * Format savings badge text
 */
export function formatSavingsBadge(
  savingsAmount: number,
  savingsPercentage: number
): { primary: string; secondary: string } {
  return {
    primary: `Save ${formatCurrencyWithSymbol(savingsAmount)}`,
    secondary: `${formatPercentage(savingsPercentage)} off`,
  };
}

/**
 * Format savings tier message
 */
export function formatSavingsTierMessage(tier: 'massive' | 'good' | 'modest'): string {
  const messages = {
    massive: 'Incredible savings!',
    good: 'Great deal!',
    modest: 'Some savings',
  };
  return messages[tier];
}

// ============================================================================
// PRICE COMPARISON FORMATTING
// ============================================================================

/**
 * Format price comparison text
 */
export function formatPriceComparison(
  price: number,
  anchorPrice: number
): string {
  const savings = anchorPrice - price;
  const percentage = (savings / anchorPrice) * 100;

  if (savings === 0) {
    return `Same as ${formatCurrencyWithSymbol(anchorPrice)}`;
  }

  if (savings > 0) {
    return `${formatCurrencyWithSymbol(savings)} less than ${formatCurrencyWithSymbol(anchorPrice)}`;
  }

  return `${formatCurrencyWithSymbol(Math.abs(savings))} more than ${formatCurrencyWithSymbol(anchorPrice)}`;
}

/**
 * Format "vs anchor" text
 */
export function formatVsAnchor(anchorPrice: number): string {
  return `vs ${formatCurrencyWithSymbol(anchorPrice)}`;
}

// ============================================================================
// TIER FORMATTING
// ============================================================================

/**
 * Format tier multiplier as percentage difference
 */
export function formatTierMultiplier(multiplier: number): string {
  const percentage = (multiplier - 1) * 100;
  if (percentage === 0) return 'Base price';
  const sign = percentage > 0 ? '+' : '';
  return `${sign}${percentage.toFixed(0)}% from base`;
}

/**
 * Format tier badge text
 */
export function formatTierBadge(tierId: string): string | null {
  const badges: Record<string, string | null> = {
    budget: null,
    recommended: 'Most Popular',
    premium: 'Fastest',
    custom: 'Custom',
  };
  return badges[tierId] || null;
}

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Format response time
 */
export function formatResponseTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  }
  if (hours < 24) {
    return `${Math.round(hours)} hours`;
  }
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

/**
 * Format acceptance rate
 */
export function formatAcceptanceRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}% acceptance rate`;
}

// ============================================================================
// NUMERICAL FORMATTING
// ============================================================================

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format number with optional decimals
 */
export function formatDecimal(
  num: number,
  minDecimals: number = 0,
  maxDecimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(num);
}

// ============================================================================
// ANCHOR CONTEXT FORMATTING
// ============================================================================

/**
 * Format comparison to base price
 */
export function formatComparedToBase(
  amount: number,
  direction: 'above' | 'below' | 'equal'
): string {
  if (direction === 'equal') return 'At base price';
  if (direction === 'above') return `${formatCurrencyWithSymbol(amount)} above base`;
  return `${formatCurrencyWithSymbol(amount)} below base`;
}

/**
 * Format comparison to original price
 */
export function formatComparedToOriginal(
  amount: number,
  direction: 'saving' | 'paying' | 'equal'
): string {
  if (direction === 'equal') return 'Same as original';
  if (direction === 'saving') return `Save ${formatCurrencyWithSymbol(amount)}`;
  return `Pay ${formatCurrencyWithSymbol(amount)} extra`;
}

// ============================================================================
// PRICE RANGE FORMATTING
// ============================================================================

/**
 * Format price range
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  return `${formatCurrencyWithSymbol(minPrice)} - ${formatCurrencyWithSymbol(maxPrice)}`;
}

/**
 * Format price with strikethrough (for original price)
 */
export function formatStrikethroughPrice(price: number): string {
  return formatCurrencyWithSymbol(price);
}

// ============================================================================
// VALIDATION MESSAGE FORMATTING
// ============================================================================

/**
 * Format price validation message
 */
export function formatPriceValidationMessage(
  isValid: boolean,
  minPrice?: number,
  maxPrice?: number
): string {
  if (isValid) return 'Price is valid';

  if (minPrice !== undefined && maxPrice !== undefined) {
    return `Price must be between ${formatCurrencyWithSymbol(minPrice)} and ${formatCurrencyWithSymbol(maxPrice)}`;
  }

  return 'Invalid price';
}

// ============================================================================
// TOOLTIP FORMATTING
// ============================================================================

/**
 * Format savings tooltip
 */
export function formatSavingsTooltip(
  savings: number,
  percentage: number
): string {
  return `You save ${formatCurrencyWithSymbol(savings)} (${formatPercentage(percentage)}) compared to the original price`;
}

/**
 * Format tier tooltip
 */
export function formatTierTooltip(
  tierName: string,
  acceptanceRate: number,
  responseTime: number
): string {
  return `${tierName}: ${formatAcceptanceRate(acceptanceRate)}, typically responds in ${formatResponseTime(responseTime)}`;
}

// ============================================================================
// ACCESSIBILITY TEXT FORMATTING
// ============================================================================

/**
 * Format screen reader text for price
 */
export function formatPriceForScreenReader(price: number): string {
  const dollars = Math.floor(price);
  const cents = Math.round((price - dollars) * 100);

  if (cents === 0) {
    return `${dollars} dollars`;
  }

  return `${dollars} dollars and ${cents} cents`;
}

/**
 * Format screen reader text for savings
 */
export function formatSavingsForScreenReader(
  savings: number,
  percentage: number
): string {
  return `Save ${formatPriceForScreenReader(savings)}, which is ${percentage.toFixed(0)} percent off`;
}

// ============================================================================
// EDGE CASE FORMATTING
// ============================================================================

/**
 * Format warning for small savings
 */
export function formatSmallSavingsWarning(percentage: number): string {
  return `Only ${formatPercentage(percentage)} off - consider if the difference matters to you`;
}

/**
 * Format warning for similar prices
 */
export function formatSimilarPricesWarning(): string {
  return 'Prices are very similar - choose based on your preference, not cost';
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // All functions are already exported above
};
