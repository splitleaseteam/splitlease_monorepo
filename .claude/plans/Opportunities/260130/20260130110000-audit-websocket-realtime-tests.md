# WebSocket Realtime Testing Opportunity Report
**Generated:** 2026-01-30T11:00:00Z
**Codebase:** Split Lease

## Executive Summary
- Real-time features found: 4
- Features needing tests: 4
- Mock WebSocket setup exists: No

## Infrastructure Check

### WebSocket Test Setup Status
- [ ] `MockWebSocket` class exists
- [ ] `vi.stubGlobal('WebSocket', MockWebSocket)` in setup
- [ ] Supabase channel mocks exist
- [ ] E2E `page.routeWebSocket()` patterns exist

**Current State:** No WebSocket/Realtime test infrastructure exists in the codebase. All 4 real-time features are completely untested.

---

## Critical Gaps (No Tests)

### 1. MessagingPage Real-time Subscription
- **Files:**
  - Hook: `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`
  - Component: `app/src/islands/pages/MessagingPage/MessagingPage.jsx`
  - Typing Indicator: `app/src/islands/pages/MessagingPage/components/TypingIndicator.jsx`
- **Supabase Realtime Usage:**
  - `supabase.channel()` at line 216
  - `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: '_message' })` at line 221
  - `.on('presence', { event: 'sync' })` at line 280 (typing indicators)
  - `.subscribe()` at line 295
  - `.track()` for presence at lines 300, 334
  - `channel.unsubscribe()` cleanup at line 318
- **Missing Tests:**
  - [ ] Channel subscription on thread selection
  - [ ] INSERT event handling for new messages
  - [ ] Duplicate message prevention (lines 247-248)
  - [ ] Message transformation from DB row to UI format
  - [ ] Presence sync event handling for typing indicators
  - [ ] `trackTyping()` function broadcasts typing state
  - [ ] Typing indicator timeout (2 second debounce at line 897)
  - [ ] Channel unsubscribe on thread change/unmount
  - [ ] CHANNEL_ERROR and TIMED_OUT status handling

### 2. HeaderMessagingPanel Real-time Subscription
- **Files:**
  - Hook: `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`
- **Supabase Realtime Usage:**
  - `supabase.channel()` at line 112
  - `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: '_message' })` at line 115
  - `.on('presence', { event: 'sync' })` at line 176 (typing indicators)
  - `.subscribe()` at line 191
  - `.track()` for presence at lines 193, 218
  - `channel.unsubscribe()` cleanup at line 205
- **Missing Tests:**
  - [ ] Channel subscription when panel opens
  - [ ] INSERT event handling for new messages
  - [ ] Client-side thread filtering (line 127)
  - [ ] Presence sync for typing indicators
  - [ ] Channel cleanup on panel close
  - [ ] Typing broadcast via presence

### 3. AISuggestions Real-time Subscription
- **Files:**
  - Hook: `app/src/islands/shared/AISuggestions/useAISuggestionsState.js`
- **Supabase Realtime Usage:**
  - `supabase.channel()` at line 203
  - `.on('postgres_changes', { event: '*', schema: 'public', table: 'zat_aisuggestions' })` at line 205
  - `.subscribe()` at line 227
  - `supabase.removeChannel()` cleanup at line 230
- **Missing Tests:**
  - [ ] Channel subscription when modal opens
  - [ ] INSERT event adds new suggestions
  - [ ] UPDATE event updates existing suggestions
  - [ ] UPDATE event with `decision='ignored'` removes suggestion
  - [ ] DELETE event removes suggestion
  - [ ] Channel cleanup on modal close
  - [ ] Filter on `House Manual=eq.${houseManualId}`

### 4. LoggedInAvatar Unread Messages Real-time
- **Files:**
  - Hook: `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`
- **Supabase Realtime Usage:**
  - `supabase.channel('header-unread-messages')` at line 419
  - `.on('postgres_changes', { event: '*', schema: 'public', table: '_message' })` at line 421
  - `.subscribe()` at line 435
  - `supabase.removeChannel()` cleanup at line 441
- **Missing Tests:**
  - [ ] Channel subscription on mount
  - [ ] Unread count update on INSERT event
  - [ ] Unread count update on UPDATE event (message marked read)
  - [ ] Unread count update on DELETE event
  - [ ] Channel cleanup on unmount

---

## Connection Handling Gaps

### Reconnection Logic
| Feature | Has Reconnection | Tested |
|---------|------------------|--------|
| MessagingPage | Supabase built-in | No |
| HeaderMessagingPanel | Supabase built-in | No |
| AISuggestions | Supabase built-in | No |
| LoggedInAvatar | Supabase built-in | No |

### Disconnect Handling
| Feature | Shows Disconnect UI | Tested |
|---------|---------------------|--------|
| MessagingPage | No (logs error only) | No |
| HeaderMessagingPanel | No | No |

### Error Status Handling
| Feature | Handles CHANNEL_ERROR | Handles TIMED_OUT | Tested |
|---------|----------------------|-------------------|--------|
| MessagingPage | Logs only (line 307) | Logs only (line 309) | No |
| HeaderMessagingPanel | No | No | No |

---

## E2E Test Gaps

### Missing E2E WebSocket Tests
| Feature | Test File | Status |
|---------|-----------|--------|
| Messaging send/receive | None | Missing |
| Typing indicators | None | Missing |
| Connection loss recovery | None | Missing |
| Unread badge updates | None | Missing |

### Existing E2E Tests (for reference)
- `e2e/tests/auth.spec.ts` - Authentication flows
- `e2e/tests/search.spec.ts` - Search functionality
- `e2e/tests/booking.spec.ts` - Booking flows
- `e2e/tests/profile.spec.ts` - Profile management
- `e2e/tests/admin.spec.ts` - Admin features
- `e2e/tests/accessibility.spec.ts` - A11y testing

---

## Typing Indicator Component

### TypingIndicator.jsx
- **File:** `app/src/islands/pages/MessagingPage/components/TypingIndicator.jsx`
- **Lines:** 1-27
- **Behavior:**
  - Renders null when `userName` is falsy
  - Shows animated dots + "{userName} is typing..." text
- **Missing Tests:**
  - [ ] Renders nothing when userName is null/undefined
  - [ ] Renders correctly when userName is provided
  - [ ] Animation CSS class presence

---

## Components with Good Coverage (Reference)

None. No real-time components have any test coverage.

---

## Recommended MockWebSocket Class

```typescript
// app/src/test/mocks/MockWebSocket.ts
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
// app/src/test/mocks/supabaseMocks.ts
import { vi } from 'vitest'

export function createMockChannel() {
  const subscribers: Record<string, Function[]> = {}
  const presenceState: Record<string, any[]> = {}

  const mockChannel = {
    on: vi.fn((event: string, filter: any, callback: Function) => {
      const key = typeof filter === 'object' ? `${event}:${filter.event || 'default'}` : event
      subscribers[key] = subscribers[key] || []
      subscribers[key].push(callback)
      return mockChannel
    }),
    subscribe: vi.fn((callback?: Function) => {
      setTimeout(() => callback?.('SUBSCRIBED'), 0)
      return { status: 'SUBSCRIBED' }
    }),
    unsubscribe: vi.fn(),
    track: vi.fn().mockResolvedValue({}),
    presenceState: vi.fn(() => presenceState),

    // Test helpers
    _simulatePostgresChange: (eventType: string, payload: any) => {
      const callbacks = subscribers['postgres_changes:default'] || []
      callbacks.forEach(cb => cb({ eventType, new: payload.new, old: payload.old }))
    },
    _simulatePresenceSync: (state: Record<string, any[]>) => {
      Object.assign(presenceState, state)
      const callbacks = subscribers['presence:sync'] || []
      callbacks.forEach(cb => cb())
    }
  }

  return mockChannel
}

export function createSupabaseMock() {
  const channels: Record<string, ReturnType<typeof createMockChannel>> = {}

  return {
    channel: vi.fn((name: string) => {
      if (!channels[name]) {
        channels[name] = createMockChannel()
      }
      return channels[name]
    }),
    removeChannel: vi.fn((channel: any) => {
      channel.unsubscribe()
    }),

    // Test helpers
    _getChannel: (name: string) => channels[name],
    _clearChannels: () => Object.keys(channels).forEach(k => delete channels[k])
  }
}
```

---

## Recommended Test Patterns

### Pattern 1: Hook Test with Channel Mock

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createSupabaseMock } from '../mocks/supabaseMocks'

vi.mock('@/lib/supabase', () => ({
  supabase: createSupabaseMock()
}))

import { supabase } from '@/lib/supabase'
import { useMessagingPageLogic } from './useMessagingPageLogic'

describe('useMessagingPageLogic realtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase._clearChannels()
  })

  it('subscribes to channel on thread selection', async () => {
    const { result } = renderHook(() => useMessagingPageLogic())

    // Simulate thread selection
    act(() => {
      result.current.handleThreadSelect({ _id: 'thread-123', contact_name: 'John' })
    })

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('messages-thread-123')
    })
  })

  it('handles incoming message via postgres_changes', async () => {
    const { result } = renderHook(() => useMessagingPageLogic())

    act(() => {
      result.current.handleThreadSelect({ _id: 'thread-123', contact_name: 'John' })
    })

    const channel = supabase._getChannel('messages-thread-123')

    act(() => {
      channel._simulatePostgresChange('INSERT', {
        new: {
          _id: 'msg-1',
          thread_id: 'thread-123',
          'Message Body': 'Hello!',
          'Created Date': new Date().toISOString()
        }
      })
    })

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0].message_body).toBe('Hello!')
    })
  })
})
```

### Pattern 2: Typing Indicator Test

```typescript
it('shows typing indicator via presence sync', async () => {
  const { result } = renderHook(() => useMessagingPageLogic())

  act(() => {
    result.current.handleThreadSelect({ _id: 'thread-123', contact_name: 'Jane' })
  })

  const channel = supabase._getChannel('messages-thread-123')

  act(() => {
    channel._simulatePresenceSync({
      'user-456': [{ user_id: 'user-456', user_name: 'Jane', typing: true }]
    })
  })

  await waitFor(() => {
    expect(result.current.isOtherUserTyping).toBe(true)
    expect(result.current.typingUserName).toBe('Jane')
  })
})
```

### Pattern 3: E2E with routeWebSocket

```typescript
// e2e/tests/messaging.spec.ts
import { test, expect } from '@playwright/test'

test('receives real-time messages', async ({ page }) => {
  // Mock WebSocket for Supabase Realtime
  await page.routeWebSocket('wss://*/realtime/*', ws => {
    ws.onMessage(message => {
      const data = JSON.parse(message)

      // Handle subscription
      if (data.topic?.includes('realtime:')) {
        ws.send(JSON.stringify({
          event: 'phx_reply',
          ref: data.ref,
          payload: { status: 'ok' }
        }))
      }
    })

    // Simulate incoming message after 2s
    setTimeout(() => {
      ws.send(JSON.stringify({
        event: 'postgres_changes',
        payload: {
          data: {
            record: {
              _id: 'new-msg',
              'Message Body': 'Real-time message!',
              thread_id: 'current-thread'
            },
            type: 'INSERT'
          }
        }
      }))
    }, 2000)
  })

  await page.goto('/messages?thread=current-thread')

  // Wait for real-time message
  await expect(page.locator('text=Real-time message!')).toBeVisible({ timeout: 5000 })
})
```

---

## Priority Order for Implementation

1. **High Priority** - MessagingPage (core user feature)
   - Channel subscription/unsubscription
   - Message reception via postgres_changes
   - Typing indicators via presence

2. **High Priority** - HeaderMessagingPanel (always visible)
   - Same patterns as MessagingPage
   - Panel-specific lifecycle (open/close)

3. **Medium Priority** - LoggedInAvatar unread count
   - Badge updates in real-time
   - Count accuracy

4. **Lower Priority** - AISuggestions
   - Less frequently used feature
   - Same channel patterns

---

## Anti-Patterns Found

| Issue | Location | Recommendation |
|-------|----------|----------------|
| No error UI for CHANNEL_ERROR | useMessagingPageLogic.js:307 | Show connection error toast |
| No error UI for TIMED_OUT | useMessagingPageLogic.js:309 | Show retry button |
| No reconnection indicator | Both messaging hooks | Show "Reconnecting..." UI |
| Client-side filtering only | useMessagingPageLogic.js:235 | Use server-side filter if possible |

---

## Summary

The Split Lease codebase has **4 real-time features** using Supabase Realtime channels, and **none of them have any test coverage**. The infrastructure for mocking WebSocket/Supabase channels does not exist.

**Immediate Actions:**
1. Create `MockWebSocket` class and Supabase channel mocks
2. Add unit tests for `useMessagingPageLogic` realtime subscription
3. Add E2E tests for messaging with `page.routeWebSocket()`
4. Add error handling UI for connection failures
