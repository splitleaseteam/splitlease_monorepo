# Action Patterns Guide

Complete guide to the action-based request pattern used across Split Lease Edge Functions.

---

## Table of Contents

- [Overview](#overview)
- [Universal Request Contract](#universal-request-contract)
- [Routing Pattern](#routing-pattern)
- [Best Practices](#best-practices)
- [Examples by Function](#examples-by-function)
- [Migration Guide](#migration-guide)

---

## Overview

All Split Lease Edge Functions use a unified action-based request pattern. Instead of multiple endpoints, each function exposes a single POST endpoint that routes internally based on the `action` field.

### Benefits

1. **Single endpoint** - One URL per domain (proposal, listing, lease, etc.)
2. **Type-safe routing** - Action field determines handler
3. **Consistent contract** - Same request/response structure everywhere
4. **Simplified CORS** - Only one endpoint to configure
5. **Easy versioning** - Add new actions without new endpoints

### Architecture

```
Client Request
     │
     ▼
┌─────────────────┐
│  Edge Function  │
│    (entry)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Parse Request  │────▶│  Validate JSON  │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Route by       │
│  Action Field   │
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│Action │ │Action │ │Action │ │Action │
│  A    │ │  B    │ │  C    │ │  D    │
└───────┘ └───────┘ └───────┘ └───────┘
```

---

## Universal Request Contract

### Request Structure

Every request to an Edge Function follows this structure:

```typescript
interface ActionRequest<A extends string, P> {
  action: A;        // Action identifier (string literal)
  payload: P;       // Action-specific payload
}
```

### Response Structure

All responses follow this structure:

```typescript
// Success
interface SuccessResponse<T> {
  success: true;
  data: T;
}

// Error
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}
```

### HTTP Details

| Aspect | Value |
|--------|-------|
| **Method** | `POST` |
| **Content-Type** | `application/json` |
| **Authorization** | `Bearer {token}` (when required) |
| **Response** | `application/json` or `text/event-stream` (streaming) |

---

## Routing Pattern

### Basic Router Implementation

```typescript
// Entry point (index.ts)
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { ValidationError } from "../_shared/errors.ts";

// Define valid actions
type ProposalAction =
  | "create"
  | "update"
  | "get"
  | "suggest"
  | "acceptProposal";

// Handler type
type ActionHandler = (
  request: Request,
  payload: unknown
) => Promise<Response>;

// Handler registry
const handlers: Record<ProposalAction, () => Promise<{ handler: ActionHandler }>> = {
  create: () => import("./actions/create.ts"),
  update: () => import("./actions/update.ts"),
  get: () => import("./actions/get.ts"),
  suggest: () => import("./actions/suggest.ts"),
  acceptProposal: () => import("./actions/acceptProposal.ts"),
};

// Main entry
Deno.serve(async (request: Request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return handleCors();
  }

  try {
    // Parse request body
    const body = await request.json();
    const { action, payload } = body;

    // Validate action
    if (!action || typeof action !== "string") {
      return new ValidationError("Missing action field").toResponse();
    }

    // Check if action exists
    if (!(action in handlers)) {
      return new ValidationError(`Unknown action: ${action}`).toResponse();
    }

    // Dynamic import handler
    const { handler } = await handlers[action as ProposalAction]();

    // Execute handler
    return await handler(request, payload);

  } catch (error) {
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return new ValidationError("Invalid JSON").toResponse();
    }
    throw error;
  }
});
```

### Handler Implementation

```typescript
// actions/create.ts
import { Result, ok, err } from "../../_shared/functional/result.ts";
import { ValidationError } from "../../_shared/errors.ts";

interface CreateProposalPayload {
  listing_id: string;
  days_selected: number[];
  weeks_selected: number[];
  proposed_start_date: string;
  proposed_end_date: string;
}

// Validation
function validatePayload(payload: unknown): Result<CreateProposalPayload, ValidationError> {
  if (!payload || typeof payload !== "object") {
    return err(new ValidationError("Invalid payload"));
  }

  const p = payload as Record<string, unknown>;

  if (!p.listing_id || typeof p.listing_id !== "string") {
    return err(new ValidationError("Missing required field: listing_id"));
  }

  if (!Array.isArray(p.days_selected)) {
    return err(new ValidationError("Missing required field: days_selected"));
  }

  // ... more validation

  return ok(p as CreateProposalPayload);
}

// Handler export
export async function handler(
  request: Request,
  payload: unknown
): Promise<Response> {
  // Validate
  const validationResult = validatePayload(payload);
  if (!validationResult.ok) {
    return validationResult.error.toResponse();
  }

  const validPayload = validationResult.value;

  // Execute business logic
  const result = await createProposal(validPayload);

  if (!result.ok) {
    return result.error.toResponse();
  }

  // Return success
  return new Response(
    JSON.stringify({ success: true, data: result.value }),
    { headers: { "Content-Type": "application/json" } }
  );
}
```

### FP-Style Router (Listing Function Pattern)

```typescript
// Functional pattern with handler map
import { Result, ok, err } from "../_shared/functional/result.ts";

type ListingAction = "create" | "get" | "submit" | "delete";

interface ActionContext {
  request: Request;
  payload: unknown;
}

type ActionHandler = (ctx: ActionContext) => Promise<Result<unknown, Error>>;

const actionHandlers: Record<ListingAction, ActionHandler> = {
  create: handleCreate,
  get: handleGet,
  submit: handleSubmit,
  delete: handleDelete,
};

async function routeAction(
  action: string,
  ctx: ActionContext
): Promise<Result<unknown, Error>> {
  const handler = actionHandlers[action as ListingAction];

  if (!handler) {
    return err(new ValidationError(`Unknown action: ${action}`));
  }

  return handler(ctx);
}

// Entry point
Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return handleCors();
  }

  const body = await request.json();
  const { action, payload } = body;

  const result = await routeAction(action, { request, payload });

  if (!result.ok) {
    return result.error instanceof SplitLeaseError
      ? result.error.toResponse()
      : new InternalError(result.error.message).toResponse();
  }

  return new Response(
    JSON.stringify({ success: true, data: result.value }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

---

## Best Practices

### 1. Action Naming Conventions

```typescript
// Use snake_case for multi-word actions
"get_host_leases"    // ✓ Good
"getHostLeases"      // ✗ Avoid (camelCase)
"GetHostLeases"      // ✗ Avoid (PascalCase)

// Use verb-first for mutations
"create_proposal"    // ✓ Good
"proposal_create"    // ✗ Avoid

// Use simple verbs for CRUD
"create"             // Create new resource
"get"                // Read resource
"update"             // Modify resource
"delete"             // Remove resource

// Use descriptive names for complex actions
"accept_proposal"
"create_counteroffer"
"generate_dates"
```

### 2. Payload Validation

```typescript
// Always validate at the start of handler
export async function handler(request: Request, payload: unknown): Promise<Response> {
  // 1. Type guard
  if (!payload || typeof payload !== "object") {
    return new ValidationError("Payload must be an object").toResponse();
  }

  // 2. Required fields
  const { listing_id, days_selected } = payload as Record<string, unknown>;

  if (!listing_id) {
    return new ValidationError("Missing required field: listing_id").toResponse();
  }

  // 3. Type checks
  if (typeof listing_id !== "string") {
    return new ValidationError("listing_id must be a string").toResponse();
  }

  // 4. Format validation
  if (!Array.isArray(days_selected) || !days_selected.every(d => typeof d === "number")) {
    return new ValidationError("days_selected must be an array of numbers").toResponse();
  }

  // 5. Business rule validation
  if (days_selected.some(d => d < 0 || d > 6)) {
    return new ValidationError("days_selected values must be 0-6").toResponse();
  }
}
```

### 3. Authentication Checks

```typescript
// Define which actions require auth
const AUTH_REQUIRED_ACTIONS = new Set([
  "update",
  "get_host_leases",
  "get_guest_leases"
]);

// Check in router
Deno.serve(async (request: Request) => {
  const { action, payload } = await request.json();

  if (AUTH_REQUIRED_ACTIONS.has(action)) {
    const authResult = await authenticateRequest(request);
    if (!authResult.ok) {
      return authResult.error.toResponse();
    }
    // Pass auth context to handler
    return await handlers[action](request, payload, authResult.value);
  }

  return await handlers[action](request, payload);
});
```

### 4. Consistent Response Format

```typescript
// Helper for success responses
function successResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// Helper for created responses
function createdResponse<T>(data: T): Response {
  return successResponse(data, 201);
}

// Use in handlers
return successResponse({
  proposal_id: newProposal.id,
  status: "Pending",
  created_at: new Date().toISOString()
});
```

### 5. Error Handling

```typescript
// Wrap handlers in try-catch
async function safeHandler(
  handler: ActionHandler
): Promise<(request: Request, payload: unknown) => Promise<Response>> {
  return async (request, payload) => {
    try {
      return await handler(request, payload);
    } catch (error) {
      // Log to Slack
      await logErrorToSlack({
        error,
        request: { url: request.url, method: request.method }
      });

      // Return appropriate error response
      if (error instanceof SplitLeaseError) {
        return error.toResponse();
      }

      return new InternalError("An unexpected error occurred").toResponse();
    }
  };
}
```

---

## Examples by Function

### Proposal Function

```typescript
// Create proposal
fetch("/functions/v1/proposal", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "create",
    payload: {
      listing_id: "1234567890123x0987654321",
      days_selected: [1, 2, 3],
      weeks_selected: [1, 2, 3, 4],
      proposed_start_date: "2025-03-01",
      proposed_end_date: "2025-06-30"
    }
  })
});

// Get proposal
fetch("/functions/v1/proposal", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "get",
    payload: { proposal_id: "1234567890123x0987654321" }
  })
});

// Accept proposal (with auth)
fetch("/functions/v1/proposal", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    action: "acceptProposal",
    payload: {
      proposal_id: "1234567890123x0987654321",
      four_week_rent: 2000,
      four_week_compensation: 1800
    }
  })
});
```

### Messages Function

```typescript
// Send message (with auth)
fetch("/functions/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    action: "send_message",
    payload: {
      thread_id: "1234567890123x0987654321",
      message_body: "Hello, I'm interested in your listing!"
    }
  })
});

// Guest inquiry (public)
fetch("/functions/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "send_guest_inquiry",
    payload: {
      guest_name: "John Doe",
      guest_email: "john@example.com",
      listing_id: "1234567890123x0987654321",
      message: "I'd like more info about this listing"
    }
  })
});
```

### AI Gateway Function

```typescript
// Complete (non-streaming)
fetch("/functions/v1/ai-gateway", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "complete",
    payload: {
      prompt_key: "listing-description",
      variables: {
        neighborhood: "Brooklyn Heights",
        amenities: ["WiFi", "Air Conditioning"],
        beds: 2,
        bathrooms: 1
      }
    }
  })
});

// Stream (SSE)
const response = await fetch("/functions/v1/ai-gateway", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "stream",
    payload: {
      prompt_key: "listing-description",
      variables: { neighborhood: "Brooklyn Heights" }
    }
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Process SSE chunks
  console.log(chunk);
}
```

---

## Migration Guide

### From REST to Action-Based

**Before (REST):**
```
POST /api/proposals         → Create
GET  /api/proposals/:id     → Read
PUT  /api/proposals/:id     → Update
DELETE /api/proposals/:id   → Delete
```

**After (Action-Based):**
```
POST /functions/v1/proposal { action: "create", payload: {...} }
POST /functions/v1/proposal { action: "get", payload: { proposal_id: "..." } }
POST /functions/v1/proposal { action: "update", payload: { proposal_id: "...", ... } }
POST /functions/v1/proposal { action: "delete", payload: { proposal_id: "..." } }
```

### Client Migration

```typescript
// Before
async function getProposal(id: string) {
  return fetch(`/api/proposals/${id}`);
}

// After
async function getProposal(id: string) {
  return fetch("/functions/v1/proposal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "get",
      payload: { proposal_id: id }
    })
  });
}
```

### API Client Wrapper

```typescript
class EdgeFunctionClient {
  constructor(private baseUrl: string) {}

  async call<T>(
    functionName: string,
    action: string,
    payload: unknown,
    token?: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/${functionName}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action, payload })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    return data.data as T;
  }
}

// Usage
const client = new EdgeFunctionClient("https://xxx.supabase.co/functions/v1");

const proposal = await client.call<ProposalData>(
  "proposal",
  "get",
  { proposal_id: "123" }
);
```
