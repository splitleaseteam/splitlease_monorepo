/**
 * ChangeRequestCard - Display individual change request
 */
import { Calendar, ArrowRight, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';

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
 * Format short date for badge
 */
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: '#92400e',
    bg: '#fef3c7',
    label: 'Pending'
  },
  approved: {
    icon: CheckCircle,
    color: '#166534',
    bg: '#dcfce7',
    label: 'Approved'
  },
  rejected: {
    icon: XCircle,
    color: '#991b1b',
    bg: '#fee2e2',
    label: 'Rejected'
  },
  cancelled: {
    icon: XCircle,
    color: '#6b7280',
    bg: '#f3f4f6',
    label: 'Cancelled'
  }
};

export default function ChangeRequestCard({ request, onOpenPdf }) {
  const statusNorm = (request.requestStatus || 'pending').toLowerCase();
  const config = STATUS_CONFIG[statusNorm] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  const oldDates = request.listOfOldDates || [];
  const newDates = request.listOfNewDates || [];

  return (
    <div className="mlpr-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <p style={{ fontWeight: 600, margin: 0, fontSize: '0.875rem' }}>
            {request.requestType || 'Date Change Request'}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
            Requested: {formatDate(request.dateAdded)}
          </p>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 500,
            background: config.bg,
            color: config.color
          }}
        >
          <Icon size={12} />
          {config.label}
        </span>
      </div>

      {/* Date Changes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
            Original Dates ({oldDates.length})
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {oldDates.slice(0, 3).map((date, i) => (
              <span
                key={i}
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: '2px 6px',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                {formatShortDate(date)}
              </span>
            ))}
            {oldDates.length > 3 && (
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                +{oldDates.length - 3} more
              </span>
            )}
          </div>
        </div>

        <ArrowRight size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />

        <div>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
            Requested Dates ({newDates.length})
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {newDates.slice(0, 3).map((date, i) => (
              <span
                key={i}
                style={{
                  background: '#dcfce7',
                  color: '#166534',
                  padding: '2px 6px',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                {formatShortDate(date)}
              </span>
            ))}
            {newDates.length > 3 && (
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                +{newDates.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price Adjustment */}
      {request.priceAdjustment && (
        <p style={{ fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
          <span style={{ color: '#6b7280' }}>Price Adjustment:</span>{' '}
          <span style={{
            fontWeight: 600,
            color: request.priceAdjustment > 0 ? '#166534' : request.priceAdjustment < 0 ? '#991b1b' : '#374151'
          }}>
            {request.priceAdjustment > 0 ? '+' : ''}${request.priceAdjustment}
          </span>
        </p>
      )}

      {/* Associated Stays */}
      {(request.stayAssociated1 || request.stayAssociated2) && (
        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
          Associated Stays: {[request.stayAssociated1, request.stayAssociated2].filter(Boolean).join(', ')}
        </p>
      )}

      {/* PDF Link */}
      {request.pdfUrl && (
        <button
          type="button"
          className="mlpr-btn mlpr-btn-sm mlpr-btn-outline"
          onClick={() => onOpenPdf(request.pdfUrl)}
          style={{ marginTop: '0.5rem' }}
        >
          <ExternalLink size={14} />
          View PDF
        </button>
      )}
    </div>
  );
}
