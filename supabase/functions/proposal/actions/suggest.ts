/**
 * Suggest Proposal Action
 * Split Lease - Supabase Edge Functions
 *
 * Finds and creates suggestion proposals for a guest based on:
 * - Weekly match: Listings with matching available days
 * - Same address: Other listings at the same address
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError } from "../../_shared/errors.ts";
import { UserContext, CreateProposalInput as _CreateProposalInput, ListingData } from "../lib/types.ts";

// ─────────────────────────────────────────────────────────────
// INPUT TYPE
// ─────────────────────────────────────────────────────────────

interface SuggestProposalInput {
  // Reference proposal to base suggestions on
  origin_proposal_id: string;

  // Suggestion type
  suggestion_type: "weekly_match" | "same_address" | "both";

  // Optional filters
  max_suggestions?: number;
  exclude_listing_ids?: string[];
}

// ─────────────────────────────────────────────────────────────
// RESPONSE TYPE
// ─────────────────────────────────────────────────────────────

interface SuggestProposalResponse {
  origin_proposal_id: string;
  suggestion_type: string;
  suggestions_found: number;
  suggestions_created: number;
  suggestion_ids: string[];
  skipped_reasons: string[];
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────

export async function handleSuggest(
  payload: Record<string, unknown>,
  user: UserContext,
  supabase: SupabaseClient
): Promise<SuggestProposalResponse> {
  console.log(`[proposal:suggest] Starting suggestion generation`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as SuggestProposalInput;

  if (!input.origin_proposal_id || typeof input.origin_proposal_id !== "string") {
    throw new ValidationError("origin_proposal_id is required and must be a string");
  }

  if (!input.suggestion_type) {
    throw new ValidationError("suggestion_type is required (weekly_match, same_address, or both)");
  }

  const validTypes = ["weekly_match", "same_address", "both"];
  if (!validTypes.includes(input.suggestion_type)) {
    throw new ValidationError(`suggestion_type must be one of: ${validTypes.join(", ")}`);
  }

  const maxSuggestions = input.max_suggestions ?? 5;
  const excludeListingIds = input.exclude_listing_ids ?? [];

  console.log(`[proposal:suggest] Origin proposal: ${input.origin_proposal_id}`);
  console.log(`[proposal:suggest] Type: ${input.suggestion_type}, Max: ${maxSuggestions}`);

  // ================================================
  // FETCH ORIGIN PROPOSAL
  // ================================================

  const { data: originProposal, error: proposalError } = await supabase
    .from("proposal")
    .select(`
      id,
      listing_id,
      guest_user_id,
      guest_selected_days_numbers_json,
      guest_selected_nights_numbers_json,
      move_in_range_start_date,
      move_in_range_end_date,
      reservation_span_in_weeks,
      reservation_span_text,
      nights_per_week_count,
      calculated_nightly_price,
      guest_schedule_flexibility_text,
      preferred_roommate_gender,
      checkin_day_of_week_number,
      checkout_day_of_week_number
    `)
    .eq("id", input.origin_proposal_id)
    .single();

  if (proposalError || !originProposal) {
    console.error(`[proposal:suggest] Origin proposal fetch failed:`, proposalError);
    throw new ValidationError(`Origin proposal not found: ${input.origin_proposal_id}`);
  }

  // Verify user owns this proposal
  if (originProposal.guest_user_id !== user.id) {
    throw new ValidationError("You can only generate suggestions for your own proposals");
  }

  console.log(`[proposal:suggest] Origin listing: ${originProposal.listing_id}`);

  // ================================================
  // FETCH ORIGIN LISTING (for address matching)
  // ================================================

  const { data: originListing, error: listingError } = await supabase
    .from("listing")
    .select(`
      id,
      address_with_lat_lng_json,
      map_pin_offset_address_json,
      available_days_as_day_numbers_json,
      available_nights_as_day_numbers_json
    `)
    .eq("id", originProposal.listing_id)
    .single();

  if (listingError || !originListing) {
    console.error(`[proposal:suggest] Origin listing fetch failed:`, listingError);
    throw new ValidationError(`Origin listing not found: ${originProposal.listing_id}`);
  }

  // ================================================
  // FIND MATCHING LISTINGS
  // ================================================

  const matchingListings: ListingData[] = [];
  const skippedReasons: string[] = [];

  // Exclude origin listing and any specified exclusions
  const excludeIds = [originProposal.listing_id, ...excludeListingIds];

  // Get guest's selected days (already 0-indexed after migration)
  const guestDaysJS = originProposal.guest_selected_days_numbers_json || [];
  const guestNightsPerWeek = originProposal.nights_per_week_count || guestDaysJS.length;

  // Weekly Match: Find listings with overlapping available days
  if (input.suggestion_type === "weekly_match" || input.suggestion_type === "both") {
    console.log(`[proposal:suggest] Searching for weekly matches...`);

    // Fetch active listings with available days
    const { data: weeklyMatches, error: weeklyError } = await supabase
      .from("listing")
      .select(`
        id,
        host_user_id,
        rental_type,
        available_days_as_day_numbers_json,
        available_nights_as_day_numbers_json,
        address_with_lat_lng_json,
        map_pin_offset_address_json,
        house_rule_reference_ids_json,
        cleaning_fee_amount,
        damage_deposit_amount,
        weeks_offered_schedule_text,
        weekly_rate_paid_to_host,
        nightly_rate_for_2_night_stay,
        nightly_rate_for_3_night_stay,
        nightly_rate_for_4_night_stay,
        nightly_rate_for_5_night_stay,
        nightly_rate_for_7_night_stay,
        monthly_rate_paid_to_host
      `)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .not("id", "in", `(${excludeIds.join(",")})`);

    if (weeklyError) {
      console.error(`[proposal:suggest] Weekly match query failed:`, weeklyError);
      skippedReasons.push(`Weekly match query error: ${weeklyError.message}`);
    } else if (weeklyMatches) {
      for (const listing of weeklyMatches) {
        // Check if listing has overlapping available days (already 0-indexed)
        const listingDaysJS = listing.available_days_as_day_numbers_json || [];
        const overlappingDays = guestDaysJS.filter((d: number) => listingDaysJS.includes(d));

        if (overlappingDays.length >= guestNightsPerWeek) {
          matchingListings.push(listing as unknown as ListingData);
          if (matchingListings.length >= maxSuggestions) break;
        }
      }
      console.log(`[proposal:suggest] Found ${matchingListings.length} weekly matches`);
    }
  }

  // Same Address: Find other listings at the same address
  if (
    (input.suggestion_type === "same_address" || input.suggestion_type === "both") &&
    matchingListings.length < maxSuggestions
  ) {
    console.log(`[proposal:suggest] Searching for same address matches...`);

    // Extract address for matching
    const originAddress = originListing.map_pin_offset_address_json ||
      (originListing.address_with_lat_lng_json as Record<string, unknown>)?.address;

    if (originAddress) {
      const { data: addressMatches, error: addressError } = await supabase
        .from("listing")
        .select(`
          id,
          host_user_id,
          rental_type,
          available_days_as_day_numbers_json,
          available_nights_as_day_numbers_json,
          address_with_lat_lng_json,
          map_pin_offset_address_json,
          house_rule_reference_ids_json,
          cleaning_fee_amount,
          damage_deposit_amount,
          weeks_offered_schedule_text,
          weekly_rate_paid_to_host,
          nightly_rate_for_2_night_stay,
          nightly_rate_for_3_night_stay,
          nightly_rate_for_4_night_stay,
          nightly_rate_for_5_night_stay,
          nightly_rate_for_7_night_stay,
          monthly_rate_paid_to_host
        `)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .eq("map_pin_offset_address_json", originAddress)
        .not("id", "in", `(${excludeIds.join(",")})`);

      if (addressError) {
        console.error(`[proposal:suggest] Address match query failed:`, addressError);
        skippedReasons.push(`Address match query error: ${addressError.message}`);
      } else if (addressMatches) {
        const existingIds = new Set(matchingListings.map((l) => l.id));
        for (const listing of addressMatches) {
          if (!existingIds.has(listing.id)) {
            matchingListings.push(listing as unknown as ListingData);
            if (matchingListings.length >= maxSuggestions) break;
          }
        }
        console.log(`[proposal:suggest] Found ${addressMatches.length} address matches`);
      }
    } else {
      skippedReasons.push("Origin listing has no address for matching");
    }
  }

  // ================================================
  // CREATE SUGGESTION PROPOSALS
  // ================================================

  const suggestionIds: string[] = [];
  const suggestionsToCreate = matchingListings.slice(0, maxSuggestions);

  console.log(`[proposal:suggest] Creating ${suggestionsToCreate.length} suggestion proposals`);

  for (const listing of suggestionsToCreate) {
    try {
      // Create suggestion proposal with reference to origin
      const suggestionData = {
        listing_id: listing.id,
        guest_user_id: originProposal.guest_user_id,
        host_user_id: listing.host_user_id,
        proposal_workflow_status: "sl_submitted_awaiting_rental_app", // Default for suggestions
        guest_selected_days_numbers_json: originProposal.guest_selected_days_numbers_json,
        guest_selected_nights_numbers_json: originProposal.guest_selected_nights_numbers_json,
        move_in_range_start_date: originProposal.move_in_range_start_date,
        move_in_range_end_date: originProposal.move_in_range_end_date,
        reservation_span_in_weeks: originProposal.reservation_span_in_weeks,
        reservation_span_text: originProposal.reservation_span_text,
        nights_per_week_count: originProposal.nights_per_week_count,
        calculated_nightly_price: originProposal.calculated_nightly_price,
        guest_schedule_flexibility_text: originProposal.guest_schedule_flexibility_text,
        preferred_roommate_gender: originProposal.preferred_roommate_gender,
        checkin_day_of_week_number: originProposal.checkin_day_of_week_number,
        checkout_day_of_week_number: originProposal.checkout_day_of_week_number,
        cleaning_fee_amount: listing.cleaning_fee_amount || 0,
        damage_deposit_amount: listing.damage_deposit_amount || 0,
        // Mark as suggestion
        "Is Suggested": true,
        "Origin Proposal": input.origin_proposal_id,
        "Suggested Reason": input.suggestion_type,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newSuggestion, error: createError } = await supabase
        .from("proposal")
        .insert(suggestionData)
        .select("id")
        .single();

      if (createError) {
        console.error(`[proposal:suggest] Failed to create suggestion for listing ${listing.id}:`, createError);
        skippedReasons.push(`Failed to create suggestion for listing ${listing.id}: ${createError.message}`);
        continue;
      }

      if (newSuggestion) {
        suggestionIds.push(newSuggestion.id);
        console.log(`[proposal:suggest] Created suggestion ${newSuggestion.id} for listing ${listing.id}`);
      }
    } catch (error) {
      console.error(`[proposal:suggest] Error creating suggestion:`, error);
      skippedReasons.push(`Error creating suggestion: ${String(error)}`);
    }
  }

  // ================================================
  // BUILD RESPONSE
  // ================================================

  const response: SuggestProposalResponse = {
    origin_proposal_id: input.origin_proposal_id,
    suggestion_type: input.suggestion_type,
    suggestions_found: matchingListings.length,
    suggestions_created: suggestionIds.length,
    suggestion_ids: suggestionIds,
    skipped_reasons: skippedReasons,
  };

  console.log(`[proposal:suggest] Complete: ${response.suggestions_created} suggestions created`);

  return response;
}
