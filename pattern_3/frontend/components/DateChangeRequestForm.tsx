/**
 * PATTERN 3: PRICE ANCHORING - DateChangeRequestForm Component
 * Complete date change request form with tier-based price anchoring
 */

import React, { useState, useMemo } from 'react';
import type {
  OriginalBooking,
  UserProfile,
  DateChangeRequestData,
  PriceTierId,
} from '../types';
import {
  getRecommendedTier,
  calculateTierPrice,
  getAnchorContext,
} from '../utils';
import PriceTierSelector from './PriceTierSelector';

// ============================================================================
// PROPS
// ============================================================================

interface DateChangeRequestFormProps {
  originalBooking: OriginalBooking;
  userProfile?: UserProfile;
  onSubmit: (data: DateChangeRequestData) => void;
  onCancel?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * DateChangeRequestForm Component
 *
 * Complete form for submitting date change requests with price anchoring
 *
 * @example
 * ```tsx
 * <DateChangeRequestForm
 *   originalBooking={booking}
 *   userProfile={profile}
 *   onSubmit={(data) => submitRequest(data)}
 * />
 * ```
 */
export const DateChangeRequestForm: React.FC<DateChangeRequestFormProps> = ({
  originalBooking,
  userProfile,
  onSubmit,
  onCancel,
}) => {
  // ========================================================================
  // STATE
  // ========================================================================

  const [newStartDate, setNewStartDate] = useState<string>('');
  const [newEndDate, setNewEndDate] = useState<string>('');
  const [offerPrice, setOfferPrice] = useState<number>(originalBooking.price);
  const [selectedTier, setSelectedTier] = useState<PriceTierId>('recommended');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ========================================================================
  // CALCULATIONS
  // ========================================================================

  /**
   * Calculate base price (could factor in new dates, seasonality, etc.)
   */
  const basePrice = useMemo(() => {
    // In real app, calculate based on new dates, seasonality, etc.
    // For now, use original price as base
    return originalBooking.price;
  }, [originalBooking.price]);

  /**
   * Calculate urgency based on how soon the new dates are
   */
  const urgency = useMemo((): 'low' | 'medium' | 'high' => {
    if (!newStartDate) return 'low';

    const daysUntil = Math.floor(
      (new Date(newStartDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 7) return 'high';
    if (daysUntil < 30) return 'medium';
    return 'low';
  }, [newStartDate]);

  /**
   * Get recommended tier based on user context
   */
  const recommendedTier = useMemo(() => {
    return getRecommendedTier({
      urgency,
      budget: userProfile?.budgetPreference,
      history: userProfile?.offerHistory,
    });
  }, [urgency, userProfile]);

  /**
   * Savings context for price display
   */
  const savingsContext = useMemo(() => {
    return {
      originalPrice: originalBooking.price,
      guestSaved: originalBooking.price - offerPrice,
      sellerEarned: offerPrice,
    };
  }, [originalBooking.price, offerPrice]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  /**
   * Handle price tier change
   */
  const handlePriceChange = (price: number, tierId: PriceTierId) => {
    setOfferPrice(price);
    setSelectedTier(tierId);

    // Clear price error
    if (errors.price) {
      setErrors((prev) => ({ ...prev, price: '' }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newStartDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!newEndDate) {
      newErrors.endDate = 'End date is required';
    }

    if (newStartDate && newEndDate && new Date(newStartDate) >= new Date(newEndDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (offerPrice <= 0) {
      newErrors.price = 'Offer price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const anchorContext = getAnchorContext(offerPrice, basePrice, originalBooking.price);

    const requestData: DateChangeRequestData = {
      newDates: {
        start: new Date(newStartDate),
        end: new Date(newEndDate),
      },
      offerPrice,
      selectedTier,
      anchorContext,
      basePrice,
      customMessage: customMessage.trim() || undefined,
    };

    onSubmit(requestData);
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <form
      className="date-change-request-form"
      onSubmit={handleSubmit}
      style={{
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Original Booking Info */}
        <div
          style={{
            padding: '20px',
            background: '#F9FAFB',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
          }}
        >
          <h4
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#1A1A1A',
              marginBottom: '12px',
            }}
          >
            Current Booking
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Current dates:</span>
              <span style={{ fontWeight: 500 }}>
                {originalBooking.startDate.toLocaleDateString()} -{' '}
                {originalBooking.endDate.toLocaleDateString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Current price:</span>
              <span style={{ fontWeight: 600 }}>${originalBooking.price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* New Dates Selection */}
        <div>
          <h4
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#1A1A1A',
              marginBottom: '16px',
            }}
          >
            New Dates
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Start Date */}
            <div>
              <label
                htmlFor="startDate"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.startDate ? '#EF4444' : '#D1D5DB'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
              {errors.startDate && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#EF4444' }}>
                  {errors.startDate}
                </div>
              )}
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="endDate"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                min={newStartDate || new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.endDate ? '#EF4444' : '#D1D5DB'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
              {errors.endDate && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#EF4444' }}>
                  {errors.endDate}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Tier Selector */}
        <div>
          <PriceTierSelector
            basePrice={basePrice}
            currentPrice={offerPrice}
            onPriceChange={handlePriceChange}
            savingsContext={savingsContext}
            defaultTier={recommendedTier}
            showCustomOption={true}
          />
          {errors.price && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#EF4444' }}>
              {errors.price}
            </div>
          )}
        </div>

        {/* Anchor Summary */}
        <div
          style={{
            padding: '20px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '12px',
          }}
        >
          <h4
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#1E40AF',
              marginBottom: '12px',
            }}
          >
            Your Offer Summary
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
              }}
            >
              <span style={{ color: '#1E40AF' }}>Original booking:</span>
              <span style={{ fontWeight: 500, color: '#1E3A8A' }}>
                ${originalBooking.price.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
              }}
            >
              <span style={{ color: '#1E40AF' }}>Your offer:</span>
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#1E3A8A' }}>
                ${offerPrice.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid #BFDBFE',
                fontSize: '14px',
              }}
            >
              <span style={{ color: '#1E40AF' }}>You save:</span>
              <span style={{ fontWeight: 700, color: '#10B981' }}>
                ${savingsContext.guestSaved.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Message */}
        <div>
          <label
            htmlFor="message"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px',
            }}
          >
            Message to Host (Optional)
          </label>
          <textarea
            id="message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a personal message to explain your request..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            style={{
              padding: '12px 32px',
              background: '#3B82F6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563EB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3B82F6';
            }}
          >
            Submit{' '}
            {selectedTier === 'premium' ? 'Priority' : selectedTier === 'budget' ? 'Budget' : ''}{' '}
            Request
          </button>
        </div>
      </div>
    </form>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default DateChangeRequestForm;
