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
