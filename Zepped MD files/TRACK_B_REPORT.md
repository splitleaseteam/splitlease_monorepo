# Iteration 22 Track B Report

## Pass 22.B.1: Bundle Isolation
### Findings
- Code Splitting Strategy: Multi-page entrypoints via `buildRollupInputs` in `app/vite.config.js` with Vite automatic splitting (no `manualChunks`).
- Risk: Low that internal tools bloat `/` or `/search`; each HTML entry has its own JS entrypoint, with shared vendor chunks only if modules are shared.
- Recommendation: Keep internal pages as distinct entrypoints; if internal-only dependencies start appearing in shared chunks, re-introduce `manualChunks` with dependency analysis or isolate internal bundles by entrypoint naming.

## Pass 22.B.2: Edge Function Security Config
### JWT Verification Audit
Note: only `supabase/config.toml` exists; no per-function `config.toml` files under `supabase/functions/*`.

| Function | verify_jwt | Used By | Risk |
| --- | --- | --- | --- |
| send-email | false | `/_internal-test`, `/_email-sms-unit` | High (public function) |
| send-sms | false | `/_internal-test`, `/_email-sms-unit` | High (public function) |
| messages | false | `/_admin-threads` | High (admin data access) |
| virtual-meeting | false | `/_manage-virtual-meetings` | High (admin tool) |
| message-curation | false | `/_message-curation` | High (admin tool) |
| proposal | false | `/_create-suggested-proposal` | High (admin tool) |
| ai-gateway | false | `/_create-suggested-proposal` | High (admin tool) |
| verify-users | not listed in config | `/_verify-users` | Unknown (config mismatch) |
| co-host-requests | not listed in config (closest: `cohost-request`) | `/_co-host-requests` | Unknown (name mismatch) |
| simulation-admin | not listed in config | `/_simulation-admin` | Unknown (config mismatch) |
| informational-texts | not listed in config | `/_manage-informational-texts` | Unknown (config mismatch) |
| pricing-admin | not listed in config (closest: `pricing`) | `/_quick-price` | Unknown (config mismatch) |
| leases-admin | not listed in config | `/_leases-overview` | Unknown (config mismatch) |
| magic-login-links | not listed in config | `/_send-magic-login-links` | Unknown (config mismatch) |
| rental-applications | not listed in config (closest: `rental-application`) | `/_manage-rental-applications` | Unknown (config mismatch) |
| document | not listed in config | `/_create-document` | Unknown (config mismatch) |

## Pass 22.B.3: Clean Up
### Orphaned Files
- `app/public/referral-invite.html`
- `app/public/logged-in-avatar-demo.html`
- `app/public/listing-card-demo.html`
- `app/public/listing-card-f.html`
- `app/src/islands/pages/ViewSplitLeasePage_LEGACY` (no corresponding route in `app/src/routes.config.js`)

### Broken Routes
- `/favorite-listings-v2` (route exists but HTML/JSX noted missing; devOnly route)

### Internal Pages Check
- All 24 internal routes have matching HTML files in `app/public`.
