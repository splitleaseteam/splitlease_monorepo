/**
 * Step 8: Review & Activate - preview and submit
 */
import React from 'react';
import type { FormData } from '../types';
import { HOST_TYPES, WEEKLY_PATTERNS } from '../types';

interface Step8Props {
  formData: FormData;
  nightlyPricesRef: React.MutableRefObject<number[]>;
  getScheduleText: () => { text: string; error: boolean };
  handleInfoClick: (tooltipId: string) => (e: React.MouseEvent) => void;
  scheduleInfoRef: React.RefObject<HTMLButtonElement>;
  isSubmitting: boolean;
  handleSubmit: () => void;
  onBack: () => void;
}

export const Step8Review: React.FC<Step8Props> = ({
  formData,
  nightlyPricesRef,
  getScheduleText,
  handleInfoClick,
  scheduleInfoRef,
  isSubmitting,
  handleSubmit,
  onBack,
}) => {
  let priceDisplay: string;
  let freq: string;
  let schedule: string;

  if (formData.leaseStyle === 'nightly') {
    const maxPrice = nightlyPricesRef.current[0] || formData.nightlyBaseRate;
    const minPrice = nightlyPricesRef.current[6] || maxPrice;
    priceDisplay = `$${minPrice} - $${maxPrice}`;
    freq = 'Night';
    schedule = getScheduleText().text;
  } else if (formData.leaseStyle === 'weekly') {
    priceDisplay = `$${formData.price}`;
    freq = 'Week';
    const pattern = WEEKLY_PATTERNS.find(p => p.value === formData.weeklyPattern);
    schedule = `Weekly: ${pattern?.label || formData.weeklyPattern}`;
  } else {
    priceDisplay = `$${formData.price}`;
    freq = 'Month';
    schedule = 'Monthly Agreement';
  }

  // Get host type label
  const hostTypeLabel = HOST_TYPES.find(h => h.id === formData.hostType)?.id || formData.hostType;
  const hostTypeDisplay = hostTypeLabel.charAt(0).toUpperCase() + hostTypeLabel.slice(1);

  return (
    <div className="section-card section-card-review">
      <h2>Review & Activate</h2>
      <p className="subtitle">Your listing is ready to go live on our network.</p>

      {/* Market Strategy Badge */}
      <div className="review-badge-row">
        <span
          className="review-market-badge"
          style={{ background: formData.marketStrategy === 'private' ? '#31135D' : '#6D31C2' }}
        >
          {formData.marketStrategy === 'private' ? 'Private (Concierge)' : 'Public Listing'}
        </span>
      </div>

      {/* Main Preview Card - Search Card Style */}
      <div className="review-listing-card">
        {/* Image Section - Left */}
        <div className="review-listing-images">
          {formData.photos.length > 0 ? (
            <img src={formData.photos[0].url} alt="Listing preview" />
          ) : (
            <div className="review-photo-placeholder">
              <span>No photos uploaded</span>
            </div>
          )}
        </div>

        {/* Content Section - Right */}
        <div className="review-listing-content">
          {/* Top Row: Verified Badge (guest preview) */}
          <div className="review-listing-top-row">
            <span className="review-listing-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Verified
            </span>
          </div>

          {/* Location */}
          <div className="review-listing-location-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{formData.address.neighborhood || formData.address.city || 'New York'}, Manhattan</span>
          </div>

          {/* Title */}
          <h3 className="review-listing-title">
            {formData.bedrooms === 'Studio' ? 'Studio' : `${formData.bedrooms} Bedroom`} | {formData.typeOfSpace || 'Private Room'}
          </h3>

          {/* Property Details Row */}
          <div className="review-listing-specs">
            <span>{formData.typeOfSpace || 'Private Room'}</span>
            <span className="spec-dot">·</span>
            <span>2 guests</span>
            <span className="spec-dot">·</span>
            <span>{formData.bedrooms === 'Studio' ? 'Studio' : formData.bedrooms + ' bedroom'}</span>
            <span className="spec-dot">·</span>
            <span>{formData.bathrooms} bath</span>
          </div>

          {/* Price Row */}
          <div className="review-listing-price-row">
            <span className="review-price-amount">{priceDisplay}</span>
            <span className="review-price-period">/ {freq.toLowerCase()}</span>
            {formData.leaseStyle === 'nightly' ? (
              <button
                type="button"
                ref={scheduleInfoRef}
                className="review-price-from review-price-info-trigger"
                onClick={handleInfoClick('schedule')}
                aria-label="Schedule information"
              >
                {schedule}
                <svg className="review-price-info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
            ) : (
              <span className="review-price-from">{schedule}</span>
            )}
          </div>

          {/* Host Name */}
          <div className="review-listing-host">
            Hosted by <span className="review-host-name">You</span>
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button
          className="btn-next btn-success"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Activating...' : 'Activate Listing'}
        </button>
        <button className="btn-back" onClick={onBack} disabled={isSubmitting}>Back</button>
      </div>
    </div>
  );
};
