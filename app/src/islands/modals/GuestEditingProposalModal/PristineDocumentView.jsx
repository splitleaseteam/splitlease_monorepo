/**
 * PristineDocumentView - Read-only proposal details shown in 'pristine' view state
 *
 * Displays proposal details as a document with pricing breakdown and fees
 */

import { formatDate, getReservedLabel, get4WeekPriceLabel } from './utils.js'

export default function PristineDocumentView({
  formState,
  listing,
  reservationSpan,
  houseRulesToDisplay,
  pricePerNight,
  totalPriceForReservation,
  priceRentPer4Weeks
}) {
  return (
    <div className="gep-document-view" role="region" aria-label="Proposal details">
      {/* Detail rows using semantic definition list */}
      <dl className="gep-details-list">
        <div className="gep-detail-row">
          <dt className="gep-detail-label">Move-in</dt>
          <dd className="gep-detail-value">{formatDate(formState.moveInDate, false)}</dd>
        </div>
        <div className="gep-detail-row">
          <dt className="gep-detail-label">Check-in</dt>
          <dd className="gep-detail-value">{formState.checkInDay?.display || 'Not set'}</dd>
        </div>
        <div className="gep-detail-row">
          <dt className="gep-detail-label">Check-out</dt>
          <dd className="gep-detail-value">{formState.checkOutDay?.display || 'Not set'}</dd>
        </div>
        <div className="gep-detail-row">
          <dt className="gep-detail-label">Reservation Length</dt>
          <dd className="gep-detail-value">{reservationSpan.display}</dd>
        </div>
        <div className="gep-detail-row">
          <dt className="gep-detail-label">Weekly Pattern</dt>
          <dd className="gep-detail-value">
            {formState.checkInDay?.first3Letters || 'Mon'} - {formState.checkOutDay?.first3Letters || 'Fri'} ({formState.selectedNights.length} nights/week)
          </dd>
        </div>
        <div className="gep-detail-row">
          <dt className="gep-detail-label">House Rules</dt>
          <dd className="gep-detail-value">{houseRulesToDisplay.length}</dd>
        </div>
      </dl>

      {/* Pricing Breakdown section */}
      <div className="gep-pricing-section">
        <div className="gep-pricing-title">Pricing Breakdown</div>
        <div className="gep-pricing-row">
          <span className="gep-pricing-label">Price per night</span>
          <span className="gep-pricing-value">${(pricePerNight || 0).toFixed(2)}</span>
        </div>
        <div className="gep-pricing-row">
          <span className="gep-pricing-label">{getReservedLabel(listing?.rentalType || 'Nightly')}</span>
          <span className="gep-pricing-value">× {formState.selectedNights.length * formState.numberOfWeeks}</span>
        </div>
        <div className="gep-pricing-row gep-pricing-row--total">
          <span className="gep-pricing-label">Total Price for Reservation</span>
          <span className="gep-pricing-value">${(totalPriceForReservation || 0).toFixed(2)}</span>
        </div>
      </div>

      {/* Fees section */}
      <div className="gep-fees-section">
        <div className="gep-fee-row">
          <span className="gep-fee-label">{get4WeekPriceLabel(listing?.rentalType || 'Nightly')}</span>
          <span className="gep-fee-value">${(priceRentPer4Weeks || 0).toFixed(2)}</span>
        </div>
        <div className="gep-fee-row">
          <span className="gep-fee-label">Refundable Damage Deposit*</span>
          <span className="gep-fee-value">${(listing?.damageDeposit || 0).toFixed(2)}</span>
        </div>
        <div className="gep-fee-row">
          <span className="gep-fee-label">Maintenance Fee* <span className="gep-fee-note">*see terms of use</span></span>
          <span className="gep-fee-value">${(0).toFixed(2)}</span>
        </div>
        <p className="gep-disclaimer">*Refundable Damage Deposit is held with Split Lease</p>
      </div>
    </div>
  )
}
