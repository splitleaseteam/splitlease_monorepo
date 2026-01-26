/**
 * IdentityVerification Modal Component
 *
 * A modal for users to submit identity verification documents.
 * Follows the Hollow Component Pattern - delegates ALL logic to useIdentityVerificationLogic hook.
 *
 * Features:
 * - Upload selfie, front ID, and back ID
 * - Document type selection
 * - Image preview before submission
 * - File validation (type and size)
 * - ESC key and backdrop click to close
 * - Mobile bottom sheet behavior
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Close handler callback
 * @param {Function} props.onSubmit - Submit handler callback (receives verification data)
 * @param {string} props.userId - User ID for the verification
 * @param {Function} [props.onAlertTriggered] - Optional callback for toast notifications
 */

import { forwardRef, useImperativeHandle } from 'react';
import { useIdentityVerificationLogic } from './useIdentityVerificationLogic.js';
import FileUploadField from './FileUploadField.jsx';
import DocumentTypeSelect from './DocumentTypeSelect.jsx';
import './IdentityVerification.css';

// Icons as inline SVG (following ConfirmDeleteModal pattern)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 12 15 16 10" />
  </svg>
);

const IdentityVerification = forwardRef(({
  isOpen: controlledIsOpen,
  onClose,
  onSubmit,
  userId,
  onAlertTriggered,
  initialDocumentType = "Driver's License / State ID",
}, ref) => {
  const {
    isOpen,
    isSubmitting,
    documentType,
    selfieInfo,
    frontIdInfo,
    backIdInfo,
    handleDocumentTypeChange,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
    handleClose,
    resetForm,
  } = useIdentityVerificationLogic({
    controlledIsOpen,
    initialDocumentType,
    userId,
    onSubmit,
    onClose,
    onAlertTriggered,
  });

  // Expose methods via ref for programmatic control
  useImperativeHandle(ref, () => ({
    resetForm,
  }));

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <div
      className="identity-verification-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="identity-verification-title"
    >
      {/* Modal container - stop propagation to prevent closing when clicking inside */}
      <div
        className="identity-verification-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="identity-verification-grab-handle" aria-hidden="true" />

        {/* Header Section */}
        <header className="identity-verification-header">
          <div className="identity-verification-header-content">
            <span className="identity-verification-icon" aria-hidden="true">
              <ShieldCheckIcon />
            </span>
            <div className="identity-verification-header-text">
              <h2 id="identity-verification-title" className="identity-verification-title">
                Identity Verification
              </h2>
              <p className="identity-verification-description">
                Please submit front and back photos of your State ID, along with a selfie clearly showing your face
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="identity-verification-close-btn"
            aria-label="Close modal"
            type="button"
          >
            <XIcon />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="identity-verification-body">
          {/* Document Type Selection */}
          <DocumentTypeSelect
            value={documentType}
            onChange={handleDocumentTypeChange}
          />

          {/* Selfie Upload */}
          <FileUploadField
            label="Selfie"
            required
            fileInfo={selfieInfo}
            onChange={(e) => handleFileChange(e, 'selfie')}
            onRemove={() => handleRemoveFile('selfie')}
            helpText="Press 'allow' on your browser to capture your selfie. Taking a selfie helps ensure user authenticity."
            accept="image/*"
            capture="user"
          />

          {/* Front ID Upload */}
          <FileUploadField
            label="Front ID"
            required
            fileInfo={frontIdInfo}
            onChange={(e) => handleFileChange(e, 'frontId')}
            onRemove={() => handleRemoveFile('frontId')}
            accept="image/*"
          />

          {/* Back ID Upload */}
          <FileUploadField
            label="Back ID"
            required
            fileInfo={backIdInfo}
            onChange={(e) => handleFileChange(e, 'backId')}
            onRemove={() => handleRemoveFile('backId')}
            accept="image/*"
          />
        </div>

        {/* Footer with Action Buttons */}
        <footer className="identity-verification-footer">
          <button
            type="button"
            className="identity-verification-btn identity-verification-btn--secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Close
          </button>
          <button
            type="button"
            className="identity-verification-btn identity-verification-btn--primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="identity-verification-spinner" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </footer>
      </div>
    </div>
  );
});

IdentityVerification.displayName = 'IdentityVerification';

export default IdentityVerification;
