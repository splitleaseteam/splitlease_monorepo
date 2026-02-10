import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { getUserId } from '../../../lib/auth/index.js';
import { useToast } from '../../shared/Toast';

/**
 * Step configuration for the guest experience review wizard
 * Each step maps to a specific survey question
 */
const STEPS = [
  { id: 1, label: 'Welcome', component: 'WelcomeStep' },
  { id: 2, label: 'Name', component: 'NameStep', field: 'name' },
  { id: 3, label: 'Experience', component: 'ExperienceStep', field: 'experience' },
  { id: 4, label: 'Challenge', component: 'ChallengeStep', field: 'challenge' },
  { id: 5, label: 'Feelings', component: 'FeelingsStep', field: 'challengeExperience' },
  { id: 6, label: 'Change', component: 'ChangeStep', field: 'change' },
  { id: 7, label: 'Service', component: 'ServiceStep', field: 'service' },
  { id: 8, label: 'More Services', component: 'AdditionalServiceStep', field: 'additionalService' },
  { id: 9, label: 'Recommend', component: 'RecommendStep', field: 'recommend' },
  { id: 10, label: 'Staff & Questions', component: 'StaffAndQuestionsStep', fields: ['staff', 'questions'] },
  { id: 11, label: 'Share & Refer', component: 'ShareAndReferralStep', field: 'canShare' },
];

const TOTAL_STEPS = 11;

/**
 * Initial form data state for the experience survey
 * Maps to the experiencesurvey table columns in Supabase
 */
const INITIAL_FORM_DATA = {
  name: '',
  experience: '',
  challenge: '',
  challengeExperience: '',
  change: '',
  service: '',
  additionalService: '',
  recommend: 5,
  staff: '',
  questions: '',
  canShare: null,
};

/**
 * useGuestExperienceReviewPageLogic - Core logic hook for the Guest Experience Review page
 *
 * Follows the Hollow Component pattern: all business logic lives here,
 * the page component is purely presentational.
 */
export function useGuestExperienceReviewPageLogic() {
  const { showToast } = useToast();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Referral
  const [referralEmail, setReferralEmail] = useState('');
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Loading state for initial data fetch
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Update a single field in the form data
   */
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Navigate to the next step or submit the survey on the last step
   */
  const handleNext = useCallback(async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === TOTAL_STEPS) {
      await handleSubmitSurvey();
    }
  }, [currentStep]);

  /**
   * Navigate to the previous step
   */
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  /**
   * Submit the survey to Supabase
   */
  const handleSubmitSurvey = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const userId = getUserId();

      // Generate a Bubble-compatible ID for the survey record
      const { data: surveyId, error: idError } = await supabase.rpc('generate_bubble_id');
      if (idError) {
        console.error('[GuestExperienceReview] ID generation error:', idError);
        throw new Error('Failed to generate survey ID');
      }

      const now = new Date().toISOString();

      // Insert into experiencesurvey table
      const { error: insertError } = await supabase
        .from('experiencesurvey')
        .insert({
          '_id': surveyId,
          'Name': formData.name,
          'Experience': formData.experience,
          'Challenge': formData.challenge,
          'Challenge Experience': formData.challengeExperience,
          'Change': formData.change,
          'Service': formData.service,
          'Additional Service': formData.additionalService,
          'Recommend': formData.recommend,
          'Split Lease Staff': formData.staff,
          'Questions': formData.questions,
          'Share': formData.canShare,
          'Type': 'Guest',
          'Created Date': now,
          'Modified Date': now,
          'Created By': userId,
        });

      if (insertError) {
        console.error('[GuestExperienceReview] Insert error:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
        throw insertError;
      }

      console.log('[GuestExperienceReview] Survey submitted successfully:', surveyId);

      // Send notifications (fire-and-forget)
      sendNotificationEmail(formData, surveyId);
      sendSlackNotification(formData, surveyId);

      // Send confirmation to reviewer
      sendReviewerConfirmationEmail(formData, surveyId);

      showToast({
        title: 'Thank you!',
        content: 'Your feedback has been submitted.',
        type: 'success'
      });

      setIsComplete(true);

      // Redirect to homepage after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);

    } catch (error) {
      console.error('[GuestExperienceReview] Submit error:', error);
      showToast({
        title: 'Submission failed',
        content: error.message || 'Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, showToast]);

  /**
   * Submit a referral via the bubble-proxy Edge Function
   */
  const handleSubmitReferral = useCallback(async () => {
    if (!referralEmail.trim()) {
      showToast({
        title: 'Email required',
        content: "Please enter your friend's email address.",
        type: 'warning'
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(referralEmail)) {
      showToast({
        title: 'Invalid email',
        content: 'Please enter a valid email address.',
        type: 'error'
      });
      return;
    }

    setIsSubmittingReferral(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bubble-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'submit_referral',
            payload: {
              referred_email: referralEmail.toLowerCase().trim(),
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.error?.includes('duplicate') || result.error?.includes('already exists')) {
          showToast({
            title: 'Already referred',
            content: 'This email has already been referred.',
            type: 'info'
          });
        } else {
          throw new Error(result.error || 'Referral failed');
        }
      } else {
        showToast({
          title: 'Referral sent!',
          content: 'Your friend will receive an invitation email.',
          type: 'success'
        });
        setReferralEmail('');
      }

    } catch (error) {
      console.error('[GuestExperienceReview] Referral error:', error);
      showToast({
        title: 'Referral failed',
        content: error.message,
        type: 'error'
      });
    } finally {
      setIsSubmittingReferral(false);
    }
  }, [referralEmail, showToast]);

  /**
   * Pre-fill the user's name on mount
   */
  useEffect(() => {
    const initializeUserData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch user's first name from user table
          const { data: userData, error } = await supabase
            .from('user')
            .select('first_name')
            .eq('email', user.email?.toLowerCase())
            .maybeSingle();

          if (error) {
            console.error('[GuestExperienceReview] Failed to fetch user data:', error);
          } else if (userData?.first_name) {
            setFormData(prev => ({ ...prev, name: userData.first_name }));
          }
        }
      } catch (error) {
        console.error('[GuestExperienceReview] Failed to initialize user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUserData();
  }, []);

  return {
    // Step management
    currentStep,
    totalSteps: TOTAL_STEPS,
    steps: STEPS,

    // Form data
    formData,
    updateField,

    // Navigation
    handleBack,
    handleNext,

    // Submission
    isSubmitting,
    isComplete,
    isLoading,

    // Referral
    referralEmail,
    setReferralEmail,
    handleSubmitReferral,
    isSubmittingReferral,
  };
}

/**
 * Send internal notification email to the team via send-email Edge Function
 */
async function sendNotificationEmail(formData, surveyId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    await supabase.functions.invoke('send-email', {
      body: {
        action: 'send',
        payload: {
          template_id: 'd-6f8b9a0c1234567890abcdef12345678', // Basic email template
          to_email: 'team@splitlease.com',
          from_email: 'no-reply@split.lease',
          from_name: 'Split Lease',
          subject: `New Guest Experience Survey: ${formData.name}`,
          variables: {
            title: 'New Guest Experience Survey Received',
            bodytext: `
              <strong>Reviewer:</strong> ${formData.name}<br/>
              <strong>Recommend Score:</strong> ${formData.recommend}/10<br/>
              <strong>Experience:</strong> ${formData.experience || 'Not provided'}<br/>
              <strong>Challenge:</strong> ${formData.challenge || 'Not provided'}<br/>
              <strong>Staff Mentioned:</strong> ${formData.staff || 'None'}<br/>
              <strong>Questions:</strong> ${formData.questions || 'None'}<br/>
              <strong>Can Share:</strong> ${formData.canShare ? 'Yes' : 'No'}<br/>
              <br/>
              <a href="https://splitlease.com/_experience-responses">View All Responses</a>
            `,
          },
        },
      },
    });

    console.log('[GuestExperienceReview] Team notification email sent');
  } catch (error) {
    console.error('[GuestExperienceReview] Email notification failed:', error);
    // Non-blocking - don't throw
  }
}

/**
 * Send confirmation email to the reviewer
 */
async function sendReviewerConfirmationEmail(formData, surveyId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;

    await supabase.functions.invoke('send-email', {
      body: {
        action: 'send',
        payload: {
          template_id: 'd-6f8b9a0c1234567890abcdef12345678', // Basic email template
          to_email: user.email,
          from_email: 'no-reply@split.lease',
          from_name: 'Split Lease',
          subject: 'Thank You for Your Feedback!',
          variables: {
            title: 'Thank You for Sharing Your Experience',
            bodytext: `
              Hi ${formData.name},<br/><br/>
              Thank you for taking the time to share your experience with Split Lease.
              Your feedback helps us improve our service for everyone.<br/><br/>
              We truly appreciate your input!<br/><br/>
              Best regards,<br/>
              The Split Lease Team
            `,
          },
        },
      },
    });

    console.log('[GuestExperienceReview] Reviewer confirmation email sent');
  } catch (error) {
    console.error('[GuestExperienceReview] Reviewer confirmation email failed:', error);
    // Non-blocking - don't throw
  }
}

/**
 * Send Slack notification to internal channel
 */
async function sendSlackNotification(formData, surveyId) {
  try {
    // Use the Slack webhook via Edge Function
    await supabase.functions.invoke('slack-notify', {
      body: {
        channel: 'acquisition',
        message: `New Guest Experience Survey submitted by ${formData.name}`,
        details: {
          'Recommend Score': `${formData.recommend}/10`,
          'Experience Summary': formData.experience?.substring(0, 200) || 'Not provided',
          'Staff Mentioned': formData.staff || 'None',
          'Can Share': formData.canShare ? 'Yes' : 'No',
        },
      },
    });

    console.log('[GuestExperienceReview] Slack notification sent');
  } catch (error) {
    console.error('[GuestExperienceReview] Slack notification failed:', error);
    // Non-blocking - don't throw
  }
}

export default useGuestExperienceReviewPageLogic;
