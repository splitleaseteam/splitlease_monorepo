/**
 * Document Rules Index
 *
 * Boolean predicates for lease document generation.
 *
 * @module logic/rules/documents
 */

export {
  canGenerateDocuments,
  isReadyForDocumentGeneration,
  canGenerateDocumentType
} from './canGenerateDocuments.js';

export {
  shouldUseProrated,
  calculateProratedValues,
  getProratedStatusString,
  determineCreditCardAuthTemplate
} from './shouldUseProrated.js';

export {
  HOST_PAYOUT_REQUIREMENTS,
  SUPPLEMENTAL_REQUIREMENTS,
  PERIODIC_TENANCY_REQUIREMENTS,
  CREDIT_CARD_AUTH_REQUIREMENTS,
  ALL_DOCUMENT_REQUIREMENTS,
  checkDocumentReadiness,
  checkAllDocumentsReadiness,
  formatReadinessReport,
  formatReadinessForSlack,
} from './leaseReadinessChecks.js';
