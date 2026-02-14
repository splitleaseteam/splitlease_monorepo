# Orphaned Masking Tables - Database Schema Analysis
**Date**: 2026-02-13
**Discovery**: User-provided database schemas
**Status**: ⚠️ ORPHANED TABLES (Not used by active code)

---

## Executive Summary

The Supabase database contains **masking and proxy infrastructure tables** that are **NO LONGER USED** by the active codebase:

| Table | Purpose | Status |
|-------|---------|--------|
| `multimessage` | Unified message handling (email/SMS) | ⚠️ ORPHANED |
| `proxysmssession` | SMS proxy session management | ⚠️ ORPHANED |
| `os_proxy_sms_channels` | Proxy phone number pool | ⚠️ ORPHANED |
| `notificationsettingsos_lists_` | Array-based notification preferences | ✅ ACTIVE (frontend only) |

**Key Finding**: These tables exist from the **Bubble.io migration** but are not referenced by any Supabase Edge Functions or frontend code.

---

## 1. Orphaned Table: `multimessage`

### Schema
```sql
CREATE TABLE public.multimessage (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  original_created_at TIMESTAMPTZ NOT NULL,

  -- Email Masking Fields
  email_message_id TEXT,
  email_processed BOOLEAN,
  email_steps JSONB,
  masked_email_proxy TEXT,          -- Masked email address
  message_id_header TEXT,
  in_reply_to_header TEXT,
  references_header TEXT,
  subject TEXT,

  -- SMS Masking Fields
  existing_sms_session BOOLEAN,
  incoming_sms_channel TEXT,
  outgoing_sms_channel TEXT,
  proxy_sms_channel TEXT,           -- Proxy SMS number
  proxy_email_phone TEXT,           -- User's phone via email
  sms_processed BOOLEAN NOT NULL,
  sms_session TEXT,
  sms_steps JSONB,

  -- User Identification
  sender_email_phone TEXT,          -- Sender's contact info
  sender_user TEXT,                 -- Sender user ID
  recipient_user TEXT,              -- Recipient user ID

  -- Message Content
  message_content TEXT NOT NULL,
  message_status TEXT,
  received_as TEXT,                 -- 'email' or 'sms'

  -- Session Management
  session_selector_input TEXT,
  session_selector_output TEXT,
  thread_conversation TEXT,

  -- Metadata
  original_updated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pending BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_multimessage_created_date ON multimessage (original_created_at);
CREATE INDEX idx_multimessage_modified_date ON multimessage (original_updated_at);
```

### Purpose (Legacy)
**Unified message queue** for processing both email and SMS messages through masking/proxy infrastructure.

**Workflow** (Decommissioned):
1. Message received (email or SMS)
2. Inserted into `multimessage` with `pending = true`
3. Background processor assigns proxy numbers/emails
4. Message forwarded to Bubble.io workflow
5. Status updated to `processed`

### Current Status
- ❌ **NO Edge Functions query this table**
- ❌ **NO frontend code references this table**
- ⚠️ **Table exists but is unused** (orphaned schema)

---

## 2. Orphaned Table: `proxysmssession`

### Schema
```sql
CREATE TABLE public.proxysmssession (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  original_created_at TIMESTAMPTZ NOT NULL,
  original_updated_at TIMESTAMPTZ NOT NULL,

  -- Session State
  session_active BOOLEAN NOT NULL,
  session_start TEXT NOT NULL,      -- ISO timestamp or duration
  session_end TEXT NOT NULL,        -- ISO timestamp or duration
  queued BOOLEAN NOT NULL,
  step TEXT,

  -- SMS Channel Assignment
  sms_channel TEXT,                 -- Assigned proxy number

  -- User Pairing
  user_pair JSONB NOT NULL,         -- { user1_id, user2_id }
  user_channel_pair JSONB NOT NULL, -- { user1_channel, user2_channel }

  -- Message Threading
  multi_message JSONB,              -- Array of message IDs
  thread_conversation TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pending BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_proxysmssession_created_date ON proxysmssession (original_created_at);
CREATE INDEX idx_proxysmssession_modified_date ON proxysmssession (original_updated_at);
```

### Purpose (Legacy)
**SMS proxy session manager** - Tracked active SMS conversations between user pairs using proxy numbers.

**Example Session** (Decommissioned):
```json
{
  "id": "session_12345",
  "session_active": true,
  "sms_channel": "+14155692985",
  "user_pair": {
    "user1_id": "host_123",
    "user2_id": "guest_456"
  },
  "user_channel_pair": {
    "user1_channel": "+15551234567",  // Host's real number
    "user2_channel": "+15559876543"   // Guest's real number
  },
  "multi_message": ["msg_1", "msg_2", "msg_3"]
}
```

**Session Lifecycle** (Decommissioned):
1. User pair created (host + guest)
2. Proxy SMS number assigned from pool
3. Session marked `active = true`
4. Messages route through proxy
5. Session ends after inactivity timeout
6. Proxy number returned to pool

### Current Status
- ❌ **NO Edge Functions query this table**
- ❌ **NO frontend code references this table**
- ⚠️ **Table exists but is unused** (orphaned schema)

---

## 3. Orphaned Reference Table: `os_proxy_sms_channels`

### Schema
```sql
CREATE TABLE reference_table.os_proxy_sms_channels (
  id BIGINT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display TEXT NOT NULL,
  phone_number TEXT NOT NULL,           -- Format: 4155692985
  phone_number_with_plus1 TEXT NOT NULL, -- Format: +14155692985
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Purpose (Legacy)
**Proxy phone number pool** - List of available Twilio numbers for masking SMS conversations.

**Example Data** (Hypothetical):
```sql
INSERT INTO os_proxy_sms_channels VALUES
  (1, 'proxy_1', 'Primary Proxy', '4155692985', '+14155692985'),
  (2, 'proxy_2', 'Secondary Proxy', '4155692986', '+14155692986'),
  (3, 'proxy_3', 'Tertiary Proxy', '4155692987', '+14155692987');
```

**Intended Use** (Decommissioned):
- Round-robin assignment of proxy numbers to sessions
- Prevent number exhaustion
- Load balancing across Twilio numbers

### Current Status
- ❌ **NO Edge Functions query this table**
- ❌ **NO frontend code references this table**
- ⚠️ **Table exists but is unused** (orphaned schema)
- 💡 **Could be repopulated if masking feature is reactivated**

---

## 4. Active Table: `notificationsettingsos_lists_`

### Schema
```sql
CREATE TABLE public.notificationsettingsos_lists_ (
  id TEXT PRIMARY KEY,
  created_by TEXT NOT NULL,
  original_created_at TIMESTAMPTZ NOT NULL,
  original_updated_at TIMESTAMPTZ NOT NULL,

  -- 11 Notification Categories (Array-based)
  check_in_out_reminders "Notification Preferences"[],
  lease_requests "Notification Preferences"[],
  login_signup_assistance "Notification Preferences"[],
  message_forwarding "Notification Preferences"[],
  payment_reminders "Notification Preferences"[],
  promotional "Notification Preferences"[],
  proposal_updates "Notification Preferences"[],
  reservation_updates "Notification Preferences"[],
  reviews "Notification Preferences"[],
  tips_insights "Notification Preferences"[],
  virtual_meetings "Notification Preferences"[],

  "user" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pending BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_notificationsettingsos_lists__created_date
  ON notificationsettingsos_lists_ (original_created_at);
CREATE INDEX idx_notificationsettingsos_lists__modified_date
  ON notificationsettingsos_lists_ (original_updated_at);
```

### Enum Type: `"Notification Preferences"`
```sql
CREATE TYPE "Notification Preferences" AS ENUM (
  'Email',
  'SMS',
  'In-App Message'
);
```

**Screenshot Evidence**: Supabase UI shows enum values: `Email`, `SMS`, `In-App Message`

### Current Status
- ✅ **ACTIVE** - Frontend writes to this table
- ✅ **Referenced by**: `app/src/islands/shared/NotificationSettingsIsland/useNotificationSettings.js`
- ❌ **NOT read by backend** - Backend expects `notification_preferences` table instead

### Example Data
```javascript
{
  "id": "settings_123",
  "created_by": "user_456",
  "proposal_updates": ["Email", "SMS"],        // Both channels enabled
  "message_forwarding": ["Email"],             // Email only
  "promotional": [],                           // All channels disabled
  "virtual_meetings": ["Email", "SMS"],        // Both channels enabled
  // ... 7 more categories
}
```

---

## 5. Code Search Results

### Edge Functions Search
```bash
# Searched all Edge Functions for masking table references
grep -r "multimessage\|proxysmssession\|os_proxy_sms_channels" \
  supabase/functions/

# Result: NO MATCHES FOUND
```

### Frontend Search
```bash
# Searched all TypeScript/JavaScript files
grep -r "multimessage\|proxysmssession\|os_proxy_sms_channels" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  app/

# Result: NO MATCHES FOUND
```

### Migration Files Search
```bash
# Searched migration files for table creation
find supabase/migrations -name "*.sql" -exec \
  grep -l "multimessage\|proxysmssession\|os_proxy_sms_channels" {} \;

# Result: NO MATCHES FOUND
```

**Conclusion**: These tables are **NOT created by migrations** and **NOT referenced by any code**.

---

## 6. Architecture Comparison

### Decommissioned Architecture (Agent 2's Backup)

```
┌──────────────────────────────────────────────────────────┐
│  User A                                  User B          │
│  +15551234567                           +15559876543     │
└────┬─────────────────────────────────────────┬───────────┘
     │                                         │
     │  SMS to +14155692985                    │  SMS to +14155692985
     │  (Shared Proxy)                         │  (Shared Proxy)
     │                                         │
     ▼                                         ▼
┌─────────────────────────────────────────────────────────┐
│           Twilio Webhook Handler                        │
│           (PythonAnywhere Flask App)                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│           SQLite Database                               │
│  • bubble_users                                         │
│  • user_pairs                                           │
│  • messages                                             │
│  • message_forwards                                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│     Forward to Bubble.io Workflow                       │
│     POST /api/1.1/wf/core-parse-sms                    │
└─────────────────────────────────────────────────────────┘
```

### Current Architecture (NO Masking)

```
┌──────────────────────────────────────────────────────────┐
│  User A (Host)               User B (Guest)             │
└────┬─────────────────────────────────────────┬───────────┘
     │                                         │
     │  In-App Message                         │  In-App Message
     │  (Realtime WebSocket)                   │  (Realtime WebSocket)
     │                                         │
     ▼                                         ▼
┌─────────────────────────────────────────────────────────┐
│        Supabase Edge Function: messages/                │
│        POST /functions/v1/messages                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│     Supabase Database (PostgreSQL)                      │
│  • message_thread                                       │
│  • thread_message                                       │
│  • user                                                 │
│                                                         │
│  ⚠️ ORPHANED TABLES (not used):                        │
│  • multimessage                                         │
│  • proxysmssession                                      │
│  • os_proxy_sms_channels                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│     Realtime Broadcast (WebSocket)                      │
│     Both users receive message instantly                │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Why Tables Still Exist

### Hypothesis: Bubble.io Migration Artifacts

**Timeline**:
1. **2023-2024**: Bubble.io app with masking service
2. **2024**: Python masking service deployed (PythonAnywhere)
3. **Early 2025**: Migration to Supabase begins
4. **March-August 2025**: Masking service active (118 SMS processed)
5. **August 2025**: Masking service decommissioned (low adoption)
6. **Late 2025**: Tables migrated from Bubble.io to Supabase
7. **2026**: Tables exist but unused (orphaned)

**Why Not Deleted?**:
- Tables may contain **historical data** from active period
- Risk of **data loss** if deleted prematurely
- Potential **future reactivation** of masking feature
- **Audit trail preservation** for compliance

---

## 8. Data Analysis (If Tables Populated)

### Recommended Queries

**Check if tables have data**:
```sql
-- Count records in orphaned tables
SELECT
  'multimessage' AS table_name,
  COUNT(*) AS record_count
FROM multimessage
UNION ALL
SELECT
  'proxysmssession',
  COUNT(*)
FROM proxysmssession
UNION ALL
SELECT
  'os_proxy_sms_channels',
  COUNT(*)
FROM os_proxy_sms_channels;
```

**Analyze multimessage activity**:
```sql
-- Find date range of messages
SELECT
  MIN(original_created_at) AS first_message,
  MAX(original_created_at) AS last_message,
  COUNT(*) AS total_messages,
  COUNT(DISTINCT sender_user) AS unique_senders,
  COUNT(DISTINCT recipient_user) AS unique_recipients,
  SUM(CASE WHEN email_processed = true THEN 1 ELSE 0 END) AS emails_processed,
  SUM(CASE WHEN sms_processed = true THEN 1 ELSE 0 END) AS sms_processed
FROM multimessage;
```

**Check proxy number usage**:
```sql
-- Find which proxy numbers were used
SELECT
  sms_channel,
  COUNT(*) AS session_count,
  MIN(session_start) AS first_use,
  MAX(session_end) AS last_use
FROM proxysmssession
WHERE sms_channel IS NOT NULL
GROUP BY sms_channel
ORDER BY session_count DESC;
```

---

## 9. Recommendations

### Option 1: Archive and Drop (Recommended)

**If tables are EMPTY or contain old test data**:
```sql
-- 1. Export table schemas for documentation
pg_dump --schema-only -t multimessage -t proxysmssession -t os_proxy_sms_channels \
  > masking_tables_schema_backup.sql

-- 2. Export data (if any exists)
pg_dump --data-only -t multimessage -t proxysmssession -t os_proxy_sms_channels \
  > masking_tables_data_backup.sql

-- 3. Drop orphaned tables
DROP TABLE IF EXISTS multimessage CASCADE;
DROP TABLE IF EXISTS proxysmssession CASCADE;
DROP TABLE IF EXISTS reference_table.os_proxy_sms_channels CASCADE;
```

### Option 2: Mark as Deprecated

**If tables contain historical data**:
```sql
-- Add comments to tables marking them as deprecated
COMMENT ON TABLE multimessage IS
  'DEPRECATED: Legacy masking service table. No longer used by active code. ' ||
  'Contains historical message data from March-August 2025.';

COMMENT ON TABLE proxysmssession IS
  'DEPRECATED: Legacy SMS proxy session tracking. No longer used by active code.';

COMMENT ON TABLE reference_table.os_proxy_sms_channels IS
  'DEPRECATED: Legacy proxy number pool. No longer used by active code.';
```

### Option 3: Preserve for Future Reactivation

**If masking feature may be revived**:
- ✅ Keep tables but document as unused
- ✅ Add RLS policies to prevent accidental writes
- ✅ Create `_archive` schema and move tables there

```sql
-- Create archive schema
CREATE SCHEMA IF NOT EXISTS _archive;

-- Move tables to archive
ALTER TABLE multimessage SET SCHEMA _archive;
ALTER TABLE proxysmssession SET SCHEMA _archive;
ALTER TABLE os_proxy_sms_channels SET SCHEMA _archive;

-- Add restrictive RLS
ALTER TABLE _archive.multimessage ENABLE ROW LEVEL SECURITY;
CREATE POLICY block_all_writes ON _archive.multimessage FOR ALL USING (false);
```

---

## 10. Impact Assessment

### Current Impact: NONE ✅
- Tables do not affect active functionality
- No code reads or writes to these tables
- No performance impact (indexes exist but unused)
- No storage cost concern (tables likely empty or small)

### Risk of Deletion: LOW ✅
- No foreign key constraints to active tables
- No triggers referencing these tables
- No application code dependencies
- Historical data (if any) can be archived before deletion

### Benefit of Cleanup: LOW-MEDIUM
- Minor reduction in database complexity
- Clearer schema for developers
- Reduced maintenance overhead
- Prevent accidental usage

---

## 11. Cross-Reference to Previous Findings

### Agent 1 Findings
- ✅ Confirmed `notificationsettingsos_lists_` table with array schema
- ✅ Confirmed enum type `"Notification Preferences"` with values: Email, SMS, In-App Message
- ✅ Table is actively used by frontend

### Agent 2 Findings
- ✅ Confirmed masking service was decommissioned
- ✅ Confirmed Python app used SQLite (not these PostgreSQL tables)
- ❓ **NEW**: Python app may have synced data TO these PostgreSQL tables via Bubble.io API

### Backend Analysis (Current Document)
- ✅ Confirmed no Edge Functions use masking tables
- ✅ Confirmed no frontend code uses masking tables
- ⚠️ **NEW**: Tables exist but are orphaned schema

---

## 12. Conclusion

The Supabase database contains **three orphaned tables** from the legacy masking service:
1. `multimessage` - Unified message queue
2. `proxysmssession` - SMS proxy session tracker
3. `os_proxy_sms_channels` - Proxy number pool

**Status**: These tables are **NOT USED** by any active code and can be safely archived or deleted after verifying they contain no critical historical data.

**Recommendation**: Run data analysis queries to check for records, then proceed with **Option 1 (Archive and Drop)** if tables are empty or contain only test data.

---

**Document Complete**
**Related Documents**:
- `AGENT_1_FINDINGS.md` - Frontend notification settings analysis
- `AGENT_2_FINDINGS.md` - Decommissioned masking service documentation
- `BACKEND_NOTIFICATION_ANALYSIS.md` - Backend Edge Functions analysis
