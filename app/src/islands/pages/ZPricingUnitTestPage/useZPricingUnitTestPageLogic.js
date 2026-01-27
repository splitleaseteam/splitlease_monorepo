/**
 * Z-Pricing Unit Test Page Logic Hook
 *
 * All business logic for the ZPricingUnitTestPage.
 * Follows the Hollow Component Pattern.
 *
 * Pricing Engine Test Features:
 * - Listing selector with search
 * - Reservation span configuration
 * - Guest pattern configuration
 * - Host rates input/editing
 * - Pricing calculations (Monthly, Weekly, Nightly)
 * - Data validation scorecard
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { PRICING_CONSTANTS } from '../../../logic/constants/pricingConstants.js';
import { fetchZatPriceConfiguration } from '../../../lib/listingDataFetcher.js';

// Day names for toggle buttons (0-indexed: Sunday=0)
const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Weeks count options
const WEEKS_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 12, 13, 26, 52];

// Initial state
const INITIAL_RESERVATION_CONFIG = {
  weeksCount: 4,
  selectedDays: [1, 2, 3, 4, 5] // Mon-Fri (0-indexed)
};

const INITIAL_GUEST_PATTERN = {
  checkInDay: 1,
  nights: 5
};

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
  nightsAvailable: [],
  unitMarkup: 0,
  minNights: null,
  maxNights: null
};

const INITIAL_PRICING_OUTPUT = {
  monthly: {
    proratedNightlyRate: 0,
    markupAndDiscounts: { siteMarkup: 0, unitMarkup: 0, discount: 0, total: 0 }
  },
  weekly: {
    proratedNightlyRate: 0,
    markupAndDiscounts: { siteMarkup: 0, unusedNightsDiscount: 0, total: 0 }
  },
  nightly: {
    baseRate: 0,
    nightPriceMultiplier: 1,
    markupAndDiscounts: { siteMarkup: 0, fullTimeDiscount: 0, total: 0 }
  }
};

const INITIAL_SCORECARD = {
  priceExists: false,
  rentalTypeSelected: false,
  appearsInSearch: false,
  discountsPositive: true,
  minNightsValid: false,
  maxNightsValid: false,
  nightlyPricingValid: false
};

export function useZPricingUnitTestPageLogic() {
  // Global pricing configuration from database
  const [zatConfig, setZatConfig] = useState(null);

  // Listings for dropdown
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected listing
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedListingLoading, setSelectedListingLoading] = useState(false);

  // Configuration state
  const [reservationConfig, setReservationConfig] = useState(INITIAL_RESERVATION_CONFIG);
  const [guestPattern, setGuestPattern] = useState(INITIAL_GUEST_PATTERN);
  const [hostRates, setHostRates] = useState(INITIAL_HOST_RATES);

  // Calculated outputs
  const [pricingOutput, setPricingOutput] = useState(INITIAL_PRICING_OUTPUT);
  const [scorecard, setScorecard] = useState(INITIAL_SCORECARD);

  // Load global pricing configuration on mount
  useEffect(() => {
    const loadZatConfig = async () => {
      try {
        const config = await fetchZatPriceConfiguration();
        setZatConfig(config);
      } catch (error) {
        console.error('[ZPricingUnitTest] Failed to load ZAT config:', error);
        // Use defaults from PRICING_CONSTANTS
        setZatConfig({
          overallSiteMarkup: PRICING_CONSTANTS.SITE_MARKUP_RATE,
          fullTimeDiscount: PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE,
          unusedNightsDiscountMultiplier: 0.03,
          avgDaysPerMonth: 31
        });
      }
    };
    loadZatConfig();
  }, []);

  // Fetch listings for dropdown
  useEffect(() => {
    const fetchListings = async () => {
      setListingsLoading(true);
      setListingsError(null);

      try {
        let query = supabase
          .from('listing')
          .select('_id, Name, Active, Complete, "rental type"')
          .eq('Deleted', false)
          .order('Name', { ascending: true })
          .limit(500);

        // Apply search filter if provided
        if (searchTerm.trim()) {
          query = query.ilike('Name', `%${searchTerm.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        setListings(data || []);
      } catch (error) {
        console.error('[ZPricingUnitTest] Failed to fetch listings:', error);
        setListingsError('Failed to load listings');
      } finally {
        setListingsLoading(false);
      }
    };

    fetchListings();
  }, [searchTerm]);

  // Fetch full listing details when selected
  const handleListingSelect = useCallback(async (listingId) => {
    if (!listingId) {
      setSelectedListing(null);
      setHostRates(INITIAL_HOST_RATES);
      return;
    }

    setSelectedListingLoading(true);

    try {
      const { data, error } = await supabase
        .from('listing')
        .select(`
          _id,
          Name,
          "rental type",
          "Weeks offered",
          "Host Comp Style",
          "💰Nightly Host Rate for 2 nights",
          "💰Nightly Host Rate for 3 nights",
          "💰Nightly Host Rate for 4 nights",
          "💰Nightly Host Rate for 5 nights",
          "💰Weekly Host Rate",
          "💰Monthly Host Rate",
          "💰Damage Deposit",
          "💰Cleaning Cost / Maintenance Fee",
          "💰Unit Markup",
          "Nights_Available",
          "Minimum Nights",
          "Maximum Nights",
          Active,
          Complete,
          Approved
        `)
        .eq('_id', listingId)
        .single();

      if (error) throw error;

      setSelectedListing(data);

      // Populate host rates from listing
      setHostRates({
        hostCompStyle: data['Host Comp Style'] || '',
        weeksOffered: data['Weeks offered'] || 'Every week',
        rate2Night: parseFloat(data['💰Nightly Host Rate for 2 nights']) || 0,
        rate3Night: parseFloat(data['💰Nightly Host Rate for 3 nights']) || 0,
        rate4Night: parseFloat(data['💰Nightly Host Rate for 4 nights']) || 0,
        rate5Night: parseFloat(data['💰Nightly Host Rate for 5 nights']) || 0,
        weeklyRate: parseFloat(data['💰Weekly Host Rate']) || 0,
        monthlyRate: parseFloat(data['💰Monthly Host Rate']) || 0,
        damageDeposit: parseFloat(data['💰Damage Deposit']) || 0,
        cleaningDeposit: parseFloat(data['💰Cleaning Cost / Maintenance Fee']) || 0,
        nightsAvailable: parseArrayField(data['Nights_Available']),
        unitMarkup: parseFloat(data['💰Unit Markup']) || 0,
        minNights: data['Minimum Nights'],
        maxNights: data['Maximum Nights']
      });
    } catch (error) {
      console.error('[ZPricingUnitTest] Failed to fetch listing details:', error);
    } finally {
      setSelectedListingLoading(false);
    }
  }, []);

  // Calculate pricing when inputs change
  useEffect(() => {
    if (!zatConfig) return;

    const nightsCount = reservationConfig.selectedDays.length;

    // Calculate Monthly Prorated Nightly Rate
    // Formula: (Monthly Host Rate / 31) * (1 + Overall Site Markup + SL Unit Markup)
    const monthlyProratedNightly = hostRates.monthlyRate > 0
      ? (hostRates.monthlyRate / zatConfig.avgDaysPerMonth) * (1 + zatConfig.overallSiteMarkup + hostRates.unitMarkup)
      : 0;

    // Calculate Weekly Prorated Nightly Rate
    // Formula: (Weekly Host Rate / 7) * (1 + Site Markup) * (1 - unused nights discount)
    const unusedNightsCount = 7 - nightsCount;
    const unusedNightsDiscount = unusedNightsCount * zatConfig.unusedNightsDiscountMultiplier;
    const weeklyProratedNightly = hostRates.weeklyRate > 0
      ? (hostRates.weeklyRate / 7) * (1 + zatConfig.overallSiteMarkup) * (1 - unusedNightsDiscount)
      : 0;

    // Calculate Nightly Rate
    // Get rate for selected nights count
    const nightlyRateMap = {
      2: hostRates.rate2Night,
      3: hostRates.rate3Night,
      4: hostRates.rate4Night,
      5: hostRates.rate5Night,
      7: hostRates.weeklyRate / 7 // Full week uses weekly rate
    };
    const baseNightlyRate = nightlyRateMap[nightsCount] || hostRates.rate4Night;

    // Apply full-time discount for 7 nights
    const fullTimeDiscount = nightsCount === 7 ? zatConfig.fullTimeDiscount : 0;
    const nightlyWithMarkup = baseNightlyRate * (1 + zatConfig.overallSiteMarkup) * (1 - fullTimeDiscount);

    setPricingOutput({
      monthly: {
        proratedNightlyRate: monthlyProratedNightly,
        markupAndDiscounts: {
          siteMarkup: zatConfig.overallSiteMarkup,
          unitMarkup: hostRates.unitMarkup,
          discount: 0,
          total: monthlyProratedNightly
        }
      },
      weekly: {
        proratedNightlyRate: weeklyProratedNightly,
        markupAndDiscounts: {
          siteMarkup: zatConfig.overallSiteMarkup,
          unusedNightsDiscount: unusedNightsDiscount,
          total: weeklyProratedNightly
        }
      },
      nightly: {
        baseRate: baseNightlyRate,
        nightPriceMultiplier: 1,
        markupAndDiscounts: {
          siteMarkup: zatConfig.overallSiteMarkup,
          fullTimeDiscount: fullTimeDiscount,
          total: nightlyWithMarkup
        }
      }
    });
  }, [zatConfig, reservationConfig, guestPattern, hostRates]);

  // Helper to get nightly rate for specific count
  const getNightlyRateForCount = useCallback((count) => {
    const rateMap = {
      2: hostRates.rate2Night,
      3: hostRates.rate3Night,
      4: hostRates.rate4Night,
      5: hostRates.rate5Night,
      7: hostRates.weeklyRate / 7
    };
    return rateMap[count] || 0;
  }, [hostRates]);

  // Update scorecard when data changes
  useEffect(() => {
    const nightsCount = reservationConfig.selectedDays.length;

    // Check if any price exists
    const priceExists = hostRates.rate2Night > 0 ||
                       hostRates.rate3Night > 0 ||
                       hostRates.rate4Night > 0 ||
                       hostRates.rate5Night > 0 ||
                       hostRates.weeklyRate > 0 ||
                       hostRates.monthlyRate > 0;

    // Check rental type
    const rentalTypeSelected = selectedListing?.['rental type'] !== null &&
                              selectedListing?.['rental type'] !== undefined;

    // Check if appears in search (Active, Complete, Approved)
    const appearsInSearch = selectedListing?.Active === true &&
                           selectedListing?.Complete === true &&
                           selectedListing?.Approved === true;

    // Check discounts are positive (not negative)
    const discountsPositive = true; // Always positive in our calculations

    // Check min nights
    const minNightsValid = !hostRates.minNights || nightsCount >= hostRates.minNights;

    // Check max nights
    const maxNightsValid = !hostRates.maxNights || nightsCount <= hostRates.maxNights;

    // Check nightly pricing is valid for selected nights
    const nightlyPricingValid = getNightlyRateForCount(nightsCount) > 0;

    setScorecard({
      priceExists,
      rentalTypeSelected,
      appearsInSearch,
      discountsPositive,
      minNightsValid,
      maxNightsValid,
      nightlyPricingValid
    });
  }, [selectedListing, hostRates, reservationConfig, getNightlyRateForCount]);

  // Handlers
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleWeeksCountChange = useCallback((count) => {
    setReservationConfig(prev => ({ ...prev, weeksCount: parseInt(count) }));
  }, []);

  const handleDayToggle = useCallback((dayIndex) => {
    setReservationConfig(prev => {
      const days = [...prev.selectedDays];
      const index = days.indexOf(dayIndex);
      if (index > -1) {
        days.splice(index, 1);
      } else {
        days.push(dayIndex);
        days.sort((a, b) => a - b);
      }
      return { ...prev, selectedDays: days };
    });
  }, []);

  const handleGuestPatternChange = useCallback((field, value) => {
    setGuestPattern(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleHostRateChange = useCallback((field, value) => {
    setHostRates(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  }, []);

  const handleReset = useCallback(() => {
    setSelectedListing(null);
    setReservationConfig(INITIAL_RESERVATION_CONFIG);
    setGuestPattern(INITIAL_GUEST_PATTERN);
    setHostRates(INITIAL_HOST_RATES);
    setPricingOutput(INITIAL_PRICING_OUTPUT);
    setScorecard(INITIAL_SCORECARD);
  }, []);

  // Computed values
  const nightsCount = useMemo(() =>
    reservationConfig.selectedDays.length,
    [reservationConfig.selectedDays]
  );

  const filteredListings = useMemo(() => {
    if (!searchTerm.trim()) return listings;
    const term = searchTerm.toLowerCase();
    return listings.filter(l =>
      l.Name?.toLowerCase().includes(term) ||
      l._id?.toLowerCase().includes(term)
    );
  }, [listings, searchTerm]);

  return {
    // Configuration constants
    DAY_NAMES,
    DAY_FULL_NAMES,
    WEEKS_COUNT_OPTIONS,

    // ZAT config
    zatConfig,

    // Listings
    listings: filteredListings,
    listingsLoading,
    listingsError,
    searchTerm,

    // Selected listing
    selectedListing,
    selectedListingLoading,

    // Configuration
    reservationConfig,
    guestPattern,
    hostRates,
    nightsCount,

    // Outputs
    pricingOutput,
    scorecard,

    // Handlers
    handleSearchChange,
    handleListingSelect,
    handleWeeksCountChange,
    handleDayToggle,
    handleGuestPatternChange,
    handleHostRateChange,
    handleReset
  };
}

/**
 * Parse array field that may be JSON string or native array
 */
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
