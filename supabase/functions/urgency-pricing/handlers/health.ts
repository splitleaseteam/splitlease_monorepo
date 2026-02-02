/**
 * Health Handler
 *
 * Health check endpoint
 */

import { HealthResponse } from '../types/urgency.types.ts';

/**
 * Handle health action
 *
 * @returns Health response
 */
export const handleHealth = async (): Promise<HealthResponse> => {
  return {
    success: true,
    data: {
      status: 'healthy',
      service: 'urgency-pricing',
      version: '1.0.0',
    },
  };
};
