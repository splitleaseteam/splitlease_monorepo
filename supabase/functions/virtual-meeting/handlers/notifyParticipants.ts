/**
 * Notify Participants Handler
 * Split Lease - Supabase Edge Functions
 *
 * Sends notification emails to host and guest participants of a virtual meeting.
 * Uses the internal send-email edge function via SendGrid.
 * This is a fire-and-forget operation.
 *
 * Steps:
 * 1. Validate input
 * 2. Look up participant details from DB
 * 3. Send notification emails via send-email function
 * 4. Return success response
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError as _ValidationError } from "../../_shared/errors.ts";
import {
  NotifyParticipantsInput,
  NotifyParticipantsResponse,
  UserContext,
} from "../lib/types.ts";
import { validateNotifyParticipantsInput } from "../lib/validators.ts";

// Basic email template ID for internal notifications
const BASIC_TEMPLATE_ID = '1560447575939x331870423481483500';

/**
 * Send email via internal send-email edge function
 */
async function sendInternalEmail(
  toEmail: string,
  toName: string,
  subject: string,
  bodyText: string
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration for internal email');
  }

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
        to_email: toEmail,
        to_name: toName,
        subject,
        variables: {
          body_text: bodyText,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[virtual-meeting:notify_participants] Email send failed for ${toEmail}:`, errorText);
    throw new Error(`Failed to send notification email: ${response.status}`);
  }
}

/**
 * Handle notify participants request
 */
export async function handleNotifyParticipants(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<NotifyParticipantsResponse> {
  console.log(`[virtual-meeting:notify_participants] Starting for user: ${user?.email || 'public'}`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as NotifyParticipantsInput;
  validateNotifyParticipantsInput(input);

  console.log(`[virtual-meeting:notify_participants] Validated input - host: ${input.hostId}, guest: ${input.guestId}, vm: ${input.virtualMeetingId}`);

  // ================================================
  // LOOK UP PARTICIPANT DETAILS
  // ================================================

  const { data: hostUser } = await supabase
    .from('user')
    .select('email, first_name')
    .eq('id', input.hostId)
    .single();

  const { data: guestUser } = await supabase
    .from('user')
    .select('email, first_name')
    .eq('id', input.guestId)
    .single();

  // ================================================
  // SEND NOTIFICATION EMAILS
  // ================================================

  const subject = 'Virtual Meeting Update - Split Lease';
  const bodyForHost = `Hi ${hostUser?.first_name || 'there'}, you have a virtual meeting update regarding your listing. Meeting ID: ${input.virtualMeetingId}. Please check your dashboard for details.`;
  const bodyForGuest = `Hi ${guestUser?.first_name || 'there'}, you have a virtual meeting update. Meeting ID: ${input.virtualMeetingId}. Please check your dashboard for details.`;

  const emailPromises: Promise<void>[] = [];

  if (hostUser?.email) {
    console.log(`[virtual-meeting:notify_participants] Sending notification to host: ${hostUser.email}`);
    emailPromises.push(sendInternalEmail(hostUser.email, hostUser.first_name || 'Host', subject, bodyForHost));
  }

  if (guestUser?.email) {
    console.log(`[virtual-meeting:notify_participants] Sending notification to guest: ${guestUser.email}`);
    emailPromises.push(sendInternalEmail(guestUser.email, guestUser.first_name || 'Guest', subject, bodyForGuest));
  }

  await Promise.all(emailPromises);

  console.log(`[virtual-meeting:notify_participants] Notifications sent successfully`);

  // ================================================
  // RETURN RESPONSE
  // ================================================

  const now = new Date().toISOString();

  return {
    success: true,
    virtualMeetingId: input.virtualMeetingId,
    notifiedAt: now,
  };
}
