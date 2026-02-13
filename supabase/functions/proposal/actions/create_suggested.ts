/**
 * Create Suggested Proposal Action
 * Split Lease - Supabase Edge Functions
 *
 * Internal action for creating proposals on behalf of guests.
 * Used by the internal admin page at /_internal/create-suggested-proposal
 *
 * Key differences from regular create:
 * - No authentication required (internal tool)
 * - Simplified validation (assumes data is already validated by UI)
 * - Uses "Proposal Submitted for guest by Split Lease - Awaiting Rental Application" status
 * - Creates associated thread record for messaging
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError, SupabaseSyncError } from "../../_shared/errors.ts";
import {
  ListingData,
  GuestData,
  HostUserData,
  RentalApplicationData,
  RentalType,
  ReservationSpan,
} from "../lib/types.ts";
import {
  calculateCompensation,
  calculateMoveOutDate,
  calculateComplementaryNights,
  calculateOrderRanking,
  formatPriceForDisplay,
  getNightlyRateForNights,
  fetchAvgDaysPerMonth,
} from "../lib/calculations.ts";
import {
  addUserProposal,
  addUserListingFavorite,
} from "../../_shared/junctionHelpers.ts";
import { parseJsonArray } from "../../_shared/jsonUtils.ts";
import {
  createSplitBotMessage,
  updateThreadLastMessage,
  getUserProfile,
  getListingName,
  generatePlatformId,
} from "../../_shared/messagingHelpers.ts";
import {
  getCTAForProposalStatus,
  buildTemplateContext,
  getDefaultMessage,
  getVisibilityForRole,
} from "../../_shared/ctaHelpers.ts";
import {
  generateSuggestedProposalSummary,
  formatPreviousProposals,
  formatDaysAsRange,
} from "../../_shared/negotiationSummaryHelpers.ts";
import {
  getNotificationPreferences,
  shouldSendEmail,
  shouldSendSms,
  sendProposalEmail,
  sendProposalSms,
  EMAIL_TEMPLATES,
} from "../../_shared/notificationHelpers.ts";
import { sendToSlack } from "../../_shared/slack.ts";

// ─────────────────────────────────────────────────────────────
// INPUT TYPE
// ─────────────────────────────────────────────────────────────

export interface CreateSuggestedProposalInput {
  // Required Identifiers
  listingId: string;
  guestId: string;

  // Day/Night Selection (0-indexed: 0=Sunday, 6=Saturday)
  daysSelected: number[];
  nightsSelected: number[];
  checkIn: number;
  checkOut: number;

  // Dates & Duration
  moveInStartRange: string; // ISO date
  moveInEndRange: string; // ISO date
  reservationSpanWeeks: number;
  reservationSpan: string; // → os_stay_periods.name

  // Pricing (calculated by frontend from pricing_list)
  nightlyPrice: number;
  totalPrice: number;
  hostCompensation: number;
  cleaningFee: number;
  damageDeposit: number;
  fourWeekRent: number;

  // Optional Guest Info
  guestFlexibility?: string;
  preferredGender?: string;
  comment?: string;

  // Guest Profile Fields (saved to user table)
  aboutMe?: string;
  needForSpace?: string;
  specialNeeds?: string;
}

// ─────────────────────────────────────────────────────────────
// RESPONSE TYPE
// ─────────────────────────────────────────────────────────────

export interface CreateSuggestedProposalResponse {
  proposalId: string;
  threadId: string;
  status: string;
  listingId: string;
  guestId: string;
  hostId: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────

function validateDayIndices(days: number[]): boolean {
  if (!Array.isArray(days)) return false;
  return days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
}

function validateCreateSuggestedInput(input: CreateSuggestedProposalInput): void {
  // Required identifiers
  if (!input.listingId || typeof input.listingId !== "string") {
    throw new ValidationError("listingId is required and must be a string");
  }
  if (!input.guestId || typeof input.guestId !== "string") {
    throw new ValidationError("guestId is required and must be a string");
  }

  // Day/Night selection
  if (!Array.isArray(input.daysSelected) || input.daysSelected.length === 0) {
    throw new ValidationError("daysSelected must be a non-empty array");
  }
  if (!validateDayIndices(input.daysSelected)) {
    throw new ValidationError("daysSelected must contain integer values 0-6 (Sun=0, Sat=6)");
  }
  if (!Array.isArray(input.nightsSelected) || input.nightsSelected.length === 0) {
    throw new ValidationError("nightsSelected must be a non-empty array");
  }
  if (!validateDayIndices(input.nightsSelected)) {
    throw new ValidationError("nightsSelected must contain integer values 0-6");
  }
  if (typeof input.checkIn !== "number" || !validateDayIndices([input.checkIn])) {
    throw new ValidationError("checkIn must be an integer value 0-6");
  }
  if (typeof input.checkOut !== "number" || !validateDayIndices([input.checkOut])) {
    throw new ValidationError("checkOut must be an integer value 0-6");
  }

  // Dates
  if (!input.moveInStartRange) {
    throw new ValidationError("moveInStartRange is required");
  }
  if (!input.moveInEndRange) {
    throw new ValidationError("moveInEndRange is required");
  }

  // Duration
  if (typeof input.reservationSpanWeeks !== "number" || input.reservationSpanWeeks < 1) {
    throw new ValidationError("reservationSpanWeeks must be a positive number");
  }
  if (!input.reservationSpan || typeof input.reservationSpan !== "string") {
    throw new ValidationError("reservationSpan is required and must be a string");
  }

  // Pricing
  if (typeof input.nightlyPrice !== "number" || input.nightlyPrice < 0) {
    throw new ValidationError("nightlyPrice must be a non-negative number");
  }
  if (typeof input.totalPrice !== "number" || input.totalPrice < 0) {
    throw new ValidationError("totalPrice must be a non-negative number");
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────

export async function handleCreateSuggested(
  payload: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<CreateSuggestedProposalResponse> {
  console.log(`[proposal:create_suggested] Starting suggested proposal creation`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as CreateSuggestedProposalInput;
  validateCreateSuggestedInput(input);

  console.log(`[proposal:create_suggested] Validated input for listing: ${input.listingId}, guest: ${input.guestId}`);

  // ================================================
  // DUPLICATE CHECK
  // ================================================

  const excludedStatuses = [
    'Proposal Cancelled by Guest',
    'Proposal Cancelled by Host',
    'Proposal Cancelled by Split Lease',
    'Proposal Rejected by Host',
    'Proposal Rejected by Guest'
  ];

  const { data: existingProposals, error: duplicateCheckError } = await supabase
    .from("booking_proposal")
    .select("id, proposal_workflow_status")
    .eq('guest_user_id', input.guestId)
    .eq('listing_id', input.listingId)
    .eq('is_deleted', false)
    .limit(10);

  if (duplicateCheckError) {
    console.error(`[proposal:create_suggested] Duplicate check failed:`, duplicateCheckError);
    // Non-blocking - continue
  } else if (existingProposals && existingProposals.length > 0) {
    const activeProposals = existingProposals.filter(
      (p) => !excludedStatuses.includes(p.proposal_workflow_status)
    );

    if (activeProposals.length > 0) {
      console.warn(`[proposal:create_suggested] Active proposal exists:`, {
        existingProposalId: activeProposals[0].id,
        existingStatus: activeProposals[0].proposal_workflow_status
      });
      // Note: For internal tool, we warn but don't block (admin may need to create anyway)
    }
  }

  // ================================================
  // FETCH RELATED DATA
  // ================================================

  // Fetch Listing
  const { data: listing, error: listingError } = await supabase
    .from("listing")
    .select(`
      id,
      host_user_id,
      rental_type,
      house_rule_reference_ids_json,
      cleaning_fee_amount,
      damage_deposit_amount,
      weeks_offered_schedule_text,
      available_days_as_day_numbers_json,
      available_nights_as_day_numbers_json,
      address_with_lat_lng_json,
      map_pin_offset_address_json,
      borough,
      weekly_rate_paid_to_host,
      nightly_rate_for_2_night_stay,
      nightly_rate_for_3_night_stay,
      nightly_rate_for_4_night_stay,
      nightly_rate_for_5_night_stay,
      nightly_rate_for_7_night_stay,
      monthly_rate_paid_to_host,
      is_deleted
    `)
    .eq("id", input.listingId)
    .single();

  if (listingError || !listing) {
    console.error(`[proposal:create_suggested] Listing fetch failed:`, listingError);
    throw new ValidationError(`Listing not found: ${input.listingId}`);
  }

  if ((listing as Record<string, unknown>).is_deleted === true) {
    throw new ValidationError(`Cannot create proposal for deleted listing: ${input.listingId}`);
  }

  const listingData = listing as unknown as ListingData;
  console.log(`[proposal:create_suggested] Found listing, host user: ${listingData.host_user_id}`);

  // Fetch Guest User
  const { data: guest, error: guestError } = await supabase
    .from("user")
    .select(`
      id,
      email,
      rental_application_form_id,
      bio_text,
      stated_need_for_space_text,
      stated_special_needs_text,
      onboarding_tasks_completed_list_json
    `)
    .eq("id", input.guestId)
    .single();

  if (guestError || !guest) {
    console.error(`[proposal:create_suggested] Guest fetch failed:`, guestError);
    throw new ValidationError(`Guest not found: ${input.guestId}`);
  }

  const guestData = guest as unknown as GuestData;
  console.log(`[proposal:create_suggested] Found guest: ${guestData.email}`);

  // Fetch Host User
  const { data: hostUser, error: hostUserError } = await supabase
    .from("user")
    .select(`id, email`)
    .eq("id", listingData.host_user_id)
    .single();

  if (hostUserError || !hostUser) {
    console.error(`[proposal:create_suggested] Host user fetch failed:`, hostUserError);
    throw new ValidationError(`Host user not found: ${listingData.host_user_id}`);
  }

  const hostUserData = hostUser as unknown as HostUserData;
  console.log(`[proposal:create_suggested] Found host: ${hostUserData.email}`);

  // Fetch Rental Application (if exists)
  let rentalApp: RentalApplicationData | null = null;
  let hasRentalApp = false;
  if (guestData.rental_application_form_id) {
    const { data: app } = await supabase
      .from("rentalapplication")
      .select("id, submitted")
      .eq("id", guestData.rental_application_form_id)
      .single();
    rentalApp = app as RentalApplicationData | null;
    hasRentalApp = rentalApp !== null;
    console.log(`[proposal:create_suggested] Rental app found, submitted: ${rentalApp?.submitted}`);
  }

  // ================================================
  // CALCULATIONS
  // ================================================

  // Order ranking from junction table (user_proposal)
  const { count: guestProposalCount } = await supabase
    .from('user_proposal')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', input.guestId);
  const orderRanking = calculateOrderRanking(guestProposalCount || 0);

  // Complementary nights
  const complementaryNights = calculateComplementaryNights(
    listingData.available_nights_as_day_numbers_json || [],
    input.nightsSelected
  );

  // Compensation calculation
  const rentalType = ((listingData.rental_type || "nightly").toLowerCase()) as RentalType;
  const nightsPerWeek = input.nightsSelected.length;
  const hostNightlyRate = getNightlyRateForNights(listingData, nightsPerWeek);
  const needsAvgDaysPerMonth =
    rentalType === "monthly" || (input.reservationSpan || "other") === "other";
  const avgDaysPerMonth = needsAvgDaysPerMonth
    ? await fetchAvgDaysPerMonth(supabase)
    : 30.4375;

  const compensation = calculateCompensation(
    rentalType,
    (input.reservationSpan || "other") as ReservationSpan,
    nightsPerWeek,
    listingData.weekly_rate_paid_to_host || 0,
    hostNightlyRate,
    input.reservationSpanWeeks,
    listingData.monthly_rate_paid_to_host || 0,
    avgDaysPerMonth
  );

  // Move-out date
  const moveOutDate = calculateMoveOutDate(
    new Date(input.moveInStartRange),
    input.reservationSpanWeeks,
    nightsPerWeek
  );

  // Status: Suggested proposals ALWAYS start in "Pending Confirmation"
  // The guest must confirm the suggestion before it progresses to any other state.
  // Only after guest confirmation will the workflow check rental app status.
  const status = "Proposal Submitted for guest by Split Lease - Pending Confirmation";

  console.log(`[proposal:create_suggested] Using status: ${status}`);

  // ================================================
  // GENERATE IDS
  // ================================================

  // Generate unique ID for proposal
  const { data: proposalId, error: proposalIdError } = await supabase.rpc('generate_unique_id');
  if (proposalIdError || !proposalId) {
    console.error(`[proposal:create_suggested] Proposal ID generation failed:`, proposalIdError);
    throw new SupabaseSyncError('Failed to generate proposal ID');
  }

  // Generate unique ID for thread
  const { data: threadId, error: threadIdError } = await supabase.rpc('generate_unique_id');
  if (threadIdError || !threadId) {
    console.error(`[proposal:create_suggested] Thread ID generation failed:`, threadIdError);
    throw new SupabaseSyncError('Failed to generate thread ID');
  }

  console.log(`[proposal:create_suggested] Generated IDs - Proposal: ${proposalId}, Thread: ${threadId}`);

  // ================================================
  // CREATE PROPOSAL RECORD
  // ================================================

  const now = new Date().toISOString();
  const historyEntry = `Suggested proposal created by Split Lease on ${new Date().toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;

  const guestFlexibility = input.guestFlexibility || "Flexible";
  const preferredGender = input.preferredGender || "any";

  const proposalData = {
    id: proposalId,

    // Core relationships
    listing_id: input.listingId,
    guest_user_id: input.guestId,
    host_user_id: hostUserData.id,
    created_by_user_id: "Split Lease", // Indicates internal creation

    // Guest info
    guest_email_address: guestData.email,
    guest_schedule_flexibility_text: guestFlexibility,
    preferred_roommate_gender: preferredGender,
    guest_introduction_message: input.comment || null,

    // Dates
    move_in_range_start_date: input.moveInStartRange,
    move_in_range_end_date: input.moveInEndRange,
    planned_move_out_date: moveOutDate.toISOString(),

    // Duration
    reservation_span_text: input.reservationSpan,
    reservation_span_in_weeks: input.reservationSpanWeeks,
    actual_weeks_in_reservation_span: input.reservationSpanWeeks,
    stay_duration_in_months: compensation.duration_months,

    // Day/Night selection (0-indexed)
    guest_selected_days_numbers_json: input.daysSelected,
    guest_selected_nights_numbers_json: input.nightsSelected,
    nights_per_week_count: nightsPerWeek,
    checkin_day_of_week_number: input.checkIn,
    checkout_day_of_week_number: input.checkOut,
    available_days_of_week_numbers_json: listingData.available_days_as_day_numbers_json,
    complimentary_free_nights_numbers_json: complementaryNights,

    // Pricing
    calculated_nightly_price: input.nightlyPrice,
    four_week_rent_amount: input.fourWeekRent || compensation.four_week_rent,
    total_reservation_price_for_guest: input.totalPrice,
    total_compensation_for_host: input.hostCompensation || compensation.total_compensation,
    host_compensation_per_period: compensation.host_compensation_per_night,
    four_week_host_compensation: compensation.four_week_compensation,
    cleaning_fee_amount: input.cleaningFee || listingData.cleaning_fee_amount || 0,
    damage_deposit_amount: input.damageDeposit || listingData.damage_deposit_amount || 0,
    nightly_price_for_map_display_text: formatPriceForDisplay(input.nightlyPrice),

    // From listing
    rental_type: listingData.rental_type,
    house_rules_reference_ids_json: listingData.house_rule_reference_ids_json,
    week_pattern_selection: listingData.weeks_offered_schedule_text,
    host_proposed_house_rules_json: listingData.house_rule_reference_ids_json,
    listing_address_with_coordinates_json: listingData.address_with_lat_lng_json,
    listing_map_pin_offset_address_json: listingData.map_pin_offset_address_json,

    // Status & metadata
    proposal_workflow_status: status,
    display_sort_order: orderRanking,
    proposal_event_log_json: [historyEntry],
    is_finalized: false,
    is_deleted: false,

    // Related records
    rental_application_id: guestData.rental_application_form_id,
    is_rental_application_requested: hasRentalApp,
    host_email_address: hostUserData.email,

    // Note: Thread relationship is managed via thread.Proposal FK, not here

    // Timestamps
    created_at: now,
    updated_at: now,
    original_created_at: now,
    original_updated_at: now,
  };

  console.log(`[proposal:create_suggested] Inserting proposal: ${proposalId}`);

  const { error: proposalInsertError } = await supabase
    .from("booking_proposal")
    .insert(proposalData);

  if (proposalInsertError) {
    console.error(`[proposal:create_suggested] Proposal insert failed:`, proposalInsertError);
    throw new SupabaseSyncError(`Failed to create proposal: ${proposalInsertError.message}`);
  }

  console.log(`[proposal:create_suggested] Proposal created successfully`);

  // ================================================
  // CREATE THREAD RECORD
  // ================================================

  const threadData = {
    id: threadId,
    proposal_id: proposalId,
    listing_id: input.listingId,
    guest_user_id: input.guestId,
    host_user_id: hostUserData.id,
    created_at: now,
    updated_at: now,
  };

  console.log(`[proposal:create_suggested] Inserting thread: ${threadId}`);

  const { error: threadInsertError } = await supabase
    .from('message_thread')
    .insert(threadData);

  if (threadInsertError) {
    console.error(`[proposal:create_suggested] Thread insert failed:`, threadInsertError);
    // Note: Proposal already created, so we log but continue
    console.warn(`[proposal:create_suggested] Proposal created but thread creation failed - manual intervention may be needed`);
  } else {
    console.log(`[proposal:create_suggested] Thread created successfully`);

    // Fetch user profiles and listing name for message templates (used by SplitBot + notifications)
    const [guestProfile, hostProfile, listingName] = await Promise.all([
      getUserProfile(supabase, input.guestId),
      getUserProfile(supabase, hostUserData.id),
      getListingName(supabase, input.listingId),
    ]);

    const guestFirstName = guestProfile?.firstName || "Guest";
    const hostFirstName = hostProfile?.firstName || "Host";
    const resolvedListingName = listingName || "this listing";

    // ================================================
    // SEND SPLITBOT WELCOME MESSAGES
    // ================================================
    // Send automated messages to both guest and host so they see the thread immediately
    // For suggested proposals, generate AI-powered summary explaining WHY this match

    try {

      // Build template context for CTA rendering
      const templateContext = buildTemplateContext(hostFirstName, guestFirstName, resolvedListingName);

      console.log(`[proposal:create_suggested] Sending SplitBot messages for status: ${status}`);

      // Get CTAs for guest and host based on proposal status
      const [guestCTA, hostCTA] = await Promise.all([
        getCTAForProposalStatus(supabase, status, "guest", templateContext),
        getCTAForProposalStatus(supabase, status, "host", templateContext),
      ]);

      // ================================================
      // GENERATE AI SUMMARY FOR GUEST (suggested proposals only)
      // ================================================
      let aiGuestSummary: string | null = null;
      if (status.includes("Split Lease")) {
        try {
          console.log(`[proposal:create_suggested] Generating AI summary for suggested proposal...`);

          // Fetch previous proposals for comparison
          const previousProposals = await formatPreviousProposals(
            supabase,
            input.guestId,
            proposalId
          );

          // Generate AI-powered summary explaining why this listing was suggested
          aiGuestSummary = await generateSuggestedProposalSummary(supabase, {
            guestFirstName: guestFirstName,
            guestBio: input.aboutMe || guestData.bio_text || "",
            needForSpace: input.needForSpace || guestData.stated_need_for_space_text || "",
            listingName: resolvedListingName,
            listingBorough: listingData.borough || "NYC",
            reservationWeeks: input.reservationSpanWeeks,
            moveInStart: input.moveInStartRange,
            moveInEnd: input.moveInEndRange,
            selectedDays: formatDaysAsRange(input.daysSelected),
            nightlyPrice: input.nightlyPrice,
            totalPrice: input.totalPrice,
            previousProposals,
          });

          if (aiGuestSummary) {
            console.log(`[proposal:create_suggested] AI summary generated successfully`);

            // ================================================
            // PERSIST AI SUMMARY TO negotiationsummary TABLE
            // ================================================
            // The frontend (SuggestedProposalPopup) queries this table to display
            // the "Why This Listing?" explanation to the guest
            try {
              const summaryId = await generatePlatformId(supabase);
              const now = new Date().toISOString();

              const { error: summaryInsertError } = await supabase
                .from('negotiationsummary')
                .insert({
                  id: summaryId,
                  proposal_associated: proposalId,
                  created_by: input.guestId,
                  original_created_at: now,
                  original_updated_at: now,
                  to_account: input.guestId,
                  summary: aiGuestSummary,
                });

              if (summaryInsertError) {
                console.error(`[proposal:create_suggested] Failed to persist AI summary:`, {
                  code: summaryInsertError.code,
                  message: summaryInsertError.message,
                  details: summaryInsertError.details,
                  hint: summaryInsertError.hint,
                });
                // Non-blocking: Summary display is secondary to proposal creation
              } else {
                console.log(`[proposal:create_suggested] AI summary persisted to negotiationsummary: ${summaryId}`);
              }
            } catch (persistError) {
              console.error(`[proposal:create_suggested] Exception persisting AI summary:`, persistError);
              // Non-blocking: Continue with proposal creation
            }
          } else {
            console.log(`[proposal:create_suggested] AI summary returned null, using default message`);
          }
        } catch (aiError) {
          console.warn(`[proposal:create_suggested] AI summary generation failed, using default:`, aiError);
        }
      }

      // Send SplitBot message to GUEST (with AI summary if available)
      if (guestCTA) {
        // Use AI summary if available, otherwise fall back to CTA template or default
        const guestMessageBody = aiGuestSummary ||
          guestCTA.message ||
          getDefaultMessage(status, "guest", templateContext);
        const guestVisibility = getVisibilityForRole("guest");

        await createSplitBotMessage(supabase, {
          threadId,
          messageBody: guestMessageBody,
          callToAction: guestCTA.display,
          visibleToHost: guestVisibility.visibleToHost,
          visibleToGuest: guestVisibility.visibleToGuest,
          recipientUserId: input.guestId,
        });
        console.log(`[proposal:create_suggested] SplitBot message sent to guest`);
      }

      // Send SplitBot message to HOST
      if (hostCTA) {
        const hostMessageBody = hostCTA.message || getDefaultMessage(status, "host", templateContext);
        const hostVisibility = getVisibilityForRole("host");

        await createSplitBotMessage(supabase, {
          threadId,
          messageBody: hostMessageBody,
          callToAction: hostCTA.display,
          visibleToHost: hostVisibility.visibleToHost,
          visibleToGuest: hostVisibility.visibleToGuest,
          recipientUserId: hostUserData.id,
        });
        console.log(`[proposal:create_suggested] SplitBot message sent to host`);
      }

      // Update thread's last message preview
      const lastMessageBody = aiGuestSummary || guestCTA?.message || hostCTA?.message || `Proposal for ${resolvedListingName}`;
      await updateThreadLastMessage(supabase, threadId, lastMessageBody);

      console.log(`[proposal:create_suggested] SplitBot messages complete`);
    } catch (msgError) {
      // Non-blocking - proposal and thread are created, messages are secondary
      console.error(`[proposal:create_suggested] SplitBot messages failed:`, msgError);
      console.warn(`[proposal:create_suggested] Proposal and thread created, but SplitBot messages failed - host may not see notification`);
    }

    // ================================================
    // GUEST NOTIFICATIONS (Email & SMS)
    // ================================================
    // Fire-and-forget: Notification failures don't block proposal creation
    // Privacy-first: Only send if user has opted-in via notification_preferences

    try {
      console.log(`[proposal:create_suggested] Checking guest notification preferences...`);

      const guestPrefs = await getNotificationPreferences(supabase, input.guestId);

      // Send celebratory email to guest if opted-in
      if (shouldSendEmail(guestPrefs, 'proposal_updates')) {
        console.log(`[proposal:create_suggested] Guest opted-in for email notifications`);

        sendProposalEmail({
          templateId: EMAIL_TEMPLATES.GUEST_PROPOSAL_SUBMITTED,
          toEmail: guestData.email,
          toName: guestFirstName,
          variables: {
            guest_name: guestFirstName,
            listing_name: resolvedListingName,
            proposal_id: proposalId,
            dashboard_link: `https://splitlease.com/guest/proposals`,
          },
        });
      } else {
        console.log(`[proposal:create_suggested] Guest not opted-in for email (skipping)`);
      }

      // Send confirmation SMS to guest if opted-in
      if (shouldSendSms(guestPrefs, 'proposal_updates')) {
        // Fetch guest phone number
        const { data: guestPhone } = await supabase
          .from('user')
          .select('phone_number')
          .eq('id', input.guestId)
          .single();

        const phoneNumber = guestPhone?.phone_number as string | undefined;

        if (phoneNumber) {
          console.log(`[proposal:create_suggested] Guest opted-in for SMS notifications`);

          sendProposalSms({
            to: phoneNumber,
            body: `🎉 Your proposal for ${resolvedListingName} has been submitted! We're reviewing it now. View details: https://splitlease.com/guest/proposals`,
          });
        } else {
          console.log(`[proposal:create_suggested] Guest has no phone number (skipping SMS)`);
        }
      } else {
        console.log(`[proposal:create_suggested] Guest not opted-in for SMS (skipping)`);
      }

      console.log(`[proposal:create_suggested] Guest notifications complete`);
    } catch (notifError) {
      // Non-blocking - notifications are secondary to proposal creation
      console.error(`[proposal:create_suggested] Guest notifications failed:`, notifError);
    }

    // ================================================
    // SLACK ACTIVATION NOTIFICATION
    // ================================================
    // Post to acquisition channel for team visibility

    try {
      sendToSlack('acquisition', {
        text: `🎯 *New Suggested Proposal Created*\n` +
          `• Guest: ${guestFirstName} (${guestData.email})\n` +
          `• Listing: ${resolvedListingName}\n` +
          `• Nights/week: ${input.nightsSelected.length}\n` +
          `• Duration: ${input.reservationSpanWeeks} weeks\n` +
          `• Total: $${input.totalPrice}\n` +
          `• Status: ${status}\n` +
          `• Proposal ID: ${proposalId}`,
      });

      console.log(`[proposal:create_suggested] Slack notification sent`);
    } catch (slackError) {
      // Non-blocking
      console.error(`[proposal:create_suggested] Slack notification failed:`, slackError);
    }
  }

  // ================================================
  // UPDATE GUEST USER
  // ================================================

  const guestUpdates: Record<string, unknown> = {
    schedule_flexibility_last_known: guestFlexibility,
    recent_days_selected_json: input.daysSelected,
    updated_at: now,
  };

  // NOTE: "Proposals List" and "Favorited Listings" columns removed from user table.
  // Junction table writes (addUserProposal, addUserListingFavorite) handle these relationships.

  // Save guest profile fields if provided (persist to user profile)
  if (input.aboutMe !== undefined && input.aboutMe.trim() !== "") {
    guestUpdates.bio_text = input.aboutMe.trim();
    console.log(`[proposal:create_suggested] Saving aboutMe to guest profile`);
  }
  if (input.needForSpace !== undefined && input.needForSpace.trim() !== "") {
    guestUpdates.stated_need_for_space_text = input.needForSpace.trim();
    console.log(`[proposal:create_suggested] Saving needForSpace to guest profile`);
  }
  if (input.specialNeeds !== undefined && input.specialNeeds.trim() !== "") {
    guestUpdates.stated_special_needs_text = input.specialNeeds.trim();
    console.log(`[proposal:create_suggested] Saving specialNeeds to guest profile`);
  }

  const { error: guestUpdateError } = await supabase
    .from("user")
    .update(guestUpdates)
    .eq("id", input.guestId);

  if (guestUpdateError) {
    console.error(`[proposal:create_suggested] Guest update failed:`, guestUpdateError);
    // Non-blocking
  } else {
    console.log(`[proposal:create_suggested] Guest user updated`);
  }

  // Write to junction tables
  await addUserProposal(supabase, input.guestId, proposalId, 'guest');
  await addUserListingFavorite(supabase, input.guestId, input.listingId);

  // ================================================
  // UPDATE HOST USER
  // ================================================

  const { error: hostUpdateError } = await supabase
    .from("user")
    .update({
      updated_at: now,
    })
    .eq("id", hostUserData.id);

  if (hostUpdateError) {
    console.error(`[proposal:create_suggested] Host update failed:`, hostUpdateError);
    // Non-blocking
  } else {
    console.log(`[proposal:create_suggested] Host user updated`);
  }

  // Write to junction table
  await addUserProposal(supabase, hostUserData.id, proposalId, 'host');

  // ================================================
  // RETURN RESPONSE
  // ================================================

  console.log(`[proposal:create_suggested] Complete`);

  return {
    proposalId: proposalId,
    threadId: threadId,
    status: status,
    listingId: input.listingId,
    guestId: input.guestId,
    hostId: hostUserData.id,
    createdAt: now,
  };
}
