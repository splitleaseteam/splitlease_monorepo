/**
 * BookedDatesDisplay - Show lists of booked dates
 */
import { List } from 'lucide-react';

/**
 * Format date for display
 */
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function BookedDatesDisplay({ original = [], afterRequest = [], proposalDates = [] }) {
  const hasData = original.length > 0 || afterRequest.length > 0 || proposalDates.length > 0;

  if (!hasData) {
    return (
      <div style={{
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '0.375rem',
        textAlign: 'center',
        color: '#6b7280',
        marginTop: '1rem'
      }}>
        <List size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '0.875rem' }}>No booked dates recorded</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginTop: '1rem'
    }}>
      {/* Original Booked Dates */}
      <div className="mlpr-card">
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
          Original Booked Dates ({original.length})
        </h4>
        <div style={{
          maxHeight: '120px',
          overflowY: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem'
        }}>
          {original.length === 0 ? (
            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>None</span>
          ) : (
            original.slice(0, 20).map((date, i) => (
              <span
                key={i}
                style={{
                  background: 'rgba(124, 58, 237, 0.1)',
                  color: '#7c3aed',
                  padding: '2px 6px',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                {formatShortDate(date)}
              </span>
            ))
          )}
          {original.length > 20 && (
            <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
              +{original.length - 20} more
            </span>
          )}
        </div>
      </div>

      {/* After Request Booked Dates */}
      <div className="mlpr-card">
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
          After Request ({afterRequest.length})
        </h4>
        <div style={{
          maxHeight: '120px',
          overflowY: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem'
        }}>
          {afterRequest.length === 0 ? (
            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>None</span>
          ) : (
            afterRequest.slice(0, 20).map((date, i) => (
              <span
                key={i}
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '2px 6px',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                {formatShortDate(date)}
              </span>
            ))
          )}
          {afterRequest.length > 20 && (
            <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
              +{afterRequest.length - 20} more
            </span>
          )}
        </div>
      </div>

      {/* Proposal Booked Dates */}
      <div className="mlpr-card">
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
          Proposal Dates ({proposalDates.length})
        </h4>
        <div style={{
          maxHeight: '120px',
          overflowY: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem'
        }}>
          {proposalDates.length === 0 ? (
            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>None</span>
          ) : (
            proposalDates.slice(0, 20).map((date, i) => (
              <span
                key={i}
                style={{
                  background: '#dbeafe',
                  color: '#1e40af',
                  padding: '2px 6px',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                {formatShortDate(date)}
              </span>
            ))
          )}
          {proposalDates.length > 20 && (
            <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
              +{proposalDates.length - 20} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
