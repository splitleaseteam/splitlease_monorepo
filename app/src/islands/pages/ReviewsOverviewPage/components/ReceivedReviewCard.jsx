/**
 * ReceivedReviewCard Component
 *
 * Card for received reviews showing reviewer info, rating, and comment preview.
 */

import React from 'react';
import { Calendar, Eye, User } from 'lucide-react';
import ReviewStarDisplay from './ReviewStarDisplay';
import { formatReviewDate, formatDateRange } from '../../../../logic/processors/reviews/reviewOverviewAdapter.js';
import './ReceivedReviewCard.css';

export default function ReceivedReviewCard({ review, onViewDetails }) {
  const {
    listingName,
    checkInDate,
    checkOutDate,
    reviewerName,
    reviewerImageUrl,
    overallRating,
    comment,
    createdAt
  } = review;

  const truncatedComment = comment && comment.length > 150
    ? `${comment.substring(0, 150)}...`
    : comment;

  return (
    <article className="received-review-card">
      <div className="received-review-card__header">
        <div className="received-review-card__reviewer">
          {reviewerImageUrl ? (
            <img
              src={reviewerImageUrl}
              alt={reviewerName}
              className="received-review-card__avatar"
            />
          ) : (
            <div className="received-review-card__avatar-placeholder">
              <User size={20} />
            </div>
          )}
          <div className="received-review-card__reviewer-info">
            <span className="received-review-card__reviewer-name">{reviewerName}</span>
            <span className="received-review-card__date">{formatReviewDate(createdAt)}</span>
          </div>
        </div>

        <ReviewStarDisplay rating={overallRating} size={18} />
      </div>

      <div className="received-review-card__listing">
        <Calendar size={14} />
        <span>{listingName} ({formatDateRange(checkInDate, checkOutDate)})</span>
      </div>

      {comment && (
        <p className="received-review-card__comment">
          "{truncatedComment}"
        </p>
      )}

      <button
        type="button"
        className="received-review-card__view-btn"
        onClick={onViewDetails}
      >
        <Eye size={16} />
        View Full Review
      </button>
    </article>
  );
}
