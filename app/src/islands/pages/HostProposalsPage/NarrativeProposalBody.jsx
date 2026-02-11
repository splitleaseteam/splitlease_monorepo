/**
 * NarrativeProposalBody Component (Mobile Only)
 *
 * Displays proposal details in a human-readable narrative format
 * instead of the structured grid layout. Only shown on mobile (≤640px).
 *
 * Structure:
 * 1. Duration paragraph - "This proposal is for a 12-week stay..."
 * 2. Schedule paragraph - "The schedule is Monday through Friday..."
 * 3. Pricing paragraph - "At $165/night, this works out to..."
 * 4. Guest context - Compact profile with avatar
 * 5. Action row - Total earnings + action buttons
 *
 * Part of the Host Proposals V7 redesign.
 */
import React from 'react';
import { generateNarrativeText, formatCurrency } from './formatters.js';
import ActionButtonsRow from './ActionButtonsRow.jsx';

/**
 * NarrativeProposalBody displays the expanded content in narrative format
 *
 * @param {Object} props
 * @param {Object} props.proposal - The proposal object
 * @param {Object} props.handlers - Object containing all action handlers
 * @param {Function} props.onViewProfile - Handler to view guest profile
 */
export function NarrativeProposalBody({ proposal, handlers = {}, onViewProfile }) {
  const { duration, schedule, pricing, guestContext } = generateNarrativeText(proposal);

  return (
    <div className="hp7-narrative-body">
      {/* Narrative paragraphs */}
      <div className="hp7-narrative-content">
        {/* Duration paragraph */}
        <p className="hp7-narrative-paragraph">
          {duration.text}, from{' '}
          <strong className="hp7-highlight-purple">{duration.startDate}</strong> through{' '}
          <strong className="hp7-highlight-purple">{duration.endDate}</strong>.
        </p>

        {/* Schedule paragraph */}
        <p className="hp7-narrative-paragraph">
          {schedule.text.split(schedule.dayRangeText).map((part, i, _arr) => (
            <React.Fragment key={i}>
              {i > 0 && <strong>{schedule.dayRangeText}</strong>}
              {part.split(`${schedule.nightsPerWeek} nights per week`).map((subpart, j, _subarr) => (
                <React.Fragment key={j}>
                  {j > 0 && <strong>{schedule.nightsPerWeek} nights per week</strong>}
                  {subpart}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </p>

        {/* Pricing paragraph - rental-type-aware */}
        <p className="hp7-narrative-paragraph">
          At <strong className="hp7-highlight-money">${formatCurrency(pricing.rateValue)}{pricing.rateUnit}</strong>, this totals{' '}
          <strong className="hp7-highlight-money">${formatCurrency(pricing.total)}</strong> over {pricing.periodCount} {pricing.periodUnit}.
        </p>
      </div>

      {/* Guest context - simplified: just name + profile link */}
      <div className="hp7-narrative-guest">
        {guestContext.avatar ? (
          <img
            src={guestContext.avatar}
            alt=""
            className="hp7-narrative-avatar"
          />
        ) : (
          <div className="hp7-narrative-avatar hp7-narrative-avatar-placeholder">
            {guestContext.firstName.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="hp7-narrative-guest-text">
          <strong>{guestContext.firstName}</strong>
          {' · '}
          <button
            type="button"
            className="hp7-narrative-link"
            onClick={() => onViewProfile?.(proposal)}
          >
            View full profile
          </button>
        </p>
      </div>

      {/* Action row - total + buttons */}
      <div className="hp7-narrative-actions">
        <div className="hp7-narrative-earnings">
          <span className="hp7-narrative-total">${formatCurrency(pricing.total)}</span>
          <span className="hp7-narrative-total-label">total earnings</span>
        </div>

        {/* Reuse existing ActionButtonsRow for consistency */}
        <ActionButtonsRow
          proposal={proposal}
          onAccept={() => handlers.onAccept?.(proposal)}
          onModify={() => handlers.onModify?.(proposal)}
          onDecline={() => handlers.onDecline?.(proposal)}
          onRemindGuest={() => handlers.onRemindGuest?.(proposal)}
          onMessage={() => handlers.onMessage?.(proposal)}
          onScheduleMeeting={() => handlers.onScheduleMeeting?.(proposal)}
          onEditCounter={() => handlers.onEditCounter?.(proposal)}
          onWithdraw={() => handlers.onWithdraw?.(proposal)}
          onRemove={() => handlers.onRemove?.(proposal)}
          onRequestRentalApp={() => handlers.onRequestRentalApp?.(proposal)}
        />
      </div>
    </div>
  );
}

export default NarrativeProposalBody;
