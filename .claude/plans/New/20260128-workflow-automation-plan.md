# Split Lease Workflow Automation Improvement Plan
**Generated:** 2026-01-28
**Source:** Consolidated analysis of 7 Opportunity audits from `.claude/plans/Opportunities/260127/`

---

## Executive Summary

The Split Lease codebase has extensive production code (**82 custom hooks, 15+ Edge Functions, 50+ pages**) but nearly **zero automated test coverage**. This plan consolidates findings from 7 audit reports and proposes actionable automation improvements to enhance workflow reliability, security, and developer productivity.

### Key Metrics
| Metric | Current | Target |
|--------|---------|--------|
| Custom Hook Test Coverage | 1.2% | 80% |
| E2E Test Coverage | 0% | 60% |
| Webhook Signature Verification | 1/6 handlers | 6/6 handlers |
| SMS/Notification Mocking | 0% | 100% |
| Realtime Feature Tests | 0% | 100% |
| Auth Flow Tests | 0% | 100% |

---

## Phase 1: Test Infrastructure Foundation (Week 1-2)

### 1.1 Install Testing Dependencies

```bash
cd app
bun add -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom happy-dom msw @playwright/test
```

### 1.2 Create Vitest Configuration

**File:** `app/vitest.config.js`
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/auth.js',
        'src/hooks/**/*.js',
        'src/logic/**/*.js',
        'src/islands/**/*.js',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 1.3 Create Playwright Configuration

**File:** `app/playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
  },
  projects: [
    // Auth setup - runs first
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    // Host tests
    {
      name: 'host-tests',
      testMatch: /.*\.host\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/host.json' },
      dependencies: ['setup'],
    },
    // Guest tests
    {
      name: 'guest-tests',
      testMatch: /.*\.guest\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/guest.json' },
      dependencies: ['setup'],
    },
    // Public tests (no auth)
    {
      name: 'public-tests',
      testMatch: /.*\.public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 1.4 Create Test Setup Files

**Directory Structure:**
```
app/
├── src/
│   └── test/
│       ├── setup.ts              # Vitest setup
│       └── mocks/
│           ├── server.ts         # MSW server
│           ├── handlers/
│           │   ├── auth.ts       # Auth API mocks
│           │   ├── supabase.ts   # Supabase mocks
│           │   └── twilio.ts     # Twilio mocks
│           ├── supabaseMock.ts   # Supabase client mock
│           └── MockWebSocket.ts  # WebSocket mock
├── e2e/
│   ├── auth.setup.ts             # Reusable auth state
│   ├── fixtures/
│   │   ├── pages.ts              # Page object fixtures
│   │   └── auth.ts               # Auth fixtures
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── SearchPage.ts
│   │   └── ListingPage.ts
│   └── tests/
│       ├── login.guest.spec.ts
│       ├── search.public.spec.ts
│       └── booking.guest.spec.ts
└── vitest.config.js
```

### 1.5 Update Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    "test:all": "bun run test && bun run test:e2e"
  }
}
```

---

## Phase 2: Security-Critical Automation (Week 2-3)

### 2.1 Implement Webhook Signature Verification

**Gap:** 5 of 6 webhook handlers accept requests without verifying signatures.

| Handler | File | Fix Required |
|---------|------|--------------|
| cohost-request-slack-callback | `supabase/functions/cohost-request-slack-callback/index.ts` | Add Slack signature verification |
| webhook-sendgrid | `supabase/functions/reminder-scheduler/handlers/webhook.ts` | Add SendGrid signature verification |
| webhook-twilio | `supabase/functions/reminder-scheduler/handlers/webhook.ts` | Add Twilio signature verification |

**Shared Verification Helper:**

**File:** `supabase/functions/_shared/webhookVerification.ts`
```typescript
import * as crypto from 'https://deno.land/std/crypto/mod.ts';

export function verifySlackSignature(
  body: string,
  signature: string,
  timestamp: string,
  signingSecret: string
): boolean {
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
  if (parseInt(timestamp) < fiveMinutesAgo) return false;

  const sigBasestring = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', signingSecret);
  const expectedSignature = 'v0=' + hmac.update(sigBasestring).digest('hex');

  return crypto.timingSafeEqual(
    new TextEncoder().encode(signature),
    new TextEncoder().encode(expectedSignature)
  );
}

export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], '');
  const data = url + sortedParams;

  const hmac = crypto.createHmac('sha1', authToken);
  const expectedSignature = hmac.update(data).digest('base64');

  return crypto.timingSafeEqual(
    new TextEncoder().encode(signature),
    new TextEncoder().encode(expectedSignature)
  );
}
```

### 2.2 Auth Test Suite

**Priority Tests (auth.js coverage):**

| Function | Test File | Priority |
|----------|-----------|----------|
| `loginUser()` | `auth.test.js` | P0 |
| `signupUser()` | `auth.test.js` | P0 |
| `validateTokenAndFetchUser()` | `auth.test.js` | P0 |
| `requestPasswordReset()` | `auth.test.js` | P1 |
| `updatePassword()` | `auth.test.js` | P1 |
| `logoutUser()` | `auth.test.js` | P2 |

---

## Phase 3: Workflow Automation Skills (Week 3-4)

### 3.1 Test Runner Skill

**File:** `.claude/skills/test-runner/SKILL.md`
```markdown
# Test Runner Skill

## Trigger
Invoke after creating or modifying:
- Any file in `app/src/hooks/`
- Any file in `app/src/logic/`
- Any Edge Function handler

## Actions
1. Run affected unit tests: `bun run test -- --grep "{filename}"`
2. Report pass/fail status
3. If tests fail, suggest fixes
```

### 3.2 E2E Runner Skill

**File:** `.claude/skills/e2e-runner/SKILL.md`
```markdown
# E2E Runner Skill

## Trigger
Invoke before:
- Creating a PR
- Merging to main
- Deploying to production

## Actions
1. Start dev server if not running
2. Run Playwright tests: `bun run test:e2e`
3. Generate HTML report
4. Upload screenshots on failure
```

### 3.3 Coverage Audit Skill

**File:** `.claude/skills/coverage-audit/SKILL.md`
```markdown
# Coverage Audit Skill

## Trigger
- Weekly cron (Sunday 9am)
- Manual: `/audit-coverage`

## Actions
1. Run: `bun run test:coverage`
2. Parse coverage JSON
3. Compare to previous week
4. Generate markdown report
5. Alert if coverage drops >5%
```

---

## Phase 4: CI/CD Pipeline (Week 4-5)

### 4.1 GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: cd app && bun install
      - run: cd app && bun run lint

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: cd app && bun install
      - run: cd app && bun run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          file: ./app/coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: cd app && bun install
      - run: npx playwright install --with-deps
      - run: cd app && bun run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: app/playwright-report

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd app && npm audit --audit-level=high
```

### 4.2 Pre-commit Hooks

**File:** `.husky/pre-commit`
```bash
#!/bin/sh
cd app && bun run lint:check
cd app && bun run test -- --run --bail
```

---

## Phase 5: Monitoring & Alerting (Week 5-6)

### 5.1 Test Failure Slack Alerts

Integrate with existing `/slack-webhook` skill:
- Alert on CI test failures
- Include failed test names and error messages
- Link to GitHub Actions run

### 5.2 Coverage Tracking

- Store coverage history in `.claude/metrics/`
- Generate weekly coverage trend charts
- Alert if coverage drops below thresholds

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Install test dependencies
- [ ] Create vitest.config.js
- [ ] Create playwright.config.ts
- [ ] Create test setup files
- [ ] Create MSW handlers
- [ ] Update package.json scripts

### Week 2: Core Tests
- [ ] Test useAuthenticatedUser hook
- [ ] Test auth.js login/signup
- [ ] Test validateTokenAndFetchUser
- [ ] Create MSW handlers for Supabase

### Week 3: Security
- [ ] Implement Slack signature verification
- [ ] Implement Twilio signature verification
- [ ] Implement SendGrid signature verification
- [ ] Add webhook handler tests

### Week 4: E2E
- [ ] Create auth.setup.ts for reusable auth
- [ ] Create LoginPage page object
- [ ] Create SearchPage page object
- [ ] Write first 5 E2E tests

### Week 5: CI/CD
- [ ] Create GitHub Actions workflow
- [ ] Add pre-commit hooks
- [ ] Configure Codecov integration
- [ ] Add Slack notifications

### Week 6: Monitoring
- [ ] Create coverage audit skill
- [ ] Set up weekly coverage reports
- [ ] Configure failure alerts

---

## Estimated Effort

| Phase | Hours | Team Impact |
|-------|-------|-------------|
| Phase 1: Infrastructure | 16-24 | Unblocks all testing |
| Phase 2: Security | 12-16 | Fixes vulnerabilities |
| Phase 3: Skills | 8-12 | Automates workflows |
| Phase 4: CI/CD | 8-12 | Catches regressions |
| Phase 5: Monitoring | 4-8 | Visibility & alerts |
| **Total** | **48-72** | |

---

## Success Metrics

| Metric | 30-Day Target | 90-Day Target |
|--------|---------------|---------------|
| Unit Test Coverage | 40% | 80% |
| E2E Test Coverage | 20% | 60% |
| CI Pipeline Pass Rate | 90% | 98% |
| Mean Time to Fix (tests) | <4 hours | <1 hour |
| Webhook Security | 100% verified | Maintained |

---

## Related Files

### Audit Reports (Source)
- [audit-reusable-auth-state.md](.claude/plans/Opportunities/260127/20260127110143-audit-reusable-auth-state.md)
- [audit-webhook-handler-tests.md](.claude/plans/Opportunities/260127/20260127113136-audit-webhook-handler-tests.md)
- [audit-twilio-sms-mocking.md](.claude/plans/Opportunities/260127/20260127113754-audit-twilio-sms-mocking.md)
- [audit-custom-hook-tests.md](.claude/plans/Opportunities/260127/20260127115508-audit-custom-hook-tests.md)
- [audit-websocket-realtime-tests.md](.claude/plans/Opportunities/260127/20260127120000-audit-websocket-realtime-tests.md)
- [audit-supabase-auth-tests.md](.claude/plans/Opportunities/260127/20260127120744-audit-supabase-auth-tests.md)
- [audit-page-object-model.md](.claude/plans/Opportunities/260127/20260127153045-audit-page-object-model.md)

### Key Implementation Files
- [app/src/lib/auth.js](app/src/lib/auth.js) - Core auth system (2,000+ lines)
- [app/src/hooks/useAuthenticatedUser.js](app/src/hooks/useAuthenticatedUser.js) - Gold standard auth hook
- [supabase/functions/auth-user/](supabase/functions/auth-user/) - Auth Edge Functions
- [supabase/functions/_shared/](supabase/functions/_shared/) - Shared utilities
- [supabase/functions/reminder-scheduler/handlers/webhook.ts](supabase/functions/reminder-scheduler/handlers/webhook.ts) - Webhook handlers

---

*This plan was generated by analyzing 7 opportunity audit reports and consolidating them into an actionable automation roadmap.*
