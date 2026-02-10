import { useState, useCallback, useRef } from 'react';

/**
 * useAsyncOperation - Generic hook for managing async state (loading, error, result).
 *
 * Replaces the repeated pattern of:
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState(null);
 *   const [result, setResult] = useState(null);
 *   // + manual try/catch/finally in every handler
 *
 * @param {Function} asyncFn - The async function to wrap. Receives any args passed to `execute()`.
 * @param {Object} [options]
 * @param {*} [options.initialData] - Initial value for `data` before first execution (default: null).
 * @param {boolean} [options.resetErrorOnExecute] - Clear previous error when re-executing (default: true).
 * @param {boolean} [options.resetDataOnExecute] - Clear previous data when re-executing (default: false).
 *
 * @returns {{ data, isLoading, error, execute, reset }}
 *
 * @example
 * // Simple usage
 * const { data: listing, isLoading, error, execute: fetchListing } = useAsyncOperation(
 *   async (listingId) => {
 *     const { data, error } = await supabase.from('listing').select('*').eq('id', listingId).single();
 *     if (error) throw error;
 *     return data;
 *   }
 * );
 *
 * // Call it
 * useEffect(() => { fetchListing(listingId); }, [listingId]);
 *
 * @example
 * // Mutation usage
 * const { isLoading: isSaving, error: saveError, execute: saveListing } = useAsyncOperation(
 *   async (id, updates) => {
 *     const { error } = await supabase.from('listing').update(updates).eq('id', id);
 *     if (error) throw error;
 *   }
 * );
 *
 * // In a handler
 * const handleSave = () => saveListing(listingId, formData);
 */
export function useAsyncOperation(asyncFn, options = {}) {
  const {
    initialData = null,
    resetErrorOnExecute = true,
    resetDataOnExecute = false,
  } = options;

  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);
  const latestFnRef = useRef(asyncFn);
  latestFnRef.current = asyncFn;

  // Cleanup on unmount
  useState(() => {
    return () => { mountedRef.current = false; };
  });

  const execute = useCallback(async (...args) => {
    if (resetErrorOnExecute) setError(null);
    if (resetDataOnExecute) setData(initialData);
    setIsLoading(true);

    try {
      const result = await latestFnRef.current(...args);
      if (mountedRef.current) {
        setData(result ?? null);
        setError(null);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [initialData, resetErrorOnExecute, resetDataOnExecute]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsLoading(false);
  }, [initialData]);

  return { data, isLoading, error, execute, reset };
}

export default useAsyncOperation;
