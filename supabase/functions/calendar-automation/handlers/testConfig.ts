/**
 * Test Configuration Handler
 * Split Lease - Supabase Edge Functions
 *
 * Verifies Google Calendar and calendar ID configuration
 */

import type { TestConfigResponse } from '../lib/types.ts';

export function handleTestConfig(): Promise<TestConfigResponse> {
  console.log('[calendar-automation:test-config] Configuration test requested');

  const googleAccessToken = Deno.env.get('GOOGLE_OAUTH_ACCESS_TOKEN');
  const teamCalendarId = Deno.env.get('GOOGLE_TEAM_CALENDAR_ID') || 'primary';
  const serviceCalendarId = Deno.env.get('GOOGLE_SERVICE_CALENDAR_ID') || 'primary';

  const googleCredentialsConfigured = !!googleAccessToken && googleAccessToken.length > 0;
  const calendarIdsConfigured = !!(teamCalendarId || serviceCalendarId);

  console.log('[calendar-automation:test-config] Configuration check:', {
    googleCredentialsConfigured,
    calendarIdsConfigured,
    teamCalendarId,
    serviceCalendarId,
  });

  return {
    success: true,
    data: {
      googleCredentialsConfigured,
      calendarIdsConfigured,
      teamCalendarId,
      serviceCalendarId,
    },
  };
}
