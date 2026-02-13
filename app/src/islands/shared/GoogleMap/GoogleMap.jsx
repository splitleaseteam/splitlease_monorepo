/**
 * GoogleMap Island Component
 * Displays an interactive Google Map with listing markers
 *
 * Features:
 * - Grey markers for all active listings
 * - Purple markers for filtered search results
 * - Price labels on markers
 * - Clickable markers with listing info
 * - Auto-zoom to fit all markers
 * - Map legend with toggle
 *
 * Usage:
 *   import GoogleMap from '../shared/GoogleMap.jsx';
 *   <GoogleMap
 *     listings={allListings}
 *     filteredListings={filteredListings}
 *     selectedListing={selectedListing}
 *     onMarkerClick={(listing) => logger.debug('Clicked:', listing)}
 *   />
 */

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { getBoroughMapConfig } from '../../../lib/constants.js';
import { logger } from '../../../lib/logger.js';
import MapLegend from './MapLegend.jsx';
import AIResearchButton from './AIResearchButton.jsx';
import ListingCardOverlay from './ListingCardOverlay.jsx';
import useMapMarkers from './useMapMarkers.js';
import useFetchListingDetails from './useFetchListingDetails.js';
import useHandlePinClick from './useHandlePinClick.js';

const GoogleMap = forwardRef(({
  listings = [],           // All listings to show as grey markers
  filteredListings = [],   // Filtered subset to show as purple markers
  selectedListing = null,  // Currently selected/highlighted listing
  onMarkerClick = null,    // Callback when marker clicked: (listing) => void
  selectedBorough = null,  // Current borough filter for map centering
  simpleMode = false,      // If true, show simple marker without price/card (for view-split-lease page)
  initialZoom = null,      // Optional initial zoom level (defaults to auto-fit)
  disableAutoZoom = false, // If true, don't auto-fit bounds or restrict zoom
  onAIResearchClick = null, // Callback when AI research button is clicked
  onMessageClick = null,   // Callback when message button is clicked on map card
  isLoggedIn = false,      // Whether user is logged in (for showing favorite button)
  favoritedListingIds = new Set(), // Set of favorited listing IDs
  onToggleFavorite = null, // Callback when favorite button is clicked: (listingId, listingTitle, newState) => void
  userId = null,           // Current user ID for favorite button API calls
  onRequireAuth = null,    // Callback to show login modal if not authenticated
  selectedNightsCount = 4, // Default to 4 nights -- matches SearchPage initial state
  showMessageButton = true // Whether to show message button (hidden for host users)
}, ref) => {
  logger.debug('GoogleMap: Component rendered with props:', {
    listingsCount: listings.length,
    filteredListingsCount: filteredListings.length,
    selectedBorough,
    hasMessageCallback: !!onMessageClick,
    messageCallbackType: typeof onMessageClick,
    listingsSample: listings.slice(0, 2).map(l => ({
      id: l.id,
      title: l.title,
      coordinates: l.coordinates,
      hasValidCoords: !!(l.coordinates?.lat && l.coordinates?.lng)
    })),
    filteredListingsSample: filteredListings.slice(0, 2).map(l => ({
      id: l.id,
      title: l.title,
      coordinates: l.coordinates,
      hasValidCoords: !!(l.coordinates?.lat && l.coordinates?.lng)
    }))
  });

  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showAllListings, setShowAllListings] = useState(true);
  const handlePinClickRef = useRef(null); // Ref to always have latest handlePinClick

  // Listing card state
  const [selectedListingForCard, setSelectedListingForCard] = useState(null);
  const [cardVisible, setCardVisible] = useState(false);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });

  // Extracted hooks
  const { fetchDetailedListingData, isLoadingListingDetails } = useFetchListingDetails();
  const { markersRef, lastMarkersUpdateRef } = useMapMarkers({
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
  });

  const handlePinClick = useHandlePinClick({
    onMarkerClick,
    mapRef,
    googleMapRef,
    setCardPosition,
    setCardVisible,
    setSelectedListingForCard,
    fetchDetailedListingData,
  });

  // Keep ref updated with latest handlePinClick so event listeners always use current version
  handlePinClickRef.current = handlePinClick;

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    // Highlight marker: pulse in place (no map pan -- prevents motion sickness)
    highlightListing(listingId) {
      if (!googleMapRef.current || !mapLoaded) return;

      const marker = markersRef.current.find(m => m.listingId === listingId);
      if (!marker || !marker.div) return;

      // Remove pulse from all other markers first
      markersRef.current.forEach(m => {
        if (m.div) {
          m.div.classList.remove('pulse');
          m.div.style.outline = '';
          m.div.style.outlineOffset = '';
        }
      });

      // Respect prefers-reduced-motion: static highlight only
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        marker.div.style.outline = '2px solid #4B47CE';
        marker.div.style.outlineOffset = '2px';
      } else {
        marker.div.classList.add('pulse');
      }
    },
    // Stop pulsing all markers (called when hover ends)
    stopPulse() {
      markersRef.current.forEach(m => {
        if (m.div) {
          m.div.classList.remove('pulse');
          m.div.style.outline = '';
          m.div.style.outlineOffset = '';
        }
      });
    },
    zoomToListing(listingId) {
      if (!googleMapRef.current || !mapLoaded) {
        logger.error('Map not initialized yet');
        return;
      }

      // Find the listing in either filtered or all listings
      const listing = filteredListings.find(l => l.id === listingId) ||
        listings.find(l => l.id === listingId);

      if (!listing) {
        logger.error('Listing not found:', listingId);
        return;
      }

      const coords = listing.coordinates;
      if (!coords || !coords.lat || !coords.lng) {
        logger.error('Invalid coordinates for listing:', listingId);
        return;
      }

      const map = googleMapRef.current;

      // Determine zoom level based on borough
      let zoomLevel = 16;
      if (listing.borough === 'Manhattan') {
        zoomLevel = 17;
      } else if (listing.borough === 'Staten Island' || listing.borough === 'Queens') {
        zoomLevel = 15;
      }

      // Create a LatLngBounds and extend it with the listing coordinates
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: coords.lat, lng: coords.lng });

      // Get the map container's height to calculate appropriate padding
      const mapContainer = mapRef.current;
      const containerHeight = mapContainer ? mapContainer.offsetHeight : 400;

      // Calculate padding to center the pin in the VISIBLE viewport
      // When scrolling to the map, the header (80px) + padding (20px) = ~100px overlap
      // This means the top ~100px of the map container is hidden by the fixed header
      //
      // Visible area: from 100px to 400px (300px tall)
      // To center the pin in the visible 300px area, it should be at 250px from container top
      //
      // With fitBounds padding:
      // - top: 150px (header offset 100px + centering adjustment 50px)
      // - bottom: 50px (balances to center pin at 250px)
      // This centers the pin at: 150px + (200px / 2) = 250px, which is the midpoint of 100-400px
      const topPadding = 150; // Accounts for header overlap + centering
      const bottomPadding = 50; // Balances for proper centering

      // Smooth pan and zoom with bounds that account for container dimensions and header offset
      map.fitBounds(bounds, {
        top: topPadding,
        bottom: bottomPadding,
        left: 50,
        right: 50
      });

      // Set zoom level after fitBounds completes
      window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        map.setZoom(zoomLevel);
      });

      // Find and highlight the marker
      const marker = markersRef.current.find(m => m.listingId === listingId);
      if (marker && marker.div) {
        // Add pulse animation class
        marker.div.classList.add('pulse');
        setTimeout(() => {
          marker.div.classList.remove('pulse');
        }, 3000);

        // Show listing card after pan completes
        setTimeout(() => {
          handlePinClick(listing, marker.div);
        }, 600);
      }
    }
  }));

  // Initialize Google Map when API is loaded
  useEffect(() => {
    const initMap = () => {
      logger.debug('GoogleMap: Initializing map...', {
        mapRefExists: !!mapRef.current,
        googleMapsLoaded: !!(window.google && window.google.maps),
        simpleMode,
        hasFilteredListings: filteredListings.length > 0,
        hasListings: listings.length > 0,
        mapAlreadyExists: !!googleMapRef.current
      });

      if (!mapRef.current || !window.google) {
        logger.warn('GoogleMap: Cannot initialize - missing mapRef or Google Maps API');
        return;
      }

      // Don't recreate map if it already exists
      if (googleMapRef.current) {
        logger.debug('GoogleMap: Map already exists, skipping re-initialization');
        return;
      }

      // Determine initial center and zoom based on mode and available data
      let initialCenter;
      let initialZoomLevel;

      // For simple mode with a single listing, use that listing's coordinates
      if (simpleMode && (filteredListings.length === 1 || listings.length === 1)) {
        const listing = filteredListings[0] || listings[0];
        if (listing?.coordinates?.lat && listing?.coordinates?.lng) {
          initialCenter = { lat: listing.coordinates.lat, lng: listing.coordinates.lng };
          initialZoomLevel = initialZoom || 17;
          logger.debug('GoogleMap: Using listing coordinates for initial center:', initialCenter);
        }
      }

      // Fallback to default
      if (!initialCenter) {
        const defaultMapConfig = getBoroughMapConfig('default');
        initialCenter = defaultMapConfig.center;
        initialZoomLevel = defaultMapConfig.zoom;
        logger.debug('GoogleMap: Using default center');
      }

      // Create map instance
      const map = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: initialZoomLevel,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER
        },
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      googleMapRef.current = map;
      // Reset marker signature so markers are recreated on new map instance
      lastMarkersUpdateRef.current = null;
      setMapLoaded(true);
      logger.debug('GoogleMap: Map initialized successfully with zoom controls enabled');
    };

    // Wait for Google Maps API to fully load
    // Check that both google.maps exists AND ControlPosition is available (indicates full load)
    if (window.google && window.google.maps && window.google.maps.ControlPosition) {
      logger.debug('GoogleMap: Google Maps API already loaded, initializing...');
      initMap();
    } else {
      logger.debug('GoogleMap: Waiting for Google Maps API to load...');
      window.addEventListener('google-maps-loaded', initMap);
      return () => window.removeEventListener('google-maps-loaded', initMap);
    }
  }, [filteredListings, listings, simpleMode, initialZoom]);

  // Recenter map when borough changes
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current || !selectedBorough) return;

    logger.debug('GoogleMap: Borough changed, recentering map:', selectedBorough);

    const boroughConfig = getBoroughMapConfig(selectedBorough);
    const map = googleMapRef.current;

    // Smoothly pan to new borough center
    map.panTo(boroughConfig.center);
    map.setZoom(boroughConfig.zoom);

    logger.debug(`GoogleMap: Map recentered to ${boroughConfig.name}`);
  }, [selectedBorough, mapLoaded]);

  // Highlight selected listing marker
  useEffect(() => {
    if (!selectedListing || !mapLoaded) return;

    // Find and highlight the selected marker
    // This could pulse the marker or change its appearance
    // Implementation depends on requirements
  }, [selectedListing, mapLoaded]);

  // Close card when clicking on map
  const handleMapClick = () => {
    logger.debug('handleMapClick: Map clicked, closing card');
    setCardVisible(false);
    setSelectedListingForCard(null);
  };

  // Memoized callback for legend toggle to prevent re-renders
  const handleLegendToggle = useCallback((checked) => {
    setShowAllListings(checked);
  }, []);

  return (
    <div className="google-map-container">
      <div
        ref={mapRef}
        className="google-map"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
          borderRadius: '12px'
        }}
        onClick={handleMapClick}
      />
      {mapLoaded && !simpleMode && (
        <MapLegend
          showAllListings={showAllListings}
          onToggle={handleLegendToggle}
        />
      )}
      {mapLoaded && !simpleMode && (
        <AIResearchButton onAIResearchClick={onAIResearchClick} />
      )}
      {!mapLoaded && (
        <div className="map-loading">
          <div className="spinner"></div>
          <p>Loading map...</p>
        </div>
      )}

      {/* Listing Card Overlay - Only in normal mode, not in simple mode */}
      {mapLoaded && (
        <ListingCardOverlay
          cardVisible={cardVisible}
          cardPosition={cardPosition}
          isLoadingListingDetails={isLoadingListingDetails}
          selectedListingForCard={selectedListingForCard}
          onClose={() => {
            setCardVisible(false);
            setSelectedListingForCard(null);
          }}
          onMessageClick={onMessageClick}
          isLoggedIn={isLoggedIn}
          favoritedListingIds={favoritedListingIds}
          onToggleFavorite={onToggleFavorite}
          userId={userId}
          onRequireAuth={onRequireAuth}
          showMessageButton={showMessageButton}
          selectedNightsCount={selectedNightsCount}
          simpleMode={simpleMode}
        />
      )}
    </div>
  );
});

GoogleMap.displayName = 'GoogleMap';

export default GoogleMap;
