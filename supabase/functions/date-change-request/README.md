# Date Change Request Edge Function

Handles the full lifecycle of date change requests between hosts and guests on a lease, including creation, approval, decline, cancellation, and throttle management.

## Overview

This Edge Function manages date change requests with a **two-tier throttling system** to prevent spam:

| Threshold | Level | Behavior |
|-----------|-------|----------|
| 5+ pending | Soft Warning | Shows warning popup to user |
| 10+ pending | Hard Block | Blocks ability to create requests |

## Architecture

- **Runtime**: Deno 2 (Supabase Edge Functions)
- **Pattern**: Functional Programming (FP) - pure functions, immutable data, fail-fast
- **Auth**: Public (all actions currently public until Supabase auth migration completes)
- **Actions**: create, get, accept, decline, cancel, get_throttle_status, apply_hard_block, update_warning_preference

## API Endpoints

### POST /functions/v1/date-change-request

All requests use action-based routing:

```json
{
  "action": "action_name",
  "payload": { ... }
}
```

### Actions

#### 1. `create` - Create a new date change request

**Payload**:
```json
{
  "action": "create",
  "payload": {
    "leaseId": "lease-123",
    "requestedById": "user-456",
    "receiverId": "user-789",
    "typeOfRequest": "adding",
    "dateAdded": "2026-03-15",
    "message": "Can I add this night?",
    "priceRate": 150,
    "percentageOfRegular": 85
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "requestId": "dcr-abc123",
    "leaseId": "lease-123",
    "createdAt": "2026-02-12T10:30:00.000Z"
  }
}
```

#### 2. `get` - Get date change requests for a lease

**Payload**:
```json
{
  "action": "get",
  "payload": {
    "leaseId": "lease-123"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "dcr-abc123",
        "Lease": "lease-123",
        "Requested by": "user-456",
        "Request receiver": "user-789",
        "type of request": "adding",
        "date added": "2026-03-15",
        "request status": "waiting_for_answer",
        "expiration date": "2026-02-14T10:30:00.000Z",
        "requester": { "id": "user-456", "first_name": "Alice", "profile_photo_url": null },
        "receiver": { "id": "user-789", "first_name": "Bob", "profile_photo_url": null }
      }
    ]
  }
}
```

#### 3. `accept` - Accept a date change request

**Payload**:
```json
{
  "action": "accept",
  "payload": {
    "requestId": "dcr-abc123",
    "message": "Sounds good!"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "requestId": "dcr-abc123",
    "status": "Approved",
    "answeredAt": "2026-02-12T12:00:00.000Z"
  }
}
```

#### 4. `decline` - Decline a date change request

**Payload**:
```json
{
  "action": "decline",
  "payload": {
    "requestId": "dcr-abc123",
    "reason": "Date conflicts with another booking"
  }
}
```

#### 5. `cancel` - Cancel own request

**Payload**:
```json
{
  "action": "cancel",
  "payload": {
    "requestId": "dcr-abc123"
  }
}
```

#### 6. `get_throttle_status` - Check throttle status

**Payload**:
```json
{
  "action": "get_throttle_status",
  "payload": {
    "userId": "user-456",
    "leaseId": "lease-123"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pendingRequestCount": 3,
    "throttleLevel": "none",
    "isBlocked": false,
    "showWarning": false,
    "otherParticipantName": "Bob",
    "blockedUntil": null,
    "requestCount": 3,
    "limit": 5,
    "isThrottled": false,
    "windowResetTime": "2026-02-13T10:30:00.000Z"
  }
}
```

#### 7. `apply_hard_block` - Block user's request creation ability

**Payload**:
```json
{
  "action": "apply_hard_block",
  "payload": {
    "leaseId": "lease-123",
    "userId": "user-456"
  }
}
```

#### 8. `update_warning_preference` - Update "don't show warning" preference

**Payload**:
```json
{
  "action": "update_warning_preference",
  "payload": {
    "leaseId": "lease-123",
    "userId": "user-456",
    "dontShowAgain": true
  }
}
```

## Dependencies

- `_shared/errors.ts` - ValidationError, AuthenticationError
- `_shared/functional/result.ts` - Result type (ok/err)
- `_shared/functional/orchestration.ts` - FP request parsing, action routing
- `_shared/functional/errorLog.ts` - Immutable error log
- `_shared/slack.ts` - Error reporting to Slack

## Local Development

```bash
# Start local Supabase
supabase start

# Serve this function
supabase functions serve date-change-request

# Test create
curl -X POST http://localhost:54321/functions/v1/date-change-request \
  -H "Content-Type: application/json" \
  -d '{"action":"get","payload":{"leaseId":"lease-123"}}'
```

## File Structure

```
date-change-request/
├── index.ts              # Main router (FP orchestration)
├── handlers/
│   ├── create.ts         # Create new request
│   ├── get.ts            # Get requests for a lease
│   ├── accept.ts         # Accept a request
│   ├── decline.ts        # Decline a request
│   ├── cancel.ts         # Cancel own request
│   ├── getThrottleStatus.ts    # Throttle status check
│   ├── applyHardBlock.ts      # Apply hard block
│   ├── updateWarningPreference.ts  # Update warning preference
│   └── notifications.ts  # Notification sending
└── lib/
    ├── types.ts           # Type definitions
    └── validators.ts      # Input validation
```

## Critical Notes

- **Request types**: `adding`, `removing`, `swapping`
- **Request statuses**: `waiting_for_answer`, `Approved`, `Rejected`, `expired`, `cancelled`
- **Expiration**: Requests expire after 48 hours
- **Throttle window**: 24-hour rolling window for pending request count
- **Notifications**: Sends email/SMS/in-app notifications on create, accept, decline
- **No fallback logic** - Errors fail fast
- **Lease participant validation** - Only host/guest of a lease can create requests

---

**Version**: 1.0.0
**Date**: 2026-02-12
**Pattern**: Date Change Request Lifecycle
