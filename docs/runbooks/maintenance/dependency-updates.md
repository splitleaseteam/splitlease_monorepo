# Dependency Updates

## Overview

This runbook covers the process for updating dependencies in the Split Lease codebase, including security updates, major version upgrades, and routine maintenance. Dependencies include npm packages (frontend), Deno modules (Edge Functions), and system dependencies.

## Prerequisites

- Access to the GitHub repository
- Node.js/Bun installed locally
- Deno installed locally
- Understanding of semantic versioning
- Access to run tests

## Dependency Inventory

### Frontend (app/)

| Category | Key Dependencies |
|----------|------------------|
| Framework | React 18, Vite 5 |
| UI | Tailwind CSS 4, Framer Motion, Lucide React |
| State | React Hook Form, Zod |
| Backend | Supabase JS Client |
| Testing | Vitest, Testing Library, Playwright |
| Build | ESLint, TypeScript |

### Edge Functions (supabase/functions/)

| Category | Key Dependencies |
|----------|------------------|
| Runtime | Deno |
| Supabase | @supabase/supabase-js |
| Utilities | Shared modules in _shared/ |

## Update Schedule

| Update Type | Frequency | Risk Level |
|-------------|-----------|------------|
| Security patches | Immediately | Low (usually) |
| Minor versions | Weekly | Low |
| Major versions | Monthly review | High |
| Deno updates | Monthly | Medium |

## Procedure: Routine Updates

### Step 1: Check for Outdated Packages

**Frontend:**
```bash
cd app
bun outdated
```

**Deno (Edge Functions):**
```bash
cd supabase/functions
deno cache --reload **/*.ts
```

### Step 2: Review Changes

For each outdated package:
1. Check changelog for breaking changes
2. Review GitHub issues for known problems
3. Assess impact on codebase

### Step 3: Update Dependencies

**Update all minor/patch versions:**
```bash
cd app
bun update
```

**Update specific package:**
```bash
bun update <package-name>
```

**Update to latest major version (careful!):**
```bash
bun add <package-name>@latest
```

### Step 4: Run Tests

```bash
cd app
bun run lint
bun run typecheck
bun run test
```

### Step 5: Test Locally

```bash
bun run dev
```

Test key functionality:
- [ ] Home page loads
- [ ] Login/signup works
- [ ] Search functions
- [ ] Listing details display

### Step 6: Deploy to Development

```bash
bun run deploy:dev
```

Test on development environment.

### Step 7: Create PR

Create a pull request with:
- List of updated packages
- Reason for updates
- Test results

## Procedure: Security Updates

### Step 1: Identify Vulnerability

Check for security advisories:
```bash
cd app
bun audit
```

### Step 2: Assess Severity

| Severity | Action |
|----------|--------|
| Critical | Update immediately |
| High | Update within 24 hours |
| Medium | Update within 1 week |
| Low | Include in next routine update |

### Step 3: Apply Update

```bash
# Update specific vulnerable package
bun update <package-name>

# Or update to specific fixed version
bun add <package-name>@<fixed-version>
```

### Step 4: Verify Fix

```bash
bun audit
```

Confirm vulnerability is resolved.

### Step 5: Fast-Track Deployment

For critical/high severity:
1. Skip feature branch, commit to main
2. Run minimal tests
3. Deploy immediately
4. Monitor for regressions

## Procedure: Major Version Upgrade

### Step 1: Research the Upgrade

1. Read migration guide
2. Check breaking changes
3. Review community feedback
4. Estimate effort

### Step 2: Create Upgrade Branch

```bash
git checkout -b upgrade/<package-name>-v<version>
```

### Step 3: Update Package

```bash
bun add <package-name>@<major-version>
```

### Step 4: Fix Breaking Changes

Follow migration guide to update code:
- API changes
- Configuration changes
- Deprecated features

### Step 5: Comprehensive Testing

```bash
# All tests
bun run lint
bun run typecheck
bun run test

# Manual testing of all major features
bun run dev
```

### Step 6: Update Documentation

Update any affected documentation:
- README
- CLAUDE.md (if build process changes)
- Code comments

### Step 7: Create PR with Details

Include:
- Migration steps taken
- Breaking changes addressed
- Test results
- Rollback plan

### Step 8: Deploy Gradually

1. Deploy to development
2. Test for 24 hours
3. Deploy to production
4. Monitor closely

## Specific Update Guides

### React Updates

```bash
bun add react@latest react-dom@latest
```

Check for:
- Deprecated lifecycle methods
- Changed behavior
- New strict mode warnings

### Vite Updates

```bash
bun add vite@latest
```

Check:
- `vite.config.js` compatibility
- Plugin compatibility
- Build output changes

### Tailwind CSS Updates

```bash
bun add tailwindcss@latest
```

Check:
- Config format changes
- Utility class changes
- PostCSS config

### Supabase Client Updates

**Frontend:**
```bash
bun add @supabase/supabase-js@latest
```

**Edge Functions:**
Update import version in `.ts` files:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.XX.X';
```

Check:
- API changes
- Auth changes
- Real-time changes

### Deno Updates

1. Download new Deno version from deno.land
2. Update `supabase/config.toml`:
```toml
[edge_runtime]
deno_version = 2
```
3. Test Edge Functions locally
4. Deploy and monitor

## Verification

After any update:

1. **Run full test suite:**
```bash
bun run test
```

2. **Build succeeds:**
```bash
bun run build
```

3. **Local preview works:**
```bash
bun run preview
```

4. **Deploy to dev and test:**
```bash
bun run deploy:dev
```

5. **Monitor production after deploy:**
   - Error rates
   - Performance metrics
   - User reports

## Rollback

### Frontend Rollback

```bash
# Revert to previous lock file
git checkout HEAD~1 bun.lock
bun install

# Or revert entire commit
git revert <commit-hash>
```

### Edge Function Rollback

```bash
# Checkout previous version
git checkout <previous-commit> supabase/functions/<function-name>/

# Redeploy
supabase functions deploy <function-name> --project-ref <project-id>
```

## Troubleshooting

### Peer Dependency Conflicts

```bash
# Check what's conflicting
bun install

# Force resolution (use carefully)
# Add to package.json:
"overrides": {
  "<package>": "<version>"
}
```

### Type Errors After Update

1. Check if @types package also needs update
2. Review type definition changes
3. Update code to match new types

### Build Fails After Update

1. Clear cache:
```bash
rm -rf node_modules/.vite
bun install --force
```

2. Check for config changes needed
3. Review error messages carefully

## Escalation

| Issue | Escalate To |
|-------|-------------|
| Critical security vulnerability | Security Team + Engineering Lead |
| Major upgrade breaking production | All hands |
| Can't resolve dependency conflicts | Engineering Lead |
| Upstream bug in dependency | Consider alternatives, escalate if critical |

## Related Runbooks

- [../deployment/deploy-frontend.md](../deployment/deploy-frontend.md) - Frontend deployment
- [../deployment/deploy-edge-functions.md](../deployment/deploy-edge-functions.md) - Edge Function deployment
- [../incidents/outage-frontend.md](../incidents/outage-frontend.md) - Frontend issues

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
