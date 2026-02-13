/**
 * PreviewPricing - Right column booking widget (display-only) for PreviewSplitLeasePage
 */

import ListingScheduleSelector from '../../shared/ListingScheduleSelector.jsx';
import { formatPrice } from '../../../lib/formatters.js';
import { SchedulePatternHighlight } from './PreviewHelpers.jsx';

export function PreviewPricing({
  listing,
  isMobile,
  nightsSelected,
  moveInDate,
  setMoveInDate,
  minMoveInDate,
  scheduleSelectorListing,
  selectedDayObjects,
  reservationSpan,
  setReservationSpan,
  zatConfig,
  handleScheduleChange,
  handlePriceChange
}) {
  return (
    <div
      className="booking-widget"
      style={{
        position: isMobile ? 'static' : 'sticky',
        top: isMobile ? 'auto' : 'calc(80px + 20px)',
        alignSelf: 'flex-start',
        maxHeight: 'calc(100vh - 80px - 40px)',
        overflowY: 'auto',
        height: 'fit-content',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '28px',
        background: 'white',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Preview Mode Indicator */}
      <div style={{
        background: 'linear-gradient(135deg, #f8f9ff 0%, #faf5ff 100%)',
        border: '1px solid #e9d5ff',
        borderRadius: '8px',
        padding: '10px 12px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7C3AED"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#5B21B6' }}>
          Host Preview - Guest View
        </span>
      </div>

      {/* Host Rate Display - Single Price */}
      <div style={{
        background: 'linear-gradient(135deg, #f8f9ff 0%, #faf5ff 100%)',
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '16px',
        border: '1px solid #e9d5ff'
      }}>
        {/* Show Weekly or Monthly rate if rental type is Weekly/Monthly */}
        {listing?.rental_type === 'Weekly' && listing?.weekly_rate_paid_to_host ? (
          <>
            <div style={{
              fontSize: '32px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #31135d 0%, #31135d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              display: 'inline-block'
            }}>
              ${listing.weekly_rate_paid_to_host}
              <span style={{
                fontSize: '16px',
                color: '#6B7280',
                fontWeight: '500',
                background: 'none',
                WebkitTextFillColor: '#6B7280'
              }}>/week</span>
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
              Your weekly host rate
            </div>
          </>
        ) : listing?.rental_type === 'Monthly' && listing?.monthly_rate_paid_to_host ? (
          <>
            <div style={{
              fontSize: '32px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #31135d 0%, #31135d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              display: 'inline-block'
            }}>
              ${listing.monthly_rate_paid_to_host}
              <span style={{
                fontSize: '16px',
                color: '#6B7280',
                fontWeight: '500',
                background: 'none',
                WebkitTextFillColor: '#6B7280'
              }}>/month</span>
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
              Your monthly host rate
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontSize: '32px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #31135d 0%, #31135d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              display: 'inline-block'
            }}>
              {(() => {
                // Get the host rate based on nights selected
                const rateKey = `nightly_rate_for_${nightsSelected}_night_stay`;
                const rate = listing?.[rateKey] || listing?.nightly_rate_for_4_night_stay;
                return rate ? `$${rate}` : 'Select Days';
              })()}
              <span style={{
                fontSize: '16px',
                color: '#6B7280',
                fontWeight: '500',
                background: 'none',
                WebkitTextFillColor: '#6B7280'
              }}>/night</span>
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
              Your rate for {nightsSelected} nights selected
            </div>
          </>
        )}
      </div>

      {/* Move-in Date */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{
          fontSize: '12px',
          fontWeight: '700',
          color: '#31135d',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Ideal Move-In
          <svg
            style={{ width: '16px', height: '16px', color: '#9CA3AF' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </label>
        <input
          type="date"
          value={moveInDate || ''}
          min={minMoveInDate}
          onChange={(e) => setMoveInDate(e.target.value)}
          className="preview-date-input"
        />
      </div>

      {/* Weekly Schedule Selector */}
      {scheduleSelectorListing && (
        <div style={{
          marginBottom: '14px',
          padding: '12px',
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
          borderRadius: '12px',
          border: '1px solid #E5E7EB'
        }}>
          <ListingScheduleSelector
            listing={scheduleSelectorListing}
            initialSelectedDays={selectedDayObjects}
            limitToFiveNights={false}
            reservationSpan={reservationSpan}
            zatConfig={zatConfig}
            onSelectionChange={handleScheduleChange}
            onPriceChange={handlePriceChange}
            showPricing={false}
          />
        </div>
      )}

      {/* Reservation Span */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          fontSize: '12px',
          fontWeight: '700',
          color: '#31135d',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Reservation Span
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={reservationSpan}
            onChange={(e) => setReservationSpan(Number(e.target.value))}
            className="preview-select-input"
          >
            {[6, 7, 8, 9, 10, 12, 13, 16, 17, 20, 22, 26].map(weeks => (
              <option key={weeks} value={weeks}>
                {weeks} weeks {weeks >= 12 ? `(${Math.floor(weeks / 4)} months)` : ''}
              </option>
            ))}
          </select>
          <div style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '0',
            height: '0',
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #31135d',
            pointerEvents: 'none'
          }}></div>
        </div>
        <SchedulePatternHighlight
          reservationSpan={reservationSpan}
          weeksOffered={listing?.weeks_offered_schedule_text}
        />
      </div>

      {/* Host Compensation Estimate */}
      <div style={{
        marginBottom: '12px',
        padding: '12px',
        background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
        borderRadius: '10px',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '15px',
          marginBottom: '8px'
        }}>
          <span style={{ color: '#111827', fontWeight: '500' }}>4-Week Compensation</span>
          <span style={{ color: '#111827', fontWeight: '700', fontSize: '16px' }}>
            {(() => {
              if (listing?.rental_type === 'Weekly' && listing?.weekly_rate_paid_to_host) {
                return formatPrice(listing.weekly_rate_paid_to_host * 4);
              } else if (listing?.rental_type === 'Monthly' && listing?.monthly_rate_paid_to_host) {
                return formatPrice(listing.monthly_rate_paid_to_host);
              } else {
                const rateKey = `nightly_rate_for_${nightsSelected}_night_stay`;
                const rate = listing?.[rateKey] || listing?.nightly_rate_for_4_night_stay;
                return rate ? formatPrice(rate * nightsSelected * 4) : 'Select Days';
              }
            })()}
          </span>
        </div>
      </div>

      {/* Total Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderTop: '2px solid #E5E7EB',
        marginBottom: '10px'
      }}>
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#111827'
        }}>Est. {reservationSpan}-Week Total</span>
        <span style={{
          fontSize: '28px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #31135d 0%, #31135d 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {(() => {
            if (listing?.rental_type === 'Weekly' && listing?.weekly_rate_paid_to_host) {
              return formatPrice(listing.weekly_rate_paid_to_host * reservationSpan);
            } else if (listing?.rental_type === 'Monthly' && listing?.monthly_rate_paid_to_host) {
              return formatPrice(listing.monthly_rate_paid_to_host * (reservationSpan / 4));
            } else {
              const rateKey = `nightly_rate_for_${nightsSelected}_night_stay`;
              const rate = listing?.[rateKey] || listing?.nightly_rate_for_4_night_stay;
              return rate ? formatPrice(rate * nightsSelected * reservationSpan) : 'Select Days';
            }
          })()}
        </span>
      </div>

      {/* Back to Dashboard Button */}
      <button
        onClick={() => window.location.href = `/listing-dashboard.html?id=${listing?.id}`}
        style={{
          width: '100%',
          padding: '14px',
          background: 'linear-gradient(135deg, #31135d 0%, #4c1d95 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 4px 12px rgba(49, 19, 93, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}
