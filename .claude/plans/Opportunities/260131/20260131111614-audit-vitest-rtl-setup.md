# Vitest + RTL Setup Opportunity Report
**Generated:** 2026-01-31 11:16:14
**Codebase:** split-lease
**Hostname:** lgateway7

## Executive Summary
- **Setup completeness:** 0%
- **Critical issues:** 9
- **Warnings:** 1

The project has **no Vitest or React Testing Library configuration**. While a single test file exists (`calculateMatchScore.test.js`), the testing infrastructure is completely missing. The project cannot run any unit tests in its current state.

---

## Configuration Checklist

### Dependencies
| Package | Required | Installed | Version | Status |
|---------|----------|-----------|---------|--------|
| vitest | Yes | **No** | N/A | ❌ Missing |
| @testing-library/react | Yes | **No** | N/A | ❌ Missing |
| @testing-library/jest-dom | Yes | **No** | N/A | ❌ Missing |
| @testing-library/user-event | Yes | **No** | N/A | ❌ Missing |
| jsdom | Yes | **No** | N/A | ❌ Missing |
| @vitest/coverage-v8 | Recommended | **No** | N/A | ⚠️ Missing |
| msw | Recommended | **No** | N/A | ⚠️ Missing |

### vitest.config.ts
| Setting | Expected | Current | Status |
|---------|----------|---------|--------|
| File exists | Yes | **No** | ❌ Missing |
| environment | 'jsdom' | N/A | ❌ Missing |
| globals | true | N/A | ❌ Missing |
| setupFiles | ['./src/test/setup.ts'] | N/A | ❌ Missing |
| include | ['src/**/*.{test,spec}.{ts,tsx}'] | N/A | ❌ Missing |
| coverage.provider | 'v8' | N/A | ❌ Missing |

**Note:** `vite.config.js` exists but contains **no test configuration**.

### Setup File (src/test/setup.ts)
| Configuration | Present | Status |
|---------------|---------|--------|
| File exists | **No** | ❌ Missing |
| @testing-library/jest-dom import | **No** | ❌ Missing |
| cleanup() in afterEach | **No** | ❌ Missing |
| matchMedia mock | **No** | ❌ Missing |
| IntersectionObserver mock | **No** | ❌ Missing |
| ResizeObserver mock | **No** | ❌ Missing |
| scrollTo mock | **No** | ❌ Missing |
| MSW server setup | **No** | ❌ Missing |

### Custom Render (src/test/test-utils.tsx)
| Feature | Present | Status |
|---------|---------|--------|
| File exists | **No** | ❌ Missing |
| QueryClientProvider wrapper | **No** | ❌ Missing |
| BrowserRouter wrapper | **No** | ❌ Missing |
| AuthProvider wrapper | **No** | ❌ Missing |
| Custom render export | **No** | ❌ Missing |
| Re-exports from RTL | **No** | ❌ Missing |
| userEvent export | **No** | ❌ Missing |

### TypeScript Configuration
| Setting | Expected | Current | Status |
|---------|----------|---------|--------|
| vitest.d.ts exists | Yes | **No** | ❌ Missing |
| vitest/globals in types | Yes | **No** | ❌ Missing |
| @testing-library/jest-dom in types | Yes | **No** | ❌ Missing |

**Note:** `tsconfig.json` exists but has no Vitest type references.

### NPM Scripts
| Script | Expected | Current | Status |
|--------|----------|---------|--------|
| test | vitest | `bun run test:stop && bun run lint && bun run knip:report && vite --port 8001 --strictPort` | ❌ Wrong |
| test:run | vitest run | **Missing** | ❌ Missing |
| test:coverage | vitest run --coverage | **Missing** | ❌ Missing |
| test:watch | vitest --watch | **Missing** | ❌ Missing |

**Current `test` script is misconfigured:** It runs Vite dev server on port 8001 for manual testing, not unit tests.

### MSW Integration
| Configuration | Present | Status |
|---------------|---------|--------|
| src/mocks/handlers.ts | **No** | ❌ Missing |
| src/mocks/server.ts | **No** | ❌ Missing |
| beforeAll server.listen() | **No** | ❌ Missing |
| afterEach server.resetHandlers() | **No** | ❌ Missing |
| afterAll server.close() | **No** | ❌ Missing |

---

## Critical Issues

### 1. Vitest Not Installed
- **Impact:** Cannot run any unit tests. The existing `calculateMatchScore.test.js` file imports from vitest but will fail.
- **Fix:**
  ```bash
  bun add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8 msw
  ```

### 2. No vitest.config.ts
- **File:** `app/vitest.config.ts` (missing)
- **Problem:** Vite doesn't know how to run tests. No test environment, globals, or setup files configured.
- **Impact:** Cannot configure test behavior, coverage, or test file patterns.
- **Fix:** Create `app/vitest.config.ts` (see template below).

### 3. No Test Setup File
- **File:** `app/src/test/setup.ts` (missing)
- **Problem:** No global test configuration, no DOM cleanup, no browser API mocks.
- **Impact:** Tests will affect each other, responsive components will fail, browser APIs will throw errors.
- **Fix:** Create `app/src/test/setup.ts` (see template below).

### 4. No Custom Render Test Utils
- **File:** `app/src/test/test-utils.tsx` (missing)
- **Problem:** No provider wrappers for Supabase, React Query, Router, Auth context.
- **Impact:** Every test would need to manually wrap components with 5+ providers.
- **Fix:** Create `app/src/test/test-utils.tsx` (see template below).

### 5. No TypeScript Type Declarations
- **File:** `app/src/test/vitest.d.ts` (missing)
- **Problem:** TypeScript doesn't recognize vitest globals (describe, it, expect, vi).
- **Impact:** Type errors in all test files. IDE won't provide autocomplete.
- **Fix:** Create `app/src/test/vitest.d.ts` (see template below).

### 6. Test Scripts Misconfigured
- **File:** `app/package.json`
- **Problem:** `test` script runs Vite dev server, not unit tests
- **Impact:** Running `bun test` doesn't execute tests - it opens a browser
- **Fix:**
  ```json
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
  ```

### 7. No MSW Integration
- **Files:** `app/src/mocks/handlers.ts`, `app/src/mocks/server.ts` (missing)
- **Problem:** Cannot mock Supabase API calls or Edge Functions in tests.
- **Impact:** Tests will make real API calls, causing failures and external dependencies.
- **Fix:** Create MSW setup with Supabase handlers.

### 8. TypeScript Config Missing Vitest Types
- **File:** `app/tsconfig.json`
- **Problem:** No vitest/globals in types array
- **Impact:** TypeScript doesn't recognize describe/it/expect globals
- **Fix:** Add `"types": ["vitest/globals", "@testing-library/jest-dom"]` to compilerOptions

### 9. Orphan Test File
- **File:** `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`
- **Problem:** This file imports from vitest but vitest isn't installed
- **Impact:** This is a "dead test" - exists but cannot run
- **Note:** The test is well-written and comprehensive. Once vitest is installed, it should work immediately.

---

## Warnings

### 1. Node Modules Not Installed
- **File:** `app/node_modules/` (missing)
- **Recommendation:** Run `bun install` to install all dependencies including vitest when added

---

## Missing Files

### 1. app/vitest.config.ts
**Status:** Missing
**Template:**
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
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
      thresholds: {
        global: { statements: 80, branches: 80, functions: 80, lines: 80 }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/logic': path.resolve(__dirname, './src/logic')
    }
  }
})
```

### 2. app/src/test/setup.ts
**Status:** Missing
**Template:**
```typescript
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
    dispatchEvent: vi.fn()
  }))
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

// Mock scrollTo
window.scrollTo = vi.fn()

// Mock window.getComputedStyle for styled-components
window.getComputedStyle = vi.fn(() => ({
  getPropertyValue: () => ''
})) as any
```

### 3. app/src/test/test-utils.tsx
**Status:** Missing
**Template:**
```typescript
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SupabaseContext } from '@/lib/supabase'

// Create test-specific QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0
    }
  }
})

// Mock Supabase client for tests
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn()
  },
  from: vi.fn(),
  rpc: vi.fn()
}

// All providers wrapper
function AllTheProviders({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SupabaseContext.Provider value={mockSupabase}>
          {children}
        </SupabaseContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

// Custom render function with providers
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything from RTL
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Export custom render as default
export { customRender as render }
```

### 4. app/src/test/vitest.d.ts
**Status:** Missing
**Template:**
```typescript
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import { ReactElement } from 'react'
import { RenderOptions } from '@testing-library/react'

declare module '@testing-library/react' {
  export interface RenderResult extends CustomRenderResult {}
}

interface CustomRenderResult {
  rerender: (ui: ReactElement) => void
}
```

### 5. app/src/mocks/server.ts
**Status:** Missing
**Template:**
```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### 6. app/src/mocks/handlers.ts
**Status:** Missing
**Template:**
```typescript
import { http, HttpResponse } from 'msw'

// Mock Supabase edge function calls
export const handlers = [
  // Example: Mock listing endpoint
  http.get('https://*.supabase.co/rest/v1/listings', () => {
    return HttpResponse.json({ data: [], error: null })
  }),

  // Example: Mock auth endpoint
  http.post('https://*.supabase.co/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      user: { id: 'mock-user-id' }
    })
  })
]
```

---

## Installation Commands

```bash
# Navigate to app directory
cd app

# Install all required dependencies
bun add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8 msw

# Install Supabase mocking dependencies (if needed)
bun add -D @supabase/ssr
```

---

## Recommended tsconfig.json Updates

Add to `app/tsconfig.json` compilerOptions:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

---

## Next Steps

1. **Install dependencies:** Run the installation commands above
2. **Create configuration files:** Copy the templates for vitest.config.ts, setup files, and test utils
3. **Update package.json scripts:** Replace current test script with vitest commands
4. **Run existing test:** Try `bun test` on the existing calculateMatchScore.test.js
5. **Set up MSW:** Create handlers for Supabase API calls used in your app
6. **Add coverage thresholds:** Configure based on project requirements

---

## Existing Test File Analysis

**File:** `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`

This test file is **well-written** and will work immediately once vitest is installed:
- ✅ Imports from vitest correctly
- ✅ Uses describe/it/expect patterns
- ✅ Tests pure business logic functions (calculators and rules)
- ✅ Comprehensive test coverage for matching algorithm
- ⚠️ Uses .js extension but could benefit from .tsx for React component tests

**This file is a good template** for future tests in the project.
