/**
 * Calculate host payment schedule
 * Ported from: supabase/functions/host-payment-records/lib/calculations.ts
 *
 * KEY RULES:
 * - First payment: 2 days AFTER move-in
 * - Monthly rentals: 31-day intervals
 * - Nightly/Weekly: 28-day (4-week) intervals
 *
 * @module logic/calculators/payments/calculateHostPaymentSchedule
 */

/**
 * Valid rental types
 * @type {string[]}
 */
const VALID_RENTAL_TYPES = ['Nightly', 'Weekly', 'Monthly'];

/**
 * Valid week patterns
 * @type {string[]}
 */
const VALID_WEEK_PATTERNS = [
  'Every week',
  'One week on, one week off',
  'Two weeks on, two weeks off',
  'One week on, three weeks off',
];

/**
 * Format a date as mm-dd-yyyy string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

/**
 * Parse a date string handling multiple formats
 * @param {string} dateStr - Date string to parse
 * @returns {Date} Parsed date object
 */
function parseDate(dateStr) {
  if (!dateStr) {
    throw new Error('moveInDate is required');
  }

  let normalizedDate = dateStr;

  // Handle m/dd/yy or mm/dd/yyyy format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      let year = parts[2];

      // Handle 2-digit year (assume 21st century)
      if (year.length === 2) {
        year = '20' + year;
      }

      normalizedDate = `${year}-${month}-${day}`;
    }
  }

  const parsed = new Date(normalizedDate);

  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  return parsed;
}

/**
 * Round a number to 2 decimal places
 * @param {number} value - Value to round
 * @returns {number} Rounded value
 */
function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate the number of payment cycles based on rental type and duration
 * @param {string} rentalType - Rental type
 * @param {number|undefined} reservationSpanWeeks - Duration in weeks
 * @param {number|undefined} reservationSpanMonths - Duration in months
 * @returns {number} Number of payment cycles
 */
function calculateNumberOfPaymentCycles(rentalType, reservationSpanWeeks, reservationSpanMonths) {
  if (rentalType === 'Monthly') {
    if (!reservationSpanMonths || reservationSpanMonths <= 0) {
      throw new Error('reservationSpanMonths is required for Monthly rental type');
    }
    return Number.isInteger(reservationSpanMonths)
      ? reservationSpanMonths
      : Math.ceil(reservationSpanMonths);
  }

  // Nightly or Weekly
  if (!reservationSpanWeeks || reservationSpanWeeks <= 0) {
    throw new Error('reservationSpanWeeks is required for Nightly and Weekly rental types');
  }
  return Math.ceil(reservationSpanWeeks / 4);
}

/**
 * Calculate remaining weeks for non-Monthly rentals
 * @param {string} rentalType - Rental type
 * @param {number|undefined} reservationSpanWeeks - Duration in weeks
 * @returns {number} Remaining weeks
 */
function calculateRemainingWeeks(rentalType, reservationSpanWeeks) {
  if (rentalType === 'Monthly') {
    return 0;
  }
  return (reservationSpanWeeks || 0) % 4;
}

/**
 * Generate the sequence of payment dates for host payments
 * First payment: moveInDate + 2 days (2 days AFTER move-in)
 * @param {Date} moveInDate - Move-in date
 * @param {number} numberOfPaymentCycles - Number of payment cycles
 * @param {string} rentalType - Rental type
 * @returns {string[]} Array of payment dates
 */
function generatePaymentDates(moveInDate, numberOfPaymentCycles, rentalType) {
  const paymentDates = [];

  // First host compensation is 2 days after move-in
  const firstPaymentDate = new Date(moveInDate);
  firstPaymentDate.setDate(moveInDate.getDate() + 2);

  const currentDate = new Date(firstPaymentDate);

  for (let i = 0; i < numberOfPaymentCycles; i++) {
    paymentDates.push(formatDate(currentDate));

    // Increment for next payment
    const daysToAdd = rentalType === 'Monthly' ? 31 : 28;
    currentDate.setDate(currentDate.getDate() + daysToAdd);
  }

  return paymentDates;
}

/**
 * Calculate rent for the last payment cycle based on rental type and pattern
 * @param {string} rentalType - Rental type
 * @param {number} baseRent - Base rent amount
 * @param {number} remainingWeeks - Remaining weeks
 * @param {string} weekPattern - Week pattern
 * @param {number|undefined} reservationSpanMonths - Duration in months
 * @returns {number} Last cycle rent
 */
function calculateLastCycleRent(rentalType, baseRent, remainingWeeks, weekPattern, reservationSpanMonths) {
  if (rentalType === 'Monthly') {
    // Partial month calculation
    if (reservationSpanMonths && !Number.isInteger(reservationSpanMonths)) {
      const fraction = reservationSpanMonths - Math.floor(reservationSpanMonths);
      return baseRent * fraction;
    }
    return baseRent;
  }

  // No remaining weeks = full payment
  if (remainingWeeks === 0) {
    return baseRent;
  }

  if (rentalType === 'Nightly') {
    // Nightly: simple proration
    return baseRent * (remainingWeeks / 4);
  }

  // Weekly: depends on week pattern
  switch (weekPattern) {
    case 'Every week':
      return baseRent * (remainingWeeks / 4);

    case 'One week on, one week off':
      // If 2 or fewer remaining weeks, half payment
      return remainingWeeks <= 2 ? baseRent * 0.5 : baseRent;

    case 'Two weeks on, two weeks off':
      // If only 1 remaining week, half payment
      return remainingWeeks === 1 ? baseRent * 0.5 : baseRent;

    case 'One week on, three weeks off':
      // No proration for this pattern
      return baseRent;

    default:
      return baseRent;
  }
}

/**
 * Calculate the rent list for all payment cycles
 * @param {number} numberOfPaymentCycles - Number of payment cycles
 * @param {number} baseRent - Base rent amount
 * @param {string} rentalType - Rental type
 * @param {number} remainingWeeks - Remaining weeks
 * @param {string} weekPattern - Week pattern
 * @param {number|undefined} reservationSpanMonths - Duration in months
 * @returns {number[]} Array of rent amounts
 */
function calculateRentList(numberOfPaymentCycles, baseRent, rentalType, remainingWeeks, weekPattern, reservationSpanMonths) {
  const rentList = [];

  for (let i = 0; i < numberOfPaymentCycles; i++) {
    let cycleRent = baseRent;

    // Handle last payment cycle specially
    if (i === numberOfPaymentCycles - 1) {
      cycleRent = calculateLastCycleRent(
        rentalType,
        baseRent,
        remainingWeeks,
        weekPattern,
        reservationSpanMonths
      );
    }

    // Ensure valid number and round
    cycleRent = isNaN(cycleRent) ? 0 : cycleRent;
    cycleRent = roundToTwoDecimals(cycleRent);

    rentList.push(cycleRent);
  }

  return rentList;
}

/**
 * Calculate total rent list by adding maintenance fee to each payment
 * @param {number[]} rentList - Array of rent amounts
 * @param {number} maintenanceFee - Maintenance fee per period
 * @returns {number[]} Array of total amounts
 */
function calculateTotalRentList(rentList, maintenanceFee) {
  return rentList.map((rent) => {
    const total = rent + maintenanceFee;
    return roundToTwoDecimals(total);
  });
}

/**
 * Calculate complete host payment schedule
 *
 * @param {Object} params - Calculation parameters
 * @param {string} params.rentalType - 'Nightly', 'Weekly', or 'Monthly'
 * @param {string} params.moveInDate - Move-in date string
 * @param {number} [params.reservationSpanWeeks] - Duration in weeks (for Nightly/Weekly)
 * @param {number} [params.reservationSpanMonths] - Duration in months (for Monthly)
 * @param {string} params.weekPattern - Week pattern
 * @param {number} [params.fourWeekRent] - 4-week rent (for Nightly/Weekly)
 * @param {number} [params.rentPerMonth] - Monthly rent (for Monthly)
 * @param {number} params.maintenanceFee - Maintenance fee per period
 * @returns {Object} Payment schedule result
 * @returns {string[]} result.paymentDates - Array of payment dates (mm-dd-yyyy)
 * @returns {number[]} result.rentList - Array of rent amounts
 * @returns {number[]} result.totalRentList - Array of total amounts
 * @returns {number} result.totalCompensationAmount - Total compensation amount
 * @returns {number} result.numberOfPaymentCycles - Number of payment cycles
 */
export function calculateHostPaymentSchedule({
  rentalType,
  moveInDate: moveInDateStr,
  reservationSpanWeeks,
  reservationSpanMonths,
  weekPattern,
  fourWeekRent,
  rentPerMonth,
  maintenanceFee
}) {
  // Validate rental type
  if (!VALID_RENTAL_TYPES.includes(rentalType)) {
    throw new Error("rentalType is required and must be one of: 'Nightly', 'Weekly', 'Monthly'");
  }

  // Validate week pattern
  if (!VALID_WEEK_PATTERNS.includes(weekPattern)) {
    throw new Error(
      "weekPattern is required and must be one of: 'Every week', 'One week on, one week off', 'Two weeks on, two weeks off', 'One week on, three weeks off'"
    );
  }

  // Validate rent amounts
  if ((rentalType === 'Nightly' || rentalType === 'Weekly') && (!fourWeekRent || fourWeekRent <= 0)) {
    throw new Error('fourWeekRent is required for Nightly and Weekly rental types and must be a positive number');
  }

  if (rentalType === 'Monthly' && (!rentPerMonth || rentPerMonth <= 0)) {
    throw new Error('rentPerMonth is required for Monthly rental type and must be a positive number');
  }

  // Validate maintenance fee
  if (isNaN(maintenanceFee)) {
    throw new Error('maintenanceFee must be a number');
  }

  // Parse move-in date
  const moveInDate = parseDate(moveInDateStr);

  // Calculate number of payment cycles
  const numberOfPaymentCycles = calculateNumberOfPaymentCycles(
    rentalType,
    reservationSpanWeeks,
    reservationSpanMonths
  );

  // Calculate remaining weeks for partial period handling
  const remainingWeeks = calculateRemainingWeeks(rentalType, reservationSpanWeeks);

  // Generate payment dates
  const paymentDates = generatePaymentDates(moveInDate, numberOfPaymentCycles, rentalType);

  // Determine base rent
  const baseRent = rentalType === 'Monthly' ? rentPerMonth : fourWeekRent;

  // Calculate rent list
  const rentList = calculateRentList(
    numberOfPaymentCycles,
    baseRent,
    rentalType,
    remainingWeeks,
    weekPattern,
    reservationSpanMonths
  );

  // Calculate total rent list (including maintenance)
  const totalRentList = calculateTotalRentList(rentList, maintenanceFee);

  // Calculate total compensation amount
  const totalCompensationAmount = roundToTwoDecimals(
    totalRentList.reduce((sum, current) => sum + current, 0)
  );

  return {
    paymentDates,
    rentList,
    totalRentList,
    totalCompensationAmount,
    numberOfPaymentCycles,
  };
}

export default calculateHostPaymentSchedule;
