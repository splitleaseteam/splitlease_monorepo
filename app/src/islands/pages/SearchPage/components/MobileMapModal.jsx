/**
 * MobileMapModal - Full-screen map overlay for mobile devices
 *
 * Extracted from SearchPage.jsx to reduce main file size.
 */
import { forwardRef } from 'react';
import GoogleMap from '../../../shared/GoogleMap.jsx';

const MobileMapModal = forwardRef(function MobileMapModal({
  onClose,
  allActiveListings,
  allListings,
  selectedBoroughs,
  selectedNightsCount,
  onMarkerClick,
  onMessageClick,
  onAIResearchClick,
  isLoggedIn,
  favoritedListingIds,
  onToggleFavorite,
  authUserId,
  onRequireAuth,
  showMessageButton,
}, mapRef) {
  return (
    <div className="mobile-map-modal" role="dialog" aria-modal="true" aria-label="Map view">
      <div className="mobile-map-header">
        <button
          className="mobile-map-close-btn"
          onClick={onClose}
          aria-label="Close map"
        >
          X
        </button>
        <h2>Map View</h2>
      </div>
      <div className="mobile-map-content">
        <GoogleMap
          ref={mapRef}
          listings={allActiveListings}
          filteredListings={allListings}
          selectedListing={null}
          selectedBorough={selectedBoroughs.length > 0 ? selectedBoroughs[0] : null}
          selectedNightsCount={selectedNightsCount}
          onMarkerClick={onMarkerClick}
          onMessageClick={onMessageClick}
          onAIResearchClick={onAIResearchClick}
          isLoggedIn={isLoggedIn}
          favoritedListingIds={favoritedListingIds}
          onToggleFavorite={onToggleFavorite}
          userId={authUserId}
          onRequireAuth={onRequireAuth}
          showMessageButton={showMessageButton}
        />
      </div>
    </div>
  );
});

export default MobileMapModal;
