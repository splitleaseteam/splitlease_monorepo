/**
 * Health Check Handler
 * Split Lease - Supabase Edge Functions
 *
 * Simple health check endpoint for monitoring
 */

import type { HealthResponse } from '../lib/types.ts';

export function handleHealth(): Promise<HealthResponse> {
  console.log('[calendar-automation:health] Health check requested');

  return {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'calendar-automation',
    },
  };
}
