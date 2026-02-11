/**
 * Guest Leases Page
 *
 * Follows the Hollow Component Pattern:
 * - This component contains ONLY JSX rendering
 * - ALL business logic is in useGuestLeasesPageLogic hook
 *
 * Architecture:
 * - Islands Architecture (independent React root)
 * - Uses shared Header/Footer components
 * - Four-Layer Logic Architecture via hook
 *
 * Features:
 * - View all leases with expand/collapse cards
 * - Check-in/checkout flow with messaging
 * - Date change request management
 * - Payment records history
 * - Flexibility score display
 * - Document downloads (PTA, supplemental, CC auth)
 * - Emergency assistance
 *
 * Authentication:
 * - Page requires authenticated Guest user
 * - User ID comes from session, NOT URL
 * - Redirects to home if not authenticated or not a Guest
 */

import Header from '../shared/Header.jsx';
import Footer from '../shared/Footer.jsx';
import { useGuestLeasesPageLogic } from './guest-leases/useGuestLeasesPageLogic.js';
import LeaseCard from './guest-leases/LeaseCard.jsx';
import CheckInCheckOutFlow from './guest-leases/CheckInCheckOutFlow.jsx';

// Hybrid Design Components (Charles Eames style)
import HeroSection from './guest-leases/HeroSection.jsx';
import CelebrationBanner from './guest-leases/CelebrationBanner.jsx';
// StatusSummary removed - payment/document badges hidden per design

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

function LoadingState() {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      <p>Loading your leases...</p>
    </div>
  );
}

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

function ErrorState({ error, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <div className="error-icon" aria-hidden="true">!</div>
      <h2>Something went wrong</h2>
      <p className="error-message">{error}</p>
      <button className="retry-button" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <h2>No Leases Yet</h2>
      <p>You don&apos;t have any active leases.</p>
      <p className="empty-subtext">
        Browse listings and submit a proposal to get started with your first rental.
      </p>
      <a
        href="/search"
        className="btn btn-primary"
        style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}
      >
        Browse Listings
      </a>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GuestLeasesPage() {
  const {
    // Auth state
    authState,

    // Raw data
    user,
    leases,

    // Computed values (hybrid design)
    nextStay,
    nextStayHost,
    nextStayListing,
    paymentsStatus,
    documentsStatus,
    celebrationBanner,

    // UI state
    expandedLeaseId,
    checkInOutModal,
    isLoading,
    error,

    // Handlers - Lease card
    handleToggleExpand,
    handleRetry,

    // Handlers - Check-in/checkout
    handleCheckInOut,
    handleCloseCheckInOutModal,
    handleSendMessage,
    handleImOnMyWay,
    handleImHere,
    handleSubmitPhotos,
    handleLeavingProperty,

    // Handlers - Reviews
    handleSubmitReview,
    handleSeeReview,

    // Handlers - Date changes
    handleDateChangeApprove,
    handleDateChangeReject,
    handleRequestDateChange,

    // Handlers - Documents
    handleDownloadDocument,

    // Handlers - Other
    handleEmergencyAssistance,
    handleSeeReputation,

    // Handlers - Hybrid design
    handleDismissCelebration,
    handleViewStayDetails
  } = useGuestLeasesPageLogic();

  // Don't render content if redirecting (auth failed)
  if (authState.shouldRedirect) {
    return (
      <>
        <Header />
        <main className="main-content">
          <div className="guest-leases-page">
            <LoadingState />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <Header />

      <main className="main-content" role="main" id="main-content">
        <h1 className="sr-only">Your Leases</h1>

        <div className="guest-leases-page">
          <div className="page-container">
            {/* Page Header */}
            {user && (
              <div className="page-header">
                <h1 className="page-title">
                  {user.firstName}&apos;s Leases
                </h1>
              </div>
            )}

            {/* Loading State */}
            {isLoading && <LoadingState />}

            {/* Error State */}
            {!isLoading && error && (
              <ErrorState error={error} onRetry={handleRetry} />
            )}

            {/* Empty State */}
            {!isLoading && !error && leases.length === 0 && (
              <EmptyState />
            )}

            {/* Content with Hybrid Design */}
            {!isLoading && !error && leases.length > 0 && (
              <>
                {/* Celebration Banner (Charles Style) */}
                <CelebrationBanner
                  title={celebrationBanner.title}
                  message={celebrationBanner.message}
                  isVisible={celebrationBanner.isVisible}
                  onDismiss={handleDismissCelebration}
                />

                {/* Hero Section (Charles Style) */}
                <HeroSection
                  nextStay={nextStay}
                  listingName={nextStayListing?.name}
                  totalStays={nextStay?.lease?.stays?.length || 0}
                  onViewDetails={handleViewStayDetails}
                />

                {/* Leases List (Paula Style cards) */}
                <div className="section-header">Your Leases</div>
                <div className="leases-list">
                  {leases.map(lease => (
                    <LeaseCard
                      key={lease._id}
                      lease={lease}
                      isExpanded={expandedLeaseId === lease._id}
                      currentUserId={user?._id}
                      onToggleExpand={() => handleToggleExpand(lease._id)}
                      onCheckInOut={handleCheckInOut}
                      onSubmitReview={handleSubmitReview}
                      onSeeReview={handleSeeReview}
                      onDateChangeApprove={handleDateChangeApprove}
                      onDateChangeReject={handleDateChangeReject}
                      onRequestDateChange={handleRequestDateChange}
                      onDownloadDocument={handleDownloadDocument}
                      onEmergencyAssistance={handleEmergencyAssistance}
                      onSeeReputation={handleSeeReputation}
                      data-lease-id={lease._id}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Check-in/Checkout Modal */}
      <CheckInCheckOutFlow
        isOpen={checkInOutModal.isOpen}
        mode={checkInOutModal.mode}
        stay={checkInOutModal.stay}
        onClose={handleCloseCheckInOutModal}
        onSendMessage={handleSendMessage}
        onImOnMyWay={handleImOnMyWay}
        onImHere={handleImHere}
        onSubmitPhotos={handleSubmitPhotos}
        onSubmitReview={handleSubmitReview}
        onLeavingProperty={handleLeavingProperty}
      />
    </>
  );
}
