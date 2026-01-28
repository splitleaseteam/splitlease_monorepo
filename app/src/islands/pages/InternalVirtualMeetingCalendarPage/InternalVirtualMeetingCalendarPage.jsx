/**
 * Internal Virtual Meeting Calendar Page - HOLLOW COMPONENT PATTERN
 * Split Lease - Calendar Automation Dashboard
 *
 * Admin-only dashboard for managing Google Calendar automation for virtual meetings.
 *
 * Architecture:
 * - NO business logic in this file
 * - ALL state and handlers come from useInternalVirtualMeetingCalendarPageLogic hook
 * - ONLY renders UI based on pre-calculated state
 */

import { useInternalVirtualMeetingCalendarPageLogic } from './useInternalVirtualMeetingCalendarPageLogic.js';
import MeetingList from './components/MeetingList.jsx';
import StatusDisplay from './components/StatusDisplay.jsx';
import './InternalVirtualMeetingCalendarPage.css';
import AdminHeader from '../../shared/AdminHeader/AdminHeader';

export default function InternalVirtualMeetingCalendarPage() {
  // ============================================================================
  // LOGIC HOOK - Provides all state and handlers
  // ============================================================================

  const {
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
  } = useInternalVirtualMeetingCalendarPageLogic();

  // ============================================================================
  // RENDER - Loading State
  // ============================================================================

  if (loading) {
    return (
      <div className="internal-virtual-meeting-calendar-page">
        <AdminHeader />
        <main className="calendar-automation-main">
          <div className="calendar-automation-container">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading virtual meetings...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // RENDER - Error State
  // ============================================================================

  if (error) {
    return (
      <div className="internal-virtual-meeting-calendar-page">
        <AdminHeader />
        <main className="calendar-automation-main">
          <div className="calendar-automation-container">
            <div className="error-state">
              <div className="error-icon">&#9888;</div>
              <h2>Unable to Load Virtual Meetings</h2>
              <p className="error-message">{error}</p>
              <button onClick={handleRefresh} className="btn btn--primary">
                Reload Page
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // RENDER - Main Page
  // ============================================================================

  return (
    <div className="internal-virtual-meeting-calendar-page">
      <AdminHeader />

      <main className="calendar-automation-main">
        <div className="calendar-automation-container">
          {/* Header */}
          <div className="calendar-automation-header">
            <h1>Virtual Meeting Calendar Automation</h1>
            <p className="subtitle">Manage Google Calendar invites for confirmed virtual meetings</p>
          </div>

          {/* Alert */}
          {alertMessage && (
            <div className={`alert alert--${alertType}`}>
              <span className="alert-message">{alertMessage}</span>
              <button onClick={clearAlert} className="alert-close">&times;</button>
            </div>
          )}

          {/* Status Display */}
          <StatusDisplay
            meetings={meetings}
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />

          {/* Meeting List */}
          <MeetingList
            meetings={meetings}
            selectedMeeting={selectedMeeting}
            statusFilter={statusFilter}
            processing={processing}
            onSelectMeeting={handleSelectMeeting}
            onProcessMeeting={handleProcessMeeting}
            onRefresh={handleRefresh}
          />
        </div>
      </main>
    </div>
  );
}
