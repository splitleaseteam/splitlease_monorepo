/**
 * LeaseCard Component
 *
 * Displays a single lease with expand/collapse functionality.
 * When expanded, shows detailed information including:
 * - Host contact info
 * - Payment records table
 * - Stays table with action buttons
 * - Date change requests table
 * - Flexibility score
 * - Document download buttons
 * - Emergency assistance button
 *
 * Props follow the LeaseCardProps interface from the plan.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Home, Calendar, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import StaysTable from './StaysTable.jsx';
import PaymentRecordsTable from './PaymentRecordsTable.jsx';
import DateChangeRequestsTable from './DateChangeRequestsTable.jsx';
import FlexibilityScore from './FlexibilityScore.jsx';
import './LeaseCard.css';

/**
 * Format a date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get status badge color
 * @param {string} status - Lease status
 * @returns {string} CSS class suffix
 */
function getStatusClass(status) {
  switch (status) {
    case 'active':
    case 'started':
      return 'active';
    case 'completed':
      return 'completed';
    case 'terminated':
    case 'cancelled':
      return 'terminated';
    default:
      return 'pending';
  }
}

export default function LeaseCard({
  lease,
  isExpanded,
  currentUserId,
  onToggleExpand,
  onCheckInOut,
  onSubmitReview,
  onSeeReview,
  onDateChangeApprove,
  onDateChangeReject,
  onRequestDateChange,
  onDownloadDocument,
  onEmergencyAssistance,
  onSeeReputation
}) {
  const [showAllStays, setShowAllStays] = useState(false);

  if (!lease) return null;

  const {
    _id,
    agreementNumber,
    status,
    startDate,
    endDate,
    currentWeekNumber,
    totalWeekCount,
    listing,
    host,
    stays = [],
    dateChangeRequests = [],
    paymentRecords = [],
    documents = []
  } = lease;

  const statusClass = getStatusClass(status);

  return (
    <article className={`lease-card ${isExpanded ? 'lease-card--expanded' : ''}`}>
      {/* Card Header - Always Visible */}
      <header
        className="lease-card__header"
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => e.key === 'Enter' && onToggleExpand()}
      >
        <div className="lease-card__header-main">
          {/* Listing Image */}
          <div className="lease-card__image">
            {listing?.imageUrl ? (
              <img src={listing.imageUrl} alt={listing.name || 'Listing'} />
            ) : (
              <div className="lease-card__image-placeholder">
                <Home size={24} />
              </div>
            )}
          </div>

          {/* Listing Info */}
          <div className="lease-card__info">
            <h2 className="lease-card__title">
              {listing?.name || 'Unnamed Listing'}
            </h2>
            <p className="lease-card__address">
              {listing?.neighborhood || listing?.address || 'Address not available'}
            </p>
            <div className="lease-card__meta">
              <span className={`lease-card__status lease-card__status--${statusClass}`}>
                {status || 'Unknown'}
              </span>
              {currentWeekNumber && totalWeekCount && (
                <span className="lease-card__week">
                  Week {currentWeekNumber} of {totalWeekCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expand Toggle */}
        <div className="lease-card__toggle">
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </header>

      {/* Card Content - Shown when expanded */}
      {isExpanded && (
        <div className="lease-card__content">
          {/* Agreement Info */}
          <section className="lease-card__section">
            <h3 className="lease-card__section-title">
              <Calendar size={18} />
              Lease Details
            </h3>
            <div className="lease-card__details-grid">
              <div className="lease-card__detail">
                <span className="lease-card__detail-label">Agreement #</span>
                <span className="lease-card__detail-value">{agreementNumber || 'N/A'}</span>
              </div>
              <div className="lease-card__detail">
                <span className="lease-card__detail-label">Start Date</span>
                <span className="lease-card__detail-value">{formatDate(startDate)}</span>
              </div>
              <div className="lease-card__detail">
                <span className="lease-card__detail-label">End Date</span>
                <span className="lease-card__detail-value">{formatDate(endDate)}</span>
              </div>
            </div>
          </section>

          {/* Host Contact Info */}
          {host && (
            <section className="lease-card__section">
              <h3 className="lease-card__section-title">Host Contact</h3>
              <div className="lease-card__host-info">
                <span className="lease-card__host-name">
                  {host.firstName} {host.lastName}
                </span>
                {host.email && (
                  <a href={`mailto:${host.email}`} className="lease-card__host-email">
                    {host.email}
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Documents Section */}
          <section className="lease-card__section">
            <h3 className="lease-card__section-title">
              <FileText size={18} />
              Documents
            </h3>
            <div className="lease-card__documents">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => onDownloadDocument('PT Agreement', lease.periodicTenancyAgreement)}
                disabled={!lease.periodicTenancyAgreement}
              >
                PT Agreement (PDF)
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => onDownloadDocument('Supplemental Terms', lease.supplementalAgreement)}
                disabled={!lease.supplementalAgreement}
              >
                Supplemental Terms (PDF)
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => onDownloadDocument('CC Auth Form', lease.creditCardAuthorizationForm)}
                disabled={!lease.creditCardAuthorizationForm}
              >
                CC Auth Form
              </button>
            </div>
          </section>

          {/* Payment Records */}
          {paymentRecords.length > 0 && (
            <section className="lease-card__section">
              <h3 className="lease-card__section-title">
                <DollarSign size={18} />
                Payment History
              </h3>
              <PaymentRecordsTable
                records={paymentRecords}
                onDownloadReceipt={(record) => onDownloadDocument('Receipt', record.receiptUrl)}
              />
            </section>
          )}

          {/* Stays Table */}
          <section className="lease-card__section">
            <h3 className="lease-card__section-title">
              <Calendar size={18} />
              Your Stays ({stays.length})
            </h3>
            <StaysTable
              stays={stays}
              leaseId={_id}
              showAll={showAllStays}
              onToggleShowAll={() => setShowAllStays(!showAllStays)}
              onCheckInOut={onCheckInOut}
              onSubmitReview={onSubmitReview}
              onSeeReview={onSeeReview}
            />
          </section>

          {/* Date Change Requests */}
          <section className="lease-card__section">
            <div className="lease-card__section-header">
              <h3 className="lease-card__section-title">
                Date Change Requests
              </h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onRequestDateChange(lease)}
              >
                <Calendar size={16} />
                Request Date Change
              </button>
            </div>
            {dateChangeRequests.length > 0 ? (
              <DateChangeRequestsTable
                requests={dateChangeRequests}
                currentUserId={currentUserId}
                onApprove={onDateChangeApprove}
                onReject={onDateChangeReject}
                onRequestChanges={onRequestDateChange}
              />
            ) : (
              <p className="lease-card__empty-text">
                No date change requests yet.
              </p>
            )}
          </section>

          {/* Flexibility Score */}
          <section className="lease-card__section">
            <FlexibilityScore
              lease={lease}
              dateChangeRequests={dateChangeRequests}
              currentUserId={currentUserId}
              onSeeReputation={onSeeReputation}
            />
          </section>

          {/* Emergency Assistance */}
          <section className="lease-card__section lease-card__section--emergency">
            <button
              className="btn btn-emergency"
              onClick={onEmergencyAssistance}
            >
              <AlertTriangle size={18} />
              Emergency Assistance
            </button>
          </section>
        </div>
      )}
    </article>
  );
}
