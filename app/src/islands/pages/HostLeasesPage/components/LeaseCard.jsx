/**
 * LeaseCard Component
 *
 * Displays a single lease with expandable sections for:
 * - Guest information
 * - Payment records
 * - Stays with review action
 * - Date change requests
 * - PDF document links
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, User, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import {
  formatCurrency,
  formatFullDate,
  formatDateRange,
  getLeaseStatusClass,
} from '../formatters.js';
import GuestInfoSection from './GuestInfoSection.jsx';
import PaymentRecordsTable from './PaymentRecordsTable.jsx';
import StaysTable from './StaysTable.jsx';
import DateChangeSection from './DateChangeSection.jsx';
import PdfLinksRow from './PdfLinksRow.jsx';

/**
 * LeaseCard displays a single lease with all related information
 *
 * @param {Object} props
 * @param {Object} props.lease - The normalized lease object
 * @param {Object} props.expanded - Expansion state for this card { details, allStays, payments, dateChanges }
 * @param {Object} props.handlers - Event handlers
 */
export function LeaseCard({ lease, expanded = {}, handlers }) {
  const [isCardExpanded, setIsCardExpanded] = useState(true);

  if (!lease) return null;

  const {
    id,
    agreementNumber,
    leaseStatus,
    guest,
    reservationStart,
    reservationEnd,
    totalCompensation,
    stays = [],
    paymentRecords = [],
    dateChangeRequests = [],
    contract,
    supplementalAgreement,
    hostPayoutSchedule,
    periodicTenancyAgreement,
  } = lease;

  const pendingDateChanges = dateChangeRequests.filter(dcr => dcr.status?.toLowerCase() === 'pending');
  const hasPendingDateChanges = pendingDateChanges.length > 0;

  const toggleCard = () => setIsCardExpanded(!isCardExpanded);

  return (
    <div className="hl-lease-card">
      {/* Card Header */}
      <div className="hl-lease-card-header" onClick={toggleCard}>
        <div className="hl-lease-card-header-left">
          <h3 className="hl-lease-agreement-number">
            Agreement #{agreementNumber || 'N/A'}
          </h3>
          <span className={getLeaseStatusClass(leaseStatus)}>
            {leaseStatus || 'Unknown'}
          </span>
          {hasPendingDateChanges && (
            <span className="hl-pending-badge" title="Pending date change requests">
              <AlertCircle size={14} />
              {pendingDateChanges.length} Pending
            </span>
          )}
        </div>
        <div className="hl-lease-card-header-right">
          <span className="hl-lease-dates">
            <Calendar size={14} />
            {formatDateRange(reservationStart, reservationEnd)}
          </span>
          <span className="hl-lease-total">
            <DollarSign size={14} />
            {formatCurrency(totalCompensation)}
          </span>
          <button
            type="button"
            className="hl-card-toggle"
            aria-expanded={isCardExpanded}
            aria-label={isCardExpanded ? 'Collapse lease details' : 'Expand lease details'}
          >
            {isCardExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Card Body */}
      {isCardExpanded && (
        <div className="hl-lease-card-body">
          {/* Guest Info Section */}
          <GuestInfoSection
            guest={guest}
            isExpanded={expanded.details}
            onToggle={() => handlers.onToggleDetails?.(id)}
          />

          {/* PDF Links Row */}
          <PdfLinksRow
            contract={contract}
            supplementalAgreement={supplementalAgreement}
            hostPayoutSchedule={hostPayoutSchedule}
            periodicTenancyAgreement={periodicTenancyAgreement}
            onOpenDocument={(type) => handlers.onOpenDocument?.(type, lease)}
          />

          {/* Stays Table */}
          <StaysTable
            stays={stays}
            showAll={expanded.allStays}
            onToggleShowAll={() => handlers.onToggleAllStays?.(id)}
            onOpenReview={handlers.onOpenReview}
          />

          {/* Payment Records Table */}
          <PaymentRecordsTable
            payments={paymentRecords}
          />

          {/* Date Change Requests Section */}
          {dateChangeRequests.length > 0 && (
            <DateChangeSection
              requests={dateChangeRequests}
              onAccept={handlers.onAcceptDateChange}
              onDecline={handlers.onDeclineDateChange}
              onViewDetails={handlers.onViewDateChangeDetails}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default LeaseCard;
