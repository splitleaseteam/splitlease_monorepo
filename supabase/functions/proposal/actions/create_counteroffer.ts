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
    'hc nightly price'?: number;
    'hc nights per week'?: number;
    'hc check in day'?: number;
    'hc check out day'?: number;
    'hc move in start'?: string; // Maps to 'hc move in date' column
    // Note: 'hc move out' column does not exist in schema
  };
  isUsabilityTest?: boolean;
  // Note: hostPersona removed - 'counteroffer_by_persona' column does not exist
}

export async function handleCreateCounteroffer(
  payload: CreateCounterofferPayload,
  supabase: SupabaseClient
): Promise<{ success: boolean; message: string }> {
  console.log('[create_counteroffer] Starting with proposalId:', payload.proposalId);

  const { proposalId, counterofferData, isUsabilityTest: _isUsabilityTest = false, hostPersona } = payload;

  if (!proposalId) {
    throw new Error('proposalId is required');
  }

  if (!counterofferData || Object.keys(counterofferData).length === 0) {
    throw new Error('counterofferData is required');
  }

  // Fetch current proposal to preserve existing data
  const { data: proposal, error: fetchError } = await supabase
    .from('proposal')
    .select('*')
    .eq('_id', proposalId)
    .single();

  if (fetchError) {
    console.error('[create_counteroffer] Fetch error:', fetchError);
    throw new Error(`Failed to fetch proposal: ${fetchError.message}`);
  }

  // Update proposal with counteroffer data
  // SCHEMA-VERIFIED COLUMNS ONLY (2026-01-28):
  // - Status: text ✅
  // - Modified Date: timestamp ✅
  // - counter offer happened: boolean ✅ (NOT has_host_counteroffer)
  // - hc nightly price, hc nights per week, hc check in day, hc check out day: ✅
  // - hc move in date: timestamp ✅ (NOT hc move in start)
  // REMOVED non-existent: last_modified_by, has_host_counteroffer, counteroffer_by_persona, hc move out
  const updateData: Record<string, unknown> = {
    Status: 'Host Counteroffer Submitted / Awaiting Guest Review',
    'Modified Date': new Date().toISOString(),
    'counter offer happened': true
  };

  if (proposal) {
    const { data: listing, error: listingError } = await supabase
      .from("listing")
      .select(
        `
        _id,
        pricing_list,
        "rental type",
        "Weeks offered",
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
      .eq("_id", proposal.Listing)
      .single();

    if (listingError || !listing) {
      console.warn('[create_counteroffer] Listing lookup failed:', listingError?.message);
    } else {
      const rentalType =
        ((listing["rental type"] || proposal["rental type"] || "nightly")
          .toString()
          .toLowerCase());
      const reservationSpan = proposal["Reservation Span"] || "other";

      const nightsPerWeek =
        counterofferData['hc nights per week'] ||
        proposal["hc nights per week"] ||
        proposal["nights per week (num)"] ||
        0;
      const reservationWeeks =
        proposal["hc reservation span (weeks)"] ||
        proposal["Reservation Span (Weeks)"] ||
        0;

      let pricingListRates = null;

      if (listing.pricing_list) {
        const { data: pricingList, error: pricingListError } = await supabase
          .from("pricing_list")
          .select('"Nightly Price", "Host Compensation"')
          .eq("_id", listing.pricing_list)
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
            "Nightly Price": fallbackPricing.nightlyPrice,
            "Host Compensation": fallbackPricing.hostCompensation,
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
            ? (listing.weekly_host_rate || derivedWeeklyRate)
            : rentalType === "monthly"
              ? (listing.monthly_host_rate || derivedMonthlyRate)
              : hostCompPerNight;

        // Get weeks offered pattern and calculate actual active weeks
        const weeksOffered = (listing as Record<string, unknown>)["Weeks offered"] as string | undefined;
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

        updateData['hc nightly price'] = roundToTwoDecimals(guestNightlyPrice);
        updateData['hc total price'] = roundToTwoDecimals(totalGuestPrice);
        updateData['hc 4 week rent'] = roundToTwoDecimals(fourWeekRent);
        updateData['hc 4 week compensation'] = roundToTwoDecimals(fourWeekCompensation);
        updateData['hc host compensation (per period)'] = roundToTwoDecimals(hostCompPerPeriod);
        updateData['hc total host compensation'] = roundToTwoDecimals(totalHostCompensation);
        updateData['hc duration in months'] = roundToTwoDecimals(durationMonths);
      }
    }
  }

  // Apply counteroffer fields (all verified to exist)
  if (counterofferData['hc nightly price'] !== undefined) {
    updateData['hc nightly price'] = counterofferData['hc nightly price'];
  }
  if (counterofferData['hc nights per week'] !== undefined) {
    updateData['hc nights per week'] = counterofferData['hc nights per week'];
  }
  if (counterofferData['hc check in day'] !== undefined) {
    updateData['hc check in day'] = counterofferData['hc check in day'];
  }
  if (counterofferData['hc check out day'] !== undefined) {
    updateData['hc check out day'] = counterofferData['hc check out day'];
  }
  if (counterofferData['hc move in start']) {
    // Map to actual column name
    updateData['hc move in date'] = counterofferData['hc move in start'];
  }

  const { error: updateError } = await supabase
    .from('proposal')
    .update(updateData)
    .eq('_id', proposalId);

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
      const originalWeeks = proposal['Reservation Span (Weeks)'] || 0;
      const originalMoveIn = formatDateForDisplay(proposal['Move in range start'] || proposal['Move In Date'] || '');
      const originalDays = formatDaysAsRange(proposal['Days Selected'] || []);
      const originalNightlyPrice = proposal['proposal nightly price'] || 0;
      const originalTotalPrice = proposal['Total Price for Reservation (guest)'] || 0;

      // Extract counteroffer values (from updateData which has the computed values)
      const counterWeeks = proposal['hc reservation span (weeks)'] || proposal['Reservation Span (Weeks)'] || 0;
      const counterMoveIn = formatDateForDisplay(
        (updateData['hc move in date'] as string) ||
        proposal['hc move in date'] ||
        proposal['Move in range start'] ||
        ''
      );
      const counterDays = formatDaysAsRange(
        proposal['hc days selected'] ||
        proposal['Days Selected'] ||
        []
      );
      const counterNightlyPrice = (updateData['hc nightly price'] as number) || proposal['hc nightly price'] || 0;
      const counterTotalPrice = (updateData['hc total price'] as number) || proposal['hc total price'] || 0;

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
              _id: summaryId,
              'Proposal associated': proposalId,
              'Created By': proposal['Host User'],
              'Created Date': summaryNow,
              'Modified Date': summaryNow,
              'To Account': proposal.Guest,
              'Summary': aiCounterOfferSummary,
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
      .from('thread')
      .select('_id')
      .eq('Proposal', proposalId)
      .limit(1)
      .maybeSingle();

    if (threadError) {
      console.error('[create_counteroffer] Thread lookup by Proposal error:', threadError);
    }

    threadId = threadByProposal?._id || null;
    console.log('[create_counteroffer] Strategy 1 (Proposal FK) result:', threadId || 'none');

    // Strategy 2: Fallback - find thread by host+guest+listing match
    if (!threadId && proposal) {
      console.log('[create_counteroffer] No thread found by Proposal FK, trying host+guest+listing match');

      const { data: threadByMatch, error: matchError } = await supabase
        .from('thread')
        .select('_id')
        .eq('host_user_id', proposal['Host User'])
        .eq('guest_user_id', proposal.Guest)
        .eq('Listing', proposal.Listing)
        .limit(1)
        .maybeSingle();

      if (matchError) {
        console.error('[create_counteroffer] Thread lookup by match error:', matchError);
      }

      threadId = threadByMatch?._id || null;
      console.log('[create_counteroffer] Strategy 2 (host+guest+listing) result:', threadId || 'none');

      // If found via Strategy 2, update the Proposal FK for future lookups
      if (threadId) {
        const { error: updateThreadError } = await supabase
          .from('thread')
          .update({
            "Proposal": proposalId,
            "Modified Date": new Date().toISOString()
          })
          .eq('_id', threadId);

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
        .select('"Name"')
        .eq('_id', proposal.Listing)
        .single();

      const listingName = listing?.['Name'] || 'Proposal Thread';

      // Generate new thread ID
      const { data: newId } = await supabase.rpc('generate_unique_id');
      threadId = newId || `${Date.now()}x${Math.floor(Math.random() * 1e17).toString().padStart(17, '0')}`;

      const now = new Date().toISOString();
      const { error: createError } = await supabase
        .from('thread')
        .insert({
          _id: threadId,
          host_user_id: proposal['Host User'],
          guest_user_id: proposal.Guest,
          "Listing": proposal.Listing,
          "Proposal": proposalId,
          "Thread Subject": listingName,
          "Created By": proposal['Host User'],
          "Created Date": now,
          "Modified Date": now,
          "Participants": [proposal['Host User'], proposal.Guest],
          "from logged out user?": false,
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
          recipientUserId: proposal.Guest
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
          recipientUserId: proposal['Host User']
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
    message: `Counteroffer created${hostPersona ? ` by ${hostPersona}` : ''}`
  };
}
