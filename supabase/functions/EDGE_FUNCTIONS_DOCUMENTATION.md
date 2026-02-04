# Supabase Edge Functions - Comprehensive Documentation

**Generated**: 2026-01-28
**Total Functions**: 51
**Runtime**: Deno 2 with JSR imports
**Architecture**: FP (Functional Programming) with Result types

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Shared Utilities](#shared-utilities)
3. [Core Functions](#core-functions)
4. [Communication Functions](#communication-functions)
5. [AI Functions](#ai-functions)
6. [Admin Functions](#admin-functions)
7. [Simulation/Testing Functions](#simulationtesting-functions)
8. [Workflow Functions](#workflow-functions)
9. [Utility Functions](#utility-functions)
10. [Common Patterns](#common-patterns)
11. [Potential Improvements](#potential-improvements)

---

## Architecture Overview

### Design Principles

| Principle | Description |
|-----------|-------------|
| **NO_FALLBACK** | All functions fail fast without fallback logic or default values |
| **FP Architecture** | Pure functions, immutable data, side effects isolated to boundaries |
| **Action-Based Routing** | All functions use `{ action, payload }` request pattern |
| **Result Types** | Error propagation via Result monad (ok/err) |
| **Error Collection** | ONE REQUEST = ONE SLACK LOG (consolidated error reporting) |

### Request/Response Format

**Standard Request:**
```json
{
  "action": "action_name",
  "payload": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Authentication Patterns

| Pattern | Description | Used By |
|---------|-------------|---------|
| **JWT Auth** | Bearer token in Authorization header | Most functions |
| **Legacy Auth** | user_id in payload (Bubble migration) | messages |
| **Public** | No auth required | slack, send-email (public templates) |
| **Soft Headers** | Optional auth for internal admin pages | admin functions |

---

## Shared Utilities

### _shared/cors.ts
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};
```

### _shared/errors.ts
| Error Class | HTTP Status | Usage |
|-------------|-------------|-------|
| `ValidationError` | 400 | Invalid input/payload |
| `AuthenticationError` | 401 | Missing/invalid auth |
| `BubbleApiError` | variable | Bubble API failures |
| `SupabaseSyncError` | 500 | Database sync failures |
| `OpenAIError` | variable | AI API failures |

### _shared/functional/result.ts
```typescript
// Result monad for error handling
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

### _shared/functional/orchestration.ts
| Export | Purpose |
|--------|---------|
| `parseRequest()` | Parse and validate request body |
| `validateAction()` | Validate action against allowed list |
| `routeToHandler()` | Route to handler function |
| `getSupabaseConfig()` | Get Supabase URL/keys from env |
| `getBubbleConfig()` | Get Bubble API config from env |
| `formatSuccessResponse()` | Format 200 response |
| `formatErrorResponseHttp()` | Format error response with status |
| `formatCorsResponse()` | Format CORS preflight response |
| `extractAuthToken()` | Extract Bearer token from headers |

### _shared/slack.ts
| Export | Purpose |
|--------|---------|
| `ErrorCollector` | Collect errors for single Slack log |
| `sendToSlack()` | Send message to Slack webhook |
| `createErrorCollector()` | Factory for error collector |
| `reportErrorLog()` | Report error log to Slack |

### _shared/validation.ts
| Export | Purpose |
|--------|---------|
| `validateEmail()` | Validate email format |
| `validatePhone()` | Validate phone format |
| `validateRequired()` | Validate required field exists |
| `validateRequiredFields()` | Validate multiple required fields |

---

## Core Functions

### 1. auth-user
**Purpose**: Authentication operations via Supabase Auth

**Actions:**
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `login` | No | User login (email/password) |
| `signup` | No | New user registration |
| `logout` | No | User logout (stub) |
| `validate` | No | Validate token and fetch user data |
| `request_password_reset` | No | Send password reset email |
| `update_password` | No | Update password after reset |
| `generate_magic_link` | No | Generate magic link without sending |
| `oauth_signup` | No | Create user from OAuth provider |
| `oauth_login` | No | Verify OAuth user exists |
| `send_magic_link_sms` | No | Send magic link via SMS |
| `verify_email` | No | Verify email via magic link token |

**Database Tables**: `user`, `host_account`, `guest_account`

**Example curl:**
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/auth-user" \
  -H "Content-Type: application/json" \
  -d '{"action": "login", "payload": {"email": "user@example.com", "password": "secret"}}'
```

---

### 2. listing
**Purpose**: Listing CRUD operations

**Actions:**
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | No | Create a new listing |
| `get` | No | Get listing details |
| `submit` | Yes | Full listing submission |
| `delete` | No | Delete a listing |

**Database Tables**: `listing`

**Dependencies**: Bubble.io for create/submit (atomic sync)

**Example curl:**
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/listing" \
  -H "Content-Type: application/json" \
  -d '{"action": "get", "payload": {"listing_id": "abc123"}}'
```

---

### 3. proposal
**Purpose**: Proposal CRUD and simulation operations

**Actions:**
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | Yes | Create new proposal |
| `update` | Optional | Update existing proposal |
| `get` | No | Get proposal details |
| `suggest` | Yes | Find and create suggestion proposals |
| `create_suggested` | No | Create suggested proposal (internal) |
| `create_mockup` | No | Create mockup proposal (internal) |
| `get_prefill_data` | No | Get prefill data for proposal |
| `createTestProposal` | Yes | Create test proposal (simulation) |
| `createTestRentalApplication` | Yes | Create test rental application |
| `acceptProposal` | Yes | Accept a proposal |
| `createCounteroffer` | Yes | Create counteroffer |
| `acceptCounteroffer` | Yes | Accept counteroffer |

**Database Tables**: `proposal`, `listing`, `user`

**Example curl:**
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/proposal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"action": "get", "payload": {"proposal_id": "abc123"}}'
```

---

### 4. messages
**Purpose**: Real-time messaging operations

**Actions:**
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `send_message` | Yes | Send message in thread |
| `get_messages` | Yes | Get messages for thread |
| `get_threads` | Yes | Get all threads for user |
| `send_guest_inquiry` | No | Contact host without auth |
| `create_proposal_thread` | No | Create thread for proposal (internal) |
| `admin_get_all_threads` | No* | Fetch all threads (admin) |
| `admin_delete_thread` | No* | Soft-delete thread (admin) |
| `admin_send_reminder` | No* | Send reminder (admin) |

*Admin actions use soft headers pattern (optional auth for internal pages)

**Database Tables**: `thread`, `_message`, `user`, `listing`

**Example curl:**
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"action": "get_threads", "payload": {"user_id": "user123"}}'
```

---

## Communication Functions

### 5. send-email
**Purpose**: Send templated emails via SendGrid

**Actions:**
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `send` | Conditional* | Send templated email |
| `health` | No | Check function health |

*Public templates (magic login, welcome) don't require auth

**Environment Variables:**
- `SENDGRID_API_KEY`
- `SENDGRID_EMAIL_ENDPOINT`

**Example curl:**
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/send-email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"action": "send", "payload": {"template_id": "xxx", "to": "user@example.com", "dynamic_data": {...}}}'
```

---

### 6. send-sms
**Purpose**: Send SMS via Twilio

**Actions:**
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `send` | Conditional* | Send SMS message |
| `health` | No | Check function health |

*Magic link SMS from specific number doesn't require auth

**Environment Variables:**
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

**Example curl:**
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/send-sms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"action": "send", "payload": {"to": "+15551234567", "from": "+14155692985", "body": "Your code is 123456"}}'
```

---

### 7. slack
**Purpose**: Slack integration for FAQ inquiries

**Actions:**
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `faq_inquiry` | No | Send FAQ inquiry to Slack |
| `diagnose` | No | Diagnose environment config |

**Environment Variables:**
- `SLACK_WEBHOOK_ACQUISITION`
- `SLACK_WEBHOOK_GENERAL`

**Example curl:**
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/slack" \
  -H "Content-Type: application/json" \
  -d '{"action": "faq_inquiry", "payload": {"name": "John", "email": "john@example.com", "inquiry": "How does pricing work?"}}'
```

---

### 8. communications
**Purpose**: Placeholder for future communications

**Actions:**
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `health` | No | Health check (placeholder) |

---

## AI Functions

### 9. ai-gateway
**Purpose**: OpenAI proxy with prompt templating

**Actions:**
| Action | Auth Required | Description |
|--------|---------------|-------------|
| `complete` | Conditional* | Non-streaming completion |
| `stream` | Conditional* | SSE streaming completion |

*Public prompts don't require auth

**Public Prompts:**
- `listing-description`
- `listing-title`
- `neighborhood-description`
- `parse-call-transcription`
- `echo-test`
- `negotiation-summary-suggested`
- `negotiation-summary-counteroffer`
- `negotiation-summary-host`

**Example curl:**
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/ai-gateway" \
  -H "Content-Type: application/json" \
  -d '{"action": "complete", "payload": {"prompt_key": "listing-description", "variables": {"neighborhood": "Chelsea", "beds": 2}}}'
```

---

### 10. ai-parse-profile
**Purpose**: AI-powered profile parsing during signup

---

### 11. ai-room-redesign
**Purpose**: AI-powered room redesign suggestions

---

### 12. ai-signup-guest
**Purpose**: AI-powered guest signup flow

---

### 13. ai-tools
**Purpose**: Additional AI utility tools

---

## Admin Functions

### 14. leases-admin
**Purpose**: Admin dashboard for lease management

**Actions:**
| Action | Description |
|--------|-------------|
| `list` | List all leases with pagination |
| `get` | Get single lease details |
| `update` | Update lease data |
| `update_status` | Update lease status |

---

### 15. magic-login-links
**Purpose**: Admin tool for generating magic login links

**Actions:**
| Action | Description |
|--------|-------------|
| `list_users` | List users for magic link generation |
| `get_user_data` | Get user data by ID |
| `send_magic_link` | Generate and send magic link |
| `get_destination_pages` | Get available destination pages |

---

### 16. message-curation
**Purpose**: Admin tool for message moderation

**Actions:**
| Action | Description |
|--------|-------------|
| `getThreads` | Get all threads with filters |
| `getThreadMessages` | Get messages for thread |
| `getMessage` | Get single message |
| `deleteMessage` | Soft-delete message |
| `deleteThread` | Soft-delete thread |
| `forwardMessage` | Forward message |
| `sendSplitBotMessage` | Send SplitBot message |

**Database Tables**: `thread`, `_message`, `user`, `listing`

---

### 17. pricing-admin
**Purpose**: Admin dashboard for listing price management

**Actions:**
| Action | Description |
|--------|-------------|
| `list` | List listings with pricing |
| `get` | Get single listing pricing |
| `updatePrice` | Update listing price |
| `bulkUpdate` | Bulk update prices |
| `setOverride` | Set price override |
| `toggleActive` | Toggle listing active status |
| `getConfig` | Get pricing configuration |
| `export` | Export to CSV/JSON |

---

### 18. rental-applications
**Purpose**: Admin dashboard for rental application management

**Actions:**
| Action | Description |
|--------|-------------|
| `list` | List all applications |
| `get` | Get single application |
| `update` | Update application |
| `update_status` | Update application status |
| `add_occupant` | Add occupant to application |
| `delete_occupant` | Remove occupant |
| `add_reference` | Add reference |
| `delete_reference` | Remove reference |
| `add_employment` | Add employment history |
| `delete_employment` | Remove employment history |

**Database Tables**: `rentalapplication`

---

### 19. simulation-admin
**Purpose**: Admin tool for usability testing simulation testers

**Actions:**
| Action | Description |
|--------|-------------|
| `listTesters` | List all usability testers |
| `getTester` | Get single tester |
| `resetToDay1` | Reset tester to step 0 |
| `advanceToDay2` | Advance tester to step 4 |
| `getStatistics` | Get tester distribution stats |

**Usability Steps:**
| Step | Key | Label |
|------|-----|-------|
| 0 | `not_started` | Not Started |
| 1 | `day_1_intro` | Day 1 - Introduction |
| 2 | `day_1_tasks` | Day 1 - Tasks |
| 3 | `day_1_complete` | Day 1 - Complete |
| 4 | `day_2_intro` | Day 2 - Introduction |
| 5 | `day_2_tasks` | Day 2 - Tasks |
| 6 | `day_2_complete` | Day 2 - Complete |
| 7 | `completed` | Completed |

---

### 20. usability-data-admin
**Purpose**: Admin tool for managing usability testing data

**Actions:**
| Action | Description |
|--------|-------------|
| `listHosts` | Get usability tester hosts |
| `listGuests` | Get usability tester guests |
| `deleteHostData` | Clear host threads/proposals |
| `deleteHostListings` | Delete all host listings |
| `deleteHostTestStatus` | Reset host test step |
| `deleteGuestData` | Clear guest threads/proposals |
| `deleteGuestTestStatus` | Reset guest test step |
| `fetchListing` | Get listing by ID |
| `createQuickProposal` | Create test proposal |
| `deleteProposal` | Delete proposal |

---

### 21. verify-users
**Purpose**: User verification management

---

### 22. co-host-requests
**Purpose**: Co-host request management

---

### 23. informational-texts
**Purpose**: Manage informational text content

---

### 24. pricing-list
**Purpose**: Pricing list management

---

### 25. reviews-overview
**Purpose**: Reviews overview and management

---

## Simulation/Testing Functions

### 26. simulation-guest
**Purpose**: Guest-side usability simulation flow

---

### 27. simulation-host
**Purpose**: Host-side usability simulation flow

---

## Workflow Functions

### 28. bubble_sync
**Purpose**: Process sync_queue and push data FROM Supabase TO Bubble

**Actions:**
| Action | Description |
|--------|-------------|
| `process_queue` | Process using Workflow API |
| `process_queue_data_api` | Process using Data API (recommended) |
| `sync_single` | Manually sync single record |
| `retry_failed` | Retry failed items |
| `get_status` | Get queue statistics |
| `cleanup` | Clean up old completed items |
| `build_request` | Preview request (debugging) |
| `sync_signup_atomic` | Atomic signup sync |

**Queue Table**: `sync_queue`
**Status Flow**: `pending` -> `processing` -> `completed`/`failed`

---

### 29. workflow-enqueue
**Purpose**: Enqueue workflow operations

---

### 30. workflow-orchestrator
**Purpose**: Orchestrate complex workflows

---

### 31. reminder-scheduler
**Purpose**: Schedule and manage reminders

---

## Utility Functions

### 32. qr-generator
**Purpose**: Generate QR codes

---

### 33. qr-codes
**Purpose**: QR code management

---

### 34. query-leo
**Purpose**: Query Leo (internal tool)

---

### 35. quick-match
**Purpose**: Quick matching algorithm for listings

---

### 36. pricing
**Purpose**: Pricing calculations (placeholder)

---

### 37. lease
**Purpose**: Lease operations

---

### 38. house-manual
**Purpose**: House manual management

---

### 39. identity-verification
**Purpose**: Identity verification operations

---

### 40. emergency
**Purpose**: Emergency contact/procedures

---

### 41. document
**Purpose**: Document management

---

### 42. date-change-request
**Purpose**: Handle date change requests

---

### 43. cohost-request
**Purpose**: Co-host request operations

---

### 44. cohost-request-slack-callback
**Purpose**: Handle Slack callbacks for co-host requests

---

### 45. virtual-meeting
**Purpose**: Virtual meeting integration (HeyGen, ElevenLabs)

---

### 46. rental-application
**Purpose**: Rental application operations (user-facing)

---

### 47. guest-management
**Purpose**: Guest management operations

---

### 48. guest-payment-records
**Purpose**: Guest payment record management

---

### 49. host-payment-records
**Purpose**: Host payment record management

---

### 50. experience-survey
**Purpose**: Experience survey management

---

### 51. backfill-negotiation-summaries
**Purpose**: Backfill AI-generated negotiation summaries

---

## Common Patterns

### 1. FP Architecture Pattern
```typescript
import { Result, ok, err } from "../_shared/functional/result.ts";
import { createErrorLog, addError, setAction } from "../_shared/functional/errorLog.ts";

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID().slice(0, 8);
  let errorLog = createErrorLog('function-name', 'unknown', correlationId);

  try {
    // Step 1: Parse request
    const parseResult = await parseRequest(req);
    if (!parseResult.ok) {
      if (parseResult.error instanceof CorsPreflightSignal) {
        return formatCorsResponse();
      }
      throw parseResult.error;
    }

    // Step 2: Validate action
    const actionResult = validateAction(ALLOWED_ACTIONS, action);
    if (!actionResult.ok) throw actionResult.error;

    // Step 3: Get configuration
    const configResult = getSupabaseConfig();
    if (!configResult.ok) throw configResult.error;

    // Step 4: Route to handler
    const handlerResult = routeToHandler(handlers, action);
    if (!handlerResult.ok) throw handlerResult.error;

    const result = await handler(payload);
    return formatSuccessResponse(result);

  } catch (error) {
    errorLog = addError(errorLog, error, 'Fatal error');
    reportErrorLog(errorLog);
    return formatErrorResponseHttp(error);
  }
});
```

### 2. Authentication Pattern
```typescript
// JWT Auth (modern)
const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user }, error } = await authClient.auth.getUser();

// Legacy Auth (user_id in payload)
const userId = payload.user_id;
const { data: userData } = await supabaseAdmin
  .from('user')
  .select('_id, email')
  .eq('_id', userId)
  .maybeSingle();
```

### 3. Soft Headers Pattern (Admin Pages)
```typescript
// Optional auth for internal admin pages
const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);
if (user) {
  console.log(`Authenticated user: ${user.email}`);
} else {
  console.log('No auth header - proceeding as internal page request');
}
```

### 4. Dynamic Imports (Lazy Loading)
```typescript
// Load handlers on demand to reduce boot time
switch (action) {
  case 'create': {
    const { handleCreate } = await import("./actions/create.ts");
    result = await handleCreate(payload, user, supabase);
    break;
  }
}
```

---

## Potential Improvements

### Security
1. **Re-enable admin role checks**: Many admin functions have role checks commented out for testing
2. **Rate limiting**: Add rate limiting for public endpoints (send-email, send-sms)
3. **Input sanitization**: Add more robust input sanitization for user-provided content

### Architecture
1. **Consolidate error handling**: Some functions have inlined error classes, should use shared
2. **Standardize handler signatures**: Handler parameters vary between functions
3. **Add request ID logging**: Include correlation ID in all log messages

### Performance
1. **Connection pooling**: Implement connection pooling for database clients
2. **Cache frequently accessed data**: Add caching layer for configuration data
3. **Optimize cold starts**: More aggressive lazy loading of handlers

### Documentation
1. **Add OpenAPI specs**: Generate OpenAPI documentation for each function
2. **Add integration tests**: Create comprehensive test suite for each action
3. **Add request/response schemas**: TypeScript interfaces for all payloads

### Monitoring
1. **Add metrics collection**: Track latency, error rates per function
2. **Structured logging**: Move to structured JSON logging
3. **Alert thresholds**: Configure alerts for error rate spikes

---

## Environment Variables Reference

| Variable | Used By | Purpose |
|----------|---------|---------|
| `SUPABASE_URL` | All | Supabase project URL |
| `SUPABASE_ANON_KEY` | All | Client operations |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Admin operations |
| `BUBBLE_API_BASE_URL` | bubble_sync, listing | Bubble API base URL |
| `BUBBLE_API_KEY` | bubble_sync, listing | Bubble API key |
| `OPENAI_API_KEY` | ai-gateway, ai-* | OpenAI API key |
| `SENDGRID_API_KEY` | send-email | SendGrid API key |
| `SENDGRID_EMAIL_ENDPOINT` | send-email | SendGrid endpoint |
| `TWILIO_ACCOUNT_SID` | send-sms | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | send-sms | Twilio auth token |
| `SLACK_WEBHOOK_DATABASE_WEBHOOK` | _shared/slack | Database errors |
| `SLACK_WEBHOOK_ACQUISITION` | slack | Acquisition channel |
| `SLACK_WEBHOOK_GENERAL` | slack | General channel |

---

**Document Version**: 1.0
**Last Updated**: 2026-01-28
**Generated By**: Claude Opus 4.5
