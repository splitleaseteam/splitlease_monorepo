/**
 * ProposalStatusCard - Display proposal/lease status with visual indicator
 */
import { CheckCircle, Clock, XCircle, FileText, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  active: {
    icon: CheckCircle,
    color: '#16a34a',
    bg: '#dcfce7',
    label: 'Active'
  },
  completed: {
    icon: CheckCircle,
    color: '#1e40af',
    bg: '#dbeafe',
    label: 'Completed'
  },
  cancelled: {
    icon: XCircle,
    color: '#991b1b',
    bg: '#fee2e2',
    label: 'Cancelled'
  },
  pending: {
    icon: Clock,
    color: '#92400e',
    bg: '#fef3c7',
    label: 'Pending'
  },
  draft: {
    icon: FileText,
    color: '#374151',
    bg: '#f3f4f6',
    label: 'Draft'
  },
  unknown: {
    icon: AlertCircle,
    color: '#6b7280',
    bg: '#f3f4f6',
    label: 'Unknown'
  }
};

export default function ProposalStatusCard({ status, lease }) {
  const normalizedStatus = status?.toLowerCase() || 'unknown';
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.unknown;
  const Icon = config.icon;

  return (
    <div className="mlpr-card">
      <div className="mlpr-card-header">
        <Icon size={18} style={{ color: config.color }} />
        <h4>Status</h4>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        background: config.bg,
        borderRadius: '0.375rem',
        marginBottom: '0.75rem'
      }}>
        <Icon size={24} style={{ color: config.color }} />
        <div>
          <p style={{ fontWeight: 600, margin: 0, color: config.color }}>
            {config.label}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
            {normalizedStatus === 'active' && 'Lease is currently active'}
            {normalizedStatus === 'completed' && 'Lease has been completed'}
            {normalizedStatus === 'cancelled' && 'Lease has been cancelled'}
            {normalizedStatus === 'pending' && 'Awaiting confirmation'}
            {normalizedStatus === 'draft' && 'Draft - not finalized'}
            {normalizedStatus === 'unknown' && 'Status not available'}
          </p>
        </div>
      </div>

      {/* Additional status info */}
      <div className="mlpr-detail-row">
        <span className="mlpr-detail-label">Documents Generated:</span>
        <span className="mlpr-detail-value">
          {lease.wereDocumentsGenerated ? 'Yes' : 'No'}
        </span>
      </div>

      <div className="mlpr-detail-row">
        <span className="mlpr-detail-label">Thread ID:</span>
        <span className="mlpr-detail-value mlpr-id">
          {lease.thread || 'N/A'}
        </span>
      </div>

      <div className="mlpr-detail-row">
        <span className="mlpr-detail-label">Check-in Code:</span>
        <span className="mlpr-detail-value">
          {lease.checkInCode || 'Not set'}
        </span>
      </div>
    </div>
  );
}
