/**
 * adaptLeaseFromSupabase - Transform raw Supabase lease data to frontend model
 *
 * Handles the mapping between Bubble.io's column naming conventions
 * (spaces, mixed case) and our frontend's camelCase conventions.
 *
 * @param {Object} row - Raw row from bookings_leases table
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
 * Adapt a single lease record from Supabase format
 * @param {Object} row - Raw bookings_leases row with joins
 * @returns {Object} Frontend-friendly lease object
 */
export function adaptLeaseFromSupabase(row) {
  if (!row) return null;

  return {
    // Core identifiers
    _id: row._id,
    id: row._id,
    bubbleId: row.bubble_id,
    agreementNumber: row['Agreement Number'] || null,
    proposalId: row.Proposal || null,

    // Direct ID references (for DateChangeRequestManager compatibility)
    hostId: row.Host || row.host?._id || null,
    guestId: row.Guest || row.guest?._id || null,
    listingId: row.Listing || row.listing?._id || null,

    // Bubble-style field aliases (for backward compatibility)
    Host: row.Host || row.host?._id || null,
    Guest: row.Guest || row.guest?._id || null,
    Listing: row.Listing || row.listing?._id || null,

    // Status
    status: mapLeaseStatus(row['Lease Status']),
    leaseSigned: row['Lease signed?'] || false,

    // Dates
    startDate: parseDate(row['Reservation Period : Start']),
    endDate: parseDate(row['Reservation Period : End']),
    createdAt: parseDate(row['Created Date']),
    modifiedAt: parseDate(row['Modified Date']),
    firstPaymentDate: parseDate(row['First Payment Date']),

    // Date aliases (for DateChangeRequestManager compatibility)
    reservationStart: parseDate(row['Reservation Period : Start']),
    reservationEnd: parseDate(row['Reservation Period : End']),
    'Reservation Period : Start': row['Reservation Period : Start'] || null,
    'Reservation Period : End': row['Reservation Period : End'] || null,

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
    propertyName: row.listing?.Name || row.listing?.['Listing Title'] || row.listing?.name || null,
    propertyAddress: row.listing?.Address || row.listing?.address || null,
    getRoommate(currentUserId) {
      if (this.host?._id === currentUserId) return this.guest;
      if (this.guest?._id === currentUserId) return this.host;
      return this.coTenant || this.host || this.guest;
    },
    proposal: row.proposal ? {
      id: row.proposal._id,
      checkInDay: parseInt(row.proposal['check in day']) ?? null,
      checkOutDay: parseInt(row.proposal['check out day']) ?? null,
    } : null,

    // Weekly schedule (from proposal)
    checkInDay: row.proposal ? parseInt(row.proposal['check in day']) ?? null : null,
    checkOutDay: row.proposal ? parseInt(row.proposal['check out day']) ?? null : null,

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
    cancellationPolicy: row['Cancellation Policy'] || null,
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
    _id: user._id,
    id: user._id,
    email: user.email || user.Email || null,
    firstName: user['Name - First'] || user['First Name'] || user.first_name || null,
    lastName: user['Name - Last'] || user['Last Name'] || user.last_name || null,
    fullName: user['Name - Full'] || null,
    phone: user['Phone Number'] || user.Phone || user.phone || null,
    avatarUrl: user['Profile Photo'] || user.avatar_url || null,
    isVerified: user['user verified?'] || false,
  };
}

/**
 * Adapt listing data from Supabase join
 */
function adaptListingFromSupabase(listing) {
  if (!listing) return null;

  return {
    _id: listing._id,
    id: listing._id,
    name: listing.Name || listing['Listing Title'] || listing.name || 'Unnamed Listing',
    address: listing.Address || listing.address || null,
    neighborhood: listing.Neighborhood || listing.neighborhood || null,
    city: listing.City || listing.city || null,
    state: listing.State || listing.state || null,
    zipCode: listing['Zip Code'] || listing.zip_code || null,
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
    dateAdded: parseDate(dcr['Created Date']),
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
