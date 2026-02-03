/**
 * StatusSummary Component (Charles Eames Style)
 *
 * Displays quick status badges showing:
 * - Payments current / overdue
 * - Documents signed / pending
 */

import { Check, AlertTriangle } from 'lucide-react';

export default function StatusSummary({
  paymentsStatus = 'current', // 'current' | 'overdue' | 'pending'
  documentsStatus = 'signed'  // 'signed' | 'pending'
}) {
  const statusItems = [];

  // Payments status
  if (paymentsStatus === 'current') {
    statusItems.push({
      key: 'payments',
      label: 'Payments current',
      variant: 'success',
      icon: Check
    });
  } else if (paymentsStatus === 'overdue') {
    statusItems.push({
      key: 'payments',
      label: 'Payment overdue',
      variant: 'warning',
      icon: AlertTriangle
    });
  } else if (paymentsStatus === 'pending') {
    statusItems.push({
      key: 'payments',
      label: 'Payment due soon',
      variant: 'default',
      icon: null
    });
  }

  // Documents status
  if (documentsStatus === 'signed') {
    statusItems.push({
      key: 'documents',
      label: 'Documents signed',
      variant: 'success',
      icon: Check
    });
  } else if (documentsStatus === 'pending') {
    statusItems.push({
      key: 'documents',
      label: 'Documents pending',
      variant: 'warning',
      icon: AlertTriangle
    });
  }

  if (statusItems.length === 0) return null;

  return (
    <div className="status-summary" aria-label="Status summary">
      {statusItems.map(({ key, label, variant, icon: Icon }) => (
        <div
          key={key}
          className={`status-summary__item ${variant === 'success' ? 'status-summary__item--success' : ''} ${variant === 'warning' ? 'status-summary__item--warning' : ''}`}
        >
          {Icon && (
            <Icon
              className="status-summary__icon"
              size={16}
              aria-hidden="true"
            />
          )}
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
