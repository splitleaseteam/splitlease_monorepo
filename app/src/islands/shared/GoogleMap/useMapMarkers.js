import { useEffect, useRef, useCallback, useState } from 'react';
import { COLORS } from '../../../lib/constants.js';
import { logger } from '../../../lib/logger.js';
import { getListingDisplayPrice } from '../../../logic/calculators/pricing/getListingDisplayPrice.js';
import { createSimpleMarker, createPriceMarker, createClusterMarker } from './markerFactory.js';

// Grid cell size in pixels, adapts to zoom level
const CELL_SIZE_BY_ZOOM = {
  10: 120,
  11: 110,
  12: 95,
  13: 82,
  14: 70,
  15: 58,
  16: 46
};

function getCellSizeForZoom(zoom) {
  if (zoom <= 10) return CELL_SIZE_BY_ZOOM[10];
  if (zoom >= 16) return CELL_SIZE_BY_ZOOM[16];
  return CELL_SIZE_BY_ZOOM[zoom] || 90;
}

function hasValidCoordinates(listing) {
  return !!(listing?.coordinates?.lat && listing?.coordinates?.lng);
}

function bucketListingsByGrid({ sourceListings, cellSize, projection, bounds, layerKey }) {
  if (!bounds) return [];
  const buckets = new Map();

  sourceListings.forEach((listing) => {
    if (!hasValidCoordinates(listing)) return;

    const latLng = new window.google.maps.LatLng(listing.coordinates.lat, listing.coordinates.lng);
    if (!bounds.contains(latLng)) return;

    const pixel = projection.fromLatLngToDivPixel(latLng);
    if (!pixel) return;

    const gridX = Math.floor(pixel.x / cellSize);
    const gridY = Math.floor(pixel.y / cellSize);
    const key = `${layerKey}:${gridX}:${gridY}`;
    const displayPrice = getListingDisplayPrice(listing, 0, 'starting');

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        center: { lat: listing.coordinates.lat, lng: listing.coordinates.lng },
        minPrice: displayPrice,
        listings: [listing]
      });
      return;
    }

    const bucket = buckets.get(key);
    bucket.listings.push(listing);
    bucket.minPrice = Math.min(bucket.minPrice, displayPrice);
  });

  return [...buckets.values()];
}

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
  const [viewportTick, setViewportTick] = useState(0);
  void selectedNightsCount;

  /**
   * Get the starting price for map marker display.
   * Map markers always show the static starting price -- NOT schedule-adjusted.
   * Uses the shared getListingDisplayPrice utility in 'starting' mode.
   */
  const getDisplayPrice = useCallback((listing) => {
    return getListingDisplayPrice(listing, 0, 'starting');
  }, []);

  // Re-render markers when zoom/pan settles
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;

    const map = googleMapRef.current;
    const idleListener = window.google.maps.event.addListener(map, 'idle', () => {
      setViewportTick((prev) => prev + 1);
    });

    return () => {
      window.google.maps.event.removeListener(idleListener);
    };
  }, [mapLoaded, googleMapRef]);

  // Update markers when listings/filter/viewport changes
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) {
      if (import.meta.env.DEV) {
        logger.warn('GoogleMap: Skipping marker update - map not ready');
      }
      return;
    }

    const markerSignature = `${listings.map((l) => l.id).join(',')}-${filteredListings.map((l) => l.id).join(',')}-${showAllListings}-${simpleMode}`;
    const dataChanged = lastMarkersUpdateRef.current !== markerSignature;
    if (dataChanged) {
      lastMarkersUpdateRef.current = markerSignature;
    }

    const map = googleMapRef.current;
    const markerRefs = { handlePinClickRef, googleMapRef };
    const bounds = new window.google.maps.LatLngBounds();
    let hasValidMarkers = false;

    // Get projection for pixel-space bucketing
    const projectionOverlay = new window.google.maps.OverlayView();
    projectionOverlay.onAdd = function () {};
    projectionOverlay.draw = function () {};
    projectionOverlay.onRemove = function () {};
    projectionOverlay.setMap(map);

    const projection = projectionOverlay.getProjection();
    if (!projection) {
      projectionOverlay.setMap(null);
      return;
    }

    const zoom = map.getZoom() || 12;
    const cellSize = getCellSizeForZoom(zoom);
    const currentBounds = map.getBounds();

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // --- Purple (filtered) layer ---
    if (filteredListings && filteredListings.length > 0) {
      const filteredBuckets = bucketListingsByGrid({
        sourceListings: filteredListings,
        cellSize,
        projection,
        bounds: currentBounds,
        layerKey: 'filtered'
      });

      filteredBuckets.forEach((bucket) => {
        if (bucket.listings.length === 1 || simpleMode) {
          const listing = bucket.listings[0];
          const displayPrice = getDisplayPrice(listing);
          const marker = simpleMode
            ? createSimpleMarker(map, listing.coordinates, listing)
            : createPriceMarker(map, listing.coordinates, displayPrice, COLORS.SECONDARY, listing, markerRefs);

          markersRef.current.push(marker);
          bounds.extend(listing.coordinates);
          hasValidMarkers = true;
          return;
        }

        // Multiple listings in same grid cell -> cluster marker
        const marker = createClusterMarker(
          map,
          bucket.center,
          {
            count: bucket.listings.length,
            minPrice: bucket.minPrice,
            color: COLORS.SECONDARY,
            listings: bucket.listings
          },
          () => {
            map.panTo(bucket.center);
            map.setZoom(Math.min((map.getZoom() || 12) + 2, 16));
          }
        );

        markersRef.current.push(marker);
        bounds.extend(bucket.center);
        hasValidMarkers = true;
      });
    }

    // --- Grey (background) layer ---
    if (showAllListings && listings && listings.length > 0) {
      const filteredIds = new Set(filteredListings.map((l) => l.id));
      const backgroundListings = listings.filter((l) => !filteredIds.has(l.id));

      const backgroundBuckets = bucketListingsByGrid({
        sourceListings: backgroundListings,
        cellSize,
        projection,
        bounds: currentBounds,
        layerKey: 'background'
      });

      backgroundBuckets.forEach((bucket) => {
        if (bucket.listings.length === 1) {
          const listing = bucket.listings[0];
          const displayPrice = getDisplayPrice(listing);
          const marker = createPriceMarker(map, listing.coordinates, displayPrice, COLORS.MUTED, listing, markerRefs);

          markersRef.current.push(marker);
          bounds.extend(listing.coordinates);
          hasValidMarkers = true;
          return;
        }

        const marker = createClusterMarker(
          map,
          bucket.center,
          {
            count: bucket.listings.length,
            minPrice: bucket.minPrice,
            color: COLORS.MUTED,
            listings: bucket.listings
          },
          () => {
            map.panTo(bucket.center);
            map.setZoom(Math.min((map.getZoom() || 12) + 2, 16));
          }
        );

        markersRef.current.push(marker);
        bounds.extend(bucket.center);
        hasValidMarkers = true;
      });
    }

    // Clean up projection overlay
    projectionOverlay.setMap(null);

    // Fit map to show all markers (only on data change, not viewport change)
    if (hasValidMarkers && dataChanged) {
      if (simpleMode && markersRef.current.length === 1) {
        logger.debug('GoogleMap: Simple mode - Skipping auto-center, parent will call zoomToListing');
      } else if (!disableAutoZoom) {
        map.fitBounds(bounds);

        if (!initialZoom) {
          const listener = window.google.maps.event.addListener(map, 'idle', () => {
            if (map.getZoom() > 16) map.setZoom(16);
            window.google.maps.event.removeListener(listener);
          });
        }
      }
    }
  }, [
    listings,
    filteredListings,
    mapLoaded,
    showAllListings,
    getDisplayPrice,
    simpleMode,
    disableAutoZoom,
    initialZoom,
    googleMapRef,
    handlePinClickRef,
    viewportTick
  ]);

  return { markersRef, lastMarkersUpdateRef };
}
