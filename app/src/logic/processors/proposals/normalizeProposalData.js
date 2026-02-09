import { normalizeGuestData } from './normalizeGuestData.js';

/**
 * Normalize proposal data from Bubble format to V7 component format
 *
 * @intent Transform Bubble-format field names to camelCase for V7 components
 * @rule Handles both string and object status formats
 * @rule Returns null for null/undefined input
 *
 * @param {Object} proposal - Raw proposal from database
 * @param {Object} normalizedGuest - Already normalized guest data
 * @returns {Object|null} Normalized proposal or null
 */
export function normalizeProposalData(proposal, normalizedGuest = null) {
  if (!proposal) return null;

  // Status normalization - handle both string and object formats
  const rawStatus = proposal.proposal_workflow_status || proposal.status || '';
  const status = typeof rawStatus === 'string' ? rawStatus.toLowerCase().replace(/\s+/g, '_') : rawStatus;

  return {
    ...proposal,
    // Add normalized aliases for V7 components
    status: status,

    // Guest info (use normalized guest if provided, otherwise normalize inline)
    guest: normalizedGuest || normalizeGuestData(proposal.guest),

    // Dates
    start_date: proposal.move_in_range_start_date || proposal.start_date || null,
    end_date: proposal['Move-out'] || proposal.end_date || null,
    move_in_range_start: proposal.move_in_range_start_date || proposal.move_in_range_start || null,
    move_in_range_end: proposal.move_in_range_end_date || proposal.move_in_range_end || null,
    created_at: proposal.bubble_created_at || proposal.created_at || null,

    // Days/Schedule
    days_selected: proposal.guest_selected_days_numbers_json || proposal.days_selected || [],
    days_per_week: proposal.guest_selected_days_numbers_json || proposal.days_per_week || [],
    nights_selected: proposal.guest_selected_nights_numbers_json || proposal.nights_selected || [],
    nights_per_week: proposal.nights_per_week_count || proposal.nights_per_week || 0,
    check_in_day: proposal.checkin_day_of_week_number || proposal.check_in_day || null,
    check_out_day: proposal.checkout_day_of_week_number || proposal.check_out_day || null,

    // Duration
    duration_weeks: proposal.reservation_span_in_weeks || proposal.duration_weeks || proposal.total_weeks || 0,
    duration_months: proposal['Reservation Span'] || proposal.duration_months || 0,

    // Pricing - prioritize host compensation fields
    nightly_rate: proposal.calculated_nightly_price || proposal.nightly_rate || 0,
    total_price: proposal['Total Compensation (proposal - host)'] || proposal['host compensation'] || proposal.total_price || 0,
    host_compensation: proposal['host compensation'] || proposal['Total Compensation (proposal - host)'] || proposal.host_compensation || 0,
    four_week_rent: proposal['4 week rent'] || proposal.four_week_rent || 0,
    four_week_compensation: proposal['4 week compensation'] || proposal.four_week_compensation || 0,
    cleaning_fee_amount: proposal.cleaning_fee_amount || proposal.cleaning_fee || 0,
    damage_deposit_amount: proposal.damage_deposit_amount || proposal.damage_deposit || 0,

    // Guest info/message
    comment: proposal.Comment || proposal.comment || null,
    need_for_space: proposal['need for space'] || proposal.need_for_space || null,
    about_yourself: proposal.about_yourself || null,

    // Guest counteroffer detection
    last_modified_by: proposal['last_modified_by'] || proposal.last_modified_by || null,
    has_guest_counteroffer: proposal.has_guest_counteroffer || false
  };
}
