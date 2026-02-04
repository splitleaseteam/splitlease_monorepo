import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { TOTAL_STEPS, STEP_CONFIG, INITIAL_FORM_STATE, LOCAL_STORAGE_KEY } from './constants.js';
import { isStepComplete } from '../../../logic/rules/experienceSurvey/isStepComplete.js';
import { formatSurveyPayload } from '../../../logic/processors/experienceSurvey/formatSurveyPayload.js';

/**
 * Logic hook for Host Experience Review Page
 * Manages all state, validation, navigation, and submission logic
 */
export function useHostExperienceReviewPageLogic() {
  // ─────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // ─────────────────────────────────────────────────────────────
  // URL Parameter Sync
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('order');

    if (!orderParam) {
      // No order param - redirect to step 1
      window.history.replaceState({}, '', '?order=1');
      setCurrentStep(1);
    } else {
      const step = parseInt(orderParam, 10);
      if (step >= 1 && step <= TOTAL_STEPS) {
        setCurrentStep(step);
      } else {
        // Invalid step - reset to 1
        window.history.replaceState({}, '', '?order=1');
        setCurrentStep(1);
      }
    }
  }, []);

  // Update URL when step changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (parseInt(params.get('order'), 10) !== currentStep) {
      window.history.pushState({}, '', `?order=${currentStep}`);
    }
  }, [currentStep]);

  // ─────────────────────────────────────────────────────────────
  // Authentication Check
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function checkUser() {
      setIsLoadingUser(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${returnUrl}`;
        return;
      }

      setUser(currentUser);
      setIsLoadingUser(false);
    }

    checkUser();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Auto-save to localStorage
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSubmitted) return; // Don't save after submission

    const draftData = {
      formData,
      currentStep,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draftData));
  }, [formData, currentStep, isSubmitted]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const { formData: savedFormData, currentStep: savedStep, savedAt } = JSON.parse(saved);

        // Check if draft is less than 7 days old
        const savedDate = new Date(savedAt);
        const daysSinceSave = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceSave < 7) {
          setFormData(savedFormData);
          // Only restore step if no URL parameter was set
          const params = new URLSearchParams(window.location.search);
          if (!params.get('order')) {
            setCurrentStep(savedStep);
          }
        } else {
          // Clear stale draft
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      } catch (e) {
        console.error('[HostExperienceReview] Failed to load draft:', e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Derived State
  // ─────────────────────────────────────────────────────────────
  const currentStepConfig = useMemo(() => STEP_CONFIG[currentStep], [currentStep]);

  const isCurrentStepValid = useMemo(() => {
    return isStepComplete(currentStep, formData);
  }, [currentStep, formData]);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOTAL_STEPS;

  const progress = useMemo(() => {
    return Math.round((currentStep / TOTAL_STEPS) * 100);
  }, [currentStep]);

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────
  const handleFieldChange = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error for this field
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  }, [fieldErrors]);

  const validateCurrentStep = useCallback(() => {
    const errors = {};
    const stepConfig = STEP_CONFIG[currentStep];

    if (stepConfig.required) {
      for (const field of stepConfig.fields) {
        const value = formData[field];

        if (typeof value === 'string' && !value.trim()) {
          errors[field] = 'This field is required';
        } else if (typeof value === 'undefined' || value === null) {
          errors[field] = 'This field is required';
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentStep, formData]);

  const goToNextStep = useCallback(() => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, validateCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= currentStep) {
      // Can only go back to completed steps
      setCurrentStep(step);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Format payload
      const payload = formatSurveyPayload(formData);

      // Submit to Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/experience-survey`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'submit',
            payload
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit survey');
      }

      // Success!
      console.log('[HostExperienceReview] Survey submitted:', result.data.surveyId);

      // Clear localStorage draft
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      setIsSubmitted(true);

      // Redirect to thank you page or home after delay
      setTimeout(() => {
        window.location.href = '/?survey=complete';
      }, 3000);

    } catch (error) {
      console.error('[HostExperienceReview] Submit error:', error);
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateCurrentStep]);

  // ─────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────
  return {
    // State
    currentStep,
    currentStepConfig,
    formData,
    fieldErrors,
    isSubmitting,
    submitError,
    isSubmitted,
    user,
    isLoadingUser,

    // Derived
    isCurrentStepValid,
    isFirstStep,
    isLastStep,
    progress,
    totalSteps: TOTAL_STEPS,

    // Handlers
    handleFieldChange,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    handleSubmit
  };
}
