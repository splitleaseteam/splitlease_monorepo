/**
 * StaysTable Component
 *
 * Displays individual stay periods in a table format.
 * Shows: Week #, Period, Status, Review Action
 */
import { Calendar, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { formatStayPeriod, getStayStatusClass } from '../formatters.js';

/**
 * StaysTable displays stay periods in a table
 *
 * @param {Object} props
 * @param {Array} props.stays - Array of normalized stay records
 * @param {boolean} props.showAll - Whether to show all stays or just first 3
 * @param {Function} props.onToggleShowAll - Toggle showing all stays
 * @param {Function} props.onOpenReview - Open review modal for a stay
 */
export function StaysTable({ stays = [], showAll = false, onToggleShowAll, onOpenReview }) {
  if (!stays || stays.length === 0) {
    return null;
  }

  // Show first 3 stays by default, all if expanded
  const displayedStays = showAll ? stays : stays.slice(0, 3);
  const hasMore = stays.length > 3;

  return (
    <div className="hl-stays-section">
      <div className="hl-stays-header">
        <div className="hl-stays-title">
          <Calendar size={18} />
          <span>Stays</span>
          <span className="hl-stays-count">({stays.length} total)</span>
        </div>
      </div>

      <div className="hl-stays-table-wrapper">
        <table className="hl-stays-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>Period</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedStays.map((stay, index) => {
              const canReview = stay.stayStatus?.toLowerCase() === 'completed' && !stay.reviewSubmittedByHost;

              return (
                <tr key={stay.id || index}>
                  <td className="hl-stay-week">{stay.weekNumber || index + 1}</td>
                  <td className="hl-stay-period">
                    {formatStayPeriod(stay.checkInNight, stay.lastNight)}
                  </td>
                  <td>
                    <span className={getStayStatusClass(stay.stayStatus)}>
                      {stay.stayStatus || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    {canReview ? (
                      <button
                        type="button"
                        className="hl-btn hl-btn-small hl-btn-review"
                        onClick={() => onOpenReview?.(stay)}
                      >
                        <Star size={12} />
                        Review Guest
                      </button>
                    ) : stay.reviewSubmittedByHost ? (
                      <span className="hl-review-submitted">
                        <Star size={12} className="hl-star-filled" />
                        Reviewed
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show More/Less Toggle */}
      {hasMore && (
        <button
          type="button"
          className="hl-stays-toggle-all"
          onClick={onToggleShowAll}
        >
          {showAll ? (
            <>
              <ChevronUp size={14} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Show All {stays.length} Stays
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default StaysTable;
