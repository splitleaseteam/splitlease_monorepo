import { calculateCheckInOutFromDays } from '../../../../logic/calculators/scheduling/calculateCheckInOutFromDays.js';

/**
 * CompactScheduleIndicator - Minimal dot-based schedule display
 * Shows when mobile header is hidden during scroll
 */
export default function CompactScheduleIndicator({ isVisible }) {
  // Get selected days from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const daysSelected = urlParams.get('days-selected') || '';

  // Parse days-selected (format: "1,2,3,4,5" where 0=Sun, 1=Mon, etc.)
  const selectedDaysArray = daysSelected
    ? daysSelected.split(',').map(d => parseInt(d, 10)).filter(d => !isNaN(d))
    : [];

  // Day names for display
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Calculate check-in and check-out days (only when we have at least 2 days)
  const hasEnoughDays = selectedDaysArray.length >= 2;
  const checkInOut = hasEnoughDays ? calculateCheckInOutFromDays(selectedDaysArray) : null;
  const checkInText = checkInOut ? dayNames[checkInOut.checkIn] : '';
  const checkOutText = checkInOut ? dayNames[checkInOut.checkOut] : '';

  return (
    <div className={`compact-schedule-indicator ${isVisible ? 'compact-schedule-indicator--visible' : ''}`}>
      <span className="compact-schedule-text">
        {hasEnoughDays ? (
          <>
            <span className="compact-repeat-symbol" title="Repeats weekly" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10" />
                <path d="M3.51 15A9 9 0 0 0 18.36 18.36L23 14" />
              </svg>
            </span>{' '}
            <span className="compact-label">Check-in:</span> {checkInText} • <span className="compact-label">Check-out:</span> {checkOutText}
          </>
        ) : (
          'Select days'
        )}
      </span>
      <div className="compact-schedule-dots">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
          <div
            key={dayIndex}
            className={`compact-day-dot ${selectedDaysArray.includes(dayIndex) ? 'selected' : ''}`}
            title={dayNames[dayIndex]}
          />
        ))}
      </div>
    </div>
  );
}
