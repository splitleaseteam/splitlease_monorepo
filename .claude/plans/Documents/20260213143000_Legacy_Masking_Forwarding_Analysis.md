# Legacy Masking & Forwarding System Analysis

**Date**: 2026-02-13
**Source**: `C:\Users\Split Lease\Downloads\backup021326` (Python Backend Backup)
**Purpose**: Document the complete business logic for email and SMS masking/forwarding from the legacy Python system

---

## Executive Summary

The legacy Python backend implemented a **dual-channel communication masking and forwarding system** for both email and SMS. The system:
1. Receives communications from external sources (email via IMAP, SMS via Twilio webhooks)
2. Validates sender/receiver against a paired user database
3. Forwards masked communications to both Live and Dev Bubble.io API endpoints
4. Tracks metrics and maintains audit logs

**Key Finding**: The system does NOT perform masking at the Python layer. Instead, it acts as a **forwarding proxy** that sends communication data to Bubble.io endpoints where the actual masking logic resides.

---

## System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    LEGACY PYTHON BACKEND                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐        ┌──────────────┐                 │
│  │ Email Daemon │        │  SMS Service │                 │
│  │ (IMAP Poll)  │        │ (Twilio Hook)│                 │
│  └──────┬───────┘        └──────┬───────┘                 │
│         │                       │                          │
│         ▼                       ▼                          │
│  ┌────────────────────────────────────┐                   │
│  │     Email/SMS Forwarder            │                   │
│  │  - Validates sender exists         │                   │
│  │  - Normalizes phone numbers        │                   │
│  │  - Cleans email bodies             │                   │
│  └────────┬───────────────────────────┘                   │
│           │                                                │
│           ▼                                                │
│  ┌────────────────────────────────────┐                   │
│  │    Bubble Service Integration      │                   │
│  │  - Syncs user database             │                   │
│  │  - Validates user pairings         │                   │
│  └────────┬───────────────────────────┘                   │
│           │                                                │
│           ▼                                                │
│  ┌─────────────────────────────────────┐                  │
│  │  Forward to Bubble.io Endpoints     │                  │
│  │  - Live: app.split.lease/api/...   │                  │
│  │  - Dev:  app.split.lease/version-test/api/...         │
│  └─────────────────────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Email Masking & Forwarding

### 1.1 Email Flow

**Source**: `email_daemon.py` (lines 1-629)

```
[Gmail IMAP] → [Email Daemon] → [Email Service] → [Bubble API]
     ↓              ↓                ↓                  ↓
  Poll every     Extract         Forward to        Process &
  9 seconds      & Clean         Live + Dev         Mask
```

### 1.2 Email Processing Logic

#### Step 1: Email Retrieval
- **Polling Interval**: 9 seconds (`email_daemon.py:605`)
- **IMAP Server**: `imap.gmail.com` (configurable via `config.py:42`)
- **Search Criteria**: `UNSEEN SINCE "{server_date}"` (`email_daemon.py:475`)
- **Timezone Handling**: Server time adjusted -4 hours from local time (`email_daemon.py:431`)

#### Step 2: Email Body Extraction & Cleaning
**Location**: `email_daemon.py:284-386`

**HTML Email Processing**:
```python
# Removes quote markers and conversation history
for div in soup.find_all(['div', 'blockquote'], class_=['gmail_quote', 'quote']):
    div.decompose()

# Removes reply/forward markers
for elem in soup.find_all(text=True):
    if any(marker in elem.string for markers in ['From:', 'Sent:', 'To:', '> ']):
        elem.extract()
```

**Reply Chain Removal**:
```python
# Pattern: "On Mon, Jan 15, 2025 at 2:30 PM John Doe <john@example.com>"
pattern = r'(?i)(On [A-Za-z]{3}, [A-Za-z]{3} \d{1,2}, \d{4} at \d{1,2}:\d{2}\s?[APM]{2} .*<[^>]+>)'
# Truncates email body at this pattern
```

#### Step 3: Email Forwarding
**Location**: `email_daemon.py:150-267` and `email_service.py:65-189`

**Payload Structure**:
```json
{
  "body": {
    "sender": "user@example.com",          // From email address
    "proxy": "masked@split.lease",         // To email address (proxy)
    "subject": "Email subject",
    "message_body": "Cleaned email body",
    "headers": {                            // Full email headers for debugging
      "From": "...",
      "To": "...",
      "Date": "..."
    }
  }
}
```

**Dual Endpoint Strategy**:
```python
# Live Endpoint
POST https://app.split.lease/api/1.1/wf/core-parse-email

# Dev Endpoint
POST https://app.split.lease/version-test/api/1.1/wf/core-parse-email
```

**Success Criteria**:
- Overall success if **at least one** endpoint returns 200
- Tracks success/error separately for Live and Dev
- Email marked as read only on successful forward

#### Step 4: Metrics Tracking
**Location**: `email_counter.py:1-82`

**Tracked Metrics**:
- `parsed`: Total emails processed
- `accepted_live`: Successfully forwarded to Live
- `accepted_dev`: Successfully forwarded to Dev
- `rejected`: Failed to forward to any endpoint

---

## 2. SMS Masking & Forwarding

### 2.1 SMS Flow

**Source**: `sms_service.py` (lines 1-250)

```
[Twilio] → [Flask Webhook] → [SMS Service] → [Bubble API]
   ↓           ↓                  ↓              ↓
  POST    /webhook/sms      Forward to     Process &
  data                      Live + Dev      Mask
```

### 2.2 SMS Processing Logic

#### Step 1: Webhook Reception
**Location**: `app.py:90-123`

**Twilio Webhook Payload** (Received as `request.form`):
```python
{
  'From': '+12345678901',      # Sender phone number
  'To': '+19876543210',        # Twilio proxy number
  'Body': 'Message text'       # SMS message body
}
```

#### Step 2: Phone Number Normalization
**Location**: `sms_service.py:98-107`

```python
# Remove +1 country code for US numbers
if from_number.startswith('+1'):
    from_number = from_number[2:]  # +12345678901 → 2345678901
elif from_number.startswith('1'):
    from_number = from_number[1:]  # 12345678901 → 2345678901

# Same normalization for To number
```

**Note**: This normalization is for **forwarding purposes only**. The actual phone masking happens in Bubble.

#### Step 3: SMS Forwarding
**Location**: `sms_service.py:87-196`

**Payload Structure**:
```json
{
  "sender": "2345678901",        // Normalized sender (no country code)
  "proxy": "9876543210",         // Normalized proxy number
  "message_body": "Message text"
}
```

**Dual Endpoint Strategy**:
```python
# Live Endpoint
POST https://app.split.lease/api/1.1/wf/core-parse-sms

# Dev Endpoint
POST https://app.split.lease/version-test/api/1.1/wf/core-parse-sms
```

**Success Criteria**:
- Overall success if **at least one** endpoint returns 200
- Separate tracking for Live and Dev success/errors
- Metrics persisted to `sms_metrics.json`

#### Step 4: Metrics Tracking
**Location**: `sms_service.py:29-85, 198-249`

**Tracked Metrics**:
```python
{
  'sms_received': [],                    # Timestamps of received SMS
  'sms_forwarded_success_live': [],      # Live endpoint successes
  'sms_forwarded_success_dev': [],       # Dev endpoint successes
  'sms_forwarded_error_live': [],        # Live endpoint errors
  'sms_forwarded_error_dev': []          # Dev endpoint errors
}
```

**24-Hour Rolling Window**:
- Filters metrics to last 24 hours
- Calculates success rate: `(total_successes / total_forwarded) * 100`

---

## 3. User Pairing System

### 3.1 Database Schema

**Location**: `database_service.py:107-129`

**bubble_users Table**:
```sql
CREATE TABLE bubble_users (
    _id TEXT PRIMARY KEY,              -- Bubble user ID
    email TEXT UNIQUE,                 -- User email
    first_name TEXT,
    last_name TEXT,
    Type TEXT,                         -- User type (e.g., "User Signup")
    phone_number TEXT,                 -- Normalized phone: +12345678901
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**user_pairs Table**:
```sql
CREATE TABLE user_pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id TEXT NOT NULL,            -- Foreign key → bubble_users._id
    user2_id TEXT NOT NULL,            -- Foreign key → bubble_users._id
    active INTEGER DEFAULT 1,          -- 1 = active, 0 = inactive
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES bubble_users(_id),
    FOREIGN KEY (user2_id) REFERENCES bubble_users(_id),
    UNIQUE(user1_id, user2_id)
)
```

**phone_masks Table** (Referenced but not created in schema):
```sql
-- This table is referenced in pairing_service.py:590,603
-- but NOT created in database_service.py
-- Suggests incomplete/deprecated feature
SELECT masked_phone FROM phone_masks
WHERE user_id = ? AND real_phone = ? AND active = 1

INSERT INTO phone_masks (user_id, real_phone, masked_phone)
VALUES (?, ?, ?)
```

### 3.2 Pairing Business Logic

**Location**: `pairing_service.py`

#### Create Pair (`create_pair` - lines 17-128)

**Rules**:
1. Verify both users exist in Bubble via `bubble_service.get_bubble_user()`
2. Check for existing **active** pair → reject if exists
3. Check for existing **inactive** pair → reactivate if exists
4. Create new pair if no existing pair found
5. Log to webhook service with user details

**Reactivation Logic**:
```python
if existing_inactive_pair:
    # Reactivate instead of creating new
    UPDATE user_pairs
    SET active = 1, timestamp = CURRENT_TIMESTAMP
    WHERE id = ?
```

#### Remove Pair (`remove_pair` - lines 130-175)

**Rules**:
1. Check if pair exists and is active
2. Set `active = 0` (soft delete, does not physically remove)
3. Log to webhook service

#### Get User Pairs (`get_user_pairs` - lines 205-299)

**Query**:
```sql
SELECT p.id, p.user1_id, p.user2_id, p.active, p.timestamp,
       u1.email, u1.first_name, u1.last_name,
       u2.email, u2.first_name, u2.last_name
FROM user_pairs p
LEFT JOIN bubble_users u1 ON p.user1_id = u1._id
LEFT JOIN bubble_users u2 ON p.user2_id = u2._id
WHERE (p.user1_id = ? OR p.user2_id = ?)
AND p.active = 1
```

**Returns**:
```python
[{
  'id': '123',
  '_id': '123',
  'user1': {
    'id': 'bubble_user_1',
    'email': 'user1@example.com',
    'first_name': 'John',
    'last_name': 'Doe'
  },
  'user2': {
    'id': 'bubble_user_2',
    'email': 'user2@example.com',
    'first_name': 'Jane',
    'last_name': 'Smith'
  },
  'active': True,
  'created_at': '2025-01-15 14:30:00'
}]
```

### 3.3 Phone Number Normalization

**Location**: `pairing_service.py:414-443`

```python
def normalize_phone_number(self, phone):
    # Remove non-digit characters
    digits = ''.join(filter(str.isdigit, phone))

    # Handle US/Canada numbers
    if len(digits) == 10:
        return f"+1{digits}"           # 2345678901 → +12345678901
    elif len(digits) == 11 and digits.startswith('1'):
        return f"+{digits}"            # 12345678901 → +12345678901
    elif len(digits) >= 11:
        return f"+{digits}"            # Already has country code

    return phone  # Invalid format, return original
```

---

## 4. Bubble.io Integration

### 4.1 User Synchronization

**Location**: `bubble_service.py:78-203`

**Bubble API Endpoint**:
```
GET https://upgradefromstr.bubbleapps.io/version-test/api/1.1/obj/user
```

**Pagination**:
- Page size: 100 users per request
- Uses cursor-based pagination
- Continues until `remaining = 0`

**Extracted User Fields**:
```python
{
  '_id': user_data.get('_id'),
  'email': extracted_from_authentication_object,  # See note below
  'first_name': user_data.get('Name - First'),
  'last_name': user_data.get('Name - Last'),
  'Type': user_data.get('Type'),
  'phone_number': normalize_phone_number(user_data.get('Phone Number (as text)'))
}
```

**Email Extraction Priority** (`bubble_service.py:33-61`):
1. `authentication.Google.email` (Google OAuth)
2. `authentication.email.email` (Email auth)
3. `authentication.LinkedIn.email` (LinkedIn OAuth)
4. Fallback to `Email`, `email`, `email_address`, `emailAddress` fields

### 4.2 User Lookup Methods

**By Email** (`get_user_by_email` - lines 243-311):
1. Local database lookup (case-insensitive)
2. If not found → Bubble API search with constraint:
   ```python
   {'key': 'authentication.email.email',
    'constraint_type': 'equals',
    'value': email}
   ```
3. Update local database if found in API

**By Phone** (`get_bubble_user_by_phone` - lines 417-494):
1. Normalize phone number
2. Convert to Bubble format: `+12345678901` → `+2345678901` (remove country code digit)
3. Search Bubble API:
   ```python
   {'key': 'Phone Number (as text)',
    'constraint_type': 'equals',
    'value': bubble_number}
   ```

**By ID** (`get_bubble_user` - lines 313-366):
1. Local database lookup
2. If not found → Direct API fetch: `GET /user/{user_id}`
3. Update local database if found

---

## 5. Configuration & Endpoints

### 5.1 Environment Configuration

**Location**: `config.py` and `.env`

```python
# Email Endpoints
EMAIL_LIVE_ENDPOINT = 'https://app.split.lease/api/1.1/wf/core-parse-email'
EMAIL_DEV_ENDPOINT = 'https://app.split.lease/version-test/api/1.1/wf/core-parse-email'

# SMS Endpoints
SMS_LIVE_ENDPOINT = 'https://app.split.lease/api/1.1/wf/core-parse-sms'
SMS_DEV_ENDPOINT = 'https://app.split.lease/version-test/api/1.1/wf/core-parse-sms'

# IMAP Configuration
IMAP_SERVER = 'imap.gmail.com'
EMAIL_ADDRESS = os.getenv('EMAIL_ADDRESS')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')

# Bubble Base URL
BUBBLE_BASE_URL = 'https://www.split.lease'

# Polling & Retry
POLL_INTERVAL = 6  # seconds (but email daemon uses 9 seconds)
MAX_RETRIES = 3
RETRY_DELAY = 300  # seconds
```

### 5.2 Flask API Endpoints

**Location**: `app.py`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/webhook/sms` | POST | Twilio SMS webhook receiver |
| `/email-webhook` | POST | Email webhook (stub implementation) |
| `/monitor/status` | GET | Email monitoring status |
| `/health` | GET | Health check |
| `/` | GET | Service status and configuration info |

---

## 6. Email/SMS Templates

### 6.1 No Template System Found

**Key Finding**: The legacy Python system does NOT contain any email or SMS message templates.

**Rationale**:
- Email bodies are **forwarded as-is** after cleaning (removing reply chains, HTML)
- SMS bodies are **forwarded verbatim**
- No template rendering, no variable substitution, no message composition
- The Python backend acts purely as a **forwarding proxy**

**Implication**: Message templates and masking logic must reside in the **Bubble.io workflows** that receive the forwarded data at the `/wf/core-parse-email` and `/wf/core-parse-sms` endpoints.

---

## 7. Business Rules Summary

### 7.1 Email Business Rules

1. **Polling Frequency**: Check for new emails every 9 seconds
2. **Time Window**: Only process emails from "today" (with 4-hour server offset)
3. **Mark as Read**: Only mark email as read if successfully forwarded to at least one endpoint
4. **Retry on Failure**: Leave email unread for automatic retry on next poll
5. **Body Cleaning**: Remove HTML, reply chains, email quotes before forwarding
6. **Dual Endpoint**: Always send to both Live and Dev, success if either succeeds

### 7.2 SMS Business Rules

1. **Real-time Processing**: Process SMS immediately via webhook (no polling)
2. **Phone Normalization**: Remove `+1` country code before forwarding
3. **Dual Endpoint**: Always send to both Live and Dev, success if either succeeds
4. **Metrics Persistence**: Save metrics after each SMS for durability
5. **No Retry Logic**: One-shot forward, relies on Bubble endpoint reliability

### 7.3 User Pairing Rules

1. **One Active Pair Per User Pair**: Cannot create duplicate active pairs
2. **Reactivation Over Recreation**: Reactivate inactive pairs instead of creating new ones
3. **Soft Delete**: Deactivating a pair sets `active = 0`, doesn't delete record
4. **Bidirectional Lookup**: `(user1, user2)` and `(user2, user1)` treated as same pair
5. **Foreign Key Integrity**: Both users must exist in `bubble_users` before pairing

### 7.4 Phone Masking Rules

**Incomplete Implementation**:
- `get_or_create_phone_mask()` function exists in `pairing_service.py:581-618`
- References `phone_masks` table that doesn't exist in schema
- Returns `TWILIO_PHONE_NUMBER` as masked phone for all users
- **Conclusion**: Phone masking was planned but never fully implemented

---

## 8. Key Observations & Insights

### 8.1 System Strengths

1. **Dual Endpoint Reliability**: Forwards to both Live and Dev, succeeds if either works
2. **Robust Error Handling**: Comprehensive try/catch blocks with detailed logging
3. **Metrics Tracking**: Persistent metrics for monitoring and debugging
4. **Email Cleaning**: Sophisticated HTML parsing and reply chain removal
5. **Database Backup**: Automatic database backup on corruption detection

### 8.2 System Weaknesses

1. **No Retry Queue**: Failed forwards are not queued for retry, rely on email re-polling
2. **Incomplete Phone Masking**: `phone_masks` table referenced but never created
3. **Hardcoded Twilio Number**: All masked phones use same Twilio proxy number
4. **No Rate Limiting**: Could overwhelm Bubble endpoints during high volume
5. **Security Concerns**: Database credentials and API keys in `.env` file only

### 8.3 Critical Dependencies

1. **Bubble.io Availability**: Entire system depends on Bubble endpoints being up
2. **Gmail IMAP Access**: Email system breaks if IMAP access is revoked
3. **Twilio Webhooks**: SMS system relies on Twilio webhook reliability
4. **Local SQLite**: No database replication, single point of failure

---

## 9. Migration Considerations

### 9.1 What to Preserve

1. **Email Cleaning Logic**: HTML parsing, reply chain removal is valuable
2. **Phone Normalization**: Consistent `+1XXXXXXXXXX` format
3. **Dual Endpoint Pattern**: Live/Dev separation for testing
4. **Metrics Structure**: Comprehensive tracking for monitoring
5. **User Pairing Logic**: Bidirectional lookups, soft deletes, reactivation

### 9.2 What to Improve

1. **Complete Phone Masking**: Implement `phone_masks` table and dynamic mask assignment
2. **Retry Queue**: Add message queue (e.g., Redis, RabbitMQ) for failed forwards
3. **Rate Limiting**: Implement request throttling to protect Bubble endpoints
4. **Template System**: Add email/SMS templates at the Python layer for flexibility
5. **Database Migration**: Move from SQLite to PostgreSQL for scalability

### 9.3 Bubble.io Dependency Analysis

**The Python backend is a "dumb pipe"**:
- No masking logic
- No template rendering
- No business rules for when to mask

**All intelligence is in Bubble.io**:
- User pair validation
- Decision to mask or not mask
- Template composition
- Delivery routing

**Recommendation**: When migrating to Supabase, replicate the Bubble workflows:
1. Identify the Bubble workflows at `/wf/core-parse-email` and `/wf/core-parse-sms`
2. Document their logic (user lookup, pairing check, masking decision, delivery)
3. Re-implement in Supabase Edge Functions or application layer

---

## 10. Next Steps

1. **Export Bubble.io Workflows**: Export the `core-parse-email` and `core-parse-sms` workflows from Bubble
2. **Document Masking Logic**: Reverse-engineer how Bubble decides to mask communications
3. **Design New Architecture**: Plan Supabase-based replacement for entire flow
4. **Implement Phone Masking**: Complete the incomplete `phone_masks` feature
5. **Add Template System**: Create email/SMS template system for flexibility

---

## Appendix A: File Inventory

| File | LOC | Purpose |
|------|-----|---------|
| `email_daemon.py` | 629 | IMAP email polling and forwarding |
| `email_service.py` | 190 | Email forwarding to Bubble endpoints |
| `sms_service.py` | 250 | SMS webhook handling and forwarding |
| `pairing_service.py` | 645 | User pairing management |
| `bubble_service.py` | 495 | Bubble.io API integration |
| `database_service.py` | 856 | SQLite database management |
| `config.py` | 111 | Configuration management |
| `app.py` | 177 | Flask web server |
| `email_counter.py` | 82 | Email metrics tracking |
| `slack_webhook_logs.py` | ~200 | Webhook logging service |

**Total Lines of Code**: ~3,635 LOC

---

## Appendix B: Key Dependencies

```
Flask==2.x              # Web framework
requests==2.x           # HTTP client
imaplib (stdlib)        # Email retrieval
email (stdlib)          # Email parsing
sqlite3 (stdlib)        # Database
BeautifulSoup4          # HTML parsing
html2text              # HTML to text conversion
python-dotenv          # Environment variables
logging (stdlib)        # Logging
```

---

## Appendix C: Database ERD

```
┌─────────────────────────┐
│     bubble_users        │
│─────────────────────────│
│ _id (PK)               │
│ email (UNIQUE)          │
│ first_name              │
│ last_name               │
│ Type                    │
│ phone_number            │
│ timestamp               │
└────────┬────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────────┐
│      user_pairs         │
│─────────────────────────│
│ id (PK, AUTO_INCREMENT) │
│ user1_id (FK)          │──┐
│ user2_id (FK)          │──┤
│ active                  │  │
│ timestamp               │  │
└─────────────────────────┘  │
         ▲                    │
         └────────────────────┘
         Self-referential FK

┌─────────────────────────┐
│     phone_masks         │ ← REFERENCED BUT NOT CREATED
│─────────────────────────│
│ user_id (FK)           │
│ real_phone              │
│ masked_phone            │
│ active                  │
└─────────────────────────┘
```

---

**End of Analysis**
