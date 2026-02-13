/**
 * Build Document Payloads
 *
 * Constructs API payloads for all 4 lease document types.
 * Output keys are PDF template field names (Title Case).
 * Source data uses actual Supabase snake_case column names.
 *
 * Database Tables Used:
 * - booking_lease: agreement_number, reservation_start_date, reservation_end_date
 * - booking_proposal: host_proposed_move_in_date, planned_move_out_date, reservation_span_in_weeks, etc.
 * - paymentrecords: payment, scheduled_date, rent, maintenance_fee, total_paid_by_guest, total_paid_to_host, damage_deposit
 * - listing: listing_title, listing_description, address_with_lat_lng_json, square_feet
 * - user: first_name, last_name, email, phone_number
 *
 * @module logic/processors/documents/buildDocumentPayload
 */

import {
  formatDateForDocument,
  formatCurrency,
  formatDecimal,
  getDayName,
  formatHouseRules,
  formatFullName,
  formatPhone
} from './formatters.js';

/**
 * Build Host Payout Schedule payload
 *
 * @param {object} params - Build parameters
 * @param {object} params.lease - Raw lease record from booking_lease
 * @param {object} params.host - Raw host user record
 * @param {object} params.listing - Raw listing record
 * @param {Array} params.hostPayments - Array of host payment records
 * @returns {object} Host Payout payload for API
 */
export function buildHostPayoutPayload({ lease, host, listing, hostPayments }) {
  const agreementNumber = lease.agreement_number || '';

  // Build base payload
  const payload = {
    'Agreement Number': agreementNumber,
    'Host Name': formatFullName(
      host?.first_name,
      host?.last_name,
      host?.first_name && host?.last_name ? `${host.first_name} ${host.last_name}` : null
    ),
    'Host Email': host?.email || '',
    'Host Phone': formatPhone(host?.phone_number || ''),
    'Address': extractAddress(listing),
    'Payout Number': `${agreementNumber}-PO`,
    'Maintenance Fee': hostPayments?.[0]?.maintenance_fee
      ? formatCurrency(hostPayments[0].maintenance_fee)
      : '$0.00'
  };

  // Map up to 13 host payment records
  if (hostPayments && Array.isArray(hostPayments)) {
    hostPayments.slice(0, 13).forEach((payment, index) => {
      const num = index + 1;
      payload[`Date${num}`] = formatDateForDocument(payment.scheduled_date);
      payload[`Rent${num}`] = formatCurrency(payment.rent);
      payload[`Total${num}`] = formatCurrency(payment.total_paid_to_host);
    });
  }

  return payload;
}

/**
 * Build Supplemental Agreement payload
 *
 * @param {object} params - Build parameters
 * @param {object} params.lease - Raw lease record
 * @param {object} params.proposal - Raw proposal record
 * @param {object} params.host - Raw host user record
 * @param {object} params.listing - Raw listing record
 * @param {Array<string>} params.listingPhotos - Array of photo URLs
 * @returns {object} Supplemental Agreement payload for API
 */
export function buildSupplementalPayload({ lease, proposal, host, listing, listingPhotos = [] }) {
  const agreementNumber = lease.agreement_number || '';

  // Get dates from proposal (prefer host counter-offer, fall back to lease)
  const moveInDate = proposal?.host_proposed_move_in_date || lease?.reservation_start_date;
  const moveOutDate = proposal?.planned_move_out_date || lease?.reservation_end_date;

  // Calculate weeks
  const numberOfWeeks = proposal?.reservation_span_in_weeks ||
    proposal?.host_proposed_reservation_span_weeks ||
    calculateWeeksBetween(moveInDate, moveOutDate);

  return {
    'Agreement Number': agreementNumber,
    'Check in Date': formatDateForDocument(moveInDate),
    'Check Out Date': formatDateForDocument(moveOutDate),
    'Number of weeks': String(numberOfWeeks || 0),
    'Guests Allowed': String(listing?.max_guest_count || 1),
    'Host Name': formatFullName(
      host?.first_name,
      host?.last_name,
      host?.first_name && host?.last_name ? `${host.first_name} ${host.last_name}` : null
    ),
    'Listing Title': listing?.listing_title || '',
    'Listing Description': listing?.listing_description || '',
    'Location': extractAddress(listing),
    'Type of Space': buildTypeOfSpace(listing),
    'Space Details': buildSpaceDetails(listing),
    'Supplemental Number': `${agreementNumber}-SA`,
    'image1': listingPhotos[0] || '',
    'image2': listingPhotos[1] || '',
    'image3': listingPhotos[2] || ''
  };
}

/**
 * Build Periodic Tenancy Agreement payload
 *
 * @param {object} params - Build parameters
 * @param {object} params.lease - Raw lease record
 * @param {object} params.proposal - Raw proposal record
 * @param {object} params.guest - Raw guest user record
 * @param {object} params.host - Raw host user record
 * @param {object} params.listing - Raw listing record
 * @param {Array} params.guestPayments - Array of guest payment records
 * @param {Array<string>} params.listingPhotos - Array of photo URLs
 * @returns {object} Periodic Tenancy payload for API
 */
export function buildPeriodicTenancyPayload({
  lease,
  proposal,
  guest,
  host,
  listing,
  guestPayments = [],
  listingPhotos = []
}) {
  const agreementNumber = lease.agreement_number || '';

  // Get dates from proposal
  const moveInDate = proposal?.host_proposed_move_in_date || lease?.reservation_start_date;
  const moveOutDate = proposal?.planned_move_out_date || lease?.reservation_end_date;

  // Calculate weeks
  const numberOfWeeks = proposal?.reservation_span_in_weeks ||
    proposal?.host_proposed_reservation_span_weeks ||
    calculateWeeksBetween(moveInDate, moveOutDate);

  // Get damage deposit from first guest payment or proposal
  const damageDeposit = guestPayments[0]?.damage_deposit ||
    proposal?.host_proposed_damage_deposit ||
    proposal?.damage_deposit_amount ||
    0;

  // Get house rules from proposal or listing
  const houseRules = proposal?.host_proposed_house_rules_json ||
    proposal?.house_rules_reference_ids_json ||
    listing?.house_rule_reference_ids_json ||
    [];

  const payload = {
    'Agreement Number': agreementNumber,
    'Check in Date': formatDateForDocument(moveInDate),
    'Check Out Date': formatDateForDocument(moveOutDate),
    'Check In Day': getDayName(moveInDate),
    'Check Out Day': getDayName(moveOutDate),
    'Number of weeks': String(numberOfWeeks || 0),
    'Guests Allowed': String(listing?.max_guest_count || 1),
    'Host name': formatFullName(
      host?.first_name,
      host?.last_name,
      host?.first_name && host?.last_name ? `${host.first_name} ${host.last_name}` : null
    ),
    'Guest name': formatFullName(
      guest?.first_name,
      guest?.last_name,
      guest?.first_name && guest?.last_name ? `${guest.first_name} ${guest.last_name}` : null
    ),
    'Supplemental Number': `${agreementNumber}-SA`,
    'Authorization Card Number': `${agreementNumber}-CC`,
    'Host Payout Schedule Number': `${agreementNumber}-PO`,
    'Extra Requests on Cancellation Policy': formatHouseRules(
      listing?.cancellation_policy
    ),
    'Damage Deposit': formatCurrency(damageDeposit),
    'Listing Title': listing?.listing_title || '',
    'Listing Description': listing?.listing_description || '',
    'Location': extractAddress(listing),
    'Type of Space': buildTypeOfSpace(listing),
    'Space Details': buildSpaceDetails(listing),
    'House Rules': houseRules,
    'image1': listingPhotos[0] || '',
    'image2': listingPhotos[1] || '',
    'image3': listingPhotos[2] || ''
  };

  // Map guest payments (for reference in periodic tenancy)
  if (guestPayments && Array.isArray(guestPayments)) {
    guestPayments.slice(0, 13).forEach((payment, index) => {
      const num = index + 1;
      payload[`guest date ${num}`] = formatDateForDocument(payment.scheduled_date);
      payload[`guest rent ${num}`] = formatCurrency(payment.rent);
      payload[`guest total ${num}`] = formatCurrency(payment.total_paid_by_guest);
    });
  }

  return payload;
}

/**
 * Build Credit Card Authorization payload
 *
 * @param {object} params - Build parameters
 * @param {object} params.lease - Raw lease record
 * @param {object} params.proposal - Raw proposal record
 * @param {object} params.guest - Raw guest user record
 * @param {object} params.host - Raw host user record
 * @param {object} params.listing - Raw listing record
 * @param {Array} params.guestPayments - Array of guest payment records
 * @returns {object} Credit Card Auth payload for API
 */
export function buildCreditCardAuthPayload({
  lease,
  proposal,
  guest,
  host,
  listing,
  guestPayments = []
}) {
  const agreementNumber = lease.agreement_number || '';

  // Get financial values from proposal (prefer host counter-offer)
  const fourWeekRent = proposal?.host_proposed_four_week_rent || proposal?.four_week_rent_amount || 0;
  const maintenanceFee = proposal?.host_proposed_cleaning_fee || proposal?.cleaning_fee_amount || 0;
  const damageDeposit = proposal?.host_proposed_damage_deposit || proposal?.damage_deposit_amount || 0;

  // Get dates for week calculation
  const moveInDate = proposal?.host_proposed_move_in_date || lease?.reservation_start_date;
  const moveOutDate = proposal?.planned_move_out_date || lease?.reservation_end_date;

  // Calculate total weeks
  const totalWeeks = proposal?.reservation_span_in_weeks ||
    proposal?.host_proposed_reservation_span_weeks ||
    calculateWeeksBetween(moveInDate, moveOutDate);

  // Determine proration from payment records
  const firstPayment = guestPayments[0];
  const lastPayment = guestPayments[guestPayments.length - 1];

  const firstPaymentRent = firstPayment?.rent || fourWeekRent;
  const lastPaymentRent = lastPayment?.rent || fourWeekRent;

  // Prorated if last payment rent is less than first
  const isProrated = guestPayments.length > 1 && lastPaymentRent < firstPaymentRent;

  // Calculate remaining weeks for last payment (mod 4)
  const remainingWeeks = totalWeeks % 4;
  const lastPaymentWeeks = remainingWeeks === 0 ? 4 : remainingWeeks;

  // Number of payment cycles
  const numberOfPayments = guestPayments.length || Math.ceil(totalWeeks / 4);

  // Penultimate week number
  const penultimateWeekNumber = Math.max(1, numberOfPayments - 1);

  return {
    'Agreement Number': agreementNumber,
    'Host Name': formatFullName(
      host?.first_name,
      host?.last_name,
      host?.first_name && host?.last_name ? `${host.first_name} ${host.last_name}` : null
    ),
    'Guest Name': formatFullName(
      guest?.first_name,
      guest?.last_name,
      guest?.first_name && guest?.last_name ? `${guest.first_name} ${guest.last_name}` : null
    ),
    'Four Week Rent': formatCurrency(fourWeekRent),
    'Maintenance Fee': formatCurrency(maintenanceFee),
    'Damage Deposit': formatCurrency(damageDeposit),
    'Splitlease Credit': formatDecimal(0),
    'Last Payment Rent': formatCurrency(lastPaymentRent),
    'Weeks Number': String(totalWeeks || 0),
    'Listing Description': listing?.listing_description || listing?.listing_title || '',
    'Penultimate Week Number': String(penultimateWeekNumber),
    'Number of Payments': String(numberOfPayments),
    'Last Payment Weeks': String(lastPaymentWeeks),
    'Is Prorated': isProrated
  };
}

/**
 * Build all 4 document payloads at once
 *
 * @param {object} params - All data needed for document generation
 * @param {object} params.lease - Raw lease record
 * @param {object} params.proposal - Raw proposal record
 * @param {object} params.guest - Raw guest user record
 * @param {object} params.host - Raw host user record
 * @param {object} params.listing - Raw listing record
 * @param {Array} params.guestPayments - Guest payment records
 * @param {Array} params.hostPayments - Host payment records
 * @param {Array<string>} params.listingPhotos - Listing photo URLs
 * @returns {object} Complete payload with all 4 document payloads
 */
export function buildAllDocumentPayloads({
  lease,
  proposal,
  guest,
  host,
  listing,
  guestPayments,
  hostPayments,
  listingPhotos
}) {
  return {
    hostPayout: buildHostPayoutPayload({
      lease,
      host,
      listing,
      hostPayments
    }),
    supplemental: buildSupplementalPayload({
      lease,
      proposal,
      host,
      listing,
      listingPhotos
    }),
    periodicTenancy: buildPeriodicTenancyPayload({
      lease,
      proposal,
      guest,
      host,
      listing,
      guestPayments,
      listingPhotos
    }),
    creditCardAuth: buildCreditCardAuthPayload({
      lease,
      proposal,
      guest,
      host,
      listing,
      guestPayments
    })
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract address from listing record
 *
 * @param {object} listing - Listing record
 * @returns {string} Formatted address
 */
function extractAddress(listing) {
  if (!listing) return '';

  // Try JSONB address field first
  const locationAddress = listing.address_with_lat_lng_json;
  if (locationAddress) {
    if (typeof locationAddress === 'string') {
      return locationAddress;
    }
    if (typeof locationAddress === 'object') {
      // JSONB object with address components
      const parts = [
        locationAddress.street || locationAddress.address,
        locationAddress.city,
        locationAddress.state,
        locationAddress.zip || locationAddress.zipCode
      ].filter(Boolean);
      return parts.join(', ');
    }
  }

  // Try individual location fields
  const parts = [
    listing.city,
    listing.borough,
    listing.state,
    listing.zip_code
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  // Fallback to neighborhood
  return listing.primary_neighborhood_reference_id || '';
}

/**
 * Build Type of Space description string
 *
 * @param {object} listing - Listing record
 * @returns {string} Formatted type of space
 */
function buildTypeOfSpace(listing) {
  if (!listing) return '';

  const parts = [];

  // Type of Space Label
  const spaceType = listing.space_type;
  if (spaceType) {
    let label = null;

    if (typeof spaceType === 'object' && spaceType !== null) {
      label = spaceType.label || spaceType.display || spaceType.name;
    } else if (typeof spaceType === 'string') {
      const isBubbleId = /^\d{13,}x\d+$/.test(spaceType);
      if (!isBubbleId) {
        label = spaceType;
      }
    }

    if (label) {
      parts.push(`${label},`);
    }
  }

  // SQFT Area
  const sqft = listing.square_feet;
  if (sqft) {
    parts.push(`(${Number(sqft).toLocaleString()} SQFT) -`);
  }

  // Qty Guests
  const guests = listing.max_guest_count;
  if (guests) {
    parts.push(`${guests} guest(s) max`);
  }

  return parts.join(' ');
}

/**
 * Build Space Details description string
 *
 * @param {object} listing - Listing record
 * @returns {string} Formatted space details
 */
function buildSpaceDetails(listing) {
  if (!listing) return '';

  const parts = [];

  // Bedrooms
  const bedrooms = listing.bedroom_count;
  if (bedrooms === 0) {
    parts.push('Studio');
  } else if (bedrooms && bedrooms > 0) {
    parts.push(`${bedrooms} Bedroom(s) -`);
  }

  // Beds
  const beds = listing.bed_count;
  if (beds) {
    const bedText = beds > 1 ? `${beds} bed(s) -` : `${beds} bed -`;
    parts.push(bedText);
  }

  // Bathrooms - format without decimal for whole numbers (1 instead of 1.0)
  const bathrooms = listing.bathroom_count;
  if (bathrooms && bathrooms >= 1) {
    const bathroomNum = Number(bathrooms);
    const bathroomDisplay = Number.isInteger(bathroomNum) ? String(bathroomNum) : bathroomNum.toFixed(1);
    parts.push(`${bathroomDisplay} bathroom(s)`);
  }

  // Kitchen Type
  const kitchenType = listing.kitchen_type;
  if (kitchenType) {
    const display = typeof kitchenType === 'string' ? kitchenType : kitchenType?.display;
    if (display) {
      parts.push(`- ${display}`);
    }
  }

  return parts.join(' ');
}

/**
 * Calculate weeks between two dates
 *
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of weeks (rounded up)
 */
function calculateWeeksBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.ceil(diffDays / 7);
}
