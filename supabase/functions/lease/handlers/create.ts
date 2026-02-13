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
    .from("booking_proposal")
    .select('*')
    .eq('id', input.proposalId)
    .single();

  if (proposalError || !proposal) {
    throw new SupabaseSyncError(`Failed to fetch proposal: ${proposalError?.message}`);
  }

  const proposalData = proposal as ProposalData;

  // Fetch listing separately using proposal.listing_id
  let listingData: {
    id: string;
    listing_title?: string;
    house_manual_id?: string;
    users_with_edit_permission_ids_json?: string[];
    cancellation_policy?: string;
  } | null = null;

  if (proposalData.listing_id) {
    const { data: listing, error: listingError } = await supabase
      .from('listing')
      .select('id, listing_title, house_manual_id, users_with_edit_permission_ids_json, cancellation_policy')
      .eq('id', proposalData.listing_id)
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
    proposal_workflow_status: 'Proposal or Counteroffer Accepted / Drafting Lease Documents',
    updated_at: now,
    is_finalized: true,
  };

  // If NOT a counteroffer, copy original values to HC fields
  if (!input.isCounteroffer) {
    proposalUpdate['host_proposed_move_in_date'] = proposalData.move_in_range_start_date;
    proposalUpdate['host_proposed_reservation_span_weeks'] = proposalData.reservation_span_in_weeks;
    proposalUpdate['host_proposed_nights_per_week'] = proposalData.nights_per_week_count;
    proposalUpdate['host_proposed_nightly_price'] = proposalData.calculated_nightly_price;
    proposalUpdate['host_proposed_four_week_rent'] = input.fourWeekRent;
    proposalUpdate['host_proposed_four_week_compensation'] = input.fourWeekCompensation;
    proposalUpdate['host_proposed_damage_deposit'] = proposalData.damage_deposit_amount;
    proposalUpdate['host_proposed_cleaning_fee'] = proposalData.cleaning_fee_amount;
    // NOTE: maintenance fee column doesn't exist on booking_proposal - removed
  }

  // Update proposal
  const { error: proposalUpdateError } = await supabase
    .from("booking_proposal")
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
  // - 'rental type' column does NOT exist in booking_lease
  // SCHEMA-VERIFIED (2026-02-13): booking_lease columns are all snake_case
  // - Proposal and Lease Status columns NOT in current schema — kept as-is pending DB migration
  const leaseRecord: Partial<LeaseData> = {
    id: leaseId,
    agreement_number: agreementNumber,
    proposal_id: input.proposalId,
    lease_status: 'Active',
    guest_user_id: proposalData.guest_user_id,
    host_user_id: proposalData.host_user_id,
    listing_id: proposalData.listing_id,
    participant_user_ids_json: [proposalData.guest_user_id, proposalData.host_user_id],
    cancellation_policy_text: listingData?.cancellation_policy || null,
    first_payment_date: firstPaymentDate,
    reservation_start_date: activeTerms.moveInDate,
    reservation_end_date: moveOutDate,
    total_host_compensation_amount: totalCompensation,
    total_guest_rent_amount: totalRent,
    is_lease_signed: false,
    were_legal_documents_generated: false,
    created_at: now,
    updated_at: now,
  };

  // Insert lease
  const { error: leaseInsertError } = await supabase
    .from('booking_lease')
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
  await grantListingPermission(supabase, proposalData.listing_id, proposalData.guest_user_id);

  // 3b: Generate magic links for host and guest
  const magicLinks = await generateMagicLinks(
    supabase,
    proposalData.guest_user_id,
    proposalData.host_user_id,
    leaseId
  );

  console.log('[lease:create] Phase 3 complete');

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: MULTI-CHANNEL COMMUNICATIONS
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] Phase 4: Sending notifications...');

  await sendLeaseNotifications(
    supabase,
    proposalData.guest_user_id,
    proposalData.host_user_id,
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
  await addLeaseToUser(supabase, proposalData.guest_user_id, leaseId, 'guest');

  // Add lease to host's lease list
  await addLeaseToUser(supabase, proposalData.host_user_id, leaseId, 'host');

  console.log('[lease:create] Phase 5 complete');

  // ═══════════════════════════════════════════════════════════════
  // PHASE 6: PAYMENT RECORDS
  // ═══════════════════════════════════════════════════════════════

  console.log('[lease:create] Phase 6: Creating payment records...');

  // Build payment payload from proposal data
  const paymentPayload: PaymentPayload = {
    leaseId,
    rentalType: proposalData.rental_type,
    moveInDate: activeTerms.moveInDate,
    reservationSpanWeeks: activeTerms.reservationWeeks,
    reservationSpanMonths: proposalData.host_proposed_duration_months || proposalData.stay_duration_in_months,
    weekPattern:
      proposalData.host_proposed_weeks_schedule ||
      proposalData.weeks_offered_schedule_text ||
      'Every week',
    fourWeekRent: activeTerms.fourWeekRent,
    rentPerMonth: proposalData.host_proposed_compensation_per_period || proposalData.host_compensation_per_period,
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
    checkInDay = proposalData['host_proposed_checkin_day'] as string;
    checkOutDay = proposalData['host_proposed_checkout_day'] as string;
    weeksSchedule = (proposalData['host_proposed_week_pattern'] as string) || 'Every week';
  } else {
    checkInDay = proposalData.checkin_day_of_week_number as string;
    checkOutDay = proposalData.checkout_day_of_week_number as string;
    weeksSchedule = (proposalData.weeks_offered_schedule_text as string) || 'Every week';
  }

  // Get nights selected
  // TODO: BANDAID — host_proposed_selected_nights_json is the legacy column name.
  // Migrate old proposals to populate host_proposed_selected_days_json, then remove the fallback.
  const nightsSelected = input.isCounteroffer
    ? proposalData['host_proposed_selected_days_json'] || proposalData['host_proposed_selected_nights_json']
    : proposalData.guest_selected_days_numbers_json;

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
      booked_dates_list_json: dateResult.allBookedDates,
      updated_at: now,
    };

    await supabase.from("booking_proposal").update(proposalDateUpdate).eq('id', input.proposalId);

    // Update lease with generated dates (Step 10 from Bubble workflow)
    // SCHEMA-VERIFIED (2026-02-13): booking_lease snake_case columns
    const leaseDateUpdate = {
      booked_dates_json: dateResult.allBookedDates,
      reservation_start_date: dateResult.firstCheckIn,
      reservation_end_date: dateResult.lastCheckOut,
      total_week_count: dateResult.checkInDates.length,
    };

    await supabase.from('booking_lease').update(leaseDateUpdate).eq('id', leaseId);

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
    proposalData.guest_user_id,
    proposalData.host_user_id,
    proposalData.listing_id,
    dateResult
  );

  // Update lease with stay IDs
  await supabase
    .from('booking_lease')
    .update({ stay_ids_json: stayIds })
    .eq('id', leaseId);

  // 7b: House manual linking
  // SCHEMA-VERIFIED (2026-01-28): 'House Manual' column does NOT exist in booking_lease
  // House manual is accessed via listing.['House manual'] when needed at runtime
  // No lease-level storage required
  if (listingData?.house_manual_id) {
    console.log('[lease:create] Listing has house manual:', listingData.house_manual_id);
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
      .from('booking_lease')
      .update({ were_legal_documents_generated: true })
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
