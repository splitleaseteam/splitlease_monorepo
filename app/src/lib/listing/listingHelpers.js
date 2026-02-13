/**
 * Listing Helpers
 *
 * Utility and mapping functions for converting between form data
 * and database column formats. Includes FK ID mappers, data transformers,
 * and format detection utilities.
 */

import { logger } from '../logger.js';

/**
 * Map cancellation policy display name to its database FK ID
 * The 'Cancellation Policy' column has a foreign key constraint to reference_table.zat_features_cancellationpolicy
 *
 * @param {string|null} policyName - Human-readable policy name (e.g., 'Standard')
 * @returns {string|null} - The FK ID for the policy, or null if not found
 */
export function mapCancellationPolicyToId(policyName) {
  const policyMap = {
    'Standard': '1665431440883x653177548350901500',
    'Additional Host Restrictions': '1665431684611x656977293321267800',
    'Prior to First-Time Arrival': '1599791792265x281203802121463780',
    'After First-Time Arrival': '1599791785559x603327510287017500',
  };

  const result = !policyName ? policyMap['Standard'] : (policyMap[policyName] || policyMap['Standard']);
  logger.debug('[ListingService] Cancellation policy mapping:', { input: policyName, output: result });
  return result;
}

/**
 * Map parking type display name to its database FK ID
 * The 'Features - Parking type' column has a foreign key constraint to reference_table.zat_features_parkingoptions
 *
 * @param {string|null} parkingType - Human-readable parking type (e.g., 'Street Parking')
 * @returns {string|null} - The FK ID for the parking type, or null if not provided
 */
export function mapParkingTypeToId(parkingType) {
  const parkingMap = {
    'Street Parking': '1642428637379x970678957586007000',
    'No Parking': '1642428658755x946399373738815900',
    'Off-Street Parking': '1642428710705x523449235750343100',
    'Attached Garage': '1642428740411x489476808574605760',
    'Detached Garage': '1642428749714x405527148800546750',
    'Nearby Parking Structure': '1642428759346x972313924643388700',
  };

  if (!parkingType) return null; // Parking type is optional
  const result = parkingMap[parkingType] || null;
  logger.debug('[ListingService] Parking type mapping:', { input: parkingType, output: result });
  return result;
}

/**
 * Map listing type (Type of Space) display name to its database FK ID
 * The 'Features - Type of Space' column has a foreign key constraint to reference_table.zat_features_listingtype
 *
 * @param {string|null} spaceType - Human-readable space type (e.g., 'Private Room')
 * @returns {string|null} - The FK ID for the space type, or null if not provided
 */
export function mapSpaceTypeToId(spaceType) {
  const spaceTypeMap = {
    'Private Room': '1569530159044x216130979074711000',
    'Entire Place': '1569530331984x152755544104023800',
    'Shared Room': '1585742011301x719941865479153400',
    'All Spaces': '1588063597111x228486447854442800',
  };

  if (!spaceType) return null; // Space type is optional
  const result = spaceTypeMap[spaceType] || null;
  logger.debug('[ListingService] Space type mapping:', { input: spaceType, output: result });
  return result;
}

/**
 * Map storage option display name to its database FK ID
 * The 'Features - Secure Storage Option' column has a foreign key constraint to reference_table.zat_features_storageoptions
 *
 * @param {string|null} storageOption - Human-readable storage option (e.g., 'In the room')
 * @returns {string|null} - The FK ID for the storage option, or null if not provided
 */
export function mapStorageOptionToId(storageOption) {
  const storageMap = {
    'In the room': '1606866759190x694414586166435100',
    'In a locked closet': '1606866790336x155474305631091200',
    'In a suitcase': '1606866843299x274753427318384030',
  };

  if (!storageOption) return null; // Storage option is optional
  const result = storageMap[storageOption] || null;
  logger.debug('[ListingService] Storage option mapping:', { input: storageOption, output: result });
  return result;
}

/**
 * Map state abbreviation to full state name for FK constraint
 * The 'Location - State' column has a FK to reference_table.os_us_states.display
 * which expects full state names like "New York", not abbreviations like "NY"
 *
 * @param {string|null} stateInput - State abbreviation (e.g., 'NY') or full name
 * @returns {string|null} - Full state name for FK, or null if not provided
 */
export function mapStateToDisplayName(stateInput) {
  if (!stateInput) return null;

  // If it's already a full state name (more than 2 chars), return as-is
  if (stateInput.length > 2) {
    return stateInput;
  }

  // Map of state abbreviations to full display names
  const stateAbbreviationMap = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
  };

  const result = stateAbbreviationMap[stateInput.toUpperCase()] || stateInput;
  logger.debug('[ListingService] State mapping:', { input: stateInput, output: result });
  return result;
}

/**
 * Map SelfListingPage form data to listing table columns
 * Creates a record ready for direct insertion into the listing table
 *
 * Column Mapping Notes:
 * - form_metadata -> Handled by localStorage (not stored in DB)
 * - address_validated -> Stored in 'address_with_lat_lng_json' JSONB
 * - weekly_pattern -> Mapped to 'weeks_offered_schedule_text'
 * - subsidy_agreement -> Omitted (not in listing table)
 * - nightly_pricing -> Mapped to individual 'nightly_rate_for_X_night_stay' columns
 * - ideal_min_duration -> Mapped to 'minimum_months_per_stay'
 * - ideal_max_duration -> Mapped to 'maximum_months_per_stay'
 * - previous_reviews_link -> Mapped to 'Source Link'
 * - optional_notes -> Omitted (not in listing table)
 * - source_type -> Omitted (created_by_user_id is for user ID)
 *
 * @param {object} formData - Form data from SelfListingPage
 * @param {string|null} userId - The current user's id (for created_by_user_id)
 * @param {string} generatedId - The unique id from generate_unique_id()
 * @param {string|null} hostAccountId - The user.id (for host_user_id FK)
 * @param {string|null} boroughId - The borough FK ID (from geo lookup)
 * @param {string|null} hoodId - The hood/neighborhood FK ID (from geo lookup)
 * @returns {object} - Database-ready object for listing table
 */
export function mapFormDataToListingTable(formData, userId, generatedId, hostAccountId = null, boroughId = null, hoodId = null) {
  const now = new Date().toISOString();

  // Map available nights from object to array of day numbers (1-based for Bubble compatibility)
  const daysAvailable = formData.leaseStyles?.availableNights
    ? mapAvailableNightsToArray(formData.leaseStyles.availableNights)
    : [];

  // Map available nights to day name strings (for Nights Available column)
  const nightsAvailableNames = formData.leaseStyles?.availableNights
    ? mapAvailableNightsToNames(formData.leaseStyles.availableNights)
    : [];

  // Build the listing table record
  return {
    // Primary key - generated Bubble-compatible ID
    id: generatedId,

    // User/Host reference - host_user_id contains user.id directly
    created_by_user_id: userId || null,
    host_user_id: hostAccountId || null, // user.id
    original_created_at: now,
    original_updated_at: now,

    // Section 1: Space Snapshot
    listing_title: formData.spaceSnapshot?.listingName || null,
    // Note: Type of Space is a FK reference to reference_table.zat_features_listingtype
    space_type: mapSpaceTypeToId(formData.spaceSnapshot?.typeOfSpace),
    bedroom_count: formData.spaceSnapshot?.bedrooms || null,
    bed_count: formData.spaceSnapshot?.beds || null,
    bathroom_count: formData.spaceSnapshot?.bathrooms
      ? Number(formData.spaceSnapshot.bathrooms)
      : null,
    // Note: Kitchen Type is a string FK to reference_table.os_kitchen_type.display (no mapping needed)
    kitchen_type: formData.spaceSnapshot?.typeOfKitchen || null,
    // Note: Parking type is a FK reference to reference_table.zat_features_parkingoptions
    parking_type: mapParkingTypeToId(formData.spaceSnapshot?.typeOfParking),

    // Address (stored as JSONB with validated flag inside)
    address_with_lat_lng_json: formData.spaceSnapshot?.address
      ? {
          address: formData.spaceSnapshot.address.fullAddress,
          number: formData.spaceSnapshot.address.number,
          street: formData.spaceSnapshot.address.street,
          lat: formData.spaceSnapshot.address.latitude,
          lng: formData.spaceSnapshot.address.longitude,
          validated: formData.spaceSnapshot.address.validated || false,
        }
      : null,
    // Note: city is a FK to reference_table.zat_location.id - set to null for now
    // The city string is stored in 'address_with_lat_lng_json' JSONB field above
    city: null,
    // Note: state is a string FK to reference_table.os_us_states.display
    // Google Maps returns abbreviation (e.g., 'NY'), but FK expects full name (e.g., 'New York')
    state: mapStateToDisplayName(formData.spaceSnapshot?.address?.state),
    zip_code: formData.spaceSnapshot?.address?.zip || null,
    neighborhood_name_entered_by_host:
      formData.spaceSnapshot?.address?.neighborhood || null,
    // borough and primary_neighborhood_reference_id are FK columns populated from zip code lookup
    borough: boroughId || null,
    primary_neighborhood_reference_id: hoodId || null,

    // Section 2: Features
    in_unit_amenity_reference_ids_json: formData.features?.amenitiesInsideUnit || [],
    in_building_amenity_reference_ids_json:
      formData.features?.amenitiesOutsideUnit || [],
    listing_description: formData.features?.descriptionOfLodging || null,
    neighborhood_description_by_host:
      formData.features?.neighborhoodDescription || null,

    // Section 3: Lease Styles
    rental_type: formData.leaseStyles?.rentalType || 'Monthly',
    available_days_as_day_numbers_json: daysAvailable,
    available_nights_as_day_numbers_json: nightsAvailableNames,
    // weekly_pattern -> Mapped to 'weeks_offered_schedule_text'
    weeks_offered_schedule_text: formData.leaseStyles?.weeklyPattern || 'Every week',

    // Section 4: Pricing
    damage_deposit_amount: formData.pricing?.damageDeposit || 0,
    cleaning_fee_amount: formData.pricing?.maintenanceFee || 0,
    extra_charges: formData.pricing?.extraCharges || null,
    weekly_rate_paid_to_host: formData.pricing?.weeklyCompensation || null,
    monthly_rate_paid_to_host: formData.pricing?.monthlyCompensation || null,

    // Nightly rates from nightly_pricing.calculatedRates
    ...mapNightlyRatesToColumns(formData.pricing?.nightlyPricing),

    // Section 5: Rules
    // Note: cancellation_policy is a FK reference to reference_table.zat_features_cancellationpolicy
    cancellation_policy: mapCancellationPolicyToId(formData.rules?.cancellationPolicy),
    preferred_guest_gender: formData.rules?.preferredGender || 'No Preference',
    max_guest_count: formData.rules?.numberOfGuests || 2,
    checkin_time_of_day: formData.rules?.checkInTime || '2:00 PM',
    checkout_time_of_day: formData.rules?.checkOutTime || '11:00 AM',
    // ideal_min_duration -> Mapped to minimum_months_per_stay/weeks
    minimum_months_per_stay: formData.rules?.idealMinDuration || null,
    maximum_months_per_stay: formData.rules?.idealMaxDuration || null,
    house_rule_reference_ids_json: formData.rules?.houseRules || [],
    blocked_specific_dates_json: formData.rules?.blockedDates || [],

    // Section 6: Photos - Store with format compatible with listing display
    photos_with_urls_captions_and_sort_order_json: formData.photos?.photos?.map((p, index) => ({
      id: p.id,
      url: p.url || p.Photo,
      Photo: p.url || p.Photo,
      'Photo (thumbnail)': p['Photo (thumbnail)'] || p.url || p.Photo,
      caption: p.caption || '',
      displayOrder: p.displayOrder ?? index,
      SortOrder: p.SortOrder ?? p.displayOrder ?? index,
      toggleMainPhoto: p.toggleMainPhoto ?? (index === 0),
      storagePath: p.storagePath || null
    })) || [],

    // Section 7: Review
    safety_feature_reference_ids_json: formData.review?.safetyFeatures || [],
    square_feet: formData.review?.squareFootage || null,
    first_available_date: formData.review?.firstDayAvailable || null,
    // previous_reviews_link -> Mapped to Source Link
    'Source Link': formData.review?.previousReviewsLink || null,

    // V2 fields
    host_type: formData.hostType || null,
    market_strategy: formData.marketStrategy || 'private',

    // Status defaults for new self-listings
    is_active: false,
    is_approved: false,
    is_listing_profile_complete: formData.isSubmitted || false,

    // Required defaults for listing table
    is_trial_period_allowed: false,
    maximum_weeks_per_stay: 52,
    minimum_nights_per_stay: 1,
  };
}

/**
 * Map available nights object to array of day name strings
 * Used for 'Nights Available (List of Nights)' column
 *
 * @param {object} availableNights - {sunday: bool, monday: bool, ...}
 * @returns {string[]} - Array of day names like ["Monday", "Tuesday", ...]
 */
export function mapAvailableNightsToNames(availableNights) {
  const dayNameMapping = {
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
  };

  const result = [];
  // Maintain proper day order
  const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  for (const day of dayOrder) {
    if (availableNights[day] && dayNameMapping[day]) {
      result.push(dayNameMapping[day]);
    }
  }

  return result;
}

/**
 * Map SelfListingPage form data to listing table columns for updates
 * Similar to mapFormDataToListingTable but without generating new id
 *
 * @param {object} formData - Form data from SelfListingPage
 * @returns {object} - Database-ready object for listing table update
 */
export function mapFormDataToListingTableForUpdate(formData) {
  // Map available nights from object to array of day numbers (1-based for Bubble compatibility)
  const daysAvailable = formData.leaseStyles?.availableNights
    ? mapAvailableNightsToArray(formData.leaseStyles.availableNights)
    : undefined;

  // Map available nights to day name strings (for Nights Available column)
  const nightsAvailableNames = formData.leaseStyles?.availableNights
    ? mapAvailableNightsToNames(formData.leaseStyles.availableNights)
    : undefined;

  // Build update object - only include fields that are present in formData
  const updateData = {};

  // Section 1: Space Snapshot
  if (formData.spaceSnapshot) {
    if (formData.spaceSnapshot.listingName !== undefined) updateData.listing_title = formData.spaceSnapshot.listingName;
    if (formData.spaceSnapshot.typeOfSpace !== undefined) updateData.space_type = mapSpaceTypeToId(formData.spaceSnapshot.typeOfSpace);
    if (formData.spaceSnapshot.bedrooms !== undefined) updateData.bedroom_count = formData.spaceSnapshot.bedrooms;
    if (formData.spaceSnapshot.beds !== undefined) updateData.bed_count = formData.spaceSnapshot.beds;
    if (formData.spaceSnapshot.bathrooms !== undefined) updateData.bathroom_count = Number(formData.spaceSnapshot.bathrooms);
    if (formData.spaceSnapshot.typeOfKitchen !== undefined) updateData.kitchen_type = formData.spaceSnapshot.typeOfKitchen;
    if (formData.spaceSnapshot.typeOfParking !== undefined) updateData.parking_type = mapParkingTypeToId(formData.spaceSnapshot.typeOfParking);

    if (formData.spaceSnapshot.address) {
      updateData.address_with_lat_lng_json = {
        address: formData.spaceSnapshot.address.fullAddress,
        number: formData.spaceSnapshot.address.number,
        street: formData.spaceSnapshot.address.street,
        lat: formData.spaceSnapshot.address.latitude,
        lng: formData.spaceSnapshot.address.longitude,
        validated: formData.spaceSnapshot.address.validated || false,
      };
      // Note: city is a FK - don't update from string value
      updateData.state = mapStateToDisplayName(formData.spaceSnapshot.address.state);
      updateData.zip_code = formData.spaceSnapshot.address.zip;
      updateData.neighborhood_name_entered_by_host = formData.spaceSnapshot.address.neighborhood;
    }
  }

  // Section 2: Features
  if (formData.features) {
    if (formData.features.amenitiesInsideUnit !== undefined) updateData.in_unit_amenity_reference_ids_json = formData.features.amenitiesInsideUnit;
    if (formData.features.amenitiesOutsideUnit !== undefined) updateData.in_building_amenity_reference_ids_json = formData.features.amenitiesOutsideUnit;
    if (formData.features.descriptionOfLodging !== undefined) updateData.listing_description = formData.features.descriptionOfLodging;
    if (formData.features.neighborhoodDescription !== undefined) updateData.neighborhood_description_by_host = formData.features.neighborhoodDescription;
  }

  // Section 3: Lease Styles
  if (formData.leaseStyles) {
    if (formData.leaseStyles.rentalType !== undefined) updateData.rental_type = formData.leaseStyles.rentalType;
    if (daysAvailable !== undefined) updateData.available_days_as_day_numbers_json = daysAvailable;
    if (nightsAvailableNames !== undefined) updateData.available_nights_as_day_numbers_json = nightsAvailableNames;
    if (formData.leaseStyles.weeklyPattern !== undefined) updateData.weeks_offered_schedule_text = formData.leaseStyles.weeklyPattern;
  }

  // Section 4: Pricing
  if (formData.pricing) {
    if (formData.pricing.damageDeposit !== undefined) updateData.damage_deposit_amount = formData.pricing.damageDeposit;
    if (formData.pricing.maintenanceFee !== undefined) updateData.cleaning_fee_amount = formData.pricing.maintenanceFee;
    if (formData.pricing.extraCharges !== undefined) updateData.extra_charges = formData.pricing.extraCharges;
    if (formData.pricing.weeklyCompensation !== undefined) updateData.weekly_rate_paid_to_host = formData.pricing.weeklyCompensation;
    if (formData.pricing.monthlyCompensation !== undefined) updateData.monthly_rate_paid_to_host = formData.pricing.monthlyCompensation;
    if (formData.pricing.nightlyPricing) {
      Object.assign(updateData, mapNightlyRatesToColumns(formData.pricing.nightlyPricing));
    }
  }

  // Section 5: Rules
  if (formData.rules) {
    if (formData.rules.cancellationPolicy !== undefined) updateData.cancellation_policy = mapCancellationPolicyToId(formData.rules.cancellationPolicy);
    if (formData.rules.preferredGender !== undefined) updateData.preferred_guest_gender = formData.rules.preferredGender;
    if (formData.rules.numberOfGuests !== undefined) updateData.max_guest_count = formData.rules.numberOfGuests;
    if (formData.rules.checkInTime !== undefined) updateData.checkin_time_of_day = formData.rules.checkInTime;
    if (formData.rules.checkOutTime !== undefined) updateData.checkout_time_of_day = formData.rules.checkOutTime;
    if (formData.rules.idealMinDuration !== undefined) updateData.minimum_months_per_stay = formData.rules.idealMinDuration;
    if (formData.rules.idealMaxDuration !== undefined) updateData.maximum_months_per_stay = formData.rules.idealMaxDuration;
    if (formData.rules.houseRules !== undefined) updateData.house_rule_reference_ids_json = formData.rules.houseRules;
    if (formData.rules.blockedDates !== undefined) updateData.blocked_specific_dates_json = formData.rules.blockedDates;
  }

  // Section 6: Photos
  if (formData.photos?.photos) {
    updateData.photos_with_urls_captions_and_sort_order_json = formData.photos.photos.map((p, index) => ({
      id: p.id,
      url: p.url || p.Photo,
      Photo: p.url || p.Photo,
      'Photo (thumbnail)': p['Photo (thumbnail)'] || p.url || p.Photo,
      caption: p.caption || '',
      displayOrder: p.displayOrder ?? index,
      SortOrder: p.SortOrder ?? p.displayOrder ?? index,
      toggleMainPhoto: p.toggleMainPhoto ?? (index === 0),
      storagePath: p.storagePath || null
    }));
  }

  // Section 7: Review
  if (formData.review) {
    if (formData.review.safetyFeatures !== undefined) updateData.safety_feature_reference_ids_json = formData.review.safetyFeatures;
    if (formData.review.squareFootage !== undefined) updateData.square_feet = formData.review.squareFootage;
    if (formData.review.firstDayAvailable !== undefined) updateData.first_available_date = formData.review.firstDayAvailable;
    if (formData.review.previousReviewsLink !== undefined) updateData['Source Link'] = formData.review.previousReviewsLink;
  }

  return updateData;
}

/**
 * Check if formData uses flat database column names
 * @param {object} formData - Form data to check
 * @returns {boolean} - True if using flat DB column format
 */
export function isFlatDatabaseFormat(formData) {
  // Database column names have specific snake_case patterns
  const dbColumnPatterns = [
    'listing_title',
    'listing_description',
    'space_type',
    'bedroom_count',
    'bed_count',
    'bathroom_count',
    'kitchen_type',
    'parking_type',
    'address_with_lat_lng_json',
    'city',
    'state',
    'zip_code',
    'cancellation_policy',
    'first_available_date',
    'is_active',
    'is_approved'
  ];

  const keys = Object.keys(formData);
  return keys.some(key =>
    dbColumnPatterns.some(pattern => key === pattern)
  );
}

/**
 * Normalize database column names for update operations.
 * With the new snake_case column names, no quirky leading/trailing space
 * normalization is needed. This function now simply passes through the data.
 *
 * @param {object} formData - Form data with database column names
 * @returns {object} - Data ready for database update
 */
export function normalizeDatabaseColumns(formData) {
  // New snake_case column names are clean - no normalization needed.
  // Return a shallow copy to maintain the same contract as before.
  return { ...formData };
}

/**
 * Map available nights object to array of day numbers for database
 *
 * Day indices use JavaScript's 0-based standard (matching Date.getDay()):
 * 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
 *
 * @param {object} availableNights - {sunday: bool, monday: bool, ...}
 * @returns {number[]} - Array of 0-based day numbers (0-6)
 */
export function mapAvailableNightsToArray(availableNights) {
  const dayMapping = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const result = [];
  for (const [day, isSelected] of Object.entries(availableNights)) {
    if (isSelected && dayMapping[day] !== undefined) {
      result.push(dayMapping[day]);
    }
  }

  return result.sort((a, b) => a - b);
}

/**
 * Map nightly pricing object to individual rate columns
 * Used for search/filtering on price fields
 *
 * @param {object|null} nightlyPricing - Pricing object with calculatedRates
 * @returns {object} - Individual rate columns
 */
export function mapNightlyRatesToColumns(nightlyPricing) {
  if (!nightlyPricing?.calculatedRates) {
    return {};
  }

  const rates = nightlyPricing.calculatedRates;

  return {
    nightly_rate_for_1_night_stay: rates.night1 || null,
    nightly_rate_for_2_night_stay: rates.night2 || null,
    nightly_rate_for_3_night_stay: rates.night3 || null,
    nightly_rate_for_4_night_stay: rates.night4 || null,
    nightly_rate_for_5_night_stay: rates.night5 || null,
    nightly_rate_for_6_night_stay: rates.night6 || null,
    nightly_rate_for_7_night_stay: rates.night7 || null,
  };
}

/**
 * Map database record back to form data structure
 * Used when loading an existing listing for editing
 *
 * @param {object} dbRecord - Database record from listing table
 * @returns {object} - Form data structure for SelfListingPage
 */
export function mapDatabaseToFormData(dbRecord) {
  if (!dbRecord) return null;

  const address = dbRecord.address_with_lat_lng_json || {};
  const coordinates = dbRecord['Location - Coordinates'] || {};
  const formMetadata = dbRecord.form_metadata || {};

  return {
    id: dbRecord.id,
    spaceSnapshot: {
      listingName: dbRecord.listing_title || '',
      typeOfSpace: dbRecord.space_type || '',
      bedrooms: dbRecord.bedroom_count || 2,
      beds: dbRecord.bed_count || 2,
      bathrooms: dbRecord.bathroom_count || 2.5,
      typeOfKitchen: dbRecord.kitchen_type || '',
      typeOfParking: dbRecord.parking_type || '',
      address: {
        fullAddress: address.address || '',
        number: address.number || '',
        street: address.street || '',
        city: dbRecord.city || '',
        state: dbRecord.state || '',
        zip: dbRecord.zip_code || '',
        neighborhood: dbRecord.neighborhood_name_entered_by_host || '',
        latitude: coordinates.lat || address.lat || null,
        longitude: coordinates.lng || address.lng || null,
        validated: dbRecord.address_validated || false,
      },
    },
    features: {
      amenitiesInsideUnit: dbRecord.in_unit_amenity_reference_ids_json || [],
      amenitiesOutsideUnit: dbRecord.in_building_amenity_reference_ids_json || [],
      descriptionOfLodging: dbRecord.listing_description || '',
      neighborhoodDescription: dbRecord.neighborhood_description_by_host || '',
    },
    leaseStyles: {
      rentalType: dbRecord.rental_type || 'Monthly',
      availableNights: mapArrayToAvailableNights(
        dbRecord.available_days_as_day_numbers_json
      ),
      weeklyPattern: dbRecord.weekly_pattern || '',
      subsidyAgreement: dbRecord.subsidy_agreement || false,
    },
    pricing: {
      damageDeposit: dbRecord.damage_deposit_amount || 500,
      maintenanceFee: dbRecord.cleaning_fee_amount || 0,
      weeklyCompensation: dbRecord.weekly_rate_paid_to_host || null,
      monthlyCompensation: dbRecord.monthly_rate_paid_to_host || null,
      nightlyPricing: dbRecord.nightly_pricing || null,
    },
    rules: {
      cancellationPolicy: dbRecord.cancellation_policy || '',
      preferredGender: dbRecord.preferred_guest_gender || 'No Preference',
      numberOfGuests: dbRecord.max_guest_count || 2,
      checkInTime: dbRecord.checkin_time_of_day || '2:00 PM',
      checkOutTime: dbRecord.checkout_time_of_day || '11:00 AM',
      idealMinDuration: dbRecord.minimum_months_per_stay || 2,
      idealMaxDuration: dbRecord.maximum_months_per_stay || 6,
      houseRules: dbRecord.house_rule_reference_ids_json || [],
      blockedDates: dbRecord.blocked_specific_dates_json || [],
    },
    photos: {
      photos: (dbRecord.photos_with_urls_captions_and_sort_order_json || []).map((p, index) => ({
        id: p.id,
        url: p.url || p.Photo,
        Photo: p.Photo || p.url,
        'Photo (thumbnail)': p['Photo (thumbnail)'] || p.url || p.Photo,
        caption: p.caption || '',
        displayOrder: p.displayOrder ?? index,
        SortOrder: p.SortOrder ?? p.displayOrder ?? index,
        toggleMainPhoto: p.toggleMainPhoto ?? (index === 0),
        storagePath: p.storagePath || null
      })),
      minRequired: 3,
    },
    review: {
      safetyFeatures: dbRecord.safety_feature_reference_ids_json || [],
      squareFootage: dbRecord.square_feet || null,
      firstDayAvailable: dbRecord.first_available_date || '',
      agreedToTerms: dbRecord.agreed_to_terms || false,
      optionalNotes: dbRecord.optional_notes || '',
      previousReviewsLink: dbRecord.previous_reviews_link || '',
    },
    currentSection: formMetadata.currentSection || 1,
    completedSections: formMetadata.completedSections || [],
    isDraft: formMetadata.isDraft !== false,
    isSubmitted: formMetadata.isSubmitted || false,

    // V2 fields
    hostType: dbRecord.host_type || null,
    marketStrategy: dbRecord.market_strategy || 'private',
  };
}

/**
 * Map array of 1-based day numbers to available nights object
 *
 * @param {number[]} daysArray - Array of 1-based day numbers
 * @returns {object} - {sunday: bool, monday: bool, ...}
 */
export function mapArrayToAvailableNights(daysArray) {
  const dayMapping = {
    1: 'sunday',
    2: 'monday',
    3: 'tuesday',
    4: 'wednesday',
    5: 'thursday',
    6: 'friday',
    7: 'saturday',
  };

  const result = {
    sunday: false,
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
  };

  if (Array.isArray(daysArray)) {
    for (const dayNum of daysArray) {
      const dayName = dayMapping[dayNum];
      if (dayName) {
        result[dayName] = true;
      }
    }
  }

  return result;
}
