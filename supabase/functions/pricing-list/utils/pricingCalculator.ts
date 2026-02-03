/**
 * Pricing Calculator Utility
 *
 * Server-side implementation of pricing calculations.
 * Mirrors the frontend calculator logic for consistency.
 *
 * Constants are duplicated here (not imported from frontend)
 * to keep Edge Functions self-contained.
 */

// ─────────────────────────────────────────────────────────────
// Constants (mirrored from app/src/logic/constants/pricingConstants.js)
// ─────────────────────────────────────────────────────────────

const PRICING_CONSTANTS = {
  FULL_TIME_DISCOUNT_RATE: 0.13,
  SITE_MARKUP_RATE: 0.17,
  FULL_TIME_NIGHTS_THRESHOLD: 7,
  PRICING_LIST_ARRAY_LENGTH: 7,
  DEFAULT_UNIT_MARKUP: 0,
  UNUSED_NIGHTS_DISCOUNT_MULTIPLIER: 0.03,
} as const;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Listing {
  _id: string;
  nightly_rate_1_night?: number | null;
  nightly_rate_2_nights?: number | null;
  nightly_rate_3_nights?: number | null;
  nightly_rate_4_nights?: number | null;
  nightly_rate_5_nights?: number | null;
  nightly_rate_6_nights?: number | null;
  nightly_rate_7_nights?: number | null;
  weekly_host_rate?: number | null;
  monthly_host_rate?: number | null;
  'rental type'?: string;
  [key: string]: unknown;
}

interface CalculatePricingParams {
  listing: Listing;
  unitMarkup?: number;
}

interface PricingListData {
  hostCompensation: (number | null)[];
  markupAndDiscountMultiplier: number[];
  nightlyPrice: (number | null)[];
  unusedNightsDiscount: number[];
  unitMarkup: number;
  overallSiteMarkup: number;
  combinedMarkup: number;
  fullTimeDiscount: number;
  startingNightlyPrice: number | null;
  slope: number | null;
}

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────

function normalizeRate(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return null;
  }
  return num;
}

function roundToFourDecimals(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

// ─────────────────────────────────────────────────────────────
// Calculator Functions
// ─────────────────────────────────────────────────────────────

const AVG_DAYS_PER_MONTH = 30.4;

/**
 * Calculate Host Compensation array based on rental type.
 *
 * FORMULA BY RENTAL TYPE:
 * - Weekly: weeklyRate / numberOfNights (e.g., $2000/2 = $1000 for 2 nights)
 * - Monthly: (monthlyRate / avgDaysPerMonth) * 7 / numberOfNights
 * - Nightly: Direct from individual nightly rate columns
 *
 * Array index 0 = 1 night, index 6 = 7 nights
 */
function calculateHostCompensationArray(listing: Listing): (number | null)[] {
  const rentalType = listing['rental type'] || 'Nightly';

  // For Weekly rental type: weeklyRate / numberOfNights
  // E.g., $2000 weekly rate: [2000/1, 2000/2, 2000/3, 2000/4, 2000/5, 2000/6, 2000/7]
  if (rentalType === 'Weekly') {
    const weeklyRate = normalizeRate(listing['weekly_host_rate']);
    if (weeklyRate !== null) {
      return [
        roundToTwoDecimals(weeklyRate / 1), // 1 night: full weekly rate per night
        roundToTwoDecimals(weeklyRate / 2), // 2 nights: weekly rate spread over 2
        roundToTwoDecimals(weeklyRate / 3), // 3 nights
        roundToTwoDecimals(weeklyRate / 4), // 4 nights
        roundToTwoDecimals(weeklyRate / 5), // 5 nights
        roundToTwoDecimals(weeklyRate / 6), // 6 nights
        roundToTwoDecimals(weeklyRate / 7), // 7 nights: lowest per-night rate
      ];
    }
    // Fall through to return nulls if no weekly rate
  }

  // For Monthly rental type: Convert monthly to weekly equivalent, then divide by nights
  // Formula: (monthlyRate / avgDaysPerMonth) * 7 / numberOfNights
  if (rentalType === 'Monthly') {
    const monthlyRate = normalizeRate(listing['monthly_host_rate']);
    if (monthlyRate !== null) {
      // Weekly equivalent = (monthlyRate / 30.4) * 7
      const weeklyEquivalent = (monthlyRate / AVG_DAYS_PER_MONTH) * 7;
      return [
        roundToTwoDecimals(weeklyEquivalent / 1), // 1 night
        roundToTwoDecimals(weeklyEquivalent / 2), // 2 nights
        roundToTwoDecimals(weeklyEquivalent / 3), // 3 nights
        roundToTwoDecimals(weeklyEquivalent / 4), // 4 nights
        roundToTwoDecimals(weeklyEquivalent / 5), // 5 nights
        roundToTwoDecimals(weeklyEquivalent / 6), // 6 nights
        roundToTwoDecimals(weeklyEquivalent / 7), // 7 nights
      ];
    }
    // Fall through to return nulls if no monthly rate
  }

  // For Nightly rental type (or fallback): use individual nightly rates
  return [
    normalizeRate(listing['nightly_rate_1_night']),
    normalizeRate(listing['nightly_rate_2_nights']),
    normalizeRate(listing['nightly_rate_3_nights']),
    normalizeRate(listing['nightly_rate_4_nights']),
    normalizeRate(listing['nightly_rate_5_nights']),
    normalizeRate(listing['nightly_rate_6_nights']),
    normalizeRate(listing['nightly_rate_7_nights']),
  ];
}

function calculateUnusedNightsDiscountArray(
  discountMultiplier: number = PRICING_CONSTANTS.UNUSED_NIGHTS_DISCOUNT_MULTIPLIER
): number[] {
  const maxNights = PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH;
  const discountArray: number[] = [];

  for (let nightIndex = 0; nightIndex < maxNights; nightIndex++) {
    const nightsBooked = nightIndex + 1;

    // LENGTH-OF-STAY discount: more nights booked = more discount
    // At 1 night: (1-1) = 0, discount = 0 (no volume benefit)
    // At 7 nights: (7-1) = 6, discount = multiplier * 6 (maximum discount)
    const discount = (nightsBooked - 1) * discountMultiplier;

    discountArray.push(roundToFourDecimals(discount));
  }

  return discountArray;
}

function calculateCombinedMarkup(
  unitMarkup: number,
  siteMarkup: number
): number {
  const combined = unitMarkup + siteMarkup;
  return roundToFourDecimals(Math.min(combined, 1));
}

function calculateMarkupAndDiscountMultipliersArray(
  combinedMarkup: number,
  unusedNightsDiscounts: number[],
  fullTimeDiscount: number
): number[] {
  const fullTimeNightIndex = PRICING_CONSTANTS.FULL_TIME_NIGHTS_THRESHOLD - 1;
  const multipliersArray: number[] = [];

  for (let nightIndex = 0; nightIndex < PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH; nightIndex++) {
    const unusedDiscount = unusedNightsDiscounts[nightIndex] || 0;
    const applicableFullTimeDiscount = nightIndex === fullTimeNightIndex ? fullTimeDiscount : 0;
    const totalDiscount = unusedDiscount + applicableFullTimeDiscount;

    // Additive formula: 1 + markup - discount
    const multiplier = 1 + combinedMarkup - totalDiscount;

    multipliersArray.push(roundToFourDecimals(multiplier));
  }

  return multipliersArray;
}

function calculateNightlyPricesArray(
  hostCompensation: (number | null)[],
  multipliers: number[]
): (number | null)[] {
  const pricesArray: (number | null)[] = [];

  for (let i = 0; i < PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH; i++) {
    const hostRate = hostCompensation[i];
    const multiplier = multipliers[i];

    if (hostRate === null || hostRate === undefined) {
      pricesArray.push(null);
      continue;
    }

    if (typeof hostRate !== 'number' || isNaN(hostRate)) {
      pricesArray.push(null);
      continue;
    }

    const nightlyPrice = hostRate * multiplier;
    pricesArray.push(roundToTwoDecimals(nightlyPrice));
  }

  return pricesArray;
}

function calculateLowestNightlyPrice(nightlyPrices: (number | null)[]): number | null {
  const validPrices = nightlyPrices.filter(
    (price): price is number => price !== null && price !== undefined && !isNaN(price)
  );

  if (validPrices.length === 0) {
    return null;
  }

  return roundToTwoDecimals(Math.min(...validPrices));
}

function calculateSlope(nightlyPrices: (number | null)[]): number | null {
  let firstValidIndex = -1;
  let lastValidIndex = -1;
  let firstPrice: number | null = null;
  let lastPrice: number | null = null;

  for (let i = 0; i < nightlyPrices.length; i++) {
    const price = nightlyPrices[i];
    if (price !== null && price !== undefined && !isNaN(price)) {
      if (firstValidIndex === -1) {
        firstValidIndex = i;
        firstPrice = price;
      }
      lastValidIndex = i;
      lastPrice = price;
    }
  }

  if (firstValidIndex === -1 || firstPrice === null || lastPrice === null) {
    return null;
  }

  if (firstValidIndex === lastValidIndex) {
    return 0;
  }

  const indexDifference = lastValidIndex - firstValidIndex;
  const priceDifference = firstPrice - lastPrice;
  const slope = priceDifference / indexDifference;

  return roundToFourDecimals(slope);
}

// ─────────────────────────────────────────────────────────────
// Main Calculator
// ─────────────────────────────────────────────────────────────

/**
 * Calculate complete pricing list data from a listing.
 */
export function calculatePricingList({
  listing,
  unitMarkup = PRICING_CONSTANTS.DEFAULT_UNIT_MARKUP,
}: CalculatePricingParams): PricingListData {
  // Step 1: Extract host compensation
  const hostCompensation = calculateHostCompensationArray(listing);

  // Step 2: Calculate combined markup
  const combinedMarkup = calculateCombinedMarkup(
    unitMarkup,
    PRICING_CONSTANTS.SITE_MARKUP_RATE
  );

  // Step 3: Calculate unused nights discount
  const unusedNightsDiscount = calculateUnusedNightsDiscountArray();

  // Step 4: Calculate multipliers
  const markupAndDiscountMultiplier = calculateMarkupAndDiscountMultipliersArray(
    combinedMarkup,
    unusedNightsDiscount,
    PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE
  );

  // Step 5: Calculate nightly prices
  const nightlyPrice = calculateNightlyPricesArray(
    hostCompensation,
    markupAndDiscountMultiplier
  );

  // Step 6: Calculate derived scalars
  const startingNightlyPrice = calculateLowestNightlyPrice(nightlyPrice);
  const slope = calculateSlope(nightlyPrice);

  return {
    hostCompensation,
    markupAndDiscountMultiplier,
    nightlyPrice,
    unusedNightsDiscount,
    unitMarkup,
    overallSiteMarkup: PRICING_CONSTANTS.SITE_MARKUP_RATE,
    combinedMarkup,
    fullTimeDiscount: PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE,
    startingNightlyPrice,
    slope,
  };
}
