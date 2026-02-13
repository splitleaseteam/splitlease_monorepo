/**
 * Calculation utilities for Proposal Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Implements compensation and pricing calculations from Bubble Steps 13-18
 */

import {
  CompensationResult,
  RentalType,
  ReservationSpan,
} from "./types.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Calculate compensation based on rental type and duration
 * Mirrors Bubble workflow CORE-create_proposal-NEW Steps 13-18
 *
 * IMPORTANT: host_compensation in Bubble is the HOST'S per-night rate (from listing's
 * pricing tiers like "💰Nightly Host Rate for X nights"), NOT the guest-facing price.
 * The Total Compensation is then calculated as:
 *   - Nightly: host_nightly_rate * nights_per_week * total_weeks
 *   - Weekly: weekly_rate * total_weeks
 *   - Monthly: monthly_rate * months
 *
 * @param rentalType - Type of rental (nightly, weekly, monthly)
 * @param reservationSpan - Duration category (1_week, 1_month, etc.)
 * @param nightsPerWeek - Number of nights per week
 * @param weeklyRate - Host's weekly rate from listing (💰Weekly Host Rate)
 * @param hostNightlyRate - Host's per-night rate from listing pricing tiers
 * @param weeks - Total number of weeks for reservation
 * @param monthlyRate - Host's monthly rate from listing (💰Monthly Host Rate), optional
 * @returns Compensation calculation result
 */
export function calculateCompensation(
  rentalType: RentalType,
  reservationSpan: ReservationSpan,
  nightsPerWeek: number,
  weeklyRate: number,
  hostNightlyRate: number,
  weeks: number,
  monthlyRate: number | undefined,
  avgDaysPerMonth: number
): CompensationResult {
  let totalCompensation = 0;
  let durationMonths = 0;
  let fourWeekRent = 0;
  let fourWeekCompensation = 0;

  // Host compensation per period - the value depends on rental type:
  // - nightly: per-night rate from listing pricing tiers
  // - weekly: weekly rate from listing
  // - monthly: monthly rate from listing
  // This is stored in the "host compensation" field in the proposal
  let hostCompensationPerPeriod = hostNightlyRate;

  switch (rentalType) {
    case "nightly":
      // Step 13: Nightly calculation
      // Total = host_nightly_rate * nights_per_week * total_weeks
      // This matches Bubble: "host compensation * nights selected:count * actual weeks"
      hostCompensationPerPeriod = hostNightlyRate;
      totalCompensation = hostNightlyRate * nightsPerWeek * weeks;
      fourWeekRent = hostNightlyRate * nightsPerWeek * 4;
      fourWeekCompensation = fourWeekRent;
      durationMonths = calculateDurationMonths(
        reservationSpan,
        weeks,
        avgDaysPerMonth
      );
      break;

    case "weekly": {
      // Step 14: Weekly calculation
      // Total = weekly_rate * total_weeks
      // Host compensation is the per-week rate
      const effectiveWeeks = Math.ceil(weeks);
      hostCompensationPerPeriod = weeklyRate;
      totalCompensation = weeklyRate * effectiveWeeks;
      fourWeekRent = weeklyRate * 4;
      fourWeekCompensation = fourWeekRent;
      durationMonths = calculateDurationMonths(
        reservationSpan,
        weeks,
        avgDaysPerMonth
      );
      break;
    }

    case "monthly": {
      // Monthly uses the monthly rate directly
      // Host compensation is the per-month rate
      const effectiveMonthlyRate = monthlyRate || (weeklyRate * 4);
      hostCompensationPerPeriod = effectiveMonthlyRate;
      // Step 15-16: Monthly (standard span vs other)
      durationMonths = calculateDurationMonths(
        reservationSpan,
        weeks,
        avgDaysPerMonth
      );
      totalCompensation = effectiveMonthlyRate * durationMonths;
      fourWeekRent = effectiveMonthlyRate;
      fourWeekCompensation = fourWeekRent;
      break;
    }

    default:
      // Default to nightly if unknown type
      console.warn(
        `[calculations] Unknown rental type "${rentalType}", defaulting to nightly`
      );
      hostCompensationPerPeriod = hostNightlyRate;
      totalCompensation = hostNightlyRate * nightsPerWeek * weeks;
      fourWeekRent = hostNightlyRate * nightsPerWeek * 4;
      fourWeekCompensation = fourWeekRent;
      durationMonths = calculateDurationMonths(
        reservationSpan,
        weeks,
        avgDaysPerMonth
      );
  }

  return {
    total_compensation: roundToTwoDecimals(totalCompensation),
    duration_months: roundToTwoDecimals(durationMonths),
    four_week_rent: roundToTwoDecimals(fourWeekRent),
    four_week_compensation: roundToTwoDecimals(fourWeekCompensation),
    host_compensation_per_night: roundToTwoDecimals(hostCompensationPerPeriod),
  };
}

export interface PricingListRates {
  hostCompensationPerNight: number;
  guestNightlyPrice: number;
}

export interface PricingListRecord {
  nightly_price?: unknown;
  host_compensation?: unknown;
}

export function getPricingListRates(
  pricingList: PricingListRecord,
  nightsPerWeek: number
): PricingListRates | null {
  if (!pricingList || nightsPerWeek < 1) {
    return null;
  }

  const nightlyPriceArray = normalizePricingArray(pricingList.nightly_price);
  const hostCompArray = normalizePricingArray(pricingList.host_compensation);

  const index = nightsPerWeek - 1;
  const guestNightlyPrice = nightlyPriceArray?.[index];
  const hostCompensationPerNight = hostCompArray?.[index];

  if (!isFiniteNumber(guestNightlyPrice) || !isFiniteNumber(hostCompensationPerNight)) {
    return null;
  }

  return {
    guestNightlyPrice: guestNightlyPrice as number,
    hostCompensationPerNight: hostCompensationPerNight as number,
  };
}

export async function fetchAvgDaysPerMonth(
  supabase: SupabaseClient
): Promise<number> {
  const { data, error } = await supabase
    .schema("reference_table")
    .from("zat_priceconfiguration")
    .select('avg_days_per_month')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch avg_days_per_month: ${error.message}`);
  }

  const avgDays = Number(data?.avg_days_per_month);
  if (!isFiniteNumber(avgDays) || avgDays <= 0) {
    throw new Error("Invalid avg_days_per_month configuration");
  }

  return avgDays;
}

/**
 * Calculate move-out date based on move-in and duration
 * Formula from Bubble Step 1:
 * Move-out = move_in_start + days: (reservation_span_weeks - 1) * 7 + nights_count
 *
 * @param moveInStart - Move-in start date
 * @param reservationSpanWeeks - Number of weeks
 * @param nightsCount - Number of nights per week
 * @returns Calculated move-out date
 */
export function calculateMoveOutDate(
  moveInStart: Date,
  reservationSpanWeeks: number,
  nightsCount: number
): Date {
  const daysToAdd = (reservationSpanWeeks - 1) * 7 + nightsCount;
  const moveOut = new Date(moveInStart);
  moveOut.setDate(moveOut.getDate() + daysToAdd);
  return moveOut;
}

/**
 * Calculate complementary nights (nights available but not selected)
 * Mirrors Bubble Step 4
 *
 * @param availableNights - All nights available on the listing
 * @param selectedNights - Nights selected by the guest
 * @returns Array of complementary night indices
 */
export function calculateComplementaryNights(
  availableNights: number[],
  selectedNights: number[]
): number[] {
  if (!availableNights || !Array.isArray(availableNights)) return [];
  if (!selectedNights || !Array.isArray(selectedNights)) return availableNights;

  return availableNights.filter((night) => !selectedNights.includes(night));
}

/**
 * Calculate complementary days (days available but not selected)
 *
 * @param availableDays - All days available on the listing
 * @param selectedDays - Days selected by the guest
 * @returns Array of complementary day indices
 */
export function calculateComplementaryDays(
  availableDays: number[],
  selectedDays: number[]
): number[] {
  if (!availableDays || !Array.isArray(availableDays)) return [];
  if (!selectedDays || !Array.isArray(selectedDays)) return availableDays;

  return availableDays.filter((day) => !selectedDays.includes(day));
}

/**
 * Calculate order ranking for new proposal
 * Order ranking = existing proposals count + 1
 *
 * @param existingProposalsCount - Current number of proposals for the guest
 * @returns Order ranking for the new proposal
 */
export function calculateOrderRanking(existingProposalsCount: number): number {
  return (existingProposalsCount || 0) + 1;
}

/**
 * Calculate total guest price including fees
 *
 * @param basePrice - Base price (total compensation)
 * @param cleaningFee - Cleaning/maintenance fee
 * @param damageDeposit - Damage deposit (optional, may be separate)
 * @returns Total price for guest
 */
export function calculateTotalGuestPrice(
  basePrice: number,
  cleaningFee: number,
  _damageDeposit: number // Prefixed with _ to indicate intentionally unused
): number {
  // Note: Damage deposit is typically tracked separately and refundable
  // It may or may not be included in "total price" depending on context
  return roundToTwoDecimals(basePrice + (cleaningFee || 0));
}

/**
 * Get nightly rate based on number of nights
 * Listings have different rates for different night counts
 *
 * Uses DB column names from the listing table:
 * - nightly_rate_for_X_night_stay (per-night host rate)
 * - weekly_rate_paid_to_host (weekly fallback)
 *
 * @param listing - Listing data with pricing tiers
 * @param nightsPerWeek - Number of nights per week
 * @returns Appropriate nightly rate
 */
export function getNightlyRateForNights(
  listing: {
    nightly_rate_for_1_night_stay?: number;
    nightly_rate_for_2_night_stay?: number;
    nightly_rate_for_3_night_stay?: number;
    nightly_rate_for_4_night_stay?: number;
    nightly_rate_for_5_night_stay?: number;
    nightly_rate_for_7_night_stay?: number;
    weekly_rate_paid_to_host?: number;
  },
  nightsPerWeek: number
): number {
  const rateMap: Record<number, number | undefined> = {
    1: listing.nightly_rate_for_1_night_stay,
    2: listing.nightly_rate_for_2_night_stay,
    3: listing.nightly_rate_for_3_night_stay,
    4: listing.nightly_rate_for_4_night_stay,
    5: listing.nightly_rate_for_5_night_stay,
    7: listing.nightly_rate_for_7_night_stay,
  };

  // Try exact match first
  if (rateMap[nightsPerWeek] !== undefined && rateMap[nightsPerWeek] !== null && rateMap[nightsPerWeek]! > 0) {
    return rateMap[nightsPerWeek]!;
  }

  // For 6 nights without explicit rate, fall back to 7-night rate
  if (nightsPerWeek === 6 && rateMap[7] && rateMap[7]! > 0) {
    return rateMap[7]!;
  }

  // Fallback to weekly rate divided by nights, or 0
  const weeklyRate = listing.weekly_rate_paid_to_host;
  if (weeklyRate && weeklyRate > 0 && nightsPerWeek > 0) {
    return roundToTwoDecimals(weeklyRate / nightsPerWeek);
  }

  return 0;
}

/**
 * Format price for display (e.g., $1,029)
 *
 * @param price - Price value
 * @returns Formatted price string
 */
export function formatPriceForDisplay(price: number): string {
  return `$${Math.round(price).toLocaleString("en-US")}`;
}

/**
 * Format price range for display (e.g., "$75 - $100")
 *
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @returns Formatted price range string
 */
export function formatPriceRangeForDisplay(
  minPrice: number,
  maxPrice: number
): string {
  if (minPrice === maxPrice) {
    return formatPriceForDisplay(minPrice);
  }
  return `${formatPriceForDisplay(minPrice)} - ${formatPriceForDisplay(maxPrice)}`;
}

/**
 * Round number to two decimal places
 * Prevents floating point precision issues
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateDurationMonths(
  reservationSpan: ReservationSpan,
  weeks: number,
  avgDaysPerMonth: number
): number {
  if (reservationSpan === "other") {
    return (weeks * 7) / avgDaysPerMonth;
  }

  const monthsBySpan: Record<ReservationSpan, number> = {
    "1_week": 0.25,
    "2_weeks": 0.5,
    "1_month": 1,
    "2_months": 2,
    "3_months": 3,
    "6_months": 6,
    "1_year": 12,
    "other": 0,
  };

  return monthsBySpan[reservationSpan] ?? (weeks / 4);
}

function normalizePricingArray(value: unknown): (number | null)[] | null {
  if (Array.isArray(value)) {
    return value.map((item) => normalizePricingValue(item));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalizePricingValue(item));
      }
    } catch (_error) {
      return null;
    }
  }

  return null;
}

function normalizePricingValue(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const num = Number(value);
  return isFiniteNumber(num) ? num : null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Calculate actual weeks between two dates
 * Useful for verifying reservation span
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of weeks (can be fractional)
 */
export function calculateWeeksBetweenDates(
  startDate: Date,
  endDate: Date
): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return roundToTwoDecimals(diffDays / 7);
}

/**
 * Get actual active weeks during a 4-week period based on "Weeks offered" pattern.
 * Used for calculating total reservation prices and compensation.
 *
 * - "Every week": 4 active weeks per 4-week period
 * - "1 on 1 off": 2 active weeks per 4-week period
 * - "2 on 2 off": 2 active weeks per 4-week period
 * - "1 on 3 off": 1 active week per 4-week period
 *
 * @param weeksOffered - The weeks offered pattern from listing
 * @returns Number of active weeks in a 4-week period (1, 2, or 4)
 */
export function getActualWeeksDuring4Week(weeksOffered: string | null | undefined): number {
  const pattern = (weeksOffered || "every week").toLowerCase();

  // 1 on 1 off: 2 active weeks per 4-week period
  if (
    pattern.includes("1 on 1 off") ||
    pattern.includes("1on1off") ||
    (pattern.includes("one week on") && pattern.includes("one week off")) ||
    (pattern.includes("1 week on") && pattern.includes("1 week off"))
  ) {
    return 2;
  }

  // 2 on 2 off: 2 active weeks per 4-week period
  if (
    pattern.includes("2 on 2 off") ||
    pattern.includes("2on2off") ||
    (pattern.includes("two week") && pattern.includes("two week")) ||
    (pattern.includes("2 week on") && pattern.includes("2 week off"))
  ) {
    return 2;
  }

  // 1 on 3 off: 1 active week per 4-week period
  if (
    pattern.includes("1 on 3 off") ||
    pattern.includes("1on3off") ||
    (pattern.includes("one week on") && pattern.includes("three week")) ||
    (pattern.includes("1 week on") && pattern.includes("3 week off"))
  ) {
    return 1;
  }

  // Default: "Every week" - 4 active weeks per 4-week period
  return 4;
}

/**
 * Calculate the actual number of active weeks during a reservation span.
 * Accounts for alternating week patterns (1on1off, 2on2off, etc.)
 *
 * @param reservationSpanWeeks - Total calendar weeks in the reservation
 * @param weeksOffered - The weeks offered pattern from listing
 * @returns Number of active weeks the guest actually stays
 */
export function calculateActualActiveWeeks(
  reservationSpanWeeks: number,
  weeksOffered: string | null | undefined
): number {
  const activeWeeksPer4Week = getActualWeeksDuring4Week(weeksOffered);
  const fourWeekPeriods = reservationSpanWeeks / 4;
  return Math.ceil(activeWeeksPer4Week * fourWeekPeriods);
}

/**
 * Get weekly schedule period divisor based on "Weeks offered" pattern.
 * Used to calculate 4-week rent/compensation accurately.
 *
 * The divisor represents how many active weeks occur in a 4-week period:
 * - "Every week": 4 active weeks in 4 calendar weeks -> divisor = 1
 * - "1 on 1 off": 2 active weeks in 4 calendar weeks -> divisor = 2
 * - "2 on 2 off": 2 active weeks in 4 calendar weeks -> divisor = 2
 * - "1 on 3 off": 1 active week in 4 calendar weeks -> divisor = 4
 *
 * Formula: fourWeekRent = (pricePerNight * nights * 4) / divisor
 *
 * @param weeksOffered - The weeks offered pattern from listing
 * @returns Divisor for 4-week calculations (1, 2, or 4)
 */
export function getWeeklySchedulePeriod(weeksOffered: string | null | undefined): number {
  const pattern = (weeksOffered || "every week").toLowerCase();

  // 1 on 1 off: 2 active weeks per 4-week period
  if (
    pattern.includes("1 on 1 off") ||
    pattern.includes("1on1off") ||
    (pattern.includes("one week on") && pattern.includes("one week off")) ||
    (pattern.includes("1 week on") && pattern.includes("1 week off"))
  ) {
    return 2;
  }

  // 2 on 2 off: 2 active weeks per 4-week period
  if (
    pattern.includes("2 on 2 off") ||
    pattern.includes("2on2off") ||
    (pattern.includes("two week") && pattern.includes("two week")) ||
    (pattern.includes("2 week on") && pattern.includes("2 week off"))
  ) {
    return 2;
  }

  // 1 on 3 off: 1 active week per 4-week period
  if (
    pattern.includes("1 on 3 off") ||
    pattern.includes("1on3off") ||
    (pattern.includes("one week on") && pattern.includes("three week")) ||
    (pattern.includes("1 week on") && pattern.includes("3 week off"))
  ) {
    return 4;
  }

  // Default: "Every week" - 4 active weeks per 4-week period
  return 1;
}
