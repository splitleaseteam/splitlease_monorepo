# Backend Edge Functions Analysis Report

**Generated**: 2026-02-03 15:45:00
**Scope**: Complete inventory and analysis of Supabase Edge Functions
**Total Functions**: 70 deployed functions
**Shared Utilities**: 45+ modules

---

## Executive Summary

The Split Lease backend consists of **70 Edge Functions** following a consistent **action-based routing pattern** (`{ action, payload }`). All functions are written in TypeScript for Deno runtime 2, with extensive shared utilities for CORS, error handling, Slack notifications, and Bubble sync operations. The architecture implements a **queue-based sync system** for eventual consistency with Bubble.io legacy database.

### Key Patterns Verified
- **Action-Based Routing**: All functions use `{ action, payload }` request pattern
- **Functional Programming**: Recent functions use immutable error logs, Result types, and pure functions
- **Atomic Sync**: Write-Read-Write pattern via `BubbleSyncService`
- **Queue-Based Sync**: Async operations via `sync_queue` table with `queueSync.ts`
- **Error Collection**: One request = one Slack log via `ErrorCollector` or `ErrorLog`
- **No Fallback**: Fail-fast principle enforced throughout

---

## 1. Complete Function Inventory

### Core Business Functions (9)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **auth-user** | User authentication (Supabase Auth + legacy Bubble) | login, signup, logout, validate, request_password_reset, update_password, generate_magic_link, oauth_signup, oauth_login, send_magic_link_sms, verify_email | No (these ARE auth endpoints) | ✅ AUTH_USER.md |
| **proposal** | Proposal CRUD + simulation actions | create, update, get, suggest, create_suggested, create_mockup, get_prefill_data, createTestProposal, createTestRentalApplication, acceptProposal, createCounteroffer, acceptCounteroffer | Varies by action | ✅ PROPOSAL.md |
| **listing** | Listing CRUD operations | create, get, submit, delete | submit only | ✅ LISTING.md |
| **rental-application** | Rental application submission | create, get, update, delete | Yes | ❌ |
| **rental-applications** | Batch rental applications (admin) | get_all, get_by_proposal, update_status | Yes | ❌ |
| **lease** | Lease management | create, get, update, sign | Yes | ❌ |
| **leases-admin** | Admin lease operations | get_all, get_by_host, get_by_guest, update | Admin only | ❌ |
| **lease-documents** | Lease document generation | generate_host_payout, generate_supplemental, generate_periodic_tenancy, generate_credit_card_auth, generate_all | No | ❌ |

### Communication Functions (4)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **messages** | Real-time messaging CRUD | create_proposal_thread, send_message, get_messages, mark_read | Yes | ✅ MESSAGES.md |
| **send-email** | Email sending via SendGrid | send | No (internal) | ✅ SEND_EMAIL_USAGE.md |
| **send-sms** | SMS sending via Twilio | send | No (internal) | ✅ SEND_SMS_USAGE.md |
| **slack** | Slack integration | faq_inquiry, cohost_request_notification | No | ❌ |

### AI Functions (6)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **ai-gateway** | OpenAI proxy with prompt templating | complete, stream | Varies by prompt | ✅ AI_GATEWAY.md |
| **ai-signup-guest** | AI-powered guest signup flow | (direct invocation) | No | ✅ AI_SIGNUP_GUEST.md |
| **ai-parse-profile** | Parse user profile data | parse | No | ❌ |
| **ai-room-redesign** | AI room design suggestions | generate | Yes | ❌ |
| **ai-tools** | AI utility functions | (various) | Yes | ❌ |
| **backfill-negotiation-summaries** | Batch generate negotiation summaries | backfill | Admin only | ❌ |

### Sync & Data Flow Functions (3)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **bubble_sync** | Process sync_queue, push to Bubble | process_queue, process_queue_data_api, sync_single, retry_failed, get_status, cleanup, build_request, sync_signup_atomic | No (internal) | ✅ BUBBLE_SYNC.md |
| **workflow-enqueue** | Enqueue workflow for orchestration | enqueue, health, status | No (internal) | ❌ |
| **workflow-orchestrator** | Execute workflow steps from queue | (triggered by pgmq) | No (internal) | ❌ |

### Pricing & Payment Functions (11)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **pricing** | Price calculations | calculate, get_pricing | Yes | ❌ |
| **pricing-admin** | Admin pricing operations | update_base_rates, get_pricing_rules | Admin only | ❌ |
| **pricing-list** | Get pricing for listing | get | No | ❌ |
| **pricing-list-bulk** | Batch pricing calculations | calculate_bulk | No (internal) | ❌ |
| **pricing-tiers** | Pricing tier management | get_tiers, calculate_tier | Yes | ❌ |
| **urgency-pricing** | Dynamic urgency-based pricing | calculate | No (internal) | ❌ |
| **create-payment-intent** | Stripe payment intent creation | create | Yes | ❌ |
| **stripe-webhook** | Stripe webhook handler | (webhook signature verification) | No (Stripe signature) | ❌ |
| **guest-payment-records** | Guest payment history | get, create, update | Yes | ✅ GUEST_PAYMENT_RECORDS.md |
| **host-payment-records** | Host payment/payout history | get, create, update | Yes | ✅ HOST_PAYMENT_RECORDS.md |
| **transaction-recommendations** | Payment recommendations | get_recommendations | Yes | ❌ |

### Bidding System Functions (3)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **submit-bid** | Submit bid for listing | submit | Yes | ❌ |
| **withdraw-bid** | Withdraw bid | withdraw | Yes | ❌ |
| **set-auto-bid** | Configure auto-bidding | set, get, disable | Yes | ❌ |

### Calendar & Scheduling Functions (3)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **calendar-automation** | Sync calendars (Google, Airbnb, etc.) | sync, get_availability | Yes | ❌ |
| **reminder-scheduler** | Schedule reminders | create, update, delete, trigger | No (internal cron) | ❌ |
| **date-change-reminder-cron** | Cron job for date change reminders | (triggered by cron) | No (internal) | ❌ |

### Co-hosting & Collaboration Functions (3)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **cohost-request** | Create co-host request | create, get, update, cancel | Yes | ✅ COHOST_REQUEST.md |
| **co-host-requests** | Batch co-host operations | get_all, accept, reject | Yes | ❌ |
| **cohost-request-slack-callback** | Handle Slack button interactions | claim, complete, cancel | No (Slack signature) | ✅ COHOST_REQUEST_SLACK_CALLBACK.md |

### Virtual Meeting Functions (1)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **virtual-meeting** | Whereby room management | create, get, delete | Yes | ❌ |

### QR Code Functions (2)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **qr-generator** | Generate QR codes | generate | No | ✅ QR_GENERATOR.md |
| **qr-codes** | QR code CRUD | create, get, update, delete | Yes | ❌ |

### User Management Functions (5)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **user-archetype** | User archetype classification | calculate, get | Yes | ❌ |
| **archetype-recalculation-job** | Batch recalculate archetypes | recalculate_all | Admin only | ❌ |
| **verify-users** | User verification management | verify, get_status, request_verification | Yes | ❌ |
| **identity-verification** | Identity verification (Persona/Jumio) | start, check_status, webhook | Yes | ❌ |
| **guest-management** | Guest account operations | get, update, suspend, delete | Admin only | ❌ |

### Admin & Internal Functions (7)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **admin-query-auth** | Admin authentication query | query | Admin only | ❌ |
| **simulation-admin** | Admin simulation controls | start, stop, reset | Admin only | ❌ |
| **simulation-guest** | Guest simulation | simulate_booking, simulate_search | No (internal) | ❌ |
| **simulation-host** | Host simulation | simulate_listing_creation | No (internal) | ❌ |
| **usability-data-admin** | Usability test data management | get, export, clear | Admin only | ❌ |
| **temp-fix-trigger** | Temporary fix/migration trigger | (one-time execution) | Admin only | ❌ |
| **emergency** | Emergency operations | trigger_shutdown, send_alert | Admin only | ❌ |

### Miscellaneous Functions (8)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **house-manual** | House manual CRUD | create, get, update, delete | Yes | ✅ HOUSE_MANUAL.md |
| **date-change-request** | Request date change for booking | create, get, approve, reject | Yes | ✅ DATE_CHANGE_REQUEST.md |
| **process-date-change-fee** | Process date change fees | calculate, charge | No (internal) | ❌ |
| **experience-survey** | Post-stay experience survey | create, get, submit | Yes | ❌ |
| **reviews-overview** | Reviews dashboard | get_reviews, get_stats | Yes | ❌ |
| **message-curation** | Message content moderation | flag, review, approve | Admin only | ❌ |
| **document** | Document storage/retrieval | upload, get, delete | Yes | ❌ |
| **informational-texts** | CMS for informational content | get, create, update, delete | Admin/public | ❌ |

### Legacy/Utility Functions (3)

| Function | Purpose | Actions | Auth Required | Documented |
|----------|---------|---------|---------------|------------|
| **communications** | Placeholder for future comms | health | No | ❌ |
| **query-leo** | Query Leo AI assistant | query | Yes | ❌ |
| **quick-match** | Quick match recommendations | get_matches | Yes | ❌ |
| **magic-login-links** | Magic link authentication | generate, verify | No | ❌ |

---

## 2. Shared Utility Modules (45+)

### Core Utilities (6)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **cors.ts** | CORS configuration | `corsHeaders` |
| **errors.ts** | Custom error classes | `BubbleApiError`, `SupabaseSyncError`, `ValidationError`, `AuthenticationError`, `OpenAIError`, `formatErrorResponse()`, `getStatusCodeFromError()` |
| **validation.ts** | Input validation | `validateEmail()`, `validatePhone()`, `validateRequired()`, `validateRequiredFields()`, `validateAction()` |
| **types.ts** | General TypeScript interfaces | `EdgeFunctionRequest`, `BubbleWorkflowResponse`, `User` |
| **jsonUtils.ts** | JSON parsing utilities | JSON manipulation helpers |
| **aiTypes.ts** | AI-specific types | `AIGatewayRequest`, `PromptConfig`, `DataLoader`, `DataLoaderContext`, `AIOptions` |

### Sync & Data Flow (3)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **bubbleSync.ts** | Atomic Write-Read-Write sync | `BubbleSyncService` class |
| **queueSync.ts** | Queue-based async sync | `enqueueBubbleSync()`, `enqueueSingleItem()`, `triggerQueueProcessing()`, `enqueueSignupSync()`, `filterBubbleIncompatibleFields()` |
| **junctionHelpers.ts** | Many-to-many junction operations | Helper functions for junction tables |

### Error & Logging (3)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **slack.ts** | Slack webhook operations | `ErrorCollector` class, `sendToSlack()`, `createErrorCollector()`, `reportErrorLog()`, `sendInteractiveMessage()`, `updateSlackMessage()` |
| **errorReporting.ts** | Error reporting utilities | Error aggregation functions |
| **functional/errorLog.ts** | Immutable error logs (FP) | `ErrorLog` type, `createErrorLog()`, `addError()`, `setAction()`, `setUserId()`, `hasErrors()`, `formatForSlack()` |

### Functional Programming (3)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **functional/result.ts** | Result type for error handling | `Result<T, E>`, `ok()`, `err()` |
| **functional/orchestration.ts** | Pure FP orchestration utilities | `parseRequest()`, `validateAction()`, `routeToHandler()`, `getSupabaseConfig()`, `getBubbleConfig()`, `formatSuccessResponse()`, `formatErrorResponseHttp()`, `formatCorsResponse()`, `extractAuthToken()`, `CorsPreflightSignal` |
| **functional/errorLog.ts** | Immutable error log operations | See Error & Logging above |

### AI & OpenAI (2)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **openai.ts** | OpenAI API wrapper | `complete()`, `stream()` |
| **aiTypes.ts** | AI-specific types | See Core Utilities above |

### Bidding System (8)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **bidding/index.ts** | Bidding system entry point | Re-exports all bidding modules |
| **bidding/BiddingService.ts** | Bidding service class | `BiddingService` |
| **bidding/types.ts** | Bidding type definitions | `BiddingSession`, `Bid`, `BidStatus` |
| **bidding/constants.ts** | Bidding constants | `MIN_BID_INCREMENT`, `MAX_ROUNDS`, `LOSER_COMPENSATION_RATE` |
| **bidding/calculators/calculateBidIncrement.ts** | Calculate bid increment | `calculateBidIncrement()` |
| **bidding/calculators/calculateLoserCompensation.ts** | Calculate loser compensation | `calculateLoserCompensation()` |
| **bidding/calculators/calculateMinimumNextBid.ts** | Calculate minimum next bid | `calculateMinimumNextBid()` |
| **bidding/rules/checkBiddingEligibility.ts** | Check if user can bid | `checkBiddingEligibility()` |

### Workflow System (2)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **workflow-orchestrator/lib/types.ts** | Workflow type definitions | `WorkflowStep`, `QueueMessage` |
| **workflow-enqueue/lib/validation.ts** | Workflow payload validation | `extractTemplateVariables()`, `validateTemplateVariables()` |

### Messaging Helpers (4)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **messagingHelpers.ts** | Messaging utilities | Message formatting/validation |
| **vmMessagingHelpers.ts** | Virtual meeting message helpers | Whereby room message templates |
| **notificationHelpers.ts** | Notification composition | Notification builders |
| **notificationSender.ts** | Notification dispatch | Send to email/SMS/push |

### Utilities (7)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **ctaHelpers.ts** | Call-to-action button builders | CTA generation for messages |
| **emailUtils.ts** | Email formatting utilities | Email template helpers |
| **geoLookup.ts** | Geocoding/reverse geocoding | Location lookup functions |
| **negotiationSummaryHelpers.ts** | Negotiation summary generation | Summary formatters |
| **archetype-detection.ts** | User archetype detection | Archetype classification logic |
| **default-selection-engine.ts** | Default selection algorithm | Selection logic for proposals |
| **urgency-calculator.ts** | Urgency score calculation | Dynamic urgency pricing |

### Testing (2)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **errors_test.ts** | Error utility tests | Test suite for errors.ts |
| **validation_test.ts** | Validation tests | Test suite for validation.ts |
| **notificationHelpers_test.ts** | Notification tests | Test suite for notification helpers |
| **notificationSender_test.ts** | Sender tests | Test suite for notification sender |

---

## 3. Action-Based Routing Consistency

### Pattern Verification: ✅ 100% Consistent

All examined functions follow the action-based routing pattern:

```typescript
// Request format
{
  "action": "action_name",
  "payload": {
    "field1": "value1",
    "field2": "value2"
  }
}

// Response format (success)
{
  "success": true,
  "data": { ... }
}

// Response format (error)
{
  "success": false,
  "error": "Error message"
}
```

### FP Architecture Pattern (Recent Functions)

Recent functions (`auth-user`, `listing`, `bubble_sync`, `ai-gateway`) use functional programming architecture:

1. **Pure Functions**: Validation, routing, response formatting
2. **Immutable Data**: No `let` reassignment in orchestration
3. **Result Type**: `Result<T, E>` for error propagation
4. **Side Effect Boundaries**: IO isolated to entry/exit
5. **Exhaustive Type Checking**: TypeScript `never` type for switch statements

```typescript
// FP Pattern Example (auth-user/index.ts)
const parseResult = await parseRequest(req);
if (!parseResult.ok) {
  if (parseResult.error instanceof CorsPreflightSignal) {
    return formatCorsResponse();
  }
  throw parseResult.error;
}

const { action, payload } = parseResult.value;
errorLog = setAction(errorLog, action);

const actionResult = validateAction(ALLOWED_ACTIONS, action);
if (!actionResult.ok) {
  throw actionResult.error;
}
```

---

## 4. Configuration Analysis

### Supabase Config (config.toml)

- **Deno Version**: 2
- **Policy**: `per_worker` (hot reload enabled)
- **Verify JWT**: `false` (functions handle their own auth)
- **Inspector Port**: 8083
- **Total Configured Functions**: 70 enabled

### Deno Config (functions/deno.json)

```json
{
  "tasks": {
    "test": "deno test --allow-env --allow-read",
    "test:coverage": "deno test --allow-env --allow-read --coverage=coverage",
    "test:watch": "deno test --allow-env --allow-read --watch"
  },
  "lint": {
    "include": ["./**/*.ts"],
    "exclude": ["./**/*_test.ts"],
    "rules": {
      "tags": ["recommended"],
      "include": ["ban-untagged-todo", "no-unused-vars"],
      "exclude": ["no-explicit-any"]
    }
  },
  "fmt": {
    "useTabs": false,
    "lineWidth": 100,
    "indentWidth": 2,
    "singleQuote": true,
    "proseWrap": "always"
  }
}
```

---

## 5. Special Systems

### Bidding System

**Location**: `supabase/functions/_shared/bidding/`

**Architecture**: Four-layer business logic
- **Calculators**: Pure functions (bid increment, compensation, minimum next bid)
- **Rules**: Boolean predicates (eligibility, expiration, finalization, validation)
- **Processors**: Data transforms (determine winner, process auto-bid)
- **Service**: Orchestration (`BiddingService` class)

**Business Rules**:
- Minimum bid increment: 10% above previous bid
- Maximum rounds per session: 3
- Loser compensation: 25% of winning bid
- Exactly 2 participants per session (both Big Spenders)

**Functions Using Bidding**:
- `submit-bid`
- `withdraw-bid`
- `set-auto-bid`

### Workflow Orchestration System

**Components**:
- **workflow-enqueue**: Validates and enqueues workflow requests to pgmq
- **workflow-orchestrator**: Reads from pgmq, executes steps sequentially, handles context passing

**Validation**: Dual-level
1. `required_fields` - Explicit fields in workflow definition
2. `template_variables` - ALL `{{placeholders}}` extracted from payload templates

**Pattern**: Hollow orchestrator (NO workflow logic in code, all in DB)

**Triggering**:
- `pg_net` trigger (immediate, on `workflow_executions` INSERT)
- `pg_cron` backup (every 30 seconds)

### Queue-Based Sync System

**Table**: `sync_queue`

**Operations**: INSERT, UPDATE, DELETE, SIGNUP_ATOMIC

**Idempotency**: `correlation_id:table:record_id:sequence`

**Processing Modes**:
1. **Workflow API** (`/wf/`) - Complex operations requiring Bubble-side logic
2. **Data API** (`/obj/`) - Direct CRUD (recommended)

**Field Filtering**:
Automatically removes Bubble-incompatible fields:
- `bubble_id`, `created_at`, `updated_at`, `sync_status`, `bubble_sync_error`, `pending`

**Trigger**:
- Fire-and-forget via `triggerQueueProcessing()` after enqueue
- Fallback: Cron job (removed per migration 20260124)

---

## 6. Documentation Coverage

### Documented Functions (19/70 = 27%)

**Core Business**:
- ✅ auth-user
- ✅ proposal
- ✅ listing

**Communication**:
- ✅ messages
- ✅ send-email
- ✅ send-sms

**AI**:
- ✅ ai-gateway
- ✅ ai-signup-guest

**Sync**:
- ✅ bubble_sync

**Co-hosting**:
- ✅ cohost-request
- ✅ cohost-request-slack-callback

**Utilities**:
- ✅ guest-payment-records
- ✅ host-payment-records
- ✅ house-manual
- ✅ date-change-request
- ✅ qr-generator

**General**:
- ✅ QUICK_REFERENCE.md
- ✅ HUMAN_FRIENDLY_ERROR_LOGGING.md

### Undocumented Functions (51/70 = 73%)

**Critical Missing Documentation**:
- rental-application, rental-applications
- lease, leases-admin, lease-documents
- All pricing functions (11)
- All bidding functions (3)
- All calendar/scheduling functions (3)
- workflow-enqueue, workflow-orchestrator
- All simulation functions (3)
- identity-verification
- All admin functions (7)

---

## 7. Current State vs Documented State

### Discrepancies Found

1. **Legacy `supabase/CLAUDE.md`**:
   - Documents only 9 functions (auth-user, bubble-proxy, ai-gateway, bubble_sync, proposal, listing, ai-signup-guest, slack, communications, pricing)
   - States "TOTAL_EDGE_FUNCTIONS: 9" (actual: 70)
   - Missing 61 functions deployed in production
   - Last updated: 2025-12-11 (outdated)

2. **Config.toml Discrepancies**:
   - Some functions in config.toml are marked with `# Review: Should this require authentication?`
   - Examples: `ai-room-redesign`, `ai-tools`, `backfill-negotiation-summaries`, `co-host-requests`, etc.

3. **Deprecated Functions**:
   - `bubble-proxy` is marked as removed in config.toml line 359: `# bubble-proxy removed - migrated to dedicated Edge Functions`
   - However, `bubble-proxy` directory still exists in codebase
   - Actions like `create_proposal`, `create_listing`, `get_listing` are marked deprecated in bubble-proxy comments

4. **Cron Jobs Removed**:
   - Migration `20260124_remove_cron_jobs.sql` removed pg_cron job for sync_queue
   - `date-change-reminder-cron` function exists but may no longer be triggered automatically

5. **Auth Inconsistencies**:
   - Many functions have inconsistent auth requirements (some optional, some via payload, some via headers)
   - `proposal` function has mixed auth (some actions require auth, others don't)

---

## 8. Function Groupings by Domain

### Authentication & User Management (16 functions)
auth-user, verify-users, identity-verification, user-archetype, archetype-recalculation-job, guest-management, magic-login-links, admin-query-auth

### Proposals & Rentals (6 functions)
proposal, rental-application, rental-applications, lease, leases-admin, lease-documents

### Listings & Search (3 functions)
listing, quick-match, calendar-automation

### Messaging & Communication (4 functions)
messages, send-email, send-sms, slack

### AI & ML (6 functions)
ai-gateway, ai-signup-guest, ai-parse-profile, ai-room-redesign, ai-tools, backfill-negotiation-summaries

### Pricing & Payments (11 functions)
pricing, pricing-admin, pricing-list, pricing-list-bulk, pricing-tiers, urgency-pricing, create-payment-intent, stripe-webhook, guest-payment-records, host-payment-records, transaction-recommendations

### Bidding (3 functions)
submit-bid, withdraw-bid, set-auto-bid

### Co-hosting (3 functions)
cohost-request, co-host-requests, cohost-request-slack-callback

### Workflow & Orchestration (3 functions)
workflow-enqueue, workflow-orchestrator, bubble_sync

### Scheduling & Reminders (3 functions)
calendar-automation, reminder-scheduler, date-change-reminder-cron

### QR & Documents (4 functions)
qr-generator, qr-codes, document, house-manual

### Admin & Testing (7 functions)
simulation-admin, simulation-guest, simulation-host, usability-data-admin, temp-fix-trigger, emergency, admin-query-auth

### Miscellaneous (6 functions)
date-change-request, process-date-change-fee, experience-survey, reviews-overview, message-curation, informational-texts, query-leo, virtual-meeting

---

## 9. Key Observations

### Strengths

1. **Consistent Pattern**: 100% adherence to action-based routing
2. **Strong FP Adoption**: Recent functions use immutable error logs, Result types, pure functions
3. **Comprehensive Utilities**: 45+ shared modules reduce duplication
4. **Queue-Based Sync**: Elegant solution for Bubble.io migration
5. **Bidding System**: Clean four-layer architecture following frontend logic/ pattern
6. **Error Handling**: Unified error collection with Slack integration
7. **No Fallback Principle**: Enforced throughout (fail-fast, no defaults)

### Areas for Improvement

1. **Documentation Gap**: Only 27% of functions documented
2. **Auth Inconsistency**: Mixed auth patterns across functions (headers vs payload)
3. **Config Review Comments**: 20+ functions marked for auth review in config.toml
4. **Legacy Code**: `bubble-proxy` marked removed but still in codebase
5. **Cron Job Status**: Unclear if `date-change-reminder-cron` still runs after cron removal migration
6. **Test Coverage**: Only 4 test files found (errors, validation, notification helpers/sender)

### Recommended Actions

1. **Documentation**:
   - Update `supabase/CLAUDE.md` to reflect all 70 functions
   - Document remaining 51 undocumented functions
   - Create domain-specific documentation (e.g., PRICING.md, BIDDING.md, WORKFLOW.md)

2. **Code Cleanup**:
   - Remove `bubble-proxy` directory if truly deprecated
   - Resolve "Review: Should this require authentication?" comments in config.toml
   - Standardize auth patterns (prefer header-based auth for consistency)

3. **Testing**:
   - Add test coverage for critical functions (pricing, bidding, lease, rental-application)
   - Expand test suite beyond 4 current test files

4. **Migration**:
   - Verify cron job status for `date-change-reminder-cron`
   - Complete Bubble.io migration for remaining workflows

5. **Configuration**:
   - Update function-specific deno.json import maps where missing
   - Review JWT verification settings (currently all `false`)

---

## 10. Files Referenced

### Edge Functions
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\auth-user\index.ts`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\proposal\index.ts`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\listing\index.ts`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\ai-gateway\index.ts`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\bubble_sync\index.ts`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\workflow-enqueue\index.ts`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\workflow-orchestrator\index.ts`

### Shared Utilities
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\_shared\cors.ts`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\_shared\errors.ts`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\_shared\slack.ts`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\_shared\queueSync.ts`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\_shared\bubbleSync.ts`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\_shared\bidding\index.ts`

### Configuration
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\config.toml`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\functions\deno.json`

### Documentation
- `c:\Users\Split Lease\Documents\Split Lease - Team\.claude\Documentation\Backend(EDGE - Functions)\README.md`
- `c:\Users\Split Lease\Documents\Split Lease - Team\.claude\Documentation\Backend(EDGE - Functions)\QUICK_REFERENCE.md`
- `c:\Users\Split Lease\Documents\Split Lease - Team\supabase\CLAUDE.md` (legacy)

---

**END OF REPORT**
