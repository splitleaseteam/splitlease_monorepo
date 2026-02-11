/**
 * SearchPage Logic Hook
 *
 * Orchestrates all business logic for the SearchPage component following the
 * "Hollow Component" pattern. This hook manages React state and effects while
 * delegating all business logic to Logic Core functions.
 *
 * @intent Provide pre-calculated data and handlers to SearchPage component.
 * @pattern Logic Hook (orchestration layer between Component and Logic Core).
 *
 * Architecture:
 * - React state management (hooks, effects)
 * - Calls Logic Core functions for calculations/validation
 * - Infrastructure layer (Supabase queries, data fetching)
 * - Returns pre-processed data to component
 *
 * Component receives:
 * - Pre-calculated values (no inline calculations)
 * - Event handlers (no inline logic)
 * - Loading/error states
 * - Modal controls
 *
 * REFACTORED: Added fallback listings logic and transformListing export
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabase.js'
import {
  PRICE_TIERS,
  SORT_OPTIONS,
  WEEK_PATTERNS,
  LISTING_CONFIG
} from '../../lib/constants.js'
import {
  initializeLookups,
  getNeighborhoodName,
  getNeighborhoodInfo,
  getBoroughName,
  getPropertyTypeLabel,
  getAmenities,
  getHouseRules,
  getSafetyFeatures,
  getCancellationPolicy,
  getParkingOption,
  getStorageOption,
  isInitialized
} from '../../lib/dataLookups.js'
import { parseUrlToFilters, updateUrlParams, watchUrlChanges } from '../../lib/urlParams.js'
import {
  fetchPhotoUrls,
  fetchHostData,
  extractPhotos,
  parseAmenities,
  parseJsonArray
} from '../../lib/supabaseUtils.js'
import { sanitizeNeighborhoodSearch } from '../../lib/sanitize.js'
import { fetchInformationalTexts } from '../../lib/informationalTextsFetcher.js'
import { logger } from '../../lib/logger.js'

// Logic Core imports - direct imports from source files
import { calculateGuestFacingPrice } from '../../logic/calculators/pricing/calculateGuestFacingPrice.js';
import { formatHostName } from '../../logic/processors/display/formatHostName.js';
import { extractListingCoordinates } from '../../logic/processors/listing/extractListingCoordinates.js';
import { adaptPricingListFromSupabase } from '../../logic/processors/pricingList/adaptPricingListFromSupabase';
import { isValidPriceTier } from '../../logic/rules/search/isValidPriceTier.js';
import { isValidWeekPattern } from '../../logic/rules/search/isValidWeekPattern.js';
import { isValidSortOption } from '../../logic/rules/search/isValidSortOption.js';

/**
 * Extract unique photo IDs from an array of listings.
 * @param {Array} listings - Array of listing objects
 * @returns {Array} Array of unique photo IDs
 */
function extractPhotoIdsFromListings(listings) {
  const photoIds = new Set()
  listings.forEach((listing) => {
    const photosField = listing.photos_with_urls_captions_and_sort_order_json
    // parseJsonArray expects { field, fieldName } object, not raw value
    const parsed = parseJsonArray({ field: photosField, fieldName: 'photos_with_urls_captions_and_sort_order_json' })
    parsed.forEach((id) => photoIds.add(id))
  })
  return Array.from(photoIds)
}

/**
 * Main SearchPage logic hook.
 *
 * @returns {object} Pre-calculated state and handlers for SearchPage component.
 */
export function useSearchPageLogic() {
  // ============================================================================
  // State Management
  // ============================================================================

  // Loading & Error State
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Listings State
  const [allActiveListings, setAllActiveListings] = useState([]) // ALL active (green pins)
  const [allListings, setAllListings] = useState([]) // Filtered (purple pins)
  const [displayedListings, setDisplayedListings] = useState([]) // Lazy-loaded subset
  const [loadedCount, setLoadedCount] = useState(0)

  // ============================================================================
  // Fallback Listings State (when filters return no results)
  // MOVED FROM SearchPage.jsx - consolidated into hook
  // ============================================================================
  const [fallbackListings, setFallbackListings] = useState([])
  const [fallbackDisplayedListings, setFallbackDisplayedListings] = useState([])
  const [fallbackLoadedCount, setFallbackLoadedCount] = useState(0)
  const [isFallbackLoading, setIsFallbackLoading] = useState(false)
  const [fallbackFetchFailed, setFallbackFetchFailed] = useState(false)

  // Modal State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isAIResearchModalOpen, setIsAIResearchModalOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState(null)
  const [infoModalTriggerRef, setInfoModalTriggerRef] = useState(null)
  const [informationalTexts, setInformationalTexts] = useState({})

  // Geography State
  const [boroughs, setBoroughs] = useState([])
  const [neighborhoods, setNeighborhoods] = useState([])

  // Parse URL parameters for initial filter state
  const urlFilters = useMemo(() => parseUrlToFilters(), [])

  // Filter State (initialized from URL if available)
  const [selectedBoroughs, setSelectedBoroughs] = useState(urlFilters.selectedBoroughs)
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState(
    urlFilters.selectedNeighborhoods
  )
  const [weekPattern, setWeekPattern] = useState(urlFilters.weekPattern)
  const [priceTier, setPriceTier] = useState(urlFilters.priceTier)
  const [sortBy, setSortBy] = useState(urlFilters.sortBy)
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('')

  // UI State
  const [filterPanelActive, setFilterPanelActive] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMapVisible, setMobileMapVisible] = useState(false)

  // Listing Detail Drawer
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const [detailDrawerListing, setDetailDrawerListing] = useState(null)

  // Refs
  const mapRef = useRef(null)
  const fetchInProgressRef = useRef(false)
  const lastFetchParamsRef = useRef(null)
  const isInitialMount = useRef(true)
  const allActivePopulatedRef = useRef(false)

  // ============================================================================
  // Logic Core Integration - Filter Validation
  // ============================================================================

  /**
   * Validate filter selections using Logic Core rules.
   * Pre-calculate validation results for component display.
   */
  const filterValidation = useMemo(() => {
    return {
      isPriceTierValid: isValidPriceTier({ priceTier }),
      isWeekPatternValid: isValidWeekPattern({ weekPattern }),
      isSortOptionValid: isValidSortOption({ sortBy })
    }
  }, [priceTier, weekPattern, sortBy])

  // ============================================================================
  // Data Fetching - Infrastructure Layer
  // ============================================================================

  /**
   * Transform raw Supabase listing data to UI format.
   * Uses Logic Core processors for data transformation.
   *
   * EXPORTED: This function is now exported for use by consumers
   * that need the same transformation logic (e.g., fallback listings).
   */
  const transformListing = useCallback((dbListing, images, hostData, pricingList) => {
    // Resolve human-readable names from database IDs
    const neighborhoodName = getNeighborhoodName(dbListing.primary_neighborhood_reference_id)
    const boroughName = getBoroughName(dbListing.borough)
    const propertyType = getPropertyTypeLabel(dbListing.space_type)

    // Build location string
    const locationParts = []
    if (neighborhoodName) locationParts.push(neighborhoodName)
    if (boroughName) locationParts.push(boroughName)
    const location = locationParts.join(', ') || 'New York, NY'

    // Logic Core: Extract coordinates with priority logic
    const coordinatesResult = extractListingCoordinates({
      locationSlightlyDifferent: dbListing.map_pin_offset_address_json,
      locationAddress: dbListing.address_with_lat_lng_json,
      listingId: dbListing.id
    })

    // Helper to safely coerce to number (handles string numbers from Supabase)
    const toNumber = (val, fallback = null) => {
      if (val === null || val === undefined) return fallback
      const num = Number(val)
      return isNaN(num) ? fallback : num
    }

    const startingNightlyPrice = pricingList?.startingNightlyPrice ?? toNumber(dbListing.standardized_min_nightly_price_for_search_filter, 0)

    return {
      id: dbListing.id,
      title: dbListing.listing_title || 'Unnamed Listing',
      location: location,
      neighborhood: neighborhoodName || '',
      borough: boroughName || '',
      coordinates: coordinatesResult
        ? { lat: coordinatesResult.lat, lng: coordinatesResult.lng }
        : null,
      price: {
        starting: startingNightlyPrice,
        full: toNumber(dbListing.nightly_rate_for_7_night_stay, 0)
      },
      'Starting nightly price': startingNightlyPrice,
      'nightly_rate_for_2_night_stay': toNumber(dbListing.nightly_rate_for_2_night_stay),
      'nightly_rate_for_3_night_stay': toNumber(dbListing.nightly_rate_for_3_night_stay),
      'nightly_rate_for_4_night_stay': toNumber(dbListing.nightly_rate_for_4_night_stay),
      'nightly_rate_for_5_night_stay': toNumber(dbListing.nightly_rate_for_5_night_stay),
      'nightly_rate_for_6_night_stay': null,
      'nightly_rate_for_7_night_stay': toNumber(dbListing.nightly_rate_for_7_night_stay),
      // 7 REQUIRED FIELDS (Golden Rule B) - with numeric coercion
      'rental type': dbListing.rental_type || 'Nightly',
      rentalType: dbListing.rental_type || 'Nightly',
      'monthly_rate_paid_to_host': toNumber(dbListing.monthly_rate_paid_to_host),
      'weekly_rate_paid_to_host': toNumber(dbListing.weekly_rate_paid_to_host),
      'cleaning_fee_amount': toNumber(dbListing.cleaning_fee_amount, 0),
      'damage_deposit_amount': toNumber(dbListing.damage_deposit_amount, 0),
      'unit_markup_percentage': toNumber(dbListing.unit_markup_percentage, 0),
      'Weeks offered': dbListing.weeks_offered_schedule_text || 'Every week',
      weeksOffered: dbListing.weeks_offered_schedule_text || 'Every week',
      type: propertyType,
      squareFeet: dbListing.square_feet || null,
      maxGuests: dbListing.max_guest_count || 1,
      bedrooms: dbListing.bedroom_count || 0,
      bathrooms: dbListing.bathroom_count || 0,
      amenities: parseAmenities(dbListing),
      host: hostData || {
        name: null,
        image: null,
        verified: false
      },
      pricingList: pricingList || null,
      images: images || [],
      description: `${(dbListing.bedroom_count || 0) === 0 ? 'Studio' : `${dbListing.bedroom_count} bedroom`} • ${dbListing.bathroom_count || 0} bathroom`,
      weeks_offered: dbListing.weeks_offered_schedule_text || 'Every week',
      days_available: parseJsonArray({ field: dbListing.available_days_as_day_numbers_json, fieldName: 'Days Available' }),
      isNew: false,
      // Drawer-specific fields (fetched via SELECT * but previously discarded)
      listingDescription: dbListing.listing_description || '',
      transitTime: dbListing.commute_time_to_nearest_transit || null,
      checkInTime: dbListing.checkin_time_of_day || null,
      checkOutTime: dbListing.checkout_time_of_day || null,
      // Reference data (resolved from IDs via dataLookups cache)
      unitAmenities: getAmenities(parseJsonArray({ field: dbListing.in_unit_amenity_reference_ids_json, fieldName: 'Unit Amenities' })),
      buildingAmenities: getAmenities(parseJsonArray({ field: dbListing.in_building_amenity_reference_ids_json, fieldName: 'Building Amenities' })),
      houseRules: getHouseRules(parseJsonArray({ field: dbListing.house_rule_reference_ids_json, fieldName: 'House Rules' })),
      safetyFeatures: getSafetyFeatures(parseJsonArray({ field: dbListing.safety_feature_reference_ids_json, fieldName: 'Safety Features' })),
      cancellationPolicy: getCancellationPolicy(dbListing.cancellation_policy),
      parkingOption: getParkingOption(dbListing.parking_type),
      storageOption: getStorageOption(dbListing.secure_storage_option),
      neighborhoodReferenceId: dbListing.primary_neighborhood_reference_id || null,
      neighborhoodDescription: getNeighborhoodInfo(dbListing.primary_neighborhood_reference_id)?.description || '',
      // Stay constraints
      minWeeksPerStay: toNumber(dbListing.minimum_weeks_per_stay),
      maxWeeksPerStay: toNumber(dbListing.maximum_weeks_per_stay),
      minNightsPerStay: toNumber(dbListing.minimum_nights_per_stay),
      maxNightsPerStay: toNumber(dbListing.maximum_nights_per_stay),
      kitchenType: dbListing.kitchen_type || null,
      isTrialAllowed: dbListing.is_trial_period_allowed || false,
      firstAvailableDate: dbListing.first_available_date || null,
      favoriteCount: Array.isArray(dbListing.user_ids_who_favorited_json) ? dbListing.user_ids_who_favorited_json.length : 0,
      // Used to derive green-pin map listings without a separate query
      isActive: dbListing.is_active === true,
      isUsabilityTest: dbListing.is_usability_test_listing === true,
    }
  }, [])

  const fetchPricingListMap = useCallback(async (listings) => {
    const pricingListIds = Array.from(
      new Set(listings.map((listing) => listing.pricing_configuration_id).filter(Boolean))
    )

    if (pricingListIds.length === 0) {
      return {}
    }

    try {
      const { data, error } = await supabase
        .from('pricing_list')
        .select('*')
        .in('_id', pricingListIds)

      if (error) throw error

      const pricingListMap = {}
      ;(data || []).forEach((pricingList) => {
        pricingListMap[pricingList._id] = adaptPricingListFromSupabase(pricingList)
      })

      return pricingListMap
    } catch (error) {
      logger.warn('[SearchPage] Failed to load pricing lists:', error)
      return {}
    }
  }, [])

  /**
   * Fetch filtered listings based on current filter state.
   * Infrastructure layer - Supabase query building.
   */
  const fetchListings = useCallback(async () => {
    // Wait for boroughs to load (needed for ID lookup when filtering)
    if (boroughs.length === 0) return

    // Performance optimization: Prevent duplicate fetches
    const fetchParams = `${selectedBoroughs.join(',')}-${selectedNeighborhoods.join(',')}-${weekPattern}-${priceTier}-${sortBy}`

    if (fetchInProgressRef.current) {
      logger.debug('Skipping duplicate fetch - already in progress')
      return
    }

    if (lastFetchParamsRef.current === fetchParams) {
      logger.debug('Skipping duplicate fetch - same parameters')
      return
    }

    fetchInProgressRef.current = true
    lastFetchParamsRef.current = fetchParams

    setIsLoading(true)
    setError(null)

    try {
      // Build Supabase query
      let query = supabase
        .from('listing')
        .select('*')
        .eq('is_listing_profile_complete', true)
        .not('is_active', 'is', false)
        .eq('is_deleted', false)
        .or('address_with_lat_lng_json.not.is.null,map_pin_offset_address_json.not.is.null')

      // Apply borough filter only when boroughs are selected (empty = show all)
      if (selectedBoroughs.length > 0) {
        const selectedBoroughIds = selectedBoroughs
          .map(value => boroughs.find(b => b.value === value)?.id)
          .filter(Boolean)
        if (selectedBoroughIds.length > 0) {
          query = query.in('borough', selectedBoroughIds)
        }
      }

      // Apply week pattern filter
      if (weekPattern !== 'every-week') {
        const weekPatternText = WEEK_PATTERNS[weekPattern]
        if (weekPatternText) {
          query = query.eq('weeks_offered_schedule_text', weekPatternText)
        }
      }

      // Apply price filter
      if (priceTier !== 'all') {
        const priceRange = PRICE_TIERS[priceTier]
        if (priceRange) {
          query = query
            .gte('standardized_min_nightly_price_for_search_filter', priceRange.min)
            .lte('standardized_min_nightly_price_for_search_filter', priceRange.max)
        }
      }

      // Apply neighborhood filter
      if (selectedNeighborhoods.length > 0) {
        query = query.in('primary_neighborhood_reference_id', selectedNeighborhoods)
      }

      // Apply sorting
      const sortConfig = SORT_OPTIONS[sortBy] || SORT_OPTIONS.recommended
      query = query.order(sortConfig.field, { ascending: sortConfig.ascending })

      const { data, error } = await query

      if (error) throw error

      logger.debug('SearchPage: Supabase query returned', data.length, 'listings')

      // Batch fetch photos
      const photoIdsArray = extractPhotoIdsFromListings(data)
      const photoMap = await fetchPhotoUrls(photoIdsArray)

      // Extract photos per listing
      const resolvedPhotos = {}
      data.forEach((listing) => {
        resolvedPhotos[listing.id] = extractPhotos(
          listing.photos_with_urls_captions_and_sort_order_json,
          photoMap,
          listing.id
        )
      })

      // Batch fetch host data
      const hostIds = new Set()
      data.forEach((listing) => {
        if (listing.host_user_id) {
          hostIds.add(listing.host_user_id)
        }
      })

      const hostMap = await fetchHostData(Array.from(hostIds))

      // Map host data to listings
      const resolvedHosts = {}
      data.forEach((listing) => {
        const hostId = listing.host_user_id
        resolvedHosts[listing.id] = hostMap[hostId] || null
      })

      const pricingListMap = await fetchPricingListMap(data)

      // Transform listings using Logic Core
      const transformedListings = data.map((listing) =>
        transformListing(
          listing,
          resolvedPhotos[listing.id],
          resolvedHosts[listing.id],
          pricingListMap[listing.pricing_configuration_id] || null
        )
      )

      // Filter out listings without valid coordinates
      const listingsWithCoordinates = transformedListings.filter((listing) => {
        const hasValidCoords =
          listing.coordinates && listing.coordinates.lat && listing.coordinates.lng
        return hasValidCoords
      })

      // Filter out listings without photos
      const listingsWithPhotos = listingsWithCoordinates.filter((listing) => {
        return listing.images && listing.images.length > 0
      })

      setAllListings(listingsWithPhotos)
      setLoadedCount(0)

      // Derive green-pin map listings from first fetch (eliminates separate fetchAllActiveListings query)
      if (!allActivePopulatedRef.current) {
        const mapListings = listingsWithPhotos.filter(l => l.isActive && !l.isUsabilityTest)
        setAllActiveListings(mapListings)
        allActivePopulatedRef.current = true
        logger.debug('Derived', mapListings.length, 'active map listings from fetchListings (skipped separate query)')
      }

      logger.debug('SearchPage: State updated with', listingsWithPhotos.length, 'listings')
    } catch (err) {
      logger.error('Failed to fetch listings:', err)
      setError(
        'We had trouble loading listings. Please try refreshing the page or adjusting your filters.'
      )
    } finally {
      setIsLoading(false)
      fetchInProgressRef.current = false
    }
  }, [
    boroughs,
    selectedBoroughs,
    selectedNeighborhoods,
    weekPattern,
    priceTier,
    sortBy,
    fetchPricingListMap,
    transformListing
  ])

  // ============================================================================
  // Fallback Listings Logic (MOVED FROM SearchPage.jsx)
  // ============================================================================

  /**
   * Fetch all listings with basic constraints only (for fallback display when filtered results are empty).
   * Infrastructure layer - Supabase query with minimal filtering.
   */
  const fetchFallbackListings = useCallback(async () => {
    setIsFallbackLoading(true)

    try {
      // Build query with ONLY basic constraints - no borough, neighborhood, price, or week pattern filters
      const query = supabase
        .from('listing')
        .select('*')
        .eq('is_listing_profile_complete', true)
        .not('is_active', 'is', false)
        .or('address_with_lat_lng_json.not.is.null,map_pin_offset_address_json.not.is.null')
        .not('photos_with_urls_captions_and_sort_order_json', 'is', null)
        .order('original_updated_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      logger.debug('Fallback query returned', data.length, 'listings')

      // Collect legacy photo IDs (strings) for batch fetch
      // New format has embedded objects with URLs, no fetch needed
      const legacyPhotoIds = new Set()
      data.forEach(listing => {
        const photosField = listing.photos_with_urls_captions_and_sort_order_json
        let photos = []

        if (Array.isArray(photosField)) {
          photos = photosField
        } else if (typeof photosField === 'string') {
          try {
            photos = JSON.parse(photosField)
          } catch (_e) {
            // Legacy photo data may have invalid JSON - fall back to empty array
            photos = [];
          }
        }

        // Only collect string IDs (legacy format), not objects (new format)
        if (Array.isArray(photos)) {
          photos.forEach(photo => {
            if (typeof photo === 'string') {
              legacyPhotoIds.add(photo)
            }
          })
        }
      })

      // Only fetch from listing_photo table if there are legacy photo IDs
      const photoMap = legacyPhotoIds.size > 0
        ? await fetchPhotoUrls(Array.from(legacyPhotoIds))
        : {}

      // Extract photos per listing (handles both embedded objects and legacy IDs)
      const resolvedPhotos = {}
      data.forEach(listing => {
        resolvedPhotos[listing.id] = extractPhotos(
          listing.photos_with_urls_captions_and_sort_order_json,
          photoMap,
          listing.id
        )
      })

      // Batch fetch host data for all listings
      const hostIds = new Set()
      data.forEach(listing => {
        if (listing.host_user_id) {
          hostIds.add(listing.host_user_id)
        }
      })

      const hostMap = await fetchHostData(Array.from(hostIds))

      // Map host data to listings
      const resolvedHosts = {}
      data.forEach(listing => {
        const hostId = listing.host_user_id
        resolvedHosts[listing.id] = hostMap[hostId] || null
      })

      const pricingListMap = await fetchPricingListMap(data)

      // Transform listings
      const transformedListings = data.map(listing =>
        transformListing(
          listing,
          resolvedPhotos[listing.id],
          resolvedHosts[listing.id],
          pricingListMap[listing.pricing_configuration_id] || null
        )
      )

      // Filter out listings without valid coordinates
      const listingsWithCoordinates = transformedListings.filter(listing => {
        return listing.coordinates && listing.coordinates.lat && listing.coordinates.lng
      })

      // Filter out listings without photos
      const listingsWithPhotos = listingsWithCoordinates.filter(listing => {
        return listing.images && listing.images.length > 0
      })

      logger.debug('Fallback listings ready:', listingsWithPhotos.length)

      setFallbackListings(listingsWithPhotos)
      setFallbackLoadedCount(0)
    } catch (err) {
      logger.error('Failed to fetch fallback listings:', err)
      // Don't set error state - this is a fallback, so we just show nothing
      setFallbackListings([])
      // Mark that fetch failed to prevent infinite retry loop
      setFallbackFetchFailed(true)
    } finally {
      setIsFallbackLoading(false)
    }
  }, [fetchPricingListMap, transformListing])

  // ============================================================================
  // Effects - Data Loading
  // ============================================================================

  // Initialize data lookups on mount
  useEffect(() => {
    const init = async () => {
      if (!isInitialized()) {
        logger.debug('Initializing data lookups...')
        await initializeLookups()
      }
    }
    init()
  }, [])

  // Fetch informational texts on mount
  useEffect(() => {
    const loadInformationalTexts = async () => {
      const texts = await fetchInformationalTexts()
      setInformationalTexts(texts)
    }
    loadInformationalTexts()
  }, [])

  // Load boroughs on mount
  useEffect(() => {
    const loadBoroughs = async () => {
      try {
        const { data, error } = await supabase
          .schema('reference_table')
          .from('zat_geo_borough_toplevel')
          .select('_id, "Display Borough"')
          .order('"Display Borough"', { ascending: true })

        if (error) throw error

        const boroughList = data
          .filter((b) => b['Display Borough'] && b['Display Borough'].trim())
          .map((b) => ({
            id: b._id,
            name: b['Display Borough'].trim(),
            value: b['Display Borough']
              .trim()
              .toLowerCase()
              .replace(/\s+county\s+nj/i, '')
              .replace(/\s+/g, '-')
          }))

        setBoroughs(boroughList)

        // Validate boroughs from URL exist (remove invalid ones)
        if (selectedBoroughs.length > 0) {
          const validBoroughs = selectedBoroughs.filter(value =>
            boroughList.some(b => b.value === value)
          )
          if (validBoroughs.length !== selectedBoroughs.length) {
            logger.warn('Some boroughs from URL not found, filtering to valid ones')
            setSelectedBoroughs(validBoroughs)
          }
        }
        // Empty selectedBoroughs is valid - means "all boroughs"
      } catch (err) {
        logger.error('Failed to load boroughs:', err)
      }
    }

    loadBoroughs()
  }, [])

  // Load neighborhoods when selected boroughs change
  useEffect(() => {
    const loadNeighborhoods = async () => {
      if (boroughs.length === 0) return

      try {
        let query = supabase
          .schema('reference_table')
          .from('zat_geo_hood_mediumlevel')
          .select('_id, Display, "Geo-Borough"')
          .order('Display', { ascending: true })

        // If boroughs are selected, filter neighborhoods to those boroughs
        // If no boroughs selected (all boroughs), load all neighborhoods
        if (selectedBoroughs.length > 0) {
          const selectedBoroughIds = selectedBoroughs
            .map(value => boroughs.find(b => b.value === value)?.id)
            .filter(Boolean)
          if (selectedBoroughIds.length > 0) {
            query = query.in('"Geo-Borough"', selectedBoroughIds)
          }
        }

        const { data, error } = await query

        if (error) throw error

        const neighborhoodList = data
          .filter((n) => n.Display && n.Display.trim())
          .map((n) => ({
            id: n._id,
            name: n.Display.trim(),
            boroughId: n['Geo-Borough']
          }))

        setNeighborhoods(neighborhoodList)

        // Clear neighborhood selections that are no longer valid for the selected boroughs
        if (selectedNeighborhoods.length > 0) {
          const validNeighborhoodIds = new Set(neighborhoodList.map(n => n.id))
          const stillValidNeighborhoods = selectedNeighborhoods.filter(id => validNeighborhoodIds.has(id))
          if (stillValidNeighborhoods.length !== selectedNeighborhoods.length) {
            setSelectedNeighborhoods(stillValidNeighborhoods)
          }
        }
      } catch (err) {
        logger.error('Failed to load neighborhoods:', err)
      }
    }

    loadNeighborhoods()
  }, [selectedBoroughs, boroughs])

  // Fetch listings when filters change
  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  // Lazy load listings
  useEffect(() => {
    if (allListings.length === 0) {
      setDisplayedListings([])
      return
    }

    const initialCount = LISTING_CONFIG.INITIAL_LOAD_COUNT
    setDisplayedListings(allListings.slice(0, initialCount))
    setLoadedCount(initialCount)
  }, [allListings])

  // ============================================================================
  // Fallback Listings Effects (MOVED FROM SearchPage.jsx)
  // ============================================================================

  // Fetch fallback listings when filtered results are empty
  useEffect(() => {
    // Don't retry if fetch already failed (prevents infinite loop)
    if (!isLoading && allListings.length === 0 && fallbackListings.length === 0 && !isFallbackLoading && !fallbackFetchFailed) {
      fetchFallbackListings()
    }
  }, [isLoading, allListings.length, fallbackListings.length, isFallbackLoading, fallbackFetchFailed, fetchFallbackListings])

  // Clear fallback listings when filtered results are found
  useEffect(() => {
    if (allListings.length > 0 && fallbackListings.length > 0) {
      setFallbackListings([])
      setFallbackDisplayedListings([])
      setFallbackLoadedCount(0)
    }
  }, [allListings.length, fallbackListings.length])

  // Lazy load fallback listings
  useEffect(() => {
    if (fallbackListings.length === 0) {
      setFallbackDisplayedListings([])
      return
    }

    const initialCount = LISTING_CONFIG.INITIAL_LOAD_COUNT
    setFallbackDisplayedListings(fallbackListings.slice(0, initialCount))
    setFallbackLoadedCount(initialCount)
  }, [fallbackListings])

  // Sync filter state to URL parameters
  useEffect(() => {
    // Skip URL update on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const filters = {
      selectedBoroughs,
      weekPattern,
      priceTier,
      sortBy,
      selectedNeighborhoods
    }

    updateUrlParams(filters, false)
  }, [selectedBoroughs, weekPattern, priceTier, sortBy, selectedNeighborhoods])

  // Watch for browser back/forward navigation
  useEffect(() => {
    const cleanup = watchUrlChanges((newFilters) => {
      logger.debug('URL changed via browser navigation, updating filters:', newFilters)

      setSelectedBoroughs(newFilters.selectedBoroughs)
      setWeekPattern(newFilters.weekPattern)
      setPriceTier(newFilters.priceTier)
      setSortBy(newFilters.sortBy)
      setSelectedNeighborhoods(newFilters.selectedNeighborhoods)
    })

    return cleanup
  }, [])

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleLoadMore = useCallback(() => {
    const batchSize = LISTING_CONFIG.LOAD_BATCH_SIZE
    const nextCount = Math.min(loadedCount + batchSize, allListings.length)
    setDisplayedListings(allListings.slice(0, nextCount))
    setLoadedCount(nextCount)
  }, [loadedCount, allListings])

  // Fallback listings load more handler
  const handleFallbackLoadMore = useCallback(() => {
    const batchSize = LISTING_CONFIG.LOAD_BATCH_SIZE
    const nextCount = Math.min(fallbackLoadedCount + batchSize, fallbackListings.length)
    setFallbackDisplayedListings(fallbackListings.slice(0, nextCount))
    setFallbackLoadedCount(nextCount)
  }, [fallbackLoadedCount, fallbackListings])

  const handleResetFilters = useCallback(() => {
    setSelectedBoroughs([]) // Empty = all boroughs
    setSelectedNeighborhoods([])
    setWeekPattern('every-week')
    setPriceTier('all')
    setSortBy('recommended')
    setNeighborhoodSearch('')
  }, [])

  // Modal handlers
  const handleOpenContactModal = useCallback((listing) => {
    setSelectedListing(listing)
    setIsContactModalOpen(true)
  }, [])

  const handleCloseContactModal = useCallback(() => {
    setIsContactModalOpen(false)
    setSelectedListing(null)
  }, [])

  const handleOpenInfoModal = useCallback((listing, triggerRef) => {
    setSelectedListing(listing)
    setInfoModalTriggerRef(triggerRef)
    setIsInfoModalOpen(true)
  }, [])

  const handleCloseInfoModal = useCallback(() => {
    setIsInfoModalOpen(false)
    setSelectedListing(null)
    setInfoModalTriggerRef(null)
  }, [])

  const handleOpenAIResearchModal = useCallback(() => {
    setIsAIResearchModalOpen(true)
  }, [])

  const handleCloseAIResearchModal = useCallback(() => {
    setIsAIResearchModalOpen(false)
  }, [])

  // Drawer handlers (with history state for back-button support)
  const drawerHistoryPushedRef = useRef(false)
  const drawerCloseTimerRef = useRef(null)

  const handleOpenDetailDrawer = useCallback((listing) => {
    // Cancel any pending close timer (prevents race condition on rapid open/close)
    if (drawerCloseTimerRef.current) {
      clearTimeout(drawerCloseTimerRef.current)
      drawerCloseTimerRef.current = null
    }
    setDetailDrawerListing(listing)
    setIsDetailDrawerOpen(true)
    window.history.pushState({ drawer: true }, '')
    drawerHistoryPushedRef.current = true
  }, [])

  const handleCloseDetailDrawer = useCallback(() => {
    setIsDetailDrawerOpen(false)
    drawerCloseTimerRef.current = setTimeout(() => {
      setDetailDrawerListing(null)
      drawerCloseTimerRef.current = null
    }, 300)
    if (drawerHistoryPushedRef.current) {
      drawerHistoryPushedRef.current = false
      window.history.back()
    }
  }, [])

  // Close drawer on browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (drawerHistoryPushedRef.current) {
        drawerHistoryPushedRef.current = false
        setIsDetailDrawerOpen(false)
        drawerCloseTimerRef.current = setTimeout(() => {
          setDetailDrawerListing(null)
          drawerCloseTimerRef.current = null
        }, 300)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // ============================================================================
  // Computed Values
  // ============================================================================

  const hasMore = loadedCount < allListings.length
  const hasFallbackMore = fallbackLoadedCount < fallbackListings.length

  const filteredNeighborhoods = useMemo(() => {
    const filtered = neighborhoods.filter((n) => {
      const sanitizedSearch = sanitizeNeighborhoodSearch(neighborhoodSearch)
      return n.name.toLowerCase().includes(sanitizedSearch.toLowerCase())
    })
    return filtered
  }, [neighborhoods, neighborhoodSearch])

  // Price percentiles for "Great Price" / "Good Value" badges (drawer only)
  const pricePercentiles = useMemo(() => {
    const prices = allActiveListings
      .map(l => l.price?.starting)
      .filter(p => typeof p === 'number' && p > 0)
      .sort((a, b) => a - b)
    if (prices.length < 4) return null
    const p25 = prices[Math.floor(prices.length * 0.25)]
    const p50 = prices[Math.floor(prices.length * 0.50)]
    return { p25, p50 }
  }, [allActiveListings])

  // ============================================================================
  // Return Pre-Calculated State and Handlers
  // ============================================================================

  return {
    // Loading & Error State
    isLoading,
    error,

    // Listings Data
    allActiveListings,
    allListings,
    displayedListings,
    hasMore,

    // Fallback Listings (when filters return no results)
    fallbackListings,
    fallbackDisplayedListings,
    isFallbackLoading,
    hasFallbackMore,
    handleFallbackLoadMore,

    // Geography Data
    boroughs,
    neighborhoods: filteredNeighborhoods,

    // Filter State
    selectedBoroughs,
    selectedNeighborhoods,
    weekPattern,
    priceTier,
    sortBy,
    neighborhoodSearch,

    // Filter Validation (Logic Core)
    filterValidation,

    // UI State
    filterPanelActive,
    menuOpen,
    mobileMapVisible,

    // Modal State
    isContactModalOpen,
    isInfoModalOpen,
    isAIResearchModalOpen,
    selectedListing,
    infoModalTriggerRef,
    informationalTexts,

    // Refs
    mapRef,

    // Filter Handlers
    setSelectedBoroughs,
    setSelectedNeighborhoods,
    setWeekPattern,
    setPriceTier,
    setSortBy,
    setNeighborhoodSearch,
    handleResetFilters,

    // UI Handlers
    setFilterPanelActive,
    setMenuOpen,
    setMobileMapVisible,

    // Listing Handlers
    handleLoadMore,
    fetchListings, // For retry functionality

    // Modal Handlers
    handleOpenContactModal,
    handleCloseContactModal,
    handleOpenInfoModal,
    handleCloseInfoModal,
    handleOpenAIResearchModal,
    handleCloseAIResearchModal,

    // Drawer State & Handlers
    isDetailDrawerOpen,
    detailDrawerListing,
    handleOpenDetailDrawer,
    handleCloseDetailDrawer,

    // Price Percentiles (for drawer badges)
    pricePercentiles,

    // Utility Functions (exported for consumers)
    transformListing
  }
}
