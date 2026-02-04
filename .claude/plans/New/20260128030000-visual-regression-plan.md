# Visual Regression Testing Plan - Public Pages

**Created:** 2026-01-28 03:00:00
**Type:** Ralph Loop Plan
**Status:** ACTIVE
**Activity File:** [20260128030001-visual-regression-activity.md](./20260128030001-visual-regression-activity.md)

---

## Objective

Systematically capture screenshots of all public pages on both:
- **CONTROL (Live):** `https://split.lease`
- **CANDIDATE (Local):** `http://localhost:8001`

Then compare screenshots to identify visual regressions before deploying changes.

---

## Scope

### In-Scope: Public Pages (21 pages)

**Marketing & Info (14 pages):**
| # | Path | Page Name | Notes |
|---|------|-----------|-------|
| 1 | `/` | Homepage | Landing page |
| 2 | `/why-split-lease` | Value Proposition | Marketing |
| 3 | `/list-with-us` | Host Onboarding v1 | Signup flow |
| 4 | `/list-with-us-v2` | Host Onboarding v2 | Newer version |
| 5 | `/about-us` | About Page | Company info |
| 6 | `/careers` | Careers Page | Job listings |
| 7 | `/host-guarantee` | Host Guarantee | Trust/safety |
| 8 | `/policies` | Policies | Legal/terms |
| 9 | `/faq` | FAQ | Help content |
| 10 | `/referral` | Referral Program | Growth |
| 11 | `/guest-success` | Guest Success | Post-signup |
| 12 | `/host-success` | Host Success | Post-signup |
| 13 | `/help-center` | Help Center Home | Support hub |
| 14 | `/qr-code-landing` | QR Code Landing | Mobile entry |

**Search & Discovery (2 pages):**
| # | Path | Page Name | Notes |
|---|------|-----------|-------|
| 15 | `/search` | Search Listings | Core feature |
| 16 | `/quick-match` | Quick Match | Discovery tool |

**Auth & Onboarding (2 pages):**
| # | Path | Page Name | Notes |
|---|------|-----------|-------|
| 17 | `/reset-password` | Password Reset | Auth flow |
| 18 | `/auth/verify` | Email Verification | Auth flow |

**Guest-Facing Tools (2 pages):**
| # | Path | Page Name | Notes |
|---|------|-----------|-------|
| 19 | `/visit-manual` | Visit Manual | Guest info |
| 20 | `/report-emergency` | Report Emergency | Safety form |

**Error Pages (1 page):**
| # | Path | Page Name | Notes |
|---|------|-----------|-------|
| 21 | `/404` | Not Found | Error state |

### Out-of-Scope

- **devOnly pages:** `/index-dev`, `/referral-demo`, `/signup-trial-host`
- **Dynamic routes needing IDs:** `/view-split-lease/:id`, `/help-center/:category`
- **Should-be-protected:** `/self-listing-v2`
- **Admin pages:** All `/_*` paths (35 pages)
- **Protected pages:** All 22 auth-required pages

---

## Methodology

### Phase 1: Screenshot Capture (Live - Control)

```
For each page in scope:
  1. Navigate to https://split.lease{path}
  2. Wait for page load (network idle)
  3. Take full-page screenshot
  4. Save as: screenshots/live/{page-name}.png
  5. Update activity file with status
```

### Phase 2: Screenshot Capture (Local - Candidate)

```
For each page in scope:
  1. Navigate to http://localhost:8001{path}
  2. Wait for page load (network idle)
  3. Take full-page screenshot
  4. Save as: screenshots/local/{page-name}.png
  5. Update activity file with status
```

### Phase 3: Comparison & Analysis

```
For each page pair:
  1. Load live screenshot
  2. Load local screenshot
  3. Compare dimensions
  4. Identify visual differences
  5. Categorize: MATCH | MINOR_DIFF | MAJOR_DIFF | BROKEN
  6. Document findings in activity file
```

---

## Screenshot Storage

```
.claude/screenshots/
├── 20260128-visual-regression/
│   ├── live/           # Control screenshots (split.lease)
│   │   ├── 01-homepage.png
│   │   ├── 02-why-split-lease.png
│   │   └── ...
│   ├── local/          # Candidate screenshots (localhost:8001)
│   │   ├── 01-homepage.png
│   │   ├── 02-why-split-lease.png
│   │   └── ...
│   └── diffs/          # Visual diff overlays (if any)
│       └── ...
```

---

## Playwright MCP Commands

### Navigate & Screenshot Pattern

```javascript
// Navigate to page
mcp__playwright__browser_navigate({ url: "https://split.lease/" })

// Wait for load
mcp__playwright__browser_wait_for({ time: 2 })

// Take screenshot
mcp__playwright__browser_take_screenshot({
  fullPage: true,
  filename: "screenshots/live/01-homepage.png",
  type: "png"
})
```

### Browser Setup

- **Viewport:** 1920x1080 (desktop)
- **Mode:** Full page screenshots
- **Format:** PNG (lossless)

---

## Success Criteria

### Per Page
- [ ] Live screenshot captured successfully
- [ ] Local screenshot captured successfully
- [ ] Comparison completed
- [ ] Status documented

### Overall
- [ ] All 21 pages screenshotted on live
- [ ] All 21 pages screenshotted on local
- [ ] All comparisons completed
- [ ] Summary report generated
- [ ] Regressions documented with severity

---

## Regression Categories

| Category | Description | Action Required |
|----------|-------------|-----------------|
| **MATCH** | No visual differences | None |
| **MINOR_DIFF** | Spacing, font rendering, timing | Document only |
| **MAJOR_DIFF** | Layout shifts, missing elements | Investigate |
| **BROKEN** | Page fails to load, errors visible | Block deploy |

---

## Loop Completion Promise

```
COMPLETION_CONDITION: All 21 public pages have been screenshotted on BOTH
live and local environments, comparisons documented, and summary report
generated with regression findings.
```

---

## References

- **Source Document:** [20260128024500_pages_by_access_level.md](../Documents/20260128024500_pages_by_access_level.md)
- **Route Registry:** `app/src/routes.config.js`
- **Activity Tracker:** [20260128030001-visual-regression-activity.md](./20260128030001-visual-regression-activity.md)

---

## Execution Notes

### Prerequisites
1. Local dev server running on `localhost:8001`
2. Playwright MCP server connected
3. Network access to `split.lease`
4. Screenshot directory created

### Execution Order
1. Create screenshot directories
2. Capture all LIVE screenshots (Phase 1)
3. Capture all LOCAL screenshots (Phase 2)
4. Run comparisons (Phase 3)
5. Generate summary report

---

**Next Action:** Execute Phase 1 - Begin capturing live screenshots starting with homepage.
