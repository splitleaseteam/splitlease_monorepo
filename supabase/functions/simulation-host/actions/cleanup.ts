/**
 * Cleanup Action Handler
 * Removes all test data created during the simulation.
 *
 * Strategy: No tables have a `simulation_id` column, so we identify test users
 * by the email pattern written by createTestGuest.ts, then delete related records
 * by user ID.
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
    leases: 0,
    proposals: 0,
    guestRequests: 0,
    virtualMeetings: 0,
    guestAccounts: 0,
    users: 0,
  };

  // Step 1: Find test users created for this simulation via email pattern
  // createTestGuest.ts generates: test_guest_{simulationId}_{timestamp}@simulation.splitlease.com
  const { data: testUsers, error: lookupError } = await supabase
    .from('user')
    .select('id')
    .like('email', `test_guest_${simulationId}_%@simulation.splitlease.com`);

  if (lookupError) {
    console.warn('[cleanup] Error looking up test users:', lookupError);
  }

  const testUserIds = testUsers?.map(u => u.id) || [];
  console.log('[cleanup] Found', testUserIds.length, 'test users for simulation');

  if (testUserIds.length > 0) {
    // Delete in order of dependencies (child tables first)

    // 2. Delete guest requests by guest user ID
    try {
      const { data: requests } = await supabase
        .from('guest_requests')
        .delete()
        .in('guest_user_id', testUserIds)
        .select('id');

      deletedCounts.guestRequests = requests?.length || 0;
      console.log('[cleanup] Deleted', deletedCounts.guestRequests, 'guest requests');
    } catch (_err) {
      console.warn('[cleanup] Could not delete guest requests:', _err);
    }

    // 3. Delete leases by guest user ID
    try {
      const { data: leases } = await supabase
        .from('booking_lease')
        .delete()
        .in('guest_user_id', testUserIds)
        .select('id');

      deletedCounts.leases = leases?.length || 0;
      console.log('[cleanup] Deleted', deletedCounts.leases, 'leases');
    } catch (_err) {
      console.warn('[cleanup] Could not delete leases:', _err);
    }

    // 4. Delete virtual meetings by guest user ID
    try {
      const { data: meetings } = await supabase
        .from('virtualmeetingschedulesandlinks')
        .delete()
        .in('guest_user_id', testUserIds)
        .select('id');

      deletedCounts.virtualMeetings = meetings?.length || 0;
      console.log('[cleanup] Deleted', deletedCounts.virtualMeetings, 'virtual meetings');
    } catch (_err) {
      console.warn('[cleanup] Could not delete virtual meetings:', _err);
    }

    // 5. Delete proposals by guest user ID
    try {
      const { data: proposals } = await supabase
        .from('booking_proposal')
        .delete()
        .in('guest_user_id', testUserIds)
        .select('id');

      deletedCounts.proposals = proposals?.length || 0;
      console.log('[cleanup] Deleted', deletedCounts.proposals, 'proposals');
    } catch (_err) {
      console.warn('[cleanup] Could not delete proposals:', _err);
    }

    // 6. Delete guest accounts by user reference
    try {
      const { data: guestAccounts } = await supabase
        .from('account_guest')
        .delete()
        .in('user', testUserIds)
        .select('id');

      deletedCounts.guestAccounts = guestAccounts?.length || 0;
      console.log('[cleanup] Deleted', deletedCounts.guestAccounts, 'guest accounts');
    } catch (_err) {
      console.warn('[cleanup] Could not delete guest accounts:', _err);
    }

    // 7. Delete test users last (after all referencing records are gone)
    try {
      const { data: users } = await supabase
        .from('user')
        .delete()
        .in('id', testUserIds)
        .select('id');

      deletedCounts.users = users?.length || 0;
      console.log('[cleanup] Deleted', deletedCounts.users, 'test users');
    } catch (_err) {
      console.warn('[cleanup] Could not delete test users:', _err);
    }
  }

  // Reset the host's usability tester status
  const { data: hostUser } = await supabase
    .from('user')
    .select('id')
    .eq('supabase_user_id', user.id)
    .maybeSingle();

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
