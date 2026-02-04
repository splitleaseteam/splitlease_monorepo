# Slack Integration Analysis

**Created**: 2026-01-27
**Status**: Current State Analysis + Expansion Roadmap

---

## Current State Overview

Split Lease has **4 distinct Slack integration layers**, each serving different purposes:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SLACK INTEGRATION LAYERS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Claude Skill (Python)                                       │
│     Location: .claude/skills/slack-webhook/                     │
│     Purpose: Claude → Slack notifications                       │
│     Webhook: TINYTASKAGENT                                      │
│     Types: info, success, error, warning, urgent                │
│                                                                 │
│  2. Supabase Edge Functions (TypeScript)                        │
│     Location: supabase/functions/_shared/slack.ts               │
│     Purpose: Backend error logging + interactive messages       │
│     Webhooks: database, acquisition, general                    │
│     Features: ErrorCollector, Bot API, message updates          │
│                                                                 │
│  3. Frontend Service (JavaScript)                               │
│     Location: app/src/lib/slackService.js                       │
│     Purpose: FAQ inquiries via Cloudflare proxy                 │
│     Method: Delegates to Cloudflare Pages Function              │
│                                                                 │
│  4. Cloudflare Pages Function (JavaScript)                      │
│     Location: app/functions/api/faq-inquiry.js                  │
│     Purpose: Direct FAQ posting to Slack                        │
│     Channels: acquisition, general                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Claude Skill (`slack-webhook`)

### Current Implementation

**File**: `.claude/skills/slack-webhook/scripts/send_slack.py`

```python
# Usage
python send_slack.py "<message>" --type <type>

# Message Types
info      → :information_source:
success   → :white_check_mark:
error     → :x:
warning   → :warning:
urgent    → :rotating_light:
```

### Features
- ✅ Simple CLI interface
- ✅ 5 message severity levels
- ✅ Emoji-prefixed formatting
- ✅ Fire-and-forget (no error handling requirement)
- ✅ Environment variable + .env file support
- ✅ Clean exit codes (0 = success, 1 = failure)

### Limitations
- ❌ **Single webhook only** (TINYTASKAGENT)
- ❌ **Plain text only** (no rich formatting, blocks, or buttons)
- ❌ **No threading support** (can't reply to messages)
- ❌ **No file attachments** (can't upload screenshots, logs, etc.)
- ❌ **No user mentions** (can't tag specific users)
- ❌ **No channel routing** (all messages go to one channel)
- ❌ **No message updates** (can't edit sent messages)
- ❌ **No persistence** (fire-and-forget, no confirmation)

---

## Layer 2: Supabase Edge Functions

### Current Implementation

**File**: `supabase/functions/_shared/slack.ts`

```typescript
// Webhook Channels
sendToSlack('database', message)     // SLACK_WEBHOOK_DATABASE_WEBHOOK
sendToSlack('acquisition', message)  // SLACK_WEBHOOK_ACQUISITION
sendToSlack('general', message)      // SLACK_WEBHOOK_DB_GENERAL

// Interactive Messages (Bot API)
sendInteractiveMessage(channelId, blocks, text)
updateSlackMessage(channelId, messageTs, blocks, text)

// Error Collection
const collector = new ErrorCollector('function-name', 'action')
collector.add(error, 'context')
collector.reportToSlack()

// Functional API (FP-friendly)
reportErrorLog(errorLog)
```

### Features
- ✅ **Multiple webhook channels** (database, acquisition, general)
- ✅ **Interactive messages** (buttons, modals via Bot API)
- ✅ **Message updates** (edit messages after sending)
- ✅ **Error aggregation** (ErrorCollector batches errors)
- ✅ **Functional API** (immutable ErrorLog pattern)
- ✅ **Request correlation** (tracks errors by request ID)
- ✅ **User context** (associates errors with user IDs)
- ✅ **Fire-and-forget** (zero latency impact)

### Limitations
- ❌ **No file uploads** (can't attach screenshots, logs, etc.)
- ❌ **No threading** (can't organize conversations)
- ❌ **No user mentions** (formatted as plain text)
- ❌ **No rich formatting helpers** (manual block construction)
- ❌ **No scheduled messages** (immediate send only)
- ❌ **No emoji reactions** (can't add reactions to messages)

---

## Layer 3: Frontend Service

### Current Implementation

**File**: `app/src/lib/slackService.js`

```javascript
// Only handles FAQ inquiries
sendFaqInquiry({ name, email, inquiry })
```

### Features
- ✅ **Input validation** (checks for required fields, email format)
- ✅ **Error propagation** (throws on failure)
- ✅ **Clean abstraction** (delegates to Cloudflare Pages Function)

### Limitations
- ❌ **Single use case only** (FAQ inquiries)
- ❌ **No generic message sending** (can't send arbitrary notifications)
- ❌ **Tight coupling** (hardcoded to `/api/faq-inquiry` endpoint)

---

## Layer 4: Cloudflare Pages Function

### Current Implementation

**File**: `app/functions/api/faq-inquiry.js`

```javascript
// Sends FAQ inquiries to 2 channels
POST /api/faq-inquiry
Body: { name, email, inquiry }
```

### Features
- ✅ **Multi-channel posting** (acquisition + general)
- ✅ **CORS support** (accessible from frontend)
- ✅ **Promise.allSettled** (continues even if one webhook fails)
- ✅ **Validation** (email regex, required fields)

### Limitations
- ❌ **Hardcoded message format** (FAQ inquiries only)
- ❌ **No generic message endpoint** (can't send custom notifications)
- ❌ **No rate limiting** (vulnerable to spam)
- ❌ **No authentication** (public endpoint, anyone can POST)

---

## Expansion Opportunities

### 🎯 Priority 1: Claude Skill Enhancements

**Problem**: Claude skill is too basic for modern workflows

**Proposed Enhancements**:

```python
# Multi-channel routing
python send_slack.py "Build failed" --type error --channel builds

# Rich formatting with blocks
python send_slack.py "PR ready" --type success --blocks pr-template.json

# File attachments
python send_slack.py "Test results" --attach coverage-report.html

# User mentions
python send_slack.py "Deploy complete @john @jane" --mention-users

# Threaded messages
python send_slack.py "Update" --thread-ts 1234567890.123456

# Message updates
python send_slack.py "Status: In Progress" --message-id 1234 --update
```

**Benefits**:
- Richer Claude notifications (code snippets, tables, buttons)
- Targeted alerts (different channels for different tasks)
- Better collaboration (threaded discussions)
- Visual feedback (file uploads for screenshots, logs)

---

### 🎯 Priority 2: Unified Slack Service

**Problem**: 4 separate implementations with overlapping concerns

**Proposed Solution**: Create a **single, unified Slack service** that all layers can use

```
┌─────────────────────────────────────────────────────────────────┐
│                  UNIFIED SLACK SERVICE                          │
│           (Shared TypeScript module + Python wrapper)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Core Features:                                                 │
│  • Multi-channel routing (acquisition, general, builds, etc.)   │
│  • Rich message formatting (blocks, attachments, embeds)        │
│  • Threading support (conversations, updates)                   │
│  • File uploads (screenshots, logs, reports)                    │
│  • User/channel mentions (@user, #channel)                      │
│  • Message updates/deletes (edit after sending)                 │
│  • Scheduled messages (delayed posting)                         │
│  • Rate limiting (prevent spam)                                 │
│  • Error handling (retry logic, fallbacks)                      │
│  • Audit trail (log all sent messages)                          │
│                                                                 │
│  Used By:                                                       │
│  • Claude Skill (Python wrapper)                                │
│  • Supabase Edge Functions (direct import)                      │
│  • Cloudflare Pages Functions (direct import)                   │
│  • Frontend (via Cloudflare Pages API)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Path**:
1. Create `supabase/functions/_shared/slackUnified.ts`
2. Migrate existing functionality from `slack.ts`
3. Add rich formatting helpers (blocks, attachments)
4. Add threading, file uploads, mentions
5. Create Python wrapper for Claude skill
6. Update all consumers to use unified service

---

### 🎯 Priority 3: Message Templates

**Problem**: Repetitive message formatting across codebase

**Proposed Solution**: Pre-built message templates for common scenarios

```typescript
// Template library
import { templates } from '_shared/slackTemplates.ts';

// Deployment notifications
sendTemplated(templates.deployment.success, {
  environment: 'production',
  deployer: 'Claude',
  duration: '2m 34s',
  url: 'https://splitlease.com'
});

// Error reports
sendTemplated(templates.error.edgeFunction, {
  function: 'proposal',
  action: 'create',
  error: err.message,
  requestId: '1234-5678'
});

// User actions
sendTemplated(templates.user.signup, {
  name: 'John Doe',
  email: 'john@example.com',
  source: 'landing page'
});
```

**Template Categories**:
- Deployments (success, failure, rollback)
- Errors (edge functions, frontend, database)
- User actions (signup, login, booking)
- Admin alerts (security issues, data inconsistencies)
- System health (monitoring, performance)
- CI/CD (builds, tests, releases)

---

### 🎯 Priority 4: Interactive Workflows

**Problem**: One-way notifications, no interaction

**Proposed Enhancement**: Two-way interactive workflows

```typescript
// Example: Approval workflow
const message = await sendInteractive({
  channel: 'admin-approvals',
  title: 'New Listing Pending Approval',
  fields: {
    'Property': '123 Main St, Brooklyn',
    'Host': 'John Doe',
    'Price': '$1,200/month'
  },
  actions: [
    { id: 'approve', label: 'Approve', style: 'primary' },
    { id: 'reject', label: 'Reject', style: 'danger' },
    { id: 'review', label: 'Request Changes' }
  ]
});

// Handle button clicks
onInteraction(message.id, async (action, user) => {
  if (action === 'approve') {
    await approveListing(listingId);
    await updateMessage(message.id, 'Approved by @' + user);
  }
});
```

**Use Cases**:
- Admin approvals (listings, users, proposals)
- Error triage (acknowledge, assign, resolve)
- Deployment confirmations (proceed, rollback, cancel)
- Data review (fix data, skip, flag for manual review)

---

### 🎯 Priority 5: Slack Bot Commands

**Problem**: Can only send TO Slack, not receive FROM Slack

**Proposed Enhancement**: Bi-directional Slack bot

```
# In Slack channel
/splitlease deploy staging
/splitlease stats today
/splitlease search listing "123 Main St"
/splitlease run-migration add_user_role
/splitlease help
```

**Implementation**:
1. Create Slack app with slash commands
2. Add Cloudflare Pages Function for `/api/slack-commands`
3. Parse commands and route to appropriate handlers
4. Return formatted responses to Slack
5. Add authentication (verify Slack signature)

**Benefits**:
- Quick access to system info from Slack
- Emergency operations without leaving Slack
- Team collaboration (everyone can check stats, trigger deploys)

---

### 🎯 Priority 6: Scheduled Notifications

**Problem**: No way to schedule notifications

**Proposed Enhancement**: Cron-based scheduled messages

```typescript
// Send daily summary at 9 AM
scheduleDaily('09:00', async () => {
  const stats = await getDailyStats();
  await sendTemplated(templates.reports.daily, stats);
});

// Send weekly report every Monday
scheduleWeekly('monday', '09:00', async () => {
  const report = await generateWeeklyReport();
  await sendTemplated(templates.reports.weekly, report);
});

// One-time reminder
scheduleOnce(new Date('2026-01-28 14:00'), async () => {
  await sendMessage('Reminder: Team meeting in 1 hour');
});
```

**Use Cases**:
- Daily stats (signups, bookings, revenue)
- Weekly reports (performance, errors, trends)
- Monthly summaries (growth metrics, goals)
- Reminders (meetings, deadlines, maintenance windows)

---

### 🎯 Priority 7: Enhanced Error Notifications

**Problem**: Current error logs are plain text, hard to parse

**Proposed Enhancement**: Rich error cards with context

```typescript
// Enhanced error notification
sendError({
  title: 'Edge Function Error: proposal/create',
  severity: 'high',
  fields: {
    'Request ID': '1234-5678',
    'User ID': 'user_abc123',
    'Timestamp': '2026-01-27 14:30:00',
    'Environment': 'production',
    'Error Type': 'PostgrestError',
    'Error Code': '23503',
    'Message': 'Foreign key violation on listing_id'
  },
  stackTrace: err.stack,
  context: {
    'Function': 'proposal',
    'Action': 'create',
    'Payload': JSON.stringify(payload, null, 2)
  },
  actions: [
    { label: 'View Logs', url: 'https://supabase.com/logs/...' },
    { label: 'View User', url: 'https://admin.splitlease.com/users/abc123' },
    { label: 'Acknowledge', action: 'ack_error' }
  ]
});
```

**Benefits**:
- Faster debugging (all context in one place)
- Actionable alerts (links to logs, users, admin panels)
- Error tracking (acknowledge, assign, resolve)
- Better visibility (severity levels, grouping)

---

### 🎯 Priority 8: Environment Badges

**Problem**: Hard to tell which environment an alert came from

**Proposed Enhancement**: Add environment badges to all messages

```typescript
// Automatically prefix with environment
sendMessage({
  text: 'Deployment complete',
  env: 'production'  // Adds [PROD] badge
});

sendMessage({
  text: 'Test failed',
  env: 'development'  // Adds [DEV] badge
});
```

**Badge Styles**:
- `[PROD]` → 🔴 Red (production alerts)
- `[STAGING]` → 🟡 Yellow (staging alerts)
- `[DEV]` → 🟢 Green (development alerts)
- `[TEST]` → 🔵 Blue (test environment)

**Benefits**:
- Immediate context (know which environment at a glance)
- Reduce confusion (prevent false alarms)
- Better prioritization (production alerts > dev alerts)

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. ✅ Audit current implementation (DONE)
2. Create unified Slack service (`slackUnified.ts`)
3. Migrate existing functionality
4. Add basic rich formatting (blocks, attachments)
5. Add environment badges

### Phase 2: Claude Skill Enhancement (Week 3)
1. Add multi-channel routing to Python script
2. Add rich formatting support (blocks from JSON files)
3. Add file upload capability
4. Add threading support
5. Update skill documentation

### Phase 3: Templates & Workflows (Week 4)
1. Create template library
2. Convert existing messages to templates
3. Add interactive message support
4. Implement approval workflows
5. Add message update/delete capabilities

### Phase 4: Advanced Features (Week 5-6)
1. Add scheduled notifications (cron-based)
2. Implement Slack bot commands
3. Add enhanced error notifications
4. Create admin dashboard for Slack activity
5. Add rate limiting and abuse prevention

### Phase 5: Polish & Documentation (Week 7)
1. Write comprehensive documentation
2. Create usage examples for all features
3. Add monitoring and analytics
4. Performance optimization
5. Security audit

---

## Success Metrics

### Developer Experience
- ✅ **Single source of truth** for Slack integration
- ✅ **Type-safe** message formatting
- ✅ **Reusable templates** reduce boilerplate
- ✅ **Consistent patterns** across all consumers

### Operations
- ✅ **Faster debugging** with rich error context
- ✅ **Better visibility** into system health
- ✅ **Reduced noise** with smart routing and filtering
- ✅ **Actionable alerts** with interactive workflows

### Team Collaboration
- ✅ **Centralized notifications** in Slack
- ✅ **Two-way communication** with bot commands
- ✅ **Approval workflows** for critical actions
- ✅ **Scheduled reports** for regular updates

---

## Files Involved

### Current Implementation
- [.claude/skills/slack-webhook.skill](.claude/skills/slack-webhook.skill) - Claude skill wrapper
- [.claude/skills/slack-webhook/scripts/send_slack.py](.claude/skills/slack-webhook/scripts/send_slack.py) - Python notification script
- [supabase/functions/_shared/slack.ts](supabase/functions/_shared/slack.ts) - Edge function Slack utilities
- [app/src/lib/slackService.js](app/src/lib/slackService.js) - Frontend Slack service
- [app/functions/api/faq-inquiry.js](app/functions/api/faq-inquiry.js) - Cloudflare Pages FAQ handler

### Proposed Additions
- `supabase/functions/_shared/slackUnified.ts` - Unified Slack service
- `supabase/functions/_shared/slackTemplates.ts` - Message templates
- `supabase/functions/_shared/slackScheduler.ts` - Scheduled notifications
- `.claude/skills/slack-webhook/scripts/send_slack_v2.py` - Enhanced Python script
- `app/functions/api/slack-commands.js` - Slack bot command handler
- `app/functions/api/slack-interactive.js` - Interactive message handler

---

## Next Steps

**Immediate Action Items**:

1. **Get User Feedback**: Review this analysis and prioritize features
2. **Choose Starting Point**: Pick Priority 1 (Claude Skill) or Priority 2 (Unified Service)
3. **Define Scope**: Decide which features are must-have vs nice-to-have
4. **Set Timeline**: Allocate time for implementation phases
5. **Start Implementation**: Create task breakdown and begin coding

**Questions for User**:

1. Which priorities resonate most with your current needs?
2. Are there any use cases I missed that you'd like to support?
3. Do you want to focus on developer experience (Claude skill) or infrastructure (unified service) first?
4. Are there any existing Slack integrations you want to preserve/deprecate?
5. What's your timeline for these enhancements?

---

**End of Analysis**
