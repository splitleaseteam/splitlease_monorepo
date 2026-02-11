/**
 * Lease Calendar Section Component
 *
 * Displays a calendar view of scheduled lease dates for activated proposals.
 * Shows after a proposal becomes an active lease.
 *
 * Features:
 * - Month-view calendar with booked nights highlighted
 * - Info banner explaining schedule flexibility
 * - Summary statistics (total nights, remaining, next stay)
 * - Link to full lease management page
 */

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';
import {
  isLeaseActivatedStatus,
  fetchLeaseDataForProposal,
  extractBookedDatesFromLease,
  calculateLeaseStats
} from './leaseDataHelpers.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format a date for display (e.g., "Jan 31")
 */
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (_e) {
    return '';
  }
}

/**
 * Generate calendar days for a 6-week grid
 */
function generateCalendarDays(month) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  // First day of month
  const firstDay = new Date(year, monthIndex, 1);
  const startingDayOfWeek = firstDay.getDay();

  // Calculate start date (may be in previous month)
  const startDate = new Date(year, monthIndex, 1 - startingDayOfWeek);

  // Generate 42 days (6 weeks)
  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }

  return days;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Calendar Controls - Month navigation
 */
function CalendarControls({ currentMonth, onPrevMonth, onNextMonth, onToday }) {
  const monthName = MONTH_NAMES[currentMonth.getMonth()];
  const year = currentMonth.getFullYear();

  return (
    <div className="lcs-calendar-controls">
      <div className="lcs-calendar-nav">
        <button
          type="button"
          className="lcs-btn-icon"
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className="lcs-btn-icon"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <span className="lcs-calendar-month">
        {monthName} {year}
      </span>

      <button
        type="button"
        className="lcs-btn-text"
        onClick={onToday}
      >
        Today
      </button>
    </div>
  );
}

/**
 * Calendar Day Cell
 */
function CalendarDay({ date, isOtherMonth, isToday, isBooked, isPast }) {
  const classNames = ['lcs-calendar-day'];

  if (isOtherMonth) classNames.push('lcs-day--other-month');
  if (isToday) classNames.push('lcs-day--today');
  if (isBooked) classNames.push('lcs-day--booked');
  if (isPast && !isBooked) classNames.push('lcs-day--past');

  return (
    <div className={classNames.join(' ')}>
      {date.getDate()}
    </div>
  );
}

/**
 * Month Calendar Grid
 */
function MonthCalendar({ month, bookedDates = [] }) {
  const calendarDays = useMemo(() => generateCalendarDays(month), [month]);

  // Convert booked dates to Set for O(1) lookup
  const bookedSet = useMemo(() => {
    const set = new Set();
    bookedDates.forEach(d => {
      const dateStr = typeof d === 'string' ? d.split('T')[0] : '';
      if (dateStr) set.add(dateStr);
    });
    return set;
  }, [bookedDates]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isBooked = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookedSet.has(dateStr);
  };

  const isToday = (date) => date.toDateString() === today.toDateString();
  const isOtherMonth = (date) => date.getMonth() !== month.getMonth();
  const isPast = (date) => date < today;

  return (
    <div className="lcs-calendar">
      {/* Weekday Headers */}
      <div className="lcs-calendar-header">
        {WEEKDAYS.map(day => (
          <div key={day} className="lcs-calendar-weekday">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="lcs-calendar-grid">
        {calendarDays.map((date, index) => (
          <CalendarDay
            key={index}
            date={date}
            isOtherMonth={isOtherMonth(date)}
            isToday={isToday(date)}
            isBooked={isBooked(date)}
            isPast={isPast(date)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Info Banner with flexibility messaging
 */
function InfoBanner() {
  return (
    <div className="lcs-info-banner" role="note">
      <Info size={18} className="lcs-info-icon" aria-hidden="true" />
      <div className="lcs-info-text">
        <strong>This schedule is an estimate</strong> based on your accepted proposal terms.
        During your reservation, you can request date changes, swap nights with other guests,
        or adjust your schedule. All modifications require host approval.
        <a href="/guest-leases" className="lcs-info-link">Manage your lease →</a>
      </div>
    </div>
  );
}

/**
 * Stats Summary Row
 */
function StatsSummary({ stats }) {
  return (
    <div className="lcs-stats-row">
      <div className="lcs-stat">
        <span className="lcs-stat-value">{stats.totalNights}</span>
        <span className="lcs-stat-label">Total Nights</span>
      </div>
      <div className="lcs-stat">
        <span className="lcs-stat-value">{stats.totalWeeks}</span>
        <span className="lcs-stat-label">Weeks</span>
      </div>
      <div className="lcs-stat">
        <span className="lcs-stat-value">{stats.nightsRemaining}</span>
        <span className="lcs-stat-label">Remaining</span>
      </div>
      {stats.nextStay && (
        <div className="lcs-stat lcs-stat--highlight">
          <span className="lcs-stat-value">
            {formatShortDate(stats.nextStay.checkIn)}
          </span>
          <span className="lcs-stat-label">Next Check-in</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Lease Calendar Section
 *
 * Self-contained component that fetches lease data for an activated proposal
 * and displays a calendar view with schedule information.
 *
 * @param {Object} props
 * @param {Object} props.proposal - The proposal object
 * @returns {JSX.Element|null}
 */
export default function LeaseCalendarSection({ proposal }) {
  const [leaseData, setLeaseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Check if this proposal has an activated lease
  const isActivated = isLeaseActivatedStatus(proposal?.Status);

  // Fetch lease data when component mounts (if activated)
  useEffect(() => {
    if (!isActivated || !proposal?._id) {
      setIsLoading(false);
      return;
    }

    async function loadLeaseData() {
      setIsLoading(true);
      const data = await fetchLeaseDataForProposal(proposal._id);
      setLeaseData(data);

      // If we have lease data, set initial month to lease start
      if (data?.startDate) {
        const startDate = new Date(data.startDate);
        if (!isNaN(startDate.getTime())) {
          setCurrentMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
        }
      }

      setIsLoading(false);
    }

    loadLeaseData();
  }, [isActivated, proposal?._id]);

  // Don't render if not activated or still loading
  if (!isActivated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="lcs-loading">
        <div className="lcs-loading-spinner" />
        <span>Loading lease schedule...</span>
      </div>
    );
  }

  // If no lease data found, show contextual message based on status
  if (!leaseData) {
    const status = proposal?.Status?.toLowerCase() || '';
    const isDrafting = status.includes('drafting') || status.includes('accepted');
    const isReview = status.includes('review');
    const isSignatures = status.includes('signatures');

    let message = 'Lease schedule is being prepared. Check back soon.';
    if (isDrafting) {
      message = 'Your lease documents are being drafted. The schedule will appear here once finalized.';
    } else if (isReview) {
      message = 'Your lease documents are ready for review. The schedule will appear here soon.';
    } else if (isSignatures) {
      message = 'Awaiting signatures. Your schedule will appear once the lease is signed.';
    }

    return (
      <section className="lcs-section lcs-section--pending" aria-labelledby="lcs-heading-pending">
        <h3 id="lcs-heading-pending" className="lcs-heading">
          <Calendar size={20} aria-hidden="true" />
          Your Lease Schedule
        </h3>
        <div className="lcs-pending-message">
          <div className="lcs-pending-icon">
            <Calendar size={32} />
          </div>
          <p>{message}</p>
          <p className="lcs-pending-subtext">
            This schedule is an estimate. During your reservation, you&apos;ll be able to
            request date changes or adjust your schedule with host approval.
          </p>
        </div>
      </section>
    );
  }

  // Extract booked dates and calculate stats
  const bookedDates = extractBookedDatesFromLease(leaseData);
  const stats = calculateLeaseStats(leaseData);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  return (
    <section className="lcs-section" aria-labelledby="lcs-heading">
      <h3 id="lcs-heading" className="lcs-heading">
        <Calendar size={20} aria-hidden="true" />
        Your Lease Schedule
      </h3>

      <InfoBanner />

      <div className="lcs-calendar-wrapper">
        <CalendarControls
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />

        <MonthCalendar
          month={currentMonth}
          bookedDates={bookedDates}
        />

        {/* Legend */}
        <div className="lcs-legend">
          <div className="lcs-legend-item">
            <span className="lcs-legend-dot lcs-legend-dot--booked" />
            <span>Booked Night</span>
          </div>
          <div className="lcs-legend-item">
            <span className="lcs-legend-dot lcs-legend-dot--today" />
            <span>Today</span>
          </div>
        </div>
      </div>

      <StatsSummary stats={stats} />

      <div className="lcs-actions">
        <a href="/guest-leases" className="lcs-btn lcs-btn--primary">
          View Full Lease Details
        </a>
      </div>
    </section>
  );
}
