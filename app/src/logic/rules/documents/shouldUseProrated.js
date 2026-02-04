/**
 * Should Use Prorated Template Rule
 *
 * Determines if the prorated Credit Card Authorization template should be used.
 * This is based on comparing the first and last payment amounts.
 *
 * Business Rules:
 * - If last payment rent < first payment rent → use prorated template
 * - If payments are equal → use standard template
 * - Week pattern affects proration calculation but template selection is based on rent comparison
 *
 * @module logic/rules/documents/shouldUseProrated
 */

/**
 * Determine if prorated Credit Card Authorization template should be used
 *
 * @param {object} params - Parameters
 * @param {Array} params.guestPayments - Array of guest payment records (raw or transformed)
 * @returns {boolean} True if prorated template should be used
 */
export function shouldUseProrated({ guestPayments }) {
  if (!guestPayments || guestPayments.length <= 1) {
    // Single payment or no payments - no proration
    return false;
  }

  const firstPayment = guestPayments[0];
  const lastPayment = guestPayments[guestPayments.length - 1];

  // Handle both raw and transformed payment formats
  const firstRent = firstPayment['Rent'] ?? firstPayment.rentRaw ?? firstPayment.rent ?? 0;
  const lastRent = lastPayment['Rent'] ?? lastPayment.rentRaw ?? lastPayment.rent ?? 0;

  // Convert currency strings to numbers if needed
  const firstRentNum = typeof firstRent === 'string'
    ? parseFloat(firstRent.replace(/[^0-9.-]/g, ''))
    : firstRent;
  const lastRentNum = typeof lastRent === 'string'
    ? parseFloat(lastRent.replace(/[^0-9.-]/g, ''))
    : lastRent;

  // Prorated if last payment rent is less than first
  return lastRentNum < firstRentNum;
}

/**
 * Calculate proration details for Credit Card Authorization
 * Based on week pattern and reservation span
 *
 * @param {object} params - Parameters
 * @param {string} params.weekPattern - Week selection pattern
 * @param {number} params.reservationSpanWeeks - Total weeks in reservation
 * @param {number} params.fourWeekRent - 4-week rent amount
 * @returns {object} Proration details
 */
export function calculateProratedValues({ weekPattern, reservationSpanWeeks, fourWeekRent }) {
  const remainingWeeks = reservationSpanWeeks % 4;

  // Normalize week pattern
  const pattern = (weekPattern || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  let lastPaymentWeeks;
  let lastPaymentRent;
  let isProrated;

  switch (pattern) {
    case 'everyweek':
    case 'every':
      // Step 1: Linear proration
      lastPaymentWeeks = remainingWeeks === 0 ? 4 : remainingWeeks;
      lastPaymentRent = (lastPaymentWeeks / 4) * fourWeekRent;
      isProrated = remainingWeeks !== 0;
      break;

    case 'oneweekononeweekoff':
    case 'oneononoff':
    case '1on1off':
      // Step 2: Half rent if ≤ 2 remaining weeks
      lastPaymentWeeks = remainingWeeks <= 2 ? remainingWeeks : 4;
      lastPaymentRent = remainingWeeks <= 2 ? fourWeekRent / 2 : fourWeekRent;
      isProrated = remainingWeeks <= 2;
      break;

    case 'twoweeksontwoweeksoff':
    case 'twoontwoff':
    case '2on2off':
      // Step 3: Half rent if < 2 remaining weeks, prorated only if exactly 1
      lastPaymentWeeks = remainingWeeks < 2 ? remainingWeeks : 4;
      lastPaymentRent = remainingWeeks < 2 ? fourWeekRent / 2 : fourWeekRent;
      isProrated = remainingWeeks === 1;
      break;

    case 'oneweekonthreeweeksoff':
    case 'oneonthroff':
    case '1on3off':
      // Step 4: Never prorated
      lastPaymentWeeks = 4;
      lastPaymentRent = fourWeekRent;
      isProrated = false;
      break;

    default:
      // Default to every week pattern
      lastPaymentWeeks = remainingWeeks === 0 ? 4 : remainingWeeks;
      lastPaymentRent = (lastPaymentWeeks / 4) * fourWeekRent;
      isProrated = remainingWeeks !== 0;
  }

  return {
    lastPaymentWeeks,
    lastPaymentRent,
    isProrated,
    remainingWeeks,
    weekPattern: weekPattern || 'Every week',
    totalPayments: Math.ceil(reservationSpanWeeks / 4)
  };
}

/**
 * Get proration status string for display
 *
 * @param {boolean} isProrated - Whether proration applies
 * @returns {string} 'yes', 'no', or empty string
 */
export function getProratedStatusString(isProrated) {
  return isProrated ? 'yes' : 'no';
}

/**
 * Determine Credit Card Auth template variant
 *
 * @param {object} params - Parameters
 * @param {Array} params.guestPayments - Guest payment records
 * @param {string} params.weekPattern - Week pattern (optional)
 * @param {number} params.reservationSpanWeeks - Total weeks (optional)
 * @param {number} params.fourWeekRent - 4-week rent (optional)
 * @returns {object} { templateVariant: 'prorated' | 'standard', isProrated: boolean }
 */
export function determineCreditCardAuthTemplate({
  guestPayments,
  weekPattern,
  reservationSpanWeeks,
  fourWeekRent
}) {
  // Primary method: compare actual payment amounts
  if (guestPayments && guestPayments.length > 1) {
    const isProrated = shouldUseProrated({ guestPayments });
    return {
      templateVariant: isProrated ? 'prorated' : 'standard',
      isProrated
    };
  }

  // Fallback: calculate from parameters
  if (weekPattern && reservationSpanWeeks && fourWeekRent) {
    const { isProrated } = calculateProratedValues({
      weekPattern,
      reservationSpanWeeks,
      fourWeekRent
    });
    return {
      templateVariant: isProrated ? 'prorated' : 'standard',
      isProrated
    };
  }

  // Default to standard
  return {
    templateVariant: 'standard',
    isProrated: false
  };
}
