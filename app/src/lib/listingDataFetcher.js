/**
 * Listing Data Fetcher
 * Comprehensive data fetching for view-split-lease page
 * Handles all joins, lookups, and data enrichment
 *
 * Usage:
 *   import { fetchListingComplete } from './listingDataFetcher.js';
 *   const listing = await fetchListingComplete(listingId);
 */

import { supabase } from './supabase.js';
import {
  getNeighborhoodName,
  getBoroughName,
  getPropertyTypeLabel,
  getAmenities,
  getSafetyFeatures,
  getHouseRules,
  getParkingOption,
  getCancellationPolicy,
  getStorageOption
} from './dataLookups.js';

/**
 * Parse JSONB field that may be double-encoded as JSON string
 * Handles both native arrays and JSON-stringified arrays from Supabase
 * @param {any} field - JSONB field value from Supabase
 * @returns {Array} Parsed array or empty array
 */
function parseJsonField(field) {
  // Already null/undefined
  if (!field) return [];

  // Already an array (direct JSONB array)
  if (Array.isArray(field)) return field;

  // String that needs parsing (double-encoded JSONB)
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      // Ensure result is array
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse JSONB field:', field, e);
      return [];
    }
  }

  // Unexpected type
  console.warn('Unexpected JSONB field type:', typeof field, field);
  return [];
}

/**
 * Fetch complete listing data with all enrichments
 * @param {string} listingId - The listing id
 * @returns {Promise<object>} Enriched listing object
 */
export async function fetchListingComplete(listingId) {
  try {
    // Fetch from listing table
    console.log('🔍 fetchListingComplete: Fetching listing with id=' + listingId);

    const { data: listingData, error: listingError } = await supabase
      .from('listing')
      .select(`
        id,
        listing_title,
        listing_description,
        neighborhood_description_by_host,
        bedroom_count,
        bathroom_count,
        bed_count,
        max_guest_count,
        square_feet,
        kitchen_type,
        space_type,
        in_unit_amenity_reference_ids_json,
        in_building_amenity_reference_ids_json,
        safety_feature_reference_ids_json,
        house_rule_reference_ids_json,
        parking_type,
        secure_storage_option,
        is_trial_period_allowed,
        photos_with_urls_captions_and_sort_order_json,
        address_with_lat_lng_json,
        map_pin_offset_address_json,
        city,
        state,
        zip_code,
        primary_neighborhood_reference_id,
        borough,
        neighborhood_name_entered_by_host,
        commute_time_to_nearest_transit,
        map_embed_html_for_web,
        nightly_rate_for_1_night_stay,
        nightly_rate_for_2_night_stay,
        nightly_rate_for_3_night_stay,
        nightly_rate_for_4_night_stay,
        nightly_rate_for_5_night_stay,
        nightly_rate_for_7_night_stay,
        weekly_rate_paid_to_host,
        monthly_rate_paid_to_host,
        damage_deposit_amount,
        cleaning_fee_amount,
        available_days_as_day_numbers_json,
        available_nights_as_day_numbers_json,
        unavailable_days_json,
        unavailable_nights_json,
        blocked_specific_dates_json,
        first_available_date,
        minimum_nights_per_stay,
        maximum_nights_per_stay,
        minimum_weeks_per_stay,
        maximum_weeks_per_stay,
        minimum_months_per_stay,
        maximum_months_per_stay,
        weeks_offered_schedule_text,
        rental_type,
        unit_markup_percentage,
        checkin_time_of_day,
        checkout_time_of_day,
        host_user_id,
        host_display_name,
        cancellation_policy,
        is_active,
        is_listing_profile_complete,
        is_deleted,
        preferred_guest_gender,
        allows_alternating_roommates
      `)
      .eq('id', listingId)
      .maybeSingle();

    if (listingError) throw listingError;
    if (!listingData) throw new Error('Listing not found');

    // Check if listing is soft-deleted
    if (listingData.is_deleted === true) {
      throw new Error('Listing has been deleted');
    }

    console.log('✅ Found listing:', listingData.id);

    // 2. Fetch photos - check if embedded in photos_with_urls_captions_and_sort_order_json
    let sortedPhotos = [];
    const embeddedPhotos = parseJsonField(listingData.photos_with_urls_captions_and_sort_order_json);
    console.log('📷 Raw photos_with_urls_captions_and_sort_order_json:', listingData.photos_with_urls_captions_and_sort_order_json);
    console.log('📷 Parsed embeddedPhotos:', embeddedPhotos);
    console.log('📷 embeddedPhotos.length:', embeddedPhotos.length);
    console.log('📷 embeddedPhotos[0] type:', typeof embeddedPhotos[0]);

    const hasEmbeddedObjects = embeddedPhotos.length > 0 &&
      typeof embeddedPhotos[0] === 'object' &&
      embeddedPhotos[0] !== null;

    console.log('📷 hasEmbeddedObjects:', hasEmbeddedObjects);

    if (hasEmbeddedObjects) {
      // Photos are embedded objects with URLs
      sortedPhotos = embeddedPhotos.map((photo, index) => ({
        id: photo.id || `embedded_${index}`,
        url: photo.url || '',
        toggleMainPhoto: photo.toggleMainPhoto ?? photo.isCover ?? (index === 0),
        sortOrder: photo.SortOrder ?? photo.sortOrder ?? photo.displayOrder ?? index,
        caption: photo.caption || photo.Caption || ''
      }));
      console.log('📷 Embedded photos from photos_with_urls_captions_and_sort_order_json:', sortedPhotos.length);
    } else if (embeddedPhotos.length > 0 && typeof embeddedPhotos[0] === 'string') {
      // Photos are embedded as string URLs (legacy format)
      sortedPhotos = embeddedPhotos.map((url, index) => ({
        id: `string_${index}`,
        url: url,
        toggleMainPhoto: index === 0,
        SortOrder: index,
        Caption: ''
      }));
      console.log('📷 Embedded string URLs from photos_with_urls_captions_and_sort_order_json:', sortedPhotos.length);
    } else {
      // No embedded photos found
      sortedPhotos = [];
      console.log('📷 No embedded photos found');
    }

    // Sort photos (main photo first, then by SortOrder, then by id)
    sortedPhotos = sortedPhotos.sort((a, b) => {
      if (a.toggleMainPhoto) return -1;
      if (b.toggleMainPhoto) return 1;
      if (a.SortOrder !== null && b.SortOrder === null) return -1;
      if (a.SortOrder === null && b.SortOrder !== null) return 1;
      if (a.SortOrder !== null && b.SortOrder !== null) {
        return a.SortOrder - b.SortOrder;
      }
      return (a.id || '').localeCompare(b.id || '');
    });

    // 4. Resolve geographic data
    const resolvedNeighborhood = listingData.primary_neighborhood_reference_id
      ? getNeighborhoodName(listingData.primary_neighborhood_reference_id)
      : null;

    const resolvedBorough = listingData.borough
      ? getBoroughName(listingData.borough)
      : null;

    // 5. Resolve property type
    const resolvedTypeOfSpace = listingData.space_type
      ? getPropertyTypeLabel(listingData.space_type)
      : null;

    // 6. Resolve amenities (JSONB arrays) - with double-encoding fix
    const amenitiesInUnit = listingData.in_unit_amenity_reference_ids_json
      ? getAmenities(parseJsonField(listingData.in_unit_amenity_reference_ids_json))
      : [];

    const amenitiesInBuilding = listingData.in_building_amenity_reference_ids_json
      ? getAmenities(parseJsonField(listingData.in_building_amenity_reference_ids_json))
      : [];

    const safetyFeatures = listingData.safety_feature_reference_ids_json
      ? getSafetyFeatures(parseJsonField(listingData.safety_feature_reference_ids_json))
      : [];

    const houseRules = listingData.house_rule_reference_ids_json
      ? getHouseRules(parseJsonField(listingData.house_rule_reference_ids_json))
      : [];

    // 7. Resolve parking option
    const parkingOption = listingData.parking_type
      ? getParkingOption(listingData.parking_type)
      : null;

    // 7a. Resolve cancellation policy
    const cancellationPolicy = listingData.cancellation_policy
      ? getCancellationPolicy(listingData.cancellation_policy)
      : null;

    // 7b. Resolve storage option
    const storageOption = listingData.secure_storage_option
      ? getStorageOption(listingData.secure_storage_option)
      : null;

    // 8. Fetch host data - query user table
    // listing.host_user_id now contains user.id directly (after migration)
    let hostData = null;
    if (listingData.host_user_id) {
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('id, first_name, last_name, profile_photo_url, email')
        .eq('id', listingData.host_user_id)
        .maybeSingle();

      if (userError) {
        console.error('User fetch error (by id):', userError);
      }

      if (userData) {
        hostData = {
          id: userData.id,
          userId: userData.id,  // Alias for consumers expecting userId
          first_name: userData.first_name,
          last_name: userData.last_name,
          profile_photo_url: userData.profile_photo_url,
          email: userData.email
        };
        console.log('📍 Host found via user.id lookup');
      }
    }

    // 9. Reviews
    // NOTE: reviews_json column was removed from listing table (doesn't exist in DB).
    // Review fetching is now handled separately if needed via the mainreview table.
    const reviewsData = [];

    // 10. Extract coordinates from map_pin_offset_address_json JSONB field
    // Fallback to address_with_lat_lng_json if offset is not available
    let coordinates = null;
    let locationSlightlyDifferent = listingData.map_pin_offset_address_json;
    let locationAddress = listingData.address_with_lat_lng_json;

    // Parse slightly different address if it's a string
    if (typeof locationSlightlyDifferent === 'string') {
      try {
        locationSlightlyDifferent = JSON.parse(locationSlightlyDifferent);
      } catch (error) {
        console.error('Failed to parse map_pin_offset_address_json:', error);
        locationSlightlyDifferent = null;
      }
    }

    // Parse regular address if it's a string
    if (typeof locationAddress === 'string') {
      try {
        locationAddress = JSON.parse(locationAddress);
      } catch (error) {
        console.error('Failed to parse address_with_lat_lng_json:', error);
        locationAddress = null;
      }
    }

    // Extract lat/lng - prefer slightly different address, fallback to regular address
    if (locationSlightlyDifferent?.lat && locationSlightlyDifferent?.lng) {
      coordinates = {
        lat: locationSlightlyDifferent.lat,
        lng: locationSlightlyDifferent.lng,
        address: locationSlightlyDifferent.address || null
      };
      console.log('📍 Using map_pin_offset_address_json for coordinates:', coordinates);
    } else if (locationAddress?.lat && locationAddress?.lng) {
      // Generate slightly offset coordinates from the main address
      // Offset by ~50-100 meters (approximately 0.0005 to 0.001 degrees)
      const latOffset = (Math.random() - 0.5) * 0.001;
      const lngOffset = (Math.random() - 0.5) * 0.001;

      coordinates = {
        lat: locationAddress.lat + latOffset,
        lng: locationAddress.lng + lngOffset,
        address: locationAddress.address || null,
        isGenerated: true
      };
      console.log('📍 Generated slightly different coordinates from address_with_lat_lng_json:', {
        original: { lat: locationAddress.lat, lng: locationAddress.lng },
        offset: { lat: latOffset, lng: lngOffset },
        generated: coordinates
      });
    } else {
      console.warn('⚠️ No valid coordinates found in listing data');
    }

    // 11. Return enriched listing
    return {
      ...listingData,
      photos: sortedPhotos,
      resolvedNeighborhood,
      resolvedBorough,
      resolvedTypeOfSpace,
      amenitiesInUnit,
      amenitiesInBuilding,
      safetyFeatures,
      houseRules,
      parkingOption,
      cancellationPolicy,
      storageOption,
      host: hostData,
      reviews: reviewsData,
      coordinates
    };

  } catch (error) {
    console.error('Error fetching listing data:', error);
    throw error;
  }
}

/**
 * Parse listing ID from URL
 * Supports multiple URL formats:
 * - ?id=listingId
 * - /view-split-lease/listingId
 * - /view-split-lease.html/listingId
 * - /preview-split-lease/listingId
 * - /preview-split-lease.html/listingId
 * @returns {string|null} Listing ID or null
 */
export function getListingIdFromUrl() {
  // Debug logging
  console.log('🔍 [getListingIdFromUrl] Current URL:', window.location.href);
  console.log('🔍 [getListingIdFromUrl] Pathname:', window.location.pathname);
  console.log('🔍 [getListingIdFromUrl] Search:', window.location.search);

  // 1. Check query string: ?id=listingId
  const urlParams = new URLSearchParams(window.location.search);
  const idFromQuery = urlParams.get('id');
  if (idFromQuery) {
    console.log('✅ [getListingIdFromUrl] Found ID in query string:', idFromQuery);
    return idFromQuery;
  }

  // 2. Parse pathname for segment after 'view-split-lease' or 'preview-split-lease'
  const pathSegments = window.location.pathname.split('/').filter(segment => segment);
  console.log('🔍 [getListingIdFromUrl] Path segments:', pathSegments);

  const viewSegmentIndex = pathSegments.findIndex(segment =>
    segment === 'view-split-lease' ||
    segment === 'view-split-lease.html' ||
    segment === 'view-split-lease-1' ||
    segment === 'preview-split-lease' ||
    segment === 'preview-split-lease.html'
  );
  console.log('🔍 [getListingIdFromUrl] View segment index:', viewSegmentIndex);

  if (viewSegmentIndex !== -1 && pathSegments[viewSegmentIndex + 1]) {
    const nextSegment = pathSegments[viewSegmentIndex + 1];
    console.log('🔍 [getListingIdFromUrl] Next segment after view-split-lease:', nextSegment);
    if (!nextSegment.includes('.')) {
      console.log('✅ [getListingIdFromUrl] Found ID in path:', nextSegment);
      return nextSegment;
    }
  }

  // 3. Fallback: Check if first segment matches listing ID pattern
  if (pathSegments.length > 0) {
    const firstSegment = pathSegments[0];
    if (/^\d+x\d+$/.test(firstSegment)) {
      console.log('✅ [getListingIdFromUrl] Found ID as first segment:', firstSegment);
      return firstSegment;
    }
  }

  console.error('❌ [getListingIdFromUrl] No listing ID found in URL');
  return null;
}

/**
 * Calculate standardized nightly price based on selected nights
 * @param {object} listing - Listing object with price fields
 * @param {number} nightsSelected - Number of nights selected (2-7)
 * @returns {number|null} Nightly price or null
 */
export function getNightlyPrice(listing, nightsSelected) {
  const priceMap = {
    1: listing.nightly_rate_for_1_night_stay,
    2: listing.nightly_rate_for_2_night_stay,
    3: listing.nightly_rate_for_3_night_stay,
    4: listing.nightly_rate_for_4_night_stay,
    5: listing.nightly_rate_for_5_night_stay,
    7: listing.nightly_rate_for_7_night_stay
  };

  // Return price for exact nights match
  if (priceMap[nightsSelected]) {
    return priceMap[nightsSelected];
  }

  // Fallback: use 4-night rate as default
  return priceMap[4] || null;
}

/**
 * Fetch basic listing data by ID (minimal data for quick loading)
 * @param {string} listingId - The listing id
 * @returns {Promise<object>} Basic listing object with listing_title and other essential fields
 */
export async function fetchListingBasic(listingId) {
  console.log('📊 fetchListingBasic: Starting fetch for listing ID:', listingId);
  console.log('📊 Table to query: listing');

  try {
    console.log('📊 Calling Supabase...');
    const { data: listingData, error: listingError } = await supabase
      .from('listing')
      .select('id, listing_title, listing_description, is_active, is_deleted')
      .eq('id', listingId)
      .maybeSingle();

    console.log('📊 Supabase response - data:', listingData);
    console.log('📊 Supabase response - error:', listingError);

    if (listingError) {
      console.error('❌ Supabase error details:', JSON.stringify(listingError, null, 2));
      throw listingError;
    }
    if (!listingData) {
      console.error('❌ No listing data returned');
      throw new Error('Listing not found');
    }

    // Check if listing is soft-deleted
    if (listingData.is_deleted === true) {
      throw new Error('Listing has been deleted');
    }

    console.log('✅ fetchListingBasic: Successfully fetched listing');
    console.log('✅ Listing title:', listingData.listing_title);
    return listingData;
  } catch (error) {
    console.error('❌ Error in fetchListingBasic:', error);
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Fetch ZAT price configuration (global pricing settings)
 * Cached for performance since it's a single row table
 * @returns {Promise<object>} ZAT price configuration object
 */
let zatConfigCache = null;
export async function fetchZatPriceConfiguration() {
  // Return cached version if available
  if (zatConfigCache) {
    return zatConfigCache;
  }

  try {
    const { data, error } = await supabase
      .from('zat_priceconfiguration')
      .select(`
        overall_site_markup,
        weekly_markup,
        full_time_discount,
        unused_nights_discount_multiplier,
        avg_days_per_month,
        min_price_per_night,
        max_price_per_night
      `)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('ZAT price configuration not found');

    // Cache the result
    zatConfigCache = {
      overallSiteMarkup: parseFloat(data.overall_site_markup) || 0,
      weeklyMarkup: parseFloat(data.weekly_markup) || 0,
      fullTimeDiscount: parseFloat(data.full_time_discount) || 0,
      unusedNightsDiscountMultiplier: parseFloat(data.unused_nights_discount_multiplier) || 0,
      avgDaysPerMonth: parseFloat(data.avg_days_per_month) || 30.4,
      minPricePerNight: parseFloat(data.min_price_per_night) || 0,
      maxPricePerNight: parseFloat(data.max_price_per_night) || 0
    };

    return zatConfigCache;
  } catch (error) {
    console.error('Error fetching ZAT price configuration:', error);
    // Return defaults if fetch fails
    return {
      overallSiteMarkup: 0.17,
      weeklyMarkup: 0,
      fullTimeDiscount: 0.13,
      unusedNightsDiscountMultiplier: 0.03,
      avgDaysPerMonth: 30.4,
      minPricePerNight: 100,
      maxPricePerNight: 1000
    };
  }
}
