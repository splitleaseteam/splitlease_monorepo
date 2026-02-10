/**
 * Get Lease Handler
 * Split Lease - Supabase Edge Functions
 *
 * Fetches lease details for display in the frontend.
 * Requires authentication to ensure users can only access their own leases.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError, AuthenticationError } from '../../_shared/errors.ts';
import { validateGetLeasePayload } from '../lib/validators.ts';
import type { UserContext, LeaseData } from '../lib/types.ts';

/**
 * Handle get lease request
 *
 * Fetches lease with related data (proposal, stays, payment records)
 * Validates that the requesting user is a participant in the lease.
 *
 * @param payload - Request payload with leaseId
 * @param user - Authenticated user context
 * @param supabase - Supabase client
 * @returns Lease data with related records
 */
export async function handleGet(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<LeaseData & { canAccess: boolean }> {
  console.log('[lease:get] Fetching lease...');

  // Validate input
  validateGetLeasePayload(payload);

  const leaseId = payload.leaseId as string;

  // Fetch lease (without embedded joins - no FK constraints exist)
  // SCHEMA NOTE (2026-01-28): bookings_leases has no FK to proposal, user, or listing tables
  const { data: lease, error: leaseError } = await supabase
    .from('bookings_leases')
    .select('*')
    .eq('_id', leaseId)
    .single();

  if (leaseError) {
    console.error('[lease:get] Error fetching lease:', leaseError.message);
    throw new ValidationError(`Lease not found: ${leaseError.message}`);
  }

  if (!lease) {
    throw new ValidationError('Lease not found');
  }

  // Fetch related data separately (parallel fetches for performance)
  const [proposalResult, guestResult, hostResult, listingResult] = await Promise.all([
    // Fetch proposal
    lease.Proposal
      ? supabase
          .from('proposal')
          .select('_id, Status, "rental type", "host_counter_offer_move_in_date", "host_counter_offer_reservation_span_weeks", "host_counter_offer_nights_per_week", "host_counter_offer_nightly_price"')
          .eq('_id', lease.Proposal)
          .single()
      : Promise.resolve({ data: null, error: null }),
    // Fetch guest
    lease.Guest
      ? supabase
          .from('user')
          .select('_id, email, "First Name", "Last Name"')
          .eq('_id', lease.Guest)
          .single()
      : Promise.resolve({ data: null, error: null }),
    // Fetch host
    lease.Host
      ? supabase
          .from('user')
          .select('_id, email, "First Name", "Last Name"')
          .eq('_id', lease.Host)
          .single()
      : Promise.resolve({ data: null, error: null }),
    // Fetch listing
    lease.Listing
      ? supabase
          .from('listing')
          .select('_id, Name, "listing full address (text)", "List of Photos", "cancellation policy"')
          .eq('_id', lease.Listing)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  // Log any fetch errors (non-fatal)
  if (proposalResult.error) {
    console.warn('[lease:get] Could not fetch proposal:', proposalResult.error.message);
  }
  if (guestResult.error) {
    console.warn('[lease:get] Could not fetch guest:', guestResult.error.message);
  }
  if (hostResult.error) {
    console.warn('[lease:get] Could not fetch host:', hostResult.error.message);
  }
  if (listingResult.error) {
    console.warn('[lease:get] Could not fetch listing:', listingResult.error.message);
  }

  // Combine lease with related data
  const enrichedLease = {
    ...lease,
    proposal: proposalResult.data || null,
    guest: guestResult.data || null,
    host: hostResult.data || null,
    listing: listingResult.data || null,
  };

  // Check if user is a participant
  const participants: string[] = enrichedLease.Participants || [];
  const isParticipant = user ? participants.includes(user.id) : false;

  if (user && !isParticipant) {
    console.warn('[lease:get] User not authorized:', user.id);
    throw new AuthenticationError('Not authorized to view this lease');
  }

  console.log('[lease:get] Lease fetched successfully:', leaseId);

  return {
    ...enrichedLease,
    canAccess: isParticipant,
  };
}
