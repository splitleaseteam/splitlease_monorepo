/**
 * PricingSection Component
 *
 * Renders the desktop right-column booking widget with price display,
 * move-in date picker, strict mode toggle, schedule selector, custom schedule,
 * reservation span, price breakdown, and create proposal button.
 *
 * @component
 * @architecture Presentational Component - receives all data via props
 */

import { formatPrice } from '../../../../lib/formatters.js';
import { logger } from '../../../../lib/logger.js';
import ListingScheduleSelector from '../../../shared/ListingScheduleSelector.jsx';
import CustomDatePicker from '../../../shared/CustomDatePicker';
import FavoriteButton from '../../../shared/FavoriteButton/FavoriteButton.jsx';
import { SchedulePatternHighlight } from './SchedulePatternHighlight.jsx';

interface PricingSectionProps {
  listing: any;
  isMobile: boolean;
  // Price state
  pricingBreakdown: any;
  priceMessage: string | null;
  // Schedule state
  scheduleSelectorListing: any;
  selectedDayObjects: any[];
  reservationSpan: number;
  zatConfig: any;
  handleScheduleChange: (days: any[]) => void;
  handlePriceChange: (breakdown: any) => void;
  setReservationSpan: (span: number) => void;
  // Move-in state
  moveInDate: string | null;
  setMoveInDate: (date: string) => void;
  minMoveInDate: string;
  // Strict mode
  isStrictModeEnabled: boolean;
  setIsStrictModeEnabled: (mode: boolean) => void;
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
  // Info tooltips
  activeInfoTooltip: string | null;
  setActiveInfoTooltip: (tooltip: string | null) => void;
  moveInInfoRef: React.RefObject<any>;
  reservationSpanInfoRef: React.RefObject<any>;
  flexibilityInfoRef: React.RefObject<any>;
  // Proposal
  handleCreateProposal: () => void;
}

export function PricingSection({
  listing,
  isMobile,
  pricingBreakdown,
  priceMessage,
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
  isStrictModeEnabled,
  setIsStrictModeEnabled,
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
  activeInfoTooltip,
  setActiveInfoTooltip,
  moveInInfoRef,
  reservationSpanInfoRef,
  flexibilityInfoRef,
  handleCreateProposal,
}: PricingSectionProps) {
  return (
    <div
      className="booking-widget"
      style={{
        display: isMobile ? 'none' : 'block',
        position: 'sticky',
        top: 'calc(80px + 20px)',
        alignSelf: 'flex-start',
        height: 'fit-content',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '28px',
        background: 'white',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(10px)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 24px 70px rgba(0, 0, 0, 0.35), 0 0 1px rgba(0, 0, 0, 0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.05)';
        }
      }}
    >
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
          fontSize: '32px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #31135d 0%, #31135d 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-1px',
          display: 'inline-block'
        }}>
          {pricingBreakdown?.valid && pricingBreakdown?.pricePerNight
            ? `$${Number.isInteger(pricingBreakdown.pricePerNight) ? pricingBreakdown.pricePerNight : pricingBreakdown.pricePerNight.toFixed(2)}`
            : 'Select Days'}
          <span style={{
            fontSize: '16px',
            color: '#6B7280',
            fontWeight: '500',
            background: 'none',
            WebkitTextFillColor: '#6B7280'
          }}>/night</span>
        </div>
        <FavoriteButton
          listingId={listing?.id}
          userId={loggedInUserData?.userId}
          initialFavorited={isFavorited}
          onToggle={(newState) => setIsFavorited(newState)}
          onRequireAuth={() => setShowAuthModal(true)}
          size="large"
          variant="inline"
        />
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
          <span
            onClick={(e) => {
              e.stopPropagation();
              console.log('Move-in text clicked, current state:', activeInfoTooltip);
              setActiveInfoTooltip(activeInfoTooltip === 'moveIn' ? null : 'moveIn');
            }}
            style={{ cursor: 'pointer' }}
          >
            Ideal Move-In
          </span>
          <svg
            ref={moveInInfoRef}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Move-in info icon clicked, current state:', activeInfoTooltip);
              setActiveInfoTooltip(activeInfoTooltip === 'moveIn' ? null : 'moveIn');
            }}
            style={{ width: '16px', height: '16px', color: '#9CA3AF', cursor: 'pointer' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </label>
        <div style={{ marginBottom: '8px' }}>
          <CustomDatePicker
            value={moveInDate || ''}
            onChange={setMoveInDate}
            minDate={minMoveInDate}
            placeholder="Select move-in date"
          />
        </div>
        <div style={{
          fontSize: '12px',
          color: '#6B7280',
          lineHeight: '1.4',
          marginBottom: '10px',
          fontWeight: '400',
          paddingLeft: '4px'
        }}>
          Minimum 2 weeks from today. Date auto-updates based on selected days.
        </div>
      </div>

      {/* Strict Mode */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          marginBottom: '14px',
          padding: '12px',
          background: 'linear-gradient(135deg, #f8f9ff 0%, #faf5ff 100%)',
          borderRadius: '10px',
          border: '1px solid #e9d5ff',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)';
          e.currentTarget.style.borderColor = '#d8b4fe';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9ff 0%, #faf5ff 100%)';
          e.currentTarget.style.borderColor = '#e9d5ff';
        }}
      >
        <input
          type="checkbox"
          checked={isStrictModeEnabled}
          onChange={() => setIsStrictModeEnabled(!isStrictModeEnabled)}
          style={{
            width: '18px',
            height: '18px',
            cursor: 'pointer',
            accentColor: '#31135d',
            marginTop: '2px',
            flexShrink: 0
          }}
        />
        <label style={{
          fontSize: '14px',
          color: '#111827',
          userSelect: 'none',
          lineHeight: '1.5',
          fontWeight: '500'
        }}>
          <span
            onClick={(e) => {
              e.stopPropagation();
              setActiveInfoTooltip(activeInfoTooltip === 'flexibility' ? null : 'flexibility');
            }}
            style={{ cursor: 'pointer' }}
          >
            Strict (no negotiation on exact move in)
          </span>
          <svg
            ref={flexibilityInfoRef}
            onClick={(e) => {
              e.stopPropagation();
              setActiveInfoTooltip(activeInfoTooltip === 'flexibility' ? null : 'flexibility');
            }}
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              verticalAlign: 'middle',
              marginLeft: '2px',
              opacity: 0.6,
              cursor: 'pointer'
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </label>
      </div>

      {/* Weekly Schedule Selector - Only render on desktop to prevent race conditions with mobile instances */}
      {!isMobile && scheduleSelectorListing && (
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

      {/* Custom schedule section - decoupled from scheduleSelectorListing to ensure visibility */}
      {(() => {
        const shouldRender = !isMobile && listing;
        logger.debug(`\ud83c\udfaf Custom Schedule Conditional Check: isMobile=${isMobile}, listing=${!!listing}, shouldRender=${shouldRender}`);
        return shouldRender;
      })() && (
        <div style={{
          marginBottom: '14px',
          padding: '12px',
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
          borderRadius: '12px',
          border: '1px solid #E5E7EB'
        }}>
          {/* Listing's weekly pattern info + custom schedule option */}
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

          {/* Custom schedule freeform input */}
          {showCustomScheduleInput && (
            <div style={{ marginTop: '10px' }}>
              <textarea
                value={customScheduleDescription}
                onChange={(e) => setCustomScheduleDescription(e.target.value)}
                placeholder="Describe your preferred schedule pattern in detail (e.g., 'I need the space every other week starting January 15th' or 'Weekdays only for the first month, then full weeks')"
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
                The host will review your custom schedule request and may adjust the proposal accordingly.
              </p>
            </div>
          )}
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
          <span
            onClick={(e) => {
              e.stopPropagation();
              setActiveInfoTooltip(activeInfoTooltip === 'reservationSpan' ? null : 'reservationSpan');
            }}
            style={{ cursor: 'pointer' }}
          >
            Reservation Span
          </span>
          <svg
            ref={reservationSpanInfoRef}
            onClick={(e) => {
              e.stopPropagation();
              setActiveInfoTooltip(activeInfoTooltip === 'reservationSpan' ? null : 'reservationSpan');
            }}
            style={{ width: '16px', height: '16px', color: '#9CA3AF', cursor: 'pointer' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={reservationSpan}
            onChange={(e) => setReservationSpan(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              paddingRight: '40px',
              border: '2px solid #E5E7EB',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '500',
              color: '#111827',
              background: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              appearance: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement;
              target.style.borderColor = '#31135d';
              target.style.boxShadow = '0 4px 6px rgba(49, 19, 93, 0.1)';
            }}
            onMouseLeave={(e) => {
              if (document.activeElement !== e.target) {
                const target = e.target as HTMLElement;
                target.style.borderColor = '#E5E7EB';
                target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
              }
            }}
            onFocus={(e) => {
              const target = e.target as HTMLElement;
              target.style.borderColor = '#31135d';
              target.style.boxShadow = '0 0 0 4px rgba(49, 19, 93, 0.15)';
            }}
            onBlur={(e) => {
              const target = e.target as HTMLElement;
              target.style.borderColor = '#E5E7EB';
              target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            }}
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
        {/* Schedule Pattern Highlight - shows actual weeks for alternating patterns */}
        <SchedulePatternHighlight
          reservationSpan={reservationSpan}
          weeksOffered={listing?.weeks_offered_schedule_text}
        />
      </div>

      {/* Price Breakdown */}
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
          fontSize: '15px'
        }}>
          <span style={{ color: '#111827', fontWeight: '500' }}>4-Week Rent</span>
          <span style={{ color: '#111827', fontWeight: '700', fontSize: '16px' }}>
            {pricingBreakdown?.valid && pricingBreakdown?.fourWeekRent != null
              ? formatPrice(pricingBreakdown.fourWeekRent)
              : priceMessage || 'Please Add More Days'}
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
        }}>Reservation Estimated Total</span>
        <span style={{
          fontSize: '28px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #31135d 0%, #31135d 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {pricingBreakdown?.valid && pricingBreakdown?.reservationTotal != null
            ? formatPrice(pricingBreakdown.reservationTotal)
            : priceMessage || 'Please Add More Days'}
        </span>
      </div>

      {/* Create Proposal Button */}
      <button
        onClick={(e) => {
          if (scheduleValidation?.valid && pricingBreakdown?.valid && !existingProposalForListing) {
            const target = e.target as HTMLElement;
            target.style.transform = 'scale(0.98)';
            setTimeout(() => {
              target.style.transform = '';
            }, 150);
            handleCreateProposal();
          }
        }}
        disabled={!scheduleValidation?.valid || !pricingBreakdown?.valid || !!existingProposalForListing}
        style={{
          width: '100%',
          padding: '14px',
          background: existingProposalForListing
            ? '#D1D5DB'
            : scheduleValidation?.valid && pricingBreakdown?.valid
              ? 'linear-gradient(135deg, #31135d 0%, #31135d 100%)'
              : '#D1D5DB',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '700',
          cursor: existingProposalForListing || !scheduleValidation?.valid || !pricingBreakdown?.valid ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: !existingProposalForListing && scheduleValidation?.valid && pricingBreakdown?.valid
            ? '0 4px 14px rgba(49, 19, 93, 0.4)'
            : 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!existingProposalForListing && scheduleValidation?.valid && pricingBreakdown?.valid) {
            const target = e.target as HTMLElement;
            target.style.transform = 'translateY(-2px)';
            target.style.boxShadow = '0 8px 24px rgba(49, 19, 93, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          if (!existingProposalForListing && scheduleValidation?.valid && pricingBreakdown?.valid) {
            const target = e.target as HTMLElement;
            target.style.transform = '';
            target.style.boxShadow = '0 4px 14px rgba(49, 19, 93, 0.4)';
          }
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
            fontWeight: '500',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.textDecoration = 'none';
          }}
        >
          View your proposal in Dashboard
        </a>
      )}
    </div>
  );
}
