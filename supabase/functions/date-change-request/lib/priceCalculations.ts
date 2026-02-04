/**
 * Price Calculation Utilities for Date Change Request Emails
 * Split Lease - Supabase Edge Functions
 *
 * Provides price formatting and calculation functions for email templates.
 * Handles price adjustments, savings, refunds, and cost display.
 *
 * FP PRINCIPLES:
 * - Pure functions with no side effects
 * - Immutable data structures
 * - Explicit dependencies
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/**
 * Price adjustment result
 */
export interface PriceAdjustment {
  formatted: string;        // e.g., "+$50.00", "-$120.00", "No Change"
  amount: number;           // Numeric difference
  isIncrease: boolean;      // True if price goes up
  isDecrease: boolean;      // True if price goes down
  isNoChange: boolean;      // True if no price change
}

/**
 * Savings calculation result
 */
export interface Savings {
  amount: string;           // e.g., "$20.00"
  percentage: string;       // e.g., "20%"
  numericAmount: number;    // Numeric savings
  numericPercentage: number;  // Numeric percentage
}

/**
 * Total booking reduction for removal calculations
 */
export interface BookingReduction {
  formatted: string;        // e.g., "$120.00"
  numeric: number;          // Numeric reduction
  nightCount: number;       // Number of nights being removed
}

// ─────────────────────────────────────────────────────────────
// Price Formatting
// ─────────────────────────────────────────────────────────────

/**
 * Format a price value for display in emails
 * Examples: "$50.00", "$0.00", "$1,234.56"
 *
 * @param price - Price value or null
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatPrice(
  price: number | null,
  options: { includeCents?: boolean; emptyValue?: string } = {}
): string {
  const { includeCents = true, emptyValue = '$0.00' } = options;

  if (price === null || price === undefined) {
    return emptyValue;
  }

  if (isNaN(price)) {
    console.warn('[priceCalculations] Invalid price value:', price);
    return emptyValue;
  }

  // Format with currency
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: includeCents ? 2 : 0,
    maximumFractionDigits: includeCents ? 2 : 0,
  }).format(price);

  return formatted;
}

/**
 * Format price without cents for compact display
 * Example: "$50" instead of "$50.00"
 */
export function formatPriceWhole(price: number | null): string {
  return formatPrice(price, { includeCents: false });
}

// ─────────────────────────────────────────────────────────────
// Price Adjustment Calculations
// ─────────────────────────────────────────────────────────────

/**
 * Calculate price adjustment between original and new price
 * Returns a formatted string like "+$50.00", "-$120.00", or "No Change"
 *
 * @param originalPrice - Original booking price per night
 * @param newPrice - New price for the date change
 * @returns PriceAdjustment object with formatted display and details
 */
export function calculatePriceAdjustment(
  originalPrice: number | null,
  newPrice: number | null
): PriceAdjustment {
  // Handle missing values
  if (!originalPrice || !newPrice) {
    return {
      formatted: 'No Change',
      amount: 0,
      isIncrease: false,
      isDecrease: false,
      isNoChange: true,
    };
  }

  // Calculate difference
  const diff = newPrice - originalPrice;

  // Check for no change (within 1 cent to handle floating point)
  if (Math.abs(diff) < 0.01) {
    return {
      formatted: 'No Change',
      amount: 0,
      isIncrease: false,
      isDecrease: false,
      isNoChange: true,
    };
  }

  // Format the adjustment
  const sign = diff >= 0 ? '+' : '';
  const formatted = `${sign}${formatPrice(diff)}`;

  return {
    formatted,
    amount: diff,
    isIncrease: diff > 0,
    isDecrease: diff < 0,
    isNoChange: false,
  };
}

/**
 * Get price adjustment string for display in banners
 * Uses calculatePriceAdjustment and returns just the formatted string
 */
export function getPriceAdjustmentString(
  originalPrice: number | null,
  newPrice: number | null
): string {
  return calculatePriceAdjustment(originalPrice, newPrice).formatted;
}

// ─────────────────────────────────────────────────────────────
// Savings Calculations
// ─────────────────────────────────────────────────────────────

/**
 * Calculate savings from a discounted price
 * Used when guest gets a discount on added dates
 *
 * @param price - Actual price paid
 * @param percentageOfRegular - Percentage this price represents of regular price
 * @returns Savings object with amount and percentage
 */
export function calculateSavings(
  price: number | null,
  percentageOfRegular: number | null
): Savings {
  // Handle missing values
  if (!price || !percentageOfRegular) {
    return {
      amount: '$0.00',
      percentage: '0%',
      numericAmount: 0,
      numericPercentage: 0,
    };
  }

  // Calculate regular (full) price
  // If price is 80% of regular, regular = price / 0.80
  const percentageDecimal = percentageOfRegular / 100;
  const regularPrice = price / percentageDecimal;

  // Calculate savings amount
  const savingsAmount = regularPrice - price;

  // The percentage is (100 - percentageOfRegular)
  const savingsPercentage = 100 - percentageOfRegular;

  return {
    amount: formatPrice(savingsAmount),
    percentage: `${Math.round(savingsPercentage)}%`,
    numericAmount: savingsAmount,
    numericPercentage: savingsPercentage,
  };
}

/**
 * Format savings for display in email
 * Example: "You Saved: $20.00 (20%)"
 */
export function formatSavingsDisplay(
  price: number | null,
  percentageOfRegular: number | null
): string {
  const savings = calculateSavings(price, percentageOfRegular);

  if (savings.numericAmount <= 0) {
    return '';
  }

  return `${savings.amount} (${savings.percentage})`;
}

// ─────────────────────────────────────────────────────────────
// Refund and Reduction Calculations
// ─────────────────────────────────────────────────────────────

/**
 * Calculate total refund amount for removed dates
 *
 * @param pricePerNight - Price per night for removed dates
 * @param numberOfNights - Number of nights being removed
 * @returns Formatted refund string
 */
export function calculateRefundAmount(
  pricePerNight: number | null,
  numberOfNights: number = 1
): string {
  if (!pricePerNight) return formatPrice(null);

  const totalRefund = pricePerNight * numberOfNights;
  return formatPrice(totalRefund);
}

/**
 * Calculate booking reduction for multiple removed dates
 *
 * @param prices - Array of prices for each removed date
 * @returns BookingReduction object
 */
export function calculateBookingReduction(prices: (number | null)[]): BookingReduction {
  const validPrices = prices.filter(p => p !== null && !isNaN(p)) as number[];
  const numeric = validPrices.reduce((sum, price) => sum + price, 0);
  const nightCount = validPrices.length;

  return {
    formatted: formatPrice(numeric),
    numeric,
    nightCount,
  };
}

/**
 * Format additional cost for added dates
 *
 * @param pricePerNight - Price per night for added dates
 * @param numberOfNights - Number of nights being added
 * @returns Formatted additional cost string
 */
export function calculateAdditionalCost(
  pricePerNight: number | null,
  numberOfNights: number = 1
): string {
  if (!pricePerNight) return formatPrice(null);

  const totalCost = pricePerNight * numberOfNights;
  return formatPrice(totalCost);
}

// ─────────────────────────────────────────────────────────────
// Final Cost Calculations
// ─────────────────────────────────────────────────────────────

/**
 * Format final cost for a confirmed added date
 * Includes price and any savings information
 *
 * @param price - Final price paid
 * @param percentageOfRegular - Discount percentage (optional)
 * @returns Object with final cost and savings display
 */
export function formatFinalCostForNight(
  price: number | null,
  percentageOfRegular: number | null
): { cost: string; savings: string } {
  const cost = formatPrice(price);
  const savings = formatSavingsDisplay(price, percentageOfRegular);

  return {
    cost,
    savings,
  };
}
