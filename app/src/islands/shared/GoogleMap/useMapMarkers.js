import { useEffect, useRef, useCallback } from 'react';
import { COLORS } from '../../../lib/constants.js';
import { logger } from '../../../lib/logger.js';
import { getListingDisplayPrice } from '../../../logic/calculators/pricing/getListingDisplayPrice.js';
import { createSimpleMarker, createPriceMarker } from './markerFactory.js';

/**
 * Hook that manages marker creation and updates on the Google Map.
 * Handles both filtered (purple) and all-listings (grey) marker layers.
 *
 * @param {object} params
 * @param {Array} params.listings - All listings to show as grey markers
 * @param {Array} params.filteredListings - Filtered subset to show as purple markers
 * @param {boolean} params.mapLoaded - Whether the map is initialized
 * @param {boolean} params.showAllListings - Whether to show the grey background layer
 * @param {boolean} params.simpleMode - If true, show simple marker without price/card
 * @param {boolean} params.disableAutoZoom - If true, don't auto-fit bounds or restrict zoom
 * @param {number|null} params.initialZoom - Optional initial zoom level
 * @param {number} params.selectedNightsCount - Number of nights for price calculation
 * @param {React.MutableRefObject} params.googleMapRef - Ref to the Google Map instance
 * @param {React.MutableRefObject} params.handlePinClickRef - Ref to the latest handlePinClick
 * @returns {{ markersRef: React.MutableRefObject }}
 */
export default function useMapMarkers({
  listings,
  filteredListings,
  mapLoaded,
  showAllListings,
  simpleMode,
  disableAutoZoom,
  initialZoom,
  selectedNightsCount,
  googleMapRef,
  handlePinClickRef,
}) {
  const markersRef = useRef([]);
  const lastMarkersUpdateRef = useRef(null);

  /**
   * Get the starting price for map marker display.
   * Map markers always show the static starting price -- NOT schedule-adjusted.
   * Uses the shared getListingDisplayPrice utility in 'starting' mode.
   */
  const getDisplayPrice = useCallback((listing) => {
    return getListingDisplayPrice(listing, 0, 'starting');
  }, []);

  // Update markers when listings change
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) {
      if (import.meta.env.DEV) {
        logger.warn('GoogleMap: Skipping marker update - map not ready');
      }
      return;
    }

    // Performance optimization: Prevent duplicate marker updates
    const markerSignature = `${listings.map(l => l.id).join(',')}-${filteredListings.map(l => l.id).join(',')}-${showAllListings}`;
    if (lastMarkersUpdateRef.current === markerSignature) {
      if (import.meta.env.DEV) {
        logger.debug('GoogleMap: Skipping duplicate marker update - same listings');
      }
      return;
    }

    lastMarkersUpdateRef.current = markerSignature;

    // Defer marker creation to next frame to prevent blocking render
    function createMarkers() {
      if (import.meta.env.DEV) {
        logger.debug('GoogleMap: Markers update triggered', {
          mapLoaded,
          googleMapExists: !!googleMapRef.current,
          totalListings: listings.length,
          filteredListings: filteredListings.length,
          showAllListings,
          allListingsPassedCorrectly: listings.length > 0,
          backgroundLayerEnabled: showAllListings
        });
      }

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      logger.debug('GoogleMap: Cleared existing markers');

      const map = googleMapRef.current;
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidMarkers = false;

      const markerRefs = { handlePinClickRef, googleMapRef };

      // Create markers for filtered listings (simple or purple depending on mode)
      if (filteredListings && filteredListings.length > 0) {
        logger.debug(`GoogleMap: Starting ${simpleMode ? 'simple' : 'purple'} marker creation for filtered listings:`, filteredListings.length);
        logger.debug('GoogleMap: First 3 filtered listings:', filteredListings.slice(0, 3).map(l => ({
          id: l.id,
          title: l.title,
          coordinates: l.coordinates,
          hasCoordinates: !!(l.coordinates?.lat && l.coordinates?.lng)
        })));

        let markersCreated = 0;
        let skippedNoCoordinates = 0;
        const skippedInvalidCoordinates = [];

        filteredListings.forEach((listing, index) => {
          logger.debug(`GoogleMap: [${index + 1}/${filteredListings.length}] Processing filtered listing:`, {
            id: listing.id,
            title: listing.title,
            coordinates: listing.coordinates,
            hasCoordinatesObject: !!listing.coordinates,
            hasLat: listing.coordinates?.lat !== undefined,
            hasLng: listing.coordinates?.lng !== undefined,
            lat: listing.coordinates?.lat,
            lng: listing.coordinates?.lng
          });

          if (!listing.coordinates || !listing.coordinates.lat || !listing.coordinates.lng) {
            logger.error(`GoogleMap: Skipping filtered listing ${listing.id} - Missing or invalid coordinates:`, {
              coordinates: listing.coordinates,
              hasCoordinates: !!listing.coordinates,
              lat: listing.coordinates?.lat,
              lng: listing.coordinates?.lng
            });
            skippedNoCoordinates++;
            skippedInvalidCoordinates.push({
              id: listing.id,
              title: listing.title,
              coordinates: listing.coordinates
            });
            return;
          }

          const position = {
            lat: listing.coordinates.lat,
            lng: listing.coordinates.lng
          };

          // Calculate dynamic price based on selected nights
          const displayPrice = getDisplayPrice(listing);

          logger.debug(`GoogleMap: Creating ${simpleMode ? 'simple' : 'purple'} marker for listing ${listing.id}:`, {
            position,
            displayPrice,
            startingPrice: listing.price?.starting || listing.lowest_nightly_price_for_map_display,
            selectedNightsCount,
            title: listing.title,
            simpleMode
          });

          // Create marker based on mode
          const marker = simpleMode
            ? createSimpleMarker(map, position, listing)
            : createPriceMarker(
              map,
              position,
              displayPrice,
              COLORS.SECONDARY, // Purple - search results
              listing,
              markerRefs
            );

          markersRef.current.push(marker);
          bounds.extend(position);
          hasValidMarkers = true;
          markersCreated++;

          logger.debug(`GoogleMap: ${simpleMode ? 'Simple' : 'Purple'} marker created successfully for ${listing.id}, total markers so far: ${markersRef.current.length}`);
        });

        logger.debug(`GoogleMap: ${simpleMode ? 'Simple' : 'Purple'} marker creation summary:`, {
          totalFiltered: filteredListings.length,
          markersCreated: markersCreated,
          skippedNoCoordinates,
          skippedInvalidCoordinates: skippedInvalidCoordinates.length,
          invalidListings: skippedInvalidCoordinates
        });
      } else {
        logger.debug('GoogleMap: No filtered listings to create purple markers for');
      }

      // Create markers for all listings (grey) - background context
      if (showAllListings && listings && listings.length > 0) {
        logger.debug('GoogleMap: Starting grey marker creation for all listings (background layer):', listings.length);
        logger.debug('GoogleMap: First 3 all listings:', listings.slice(0, 3).map(l => ({
          id: l.id,
          title: l.title,
          coordinates: l.coordinates,
          hasCoordinates: !!(l.coordinates?.lat && l.coordinates?.lng)
        })));

        let greenMarkersCreated = 0;
        let skippedAlreadyFiltered = 0;
        let skippedNoCoordinates = 0;
        const skippedInvalidCoordinates = [];

        listings.forEach((listing, index) => {
          // Skip if already shown as filtered listing
          const isFiltered = filteredListings?.some(fl => fl.id === listing.id);
          if (isFiltered) {
            logger.debug(`GoogleMap: [${index + 1}/${listings.length}] Skipping ${listing.id} - Already shown as purple marker`);
            skippedAlreadyFiltered++;
            return;
          }

          logger.debug(`GoogleMap: [${index + 1}/${listings.length}] Processing all listing:`, {
            id: listing.id,
            title: listing.title,
            coordinates: listing.coordinates,
            hasCoordinatesObject: !!listing.coordinates,
            hasLat: listing.coordinates?.lat !== undefined,
            hasLng: listing.coordinates?.lng !== undefined,
            lat: listing.coordinates?.lat,
            lng: listing.coordinates?.lng
          });

          if (!listing.coordinates || !listing.coordinates.lat || !listing.coordinates.lng) {
            logger.error(`GoogleMap: Skipping all listing ${listing.id} - Missing or invalid coordinates:`, {
              coordinates: listing.coordinates,
              hasCoordinates: !!listing.coordinates,
              lat: listing.coordinates?.lat,
              lng: listing.coordinates?.lng
            });
            skippedNoCoordinates++;
            skippedInvalidCoordinates.push({
              id: listing.id,
              title: listing.title,
              coordinates: listing.coordinates
            });
            return;
          }

          const position = {
            lat: listing.coordinates.lat,
            lng: listing.coordinates.lng
          };

          // Calculate dynamic price based on selected nights
          const displayPrice = getDisplayPrice(listing);

          logger.debug(`GoogleMap: Creating grey marker for listing ${listing.id}:`, {
            position,
            displayPrice,
            startingPrice: listing.price?.starting || listing.lowest_nightly_price_for_map_display,
            selectedNightsCount,
            title: listing.title
          });

          // Create grey marker for all listings
          const marker = createPriceMarker(
            map,
            position,
            displayPrice,
            COLORS.MUTED, // Grey - all active listings
            listing,
            markerRefs
          );

          markersRef.current.push(marker);
          bounds.extend(position);
          hasValidMarkers = true;
          greenMarkersCreated++;

          logger.debug(`GoogleMap: Grey marker created successfully for ${listing.id}, total markers so far: ${markersRef.current.length}`);
        });

        logger.debug('GoogleMap: Grey marker creation summary:', {
          totalAllListings: listings.length,
          markersCreated: greenMarkersCreated,
          skippedAlreadyFiltered,
          skippedNoCoordinates,
          skippedInvalidCoordinates: skippedInvalidCoordinates.length,
          invalidListings: skippedInvalidCoordinates
        });
      } else {
        logger.debug('GoogleMap: No all listings to create grey markers for (showAllListings:', showAllListings, ', listings.length:', listings?.length, ')');
      }

      // Fit map to show all markers
      if (hasValidMarkers) {
        if (import.meta.env.DEV) {
          logger.debug('GoogleMap: Fitting bounds to markers', {
            markerCount: markersRef.current.length,
            bounds: bounds.toString(),
            disableAutoZoom,
            initialZoom,
            simpleMode
          });
        }

        // In simple mode, skip auto-centering here because parent will call zoomToListing explicitly
        // This prevents double-zooming and ensures exact same behavior as clicking "Located in" link
        if (simpleMode && markersRef.current.length === 1) {
          logger.debug('GoogleMap: Simple mode - Skipping auto-center, parent will call zoomToListing');
          // Do nothing - parent component will call zoomToListing to center the map
        } else if (!disableAutoZoom) {
          // Normal auto-fit behavior
          map.fitBounds(bounds);

          // Prevent over-zooming on single marker (unless initial zoom is specified)
          if (!initialZoom) {
            const listener = window.google.maps.event.addListener(map, 'idle', () => {
              if (map.getZoom() > 16) map.setZoom(16);
              window.google.maps.event.removeListener(listener);
            });
          }
        }
      } else {
        logger.warn('GoogleMap: No valid markers to display');
      }
    }

    // Render markers immediately without lazy loading
    createMarkers();
  }, [listings, filteredListings, mapLoaded, showAllListings, getDisplayPrice]);

  return { markersRef, lastMarkersUpdateRef };
}
