# Edge Functions API Documentation Plan

**Task**: Generate comprehensive API documentation for all Supabase Edge Functions
**Token Estimate**: ~100K tokens (medium)
**Run Mode**: Background agent

---

## Scope Analysis

### Functions to Document (6 total)

| Function | Actions | Complexity | Priority |
|----------|---------|------------|----------|
| **proposal** | 11 actions | High (Bubble sync, soft auth) | P1 |
| **listing** | 4 actions | Medium (FP, dual backend) | P1 |
| **lease** | 5 actions | High (7-phase orchestration) | P1 |
| **messages** | 9 actions | Medium (dual auth, admin) | P2 |
| **auth-user** | 11 actions | High (all auth flows) | P1 |
| **ai-gateway** | 2 actions | Medium (prompt registry) | P2 |

---

## Output Structure

```
.claude/plans/Documents/api-documentation/
├── openapi/
│   ├── proposal.yaml           # OpenAPI 3.0 spec
│   ├── listing.yaml
│   ├── lease.yaml
│   ├── messages.yaml
│   ├── auth-user.yaml
│   ├── ai-gateway.yaml
│   └── combined.yaml           # Merged spec for all functions
├── schemas/
│   ├── request-schemas.md      # All request payload schemas
│   ├── response-schemas.md     # All response schemas
│   └── shared-types.md         # Common types (Result, Error, etc.)
├── guides/
│   ├── authentication.md       # Auth patterns guide
│   ├── error-handling.md       # Error codes & handling
│   └── action-patterns.md      # Action-based request patterns
└── README.md                   # Documentation index
```

---

## Deliverables by Phase

### Phase 1: OpenAPI Specs (6 files)

Each spec will include:
- Server configuration (dev/prod URLs)
- Security schemes (JWT Bearer, legacy user_id)
- Path definitions for each action
- Request body schemas with examples
- Response schemas (success/error)
- Error response codes

**Example structure per function**:
```yaml
openapi: 3.0.3
info:
  title: Split Lease Proposal API
  version: 1.0.0
servers:
  - url: https://dev-project.supabase.co/functions/v1
    description: Development
  - url: https://live-project.supabase.co/functions/v1
    description: Production
paths:
  /proposal:
    post:
      summary: Execute proposal action
      requestBody:
        content:
          application/json:
            schema:
              oneOf:
                - $ref: '#/components/schemas/CreateProposalRequest'
                - $ref: '#/components/schemas/UpdateProposalRequest'
                # ...more actions
```

### Phase 2: Request/Response Schemas (3 files)

**request-schemas.md**:
- Complete payload definitions for all 42 actions
- TypeScript interfaces
- Validation rules
- Required vs optional fields
- Default values

**response-schemas.md**:
- Success response structures
- Error response structures
- Nested data shapes
- Pagination patterns

**shared-types.md**:
- Result<T, E> type
- Error classes (ValidationError, AuthenticationError, etc.)
- CORS headers
- Common field types

### Phase 3: Guides (3 files)

**authentication.md**:
- JWT header pattern
- Legacy user_id fallback (messages only)
- Service role usage
- Public vs protected actions matrix
- Auth flow diagrams

**error-handling.md**:
- HTTP status code mapping
- Error code reference (23503, 23505, etc.)
- Slack logging patterns
- Correlation ID usage
- Client retry strategies

**action-patterns.md**:
- Universal `{ action, payload }` contract
- Lazy handler loading
- Routing logic
- Best practices for action naming

### Phase 4: Index & Combined Spec

**README.md**:
- Quick start guide
- Function overview table
- Common use cases
- Links to all specs/guides

**combined.yaml**:
- Single OpenAPI spec with all functions
- Useful for API documentation tools (Swagger UI, Redoc)

---

## Implementation Notes

### Source Files to Reference

```
supabase/functions/
├── proposal/index.ts           # Main router
├── proposal/handlers/actions/  # Action handlers
├── listing/index.ts
├── listing/handlers/
├── lease/index.ts
├── lease/handlers/
├── messages/index.ts
├── messages/handlers/
├── auth-user/index.ts
├── auth-user/handlers/
├── ai-gateway/index.ts
├── ai-gateway/prompts/
└── _shared/
    ├── cors.ts
    ├── errors.ts
    └── functional/
```

### Key Patterns to Document

1. **Action Routing**: All functions use `switch(action)` with lazy imports
2. **Auth Validation**: `extractAuthToken` → `auth.getUser()` → user table lookup
3. **Error Propagation**: FP Result types until boundary, then HTTP response
4. **CORS Handling**: Uniform headers, OPTIONS preflight
5. **Response Format**: `{ success, data?, error? }` contract

### Special Cases

- **proposal**: Soft auth (optional header, legacy token support)
- **messages**: Dual auth (JWT + user_id fallback)
- **auth-user**: No auth required (these ARE the auth endpoints)
- **ai-gateway**: Auth by prompt (PUBLIC_PROMPTS set)
- **lease**: 7-phase orchestration for create action

---

## Acceptance Criteria

- [ ] All 6 OpenAPI specs validate against OpenAPI 3.0 schema
- [ ] Every action has request/response examples
- [ ] Authentication requirements documented per action
- [ ] Error codes reference complete
- [ ] README provides clear navigation
- [ ] Combined spec works in Swagger UI

---

## Estimated Effort

| Phase | Deliverables | Tokens |
|-------|--------------|--------|
| Phase 1 | 6 OpenAPI specs | ~40K |
| Phase 2 | 3 schema docs | ~25K |
| Phase 3 | 3 guides | ~20K |
| Phase 4 | README + combined | ~15K |
| **Total** | **14 files** | **~100K** |

---

## Launch Command

```
Task tool → subagent_type: "general-purpose"
prompt: [detailed prompt below]
run_in_background: true
```

**Detailed Prompt**:
```
Generate comprehensive API documentation for Split Lease Supabase Edge Functions.

## Context
- 6 functions: proposal (11 actions), listing (4), lease (5), messages (9), auth-user (11), ai-gateway (2)
- All use action-based `{ action, payload }` request pattern
- FP architecture with Result types and immutable error logging
- Authentication varies: JWT header, legacy user_id, public, prompt-based

## Output Structure
Create files in: .claude/plans/Documents/api-documentation/

### OpenAPI Specs (openapi/ folder)
For each function, create YAML OpenAPI 3.0 spec:
- proposal.yaml, listing.yaml, lease.yaml, messages.yaml, auth-user.yaml, ai-gateway.yaml
- Include all actions with request/response schemas
- Add examples for each action
- Document auth requirements per action

### Schema Documentation (schemas/ folder)
- request-schemas.md: All 42 action payloads with TypeScript interfaces
- response-schemas.md: Success/error response structures
- shared-types.md: Result type, error classes, common types

### Guides (guides/ folder)
- authentication.md: JWT, legacy fallback, public actions matrix
- error-handling.md: HTTP codes, error classes, Slack logging
- action-patterns.md: Universal contract, routing, best practices

### Index
- README.md: Overview, quick start, links to all docs
- openapi/combined.yaml: Merged spec for documentation tools

## Source Files
Read from: supabase/functions/{function}/index.ts and handlers/
Reference: supabase/functions/_shared/ for common patterns

## Quality Requirements
- OpenAPI specs must validate
- Every action needs request/response examples
- Auth requirements per action clearly documented
- Error codes complete with HTTP status mapping
```
