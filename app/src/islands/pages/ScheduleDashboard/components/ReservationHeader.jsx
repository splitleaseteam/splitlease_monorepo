import React from 'react';
import PropTypes from 'prop-types';

function formatLeaseDate(dateInput) {
  if (!dateInput) return '';
  // Handle both Date objects and strings
  const date = dateInput instanceof Date
    ? dateInput
    : new Date(typeof dateInput === 'string' && dateInput.includes('T') ? dateInput : `${dateInput}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getInitials(roommate) {
  const first = roommate?.firstName?.[0] || '';
  const last = roommate?.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase();
}

export default function ReservationHeader({ lease, roommate, onBack }) {
  const address = lease?.propertyAddress || lease?.propertyName || 'Lease';
  const leaseDates = lease?.startDate && lease?.endDate
    ? `${formatLeaseDate(lease.startDate)} - ${formatLeaseDate(lease.endDate)}`
    : 'Lease dates unavailable';
  const roommateName = roommate ? `${roommate.firstName} ${roommate.lastName}` : 'Co-tenant';
  const initials = getInitials(roommate);

  return (
    <header className="reservation-header" role="banner">
      <button type="button" className="reservation-header__back" onClick={onBack} aria-label="Back to dashboard">
        <span aria-hidden="true">&larr;</span>
        Back
      </button>
      <span className="reservation-header__divider" aria-hidden="true" />
      <div className="reservation-header__address">
        {address}
      </div>
      <span className="reservation-header__divider" aria-hidden="true" />
      <div className="reservation-header__roommate">
        <div className="reservation-header__avatar">
          {roommate?.avatarUrl ? (
            <img src={roommate.avatarUrl} alt={roommateName} />
          ) : (
            <span className="reservation-header__initials">{initials}</span>
          )}
        </div>
        <span className="reservation-header__name">{roommateName}</span>
      </div>
      <span className="reservation-header__divider" aria-hidden="true" />
      <div className="reservation-header__dates">
        {leaseDates}
      </div>
    </header>
  );
}

ReservationHeader.propTypes = {
  lease: PropTypes.shape({
    propertyName: PropTypes.string,
    propertyAddress: PropTypes.string,
    startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  roommate: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    avatarUrl: PropTypes.string
  }),
  onBack: PropTypes.func
};
