/**
 * SearchPage Component - REFACTORED
 *
 * Following the "Hollow Component" pattern - this component is a UI shell.
 * All business logic delegated to hooks:
 * - useSearchPageLogic: listings, filters, geography, modals, fallback
 * - useSearchPageAuth: auth state, favorites, proposals
 * - useSearchPageUI: UI state, effects, computed values, handlers
 *
 * REFACTORED FROM: ~1,595 lines
 * REFACTORED TO: ~340 lines (logic/state/render extracted)
 *
 * EXTRACTED COMPONENTS (SearchPage/components/):
 * - FilterSection: Desktop filter bar, popup modal, filter tags row
 * - MobileFilterSheet: Mobile bottom sheet filter UI
 * - MapColumn: Right column with logo, auth navigation, GoogleMap
 * - MobileMapModal: Full-screen mobile map overlay
 * - SearchModals: All modal components (contact, info, AI, auth, proposal, success)
 * - SearchListingsGrid: Property card grid with lazy loading
 * - SearchLoadingState, SearchErrorState, SearchEmptyState: Status displays
 *
 * EXTRACTED HOOKS:
 * - useSearchPageUI: UI state, effects, computed values, handlers
 *
 * SECURITY: All user IDs derived from JWT via useAuthenticatedUser hook
 */

import { logger } from '../../lib/logger.js';
import CompactScheduleIndicator from './SearchPage/components/CompactScheduleIndicator.jsx';
import MobileFilterBar from './SearchPage/components/MobileFilterBar.jsx';
import ListingDetailDrawer from './SearchPage/components/ListingDetailDrawer.jsx';
import UsabilityPopup from '../shared/UsabilityPopup/UsabilityPopup.jsx';

// Extracted render sections
import FilterSection from './SearchPage/components/FilterSection.jsx';
import MobileFilterSheet from './SearchPage/components/MobileFilterSheet.jsx';
import MapColumn from './SearchPage/components/MapColumn.jsx';
import MobileMapModal from './SearchPage/components/MobileMapModal.jsx';
import SearchModals from './SearchPage/components/SearchModals.jsx';
import SearchListingsGrid from './SearchPage/components/SearchListingsGrid.jsx';
import SearchLoadingState from './SearchPage/components/SearchLoadingState.jsx';
import SearchErrorState from './SearchPage/components/SearchErrorState.jsx';
import SearchEmptyState from './SearchPage/components/SearchEmptyState.jsx';

// HOOKS - Hollow Component Pattern
import { useSearchPageLogic } from './useSearchPageLogic.js';
import { useSearchPageAuth } from './useSearchPageAuth.js';
import { useSearchPageUI } from './useSearchPageUI.jsx';

// ============================================================================
// Main SearchPage Component
// ============================================================================

export default function SearchPage() {
  // ==========================================================================
  // HOOKS
  // ==========================================================================
  const logic = useSearchPageLogic();
  const auth = useSearchPageAuth();
  const ui = useSearchPageUI({ logic, auth });

  // Destructure for readability in JSX
  const {
    isLoading, error,
    allActiveListings, allListings, displayedListings, hasMore,
    fallbackListings, fallbackDisplayedListings, isFallbackLoading, hasFallbackMore, handleFallbackLoadMore,
    boroughs, neighborhoods,
    selectedBoroughs, selectedNeighborhoods, weekPattern, priceTier, sortBy, neighborhoodSearch,
    filterPanelActive, menuOpen, mobileMapVisible,
    isContactModalOpen, isInfoModalOpen, isAIResearchModalOpen,
    selectedListing, infoModalTriggerRef, informationalTexts,
    mapRef,
    setSelectedBoroughs, setSelectedNeighborhoods, setWeekPattern, setPriceTier, setSortBy, setNeighborhoodSearch,
    handleResetFilters, setFilterPanelActive, setMenuOpen, setMobileMapVisible,
    handleLoadMore, fetchListings,
    handleOpenContactModal, handleCloseContactModal,
    handleOpenInfoModal, handleCloseInfoModal,
    handleOpenAIResearchModal, handleCloseAIResearchModal,
    isDetailDrawerOpen, detailDrawerListing, handleOpenDetailDrawer, handleCloseDetailDrawer,
    pricePercentiles,
  } = logic;

  const {
    isLoggedIn, currentUser, authUserId, authenticatedUser,
    favoritesCount, favoritedListingIds, handleToggleFavorite,
    proposalsByListingId, zatConfig, loggedInUserData,
    reservationSpanForProposal,
    pendingProposalData, setPendingProposalData,
    showSuccessModal, setShowSuccessModal,
    successProposalId, setSuccessProposalId,
    showAuthModalForProposal, setShowAuthModalForProposal,
  } = auth;

  const {
    isAuthModalOpen, setIsAuthModalOpen, authModalView, setAuthModalView,
    isCreateProposalModalOpen,
    selectedListingForProposal, setSelectedListingForProposal,
    selectedDayObjectsForProposal, moveInDateForProposal,
    selectedNightsCount,
    filterPopupOpen, mobileHeaderHidden, desktopHeaderCollapsed,
    toast, setToast, menuRef,
    checkInOutDays, activeFilterTags, showCreateProposalButton, showMessageButton,
    listingsGridSharedProps,
    toggleFilterPopup, closeFilterPopup, clearAllFilters,
    handleNavigate, handleLogout,
    scrollToListingCard, handleMobileMarkerClick,
    handleRequireAuth,
    handleOpenCreateProposalModal, handleCloseCreateProposalModal,
    handleCreateProposalSubmit, handleAuthSuccessForProposal,
    isSubmittingProposal,
  } = ui;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="search-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type} show`}>
            <div className="toast-content">
              <h4 className="toast-title">{toast.message}</h4>
            </div>
            <button
              className="toast-close"
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              aria-label="Close notification"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Two-column layout: Listings (left) + Map (right) */}
      <main className="two-column-layout">
        {/* LEFT COLUMN: Listings with filters */}
        <section className={`listings-column ${mobileHeaderHidden ? 'listings-column--header-hidden' : ''}`}>
          {/* Mobile Filter Bar */}
          <MobileFilterBar
            onFilterClick={() => setFilterPanelActive(!filterPanelActive)}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            favoritesCount={favoritesCount}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            onOpenAuthModal={() => {
              setAuthModalView('login');
              setIsAuthModalOpen(true);
            }}
            isHidden={mobileHeaderHidden}
            isExpanded={filterPanelActive}
          />

          {/* Floating Map Button - Mobile only */}
          <button
            className="mobile-map-fab"
            onClick={() => setMobileMapVisible(true)}
            aria-label="Open map view"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
            <span>Map</span>
          </button>

          {/* Mobile Schedule Selector */}
          <div className={`mobile-schedule-selector ${mobileHeaderHidden ? 'mobile-schedule-selector--hidden' : ''}`}>
            <div className="filter-group schedule-selector-group" id="schedule-selector-mount-point-mobile">
            </div>
          </div>

          {/* Compact Schedule Indicator */}
          <CompactScheduleIndicator isVisible={mobileHeaderHidden} />

          {/* Desktop Filters: filter bar, tags, popup */}
          <FilterSection
            boroughs={boroughs}
            selectedBoroughs={selectedBoroughs}
            setSelectedBoroughs={setSelectedBoroughs}
            neighborhoods={neighborhoods}
            selectedNeighborhoods={selectedNeighborhoods}
            setSelectedNeighborhoods={setSelectedNeighborhoods}
            weekPattern={weekPattern}
            setWeekPattern={setWeekPattern}
            priceTier={priceTier}
            setPriceTier={setPriceTier}
            neighborhoodSearch={neighborhoodSearch}
            setNeighborhoodSearch={setNeighborhoodSearch}
            filterPopupOpen={filterPopupOpen}
            toggleFilterPopup={toggleFilterPopup}
            closeFilterPopup={closeFilterPopup}
            clearAllFilters={clearAllFilters}
            activeFilterTags={activeFilterTags}
            checkInOutDays={checkInOutDays}
            desktopHeaderCollapsed={desktopHeaderCollapsed}
          />

          {/* Mobile Filter Bottom Sheet */}
          {filterPanelActive && (
            <MobileFilterSheet
              boroughs={boroughs}
              selectedBoroughs={selectedBoroughs}
              setSelectedBoroughs={setSelectedBoroughs}
              neighborhoods={neighborhoods}
              selectedNeighborhoods={selectedNeighborhoods}
              setSelectedNeighborhoods={setSelectedNeighborhoods}
              weekPattern={weekPattern}
              setWeekPattern={setWeekPattern}
              priceTier={priceTier}
              setPriceTier={setPriceTier}
              neighborhoodSearch={neighborhoodSearch}
              setNeighborhoodSearch={setNeighborhoodSearch}
              onClose={() => setFilterPanelActive(false)}
              clearAllFilters={clearAllFilters}
              resultsCount={allListings.length}
            />
          )}

          {/* Results header */}
          <div className={`results-header ${mobileHeaderHidden ? 'results-header--hidden' : ''} ${desktopHeaderCollapsed ? 'results-header--desktop-hidden' : ''}`}>
            <span className="results-count">
              <strong>{allListings.length} listings</strong> in {selectedBoroughs.length === 0 ? 'NYC' : selectedBoroughs.length === 1 ? (boroughs.find(b => b.value === selectedBoroughs[0])?.name || 'NYC') : `${selectedBoroughs.length} boroughs`}
            </span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="most-viewed">Most Viewed</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>

          {/* Listings content */}
          <div className="listings-content">
            {isLoading && <SearchLoadingState />}

            {!isLoading && error && (
              <SearchErrorState message={error} onRetry={fetchListings} />
            )}

            {!isLoading && !error && allListings.length === 0 && (
              <>
                <SearchEmptyState onResetFilters={handleResetFilters} />

                {isFallbackLoading && (
                  <div className="fallback-loading">
                    <p>Loading all available listings...</p>
                  </div>
                )}

                {!isFallbackLoading && fallbackListings.length > 0 && (
                  <div className="fallback-listings-section">
                    <div className="fallback-header">
                      <h3>Browse All Available Listings</h3>
                      <p>Showing {fallbackListings.length} listings across all NYC boroughs</p>
                    </div>
                    <SearchListingsGrid
                      listings={fallbackDisplayedListings}
                      onLoadMore={handleFallbackLoadMore}
                      hasMore={hasFallbackMore}
                      isLoading={false}
                      isPaused={isDetailDrawerOpen}
                      {...listingsGridSharedProps}
                    />
                  </div>
                )}
              </>
            )}

            {!isLoading && !error && allListings.length > 0 && (
              <SearchListingsGrid
                listings={displayedListings}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoading={isLoading}
                isPaused={isDetailDrawerOpen}
                {...listingsGridSharedProps}
              />
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Map */}
        <MapColumn
          ref={mapRef}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          favoritesCount={favoritesCount}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onOpenAuthModal={() => {
            setAuthModalView('login');
            setIsAuthModalOpen(true);
          }}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          menuRef={menuRef}
          allActiveListings={allActiveListings}
          allListings={allListings}
          selectedBoroughs={selectedBoroughs}
          selectedNightsCount={selectedNightsCount}
          onMarkerClick={scrollToListingCard}
          onMessageClick={handleOpenContactModal}
          onAIResearchClick={handleOpenAIResearchModal}
          favoritedListingIds={favoritedListingIds}
          onToggleFavorite={handleToggleFavorite}
          authUserId={authUserId}
          onRequireAuth={handleRequireAuth}
          showMessageButton={showMessageButton}
        />
      </main>

      {/* Modals */}
      <SearchModals
        isContactModalOpen={isContactModalOpen}
        handleCloseContactModal={handleCloseContactModal}
        selectedListing={selectedListing}
        handleRequireAuth={handleRequireAuth}
        isInfoModalOpen={isInfoModalOpen}
        handleCloseInfoModal={handleCloseInfoModal}
        infoModalTriggerRef={infoModalTriggerRef}
        informationalTexts={informationalTexts}
        isAIResearchModalOpen={isAIResearchModalOpen}
        handleCloseAIResearchModal={handleCloseAIResearchModal}
        isAuthModalOpen={isAuthModalOpen}
        setIsAuthModalOpen={setIsAuthModalOpen}
        authModalView={authModalView}
        isCreateProposalModalOpen={isCreateProposalModalOpen}
        selectedListingForProposal={selectedListingForProposal}
        moveInDateForProposal={moveInDateForProposal}
        selectedDayObjectsForProposal={selectedDayObjectsForProposal}
        reservationSpanForProposal={reservationSpanForProposal}
        zatConfig={zatConfig}
        loggedInUserData={loggedInUserData}
        handleCloseCreateProposalModal={handleCloseCreateProposalModal}
        handleCreateProposalSubmit={handleCreateProposalSubmit}
        isSubmittingProposal={isSubmittingProposal}
        showAuthModalForProposal={showAuthModalForProposal}
        setShowAuthModalForProposal={setShowAuthModalForProposal}
        setPendingProposalData={setPendingProposalData}
        handleAuthSuccessForProposal={handleAuthSuccessForProposal}
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        successProposalId={successProposalId}
        setSuccessProposalId={setSuccessProposalId}
        setSelectedListingForProposal={setSelectedListingForProposal}
        logger={logger}
      />

      {/* Mobile Map Modal */}
      {mobileMapVisible && (
        <MobileMapModal
          ref={mapRef}
          onClose={() => setMobileMapVisible(false)}
          allActiveListings={allActiveListings}
          allListings={allListings}
          selectedBoroughs={selectedBoroughs}
          selectedNightsCount={selectedNightsCount}
          onMarkerClick={handleMobileMarkerClick}
          onMessageClick={handleOpenContactModal}
          onAIResearchClick={handleOpenAIResearchModal}
          isLoggedIn={isLoggedIn}
          favoritedListingIds={favoritedListingIds}
          onToggleFavorite={handleToggleFavorite}
          authUserId={authUserId}
          onRequireAuth={handleRequireAuth}
          showMessageButton={showMessageButton}
        />
      )}

      {/* Listing Detail Drawer */}
      <ListingDetailDrawer
        isOpen={isDetailDrawerOpen}
        listing={detailDrawerListing}
        onClose={handleCloseDetailDrawer}
        onOpenContactModal={handleOpenContactModal}
        onOpenCreateProposalModal={handleOpenCreateProposalModal}
        showCreateProposalButton={showCreateProposalButton}
        proposalsByListingId={proposalsByListingId}
        selectedNightsCount={selectedNightsCount}
        isLoggedIn={isLoggedIn}
        favoritedListingIds={favoritedListingIds}
        onToggleFavorite={handleToggleFavorite}
        userId={authUserId}
        onRequireAuth={handleRequireAuth}
        pricePercentiles={pricePercentiles}
      />

      <UsabilityPopup userData={authenticatedUser} />
    </div>
  );
}
