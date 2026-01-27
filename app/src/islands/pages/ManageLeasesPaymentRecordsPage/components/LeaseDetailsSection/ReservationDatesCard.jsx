/**
 * ReservationDatesCard - Display reservation date information
 */
import { Calendar } from 'lucide-react';

/**
 * Format a date for display
 */
function formatDate(date) {
  if (!date) return 'Not set';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get day name from day index (0-6, Sunday-Saturday)
 */
function getDayName(dayIndex) {
  if (dayIndex == null) return 'Not set';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || 'Unknown';
}

export default function ReservationDatesCard({ lease }) {
  return (
    <div className="mlpr-card mlpr-dates-card">
      <div className="mlpr-card-header">
        <Calendar size={18} />
        <h4>Reservation Dates</h4>
      </div>

      <div className="mlpr-detail-row">
        <span className="mlpr-detail-label">Start (Move-In):</span>
        <span className="mlpr-detail-value">{formatDate(lease.startDate)}</span>
      </div>

      <div className="mlpr-detail-row">
        <span className="mlpr-detail-label">End (Move-Out):</span>
        <span className="mlpr-detail-value">{formatDate(lease.endDate)}</span>
      </div>

      <div className="mlpr-detail-row">
        <span className="mlpr-detail-label">Check-In Day:</span>
        <span className="mlpr-detail-value">
          <span className="mlpr-status mlpr-status-active" style={{ background: '#dbeafe', color: '#1e40af' }}>
            {getDayName(lease.checkInDay)}
          </span>
        </span>
      </div>

      <div className="mlpr-detail-row">
        <span className="mlpr-detail-label">Check-Out Day:</span>
        <span className="mlpr-detail-value">
          <span className="mlpr-status mlpr-status-active" style={{ background: '#fef3c7', color: '#92400e' }}>
            {getDayName(lease.checkOutDay)}
          </span>
        </span>
      </div>

      <div className="mlpr-detail-row">
        <span className="mlpr-detail-label">First Payment:</span>
        <span className="mlpr-detail-value">{formatDate(lease.firstPaymentDate)}</span>
      </div>

      <div className="mlpr-detail-row">
        <span className="mlpr-detail-label">Created:</span>
        <span className="mlpr-detail-value">{formatDate(lease.createdAt)}</span>
      </div>
    </div>
  );
}
