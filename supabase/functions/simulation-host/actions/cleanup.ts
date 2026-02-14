/**
 * Cleanup Action Handler
 * Removes all test data created during the simulation
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CleanupPayload {
  simulationId: string;
}

interface AuthUser {
  id: string;
  email: string;
}

interface CleanupResult {
  deletedCounts: {
    reviews: number;
    leases: number;
    proposals: number;
    guestRequests: number;
    virtualMeetings: number;
    guestAccounts: number;
    users: number;
  };
  simulationId: string;
  success: boolean;
}

export async function handleCleanup(
  payload: CleanupPayload,
  user: AuthUser,
  supabase: SupabaseClient
): Promise<CleanupResult> {
  console.log('[cleanup] Starting cleanup for simulation:', payload.simulationId);

  const { simulationId } = payload;

  if (!simulationId) {
    throw new Error('simulationId is required');
  }

  const deletedCounts = {
    reviews: 0,
    leases: 0,
    proposals: 0,
    guestRequests: 0,
    virtualMeetings: 0,
    guestAccounts: 0,
    users: 0,
  };

  // Delete in order of dependencies (child tables first)

  // 1. Delete reviews
  try {
    const { data: reviews } = await supabase
      .from('review')
      .delete()
      .eq('simulation_id', simulationId)
      .select('id');

    deletedCounts.reviews = reviews?.length || 0;
    console.log('[cleanup] Deleted', deletedCounts.reviews, 'reviews');
  } catch (_err) {
    console.warn('[cleanup] Could not delete reviews:', _err);
  }

  // 2. Delete guest requests
  try {
    const { data: requests } = await supabase
      .from('guest_requests')
      .delete()
      .eq('simulation_id', simulationId)
      .select('id');

    deletedCounts.guestRequests = requests?.length || 0;
    console.log('[cleanup] Deleted', deletedCounts.guestRequests, 'guest requests');
  } catch (_err) {
    console.warn('[cleanup] Could not delete guest requests:', _err);
  }

  // 3. Delete leases
  try {
    const { data: leases } = await supabase
      .from('booking_lease')
      .delete()
      .eq('simulation_id', simulationId)
      .select('id');

    deletedCounts.leases = leases?.length || 0;
    console.log('[cleanup] Deleted', deletedCounts.leases, 'leases');
  } catch (_err) {
    console.warn('[cleanup] Could not delete leases:', _err);
  }

  // 4. Delete virtual meetings
  try {
    const { data: meetings } = await supabase
      .from('virtualmeetingschedulesandlinks')
      .delete()
      .eq('simulation_id', simulationId)
      .select('id');

    deletedCounts.virtualMeetings = meetings?.length || 0;
    console.log('[cleanup] Deleted', deletedCounts.virtualMeetings, 'virtual meetings');
  } catch (_err) {
    console.warn('[cleanup] Could not delete virtual meetings:', _err);
  }

  // 5. Delete proposals
  try {
    const { data: proposals } = await supabase
      .from('booking_proposal')
      .delete()
      .eq('simulation_id', simulationId)
      .select('id');

    deletedCounts.proposals = proposals?.length || 0;
    console.log('[cleanup] Deleted', deletedCounts.proposals, 'proposals');
  } catch (_err) {
    console.warn('[cleanup] Could not delete proposals:', _err);
  }

  // 6. Delete guest accounts
  try {
    const { data: guestAccounts } = await supabase
      .from('account_guest')
      .delete()
      .eq('simulation_id', simulationId)
      .select('id');

    deletedCounts.guestAccounts = guestAccounts?.length || 0;
    console.log('[cleanup] Deleted', deletedCounts.guestAccounts, 'guest accounts');
  } catch (_err) {
    console.warn('[cleanup] Could not delete guest accounts:', _err);
  }

  // 7. Delete test users (only simulation-created guest users)
  try {
    const { data: users } = await supabase
      .from('user')
      .delete()
      .eq('simulation_id', simulationId)
      .select('id');

    deletedCounts.users = users?.length || 0;
    console.log('[cleanup] Deleted', deletedCounts.users, 'test users');
  } catch (_err) {
    console.warn('[cleanup] Could not delete test users:', _err);
  }

  // Reset the host's usability tester status
  const { data: hostUser } = await supabase
    .from('user')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single();

  if (hostUser) {
    await supabase
      .from('user')
      .update({
        is_usability_tester: false,
        onboarding_usability_step: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', hostUser.id);

    console.log('[cleanup] Reset host usability status');
  }

  const totalDeleted = Object.values(deletedCounts).reduce((a, b) => a + b, 0);
  console.log('[cleanup] Completed - deleted', totalDeleted, 'total records');

  return {
    deletedCounts,
    simulationId,
    success: true,
  };
}
