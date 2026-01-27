/**
 * QR Code Landing Page Styles
 *
 * Inline styles for the QR Code Landing Page component.
 * Follows Split Lease brand colors and typography guidelines.
 *
 * @module qrCodeLandingStyles
 */

/**
 * Core page styles
 */
export const styles = {
  // Main container
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    backgroundColor: '#FAFAFA',
  },

  // Content card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    padding: '32px',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
  },

  // Welcome header
  welcomeText: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#6B4EFF',
    marginBottom: '8px',
    marginTop: 0,
  },

  // Use case label
  useCaseText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: '24px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // Visual divider
  divider: {
    height: '1px',
    backgroundColor: '#E5E7EB',
    width: '100%',
    margin: '24px 0',
  },

  // Information box
  infoBox: {
    backgroundColor: '#F3F0FF',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'left',
  },

  // Information text
  infoText: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#374151',
    margin: 0,
  },

  // Primary button
  button: {
    backgroundColor: '#6B4EFF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '9999px',
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    width: '100%',
  },

  // Button hover state
  buttonHover: {
    backgroundColor: '#5A3FE0',
  },

  // Button disabled state
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
    cursor: 'not-allowed',
  },

  // Split Lease logo
  logo: {
    marginTop: '32px',
    width: '140px',
    height: 'auto',
  },

  // Loading state container
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    backgroundColor: '#FAFAFA',
  },

  // Loading spinner
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #E5E7EB',
    borderTopColor: '#6B4EFF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  // Loading text
  loadingText: {
    marginTop: '16px',
    color: '#6B7280',
    fontSize: '14px',
  },

  // Error state container
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
  },

  // Error icon
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },

  // Error title
  errorTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: '8px',
  },

  // Error message
  errorMessage: {
    fontSize: '14px',
    color: '#6B7280',
    maxWidth: '300px',
  },
};

/**
 * Use case specific configuration
 * Maps use case values to display properties
 */
export const useCaseConfig = {
  check_in: {
    icon: '🏠',
    color: '#10B981',
    displayText: 'Check In',
  },
  check_out: {
    icon: '👋',
    color: '#F59E0B',
    displayText: 'Check Out',
  },
  emergency: {
    icon: '🚨',
    color: '#DC2626',
    displayText: 'Emergency',
  },
  general_info: {
    icon: 'ℹ️',
    color: '#6B4EFF',
    displayText: 'Property Info',
  },
};

/**
 * CSS keyframes for spinner animation
 * Injected into page via style tag
 */
export const spinnerKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
