/**
 * Z-Pricing Unit Test Page Logic Hook (v2.0)
 *
 * Complete pricing validation dashboard logic matching Bubble's z-pricing-unit-test page.
 * Implements all 16 Bubble workflows as handlers.
 *
 * Follows the Hollow Component Pattern - ALL logic lives here.
 *
 * @see .claude/plans/New/20260127-z-pricing-unit-test-page-implementation.md
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { PRICING_CONSTANTS } from '../../../logic/constants/pricingConstants.js';
import { fetchZatPriceConfiguration } from '../../../lib/listingDataFetcher.js';
import { adaptPricingListFromSupabase } from '../../../logic/processors/pricingList/adaptPricingListFromSupabase.ts';
import {
  calculateCombinedMarkup,
  calculateMonthlyAvgNightly,
  calculateAverageWeeklyPrice
} from '../../../logic/calculators/pricingList/index.ts';
import { calculatePrice } from '../../../lib/scheduleSelector/priceCalculations.js';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKS_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 12, 13, 26, 52];
const GUEST_PATTERN_OPTIONS = [
  { value: 'every-week', label: 'Every Week' },
  { value: 'one-on-off', label: '1 Week On / 1 Off' },
  { value: 'two-on-off', label: '2 On / 2 Off' },
  { value: 'one-three-off', label: '1 On / 3 Off' }
];

const DEFAULT_RESERVATION_SPAN = 13;

// ─────────────────────────────────────────────────────────────
// INITIAL STATE DEFINITIONS
// ─────────────────────────────────────────────────────────────

const INITIAL_HOST_RATES = {
  hostCompStyle: '',
  weeksOffered: 'Every week',
  rate2Night: 0,
  rate3Night: 0,
  rate4Night: 0,
  rate5Night: 0,
  weeklyRate: 0,
  monthlyRate: 0,
  damageDeposit: 0,
  cleaningDeposit: 0,
  unitMarkup: 0,
  minNights: null,
  maxNights: null,
  minWeeks: null,
  maxWeeks: null,
  nightsPerWeek: 7,
  nightsAvailable: []
};

const INITIAL_VALIDATION_FLAGS = {
  priceExists: false,
  rentalTypeSelected: false,
  appearsInSearch: false,
  discountsPositive: true,
  unusedNightsNotDecreasing: true,
  minMaxMakesSense: true,
  allGood: false
};

const INITIAL_COMPARISON_RESULTS = {
  fourWeekRent: { workflow: 0, formula: 0, match: true },
  initialPayment: { workflow: 0, formula: 0, match: true },
  nightlyPrice: { workflow: 0, formula: 0, match: true },
  totalReservation: { workflow: 0, formula: 0, match: true }
};

const INITIAL_PRICING_OUTPUT = {
  monthly: { proratedNightlyRate: 0, avgNightly: 0, avgWeeklyPrice: 0, markup: 0 },
  weekly: { proratedNightlyRate: 0, markup: 0, unusedNightsDiscount: 0 },
  nightly: { baseRate: 0, withMarkup: 0, fullTimeDiscount: 0 }
};

// ─────────────────────────────────────────────────────────────
// HELPER: Map "Weeks offered" to Guest Pattern dropdown value
// ─────────────────────────────────────────────────────────────

/**
 * Maps listing's "Weeks offered" field to guest pattern dropdown value
 * @param {string} weeksOffered - The "Weeks offered" value from listing
 * @returns {string} One of: 'every-week', 'one-on-off', 'two-on-off', 'one-three-off'
 */
function mapWeeksOfferedToGuestPattern(weeksOffered) {
  if (!weeksOffered) return 'every-week';

  const pattern = weeksOffered.toLowerCase();

  // Match "1on1off" or "1 week on 1 week off" or similar variations
  if (pattern.includes('1on1off') ||
      pattern.includes('1 on 1 off') ||
      (pattern.includes('1 week on') && pattern.includes('1 week off')) ||
      (pattern.includes('one week on') && pattern.includes('one week off'))) {
    return 'one-on-off';
  }

  // Match "2on2off" or "2 week on 2 week off"
  if (pattern.includes('2on2off') ||
      pattern.includes('2 on 2 off') ||
      (pattern.includes('2 week on') && pattern.includes('2 week off')) ||
      (pattern.includes('two week on') && pattern.includes('two week off'))) {
    return 'two-on-off';
  }

  // Match "1on3off" or "1 week on 3 week off"
  if (pattern.includes('1on3off') ||
      pattern.includes('1 on 3 off') ||
      (pattern.includes('1 week on') && pattern.includes('3 week off')) ||
      (pattern.includes('one week on') && pattern.includes('three week off'))) {
    return 'one-three-off';
  }

  // Default: "Every week" or unrecognized patterns
  return 'every-week';
}

// ─────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────

export function useZPricingUnitTestPageLogic() {
  // ═══════════════════════════════════════════════════════════
  // STATE: GLOBAL CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  const [zatConfig, setZatConfig] = useState(null);
  const [zatConfigLoading, setZatConfigLoading] = useState(true);

  // ═══════════════════════════════════════════════════════════
  // STATE: LISTINGS
  // ═══════════════════════════════════════════════════════════
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListingId, setSelectedListingId] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedListingLoading, setSelectedListingLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // STATE: PRICING LIST (from database)
  // ═══════════════════════════════════════════════════════════
  const [pricingList, setPricingList] = useState(null);
  const [pricingListLoading, setPricingListLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // STATE: CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  const [reservationSpan, setReservationSpan] = useState(DEFAULT_RESERVATION_SPAN);
  const [guestPattern, setGuestPattern] = useState('every-week');
  const [hostRates, setHostRates] = useState(INITIAL_HOST_RATES);

  // ═══════════════════════════════════════════════════════════
  // STATE: SCHEDULE SELECTOR (from ListingScheduleSelector)
  // ═══════════════════════════════════════════════════════════
  const [selectedDays, setSelectedDays] = useState([]);
  const [priceBreakdown, setPriceBreakdown] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // STATE: OUTPUTS
  // ═══════════════════════════════════════════════════════════
  const [pricingOutput, setPricingOutput] = useState(INITIAL_PRICING_OUTPUT);
  const [validationFlags, setValidationFlags] = useState(INITIAL_VALIDATION_FLAGS);
  const [comparisonResults, setComparisonResults] = useState(INITIAL_COMPARISON_RESULTS);

  // ═══════════════════════════════════════════════════════════
  // STATE: UI
  // ═══════════════════════════════════════════════════════════
  const [alertMessage, setAlertMessage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // DERIVED VALUES
  // ═══════════════════════════════════════════════════════════
  const nightsCount = useMemo(() => {
    return selectedDays.length > 0 ? selectedDays.length - 1 : 0;
  }, [selectedDays]);

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const query = searchQuery.toLowerCase();
    return listings.filter(listing =>
      listing._id?.toLowerCase().includes(query) ||
      listing.Name?.toLowerCase().includes(query) ||
      listing['Host email']?.toLowerCase().includes(query)
    );
  }, [listings, searchQuery]);

  const scheduleListing = useMemo(() => {
    if (!selectedListing) return null;
    return buildScheduleListing(selectedListing);
  }, [selectedListing]);

  const monthsInSpan = useMemo(() => {
    return (reservationSpan / 4.33).toFixed(1);
  }, [reservationSpan]);

  // ═══════════════════════════════════════════════════════════
  // EFFECTS: DATA LOADING
  // ═══════════════════════════════════════════════════════════

  // Load ZAT config on mount
  useEffect(() => {
    loadZatConfig();
  }, []);

  // Load listings on mount
  useEffect(() => {
    loadListings();
  }, []);

  // Auto-calculate comparison when priceBreakdown or selection changes
  useEffect(() => {
    if (priceBreakdown && selectedListing && zatConfig && selectedDays.length > 0) {
      // Run pricing calculations for display
      const pricing = runPricingCalculations(selectedListing, zatConfig, nightsCount, hostRates);
      setPricingOutput(pricing);

      // Run workflow vs formula vs pricing list comparison
      const comparison = runComparisonChecks(priceBreakdown, selectedDays, selectedListing, reservationSpan, zatConfig, hostRates, pricingList);
      setComparisonResults(comparison);

      console.log('[Auto-calc] Comparison updated:', comparison);
    }
  }, [priceBreakdown, selectedDays, selectedListing, zatConfig, nightsCount, hostRates, reservationSpan]);

  // ═══════════════════════════════════════════════════════════
  // DATA LOADERS
  // ═══════════════════════════════════════════════════════════

  async function loadZatConfig() {
    try {
      setZatConfigLoading(true);
      const config = await fetchZatPriceConfiguration();
      setZatConfig(config);
    } catch (error) {
      console.error('[ZPricingUnitTest] Failed to load ZAT config:', error);
      // Use defaults
      setZatConfig({
        overallSiteMarkup: PRICING_CONSTANTS.SITE_MARKUP_RATE,
        fullTimeDiscount: PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE,
        unusedNightsDiscountMultiplier: 0.03,
        avgDaysPerMonth: 30.4,
        weeklyMarkup: 0
      });
    } finally {
      setZatConfigLoading(false);
    }
  }

  async function loadListings() {
    try {
      setListingsLoading(true);
      setListingsError(null);

      const { data, error } = await supabase
        .from('listing')
        .select(`
          _id,
          "Name",
          "rental type",
          "Weeks offered",
          "nightly_rate_2_nights",
          "nightly_rate_3_nights",
          "nightly_rate_4_nights",
          "nightly_rate_5_nights",
          "weekly_host_rate",
          "monthly_host_rate",
          "damage_deposit",
          "cleaning_fee",
          "unit_markup",
          "Minimum Nights",
          "Maximum Nights",
          "Minimum Weeks",
          "Maximum Weeks",
          "# of nights available",
          "Nights Available (List of Nights) ",
          "Days Available (List of Days)",
          pricing_list,
          "Active",
          "Complete",
          "Approved",
          "Host email"
        `)
        .eq('"Deleted"', false)
        .order('"Modified Date"', { ascending: false })
        .limit(500);

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('[ZPricingUnitTest] Failed to load listings:', error);
      setListingsError(`Failed to load listings: ${error.message}`);
    } finally {
      setListingsLoading(false);
    }
  }

  async function loadPricingList(listingId) {
    if (!listingId) {
      setPricingList(null);
      return;
    }

    try {
      setPricingListLoading(true);

      // First get the listing's pricing_list FK
      const { data: listing, error: listingError } = await supabase
        .from('listing')
        .select('pricing_list')
        .eq('_id', listingId)
        .single();

      if (listingError) throw listingError;

      if (!listing?.pricing_list) {
        console.log('[ZPricingUnitTest] No pricing_list FK on listing:', listingId);
        setPricingList(null);
        return;
      }

      // Then fetch the pricing_list by its _id
      const { data, error } = await supabase
        .from('pricing_list')
        .select('*')
        .eq('_id', listing.pricing_list)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPricingList(adaptPricingListFromSupabase(data));
      } else {
        setPricingList(null);
      }
    } catch (error) {
      console.error('[ZPricingUnitTest] Failed to load pricing list:', error);
      setPricingList(null);
    } finally {
      setPricingListLoading(false);
    }
  }

  async function loadFullListing(listingId) {
    if (!listingId) {
      setSelectedListing(null);
      setHostRates(INITIAL_HOST_RATES);
      return;
    }

    try {
      setSelectedListingLoading(true);

      const { data, error } = await supabase
        .from('listing')
        .select(`
          _id,
          "Name",
          "rental type",
          "Weeks offered",
          "nightly_rate_2_nights",
          "nightly_rate_3_nights",
          "nightly_rate_4_nights",
          "nightly_rate_5_nights",
          "weekly_host_rate",
          "monthly_host_rate",
          "damage_deposit",
          "cleaning_fee",
          "unit_markup",
          "Minimum Nights",
          "Maximum Nights",
          "Minimum Weeks",
          "Maximum Weeks",
          "# of nights available",
          "Nights Available (List of Nights) ",
          "Days Available (List of Days)",
          pricing_list,
          "Active",
          "Complete",
          "Approved"
        `)
        .eq('_id', listingId)
        .single();

      if (error) throw error;

      setSelectedListing(data);
      populateHostRates(data);
      await loadPricingList(listingId);
    } catch (error) {
      console.error('[ZPricingUnitTest] Failed to load listing:', error);
      setSelectedListing(null);
    } finally {
      setSelectedListingLoading(false);
    }
  }

  function populateHostRates(listing) {
    if (!listing) {
      setHostRates(INITIAL_HOST_RATES);
      setGuestPattern('every-week');
      return;
    }

    const weeksOffered = listing['Weeks offered'] || 'Every week';

    setHostRates({
      hostCompStyle: listing['rental type'] || '',
      weeksOffered: listing['Weeks offered'] || 'Every week',
      rate2Night: parseFloat(listing['nightly_rate_2_nights']) || 0,
      rate3Night: parseFloat(listing['nightly_rate_3_nights']) || 0,
      rate4Night: parseFloat(listing['nightly_rate_4_nights']) || 0,
      rate5Night: parseFloat(listing['nightly_rate_5_nights']) || 0,
      weeklyRate: parseFloat(listing['weekly_host_rate']) || 0,
      monthlyRate: parseFloat(listing['monthly_host_rate']) || 0,
      damageDeposit: parseFloat(listing['damage_deposit']) || 0,
      cleaningDeposit: parseFloat(listing['cleaning_fee']) || 0,
      unitMarkup: parseFloat(listing['unit_markup']) || 0,
      minNights: listing['Minimum Nights'],
      maxNights: listing['Maximum Nights'],
      minWeeks: listing['Minimum Weeks'],
      maxWeeks: listing['Maximum Weeks'],
      nightsPerWeek: listing['# of nights available'] || 7,
      nightsAvailable: parseArrayField(listing['Nights Available (List of Nights) '])
    });

    // Auto-populate Guest Pattern dropdown based on listing's Weeks Offered
    const mappedPattern = mapWeeksOfferedToGuestPattern(weeksOffered);
    setGuestPattern(mappedPattern);
  }

  // ═══════════════════════════════════════════════════════════
  // WORKFLOW HANDLERS (All 16 from Bubble)
  // ═══════════════════════════════════════════════════════════

  // Workflow 1: Data check click
  const handleDataCheckClick = useCallback((nightCount) => {
    console.log('[Workflow 1] Data check clicked for night count:', nightCount);
    // Updates selected night for validation display
  }, []);

  // Workflow 2: 4-week rent click
  const handleFourWeekRentClick = useCallback(() => {
    console.log('[Workflow 2] 4-week rent clicked');
    // Triggers 4-week rent calculation display
    if (priceBreakdown?.fourWeekRent) {
      setAlertMessage(`4-Week Rent: $${priceBreakdown.fourWeekRent.toFixed(2)}`);
      setTimeout(() => setAlertMessage(null), 3000);
    }
  }, [priceBreakdown]);

  // Workflow 3: Run Price List
  const handleUpdatePricingList = useCallback(async () => {
    if (!selectedListing?._id) return;

    try {
      setIsUpdating(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Call the pricing-list Edge Function to create/recalculate pricing
      const response = await fetch(`${supabaseUrl}/functions/v1/pricing-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          payload: {
            listing_id: selectedListing._id,
            user_id: 'admin-test',
            unit_markup: selectedListing['unit_markup'] || 0
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update pricing list (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('[Workflow 3] Pricing list response:', result);

      // Reload pricing list
      await loadPricingList(selectedListing._id);
      setAlertMessage('Pricing list updated successfully');
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error('[Workflow 3] Update pricing list error:', error);
      setAlertMessage(`Error: ${error.message}`);
      setTimeout(() => setAlertMessage(null), 5000);
    } finally {
      setIsUpdating(false);
    }
  }, [selectedListing]);

  // Workflow 4/5: Run Starting Nightly Price
  const handleUpdateStartingNightly = useCallback(async () => {
    if (!selectedListing?._id) return;

    try {
      setIsUpdating(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Call the pricing-list Edge Function with recalculate action
      const response = await fetch(`${supabaseUrl}/functions/v1/pricing-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recalculate',
          payload: {
            listing_id: selectedListing._id,
            user_id: 'admin-test',
            unit_markup: selectedListing['unit_markup'] || 0
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update starting nightly (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('[Workflow 4/5] Starting nightly response:', result);

      await loadPricingList(selectedListing._id);
      setAlertMessage('Starting nightly price updated');
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error('[Workflow 4/5] Update starting nightly error:', error);
      setAlertMessage(`Error: ${error.message}`);
      setTimeout(() => setAlertMessage(null), 5000);
    } finally {
      setIsUpdating(false);
    }
  }, [selectedListing]);

  // Workflow 6: Run Checks
  const handleRunChecks = useCallback(() => {
    if (!selectedListing || !zatConfig) {
      setAlertMessage('Select a listing first');
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    // Run validation
    const flags = runValidationChecks(selectedListing, pricingList, hostRates);
    setValidationFlags(flags);

    // Run pricing calculations for display in Section 4
    const pricing = runPricingCalculations(selectedListing, zatConfig, nightsCount, hostRates);
    setPricingOutput(pricing);

    // Run workflow vs formula vs pricing list comparison
    const comparison = runComparisonChecks(priceBreakdown, selectedDays, selectedListing, reservationSpan, zatConfig, hostRates, pricingList);
    setComparisonResults(comparison);

    setAlertMessage('Checks completed');
    setTimeout(() => setAlertMessage(null), 2000);
  }, [selectedListing, zatConfig, pricingList, hostRates, nightsCount, priceBreakdown, selectedDays, reservationSpan]);

  // Workflow 7: Set Pattern
  const handleSetPattern = useCallback((pattern) => {
    setGuestPattern(pattern);
  }, []);

  // Workflow 8: Set Reservation Span
  const handleSetReservationSpan = useCallback((value) => {
    const parsed = parseInt(value, 10);
    setReservationSpan(Number.isNaN(parsed) ? DEFAULT_RESERVATION_SPAN : Math.max(parsed, 1));
  }, []);

  // Workflow 9: Double Check (Workflow vs Formula comparison)
  const handleDoubleCheck = useCallback(() => {
    console.log('[Workflow 9] Double check triggered');
    handleRunChecks();
  }, [handleRunChecks]);

  // Workflow 10: Clear Search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedListingId('');
    setSelectedListing(null);
    setPricingList(null);
    setHostRates(INITIAL_HOST_RATES);
    setSelectedDays([]);
    setPriceBreakdown(null);
    setValidationFlags(INITIAL_VALIDATION_FLAGS);
    setComparisonResults(INITIAL_COMPARISON_RESULTS);
  }, []);

  // Workflow 11-13: Markup clicks
  const handleMarkupClick = useCallback((rentalType) => {
    console.log('[Workflow 11-13] Markup clicked for:', rentalType);
    // Recalculates markups for specific rental type
    if (zatConfig && selectedListing) {
      const pricing = runPricingCalculations(selectedListing, zatConfig, nightsCount, hostRates);
      setPricingOutput(pricing);
    }
  }, [zatConfig, selectedListing, nightsCount, hostRates]);

  // Workflow 14-15: Prorated clicks
  const handleProratedClick = useCallback((rentalType) => {
    console.log('[Workflow 14-15] Prorated clicked for:', rentalType);
    // Recalculates prorated rates
    if (zatConfig && selectedListing) {
      const pricing = runPricingCalculations(selectedListing, zatConfig, nightsCount, hostRates);
      setPricingOutput(pricing);
    }
  }, [zatConfig, selectedListing, nightsCount, hostRates]);

  // Workflow 16: Purple Alert
  const handleShowAlert = useCallback((message) => {
    setAlertMessage(message || 'Alert triggered');
    setTimeout(() => setAlertMessage(null), 3000);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // OTHER HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleListingChange = useCallback(async (listingId) => {
    setSelectedListingId(listingId);
    await loadFullListing(listingId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHostRateChange = useCallback((field, value) => {
    setHostRates(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? (parseFloat(value) || 0) : value
    }));
  }, []);

  // Schedule selector callbacks
  const handleSelectionChange = useCallback((days) => {
    setSelectedDays(days);
  }, []);

  const handlePriceChange = useCallback((breakdown) => {
    setPriceBreakdown(breakdown);
  }, []);

  const handleReset = useCallback(() => {
    handleClearSearch();
    setReservationSpan(DEFAULT_RESERVATION_SPAN);
    setGuestPattern('every-week');
    setPricingOutput(INITIAL_PRICING_OUTPUT);
  }, [handleClearSearch]);

  // ═══════════════════════════════════════════════════════════
  // RETURN VALUE
  // ═══════════════════════════════════════════════════════════
  return {
    // Constants
    DAY_NAMES,
    DAY_FULL_NAMES,
    WEEKS_COUNT_OPTIONS,
    GUEST_PATTERN_OPTIONS,

    // Global config
    zatConfig,
    zatConfigLoading,

    // Listings
    listings,
    filteredListings,
    listingsLoading,
    listingsError,
    searchQuery,
    selectedListingId,
    selectedListing,
    selectedListingLoading,

    // Pricing list (from database)
    pricingList,
    pricingListLoading,

    // Configuration
    reservationSpan,
    guestPattern,
    hostRates,

    // Schedule selector
    selectedDays,
    nightsCount,
    priceBreakdown,
    scheduleListing,

    // Derived
    monthsInSpan,

    // Outputs
    pricingOutput,
    validationFlags,
    comparisonResults,

    // UI state
    alertMessage,
    isUpdating,

    // Handlers - Search & Selection
    setSearchQuery,
    handleClearSearch,
    handleListingChange,
    handleHostRateChange,
    handleReset,

    // Handlers - Schedule Selector
    handleSelectionChange,
    handlePriceChange,

    // Handlers - Configuration
    handleSetPattern,
    handleSetReservationSpan,

    // Handlers - Actions (Workflows 1-16)
    handleDataCheckClick,
    handleFourWeekRentClick,
    handleUpdatePricingList,
    handleUpdateStartingNightly,
    handleRunChecks,
    handleDoubleCheck,
    handleMarkupClick,
    handleProratedClick,
    handleShowAlert
  };
}

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

function buildScheduleListing(listing) {
  // For the unit test page, override day availability constraints
  // to allow testing any scenario regardless of listing's actual settings
  const ALL_DAYS_AVAILABLE = [0, 1, 2, 3, 4, 5, 6]; // Sun-Sat

  return {
    id: listing._id,
    name: listing.Name || 'Untitled',
    rentalType: listing['rental type'] || 'Nightly',
    weeksOffered: listing['Weeks offered'] || 'Every week',
    unitMarkup: listing['unit_markup'] || 0,
    cleaningFee: listing['cleaning_fee'] || 0,
    damageDeposit: listing['damage_deposit'] || 0,
    weeklyHostRate: listing['weekly_host_rate'] || 0,
    monthlyHostRate: listing['monthly_host_rate'] || 0,
    rate2Night: listing['nightly_rate_2_nights'] || 0,
    rate3Night: listing['nightly_rate_3_nights'] || 0,
    rate4Night: listing['nightly_rate_4_nights'] || 0,
    rate5Night: listing['nightly_rate_5_nights'] || 0,
    // Override: Allow selecting from 1 to 7 nights for testing
    minimumNights: 1,
    maximumNights: 7,
    minimumWeeks: listing['Minimum Weeks'] || 1,
    maximumWeeks: listing['Maximum Weeks'] || 52,
    // Override: Full week available for testing
    nightsPerWeek: 7,
    // Override: All days selectable for testing any scenario
    daysAvailable: ALL_DAYS_AVAILABLE,
    nightsAvailable: parseArrayField(listing['Nights Available (List of Nights) ']) || []
  };
}

function parseArrayField(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}

function runValidationChecks(listing, pricingList, hostRates) {
  // Debug logging
  console.log('[runValidationChecks] Input values:', {
    listingId: listing?._id,
    rentalType: listing?.['rental type'],
    pricingListNull: pricingList === null,
    pricingListNightlyPrice: pricingList?.nightlyPrice,
    pricingListStartingNightly: pricingList?.startingNightlyPrice,
    listingActive: listing?.Active,
    listingComplete: listing?.Complete,
    listingApproved: listing?.Approved
  });

  // Check 1: Price exists
  const priceExists = pricingList !== null &&
    (pricingList.nightlyPrice?.some(p => p > 0) || pricingList.startingNightlyPrice > 0);

  // Check 2: Rental type selected
  const rentalTypeSelected = listing['rental type'] !== null &&
    listing['rental type'] !== undefined &&
    listing['rental type'] !== '';

  // Check 3: Appears in search (Active, Complete, Approved)
  const appearsInSearch = listing.Active === true &&
    listing.Complete === true &&
    listing.Approved === true;

  // Check 4: Discounts are positive
  const discountsPositive = !pricingList?.unusedNightsDiscount ||
    pricingList.unusedNightsDiscount.every(d => d === null || d >= 0);

  // Check 5: Unused nights not decreasing
  const unusedNightsNotDecreasing = !pricingList?.unusedNightsDiscount ||
    pricingList.unusedNightsDiscount.every((d, i, arr) => {
      if (i === 0 || d === null || arr[i - 1] === null) return true;
      return d <= arr[i - 1];
    });

  // Check 6: Min/Max makes sense
  const minNights = hostRates.minNights ?? 1;
  const maxNights = hostRates.maxNights ?? 7;
  const minMaxMakesSense = minNights <= maxNights;

  // Check 7: All good
  const allGood = priceExists && rentalTypeSelected && appearsInSearch &&
    discountsPositive && unusedNightsNotDecreasing && minMaxMakesSense;

  return {
    priceExists,
    rentalTypeSelected,
    appearsInSearch,
    discountsPositive,
    unusedNightsNotDecreasing,
    minMaxMakesSense,
    allGood
  };
}

function runPricingCalculations(listing, zatConfig, nightsCount, hostRates) {
  const _rentalType = listing['rental type'] || 'Nightly';
  const effectiveNights = nightsCount > 0 ? nightsCount : 3;

  console.log('[runPricingCalculations] Input values:', {
    nightsCount,
    effectiveNights,
    hostRates: {
      weeklyRate: hostRates.weeklyRate,
      monthlyRate: hostRates.monthlyRate,
      rate2Night: hostRates.rate2Night,
      rate3Night: hostRates.rate3Night,
      rate4Night: hostRates.rate4Night,
      rate5Night: hostRates.rate5Night,
      unitMarkup: hostRates.unitMarkup
    }
  });

  // 1. Setup Base Scalars
  const siteMarkup = zatConfig.overallSiteMarkup || 0.17;
  const unitMarkup = hostRates.unitMarkup || 0;
  const weeklyMarkup = zatConfig.weeklyMarkup || 0;

  // 2. Calculate Unused Nights Discount (Linear)
  const unusedNightsCount = 7 - effectiveNights;
  const unusedNightsDiscount = unusedNightsCount * (zatConfig.unusedNightsDiscountMultiplier || 0.03);

  // 3. Calculate Full Time Discount (Nightly only)
  const fullTimeDiscount = effectiveNights === 7 ? (zatConfig.fullTimeDiscount || 0.13) : 0;

  // 4. Combined Markup for display (Unit + Site)
  // Note: used for display stats
  const combinedMarkup = siteMarkup + unitMarkup;

  // --- Monthly Calculations ---
  let monthlyAvgNightly = 0;
  let monthlyAvgWeekly = 0;
  let monthlyProratedResult = 0;
  if (hostRates.monthlyRate > 0) {
    monthlyAvgNightly = calculateMonthlyAvgNightly({
      monthlyHostRate: hostRates.monthlyRate,
      avgDaysPerMonth: zatConfig.avgDaysPerMonth || 30.4
    });
    monthlyAvgWeekly = calculateAverageWeeklyPrice({ monthlyAvgNightly });

    // Formula: (Monthly Avg Nightly * 7) / Nights
    const monthlyBase = monthlyAvgWeekly / effectiveNights;

    // Monthly Multiplier: 1 + Site + Unit - Unused
    const mMultiplier = 1 + siteMarkup + unitMarkup - unusedNightsDiscount;
    monthlyProratedResult = monthlyBase * mMultiplier;
  }

  // --- Weekly Calculations ---
  let weeklyProratedResult = 0;
  if (hostRates.weeklyRate > 0) {
    const weeklyBase = hostRates.weeklyRate / effectiveNights;

    // Weekly Multiplier: 1 + Site + Unit + Weekly - Unused
    const wMultiplier = 1 + siteMarkup + unitMarkup + weeklyMarkup - unusedNightsDiscount;
    weeklyProratedResult = weeklyBase * wMultiplier;

    console.log('[runPricingCalculations] Weekly calc:', {
      weeklyRate: hostRates.weeklyRate,
      effectiveNights,
      weeklyBase,
      wMultiplier,
      weeklyProratedResult
    });
  } else {
    console.log('[runPricingCalculations] Weekly rate is 0, skipping weekly calc');
  }

  // --- Nightly Calculations ---
  const nightlyRateMap = {
    2: hostRates.rate2Night,
    3: hostRates.rate3Night,
    4: hostRates.rate4Night,
    5: hostRates.rate5Night
  };
  const baseNightlyRate = nightlyRateMap[effectiveNights] || hostRates.rate4Night || 0;

  // Nightly Multiplier: 1 + Site + Unit - Unused - FullTime
  const nMultiplier = 1 + siteMarkup + unitMarkup - unusedNightsDiscount - fullTimeDiscount;
  const nightlyWithMarkup = baseNightlyRate * nMultiplier;

  const result = {
    monthly: {
      proratedNightlyRate: monthlyProratedResult,
      avgNightly: monthlyAvgNightly,
      avgWeeklyPrice: monthlyAvgWeekly,
      markup: combinedMarkup
    },
    weekly: {
      proratedNightlyRate: weeklyProratedResult,
      markup: combinedMarkup,
      unusedNightsDiscount
    },
    nightly: {
      baseRate: baseNightlyRate,
      withMarkup: nightlyWithMarkup,
      fullTimeDiscount
    }
  };

  console.log('[runPricingCalculations] Final result:', result);

  return result;
}

function runComparisonChecks(priceBreakdown, selectedDays, listing, reservationSpan, zatConfig, hostRates, pricingList) {
  // Workflow values (from ListingScheduleSelector's priceBreakdown callback)
  const workflowNightlyPrice = priceBreakdown?.pricePerNight || 0;
  const workflowFourWeekRent = priceBreakdown?.fourWeekRent || 0;
  const workflowInitialPayment = priceBreakdown?.initialPayment || 0;
  const workflowTotalReservation = priceBreakdown?.reservationTotal || 0;

  // Formula values: Re-calculate using the same calculatePrice function
  // This validates our formulas match what the selector is doing
  const selectedNights = selectedDays.length > 0
    ? selectedDays.slice(0, -1).map((day, i) => ({
      nightNumber: i,
      fromDay: day,
      toDay: selectedDays[i + 1] || day
    }))
    : [];

  const nightsCount = selectedNights.length;

  // Create a listing object with the host rates for formula calculation
  const formulaListing = listing ? {
    ...listing,
    rentalType: listing['rental type'] || listing.rentalType,
    weeklyHostRate: hostRates.weeklyRate,
    monthlyHostRate: hostRates.monthlyRate,
    unitMarkup: (hostRates.unitMarkup || 0) * 100, // Convert back to percentage
    cleaningFee: hostRates.cleaningDeposit,
    damageDeposit: hostRates.damageDeposit,
    weeksOffered: hostRates.weeksOffered,
    'weekly_host_rate': hostRates.weeklyRate,
    'monthly_host_rate': hostRates.monthlyRate,
    'nightly_rate_2_nights': hostRates.rate2Night,
    'nightly_rate_3_nights': hostRates.rate3Night,
    'nightly_rate_4_nights': hostRates.rate4Night,
    'nightly_rate_5_nights': hostRates.rate5Night,
    'unit_markup': (hostRates.unitMarkup || 0) * 100,
    'cleaning_fee': hostRates.cleaningDeposit,
    'damage_deposit': hostRates.damageDeposit,
    'Weeks offered': hostRates.weeksOffered
  } : null;

  // Calculate using our formula implementation
  const formulaResult = formulaListing
    ? calculatePrice(selectedNights, formulaListing, reservationSpan, zatConfig)
    : { pricePerNight: 0, fourWeekRent: 0, initialPayment: 0, reservationTotal: 0 };

  const formulaNightlyPrice = formulaResult.pricePerNight || 0;
  const formulaFourWeekRent = formulaResult.fourWeekRent || 0;
  const formulaInitialPayment = formulaResult.initialPayment || 0;
  const formulaTotalReservation = formulaResult.reservationTotal || 0;

  // ═══════════════════════════════════════════════════════════════
  // PRICING LIST VALUES: Calculate from the pricing_list database structure
  // ═══════════════════════════════════════════════════════════════
  const pricingListValues = calculatePricingListValues(
    pricingList,
    nightsCount,
    reservationSpan,
    hostRates.weeksOffered,
    hostRates.cleaningDeposit,
    hostRates.damageDeposit
  );

  console.log('[runComparisonChecks] Workflow vs Formula vs PricingList:', {
    workflow: { workflowNightlyPrice, workflowFourWeekRent, workflowInitialPayment, workflowTotalReservation },
    formula: { formulaNightlyPrice, formulaFourWeekRent, formulaInitialPayment, formulaTotalReservation },
    pricingList: pricingListValues,
    selectedNightsCount: nightsCount,
    rentalType: listing?.['rental type']
  });

  const tolerance = 1; // Allow $1 tolerance for rounding differences

  return {
    fourWeekRent: {
      workflow: workflowFourWeekRent,
      formula: formulaFourWeekRent,
      pricingList: pricingListValues.fourWeekRent,
      match: Math.abs(workflowFourWeekRent - formulaFourWeekRent) < tolerance,
      matchPricingList: Math.abs(workflowFourWeekRent - pricingListValues.fourWeekRent) < tolerance
    },
    initialPayment: {
      workflow: workflowInitialPayment,
      formula: formulaInitialPayment,
      pricingList: pricingListValues.initialPayment,
      match: Math.abs(workflowInitialPayment - formulaInitialPayment) < tolerance,
      matchPricingList: Math.abs(workflowInitialPayment - pricingListValues.initialPayment) < tolerance
    },
    nightlyPrice: {
      workflow: workflowNightlyPrice,
      formula: formulaNightlyPrice,
      pricingList: pricingListValues.nightlyPrice,
      match: Math.abs(workflowNightlyPrice - formulaNightlyPrice) < tolerance,
      matchPricingList: Math.abs(workflowNightlyPrice - pricingListValues.nightlyPrice) < tolerance
    },
    totalReservation: {
      workflow: workflowTotalReservation,
      formula: formulaTotalReservation,
      pricingList: pricingListValues.totalReservation,
      match: Math.abs(workflowTotalReservation - formulaTotalReservation) < tolerance,
      matchPricingList: Math.abs(workflowTotalReservation - pricingListValues.totalReservation) < tolerance
    }
  };
}

/**
 * Calculate pricing values from the pricing_list database structure
 * Uses the pre-computed arrays for the selected night count
 */
function calculatePricingListValues(pricingList, nightsCount, reservationSpan, weeksOffered, cleaningFee, damageDeposit) {
  if (!pricingList || nightsCount < 1 || nightsCount > 7) {
    return { nightlyPrice: 0, fourWeekRent: 0, initialPayment: 0, totalReservation: 0 };
  }

  // Array index is 0-based (nights 1-7 = indices 0-6)
  const index = nightsCount - 1;

  // Get the nightly price from the pricing list array
  const nightlyPrice = pricingList.nightlyPrice?.[index] || 0;

  // Get weekly schedule period for 4-week rent calculation
  const weeklySchedulePeriod = getWeeklySchedulePeriodForPricingList(weeksOffered);

  // Calculate 4-Week Rent: (nightlyPrice * nights * 4) / weeklySchedulePeriod
  const fourWeekRent = (nightlyPrice * nightsCount * 4) / weeklySchedulePeriod;

  // Initial Payment: 4-week rent + cleaning fee + damage deposit
  const initialPayment = fourWeekRent + (cleaningFee || 0) + (damageDeposit || 0);

  // Calculate total reservation price
  const totalReservation = calculateTotalReservationFromPricingList(
    nightlyPrice,
    nightsCount,
    reservationSpan,
    weeksOffered
  );

  return {
    nightlyPrice: Math.round(nightlyPrice * 100) / 100,
    fourWeekRent: Math.round(fourWeekRent),
    initialPayment: Math.round(initialPayment),
    totalReservation: Math.round(totalReservation)
  };
}

/**
 * Get weekly schedule period based on weeks offered pattern
 */
function getWeeklySchedulePeriodForPricingList(weeksOffered) {
  const pattern = (weeksOffered || 'every week').toLowerCase();

  if (pattern.includes('1 on 1 off') || pattern.includes('1on1off') ||
    (pattern.includes('one week on') && pattern.includes('one week off')) ||
    (pattern.includes('1 week on') && pattern.includes('1 week off'))) {
    return 2;
  }

  if (pattern.includes('2 on 2 off') || pattern.includes('2on2off') ||
    (pattern.includes('two week') && pattern.includes('two week')) ||
    (pattern.includes('2 week on') && pattern.includes('2 week off'))) {
    return 2;
  }

  if (pattern.includes('1 on 3 off') || pattern.includes('1on3off') ||
    (pattern.includes('one week on') && pattern.includes('three week')) ||
    (pattern.includes('1 week on') && pattern.includes('3 week off'))) {
    return 4;
  }

  return 1; // Default: "Every week"
}

/**
 * Calculate total reservation price from pricing list values
 */
function calculateTotalReservationFromPricingList(nightlyPrice, nightsCount, reservationSpan, weeksOffered) {
  // Reservation span to 4-week period mapping
  const RESERVATION_SPAN_PERIODS = {
    6: 1.5, 7: 1.75, 8: 2, 9: 2.25, 10: 2.5, 12: 3,
    13: 3.25, 16: 4, 17: 4.25, 20: 5, 22: 5.5, 26: 6.5
  };

  // Get actual weeks during 4-week period based on pattern
  const actualWeeksDuring4Week = getActualWeeksDuring4WeekForPricingList(weeksOffered);

  // Get 4-weeks per period from reservation span
  const fourWeeksPerPeriod = RESERVATION_SPAN_PERIODS[reservationSpan] || (reservationSpan / 4);

  // Calculate actual weeks during reservation span (with CEILING)
  const actualWeeksDuringReservation = Math.ceil(actualWeeksDuring4Week * fourWeeksPerPeriod);

  // Calculate total
  return nightlyPrice * nightsCount * actualWeeksDuringReservation;
}

/**
 * Get actual weeks during 4-week period based on pattern
 */
function getActualWeeksDuring4WeekForPricingList(weeksOffered) {
  const pattern = (weeksOffered || 'every week').toLowerCase();

  if (pattern.includes('1 on 1 off') || pattern.includes('1on1off') ||
    (pattern.includes('one week on') && pattern.includes('one week off')) ||
    (pattern.includes('1 week on') && pattern.includes('1 week off'))) {
    return 2;
  }

  if (pattern.includes('2 on 2 off') || pattern.includes('2on2off') ||
    (pattern.includes('two week') && pattern.includes('two week')) ||
    (pattern.includes('2 week on') && pattern.includes('2 week off'))) {
    return 2;
  }

  if (pattern.includes('1 on 3 off') || pattern.includes('1on3off') ||
    (pattern.includes('one week on') && pattern.includes('three week')) ||
    (pattern.includes('1 week on') && pattern.includes('3 week off'))) {
    return 1;
  }

  return 4; // Default: "Every week" = present all 4 weeks
}
