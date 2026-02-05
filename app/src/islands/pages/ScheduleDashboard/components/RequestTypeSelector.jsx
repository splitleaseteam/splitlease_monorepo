/**
 * Request Type Selector Component
 *
 * Shows different request types based on lease type:
 * - Co-tenant leases: Buy Out, Swap, Co-Occupy
 * - Guest-host leases (guest): Change Dates, Cancel Booking
 * - Guest-host leases (host): Offer Dates, Block Dates
 */

import React from 'react';
import PropTypes from 'prop-types';

// ============================================================================
// ICON COMPONENTS (Simple SVG icons)
// ============================================================================

function DollarSignIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ArrowRightLeftIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3L4 7l4 4" />
      <path d="M4 7h16" />
      <path d="M16 21l4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}

function UsersIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function XIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function GiftIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function LockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ============================================================================
// ICON MAP
// ============================================================================

const ICONS = {
  DollarSign: DollarSignIcon,
  ArrowRightLeft: ArrowRightLeftIcon,
  Users: UsersIcon,
  Calendar: CalendarIcon,
  X: XIcon,
  Gift: GiftIcon,
  Lock: LockIcon,
};

// ============================================================================
// REQUEST TYPE CONFIGURATIONS
// ============================================================================

const CO_TENANT_REQUEST_TYPES = [
  {
    id: 'buyout',
    label: 'Buy Out Night',
    icon: 'DollarSign',
    description: 'Purchase a night from your co-tenant',
  },
  {
    id: 'swap',
    label: 'Swap Nights',
    icon: 'ArrowRightLeft',
    description: 'Exchange nights with your co-tenant',
  },
  {
    id: 'share',
    label: 'Co-Occupy',
    icon: 'Users',
    description: 'Share the space for a night',
  },
];

const GUEST_REQUEST_TYPES = [
  {
    id: 'date_change',
    label: 'Change Dates',
    icon: 'Calendar',
    description: 'Request to modify your booking dates',
  },
  {
    id: 'cancellation',
    label: 'Cancel Booking',
    icon: 'X',
    description: 'Request to cancel your reservation',
  },
];

const HOST_REQUEST_TYPES = [
  {
    id: 'offer_dates',
    label: 'Offer Dates',
    icon: 'Gift',
    description: 'Offer additional dates to your guest',
  },
  {
    id: 'block_dates',
    label: 'Block Dates',
    icon: 'Lock',
    description: 'Mark dates as unavailable',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RequestTypeSelector({
  lease,
  userRole,
  onSelect,
  selectedType,
  disabled = false,
}) {
  // Determine which request types to show based on lease type and user role
  const getRequestTypes = () => {
    if (!lease || lease.isCoTenant) {
      return CO_TENANT_REQUEST_TYPES;
    }
    if (userRole === 'guest') {
      return GUEST_REQUEST_TYPES;
    }
    return HOST_REQUEST_TYPES;
  };

  const requestTypes = getRequestTypes();

  return (
    <div className="request-type-selector">
      <h4 className="request-type-selector__heading">What would you like to do?</h4>
      <div className="request-type-selector__grid">
        {requestTypes.map((type) => {
          const IconComponent = ICONS[type.icon];
          const isSelected = selectedType === type.id;

          return (
            <button
              key={type.id}
              className={`request-type-selector__button ${isSelected ? 'request-type-selector__button--selected' : ''}`}
              onClick={() => onSelect(type.id)}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              <span className="request-type-selector__icon">
                <IconComponent size={20} />
              </span>
              <span className="request-type-selector__label">{type.label}</span>
              <span className="request-type-selector__description">{type.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

RequestTypeSelector.propTypes = {
  lease: PropTypes.shape({
    isCoTenant: PropTypes.bool,
  }),
  userRole: PropTypes.oneOf(['guest', 'host']),
  onSelect: PropTypes.func.isRequired,
  selectedType: PropTypes.string,
  disabled: PropTypes.bool,
};
