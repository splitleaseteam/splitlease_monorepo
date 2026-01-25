# WebSocket Realtime Testing Opportunity Report
**Generated:** 2026-01-25T11:06:56Z
**Codebase:** Split Lease
**Auditor:** Claude Code Audit Agent

## Executive Summary
- Real-time features found: **4 distinct implementations**
- Features needing tests: **4** (100% coverage gap)
- Mock WebSocket setup exists: **No**
- Test infrastructure: **Minimal** (no Vitest/Jest configured for unit tests)

## Infrastructure Check

### WebSocket Test Setup Status
- [ ] `MockWebSocket` class exists
- [ ] `vi.stubGlobal('WebSocket', MockWebSocket)` in setup
- [ ] Supabase channel mocks exist
- [ ] E2E `page.routeWebSocket()` patterns exist

### Test Infrastructure Status
The codebase has **no unit test framework configured** (no Vitest, Jest, or testing-library in `app/package.json`). The only test file found is:
- `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`

**Critical Finding:** Without a testing framework, none of the real-time features can be unit tested. This is a prerequisite gap.

---

## Critical Gaps (No Tests)

### 1. Messaging Page Real-time Chat

**Files:**
- Hook: `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`
- Component: `app/src/islands/pages/MessagingPage/MessagingPage.jsx`

**Supabase Realtime Usage:**
- `supabase.channel()` at line 216
- `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: '_message' })` at lines 221-227
- `.on('presence', { event: 'sync' })` at line 280
- `.subscribe()` at line 295
- Cleanup with `channel.unsubscribe()` at line 318

**Real-time Features Implemented:**
1. **New message reception** - postgres_changes INSERT events
2. **Typing indicators** - Presence sync with `channel.track()`
3. **Connection status handling** - SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT

**Missing Tests:**
- [ ] Channel subscription on thread selection
- [ ] INSERT event handling for new messages
- [ ] Message deduplication logic
- [ ] Typing indicator shows when other user types
- [ ] Typing indicator hides after 2 seconds of no input
- [ ] Presence state tracking
- [ ] Unsubscribe on thread change
- [ ] Cleanup on unmount

---

### 2. Header Messaging Panel Real-time Chat

**Files:**
- Hook: `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`
- Component: `app/src/islands/shared/HeaderMessagingPanel/HeaderMessagingPanel.jsx`

**Supabase Realtime Usage:**
- `supabase.channel()` at line 112
- `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: '_message' })` at lines 115-122
- `.on('presence', { event: 'sync' })` at line 176
- `.subscribe()` at line 191
- Cleanup with `channel.unsubscribe()` at line 205

**Real-time Features Implemented:**
1. **New message reception** - postgres_changes INSERT events (shared pattern with MessagingPage)
2. **Typing indicators** - Presence sync
3. **Compact panel variant** - Same realtime logic, different UI

**Missing Tests:**
- [ ] Channel subscription when panel opens
- [ ] INSERT event handling for new messages
- [ ] Client-side thread filtering (line 127-129)
- [ ] Typing indicator via presence
- [ ] Unsubscribe when panel closes
- [ ] Unsubscribe on thread change
- [ ] Cleanup on unmount

---

### 3. Logged-in Avatar Unread Message Badge

**Files:**
- Hook: `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`
- Component: `app/src/islands/shared/LoggedInAvatar/LoggedInAvatar.jsx`

**Supabase Realtime Usage:**
- `supabase.channel('header-unread-messages')` at line 417
- `.on('postgres_changes', { event: '*', schema: 'public', table: '_message' })` at lines 419-425
- `.subscribe()` at line 433
- Cleanup with `supabase.removeChannel(channel)` at line 439

**Real-time Features Implemented:**
1. **Unread message count updates** - INSERT/UPDATE/DELETE on _message table
2. **Re-fetch on any message change** - Listens to all events (*)

**Missing Tests:**
- [ ] Channel subscription on mount
- [ ] Badge updates on new message (INSERT)
- [ ] Badge updates when message marked as read (UPDATE)
- [ ] Badge updates when message deleted (DELETE)
- [ ] Cleanup on unmount
- [ ] Initial unread count fetch

---

### 4. AI Suggestions Real-time Updates

**Files:**
- Hook: `app/src/islands/shared/AISuggestions/useAISuggestionsState.js`
- Component: `app/src/islands/shared/AISuggestions/AISuggestions.jsx` (assumed)

**Supabase Realtime Usage:**
- `supabase.channel()` at line 203
- `.on('postgres_changes', { event: '*', schema: 'public', table: 'zat_aisuggestions', filter: ... })` at lines 205-212
- `.subscribe()` at line 227
- Cleanup with `supabase.removeChannel(channel)` at line 230

**Real-time Features Implemented:**
1. **New suggestion reception** - INSERT events trigger ADD_SUGGESTIONS
2. **Suggestion updates** - UPDATE events trigger UPDATE_SUGGESTION or REMOVE_SUGGESTION
3. **Suggestion deletion** - DELETE events trigger REMOVE_SUGGESTION
4. **Filtered subscription** - Uses `filter: House Manual=eq.${houseManualId}`

**Missing Tests:**
- [ ] Channel subscription when modal opens
- [ ] INSERT event adds new suggestion to state
- [ ] UPDATE event updates existing suggestion
- [ ] UPDATE with decision='ignored' removes suggestion
- [ ] DELETE event removes suggestion
- [ ] Filter correctly scopes to house manual
- [ ] Unsubscribe when modal closes
- [ ] Cleanup on unmount

---

## Connection Handling Gaps

### Reconnection Logic
| Feature | Has Reconnection | Tested |
|---------|------------------|--------|
| Messaging Page | Implicit (Supabase handles) | No |
| Header Panel | Implicit (Supabase handles) | No |
| Unread Badge | Implicit (Supabase handles) | No |
| AI Suggestions | Implicit (Supabase handles) | No |

### Disconnect Handling
| Feature | Shows Disconnect UI | Tested |
|---------|---------------------|--------|
| Messaging Page | Yes (status logging) | No |
| Header Panel | No | No |
| Unread Badge | No | No |
| AI Suggestions | No | No |

### Connection Status States Handled
- `SUBSCRIBED` - Success logging
- `CHANNEL_ERROR` - Error logging (MessagingPage only)
- `TIMED_OUT` - Error logging (MessagingPage only)

---

## E2E Test Gaps

### Missing E2E WebSocket Tests
| Feature | Test File | Status |
|---------|-----------|--------|
| Send message and receive via realtime | None | **Missing** |
| Typing indicators display | None | **Missing** |
| Unread badge updates | None | **Missing** |
| AI suggestions live updates | None | **Missing** |
| Connection loss recovery | None | **Missing** |
| Multi-tab message sync | None | **Missing** |

---

## Components with Good Coverage (Reference)

**None found.** No real-time features have any test coverage.

---

## Recommended MockWebSocket Class

```typescript
// src/test/mocks/MockWebSocket.ts
export class MockWebSocket {
  static instances: MockWebSocket[] = []

  url: string
  readyState: number = WebSocket.CONNECTING
  onopen: ((e: Event) => void) | null = null
  onclose: ((e: CloseEvent) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null

  sentMessages: string[] = []

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 0)
  }

  send(data: string) { this.sentMessages.push(data) }
  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED
    this.onclose?.(new CloseEvent('close', { code, reason }))
  }

  simulateMessage(data: any) {
    this.onmessage?.(new MessageEvent('message', {
      data: typeof data === 'string' ? data : JSON.stringify(data)
    }))
  }

  static reset() { MockWebSocket.instances = [] }
  static getLastInstance() { return MockWebSocket.instances.at(-1) }
}
```

---

## Recommended Supabase Channel Mock

```typescript
// src/test/mocks/mockSupabase.ts
export function createMockSupabase() {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockImplementation((callback) => {
      // Simulate successful subscription
      setTimeout(() => callback?.('SUBSCRIBED'), 0)
      return { status: 'SUBSCRIBED' }
    }),
    unsubscribe: vi.fn(),
    track: vi.fn().mockResolvedValue(undefined),
    presenceState: vi.fn().mockReturnValue({}),
  }

  return {
    supabase: {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn(),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
      },
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    },
    mockChannel,
  }
}

// Usage in test setup:
vi.mock('@/lib/supabase', () => createMockSupabase())
```

---

## Recommended Playwright E2E Pattern

```typescript
// e2e/messaging.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Real-time Messaging', () => {
  test('receives messages via WebSocket', async ({ page }) => {
    // Intercept and mock WebSocket
    await page.routeWebSocket('wss://*/realtime/*', ws => {
      ws.onMessage(message => {
        const data = JSON.parse(message)

        // Handle heartbeat
        if (data.topic === 'phoenix' && data.event === 'heartbeat') {
          ws.send(JSON.stringify({
            topic: 'phoenix',
            event: 'phx_reply',
            ref: data.ref,
            payload: { status: 'ok' }
          }))
          return
        }

        // Handle subscription
        if (data.event === 'phx_join') {
          ws.send(JSON.stringify({
            topic: data.topic,
            event: 'phx_reply',
            ref: data.ref,
            payload: { status: 'ok', response: {} }
          }))
        }
      })

      // Simulate incoming message after 2 seconds
      setTimeout(() => {
        ws.send(JSON.stringify({
          topic: 'realtime:public:_message',
          event: 'postgres_changes',
          payload: {
            type: 'INSERT',
            new: {
              _id: 'msg-test-123',
              'Message Body': 'Hello from test!',
              'Associated Thread/Conversation': 'thread-id',
              '-Originator User': 'other-user-id',
              'Created Date': new Date().toISOString(),
            }
          }
        }))
      }, 2000)
    })

    // Navigate to messaging page
    await page.goto('/messaging?thread=thread-id')

    // Wait for message to appear
    await expect(page.getByText('Hello from test!')).toBeVisible({ timeout: 5000 })
  })
})
```

---

## Priority Recommendations

### Priority 1: Test Infrastructure (Prerequisite)
1. Add Vitest and React Testing Library to `app/package.json`
2. Create `vitest.config.ts` with proper setup
3. Create mock files for Supabase client

### Priority 2: Unit Tests for Core Real-time Hooks
1. `useMessagingPageLogic.js` - Most critical, handles user messaging
2. `useHeaderMessagingPanelLogic.js` - Compact messaging variant
3. `useLoggedInAvatarData.js` - Unread badge notification

### Priority 3: Integration Tests
1. Message sending flow end-to-end
2. Real-time message reception
3. Typing indicator visibility

### Priority 4: E2E Tests
1. Full messaging flow with mocked WebSocket
2. Multi-user message sync scenarios
3. Connection recovery testing

---

## Anti-Patterns Found

| Pattern Found | Location | Recommendation |
|--------------|----------|----------------|
| No error recovery UI | All hooks | Add connection status indicator |
| Client-side thread filtering | Both messaging hooks | Consider server-side filter (if supported) |
| Manual deduplication | Lines 246-248, 134-135 | Already implemented, ensure tested |
| Hardcoded timeout (2000ms) | Typing indicator timeout | Extract to constant, test timing |

---

## Summary

**Total Real-time Features:** 4
**Features with Tests:** 0
**Test Coverage:** 0%

**Highest Risk:**
1. **Messaging hooks** - Core user functionality with no tests
2. **Unread badge** - Visible to all logged-in users, untested

**Recommendation:** Before adding real-time tests, first establish the test infrastructure (Vitest + React Testing Library + Supabase mocks). This is a blocking prerequisite for all unit/integration testing of real-time features.
