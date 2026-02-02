/**
 * Unit tests for notificationSender
 * Split Lease - Supabase Edge Functions
 *
 * Tests cover:
 * - sendNotification() - main notification sending with preference checks
 * - sendEmailNotification() - email-only convenience function
 * - sendSmsNotification() - SMS-only convenience function
 * - wouldSendNotification() - dry-run preference check
 * - createDefaultNotificationPreferences() - new user preference setup
 * - Audit logging functionality
 * - Admin override behavior
 */

import { assertEquals, assertExists } from 'jsr:@std/assert@1';
import {
  sendNotification,
  sendEmailNotification,
  sendSmsNotification,
  wouldSendNotification,
  createDefaultNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationResult,
} from './notificationSender.ts';
import type { NotificationPreferences, NotificationCategory } from './notificationHelpers.ts';

// ─────────────────────────────────────────────────────────────
// Mock Data Factory
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
    promotional_sms: false,
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
// Mock Supabase Client Factory
// ─────────────────────────────────────────────────────────────

interface MockSupabaseOptions {
  preferences?: NotificationPreferences | null;
  preferencesError?: { message: string; code?: string } | null;
  insertError?: { message: string; code?: string } | null;
}

function createMockSupabaseClient(options: MockSupabaseOptions = {}) {
  const insertCalls: unknown[] = [];

  return {
    from: (table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, _value: string) => ({
          single: () => Promise.resolve({
            data: options.preferences ?? null,
            error: options.preferencesError ?? null,
          }),
        }),
      }),
      insert: (data: unknown) => {
        insertCalls.push({ table, data });
        return Promise.resolve({
          error: options.insertError ?? null,
        });
      },
    }),
    // Expose insert calls for verification
    _getInsertCalls: () => insertCalls,
  };
}

// ─────────────────────────────────────────────────────────────
// Environment Mock Setup
// ─────────────────────────────────────────────────────────────

// Store original env getter
const originalEnvGet = Deno.env.get;

function mockEnvVars() {
  // @ts-ignore - mocking Deno.env
  Deno.env.get = (key: string) => {
    const mockVars: Record<string, string> = {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    };
    return mockVars[key];
  };
}

function restoreEnvVars() {
  // @ts-ignore - restoring Deno.env
  Deno.env.get = originalEnvGet;
}

// ─────────────────────────────────────────────────────────────
// DEFAULT_NOTIFICATION_PREFERENCES Tests
// ─────────────────────────────────────────────────────────────

Deno.test('DEFAULT_NOTIFICATION_PREFERENCES has all categories enabled except promotional_sms', () => {
  // All email preferences should be true
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.proposal_updates_email, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.message_forwarding_email, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.payment_reminders_email, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.promotional_email, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.reservation_updates_email, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.lease_requests_email, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.checkin_checkout_email, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.reviews_email, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.tips_insights_email, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.account_assistance_email, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.virtual_meetings_email, true);

  // All SMS preferences should be true EXCEPT promotional
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.proposal_updates_sms, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.message_forwarding_sms, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.payment_reminders_sms, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.promotional_sms, false); // Only exception
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.reservation_updates_sms, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.lease_requests_sms, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.checkin_checkout_sms, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.reviews_sms, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.tips_insights_sms, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.account_assistance_sms, true);
  assertEquals(DEFAULT_NOTIFICATION_PREFERENCES.virtual_meetings_sms, true);
});

Deno.test('DEFAULT_NOTIFICATION_PREFERENCES does not include user_id', () => {
  assertEquals('user_id' in DEFAULT_NOTIFICATION_PREFERENCES, false);
});

// ─────────────────────────────────────────────────────────────
// createDefaultNotificationPreferences Tests
// ─────────────────────────────────────────────────────────────

Deno.test('createDefaultNotificationPreferences() creates preferences with defaults', async () => {
  const mockClient = createMockSupabaseClient();

  // @ts-ignore - mock client
  const result = await createDefaultNotificationPreferences(mockClient, 'new-user-123');

  assertEquals(result.success, true);
  assertEquals(result.error, undefined);
});

Deno.test('createDefaultNotificationPreferences() handles unique violation (already exists)', async () => {
  const mockClient = createMockSupabaseClient({
    insertError: { message: 'Unique violation', code: '23505' },
  });

  // @ts-ignore - mock client
  const result = await createDefaultNotificationPreferences(mockClient, 'existing-user');

  // Should succeed silently for unique violation
  assertEquals(result.success, true);
});

Deno.test('createDefaultNotificationPreferences() returns error for other database errors', async () => {
  const mockClient = createMockSupabaseClient({
    insertError: { message: 'Database connection failed', code: '08000' },
  });

  // @ts-ignore - mock client
  const result = await createDefaultNotificationPreferences(mockClient, 'user-123');

  assertEquals(result.success, false);
  assertExists(result.error);
});

// ─────────────────────────────────────────────────────────────
// wouldSendNotification Tests
// ─────────────────────────────────────────────────────────────

Deno.test('wouldSendNotification() returns true when email notification would be sent', async () => {
  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_email: true }),
  });

  // @ts-ignore - mock client
  const result = await wouldSendNotification(mockClient, 'user-123', 'proposal_updates', 'email');

  assertEquals(result, true);
});

Deno.test('wouldSendNotification() returns false when email preference disabled', async () => {
  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_email: false }),
  });

  // @ts-ignore - mock client
  const result = await wouldSendNotification(mockClient, 'user-123', 'proposal_updates', 'email');

  assertEquals(result, false);
});

Deno.test('wouldSendNotification() returns true when SMS notification would be sent', async () => {
  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_sms: true }),
  });

  // @ts-ignore - mock client
  const result = await wouldSendNotification(mockClient, 'user-123', 'proposal_updates', 'sms');

  assertEquals(result, true);
});

Deno.test('wouldSendNotification() returns false when SMS preference disabled', async () => {
  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_sms: false }),
  });

  // @ts-ignore - mock client
  const result = await wouldSendNotification(mockClient, 'user-123', 'proposal_updates', 'sms');

  assertEquals(result, false);
});

Deno.test('wouldSendNotification() returns false when no preferences exist', async () => {
  const mockClient = createMockSupabaseClient({
    preferences: null,
  });

  // @ts-ignore - mock client
  const resultEmail = await wouldSendNotification(mockClient, 'user-123', 'proposal_updates', 'email');
  // @ts-ignore - mock client
  const resultSms = await wouldSendNotification(mockClient, 'user-123', 'proposal_updates', 'sms');

  assertEquals(resultEmail, false);
  assertEquals(resultSms, false);
});

// ─────────────────────────────────────────────────────────────
// sendNotification Result Structure Tests
// ─────────────────────────────────────────────────────────────

Deno.test('sendNotification() returns result with correlationId', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences(),
  });

  // Mock fetch to prevent actual HTTP calls
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response('{}', { status: 200 }));

  try {
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
    });

    assertExists(result.correlationId);
    assertEquals(typeof result.correlationId, 'string');
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvVars();
  }
});

Deno.test('sendNotification() uses provided correlationId', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences(),
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response('{}', { status: 200 }));

  try {
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
      correlationId: 'custom-correlation-123',
    });

    assertEquals(result.correlationId, 'custom-correlation-123');
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvVars();
  }
});

// ─────────────────────────────────────────────────────────────
// Preference-based Sending Tests
// ─────────────────────────────────────────────────────────────

Deno.test('sendNotification() skips email when email preference disabled', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_email: false }),
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response('{}', { status: 200 }));

  try {
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
      email: {
        templateId: 'template-123',
        toEmail: 'user@example.com',
        variables: {},
      },
    });

    assertEquals(result.emailSkipped, true);
    assertEquals(result.emailSent, false);
    assertEquals(result.emailSkipReason, 'User opted out');
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvVars();
  }
});

Deno.test('sendNotification() skips SMS when SMS preference disabled', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_sms: false }),
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response('{}', { status: 200 }));

  try {
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
      sms: {
        toPhone: '+15551234567',
        body: 'Test message',
      },
    });

    assertEquals(result.smsSkipped, true);
    assertEquals(result.smsSent, false);
    assertEquals(result.smsSkipReason, 'User opted out');
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvVars();
  }
});

Deno.test('sendNotification() skips both when both preferences disabled', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({
      proposal_updates_email: false,
      proposal_updates_sms: false,
    }),
  });

  try {
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
      email: {
        templateId: 'template-123',
        toEmail: 'user@example.com',
        variables: {},
      },
      sms: {
        toPhone: '+15551234567',
        body: 'Test message',
      },
    });

    assertEquals(result.emailSkipped, true);
    assertEquals(result.smsSkipped, true);
    assertEquals(result.emailSent, false);
    assertEquals(result.smsSent, false);
  } finally {
    restoreEnvVars();
  }
});

Deno.test('sendNotification() returns skipped result when user preferences not found', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: null, // No preferences found
  });

  try {
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
      email: {
        templateId: 'template-123',
        toEmail: 'user@example.com',
        variables: {},
      },
    });

    assertEquals(result.emailSkipped, true);
    assertEquals(result.emailSkipReason, 'No preferences found (privacy-first default)');
  } finally {
    restoreEnvVars();
  }
});

// ─────────────────────────────────────────────────────────────
// Admin Override Tests
// ─────────────────────────────────────────────────────────────

Deno.test('sendNotification() sends with admin override even when preference disabled', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({
      proposal_updates_email: false, // Disabled
    }),
  });

  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    return Promise.resolve(new Response('{}', { status: 200 }));
  };

  try {
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
      email: {
        templateId: 'template-123',
        toEmail: 'user@example.com',
        variables: {},
      },
      forceOverride: true,
      adminUserId: 'admin-user-123',
    });

    assertEquals(result.emailSkipped, false);
    assertEquals(fetchCalled, true);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvVars();
  }
});

// ─────────────────────────────────────────────────────────────
// sendEmailNotification Convenience Function Tests
// ─────────────────────────────────────────────────────────────

Deno.test('sendEmailNotification() calls sendNotification with email only', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_email: false }),
  });

  try {
    // @ts-ignore - mock client
    const result = await sendEmailNotification(
      mockClient,
      'user-123',
      'proposal_updates' as NotificationCategory,
      {
        templateId: 'template-123',
        toEmail: 'user@example.com',
        variables: { name: 'Test' },
      }
    );

    // Should return email-specific result
    assertExists(result.skipped);
    assertExists(result.sent);
  } finally {
    restoreEnvVars();
  }
});

Deno.test('sendEmailNotification() checks email preference before sending', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_email: false }),
  });

  try {
    // @ts-ignore - mock client
    const result = await sendEmailNotification(
      mockClient,
      'user-123',
      'proposal_updates' as NotificationCategory,
      {
        templateId: 'template-123',
        toEmail: 'user@example.com',
        variables: {},
      }
    );

    assertEquals(result.skipped, true);
    assertEquals(result.sent, false);
  } finally {
    restoreEnvVars();
  }
});

// ─────────────────────────────────────────────────────────────
// sendSmsNotification Convenience Function Tests
// ─────────────────────────────────────────────────────────────

Deno.test('sendSmsNotification() calls sendNotification with SMS only', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_sms: false }),
  });

  try {
    // @ts-ignore - mock client
    const result = await sendSmsNotification(
      mockClient,
      'user-123',
      'proposal_updates' as NotificationCategory,
      {
        toPhone: '+15551234567',
        body: 'Test message',
      }
    );

    // Should return SMS-specific result
    assertExists(result.skipped);
    assertExists(result.sent);
  } finally {
    restoreEnvVars();
  }
});

Deno.test('sendSmsNotification() checks SMS preference before sending', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_sms: false }),
  });

  try {
    // @ts-ignore - mock client
    const result = await sendSmsNotification(
      mockClient,
      'user-123',
      'proposal_updates' as NotificationCategory,
      {
        toPhone: '+15551234567',
        body: 'Test message',
      }
    );

    assertEquals(result.skipped, true);
    assertEquals(result.sent, false);
  } finally {
    restoreEnvVars();
  }
});

// ─────────────────────────────────────────────────────────────
// Error Handling Tests
// ─────────────────────────────────────────────────────────────

Deno.test('sendNotification() handles Supabase client errors gracefully', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferencesError: { message: 'Connection failed' },
  });

  try {
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
      email: {
        templateId: 'template-123',
        toEmail: 'user@example.com',
        variables: {},
      },
    });

    // Should skip due to no preferences (privacy-first default)
    assertEquals(result.emailSkipped, true);
  } finally {
    restoreEnvVars();
  }
});

Deno.test('sendNotification() does not throw when email send fails', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_email: true }),
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response('Error', { status: 500 }));

  try {
    // Should not throw
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
      email: {
        templateId: 'template-123',
        toEmail: 'user@example.com',
        variables: {},
      },
    });

    // Email send failed but function didn't throw
    assertEquals(result.emailSent, false);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvVars();
  }
});

Deno.test('sendNotification() does not throw when SMS send fails', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences({ proposal_updates_sms: true }),
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response('Error', { status: 500 }));

  try {
    // Should not throw
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
      sms: {
        toPhone: '+15551234567',
        body: 'Test message',
      },
    });

    // SMS send failed but function didn't throw
    assertEquals(result.smsSent, false);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvVars();
  }
});

// ─────────────────────────────────────────────────────────────
// Edge Cases Tests
// ─────────────────────────────────────────────────────────────

Deno.test('sendNotification() handles missing email params', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences(),
  });

  try {
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
      // No email or sms params
    });

    // Should complete without errors
    assertEquals(result.emailSkipped, false);
    assertEquals(result.emailSent, false);
    assertEquals(result.smsSkipped, false);
    assertEquals(result.smsSent, false);
  } finally {
    restoreEnvVars();
  }
});

Deno.test('sendNotification() handles missing SMS params', async () => {
  mockEnvVars();

  const mockClient = createMockSupabaseClient({
    preferences: createMockPreferences(),
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response('{}', { status: 200 }));

  try {
    // @ts-ignore - mock client
    const result = await sendNotification({
      supabase: mockClient,
      userId: 'user-123',
      category: 'proposal_updates' as NotificationCategory,
      email: {
        templateId: 'template-123',
        toEmail: 'user@example.com',
        variables: {},
      },
      // No sms params
    });

    // SMS should not be processed
    assertEquals(result.smsSkipped, false);
    assertEquals(result.smsSent, false);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvVars();
  }
});

// ─────────────────────────────────────────────────────────────
// All Categories Test
// ─────────────────────────────────────────────────────────────

Deno.test('sendNotification() works for all notification categories', async () => {
  mockEnvVars();

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

  for (const category of categories) {
    const mockClient = createMockSupabaseClient({
      preferences: createMockPreferences(),
    });

    try {
      // @ts-ignore - mock client
      const result = await sendNotification({
        supabase: mockClient,
        userId: 'user-123',
        category,
      });

      // Should complete without errors
      assertExists(result.correlationId, `correlationId should exist for ${category}`);
    } catch (error) {
      throw new Error(`sendNotification failed for category ${category}: ${error}`);
    }
  }

  restoreEnvVars();
});
