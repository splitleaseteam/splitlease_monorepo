/**
 * MapColumn - Right column with logo, auth navigation, and GoogleMap
 *
 * Extracted from SearchPage.jsx to reduce main file size.
 * Contains: map header (logo + auth actions), GoogleMap component.
 */
import { forwardRef, useRef } from 'react';
import GoogleMap from '../../../shared/GoogleMap.jsx';
import LoggedInAvatar from '../../../shared/LoggedInAvatar/LoggedInAvatar.jsx';

const MapColumn = forwardRef(function MapColumn({
  // Auth
  isLoggedIn,
  currentUser,
  favoritesCount,
  onNavigate,
  onLogout,
  onOpenAuthModal,
  // Menu
  menuOpen,
  setMenuOpen,
  menuRef,
  // Map props
  allActiveListings,
  allListings,
  selectedBoroughs,
  selectedNightsCount,
  onMarkerClick,
  onMessageClick,
  onAIResearchClick,
  favoritedListingIds,
  onToggleFavorite,
  authUserId,
  onRequireAuth,
  showMessageButton,
}, mapRef) {
  return (
    <section className="map-column">
      <div className="map-header">
        <a href="/" className="map-logo">
          <img
            src="/assets/images/split-lease-purple-circle.png"
            alt="Split Lease Logo"
            className="logo-icon"
            width="36"
            height="36"
          />
          <span className="logo-text">Split Lease</span>
        </a>

        <div className="map-header-actions">
          {isLoggedIn && currentUser ? (
            <>
              <a href="/favorite-listings" className="favorites-link" aria-label="My Favorite Listings">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {favoritesCount > 0 && (
                  <span className="favorites-badge">{favoritesCount}</span>
                )}
              </a>
              <LoggedInAvatar
                user={currentUser}
                currentPath="/search"
                onNavigate={onNavigate}
                onLogout={onLogout}
              />
            </>
          ) : (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                className="hamburger-menu"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
              >
                <span>Menu</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              {menuOpen && (
                <div className="header-dropdown">
                  <a href="/guest-success">Success Stories</a>
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    onOpenAuthModal();
                  }}>Sign In / Sign Up</a>
                  <a href="/why-split-lease">Understand Split Lease</a>
                  <a href="/faq">Explore FAQs</a>
                  <a href="/help-center">Support Centre</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
    </section>
  );
});

export default MapColumn;
