# Visual Validation Process - Complete Setup

Automated visual validation comparing 12 admin pages (Bubble prototype vs local development).

## What's Included

### 1. Automation Scripts

#### **`scripts/visual-validation-playwright.ts`** (Primary)
- Modern TypeScript implementation
- Full Playwright integration
- Captures 24 full-page screenshots
- Generates validation results JSON
- Compatible with Node.js and Bun

#### **`scripts/visual-validation.js`** (Alternative)
- CommonJS Node.js implementation
- No TypeScript required
- Same functionality as TypeScript version

#### **`scripts/run-visual-validation.sh`** (Runner - macOS/Linux)
- Automated prerequisite checking
- Optional dev server startup
- Runs validation
- Opens report in editor

#### **`scripts/run-visual-validation.bat`** (Runner - Windows)
- Windows batch equivalent
- Same features as shell script
- Integrated with Windows environment

### 2. Documentation

#### **`docs/Done/VISUAL_VALIDATION_REPORT.md`**
- Main validation report with templates
- Page-by-page comparison sections (12 pages)
- Visual checklist tables for scoring
- Issue tracking template
- Scoring matrix and sign-off section

#### **`docs/Done/VISUAL_VALIDATION_SETUP.md`**
- Comprehensive setup guide
- Troubleshooting tips
- Manual review workflow
- Automation scheduling info
- Support resources

#### **`docs/Done/VISUAL_VALIDATION_README.md`** (This File)
- Overview of the complete process
- Quick start instructions
- File structure reference

### 3. Screenshot Repository

**Directory**: `docs/Done/visual-validation-screenshots/`

Contains 24 PNG screenshots (before validation):
- 12 local version captures (e.g., `01-verify-users-local.png`)
- 12 Bubble version captures (e.g., `01-verify-users-bubble.png`)

Plus metadata:
- `validation-results.json` - Machine-readable results

## Quick Start (3 Steps)

### Step 1: Start Dev Server

```bash
# From project root
bun run dev --port 8001

# Or from app directory
cd app && bun run dev --port 8001
```

Wait for "ready in XXms" message.

### Step 2: Run Visual Validation

**Option A - Windows**:
```bash
scripts\run-visual-validation.bat
```

**Option B - macOS/Linux**:
```bash
chmod +x scripts/run-visual-validation.sh
./scripts/run-visual-validation.sh
```

**Option C - Direct execution**:
```bash
# With Bun
bun run scripts/visual-validation-playwright.ts

# With Node.js
npx ts-node scripts/visual-validation-playwright.ts
```

### Step 3: Review Results

1. Open screenshots: `docs/Done/visual-validation-screenshots/`
2. Open report: `docs/Done/VISUAL_VALIDATION_REPORT.md`
3. Fill in scoring and findings for each page
4. Calculate overall match percentages

## Pages Validated (12 Total)

| # | Page | Local Route | Bubble Route |
|---|------|------------|--------------|
| 1 | Verify Users | `/_internal/verify-users` | `/version-test/_verify-users` |
| 2 | Proposal Management | `/_internal/proposal-manage` | `/version-test/_proposal-manage` |
| 3 | Virtual Meetings | `/_internal/manage-virtual-meetings` | `/version-test/_manage-virtual-meetings` |
| 4 | Message Curation | `/_internal/message-curation` | `/version-test/_message-curation` |
| 5 | Co-Host Requests | `/_internal/co-host-requests` | `/version-test/_co-host-requests` |
| 6 | Internal Emergency | `/_internal/emergency` | `/version-test/_internal-emergency` |
| 7 | Leases Overview | `/_internal/leases-overview` | `/version-test/_leases-overview` |
| 8 | Admin Threads | `/_internal/admin-threads` | `/version-test/_quick-threads-manage` |
| 9 | Modify Listings | `/_internal/modify-listings` | `/version-test/_modify-listings` |
| 10 | Rental Applications | `/_internal/manage-rental-applications` | `/version-test/_rental-app-manage` |
| 11 | Quick Price | `/_internal/quick-price` | `/version-test/_quick-price` |
| 12 | Magic Login Links | `/_internal/send-magic-login-links` | `/version-test/_send-magic-login-links` |

## Scoring & Approval

### Element-Level Scoring (1-5 scale)

For each page, rate these 9 visual elements:

| Element | Description | Scale |
|---------|-------------|-------|
| **Layout** | Overall structure and positioning | 1-5 |
| **Colors** | Brand colors and consistency | 1-5 |
| **Typography** | Font sizes, weights, families | 1-5 |
| **Spacing** | Margins, padding, gaps | 1-5 |
| **Components** | Buttons, inputs, cards, badges | 1-5 |
| **Header/Nav** | Navigation and header styling | 1-5 |
| **Responsive** | Mobile/tablet breakpoints | 1-5 |
| **Interactive** | Hover states, focus, animations | 1-5 |
| **Accessibility** | ARIA labels, contrast, structure | 1-5 |

**Formula**:
```
Page Match % = (Sum of scores / 45) × 100
```

Example: (42/45) × 100 = 93.3%

### Approval Levels

| Match % | Status | Action |
|---------|--------|--------|
| 95-100% | ✓ APPROVED | No changes needed |
| 90-94% | ⚠ REVIEW | Document fixes needed |
| 85-89% | ✗ NEEDS WORK | Significant updates |
| <85% | ✗ ESCALATE | Major rework required |

## File Structure

```
Split Lease/
├── scripts/
│   ├── visual-validation-playwright.ts      # Primary automation script
│   ├── visual-validation.js                 # Alternative JS version
│   ├── run-visual-validation.sh             # Unix/Linux runner
│   └── run-visual-validation.bat            # Windows runner
│
└── docs/Done/
    ├── VISUAL_VALIDATION_README.md          # This file
    ├── VISUAL_VALIDATION_SETUP.md           # Detailed setup guide
    ├── VISUAL_VALIDATION_REPORT.md          # Main validation report (12 pages)
    ├── visual-validation-screenshots/       # Generated screenshots directory
    │   ├── 01-verify-users-local.png
    │   ├── 01-verify-users-bubble.png
    │   ├── 02-proposal-management-local.png
    │   ├── 02-proposal-management-bubble.png
    │   ├── ... (20 more screenshots)
    │   └── validation-results.json
    │
    └── ... (other documentation)
```

## How It Works

### Automated Capture Process

```
1. Launch Playwright Chromium
2. For each of 12 pages:
   a. Navigate to local version
   b. Wait for DOM content loaded
   c. Wait 2 seconds for render stabilization
   d. Capture full-page screenshot
   e. Save as {id}-local.png
   f. Navigate to Bubble version
   g. Repeat steps c-e for Bubble
3. Generate validation-results.json
4. Close browser
5. Print summary report
```

### Manual Review Process

```
1. Open screenshot pair side-by-side
2. Compare 9 visual elements
3. Rate each 1-5 on consistency
4. Document any discrepancies
5. Assign issues to High/Medium/Low priority
6. Calculate overall match percentage
7. Repeat for all 12 pages
8. Compile summary and next steps
```

## Prerequisites

### Required
- Node.js 16+ (or Bun 1.0+)
- npm (comes with Node.js)
- Playwright (installed automatically)
- Local dev server capability

### Nice to Have
- Bun (faster execution)
- Bash/PowerShell (for runner scripts)
- Code editor to view/edit reports
- Browser to manually verify results

## Common Commands

### Start Development

```bash
# From project root
bun run dev --port 8001

# From app directory
cd app && bun run dev --port 8001
```

### Run Validation

```bash
# Windows
scripts\run-visual-validation.bat

# macOS/Linux
./scripts/run-visual-validation.sh

# Direct
bun run scripts/visual-validation-playwright.ts
```

### Review Results

```bash
# Open report in VS Code
code docs/Done/VISUAL_VALIDATION_REPORT.md

# Open screenshots
open docs/Done/visual-validation-screenshots
```

## Troubleshooting

### "Dev server not responding"
```bash
# Kill existing process and restart
pkill -f "bun run dev"  # macOS/Linux
# or
taskkill /F /IM node.exe  # Windows

# Start fresh
bun run dev --port 8001
```

### "Playwright not found"
```bash
npx playwright install chromium
# or
bunx playwright install chromium
```

### "Screenshot directory doesn't exist"
```bash
mkdir -p docs/Done/visual-validation-screenshots
# or Windows:
mkdir docs\Done\visual-validation-screenshots
```

### "Timeout navigating to Bubble URLs"
- Check network connectivity to https://app.split.lease
- Try running during off-peak hours
- Verify Bubble instance is accessible in browser
- Increase timeout in script (modify `timeoutMs` parameter)

## Performance Notes

- **Typical run time**: 8-15 minutes (for all 12 pages × 2 versions)
- **Screenshot size**: ~2-5MB per full-page capture (24 total ≈ 50-120MB)
- **Memory usage**: ~500MB-1GB
- **Network**: Requires continuous connection to https://app.split.lease

## Next Steps After Validation

1. **Review Findings**
   - Document issues found
   - Screenshot any discrepancies
   - Link to specific elements

2. **Prioritize Issues**
   - High: Blocks deployment
   - Medium: Should fix before release
   - Low: Nice to have, can defer

3. **Create Action Items**
   - File GitHub issues for each High/Medium priority item
   - Assign to team members
   - Set timeline for fixes

4. **Remediate Issues**
   - Fix identified problems
   - Re-run validation for modified pages
   - Update report with final scores

5. **Final Approval**
   - Ensure 95%+ overall match
   - Get sign-off from design and development leads
   - Deploy to production

## Support

For issues or questions:

1. Review [VISUAL_VALIDATION_SETUP.md](./VISUAL_VALIDATION_SETUP.md) troubleshooting section
2. Check script output for detailed error messages
3. Verify all prerequisites are installed
4. Consult project team for environment-specific help

## Related Documents

- Original checklist: `C:\Users\igor\.gemini\antigravity\brain\5f015a22-8716-4fc9-a173-33ecca2167fc\VISUAL_VALIDATION_CHECKLIST.md`
- Frontend architecture: [app/CLAUDE.md](../../app/CLAUDE.md)
- Documentation index: [docs/INDEX.md](../INDEX.md)

---

**Version**: 1.0
**Created**: 2026-01-26
**Status**: Ready for use
