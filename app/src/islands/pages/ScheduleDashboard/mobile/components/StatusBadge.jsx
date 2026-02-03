/**
 * StatusBadge Component
 *
 * Visual status indicator badge.
 */

import React from 'react';

/**
 * Status configuration with labels and icons
 */
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: '⏳'
  },
  accepted: {
    label: 'Accepted',
    icon: '✓'
  },
  declined: {
    label: 'Declined',
    icon: '✗'
  },
  cancelled: {
    label: 'Cancelled',
    icon: '⊘'
  },
  completed: {
    label: 'Completed',
    icon: '✓'
  },
  complete: {
    label: 'Complete',
    icon: '✓'
  },
  expired: {
    label: 'Expired',
    icon: '⏰'
  }
};

/**
 * Status badge component
 * @param {Object} props
 * @param {string} props.status - Status value
 * @param {boolean} [props.showIcon=true] - Whether to show icon
 * @param {string} [props.size='default'] - Badge size (small, default)
 */
export default function StatusBadge({
  status,
  showIcon = true,
  size = 'default'
}) {
  const normalizedStatus = status?.toLowerCase() || 'pending';
  const config = STATUS_CONFIG[normalizedStatus] || {
    label: status || 'Unknown',
    icon: '•'
  };

  const classNames = [
    'status-badge',
    `status-badge--${normalizedStatus}`,
    size === 'small' ? 'status-badge--small' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} role="status">
      {showIcon && (
        <span className="status-badge__icon" aria-hidden="true">
          {config.icon}
        </span>
      )}
      <span className="status-badge__label">{config.label}</span>
    </span>
  );
}
