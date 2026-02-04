/**
 * PaymentTable - Display payment records in a table
 */
import { Edit, Trash2, CheckCircle, Clock, ExternalLink } from 'lucide-react';

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
 * Format currency for display
 */
function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export default function PaymentTable({ payments = [], type, onEdit, onDelete, isLoading }) {
  if (payments.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: '#f9fafb',
        borderRadius: '0.375rem',
        color: '#6b7280'
      }}>
        <p style={{ margin: 0 }}>No {type === 'guest' ? 'guest payment' : 'host payout'} records found</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="mlpr-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Scheduled</th>
            <th>Actual</th>
            <th>Rent</th>
            <th>Maint. Fee</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment, index) => (
            <tr key={payment.id || index}>
              <td>{payment.paymentNumber || index + 1}</td>
              <td>{formatDate(payment.scheduledDate)}</td>
              <td>{formatDate(payment.actualDate)}</td>
              <td>{formatCurrency(payment.rent)}</td>
              <td>{formatCurrency(payment.maintenanceFee)}</td>
              <td style={{ fontWeight: 500 }}>
                {formatCurrency(payment.totalAmount)}
              </td>
              <td>
                {payment.isPaid ? (
                  <span className="mlpr-status mlpr-status-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle size={12} />
                    Paid
                  </span>
                ) : payment.paymentDelayed ? (
                  <span className="mlpr-status mlpr-status-cancelled">
                    Delayed
                  </span>
                ) : (
                  <span className="mlpr-status mlpr-status-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    Pending
                  </span>
                )}
              </td>
              <td>
                <div className="mlpr-table-actions">
                  <button
                    type="button"
                    className="mlpr-btn mlpr-btn-sm mlpr-btn-icon mlpr-btn-outline"
                    onClick={() => onEdit(payment)}
                    disabled={isLoading}
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    type="button"
                    className="mlpr-btn mlpr-btn-sm mlpr-btn-icon mlpr-btn-outline"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this payment record?')) {
                        onDelete(payment.id);
                      }
                    }}
                    disabled={isLoading}
                    title="Delete"
                    style={{ color: '#dc2626' }}
                  >
                    <Trash2 size={14} />
                  </button>
                  {payment.receiptUrl && (
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mlpr-btn mlpr-btn-sm mlpr-btn-icon mlpr-btn-outline"
                      title="View Receipt"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 600, background: '#f9fafb' }}>
            <td colSpan={3}>Total</td>
            <td>{formatCurrency(payments.reduce((sum, p) => sum + (p.rent || 0), 0))}</td>
            <td>{formatCurrency(payments.reduce((sum, p) => sum + (p.maintenanceFee || 0), 0))}</td>
            <td>{formatCurrency(payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0))}</td>
            <td colSpan={2}>
              {payments.filter(p => p.isPaid).length}/{payments.length} paid
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
