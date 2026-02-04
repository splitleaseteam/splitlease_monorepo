/**
 * Document Processors Index
 *
 * Data transformation functions for lease document generation.
 *
 * @module logic/processors/documents
 */

// Formatters
export {
  formatDateForDocument,
  formatDateShortYear,
  formatCurrency,
  formatDecimal,
  getDayName,
  formatHouseRules,
  formatHouseRulesBulleted,
  formatFullName,
  extractAmountFromCurrency,
  formatPhone
} from './formatters.js';

// Payload Builders
export {
  buildHostPayoutPayload,
  buildSupplementalPayload,
  buildPeriodicTenancyPayload,
  buildCreditCardAuthPayload,
  buildAllDocumentPayloads
} from './buildDocumentPayload.js';

// Payment Record Transformers
export {
  transformGuestPaymentRecords,
  transformHostPaymentRecords,
  buildGuestPaymentFields,
  buildHostPaymentFields,
  analyzeProration,
  getPaymentSummary
} from './transformPaymentRecords.js';
