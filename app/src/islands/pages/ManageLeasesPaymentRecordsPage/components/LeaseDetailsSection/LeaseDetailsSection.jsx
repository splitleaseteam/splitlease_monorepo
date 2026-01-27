/**
 * LeaseDetailsSection - Display lease booking details
 *
 * Shows:
 * - Listing info with photo
 * - Agreement & Proposal IDs
 * - Reservation dates
 * - Check-in/out days
 * - Proposal status
 * - Guests allowed
 */
import { Calendar, Home, FileText, Users, DollarSign } from 'lucide-react';
import ReservationDatesCard from './ReservationDatesCard.jsx';
import ProposalStatusCard from './ProposalStatusCard.jsx';

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
 * Format currency for display
 */
function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export default function LeaseDetailsSection({ lease }) {
  if (!lease) return null;

  const listing = lease.listing || {};
  const proposal = lease.proposal || {};

  return (
    <section className="mlpr-section mlpr-details-section">
      <h2 className="mlpr-section-title">
        <FileText size={20} />
        Booking Details
      </h2>

      <div className="mlpr-details-grid">
        {/* Listing Info */}
        <div className="mlpr-card mlpr-listing-card">
          <div className="mlpr-card-header">
            <Home size={18} />
            <h4>Listing</h4>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '80px',
              height: '60px',
              background: '#e5e7eb',
              borderRadius: '0.375rem',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {listing.imageUrl ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af'
                }}>
                  <Home size={24} />
                </div>
              )}
            </div>
            <div>
              <p style={{ fontWeight: 600, margin: 0, fontSize: '0.875rem' }}>
                {listing.name || 'Unnamed Listing'}
              </p>
              <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0', fontSize: '0.75rem' }}>
                {[listing.address, listing.neighborhood, listing.city]
                  .filter(Boolean)
                  .join(', ') || 'No address'}
              </p>
            </div>
          </div>
        </div>

        {/* IDs Card */}
        <div className="mlpr-card">
          <div className="mlpr-card-header">
            <FileText size={18} />
            <h4>Identifiers</h4>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Lease ID:</span>
            <span className="mlpr-detail-value mlpr-id">{lease.id}</span>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Proposal ID:</span>
            <span className="mlpr-detail-value mlpr-id">{proposal.id || 'N/A'}</span>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Agreement #:</span>
            <span className="mlpr-detail-value">{lease.agreementNumber || 'Not assigned'}</span>
          </div>
        </div>

        {/* Reservation Dates */}
        <ReservationDatesCard lease={lease} />

        {/* Financial Info */}
        <div className="mlpr-card">
          <div className="mlpr-card-header">
            <DollarSign size={18} />
            <h4>Financial</h4>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Total Rent:</span>
            <span className="mlpr-detail-value">{formatCurrency(lease.totalRent)}</span>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Total Compensation:</span>
            <span className="mlpr-detail-value">{formatCurrency(lease.totalCompensation)}</span>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Paid to Date:</span>
            <span className="mlpr-detail-value">{formatCurrency(lease.paidToDate)}</span>
          </div>
        </div>

        {/* Proposal Status */}
        <ProposalStatusCard status={proposal.status || lease.status} lease={lease} />

        {/* Guest/Host Info */}
        <div className="mlpr-card">
          <div className="mlpr-card-header">
            <Users size={18} />
            <h4>Parties</h4>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Guest:</span>
            <span className="mlpr-detail-value">
              {lease.guest?.fullName || lease.guest?.email || 'Unknown'}
            </span>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Guest Email:</span>
            <span className="mlpr-detail-value">{lease.guest?.email || 'N/A'}</span>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Host:</span>
            <span className="mlpr-detail-value">
              {lease.host?.fullName || lease.host?.email || 'Unknown'}
            </span>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Host Email:</span>
            <span className="mlpr-detail-value">{lease.host?.email || 'N/A'}</span>
          </div>
        </div>

        {/* Week Tracking */}
        <div className="mlpr-card">
          <div className="mlpr-card-header">
            <Calendar size={18} />
            <h4>Week Tracking</h4>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Current Week:</span>
            <span className="mlpr-detail-value">
              {lease.currentWeekNumber != null ? `Week ${lease.currentWeekNumber}` : 'N/A'}
            </span>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Total Weeks:</span>
            <span className="mlpr-detail-value">
              {lease.totalWeekCount != null ? `${lease.totalWeekCount} weeks` : 'N/A'}
            </span>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Lease Signed:</span>
            <span className="mlpr-detail-value">{lease.leaseSigned ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
