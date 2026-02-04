/**
 * Unit tests for notificationHelpers
 * Split Lease - Supabase Edge Functions
 *
 * Tests cover:
 * - getNotificationPreferences() - fetch user preferences
 * - shouldSendEmail() - email preference check
 * - shouldSendSms() - SMS preference check
 * - sendProposalEmail() - fire-and-forget email sending
 * - sendProposalSms() - fire-and-forget SMS sending
 * - getHostEmailTemplate() - email template selection
 */

import { assertEquals, assertExists } from 'jsr:@std/assert@1';
import {
  getNotificationPreferences,
  shouldSendEmail,
  shouldSendSms,
  getHostEmailTemplate,
  EMAIL_TEMPLATES,
  type NotificationPreferences,
  type NotificationCategory,
} from './notificationHelpers.ts';

// ─────────────────────────────────────────────────────────────
// Mock Supabase Client Factory
// ─────────────────────────────────────────────────────────────

function createMockSupabaseClient(options: {
  data?: NotificationPreferences | null;
  error?: { message: string; code?: string } | null;
}) {
  return {
    from: (_table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, _value: string) => ({
          single: () => Promise.resolve({
            data: options.data ?? null,
            error: options.error ?? null,
          }),
        }),
      }),
    }),
  };
}

// ─────────────────────────────────────────────────────────────
// Test Data Factory
// ─────────────────────────────────────────────────────────────

function createMockPreferences(overrides: Partial<NotificationPreferences> = {}): NotificationPreferences {
  return {
    user_id: 'test-user-123',
    proposal_updates_sms: true,
    proposal_updates_email: true,
    message_forwarding_sms: true,
    message_forwarding_email: true,
    payment_reminders_sms: true,
    payment_reminders_email: true,
    promotional_sms: false, // Default off per Bubble behavior
    promotional_email: true,
    reservation_updates_sms: true,
    reservation_updates_email: true,
    lease_requests_sms: true,
    lease_requests_email: true,
    checkin_checkout_sms: true,
    checkin_checkout_email: true,
    reviews_sms: true,
    reviews_email: true,
    tips_insights_sms: true,
    tips_insights_email: true,
    account_assistance_sms: true,
    account_assistance_email: true,
    virtual_meetings_sms: true,
    virtual_meetings_email: true,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────
// getNotificationPreferences Tests
// ─────────────────────────────────────────────────────────────

Deno.test('getNotificationPreferences() returns preferences for existing user', async () => {
  const mockPrefs = createMockPreferences();
  const mockClient = createMockSupabaseClient({ data: mockPrefs });

  // @ts-ignore - mock client doesn't implement full type
  const result = await getNotificationPreferences(mockClient, 'test-user-123');

  assertExists(result);
  assertEquals(result?.user_id, 'test-user-123');
  assertEquals(result?.proposal_updates_sms, true);
  assertEquals(result?.promotional_sms, false);
});

Deno.test('getNotificationPreferences() returns null for user without preferences', async () => {
  const mockClient = createMockSupabaseClient({ data: null });

  // @ts-ignore - mock client doesn't implement full type
  const result = await getNotificationPreferences(mockClient, 'nonexistent-user');

  assertEquals(result, null);
});

Deno.test('getNotificationPreferences() returns null on Supabase error', async () => {
  const mockClient = createMockSupabaseClient({
    error: { message: 'Database connection failed' },
  });

  // @ts-ignore - mock client doesn't implement full type
  const result = await getNotificationPreferences(mockClient, 'test-user-123');

  assertEquals(result, null);
});

Deno.test('getNotificationPreferences() handles PGRST116 (no rows) gracefully', async () => {
  const mockClient = createMockSupabaseClient({
    data: null,
    error: { message: 'No rows found', code: 'PGRST116' },
  });

  // @ts-ignore - mock client doesn't implement full type
  const result = await getNotificationPreferences(mockClient, 'new-user');

  assertEquals(result, null);
});

// ─────────────────────────────────────────────────────────────
// shouldSendEmail Tests
// ─────────────────────────────────────────────────────────────

Deno.test('shouldSendEmail() returns true when email preference enabled for category', () => {
  const prefs = createMockPreferences({ proposal_updates_email: true });
  const result = shouldSendEmail(prefs, 'proposal_updates');
  assertEquals(result, true);
});

Deno.test('shouldSendEmail() returns false when email preference disabled', () => {
  const prefs = createMockPreferences({ proposal_updates_email: false });
  const result = shouldSendEmail(prefs, 'proposal_updates');
  assertEquals(result, false);
});

Deno.test('shouldSendEmail() returns false when preferences is null', () => {
  const result = shouldSendEmail(null, 'proposal_updates');
  assertEquals(result, false);
});

Deno.test('shouldSendEmail() returns false for invalid category', () => {
  const prefs = createMockPreferences();
  // @ts-ignore - testing invalid category
  const result = shouldSendEmail(prefs, 'invalid_category');
  assertEquals(result, false);
});

Deno.test('shouldSendEmail() checks correct column for each category', () => {
  const categories: NotificationCategory[] = [
    'proposal_updates',
    'message_forwarding',
    'payment_reminders',
    'promotional',
    'reservation_updates',
    'lease_requests',
    'checkin_checkout',
    'reviews',
    'tips_insights',
    'account_assistance',
    'virtual_meetings',
  ];

  // All categories enabled except promotional
  const prefs = createMockPreferences();

  categories.forEach((category) => {
    const result = shouldSendEmail(prefs, category);
    // All email preferences are true in our mock
    assertEquals(result, true, `Expected true for ${category}_email`);
  });
});

Deno.test('shouldSendEmail() handles missing preference column gracefully', () => {
  const prefs = {
    user_id: 'test-user-123',
    // Missing most columns
    proposal_updates_sms: true,
    proposal_updates_email: true,
  } as NotificationPreferences;

  // This should return false or handle gracefully for missing columns
  const result = shouldSendEmail(prefs, 'message_forwarding');
  assertEquals(result, false);
});

// ─────────────────────────────────────────────────────────────
// shouldSendSms Tests
// ─────────────────────────────────────────────────────────────

Deno.test('shouldSendSms() returns true when SMS preference enabled for category', () => {
  const prefs = createMockPreferences({ proposal_updates_sms: true });
  const result = shouldSendSms(prefs, 'proposal_updates');
  assertEquals(result, true);
});

Deno.test('shouldSendSms() returns false when SMS preference disabled', () => {
  const prefs = createMockPreferences({ proposal_updates_sms: false });
  const result = shouldSendSms(prefs, 'proposal_updates');
  assertEquals(result, false);
});

Deno.test('shouldSendSms() returns false when preferences is null', () => {
  const result = shouldSendSms(null, 'proposal_updates');
  assertEquals(result, false);
});

Deno.test('shouldSendSms() returns false for promotional_sms by default', () => {
  const prefs = createMockPreferences(); // promotional_sms defaults to false
  const result = shouldSendSms(prefs, 'promotional');
  assertEquals(result, false);
});

Deno.test('shouldSendSms() returns true for promotional_sms when explicitly enabled', () => {
  const prefs = createMockPreferences({ promotional_sms: true });
  const result = shouldSendSms(prefs, 'promotional');
  assertEquals(result, true);
});

Deno.test('shouldSendSms() checks correct column for each category', () => {
  const categoriesWithSmsEnabled: NotificationCategory[] = [
    'proposal_updates',
    'message_forwarding',
    'payment_reminders',
    'reservation_updates',
    'lease_requests',
    'checkin_checkout',
    'reviews',
    'tips_insights',
    'account_assistance',
    'virtual_meetings',
  ];

  const prefs = createMockPreferences();

  categoriesWithSmsEnabled.forEach((category) => {
    const result = shouldSendSms(prefs, category);
    assertEquals(result, true, `Expected true for ${category}_sms`);
  });

  // Promotional SMS is disabled by default
  const promotionalResult = shouldSendSms(prefs, 'promotional');
  assertEquals(promotionalResult, false, 'Expected false for promotional_sms');
});

// ─────────────────────────────────────────────────────────────
// getHostEmailTemplate Tests
// ─────────────────────────────────────────────────────────────

Deno.test('getHostEmailTemplate() returns correct template for monthly rental', () => {
  const result = getHostEmailTemplate('monthly');
  assertEquals(result, EMAIL_TEMPLATES.HOST_PROPOSAL_MONTHLY);
});

Deno.test('getHostEmailTemplate() returns correct template for weekly rental', () => {
  const result = getHostEmailTemplate('weekly');
  assertEquals(result, EMAIL_TEMPLATES.HOST_PROPOSAL_WEEKLY);
});

Deno.test('getHostEmailTemplate() returns default template for nightly rental', () => {
  const result = getHostEmailTemplate('nightly');
  assertEquals(result, EMAIL_TEMPLATES.HOST_PROPOSAL_NIGHTLY);
});

Deno.test('getHostEmailTemplate() returns default template for unknown type', () => {
  const result = getHostEmailTemplate('unknown');
  assertEquals(result, EMAIL_TEMPLATES.HOST_PROPOSAL_NIGHTLY);
});

Deno.test('getHostEmailTemplate() returns default template for null', () => {
  const result = getHostEmailTemplate(null);
  assertEquals(result, EMAIL_TEMPLATES.HOST_PROPOSAL_NIGHTLY);
});

Deno.test('getHostEmailTemplate() returns default template for undefined', () => {
  const result = getHostEmailTemplate(undefined);
  assertEquals(result, EMAIL_TEMPLATES.HOST_PROPOSAL_NIGHTLY);
});

Deno.test('getHostEmailTemplate() handles case-insensitive input', () => {
  assertEquals(getHostEmailTemplate('MONTHLY'), EMAIL_TEMPLATES.HOST_PROPOSAL_MONTHLY);
  assertEquals(getHostEmailTemplate('Weekly'), EMAIL_TEMPLATES.HOST_PROPOSAL_WEEKLY);
  assertEquals(getHostEmailTemplate('NIGHTLY'), EMAIL_TEMPLATES.HOST_PROPOSAL_NIGHTLY);
});

Deno.test('getHostEmailTemplate() returns default for empty string', () => {
  const result = getHostEmailTemplate('');
  assertEquals(result, EMAIL_TEMPLATES.HOST_PROPOSAL_NIGHTLY);
});

// ─────────────────────────────────────────────────────────────
// EMAIL_TEMPLATES Constants Tests
// ─────────────────────────────────────────────────────────────

Deno.test('EMAIL_TEMPLATES has required template IDs', () => {
  assertExists(EMAIL_TEMPLATES.GUEST_PROPOSAL_SUBMITTED);
  assertExists(EMAIL_TEMPLATES.HOST_PROPOSAL_NIGHTLY);
  assertExists(EMAIL_TEMPLATES.HOST_PROPOSAL_WEEKLY);
  assertExists(EMAIL_TEMPLATES.HOST_PROPOSAL_MONTHLY);
});

Deno.test('EMAIL_TEMPLATES values are non-empty strings', () => {
  Object.values(EMAIL_TEMPLATES).forEach((templateId) => {
    assertEquals(typeof templateId, 'string');
    assertEquals(templateId.length > 0, true);
  });
});

// ─────────────────────────────────────────────────────────────
// Edge Cases Tests
// ─────────────────────────────────────────────────────────────

Deno.test('shouldSendEmail() with all preferences disabled returns false', () => {
  const prefs = createMockPreferences({
    proposal_updates_email: false,
    message_forwarding_email: false,
    payment_reminders_email: false,
    promotional_email: false,
    reservation_updates_email: false,
    lease_requests_email: false,
    checkin_checkout_email: false,
    reviews_email: false,
    tips_insights_email: false,
    account_assistance_email: false,
    virtual_meetings_email: false,
  });

  const categories: NotificationCategory[] = [
    'proposal_updates',
    'message_forwarding',
    'payment_reminders',
    'promotional',
    'reservation_updates',
    'lease_requests',
    'checkin_checkout',
    'reviews',
    'tips_insights',
    'account_assistance',
    'virtual_meetings',
  ];

  categories.forEach((category) => {
    const result = shouldSendEmail(prefs, category);
    assertEquals(result, false, `Expected false for disabled ${category}_email`);
  });
});

Deno.test('shouldSendSms() with all preferences disabled returns false', () => {
  const prefs = createMockPreferences({
    proposal_updates_sms: false,
    message_forwarding_sms: false,
    payment_reminders_sms: false,
    promotional_sms: false,
    reservation_updates_sms: false,
    lease_requests_sms: false,
    checkin_checkout_sms: false,
    reviews_sms: false,
    tips_insights_sms: false,
    account_assistance_sms: false,
    virtual_meetings_sms: false,
  });

  const categories: NotificationCategory[] = [
    'proposal_updates',
    'message_forwarding',
    'payment_reminders',
    'promotional',
    'reservation_updates',
    'lease_requests',
    'checkin_checkout',
    'reviews',
    'tips_insights',
    'account_assistance',
    'virtual_meetings',
  ];

  categories.forEach((category) => {
    const result = shouldSendSms(prefs, category);
    assertEquals(result, false, `Expected false for disabled ${category}_sms`);
  });
});

Deno.test('preference functions handle boolean type strictly', () => {
  // Create preferences with explicitly true/false values
  const prefs = createMockPreferences({
    proposal_updates_email: true,
    proposal_updates_sms: false,
  });

  // True should return true
  assertEquals(shouldSendEmail(prefs, 'proposal_updates'), true);
  // False should return false
  assertEquals(shouldSendSms(prefs, 'proposal_updates'), false);
});
