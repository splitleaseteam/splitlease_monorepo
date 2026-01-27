/**
 * Calculate average weekly price for monthly listings.
 *
 * @intent Convert monthly nightly rate to weekly equivalent.
 * @rule avgWeeklyPrice = monthlyAvgNightly * 7
 *
 * @param {object} params - Named parameters.
 * @param {number} params.monthlyAvgNightly - Monthly average nightly rate
 * @returns {number} Average weekly price
 *
 * @throws {Error} If required parameters are missing or invalid.
 */
export function calculateAverageWeeklyPrice({ monthlyAvgNightly }) {
  if (typeof monthlyAvgNightly !== 'number' || isNaN(monthlyAvgNightly)) {
    throw new Error(
      `calculateAverageWeeklyPrice: monthlyAvgNightly must be a number, got ${typeof monthlyAvgNightly}`
    );
  }

  return roundToTwoDecimals(monthlyAvgNightly * 7);
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}
