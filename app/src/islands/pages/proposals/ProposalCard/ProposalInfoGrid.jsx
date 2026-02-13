/**
 * Proposal Info Grid Component
 *
 * Displays the proposal detail sections:
 * - Info grid (move-in, duration, schedule, nights/week)
 * - Days row with day pills and schedule info
 * - Pricing row with breakdown and total
 */

import { formatPrice } from '../../../../lib/proposals/dataTransformers.js';

export default function ProposalInfoGrid({
  anticipatedMoveIn,
  reservationWeeks,
  checkInOutRange,
  nightsPerWeek,
  allDays,
  selectedDaysCount,
  someNightsUnavailable,
  checkInTime,
  checkOutTime,
  nightlyPrice,
  totalPrice,
  originalTotalPrice,
  cleaningFee
}) {
  return (
    <>
      {/* Info Grid */}
      <div className="info-grid">
        <div className="info-item">
          <div className="info-label">Ideal Move-in</div>
          <div className="info-value">{anticipatedMoveIn || 'TBD'}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Duration</div>
          <div className="info-value">{reservationWeeks} weeks</div>
        </div>
        <div className="info-item">
          <div className="info-label">Schedule</div>
          <div className="info-value">{checkInOutRange || 'Flexible'}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Nights/week</div>
          <div className="info-value">{nightsPerWeek} nights</div>
        </div>
      </div>

      {/* Days Row */}
      <div className="days-row">
        <span className="days-label">Schedule</span>
        <div className="days-pills">
          {allDays.map((day) => (
            <div
              key={day.index}
              className={`day-pill ${day.selected ? 'selected' : ''}`}
            >
              {day.letter}
            </div>
          ))}
        </div>
        <div className="days-info">
          <div className="days-count">
            {selectedDaysCount} days, {nightsPerWeek} nights Selected
            {someNightsUnavailable && (
              <span
                className="nights-unavailable-warning"
                title="Some selected nights are no longer available"
                style={{ color: 'var(--gp-danger)', marginLeft: '8px' }}
              >
                ⚠
              </span>
            )}
          </div>
          <div className="days-range">Check-in {checkInTime}, Check-out {checkOutTime}</div>
        </div>
      </div>

      {/* Pricing Row */}
      <div className="pricing-row">
        <div className="pricing-breakdown">
          <span>{formatPrice(nightlyPrice)}/night</span>
          <span>×</span>
          <span>{nightsPerWeek} nights</span>
          <span>×</span>
          <span>{reservationWeeks} weeks</span>
          {cleaningFee > 0 && (
            <>
              <span>+</span>
              <span>{formatPrice(cleaningFee)} fee</span>
            </>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pricing-total-label">
            Reservation Estimated Total
            {originalTotalPrice && (
              <span style={{ marginLeft: '8px', color: 'var(--gp-text-muted)', textDecoration: 'line-through' }}>
                {formatPrice(originalTotalPrice)}
              </span>
            )}
          </div>
          <div className="pricing-total">{formatPrice(totalPrice)}</div>
        </div>
      </div>
    </>
  );
}
