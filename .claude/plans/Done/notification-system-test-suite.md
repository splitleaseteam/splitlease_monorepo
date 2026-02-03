# Notification System Test Suite Plan

**Created**: 2026-02-02
**Classification**: BUILD
**Scope**: 6-8 test files
**Token Estimate**: ~80K tokens (medium complexity)

---

## Executive Summary

Generate comprehensive test coverage for the notification preference system including:
- Edge Function notification sender/helpers
- Database migration verification
- User preference backfill
- Real-time notification delivery
- Email/SMS preference toggle functionality

---

## Architecture Context

### Key Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `notificationSender.ts` | `supabase/functions/_shared/` | High-level notification sending with preference checking |
| `notificationHelpers.ts` | `supabase/functions/_shared/` | Low-level utilities for preference checks |
| `useNotificationSettings.js` | `app/src/islands/shared/NotificationSettingsIsland/` | React hook for preference management |
| `NotificationToggle.jsx` | Same directory | iOS-style toggle component |
| `notificationCategories.js` | Same directory | Category configuration mapping |

### Database Schema
- **Table**: `notification_preferences` - 22 boolean columns (11 categories × 2 channels)
- **Table**: `notification_audit` - Logs all notification decisions
- **Migrations**: `20260128190000_create_notification_audit.sql`, `20260128190100_backfill_notification_preferences.sql`

---

## Test File Structure

```
app/src/
├── islands/shared/NotificationSettingsIsland/
│   └── __tests__/
│       ├── useNotificationSettings.test.js      # Hook tests
│       ├── NotificationToggle.test.js           # Toggle component tests
│       ├── NotificationCategoryRow.test.js      # Category row tests
│       └── notificationCategories.test.js       # Config utilities tests
├── __tests__/
│   └── integration/
│       └── notificationPreferences.integration.test.js  # E2E preference flow

supabase/functions/_shared/
└── __tests__/
    ├── notificationSender.test.ts               # Edge Function sender tests
    └── notificationHelpers.test.ts              # Helper function tests

supabase/migrations/
└── __tests__/
    └── notification-migrations.test.sql         # Migration verification (pgTAP)
```

---

## Test File Specifications

### 1. `notificationSender.test.ts` (~250 lines)

**Location**: `supabase/functions/_shared/__tests__/notificationSender.test.ts`

**Test Categories**:

```typescript
describe('notificationSender', () => {
  describe('sendNotification', () => {
    // Happy path
    it('should send both email and SMS when preferences allow')
    it('should send only email when SMS preference disabled')
    it('should send only SMS when email preference disabled')
    it('should skip sending when both preferences disabled')

    // Admin override
    it('should send notification with admin override even when preference disabled')
    it('should log admin override in audit table')

    // Audit logging
    it('should create audit record for sent notifications')
    it('should create audit record for skipped notifications with reason')
    it('should include correlation_id in audit when provided')

    // Error handling
    it('should handle Supabase client errors gracefully')
    it('should return skipped result when user preferences not found')
    it('should not throw when email send fails (fire-and-forget)')
    it('should not throw when SMS send fails (fire-and-forget)')

    // Edge cases
    it('should handle missing category gracefully')
    it('should handle null userId')
    it('should handle empty payload')
  });

  describe('sendEmailNotification', () => {
    it('should call sendNotification with email only')
    it('should pass template variables correctly')
    it('should check email preference before sending')
  });

  describe('sendSmsNotification', () => {
    it('should call sendNotification with SMS only')
    it('should format phone number correctly')
    it('should check SMS preference before sending')
  });

  describe('wouldSendNotification', () => {
    it('should return true when notification would be sent')
    it('should return false when preference disabled')
    it('should not actually send any notification')
    it('should not create audit record')
  });

  describe('createDefaultNotificationPreferences', () => {
    it('should create preferences with all enabled except promotional_sms')
    it('should not overwrite existing preferences')
    it('should return created preferences')
  });
});
```

**Mocking Strategy**:
- Mock Supabase client (`from`, `select`, `insert`, `update`)
- Mock edge function calls (email/SMS endpoints)
- Use factory functions for test data

---

### 2. `notificationHelpers.test.ts` (~200 lines)

**Location**: `supabase/functions/_shared/__tests__/notificationHelpers.test.ts`

**Test Categories**:

```typescript
describe('notificationHelpers', () => {
  describe('getNotificationPreferences', () => {
    it('should return preferences for existing user')
    it('should return null for user without preferences')
    it('should handle Supabase errors gracefully')
  });

  describe('shouldSendEmail', () => {
    // Happy path
    it('should return true when email preference enabled for category')
    it('should return false when email preference disabled')

    // Edge cases
    it('should return false when preferences is null')
    it('should return false for invalid category')
    it('should handle missing preference column gracefully')
  });

  describe('shouldSendSms', () => {
    it('should return true when SMS preference enabled for category')
    it('should return false when SMS preference disabled')
    it('should return false when preferences is null')
    it('should return false for promotional_sms by default')
  });

  describe('sendProposalEmail', () => {
    it('should fire-and-forget email request')
    it('should not throw on failure')
    it('should log error on failure')
    it('should use correct template ID')
  });

  describe('sendProposalSms', () => {
    it('should fire-and-forget SMS request')
    it('should not throw on failure')
    it('should format phone number')
  });

  describe('getHostEmailTemplate', () => {
    it('should return correct template for monthly rental')
    it('should return correct template for flexible rental')
    it('should return default template for unknown type')
  });
});
```

---

### 3. `useNotificationSettings.test.js` (~180 lines)

**Location**: `app/src/islands/shared/NotificationSettingsIsland/__tests__/useNotificationSettings.test.js`

**Test Categories**:

```javascript
describe('useNotificationSettings', () => {
  describe('initial fetch', () => {
    it('should fetch preferences on mount')
    it('should set loading state during fetch')
    it('should handle fetch error gracefully')
    it('should auto-create preferences for new users')
  });

  describe('togglePreference', () => {
    // Optimistic updates
    it('should update state immediately (optimistic)')
    it('should persist change to Supabase')
    it('should rollback on Supabase error')
    it('should show toast on success')
    it('should show error toast on failure')

    // Toggle tracking
    it('should set isTogglePending during update')
    it('should clear isTogglePending after update')
    it('should prevent concurrent toggles on same preference')
  });

  describe('refetch', () => {
    it('should reload preferences from database')
    it('should update state with fresh data')
  });

  describe('edge cases', () => {
    it('should handle null userId')
    it('should handle network timeout')
    it('should handle malformed response')
  });
});
```

**Mocking Strategy**:
- Mock `@supabase/supabase-js` client
- Mock `window.showToast` for toast verification
- Use `@testing-library/react-hooks` for hook testing

---

### 4. `NotificationToggle.test.js` (~100 lines)

**Location**: `app/src/islands/shared/NotificationSettingsIsland/__tests__/NotificationToggle.test.js`

**Test Categories**:

```javascript
describe('NotificationToggle', () => {
  describe('rendering', () => {
    it('should render with correct dimensions (51px × 31px)')
    it('should show active state with purple background (#8B5CF6)')
    it('should show inactive state with gray background (#E0E0E0)')
    it('should position knob correctly based on enabled state')
  });

  describe('interactions', () => {
    it('should call onToggle when clicked')
    it('should not call onToggle when pending')
    it('should show pending/disabled state')
    it('should transition smoothly (0.3s ease)')
  });

  describe('accessibility', () => {
    it('should have role="switch"')
    it('should have aria-checked matching enabled state')
    it('should be keyboard accessible')
  });
});
```

---

### 5. `NotificationCategoryRow.test.js` (~80 lines)

**Location**: `app/src/islands/shared/NotificationSettingsIsland/__tests__/NotificationCategoryRow.test.js`

**Test Categories**:

```javascript
describe('NotificationCategoryRow', () => {
  describe('rendering', () => {
    it('should display category label')
    it('should render SMS toggle')
    it('should render Email toggle')
    it('should show correct enabled states')
  });

  describe('interactions', () => {
    it('should call onToggleSms when SMS toggle clicked')
    it('should call onToggleEmail when Email toggle clicked')
    it('should pass pending states to toggles')
  });

  describe('layout', () => {
    it('should position label on left')
    it('should position toggles on right')
  });
});
```

---

### 6. `notificationCategories.test.js` (~120 lines)

**Location**: `app/src/islands/shared/NotificationSettingsIsland/__tests__/notificationCategories.test.js`

**Test Categories**:

```javascript
describe('notificationCategories', () => {
  describe('NOTIFICATION_CATEGORIES', () => {
    it('should have 11 categories')
    it('should have display info for each category')
    it('should map to correct database columns')
  });

  describe('getAllPreferenceColumns', () => {
    it('should return all 22 column names')
    it('should include both SMS and email columns for each category')
  });

  describe('getDefaultPreferences', () => {
    it('should return all categories with empty arrays')
  });

  describe('isChannelEnabled', () => {
    it('should return true when channel in array')
    it('should return false when channel not in array')
    it('should handle empty array')
    it('should handle null/undefined')
  });

  describe('toggleChannelInArray', () => {
    it('should add channel when not present')
    it('should remove channel when present')
    it('should not mutate original array')
  });
});
```

---

### 7. `notificationPreferences.integration.test.js` (~200 lines)

**Location**: `app/src/__tests__/integration/notificationPreferences.integration.test.js`

**Test Categories**:

```javascript
describe('Notification Preferences Integration', () => {
  describe('full preference lifecycle', () => {
    it('should create default preferences for new user')
    it('should persist toggle changes across sessions')
    it('should reflect changes in notification delivery')
  });

  describe('real-time notification delivery', () => {
    it('should skip email when email preference disabled')
    it('should skip SMS when SMS preference disabled')
    it('should send both when both enabled')
    it('should create audit records for all decisions')
  });

  describe('backfill verification', () => {
    it('should have preferences for all existing users')
    it('should have correct default values')
  });

  describe('UI to backend flow', () => {
    it('should update database when UI toggle clicked')
    it('should rollback UI on database error')
    it('should show appropriate toast messages')
  });
});
```

---

### 8. `notification-migrations.test.sql` (pgTAP, ~100 lines)

**Location**: `supabase/migrations/__tests__/notification-migrations.test.sql`

**Test Categories**:

```sql
-- Schema verification
SELECT has_table('public', 'notification_preferences', 'notification_preferences table exists');
SELECT has_table('public', 'notification_audit', 'notification_audit table exists');

-- Column verification for notification_preferences
SELECT has_column('public', 'notification_preferences', 'user_id', 'has user_id column');
SELECT has_column('public', 'notification_preferences', 'message_forwarding_sms', 'has message_forwarding_sms');
SELECT has_column('public', 'notification_preferences', 'message_forwarding_email', 'has message_forwarding_email');
-- ... (all 22 columns)

-- Default value verification
SELECT col_default_is('public', 'notification_preferences', 'promotional_sms', 'false', 'promotional_sms defaults to false');
SELECT col_default_is('public', 'notification_preferences', 'promotional_email', 'true', 'promotional_email defaults to true');

-- RLS policy verification
SELECT policy_cmd_is('public', 'notification_audit', 'Users can view own audit records', 'SELECT');
SELECT policy_roles_are('public', 'notification_audit', 'Users can view own audit records', ARRAY['authenticated']);

-- Index verification
SELECT has_index('public', 'notification_audit', 'idx_notification_audit_user_id', 'has user_id index');
SELECT has_index('public', 'notification_audit', 'idx_notification_audit_created_at', 'has created_at index');

-- Enum verification
SELECT enum_has_labels('notification_category', ARRAY[
  'proposal_updates', 'message_forwarding', 'payment_reminders',
  'promotional', 'reservation_updates', 'lease_requests',
  'checkin_checkout', 'reviews', 'tips_insights',
  'account_assistance', 'virtual_meetings'
]);

-- Backfill verification
SELECT results_eq(
  'SELECT count(*) FROM notification_preferences WHERE user_id IS NOT NULL',
  'SELECT count(DISTINCT id) FROM auth.users',
  'All users have notification preferences'
);
```

---

## Implementation Order

1. **notificationCategories.test.js** - Pure utility functions (no mocking)
2. **NotificationToggle.test.js** - Simple component tests
3. **NotificationCategoryRow.test.js** - Simple component tests
4. **notificationHelpers.test.ts** - Backend utilities with mocking
5. **notificationSender.test.ts** - Complex backend logic
6. **useNotificationSettings.test.js** - Hook with mocking
7. **notificationPreferences.integration.test.js** - Integration tests
8. **notification-migrations.test.sql** - Database verification

---

## Dependencies to Install

```bash
# For React hook testing
bun add -D @testing-library/react-hooks

# For Supabase mocking (if not already present)
bun add -D vitest-mock-extended
```

---

## Execution Command

```bash
# Run all notification tests
bun run test -- --grep "notification"

# Run specific test file
bun run test -- app/src/islands/shared/NotificationSettingsIsland/__tests__/useNotificationSettings.test.js

# Run with coverage
bun run test -- --coverage --grep "notification"
```

---

## Success Criteria

- [ ] All 8 test files created and passing
- [ ] >80% code coverage for notification system
- [ ] Integration tests verify E2E flow
- [ ] Migration tests verify schema correctness
- [ ] No regressions in existing functionality
- [ ] Tests follow existing Vitest/RTL patterns

---

## Files to Read Before Implementation

1. `supabase/functions/_shared/notificationSender.ts`
2. `supabase/functions/_shared/notificationHelpers.ts`
3. `app/src/islands/shared/NotificationSettingsIsland/useNotificationSettings.js`
4. `app/src/islands/shared/NotificationSettingsIsland/NotificationToggle.jsx`
5. `app/src/islands/shared/NotificationSettingsIsland/notificationCategories.js`
6. `supabase/migrations/20260128190000_create_notification_audit.sql`
7. `supabase/migrations/20260128190100_backfill_notification_preferences.sql`
8. Existing test examples: `app/src/logic/rules/__tests__/canAcceptProposal.test.js`

---

## Notes

- Use Vitest for all JavaScript/TypeScript tests
- Use pgTAP for PostgreSQL migration verification
- Follow existing test patterns in the codebase
- Prefer testing-library/react for component tests
- Mock Supabase client consistently across tests
