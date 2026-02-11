import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import { logger } from '../../../../lib/logger';
import { getBoroughForZipCode } from '../../../../lib/nycZipCodes';

const LOOKUP_CACHE_TTL_MS = 5 * 60 * 1000;
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
 * Determine if a listing is underperforming based on age, proposal count, and clicks.
 */
export function isListingUnderperforming(listing, counts) {
  if (!listing || !counts) return false;
  const createdAt = listing.createdAt || listing.original_created_at;
  if (!createdAt) return false;
  const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays > 30 && (counts.proposals || 0) < 3 && (listing.viewCount || 0) < 20;
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
 * Fetch up to 20 comparable active listings in the same zip code.
 */
export async function fetchComparableListings(listingId, zipCode, supabaseClient) {
  if (!zipCode || !listingId) return [];
  const { data } = await supabaseClient
    .from('listing')
    .select(`
      id,
      listing_title,
      total_click_count,
      user_ids_who_favorited_json,
      monthly_rate_paid_to_host,
      weekly_rate_paid_to_host,
      bedroom_count,
      bathroom_count,
      photos_with_urls_captions_and_sort_order_json,
      in_unit_amenity_reference_ids_json,
      in_building_amenity_reference_ids_json,
      first_available_date,
      listing_description,
      original_created_at
    `)
    .neq('id', listingId)
    .eq('zip_code', zipCode)
    .eq('is_active', true)
    .order('total_click_count', { ascending: false })
    .limit(20);

  return data || [];
}

/**
 * Compare a listing against comparable listings and return actionable insights.
 */
export function analyzeListingVsComparables(listing, comparables) {
  const empty = { insights: [], comparableStats: { medianMonthlyRate: 0, avgPhotos: 0, avgClicks: 0, topAmenities: [] } };
  if (!listing || !comparables || comparables.length === 0) return empty;

  const insights = [];

  // Pricing: compare monthly rate against median
  const rates = comparables.map(c => c.monthly_rate_paid_to_host).filter(r => r > 0).sort((a, b) => a - b);
  const medianRate = rates.length > 0 ? rates[Math.floor(rates.length / 2)] : 0;
  const listingRate = listing.monthlyHostRate || 0;

  if (medianRate > 0 && listingRate > 0) {
    const priceDiff = ((listingRate - medianRate) / medianRate) * 100;
    if (priceDiff > 20) {
      insights.push({ type: 'pricing', message: `Your monthly rate ($${listingRate}) is ${Math.round(priceDiff)}% above the area median ($${medianRate})`, priority: 'high' });
    } else if (priceDiff < -30) {
      insights.push({ type: 'pricing', message: `Your monthly rate ($${listingRate}) is ${Math.round(Math.abs(priceDiff))}% below the area median ($${medianRate})`, priority: 'medium' });
    }
  }

  // Photos: compare count against average
  const photoCounts = comparables.map(c => safeParseJsonArray(c.photos_with_urls_captions_and_sort_order_json).length);
  const avgPhotos = photoCounts.length > 0 ? photoCounts.reduce((a, b) => a + b, 0) / photoCounts.length : 0;
  const listingPhotos = listing.photos?.length || 0;

  if (avgPhotos > 0 && listingPhotos < avgPhotos) {
    insights.push({ type: 'photos', message: `You have ${listingPhotos} photos. Top listings in your area average ${Math.round(avgPhotos)}`, priority: listingPhotos < avgPhotos * 0.5 ? 'high' : 'medium' });
  }

  // Description: flag short descriptions when median is long
  const descLengths = comparables.map(c => (c.listing_description || '').length).filter(l => l > 0).sort((a, b) => a - b);
  const medianDescLength = descLengths.length > 0 ? descLengths[Math.floor(descLengths.length / 2)] : 0;
  const listingDescLength = (listing.description || '').length;

  if (listingDescLength < 200 && medianDescLength > 400) {
    insights.push({ type: 'description', message: `Your description is ${listingDescLength} characters. Longer descriptions get more engagement`, priority: 'medium' });
  }

  // Amenities: find popular amenities missing from this listing
  const amenityCounts = {};
  comparables.forEach(c => {
    const ids = new Set([
      ...safeParseJsonArray(c.in_unit_amenity_reference_ids_json),
      ...safeParseJsonArray(c.in_building_amenity_reference_ids_json),
    ]);
    ids.forEach(id => { amenityCounts[id] = (amenityCounts[id] || 0) + 1; });
  });

  const listingAmenityIds = new Set([
    ...safeParseJsonArray(listing['Features - Amenities In-Unit']),
    ...safeParseJsonArray(listing['Features - Amenities In-Building']),
  ]);

  const topAmenities = Object.entries(amenityCounts)
    .map(([id, count]) => ({ name: id, percentOfListings: Math.round((count / comparables.length) * 100) }))
    .filter(a => a.percentOfListings > 50)
    .sort((a, b) => b.percentOfListings - a.percentOfListings);

  const missingPopular = topAmenities.filter(a => !listingAmenityIds.has(a.name));
  if (missingPopular.length > 0) {
    insights.push({ type: 'amenities', message: `${missingPopular.length} popular amenities in your area are missing from your listing`, priority: missingPopular.length > 3 ? 'high' : 'low' });
  }

  // Clicks: normalize by listing age, flag if bottom quartile
  const clicksPerDay = comparables.map(c => {
    const age = c.original_created_at ? (Date.now() - new Date(c.original_created_at).getTime()) / (1000 * 60 * 60 * 24) : 0;
    return age > 0 ? (c.total_click_count || 0) / age : 0;
  }).filter(c => c > 0).sort((a, b) => a - b);

  if (clicksPerDay.length >= 4) {
    const q1 = clicksPerDay[Math.floor(clicksPerDay.length * 0.25)];
    const listingAge = listing.createdAt ? (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 1;
    const listingCpd = listingAge > 0 ? (listing.viewCount || 0) / listingAge : 0;
    if (listingCpd < q1) {
      insights.push({ type: 'engagement', message: 'Your listing gets fewer daily views than 75% of comparable listings', priority: 'high' });
    }
  }

  const avgClicks = comparables.reduce((sum, c) => sum + (c.total_click_count || 0), 0) / comparables.length;

  return {
    insights,
    comparableStats: {
      medianMonthlyRate: medianRate,
      avgPhotos: Math.round(avgPhotos),
      avgClicks: Math.round(avgClicks),
      topAmenities,
    },
  };
}

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
      .from('zat_features_amenity')
      .select('_id, "Name", "Icon"');
    if (amenities) {
      amenities.forEach((a) => {
        lookups.amenities[a._id] = { name: a.Name, icon: a.Icon };
        lookups.amenities[a.Name] = { name: a.Name, icon: a.Icon };
      });
    }

    // Fetch safety features
    const { data: safety } = await supabase
      .schema('reference_table')
      .from('zat_features_safetyfeature')
      .select('_id, "Name", "Icon"');
    if (safety) {
      safety.forEach((s) => {
        lookups.safetyFeatures[s._id] = { name: s.Name, icon: s.Icon };
      });
    }

    // Fetch house rules
    const { data: rules } = await supabase
      .schema('reference_table')
      .from('zat_features_houserule')
      .select('_id, "Name", "Icon"');
    if (rules) {
      rules.forEach((r) => {
        const icon = r.Icon && r.Icon.startsWith('//') ? 'https:' + r.Icon : r.Icon;
        lookups.houseRules[r._id] = { name: r.Name, icon };
        lookups.houseRules[r.Name] = { name: r.Name, icon };
      });
    }

    // Fetch listing types
    const { data: types } = await supabase
      .schema('reference_table')
      .from('zat_features_listingtype')
      .select('_id, "Label ", "Icon"');
    if (types) {
      types.forEach((t) => {
        lookups.listingTypes[t._id] = { name: t['Label '], icon: t.Icon };
      });
    }

    // Fetch parking options
    const { data: parking } = await supabase
      .schema('reference_table')
      .from('zat_features_parkingoptions')
      .select('_id, "Label"');
    if (parking) {
      parking.forEach((p) => {
        lookups.parkingOptions[p._id] = { name: p.Label };
      });
    }

    // Fetch storage options
    const { data: storage } = await supabase
      .schema('reference_table')
      .from('zat_features_storageoptions')
      .select('_id, "Title"');
    if (storage) {
      storage.forEach((s) => {
        lookups.storageOptions[s._id] = { name: s.Title };
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
    id: photo._id,
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
    _id: listingId,

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

      // Fetch lookup tables and related data in parallel
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
          .select('"booked date", "guest name", "meeting link", "meeting declined"', { count: 'exact' })
          .eq('"Listing (for Co-Host feature)"', listingId),
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
            _id: isObjectArray ? (photo.id || `inline_${index}`) : `inline_${index}`,
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
        logger.debug('📋 Found existing cohost request:', cohostRequest._id);
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

  // Insights lazy-load cache (Phase 10 groundwork)
  const insightsRef = useRef(null);
  const fetchInsights = useCallback(async () => {
    if (insightsRef.current) return insightsRef.current;
    if (!listing) return null;
    const comparables = await fetchComparableListings(listingId, listing.location?.zipCode, supabase);
    const analysis = analyzeListingVsComparables(listing, comparables);
    insightsRef.current = analysis;
    return analysis;
  }, [listingId, listing]);

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
    fetchInsights,
  };
}
