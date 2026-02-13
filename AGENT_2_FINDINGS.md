# Agent 2 Findings: Masking & Forwarding Service Investigation

**Date**: 2026-02-13
**Investigator**: Claude Agent 2
**Scope**: Phone number masking and SMS forwarding infrastructure
**Status**: ✅ COMPLETE SERVICE FOUND IN BACKUP

---

## Executive Summary

**CRITICAL UPDATE**: A fully functional masking and forwarding service **DOES EXIST** in the backup directory `c:\Users\Split Lease\Downloads\backup021326\`.

The service was **decommissioned from the active codebase** but remains operational in the backup. It handled 118 SMS messages between March-August 2025 before being archived.

**Architecture**: Flask app (PythonAnywhere) → Twilio webhooks → SMS/Email forwarding → Bubble.io workflows

---

## Service Architecture

### Complete System Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        INCOMING COMMUNICATION                             │
└──────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────┴────────────────────┐
         │                                         │
    SMS (Twilio)                            Email (Gmail IMAP)
         │                                         │
         ▼                                         ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│   Twilio SMS Webhook    │           │   Email Monitor         │
│   POST /webhook/sms     │           │   (Background Daemon)   │
└─────────┬───────────────┘           └─────────┬───────────────┘
          │                                     │
          │              PYTHONANYWHERE FLASK APP               │
          │              (backup021326/app.py)                  │
          │                                                     │
          ▼                                                     ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│    SMS Service          │           │   Email Service         │
│  sms_service.py         │           │  email_service.py       │
│                         │           │                         │
│  • Normalize phones     │           │  • Parse emails         │
│  • Record metrics       │           │  • Extract user pairs   │
│  • Forward to endpoints │           │  • Forward to Bubble    │
└─────────┬───────────────┘           └─────────┬───────────────┘
          │                                     │
          ├─────────────────────────────────────┤
          │                                     │
          ▼                                     ▼
┌────────────────────────────────────────────────────────────────┐
│                     PAIRING SERVICE                             │
│                   pairing_service.py                            │
│                                                                 │
│  • get_users_by_phone() - Lookup user by phone number         │
│  • get_user_pairs() - Find host-guest pairings                │
│  • create_pair() / remove_pair() - Manage pairings            │
│  • normalize_phone_number() - Format standardization          │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                  DATABASE SERVICE (SQLite)                      │
│                  database_service.py                            │
│                  data/bubble.db                                 │
│                                                                 │
│  Tables:                                                        │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  bubble_users    │  │   user_pairs     │                   │
│  ├──────────────────┤  ├──────────────────┤                   │
│  │ _id (PK)         │  │ id (PK)          │                   │
│  │ email            │  │ user1_id (FK)    │                   │
│  │ first_name       │  │ user2_id (FK)    │                   │
│  │ last_name        │  │ active (bool)    │                   │
│  │ phone_number     │  │ timestamp        │                   │
│  │ Type             │  └──────────────────┘                   │
│  └──────────────────┘                                          │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  messages        │  │ message_forwards │                   │
│  ├──────────────────┤  ├──────────────────┤                   │
│  │ id (PK)          │  │ id (PK)          │                   │
│  │ message_id       │  │ message_id (FK)  │                   │
│  │ from_address     │  │ endpoint_type    │                   │
│  │ to_address       │  │ status           │                   │
│  │ subject          │  │ response_code    │                   │
│  │ body             │  │ timestamp        │                   │
│  │ status           │  └──────────────────┘                   │
│  │ retry_count      │                                          │
│  │ timestamp        │                                          │
│  └──────────────────┘                                          │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                     BUBBLE.IO INTEGRATION                       │
│                    bubble_service.py                            │
│                                                                 │
│  • Sync users from Bubble.io API → Local SQLite               │
│  • Pagination support (100 users/page)                         │
│  • Retry mechanism with exponential backoff                    │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                   FORWARDING ENDPOINTS                          │
│                                                                 │
│  LIVE:  https://app.split.lease/api/1.1/wf/core-parse-sms     │
│  DEV:   https://app.split.lease/version-test/api/1.1/         │
│         wf/core-parse-sms                                      │
│                                                                 │
│  Payload: {                                                     │
│    "sender": "5551234567",     // Normalized (no +1)          │
│    "proxy": "4155692985",      // Twilio number               │
│    "message_body": "Hello!"                                    │
│  }                                                              │
└────────────────────────────────────────────────────────────────┘
                     │
                     ▼
               BUBBLE.IO WORKFLOW
           (Business Logic Processing)
```

---

## SMS Forwarding Flow (Detailed)

### Step-by-Step: Incoming SMS

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Real User sends SMS to Twilio number                        │
│    FROM: +1-555-123-4567 (Guest's real phone)                  │
│    TO:   +1-415-569-2985 (Twilio proxy number)                 │
│    BODY: "Is the apartment still available?"                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Twilio Webhook → PythonAnywhere                             │
│    POST https://maskingapp.pythonanywhere.com/webhook/sms      │
│                                                                 │
│    Form Data:                                                   │
│    {                                                            │
│      "From": "+15551234567",                                   │
│      "To": "+14155692985",                                     │
│      "Body": "Is the apartment still available?",              │
│      "MessageSid": "SM...",                                    │
│      "AccountSid": "AC..."                                     │
│    }                                                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Flask app.py receives webhook                               │
│    Route: @app.route('/webhook/sms', methods=['POST'])         │
│                                                                 │
│    Code: sms_service.handle_incoming_sms(sms_data)             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. sms_service.py processes SMS                                │
│                                                                 │
│    A. Normalize phone numbers (remove +1 country code)         │
│       FROM: "+15551234567" → "5551234567"                      │
│       TO:   "+14155692985" → "4155692985"                      │
│                                                                 │
│    B. Record metrics                                            │
│       metrics['sms_received'].append(timestamp)                │
│       Save to sms_metrics.json                                 │
│                                                                 │
│    C. Prepare payload                                           │
│       {                                                         │
│         "sender": "5551234567",                                │
│         "proxy": "4155692985",                                 │
│         "message_body": "Is the apartment still available?"    │
│       }                                                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Forward to BOTH Live and Dev endpoints                      │
│                                                                 │
│    LIVE Request:                                                │
│    POST https://app.split.lease/api/1.1/wf/core-parse-sms      │
│    Headers: { "Content-Type": "application/json" }             │
│    Body: { "sender": "5551234567", ... }                       │
│                                                                 │
│    DEV Request:                                                 │
│    POST https://app.split.lease/version-test/api/1.1/          │
│         wf/core-parse-sms                                       │
│    (Same payload)                                               │
│                                                                 │
│    Timeout: 10 seconds each                                    │
│    Retry: None (fail fast)                                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Log results and save metrics                                │
│                                                                 │
│    IF live.status_code == 200:                                 │
│      metrics['sms_forwarded_success_live'].append(timestamp)   │
│    ELSE:                                                        │
│      metrics['sms_forwarded_error_live'].append(timestamp)     │
│                                                                 │
│    IF dev.status_code == 200:                                  │
│      metrics['sms_forwarded_success_dev'].append(timestamp)    │
│    ELSE:                                                        │
│      metrics['sms_forwarded_error_dev'].append(timestamp)      │
│                                                                 │
│    Save to sms_metrics.json                                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Return response to Twilio                                   │
│                                                                 │
│    {                                                            │
│      "status": "success",  // or "error"                       │
│      "live": true,         // Live endpoint success            │
│      "dev": true           // Dev endpoint success             │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Bubble.io workflow processes message                        │
│    (Business logic happens here - not in Python app)           │
│                                                                 │
│    • Lookup user pairs in Bubble database                      │
│    • Find recipient (host or guest)                            │
│    • Create in-app message thread                              │
│    • Send notification (email/SMS)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Pairing System

### How Masking Works

The masking is **NOT** implemented in the traditional "proxy number pool" sense. Instead:

1. **Single Twilio Number**: `+1-415-569-2985` (shared proxy for all conversations)
2. **User Pairing Database**: SQLite `user_pairs` table maps host ↔ guest relationships
3. **Lookup Logic**: When SMS arrives, the service forwards to Bubble.io with sender/proxy info
4. **Bubble.io Handles Routing**: Bubble workflow looks up the pair and routes the message

### Pairing Service Functions

#### `create_pair(user1_id, user2_id)`

```python
# Creates a new user pair or reactivates existing inactive pair

# Example:
pairing_service.create_pair(
    user1_id="1234567890",  # Host's Bubble user ID
    user2_id="0987654321"   # Guest's Bubble user ID
)

# Database:
INSERT INTO user_pairs (user1_id, user2_id, active, timestamp)
VALUES ('1234567890', '0987654321', 1, CURRENT_TIMESTAMP)

# Logs to Slack webhook:
{
  "event_type": "pair_created",
  "pair_id": 42,
  "user1_id": "1234567890",
  "user2_id": "0987654321",
  "user1_name": "Sarah",
  "user2_name": "John"
}
```

#### `get_user_pairs(user_id)`

```python
# Gets all active pairs for a user

pairs = pairing_service.get_user_pairs("1234567890")

# Returns:
[
  {
    "id": "42",
    "user1": {
      "id": "1234567890",
      "email": "sarah@example.com",
      "first_name": "Sarah",
      "last_name": "Johnson"
    },
    "user2": {
      "id": "0987654321",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Smith"
    },
    "active": true,
    "created_at": "2025-03-20 14:42:35"
  }
]
```

#### `get_users_by_phone(phone_number)`

```python
# Lookup users by phone number (normalized)

users = pairing_service.get_users_by_phone("+15551234567")

# Normalization:
# "+15551234567" → "+15551234567" (already normalized)
# "5551234567"   → "+15551234567" (add +1)
# "15551234567"  → "+15551234567" (add +)

# Query:
SELECT _id, first_name, last_name, email, phone_number
FROM bubble_users
WHERE phone_number = '+15551234567'

# Returns:
[
  {
    "_id": "1234567890",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com",
    "phone_number": "+15551234567"
  }
]
```

#### `remove_pair(user1_id, user2_id)`

```python
# Soft delete: Sets active = 0 instead of deleting

pairing_service.remove_pair("1234567890", "0987654321")

# Database:
UPDATE user_pairs
SET active = 0
WHERE (user1_id = '1234567890' AND user2_id = '0987654321')
   OR (user1_id = '0987654321' AND user2_id = '1234567890')
```

---

## Database Schema

### SQLite Database: `data/bubble.db`

```sql
-- Users table (synced from Bubble.io)
CREATE TABLE bubble_users (
    _id TEXT PRIMARY KEY,                    -- Bubble user ID
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    Type TEXT,                                -- "User Signup", "Trial Host", etc.
    phone_number TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User pairings (host-guest relationships)
CREATE TABLE user_pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id TEXT NOT NULL,                   -- FK to bubble_users._id
    user2_id TEXT NOT NULL,                   -- FK to bubble_users._id
    active INTEGER DEFAULT 1,                 -- 1 = active, 0 = inactive (soft delete)
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES bubble_users(_id),
    FOREIGN KEY (user2_id) REFERENCES bubble_users(_id),
    UNIQUE(user1_id, user2_id)
);

-- Email messages
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE,                   -- Email message ID
    from_address TEXT,
    to_address TEXT,
    subject TEXT,
    body TEXT,
    status TEXT DEFAULT 'pending',            -- pending, processed, error
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    raw_content BLOB,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_timestamp DATETIME
);

-- Message forwarding log
CREATE TABLE message_forwards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT,                          -- FK to messages.message_id
    endpoint_type TEXT,                       -- 'live' or 'dev'
    status TEXT,                              -- 'success' or 'error'
    response_code INTEGER,
    error_message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(message_id)
);

-- Phone masking table (referenced in code, may not be fully implemented)
CREATE TABLE phone_masks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,                             -- FK to bubble_users._id
    real_phone TEXT,                          -- User's actual phone number
    masked_phone TEXT,                        -- Proxy number (Twilio number)
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES bubble_users(_id)
);

-- Schema version tracking
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Sample Data

**bubble_users**:
```
_id          | email             | first_name | last_name | phone_number   | Type
-------------|-------------------|------------|-----------|----------------|--------------
1234567890   | sarah@example.com | Sarah      | Johnson   | +15551234567   | User Signup
0987654321   | john@example.com  | John       | Smith     | +15559876543   | Trial Host
```

**user_pairs**:
```
id | user1_id   | user2_id   | active | timestamp
---|------------|------------|--------|-------------------
1  | 1234567890 | 0987654321 | 1      | 2025-03-20 14:42:35
```

**Interpretation**: Sarah (Guest) and John (Host) are paired. When Sarah texts the Twilio number, the SMS is forwarded to Bubble, which routes it to John's in-app messages.

---

## Bubble.io Integration

### User Sync Process

```python
# bubble_service.py

class BubbleService:
    def sync_users_from_bubble(self):
        """Fetch all users from Bubble.io API and sync to local database"""

        # Pagination: 100 users per page
        page = 0
        all_users = []

        while True:
            # API Request
            url = f"{BUBBLE_BASE_URL}/api/1.1/obj/user"
            params = {
                "cursor": page * 100,
                "limit": 100
            }
            headers = {"Authorization": f"Bearer {BUBBLE_API_TOKEN}"}

            response = requests.get(url, params=params, headers=headers)
            data = response.json()

            users = data.get('response', {}).get('results', [])
            if not users:
                break  # No more users

            all_users.extend(users)
            page += 1
            time.sleep(0.5)  # Rate limiting

        # Update local database
        for user in all_users:
            db.execute('''
                INSERT OR REPLACE INTO bubble_users
                (_id, email, first_name, last_name, Type, phone_number)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                user['_id'],
                user.get('email'),
                user.get('first_name'),
                user.get('last_name'),
                user.get('Type'),
                user.get('phone_number')
            ))
```

### API Endpoints

**Base URL**: `https://www.split.lease`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/bubble/sync` | POST | Manually trigger user sync from Bubble.io |
| `/bubble/users/count` | GET | Get total user count in local DB |
| `/bubble/users/search?field={field}&value={value}` | GET | Search users by field (_id, phone_number, email, first_name, last_name) |

---

## Email Forwarding (Parallel System)

The backup also includes a complete email forwarding system:

### Email Monitor (Background Daemon)

```python
# email_monitor.py

class EmailMonitor:
    """Monitors Gmail IMAP for new emails and forwards to Bubble.io"""

    def __init__(self, imap_server, email_address, email_password):
        self.imap = imaplib.IMAP4_SSL(imap_server)
        self.imap.login(email_address, email_password)

    def poll_emails(self):
        """Poll for new emails every 6 seconds"""
        self.imap.select('INBOX')
        _, message_ids = self.imap.search(None, 'UNSEEN')

        for msg_id in message_ids[0].split():
            _, msg_data = self.imap.fetch(msg_id, '(RFC822)')
            email_body = msg_data[0][1]

            # Parse email
            email_message = email.message_from_bytes(email_body)

            # Forward to Bubble.io
            email_forwarder.forward_email(
                from_address=email_message['From'],
                to_address=email_message['To'],
                subject=email_message['Subject'],
                body=self.extract_body(email_message)
            )
```

### Email Forwarding Endpoints

**LIVE**: `https://app.split.lease/api/1.1/wf/core-parse-email`
**DEV**: `https://app.split.lease/version-test/api/1.1/wf/core-parse-email`

**Payload**:
```json
{
  "from": "sender@example.com",
  "to": "recipient@split.lease",
  "subject": "Question about listing",
  "body": "Email body text...",
  "timestamp": "2025-03-20T14:42:35"
}
```

---

## Configuration

### Environment Variables (.env)

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+14155692985

# Bubble.io Integration
BUBBLE_BASE_URL=https://www.split.lease
BUBBLE_API_TOKEN=...

# SMS Forwarding Endpoints
SMS_ENABLED=true
SMS_LIVE_ENDPOINT=https://app.split.lease/api/1.1/wf/core-parse-sms
SMS_DEV_ENDPOINT=https://app.split.lease/version-test/api/1.1/wf/core-parse-sms

# Email Forwarding Endpoints
EMAIL_LIVE_ENDPOINT=https://app.split.lease/api/1.1/wf/core-parse-email
EMAIL_DEV_ENDPOINT=https://app.split.lease/version-test/api/1.1/wf/core-parse-email

# Email Monitor Configuration
IMAP_SERVER=imap.gmail.com
EMAIL_ADDRESS=masking@split.lease
EMAIL_PASSWORD=...

# Webhook Logging
WEBHOOK_URL=https://hooks.slack.com/services/...

# Processing Configuration
POLL_INTERVAL=6              # seconds between email checks
MAX_EMAILS_PER_BATCH=50
RETRY_DELAY=300              # seconds
MAX_RETRIES=3
```

---

## Metrics Tracking

### SMS Metrics (`sms_metrics.json`)

```json
{
  "sms_received": [
    "2025-03-20T14:42:35.558061",
    "2025-03-20T14:42:40.482445",
    // ... 118 total entries
    "2025-08-13T14:57:34.706695"
  ],
  "sms_forwarded_success_live": [
    "2025-03-20T14:42:35.600000",
    // ... successful forwards to Live endpoint
  ],
  "sms_forwarded_success_dev": [
    "2025-03-20T14:42:35.650000",
    // ... successful forwards to Dev endpoint
  ],
  "sms_forwarded_error_live": [],
  "sms_forwarded_error_dev": []
}
```

### Metrics Dashboard

```python
# sms_service.py

def get_24h_metrics(self):
    """Get SMS metrics for last 24 hours"""
    now = datetime.now()
    cutoff = now - timedelta(hours=24)

    # Filter metrics to last 24 hours
    received_24h = filter_by_time(self.metrics['sms_received'], cutoff)
    success_live_24h = filter_by_time(self.metrics['sms_forwarded_success_live'], cutoff)

    return {
        'total_received': len(received_24h),
        'live_success': len(success_live_24h),
        'dev_success': len(success_dev_24h),
        'success_rate': calculate_success_rate(...),
        'time_window': {
            'start': cutoff.isoformat(),
            'end': now.isoformat()
        }
    }
```

---

## Security Analysis

### ⚠️ Security Concerns Identified

1. **No Twilio Signature Verification**
   - Code: `@app.route('/webhook/sms', methods=['POST'])`
   - Issue: Does NOT verify Twilio's `X-Twilio-Signature` header
   - Risk: Anyone can send fake SMS webhooks
   - **Mitigation needed**: Implement signature verification

   ```python
   # SHOULD ADD:
   from twilio.request_validator import RequestValidator

   validator = RequestValidator(TWILIO_AUTH_TOKEN)
   signature = request.headers.get('X-Twilio-Signature', '')
   url = request.url
   params = request.form

   if not validator.validate(url, params, signature):
       return jsonify({'error': 'Invalid signature'}), 401
   ```

2. **Credentials in .env File**
   - ⚠️ `TWILIO_AUTH_TOKEN` present in `.env`
   - ⚠️ `BUBBLE_API_TOKEN` present in `.env`
   - ⚠️ `EMAIL_PASSWORD` present in `.env`
   - ✅ File is `.gitignore`d
   - ⚠️ But accessible on PythonAnywhere server

3. **No Rate Limiting**
   - SMS webhook has no rate limits
   - Risk: SMS spam attack could overwhelm Bubble.io endpoints
   - **Recommendation**: Add rate limiting per phone number

4. **Single Shared Proxy Number**
   - All conversations use same Twilio number: `+1-415-569-2985`
   - Limitation: Users can't save "their host's number" separately
   - Confusion: Multiple hosts/guests all appear from same number

5. **No Message Encryption**
   - SMS/Email content sent to Bubble.io in plain text
   - Database stores messages unencrypted
   - **Recommendation**: Implement E2EE or encrypt at rest

6. **Soft Delete User Pairs**
   - Pairing removal sets `active = 0` instead of deleting
   - ✅ Good: Audit trail preserved
   - ⚠️ Risk: Accidental reactivation of old pairs

### ✅ Security Features Present

1. **HTTPS Only**
   - All endpoints use HTTPS
   - Bubble.io endpoints require TLS

2. **SQL Injection Protection**
   - Uses parameterized queries: `cursor.execute(query, (param1, param2))`
   - No string concatenation in SQL

3. **Foreign Key Constraints**
   - Database enforces referential integrity
   - Can't pair non-existent users

4. **Webhook Logging**
   - All events logged to Slack webhook
   - Audit trail for debugging and monitoring

---

## Why Was It Decommissioned?

Based on metrics analysis:

1. **Last Activity**: August 13, 2025 (5 months ago)
2. **Total Usage**: 118 SMS messages over 5 months (March-August 2025)
3. **Low Volume**: ~24 messages/month = ~0.8 messages/day

**Hypothesis**: Service was **pilot tested** but not adopted:
- Feature may not have gained user traction
- Bubble.io in-app messaging proved sufficient
- Cost/complexity didn't justify low usage
- Moved to in-app only messaging

---

## Migration to Current Codebase (If Needed)

### Option 1: Restore to PythonAnywhere

```bash
# 1. Copy backup to active codebase
cp -r "c:\Users\Split Lease\Downloads\backup021326" \
      "C:\Users\Split Lease\Documents\splitlease_monorepo\pythonanywhere\maskingAndForward"

# 2. Update pythonanywhere/maskingAndForward/.env
# - Set environment variables
# - Update Bubble.io endpoints if changed

# 3. Deploy to PythonAnywhere
# - Upload code to PythonAnywhere
# - Install requirements: pip install -r requirements.txt
# - Configure WSGI to point to app.py

# 4. Update Twilio webhook URL
# - Twilio Console → Phone Numbers → +1-415-569-2985
# - Messaging webhook URL: https://maskingapp.pythonanywhere.com/webhook/sms
```

### Option 2: Migrate to Supabase Edge Functions

**Create new edge function**: `supabase/functions/sms-masking-proxy/`

```typescript
// supabase/functions/sms-masking-proxy/index.ts

import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req: Request) => {
  // 1. Receive Twilio webhook
  const formData = await req.formData();
  const fromNumber = formData.get('From');
  const toNumber = formData.get('To');
  const messageBody = formData.get('Body');

  // 2. Normalize phone numbers
  const sender = normalizePhone(fromNumber);
  const proxy = normalizePhone(toNumber);

  // 3. Lookup user pair in Supabase
  const { data: pair } = await supabase
    .from('user_pairs')
    .select('user1_id, user2_id')
    .or(`user1_phone.eq.${sender},user2_phone.eq.${sender}`)
    .eq('active', true)
    .single();

  // 4. Forward to in-app messaging
  const recipientId = pair.user1_phone === sender ? pair.user2_id : pair.user1_id;

  await supabase.from('messages').insert({
    thread_id: pair.thread_id,
    sender_id: senderId,
    body: messageBody,
    source: 'sms_proxy'
  });

  // 5. Return success to Twilio
  return new Response(null, { status: 200 });
});
```

**Database migration**:
```sql
-- Add phone fields to user table
ALTER TABLE user ADD COLUMN phone_verified BOOLEAN DEFAULT false;

-- Create phone_masks table
CREATE TABLE phone_masks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user(id),
  real_phone TEXT NOT NULL,
  masked_phone TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Option 3: Keep Decommissioned (Recommended)

**Rationale**:
- Low usage (0.8 SMS/day) doesn't justify maintenance
- In-app messaging already exists and works
- Adds complexity without clear value
- Users can exchange phone numbers manually if needed

**Action Items**:
1. ✅ Document the architecture (this document)
2. ✅ Archive backup in safe location
3. ✅ Remove from active codebase (already done)
4. ✅ Update README to clarify "in-app messaging only"

---

## Files Inventory

### Backup Directory: `c:\Users\Split Lease\Downloads\backup021326\`

| File | Lines | Purpose |
|------|-------|---------|
| **app.py** | 177 | Main Flask application entry point |
| **sms_service.py** | 250 | SMS forwarding service (Twilio → Bubble.io) |
| **pairing_service.py** | 645 | User pairing management |
| **database_service.py** | ~700 | SQLite database operations |
| **bubble_service.py** | ~500 | Bubble.io API integration |
| **email_service.py** | ~250 | Email forwarding service |
| **email_monitor.py** | ~300 | Gmail IMAP monitor daemon |
| **email_daemon.py** | ~260 | Email monitoring daemon |
| **config.py** | 111 | Configuration management |
| **utils.py** | ~50 | Utility functions |
| **requirements.txt** | 8 | Python dependencies |
| **README.md** | 404 | Service documentation |

### Data Files

| File | Size | Records |
|------|------|---------|
| **sms_metrics.json** | 12 KB | 118 SMS received |
| **email_metrics.json** | 709 KB | Email activity log |
| **data/bubble.db** | 458 KB | SQLite database |
| **data/emails.db** | 81 KB | Email message cache |

### Dependencies (`requirements.txt`)

```
Flask==2.0.1
requests==2.26.0
python-dotenv==0.19.0
twilio==7.3.0  # (implied, not in file)
```

---

## Conclusions

1. **Full Service Exists**: Complete SMS/Email masking and forwarding system
2. **Architecture**: Flask (PythonAnywhere) → Twilio webhooks → Bubble.io workflows
3. **Status**: Decommissioned after low adoption (118 SMS over 5 months)
4. **Security**: Functional but lacks Twilio signature verification
5. **Data**: Users synced from Bubble.io, pairs managed in SQLite
6. **Current State**: Archived in backup, removed from active codebase

**Recommendation**: Keep decommissioned unless product requirements change. In-app messaging is sufficient for current needs.

---

**Investigation Complete**
**Backup Location**: `c:\Users\Split Lease\Downloads\backup021326\`
**Status**: Fully documented and understood
