/**
 * Price Calculation Utilities
 * Handles all pricing logic for view-split-lease page
 *
 * Usage:
 *   import { calculate4WeekRent, calculateReservationTotal } from './priceCalculations.js';
 */

// Re-export formatPrice from the canonical source for backward compatibility
export { formatPrice } from './formatters.js';

/**
 * Calculate 4-week rent based on nightly price and selected nights
 * Formula: nightly price Ã— nights per week Ã— 4 weeks
 * @param {number} nightlyPrice - Price per night
 * @param {number} nightsPerWeek - Number of nights selected per week
 * @returns {number} 4-week rent amount
 */
export function calculate4WeekRent(nightlyPrice, nightsPerWeek) {
  if (!nightlyPrice || !nightsPerWeek) return 0;
  return nightlyPrice * nightsPerWeek * 4;
}

/**
 * Calculate estimated reservation total
 * Formula: 4-week rent Ã— (total weeks / 4)
 * @param {number} fourWeekRent - 4-week rent amount
 * @param {number} totalWeeks - Total reservation span in weeks
 * @returns {number} Estimated total cost
 */
export function calculateReservationTotal(fourWeekRent, totalWeeks) {
  if (!fourWeekRent || !totalWeeks) return 0;
  return fourWeekRent * (totalWeeks / 4);
}

/**
 * Get nightly price based on number of nights selected
 * Matches Bubble logic for price field selection
 * @param {object} listing - Listing object with price fields
 * @param {number} nightsSelected - Number of nights per week (2-7)
 * @returns {number|null} Nightly price
 */
export function getNightlyPriceForNights(listing, nightsSelected) {
  if (!listing || !nightsSelected) return null;

  // Price override takes precedence
  if (listing['price_override']) {
    return listing['price_override'];
  }

  // Map nights to price fields
  const priceFieldMap = {
    1: 'nightly_rate_for_1_night_stay',
    2: 'nightly_rate_for_2_night_stay',
    3: 'nightly_rate_for_3_night_stay',
    4: 'nightly_rate_for_4_night_stay',
    5: 'nightly_rate_for_5_night_stay',
    7: 'nightly_rate_for_7_night_stay'
  };

  const fieldName = priceFieldMap[nightsSelected];
  if (fieldName && listing[fieldName]) {
    return listing[fieldName];
  }

  // Default to 4-night rate if available
  return listing.nightly_rate_for_4_night_stay || null;
}

/**
 * Calculate complete pricing breakdown
 * @param {object} listing - Listing object
 * @param {number} nightsPerWeek - Nights selected per week
 * @param {number} reservationWeeks - Total reservation span in weeks
 * @returns {object} Complete pricing breakdown including host compensation
 */
export function calculatePricingBreakdown(listing, nightsPerWeek, reservationWeeks) {
  const nightlyPrice = getNightlyPriceForNights(listing, nightsPerWeek);

  if (!nightlyPrice) {
    return {
      nightlyPrice: null,
      fourWeekRent: null,
      hostFourWeekCompensation: null,
      reservationTotal: null,
      hostTotalCompensation: null,
      cleaningFee: listing.cleaning_fee_amount || 0,
      damageDeposit: listing.damage_deposit_amount || 0,
      valid: false
    };
  }

  const fourWeekRent = calculate4WeekRent(nightlyPrice, nightsPerWeek);
  const reservationTotal = calculateReservationTotal(fourWeekRent, reservationWeeks);

  // Calculate host compensation (what host receives, without platform fee)
  const hostFourWeekCompensation = calculateHostFourWeekCompensation(listing, nightsPerWeek);
  const hostTotalCompensation = hostFourWeekCompensation * (reservationWeeks / 4);

  return {
    nightlyPrice,
    fourWeekRent,
    hostFourWeekCompensation,
    reservationTotal,
    hostTotalCompensation,
    cleaningFee: listing.cleaning_fee_amount || 0,
    damageDeposit: listing.damage_deposit_amount || 0,
    grandTotal: reservationTotal + (listing.cleaning_fee_amount || 0),
    valid: true
  };
}

/**
 * Validate if enough days are selected for price calculation
 * @param {number} daysSelected - Number of days selected
 * @returns {boolean} True if valid for pricing
 */
export function isValidForPricing(daysSelected) {
  return daysSelected >= 2 && daysSelected <= 7;
}

/**
 * Get host nightly rate based on rental type and nights selected
 * Matches Bubble legacy calculation: G: Host Display Price / G: number to save 4 week compensation
 * @param {object} listing - Listing object with rental type and rate fields
 * @param {number} nightsSelected - Number of nights per week (1-7)
 * @returns {number|null} Host nightly rate
 */
export function getHostNightlyRate(listing, nightsSelected) {
  if (!listing || !nightsSelected) return null;

  const rentalType = listing.rental_type;

  // Nightly rental: use specific nightly host rate
  if (rentalType === 'Nightly') {
    const rateMap = {
      1: listing.nightly_rate_for_1_night_stay,
      2: listing.nightly_rate_for_2_night_stay,
      3: listing.nightly_rate_for_3_night_stay,
      4: listing.nightly_rate_for_4_night_stay,
      5: listing.nightly_rate_for_5_night_stay,
      // Note: 7 nights uses 5-night rate per Bubble logic
      7: listing.nightly_rate_for_5_night_stay
    };
    return rateMap[nightsSelected] || listing.nightly_rate_for_4_night_stay || null;
  }

  // Weekly rental: convert weekly rate to nightly
  if (rentalType === 'Weekly') {
    const weeklyRate = listing.weekly_rate_paid_to_host;
    if (!weeklyRate || !nightsSelected) return null;
    // Weekly rate divided by nights gives per-night host compensation
    return weeklyRate / nightsSelected;
  }

  // Monthly rental: convert monthly rate to nightly
  if (rentalType === 'Monthly') {
    const monthlyRate = listing.monthly_rate_paid_to_host;
    if (!monthlyRate || !nightsSelected) return null;
    // Monthly rate divided by avg days (30.4) gives daily, then scale for selected nights
    // Per Bubble: monthly listings use flat monthly_host_rate for 4-week compensation
    // So nightly = monthly_host_rate / (nightsSelected * 4)
    return monthlyRate / (nightsSelected * 4);
  }

  return null;
}

/**
 * Calculate host 4-week compensation
 * Matches Bubble legacy calculation: nightly_host_rate * nights * 4_weeks
 * @param {object} listing - Listing object with rental type and rate fields
 * @param {number} nightsPerWeek - Number of nights per week (1-7)
 * @returns {number} Host 4-week compensation amount
 */
export function calculateHostFourWeekCompensation(listing, nightsPerWeek) {
  if (!listing || !nightsPerWeek) return 0;

  const rentalType = listing.rental_type;

  // Monthly rental: flat monthly rate
  // Per Bubble: "Parent group's Listing's ðŸ’°Monthly Host Rate"
  if (rentalType === 'Monthly') {
    return listing.monthly_rate_paid_to_host || 0;
  }

  // Weekly rental: weekly rate * weeks in 4-week period
  // Per Bubble: "Weekly Host Rate * Weeks offered's num weeks during 4 calendar weeks"
  // For standard schedules, this is typically 4 weeks or 2 weeks (2on/2off)
  if (rentalType === 'Weekly') {
    const weeklyRate = listing.weekly_rate_paid_to_host || 0;
    // Default to 4 weeks if not specified
    const weeksIn4CalendarWeeks = listing['weeks_offered_num_weeks_during_4_calendar_weeks'] || 4;
    return weeklyRate * weeksIn4CalendarWeeks;
  }

  // Nightly rental: nightly_host_rate * nights * 4_weeks
  // Per Bubble formulas:
  // - 2 nights: rate * 8 (2 * 4)
  // - 3 nights: rate * 12 (3 * 4)
  // - 4 nights: rate * 16 (4 * 4)
  // - 5 nights: rate * 20 (5 * 4)
  // - 7 nights: rate_5_nights * 28 (7 * 4, but uses 5-night rate!)
  const rateMap = {
    1: listing.nightly_rate_for_1_night_stay,
    2: listing.nightly_rate_for_2_night_stay,
    3: listing.nightly_rate_for_3_night_stay,
    4: listing.nightly_rate_for_4_night_stay,
    5: listing.nightly_rate_for_5_night_stay,
    7: listing.nightly_rate_for_5_night_stay  // Special: 7 nights uses 5-night rate
  };

  const hostNightlyRate = rateMap[nightsPerWeek] || listing.nightly_rate_for_4_night_stay || 0;
  return hostNightlyRate * nightsPerWeek * 4;
}

/**
 * Get price display message based on selection state
 * @param {number|null} daysSelected - Number of days selected
 * @returns {string} Display message
 */
export function getPriceDisplayMessage(daysSelected) {
  if (!daysSelected || daysSelected < 2) {
    return 'Please Select More Days';
  }
  if (daysSelected > 7) {
    return 'Please Select 7 Days or Less';
  }
  return null; // Valid selection
}
