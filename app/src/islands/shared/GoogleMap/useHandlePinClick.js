import { useCallback } from 'react';
import { logger } from '../../../lib/logger.js';

/**
 * Hook that provides the handlePinClick callback for map marker clicks.
 * Handles card positioning, map panning, and fetching detailed listing data.
 *
 * @param {object} params
 * @param {Function|null} params.onMarkerClick - Parent callback when marker clicked
 * @param {React.MutableRefObject} params.mapRef - Ref to the map container DOM element
 * @param {React.MutableRefObject} params.googleMapRef - Ref to the Google Map instance
 * @param {Function} params.setCardPosition - State setter for card position
 * @param {Function} params.setCardVisible - State setter for card visibility
 * @param {Function} params.setSelectedListingForCard - State setter for selected listing data
 * @param {Function} params.fetchDetailedListingData - Function to fetch listing details from Supabase
 * @returns {Function} handlePinClick callback
 */
export default function useHandlePinClick({
  onMarkerClick,
  mapRef,
  googleMapRef,
  setCardPosition,
  setCardVisible,
  setSelectedListingForCard,
  fetchDetailedListingData,
}) {
  const handlePinClick = useCallback(async (listing, priceTag, options = {}) => {
    const { skipParentCallback = false } = options;
    logger.debug('handlePinClick (React callback): Pin clicked:', {
      listingId: listing.id,
      listingTitle: listing.title,
      skipParentCallback
    });

    // Call parent callback FIRST (before any async operations) so scroll/highlight happens immediately
    if (onMarkerClick && !skipParentCallback) {
      logger.debug('handlePinClick: Calling onMarkerClick to scroll to listing card');
      onMarkerClick(listing);
    }

    // Calculate card position relative to map container
    const mapContainer = mapRef.current;
    if (!mapContainer) {
      logger.error('handlePinClick: Map container ref not available');
      return;
    }

    const map = googleMapRef.current;
    const mapRect = mapContainer.getBoundingClientRect();
    const priceTagRect = priceTag.getBoundingClientRect();

    // Calculate position relative to map container
    const pinCenterX = priceTagRect.left - mapRect.left + (priceTagRect.width / 2);
    const pinTop = priceTagRect.top - mapRect.top;

    // Card dimensions (matching ListingCardForMap - updated for compact layout)
    const cardWidth = 300;
    const cardHeight = 300; // Approximate height after compact layout updates
    const arrowHeight = 10;
    const gapFromPin = 5;
    const margin = 20;

    // Calculate card position - center on pin, above it
    let cardLeft = pinCenterX;
    let cardTop = pinTop - cardHeight - arrowHeight - gapFromPin;

    // Keep card within map bounds horizontally
    const minLeft = margin + (cardWidth / 2);
    const maxLeft = mapRect.width - margin - (cardWidth / 2);
    cardLeft = Math.max(minLeft, Math.min(maxLeft, cardLeft));

    // Check if card would go above map (marker is in upper portion)
    // If so, pan the map down to create space for the card above the marker
    if (cardTop < margin && map && listing.coordinates) {
      logger.debug('handlePinClick: Marker in upper portion, panning map down to create space');

      // Calculate how much vertical space we need (card height + gap + margin)
      const spaceNeeded = cardHeight + arrowHeight + gapFromPin + margin;

      // Calculate how far above the center the pin currently is
      const mapCenterY = mapRect.height / 2;
      const pinDistanceAboveCenter = mapCenterY - pinTop;

      // We need to pan the map so the pin moves down by at least spaceNeeded pixels
      // This means panning north (decreasing latitude)
      const projection = map.getProjection();
      if (projection) {
        const currentCenter = map.getCenter();
        const scale = Math.pow(2, map.getZoom());
        const worldCoordinateCenter = projection.fromLatLngToPoint(currentCenter);

        // Calculate pixel offset needed - pan down by the space needed for the card
        // Adding some extra padding (50px) for visual comfort
        const pixelOffset = spaceNeeded - pinTop + 50;

        // Convert pixel offset to world coordinates
        // Negative Y means moving the map content up, which moves the pin down visually
        const newWorldCoordinate = new window.google.maps.Point(
          worldCoordinateCenter.x,
          worldCoordinateCenter.y - (pixelOffset / scale)
        );

        const newCenter = projection.fromPointToLatLng(newWorldCoordinate);

        // Smoothly pan to the new center
        map.panTo(newCenter);

        // Wait for pan to complete, then recalculate card position
        await new Promise(resolve => setTimeout(resolve, 350));

        // Recalculate position after pan
        const newPriceTagRect = priceTag.getBoundingClientRect();
        const newPinTop = newPriceTagRect.top - mapRect.top;
        cardTop = newPinTop - cardHeight - arrowHeight - gapFromPin;

        // Update horizontal position as well in case it shifted
        const newPinCenterX = newPriceTagRect.left - mapRect.left + (newPriceTagRect.width / 2);
        cardLeft = Math.max(minLeft, Math.min(maxLeft, newPinCenterX));

        logger.debug('handlePinClick: Recalculated card position after pan:', { x: cardLeft, y: cardTop });
      }
    }

    logger.debug('handlePinClick: Card position calculated:', { x: cardLeft, y: cardTop });

    // Set position first
    setCardPosition({ x: cardLeft, y: cardTop });
    logger.debug('handlePinClick: Card position state updated');

    // Show card immediately
    setCardVisible(true);
    logger.debug('handlePinClick: Card visibility state set to true');

    // Check if listing already has images (e.g., from filteredListings)
    // If so, use it directly instead of fetching from database
    let detailedListing;
    if (listing.images && listing.images.length > 0) {
      logger.debug('handlePinClick: Listing already has images, using existing data:', {
        id: listing.id,
        imageCount: listing.images.length
      });
      detailedListing = listing;
    } else {
      logger.debug('handlePinClick: Listing has no images, fetching from database...');
      detailedListing = await fetchDetailedListingData(listing.id);
    }

    if (detailedListing && detailedListing.images && detailedListing.images.length > 0) {
      logger.debug('handlePinClick: Setting detailed listing to card:', detailedListing);
      setSelectedListingForCard(detailedListing);
    } else {
      logger.error('handlePinClick: Failed to get listing details or no images available, not showing card');
      setCardVisible(false);
    }
    logger.debug('handlePinClick: Selected listing state updated');
  }, [onMarkerClick]);

  return handlePinClick;
}
