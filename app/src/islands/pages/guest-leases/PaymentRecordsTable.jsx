/**
 * PaymentRecordsTable Component
 *
 * Displays payment history for a lease with download receipt option.
 */

import { Download, CheckCircle, Clock } from 'lucide-react';
import './PaymentRecordsTable.css';

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Format date for display
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

export default function PaymentRecordsTable({ records = [], onDownloadReceipt }) {
  if (records.length === 0) {
    return (
      <div className="payment-records__empty">
        <p>No payment records available.</p>
      </div>
    );
  }

  return (
    <div className="payment-records">
      <table className="payment-records__table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const isPaid = record.isPaid || record.actualDate;
            const statusIcon = isPaid ? CheckCircle : Clock;
            const StatusIcon = statusIcon;

            return (
              <tr key={record._id || record.id}>
                <td className="payment-records__date">
                  {formatDate(record.scheduledDate)}
                  {record.actualDate && record.actualDate !== record.scheduledDate && (
                    <span className="payment-records__actual-date">
                      (Paid: {formatDate(record.actualDate)})
                    </span>
                  )}
                </td>
                <td className="payment-records__amount">
                  {formatCurrency(record.totalAmount || record.rent)}
                </td>
                <td>
                  <span className={`payment-records__status ${isPaid ? 'paid' : 'pending'}`}>
                    <StatusIcon size={14} />
                    {isPaid ? 'Paid' : 'Pending'}
                  </span>
                </td>
                <td className="payment-records__receipt">
                  {record.receiptUrl ? (
                    <button
                      className="btn btn-icon btn-sm"
                      onClick={() => onDownloadReceipt(record)}
                      aria-label="Download receipt"
                    >
                      <Download size={16} />
                    </button>
                  ) : (
                    <span className="payment-records__no-receipt">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile view - cards */}
      <div className="payment-records__cards">
        {records.map((record) => {
          const isPaid = record.isPaid || record.actualDate;

          return (
            <div key={record._id || record.id} className="payment-records__card">
              <div className="payment-records__card-header">
                <span className="payment-records__card-date">
                  {formatDate(record.scheduledDate)}
                </span>
                <span className={`payment-records__card-status ${isPaid ? 'paid' : 'pending'}`}>
                  {isPaid ? 'Paid' : 'Pending'}
                </span>
              </div>
              <div className="payment-records__card-amount">
                {formatCurrency(record.totalAmount || record.rent)}
              </div>
              {record.receiptUrl && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => onDownloadReceipt(record)}
                >
                  <Download size={14} />
                  Download Receipt
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
