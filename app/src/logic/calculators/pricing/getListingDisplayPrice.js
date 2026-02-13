/**
 * getListingDisplayPrice — Single source of truth for listing price display.
 *
 * Every search surface (PropertyCard, GoogleMap markers, ListingCardForMap)
 * MUST call this function instead of computing prices inline.
 *
 * @param {Object} listing - Listing object with pricingList attached
 * @param {number} nightsCount - Number of nights from schedule selector (0 = no selection)
 * @param {'dynamic'|'starting'} mode
 *   - 'dynamic': Schedule-adjusted price for listing cards and map popups
 *   - 'starting': Static starting price for map markers
 * @returns {number} Price per night (guest-facing), or 0 if unavailable
 *
 * @rule pricingList is the single source of truth — no fallback to calculatePrice()
 * @rule Map markers use 'starting' mode; listing cards and popups use 'dynamic'
 */
export function getListingDisplayPrice(listing, nightsCount = 0, mode = 'dynamic') {
  if (!listing) return 0;

  const pricingList = listing.pricingList;

  // ── Starting mode: static price for map markers ──
  if (mode === 'starting') {
    // Prefer pricingList.startingNightlyPrice
    const plStarting = Number(pricingList?.startingNightlyPrice);
    if (!Number.isNaN(plStarting) && plStarting > 0) {
      return plStarting;
    }

    // Fallback to the map-display column from the prototype
    const mapPrice = Number(listing.lowest_nightly_price_for_map_display ?? listing.lowestNightlyPriceForMapDisplay);
    if (!Number.isNaN(mapPrice) && mapPrice > 0) {
      return mapPrice;
    }

    // Last resort: standardized min from listing table
    const standardized = Number(listing.standardized_min_nightly_price_for_search_filter ?? listing.price?.starting);
    if (!Number.isNaN(standardized) && standardized > 0) {
      return standardized;
    }

    return 0;
  }

  // ── Dynamic mode: schedule-adjusted price for cards & popups ──

  // If no nights selected, show starting price
  if (nightsCount < 1) {
    return getListingDisplayPrice(listing, 0, 'starting');
  }

  // Primary: pricingList.nightlyPrice array (index = nightsCount - 1)
  if (pricingList?.nightlyPrice) {
    const index = nightsCount - 1;
    const rawValue = pricingList.nightlyPrice[index];
    const parsed = Number(rawValue);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }

    // If this specific night count has no price, use startingNightlyPrice
    const plStarting = Number(pricingList.startingNightlyPrice);
    if (!Number.isNaN(plStarting) && plStarting > 0) {
      return plStarting;
    }
  }

  // No pricingList at all — fall back to starting price
  return getListingDisplayPrice(listing, 0, 'starting');
}
