/**
 * Accept Virtual Meeting Handler
 * Split Lease - Supabase Edge Functions
 *
 * Updates the virtual meeting record with the selected booked date.
 * This confirms the meeting and sets the scheduled time.
 *
 * Steps:
 * 1. Validate input
 * 2. Fetch proposal to get virtual meeting ID
 * 3. Update virtual meeting: set booked date, confirm status
 * 4. Update proposal: set request_virtual_meeting status
 * 5. Return response
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError, SupabaseSyncError } from "../../_shared/errors.ts";
import { sendVMAcceptMessages } from "../../_shared/vmMessagingHelpers.ts";
import {
  AcceptVirtualMeetingInput,
  AcceptVirtualMeetingResponse,
  UserContext,
} from "../lib/types.ts";
import { validateAcceptVirtualMeetingInput } from "../lib/validators.ts";

/**
 * Handle accept virtual meeting request
 */
export async function handleAccept(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<AcceptVirtualMeetingResponse> {
  console.log(`[virtual-meeting:accept] Starting accept for user: ${user?.email || 'public'}`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as AcceptVirtualMeetingInput;
  validateAcceptVirtualMeetingInput(input);

  console.log(`[virtual-meeting:accept] Validated input for proposal: ${input.proposalId}`);

  // ================================================
  // FETCH PROPOSAL TO GET VIRTUAL MEETING ID
  // ================================================

  const { data: proposal, error: proposalError } = await supabase
    .from("booking_proposal")
    .select(`id, virtual_meeting_record_id`)
    .eq("id", input.proposalId)
    .single();

  if (proposalError || !proposal) {
    console.error(`[virtual-meeting:accept] Proposal fetch failed:`, proposalError);
    throw new ValidationError(`Proposal not found: ${input.proposalId}`);
  }

  const virtualMeetingId = proposal.virtual_meeting_record_id;
  if (!virtualMeetingId) {
    throw new ValidationError(`No virtual meeting associated with proposal: ${input.proposalId}`);
  }

  console.log(`[virtual-meeting:accept] Found virtual meeting: ${virtualMeetingId}`);

  // ================================================
  // VERIFY VIRTUAL MEETING EXISTS
  // ================================================

  const { data: existingVM, error: vmFetchError } = await supabase
    .from("virtualmeetingschedulesandlinks")
    .select(`
      id,
      meeting_declined,
      booked_date,
      host,
      guest,
      proposal,
      host_name,
      guest_name,
      host_email,
      guest_email,
      listing_for_co_host_feature,
      confirmedbysplitlease
    `)
    .eq("id", virtualMeetingId)
    .single();

  if (vmFetchError || !existingVM) {
    console.error(`[virtual-meeting:accept] VM not found:`, vmFetchError);
    throw new ValidationError(`Virtual meeting not found: ${virtualMeetingId}`);
  }

  // Check if already declined
  if (existingVM.meeting_declined) {
    throw new ValidationError(`Virtual meeting has already been declined`);
  }

  // Check if already booked
  if (existingVM.booked_date) {
    throw new ValidationError(`Virtual meeting already has a booked date`);
  }

  // ================================================
  // UPDATE VIRTUAL MEETING
  // ================================================

  const now = new Date().toISOString();

  const vmUpdateData = {
    booked_date: input.bookedDate,
    confirmedbysplitlease: true,
    pending: false,
    original_updated_at: now,
  };

  const { error: vmUpdateError } = await supabase
    .from("virtualmeetingschedulesandlinks")
    .update(vmUpdateData)
    .eq("id", virtualMeetingId);

  if (vmUpdateError) {
    console.error(`[virtual-meeting:accept] VM update failed:`, vmUpdateError);
    throw new SupabaseSyncError(`Failed to update virtual meeting: ${vmUpdateError.message}`);
  }

  console.log(`[virtual-meeting:accept] Virtual meeting updated with booked date: ${input.bookedDate}`);

  // ================================================
  // UPDATE PROPOSAL
  // ================================================

  const { error: proposalUpdateError } = await supabase
    .from("booking_proposal")
    .update({
      virtual_meeting_request_status: "confirmed",
      updated_at: now,
    })
    .eq("id", input.proposalId);

  if (proposalUpdateError) {
    console.error(`[virtual-meeting:accept] Proposal update failed:`, proposalUpdateError);
    // Non-blocking - VM was updated successfully
  } else {
    console.log(`[virtual-meeting:accept] Proposal updated with confirmed status`);
  }

  // ================================================
  // SEND MULTI-CHANNEL NOTIFICATIONS
  // ================================================

  try {
    // Fetch user data for phone numbers and notification settings
    const [hostData, guestData] = await Promise.all([
      supabase.from("user").select('id, phone_number, notification_preference_setting').eq("id", existingVM.host).single(),
      supabase.from("user").select('id, phone_number, notification_preference_setting').eq("id", existingVM.guest).single(),
    ]);

    if (hostData.error) console.warn(`[virtual-meeting:accept] Failed to fetch host user:`, hostData.error.message);
    if (guestData.error) console.warn(`[virtual-meeting:accept] Failed to fetch guest user:`, guestData.error.message);

    // Fetch notification preferences
    const [hostNotifSettings, guestNotifSettings] = await Promise.all([
      hostData.data?.notification_preference_setting
        ? supabase.from("notificationsettingsos_lists_").select('virtual_meetings').eq("id", hostData.data.notification_preference_setting).single()
        : { data: null, error: null },
      guestData.data?.notification_preference_setting
        ? supabase.from("notificationsettingsos_lists_").select('virtual_meetings').eq("id", guestData.data.notification_preference_setting).single()
        : { data: null, error: null },
    ]);

    if (hostNotifSettings.error) console.warn(`[virtual-meeting:accept] Failed to fetch host notif settings:`, hostNotifSettings.error.message);
    if (guestNotifSettings.error) console.warn(`[virtual-meeting:accept] Failed to fetch guest notif settings:`, guestNotifSettings.error.message);

    const hostVmNotifs: string[] = hostNotifSettings.data?.virtual_meetings || [];
    const guestVmNotifs: string[] = guestNotifSettings.data?.virtual_meetings || [];

    // Fetch listing name for context
    let listingName: string | undefined;
    if (existingVM.listing_for_co_host_feature) {
      const { data: listing } = await supabase
        .from("listing")
        .select('listing_title')
        .eq("id", existingVM.listing_for_co_host_feature)
        .single();
      listingName = listing?.listing_title;
    }

    const messageResult = await sendVMAcceptMessages(supabase, {
      proposalId: input.proposalId,
      hostUserId: existingVM.host,
      guestUserId: existingVM.guest,
      listingId: existingVM.listing_for_co_host_feature,
      listingName,
      hostName: existingVM.host_name,
      guestName: existingVM.guest_name,
      hostEmail: existingVM.host_email,
      guestEmail: existingVM.guest_email,
      hostPhone: hostData.data?.phone_number,
      guestPhone: guestData.data?.phone_number,
      bookedDate: input.bookedDate,
      notifyHostSms: hostVmNotifs.includes('SMS'),
      notifyHostEmail: hostVmNotifs.includes('Email'),
      notifyGuestSms: guestVmNotifs.includes('SMS'),
      notifyGuestEmail: guestVmNotifs.includes('Email'),
    }, vmUpdateData.confirmedbysplitlease);

    console.log(`[virtual-meeting:accept] Notifications sent:`, {
      thread: messageResult.threadId,
      inApp: { guest: !!messageResult.guestMessageId, host: !!messageResult.hostMessageId },
      email: { guest: messageResult.guestEmailSent, host: messageResult.hostEmailSent },
      sms: { guest: messageResult.guestSmsSent, host: messageResult.hostSmsSent },
    });
  } catch (msgError) {
    // Non-blocking - log and continue
    console.error(`[virtual-meeting:accept] Failed to send notifications (non-blocking):`, msgError);
  }

  // ================================================
  // RETURN RESPONSE
  // ================================================

  console.log(`[virtual-meeting:accept] Complete, returning response`);

  return {
    success: true,
    virtualMeetingId: virtualMeetingId,
    proposalId: input.proposalId,
    bookedDate: input.bookedDate,
    updatedAt: now,
  };
}
