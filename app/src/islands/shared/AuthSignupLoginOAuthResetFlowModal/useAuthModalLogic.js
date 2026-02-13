import { useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  signupUser,
  validateTokenAndFetchUser,
  initiateLinkedInOAuth,
  handleLinkedInOAuthCallback,
  initiateLinkedInOAuthLogin,
  initiateGoogleOAuth,
  handleGoogleOAuthCallback,
  initiateGoogleOAuthLogin
} from '../../../lib/auth/index.js';
import { getLinkedInOAuthUserType, getGoogleOAuthUserType } from '../../../lib/secureStorage.js';
import { supabase } from '../../../lib/supabase.js';
import { useToast } from '../Toast.jsx';
import { VIEWS, USER_TYPES } from './constants.js';
import { isOver18 } from './dateHelpers.js';

export function useAuthModalLogic({
  isOpen,
  onClose,
  initialView = 'initial',
  onAuthSuccess,
  defaultUserType = null,
  skipReload = false,
  prefillEmail = null,
  disableClose = false
}) {
  // Toast notifications (with fallback rendering when no ToastProvider)
  const { toasts, showToast, removeToast } = useToast();

  // View state
  const [currentView, setCurrentView] = useState(VIEWS.ENTRY);

  // Signup form state (persisted between steps)
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userType: defaultUserType === 'host' ? USER_TYPES.HOST : USER_TYPES.GUEST,
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    phoneNumber: '', // Kept for backend compatibility, but not collected in UI
    password: '',
    confirmPassword: ''
  });

  // Card hover states for user type cards
  const [hoveredCard, setHoveredCard] = useState(null);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  // Duplicate email state (for OAuth signup flows)
  const [duplicateEmailData, setDuplicateEmailData] = useState({
    email: '',
    showModal: false
  });

  // User not found state (for OAuth login flows)
  const [userNotFoundData, setUserNotFoundData] = useState({
    email: '',
    showModal: false
  });

  // Initialize view and prefill based on props
  useEffect(() => {
    if (isOpen) {
      // Map initialView prop to internal view state
      if (initialView === 'login') {
        setCurrentView(VIEWS.LOGIN);
      } else if (initialView === 'signup' || initialView === 'signup-step1') {
        // If defaultUserType is provided, skip user type selection and go directly to identity form
        if (defaultUserType) {
          setCurrentView(VIEWS.IDENTITY);
        } else {
          setCurrentView(VIEWS.USER_TYPE);
        }
      } else if (initialView === 'signup-step2' || initialView === 'identity') {
        setCurrentView(VIEWS.IDENTITY);
      } else {
        setCurrentView(VIEWS.ENTRY);
      }
      setError('');
      setHoveredCard(null);

      // Prefill user type if provided
      if (defaultUserType) {
        setSignupData(prev => ({
          ...prev,
          userType: defaultUserType === 'host' ? USER_TYPES.HOST : USER_TYPES.GUEST
        }));
      }

      // Prefill email if provided (e.g., from OAuth user not found)
      if (prefillEmail) {
        setSignupData(prev => ({
          ...prev,
          email: prefillEmail
        }));
      }
    }
  }, [isOpen, initialView, defaultUserType, prefillEmail]);

  // Check password match in real-time
  useEffect(() => {
    if (signupData.confirmPassword && signupData.password !== signupData.confirmPassword) {
      setPasswordMismatch(true);
    } else {
      setPasswordMismatch(false);
    }
  }, [signupData.password, signupData.confirmPassword]);

  // OAuth callback detection (supports LinkedIn and Google)
  useEffect(() => {
    // Only run on initial mount
    const linkedInUserType = getLinkedInOAuthUserType();
    const googleUserType = getGoogleOAuthUserType();

    // Check if this is a signup flow callback
    if (!linkedInUserType && !googleUserType) return;

    // Check if we're returning from OAuth (look for access_token or code in URL hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasAccessToken = hashParams.get('access_token');
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.get('code');

    if (!hasAccessToken && !hasCode) return;

    // Determine which provider we're handling
    const isGoogleCallback = !!googleUserType;
    const providerName = isGoogleCallback ? 'Google' : 'LinkedIn';

    // We're returning from OAuth - handle the callback
    const handleCallback = async () => {
      setIsLoading(true);

      showToast({
        title: 'Signing up...',
        content: `Connecting your ${providerName} account`,
        type: 'info',
        duration: 3000
      });

      const result = isGoogleCallback
        ? await handleGoogleOAuthCallback()
        : await handleLinkedInOAuthCallback();

      setIsLoading(false);

      if (result.success) {
        showToast({
          title: 'Welcome to Split Lease!',
          content: 'Your account has been created successfully.',
          type: 'success',
          duration: 4000
        });

        if (onAuthSuccess) {
          onAuthSuccess(result);
        }

        // Redirect to profile page
        setTimeout(() => {
          const userId = result.data?.user_id;
          console.log('[SignUpModal] Redirecting to profile with user_id:', userId);
          console.log('[SignUpModal] Full result:', JSON.stringify(result, null, 2));
          console.log('[SignUpModal] result.data:', JSON.stringify(result.data, null, 2));
          console.log('[SignUpModal] userId is undefined?', userId === undefined);
          console.log('[SignUpModal] userId type:', typeof userId);

          if (!userId) {
            console.error('[SignUpModal] ERROR: user_id is missing from result.data!');
            console.error('[SignUpModal] This will cause a redirect to wrong page');
            return;
          }

          window.location.href = '/account-profile';
        }, 1500);
      } else if (result.isDuplicate) {
        // Show duplicate email confirmation modal
        setDuplicateEmailData({
          email: result.existingEmail,
          showModal: true
        });
      } else {
        showToast({
          title: 'Signup Failed',
          content: result.error || 'Please try again.',
          type: 'error',
          duration: 5000
        });
        setError(result.error || 'OAuth signup failed. Please try again.');
      }
    };

    handleCallback();
  }, []); // Only run once on mount

  // NOTE: OAuth LOGIN callback detection has been moved to global handler
  // See app/src/lib/oauthCallbackHandler.js
  // The global handler processes OAuth callbacks during app initialization (before React mounts)
  // and dispatches custom events that Header.jsx listens for to update UI

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !disableClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('auth-modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      document.body.classList.remove('auth-modal-open');
    };
  }, [isOpen, disableClose, onClose]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !disableClose) {
      onClose();
    }
  };

  // Reset all forms
  const resetForms = useCallback(() => {
    setSignupData({
      firstName: '',
      lastName: '',
      email: '',
      userType: defaultUserType === 'host' ? USER_TYPES.HOST : USER_TYPES.GUEST,
      birthMonth: '',
      birthDay: '',
      birthYear: '',
      phoneNumber: '',
      password: '',
      confirmPassword: ''
    });
    setLoginData({ email: '', password: '' });
    setResetEmail('');
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowLoginPassword(false);
    setPasswordMismatch(false);
  }, [defaultUserType]);

  // Navigation helpers
  const goToEntry = () => {
    setCurrentView(VIEWS.ENTRY);
    setError('');
    setHoveredCard(null);
  };

  const goToUserType = () => {
    setCurrentView(VIEWS.USER_TYPE);
    setError('');
    setHoveredCard(null);
  };

  const goToIdentity = () => {
    setCurrentView(VIEWS.IDENTITY);
    setError('');
  };

  const goToPassword = () => {
    setCurrentView(VIEWS.PASSWORD);
    setError('');
  };

  const goToLogin = () => {
    setCurrentView(VIEWS.LOGIN);
    setError('');
    // Preserve email if coming from signup
    if (signupData.email) {
      setLoginData(prev => ({ ...prev, email: signupData.email }));
    }
  };

  const goToPasswordReset = () => {
    setCurrentView(VIEWS.PASSWORD_RESET);
    setResetEmail(loginData.email); // Preserve email from login
    setError('');
  };

  const goToMagicLink = () => {
    setCurrentView(VIEWS.MAGIC_LINK);
    setResetEmail(loginData.email); // Preserve email from login
    setError('');
  };

  const showSuccess = () => {
    setCurrentView(VIEWS.SUCCESS);
  };

  // Legacy aliases for backward compatibility
  const goToSignupStep1 = goToUserType;
  const goToSignupStep2 = goToIdentity;
  const goToInitial = goToEntry;

  // Handle identity step continue (Step 2 -> Step 3)
  const handleIdentityContinue = (e) => {
    e.preventDefault();
    setError('');

    // Validate identity fields
    if (!signupData.firstName.trim()) {
      setError('First name is required.');
      return;
    }
    if (!signupData.lastName.trim()) {
      setError('Last name is required.');
      return;
    }
    if (!signupData.email.trim()) {
      setError('Email is required.');
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate birthday
    if (!signupData.birthMonth || !signupData.birthDay || !signupData.birthYear) {
      setError('Please enter your date of birth.');
      return;
    }

    if (!isOver18(parseInt(signupData.birthMonth), parseInt(signupData.birthDay), parseInt(signupData.birthYear))) {
      setError('You must be at least 18 years old to use Split Lease.');
      return;
    }

    goToPassword();
  };

  // Legacy alias
  const handleSignupStep1Continue = handleIdentityContinue;

  // Handle final signup submission (Step 3)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password
    if (!signupData.password) {
      setError('Password is required.');
      return;
    }

    if (signupData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    // Check for mix of letters and numbers
    const hasLetters = /[a-zA-Z]/.test(signupData.password);
    const hasNumbers = /[0-9]/.test(signupData.password);
    if (!hasLetters || !hasNumbers) {
      setError('Password must contain both letters and numbers.');
      return;
    }

    setIsLoading(true);

    // Show initial toast
    showToast({
      title: 'Thank you!',
      content: 'Creating your account...',
      type: 'info',
      duration: 3000
    });

    // Show second toast after a delay
    const robotsToastTimeout = setTimeout(() => {
      showToast({
        title: 'Almost there!',
        content: 'Our robots are still working...',
        type: 'info',
        duration: 3000
      });
    }, 1500);

    // Call signup with extended data
    // Note: Pass password as both password and retype since we removed confirm field
    // (password validation is done via requirements UI in renderPasswordView)
    const result = await signupUser(
      signupData.email,
      signupData.password,
      signupData.password, // Use same password for retype since we validate via requirements UI
      {
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        userType: signupData.userType,
        birthDate: `${signupData.birthYear}-${String(signupData.birthMonth).padStart(2, '0')}-${String(signupData.birthDay).padStart(2, '0')}`,
        phoneNumber: signupData.phoneNumber || '' // Empty string if not provided
      }
    );

    clearTimeout(robotsToastTimeout);
    setIsLoading(false);

    if (result.success) {
      showToast({
        title: 'Welcome to Split Lease!',
        content: 'Your account has been created successfully.',
        type: 'success',
        duration: 4000
      });

      if (onAuthSuccess) {
        onAuthSuccess(result);
      }

      // Delay closing the modal to let the success toast be visible
      // The toast is rendered inside the modal, so we need to keep it open briefly
      setTimeout(() => {
        onClose();
        if (!skipReload) {
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }
      }, 1500); // Show toast for 1.5 seconds before closing
    } else {
      showToast({
        title: 'Signup Failed',
        content: result.error || 'Please try again.',
        type: 'error',
        duration: 5000
      });
      setError(result.error || 'Signup failed. Please try again.');
    }
  };

  // Handle login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Show initial toast
    showToast({
      title: 'Welcome back!',
      content: 'Logging you in...',
      type: 'info',
      duration: 3000
    });

    // Show second toast after a delay
    const robotsToastTimeout = setTimeout(() => {
      showToast({
        title: 'Almost there!',
        content: 'Our robots are still working...',
        type: 'info',
        duration: 3000
      });
    }, 1500);

    const result = await loginUser(loginData.email, loginData.password);
    console.log('[SignUpLoginModal] loginUser result:', result);

    if (result.success) {
      console.log('[SignUpLoginModal] Login successful, proceeding with post-login flow...');

      // Fetch and cache user data before reload for optimistic UI
      // This ensures the next page load has the correct user's firstName cached
      // CRITICAL: Use clearOnFailure: false to preserve the fresh session even if validation fails
      // The session was just established by login - don't let a failed user profile fetch clear it
      try {
        console.log('[SignUpLoginModal] Fetching user data...');
        await validateTokenAndFetchUser({ clearOnFailure: false });
        console.log('[SignUpLoginModal] User data fetched successfully');
      } catch (validationError) {
        console.warn('[SignUpLoginModal] User data fetch failed, continuing with login:', validationError);
        // Don't block login - the page reload will fetch fresh data
      }

      clearTimeout(robotsToastTimeout);
      setIsLoading(false);

      // Show success toast
      showToast({
        title: 'Login Successful!',
        content: 'Welcome back to Split Lease.',
        type: 'success',
        duration: 4000
      });

      console.log('[SignUpLoginModal] Calling onAuthSuccess and onClose...');
      if (onAuthSuccess) {
        onAuthSuccess(result);
      }

      // Close modal after a brief delay to let toast render
      setTimeout(() => {
        onClose();

        console.log('[SignUpLoginModal] skipReload:', skipReload);
        if (!skipReload) {
          // Delay reload to allow user to see success message and Header to update
          console.log('[SignUpLoginModal] Scheduling page reload in 1.5s...');
          setTimeout(() => {
            console.log('[SignUpLoginModal] Triggering page reload...');
            window.location.reload();
          }, 1500);
        }
      }, 500);
    } else {
      clearTimeout(robotsToastTimeout);
      setIsLoading(false);

      showToast({
        title: 'Login Failed',
        content: result.error || 'Please check your credentials.',
        type: 'error',
        duration: 5000
      });
      setError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!resetEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      // Capture current page to return user after password reset
      const currentPath = window.location.pathname + window.location.search;
      const returnToParam = encodeURIComponent(currentPath);

      // Call the password reset workflow via Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('auth-user', {
        body: {
          action: 'request_password_reset',
          payload: {
            email: resetEmail,
            redirectTo: `${window.location.origin}/reset-password?returnTo=${returnToParam}`
          }
        }
      });

      if (fnError) {
        // Don't expose error details - always show success for security
        console.error('Password reset error:', fnError);
      }

      // Navigate to confirmation view instead of showing toast
      setCurrentView(VIEWS.RESET_SENT);
    } catch (err) {
      console.error('Password reset error:', err);
      // Still navigate to confirmation view for security (prevent email enumeration)
      setCurrentView(VIEWS.RESET_SENT);
    }

    setIsLoading(false);
  };

  // Handle magic link request
  const handleMagicLink = async (e) => {
    if (e) e.preventDefault();
    const email = (currentView === VIEWS.PASSWORD_RESET || currentView === VIEWS.MAGIC_LINK) ? resetEmail : loginData.email;

    if (!email.trim()) {
      setError('Please enter your email address first.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Navigate to confirmation view for security (prevents email enumeration)
    const showSuccessView = () => {
      setCurrentView(VIEWS.MAGIC_LINK_SENT);
    };

    try {
      // Step 1: Check if user exists (using Supabase directly)
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('id, first_name, email, phone_number')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (userError) {
        console.error('[handleMagicLink] Error checking user:', userError);
        // Don't expose error - show success for security
        showSuccessView();
        setIsLoading(false);
        return;
      }

      if (!userData) {
        // User doesn't exist - still show success view for security
        console.log('[handleMagicLink] No user found for email');
        showSuccessView();
        setIsLoading(false);
        return;
      }

      // Step 2: User exists - fetch BCC email addresses from os_slack_channels
      console.log('[handleMagicLink] Fetching BCC email addresses from os_slack_channels');

      const { data: channelData, error: channelError } = await supabase
        .schema('reference_table')
        .from('os_slack_channels')
        .select('email_address')
        .in('name', ['bots_log', 'customer_activation']);

      let bccEmails = [];
      if (!channelError && channelData) {
        bccEmails = channelData
          .map(c => c.email_address)
          .filter(e => e && e.trim() && e.includes('@'));
        console.log('[handleMagicLink] BCC emails:', bccEmails);
      } else if (channelError) {
        console.warn('[handleMagicLink] Error fetching BCC channels:', channelError);
        // Continue without BCC - don't fail the whole operation
      }

      // Step 3: Generate magic link
      console.log('[handleMagicLink] User found, generating magic link');

      const redirectTo = `${window.location.origin}/account-profile`;

      const { data: magicLinkData, error: magicLinkError } = await supabase.functions.invoke('auth-user', {
        body: {
          action: 'generate_magic_link',
          payload: {
            email: email.toLowerCase().trim(),
            redirectTo: redirectTo
          }
        }
      });

      if (magicLinkError || !magicLinkData?.success) {
        console.error('[handleMagicLink] Error generating magic link:', magicLinkError || magicLinkData);
        // Don't expose error - show success for security
        showSuccessView();
        setIsLoading(false);
        return;
      }

      const magicLink = magicLinkData.data.action_link;
      const firstName = userData.first_name || 'there';

      // Step 4: Send magic link email using send-email edge function
      console.log('[handleMagicLink] Sending magic link email');

      // Build the body text with the user's first name
      const bodyText = `Hi ${firstName}. Please use the link below to log in to your Split Lease account. Once logged in, you can update your password from the profile page. Please feel free to text (937) 673-7470 with any queries.`;

      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          action: 'send',
          payload: {
            template_id: '1757433099447x202755280527849400', // Security 2 template
            to_email: email.toLowerCase().trim(),
            variables: {
              toemail: email.toLowerCase().trim(),
              fromemail: 'tech@leasesplit.com',
              fromname: 'Split Lease',
              subject: 'Your Split Lease Magic Login Link',
              preheadertext: 'Click the link to log in without a password',
              title: 'Magic Login Link',
              bodytext: bodyText,
              buttonurl: magicLink,
              buttontext: 'Log In Now',
              bannertext1: 'SECURITY NOTICE',
              bannertext2: 'This link expires in 1 hour',
              bannertext3: "If you didn't request this, please ignore this email",
              footermessage: 'For your security, never share this link with anyone.',
              cc: '',  // No CC for user-facing emails
              bcc: ''  // BCC handled via bcc_emails array
            },
            // Dynamic BCC from os_slack_channels
            ...(bccEmails.length > 0 && { bcc_emails: bccEmails })
          }
        }
      });

      if (emailError) {
        console.error('[handleMagicLink] Error sending email:', emailError);
        // Still show success for security
      } else {
        console.log('[handleMagicLink] Magic link email sent successfully');
      }

      // Step 5: Send SMS if user has a phone number
      const rawPhone = userData.phone_number;
      if (rawPhone && rawPhone.trim()) {
        console.log('[handleMagicLink] User has phone number, sending SMS');

        // Format phone to E.164 (+1xxxxxxxxxx)
        const digitsOnly = rawPhone.replace(/\D/g, '');
        let formattedPhone = null;

        if (digitsOnly.length === 10) {
          // 10 digits: assume US, prepend +1
          formattedPhone = `+1${digitsOnly}`;
        } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
          // 11 digits starting with 1: prepend +
          formattedPhone = `+${digitsOnly}`;
        } else if (rawPhone.startsWith('+') && digitsOnly.length >= 10) {
          // Already has + prefix
          formattedPhone = `+${digitsOnly}`;
        }

        if (formattedPhone) {
          const smsBody = `Passwords are tricky. Please use this magic link and you can update your password right from the profile page: ${magicLink}`;

          try {
            const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms', {
              body: {
                action: 'send',
                payload: {
                  from: '+14155692985',
                  to: formattedPhone,
                  body: smsBody
                }
              }
            });

            if (smsError) {
              console.error('[handleMagicLink] Error sending SMS:', smsError);
              // Don't fail - SMS is supplementary to email
            } else {
              console.log('[handleMagicLink] Magic link SMS sent successfully');
            }
          } catch (smsErr) {
            console.error('[handleMagicLink] SMS exception:', smsErr);
            // Don't fail - SMS is supplementary
          }
        } else {
          console.log('[handleMagicLink] Could not format phone number:', rawPhone);
        }
      }

      showSuccessView();

    } catch (err) {
      console.error('[handleMagicLink] Unexpected error:', err);
      // Don't expose error - show success for security
      showSuccessView();
    }

    setIsLoading(false);
  };

  // Inject keyframe animations and mobile bottom-sheet styles
  useEffect(() => {
    const styleId = 'signup-modal-protocol-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes signupModalSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* Mobile bottom-sheet mode - Protocol Section 1 */
        @media (max-width: 480px) {
          .signup-modal-overlay {
            align-items: flex-end !important;
            padding: 0 !important;
          }

          .signup-modal-container {
            border-radius: 24px 24px 0 0 !important;
            max-width: 100% !important;
            max-height: 92vh !important;
            animation: signupModalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }

          .signup-modal-grab-handle {
            display: block !important;
          }

          .signup-modal-close-btn {
            width: 48px !important;
            height: 48px !important;
            top: 8px !important;
            right: 8px !important;
          }

          .signup-modal-close-btn svg,
          .signup-modal-close-icon {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            stroke-width: 2.5 !important;
          }
        }

        /* Protocol: Explicit icon sizing to prevent CSS conflicts */
        .signup-modal-close-icon {
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          min-height: 32px !important;
          flex-shrink: 0 !important;
        }

        /* Close button hover - Protocol */
        .signup-modal-close-btn:hover {
          background: #F7F2FA !important;
        }

        /* Back button hover - Ghost style */
        .signup-modal-back-btn:hover {
          background: #F7F2FA !important;
          border-color: #31135D !important;
          color: #31135D !important;
        }

        /* Primary button hover */
        .signup-modal-btn-primary:hover:not(:disabled) {
          background: #6D31C2 !important;
        }

        /* Secondary button hover */
        .signup-modal-btn-secondary:hover {
          background: #F7F2FA !important;
          border-color: #31135D !important;
          color: #31135D !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return {
    // Toast
    toasts,
    showToast,
    removeToast,

    // View state
    currentView,
    setCurrentView,

    // Signup form state
    signupData,
    setSignupData,

    // Card hover state
    hoveredCard,
    setHoveredCard,

    // Login form state
    loginData,
    setLoginData,

    // Password reset state
    resetEmail,
    setResetEmail,

    // UI state
    error,
    setError,
    isLoading,
    setIsLoading,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    showLoginPassword,
    setShowLoginPassword,
    passwordMismatch,
    setPasswordMismatch,

    // Duplicate email state
    duplicateEmailData,
    setDuplicateEmailData,

    // User not found state
    userNotFoundData,
    setUserNotFoundData,

    // Handlers
    handleOverlayClick,
    resetForms,
    handleIdentityContinue,
    handleSignupStep1Continue,
    handleSignupSubmit,
    handleLoginSubmit,
    handlePasswordReset,
    handleMagicLink,

    // Navigation
    goToEntry,
    goToUserType,
    goToIdentity,
    goToPassword,
    goToLogin,
    goToPasswordReset,
    goToMagicLink,
    showSuccess,

    // Legacy aliases
    goToSignupStep1,
    goToSignupStep2,
    goToInitial,

    // Auth functions (re-exported for component use)
    initiateLinkedInOAuth,
    initiateLinkedInOAuthLogin,
    initiateGoogleOAuth,
    initiateGoogleOAuthLogin
  };
}
