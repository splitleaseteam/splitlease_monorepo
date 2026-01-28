/**
 * Calculate prorated nightly rate based on rental type.
 *
 * @intent Convert host compensation to per-night rate for price display.
 * @rule Weekly: weeklyHostRate / selectedNights
 * @rule Monthly: (monthlyHostRate / avgDaysPerMonth) * 7 / selectedNights
 * @rule Nightly: Use specific night rate from host rates array
 *
 * @param {object} params - Named parameters.
 * @param {string} params.rentalType - 'Monthly', 'Weekly', or 'Nightly'
 * @param {number} params.selectedNights - Number of nights selected (1-7)
 * @param {number} params.weeklyHostRate - Weekly host rate
 * @param {number} params.monthlyHostRate - Monthly host rate
 * @param {number} params.avgDaysPerMonth - Average days per month (from ZAT config)
 * @param {Array<number|null>} params.nightlyRates - 7-element array of nightly host rates [2night, 3night, 4night, 5night, 6night, 7night, weekly]
 * @returns {number} Prorated nightly rate
 *
 * @throws {Error} If required parameters are missing or invalid.
 */
export function calculateProratedNightlyRate({
  rentalType,
  selectedNights,
  weeklyHostRate,
  monthlyHostRate,
  avgDaysPerMonth,
  nightlyRates
}) {
  if (typeof selectedNights !== 'number' || selectedNights < 1 || selectedNights > 7) {
    throw new Error(
      `calculateProratedNightlyRate: selectedNights must be 1-7, got ${selectedNights}`
    );
  }

  switch (rentalType) {
    case 'Weekly': {
      if (typeof weeklyHostRate !== 'number' || isNaN(weeklyHostRate)) {
        throw new Error('calculateProratedNightlyRate: weeklyHostRate required for Weekly rental');
      }
      return roundToTwoDecimals(weeklyHostRate / selectedNights);
    }

    case 'Monthly': {
      if (typeof monthlyHostRate !== 'number' || isNaN(monthlyHostRate)) {
        throw new Error('calculateProratedNightlyRate: monthlyHostRate required for Monthly rental');
      }
      if (typeof avgDaysPerMonth !== 'number' || avgDaysPerMonth <= 0) {
        throw new Error('calculateProratedNightlyRate: avgDaysPerMonth must be positive');
      }
      const monthlyAvgNightly = monthlyHostRate / avgDaysPerMonth;
      const avgWeeklyPrice = monthlyAvgNightly * 7;
      return roundToTwoDecimals(avgWeeklyPrice / selectedNights);
    }

    case 'Nightly': {
      if (!Array.isArray(nightlyRates) || nightlyRates.length < 4) {
        throw new Error('calculateProratedNightlyRate: nightlyRates must be array with at least 4 elements');
      }
      // Nightly rates array is indexed by night count: [2-night, 3-night, 4-night, 5-night, ...]
      // So for selectedNights=2, use index 0; for selectedNights=3, use index 1, etc.
      const rateIndex = selectedNights - 2;
      if (rateIndex < 0 || rateIndex >= nightlyRates.length) {
        throw new Error(`calculateProratedNightlyRate: No rate for ${selectedNights} nights`);
      }
      const rate = nightlyRates[rateIndex];
      if (rate === null || rate === undefined) {
        throw new Error(`calculateProratedNightlyRate: Rate for ${selectedNights} nights is null`);
      }
      return roundToTwoDecimals(rate);
    }

    default:
      throw new Error(`calculateProratedNightlyRate: Unknown rentalType "${rentalType}"`);
  }
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}
