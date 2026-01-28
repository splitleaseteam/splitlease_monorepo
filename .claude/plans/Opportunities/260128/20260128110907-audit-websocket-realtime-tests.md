# WebSocket Realtime Testing Opportunity Report
**Generated:** 2026-01-28T11:09:07
**Codebase:** Split Lease

## Executive Summary
- Real-time features found: **6 components/hooks**
- Features needing tests: **6 (100%)**
- Mock WebSocket setup exists: **No**
- Supabase channel mocks exist: **No**
- E2E WebSocket testing setup: **No**
- Test infrastructure (Vitest/RTL): **Not installed**

## Infrastructure Check

### WebSocket Test Setup Status
- [ ] `MockWebSocket` class exists
- [ ] `vi.stubGlobal('WebSocket', MockWebSocket)` in setup
- [ ] Supabase channel mocks exist
- [ ] E2E `page.routeWebSocket()` patterns exist

### Test Framework Status
- [ ] Vitest installed in `package.json`
- [ ] React Testing Library installed
- [ ] `vitest.config.js` configured
- [ ] Test setup file exists

**Current test files found:** 1 (only `calculateMatchScore.test.js`)

---

## Critical Gaps (No Tests)

### 1. MessagingPage Real-time Subscription
- **Files:**
  - Hook: `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`
  - Component: `app/src/islands/pages/MessagingPage/MessagingPage.jsx`
  - TypingIndicator: `app/src/islands/pages/MessagingPage/components/TypingIndicator.jsx`
- **Real-time Usage:**
  - `supabase.channel()` at line 216
  - `.on('postgres_changes', { event: 'INSERT', table: '_message' })` at line 221-222
  - `.on('presence', { event: 'sync' })` at line 280
  - `channel.track()` for presence at line 300, 334
  - `channel.subscribe()` at line 295
  - `channel.unsubscribe()` cleanup at line 318
- **Features:**
  - Real-time message reception via postgres_changes
  - Typing indicators via Supabase Presence
  - Presence state tracking (online status)
  - Automatic cleanup on unmount
- **Missing Tests:**
  - [ ] Channel subscription established on thread select
  - [ ] postgres_changes INSERT events received and processed
  - [ ] Messages added to state on real-time event
  - [ ] Duplicate message prevention
  - [ ] Typing indicator shows when other user types
  - [ ] Typing indicator clears when message received
  - [ ] Own typing state tracked via `channel.track()`
  - [ ] Presence state sync handler
  - [ ] Channel unsubscribe on thread change
  - [ ] Channel cleanup on component unmount

### 2. HeaderMessagingPanel Real-time Subscription
- **Files:**
  - Hook: `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`
  - Component: `app/src/islands/shared/HeaderMessagingPanel/HeaderMessagingPanel.jsx`
- **Real-time Usage:**
  - `supabase.channel()` at line 112
  - `.on('postgres_changes', { event: 'INSERT', table: '_message' })` at line 116
  - `.on('presence', { event: 'sync' })` at line 176
  - `channel.track()` for typing at lines 193, 218
  - `channel.subscribe()` (implied)
  - `channel.unsubscribe()` cleanup at line 205
- **Features:**
  - Real-time messages in header panel
  - Typing indicators (`isOtherUserTyping`, `typingUserName`)
  - Typing timeout (2 seconds of inactivity)
  - Reuses TypingIndicator component from MessagingPage
- **Missing Tests:**
  - [ ] Channel subscription when panel opens with thread selected
  - [ ] Messages update on real-time INSERT
  - [ ] Typing indicator state management
  - [ ] `trackTyping()` function broadcasts typing state
  - [ ] Typing timeout clears typing state after 2 seconds
  - [ ] Typing clears on message send
  - [ ] Channel cleanup when panel closes
  - [ ] Presence sync updates typing user name

### 3. LoggedInAvatar Unread Message Subscription
- **Files:**
  - Hook: `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`
  - Component: `app/src/islands/shared/LoggedInAvatar/LoggedInAvatar.jsx`
- **Real-time Usage:**
  - `supabase.channel('header-unread-messages')` at line 417-418
  - `.on('postgres_changes', { event: '*', table: '_message' })` at line 420-424
  - `supabase.removeChannel()` cleanup at line 439
- **Features:**
  - Real-time unread message count updates
  - Listens to INSERT, UPDATE, DELETE on `_message` table
  - Re-fetches unread count on any message change
- **Missing Tests:**
  - [ ] Channel subscription on mount
  - [ ] Unread count fetched on INSERT event
  - [ ] Unread count updated on UPDATE event (mark as read)
  - [ ] Unread count updated on DELETE event
  - [ ] Channel cleanup on unmount
  - [ ] Subscription status logging

### 4. AISuggestions Real-time Updates
- **Files:**
  - Hook: `app/src/islands/shared/AISuggestions/useAISuggestionsState.js`
  - Modal: `app/src/islands/shared/AISuggestions/AISuggestionsModal.jsx`
- **Real-time Usage:**
  - `supabase.channel(\`suggestions:${houseManualId}\`)` at line 203-204
  - `.on('postgres_changes', { event: '*', table: 'zat_aisuggestions', filter: ... })` at line 205-211
  - `supabase.removeChannel()` cleanup at line 230
- **Features:**
  - Real-time AI suggestion updates
  - Handles INSERT, UPDATE, DELETE events
  - Filter by house manual ID
  - Auto-removes ignored suggestions
- **Missing Tests:**
  - [ ] Channel subscription when modal opens with houseManualId
  - [ ] INSERT event adds new suggestion to state
  - [ ] UPDATE event updates existing suggestion
  - [ ] UPDATE with `decision: 'ignored'` removes suggestion
  - [ ] DELETE event removes suggestion from state
  - [ ] Channel cleanup when modal closes
  - [ ] No subscription when modal closed or no houseManualId

### 5. Auth State Change Subscriptions
- **Files:**
  - Header: `app/src/islands/shared/Header.jsx` (lines 194-254)
  - HouseManualPage: `app/src/islands/pages/HouseManualPage/useHouseManualPageLogic.js` (lines 88-98)
  - ResetPasswordPage: `app/src/islands/pages/ResetPasswordPage.jsx` (line 78)
- **Real-time Usage:**
  - `supabase.auth.onAuthStateChange()` - listens for auth events
  - Events: `SIGNED_IN`, `SIGNED_OUT`, `INITIAL_SESSION`
  - `subscription.unsubscribe()` cleanup
- **Features:**
  - Updates UI on sign in/out
  - Redirects protected pages on sign out
  - Handles OAuth callback results
- **Missing Tests:**
  - [ ] Auth state change handler called on SIGNED_IN
  - [ ] User data updated on sign in
  - [ ] Redirect triggered on SIGNED_OUT for protected pages
  - [ ] Duplicate sign-in handling (signInHandledRef)
  - [ ] Subscription cleanup on unmount

### 6. TypingIndicator Component
- **Files:**
  - Component: `app/src/islands/pages/MessagingPage/components/TypingIndicator.jsx`
  - CSS: `app/src/styles/components/messaging.css` (lines 1501-1551)
- **Usage:**
  - Used in MessagingPage and HeaderMessagingPanel
  - Props: `userName` (string)
  - Returns null if no userName
- **Missing Tests:**
  - [ ] Renders nothing when userName is null/undefined
  - [ ] Renders typing indicator with user name
  - [ ] Animated dots display correctly
  - [ ] Shows "{userName} is typing..." text

---

## Connection Handling Gaps

### Reconnection Logic
| Feature | Has Reconnection Logic | Tested |
|---------|------------------------|--------|
| MessagingPage | Via Supabase client | No |
| HeaderMessagingPanel | Via Supabase client | No |
| LoggedInAvatar unread | Via Supabase client | No |
| AISuggestions | Via Supabase client | No |

**Note:** Supabase Realtime client handles reconnection automatically. Tests should verify behavior on reconnect.

### Disconnect Handling
| Feature | Shows Disconnect State | Tested |
|---------|------------------------|--------|
| MessagingPage | Logs CHANNEL_ERROR, TIMED_OUT | No |
| HeaderMessagingPanel | No visible indicator | No |
| LoggedInAvatar | Logs subscription status | No |

---

## E2E Test Gaps

### Missing E2E WebSocket Tests
| Feature | Test File | Status |
|---------|-----------|--------|
| Send message real-time | None | Missing |
| Receive message real-time | None | Missing |
| Typing indicator display | None | Missing |
| Multiple users in thread | None | Missing |
| Connection loss recovery | None | Missing |
| Unread badge updates | None | Missing |

---

## Components with Good Coverage (Reference)

**None** - No real-time components have test coverage currently.

---

## Recommended Test Infrastructure Setup

### 1. Install Test Dependencies

```bash
cd app
bun add -d vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 2. Create Vitest Config

```javascript
// app/vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

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
      '@': '/src',
    },
  },
});
```

### 3. Create Test Setup

```typescript
// app/src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { MockWebSocket } from './mocks/MockWebSocket';

// Mock WebSocket globally
vi.stubGlobal('WebSocket', MockWebSocket);

// Reset mocks between tests
beforeEach(() => {
  MockWebSocket.reset();
});
```

---

## Recommended MockWebSocket Class

```typescript
// app/src/test/mocks/MockWebSocket.ts
export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((e: Event) => void) | null = null;
  onclose: ((e: CloseEvent) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;

  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }

  // Test helpers
  simulateMessage(data: unknown) {
    this.onmessage?.(new MessageEvent('message', {
      data: typeof data === 'string' ? data : JSON.stringify(data),
    }));
  }

  simulateError(error?: string) {
    this.onerror?.(new ErrorEvent('error', { message: error }));
  }

  simulateClose(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }

  static reset() {
    MockWebSocket.instances = [];
  }

  static getLastInstance() {
    return MockWebSocket.instances.at(-1);
  }

  static getAllInstances() {
    return MockWebSocket.instances;
  }
}
```

---

## Recommended Supabase Channel Mock

```typescript
// app/src/test/mocks/supabaseMocks.ts
import { vi } from 'vitest';

export function createMockChannel() {
  const handlers: Record<string, Function[]> = {};
  let presenceState: Record<string, unknown[]> = {};
  let subscribeCallback: ((status: string) => void) | null = null;

  const mockChannel = {
    on: vi.fn((event: string, filter: unknown, callback: Function) => {
      const key = typeof filter === 'object' ? `${event}:${JSON.stringify(filter)}` : event;
      if (!handlers[key]) handlers[key] = [];
      handlers[key].push(callback);
      return mockChannel;
    }),
    subscribe: vi.fn((callback?: (status: string) => void) => {
      subscribeCallback = callback || null;
      // Simulate successful subscription
      setTimeout(() => callback?.('SUBSCRIBED'), 0);
      return mockChannel;
    }),
    unsubscribe: vi.fn(),
    track: vi.fn(async (state: unknown) => {
      // Update presence state
      presenceState['self'] = [state];
      return { status: 'ok' };
    }),
    presenceState: vi.fn(() => presenceState),

    // Test helpers
    _simulatePostgresChange: (eventType: string, payload: unknown) => {
      const key = `postgres_changes:${JSON.stringify({ event: eventType, schema: 'public', table: '_message' })}`;
      handlers[key]?.forEach(cb => cb({ eventType, new: payload, old: null }));
    },
    _simulatePresenceSync: (state: Record<string, unknown[]>) => {
      presenceState = state;
      const key = 'presence:{"event":"sync"}';
      handlers[key]?.forEach(cb => cb());
    },
    _simulateSubscriptionStatus: (status: string) => {
      subscribeCallback?.(status);
    },
    _reset: () => {
      Object.keys(handlers).forEach(key => delete handlers[key]);
      presenceState = {};
      subscribeCallback = null;
    },
  };

  return mockChannel;
}

export function createSupabaseMock() {
  const channels: Record<string, ReturnType<typeof createMockChannel>> = {};

  return {
    channel: vi.fn((name: string) => {
      if (!channels[name]) {
        channels[name] = createMockChannel();
      }
      return channels[name];
    }),
    removeChannel: vi.fn((channel) => {
      const name = Object.entries(channels).find(([, ch]) => ch === channel)?.[0];
      if (name) delete channels[name];
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn((callback) => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    _getChannel: (name: string) => channels[name],
    _reset: () => {
      Object.values(channels).forEach(ch => ch._reset());
      Object.keys(channels).forEach(key => delete channels[key]);
    },
  };
}

// Usage in tests:
// vi.mock('@/lib/supabase', () => ({
//   supabase: createSupabaseMock(),
// }));
```

---

## Example Test Patterns

### Pattern 1: Testing Real-time Message Reception

```typescript
// app/src/islands/pages/MessagingPage/__tests__/useMessagingPageLogic.test.ts
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMessagingPageLogic } from '../useMessagingPageLogic';
import { createSupabaseMock } from '@/test/mocks/supabaseMocks';

vi.mock('@/lib/supabase', () => ({
  supabase: createSupabaseMock(),
}));

describe('useMessagingPageLogic - Real-time', () => {
  beforeEach(() => {
    // Reset supabase mock
    const { supabase } = await import('@/lib/supabase');
    supabase._reset();
  });

  it('subscribes to channel when thread is selected', async () => {
    const { supabase } = await import('@/lib/supabase');
    const { result } = renderHook(() => useMessagingPageLogic());

    // Select a thread
    act(() => {
      result.current.handleThreadSelect({ _id: 'thread-123' });
    });

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('messages-thread-123');
    });
  });

  it('adds new message on postgres_changes INSERT', async () => {
    const { supabase } = await import('@/lib/supabase');
    const { result } = renderHook(() => useMessagingPageLogic());

    // Setup: select thread and wait for subscription
    act(() => {
      result.current.handleThreadSelect({ _id: 'thread-123' });
    });

    const channel = supabase._getChannel('messages-thread-123');

    // Simulate incoming message
    act(() => {
      channel._simulatePostgresChange('INSERT', {
        _id: 'msg-456',
        'Message Body': 'Hello!',
        'Associated Thread/Conversation': 'thread-123',
        '-Originator User': 'other-user',
        'Created Date': new Date().toISOString(),
      });
    });

    await waitFor(() => {
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({ _id: 'msg-456', message_body: 'Hello!' })
      );
    });
  });

  it('shows typing indicator when other user types', async () => {
    const { supabase } = await import('@/lib/supabase');
    const { result } = renderHook(() => useMessagingPageLogic());

    act(() => {
      result.current.handleThreadSelect({ _id: 'thread-123' });
    });

    const channel = supabase._getChannel('messages-thread-123');

    // Simulate presence update with typing user
    act(() => {
      channel._simulatePresenceSync({
        'user-abc': [{ user_id: 'other-user', user_name: 'Alice', typing: true }],
      });
    });

    await waitFor(() => {
      expect(result.current.isOtherUserTyping).toBe(true);
      expect(result.current.typingUserName).toBe('Alice');
    });
  });

  it('cleans up channel on unmount', async () => {
    const { supabase } = await import('@/lib/supabase');
    const { result, unmount } = renderHook(() => useMessagingPageLogic());

    act(() => {
      result.current.handleThreadSelect({ _id: 'thread-123' });
    });

    const channel = supabase._getChannel('messages-thread-123');

    unmount();

    expect(channel.unsubscribe).toHaveBeenCalled();
  });
});
```

### Pattern 2: Testing TypingIndicator Component

```typescript
// app/src/islands/pages/MessagingPage/components/__tests__/TypingIndicator.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TypingIndicator } from '../TypingIndicator';

describe('TypingIndicator', () => {
  it('renders nothing when userName is null', () => {
    const { container } = render(<TypingIndicator userName={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders typing indicator with user name', () => {
    render(<TypingIndicator userName="Alice" />);
    expect(screen.getByText('Alice is typing...')).toBeInTheDocument();
  });

  it('renders animated dots', () => {
    render(<TypingIndicator userName="Bob" />);
    const dots = document.querySelectorAll('.typing-dots span');
    expect(dots).toHaveLength(3);
  });
});
```

### Pattern 3: E2E Test with Playwright routeWebSocket

```typescript
// e2e/messaging.spec.ts
import { test, expect } from '@playwright/test';

test('receives real-time messages', async ({ page }) => {
  // Intercept WebSocket connection
  await page.routeWebSocket('wss://*/realtime/*', ws => {
    ws.onMessage(message => {
      const data = JSON.parse(message);

      // Handle subscription
      if (data.topic?.includes('messages-')) {
        ws.send(JSON.stringify({
          event: 'phx_reply',
          payload: { status: 'ok' },
          ref: data.ref,
        }));

        // Simulate incoming message after 1 second
        setTimeout(() => {
          ws.send(JSON.stringify({
            event: 'postgres_changes',
            payload: {
              type: 'INSERT',
              new: {
                _id: 'realtime-msg',
                'Message Body': 'Real-time test message!',
              },
            },
          }));
        }, 1000);
      }
    });
  });

  await page.goto('/messages?thread=test-thread');

  // Wait for real-time message to appear
  await expect(page.getByText('Real-time test message!')).toBeVisible({ timeout: 5000 });
});
```

---

## Anti-Patterns Identified

| Current Pattern | Issue | Recommendation |
|-----------------|-------|----------------|
| No test infrastructure | Cannot test any real-time features | Install Vitest + RTL |
| No channel mocks | Cannot isolate channel behavior | Create mock channel factory |
| console.log for debugging | Logs in production code | Use conditional logging or remove |
| No reconnection UI | Users don't know if disconnected | Add connection status indicator |
| No error boundaries | Real-time errors could crash app | Wrap in error boundary |

---

## Priority Order for Implementation

1. **HIGH**: Install test infrastructure (Vitest, RTL, jsdom)
2. **HIGH**: Create Supabase channel mock factory
3. **HIGH**: Test MessagingPage real-time subscription (most complex)
4. **MEDIUM**: Test HeaderMessagingPanel real-time
5. **MEDIUM**: Test LoggedInAvatar unread count updates
6. **MEDIUM**: Test AISuggestions real-time
7. **LOW**: Test auth state change handlers
8. **LOW**: Add E2E tests with Playwright routeWebSocket

---

## Summary

The Split Lease codebase has **6 real-time features** using Supabase Realtime, none of which have test coverage. The most critical gap is the lack of any test infrastructure - Vitest and React Testing Library are not even installed.

**Immediate actions required:**
1. Install Vitest + React Testing Library
2. Create mock utilities for Supabase channels
3. Start with MessagingPage tests (highest complexity, highest user impact)
