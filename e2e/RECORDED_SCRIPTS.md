# Autonomous Recorded Scripts

Standalone Playwright scripts that run full user journeys against live sites with video recording, timestamped screenshots, and backend data verification.

These run independently with `node` — they are NOT part of the `npx playwright test` suite.

---

## Quick Start

```bash
# Full lifecycle: listing → proposal → host counter → guest accept → verify (default)
node e2e/create-proposal-recorded.cjs

# Target a different site
node e2e/create-proposal-recorded.cjs --site=app.split.lease

# Skip listing creation — use an existing listing
node e2e/create-proposal-recorded.cjs --listing=1690306660930x203632730519109630

# Create a listing only (standalone)
node e2e/create-listing-recorded.cjs
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Host | rodtesthost2@test.com | eCom@2024 |
| Guest | splitleasetesting@test.com | eCom@2024 |

## Output

Each run creates a timestamped folder under `e2e/recordings/`:

```
e2e/recordings/<site>-proposals/<timestamp>/
├── *.webm                    # Full session video (host + guest contexts)
├── proposal-report.json      # Backend observer verification
├── run-summary.json          # Run metadata
├── test-images/              # Generated test PNGs for photo upload
└── screenshots/*.png         # Step-by-step screenshots
```

---

## create-proposal-recorded.cjs

Full two-actor lifecycle test with 5 phases: host creates listing, guest creates proposal, host counter-offers, guest accepts, backend verifies. Uses two separate browser contexts (host + guest incognito) — no login/logout cycling.

### Architecture: Two-Context Design

Based on Rod's site walkthrough. Host and guest operate in SEPARATE Playwright browser contexts, like Rod using his regular browser for host actions and an incognito window for guest actions.

```
HOST CONTEXT (regular browser)        GUEST CONTEXT (incognito)
──────────────────────────────        ────────────────────────────
Phase 1: Login → Create Listing
         ↓ listing URL
         ─────────────────────→       Phase 2: Open URL → Login →
                                               Configure Schedule →
                                               Create Proposal →
                                               Adjust to 16 weeks →
                                               Submit
Phase 3: Host Proposals →
         Expand Card →
         Click "Modify" →
         HostEditingProposal modal →
         Edit Proposal → Change span →
         Update Proposal → Submit counter
                                      Phase 4: Guest Proposals →
                                               "Accept Host Terms" →
                                               CompareTermsModal →
                                               "Accept Host Terms" →
                                               "Counteroffer Accepted!"
                                      (context closed)
Phase 5: Backend Observer (6-field Supabase check)
```

### Current-State Flow (Feb 2026)

```
PHASE 1 — HOST
Self-Listing Wizard (/self-listing)
    ├── Section 1: Space Snapshot (name, type, bedrooms, address)
    ├── Section 2: Features (amenities, description)
    ├── Section 3: Lease Styles (Monthly + agree to terms)
    ├── Section 4: Pricing (monthly compensation, damage deposit)
    ├── Section 5: Rules (cancellation policy, house rules)
    ├── Section 6: Photos (3 test PNGs uploaded)
    └── Section 7: Review & Submit → "Listing Created Successfully!"
         ├── "Preview Listing" → extract listing ID from URL
         └── Listing URL shared with guest context

PHASE 2 — GUEST (separate browser context)
View Split Lease Page (/view-split-lease/:id)
    ├── Schedule Selector: 7 day buttons (S M T W T F S)
    │   └── Select Tue-Wed-Thu (3 days, 2 nights)
    ├── Reservation Span: "13 weeks (3 months)"
    ├── Scroll down to reveal booking button
    │
    ▼
"Create Proposal at $X/night" button
    │
    ▼
Create Proposal Modal
    ├── User Details (may be pre-filled from profile)
    ├── Confirm Proposal (Pristine section)
    │   └── Edit → Adjust Proposal → change to 16 weeks → Save & Review
    └── Submit Proposal → "Proposal Submitted!"
         └── "Go to Guest Dashboard" → /guest-proposals?proposal={id}

PHASE 3 — HOST (back to host context)
Host Proposals Page (/host-proposals)
    ├── Listing tabs at top (select the new listing)
    ├── Proposal card: collapsed → click header to expand
    ├── Scroll down to reveal action buttons
    ├── Click "Modify" → HostEditingProposal modal opens
    │
    ▼
HostEditingProposal Modal (3-state view machine)
    ├── Pristine view (readonly proposal details)
    │   └── Click "Edit Proposal" → enters editing mode
    ├── Editing view (form fields)
    │   ├── Schedule Selector
    │   ├── Move-in Date
    │   ├── Reservation Span → change from 16 to 13 weeks
    │   └── Click "Update Proposal" → enters review mode
    └── Review/General view (price breakdown)
         └── Click "Submit" → counter-offer sent
              └── Toast: "Modifications submitted! Awaiting Guest Review."

PHASE 4 — GUEST (back to guest context)
Guest Proposals Page (/guest-proposals?proposal={id})
    ├── Proposal card shows "Host Counteroffer Submitted" status
    ├── Click "Accept Host Terms" → CompareTermsModal opens
    │
    ▼
CompareTermsModal
    ├── Side-by-side comparison of original vs host terms
    └── Click "Accept Host Terms" → "Counteroffer Accepted!"

PHASE 5 — BACKEND OBSERVER
    └── Supabase REST API → 6-field verification
```

### What the Script Automates

| Step | Phase | Action | Detail |
|------|-------|--------|--------|
| 1 | Host | Login | Opens Sign In modal, fills credentials. Creates account if login fails. |
| 2 | Host | Create listing | 7-section wizard: Space Snapshot → Features → Lease Styles → Pricing → Rules → Photos → Submit |
| 3 | Host | Capture listing ID | Clicks "Preview Listing" button, extracts ID from URL query param |
| 4 | Guest | Open listing | Navigates to listing URL in separate browser context (incognito) |
| 5 | Guest | Login | Logs in on the listing page. Creates account if needed. |
| 6 | Guest | Configure schedule | Selects Tue-Wed-Thu (3 days, 2 nights), sets 13-week reservation span |
| 7 | Guest | Create Proposal | Scrolls to button, clicks "Create Proposal at $X/night" |
| 8 | Guest | Adjust span | Opens edit, changes reservation span from 13 to 16 weeks |
| 9 | Guest | Submit | Clicks "Submit Proposal", waits for success modal |
| 10 | Guest | Capture proposal ID | Clicks "Go to Guest Dashboard", extracts proposal ID from URL |
| 11 | Host | View proposal | Navigates to /host-proposals, finds and expands proposal card |
| 12 | Host | Click Modify | Scrolls to "Modify" button, clicks it — opens HostEditingProposal modal |
| 13 | Host | Edit proposal | Clicks "Edit Proposal", changes reservation span from 16 to 13 weeks |
| 14 | Host | Submit counter | Clicks "Update Proposal" → "Submit" — counter-offer sent |
| 15 | Guest | View counter | Navigates to /guest-proposals, sees "Host Counteroffer Submitted" status |
| 16 | Guest | Accept counter | Clicks "Accept Host Terms" → CompareTermsModal → "Accept Host Terms" |
| 17 | Observer | Verify backend | Queries Supabase for 6-field match |

### Backend Observer

Queries Supabase REST API and verifies:

| Field | Supabase Column | Check |
|-------|----------------|-------|
| Reservation Span | `Reservation Span (Weeks)` | Exact match (16) |
| Days Selected | `Days Selected` | Array match ([2,3,4]) |
| Guest Email | `Guest email` | Exact match |
| Status | `Status` | Contains "Accepted" or "Host Review" |
| Nightly Price | `proposal nightly price` | Positive number |
| Listing ID | `Listing` | Non-empty string |

### CLI Options

| Option | Default | Description |
|--------|---------|-------------|
| `--site=<name>` | `split.lease` | Target site (`split.lease` or `app.split.lease`) |
| `--listing=<id>` | creates new | Specific listing ID (skips listing creation) |

### Known Behaviors

- **Fresh listing per run**: A new listing is created each run, eliminating "Proposal Already Exists" issues.
- **Pre-filled fields**: User detail textareas are often pre-populated from the guest's profile. The script skips filling if fields aren't visible.
- **Short modal flow**: If user details are pre-filled, the "Submit Proposal" button appears on the Confirm step immediately.
- **Scroll-dependent buttons**: "Create Proposal", "Modify", and "Accept Host Terms" buttons all require scrolling to appear in the viewport.
- **Button-scan approach**: All action buttons are found by iterating all visible buttons and matching exact text content (more reliable than CSS selectors).
- **Custom dropdowns**: The HostEditingProposal uses custom React dropdowns (`.hep-dropdown`), not native `<select>` elements.
- **Guest context stays alive**: The guest context remains open through Phase 4 (unlike earlier versions that closed it after Phase 2).
- **Account creation fallback**: If login fails for either host or guest, the script attempts to create the account via signup.

---

## create-listing-recorded.cjs

Simulates a host creating a new listing through the self-listing wizard (standalone script).

**Run:** `node e2e/create-listing-recorded.cjs`

**Output:** `e2e/recordings/split-lease-listings/<timestamp>/`

---

## Troubleshooting

**Listing creation fails** — Check that the self-listing wizard loads correctly. Verify host account has permission to create listings.

**"Create Proposal" button not found** — The button is below the fold on the listing page. The script scrolls aggressively to reveal it. If still not found, the listing may not be active.

**Login fails** — Verify test account credentials haven't changed. Check that the Sign In modal opens correctly. The script will attempt account creation as fallback.

**"Submitting..." hangs** — Backend may be slow or down. Check Supabase Edge Function logs.

**Modify button not found** — The Modify button requires scrolling down within the expanded proposal card. The script scans all visible buttons by exact text match.

**HostEditingProposal modal not appearing** — After clicking Modify, the modal (.hep-container) should appear within 15 seconds. Check if the proposal status is "Host Review".

**Custom dropdown not working** — The reservation span dropdown is a custom React component (.hep-dropdown). The script clicks to open it, then clicks the target option by text match.

**"Accept Host Terms" not found on guest page** — The button only appears when the proposal status is "Host Counteroffer Submitted / Awaiting Guest Review". Check that the host's counter-offer was successfully submitted.

---

**Last validated:** 2026-02-07 (6/6 backend observer matches, full 5-phase lifecycle including host counter-offer + guest accept)
