/**
 * Create Mockup Proposal Action
 * Split Lease - Supabase Edge Functions
 *
 * Creates a demonstration proposal when a host submits their first listing.
 * This helps new hosts understand how the proposal review process works.
 *
 * Key characteristics:
 * - Uses mock guest user (splitleasefrederick@gmail.com)
 * - Calculates realistic pricing using shared calculations.ts
 * - Status set to "Host Review" for immediate visibility
 * - NON-BLOCKING: Failures do not affect listing submission
 *
 * NO FALLBACK PRINCIPLE: Errors are logged but don't block the listing flow
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  CreateMockupProposalInput,
  CreateMockupProposalResponse,
  ListingData,
  RentalType,
  ReservationSpan,
} from "../lib/types.ts";
import {
  calculateCompensation,
  calculateMoveOutDate,
  calculateComplementaryNights,
  formatPriceForDisplay,
  getNightlyRateForNights,
  fetchAvgDaysPerMonth,
} from "../lib/calculations.ts";
import {
  MOCK_GUEST_EMAIL,
  getMockupDayNightConfig,
  calculateMockupMoveInDates,
  generateMockupHistoryEntry,
  generateMockupComment,
} from "../lib/mockupHelpers.ts";
import { addUserProposal } from "../../_shared/junctionHelpers.ts";
import { parseJsonArray } from "../../_shared/jsonUtils.ts";
import { triggerProposalMessaging } from "../../_shared/queueSync.ts";

// ─────────────────────────────────────────────────────────────
// INTERNAL TYPES
// ─────────────────────────────────────────────────────────────

interface MockGuestData {
  id: string;
  email: string;
  bio_text?: string;
  stated_need_for_space_text?: string;
  stated_special_needs_text?: string;
  rental_application_form_id?: string;
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────

/**
 * Create a mockup proposal for a first-time host
 *
 * This is a NON-BLOCKING operation - failures are logged but don't
 * affect the main listing submission flow.
 */
export async function handleCreateMockup(
  payload: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<CreateMockupProposalResponse | { success: false; error: string }> {
  const input = payload as unknown as CreateMockupProposalInput;
  const { listingId, hostUserId, hostEmail } = input;

  console.log("[proposal:create_mockup] ========== START ==========");
  console.log("[proposal:create_mockup] Listing:", listingId);
  console.log("[proposal:create_mockup] Host User:", hostUserId);

  try {
    // ─────────────────────────────────────────────────────────
    // Step 1: Fetch mock guest user
    // ─────────────────────────────────────────────────────────
    console.log("[proposal:create_mockup] Step 1: Fetching mock guest...");

    const { data: mockGuest, error: guestError } = await supabase
      .from("user")
      .select(
        `
        id,
        email,
        bio_text,
        stated_need_for_space_text,
        stated_special_needs_text,
        rental_application_form_id
      `
      )
      .eq("email", MOCK_GUEST_EMAIL)
      .maybeSingle();

    if (guestError || !mockGuest) {
      console.warn(
        "[proposal:create_mockup] Mock guest not found, skipping mockup creation"
      );
      console.warn("[proposal:create_mockup] Error:", guestError?.message);
      return { success: false, error: "Mock guest not found" };
    }

    const guestData = mockGuest as MockGuestData;
    console.log("[proposal:create_mockup] Mock guest found:", guestData.id);

    // ─────────────────────────────────────────────────────────
    // Step 2: Fetch listing data
    // ─────────────────────────────────────────────────────────
    console.log("[proposal:create_mockup] Step 2: Fetching listing data...");

    const { data: listing, error: listingError } = await supabase
      .from("listing")
      .select(
        `
        id,
        listing_title,
        rental_type,
        host_user_id,
        available_days_as_day_numbers_json,
        available_nights_as_day_numbers_json,
        weekly_rate_paid_to_host,
        monthly_rate_paid_to_host,
        nightly_rate_for_2_night_stay,
        nightly_rate_for_3_night_stay,
        nightly_rate_for_4_night_stay,
        nightly_rate_for_5_night_stay,
        nightly_rate_for_7_night_stay,
        cleaning_fee_amount,
        damage_deposit_amount,
        house_rule_reference_ids_json,
        address_with_lat_lng_json,
        map_pin_offset_address_json
      `
      )
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      console.error(
        "[proposal:create_mockup] Listing not found:",
        listingError?.message
      );
      return { success: false, error: "Listing not found" };
    }

    const listingData = listing as unknown as ListingData;
    const rentalType = listingData.rental_type || "nightly";
    console.log("[proposal:create_mockup] Rental type:", rentalType);

    // ─────────────────────────────────────────────────────────
    // Step 2.5: Get host user ID from listing
    // ─────────────────────────────────────────────────────────
    console.log("[proposal:create_mockup] Step 2.5: Getting host user ID...");

    // host_user_id column contains user.id directly
    const resolvedHostUserId = listingData.host_user_id || hostUserId;
    console.log("[proposal:create_mockup] Host User ID:", resolvedHostUserId);

    // ─────────────────────────────────────────────────────────
    // Step 3: Calculate day/night configuration using shared helper
    // ─────────────────────────────────────────────────────────
    console.log(
      "[proposal:create_mockup] Step 3: Calculating day/night config..."
    );

    const dayNightConfig = getMockupDayNightConfig(rentalType, listingData);
    const {
      daysSelected,
      nightsSelected,
      checkIn,
      checkOut,
      nightsPerWeek,
      reservationSpanWeeks,
      reservationSpan,
    } = dayNightConfig;

    console.log("[proposal:create_mockup] Days selected:", daysSelected);
    console.log("[proposal:create_mockup] Nights selected:", nightsSelected);
    console.log(
      "[proposal:create_mockup] Reservation weeks:",
      reservationSpanWeeks
    );

    // ─────────────────────────────────────────────────────────
    // Step 4: Calculate dates
    // ─────────────────────────────────────────────────────────
    console.log("[proposal:create_mockup] Step 4: Calculating dates...");

    const { moveInStart, moveInEnd } = calculateMockupMoveInDates(checkIn);
    const moveOutDate = calculateMoveOutDate(
      moveInStart,
      reservationSpanWeeks,
      nightsPerWeek
    );

    console.log(
      "[proposal:create_mockup] Move-in start:",
      moveInStart.toISOString()
    );
    console.log(
      "[proposal:create_mockup] Move-in end:",
      moveInEnd.toISOString()
    );
    console.log("[proposal:create_mockup] Move-out:", moveOutDate.toISOString());

    // ─────────────────────────────────────────────────────────
    // Step 5: Calculate pricing using SHARED calculations
    // ─────────────────────────────────────────────────────────
    console.log("[proposal:create_mockup] Step 5: Calculating pricing...");

    const rentalTypeLower = (rentalType || "nightly").toLowerCase() as RentalType;
    const hostNightlyRate = getNightlyRateForNights(listingData, nightsPerWeek);
    const needsAvgDaysPerMonth =
      rentalTypeLower === "monthly" || reservationSpan === "other";
    const avgDaysPerMonth = needsAvgDaysPerMonth
      ? await fetchAvgDaysPerMonth(supabase)
      : 30.4375;

    const compensation = calculateCompensation(
      rentalTypeLower,
      reservationSpan as ReservationSpan,
      nightsPerWeek,
      listingData.weekly_rate_paid_to_host || 0,
      hostNightlyRate,
      reservationSpanWeeks,
      listingData.monthly_rate_paid_to_host || 0,
      avgDaysPerMonth
    );

    console.log("[proposal:create_mockup] Pricing calculated:", {
      hostCompensationPerPeriod: compensation.host_compensation_per_night,
      totalHostCompensation: compensation.total_compensation,
      fourWeekRent: compensation.four_week_rent,
      fourWeekCompensation: compensation.four_week_compensation,
    });

    // ─────────────────────────────────────────────────────────
    // Step 6: Generate proposal ID
    // ─────────────────────────────────────────────────────────
    console.log("[proposal:create_mockup] Step 6: Generating proposal ID...");

    const { data: proposalId, error: idError } = await supabase.rpc(
      "generate_unique_id"
    );
    if (idError || !proposalId) {
      console.error("[proposal:create_mockup] ID generation failed:", idError);
      return { success: false, error: "Failed to generate proposal ID" };
    }
    console.log("[proposal:create_mockup] Generated proposal ID:", proposalId);

    // ─────────────────────────────────────────────────────────
    // Step 7: Build proposal data
    // ─────────────────────────────────────────────────────────
    console.log("[proposal:create_mockup] Step 7: Building proposal data...");

    const now = new Date().toISOString();
    const historyEntry = generateMockupHistoryEntry();

    // Calculate complementary nights
    const availableNights = parseJsonArray<number>(
      listingData.available_nights_as_day_numbers_json,
      "Nights Available"
    );
    const complementaryNights = calculateComplementaryNights(
      availableNights,
      nightsSelected
    );

    // Get available days for proposal
    const availableDays = parseJsonArray<number>(
      listingData.available_days_as_day_numbers_json,
      "Days Available"
    );

    const proposalData: Record<string, unknown> = {
      id: proposalId,

      // Core relationships
      listing_id: listingId,
      guest_user_id: guestData.id,
      host_user_id: resolvedHostUserId,
      created_by_user_id: guestData.id,

      // Guest info (from mock guest)
      guest_email_address: guestData.email,
      guest_schedule_flexibility_text: "Flexible",
      preferred_roommate_gender: "any",
      guest_stated_need_for_space:
        guestData.stated_need_for_space_text ||
        "Looking for a comfortable place to stay",
      about_yourself: guestData.bio_text || "Split Lease Demo Guest",
      guest_introduction_message: generateMockupComment(undefined),

      // Dates
      move_in_range_start_date: moveInStart.toISOString(),
      move_in_range_end_date: moveInEnd.toISOString(),
      planned_move_out_date: moveOutDate.toISOString(),
      // NOTE: "move-in range (text)" column doesn't exist on booking_proposal — removed

      // Duration
      reservation_span_text: reservationSpan,
      reservation_span_in_weeks: reservationSpanWeeks,
      actual_weeks_in_reservation_span: reservationSpanWeeks,
      stay_duration_in_months: compensation.duration_months,

      // Day/Night selection (0-indexed JS format)
      guest_selected_days_numbers_json: daysSelected,
      guest_selected_nights_numbers_json: nightsSelected,
      nights_per_week_count: nightsPerWeek,
      checkin_day_of_week_number: checkIn,
      checkout_day_of_week_number: checkOut,
      available_days_of_week_numbers_json: availableDays.length > 0 ? availableDays : daysSelected,
      complimentary_free_nights_numbers_json: complementaryNights,

      // Pricing - Uses shared calculateCompensation() results
      // host_compensation_per_night is the HOST'S per-period rate (monthly rate for monthly, etc.)
      calculated_nightly_price: hostNightlyRate,
      four_week_rent_amount: compensation.four_week_rent,
      total_reservation_price_for_guest: compensation.total_compensation,
      total_compensation_for_host: compensation.total_compensation,
      host_compensation_per_period: compensation.host_compensation_per_night,
      four_week_host_compensation: compensation.four_week_compensation,
      cleaning_fee_amount:
        listingData.cleaning_fee_amount || 0,
      damage_deposit_amount: listingData.damage_deposit_amount || 0,
      nightly_price_for_map_display_text: formatPriceForDisplay(hostNightlyRate),

      // From listing
      rental_type: rentalType,
      house_rules_reference_ids_json: listingData.house_rule_reference_ids_json,
      listing_address_with_coordinates_json: listingData.address_with_lat_lng_json,
      listing_map_pin_offset_address_json:
        listingData.map_pin_offset_address_json,

      // Status & metadata
      proposal_workflow_status: "Host Review",
      display_sort_order: 1,
      proposal_event_log_json: [historyEntry],
      is_finalized: false,
      is_deleted: false,

      // Related records
      rental_application_id: guestData.rental_application_form_id,
      is_rental_application_requested: false,
      host_email_address: hostEmail,

      // Timestamps
      created_at: now,
      updated_at: now,
      original_created_at: now,
      original_updated_at: now,
    };

    // ─────────────────────────────────────────────────────────
    // Step 8: Insert proposal into Supabase
    // ─────────────────────────────────────────────────────────
    console.log("[proposal:create_mockup] Step 8: Inserting proposal...");

    const { error: insertError } = await supabase
      .from("booking_proposal")
      .insert(proposalData);

    if (insertError) {
      console.error("[proposal:create_mockup] Insert failed:", insertError);
      return { success: false, error: `Failed to insert proposal: ${insertError.message}` };
    }
    console.log("[proposal:create_mockup] Proposal inserted successfully");

    // ─────────────────────────────────────────────────────────
    // Step 9: Update host user's Proposals List
    // ─────────────────────────────────────────────────────────
    console.log(
      "[proposal:create_mockup] Step 9: Updating host Proposals List..."
    );

    const { data: hostUser, error: hostUserError } = await supabase
      .from("user")
      .select('id')
      .eq("id", resolvedHostUserId)
      .single();

    if (hostUserError || !hostUser) {
      console.warn(
        "[proposal:create_mockup] Host user not found for Proposals List update"
      );
    } else {
      const { error: updateError } = await supabase
        .from("user")
        .update({
          updated_at: now,
        })
        .eq("id", resolvedHostUserId);

      if (updateError) {
        console.warn(
          "[proposal:create_mockup] Failed to update host user:",
          updateError
        );
      } else {
        console.log("[proposal:create_mockup] Host user updated");
      }

      // Dual-write to junction table
      await addUserProposal(supabase, resolvedHostUserId, proposalId, "host");
    }

    // ─────────────────────────────────────────────────────────
    // Step 10: Create messaging thread for host notification
    // ─────────────────────────────────────────────────────────
    console.log(
      "[proposal:create_mockup] Step 10: Triggering proposal messaging..."
    );

    triggerProposalMessaging({
      proposalId: proposalId,
      guestId: guestData.id,
      hostId: resolvedHostUserId,
      listingId: listingId,
      proposalStatus: "Host Review",
    });

    console.log("[proposal:create_mockup] ========== SUCCESS ==========");
    console.log("[proposal:create_mockup] Mockup proposal created:", proposalId);

    return {
      proposalId: proposalId,
      threadId: null, // Thread is created async by triggerProposalMessaging
      status: "Host Review",
      createdAt: now,
    };
  } catch (error) {
    // Non-blocking - log the error but don't propagate
    console.error("[proposal:create_mockup] ========== ERROR ==========");
    console.error(
      "[proposal:create_mockup] Failed to create mockup proposal:",
      error
    );
    // Return error info instead of throwing
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
