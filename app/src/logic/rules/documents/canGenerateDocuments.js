/**
 * Can Generate Documents Rule
 *
 * Validates that a lease has all required data for document generation.
 * Returns validation result with specific error messages.
 *
 * @module logic/rules/documents/canGenerateDocuments
 */

/**
 * Check if lease has required data for document generation
 *
 * @param {object} params - Validation parameters
 * @param {object} params.lease - Lease record
 * @param {object} params.proposal - Proposal record
 * @param {object} params.guest - Guest user record
 * @param {object} params.host - Host user record
 * @param {object} params.listing - Listing record
 * @param {Array} params.guestPayments - Guest payment records
 * @param {Array} params.hostPayments - Host payment records
 * @returns {object} { canGenerate: boolean, errors: string[], warnings: string[] }
 */
export function canGenerateDocuments({
  lease,
  proposal,
  guest,
  host,
  listing,
  guestPayments = [],
  hostPayments = []
}) {
  const errors = [];
  const warnings = [];

  // Lease validation
  if (!lease) {
    errors.push('Lease record is required');
  } else {
    if (!lease['Agreement Number'] && !lease.id) {
      errors.push('Lease must have an Agreement Number or ID');
    }
  }

  // Proposal validation
  if (!proposal) {
    warnings.push('Proposal record not found - some fields may be missing');
  } else {
    // Check for key financial fields
    const hasMoveInDate = proposal['host_counter_offer_move_in_date'] || lease?.['Reservation Period : Start'];
    const hasMoveOutDate = proposal['Move-out'] || lease?.['Reservation Period : End'];
    const hasRent = proposal['host_counter_offer_4_week_rent'] || proposal['4 week rent'];

    if (!hasMoveInDate) {
      errors.push('Move-in date is required (check proposal.hc move in date)');
    }
    if (!hasMoveOutDate) {
      warnings.push('Move-out date not found - may affect document generation');
    }
    if (!hasRent) {
      warnings.push('4 week rent not found - financial calculations may be incomplete');
    }
  }

  // Guest validation
  if (!guest) {
    warnings.push('Guest record not found - guest name will be empty');
  } else {
    const hasGuestName = guest.first_name || guest.last_name;
    if (!hasGuestName) {
      warnings.push('Guest name fields are empty');
    }
  }

  // Host validation
  if (!host) {
    errors.push('Host record is required for document generation');
  } else {
    const hasHostName = host.first_name || host.last_name;
    if (!hasHostName) {
      warnings.push('Host name fields are empty');
    }
  }

  // Listing validation
  if (!listing) {
    errors.push('Listing record is required for document generation');
  } else {
    const hasAddress = listing.address_with_lat_lng_json ||
      listing.city ||
      listing.primary_neighborhood_reference_id;
    if (!hasAddress) {
      warnings.push('Listing address not found - location fields may be empty');
    }
  }

  // Payment records validation
  if (guestPayments.length === 0) {
    warnings.push('No guest payment records found - payment schedule will be empty');
  }
  if (hostPayments.length === 0) {
    warnings.push('No host payment records found - host payout schedule will be empty');
  }

  // Cross-validation
  if (guestPayments.length > 0 && hostPayments.length > 0) {
    if (guestPayments.length !== hostPayments.length) {
      warnings.push(`Guest (${guestPayments.length}) and host (${hostPayments.length}) payment counts differ`);
    }
  }

  return {
    canGenerate: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Quick check if document generation is possible
 * Simplified version that returns boolean only
 *
 * @param {object} params - Same as canGenerateDocuments
 * @returns {boolean} True if documents can be generated
 */
export function isReadyForDocumentGeneration(params) {
  const { canGenerate } = canGenerateDocuments(params);
  return canGenerate;
}

/**
 * Check if a specific document type can be generated
 *
 * @param {string} documentType - 'hostPayout' | 'supplemental' | 'periodicTenancy' | 'creditCardAuth'
 * @param {object} params - Validation parameters
 * @returns {object} { canGenerate: boolean, reason: string }
 */
export function canGenerateDocumentType(documentType, params) {
  const { lease, proposal, guest, host, listing, guestPayments, hostPayments } = params;

  switch (documentType) {
    case 'hostPayout':
      if (!host) return { canGenerate: false, reason: 'Host record required' };
      if (!listing) return { canGenerate: false, reason: 'Listing record required' };
      if (hostPayments.length === 0) return { canGenerate: false, reason: 'No host payment records' };
      return { canGenerate: true, reason: 'Ready' };

    case 'supplemental':
      if (!host) return { canGenerate: false, reason: 'Host record required' };
      if (!listing) return { canGenerate: false, reason: 'Listing record required' };
      return { canGenerate: true, reason: 'Ready' };

    case 'periodicTenancy':
      if (!guest) return { canGenerate: false, reason: 'Guest record required' };
      if (!host) return { canGenerate: false, reason: 'Host record required' };
      if (!listing) return { canGenerate: false, reason: 'Listing record required' };
      return { canGenerate: true, reason: 'Ready' };

    case 'creditCardAuth':
      if (!guest) return { canGenerate: false, reason: 'Guest record required' };
      if (!host) return { canGenerate: false, reason: 'Host record required' };
      if (guestPayments.length === 0) return { canGenerate: false, reason: 'No guest payment records' };
      return { canGenerate: true, reason: 'Ready' };

    default:
      return { canGenerate: false, reason: `Unknown document type: ${documentType}` };
  }
}
