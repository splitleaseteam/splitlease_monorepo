/**
 * Create Lease Handler
 * Split Lease - Supabase Edge Functions
 *
 * Implements the complete CORE-create-lease workflow from Bubble:
 *
 * Phase 1: Proposal Status Update
 *   - Update status to "Proposal or Counteroffer Accepted / Drafting Lease Documents"
 *   - Save HC values (when NOT a counteroffer - copy original to HC)
 *   - Calculate move-out and 4-week rent
 *
 * Phase 2: Lease Creation
 *   - Create lease record
 *   - Set participants, cancellation policy, compensation
 *   - Calculate first payment date
 *
 * Phase 3: Auxiliary Setups (permissions, magic links)
 * Phase 4: Multi-Channel Communications (email, SMS, in-app)
 * Phase 5: User Association
 * Phase 6: Payment Records (via existing Edge Functions)
 * Phase 6B: Date Generation (booked dates, check-in/out dates)
 * Phase 7: Additional Setups (stays, house manual, reminders)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SupabaseSyncError } from '../../_shared/errors.ts';
import { validateCreateLeasePayload, normalizeIsCounteroffer } from '../lib/validators.ts';
import {
  calculateMoveOutDate,
  calculateFirstPaymentDate,
  getActiveTerms,
  calculateTotalRent,
  calculateTotalCompensation,
} from '../lib/calculations.ts';
import { generateDailyAgreementNumber } from '../lib/agreementNumber.ts';
import { generateStays } from '../lib/staysGenerator.ts';
import {
  generateLeaseDates,
  normalizeFullWeekProposal,
  dayIndexToName,
  DateGenerationResult,
} from '../lib/dateGenerator.ts';
import { triggerGuestPaymentRecords, triggerHostPaymentRecords } from './paymentRecords.ts';
import { sendLeaseNotifications } from './notifications.ts';
import { generateMagicLinks } from './magicLinks.ts';
import { grantListingPermission } from './permissions.ts';
import type {
  CreateLeasePayload,
  CreateLeaseResponse,
  ProposalData,
  LeaseData,
  UserContext,
  PaymentPayload,
} from '../lib/types.ts';
import { buildDocumentPayload } from '../lib/documentPayloadBuilder.ts';

/**
 * Handle lease creation - main orchestrator
 *
 * @param payload - Request payload with proposal details
 * @param user - Authenticated user context (optional)
 * @param supabase - Supabase client
 * @returns Lease creation response
 */
export async function handleCreate(
  payload: Record<string, unknown>,
  _user: UserContext | null,
  supabase: SupabaseClient
): Promise<CreateLeaseResponse> {
  console.log('[lease:create] ========== CREATE LEASE ==========');

  // Validate input
  validateCreateLeasePayload(payload);

  const input: CreateLeasePayload = {
    proposalId: payload.proposalId as string,
    isCounteroffer: normalizeIsCounteroffer(payload.isCounteroffer),
    fourWeekRent: payload.fourWeekRent as number,
    fourWeekCompensation: payload.fourWeekCompensation as number,
  };

  console.log('[lease:create] Input:', JSON.stringify(input, null, 2));

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: PROPOSAL STATUS UPDATE
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] Phase 1: Updating proposal status...');

  // Fetch proposal (without embedded joins - no FK constraints exist)
  // SCHEMA NOTE (2026-01-28): proposal.Listing has no FK to listing table
  const { data: proposal, error: proposalError } = await supabase
    .from('proposal')
    .select('*')
    .eq('id', input.proposalId)
    .single();

  if (proposalError || !proposal) {
    throw new SupabaseSyncError(`Failed to fetch proposal: ${proposalError?.message}`);
  }

  const proposalData = proposal as ProposalData;

  // Fetch listing separately using proposal.Listing ID
  let listingData: {
    id: string;
    Name?: string;
    'House manual'?: string;
    'users with permission'?: string[];
    'Cancellation Policy'?: string;
  } | null = null;

  if (proposalData.Listing) {
    const { data: listing, error: listingError } = await supabase
      .from('listing')
      .select('id, Name, "House manual", "users with permission", "Cancellation Policy"')
      .eq('id', proposalData.Listing)
      .single();

    if (listingError) {
      console.warn('[lease:create] Could not fetch listing:', listingError.message);
    } else {
      listingData = listing;
    }
  }
  const now = new Date().toISOString();

  // Get active terms (HC if counteroffer, original if not)
  const activeTerms = getActiveTerms(proposalData, input.isCounteroffer);

  // Calculate move-out date
  const moveOutDate = calculateMoveOutDate(activeTerms.moveInDate, activeTerms.reservationWeeks);

  // Build proposal update
  const proposalUpdate: Record<string, unknown> = {
    Status: 'Proposal or Counteroffer Accepted / Drafting Lease Documents',
    'Modified Date': now,
    'Is Finalized': true,
  };

  // If NOT a counteroffer, copy original values to HC fields
  if (!input.isCounteroffer) {
    proposalUpdate['host_counter_offer_move_in_date'] = proposalData['Move in range start'];
    proposalUpdate['host_counter_offer_reservation_span_weeks'] = proposalData['Reservation Span (Weeks)'];
    proposalUpdate['host_counter_offer_nights_per_week'] = proposalData['nights per week (num)'];
    proposalUpdate['host_counter_offer_nightly_price'] = proposalData['proposal nightly price'];
    proposalUpdate['host_counter_offer_4_week_rent'] = input.fourWeekRent;
    proposalUpdate['host_counter_offer_4_week_compensation'] = input.fourWeekCompensation;
    proposalUpdate['host_counter_offer_damage_deposit'] = proposalData['damage deposit'];
    proposalUpdate['host_counter_offer_cleaning_fee'] = proposalData['cleaning fee'];
    proposalUpdate['host_counter_offer_maintenance_fee'] = proposalData['maintenance fee'];
  }

  // Update proposal
  const { error: proposalUpdateError } = await supabase
    .from('proposal')
    .update(proposalUpdate)
    .eq('id', input.proposalId);

  if (proposalUpdateError) {
    throw new SupabaseSyncError(`Failed to update proposal: ${proposalUpdateError.message}`);
  }

  console.log('[lease:create] Phase 1 complete: Proposal updated');

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: LEASE CREATION
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] Phase 2: Creating lease record...');

  // Generate lease ID
  const { data: leaseId, error: leaseIdError } = await supabase.rpc('generate_unique_id');
  if (leaseIdError || !leaseId) {
    throw new SupabaseSyncError('Failed to generate lease ID');
  }

  // Generate date-based agreement number (YYYYMMDD-XXXX)
  // Uses atomic daily counter - no race conditions
  const agreementNumber = await generateDailyAgreementNumber(supabase);
  console.log('[lease:create] Generated agreement number:', agreementNumber);

  const firstPaymentDate = calculateFirstPaymentDate(activeTerms.moveInDate);

  // Calculate totals
  const totalRent = calculateTotalRent(input.fourWeekRent, activeTerms.reservationWeeks);
  const totalCompensation = calculateTotalCompensation(
    input.fourWeekCompensation,
    activeTerms.reservationWeeks
  );

  // Build lease record
  // SCHEMA-VERIFIED COLUMNS (2026-01-28):
  // - 'Reservation Period : Start' (NOT 'Move In Date')
  // - 'Reservation Period : End' (NOT 'Move-out')
  // - 'rental type' column does NOT exist in bookings_leases
  // FK CONSTRAINTS (2026-01-28):
  // - 'Cancellation Policy' → zat_features_cancellationpolicy.id (use null if no valid FK, NOT text!)
  // - 'Listing' → listing.id
  // - 'Proposal' → proposal.id
  // - 'Created By' → user.id
  const leaseRecord: Partial<LeaseData> = {
    id: leaseId,
    'Agreement Number': agreementNumber,
    Proposal: input.proposalId,
    Guest: proposalData.Guest,
    Host: proposalData['Host User'],
    Listing: proposalData.Listing,
    Participants: [proposalData.Guest, proposalData['Host User']],
    // FK CONSTRAINT: Must be valid id from zat_features_cancellationpolicy or null
    'Cancellation Policy': listingData?.['Cancellation Policy'] || null,
    'First Payment Date': firstPaymentDate,
    'Reservation Period : Start': activeTerms.moveInDate,
    'Reservation Period : End': moveOutDate,
    'Total Compensation': totalCompensation,
    'Total Rent': totalRent,
    'Lease Status': 'Drafting',
    'Lease signed?': false,
    'were documents generated?': false,
    'Created Date': now,
    'Modified Date': now,
  };

  // Insert lease
  const { error: leaseInsertError } = await supabase
    .from('bookings_leases')
    .insert(leaseRecord);

  if (leaseInsertError) {
    throw new SupabaseSyncError(`Failed to create lease: ${leaseInsertError.message}`);
  }

  console.log('[lease:create] Phase 2 complete: Lease created:', leaseId);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: AUXILIARY SETUPS
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] Phase 3: Auxiliary setups...');

  // 3a: Grant guest permission to view listing address
  await grantListingPermission(supabase, proposalData.Listing, proposalData.Guest);

  // 3b: Generate magic links for host and guest
  const magicLinks = await generateMagicLinks(
    supabase,
    proposalData.Guest,
    proposalData['Host User'],
    leaseId
  );

  console.log('[lease:create] Phase 3 complete');

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: MULTI-CHANNEL COMMUNICATIONS
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] Phase 4: Sending notifications...');

  await sendLeaseNotifications(
    supabase,
    proposalData.Guest,
    proposalData['Host User'],
    leaseId,
    agreementNumber,
    magicLinks
  );

  console.log('[lease:create] Phase 4 complete');

  // ═══════════════════════════════════════════════════════════════
  // PHASE 5: USER ASSOCIATION
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] Phase 5: User associations...');

  // Add lease to guest's lease list
  await addLeaseToUser(supabase, proposalData.Guest, leaseId, 'guest');

  // Add lease to host's lease list
  await addLeaseToUser(supabase, proposalData['Host User'], leaseId, 'host');

  console.log('[lease:create] Phase 5 complete');

  // ═══════════════════════════════════════════════════════════════
  // PHASE 6: PAYMENT RECORDS
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] Phase 6: Creating payment records...');

  // Build payment payload from proposal data
  const paymentPayload: PaymentPayload = {
    leaseId,
    rentalType: proposalData['rental type'],
    moveInDate: activeTerms.moveInDate,
    reservationSpanWeeks: activeTerms.reservationWeeks,
    reservationSpanMonths: proposalData['host_counter_offer_duration_in_months'] || proposalData['duration in months'],
    weekPattern:
      proposalData['host_counter_offer_weeks_schedule']?.Display ||
      proposalData['week selection']?.Display ||
      'Every week',
    fourWeekRent: activeTerms.fourWeekRent,
    rentPerMonth: proposalData['host_counter_offer_host_compensation_per_period'] || proposalData['host compensation'],
    maintenanceFee: activeTerms.maintenanceFee,
    damageDeposit: activeTerms.damageDeposit,
  };

  // Call guest-payment-records Edge Function
  const guestPaymentResult = await triggerGuestPaymentRecords(paymentPayload);

  // Call host-payment-records Edge Function
  const hostPaymentResult = await triggerHostPaymentRecords(paymentPayload);

  console.log('[lease:create] Phase 6 complete');

  // ═══════════════════════════════════════════════════════════════
  // PHASE 6B: DATE GENERATION
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] Phase 6B: Generating reservation dates...');

  // Get check-in/check-out days from proposal (HC if counteroffer)
  let checkInDay: string;
  let checkOutDay: string;
  let weeksSchedule: string;

  if (input.isCounteroffer) {
    const hcCheckInDay = proposalData['host_counter_offer_check_in_day'];
    const hcCheckOutDay = proposalData['host_counter_offer_check_out_day'];
    const hcWeeksSchedule = proposalData['host_counter_offer_weeks_schedule'];

    checkInDay =
      (typeof hcCheckInDay === 'object' && (hcCheckInDay as { Display?: string })?.Display) ||
      (hcCheckInDay as string);
    checkOutDay =
      (typeof hcCheckOutDay === 'object' && (hcCheckOutDay as { Display?: string })?.Display) ||
      (hcCheckOutDay as string);
    weeksSchedule =
      (typeof hcWeeksSchedule === 'object' && hcWeeksSchedule?.Display) ||
      (hcWeeksSchedule as string) ||
      'Every week';
  } else {
    const checkInDayVal = proposalData['check in day'];
    const checkOutDayVal = proposalData['check out day'];
    const weekSelectionVal = proposalData['week selection'];

    checkInDay =
      (typeof checkInDayVal === 'object' && (checkInDayVal as { Display?: string })?.Display) ||
      (checkInDayVal as string);
    checkOutDay =
      (typeof checkOutDayVal === 'object' && (checkOutDayVal as { Display?: string })?.Display) ||
      (checkOutDayVal as string);
    weeksSchedule =
      (typeof weekSelectionVal === 'object' && weekSelectionVal?.Display) ||
      (weekSelectionVal as string) ||
      'Every week';
  }

  // Get nights selected
  const nightsSelected = input.isCounteroffer
    ? proposalData['host_counter_offer_days_selected'] || proposalData['host_counter_offer_nights_selected']
    : proposalData['Days Selected'];

  // Handle full-week normalization
  const nightsCount = Array.isArray(nightsSelected) ? nightsSelected.length : 0;
  const normalizedDays = normalizeFullWeekProposal(activeTerms.moveInDate, nightsCount);

  if (normalizedDays) {
    checkInDay = normalizedDays.checkInDay;
    checkOutDay = normalizedDays.checkOutDay;
    console.log('[lease:create] Applied full-week normalization');
  }

  // Convert day indices to day names if needed (BUG #8 fix)
  // Proposals may store check-in/check-out days as numeric strings ("0"-"6")
  // but generateLeaseDates expects day names ("Sunday"-"Saturday")
  try {
    checkInDay = dayIndexToName(checkInDay);
    checkOutDay = dayIndexToName(checkOutDay);
    console.log('[lease:create] Converted day values:', { checkInDay, checkOutDay });
  } catch (error) {
    console.error('[lease:create] Failed to convert day indices to names:', error);
    throw new Error(`Invalid check-in or check-out day values: ${checkInDay}, ${checkOutDay}`);
  }

  // Generate dates
  let dateResult: DateGenerationResult;

  try {
    dateResult = generateLeaseDates({
      checkInDay,
      checkOutDay,
      reservationSpanWeeks: activeTerms.reservationWeeks,
      moveInDate: activeTerms.moveInDate,
      weeksSchedule,
      nightsSelected: Array.isArray(nightsSelected) ? nightsSelected : undefined,
    });

    console.log('[lease:create] Generated dates:', {
      totalNights: dateResult.totalNights,
      checkInDatesCount: dateResult.checkInDates.length,
      checkOutDatesCount: dateResult.checkOutDates.length,
    });

    // Update proposal with generated dates
    // SCHEMA-VERIFIED (2026-01-28): proposal table columns
    // - 'list of dates (actual dates)' exists (NOT 'List of Booked Dates')
    // - 'Check-In Dates', 'Check-Out Dates', 'total nights' do NOT exist
    const proposalDateUpdate = {
      'list of dates (actual dates)': dateResult.allBookedDates,
      'Modified Date': now,
    };

    await supabase.from('proposal').update(proposalDateUpdate).eq('id', input.proposalId);

    // Update lease with generated dates (Step 10 from Bubble workflow)
    // SCHEMA-VERIFIED (2026-01-28): bookings_leases table columns
    // - 'List of Booked Dates' exists ✅
    // - 'Reservation Period : Start/End' have space BEFORE colon
    // - 'Check-In Dates', 'Check-Out Dates', 'total nights' do NOT exist
    // - 'total week count' exists (use this instead of total nights)
    const leaseDateUpdate = {
      'List of Booked Dates': dateResult.allBookedDates,
      'Reservation Period : Start': dateResult.firstCheckIn,
      'Reservation Period : End': dateResult.lastCheckOut,
      'total week count': dateResult.checkInDates.length,
    };

    await supabase.from('bookings_leases').update(leaseDateUpdate).eq('id', leaseId);

    // Error handling: Notify if no dates generated (Steps 11-12 from Bubble)
    if (dateResult.totalNights === 0) {
      console.error('[lease:create] WARNING: No dates generated!');

      // Trigger notification to ops team
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (supabaseUrl && supabaseServiceKey) {
          await fetch(`${supabaseUrl}/functions/v1/slack-notify`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channel: '#ops-alerts',
              text: `:warning: Lease date generation produced 0 dates!\nLease ID: ${leaseId}\nProposal ID: ${input.proposalId}\nWeeks Schedule: ${weeksSchedule}`,
            }),
          });
        }
      } catch (notifyError) {
        console.warn('[lease:create] Failed to notify ops:', notifyError);
      }
    }
  } catch (dateError) {
    console.error('[lease:create] Date generation failed:', dateError);
    // Date generation is not critical enough to fail the entire lease creation
    // Log and continue with empty dates
    dateResult = {
      checkInDates: [],
      checkOutDates: [],
      allBookedDates: [],
      totalNights: 0,
      firstCheckIn: activeTerms.moveInDate,
      lastCheckOut: moveOutDate,
    };
  }

  console.log('[lease:create] Phase 6B complete: Dates generated and stored');

  // ═══════════════════════════════════════════════════════════════
  // PHASE 7: ADDITIONAL SETUPS
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] Phase 7: Additional setups...');

  // 7a: Create list of stays (using pre-generated dates)
  const stayIds = await generateStays(
    supabase,
    leaseId,
    proposalData.Guest,
    proposalData['Host User'],
    proposalData.Listing,
    dateResult
  );

  // Update lease with stay IDs
  await supabase
    .from('bookings_leases')
    .update({ 'List of Stays': stayIds })
    .eq('id', leaseId);

  // 7b: House manual linking
  // SCHEMA-VERIFIED (2026-01-28): 'House Manual' column does NOT exist in bookings_leases
  // House manual is accessed via listing.['House manual'] when needed at runtime
  // No lease-level storage required
  if (listingData?.['House manual']) {
    console.log('[lease:create] Listing has house manual:', listingData['House manual']);
  }

  // 7c: TODO - Schedule checkout reminders (would need a scheduled task system)

  console.log('[lease:create] Phase 7 complete');

  // ═══════════════════════════════════════════════════════════════
  // PHASE 8: DOCUMENT GENERATION
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] Phase 8: Generating lease documents...');

  let documentsGenerated = false;

  try {
    // Build document payload from lease data
    const documentPayload = await buildDocumentPayload(supabase, {
      leaseId,
      agreementNumber,
      proposal: proposalData,
      activeTerms,
      moveOutDate,
      hostPaymentRecords: [],
    });

    console.log('[lease:create] Document payload built, calling lease-documents function...');

    // Call lease-documents edge function
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseServiceKey) {
      const documentResponse = await fetch(`${supabaseUrl}/functions/v1/lease-documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_all',
          payload: documentPayload,
        }),
      });

      if (documentResponse.ok) {
        const documentResult = await documentResponse.json();
        console.log('[lease:create] Document generation result:', JSON.stringify(documentResult, null, 2));

        // Check if all documents were generated successfully
        const allSuccess =
          documentResult.hostPayout?.success &&
          documentResult.supplemental?.success &&
          documentResult.periodicTenancy?.success &&
          documentResult.creditCardAuth?.success;

        if (allSuccess) {
          documentsGenerated = true;
          console.log('[lease:create] All 4 documents generated successfully');
        } else {
          console.warn('[lease:create] Some documents failed to generate');
        }
      } else {
        const errorText = await documentResponse.text();
        console.error('[lease:create] Document generation failed:', documentResponse.status, errorText);
      }
    } else {
      console.warn('[lease:create] Missing Supabase credentials for document generation');
    }
  } catch (docError) {
    console.error('[lease:create] Document generation error:', docError);
    // Document generation is not critical enough to fail the entire lease creation
  }

  // Update lease with document generation status
  if (documentsGenerated) {
    await supabase
      .from('bookings_leases')
      .update({ 'were documents generated?': true })
      .eq('id', leaseId);
  }

  console.log(`[lease:create] Phase 8 complete: Documents generated = ${documentsGenerated}`);

  // ═══════════════════════════════════════════════════════════════
  // RESPONSE
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] ========== COMPLETE ==========');

  return {
    leaseId,
    agreementNumber,
    staysCreated: stayIds.length,
    guestPaymentRecordsCreated: guestPaymentResult.recordCount,
    hostPaymentRecordsCreated: hostPaymentResult.recordCount,
    magicLinks,
    documentsGenerated,
  };
}

/**
 * Add lease to user's lease list
 *
 * SCHEMA-VERIFIED (2026-01-28): user table has single 'Leases' column (jsonb)
 * NOT separate 'Leases as Guest' / 'Leases as Host' columns
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param leaseId - Lease ID
 * @param role - User role ('guest' or 'host') - logged for debugging only
 */
async function addLeaseToUser(
  supabase: SupabaseClient,
  userId: string,
  leaseId: string,
  role: 'guest' | 'host'
): Promise<void> {
  // SCHEMA-VERIFIED: Only 'Leases' column exists (not separate guest/host columns)
  const columnName = 'Leases';

  console.log(`[lease:create] Adding lease ${leaseId} to user ${userId} (role: ${role})`);

  // Fetch current leases
  const { data: user, error: fetchError } = await supabase
    .from('user')
    .select(columnName)
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.warn(`[lease:create] Could not fetch user ${userId}:`, fetchError.message);
    return;
  }

  const currentLeases: string[] = user?.[columnName] || [];

  // Avoid duplicates
  if (currentLeases.includes(leaseId)) {
    console.log(`[lease:create] Lease ${leaseId} already in user's Leases array`);
    return;
  }

  const updatedLeases = [...currentLeases, leaseId];

  const { error: updateError } = await supabase
    .from('user')
    .update({ [columnName]: updatedLeases })
    .eq('id', userId);

  if (updateError) {
    console.warn(`[lease:create] Could not update user ${userId}:`, updateError.message);
  }
}
