# Supabase Backend - LLM Reference

**SCOPE**: Edge Functions, Shared Utilities, Configuration
**RUNTIME**: Deno 2
**FUNCTION_CATALOG**: See `functions/EDGE_FUNCTIONS_DOCUMENTATION.md` for full handler-by-handler reference

---

## ARCHITECTURE_PRINCIPLES

[NO_FALLBACK_PRINCIPLE]: All functions fail fast without fallback logic or default values
[ATOMIC_OPERATIONS]: Write-Read-Write pattern ensures data consistency across Bubble and Supabase
[ERROR_COLLECTION]: One request = one Slack log (consolidated error reporting)
[QUEUE_BASED_SYNC]: Async sync operations via sync_queue table for non-blocking operations
[ACTION_ROUTING]: All functions use { action, payload } pattern for consistent API interface

---

## EDGE_FUNCTIONS_SUMMARY

| Function | Intent | Auth |
|----------|--------|------|
| `auth-user` | Login, signup, logout, validate, password reset | No (is auth endpoint) |
| `ai-gateway` | OpenAI proxy with prompt templating + data loaders | Yes (except public prompts) |
| `bubble_sync` | Process sync_queue, push Supabase → Bubble | No (internal service) |
| `proposal` | Proposal CRUD (create, update, get, suggest) | Yes (except get) |
| `listing` | Listing CRUD (create, get, submit) | Only submit |
| `ai-signup-guest` | AI-powered guest signup flow | No |
| `slack` | Slack integration for FAQ inquiries | No |
| `communications` | Placeholder for email/SMS/messaging | No |
| `pricing` | Placeholder for pricing calculations | No |

---

## SHARED_UTILITIES

All shared code lives in `functions/_shared/`:

| File | Purpose |
|------|---------|
| `bubbleSync.ts` | Core atomic sync service: Write-Read-Write pattern (Bubble Workflow/Data API → Supabase) |
| `queueSync.ts` | Queue-based async sync: enqueue items to sync_queue, trigger processing, fire-and-forget |
| `slack.ts` | ErrorCollector class + sendToSlack() — ONE REQUEST = ONE LOG, channels: database/acquisition/general |
| `errors.ts` | Custom error classes with HTTP status mapping (Validation=400, Auth=401, Bubble=variable, Supabase=500) |
| `validation.ts` | Input validation: email, phone, required fields, action routing |
| `cors.ts` | CORS headers for all edge functions |
| `openai.ts` | OpenAI wrapper: complete() and stream() (SSE) |
| `types.ts` | General TypeScript interfaces |
| `aiTypes.ts` | AI-specific types (prompts, loaders, options) |
| `jsonUtils.ts` | JSON parsing and normalization |

---

## COMMON_PATTERNS

### Authentication Pattern
```typescript
// Optional auth
const authHeader = req.headers.get('Authorization');
let user = null;
if (authHeader) {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  user = authUser;
}

// Required auth
if (!user) {
  throw new AuthenticationError('Authentication required');
}
```

### Error Collection Pattern
```typescript
const collector = createErrorCollector('function-name', action);
try {
  // ... operation
} catch (error) {
  collector.add(error, 'context description');
  collector.reportToSlack();
  throw error;
}
```

### Atomic Sync Pattern
```typescript
const syncService = new BubbleSyncService(bubbleBaseUrl, bubbleApiKey, supabaseUrl, supabaseServiceKey);
const syncedData = await syncService.createAndSync(
  'workflow_name',
  params,
  'BubbleObjectType',
  'supabase_table'
);
```

### Queue Sync Pattern
```typescript
await enqueueBubbleSync(supabase, {
  correlationId: `operation:${id}`,
  items: [{
    sequence: 1,
    table: 'table_name',
    recordId: id,
    operation: 'INSERT',
    payload: data,
  }],
});
await triggerQueueProcessing();
```

### Request/Response Format
```json
// Request: { "action": "action_name", "payload": { ... } }
// Success: { "success": true, "data": { ... } }
// Error:   { "success": false, "error": "Error message" }
```

---

## CRITICAL_NOTES

[DAY_INDEXING]: JavaScript: Sun=0 to Sat=6 | Bubble: Sun=1 to Sat=7 | Use adaptDaysFromBubble/adaptDaysToBubble
[UNIQUE_ID_GENERATION]: Use supabaseAdmin.rpc('generate_bubble_id') for Bubble-compatible IDs
[NO_FALLBACK]: Never add fallback logic, default values, or compatibility layers
[ERROR_HANDLING]: Fail fast, let errors propagate, client can retry
[DATA_MIGRATION]: Supabase is primary for auth and new features; Bubble retains legacy data synced via queue
[SYNC_PATTERN]: New records created in Supabase, synced to Bubble via sync_queue; legacy data still read from Bubble
[QUEUE_PROCESSING]: Async sync via sync_queue, processed by bubble_sync function + cron job (every 5 min)
[CORS]: All functions return CORS headers, handle OPTIONS preflight

---

## ENVIRONMENT_VARIABLES

[SUPABASE_URL]: Supabase project URL (auto-configured)
[SUPABASE_ANON_KEY]: Supabase anon key for client operations (auto-configured)
[SUPABASE_SERVICE_ROLE_KEY]: Supabase service role key for admin operations (SECRET)
[BUBBLE_API_BASE_URL]: Bubble API base URL (SECRET)
[BUBBLE_API_KEY]: Bubble API key (SECRET)
[OPENAI_API_KEY]: OpenAI API key for AI operations (SECRET)
[SLACK_WEBHOOK_DATABASE_WEBHOOK]: Slack webhook for database errors (SECRET)
[SLACK_WEBHOOK_ACQUISITION]: Slack webhook for acquisition channel (SECRET)
[SLACK_WEBHOOK_GENERAL]: Slack webhook for general channel (SECRET)

---

## DEPLOYMENT

```bash
# Local Development
supabase start                      # Start local Supabase
supabase functions serve            # Serve all functions
supabase functions serve <name>     # Serve specific function
supabase functions logs <name>      # View function logs

# Production
supabase functions deploy <name>    # Deploy specific function
supabase functions deploy            # Deploy all functions
```

[REMINDER]: Edge Functions require manual deployment
[SECRETS]: Configured in Supabase Dashboard > Project Settings > Secrets

---

**DOCUMENT_VERSION**: 4.0
**LAST_UPDATED**: 2026-02-10
