import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { logger } from '../../../../lib/logger';
import { getBoroughForZipCode } from '../../../../lib/nycZipCodes';

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
 * Fetch all lookup tables needed for resolving feature names
 */
async function fetchLookupTables() {
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
    createdAt: dbListing.bubble_created_at ? new Date(dbListing.bubble_created_at) : null,
    activeSince: dbListing.bubble_created_at ? new Date(dbListing.bubble_created_at) : null,
    updatedAt: dbListing.bubble_updated_at ? new Date(dbListing.bubble_updated_at) : null,

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
  const [counts, setCounts] = useState({ proposals: 0, virtualMeetings: 0, leases: 0, reviews: 0 });
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

      // Fetch from listing table
      const listingResult = await supabase
        .from('listing')
        .select('*')
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
      const [lookups, proposalsResult, leasesResult, meetingsResult, reviewsResult] = await Promise.all([
        fetchLookupTables(),
        supabase.from('booking_proposal').select('*', { count: 'exact', head: true }).eq('listing_id', listingId),
        supabase.from('booking_lease').select('*', { count: 'exact', head: true }).eq('listing_id', listingId),
        supabase.from('virtualmeetingschedulesandlinks').select('*', { count: 'exact', head: true }).eq('Listing', listingId),
        supabase.from('external_reviews').select('*', { count: 'exact', head: true }).eq('listing_id', listingId),
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

      const { count: proposalsCount, error: proposalsError } = proposalsResult;
      if (proposalsError) {
        logger.warn('⚠️ Failed to fetch proposals count:', proposalsError);
      }

      const { count: leasesCount, error: leasesError } = leasesResult;
      if (leasesError) {
        logger.warn('⚠️ Failed to fetch leases count:', leasesError);
      }

      const { count: meetingsCount, error: meetingsError } = meetingsResult;
      if (meetingsError) {
        logger.warn('⚠️ Failed to fetch meetings count:', meetingsError);
      }

      const { count: reviewsCount, error: reviewsError } = reviewsResult;
      if (reviewsError) {
        logger.warn('⚠️ Failed to fetch reviews count:', reviewsError);
      }

      const transformedListing = transformListingData(listingData, photos || [], lookups);

      setListing(transformedListing);
      setCounts({
        proposals: proposalsCount || 0,
        virtualMeetings: meetingsCount || 0,
        leases: leasesCount || 0,
        reviews: reviewsCount || 0,
      });

      logger.debug('✅ Listing loaded successfully');

      // Fetch existing cohost request
      try {
        const { data: cohostRequest, error: cohostError } = await supabase
          .from('co_hostrequest')
          .select('*')
          .eq('Listing', listingId)
          .order('bubble_created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cohostError) {
          logger.warn('⚠️ Failed to fetch cohost request:', cohostError);
        } else if (cohostRequest) {
          logger.debug('📋 Found existing cohost request:', cohostRequest._id);
          setExistingCohostRequest(cohostRequest);
        }
      } catch (cohostErr) {
        logger.warn('⚠️ Error fetching cohost request:', cohostErr);
      }
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
    updateListing
  };
}
