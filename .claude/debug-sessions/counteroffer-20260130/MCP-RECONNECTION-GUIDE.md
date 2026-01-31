# Supabase MCP Reconnection Guide

**Project**: Split Lease (SL3)
**Target Project Ref**: `qzsmhgyojmwvtjmnrdea`
**Date**: 2026-01-30

---

## Current Status

**Supabase MCP Plugin**: Installed but **NOT CONNECTED** to current session
**Available MCP Servers**: knip, playwright (only)
**Needed**: Supabase MCP connection to `splitlease-backend-dev` project

---

## Option 1: Reconnect via Claude Code CLI

### Method A: Install/Enable Supabase MCP Server

If you're using Claude Code CLI, you can add Supabase MCP as a server:

1. **Check if Supabase MCP is installed:**
```bash
claude mcp list
```

2. **If not listed, install it:**
```bash
claude mcp install @anthropic-ai/mcp-server-supabase
```

3. **Configure with your project credentials:**

Create or update MCP configuration (location varies by installation):
- **Windows**: `%APPDATA%\Claude\mcp-servers.json`
- **Mac/Linux**: `~/.config/claude/mcp-servers.json`

Add Supabase configuration:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@anthropic-ai/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "https://qzsmhgyojmwvtjmnrdea.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "<your-service-role-key>"
      }
    }
  }
}
```

4. **Restart Claude Code CLI**

### Method B: Use Project-Scoped MCP Config

Add to `.claude/settings.json` in project root:

```json
{
  "mcpServers": {
    "supabase-dev": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://qzsmhgyojmwvtjmnrdea.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "env(SUPABASE_SERVICE_KEY_DEV)"
      }
    }
  }
}
```

**Note**: Service role key should be stored in environment variable, not hardcoded.

---

## Option 2: Use Supabase REST API Directly

Since MCP is not connected, we can query the database using Supabase REST API via curl:

### Get Service Role Key

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qzsmhgyojmwvtjmnrdea
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (secret)

### Query via REST API

```bash
# Set environment variable
export SUPABASE_SERVICE_KEY="<your-service-role-key>"

# Query proposal
curl -X POST \
  "https://qzsmhgyojmwvtjmnrdea.supabase.co/rest/v1/rpc/execute_sql" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT _id, _status, _guest_profile, _host_user FROM proposal WHERE _id = '\''1769130751870x21602817865937584'\''"
  }'
```

Or use PostgREST syntax:

```bash
curl -X GET \
  "https://qzsmhgyojmwvtjmnrdea.supabase.co/rest/v1/proposal?_id=eq.1769130751870x21602817865937584" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
```

---

## Option 3: Use psql (PostgreSQL CLI)

### Get Database Connection String

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qzsmhgyojmwvtjmnrdea
2. Navigate to **Settings** → **Database**
3. Copy the **Connection string** (connection pooling mode)

### Connect via psql

```bash
# Replace <password> with your database password
psql "postgresql://postgres.<password>@db.qzsmhgyojmwvtjmnrdea.supabase.co:5432/postgres"

# Once connected, run queries:
SELECT _id, _status, _guest_profile, _host_user
FROM proposal
WHERE _id = '1769130751870x21602817865937584';
```

---

## Option 4: Temporary Workaround - Manual Data Retrieval

If immediate reconnection is not possible:

1. **User manually queries via Supabase Dashboard** (SQL Editor)
2. **Exports results to JSON/CSV**
3. **Saves files to project directory** (e.g., `.claude/debug-sessions/counteroffer-20260130/manual-queries/`)
4. **Claude reads files** instead of querying database

Example workflow:
```sql
-- Run in Supabase SQL Editor
SELECT _id, _status, _guest_profile, _host_user, counter_offer_happened
FROM proposal
WHERE _id = '1769130751870x21602817865937584';

-- Export as JSON, save to:
-- .claude/debug-sessions/counteroffer-20260130/manual-queries/proposal-data.json
```

Then Claude can read the file:
```bash
cat .claude/debug-sessions/counteroffer-20260130/manual-queries/proposal-data.json
```

---

## Recommended Immediate Action

**For fastest resolution:**

1. **Check if Supabase MCP plugin is enabled** in current project:
   - Run: `claude mcp list` or check `.claude/settings.json`

2. **If plugin exists but not connected:**
   - Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
   - Restart Claude session

3. **If plugin doesn't exist:**
   - Use **Option 2** (REST API) or **Option 3** (psql) for immediate database access
   - Install MCP server for future sessions (Option 1)

---

## Questions for User

To proceed with reconnection, need to know:

1. **Do you have the service_role key** for project `qzsmhgyojmwvtjmnrdea`?
2. **Is it stored in an environment variable** (if so, what name)?
3. **Do you prefer:**
   - A. Reconnecting MCP server (requires restart)
   - B. Using REST API for this session only
   - C. Using psql for direct database access
   - D. Manual query export/import workflow

---

## Next Steps After Reconnection

Once database access is restored:

1. **Re-run Phase 1** (Setup & Data Reset)
2. **Verify correct user** for proposal `1769130751870x21602817865937584`
3. **Confirm schema** (lease table, _message table columns)
4. **Resume autonomous debug cycle**

---

**Status**: Waiting for user input on preferred reconnection method.
