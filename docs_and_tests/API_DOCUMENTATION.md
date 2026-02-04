# Split Lease API Documentation

> Complete API reference for all Edge Functions and endpoints supporting the 5-pattern persuasion architecture

---

## Table of Contents

1. [Authentication](#authentication)
2. [Pattern 1: Archetype API](#pattern-1-archetype-api)
3. [Pattern 2: Urgency API](#pattern-2-urgency-api)
4. [Pattern 3: Pricing Tiers API](#pattern-3-pricing-tiers-api)
5. [Pattern 4: BS+BS Competition API](#pattern-4-bsbs-competition-api)
6. [Pattern 5: Fee Calculation API](#pattern-5-fee-calculation-api)
7. [Date Change Request API](#date-change-request-api)
8. [Error Codes](#error-codes)
9. [Rate Limiting](#rate-limiting)
10. [Webhooks](#webhooks)

---

## Authentication

All API requests require authentication using Supabase JWT tokens.

**Headers:**

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Example:**

```bash
curl -X GET https://your-project.supabase.co/functions/v1/archetype/user_123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

## Pattern 1: Archetype API

### GET /api/users/{userId}/archetype

Get user archetype information.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID |

**Response:**

```json
{
  "userId": "user_123",
  "archetypeType": "big_spender",
  "confidence": 0.87,
  "signals": {
    "avgTransactionValue": 1850,
    "willingnessToPay": 0.85,
    "priceRejectionRate": 0.15,
    "avgResponseTimeHours": 4.2,
    "acceptanceRate": 0.42,
    "requestFrequencyPerMonth": 2.3,
    "buyoutPreference": 0.70,
    "crashPreference": 0.20,
    "swapPreference": 0.10,
    "flexibilityScore": 32,
    "accommodationHistory": 3,
    "reciprocityRatio": 0.25
  },
  "lastUpdated": "2026-01-28T15:30:00Z",
  "nextUpdateIn": "24h"
}
```

**Example:**

```bash
curl -X GET https://your-project.supabase.co/functions/v1/users/user_123/archetype \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST /api/users/{userId}/archetype/recalculate

Trigger archetype recalculation for a user.

**Request Body:**

```json
{
  "userId": "user_123",
  "forceUpdate": true
}
```

**Response:**

```json
{
  "userId": "user_123",
  "previousArchetype": "average_user",
  "newArchetype": "big_spender",
  "confidenceChange": 0.25,
  "calculatedAt": "2026-01-28T16:00:00Z"
}
```

---

## Pattern 2: Urgency API

### POST /api/urgency/calculate

Calculate urgency multiplier and band for a target date.

**Request Body:**

```json
{
  "targetDate": "2026-02-15T00:00:00Z",
  "leaseId": "lease_456",
  "archetype": "big_spender"
}
```

**Response:**

```json
{
  "multiplier": 1.25,
  "band": "orange",
  "daysUntilCheckIn": 7,
  "hoursUntilCheckIn": 168,
  "urgencyLevel": "high",
  "message": "High urgency: Less than 2 weeks until new start date. Priority processing recommended.",
  "requiresAcknowledgment": true,
  "projections": [
    {
      "daysOut": 5,
      "price": 972,
      "multiplier": 1.35,
      "increaseFromCurrent": 162,
      "percentageIncrease": 20.0
    },
    {
      "daysOut": 3,
      "price": 1152,
      "multiplier": 1.5,
      "increaseFromCurrent": 342,
      "percentageIncrease": 42.2
    },
    {
      "daysOut": 1,
      "price": 1584,
      "multiplier": 2.0,
      "increaseFromCurrent": 774,
      "percentageIncrease": 95.6
    }
  ],
  "calculatedAt": "2026-01-28T15:45:00Z"
}
```

---

## Pattern 3: Pricing Tiers API

### POST /api/pricing-tiers

Generate personalized pricing tiers with anchoring.

**Request Body:**

```json
{
  "leaseId": "lease_456",
  "archetype": "big_spender",
  "urgencyMultiplier": 1.25,
  "newStartDate": "2026-02-15",
  "newEndDate": "2026-03-01"
}
```

**Response:**

```json
{
  "tiers": [
    {
      "id": "buyout",
      "name": "Exclusive Buyout",
      "price": 2835,
      "platformFee": 43,
      "totalCost": 2878,
      "priority": 1,
      "recommended": true,
      "confidence": 0.85,
      "roommateReceives": 2792,
      "urgencyMultiplier": 1.25,
      "reasoning": [
        "High urgency booking",
        "Your typical preference for guaranteed access",
        "Similar users choose buyout 70% of the time"
      ],
      "estimatedAcceptanceProbability": 0.72
    },
    {
      "id": "crash",
      "name": "Shared Crash",
      "price": 324,
      "platformFee": 5,
      "totalCost": 329,
      "priority": 2,
      "recommended": false,
      "confidence": 0.65,
      "roommateReceives": 319,
      "savingsVsBuyout": 2549,
      "savingsPercentage": 88.6,
      "estimatedAcceptanceProbability": 0.68
    },
    {
      "id": "swap",
      "name": "Fair Exchange",
      "price": 0,
      "platformFee": 5,
      "totalCost": 5,
      "priority": 3,
      "recommended": false,
      "confidence": 0.45,
      "requiresUserNight": true,
      "potentialMatches": 2,
      "savingsVsBuyout": 2873,
      "savingsPercentage": 99.8,
      "estimatedAcceptanceProbability": 0.55
    }
  ],
  "anchorPrice": 2878,
  "contextFactors": {
    "daysUntilCheckIn": 7,
    "isWeekday": true,
    "marketDemand": 1.25,
    "roommateArchetype": "big_spender"
  }
}
```

---

## Pattern 4: BS+BS Competition API

### POST /api/bidding/sessions

Create a competitive bidding session.

**Request Body:**

```json
{
  "targetNight": "2026-10-15",
  "propertyId": "prop_456",
  "participants": [
    {
      "userId": "user_123",
      "initialBid": 2835
    },
    {
      "userId": "user_789",
      "initialBid": 3100
    }
  ],
  "maxRounds": 3,
  "roundDuration": 3600
}
```

**Response:**

```json
{
  "sessionId": "bid_abc123",
  "status": "active",
  "currentHighBid": {
    "bidId": "bid_xyz789",
    "userId": "user_789",
    "userName": "Sarah",
    "amount": 3100,
    "timestamp": "2026-01-28T14:45:00Z",
    "isAutoBid": false,
    "round": 1
  },
  "participants": [
    {
      "userId": "user_123",
      "name": "John",
      "currentBid": 2835,
      "isWinner": false
    },
    {
      "userId": "user_789",
      "name": "Sarah",
      "currentBid": 3100,
      "isWinner": true
    }
  ],
  "expiresAt": "2026-01-28T17:45:00Z",
  "minimumIncrement": 310
}
```

---

### POST /api/bidding/sessions/{sessionId}/bid

Place a bid in an active session.

**Request Body:**

```json
{
  "userId": "user_123",
  "amount": 3410,
  "maxAutoBid": 4000
}
```

**Response:**

```json
{
  "bidId": "bid_new123",
  "sessionId": "bid_abc123",
  "amount": 3410,
  "timestamp": "2026-01-28T15:00:00Z",
  "isHighBid": true,
  "autoBidTriggered": false,
  "competitorResponse": {
    "autoBidPlaced": true,
    "newHighBid": 3750
  }
}
```

---

## Pattern 5: Fee Calculation API

### POST /api/fees/calculate

Calculate fee breakdown for a transaction.

**Request Body:**

```json
{
  "basePrice": 2835,
  "transactionType": "date_change"
}
```

**Response:**

```json
{
  "basePrice": 2835,
  "platformFee": 21.26,
  "landlordShare": 21.26,
  "tenantShare": 42.52,
  "totalFee": 42.52,
  "totalPrice": 2877.52,
  "effectiveRate": 1.5,
  "savingsVsTraditional": 439.43,
  "transactionType": "date_change",
  "breakdown": {
    "platformRate": 0.0075,
    "landlordRate": 0.0075,
    "totalRate": 0.015
  },
  "calculatedAt": "2026-01-28T16:00:00Z",
  "feeStructureVersion": "1.5_split_model_v1"
}
```

---

## Date Change Request API

### POST /api/date-change-request

Create a comprehensive date change request with all patterns.

**Request Body:**

```json
{
  "leaseId": "lease_456",
  "requestorId": "user_123",
  "newStartDate": "2026-02-15",
  "newEndDate": "2026-03-01",
  "reason": "Work relocation",
  "selectedTier": "buyout",
  "urgencyAcknowledged": true
}
```

**Response:**

```json
{
  "requestId": "dcr_789",
  "status": "pending",
  "archetype": "big_spender",
  "urgencyData": {
    "multiplier": 1.25,
    "band": "orange",
    "daysUntilCheckIn": 7
  },
  "selectedTier": {
    "id": "buyout",
    "price": 2835,
    "totalCost": 2878
  },
  "feeBreakdown": {
    "basePrice": 2835,
    "totalFee": 42.52,
    "totalPrice": 2877.52
  },
  "bsbsEligibility": {
    "eligible": true,
    "competitiveMode": true
  },
  "createdAt": "2026-01-28T16:00:00Z",
  "estimatedResponseTime": "4h"
}
```

---

### GET /api/date-change-request/{requestId}

Get full details of a date change request.

**Response:**

```json
{
  "requestId": "dcr_789",
  "leaseId": "lease_456",
  "requestorId": "user_123",
  "status": "pending",
  "newStartDate": "2026-02-15",
  "newEndDate": "2026-03-01",
  "reason": "Work relocation",
  "archetype": "big_spender",
  "urgencyMultiplier": 1.25,
  "urgencyBand": "orange",
  "selectedTier": "buyout",
  "tierPrice": 2835,
  "totalPrice": 2877.52,
  "pricingSnapshot": { /* full pricing tiers */ },
  "urgencySnapshot": { /* full urgency data */ },
  "feeBreakdown": { /* full fee breakdown */ },
  "isBSBS": true,
  "bsbsFlexibilityEnabled": true,
  "createdAt": "2026-01-28T16:00:00Z",
  "updatedAt": "2026-01-28T16:00:00Z"
}
```

---

### POST /api/date-change-request/{requestId}/accept

Accept a date change request.

**Response:**

```json
{
  "requestId": "dcr_789",
  "status": "accepted",
  "acceptedAt": "2026-01-28T17:00:00Z",
  "acceptedBy": "user_456",
  "finalPrice": 2877.52,
  "paymentStatus": "pending",
  "nextSteps": [
    "Payment processing will begin",
    "Both parties will receive confirmation",
    "Lease will be updated within 24 hours"
  ]
}
```

---

### POST /api/date-change-request/{requestId}/counter

Send a counter-offer.

**Request Body:**

```json
{
  "counterPrice": 3200,
  "message": "I can accept this date change at a slightly higher rate",
  "expiresIn": 86400
}
```

**Response:**

```json
{
  "counterOfferId": "counter_xyz",
  "requestId": "dcr_789",
  "originalPrice": 2877.52,
  "counterPrice": 3200,
  "difference": 322.48,
  "percentageIncrease": 11.2,
  "status": "pending_response",
  "expiresAt": "2026-01-29T17:00:00Z",
  "estimatedAcceptanceProbability": 0.65
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User doesn't have permission for this resource |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Request conflicts with current state (e.g., bidding session already exists) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

**Error Response Format:**

```json
{
  "error": {
    "code": "INVALID_ARCHETYPE",
    "message": "Unknown archetype: super_spender. Valid values: big_spender, high_flexibility, average_user",
    "field": "archetypeType",
    "timestamp": "2026-01-28T16:00:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse.

**Limits:**

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| GET /api/users/{userId}/archetype | 60 requests | 1 minute |
| POST /api/urgency/calculate | 120 requests | 1 minute |
| POST /api/pricing-tiers | 120 requests | 1 minute |
| POST /api/date-change-request | 20 requests | 1 minute |
| POST /api/bidding/* | 30 requests | 1 minute |

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1643385600
```

**Rate Limit Exceeded Response:**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "retryAfter": 45,
    "limit": 60,
    "window": "1 minute"
  }
}
```

---

## Webhooks

Subscribe to real-time events via webhooks.

### Configuration

```bash
POST /api/webhooks/subscribe

{
  "url": "https://your-app.com/webhooks/split-lease",
  "events": [
    "request.created",
    "request.accepted",
    "request.countered",
    "bidding.new_bid",
    "bidding.session_ended"
  ],
  "secret": "your_webhook_secret"
}
```

### Webhook Events

**request.created:**

```json
{
  "event": "request.created",
  "timestamp": "2026-01-28T16:00:00Z",
  "data": {
    "requestId": "dcr_789",
    "leaseId": "lease_456",
    "requestorId": "user_123",
    "archetype": "big_spender",
    "selectedTier": "buyout",
    "totalPrice": 2877.52
  }
}
```

**bidding.new_bid:**

```json
{
  "event": "bidding.new_bid",
  "timestamp": "2026-01-28T16:15:00Z",
  "data": {
    "sessionId": "bid_abc123",
    "bidId": "bid_xyz789",
    "userId": "user_789",
    "amount": 3410,
    "isHighBid": true,
    "previousHighBid": 3100
  }
}
```

---

**Last Updated:** 2026-01-28
**API Version:** 1.0.0
