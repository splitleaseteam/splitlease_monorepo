/**
 * Mark Tester Action Handler
 * Updates user.isUsabilityTester flag to true
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface MarkTesterPayload {
  simulationId: string;
}

interface AuthUser {
  id: string;
  email: string;
}

interface MarkTesterResult {
  success: boolean;
  userId: string;
  isUsabilityTester: boolean;
}

export async function handleMarkTester(
  payload: MarkTesterPayload,
  user: AuthUser,
  supabase: SupabaseClient
): Promise<MarkTesterResult> {
  console.log('[markTester] Starting for user:', user.id);

  const { simulationId } = payload;

  if (!simulationId) {
    throw new Error('simulationId is required');
  }

  // Get user ID from supabase_user_id
  const { data: userData, error: fetchError } = await supabase
    .from('user')
    .select('id')
    .eq('supabase_user_id', user.id)
    .maybeSingle();

  if (fetchError || !userData) {
    console.error('[markTester] Error fetching user:', fetchError);
    throw new Error('User not found');
  }

  // Update user record
  const { error: updateError } = await supabase
    .from('user')
    .update({
      is_usability_tester: true,
      onboarding_usability_step: 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', userData.id);

  if (updateError) {
    console.error('[markTester] Error updating user:', updateError);
    throw new Error('Failed to mark user as tester');
  }

  console.log('[markTester] Successfully marked user as tester:', userData.id);

  return {
    success: true,
    userId: userData.id,
    isUsabilityTester: true
  };
}
