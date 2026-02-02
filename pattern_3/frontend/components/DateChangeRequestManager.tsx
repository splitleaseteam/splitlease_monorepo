/**
 * PATTERN 3: PRICE ANCHORING - DateChangeRequestManager Component
 * Complete manager for date change request flow with price anchoring
 */

import React, { useState, useEffect } from 'react';
import type { OriginalBooking, UserProfile, DateChangeRequestData } from '../types';
import DateChangeRequestForm from './DateChangeRequestForm';

// ============================================================================
// PROPS
// ============================================================================

interface DateChangeRequestManagerProps {
  bookingId: string;
  userType: 'buyer' | 'seller';
  userProfile?: UserProfile;
  onRequestSubmitted?: (data: DateChangeRequestData) => void;
}

// ============================================================================
// MOCK API (replace with real API calls)
// ============================================================================

const mockApi = {
  getBooking: async (bookingId: string): Promise<OriginalBooking> => {
    // Mock booking data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: bookingId,
          price: 450,
          startDate: new Date('2026-10-15'),
          endDate: new Date('2026-10-20'),
          guestName: 'John Doe',
          propertyName: 'Cozy Downtown Apartment',
        });
      }, 300);
    });
  },

  submitDateChangeRequest: async (data: DateChangeRequestData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          requestId: 'req_' + Math.random().toString(36).substr(2, 9),
          status: 'pending',
          ...data,
        });
      }, 500);
    });
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * DateChangeRequestManager Component
 *
 * Complete manager for buyer/seller date change request workflow
 *
 * @example
 * ```tsx
 * <DateChangeRequestManager
 *   bookingId="booking_123"
 *   userType="buyer"
 *   userProfile={profile}
 *   onRequestSubmitted={(data) => handleSubmit(data)}
 * />
 * ```
 */
export const DateChangeRequestManager: React.FC<DateChangeRequestManagerProps> = ({
  bookingId,
  userType,
  userProfile,
  onRequestSubmitted,
}) => {
  // ========================================================================
  // STATE
  // ========================================================================

  const [step, setStep] = useState<'loading' | 'form' | 'submitted' | 'error'>('loading');
  const [booking, setBooking] = useState<OriginalBooking | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  /**
   * Load booking on mount
   */
  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  /**
   * Load booking data
   */
  const loadBooking = async () => {
    try {
      setStep('loading');
      setError(null);

      const bookingData = await mockApi.getBooking(bookingId);
      setBooking(bookingData);
      setStep('form');
    } catch (err) {
      setError('Failed to load booking. Please try again.');
      setStep('error');
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: DateChangeRequestData) => {
    try {
      setStep('loading');

      const response = await mockApi.submitDateChangeRequest(data);
      setSubmittedRequest(response);
      setStep('submitted');

      // Callback
      if (onRequestSubmitted) {
        onRequestSubmitted(data);
      }

      // Track analytics
      trackEvent('date_change_request_submitted', {
        tier: data.selectedTier,
        price: data.offerPrice,
        anchorContext: data.anchorContext,
      });
    } catch (err) {
      setError('Failed to submit request. Please try again.');
      setStep('error');
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    // Navigate back or close modal
    console.log('Request cancelled');
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    if (booking) {
      setStep('form');
      setError(null);
    } else {
      loadBooking();
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div
      className="date-change-request-manager"
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '24px',
      }}
    >
      {/* Loading State */}
      {step === 'loading' && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #E5E7EB',
              borderTopColor: '#3B82F6',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Loading...</p>
        </div>
      )}

      {/* Form State */}
      {step === 'form' && booking && (
        <>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#1A1A1A',
                marginBottom: '8px',
              }}
            >
              Request Date Change
            </h2>
            <p style={{ fontSize: '15px', color: '#6B7280' }}>
              Choose your new dates and offer amount
            </p>
          </div>

          <DateChangeRequestForm
            originalBooking={booking}
            userProfile={userProfile}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </>
      )}

      {/* Submitted State */}
      {step === 'submitted' && submittedRequest && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
          }}
        >
          {/* Success Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#D1FAE5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
            }}
          >
            ✓
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#1A1A1A',
              marginBottom: '12px',
            }}
          >
            Request Submitted!
          </h3>

          {/* Message */}
          <p
            style={{
              fontSize: '15px',
              color: '#6B7280',
              marginBottom: '24px',
              maxWidth: '500px',
              margin: '0 auto 24px',
            }}
          >
            Your date change request has been sent to the host. You'll receive a notification
            when they respond.
          </p>

          {/* Summary */}
          <div
            style={{
              maxWidth: '400px',
              margin: '0 auto',
              padding: '20px',
              background: '#F9FAFB',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              textAlign: 'left',
            }}
          >
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1A1A1A',
                marginBottom: '12px',
              }}
            >
              Request Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>New dates:</span>
                <span style={{ fontWeight: 500 }}>
                  {submittedRequest.newDates.start.toLocaleDateString()} -{' '}
                  {submittedRequest.newDates.end.toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Offered price:</span>
                <span style={{ fontWeight: 700 }}>
                  ${submittedRequest.offerPrice.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B7280' }}>Tier:</span>
                <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                  {submittedRequest.selectedTier}
                  {submittedRequest.selectedTier === 'premium' && ' ⭐'}
                </span>
              </div>
            </div>
          </div>

          {/* Expected Response Time */}
          <div
            style={{
              marginTop: '24px',
              padding: '12px 20px',
              background: '#EFF6FF',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#1E40AF',
            }}
          >
            <strong>Expected response time:</strong>{' '}
            {submittedRequest.selectedTier === 'premium'
              ? '4 hours'
              : submittedRequest.selectedTier === 'budget'
              ? '48 hours'
              : '12 hours'}
          </div>
        </div>
      )}

      {/* Error State */}
      {step === 'error' && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
          }}
        >
          {/* Error Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
            }}
          >
            ⚠️
          </div>

          {/* Error Message */}
          <h3
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#1A1A1A',
              marginBottom: '12px',
            }}
          >
            Something Went Wrong
          </h3>

          <p
            style={{
              fontSize: '15px',
              color: '#6B7280',
              marginBottom: '24px',
            }}
          >
            {error || 'An unexpected error occurred. Please try again.'}
          </p>

          {/* Retry Button */}
          <button
            onClick={handleRetry}
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
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ANALYTICS HELPER
// ============================================================================

function trackEvent(eventName: string, data: any) {
  // In real app, send to analytics service
  console.log('📊 Analytics:', eventName, data);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DateChangeRequestManager;

// ============================================================================
// CSS KEYFRAMES (add to global CSS or styled-components)
// ============================================================================

/*
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
*/
