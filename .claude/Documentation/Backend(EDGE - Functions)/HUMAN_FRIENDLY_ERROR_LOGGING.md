# Human-Friendly Error Logging for Edge Functions

**UPDATED**: 2026-01-27 (Environment Badges, Error Classification & payloadEmail)
**PURPOSE**: Guide for using the new compressed, human-friendly Slack error notifications with environment detection, error classification, and user context

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
Environment: 🟡 DEVELOPMENT
Classification: System Error

Could not find the function public.get_user_threads(user_id) in the schema cache
→ Likely cause: Missing migration or function was dropped

User: John Doe (john@example.com, ID: f41c8513)

🔍 What to check:
• Run pending migrations in Supabase
• Verify the database function exists
• Check recent schema changes in migrations/

Function: messages/get_threads (req: ed5a1b70)
```

**Expected Behavior Example (Production):**
```
⚠️ Can't log in
Environment: 🔴 PRODUCTION
Classification: Expected Behavior

Invalid login credentials

User: john@example.com (attempted login/signup)

Function: auth-user/login (req: a3f71c42)
```

**Note:**
- Timestamps are not included since Slack automatically shows when the message was received
- "What to check" suggestions only appear for System Errors, not Expected Behavior
- Environment badge clearly distinguishes development vs production errors

**Environment Badges:**
- 🔴 PRODUCTION - Live production errors (high priority)
- 🟡 DEVELOPMENT - Development environment errors
- 🟢 LOCAL - Local development errors
- ⚪ UNKNOWN - Environment could not be detected

---

## Using setUserContext()

To show **user names and emails** instead of just IDs, edge functions should query the `public.user` table and set user context on the error log.

**For authenticated requests**: Query `public.user` table with the authenticated user ID

**For unauthenticated requests** (login/signup failures): Use `payloadEmail` to show the email from the request payload

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
| `classifyError()` | Classify as expected vs system error | "expected" or "system-error" |
| `inferLikelyCause()` | Pattern-match error messages | "Missing migration or function was dropped" |
| `getActionableSuggestions()` | Debugging steps (system errors only) | ["Run migrations", "Check schema"] or [] |
| `getUserImpact()` | User-facing impact | "Can't view message threads" |
| `getActionDescription()` | Plain English actions | "check their messages" (from `get_threads`) |
| `getSeverityEmoji()` | Visual severity indicator | ⚠️ (expected) or 💥 (system error) |

**Note:**
- The `getRelativeTime()` function exists but is no longer used in Slack notifications since Slack provides timestamps automatically
- `getActionableSuggestions()` returns empty array for expected user errors (no developer action needed)

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
  readonly environment: 'development' | 'production' | 'local' | 'unknown';
  readonly userId?: string;
  readonly userName?: string;      // User's full name from public.user
  readonly userEmail?: string;     // User's email from public.user
  readonly payloadEmail?: string;  // Email from request payload (for login/signup)
  readonly errors: ReadonlyArray<CollectedError>;
}
```

**Environment Detection:**
- Auto-detected in `createErrorLog()` from `ENVIRONMENT` env var or `SUPABASE_URL`
- Displayed with color-coded badges: 🔴 PRODUCTION, 🟡 DEVELOPMENT, 🟢 LOCAL, ⚪ UNKNOWN

---

## setUserContext() Signature

```typescript
export const setUserContext = (
  log: ErrorLog,
  context: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    payloadEmail?: string;  // For unauthenticated requests (login/signup failures)
  }
): ErrorLog => ({
  ...log,
  userId: context.userId,
  userName: context.userName,
  userEmail: context.userEmail,
  payloadEmail: context.payloadEmail,
});
```

**Usage with payloadEmail** (for auth errors before user is authenticated):

```typescript
// On login/signup failure, capture email from payload
errorLog = setUserContext(errorLog, {
  payloadEmail: payload.email, // Show this in notification instead of "Not logged in"
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

## Error Classification

The `classifyError()` function distinguishes between expected user errors and unexpected system errors:

| Classification | Description | Patterns Matched |
|----------------|-------------|------------------|
| **Expected Behavior** | Normal user errors that don't require developer action | `invalid`, `expired`, `incorrect`, `wrong`, `not found`, `already exists`, `required`, `missing`, `forbidden`, `unauthorized`, `denied`, `password`, `email`, `credentials`, `validation`, `duplicate`, `unique constraint` |
| **System Error** | Unexpected failures requiring developer attention | All other errors (database failures, network issues, function errors, etc.) |

**Impact on Slack notifications:**
- Expected Behavior: Shows ⚠️ emoji, **no "What to check" section**
- System Error: Shows 💥 emoji, includes actionable debugging suggestions

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

**LAST_UPDATED**: 2026-01-27 (Added environment badges, error classification, and payloadEmail support)
