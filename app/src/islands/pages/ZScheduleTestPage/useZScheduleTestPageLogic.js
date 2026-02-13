import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { fetchZatPriceConfiguration } from '../../../lib/listingDataFetcher.js';
import { checkContiguity } from '../../shared/HostScheduleSelector/utils.js';
import { ALL_NIGHTS } from '../../shared/HostScheduleSelector/constants.js';
import { calculateCheckInCheckOut } from '../../../lib/scheduleSelector/nightCalculations.js';
import { createAllDays } from '../../../lib/scheduleSelector/dayHelpers.js';

const DEFAULT_RESERVATION_SPAN = 13;

const DAY_NAME_TO_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

const NIGHT_LABELS = ALL_NIGHTS.reduce((acc, night) => {
  acc[night.id] = night.display;
  return acc;
}, {});

const EDGE_CASE_SCENARIOS = [
  {
    id: 'normal-5-night',
    name: 'Normal 5-Night Stay (Mon-Sat)',
    dayIndices: [1, 2, 3, 4, 5, 6],
    expectedValid: true,
    expectedNights: 5
  },
  {
    id: 'wrap-around',
    name: 'Wrap-Around Weekend (Fri-Mon)',
    dayIndices: [5, 6, 0, 1],
    expectedValid: true,
    expectedNights: 3
  },
  {
    id: 'gap-selection',
    name: 'Gap Selection (Mon, Wed, Fri)',
    dayIndices: [1, 3, 5],
    expectedValid: false,
    expectedError: 'CONTIGUITY'
  },
  {
    id: 'below-min',
    name: 'Below Minimum (1 night)',
    dayIndices: [1, 2],
    expectedValid: false,
    expectedError: 'ABSOLUTE_MINIMUM'
  },
  {
    id: 'full-week',
    name: 'Full Week (7 days = 7 nights)',
    dayIndices: [0, 1, 2, 3, 4, 5, 6],
    expectedValid: true,
    expectedNights: 7  // NOT 6!
  }
];

export function useZScheduleTestPageLogic() {
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState(null);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [scheduleListing, setScheduleListing] = useState({
    daysAvailable: [0, 1, 2, 3, 4, 5, 6],
    nightsAvailable: []
  });
  const [zatConfig, setZatConfig] = useState(null);
  const [reservationSpan, setReservationSpan] = useState(DEFAULT_RESERVATION_SPAN);
  const [weekPattern, setWeekPattern] = useState('every-week');
  const [limitToFiveNights, setLimitToFiveNights] = useState(false);
  const [activeUserLabel, setActiveUserLabel] = useState('Frederick');
  const [showOptionSets, setShowOptionSets] = useState(false);

  const [hostSelectedNights, setHostSelectedNights] = useState([]);
  const [hostContiguity, setHostContiguity] = useState(true);
  const [searchSelectedDays, setSearchSelectedDays] = useState([]);
  const [listingSelectedDays, setListingSelectedDays] = useState([]);
  const [listingPriceBreakdown, setListingPriceBreakdown] = useState(null);
  const [listingScheduleState, setListingScheduleState] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);

  useEffect(() => {
    document.title = 'Schedule Test | Admin';
  }, []);

  useEffect(() => {
    loadListings();
    loadZatConfig();
  }, []);

  const searchCheckInOut = useMemo(() => {
    return calculateCheckInCheckOut(searchSelectedDays);
  }, [searchSelectedDays]);

  const formattedHostNights = useMemo(() => {
    return hostSelectedNights.map((nightId) => NIGHT_LABELS[nightId] || nightId);
  }, [hostSelectedNights]);

  async function loadListings() {
    try {
      setListingsLoading(true);
      setListingsError(null);

      const { data, error } = await supabase
        .from('listing')
        .select('id, listing_title, rental_type, weeks_offered_schedule_text')
        .eq('is_deleted', false)
        .order('listing_title', { ascending: true })
        .limit(500);

      if (error) throw error;
      setListings(data || []);
    } catch (_err) {
      setListingsError('Failed to load listings');
    } finally {
      setListingsLoading(false);
    }
  }

  async function loadZatConfig() {
    try {
      const config = await fetchZatPriceConfiguration();
      setZatConfig(config);
    } catch (_err) {
      setZatConfig(null);
    }
  }

  const handleListingChange = useCallback(async (listingId) => {
    setSelectedListingId(listingId);
    if (!listingId) {
      setSelectedListing(null);
      setScheduleListing({ daysAvailable: [0, 1, 2, 3, 4, 5, 6], nightsAvailable: [] });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('listing')
        .select(`
          id,
          listing_title,
          rental_type,
          weeks_offered_schedule_text,
          nightly_rate_for_2_night_stay,
          nightly_rate_for_3_night_stay,
          nightly_rate_for_4_night_stay,
          nightly_rate_for_5_night_stay,
          weekly_rate_paid_to_host,
          monthly_rate_paid_to_host,
          damage_deposit_amount,
          cleaning_fee_amount,
          unit_markup_percentage,
          available_nights_as_day_numbers_json,
          available_days_as_day_numbers_json,
          minimum_nights_per_stay,
          maximum_nights_per_stay,
          first_available_date,
          "Last Available",
          blocked_specific_dates_json,
          is_active,
          is_listing_profile_complete,
          is_approved
        `)
        .eq('id', listingId)
        .maybeSingle();

      if (error) throw error;

      setSelectedListing(data);
      setScheduleListing(buildScheduleListing(data));
    } catch (_err) {
      setSelectedListing(null);
      setScheduleListing({ daysAvailable: [0, 1, 2, 3, 4, 5, 6], nightsAvailable: [] });
    }
  }, []);

  const handleReservationSpanChange = useCallback((value) => {
    const parsed = parseInt(value, 10);
    setReservationSpan(Number.isNaN(parsed) ? DEFAULT_RESERVATION_SPAN : Math.max(parsed, 1));
  }, []);

  const handleWeekPatternChange = useCallback((pattern) => {
    setWeekPattern(pattern);
  }, []);

  const handleLimitToggle = useCallback(() => {
    setLimitToFiveNights((prev) => !prev);
  }, []);

  const handleUserChange = useCallback((label) => {
    setActiveUserLabel(label);
  }, []);

  const toggleOptionSets = useCallback(() => {
    setShowOptionSets((prev) => !prev);
  }, []);

  const handleHostSelectionChange = useCallback((nights) => {
    setHostSelectedNights(nights);
    const result = checkContiguity(nights);
    setHostContiguity(result.isContiguous);
  }, []);

  const handleSearchSelectionChange = useCallback((days) => {
    setSearchSelectedDays(days);
  }, []);

  const handleListingSelectionChange = useCallback((days) => {
    setListingSelectedDays(days);
  }, []);

  const handleListingPriceChange = useCallback((price) => {
    setListingPriceBreakdown(price);
  }, []);

  const handleListingScheduleChange = useCallback((state) => {
    setListingScheduleState(state);
  }, []);

  const handleLoadScenario = useCallback((scenarioId) => {
    const scenario = EDGE_CASE_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario || !scheduleListing) return;

    setSelectedScenario(scenario);

    // Convert day indices to day objects
    const allDaysArray = createAllDays(scheduleListing.daysAvailable || [0,1,2,3,4,5,6]);
    const dayObjects = scenario.dayIndices
      .map(idx => allDaysArray.find(d => d.dayOfWeek === idx))
      .filter(Boolean);

    setListingSelectedDays(dayObjects);
  }, [scheduleListing]);

  return {
    listings,
    listingsLoading,
    listingsError,
    selectedListingId,
    selectedListing,
    scheduleListing,
    zatConfig,
    reservationSpan,
    weekPattern,
    limitToFiveNights,
    activeUserLabel,
    hostSelectedNights: formattedHostNights,
    hostContiguity,
    searchSelectedDays,
    searchCheckInOut,
    listingSelectedDays,
    listingScheduleState,
    listingPriceBreakdown,
    showOptionSets,
    handleListingChange,
    handleReservationSpanChange,
    handleWeekPatternChange,
    handleLimitToggle,
    handleUserChange,
    handleHostSelectionChange,
    handleSearchSelectionChange,
    handleListingSelectionChange,
    handleListingPriceChange,
    handleListingScheduleChange,
    toggleOptionSets,
    edgeCaseScenarios: EDGE_CASE_SCENARIOS,
    selectedScenario,
    handleLoadScenario
  };
}

function convertDayNamesToNumbers(dayNames) {
  if (!dayNames || !Array.isArray(dayNames)) return [0, 1, 2, 3, 4, 5, 6];
  const numbers = dayNames.map((name) => DAY_NAME_TO_INDEX[name]).filter((num) => num !== undefined);
  return numbers.length > 0 ? numbers : [0, 1, 2, 3, 4, 5, 6];
}

function buildScheduleListing(listing) {
  if (!listing) {
    return { daysAvailable: [0, 1, 2, 3, 4, 5, 6], nightsAvailable: [] };
  }

  return {
    id: listing.id,
    name: listing.listing_title || 'Untitled',
    rentalType: listing.rental_type || 'Nightly',
    weeksOffered: listing.weeks_offered_schedule_text || 'Every week',
    unitMarkup: listing.unit_markup_percentage || 0,
    cleaningFee: listing.cleaning_fee_amount || 0,
    damageDeposit: listing.damage_deposit_amount || 0,
    weeklyHostRate: listing.weekly_rate_paid_to_host || 0,
    monthlyHostRate: listing.monthly_rate_paid_to_host || 0,
    rate2Night: listing.nightly_rate_for_2_night_stay || 0,
    rate3Night: listing.nightly_rate_for_3_night_stay || 0,
    rate4Night: listing.nightly_rate_for_4_night_stay || 0,
    rate5Night: listing.nightly_rate_for_5_night_stay || 0,
    minimumNights: listing.minimum_nights_per_stay || 0,
    maximumNights: listing.maximum_nights_per_stay || 7,
    nightsAvailable: listing.available_nights_as_day_numbers_json || [],
    daysAvailable: convertDayNamesToNumbers(listing.available_days_as_day_numbers_json)
  };
}
