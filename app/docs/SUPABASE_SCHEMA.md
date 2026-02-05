# Supabase Schema Reference

**Database:** splitlease-backend-dev (qzsmhgyojmwvtjmnrdea)
**Generated:** 2026-02-05

---

## Table Names (Case-Sensitive)

| Logical Name | Actual Table Name | Notes |
|--------------|-------------------|-------|
| Users | `user` | Lowercase, no 's' |
| Listings | `listing` | Lowercase |
| Bookings/Leases | `bookings_leases` | |
| Stays | `bookings_stays` | |
| Date Change Requests | `datechangerequest` | No underscores |
| Visits | `visit` | |
| Virtual Meetings | `virtualmeetingschedulesandlinks` | |
| Proposals | `proposal` | |
| Threads | `thread` | |
| Messages | `_message` | Underscore prefix |

---

## Core Tables

### `user`

Primary user table.

| Column | Type | Notes |
|--------|------|-------|
| `_id` | text | Primary key (Bubble format) |
| `email` | text | Unique, lowercase |
| `Name - Full` | text | |
| `Name - First` | text | |
| `Type - User Current` | text | "A Guest..." or "A Host..." |
| `Leases` | jsonb | Array of lease IDs |
| `Proposals List` | jsonb | Array of proposal IDs |
| `Favorited Listings` | jsonb | Array of listing IDs |

### `bookings_leases`

Lease/booking agreements.

| Column | Type | Notes |
|--------|------|-------|
| `_id` | text | Primary key |
| `Guest` | text | FK to user._id (implicit) |
| `Host` | text | FK to user._id (implicit) |
| `Listing` | text | FK to listing._id |
| `Proposal` | text | FK to proposal._id |
| `Lease Type` | text | `guest_host` or `co_tenant` |
| `Lease Status` | text | Active, Drafting, etc. |
| `Reservation Period : Start` | text | Date string |
| `Reservation Period : End` | text | Date string |
| `List of Booked Dates` | jsonb | Array of date strings |
| `Created Date` | timestamptz | |

**FK Constraints (Enforced):**
- `Cancellation Policy` → `zat_features_cancellationpolicy._id`
- `Created By` → `user._id`
- `Listing` → `listing._id`
- `Proposal` → `proposal._id`

**Note:** `Guest` and `Host` have NO FK constraints (implicit relationships).

### `bookings_stays`

Individual stay periods within a lease.

| Column | Type | Notes |
|--------|------|-------|
| `_id` | text | Primary key |
| `Lease` | text | FK to bookings_leases._id (implicit) |
| `Guest` | text | User occupying this stay |
| `Host` | text | Other party |
| `Week Number` | integer | 1, 2, 3, etc. |
| `Check In (night)` | text | Date string |
| `Last Night (night)` | text | Date string |
| `Dates - List of dates in this period` | jsonb | Array of dates |
| `Stay Status` | text | Upcoming, Completed, etc. |
| `Created Date` | timestamptz | |
| `Modified Date` | timestamptz | |

### `datechangerequest`

Date swap/add/remove requests.

| Column | Type | Notes |
|--------|------|-------|
| `_id` | text | Primary key |
| `Lease` | text | FK to bookings_leases._id |
| `Requested by` | text | FK to user._id |
| `Request receiver` | text | FK to user._id |
| `type of request` | text | `adding`, `removing`, `swapping` |
| `request status` | text | `Waiting for answer`, `Accepted`, `Rejected`, `Expired` |
| `LIST of OLD Dates in the stay` | jsonb | Array of dates |
| `LIST of NEW Dates in the stay` | jsonb | Array of dates (for swaps) |
| `visible to the guest?` | boolean | NOT NULL |
| `visible to the host?` | boolean | NOT NULL |
| `Created Date` | timestamptz | |
| `Modified Date` | timestamptz | |

---

## Sample Queries

### Get user by email
```sql
SELECT * FROM "user" WHERE email = 'example@test.com';
```

### Get all leases for a user
```sql
SELECT * FROM bookings_leases
WHERE "Guest" = 'USER_ID' OR "Host" = 'USER_ID';
```

### Get stays for a lease
```sql
SELECT * FROM bookings_stays
WHERE "Lease" = 'LEASE_ID'
ORDER BY "Week Number";
```

### Get co-tenant leases
```sql
SELECT * FROM bookings_leases
WHERE "Lease Type" = 'co_tenant';
```

### Get pending date change requests
```sql
SELECT * FROM datechangerequest
WHERE "Lease" = 'LEASE_ID'
AND "request status" = 'Waiting for answer';
```

### Get user's stays (as guest)
```sql
SELECT s.*, l."Lease Type"
FROM bookings_stays s
JOIN bookings_leases l ON l._id = s."Lease"
WHERE s."Guest" = 'USER_ID';
```

---

## RLS Policies

**Current Status:** RLS is DISABLED on all tables.

| Table | RLS Enabled | Policies |
|-------|-------------|----------|
| bookings_leases | No | None |
| bookings_stays | No | None |
| datechangerequest | No | None |

---

## Test Accounts

| Email | Password | User ID | Type |
|-------|----------|---------|------|
| `splitleasetesting@test.com` | `eCom2019!` | `1764981388058x38544543907239472` | Guest |
| `terrencegrey@test.com` | `eCom2019!` | `1767918595624x88062023316464928` | Guest |
| `rodtesthost@test.com` | `eCom2019!` | `1767619952046x10779905251473832` | Host |

---

## Test Data

### Co-Tenant Leases
| Lease ID | Stays | Status |
|----------|-------|--------|
| `cotenant-lease-001` | 8 | Active |
| `cotenant-lease-002` | 6 | Active |
| `cotenant-lease-003` | 0 | Active (edge case) |

### Guest-Host Leases
| Lease ID | Guest | Host |
|----------|-------|------|
| `1770140471897x86659205494417792` | splitleasetesting@test.com | rodtesthost@test.com |

---

## Data Quality Notes

- **344 orphaned stays** exist (reference non-existent leases)
- **0 invalid user references** in stays
- Guest/Host columns are populated for 99.8%+ of stays
- `Lease Type` column added and populated for all 206 leases

---

## Column Name Gotchas

| Common Mistake | Correct Column |
|----------------|----------------|
| `User` | `Guest` or `Host` |
| `Status` | `Lease Status` or `Stay Status` or `request status` |
| `Request Type` | `type of request` |
| `Start Date` | `Reservation Period : Start` |
| `End Date` | `Reservation Period : End` |
| `Stay Date` | `Check In (night)` |

**Note:** Many columns have spaces and special characters. Always use double quotes: `"Column Name"`

---

**Last Updated:** 2026-02-05
