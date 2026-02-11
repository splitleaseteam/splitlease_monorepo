/**
 * Data Transformation Utilities for Guest Proposals
 * Transforms Bubble.io data structure to cleaner, more usable format
 *
 * Handles:
 * - Field name normalization (removes spaces, special characters)
 * - Nested object flattening
 * - Type conversions
 * - Default values for missing data
 */

// Re-export formatPrice from the canonical source for backward compatibility
export { formatPrice } from '../formatters.js';

/**
 * Transform user data from Bubble.io format
 *
 * @param {Object} rawUser - Raw user object from Supabase
 * @returns {Object} Transformed user object
 */
export function transformUserData(rawUser) {
  if (!rawUser) return null;

  return {
    id: rawUser.id,
    firstName: rawUser.first_name,
    lastName: rawUser.last_name,
    fullName: rawUser.first_name && rawUser.last_name
      ? `${rawUser.first_name} ${rawUser.last_name}`
      : null,
    profilePhoto: rawUser.profile_photo_url,
    proposalsList: rawUser.listings_json
  };
}

/**
 * Transform listing data from Bubble.io format
 *
 * @param {Object} rawListing - Raw listing object from Supabase
 * @returns {Object} Transformed listing object
 */
export function transformListingData(rawListing) {
  if (!rawListing) return null;

  // Extract address from JSONB structure
  const addressData = rawListing.address_with_lat_lng_json;
  const addressString = typeof addressData === 'object' && addressData?.address
    ? addressData.address
    : (typeof addressData === 'string' ? addressData : null);

  return {
    id: rawListing._id,
    name: rawListing.Name,
    description: rawListing.Description,
    address: addressString,
    addressData: addressData, // Keep full JSONB for map coordinates
    borough: rawListing.borough,
    hood: rawListing.primary_neighborhood_reference_id,
    boroughName: rawListing.boroughName, // Resolved name from lookup table
    hoodName: rawListing.hoodName, // Resolved name from lookup table
    city: rawListing.city,
    state: rawListing.state,
    zipCode: rawListing.zip_code,
    photos: rawListing.photos_with_urls_captions_and_sort_order_json,
    featuredPhotoUrl: rawListing.featuredPhotoUrl, // Featured photo from listing_photo table
    houseRules: rawListing.houseRules || [], // Use resolved house rules from query layer
    checkInTime: rawListing.checkin_time_of_day,
    checkOutTime: rawListing.checkout_time_of_day
  };
}

/**
 * Transform host data from Bubble.io format
 *
 * @param {Object} rawHost - Raw host object from Supabase
 * @returns {Object} Transformed host object
 */
export function transformHostData(rawHost) {
  if (!rawHost) return null;

  return {
    id: rawHost.id,
    firstName: rawHost.first_name,
    lastName: rawHost.last_name,
    fullName: rawHost.first_name && rawHost.last_name
      ? `${rawHost.first_name} ${rawHost.last_name}`
      : null,
    profilePhoto: rawHost.profile_photo_url,
    bio: rawHost.bio_text,
    linkedInVerified: rawHost['Verify - Linked In ID'],
    phoneVerified: rawHost['Verify - Phone'],
    userVerified: rawHost['user verified?']
  };
}

/**
 * Transform guest data from Bubble.io format
 *
 * @param {Object} rawGuest - Raw guest object from Supabase
 * @returns {Object} Transformed guest object
 */
export function transformGuestData(rawGuest) {
  if (!rawGuest) return null;

  return {
    id: rawGuest.id,
    firstName: rawGuest.first_name,
    lastName: rawGuest.last_name,
    fullName: rawGuest.first_name && rawGuest.last_name
      ? `${rawGuest.first_name} ${rawGuest.last_name}`
      : null,
    profilePhoto: rawGuest.profile_photo_url,
    bio: rawGuest.bio_text,
    linkedInVerified: rawGuest['Verify - Linked In ID'],
    phoneVerified: rawGuest['Verify - Phone'],
    userVerified: rawGuest['user verified?']
  };
}

/**
 * Transform virtual meeting data from Bubble.io format
 *
 * @param {Object} rawVirtualMeeting - Raw virtual meeting object from Supabase
 * @returns {Object} Transformed virtual meeting object
 */
export function transformVirtualMeetingData(rawVirtualMeeting) {
  if (!rawVirtualMeeting) return null;

  return {
    id: rawVirtualMeeting._id,
    bookedDate: rawVirtualMeeting['booked date'],
    confirmedBySplitlease: rawVirtualMeeting.confirmedBySplitLease,
    meetingLink: rawVirtualMeeting['meeting link'],
    meetingDeclined: rawVirtualMeeting['meeting declined'],
    requestedBy: rawVirtualMeeting['requested by'],
    suggestedTimeslots: rawVirtualMeeting['suggested dates and times'], // JSONB array of ISO datetimes
    guestName: rawVirtualMeeting['guest name'],
    hostName: rawVirtualMeeting.host_display_name,
    proposalId: rawVirtualMeeting.proposal
  };
}

/**
 * Transform complete proposal data from Bubble.io format
 * Includes nested transformations for listing, host, and virtual meeting
 *
 * @param {Object} rawProposal - Raw proposal object from Supabase
 * @returns {Object} Transformed proposal object
 */
export function transformProposalData(rawProposal) {
  if (!rawProposal) return null;

  // Extract nested data
  const rawListing = rawProposal.listing;
  const rawHost = rawListing?.host;
  const rawGuest = rawProposal.guest;
  const rawVirtualMeeting = rawProposal.virtualMeeting;

  return {
    id: rawProposal._id,
    status: rawProposal.Status,
    deleted: rawProposal.Deleted,
    daysSelected: rawProposal['Days Selected'],
    nightsSelected: rawProposal['Nights Selected (Nights list)'],
    reservationWeeks: rawProposal['Reservation Span (Weeks)'],
    nightsPerWeek: rawProposal['nights per week (num)'],
    checkInDay: rawProposal['check in day'],
    checkOutDay: rawProposal['check out day'],
    moveInStart: rawProposal['Move in range start'],
    moveInEnd: rawProposal['Move in range end'],
    totalPrice: rawProposal['Total Price for Reservation (guest)'],
    nightlyPrice: rawProposal['proposal nightly price'],
    cleaningFee: rawProposal['cleaning fee'],
    damageDeposit: rawProposal['damage deposit'],
    counterOfferHappened: rawProposal['counter offer happened'],
    hostCounterOfferDaysSelected: rawProposal['host_counter_offer_days_selected'],
    hostCounterOfferReservationWeeks: rawProposal['host_counter_offer_reservation_span_weeks'],
    hostCounterOfferTotalPrice: rawProposal['host_counter_offer_total_price'],
    hostCounterOfferNightlyPrice: rawProposal['host_counter_offer_nightly_price'],
    createdDate: rawProposal.original_created_at,
    modifiedDate: rawProposal.original_updated_at,
    aboutYourself: rawProposal.about_yourself,
    specialNeeds: rawProposal.special_needs,
    reasonForCancellation: rawProposal['reason for cancellation'],
    proposalStage: rawProposal['Proposal Stage'],
    rentalApplicationId: rawProposal['rental application'],
    virtualMeetingId: rawProposal['virtual meeting'],
    isFinalized: rawProposal['Is Finalized'],

    // House rules (resolved from query layer)
    houseRules: rawProposal.houseRules || [],

    // Nested transformed data
    listing: transformListingData(rawListing),
    host: transformHostData(rawHost),
    guest: transformGuestData(rawGuest),
    virtualMeeting: transformVirtualMeetingData(rawVirtualMeeting)
  };
}

/**
 * Get display text for proposal in dropdown
 * Format: "{host name} - {listing name}"
 * Shows the host who owns the listing, allowing guests to identify proposals by host
 *
 * @param {Object} proposal - Transformed proposal object
 * @returns {string} Display text for dropdown option
 */
export function getProposalDisplayText(proposal) {
  if (!proposal) return null;

  const hostName = proposal.host?.firstName || proposal.host?.fullName || 'Host';
  const listingName = proposal.listing?.name || 'Property';

  return `${hostName} - ${listingName}`;
}

/**
 * Format date for display
 *
 * @param {string|Date} date - Date value
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return null;

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return null;

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
