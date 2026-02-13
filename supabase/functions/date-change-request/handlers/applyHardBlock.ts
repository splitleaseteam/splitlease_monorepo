/**
 * Apply Hard Block Handler
 * Split Lease - Supabase Edge Functions
 *
 * Sets the user's throttling ability to false when they hit 10+ pending requests.
 * This blocks them from creating new requests for 24 hours.
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SupabaseSyncError, ValidationError } from "../../_shared/errors.ts";
import {
  ApplyHardBlockInput,
  ApplyHardBlockResponse,
  UserContext,
} from "../lib/types.ts";

/**
 * Handle apply hard block
 *
 * Steps:
 * 1. Validate input
 * 2. Fetch lease to determine user role
 * 3. Update the appropriate throttling ability field to false
 * 4. Return success response
 */
export async function handleApplyHardBlock(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<ApplyHardBlockResponse> {
  console.log(`[date-change-request:apply_hard_block] Starting for user: ${user?.email || 'public'}`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as ApplyHardBlockInput;

  if (!input.leaseId) {
    throw new ValidationError('leaseId is required');
  }
  if (!input.userId) {
    throw new ValidationError('userId is required');
  }

  const { leaseId, userId } = input;
  console.log(`[date-change-request:apply_hard_block] Blocking user ${userId} on lease ${leaseId}`);

  // ================================================
  // FETCH LEASE TO DETERMINE ROLE
  // ================================================

  const { data: lease, error: leaseError } = await supabase
    .from('booking_lease')
    .select('id, guest_user_id, host_user_id')
    .eq('id', leaseId)
    .single();

  if (leaseError) {
    console.error(`[date-change-request:apply_hard_block] Lease fetch failed:`, leaseError);
    throw new SupabaseSyncError(`Failed to fetch lease: ${leaseError.message}`);
  }

  if (!lease) {
    throw new ValidationError(`Lease not found: ${leaseId}`);
  }

  // ================================================
  // DETERMINE ROLE AND UPDATE FIELD
  // ================================================

  const isHost = userId === lease.host_user_id;
  const isGuest = userId === lease.guest_user_id;

  if (!isHost && !isGuest) {
    throw new ValidationError('User is not a participant in this lease');
  }

  const abilityField = isHost
    ? 'host_can_create_date_change_requests'
    : 'guest_can_create_date_change_requests';

  // NOTE: blocked_at columns not in current booking_lease schema — update only ability field
  const { error: updateError } = await supabase
    .from('booking_lease')
    .update({
      [abilityField]: false,
    })
    .eq('id', leaseId);

  if (updateError) {
    console.error(`[date-change-request:apply_hard_block] Update failed:`, updateError);
    throw new SupabaseSyncError(`Failed to apply hard block: ${updateError.message}`);
  }

  console.log(`[date-change-request:apply_hard_block] Successfully blocked ${isHost ? 'host' : 'guest'} on lease ${leaseId}`);

  // ================================================
  // RETURN RESPONSE
  // ================================================

  return {
    success: true,
    blockedAt: new Date().toISOString(),
  };
}
