/**
 * ThreadHeader Component
 *
 * Header above messages with contact info, status, and action icons.
 * Shows avatar, name, online status, and action buttons.
 * - Virtual Meeting button with state-aware display
 * - Right panel toggle
 * On mobile, shows a back button to return to the thread list.
 */

import { getVirtualMeetingState, getVMButtonText, getVMStateInfo, VM_STATES } from '../../../../logic/rules/proposals/virtualMeetingRules.js';

export default function ThreadHeader({
  info,
  proposalData,
  user,
  onBack,
  isMobile,
  showRightPanel,
  isRightPanelCollapsed,
  onToggleRightPanel,
  onAction
}) {
  if (!info) return null;

  // Get virtual meeting state if proposal data exists
  const vmStateInfo = proposalData?.virtualMeeting && user?.bubbleId
    ? getVMStateInfo(proposalData.virtualMeeting, user.bubbleId)
    : null;

  const vmState = vmStateInfo?.state;
  const hasVirtualMeeting = vmState !== VM_STATES.NO_MEETING && vmState !== undefined;

  // Determine button class based on VM state
  const getVMButtonClass = () => {
    if (!vmStateInfo) return 'thread-header__vm-btn';

    switch (vmStateInfo.buttonStyle) {
      case 'success':
        return 'thread-header__vm-btn thread-header__vm-btn--confirmed';
      case 'disabled':
        return 'thread-header__vm-btn thread-header__vm-btn--disabled';
      case 'warning':
      case 'expired':
        return 'thread-header__vm-btn thread-header__vm-btn--warning';
      default:
        return 'thread-header__vm-btn';
    }
  };

  const handleVMClick = () => {
    if (onAction) {
      onAction('virtual_meeting', { vmState, proposalData });
    }
  };

  return (
    <div className="thread-header">
      {/* Back Button (Mobile only) */}
      {isMobile && onBack && (
        <button
          className="thread-header__back"
          onClick={onBack}
          aria-label="Back to messages"
        >
          <svg viewBox="0 0 24 24">
            <path d="M15 18L9 12L15 6" />
          </svg>
        </button>
      )}

      {/* Left Section: Avatar + Info */}
      <div className="thread-header__left">
        {/* Avatar */}
        <img
          src={info.contact_avatar || '/assets/images/default-avatar.jpg'}
          alt={info.contact_name || 'Contact'}
          className="thread-header__avatar"
          onError={(e) => {
            e.target.src = '/assets/images/default-avatar.jpg';
          }}
        />

        {/* Info */}
        <div className="thread-header__info">
          <div className="thread-header__name-row">
            <h3 className="thread-header__name">
              {info.contact_name || 'Unknown Contact'}
            </h3>
            {info.contact_type && (
              <span className={`thread-header__badge thread-header__badge--${info.contact_type.toLowerCase()}`}>
                {info.contact_type}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Icons */}
      <div className="thread-header__actions">
        {/* Virtual Meeting Button - State aware */}
        <button
          className={getVMButtonClass()}
          onClick={handleVMClick}
          disabled={vmStateInfo?.buttonDisabled}
          aria-label={vmStateInfo?.buttonText || 'Request Virtual Meeting'}
          title={vmStateInfo?.buttonText || 'Request Virtual Meeting'}
        >
          {/* Video Icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="14" height="14" rx="2" />
            <path d="M16 9.5l4-2.5v10l-4-2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{vmStateInfo?.buttonText || 'Request Meeting'}</span>
        </button>

        {/* Toggle Right Panel - Only on desktop */}
        {showRightPanel && (
          <button
            className={`thread-header__action-btn ${isRightPanelCollapsed ? '' : 'thread-header__action-btn--active'}`}
            onClick={onToggleRightPanel}
            aria-label={isRightPanelCollapsed ? 'Show details panel' : 'Hide details panel'}
            title={isRightPanelCollapsed ? 'Show details' : 'Hide details'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
