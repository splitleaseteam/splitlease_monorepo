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

function getInitials(person) {
  const first = person?.firstName?.[0] || '';
  const last = person?.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase();
}

export default function ReservationHeader({
  lease,
  coTenant,
  roommate, // @deprecated Use coTenant
  onBack
}) {
  // Resolve prop with backward compatibility
  const resolvedCoTenant = coTenant ?? roommate;

  const address = lease?.propertyAddress || lease?.propertyName || 'Lease';
  const leaseDates = lease?.startDate && lease?.endDate
    ? `${formatLeaseDate(lease.startDate)} - ${formatLeaseDate(lease.endDate)}`
    : 'Lease dates unavailable';
  const coTenantName = resolvedCoTenant ? `${resolvedCoTenant.firstName} ${resolvedCoTenant.lastName}` : 'Co-tenant';
  const initials = getInitials(resolvedCoTenant);

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
      <div className="reservation-header__cotenant">
        <div className="reservation-header__avatar">
          {resolvedCoTenant?.avatarUrl ? (
            <img src={resolvedCoTenant.avatarUrl} alt={coTenantName} />
          ) : (
            <span className="reservation-header__initials">{initials}</span>
          )}
        </div>
        <span className="reservation-header__name">{coTenantName}</span>
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
  coTenant: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    avatarUrl: PropTypes.string
  }),
  roommate: PropTypes.shape({ // @deprecated Use coTenant
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    avatarUrl: PropTypes.string
  }),
  onBack: PropTypes.func
};
