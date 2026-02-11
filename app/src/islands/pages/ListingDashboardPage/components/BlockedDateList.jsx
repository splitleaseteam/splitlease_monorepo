import React from 'react';

/**
 * Format a date string for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatBlockedDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Component for displaying and managing blocked dates
 */
const BlockedDateList = React.memo(function BlockedDateList({
  allFutureBlockedDates,
  displayedBlockedDates,
  toggleBlockedDate,
  showAllBlockedDates,
  setShowAllBlockedDates,
  hasMoreDates,
  pastBlockedDates,
  showPastBlockedDates,
  setShowPastBlockedDates,
}) {
  return (
    <div className="listing-dashboard-availability__info">
      <p><strong>Dates Blocked by You</strong></p>
      {allFutureBlockedDates.length > 0 ? (
        <div className="listing-dashboard-availability__blocked-list">
          {displayedBlockedDates.map((dateKey) => (
            <span key={dateKey} className="listing-dashboard-availability__blocked-date">
              {formatBlockedDate(dateKey)}
              <button
                type="button"
                className="listing-dashboard-availability__remove-date"
                onClick={() => toggleBlockedDate(dateKey)}
                title="Remove blocked date"
                aria-label={`Remove blocked date ${formatBlockedDate(dateKey)}`}
              >
                ×
              </button>
            </span>
          ))}
          {hasMoreDates && !showAllBlockedDates && (
            <button
              type="button"
              className="listing-dashboard-availability__more-dates-btn"
              onClick={() => setShowAllBlockedDates(true)}
            >
              +{allFutureBlockedDates.length - 10} more dates
            </button>
          )}
          {showAllBlockedDates && hasMoreDates && (
            <button
              type="button"
              className="listing-dashboard-availability__more-dates-btn"
              onClick={() => setShowAllBlockedDates(false)}
            >
              Show less
            </button>
          )}
        </div>
      ) : (
        <p className="listing-dashboard-availability__no-blocked">
          You don&apos;t have any future date blocked yet
        </p>
      )}

      {/* Past blocked dates - expandable section */}
      {pastBlockedDates.length > 0 && (
        <div className="listing-dashboard-availability__past-dates">
          <button
            type="button"
            className="listing-dashboard-availability__past-dates-toggle"
            onClick={() => setShowPastBlockedDates(!showPastBlockedDates)}
          >
            <span>{showPastBlockedDates ? '▼' : '▶'}</span>
            <span>Past blocked dates ({pastBlockedDates.length})</span>
          </button>
          {showPastBlockedDates && (
            <div className="listing-dashboard-availability__blocked-list listing-dashboard-availability__blocked-list--past">
              {pastBlockedDates.map((dateKey) => (
                <span key={dateKey} className="listing-dashboard-availability__blocked-date listing-dashboard-availability__blocked-date--past">
                  {formatBlockedDate(dateKey)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default BlockedDateList;
