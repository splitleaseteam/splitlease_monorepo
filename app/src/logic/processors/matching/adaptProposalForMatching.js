/**
 * Adapt a proposal record for the matching algorithm.
 *
 * @intent Transform proposal data into normalized structure for matching.
 * @rule Extracts schedule, pricing, and listing context fields.
 * @rule Handles both DB snake_case and processed camelCase formats.
 *
 * @param {object} rawProposal - Raw or processed proposal object.
 * @returns {object} Adapted proposal object for matching.
 *
 * @throws {Error} If rawProposal is null or undefined.
 *
 * @example
 * adaptProposalForMatching({
 *   id: 'prop123',
 *   guest_selected_days_numbers_json: [1, 2, 3, 4],
 *   nights_per_week_count: 4,
 *   calculated_nightly_price: 100,
 *   listing: { boroughName: 'Manhattan' }
 * })
 * // => {
 * //   id: 'prop123',
 * //   daysSelected: [1, 2, 3, 4],
 * //   nightsPerWeek: 4,
 * //   nightlyPrice: 100,
 * //   listing: { boroughName: 'Manhattan', borough: null }
 * // }
 */
export function adaptProposalForMatching(rawProposal) {
  if (!rawProposal) {
    throw new Error('adaptProposalForMatching: rawProposal is required');
  }

  // Handle both camelCase and DB snake_case formats
  const daysSelected =
    rawProposal.daysSelected ||
    rawProposal.guest_selected_days_numbers_json ||
    [];

  const nightsPerWeek =
    rawProposal.nightsPerWeek ||
    rawProposal.nights_per_week_count ||
    daysSelected.length ||
    0;

  const nightlyPrice =
    rawProposal.nightlyPrice ||
    rawProposal.calculated_nightly_price ||
    0;

  // Extract listing info (may be nested or at top level)
  const listingData = rawProposal.listing || {};
  const listingBorough =
    listingData.boroughName ||
    listingData.borough ||
    rawProposal.listing_borough ||
    null;

  return {
    // Core identifier
    id: rawProposal.id,

    // Schedule
    daysSelected,
    nightsSelected: rawProposal.nightsSelected || rawProposal.guest_selected_nights_numbers_json || [],
    nightsPerWeek,
    checkInDay: rawProposal.checkInDay || rawProposal.checkin_day_of_week_number || null,
    checkOutDay: rawProposal.checkOutDay || rawProposal.checkout_day_of_week_number || null,
    reservationWeeks: rawProposal.reservationWeeks || rawProposal.reservation_span_in_weeks || 0,

    // Move-in range
    moveInStart: rawProposal.moveInStart || rawProposal.move_in_range_start_date || null,
    moveInEnd: rawProposal.moveInEnd || rawProposal.move_in_range_end_date || null,

    // Pricing
    nightlyPrice,
    totalPrice: rawProposal.totalPrice || rawProposal.total_reservation_price_for_guest || 0,
    cleaningFee: rawProposal.cleaningFee || rawProposal.cleaning_fee_amount || 0,
    damageDeposit: rawProposal.damageDeposit || rawProposal.damage_deposit_amount || 0,

    // Listing context (for borough matching)
    listing: {
      id: listingData.id || rawProposal.listing_id || null,
      boroughName: listingBorough,
      borough: listingBorough,
      hoodName: listingData.hoodName || listingData.hood || null,
      name: listingData.listing_title || null
    },

    // Guest info
    guestId: rawProposal.guestId || rawProposal.guest_user_id || null
  };
}
