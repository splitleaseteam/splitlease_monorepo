/**
 * Create Counteroffer Action Handler
 *
 * Creates a counteroffer on a proposal from the host.
 * Used in usability simulations to simulate host counteroffers.
 *
 * @param payload - Contains proposalId and counteroffer details
 * @param supabase - Supabase client with service role
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  calculateDurationMonths,
  fetchAvgDaysPerMonth,
  getPricingListRates,
  roundToTwoDecimals,
  getWeeklySchedulePeriod,
  calculateActualActiveWeeks,
} from "../lib/calculations.ts";
import { calculatePricingList } from "../../pricing-list/utils/pricingCalculator.ts";
import { createSplitBotMessage, generatePlatformId } from "../../_shared/messagingHelpers.ts";
import {
  generateCounterOfferSummary,
  formatDaysAsRange,
  formatDateForDisplay,
} from "../../_shared/negotiationSummaryHelpers.ts";

interface CreateCounterofferPayload {
  proposalId: string;
  counterofferData: {
    host_proposed_nightly_price?: number;
    host_proposed_nights_per_week?: number;
    host_proposed_checkin_day?: number;
    host_proposed_checkout_day?: number;
    host_proposed_move_in_date?: string;
  };
  isUsabilityTest?: boolean;
}

export async function handleCreateCounteroffer(
  payload: CreateCounterofferPayload,
  supabase: SupabaseClient
): Promise<{ success: boolean; message: string }> {
  console.log('[create_counteroffer] Starting with proposalId:', payload.proposalId);

  const { proposalId, counterofferData, isUsabilityTest: _isUsabilityTest = false } = payload;

  if (!proposalId) {
    throw new Error('proposalId is required');
  }

  if (!counterofferData || Object.keys(counterofferData).length === 0) {
    throw new Error('counterofferData is required');
  }

  // Fetch current proposal to preserve existing data
  const { data: proposal, error: fetchError } = await supabase
    .from('booking_proposal')
    .select('*')
    .eq('id', proposalId)
    .single();

  if (fetchError) {
    console.error('[create_counteroffer] Fetch error:', fetchError);
    throw new Error(`Failed to fetch proposal: ${fetchError.message}`);
  }

  // Update proposal with counteroffer data
  // SCHEMA-VERIFIED COLUMNS (migrated to snake_case 2026-02-12):
  // - proposal_workflow_status: text
  // - updated_at: timestamp
  // - has_host_counter_offer: boolean
  // - host_proposed_nightly_price, host_proposed_nights_per_week, host_proposed_checkin_day, host_proposed_checkout_day
  // - host_proposed_move_in_date: timestamp
  const updateData: Record<string, unknown> = {
    proposal_workflow_status: 'Host Counteroffer Submitted / Awaiting Guest Review',
    updated_at: new Date().toISOString(),
    has_host_counter_offer: true
  };

  if (proposal) {
    const { data: listing, error: listingError } = await supabase
      .from("listing")
      .select(
        `
        id,
        pricing_configuration_id,
        rental_type,
        weeks_offered_schedule_text,
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
      .eq("id", proposal.listing_id)
      .single();

    if (listingError || !listing) {
      console.warn('[create_counteroffer] Listing lookup failed:', listingError?.message);
    } else {
      const rentalType =
        ((listing.rental_type || proposal.rental_type || "nightly")
          .toString()
          .toLowerCase());
      const reservationSpan = proposal.reservation_span_text || "other";

      const nightsPerWeek =
        counterofferData.host_proposed_nights_per_week ||
        proposal.host_proposed_nights_per_week ||
        proposal.nights_per_week_count ||
        0;
      const reservationWeeks =
        proposal.host_proposed_reservation_span_weeks ||
        proposal.reservation_span_in_weeks ||
        0;

      let pricingListRates = null;

      if (listing.pricing_configuration_id) {
        const { data: pricingList, error: pricingListError } = await supabase
          .from("pricing_list")
          .select('nightly_price, host_compensation')
          .eq("id", listing.pricing_configuration_id)
          .single();

        if (pricingListError) {
          console.warn('[create_counteroffer] Pricing list fetch failed:', pricingListError.message);
        } else if (pricingList) {
          pricingListRates = getPricingListRates(pricingList, nightsPerWeek);
        }
      }

      if (!pricingListRates) {
        const fallbackPricing = calculatePricingList({ listing });
        pricingListRates = getPricingListRates(
          {
            nightly_price: fallbackPricing.nightlyPrice,
            host_compensation: fallbackPricing.hostCompensation,
          },
          nightsPerWeek
        );
      }

      if (pricingListRates) {
        const needsAvgDaysPerMonth =
          rentalType === "monthly" || reservationSpan === "other";
        const avgDaysPerMonth = needsAvgDaysPerMonth
          ? await fetchAvgDaysPerMonth(supabase)
          : 30.4375;

        const durationMonths = calculateDurationMonths(
          reservationSpan,
          reservationWeeks,
          avgDaysPerMonth
        );

        const hostCompPerNight = pricingListRates.hostCompensationPerNight;
        const guestNightlyPrice = pricingListRates.guestNightlyPrice;

        const derivedWeeklyRate = roundToTwoDecimals(hostCompPerNight * nightsPerWeek);
        const derivedMonthlyRate = roundToTwoDecimals(
          (hostCompPerNight * nightsPerWeek * avgDaysPerMonth) / 7
        );

        const hostCompPerPeriod =
          rentalType === "weekly"
            ? (listing.weekly_rate_paid_to_host || derivedWeeklyRate)
            : rentalType === "monthly"
              ? (listing.monthly_rate_paid_to_host || derivedMonthlyRate)
              : hostCompPerNight;

        // Get weeks offered pattern and calculate actual active weeks
        const weeksOffered = listing.weeks_offered_schedule_text as string | undefined;
        const weeklySchedulePeriod = getWeeklySchedulePeriod(weeksOffered);
        const actualActiveWeeks = calculateActualActiveWeeks(reservationWeeks, weeksOffered);

        // Calculate total host compensation by rental type
        // IMPORTANT: Use actualActiveWeeks (not reservationWeeks) to account for alternating patterns
        const totalHostCompensation =
          rentalType === "weekly"
            ? hostCompPerPeriod * Math.ceil(actualActiveWeeks)
            : rentalType === "monthly"
              ? hostCompPerPeriod * durationMonths
              : hostCompPerNight * nightsPerWeek * actualActiveWeeks;

        const totalGuestPrice = guestNightlyPrice * nightsPerWeek * reservationWeeks;

        // Calculate 4-week rent (GUEST price with markup)
        // Formula: (pricePerNight * nights * 4) / weeklySchedulePeriod
        const fourWeekRent = (guestNightlyPrice * nightsPerWeek * 4) / weeklySchedulePeriod;

        // Calculate 4-week compensation (HOST price WITHOUT markup)
        // Formula: (hostRate * nights * 4) / weeklySchedulePeriod
        const fourWeekCompensation =
          rentalType === "monthly"
            ? 0
            : rentalType === "weekly"
              ? (hostCompPerPeriod * 4) / weeklySchedulePeriod
              : (hostCompPerNight * nightsPerWeek * 4) / weeklySchedulePeriod;

        updateData['host_proposed_nightly_price'] = roundToTwoDecimals(guestNightlyPrice);
        updateData['host_proposed_total_guest_price'] = roundToTwoDecimals(totalGuestPrice);
        updateData['host_proposed_four_week_rent'] = roundToTwoDecimals(fourWeekRent);
        updateData['host_proposed_four_week_compensation'] = roundToTwoDecimals(fourWeekCompensation);
        updateData['host_proposed_compensation_per_period'] = roundToTwoDecimals(hostCompPerPeriod);
        updateData['host_proposed_total_host_compensation'] = roundToTwoDecimals(totalHostCompensation);
        updateData['host_proposed_duration_months'] = roundToTwoDecimals(durationMonths);
      }
    }
  }

  // Apply counteroffer fields from payload
  if (counterofferData.host_proposed_nightly_price !== undefined) {
    updateData['host_proposed_nightly_price'] = counterofferData.host_proposed_nightly_price;
  }
  if (counterofferData.host_proposed_nights_per_week !== undefined) {
    updateData['host_proposed_nights_per_week'] = counterofferData.host_proposed_nights_per_week;
  }
  if (counterofferData.host_proposed_checkin_day !== undefined) {
    updateData['host_proposed_checkin_day'] = counterofferData.host_proposed_checkin_day;
  }
  if (counterofferData.host_proposed_checkout_day !== undefined) {
    updateData['host_proposed_checkout_day'] = counterofferData.host_proposed_checkout_day;
  }
  if (counterofferData.host_proposed_move_in_date) {
    updateData['host_proposed_move_in_date'] = counterofferData.host_proposed_move_in_date;
  }

  const { error: updateError } = await supabase
    .from('booking_proposal')
    .update(updateData)
    .eq('id', proposalId);

  if (updateError) {
    console.error('[create_counteroffer] Update error:', updateError);
    throw new Error(`Failed to create counteroffer: ${updateError.message}`);
  }

  console.log('[create_counteroffer] Counteroffer created for proposal:', proposalId);

  // Generate AI summary for the counteroffer (for guest)
  let aiCounterOfferSummary: string | null = null;

  if (proposal) {
    try {
      console.log('[create_counteroffer] Generating AI counteroffer summary...');

      // Extract original proposal values
      const originalWeeks = proposal.reservation_span_in_weeks || 0;
      const originalMoveIn = formatDateForDisplay(proposal.move_in_range_start_date || '');
      const originalDays = formatDaysAsRange(proposal.guest_selected_days_numbers_json || []);
      const originalNightlyPrice = proposal.calculated_nightly_price || 0;
      const originalTotalPrice = proposal.total_reservation_price_for_guest || 0;

      // Extract counteroffer values (from updateData which has the computed values)
      const counterWeeks = proposal.host_proposed_reservation_span_weeks || proposal.reservation_span_in_weeks || 0;
      const counterMoveIn = formatDateForDisplay(
        (updateData['host_proposed_move_in_date'] as string) ||
        proposal.host_proposed_move_in_date ||
        proposal.move_in_range_start_date ||
        ''
      );
      const counterDays = formatDaysAsRange(
        proposal.host_proposed_selected_days_json ||
        proposal.guest_selected_days_numbers_json ||
        []
      );
      const counterNightlyPrice = (updateData['host_proposed_nightly_price'] as number) || proposal.host_proposed_nightly_price || 0;
      const counterTotalPrice = (updateData['host_proposed_total_guest_price'] as number) || proposal.host_proposed_total_guest_price || 0;

      // Call AI Gateway with 8-second timeout
      const summaryPromise = generateCounterOfferSummary(supabase, {
        originalWeeks,
        originalMoveIn,
        originalDays,
        originalNightlyPrice,
        originalTotalPrice,
        counterWeeks,
        counterMoveIn,
        counterDays,
        counterNightlyPrice,
        counterTotalPrice,
      });

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => {
          console.warn('[create_counteroffer] AI summary timed out after 8s');
          resolve(null);
        }, 8000)
      );

      aiCounterOfferSummary = await Promise.race([summaryPromise, timeoutPromise]);

      if (aiCounterOfferSummary) {
        console.log('[create_counteroffer] AI summary generated:', aiCounterOfferSummary.length, 'chars');

        // Persist AI summary to negotiationsummary table
        try {
          const summaryId = await generatePlatformId(supabase);
          const summaryNow = new Date().toISOString();

          const { error: summaryInsertError } = await supabase
            .from('negotiationsummary')
            .insert({
              id: summaryId,
              proposal_associated: proposalId,
              created_by: proposal.host_user_id,
              original_created_at: summaryNow,
              original_updated_at: summaryNow,
              to_account: proposal.guest_user_id,
              summary: aiCounterOfferSummary,
            });

          if (summaryInsertError) {
            console.error('[create_counteroffer] Failed to persist AI summary:', {
              code: summaryInsertError.code,
              message: summaryInsertError.message,
              details: summaryInsertError.details,
              hint: summaryInsertError.hint,
            });
            // Non-blocking: Summary display is secondary to counteroffer creation
          } else {
            console.log('[create_counteroffer] AI summary persisted to negotiationsummary:', summaryId);
          }
        } catch (persistError) {
          console.error('[create_counteroffer] Exception persisting AI summary:', persistError);
          // Non-blocking: Continue with counteroffer flow
        }
      } else {
        console.log('[create_counteroffer] AI summary returned null');
      }
    } catch (aiError) {
      console.error('[create_counteroffer] AI summary generation failed:', aiError);
      // Non-blocking - continue with fallback message
    }
  }

  // Fallback message if AI summary not available
  const guestMessageBody = aiCounterOfferSummary ||
    "The host has submitted a counteroffer with modified terms. Please review the updated terms and either accept them or continue negotiating.";

  // Create notification messages for guest
  // Multi-strategy thread lookup to handle missing Proposal FK
  try {
    let threadId: string | null = null;

    // Strategy 1: Look up thread by Proposal FK
    const { data: threadByProposal, error: threadError } = await supabase
      .from('message_thread')
      .select('id')
      .eq('proposal_id', proposalId)
      .limit(1)
      .maybeSingle();

    if (threadError) {
      console.error('[create_counteroffer] Thread lookup by Proposal error:', threadError);
    }

    threadId = threadByProposal?.id || null;
    console.log('[create_counteroffer] Strategy 1 (Proposal FK) result:', threadId || 'none');

    // Strategy 2: Fallback - find thread by host+guest+listing match
    if (!threadId && proposal) {
      console.log('[create_counteroffer] No thread found by Proposal FK, trying host+guest+listing match');

      const { data: threadByMatch, error: matchError } = await supabase
        .from('message_thread')
        .select('id')
        .eq('host_user_id', proposal.host_user_id)
        .eq('guest_user_id', proposal.guest_user_id)
        .eq('listing_id', proposal.listing_id)
        .limit(1)
        .maybeSingle();

      if (matchError) {
        console.error('[create_counteroffer] Thread lookup by match error:', matchError);
      }

      threadId = threadByMatch?.id || null;
      console.log('[create_counteroffer] Strategy 2 (host+guest+listing) result:', threadId || 'none');

      // If found via Strategy 2, update the Proposal FK for future lookups
      if (threadId) {
        const { error: updateThreadError } = await supabase
          .from('message_thread')
          .update({
            proposal_id: proposalId,
            updated_at: new Date().toISOString()
          })
          .eq('id', threadId);

        if (updateThreadError) {
          console.error('[create_counteroffer] Failed to update thread Proposal FK:', updateThreadError);
        } else {
          console.log('[create_counteroffer] Updated thread Proposal FK:', threadId);
        }
      }
    }

    // Strategy 3: Last resort - create new thread
    if (!threadId && proposal) {
      console.warn('[create_counteroffer] No existing thread found, creating new one');

      // Get listing name for thread subject
      const { data: listing } = await supabase
        .from('listing')
        .select('listing_title')
        .eq('id', proposal.listing_id)
        .single();

      const listingName = listing?.listing_title || 'Proposal Thread';

      // Generate new thread ID
      const { data: newId } = await supabase.rpc('generate_unique_id');
      threadId = newId || `${Date.now()}x${Math.floor(Math.random() * 1e17).toString().padStart(17, '0')}`;

      const now = new Date().toISOString();
      const { error: createError } = await supabase
        .from('message_thread')
        .insert({
          id: threadId,
          host_user_id: proposal.host_user_id,
          guest_user_id: proposal.guest_user_id,
          listing_id: proposal.listing_id,
          proposal_id: proposalId,
          thread_subject_text: listingName,
          created_by_user_id: proposal.host_user_id,
          original_created_at: now,
          original_updated_at: now,
          participant_user_ids_json: [proposal.host_user_id, proposal.guest_user_id],
          is_from_logged_out_user: false,
          created_at: now,
          updated_at: now,
        });

      if (createError) {
        console.error('[create_counteroffer] Failed to create thread:', createError);
        threadId = null;
      } else {
        console.log('[create_counteroffer] Created new thread:', threadId);
      }
    }

    if (threadId && proposal) {
      // Message to guest about the counteroffer (using AI summary if available)
      try {
        await createSplitBotMessage(supabase, {
          threadId,
          messageBody: guestMessageBody,
          callToAction: 'Respond to Counter Offer',
          visibleToHost: false,
          visibleToGuest: true,
          recipientUserId: proposal.guest_user_id
        });
        console.log('[create_counteroffer] Guest message created (AI summary:', !!aiCounterOfferSummary, ')');
      } catch (guestMsgError) {
        console.error('[create_counteroffer] Failed to notify guest:', guestMsgError instanceof Error ? guestMsgError.message : guestMsgError);
      }

      // Confirmation message to host
      try {
        await createSplitBotMessage(supabase, {
          threadId,
          messageBody: "Your counteroffer has been submitted. The guest will be notified to review your terms.",
          callToAction: 'View Proposal',
          visibleToHost: true,
          visibleToGuest: false,
          recipientUserId: proposal.host_user_id
        });
        console.log('[create_counteroffer] Host message created');
      } catch (hostMsgError) {
        console.error('[create_counteroffer] Failed to notify host:', hostMsgError instanceof Error ? hostMsgError.message : hostMsgError);
      }

      console.log('[create_counteroffer] Notification messages processing complete');
    } else {
      console.warn('[create_counteroffer] All thread lookup strategies failed - messages not sent');
    }
  } catch (messageError) {
    console.error('[create_counteroffer] Failed to create messages:', messageError);
    // Non-blocking - counteroffer was still created
  }

  return {
    success: true,
    message: 'Counteroffer created'
  };
}
