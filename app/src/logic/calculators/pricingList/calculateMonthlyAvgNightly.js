/**
 * Calculate monthly average nightly rate.
 *
 * @intent Convert monthly host rate to daily equivalent for pricing.
 * @rule monthlyAvgNightly = monthlyHostRate / avgDaysPerMonth
 *
 * @param {object} params - Named parameters.
 * @param {number} params.monthlyHostRate - Monthly host rate
 * @param {number} params.avgDaysPerMonth - Average days per month (typically ~30.4)
 * @returns {number} Average nightly rate
 *
 * @throws {Error} If required parameters are missing or invalid.
 */
export function calculateMonthlyAvgNightly({ monthlyHostRate, avgDaysPerMonth }) {
  if (typeof monthlyHostRate !== 'number' || isNaN(monthlyHostRate)) {
    throw new Error(
      `calculateMonthlyAvgNightly: monthlyHostRate must be a number, got ${typeof monthlyHostRate}`
    );
  }

  if (typeof avgDaysPerMonth !== 'number' || avgDaysPerMonth <= 0) {
    throw new Error(
      `calculateMonthlyAvgNightly: avgDaysPerMonth must be positive, got ${avgDaysPerMonth}`
    );
  }

  return roundToTwoDecimals(monthlyHostRate / avgDaysPerMonth);
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}
