/**
 * Z-Unit Payment Records JS Test Page
 *
 * Internal test page for payment records management and validation.
 * Compares JavaScript-calculated vs. legacy native payment schedules.
 * Follows the Hollow Component Pattern - ALL logic in useZUnitPaymentRecordsJsPageLogic hook.
 *
 * Route: /_internal/z-unit-payment-records-js
 * Auth: None (internal test page)
 */

import { useZUnitPaymentRecordsJsPageLogic } from './useZUnitPaymentRecordsJsPageLogic.js';
import './ZUnitPaymentRecordsJsPage.css';

// Loading component
function LoadingSpinner() {
  return (
    <div className="zupr-loading">
      <div className="zupr-spinner"></div>
      <span>Loading...</span>
    </div>
  );
}

// Error component
function ErrorMessage({ message }) {
  return (
    <div className="zupr-error">
      {message}
    </div>
  );
}

// Success component
function SuccessMessage({ message }) {
  return (
    <div className="zupr-success">
      {message}
    </div>
  );
}

// Lease selector component
function LeaseSelector({
  leases,
  leasesLoading,
  leasesError,
  selectedLeaseId,
  selectedLease,
  proposalData,
  handleLeaseSelect,
  handleReset,
  formatDisplayDate,
  formatCurrency
}) {
  return (
    <div className="zupr-panel">
      <h2 className="zupr-panel-header">Lease Selector</h2>

      <div className="zupr-form-group">
        <label className="zupr-label">Select Lease</label>
        {leasesLoading ? (
          <LoadingSpinner />
        ) : leasesError ? (
          <ErrorMessage message={leasesError} />
        ) : (
          <select
            className="zupr-select"
            value={selectedLeaseId}
            onChange={(e) => handleLeaseSelect(e.target.value)}
          >
            <option value="">-- Select a lease --</option>
            {leases.map(lease => (
              <option key={lease.id} value={lease.id}>
                {lease['Agreement Number'] || lease.id} - {lease['Lease Status'] || 'Unknown'}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedLease && (
        <div className="zupr-lease-info">
          <h3 className="zupr-panel-subheader">Lease Details</h3>
          <div className="zupr-info-grid">
            <div className="zupr-info-row">
              <span className="zupr-info-label">Agreement #:</span>
              <span className="zupr-info-value">{selectedLease['Agreement Number'] || '-'}</span>
            </div>
            <div className="zupr-info-row">
              <span className="zupr-info-label">Status:</span>
              <span className="zupr-info-value">{selectedLease['Lease Status'] || '-'}</span>
            </div>
            <div className="zupr-info-row">
              <span className="zupr-info-label">Start Date:</span>
              <span className="zupr-info-value">{formatDisplayDate(selectedLease['Reservation Period : Start'])}</span>
            </div>
            <div className="zupr-info-row">
              <span className="zupr-info-label">End Date:</span>
              <span className="zupr-info-value">{formatDisplayDate(selectedLease['Reservation Period : End'])}</span>
            </div>
            <div className="zupr-info-row">
              <span className="zupr-info-label">Total Rent:</span>
              <span className="zupr-info-value">{formatCurrency(selectedLease['Total Rent'])}</span>
            </div>
            <div className="zupr-info-row">
              <span className="zupr-info-label">Total Compensation:</span>
              <span className="zupr-info-value">{formatCurrency(selectedLease['Total Compensation'])}</span>
            </div>
          </div>

          {proposalData && (
            <>
              <h3 className="zupr-panel-subheader">Proposal Details</h3>
              <div className="zupr-info-grid">
                <div className="zupr-info-row">
                  <span className="zupr-info-label">Rental Type:</span>
                  <span className="zupr-info-value">{proposalData.rental_type || '-'}</span>
                </div>
                <div className="zupr-info-row">
                  <span className="zupr-info-label">Week Pattern:</span>
                  <span className="zupr-info-value">{proposalData['Week Pattern'] || '-'}</span>
                </div>
                <div className="zupr-info-row">
                  <span className="zupr-info-label">Span (Weeks):</span>
                  <span className="zupr-info-value">{proposalData['Reservation Span (Weeks)'] || '-'}</span>
                </div>
                <div className="zupr-info-row">
                  <span className="zupr-info-label">Span (Months):</span>
                  <span className="zupr-info-value">{proposalData['Reservation Span (Months)'] || '-'}</span>
                </div>
                <div className="zupr-info-row">
                  <span className="zupr-info-label">4-Week Rent:</span>
                  <span className="zupr-info-value">{formatCurrency(proposalData['4 week rent'])}</span>
                </div>
                <div className="zupr-info-row">
                  <span className="zupr-info-label">Rent/Month:</span>
                  <span className="zupr-info-value">{formatCurrency(proposalData['Rent per Month'])}</span>
                </div>
                <div className="zupr-info-row">
                  <span className="zupr-info-label">Maintenance Fee:</span>
                  <span className="zupr-info-value">{formatCurrency(proposalData['Maintenance Fee'])}</span>
                </div>
                <div className="zupr-info-row">
                  <span className="zupr-info-label">Damage Deposit:</span>
                  <span className="zupr-info-value">{formatCurrency(proposalData['Damage Deposit'])}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className="zupr-btn zupr-btn-secondary"
        onClick={handleReset}
        style={{ width: '100%', marginTop: '16px' }}
      >
        Reset All
      </button>
    </div>
  );
}

// Payment table component
function PaymentTable({
  _title,
  records,
  isGuest = true,
  formatDisplayDate,
  formatCurrency
}) {
  if (!records || records.length === 0) {
    return (
      <div className="zupr-table-empty">
        No {isGuest ? 'guest' : 'host'} payment records available
      </div>
    );
  }

  return (
    <div className="zupr-table-container">
      <table className="zupr-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Scheduled Date</th>
            <th>Actual Date</th>
            <th>Rent</th>
            <th>Maint. Fee</th>
            {isGuest && <th>Damage Dep.</th>}
            <th>Total</th>
            <th>Bank Txn #</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={index}>
              <td>{record.paymentNumber}</td>
              <td>{formatDisplayDate(record.scheduledDate)}</td>
              <td>{formatDisplayDate(record.actualDate)}</td>
              <td>{formatCurrency(record.rent)}</td>
              <td>{formatCurrency(record.maintenanceFee)}</td>
              {isGuest && <td>{formatCurrency(record.damageDeposit)}</td>}
              <td className="zupr-table-total">{formatCurrency(record.total)}</td>
              <td>{record.bankTransactionNumber || '-'}</td>
              <td>
                <span className={`zupr-status zupr-status-${(record.receiptStatus || record.payoutStatus || 'pending').toLowerCase()}`}>
                  {record.receiptStatus || record.payoutStatus || 'pending'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// View mode toggle
function ViewModeToggle({ viewMode, handleViewModeChange }) {
  return (
    <div className="zupr-view-toggle">
      <button
        type="button"
        className={`zupr-toggle-btn ${viewMode === 'jsCalculated' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('jsCalculated')}
      >
        JS Calculated
      </button>
      <button
        type="button"
        className={`zupr-toggle-btn ${viewMode === 'legacyNative' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('legacyNative')}
      >
        Legacy Native
      </button>
    </div>
  );
}

// Calendar component
function ReservationCalendar({
  calendarYear,
  calendarMonth,
  calendarDays,
  MONTH_NAMES,
  DAY_NAMES,
  handleCalendarMonthPrev,
  handleCalendarMonthNext,
  handleCalendarYearChange
}) {
  // Generate year options (5 years before and after current)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="zupr-calendar">
      <div className="zupr-calendar-nav">
        <button
          type="button"
          className="zupr-btn zupr-btn-icon"
          onClick={handleCalendarMonthPrev}
        >
          &lt;
        </button>
        <div className="zupr-calendar-title">
          <span>{MONTH_NAMES[calendarMonth]}</span>
          <select
            className="zupr-select-small"
            value={calendarYear}
            onChange={(e) => handleCalendarYearChange(e.target.value)}
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="zupr-btn zupr-btn-icon"
          onClick={handleCalendarMonthNext}
        >
          &gt;
        </button>
      </div>
      <div className="zupr-calendar-header">
        {DAY_NAMES.map(day => (
          <div key={day} className="zupr-calendar-day-name">{day}</div>
        ))}
      </div>
      <div className="zupr-calendar-grid">
        {calendarDays.map((dayInfo, index) => (
          <div
            key={index}
            className={`zupr-calendar-day ${dayInfo.day ? '' : 'empty'} ${dayInfo.isBooked ? 'booked' : ''}`}
          >
            {dayInfo.day || ''}
          </div>
        ))}
      </div>
      <div className="zupr-calendar-legend">
        <div className="zupr-legend-item">
          <span className="zupr-legend-box booked"></span>
          <span>Reservation Period</span>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function ZUnitPaymentRecordsJsPage() {
  const {
    // Constants
    MONTH_NAMES,
    DAY_NAMES,

    // Lease selector
    leases,
    leasesLoading,
    leasesError,
    selectedLeaseId,
    selectedLease,
    selectedLeaseLoading,
    proposalData,

    // Payment schedules
    activeGuestSchedule,
    activeHostSchedule,
    paymentSchedulesLoading,

    // Calendar state
    calendarYear,
    calendarMonth,
    calendarDays,

    // Regeneration state
    regeneratingGuest,
    regeneratingHost,
    regenerationError,
    regenerationSuccess,

    // View mode
    viewMode,

    // Handlers
    handleLeaseSelect,
    handleRegenerateGuestPayments,
    handleRegenerateHostPayments,
    handleCalendarMonthNext,
    handleCalendarMonthPrev,
    handleCalendarYearChange,
    handleViewModeChange,
    handleReset,

    // Utility functions
    formatDisplayDate,
    formatCurrency,
  } = useZUnitPaymentRecordsJsPageLogic();

  return (
    <div className="zupr-page">
      {/* Header */}
      <header className="zupr-header">
        <h1>Z-Unit Payment Records JS Test</h1>
        <p>Payment schedule management and JavaScript vs. legacy comparison</p>
      </header>

      <div className="zupr-container">
        {/* Column 1: Lease Selector */}
        <div className="zupr-column zupr-column-selector">
          <LeaseSelector
            leases={leases}
            leasesLoading={leasesLoading}
            leasesError={leasesError}
            selectedLeaseId={selectedLeaseId}
            selectedLease={selectedLease}
            proposalData={proposalData}
            handleLeaseSelect={handleLeaseSelect}
            handleReset={handleReset}
            formatDisplayDate={formatDisplayDate}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Column 2: Payment Schedules */}
        <div className="zupr-column zupr-column-payments">
          {/* View Mode Toggle */}
          <div className="zupr-panel zupr-panel-compact">
            <div className="zupr-panel-header-row">
              <h2 className="zupr-panel-header-inline">Payment Schedules</h2>
              <ViewModeToggle
                viewMode={viewMode}
                handleViewModeChange={handleViewModeChange}
              />
            </div>
          </div>

          {/* Guest Payment Records */}
          <div className="zupr-panel">
            <div className="zupr-panel-header-row">
              <h2 className="zupr-panel-header-inline">Guest Payment Schedule</h2>
              <button
                type="button"
                className="zupr-btn zupr-btn-primary zupr-btn-small"
                onClick={handleRegenerateGuestPayments}
                disabled={!selectedLease || regeneratingGuest}
              >
                {regeneratingGuest ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>

            {selectedLeaseLoading || paymentSchedulesLoading ? (
              <LoadingSpinner />
            ) : (
              <PaymentTable
                title="Guest Payments"
                records={activeGuestSchedule}
                isGuest={true}
                formatDisplayDate={formatDisplayDate}
                formatCurrency={formatCurrency}
              />
            )}
          </div>

          {/* Host Payment Records */}
          <div className="zupr-panel">
            <div className="zupr-panel-header-row">
              <h2 className="zupr-panel-header-inline">Host Payout Schedule</h2>
              <button
                type="button"
                className="zupr-btn zupr-btn-primary zupr-btn-small"
                onClick={handleRegenerateHostPayments}
                disabled={!selectedLease || regeneratingHost}
              >
                {regeneratingHost ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>

            {selectedLeaseLoading || paymentSchedulesLoading ? (
              <LoadingSpinner />
            ) : (
              <PaymentTable
                title="Host Payouts"
                records={activeHostSchedule}
                isGuest={false}
                formatDisplayDate={formatDisplayDate}
                formatCurrency={formatCurrency}
              />
            )}
          </div>

          {/* Status Messages */}
          {regenerationError && (
            <ErrorMessage message={regenerationError} />
          )}
          {regenerationSuccess && (
            <SuccessMessage message={regenerationSuccess} />
          )}
        </div>

        {/* Column 3: Calendar & Actions */}
        <div className="zupr-column zupr-column-calendar">
          <div className="zupr-panel">
            <h2 className="zupr-panel-header">Reservation Calendar</h2>
            <ReservationCalendar
              calendarYear={calendarYear}
              calendarMonth={calendarMonth}
              calendarDays={calendarDays}
              MONTH_NAMES={MONTH_NAMES}
              DAY_NAMES={DAY_NAMES}
              handleCalendarMonthPrev={handleCalendarMonthPrev}
              handleCalendarMonthNext={handleCalendarMonthNext}
              handleCalendarYearChange={handleCalendarYearChange}
            />
          </div>

          {/* Comparison Summary */}
          {selectedLease && (
            <div className="zupr-panel">
              <h2 className="zupr-panel-header">Comparison Summary</h2>
              <div className="zupr-comparison-summary">
                <div className="zupr-comparison-row">
                  <span className="zupr-comparison-label">JS Guest Payments:</span>
                  <span className="zupr-comparison-value">
                    {activeGuestSchedule?.length || 0} records
                  </span>
                </div>
                <div className="zupr-comparison-row">
                  <span className="zupr-comparison-label">JS Host Payouts:</span>
                  <span className="zupr-comparison-value">
                    {activeHostSchedule?.length || 0} records
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
