/**
 * ReviewsOverviewPage - Hollow Component (Presentational Only)
 *
 * Central hub for managing reviews in the Split Lease platform.
 * All logic lives in useReviewsOverviewPageLogic hook.
 * This component only renders UI based on state from the hook.
 *
 * Three-tab interface:
 * - Pending: Reviews user needs to write
 * - Received: Reviews others wrote about user
 * - Submitted: Reviews user has written
 */

import { useReviewsOverviewPageLogic } from './useReviewsOverviewPageLogic';
import Header from '../../shared/Header';
import Footer from '../../shared/Footer';
import {
  TabNavigation,
  PendingReviewCard,
  ReceivedReviewCard,
  SubmittedReviewCard,
  EmptyState
} from './components';
import { CreateReviewModal, ViewReviewModal } from './modals';
import './ReviewsOverviewPage.css';

export default function ReviewsOverviewPage() {
  const logic = useReviewsOverviewPageLogic();

  const {
    // Auth state
    authState,
    user,

    // Tab state
    activeTab,
    handleTabChange,

    // Data
    pendingReviews,
    receivedReviews,
    submittedReviews,
    averageReceivedRating,

    // Loading/error
    isLoading,
    error,
    handleRetry,

    // Modal state
    createReviewModal,
    viewReviewModal,
    handleOpenCreateReview,
    handleCloseCreateReview,
    handleSubmitReview,
    handleOpenViewReview,
    handleCloseViewReview,

    // Counts
    pendingCount,
    receivedCount,
    submittedCount
  } = logic;

  // Loading state
  if (authState.isChecking) {
    return (
      <div className="reviews-overview-page">
        <Header />
        <main className="reviews-overview-page__container">
          <div className="reviews-overview-page__loading">
            <div className="reviews-overview-page__spinner" />
            <p>Checking authentication...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="reviews-overview-page">
        <Header />
        <main className="reviews-overview-page__container">
          <div className="reviews-overview-page__error">
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button onClick={handleRetry} className="reviews-overview-page__btn">
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Render tab content based on active tab
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="reviews-overview-page__loading">
          <div className="reviews-overview-page__spinner" />
          <p>Loading reviews...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'pending':
        return pendingReviews.length > 0 ? (
          <div className="reviews-overview-page__list">
            {pendingReviews.map(review => (
              <PendingReviewCard
                key={review.stayId}
                review={review}
                onCreateReview={() => handleOpenCreateReview(review)}
              />
            ))}
          </div>
        ) : (
          <EmptyState type="pending" />
        );

      case 'received':
        return receivedReviews.length > 0 ? (
          <>
            {averageReceivedRating && (
              <div className="reviews-overview-page__summary">
                <span className="reviews-overview-page__average-label">Your Average Rating</span>
                <div className="reviews-overview-page__average-value">
                  <span className="reviews-overview-page__average-number">{averageReceivedRating}</span>
                  <span className="reviews-overview-page__average-max">/ 5</span>
                </div>
              </div>
            )}
            <div className="reviews-overview-page__list">
              {receivedReviews.map(review => (
                <ReceivedReviewCard
                  key={review.reviewId}
                  review={review}
                  onViewDetails={() => handleOpenViewReview(review)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState type="received" />
        );

      case 'submitted':
        return submittedReviews.length > 0 ? (
          <div className="reviews-overview-page__list">
            {submittedReviews.map(review => (
              <SubmittedReviewCard
                key={review.reviewId}
                review={review}
                onViewDetails={() => handleOpenViewReview(review)}
              />
            ))}
          </div>
        ) : (
          <EmptyState type="submitted" />
        );

      default:
        return null;
    }
  };

  return (
    <div className="reviews-overview-page">
      <Header />

      <main className="reviews-overview-page__container">
        <header className="reviews-overview-page__header">
          <h1 className="reviews-overview-page__title">Reviews</h1>
          <p className="reviews-overview-page__subtitle">
            Manage your reviews and see feedback from others
          </p>
        </header>

        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={{
            pending: pendingCount,
            received: receivedCount,
            submitted: submittedCount
          }}
        />

        <section className="reviews-overview-page__content" role="tabpanel" id={`${activeTab}-panel`}>
          {renderTabContent()}
        </section>
      </main>

      <Footer />

      {/* Create Review Modal */}
      <CreateReviewModal
        isOpen={createReviewModal.isOpen}
        review={createReviewModal.review}
        userType={user?.userType}
        onClose={handleCloseCreateReview}
        onSubmit={handleSubmitReview}
        isSubmitting={createReviewModal.isSubmitting}
      />

      {/* View Review Modal */}
      <ViewReviewModal
        isOpen={viewReviewModal.isOpen}
        review={viewReviewModal.review}
        onClose={handleCloseViewReview}
      />
    </div>
  );
}
