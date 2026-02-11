import { lazy, Suspense, useState, useCallback, useMemo, useEffect } from 'react';
import { useListingDashboard } from '../context/ListingDashboardContext';
import { useCalendarState } from './availability/useCalendarState.js';
import { useDragToBlock } from './availability/useDragToBlock.js';

const CalendarGrid = lazy(() => import('./CalendarGrid.jsx'));

// Helper to format date as YYYY-MM-DD
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format date for date input (YYYY-MM-DD)
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

export default function AvailabilitySection({ compact = false }) {
  const {
    listing,
    calendarData,
    ensureCalendarData,
    handleBlockedDatesChange,
    handleAvailabilityChange,
  } = useListingDashboard();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPrices, setShowPrices] = useState(() => {
    return window.localStorage.getItem('ld-calendar-showPrices') === 'true';
  });

  // Blocked dates state
  const [blockedDates, setBlockedDates] = useState(() => listing?.blockedDates || []);

  // Display controls
  const [showAllBlockedDates, setShowAllBlockedDates] = useState(false);
  const [showPastBlockedDates, setShowPastBlockedDates] = useState(false);

  useEffect(() => {
    window.localStorage.setItem('ld-calendar-showPrices', String(showPrices));
  }, [showPrices]);

  useEffect(() => {
    setBlockedDates(listing?.blockedDates || []);
  }, [listing?.blockedDates]);

  useEffect(() => {
    ensureCalendarData?.();
  }, [ensureCalendarData]);

  // Stable today reference
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const {
    visibleMonths,
    multiCalendarDays,
    navigateMonth,
    blockedSet,
    isDateBlocked,
    isDateBooked,
    isToday,
    isFirstAvailableDate,
    getDayPrice,
    getLeaseTooltip,
    getDayTooltip,
    multiMonthStats,
    allFutureBlockedDates,
    pastBlockedDates,
    displayedBlockedDates,
    hasMoreDates,
  } = useCalendarState({
    currentDate,
    setCurrentDate,
    blockedDates,
    listing,
    calendarData,
    showAllBlockedDates,
    today,
    formatDateKey,
  });

  const toggleBlockedDate = useCallback((dateKey) => {
    setBlockedDates((prev) => {
      const next = prev.includes(dateKey)
        ? prev.filter((d) => d !== dateKey)
        : [...prev, dateKey].sort();
      handleBlockedDatesChange?.(next);
      return next;
    });
  }, [handleBlockedDatesChange]);

  const {
    dragState,
    handleDayMouseDown,
    handleDayMouseEnter,
    handleTouchMove,
    isDayInDragRange,
  } = useDragToBlock({
    blockedSet,
    setBlockedDates,
    handleBlockedDatesChange,
    today,
    formatDateKey,
  });

  // Keyboard toggle (Enter/Space in CalendarGrid)
  const handleDateClick = useCallback((dayInfo) => {
    if (dayInfo.isPast || !dayInfo.date || isDateBooked(dayInfo.date)) return;
    toggleBlockedDate(formatDateKey(dayInfo.date));
  }, [toggleBlockedDate, isDateBooked]);

  // --- Quick-set patterns ---
  const applyPattern = useCallback((pattern) => {
    if (pattern === 'unblock-all') {
      if (!window.confirm('This will unblock all dates - continue?')) return;
    }
    if (pattern === 'block-month') {
      if (!window.confirm('This will block all remaining days in the current month - continue?')) return;
    }

    const datesToBlock = [];
    let datesToUnblock = [];

    switch (pattern) {
      case 'block-weekdays': {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (d >= today && d.getDay() !== 0 && d.getDay() !== 6) {
            datesToBlock.push(formatDateKey(new Date(d)));
          }
        }
        break;
      }
      case 'block-weekends': {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (d >= today && (d.getDay() === 0 || d.getDay() === 6)) {
            datesToBlock.push(formatDateKey(new Date(d)));
          }
        }
        break;
      }
      case 'block-month': {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) {
          const d = new Date(year, month, i);
          if (d >= today) datesToBlock.push(formatDateKey(d));
        }
        break;
      }
      case 'unblock-all': {
        datesToUnblock = [...blockedDates];
        break;
      }
      case 'block-next-30': {
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          datesToBlock.push(formatDateKey(d));
        }
        break;
      }
    }

    const newBlocked = new Set([...blockedDates, ...datesToBlock]);
    datesToUnblock.forEach(d => newBlocked.delete(d));
    const finalBlocked = [...newBlocked].sort();
    setBlockedDates(finalBlocked);
    handleBlockedDatesChange?.(finalBlocked);
  }, [currentDate, blockedDates, today, handleBlockedDatesChange]);

  // Format blocked date for display
  const formatBlockedDate = (dateKey) => {
    return new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const settingsFields = (
    <div className={compact ? 'listing-dashboard-availability__settings listing-dashboard-availability__settings--compact-row' : 'listing-dashboard-availability__settings'}>
          {/* Lease Term */}
          <div className="listing-dashboard-availability__field">
            <label htmlFor="availability-lease-term-min">What is the ideal Lease Term? (Enter between 6 and 52 weeks.)</label>
            <div className="listing-dashboard-availability__range-inputs">
              <input
                id="availability-lease-term-min"
                type="number"
                value={listing?.leaseTermMin || 6}
                min={6}
                max={52}
                aria-label="Minimum lease term in weeks"
                onChange={(e) => {
                  const val = Math.min(52, Math.max(6, parseInt(e.target.value) || 6));
                  handleAvailabilityChange?.('leaseTermMin', val);
                }}
              />
              <span>-</span>
              <input
                id="availability-lease-term-max"
                type="number"
                value={listing?.leaseTermMax || 52}
                min={6}
                max={52}
                aria-label="Maximum lease term in weeks"
                onChange={(e) => {
                  const val = Math.min(52, Math.max(6, parseInt(e.target.value) || 52));
                  handleAvailabilityChange?.('leaseTermMax', val);
                }}
              />
            </div>
          </div>

          {/* Earliest Available Date */}
          <div className="listing-dashboard-availability__field">
            <label htmlFor="availability-earliest-date">What is the earliest date someone could rent from you?</label>
            <input
              id="availability-earliest-date"
              type="date"
              value={formatDateForInput(listing?.earliestAvailableDate)}
              className="listing-dashboard-availability__date-input"
              onChange={(e) => handleAvailabilityChange?.('earliestAvailableDate', e.target.value)}
            />
          </div>

          {/* Check In/Out Times */}
          <div className="listing-dashboard-availability__times">
            <div className="listing-dashboard-availability__time-field">
              <label htmlFor="availability-checkin-time">Check In Time</label>
              <select
                id="availability-checkin-time"
                value={listing?.checkInTime || '1:00 pm'}
                onChange={(e) => handleAvailabilityChange?.('checkInTime', e.target.value)}
              >
                <option value="12:00 pm">12:00 pm</option>
                <option value="1:00 pm">1:00 pm</option>
                <option value="2:00 pm">2:00 pm</option>
                <option value="3:00 pm">3:00 pm</option>
                <option value="4:00 pm">4:00 pm</option>
                <option value="5:00 pm">5:00 pm</option>
              </select>
            </div>
            <div className="listing-dashboard-availability__time-field">
              <label htmlFor="availability-checkout-time">Check Out Time</label>
              <select
                id="availability-checkout-time"
                value={listing?.checkOutTime || '11:00 am'}
                onChange={(e) => handleAvailabilityChange?.('checkOutTime', e.target.value)}
              >
                <option value="9:00 am">9:00 am</option>
                <option value="10:00 am">10:00 am</option>
                <option value="11:00 am">11:00 am</option>
                <option value="12:00 pm">12:00 pm</option>
                <option value="1:00 pm">1:00 pm</option>
              </select>
            </div>
          </div>
        </div>
  );

  return (
    <div id="availability" className={compact ? 'listing-dashboard-availability listing-dashboard-availability--compact' : 'listing-dashboard-availability'}>
      {!compact && (
        <div className="listing-dashboard-section">
          <div className="listing-dashboard-section__header">
            <h2 className="listing-dashboard-section__title">Listing Availability</h2>
          </div>
          {settingsFields}
        </div>
      )}

      {compact && settingsFields}

      {/* Calendar Section */}
      <div className={compact ? 'listing-dashboard-availability__calendar-shell' : 'listing-dashboard-section'}>
        {!compact && (
          <div className="listing-dashboard-section__header">
            <h2 className="listing-dashboard-section__title">Blocked Dates</h2>
          </div>
        )}

        <div className="listing-dashboard-availability__calendar-container">
          {/* Left Side - Instructions + Quick Actions + Blocked Dates */}
          <div className="listing-dashboard-availability__instructions">
            <p>Click or drag across dates to block or unblock them. The action is determined by the first date you click.</p>

            {/* Quick-set patterns */}
            <div className="listing-dashboard-availability__quick-actions">
              <span className="listing-dashboard-availability__quick-label">Quick set:</span>
              <button type="button" className="listing-dashboard-availability__quick-btn" onClick={() => applyPattern('block-weekdays')}>Block Weekdays</button>
              <button type="button" className="listing-dashboard-availability__quick-btn" onClick={() => applyPattern('block-weekends')}>Block Weekends</button>
              <button type="button" className="listing-dashboard-availability__quick-btn" onClick={() => applyPattern('block-month')}>Block This Month</button>
              <button type="button" className="listing-dashboard-availability__quick-btn" onClick={() => applyPattern('block-next-30')}>Block Next 30 Days</button>
              <button type="button" className="listing-dashboard-availability__quick-btn listing-dashboard-availability__quick-btn--danger" onClick={() => applyPattern('unblock-all')}>Unblock All</button>
            </div>

            {/* Blocked dates list */}
            <div className="listing-dashboard-availability__info">
              <p><strong>Dates Blocked by You</strong></p>
              {allFutureBlockedDates.length > 0 ? (
                <div className="listing-dashboard-availability__blocked-list">
                  {displayedBlockedDates.map((dateKey) => (
                    <span key={dateKey} className="listing-dashboard-availability__blocked-date">
                      {formatBlockedDate(dateKey)}
                      <button
                        type="button"
                        className="listing-dashboard-availability__remove-date"
                        onClick={() => toggleBlockedDate(dateKey)}
                        title="Remove blocked date"
                        aria-label={`Remove blocked date ${dateKey}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {hasMoreDates && !showAllBlockedDates && (
                    <button
                      type="button"
                      className="listing-dashboard-availability__more-dates-btn"
                      onClick={() => setShowAllBlockedDates(true)}
                    >
                      +{allFutureBlockedDates.length - 10} more dates
                    </button>
                  )}
                  {showAllBlockedDates && hasMoreDates && (
                    <button
                      type="button"
                      className="listing-dashboard-availability__more-dates-btn"
                      onClick={() => setShowAllBlockedDates(false)}
                    >
                      Show less
                    </button>
                  )}
                </div>
              ) : (
                <p className="listing-dashboard-availability__no-blocked">
                  You don&apos;t have any future dates blocked yet
                </p>
              )}

              {/* Past blocked dates - expandable section */}
              {pastBlockedDates.length > 0 && (
                <div className="listing-dashboard-availability__past-dates">
                  <button
                    type="button"
                    className="listing-dashboard-availability__past-dates-toggle"
                    onClick={() => setShowPastBlockedDates(!showPastBlockedDates)}
                  >
                    <span>{showPastBlockedDates ? '\u25BC' : '\u25B6'}</span>
                    <span>Past blocked dates ({pastBlockedDates.length})</span>
                  </button>
                  {showPastBlockedDates && (
                    <div className="listing-dashboard-availability__blocked-list listing-dashboard-availability__blocked-list--past">
                      {pastBlockedDates.map((dateKey) => (
                        <span key={dateKey} className="listing-dashboard-availability__blocked-date listing-dashboard-availability__blocked-date--past">
                          {formatBlockedDate(dateKey)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Multi-Month Calendar (3 months) */}
          <div
            className="listing-dashboard-availability__multi-calendar"
            onTouchMove={handleTouchMove}
          >
            <Suspense fallback={<div className="listing-dashboard-section-loading">Loading calendar...</div>}>
              {visibleMonths.map((monthDate, idx) => (
                <CalendarGrid
                  key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                  currentDate={monthDate}
                  navigateMonth={idx === 0 ? navigateMonth : undefined}
                  calendarDays={multiCalendarDays[idx]}
                  isDateBlocked={isDateBlocked}
                  isDateBooked={isDateBooked}
                  isToday={isToday}
                  isFirstAvailableDate={isFirstAvailableDate}
                  getDayPrice={getDayPrice}
                  showPrices={showPrices}
                  setShowPrices={idx === 0 ? setShowPrices : undefined}
                  getDayTooltip={getDayTooltip}
                  getLeaseTooltip={getLeaseTooltip}
                  monthStats={multiMonthStats[idx]}
                  handleDateClick={handleDateClick}
                  showNavigation={idx === 0}
                  compact={true}
                  showLegend={idx === visibleMonths.length - 1}
                  dragState={dragState}
                  onDayMouseDown={handleDayMouseDown}
                  onDayMouseEnter={handleDayMouseEnter}
                  isDayInDragRange={isDayInDragRange}
                />
              ))}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
