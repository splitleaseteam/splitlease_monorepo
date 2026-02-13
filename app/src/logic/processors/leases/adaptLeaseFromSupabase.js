/**
 * adaptLeaseFromSupabase - Transform raw Supabase lease data to frontend model
 *
 * Maps snake_case DB column names to frontend camelCase conventions.
 * Stays, payments, and date change requests arrive as raw DB rows.
 *
 * @param {Object} row - Raw row from booking_lease table
 * @returns {Object} Adapted lease object for frontend use
 */

/**
 * Map lease status values to normalized strings
 * @param {string} rawStatus - Raw status from database
 * @returns {string} Normalized status
 */
function mapLeaseStatus(rawStatus) {
  if (!rawStatus) return 'unknown';

  const statusMap = {
    'Active': 'active',
    'active': 'active',
    'Completed': 'completed',
    'completed': 'completed',
    'Cancelled': 'cancelled',
    'cancelled': 'cancelled',
    'Pending': 'pending',
    'pending': 'pending',
    'Draft': 'draft',
    'draft': 'draft',
  };

  return statusMap[rawStatus] || rawStatus.toLowerCase();
}

/**
 * Safely parse a date string
 * @param {string|null} dateStr - Date string or null
 * @returns {Date|null} Parsed Date or null
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Derive lease type from row data
 * @param {Object} row - Raw booking_lease row with joins
 * @returns {string} Lease type identifier
 */
function deriveLeaseType(row) {
  if (row?.lease_type) {
    return row.lease_type.toLowerCase().replace(/\s+/g, '_');
  }

  const hostType = row?.host?.userType;
  const guestType = row?.guest?.userType;

  if (hostType === 'Guest' && guestType === 'Guest') {
    return 'co_tenant';
  }

  return 'guest_host';
}

/**
 * Get lease counterparty based on lease type
 * @param {Object} lease - Adapted lease object
 * @param {string} currentUserId - Current user ID
 * @returns {Object|null} Counterparty user
 */
function getCounterparty(lease, currentUserId) {
  if (!lease) return null;
  if (lease.leaseType === 'co_tenant') {
    return lease.host?.id === currentUserId ? lease.guest : lease.host;
  }
  return lease.guest?.id === currentUserId ? lease.host : lease.guest;
}

/**
 * Get the other co-tenant in a co-tenant lease
 * For co-tenant leases: returns the OTHER co-tenant, not the current user
 * @param {Object} lease - Adapted lease object with host and guest
 * @param {string} currentUserId - Current user ID to exclude
 * @returns {Object|null} The other co-tenant user object
 */
function getCoTenantForLease(lease, currentUserId) {
  if (!lease) return null;

  // Compare as strings to handle ID format differences
  const hostId = String(lease.host?.id || '');
  const guestId = String(lease.guest?.id || '');
  const userId = String(currentUserId || '');

  if (hostId && hostId === userId) return lease.guest;
  if (guestId && guestId === userId) return lease.host;

  // Fallback: If we can't determine current user, compare by lease role
  // For co-tenant, both are "guests" so return whichever we have that isn't empty
  console.warn('[getCoTenant] Could not match currentUserId to host/guest', {
    currentUserId, hostId, guestId
  });
  return lease.guest || lease.host;
}

/**
 * Get user role based on lease type
 * @param {Object} lease - Adapted lease object
 * @param {string} currentUserId - Current user ID
 * @returns {string} Role identifier
 */
function getUserRole(lease, currentUserId) {
  if (!lease) return 'unknown';
  if (lease.leaseType === 'co_tenant') {
    return 'co_tenant';
  }
  return lease.guest?.id === currentUserId ? 'guest' : 'host';
}

/**
 * Adapt a single lease record from Supabase format
 * @param {Object} row - Raw booking_lease row with joins
 * @returns {Object} Frontend-friendly lease object
 */
export function adaptLeaseFromSupabase(row) {
  if (!row) return null;

  const leaseType = deriveLeaseType(row);

  return {
    // Core identifiers
    id: row.id,
    agreementNumber: row.agreement_number || null,
    proposalId: null,
    leaseType,
    isCoTenant: leaseType === 'co_tenant',
    isGuestHost: leaseType === 'guest_host',

    // Direct ID references
    hostId: row.host_user_id || row.host?.id || null,
    guestId: row.guest_user_id || row.guest?.id || null,
    listingId: row.listing_id || row.listing?.id || null,

    // Status
    status: mapLeaseStatus(row.lease_type),
    leaseSigned: row.is_lease_signed || false,

    // Dates
    startDate: parseDate(row.reservation_start_date),
    endDate: parseDate(row.reservation_end_date),
    createdAt: parseDate(row.created_at),
    modifiedAt: parseDate(row.updated_at),
    firstPaymentDate: parseDate(row.first_payment_date),

    // Date aliases (for DateChangeRequestManager compatibility)
    reservationStart: parseDate(row.reservation_start_date),
    reservationEnd: parseDate(row.reservation_end_date),

    // Financial
    totalRent: parseFloat(row.total_guest_rent_amount) || 0,
    totalCompensation: parseFloat(row.total_host_compensation_amount) || 0,

    // Week tracking
    currentWeekNumber: parseInt(row.current_week_number) || null,
    totalWeekCount: parseInt(row.total_week_count) || null,

    // Related entities (adapted from joins)
    guest: row.guest ? adaptUserFromSupabase(row.guest) : null,
    host: row.host ? adaptUserFromSupabase(row.host) : null,
    listing: row.listing ? adaptListingFromSupabase(row.listing) : null,
    propertyName: row.listing?.listing_title || null,
    propertyAddress: row.listing?.address_with_lat_lng_json || null,

    getCoTenant(currentUserId) {
      return getCoTenantForLease(this, currentUserId);
    },
    getCounterparty(currentUserId) {
      return getCounterparty(this, currentUserId);
    },
    getUserRole(currentUserId) {
      return getUserRole(this, currentUserId);
    },

    proposal: row.proposal ? {
      id: row.proposal.id,
      checkInDay: parseInt(row.proposal.checkin_day_of_week_number) ?? null,
      checkOutDay: parseInt(row.proposal.checkout_day_of_week_number) ?? null,
    } : null,

    // Weekly schedule (from proposal)
    checkInDay: row.proposal ? parseInt(row.proposal.checkin_day_of_week_number) ?? null : null,
    checkOutDay: row.proposal ? parseInt(row.proposal.checkout_day_of_week_number) ?? null : null,

    // Stays (from join)
    stays: Array.isArray(row.stays)
      ? row.stays.map(adaptStayFromSupabase)
      : [],

    // Booked dates
    bookedDates: parseJsonbArray(row.booked_dates_json),

    // Payment records (from join)
    paymentRecords: Array.isArray(row.paymentRecords)
      ? row.paymentRecords.map(adaptPaymentRecordFromSupabase)
      : [],

    // Date change requests (from join)
    dateChangeRequests: Array.isArray(row.dateChangeRequests)
      ? row.dateChangeRequests.map(adaptDateChangeRequestFromSupabase)
      : [],

    // Booked dates (post-request variant for admin calendar)
    bookedDatesAfterRequest: parseJsonbArray(row.booked_dates_after_requests_json),

    // Document references (DB columns store IDs; keep property names for consumer compatibility)
    documents: row.documents || [],
    periodicTenancyAgreement: row.periodic_tenancy_agreement_id || null,
    supplementalAgreement: row.supplemental_agreement_id || null,
    creditCardAuthorizationForm: row.credit_card_authorization_form_id || null,

    // Other fields
    thread: row.thread_id || null,
    checkInCode: null,
    cancellationPolicy: row.cancellation_policy_text || null,
    hostPayoutSchedule: row.host_payout_schedule_document_id || null,
    wereDocumentsGenerated: row.were_legal_documents_generated || false,
    paidToDate: 0,

    // Throttling flags
    throttling: {
      guestCanCreateRequests: row.guest_can_create_date_change_requests ?? true,
      hostCanCreateRequests: row.host_can_create_date_change_requests ?? true,
      guestShowWarning: !(row.hide_guest_throttle_warning_popup ?? false),
      hostShowWarning: !(row.hide_host_throttle_warning_popup ?? false),
    },

    // Sync status
    pending: row.pending || false,
  };
}

/**
 * Adapt user data from Supabase join
 */
function adaptUserFromSupabase(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || null,
    firstName: user.first_name || null,
    lastName: user.last_name || null,
    fullName: user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : null,
    phone: user.phone_number || user.phone || null,
    avatarUrl: user.profile_photo_url || user.avatar_url || null,
    isVerified: user.is_user_verified || false,
  };
}

/**
 * Adapt listing data from Supabase join
 */
function adaptListingFromSupabase(listing) {
  if (!listing) return null;

  return {
    id: listing.id,
    name: listing.listing_title || listing.name || 'Unnamed Listing',
    address: listing.address_with_lat_lng_json || listing.address || null,
    neighborhood: listing.primary_neighborhood_reference_id || listing.neighborhood || null,
    city: listing.city || null,
    state: listing.state || null,
    zipCode: listing.zip_code || null,
    imageUrl: listing.image_url || null,
  };
}

/**
 * Adapt stay data from Supabase (snake_case DB columns)
 */
function adaptStayFromSupabase(stay) {
  if (!stay) return null;

  return {
    id: stay.id,
    leaseId: stay.lease_id || null,
    status: stay.stay_status || 'unknown',
    assignedTo: stay.assigned_to || null,
    checkIn: parseDate(stay.checkin_night_date),
    checkOut: parseDate(stay.checkout_day_date),
    lastNight: parseDate(stay.last_night_date),
    weekNumber: parseInt(stay.week_number_in_lease) || null,
    amount: parseFloat(stay.amount) || 0,
    firstIndex: parseInt(stay.first_night_index_in_lease) || null,
    lastIndex: parseInt(stay.last_night_index_in_lease) || null,
    nights: parseJsonbArray(stay.night_names_in_this_week_json),
    dates: parseJsonbArray(stay.dates_in_this_stay_period_json),
    guestUserId: stay.guest_user_id || null,
    hostUserId: stay.host_user_id || null,
    listingId: stay.listing_id || null,
  };
}

/**
 * Adapt payment record from Supabase (snake_case DB columns)
 */
function adaptPaymentRecordFromSupabase(payment) {
  if (!payment) return null;

  return {
    id: payment.id,
    leaseId: payment.booking_reservation,
    paymentNumber: payment.payment,
    scheduledDate: parseDate(payment.scheduled_date),
    actualDate: parseDate(payment.actual_date_of_payment),
    rent: parseFloat(payment.rent) || 0,
    maintenanceFee: parseFloat(payment.maintenance_fee) || 0,
    damageDeposit: parseFloat(payment.damage_deposit) || 0,
    totalAmount: parseFloat(payment.total_paid_by_guest) || 0,
    bankTransactionNumber: payment.bank_transaction_number || null,
    receiptUrl: payment.payment_receipt || null,
    isPaid: payment.payment_from_guest || false,
    pending: payment.pending || false,
  };
}

/**
 * Adapt date change request from Supabase (snake_case DB columns)
 */
export function adaptDateChangeRequestFromSupabase(dcr) {
  if (!dcr) return null;

  return {
    id: dcr.id,
    leaseId: dcr.lease,
    requestedById: dcr.requested_by,
    requestReceiverId: dcr.request_receiver,
    requestedBy: dcr.requestedByUser ? adaptUserFromSupabase(dcr.requestedByUser) : null,
    requestStatus: dcr.request_status,
    stayAssociated1: dcr.stay_associated_1,
    stayAssociated2: dcr.stay_associated_2,
    requestType: dcr.type_of_request,
    listOfOldDates: parseJsonbArray(dcr.list_of_old_dates_in_the_stay),
    listOfNewDates: parseJsonbArray(dcr.list_of_new_dates_in_the_stay),
    priceAdjustment: dcr.price_rate_of_the_night,
    dateAdded: parseDate(dcr.original_created_at),
    visibleToGuest: dcr.visible_to_the_guest ?? true,
  };
}

/**
 * Safely parse JSONB array field
 */
function parseJsonbArray(jsonbField) {
  if (Array.isArray(jsonbField)) return jsonbField;
  if (typeof jsonbField === 'string') {
    try {
      return JSON.parse(jsonbField);
    } catch {
      return [];
    }
  }
  return [];
}

export default adaptLeaseFromSupabase;
