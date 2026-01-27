# Cleanup Plan: Rename `dist` → `build` Directory

**Created**: 2026-01-25 18:00:00
**Type**: CLEANUP
**Scope**: Codebase-wide rename of build output directory from `dist` to `build`
**Status**: PENDING EXECUTION

---

## Executive Summary

Rename the build output directory from `dist` (cryptic abbreviation) to `build` (self-explanatory) across the entire codebase for improved clarity. This affects **54 files** with **175 total occurrences**, categorized into 8 groups ranging from critical configuration changes to optional documentation updates.

### Motivation

- **Clarity**: "build" is immediately understandable vs "dist" (distribution)
- **Modern Convention**: Used by Create React App, Gatsby, Remix
- **Developer Onboarding**: Reduces cognitive load for new team members
- **Consistency**: Aligns with industry shift toward explicit naming

### Impact Assessment

| Category | Files | Occurrences | Priority | Risk | Effort |
|----------|-------|-------------|----------|------|--------|
| Critical Config | 6 | 19 | 🔴 HIGH | Medium | Low |
| Build Scripts | 4 | 6 | 🔴 HIGH | Low | Low |
| Documentation | 10 | 42 | 🟡 MEDIUM | None | Medium |
| Python Scripts | 3 | 4 | 🟡 MEDIUM | Low | Low |
| Plan Files | 8 | 35 | 🟢 LOW | None | Medium |
| Lock Files | 3 | 4 | ⚪ AUTO | None | Auto |
| External CDNs | 8 | 8 | ⛔ SKIP | N/A | N/A |
| Temp/Log Files | 2 | 57 | ⛔ DELETE | None | None |

**Total**: 44 actionable files (excluding auto-generated and external references)

---

## Category 1: Critical Configuration Files (🔴 MUST CHANGE)

These files **MUST** be updated for the rename to work. Build will fail without these changes.

### 1.1 Vite Build Configuration

**File**: `app/vite.config.js`
**Occurrences**: 15
**Lines**: 115, 118, 126, 135, 144, 147, 152, 155, 160, 163, 168, 196, 204, 212, 245, 278, 301

**Changes Required**:

```javascript
// Line 115
- const distDir = path.resolve(__dirname, 'dist');
+ const distDir = path.resolve(__dirname, 'build');

// Line 245
build: {
-   outDir: 'dist',
+   outDir: 'build',

// Lines 118-212: Update all comments referencing "dist"
- // Move HTML files from dist/public to dist root after build
+ // Move HTML files from build/public to build root after build

- console.log(`Moved ${file} to dist root`);
+ console.log(`Moved ${file} to build root`);

- console.log('Copied assets directory to dist/assets');
+ console.log('Copied assets directory to build/assets');

(Continue for all 15 occurrences - see detailed list below)
```

<details>
<summary>📋 Full list of vite.config.js changes</summary>

| Line | Current | New |
|------|---------|-----|
| 115 | `const distDir = path.resolve(__dirname, 'dist');` | `const distDir = path.resolve(__dirname, 'build');` |
| 118 | `// Move HTML files from dist/public to dist root after build` | `// Move HTML files from build/public to build root after build` |
| 126 | `console.log(\`Moved \${file} to dist root\`);` | `console.log(\`Moved \${file} to build root\`);` |
| 135 | `// Copy assets directory to dist/assets preserving structure` | `// Copy assets directory to build/assets preserving structure` |
| 144 | `console.log('Copied assets directory to dist/assets');` | `console.log('Copied assets directory to build/assets');` |
| 147 | `// Copy _redirects file to dist root for Cloudflare Pages` | `// Copy _redirects file to build root for Cloudflare Pages` |
| 152 | `console.log('Copied _redirects to dist root');` | `console.log('Copied _redirects to build root');` |
| 155 | `// Copy _headers file to dist root for Cloudflare Pages` | `// Copy _headers file to build root for Cloudflare Pages` |
| 160 | `console.log('Copied _headers to dist root');` | `console.log('Copied _headers to build root');` |
| 163 | `// Copy _routes.json file to dist root for Cloudflare Pages routing control` | `// Copy _routes.json file to build root for Cloudflare Pages routing control` |
| 168 | `console.log('Copied _routes.json to dist root');` | `console.log('Copied _routes.json to build root');` |
| 191 | `// Copy images directory to dist root` | `// Copy images directory to build root` |
| 196 | `console.log('Copied images directory to dist root');` | `console.log('Copied images directory to build root');` |
| 199 | `// Copy help-center-articles directory to dist root (static article HTML files)` | `// Copy help-center-articles directory to build root (static article HTML files)` |
| 204 | `console.log('Copied help-center-articles directory to dist root');` | `console.log('Copied help-center-articles directory to build root');` |
| 207 | `// Copy functions directory to dist root for Cloudflare Pages Functions` | `// Copy functions directory to build root for Cloudflare Pages Functions` |
| 212 | `console.log('Copied functions directory to dist root');` | `console.log('Copied functions directory to build root');` |
| 245 | `outDir: 'dist',` | `outDir: 'build',` |
| 278 | `// Ensure HTML files are output to dist root, not dist/public` | `// Ensure HTML files are output to build root, not build/public` |
| 301 | `// Copy HTML files to root of dist, not preserving directory structure` | `// Copy HTML files to root of build, not preserving directory structure` |

</details>

### 1.2 Git Ignore Files

**Files**:
- `.gitignore` (root) - Line 28
- `app/.gitignore` - Line 2

**Changes**:

```diff
# Root .gitignore (line 28)
- dist/
+ build/

# app/.gitignore (line 2)
- dist/
+ build/
```

### 1.3 ESLint Configuration

**File**: `app/eslint.config.js`
**Line**: 76

**Change**:

```javascript
ignores: [
  'node_modules/**',
-  'dist/**',
+  'build/**',
  'src/styles/generated/**',
],
```

### 1.4 Cloudflare Pages Configuration

**File**: `.pages.toml`
**Lines**: 6, 35

**Changes**:

```toml
# Line 6 (comment)
- # - Build output: dist
+ # - Build output: build

# Line 35
- publish = "dist"
+ publish = "build"
```

### 1.5 TypeScript Configuration (slack-api)

**File**: `slack-api/tsconfig.json`
**Lines**: 10, 15

**Changes**:

```json
{
  "compilerOptions": {
-    "outDir": "./dist",
+    "outDir": "./build",
  },
-  "exclude": ["node_modules", "dist"]
+  "exclude": ["node_modules", "build"]
}
```

### 1.6 Python Audit Scripts

**Files**:
- `app/fp_audit_tool.py` - Line 85
- `.claude/skills/functional-code/scripts/fp_audit.py` - Lines 126-127

**Changes**:

```python
# app/fp_audit_tool.py (line 85)
- if "node_modules" in root or ".git" in root or "dist" in root:
+ if "node_modules" in root or ".git" in root or "build" in root:

# .claude/skills/functional-code/scripts/fp_audit.py (lines 126-127)
- # Skip node_modules, dist, build
- if any(part in file_path.parts for part in ['node_modules', 'dist', 'build', '.next']):
+ # Skip node_modules, build
+ if any(part in file_path.parts for part in ['node_modules', 'build', '.next']):
```

---

## Category 2: Build & Deployment Scripts (🔴 MUST CHANGE)

### 2.1 Package.json Scripts

**Files**:
- `package.json` (root) - Lines 10-11
- `app/package.json` - Lines 17-18

**Changes**:

```json
// Root package.json
{
  "scripts": {
-    "deploy": "node app/scripts/check-branch.js --require-main && cd app && wrangler pages deploy dist --project-name splitlease",
+    "deploy": "node app/scripts/check-branch.js --require-main && cd app && wrangler pages deploy build --project-name splitlease",

-    "deploy:dev": "node app/scripts/check-branch.js --block-main && cd app && bun run build:dev && wrangler pages deploy dist --project-name splitlease --branch development",
+    "deploy:dev": "node app/scripts/check-branch.js --block-main && cd app && bun run build:dev && wrangler pages deploy build --project-name splitlease --branch development",
  }
}

// app/package.json (same changes)
{
  "scripts": {
-    "deploy": "node scripts/check-branch.js --require-main && wrangler pages deploy dist --project-name splitlease",
+    "deploy": "node scripts/check-branch.js --require-main && wrangler pages deploy build --project-name splitlease",

-    "deploy:dev": "node scripts/check-branch.js --block-main && bun run build:dev && wrangler pages deploy dist --project-name splitlease --branch development",
+    "deploy:dev": "node scripts/check-branch.js --block-main && bun run build:dev && wrangler pages deploy build --project-name splitlease --branch development",
  }
}
```

### 2.2 Shell Scripts

**File**: `build.sh`
**Lines**: 18, 21

**Changes**:

```bash
# Line 18
- echo "📁 Build output is in: app/dist"
+ echo "📁 Build output is in: app/build"

# Line 21
- ls -la dist/
+ ls -la build/
```

---

## Category 3: Documentation Files (🟡 SHOULD UPDATE)

### 3.1 Main Documentation

**Files**:
- `README.md` - Line 469
- `.claude/CLAUDE.md` - Line 83
- `.claude/AGENTS.md` - Line 83
- `app/CLAUDE.md` - Lines 36, 39, 68, 95, 129, 187-190, 197, 199, 208, 231, 284

**Priority**: MEDIUM (for accuracy and future developer onboarding)

**Changes**:

```markdown
# README.md (line 469)
- npx wrangler pages deploy dist --project-name splitlease
+ npx wrangler pages deploy build --project-name splitlease

# .claude/CLAUDE.md (line 83)
- npx wrangler pages deploy dist --project-name splitlease  # Manual deploy
+ npx wrangler pages deploy build --project-name splitlease  # Manual deploy

# app/CLAUDE.md (15 occurrences - replace all "dist/" with "build/")
```

<details>
<summary>📋 Full app/CLAUDE.md changes</summary>

| Line | Current | New |
|------|---------|-----|
| 36 | `[BUILD_OUTPUT]: dist/ with HTML at root, assets in dist/assets/` | `[BUILD_OUTPUT]: build/ with HTML at root, assets in build/assets/` |
| 39 | `[POST_BUILD_TASKS]: Move HTML to dist root, copy assets/, ...` | `[POST_BUILD_TASKS]: Move HTML to build root, copy assets/, ...` |
| 68 | `[IGNORED]: node_modules/, dist/, .env, ...` | `[IGNORED]: node_modules/, build/, .env, ...` |
| 95 | `[COPY_BEHAVIOR]: Assets copied to dist/ during build, HTML files moved to dist root` | `[COPY_BEHAVIOR]: Assets copied to build/ during build, HTML files moved to build root` |
| 129 | `### dist/` | `### build/` |
| 187 | `[OUTPUT]: dist/ directory` | `[OUTPUT]: build/ directory` |
| 188 | `[HTML_LOCATION]: dist root (e.g., dist/index.html)` | `[HTML_LOCATION]: build root (e.g., build/index.html)` |
| 189 | `[ASSETS_LOCATION]: dist/assets/ with hashed filenames` | `[ASSETS_LOCATION]: build/assets/ with hashed filenames` |
| 190 | `[INTERNAL_FILES]: dist/_internal/ (copies of HTML files for Cloudflare routing)` | `[INTERNAL_FILES]: build/_internal/ (copies of HTML files for Cloudflare routing)` |
| 197 | `[SERVER]: Vite preview server (serves dist/)` | `[SERVER]: Vite preview server (serves build/)` |
| 199 | `[PUBLIC_PREFIX]: Empty string (serves from dist root)` | `[PUBLIC_PREFIX]: Empty string (serves from build root)` |
| 208 | `[OUTPUT_DIR]: dist` | `[OUTPUT_DIR]: build` |
| 231 | `[BUILD_BEHAVIOR]: Vite processes, outputs to dist root with hashed asset references` | `[BUILD_BEHAVIOR]: Vite processes, outputs to build root with hashed asset references` |
| 284 | `[DESCRIPTION]: Copy HTML files to dist/_internal/ with custom names` | `[DESCRIPTION]: Copy HTML files to build/_internal/ with custom names` |

</details>

### 3.2 Architecture Documentation

**Files**:
- `.claude/Documentation/Architecture/ARCHITECTURE_GUIDE_ESM_REACT_ISLAND.md` - Line 158
- `.claude/Documentation/Routing/ROUTING_GUIDE.md` - Line 522
- `.claude/Documentation/Pages/404_QUICK_REFERENCE.md` - Lines 490, 499, 587
- `.claude/Documentation/Pages/INDEX_DEV_QUICK_REFERENCE.md` - Line 486

**Changes**: Replace all `dist/` references with `build/`

### 3.3 Command Documentation

**Files**:
- `.claude/commands/commands/deploy.md` - Lines 47, 62
- `.claude/commands/commands/stage.md` - Line 59
- `.claude/commands/commands/ship.md` - Line 60
- `.claude/commands/commands/supabase.md` - Lines 47, 62
- `.claude/commands/commands/generate_claude.md` - Line 112

**Changes**: Replace verification messages and wrangler deploy commands

```markdown
# All command files (verification step)
- - Verify that `app/dist` directory exists and contains files
+ - Verify that `app/build` directory exists and contains files

# Deploy commands
- - Run `npx wrangler pages deploy app/dist --project-name splitlease`
+ - Run `npx wrangler pages deploy app/build --project-name splitlease`
```

### 3.4 Audit Command Documentation

**Files**:
- `.claude/commands/audit-vitest-rtl-setup.md` - Line 218
- `.claude/commands/audit-test-file-colocation.md` - Line 177

**Changes**:

```javascript
// vitest.config.ts exclude configuration
- exclude: ['node_modules', 'dist', 'e2e'],
+ exclude: ['node_modules', 'build', 'e2e'],
```

---

## Category 4: Plan Files (🟢 OPTIONAL - Historical Documentation)

These are completed or pending plan files. Updating is optional for historical accuracy.

**Files** (8 files, 35 occurrences):
- `.claude/plans/New/20260125171500-cleanup-consolidate-claude-md-files.md` (11 occurrences)
- `.claude/plans/New/20260125110713-cleanup-rename-app-to-frontend.md` (3 occurrences)
- `.claude/plans/New/20260117-debarrel-implementation-plan.md` (4 occurrences)
- `.claude/plans/New/20260116181630_ADW_Modular_AST_Orchestrator_Redesign.md` (2 occurrences)
- `.claude/plans/New/20260120143000-adw-orchestrator-failure-analysis.md` (1 occurrence)
- `.claude/plans/New/20260120-vitest-testing-infrastructure-plan.md` (1 occurrence)
- `.claude/plans/Done/20260122153855-create-document-migration-plan.md` (1 occurrence)
- `.claude/plans/Done/20260121170000-usability-data-management-migration-plan.md` (1 occurrence)
- `.claude/plans/Done/20250124000000-deploy-refactored-view-split-lease-typescript-idor-fix.md` (1 occurrence)
- `.claude/plans/Documents/20260124084547-audit-coverage-thresholds.md` (3 occurrences)
- `.claude/plans/Documents/20260124083452-audit-test-file-colocation.md` (2 occurrences)

**Recommendation**:
- **Skip for now** - These are historical documents
- **Update later** if needed for searchability
- Use global find-replace: `dist/` → `build/` and `dist ` → `build ` (with trailing space)

---

## Category 5: Lock Files (⚪ AUTO-UPDATE)

These files are auto-generated and will update automatically on next `npm install` or `bun install`.

**Files**:
- `app/package-lock.json` - Lines 181, 1541, 4182
- `app/bun.lock` - Lines 360, 782, 932

**Action**: ✅ **NO MANUAL CHANGES NEEDED** - Will regenerate automatically

---

## Category 6: External CDN References (⛔ DO NOT CHANGE)

These are URLs to external CDN packages (lottie-player, leaflet). **DO NOT MODIFY**.

**Files** (8 occurrences):
- `app/public/assets/lotties/CLAUDE.md` - Line 48
- `app/public/help-center-articles/about/what-is-split-lease (1).html` - Line 11
- `app/public/help-center-articles/about/what-is-split-lease (1) (1).html` - Line 11
- `app/public/help-center-articles/guests/getting-started/what-is-split-lease.html` - Line 11
- `app/src/islands/modals/EditProposalModal.jsx` - Line 20
- `app/src/islands/shared/LoggedInAvatar/LoggedInAvatar.jsx` - Line 126
- `app/src/islands/shared/SuggestedProposals/HeaderSuggestedProposalTrigger.jsx` - Line 30
- `app/src/islands/pages/FavoriteListingsPage/components/MapView.jsx` - Lines 27, 33
- `app/src/islands/pages/HomePage.jsx` - Line 214
- `.claude/Documentation/Pages/INDEX_DEV_QUICK_REFERENCE.md` - Line 486

**Examples of EXTERNAL references (DO NOT CHANGE)**:
```javascript
// ⛔ DO NOT CHANGE - External CDN
script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
import 'react-datepicker/dist/react-datepicker.css';
```

---

## Category 7: Temporary/Log Files (⛔ DELETE)

These files should be deleted or gitignored.

**Files**:
- `a.txt` - Lines 3183-3188 (57 occurrences - Vite error logs)
- `.claude/agents/fp_chunk_1/raw_output.json` - Multiple occurrences (audit tool output)
- `.claude/agents/fp_chunk_1/raw_output.jsonl` - Multiple occurrences (audit tool output)

**Action**: ✅ **DELETE THESE FILES**

```bash
# Remove temporary log files
rm "a.txt"
rm -rf ".claude/agents/fp_chunk_1/"
```

---

## Execution Plan

### Phase 1: Pre-Flight Checks (5 minutes)

1. **Verify clean working directory**
   ```bash
   git status
   # Should show no uncommitted changes in critical files
   ```

2. **Verify no active builds**
   ```bash
   # Ensure no build processes are running
   # Check that app/dist exists (if you've built before)
   ls -la app/dist 2>/dev/null || echo "No dist directory (OK)"
   ```

3. **Create backup branch**
   ```bash
   git checkout -b cleanup/rename-dist-to-build
   ```

### Phase 2: Critical Configuration Updates (10 minutes)

**Order matters** - Update in this sequence:

1. ✅ Update `app/vite.config.js` (19 changes)
2. ✅ Update `.gitignore` (root)
3. ✅ Update `app/.gitignore`
4. ✅ Update `app/eslint.config.js`
5. ✅ Update `.pages.toml`
6. ✅ Update `slack-api/tsconfig.json`

### Phase 3: Scripts & Deployment Config (5 minutes)

7. ✅ Update `package.json` (root)
8. ✅ Update `app/package.json`
9. ✅ Update `build.sh`
10. ✅ Update Python scripts (`app/fp_audit_tool.py`, `.claude/skills/functional-code/scripts/fp_audit.py`)

### Phase 4: Documentation Updates (10 minutes)

11. ✅ Update `README.md`
12. ✅ Update `.claude/CLAUDE.md`
13. ✅ Update `.claude/AGENTS.md`
14. ✅ Update `app/CLAUDE.md`
15. ✅ Update command documentation (5 files in `.claude/commands/commands/`)
16. ✅ Update audit documentation (2 files in `.claude/commands/`)
17. ✅ Update architecture documentation (4 files in `.claude/Documentation/`)

### Phase 5: Cleanup (2 minutes)

18. ✅ Delete temporary files:
   ```bash
   rm "a.txt"
   rm -rf ".claude/agents/fp_chunk_1/"
   ```

19. ✅ Rename existing dist directory (if it exists):
   ```bash
   # If app/dist exists, rename it to app/build
   if [ -d "app/dist" ]; then
     mv app/dist app/build
     echo "✅ Renamed app/dist → app/build"
   fi
   ```

### Phase 6: Verification (5 minutes)

20. ✅ Test build:
   ```bash
   cd app
   bun run build

   # Verify build output is in app/build (not app/dist)
   ls -la build/
   ls -la build/assets/
   ```

21. ✅ Test preview:
   ```bash
   bun run preview
   # Open http://localhost:3000 and verify pages load
   ```

22. ✅ Verify no references to old directory:
   ```bash
   # Should find ONLY external CDN URLs (lottie, leaflet)
   grep -r "dist/" --include="*.{js,json,md,toml,sh,py}" --exclude-dir=node_modules
   ```

### Phase 7: Commit & Document (3 minutes)

23. ✅ Review all changes:
   ```bash
   git diff
   git status
   ```

24. ✅ Commit changes:
   ```bash
   git add .
   git commit -m "chore: rename build output directory from 'dist' to 'build' for clarity

   - Update vite.config.js outDir configuration
   - Update .gitignore files to exclude build/ instead of dist/
   - Update deployment scripts in package.json
   - Update ESLint ignore patterns
   - Update Cloudflare Pages config (.pages.toml)
   - Update all documentation references
   - Update Python audit scripts
   - Remove temporary log files

   BREAKING: Deployment scripts now reference 'build' directory.
   CI/CD pipelines may need updating.

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

25. ✅ Move this plan to Done:
   ```bash
   mv ".claude/plans/New/20260125180000-rename-dist-to-build-cleanup-plan.md" \
      ".claude/plans/Done/20260125180000-rename-dist-to-build-cleanup-plan.md"
   ```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Build fails after rename | Low | High | Test build immediately after config changes |
| CI/CD pipeline breaks | Medium | High | Update GitHub Actions / CI config if present |
| Deployment script errors | Low | High | Test `bun run build && bun run preview` before deploying |
| Documentation out of sync | Low | Low | Grep verification step catches remaining references |
| Lock file conflicts | Low | Low | Delete and regenerate lock files if needed |
| Developer confusion | Low | Medium | Document in commit message and team communication |

---

## Rollback Plan

If anything goes wrong:

```bash
# Discard all changes
git checkout main
git branch -D cleanup/rename-dist-to-build

# If you already committed and merged
git revert <commit-hash>

# Manual rollback of vite.config.js
# Change line 245 back to: outDir: 'dist',
# Rename app/build back to app/dist
mv app/build app/dist
```

---

## Post-Execution Checklist

- [ ] Build completes successfully (`bun run build`)
- [ ] Preview server works (`bun run preview`)
- [ ] No references to `dist/` remain (except external CDNs)
- [ ] Deployment to staging succeeds
- [ ] CI/CD pipeline updated (if applicable)
- [ ] Team notified of directory rename
- [ ] Plan file moved to `.claude/plans/Done/`

---

## File Summary

### Files to Modify (44 total)

**Category 1: Critical Config** (6 files)
1. `app/vite.config.js` ✅ 19 changes
2. `.gitignore` ✅ 1 change
3. `app/.gitignore` ✅ 1 change
4. `app/eslint.config.js` ✅ 1 change
5. `.pages.toml` ✅ 2 changes
6. `slack-api/tsconfig.json` ✅ 2 changes

**Category 2: Scripts** (4 files)
7. `package.json` ✅ 2 changes
8. `app/package.json` ✅ 2 changes
9. `build.sh` ✅ 2 changes
10. `app/fp_audit_tool.py` ✅ 1 change
11. `.claude/skills/functional-code/scripts/fp_audit.py` ✅ 1 change

**Category 3: Documentation** (17 files)
12. `README.md` ✅ 1 change
13. `.claude/CLAUDE.md` ✅ 1 change
14. `.claude/AGENTS.md` ✅ 1 change
15. `app/CLAUDE.md` ✅ 15 changes
16. `.claude/Documentation/Architecture/ARCHITECTURE_GUIDE_ESM_REACT_ISLAND.md` ✅ 1 change
17. `.claude/Documentation/Routing/ROUTING_GUIDE.md` ✅ 1 change
18. `.claude/Documentation/Pages/404_QUICK_REFERENCE.md` ✅ 3 changes
19. `.claude/Documentation/Pages/INDEX_DEV_QUICK_REFERENCE.md` ✅ 1 change
20. `.claude/commands/commands/deploy.md` ✅ 2 changes
21. `.claude/commands/commands/stage.md` ✅ 1 change
22. `.claude/commands/commands/ship.md` ✅ 1 change
23. `.claude/commands/commands/supabase.md` ✅ 2 changes
24. `.claude/commands/commands/generate_claude.md` ✅ 1 change
25. `.claude/commands/audit-vitest-rtl-setup.md` ✅ 1 change
26. `.claude/commands/audit-test-file-colocation.md` ✅ 1 change
27. `.claude/skills/vitest-rtl-setup/SKILL.md` ✅ 1 change
28. `.claude/skills/skill-creator/SKILL.md` ✅ 1 change
29. `.claude/skills/skill-creator/scripts/package_skill.py` ✅ 2 changes

**Category 4: Plan Files** (8 files - OPTIONAL)
30-37. Various plan files in `.claude/plans/`

### Files to Delete (3 total)

38. `a.txt` ❌ DELETE
39. `.claude/agents/fp_chunk_1/raw_output.json` ❌ DELETE
40. `.claude/agents/fp_chunk_1/raw_output.jsonl` ❌ DELETE

### Files to Ignore (11 total)

**Auto-Generated**:
- `app/package-lock.json` ⚪ Auto-updates
- `app/bun.lock` ⚪ Auto-updates
- `bun.lock` ⚪ Auto-updates

**External CDN References** (DO NOT MODIFY):
- `app/public/assets/lotties/CLAUDE.md`
- `app/public/help-center-articles/**/*.html` (3 files)
- `app/src/islands/**/*.jsx` (4 files)
- `.claude/Documentation/Pages/INDEX_DEV_QUICK_REFERENCE.md`

---

## Detailed File Reference Table

| # | File Path | Lines | Changes | Priority | Type |
|---|-----------|-------|---------|----------|------|
| 1 | `app/vite.config.js` | 115, 118, 126, 135, 144, 147, 152, 155, 160, 163, 168, 191, 196, 199, 204, 207, 212, 245, 278, 301 | 19 | 🔴 CRITICAL | Config |
| 2 | `.gitignore` | 28 | 1 | 🔴 CRITICAL | Config |
| 3 | `app/.gitignore` | 2 | 1 | 🔴 CRITICAL | Config |
| 4 | `app/eslint.config.js` | 76 | 1 | 🔴 CRITICAL | Config |
| 5 | `.pages.toml` | 6, 35 | 2 | 🔴 CRITICAL | Config |
| 6 | `slack-api/tsconfig.json` | 10, 15 | 2 | 🔴 CRITICAL | Config |
| 7 | `package.json` | 10, 11 | 2 | 🔴 CRITICAL | Script |
| 8 | `app/package.json` | 17, 18 | 2 | 🔴 CRITICAL | Script |
| 9 | `build.sh` | 18, 21 | 2 | 🔴 CRITICAL | Script |
| 10 | `app/fp_audit_tool.py` | 85 | 1 | 🟡 MEDIUM | Script |
| 11 | `.claude/skills/functional-code/scripts/fp_audit.py` | 126-127 | 2 | 🟡 MEDIUM | Script |
| 12 | `README.md` | 469 | 1 | 🟡 MEDIUM | Docs |
| 13 | `.claude/CLAUDE.md` | 83 | 1 | 🟡 MEDIUM | Docs |
| 14 | `.claude/AGENTS.md` | 83 | 1 | 🟡 MEDIUM | Docs |
| 15 | `app/CLAUDE.md` | 36, 39, 68, 95, 129, 187-190, 197, 199, 208, 231, 284 | 15 | 🟡 MEDIUM | Docs |

*(Remaining 29 files omitted for brevity - see categories above)*

---

## Referenced Files

All files are located in project root: `C:\Users\Split Lease\Documents\Split Lease - Team\`

**Critical Files**:
- [app/vite.config.js](../../../app/vite.config.js)
- [.gitignore](../../../.gitignore)
- [app/.gitignore](../../../app/.gitignore)
- [app/eslint.config.js](../../../app/eslint.config.js)
- [.pages.toml](../../../.pages.toml)
- [package.json](../../../package.json)
- [app/package.json](../../../app/package.json)
- [build.sh](../../../build.sh)

**Documentation Files**:
- [README.md](../../../README.md)
- [.claude/CLAUDE.md](../../CLAUDE.md)
- [app/CLAUDE.md](../../../app/CLAUDE.md)

---

**END OF PLAN**
