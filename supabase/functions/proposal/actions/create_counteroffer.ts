/**
 * Create Counteroffer Action Handler
 *
 * Creates a counteroffer on a proposal from the host.
 * Used in usability simulations to simulate host counteroffers.
 *
 * @param payload - Contains proposalId and counteroffer details
 * @param supabase - Supabase client with service role
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CreateCounterofferPayload {
  proposalId: string;
  counterofferData: {
    'hc nightly price'?: number;
    'hc nights per week'?: number;
    'hc check in day'?: number;
    'hc check out day'?: number;
    'hc move in start'?: string; // Maps to 'hc move in date' column
    // Note: 'hc move out' column does not exist in schema
  };
  isUsabilityTest?: boolean;
  // Note: hostPersona removed - 'counteroffer_by_persona' column does not exist
}

export async function handleCreateCounteroffer(
  payload: CreateCounterofferPayload,
  supabase: SupabaseClient
): Promise<{ success: boolean; message: string }> {
  console.log('[create_counteroffer] Starting with proposalId:', payload.proposalId);

  const { proposalId, counterofferData, isUsabilityTest: _isUsabilityTest = false, hostPersona } = payload;

  if (!proposalId) {
    throw new Error('proposalId is required');
  }

  if (!counterofferData || Object.keys(counterofferData).length === 0) {
    throw new Error('counterofferData is required');
  }

  // Fetch current proposal to preserve existing data
  const { data: _proposal, error: fetchError } = await supabase
    .from('proposal')
    .select('*')
    .eq('_id', proposalId)
    .single();

  if (fetchError) {
    console.error('[create_counteroffer] Fetch error:', fetchError);
    throw new Error(`Failed to fetch proposal: ${fetchError.message}`);
  }

  // Update proposal with counteroffer data
  // SCHEMA-VERIFIED COLUMNS ONLY (2026-01-28):
  // - Status: text ✅
  // - Modified Date: timestamp ✅
  // - counter offer happened: boolean ✅ (NOT has_host_counteroffer)
  // - hc nightly price, hc nights per week, hc check in day, hc check out day: ✅
  // - hc move in date: timestamp ✅ (NOT hc move in start)
  // REMOVED non-existent: last_modified_by, has_host_counteroffer, counteroffer_by_persona, hc move out
  const updateData: Record<string, unknown> = {
    Status: 'Host Counteroffer Submitted / Awaiting Guest Review',
    'Modified Date': new Date().toISOString(),
    'counter offer happened': true
  };

  // Apply counteroffer fields (all verified to exist)
  if (counterofferData['hc nightly price'] !== undefined) {
    updateData['hc nightly price'] = counterofferData['hc nightly price'];
  }
  if (counterofferData['hc nights per week'] !== undefined) {
    updateData['hc nights per week'] = counterofferData['hc nights per week'];
  }
  if (counterofferData['hc check in day'] !== undefined) {
    updateData['hc check in day'] = counterofferData['hc check in day'];
  }
  if (counterofferData['hc check out day'] !== undefined) {
    updateData['hc check out day'] = counterofferData['hc check out day'];
  }
  if (counterofferData['hc move in start']) {
    // Map to actual column name
    updateData['hc move in date'] = counterofferData['hc move in start'];
  }

  const { error: updateError } = await supabase
    .from('proposal')
    .update(updateData)
    .eq('_id', proposalId);

  if (updateError) {
    console.error('[create_counteroffer] Update error:', updateError);
    throw new Error(`Failed to create counteroffer: ${updateError.message}`);
  }

  console.log('[create_counteroffer] Counteroffer created for proposal:', proposalId);

  return {
    success: true,
    message: `Counteroffer created${hostPersona ? ` by ${hostPersona}` : ''}`
  };
}
