# Deployment Synchronization Root Cause Analysis

**Created**: 2026-02-02 15:20:00
**Issue**: Local fixes not appearing on production (split.lease)
**Severity**: CRITICAL - Blocking deployment of bug fixes

---

## Summary

Many bugs that were fixed locally (on localhost) are still appearing on production (split.lease) after running the `/deploy` command. This is causing massive confusion and making it unclear which bugs are truly fixed vs. deployment failures.

---

## Root Cause

**The Split Lease application has TWO separate deployment processes:**

1. **Frontend Deployment** (`/deploy` command)
   - Deploys frontend (React/Vite app) to Cloudflare Pages
   - Project: `splitlease`
   - URL: `split.lease` (production domain)
   - Deploys from: `app/dist/`

2. **Backend Deployment** (`/functions` command for production, `/functions-dev` for development)
   - Deploys Supabase Edge Functions (Deno/TypeScript)
   - Production project ref: `qcfifybkaddcoimjroca` (splitlease-backend-live)
   - Development project ref: `qzsmhgyojmwvtjmnrdea` (splitlease-backend-dev)
   - Deploys from: `supabase/functions/`

**The problem:** Many bug fixes involve BOTH frontend and backend changes. If only one deployment process runs, the fix will be incomplete on production.

---

## Evidence from Loom Video

From the video transcript, the user states:
> "I just deployed... and after having the dev functions, uh, the edge functions, uh, deployed to, just the side."

This suggests:
- User deployed edge functions to **development** (`/functions-dev`)
- User may have deployed frontend to production (`/deploy`)
- User did NOT deploy edge functions to **production** (`/functions`)

This would explain why:
- Frontend UI changes work locally but not on production
- Backend features (messages creation, proposals loading, AI summaries) fail on production
- The user is confused about what's deployed and what's not

---

## Affected Bugs (Backend Issues)

These bugs are likely caused by edge functions not being deployed to production:

| Bug # | Description | Affected Edge Function |
|-------|-------------|------------------------|
| #1 | Empty proposals page | `proposal` (GET action) |
| #4 | Messages not being created | `messages` (CREATE action) |
| #5 | Host proposals page broken | `proposal` (GET with host filter) |
| #10 | Lease creation failing on acceptance | `proposal` (ACCEPT action) → lease workflow |
| #11 | Message notifications not showing | `messages` (GET unread count) |
| #16 | AI summaries not created | `ai-gateway` (summary generation) |

These bugs were likely fixed in the edge functions code locally, but those fixes were never deployed to the production Supabase project.

---

## Affected Bugs (Frontend Issues)

These bugs are frontend-only issues that should have been fixed by `/deploy`:

| Bug # | Description | Affected Component |
|-------|-------------|--------------------|
| #2 | Buttons not inline | CSS/Tailwind classes |
| #3 | No images available | Image display component |
| #6 | Rental wizard not marking completed | Wizard state management |
| #7 | Wrong menu on search page | UserMenu component |
| #8 | Host overview buttons misaligned | Layout CSS |
| #13 | Host showing guest price | Display logic |

If these were fixed locally but still broken on production, possible causes:
1. Build cache not invalidated
2. Cloudflare Pages serving stale assets
3. Browser cache on the user's machine
4. Build process failed silently

---

## Affected Bugs (Full-Stack Issues)

These bugs involve BOTH frontend and backend, requiring both deployments:

| Bug # | Description | Frontend Component | Backend Function |
|-------|-------------|-------------------|------------------|
| #9 | Price calculation errors | Proposal display | `proposal` pricing logic |
| #12 | Payment records not created | Payment records UI | Payment workflow |
| #14 | Stays not created properly | Stays display | Lease creation workflow |
| #15 | Damage deposit not saved | Listing form | `listing` CREATE action |
| #17 | Weekly price calculation wrong | Price display | Pricing calculator |
| #18 | Stays failing to match nights | Stays generation UI | Lease workflow |

---

## Solution: Synchronized Deployment Process

To fix this, we need to:

### Immediate Fix (Manual)
1. Deploy all edge functions to production: `/functions`
2. Verify frontend is deployed: check `split.lease` for latest build
3. Clear Cloudflare Pages cache if needed
4. Test critical flows

### Long-Term Fix (Process Improvement)
Create a new `/ship` or `/deploy-all` command that:
1. Runs `bun run build` (frontend build)
2. Deploys frontend to Cloudflare Pages
3. Deploys all edge functions to production Supabase
4. Verifies both deployments succeeded
5. Reports deployment URLs and status

---

## Recommended Actions

### Step 1: Immediate Deployment Sync
```bash
# Deploy edge functions to production
/functions

# Verify frontend is deployed (check last deploy time)
# If frontend is stale, run:
/deploy
```

### Step 2: Verify Bug Fixes
After syncing deployments, test the following on production (split.lease):
- [ ] Host proposals page loads with proposals
- [ ] Messages are created when submitting proposals
- [ ] Lease is created when accepting proposals
- [ ] AI summaries appear on counter offers
- [ ] Buttons are properly aligned
- [ ] Rental wizard marks steps as completed

### Step 3: Document Deployment Dependencies
For each bug fix, document whether it requires:
- Frontend deployment only (`/deploy`)
- Backend deployment only (`/functions`)
- Both deployments (`/deploy` + `/functions`)

---

## Prevention

### Pre-Deployment Checklist
Before marking a bug as "fixed," verify:
1. ✅ Fix tested locally (localhost)
2. ✅ Code committed to git
3. ✅ Frontend deployed if frontend changes (`/deploy`)
4. ✅ Edge functions deployed if backend changes (`/functions`)
5. ✅ Production tested on split.lease
6. ✅ No regressions introduced

### Deployment Tracking
Maintain a deployment log:
- Last frontend deployment time
- Last edge functions deployment time
- Last commit included in each deployment
- Known discrepancies between local and production

---

## Related Files

- `.claude/commands/deploy.md` - Frontend deployment command
- `.claude/commands/functions.md` - Production edge functions deployment
- `.claude/commands/functions-dev.md` - Development edge functions deployment
- `docs/runbooks/deployment/deploy-frontend.md` - Frontend deployment runbook
- `docs/runbooks/deployment/deploy-edge-functions.md` - Edge functions runbook

---

## Next Steps

1. **Immediate**: Deploy edge functions to production to sync backend fixes
2. **Short-term**: Test all bugs on production after deployment sync
3. **Long-term**: Create unified `/ship` command for atomic full-stack deployments
4. **Process**: Update deployment process to require both frontend + backend when applicable

---

**STATUS**: Root cause identified
**ACTION**: Deploy edge functions to production before continuing bug fixes
**EXPECTED RESULT**: Backend regressions (bugs #1, #4, #5, #10, #11, #16) should be resolved
