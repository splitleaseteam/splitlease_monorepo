// Custom hook for contract generation

import { useState, useCallback } from 'react';
import {
  generateCreditCardAuth,
  generateCreditCardAuthNonProrated,
  generateHostPayout,
  generatePeriodicTenancy,
  generateSupplemental,
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
      let response;
      switch (action) {
        case 'generate_credit_card_auth':
          response = await generateCreditCardAuth(payload);
          break;
        case 'generate_credit_card_auth_nonprorated':
          response = await generateCreditCardAuthNonProrated(payload);
          break;
        case 'generate_host_payout':
          response = await generateHostPayout(payload);
          break;
        case 'generate_periodic_tenancy':
          response = await generatePeriodicTenancy(payload);
          break;
        case 'generate_supplemental':
          response = await generateSupplemental(payload);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

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
