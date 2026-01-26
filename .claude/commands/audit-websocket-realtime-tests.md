---
name: audit-websocket-realtime-tests
description: Audit the codebase to find WebSocket and real-time features (chat, notifications, Supabase Realtime) that lack proper test coverage. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# WebSocket Realtime Testing Audit

You are conducting a comprehensive audit to identify WebSocket and real-time features that do not have proper test coverage.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **WebSocket connections** - Look for:
   - `new WebSocket()`
   - WebSocket URL patterns (`wss://`)
   - `onopen`, `onmessage`, `onclose`, `onerror` handlers

2. **Supabase Realtime** - Look for:
   - `supabase.channel()`
   - `.on('postgres_changes', ...)`
   - `.on('broadcast', ...)`
   - `.subscribe()`
   - `supabase.removeChannel()`

3. **Chat/messaging components** - Look for:
   - Chat windows/panels
   - Message input forms
   - Message list components
   - Typing indicators

4. **Real-time hooks** - Look for:
   - `useChat`, `useMessages`
   - `useRealtimeListings`
   - `usePresence`, `useTypingIndicator`
   - Custom WebSocket hooks

5. **Notification systems** - Look for:
   - Real-time notification components
   - Notification badges/counts
   - Push notification handlers

### What to Check for Each Target

For each real-time feature, check if:
- Tests exist for connection establishment
- Tests exist for message sending/receiving
- Tests exist for disconnection handling
- Tests exist for reconnection logic
- Tests exist for typing indicators (if applicable)
- Tests exist for presence (online/offline)
- Cleanup on unmount is tested

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-websocket-realtime-tests.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# WebSocket Realtime Testing Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Real-time features found: X
- Features needing tests: X
- Mock WebSocket setup exists: Yes/No

## Infrastructure Check

### WebSocket Test Setup Status
- [ ] `MockWebSocket` class exists
- [ ] `vi.stubGlobal('WebSocket', MockWebSocket)` in setup
- [ ] Supabase channel mocks exist
- [ ] E2E `page.routeWebSocket()` patterns exist

## Critical Gaps (No Tests)

### 1. Chat Feature
- **Files:**
  - Component: `path/to/ChatWindow.tsx`
  - Hook: `path/to/useChat.ts`
- **WebSocket Usage:**
  - Connection at line X
  - Message handling at line Y
- **Missing Tests:**
  - [ ] Connection established on mount
  - [ ] Messages sent through WebSocket
  - [ ] Messages received and displayed
  - [ ] Reconnection on disconnect
  - [ ] Cleanup on unmount

### 2. Supabase Realtime Subscription
- **Files:**
  - Hook: `path/to/useRealtimeListings.ts`
- **Channel Usage:**
  - `supabase.channel()` at line X
  - `.on('postgres_changes')` at line Y
- **Missing Tests:**
  - [ ] Channel subscription
  - [ ] INSERT event handling
  - [ ] UPDATE event handling
  - [ ] DELETE event handling
  - [ ] Unsubscribe on unmount

### 3. Typing Indicators
- **Files:**
  - Component: `path/to/TypingIndicator.tsx`
- **Missing Tests:**
  - [ ] Shows when other user types
  - [ ] Hides when typing stops
  - [ ] Broadcasts own typing state

### 4. Presence/Online Status
- **Files:**
  - Component: `path/to/UserStatus.tsx`
- **Missing Tests:**
  - [ ] Shows online status
  - [ ] Shows offline status
  - [ ] Updates on presence changes

## Connection Handling Gaps

### Reconnection Logic
| Feature | Has Reconnection | Tested |
|---------|------------------|--------|
| Chat | ? | No |
| Notifications | ? | No |

### Disconnect Handling
| Feature | Shows Disconnect | Tested |
|---------|------------------|--------|
| Chat | ? | No |

## E2E Test Gaps

### Missing E2E WebSocket Tests
| Feature | Test File | Status |
|---------|-----------|--------|
| Send/receive messages | None | Missing |
| Connection loss recovery | None | Missing |
| Typing indicators | None | Missing |

## Components with Good Coverage (Reference)

List any real-time components that already have proper test coverage.

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

## Recommended Supabase Channel Mock

```typescript
vi.mock('@/lib/supabase', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ status: 'SUBSCRIBED' }),
    unsubscribe: vi.fn(),
  }
  return {
    supabase: {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn(),
    },
    mockChannel,
  }
})
```

```

---

## Reference: WebSocket Testing Patterns

### Testing Approaches

| Approach | Tool | Use Case |
|----------|------|----------|
| E2E with real WS | Playwright | Full integration |
| E2E with mock WS | `routeWebSocket()` | Isolated E2E |
| Unit/Integration | Vitest + mock | Component tests |

### Pattern 1: Hook Test with MockWebSocket

```typescript
it('connects to WebSocket on mount', async () => {
  const { result } = renderHook(() => useChat('conv-123'))
  await waitFor(() => expect(result.current.isConnected).toBe(true))
  expect(MockWebSocket.instances).toHaveLength(1)
})
```

### Pattern 2: Message Reception Test

```typescript
it('receives and stores messages', async () => {
  const { result } = renderHook(() => useChat('conv-123'))
  await waitFor(() => expect(result.current.isConnected).toBe(true))

  const ws = MockWebSocket.getLastInstance()!
  act(() => {
    ws.simulateMessage({ type: 'message', payload: { text: 'Hello!' } })
  })

  expect(result.current.messages[0].text).toBe('Hello!')
})
```

### Pattern 3: Playwright Mock WebSocket

```typescript
await page.routeWebSocket('wss://*/realtime/*', ws => {
  ws.onMessage(message => {
    const data = JSON.parse(message)
    if (data.type === 'subscribe') {
      ws.send(JSON.stringify({ type: 'subscribed' }))
    }
  })

  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'message', payload: { text: 'Hi!' } }))
  }, 1000)
})
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real WS server in unit tests | Mock WebSocket class |
| No reconnection testing | Test disconnect + reconnect |
| Skipping presence tests | Test typing, online/offline |
| No cleanup on unmount | Verify unsubscribe called |

## Output Requirements

1. Be thorough - review EVERY real-time feature
2. Be specific - include exact file paths and line numbers
3. Be actionable - provide mock class templates
4. Only report gaps - do not list tested features unless as reference
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-websocket-realtime-tests.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
