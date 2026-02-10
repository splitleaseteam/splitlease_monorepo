# Supabase Backend - LLM Reference

**SCOPE**: Edge Functions, Shared Utilities, Configuration
**RUNTIME**: Deno 2
**FUNCTION_CATALOG**: See `functions/EDGE_FUNCTIONS_DOCUMENTATION.md` for full handler-by-handler reference

---

## ARCHITECTURE_PRINCIPLES

[NO_FALLBACK_PRINCIPLE]: All functions fail fast without fallback logic or default values
[ERROR_COLLECTION]: One request = one Slack log (consolidated error reporting)
[ACTION_ROUTING]: All functions use { action, payload } pattern for consistent API interface

---

## EDGE_FUNCTIONS_SUMMARY

| Function | Intent | Auth |
|----------|--------|------|
| `auth-user` | Login, signup, logout, validate, password reset | No (is auth endpoint) |
| `ai-gateway` | OpenAI proxy with prompt templating + data loaders | Yes (except public prompts) |
| `proposal` | Proposal CRUD (create, update, get, suggest) | Yes (except get) |
| `listing` | Listing CRUD (create, get, submit) | Only submit |
| `messages` | Messaging threads and messages | Yes |
| `ai-signup-guest` | AI-powered guest signup flow | No |
| `slack` | Slack integration for FAQ inquiries | No |
| `communications` | Email/SMS/messaging | No |
| `pricing` | Pricing calculations | No |

---

## SHARED_UTILITIES

All shared code lives in `functions/_shared/`:

| File | Purpose |
|------|---------|
| `slack.ts` | ErrorCollector class + sendToSlack() — ONE REQUEST = ONE LOG, channels: database/acquisition/general |
| `errors.ts` | Custom error classes: ApiError (variable status), ValidationError (400), AuthenticationError (401) |
| `validation.ts` | Input validation: email, phone, required fields, action routing |
| `auth.ts` | Shared user resolution: resolveUser() resolves platform ID from JWT or email lookup |
| `userTypeMapping.ts` | Shared user type display mapping (Host/Guest/Trial Host → display strings) |
| `cors.ts` | CORS headers for all edge functions |
| `openai.ts` | OpenAI wrapper: complete() and stream() (SSE) |
| `types.ts` | General TypeScript interfaces |
| `aiTypes.ts` | AI-specific types (prompts, loaders, options) |
| `jsonUtils.ts` | JSON parsing and normalization |
| `messagingHelpers.ts` | Message creation, thread management, user lookup helpers |
| `emailUtils.ts` | Welcome emails, internal notifications, SMS |
| `notificationSender.ts` | Notification delivery with preference checking |
| `functional/orchestration.ts` | FP request parsing, action routing, config loading |
| `functional/result.ts` | Result type for functional error handling |
| `functional/errorLog.ts` | Immutable error log for FP-style error collection |

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

### Request/Response Format
```json
// Request: { "action": "action_name", "payload": { ... } }
// Success: { "success": true, "data": { ... } }
// Error:   { "success": false, "error": "Error message" }
```

---

## CRITICAL_NOTES

[DAY_INDEXING]: JavaScript 0-indexed: Sun=0 to Sat=6. Database stores 0-indexed natively.
[UNIQUE_ID_GENERATION]: Use supabaseAdmin.rpc('generate_unique_id') for unique record IDs
[NO_FALLBACK]: Never add fallback logic, default values, or compatibility layers
[ERROR_HANDLING]: Fail fast, let errors propagate, client can retry
[DATA_SOURCE]: Supabase is the primary and only data source for all operations
[CORS]: All functions return CORS headers, handle OPTIONS preflight

---

## ENVIRONMENT_VARIABLES

[SUPABASE_URL]: Supabase project URL (auto-configured)
[SUPABASE_ANON_KEY]: Supabase anon key for client operations (auto-configured)
[SUPABASE_SERVICE_ROLE_KEY]: Supabase service role key for admin operations (SECRET)
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

**DOCUMENT_VERSION**: 5.0
**LAST_UPDATED**: 2026-02-10
