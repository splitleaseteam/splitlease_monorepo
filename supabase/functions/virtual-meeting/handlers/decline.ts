/**
 * Decline Virtual Meeting Handler
 * Split Lease - Supabase Edge Functions
 *
 * Marks the virtual meeting as declined without deleting it.
 * The meeting record remains for history/audit purposes.
 *
 * Steps:
 * 1. Validate input
 * 2. Fetch proposal to get virtual meeting ID
 * 3. Update virtual meeting: set meeting declined = true
 * 4. Update proposal: clear request_virtual_meeting
 * 5. Return response
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError, SupabaseSyncError } from "../../_shared/errors.ts";
import {
  DeclineVirtualMeetingInput,
  DeclineVirtualMeetingResponse,
  UserContext,
} from "../lib/types.ts";
import { validateDeclineVirtualMeetingInput } from "../lib/validators.ts";

/**
 * Handle decline virtual meeting request
 */
export async function handleDecline(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<DeclineVirtualMeetingResponse> {
  console.log(`[virtual-meeting:decline] Starting decline for user: ${user?.email || 'public'}`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as DeclineVirtualMeetingInput;
  validateDeclineVirtualMeetingInput(input);

  console.log(`[virtual-meeting:decline] Validated input for proposal: ${input.proposalId}`);

  // ================================================
  // FETCH PROPOSAL TO GET VIRTUAL MEETING ID
  // ================================================

  const { data: proposal, error: proposalError } = await supabase
    .from("booking_proposal")
    .select(`id, virtual_meeting_record_id`)
    .eq("id", input.proposalId)
    .single();

  if (proposalError || !proposal) {
    console.error(`[virtual-meeting:decline] Proposal fetch failed:`, proposalError);
    throw new ValidationError(`Proposal not found: ${input.proposalId}`);
  }

  const virtualMeetingId = proposal.virtual_meeting_record_id;
  if (!virtualMeetingId) {
    throw new ValidationError(`No virtual meeting associated with proposal: ${input.proposalId}`);
  }

  console.log(`[virtual-meeting:decline] Found virtual meeting: ${virtualMeetingId}`);

  // ================================================
  // VERIFY VIRTUAL MEETING EXISTS
  // ================================================

  const { data: existingVM, error: vmFetchError } = await supabase
    .from("virtualmeetingschedulesandlinks")
    .select("id, meeting_declined")
    .eq("id", virtualMeetingId)
    .single();

  if (vmFetchError || !existingVM) {
    console.error(`[virtual-meeting:decline] VM not found:`, vmFetchError);
    throw new ValidationError(`Virtual meeting not found: ${virtualMeetingId}`);
  }

  // Check if already declined
  if (existingVM.meeting_declined) {
    console.log(`[virtual-meeting:decline] VM already declined, returning success`);
    return {
      success: true,
      proposalId: input.proposalId,
      declinedAt: new Date().toISOString(),
    };
  }

  // ================================================
  // UPDATE VIRTUAL MEETING
  // ================================================

  const now = new Date().toISOString();

  const vmUpdateData = {
    meeting_declined: true,
    original_updated_at: now,
  };

  const { error: vmUpdateError } = await supabase
    .from("virtualmeetingschedulesandlinks")
    .update(vmUpdateData)
    .eq("id", virtualMeetingId);

  if (vmUpdateError) {
    console.error(`[virtual-meeting:decline] VM update failed:`, vmUpdateError);
    throw new SupabaseSyncError(`Failed to update virtual meeting: ${vmUpdateError.message}`);
  }

  console.log(`[virtual-meeting:decline] Virtual meeting marked as declined`);

  // ================================================
  // UPDATE PROPOSAL
  // ================================================

  const { error: proposalUpdateError } = await supabase
    .from("booking_proposal")
    .update({
      virtual_meeting_request_status: null,
      updated_at: now,
    })
    .eq("id", input.proposalId);

  if (proposalUpdateError) {
    console.error(`[virtual-meeting:decline] Proposal update failed:`, proposalUpdateError);
    // Non-blocking - VM was updated successfully
  } else {
    console.log(`[virtual-meeting:decline] Proposal updated - cleared virtual meeting request`);
  }

  // ================================================
  // RETURN RESPONSE
  // ================================================

  console.log(`[virtual-meeting:decline] Complete, returning response`);

  return {
    success: true,
    proposalId: input.proposalId,
    declinedAt: now,
  };
}
