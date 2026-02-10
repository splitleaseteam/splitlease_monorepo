/**
 * adaptLeaseFromSupabase - Transform raw Supabase lease data to frontend model
 *
 * Handles the mapping between Bubble.io's column naming conventions
 * (spaces, mixed case) and our frontend's camelCase conventions.
 *
 * @param {Object} row - Raw row from booking_lease table
 * @returns {Object} Adapted lease object for frontend use
 */

/**
 * Map Bubble.io lease status values to normalized strings
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
  if (row?.['Lease Type']) {
    return row['Lease Type'].toLowerCase().replace(/\s+/g, '_');
  }

  const hostType = row?.host?.userType || row?.Host?.userType;
  const guestType = row?.guest?.userType || row?.Guest?.userType;

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
    return (lease.host?.id || lease.host?._id) === currentUserId ? lease.guest : lease.host;
  }
  return (lease.guest?.id || lease.guest?._id) === currentUserId ? lease.host : lease.guest;
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
  const hostId = String(lease.host?.id || lease.host?._id || '');
  const guestId = String(lease.guest?.id || lease.guest?._id || '');
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
  return (lease.guest?.id || lease.guest?._id) === currentUserId ? 'guest' : 'host';
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
    _id: row.id || row._id,
    id: row.id || row._id,
    bubbleId: row.bubble_id,
    agreementNumber: row.agreement_number || row['Agreement Number'] || null,
    proposalId: row.proposal_id || row.Proposal || null,
    leaseType,
    isCoTenant: leaseType === 'co_tenant',
    isGuestHost: leaseType === 'guest_host',

    // Direct ID references (for DateChangeRequestManager compatibility)
    hostId: row.host_user_id || row.host?.id || row.host?._id || null,
    guestId: row.guest_user_id || row.guest?.id || row.guest?._id || null,
    listingId: row.listing_id || row.listing?.id || row.listing?._id || null,

    // Bubble-style field aliases (for backward compatibility)
    Host: row.host_user_id || row.host?.id || row.host?._id || null,
    Guest: row.guest_user_id || row.guest?.id || row.guest?._id || null,
    Listing: row.listing_id || row.listing?.id || row.listing?._id || null,

    // Status
    status: mapLeaseStatus(row['Lease Status']),
    leaseSigned: row['Lease signed?'] || false,

    // Dates
    startDate: parseDate(row.reservation_start_date || row['Reservation Period : Start']),
    endDate: parseDate(row.reservation_end_date || row['Reservation Period : End']),
    createdAt: parseDate(row.original_created_at),
    modifiedAt: parseDate(row.original_updated_at),
    firstPaymentDate: parseDate(row['First Payment Date']),

    // Date aliases (for DateChangeRequestManager compatibility)
    reservationStart: parseDate(row.reservation_start_date || row['Reservation Period : Start']),
    reservationEnd: parseDate(row.reservation_end_date || row['Reservation Period : End']),
    'Reservation Period : Start': row.reservation_start_date || row['Reservation Period : Start'] || null,
    'Reservation Period : End': row.reservation_end_date || row['Reservation Period : End'] || null,

    // Financial
    totalRent: parseFloat(row['Total Rent']) || 0,
    totalCompensation: parseFloat(row['Total Compensation']) || 0,
    paidToDate: parseFloat(row['Paid to Date from Guest']) || 0,
    'Total Rent': parseFloat(row['Total Rent']) || 0,

    // Week tracking
    currentWeekNumber: parseInt(row['current week number']) || null,
    totalWeekCount: parseInt(row['total week count']) || null,

    // Related entities (adapted from joins)
    guest: row.guest ? adaptUserFromSupabase(row.guest) : null,
    host: row.host ? adaptUserFromSupabase(row.host) : null,
    listing: row.listing ? adaptListingFromSupabase(row.listing) : null,
    propertyName: row.listing?.listing_title || row.listing?.Name || row.listing?.name || null,
    propertyAddress: row.listing?.Address || row.listing?.address || null,

    /**
     * Get the other co-tenant in a co-tenant lease
     * @param {string} currentUserId - Current user ID to exclude
     * @returns {Object|null} The other co-tenant user object
     */
    getCoTenant(currentUserId) {
      return getCoTenantForLease(this, currentUserId);
    },

    /**
     * @deprecated Use getCoTenant() instead. This method will be removed in a future release.
     * Get the other co-tenant in a co-tenant lease (legacy alias)
     * @param {string} currentUserId - Current user ID to exclude
     * @returns {Object|null} The other co-tenant user object
     */
    getRoommate(currentUserId) {
      return this.getCoTenant(currentUserId);
    },

    getCounterparty(currentUserId) {
      return getCounterparty(this, currentUserId);
    },
    getUserRole(currentUserId) {
      return getUserRole(this, currentUserId);
    },
    proposal: row.proposal ? {
      id: row.proposal.id || row.proposal._id,
      checkInDay: parseInt(row.proposal.checkin_day_of_week_number || row.proposal['check in day']) ?? null,
      checkOutDay: parseInt(row.proposal.checkout_day_of_week_number || row.proposal['check out day']) ?? null,
    } : null,

    // Weekly schedule (from proposal)
    checkInDay: row.proposal ? parseInt(row.proposal.checkin_day_of_week_number || row.proposal['check in day']) ?? null : null,
    checkOutDay: row.proposal ? parseInt(row.proposal.checkout_day_of_week_number || row.proposal['check out day']) ?? null : null,

    // Stays (from join or JSONB)
    stays: Array.isArray(row.stays)
      ? row.stays.map(adaptStayFromSupabase)
      : parseJsonbArray(row['List of Stays']),

    // Booked dates (from JSONB)
    bookedDates: parseJsonbArray(row['List of Booked Dates']),
    bookedDatesAfterRequest: parseJsonbArray(row['List of Booked Dates after Requests']),
    'List of Booked Dates': parseJsonbArray(row['List of Booked Dates']),

    // Payment records (from join)
    paymentRecords: Array.isArray(row.paymentRecords)
      ? row.paymentRecords.map(adaptPaymentRecordFromSupabase)
      : [],

    // Date change requests (from join)
    dateChangeRequests: Array.isArray(row.dateChangeRequests)
      ? row.dateChangeRequests.map(adaptDateChangeRequestFromSupabase)
      : [],

    // Documents
    documents: row.documents || [],
    periodicTenancyAgreement: row['Periodic Tenancy Agreement'] || null,
    supplementalAgreement: row['supplemental agreement'] || row['Supplemental Agreement'] || null,
    creditCardAuthorizationForm: row['Form Credit Card Authorization'] || null,

    // Other fields
    thread: row.Thread || null,
    checkInCode: row['Check-in Code'] || null,
    cancellationPolicy: row.cancellation_policy || null,
    hostPayoutSchedule: row['Host Payout Schedule'] || null,
    wereDocumentsGenerated: row['were documents generated?'] || false,

    // Throttling flags
    throttling: {
      guestCanCreateRequests: row['Throttling - guest ability to create requests?'] ?? true,
      hostCanCreateRequests: row['Throttling- host ability to create requests?'] ?? true,
      guestShowWarning: !row['Throttling - guest NOT show warning popup'],
      hostShowWarning: !row['Throttling - host NOT show warning popup'],
    },

    // Reputation
    guestReputationScore: parseInt(row['Reputation Score (GUEST)']) || null,
    hostReputationScore: parseInt(row['Reputation Score (HOST)']) || null,

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
    _id: user.id,
    id: user.id,
    email: user.email || null,
    firstName: user.first_name || null,
    lastName: user.last_name || null,
    fullName: user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : null,
    phone: user.phone_number || user.phone || null,
    avatarUrl: user.profile_photo_url || user.avatar_url || null,
    isVerified: user['user verified?'] || false,
  };
}

/**
 * Adapt listing data from Supabase join
 */
function adaptListingFromSupabase(listing) {
  if (!listing) return null;

  return {
    _id: listing.id || listing._id,
    id: listing.id || listing._id,
    name: listing.listing_title || listing.name || 'Unnamed Listing',
    address: listing.address_with_lat_lng_json || listing.address || null,
    neighborhood: listing.primary_neighborhood_reference_id || listing.neighborhood || null,
    city: listing.city || null,
    state: listing.state || null,
    zipCode: listing.zip_code || null,
    imageUrl: listing['Cover Photo'] || listing['Primary Image'] || listing.image_url || null,
  };
}

/**
 * Adapt stay data from Supabase join
 */
function adaptStayFromSupabase(stay) {
  if (!stay) return null;

  return {
    _id: stay._id,
    id: stay._id,
    status: stay['Stay Status'] || 'unknown',
    assignedTo: stay['Assigned to'] || stay.assignedTo || stay.assigned_to || null,
    checkIn: parseDate(stay['Check In (night)']),
    checkOut: parseDate(stay['Check-out day']),
    lastNight: parseDate(stay['Last Night (night)']),
    weekNumber: parseInt(stay['Week Number']) || null,
    amount: parseFloat(stay.Amount) || 0,
    firstIndex: parseInt(stay['first index']) || null,
    lastIndex: parseInt(stay['last index']) || null,
    nights: parseJsonbArray(stay.Nights),
    dates: parseJsonbArray(stay['Dates - List of dates in this period']),
    reviewSubmittedByGuest: stay['Review Submitted by Guest'] || null,
    reviewSubmittedByHost: stay['Review Submitted by Host'] || null,
  };
}

/**
 * Adapt payment record from Supabase
 */
function adaptPaymentRecordFromSupabase(payment) {
  if (!payment) return null;

  return {
    _id: payment._id,
    id: payment._id,
    leaseId: payment['Booking - Reservation'],
    paymentNumber: payment['Payment #'],
    scheduledDate: parseDate(payment['Scheduled Date']),
    actualDate: parseDate(payment['Actual Date']),
    rent: parseFloat(payment['Rent Amount']) || 0,
    maintenanceFee: parseFloat(payment['Maintenance Fee']) || 0,
    damageDeposit: parseFloat(payment['Damage Deposit']) || 0,
    totalAmount: parseFloat(payment['Total Amount']) || 0,
    bankTransactionNumber: payment['Bank Transaction Number'] || null,
    receiptUrl: payment['Payment Receipt'] || null,
    isPaid: payment['Is Paid'] || false,
    isRefunded: payment['Is Refunded'] || false,
  };
}

/**
 * Adapt date change request from Supabase
 */
export function adaptDateChangeRequestFromSupabase(dcr) {
  if (!dcr) return null;

  return {
    _id: dcr._id,
    id: dcr._id,
    leaseId: dcr.Lease,
    requestedById: dcr['Requested by'],
    requestReceiverId: dcr['Request receiver'],
    requestedBy: dcr.requestedByUser ? adaptUserFromSupabase(dcr.requestedByUser) : null,
    requestStatus: dcr.status,
    stayAssociated1: dcr['Stay Associated 1'],
    stayAssociated2: dcr['Stay Associated 2'],
    requestType: dcr['Request Type'],
    listOfOldDates: parseJsonbArray(dcr['Original Date']),
    listOfNewDates: parseJsonbArray(dcr['Requested Date']),
    priceAdjustment: dcr['Price Adjustment'],
    dateAdded: parseDate(dcr.original_created_at),
    visibleToGuest: dcr['visible to guest'] ?? true,
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
