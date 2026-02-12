/**
 * Transform Payment Records
 *
 * Transforms raw payment records from Supabase into document-ready format.
 * Handles both guest and host payment records with proper discriminator filtering.
 *
 * Database Columns Used (paymentrecords table):
 * - `id`: Payment record ID
 * - `Payment #`: Sequence number (1-13)
 * - `Scheduled Date`: ISO timestamp for payment due date
 * - `Rent`: Rent amount for this period
 * - `Maintenance Fee`: Fee amount per period
 * - `Total Paid by Guest`: Guest total (only on guest records)
 * - `Total Paid to Host`: Host payout (only on host records)
 * - `Damage Deposit`: Deposit amount (first guest payment only)
 * - `Payment from guest?`: Boolean discriminator for guest records
 * - `Payment to Host?`: Boolean discriminator for host records
 *
 * @module logic/processors/documents/transformPaymentRecords
 */

import { formatDateForDocument, formatCurrency } from './formatters.js';

/**
 * Transform guest payment records for document API
 *
 * @param {Array} paymentRecords - Raw payment records from paymentrecords table
 * @returns {Array<object>} Formatted guest payment records (max 13)
 */
export function transformGuestPaymentRecords(paymentRecords) {
  if (!paymentRecords || !Array.isArray(paymentRecords)) {
    return [];
  }

  // Filter for guest records using discriminator
  const guestRecords = paymentRecords
    .filter(record =>
      record['Payment from guest?'] === true ||
      (record['Payment from guest?'] !== false && record['Total Paid by Guest'] !== null)
    )
    .sort((a, b) => (a['Payment #'] || 0) - (b['Payment #'] || 0))
    .slice(0, 13);

  return guestRecords.map((record, index) => ({
    paymentNumber: record['Payment #'] || index + 1,
    date: formatDateForDocument(record['Scheduled Date']),
    dateRaw: record['Scheduled Date'],
    rent: formatCurrency(record['Rent']),
    rentRaw: record['Rent'] || 0,
    maintenanceFee: formatCurrency(record['Maintenance Fee']),
    maintenanceFeeRaw: record['Maintenance Fee'] || 0,
    total: formatCurrency(record['Total Paid by Guest']),
    totalRaw: record['Total Paid by Guest'] || 0,
    damageDeposit: formatCurrency(record['Damage Deposit']),
    damageDepositRaw: record['Damage Deposit'] || 0,
    isFirstPayment: (record['Payment #'] || index + 1) === 1
  }));
}

/**
 * Transform host payment records for document API
 *
 * @param {Array} paymentRecords - Raw payment records from paymentrecords table
 * @returns {Array<object>} Formatted host payment records (max 13)
 */
export function transformHostPaymentRecords(paymentRecords) {
  if (!paymentRecords || !Array.isArray(paymentRecords)) {
    return [];
  }

  // Filter for host records using discriminator
  const hostRecords = paymentRecords
    .filter(record =>
      record['Payment to Host?'] === true ||
      (record['Payment to Host?'] !== false && record['Total Paid to Host'] !== null)
    )
    .sort((a, b) => (a['Payment #'] || 0) - (b['Payment #'] || 0))
    .slice(0, 13);

  return hostRecords.map((record, index) => ({
    paymentNumber: record['Payment #'] || index + 1,
    date: formatDateForDocument(record['Scheduled Date']),
    dateRaw: record['Scheduled Date'],
    rent: formatCurrency(record['Rent']),
    rentRaw: record['Rent'] || 0,
    maintenanceFee: formatCurrency(record['Maintenance Fee']),
    maintenanceFeeRaw: record['Maintenance Fee'] || 0,
    total: formatCurrency(record['Total Paid to Host']),
    totalRaw: record['Total Paid to Host'] || 0
  }));
}

/**
 * Build guest payment fields for document payload
 * Creates numbered fields (guest date 1, guest rent 1, etc.)
 *
 * @param {Array} guestPayments - Transformed guest payment records
 * @returns {object} Object with numbered guest payment fields
 */
export function buildGuestPaymentFields(guestPayments) {
  const fields = {
    'Number of Payments (guest)': guestPayments.length
  };

  guestPayments.forEach((payment, index) => {
    const num = index + 1;
    fields[`guest date ${num}`] = payment.date;
    fields[`guest rent ${num}`] = payment.rent;
    fields[`guest total ${num}`] = payment.total;
  });

  return fields;
}

/**
 * Build host payment fields for document payload
 * Creates numbered fields (Date1, Rent1, Total1, etc.)
 *
 * @param {Array} hostPayments - Transformed host payment records
 * @param {string} agreementNumber - Agreement number for payout number
 * @returns {object} Object with numbered host payment fields
 */
export function buildHostPaymentFields(hostPayments, agreementNumber = '') {
  const fields = {
    'Payout Number': `${agreementNumber}-PO`,
    'Maintenance Fee': hostPayments[0]?.maintenanceFee || '$0.00',
    'Number of Payments (host)': hostPayments.length
  };

  hostPayments.forEach((payment, index) => {
    const num = index + 1;
    // Host fields use capital letters (Date1, Rent1, Total1)
    fields[`Date${num}`] = payment.date;
    fields[`Rent${num}`] = payment.rent;
    fields[`Total${num}`] = payment.total;
  });

  return fields;
}

/**
 * Analyze payment records for proration detection
 *
 * @param {Array} transformedGuestPayments - Transformed guest payment records
 * @returns {object} Proration analysis result
 */
export function analyzeProration(transformedGuestPayments) {
  if (!transformedGuestPayments || transformedGuestPayments.length === 0) {
    return {
      isProrated: false,
      firstPaymentRent: 0,
      lastPaymentRent: 0,
      numberOfPayments: 0
    };
  }

  const firstPayment = transformedGuestPayments[0];
  const lastPayment = transformedGuestPayments[transformedGuestPayments.length - 1];

  const firstPaymentRent = firstPayment.rentRaw;
  const lastPaymentRent = lastPayment.rentRaw;

  // Prorated if last payment rent is less than first
  const isProrated = transformedGuestPayments.length > 1 && lastPaymentRent < firstPaymentRent;

  return {
    isProrated,
    firstPaymentRent,
    lastPaymentRent,
    firstPaymentTotal: firstPayment.totalRaw,
    lastPaymentTotal: lastPayment.totalRaw,
    numberOfPayments: transformedGuestPayments.length,
    damageDeposit: firstPayment.damageDepositRaw || 0
  };
}

/**
 * Get payment summary for logging/debugging
 *
 * @param {Array} guestPayments - Transformed guest payments
 * @param {Array} hostPayments - Transformed host payments
 * @returns {object} Summary object
 */
export function getPaymentSummary(guestPayments, hostPayments) {
  const guestTotal = guestPayments.reduce((sum, p) => sum + (p.totalRaw || 0), 0);
  const hostTotal = hostPayments.reduce((sum, p) => sum + (p.totalRaw || 0), 0);

  return {
    guestPaymentCount: guestPayments.length,
    hostPaymentCount: hostPayments.length,
    guestTotalSum: formatCurrency(guestTotal),
    hostTotalSum: formatCurrency(hostTotal),
    firstGuestPayment: guestPayments[0]?.date || 'N/A',
    firstHostPayment: hostPayments[0]?.date || 'N/A',
    lastGuestPayment: guestPayments[guestPayments.length - 1]?.date || 'N/A',
    lastHostPayment: hostPayments[hostPayments.length - 1]?.date || 'N/A'
  };
}
