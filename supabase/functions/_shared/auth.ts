/**
 * Shared Auth Utility for Edge Functions
 * Split Lease - Supabase Edge Functions
 *
 * Resolves the authenticated user's Bubble legacy ID and user type.
 * Replaces the ~50-line user resolution chain that was copy-pasted
 * across message handlers (and ~35 other edge functions).
 *
 * NO FALLBACK PRINCIPLE: Throws ValidationError if user cannot be resolved.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError } from './errors.ts';

export interface ResolvedUser {
  id: string;        // Bubble legacy ID (primary identifier used across the platform)
  email: string;
  userType: string;  // e.g. 'A Host (I have a space available to rent)'
}

/**
 * Bubble ID regex pattern: digits + "x" + digits (e.g. "1234567890x12345")
 * Used by legacy auth where the Supabase user.id IS the Bubble ID.
 */
const BUBBLE_ID_PATTERN = /^\d+x\d+$/;

/**
 * Resolve the authenticated user's Bubble legacy ID and user type.
 *
 * Priority chain:
 * 1. user.bubbleId from JWT user_metadata (set during signup)
 * 2. user.id if it matches Bubble ID regex pattern (legacy auth)
 * 3. Lookup from public.user by email (fallback for migrated users)
 *
 * @param supabaseAdmin - Admin client with service role (bypasses RLS)
 * @param user - User object from JWT auth { id, email, bubbleId? }
 * @returns ResolvedUser with Bubble legacy ID, email, and user type
 * @throws ValidationError if user cannot be resolved
 */
export async function resolveUser(
  supabaseAdmin: SupabaseClient,
  user: { id: string; email: string; bubbleId?: string }
): Promise<ResolvedUser> {
  let bubbleLegacyId: string | undefined;
  let userType = '';

  // Priority 1: Use bubbleId from JWT user_metadata if available
  if (user.bubbleId) {
    bubbleLegacyId = user.bubbleId;
    console.log('[auth/resolveUser] Using Bubble ID from JWT user_metadata:', bubbleLegacyId);

    // Fetch user type from database
    const { data: userData } = await supabaseAdmin
      .from('user')
      .select('current_user_role')
      .eq('bubble_legacy_id', bubbleLegacyId)
      .maybeSingle();

    userType = userData?.current_user_role || '';
  }
  // Priority 2: Check if user.id looks like a Bubble ID (legacy auth)
  else if (BUBBLE_ID_PATTERN.test(user.id)) {
    bubbleLegacyId = user.id;
    console.log('[auth/resolveUser] Using direct Bubble ID from legacy auth:', bubbleLegacyId);

    // Fetch user type from database
    const { data: userData } = await supabaseAdmin
      .from('user')
      .select('current_user_role')
      .eq('bubble_legacy_id', bubbleLegacyId)
      .maybeSingle();

    userType = userData?.current_user_role || '';
  }
  // Priority 3: JWT auth without metadata - look up by email in public.user
  else {
    if (!user.email) {
      console.error('[auth/resolveUser] No email in auth token');
      throw new ValidationError('Could not find user profile. Please try logging in again.');
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('user')
      .select('bubble_legacy_id, current_user_role')
      .ilike('email', user.email)
      .single();

    if (userError || !userData?.bubble_legacy_id) {
      console.error('[auth/resolveUser] User lookup failed:', userError?.message);
      throw new ValidationError('Could not find user profile. Please try logging in again.');
    }

    bubbleLegacyId = userData.bubble_legacy_id;
    userType = userData.current_user_role || '';
    console.log('[auth/resolveUser] Looked up Bubble ID from email:', bubbleLegacyId);
  }

  if (!bubbleLegacyId) {
    throw new ValidationError('Could not find user profile. Please try logging in again.');
  }

  return {
    id: bubbleLegacyId,
    email: user.email,
    userType,
  };
}
