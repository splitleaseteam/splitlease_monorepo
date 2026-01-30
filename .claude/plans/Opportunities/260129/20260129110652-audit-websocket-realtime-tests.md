# WebSocket Realtime Testing Opportunity Report
**Generated:** 2026-01-29 11:06:52
**Codebase:** Split Lease

## Executive Summary
- Real-time features found: **4**
- Features needing tests: **4** (100%)
- Mock WebSocket setup exists: **No**
- Supabase channel mocks exist: **No**

## Infrastructure Check

### WebSocket Test Setup Status
- [ ] `MockWebSocket` class exists
- [ ] `vi.stubGlobal('WebSocket', MockWebSocket)` in setup
- [ ] Supabase channel mocks exist
- [ ] E2E `page.routeWebSocket()` patterns exist

**Current Test Infrastructure:**
- Vitest configured with jsdom environment (`app/vitest.config.js`)
- Basic setup file exists (`app/vitest.setup.js`) - only imports `@testing-library/jest-dom`
- No WebSocket mocks or Supabase channel mocks defined
- Only 2 test files exist in the entire frontend codebase

---

## Critical Gaps (No Tests)

### 1. Messaging Page - Real-Time Chat

**Files:**
- Logic Hook: `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`
- Component: `app/src/islands/pages/MessagingPage/MessagingPage.jsx`

**Supabase Realtime Usage:**
- `supabase.channel(channelName)` at line 216
- `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: '_message' })` at lines 221-227
- Presence tracking `.on('presence', { event: 'sync' })` at line 280
- `.subscribe()` with presence tracking at line 295
- Channel cleanup in return function at lines 316-320

**Real-Time Features:**
1. New message delivery via postgres_changes (INSERT events)
2. Typing indicators via Supabase Presence
3. Online status tracking via presence

**Missing Tests:**
- [ ] Channel subscription established on thread selection
- [ ] New messages received via postgres_changes INSERT events
- [ ] Messages added to state without duplicates
- [ ] Client-side filtering of messages for correct thread
- [ ] Typing indicator shown when other user types
- [ ] Typing indicator cleared when message received
- [ ] Own typing state tracked via `channel.track()`
- [ ] Presence sync updates typing state
- [ ] Channel unsubscribe on cleanup
- [ ] Reconnection after channel error/timeout

---

### 2. Header Messaging Panel - Real-Time Chat

**Files:**
- Logic Hook: `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`
- Component: `app/src/islands/shared/HeaderMessagingPanel/HeaderMessagingPanel.jsx`

**Supabase Realtime Usage:**
- `supabase.channel(channelName)` at line 112
- `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: '_message' })` at lines 115-122
- Presence tracking `.on('presence', { event: 'sync' })` at line 176
- `.subscribe()` with presence tracking at line 191
- Channel cleanup at lines 204-207

**Real-Time Features:**
1. Compact panel version of messaging with same realtime capabilities
2. Message delivery for selected thread
3. Typing indicators via presence

**Missing Tests:**
- [ ] Channel subscription when thread selected AND panel is open
- [ ] No subscription when panel closed (conditional subscription)
- [ ] New messages received and added to state
- [ ] Typing indicator functionality
- [ ] Channel cleanup on panel close
- [ ] Channel cleanup when thread changes

---

### 3. AI Suggestions - Real-Time Updates

**Files:**
- State Hook: `app/src/islands/shared/AISuggestions/useAISuggestionsState.js`
- Component: `app/src/islands/shared/AISuggestions/AISuggestionsModal.jsx`

**Supabase Realtime Usage:**
- `supabase.channel(\`suggestions:${houseManualId}\`)` at line 203-204
- `.on('postgres_changes', { event: '*', schema: 'public', table: 'zat_aisuggestions', filter: ... })` at lines 205-212
- `.subscribe()` at line 227
- `supabase.removeChannel(channel)` at line 230

**Real-Time Features:**
1. INSERT events add new suggestions
2. UPDATE events modify existing suggestions or remove if ignored
3. DELETE events remove suggestions

**Missing Tests:**
- [ ] Channel subscription when modal opens
- [ ] No subscription when modal closed (conditional)
- [ ] INSERT event adds new suggestion to state
- [ ] UPDATE event modifies suggestion in state
- [ ] UPDATE event with ignored decision removes suggestion
- [ ] DELETE event removes suggestion from state
- [ ] Channel removed on cleanup
- [ ] Filter parameter correctly filters by house manual ID

---

### 4. Header Unread Badge - Real-Time Updates

**Files:**
- Data Hook: `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`

**Supabase Realtime Usage:**
- `supabase.channel('header-unread-messages')` at line 417-418
- `.on('postgres_changes', { event: '*', schema: 'public', table: '_message' })` at lines 419-425
- `.subscribe()` at line 433
- `supabase.removeChannel(channel)` at line 439

**Real-Time Features:**
1. Listens to all message table changes (INSERT, UPDATE, DELETE)
2. Re-fetches unread count on any change
3. Updates badge count in real-time

**Missing Tests:**
- [ ] Channel subscription on mount when user ID exists
- [ ] Unread count fetched initially
- [ ] INSERT event triggers refetch of unread count
- [ ] UPDATE event triggers refetch (message marked as read)
- [ ] DELETE event triggers refetch
- [ ] Channel cleanup on unmount
- [ ] No subscription when user ID is null

---

## Connection Handling Gaps

### Reconnection Logic
| Feature | Has Reconnection Code | Tested |
|---------|----------------------|--------|
| Messaging Page | Logs errors but no explicit retry | No |
| Header Panel | No | No |
| AI Suggestions | No | No |
| Unread Badge | No | No |

### Disconnect/Error Handling
| Feature | Shows User Feedback | Tested |
|---------|---------------------|--------|
| Messaging Page | Logs CHANNEL_ERROR and TIMED_OUT | No |
| Header Panel | No visible feedback | No |
| AI Suggestions | No visible feedback | No |
| Unread Badge | No visible feedback | No |

---

## E2E Test Gaps

### Missing E2E WebSocket Tests
| Feature | Test File | Status |
|---------|-----------|--------|
| Send/receive messages | None | Missing |
| Typing indicators | None | Missing |
| Connection loss recovery | None | Missing |
| Unread badge updates | None | Missing |
| AI suggestion updates | None | Missing |

---

## Components with Good Coverage (Reference)

**No real-time components have test coverage.**

The only existing test files are:
1. `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js` - Pure function tests
2. `app/src/__tests__/regression/REG-001-fk-constraint-violation.test.js` - Regression test

---

## Recommended MockWebSocket Class

```typescript
// app/src/test/mocks/MockWebSocket.ts
export class MockWebSocket {
  static instances: MockWebSocket[] = [];

  url: string;
  readyState: number = WebSocket.CONNECTING;
  onopen: ((e: Event) => void) | null = null;
  onclose: ((e: CloseEvent) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;

  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }

  simulateMessage(data: any) {
    this.onmessage?.(
      new MessageEvent('message', {
        data: typeof data === 'string' ? data : JSON.stringify(data),
      })
    );
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }

  static reset() {
    MockWebSocket.instances = [];
  }

  static getLastInstance() {
    return MockWebSocket.instances.at(-1);
  }
}
```

---

## Recommended Supabase Channel Mock

```javascript
// app/src/test/mocks/supabaseMocks.js

/**
 * Create mock Supabase channel for testing real-time features
 */
export function createMockChannel() {
  const presenceState = {};
  const eventHandlers = {
    postgres_changes: [],
    presence: [],
  };

  const mockChannel = {
    on: vi.fn((event, config, callback) => {
      if (event === 'postgres_changes') {
        eventHandlers.postgres_changes.push({ config, callback });
      } else if (event === 'presence') {
        eventHandlers.presence.push({ config, callback });
      }
      return mockChannel;
    }),

    subscribe: vi.fn((callback) => {
      // Simulate successful subscription
      setTimeout(() => callback?.('SUBSCRIBED'), 0);
      return mockChannel;
    }),

    unsubscribe: vi.fn(),

    track: vi.fn(async (payload) => {
      presenceState[payload.user_id] = payload;
      return { ok: true };
    }),

    presenceState: vi.fn(() => presenceState),

    // Test helpers
    _simulatePostgresChange: (eventType, data) => {
      eventHandlers.postgres_changes.forEach(({ callback }) => {
        callback({ eventType, new: data, old: data });
      });
    },

    _simulatePresenceSync: () => {
      eventHandlers.presence.forEach(({ config, callback }) => {
        if (config.event === 'sync') {
          callback();
        }
      });
    },

    _getPresenceState: () => presenceState,
  };

  return mockChannel;
}

/**
 * Mock the entire supabase client for realtime tests
 */
export function mockSupabaseRealtime() {
  const channels = {};

  const mockSupabase = {
    channel: vi.fn((name) => {
      if (!channels[name]) {
        channels[name] = createMockChannel();
      }
      return channels[name];
    }),

    removeChannel: vi.fn((channel) => {
      const name = Object.keys(channels).find((k) => channels[k] === channel);
      if (name) delete channels[name];
    }),

    // Test helpers
    _getChannel: (name) => channels[name],
    _getAllChannels: () => channels,
    _reset: () => {
      Object.keys(channels).forEach((k) => delete channels[k]);
    },
  };

  return mockSupabase;
}
```

---

## Recommended Test Patterns

### Pattern 1: Testing Supabase Channel Subscription

```javascript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessagingPageLogic } from './useMessagingPageLogic';
import { createMockChannel } from '@/test/mocks/supabaseMocks';

vi.mock('@/lib/supabase', () => {
  const mockChannel = createMockChannel();
  return {
    supabase: {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn(),
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    },
    mockChannel,
  };
});

describe('useMessagingPageLogic realtime', () => {
  it('subscribes to channel when thread is selected', async () => {
    const { result } = renderHook(() => useMessagingPageLogic());

    // Select a thread
    act(() => {
      result.current.handleThreadSelect({ _id: 'thread-123', contact_name: 'John' });
    });

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('messages-thread-123');
    });
  });
});
```

### Pattern 2: Testing Message Reception

```javascript
it('adds new message when postgres_changes INSERT is received', async () => {
  const { result } = renderHook(() => useMessagingPageLogic());
  const { mockChannel } = await import('@/lib/supabase');

  // Select thread to activate subscription
  act(() => {
    result.current.handleThreadSelect({ _id: 'thread-123', contact_name: 'John' });
  });

  await waitFor(() => expect(result.current.selectedThread).toBeTruthy());

  // Simulate incoming message
  act(() => {
    mockChannel._simulatePostgresChange('INSERT', {
      _id: 'msg-456',
      thread_id: 'thread-123',
      'Message Body': 'Hello!',
      originator_user_id: 'other-user',
      'Created Date': new Date().toISOString(),
    });
  });

  await waitFor(() => {
    expect(result.current.messages).toContainEqual(
      expect.objectContaining({ _id: 'msg-456', message_body: 'Hello!' })
    );
  });
});
```

### Pattern 3: Testing Typing Indicators

```javascript
it('shows typing indicator when other user is typing', async () => {
  const { result } = renderHook(() => useMessagingPageLogic());
  const { mockChannel } = await import('@/lib/supabase');

  // Select thread
  act(() => {
    result.current.handleThreadSelect({ _id: 'thread-123', contact_name: 'John' });
  });

  // Simulate other user typing
  act(() => {
    mockChannel.track({ user_id: 'other-user', user_name: 'John', typing: true });
    mockChannel._simulatePresenceSync();
  });

  await waitFor(() => {
    expect(result.current.isOtherUserTyping).toBe(true);
    expect(result.current.typingUserName).toBe('John');
  });
});
```

### Pattern 4: Testing Cleanup on Unmount

```javascript
it('unsubscribes from channel on unmount', async () => {
  const { result, unmount } = renderHook(() => useMessagingPageLogic());
  const { mockChannel, supabase } = await import('@/lib/supabase');

  // Select thread
  act(() => {
    result.current.handleThreadSelect({ _id: 'thread-123', contact_name: 'John' });
  });

  await waitFor(() => expect(mockChannel.subscribe).toHaveBeenCalled());

  // Unmount
  unmount();

  expect(mockChannel.unsubscribe).toHaveBeenCalled();
});
```

---

## Priority Recommendations

### High Priority (Core User Experience)
1. **Messaging Page realtime tests** - Critical for chat functionality
2. **Header Panel realtime tests** - Users expect consistent behavior

### Medium Priority (Enhanced Experience)
3. **Unread badge tests** - Important for user engagement
4. **Typing indicator tests** - Expected in modern chat apps

### Lower Priority (Internal Features)
5. **AI Suggestions realtime tests** - Host-facing feature

---

## Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real Supabase connection in unit tests | Mock channel class |
| No reconnection testing | Test disconnect + reconnect |
| Skipping presence tests | Test typing, online/offline |
| No cleanup on unmount | Verify unsubscribe called |
| Testing with real delays | Use vi.useFakeTimers() |

---

## Next Steps

1. **Create mock infrastructure** - Add `app/src/test/mocks/supabaseMocks.js`
2. **Update vitest.setup.js** - Include global mocks for Supabase
3. **Write tests for useMessagingPageLogic** - Start with subscription tests
4. **Write tests for useHeaderMessagingPanelLogic** - Similar patterns
5. **Add E2E tests** - Use Playwright's `routeWebSocket()` for integration
