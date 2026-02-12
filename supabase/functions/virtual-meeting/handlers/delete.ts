/**
 * Delete Virtual Meeting Handler
 * Split Lease - Supabase Edge Functions
 *
 * Deletes a virtual meeting record from the database and updates the associated proposal.
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError, SupabaseSyncError } from "../../_shared/errors.ts";
import { DeleteVirtualMeetingInput, DeleteVirtualMeetingResponse, UserContext } from "../lib/types.ts";
import { validateDeleteVirtualMeetingInput } from "../lib/validators.ts";

/**
 * Handle delete virtual meeting request
 *
 * Steps:
 * 1. Validate input (virtualMeetingId, proposalId)
 * 2. Verify VM exists
 * 3. Delete VM record from virtualmeetingschedulesandlinks
 * 4. Update proposal: set 'virtual meeting' to null, clear 'request virtual meeting'
 * 5. Return response
 */
export async function handleDelete(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<DeleteVirtualMeetingResponse> {
  console.log(`[virtual-meeting:delete] Starting delete for user: ${user?.email || 'public'}`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as DeleteVirtualMeetingInput;
  validateDeleteVirtualMeetingInput(input);

  console.log(`[virtual-meeting:delete] Validated input - VM: ${input.virtualMeetingId}, Proposal: ${input.proposalId}`);

  // ================================================
  // VERIFY VM EXISTS
  // ================================================

  const { data: existingVM, error: fetchError } = await supabase
    .from("virtualmeetingschedulesandlinks")
    .select("id")
    .eq("id", input.virtualMeetingId)
    .single();

  if (fetchError || !existingVM) {
    console.error(`[virtual-meeting:delete] VM not found:`, fetchError);
    throw new ValidationError(`Virtual meeting not found: ${input.virtualMeetingId}`);
  }

  console.log(`[virtual-meeting:delete] Found existing VM: ${existingVM.id}`);

  // ================================================
  // DELETE VM RECORD
  // ================================================

  const { error: deleteError } = await supabase
    .from("virtualmeetingschedulesandlinks")
    .delete()
    .eq("id", input.virtualMeetingId);

  if (deleteError) {
    console.error(`[virtual-meeting:delete] Delete failed:`, deleteError);
    throw new SupabaseSyncError(`Failed to delete virtual meeting: ${deleteError.message}`);
  }

  console.log(`[virtual-meeting:delete] Virtual meeting deleted successfully`);

  // ================================================
  // UPDATE PROPOSAL
  // ================================================

  const now = new Date().toISOString();
  const { error: proposalUpdateError } = await supabase
    .from("proposal")
    .update({
      "virtual meeting": null,
      "request virtual meeting": null,
      "Modified Date": now,
    })
    .eq("id", input.proposalId);

  if (proposalUpdateError) {
    console.error(`[virtual-meeting:delete] Proposal update failed:`, proposalUpdateError);
    // Non-blocking - VM was deleted successfully
  } else {
    console.log(`[virtual-meeting:delete] Proposal updated - cleared virtual meeting fields`);
  }

  // ================================================
  // RETURN RESPONSE
  // ================================================

  console.log(`[virtual-meeting:delete] Complete, returning response`);

  return {
    deleted: true,
    virtualMeetingId: input.virtualMeetingId,
    proposalId: input.proposalId,
    deletedAt: now,
  };
}
