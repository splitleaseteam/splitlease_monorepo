# Split Lease API Documentation

Comprehensive API documentation for Split Lease Supabase Edge Functions.

---

## Quick Start

### Base URL

```
https://{project-ref}.supabase.co/functions/v1
```

### Request Format

All Edge Functions use an action-based request pattern:

```json
{
  "action": "action_name",
  "payload": {
    // Action-specific data
  }
}
```

### Example Request

```bash
curl -X POST https://xxx.supabase.co/functions/v1/proposal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "get",
    "payload": {
      "proposal_id": "1234567890123x0987654321"
    }
  }'
```

### Example Response

```json
{
  "success": true,
  "data": {
    "_id": "1234567890123x0987654321",
    "Status": "Pending",
    "Days Selected": [1, 2, 3],
    "Weeks Selected": [1, 2, 3, 4]
  }
}
```

---

## Documentation Index

### OpenAPI Specifications

Individual OpenAPI 3.0 specs for each Edge Function:

| Function | Actions | Spec File |
|----------|---------|-----------|
| [Proposal](#proposal-function) | 11 | [openapi/proposal.yaml](./openapi/proposal.yaml) |
| [Listing](#listing-function) | 4 | [openapi/listing.yaml](./openapi/listing.yaml) |
| [Lease](#lease-function) | 5 | [openapi/lease.yaml](./openapi/lease.yaml) |
| [Messages](#messages-function) | 9 | [openapi/messages.yaml](./openapi/messages.yaml) |
| [Auth User](#auth-user-function) | 11 | [openapi/auth-user.yaml](./openapi/auth-user.yaml) |
| [AI Gateway](#ai-gateway-function) | 2 | [openapi/ai-gateway.yaml](./openapi/ai-gateway.yaml) |

**Combined Spec**: [openapi/combined.yaml](./openapi/combined.yaml)

### Schema Documentation

TypeScript interfaces and type definitions:

| Document | Description |
|----------|-------------|
| [Request Schemas](./schemas/request-schemas.md) | All 42 action payloads with TypeScript interfaces |
| [Response Schemas](./schemas/response-schemas.md) | Success and error response structures |
| [Shared Types](./schemas/shared-types.md) | Result type, error classes, common types |

### Guides

Implementation guides and best practices:

| Guide | Description |
|-------|-------------|
| [Authentication](./guides/authentication.md) | JWT, legacy fallback, public actions matrix |
| [Error Handling](./guides/error-handling.md) | HTTP codes, error classes, Slack logging |
| [Action Patterns](./guides/action-patterns.md) | Universal contract, routing, best practices |

---

## Function Overview

### Proposal Function

**Endpoint**: `POST /functions/v1/proposal`

Handles rental proposals between guests and hosts.

| Action | Description | Auth |
|--------|-------------|------|
| `create` | Create new proposal | No |
| `update` | Update proposal fields | JWT |
| `get` | Get proposal details | No |
| `suggest` | AI-powered schedule suggestions | No |
| `create_suggested` | Create from AI suggestion | No |
| `create_mockup` | Create mockup proposal | No |
| `get_prefill_data` | Get form prefill data | No |
| `createTestProposal` | Create test proposal | No |
| `createTestRentalApplication` | Create test application | No |
| `acceptProposal` | Accept proposal | No |
| `createCounteroffer` | Create host counteroffer | No |
| `acceptCounteroffer` | Accept counteroffer | No |

### Listing Function

**Endpoint**: `POST /functions/v1/listing`

Manages property listings.

| Action | Description | Auth |
|--------|-------------|------|
| `create` | Create draft listing | No |
| `get` | Get listing details | No |
| `submit` | Submit listing for review | JWT |
| `delete` | Delete listing | No |

### Lease Function

**Endpoint**: `POST /functions/v1/lease`

Handles lease creation and management from accepted proposals.

| Action | Description | Auth |
|--------|-------------|------|
| `create` | Create lease from proposal | No |
| `get` | Get lease details | JWT |
| `generate_dates` | Generate stay dates | No |
| `get_host_leases` | Get host's leases | JWT |
| `get_guest_leases` | Get guest's leases | JWT |

### Messages Function

**Endpoint**: `POST /functions/v1/messages`

Real-time messaging between hosts and guests.

| Action | Description | Auth |
|--------|-------------|------|
| `send_message` | Send message | JWT/Legacy |
| `get_messages` | Get thread messages | JWT/Legacy |
| `get_threads` | Get user's threads | JWT/Legacy |
| `send_guest_inquiry` | Public inquiry | No |
| `create_proposal_thread` | Create proposal thread | No |
| `send_splitbot_message` | Send SplitBot message | No |
| `admin_get_all_threads` | Admin: list threads | No |
| `admin_delete_thread` | Admin: delete thread | No |
| `admin_send_reminder` | Admin: send reminder | No |

### Auth User Function

**Endpoint**: `POST /functions/v1/auth-user`

Authentication and user management.

| Action | Description | Auth |
|--------|-------------|------|
| `login` | Authenticate user | No |
| `signup` | Create new user | No |
| `logout` | Log out user | No |
| `validate` | Validate token | No |
| `request_password_reset` | Request reset email | No |
| `update_password` | Update password | No |
| `generate_magic_link` | Generate magic link | No |
| `oauth_signup` | OAuth signup | No |
| `oauth_login` | OAuth login | No |
| `send_magic_link_sms` | Send SMS magic link | No |
| `verify_email` | Verify email | No |

### AI Gateway Function

**Endpoint**: `POST /functions/v1/ai-gateway`

AI completion and streaming via OpenAI.

| Action | Description | Auth |
|--------|-------------|------|
| `complete` | Non-streaming completion | Prompt-based |
| `stream` | Streaming completion (SSE) | Prompt-based |

**Public Prompts** (no auth required):
- `listing-description`
- `listing-title`
- `neighborhood-description`
- `parse-call-transcription`
- `negotiation-summary-suggested`
- `negotiation-summary-counteroffer`
- `negotiation-summary-host`
- `echo-test`

**Protected Prompts** (JWT required):
- `deepfake-script`
- `narration-script`
- `jingle-lyrics`

---

## Authentication

### JWT Token (Primary)

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Legacy User ID (Fallback)

```json
{
  "action": "get_threads",
  "payload": {
    "user_id": "1234567890123x0987654321"
  }
}
```

See [Authentication Guide](./guides/authentication.md) for complete details.

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 400 | Validation Error |
| 401 | Authentication Required |
| 403 | Authorization Failed |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Rate Limited |
| 500 | Internal Error |
| 502 | Bubble API Error |
| 503 | Supabase/OpenAI Error |

See [Error Handling Guide](./guides/error-handling.md) for complete details.

---

## Day Indexing Convention

All day indices use JavaScript's 0-based standard:

| Day | Index |
|-----|-------|
| Sunday | 0 |
| Monday | 1 |
| Tuesday | 2 |
| Wednesday | 3 |
| Thursday | 4 |
| Friday | 5 |
| Saturday | 6 |

---

## ID Format

Split Lease uses Bubble-style IDs:

```
1234567890123x0987654321
└───┬────────┘ └───┬────┘
  timestamp    random
```

Generated via `generate_bubble_id()` RPC function.

---

## Local Development

### Start Edge Functions

```bash
# Serve all functions locally
supabase functions serve

# Serve specific function
supabase functions serve proposal
```

### Test Locally

```bash
curl -X POST http://localhost:54321/functions/v1/proposal \
  -H "Content-Type: application/json" \
  -d '{"action": "get", "payload": {"proposal_id": "test123"}}'
```

### View Logs

```bash
# Real-time logs
supabase functions logs proposal --follow

# Recent logs
supabase functions logs proposal --limit 100
```

---

## Deployment

### Deploy All Functions

```bash
supabase functions deploy
```

### Deploy Specific Function

```bash
supabase functions deploy proposal
```

---

## Support

- **Slack Channel**: #edge-function-errors (error logs)
- **Documentation**: This directory
- **Source Code**: `supabase/functions/`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-02-02 | Initial documentation |
