/**
 * useListingData — The data fetching layer for Listing Dashboard
 *
 * Data Flow:
 *   Supabase → useListingData → useListingDashboardPageLogic → ListingDashboardContext → Components
 *
 * Queries (in Promise.all):
 *   1. listing — single row, 54 columns (LISTING_SELECT_COLUMNS)
 *   2. lookupTables — 6 lookup tables (cached 30 min)
 *   3. proposals — 5 most recent + total count  { count: 'exact' }
 *   4. leases — 5 most recent + total count      { count: 'exact' }
 *   5. meetings — all rows + total count          [FK: "Listing (for Co-Host feature)"]
 *   6. reviews — count only                       { head: true }
 *   7. messages — count only                      { head: true }
 *   8. cohostRequest — single or null             .maybeSingle()
 *
 * Computed Data:
 *   - calendarData: bookedDateRanges, demandDates, blockedDates, pricing
 *   - engagement: viewCount, favoritesCount (from listing transform)
 *
 * Exports:
 *   - useListingData (hook)
 *   - groupByStatus, getProposalDemandDates, getDailyPricingForCalendar (utils)
 *   - LISTING_SELECT_COLUMNS (constant)
 *
 * Field Name Map (UI → DB):
 *   listing.title           → listing_title
 *   listing.description     → listing_description
 *   listing.monthlyHostRate → monthly_rate_paid_to_host
 *   listing.weeklyHostRate  → weekly_rate_paid_to_host
 *   listing.bedrooms        → bedroom_count         (via features.bedrooms)
 *   listing.bathrooms       → bathroom_count         (via features.bathrooms)
 *   listing.zipCode         → zip_code               (via location.zipCode)
 *   listing.viewCount       → total_click_count
 *   listing.favoritesCount  → user_ids_who_favorited_json  (array length)
 *   listing.pricing[N]      → nightly_rate_for_N_night_stay (N=1-5,7; 6 uses 5-night rate)
 *   listing.blockedDates    → blocked_specific_dates_json
 *   listing.createdAt       → original_created_at
 *   listing.updatedAt       → original_updated_at
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { logger } from '../../../../lib/logger';
import { getBoroughForZipCode } from '../../../../lib/nycZipCodes';

function runWhenIdle(callback) {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(callback, { timeout: 1200 });
  }
  return window.setTimeout(callback, 120);
}

function cancelIdleRun(handle) {
  if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(handle);
    return;
  }
  clearTimeout(handle);
}

// PERF: Module-level cache shared across component instances, survives re-renders.
// Safe with React concurrent mode (not inside component scope).
// 30-min TTL — reference data changes rarely; eliminates 6 queries on repeat visits.
const LOOKUP_CACHE_TTL_MS = 30 * 60 * 1000;
let lookupCache = null;
let lookupCacheTime = 0;

/**
 * Safely parse a JSON string or return the value if already an array
 */
function safeParseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      logger.warn('Failed to parse JSON array:', e);
      return [];
    }
  }
  return [];
}

/**
 * Group proposals into simplified status buckets for dashboard display
 */
function groupByStatus(proposals) {
  if (!proposals) return { pending: 0, accepted: 0, declined: 0, expired: 0 };

  const buckets = { pending: 0, accepted: 0, declined: 0, expired: 0 };

  for (const p of proposals) {
    const status = p.proposal_workflow_status || '';
    if (status.includes('Cancelled') || status.includes('Rejected')) {
      buckets.declined++;
    } else if (status.includes('Accepted') || status.includes('Lease activated') || status.includes('Drafting Lease')) {
      buckets.accepted++;
    } else if (status.includes('Expired')) {
      buckets.expired++;
    } else {
      buckets.pending++;
    }
  }

  return buckets;
}

/**
 * Build a Map of move-in dates to demand count from recent proposals.
 * Used by calendar heatmap to show demand signals.
 */
export function getProposalDemandDates(recentProposals) {
  if (!recentProposals?.length) return new Map();
  const demandMap = new Map();
  recentProposals.forEach(proposal => {
    if (proposal.move_in_range_start_date) {
      const dateKey = proposal.move_in_range_start_date.substring(0, 10);
      demandMap.set(dateKey, (demandMap.get(dateKey) || 0) + 1);
    }
  });
  return demandMap;
}

/**
 * Derive a per-night rate for calendar price overlay.
 * Pricing model is tiered by nights-booked-per-week, not per-day-of-week.
 * Returns the base nightly rate from the min-nights tier, or derives from weekly/monthly.
 */
export function getDailyPricingForCalendar(listing) {
  if (!listing) return null;

  const minNights = listing.nightsPerWeekMin || 2;
  const baseNightlyRate = listing.pricing?.[minNights] || 0;

  if (baseNightlyRate > 0) {
    return { type: 'nightly', perNight: baseNightlyRate, tieredRates: listing.pricing };
  }

  if (listing.weeklyHostRate > 0) {
    return { type: 'weekly', perNight: Math.round(listing.weeklyHostRate / 7) };
  }

  if (listing.monthlyHostRate > 0) {
    return { type: 'monthly', perNight: Math.round(listing.monthlyHostRate / 30) };
  }

  return null;
}

/**
 * Explicit column list for listing fetch — only columns used by transformListingData().
 * Reduces payload by ~48% vs select('*') on the 99-column table.
 */
const LISTING_SELECT_COLUMNS = [
  'id', 'listing_title', 'listing_description', 'neighborhood_description_by_host',
  'address_with_lat_lng_json', 'city', 'state', 'zip_code', 'borough',
  'primary_neighborhood_reference_id', 'space_type', 'bedroom_count', 'bathroom_count',
  'bed_count', 'max_guest_count', 'square_feet', 'kitchen_type', 'parking_type',
  'secure_storage_option', 'in_unit_amenity_reference_ids_json',
  'in_building_amenity_reference_ids_json', 'safety_feature_reference_ids_json',
  'house_rule_reference_ids_json', 'photos_with_urls_captions_and_sort_order_json',
  'is_active', 'is_approved', 'is_listing_profile_complete', 'rental_type',
  'nightly_rate_for_1_night_stay', 'nightly_rate_for_2_night_stay',
  'nightly_rate_for_3_night_stay', 'nightly_rate_for_4_night_stay',
  'nightly_rate_for_5_night_stay', 'nightly_rate_for_7_night_stay',
  'weekly_rate_paid_to_host', 'monthly_rate_paid_to_host', 'cleaning_fee_amount',
  'damage_deposit_amount', 'minimum_nights_per_stay', 'maximum_nights_per_stay',
  'minimum_weeks_per_stay', 'maximum_weeks_per_stay', 'weeks_offered_schedule_text',
  'available_days_as_day_numbers_json', 'blocked_specific_dates_json',
  'first_available_date', 'checkin_time_of_day', 'checkout_time_of_day',
  'preferred_guest_gender', 'cancellation_policy', 'original_created_at',
  'original_updated_at', 'total_click_count', 'user_ids_who_favorited_json',
].join(', ');


/**
 * Fetch all lookup tables needed for resolving feature names
 */
async function fetchLookupTables() {
  const now = Date.now();
  if (lookupCache && now - lookupCacheTime < LOOKUP_CACHE_TTL_MS) {
    return lookupCache;
  }

  const lookups = {
    amenities: {},
    safetyFeatures: {},
    houseRules: {},
    listingTypes: {},
    parkingOptions: {},
    storageOptions: {},
  };

  try {
    // Fetch amenities
    const { data: amenities } = await supabase
      .schema('reference_table')
      .from('zat_features_amenity')
      .select('id, name, icon');
    if (amenities) {
      amenities.forEach((a) => {
        lookups.amenities[a.id] = { name: a.name, icon: a.icon };
        lookups.amenities[a.name] = { name: a.name, icon: a.icon };
      });
    }

    // Fetch safety features
    const { data: safety } = await supabase
      .schema('reference_table')
      .from('zat_features_safetyfeature')
      .select('id, name, icon');
    if (safety) {
      safety.forEach((s) => {
        lookups.safetyFeatures[s.id] = { name: s.name, icon: s.icon };
      });
    }

    // Fetch house rules
    const { data: rules } = await supabase
      .schema('reference_table')
      .from('zat_features_houserule')
      .select('id, name, icon');
    if (rules) {
      rules.forEach((r) => {
        const icon = r.icon && r.icon.startsWith('//') ? 'https:' + r.icon : r.icon;
        lookups.houseRules[r.id] = { name: r.name, icon };
        lookups.houseRules[r.name] = { name: r.name, icon };
      });
    }

    // Fetch listing types
    const { data: types } = await supabase
      .schema('reference_table')
      .from('zat_features_listingtype')
      .select('id, label, icon');
    if (types) {
      types.forEach((t) => {
        lookups.listingTypes[t.id] = { name: t.label, icon: t.icon };
      });
    }

    // Fetch parking options
    const { data: parking } = await supabase
      .schema('reference_table')
      .from('zat_features_parkingoptions')
      .select('id, label');
    if (parking) {
      parking.forEach((p) => {
        lookups.parkingOptions[p.id] = { name: p.label };
      });
    }

    // Fetch storage options
    const { data: storage } = await supabase
      .schema('reference_table')
      .from('zat_features_storageoptions')
      .select('id, title');
    if (storage) {
      storage.forEach((s) => {
        lookups.storageOptions[s.id] = { name: s.title };
      });
    }

    logger.debug('📚 Lookup tables loaded');
  } catch (err) {
    logger.warn('⚠️ Failed to fetch lookup tables:', err);
  }

  lookupCache = lookups;
  lookupCacheTime = Date.now();

  return lookups;
}

/**
 * Transform Supabase listing data to component-friendly format
 */
function transformListingData(dbListing, photos = [], lookups = {}) {
  if (!dbListing) return null;

  const listingId = dbListing.id;

  // Parse location address
  let locationAddress = {};
  try {
    if (typeof dbListing.address_with_lat_lng_json === 'string') {
      locationAddress = JSON.parse(dbListing.address_with_lat_lng_json);
    } else if (dbListing.address_with_lat_lng_json) {
      locationAddress = dbListing.address_with_lat_lng_json;
    }
  } catch (e) {
    logger.warn('Failed to parse location address:', e);
  }

  // Transform amenities
  const inUnitAmenities = safeParseJsonArray(dbListing.in_unit_amenity_reference_ids_json).map((id) => ({
    id: id,
    name: lookups.amenities?.[id]?.name || id,
    icon: lookups.amenities?.[id]?.icon || null,
  }));

  const buildingAmenities = safeParseJsonArray(dbListing.in_building_amenity_reference_ids_json).map((id) => ({
    id: id,
    name: lookups.amenities?.[id]?.name || id,
    icon: lookups.amenities?.[id]?.icon || null,
  }));

  const safetyFeatures = safeParseJsonArray(dbListing.safety_feature_reference_ids_json).map((id) => ({
    id: id,
    name: lookups.safetyFeatures?.[id]?.name || id,
    icon: lookups.safetyFeatures?.[id]?.icon || null,
  }));

  const houseRules = safeParseJsonArray(dbListing.house_rule_reference_ids_json).map((id) => ({
    id: id,
    name: lookups.houseRules?.[id]?.name || id,
    icon: lookups.houseRules?.[id]?.icon || null,
  }));

  // Transform photos
  const transformedPhotos = photos.map((photo, index) => ({
    id: photo.id,
    url: photo.Photo || photo.URL || '',
    isCover: photo.toggleMainPhoto || index === 0,
    photoType: photo.Type || 'Other',
  }));

  // Parse available days
  const availableDays = safeParseJsonArray(dbListing.available_days_as_day_numbers_json).map(day => {
    const numDay = typeof day === 'number' ? day : parseInt(day, 10);
    return numDay;
  });

  // Convert day indices to night IDs
  const NIGHT_IDS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const nightsAvailable = safeParseJsonArray(dbListing.available_days_as_day_numbers_json).map(day => {
    const numDay = typeof day === 'number' ? day : parseInt(day, 10);
    return NIGHT_IDS[numDay];
  }).filter(Boolean);

  return {
    id: listingId,

    // Property Info
    title: dbListing.listing_title || 'Untitled Listing',
    description: dbListing.listing_description || '',
    descriptionNeighborhood: dbListing.neighborhood_description_by_host || '',

    // Raw DB fields for compatibility (using new column names)
    Name: dbListing.listing_title || '',
    Description: dbListing.listing_description || '',
    'Description - Neighborhood': dbListing.neighborhood_description_by_host || '',
    'Location - City': dbListing.city || '',
    'Location - State': dbListing.state || '',
    'Location - Zip Code': dbListing.zip_code || '',
    'Location - Borough': dbListing.borough || '',
    'Location - Hood': dbListing.primary_neighborhood_reference_id || '',
    'Features - Type of Space': dbListing.space_type || '',
    'Features - Qty Bedrooms': dbListing.bedroom_count || 0,
    'Features - Qty Bathrooms': dbListing.bathroom_count || 0,
    'Features - Qty Beds': dbListing.bed_count || 0,
    'Features - Qty Guests': dbListing.max_guest_count || 1,
    'Features - SQFT Area': dbListing.square_feet || 0,
    'Features - SQFT of Room': dbListing.square_feet || 0,
    'Kitchen Type': dbListing.kitchen_type || '',
    'Features - Parking type': dbListing.parking_type || '',
    'Features - Secure Storage Option': dbListing.secure_storage_option || '',
    'Features - House Rules': dbListing.house_rule_reference_ids_json || [],
    'Features - Photos': dbListing.photos_with_urls_captions_and_sort_order_json || [],
    'Features - Amenities In-Unit': dbListing.in_unit_amenity_reference_ids_json || [],
    'Features - Amenities In-Building': dbListing.in_building_amenity_reference_ids_json || [],
    'Features - Safety': dbListing.safety_feature_reference_ids_json || [],
    'First Available': dbListing.first_available_date || '',
    'Minimum Nights': dbListing.minimum_nights_per_stay || 2,
    'Maximum Nights': dbListing.maximum_nights_per_stay || 7,
    'Cancellation Policy': dbListing.cancellation_policy || '',

    // Location
    location: {
      id: listingId,
      address: locationAddress.address || dbListing['Not Found - Location - Address '] || '',
      hoodsDisplay: dbListing.primary_neighborhood_reference_id || '',
      boroughDisplay: getBoroughForZipCode(dbListing.zip_code) || '',
      city: dbListing.city || '',
      state: dbListing.state || '',
      zipCode: dbListing.zip_code || '',
      latitude: locationAddress.lat || null,
      longitude: locationAddress.lng || null,
    },

    // Status
    status: dbListing.is_active ? 'Online' : 'Offline',
    displayStatus: (() => {
      if (dbListing.is_active && dbListing.is_approved) return 'online';
      if (!dbListing.is_approved && dbListing.is_listing_profile_complete) return 'review';
      if (dbListing.is_approved && !dbListing.is_active) return 'paused';
      return 'draft';
    })(),
    isOnline: dbListing.is_active || false,
    isApproved: dbListing.is_approved || false,
    isComplete: dbListing.is_listing_profile_complete || false,
    createdAt: dbListing.original_created_at ? new Date(dbListing.original_created_at) : null,
    activeSince: dbListing.original_created_at ? new Date(dbListing.original_created_at) : null,
    updatedAt: dbListing.original_updated_at ? new Date(dbListing.original_updated_at) : null,

    // Property Details
    features: {
      id: listingId,
      typeOfSpace: {
        id: dbListing.space_type,
        label: lookups.listingTypes?.[dbListing.space_type]?.name || dbListing.space_type || 'N/A',
      },
      parkingType: {
        id: dbListing.parking_type,
        label: lookups.parkingOptions?.[dbListing.parking_type]?.name || dbListing.parking_type || 'No parking',
      },
      kitchenType: {
        id: dbListing.kitchen_type,
        display: dbListing.kitchen_type || 'No kitchen',
      },
      storageType: {
        id: dbListing.secure_storage_option,
        label: lookups.storageOptions?.[dbListing.secure_storage_option]?.name || dbListing.secure_storage_option || 'No storage',
      },
      qtyGuests: dbListing.max_guest_count || 1,
      bedrooms: dbListing.bedroom_count || 0,
      bathrooms: dbListing.bathroom_count || 0,
      squareFootage: dbListing.square_feet || 0,
      squareFootageRoom: dbListing.square_feet || 0,
    },

    // Amenities
    inUnitAmenities,
    buildingAmenities,
    safetyFeatures,
    houseRules,

    // Guest Preferences
    preferredGender: {
      id: dbListing.preferred_guest_gender,
      display: dbListing.preferred_guest_gender || 'Any',
    },
    maxGuests: dbListing.max_guest_count || 2,

    // Pricing and Lease Style
    leaseStyle: dbListing.rental_type || 'Nightly',
    nightsPerWeekMin: dbListing.minimum_nights_per_stay || 2,
    nightsPerWeekMax: dbListing.maximum_nights_per_stay || 7,
    availableDays,
    nightsAvailable,

    pricing: {
      1: dbListing.nightly_rate_for_1_night_stay || 0,
      2: dbListing.nightly_rate_for_2_night_stay || 0,
      3: dbListing.nightly_rate_for_3_night_stay || 0,
      4: dbListing.nightly_rate_for_4_night_stay || 0,
      5: dbListing.nightly_rate_for_5_night_stay || 0,
      6: dbListing.nightly_rate_for_5_night_stay || 0,
      7: dbListing.nightly_rate_for_7_night_stay || 0,
    },

    weeklyCompensation: {
      1: (dbListing.nightly_rate_for_1_night_stay || 0) * 1,
      2: (dbListing.nightly_rate_for_2_night_stay || 0) * 2,
      3: (dbListing.nightly_rate_for_3_night_stay || 0) * 3,
      4: (dbListing.nightly_rate_for_4_night_stay || 0) * 4,
      5: (dbListing.nightly_rate_for_5_night_stay || 0) * 5,
      6: (dbListing.nightly_rate_for_5_night_stay || 0) * 6,
      7: (dbListing.nightly_rate_for_7_night_stay || 0) * 7,
    },

    damageDeposit: dbListing.damage_deposit_amount || 0,
    maintenanceFee: dbListing.cleaning_fee_amount || 0,
    monthlyHostRate: dbListing.monthly_rate_paid_to_host || 0,
    weeklyHostRate: dbListing.weekly_rate_paid_to_host || 0,
    weeksOffered: dbListing.weeks_offered_schedule_text || '',

    // Availability
    leaseTermMin: dbListing.minimum_weeks_per_stay || 6,
    leaseTermMax: dbListing.maximum_weeks_per_stay || 52,
    earliestAvailableDate: dbListing.first_available_date ? new Date(dbListing.first_available_date) : new Date(),
    checkInTime: dbListing.checkin_time_of_day || '1:00 pm',
    checkOutTime: dbListing.checkout_time_of_day || '1:00 pm',
    blockedDates: safeParseJsonArray(dbListing.blocked_specific_dates_json).map(dateStr => {
      if (typeof dateStr === 'string') {
        return dateStr.split('T')[0];
      }
      return dateStr;
    }),

    // Cancellation Policy
    cancellationPolicy: dbListing.cancellation_policy || 'Standard',
    cancellationPolicyAdditionalRestrictions: '',

    // Photos
    photos: transformedPhotos,

    // Engagement Metrics
    viewCount: dbListing.total_click_count || 0,
    favoritesCount: safeParseJsonArray(dbListing.user_ids_who_favorited_json).length,

    // Virtual Tour
    virtualTourUrl: null,
  };
}

/**
 * Hook for fetching and managing listing data
 * Handles data fetching, transformation, and related counts (proposals, meetings, etc.)
 */
export function useListingData(listingId) {
  const [listing, setListing] = useState(null);
  const [counts, setCounts] = useState({
    proposals: 0, virtualMeetings: 0, leases: 0, reviews: 0, messages: 0,
    proposalsByStatus: { pending: 0, accepted: 0, declined: 0, expired: 0 },
    recentProposals: [],
    activeLeases: [],
    totalRevenue: 0,
    nextMeeting: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingCohostRequest, setExistingCohostRequest] = useState(null);
  const [calendarData, setCalendarData] = useState(null);

  const fetchListing = useCallback(async (silent = false) => {
    if (!listingId) {
      logger.error('❌ No listing ID provided to useListingData');
      setError('No listing ID provided. Please access this page from your listings.');
      setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      logger.debug('🔍 Fetching listing:', listingId);

      // Fetch from listing table (explicit columns — see LISTING_SELECT_COLUMNS)
      const listingResult = await supabase
        .from('listing')
        .select(LISTING_SELECT_COLUMNS)
        .eq('id', listingId)
        .maybeSingle();

      if (listingResult.error) {
        throw new Error(`Failed to fetch listing: ${listingResult.error.message}`);
      }

      const listingData = listingResult.data;

      if (!listingData) {
        throw new Error('Listing not found');
      }

      logger.debug('✅ Found listing:', listingData.id);

      // PERF: 7 queries in parallel — all use listingId from URL (no data dependency on listing row).
      // Listing query runs first as a sequential gate (must exist before fetching related data).
      // Lookups are cached 30 min, so on repeat visits this slot resolves instantly.
      const [lookups, proposalsResult, leasesResult, meetingsResult, reviewsResult, messagesResult, cohostResult] = await Promise.all([
        fetchLookupTables(),
        // 12A: Enriched proposal query — recent proposals with key fields
        supabase.from('booking_proposal')
          .select('id, proposal_workflow_status, guest_user_id, move_in_range_start_date, four_week_rent_amount, original_created_at, guest_introduction_message', { count: 'exact' })
          .eq('listing_id', listingId)
          .order('original_created_at', { ascending: false })
          .limit(5),
        // 12B: Enriched lease query — lease summaries with progress fields
        supabase.from('booking_lease')
          .select('id, is_lease_signed, reservation_start_date, reservation_end_date, current_week_number, total_week_count, total_host_compensation_amount, agreement_number', { count: 'exact' })
          .eq('listing_id', listingId)
          .order('reservation_start_date', { ascending: false })
          .limit(5),
        // 12C: Meeting query — fixed FK from 'Listing' to 'Listing (for Co-Host feature)'
        supabase.from('virtualmeetingschedulesandlinks')
          .select('booked_date, guest_name, meeting_link, meeting_declined', { count: 'exact' })
          .eq('listing_for_co_host_feature', listingId),
        supabase.from('external_reviews').select('*', { count: 'exact', head: true }).eq('listing_id', listingId),
        // 12D: Message thread count (NEW — dashboard previously had no message query)
        supabase.from('message_thread').select('*', { count: 'exact', head: true }).eq('listing_id', listingId),
        // 12E: Co-host request moved into Promise.all (was sequential)
        supabase.from('co_hostrequest')
          .select('*')
          .eq('Listing', listingId)
          .order('original_created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      // Extract photos from embedded JSONB column
      let photos = [];
      const inlinePhotos = safeParseJsonArray(listingData.photos_with_urls_captions_and_sort_order_json);

      if (inlinePhotos.length > 0) {
        const firstItem = inlinePhotos[0];
        const isObjectArray = typeof firstItem === 'object' && firstItem !== null;

        photos = inlinePhotos.map((photo, index) => {
          const photoUrl = isObjectArray
            ? (photo.url || photo.Photo || photo.URL || String(photo))
            : String(photo);

          return {
            id: isObjectArray ? (photo.id || `inline_${index}`) : `inline_${index}`,
            Photo: photoUrl,
            URL: photoUrl,
            toggleMainPhoto: isObjectArray ? (photo.toggleMainPhoto ?? photo.isCover ?? (index === 0)) : (index === 0),
            Type: isObjectArray ? (photo.type || photo.Type || 'Other') : 'Other',
            SortOrder: isObjectArray ? (photo.SortOrder ?? photo.sortOrder ?? photo.sort_order ?? index) : index,
            Active: true,
          };
        });
        logger.debug('Embedded photos from listing JSONB column:', photos.length);
      } else {
        logger.debug('No photos found in listing JSONB column');
      }

      // 12A: Destructure enriched proposal data
      const { data: recentProposals, count: proposalsCount, error: proposalsError } = proposalsResult;
      if (proposalsError) {
        logger.warn('⚠️ Failed to fetch proposals:', proposalsError);
      }

      // 12B: Destructure enriched lease data
      const { data: leaseRows, count: leasesCount, error: leasesError } = leasesResult;
      if (leasesError) {
        logger.warn('⚠️ Failed to fetch leases:', leasesError);
      }

      // 12C: Destructure meeting data (FK bug fixed above)
      const { data: meetingsData, count: meetingsCount, error: meetingsError } = meetingsResult;
      if (meetingsError) {
        logger.warn('⚠️ Failed to fetch meetings:', meetingsError);
      }

      const { count: reviewsCount, error: reviewsError } = reviewsResult;
      if (reviewsError) {
        logger.warn('⚠️ Failed to fetch reviews count:', reviewsError);
      }

      // 12D: Destructure message count
      const { count: messagesCount, error: messagesError } = messagesResult;
      if (messagesError) {
        logger.warn('⚠️ Failed to fetch messages count:', messagesError);
      }

      // 12E: Destructure co-host request (moved from sequential fetch)
      const { data: cohostRequest, error: cohostError } = cohostResult;
      if (cohostError) {
        logger.warn('⚠️ Failed to fetch cohost request:', cohostError);
      } else if (cohostRequest) {
        logger.debug('📋 Found existing cohost request:', cohostRequest.id);
        setExistingCohostRequest(cohostRequest);
      }

      // Build next meeting from meeting data (handles sparse booked date / guest name)
      const nextMeeting = meetingsData?.find(m => m['booked date'] && !m['meeting declined']);
      const nextMeetingFormatted = nextMeeting ? {
        date: nextMeeting['booked date'],
        guestName: nextMeeting['guest name'] || 'Guest',
        meetingLink: nextMeeting['meeting link'] || null,
      } : null;

      const transformedListing = transformListingData(listingData, photos || [], lookups);

      setListing(transformedListing);
      setCounts({
        proposals: proposalsCount || 0,
        proposalsByStatus: groupByStatus(recentProposals),
        recentProposals: recentProposals || [],
        virtualMeetings: meetingsCount || 0,
        nextMeeting: nextMeetingFormatted,
        leases: leasesCount || 0,
        activeLeases: leaseRows?.filter(l => l.is_lease_signed) || [],
        totalRevenue: leaseRows?.reduce((sum, l) => sum + (l.total_host_compensation_amount || 0), 0) || 0,
        reviews: reviewsCount || 0,
        messages: messagesCount || 0,
      });

      logger.debug('✅ Listing loaded successfully');
    } catch (err) {
      logger.error('❌ Error fetching listing:', err);
      if (!silent) {
        setError(err.message || 'Failed to load listing');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [listingId]);

  // Update listing function
  const updateListing = useCallback(async (updates) => {
    logger.debug('📝 Updating listing:', listingId, updates);

    const fieldMapping = {
      'First Available': 'first_available_date',
    };

    const dbUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      const dbColumnName = fieldMapping[key] || key;
      dbUpdates[dbColumnName] = value;
    }

    logger.debug(`📋 Updating listing table with id=${listingId}`);
    logger.debug('📋 DB updates:', dbUpdates);

    const { error: updateError } = await supabase
      .from('listing')
      .update(dbUpdates)
      .eq('id', listingId);

    if (updateError) {
      logger.error('❌ Error updating listing:', updateError);
      logger.error('❌ Full error:', JSON.stringify(updateError, null, 2));
      throw updateError;
    }

    const { data, error: fetchError } = await supabase
      .from('listing')
      .select('*')
      .eq('id', listingId)
      .maybeSingle();

    if (fetchError) {
      logger.warn('⚠️ Update succeeded but failed to fetch updated data:', fetchError);
      return { id: listingId, ...dbUpdates };
    }

    logger.debug('✅ Listing updated:', data);
    return data;
  }, [listingId]);

  const buildCalendarData = useCallback(() => ({
    bookedDateRanges: (counts.activeLeases || [])
      .filter((lease) => lease.reservation_start_date && lease.reservation_end_date)
      .map((lease) => ({
        start: lease.reservation_start_date.substring(0, 10),
        end: lease.reservation_end_date.substring(0, 10),
        leaseId: lease.id,
        agreementNumber: lease.agreement_number || `Lease ${lease.id.substring(0, 8)}`,
        isSigned: lease.is_lease_signed,
      })),
    demandDates: getProposalDemandDates(counts.recentProposals),
    blockedDates: listing?.blockedDates || [],
    pricing: getDailyPricingForCalendar(listing),
  }), [counts.activeLeases, counts.recentProposals, listing]);

  const ensureCalendarData = useCallback(() => {
    const data = buildCalendarData();
    setCalendarData(data);
    return data;
  }, [buildCalendarData]);

  useEffect(() => {
    if (!listing) {
      setCalendarData(null);
      return undefined;
    }

    const idleHandle = runWhenIdle(() => {
      setCalendarData(buildCalendarData());
    });

    return () => cancelIdleRun(idleHandle);
  }, [listing, counts.activeLeases, counts.recentProposals, buildCalendarData]);

  // Initialize on mount
  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  return {
    listing,
    setListing,
    counts,
    isLoading,
    error,
    existingCohostRequest,
    setExistingCohostRequest,
    fetchListing,
    updateListing,
    calendarData,
    ensureCalendarData,
  };
}
