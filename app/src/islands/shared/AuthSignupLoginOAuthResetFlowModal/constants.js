// View states for the auth modal flow
export const VIEWS = {
  // Entry point
  ENTRY: 'entry',
  // Signup flow
  USER_TYPE: 'user-type',       // Step 1: Guest/Host selection
  IDENTITY: 'identity',         // Step 2: Name, email, birthday (+ LinkedIn/Google)
  PASSWORD: 'password',         // Step 3: Password creation
  // Login flow
  LOGIN: 'login',
  // Password/Magic link flows
  PASSWORD_RESET: 'password-reset',
  RESET_SENT: 'reset-sent',
  MAGIC_LINK: 'magic-link',
  MAGIC_LINK_SENT: 'magic-link-sent',
  // Success
  SUCCESS: 'success',
  // Legacy aliases (for backward compatibility with initialView prop)
  INITIAL: 'entry',
  SIGNUP_STEP1: 'user-type',
  SIGNUP_STEP2: 'identity'
};

export const USER_TYPES = {
  HOST: 'Host',
  GUEST: 'Guest'
};

// Protocol Color Constants
export const COLORS = {
  primaryPurple: '#31135D',      // Protocol: Primary Purple
  positivePurple: '#5B5FCF',     // Protocol: Positive/Action Purple (replaces green)
  secondaryPurple: '#6D31C2',    // Protocol: Secondary Purple (accents)
  lightPurpleBg: '#F7F2FA',      // Protocol: Light Purple Background
  emergencyRed: '#DC3545',       // Protocol: Emergency Red (outlined only)
  border: '#E7E0EC',             // Protocol: Standard border
  textPrimary: '#1a1a1a',
  textSecondary: '#49454F',      // Protocol: Ghost text color
  textMuted: '#6b7280',
  white: '#ffffff'
};

// Split Lease logo URL
export const LOGO_URL = '/assets/images/split-lease-purple-circle.png';
