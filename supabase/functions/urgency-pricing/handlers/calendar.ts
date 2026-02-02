/**
 * Calendar Handler
 *
 * Get pricing for multiple dates (calendar view)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CalendarPayload,
  CalendarResponse,
  CalculatePayload,
} from '../types/urgency.types.ts';
import { handleBatch } from './batch.ts';
import { ValidationError } from 'shared/errors.ts';

/**
 * Handle calendar action
 *
 * @param payload - Calendar payload
 * @param user - Authenticated user
 * @param supabase - Supabase client
 * @returns Calendar response
 */
export const handleCalendar = async (
  payload: CalendarPayload,
  user: any,
  supabase: SupabaseClient
): Promise<CalendarResponse> => {
  // Validate payload
  if (!payload.dates || !Array.isArray(payload.dates)) {
    throw new ValidationError('dates must be an array');
  }

  if (payload.dates.length === 0) {
    throw new ValidationError('dates array cannot be empty');
  }

  if (!payload.basePrice || payload.basePrice <= 0) {
    throw new ValidationError('basePrice must be positive');
  }

  // Convert to batch calculate requests
  const requests: CalculatePayload[] = payload.dates.map(date => ({
    targetDate: date,
    basePrice: payload.basePrice,
    urgencySteepness: payload.steepness,
  }));

  // Delegate to batch handler
  const batchResponse = await handleBatch({ requests }, user, supabase);

  if (!batchResponse.success) {
    return {
      success: false,
      error: 'Batch calculation failed',
    };
  }

  // Format as date → pricing map
  const data: Record<string, any> = {};
  for (let i = 0; i < payload.dates.length; i++) {
    const date = payload.dates[i];
    const result = batchResponse.results[i];
    if (result.success && result.data) {
      data[date] = result.data;
    }
  }

  return {
    success: true,
    data,
  };
};
