/**
 * Internal Virtual Meeting Calendar Page Logic Hook
 * Split Lease - Calendar Automation Dashboard
 *
 * All business logic for the internal virtual meeting calendar page.
 * Follows four-layer logic architecture where applicable.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase.js';

// ============================================================================
// HOOK - Business Logic
// ============================================================================

export function useInternalVirtualMeetingCalendarPageLogic() {
  // ================================================
  // STATE
  // ================================================

  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('success');
  const [statusFilter, setStatusFilter] = useState('all');

  // ================================================
  // DATA FETCHING
  // ================================================

  /**
   * Fetch meetings needing calendar invites
   */
  const fetchMeetings = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('virtualmeetingschedulesandlinks')
        .select('*')
        .eq('confirmedBySplitLease', true)
        .in('calendar_status', ['pending', 'meet_link_created', 'failed'])
        .order('booked_date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setMeetings(data || []);
    } catch (err) {
      console.error('[InternalVirtualMeetingCalendarPage] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================================================
  // ACTION HANDLERS
  // ================================================

  /**
   * Handle meeting selection
   */
  const handleSelectMeeting = (meeting) => {
    setSelectedMeeting(meeting);
  };

  /**
   * Handle process calendar invites for selected meeting
   */
  const handleProcessMeeting = async (meetingId) => {
    setProcessing(true);
    setAlertMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-automation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'process_virtual_meeting',
            payload: { virtualMeetingId: meetingId },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process calendar invites');
      }

      // Show success message
      setAlertType('success');
      setAlertMessage(`Calendar invites created successfully! Meet link: ${result.data.meetLink}`);

      // Refresh meetings list
      await fetchMeetings();

      // Clear selection
      setSelectedMeeting(null);
    } catch (err) {
      console.error('[InternalVirtualMeetingCalendarPage] Process error:', err);
      setAlertType('error');
      setAlertMessage(err.message || 'Failed to process calendar invites');
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    fetchMeetings();
  };

  /**
   * Clear alert
   */
  const clearAlert = () => {
    setAlertMessage(null);
  };

  // ================================================
  // EFFECTS
  // ================================================

  useEffect(() => {
    fetchMeetings();
  }, []);

  // ================================================
  // RETURN API
  // ================================================

  return {
    // Core data
    meetings,
    selectedMeeting,

    // UI State
    loading,
    error,
    processing,
    alertMessage,
    alertType,

    // Filter state
    statusFilter,
    setStatusFilter,

    // Action handlers
    handleSelectMeeting,
    handleProcessMeeting,
    handleRefresh,
    clearAlert,
  };
}
