import { useState, useMemo, useCallback, useEffect } from 'react';

function getDatesBetween(startDate, endDate, formatDateKey) {
  const dates = [];
  let start = new Date(startDate);
  let end = new Date(endDate);

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function useDragToBlock({ blockedSet, setBlockedDates, handleBlockedDatesChange, today, formatDateKey }) {
  const [dragState, setDragState] = useState({
    active: false,
    mode: null,
    startDate: null,
    currentDate: null,
  });

  const handleDayMouseDown = useCallback((dayInfo) => {
    if (dayInfo.isPast || !dayInfo.date) return;

    const blocked = blockedSet.has(formatDateKey(dayInfo.date));
    setDragState({
      active: true,
      mode: blocked ? 'unblock' : 'block',
      startDate: dayInfo.date,
      currentDate: dayInfo.date,
    });
  }, [blockedSet, formatDateKey]);

  const handleDayMouseEnter = useCallback((dayInfo) => {
    if (!dragState.active || !dayInfo.date) return;
    setDragState((prev) => ({ ...prev, currentDate: dayInfo.date }));
  }, [dragState.active]);

  useEffect(() => {
    if (!dragState.active) return undefined;

    const commit = () => {
      const dates = getDatesBetween(dragState.startDate, dragState.currentDate, formatDateKey);
      const todayKey = formatDateKey(today);
      const futureDates = dates.filter((date) => date >= todayKey);

      setBlockedDates((prev) => {
        let next;
        if (dragState.mode === 'block') {
          const toAdd = futureDates.filter((date) => !prev.includes(date));
          next = [...prev, ...toAdd].sort();
        } else {
          const removeSet = new Set(futureDates);
          next = prev.filter((date) => !removeSet.has(date));
        }

        handleBlockedDatesChange?.(next);
        return next;
      });

      setDragState({ active: false, mode: null, startDate: null, currentDate: null });
    };

    document.addEventListener('mouseup', commit);
    document.addEventListener('touchend', commit);

    return () => {
      document.removeEventListener('mouseup', commit);
      document.removeEventListener('touchend', commit);
    };
  }, [dragState.active, dragState.startDate, dragState.currentDate, dragState.mode, today, formatDateKey, handleBlockedDatesChange, setBlockedDates]);

  const dragRangeDates = useMemo(() => {
    if (!dragState.active || !dragState.startDate || !dragState.currentDate) return new Set();
    return new Set(getDatesBetween(dragState.startDate, dragState.currentDate, formatDateKey));
  }, [dragState.active, dragState.startDate, dragState.currentDate, formatDateKey]);

  const isDayInDragRange = useCallback((date) => {
    if (!date || dragRangeDates.size === 0) return false;
    return dragRangeDates.has(formatDateKey(date));
  }, [dragRangeDates, formatDateKey]);

  const handleTouchMove = useCallback((event) => {
    if (!dragState.active) return;

    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element?.dataset?.date) return;

    const [year, month, day] = element.dataset.date.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    setDragState((prev) => ({ ...prev, currentDate: date }));
  }, [dragState.active]);

  return {
    dragState,
    handleDayMouseDown,
    handleDayMouseEnter,
    handleTouchMove,
    isDayInDragRange,
  };
}
