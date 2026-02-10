/**
 * Split Lease Authentication - Barrel Export
 *
 * Re-exports all auth functions from focused subdirectory modules.
 * This is the single source of truth for all auth imports:
 *   import { checkAuthStatus } from '../lib/auth/index.js'
 *
 * Module inventory:
 *
 * Module inventory:
 *   cookies.js         - Cookie parsing, username from cookies
 *   login.js           - Email/password login, LinkedIn OAuth login, redirects, URL auth errors
 *   logout.js          - User logout
 *   signup.js          - Email/password signup, LinkedIn OAuth signup
 *   session.js         - Session validation, auth data clearing, user info getters, auth check attempts
 *   tokenValidation.js - Auth status checking, token validation + user fetch, token management, protected page check
 *   passwordReset.js   - Password reset request and update
 *   googleOAuth.js     - Google OAuth signup and login flows
 */

// ============================================================================
// cookies.js - Cookie parsing and username utilities
// ============================================================================
export {
  getUsernameFromCookies,
  checkSplitLeaseCookies,
  getCurrentUsername,
  storeCurrentUsername,
  getStoredUsername,
} from './cookies.js';

// ============================================================================
// tokenValidation.js - Auth status, token management, validation
// ============================================================================
export {
  // Auth status checking
  checkAuthStatus,
  validateTokenAndFetchUser,
  isProtectedPage,

  // Token management
  getAuthToken,
  setAuthToken,
  getSessionId,
  setSessionId,

  // Internal state helpers (used by other auth/ modules; not in monolith's public API)
  getIsUserLoggedIn,
  setIsUserLoggedIn,
} from './tokenValidation.js';

// ============================================================================
// session.js - Session validation, user info, auth check attempts
// ============================================================================
export {
  // Session validation
  isSessionValid,
  clearAuthData,

  // User information getters
  getUserId,
  getUserType,
  setUserType,
  getFirstName,
  getAvatarUrl,

  // Auth check attempt tracking
  incrementAuthCheckAttempts,
  getAuthCheckAttempts,
  hasExceededMaxAuthAttempts,
  resetAuthCheckAttempts,
} from './session.js';

// ============================================================================
// login.js - Email/password login, LinkedIn OAuth login, redirects, URL errors
// ============================================================================
export {
  loginUser,
  redirectToLogin,
  redirectToAccountProfile,

  // LinkedIn OAuth login
  initiateLinkedInOAuthLogin,
  handleLinkedInOAuthLoginCallback,

  // URL auth error detection (magic link / OTP errors)
  checkUrlForAuthError,
  clearAuthErrorFromUrl,
} from './login.js';

// ============================================================================
// logout.js - User logout
// ============================================================================
export {
  logoutUser,
} from './logout.js';

// ============================================================================
// signup.js - Email/password signup, LinkedIn OAuth signup
// ============================================================================
export {
  signupUser,

  // LinkedIn OAuth signup
  initiateLinkedInOAuth,
  handleLinkedInOAuthCallback,
} from './signup.js';

// ============================================================================
// passwordReset.js - Password reset request and update
// ============================================================================
export {
  requestPasswordReset,
  updatePassword,
} from './passwordReset.js';

// ============================================================================
// googleOAuth.js - Google OAuth signup and login flows
// ============================================================================
export {
  // Google OAuth signup
  initiateGoogleOAuth,
  handleGoogleOAuthCallback,

  // Google OAuth login
  initiateGoogleOAuthLogin,
  handleGoogleOAuthLoginCallback,
} from './googleOAuth.js';
