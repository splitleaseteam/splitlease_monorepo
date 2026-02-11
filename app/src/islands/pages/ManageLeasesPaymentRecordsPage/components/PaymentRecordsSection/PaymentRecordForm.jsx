/**
 * PaymentRecordForm - Form for creating/editing payment records
 */
import { useState } from 'react';

export default function PaymentRecordForm({
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false,
  isGuestPayment = true
}) {
  const [formData, setFormData] = useState({
    scheduledDate: initialData.scheduledDate
      ? new Date(initialData.scheduledDate).toISOString().split('T')[0]
      : '',
    actualDate: initialData.actualDate
      ? new Date(initialData.actualDate).toISOString().split('T')[0]
      : '',
    rent: initialData.rent || '',
    maintenanceFee: initialData.maintenanceFee || '',
    damageDeposit: initialData.damageDeposit || '',
    totalAmount: initialData.totalAmount || '',
    bankTransactionNumber: initialData.bankTransactionNumber || '',
    paymentDelayed: initialData.paymentDelayed || false,
    isPaid: initialData.isPaid || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mlpr-form-grid">
        <div className="mlpr-form-field">
          <label className="mlpr-label">Scheduled Date</label>
          <input
            type="date"
            className="mlpr-input"
            value={formData.scheduledDate}
            onChange={(e) => handleChange('scheduledDate', e.target.value)}
            required
          />
        </div>

        <div className="mlpr-form-field">
          <label className="mlpr-label">Actual Date of Payment</label>
          <input
            type="date"
            className="mlpr-input"
            value={formData.actualDate}
            onChange={(e) => handleChange('actualDate', e.target.value)}
          />
        </div>

        <div className="mlpr-form-field">
          <label className="mlpr-label">Rent</label>
          <input
            type="number"
            step="0.01"
            className="mlpr-input"
            value={formData.rent}
            onChange={(e) => handleChange('rent', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="mlpr-form-field">
          <label className="mlpr-label">Maintenance Fee</label>
          <input
            type="number"
            step="0.01"
            className="mlpr-input"
            value={formData.maintenanceFee}
            onChange={(e) => handleChange('maintenanceFee', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="mlpr-form-field">
          <label className="mlpr-label">Damage Deposit</label>
          <input
            type="number"
            step="0.01"
            className="mlpr-input"
            value={formData.damageDeposit}
            onChange={(e) => handleChange('damageDeposit', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="mlpr-form-field">
          <label className="mlpr-label">
            {isGuestPayment ? 'Total Paid by Guest' : 'Total Paid to Host'}
          </label>
          <input
            type="number"
            step="0.01"
            className="mlpr-input"
            value={formData.totalAmount}
            onChange={(e) => handleChange('totalAmount', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="mlpr-form-field">
          <label className="mlpr-label">Bank Transaction Number</label>
          <input
            type="text"
            className="mlpr-input"
            value={formData.bankTransactionNumber}
            onChange={(e) => handleChange('bankTransactionNumber', e.target.value)}
            placeholder="Transaction #"
          />
        </div>

        <div className="mlpr-form-field">
          <label className="mlpr-label">Status</label>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => handleChange('isPaid', e.target.checked)}
              />
              Paid
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={formData.paymentDelayed}
                onChange={(e) => handleChange('paymentDelayed', e.target.checked)}
              />
              Payment Delayed
            </label>
          </div>
        </div>
      </div>

      <div className="mlpr-form-actions">
        <button
          type="submit"
          className="mlpr-btn mlpr-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Payment Record'
              : 'Create Payment Record'}
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
