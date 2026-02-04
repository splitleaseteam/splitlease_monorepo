/**
 * Document Change Request Modal
 * Allows hosts and guests to submit change requests for draft documents
 *
 * Updated to follow POPUP_REPLICATION_PROTOCOL.md design system.
 * Features:
 * - Monochromatic purple color scheme (no green/yellow)
 * - Mobile bottom sheet behavior (< 480px)
 * - Feather icons (stroke-only)
 * - Pill-shaped buttons (100px radius)
 */

import { useEffect } from 'react';
import { useDocumentChangeRequestLogic } from './useDocumentChangeRequestLogic.js';
import './DocumentChangeRequestModal.css';

// FileText icon (Feather style)
function FileTextIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );
}

// Close icon (Feather style)
function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

export default function DocumentChangeRequestModal({
  isOpen,
  currentDocumentId,
  userId,
  userEmail,
  userName,
  userType,
  onClose,
  onSuccess,
}) {
  const {
    documents,
    selectedDocumentId,
    requestText,
    isLoading,
    isSubmitting,
    error,
    handleDocumentChange,
    handleRequestTextChange,
    handleSubmit,
    resetForm,
  } = useDocumentChangeRequestLogic({
    currentDocumentId,
    userId,
    userEmail,
    userName,
    userType,
    onSuccess,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const success = await handleSubmit();
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="doc-change-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-change-modal-title"
    >
      <div className="doc-change-modal" onClick={(e) => e.stopPropagation()}>
        {/* Mobile grab handle - visible only on mobile */}
        <div className="doc-change-modal-grab-handle" aria-hidden="true" />

        {/* Header */}
        <header className="doc-change-modal-header">
          <div className="doc-change-modal-header-content">
            <div className="doc-change-modal-header-top">
              <span className="doc-change-modal-icon" aria-hidden="true">
                <FileTextIcon />
              </span>
              <h2 id="doc-change-modal-title" className="doc-change-modal-title">
                Request Document Change
              </h2>
            </div>
            <p className="doc-change-modal-subtitle">
              Submit a request to modify a draft document. Your request will be reviewed by our team.
            </p>
          </div>
          <button
            className="doc-change-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <CloseIcon />
          </button>
        </header>

        {/* Body */}
        <form className="doc-change-modal-body" onSubmit={onSubmit}>
          {/* Error Banner */}
          {error && (
            <div className="doc-change-error-banner" role="alert">
              {error}
            </div>
          )}

          {/* Document Selection */}
          <div className="doc-change-form-group">
            <label className="doc-change-label" htmlFor="document-select">
              Select Document *
            </label>
            {isLoading ? (
              <div className="doc-change-loading">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="doc-change-empty">No draft documents available</div>
            ) : (
              <select
                id="document-select"
                className="doc-change-select"
                value={selectedDocumentId}
                onChange={(e) => handleDocumentChange(e.target.value)}
                required
              >
                <option value="">Choose a document...</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Change Request Text */}
          <div className="doc-change-form-group">
            <label className="doc-change-label" htmlFor="request-text">
              Change Request *
            </label>
            <textarea
              id="request-text"
              className="doc-change-textarea"
              value={requestText}
              onChange={(e) => handleRequestTextChange(e.target.value)}
              placeholder="Describe the changes you'd like to see in this document..."
              rows={8}
              required
            />
            <div className="doc-change-char-count">
              {requestText.length} characters
            </div>
          </div>
        </form>

        {/* Footer */}
        <footer className="doc-change-modal-footer">
          <button
            type="button"
            className="doc-change-btn doc-change-btn--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="doc-change-btn doc-change-btn--primary"
            onClick={onSubmit}
            disabled={isSubmitting || !selectedDocumentId || !requestText.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="doc-change-spinner" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
