/**
 * ViewReviewModal Component
 *
 * Modal for viewing full review details including all category ratings.
 */

import { X, Calendar, User, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import ReviewStarDisplay from '../components/ReviewStarDisplay';
import { formatReviewDate, formatDateRange } from '../../../../logic/processors/reviews/reviewOverviewAdapter.js';
import './ViewReviewModal.css';

export default function ViewReviewModal({ isOpen, review, onClose }) {
  if (!isOpen || !review) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isReceived = !!review.reviewerName;

  return (
    <div className="view-review-modal__backdrop" onClick={handleBackdropClick}>
      <div className="view-review-modal" role="dialog" aria-modal="true">
        <header className="view-review-modal__header">
          <h2>Review Details</h2>
          <button
            type="button"
            className="view-review-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="view-review-modal__body">
          {/* Stay Context */}
          <div className="view-review-modal__context">
            <div className="view-review-modal__listing-info">
              {review.listingImageUrl && (
                <img
                  src={review.listingImageUrl}
                  alt=""
                  className="view-review-modal__listing-image"
                />
              )}
              <div>
                <h3 className="view-review-modal__listing-name">{review.listingName}</h3>
                <p className="view-review-modal__dates">
                  <Calendar size={14} />
                  {formatDateRange(review.checkInDate, review.checkOutDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Reviewer/Reviewee Info */}
          <div className="view-review-modal__person">
            <div className="view-review-modal__person-avatar">
              {(isReceived ? review.reviewerImageUrl : review.revieweeImageUrl) ? (
                <img
                  src={isReceived ? review.reviewerImageUrl : review.revieweeImageUrl}
                  alt=""
                />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="view-review-modal__person-info">
              <span className="view-review-modal__person-label">
                {isReceived ? 'Reviewed by' : 'You reviewed'}
              </span>
              <span className="view-review-modal__person-name">
                {isReceived ? review.reviewerName : review.revieweeName}
              </span>
              <span className="view-review-modal__person-date">
                {formatReviewDate(review.createdAt)}
              </span>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="view-review-modal__overall-rating">
            <span className="view-review-modal__overall-label">Overall Rating</span>
            <ReviewStarDisplay rating={review.overallRating} size={24} />
          </div>

          {/* Would Recommend */}
          {review.wouldRecommend !== null && (
            <div className={`view-review-modal__recommend ${
              review.wouldRecommend
                ? 'view-review-modal__recommend--yes'
                : 'view-review-modal__recommend--no'
            }`}>
              {review.wouldRecommend ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
              <span>
                {review.wouldRecommend ? 'Would recommend' : 'Would not recommend'}
              </span>
            </div>
          )}

          {/* Comment */}
          {review.comment && (
            <div className="view-review-modal__comment">
              <h4>Written Review</h4>
              <p>&quot;{review.comment}&quot;</p>
            </div>
          )}

          {/* Rating Breakdown */}
          {review.ratingDetails && review.ratingDetails.length > 0 && (
            <div className="view-review-modal__breakdown">
              <h4>Category Ratings</h4>
              <div className="view-review-modal__breakdown-list">
                {review.ratingDetails.map((rating, index) => (
                  <div key={rating.category || index} className="view-review-modal__breakdown-item">
                    <span className="view-review-modal__breakdown-category">
                      {rating.categoryLabel || rating.category}
                    </span>
                    <div className="view-review-modal__breakdown-rating">
                      <div className="view-review-modal__breakdown-stars">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={14}
                            className={`view-review-modal__breakdown-star ${
                              star <= rating.rating ? 'view-review-modal__breakdown-star--filled' : ''
                            }`}
                          />
                        ))}
                      </div>
                      <span className="view-review-modal__breakdown-value">{rating.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="view-review-modal__footer">
          <button
            type="button"
            className="view-review-modal__btn"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
