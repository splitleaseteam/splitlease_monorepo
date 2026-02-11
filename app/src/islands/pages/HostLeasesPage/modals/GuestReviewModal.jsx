/**
 * GuestReviewModal Component
 *
 * Modal for hosts to submit reviews for guests after completed stays.
 */
import { useState, useEffect } from 'react';
import { X, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { formatStayPeriod } from '../formatters.js';

/**
 * StarRating component for rating input
 */
function StarRating({ value, onChange, label }) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="hl-star-rating">
      <label className="hl-star-rating-label">{label}</label>
      <div className="hl-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`hl-star ${star <= (hoverValue || value) ? 'hl-star-filled' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star size={24} />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * GuestReviewModal allows hosts to submit reviews for guests
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Object} props.stay - The stay being reviewed
 * @param {Function} props.onClose - Close modal handler
 * @param {Function} props.onSubmit - Submit review handler
 */
export function GuestReviewModal({ isOpen, stay, onClose, onSubmit }) {
  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [houseRulesRating, setHouseRulesRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setOverallRating(0);
      setCleanlinessRating(0);
      setCommunicationRating(0);
      setHouseRulesRating(0);
      setReviewText('');
      setWouldRecommend(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (overallRating === 0) {
      return; // Require at least overall rating
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        stayId: stay?.id,
        overallRating,
        cleanlinessRating: cleanlinessRating || null,
        communicationRating: communicationRating || null,
        houseRulesRating: houseRulesRating || null,
        reviewText: reviewText.trim() || null,
        wouldRecommend,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const stayPeriod = stay ? formatStayPeriod(stay.checkInNight, stay.lastNight) : '';

  return (
    <div className="hl-modal-backdrop" onClick={handleBackdropClick}>
      <div className="hl-modal hl-review-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
        {/* Modal Header */}
        <div className="hl-modal-header">
          <h2 id="review-modal-title" className="hl-modal-title">
            Review Guest
          </h2>
          <button
            type="button"
            className="hl-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form className="hl-modal-body" onSubmit={handleSubmit}>
          {stayPeriod && (
            <p className="hl-review-stay-period">
              Stay: Week {stay?.weekNumber} ({stayPeriod})
            </p>
          )}

          {/* Overall Rating (Required) */}
          <div className="hl-review-section">
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              label="Overall Rating *"
            />
          </div>

          {/* Category Ratings (Optional) */}
          <div className="hl-review-categories">
            <StarRating
              value={cleanlinessRating}
              onChange={setCleanlinessRating}
              label="Cleanliness"
            />
            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label="Communication"
            />
            <StarRating
              value={houseRulesRating}
              onChange={setHouseRulesRating}
              label="Following House Rules"
            />
          </div>

          {/* Written Review */}
          <div className="hl-review-section">
            <label htmlFor="review-text" className="hl-review-label">
              Written Review (Optional)
            </label>
            <textarea
              id="review-text"
              className="hl-review-textarea"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this guest..."
              rows={4}
              maxLength={1000}
            />
            <span className="hl-review-char-count">
              {reviewText.length}/1000
            </span>
          </div>

          {/* Would Recommend */}
          <div className="hl-review-section">
            <label className="hl-review-label">Would you recommend this guest?</label>
            <div className="hl-recommend-buttons">
              <button
                type="button"
                className={`hl-recommend-btn ${wouldRecommend === true ? 'hl-recommend-yes' : ''}`}
                onClick={() => setWouldRecommend(true)}
              >
                <ThumbsUp size={18} />
                Yes
              </button>
              <button
                type="button"
                className={`hl-recommend-btn ${wouldRecommend === false ? 'hl-recommend-no' : ''}`}
                onClick={() => setWouldRecommend(false)}
              >
                <ThumbsDown size={18} />
                No
              </button>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="hl-modal-footer">
          <button
            type="button"
            className="hl-btn hl-btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="hl-btn hl-btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || overallRating === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GuestReviewModal;
