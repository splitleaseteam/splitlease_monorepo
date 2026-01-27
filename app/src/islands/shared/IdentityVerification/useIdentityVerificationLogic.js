/**
 * useIdentityVerificationLogic
 *
 * Custom hook containing ALL business logic for the IdentityVerification modal.
 * Follows the Hollow Component Pattern.
 *
 * Responsibilities:
 * - Manage modal open/close state
 * - Handle file selection and validation
 * - Manage file previews
 * - Handle form submission
 * - Trigger alerts/toasts
 */

import { useState, useEffect, useCallback } from 'react';
import { formatFileSize, validateVerificationFile } from '../../../logic/processors/user/formatVerificationData.js';

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useIdentityVerificationLogic({
  controlledIsOpen,
  initialDocumentType,
  userId,
  onSubmit,
  onClose,
  onAlertTriggered,
}) {
  // ─────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────

  const [isOpen, setIsOpen] = useState(controlledIsOpen ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState(initialDocumentType);

  // File upload states
  const [selfieInfo, setSelfieInfo] = useState(createEmptyFileInfo());
  const [frontIdInfo, setFrontIdInfo] = useState(createEmptyFileInfo());
  const [backIdInfo, setBackIdInfo] = useState(createEmptyFileInfo());

  // ─────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────

  // Sync controlled isOpen prop
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting]);

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

  // ─────────────────────────────────────────────────────────
  // Callbacks
  // ─────────────────────────────────────────────────────────

  /**
   * Trigger an alert/toast notification
   */
  const triggerAlert = useCallback((config) => {
    if (onAlertTriggered) {
      onAlertTriggered(config);
    }
  }, [onAlertTriggered]);

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback((event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateVerificationFile(file);
    if (!validation.valid) {
      triggerAlert({
        title: 'Invalid File',
        content: validation.error,
        type: 'error',
      });
      // Clear the input
      event.target.value = '';
      return;
    }

    // Read file for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const fileInfo = {
        file,
        preview: reader.result,
        size: formatFileSize(file.size),
      };

      switch (type) {
        case 'selfie':
          setSelfieInfo(fileInfo);
          break;
        case 'frontId':
          setFrontIdInfo(fileInfo);
          break;
        case 'backId':
          setBackIdInfo(fileInfo);
          break;
      }
    };
    reader.readAsDataURL(file);
  }, [triggerAlert]);

  /**
   * Handle removing a file
   */
  const handleRemoveFile = useCallback((type) => {
    const emptyInfo = createEmptyFileInfo();

    switch (type) {
      case 'selfie':
        setSelfieInfo(emptyInfo);
        break;
      case 'frontId':
        setFrontIdInfo(emptyInfo);
        break;
      case 'backId':
        setBackIdInfo(emptyInfo);
        break;
    }
  }, []);

  /**
   * Handle document type change
   */
  const handleDocumentTypeChange = useCallback((newType) => {
    setDocumentType(newType);
  }, []);

  /**
   * Validate form before submission
   */
  const validateForm = useCallback(() => {
    if (!documentType) {
      triggerAlert({
        title: 'Document Type Required',
        content: 'Please select a document type',
        type: 'error',
      });
      return false;
    }

    if (!selfieInfo.file) {
      triggerAlert({
        title: 'Selfie Required',
        content: 'Please upload a selfie showing your face clearly',
        type: 'error',
      });
      return false;
    }

    if (!frontIdInfo.file) {
      triggerAlert({
        title: 'Front ID Required',
        content: 'Please upload the front of your ID document',
        type: 'error',
      });
      return false;
    }

    if (!backIdInfo.file) {
      triggerAlert({
        title: 'Back ID Required',
        content: 'Please upload the back of your ID document',
        type: 'error',
      });
      return false;
    }

    return true;
  }, [documentType, selfieInfo, frontIdInfo, backIdInfo, triggerAlert]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call onSubmit with the verification data
      if (onSubmit) {
        await onSubmit({
          documentType,
          selfieFile: selfieInfo.file,
          frontIdFile: frontIdInfo.file,
          backIdFile: backIdInfo.file,
          userId,
        });
      }

      // Show success message
      triggerAlert({
        title: 'Verification Submitted',
        content: 'Your identity documents have been submitted successfully. You will receive a confirmation email shortly.',
        type: 'success',
        duration: 5000,
      });

      // Close modal
      handleClose();
    } catch (error) {
      console.error('Identity verification submission error:', error);
      triggerAlert({
        title: 'Submission Failed',
        content: error.message || 'An error occurred while submitting your documents',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [documentType, selfieInfo, frontIdInfo, backIdInfo, userId, validateForm, onSubmit, triggerAlert]);

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Don't close while submitting

    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  /**
   * Reset the form to initial state
   */
  const resetForm = useCallback(() => {
    setDocumentType(initialDocumentType);
    setSelfieInfo(createEmptyFileInfo());
    setFrontIdInfo(createEmptyFileInfo());
    setBackIdInfo(createEmptyFileInfo());
  }, [initialDocumentType]);

  // ─────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────

  return {
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
  };
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Create empty file info object
 */
function createEmptyFileInfo() {
  return {
    file: null,
    preview: null,
    size: '',
  };
}
