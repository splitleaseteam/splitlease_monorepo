import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * useSupabaseQuery - Generic hook for Supabase data fetching with loading/error state.
 *
 * Replaces the repeated pattern found in 50+ hooks:
 *   const [data, setData] = useState(null);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState(null);
 *   useEffect(() => {
 *     const fetch = async () => {
 *       try { ... supabase.from(table).select() ... }
 *       catch (err) { setError(err.message); }
 *       finally { setLoading(false); }
 *     };
 *     fetch();
 *   }, []);
 *
 * @param {Function} queryFn - Async function that receives the supabase client and returns data.
 *   Must throw on error. Receives `supabase` as first arg for convenience.
 * @param {Object} [options]
 * @param {Array} [options.dependencies] - Dependency array for re-fetching (default: []).
 *   When any dependency changes, the query re-runs automatically.
 * @param {boolean} [options.enabled] - Whether to run the query (default: true).
 *   Set to false to defer execution (e.g., wait for auth).
 * @param {*} [options.initialData] - Initial value for data (default: null).
 * @param {Function} [options.onSuccess] - Callback after successful fetch, receives data.
 * @param {Function} [options.onError] - Callback after failed fetch, receives error.
 * @param {boolean} [options.fetchOnMount] - Whether to fetch immediately on mount (default: true).
 *
 * @returns {{ data, isLoading, error, refetch, setData }}
 *
 * @example
 * // Simple table query
 * const { data: listings, isLoading, error } = useSupabaseQuery(
 *   async (sb) => {
 *     const { data, error } = await sb.from('listing').select('id, title, price').eq('active', true);
 *     if (error) throw error;
 *     return data;
 *   }
 * );
 *
 * @example
 * // Query with dependencies (re-fetches when userId changes)
 * const { data: proposals, isLoading, refetch } = useSupabaseQuery(
 *   async (sb) => {
 *     const { data, error } = await sb
 *       .from('booking_proposal')
 *       .select('*')
 *       .eq('guest_user_id', userId);
 *     if (error) throw error;
 *     return data;
 *   },
 *   { dependencies: [userId], enabled: !!userId }
 * );
 *
 * @example
 * // RPC call
 * const { data: hostListings, isLoading } = useSupabaseQuery(
 *   async (sb) => {
 *     const { data, error } = await sb.rpc('get_host_listings', { host_user_id: userId });
 *     if (error) throw error;
 *     return data || [];
 *   },
 *   { dependencies: [userId], enabled: !!userId }
 * );
 *
 * @example
 * // Edge Function call
 * const { data: leases, isLoading, error } = useSupabaseQuery(
 *   async (sb) => {
 *     const { data: { session } } = await sb.auth.getSession();
 *     const { data, error } = await sb.functions.invoke('lease', {
 *       headers: { Authorization: `Bearer ${session?.access_token}` },
 *       body: { action: 'get_host_leases', payload: { hostUserId } }
 *     });
 *     if (error) throw error;
 *     if (!data?.success) throw new Error(data?.error || 'Request failed');
 *     return data.data;
 *   },
 *   { dependencies: [hostUserId], enabled: !!hostUserId }
 * );
 *
 * @example
 * // Deferred query (waits for auth)
 * const { data, isLoading } = useSupabaseQuery(
 *   async (sb) => { ... },
 *   { enabled: authState.isAuthenticated && !authState.isChecking }
 * );
 */
export function useSupabaseQuery(queryFn, options = {}) {
  const {
    dependencies = [],
    enabled = true,
    initialData = null,
    onSuccess,
    onError,
    fetchOnMount = true,
  } = options;

  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(fetchOnMount && enabled);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const latestQueryFnRef = useRef(queryFn);
  latestQueryFnRef.current = queryFn;

  const latestOnSuccessRef = useRef(onSuccess);
  latestOnSuccessRef.current = onSuccess;

  const latestOnErrorRef = useRef(onError);
  latestOnErrorRef.current = onError;

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await latestQueryFnRef.current(supabase);

      if (mountedRef.current) {
        setData(result ?? null);
        setError(null);
        latestOnSuccessRef.current?.(result);
      }

      return result;
    } catch (err) {
      console.error('[useSupabaseQuery] Query failed:', err);

      if (mountedRef.current) {
        setError(err);
        latestOnErrorRef.current?.(err);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []); // Stable reference — uses refs for latest values

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (enabled && fetchOnMount) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchData, ...dependencies]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    setData,
  };
}

export default useSupabaseQuery;
