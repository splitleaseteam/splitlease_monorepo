# Human-Friendly Error Logging for Edge Functions

**UPDATED**: 2026-01-27
**PURPOSE**: Guide for using the new compressed, human-friendly Slack error notifications

---

## Overview

The error logging system has been upgraded to send **human-readable** Slack notifications instead of machine-formatted logs. The new format prioritizes user impact, plain English, and actionable debugging steps.

---

## New Slack Notification Format

### Before (Old Format)
```
[Edge Function Error] messages/get_threads
Request ID: ed5a1b70
Timestamp: 2026-01-27T00:47:59.128Z
User ID: f41c8513-12be-4df6-a391-bb0ad252c5bc
Error Type: Error
Message: Failed to fetch threads: Could not find the function...
Context: Fatal error in main handler
```

### After (New Format)
```
💥 Can't view message threads

Could not find the function public.get_user_threads(user_id) in the schema cache
→ Likely cause: Missing migration or function was dropped

User: John Doe (john@example.com, ID: f41c8513)

🔍 What to check:
• Run pending migrations in Supabase
• Verify the database function exists
• Check recent schema changes in migrations/

Function: messages/get_threads (req: ed5a1b70)
```

**Note:** Timestamps are not included since Slack automatically shows when the message was received.

---

## Using setUserContext()

To show **user names and emails** instead of just IDs, edge functions should query the `public.user` table and set user context on the error log.

### Basic Pattern

```typescript
import { createErrorLog, addError, setUserContext } from '../_shared/functional/errorLog.ts';
import { reportErrorLog } from '../_shared/slack.ts';

Deno.serve(async (req) => {
  let errorLog = createErrorLog('function-name', 'unknown');

  try {
    // ... parse request, get userId ...

    // Query public.user table for user details
    if (userId) {
      const { data: user } = await supabase
        .from('user')
        .select('first_name, last_name, email')
        .eq('_id', userId)
        .maybeSingle();

      // Set user context on error log
      errorLog = setUserContext(errorLog, {
        userId,
        userName: user ? `${user.first_name} ${user.last_name}` : undefined,
        userEmail: user?.email ?? undefined,
      });
    }

    // ... rest of handler logic ...

  } catch (error) {
    errorLog = addError(errorLog, error as Error, 'Fatal error in main handler');
    reportErrorLog(errorLog);
    return formatErrorResponseHttp(error as Error);
  }
});
```

---

## Helper Functions

The new format uses several pure helper functions to transform error data:

| Function | Purpose | Example Output |
|----------|---------|----------------|
| `inferLikelyCause()` | Pattern-match error messages | "Missing migration or function was dropped" |
| `getActionableSuggestions()` | Debugging steps | ["Run migrations", "Check schema"] |
| `getUserImpact()` | User-facing impact | "Can't view message threads" |
| `getActionDescription()` | Plain English actions | "check their messages" (from `get_threads`) |
| `getSeverityEmoji()` | Visual severity indicator | 🚨 (critical) or 💥 (normal) |

**Note:** The `getRelativeTime()` function exists but is no longer used in Slack notifications since Slack provides timestamps automatically.

---

## Migration Checklist

To upgrade an existing edge function to the new format:

- [x] Already using `createErrorLog()` and `reportErrorLog()`
- [ ] Add user context query after getting `userId`
- [ ] Call `setUserContext()` with user details
- [ ] Test error notification in Slack

### Example Functions to Update

| Function | Status | Notes |
|----------|--------|-------|
| `messages/index.ts` | ⚠️ Needs update | Add user context query |
| `auth-user/index.ts` | ✅ Using new format | Already has user context |
| `proposal/index.ts` | ⚠️ Needs update | Add user context query |
| `listing/index.ts` | ⚠️ Needs update | Add user context query |

---

## Benefits

1. **Faster triage** - Lead with user impact, not metadata
2. **Actionable** - Specific debugging suggestions
3. **Human-readable** - Plain English instead of technical jargon
4. **User-centric** - Shows actual user names/emails
5. **Time-aware** - Relative timestamps ("2 min ago" vs ISO 8601)

---

## ErrorLog Interface

```typescript
export interface ErrorLog {
  readonly functionName: string;
  readonly action: string;
  readonly correlationId: string;
  readonly startTime: string;
  readonly userId?: string;
  readonly userName?: string;    // NEW
  readonly userEmail?: string;   // NEW
  readonly errors: ReadonlyArray<CollectedError>;
}
```

---

## setUserContext() Signature

```typescript
export const setUserContext = (
  log: ErrorLog,
  context: {
    userId: string;
    userName?: string;
    userEmail?: string;
  }
): ErrorLog => ({
  ...log,
  userId: context.userId,
  userName: context.userName,
  userEmail: context.userEmail,
});
```

---

## Example: messages/index.ts

```typescript
import { createErrorLog, addError, setAction, setUserContext } from '../_shared/functional/errorLog.ts';
import { reportErrorLog } from '../_shared/slack.ts';

Deno.serve(async (req) => {
  let errorLog = createErrorLog('messages', 'unknown');

  try {
    const { action, payload } = await parseRequest(req);
    errorLog = setAction(errorLog, action);

    // Get user from auth
    const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);

    if (user?.id) {
      // Query public.user for full details
      const { data: userData } = await supabase
        .from('user')
        .select('first_name, last_name, email')
        .eq('_id', user.id)
        .maybeSingle();

      // Set user context with name and email
      errorLog = setUserContext(errorLog, {
        userId: user.id,
        userName: userData ? `${userData.first_name} ${userData.last_name}` : undefined,
        userEmail: userData?.email ?? undefined,
      });
    }

    // ... execute handler ...

  } catch (error) {
    errorLog = addError(errorLog, error as Error, 'Fatal error in main handler');
    reportErrorLog(errorLog);
    return formatErrorResponseHttp(error as Error);
  }
});
```

---

## Pattern Matching

The `inferLikelyCause()` function matches common error patterns:

| Error Pattern | Inferred Cause |
|---------------|----------------|
| `could not find the function` | Missing migration or function was dropped |
| `authentication`, `unauthorized` | Invalid or expired auth token |
| `network`, `timeout` | Network issue or external API down |
| `validation`, `invalid input` | Invalid input from user |
| `permission`, `forbidden` | Permission issue or RLS policy blocking access |
| `duplicate`, `unique constraint` | Duplicate record or unique constraint violation |
| `foreign key` | Foreign key constraint violation |

---

**LAST_UPDATED**: 2026-01-27
