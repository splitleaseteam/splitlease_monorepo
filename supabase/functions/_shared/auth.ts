/**
 * Shared Auth Utility for Edge Functions
 * Split Lease - Supabase Edge Functions
 *
 * Resolves the authenticated user's platform ID and user type.
 * Replaces the ~50-line user resolution chain that was copy-pasted
 * across message handlers (and ~35 other edge functions).
 *
 * NO FALLBACK PRINCIPLE: Throws ValidationError if user cannot be resolved.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AuthenticationError } from './errors.ts';

export interface ResolvedUser {
  id: string;        // Platform user ID (primary identifier used across the platform)
  email: string;
  userType: string;  // e.g. 'A Host (I have a space available to rent)'
}

/**
 * Legacy ID regex pattern: digits + "x" + digits (e.g. "1234567890x12345")
 * Used by legacy auth where the Supabase user.id IS the legacy platform ID.
 */
const LEGACY_ID_PATTERN = /^\d+x\d+$/;

/**
 * Resolve the authenticated user's platform ID and user type.
 *
 * Priority chain:
 * 1. user.legacyPlatformId from JWT user_metadata (set during signup as user_id)
 * 2. user.id if it matches legacy ID regex pattern (legacy auth)
 * 3. Lookup from public.user by email (fallback for migrated users)
 *
 * @param supabaseAdmin - Admin client with service role (bypasses RLS)
 * @param user - User object from JWT auth { id, email, legacyPlatformId? }
 * @returns ResolvedUser with platform ID, email, and user type
 * @throws AuthenticationError if user cannot be resolved
 */
export async function resolveUser(
  supabaseAdmin: SupabaseClient,
  user: { id: string; email: string; legacyPlatformId?: string }
): Promise<ResolvedUser> {
  let platformId: string | undefined;
  let userType = '';

  // Priority 1: Use user_id from JWT user_metadata if available
  if (user.legacyPlatformId) {
    platformId = user.legacyPlatformId;
    console.log('[auth/resolveUser] Using user ID from JWT user_metadata:', platformId);

    // Fetch user type from database
    const { data: userData } = await supabaseAdmin
      .from('user')
      .select('current_user_role')
      .eq('legacy_platform_id', platformId)
      .maybeSingle();

    userType = userData?.current_user_role || '';
  }
  // Priority 2: Check if user.id looks like a legacy ID
  else if (LEGACY_ID_PATTERN.test(user.id)) {
    platformId = user.id;
    console.log('[auth/resolveUser] Using direct legacy ID from auth:', platformId);

    // Fetch user type from database
    const { data: userData } = await supabaseAdmin
      .from('user')
      .select('current_user_role')
      .eq('legacy_platform_id', platformId)
      .maybeSingle();

    userType = userData?.current_user_role || '';
  }
  // Priority 3: JWT auth without metadata - look up by email in public.user
  else {
    if (!user.email) {
      console.error('[auth/resolveUser] No email in auth token');
      throw new AuthenticationError('Invalid or expired authentication token. Please log in again.');
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('user')
      .select('legacy_platform_id, current_user_role')
      .ilike('email', user.email)
      .single();

    if (userError || !userData?.legacy_platform_id) {
      console.error('[auth/resolveUser] User lookup failed:', userError?.message);
      throw new AuthenticationError('Invalid or expired authentication token. Please log in again.');
    }

    platformId = userData.legacy_platform_id;
    userType = userData.current_user_role || '';
    console.log('[auth/resolveUser] Looked up user ID from email:', platformId);
  }

  if (!platformId) {
    throw new AuthenticationError('Invalid or expired authentication token. Please log in again.');
  }

  return {
    id: platformId,
    email: user.email,
    userType,
  };
}
