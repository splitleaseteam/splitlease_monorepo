# AI Gateway Edge Function

OpenAI proxy with prompt templating, variable interpolation, and data loading. Supports both streaming (SSE) and non-streaming completions through a prompt registry system.

## Overview

This Edge Function routes AI requests through a centralized gateway with registered prompt templates. Each prompt has a system prompt, user prompt template with variable interpolation, optional data loaders, and configurable model defaults. Auth is required for private prompts; public prompts are accessible without authentication.

## Architecture

- **Runtime**: Deno 2 (Supabase Edge Functions)
- **Pattern**: Functional Programming (FP) - pure functions, immutable data, fail-fast
- **Auth**: Per-prompt (public prompts skip auth; private prompts require JWT)
- **Actions**: complete, stream
- **AI Provider**: OpenAI via `_shared/openai.ts`

## Registered Prompts

| Prompt Key | Auth Required | Description |
|-----------|---------------|-------------|
| `listing-description` | No | Generate listing descriptions |
| `listing-title` | No | Generate listing titles |
| `neighborhood-description` | No | Generate neighborhood descriptions |
| `parse-call-transcription` | No | Parse call transcription into structured data |
| `negotiation-summary-suggested` | No | Negotiation summary (suggested terms) |
| `negotiation-summary-counteroffer` | No | Negotiation summary (counteroffer) |
| `negotiation-summary-host` | No | Negotiation summary (host perspective) |
| `deepfake-script` | Yes | Deepfake video script generation |
| `narration-script` | Yes | Narration script generation |
| `jingle-lyrics` | Yes | Jingle lyrics generation |

## API Endpoints

### POST /functions/v1/ai-gateway

All requests use action-based routing:

```json
{
  "action": "action_name",
  "payload": {
    "prompt_key": "prompt_name",
    "variables": { ... },
    "options": { ... }
  }
}
```

### Actions

#### 1. `complete` - Non-streaming completion

**Payload**:
```json
{
  "action": "complete",
  "payload": {
    "prompt_key": "listing-description",
    "variables": {
      "propertyType": "apartment",
      "bedrooms": 2,
      "neighborhood": "SoHo",
      "city": "New York",
      "amenities": ["wifi", "washer", "rooftop"]
    },
    "options": {
      "model": "gpt-4o-mini",
      "temperature": 0.7,
      "max_tokens": 500
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "content": "Welcome to this stunning 2-bedroom apartment in the heart of SoHo...",
    "model": "gpt-4o-mini",
    "usage": {
      "prompt_tokens": 150,
      "completion_tokens": 200,
      "total_tokens": 350
    }
  }
}
```

#### 2. `stream` - SSE streaming completion

**Payload** (same format as `complete`):
```json
{
  "action": "stream",
  "payload": {
    "prompt_key": "listing-description",
    "variables": {
      "propertyType": "apartment",
      "bedrooms": 2
    }
  }
}
```

**Response**: Server-Sent Events (SSE) stream passthrough from OpenAI

```
Content-Type: text/event-stream

data: {"choices":[{"delta":{"content":"Welcome"}}]}

data: {"choices":[{"delta":{"content":" to"}}]}

data: [DONE]
```

## Prompt Template System

Each registered prompt defines:

- **systemPrompt**: System message for the AI model
- **userPromptTemplate**: Template with `{{variable}}` interpolation
- **defaults**: Model, temperature, maxTokens
- **responseFormat**: `text` or `json`
- **requiredLoaders**: Optional data loaders that fetch from Supabase before interpolation

Variables from `payload.variables` and loaded data are merged into the template context for interpolation.

## Dependencies

- `_shared/openai.ts` - OpenAI wrapper (complete + stream functions)
- `_shared/aiTypes.ts` - AI-specific type definitions
- `_shared/cors.ts` - CORS headers
- `_shared/errors.ts` - ValidationError, AuthenticationError
- `_shared/functional/result.ts` - Result type (ok/err)
- `_shared/functional/orchestration.ts` - FP request parsing, action routing
- `_shared/functional/errorLog.ts` - Immutable error log
- `_shared/slack.ts` - Error reporting to Slack

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `SUPABASE_URL` | Yes | Supabase project URL (auto-configured) |
| `SUPABASE_ANON_KEY` | Yes | Anon key for auth (auto-configured) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key for data loaders (auto-configured) |

## Local Development

```bash
# Start local Supabase
supabase start

# Serve this function
supabase functions serve ai-gateway

# Test non-streaming completion (public prompt)
curl -X POST http://localhost:54321/functions/v1/ai-gateway \
  -H "Content-Type: application/json" \
  -d '{"action":"complete","payload":{"prompt_key":"listing-title","variables":{"propertyType":"apartment","city":"New York"}}}'

# Test streaming (public prompt)
curl -X POST http://localhost:54321/functions/v1/ai-gateway \
  -H "Content-Type: application/json" \
  -N \
  -d '{"action":"stream","payload":{"prompt_key":"listing-description","variables":{"propertyType":"studio","city":"Austin"}}}'
```

## File Structure

```
ai-gateway/
├── index.ts              # Main router (FP orchestration + prompt imports)
├── deno.json             # Import map
├── handlers/
│   ├── complete.ts       # Non-streaming completion handler
│   └── stream.ts         # SSE streaming handler
└── prompts/
    ├── _registry.ts              # Prompt registration + data loader system
    ├── _template.ts              # Variable interpolation engine
    ├── listing-description.ts    # Listing description prompt
    ├── listing-title.ts          # Listing title prompt
    ├── neighborhood-description.ts  # Neighborhood description prompt
    ├── parse-call-transcription.ts  # Call transcription parser prompt
    ├── negotiation-summary-suggested.ts    # Negotiation summary prompt
    ├── negotiation-summary-counteroffer.ts # Counteroffer summary prompt
    ├── negotiation-summary-host.ts         # Host summary prompt
    ├── deepfake-script.ts        # Deepfake script prompt
    ├── narration-script.ts       # Narration script prompt
    └── jingle-lyrics.ts          # Jingle lyrics prompt
```

## Critical Notes

- **`prompt_key` is required** - Must match a registered prompt in the registry
- **Public vs private prompts** - Public prompts skip auth; private prompts require valid JWT
- **No fallback logic** - Errors fail fast (invalid prompt key, missing variables, OpenAI errors)
- **Variable interpolation** - Uses `{{variable}}` syntax in prompt templates
- **Data loaders** - Prompts can specify loaders that fetch Supabase data before template interpolation
- **Model overrides** - Client can override model, temperature, max_tokens via `options`
- **Stream handler returns raw SSE** - Client must handle SSE parsing
- **Prompt imports are explicit** - Each prompt file is imported in `index.ts` after the registry to avoid circular dependency / TDZ errors

---

**Version**: 1.0.0
**Date**: 2026-02-12
**Pattern**: AI Gateway (Prompt Registry + OpenAI Proxy)
