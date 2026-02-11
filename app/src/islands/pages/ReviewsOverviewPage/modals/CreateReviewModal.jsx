/**
 * CreateReviewModal Component
 *
 * Modal for creating new reviews with star rating input for each category.
 * Supports both host reviewing guest and guest reviewing host flows.
 */

import { useState, useEffect } from 'react';
import { X, Star, ThumbsUp, ThumbsDown, Calendar } from 'lucide-react';
import { REVIEW_CATEGORIES } from '../../../../logic/constants/reviewCategories.js';
import { GUEST_REVIEW_CATEGORIES } from '../../../../logic/constants/guestReviewCategories.js';
import { formatDateRange } from '../../../../logic/processors/reviews/reviewOverviewAdapter.js';
import './CreateReviewModal.css';

/**
 * StarRatingInput - Interactive star rating selector
 */
function StarRatingInput({ value, onChange, label, question }) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="star-rating-input">
      <label className="star-rating-input__label">{label}</label>
      {question && <p className="star-rating-input__question">{question}</p>}
      <div className="star-rating-input__stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-rating-input__star ${
              star <= (hoverValue || value) ? 'star-rating-input__star--filled' : ''
            }`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star size={28} />
          </button>
        ))}
        {value > 0 && (
          <span className="star-rating-input__value">{value}/5</span>
        )}
      </div>
    </div>
  );
}

export default function CreateReviewModal({
  isOpen,
  review,
  userType,
  onClose,
  onSubmit,
  isSubmitting = false
}) {
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Get categories based on user type
  const categories = userType === 'Host' ? REVIEW_CATEGORIES : GUEST_REVIEW_CATEGORIES;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRatings({});
      setComment('');
      setWouldRecommend(null);
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen || !review) return null;

  const handleRatingChange = (categoryId, value) => {
    setRatings(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate at least one rating
    if (Object.keys(ratings).length === 0) {
      return;
    }

    const ratingsArray = Object.entries(ratings).map(([category, rating]) => ({
      category,
      rating
    }));

    onSubmit({
      stayId: review.stayId,
      ratings: ratingsArray,
      comment: comment.trim(),
      wouldRecommend
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const canSubmit = Object.keys(ratings).length > 0 && !isSubmitting;

  return (
    <div className="create-review-modal__backdrop" onClick={handleBackdropClick}>
      <div className="create-review-modal" role="dialog" aria-modal="true">
        <header className="create-review-modal__header">
          <div>
            <h2>Review {review.revieweeName}</h2>
            <span className="create-review-modal__subtitle">
              {review.revieweeType === 'host' ? 'Rate your host' : 'Rate your guest'}
            </span>
          </div>
          <button
            type="button"
            className="create-review-modal__close"
            onClick={onClose}
            aria-label="Close"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </header>

        <form className="create-review-modal__body" onSubmit={handleSubmit}>
          {/* Stay Context */}
          <div className="create-review-modal__context">
            <div className="create-review-modal__listing">
              {review.listingImageUrl && (
                <img src={review.listingImageUrl} alt="" className="create-review-modal__listing-image" />
              )}
              <div>
                <p className="create-review-modal__listing-name">{review.listingName}</p>
                <p className="create-review-modal__dates">
                  <Calendar size={14} />
                  {formatDateRange(review.checkInDate, review.checkOutDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Ratings Section */}
          <div className="create-review-modal__ratings">
            <h3>Rate your experience</h3>
            {categories.map(category => (
              <StarRatingInput
                key={category.id}
                value={ratings[category.id] || 0}
                onChange={(value) => handleRatingChange(category.id, value)}
                label={category.title}
                question={category.question}
              />
            ))}
          </div>

          {/* Comment Section */}
          <div className="create-review-modal__comment">
            <label htmlFor="review-comment">Written Review (Optional)</label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about your experience..."
              rows={4}
              maxLength={1000}
              disabled={isSubmitting}
            />
            <span className="create-review-modal__char-count">{comment.length}/1000</span>
          </div>

          {/* Recommend Section */}
          <div className="create-review-modal__recommend">
            <label>Would you recommend this {review.revieweeType === 'host' ? 'host' : 'guest'}?</label>
            <div className="create-review-modal__recommend-buttons">
              <button
                type="button"
                className={`create-review-modal__recommend-btn ${
                  wouldRecommend === true ? 'create-review-modal__recommend-btn--yes' : ''
                }`}
                onClick={() => setWouldRecommend(true)}
                disabled={isSubmitting}
              >
                <ThumbsUp size={18} />
                Yes
              </button>
              <button
                type="button"
                className={`create-review-modal__recommend-btn ${
                  wouldRecommend === false ? 'create-review-modal__recommend-btn--no' : ''
                }`}
                onClick={() => setWouldRecommend(false)}
                disabled={isSubmitting}
              >
                <ThumbsDown size={18} />
                No
              </button>
            </div>
          </div>
        </form>

        <footer className="create-review-modal__footer">
          <button
            type="button"
            className="create-review-modal__btn create-review-modal__btn--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="create-review-modal__btn create-review-modal__btn--primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </footer>
      </div>
    </div>
  );
}
