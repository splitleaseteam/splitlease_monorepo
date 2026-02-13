/**
 * ReservationPriceBreakdown - Price breakdown display for proposals
 */

import {
  formatCurrency,
  formatDate,
  calculateActualWeeksUsed,
  calculateNightsReserved,
  isUserGuest,
  getCompensationLabel,
  getReservedLabel,
  get4WeekPriceLabel
} from './utils.js'

export default function ReservationPriceBreakdown({
  listing,
  proposal,
  moveInDate,
  checkInDay,
  checkOutDay,
  reservationSpan,
  weeksReservationSpanNumber,
  nightsSelected,
  houseRulesToDisplay = [],
  pricePerNight = 0,
  totalPriceForReservation = 0,
  priceRentPer4Weeks = 0,
  user,
  isVisible = true,
  isHouseRulesVisible = false,
  onHouseRulesClick,
  pageWidth = 1200
}) {
  if (!isVisible) {
    return null
  }

  const effectiveRentalType = proposal?.rentalType || listing?.rentalType || 'Nightly'
  const effectiveWeekSelection = proposal?.weekSelection
  const effectiveHostCompensation = proposal?.hostCompensation ?? 0
  const effectiveDamageDeposit = proposal?.damage_deposit_amount ?? 0
  const effectiveCleaningFee = proposal?.cleaning_fee_amount ?? 0

  const isGuest = isUserGuest(user?.watching?.type) || isUserGuest(user?.watching?.typeUserSignup) || user?.type === 'guest'
  const nightsSelectedCount = nightsSelected?.length || 0
  const isFullTime = nightsSelectedCount === 7
  const isWeeklyRental = effectiveRentalType === 'Weekly'

  const isSmallScreen = pageWidth < 900
  const isVerySmallScreen = pageWidth < 380
  const isTinyScreen = pageWidth < 350

  const weekPeriod = effectiveWeekSelection?.period || 1
  const actualWeeksUsed = calculateActualWeeksUsed(weeksReservationSpanNumber, weekPeriod)
  const nightsReserved = calculateNightsReserved(
    effectiveRentalType,
    weeksReservationSpanNumber,
    weekPeriod,
    nightsSelectedCount,
    reservationSpan
  )

  const compensationLabel = getCompensationLabel(effectiveRentalType)
  const reservedLabel = getReservedLabel(effectiveRentalType)
  const price4WeekLabel = get4WeekPriceLabel(effectiveRentalType)

  const getHouseRulesLabel = () => {
    const count = houseRulesToDisplay?.length || proposal?.host_proposed_house_rules_json?.length || 0
    if (count === 0) {
      return isGuest ? 'No House Rules' : "You Don't Have any House Rules"
    }
    const clickText = isHouseRulesVisible ? '(click to hide)' : '(click to see)'
    const baseLabel = isGuest ? 'House Rules' : 'Your House Rules'
    return (
      <>
        {baseLabel} <span className="rpb-small-text">{clickText}</span>
      </>
    )
  }

  const getReservationLengthLabel = () => {
    if (isVerySmallScreen) return 'Duration'
    return 'Reservation Length'
  }

  const getReservationLengthValue = () => {
    if (reservationSpan?.type === 'other' || isTinyScreen) {
      return `${weeksReservationSpanNumber} weeks`
    }
    return reservationSpan?.display || `${weeksReservationSpanNumber} weeks`
  }

  const getCheckInLabel = () => isFullTime ? 'Occupancy' : 'Check-in'
  const getCheckInValue = () => isFullTime ? 'Full Time' : (checkInDay?.display || 'Not set')

  return (
    <div className="reservation-price-breakdown">
      {/* Note: Header removed - parent GuestEditingProposalModal already has "Proposal Details" in gep-header */}

      {/* Move-in Section */}
      <div className="rpb-row">
        <span className="rpb-label">Move-in</span>
        <span className="rpb-value">
          {formatDate(moveInDate, isSmallScreen)}
        </span>
      </div>

      {/* Check-in Section */}
      <div className="rpb-row">
        <span className="rpb-label">{getCheckInLabel()}</span>
        <span className="rpb-value">{getCheckInValue()}</span>
      </div>

      {/* Check-out Section - Hidden when full-time (7 nights) */}
      {!isFullTime && (
        <div className="rpb-row">
          <span className="rpb-label">Check-out</span>
          <span className="rpb-value">{checkOutDay?.display || 'Not set'}</span>
        </div>
      )}

      {/* Reservation Length Section */}
      <div className="rpb-row">
        <span className="rpb-label">{getReservationLengthLabel()}</span>
        <span className="rpb-value">{getReservationLengthValue()}</span>
      </div>

      {/* House Rules Section */}
      <div className="rpb-row">
        <span
          className={`rpb-label rpb-house-rules-label ${isTinyScreen ? 'rpb-label--small' : ''}`}
          onClick={onHouseRulesClick}
        >
          {getHouseRulesLabel()}
        </span>
        <span className={`rpb-value ${isTinyScreen ? 'rpb-value--small' : ''}`}>
          {houseRulesToDisplay?.length || proposal?.host_proposed_house_rules_json?.length || 0}
        </span>
      </div>

      <hr className="rpb-divider" />

      {/* Weekly Pattern Section - Only for Weekly rentals */}
      {isWeeklyRental && (
        <>
          <div className="rpb-row">
            <span className="rpb-label rpb-label--regular">Weekly Pattern</span>
            <span className="rpb-value rpb-value--regular">
              {isSmallScreen && effectiveWeekSelection?.displayMobile
                ? effectiveWeekSelection.displayMobile
                : effectiveWeekSelection?.display || ''}
            </span>
          </div>

          <div className="rpb-row">
            <span className="rpb-label rpb-label--regular">Actual Weeks Used</span>
            <span className="rpb-value rpb-value--regular">
              {actualWeeksUsed}
            </span>
          </div>
        </>
      )}

      {/* Compensation/night Section - Hidden from guests */}
      {!isGuest && (
        <div className="rpb-row">
          <span className={`rpb-label rpb-label--large ${isVerySmallScreen ? 'rpb-label--responsive' : ''}`}>
            {compensationLabel}
          </span>
          <span className="rpb-value">
            {formatCurrency(effectiveHostCompensation)}
          </span>
        </div>
      )}

      {/* Price per night Section - Only for guests */}
      {isGuest && (
        <div className="rpb-row rpb-row--white">
          <span className={`rpb-label rpb-label--regular rpb-label--large ${pageWidth < 700 ? 'rpb-label--responsive-large' : ''}`}>
            Price per night
          </span>
          <span className={`rpb-value rpb-value--regular rpb-value--large ${pageWidth < 700 ? 'rpb-value--responsive-large' : ''}`}>
            {formatCurrency(pricePerNight)}
          </span>
        </div>
      )}

      {/* Nights/Weeks/Months Reserved Section */}
      <div className="rpb-row">
        <span className="rpb-label rpb-label--regular">{reservedLabel}</span>
        <span className="rpb-value rpb-value--regular">
          x {nightsReserved}
        </span>
      </div>

      <hr className="rpb-divider" />

      {/* Total Compensation Section - Hidden from guests */}
      {!isGuest && (
        <div className="rpb-row">
          <span className={`rpb-label rpb-label--regular rpb-label--large ${isVerySmallScreen ? 'rpb-label--responsive' : ''}`}>
            Total Compensation <span className="rpb-small-text">*Excluding Maintenance Fee and Damage Deposit</span>
          </span>
          <span className={`rpb-value rpb-value--regular rpb-value--large ${pageWidth < 700 ? 'rpb-value--responsive-large' : ''}`}>
            {formatCurrency(totalPriceForReservation)}
          </span>
        </div>
      )}

      {/* Total Price for Reservation - Only for guests */}
      {isGuest && (
        <>
          <hr className="rpb-divider rpb-divider--thick" />
          <div className="rpb-row">
            <span className={`rpb-label rpb-label--regular rpb-label--large ${pageWidth < 700 ? 'rpb-label--responsive-large' : ''}`}>
              Total Price for Reservation
            </span>
            <span className={`rpb-value rpb-value--regular rpb-value--large ${pageWidth < 700 ? 'rpb-value--responsive-large' : ''}`}>
              {formatCurrency(totalPriceForReservation)}
            </span>
          </div>
        </>
      )}

      <hr className="rpb-divider rpb-divider--thick" />

      {/* Price per 4 weeks - Only for guests */}
      {isGuest && (
        <div className="rpb-row rpb-row--white">
          <span className={`rpb-label rpb-label--regular rpb-label--large ${pageWidth < 700 ? 'rpb-label--responsive-large' : ''}`}>
            {price4WeekLabel}
          </span>
          <span className={`rpb-value rpb-value--regular rpb-value--large ${pageWidth < 700 ? 'rpb-value--responsive-large' : ''}`}>
            {formatCurrency(priceRentPer4Weeks)}
          </span>
        </div>
      )}

      {/* Damage Deposit Section */}
      <div className="rpb-row">
        <span className="rpb-label rpb-label--regular rpb-label--small">
          Refundable Damage Deposit<span className="rpb-asterisk">*</span>
        </span>
        <span className="rpb-value rpb-value--regular rpb-value--small">
          {formatCurrency(effectiveDamageDeposit)}
        </span>
      </div>

      {/* Maintenance Fee Section */}
      <div className="rpb-row">
        <span className="rpb-label rpb-label--regular rpb-label--small">
          Maintenance Fee<span className="rpb-asterisk">*</span> <span className="rpb-small-text">*see terms of use</span>
        </span>
        <span className="rpb-value rpb-value--regular rpb-value--small">
          {formatCurrency(effectiveCleaningFee)}
        </span>
      </div>

      {/* Disclaimer */}
      <p className="rpb-disclaimer">
        *Refundable Damage Deposit is held with Split Lease
      </p>

      {/* House Rules Expanded Section */}
      {isHouseRulesVisible && houseRulesToDisplay?.length > 0 && (
        <div className="rpb-house-rules-expanded">
          <h4 className="rpb-house-rules-title">House Rules:</h4>
          <ul className="rpb-house-rules-list">
            {houseRulesToDisplay.map((rule, index) => (
              <li key={index} className="rpb-house-rule-item">{rule}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
