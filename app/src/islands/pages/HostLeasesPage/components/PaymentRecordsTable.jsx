/**
 * PaymentRecordsTable Component
 *
 * Displays payment schedule and history in a table format.
 * Shows: Payment #, Scheduled Date, Actual Date, Rent, Maintenance Fee, Damage Deposit, Total
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, Receipt, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '../formatters.js';

/**
 * PaymentRecordsTable displays payment records in a table
 *
 * @param {Object} props
 * @param {Array} props.payments - Array of normalized payment records
 */
export function PaymentRecordsTable({ payments = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!payments || payments.length === 0) {
    return null;
  }

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  // Calculate summary stats
  const totalPaid = payments.filter(p => p.isPaid).reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPending = payments.filter(p => !p.isPaid).reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const paidCount = payments.filter(p => p.isPaid).length;

  return (
    <div className="hl-payments-section">
      <div className="hl-payments-header" onClick={toggleExpanded} role="button" tabIndex={0}>
        <div className="hl-payments-title">
          <Receipt size={18} />
          <span>Payment Records</span>
          <span className="hl-payments-summary">
            {paidCount}/{payments.length} paid - {formatCurrency(totalPaid)} received
          </span>
        </div>
        <button
          type="button"
          className="hl-payments-toggle"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide payment records' : 'Show payment records'}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="hl-payments-table-wrapper">
          <table className="hl-payments-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Scheduled</th>
                <th>Actual</th>
                <th>Rent</th>
                <th>Maint. Fee</th>
                <th>Deposit</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={payment.id || index} className={payment.isPaid ? 'hl-payment-paid' : 'hl-payment-pending'}>
                  <td>{payment.paymentNumber || index + 1}</td>
                  <td>{formatDate(payment.scheduledDate)}</td>
                  <td>{payment.actualDate ? formatDate(payment.actualDate) : '-'}</td>
                  <td>{formatCurrency(payment.rentAmount)}</td>
                  <td>{formatCurrency(payment.maintenanceFee)}</td>
                  <td>{payment.damageDeposit ? formatCurrency(payment.damageDeposit) : '-'}</td>
                  <td className="hl-payment-total">{formatCurrency(payment.totalAmount)}</td>
                  <td>
                    {payment.isPaid ? (
                      <span className="hl-payment-status hl-payment-status-paid">
                        <CheckCircle size={12} />
                        Paid
                        {payment.paymentReceipt && (
                          <a
                            href={payment.paymentReceipt}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hl-payment-receipt-link"
                            title="View receipt"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </span>
                    ) : (
                      <span className="hl-payment-status hl-payment-status-pending">
                        <Clock size={12} />
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="hl-payment-footer-label">Total</td>
                <td className="hl-payment-total">{formatCurrency(totalPaid + totalPending)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default PaymentRecordsTable;
