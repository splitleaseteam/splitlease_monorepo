/**
 * Proposal Actions Component
 *
 * Renders the action buttons row for a proposal card:
 * - VM status text labels
 * - Primary action button (Guest Action 1)
 * - VM action button
 * - Secondary action button (Guest Action 2)
 * - Edit button
 * - Cancel/Delete button
 *
 * Also manages action-specific modals:
 * - GuestEditingProposalModal, EndProposalModal,
 *   NotInterestedModal, VirtualMeetingManager
 */

import { useState } from 'react';
import { goToRentalApplication } from '../../../../lib/navigation.js';
import { executeDeleteProposal } from '../../../../logic/workflows/proposals/cancelProposalWorkflow.js';
import { canConfirmSuggestedProposal, getNextStatusAfterConfirmation } from '../../../../logic/rules/proposals/proposalRules.js';
import { dismissProposal } from '../../../shared/SuggestedProposals/suggestedProposalService.js';
import { showToast } from '../../../shared/Toast.jsx';
import { supabase } from '../../../../lib/supabase.js';
import GuestEditingProposalModal from '../../../modals/GuestEditingProposalModal.jsx';
import EndProposalModal from '../../../modals/EndProposalModal.jsx';
import NotInterestedModal from '../../../shared/SuggestedProposals/components/NotInterestedModal.jsx';
import VirtualMeetingManager from '../../../shared/VirtualMeetingManager/VirtualMeetingManager.jsx';

export default function ProposalActions({
  proposal,
  listing,
  buttonConfig,
  vmConfig,
  isTerminal,
  isCompleted,
  nightlyPrice,
  totalPrice,
  nightsPerWeek,
  currentUserId,
  onProposalDeleted
}) {
  // Proposal details modal state (GuestEditingProposalModal)
  const [showProposalDetailsModal, setShowProposalDetailsModal] = useState(false);
  // Initial view for the proposal details modal ('pristine' | 'editing' | 'general' | 'cancel')
  const [proposalDetailsModalInitialView, setProposalDetailsModalInitialView] = useState('pristine');
  // Virtual Meeting Manager modal state
  const [showVMModal, setShowVMModal] = useState(false);
  const [vmInitialView, setVmInitialView] = useState('');
  // Cancel proposal modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  // Not Interested modal state (for SL-suggested proposals)
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [isNotInterestedProcessing, setIsNotInterestedProcessing] = useState(false);
  // Delete proposal loading state
  const [isDeleting, setIsDeleting] = useState(false);
  // Confirm proposal loading state (for SL-suggested proposals)
  const [isConfirming, setIsConfirming] = useState(false);

  // Construct current user object for VirtualMeetingManager
  const currentUser = {
    id: currentUserId,
    typeUserSignup: 'guest'
  };

  // Handler for opening cancel proposal modal
  const openCancelModal = () => {
    setShowCancelModal(true);
  };

  // Handler for closing cancel proposal modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
  };

  // Handler for confirming proposal cancellation
  const handleCancelConfirm = async (reason) => {
    console.log('[ProposalCard] Cancel confirmed with reason:', reason);
    // TODO: Implement actual cancel API call here
    closeCancelModal();
  };

  // Handler for opening Not Interested modal
  const openNotInterestedModal = () => {
    setShowNotInterestedModal(true);
  };

  // Handler for closing Not Interested modal
  const closeNotInterestedModal = () => {
    if (!isNotInterestedProcessing) {
      setShowNotInterestedModal(false);
    }
  };

  // Handler for confirming Not Interested (marks proposal as deleted with optional feedback)
  const handleNotInterestedConfirm = async (feedback) => {
    if (!proposal?.id || isNotInterestedProcessing) return;

    setIsNotInterestedProcessing(true);
    try {
      await dismissProposal(proposal.id, feedback);
      console.log('[ProposalCard] Proposal marked as not interested');
      showToast({ title: 'Proposal dismissed', type: 'info' });

      // Close modal first
      setShowNotInterestedModal(false);

      // Update UI state without page reload
      if (onProposalDeleted) {
        onProposalDeleted(proposal.id);
      }
    } catch (error) {
      console.error('[ProposalCard] Error dismissing proposal:', error);
      showToast({ title: 'Failed to dismiss proposal', content: error.message, type: 'error' });
    } finally {
      setIsNotInterestedProcessing(false);
    }
  };

  // Handler for confirm proposal (SL-suggested proposals)
  const handleConfirmProposal = async () => {
    if (!proposal?.id || isConfirming) return;

    if (!canConfirmSuggestedProposal(proposal)) {
      showToast({ title: 'Cannot confirm this proposal', type: 'error' });
      return;
    }

    setIsConfirming(true);
    try {
      const nextStatus = getNextStatusAfterConfirmation(proposal);

      const { error } = await supabase
        .from('booking_proposal')
        .update({
          proposal_workflow_status: nextStatus,
          'Modified Date': new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (error) {
        console.error('[ProposalCard] Error confirming proposal:', error);
        throw new Error(error.message || 'Failed to confirm proposal');
      }

      console.log('[ProposalCard] Proposal confirmed, new status:', nextStatus);
      showToast({ title: 'Proposal confirmed!', type: 'success' });

      // Reload page to show updated status and CTAs
      window.location.reload();
    } catch (error) {
      console.error('[ProposalCard] Error confirming proposal:', error);
      showToast({ title: 'Failed to confirm proposal', content: error.message, type: 'error' });
      setIsConfirming(false);
    }
  };

  // Handler for delete proposal (soft-delete for already-cancelled proposals)
  const handleDeleteProposal = async () => {
    if (!proposal?.id || isDeleting) return;

    setIsDeleting(true);
    try {
      await executeDeleteProposal(proposal.id);
      console.log('[ProposalCard] Proposal deleted successfully');
      // Show toast notification (info type for neutral confirmation)
      showToast({ title: 'Proposal deleted', type: 'info' });

      // Update UI state without page reload
      if (onProposalDeleted) {
        onProposalDeleted(proposal.id);
      }
    } catch (error) {
      console.error('[ProposalCard] Error deleting proposal:', error);
      showToast({ title: 'Failed to delete proposal', content: error.message, type: 'error' });
      setIsDeleting(false);
    }
  };

  // Handler for VM button click
  const handleVMButtonClick = () => {
    if (vmConfig.view && !vmConfig.disabled) {
      setVmInitialView(vmConfig.view);
      setShowVMModal(true);
    }
  };

  // Handler for VM modal close
  const handleVMModalClose = () => {
    setShowVMModal(false);
    setVmInitialView('');
  };

  // Handler for successful VM action
  const handleVMSuccess = () => {
    // Reload page to get fresh VM data
    window.location.reload();
  };

  return (
    <>
      {/* Actions Row */}
      <div className="actions-row">
        {/* VM status as text label (for waiting/requested states) */}
        {vmConfig.visible && vmConfig.disabled && (
          <span className={`btn-vm-text ${vmConfig.className === 'btn-vm-requested' ? 'waiting' : ''}`}>
            {vmConfig.label}
          </span>
        )}

        {/* Primary action button (Guest Action 1) */}
        {buttonConfig?.guestAction1?.visible && (
          buttonConfig.guestAction1.action === 'go_to_leases' ? (
            <a href="/my-leases" className="btn btn-primary">
              {buttonConfig.guestAction1.label}
            </a>
          ) : (
            <button
              className={`btn ${
                buttonConfig.guestAction1.action === 'delete_proposal' ? 'btn-danger' :
                'btn-primary'
              }`}
              disabled={buttonConfig.guestAction1.action === 'confirm_proposal' && isConfirming}
              onClick={() => {
                if (buttonConfig.guestAction1.action === 'modify_proposal') {
                  setProposalDetailsModalInitialView('pristine');
                  setShowProposalDetailsModal(true);
                } else if (buttonConfig.guestAction1.action === 'submit_rental_app') {
                  goToRentalApplication(proposal.id);
                } else if (buttonConfig.guestAction1.action === 'delete_proposal') {
                  handleDeleteProposal();
                } else if (buttonConfig.guestAction1.action === 'confirm_proposal') {
                  handleConfirmProposal();
                }
              }}
            >
              {buttonConfig.guestAction1.label}
            </button>
          )
        )}

        {/* VM action button (only when actionable, not disabled) */}
        {vmConfig.visible && !vmConfig.disabled && (
          <button
            className="btn btn-outline"
            onClick={handleVMButtonClick}
          >
            {vmConfig.view === 'request' ? 'Schedule Meeting' : vmConfig.label}
          </button>
        )}

        {/* Guest Action 2 (secondary action) */}
        {buttonConfig?.guestAction2?.visible && (
          <button
            className={`btn ${buttonConfig.guestAction2.action === 'reject_suggestion' ? 'btn-not-interested' : 'btn-outline'}`}
            onClick={() => {
              if (buttonConfig.guestAction2.action === 'see_details') {
                setProposalDetailsModalInitialView('pristine');
                setShowProposalDetailsModal(true);
              } else if (buttonConfig.guestAction2.action === 'submit_rental_app') {
                goToRentalApplication(proposal.id);
              } else if (buttonConfig.guestAction2.action === 'reject_suggestion') {
                openNotInterestedModal();
              }
            }}
          >
            {buttonConfig.guestAction2.label}
          </button>
        )}

        {/* Edit button (always show if not terminal/completed) */}
        {!isTerminal && !isCompleted && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setProposalDetailsModalInitialView('pristine');
              setShowProposalDetailsModal(true);
            }}
          >
            Edit
          </button>
        )}

        {/* Cancel/Delete button */}
        {buttonConfig?.cancelButton?.visible && (
          <button
            className={`btn ${
              buttonConfig.cancelButton.action === 'delete_proposal' ? 'btn-danger' :
              buttonConfig.cancelButton.action === 'see_house_manual' ? 'btn-ghost' :
              'btn-danger'
            }`}
            disabled={buttonConfig.cancelButton.disabled}
            onClick={() => {
              if (buttonConfig.cancelButton.action === 'delete_proposal') {
                handleDeleteProposal();
              } else if (
                buttonConfig.cancelButton.action === 'cancel_proposal' ||
                buttonConfig.cancelButton.action === 'reject_counteroffer' ||
                buttonConfig.cancelButton.action === 'reject_proposal'
              ) {
                openCancelModal();
              }
            }}
          >
            {buttonConfig.cancelButton.label}
          </button>
        )}

        {/* Fallback cancel button if no buttonConfig */}
        {!buttonConfig && !isTerminal && !isCompleted && (
          <button className="btn btn-danger" onClick={openCancelModal}>
            Cancel
          </button>
        )}
      </div>

      {/* Proposal Details Modal (GuestEditingProposalModal) */}
      {showProposalDetailsModal && (
        <GuestEditingProposalModal
          proposal={proposal}
          listing={listing}
          user={{ type: 'guest' }}
          initialView={proposalDetailsModalInitialView}
          isVisible={showProposalDetailsModal}
          onClose={() => {
            setShowProposalDetailsModal(false);
            setProposalDetailsModalInitialView('pristine'); // Reset for next open
          }}
          onProposalCancel={(reason) => {
            // Handle cancellation - reload page to show updated status
            console.log('Proposal cancelled with reason:', reason);
            setShowProposalDetailsModal(false);
            setProposalDetailsModalInitialView('pristine');
            window.location.reload();
          }}
          pricePerNight={nightlyPrice}
          totalPriceForReservation={totalPrice}
          priceRentPer4Weeks={proposal['Price Rent per 4 weeks'] || (nightlyPrice * nightsPerWeek * 4)}
        />
      )}

      {/* Cancel Proposal Modal */}
      <EndProposalModal
        isOpen={showCancelModal}
        proposal={proposal}
        buttonText="Cancel Proposal"
        onClose={closeCancelModal}
        onConfirm={handleCancelConfirm}
      />

      {/* Not Interested Modal (for SL-suggested proposals) */}
      <NotInterestedModal
        isOpen={showNotInterestedModal}
        proposal={proposal}
        onClose={closeNotInterestedModal}
        onConfirm={handleNotInterestedConfirm}
        isProcessing={isNotInterestedProcessing}
      />

      {/* Virtual Meeting Manager Modal */}
      {showVMModal && (
        <VirtualMeetingManager
          proposal={proposal}
          initialView={vmInitialView}
          currentUser={currentUser}
          onClose={handleVMModalClose}
          onSuccess={handleVMSuccess}
        />
      )}
    </>
  );
}
