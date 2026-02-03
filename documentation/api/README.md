# Split Lease API Documentation

**Version**: 1.0.0
**Last Updated**: 2026-01-29
**Architecture**: React 18 + Vite Islands | Supabase Edge Functions | Cloudflare Pages

---

## Overview

Split Lease provides a comprehensive RESTful API built on Supabase Edge Functions for managing rental marketplace operations. This documentation covers all API endpoints, database schema, authentication flows, and integration patterns.

### Key Architecture Principles

- **No Fallback Mechanisms**: All API calls fail fast without fallback logic
- **Action-Based Routing**: All Edge Functions use `{ action, payload }` request pattern
- **Atomic Operations**: Write-Read-Write pattern ensures data consistency
- **Queue-Based Sync**: Async operations via `sync_queue` table
- **Day Indexing**: JavaScript 0-based (Sun=0 to Sat=6) | Bubble 1-based (Sun=1 to Sat=7)

---

## Quick Links

- [Getting Started](#getting-started)
- [Authentication](authentication/README.md)
- [Edge Functions](edge-functions/README.md)
- [Database Schema](database/README.md)
- [Frontend API Clients](frontend-clients/README.md)
- [TypeScript Types](types/README.md)
- [Code Examples](examples/README.md)
- [OpenAPI Specifications](openapi/README.md)

---

## Getting Started

### Base URL

```
Production: https://splitlease-backend.supabase.co/functions/v1
Development: http://localhost:54321/functions/v1 (via supabase functions serve)
```

### Authentication

Most endpoints require authentication via Supabase Auth JWT:

```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/endpoint`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`,
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'action_name',
    payload: { /* data */ }
  })
});
```

### Request Format

All Edge Functions use the action-based routing pattern:

```typescript
interface EdgeFunctionRequest {
  action: string;
  payload: Record<string, any>;
}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "result_field1": "value1",
    "result_field2": "value2"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## API Categories

### Authentication & User Management

- **auth-user**: User authentication (login, signup, logout, password reset)
- **magic-login-links**: SMS magic link authentication
- **verify-users**: Identity verification workflows

### Proposal Management

- **proposal**: Proposal CRUD operations, counteroffers, acceptance
- **rental-application**: Rental application submissions
- **quick-match**: AI-powered proposal suggestions

### Listing Management

- **listing**: Listing CRUD operations
- **pricing**: Pricing calculations
- **pricing-list**: Dynamic pricing lists

### Messaging & Communication

- **messages**: Real-time messaging
- **message-curation**: AI message curation
- **send-email**: Email notifications
- **send-sms**: SMS notifications
- **slack**: Slack integrations

### Guest & Host Management

- **guest-management**: Guest profile management
- **cohost-request**: Co-host request workflows
- **co-host-requests**: Co-host operations
- **house-manual**: House manual management

### Payments & Financial

- **guest-payment-records**: Guest payment tracking
- **host-payment-records**: Host payment tracking

### Lease Management

- **lease**: Lease operations
- **leases-admin**: Administrative lease management
- **lease-documents**: Lease document generation
- **document**: Document management

### Reviews & Surveys

- **reviews-overview**: Review aggregation
- **experience-survey**: Experience survey collection

### AI & Automation

- **ai-gateway**: OpenAI proxy with prompt templating
- **ai-parse-profile**: AI profile parsing
- **ai-room-redesign**: AI room redesign
- **ai-signup-guest**: AI-powered guest signup
- **ai-tools**: AI utility functions
- **calendar-automation**: Calendar automation
- **reminder-scheduler**: Automated reminders

### Integrations & Sync

- **bubble_sync**: Bubble.io sync queue processor
- **workflow-orchestrator**: Workflow orchestration
- **workflow-enqueue**: Workflow queue management

### Utilities & Admin

- **qr-codes**: QR code generation
- **qr-generator**: QR code operations
- **pricing-admin**: Administrative pricing
- **simulation-admin**: Simulation management
- **usability-data-admin**: Usability testing data
- **emergency**: Emergency contact management
- **informational-texts**: CMS content
- **date-change-request**: Date change workflows
- **backfill-negotiation-summaries**: Data backfill operations
- **query-leo**: LEO integration
- **simulation-guest**: Guest simulation
- **simulation-host**: Host simulation

---

## Error Handling

### HTTP Status Codes

- **200**: Success
- **400**: Bad Request (validation error)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (database constraint violation)
- **500**: Internal Server Error

### Error Types

```typescript
class ValidationError extends Error {
  name: 'ValidationError';
  // Status: 400
}

class AuthenticationError extends Error {
  name: 'AuthenticationError';
  // Status: 401
}

class BubbleApiError extends Error {
  name: 'BubbleApiError';
  statusCode: number;
  // Status: Variable (typically 400-500)
}

class OpenAIError extends Error {
  name: 'OpenAIError';
  statusCode: number;
  // Status: Variable (typically 400-500)
}

class SupabaseSyncError extends Error {
  name: 'SupabaseSyncError';
  // Status: 500
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Detailed error message"
}
```

---

## Rate Limiting

Rate limiting is handled at the Edge Function level:

- **Anonymous requests**: 100 requests per minute
- **Authenticated requests**: 1000 requests per minute
- **Webhooks**: No rate limit

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1706544000
```

---

## Versioning

API versioning is handled via function names:

- **Current**: `v1` (implicit in all current endpoints)
- **Breaking changes**: New function names (e.g., `proposal-v2`)
- **Deprecated**: Functions marked with `@deprecated` in comments

---

## SDK & Libraries

### Official SDKs

- **JavaScript/TypeScript**: Supabase JS Client (v2+)
- **Deno**: Native Edge Functions support

### Community SDKs

None currently. Please use the REST API directly.

---

## Support & Resources

- **Documentation**: [Split Lease Docs](https://split.lease/help-center)
- **Issues**: [GitHub Issues](https://github.com/splitlease/splitlease/issues)
- **Email**: support@split.lease
- **Slack**: #engineering-internal

---

## Changelog

### Version 1.0.0 (2026-01-29)

- Initial API documentation release
- 50+ Edge Functions documented
- Database schema reference
- Authentication flow documentation
- OpenAPI specifications generated

---

**License**: Proprietary - Split Lease LLC
**Terms of Service**: https://split.lease/policies
