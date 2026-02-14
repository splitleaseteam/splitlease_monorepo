/**
 * Initialize Simulation Handler
 *
 * Sets up the simulation context for a guest user.
 * Creates or loads test proposals for the simulation.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface InitializePayload {
  guestId: string;
}

interface InitializeResult {
  simulationId: string;
  proposals: unknown[];
}

export async function handleInitialize(
  supabase: SupabaseClient,
  payload: InitializePayload
): Promise<InitializeResult> {
  const { guestId } = payload;

  if (!guestId) {
    throw new Error('guestId is required');
  }

  console.log(`[initialize] Setting up simulation for guest: ${guestId}`);

  // Generate a unique simulation ID
  const simulationId = `sim_guest_${guestId}_${Date.now()}`;

  // Check if there are existing test proposals for this guest
  const { data: existingProposals, error: fetchError } = await supabase
    .from('booking_proposal')
    .select('*')
    .eq('guest_user_id', guestId)
    .eq('is_test_data', true)
    .limit(5);

  if (fetchError) {
    console.error('[initialize] Error fetching proposals:', fetchError);
    throw new Error('Failed to check existing proposals');
  }

  // If we have existing simulation proposals, use them
  if (existingProposals && existingProposals.length > 0) {
    console.log(`[initialize] Found ${existingProposals.length} existing simulation proposals`);
    return {
      simulationId,
      proposals: existingProposals
    };
  }

  // Otherwise, create mock proposals for the simulation
  // First, find a listing to use (prefer a test listing)
  const { data: listings, error: listingError } = await supabase
    .from('listing')
    .select('id, host_user_id')
    .limit(1);

  const { data: guestUser, error: guestError } = await supabase
    .from('user')
    .select('id, email')
    .eq('id', guestId)
    .single();

  if (guestError || !guestUser?.email) {
    throw new Error(`Failed to fetch guest email: ${guestError?.message || 'guest email missing'}`);
  }

  if (listingError || !listings || listings.length === 0) {
    console.log('[initialize] No listings found, creating mock proposal data');
    // Return mock data if no real listings exist
    return {
      simulationId,
      proposals: [
        {
          id: `mock_proposal_${Date.now()}`,
          guest_user_id: guestId,
          status: 'Pending Guest Deposit',
          schedule_type: 'nightly',
          days_per_week: 7,
          weeks_offset: 0,
          start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          end_date: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
          notes: '[SIMULATION] Test proposal for usability testing'
        }
      ]
    };
  }

  const listing = listings[0];

  // Create a simulation proposal
  const today = new Date();
  const startDate = new Date(today.getTime() + 86400000); // Tomorrow
  const moveInRangeEndDate = new Date(startDate.getTime() + 86400000 * 7);
  const endDate = new Date(startDate.getTime() + 86400000 * 28); // 4 weeks
  const eventLog = [{
    event: 'simulation_initialized',
    simulation_id: simulationId,
    timestamp: new Date().toISOString(),
  }];

  const { data: newProposal, error: createError } = await supabase
    .from('booking_proposal')
    .insert({
      id: crypto.randomUUID(),
      guest_user_id: guestId,
      listing_id: listing.id,
      host_user_id: listing.host_user_id,
      created_by_user_id: guestId,
      guest_email_address: guestUser.email,
      move_in_range_start_date: startDate.toISOString(),
      move_in_range_end_date: moveInRangeEndDate.toISOString(),
      planned_move_out_date: endDate.toISOString(),
      reservation_span_in_weeks: 4,
      reservation_span_text: '4 weeks',
      nights_per_week_count: 7,
      actual_weeks_in_reservation_span: 4,
      display_sort_order: 1,
      complimentary_free_nights_numbers_json: [],
      proposal_event_log_json: eventLog,
      is_finalized: false,
      is_rental_application_requested: false,
      four_week_rent_amount: 2800,
      total_reservation_price_for_guest: 2800,
      rental_type: 'nightly',
      guest_selected_days_numbers_json: [0, 1, 2, 3, 4, 5, 6],
      guest_selected_nights_numbers_json: [0, 1, 2, 3, 4, 5, 6],
      checkin_day_of_week_number: 0,
      checkout_day_of_week_number: 0,
      calculated_nightly_price: 100,
      proposal_workflow_status: 'Pending Guest Deposit',
      guest_introduction_message: '[SIMULATION] Test proposal for usability testing',
      is_test_data: true,
      simulation_id: simulationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      original_created_at: new Date().toISOString(),
      original_updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    console.error('[initialize] Error creating proposal:', createError);
    // Return mock data on error
    return {
      simulationId,
      proposals: [
        {
          id: `mock_proposal_${Date.now()}`,
          guest_user_id: guestId,
          status: 'Pending Guest Deposit',
          schedule_type: 'nightly',
          days_per_week: 7,
          weeks_offset: 0,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          notes: '[SIMULATION] Test proposal for usability testing'
        }
      ]
    };
  }

  console.log(`[initialize] Simulation initialized: ${simulationId}`);

  return {
    simulationId,
    proposals: newProposal ? [newProposal] : []
  };
}
