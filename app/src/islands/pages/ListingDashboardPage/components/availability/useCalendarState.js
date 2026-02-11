import { useMemo, useCallback } from 'react';

function getCalendarDays(monthDate, today) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const days = [];

  const prevMonth = new Date(year, month, 0);
  for (let i = startPadding - 1; i >= 0; i -= 1) {
    const dayNum = prevMonth.getDate() - i;
    const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), dayNum);
    days.push({ day: dayNum, isCurrentMonth: false, isPast: date < today, date });
  }

  for (let i = 1; i <= daysInMonth; i += 1) {
    const date = new Date(year, month, i);
    days.push({ day: i, isCurrentMonth: true, isPast: date < today, date });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i += 1) {
    const date = new Date(year, month + 1, i);
    days.push({ day: i, isCurrentMonth: false, isPast: false, date });
  }

  return days;
}

export function useCalendarState({
  currentDate,
  setCurrentDate,
  blockedDates,
  listing,
  calendarData,
  showAllBlockedDates,
  today,
  formatDateKey,
}) {
  const visibleMonths = useMemo(() => {
    const months = [];
    for (let i = 0; i < 3; i += 1) {
      months.push(new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1));
    }
    return months;
  }, [currentDate]);

  const multiCalendarDays = useMemo(() => {
    return visibleMonths.map((month) => getCalendarDays(month, today));
  }, [visibleMonths, today]);

  const navigateMonth = useCallback((direction) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  }, [setCurrentDate]);

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const isDateBlocked = useCallback((date) => {
    if (!date) return false;
    return blockedSet.has(formatDateKey(date));
  }, [blockedSet, formatDateKey]);

  const leaseDateMap = useMemo(() => {
    const map = new Map();
    const bookedRanges = calendarData?.bookedDateRanges || [];

    bookedRanges.forEach((lease) => {
      if (!lease.start || !lease.end) return;

      const start = new Date(lease.start);
      const end = new Date(lease.end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

      for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        const key = formatDateKey(day);
        const existing = map.get(key) || [];
        existing.push(lease);
        map.set(key, existing);
      }
    });

    return map;
  }, [calendarData?.bookedDateRanges, formatDateKey]);

  const bookedDates = useMemo(() => new Set(leaseDateMap.keys()), [leaseDateMap]);

  const isDateBooked = useCallback((date) => {
    if (!date) return false;
    return bookedDates.has(formatDateKey(date));
  }, [bookedDates, formatDateKey]);

  const isToday = useCallback((date) => {
    if (!date) return false;
    return (
      date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth()
      && date.getDate() === today.getDate()
    );
  }, [today]);

  const firstAvailableDateKey = useMemo(() => {
    if (!listing?.earliestAvailableDate) return null;

    const date = new Date(listing.earliestAvailableDate);
    if (Number.isNaN(date.getTime())) return null;
    return formatDateKey(date);
  }, [listing?.earliestAvailableDate, formatDateKey]);

  const isFirstAvailableDate = useCallback((date) => {
    if (!date || !firstAvailableDateKey) return false;
    return formatDateKey(date) === firstAvailableDateKey;
  }, [firstAvailableDateKey, formatDateKey]);

  const baseNightlyRate = useMemo(() => {
    const overlayRate = Number(calendarData?.pricing?.perNight);
    if (Number.isFinite(overlayRate) && overlayRate > 0) return Math.round(overlayRate);

    if (listing?.nightlyPricing && typeof listing.nightlyPricing === 'object') {
      const direct = Number(
        listing.nightlyPricing.default
          || listing.nightlyPricing.base
          || listing.nightlyPricing[1]
      );
      if (Number.isFinite(direct) && direct > 0) return Math.round(direct);
    }

    if (listing?.pricing && typeof listing.pricing === 'object') {
      const direct = Number(listing.pricing[1]);
      if (Number.isFinite(direct) && direct > 0) return Math.round(direct);
    }

    const weekly = Number(listing?.weeklyRate || listing?.weeklyHostRate);
    if (Number.isFinite(weekly) && weekly > 0) return Math.round(weekly / 7);

    const monthly = Number(listing?.monthlyRate || listing?.monthlyHostRate);
    if (Number.isFinite(monthly) && monthly > 0) return Math.round(monthly / 30);

    return null;
  }, [calendarData?.pricing?.perNight, listing]);

  const getDayPrice = useCallback((date) => {
    if (!date || !date.getTime || Number.isNaN(date.getTime())) return null;
    return baseNightlyRate;
  }, [baseNightlyRate]);

  const formatDateShort = useCallback((dateValue) => {
    if (!dateValue) return '';

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const getLeaseTooltip = useCallback((date) => {
    if (!date) return undefined;

    const leases = leaseDateMap.get(formatDateKey(date));
    if (!leases?.length) return undefined;

    const lease = leases[0];
    const agreement = lease.agreement_number || 'active';
    const start = formatDateShort(lease.reservation_start_date);
    const end = formatDateShort(lease.reservation_end_date);

    return `Lease ${agreement}: ${start} - ${end}`;
  }, [leaseDateMap, formatDateKey, formatDateShort]);

  const getDayTooltip = useCallback((dayInfo, isBlocked, isBooked) => {
    if (!dayInfo.isCurrentMonth) return undefined;
    if (dayInfo.isPast) return 'Past date';
    if (isBooked) return 'Booked';
    if (isBlocked) return 'Blocked - drag or click to unblock';
    return 'Available - drag or click to block';
  }, []);

  const multiMonthStats = useMemo(() => {
    return multiCalendarDays.map((days) => {
      const currentMonthDays = days.filter((day) => day.isCurrentMonth);
      const futureDays = currentMonthDays.filter((day) => !day.isPast);
      const available = futureDays.filter(
        (day) => day.date && !isDateBlocked(day.date) && !isDateBooked(day.date)
      );
      return { available: available.length, total: futureDays.length };
    });
  }, [multiCalendarDays, isDateBlocked, isDateBooked]);

  const sortedBlockedDates = useMemo(() => [...blockedDates].sort(), [blockedDates]);

  const allFutureBlockedDates = useMemo(() => {
    const todayKey = formatDateKey(today);
    return sortedBlockedDates.filter((date) => date >= todayKey);
  }, [sortedBlockedDates, today, formatDateKey]);

  const pastBlockedDates = useMemo(() => {
    const todayKey = formatDateKey(today);
    return sortedBlockedDates.filter((date) => date < todayKey).reverse();
  }, [sortedBlockedDates, today, formatDateKey]);

  const displayedBlockedDates = useMemo(() => {
    return showAllBlockedDates
      ? allFutureBlockedDates
      : allFutureBlockedDates.slice(0, 10);
  }, [allFutureBlockedDates, showAllBlockedDates]);

  const hasMoreDates = allFutureBlockedDates.length > 10;

  return {
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
  };
}
