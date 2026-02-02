---
name: audit-test-file-colocation
description: Audit the codebase to find test files in centralized folders that should be co-located with their source files. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Test File Co-location Audit

You are conducting a comprehensive audit to identify test files that are stored in centralized `__tests__` or `tests/` folders instead of being co-located next to their source files.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Patterns to Find

1. **Centralized test folders** - Look for:
   - `__tests__/` directories
   - `tests/` directories mirroring `src/`
   - `test/` directories containing unit tests
   - Separation between source and test files

2. **Orphaned test files** - Look for:
   - Test files without corresponding source files
   - Tests in wrong locations
   - Renamed components with old test files

3. **Missing test files** - Look for:
   - Source files without adjacent test files
   - Components without `.test.tsx` siblings
   - Hooks without `.test.ts` siblings
   - Utilities without tests

4. **File organization issues** - Look for:
   - Components not in folders
   - Missing barrel exports (`index.ts`)
   - Inconsistent naming patterns

### What to Check for Each Source File

For each source file, check:
- Is there a `.test.ts(x)` file in the same directory?
- If tests exist elsewhere, where are they?
- Is the source file in its own folder with barrel export?

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-test-file-colocation.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Test File Co-location Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Source files found: X
- Co-located tests: X (Y%)
- Centralized tests to migrate: X
- Missing tests: X

## Current Structure Analysis

### Test Folder Locations Found
| Location | Test Files | Type |
|----------|------------|------|
| `tests/` | X | Centralized (migrate) |
| `__tests__/` | X | Centralized (migrate) |
| `src/**/*.test.ts` | X | Co-located (good) |

### Co-location Status by Directory
| Directory | Source Files | Co-located Tests | Centralized Tests | Missing |
|-----------|--------------|------------------|-------------------|---------|
| `src/components/` | X | Y | Z | W |
| `src/hooks/` | X | Y | Z | W |
| `src/utils/` | X | Y | Z | W |

## Migration Required (Centralized → Co-located)

### From `tests/components/`
| Current Location | Move To |
|------------------|---------|
| `tests/components/Button.test.tsx` | `src/components/Button/Button.test.tsx` |
| `tests/components/Card.test.tsx` | `src/components/Card/Card.test.tsx` |

### From `__tests__/`
| Current Location | Move To |
|------------------|---------|
| `src/hooks/__tests__/useAuth.test.ts` | `src/hooks/useAuth/useAuth.test.ts` |

## Missing Test Files

### Components Without Tests
| Source File | Expected Test File | Priority |
|-------------|-------------------|----------|
| `src/components/Navbar.tsx` | `src/components/Navbar/Navbar.test.tsx` | P1 |
| `src/components/Modal.tsx` | `src/components/Modal/Modal.test.tsx` | P1 |

### Hooks Without Tests
| Source File | Expected Test File | Priority |
|-------------|-------------------|----------|
| `src/hooks/usePayment.ts` | `src/hooks/usePayment/usePayment.test.ts` | P0 |

### Utilities Without Tests
| Source File | Expected Test File | Priority |
|-------------|-------------------|----------|
| `src/utils/formatPrice.ts` | `src/utils/formatPrice/formatPrice.test.ts` | P2 |

## Folder Structure Issues

### Files Needing Folders
| Current | Recommended |
|---------|-------------|
| `src/components/Button.tsx` | `src/components/Button/Button.tsx` |
| `src/hooks/useAuth.ts` | `src/hooks/useAuth/useAuth.ts` |

### Missing Barrel Exports
| Folder | Missing `index.ts` |
|--------|-------------------|
| `src/components/Button/` | Yes |
| `src/hooks/useAuth/` | Yes |

## Orphaned Test Files

Test files without corresponding source files:
| Test File | Issue |
|-----------|-------|
| `tests/OldComponent.test.tsx` | Source deleted, test remains |
| `tests/renamed.test.ts` | Source was renamed |

## Already Co-located (Reference)

List directories that already follow co-location pattern:
- `src/components/ListingCard/` ✓
- `src/hooks/useBooking/` ✓

## Recommended Target Structure

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Card/
│   │   ├── Card.tsx
│   │   ├── Card.test.tsx
│   │   └── index.ts
├── hooks/
│   ├── useAuth/
│   │   ├── useAuth.ts
│   │   ├── useAuth.test.ts
│   │   └── index.ts
├── utils/
│   ├── formatPrice/
│   │   ├── formatPrice.ts
│   │   ├── formatPrice.test.ts
│   │   └── index.ts
├── test/                    # Shared test utilities only
│   ├── setup.ts
│   ├── test-utils.tsx
│   └── fixtures/
e2e/                         # E2E tests stay separate
└── tests/
```

## Vitest Config Update

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e/**'],
  },
})
```

## VS Code Settings

```json
{
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.tsx": "${capture}.test.tsx, ${capture}.stories.tsx",
    "*.ts": "${capture}.test.ts, ${capture}.spec.ts"
  }
}
```

## Migration Script

```bash
#!/bin/bash
# migrate-tests.sh
for test in tests/components/*.test.tsx; do
  name=$(basename "$test" .test.tsx)
  mkdir -p "src/components/$name"
  mv "src/components/$name.tsx" "src/components/$name/$name.tsx" 2>/dev/null
  mv "$test" "src/components/$name/$name.test.tsx"
  echo "export { $name } from './$name'" > "src/components/$name/index.ts"
done
```

```

---

## Reference: Test File Co-location Patterns

Use these patterns as reference when identifying what's missing in the codebase:

### Why Co-location

| Benefit | Explanation |
|---------|-------------|
| Discoverability | Tests visible when viewing source |
| Ownership | Clear 1:1 relationship |
| Refactoring | Move folder = move source + tests |
| Coverage gaps | Missing `.test.tsx` is obvious |
| AI agents | Find tests without searching |

### Pattern 1: Component with Test

```
src/components/ListingCard/
├── ListingCard.tsx
├── ListingCard.test.tsx
└── index.ts
```

### Pattern 2: Hook with Test

```
src/hooks/useBooking/
├── useBooking.ts
├── useBooking.test.ts
└── index.ts
```

### Pattern 3: Utility with Test

```
src/utils/formatPrice/
├── formatPrice.ts
├── formatPrice.test.ts
└── index.ts
```

### Pattern 4: Barrel Export

```typescript
// src/components/Button/index.ts
export { Button } from './Button'
export type { ButtonProps } from './Button'
// Tests are NOT exported
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| `__tests__/` folders | Co-locate tests |
| `tests/` mirroring `src/` | Co-locate tests |
| Component not in folder | Create folder structure |
| Missing index.ts | Add barrel export |
| Orphaned test files | Delete or move |

## Output Requirements

1. Be thorough - review EVERY source file and test file
2. Be specific - include exact file paths for migration
3. Be actionable - provide migration commands
4. Only report gaps - do not list already co-located tests unless as reference examples
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-test-file-colocation.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
