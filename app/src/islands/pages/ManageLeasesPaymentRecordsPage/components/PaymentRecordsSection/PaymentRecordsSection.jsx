/**
 * PaymentRecordsSection - Complete payment record management
 *
 * Features:
 * - Create new payment records
 * - Guest payment schedule table
 * - Host payout schedule table
 * - Edit/delete payment records
 * - Regenerate payment records
 * - Debug info display
 */
import { useState } from 'react';
import { DollarSign, Plus, RefreshCw, Trash2, Edit, Calendar } from 'lucide-react';
import PaymentRecordForm from './PaymentRecordForm.jsx';
import PaymentTable from './PaymentTable.jsx';

export default function PaymentRecordsSection({
  lease,
  guestPayments = [],
  hostPayments = [],
  onCreatePayment,
  onEditPayment,
  onDeletePayment,
  onRegenerateGuest,
  onRegenerateHost,
  onRegenerateAll,
  isLoading
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentType, setPaymentType] = useState('guest'); // 'guest' | 'host'

  const handleCreate = async (data) => {
    await onCreatePayment({ ...data, isGuestPayment: paymentType === 'guest' });
    setShowCreateForm(false);
  };

  const handleEdit = async (paymentId, data) => {
    await onEditPayment(paymentId, data);
    setEditingPayment(null);
  };

  return (
    <section className="mlpr-section mlpr-payments-section">
      <h2 className="mlpr-section-title">
        <DollarSign size={20} />
        Payment Record Management
      </h2>

      {/* Payment Type Toggle */}
      <div className="mlpr-calendar-toggles" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className={`mlpr-toggle-btn ${paymentType === 'guest' ? 'active' : ''}`}
          onClick={() => setPaymentType('guest')}
        >
          Guest Payments ({guestPayments.length})
        </button>
        <button
          type="button"
          className={`mlpr-toggle-btn ${paymentType === 'host' ? 'active' : ''}`}
          onClick={() => setPaymentType('host')}
        >
          Host Payouts ({hostPayments.length})
        </button>
      </div>

      {/* Create Payment Button */}
      {!showCreateForm && (
        <button
          type="button"
          className="mlpr-btn mlpr-btn-primary"
          onClick={() => setShowCreateForm(true)}
          style={{ marginBottom: '1rem' }}
        >
          <Plus size={16} />
          Create Payment Record
        </button>
      )}

      {/* Create Payment Form */}
      {showCreateForm && (
        <div className="mlpr-card" style={{ marginBottom: '1rem' }}>
          <div className="mlpr-card-header">
            <Plus size={18} />
            <h4>Create {paymentType === 'guest' ? 'Guest Payment' : 'Host Payout'}</h4>
          </div>
          <PaymentRecordForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            isGuestPayment={paymentType === 'guest'}
          />
        </div>
      )}

      {/* Payment Table */}
      <PaymentTable
        payments={paymentType === 'guest' ? guestPayments : hostPayments}
        type={paymentType}
        onEdit={setEditingPayment}
        onDelete={onDeletePayment}
        isLoading={isLoading}
      />

      {/* Edit Modal */}
      {editingPayment && (
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
          <div
            style={{
              background: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={20} />
              Edit Payment Record
            </h3>
            <PaymentRecordForm
              initialData={editingPayment}
              onSubmit={(data) => handleEdit(editingPayment.id, data)}
              onCancel={() => setEditingPayment(null)}
              isEditing
            />
          </div>
        </div>
      )}

      {/* Regeneration Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '0.375rem'
      }}>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-secondary"
          onClick={onRegenerateAll}
          disabled={isLoading}
        >
          <RefreshCw size={16} />
          Recreate ALL Payment Records
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-secondary"
          onClick={onRegenerateGuest}
          disabled={isLoading}
        >
          <RefreshCw size={16} />
          Recreate Guest Payments
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-secondary"
          onClick={onRegenerateHost}
          disabled={isLoading}
        >
          <RefreshCw size={16} />
          Recreate Host Payouts
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-outline"
          disabled={isLoading}
        >
          <Calendar size={16} />
          Schedule Check-out Reminders
        </button>
      </div>

      {/* Debug Info */}
      <details style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer', fontSize: '0.875rem', color: '#6b7280' }}>
          Debug Info
        </summary>
        <div style={{
          marginTop: '0.5rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          fontFamily: 'monospace'
        }}>
          <p>Lease ID: {lease.id}</p>
          <p>Total Rent: ${lease.totalRent}</p>
          <p>Total Compensation: ${lease.totalCompensation}</p>
          <p>Paid to Date: ${lease.paidToDate}</p>
          <p>Guest Payment Records: {guestPayments.length}</p>
          <p>Host Payment Records: {hostPayments.length}</p>
        </div>
      </details>
    </section>
  );
}
