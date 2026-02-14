/**
 * Create Test Proposals Action Handler
 * Creates 3 test proposals (Weekly, Monthly, Nightly) from the test guest
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CreateTestProposalsPayload {
  simulationId: string;
  guestId: string;
  listingId: string;
  hostId: string;
  rentalType: 'weekly' | 'monthly' | 'nightly';
}

interface AuthUser {
  id: string;
  email: string;
}

interface ProposalData {
  proposalId: string;
  rentalType: string;
  status: string;
}

interface TestProposalsResult {
  proposals: ProposalData[];
  simulationId: string;
}

/**
 * Get proposal configuration based on rental type
 */
function getProposalConfig(rentalType: string) {
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const moveInStart = oneWeekFromNow.toISOString();
  const moveInEnd = twoWeeksFromNow.toISOString();
  const moveOut = threeMonthsFromNow.toISOString();

  const baseConfig = {
    move_in_range_start_date: moveInStart,
    move_in_range_end_date: moveInEnd,
    planned_move_out_date: moveOut,
    reservation_span_in_weeks: 12,
    reservation_span_text: '12 weeks',
    actual_weeks_in_reservation_span: 12,
    proposal_workflow_status: 'Under Review',
  };

  switch (rentalType) {
    case 'weekly':
      return {
        ...baseConfig,
        rental_type: 'weekly',
        nights_per_week_count: 4,
        checkin_day_of_week_number: 2, // Tuesday (0-indexed)
        checkout_day_of_week_number: 6, // Saturday
        calculated_nightly_price: 125,
        four_week_rent_amount: 2000,
        total_reservation_price_for_guest: 6000,
        guest_selected_days_numbers_json: [2, 3, 4, 5],
        guest_selected_nights_numbers_json: [2, 3, 4, 5],
      };
    case 'monthly':
      return {
        ...baseConfig,
        rental_type: 'monthly',
        nights_per_week_count: 7,
        checkin_day_of_week_number: 0, // Sunday
        checkout_day_of_week_number: 0, // Sunday (full week)
        calculated_nightly_price: 100,
        four_week_rent_amount: 2800,
        total_reservation_price_for_guest: 8400,
        guest_selected_days_numbers_json: [0, 1, 2, 3, 4, 5, 6],
        guest_selected_nights_numbers_json: [0, 1, 2, 3, 4, 5, 6],
      };
    case 'nightly':
    default:
      return {
        ...baseConfig,
        rental_type: 'nightly',
        nights_per_week_count: 2,
        checkin_day_of_week_number: 5, // Friday
        checkout_day_of_week_number: 0, // Sunday
        calculated_nightly_price: 150,
        four_week_rent_amount: 1200,
        total_reservation_price_for_guest: 3600,
        guest_selected_days_numbers_json: [5, 6],
        guest_selected_nights_numbers_json: [5, 6],
      };
  }
}

export async function handleCreateTestProposals(
  payload: CreateTestProposalsPayload,
  user: AuthUser,
  supabase: SupabaseClient
): Promise<TestProposalsResult> {
  console.log('[createTestProposals] Starting for simulation:', payload.simulationId);

  const { simulationId, guestId, listingId, hostId, rentalType: _rentalType } = payload;

  if (!simulationId || !guestId || !listingId || !hostId) {
    throw new Error('simulationId, guestId, listingId, and hostId are required');
  }

  const { data: guestUser, error: guestError } = await supabase
    .from('user')
    .select('id, email')
    .eq('id', guestId)
    .single();

  if (guestError || !guestUser?.email) {
    throw new Error(`Failed to fetch guest email: ${guestError?.message || 'guest email missing'}`);
  }

  const proposals: ProposalData[] = [];

  // Create 3 proposals with different rental types
  const rentalTypes: Array<'weekly' | 'monthly' | 'nightly'> = ['weekly', 'monthly', 'nightly'];

  for (const type of rentalTypes) {
    const config = getProposalConfig(type);

    const now = new Date().toISOString();
    const proposalData = {
      id: crypto.randomUUID(),
      guest_user_id: guestId,
      host_user_id: hostId,
      listing_id: listingId,
      created_by_user_id: guestId,
      guest_email_address: guestUser.email,
      ...config,
      complimentary_free_nights_numbers_json: [],
      proposal_event_log_json: [
        {
          event: 'simulation_test_proposal_created',
          simulation_id: simulationId,
          rental_type: type,
          timestamp: now,
        },
      ],
      display_sort_order: 1,
      is_finalized: false,
      is_rental_application_requested: false,
      is_test_data: true,
      simulation_id: simulationId,
      created_at: now,
      updated_at: now,
      original_created_at: now,
      original_updated_at: now,
    };

    console.log(`[createTestProposals] Creating ${type} proposal...`);

    const { data: proposal, error: createError } = await supabase
      .from('booking_proposal')
      .insert(proposalData)
      .select('id, proposal_workflow_status, rental_type')
      .single();

    if (createError) {
      console.error(`[createTestProposals] Error creating ${type} proposal:`, createError);
      throw new Error(`Failed to create ${type} proposal: ${createError.message}`);
    }

    console.log(`[createTestProposals] Created ${type} proposal:`, proposal.id);

    proposals.push({
      proposalId: proposal.id,
      rentalType: proposal.rental_type,
      status: proposal.proposal_workflow_status,
    });
  }

  // Update the host's usability step
  const { data: hostUser } = await supabase
    .from('user')
    .select('id')
    .eq('supabase_user_id', user.id)
    .maybeSingle();

  if (hostUser) {
    await supabase
      .from('user')
      .update({ onboarding_usability_step: 2 })
      .eq('id', hostUser.id);
  }

  console.log('[createTestProposals] Created', proposals.length, 'proposals');

  return {
    proposals,
    simulationId,
  };
}
