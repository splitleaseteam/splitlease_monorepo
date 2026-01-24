---
name: audit-test-sharding-ci
description: Audit the codebase to verify test sharding configuration for CI parallel execution. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Test Sharding CI Audit

You are conducting a comprehensive audit to verify test sharding configuration and identify opportunities to parallelize test execution across multiple CI runners.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **CI workflow files** - Look for:
   - `.github/workflows/*.yml`
   - E2E test workflows
   - Unit test workflows
   - Matrix strategy configuration

2. **Playwright configuration** - Look for:
   - `playwright.config.ts`
   - Shard-related settings
   - Reporter configuration (blob, html)

3. **Vitest configuration** - Look for:
   - `vitest.config.ts`
   - Shard settings
   - Coverage configuration

4. **Test files** - Count:
   - Total E2E test files
   - Total unit test files
   - Estimated test duration

5. **Report merging** - Check for:
   - Blob reporter configuration
   - Report merge job in CI
   - Artifact upload/download

### What to Check for Each Target

For CI sharding, verify:
- Matrix strategy with shard numbers
- `fail-fast: false` is set
- Blob reporter configured for merging
- Report merge job exists
- Auth state shared across shards
- Browser cache configured
- Timeouts set on jobs
- Artifacts uploaded for debugging

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-test-sharding-ci.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Test Sharding CI Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- CI workflows found: X
- Sharding configured: Yes/No
- Report merging configured: Yes/No
- Estimated time savings: X minutes

## Performance Impact Analysis

### Current State (If No Sharding)
```
Runner 1: Tests 1-100
Time: X minutes
```

### With Sharding (4 Runners)
```
Runner 1: Tests 1-25    ─┐
Runner 2: Tests 26-50   ─┼─► All run in parallel
Runner 3: Tests 51-75   ─┤
Runner 4: Tests 76-100  ─┘
Time: X/4 minutes (4x faster)
```

## Test Count Analysis

### E2E Tests
| Category | File Count | Test Count | Estimated Duration |
|----------|------------|------------|-------------------|
| Buyer tests | X | X | X min |
| Seller tests | X | X | X min |
| Admin tests | X | X | X min |
| Guest tests | X | X | X min |
| **Total** | **X** | **X** | **X min** |

### Unit Tests
| Category | File Count | Test Count | Estimated Duration |
|----------|------------|------------|-------------------|
| Hooks | X | X | X min |
| Components | X | X | X min |
| Utils | X | X | X min |
| **Total** | **X** | **X** | **X min** |

### Recommended Shard Count
- E2E tests: X shards (target ~5 min per shard)
- Unit tests: X shards (target ~2 min per shard)

## CI Workflow Gaps

### Missing Sharding Configuration
| Workflow | Type | Sharding | Report Merge |
|----------|------|----------|--------------|
| e2e.yml | E2E | ? | ? |
| test.yml | Unit | ? | ? |
| ci.yml | Both | ? | ? |

### Current Workflow Status
```yaml
# Found in: .github/workflows/e2e.yml (or missing)
strategy:
  matrix:
    shard: [?]  # Missing or incomplete
```

## Configuration Gaps

### Playwright Config
- [ ] Blob reporter configured
- [ ] HTML reporter for local dev
- [ ] GitHub reporter for PR annotations

### Current Reporter Status
```typescript
// Found in: playwright.config.ts
reporter: [?]  // Missing blob reporter
```

### Vitest Config
- [ ] Shard support via CLI
- [ ] Coverage reporters configured

## Matrix Strategy Gaps

### Missing Matrix Configuration
- [ ] `strategy.matrix.shard` defined
- [ ] `fail-fast: false` set
- [ ] Shard count appropriate for test count

### Recommended Matrix
```yaml
strategy:
  fail-fast: false
  matrix:
    shard: [1, 2, 3, 4]  # Adjust based on test count
```

## Report Merging Gaps

### Missing Blob Upload
- [ ] Blob report uploaded as artifact
- [ ] Artifact naming includes shard number
- [ ] Retention days configured

### Missing Merge Job
- [ ] Merge job depends on test jobs
- [ ] Blob reports downloaded
- [ ] Reports merged with `playwright merge-reports`
- [ ] Final report uploaded

## Auth State Sharing Gaps

### Missing Auth State Artifacts
- [ ] Auth setup runs once
- [ ] Auth state uploaded as artifact
- [ ] Test shards download auth state
- [ ] Auth state not duplicated per shard

## Caching Gaps

### Missing Cache Configuration
| Cache Target | Status | Impact |
|--------------|--------|--------|
| npm dependencies | ? | ~30s per job |
| Playwright browsers | ? | ~1min per job |

### Recommended Caching
```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
```

## Timeout Configuration Gaps

### Missing Timeouts
| Job | Current Timeout | Recommended |
|----|-----------------|-------------|
| E2E shards | ? | 30 minutes |
| Unit test shards | ? | 10 minutes |
| Report merge | ? | 5 minutes |

## Artifact Upload Gaps

### Missing Artifacts
| Artifact | Upload | Retention | Status |
|----------|--------|-----------|--------|
| Blob reports | ? | 1 day | ? |
| Screenshots | ? | 7 days | ? |
| Videos | ? | 7 days | ? |
| Final report | ? | 30 days | ? |

## Dynamic Shard Count Gaps

### Not Using Dynamic Sharding
- [ ] Shard count based on test count
- [ ] Minimum/maximum shard limits
- [ ] Different shard counts for PR vs main

## Conditional Sharding Gaps

### Same Sharding for All Branches
- [ ] Full sharding on main branch
- [ ] Reduced/no sharding on PRs
- [ ] Smoke tests only on feature branches

## Workflows With Good Sharding (Reference)

List any workflows that already have proper sharding configured.

## Recommended Configuration

### Complete E2E Workflow with Sharding
```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:

env:
  CI: true
  BASE_URL: ${{ secrets.STAGING_URL }}

jobs:
  # Setup job - runs auth setup once
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps

      - name: Run auth setup
        run: npx playwright test --project=setup
        env:
          TEST_BUYER_EMAIL: ${{ secrets.TEST_BUYER_EMAIL }}
          TEST_BUYER_PASSWORD: ${{ secrets.TEST_BUYER_PASSWORD }}

      - name: Upload auth state
        uses: actions/upload-artifact@v4
        with:
          name: auth-state
          path: playwright/.auth/
          retention-days: 1

  # Sharded test jobs
  e2e:
    needs: setup
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}

      - run: npm ci
      - run: npx playwright install --with-deps

      - name: Download auth state
        uses: actions/download-artifact@v4
        with:
          name: auth-state
          path: playwright/.auth/

      - name: Run tests (shard ${{ matrix.shard }}/4)
        run: npx playwright test --shard=${{ matrix.shard }}/4

      - name: Upload blob report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report/
          retention-days: 1

  # Merge reports from all shards
  merge-reports:
    if: always()
    needs: e2e
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci

      - name: Download blob reports
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true

      - name: Merge reports
        run: npx playwright merge-reports --reporter html ./all-blob-reports

      - name: Upload final report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Deploy report to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./playwright-report
```

### Playwright Blob Reporter Config
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  reporter: process.env.CI
    ? [['blob'], ['github']]  // Blob for merging, GitHub for PR annotations
    : [['html']],             // HTML for local development

  // ...
})
```

### Unit Test Sharding Workflow
```yaml
# .github/workflows/unit.yml
name: Unit Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --shard=${{ matrix.shard }}/4
```

### Dynamic Shard Count
```yaml
jobs:
  determine-shards:
    runs-on: ubuntu-latest
    outputs:
      shard-count: ${{ steps.count.outputs.shards }}
    steps:
      - uses: actions/checkout@v4
      - id: count
        run: |
          TEST_COUNT=$(find e2e/tests -name "*.spec.ts" | wc -l)
          # 1 shard per 10 test files, minimum 1, maximum 10
          SHARDS=$(( (TEST_COUNT + 9) / 10 ))
          SHARDS=$(( SHARDS > 10 ? 10 : SHARDS ))
          SHARDS=$(( SHARDS < 1 ? 1 : SHARDS ))
          echo "shards=$SHARDS" >> $GITHUB_OUTPUT

  e2e:
    needs: determine-shards
    strategy:
      matrix:
        shard: ${{ fromJson(format('[{0}]', join(range(1, fromJson(needs.determine-shards.outputs.shard-count) + 1), ','))) }}
    steps:
      - run: npx playwright test --shard=${{ matrix.shard }}/${{ needs.determine-shards.outputs.shard-count }}
```

### Conditional Sharding (PR vs Main)
```yaml
jobs:
  e2e:
    strategy:
      matrix:
        shard: ${{ github.ref == 'refs/heads/main' && fromJson('[1,2,3,4]') || fromJson('[1]') }}
    steps:
      - run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            npx playwright test --shard=${{ matrix.shard }}/4
          else
            npx playwright test  # Run all tests
          fi
```

```

---

## Reference: Test Sharding Patterns

### Performance Impact

```
WITHOUT sharding (sequential):
Runner 1: Tests 1-100
Time: 20 minutes

WITH sharding (4 runners):
Runner 1: Tests 1-25    ─┐
Runner 2: Tests 26-50   ─┼─► All run in parallel
Runner 3: Tests 51-75   ─┤
Runner 4: Tests 76-100  ─┘
Time: 5 minutes (4x faster)
```

### Basic Sharding Command

```bash
# Split into 4 shards, run shard 1
npx playwright test --shard=1/4

# Run shard 2
npx playwright test --shard=2/4

# Vitest sharding
npm test -- --shard=1/4
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| `fail-fast: true` | Use `fail-fast: false` to see all failures |
| No report merging | Merge blob reports from all shards |
| Hardcoded shard count | Adjust based on test count/duration |
| Auth setup in each shard | Run auth setup once, share state |
| No caching | Cache npm and Playwright browsers |
| No timeout | Set `timeout-minutes` to prevent hung jobs |

### Checklist

- [ ] Shards configured in CI matrix
- [ ] `fail-fast: false` set
- [ ] Blob reporter configured for merging
- [ ] Merge reports job added
- [ ] Auth state shared across shards
- [ ] Browser cache configured
- [ ] Timeouts set on jobs
- [ ] Artifacts uploaded for debugging

## Output Requirements

1. Be thorough - review ALL CI workflow files
2. Be specific - include exact file paths and configuration
3. Be actionable - provide complete workflow templates
4. Only report gaps - do not list configured items unless as reference
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-test-sharding-ci.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
