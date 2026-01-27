/**
 * LeaseDropdown - Dropdown for selecting a lease
 *
 * Shows: Guest name, Agreement #, Date range, Status
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Format a date for display
 */
function formatShortDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

export default function LeaseDropdown({ leases, selectedLease, onSelect, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatLeaseOption = (lease) => {
    const guestName = lease.guest?.fullName ||
                      `${lease.guest?.firstName || ''} ${lease.guest?.lastName || ''}`.trim() ||
                      'Unknown Guest';
    const agreement = lease.agreementNumber || lease.id?.slice(0, 8);
    const dates = lease.startDate && lease.endDate
      ? `${formatShortDate(lease.startDate)} - ${formatShortDate(lease.endDate)}`
      : 'No dates';
    return { guestName, agreement, dates, status: lease.status };
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      active: 'mlpr-status-active',
      completed: 'mlpr-status-completed',
      cancelled: 'mlpr-status-cancelled',
      pending: 'mlpr-status-pending',
      draft: 'mlpr-status-draft',
    };
    return statusClasses[status] || 'mlpr-status-unknown';
  };

  return (
    <div className="mlpr-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="mlpr-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        disabled={isLoading}
      >
        {selectedLease ? (
          <span className="mlpr-dropdown-selected">
            {formatLeaseOption(selectedLease).guestName} - #{formatLeaseOption(selectedLease).agreement}
          </span>
        ) : (
          <span className="mlpr-dropdown-placeholder">
            {isLoading ? 'Loading leases...' : 'Choose Lease'}
          </span>
        )}
        <ChevronDown size={16} className={isOpen ? 'rotated' : ''} />
      </button>

      {isOpen && (
        <ul className="mlpr-dropdown-menu" role="listbox">
          {leases.length === 0 ? (
            <li className="mlpr-dropdown-empty">No leases found</li>
          ) : (
            leases.map((lease) => {
              const { guestName, agreement, dates, status } = formatLeaseOption(lease);
              const isSelected = selectedLease?.id === lease.id;

              return (
                <li
                  key={lease.id}
                  className={`mlpr-dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(lease);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="mlpr-dropdown-item-main">
                    <span className="mlpr-dropdown-guest">{guestName}</span>
                    <span className="mlpr-dropdown-agreement">#{agreement}</span>
                  </div>
                  <div className="mlpr-dropdown-item-sub">
                    <span className="mlpr-dropdown-dates">{dates}</span>
                    <span className={`mlpr-status ${getStatusClass(status)}`}>
                      {status || 'unknown'}
                    </span>
                  </div>
                  {isSelected && <Check size={16} className="mlpr-dropdown-check" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
