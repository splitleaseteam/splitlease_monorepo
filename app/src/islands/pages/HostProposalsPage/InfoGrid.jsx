/**
 * InfoGrid Component (V7 Design)
 *
 * 5-column info grid displaying:
 * - Move-in date
 * - Move-out date
 * - Duration (weeks)
 * - Schedule (day range)
 * - Nights per week
 *
 * Responsive: 5 cols on desktop, 2 cols on mobile
 *
 * Part of the Host Proposals V7 redesign.
 */
import React from 'react';
import { formatFullDate } from './formatters.js';
import { getCheckInOutFromDays } from './types.js';

/**
 * Format schedule range from days selected
 * Uses getCheckInOutFromDays to properly handle wrap-around schedules
 * Shows checkout day with "(check-out)" indicator
 *
 * @param {Array} daysSelected - Array of 0-indexed days
 * @returns {string} Schedule string like "Thu - Mon (check-out)"
 */
function formatScheduleRange(daysSelected) {
  if (!Array.isArray(daysSelected) || daysSelected.length === 0) return 'TBD';

  const { checkInDay, checkOutDay } = getCheckInOutFromDays(daysSelected);

  if (!checkInDay) return 'TBD';
  if (!checkOutDay || checkInDay === checkOutDay) {
    return checkInDay.slice(0, 3);
  }

  return `${checkInDay.slice(0, 3)} - ${checkOutDay.slice(0, 3)} (check-out)`;
}

/**
 * Get nights per week count
 * Uses nights_selected directly if available, otherwise calculates from days
 * @param {Object} proposal - The proposal object
 * @returns {string} Nights string like "4/week"
 */
function getNightsPerWeek(proposal) {
  // Try to get nights directly from the proposal
  const nightsSelected = proposal?.nights_selected || proposal?.['Nights Selected (Nights list)'] || [];
  if (Array.isArray(nightsSelected) && nightsSelected.length > 0) {
    return `${nightsSelected.length}/week`;
  }

  // Fall back to calculating from days_selected
  const daysSelected = proposal?.days_selected || proposal?.Days_Selected || [];
  if (!Array.isArray(daysSelected) || daysSelected.length === 0) return 'TBD';
  // Nights = days - 1 (guest leaves on last day)
  const nights = Math.max(0, daysSelected.length - 1);
  return `${nights}/week`;
}

/**
 * InfoGrid displays proposal details in a grid layout
 * Shows strikethrough comparison when counteroffer terms differ from original
 *
 * @param {Object} props
 * @param {Object} props.proposal - The proposal object
 */
export function InfoGrid({ proposal }) {
  // Check if counteroffer happened
  const isCounteroffer = proposal?.['counter offer happened'] ||
    proposal?.counterOfferHappened ||
    proposal?.counter_offer_happened;

  // Original values (guest's proposal)
  const originalMoveIn = proposal?.['Move in range start'] || proposal?.move_in_range_start;
  const originalWeeks = proposal?.['Reservation Span (Weeks)'] || proposal?.reservation_span_weeks;
  let originalDays = proposal?.['Days Selected'] || [];
  if (typeof originalDays === 'string') {
    try { originalDays = JSON.parse(originalDays); } catch { originalDays = []; }
  }
  let originalNights = proposal?.['Nights Selected (Nights list)'] || [];
  if (typeof originalNights === 'string') {
    try { originalNights = JSON.parse(originalNights); } catch { originalNights = []; }
  }

  // HC values (host counteroffer)
  const hcMoveIn = proposal?.['host_counter_offer_move_in_date'];
  const hcWeeks = proposal?.['host_counter_offer_reservation_span_weeks'];
  let hcDays = proposal?.['host_counter_offer_days_selected'] || [];
  if (typeof hcDays === 'string') {
    try { hcDays = JSON.parse(hcDays); } catch { hcDays = []; }
  }
  let hcNights = proposal?.['host_counter_offer_nights_selected'] || [];
  if (typeof hcNights === 'string') {
    try { hcNights = JSON.parse(hcNights); } catch { hcNights = []; }
  }

  // Display values: prioritize HC values when counteroffer happened
  // When counteroffer exists, show HC values as current; otherwise use normalized or original
  const moveIn = (isCounteroffer && hcMoveIn) ? hcMoveIn : (proposal?.start_date || proposal?.move_in_date || originalMoveIn);
  const moveOut = proposal?.end_date || proposal?.move_out_date;
  const weeks = (isCounteroffer && hcWeeks != null) ? hcWeeks : (proposal?.duration_weeks || proposal?.weeks || proposal?.total_weeks || originalWeeks);
  const daysSelected = (isCounteroffer && hcDays.length > 0) ? hcDays : (proposal?.days_selected || proposal?.Days_Selected || originalDays);
  const nightsSelected = (isCounteroffer && hcNights.length > 0) ? hcNights : (proposal?.nights_selected || proposal?.['Nights Selected (Nights list)'] || originalNights);

  // Comparison flags - detect which values changed
  // Only show strikethrough if there's actual HC data that differs from original
  const moveInChanged = isCounteroffer && hcMoveIn && hcMoveIn !== originalMoveIn;
  const durationChanged = isCounteroffer && hcWeeks != null && hcWeeks !== originalWeeks;

  // Days changed: check if HC days exist AND differ from original days
  // Order matters for day schedules, and we compare arrays directly without sorting
  const daysChanged = isCounteroffer &&
    hcDays.length > 0 &&
    originalDays.length > 0 &&
    (hcDays.length !== originalDays.length ||
      !hcDays.every((day, index) => day === originalDays[index]));

  // Nights changed: check if HC nights exist AND differ from original nights
  // This is what determines the "Nights" display value
  const nightsChanged = isCounteroffer &&
    hcNights.length > 0 &&
    originalNights.length > 0 &&
    (hcNights.length !== originalNights.length ||
      !hcNights.every((night, index) => night === originalNights[index]));

  // Calculate duration from dates if not provided
  let duration = weeks;
  if (!duration && moveIn && moveOut) {
    const start = new Date(moveIn);
    const end = new Date(moveOut);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    duration = Math.round(diffDays / 7);
  }

  return (
    <div className="hp7-info-grid">
      <div className="hp7-info-item">
        <div className="hp7-info-label">Move-in</div>
        <div className="hp7-info-value">
          {moveInChanged && (
            <span className="hp7-strikethrough">{formatFullDate(originalMoveIn) || 'TBD'}</span>
          )}
          <span className={moveInChanged ? 'hp7-changed-value' : ''}>
            {formatFullDate(moveIn) || 'TBD'}
          </span>
        </div>
      </div>
      <div className="hp7-info-item">
        <div className="hp7-info-label">Move-out</div>
        <div className="hp7-info-value">{formatFullDate(moveOut) || 'TBD'}</div>
      </div>
      <div className="hp7-info-item">
        <div className="hp7-info-label">Duration</div>
        <div className="hp7-info-value">
          {durationChanged && (
            <span className="hp7-strikethrough">{originalWeeks} weeks</span>
          )}
          <span className={durationChanged ? 'hp7-changed-value' : ''}>
            {duration ? `${duration} weeks` : 'TBD'}
          </span>
        </div>
      </div>
      <div className="hp7-info-item">
        <div className="hp7-info-label">Schedule</div>
        <div className="hp7-info-value">
          {daysChanged && (
            <span className="hp7-strikethrough">{formatScheduleRange(originalDays)}</span>
          )}
          <span className={daysChanged ? 'hp7-changed-value' : ''}>
            {formatScheduleRange(daysSelected)}
          </span>
        </div>
      </div>
      <div className="hp7-info-item">
        <div className="hp7-info-label">Nights</div>
        <div className="hp7-info-value">
          {nightsChanged && (
            <span className="hp7-strikethrough">{originalNights.length}/week</span>
          )}
          <span className={nightsChanged ? 'hp7-changed-value' : ''}>
            {nightsSelected.length > 0 ? `${nightsSelected.length}/week` : getNightsPerWeek(proposal)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default InfoGrid;
