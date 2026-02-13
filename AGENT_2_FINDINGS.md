# Agent 2 Findings: Masking & Forwarding Service Investigation

**Date**: 2026-02-13
**Investigator**: Claude Agent 2
**Scope**: Phone number masking and SMS forwarding infrastructure

---

## Executive Summary

**CRITICAL FINDING**: No active phone masking or forwarding service exists in the codebase.

The `pythonanywhere/maskingAndForward/` directory contains only historical metrics data (last activity: August 2025). There is **no Python code** implementing phone masking or SMS forwarding functionality.

SMS capabilities are limited to **outbound-only** messaging via Twilio, routed through a Supabase Edge Function. There are **no webhook handlers** to receive inbound SMS or forward messages between users.

---

## Directory Structure Analysis

### 1. PythonAnywhere Applications

The platform consists of **3 Flask applications**:

| App | Purpose | SMS-Related? |
|-----|---------|--------------|
| **mysite** | Primary app (Slack, PDFs, calendar automation, health monitoring) | ❌ No |
| **mysite2** | Utilities (URL shortener, QR generator) | ❌ No |
| **mysite3** | ML services (TensorFlow listing matching) | ❌ No |

**None of these applications contain Twilio webhook handlers or phone masking logic.**

### 2. The `maskingAndForward` Directory

**Location**: `pythonanywhere/maskingAndForward/`

**Contents**:
```
maskingAndForward/
├── email_metrics.json    # 709 KB - Email activity timestamps
└── sms_metrics.json      # 12 KB - SMS activity timestamps (118 entries)
```

**Key Observations**:
- ✅ Contains metrics from March 2025 - August 2025
- ❌ No Python files (`.py`)
- ❌ No Flask routes or webhook handlers
- ❌ No configuration files (`.env`, `config.py`)
- ❌ No requirements.txt

**Sample SMS Metrics**:
```json
{
  "sms_received": [
    "2025-03-20T14:42:35.558061",
    "2025-08-13T14:57:34.706695"
    // 118 total entries
  ]
}
```

**Conclusion**: This was likely a **prototype or proof-of-concept** that recorded webhook activity but has since been **decommissioned**.

---

## SMS Flow Analysis

### Current Architecture (Outbound Only)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  User requests SMS (magic link, notification)                │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTION: send-sms                │
│  Location: supabase/functions/send-sms/index.ts             │
│                                                              │
│  Actions:                                                    │
│  - send: Proxy SMS to Twilio API                            │
│  - health: Check Twilio credentials                         │
│                                                              │
│  Auth Strategy:                                              │
│  - Public numbers (magic link): +14155692985                │
│  - User-initiated SMS: Requires JWT Bearer token            │
│                                                              │
│  Request Format:                                             │
│  {                                                           │
│    "action": "send",                                         │
│    "payload": {                                              │
│      "to": "+15551234567",      // E.164 format             │
│      "from": "+14155692985",    // Twilio number            │
│      "body": "Your message"                                  │
│    }                                                         │
│  }                                                           │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      TWILIO API                              │
│  POST https://api.twilio.com/2010-04-01/Accounts/           │
│       {ACCOUNT_SID}/Messages.json                           │
│                                                              │
│  Auth: HTTP Basic (ACCOUNT_SID:AUTH_TOKEN)                  │
│  Body: application/x-www-form-urlencoded                    │
│                                                              │
│  Response:                                                   │
│  {                                                           │
│    "sid": "SM...",                                           │
│    "status": "queued"                                        │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    📱 User receives SMS
```

### What's Missing: Inbound SMS / Masking Flow

**This flow does NOT exist:**

```
❌ NOT IMPLEMENTED ❌

  User A sends SMS          Twilio Webhook Handler        User B receives
  to masked number     ──►  (DOES NOT EXIST)        ──►   forwarded SMS
  +1-415-XXX-XXXX             ↓
                         Database Lookup
                         masked_number → real_number
```

---

## Integration with Supabase

### 1. Database Schema

**User Table** (`public.user`):
```sql
-- Phone fields in user table (from migrations)
phone TEXT         -- User's real phone number (E.164 format)
-- NO masked_phone column found
-- NO phone_proxy table found
```

**Search Results**:
- ✅ `phone` column exists in `user` table
- ❌ No `masked_phone` or `proxy_phone` columns
- ❌ No `phone_masking` table
- ❌ No `twilio_numbers` table for number pool management

### 2. Edge Functions Using Phone Numbers

| Function | Purpose | Phone Usage |
|----------|---------|-------------|
| **send-sms** | Send outbound SMS via Twilio | Uses hardcoded number: `+14155692985` |
| **auth-user** | Magic link SMS authentication | Calls `send-sms` edge function |
| **emergency** | Emergency contact SMS | Calls `send-sms` edge function |
| **reminder-scheduler** | Scheduled reminder SMS | Calls `send-sms` edge function |
| **messages** | In-app messaging threads | **NO SMS integration** - app-only |

### 3. Message Flow (In-App Only)

**The `messages` edge function provides**:
- ✅ In-app messaging between users
- ✅ Thread management
- ✅ Email notifications (via SendGrid)
- ❌ **NO SMS forwarding**
- ❌ **NO phone masking**

**Database Tables**:
```
message_thread           # Conversation threads
message                  # Individual messages
thread_participant       # User-to-thread mapping
notification_preferences # Email/SMS preferences (checked but not used for SMS)
```

**Admin Reminder Handler** (`messages/handlers/adminSendReminder.ts`):
```typescript
// Checks for 'message_forwarding' preference
const emailAllowed = checkEmailPreference(prefs, 'message_forwarding');
const smsAllowed = checkSmsPreference(prefs, 'message_forwarding');

// BUT: SMS forwarding is NOT implemented
// Only email reminders work
```

---

## Potential Implementation Hypothesis

Based on code patterns and naming conventions, a masking service **could** have been implemented as follows:

### Hypothetical Database Schema
```sql
-- NOT FOUND IN MIGRATIONS - This is speculative

CREATE TABLE phone_masking (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user(id),
  masked_number TEXT NOT NULL,      -- e.g., +1-415-XXX-XXXX
  real_number TEXT NOT NULL,        -- e.g., +1-555-123-4567
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_phone_masking_masked ON phone_masking(masked_number);
```

### Hypothetical Twilio Webhook Flow
```python
# DOES NOT EXIST - Hypothetical implementation

from flask import Flask, request
import hmac
import hashlib
from twilio.rest import Client

@app.route('/twilio/sms-webhook', methods=['POST'])
def handle_inbound_sms():
    # 1. Validate Twilio signature
    if not validate_twilio_signature(request):
        return 'Unauthorized', 401

    # 2. Extract incoming SMS data
    from_number = request.form.get('From')      # Real sender number
    to_number = request.form.get('To')          # Masked/proxy number
    body = request.form.get('Body')

    # 3. Database lookup: Find recipient
    masked_record = db.query(
        "SELECT user_id, real_number FROM phone_masking WHERE masked_number = %s",
        (to_number,)
    ).first()

    if not masked_record:
        return 'Number not found', 404

    # 4. Forward SMS to recipient's real number
    recipient_number = masked_record['real_number']

    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    client.messages.create(
        to=recipient_number,
        from_=to_number,      # Keep masked number as sender
        body=body
    )

    # 5. Log to database
    db.execute(
        "INSERT INTO sms_forwards (from, to, masked_via, body, timestamp) VALUES (%s, %s, %s, %s, NOW())",
        (from_number, recipient_number, to_number, body)
    )

    return 'OK', 200
```

---

## Security Concerns

### 1. Credentials Status

**Twilio Credentials** (referenced in `send-sms/index.ts`):
- ⚠️ `TWILIO_ACCOUNT_SID` - **Present** in environment
- ⚠️ `TWILIO_AUTH_TOKEN` - **Present** in environment
- ℹ️ These are configured at the Supabase project level (not in code)
- ✅ Health check endpoint verifies their presence without revealing values

### 2. Missing Security Features for Masking

If masking were to be implemented, these are **critical missing pieces**:

❌ **No webhook signature verification**
   - PythonAnywhere apps have Slack webhook verification
   - But no Twilio webhook verification code exists

❌ **No number pool management**
   - Single hardcoded Twilio number: `+14155692985`
   - No dynamic assignment of masked numbers to conversations

❌ **No rate limiting**
   - `send-sms` edge function has no rate limits
   - Could be abused for SMS spam

❌ **No conversation expiration**
   - No TTL on masked numbers
   - Could lead to number exhaustion

❌ **No bidirectional mapping**
   - Can't mask both parties in a conversation
   - User A → Masked Number ← User B routing doesn't exist

### 3. Hardcoded Values

**From `send-sms/index.ts`**:
```typescript
// Public SMS numbers (no auth required)
const PUBLIC_FROM_NUMBERS: ReadonlySet<string> = new Set([
  '+14155692985',  // Magic link SMS
]);
```

**Security Implication**: This number can send SMS without user authentication, but only for magic link purposes.

---

## Recommendations

### If Masking Service is Needed

**1. Create Dedicated PythonAnywhere App**
```
pythonanywhere/
└── mysite4/                          # New masking service
    ├── app.py                        # Flask app with Twilio webhooks
    ├── requirements.txt              # twilio, supabase, python-dotenv
    ├── routes/
    │   ├── twilio_webhook.py         # Inbound SMS handler
    │   └── health.py                 # Health check
    ├── services/
    │   ├── number_pool.py            # Manage Twilio number pool
    │   ├── masking_service.py        # Create/expire masked numbers
    │   └── forwarding_service.py     # Route SMS between users
    └── .env                          # Twilio credentials, Supabase URL
```

**2. Database Migrations**
```sql
-- Create masking tables
CREATE TABLE phone_number_pool (
  number TEXT PRIMARY KEY,
  in_use BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES user(id),
  assigned_at TIMESTAMPTZ
);

CREATE TABLE phone_conversations (
  id UUID PRIMARY KEY,
  user_a UUID REFERENCES user(id),
  user_b UUID REFERENCES user(id),
  masked_number TEXT REFERENCES phone_number_pool(number),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true
);

CREATE TABLE sms_forwards (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES phone_conversations(id),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT,
  forwarded_at TIMESTAMPTZ DEFAULT NOW()
);
```

**3. Twilio Configuration**
- Purchase Twilio phone number pool (minimum 10-20 numbers)
- Configure webhook URL: `https://your-app.pythonanywhere.com/twilio/sms-webhook`
- Enable signature validation
- Set up number recycling (auto-expire after 7 days)

**4. Integration Points**
```typescript
// Supabase Edge Function: create-masked-conversation
export async function createMaskedConversation(userA: string, userB: string) {
  // 1. Fetch available masked number from pool
  const response = await fetch('https://mysite4.pythonanywhere.com/masking/create', {
    method: 'POST',
    body: JSON.stringify({ user_a: userA, user_b: userB })
  });

  const { masked_number, expires_at } = await response.json();

  // 2. Store in Supabase
  await supabase.from('phone_conversations').insert({
    user_a: userA,
    user_b: userB,
    masked_number,
    expires_at
  });

  // 3. Return masked number to user
  return { masked_number };
}
```

### If Masking is NOT Needed

**Cleanup Steps**:
1. ✅ Remove `pythonanywhere/maskingAndForward/` directory (only metrics, no code)
2. ✅ Update documentation to clarify SMS is outbound-only
3. ✅ Remove `message_forwarding` SMS preference checks (currently dead code)

---

## Questions for Product Team

1. **Is phone masking required for the Split Lease product?**
   - Current messaging is in-app only
   - Users can exchange phone numbers manually if needed

2. **What was the original `maskingAndForward` prototype?**
   - Metrics show 118 SMS received (March-August 2025)
   - Was this a Twilio trial that was abandoned?

3. **Should we implement SMS notifications?**
   - Database has `notification_preferences.sms_allowed` fields
   - `send-sms` edge function exists
   - But no SMS notifications are currently sent (only email)

4. **Compliance considerations**:
   - TCPA (Telephone Consumer Protection Act) for SMS marketing
   - Opt-in/opt-out requirements
   - Number portability and recycling policies

---

## Technical Debt Identified

### Active Issues

1. **Dead Code**: `message_forwarding` SMS preference checks in `messages/handlers/adminSendReminder.ts`
   - Code checks if user allows SMS forwarding
   - But SMS forwarding is never sent (email only)
   - **Action**: Remove SMS preference checks or implement SMS notifications

2. **Incomplete Email Forwarding**: `message-curation` function has placeholder
   ```typescript
   // From message-curation/index.ts
   note: 'Email forwarding not yet implemented - message marked as forwarded'
   ```
   - **Action**: Implement or remove `forwardMessage` action

3. **Abandoned Metrics Directory**: `pythonanywhere/maskingAndForward/`
   - **Action**: Delete or document purpose

### Configuration Gaps

1. **No webhook URL configured in Twilio**
   - Twilio account has no inbound SMS webhook endpoint
   - **Action**: If masking needed, configure webhook URL

2. **Single Twilio number**
   - Only `+14155692985` configured
   - No number pool for masking conversations
   - **Action**: Purchase additional numbers if masking needed

---

## Conclusion

**The "Masking & Forwarding" service does not exist in the current codebase.**

The `maskingAndForward` directory is an **empty shell** containing only historical metrics. All SMS functionality is **outbound-only** via the `send-sms` Supabase Edge Function, which acts as a simple Twilio API proxy.

**Current Capabilities**:
- ✅ Send outbound SMS (magic links, notifications)
- ✅ In-app messaging between users
- ✅ Email notifications

**Missing Capabilities**:
- ❌ Phone number masking
- ❌ Inbound SMS webhooks
- ❌ SMS forwarding between users
- ❌ Number pool management
- ❌ Conversation-based SMS routing

If phone masking is a product requirement, a **new Flask application** would need to be built from scratch with Twilio webhook handling, number pool management, and integration with the Supabase database.

---

**Investigation Complete**
**Status**: No masking service found
**Recommendation**: Clarify product requirements before implementing
