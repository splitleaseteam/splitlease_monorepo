# Vitest + RTL Setup Opportunity Report
**Generated:** 2025-01-25T14:05:00Z
**Codebase:** Split Lease (split-lease)

## Executive Summary
- **Setup completeness:** 5%
- **Critical issues:** 7
- **Warnings:** 0

---

## Configuration Checklist

### Dependencies
| Package | Required | Installed | Version |
|---------|----------|-----------|---------|
| vitest | Yes | NO | - |
| @testing-library/react | Yes | NO | - |
| @testing-library/jest-dom | Yes | NO | - |
| @testing-library/user-event | Yes | NO | - |
| jsdom | Yes | NO | - |
| @vitest/coverage-v8 | Recommended | NO | - |
| msw | Recommended | NO | - |

### vitest.config.ts
| Setting | Expected | Current | Status |
|---------|----------|---------|--------|
| File exists | Yes | **NO** | ❌ CRITICAL |
| environment | 'jsdom' | N/A | ❌ CRITICAL |
| globals | true | N/A | ❌ CRITICAL |
| setupFiles | ['./src/test/setup.ts'] | N/A | ❌ CRITICAL |
| include | ['src/**/*.test.{ts,tsx}'] | N/A | ❌ CRITICAL |
| coverage.provider | 'v8' | N/A | ❌ CRITICAL |

### Setup File (src/test/setup.ts)
| Configuration | Present | Status |
|---------------|---------|--------|
| File exists | **NO** | ❌ CRITICAL |
| @testing-library/jest-dom import | NO | ❌ CRITICAL |
| cleanup() in afterEach | NO | ❌ CRITICAL |
| matchMedia mock | NO | ❌ CRITICAL |
| IntersectionObserver mock | NO | ❌ |
| ResizeObserver mock | NO | ❌ |
| scrollTo mock | NO | ❌ |
| MSW server setup | NO | ❌ |

### Custom Render (src/test/test-utils.tsx)
| Feature | Present | Status |
|---------|---------|--------|
| File exists | **NO** | ❌ CRITICAL |
| QueryClientProvider wrapper | NO | ❌ |
| BrowserRouter wrapper | NO | ❌ |
| AuthProvider wrapper | NO | ❌ |
| Custom render export | NO | ❌ CRITICAL |
| Re-exports from RTL | NO | ❌ CRITICAL |
| userEvent export | NO | ❌ CRITICAL |

### TypeScript Configuration
| Setting | Expected | Current | Status |
|---------|----------|---------|--------|
| vitest.d.ts exists | Yes | **NO** | ❌ CRITICAL |
| vitest/globals in types | Yes | NO | ❌ CRITICAL |
| @testing-library/jest-dom in types | Yes | NO | ❌ CRITICAL |

### NPM Scripts
| Script | Expected | Current | Status |
|--------|----------|---------|--------|
| test | vitest | **INVALID** | ⚠️ WARNING |
| test:run | vitest run | **MISSING** | ❌ CRITICAL |
| test:coverage | vitest run --coverage | **MISSING** | ❌ CRITICAL |
| test:watch | vitest --watch | **MISSING** | ❌ CRITICAL |

**Current test script issue:** `"test": "cd app && bun run test"` - This creates an infinite loop by calling itself. The comment says `bun run lint && vite --port 8001 --strictPort` but the actual script references itself.

### MSW Integration
| Configuration | Present | Status |
|---------------|---------|--------|
| src/mocks/handlers.ts | **NO** | ❌ |
| src/mocks/server.ts | **NO** | ❌ |
| beforeAll server.listen() | NO | ❌ |
| afterEach server.resetHandlers() | NO | ❌ |
| afterAll server.close() | NO | ❌ |

### Current Test Infrastructure
- **One test file exists:** `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`
- **Test runner:** Uses Vitest via manual `bunx vitest run` (no dev dependency installed)
- **No React Testing Library setup** - the existing test only tests pure JS functions
- **No test utilities** - no RTL, no custom render, no MSW

---

## Critical Issues

### 1. Vitest Not Installed
- **File:** `app/package.json`
- **Problem:** Vitest is not listed as a devDependency. The existing test file imports from `vitest` but it's not installed.
- **Impact:** Tests cannot run. The comment in the test file says to run with `bunx vitest run` but this requires installing on-the-fly every time.
- **Fix:**
  ```bash
  bun add -D vitest @vitest/coverage-v8 jsdom
  ```

### 2. React Testing Library Not Installed
- **File:** `app/package.json`
- **Problem:** `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` are not installed.
- **Impact:** Cannot write component tests. No ability to test React components, user interactions, or DOM behavior.
- **Fix:**
  ```bash
  bun add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```

### 3. No vitest.config.ts
- **File:** `app/vitest.config.ts` (missing)
- **Problem:** No Vitest configuration file exists. Test configuration is not defined.
- **Impact:** No jsdom environment (tests fail on `document`/`window`), no globals (must import describe/it/expect everywhere), no setup files, no coverage configuration.
- **Fix:**
  ```typescript
  // app/vitest.config.ts
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

### 4. No Test Setup File
- **File:** `app/src/test/setup.ts` (missing)
- **Problem:** No global test setup file for RTL imports, cleanup, and browser API mocks.
- **Impact:** Tests will leak DOM between tests, fail on responsive components, and lack jest-dom matchers.
- **Fix:**
  ```typescript
  // app/src/test/setup.ts
  import '@testing-library/jest-dom/vitest'
  import { cleanup } from '@testing-library/react'
  import { afterEach, vi } from 'vitest'

  // Cleanup after each test
  afterEach(() => {
    cleanup()
  })

  // Mock window.matchMedia for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() { return [] }
    unobserve() {}
  } as any

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any

  // Mock window.scrollTo
  window.scrollTo = vi.fn()
  ```

### 5. No Custom Render Utilities
- **File:** `app/src/test/test-utils.tsx` (missing)
- **Problem:** No custom render function with provider wrappers. Every test would need to manually wrap components in QueryClientProvider, BrowserRouter, AuthProvider, etc.
- **Impact:** Writing component tests is tedious and error-prone. Tests will fail due to missing context providers.
- **Fix:**
  ```typescript
  // app/src/test/test-utils.tsx
  import { render, RenderOptions } from '@testing-library/react'
  import { ReactElement, ReactNode } from 'react'
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  import { BrowserRouter } from 'react-router-dom'

  // Create a custom renderer that includes providers
  const AllTheProviders = ({ children }: { children: ReactNode }) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
    render(ui, { wrapper: AllTheProviders, ...options })

  // Re-export everything and add custom render
  export * from '@testing-library/react'
  export { customRender as render }
  ```

### 6. No TypeScript Types for Vitest
- **File:** `app/src/test/vitest.d.ts` (missing)
- **Problem:** TypeScript doesn't recognize Vitest globals (describe, it, expect, etc.) without type declarations.
- **Impact:** TypeScript errors in test files. No autocomplete for test APIs.
- **Fix:**
  ```typescript
  // app/src/test/vitest.d.ts
  /// <reference types="vitest/globals" />
  /// <reference types="@testing-library/jest-dom" />
  ```

### 7. Invalid test Script in package.json
- **File:** `app/package.json`
- **Problem:** The `"test": "cd app && bun run test"` script creates an infinite loop. The actual test command (`bun run lint && vite --port 8001 --strictPort`) is written as a comment, not executed.
- **Impact:** Running `bun test` will loop forever or error out.
- **Fix:**
  ```json
  {
    "scripts": {
      "test": "vitest --watch",
      "test:run": "vitest run",
      "test:coverage": "vitest run --coverage"
    }
  }
  ```

---

## Warnings

### 1. Existing Test Uses Pure JS
- **File:** `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`
- **Recommendation:** Consider renaming to `.test.ts` for type safety. The test imports `.js` modules but the source may be TypeScript.

---

## Missing Files

### 1. app/vitest.config.ts
**Status:** Missing
**Priority:** CRITICAL

See "Critical Issues #3" above for complete template.

### 2. app/src/test/setup.ts
**Status:** Missing
**Priority:** CRITICAL

See "Critical Issues #4" above for complete template.

### 3. app/src/test/test-utils.tsx
**Status:** Missing
**Priority:** CRITICAL

See "Critical Issues #5" above for complete template.

### 4. app/src/test/vitest.d.ts
**Status:** Missing
**Priority:** CRITICAL

See "Critical Issues #6" above for complete template.

### 5. MSW Integration Files (Optional but Recommended)
**Status:** Missing
**Priority:** HIGH

```typescript
// app/src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Add your API handlers here
  // Example:
  // http.get('/api/listings', () => {
  //   return HttpResponse.json({ listings: [] })
  // }),
]
```

```typescript
// app/src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

---

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

---

## Installation Commands

```bash
# From project root
cd app

# Install all required dependencies
bun add -D vitest @vitest/coverage-v8 jsdom
bun add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
bun add -D msw

# Create test directory structure
mkdir -p src/test
mkdir -p src/mocks
```

---

## Updated package.json Scripts

```json
{
  "scripts": {
    "dev": "bun run lint && vite --port 3000",
    "dev:test": "bun run lint && vite --port 8010 --strictPort",
    "test": "vitest --watch",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "generate-routes": "node scripts/generate-redirects.js",
    "prebuild": "bun run generate-routes",
    "build": "bun run lint && bun run typecheck && vite build",
    "build:dev": "bun run lint && bun run typecheck && vite build --mode development",
    "preview": "vite preview --port 3000",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "lint:check": "eslint src/ --max-warnings 0",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Summary

This codebase has **minimal test infrastructure**. Only one test file exists for pure JavaScript business logic functions. There is **no setup** for testing React components with React Testing Library.

**To enable proper component testing:**

1. Install Vitest and RTL dependencies
2. Create `vitest.config.ts` with jsdom environment
3. Create `src/test/setup.ts` for RTL and browser API mocks
4. Create `src/test/test-utils.tsx` for custom render with providers
5. Create `src/test/vitest.d.ts` for TypeScript types
6. Fix the `test` script in `package.json`
7. Optionally add MSW for API mocking

**Current state:** Tests cannot run properly because Vitest is not installed and there is no configuration.

**After implementing fixes:** The project will have a complete Vitest + RTL setup enabling comprehensive component and integration testing.
