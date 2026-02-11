/**
 * RatingBreakdown Component
 *
 * Displays individual category ratings in an expandable/collapsible format.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import './RatingBreakdown.css';

export default function RatingBreakdown({ ratings = [], defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!ratings || ratings.length === 0) {
    return null;
  }

  return (
    <div className="rating-breakdown">
      <button
        type="button"
        className="rating-breakdown__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span>Rating Details</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className="rating-breakdown__content">
          {ratings.map((rating, index) => (
            <div key={rating.category || index} className="rating-breakdown__item">
              <span className="rating-breakdown__category">
                {rating.categoryLabel || rating.category}
              </span>
              <div className="rating-breakdown__rating">
                <div className="rating-breakdown__stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={12}
                      className={`rating-breakdown__star ${
                        star <= rating.rating ? 'rating-breakdown__star--filled' : ''
                      }`}
                    />
                  ))}
                </div>
                <span className="rating-breakdown__value">{rating.rating}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
