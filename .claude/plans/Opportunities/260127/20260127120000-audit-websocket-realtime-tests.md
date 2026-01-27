# WebSocket Realtime Testing Opportunity Report
**Generated:** 2026-01-27T12:00:00Z
**Codebase:** Split Lease

## Executive Summary
- Real-time features found: **4 major components**
- Features needing tests: **4** (100% - no realtime tests exist)
- Mock WebSocket setup exists: **No**
- E2E WebSocket tests exist: **No**

## Infrastructure Check

### WebSocket Test Setup Status
- [ ] `MockWebSocket` class exists
- [ ] `vi.stubGlobal('WebSocket', MockWebSocket)` in setup
- [ ] Supabase channel mocks exist
- [ ] E2E `page.routeWebSocket()` patterns exist

**Current State:** The codebase has **minimal test coverage** overall. Only one test file exists (`app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`), and there are no WebSocket or Supabase Realtime mocks configured anywhere in the project.

---

## Critical Gaps (No Tests)

### 1. MessagingPage Real-time Messaging (`useMessagingPageLogic.js`)
- **Files:**
  - Hook: `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`
- **Supabase Realtime Usage:**
  - `supabase.channel(channelName)` at line 216
  - `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: '_message' })` at lines 221-227
  - `.on('presence', { event: 'sync' })` for typing indicators at line 280
  - `.subscribe()` with presence tracking at line 295
  - Cleanup via `channel.unsubscribe()` at line 318
- **Features Implemented:**
  - Real-time message reception via Postgres Changes
  - Presence-based typing indicators
  - Optimistic message sending with deduplication
  - Channel cleanup on unmount/thread change
- **Missing Tests:**
  - [ ] Channel subscription established on thread selection
  - [ ] New messages received via `postgres_changes` INSERT events
  - [ ] Messages filtered client-side by thread ID
  - [ ] Typing indicator shown when other user types
  - [ ] Typing indicator cleared on message receipt
  - [ ] Channel unsubscription on thread change
  - [ ] Channel cleanup on component unmount
  - [ ] Reconnection handling on CHANNEL_ERROR
  - [ ] Reconnection handling on TIMED_OUT

---

### 2. HeaderMessagingPanel Real-time Messaging (`useHeaderMessagingPanelLogic.js`)
- **Files:**
  - Hook: `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`
- **Supabase Realtime Usage:**
  - `supabase.channel(channelName)` at line 112
  - `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: '_message' })` at lines 115-122
  - `.on('presence', { event: 'sync' })` for typing indicators at line 176
  - `.subscribe()` with presence tracking at line 191
  - Cleanup via `channel.unsubscribe()` at line 205
- **Features Implemented:**
  - Compact panel variant of messaging with same realtime capabilities
  - Separate channel namespace (`panel-messages-*`) from main messaging page
  - Presence tracking for typing indicators
- **Missing Tests:**
  - [ ] Channel subscription when panel opens with selected thread
  - [ ] Messages received and displayed in panel
  - [ ] Typing indicator state management
  - [ ] Channel cleanup when panel closes
  - [ ] Channel cleanup when navigating back to thread list
  - [ ] Presence track/untrack lifecycle

---

### 3. LoggedInAvatar Unread Messages Badge (`useLoggedInAvatarData.js`)
- **Files:**
  - Hook: `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`
- **Supabase Realtime Usage:**
  - `supabase.channel('header-unread-messages')` at line 417
  - `.on('postgres_changes', { event: '*', schema: 'public', table: '_message' })` at lines 419-425
  - `.subscribe()` at line 433
  - Cleanup via `supabase.removeChannel(channel)` at line 439
- **Features Implemented:**
  - Real-time unread message count updates for header badge
  - Listens to all message events (INSERT, UPDATE, DELETE)
  - Re-fetches unread count on any message change
- **Missing Tests:**
  - [ ] Channel subscription established on mount
  - [ ] Unread count updates on new message (INSERT)
  - [ ] Unread count updates on message read (UPDATE)
  - [ ] Unread count updates on message delete (DELETE)
  - [ ] Channel cleanup on unmount
  - [ ] Error handling for subscription failures

---

### 4. AI Suggestions Real-time Updates (`useAISuggestionsState.js`)
- **Files:**
  - Hook: `app/src/islands/shared/AISuggestions/useAISuggestionsState.js`
- **Supabase Realtime Usage:**
  - `supabase.channel(\`suggestions:\${houseManualId}\`)` at line 203
  - `.on('postgres_changes', { event: '*', schema: 'public', table: 'zat_aisuggestions', filter: ... })` at lines 205-212
  - `.subscribe()` at line 227
  - Cleanup via `supabase.removeChannel(channel)` at line 230
- **Features Implemented:**
  - Real-time suggestion updates filtered by house manual ID
  - INSERT events add new suggestions to state
  - UPDATE events modify or remove suggestions based on decision
  - DELETE events remove suggestions from state
- **Missing Tests:**
  - [ ] Channel subscription when modal opens
  - [ ] New suggestion added on INSERT event
  - [ ] Suggestion updated on UPDATE event
  - [ ] Suggestion removed when decision='ignored' on UPDATE
  - [ ] Suggestion removed on DELETE event
  - [ ] Channel cleanup when modal closes
  - [ ] Filter by house manual ID works correctly

---

## Connection Handling Gaps

### Reconnection Logic
| Feature | Has Reconnection Logic | Tested |
|---------|------------------------|--------|
| MessagingPage | Partial (logs CHANNEL_ERROR, TIMED_OUT) | No |
| HeaderMessagingPanel | No explicit handling | No |
| LoggedInAvatar | No explicit handling | No |
| AISuggestions | No explicit handling | No |

### Disconnect Handling
| Feature | Shows Disconnect UI | Tested |
|---------|---------------------|--------|
| MessagingPage | No | No |
| HeaderMessagingPanel | No | No |
| LoggedInAvatar | No | No |
| AISuggestions | No | No |

---

## E2E Test Gaps

### Missing E2E WebSocket Tests
| Feature | Test File | Status |
|---------|-----------|--------|
| Send/receive messages in MessagingPage | None | Missing |
| Real-time message in HeaderPanel | None | Missing |
| Unread badge updates | None | Missing |
| AI suggestions updates | None | Missing |
| Typing indicators | None | Missing |
| Connection loss recovery | None | Missing |

---

## Components with Good Coverage (Reference)

**None** - The codebase has minimal test coverage. Only one test file exists for a pure function calculator.

---

## Recommended Infrastructure Setup

### 1. MockWebSocket Class

```typescript
// app/src/test/mocks/MockWebSocket.ts
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

  simulateError(error?: Error) {
    this.onerror?.(new Event('error'))
  }

  static reset() { MockWebSocket.instances = [] }
  static getLastInstance() { return MockWebSocket.instances.at(-1) }
}
```

### 2. Supabase Channel Mock

```typescript
// app/src/test/mocks/supabaseMock.ts
import { vi } from 'vitest';

export function createMockChannel() {
  const listeners: Map<string, Function[]> = new Map();

  const mockChannel = {
    on: vi.fn((type: string, config: any, callback: Function) => {
      const key = typeof config === 'object' ? `${type}:${config.event || '*'}` : type;
      if (!listeners.has(key)) listeners.set(key, []);
      listeners.get(key)!.push(callback);
      return mockChannel;
    }),
    subscribe: vi.fn((callback?: Function) => {
      setTimeout(() => callback?.('SUBSCRIBED'), 0);
      return { status: 'SUBSCRIBED' };
    }),
    unsubscribe: vi.fn(),
    track: vi.fn().mockResolvedValue(undefined),
    presenceState: vi.fn().mockReturnValue({}),
    // Helper to simulate events
    __simulateEvent: (eventType: string, payload: any) => {
      const key = `postgres_changes:${eventType}`;
      listeners.get(key)?.forEach(cb => cb(payload));
      listeners.get('postgres_changes:*')?.forEach(cb => cb(payload));
    },
    __simulatePresence: (state: Record<string, any>) => {
      mockChannel.presenceState.mockReturnValue(state);
      listeners.get('presence')?.forEach(cb => cb());
    }
  };

  return mockChannel;
}

export function createSupabaseMock() {
  const channels: Map<string, ReturnType<typeof createMockChannel>> = new Map();

  return {
    channel: vi.fn((name: string) => {
      if (!channels.has(name)) {
        channels.set(name, createMockChannel());
      }
      return channels.get(name)!;
    }),
    removeChannel: vi.fn((channel) => {
      channel.unsubscribe();
    }),
    // Helper to get channel by name
    __getChannel: (name: string) => channels.get(name),
    __reset: () => channels.clear()
  };
}
```

### 3. Vitest Setup File

```typescript
// app/vitest.setup.ts
import { vi, beforeEach, afterEach } from 'vitest';
import { MockWebSocket } from './src/test/mocks/MockWebSocket';
import { createSupabaseMock } from './src/test/mocks/supabaseMock';

// Global WebSocket mock
vi.stubGlobal('WebSocket', MockWebSocket);

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: createSupabaseMock()
}));

beforeEach(() => {
  MockWebSocket.reset();
});

afterEach(() => {
  vi.clearAllMocks();
});
```

### 4. E2E Playwright WebSocket Interception

```typescript
// e2e/helpers/websocket.ts
import { Page } from '@playwright/test';

export async function mockSupabaseRealtime(page: Page) {
  await page.routeWebSocket('wss://*/realtime/*', ws => {
    ws.onMessage(message => {
      const data = JSON.parse(message);

      // Handle Supabase Realtime protocol
      if (data.event === 'phx_join') {
        ws.send(JSON.stringify({
          event: 'phx_reply',
          payload: { status: 'ok' },
          ref: data.ref,
          topic: data.topic
        }));
      }
    });

    // Return helper to simulate server pushes
    return {
      simulateInsert: (table: string, record: any) => {
        ws.send(JSON.stringify({
          event: 'postgres_changes',
          payload: {
            data: { eventType: 'INSERT', new: record, table }
          },
          topic: `realtime:*`
        }));
      },
      simulatePresence: (userId: string, typing: boolean) => {
        ws.send(JSON.stringify({
          event: 'presence_state',
          payload: { [userId]: [{ typing }] }
        }));
      }
    };
  });
}
```

---

## Test Implementation Priority

### High Priority (Core Messaging)
1. **useMessagingPageLogic** - Primary user-facing messaging feature
2. **useHeaderMessagingPanelLogic** - Header quick-access messaging
3. **useLoggedInAvatarData** - Notification badge accuracy

### Medium Priority (Feature Enhancement)
4. **useAISuggestionsState** - AI-powered house manual suggestions

---

## Recommended Test File Structure

```
app/
├── src/
│   ├── test/
│   │   ├── mocks/
│   │   │   ├── MockWebSocket.ts
│   │   │   └── supabaseMock.ts
│   │   └── setup.ts
│   └── islands/
│       ├── pages/
│       │   └── MessagingPage/
│       │       ├── useMessagingPageLogic.js
│       │       └── useMessagingPageLogic.test.ts  # NEW
│       └── shared/
│           ├── HeaderMessagingPanel/
│           │   ├── useHeaderMessagingPanelLogic.js
│           │   └── useHeaderMessagingPanelLogic.test.ts  # NEW
│           ├── LoggedInAvatar/
│           │   ├── useLoggedInAvatarData.js
│           │   └── useLoggedInAvatarData.test.ts  # NEW
│           └── AISuggestions/
│               ├── useAISuggestionsState.js
│               └── useAISuggestionsState.test.ts  # NEW
├── e2e/
│   ├── helpers/
│   │   └── websocket.ts  # NEW
│   └── messaging.spec.ts  # NEW
└── vitest.setup.ts  # NEW
```

---

## Summary

The Split Lease codebase has **4 components** using Supabase Realtime for:
1. Real-time messaging with typing indicators
2. Compact header messaging panel
3. Unread message badge updates
4. AI suggestion live updates

**All 4 components lack test coverage.** No WebSocket mocking infrastructure exists, and there are no E2E tests for WebSocket functionality.

### Immediate Actions Required
1. Set up Vitest with proper WebSocket and Supabase channel mocks
2. Create unit tests for each real-time hook
3. Add E2E tests using Playwright's `routeWebSocket()` API
4. Implement reconnection logic testing for connection resilience
