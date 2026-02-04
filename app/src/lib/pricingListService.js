/**
 * Pricing List Service
 *
 * Frontend service for interacting with the pricing-list Edge Function.
 * Used to create, fetch, and update pricing_list records.
 *
 * @module lib/pricingListService
 */

/**
 * Get the Edge Function URL for the pricing-list function.
 * @returns {string} The full URL for the Edge Function.
 */
function getEdgeFunctionUrl() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL environment variable is not set');
  }
  return `${supabaseUrl}/functions/v1/pricing-list`;
}

/**
 * Create or update pricing_list for a listing.
 *
 * Call this after pricing fields are saved to the listing.
 * The Edge Function will fetch the listing, calculate all pricing,
 * and persist the pricing_list record.
 *
 * @param {string} listingId - The listing ID.
 * @param {object} [options] - Optional parameters.
 * @param {string} [options.userId] - User ID creating the pricing.
 * @param {number} [options.unitMarkup] - Unit-level markup (0-1).
 * @returns {Promise<object>} Result with pricing_list_id and starting price.
 *
 * @example
 * const result = await createPricingList('listing123');
 * console.log(result.starting_nightly_price); // 76.50
 */
export async function createPricingList(listingId, options = {}) {
  const edgeFunctionUrl = getEdgeFunctionUrl();

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'create',
      payload: {
        listing_id: listingId,
        user_id: options.userId,
        unit_markup: options.unitMarkup,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create pricing list: ${response.status}`);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Fetch pricing_list for a listing.
 *
 * Returns the pre-calculated pricing arrays and scalars.
 * Use this for displaying pricing without recalculating.
 *
 * @param {string} listingId - The listing ID.
 * @returns {Promise<object|null>} Pricing list data or null if not found.
 *
 * @example
 * const pricingList = await fetchPricingList('listing123');
 * if (pricingList) {
 *   console.log(pricingList.nightlyPrice); // [null, 117, 111, ...]
 * }
 */
export async function fetchPricingList(listingId) {
  const edgeFunctionUrl = getEdgeFunctionUrl();

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'get',
      payload: {
        listing_id: listingId,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch pricing list: ${response.status}`);
  }

  const result = await response.json();
  const data = result.data || result;

  if (!data.found) {
    return null;
  }

  return data.pricing_list;
}

/**
 * Update pricing_list with new inputs and recalculate.
 *
 * @param {string} listingId - The listing ID.
 * @param {object} [options] - Update options.
 * @param {number} [options.unitMarkup] - New unit markup (0-1).
 * @returns {Promise<object>} Updated pricing data.
 */
export async function updatePricingList(listingId, options = {}) {
  const edgeFunctionUrl = getEdgeFunctionUrl();

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'update',
      payload: {
        listing_id: listingId,
        unit_markup: options.unitMarkup,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update pricing list: ${response.status}`);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Force recalculate pricing_list.
 *
 * @param {string} listingId - The listing ID.
 * @returns {Promise<object>} Recalculated pricing data.
 */
export async function recalculatePricingList(listingId) {
  const edgeFunctionUrl = getEdgeFunctionUrl();

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'recalculate',
      payload: {
        listing_id: listingId,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to recalculate pricing list: ${response.status}`);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Trigger pricing list creation after listing submission.
 *
 * Fire-and-forget version that doesn't block the main flow.
 * Errors are logged but don't fail the submission.
 *
 * @param {string} listingId - The listing ID.
 * @param {object} [options] - Optional parameters.
 */
export function triggerPricingListCreation(listingId, options = {}) {
  createPricingList(listingId, options)
    .then((result) => {
      console.log('[pricingListService] Pricing list created:', result.pricing_list_id);
    })
    .catch((error) => {
      console.warn('[pricingListService] Failed to create pricing list (non-blocking):', error.message);
    });
}
