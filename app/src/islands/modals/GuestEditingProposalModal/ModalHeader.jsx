/**
 * ModalHeader - Header section for GuestEditingProposalModal
 *
 * Renders pristine header (icon + title) or editing/general header (back button + title)
 */

import { X, ChevronLeft, FileText } from 'lucide-react'

export default function ModalHeader({
  view,
  listing,
  proposal,
  onBack,
  onClose
}) {
  return (
    <div className="gep-header">
      {view === 'pristine' ? (
        /* Pristine header: icon + title/subtitle on left, close on right */
        <>
          <div className="gep-header-left">
            <div className="gep-header-icon" aria-hidden="true">
              <FileText size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 id="gep-modal-title" className="gep-header-title-text">Proposal Details</h2>
              <p className="gep-header-subtitle">{listing?.title || listing?.Title || proposal?._listing?.title || 'Listing'}</p>
            </div>
          </div>
          <button
            type="button"
            className="gep-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </>
      ) : (
        /* Editing/General header: left-aligned with back button, consistent with pristine */
        <>
          <div className="gep-header-left">
            <button
              type="button"
              className="gep-header-back-btn"
              onClick={onBack}
              aria-label="Go back to previous view"
            >
              <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
            </button>
            <div>
              <h2 id="gep-modal-title" className="gep-header-title-text">Edit Proposal</h2>
              <p className="gep-header-subtitle">{listing?.title || listing?.Title || proposal?._listing?.title || 'Listing'}</p>
            </div>
          </div>
          <button
            type="button"
            className="gep-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </>
      )}
    </div>
  )
}
