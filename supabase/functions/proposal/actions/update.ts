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
    .from("proposal")
    .select("*")
    .eq("_id", input.proposal_id)
    .single();

  if (fetchError || !proposal) {
    console.error(`[proposal:update] Proposal fetch failed:`, fetchError);
    throw new ValidationError(`Proposal not found: ${input.proposal_id}`);
  }

  const proposalData = proposal as unknown as ProposalData;
  console.log(`[proposal:update] Found proposal with status: ${proposalData.Status}`);

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
    console.log('[proposal:update] Proposal Guest ID:', proposalData.Guest);
    console.log('[proposal:update] Proposal Host User ID:', proposalData["Host User"]);

    isGuest = proposalData.Guest === user!.id;
    isHost = await checkIsHost(supabase, proposalData["Host User"], user!.id);
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

  if (isTerminalStatus(proposalData.Status as ProposalStatusName)) {
    throw new ValidationError(
      `Cannot update proposal in terminal status: ${proposalData.Status}`
    );
  }

  // ================================================
  // BUILD UPDATE OBJECT
  // ================================================

  const updates: Record<string, unknown> = {};
  const updatedFields: string[] = [];
  const now = new Date().toISOString();

  // Status transition
  if (input.status !== undefined && input.status !== proposalData.Status) {
    if (!isValidStatus(input.status)) {
      throw new ValidationError(`Invalid status: ${input.status}`);
    }

    if (!isValidStatusTransition(
      proposalData.Status as ProposalStatusName,
      input.status as ProposalStatusName
    )) {
      throw new ValidationError(
        `Invalid status transition: ${proposalData.Status} → ${input.status}`
      );
    }

    updates.Status = input.status;
    updatedFields.push("status");

    // Add to history
    const historyEntry = createStatusHistoryEntry(
      input.status as ProposalStatusName,
      isHost ? "host" : isGuest ? "guest" : "admin"
    );
    // CRITICAL: Parse JSONB array - Supabase can return as stringified JSON
    const currentHistory = parseJsonArray<string>(
      (proposalData as unknown as { History: unknown }).History,
      "History"
    );
    updates.History = [...currentHistory, historyEntry];
  }

  // Pricing updates
  if (input.proposal_price !== undefined) {
    updates["proposal nightly price"] = input.proposal_price;
    updatedFields.push("proposal_price");
  }

  // Date updates
  if (input.move_in_start_range !== undefined) {
    updates["Move in range start"] = input.move_in_start_range;
    updatedFields.push("move_in_start_range");
  }
  if (input.move_in_end_range !== undefined) {
    updates["Move in range end"] = input.move_in_end_range;
    updatedFields.push("move_in_end_range");
  }

  // Day/Night selection updates
  if (input.days_selected !== undefined) {
    updates["Days Selected"] = input.days_selected;
    updatedFields.push("days_selected");
  }
  if (input.nights_selected !== undefined) {
    updates["Nights Selected (Nights list)"] = input.nights_selected;
    updates["nights per week (num)"] = input.nights_selected.length;
    updatedFields.push("nights_selected");

    // Recalculate complementary nights
    const availableNights = (proposalData as unknown as { "Days Available": number[] })["Days Available"] || [];
    updates["Complementary Nights"] = calculateComplementaryNights(
      availableNights,
      input.nights_selected
    );
  }

  // Duration updates
  if (input.reservation_span_weeks !== undefined) {
    updates["Reservation Span (Weeks)"] = input.reservation_span_weeks;
    updatedFields.push("reservation_span_weeks");
  }

  // Comment updates
  if (input.comment !== undefined) {
    updates.Comment = input.comment;
    updatedFields.push("comment");
  }

  // ================================================
  // HOST COUNTEROFFER FIELDS
  // ================================================

  if (input.host_counter_offer_nightly_price !== undefined) {
    updates["host_counter_offer_nightly_price"] = input.host_counter_offer_nightly_price;
    updatedFields.push("host_counter_offer_nightly_price");
  }

  // Set "counter offer happened" flag when status changes to counteroffer
  // This must be set regardless of which hc_ fields are provided
  if (input.status === "Host Counteroffer Submitted / Awaiting Guest Review") {
    updates["counter offer happened"] = true;
  }
  if (input.host_counter_offer_days_selected !== undefined) {
    updates["host_counter_offer_days_selected"] = input.host_counter_offer_days_selected;
    updatedFields.push("host_counter_offer_days_selected");
  }
  if (input.host_counter_offer_nights_selected !== undefined) {
    updates["host_counter_offer_nights_selected"] = input.host_counter_offer_nights_selected;
    updates["host_counter_offer_nights_per_week"] = input.host_counter_offer_nights_selected.length;
    updatedFields.push("host_counter_offer_nights_selected");
  }
  if (input.host_counter_offer_nights_per_week !== undefined) {
    updates["host_counter_offer_nights_per_week"] = input.host_counter_offer_nights_per_week;
    updatedFields.push("host_counter_offer_nights_per_week");
  }
  if (input.host_counter_offer_move_in_date !== undefined) {
    updates["host_counter_offer_move_in_date"] = input.host_counter_offer_move_in_date;
    updatedFields.push("host_counter_offer_move_in_date");
  }
  if (input.host_counter_offer_reservation_span_weeks !== undefined) {
    updates["host_counter_offer_reservation_span_weeks"] = input.host_counter_offer_reservation_span_weeks;
    updatedFields.push("host_counter_offer_reservation_span_weeks");
  }
  if (input.host_counter_offer_cleaning_fee !== undefined) {
    updates["host_counter_offer_cleaning_fee"] = input.host_counter_offer_cleaning_fee;
    updatedFields.push("host_counter_offer_cleaning_fee");
  }
  if (input.host_counter_offer_damage_deposit !== undefined) {
    updates["host_counter_offer_damage_deposit"] = input.host_counter_offer_damage_deposit;
    updatedFields.push("host_counter_offer_damage_deposit");
  }
  if (input.host_counter_offer_total_price !== undefined) {
    updates["host_counter_offer_total_price"] = input.host_counter_offer_total_price;
    updatedFields.push("host_counter_offer_total_price");
  }
  if (input.host_counter_offer_four_week_rent !== undefined) {
    updates["host_counter_offer_4_week_rent"] = input.host_counter_offer_four_week_rent;
    updatedFields.push("host_counter_offer_four_week_rent");
  }
  if (input.host_counter_offer_check_in !== undefined) {
    updates["host_counter_offer_check_in_day"] = input.host_counter_offer_check_in;
    updatedFields.push("host_counter_offer_check_in");
  }
  if (input.host_counter_offer_check_out !== undefined) {
    updates["host_counter_offer_check_out_day"] = input.host_counter_offer_check_out;
    updatedFields.push("host_counter_offer_check_out");
  }
  if (input.host_counter_offer_house_rules !== undefined) {
    updates["host_counter_offer_house_rules"] = input.host_counter_offer_house_rules;
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
        _id,
        pricing_list,
        "rental type",
        weekly_host_rate,
        monthly_host_rate,
        nightly_rate_1_night,
        nightly_rate_2_nights,
        nightly_rate_3_nights,
        nightly_rate_4_nights,
        nightly_rate_5_nights,
        nightly_rate_6_nights,
        nightly_rate_7_nights
      `
      )
      .eq("_id", proposalData.Listing)
      .single();

    if (listingError || !listing) {
      throw new ValidationError(
        `Failed to load listing for pricing: ${proposalData.Listing}`
      );
    }

    const reservationSpan =
      (proposalData["Reservation Span"] as string | undefined) || "other";
    const rentalType =
      ((listing["rental type"] || proposalData["rental type"] || "nightly")
        .toString()
        .toLowerCase() as RentalType);

    const hcNightsSelected =
      input.host_counter_offer_nights_selected ||
      (proposalData["host_counter_offer_nights_selected"] as number[] | undefined) ||
      (proposalData["Nights Selected (Nights list)"] as number[] | undefined) ||
      [];

    const hcNightsPerWeek =
      input.host_counter_offer_nights_per_week ||
      (Array.isArray(hcNightsSelected) ? hcNightsSelected.length : 0) ||
      (proposalData["host_counter_offer_nights_per_week"] as number | undefined) ||
      (proposalData["nights per week (num)"] as number | undefined) ||
      0;

    const hcReservationWeeks =
      input.host_counter_offer_reservation_span_weeks ||
      (proposalData["host_counter_offer_reservation_span_weeks"] as number | undefined) ||
      (proposalData["Reservation Span (Weeks)"] as number | undefined) ||
      0;

    let pricingListRates = null;

    if (listing.pricing_list) {
      const { data: pricingList, error: pricingListError } = await supabase
        .from("pricing_list")
        .select('"Nightly Price", "Host Compensation"')
        .eq("_id", listing.pricing_list)
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
          "Nightly Price": fallbackPricing.nightlyPrice,
          "Host Compensation": fallbackPricing.hostCompensation,
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
        ? (listing.weekly_host_rate || derivedWeeklyRate)
        : rentalType === "monthly"
          ? (listing.monthly_host_rate || derivedMonthlyRate)
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

    updates["host_counter_offer_nights_per_week"] = hcNightsPerWeek;
    updates["host_counter_offer_nightly_price"] = roundToTwoDecimals(guestNightlyPrice);
    updates["host_counter_offer_total_price"] = roundToTwoDecimals(totalGuestPrice);
    updates["host_counter_offer_4_week_rent"] = roundToTwoDecimals(fourWeekRent);
    updates["host_counter_offer_4_week_compensation"] = roundToTwoDecimals(fourWeekCompensation);
    updates["host_counter_offer_host_compensation_per_period"] = roundToTwoDecimals(hostCompPerPeriod);
    updates["host_counter_offer_total_host_compensation"] = roundToTwoDecimals(totalHostCompensation);
    updates["host_counter_offer_duration_in_months"] = roundToTwoDecimals(durationMonths);

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

  updates["Modified Date"] = now;

  console.log(`[proposal:update] Updating fields: ${updatedFields.join(", ")}`);

  const { error: updateError } = await supabase
    .from("proposal")
    .update(updates)
    .eq("_id", input.proposal_id);

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
      old_status: proposalData.Status,
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
        const hostProfile = await getUserProfile(supabase, proposalData["Host User"]);
        const hostFirstName = hostProfile?.firstName || "The host";

        // Build context for AI summary
        const originalDays = proposalData["Days Selected"] as number[] || [];
        const counterDays = input.host_counter_offer_days_selected || originalDays;

        const counterSummary = await generateCounterOfferSummary(supabase, {
          originalWeeks: proposalData["Reservation Span (Weeks)"] || 0,
          originalMoveIn: formatDateForDisplay(proposalData["Move in range start"] || ""),
          originalDays: formatDaysAsRange(originalDays),
          originalNightlyPrice: proposalData["proposal nightly price"] || 0,
          originalTotalPrice: proposalData["Total Price for Reservation (guest)"] || 0,
          counterWeeks: input.host_counter_offer_reservation_span_weeks || proposalData["Reservation Span (Weeks)"] || 0,
          counterMoveIn: formatDateForDisplay(input.host_counter_offer_move_in_date || proposalData["Move in range start"] || ""),
          counterDays: formatDaysAsRange(counterDays),
          counterNightlyPrice: input.host_counter_offer_nightly_price || proposalData["proposal nightly price"] || 0,
          counterTotalPrice: input.host_counter_offer_total_price || proposalData["Total Price for Reservation (guest)"] || 0,
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
          recipientUserId: proposalData.Guest,
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
    status: (input.status || proposalData.Status) as string,
    updated_fields: updatedFields,
    updated_at: now,
  };
}

/**
 * Check if user is the host of the proposal's listing
 * Host User now directly contains user._id - simple equality check
 */
function checkIsHost(
  _supabase: SupabaseClient,
  hostUserId: string,
  userId: string
): Promise<boolean> {
  if (!hostUserId) return false;

  // Host User column now contains user._id directly - just compare
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
    .select(`"Toggle - Is Admin"`)
    .eq("_id", userId)
    .single();

  return data?.["Toggle - Is Admin"] === true;
}
