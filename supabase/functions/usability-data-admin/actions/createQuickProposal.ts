/**
 * Create Quick Proposal Action Handler
 * Creates a proposal for usability testing
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CreateQuickProposalPayload {
  listingId: string;
  guestId: string;
  moveInDate: string;
  selectedDayIndices: number[];  // 0-indexed (Sun=0, Sat=6)
  reservationWeeks: number;
  totalPrice: number;
  fourWeeksRent: number;
  nightlyPrice: number;
  notes?: string;
}

/**
 * Generate a unique platform-compatible ID
 */
async function generatePlatformId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.rpc('generate_unique_id');
  if (error) {
    throw new Error(`Failed to generate ID: ${error.message}`);
  }
  return data;
}

export async function handleCreateQuickProposal(
  payload: CreateQuickProposalPayload,
  supabase: SupabaseClient
) {
  const {
    listingId,
    guestId,
    moveInDate,
    selectedDayIndices,
    reservationWeeks,
    totalPrice,
    fourWeeksRent,
    nightlyPrice,
    notes,
  } = payload;

  // Validate required fields
  if (!listingId) throw new Error('listingId is required');
  if (!guestId) throw new Error('guestId is required');
  if (!moveInDate) throw new Error('moveInDate is required');
  if (!selectedDayIndices || selectedDayIndices.length === 0) {
    throw new Error('selectedDayIndices must contain at least one day');
  }
  if (!reservationWeeks || reservationWeeks <= 0) {
    throw new Error('reservationWeeks must be a positive number');
  }

  console.log('[usability-data-admin] Creating quick proposal:', {
    listingId,
    guestId,
    moveInDate,
    selectedDayIndices,
    reservationWeeks,
  });

  // Get listing details to find the host
  const { data: listing, error: listingError } = await supabase
    .from('listing')
    .select('id, host_user_id, listing_title')
    .eq('id', listingId)
    .single();

  if (listingError) {
    console.error('[usability-data-admin] Fetch listing error:', listingError);
    throw new Error(`Failed to fetch listing: ${listingError.message}`);
  }

  const hostId = listing.host_user_id;
  if (!hostId) {
    throw new Error('Listing does not have a host');
  }

  const { data: guestUser, error: guestError } = await supabase
    .from('user')
    .select('id, email')
    .eq('id', guestId)
    .single();

  if (guestError || !guestUser?.email) {
    throw new Error(`Failed to fetch guest email: ${guestError?.message || 'guest email missing'}`);
  }

  // Generate unique IDs for proposal and thread
  const proposalId = await generatePlatformId(supabase);
  const threadId = await generatePlatformId(supabase);

  const timestamp = new Date().toISOString();
  const moveInStart = new Date(moveInDate);
  const moveInEnd = new Date(moveInStart.getTime() + 2 * 86400000);
  const moveOut = new Date(moveInStart.getTime() + reservationWeeks * 7 * 86400000);
  const firstDay = Math.min(...selectedDayIndices);
  const lastDay = Math.max(...selectedDayIndices);

  // Create the proposal
  const proposalData = {
    id: proposalId,
    legacy_platform_id: proposalId,
    guest_user_id: guestId,
    host_user_id: hostId,
    listing_id: listingId,
    created_by_user_id: guestId,
    guest_email_address: guestUser.email,
    move_in_range_start_date: moveInStart.toISOString(),
    move_in_range_end_date: moveInEnd.toISOString(),
    planned_move_out_date: moveOut.toISOString(),
    reservation_span_in_weeks: reservationWeeks,
    reservation_span_text: `${reservationWeeks} weeks`,
    actual_weeks_in_reservation_span: reservationWeeks,
    nights_per_week_count: selectedDayIndices.length,
    checkin_day_of_week_number: firstDay,
    checkout_day_of_week_number: (lastDay + 1) % 7,
    guest_selected_days_numbers_json: selectedDayIndices,
    guest_selected_nights_numbers_json: selectedDayIndices,
    four_week_rent_amount: fourWeeksRent,
    total_reservation_price_for_guest: totalPrice,
    calculated_nightly_price: nightlyPrice,
    display_sort_order: 1,
    complimentary_free_nights_numbers_json: [],
    proposal_event_log_json: [
      {
        event: 'quick_proposal_created',
        timestamp,
      },
    ],
    is_finalized: false,
    is_rental_application_requested: false,
    guest_introduction_message: notes || '[USABILITY] Quick proposal generated',
    proposal_workflow_status: 'Pending',
    rental_type: 'nightly',
    is_test_data: true,
    created_at: timestamp,
    updated_at: timestamp,
    original_created_at: timestamp,
    original_updated_at: timestamp,
  };

  const { error: proposalError } = await supabase
    .from('booking_proposal')
    .insert(proposalData);

  if (proposalError) {
    console.error('[usability-data-admin] Create proposal error:', proposalError);
    throw new Error(`Failed to create proposal: ${proposalError.message}`);
  }

  console.log('[usability-data-admin] Proposal created:', proposalId);

  // Create the message thread
  const threadData = {
    thread_id: threadId,
    host_id: hostId,
    guest_id: guestId,
    listing_id: listingId,
    proposal_id: proposalId,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const { error: threadError } = await supabase
    .from('message_threads')
    .insert(threadData);

  if (threadError) {
    console.error('[usability-data-admin] Create thread error:', threadError);
    // Don't fail the whole operation if thread creation fails
    // The proposal is already created
    console.warn('[usability-data-admin] Thread creation failed, but proposal was created');
  } else {
    console.log('[usability-data-admin] Thread created:', threadId);
  }

  return {
    success: true,
    message: 'Proposal created successfully',
    proposalId,
    threadId,
    proposal: {
      id: proposalId,
      listingId,
      listingName: listing.listing_title,
      guestId,
      hostId,
      moveInDate,
      selectedDayIndices,
      reservationWeeks,
      totalPrice,
      fourWeeksRent,
      nightlyPrice,
      status: 'Pending',
    },
    timestamp,
  };
}
