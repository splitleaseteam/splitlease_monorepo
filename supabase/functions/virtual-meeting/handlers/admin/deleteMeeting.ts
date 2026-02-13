/**
 * Admin Handler: Delete Virtual Meeting
 *
 * Deletes a virtual meeting request (only for non-confirmed meetings)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AuthenticationError as _AuthenticationError, ValidationError } from "../../../_shared/errors.ts";

interface DeletePayload {
  meetingId: string;
}

interface AuthenticatedUser {
  id: string;
  email: string;
}

export async function handleAdminDeleteMeeting(
  payload: DeletePayload,
  user: AuthenticatedUser | null,
  supabase: SupabaseClient
): Promise<{ deleted: boolean; meetingId: string }> {
  // Authentication is now optional - internal pages can access without login

  // Validate input
  if (!payload.meetingId) {
    throw new ValidationError("Meeting ID is required");
  }

  console.log(`[admin_delete_meeting] Deleting meeting ${payload.meetingId}${user ? ` by admin: ${user.email}` : ' (unauthenticated)'}`);

  // Verify meeting exists and can be deleted
  const { data: existing, error: checkError } = await supabase
    .from("virtualmeetingschedulesandlinks")
    .select("id, confirmedbysplitlease, booked_date")
    .eq("id", payload.meetingId)
    .single();

  if (checkError || !existing) {
    throw new ValidationError("Meeting not found");
  }

  // Don't allow deletion of confirmed meetings
  if (existing.confirmedbysplitlease) {
    throw new ValidationError("Cannot delete a confirmed meeting");
  }

  // Delete the meeting
  const { error: deleteError } = await supabase
    .from("virtualmeetingschedulesandlinks")
    .delete()
    .eq("id", payload.meetingId);

  if (deleteError) {
    console.error("[admin_delete_meeting] Database error:", deleteError);
    throw new ValidationError(`Failed to delete meeting: ${deleteError.message}`);
  }

  console.log(`[admin_delete_meeting] Successfully deleted meeting ${payload.meetingId}`);

  return {
    deleted: true,
    meetingId: payload.meetingId
  };
}
