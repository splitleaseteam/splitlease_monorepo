/**
 * Calculate guest payment schedule
 * Ported from: supabase/functions/guest-payment-records/lib/calculations.ts
 *
 * KEY RULES:
 * - First payment: 3 days BEFORE move-in
 * - Monthly rentals: 31-day intervals
 * - Nightly/Weekly: 28-day (4-week) intervals
 * - Damage deposit added to first payment only
 *
 * @module logic/calculators/payments/calculateGuestPaymentSchedule
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
 * Generate the sequence of payment dates for guest payments
 * First payment: moveInDate - 3 days (3 days BEFORE move-in)
 * @param {Date} moveInDate - Move-in date
 * @param {number} numberOfPaymentCycles - Number of payment cycles
 * @param {string} rentalType - Rental type
 * @returns {string[]} Array of payment dates
 */
function generatePaymentDates(moveInDate, numberOfPaymentCycles, rentalType) {
  const paymentDates = [];

  // First guest payment is 3 days BEFORE move-in
  const firstPaymentDate = new Date(moveInDate);
  firstPaymentDate.setDate(moveInDate.getDate() - 3);

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
    if (reservationSpanMonths && !Number.isInteger(reservationSpanMonths)) {
      const fraction = reservationSpanMonths - Math.floor(reservationSpanMonths);
      return baseRent * fraction;
    }
    return baseRent;
  }

  if (remainingWeeks === 0) {
    return baseRent;
  }

  if (rentalType === 'Nightly') {
    return baseRent * (remainingWeeks / 4);
  }

  // Weekly: depends on week pattern
  switch (weekPattern) {
    case 'Every week':
      return baseRent * (remainingWeeks / 4);

    case 'One week on, one week off':
      return remainingWeeks <= 2 ? baseRent * 0.5 : baseRent;

    case 'Two weeks on, two weeks off':
      return remainingWeeks === 1 ? baseRent * 0.5 : baseRent;

    case 'One week on, three weeks off':
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

    if (i === numberOfPaymentCycles - 1) {
      cycleRent = calculateLastCycleRent(
        rentalType,
        baseRent,
        remainingWeeks,
        weekPattern,
        reservationSpanMonths
      );
    }

    cycleRent = isNaN(cycleRent) ? 0 : cycleRent;
    cycleRent = roundToTwoDecimals(cycleRent);

    rentList.push(cycleRent);
  }

  return rentList;
}

/**
 * Calculate total rent list for guest payments
 * Damage deposit is added ONLY to the FIRST payment
 * @param {number[]} rentList - Array of rent amounts
 * @param {number} maintenanceFee - Maintenance fee per period
 * @param {number} damageDeposit - Damage deposit amount
 * @returns {number[]} Array of total amounts
 */
function calculateTotalRentList(rentList, maintenanceFee, damageDeposit) {
  return rentList.map((rent, index) => {
    let total = rent + maintenanceFee;

    // Add damage deposit only to first payment
    if (index === 0 && damageDeposit > 0) {
      total += damageDeposit;
    }

    return roundToTwoDecimals(total);
  });
}

/**
 * Calculate complete guest payment schedule
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
 * @param {number} [params.damageDeposit=0] - Damage deposit amount
 * @returns {Object} Payment schedule result
 * @returns {string[]} result.paymentDates - Array of payment dates (mm-dd-yyyy)
 * @returns {number[]} result.rentList - Array of rent amounts
 * @returns {number[]} result.totalRentList - Array of total amounts
 * @returns {number} result.totalReservationPrice - Total price (excluding damage deposit)
 * @returns {number} result.numberOfPaymentCycles - Number of payment cycles
 */
export function calculateGuestPaymentSchedule({
  rentalType,
  moveInDate: moveInDateStr,
  reservationSpanWeeks,
  reservationSpanMonths,
  weekPattern,
  fourWeekRent,
  rentPerMonth,
  maintenanceFee,
  damageDeposit = 0
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

  // Generate payment dates (3 days BEFORE move-in for guest)
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

  // Calculate total rent list (including maintenance and damage deposit on first)
  const totalRentList = calculateTotalRentList(rentList, maintenanceFee, damageDeposit);

  // Calculate total reservation price
  // KEY: Subtract damage deposit because it's refundable (not actual rent)
  const totalReservationPrice = roundToTwoDecimals(
    totalRentList.reduce((sum, current) => sum + current, 0) - damageDeposit
  );

  return {
    paymentDates,
    rentList,
    totalRentList,
    totalReservationPrice,
    numberOfPaymentCycles,
  };
}

export default calculateGuestPaymentSchedule;
