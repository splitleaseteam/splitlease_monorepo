/**
 * Create Test Proposal Action Handler
 *
 * Creates a test proposal for usability testing simulations.
 * Marks the proposal with isUsabilityTest flag for later cleanup.
 *
 * @param payload - Contains guestId, listingId, hostId, and proposal data
 * @param supabase - Supabase client with service role
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CreateTestProposalPayload {
  guestId: string;
  listingId: string;
  hostId: string;
  isUsabilityTest: boolean;
  proposalData?: {
    moveInStart?: string;
    moveInEnd?: string;
    moveOut?: string;
    nightsPerWeek?: number;
    checkInDay?: number;
    checkOutDay?: number;
    nightlyPrice?: number;
  };
}

export async function handleCreateTestProposal(
  payload: CreateTestProposalPayload,
  supabase: SupabaseClient
): Promise<{ proposalId: string }> {
  console.log('[create_test_proposal] Starting with payload:', JSON.stringify(payload, null, 2));

  const { guestId, listingId, hostId, proposalData = {} } = payload;

  if (!guestId || !listingId) {
    throw new Error('guestId and listingId are required');
  }

  // Calculate default dates if not provided
  const now = new Date();
  const moveInStart = proposalData.moveInStart || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const moveInEnd = proposalData.moveInEnd || new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const moveOut = proposalData.moveOut || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Default proposal values for testing
  const nightsPerWeek = proposalData.nightsPerWeek || 4;
  const checkInDay = proposalData.checkInDay || 2; // Tuesday
  const checkOutDay = proposalData.checkOutDay || 6; // Saturday
  const nightlyPrice = proposalData.nightlyPrice || 125;

  // Calculate derived values
  const daysSelected = [];
  for (let d = checkInDay; d <= checkInDay + nightsPerWeek; d++) {
    daysSelected.push(d % 7); // 0-indexed day
  }

  // Fetch guest email for NOT NULL constraint
  const { data: guestUser } = await supabase
    .from('user')
    .select('email')
    .eq('id', guestId)
    .single();

  const testNow = new Date().toISOString();
  const reservationSpanWeeks = Math.ceil((new Date(moveOut).getTime() - new Date(moveInStart).getTime()) / (7 * 24 * 60 * 60 * 1000));

  // Create the test proposal
  const { data: proposal, error } = await supabase
    .from('booking_proposal')
    .insert({
      guest_user_id: guestId,
      listing_id: listingId,
      host_user_id: hostId,
      move_in_range_start_date: moveInStart,
      move_in_range_end_date: moveInEnd,
      planned_move_out_date: moveOut,
      nights_per_week_count: nightsPerWeek,
      checkin_day_of_week_number: checkInDay,
      checkout_day_of_week_number: checkOutDay,
      guest_selected_days_numbers_json: daysSelected,
      calculated_nightly_price: nightlyPrice,
      proposal_workflow_status: 'Host Review',
      // NOT NULL required fields
      guest_email_address: guestUser?.email || 'test@splitlease.com',
      four_week_rent_amount: nightlyPrice * nightsPerWeek * 4,
      total_reservation_price_for_guest: nightlyPrice * nightsPerWeek * reservationSpanWeeks,
      reservation_span_text: `${reservationSpanWeeks} weeks`,
      reservation_span_in_weeks: reservationSpanWeeks,
      actual_weeks_in_reservation_span: reservationSpanWeeks,
      complimentary_free_nights_numbers_json: [],
      proposal_event_log_json: [`Test proposal created on ${new Date().toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit", hour: "numeric", minute: "2-digit", hour12: true })}`],
      display_sort_order: 1,
      is_finalized: false,
      is_rental_application_requested: false,
      is_usability_test: true,
      is_deleted: false,
      guest_introduction_message: 'Test proposal created for usability simulation',
      created_at: testNow,
      updated_at: testNow,
      original_created_at: testNow,
      original_updated_at: testNow,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[create_test_proposal] Insert error:', error);
    throw new Error(`Failed to create test proposal: ${error.message}`);
  }

  console.log('[create_test_proposal] Created proposal:', proposal.id);

  return { proposalId: proposal.id };
}
