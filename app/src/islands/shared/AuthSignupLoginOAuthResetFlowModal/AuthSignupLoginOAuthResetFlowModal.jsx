/**
 * SignUpLoginModal - Shared authentication modal component
 *
 * A comprehensive modal for login/signup matching the original Bubble design.
 * Supports multiple views: initial, login, signup-step1, signup-step2, password-reset
 *
 * Key Features:
 * - Multi-step signup with first name, last name, email, DOB, phone, password
 * - Login with passwordless option and forgot password
 * - Password reset with magic link option
 * - Route-based user type prefilling
 * - Data persistence between steps
 *
 * Usage:
 *   import SignUpLoginModal from '../shared/AuthSignupLoginOAuthResetFlowModal';
 *
 *   <SignUpLoginModal
 *     isOpen={showModal}
 *     onClose={() => setShowModal(false)}
 *     initialView="initial" // 'initial', 'login', 'signup', 'signup-step1', 'signup-step2'
 *     onAuthSuccess={(userData) => handleSuccess(userData)}
 *     defaultUserType="guest" // 'host' or 'guest' - for route-based prefilling
 *   />
 */

import { useAuthModalLogic } from './useAuthModalLogic.js';
import { VIEWS, USER_TYPES, LOGO_URL } from './constants.js';
import { styles } from './styles.js';
import {
  EyeIcon, ArrowLeftIcon, LoadingSpinner, CloseIcon,
  UserPlusIcon, LogInIcon, BarChartIcon, HomeIcon, KeyIcon,
  MailIcon, CheckCircleIcon, CircleIcon, GoogleLogo
} from './icons.jsx';
import { months, years, getDaysInMonth } from './dateHelpers.js';
import Toast from '../Toast.jsx';

export default function SignUpLoginModal({
  isOpen,
  onClose,
  initialView = 'initial',
  onAuthSuccess,
  disableClose = false,
  defaultUserType = null,
  skipReload = false,
  prefillEmail = null
}) {
  const {
    // Toast
    toasts, showToast, removeToast,
    // View state
    currentView,
    // Signup form state
    signupData, setSignupData,
    // Card hover state
    hoveredCard, setHoveredCard,
    // Login form state
    loginData, setLoginData,
    // Password reset state
    resetEmail, setResetEmail,
    // UI state
    error, setError, isLoading,
    showPassword, setShowPassword,
    showLoginPassword, setShowLoginPassword,
    // Duplicate email state
    duplicateEmailData, setDuplicateEmailData,
    // User not found state
    userNotFoundData, setUserNotFoundData,
    // Handlers
    handleOverlayClick,
    handleIdentityContinue,
    handleSignupSubmit,
    handleLoginSubmit,
    handlePasswordReset,
    handleMagicLink,
    // Navigation
    goToEntry, goToUserType, goToIdentity, goToPassword,
    goToLogin, goToPasswordReset, goToMagicLink,
    // Auth functions
    initiateLinkedInOAuth, initiateLinkedInOAuthLogin,
    initiateGoogleOAuth, initiateGoogleOAuthLogin
  } = useAuthModalLogic({
    isOpen, onClose, initialView, onAuthSuccess,
    defaultUserType, skipReload, prefillEmail, disableClose
  });

  if (!isOpen) return null;

  // ============================================================================
  // Render Functions for Each View
  // ============================================================================

  // Entry View (Step 0) - Premium card-based selection
  const renderEntryView = () => (
    <>
      <div style={styles.logoContainer}>
        <img src={LOGO_URL} alt="Split Lease" style={styles.logo} />
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>Welcome to Split Lease</h1>
        <p style={styles.subtitle}>How can we help you today?</p>
      </div>

      {/* Card: I'm new around here */}
      <div
        style={{
          ...styles.userTypeCard,
          ...(hoveredCard === 'new' ? styles.userTypeCardSelected : {})
        }}
        onClick={goToUserType}
        onMouseEnter={() => setHoveredCard('new')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div style={styles.userTypeIcon}>
          <UserPlusIcon size={24} />
        </div>
        <div style={styles.userTypeContent}>
          <div style={styles.userTypeTitle}>I'm new around here</div>
          <p style={styles.userTypeDesc}>Create an account to get started</p>
        </div>
      </div>

      {/* Card: Log into my account */}
      <div
        style={{
          ...styles.userTypeCard,
          ...(hoveredCard === 'login' ? styles.userTypeCardSelected : {})
        }}
        onClick={goToLogin}
        onMouseEnter={() => setHoveredCard('login')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div style={styles.userTypeIcon}>
          <LogInIcon size={24} />
        </div>
        <div style={styles.userTypeContent}>
          <div style={styles.userTypeTitle}>Log into my account</div>
          <p style={styles.userTypeDesc}>Welcome back! Sign in to continue</p>
        </div>
      </div>

      {/* Card: Market Report */}
      <div
        style={{
          ...styles.userTypeCard,
          ...(hoveredCard === 'market' ? styles.userTypeCardSelected : {})
        }}
        onClick={goToUserType}
        onMouseEnter={() => setHoveredCard('market')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div style={styles.userTypeIcon}>
          <BarChartIcon size={24} />
        </div>
        <div style={styles.userTypeContent}>
          <div style={styles.userTypeTitle}>Sign Up with Market Report</div>
          <p style={styles.userTypeDesc}>Get NYC rental insights and create an account</p>
        </div>
      </div>
    </>
  );

  // User Type View (Step 1) - Guest/Host selection
  const renderUserTypeView = () => (
    <>
      <div style={styles.logoContainer}>
        <img src={LOGO_URL} alt="Split Lease" style={styles.logo} />
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>What brings you here?</h1>
        <p style={styles.subtitle}>I'm here to...</p>
      </div>

      {/* Guest card */}
      <div
        style={{
          ...styles.userTypeCard,
          ...(hoveredCard === 'guest' || signupData.userType === USER_TYPES.GUEST ? styles.userTypeCardSelected : {})
        }}
        onClick={() => {
          setSignupData({ ...signupData, userType: USER_TYPES.GUEST });
          setTimeout(goToIdentity, 200);
        }}
        onMouseEnter={() => setHoveredCard('guest')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div style={styles.userTypeIcon}>
          <HomeIcon size={24} />
        </div>
        <div style={styles.userTypeContent}>
          <div style={styles.userTypeTitle}>Find a place to stay</div>
          <p style={styles.userTypeDesc}>Browse flexible rentals across NYC</p>
        </div>
      </div>

      {/* Host card */}
      <div
        style={{
          ...styles.userTypeCard,
          ...(hoveredCard === 'host' || signupData.userType === USER_TYPES.HOST ? styles.userTypeCardSelected : {})
        }}
        onClick={() => {
          setSignupData({ ...signupData, userType: USER_TYPES.HOST });
          setTimeout(goToIdentity, 200);
        }}
        onMouseEnter={() => setHoveredCard('host')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div style={styles.userTypeIcon}>
          <KeyIcon size={24} />
        </div>
        <div style={styles.userTypeContent}>
          <div style={styles.userTypeTitle}>Share my space</div>
          <p style={styles.userTypeDesc}>List your place for nightly, weekly, or monthly stays</p>
        </div>
      </div>

      <button className="signup-modal-back-btn" style={styles.backBtn} onClick={goToEntry}>
        <ArrowLeftIcon /> Back
      </button>
    </>
  );

  // Login View - Premium styling with OAuth buttons
  const renderLoginView = () => (
    <>
      <div style={styles.logoContainer}>
        <img src={LOGO_URL} alt="Split Lease" style={styles.logo} />
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>Welcome back!</h1>
        <p style={styles.subtitle}>Log in to your Split Lease account</p>
      </div>

      {/* OAuth Buttons Row (side by side) */}
      <div style={styles.oauthButtonsRow}>
        {/* LinkedIn OAuth Button */}
        <button
          type="button"
          style={styles.linkedinBtn}
          onClick={async () => {
            const result = await initiateLinkedInOAuthLogin();
            if (!result.success) {
              setError(result.error || 'Failed to start LinkedIn login');
            }
          }}
          disabled={isLoading}
        >
          <div style={styles.linkedinIcon}>in</div>
          <span style={styles.linkedinPrimary}>LinkedIn</span>
        </button>

        {/* Google OAuth Button */}
        <button
          type="button"
          style={styles.googleBtn}
          onClick={async () => {
            const result = await initiateGoogleOAuthLogin();
            if (!result.success) {
              setError(result.error || 'Failed to start Google login');
            }
          }}
          disabled={isLoading}
        >
          <GoogleLogo />
          <span>Google</span>
        </button>
      </div>

      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>or</span>
        <div style={styles.dividerLine} />
      </div>

      <form onSubmit={handleLoginSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            required
            placeholder="john@example.com"
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = '#31135D';
              e.target.style.backgroundColor = 'white';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E7E0EC';
              e.target.style.backgroundColor = '#F7F2FA';
            }}
          />
        </div>

        <div style={{ ...styles.formGroup, marginBottom: '8px' }}>
          <label style={styles.label}>Password</label>
          <div style={styles.passwordWrapper}>
            <input
              type={showLoginPassword ? 'text' : 'password'}
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              placeholder="Enter your password"
              style={{ ...styles.input, ...styles.inputWithIcon }}
              onFocus={(e) => {
                e.target.style.borderColor = '#31135D';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E7E0EC';
                e.target.style.backgroundColor = '#F7F2FA';
              }}
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
              style={styles.togglePasswordBtn}
            >
              <EyeIcon open={showLoginPassword} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button type="button" onClick={goToMagicLink} style={{ ...styles.link, fontSize: '13px' }}>
            Log in without password
          </button>
          <button type="button" onClick={goToPasswordReset} style={{ ...styles.link, fontSize: '13px' }}>
            Forgot password?
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !loginData.email || !loginData.password}
          style={{
            ...styles.buttonPrimary,
            ...(isLoading || !loginData.email || !loginData.password ? styles.buttonDisabled : {})
          }}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size={18} />
              Logging in...
            </>
          ) : (
            'Log In'
          )}
        </button>

        <div style={styles.footerLink}>
          Don't have an account?{' '}
          <button type="button" onClick={goToUserType} style={styles.link}>
            Sign up
          </button>
        </div>
      </form>
    </>
  );

  // Identity View (Step 2) - Name, email, birthday with OAuth options
  const renderIdentityView = () => (
    <>
      <div style={styles.logoContainer}>
        <img src={LOGO_URL} alt="Split Lease" style={styles.logo} />
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>Nice to meet you!</h1>
        <p style={styles.subtitle}>Tell us a bit about yourself</p>
      </div>

      {/* OAuth Buttons Row (side by side) */}
      <div style={styles.oauthButtonsRow}>
        {/* LinkedIn OAuth Button */}
        <button
          type="button"
          style={styles.linkedinBtn}
          onClick={async () => {
            const result = await initiateLinkedInOAuth(signupData.userType);
            if (!result.success) {
              setError(result.error || 'Failed to start LinkedIn signup');
            }
          }}
          disabled={isLoading}
        >
          <div style={styles.linkedinIcon}>in</div>
          <span style={styles.linkedinPrimary}>LinkedIn</span>
        </button>

        {/* Google OAuth Button */}
        <button
          type="button"
          style={styles.googleBtn}
          onClick={async () => {
            const result = await initiateGoogleOAuth(signupData.userType);
            if (!result.success) {
              setError(result.error || 'Failed to start Google signup');
            }
          }}
          disabled={isLoading}
        >
          <GoogleLogo />
          <span>Google</span>
        </button>
      </div>

      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>or enter manually</span>
        <div style={styles.dividerLine} />
      </div>

      <form onSubmit={handleIdentityContinue}>
        <div style={styles.formRow}>
          <div style={styles.formGroupInRow}>
            <label style={styles.label}>First Name</label>
            <input
              type="text"
              value={signupData.firstName}
              onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
              required
              placeholder="John"
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#31135D';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E7E0EC';
                e.target.style.backgroundColor = '#F7F2FA';
              }}
            />
          </div>
          <div style={styles.formGroupInRow}>
            <label style={styles.label}>Last Name</label>
            <input
              type="text"
              value={signupData.lastName}
              onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
              required
              placeholder="Smith"
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#31135D';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E7E0EC';
                e.target.style.backgroundColor = '#F7F2FA';
              }}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={signupData.email}
            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
            required
            placeholder="john@example.com"
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = '#31135D';
              e.target.style.backgroundColor = 'white';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E7E0EC';
              e.target.style.backgroundColor = '#F7F2FA';
            }}
          />
          <p style={styles.helperText}>We'll use this for login and important updates</p>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Birthday</label>
          <div style={styles.dateInputsRow}>
            <select
              value={signupData.birthMonth}
              onChange={(e) => setSignupData({ ...signupData, birthMonth: e.target.value })}
              style={styles.dateSelect}
            >
              <option value="">Month</option>
              {months.map((month, idx) => (
                <option key={month} value={idx + 1}>{month}</option>
              ))}
            </select>
            <select
              value={signupData.birthDay}
              onChange={(e) => setSignupData({ ...signupData, birthDay: e.target.value })}
              style={styles.dateSelect}
            >
              <option value="">Day</option>
              {getDaysInMonth(parseInt(signupData.birthMonth), parseInt(signupData.birthYear)).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <select
              value={signupData.birthYear}
              onChange={(e) => setSignupData({ ...signupData, birthYear: e.target.value })}
              style={styles.dateSelect}
            >
              <option value="">Year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <p style={styles.helperText}>Required for age verification</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            ...styles.buttonPrimary,
            ...(isLoading ? styles.buttonDisabled : {})
          }}
        >
          Continue
        </button>

        <button type="button" className="signup-modal-back-btn" style={styles.backBtn} onClick={goToUserType}>
          <ArrowLeftIcon /> Back
        </button>
      </form>
    </>
  );

  // Password View (Step 3) - Password creation with requirements
  const renderPasswordView = () => {
    // Password validation state
    const hasLength = signupData.password.length >= 8;
    const hasLetters = /[a-zA-Z]/.test(signupData.password);
    const hasNumbers = /[0-9]/.test(signupData.password);
    const hasMix = hasLetters && hasNumbers;
    const isValid = hasLength && hasMix;

    return (
      <>
        <div style={styles.logoContainer}>
          <img src={LOGO_URL} alt="Split Lease" style={styles.logo} />
        </div>

        <div style={styles.header}>
          <h1 style={styles.title}>Almost there, {signupData.firstName || 'there'}!</h1>
          <p style={styles.subtitle}>Create a password to secure your account</p>
        </div>

        <form onSubmit={handleSignupSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                required
                placeholder="Create a password"
                style={{ ...styles.input, ...styles.inputWithIcon }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#31135D';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E7E0EC';
                  e.target.style.backgroundColor = '#F7F2FA';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.togglePasswordBtn}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {/* Password requirements */}
            <div style={styles.passwordRequirements}>
              <div style={{
                ...styles.requirement,
                ...(hasLength ? styles.requirementMet : {})
              }}>
                <span style={styles.requirementIcon}>
                  {hasLength ? <CheckCircleIcon size={16} /> : <CircleIcon size={16} />}
                </span>
                <span>At least 8 characters</span>
              </div>
              <div style={{
                ...styles.requirement,
                ...styles.requirementLast,
                ...(hasMix ? styles.requirementMet : {})
              }}>
                <span style={styles.requirementIcon}>
                  {hasMix ? <CheckCircleIcon size={16} /> : <CircleIcon size={16} />}
                </span>
                <span>Mix of letters and numbers</span>
              </div>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <p style={styles.errorText}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !isValid}
            style={{
              ...styles.buttonPrimary,
              ...(isLoading || !isValid ? styles.buttonDisabled : {})
            }}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size={18} />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <p style={styles.termsText}>
            By creating an account, you agree to our{' '}
            <a href="/terms" target="_blank" style={{ color: '#31135D' }}>Terms of Service</a> and{' '}
            <a href="/privacy" target="_blank" style={{ color: '#31135D' }}>Privacy Policy</a>
          </p>

          <button type="button" className="signup-modal-back-btn" style={styles.backBtn} onClick={goToIdentity}>
            <ArrowLeftIcon /> Back
          </button>
        </form>
      </>
    );
  };

  const renderPasswordResetView = () => (
    <>
      <div style={styles.logoContainer}>
        <img src={LOGO_URL} alt="Split Lease" style={styles.logoImage} />
      </div>
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <KeyIcon />
        </div>
        <h2 style={styles.title}>Reset your password</h2>
        <p style={styles.subtitle}>Enter your email address and we'll send you a link to reset your password.</p>
      </div>

      <form onSubmit={handlePasswordReset}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email address</label>
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={styles.input}
            onFocus={(e) => e.target.style.borderColor = styles.colors.primary}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !resetEmail}
          style={{
            ...styles.buttonPrimary,
            ...(isLoading || !resetEmail ? styles.buttonDisabled : {})
          }}
        >
          {isLoading ? 'Sending reset link...' : 'Send reset link'}
        </button>

        <button
          type="button"
          onClick={goToMagicLink}
          disabled={isLoading}
          style={{
            ...styles.buttonSecondary,
            marginTop: '12px'
          }}
        >
          <MailIcon /> Send me a magic login link instead
        </button>

        <button type="button" className="signup-modal-back-btn" style={styles.backBtn} onClick={goToLogin}>
          <ArrowLeftIcon /> Back to login
        </button>
      </form>
    </>
  );

  const renderMagicLinkView = () => (
    <>
      <div style={styles.logoContainer}>
        <img src={LOGO_URL} alt="Split Lease" style={styles.logoImage} />
      </div>
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <MailIcon />
        </div>
        <h2 style={styles.title}>Magic link login</h2>
        <p style={styles.subtitle}>Enter your email and we'll send you a link to sign in instantly—no password needed.</p>
      </div>

      <form onSubmit={handleMagicLink}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email address</label>
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={styles.input}
            onFocus={(e) => e.target.style.borderColor = styles.colors.primary}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !resetEmail}
          style={{
            ...styles.buttonPrimary,
            ...(isLoading || !resetEmail ? styles.buttonDisabled : {})
          }}
        >
          {isLoading ? 'Sending magic link...' : 'Send magic link'}
        </button>

        <button type="button" className="signup-modal-back-btn" style={styles.backBtn} onClick={goToLogin}>
          <ArrowLeftIcon /> Back to login
        </button>
      </form>
    </>
  );

  const renderResetSentView = () => (
    <>
      <div style={styles.logoContainer}>
        <img src={LOGO_URL} alt="Split Lease" style={styles.logoImage} />
      </div>
      <div style={styles.header}>
        <div style={{ ...styles.headerIcon, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <CheckCircleIcon />
        </div>
        <h2 style={styles.title}>Check your email</h2>
        <p style={styles.subtitle}>
          We've sent a password reset link to <strong>{resetEmail}</strong>.
          Click the link in the email to reset your password.
        </p>
      </div>

      <button
        type="button"
        onClick={goToLogin}
        style={styles.buttonPrimary}
      >
        Return to login
      </button>

      <p style={{ ...styles.linkText, marginTop: '16px' }}>
        Didn't receive the email?{' '}
        <button type="button" onClick={handlePasswordReset} style={styles.link} disabled={isLoading}>
          {isLoading ? 'Resending...' : 'Resend'}
        </button>
      </p>
    </>
  );

  const renderMagicLinkSentView = () => (
    <>
      <div style={styles.logoContainer}>
        <img src={LOGO_URL} alt="Split Lease" style={styles.logoImage} />
      </div>
      <div style={styles.header}>
        <div style={{ ...styles.headerIcon, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <CheckCircleIcon />
        </div>
        <h2 style={styles.title}>Magic link sent!</h2>
        <p style={styles.subtitle}>
          We've sent a magic login link to <strong>{resetEmail}</strong>.
          Click the link in the email to sign in instantly.
        </p>
      </div>

      <button
        type="button"
        onClick={goToLogin}
        style={styles.buttonPrimary}
      >
        Return to login
      </button>

      <p style={{ ...styles.linkText, marginTop: '16px' }}>
        Didn't receive the email?{' '}
        <button type="button" onClick={handleMagicLink} style={styles.link} disabled={isLoading}>
          {isLoading ? 'Resending...' : 'Resend'}
        </button>
      </p>
    </>
  );

  const renderSuccessView = () => (
    <>
      <div style={styles.logoContainer}>
        <img src={LOGO_URL} alt="Split Lease" style={styles.logoImage} />
      </div>
      <div style={styles.header}>
        <div style={{ ...styles.headerIcon, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <CheckCircleIcon />
        </div>
        <h2 style={styles.title}>You're all set!</h2>
        <p style={styles.subtitle}>
          Your account has been created successfully. Welcome to Split Lease!
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={styles.buttonPrimary}
      >
        Get started
      </button>
    </>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <>
      <div
        className="signup-modal-overlay"
        style={styles.overlay}
        onClick={handleOverlayClick}
      >
        <div
          className="signup-modal-container"
          style={styles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile grab handle - Protocol Section 1 */}
          <div className="signup-modal-grab-handle" style={styles.grabHandle} aria-hidden="true" />

          {/* Close button */}
          {!disableClose && (
            <button
              className="signup-modal-close-btn"
              style={styles.closeBtn}
              onClick={onClose}
              aria-label="Close modal"
            >
              <CloseIcon size={32} />
            </button>
          )}

          {/* Scrollable content area */}
          <div style={styles.modalContent}>
            {/* Render current view */}
            {currentView === VIEWS.ENTRY && renderEntryView()}
            {currentView === VIEWS.USER_TYPE && renderUserTypeView()}
            {currentView === VIEWS.IDENTITY && renderIdentityView()}
            {currentView === VIEWS.PASSWORD && renderPasswordView()}
            {currentView === VIEWS.LOGIN && renderLoginView()}
            {currentView === VIEWS.PASSWORD_RESET && renderPasswordResetView()}
            {currentView === VIEWS.MAGIC_LINK && renderMagicLinkView()}
            {currentView === VIEWS.RESET_SENT && renderResetSentView()}
            {currentView === VIEWS.MAGIC_LINK_SENT && renderMagicLinkSentView()}
            {currentView === VIEWS.SUCCESS && renderSuccessView()}
          </div>
        </div>
      </div>

      {/* Toast notifications (rendered here as fallback when no ToastProvider) */}
      {toasts && toasts.length > 0 && <Toast toasts={toasts} onRemove={removeToast} />}

      {/* Duplicate email confirmation modal */}
      {duplicateEmailData.showModal && (
        <div className="signup-modal-overlay" style={styles.overlay} onClick={() => setDuplicateEmailData({ email: '', showModal: false })}>
          <div className="signup-modal-container" style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className="signup-modal-grab-handle" style={styles.grabHandle} aria-hidden="true" />
            <button
              className="signup-modal-close-btn"
              style={styles.closeBtn}
              onClick={() => setDuplicateEmailData({ email: '', showModal: false })}
              aria-label="Close modal"
            >
              <CloseIcon size={32} />
            </button>

            <div style={styles.logoContainer}>
              <img src={LOGO_URL} alt="Split Lease" style={styles.logo} />
            </div>

            <div style={styles.header}>
              <h1 style={styles.title}>Account Already Exists</h1>
              <p style={styles.subtitle}>
                An account with <strong>{duplicateEmailData.email}</strong> already exists.
              </p>
            </div>

            <p style={{ ...styles.helperText, textAlign: 'center', marginBottom: '20px' }}>
              Would you like to log in to your existing account instead?
            </p>

            <button
              type="button"
              style={styles.buttonPrimary}
              onClick={() => {
                setDuplicateEmailData({ email: '', showModal: false });
                setLoginData({ ...loginData, email: duplicateEmailData.email });
                goToLogin();
              }}
            >
              Log in instead
            </button>

            <button
              type="button"
              style={{ ...styles.buttonSecondary, marginTop: '12px' }}
              onClick={() => setDuplicateEmailData({ email: '', showModal: false })}
            >
              Try a different email
            </button>
          </div>
        </div>
      )}

      {/* User not found modal (for OAuth login when account doesn't exist) */}
      {userNotFoundData.showModal && (
        <div className="signup-modal-overlay" style={styles.overlay} onClick={() => setUserNotFoundData({ email: '', showModal: false })}>
          <div className="signup-modal-container" style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className="signup-modal-grab-handle" style={styles.grabHandle} aria-hidden="true" />
            <button
              className="signup-modal-close-btn"
              style={styles.closeBtn}
              onClick={() => setUserNotFoundData({ email: '', showModal: false })}
              aria-label="Close modal"
            >
              <CloseIcon size={32} />
            </button>

            <div style={styles.logoContainer}>
              <img src={LOGO_URL} alt="Split Lease" style={styles.logo} />
            </div>

            <div style={styles.header}>
              <h1 style={styles.title}>No Account Found</h1>
              <p style={styles.subtitle}>
                We couldn't find an account with <strong>{userNotFoundData.email}</strong>.
              </p>
            </div>

            <p style={{ ...styles.helperText, textAlign: 'center', marginBottom: '20px' }}>
              Would you like to create a new account instead?
            </p>

            <button
              type="button"
              style={styles.buttonPrimary}
              onClick={() => {
                setUserNotFoundData({ email: '', showModal: false });
                // Pre-fill signup data with the email from LinkedIn
                setSignupData({ ...signupData, email: userNotFoundData.email });
                goToUserType();
              }}
            >
              Sign up instead
            </button>

            <button
              type="button"
              style={{ ...styles.buttonSecondary, marginTop: '12px' }}
              onClick={() => {
                setUserNotFoundData({ email: '', showModal: false });
                goToLogin();
              }}
            >
              Try a different login method
            </button>
          </div>
        </div>
      )}
    </>
  );
}
