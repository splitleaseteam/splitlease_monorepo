# Edge Functions Reference

Complete reference documentation for all 50+ Supabase Edge Functions in the Split Lease platform.

---

## Overview

Split Lease Edge Functions are serverless TypeScript functions running on Deno 2. They provide a secure, scalable backend for the rental marketplace platform.

### Architecture

- **Runtime**: Deno 2
- **Language**: TypeScript
- **Pattern**: Action-based routing (`{ action, payload }`)
- **Authentication**: Supabase Auth JWT (optional for public endpoints)
- **CORS**: Enabled for all origins in development

### Request Pattern

All Edge Functions follow the same request/response pattern:

```typescript
// Request
{
  action: string,
  payload: Record<string, any>
}

// Success Response
{
  success: true,
  data: any
}

// Error Response
{
  success: false,
  error: string
}
```

---

## Authentication & User Management

### auth-user

**Endpoint**: `POST /functions/v1/auth-user`

**Description**: Core authentication operations including login, signup, logout, password reset, and OAuth (LinkedIn, Google) flows.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `login` | No | User login via email/password |
| `signup` | No | User registration via Supabase Auth |
| `logout` | No | User logout (clears session) |
| `validate` | Yes | Validate token and fetch user data |
| `request_password_reset` | No | Send password reset email |
| `update_password` | Yes | Update password after reset |
| `oauth_signup` | Yes | Handle OAuth signup callback |
| `oauth_login` | Yes | Handle OAuth login callback |

**Example - Login**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'login',
    payload: {
      email: 'user@example.com',
      password: 'password123'
    }
  })
});

const { success, data, error } = await response.json();
// Returns: { access_token, refresh_token, user_id, user_type, ... }
```

**Example - Signup**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'signup',
    payload: {
      email: 'user@example.com',
      password: 'password123',
      retype: 'password123',
      additionalData: {
        firstName: 'John',
        lastName: 'Doe',
        userType: 'Guest',
        birthDate: '1990-01-01',
        phoneNumber: '+1234567890'
      }
    }
  })
});
```

**Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": "abc123xyz",
    "supabase_user_id": "xyz789abc",
    "user_type": "Guest",
    "host_account_id": "host_123",
    "guest_account_id": "guest_456",
    "expires_in": 3600
  }
}
```

**See Also**: [Authentication Flows](../authentication/README.md)

---

### magic-login-links

**Endpoint**: `POST /functions/v1/magic-login-links`

**Description**: SMS-based magic link authentication for passwordless login.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `send` | No | Send magic link via SMS |
| `verify` | No | Verify magic link token |

**Example - Send Magic Link**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/magic-login-links`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'send',
    payload: {
      phoneNumber: '+1234567890'
    }
  })
});
```

---

### verify-users

**Endpoint**: `POST /functions/v1/verify-users`

**Description**: Identity verification workflows for guests and hosts.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `initiate_verification` | Yes | Start identity verification flow |
| `check_status` | Yes | Check verification status |
| `submit_documents` | Yes | Upload verification documents |

---

## Proposal Management

### proposal

**Endpoint**: `POST /functions/v1/proposal`

**Description**: Core proposal operations including creation, updates, suggestions, and workflow management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | Yes | Create new proposal |
| `update` | Optional | Update existing proposal |
| `get` | No | Get proposal details |
| `suggest` | Yes | Find and create suggestion proposals |
| `create_suggested` | Yes | Create suggested proposal |
| `create_mockup` | Yes | Create mockup proposal for preview |
| `get_prefill_data` | Yes | Get prefill data for proposal form |
| `createTestProposal` | No | Create test proposal (dev only) |
| `createTestRentalApplication` | No | Create test rental app (dev only) |
| `acceptProposal` | Yes | Accept proposal |
| `createCounteroffer` | Yes | Create counteroffer |
| `acceptCounteroffer` | Yes | Accept counteroffer |

**Example - Create Proposal**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/proposal`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`,
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'create',
    payload: {
      listingId: 'listing_123',
      checkInDate: '2026-02-01',
      checkOutDate: '2026-02-28',
      selectedNights: [1, 2, 3, 4, 5], // Mon-Fri (0-based)
      guestMessage: 'Looking forward to staying!',
      rentalApplicationId: 'rental_app_123'
    }
  })
});

const { success, data, error } = await response.json();
// Returns: { proposalId, calculatedPrices, status, ... }
```

**Response**:
```json
{
  "success": true,
  "data": {
    "proposalId": "prop_abc123",
    "listingId": "listing_123",
    "status": "pending",
    "pricing": {
      "nightlyRate": 150,
      "weeklyRate": 900,
      "fourWeekRate": 3600,
      "totalRent": 3600,
      "serviceFee": 360
    },
    "dates": {
      "checkIn": "2026-02-01",
      "checkOut": "2026-02-28",
      "selectedDays": [1, 2, 3, 4, 5]
    }
  }
}
```

**Example - Get Proposal**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/proposal`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'get',
    payload: {
      proposalId: 'prop_abc123'
    }
  })
});
```

---

### rental-application

**Endpoint**: `POST /functions/v1/rental-application`

**Description**: Rental application submissions and management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `submit` | Yes | Submit rental application |
| `get` | Yes | Get rental application details |
| `update` | Yes | Update rental application |

**Example - Submit Rental Application**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/rental-application`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`,
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'submit',
    payload: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      birthDate: '1990-01-01',
      aboutMe: 'Software engineer who loves to travel',
      needForSpace: 'Looking for a quiet place to work',
      specialNeeds: 'None',
      profilePhoto: 'https://example.com/photo.jpg'
    }
  })
});
```

---

### quick-match

**Endpoint**: `POST /functions/v1/quick-match`

**Description**: AI-powered proposal suggestions based on guest preferences and availability.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `find_matches` | Yes | Find matching listings |
| `create_suggestions` | Yes | Create proposal suggestions |

---

## Listing Management

### listing

**Endpoint**: `POST /functions/v1/listing`

**Description**: Listing CRUD operations and management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | No | Create new listing (minimal data) |
| `get` | No | Get listing details |
| `submit` | Yes | Full listing submission |
| `update` | Yes | Update listing |
| `delete` | Yes | Delete listing |

**Example - Get Listing**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/listing`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'get',
    payload: {
      listingId: 'listing_123'
    }
  })
});

const { success, data, error } = await response.json();
// Returns: { listingId, title, description, pricing, availability, ... }
```

**Example - Submit Full Listing**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/listing`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`,
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'submit',
    payload: {
      listingId: 'listing_123',
      title: 'Beautiful Brooklyn Apartment',
      description: 'Spacious 2BR in prime location',
      address: {
        street: '123 Main St',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201'
      },
      pricing: {
        nightlyRate: 150,
        weeklyRate: 900,
        fourWeekRate: 3600
      },
      availability: {
        availableDays: [1, 2, 3, 4, 5], // Mon-Fri
        blockedDates: ['2026-02-15', '2026-02-16']
      },
      amenities: ['wifi', 'kitchen', 'laundry'],
      photos: ['photo1.jpg', 'photo2.jpg']
    }
  })
});
```

---

### pricing

**Endpoint**: `POST /functions/v1/pricing`

**Description**: Pricing calculations and rate management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `calculate` | No | Calculate pricing for dates |
| `get_rates` | No | Get current rates for listing |

**Example - Calculate Pricing**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/pricing`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'calculate',
    payload: {
      listingId: 'listing_123',
      checkInDate: '2026-02-01',
      checkOutDate: '2026-02-28',
      selectedDays: [1, 2, 3, 4, 5] // Mon-Fri
    }
  })
});

const { success, data, error } = await response.json();
// Returns: { nightlyRate, weeklyRate, fourWeekRate, total, serviceFee }
```

---

### pricing-list

**Endpoint**: `POST /functions/v1/pricing-list`

**Description**: Dynamic pricing list management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `get` | No | Get pricing list for listing |
| `update` | Yes | Update pricing list |
| `apply_surge` | Yes | Apply surge pricing |
| `remove_surge` | Yes | Remove surge pricing |

---

## Messaging & Communication

### messages

**Endpoint**: `POST /functions/v1/messages`

**Description**: Real-time messaging between guests and hosts.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `send` | Yes | Send message |
| `get_thread` | Yes | Get message thread |
| `list_threads` | Yes | List all message threads |
| `mark_read` | Yes | Mark messages as read |

**Example - Send Message**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`,
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'send',
    payload: {
      recipientId: 'user_123',
      proposalId: 'prop_abc',
      message: 'Is the listing still available?'
    }
  })
});
```

---

### message-curation

**Endpoint**: `POST /functions/v1/message-curation`

**Description**: AI-powered message curation and filtering.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `curate` | Yes | Curate message using AI |
| `suggest_reply` | Yes | Suggest AI-generated reply |

---

### send-email

**Endpoint**: `POST /functions/v1/send-email`

**Description**: Email notification service.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `send` | Yes | Send transactional email |

---

### send-sms

**Endpoint**: `POST /functions/v1/send-sms`

**Description**: SMS notification service.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `send` | Yes | Send SMS message |

---

### slack

**Endpoint**: `POST /functions/v1/slack`

**Description**: Slack integration for FAQ inquiries and notifications.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `faq_inquiry` | No | Submit FAQ inquiry to Slack |

---

## Guest & Host Management

### guest-management

**Endpoint**: `POST /functions/v1/guest-management`

**Description**: Guest profile management operations.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `get_profile` | Yes | Get guest profile |
| `update_profile` | Yes | Update guest profile |
| `get_history` | Yes | Get guest stay history |

---

### cohost-request

**Endpoint**: `POST /functions/v1/cohost-request`

**Description**: Co-host request workflows.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | Yes | Create co-host request |
| `accept` | Yes | Accept co-host request |
| `decline` | Yes | Decline co-host request |
| `list` | Yes | List co-host requests |

---

### co-host-requests

**Endpoint**: `POST /functions/v1/co-host-requests`

**Description**: Co-host request management (alternate endpoint).

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `get` | Yes | Get co-host request details |
| `update` | Yes | Update co-host request |

---

### house-manual

**Endpoint**: `POST /functions/v1/house-manual`

**Description**: House manual management for listings.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `get` | No | Get house manual for listing |
| `create` | Yes | Create house manual |
| `update` | Yes | Update house manual |

---

## Payments & Financial

### guest-payment-records

**Endpoint**: `POST /functions/v1/guest-payment-records`

**Description**: Guest payment tracking and records.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `get` | Yes | Get guest payment records |
| `create` | Yes | Create payment record |
| `update` | Yes | Update payment record |

---

### host-payment-records

**Endpoint**: `POST /functions/v1/host-payment-records`

**Description**: Host payment tracking and records.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `get` | Yes | Get host payment records |
| `create` | Yes | Create payment record |
| `update` | Yes | Update payment record |

---

## Lease Management

### lease

**Endpoint**: `POST /functions/v1/lease`

**Description**: Lease operations and management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | Yes | Create lease from proposal |
| `get` | Yes | Get lease details |
| `update` | Yes | Update lease |
| `terminate` | Yes | Terminate lease |

---

### leases-admin

**Endpoint**: `POST /functions/v1/leases-admin`

**Description**: Administrative lease management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `list_all` | Yes (Admin) | List all leases |
| `get_details` | Yes (Admin) | Get lease details |
| `update_status` | Yes (Admin) | Update lease status |

---

### lease-documents

**Endpoint**: `POST /functions/v1/lease-documents`

**Description**: Lease document generation (DOCX) and upload.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `generate_host_payout` | No | Generate host payout schedule form |
| `generate_supplemental` | No | Generate supplemental agreement |
| `generate_periodic_tenancy` | No | Generate periodic tenancy agreement |
| `generate_credit_card_auth` | No | Generate credit card authorization form |
| `generate_all` | No | Generate all four lease documents |

---

### document

**Endpoint**: `POST /functions/v1/document`

**Description**: Document management and storage.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `upload` | Yes | Upload document |
| `get` | Yes | Get document |
| `list` | Yes | List documents |
| `delete` | Yes | Delete document |

---

## Reviews & Surveys

### reviews-overview

**Endpoint**: `POST /functions/v1/reviews-overview`

**Description**: Review aggregation and management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `get_for_listing` | No | Get reviews for listing |
| `get_for_user` | Yes | Get reviews for user |
| `create` | Yes | Create review |

---

### experience-survey

**Endpoint**: `POST /functions/v1/experience-survey`

**Description**: Experience survey collection and management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `submit` | Yes | Submit experience survey |
| `get` | Yes | Get survey responses |

---

## AI & Automation

### ai-gateway

**Endpoint**: `POST /functions/v1/ai-gateway`

**Description**: OpenAI proxy with prompt templating and data loaders.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `complete` | Varies | Non-streaming completion |
| `stream` | Varies | SSE streaming completion |

**Public Prompts** (No auth required):
- `echo-test` - Test endpoint
- `listing-description` - Generate listing descriptions
- `listing-title` - Generate listing titles

**Example - Generate Listing Description**:
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-gateway`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'complete',
    payload: {
      prompt: 'listing-description',
      variables: {
        neighborhood: 'Williamsburg',
        amenities: 'wifi, kitchen, laundry',
        beds: 2,
        bathrooms: 1,
        squareFeet: 1000
      }
    }
  })
});

const { success, data, error } = await response.json();
// Returns: { response: "Generated description...", usage: {...} }
```

---

### ai-parse-profile

**Endpoint**: `POST /functions/v1/ai-parse-profile`

**Description**: AI-powered user profile parsing.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `parse` | Yes | Parse user profile text |

---

### ai-room-redesign

**Endpoint**: `POST /functions/v1/ai-room-redesign`

**Description**: AI-powered room redesign suggestions.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `suggest` | Yes | Get redesign suggestions |

---

### ai-signup-guest

**Endpoint**: `POST /functions/v1/ai-signup-guest`

**Description**: AI-powered guest signup flow.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `process` | No | Process AI signup request |

---

### ai-tools

**Endpoint**: `POST /functions/v1/ai-tools`

**Description**: General AI utility functions.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `analyze` | Yes | Analyze content with AI |
| `summarize` | Yes | Summarize content |

---

### calendar-automation

**Endpoint**: `POST /functions/v1/calendar-automation`

**Description**: Calendar automation and sync.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `sync_calendar` | Yes | Sync external calendar |
| `get_events` | Yes | Get calendar events |
| `create_event` | Yes | Create calendar event |

---

### reminder-scheduler

**Endpoint**: `POST /functions/v1/reminder-scheduler`

**Description**: Automated reminder scheduling and management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `schedule` | Yes | Schedule reminder |
| `cancel` | Yes | Cancel reminder |
| `list` | Yes | List scheduled reminders |

---

## Integrations & Sync

### bubble_sync

**Endpoint**: `POST /functions/v1/bubble_sync`

**Description**: Process sync_queue and push data from Supabase to Bubble.io.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `process_queue` | No (Internal) | Process queue via Workflow API |
| `process_queue_data_api` | No (Internal) | Process queue via Data API |
| `sync_single` | No (Internal) | Manually sync single record |
| `retry_failed` | No (Internal) | Retry failed sync operations |
| `get_status` | No (Internal) | Get sync queue statistics |
| `cleanup` | No (Internal) | Clean up old completed items |
| `build_request` | No (Internal) | Preview Bubble API request |
| `sync_signup_atomic` | No (Internal) | Handle atomic signup sync |

---

### workflow-orchestrator

**Endpoint**: `POST /functions/v1/workflow-orchestrator`

**Description**: Workflow orchestration and management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `start_workflow` | Yes | Start workflow |
| `get_status` | Yes | Get workflow status |
| `cancel_workflow` | Yes | Cancel workflow |

---

### workflow-enqueue

**Endpoint**: `POST /functions/v1/workflow-enqueue`

**Description**: Workflow queue management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `enqueue` | Yes | Add item to workflow queue |
| `dequeue` | No (Internal) | Process workflow queue |

---

## Utilities & Admin

### qr-codes

**Endpoint**: `POST /functions/v1/qr-codes`

**Description**: QR code generation and management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `generate` | Yes | Generate QR code |
| `get` | No | Get QR code image |
| `validate` | No | Validate QR code |

---

### qr-generator

**Endpoint**: `POST /functions/v1/qr-generator`

**Description**: QR code operations (alternate endpoint).

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | Yes | Create QR code |

---

### pricing-admin

**Endpoint**: `POST /functions/v1/pricing-admin`

**Description**: Administrative pricing management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `update_base_rates` | Yes (Admin) | Update base rates |
| `get_analytics` | Yes (Admin) | Get pricing analytics |

---

### simulation-admin

**Endpoint**: `POST /functions/v1/simulation-admin`

**Description**: Simulation management for testing.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create_simulation` | Yes (Admin) | Create simulation |
| `get_results` | Yes (Admin) | Get simulation results |

---

### usability-data-admin

**Endpoint**: `POST /functions/v1/usability-data-admin`

**Description**: Usability testing data management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `record_event` | No | Record usability event |
| `get_data` | Yes (Admin) | Get usability data |

---

### emergency

**Endpoint**: `POST /functions/v1/emergency`

**Description**: Emergency contact management.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create_alert` | Yes | Create emergency alert |
| `get_contacts` | Yes | Get emergency contacts |
| `update_contacts` | Yes | Update emergency contacts |

---

### informational-texts

**Endpoint**: `POST /functions/v1/informational-texts`

**Description**: CMS content management for informational texts.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `get` | No | Get informational text |
| `list` | No | List all informational texts |
| `update` | Yes (Admin) | Update informational text |

---

### date-change-request

**Endpoint**: `POST /functions/v1/date-change-request`

**Description**: Date change request workflows.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | Yes | Create date change request |
| `approve` | Yes | Approve date change |
| `decline` | Yes | Decline date change |

---

### backfill-negotiation-summaries

**Endpoint**: `POST /functions/v1/backfill-negotiation-summaries`

**Description**: Data backfill operations for negotiation summaries.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `backfill` | Yes (Admin) | Backfill negotiation summaries |

---

### query-leo

**Endpoint**: `POST /functions/v1/query-leo`

**Description**: LEO integration queries.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `query` | Yes | Query LEO system |

---

### simulation-guest

**Endpoint**: `POST /functions/v1/simulation-guest`

**Description**: Guest simulation for testing.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | No | Create simulated guest |
| `act` | No | Simulate guest action |

---

### simulation-host

**Endpoint**: `POST /functions/v1/simulation-host`

**Description**: Host simulation for testing.

**Actions**:

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | No | Create simulated host |
| `act` | No | Simulate host action |

---

## Response Codes

All Edge Functions return standard HTTP status codes:

- **200 OK**: Successful request
- **400 Bad Request**: Invalid input or validation error
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Database constraint violation
- **500 Internal Server Error**: Server error

## Error Handling

All errors follow the standard error response format:

```json
{
  "success": false,
  "error": "Detailed error message"
}
```

## See Also

- [OpenAPI Specifications](../openapi/README.md)
- [Code Examples](../examples/README.md)
- [Authentication Flows](../authentication/README.md)
