# Database Naming Convention Audit & Migration Plan

## PROMPT FOR COMPREHENSIVE ANALYSIS

---

### ANALYSIS PROMPT

```
TASK: Comprehensive Database Naming Convention Audit & Migration

OBJECTIVE: Analyze the entire Split Lease codebase (frontend app + Supabase backend) to identify ALL database tables, columns, and references that violate PostgreSQL/PostgREST naming conventions, then generate a complete migration plan to fix them.

---

## PHASE 1: DISCOVERY & INVENTORY

### 1.1 Supabase Schema Analysis
Analyze ALL tables in the Supabase database and identify:

1. **Tables with problematic names:**
   - Names starting with hyphens (e.g., `-something`)
   - Names with spaces (e.g., `Host User`)
   - Names with special characters
   - Names using reserved SQL keywords
   - CamelCase names (should be snake_case)
   - Names with leading/trailing underscores (except system tables)

2. **Columns with problematic names:**
   - Columns starting with hyphens (e.g., `-Host User`, `-Guest User`)
   - Columns with spaces
   - Columns with special characters that break PostgREST .or() filters
   - CamelCase column names
   - Inconsistent naming patterns within same table

3. **Foreign key references:**
   - FK columns pointing to problematic table/column names
   - Constraint names that will need updating

4. **Views, Functions, Triggers:**
   - Any database objects referencing problematic names
   - RLS policies using problematic column names

### 1.2 Frontend Code Analysis
Search the entire `app/` directory for:

1. **Supabase queries referencing problematic names:**
   - `.from('table-name')` calls
   - `.select('column-name')` calls
   - `.eq('column-name', value)` calls
   - `.or()` filter expressions (especially vulnerable)
   - `.order()`, `.filter()`, `.match()` calls

2. **String literals matching problematic patterns:**
   - Grep for `-Host`, `-Guest`, `-User` patterns
   - Search for any quoted strings with hyphens/spaces that look like DB columns

3. **Type definitions or interfaces:**
   - TypeScript/JSDoc types referencing column names
   - Zod schemas or validation rules

### 1.3 Edge Functions Analysis
Search `supabase/functions/` for:

1. **All database queries** in TypeScript files
2. **Column name references** in request/response handling
3. **SQL queries** (raw or parameterized)

---

## PHASE 2: NAMING CONVENTION RULES

Apply these PostgreSQL/PostgREST-safe naming conventions:

### Tables
- Use `snake_case` (lowercase with underscores)
- Use plural nouns for collections: `users`, `threads`, `listings`
- Use singular for join tables: `user_role` (not `users_roles`)
- Prefix related tables: `auth_sessions`, `auth_tokens`

### Columns
- Use `snake_case` (lowercase with underscores)
- NO leading hyphens or special characters
- NO spaces
- Prefix foreign keys with referenced table singular: `user_id`, `listing_id`
- Use `_at` suffix for timestamps: `created_at`, `updated_at`
- Use `is_` prefix for booleans: `is_active`, `is_verified`

### Specific Fixes Required (Known Issues)
| Current Name | Proposed Name | Reason |
|--------------|---------------|--------|
| `-Host User` | `host_user_id` | Leading hyphen breaks PostgREST |
| `-Guest User` | `guest_user_id` | Leading hyphen breaks PostgREST |
| [discover more...] | [snake_case] | [document reason] |

---

## PHASE 3: MIGRATION STRATEGY

### 3.1 Generate Migration Files

For each problematic name, generate:

1. **Column rename migration:**
```sql
-- Migration: rename_problematic_columns_YYYYMMDD.sql
ALTER TABLE "thread" RENAME COLUMN "-Host User" TO "host_user_id";
ALTER TABLE "thread" RENAME COLUMN "-Guest User" TO "guest_user_id";
-- Add all other renames...
```

2. **Update RLS policies:**
```sql
-- Drop and recreate any RLS policies referencing old names
DROP POLICY IF EXISTS "policy_name" ON "table_name";
CREATE POLICY "policy_name" ON "table_name"
  USING (new_column_name = auth.uid());
```

3. **Update views:**
```sql
-- Recreate views with new column names
CREATE OR REPLACE VIEW view_name AS
  SELECT new_column_name FROM table_name;
```

4. **Update functions:**
```sql
-- Recreate functions referencing old column names
CREATE OR REPLACE FUNCTION function_name()
RETURNS ... AS $$
  -- Updated SQL with new names
$$ LANGUAGE plpgsql;
```

### 3.2 Generate Code Updates

For each file referencing old names, generate:

1. **Search-and-replace mapping:**
```javascript
// File: path/to/file.js
// Line X: Change '-Host User' to 'host_user_id'
// Line Y: Change '-Guest User' to 'guest_user_id'
```

2. **Test file updates** (if any)

---

## PHASE 4: OUTPUT REQUIREMENTS

Generate these deliverables:

### Deliverable 1: Full Inventory Report
```markdown
# Database Naming Issues Inventory

## Tables with Issues
| Table | Current Name | Issue | Proposed Name |
|-------|--------------|-------|---------------|

## Columns with Issues
| Table | Current Column | Issue | Proposed Column |
|-------|----------------|-------|-----------------|

## Code References to Fix
| File | Line | Current Reference | New Reference |
|------|------|-------------------|---------------|
```

### Deliverable 2: Migration SQL File
Single migration file with all renames, in correct order:
1. Column renames
2. Constraint updates
3. RLS policy recreations
4. View recreations
5. Function recreations

### Deliverable 3: Code Update Script
List of all files requiring updates with exact changes.

### Deliverable 4: Rollback Script
Reverse migration in case of issues.

### Deliverable 5: Testing Checklist
- [ ] All queries still work
- [ ] RLS policies enforced correctly
- [ ] Edge functions operational
- [ ] Frontend features functional

---

## EXECUTION INSTRUCTIONS

1. **Start with Supabase MCP** - Query the database schema to get complete table/column inventory
2. **Grep the codebase** - Find all references to problematic names
3. **Generate inventory** - Create the full mapping of current → proposed names
4. **Generate migration** - Create SQL migration file
5. **Generate code changes** - List all frontend/edge function updates needed
6. **Review before execution** - Present plan for approval before any changes

---

## CONSTRAINTS

- Do NOT execute any changes without explicit approval
- Do NOT modify production database (splitlease-backend-live) - dev only first
- Preserve all data during column renames
- Maintain referential integrity
- Test migration on dev before considering production
```

---

## QUICK START COMMAND

To execute this analysis, run:

```
Analyze my entire Split Lease project (app/, supabase/functions/, and the Supabase database via MCP) to find ALL tables and columns with naming convention issues. Focus especially on:

1. Columns with leading hyphens (like -Host User, -Guest User)
2. Columns or tables with spaces
3. Any names that break PostgREST query parsing

Generate a complete inventory and migration plan following the template in .claude/plans/New/20260128-database-naming-audit-and-migration.md

Start by querying the database schema, then grep the codebase for references.
```

---

## KNOWN ISSUES TO INVESTIGATE FIRST

Based on the error mentioned:
- `thread` table has `-Host User` column
- `thread` table has `-Guest User` column
- These break `.or()` PostgREST filter syntax

Likely more issues in tables migrated from Bubble.io (legacy system).
