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

// Get dev project credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qzsmhgyojmwvtjmnrdea.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
    .from('bookings_leases')
    .select(`
      _id,
      "Agreement Number",
      "Reservation Period : Start",
      "Reservation Period : End",
      "Payment Records Guest-SL",
      "Payment Records SL-Hosts",
      Proposal,
      Listing,
      Guest,
      Host,
      "Total Rent",
      "current week number",
      "total week count"
    `)
    .eq('_id', leaseId)
    .single();

  if (leaseError) {
    console.error('[fetchDocumentData] Lease fetch failed:', leaseError);
    throw new Error(`Failed to fetch lease: ${leaseError.message}`);
  }

  console.log('[fetchDocumentData] Lease found:', lease['Agreement Number']);

  // Step 2: Fetch proposal (financial data)
  let proposal = null;
  if (lease.Proposal) {
    const { data: proposalData, error: proposalError } = await supabase
      .from('proposal')
      .select(`
        _id,
        "hc move in date",
        "Move-out",
        "rental type",
        "4 week rent",
        "hc 4 week rent",
        "damage deposit",
        "hc damage deposit",
        "cleaning fee",
        "hc cleaning fee",
        "Reservation Span",
        "Reservation Span (Weeks)",
        "hc reservation span (weeks)",
        "week selection",
        "hc weeks schedule",
        "House Rules",
        "hc house rules"
      `)
      .eq('_id', lease.Proposal)
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
  if (lease.Listing) {
    const { data: listingData, error: listingError } = await supabase
      .from('listing')
      .select(`
        _id,
        Name,
        Description,
        "Description - Neighborhood",
        "Location - Address",
        "Location - Borough",
        "Location - City",
        "Location - State",
        "Location - Zip Code",
        "Location - Hood",
        "Features - Type of Space",
        "Features - Qty Guests",
        "Features - Qty Bedrooms",
        "Features - Qty Bathrooms",
        "Features - Qty Beds",
        "Features - SQFT Area",
        "Features - House Rules",
        "Features - Photos",
        "Kitchen Type",
        "host restrictions",
        "Cancellation Policy",
        "Cancellation Policy - Additional Restrictions"
      `)
      .eq('_id', lease.Listing)
      .single();

    if (listingError) {
      console.warn('[fetchDocumentData] Listing fetch failed:', listingError.message);
    } else {
      listing = listingData;
      console.log('[fetchDocumentData] Listing found:', listing.Name);
    }
  }

  // Step 4: Fetch users (guest and host) in parallel
  const [guestResult, hostResult] = await Promise.all([
    lease.Guest
      ? supabase
          .from('user')
          .select(`
            _id,
            "Name - First",
            "Name - Last",
            "Name - Full",
            email,
            "email as text",
            "Phone Number (as text)"
          `)
          .eq('_id', lease.Guest)
          .single()
      : Promise.resolve({ data: null, error: null }),
    lease.Host
      ? supabase
          .from('user')
          .select(`
            _id,
            "Name - First",
            "Name - Last",
            "Name - Full",
            email,
            "email as text",
            "Phone Number (as text)"
          `)
          .eq('_id', lease.Host)
          .single()
      : Promise.resolve({ data: null, error: null })
  ]);

  const guest = guestResult.data;
  const host = hostResult.data;

  if (guestResult.error) {
    console.warn('[fetchDocumentData] Guest fetch failed:', guestResult.error.message);
  } else if (guest) {
    console.log('[fetchDocumentData] Guest found:', guest['Name - Full'] || guest['Name - First']);
  }

  if (hostResult.error) {
    console.warn('[fetchDocumentData] Host fetch failed:', hostResult.error.message);
  } else if (host) {
    console.log('[fetchDocumentData] Host found:', host['Name - Full'] || host['Name - First']);
  }

  // Step 5: Fetch payment records
  // Note: PostgREST has issues with columns containing special characters like '#' and '?'
  // We fetch ALL payment records for the lease and filter client-side
  const { data: allPaymentsData, error: paymentsError } = await supabase
    .from('paymentrecords')
    .select(`
      _id,
      "Payment #",
      "Scheduled Date",
      "Rent",
      "Maintenance Fee",
      "Total Paid by Guest",
      "Total Paid to Host",
      "Damage Deposit",
      "Payment from guest?",
      "Payment to Host?"
    `)
    .eq('Booking - Reservation', leaseId)
    .limit(30);

  if (paymentsError) {
    console.warn('[fetchDocumentData] Payment records fetch failed:', paymentsError.message);
  }

  // Sort payment records by Payment # client-side (ascending)
  const sortByPaymentNumber = (a, b) => (a['Payment #'] || 0) - (b['Payment #'] || 0);

  // Filter and sort payment records client-side
  // Guest payments: "Payment from guest?" === true
  // Host payments: "Payment to Host?" === true
  const allPayments = allPaymentsData || [];
  console.log(`[fetchDocumentData] Fetched ${allPayments.length} total payment records`);

  const guestPayments = allPayments
    .filter(record => record['Payment from guest?'] === true)
    .sort(sortByPaymentNumber)
    .slice(0, 13);

  const hostPayments = allPayments
    .filter(record => record['Payment to Host?'] === true)
    .sort(sortByPaymentNumber)
    .slice(0, 13);

  console.log(`[fetchDocumentData] Found ${guestPayments.length} guest payment records`);
  console.log(`[fetchDocumentData] Found ${hostPayments.length} host payment records`);

  // Step 6: Fetch listing photos
  let listingPhotos = [];
  if (listing?.['Features - Photos']) {
    const photos = listing['Features - Photos'];
    if (Array.isArray(photos)) {
      listingPhotos = photos.slice(0, 3).map(photo =>
        typeof photo === 'string' ? photo : (photo?.url || photo?.Photo || '')
      ).filter(Boolean);
    }
  }

  // Fallback: Try listing_photo table
  if (listingPhotos.length === 0 && lease.Listing) {
    const { data: photosData } = await supabase
      .from('listing_photo')
      .select('Photo')
      .eq('Listing', lease.Listing)
      .order('SortOrder', { ascending: true, nullsLast: true })
      .limit(3);

    if (photosData && photosData.length > 0) {
      listingPhotos = photosData.map(p => p.Photo).filter(Boolean);
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
 * Generate all 4 lease documents
 *
 * @param {object} params - Generation parameters
 * @param {string} params.leaseId - Lease ID
 * @param {function} params.onProgress - Progress callback (optional)
 * @returns {Promise<object>} { success, documents, errors, warnings }
 */
export async function generateAllDocuments({ leaseId, onProgress }) {
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

    // Process results
    const documentTypes = ['hostPayout', 'supplemental', 'periodicTenancy', 'creditCardAuth'];

    documentTypes.forEach(docType => {
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

    console.log(`[generateAllDocuments] Complete: ${successCount}/4 documents generated`);

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
