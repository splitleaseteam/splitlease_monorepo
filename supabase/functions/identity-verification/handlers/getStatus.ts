/**
 * Get Identity Verification Status Handler
 * Split Lease - Identity Verification Edge Function
 *
 * Fetches the current identity verification status for the authenticated user.
 *
 * Returns:
 * - submitted: boolean (whether documents have been submitted)
 * - verified: boolean (whether verification has been approved)
 * - documentType: string | null (type of document submitted)
 * - submittedAt: string | null (timestamp of submission)
 * - verifiedAt: string | null (timestamp of verification approval)
 */

import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface User {
  readonly id: string;
}

interface VerificationStatus {
  readonly submitted: boolean;
  readonly verified: boolean;
  readonly documentType: string | null;
  readonly submittedAt: string | null;
  readonly verifiedAt: string | null;
}

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────

export async function handleGetStatus(
  supabaseUrl: string,
  supabaseServiceKey: string,
  user: User,
  _payload: unknown
): Promise<VerificationStatus> {
  console.log('[getStatus] Fetching verification status for user:', user.id);

  // Create admin client for database operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch user's verification status
  const { data, error } = await supabaseAdmin
    .from('user')
    .select(`
      identity_document_type,
      identity_verified,
      identity_submitted_at,
      identity_verified_at
    `)
    .eq('supabase_user_id', user.id)
    .single();

  if (error) {
    console.error('[getStatus] Error fetching user:', error);
    throw new Error(`Failed to fetch verification status: ${error.message}`);
  }

  if (!data) {
    console.log('[getStatus] User not found, returning default status');
    return {
      submitted: false,
      verified: false,
      documentType: null,
      submittedAt: null,
      verifiedAt: null,
    };
  }

  const status: VerificationStatus = {
    submitted: data.identity_submitted_at !== null,
    verified: data.identity_verified === true,
    documentType: data.identity_document_type || null,
    submittedAt: data.identity_submitted_at || null,
    verifiedAt: data.identity_verified_at || null,
  };

  console.log('[getStatus] Verification status:', status);

  return status;
}
