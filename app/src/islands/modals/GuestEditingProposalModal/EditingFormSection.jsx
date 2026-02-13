/**
 * EditingFormSection - Form fields shown during 'editing' view state
 *
 * Contains DayNightSelector, move-in date, flexible move-in, and reservation span inputs
 */

import { HelpCircle } from 'lucide-react'
import DayNightSelector from './DayNightSelector.jsx'
import { DAYS_OF_WEEK, RESERVATION_SPAN_OPTIONS } from './constants.js'
import { formatDate } from './utils.js'

export default function EditingFormSection({
  formState,
  isSmallScreen,
  onDaysChange,
  onNightsChange,
  onCheckInChange,
  onCheckOutChange,
  onMoveInDateChange,
  onFlexibleMoveInChange,
  onReservationSpanChange,
  onNumberOfWeeksChange
}) {
  return (
    <div className="gep-editing-portion">
      {/* Day/Night Selector */}
      <DayNightSelector
        days={DAYS_OF_WEEK}
        selectedDays={formState.selectedDays}
        selectedNights={formState.selectedNights}
        onDayToggle={(dayIndex) => {
          const newDays = formState.selectedDays.includes(dayIndex)
            ? formState.selectedDays.filter(d => d !== dayIndex)
            : [...formState.selectedDays, dayIndex]
          onDaysChange(newDays)
        }}
        onNightToggle={(nightIndex) => {
          const newNights = formState.selectedNights.includes(nightIndex)
            ? formState.selectedNights.filter(n => n !== nightIndex)
            : [...formState.selectedNights, nightIndex]
          onNightsChange(newNights)
        }}
        checkInDay={formState.checkInDay}
        checkOutDay={formState.checkOutDay}
        onCheckInSelect={onCheckInChange}
        onCheckOutSelect={onCheckOutChange}
      />

      {/* Move-In Date Section */}
      <div className="gep-form-section">
        <label htmlFor="gep-move-in-date" className="gep-form-label">Move-In Date</label>
        <input
          type="date"
          id="gep-move-in-date"
          className="gep-date-input"
          value={formState.moveInDate instanceof Date && !isNaN(formState.moveInDate)
            ? formState.moveInDate.toISOString().split('T')[0]
            : ''}
          onChange={onMoveInDateChange}
          aria-describedby="gep-move-in-display"
        />
        <p id="gep-move-in-display" className="gep-date-display" aria-live="polite">
          Move-in: {formatDate(formState.moveInDate, isSmallScreen)}
        </p>
      </div>

      {/* Flexible Move-In Date Section */}
      <div className="gep-form-section">
        <label htmlFor="gep-flexible-move-in" className="gep-form-label">
          Flexible move-in date?
          <button type="button" className="gep-info-button" aria-label="More information about flexible move-in dates">
            <HelpCircle size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </label>
        <textarea
          id="gep-flexible-move-in"
          className="gep-textarea"
          value={formState.flexibleMoveInRange}
          onChange={onFlexibleMoveInChange}
          placeholder="Type here your move-in range..."
          rows={2}
          aria-describedby="gep-flexible-hint"
        />
        <span id="gep-flexible-hint" className="gep-sr-only">Optionally describe a range of dates when you could move in</span>
      </div>

      {/* Reservation Span Section */}
      <div className="gep-form-section">
        <label htmlFor="gep-reservation-span" className="gep-form-label">Reservation Span</label>
        <select
          id="gep-reservation-span"
          className="gep-select"
          value={formState.reservationSpan?.id || ''}
          onChange={onReservationSpanChange}
          aria-describedby={formState.reservationSpan?.type === 'other' ? 'gep-weeks-section' : undefined}
        >
          <option value="" disabled>Select reservation length</option>
          {RESERVATION_SPAN_OPTIONS.map(option => (
            <option key={option.id} value={option.id}>
              {option.display}
            </option>
          ))}
        </select>

        {/* Number of weeks - shown when "Other" is selected */}
        {formState.reservationSpan?.type === 'other' && (
          <div id="gep-weeks-section" className="gep-weeks-input-section">
            <label htmlFor="gep-num-weeks" className="gep-form-label-small"># of Weeks</label>
            <input
              type="number"
              id="gep-num-weeks"
              className="gep-number-input"
              value={formState.numberOfWeeks}
              onChange={onNumberOfWeeksChange}
              placeholder="Enter # of Weeks"
              min={1}
              aria-label="Number of weeks for reservation"
            />
          </div>
        )}
      </div>

    </div>
  )
}
