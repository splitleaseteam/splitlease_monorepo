import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  checkAuthStatus,
  validateTokenAndFetchUser,
  getUserType,
  getUserId,
  getFirstName
} from '../lib/auth.js';
import { isHost } from '../logic/rules/users/isHost.js';
import { isGuest } from '../logic/rules/users/isGuest.js';

/**
 * useAuthenticatedPage - Consolidated auth guard for protected pages.
 *
 * Replaces the 40+ line three-step auth check pattern (token -> session -> fallback)
 * that is duplicated across every protected page's logic hook.
 *
 * Implements the Gold Standard Auth Pattern:
 *   Step 1: checkAuthStatus() lightweight check
 *   Step 2: validateTokenAndFetchUser({ clearOnFailure: false }) deep validation
 *   Step 3: supabase.auth.getSession() fallback to session metadata
 *
 * @param {Object} [options]
 * @param {'guest'|'host'|'any'} [options.requiredRole='any'] - Role required to access page.
 *   'guest' checks isGuest(), 'host' checks isHost(), 'any' allows both.
 * @param {string} [options.redirectUrl='/'] - Where to redirect on auth failure.
 * @param {boolean} [options.autoRedirect=true] - Whether to automatically redirect on failure.
 *   Set to false if you want to handle redirects manually.
 *
 * @returns {{
 *   authState: { isChecking: boolean, isAuthenticated: boolean, shouldRedirect: boolean, redirectReason: string|null },
 *   user: { id: string, firstName: string, email: string, userType: string, avatarUrl: string|null }|null,
 *   isAuthChecking: boolean
 * }}
 *
 * @example
 * // Guest-only page
 * export function useGuestProposalsPageLogic() {
 *   const { authState, user, isAuthChecking } = useAuthenticatedPage({ requiredRole: 'guest' });
 *
 *   // Fetch data only after auth passes
 *   const { data: proposals, isLoading } = useSupabaseQuery(
 *     async (sb) => { ... },
 *     { enabled: authState.isAuthenticated && !isAuthChecking }
 *   );
 *
 *   return {
 *     authState,
 *     isLoading: isAuthChecking || isLoading,
 *     ...
 *   };
 * }
 *
 * @example
 * // Host-only page
 * const { authState, user } = useAuthenticatedPage({ requiredRole: 'host' });
 *
 * @example
 * // Any authenticated user (no role check)
 * const { authState, user } = useAuthenticatedPage();
 */
export function useAuthenticatedPage(options = {}) {
  const {
    requiredRole = 'any',
    redirectUrl = '/',
    autoRedirect = true,
  } = options;

  const [authState, setAuthState] = useState({
    isChecking: true,
    isAuthenticated: false,
    shouldRedirect: false,
    redirectReason: null,
  });

  const [user, setUser] = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    async function performAuthCheck() {
      try {
        // ====================================================================
        // Step 1: Lightweight auth check (tokens/cookies exist)
        // ====================================================================
        const isLoggedIn = await checkAuthStatus();

        if (!isLoggedIn) {
          handleAuthFailure('NOT_AUTHENTICATED');
          return;
        }

        // ====================================================================
        // Step 2: Deep validation with clearOnFailure: false
        // ====================================================================
        const userData = await validateTokenAndFetchUser({ clearOnFailure: false });

        let userType = null;
        let resolvedUser = null;

        if (userData) {
          userType = userData.userType || userData['User Type'];
          resolvedUser = {
            id: userData.userId || userData._id || userData.id,
            firstName: userData.firstName || userData.fullName || '',
            email: userData.email || '',
            userType: userType,
            avatarUrl: userData.profilePhoto || null,
          };
        } else {
          // ==================================================================
          // Step 3: Fallback to Supabase session metadata
          // ==================================================================
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            userType = session.user.user_metadata?.user_type || getUserType() || null;

            if (!userType) {
              handleAuthFailure('USER_TYPE_UNKNOWN');
              return;
            }

            resolvedUser = {
              id: session.user.user_metadata?.user_id || getUserId() || session.user.id,
              firstName: session.user.user_metadata?.first_name || getFirstName() || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              userType: userType,
              avatarUrl: session.user.user_metadata?.avatar_url || null,
            };
          } else {
            handleAuthFailure('TOKEN_INVALID');
            return;
          }
        }

        // ====================================================================
        // Role check
        // ====================================================================
        if (requiredRole === 'host' && !isHost({ userType })) {
          handleAuthFailure('NOT_HOST');
          return;
        }

        if (requiredRole === 'guest' && !isGuest({ userType })) {
          handleAuthFailure('NOT_GUEST');
          return;
        }

        // ====================================================================
        // Success
        // ====================================================================
        if (mountedRef.current) {
          setUser(resolvedUser);
          setAuthState({
            isChecking: false,
            isAuthenticated: true,
            shouldRedirect: false,
            redirectReason: null,
          });
        }
      } catch (err) {
        console.error('[useAuthenticatedPage] Auth check failed:', err);
        handleAuthFailure('AUTH_ERROR');
      }
    }

    function handleAuthFailure(reason) {
      if (!mountedRef.current) return;

      setUser(null);
      setAuthState({
        isChecking: false,
        isAuthenticated: false,
        shouldRedirect: true,
        redirectReason: reason,
      });

      if (autoRedirect) {
        window.location.href = redirectUrl;
      }
    }

    performAuthCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiredRole, redirectUrl, autoRedirect]);

  return {
    authState,
    user,
    isAuthChecking: authState.isChecking,
  };
}

export default useAuthenticatedPage;
