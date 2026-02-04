/**
 * CancellationSection - Cancel lease functionality
 *
 * Features:
 * - Reason dropdown
 * - Disagreeing party selection (Guest/Host/Other)
 * - Cancel lease button with confirmation
 */
import { useState } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';

const CANCELLATION_REASONS = [
  { value: 'guest_request', label: 'Guest Requested Cancellation' },
  { value: 'host_request', label: 'Host Requested Cancellation' },
  { value: 'payment_issue', label: 'Payment Issues' },
  { value: 'violation', label: 'Lease Violation' },
  { value: 'emergency', label: 'Emergency / Force Majeure' },
  { value: 'mutual', label: 'Mutual Agreement' },
  { value: 'other', label: 'Other' },
];

const DISAGREEING_PARTIES = [
  { value: 'guest', label: 'Guest' },
  { value: 'host', label: 'Host' },
  { value: 'neither', label: 'Neither (Mutual)' },
  { value: 'both', label: 'Both' },
  { value: 'other', label: 'Other' },
];

export default function CancellationSection({ lease, onCancel, isLoading }) {
  const [reason, setReason] = useState('');
  const [disagreeingParty, setDisagreeingParty] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = async () => {
    if (!reason) {
      alert('Please select a cancellation reason');
      return;
    }
    await onCancel(reason, disagreeingParty);
    setShowConfirm(false);
    setReason('');
    setDisagreeingParty('');
  };

  // Already cancelled
  if (lease.status === 'cancelled') {
    return (
      <section className="mlpr-section mlpr-cancellation-section">
        <h2 className="mlpr-section-title" style={{ color: '#991b1b' }}>
          <XCircle size={20} />
          Lease Cancelled
        </h2>
        <div style={{
          padding: '1rem',
          background: '#fee2e2',
          borderRadius: '0.375rem',
          color: '#991b1b'
        }}>
          <p style={{ margin: 0 }}>This lease has already been cancelled.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mlpr-section mlpr-cancellation-section">
      <h2 className="mlpr-section-title" style={{ color: '#991b1b' }}>
        <AlertTriangle size={20} />
        Cancel Lease
      </h2>
      <p className="mlpr-section-subtitle">
        Cancelling a lease will update its status and may trigger notifications
      </p>

      <div className="mlpr-form-grid">
        <div className="mlpr-form-field">
          <label className="mlpr-label">Cancellation Reason</label>
          <select
            className="mlpr-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">Select reason...</option>
            {CANCELLATION_REASONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="mlpr-form-field">
          <label className="mlpr-label">Disagreeing Party</label>
          <select
            className="mlpr-select"
            value={disagreeingParty}
            onChange={(e) => setDisagreeingParty(e.target.value)}
          >
            <option value="">Select party...</option>
            {DISAGREEING_PARTIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        className="mlpr-btn mlpr-btn-danger"
        onClick={() => setShowConfirm(true)}
        disabled={isLoading || !reason}
        style={{ marginTop: '1rem' }}
      >
        <XCircle size={16} />
        Cancel Lease
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
        >
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b' }}>
              <AlertTriangle size={24} />
              Confirm Cancellation
            </h3>
            <p style={{ color: '#374151', marginBottom: '1.5rem' }}>
              Are you sure you want to cancel this lease?
              This action cannot be easily undone.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              <strong>Reason:</strong> {CANCELLATION_REASONS.find(r => r.value === reason)?.label}
            </p>
            {disagreeingParty && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                <strong>Disagreeing Party:</strong> {DISAGREEING_PARTIES.find(p => p.value === disagreeingParty)?.label}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="mlpr-btn mlpr-btn-secondary"
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
              >
                Keep Lease
              </button>
              <button
                type="button"
                className="mlpr-btn mlpr-btn-danger"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {isLoading ? 'Cancelling...' : 'Yes, Cancel Lease'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
