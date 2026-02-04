/**
 * Lease Info Bar Component
 *
 * Header section displaying:
 * - Property name and address
 * - Roommate name
 * - Lease period dates
 */

import React from 'react';

export default function LeaseInfoBar({ lease, roommate }) {
  if (!lease) return null;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <header className="lease-info-bar">
      <div className="lease-info-bar__content">
        {/* Property Info */}
        <div className="lease-info-bar__property">
          <h1 className="lease-info-bar__title">{lease.propertyName}</h1>
          <p className="lease-info-bar__address">{lease.propertyAddress}</p>
        </div>

        {/* Roommate */}
        <div className="lease-info-bar__roommate">
          <span className="lease-info-bar__label">Sharing with</span>
          <span className="lease-info-bar__name">
            {roommate ? `${roommate.firstName} ${roommate.lastName}` : 'Loading...'}
          </span>
        </div>

        {/* Lease Period */}
        <div className="lease-info-bar__period">
          <span className="lease-info-bar__label">Lease Period</span>
          <span className="lease-info-bar__dates">
            {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
          </span>
        </div>
      </div>
    </header>
  );
}
