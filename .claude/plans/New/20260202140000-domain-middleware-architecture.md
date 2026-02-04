# Domain + Middleware Architecture Plan

**Created:** 2026-02-02
**Status:** New
**Purpose:** Consolidate 57 edge functions into domain-based orchestrators with role-based middleware

---

## Executive Summary

This plan consolidates 57 individual Supabase Edge Functions into **6 domain orchestrators** using Hono routing, implementing **role-based middleware** for access control. The architecture eliminates cold start accumulation (375-1200ms → 125-400ms per workflow), reduces deployment complexity (57 → 6 targets), and centralizes role-based permissions.

---

## Current State Analysis

### Function Count by Category

| Category | Count | Functions |
|----------|-------|-----------|
| Core Business | 7 | proposal, listing, lease, lease-documents, document, messages, rental-application |
| Authentication | 5 | auth-user, magic-login-links, verify-users, identity-verification, admin-query-auth |
| User Workflows | 5 | guest-management, cohost-request, co-host-requests, guest-payment-records, host-payment-records |
| Simulation/Testing | 4 | simulation-host, simulation-guest, simulation-admin, tests |
| AI & Content | 7 | ai-gateway, ai-parse-profile, ai-room-redesign, ai-signup-guest, ai-tools, query-leo |
| Communications | 12 | send-email, send-sms, communications, message-curation, virtual-meeting, calendar-automation, date-change-*, reminder-scheduler, emergency, experience-survey, reviews-overview |
| Integrations | 4 | bubble-proxy, bubble_sync, slack, cohost-request-slack-callback |
| Admin & Utilities | 12 | pricing*, qr-*, quick-match, house-manual, informational-texts, usability-data-admin, workflow-*, backfill-*, temp-fix-trigger |
| **TOTAL** | **56** | |

### Existing Patterns (Keep)

1. **Action-based routing**: `{ action, payload }` request pattern (100% adoption)
2. **FP architecture**: Result types, pure functions, error collection (6+ functions)
3. **Shared utilities**: `_shared/` with 25+ modules
4. **Bubble sync**: Atomic + queue-based patterns
5. **AI prompt registry**: Pluggable prompt system with data loaders

### Problems to Solve

1. **Cold start accumulation**: 3-step workflow = 375-1200ms overhead
2. **57 deployment targets**: Complex CI/CD, slow deploys
3. **Scattered permissions**: Role checks embedded in individual actions
4. **No workflow orchestration**: Multi-step processes lack durability

---

## Target Architecture

### Domain Orchestrators (6 Functions)

```
supabase/functions/
├── _shared/
│   ├── middleware/
│   │   ├── role-auth.ts           # Role extraction + permission checking
│   │   ├── correlation.ts         # Correlation ID propagation
│   │   └── error-boundary.ts      # Centralized error handling
│   ├── permissions/
│   │   ├── types.ts               # Role, Permission types
│   │   ├── proposal-permissions.ts
│   │   ├── listing-permissions.ts
│   │   ├── lease-permissions.ts
│   │   └── message-permissions.ts
│   ├── functional/                # (existing - keep)
│   ├── workflows/                 # pgflow integration
│   │   ├── engine.ts              # pgflow wrapper
│   │   └── saga.ts                # Compensation orchestrator
│   └── ... (existing shared utils)
│
├── auth/                          # Domain: Authentication (5 functions → 1)
│   ├── index.ts                   # Hono router
│   ├── actions/
│   │   ├── login.ts
│   │   ├── signup.ts
│   │   ├── logout.ts
│   │   ├── magic-link.ts
│   │   ├── verify.ts
│   │   ├── password-reset.ts
│   │   └── oauth.ts
│   └── deno.json
│
├── proposals/                     # Domain: Proposals (3 functions → 1)
│   ├── index.ts                   # Hono router
│   ├── actions/
│   │   ├── create.ts              # Guest creates proposal
│   │   ├── get.ts                 # Both: get proposal details
│   │   ├── get-for-host.ts        # Host: enriched host view
│   │   ├── get-for-guest.ts       # Guest: enriched guest view
│   │   ├── accept.ts              # Host: accept proposal
│   │   ├── decline.ts             # Host: decline proposal
│   │   ├── counteroffer.ts        # Both: create counteroffer
│   │   ├── accept-counteroffer.ts # Both: accept counteroffer
│   │   └── suggest.ts             # System: AI suggestions
│   ├── workflows/
│   │   ├── accept-proposal.ts     # Multi-step accept workflow
│   │   └── counteroffer.ts        # Counteroffer workflow
│   └── deno.json
│
├── listings/                      # Domain: Listings (2 functions → 1)
│   ├── index.ts                   # Hono router
│   ├── actions/
│   │   ├── create.ts              # Host: create listing
│   │   ├── get.ts                 # Public: get listing
│   │   ├── update.ts              # Host: update listing
│   │   ├── submit.ts              # Host: submit for review
│   │   ├── delete.ts              # Host: delete listing
│   │   └── search.ts              # Guest: search listings
│   └── deno.json
│
├── leases/                        # Domain: Leases (3 functions → 1)
│   ├── index.ts                   # Hono router
│   ├── actions/
│   │   ├── create.ts              # System: create from accepted proposal
│   │   ├── get.ts                 # Both: get lease details
│   │   ├── sign.ts                # Both: sign lease
│   │   ├── generate-documents.ts  # System: generate lease docs
│   │   └── date-change.ts         # Both: request date change
│   ├── workflows/
│   │   └── lease-creation.ts      # Multi-step lease workflow
│   └── deno.json
│
├── communications/                # Domain: Messaging + Notifications (12 functions → 1)
│   ├── index.ts                   # Hono router
│   ├── actions/
│   │   ├── send-message.ts        # Both: send message
│   │   ├── get-messages.ts        # Both: get messages
│   │   ├── get-threads.ts         # Both: get threads
│   │   ├── send-email.ts          # System: send email
│   │   ├── send-sms.ts            # System: send SMS
│   │   ├── guest-inquiry.ts       # Guest: send inquiry
│   │   └── notification.ts        # System: push notification
│   ├── cron/
│   │   ├── date-change-reminder.ts
│   │   └── reminder-scheduler.ts
│   └── deno.json
│
├── ai/                            # Domain: AI Services (7 functions → 1)
│   ├── index.ts                   # Hono router
│   ├── actions/
│   │   ├── complete.ts            # Generic completion
│   │   ├── stream.ts              # Streaming completion
│   │   ├── parse-profile.ts       # Parse signup profile
│   │   ├── room-redesign.ts       # Room redesign tool
│   │   └── query.ts               # General query (Leo)
│   ├── prompts/                   # (existing prompt registry)
│   └── deno.json
│
├── admin/                         # Domain: Admin Operations (13 functions → 1)
│   ├── index.ts                   # Hono router
│   ├── actions/
│   │   ├── pricing.ts
│   │   ├── qr-codes.ts
│   │   ├── quick-match.ts
│   │   ├── house-manual.ts
│   │   ├── usability-data.ts
│   │   └── backfill.ts
│   └── deno.json
│
├── integrations/                  # Domain: External Integrations (4 functions → 1)
│   ├── index.ts                   # Hono router
│   ├── actions/
│   │   ├── bubble-sync.ts         # Bubble.io sync
│   │   ├── slack.ts               # Slack webhooks
│   │   └── cohost-callback.ts     # Slack callback handler
│   └── deno.json
│
└── simulation/                    # Keep separate (testing-only)
    ├── index.ts                   # Hono router with role-based routes
    ├── host/                      # Host simulation actions
    ├── guest/                     # Guest simulation actions
    └── admin/                     # Admin simulation actions
```

---

## Middleware Implementation

### Role Types

```typescript
// _shared/permissions/types.ts

export type Role = 'host' | 'guest' | 'admin' | 'system' | 'public';

export interface PermissionConfig {
  [action: string]: {
    allowedRoles: Role[];
    requireAuth?: boolean;           // Default: true
    resourceCheck?: string;          // e.g., 'proposal' for ownership check
  };
}

export interface AuthContext {
  userId: string | null;
  role: Role;
  correlationId: string;
  resourceId?: string;
}
```

### Role Auth Middleware

```typescript
// _shared/middleware/role-auth.ts

import { MiddlewareHandler } from 'jsr:@hono/hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Role, PermissionConfig, AuthContext } from '../permissions/types.ts';

export function requireRole(permissions: PermissionConfig): MiddlewareHandler {
  return async (c, next) => {
    const action = c.req.param('action') || extractAction(c.req.path);
    const config = permissions[action];

    if (!config) {
      return c.json({ success: false, error: 'Unknown action' }, 404);
    }

    // Skip auth for public endpoints
    if (config.allowedRoles.includes('public')) {
      c.set('auth', { userId: null, role: 'public', correlationId: c.get('correlationId') });
      return next();
    }

    // Extract user from JWT
    const authHeader = c.req.header('Authorization');
    if (!authHeader && config.requireAuth !== false) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }

    // Determine role for this resource
    const body = await c.req.json().catch(() => ({}));
    const role = await determineRole(supabase, user.id, body, config.resourceCheck);

    if (!config.allowedRoles.includes(role)) {
      return c.json({ success: false, error: 'Insufficient permissions' }, 403);
    }

    const authContext: AuthContext = {
      userId: user.id,
      role,
      correlationId: c.get('correlationId'),
      resourceId: body.proposalId || body.listingId || body.leaseId
    };

    c.set('auth', authContext);
    await next();
  };
}

async function determineRole(
  supabase: any,
  userId: string,
  body: any,
  resourceCheck?: string
): Promise<Role> {
  // Admin check first
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (profile?.is_admin) return 'admin';

  // Resource-specific role determination
  if (resourceCheck === 'proposal' && body.proposalId) {
    const { data: proposal } = await supabase
      .from('proposals')
      .select('guest_id, property:properties!property_id(host_id)')
      .eq('id', body.proposalId)
      .single();

    if (proposal?.guest_id === userId) return 'guest';
    if (proposal?.property?.host_id === userId) return 'host';
  }

  if (resourceCheck === 'listing' && body.listingId) {
    const { data: listing } = await supabase
      .from('listings')
      .select('host_id')
      .eq('id', body.listingId)
      .single();

    if (listing?.host_id === userId) return 'host';
    return 'guest'; // Non-owner viewing = guest
  }

  // Default to guest for authenticated users
  return 'guest';
}

function extractAction(path: string): string {
  // /proposals/accept → accept
  const segments = path.split('/').filter(Boolean);
  return segments[segments.length - 1];
}
```

### Correlation ID Middleware

```typescript
// _shared/middleware/correlation.ts

import { MiddlewareHandler } from 'jsr:@hono/hono';

export const correlationMiddleware: MiddlewareHandler = async (c, next) => {
  const correlationId = c.req.header('x-correlation-id') || crypto.randomUUID();
  c.set('correlationId', correlationId);
  c.header('x-correlation-id', correlationId);

  console.log(JSON.stringify({
    correlation_id: correlationId,
    event: 'request_start',
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString()
  }));

  await next();

  console.log(JSON.stringify({
    correlation_id: correlationId,
    event: 'request_end',
    status: c.res.status,
    timestamp: new Date().toISOString()
  }));
};
```

### Error Boundary Middleware

```typescript
// _shared/middleware/error-boundary.ts

import { MiddlewareHandler } from 'jsr:@hono/hono';
import { reportToSlack } from '../slack.ts';

export const errorBoundaryMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (error) {
    const correlationId = c.get('correlationId') || 'unknown';

    console.error(JSON.stringify({
      correlation_id: correlationId,
      event: 'unhandled_error',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));

    await reportToSlack({
      type: 'error',
      function: c.req.path,
      message: error.message,
      correlationId
    });

    return c.json({
      success: false,
      error: 'Internal server error',
      correlationId
    }, 500);
  }
};
```

---

## Permission Configurations

### Proposal Permissions

```typescript
// _shared/permissions/proposal-permissions.ts

import { PermissionConfig } from './types.ts';

export const proposalPermissions: PermissionConfig = {
  'create':              { allowedRoles: ['guest'], resourceCheck: undefined },
  'get':                 { allowedRoles: ['host', 'guest', 'admin'], resourceCheck: 'proposal' },
  'get-for-host':        { allowedRoles: ['host', 'admin'], resourceCheck: 'proposal' },
  'get-for-guest':       { allowedRoles: ['guest', 'admin'], resourceCheck: 'proposal' },
  'accept':              { allowedRoles: ['host'], resourceCheck: 'proposal' },
  'decline':             { allowedRoles: ['host'], resourceCheck: 'proposal' },
  'counteroffer':        { allowedRoles: ['host', 'guest'], resourceCheck: 'proposal' },
  'accept-counteroffer': { allowedRoles: ['host', 'guest'], resourceCheck: 'proposal' },
  'suggest':             { allowedRoles: ['system', 'admin'], requireAuth: false },
  'health':              { allowedRoles: ['public'], requireAuth: false },
};
```

### Listing Permissions

```typescript
// _shared/permissions/listing-permissions.ts

import { PermissionConfig } from './types.ts';

export const listingPermissions: PermissionConfig = {
  'create':  { allowedRoles: ['host'] },
  'get':     { allowedRoles: ['public'], requireAuth: false },
  'update':  { allowedRoles: ['host'], resourceCheck: 'listing' },
  'submit':  { allowedRoles: ['host'], resourceCheck: 'listing' },
  'delete':  { allowedRoles: ['host', 'admin'], resourceCheck: 'listing' },
  'search':  { allowedRoles: ['public'], requireAuth: false },
  'health':  { allowedRoles: ['public'], requireAuth: false },
};
```

### Lease Permissions

```typescript
// _shared/permissions/lease-permissions.ts

import { PermissionConfig } from './types.ts';

export const leasePermissions: PermissionConfig = {
  'create':             { allowedRoles: ['system'], requireAuth: false },
  'get':                { allowedRoles: ['host', 'guest', 'admin'], resourceCheck: 'lease' },
  'sign':               { allowedRoles: ['host', 'guest'], resourceCheck: 'lease' },
  'generate-documents': { allowedRoles: ['system', 'admin'], requireAuth: false },
  'date-change':        { allowedRoles: ['host', 'guest'], resourceCheck: 'lease' },
  'health':             { allowedRoles: ['public'], requireAuth: false },
};
```

---

## Domain Orchestrator Template

### Proposals Orchestrator

```typescript
// proposals/index.ts

import { Hono } from 'jsr:@hono/hono';
import { cors } from 'jsr:@hono/hono/cors';
import { correlationMiddleware } from '../_shared/middleware/correlation.ts';
import { errorBoundaryMiddleware } from '../_shared/middleware/error-boundary.ts';
import { requireRole } from '../_shared/middleware/role-auth.ts';
import { proposalPermissions } from '../_shared/permissions/proposal-permissions.ts';

// Import actions
import { createProposal } from './actions/create.ts';
import { getProposal } from './actions/get.ts';
import { getForHost } from './actions/get-for-host.ts';
import { getForGuest } from './actions/get-for-guest.ts';
import { acceptProposal } from './actions/accept.ts';
import { declineProposal } from './actions/decline.ts';
import { createCounteroffer } from './actions/counteroffer.ts';
import { acceptCounteroffer } from './actions/accept-counteroffer.ts';
import { suggestProposal } from './actions/suggest.ts';

const app = new Hono();

// Global middleware
app.use('/*', cors());
app.use('/*', correlationMiddleware);
app.use('/*', errorBoundaryMiddleware);
app.use('/*', requireRole(proposalPermissions));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', domain: 'proposals' }));

// Action routes
app.post('/create', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createProposal({ ...body, userId: auth.userId });
  return result.ok
    ? c.json({ success: true, data: result.value })
    : c.json({ success: false, error: result.error.message }, 400);
});

app.post('/get', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await getProposal({ proposalId: body.proposalId, userId: auth.userId });
  return result.ok
    ? c.json({ success: true, data: result.value })
    : c.json({ success: false, error: result.error.message }, 400);
});

app.post('/get-for-host', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await getForHost({ proposalId: body.proposalId, hostId: auth.userId });
  return result.ok
    ? c.json({ success: true, data: result.value })
    : c.json({ success: false, error: result.error.message }, 400);
});

app.post('/get-for-guest', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await getForGuest({ proposalId: body.proposalId, guestId: auth.userId });
  return result.ok
    ? c.json({ success: true, data: result.value })
    : c.json({ success: false, error: result.error.message }, 400);
});

app.post('/accept', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await acceptProposal({
    proposalId: body.proposalId,
    hostId: auth.userId,
    terms: body.terms
  });
  return result.ok
    ? c.json({ success: true, data: result.value })
    : c.json({ success: false, error: result.error.message }, 400);
});

app.post('/decline', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await declineProposal({
    proposalId: body.proposalId,
    hostId: auth.userId,
    reason: body.reason
  });
  return result.ok
    ? c.json({ success: true, data: result.value })
    : c.json({ success: false, error: result.error.message }, 400);
});

app.post('/counteroffer', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createCounteroffer({
    proposalId: body.proposalId,
    userId: auth.userId,
    role: auth.role,
    terms: body.terms
  });
  return result.ok
    ? c.json({ success: true, data: result.value })
    : c.json({ success: false, error: result.error.message }, 400);
});

app.post('/accept-counteroffer', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await acceptCounteroffer({
    proposalId: body.proposalId,
    counterofferId: body.counterofferId,
    userId: auth.userId
  });
  return result.ok
    ? c.json({ success: true, data: result.value })
    : c.json({ success: false, error: result.error.message }, 400);
});

app.post('/suggest', async (c) => {
  const body = await c.req.json();
  const result = await suggestProposal(body);
  return result.ok
    ? c.json({ success: true, data: result.value })
    : c.json({ success: false, error: result.error.message }, 400);
});

// Legacy action-based routing (backward compatibility)
app.post('/', async (c) => {
  const { action, payload } = await c.req.json();

  // Redirect to new route
  const response = await app.request(`/${action}`, {
    method: 'POST',
    headers: c.req.raw.headers,
    body: JSON.stringify(payload)
  });

  return response;
});

Deno.serve(app.fetch);
```

---

## Migration Plan

### Phase 1: Foundation (Week 1)

**Tasks:**
1. Create `_shared/middleware/` directory with all middleware files
2. Create `_shared/permissions/` directory with permission configs
3. Add correlation ID to existing functions (non-breaking)
4. Test middleware in isolation

**Files to Create:**
- `_shared/middleware/role-auth.ts`
- `_shared/middleware/correlation.ts`
- `_shared/middleware/error-boundary.ts`
- `_shared/permissions/types.ts`
- `_shared/permissions/proposal-permissions.ts`
- `_shared/permissions/listing-permissions.ts`
- `_shared/permissions/lease-permissions.ts`
- `_shared/permissions/message-permissions.ts`

### Phase 2: Proposals Domain (Week 2)

**Tasks:**
1. Create `proposals/` domain orchestrator
2. Extract existing `proposal/` actions into `proposals/actions/`
3. Implement Hono routing with middleware
4. Add backward-compatible legacy route
5. Test all proposal operations

**Consolidates:**
- `proposal/` → `proposals/`
- Host/guest proposal views → `proposals/actions/get-for-host.ts`, `get-for-guest.ts`

### Phase 3: Auth & Listings Domains (Week 3)

**Tasks:**
1. Create `auth/` domain orchestrator
2. Consolidate: `auth-user/`, `magic-login-links/`, `verify-users/`, `identity-verification/`
3. Create `listings/` domain orchestrator
4. Consolidate: `listing/`, search functionality

### Phase 4: Leases & Communications Domains (Week 4)

**Tasks:**
1. Create `leases/` domain orchestrator
2. Consolidate: `lease/`, `lease-documents/`, `date-change-*`
3. Create `communications/` domain orchestrator
4. Consolidate: `messages/`, `send-email/`, `send-sms/`, `virtual-meeting/`, etc.

### Phase 5: AI & Admin Domains (Week 5)

**Tasks:**
1. Create `ai/` domain orchestrator
2. Consolidate: `ai-gateway/`, `ai-*`, `query-leo/`
3. Create `admin/` domain orchestrator
4. Consolidate: `pricing-*`, `qr-*`, `house-manual/`, etc.

### Phase 6: Integration & Cleanup (Week 6)

**Tasks:**
1. Create `integrations/` domain orchestrator
2. Update frontend to use new endpoints (with fallback)
3. Remove deprecated individual functions
4. Update CI/CD to deploy 6 functions instead of 57

---

## Feature Flag Rollout

```typescript
// Frontend: Check feature flag before calling
const useNewOrchestrator = await getFeatureFlag('new_domain_orchestrator');

if (useNewOrchestrator) {
  await supabase.functions.invoke('proposals/accept', { body: payload });
} else {
  await supabase.functions.invoke('proposal', { body: { action: 'acceptProposal', payload } });
}
```

---

## Monitoring & Observability

### Dashboard Query

```sql
-- Workflow dashboard for Supabase Studio
CREATE VIEW edge_function_metrics AS
SELECT
  split_part(path, '/', 2) as domain,
  split_part(path, '/', 3) as action,
  count(*) as invocations,
  avg(duration_ms) as avg_duration,
  count(*) FILTER (WHERE status >= 400) as errors,
  count(*) FILTER (WHERE status >= 400)::float / count(*) as error_rate
FROM edge_function_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY domain, action
ORDER BY invocations DESC;
```

### Alerting

```sql
-- Alert on high error rates
SELECT cron.schedule('alert-domain-errors', '*/5 * * * *', $$
  INSERT INTO alerts (type, severity, message)
  SELECT
    'domain_error_rate',
    'warning',
    domain || ' has ' || error_rate || '% error rate'
  FROM edge_function_metrics
  WHERE error_rate > 0.05  -- 5% threshold
$$);
```

---

## Expected Outcomes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Deployment targets | 57 | 6 | 89% reduction |
| Cold start (3-step workflow) | 375-1200ms | 125-400ms | 67% faster |
| Permission logic locations | 57 files | 4 config files | Centralized |
| Code duplication | High (CORS, auth in each) | Zero (middleware) | Eliminated |
| Workflow durability | None | pgflow-backed | Full durability |

---

## Files Referenced

### Existing (To Keep/Modify)
- [supabase/functions/_shared/](supabase/functions/_shared/) - Shared utilities
- [supabase/functions/proposal/](supabase/functions/proposal/) - Proposal function
- [supabase/functions/listing/](supabase/functions/listing/) - Listing function
- [supabase/functions/auth-user/](supabase/functions/auth-user/) - Auth function
- [supabase/functions/messages/](supabase/functions/messages/) - Messages function
- [supabase/functions/ai-gateway/](supabase/functions/ai-gateway/) - AI gateway

### New (To Create)
- `_shared/middleware/role-auth.ts`
- `_shared/middleware/correlation.ts`
- `_shared/middleware/error-boundary.ts`
- `_shared/permissions/types.ts`
- `_shared/permissions/proposal-permissions.ts`
- `_shared/permissions/listing-permissions.ts`
- `_shared/permissions/lease-permissions.ts`
- `proposals/index.ts` (domain orchestrator)
- `listings/index.ts` (domain orchestrator)
- `leases/index.ts` (domain orchestrator)
- `auth/index.ts` (domain orchestrator)
- `communications/index.ts` (domain orchestrator)
- `ai/index.ts` (domain orchestrator)
- `admin/index.ts` (domain orchestrator)
- `integrations/index.ts` (domain orchestrator)
