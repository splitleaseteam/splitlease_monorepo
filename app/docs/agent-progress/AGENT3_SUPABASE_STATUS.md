# Agent 3 Supabase Status

## Table Verification

| Expected | Actual Name | Exists | Notes |
|----------|-------------|--------|-------|
| User | `user` | Yes | Lowercase (not `User`) |
| Listing | `listing` | Yes | Lowercase |
| bookings_leases | `bookings_leases` | Yes | |
| bookings_stays | `bookings_stays` | Yes | |
| date_change_requests | `datechangerequest` | Yes | Different name (no underscores) |
| visit | `visit` | Yes | |
| virtualmeetingschedulesandlinks | `virtualmeetingschedulesandlinks` | Yes | |

**Root Cause of Frontend Errors:**
- 404s: Case sensitivity (`User` vs `user`, `Listing` vs `listing`)
- 400s: Query format issues on `visit` and `virtualmeetingschedulesandlinks`

---

## FK Relationships on bookings_leases

| Column | References Table |
|--------|------------------|
| Cancellation Policy | zat_features_cancellationpolicy |
| Created By | user |
| Listing | listing |
| Proposal | proposal |

**Note:** `Guest` and `Host` columns have NO FK constraints (implicit relationships only).

---

## Test Accounts

### Guest-Host Lease (Best for testing)
- **Lease ID:** `1770140471897x86659205494417792`
- **Type:** guest_host
- **Status:** Drafting
- **Guest Email:** `splitleasetesting@test.com`
- **Host Email:** `rodtesthost@test.com`
- **Password:** `eCom2019!`

**URLs to test:**
- `/guest-leases` (login as guest)
- `/host-leases` (login as host)
- `/schedule/1770140471897x86659205494417792`

---

### Co-Tenant Leases (Created for testing)

| Lease ID | Type | Status | User A Stays | User B Stays |
|----------|------|--------|--------------|--------------|
| `cotenant-lease-001` | co_tenant | Active | 2 | 2 |
| `cotenant-lease-002` | co_tenant | Active | 3 | 3 |
| `cotenant-lease-003` | co_tenant | Active | 0 | 0 (edge case) |

**User A:**
- Email: `splitleasetesting@test.com`
- Password: `eCom2019!`
- User ID: `1764981388058x38544543907239472`

**User B:**
- Email: `terrencegrey@test.com`
- Password: `eCom2019!`
- User ID: `1767918595624x88062023316464928`

**URLs to test:**
- `/guest-leases` (login as either user)
- `/schedule/cotenant-lease-001`
- `/schedule/cotenant-lease-002`
- `/schedule/cotenant-lease-003`

---

## Data Quality Summary

### bookings_leases
- Total: 206 leases (203 guest_host + 3 co_tenant)
- Lease Type column: Added and populated

### bookings_stays
- Total: 17,709 stays
- Guest assigned: 99.8%
- Host assigned: 100%
- 10 new co-tenant stays created

### datechangerequest
- Total: 99 records
- Types: adding (32), removing (40), swapping (27)
- RLS: Disabled

---

## Pages to Test

1. `/guest-leases` - Login as guest email
2. `/host-leases` - Login as host email
3. `/schedule/{lease_id}` - Click "Manage Schedule" button

---

**Generated:** 2026-02-05
**Status:** Complete
