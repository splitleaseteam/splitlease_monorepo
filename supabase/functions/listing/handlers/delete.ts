/**
 * Delete Listing Handler
 * Split Lease - Supabase Edge Functions
 *
 * PATTERN: Soft delete (set Deleted=true)
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError, SupabaseSyncError } from '../../_shared/errors.ts';
import { validateRequiredFields } from '../../_shared/validation.ts';

interface DeleteListingPayload {
  listing_id: string;
  user_email?: string; // Optional: for ownership verification
}

interface DeleteListingResult {
  deleted: true;
  listing_id: string;
  deletedAt: string;
}

/**
 * Handle listing deletion with Supabase-first pattern
 * Soft deletes (Deleted=true)
 */
export async function handleDelete(
  payload: Record<string, unknown>
): Promise<DeleteListingResult> {
  console.log('[listing:delete] ========== DELETE LISTING ==========');

  // Validate required fields
  validateRequiredFields(payload, ['listing_id']);

  const { listing_id, user_email } = payload as DeleteListingPayload;

  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables');
  }

  // Initialize Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('[listing:delete] Deleting listing ID:', listing_id);
  if (user_email) {
    console.log('[listing:delete] User email:', user_email);
  }

  // Step 1: Verify listing exists
  const { data: existingListing, error: fetchError } = await supabase
    .from('listing')
    .select('id, listing_title, host_user_id')
    .eq('id', listing_id)
    .single();

  if (fetchError || !existingListing) {
    console.error('[listing:delete] Listing not found:', fetchError);
    throw new ValidationError(`Listing not found: ${listing_id}`);
  }

  console.log('[listing:delete] Found listing:', existingListing.listing_title);

  // Step 2: Soft delete (set is_deleted=true)
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('listing')
    .update({
      is_deleted: true,
      updated_at: now,
    })
    .eq('id', listing_id);

  if (updateError) {
    console.error('[listing:delete] Update failed:', updateError);
    throw new SupabaseSyncError(`Failed to delete listing: ${updateError.message}`);
  }

  console.log('[listing:delete] Listing soft-deleted successfully');

  console.log('[listing:delete] ========== SUCCESS ==========');

  return {
    deleted: true,
    listing_id: listing_id,
    deletedAt: now,
  };
}
