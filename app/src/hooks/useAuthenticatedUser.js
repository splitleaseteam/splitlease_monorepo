import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  checkAuthStatus,
  validateTokenAndFetchUser,
  getSessionId,
  getUserId,
  getFirstName,
  getUserType
} from '../lib/auth/index.js';
import { isGuest } from '../logic/rules/users/isGuest.js';
import { isHost } from '../logic/rules/users/isHost.js';
import { logger } from '../lib/logger.js';

/**
 * Gold Standard Auth Pattern - consolidated hook for ALL protected pages.
 *
 * 4-step auth flow:
 *   0. checkAuthStatus()            — lightweight cookie/token/session existence check
 *   1. validateTokenAndFetchUser()  — deep validation + profile fetch (clearOnFailure: false)
 *   2. Supabase session fallback    — use session metadata if profile fetch failed
 *   3. No auth found               — redirect or return null
 *
 * Replaces the 60-120 line auth blocks that were copy-pasted into each page hook.
 *
 * @param {Object} options
 * @param {boolean} options.requireGuest  - Redirect if user is not a Guest
 * @param {boolean} options.requireHost   - Redirect if user is not a Host
 * @param {'guest'|'host'|'any'} options.requiredRole - Convenience alias for requireGuest/requireHost
 * @param {string|null} options.redirectOnFail - URL to redirect on auth/role failure (null = no redirect)
 * @returns {{ user: object|null, userId: string|null, isLoading: boolean, error: Error|null, isAuthenticated: boolean, redirectReason: string|null }}
 */
export function useAuthenticatedUser({
  requireGuest = false,
  requireHost = false,
  requiredRole,
  redirectOnFail = null
} = {}) {
  // Map requiredRole convenience option to boolean flags
  if (requiredRole === 'guest') requireGuest = true;
  if (requiredRole === 'host') requireHost = true;

  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirectReason, setRedirectReason] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const authenticate = async () => {
      try {
        logger.debug('[useAuthenticatedUser] Starting auth check...', { requireGuest, requireHost, redirectOnFail });
        // ==================================================================
        // Step 0: Lightweight auth check (cookies, tokens, session existence)
        // ==================================================================
        const hasAuth = await checkAuthStatus();
        logger.debug('[useAuthenticatedUser] Step 0 checkAuthStatus:', hasAuth);

        if (!hasAuth) {
          if (cancelled) return;
          logger.debug('[useAuthenticatedUser] FAIL: Not authenticated, redirecting to', redirectOnFail);
          setRedirectReason('NOT_AUTHENTICATED');
          if (redirectOnFail) { window.location.href = redirectOnFail; return; }
          setUser(null);
          setUserId(null);
          setIsLoading(false);
          return;
        }

        // ==================================================================
        // Step 1: Deep token validation (clearOnFailure: false preserves session)
        // ==================================================================
        const userData = await validateTokenAndFetchUser({ clearOnFailure: false });
        const sessionId = getSessionId();
        logger.debug('[useAuthenticatedUser] Step 1 validateTokenAndFetchUser:', userData ? 'got user' : 'null', 'sessionId:', sessionId);

        if (userData) {
          const finalUserId = sessionId || userData.userId;
          const userType = userData.userType || getUserType() || '';
          logger.debug('[useAuthenticatedUser] Step 1 userType:', JSON.stringify(userType), 'roleCheck:', passesRoleCheck(userType, requireGuest, requireHost));

          if (!passesRoleCheck(userType, requireGuest, requireHost)) {
            if (cancelled) return;
            logger.debug('[useAuthenticatedUser] FAIL: Role check failed. userType:', JSON.stringify(userType), 'requireGuest:', requireGuest, 'requireHost:', requireHost);
            setRedirectReason(requireHost ? 'NOT_HOST' : 'NOT_GUEST');
            if (redirectOnFail) { window.location.href = redirectOnFail; return; }
            setUser(null);
            setUserId(null);
            setIsLoading(false);
            return;
          }

          if (cancelled) return;
          const userObj = {
            id: finalUserId,
            firstName: userData.firstName || '',
            fullName: userData.fullName || '',
            email: userData.email || '',
            userType,
            profilePhoto: userData.profilePhoto || null,
            accountHostId: userData.accountHostId || finalUserId,
            proposalCount: userData.proposalCount ?? 0,
            hasSubmittedRentalApp: userData.hasSubmittedRentalApp ?? false,
            phoneNumber: userData.phoneNumber || null,
          };
          setUser(userObj);
          setUserId(finalUserId);
          setIsLoading(false);
          return;
        }

        // ==================================================================
        // Step 2: Fallback to Supabase session metadata
        // ==================================================================
        const { data: { session } } = await supabase.auth.getSession();

        logger.debug('[useAuthenticatedUser] Step 2 Supabase session:', session ? 'found' : 'null');
        if (session?.user) {
          const finalUserId = session.user.user_metadata?.user_id || getUserId() || session.user.id;
          const userType = session.user.user_metadata?.user_type || getUserType() || '';
          logger.debug('[useAuthenticatedUser] Step 2 userType:', JSON.stringify(userType), 'metadata:', JSON.stringify(session.user.user_metadata));

          if (!passesRoleCheck(userType, requireGuest, requireHost)) {
            if (cancelled) return;
            setRedirectReason(requireHost ? 'NOT_HOST' : 'NOT_GUEST');
            if (redirectOnFail) { window.location.href = redirectOnFail; return; }
            setUser(null);
            setUserId(null);
            setIsLoading(false);
            return;
          }

          if (cancelled) return;
          const userObj = {
            id: finalUserId,
            firstName: session.user.user_metadata?.first_name || getFirstName() || '',
            fullName: session.user.user_metadata?.full_name || '',
            email: session.user.email || '',
            userType,
            profilePhoto: session.user.user_metadata?.avatar_url || null,
            accountHostId: finalUserId,
            proposalCount: 0,
            hasSubmittedRentalApp: false,
            phoneNumber: null,
          };
          setUser(userObj);
          setUserId(finalUserId);
          setIsLoading(false);
          return;
        }

        // ==================================================================
        // Step 3: No auth found
        // ==================================================================
        if (cancelled) return;
        logger.debug('[useAuthenticatedUser] FAIL: Step 3 - no auth found at all');
        setRedirectReason('TOKEN_INVALID');
        if (redirectOnFail) { window.location.href = redirectOnFail; return; }
        setUser(null);
        setUserId(null);
        setIsLoading(false);
      } catch (err) {
        logger.error('[useAuthenticatedUser] Authentication error:', err);
        if (cancelled) return;
        setRedirectReason('AUTH_ERROR');
        setError(err);
        setUser(null);
        setUserId(null);
        setIsLoading(false);
      }
    };

    authenticate();
    return () => { cancelled = true; };
  }, []);

  return { user, userId, isLoading, error, isAuthenticated: !!user, redirectReason };
}

function passesRoleCheck(userType, requireGuest, requireHost) {
  if (requireGuest && !isGuest({ userType })) return false;
  if (requireHost && !isHost({ userType })) return false;
  return true;
}
