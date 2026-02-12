/**
 * FavoriteListingsPage Component
 * Displays user's favorited listings with same layout/style as SearchPage
 * Includes Google Map with pins
 *
 * Follows the Hollow Component Pattern: all logic lives in useFavoriteListingsPageLogic.js
 */

import { useState, useEffect } from 'react';
import Header from '../../shared/Header.jsx';
import Footer from '../../shared/Footer.jsx';
import GoogleMap from '../../shared/GoogleMap.jsx';
import ContactHostMessaging from '../../shared/ContactHostMessaging.jsx';
import InformationalText from '../../shared/InformationalText.jsx';
import LoggedInAvatar from '../../shared/LoggedInAvatar/LoggedInAvatar.jsx';
import CreateProposalFlowV2 from '../../shared/CreateProposalFlowV2.jsx';
import ProposalSuccessModal from '../../modals/ProposalSuccessModal.jsx';
import SignUpLoginModal from '../../shared/AuthSignupLoginOAuthResetFlowModal';
import EmptyState from './components/EmptyState';
import FavoritesCardV2 from './components/FavoritesCardV2.jsx';
import FavoritesCardV3 from './components/FavoritesCardV3.jsx';
import { useFavoriteListingsPageLogic } from './useFavoriteListingsPageLogic';
import './FavoriteListingsPage.css';
import '../../../styles/create-proposal-flow-v2.css';

/**
 * CARD VERSION TOGGLE
 * Set to true to use the new horizontal card with mini-map (V3)
 * Set to false to revert to the original vertical card (V2)
 */
const USE_CARD_V3 = true;

/**
 * ListingsGridV2 - V6 Design: Two-column card grid layout
 * WCAG compliant with proper spacing and responsive behavior
 */
function ListingsGridV2({ listings, onOpenContactModal, isLoggedIn, onToggleFavorite, userId, proposalsByListingId, onCreateProposal, onPhotoClick, onMapClick, viewMode }) {
  // Use device detection for responsive layout
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 700);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // V6 Design: Two-column card grid (matches V6 WCAG mockup)
  // Responsive: Single column on mobile (< 700px)
  const gridStyles = USE_CARD_V3
    ? {
        display: 'grid',
        gridTemplateColumns: isMobileView ? '1fr' : 'repeat(2, 1fr)',
        gap: '24px',
        padding: '0',
      }
    : {
        display: viewMode === 'grid' ? 'grid' : 'flex',
        flexDirection: viewMode === 'grid' ? 'initial' : 'column',
        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'none',
        gap: '20px',
        padding: '0',
      };

  return (
    <div style={gridStyles} className="v6-listings-grid">
      {listings.map((listing) => {
        const proposalForListing = proposalsByListingId?.get(listing.id) || null;

        // Use V3 (V6 design vertical cards) or V2 (legacy) based on toggle
        if (USE_CARD_V3) {
          return (
            <FavoritesCardV3
              key={listing.id}
              listing={listing}
              onToggleFavorite={onToggleFavorite}
              userId={userId}
              proposalForListing={proposalForListing}
              onOpenCreateProposalModal={onCreateProposal}
              onMapClick={onMapClick}
            />
          );
        }

        return (
          <FavoritesCardV2
            key={listing.id}
            listing={listing}
            onOpenContactModal={onOpenContactModal}
            isLoggedIn={isLoggedIn}
            onToggleFavorite={onToggleFavorite}
            userId={userId}
            proposalForListing={proposalForListing}
            onOpenCreateProposalModal={onCreateProposal}
            onPhotoClick={onPhotoClick}
            viewMode={viewMode}
          />
        );
      })}
    </div>
  );
}

/**
 * PageTitleSection - Page header with title and count badge
 */
function PageTitleSection({ count, viewMode, onViewModeChange }) {
  return (
    <div className="favorites-page__title-section">
      <div className="favorites-page__title-row">
        <div className="favorites-page__title-section-left">
          <h1 className="favorites-page__title">My Favorites</h1>
          <span className="favorites-page__count-badge">{count} saved</span>
        </div>

        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange('grid')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Grid
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            List
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * LoadingState - Loading spinner
 */
function LoadingState() {
  return (
    <div className="loading-skeleton active">
      {[1, 2].map(i => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-line" style={{ width: '60%' }}></div>
            <div className="skeleton-line" style={{ width: '80%' }}></div>
            <div className="skeleton-line" style={{ width: '40%' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ErrorState - Error message component
 */
function ErrorState({ message, onRetry }) {
  return (
    <div className="error-message">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <h3>Unable to Load Favorites</h3>
      <p>{message || 'Failed to load your favorite listings. Please try again.'}</p>
      {onRetry && (
        <button className="retry-btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

const FavoriteListingsPage = () => {
  const {
    // State
    listings,
    viewMode,
    setViewMode,
    isLoading,
    error,
    userId,
    isLoggedIn,
    currentUser,
    favoritedListingIds,
    proposalsByListingId,
    isContactModalOpen,
    isInfoModalOpen,
    selectedListing,
    infoModalTriggerRef,
    isProposalModalOpen,
    selectedListingForProposal,
    zatConfig,
    moveInDate,
    selectedDayObjects,
    reservationSpan,
    priceBreakdown,
    loggedInUserData,
    showSuccessModal,
    successProposalId,
    isSubmittingProposal,
    showAuthModal,
    showPhotoModal,
    currentPhotoIndex,
    selectedListingPhotos,
    selectedListingName,
    toast,
    informationalTexts,
    mobileMapVisible,
    menuOpen,
    setMenuOpen,
    showMessageButton,

    // Refs
    mapRef,

    // Setters needed by JSX
    setMobileMapVisible,
    setShowPhotoModal,
    setCurrentPhotoIndex,
    setIsProposalModalOpen,
    setSelectedListingForProposal,
    setShowAuthModal,
    setPendingProposalData,
    setShowSuccessModal,
    setSuccessProposalId,

    // Handlers
    handleToggleFavorite,
    handleOpenContactModal,
    handleCloseContactModal,
    handleOpenInfoModal,
    handleCloseInfoModal,
    handleOpenProposalModal,
    handlePhotoGalleryOpen,
    handleProposalSubmit,
    handleNavigate,
    handleLogout,
    handleAuthSuccess,
  } = useFavoriteListingsPageLogic();

  // Render
  return (
    <>
      {/* Standard Site Header */}
      <Header />

      {/* Sub-header: Title + Count + View Toggle (per mockup) */}
      <div className="favorites-subheader">
        <div className="favorites-subheader__inner">
          <div className="favorites-subheader__left">
            <h1 className="favorites-subheader__title">My Favorites</h1>
            <span className="favorites-subheader__count">{listings.length} saved</span>
          </div>
          <div className="favorites-subheader__right">
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                Grid
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="favorites-page">
        {/* Toast Notification */}
        {toast.show && (
          <div className={`toast toast-${toast.type} show`}>
            <span className="toast-icon">
              {toast.type === 'success' && (
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              )}
              {toast.type === 'info' && (
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              )}
              {toast.type === 'error' && (
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              )}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        )}

        {/* Two-column layout: Listings (left) + Map (right) */}
        <main className="two-column-layout">
          {/* LEFT COLUMN: Listings */}
          <section className="listings-column">
            {/* ROW 1: Mobile Header - Logo, Explore Rentals, Avatar */}
            <div className="mobile-filter-bar mobile-header-row">
              <a href="/" className="mobile-logo-link" aria-label="Go to homepage">
                <img
                  src="/assets/images/split-lease-purple-circle.png"
                  alt="Split Lease Logo"
                  className="mobile-logo-icon"
                  width="28"
                  height="28"
                />
              </a>
              <a href="/search" className="filter-toggle-btn explore-rentals-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Explore Rentals</span>
              </a>

              {/* Mobile Header Actions - Auth-aware elements */}
              <div className="mobile-header-actions">
                {isLoggedIn && currentUser ? (
                  <>
                    {/* Favorites Heart - Active state since we're on favorites page */}
                    <a href="/favorite-listings" className="mobile-favorites-link active" aria-label="My Favorite Listings">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="#FF6B35"
                        stroke="#FF6B35"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {listings.length > 0 && (
                        <span className="mobile-favorites-badge">{listings.length}</span>
                      )}
                    </a>

                    {/* Logged In Avatar */}
                    <LoggedInAvatar
                      user={currentUser}
                      currentPath="/favorite-listings"
                      onNavigate={handleNavigate}
                      onLogout={handleLogout}
                      size="small"
                    />
                  </>
                ) : (
                  /* Hamburger menu for logged out users */
                  <button
                    className="hamburger-menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                  >
                    <span>Menu</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ROW 2: Map Button Row */}
            <div className="mobile-map-row">
              <button className="map-toggle-btn" onClick={() => setMobileMapVisible(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" strokeWidth="2" />
                </svg>
                <span>Map</span>
              </button>
            </div>

            {/* Listings content */}
            <div className="listings-content">
              {isLoading && <LoadingState />}

              {!isLoading && error && (
                <ErrorState message={error} onRetry={() => window.location.reload()} />
              )}

              {!isLoading && !error && listings.length === 0 && (
                <EmptyState
                  ctaText="Explore Rentals"
                  ctaLink="/search"
                />
              )}

              {!isLoading && !error && listings.length > 0 && (
                <ListingsGridV2
                  listings={listings}
                  onOpenContactModal={handleOpenContactModal}
                  isLoggedIn={isLoggedIn}
                  onToggleFavorite={handleToggleFavorite}
                  userId={userId}
                  proposalsByListingId={proposalsByListingId}
                  onCreateProposal={handleOpenProposalModal}
                  onPhotoClick={handlePhotoGalleryOpen}
                  onMapClick={() => setMobileMapVisible(true)}
                  viewMode={viewMode}
                />
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: Map with V6 header */}
          <section className="map-column">
            {/* V6 Map Header - Simple label with zoom controls */}
            <div className="v6-map-header">
              <div className="map-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <span>Map</span>
              </div>
              <div className="zoom-controls">
                <button
                  className="zoom-btn"
                  onClick={() => mapRef.current?.zoomIn?.()}
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  className="zoom-btn"
                  onClick={() => mapRef.current?.zoomOut?.()}
                  aria-label="Zoom out"
                >
                  −
                </button>
              </div>
            </div>

            <GoogleMap
              ref={mapRef}
              listings={[]} // No background listings on favorites page
              filteredListings={listings}
              selectedListing={null}
              selectedBorough={null}
              onMarkerClick={(listing) => {
                console.log('Marker clicked:', listing.title);
              }}
              onMessageClick={(listing) => {
                handleOpenContactModal(listing);
              }}
              isLoggedIn={isLoggedIn}
              favoritedListingIds={favoritedListingIds}
              onToggleFavorite={handleToggleFavorite}
              showMessageButton={showMessageButton}
            />
          </section>
        </main>
      </div>

      {/* Modals */}
      <ContactHostMessaging
        isOpen={isContactModalOpen}
        onClose={handleCloseContactModal}
        listing={selectedListing}
        onLoginRequired={() => {
          handleCloseContactModal();
          setShowAuthModal(true);
        }}
      />
      <InformationalText
        isOpen={isInfoModalOpen}
        onClose={handleCloseInfoModal}
        listing={selectedListing}
        triggerRef={infoModalTriggerRef}
        title="Pricing Information"
        content={informationalTexts['Price Starts']?.desktop || ''}
        expandedContent={informationalTexts['Price Starts']?.desktopPlus}
        showMoreAvailable={informationalTexts['Price Starts']?.showMore}
      />

      {/* Mobile Map Modal */}
      {mobileMapVisible && (
        <div className="mobile-map-modal">
          <div className="mobile-map-header">
            <button
              className="mobile-map-close-btn"
              onClick={() => setMobileMapVisible(false)}
              aria-label="Close map"
            >
              ✕
            </button>
            <h2>Map View</h2>
          </div>
          <div className="mobile-map-content">
            <GoogleMap
              ref={mapRef}
              listings={[]}
              filteredListings={listings}
              selectedListing={null}
              selectedBorough={null}
              onMarkerClick={(listing) => {
                console.log('Marker clicked:', listing.title);
              }}
              onMessageClick={(listing) => {
                handleOpenContactModal(listing);
              }}
              isLoggedIn={isLoggedIn}
              favoritedListingIds={favoritedListingIds}
              onToggleFavorite={handleToggleFavorite}
              showMessageButton={showMessageButton}
            />
          </div>
        </div>
      )}

      {/* Create Proposal Modal - V2 */}
      {isProposalModalOpen && selectedListingForProposal && (
        <CreateProposalFlowV2
          listing={{
            ...selectedListingForProposal,
            Name: selectedListingForProposal.title || selectedListingForProposal.Name,
            host: selectedListingForProposal.host || null
          }}
          moveInDate={moveInDate}
          daysSelected={selectedDayObjects}
          nightsSelected={selectedDayObjects.length > 0 ? selectedDayObjects.length - 1 : 0}
          reservationSpan={reservationSpan}
          pricingBreakdown={priceBreakdown}
          zatConfig={zatConfig}
          isFirstProposal={!loggedInUserData || loggedInUserData.proposalCount === 0}
          useFullFlow={true}
          existingUserData={loggedInUserData ? {
            needForSpace: loggedInUserData.needForSpace || '',
            aboutYourself: loggedInUserData.aboutMe || '',
            hasUniqueRequirements: !!loggedInUserData.specialNeeds,
            uniqueRequirements: loggedInUserData.specialNeeds || ''
          } : null}
          onClose={() => {
            setIsProposalModalOpen(false);
            setSelectedListingForProposal(null);
          }}
          onSubmit={handleProposalSubmit}
          isSubmitting={isSubmittingProposal}
        />
      )}

      {/* Auth Modal for Proposal Submission */}
      {showAuthModal && (
        <SignUpLoginModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setPendingProposalData(null);
          }}
          initialView="signup-step1"
          onAuthSuccess={handleAuthSuccess}
          defaultUserType="guest"
          skipReload={true}
        />
      )}

      {/* Proposal Success Modal */}
      {showSuccessModal && (
        <ProposalSuccessModal
          proposalId={successProposalId}
          listingName={selectedListingForProposal?.title || selectedListingForProposal?.Name}
          hasSubmittedRentalApp={loggedInUserData?.hasSubmittedRentalApp ?? false}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessProposalId(null);
            setSelectedListingForProposal(null);
          }}
        />
      )}

      {/* Fullscreen Photo Gallery Modal */}
      {showPhotoModal && selectedListingPhotos.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowPhotoModal(false)}
        >
          {/* Close X Button - Top Right */}
          <button
            onClick={() => setShowPhotoModal(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1002
            }}
          >
            ×
          </button>

          {/* Main Image */}
          <img
            src={selectedListingPhotos[currentPhotoIndex]}
            alt={`${selectedListingName} - photo ${currentPhotoIndex + 1}`}
            style={{
              maxWidth: '95vw',
              maxHeight: '75vh',
              objectFit: 'contain',
              marginBottom: '5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation Controls */}
          <div style={{
            position: 'absolute',
            bottom: '4rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            zIndex: 1001
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : selectedListingPhotos.length - 1));
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              ← Previous
            </button>

            <span style={{
              color: 'white',
              fontSize: '0.75rem',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {currentPhotoIndex + 1} / {selectedListingPhotos.length}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPhotoIndex(prev => (prev < selectedListingPhotos.length - 1 ? prev + 1 : 0));
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              Next →
            </button>
          </div>

          {/* Close Button - Bottom Center */}
          <button
            onClick={() => setShowPhotoModal(false)}
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              border: 'none',
              color: '#1f2937',
              padding: '0.5rem 2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              zIndex: 1001
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Pre-footer divider bar */}
      <div className="favorites-prefooter-bar"></div>

      {/* Standard Site Footer */}
      <Footer />
    </>
  );
};

export default FavoriteListingsPage;
