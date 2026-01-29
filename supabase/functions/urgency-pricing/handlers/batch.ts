/**
 * Batch Handler
 *
 * Calculate pricing for multiple requests in parallel
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  BatchPayload,
  BatchPricingResponse,
} from '../types/urgency.types.ts';
import { handleCalculate } from './calculate.ts';
import { ValidationError } from 'shared/errors.ts';

const MAX_BATCH_SIZE = 100;

/**
 * Handle batch action
 *
 * @param payload - Batch payload
 * @param user - Authenticated user
 * @param supabase - Supabase client
 * @returns Batch pricing response
 */
export const handleBatch = async (
  payload: BatchPayload,
  user: any,
  supabase: SupabaseClient
): Promise<BatchPricingResponse> => {
  const startTime = Date.now();

  // Validate payload
  if (!payload.requests || !Array.isArray(payload.requests)) {
    throw new ValidationError('requests must be an array');
  }

  if (payload.requests.length === 0) {
    throw new ValidationError('requests array cannot be empty');
  }

  if (payload.requests.length > MAX_BATCH_SIZE) {
    throw new ValidationError(`requests array cannot exceed ${MAX_BATCH_SIZE} items`);
  }

  // Execute all requests in parallel
  const results = await Promise.all(
    payload.requests.map(async (request) => {
      try {
        return await handleCalculate(request, user, supabase);
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          metadata: {
            calculatedAt: new Date(),
            cacheHit: false,
            calculationTimeMs: 0,
          },
        };
      }
    })
  );

  const successfulRequests = results.filter(r => r.success).length;
  const failedRequests = results.filter(r => !r.success).length;

  return {
    success: true,
    results,
    metadata: {
      totalRequests: payload.requests.length,
      successfulRequests,
      failedRequests,
      totalCalculationTimeMs: Date.now() - startTime,
    },
  };
};
