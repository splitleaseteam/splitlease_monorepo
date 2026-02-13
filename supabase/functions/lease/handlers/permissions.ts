/**
 * Permissions Handler for Lease Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Manages listing permissions for guests when a lease is created.
 * Grants guests permission to view the full listing address.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Grant guest permission to view listing address
 *
 * When a lease is created, the guest needs access to the full
 * listing address (which is normally hidden until accepted).
 *
 * @param supabase - Supabase client
 * @param listingId - ID of the listing
 * @param guestId - ID of the guest to grant permission
 */
export async function grantListingPermission(
  supabase: SupabaseClient,
  listingId: string,
  guestId: string
): Promise<void> {
  console.log('[lease:permissions] Granting permission for guest:', guestId);
  console.log('[lease:permissions] Listing:', listingId);

  // Fetch current permissions
  const { data: listing, error: fetchError } = await supabase
    .from('listing')
    .select('users_with_edit_permission_ids_json')
    .eq('id', listingId)
    .single();

  if (fetchError) {
    console.warn(
      '[lease:permissions] Could not fetch listing:',
      fetchError.message
    );
    return;
  }

  const currentPermissions: string[] = listing?.users_with_edit_permission_ids_json || [];

  // Check if guest already has permission
  if (currentPermissions.includes(guestId)) {
    console.log('[lease:permissions] Guest already has permission');
    return;
  }

  // Add guest to permissions
  const updatedPermissions = [...currentPermissions, guestId];

  const { error: updateError } = await supabase
    .from('listing')
    .update({ users_with_edit_permission_ids_json: updatedPermissions })
    .eq('id', listingId);

  if (updateError) {
    console.warn(
      '[lease:permissions] Could not update permissions:',
      updateError.message
    );
  } else {
    console.log('[lease:permissions] Permission granted to guest:', guestId);
  }
}

/**
 * Revoke guest permission from listing
 *
 * Used when a lease is cancelled before move-in.
 *
 * @param supabase - Supabase client
 * @param listingId - ID of the listing
 * @param guestId - ID of the guest to revoke permission
 */
export async function revokeListingPermission(
  supabase: SupabaseClient,
  listingId: string,
  guestId: string
): Promise<void> {
  console.log('[lease:permissions] Revoking permission for guest:', guestId);
  console.log('[lease:permissions] Listing:', listingId);

  // Fetch current permissions
  const { data: listing, error: fetchError } = await supabase
    .from('listing')
    .select('users_with_edit_permission_ids_json')
    .eq('id', listingId)
    .single();

  if (fetchError) {
    console.warn(
      '[lease:permissions] Could not fetch listing:',
      fetchError.message
    );
    return;
  }

  const currentPermissions: string[] = listing?.users_with_edit_permission_ids_json || [];

  // Check if guest has permission
  if (!currentPermissions.includes(guestId)) {
    console.log('[lease:permissions] Guest does not have permission');
    return;
  }

  // Remove guest from permissions
  const updatedPermissions = currentPermissions.filter((id) => id !== guestId);

  const { error: updateError } = await supabase
    .from('listing')
    .update({ users_with_edit_permission_ids_json: updatedPermissions })
    .eq('id', listingId);

  if (updateError) {
    console.warn(
      '[lease:permissions] Could not update permissions:',
      updateError.message
    );
  } else {
    console.log('[lease:permissions] Permission revoked from guest:', guestId);
  }
}
