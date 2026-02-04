/**
 * ReviewStarDisplay Component
 *
 * Read-only star rating display.
 * Shows filled/empty stars based on the rating value.
 */

import React from 'react';
import { Star } from 'lucide-react';
import './ReviewStarDisplay.css';

export default function ReviewStarDisplay({
  rating,
  maxStars = 5,
  size = 16,
  showValue = true,
  className = ''
}) {
  // Round to nearest 0.5
  const roundedRating = Math.round(rating * 2) / 2;

  return (
    <div className={`review-star-display ${className}`}>
      <div className="review-star-display__stars" aria-label={`${rating} out of ${maxStars} stars`}>
        {Array.from({ length: maxStars }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= roundedRating;
          const isHalf = !isFilled && starValue - 0.5 === roundedRating;

          return (
            <span
              key={index}
              className={`review-star-display__star ${
                isFilled ? 'review-star-display__star--filled' : ''
              } ${isHalf ? 'review-star-display__star--half' : ''}`}
            >
              <Star size={size} />
            </span>
          );
        })}
      </div>
      {showValue && rating > 0 && (
        <span className="review-star-display__value">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
