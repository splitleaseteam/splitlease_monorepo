/**
 * PendingReviewCard Component
 *
 * Card for pending reviews showing stay details and "Create Review" action.
 * Displays days until review window expires.
 */

import React from 'react';
import { Calendar, Star, Clock, User } from 'lucide-react';
import { formatDateRange } from '../../../../logic/processors/reviews/reviewOverviewAdapter.js';
import './PendingReviewCard.css';

export default function PendingReviewCard({ review, onCreateReview }) {
  const {
    listingName,
    listingImageUrl,
    checkInDate,
    checkOutDate,
    weekNumber,
    revieweeName,
    revieweeType,
    daysUntilExpiry
  } = review;

  const isUrgent = daysUntilExpiry && daysUntilExpiry <= 3;

  return (
    <article className="pending-review-card">
      <div className="pending-review-card__image">
        {listingImageUrl ? (
          <img src={listingImageUrl} alt={listingName} loading="lazy" />
        ) : (
          <div className="pending-review-card__image-placeholder">
            <Star size={24} />
          </div>
        )}
      </div>

      <div className="pending-review-card__content">
        <h3 className="pending-review-card__title">{listingName}</h3>

        <div className="pending-review-card__meta">
          <span className="pending-review-card__dates">
            <Calendar size={14} />
            {formatDateRange(checkInDate, checkOutDate)}
          </span>
          {weekNumber && (
            <span className="pending-review-card__week">Week {weekNumber}</span>
          )}
        </div>

        <div className="pending-review-card__reviewee">
          <User size={14} />
          <span>
            Review for: <strong>{revieweeName}</strong>
            <span className="pending-review-card__reviewee-type">({revieweeType})</span>
          </span>
        </div>

        {daysUntilExpiry && (
          <div className={`pending-review-card__expiry ${isUrgent ? 'pending-review-card__expiry--urgent' : ''}`}>
            <Clock size={14} />
            <span>
              {daysUntilExpiry === 1
                ? '1 day left to review'
                : `${daysUntilExpiry} days left to review`}
            </span>
          </div>
        )}
      </div>

      <div className="pending-review-card__actions">
        <button
          type="button"
          className="pending-review-card__btn"
          onClick={onCreateReview}
        >
          <Star size={16} />
          Create Review
        </button>
      </div>
    </article>
  );
}
