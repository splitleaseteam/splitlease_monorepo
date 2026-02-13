/**
 * Data Lookup Utilities
 * Provides cached lookups for neighborhoods, boroughs, and property types
 * to transform raw database IDs into human-readable names
 *
 * Usage:
 *   import { initializeLookups, getNeighborhoodName, getBoroughName } from './dataLookups.js';
 *
 *   // On app startup:
 *   await initializeLookups();
 *
 *   // In transform functions:
 *   const neighborhoodName = getNeighborhoodName(neighborhoodId); // Fast, synchronous
 */

import { supabase } from './supabase.js';
import { DATABASE } from './constants.js';
import { logger } from './logger.js';

// ============================================================================
// Cache Storage
// ============================================================================

const lookupCache = {
  neighborhoods: new Map(), // neighborhoodId -> {name, description, zips, borough}
  boroughs: new Map(),       // boroughId -> name
  propertyTypes: new Map(),  // propertyTypeId -> label
  amenities: new Map(),      // amenityId -> {name, icon, type}
  safety: new Map(),         // safetyId -> {name, icon}
  houseRules: new Map(),     // houseRuleId -> {name, icon}
  parking: new Map(),        // parkingId -> {label}
  cancellationPolicies: new Map(), // cancellationPolicyId -> {display}
  storage: new Map(),        // storageId -> {title, summaryGuest}
  guestCancellationReasons: new Map(), // reasonId -> {reason, displayOrder}
  hostCancellationReasons: new Map(),  // reasonId -> {reason, displayOrder}
  initialized: false
};

// ============================================================================
// Property Type Mappings (Static)
// ============================================================================

const PROPERTY_TYPE_MAP = {
  'Entire Place': 'Entire Place',
  'Private Room': 'Private Room',
  'Shared Room': 'Shared Room',
  'Studio': 'Studio',
  '1 Bedroom': '1 Bedroom',
  '2 Bedroom': '2 Bedroom',
  '3+ Bedroom': '3+ Bedroom'
};

// ============================================================================
// Initialization Functions
// ============================================================================

/**
 * Initialize all lookup caches by fetching data from Supabase
 * Call this once when the app starts
 * @returns {Promise<void>}
 */
export async function initializeLookups() {
  if (lookupCache.initialized) {
    return; // Already initialized
  }

  // Fetch all in parallel for performance.
  // If any lookup fails, Promise.all rejects and this function throws.
  await Promise.all([
    initializeBoroughLookups(),
    initializeNeighborhoodLookups(),
    initializePropertyTypeLookups(),
    initializeAmenityLookups(),
    initializeSafetyLookups(),
    initializeHouseRuleLookups(),
    initializeParkingLookups(),
    initializeCancellationPolicyLookups(),
    initializeStorageLookups(),
    initializeCancellationReasonLookups()
  ]);

  lookupCache.initialized = true;
  logger.debug('Data lookups initialized successfully');
}

/**
 * Fetch and cache all boroughs
 * @returns {Promise<void>}
 */
async function initializeBoroughLookups() {
  const { data, error } = await supabase
    .from(DATABASE.TABLES.BOROUGH)
    .select('id, display_borough');

  if (error) throw error;

  if (data && Array.isArray(data)) {
    data.forEach(borough => {
      const name = borough.display_borough || 'Unknown Borough';
      lookupCache.boroughs.set(borough.id, name.trim());
    });
    logger.debug(`Cached ${lookupCache.boroughs.size} boroughs`);
  }
}

/**
 * Fetch and cache all neighborhoods (lightweight — descriptions lazy-loaded)
 * Startup fetches name, zips, and borough only (~27 KB vs 166 KB with descriptions).
 * Descriptions are fetched on demand via fetchNeighborhoodDescription().
 * @returns {Promise<void>}
 */
async function initializeNeighborhoodLookups() {
  const { data, error } = await supabase
    .from(DATABASE.TABLES.NEIGHBORHOOD)
    .select('id, display, zips, geo_borough');

  if (error) throw error;

  if (data && Array.isArray(data)) {
    data.forEach(neighborhood => {
      const name = (neighborhood.display || 'Unknown Neighborhood').trim();
      lookupCache.neighborhoods.set(neighborhood.id, {
        name,
        description: null, // lazy-loaded via fetchNeighborhoodDescription()
        zips: neighborhood.zips || [],
        borough: neighborhood.geo_borough || null
      });
    });
    logger.debug(`Cached ${lookupCache.neighborhoods.size} neighborhoods (descriptions deferred)`);
  }
}

/**
 * Initialize property type lookups
 * @returns {Promise<void>}
 */
async function initializePropertyTypeLookups() {
  const { data, error } = await supabase
    .from(DATABASE.TABLES.LISTING_TYPE)
    .select('id, label')
    .limit(100);

  if (error) throw error;

  if (data && Array.isArray(data)) {
    data.forEach(type => {
      const label = type.label;
      if (label) {
        lookupCache.propertyTypes.set(type.id, label.trim());
      }
    });
    logger.debug(`Cached ${lookupCache.propertyTypes.size} property types from database`);
  }
}

/**
 * Fetch and cache all amenities
 * @returns {Promise<void>}
 */
async function initializeAmenityLookups() {
  const { data, error } = await supabase
    .from(DATABASE.TABLES.AMENITY)
    .select('id, name, icon, type_amenity_categories');

  if (error) throw error;

  if (data && Array.isArray(data)) {
    data.forEach(amenity => {
      lookupCache.amenities.set(amenity.id, {
        name: amenity.name || 'Unknown Amenity',
        icon: amenity.icon || '',
        type: amenity.type_amenity_categories || ''
      });
    });
    logger.debug(`Cached ${lookupCache.amenities.size} amenities`);
  }
}

/**
 * Fetch and cache all safety features
 * @returns {Promise<void>}
 */
async function initializeSafetyLookups() {
  const { data, error } = await supabase
    .from(DATABASE.TABLES.SAFETY)
    .select('id, name, icon');

  if (error) throw error;

  if (data && Array.isArray(data)) {
    data.forEach(safety => {
      lookupCache.safety.set(safety.id, {
        name: safety.name || 'Unknown Safety Feature',
        icon: safety.icon || ''
      });
    });
    logger.debug(`Cached ${lookupCache.safety.size} safety features`);
  }
}

/**
 * Fetch and cache all house rules
 * @returns {Promise<void>}
 */
async function initializeHouseRuleLookups() {
  const { data, error } = await supabase
    .from(DATABASE.TABLES.HOUSE_RULE)
    .select('id, name, icon');

  if (error) throw error;

  if (data && Array.isArray(data)) {
    data.forEach(rule => {
      lookupCache.houseRules.set(rule.id, {
        name: rule.name || 'Unknown Rule',
        icon: rule.icon || ''
      });
    });
    logger.debug(`Cached ${lookupCache.houseRules.size} house rules`);
  }
}

/**
 * Fetch and cache all parking options
 * @returns {Promise<void>}
 */
async function initializeParkingLookups() {
  const { data, error } = await supabase
    .from(DATABASE.TABLES.PARKING)
    .select('id, label');

  if (error) throw error;

  if (data && Array.isArray(data)) {
    data.forEach(parking => {
      lookupCache.parking.set(parking.id, {
        label: parking.label || 'Unknown Parking'
      });
    });
    logger.debug(`Cached ${lookupCache.parking.size} parking options`);
  }
}

/**
 * Fetch and cache all cancellation policies
 * @returns {Promise<void>}
 */
async function initializeCancellationPolicyLookups() {
  const { data, error } = await supabase
    .from(DATABASE.TABLES.CANCELLATION_POLICY)
    .select('id, display, best_case_text, medium_case_text, worst_case_text, summary_texts');

  if (error) throw error;

  if (data && Array.isArray(data)) {
    data.forEach(policy => {
      lookupCache.cancellationPolicies.set(policy.id, {
        display: policy.display || 'Unknown Policy',
        bestCaseText: policy.best_case_text || null,
        mediumCaseText: policy.medium_case_text || null,
        worstCaseText: policy.worst_case_text || null,
        summaryTexts: policy.summary_texts || null
      });
    });
    logger.debug(`Cached ${lookupCache.cancellationPolicies.size} cancellation policies`);
  }
}

/**
 * Fetch and cache all storage options
 * @returns {Promise<void>}
 */
async function initializeStorageLookups() {
  const { data, error } = await supabase
    .from(DATABASE.TABLES.STORAGE)
    .select('id, title, summary_guest');

  if (error) throw error;

  if (data && Array.isArray(data)) {
    data.forEach(storage => {
      lookupCache.storage.set(storage.id, {
        title: storage.title || 'Unknown Storage',
        summaryGuest: storage.summary_guest || ''
      });
    });
    logger.debug(`Cached ${lookupCache.storage.size} storage options`);
  }
}

/**
 * Fetch and cache all cancellation/rejection reasons for both guests and hosts
 * @returns {Promise<void>}
 */
async function initializeCancellationReasonLookups() {
  const { data, error } = await supabase
    .from(DATABASE.TABLES.CANCELLATION_REASON)
    .select('id, user_type, reason, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;

  if (data && Array.isArray(data)) {
    data.forEach(item => {
      const cacheData = {
        id: item.id,
        reason: item.reason,
        displayOrder: item.display_order
      };

      if (item.user_type === 'guest') {
        lookupCache.guestCancellationReasons.set(item.id, cacheData);
      } else if (item.user_type === 'host') {
        lookupCache.hostCancellationReasons.set(item.id, cacheData);
      }
    });
    logger.debug(`Cached ${lookupCache.guestCancellationReasons.size} guest cancellation reasons`);
    logger.debug(`Cached ${lookupCache.hostCancellationReasons.size} host rejection reasons`);
  }
}

// ============================================================================
// Lookup Functions (Synchronous - use cached data)
// ============================================================================

/**
 * Get neighborhood name by ID (synchronous lookup from cache)
 * @param {string} neighborhoodId - The neighborhood ID
 * @returns {string} The neighborhood name or "Unknown Neighborhood"
 */
export function getNeighborhoodName(neighborhoodId) {
  if (!neighborhoodId) return '';

  const hood = lookupCache.neighborhoods.get(neighborhoodId);
  if (hood) return hood.name;

  // Cache miss - return ID as fallback to show what's missing
  logger.warn(`Neighborhood ID not found in cache: ${neighborhoodId}`);
  return neighborhoodId; // Show ID so we can debug
}

/**
 * Get full neighborhood info by ID (name, description, zips, borough)
 * Description may be null if not yet lazy-loaded — check needsFetch.
 * @param {string} neighborhoodId - The neighborhood ID
 * @returns {{name: string, description: string|null, zips: string[], borough: string|null, needsFetch: boolean}} Neighborhood info
 */
export function getNeighborhoodInfo(neighborhoodId) {
  if (!neighborhoodId) return { name: '', description: null, zips: [], borough: null, needsFetch: true };
  const hood = lookupCache.neighborhoods.get(neighborhoodId);
  if (!hood) return { name: '', description: null, zips: [], borough: null, needsFetch: true };
  return { ...hood, needsFetch: hood.description === null };
}

/**
 * Get borough name by ID (synchronous lookup from cache)
 * @param {string} boroughId - The borough ID
 * @returns {string} The borough name or "Unknown Borough"
 */
export function getBoroughName(boroughId) {
  if (!boroughId) return '';

  const name = lookupCache.boroughs.get(boroughId);
  if (name) return name;

  // Cache miss - return ID as fallback to show what's missing
  logger.warn(`Borough ID not found in cache: ${boroughId}`);
  return boroughId; // Show ID so we can debug
}

/**
 * Get property type label by ID or type string
 * @param {string} propertyTypeId - The property type ID or string
 * @returns {string} The property type label or the original value
 */
export function getPropertyTypeLabel(propertyTypeId) {
  if (!propertyTypeId) return 'Entire Place'; // Default

  // Check cache first
  const label = lookupCache.propertyTypes.get(propertyTypeId);
  if (label) return label;

  // Check static mapping
  const staticLabel = PROPERTY_TYPE_MAP[propertyTypeId];
  if (staticLabel) return staticLabel;

  // If it's already a readable string, return it
  if (typeof propertyTypeId === 'string' && !propertyTypeId.includes('x')) {
    return propertyTypeId;
  }

  // Return original value if no mapping found
  logger.warn(`Property type not found in cache: ${propertyTypeId}`);
  return propertyTypeId;
}

/**
 * Get amenity data by ID (synchronous lookup from cache)
 * @param {string} amenityId - The amenity ID
 * @returns {object|null} The amenity data {name, icon} or null
 */
export function getAmenity(amenityId) {
  if (!amenityId) return null;

  const amenity = lookupCache.amenities.get(amenityId);
  if (!amenity) {
    logger.warn(`Amenity ID not found in cache: ${amenityId}`);
    return null;
  }

  return amenity;
}

/**
 * Get multiple amenities by ID array
 * @param {string[]} amenityIds - Array of amenity IDs
 * @returns {object[]} Array of amenity data {name, icon}
 */
export function getAmenities(amenityIds) {
  if (!Array.isArray(amenityIds)) return [];
  return amenityIds.map(id => getAmenity(id)).filter(Boolean);
}

/**
 * Get safety feature data by ID (synchronous lookup from cache)
 * @param {string} safetyId - The safety feature ID
 * @returns {object|null} The safety feature data {name, icon} or null
 */
export function getSafetyFeature(safetyId) {
  if (!safetyId) return null;

  const safety = lookupCache.safety.get(safetyId);
  if (!safety) {
    logger.warn(`Safety feature ID not found in cache: ${safetyId}`);
    return null;
  }

  return safety;
}

/**
 * Get multiple safety features by ID array
 * @param {string[]} safetyIds - Array of safety feature IDs
 * @returns {object[]} Array of safety feature data {name, icon}
 */
export function getSafetyFeatures(safetyIds) {
  if (!Array.isArray(safetyIds)) return [];
  return safetyIds.map(id => getSafetyFeature(id)).filter(Boolean);
}

/**
 * Get house rule data by ID (synchronous lookup from cache)
 * @param {string} ruleId - The house rule ID
 * @returns {object|null} The house rule data {name, icon} or null
 */
export function getHouseRule(ruleId) {
  if (!ruleId) return null;

  const rule = lookupCache.houseRules.get(ruleId);
  if (!rule) {
    logger.warn(`House rule ID not found in cache: ${ruleId}`);
    return null;
  }

  return rule;
}

/**
 * Get multiple house rules by ID array
 * @param {string[]} ruleIds - Array of house rule IDs
 * @returns {object[]} Array of house rule data {name, icon}
 */
export function getHouseRules(ruleIds) {
  if (!Array.isArray(ruleIds)) return [];
  return ruleIds.map(id => getHouseRule(id)).filter(Boolean);
}

/**
 * Get parking option data by ID (synchronous lookup from cache)
 * @param {string} parkingId - The parking option ID
 * @returns {object|null} The parking option data {label} or null
 */
export function getParkingOption(parkingId) {
  if (!parkingId) return null;

  const parking = lookupCache.parking.get(parkingId);
  if (!parking) {
    logger.warn(`Parking option ID not found in cache: ${parkingId}`);
    return null;
  }

  return parking;
}

/**
 * Get cancellation policy data by ID (synchronous lookup from cache)
 * @param {string} policyId - The cancellation policy ID
 * @returns {object|null} The cancellation policy data {display} or null
 */
export function getCancellationPolicy(policyId) {
  if (!policyId) return null;

  const policy = lookupCache.cancellationPolicies.get(policyId);
  if (!policy) {
    logger.warn(`Cancellation policy ID not found in cache: ${policyId}`);
    return null;
  }

  return policy;
}

/**
 * Get all cancellation policies from cache (for dropdown options)
 * @returns {Array<{id: string, display: string}>} Array of policy options
 */
export function getAllCancellationPolicies() {
  const policies = [];
  lookupCache.cancellationPolicies.forEach((policy, id) => {
    policies.push({ id, display: policy.display });
  });
  return policies;
}

/**
 * Get all parking options from cache (for dropdown options)
 * @returns {Array<{id: string, label: string}>} Array of parking options
 */
export function getAllParkingOptions() {
  const options = [];
  lookupCache.parking.forEach((parking, id) => {
    options.push({ id, label: parking.label });
  });
  return options;
}

/**
 * Get all neighborhoods from cache, grouped by borough name.
 * Returns an array of { id, name, borough } sorted by borough then name.
 * Useful for building deduplicated borough dropdown filters.
 * @returns {Array<{id: string, name: string, borough: string|null}>}
 */
export function getAllNeighborhoods() {
  const results = [];
  lookupCache.neighborhoods.forEach((hood, id) => {
    results.push({ id, name: hood.name, borough: hood.borough });
  });
  return results.sort((a, b) => {
    const aBoro = a.borough || '';
    const bBoro = b.borough || '';
    if (aBoro !== bBoro) return aBoro.localeCompare(bBoro);
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get storage option data by ID (synchronous lookup from cache)
 * @param {string} storageId - The storage option ID
 * @returns {object|null} The storage option data {title, summaryGuest} or null
 */
export function getStorageOption(storageId) {
  if (!storageId) return null;

  const storage = lookupCache.storage.get(storageId);
  if (!storage) {
    logger.warn(`Storage option ID not found in cache: ${storageId}`);
    return null;
  }

  return storage;
}

/**
 * Get all active guest cancellation reasons as array (for dropdown population)
 * Returns reasons sorted by display_order
 * @returns {Array<{id: number, reason: string, displayOrder: number}>} Array of reason options
 */
export function getGuestCancellationReasons() {
  const reasons = [];
  lookupCache.guestCancellationReasons.forEach((data, id) => {
    reasons.push({
      id,
      reason: data.reason,
      displayOrder: data.displayOrder
    });
  });
  return reasons.sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get all active host rejection reasons as array (for dropdown population)
 * Returns reasons sorted by display_order
 * @returns {Array<{id: number, reason: string, displayOrder: number}>} Array of reason options
 */
export function getHostRejectionReasons() {
  const reasons = [];
  lookupCache.hostCancellationReasons.forEach((data, id) => {
    reasons.push({
      id,
      reason: data.reason,
      displayOrder: data.displayOrder
    });
  });
  return reasons.sort((a, b) => a.displayOrder - b.displayOrder);
}

// ============================================================================
// Async Lookup Functions (for individual queries if needed)
// ============================================================================

/**
 * Fetch and cache a single neighborhood description on demand.
 * Returns cached description immediately if already loaded.
 * Updates the in-memory cache so subsequent calls are instant.
 * @param {string} neighborhoodId - The neighborhood ID
 * @returns {Promise<string>} The neighborhood description (empty string if none)
 */
export async function fetchNeighborhoodDescription(neighborhoodId) {
  if (!neighborhoodId) return '';

  const cached = lookupCache.neighborhoods.get(neighborhoodId);
  if (cached?.description !== null && cached?.description !== undefined) return cached.description;

  try {
    const { data, error } = await supabase
      .from(DATABASE.TABLES.NEIGHBORHOOD)
      .select('neighborhood_description')
      .eq('id', neighborhoodId)
      .single();

    if (error) throw error;

    const description = data?.neighborhood_description || '';

    // Update the existing cache entry (preserves name, zips, borough)
    if (cached) {
      cached.description = description;
    }

    return description;
  } catch (error) {
    logger.error(`Failed to fetch neighborhood description ${neighborhoodId}:`, error);
    return '';
  }
}

/**
 * Fetch neighborhood name by ID from database (async)
 * Use this only if the cache doesn't have the value
 * @param {string} neighborhoodId - The neighborhood ID
 * @returns {Promise<string>} The neighborhood name
 */
export async function fetchNeighborhoodName(neighborhoodId) {
  if (!neighborhoodId) return '';

  // Check cache first
  const cached = lookupCache.neighborhoods.get(neighborhoodId);
  if (cached) return cached.name;

  try {
    const { data, error } = await supabase
      .from(DATABASE.TABLES.NEIGHBORHOOD)
      .select('display, neighborhood_description, zips, geo_borough')
      .eq('id', neighborhoodId)
      .single();

    if (error) throw error;

    const name = data?.display || 'Unknown Neighborhood';
    // Cache the result as object
    lookupCache.neighborhoods.set(neighborhoodId, {
      name,
      description: data?.neighborhood_description || '',
      zips: data?.zips || [],
      borough: data?.geo_borough || null
    });
    return name;
  } catch (error) {
    logger.error(`Failed to fetch neighborhood ${neighborhoodId}:`, error);
    return 'Unknown Neighborhood';
  }
}

/**
 * Fetch borough name by ID from database (async)
 * Use this only if the cache doesn't have the value
 * @param {string} boroughId - The borough ID
 * @returns {Promise<string>} The borough name
 */
export async function fetchBoroughName(boroughId) {
  if (!boroughId) return '';

  // Check cache first
  const cached = lookupCache.boroughs.get(boroughId);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from(DATABASE.TABLES.BOROUGH)
      .select('display_borough')
      .eq('id', boroughId)
      .single();

    if (error) throw error;

    const name = data?.display_borough || 'Unknown Borough';
    // Cache the result
    lookupCache.boroughs.set(boroughId, name);
    return name;
  } catch (error) {
    logger.error(`Failed to fetch borough ${boroughId}:`, error);
    return 'Unknown Borough';
  }
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear all caches and re-initialize
 * @returns {Promise<void>}
 */
export async function refreshLookups() {
  lookupCache.neighborhoods.clear();
  lookupCache.boroughs.clear();
  lookupCache.propertyTypes.clear();
  lookupCache.amenities.clear();
  lookupCache.safety.clear();
  lookupCache.houseRules.clear();
  lookupCache.parking.clear();
  lookupCache.cancellationPolicies.clear();
  lookupCache.storage.clear();
  lookupCache.guestCancellationReasons.clear();
  lookupCache.hostCancellationReasons.clear();
  lookupCache.initialized = false;
  await initializeLookups();
}

/**
 * Get cache statistics for debugging
 * @returns {object} Cache statistics
 */
export function getCacheStats() {
  return {
    neighborhoods: lookupCache.neighborhoods.size,
    boroughs: lookupCache.boroughs.size,
    propertyTypes: lookupCache.propertyTypes.size,
    amenities: lookupCache.amenities.size,
    safety: lookupCache.safety.size,
    houseRules: lookupCache.houseRules.size,
    parking: lookupCache.parking.size,
    cancellationPolicies: lookupCache.cancellationPolicies.size,
    storage: lookupCache.storage.size,
    guestCancellationReasons: lookupCache.guestCancellationReasons.size,
    hostCancellationReasons: lookupCache.hostCancellationReasons.size,
    initialized: lookupCache.initialized
  };
}

/**
 * Check if lookups are initialized
 * @returns {boolean}
 */
export function isInitialized() {
  return lookupCache.initialized;
}
