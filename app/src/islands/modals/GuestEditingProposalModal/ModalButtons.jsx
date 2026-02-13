/**
 * ModalButtons - Footer button section for GuestEditingProposalModal
 *
 * Renders different button pairs based on view state:
 * - pristine: Close + Edit Proposal
 * - editing: Cancel edits + Display New Terms
 * - general: Close + Submit Proposal Edits
 */

export default function ModalButtons({
  view,
  isAcceptedOrDrafting,
  onClose,
  onStartEditing,
  onCancelEdits,
  onDisplayNewTerms,
  onSubmitProposalEdits
}) {
  return (
    <div className="gep-buttons">
      {view === 'pristine' ? (
        /* Pristine state: User just opened modal, hasn't edited anything */
        /* Close first, Edit Proposal second - side by side */
        /* Hide "Edit Proposal" button if proposal is accepted or drafting */
        <>
          <button
            type="button"
            className="gep-button gep-button--secondary"
            onClick={onClose}
          >
            Close
          </button>
          {!isAcceptedOrDrafting && (
            <button
              type="button"
              className="gep-button gep-button--primary"
              onClick={onStartEditing}
            >
              Edit Proposal
            </button>
          )}
        </>
      ) : view === 'editing' ? (
        /* Editing state: User is actively changing fields */
        <>
          <button
            type="button"
            className="gep-button gep-button--secondary"
            onClick={onCancelEdits}
          >
            Cancel edits
          </button>
          <button
            type="button"
            className="gep-button gep-button--primary"
            onClick={onDisplayNewTerms}
          >
            Display New Terms
          </button>
        </>
      ) : (
        /* General state: User has reviewed new terms, ready to submit */
        <>
          <button
            type="button"
            className="gep-button gep-button--secondary"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="gep-button gep-button--primary"
            onClick={onSubmitProposalEdits}
          >
            Submit Proposal Edits
          </button>
        </>
      )}
    </div>
  )
}
