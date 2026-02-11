/**
 * Split Lease Authentication - Google OAuth
 * Handles Google OAuth signup and login flows
 *
 * Mirrors the Google OAuth functions from the monolithic lib/auth.js.
 * Follows the same pattern as LinkedIn OAuth in signup.js and login.js.
 */

import { supabase } from '../supabase.js';
import { logger } from '../logger.js';
import {
  setAuthToken as setSecureAuthToken,
  setSessionId as setSecureSessionId,
  setAuthState,
  setGoogleOAuthUserType,
  getGoogleOAuthUserType,
  clearGoogleOAuthUserType,
  setGoogleOAuthLoginFlow,
  getGoogleOAuthLoginFlow,
  clearGoogleOAuthLoginFlow,
} from '../secureStorage.js';
import { setUserType } from './session.js';

// ============================================================================
// Google OAuth Signup
// ============================================================================

/**
 * Initiate Google OAuth signup flow
 * Stores user type in localStorage before redirecting to Google
 *
 * @param {string} userType - 'Host' or 'Guest'
 * @returns {Promise<Object>} Result with success status or error
 */
export async function initiateGoogleOAuth(userType) {
  logger.info('[Auth] Initiating Google OAuth with userType:', userType);

  // Store user type before redirect
  setGoogleOAuthUserType(userType);

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/account-profile`,
        scopes: 'openid profile email',
      }
    });

    if (error) {
      clearGoogleOAuthUserType();
      return { success: false, error: error.message };
    }

    // OAuth redirect will happen automatically
    return { success: true, data };
  } catch (err) {
    clearGoogleOAuthUserType();
    return { success: false, error: err.message };
  }
}

/**
 * Handle Google OAuth callback after redirect
 * Creates user record if new user, or links accounts if existing
 *
 * @returns {Promise<Object>} Result with user data or error
 */
export async function handleGoogleOAuthCallback() {
  logger.info('[Auth] Handling Google OAuth callback');

  // Get the session from OAuth callback
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    clearGoogleOAuthUserType();
    return {
      success: false,
      error: sessionError?.message || 'No session found after OAuth'
    };
  }

  // Check if this is a fresh OAuth session (from Google)
  const user = session.user;
  const isGoogleProvider =
    user?.app_metadata?.provider === 'google' ||
    user?.app_metadata?.providers?.includes('google');

  if (!isGoogleProvider) {
    return { success: false, error: 'Not a Google OAuth session' };
  }

  // Retrieve stored user type
  const userType = getGoogleOAuthUserType() || 'Guest';

  // Extract Google data from user_metadata
  const googleData = {
    email: user.email,
    firstName: user.user_metadata?.given_name || user.user_metadata?.first_name || '',
    lastName: user.user_metadata?.family_name || user.user_metadata?.last_name || '',
    profilePhoto: user.user_metadata?.picture || user.user_metadata?.avatar_url || null,
    supabaseUserId: user.id,
  };

  logger.info('[Auth] Google data:', googleData);
  logger.info('[Auth] Stored userType:', userType);

  // Call Edge Function to create/link user record
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'oauth_signup',
        payload: {
          ...googleData,
          userType,
          provider: 'google',
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      clearGoogleOAuthUserType();
      return {
        success: false,
        error: data.error || 'Failed to create user record',
        isDuplicate: data.isDuplicate || false,
        existingEmail: data.existingEmail || null,
      };
    }

    // Clear OAuth storage keys
    clearGoogleOAuthUserType();

    // DEBUG: Log what we received from Edge Function
    logger.info('[Auth] Edge Function response:', JSON.stringify(data.data, null, 2));
    logger.info('[Auth] user_id from Edge Function:', data.data.user_id);
    logger.info('[Auth] supabase_user_id:', data.data.supabase_user_id);
    logger.info('[Auth] Supabase session user.id:', session.user.id);

    // Store session data
    setSecureAuthToken(session.access_token);
    setSecureSessionId(data.data.user_id);
    setAuthState(true, data.data.user_id);
    if (userType) {
      setUserType(userType);
    }

    return {
      success: true,
      data: data.data,
      isNewUser: data.data.isNewUser,
    };

  } catch (err) {
    clearGoogleOAuthUserType();
    return { success: false, error: err.message };
  }
}

// ============================================================================
// Google OAuth Login
// ============================================================================

/**
 * Initiate Google OAuth login flow
 * Sets login flow flag and redirects to current page after OAuth
 *
 * @returns {Promise<Object>} Result with success status or error
 */
export async function initiateGoogleOAuthLogin() {
  logger.info('[Auth] Initiating Google OAuth Login');

  // Clear any existing signup flow flags to prevent conflicts
  clearGoogleOAuthUserType();

  // Set login flow flag before redirect
  setGoogleOAuthLoginFlow(true);

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Stay on current page after OAuth (no redirect to profile)
        // Use origin + pathname + search to avoid trailing # in URL which causes ##access_token double-hash bug
        redirectTo: window.location.origin + window.location.pathname + window.location.search,
        scopes: 'openid profile email',
      }
    });

    if (error) {
      clearGoogleOAuthLoginFlow();
      return { success: false, error: error.message };
    }

    // OAuth redirect will happen automatically
    return { success: true, data };
  } catch (err) {
    clearGoogleOAuthLoginFlow();
    return { success: false, error: err.message };
  }
}

/**
 * Handle Google OAuth login callback
 * Verifies user exists in database, returns session data or error
 *
 * @returns {Promise<Object>} Result with user data or error (userNotFound: true if account doesn't exist)
 */
export async function handleGoogleOAuthLoginCallback() {
  logger.info('[Auth] Handling Google OAuth Login callback');

  // Verify this is a login flow
  if (!getGoogleOAuthLoginFlow()) {
    logger.info('[Auth] Not a login flow callback, skipping');
    return { success: false, error: 'Not a login flow' };
  }

  try {
    // Get the session from OAuth callback
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      clearGoogleOAuthLoginFlow();
      return {
        success: false,
        error: sessionError?.message || 'No session found after OAuth'
      };
    }

    // Check if this is a fresh OAuth session (from Google)
    const user = session.user;
    const isGoogleProvider =
      user?.app_metadata?.provider === 'google' ||
      user?.app_metadata?.providers?.includes('google');

    if (!isGoogleProvider) {
      clearGoogleOAuthLoginFlow();
      return { success: false, error: 'Not a Google OAuth session' };
    }

    // Extract Google data
    const email = user.email;
    const supabaseUserId = user.id;

    logger.info('[Auth] Google OAuth login data:', { email, supabaseUserId });

    // Call Edge Function to verify user exists
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'oauth_login',
        payload: {
          email,
          supabaseUserId,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }
      })
    });

    const data = await response.json();

    // Always clear the login flow flag
    clearGoogleOAuthLoginFlow();

    if (!response.ok || !data.success) {
      // Check if user was not found
      if (data.data?.userNotFound) {
        logger.info('[Auth] User not found for OAuth login:', email);
        return {
          success: false,
          userNotFound: true,
          email: email,
          error: 'No account found with this email'
        };
      }

      return {
        success: false,
        error: data.error || 'Failed to login'
      };
    }

    // Store session data
    const { user_id, user_type, supabase_user_id, access_token, refresh_token } = data.data;

    setSecureAuthToken(session.access_token);
    setSecureSessionId(user_id);
    setAuthState(true, user_id);
    if (user_type) {
      setUserType(user_type);
    }

    // Store Supabase user ID for reference
    if (supabase_user_id) {
      localStorage.setItem('splitlease_supabase_user_id', supabase_user_id);
    }

    logger.info('[Auth] Google OAuth login successful');
    return {
      success: true,
      data: data.data
    };

  } catch (err) {
    clearGoogleOAuthLoginFlow();
    logger.error('[Auth] Google OAuth login callback error:', err);
    return { success: false, error: err.message };
  }
}
