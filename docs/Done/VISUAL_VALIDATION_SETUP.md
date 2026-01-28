# Visual Validation Setup & Execution Guide

Automated visual validation process for comparing 12 admin pages (Bubble prototype vs local development).

## Overview

This process automates the capture of full-page screenshots for visual comparison, then provides a structured template for manual review and scoring.

## Quick Start

### 1. Prerequisites

Verify you have:
- Local dev server capability (Vite/Bun)
- Node.js with npm/bun
- Playwright installed
- Network access to https://app.split.lease
- Browser for Playwright (Chromium)

### 2. Start Local Dev Server

From the project root:

```bash
bun run dev --port 8001
```

Or from the app directory:

```bash
cd app && bun run dev --port 8001
```

Wait for the server to be ready (should output "ready in XXXms" or similar).

### 3. Run Visual Validation

From the project root, execute the automated capture script:

```bash
# Option A: Using Node.js with TypeScript compiler
npx ts-node scripts/visual-validation-playwright.ts

# Option B: Using Bun
bun run scripts/visual-validation-playwright.ts

# Option C: Using Node.js directly (if compiled to JS)
node scripts/visual-validation.js
```

The script will:
1. Launch Chromium browser
2. Navigate to each page on both Bubble and local
3. Capture full-page screenshots
4. Save to `docs/Done/visual-validation-screenshots/`
5. Generate a results summary

### 4. Review & Score

Once screenshots are captured:

1. Open `docs/Done/VISUAL_VALIDATION_REPORT.md`
2. For each page, review the screenshot pair side-by-side
3. Fill in the "Visual Checklist" table for each page
4. Calculate overall match percentage
5. Document any issues found

## Directory Structure

```
docs/Done/
├── visual-validation-screenshots/     # Generated screenshots
│   ├── 01-verify-users-local.png
│   ├── 01-verify-users-bubble.png
│   ├── 02-proposal-management-local.png
│   ├── 02-proposal-management-bubble.png
│   └── ... (24 total)
├── VISUAL_VALIDATION_REPORT.md       # Main validation report (filled in manually)
└── VISUAL_VALIDATION_SETUP.md        # This file
```

## Pages Validated

| # | Page Name | Local Route | Bubble Route |
|---|-----------|-------------|--------------|
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

## Scripts Available

### `scripts/visual-validation-playwright.ts` (Recommended)

Modern TypeScript implementation with Playwright.

**Advantages**:
- Clean async/await syntax
- Full error handling
- Progress reporting
- JSON results export
- Works with both Node.js and Bun

**Usage**:
```bash
npx ts-node scripts/visual-validation-playwright.ts
bun run scripts/visual-validation-playwright.ts
```

### `scripts/visual-validation.js` (Alternative)

Node.js implementation with CommonJS.

**Advantages**:
- No TypeScript required
- Compatible with all Node versions
- Simple setup

**Usage**:
```bash
node scripts/visual-validation.js
```

## Troubleshooting

### Dev Server Not Responding

**Problem**: Script fails with "localhost:8001 connection refused"

**Solution**:
```bash
# Check if server is running
lsof -i :8001  # macOS/Linux
netstat -ano | findstr :8001  # Windows

# Kill any existing process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Start fresh
bun run dev --port 8001
```

### Bubble URLs Timing Out

**Problem**: Script fails on Bubble URLs with timeout errors

**Solution**:
- Check network connectivity to https://app.split.lease
- Verify Bubble instance is accessible in browser
- Increase timeout in script (modify `timeoutMs` parameter)
- Try running during off-peak hours

### Screenshot Directory Issues

**Problem**: "Permission denied" writing to docs/Done/

**Solution**:
```bash
# Ensure directory exists and is writable
mkdir -p docs/Done/visual-validation-screenshots
chmod 755 docs/Done/visual-validation-screenshots
```

### Playwright Browser Issues

**Problem**: "Chromium not found" error

**Solution**:
```bash
# Install Playwright browsers
npx playwright install chromium

# Or with Bun
bunx playwright install chromium
```

## Manual Review Workflow

### Step 1: Prepare for Review

1. Ensure all screenshots are captured successfully
2. Check that both local and Bubble versions exist for each page
3. Open a PDF viewer or image comparison tool

### Step 2: Review Each Page (12 iterations)

For each page pair:

1. **Open screenshots**:
   - Local: `docs/Done/visual-validation-screenshots/{id}-local.png`
   - Bubble: `docs/Done/visual-validation-screenshots/{id}-bubble.png`

2. **Score visual elements**:
   - Layout: Is the overall structure the same?
   - Colors: Do brand colors match?
   - Typography: Is font size/weight consistent?
   - Spacing: Are margins/padding equivalent?
   - Components: Are buttons, inputs, cards styled identically?

3. **Rate each element** (1-5 scale):
   - 5 = Perfect match
   - 4 = Minor differences, not noticeable
   - 3 = Some differences, slightly noticeable
   - 2 = Significant differences
   - 1 = Major discrepancies

4. **Calculate page match**:
   ```
   Match % = (Sum of scores / Total possible score) × 100
   Example: (42/45) × 100 = 93.3%
   ```

5. **Document findings**:
   - List any issues found
   - Assign priority: High/Medium/Low
   - Suggest fixes if applicable

### Step 3: Generate Summary

After reviewing all 12 pages:

1. **Count pages meeting targets**:
   - 95%+ match: APPROVED
   - 90-94% match: REVIEW NEEDED
   - <90% match: ESCALATE

2. **List high-priority issues**:
   - These should be fixed before deployment

3. **Create action items**:
   - For each issue, determine owner and timeline

## Report Template Usage

The `VISUAL_VALIDATION_REPORT.md` file contains:

- Page-by-page comparison templates
- Visual checklist tables (11 elements per page)
- Scoring matrix
- Issue tracking sections
- Sign-off section for stakeholders

### Filling in the Report

For each page section:

```markdown
### [Page Name]

**Match Score**: [Calculate from scores]%

**Critical Elements** (checked off as validated):
- [x] Element 1
- [ ] Element 2 - Issue: [description]

**Visual Checklist** (fill in each row):
| Element | Local | Bubble | Match | Notes |
|---------|-------|--------|-------|-------|
| Header | 5 | 5 | 5 | Perfect match |
| Layout | 4 | 4 | 4 | Slight spacing |
| ... |

**Issues Found**:
1. [Issue] - Priority: High/Medium/Low
2. [Issue] - Priority: High/Medium/Low

**Recommended Fixes**:
1. [Fix description]
```

## Validation Criteria

### Approval Levels

| Match % | Status | Action |
|---------|--------|--------|
| 95-100% | APPROVED | No changes needed, proceed to deployment |
| 90-94% | REVIEW NEEDED | Document fixes, implement, retest |
| 85-89% | NEEDS ATTENTION | Review with design team, prioritize |
| <85% | ESCALATE | Significant rework required |

### Critical Elements

For each page type, certain elements are critical:

**Common to all pages**:
- Header (AdminHeader component) styling
- Color consistency with brand guidelines
- Typography (font sizes, weights)
- Spacing/padding consistency

**Page-specific** (see VISUAL_VALIDATION_CHECKLIST.md):
- Navigation patterns
- Form styling
- Button states
- Badge/status indicators
- Modal/overlay styling

## Performance Tips

### Speed Up Captures

1. **Use smaller viewport** (not recommended - use standard 1920x1080)
2. **Reduce timeout** (dangerous - may miss content)
3. **Skip Bubble if not needed** (modify script to skip one version)

### Optimize For Large Reports

1. Compress screenshots after capture
2. Use JPG instead of PNG (modify script)
3. Create separate reports per page

## Automation Scheduling

### CI/CD Integration

To run validation automatically on each deployment:

```yaml
# Example GitHub Actions workflow
name: Visual Validation
on: [deployment]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm start &  # Start dev server
      - run: npx ts-node scripts/visual-validation-playwright.ts
      - uses: actions/upload-artifact@v2
        with:
          name: validation-screenshots
          path: docs/Done/visual-validation-screenshots/
```

### Manual Scheduling

Run validation on a regular schedule:

- **After major UI updates**: Always run before deployment
- **Weekly**: During active development
- **Before release**: Final validation before production

## Support & Questions

For issues with the validation process:

1. Check the **Troubleshooting** section above
2. Review script output for detailed error messages
3. Check that prerequisites are installed
4. Verify network connectivity to both endpoints
5. Consult project team for environment-specific issues

## Related Documentation

- [VISUAL_VALIDATION_REPORT.md](./VISUAL_VALIDATION_REPORT.md) - Main validation report
- [VISUAL_VALIDATION_CHECKLIST.md](../../Documents/VISUAL_VALIDATION_CHECKLIST.md) - Original checklist
- [app/CLAUDE.md](../../app/CLAUDE.md) - Frontend architecture
- [docs/INDEX.md](../INDEX.md) - Documentation index

---

**Last Updated**: 2026-01-26
**Version**: 1.0
