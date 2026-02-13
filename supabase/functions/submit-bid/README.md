# Submit Bid Edge Function

Competitive bidding system for Split Lease sessions (Pattern 4: BS+BS Competitive Bidding). Handles bid submission, session creation, and bid history retrieval.

## Overview

This Edge Function implements **Pattern 4: BS+BS Competitive Bidding**, allowing participants to compete for booking priority on a target night through a round-based bidding system.

## Architecture

- **Runtime**: Deno 2 (Supabase Edge Functions)
- **Auth**: JWT required for `submit` and `create_session`; public for `get_session` and `get_bid_history`
- **Service**: Uses shared `BiddingService` from `_shared/bidding/`
- **User Resolution**: Maps Supabase auth user to application user via email lookup
- **Actions**: submit, get_session, get_bid_history, create_session

## API Endpoints

### POST /functions/v1/submit-bid

All requests use action-based routing:

```json
{
  "action": "action_name",
  "payload": { ... }
}
```

### Actions

#### 1. `submit` - Submit a bid on a session (auth required)

**Payload**:
```json
{
  "action": "submit",
  "payload": {
    "sessionId": "session-123",
    "amount": 250
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "bidId": "bid-abc123",
    "sessionId": "session-123",
    "userId": "user-456",
    "amount": 250,
    "round": 2,
    "isManualBid": true,
    "createdAt": "2026-02-12T10:30:00.000Z"
  }
}
```

#### 2. `get_session` - Get current session state

**Payload**:
```json
{
  "action": "get_session",
  "payload": {
    "sessionId": "session-123"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "session-123",
    "targetNight": "2026-03-15",
    "propertyId": "prop-789",
    "currentRound": 2,
    "maxRounds": 5,
    "currentHighBid": 250,
    "status": "active"
  }
}
```

#### 3. `get_bid_history` - Get all bids in a session

**Payload**:
```json
{
  "action": "get_bid_history",
  "payload": {
    "sessionId": "session-123"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "bidId": "bid-001",
      "userId": "user-456",
      "amount": 200,
      "round": 1,
      "createdAt": "2026-02-12T10:00:00.000Z"
    },
    {
      "bidId": "bid-002",
      "userId": "user-789",
      "amount": 250,
      "round": 2,
      "createdAt": "2026-02-12T10:30:00.000Z"
    }
  ]
}
```

#### 4. `create_session` - Create a new bidding session (auth required)

**Payload**:
```json
{
  "action": "create_session",
  "payload": {
    "targetNight": "2026-03-15",
    "propertyId": "prop-789",
    "listingId": "listing-101",
    "participantUserIds": ["user-456", "user-789"],
    "startingBid": 100,
    "maxRounds": 5,
    "roundDurationSeconds": 300
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "session-123",
    "targetNight": "2026-03-15",
    "propertyId": "prop-789",
    "status": "active",
    "createdAt": "2026-02-12T10:00:00.000Z"
  }
}
```

## Dependencies

- `_shared/bidding/index.ts` - BiddingService class (session management, bid placement)
- `_shared/errors.ts` - ValidationError
- `@supabase/supabase-js@2` - Auth and database operations

## Local Development

```bash
# Start local Supabase
supabase start

# Serve this function
supabase functions serve submit-bid

# Test get_session (no auth needed)
curl -X POST http://localhost:54321/functions/v1/submit-bid \
  -H "Content-Type: application/json" \
  -d '{"action":"get_session","payload":{"sessionId":"session-123"}}'

# Test submit bid (auth required)
curl -X POST http://localhost:54321/functions/v1/submit-bid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"submit","payload":{"sessionId":"session-123","amount":250}}'
```

## File Structure

```
submit-bid/
├── index.ts          # Main router with auth and action routing
└── deno.json         # Import map
```

## Critical Notes

- **Authentication required for submit and create_session** - Other actions are public
- **User resolution by email** - Auth user is mapped to application user via email lookup in `user` table
- **Amount is converted to Number** - Ensures numeric type for bid amounts
- **Round-based bidding** - Sessions have configurable max rounds and round duration
- **Service role client** - Uses service role key for database operations (bypasses RLS)
- **Error status codes** - ValidationError returns 400, AuthenticationError returns 401, others return 500

---

**Version**: 1.0.0
**Date**: 2026-02-12
**Pattern**: Pattern 4: BS+BS Competitive Bidding
