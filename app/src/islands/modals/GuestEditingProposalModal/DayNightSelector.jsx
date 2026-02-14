/**
 * DayNightSelector - Day/Night selection grid for schedule editing
 */

import { useCallback } from 'react'
import { DAYS_OF_WEEK } from './constants.js'

export default function DayNightSelector({
  days = DAYS_OF_WEEK,
  selectedDays,
  selectedNights,
  onDayToggle,
  onNightToggle,
  checkInDay,
  checkOutDay,
  _onCheckInSelect,
  _onCheckOutSelect,
  disabled = false
}) {
  const handleDayClick = useCallback((dayIndex) => {
    if (disabled) return
    onDayToggle(dayIndex)
    onNightToggle(dayIndex)
  }, [disabled, onDayToggle, onNightToggle])

  const isDaySelected = useCallback((dayIndex) => {
    return selectedDays.includes(dayIndex)
  }, [selectedDays])

  const selectedDaysCount = selectedDays.length
  const selectedNightsCount = selectedNights.length

  return (
    <div className="day-night-selector" role="group" aria-labelledby="dns-heading">
      <span id="dns-heading" className="gep-sr-only">Select days of the week for your stay</span>
      {/* Day buttons grid - matches mockup exactly */}
      <div className="dns-day-grid" role="group" aria-label="Days of the week">
        {days.map((day) => (
          <button
            key={day.id}
            type="button"
            className={`dns-day-btn ${isDaySelected(day.id) ? 'dns-day-btn--selected' : ''}`}
            onClick={() => handleDayClick(day.id)}
            disabled={disabled}
            title={day.name}
            aria-label={`${day.name}${isDaySelected(day.id) ? ', selected' : ''}`}
            aria-pressed={isDaySelected(day.id)}
          >
            {day.singleLetter}
          </button>
        ))}
      </div>

      {/* Schedule info container - combines check-in, check-out, and summary */}
      <div className="dns-schedule-info">
        <div className="dns-schedule-info-row">
          <span className="dns-schedule-info-label">Check-in:</span>
          <span className="dns-schedule-info-value">{checkInDay?.display || 'Not set'}</span>
        </div>
        <div className="dns-schedule-info-row">
          <span className="dns-schedule-info-label">Check-out:</span>
          <span className="dns-schedule-info-value">{checkOutDay?.display || 'Not set'}</span>
        </div>
        <div className="dns-schedule-info-divider"></div>
        <div className="dns-schedule-info-row">
          <span className="dns-schedule-info-summary">
            <strong>{selectedDaysCount}</strong> days, <strong>{selectedNightsCount}</strong> nights per week
          </span>
        </div>
      </div>
    </div>
  )
}
