/**
 * SubmittedReviewCard Component
 *
 * Card for reviews the user has submitted, showing reviewee and their rating.
 */

import React from 'react';
import { Calendar, Eye, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReviewStarDisplay from './ReviewStarDisplay';
import { formatReviewDate, formatDateRange } from '../../../../logic/processors/reviews/reviewOverviewAdapter.js';
import './SubmittedReviewCard.css';

export default function SubmittedReviewCard({ review, onViewDetails }) {
  const {
    listingName,
    checkInDate,
    checkOutDate,
    revieweeName,
    revieweeImageUrl,
    overallRating,
    comment,
    wouldRecommend,
    createdAt
  } = review;

  const truncatedComment = comment && comment.length > 150
    ? `${comment.substring(0, 150)}...`
    : comment;

  return (
    <article className="submitted-review-card">
      <div className="submitted-review-card__header">
        <div className="submitted-review-card__reviewee">
          {revieweeImageUrl ? (
            <img
              src={revieweeImageUrl}
              alt={revieweeName}
              className="submitted-review-card__avatar"
            />
          ) : (
            <div className="submitted-review-card__avatar-placeholder">
              <User size={20} />
            </div>
          )}
          <div className="submitted-review-card__reviewee-info">
            <span className="submitted-review-card__reviewee-label">You reviewed:</span>
            <span className="submitted-review-card__reviewee-name">{revieweeName}</span>
          </div>
        </div>

        <div className="submitted-review-card__rating-section">
          <ReviewStarDisplay rating={overallRating} size={18} />
          {wouldRecommend !== null && (
            <span className={`submitted-review-card__recommend ${wouldRecommend ? 'submitted-review-card__recommend--yes' : 'submitted-review-card__recommend--no'}`}>
              {wouldRecommend ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
              {wouldRecommend ? 'Recommended' : 'Not Recommended'}
            </span>
          )}
        </div>
      </div>

      <div className="submitted-review-card__listing">
        <Calendar size={14} />
        <span>{listingName} ({formatDateRange(checkInDate, checkOutDate)})</span>
      </div>

      {comment && (
        <p className="submitted-review-card__comment">
          "{truncatedComment}"
        </p>
      )}

      <div className="submitted-review-card__footer">
        <span className="submitted-review-card__date">
          Submitted {formatReviewDate(createdAt)}
        </span>
        <button
          type="button"
          className="submitted-review-card__view-btn"
          onClick={onViewDetails}
        >
          <Eye size={16} />
          View Details
        </button>
      </div>
    </article>
  );
}
