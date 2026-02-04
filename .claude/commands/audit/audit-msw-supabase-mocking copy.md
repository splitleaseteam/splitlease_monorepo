---
name: audit-msw-supabase-mocking
description: Audit the codebase to find components and hooks that fetch from Supabase but lack MSW mocking for tests. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# MSW Supabase Mocking Audit

You are conducting a comprehensive audit to identify components and hooks that interact with Supabase REST API but do not have MSW (Mock Service Worker) mocking in their tests.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Components that fetch Supabase data** - Look for:
   - `supabase.from('table').select()`
   - `useQuery` hooks that call Supabase
   - Components importing `@supabase/supabase-js`
   - Files using `VITE_SUPABASE_URL` or similar env vars

2. **Custom hooks that wrap Supabase calls** - Look for:
   - `use*.ts` files with Supabase client usage
   - Data fetching hooks returning loading/error/data states

3. **Form components that POST/PATCH/DELETE** - Look for:
   - `supabase.from('table').insert()`
   - `supabase.from('table').update()`
   - `supabase.from('table').delete()`

4. **Auth-related components** - Look for:
   - `supabase.auth.signIn*`
   - `supabase.auth.signUp`
   - `supabase.auth.getUser()`

5. **Storage interactions** - Look for:
   - `supabase.storage.from('bucket')`
   - File upload components

### What to Check for Each Target

For each identified file, check if:
- A corresponding `.test.tsx` or `.test.ts` file exists
- The test file uses MSW (`import { http, HttpResponse } from 'msw'`)
- The test file has proper handler setup for the Supabase endpoints used
- Tests cover: success states, loading states, error states, empty states

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-msw-supabase-mocking.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# MSW Supabase Mocking Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Total files reviewed: X
- Components/hooks needing MSW mocks: X
- Priority items: X

## Critical Gaps (No Tests at All)

### 1. [Component/File Name]
- **File:** `path/to/file.tsx`
- **Supabase Operations:** GET /rest/v1/table_name
- **Why MSW Needed:** [Brief explanation]
- **Recommended Test Scenarios:**
  - [ ] Success state with data
  - [ ] Loading state
  - [ ] Error state (500)
  - [ ] Empty state (no results)

## Partial Coverage (Tests Exist but Missing MSW)

### 1. [Component/File Name]
- **File:** `path/to/file.tsx`
- **Test File:** `path/to/file.test.tsx`
- **Current Approach:** [e.g., mocking fetch directly, no mocking]
- **Missing MSW Handlers:**
  - [ ] Handler for GET endpoint
  - [ ] Handler for error scenarios

## Components with Good MSW Coverage (Reference)

List any components that already have proper MSW setup as examples for the team.

## Recommended MSW Handler Templates

Based on the audit, here are the specific handlers needed:

### Handler: [table_name] CRUD
```typescript
// Template based on actual endpoints found
http.get(`${SUPABASE_URL}/rest/v1/[table_name]`, ({ request }) => {
  // Handler implementation
})
```

```

---

## Reference: MSW Mocking Patterns

Use these patterns as reference when identifying what's missing in the codebase:

### When to Recommend MSW Mocking

- Testing React components that fetch Supabase data
- Testing error handling and loading states
- Running fast unit tests without database connection
- Simulating edge cases (empty results, malformed data, timeouts)
- Testing offline behavior

### Core MSW Setup Requirements

Check if the codebase has:
1. `src/mocks/handlers.ts` - Handler definitions
2. `src/mocks/server.ts` - MSW server setup
3. Test setup file with `beforeAll`, `afterEach`, `afterAll` MSW hooks
4. Vitest/Jest config pointing to setup file

### Pattern 1: Testing Component Data Fetching

Components doing this:
```typescript
const { data } = await supabase.from('listings').select('*')
```

Need tests like:
```typescript
server.use(
  http.get('*/rest/v1/listings', () => {
    return HttpResponse.json([{ id: '1', title: 'Test' }])
  })
)
```

### Pattern 2: Testing Loading States

Components with loading UI need delayed response handlers:
```typescript
server.use(
  http.get('*/rest/v1/listings', async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    return HttpResponse.json([])
  })
)
```

### Pattern 3: Testing Error States

Every data-fetching component should test:
```typescript
server.use(
  http.get('*/rest/v1/listings', () => {
    return HttpResponse.json({ message: 'Error' }, { status: 500 })
  })
)
```

### Pattern 4: Testing Empty States

```typescript
server.use(
  http.get('*/rest/v1/listings', () => {
    return HttpResponse.json([])
  })
)
```

### Pattern 5: Testing Form Submissions (POST/PATCH/DELETE)

Components with forms need:
```typescript
server.use(
  http.post('*/rest/v1/listings', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 'new', ...body }, { status: 201 })
  })
)
```

### Pattern 6: Testing Auth Endpoints

Auth-related components need:
```typescript
http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
  // Handle password grant
})
http.get(`${SUPABASE_URL}/auth/v1/user`, ({ request }) => {
  // Return user based on token
})
```

### Pattern 7: Testing Storage Operations

File upload components need:
```typescript
http.post(`${SUPABASE_URL}/storage/v1/object/:bucket/:path*`, () => {
  return HttpResponse.json({ Key: 'path/file.jpg' })
})
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Mocking fetch/axios directly | Use MSW at network level |
| No `server.resetHandlers()` | Add to `afterEach` |
| Hardcoded Supabase URLs | Use env var or wildcard `*` |
| Only testing success cases | Add error, empty, timeout tests |
| No test file exists | Create test with MSW handlers |

## Output Requirements

1. Be thorough - review EVERY file from /prime output
2. Be specific - include exact file paths and line numbers where Supabase calls occur
3. Be actionable - provide clear next steps for each gap found
4. Only report gaps - do not list files that already have proper MSW coverage unless as reference examples
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-msw-supabase-mocking.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
