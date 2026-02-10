import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  checkAuthStatus,
  validateTokenAndFetchUser,
  getSessionId,
  getUserId,
  getFirstName,
  getUserType
} from '../lib/auth.js';
import { isGuest } from '../logic/rules/users/isGuest.js';
import { isHost } from '../logic/rules/users/isHost.js';

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
 * @param {string|null} options.redirectOnFail - URL to redirect on auth/role failure (null = no redirect)
 * @returns {{ user: object|null, userId: string|null, loading: boolean, error: Error|null, isAuthenticated: boolean }}
 */
export function useAuthenticatedUser({ requireGuest = false, requireHost = false, redirectOnFail = null } = {}) {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const authenticate = async () => {
      try {
        // ==================================================================
        // Step 0: Lightweight auth check (cookies, tokens, session existence)
        // ==================================================================
        const hasAuth = await checkAuthStatus();

        if (!hasAuth) {
          if (cancelled) return;
          if (redirectOnFail) { window.location.href = redirectOnFail; return; }
          setUser(null);
          setUserId(null);
          setLoading(false);
          return;
        }

        // ==================================================================
        // Step 1: Deep token validation (clearOnFailure: false preserves session)
        // ==================================================================
        const userData = await validateTokenAndFetchUser({ clearOnFailure: false });
        const sessionId = getSessionId();

        if (userData) {
          const finalUserId = sessionId || userData.userId;
          const userType = userData.userType || getUserType() || '';

          if (!passesRoleCheck(userType, requireGuest, requireHost)) {
            if (cancelled) return;
            if (redirectOnFail) { window.location.href = redirectOnFail; return; }
            setUser(null);
            setUserId(null);
            setLoading(false);
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
          setLoading(false);
          return;
        }

        // ==================================================================
        // Step 2: Fallback to Supabase session metadata
        // ==================================================================
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const finalUserId = session.user.user_metadata?.user_id || getUserId() || session.user.id;
          const userType = session.user.user_metadata?.user_type || getUserType() || '';

          if (!passesRoleCheck(userType, requireGuest, requireHost)) {
            if (cancelled) return;
            if (redirectOnFail) { window.location.href = redirectOnFail; return; }
            setUser(null);
            setUserId(null);
            setLoading(false);
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
          setLoading(false);
          return;
        }

        // ==================================================================
        // Step 3: No auth found
        // ==================================================================
        if (cancelled) return;
        if (redirectOnFail) { window.location.href = redirectOnFail; return; }
        setUser(null);
        setUserId(null);
        setLoading(false);
      } catch (err) {
        console.error('[useAuthenticatedUser] Authentication error:', err);
        if (cancelled) return;
        setError(err);
        setUser(null);
        setUserId(null);
        setLoading(false);
      }
    };

    authenticate();
    return () => { cancelled = true; };
  }, []);

  return { user, userId, loading, error, isAuthenticated: !!user };
}

function passesRoleCheck(userType, requireGuest, requireHost) {
  if (requireGuest && !isGuest({ userType })) return false;
  if (requireHost && !isHost({ userType })) return false;
  return true;
}
