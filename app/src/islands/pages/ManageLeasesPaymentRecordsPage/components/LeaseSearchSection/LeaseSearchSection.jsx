/**
 * LeaseSearchSection - Search and select leases
 *
 * Features:
 * - Search by phone, email, IDs, names, agreement number
 * - Dropdown for lease selection
 * - Shows selected booking header
 */
import { Search, X } from 'lucide-react';
import LeaseDropdown from './LeaseDropdown.jsx';

export default function LeaseSearchSection({
  searchQuery,
  onSearchChange,
  leases,
  selectedLease,
  onLeaseSelect,
  isLoading
}) {
  return (
    <section className="mlpr-section mlpr-search-section">
      <h2 className="mlpr-section-title">
        <Search size={20} />
        Lease Selection
      </h2>
      <p className="mlpr-section-subtitle">
        Search and select a lease to manage its details, payments, and documents
      </p>

      {/* Selected Booking Header */}
      {selectedLease && (
        <div className="mlpr-selected-header">
          <span>Selected Booking:</span>
          <strong>{selectedLease.agreementNumber || selectedLease.id}</strong>
          {selectedLease.guest?.fullName && (
            <span className="mlpr-guest-name">({selectedLease.guest.fullName})</span>
          )}
          <button
            type="button"
            className="mlpr-btn mlpr-btn-sm mlpr-btn-outline"
            onClick={() => onLeaseSelect(null)}
            style={{ marginLeft: 'auto' }}
          >
            <X size={14} />
            Clear
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mlpr-search-bar">
        <Search size={18} className="mlpr-search-icon" />
        <input
          type="text"
          placeholder="Search by phone, email, lease ID, proposal ID, agreement number, names..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mlpr-search-input"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="mlpr-search-clear"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Lease Dropdown */}
      <LeaseDropdown
        leases={leases}
        selectedLease={selectedLease}
        onSelect={onLeaseSelect}
        isLoading={isLoading}
      />

      {/* Result count */}
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
        {leases.length} lease{leases.length !== 1 ? 's' : ''} found
        {searchQuery && ` matching "${searchQuery}"`}
      </p>
    </section>
  );
}
