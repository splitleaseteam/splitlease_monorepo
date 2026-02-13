/**
 * Create Virtual Meeting Handler
 * Split Lease - Supabase Edge Functions
 *
 * Creates a virtual meeting record in the virtualmeetingschedulesandlinks table
 * and links it to the associated proposal.
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError, SupabaseSyncError } from "../../_shared/errors.ts";
import { sendVMRequestMessages } from "../../_shared/vmMessagingHelpers.ts";
import {
  CreateVirtualMeetingInput,
  CreateVirtualMeetingResponse,
  ProposalData,
  HostAccountData,
  UserData,
  UserContext,
} from "../lib/types.ts";
import { validateCreateVirtualMeetingInput } from "../lib/validators.ts";

/**
 * Handle create virtual meeting request
 *
 * Steps:
 * 1. Validate input (proposalId, timesSelected, requestedById)
 * 2. Fetch proposal to get Guest, Host, Listing relationships
 * 3. Fetch host user data via account_host -> user
 * 4. Fetch guest user data
 * 5. Generate unique id via generate_unique_id RPC
 * 6. Insert record into virtualmeetingschedulesandlinks
 * 7. Update proposal.virtual meeting field to link the new VM
 * 8. Return the created VM ID
 */
export async function handleCreate(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<CreateVirtualMeetingResponse> {
  console.log(`[virtual-meeting:create] Starting create for user: ${user?.email || 'public'}`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as CreateVirtualMeetingInput;
  validateCreateVirtualMeetingInput(input);

  console.log(`[virtual-meeting:create] Validated input for proposal: ${input.proposalId}`);

  // ================================================
  // FETCH RELATED DATA
  // ================================================

  // Fetch Proposal
  const { data: proposal, error: proposalError } = await supabase
    .from("booking_proposal")
    .select(`
      id,
      guest_user_id,
      listing_id,
      host_user_id
    `)
    .eq("id", input.proposalId)
    .single();

  if (proposalError || !proposal) {
    console.error(`[virtual-meeting:create] Proposal fetch failed:`, proposalError);
    throw new ValidationError(`Proposal not found: ${input.proposalId}`);
  }

  const proposalData = proposal as unknown as ProposalData;
  console.log(`[virtual-meeting:create] Found proposal, guest: ${proposalData.guest_user_id}, listing: ${proposalData.listing_id}, hostUser: ${proposalData.host_user_id}`);

  // Fetch Host User - try proposal's host_user_id first, fallback to listing's host_user_id
  let hostUserId = proposalData.host_user_id;

  if (!hostUserId && proposalData.listing_id) {
    console.log(`[virtual-meeting:create] Proposal has no Host User, fetching from listing: ${proposalData.listing_id}`);
    const { data: listing, error: listingError } = await supabase
      .from("listing")
      .select(`host_user_id`)
      .eq("id", proposalData.listing_id)
      .single();

    if (listingError || !listing) {
      console.error(`[virtual-meeting:create] Listing fetch failed:`, listingError);
      throw new ValidationError(`Cannot determine host: listing not found ${proposalData.listing_id}`);
    }

    hostUserId = listing.host_user_id;
    console.log(`[virtual-meeting:create] Got host from listing: ${hostUserId}`);
  }

  if (!hostUserId) {
    throw new ValidationError(`Cannot determine host user for proposal ${input.proposalId}`);
  }

  const { data: hostUser, error: hostUserError } = await supabase
    .from("user")
    .select('id, email, first_name, last_name, phone_number, notification_preference_setting')
    .eq("id", hostUserId)
    .single();

  if (hostUserError || !hostUser) {
    console.error(`[virtual-meeting:create] Host user fetch failed:`, hostUserError);
    throw new ValidationError(`Host user not found: ${hostUserId}`);
  }

  const hostUserData = hostUser as unknown as UserData;
  console.log(`[virtual-meeting:create] Found host user: ${hostUserData.email}`);

  // hostAccountData maintained for backwards compatibility with downstream code
  const hostAccountData = { id: hostUserData.id, user_id: hostUserData.id } as HostAccountData;

  // Fetch Guest User
  const { data: guestUser, error: guestUserError } = await supabase
    .from("user")
    .select('id, email, first_name, last_name, phone_number, notification_preference_setting')
    .eq("id", proposalData.guest_user_id)
    .single();

  if (guestUserError || !guestUser) {
    console.error(`[virtual-meeting:create] Guest user fetch failed:`, guestUserError);
    throw new ValidationError(`Guest user not found: ${proposalData.guest_user_id}`);
  }

  const guestUserData = guestUser as unknown as UserData;
  console.log(`[virtual-meeting:create] Found guest user: ${guestUserData.email}`);

  // ================================================
  // GENERATE ID
  // ================================================

  const { data: virtualMeetingId, error: idError } = await supabase.rpc('generate_unique_id');
  if (idError || !virtualMeetingId) {
    console.error(`[virtual-meeting:create] ID generation failed:`, idError);
    throw new SupabaseSyncError('Failed to generate virtual meeting ID');
  }

  console.log(`[virtual-meeting:create] Generated VM ID: ${virtualMeetingId}`);

  // ================================================
  // CREATE VIRTUAL MEETING RECORD
  // ================================================

  const now = new Date().toISOString();

  // Build the virtual meeting record
  const vmData = {
    id: virtualMeetingId,

    // Relationships
    host: hostAccountData.user_id,
    guest: proposalData.guest_user_id,
    proposal: input.proposalId,
    requested_by: input.requestedById,
    listing_for_co_host_feature: proposalData.listing_id,

    // Meeting metadata
    meeting_duration: 45, // Default 45 minutes
    suggested_dates_and_times: input.timesSelected, // Store as-is (ISO 8601 strings)

    // Status fields - all false/null initially
    booked_date: null,
    confirmedbysplitlease: false,
    meeting_declined: false,
    meeting_link: null,
    end_of_meeting: null,
    pending: false,

    // Participant info
    guest_email: guestUserData.email,
    guest_name: `${guestUserData.first_name || ''} ${guestUserData.last_name || ''}`.trim() || null,
    host_email: hostUserData.email,
    host_name: `${hostUserData.first_name || ''} ${hostUserData.last_name || ''}`.trim() || null,

    // Invitation tracking
    invitation_sent_to_guest: false,
    invitation_sent_to_host: false,

    // Audit fields
    created_by: input.requestedById,
    original_created_at: now,
    original_updated_at: now,
  };

  console.log(`[virtual-meeting:create] Inserting virtual meeting: ${virtualMeetingId}`);

  const { error: insertError } = await supabase
    .from("virtualmeetingschedulesandlinks")
    .insert(vmData);

  if (insertError) {
    console.error(`[virtual-meeting:create] Insert failed:`, insertError);
    throw new SupabaseSyncError(`Failed to create virtual meeting: ${insertError.message}`);
  }

  console.log(`[virtual-meeting:create] Virtual meeting created successfully`);

  // ================================================
  // UPDATE PROPOSAL WITH VIRTUAL MEETING LINK
  // ================================================

  // Determine if requester is host or guest
  const requesterIsHost = input.requestedById === hostUserData.id;
  const requestVirtualMeetingValue = requesterIsHost ? "host" : "guest";

  console.log(`[virtual-meeting:create] Requester: ${input.requestedById}, Host: ${hostUserData.id}, Value: ${requestVirtualMeetingValue}`);

  const { error: proposalUpdateError } = await supabase
    .from("booking_proposal")
    .update({
      virtual_meeting_request_status: requestVirtualMeetingValue,
      virtual_meeting_record_id: virtualMeetingId,
      updated_at: now,
    })
    .eq("id", input.proposalId);

  if (proposalUpdateError) {
    console.error(`[virtual-meeting:create] Proposal update failed:`, proposalUpdateError);
    // Non-blocking - continue (VM was created successfully)
  } else {
    console.log(`[virtual-meeting:create] Proposal updated with VM link and request status`);
  }

  // ================================================
  // SEND MULTI-CHANNEL NOTIFICATIONS
  // ================================================

  try {
    // Fetch notification preferences
    const [hostNotifResult, guestNotifResult] = await Promise.all([
      hostUserData.notification_preference_setting
        ? supabase.from("notificationsettingsos_lists_").select('virtual_meetings').eq("id", hostUserData.notification_preference_setting).single()
        : { data: null },
      guestUserData.notification_preference_setting
        ? supabase.from("notificationsettingsos_lists_").select('virtual_meetings').eq("id", guestUserData.notification_preference_setting).single()
        : { data: null },
    ]);

    const hostVmNotifs: string[] = hostNotifResult.data?.virtual_meetings || [];
    const guestVmNotifs: string[] = guestNotifResult.data?.virtual_meetings || [];

    // Fetch listing name for context
    let listingName: string | undefined;
    if (proposalData.listing_id) {
      const { data: listing } = await supabase
        .from("listing")
        .select('listing_title')
        .eq("id", proposalData.listing_id)
        .single();
      listingName = listing?.listing_title;
    }

    const messageResult = await sendVMRequestMessages(supabase, {
      proposalId: input.proposalId,
      hostUserId: hostUserData.id,
      guestUserId: guestUserData.id,
      listingId: proposalData.listing_id,
      listingName,
      hostName: hostUserData.first_name,
      guestName: guestUserData.first_name,
      hostEmail: hostUserData.email,
      guestEmail: guestUserData.email,
      hostPhone: hostUserData.phone_number,
      guestPhone: guestUserData.phone_number,
      suggestedDates: input.timesSelected,
      notifyHostSms: hostVmNotifs.includes('SMS'),
      notifyHostEmail: hostVmNotifs.includes('Email'),
      notifyGuestSms: guestVmNotifs.includes('SMS'),
      notifyGuestEmail: guestVmNotifs.includes('Email'),
    }, requesterIsHost);

    console.log(`[virtual-meeting:create] Notifications sent:`, {
      thread: messageResult.threadId,
      inApp: { guest: !!messageResult.guestMessageId, host: !!messageResult.hostMessageId },
      email: { guest: messageResult.guestEmailSent, host: messageResult.hostEmailSent },
      sms: { guest: messageResult.guestSmsSent, host: messageResult.hostSmsSent },
    });
  } catch (msgError) {
    // Non-blocking - log and continue
    console.error(`[virtual-meeting:create] Failed to send notifications (non-blocking):`, msgError);
  }

  // ================================================
  // RETURN RESPONSE
  // ================================================

  console.log(`[virtual-meeting:create] Complete, returning response`);

  return {
    virtualMeetingId: virtualMeetingId,
    proposalId: input.proposalId,
    requestedById: input.requestedById,
    createdAt: now,
  };
}
