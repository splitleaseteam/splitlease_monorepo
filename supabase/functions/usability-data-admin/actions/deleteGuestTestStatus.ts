/**
 * Delete Guest Test Status Action Handler
 * Resets the usability test step for a guest
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DeleteGuestTestStatusPayload {
  guestId: string;
}

export async function handleDeleteGuestTestStatus(
  payload: DeleteGuestTestStatusPayload,
  supabase: SupabaseClient
) {
  const { guestId } = payload;

  if (!guestId) {
    throw new Error('guestId is required');
  }

  console.log('[usability-data-admin] Resetting test status for guest:', guestId);

  const timestamp = new Date().toISOString();

  const { data, error } = await supabase
    .from('user')
    .update({
      onboarding_usability_step: 0,
      updated_at: timestamp,
    })
    .eq('id', guestId)
    .select('id, email, first_name, last_name, onboarding_usability_step')
    .single();

  if (error) {
    console.error('[usability-data-admin] Reset test status error:', error);
    throw new Error(`Failed to reset test status: ${error.message}`);
  }

  console.log('[usability-data-admin] Guest test status reset:', { guestId, timestamp });

  return {
    success: true,
    message: `Reset usability test status for guest ${guestId}`,
    user: {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      usabilityStep: data.onboarding_usability_step,
    },
    timestamp,
  };
}
