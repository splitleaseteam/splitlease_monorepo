# Poll Gmail Inbox Edge Function

> **Purpose**: Replace legacy Python script for Gmail message forwarding between paired users

## Overview

This Edge Function polls a Gmail inbox for UNREAD messages and forwards them to the appropriate recipient based on active thread pairings. It respects user notification preferences and only forwards messages if the recipient has explicitly opted in.

## Architecture

```
┌─────────────┐
│   Gmail     │
│   Inbox     │
└──────┬──────┘
       │
       │ IMAP/Gmail API
       │
       ▼
┌──────────────────────────────────────┐
│  poll-gmail-inbox Edge Function      │
│                                      │
│  1. Fetch UNREAD messages            │
│  2. Extract sender email             │
│  3. Find sender in auth.users        │
│  4. Find recipient via thread table  │
│  5. Check notification preferences   │
│  6. Send notification (if enabled)   │
│  7. Mark message as READ             │
└──────────────────────────────────────┘
       │
       │
       ▼
┌──────────────────────────────────────┐
│  sendNotification                    │
│  (_shared/notificationSender.ts)     │
│                                      │
│  - Email via send-email function     │
│  - SMS via send-sms function         │
└──────────────────────────────────────┘
```

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GMAIL_CLIENT_EMAIL` | Service account email for Gmail API | `service@project.iam.gserviceaccount.com` |
| `GMAIL_PRIVATE_KEY` | Private key for service account (PEM format) | `-----BEGIN PRIVATE KEY-----\n...` |
| `SUPABASE_URL` | Supabase project URL | Auto-configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations | Auto-configured |

## Business Logic

### 1. Sender Identification

```typescript
// Extract email from "From" header
const fromHeader = message.payload.headers.find(h => h.name === 'From');
// "John Doe <john@example.com>" → "john@example.com"

// Find sender in database
const sender = await supabase
  .from('user')
  .select('_id, email')
  .eq('email', senderEmail)
  .single();
```

### 2. Recipient Discovery

```typescript
// Find all threads where sender is a participant
const threads = await supabase
  .from('thread')
  .select('host_user_id, guest_user_id')
  .or(`host_user_id.eq.${senderId},guest_user_id.eq.${senderId}`);

// Determine recipients (the OTHER users in each thread)
const recipientIds = threads.map(thread =>
  thread.host_user_id === senderId
    ? thread.guest_user_id
    : thread.host_user_id
);
```

### 3. Preference Checking & Notification

```typescript
// sendNotification handles preference checking internally
const result = await sendNotification({
  supabase,
  userId: recipientId,
  category: 'message_forwarding',
  email: { /* email params */ },
  sms: { /* sms params */ }
});

// Result indicates if message was sent or skipped
if (result.emailSent || result.smsSent) {
  console.log('Message forwarded');
} else {
  console.log('Recipient opted out');
}
```

### 4. Mark as READ

```typescript
// Only mark as READ after successful processing
await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
});
```

## Privacy & Security

### Privacy-First Design

1. **Opt-Out Default**: If a user has no notification preferences row, they receive NO notifications
2. **Explicit Opt-In Required**: Users must explicitly set `message_forwarding_email = true` or `message_forwarding_sms = true`
3. **Audit Trail**: All send/skip decisions are logged to `notification_audit` table

### Security Measures

1. **Service Role Authentication**: Function requires service role key in Authorization header
2. **Gmail Service Account**: Uses OAuth2 service account (no user credentials stored)
3. **Data Minimization**: Only processes sender email and message ID, full content not stored

## Deployment

### Prerequisites

1. Set up Gmail service account:
   ```bash
   # 1. Create service account in Google Cloud Console
   # 2. Enable Gmail API
   # 3. Create and download private key
   # 4. Grant service account domain-wide delegation
   ```

2. Configure Supabase secrets:
   ```bash
   supabase secrets set GMAIL_CLIENT_EMAIL=service@project.iam.gserviceaccount.com
   supabase secrets set GMAIL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   ```

### Deploy Function

```bash
# Deploy to Supabase
supabase functions deploy poll-gmail-inbox

# Test locally
supabase functions serve poll-gmail-inbox
```

### Schedule Cron Job

Create a cron job to poll Gmail every minute:

```sql
-- supabase/migrations/YYYYMMDD_poll_gmail_cron.sql
SELECT cron.schedule(
  'poll-gmail-inbox',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/poll-gmail-inbox',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    )
  );
  $$
);
```

## Testing

### Unit Tests

```bash
deno test --allow-env --allow-read supabase/functions/poll-gmail-inbox/index_test.ts
```

### Manual Test

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/poll-gmail-inbox \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Processed 3 messages",
  "result": {
    "total": 3,
    "forwarded": 2,
    "skipped": 1,
    "failed": 0,
    "errors": []
  }
}
```

## Monitoring

### Logs

```bash
# View function logs
supabase functions logs poll-gmail-inbox

# Filter for errors
supabase functions logs poll-gmail-inbox --filter "level=error"
```

### Metrics

Key metrics to monitor:

- **Total messages processed**: `result.total`
- **Forward success rate**: `result.forwarded / result.total`
- **Skip rate**: `result.skipped / result.total` (users opted out)
- **Failure rate**: `result.failed / result.total` (errors)

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Missing/invalid service role key | Check `Authorization` header |
| `Failed to get Gmail access token` | Invalid service account credentials | Verify `GMAIL_CLIENT_EMAIL` and `GMAIL_PRIVATE_KEY` |
| `No unread messages` | Gmail inbox is empty | Normal operation |
| `Sender not found in system` | External email (not a Split Lease user) | Expected behavior - message marked as READ |
| `No active recipient found` | Sender has no active threads | Expected behavior - message marked as READ |

## Migration from Legacy Python Script

### What Changed

| Legacy (Python) | New (Supabase) |
|----------------|----------------|
| `user_pairs` table with `active` flag | `thread` table with `host_user_id` + `guest_user_id` |
| `bubble_users` table | `user` table (from Bubble schema) |
| Dual endpoint (Live + Dev) | Single Supabase production endpoint |
| SQLite database | PostgreSQL (Supabase) |
| IMAP polling (9 seconds) | Cron job (1 minute) |
| Forwarded to Bubble workflows | Native Supabase notifications |

### What Stayed the Same

- ✅ UNREAD message filtering
- ✅ Extract sender from "From" header
- ✅ Mark as READ after processing
- ✅ Bidirectional user pairing lookup
- ✅ Privacy-first (opt-out if no preferences)

## Performance

- **Processing Time**: ~200-500ms per message (includes DB queries + notification sending)
- **Batch Size**: Processes all UNREAD messages in single invocation
- **Rate Limit**: Gmail API allows ~250 quota units/second (this function uses ~5 units/message)
- **Recommended Frequency**: Every 1-5 minutes

## Future Improvements

1. **Retry Queue**: Add dead letter queue for failed messages
2. **Rate Limiting**: Implement exponential backoff for Gmail API
3. **Deduplication**: Track processed message IDs to prevent duplicates
4. **Rich Notifications**: Extract attachments and inline images
5. **Thread Context**: Include conversation history in forwarded messages
