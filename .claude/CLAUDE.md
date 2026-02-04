# CLAUDE.md

Hey, this is your working guide for the Split Lease codebase. I've structured this to help you hit the ground running without drowning in context you don't need yet.

# Split Lease

React 18 + Vite Islands Architecture | Supabase Edge Functions | Cloudflare Pages

A flexible rental marketplace for NYC properties enabling split scheduling, repeat stays, and proposal-based booking.

---

## Environment

> **FYI**: This project runs on **Windows 11** through **PowerShell**. Some commands may be executed via bash from within PowerShell, but the underlying system is always Windows. Path separators, environment variables, and command syntax should account for this Windows environment.

---

## MCP Servers

One Supabase MCP server is configured, connecting to two separate Supabase projects:

| Project | Project ID | Purpose | When to Use |
|---------|-----------|---------|-------------|
| **splitlease-backend-dev** | (dev project ID) | Development database | **DEFAULT** - Use for all local development, branches, previews, and testing |
| **splitlease-backend-live** | (live project ID) | Production database | **RARE** - Only for split.lease production deployment, when explicitly requested |

### MCP Usage Rules (MANDATORY)

1. **Default to dev project**: Unless explicitly told otherwise, always target `splitlease-backend-dev`
2. **Rare live access**: Only target `splitlease-backend-live` when:
   - User explicitly requests production database operations
   - Deploying verified changes to live site (split.lease)
   - Debugging production-specific issues (with extreme caution)
3. **ALL MCP invocations MUST use `mcp-tool-specialist` subagent**: Never invoke MCP tools directly

### Example Usage

```javascript
// ✅ CORRECT - Default to dev project, through mcp-tool-specialist
Task tool → mcp-tool-specialist → mcp__supabase__ (targets splitlease-backend-dev by default)

// ✅ CORRECT - Explicit production request
User: "Check production database tables on split.lease"
Task tool → mcp-tool-specialist → mcp__supabase__ (switch to splitlease-backend-live)

// ❌ WRONG - Direct MCP invocation (bypassing subagent)
mcp__supabase__list_tables({ project_id: "..." })
```

---

## Hooks

**IMPORTANT: All hooks must be configured at project scope only** (`.claude/settings.json` in the project directory).

### Hook Configuration Rules

1. **Project-scoped only**: All hooks are defined in `.claude/settings.json` within the project directory
2. **No global hooks**: Global hooks in `~/.claude/hooks/` are disabled to prevent conflicts
3. **Current hooks**:
   - **Stop hook**: `.claude/hooks/slack_notifier.py` - Sends completion notifications to Slack via TINYTASKAGENT webhook

### Stop Hook Format

The Stop hook sends notifications in the format:
```
Splitlease 8 says: [summary of what was accomplished]
```

- Extracts actual assistant response text from transcript (up to 600 characters)
- Returns `None` if no meaningful summary found (no generic fallback messages)
- Sends to TINYTASKAGENT webhook configured in `.env`

### Adding New Hooks

When adding new hooks:
1. Create the hook script in `.claude/hooks/` (project directory)
2. Configure in `.claude/settings.json` under `hooks` section
3. Test that it doesn't conflict with existing hooks
4. Never add hooks to global `~/.claude/` directory

---

## Commands

```bash
# Development (from project root)
bun run dev              # Start dev server at http://localhost:8000
bun run build            # Production build (runs generate-routes first)
bun run preview          # Preview production build locally
bun run generate-routes  # Regenerate _redirects and _routes.json
bun run test             # Run test suite

# From app/ directory (alternative)
cd app && bun run dev    # Same as above

# Supabase Edge Functions
supabase functions serve           # Serve ALL functions locally (with hot reload)
supabase functions serve <name>    # Serve single function
supabase functions deploy          # Deploy all functions (production)
supabase functions deploy <name>   # Deploy single function
supabase functions logs <name>     # View function logs

# Supabase Local Development
supabase start           # Start local Supabase (Postgres, Auth, etc.)
supabase stop            # Stop local Supabase
supabase db reset        # Reset local database to migrations
supabase migration new <name>  # Create new migration

# Cloudflare Deployment
/deploy                  # Claude slash command for deployment
npx wrangler pages deploy dist --project-name splitlease  # Manual deploy

# Linting
# Frontend (from app/ directory)
bun run lint              # Check for issues
bun run lint:fix          # Auto-fix where possible
bun run lint:check        # CI mode (fails on warnings)

# Edge Functions (from project root, requires Deno)
deno lint supabase/functions/        # Check TypeScript functions
deno fmt --check supabase/functions/ # Check formatting
```

---

## Architecture

### Tech Stack Overview

```
FRONTEND (app/)
React 18 + Vite | Islands Architecture | Cloudflare Pages
├─ public/*.html → src/*.jsx (entry points) → islands/pages/
├─ src/logic/ (four-layer business logic)
│  ├─ calculators/  (pure functions)
│  ├─ rules/        (boolean predicates)
│  ├─ processors/   (data transforms)
│  └─ workflows/    (orchestration)

BACKEND (supabase/functions/)
Supabase Edge Functions (Deno/TypeScript)
├─ auth-user/     (Supabase Auth)
├─ proposal/      (CRUD + Bubble sync queue)
├─ listing/       (CRUD + Bubble sync)
├─ ai-gateway/    (OpenAI proxy)
├─ messages/      (real-time messaging)
└─ _shared/       (CORS, errors, validation, Slack)

DATA LAYER
Supabase PostgreSQL ←→ Bubble.io (legacy, migrating away)
```

### Core Patterns

| Pattern | Description |
|---------|-------------|
| **Islands Architecture** | Each page is an independent React root, not a SPA. Full page loads between pages. |
| **Hollow Components** | Page components contain NO logic, delegate everything to `useXxxPageLogic` hooks |
| **Four-Layer Logic** | Business logic separated into `calculators` → `rules` → `processors` → `workflows` |
| **Route Registry** | Single source of truth in `app/src/routes.config.js` - generates Vite inputs, Cloudflare _redirects |
| **Action-Based Edge Functions** | All Edge Functions use `{ action, payload }` request pattern |
| **Queue-Based Sync** | Supabase→Bubble sync via `sync_queue` table, processed by cron job |

### Day Indexing

All day indices use JavaScript's 0-based standard (matching `Date.getDay()`):

| Day | Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|-----|-----|-----|-----|-----|-----|-----|-----|
| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 |

The database stores days natively in this format. No conversion needed.

---

## Key Files

| Component | Path |
|-----------|------|
| Route Registry | `app/src/routes.config.js` |
| Config | `app/vite.config.js` • `app/eslint.config.js` • `supabase/functions/deno.json` |
| Auth & Client | `app/src/lib/auth.js` • `app/src/lib/supabase.js` |
| Business Logic | `app/src/logic/` |
| Edge Functions | `supabase/functions/` |
| Components | `app/src/islands/` |

---

## Engagement Philosophy

You're not here to be a yes-machine. Here's what I expect:

### Push Back When It Matters

- **Trust your instincts**: If a request feels off—architecturally unsound, likely to cause regressions, or fighting against established patterns—say so. Back it up with what you've observed in the codebase or past outcomes.
- **Surface conflicts early**: If a request contradicts previous instructions, existing code patterns, or documented decisions, call it out before proceeding. "You asked for X, but Y is already in place—which should win?" is a perfectly valid question.
- **Ask clarifying questions**: When a request is ambiguous, has multiple valid interpretations, or depends on context I haven't given you—ask. Don't guess and apologize later.

### When to Proceed Without Asking

Not everything needs a conversation. Proceed confidently when:
- The request aligns clearly with documented patterns
- There's only one reasonable interpretation
- The change is low-risk and easily reversible

The goal is calibrated judgment, not permission-seeking paralysis.

---

## Rules

### DO
- Use Edge Functions for all API calls (never call external APIs from frontend)
- Run `bun run generate-routes` after any route changes in `routes.config.js`
- Commit after each meaningful change (do not push unless asked) and always use the `/git-commits` skill to structure the commit message
- **Run `bun run build` after complex changes** - Verify the build passes after multi-file changes, component updates, or any changes touching imports/exports. Fix any build errors before proceeding.
- **Provide a changelog of modified files** - After any file updates or creations, include a bulleted list of all files that were changed (e.g., "**Files Changed:** • `app/src/lib/auth.js` • `app/src/islands/pages/LoginPage.jsx`")
- Use 0-indexed days (0=Sunday through 6=Saturday) everywhere
- Use the four-layer logic architecture for business logic
- Use `mcp-tool-specialist` subagent for all MCP tool invocations
- **Send only changed fields when updating database records** (prevents FK constraint violations)
- **Log full error details** on database errors: `code`, `message`, `details`, `hint`
- Test edit flows with listings that have null FK values (legacy data)
- **Informational text triggers**: When adding a `?` icon to open informational text modals, make the accompanying text label clickable too (not just the `?`). Wrap both the text and `?` in a single clickable container.
- **Never recommend cache clearing unless stale code execution is proven**

### DON'T
- Invoke `/slack-webhook` after every task — session-end notifications are handled by the stop hook
- Use `git rebase` — always merge instead
- Expose API keys in frontend code
- Use `git push --force` or push to main without review
- Modify database tables without explicit instruction
- Add fallback mechanisms when things fail - surface the real error
- Over-engineer for hypothetical future needs
- Manually edit `_redirects` or `_routes.json` (auto-generated)
- **Send entire formData to updateListing** - always filter to changed fields only
- **Use project-specific abbreviations** - Always use full, descriptive names for directories, files, variables, and functions. For example, use `functional/` not `fp/`, use `configuration/` not `cfg/`, use `utilities/` not `util/`, use `manager` not `mgr`. Industry-standard terms (API, URL, JSON, HTTP, HTML, CSS, DOM, SQL) are acceptable.

### Database Update Pattern (CRITICAL)

The `listing` table has 12 FK constraints. Sending unchanged FK fields (even null) triggers validation:

```javascript
// ❌ BAD - Causes 409 errors when FK fields have null/invalid values
await updateListing(id, formData);

// ✅ GOOD - Only sends fields that changed
const changedFields = {};
for (const [key, value] of Object.entries(formData)) {
  if (value !== originalData[key]) {
    changedFields[key] = value;
  }
}
await updateListing(id, changedFields);
```

**PostgREST Error Codes**: 409 + code `23503` = FK violation, `23505` = unique violation

See: `.claude/plans/Documents/20251217091827-edit-listing-409-regression-report.md`

---

## Plans Directory

```
.claude/plans/
├── New/        # Active plans awaiting execution
├── Done/       # Completed plans (moved after implementation)
└── Documents/  # Analysis documents (prefix: YYYYMMDDHHMMSS)
```

> **⚠️ CONTEXT LOADING RULE**: Do NOT automatically scan, glob, or load files from `.claude/plans/` at the start of a conversation. This folder contains many historical files that may be outdated and will overload initial context. Only access specific plan files when:
> - The user explicitly references a plan by name/path
> - You need to write a NEW plan to `.claude/plans/New/`
> - The user asks you to execute a specific plan
> - The user explicitly asks to review the plans folder

### Deprecated File Convention

> **⚠️ FILE DEPRECATION RULE**: Any markdown file whose filename **starts with** `ZEP` or `ZEPPED` (case-insensitive) is marked as **deprecated, outdated, or incorrect**. The contents of such files MUST be completely ignored and treated as obsolete.
>
> Examples:
> - `ZEP-old-architecture.md` → IGNORE
> - `ZEPPED-20241215-feature-plan.md` → IGNORE
> - `ZEP_legacy_docs.md` → IGNORE
>
> This naming convention provides a clear signal that historical context has been superseded by newer information.

---

## Task Orchestration Workflow (MANDATORY)

> **⚠️ ENFORCEMENT RULE**: For ANY non-trivial task, you MUST invoke the appropriate subagent using the Task tool. Direct implementation without subagent orchestration is PROHIBITED. This is not optional guidance—it is a hard requirement.

For ANY non-trivial task, follow this orchestration pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TASK ORCHESTRATION PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1: CLASSIFY → task-classifier (opus)                                │
│     Input: Raw user request                                                 │
│     Output: BUILD | DEBUG | CLEANUP | DESIGN classification + reformatted   │
│                                                                             │
│  Phase 2: PLAN → Based on classification:                                   │
│     ├─ BUILD   → implementation-planner (opus)                              │
│     ├─ DEBUG   → debug-analyst (opus)                                       │
│     ├─ CLEANUP → cleanup-planner (opus)                                     │
│     └─ DESIGN  → design-planner (opus)                                      │
│     Input: Classified task + miniCLAUDE.md (or largeCLAUDE.md for complex)  │
│     Output: Plan file in .claude/plans/New/                                 │
│                                                                             │
│  Phase 3: EXECUTE → plan-executor (opus)                                    │
│     Input: Plan path + referenced files from plan                           │
│     Output: Implemented changes + changelog                                 │
│                                                                             │
│  Phase 4: REVIEW → input-reviewer (opus)                                    │
│     Input: Changelog + plan file + original query                           │
│     Output: Verdict (PASS | NEEDS ATTENTION | FAIL)                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **⚠️ LOCKED PIPELINE RULE**: Once `task-classifier` is invoked, ALL 4 phases MUST execute in sequence. 

### Phase Transition Rules (STRICT)

> **⛔ PHASE 1 → PHASE 2 CONSTRAINT**: Once `task-classifier` returns a classification, you MUST invoke **ONLY** the designated planner for that classification. 

| Classification Result | ONLY Permitted Next Subagent |
|----------------------|------------------------------|
| `BUILD` | `implementation-planner` — nothing else |
| `DEBUG` | `debug-analyst` — nothing else |
| `CLEANUP` | `cleanup-planner` — nothing else |
| `DESIGN` | `design-planner` — nothing else |

**Prohibited actions after receiving classification:**
- ❌ Invoking any other subagent for any reason
- ❌ Performing direct tool calls (Grep, Glob, Read) instead of proceeding to the planner

**The classification output IS the input for the planner.** Proceed immediately to Phase 2 with the designated planner.

### Context Selection Guide

| Task Complexity | Context File to Use |
|-----------------|---------------------|
| Single file change, simple feature | [miniCLAUDE.md](./Documentation/miniCLAUDE.md) |
| Multi-file changes, complex features | [largeCLAUDE.md](./Documentation/largeCLAUDE.md) |
| Database/Edge Function changes | largeCLAUDE.md + relevant docs |

### Agent Reference

| Agent | Purpose | Model | Location |
|-------|---------|-------|----------|
| `task-classifier` | Classify as BUILD/DEBUG/CLEANUP/DESIGN | opus | [agents/task-classifier.md](./agents/task-classifier.md) |
| `implementation-planner` | Plan new features/changes | opus | [agents/implementation-planner.md](./agents/implementation-planner.md) |
| `debug-analyst` | Investigate bugs/issues | opus | [agents/debug-analyst.md](./agents/debug-analyst.md) |
| `cleanup-planner` | Plan refactoring/cleanup | opus | [agents/cleanup-planner.md](./agents/cleanup-planner.md) |
| `design-planner` | Plan UI/UX implementations | opus | [agents/design-planner.md](./agents/design-planner.md) |
| `plan-executor` | Execute plans from .claude/plans/ | opus | [agents/plan-executor.md](./agents/plan-executor.md) |
| `input-reviewer` | Review/judge implementations | opus | [agents/input-reviewer.md](./agents/input-reviewer.md) |
| `context-lookup` | Read-only codebase analysis | opus | [agents/context-lookup.md](./agents/context-lookup.md) |

### Simple Questions

For simple questions (not requiring code changes), answer directly without the orchestration pipeline.

### Lookup Tasks (BYPASS ORCHESTRATION)

For **lookup, exploration, or research tasks** that do NOT modify code, **skip the orchestration pipeline entirely** and invoke the appropriate subagent directly:

| Task Type | Direct Subagent | Examples |
|-----------|-----------------|----------|
| Codebase lookup/analysis | `context-lookup` | "Where is X implemented?", "How does Y work?", "What depends on Z?" |
| Codebase exploration | `codebase-explorer` or `Explore` | "Give me an overview of directory X", "What's the project structure?" |
| Documentation lookup | `claude-code-guide` | "How do I use Claude Code feature X?", "What MCP tools are available?" |

**No classification, planning, or review needed** — just invoke the lookup subagent and return the result.

> **Preferred agent for most lookups**: Use `context-lookup` (sonet model) for fast, read-only information retrieval. It is optimized for answering questions about existing code without modification.

### Mandatory Subagent Invocation Rules (For Code-Modifying Tasks)

**You MUST use the Task tool to invoke the appropriate subagent for the following task types:**

| Task Type | Required Subagent Chain (ALL 4 PHASES) | When to Use |
|-----------|----------------------------------------|-------------|
| New feature, enhancement, code change | `task-classifier` → `implementation-planner` → `plan-executor` → `input-reviewer` | Any BUILD task |
| Bug investigation, error analysis | `task-classifier` → `debug-analyst` → `plan-executor` → `input-reviewer` | Any DEBUG task |
| Refactoring, cleanup, consolidation | `task-classifier` → `cleanup-planner` → `plan-executor` → `input-reviewer` | Any CLEANUP task |
| UI/UX implementation from visual references | `task-classifier` → `design-planner` → `plan-executor` → `input-reviewer` | Any DESIGN task |

### Subagents Outside the Pipeline


| Subagent | When to Use |
|----------|-------------|
| `mcp-tool-specialist` | Any MCP operation (Supabase, Playwright, etc.) |
| `context-lookup` | Read-only codebase analysis |
| `codebase-explorer` / `Explore` | Codebase exploration |

These aren't suggestions—they're the workflow. If you're unsure whether a task is "trivial" or "non-trivial," lean toward the orchestration pipeline. It's better to over-structure than to miss dependencies.

---

## Parallel Subagent Execution (Complex Tasks)

> **⚡ THROUGHPUT OPTIMIZATION**: For complex tasks, invoke **2-8 subagents** to segregate parallelizable subtasks that would otherwise execute sequentially. This maximizes throughput by running independent work concurrently.

### When to Parallelize

Use parallel subagent execution when:
- The task can be decomposed into **2-8 independent subtasks** (minimum 2, maximum 8)
- Subtasks do NOT have sequential dependencies on each other
- Each subtask modifies different files or components
- The overall task would take significantly longer if executed sequentially

> **⚠️ MANDATORY PARALLELIZATION**: When a task has 2+ independent subtasks, you MUST spawn parallel subagents rather than executing them one-by-one. Sequential execution of parallelizable work is inefficient and prohibited.

### Execution Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PARALLEL SUBAGENT EXECUTION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1: DECOMPOSE                                                          │
│     Analyze the task and split into 2-8 independent subtasks                │
│     Each subtask should be self-contained and not depend on others          │
│                                                                             │
│  Step 2: DISPATCH (PARALLEL)                                                │
│     Spawn multiple Task tool calls in a SINGLE message                      │
│     Each subagent works on its assigned subtask concurrently                │
│                                                                             │
│  Step 3: COLLECT                                                            │
│     Wait for all subagents to complete                                      │
│     Gather changelogs and results from each                                 │
│                                                                             │
│  Step 4: REVIEW                                                             │
│     Invoke `input-reviewer` subagent to verify:                             │
│     - All subtasks completed successfully                                   │
│     - Changes align with original request                                   │
│     - No conflicts or integration issues between subtasks                   │
│     Output: PASS | NEEDS ATTENTION | FAIL                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Rules for Parallel Execution

1. **Independence is mandatory**: Only parallelize subtasks that don't depend on each other's output
2. **Single message dispatch**: All parallel subagents MUST be spawned in ONE message with multiple Task tool calls
3. **Clear scope per agent**: Each subagent gets a specific, well-defined subtask with explicit file boundaries
4. **Always review**: After all parallel agents complete, ALWAYS invoke `input-reviewer` to validate the combined result
5. **Conflict detection**: If subtasks might touch overlapping files, run them sequentially instead

### Example Decomposition

```
User Request: "Add validation to all form components and update their tests"

Decomposition (4 parallel subtasks):
├─ Subagent 1: LoginForm validation + tests
├─ Subagent 2: SearchForm validation + tests
├─ Subagent 3: BookingForm validation + tests
└─ Subagent 4: ProfileForm validation + tests

Final: input-reviewer verifies all forms updated correctly
```

### Anti-Patterns (DON'T)

- ❌ Spawning agents that will modify the same file
- ❌ Creating dependencies between parallel subtasks
- ❌ Skipping the review step after parallel execution
- ❌ Spawning more than 8 subagents (diminishing returns, context overhead)
- ❌ Using parallel execution for sequential workflows

---

**VERSION**: 11.8 | **UPDATED**: 2026-01-30
