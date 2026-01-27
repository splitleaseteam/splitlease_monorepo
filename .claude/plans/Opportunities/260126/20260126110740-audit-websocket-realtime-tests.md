# WebSocket Realtime Testing Opportunity Report
**Generated:** 2026-01-26T11:07:40
**Codebase:** Split Lease
**Audit Type:** WebSocket & Supabase Realtime Test Coverage

## Executive Summary
- Real-time features found: **5**
- Features needing tests: **5** (100%)
- Mock WebSocket setup exists: **No**
- Supabase channel mocks exist: **No**
- Test infrastructure status: **Minimal** (only 1 test file exists, no Vitest config)

## Infrastructure Check

### WebSocket Test Setup Status
- [ ] `MockWebSocket` class exists
- [ ] `vi.stubGlobal('WebSocket', MockWebSocket)` in setup
- [ ] Supabase channel mocks exist
- [ ] E2E `page.routeWebSocket()` patterns exist
- [ ] Vitest configuration file exists
- [ ] Test setup file with global mocks

### Current Test Infrastructure
The codebase has **minimal test infrastructure**:
- **1 test file**: `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`
- **No Vitest config** (`vitest.config.js` not found)
- **No test setup** file with global mocks
- **No Supabase mocks** for realtime channels
- **No WebSocket mocks** for connection testing

### Package.json Test Configuration
```json
"test": "bun run test:stop && bun run lint && bun run knip && vite --port 8001 --strictPort"
```
Note: This is not a test runner - it starts a Vite dev server on port 8001. No actual test runner (Vitest/Jest) is configured.

---

## Critical Gaps (No Tests)

### 1. MessagingPage - Real-time Chat (PRIMARY)
**Priority: CRITICAL**

- **Files:**
  - Logic Hook: `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`
  - Component: `app/src/islands/pages/MessagingPage/MessagingPage.jsx`
  - Thread Component: `app/src/islands/pages/MessagingPage/components/MessageThread.jsx`
  - Typing Indicator: `app/src/islands/pages/MessagingPage/components/TypingIndicator.jsx`

- **Supabase Realtime Usage:**
  - `supabase.channel(channelName)` at line 216
  - `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: '_message' })` at lines 221-227
  - `.on('presence', { event: 'sync' })` at line 280 (typing indicators)
  - `.subscribe()` at line 295
  - `channel.track()` for presence at line 300
  - Cleanup via `channel.unsubscribe()` at line 318

- **Features Requiring Tests:**
  - [ ] Channel subscription on thread selection
  - [ ] Message reception via postgres_changes INSERT
  - [ ] Client-side filtering for thread-specific messages (line 235)
  - [ ] Optimistic message updates (lines 580-595)
  - [ ] Typing indicator via Presence API
  - [ ] Presence state sync for typing users (lines 280-293)
  - [ ] `trackTyping()` function (lines 330-344)
  - [ ] Channel cleanup on unmount/thread change
  - [ ] Reconnection handling (CHANNEL_ERROR, TIMED_OUT states)

---

### 2. HeaderMessagingPanel - Compact Chat Panel
**Priority: HIGH**

- **Files:**
  - Logic Hook: `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`
  - Component: `app/src/islands/shared/HeaderMessagingPanel/HeaderMessagingPanel.jsx`

- **Supabase Realtime Usage:**
  - `supabase.channel(channelName)` at line 112
  - `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: '_message' })` at lines 115-122
  - `.on('presence', { event: 'sync' })` at line 176 (typing indicators)
  - `.subscribe()` at line 191
  - `channel.track()` for presence at line 193
  - Cleanup via `channel.unsubscribe()` at line 205

- **Features Requiring Tests:**
  - [ ] Channel subscription when panel opens with selected thread
  - [ ] Message reception via postgres_changes INSERT
  - [ ] Client-side filtering for thread-specific messages (line 127)
  - [ ] Optimistic message updates (lines 471-488)
  - [ ] Typing indicator via Presence API
  - [ ] `trackTyping()` function (lines 213-230)
  - [ ] Channel cleanup when panel closes
  - [ ] Cleanup when thread deselected

---

### 3. LoggedInAvatar - Unread Message Notifications
**Priority: HIGH**

- **Files:**
  - Logic Hook: `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`

- **Supabase Realtime Usage:**
  - `supabase.channel('header-unread-messages')` at line 417
  - `.on('postgres_changes', { event: '*', schema: 'public', table: '_message' })` at lines 419-425
  - `.subscribe()` at line 433
  - Cleanup via `supabase.removeChannel(channel)` at line 439

- **Features Requiring Tests:**
  - [ ] Channel subscription on mount
  - [ ] Unread count update on INSERT event
  - [ ] Unread count update on UPDATE event (message marked as read)
  - [ ] Unread count update on DELETE event
  - [ ] Callback to `fetchUnreadCount()` on any message change
  - [ ] Channel cleanup on unmount

---

### 4. AISuggestions - Real-time Suggestion Updates
**Priority: MEDIUM**

- **Files:**
  - State Hook: `app/src/islands/shared/AISuggestions/useAISuggestionsState.js`

- **Supabase Realtime Usage:**
  - `supabase.channel(\`suggestions:\${houseManualId}\`)` at line 203
  - `.on('postgres_changes', { event: '*', schema: 'public', table: 'zat_aisuggestions', filter: ... })` at lines 205-212
  - `.subscribe()` at line 227
  - Cleanup via `supabase.removeChannel(channel)` at line 230

- **Features Requiring Tests:**
  - [ ] Channel subscription when modal opens
  - [ ] INSERT event adds new suggestion to state
  - [ ] UPDATE event updates existing suggestion
  - [ ] UPDATE with decision='ignored' removes suggestion
  - [ ] DELETE event removes suggestion from state
  - [ ] Filtered subscription (only this house manual's suggestions)
  - [ ] Channel cleanup when modal closes

---

### 5. TypingIndicator Component
**Priority: LOW** (UI-only, logic tested elsewhere)

- **Files:**
  - Component: `app/src/islands/pages/MessagingPage/components/TypingIndicator.jsx`

- **Features Requiring Tests:**
  - [ ] Renders when `userName` prop is provided
  - [ ] Returns null when `userName` is falsy
  - [ ] Displays typing animation and user name

---

## Connection Handling Gaps

### Reconnection Logic
| Feature | Has Reconnection Logic | Tested |
|---------|------------------------|--------|
| MessagingPage Chat | Partial (logs CHANNEL_ERROR, TIMED_OUT) | No |
| HeaderMessagingPanel | No explicit handling | No |
| LoggedInAvatar Notifications | No explicit handling | No |
| AISuggestions | No explicit handling | No |

### Disconnect Handling
| Feature | Shows Disconnect State | Tested |
|---------|------------------------|--------|
| MessagingPage Chat | No UI indicator | No |
| HeaderMessagingPanel | No UI indicator | No |

### Presence/Online Status
| Feature | Uses Presence | Shows Online Status | Tested |
|---------|--------------|---------------------|--------|
| MessagingPage | Yes (typing only) | No | No |
| HeaderMessagingPanel | Yes (typing only) | No | No |

---

## E2E Test Gaps

### Missing E2E WebSocket Tests
| Feature | Test File | Status |
|---------|-----------|--------|
| Send/receive messages | None | Missing |
| Connection loss recovery | None | Missing |
| Typing indicators | None | Missing |
| Real-time notifications | None | Missing |
| AI suggestions updates | None | Missing |

---

## Components with Good Coverage (Reference)

**None** - No real-time features have test coverage currently.

---

## Recommended Test Infrastructure Setup

### 1. Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 2. MockWebSocket Class
```typescript
// src/test/mocks/MockWebSocket.ts
export class MockWebSocket {
  static instances: MockWebSocket[] = []

  url: string
  readyState: number = WebSocket.CONNECTING
  onopen: ((e: Event) => void) | null = null
  onclose: ((e: CloseEvent) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null

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

  simulateError() {
    this.onerror?.(new Event('error'))
  }

  static reset() { MockWebSocket.instances = [] }
  static getLastInstance() { return MockWebSocket.instances.at(-1) }
}
```

### 3. Supabase Channel Mock
```typescript
// src/test/mocks/supabaseMock.ts
import { vi } from 'vitest'

export const createMockChannel = () => {
  const handlers: Record<string, Function[]> = {}

  const mockChannel = {
    on: vi.fn((event: string, config: any, callback?: Function) => {
      const key = typeof config === 'string' ? `${event}:${config}` : `${event}:${config.event}`
      handlers[key] = handlers[key] || []
      if (callback) handlers[key].push(callback)
      else if (typeof config === 'function') handlers[key].push(config)
      return mockChannel
    }),
    subscribe: vi.fn((callback?: (status: string) => void) => {
      callback?.('SUBSCRIBED')
      return { status: 'SUBSCRIBED' }
    }),
    unsubscribe: vi.fn(),
    track: vi.fn(),
    presenceState: vi.fn(() => ({})),

    // Test helpers
    _handlers: handlers,
    _simulatePostgresChange: (eventType: string, payload: any) => {
      const key = `postgres_changes:${eventType}`
      handlers[key]?.forEach(fn => fn(payload))
    },
    _simulatePresenceSync: () => {
      handlers['presence:sync']?.forEach(fn => fn())
    },
  }

  return mockChannel
}

export const createSupabaseMock = () => {
  const channels: Record<string, ReturnType<typeof createMockChannel>> = {}

  return {
    channel: vi.fn((name: string) => {
      if (!channels[name]) {
        channels[name] = createMockChannel()
      }
      return channels[name]
    }),
    removeChannel: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    _getChannel: (name: string) => channels[name],
    _channels: channels,
  }
}
```

### 4. Test Setup File
```typescript
// src/test/setup.ts
import { vi, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MockWebSocket } from './mocks/MockWebSocket'
import { createSupabaseMock } from './mocks/supabaseMock'

// Reset mocks before each test
beforeEach(() => {
  MockWebSocket.reset()
  vi.stubGlobal('WebSocket', MockWebSocket)
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock Supabase globally
vi.mock('@/lib/supabase', () => ({
  supabase: createSupabaseMock(),
}))
```

---

## Example Test Patterns

### Pattern 1: Testing Real-time Message Reception
```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMessagingPageLogic } from './useMessagingPageLogic'
import { supabase } from '@/lib/supabase'

describe('useMessagingPageLogic - Realtime', () => {
  it('receives messages via postgres_changes', async () => {
    const { result } = renderHook(() => useMessagingPageLogic())

    // Select a thread
    act(() => {
      result.current.handleThreadSelect({ _id: 'thread-123', contact_name: 'John' })
    })

    // Wait for subscription
    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('messages-thread-123')
    })

    // Simulate incoming message
    const mockChannel = supabase._getChannel('messages-thread-123')
    act(() => {
      mockChannel._simulatePostgresChange('INSERT', {
        new: {
          _id: 'msg-1',
          'Message Body': 'Hello!',
          'Associated Thread/Conversation': 'thread-123',
          '-Originator User': 'other-user',
          'Created Date': new Date().toISOString(),
        }
      })
    })

    // Verify message added to state
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].message_body).toBe('Hello!')
  })
})
```

### Pattern 2: Testing Typing Indicators
```typescript
it('shows typing indicator when other user types', async () => {
  const { result } = renderHook(() => useMessagingPageLogic())

  // Select thread and subscribe
  act(() => {
    result.current.handleThreadSelect({ _id: 'thread-123', contact_name: 'John' })
  })

  const mockChannel = supabase._getChannel('messages-thread-123')

  // Mock presence state with typing user
  mockChannel.presenceState.mockReturnValue({
    'user-456': [{ user_id: 'user-456', user_name: 'John', typing: true }]
  })

  // Trigger presence sync
  act(() => {
    mockChannel._simulatePresenceSync()
  })

  expect(result.current.isOtherUserTyping).toBe(true)
  expect(result.current.typingUserName).toBe('John')
})
```

### Pattern 3: Testing Channel Cleanup
```typescript
it('unsubscribes from channel when thread changes', async () => {
  const { result } = renderHook(() => useMessagingPageLogic())

  // Select first thread
  act(() => {
    result.current.handleThreadSelect({ _id: 'thread-1', contact_name: 'Alice' })
  })

  const firstChannel = supabase._getChannel('messages-thread-1')

  // Select second thread
  act(() => {
    result.current.handleThreadSelect({ _id: 'thread-2', contact_name: 'Bob' })
  })

  // First channel should be unsubscribed
  expect(firstChannel.unsubscribe).toHaveBeenCalled()

  // New channel should be created
  expect(supabase.channel).toHaveBeenCalledWith('messages-thread-2')
})
```

### Pattern 4: Playwright E2E with Mock WebSocket
```typescript
// e2e/messaging.spec.ts
import { test, expect } from '@playwright/test'

test('receives real-time messages', async ({ page }) => {
  await page.routeWebSocket('wss://*/realtime/*', ws => {
    ws.onMessage(message => {
      const data = JSON.parse(message)

      // Handle subscription
      if (data.type === 'phx_join') {
        ws.send(JSON.stringify({
          event: 'phx_reply',
          topic: data.topic,
          ref: data.ref,
          payload: { status: 'ok' }
        }))
      }
    })

    // Simulate incoming message after 2 seconds
    setTimeout(() => {
      ws.send(JSON.stringify({
        event: 'postgres_changes',
        topic: 'realtime:public:_message',
        payload: {
          type: 'INSERT',
          record: {
            _id: 'msg-1',
            'Message Body': 'Hello from test!',
            // ... other fields
          }
        }
      }))
    }, 2000)
  })

  await page.goto('/messaging?thread=thread-123')

  // Wait for real-time message to appear
  await expect(page.locator('text=Hello from test!')).toBeVisible({ timeout: 5000 })
})
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Recommendation |
|--------------|---------|----------------|
| Real WS server in unit tests | Slow, flaky, external dependency | Use MockWebSocket class |
| No reconnection testing | Misses production failure modes | Test CHANNEL_ERROR, TIMED_OUT handling |
| Skipping presence tests | Typing indicators broken silently | Test presence sync events |
| No cleanup verification | Memory leaks, stale subscriptions | Verify `unsubscribe()` called |
| Testing implementation details | Brittle tests | Test observable behavior |
| Not filtering client-side | Wrong messages displayed | Test thread-specific filtering |

---

## Implementation Priority

### Phase 1: Infrastructure (PREREQUISITE)
1. [ ] Add Vitest to devDependencies
2. [ ] Create `vitest.config.ts`
3. [ ] Create `src/test/setup.ts` with global mocks
4. [ ] Create `src/test/mocks/MockWebSocket.ts`
5. [ ] Create `src/test/mocks/supabaseMock.ts`
6. [ ] Update `package.json` test script to use Vitest

### Phase 2: Critical Path Tests
1. [ ] `useMessagingPageLogic.test.ts` - Core chat functionality
2. [ ] `useHeaderMessagingPanelLogic.test.ts` - Header panel chat
3. [ ] `useLoggedInAvatarData.test.ts` - Notification badge

### Phase 3: Secondary Tests
1. [ ] `useAISuggestionsState.test.ts` - AI suggestions modal
2. [ ] `TypingIndicator.test.tsx` - Simple component test

### Phase 4: E2E Tests
1. [ ] Playwright WebSocket routing setup
2. [ ] Real-time message E2E test
3. [ ] Typing indicator E2E test

---

## Effort Estimate

| Phase | Files | Estimated Time |
|-------|-------|----------------|
| Infrastructure Setup | 4-5 | 2-3 hours |
| Critical Path Tests | 3 | 4-6 hours |
| Secondary Tests | 2 | 2-3 hours |
| E2E Tests | 3 | 3-4 hours |
| **Total** | **12-13** | **11-16 hours** |

---

## Files Referenced

### Real-time Logic Hooks
- `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js` (967 lines)
- `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js` (631 lines)
- `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js` (522 lines)
- `app/src/islands/shared/AISuggestions/useAISuggestionsState.js` (365 lines)

### Components
- `app/src/islands/pages/MessagingPage/MessagingPage.jsx`
- `app/src/islands/pages/MessagingPage/components/TypingIndicator.jsx` (27 lines)
- `app/src/islands/shared/HeaderMessagingPanel/HeaderMessagingPanel.jsx`

### Test Infrastructure (Needs Creation)
- `vitest.config.ts` - NOT FOUND
- `src/test/setup.ts` - NOT FOUND
- `src/test/mocks/MockWebSocket.ts` - NOT FOUND
- `src/test/mocks/supabaseMock.ts` - NOT FOUND
