/**
 * CalendarSection - Calendar display and booked dates management
 *
 * Features:
 * - Month calendar with 6x7 grid
 * - Toggle views: Lease Nights, Blocked Manually, Move-Out
 * - Booked dates display (original, after request, proposal)
 * - Date management buttons
 */
import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import MonthCalendar from './MonthCalendar.jsx';
import CalendarControls from './CalendarControls.jsx';
import BookedDatesDisplay from './BookedDatesDisplay.jsx';

export default function CalendarSection({ lease, onUpdateBookedDates, onClearDates, isLoading }) {
  const [currentMonth, setCurrentMonth] = useState(
    lease.startDate ? new Date(lease.startDate) : new Date()
  );
  const [viewMode, setViewMode] = useState('lease'); // 'lease' | 'blocked' | 'moveout'

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleGoToLeaseStart = () => {
    if (lease.startDate) {
      setCurrentMonth(new Date(lease.startDate));
    }
  };

  return (
    <section className="mlpr-section mlpr-calendar-section">
      <h2 className="mlpr-section-title">
        <CalendarIcon size={20} />
        Calendar & Date Management
      </h2>

      {/* View Mode Toggles */}
      <div className="mlpr-calendar-toggles">
        <button
          type="button"
          className={`mlpr-toggle-btn ${viewMode === 'lease' ? 'active' : ''}`}
          onClick={() => setViewMode('lease')}
        >
          Lease Nights/Occupied
        </button>
        <button
          type="button"
          className={`mlpr-toggle-btn ${viewMode === 'blocked' ? 'active' : ''}`}
          onClick={() => setViewMode('blocked')}
        >
          Blocked Manually
        </button>
        <button
          type="button"
          className={`mlpr-toggle-btn ${viewMode === 'moveout' ? 'active' : ''}`}
          onClick={() => setViewMode('moveout')}
        >
          Move-Out
        </button>
      </div>

      {/* Month Navigation */}
      <CalendarControls
        currentMonth={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onGoToLeaseStart={handleGoToLeaseStart}
        hasLeaseStart={!!lease.startDate}
      />

      {/* Calendar Grid */}
      <MonthCalendar
        month={currentMonth}
        bookedDates={lease.bookedDates || []}
        bookedDatesAfterRequest={lease.bookedDatesAfterRequest || []}
        viewMode={viewMode}
        leaseStartDate={lease.startDate}
        leaseEndDate={lease.endDate}
      />

      {/* Booked Dates Lists */}
      <BookedDatesDisplay
        original={lease.bookedDates}
        afterRequest={lease.bookedDatesAfterRequest}
        proposalDates={lease.proposal?.bookedDates}
      />

      {/* Date Management Buttons */}
      <div className="mlpr-date-actions">
        <button
          type="button"
          className="mlpr-btn mlpr-btn-primary"
          onClick={onUpdateBookedDates}
          disabled={isLoading}
        >
          Create List of Booked Dates
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-danger"
          onClick={onClearDates}
          disabled={isLoading}
        >
          CLEAR dates in leases and proposals
        </button>
      </div>

      {/* Legend */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', background: '#7c3aed', borderRadius: '2px' }} />
          <span>Booked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', background: '#fbbf24', borderRadius: '2px' }} />
          <span>After Request</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', background: 'rgba(124, 58, 237, 0.1)', border: '1px solid #7c3aed', borderRadius: '2px' }} />
          <span>In Lease Range</span>
        </div>
      </div>
    </section>
  );
}
