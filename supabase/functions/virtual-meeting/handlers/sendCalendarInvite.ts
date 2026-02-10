/**
 * Send Calendar Invite Handler
 * Split Lease - Supabase Edge Functions
 *
 * Sends a calendar invite notification email to the user about their virtual meeting.
 * Uses the internal send-email edge function via SendGrid.
 * This is a fire-and-forget operation.
 *
 * Steps:
 * 1. Validate input
 * 2. Look up proposal and user details from DB
 * 3. Send calendar invite email via send-email function
 * 4. Return success response
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError as _ValidationError } from "../../_shared/errors.ts";
import {
  SendCalendarInviteInput,
  SendCalendarInviteResponse,
  UserContext,
} from "../lib/types.ts";
import { validateSendCalendarInviteInput } from "../lib/validators.ts";

// Basic email template ID for internal notifications
const BASIC_TEMPLATE_ID = '1560447575939x331870423481483500';

/**
 * Handle send calendar invite request
 */
export async function handleSendCalendarInvite(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<SendCalendarInviteResponse> {
  console.log(`[virtual-meeting:send_calendar_invite] Starting for user: ${user?.email || 'public'}`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as SendCalendarInviteInput;
  validateSendCalendarInviteInput(input);

  console.log(`[virtual-meeting:send_calendar_invite] Validated input - proposal: ${input.proposalId}, user: ${input.userId}`);

  // ================================================
  // LOOK UP USER AND PROPOSAL DETAILS
  // ================================================

  const { data: targetUser } = await supabase
    .from('user')
    .select('email, first_name')
    .eq('id', input.userId)
    .single();

  if (!targetUser?.email) {
    throw new Error(`User not found or missing email: ${input.userId}`);
  }

  // ================================================
  // SEND CALENDAR INVITE EMAIL
  // ================================================

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration for internal email');
  }

  const subject = 'Virtual Meeting Calendar Invite - Split Lease';
  const bodyText = `Hi ${targetUser.first_name || 'there'}, a virtual meeting has been scheduled for your Split Lease booking (Proposal: ${input.proposalId}). Please check your dashboard for the meeting details and add it to your calendar.`;

  console.log(`[virtual-meeting:send_calendar_invite] Sending calendar invite email to: ${targetUser.email}`);

  const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'send',
      payload: {
        template_id: BASIC_TEMPLATE_ID,
        to_email: targetUser.email,
        to_name: targetUser.first_name || 'User',
        subject,
        variables: {
          body_text: bodyText,
          first_name: targetUser.first_name || '',
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[virtual-meeting:send_calendar_invite] Email send failed:`, errorText);
    throw new Error(`Failed to send calendar invite email: ${response.status}`);
  }

  console.log(`[virtual-meeting:send_calendar_invite] Calendar invite email sent successfully`);

  // ================================================
  // RETURN RESPONSE
  // ================================================

  const now = new Date().toISOString();

  return {
    success: true,
    proposalId: input.proposalId,
    userId: input.userId,
    triggeredAt: now,
  };
}
