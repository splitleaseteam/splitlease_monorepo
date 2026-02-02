---
name: audit-vitest-rtl-setup
description: Audit the codebase to verify Vitest and React Testing Library configuration is complete and properly set up. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Vitest + RTL Setup Audit

You are conducting a comprehensive audit to verify that Vitest and React Testing Library are properly configured for the project.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL configuration files to identify:

### Target Files to Check

1. **Vitest configuration** - Look for:
   - `vitest.config.ts` or `vitest.config.js`
   - Test configuration in `vite.config.ts`
   - Workspace configuration for monorepos

2. **Setup files** - Look for:
   - `src/test/setup.ts` or similar
   - `setupFiles` configuration
   - Global test utilities

3. **Custom render** - Look for:
   - `test-utils.tsx` with provider wrappers
   - Custom render function
   - Re-exports from RTL

4. **TypeScript configuration** - Look for:
   - `vitest.d.ts` type declarations
   - Types in `tsconfig.json`
   - Global type augmentation

5. **MSW integration** - Look for:
   - `src/mocks/server.ts`
   - `src/mocks/handlers.ts`
   - MSW setup in test setup file

6. **Package.json scripts** - Look for:
   - `test` script
   - `test:coverage` script
   - `test:watch` script

### What to Verify

For each configuration area:
- Is it present?
- Is it correctly configured?
- Are common issues addressed?

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-vitest-rtl-setup.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Vitest + RTL Setup Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Setup completeness: X%
- Critical issues: X
- Warnings: X

## Configuration Checklist

### Dependencies
| Package | Required | Installed | Version |
|---------|----------|-----------|---------|
| vitest | Yes | ? | ? |
| @testing-library/react | Yes | ? | ? |
| @testing-library/jest-dom | Yes | ? | ? |
| @testing-library/user-event | Yes | ? | ? |
| jsdom | Yes | ? | ? |
| @vitest/coverage-v8 | Recommended | ? | ? |
| msw | Recommended | ? | ? |

### vitest.config.ts
| Setting | Expected | Current | Status |
|---------|----------|---------|--------|
| environment | 'jsdom' | ? | ? |
| globals | true | ? | ? |
| setupFiles | ['./src/test/setup.ts'] | ? | ? |
| include | ['src/**/*.test.{ts,tsx}'] | ? | ? |
| coverage.provider | 'v8' | ? | ? |

### Setup File (src/test/setup.ts)
| Configuration | Present | Status |
|---------------|---------|--------|
| @testing-library/jest-dom import | ? | ? |
| cleanup() in afterEach | ? | ? |
| matchMedia mock | ? | ? |
| IntersectionObserver mock | ? | ? |
| ResizeObserver mock | ? | ? |
| scrollTo mock | ? | ? |
| MSW server setup | ? | ? |

### Custom Render (src/test/test-utils.tsx)
| Feature | Present | Status |
|---------|---------|--------|
| File exists | ? | ? |
| QueryClientProvider wrapper | ? | ? |
| BrowserRouter wrapper | ? | ? |
| AuthProvider wrapper | ? | ? |
| Custom render export | ? | ? |
| Re-exports from RTL | ? | ? |
| userEvent export | ? | ? |

### TypeScript Configuration
| Setting | Expected | Current | Status |
|---------|----------|---------|--------|
| vitest.d.ts exists | Yes | ? | ? |
| vitest/globals in types | Yes | ? | ? |
| @testing-library/jest-dom in types | Yes | ? | ? |

### NPM Scripts
| Script | Expected | Current | Status |
|--------|----------|---------|--------|
| test | vitest | ? | ? |
| test:run | vitest run | ? | ? |
| test:coverage | vitest run --coverage | ? | ? |
| test:watch | vitest --watch | ? | ? |

### MSW Integration
| Configuration | Present | Status |
|---------------|---------|--------|
| src/mocks/handlers.ts | ? | ? |
| src/mocks/server.ts | ? | ? |
| beforeAll server.listen() | ? | ? |
| afterEach server.resetHandlers() | ? | ? |
| afterAll server.close() | ? | ? |

## Critical Issues

### 1. [Issue Title]
- **File:** `path/to/file`
- **Problem:** Description of the issue
- **Impact:** What breaks without this
- **Fix:**
  ```typescript
  // Code to fix the issue
  ```

## Warnings

### 1. [Warning Title]
- **File:** `path/to/file`
- **Recommendation:** What should be done

## Missing Files

### 1. src/test/setup.ts
**Status:** Missing
**Template:**
```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// Browser API mocks...
```

### 2. src/test/test-utils.tsx
**Status:** Missing
**Template:**
```typescript
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    // Add your providers here
    <>{children}</>
  )
}

function customRender(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
export { customRender as render }
```

### 3. src/test/vitest.d.ts
**Status:** Missing
**Template:**
```typescript
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />
```

## Recommended vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: { statements: 80, branches: 80, functions: 80, lines: 80 },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test'),
    },
  },
})
```

```

---

## Reference: Required Configuration

### Minimum Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
```

### Minimum vitest.config.ts

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

### Minimum setup.ts

```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())
```

### Common Issues to Flag

| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing jsdom | "document is not defined" | Add `environment: 'jsdom'` |
| Missing cleanup | Tests affect each other | Add `cleanup()` in afterEach |
| Missing matchMedia mock | Responsive components fail | Add matchMedia mock |
| No globals | Must import describe/it/expect | Add `globals: true` |

## Output Requirements

1. Be thorough - check ALL configuration files
2. Be specific - include exact file paths and line numbers
3. Be actionable - provide complete code templates for missing files
4. Only report gaps - do not list correctly configured items unless summarizing
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-vitest-rtl-setup.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
