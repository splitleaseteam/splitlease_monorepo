/**
 * MobileBookingBar Component
 *
 * Renders the mobile-only bottom booking bar with collapsed and expanded views.
 * Includes schedule selector, price display, move-in date, reservation span,
 * and create proposal button.
 *
 * @component
 * @architecture Presentational Component - receives all data via props
 */

import { formatPrice } from '../../../../lib/formatters.js';
import { logger } from '../../../../lib/logger.js';
import ListingScheduleSelector from '../../../shared/ListingScheduleSelector.jsx';
import CustomDatePicker from '../../../shared/CustomDatePicker';
import FavoriteButton from '../../../shared/FavoriteButton/FavoriteButton.jsx';

interface MobileBookingBarProps {
  listing: any;
  // Booking state
  pricingBreakdown: any;
  scheduleSelectorListing: any;
  selectedDayObjects: any[];
  reservationSpan: number;
  zatConfig: any;
  handleScheduleChange: (days: any[]) => void;
  handlePriceChange: (breakdown: any) => void;
  setReservationSpan: (span: number) => void;
  // Move-in
  moveInDate: string | null;
  setMoveInDate: (date: string) => void;
  minMoveInDate: string;
  // Strict mode
  strictMode: boolean;
  setStrictMode: (mode: boolean) => void;
  // Custom schedule
  customScheduleDescription: string;
  setCustomScheduleDescription: (desc: string) => void;
  showCustomScheduleInput: boolean;
  setShowCustomScheduleInput: (show: boolean) => void;
  // Validation
  scheduleValidation: any;
  existingProposalForListing: any;
  // Favorite
  isFavorited: boolean;
  setIsFavorited: (state: boolean) => void;
  loggedInUserData: any;
  setShowAuthModal: (show: boolean) => void;
  // Mobile expanded state
  mobileBookingExpanded: boolean;
  setMobileBookingExpanded: (expanded: boolean) => void;
  // Proposal
  handleCreateProposal: () => void;
}

export function MobileBookingBar({
  listing,
  pricingBreakdown,
  scheduleSelectorListing,
  selectedDayObjects,
  reservationSpan,
  zatConfig,
  handleScheduleChange,
  handlePriceChange,
  setReservationSpan,
  moveInDate,
  setMoveInDate,
  minMoveInDate,
  strictMode,
  setStrictMode,
  customScheduleDescription,
  setCustomScheduleDescription,
  showCustomScheduleInput,
  setShowCustomScheduleInput,
  scheduleValidation,
  existingProposalForListing,
  isFavorited,
  setIsFavorited,
  loggedInUserData,
  setShowAuthModal,
  mobileBookingExpanded,
  setMobileBookingExpanded,
  handleCreateProposal,
}: MobileBookingBarProps) {
  return (
    <>
      {/* Overlay when expanded */}
      {mobileBookingExpanded && (
        <div
          onClick={() => setMobileBookingExpanded(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998
          }}
        />
      )}

      {/* Bottom Bar */}
      <div
        className="mobile-bottom-booking-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          borderTopLeftRadius: mobileBookingExpanded ? '20px' : '0',
          borderTopRightRadius: mobileBookingExpanded ? '20px' : '0',
          transition: 'all 0.3s ease',
          maxHeight: mobileBookingExpanded ? '80vh' : 'auto',
          overflowY: mobileBookingExpanded ? 'auto' : 'hidden'
        }}
      >
        {/* Collapsed View */}
        {!mobileBookingExpanded ? (
          <div style={{ padding: '12px 16px' }}>
            {/* Schedule Selector Row */}
            {scheduleSelectorListing && (
              <div style={{ marginBottom: '12px' }}>
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

            {/* Price and Continue Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* Price Info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#31135d'
                }}>
                  {pricingBreakdown?.valid && pricingBreakdown?.pricePerNight
                    ? `$${Number.isInteger(pricingBreakdown.pricePerNight) ? pricingBreakdown.pricePerNight : pricingBreakdown.pricePerNight.toFixed(2)}`
                    : 'Select Days'}
                  <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>/night</span>
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => setMobileBookingExpanded(true)}
                style={{
                  padding: '12px 24px',
                  background: '#31135d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          /* Expanded View */
          <div style={{ padding: '20px 16px', paddingBottom: '24px' }}>
            {/* Header with close button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>
                Complete Your Booking
              </h3>
              <button
                onClick={() => setMobileBookingExpanded(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px'
                }}
              >
                {'\u00d7'}
              </button>
            </div>

            {/* Price Display */}
            <div style={{
              background: 'linear-gradient(135deg, #f8f9ff 0%, #faf5ff 100%)',
              padding: '12px',
              borderRadius: '12px',
              marginBottom: '16px',
              border: '1px solid #e9d5ff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#31135d'
              }}>
                {pricingBreakdown?.valid && pricingBreakdown?.pricePerNight
                  ? `$${Number.isInteger(pricingBreakdown.pricePerNight) ? pricingBreakdown.pricePerNight : pricingBreakdown.pricePerNight.toFixed(2)}`
                  : 'Select Days'}
                <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>/night</span>
              </div>
              <FavoriteButton
                listingId={listing?.id}
                userId={loggedInUserData?.userId}
                initialFavorited={isFavorited}
                onToggle={(newState) => setIsFavorited(newState)}
                onRequireAuth={() => setShowAuthModal(true)}
                size="medium"
                variant="inline"
              />
            </div>

            {/* Move-in Date */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#31135d',
                marginBottom: '8px',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Ideal Move-In
              </label>
              <CustomDatePicker
                value={moveInDate || ''}
                onChange={setMoveInDate}
                minDate={minMoveInDate}
                placeholder="Select move-in date"
              />
            </div>

            {/* Strict Mode - placed directly after Move-in Date for visual grouping */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
              padding: '12px',
              background: '#f8f9ff',
              borderRadius: '10px',
              border: '1px solid #e9d5ff'
            }}>
              <input
                type="checkbox"
                checked={strictMode}
                onChange={() => setStrictMode(!strictMode)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#31135d'
                }}
              />
              <label style={{
                fontSize: '14px',
                color: '#111827',
                fontWeight: '500'
              }}>
                Strict (no negotiation on exact move in)
              </label>
            </div>

            {/* Weekly Schedule Selector */}
            {scheduleSelectorListing && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#f9fafb',
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

            {/* Custom schedule section - decoupled from scheduleSelectorListing to ensure visibility (Mobile) */}
            {(() => {
              const shouldRender = !!listing;
              logger.debug(`\ud83c\udfaf Custom Schedule Conditional Check (MOBILE): listing=${!!listing}, shouldRender=${shouldRender}`);
              return shouldRender;
            })() && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #E5E7EB'
              }}>
                {/* Listing's weekly pattern info + custom schedule option (Mobile) */}
                <div style={{
                  fontSize: '13px',
                  color: '#4B5563'
                }}>
                  <span>This listing is </span>
                  <strong style={{ color: '#31135d' }}>
                    {listing?.weeks_offered_schedule_text || 'Every week'}
                  </strong>
                  <span>. </span>
                  <button
                    onClick={() => setShowCustomScheduleInput(!showCustomScheduleInput)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7C3AED',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    {showCustomScheduleInput ? 'Hide custom schedule' : 'Click here if you want to specify another recurrent schedule'}
                  </button>
                </div>

                {/* Custom schedule freeform input (Mobile) */}
                {showCustomScheduleInput && (
                  <div style={{ marginTop: '10px' }}>
                    <textarea
                      value={customScheduleDescription}
                      onChange={(e) => setCustomScheduleDescription(e.target.value)}
                      placeholder="Describe your preferred schedule pattern in detail..."
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '10px 12px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.borderColor = '#7C3AED';
                        target.style.outline = 'none';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLElement).style.borderColor = '#E5E7EB';
                      }}
                    />
                    <p style={{
                      marginTop: '6px',
                      fontSize: '11px',
                      color: '#6B7280'
                    }}>
                      The host will review your custom schedule request.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reservation Span */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#31135d',
                marginBottom: '8px',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Reservation Span
              </label>
              <select
                value={reservationSpan}
                onChange={(e) => setReservationSpan(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#111827',
                  background: 'white',
                  boxSizing: 'border-box'
                }}
              >
                {[6, 7, 8, 9, 10, 12, 13, 16, 17, 20, 22, 26].map(weeks => (
                  <option key={weeks} value={weeks}>
                    {weeks} weeks {weeks >= 12 ? `(${Math.floor(weeks / 4)} months)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Breakdown */}
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '10px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '15px'
              }}>
                <span style={{ color: '#111827', fontWeight: '500' }}>4-Week Rent</span>
                <span style={{ color: '#111827', fontWeight: '700' }}>
                  {pricingBreakdown?.valid && pricingBreakdown?.fourWeekRent != null
                    ? formatPrice(pricingBreakdown.fourWeekRent)
                    : '\u2014'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '8px',
                borderTop: '1px solid #E5E7EB'
              }}>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                  Reservation Total
                </span>
                <span style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#31135d'
                }}>
                  {pricingBreakdown?.valid && pricingBreakdown?.reservationTotal != null
                    ? formatPrice(pricingBreakdown.reservationTotal)
                    : '\u2014'}
                </span>
              </div>
            </div>

            {/* Create Proposal Button */}
            <button
              onClick={() => {
                if (scheduleValidation?.valid && pricingBreakdown?.valid && !existingProposalForListing) {
                  handleCreateProposal();
                }
              }}
              disabled={!scheduleValidation?.valid || !pricingBreakdown?.valid || !!existingProposalForListing}
              style={{
                width: '100%',
                padding: '16px',
                background: existingProposalForListing
                  ? '#D1D5DB'
                  : scheduleValidation?.valid && pricingBreakdown?.valid
                    ? '#31135d'
                    : '#D1D5DB',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: existingProposalForListing || !scheduleValidation?.valid || !pricingBreakdown?.valid ? 'not-allowed' : 'pointer'
              }}
            >
              {existingProposalForListing
                ? 'Proposal Already Exists'
                : pricingBreakdown?.valid && pricingBreakdown?.pricePerNight
                  ? `Create Proposal at $${Number.isInteger(pricingBreakdown.pricePerNight) ? pricingBreakdown.pricePerNight : pricingBreakdown.pricePerNight.toFixed(2)}/night`
                  : 'Update Split Schedule Above'}
            </button>

            {/* Link to existing proposal */}
            {existingProposalForListing && loggedInUserData?.userId && (
              <a
                href={`/guest-proposals/${loggedInUserData.userId}?proposal=${existingProposalForListing.id}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '12px',
                  color: '#31135d',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                View your proposal in Dashboard
              </a>
            )}
          </div>
        )}
      </div>

      {/* Spacer to prevent content from being hidden behind fixed bar */}
      <div style={{ height: mobileBookingExpanded ? '0' : '140px' }} />
    </>
  );
}
