/**
 * Host Leases Page
 *
 * Follows the Hollow Component Pattern:
 * - This component contains ONLY JSX rendering
 * - ALL business logic is in useHostLeasesPageLogic hook
 *
 * Features:
 * - Listing tabs for filtering leases
 * - Expandable lease cards with payment records, stays, date changes
 * - Guest review submission
 * - PDF document links
 *
 * Architecture:
 * - Islands Architecture (independent React root)
 * - Uses shared Header/Footer components
 * - Four-Layer Logic Architecture via hook
 *
 * Authentication:
 * - Page requires authenticated Host user
 * - User ID comes from session, NOT URL
 * - Redirects to home if not authenticated or not a Host
 */

import { useMemo, useCallback } from 'react';
import { FileText } from 'lucide-react';
import Header from '../../shared/Header.jsx';
import Footer from '../../shared/Footer.jsx';
import { useHostLeasesPageLogic } from './useHostLeasesPageLogic.js';

// Components
import ListingTabs from './components/ListingTabs.jsx';
import LeaseCard from './components/LeaseCard.jsx';
import EmptyState from './components/EmptyState.jsx';
import GuestReviewModal from './modals/GuestReviewModal.jsx';
import DateChangeDetailModal from './modals/DateChangeDetailModal.jsx';

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

function LoadingState() {
  return (
    <div className="hl-loading-state" role="status" aria-live="polite">
      <div className="hl-spinner" aria-hidden="true"></div>
      <p>Loading your leases...</p>
    </div>
  );
}

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

function ErrorState({ error, onRetry }) {
  return (
    <div className="hl-error-state" role="alert">
      <div className="hl-error-icon" aria-hidden="true">!</div>
      <h2 className="hl-error-title">Something went wrong</h2>
      <p className="hl-error-text">{error}</p>
      <button className="hl-btn hl-btn-primary" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HostLeasesPage() {
  const {
    // Auth state
    authState,

    // Data
    user,
    listings,
    selectedListing,
    leases,

    // UI state
    isLoading,
    error,

    // Expansion state
    expandedSections,

    // Modal state
    isReviewModalOpen,
    reviewTargetStay,
    isDateChangeModalOpen,
    selectedDateChangeRequest,

    // Lease counts
    leaseCountsByListing,

    // Handlers
    handleListingChange,
    handleExpandSection,
    handleCollapseSection,
    handleToggleShowAllStays,
    handleToggleShowDetails,
    handleAcceptDateChangeRequest,
    handleDeclineDateChangeRequest,
    handleOpenReviewModal,
    handleCloseReviewModal,
    handleSubmitGuestReview,
    handleViewDateChangeDetails,
    handleCloseDateChangeModal,
    handleOpenDocument,
    handleRetry,
  } = useHostLeasesPageLogic();

  // Create handlers object for lease cards
  const cardHandlers = useMemo(() => ({
    onToggleDetails: handleToggleShowDetails,
    onToggleAllStays: handleToggleShowAllStays,
    onAcceptDateChange: handleAcceptDateChangeRequest,
    onDeclineDateChange: handleDeclineDateChangeRequest,
    onViewDateChangeDetails: handleViewDateChangeDetails,
    onOpenReview: handleOpenReviewModal,
    onOpenDocument: handleOpenDocument,
  }), [
    handleToggleShowDetails,
    handleToggleShowAllStays,
    handleAcceptDateChangeRequest,
    handleDeclineDateChangeRequest,
    handleViewDateChangeDetails,
    handleOpenReviewModal,
    handleOpenDocument,
  ]);

  // Handle listing change (also reset expanded sections)
  const handleListingChangeWrapper = useCallback((listingId) => {
    handleListingChange(listingId);
  }, [handleListingChange]);

  // Don't render content if redirecting (auth failed)
  if (authState.shouldRedirect) {
    return (
      <div className="host-leases-page">
        <Header />
        <main className="main-content">
          <div className="hl-page">
            <LoadingState />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const selectedListingId = selectedListing?.id;
  const selectedListingName = selectedListing?.title || selectedListing?.name;
  const hasLeases = leases && leases.length > 0;

  return (
    <div className="host-leases-page">
      <Header />

      <main className="main-content" role="main" id="main-content">
        <h1 className="sr-only">Host Leases Dashboard</h1>
        <div className="hl-page">
          {/* Page Header */}
          <div className="hl-page-header">
            <div className="hl-page-header-top">
              <h2 className="hl-page-title" aria-label={`Leases${selectedListingName ? ` for ${selectedListingName}` : ''}`}>
                <FileText size={28} className="hl-page-title-icon" />
                My Leases
              </h2>
            </div>

            {/* Listing Tabs */}
            {!isLoading && !error && listings && listings.length > 0 && (
              <nav aria-label="Listing filter">
                <ListingTabs
                  listings={listings}
                  selectedListingId={selectedListingId}
                  onListingChange={handleListingChangeWrapper}
                  leaseCountsByListing={leaseCountsByListing}
                />
              </nav>
            )}
          </div>

          {/* Loading State */}
          {isLoading && <LoadingState />}

          {/* Error State */}
          {!isLoading && error && (
            <ErrorState error={error} onRetry={handleRetry} />
          )}

          {/* Content - Lease Cards */}
          {!isLoading && !error && (
            <>
              {hasLeases ? (
                <div className="hl-lease-cards">
                  {leases.map(lease => (
                    <LeaseCard
                      key={lease.id}
                      lease={lease}
                      expanded={expandedSections[lease.id] || {}}
                      handlers={cardHandlers}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState listingName={selectedListingName} />
              )}
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Guest Review Modal */}
      <GuestReviewModal
        isOpen={isReviewModalOpen}
        stay={reviewTargetStay}
        onClose={handleCloseReviewModal}
        onSubmit={handleSubmitGuestReview}
      />

      {/* Date Change Detail Modal */}
      <DateChangeDetailModal
        isOpen={isDateChangeModalOpen}
        request={selectedDateChangeRequest}
        onClose={handleCloseDateChangeModal}
        onAccept={handleAcceptDateChangeRequest}
        onDecline={handleDeclineDateChangeRequest}
      />
    </div>
  );
}
