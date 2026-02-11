/**
 * Z-Unit Payment Records JS Page Logic Hook
 *
 * All business logic for the ZUnitPaymentRecordsJsPage.
 * Follows the Hollow Component Pattern.
 *
 * Payment Records Test Features:
 * - Lease selector with search
 * - JS-calculated vs legacy native payment comparison
 * - Guest and Host payment schedule tables
 * - Regenerate payment records functionality
 * - Reservation calendar with navigation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { calculateGuestPaymentSchedule } from '../../../logic/calculators/payments/calculateGuestPaymentSchedule.js';
import { calculateHostPaymentSchedule } from '../../../logic/calculators/payments/calculateHostPaymentSchedule.js';

// Month names for calendar display
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Day names for calendar header
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Initial state values
const INITIAL_GUEST_PAYMENT_SCHEDULE = { jsCalculated: [], legacyNative: [] };
const INITIAL_HOST_PAYMENT_SCHEDULE = { jsCalculated: [], legacyNative: [] };

/**
 * Parse array field that may be JSON string or native array
 * @param {any} value - Value to parse
 * @returns {any[]} Parsed array
 */
function parseArrayField(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Parse date from various formats
 * @param {string|Date} dateValue - Date value to parse
 * @returns {Date|null} Parsed date or null
 */
function parseDateField(dateValue) {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format date for display
 * @param {string|Date} dateValue - Date value
 * @returns {string} Formatted date string
 */
function formatDisplayDate(dateValue) {
  if (!dateValue) return '-';
  const date = parseDateField(dateValue);
  if (!date) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format currency for display
 * @param {number} value - Currency value
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) return '$0.00';
  return `$${value.toFixed(2)}`;
}

export function useZUnitPaymentRecordsJsPageLogic() {
  // Lease selector state
  const [leases, setLeases] = useState([]);
  const [leasesLoading, setLeasesLoading] = useState(false);
  const [leasesError, setLeasesError] = useState(null);
  const [selectedLeaseId, setSelectedLeaseId] = useState('');
  const [selectedLease, setSelectedLease] = useState(null);
  const [selectedLeaseLoading, setSelectedLeaseLoading] = useState(false);

  // Proposal data (linked to selected lease)
  const [proposalData, setProposalData] = useState(null);

  // Payment schedules
  const [guestPaymentSchedule, setGuestPaymentSchedule] = useState(INITIAL_GUEST_PAYMENT_SCHEDULE);
  const [hostPaymentSchedule, setHostPaymentSchedule] = useState(INITIAL_HOST_PAYMENT_SCHEDULE);
  const [paymentSchedulesLoading, setPaymentSchedulesLoading] = useState(false);

  // Calendar state
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  // Regeneration state
  const [regeneratingGuest, setRegeneratingGuest] = useState(false);
  const [regeneratingHost, setRegeneratingHost] = useState(false);
  const [regenerationError, setRegenerationError] = useState(null);
  const [regenerationSuccess, setRegenerationSuccess] = useState(null);

  // View mode toggle (JS calculated vs legacy native)
  const [viewMode, setViewMode] = useState('jsCalculated'); // 'jsCalculated' or 'legacyNative'

  // Fetch leases for dropdown
  useEffect(() => {
    const fetchLeases = async () => {
      setLeasesLoading(true);
      setLeasesError(null);

      try {
        const { data, error } = await supabase
          .from('booking_lease')
          .select(`
            id,
            agreement_number,
            lease_type,
            reservation_start_date,
            reservation_end_date,
            total_guest_rent_amount,
            total_host_compensation_amount,
            listing_id,
            guest_user_id,
            host_user_id,
            guest_to_platform_payment_records_json,
            platform_to_host_payment_records_json
          `)
          .not('proposal_id', 'is', null)
          .order('agreement_number', { ascending: false })
          .limit(100);

        if (error) throw error;

        setLeases(data || []);
      } catch (error) {
        console.error('[ZUnitPaymentRecordsJs] Failed to fetch leases:', error);
        setLeasesError('Failed to load leases');
      } finally {
        setLeasesLoading(false);
      }
    };

    fetchLeases();
  }, []);

  // Fetch proposal data when lease is selected
  const fetchProposalData = useCallback(async (proposalId) => {
    if (!proposalId) {
      setProposalData(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('booking_proposal')
        .select(`
          id,
          guest_selected_days_numbers_json,
          guest_selected_nights_numbers_json,
          reservation_span_in_weeks,
          stay_duration_in_months,
          rental_type,
          four_week_rent_amount,
          "Rent per Month",
          move_in_range_start_date,
          move_in_range_end_date,
          "Week Pattern",
          "Maintenance Fee",
          damage_deposit_amount
        `)
        .eq('id', proposalId)
        .single();

      if (error) throw error;

      setProposalData(data);
      return data;
    } catch (error) {
      console.error('[ZUnitPaymentRecordsJs] Failed to fetch proposal:', error);
      setProposalData(null);
      return null;
    }
  }, []);

  // Fetch legacy native payment records
  const fetchLegacyNativePayments = useCallback(async (guestPaymentIds, hostPaymentIds) => {
    const guestNative = [];
    const hostNative = [];

    // Fetch guest payment records
    if (guestPaymentIds && guestPaymentIds.length > 0) {
      try {
        const { data, error } = await supabase
          .from('paymentrecords')
          .select(`
            _id,
            "Payment #",
            "Scheduled Date",
            "Date payment received",
            "rent",
            "maintenance_fee",
            "damage_deposit_amount",
            "total",
            "Bank Transaction Number",
            "receipt_status"
          `)
          .in('_id', guestPaymentIds)
          .order('"Payment #"', { ascending: true });

        if (!error && data) {
          data.forEach(record => {
            guestNative.push({
              paymentNumber: record['Payment #'] || 0,
              scheduledDate: record['Scheduled Date'],
              actualDate: record['Date payment received'],
              rent: parseFloat(record['rent']) || 0,
              maintenanceFee: parseFloat(record['maintenance_fee']) || 0,
              damageDeposit: parseFloat(record.damage_deposit_amount) || 0,
              total: parseFloat(record['total']) || 0,
              bankTransactionNumber: record['Bank Transaction Number'] || null,
              receiptStatus: record['receipt_status'] || 'pending',
            });
          });
        }
      } catch (error) {
        console.error('[ZUnitPaymentRecordsJs] Failed to fetch guest payments:', error);
      }
    }

    // Fetch host payment records (using same table, different filtering)
    if (hostPaymentIds && hostPaymentIds.length > 0) {
      try {
        const { data, error } = await supabase
          .from('paymentrecords')
          .select(`
            _id,
            "Payment #",
            "Scheduled Date",
            "Date payment received",
            "ðŸ’°Rent",
            "ðŸ’°Maintenance Fee",
            "ðŸ’°Total",
            "Bank Transaction Number",
            "receipt_status"
          `)
          .in('_id', hostPaymentIds)
          .order('"Payment #"', { ascending: true });

        if (!error && data) {
          data.forEach(record => {
            hostNative.push({
              paymentNumber: record['Payment #'] || 0,
              scheduledDate: record['Scheduled Date'],
              actualDate: record['Date payment received'],
              rent: parseFloat(record['ðŸ’°Rent']) || 0,
              maintenanceFee: parseFloat(record['ðŸ’°Maintenance Fee']) || 0,
              total: parseFloat(record['ðŸ’°Total']) || 0,
              bankTransactionNumber: record['Bank Transaction Number'] || null,
              payoutStatus: record['receipt_status'] || 'pending',
            });
          });
        }
      } catch (error) {
        console.error('[ZUnitPaymentRecordsJs] Failed to fetch host payments:', error);
      }
    }

    return { guestNative, hostNative };
  }, []);

  // Calculate JS payment schedules
  const calculateJsPaymentSchedules = useCallback((proposal, _lease) => {
    if (!proposal) {
      return { guestSchedule: [], hostSchedule: [] };
    }

    const rentalType = proposal.rental_type;
    const moveInDate = proposal.move_in_range_start_date;
    const reservationSpanWeeks = parseFloat(proposal.reservation_span_in_weeks) || 0;
    const reservationSpanMonths = parseFloat(proposal.stay_duration_in_months) || 0;
    const weekPattern = proposal['Week Pattern'] || 'Every week';
    const fourWeekRent = parseFloat(proposal.four_week_rent_amount) || 0;
    const rentPerMonth = parseFloat(proposal['Rent per Month']) || 0;
    const maintenanceFee = parseFloat(proposal['Maintenance Fee']) || 0;
    const damageDeposit = parseFloat(proposal.damage_deposit_amount) || 0;

    let guestSchedule = [];
    let hostSchedule = [];

    // Calculate guest payment schedule
    if (moveInDate && rentalType) {
      try {
        const guestResult = calculateGuestPaymentSchedule({
          rentalType,
          moveInDate,
          reservationSpanWeeks: reservationSpanWeeks > 0 ? reservationSpanWeeks : undefined,
          reservationSpanMonths: reservationSpanMonths > 0 ? reservationSpanMonths : undefined,
          weekPattern,
          fourWeekRent: fourWeekRent > 0 ? fourWeekRent : undefined,
          rentPerMonth: rentPerMonth > 0 ? rentPerMonth : undefined,
          maintenanceFee,
          damageDeposit
        });

        guestSchedule = guestResult.paymentDates.map((date, index) => ({
          paymentNumber: index + 1,
          scheduledDate: date,
          actualDate: null,
          rent: guestResult.rentList[index],
          maintenanceFee: maintenanceFee,
          damageDeposit: index === 0 ? damageDeposit : 0,
          total: guestResult.totalRentList[index],
          bankTransactionNumber: null,
          receiptStatus: 'pending',
        }));
      } catch (error) {
        console.error('[ZUnitPaymentRecordsJs] Guest calculation error:', error);
      }
    }

    // Calculate host payment schedule
    if (moveInDate && rentalType) {
      try {
        const hostResult = calculateHostPaymentSchedule({
          rentalType,
          moveInDate,
          reservationSpanWeeks: reservationSpanWeeks > 0 ? reservationSpanWeeks : undefined,
          reservationSpanMonths: reservationSpanMonths > 0 ? reservationSpanMonths : undefined,
          weekPattern,
          fourWeekRent: fourWeekRent > 0 ? fourWeekRent : undefined,
          rentPerMonth: rentPerMonth > 0 ? rentPerMonth : undefined,
          maintenanceFee
        });

        hostSchedule = hostResult.paymentDates.map((date, index) => ({
          paymentNumber: index + 1,
          scheduledDate: date,
          actualDate: null,
          rent: hostResult.rentList[index],
          maintenanceFee: maintenanceFee,
          total: hostResult.totalRentList[index],
          bankTransactionNumber: null,
          payoutStatus: 'pending',
        }));
      } catch (error) {
        console.error('[ZUnitPaymentRecordsJs] Host calculation error:', error);
      }
    }

    return { guestSchedule, hostSchedule };
  }, []);

  // Handle lease selection
  const handleLeaseSelect = useCallback(async (leaseId) => {
    setSelectedLeaseId(leaseId);
    setRegenerationError(null);
    setRegenerationSuccess(null);

    if (!leaseId) {
      setSelectedLease(null);
      setProposalData(null);
      setGuestPaymentSchedule(INITIAL_GUEST_PAYMENT_SCHEDULE);
      setHostPaymentSchedule(INITIAL_HOST_PAYMENT_SCHEDULE);
      return;
    }

    setSelectedLeaseLoading(true);
    setPaymentSchedulesLoading(true);

    try {
      // Find the lease from the loaded list
      const lease = leases.find(l => l.id === leaseId);
      if (!lease) {
        throw new Error('Lease not found');
      }

      setSelectedLease(lease);

      // Update calendar to reservation start date if available
      const startDate = parseDateField(lease.reservation_start_date);
      if (startDate) {
        setCalendarYear(startDate.getFullYear());
        setCalendarMonth(startDate.getMonth());
      }

      // Fetch proposal data
      const proposal = await fetchProposalData(lease.proposal_id);

      // Fetch legacy native payment records
      const guestPaymentIds = parseArrayField(lease.guest_to_platform_payment_records_json);
      const hostPaymentIds = parseArrayField(lease.platform_to_host_payment_records_json);
      const { guestNative, hostNative } = await fetchLegacyNativePayments(guestPaymentIds, hostPaymentIds);

      // Calculate JS payment schedules
      const { guestSchedule, hostSchedule } = calculateJsPaymentSchedules(proposal, lease);

      setGuestPaymentSchedule({
        jsCalculated: guestSchedule,
        legacyNative: guestNative
      });

      setHostPaymentSchedule({
        jsCalculated: hostSchedule,
        legacyNative: hostNative
      });

    } catch (error) {
      console.error('[ZUnitPaymentRecordsJs] Failed to load lease details:', error);
      setLeasesError('Failed to load lease details');
    } finally {
      setSelectedLeaseLoading(false);
      setPaymentSchedulesLoading(false);
    }
  }, [leases, fetchProposalData, fetchLegacyNativePayments, calculateJsPaymentSchedules]);

  // Regenerate guest payment records via Edge Function
  const handleRegenerateGuestPayments = useCallback(async () => {
    if (!selectedLease || !proposalData) {
      setRegenerationError('No lease selected');
      return;
    }

    setRegeneratingGuest(true);
    setRegenerationError(null);
    setRegenerationSuccess(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guest-payment-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'generate',
          payload: {
            leaseId: selectedLease.id,
            proposalId: proposalData.id
          }
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to regenerate guest payments');
      }

      setRegenerationSuccess('Guest payment records regenerated successfully');

      // Refresh payment data
      await handleLeaseSelect(selectedLeaseId);

    } catch (error) {
      console.error('[ZUnitPaymentRecordsJs] Failed to regenerate guest payments:', error);
      setRegenerationError(error.message || 'Failed to regenerate guest payments');
    } finally {
      setRegeneratingGuest(false);
    }
  }, [selectedLease, proposalData, selectedLeaseId, handleLeaseSelect]);

  // Regenerate host payment records via Edge Function
  const handleRegenerateHostPayments = useCallback(async () => {
    if (!selectedLease || !proposalData) {
      setRegenerationError('No lease selected');
      return;
    }

    setRegeneratingHost(true);
    setRegenerationError(null);
    setRegenerationSuccess(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/host-payment-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'generate',
          payload: {
            leaseId: selectedLease.id,
            proposalId: proposalData.id
          }
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to regenerate host payments');
      }

      setRegenerationSuccess('Host payment records regenerated successfully');

      // Refresh payment data
      await handleLeaseSelect(selectedLeaseId);

    } catch (error) {
      console.error('[ZUnitPaymentRecordsJs] Failed to regenerate host payments:', error);
      setRegenerationError(error.message || 'Failed to regenerate host payments');
    } finally {
      setRegeneratingHost(false);
    }
  }, [selectedLease, proposalData, selectedLeaseId, handleLeaseSelect]);

  // Calendar navigation handlers
  const handleCalendarMonthNext = useCallback(() => {
    setCalendarMonth(prev => {
      if (prev === 11) {
        setCalendarYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleCalendarMonthPrev = useCallback(() => {
    setCalendarMonth(prev => {
      if (prev === 0) {
        setCalendarYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleCalendarYearChange = useCallback((year) => {
    setCalendarYear(parseInt(year));
  }, []);

  // Toggle view mode
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // Reset all state
  const handleReset = useCallback(() => {
    setSelectedLeaseId('');
    setSelectedLease(null);
    setProposalData(null);
    setGuestPaymentSchedule(INITIAL_GUEST_PAYMENT_SCHEDULE);
    setHostPaymentSchedule(INITIAL_HOST_PAYMENT_SCHEDULE);
    setCalendarYear(new Date().getFullYear());
    setCalendarMonth(new Date().getMonth());
    setRegenerationError(null);
    setRegenerationSuccess(null);
    setViewMode('jsCalculated');
  }, []);

  // Generate calendar days for display
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, isBooked: false, isPaymentDay: false });
    }

    // Days of the month
    const reservationStart = parseDateField(selectedLease?.reservation_start_date);
    const reservationEnd = parseDateField(selectedLease?.reservation_end_date);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarYear, calendarMonth, day);
      let isBooked = false;

      if (reservationStart && reservationEnd) {
        isBooked = date >= reservationStart && date <= reservationEnd;
      }

      days.push({ day, date, isBooked, isPaymentDay: false });
    }

    return days;
  }, [calendarYear, calendarMonth, selectedLease]);

  // Get active payment schedules based on view mode
  const activeGuestSchedule = viewMode === 'jsCalculated'
    ? guestPaymentSchedule.jsCalculated
    : guestPaymentSchedule.legacyNative;

  const activeHostSchedule = viewMode === 'jsCalculated'
    ? hostPaymentSchedule.jsCalculated
    : hostPaymentSchedule.legacyNative;

  return {
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
    guestPaymentSchedule,
    hostPaymentSchedule,
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
  };
}
