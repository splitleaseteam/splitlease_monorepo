// Custom hook for contract generation

import { useState, useCallback } from 'react';
import {
  generateContract,
  listTemplates,
  getTemplateSchema
} from '../lib/api/contracts.js';

/**
 * Custom hook for contract generation operations
 */
export function useContractGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generate = useCallback(async (action, payload) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateContract(action, payload);

      if (response.success) {
        setResult(response.data);
        return response.data;
      } else {
        setError(response.error?.message || 'Generation failed');
        return null;
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Contract generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const templates = await listTemplates();
      return templates;
    } catch (err) {
      const errorMessage = err.message || 'Failed to load templates';
      setError(errorMessage);
      console.error('Load templates error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSchema = useCallback(async (action) => {
    setIsLoading(true);
    setError(null);

    try {
      const schema = await getTemplateSchema(action);
      return schema;
    } catch (err) {
      const errorMessage = err.message || 'Failed to load schema';
      setError(errorMessage);
      console.error('Load schema error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generate,
    loadTemplates,
    loadSchema,
    isLoading,
    error,
    result,
    clearError: () => setError(null),
    clearResult: () => setResult(null)
  };
}
