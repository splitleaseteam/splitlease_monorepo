import { logger } from '../../../lib/logger.js';

/**
 * Create a simple standard Google Maps marker (for view-split-lease page)
 * No label or info window - just the pin
 * @param {google.maps.Map} map - The map instance
 * @param {object} coordinates - {lat, lng} coordinates
 * @param {object} listing - Full listing data
 * @returns {google.maps.Marker} The created marker
 */
export function createSimpleMarker(map, coordinates, listing) {
  const marker = new window.google.maps.Marker({
    position: { lat: coordinates.lat, lng: coordinates.lng },
    map: map,
    title: '', // Remove title to prevent label on hover
    animation: window.google.maps.Animation.DROP,
    // Use default red marker (no icon property = default marker)
  });

  // Store listing ID for reference
  marker.listingId = listing.id;

  logger.debug('GoogleMap: Simple marker created successfully for listing:', {
    id: listing.id,
    title: listing.title,
    position: { lat: coordinates.lat, lng: coordinates.lng }
  });

  return marker;
}

/**
 * Create a custom price label marker using OverlayView
 * NO LAZY LOADING: Immediate rendering for all price pins
 * @param {google.maps.Map} map - The map instance
 * @param {object} coordinates - {lat, lng} coordinates
 * @param {number} price - Price to display
 * @param {string} color - Marker color (hex: #00C851 green or #31135D purple)
 * @param {object} listing - Full listing data
 * @param {object} refs - Object containing { handlePinClickRef, googleMapRef }
 * @returns {google.maps.OverlayView} The created overlay marker
 */
export function createPriceMarker(map, coordinates, price, color, listing, refs) {
  const { handlePinClickRef, googleMapRef } = refs;
  const markerOverlay = new window.google.maps.OverlayView();

  markerOverlay.onAdd = function () {
    const priceTag = document.createElement('div');
    priceTag.innerHTML = `$${parseFloat(price).toFixed(2)}`;
    priceTag.className = 'map-price-marker';
    priceTag.dataset.color = color;
    priceTag.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      background: ${color};
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      transition: background-color 0.2s ease;
      transform: translate(-50%, -50%);
      z-index: ${color === '#5B21B6' ? '1002' : '1001'};
      will-change: transform;
      pointer-events: auto;
      display: block;
      visibility: visible;
      opacity: 1;
      min-width: 50px;
      text-align: center;
    `;

    // In marker creation, add proper hover handling
    const handleMarkerHover = (_listing, isEntering) => {
      if (!googleMapRef.current) return;

      if (isEntering) {
        // Scale up marker - bring to front
        priceTag.style.zIndex = String(window.google.maps.Marker.MAX_ZINDEX + 1);
      } else {
        // Reset marker z-index
        priceTag.style.zIndex = color === '#5B21B6' ? '1002' : '1001';
      }
    };

    priceTag.addEventListener('mouseenter', () => handleMarkerHover(listing, true));
    priceTag.addEventListener('mouseleave', () => handleMarkerHover(listing, false));

    // Use ref to always call latest handlePinClick (avoids stale closure issue)
    priceTag.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling to map container
      if (handlePinClickRef.current) {
        handlePinClickRef.current(listing, priceTag);
      }
    });

    this.div = priceTag;
    const panes = this.getPanes();
    // Use overlayMouseTarget pane for clickable overlays (sits above map tiles)
    panes.overlayMouseTarget.appendChild(priceTag);
    logger.debug('MarkerOverlay.onAdd: marker appended to DOM', {
      listingId: listing.id,
      price: price,
      innerHTML: priceTag.innerHTML,
      paneType: 'overlayMouseTarget',
      divExists: !!this.div
    });
  };

  markerOverlay.draw = function () {
    if (!this.div) {
      logger.warn('MarkerOverlay.draw: div not found for listing:', listing.id);
      return;
    }

    // Immediate rendering without RAF - no lazy loading
    const projection = this.getProjection();
    if (!projection) {
      logger.warn('MarkerOverlay.draw: projection not available for listing:', listing.id);
      return;
    }

    const position = projection.fromLatLngToDivPixel(
      new window.google.maps.LatLng(coordinates.lat, coordinates.lng)
    );

    logger.debug('MarkerOverlay.draw: positioning marker', {
      listingId: listing.id,
      coordinates: { lat: coordinates.lat, lng: coordinates.lng },
      pixelPosition: position ? { x: position.x, y: position.y } : null
    });

    if (this.div && position) {
      // Use transform3d for GPU acceleration
      this.div.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`;
      // Also set left/top as fallback
      this.div.style.left = '0px';
      this.div.style.top = '0px';
    }
  };

  markerOverlay.onRemove = function () {
    if (this.div) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  };

  try {
    markerOverlay.setMap(map);
    markerOverlay.listingId = listing.id;
    logger.debug('createPriceMarker: marker set on map', {
      listingId: listing.id,
      hasDiv: !!markerOverlay.div,
      mapSet: markerOverlay.getMap() === map
    });
  } catch (error) {
    logger.error('createPriceMarker: error setting map', {
      listingId: listing.id,
      error: error.message
    });
  }

  return markerOverlay;
}
