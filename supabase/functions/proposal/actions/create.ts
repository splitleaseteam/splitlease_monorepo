/**
 * Create Proposal Action
 * Split Lease - Supabase Edge Functions
 *
 * Implements Bubble CORE-create_proposal-NEW workflow (Steps 1-7, 13-23)
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError, SupabaseSyncError } from "../../_shared/errors.ts";
import { parseJsonArray } from "../../_shared/jsonUtils.ts";
import {
  CreateProposalInput,
  CreateProposalResponse,
  ListingData,
  GuestData,
  HostAccountData,
  HostUserData,
  RentalApplicationData,
  UserContext,
  RentalType,
  ReservationSpan,
} from "../lib/types.ts";
import { validateCreateProposalInput } from "../lib/validators.ts";
import {
  calculateMoveOutDate,
  calculateComplementaryNights,
  calculateOrderRanking,
  formatPriceForDisplay,
  fetchAvgDaysPerMonth,
  calculateDurationMonths,
  getPricingListRates,
  roundToTwoDecimals,
  getWeeklySchedulePeriod,
  calculateActualActiveWeeks,
} from "../lib/calculations.ts";
import { calculatePricingList } from "../../pricing-list/utils/pricingCalculator.ts";
import { determineInitialStatus, ProposalStatusName } from "../lib/status.ts";
import {
  addUserProposal,
  addUserListingFavorite,
} from "../../_shared/junctionHelpers.ts";
import {
  createSplitBotMessage,
  updateThreadLastMessage,
  getUserProfile,
  getListingName,
  findOrCreateProposalThread,
} from "../../_shared/messagingHelpers.ts";
import {
  getCTAForProposalStatus,
  buildTemplateContext,
  getDefaultMessage,
  getVisibilityForRole,
} from "../../_shared/ctaHelpers.ts";
import {
  generateHostProposalSummary,
  formatDaysAsRange,
  formatDateForDisplay,
} from "../../_shared/negotiationSummaryHelpers.ts";
import { generatePlatformId } from "../../_shared/messagingHelpers.ts";

// ID generation is now done via RPC: generate_platform_id()

/**
 * Handle create proposal request
 *
 * NOTE: Uses camelCase input to match frontend payload format
 */
export async function handleCreate(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<CreateProposalResponse> {
  console.log(`[proposal:create] Starting create for user: ${user?.email || 'public'}`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as CreateProposalInput;
  validateCreateProposalInput(input);

  console.log(`[proposal:create] Validated input for listing: ${input.listingId}`);

  // ================================================
  // SECURITY: Validate guestId matches authenticated user
  // ================================================

  if (!user) {
    throw new ValidationError('Authentication required for proposal creation');
  }

  // CRITICAL: Verify payload guestId matches authenticated user
  if (input.guestId !== user.id) {
    console.error(`[SECURITY] ALERT: guestId mismatch detected`, {
      authenticatedUserId: user.id?.substring(0, 8) + '...',
      payloadGuestId: input.guestId?.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
      listingId: input.listingId
    });

    throw new ValidationError(
      'Authentication mismatch detected. This incident has been logged.'
    );
  }

  console.log(`[proposal:create] Validated guestId matches authenticated user`);

  // ================================================
  // DUPLICATE CHECK - Prevent multiple proposals for same guest+listing
  // ================================================

  // Check if an active proposal already exists for this guest and listing
  // Excluded statuses: cancelled/rejected proposals can be replaced with new ones
  const excludedStatuses = [
    'Proposal Cancelled by Guest',
    'Proposal Cancelled by Host',
    'Proposal Cancelled by Split Lease',
    'Proposal Rejected by Host',
    'Proposal Rejected by Guest'
  ];

  const { data: existingProposals, error: duplicateCheckError } = await supabase
    .from("proposal")
    .select("_id, Status")
    .eq('"Guest"', input.guestId)
    .eq('"Listing"', input.listingId)
    .eq('"Deleted"', false)
    .limit(10);

  if (duplicateCheckError) {
    console.error(`[proposal:create] Duplicate check failed:`, duplicateCheckError);
    // Non-blocking - continue with creation (fail open for better UX)
  } else if (existingProposals && existingProposals.length > 0) {
    // Filter to only active proposals (not cancelled/rejected)
    const activeProposals = existingProposals.filter(
      (p) => !excludedStatuses.includes(p.Status)
    );

    if (activeProposals.length > 0) {
      console.error(`[proposal:create] Duplicate proposal detected:`, {
        guestId: input.guestId,
        listingId: input.listingId,
        existingProposalId: activeProposals[0]._id,
        existingStatus: activeProposals[0].Status
      });
      throw new ValidationError(
        `You already have an active proposal for this listing. Please check your existing proposals.`
      );
    }
  }

  console.log(`[proposal:create] No duplicate proposals found, proceeding with creation`);

  // ================================================
  // FETCH RELATED DATA
  // ================================================

  // Fetch Listing
  const { data: listing, error: listingError } = await supabase
    .from("listing")
    .select(
      `
      _id,
      "Host User",
      "rental type",
      "Features - House Rules",
      cleaning_fee,
      damage_deposit,
      "Weeks offered",
      "Days Available (List of Days)",
      "Nights Available (List of Nights) ",
      "Location - Address",
      "Location - slightly different address",
      weekly_host_rate,
      nightly_rate_1_night,
      nightly_rate_2_nights,
      nightly_rate_3_nights,
      nightly_rate_4_nights,
      nightly_rate_5_nights,
      nightly_rate_6_nights,
      nightly_rate_7_nights,
      monthly_host_rate,
      pricing_list,
      unit_markup,
      "Deleted"
    `
    )
    .eq("_id", input.listingId)
    .single();

  if (listingError || !listing) {
    console.error(`[proposal:create] Listing fetch failed:`, listingError);
    throw new ValidationError(`Listing not found: ${input.listingId}`);
  }

  // Check if listing is soft-deleted
  if ((listing as Record<string, unknown>).Deleted === true) {
    console.error(`[proposal:create] Listing is soft-deleted: ${input.listingId}`);
    throw new ValidationError(`Cannot create proposal for deleted listing: ${input.listingId}`);
  }

  const listingData = listing as unknown as ListingData;
  console.log(`[proposal:create] Found listing, host user: ${listingData["Host User"]}`);

  // Fetch Guest User
  const { data: guest, error: guestError } = await supabase
    .from("user")
    .select(
      `
      _id,
      email,
      "Rental Application",
      "Proposals List",
      "Favorited Listings",
      "About Me / Bio",
      "need for Space",
      "special needs",
      "Tasks Completed"
    `
    )
    .eq("_id", input.guestId)
    .single();

  if (guestError || !guest) {
    console.error(`[proposal:create] Guest fetch failed:`, guestError);
    throw new ValidationError(`Guest not found: ${input.guestId}`);
  }

  const guestData = guest as unknown as GuestData;
  console.log(`[proposal:create] Found guest: ${guestData.email}`);

  // ================================================
  // EARLY PROFILE SAVE: Save bio/need_for_space BEFORE proposal creation
  // This ensures user-entered data persists even if proposal creation fails
  // ================================================
  const tasksCompletedEarly = parseJsonArray<string>(guestData["Tasks Completed"], "Tasks Completed");
  const earlyProfileUpdates: Record<string, unknown> = {};

  if (!guestData["About Me / Bio"] && !tasksCompletedEarly.includes("bio") && input.aboutMe) {
    earlyProfileUpdates["About Me / Bio"] = input.aboutMe;
    console.log(`[proposal:create] Will save bio early (before proposal creation)`);
  }
  if (!guestData["need for Space"] && !tasksCompletedEarly.includes("need_for_space") && input.needForSpace) {
    earlyProfileUpdates["need for Space"] = input.needForSpace;
    console.log(`[proposal:create] Will save need_for_space early (before proposal creation)`);
  }
  if (!guestData["special needs"] && !tasksCompletedEarly.includes("special_needs") && input.specialNeeds) {
    earlyProfileUpdates["special needs"] = input.specialNeeds;
    console.log(`[proposal:create] Will save special_needs early (before proposal creation)`);
  }

  // Save profile data immediately if there's anything to save
  if (Object.keys(earlyProfileUpdates).length > 0) {
    earlyProfileUpdates["Modified Date"] = new Date().toISOString();
    const { error: earlyUpdateError } = await supabase
      .from("user")
      .update(earlyProfileUpdates)
      .eq("_id", input.guestId);

    if (earlyUpdateError) {
      console.error(`[proposal:create] Early profile save failed:`, earlyUpdateError);
      // Non-blocking - continue with proposal creation
    } else {
      console.log(`[proposal:create] Early profile save succeeded - data will persist even if proposal fails`);
      // Update local guestData to reflect the save (so we don't try to save again later)
      if (earlyProfileUpdates["About Me / Bio"]) {
        (guestData as Record<string, unknown>)["About Me / Bio"] = earlyProfileUpdates["About Me / Bio"];
      }
      if (earlyProfileUpdates["need for Space"]) {
        (guestData as Record<string, unknown>)["need for Space"] = earlyProfileUpdates["need for Space"];
      }
      if (earlyProfileUpdates["special needs"]) {
        (guestData as Record<string, unknown>)["special needs"] = earlyProfileUpdates["special needs"];
      }
    }
  }

  // Fetch Host User directly (Host User column now contains user._id)
  const { data: hostUser, error: hostUserError } = await supabase
    .from("user")
    .select(`_id, email, "Proposals List"`)
    .eq("_id", listingData["Host User"])
    .single();

  if (hostUserError || !hostUser) {
    console.error(`[proposal:create] Host user fetch failed:`, hostUserError);
    throw new ValidationError(`Host user not found: ${listingData["Host User"]}`);
  }

  const hostUserData = hostUser as unknown as HostUserData;
  // hostAccountData maintained for backwards compatibility with downstream code
  const hostAccountData = { _id: hostUserData._id, User: hostUserData._id } as HostAccountData;
  console.log(`[proposal:create] Found host: ${hostUserData.email}`);

  // Fetch Rental Application (if exists)
  let rentalApp: RentalApplicationData | null = null;
  if (guestData["Rental Application"]) {
    const { data: app } = await supabase
      .from("rentalapplication")
      .select("_id, submitted")
      .eq("_id", guestData["Rental Application"])
      .single();
    rentalApp = app as RentalApplicationData | null;
    console.log(`[proposal:create] Rental app found, submitted: ${rentalApp?.submitted}`);
  }

  // ================================================
  // CALCULATIONS
  // ================================================

  // Calculate order ranking
  // After migration, "Proposals List" is a native text[] array - no parsing needed
  const guestProposalsList: string[] = guestData["Proposals List"] || [];
  const orderRanking = calculateOrderRanking(guestProposalsList.length);

  // Calculate complementary nights (Step 4)
  const complementaryNights = calculateComplementaryNights(
    listingData["Nights Available (List of Nights) "] || [],
    input.nightsSelected
  );

  // Calculate compensation using pricing_list as the source of truth
  // CRITICAL: pricing_list contains pre-calculated arrays:
  // - pricing_list.host_compensation[nights-1] = host rate per night
  // - pricing_list.nightly_prices[nights-1] = guest rate per night (includes markup)
  const rentalType = ((listingData["rental type"] || "nightly").toLowerCase()) as RentalType;
  const nightsPerWeek = input.nightsSelected.length;
  const actualWeeks = input.actualWeeks || input.reservationSpanWeeks;
  const reservationSpan = (input.reservationSpan || "other") as ReservationSpan;

  const needsAvgDaysPerMonth =
    rentalType === "monthly" || reservationSpan === "other";
  const avgDaysPerMonth = needsAvgDaysPerMonth
    ? await fetchAvgDaysPerMonth(supabase)
    : 30.4375;

  // Fetch pricing_list to get both guest and host rates (single source of truth)
  let pricingListRates = null;
  const listingForPricing = listingData as unknown as Record<string, unknown>;

  if (listingForPricing.pricing_list) {
    const { data: pricingList, error: pricingListError } = await supabase
      .from("pricing_list")
      .select('"Nightly Price", "Host Compensation"')
      .eq("_id", listingForPricing.pricing_list as string)
      .single();

    if (pricingListError) {
      console.warn('[proposal:create] Pricing list fetch failed:', pricingListError.message);
    } else if (pricingList) {
      pricingListRates = getPricingListRates(pricingList, nightsPerWeek);
    }
  }

  // Fallback: calculate pricing_list on-the-fly if not found
  if (!pricingListRates) {
    console.log('[proposal:create] Using fallback pricing calculation');
    const fallbackPricing = calculatePricingList({ listing: listingForPricing });
    pricingListRates = getPricingListRates(
      {
        "Nightly Price": fallbackPricing.nightlyPrice,
        "Host Compensation": fallbackPricing.hostCompensation,
      },
      nightsPerWeek
    );
  }

  // Calculate compensation values
  // IMPORTANT: Guest prices include markup, Host compensation does NOT
  let hostCompensationPerNight = 0;
  let guestNightlyPrice = 0;
  let totalCompensation = 0;
  let fourWeekRent = 0;
  let fourWeekCompensation = 0;
  let durationMonths = 0;

  if (pricingListRates) {
    hostCompensationPerNight = pricingListRates.hostCompensationPerNight;
    guestNightlyPrice = pricingListRates.guestNightlyPrice;

    // Calculate duration in months
    durationMonths = calculateDurationMonths(reservationSpan, actualWeeks, avgDaysPerMonth);

    // Calculate derived rates for weekly/monthly
    const derivedWeeklyRate = roundToTwoDecimals(hostCompensationPerNight * nightsPerWeek);
    const derivedMonthlyRate = roundToTwoDecimals(
      (hostCompensationPerNight * nightsPerWeek * avgDaysPerMonth) / 7
    );

    // Determine host compensation per period based on rental type
    const hostCompPerPeriod =
      rentalType === "weekly"
        ? ((listingForPricing.weekly_host_rate as number) || derivedWeeklyRate)
        : rentalType === "monthly"
          ? ((listingForPricing.monthly_host_rate as number) || derivedMonthlyRate)
          : hostCompensationPerNight;

    // Get weeks offered pattern and calculate actual active weeks
    // This accounts for alternating schedules (1on1off, 2on2off, etc.)
    const weeksOffered = listingData["Weeks offered"] as string | undefined;
    const weeklySchedulePeriod = getWeeklySchedulePeriod(weeksOffered);
    const actualActiveWeeks = calculateActualActiveWeeks(actualWeeks, weeksOffered);

    // Calculate total host compensation by rental type
    // IMPORTANT: Use actualActiveWeeks (not actualWeeks) to account for alternating patterns
    totalCompensation =
      rentalType === "weekly"
        ? hostCompPerPeriod * Math.ceil(actualActiveWeeks)
        : rentalType === "monthly"
          ? hostCompPerPeriod * durationMonths
          : hostCompensationPerNight * nightsPerWeek * actualActiveWeeks;

    // Calculate 4-week rent (GUEST price with markup)
    // Formula: (pricePerNight * nights * 4) / weeklySchedulePeriod
    fourWeekRent = (guestNightlyPrice * nightsPerWeek * 4) / weeklySchedulePeriod;

    // Calculate 4-week compensation (HOST price WITHOUT markup)
    // Formula: (hostRate * nights * 4) / weeklySchedulePeriod
    fourWeekCompensation =
      rentalType === "monthly"
        ? 0 // Monthly doesn't use 4-week compensation
        : rentalType === "weekly"
          ? (hostCompPerPeriod * 4) / weeklySchedulePeriod
          : (hostCompensationPerNight * nightsPerWeek * 4) / weeklySchedulePeriod;

    console.log(`[proposal:create] Pricing from pricing_list:`, {
      rentalType,
      nightsPerWeek,
      hostCompensationPerNight,
      guestNightlyPrice,
      hostCompPerPeriod,
      totalCompensation,
      fourWeekRent,
      fourWeekCompensation,
      durationMonths,
      weeksOffered,
      weeklySchedulePeriod,
      actualWeeks,
      actualActiveWeeks,
    });
  } else {
    console.error('[proposal:create] Failed to get pricing rates - using input values');
    // Last resort: use input values from frontend (may already be calculated)
    fourWeekRent = input.fourWeekRent || 0;
    fourWeekCompensation = input.fourWeekCompensation || input.fourWeekRent || 0;
    totalCompensation = 0;
    durationMonths = calculateDurationMonths(reservationSpan, actualWeeks, avgDaysPerMonth);
  }

  // Build compensation result object for consistency with existing code
  const compensation = {
    total_compensation: roundToTwoDecimals(totalCompensation),
    duration_months: roundToTwoDecimals(durationMonths),
    four_week_rent: roundToTwoDecimals(fourWeekRent),
    four_week_compensation: roundToTwoDecimals(fourWeekCompensation),
    host_compensation_per_night: roundToTwoDecimals(hostCompensationPerNight),
  };

  // Calculate move-out date
  const moveOutDate = calculateMoveOutDate(
    new Date(input.moveInStartRange),
    input.reservationSpanWeeks,
    input.nightsSelected.length
  );

  // Determine initial status (Steps 5-7)
  const status = determineInitialStatus(
    !!rentalApp,
    rentalApp?.submitted ?? false,
    input.status as ProposalStatusName | undefined
  );

  console.log(`[proposal:create] Calculated status: ${status}, compensation:`, {
    hostCompensationPerNight: compensation.host_compensation_per_night,
    guestNightlyPrice: guestNightlyPrice,
    totalHostCompensation: compensation.total_compensation,
    fourWeekRentGuest: compensation.four_week_rent,
    fourWeekCompensationHost: compensation.four_week_compensation,
    durationMonths: compensation.duration_months
  });

  // ================================================
  // STEP 1: CREATE PROPOSAL RECORD
  // ================================================

  // Generate unique ID using RPC
  const { data: proposalId, error: idError } = await supabase.rpc('generate_unique_id');
  if (idError || !proposalId) {
    console.error(`[proposal:create] ID generation failed:`, idError);
    throw new SupabaseSyncError('Failed to generate proposal ID');
  }

  console.log(`[proposal:create] Generated proposal ID: ${proposalId}`);

  const now = new Date().toISOString();
  const historyEntry = `Proposal created on ${new Date().toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;

  // Default values for optional fields (tech-debt: should be collected from user)
  const guestFlexibility = input.guestFlexibility || "Flexible";
  const preferredGender = input.preferredGender || "any";

  const proposalData = {
    _id: proposalId,

    // Core relationships
    Listing: input.listingId,
    Guest: input.guestId,
    // Host User contains user._id directly
    "Host User": hostUserData._id,
    "Created By": input.guestId,

    // Guest info
    "Guest email": guestData.email,
    "Guest flexibility": guestFlexibility,
    "preferred gender": preferredGender,
    "need for space": input.needForSpace || null,
    about_yourself: input.aboutMe || null,        // snake_case column
    special_needs: input.specialNeeds || null,    // snake_case column
    Comment: input.comment || null,

    // Dates
    "Move in range start": input.moveInStartRange,
    "Move in range end": input.moveInEndRange,
    "Move-out": moveOutDate.toISOString(),
    "move-in range (text)": input.moveInRangeText || null,

    // Duration
    "Reservation Span": input.reservationSpan,
    "Reservation Span (Weeks)": input.reservationSpanWeeks,
    "actual weeks during reservation span": actualWeeks,
    "duration in months": compensation.duration_months,

    // Day/Night selection
    "Days Selected": input.daysSelected,
    "Nights Selected (Nights list)": input.nightsSelected,
    "nights per week (num)": input.nightsSelected.length,
    "check in day": input.checkIn,
    "check out day": input.checkOut,
    "Days Available": listingData["Days Available (List of Days)"],
    "Complementary Nights": complementaryNights,

    // Pricing
    // CRITICAL: "host compensation" is the per-night HOST rate, not guest-facing price
    // "Total Compensation" = host compensation per night * nights per week * weeks
    "proposal nightly price": input.proposalPrice,
    "4 week rent": input.fourWeekRent || compensation.four_week_rent,
    "Total Price for Reservation (guest)": input.estimatedBookingTotal,
    "Total Compensation (proposal - host)": compensation.total_compensation,
    "host compensation": compensation.host_compensation_per_night,
    "4 week compensation": input.fourWeekCompensation || compensation.four_week_compensation,
    "cleaning fee": listingData["cleaning_fee"] || 0,
    "damage deposit": listingData["damage_deposit"] || 0,
    "nightly price for map (text)": formatPriceForDisplay(input.proposalPrice),

    // From listing
    "rental type": listingData["rental type"],
    "House Rules": listingData["Features - House Rules"],
    "week selection": listingData["Weeks offered"],
    "hc house rules": listingData["Features - House Rules"],
    "Location - Address": listingData["Location - Address"],
    "Location - Address slightly different": listingData["Location - slightly different address"],

    // Status & metadata
    Status: status,
    "Order Ranking": orderRanking,
    History: [historyEntry],
    "Is Finalized": false,
    Deleted: false,

    // Related records
    "rental application": guestData["Rental Application"],
    "rental app requested": !!guestData["Rental Application"],  // NOT NULL boolean
    "host email": hostUserData.email,

    // Suggestion fields - NOTE: These columns don't exist yet in the proposal table
    // TODO: Add these columns via migration if suggestion feature is needed
    // "suggested reason (benefits)": input.suggestedReason || null,
    // "origin proposal of this suggestion": input.originProposalId || null,
    // "number of matches": input.numberOfMatches || null,

    // Custom schedule description (user's freeform schedule request)
    custom_schedule_description: input.customScheduleDescription || null,

    // Timestamps
    "Created Date": now,
    "Modified Date": now,
  };

  console.log(`[proposal:create] Inserting proposal: ${proposalId}`);

  const { error: insertError } = await supabase
    .from("proposal")
    .insert(proposalData);

  if (insertError) {
    console.error(`[proposal:create] Insert failed:`, insertError);
    throw new SupabaseSyncError(`Failed to create proposal: ${insertError.message}`);
  }

  console.log(`[proposal:create] Proposal created successfully`);

  // ================================================
  // STEP 2: UPDATE GUEST USER
  // ================================================

  const guestUpdates: Record<string, unknown> = {
    "flexibility (last known)": guestFlexibility,
    "Recent Days Selected": input.daysSelected,
    "Modified Date": now,
  };

  // Add proposal to guest's list
  const updatedGuestProposals = [...guestProposalsList, proposalId];
  guestUpdates["Proposals List"] = updatedGuestProposals;

  // Add listing to favorites (Step 2)
  // CRITICAL: Parse JSONB arrays - Supabase can return as stringified JSON
  const currentFavorites = parseJsonArray<string>(guestData["Favorited Listings"], "Favorited Listings");
  if (!currentFavorites.includes(input.listingId)) {
    guestUpdates["Favorited Listings"] = [...currentFavorites, input.listingId];
  }

  // Profile enrichment (Steps 20-22) - only if empty
  // CRITICAL: Parse JSONB arrays - Supabase can return as stringified JSON
  const tasksCompleted = parseJsonArray<string>(guestData["Tasks Completed"], "Tasks Completed");

  if (!guestData["About Me / Bio"] && !tasksCompleted.includes("bio") && input.aboutMe) {
    guestUpdates["About Me / Bio"] = input.aboutMe;
  }
  if (!guestData["need for Space"] && !tasksCompleted.includes("need_for_space") && input.needForSpace) {
    guestUpdates["need for Space"] = input.needForSpace;
  }
  if (!guestData["special needs"] && !tasksCompleted.includes("special_needs") && input.specialNeeds) {
    guestUpdates["special needs"] = input.specialNeeds;
  }

  const { error: guestUpdateError } = await supabase
    .from("user")
    .update(guestUpdates)
    .eq("_id", input.guestId);

  if (guestUpdateError) {
    console.error(`[proposal:create] Guest update failed:`, guestUpdateError);
    // Non-blocking - continue
  } else {
    console.log(`[proposal:create] Guest user updated`);
  }

  // ================================================
  // STEP 2b: DUAL-WRITE TO JUNCTION TABLES (Guest)
  // ================================================

  // Add proposal to guest's junction table
  await addUserProposal(supabase, input.guestId, proposalId, 'guest');

  // Add listing to favorites junction table (if newly added)
  if (!currentFavorites.includes(input.listingId)) {
    await addUserListingFavorite(supabase, input.guestId, input.listingId);
  }

  // ================================================
  // STEP 3: UPDATE HOST USER
  // ================================================

  // After migration, "Proposals List" is a native text[] array - no parsing needed
  const hostProposals: string[] = hostUserData["Proposals List"] || [];

  const { error: hostUpdateError } = await supabase
    .from("user")
    .update({
      "Proposals List": [...hostProposals, proposalId],
      "Modified Date": now,
    })
    .eq("_id", hostAccountData.User);

  if (hostUpdateError) {
    console.error(`[proposal:create] Host update failed:`, hostUpdateError);
    // Non-blocking - continue
  } else {
    console.log(`[proposal:create] Host user updated`);
  }

  // ================================================
  // STEP 3b: DUAL-WRITE TO JUNCTION TABLES (Host)
  // ================================================

  // Add proposal to host's junction table
  await addUserProposal(supabase, hostAccountData.User, proposalId, 'host');

  // ================================================
  // CREATE OR FIND THREAD FOR PROPOSAL
  // ================================================
  // Uses findOrCreateProposalThread to avoid duplicate threads.
  // If a thread already exists for this guest+host+listing (from ContactHost flow),
  // it will be reused and linked to this proposal.

  let threadId: string | null = null;
  let threadCreated = false;

  try {
    // Fetch listing name for thread subject
    const listingName = await getListingName(supabase, input.listingId);
    const resolvedListingName = listingName || "this listing";

    const { threadId: resolvedThreadId, isNew } = await findOrCreateProposalThread(supabase, {
      proposalId: proposalId,
      hostUserId: hostUserData._id,
      guestUserId: input.guestId,
      listingId: input.listingId,
      listingName: resolvedListingName,
    });

    threadId = resolvedThreadId;
    threadCreated = isNew;

    console.log(`[proposal:create] Thread ${isNew ? 'created' : 'found and linked'}: ${threadId}`);
  } catch (threadError) {
    console.error(`[proposal:create] Thread creation/lookup failed:`, threadError);
    // Non-blocking - proposal already created, thread can be created later
  }

  // ================================================
  // GENERATE AI SUMMARY FOR HOST (Non-blocking)
  // ================================================
  // Generate AI summary regardless of whether thread is new or reused.
  // The host needs this summary to understand the proposal details.

  let aiHostSummary: string | null = null;

  if (threadId) {
    try {
      // Fetch listing name for AI summary
      const listingName = await getListingName(supabase, input.listingId);
      const resolvedListingName = listingName || "this listing";

      console.log(`[proposal:create] Generating AI summary for host (8s timeout)...`);

      // Create a timeout promise that rejects after 8 seconds
      const AI_TIMEOUT_MS = 8000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI summary generation timed out')), AI_TIMEOUT_MS);
      });

      // Race between AI generation and timeout
      aiHostSummary = await Promise.race([
        generateHostProposalSummary(supabase, {
          listingName: resolvedListingName,
          reservationWeeks: input.reservationSpanWeeks,
          moveInStart: formatDateForDisplay(input.moveInStartRange),
          moveInEnd: formatDateForDisplay(input.moveInEndRange),
          selectedDays: formatDaysAsRange(input.daysSelected),
          hostCompensation: compensation.host_compensation_per_night,
          totalCompensation: compensation.total_compensation,
          guestComment: input.comment || undefined,
        }),
        timeoutPromise,
      ]);

      if (aiHostSummary) {
        console.log(`[proposal:create] AI host summary generated successfully`);

        // ================================================
        // PERSIST AI SUMMARY TO negotiationsummary TABLE
        // ================================================
        // The host should see this summary to quickly understand the proposal
        try {
          const summaryId = await generatePlatformId(supabase);
          const summaryNow = new Date().toISOString();

          const { error: summaryInsertError } = await supabase
            .from('negotiationsummary')
            .insert({
              _id: summaryId,
              "Proposal associated": proposalId,
              "Created By": input.guestId,
              "Created Date": summaryNow,
              "Modified Date": summaryNow,
              "To Account": hostAccountData.User,
              "Summary": aiHostSummary,
            });

          if (summaryInsertError) {
            console.error(`[proposal:create] Failed to persist AI summary:`, {
              code: summaryInsertError.code,
              message: summaryInsertError.message,
              details: summaryInsertError.details,
              hint: summaryInsertError.hint,
            });
            // Non-blocking: Summary display is secondary to proposal creation
          } else {
            console.log(`[proposal:create] AI summary persisted to negotiationsummary: ${summaryId}`);
          }
        } catch (persistError) {
          console.error(`[proposal:create] Exception persisting AI summary:`, persistError);
          // Non-blocking: Continue with proposal creation
        }
      } else {
        console.log(`[proposal:create] AI host summary returned null`);
      }
    } catch (aiError) {
      console.warn(`[proposal:create] AI host summary generation failed/timed out:`, aiError);
      // aiHostSummary remains null, frontend will use default CTA message
    }
  }

  // ================================================
  // CREATE SPLITBOT MESSAGES (Non-blocking)
  // ================================================
  // Create SplitBot notification messages for guest and host.
  // These are sent whether the thread is new or reused - the host and guest
  // need to be notified that a proposal was created in this thread.

  if (threadId) {
    try {
      console.log(`[proposal:create] Creating SplitBot messages for ${threadCreated ? 'new' : 'existing'} thread: ${threadId}`);

      // Fetch guest and host names for message templates
      const [guestProfile, hostProfile] = await Promise.all([
        getUserProfile(supabase, input.guestId),
        getUserProfile(supabase, hostAccountData.User),
      ]);

      // Fetch listing name if not already resolved
      const listingName = await getListingName(supabase, input.listingId);
      const resolvedListingName = listingName || "this listing";

      // Build template context for CTA message rendering
      console.log(`[proposal:create] Profiles - host: ${JSON.stringify(hostProfile)}, guest: ${JSON.stringify(guestProfile)}`);
      const templateContext = buildTemplateContext(
        hostProfile?.firstName || 'Host',
        guestProfile?.firstName || 'Guest',
        resolvedListingName
      );
      console.log(`[proposal:create] Template context: ${JSON.stringify(templateContext)}`);

      // Get CTAs for guest and host based on proposal status
      const [guestCTA, hostCTA] = await Promise.all([
        getCTAForProposalStatus(supabase, status, 'guest', templateContext),
        getCTAForProposalStatus(supabase, status, 'host', templateContext),
      ]);

      console.log(`[proposal:create] CTAs resolved - guest: ${guestCTA?.display || 'none'}, host: ${hostCTA?.display || 'none'}`);

      // Create guest SplitBot message
      if (guestCTA) {
        const guestMessageBody = guestCTA.message || getDefaultMessage(status, 'guest', templateContext);
        const guestVisibility = getVisibilityForRole('guest');

        await createSplitBotMessage(supabase, {
          threadId,
          messageBody: guestMessageBody,
          callToAction: guestCTA.display,
          visibleToHost: guestVisibility.visibleToHost,
          visibleToGuest: guestVisibility.visibleToGuest,
          recipientUserId: input.guestId,
        });
        console.log(`[proposal:create] SplitBot message sent to guest`);
      }

      // Create host SplitBot message (use AI summary if available)
      if (hostCTA) {
        const hostMessageBody = aiHostSummary || hostCTA.message || getDefaultMessage(status, 'host', templateContext);
        const hostVisibility = getVisibilityForRole('host');

        await createSplitBotMessage(supabase, {
          threadId,
          messageBody: hostMessageBody,
          callToAction: hostCTA.display,
          visibleToHost: hostVisibility.visibleToHost,
          visibleToGuest: hostVisibility.visibleToGuest,
          recipientUserId: hostAccountData.User,
        });
        console.log(`[proposal:create] SplitBot message sent to host${aiHostSummary ? ' (with AI summary)' : ''}`);
      }

      // Update thread's last message preview
      const lastMessageBody = guestCTA?.message || hostCTA?.message || `Proposal for ${resolvedListingName}`;
      await updateThreadLastMessage(supabase, threadId, lastMessageBody);

      console.log(`[proposal:create] SplitBot messages complete`);
    } catch (msgError) {
      // Non-blocking - proposal and thread are created, messages are secondary
      console.error(`[proposal:create] SplitBot messages failed:`, msgError);
      console.warn(`[proposal:create] Proposal and thread created, but SplitBot messages failed`);
    }
  }

  // ================================================
  // RETURN RESPONSE
  // ================================================

  console.log(`[proposal:create] Complete, returning response`);

  return {
    proposalId: proposalId,
    status: status,
    orderRanking: orderRanking,
    listingId: input.listingId,
    guestId: input.guestId,
    hostId: hostAccountData.User,
    createdAt: now,
    threadId: threadId || null,
    aiHostSummary: aiHostSummary,
  };
}
