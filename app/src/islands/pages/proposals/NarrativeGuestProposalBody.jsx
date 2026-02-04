/**
 * NarrativeGuestProposalBody Component (Mobile Only)
 *
 * Displays proposal details in a human-readable narrative format
 * instead of the structured grid layout. Only shown on mobile (≤640px).
 *
 * Structure:
 * 1. Listing context - Host avatar + listing name + location + view link
 * 2. Duration paragraph - "This is a 12-week stay..."
 * 3. Schedule paragraph - "The schedule is Monday through Friday..."
 * 4. Pricing paragraph - "At $165/night, this works out to..."
 * 5. Action row - Total cost + action buttons (passed as children)
 *
 * Part of the Guest Proposals V7 redesign.
 */
import React from 'react';
import { generateGuestNarrativeText, formatCurrency } from './displayUtils.js';

/**
 * NarrativeGuestProposalBody displays the expanded content in narrative format
 *
 * @param {Object} props
 * @param {Object} props.proposal - The proposal object
 * @param {Function} props.onViewListing - Handler to view listing details
 * @param {React.ReactNode} props.children - Action buttons to render
 */
export function NarrativeGuestProposalBody({ proposal, onViewListing, children }) {
  const { duration, schedule, pricing, listingContext } = generateGuestNarrativeText(proposal);

  return (
    <div className="epc-narrative-body">
      {/* Listing context - simplified: host avatar + name + location + view link */}
      <div className="epc-narrative-listing">
        {listingContext.hostPhoto ? (
          <img
            src={listingContext.hostPhoto}
            alt=""
            className="epc-narrative-host-avatar"
          />
        ) : (
          <div className="epc-narrative-host-avatar epc-narrative-avatar-placeholder">
            {listingContext.hostFirstName.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="epc-narrative-listing-text">
          <strong>{listingContext.listingName}</strong>
          {' · '}
          <span className="epc-narrative-location">{listingContext.location}</span>
          {' · '}
          <button
            type="button"
            className="epc-narrative-link"
            onClick={onViewListing}
          >
            View listing
          </button>
        </p>
      </div>

      {/* Narrative paragraphs */}
      <div className="epc-narrative-content">
        {/* Duration paragraph */}
        <p className="epc-narrative-paragraph">
          {duration.text}, from{' '}
          <strong className="epc-highlight-purple">{duration.startDate || 'TBD'}</strong> through{' '}
          <strong className="epc-highlight-purple">{duration.endDate || 'TBD'}</strong>.
        </p>

        {/* Schedule paragraph - with dynamic highlighting */}
        <p className="epc-narrative-paragraph">
          {schedule.dayRangeText ? (
            schedule.text.split(schedule.dayRangeText).map((part, i, arr) => (
              <React.Fragment key={i}>
                {i > 0 && <strong>{schedule.dayRangeText}</strong>}
                {part.split(`${schedule.nightsPerWeek} nights per week`).map((subpart, j) => (
                  <React.Fragment key={j}>
                    {j > 0 && <strong>{schedule.nightsPerWeek} nights per week</strong>}
                    {subpart}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))
          ) : (
            schedule.text
          )}
        </p>

        {/* Pricing paragraph */}
        <p className="epc-narrative-paragraph">
          At <strong className="epc-highlight-money">{formatCurrency(pricing.nightlyRate)}/night</strong>, this works out to{' '}
          <strong className="epc-highlight-money">{formatCurrency(pricing.weeklyPrice)} per week</strong> — totaling{' '}
          <strong className="epc-highlight-money">{formatCurrency(pricing.total)}</strong> over the {pricing.weeks} weeks.
        </p>
      </div>

      {/* Action row - total + buttons */}
      <div className="epc-narrative-actions">
        <div className="epc-narrative-total-area">
          <span className="epc-narrative-total">{formatCurrency(pricing.total)}</span>
          <span className="epc-narrative-total-label">estimated total</span>
        </div>

        {/* Render passed action buttons */}
        {children}
      </div>
    </div>
  );
}

export default NarrativeGuestProposalBody;
