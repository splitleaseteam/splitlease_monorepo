/**
 * Update Proposal Action
 * Split Lease - Supabase Edge Functions
 *
 * Handles proposal updates including:
 * - Field updates (pricing, dates, days/nights)
 * - Status transitions
 * - Host counteroffers
 * - Cancellations
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ValidationError,
  SupabaseSyncError,
  AuthenticationError,
} from "../../_shared/errors.ts";
import { parseJsonArray } from "../../_shared/jsonUtils.ts";
import {
  UpdateProposalInput,
  UpdateProposalResponse,
  ProposalData,
  UserContext,
  ProposalStatusName,
  RentalType,
  ReservationSpan,
} from "../lib/types.ts";
import { validateUpdateProposalInput, hasUpdateFields } from "../lib/validators.ts";
import {
  calculateComplementaryNights,
  calculateDurationMonths,
  fetchAvgDaysPerMonth,
  getPricingListRates,
  roundToTwoDecimals,
} from "../lib/calculations.ts";
import { calculatePricingList } from "../../pricing-list/utils/pricingCalculator.ts";
import {
  isValidStatusTransition,
  isTerminalStatus,
  createStatusHistoryEntry,
  isValidStatus,
} from "../lib/status.ts";
import {
  generateCounterOfferSummary,
  formatDaysAsRange,
  formatDateForDisplay,
} from "../../_shared/negotiationSummaryHelpers.ts";
import {
  createSplitBotMessage,
  findThreadByProposal,
  getUserProfile,
} from "../../_shared/messagingHelpers.ts";

/**
 * Handle update proposal request
 *
 * @param payload - The update request payload
 * @param user - The authenticated user context (nullable for internal admin pages)
 * @param supabase - The Supabase client
 */
export async function handleUpdate(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<UpdateProposalResponse> {
  console.log(`[proposal:update] Starting update for user: ${user?.email || 'anonymous (internal admin)'}`);

  // If no user, this is an internal admin page request - skip authorization
  const isInternalRequest = !user;

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as UpdateProposalInput;
  validateUpdateProposalInput(input);

  if (!hasUpdateFields(input)) {
    throw new ValidationError("No valid fields to update");
  }

  console.log(`[proposal:update] Validated input for proposal: ${input.proposal_id}`);

  // ================================================
  // FETCH EXISTING PROPOSAL
  // ================================================

  const { data: proposal, error: fetchError } = await supabase
    .from("booking_proposal")
    .select("*")
    .eq("id", input.proposal_id)
    .single();

  if (fetchError || !proposal) {
    console.error(`[proposal:update] Proposal fetch failed:`, fetchError);
    throw new ValidationError(`Proposal not found: ${input.proposal_id}`);
  }

  const proposalData = proposal as unknown as ProposalData;
  console.log(`[proposal:update] Found proposal with status: ${proposalData.proposal_workflow_status}`);

  // ================================================
  // AUTHORIZATION CHECK
  // ================================================

  // Variables for role determination (used in status history)
  let isGuest = false;
  let isHost = false;
  let isAdmin = false;

  if (isInternalRequest) {
    // Internal admin page request - bypass authorization check
    console.log('[proposal:update] ═══════════════════════════════════');
    console.log('[proposal:update] Internal admin page request - bypassing authorization');
    console.log('[proposal:update] ═══════════════════════════════════');
    isAdmin = true; // Treat as admin for status history purposes
  } else {
    console.log('[proposal:update] ═══════════════════════════════════');
    console.log('[proposal:update] Checking authorization...');
    console.log('[proposal:update] User ID from auth:', user!.id);
    console.log('[proposal:update] Proposal Guest ID:', proposalData.guest_user_id);
    console.log('[proposal:update] Proposal Host User ID:', proposalData.host_user_id);

    isGuest = proposalData.guest_user_id === user!.id;
    isHost = await checkIsHost(supabase, proposalData.host_user_id, user!.id);
    isAdmin = await checkIsAdmin(supabase, user!.id);

    console.log('[proposal:update] Is guest?', isGuest);
    console.log('[proposal:update] Is host?', isHost);
    console.log('[proposal:update] Is admin?', isAdmin);
    console.log('[proposal:update] ═══════════════════════════════════');

    if (!isGuest && !isHost && !isAdmin) {
      console.log('[proposal:update] ❌ Authorization failed - user is neither guest nor host nor admin');
      console.error(`[proposal:update] Unauthorized: user ${user!.id} is not guest, host, or admin`);
      throw new AuthenticationError("You do not have permission to update this proposal");
    }

    console.log(`[proposal:update] ✅ Authorized as: ${isAdmin ? "admin" : isHost ? "host" : "guest"}`);
  }

  // ================================================
  // CHECK TERMINAL STATUS
  // ================================================

  if (isTerminalStatus(proposalData.proposal_workflow_status as ProposalStatusName)) {
    throw new ValidationError(
      `Cannot update proposal in terminal status: ${proposalData.proposal_workflow_status}`
    );
  }

  // ================================================
  // BUILD UPDATE OBJECT
  // ================================================

  const updates: Record<string, unknown> = {};
  const updatedFields: string[] = [];
  const now = new Date().toISOString();

  // Status transition
  if (input.status !== undefined && input.status !== proposalData.proposal_workflow_status) {
    if (!isValidStatus(input.status)) {
      throw new ValidationError(`Invalid status: ${input.status}`);
    }

    if (!isValidStatusTransition(
      proposalData.proposal_workflow_status as ProposalStatusName,
      input.status as ProposalStatusName
    )) {
      throw new ValidationError(
        `Invalid status transition: ${proposalData.proposal_workflow_status} → ${input.status}`
      );
    }

    updates.proposal_workflow_status = input.status;
    updatedFields.push("status");

    // Add to history
    const historyEntry = createStatusHistoryEntry(
      input.status as ProposalStatusName,
      isHost ? "host" : isGuest ? "guest" : "admin"
    );
    // CRITICAL: Parse JSONB array - Supabase can return as stringified JSON
    const currentHistory = parseJsonArray<string>(
      (proposalData as unknown as { proposal_event_log_json: unknown }).proposal_event_log_json,
      "proposal_event_log_json"
    );
    updates.proposal_event_log_json = [...currentHistory, historyEntry];
  }

  // Pricing updates
  if (input.proposal_price !== undefined) {
    updates.calculated_nightly_price = input.proposal_price;
    updatedFields.push("proposal_price");
  }

  // Date updates
  if (input.move_in_start_range !== undefined) {
    updates.move_in_range_start_date = input.move_in_start_range;
    updatedFields.push("move_in_start_range");
  }
  if (input.move_in_end_range !== undefined) {
    updates.move_in_range_end_date = input.move_in_end_range;
    updatedFields.push("move_in_end_range");
  }

  // Day/Night selection updates
  if (input.days_selected !== undefined) {
    updates.guest_selected_days_numbers_json = input.days_selected;
    updatedFields.push("days_selected");
  }
  if (input.nights_selected !== undefined) {
    updates.guest_selected_nights_numbers_json = input.nights_selected;
    updates.nights_per_week_count = input.nights_selected.length;
    updatedFields.push("nights_selected");

    // Recalculate complementary nights
    const availableNights = (proposalData as unknown as { available_days_of_week_numbers_json: number[] }).available_days_of_week_numbers_json || [];
    updates.complimentary_free_nights_numbers_json = calculateComplementaryNights(
      availableNights,
      input.nights_selected
    );
  }

  // Duration updates
  if (input.reservation_span_weeks !== undefined) {
    updates.reservation_span_in_weeks = input.reservation_span_weeks;
    updatedFields.push("reservation_span_weeks");
  }

  // Comment updates
  if (input.comment !== undefined) {
    updates.guest_introduction_message = input.comment;
    updatedFields.push("comment");
  }

  // ================================================
  // HOST COUNTEROFFER FIELDS
  // ================================================

  if (input.host_counter_offer_nightly_price !== undefined) {
    updates.host_proposed_nightly_price = input.host_counter_offer_nightly_price;
    updatedFields.push("host_counter_offer_nightly_price");
  }

  // Set "has_host_counter_offer" flag when status changes to counteroffer
  // This must be set regardless of which hc_ fields are provided
  if (input.status === "Host Counteroffer Submitted / Awaiting Guest Review") {
    updates.has_host_counter_offer = true;
  }
  if (input.host_counter_offer_days_selected !== undefined) {
    updates.host_proposed_selected_days_json = input.host_counter_offer_days_selected;
    updatedFields.push("host_counter_offer_days_selected");
  }
  if (input.host_counter_offer_nights_selected !== undefined) {
    updates.host_proposed_selected_nights_json = input.host_counter_offer_nights_selected;
    updates.host_proposed_nights_per_week = input.host_counter_offer_nights_selected.length;
    updatedFields.push("host_counter_offer_nights_selected");
  }
  if (input.host_counter_offer_nights_per_week !== undefined) {
    updates.host_proposed_nights_per_week = input.host_counter_offer_nights_per_week;
    updatedFields.push("host_counter_offer_nights_per_week");
  }
  if (input.host_counter_offer_move_in_date !== undefined) {
    updates.host_proposed_move_in_date = input.host_counter_offer_move_in_date;
    updatedFields.push("host_counter_offer_move_in_date");
  }
  if (input.host_counter_offer_reservation_span_weeks !== undefined) {
    updates.host_proposed_reservation_span_weeks = input.host_counter_offer_reservation_span_weeks;
    updatedFields.push("host_counter_offer_reservation_span_weeks");
  }
  if (input.host_counter_offer_cleaning_fee !== undefined) {
    updates.host_proposed_cleaning_fee = input.host_counter_offer_cleaning_fee;
    updatedFields.push("host_counter_offer_cleaning_fee");
  }
  if (input.host_counter_offer_damage_deposit !== undefined) {
    updates.host_proposed_damage_deposit = input.host_counter_offer_damage_deposit;
    updatedFields.push("host_counter_offer_damage_deposit");
  }
  if (input.host_counter_offer_total_price !== undefined) {
    updates.host_proposed_total_guest_price = input.host_counter_offer_total_price;
    updatedFields.push("host_counter_offer_total_price");
  }
  if (input.host_counter_offer_four_week_rent !== undefined) {
    updates.host_proposed_four_week_rent = input.host_counter_offer_four_week_rent;
    updatedFields.push("host_counter_offer_four_week_rent");
  }
  if (input.host_counter_offer_check_in !== undefined) {
    updates.host_proposed_checkin_day = input.host_counter_offer_check_in;
    updatedFields.push("host_counter_offer_check_in");
  }
  if (input.host_counter_offer_check_out !== undefined) {
    updates.host_proposed_checkout_day = input.host_counter_offer_check_out;
    updatedFields.push("host_counter_offer_check_out");
  }
  if (input.host_counter_offer_house_rules !== undefined) {
    updates.host_proposed_house_rules_json = input.host_counter_offer_house_rules;
    updatedFields.push("host_counter_offer_house_rules");
  }

  // ================================================
  // COUNTEROFFER PRICING RECALCULATION
  // ================================================

  const hasCounterofferInputs =
    input.host_counter_offer_nights_selected !== undefined ||
    input.host_counter_offer_nights_per_week !== undefined ||
    input.host_counter_offer_reservation_span_weeks !== undefined ||
    input.host_counter_offer_move_in_date !== undefined ||
    input.host_counter_offer_check_in !== undefined ||
    input.host_counter_offer_check_out !== undefined ||
    input.host_counter_offer_days_selected !== undefined ||
    input.host_counter_offer_house_rules !== undefined ||
    input.status === "Host Counteroffer Submitted / Awaiting Guest Review";

  if (hasCounterofferInputs) {
    const { data: listing, error: listingError } = await supabase
      .from("listing")
      .select(
        `
        id,
        pricing_configuration_id,
        rental_type,
        weekly_rate_paid_to_host,
        monthly_rate_paid_to_host,
        nightly_rate_for_1_night_stay,
        nightly_rate_for_2_night_stay,
        nightly_rate_for_3_night_stay,
        nightly_rate_for_4_night_stay,
        nightly_rate_for_5_night_stay,
        nightly_rate_for_7_night_stay
      `
      )
      .eq("id", proposalData.listing_id)
      .single();

    if (listingError || !listing) {
      throw new ValidationError(
        `Failed to load listing for pricing: ${proposalData.listing_id}`
      );
    }

    const reservationSpan =
      (proposalData.reservation_span_text as string | undefined) || "other";
    const rentalType =
      ((listing.rental_type || proposalData.rental_type || "nightly")
        .toString()
        .toLowerCase() as RentalType);

    const hcNightsSelected =
      input.host_counter_offer_nights_selected ||
      (proposalData.host_proposed_selected_nights_json as number[] | undefined) ||
      (proposalData.guest_selected_nights_numbers_json as number[] | undefined) ||
      [];

    const hcNightsPerWeek =
      input.host_counter_offer_nights_per_week ||
      (Array.isArray(hcNightsSelected) ? hcNightsSelected.length : 0) ||
      (proposalData.host_proposed_nights_per_week as number | undefined) ||
      (proposalData.nights_per_week_count as number | undefined) ||
      0;

    const hcReservationWeeks =
      input.host_counter_offer_reservation_span_weeks ||
      (proposalData.host_proposed_reservation_span_weeks as number | undefined) ||
      (proposalData.reservation_span_in_weeks as number | undefined) ||
      0;

    let pricingListRates = null;

    if (listing.pricing_configuration_id) {
      const { data: pricingList, error: pricingListError } = await supabase
        .from("pricing_list")
        .select('nightly_price, host_compensation')
        .eq("id", listing.pricing_configuration_id)
        .single();

      if (pricingListError) {
        console.warn(
          `[proposal:update] Pricing list fetch failed, falling back: ${pricingListError.message}`
        );
      } else if (pricingList) {
        pricingListRates = getPricingListRates(pricingList, hcNightsPerWeek);
      }
    }

    if (!pricingListRates) {
      const fallbackPricing = calculatePricingList({ listing });
      pricingListRates = getPricingListRates(
        {
          nightly_price: fallbackPricing.nightlyPrice,
          host_compensation: fallbackPricing.hostCompensation,
        },
        hcNightsPerWeek
      );
    }

    if (!pricingListRates) {
      throw new ValidationError(
        `Unable to determine pricing for ${hcNightsPerWeek} nights/week.`
      );
    }

    const needsAvgDaysPerMonth =
      rentalType === "monthly" || reservationSpan === "other";
    const avgDaysPerMonth = needsAvgDaysPerMonth
      ? await fetchAvgDaysPerMonth(supabase)
      : 30.4375;

    const durationMonths = calculateDurationMonths(
      reservationSpan as ReservationSpan,
      hcReservationWeeks,
      avgDaysPerMonth
    );

    const hostCompPerNight = pricingListRates.hostCompensationPerNight;
    const guestNightlyPrice = pricingListRates.guestNightlyPrice;

    const derivedWeeklyRate = roundToTwoDecimals(hostCompPerNight * hcNightsPerWeek);
    const derivedMonthlyRate = roundToTwoDecimals(
      (hostCompPerNight * hcNightsPerWeek * avgDaysPerMonth) / 7
    );

    const hostCompPerPeriod =
      rentalType === "weekly"
        ? (listing.weekly_rate_paid_to_host || derivedWeeklyRate)
        : rentalType === "monthly"
          ? (listing.monthly_rate_paid_to_host || derivedMonthlyRate)
          : hostCompPerNight;

    const totalHostCompensation =
      rentalType === "weekly"
        ? hostCompPerPeriod * Math.ceil(hcReservationWeeks)
        : rentalType === "monthly"
          ? hostCompPerPeriod * durationMonths
          : hostCompPerNight * hcNightsPerWeek * hcReservationWeeks;

    const totalGuestPrice =
      guestNightlyPrice * hcNightsPerWeek * hcReservationWeeks;

    const fourWeekRent = guestNightlyPrice * hcNightsPerWeek * 4;
    const fourWeekCompensation =
      rentalType === "monthly"
        ? 0
        : rentalType === "weekly"
          ? hostCompPerPeriod * 4
          : hostCompPerNight * hcNightsPerWeek * 4;

    updates.host_proposed_nights_per_week = hcNightsPerWeek;
    updates.host_proposed_nightly_price = roundToTwoDecimals(guestNightlyPrice);
    updates.host_proposed_total_guest_price = roundToTwoDecimals(totalGuestPrice);
    updates.host_proposed_four_week_rent = roundToTwoDecimals(fourWeekRent);
    updates.host_proposed_four_week_compensation = roundToTwoDecimals(fourWeekCompensation);
    updates.host_proposed_compensation_per_period = roundToTwoDecimals(hostCompPerPeriod);
    updates.host_proposed_total_host_compensation = roundToTwoDecimals(totalHostCompensation);
    updates.host_proposed_duration_months = roundToTwoDecimals(durationMonths);

    updatedFields.push(
      "host_counter_offer_nights_per_week",
      "host_counter_offer_nightly_price",
      "host_counter_offer_total_price",
      "host_counter_offer_four_week_rent",
      "host_counter_offer_four_week_compensation",
      "host_counter_offer_host_compensation",
      "host_counter_offer_total_host_compensation",
      "host_counter_offer_duration_in_months"
    );
  }

  // Cancellation reason
  if (input.reason_for_cancellation !== undefined) {
    updates["reason for cancellation"] = input.reason_for_cancellation;
    updatedFields.push("reason_for_cancellation");
  }

  // ================================================
  // VERIFY WE HAVE UPDATES
  // ================================================

  if (updatedFields.length === 0) {
    throw new ValidationError("No valid fields to update");
  }

  // ================================================
  // APPLY UPDATE
  // ================================================

  updates.updated_at = now;

  console.log(`[proposal:update] Updating fields: ${updatedFields.join(", ")}`);

  const { error: updateError } = await supabase
    .from("booking_proposal")
    .update(updates)
    .eq("id", input.proposal_id);

  if (updateError) {
    console.error(`[proposal:update] Update failed:`, updateError);
    throw new SupabaseSyncError(`Failed to update proposal: ${updateError.message}`);
  }

  console.log(`[proposal:update] Update successful`);

  // ================================================
  // TRIGGER STATUS-SPECIFIC WORKFLOWS
  // ================================================

  if (input.status) {
    console.log(`[proposal:update] [ASYNC] Status changed, would trigger notifications:`, {
      proposal_id: input.proposal_id,
      old_status: proposalData.proposal_workflow_status,
      new_status: input.status,
    });
  }

  // ================================================
  // COUNTEROFFER AI SUMMARY (when status becomes counteroffer)
  // ================================================
  // Send AI-generated summary to guest explaining what changed in the counteroffer

  const isCounterOfferStatus = input.status === "Host Counteroffer Submitted / Awaiting Guest Review";
  const hasCounterOfferFields = updatedFields.some(f => f.startsWith("host_counter_offer_"));

  if (isCounterOfferStatus && hasCounterOfferFields) {
    try {
      console.log(`[proposal:update] Generating AI counteroffer summary...`);

      // Find the thread for this proposal
      const threadId = await findThreadByProposal(supabase, input.proposal_id);

      if (threadId) {
        // Fetch host name for the intro message
        const hostProfile = await getUserProfile(supabase, proposalData.host_user_id);
        const hostFirstName = hostProfile?.firstName || "The host";

        // Build context for AI summary
        const originalDays = proposalData.guest_selected_days_numbers_json as number[] || [];
        const counterDays = input.host_counter_offer_days_selected || originalDays;

        const counterSummary = await generateCounterOfferSummary(supabase, {
          originalWeeks: proposalData.reservation_span_in_weeks || 0,
          originalMoveIn: formatDateForDisplay(proposalData.move_in_range_start_date || ""),
          originalDays: formatDaysAsRange(originalDays),
          originalNightlyPrice: proposalData.calculated_nightly_price || 0,
          originalTotalPrice: proposalData.total_reservation_price_for_guest || 0,
          counterWeeks: input.host_counter_offer_reservation_span_weeks || proposalData.reservation_span_in_weeks || 0,
          counterMoveIn: formatDateForDisplay(input.host_counter_offer_move_in_date || proposalData.move_in_range_start_date || ""),
          counterDays: formatDaysAsRange(counterDays),
          counterNightlyPrice: input.host_counter_offer_nightly_price || proposalData.calculated_nightly_price || 0,
          counterTotalPrice: input.host_counter_offer_total_price || proposalData.total_reservation_price_for_guest || 0,
        });

        // Build the full message with intro
        const introMessage = `${hostFirstName} has reviewed your proposal and submitted a counteroffer. Please accept, decline, or request a virtual meeting to discuss.`;

        // Combine intro with AI summary (or use intro alone if summary failed)
        const fullMessage = counterSummary
          ? `${introMessage}\n\n${counterSummary}`
          : introMessage;

        console.log(`[proposal:update] Counteroffer message ready, sending to guest...`);

        // Send SplitBot message to guest with counteroffer summary
        await createSplitBotMessage(supabase, {
          threadId,
          messageBody: fullMessage,
          callToAction: "Respond to Counter Offer",
          visibleToHost: false,
          visibleToGuest: true,
          recipientUserId: proposalData.guest_user_id,
        });

        console.log(`[proposal:update] Counteroffer message sent to guest`);
      } else {
        console.warn(`[proposal:update] No thread found for proposal, skipping counteroffer summary`);
      }
    } catch (counterError) {
      // Non-blocking - the update was successful, AI summary is secondary
      console.error(`[proposal:update] Counteroffer summary failed:`, counterError);
    }
  }

  // ================================================
  // RETURN RESPONSE
  // ================================================

  return {
    proposal_id: input.proposal_id,
    status: (input.status || proposalData.proposal_workflow_status) as string,
    updated_fields: updatedFields,
    updated_at: now,
  };
}

/**
 * Check if user is the host of the proposal's listing
 * Host User now directly contains user.id - simple equality check
 */
function checkIsHost(
  _supabase: SupabaseClient,
  hostUserId: string,
  userId: string
): Promise<boolean> {
  if (!hostUserId) return false;

  // Host User column now contains user.id directly - just compare
  return hostUserId === userId;
}

/**
 * Check if user is an admin
 */
async function checkIsAdmin(
  _supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await _supabase
    .from("user")
    .select('is_admin')
    .eq("id", userId)
    .single();

  return data?.is_admin === true;
}
