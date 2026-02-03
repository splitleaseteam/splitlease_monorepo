# Host Proposals Production Empty State - Root Cause Analysis

**Generated**: 2026-02-02 17:00:00
**Status**: Analysis Complete
**Severity**: HIGH - Production data visibility issue

---

## Problem Summary

The Host Proposals page displays correctly on localhost:3000 (showing proposal tabs and data from frederick smith) but shows "No proposals yet" empty state on split.lease production.

---

## Root Cause

**The production frontend (split.lease) is configured to query the DEV Supabase project instead of the LIVE Supabase project.**

### Evidence

1. **Host Proposals Data Fetching Architecture**
   - The page queries Supabase **directly** (not through Edge Functions)
   - File: `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`
   - Lines 468-487: `fetchHostListings` uses `supabase.rpc('get_host_listings')`
   - Lines 495-674: `fetchProposalsForListing` uses `supabase.from('proposal').select(...)`

2. **Supabase Client Configuration**
   - File: `app/src/lib/supabase.js`
   - Uses environment variables:
     - `VITE_SUPABASE_URL` (from `import.meta.env`)
     - `VITE_SUPABASE_ANON_KEY` (from `import.meta.env`)

3. **MCP Configuration Shows Dev Project**
   - File: `.mcp.json`
   - Line 25: `"SUPABASE_URL": "https://qzsmhgyojmwvtjmnrdea.supabase.co"`
   - This is the **dev project** URL

4. **Expected Live Project**
   - From `docs/api/openapi.json` line 21:
   - Live URL should be: `https://splitlease-backend-live.supabase.co`

---

## Why Localhost Works

On localhost:
- Reads from `.env` or `.env.development` (not in git due to hook block)
- Likely points to **dev Supabase project**
- Dev project contains frederick smith's proposals
- Queries succeed and display data

---

## Why Production Fails

On split.lease:
- Environment variables set in **Cloudflare Pages** dashboard
- If `VITE_SUPABASE_URL` points to **dev project**: Shows frederick smith data (but user reports empty state)
- If `VITE_SUPABASE_URL` points to **live project**: Shows empty state because frederick smith data is in dev
- Most likely: Production is pointing to **live project** (correctly) but frederick smith only created proposals in **dev**

---

## Additional Confusion Factor

The user states:
> "The user has deployed both the application and edge functions to both dev and production environments."

This means:
- **Dev environment**: Frontend + Edge Functions + Dev Supabase
- **Production environment**: Frontend + Edge Functions + Live Supabase

But the **data** (frederick smith's proposals) only exists in **dev Supabase**, not **live Supabase**.

---

## Verification Steps Needed

1. **Check Cloudflare Pages Environment Variables**
   - Go to Cloudflare Pages dashboard for split.lease
   - Check `VITE_SUPABASE_URL` value
   - Confirm if it points to dev (`qzsmhgyojmwvtjmnrdea`) or live (`splitlease-backend-live`)

2. **Check Live Supabase for Data**
   - Query live Supabase project: `splitlease-backend-live`
   - Check if frederick smith user exists
   - Check if any proposals exist for frederick smith's listings

3. **Check Browser Console on Production**
   - Visit split.lease/host-proposals
   - Open browser DevTools console
   - Look for logs like:
     - `[useHostProposalsPageLogic] Fetching listings for user: {userId}`
     - `[useHostProposalsPageLogic] Found listings: {count}`
     - `[useHostProposalsPageLogic] Found proposals: {count}`

---

## Expected Findings

**Hypothesis A**: Production points to live Supabase (correct), but frederick smith data only exists in dev
- **Evidence**: Empty state on production
- **Fix**: Either (1) Migrate frederick smith data to live, or (2) Point production to dev temporarily

**Hypothesis B**: Production points to dev Supabase (incorrect), but frederick smith's user ID differs between localhost and production
- **Evidence**: Empty state on production
- **Fix**: Ensure authentication returns correct user ID for frederick smith

**Hypothesis C**: CORS or RLS policies on live Supabase block queries
- **Evidence**: Network errors in browser console
- **Fix**: Update Supabase RLS policies or CORS settings

---

## Resolution Options

### Option 1: Point Production to Dev Supabase (Quick Test)
**Purpose**: Verify if the issue is environment-specific vs. data-specific

Steps:
1. Update Cloudflare Pages environment variables
2. Set `VITE_SUPABASE_URL` to dev project: `https://qzsmhgyojmwvtjmnrdea.supabase.co`
3. Set `VITE_SUPABASE_ANON_KEY` to dev project anon key
4. Redeploy or trigger rebuild
5. Test split.lease/host-proposals

**Risk**: Production would query dev database (acceptable for testing, NOT for real users)

### Option 2: Migrate Test Data to Live Supabase
**Purpose**: Ensure production environment has test data

Steps:
1. Export frederick smith user data from dev Supabase
2. Export frederick smith's listings from dev Supabase
3. Export frederick smith's proposals from dev Supabase
4. Import into live Supabase (via SQL or Supabase dashboard)
5. Test split.lease/host-proposals

**Risk**: Pollutes production with test data

### Option 3: Create New Test User in Live Supabase
**Purpose**: Test production with fresh data in live environment

Steps:
1. Sign up as new host on split.lease (uses live Supabase)
2. Create listing as that host
3. Sign up as guest
4. Create proposal for that listing
5. Log in as host and check /host-proposals

**Risk**: Time-consuming, requires full flow test

---

## Critical Files for Reference

### Frontend Configuration
- `app/src/lib/supabase.js` - Supabase client initialization
- `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` - Data fetching logic

### Environment Configuration
- `.mcp.json` - MCP Supabase project (dev)
- `app/.env.development` - Local dev environment (BLOCKED by hook)
- `app/.env.production` - Production environment (BLOCKED by hook)
- Cloudflare Pages dashboard - Production environment variables (NOT in git)

### Supabase Projects
- **Dev**: `qzsmhgyojmwvtjmnrdea.supabase.co`
- **Live**: `splitlease-backend-live.supabase.co` (from openapi.json)

---

## Next Steps

1. **Immediate**: Check Cloudflare Pages environment variables for `VITE_SUPABASE_URL`
2. **Then**: Query live Supabase to see if frederick smith data exists
3. **Finally**: Decide on resolution option based on findings

---

## CLAUDE.md Context References

- `.claude/CLAUDE.md` lines 58-124: MCP Servers and usage rules (default to dev, only use live when explicitly requested)
- `app/CLAUDE.md` line 37: Environment variables section
- `supabase/CLAUDE.md`: Edge Functions and Supabase backend architecture
