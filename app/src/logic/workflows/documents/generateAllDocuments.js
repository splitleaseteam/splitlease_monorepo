/**
 * Generate All Documents Workflow
 *
 * Orchestrates the generation of all 4 lease documents by:
 * 1. Fetching all required data from Supabase
 * 2. Validating data completeness
 * 3. Building payloads for each document
 * 4. Calling the lease-documents edge function
 *
 * @module logic/workflows/documents/generateAllDocuments
 */

import { supabase } from '../../../lib/supabase.js';
import { canGenerateDocuments } from '../../rules/documents/canGenerateDocuments.js';
import { determineCreditCardAuthTemplate } from '../../rules/documents/shouldUseProrated.js';
import {
  buildAllDocumentPayloads,
  transformGuestPaymentRecords,
  transformHostPaymentRecords,
  getPaymentSummary
} from '../../processors/documents/index.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

/**
 * Fetch all data required for document generation
 *
 * @param {string} leaseId - Lease ID to fetch data for
 * @returns {Promise<object>} All required data records
 */
export async function fetchDocumentData(leaseId) {
  console.log('[fetchDocumentData] Fetching data for lease:', leaseId);

  // Step 1: Fetch lease with FK references
  const { data: lease, error: leaseError } = await supabase
    .from('booking_lease')
    .select(`
      id,
      agreement_number,
      reservation_start_date,
      reservation_end_date,
      guest_to_platform_payment_records_json,
      platform_to_host_payment_records_json,
      listing_id,
      guest_user_id,
      host_user_id,
      total_guest_rent_amount,
      current_week_number,
      total_week_count
    `)
    .eq('id', leaseId)
    .single();

  if (leaseError) {
    console.error('[fetchDocumentData] Lease fetch failed:', leaseError);
    throw new Error(`Failed to fetch lease: ${leaseError.message}`);
  }

  console.log('[fetchDocumentData] Lease found:', lease.agreement_number);

  // Step 2: Fetch proposal (financial data)
  let proposal = null;
  if (lease.proposal_id) {
    const { data: proposalData, error: proposalError } = await supabase
      .from('booking_proposal')
      .select(`
        id,
        host_proposed_move_in_date,
        planned_move_out_date,
        rental_type,
        four_week_rent_amount,
        host_proposed_four_week_rent,
        damage_deposit_amount,
        host_proposed_damage_deposit,
        cleaning_fee_amount,
        host_proposed_cleaning_fee,
        reservation_span_text,
        reservation_span_in_weeks,
        host_proposed_reservation_span_weeks,
        week_pattern_selection,
        host_proposed_week_pattern,
        house_rules_reference_ids_json,
        host_proposed_house_rules_json
      `)
      .eq('id', lease.proposal_id)
      .single();

    if (proposalError) {
      console.warn('[fetchDocumentData] Proposal fetch failed:', proposalError.message);
    } else {
      proposal = proposalData;
      console.log('[fetchDocumentData] Proposal found');
    }
  }

  // Step 3: Fetch listing
  let listing = null;
  if (lease.listing_id) {
    const { data: listingData, error: listingError } = await supabase
      .from('listing')
      .select(`
        id,
        listing_title,
        listing_description,
        neighborhood_description_by_host,
        address_with_lat_lng_json,
        borough,
        city,
        state,
        zip_code,
        primary_neighborhood_reference_id,
        space_type,
        max_guest_count,
        bedroom_count,
        bathroom_count,
        bed_count,
        square_feet,
        house_rule_reference_ids_json,
        photos_with_urls_captions_and_sort_order_json,
        kitchen_type,
        host_restrictions,
        cancellation_policy
      `)
      .eq('id', lease.listing_id)
      .single();

    if (listingError) {
      console.warn('[fetchDocumentData] Listing fetch failed:', listingError.message);
    } else {
      listing = listingData;
      console.log('[fetchDocumentData] Listing found:', listing.listing_title);
    }
  }

  // Step 4: Fetch users (guest and host) in parallel
  const [guestResult, hostResult] = await Promise.all([
    lease.guest_user_id
      ? supabase
          .from('user')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone_number
          `)
          .eq('id', lease.guest_user_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    lease.host_user_id
      ? supabase
          .from('user')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone_number
          `)
          .eq('id', lease.host_user_id)
          .single()
      : Promise.resolve({ data: null, error: null })
  ]);

  const guest = guestResult.data;
  const host = hostResult.data;

  if (guestResult.error) {
    console.warn('[fetchDocumentData] Guest fetch failed:', guestResult.error.message);
  } else if (guest) {
    console.log('[fetchDocumentData] Guest found:', guest.first_name && guest.last_name ? `${guest.first_name} ${guest.last_name}` : guest.first_name);
  }

  if (hostResult.error) {
    console.warn('[fetchDocumentData] Host fetch failed:', hostResult.error.message);
  } else if (host) {
    console.log('[fetchDocumentData] Host found:', host.first_name && host.last_name ? `${host.first_name} ${host.last_name}` : host.first_name);
  }

  // Step 5: Fetch payment records
  const { data: allPaymentsData, error: paymentsError } = await supabase
    .from('paymentrecords')
    .select(`
      id,
      payment,
      scheduled_date,
      rent,
      maintenance_fee,
      total_paid_by_guest,
      total_paid_to_host,
      damage_deposit,
      payment_from_guest,
      payment_to_host
    `)
    .eq('booking_reservation', leaseId)
    .limit(30);

  if (paymentsError) {
    console.warn('[fetchDocumentData] Payment records fetch failed:', paymentsError.message);
  }

  // Sort payment records by payment number client-side (ascending)
  const sortByPaymentNumber = (a, b) => (a.payment || 0) - (b.payment || 0);

  // Filter and sort payment records client-side
  const allPayments = allPaymentsData || [];
  console.log(`[fetchDocumentData] Fetched ${allPayments.length} total payment records`);

  const guestPayments = allPayments
    .filter(record => record.payment_from_guest === true)
    .sort(sortByPaymentNumber)
    .slice(0, 13);

  const hostPayments = allPayments
    .filter(record => record.payment_to_host === true)
    .sort(sortByPaymentNumber)
    .slice(0, 13);

  console.log(`[fetchDocumentData] Found ${guestPayments.length} guest payment records`);
  console.log(`[fetchDocumentData] Found ${hostPayments.length} host payment records`);

  // Step 6: Extract listing photos from embedded JSON column
  let listingPhotos = [];
  if (listing?.photos_with_urls_captions_and_sort_order_json) {
    let photos = listing.photos_with_urls_captions_and_sort_order_json;
    // Handle double-encoded JSON string
    if (typeof photos === 'string') {
      try {
        photos = JSON.parse(photos);
      } catch {
        photos = [];
      }
    }
    if (Array.isArray(photos)) {
      // Sort by sort_order if available
      const sorted = [...photos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      listingPhotos = sorted.slice(0, 3).map(photo =>
        typeof photo === 'string' ? photo : (photo?.url || photo?.Photo || '')
      ).filter(Boolean);
    }
  }

  console.log(`[fetchDocumentData] Found ${listingPhotos.length} listing photos`);

  return {
    lease,
    proposal,
    guest,
    host,
    listing,
    guestPayments,
    hostPayments,
    listingPhotos
  };
}

/**
 * Generate lease documents (all or selected types)
 *
 * @param {object} params - Generation parameters
 * @param {string} params.leaseId - Lease ID
 * @param {string[]} params.documentTypes - Optional array of document types to generate
 *   Valid values: 'hostPayout', 'supplemental', 'periodicTenancy', 'creditCardAuth'
 *   If not provided, all 4 documents are generated.
 * @param {function} params.onProgress - Progress callback (optional)
 * @returns {Promise<object>} { success, documents, errors, warnings }
 */
export async function generateAllDocuments({ leaseId, documentTypes, onProgress }) {
  // Default to all document types if not specified
  const ALL_DOCUMENT_TYPES = ['hostPayout', 'supplemental', 'periodicTenancy', 'creditCardAuth'];
  const typesToGenerate = documentTypes && documentTypes.length > 0
    ? documentTypes.filter(t => ALL_DOCUMENT_TYPES.includes(t))
    : ALL_DOCUMENT_TYPES;

  console.log(`[generateAllDocuments] Will generate: ${typesToGenerate.join(', ')}`);

  const results = {
    success: false,
    documents: {},
    errors: [],
    warnings: []
  };

  try {
    // Step 1: Fetch all data
    if (onProgress) onProgress({ step: 1, message: 'Fetching lease data...' });

    const data = await fetchDocumentData(leaseId);

    // Step 2: Validate data
    if (onProgress) onProgress({ step: 2, message: 'Validating data...' });

    const validation = canGenerateDocuments(data);
    results.warnings = validation.warnings;

    if (!validation.canGenerate) {
      results.errors = validation.errors;
      console.error('[generateAllDocuments] Validation failed:', validation.errors);
      return results;
    }

    // Log any warnings
    if (validation.warnings.length > 0) {
      console.warn('[generateAllDocuments] Warnings:', validation.warnings);
    }

    // Step 3: Build payloads
    if (onProgress) onProgress({ step: 3, message: 'Building document payloads...' });

    const payloads = buildAllDocumentPayloads({
      lease: data.lease,
      proposal: data.proposal,
      guest: data.guest,
      host: data.host,
      listing: data.listing,
      guestPayments: data.guestPayments,
      hostPayments: data.hostPayments,
      listingPhotos: data.listingPhotos
    });

    // Log payment summary
    const transformedGuest = transformGuestPaymentRecords(data.guestPayments);
    const transformedHost = transformHostPaymentRecords(data.hostPayments);
    const paymentSummary = getPaymentSummary(transformedGuest, transformedHost);
    console.log('[generateAllDocuments] Payment summary:', paymentSummary);

    // Determine CC Auth template variant
    const { templateVariant, isProrated } = determineCreditCardAuthTemplate({
      guestPayments: data.guestPayments
    });
    console.log(`[generateAllDocuments] CC Auth template: ${templateVariant} (prorated: ${isProrated})`);

    // Step 4: Call edge function
    if (onProgress) onProgress({ step: 4, message: 'Generating documents...' });

    console.log('[generateAllDocuments] Calling lease-documents edge function...');
    console.log('[generateAllDocuments] Payloads:', JSON.stringify(payloads, null, 2));

    const response = await fetch(`${SUPABASE_URL}/functions/v1/lease-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action: 'generate_all',
        payload: payloads
      })
    });

    const result = await response.json();
    console.log('[generateAllDocuments] Response:', result);

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    // Extract document results
    const docResults = result.data || result;

    // Process results for selected document types
    typesToGenerate.forEach(docType => {
      const docResult = docResults[docType];
      if (docResult?.success) {
        results.documents[docType] = {
          success: true,
          driveUrl: docResult.driveUrl || null,
          storageUrl: docResult.downloadUrl || null,
          filename: docResult.filename || null
        };
      } else {
        results.errors.push(`${docType}: ${docResult?.error || 'Unknown error'}`);
        results.documents[docType] = {
          success: false,
          error: docResult?.error || 'Unknown error'
        };
      }
    });

    // Set overall success
    const successCount = Object.values(results.documents).filter(d => d.success).length;
    results.success = successCount > 0;

    console.log(`[generateAllDocuments] Complete: ${successCount}/${typesToGenerate.length} documents generated`);

    return results;

  } catch (error) {
    console.error('[generateAllDocuments] Error:', error);
    results.errors.push(error.message);
    return results;
  }
}

/**
 * Generate a single document type
 *
 * @param {object} params - Generation parameters
 * @param {string} params.leaseId - Lease ID
 * @param {string} params.documentType - 'hostPayout' | 'supplemental' | 'periodicTenancy' | 'creditCardAuth'
 * @returns {Promise<object>} { success, document, error }
 */
export async function generateSingleDocument({ leaseId, documentType }) {
  try {
    const data = await fetchDocumentData(leaseId);

    const payloads = buildAllDocumentPayloads({
      lease: data.lease,
      proposal: data.proposal,
      guest: data.guest,
      host: data.host,
      listing: data.listing,
      guestPayments: data.guestPayments,
      hostPayments: data.hostPayments,
      listingPhotos: data.listingPhotos
    });

    const payload = payloads[documentType];
    if (!payload) {
      throw new Error(`Invalid document type: ${documentType}`);
    }

    // Map document type to action
    const actionMap = {
      hostPayout: 'generate_host_payout',
      supplemental: 'generateSupplemental',
      periodicTenancy: 'generate_periodic_tenancy',
      creditCardAuth: 'generateCreditCardAuth'
    };

    const action = actionMap[documentType];

    const response = await fetch(`${SUPABASE_URL}/functions/v1/lease-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action,
        payload
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return {
      success: true,
      document: {
        driveUrl: result.data?.driveUrl || null,
        storageUrl: result.data?.downloadUrl || null,
        filename: result.data?.filename || null
      }
    };

  } catch (error) {
    console.error(`[generateSingleDocument] Error generating ${documentType}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
