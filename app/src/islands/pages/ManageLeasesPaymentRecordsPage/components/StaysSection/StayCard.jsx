/**
 * StayCard - Display individual stay information
 */
import { Copy, Calendar, Hash } from 'lucide-react';

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

/**
 * Format date for badge display
 */
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export default function StayCard({ stay, index, onCopyId }) {
  const dates = stay.dates || [];
  const displayDates = dates.slice(0, 5);
  const hasMore = dates.length > 5;

  const getStatusClass = (status) => {
    const statusMap = {
      active: 'mlpr-status-active',
      completed: 'mlpr-status-completed',
      cancelled: 'mlpr-status-cancelled',
      pending: 'mlpr-status-pending',
    };
    return statusMap[(status || '').toLowerCase()] || 'mlpr-status-unknown';
  };

  return (
    <div className="mlpr-stay-card">
      <div className="mlpr-stay-header">
        <span className="mlpr-stay-number">
          <Calendar size={14} style={{ marginRight: '0.25rem' }} />
          Week {stay.weekNumber || index + 1}
        </span>
        <span className={`mlpr-status ${getStatusClass(stay.status)}`}>
          {stay.status || 'unknown'}
        </span>
      </div>

      <div className="mlpr-stay-id">
        <Hash size={12} />
        <span>{(stay.id || '').slice(0, 12)}...</span>
        <button
          type="button"
          onClick={() => onCopyId(stay.id)}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px',
            cursor: 'pointer',
            color: '#6b7280'
          }}
          title="Copy ID"
        >
          <Copy size={12} />
        </button>
      </div>

      <div className="mlpr-stay-details">
        <div className="mlpr-stay-row">
          <span className="mlpr-stay-label">Check-in:</span>
          <span className="mlpr-stay-value">{formatDate(stay.checkIn)}</span>
        </div>

        <div className="mlpr-stay-row">
          <span className="mlpr-stay-label">Check-out:</span>
          <span className="mlpr-stay-value">{formatDate(stay.checkOut)}</span>
        </div>

        <div className="mlpr-stay-row">
          <span className="mlpr-stay-label">Last Night:</span>
          <span className="mlpr-stay-value">{formatDate(stay.lastNight)}</span>
        </div>

        <div className="mlpr-stay-row">
          <span className="mlpr-stay-label">Amount:</span>
          <span className="mlpr-stay-value">{formatCurrency(stay.amount)}</span>
        </div>

        {dates.length > 0 && (
          <div className="mlpr-stay-row" style={{ alignItems: 'flex-start' }}>
            <span className="mlpr-stay-label">Dates:</span>
            <div className="mlpr-stay-dates-list">
              {displayDates.map((date, i) => (
                <span key={i} className="mlpr-stay-date-badge">
                  {formatShortDate(date)}
                </span>
              ))}
              {hasMore && (
                <span className="mlpr-stay-date-more">
                  +{dates.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
