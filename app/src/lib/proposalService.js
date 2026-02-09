/**
 * Proposal Service
 *
 * Handles proposal creation via Edge Function.
 * Centralizes proposal API calls for reuse across components.
 *
 * @intent Single source of truth for proposal API interactions
 *
 * SECURITY NOTES:
 * - guestId MUST be derived from JWT (authUserId), never from localStorage/payload
 * - Edge Function validates the user on server-side
 */

import { supabase } from './supabase.js'
import { logger } from './logger.js'

/**
 * Calculate check-in/check-out days from a selection of days.
 * Handles wrap-around case (e.g., Sat-Sun spanning).
 *
 * @param {number[]} daysInJsFormat - Array of 0-indexed day numbers (0=Sun, 6=Sat)
 * @returns {{checkInDay: number, checkOutDay: number, nightsSelected: number[]}}
 */
function calculateCheckInOutFromDays(daysInJsFormat) {
  const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b)

  // Check for wrap-around case (both Saturday=6 and Sunday=0 present, but not all 7 days)
  const hasSaturday = sortedJsDays.includes(6)
  const hasSunday = sortedJsDays.includes(0)
  const isWrapAround = hasSaturday && hasSunday && daysInJsFormat.length < 7

  let checkInDay, checkOutDay, nightsSelected

  if (isWrapAround) {
    // Find the gap in the sorted selection to determine wrap-around point
    let gapIndex = -1
    for (let i = 0; i < sortedJsDays.length - 1; i++) {
      if (sortedJsDays[i + 1] - sortedJsDays[i] > 1) {
        gapIndex = i + 1
        break
      }
    }

    if (gapIndex !== -1) {
      // Wrap-around: check-in is the first day after the gap, check-out is the last day before gap
      checkInDay = sortedJsDays[gapIndex]
      checkOutDay = sortedJsDays[gapIndex - 1]

      // Reorder days to be in actual sequence (check-in to check-out)
      const reorderedDays = [...sortedJsDays.slice(gapIndex), ...sortedJsDays.slice(0, gapIndex)]

      // Nights = all days except the last one (checkout day)
      nightsSelected = reorderedDays.slice(0, -1)
    } else {
      // No gap found, use standard logic
      checkInDay = sortedJsDays[0]
      checkOutDay = sortedJsDays[sortedJsDays.length - 1]
      nightsSelected = sortedJsDays.slice(0, -1)
    }
  } else {
    // Standard case: check-in = first day, check-out = last day
    checkInDay = sortedJsDays[0]
    checkOutDay = sortedJsDays[sortedJsDays.length - 1]
    // Nights = all days except the last one (checkout day)
    nightsSelected = sortedJsDays.slice(0, -1)
  }

  return { checkInDay, checkOutDay, nightsSelected }
}

/**
 * Format reservation span weeks to human-readable text.
 *
 * @param {number} weeks - Number of weeks
 * @returns {string} Formatted text
 */
function formatReservationSpan(weeks) {
  if (weeks === 13) return '13 weeks (3 months)'
  if (weeks === 20) return '20 weeks (approx. 5 months)'
  return `${weeks} weeks`
}

/**
 * Create a new proposal via Edge Function
 *
 * @param {Object} params - Proposal parameters
 * @param {string} params.guestId - JWT-derived guest user ID (REQUIRED - must be from authUserId)
 * @param {string} params.listingId - Target listing ID
 * @param {string} params.moveInDate - Move-in date (YYYY-MM-DD)
 * @param {Object[]} params.daysSelectedObjects - Array of Day objects with dayOfWeek property
 * @param {number} params.reservationSpanWeeks - Reservation span in weeks (default: 13)
 * @param {Object} params.pricing - Price breakdown
 * @param {number} params.pricing.pricePerNight - Guest-facing nightly price (with markup)
 * @param {number} params.pricing.pricePerFourWeeks - Guest 4-week rent (with markup)
 * @param {number} params.pricing.hostFourWeekCompensation - Host 4-week compensation (without markup)
 * @param {number} params.pricing.totalPrice - Estimated booking total
 * @param {Object} params.details - About me, needs, etc.
 * @param {string} params.details.needForSpace - Need for space text
 * @param {string} params.details.aboutMe - About yourself text
 * @param {string} params.details.specialNeeds - Special needs/requirements
 * @param {string} params.details.moveInRangeText - Flexible move-in range text
 * @returns {Promise<{success: boolean, proposalId?: string, error?: string}>}
 */
export async function createProposal({
  guestId,
  listingId,
  moveInDate,
  daysSelectedObjects,
  reservationSpanWeeks = 13,
  pricing,
  details
}) {
  // SECURITY: Validate guestId is present (must be JWT-derived)
  if (!guestId) {
    logger.error('[proposalService] createProposal called without guestId - this is a security issue')
    return { success: false, error: 'Authentication required' }
  }

  if (!listingId) {
    return { success: false, error: 'Listing ID required' }
  }

  if (!daysSelectedObjects || daysSelectedObjects.length === 0) {
    return { success: false, error: 'At least one day must be selected' }
  }

  // Days are already in JS format (0-6)
  // daysSelectedObjects contains Day objects with dayOfWeek property
  const daysInJsFormat = daysSelectedObjects.map(d => d.dayOfWeek)

  // Calculate check-in/check-out
  const { checkInDay, checkOutDay, nightsSelected } = calculateCheckInOutFromDays(daysInJsFormat)

  const reservationSpanText = formatReservationSpan(reservationSpanWeeks)

  // Build the Edge Function payload
  // IMPORTANT: fourWeekRent = GUEST price (with markup), fourWeekCompensation = HOST price (without markup)
  const payload = {
    guestId,
    listingId,
    moveInStartRange: moveInDate,
    moveInEndRange: moveInDate, // Same as start if no flexibility
    daysSelected: daysInJsFormat,
    nightsSelected,
    reservationSpan: reservationSpanText,
    reservationSpanWeeks,
    checkIn: checkInDay,
    checkOut: checkOutDay,
    proposalPrice: pricing.pricePerNight,
    fourWeekRent: pricing.pricePerFourWeeks,
    hostCompensation: pricing.hostFourWeekCompensation || pricing.pricePerFourWeeks,
    estimatedBookingTotal: pricing.totalPrice,
    needForSpace: details.needForSpace || '',
    aboutMe: details.aboutMe || '',
    specialNeeds: details.specialNeeds || '',
    moveInRangeText: details.moveInRangeText || '',
    flexibleMoveIn: !!details.moveInRangeText,
    fourWeekCompensation: pricing.hostFourWeekCompensation || pricing.pricePerFourWeeks
  }

  logger.debug('[proposalService] Creating proposal:', { listingId, guestId: guestId.substring(0, 8) + '...' })

  try {
    const { data, error } = await supabase.functions.invoke('proposal', {
      body: { action: 'create', payload }
    })

    if (error) {
      logger.error('[proposalService] Edge Function error:', error)
      return { success: false, error: error.message || 'Failed to create proposal' }
    }

    if (!data?.success) {
      logger.error('[proposalService] Proposal creation failed:', data?.error)
      return { success: false, error: data?.error || 'Failed to create proposal' }
    }

    logger.debug('[proposalService] Proposal created:', data.data?.proposalId)
    return { success: true, proposalId: data.data?.proposalId }

  } catch (err) {
    logger.error('[proposalService] Unexpected error:', err)
    return { success: false, error: err.message || 'Unexpected error occurred' }
  }
}

/**
 * Fetch a proposal by ID
 *
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<{success: boolean, proposal?: Object, error?: string}>}
 */
export async function fetchProposal(proposalId) {
  if (!proposalId) {
    return { success: false, error: 'Proposal ID required' }
  }

  try {
    const { data, error } = await supabase
      .from('booking_proposal')
      .select('*')
      .eq('id', proposalId)
      .single()

    if (error) {
      logger.error('[proposalService] Failed to fetch proposal:', error)
      return { success: false, error: error.message }
    }

    return { success: true, proposal: data }
  } catch (err) {
    logger.error('[proposalService] Unexpected error fetching proposal:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Update proposal status
 *
 * @param {string} proposalId - Proposal ID
 * @param {string} status - New status
 * @param {string} userId - User making the update (for validation)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateProposalStatus(proposalId, status, userId) {
  if (!proposalId || !status || !userId) {
    return { success: false, error: 'Missing required parameters' }
  }

  try {
    const { data, error } = await supabase.functions.invoke('proposal', {
      body: {
        action: 'updateStatus',
        payload: { proposalId, status, userId }
      }
    })

    if (error) {
      logger.error('[proposalService] Failed to update proposal status:', error)
      return { success: false, error: error.message }
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Failed to update status' }
    }

    return { success: true }
  } catch (err) {
    logger.error('[proposalService] Unexpected error updating proposal:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Transform a UI listing object to the format expected by CreateProposalFlowV2.
 * Centralizes data-shaping logic that was previously in SearchPage.jsx.
 *
 * @param {Object} listing - Listing from useSearchPageLogic (transformed format)
 * @returns {Object|null} Listing in proposal modal format
 */
export function transformListingForProposal(listing) {
  if (!listing) return null

  return {
    id: listing.id,
    listing_title: listing.title || listing.listing_title,
    minimum_nights_per_stay: 2,
    maximum_nights_per_stay: 7,
    rental_type: listing.rentalType || listing.rental_type || 'Nightly',
    weeks_offered_schedule_text: listing.weeksOffered || listing.weeks_offered || listing.weeks_offered_schedule_text || 'Every week',
    // Monetary fields with Number() coercion for safety
    unit_markup_percentage: Number(listing.unit_markup_percentage) || 0,
    nightly_rate_for_2_night_stay: Number(listing.nightly_rate_for_2_night_stay) || null,
    nightly_rate_for_3_night_stay: Number(listing.nightly_rate_for_3_night_stay) || null,
    nightly_rate_for_4_night_stay: Number(listing.nightly_rate_for_4_night_stay) || null,
    nightly_rate_for_5_night_stay: Number(listing.nightly_rate_for_5_night_stay) || null,
    nightly_rate_for_7_night_stay: Number(listing.nightly_rate_for_7_night_stay) || null,
    cleaning_fee_amount: Number(listing.cleaning_fee_amount) || 0,
    damage_deposit_amount: Number(listing.damage_deposit_amount) || 0,
    monthly_rate_paid_to_host: Number(listing.monthly_rate_paid_to_host) || null,
    weekly_rate_paid_to_host: Number(listing.weekly_rate_paid_to_host) || null,
    host: listing.host
  }
}
