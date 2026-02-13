/**
 * Custom hook for AI Signup Market Report logic
 * Contains all state management, handlers, and effects
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../Toast.jsx';
import {
  extractEmail,
  extractPhone,
  extractName,
  autoCorrectEmail,
  checkEmailCertainty,
} from './marketReportUtils.js';
import { submitSignup } from './marketReportApi.js';

export function useMarketReportLogic({ isOpen, onClose }) {
  // Toast notifications (with fallback rendering when no ToastProvider)
  const { toasts, showToast, removeToast } = useToast();

  const [state, setState] = useState({
    currentSection: 'freeform',
    formData: {},
    emailCertainty: null,
    isLoading: false,
    error: null,
    emailAlreadyExists: false,
    existingEmail: null,
    isAsyncProcessing: false,
  });

  // Ref to track toast timeout for cleanup
  const robotsToastTimeoutRef = useRef(null);

  const goToSection = useCallback((section) => {
    setState(prev => ({ ...prev, currentSection: section }));
  }, []);

  const updateFormData = useCallback((data) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data },
    }));
  }, []);

  const setError = useCallback((error) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setLoading = useCallback((isLoading) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setEmailCertainty = useCallback((certainty) => {
    setState(prev => ({ ...prev, emailCertainty: certainty }));
  }, []);

  const handleNext = useCallback(async () => {
    const { formData } = state;

    if (state.currentSection === 'freeform') {
      goToSection('parsing');

      await new Promise(resolve => setTimeout(resolve, 1500));

      const extractedEmail = extractEmail(formData.marketResearchText || '');
      const extractedPhone = extractPhone(formData.marketResearchText || '');
      const correctedEmail = extractedEmail ? autoCorrectEmail(extractedEmail) : '';
      const emailCertainty = correctedEmail ? checkEmailCertainty(correctedEmail) : 'uncertain';

      // Extract name from text (for user account creation)
      const extractedNameFromText = extractName(formData.marketResearchText || '', correctedEmail);

      const emailWasCorrected = extractedEmail !== correctedEmail;
      const phoneIsComplete = extractedPhone ? /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(extractedPhone) : false;

      const updatedFormData = {
        ...formData,
        email: correctedEmail || formData.email || '',
        phone: extractedPhone || formData.phone || '',
        name: extractedNameFromText || formData.name || '', // Store extracted name
      };

      const shouldAutoSubmit =
        correctedEmail &&
        extractedPhone &&
        emailCertainty === 'certain' &&
        !emailWasCorrected &&
        phoneIsComplete;

      if (shouldAutoSubmit) {
        setEmailCertainty('yes');

        // Show initial toast
        showToast({
          title: 'Thank you!',
          content: 'Creating your account...',
          type: 'info',
          duration: 3000
        });

        // Show second toast after a delay
        robotsToastTimeoutRef.current = setTimeout(() => {
          showToast({
            title: 'Almost there!',
            content: 'Our robots are still working...',
            type: 'info',
            duration: 3000
          });
        }, 1500);

        try {
          const result = await submitSignup({
            email: correctedEmail,
            phone: extractedPhone,
            marketResearchText: formData.marketResearchText,
            name: extractedNameFromText, // Pass extracted name
            timestamp: new Date().toISOString(),
          });

          // Clear the timeout
          if (robotsToastTimeoutRef.current) {
            clearTimeout(robotsToastTimeoutRef.current);
          }

          // Check if email already exists
          if (result.emailAlreadyExists) {
            showToast({
              title: 'Account Exists',
              content: 'Please log in to continue.',
              type: 'info',
              duration: 4000
            });

            setState(prev => ({
              ...prev,
              currentSection: 'emailExists',
              emailAlreadyExists: true,
              existingEmail: correctedEmail,
              formData: updatedFormData,
            }));
            return;
          }

          // Show success toast
          showToast({
            title: 'Welcome to Split Lease!',
            content: 'Your account has been created successfully.',
            type: 'success',
            duration: 4000
          });

          setState(prev => ({
            ...prev,
            currentSection: 'final',
            isAsyncProcessing: result.isAsync || false,
          }));
        } catch (error) {
          // Clear the timeout
          if (robotsToastTimeoutRef.current) {
            clearTimeout(robotsToastTimeoutRef.current);
          }

          showToast({
            title: 'Signup Issue',
            content: error instanceof Error ? error.message : 'Please try again.',
            type: 'error',
            duration: 5000
          });

          setError(error instanceof Error ? error.message : 'Signup failed. Please try again.');
          setState(prev => ({
            ...prev,
            formData: updatedFormData,
            currentSection: 'contact',
          }));
        }
        return;
      }

      setState(prev => ({
        ...prev,
        formData: updatedFormData,
        currentSection: 'contact',
        emailCertainty: emailCertainty === 'uncertain' ? 'no' : null,
      }));
    }
  }, [state, goToSection, setEmailCertainty, setError, showToast]);

  const handleBack = useCallback(() => {
    if (state.currentSection === 'contact') {
      goToSection('freeform');
    } else if (state.currentSection === 'final') {
      goToSection('contact');
    }
  }, [state.currentSection, goToSection]);

  const handleSubmit = useCallback(async () => {
    const { formData } = state;

    if (!formData.email) {
      setError('Email is required');
      return;
    }

    if (!formData.marketResearchText) {
      setError('Please describe your market research needs');
      return;
    }

    setLoading(true);
    goToSection('loading');

    // Show initial toast
    showToast({
      title: 'Thank you!',
      content: 'Creating your account...',
      type: 'info',
      duration: 3000
    });

    // Show second toast after a delay
    robotsToastTimeoutRef.current = setTimeout(() => {
      showToast({
        title: 'Almost there!',
        content: 'Our robots are still working...',
        type: 'info',
        duration: 3000
      });
    }, 1500);

    try {
      const result = await submitSignup({
        email: formData.email,
        phone: formData.phone,
        marketResearchText: formData.marketResearchText,
        name: formData.name, // Pass the extracted name
        timestamp: new Date().toISOString(),
      });

      // Clear the timeout
      if (robotsToastTimeoutRef.current) {
        clearTimeout(robotsToastTimeoutRef.current);
      }

      // Check if email already exists
      if (result.emailAlreadyExists) {
        showToast({
          title: 'Account Exists',
          content: 'Please log in to continue.',
          type: 'info',
          duration: 4000
        });

        setState(prev => ({
          ...prev,
          currentSection: 'emailExists',
          emailAlreadyExists: true,
          existingEmail: formData.email,
          isLoading: false,
        }));
        return;
      }

      // Show success toast
      showToast({
        title: 'Welcome to Split Lease!',
        content: 'Your account has been created successfully.',
        type: 'success',
        duration: 4000
      });

      setTimeout(() => {
        setState(prev => ({
          ...prev,
          currentSection: 'final',
          isLoading: false,
          isAsyncProcessing: result.isAsync || false,
        }));
      }, 1500);
    } catch (error) {
      // Clear the timeout
      if (robotsToastTimeoutRef.current) {
        clearTimeout(robotsToastTimeoutRef.current);
      }

      showToast({
        title: 'Signup Issue',
        content: error instanceof Error ? error.message : 'Please try again.',
        type: 'error',
        duration: 5000
      });

      setError(error instanceof Error ? error.message : 'Signup failed. Please try again.');
      goToSection('contact');
    }
  }, [state, goToSection, setError, setLoading, showToast]);

  const resetFlow = useCallback(() => {
    setState({
      currentSection: 'freeform',
      formData: {},
      emailCertainty: null,
      isLoading: false,
      error: null,
      emailAlreadyExists: false,
      existingEmail: null,
      isAsyncProcessing: false,
    });
  }, []);

  // Handle login click for existing email users
  const handleLoginClick = useCallback(() => {
    // Close this modal and trigger the login modal in Header
    onClose();
    // Dispatch custom event to open login modal
    window.dispatchEvent(new CustomEvent('openLoginModal', {
      detail: { email: state.existingEmail }
    }));
  }, [onClose, state.existingEmail]);

  const getButtonText = useCallback(() => {
    const { formData } = state;

    if (state.currentSection === 'freeform') {
      const extractedEmail = extractEmail(formData.marketResearchText || '');
      const extractedPhone = extractPhone(formData.marketResearchText || '');
      const correctedEmail = extractedEmail ? autoCorrectEmail(extractedEmail) : '';
      const emailCertainty = correctedEmail ? checkEmailCertainty(correctedEmail) : 'uncertain';

      const emailWasCorrected = extractedEmail !== correctedEmail;
      const phoneIsComplete = extractedPhone ? /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(extractedPhone) : false;

      const isPerfect = correctedEmail && extractedPhone && emailCertainty === 'certain' && !emailWasCorrected && phoneIsComplete;

      if (isPerfect) return 'Submit';
      return 'Next';
    }

    if (state.currentSection === 'contact') return 'Submit';
    return 'Next';
  }, [state]);

  // Reset flow when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetFlow();
    }
  }, [isOpen, resetFlow]);

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

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Auto-close modal and reload page after success (to show logged-in state)
  useEffect(() => {
    if (state.currentSection === 'final' && isOpen) {
      const autoCloseTimer = setTimeout(() => {
        onClose();
        // Short delay before reload to allow toast to be visible
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }, 3500); // 3.5 seconds to read success message

      return () => clearTimeout(autoCloseTimer);
    }
  }, [state.currentSection, isOpen, onClose]);

  // Cleanup toast timeout on unmount
  useEffect(() => {
    return () => {
      if (robotsToastTimeoutRef.current) {
        clearTimeout(robotsToastTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    toasts,
    removeToast,
    updateFormData,
    handleNext,
    handleBack,
    handleSubmit,
    handleLoginClick,
    getButtonText,
  };
}
