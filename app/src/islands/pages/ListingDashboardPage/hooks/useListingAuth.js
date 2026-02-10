import { useAuthenticatedUser } from '../../../../hooks/useAuthenticatedUser.js';

/**
 * Hook for handling authentication state and current user data.
 * Wraps useAuthenticatedUser and maps to the shape listing dashboard hooks expect.
 */
export function useListingAuth() {
  const { user: authUser, userId, loading, error, isAuthenticated } = useAuthenticatedUser({
    redirectOnFail: '/?login=true'
  });

  // Map to the shape that listing dashboard hooks expect
  const currentUser = authUser ? {
    id: userId,
    userId: userId,
    firstName: authUser.firstName || 'Host',
    name: authUser.fullName || authUser.firstName || 'Host',
    first_name: authUser.firstName || 'Host',
    fullName: authUser.fullName || '',
    email: authUser.email || '',
    accountHostId: authUser.accountHostId || userId,
  } : null;

  // Map to authState shape expected by consumers
  const authState = {
    isChecking: loading,
    shouldRedirect: !loading && !isAuthenticated
  };

  return {
    currentUser,
    authState
  };
}
