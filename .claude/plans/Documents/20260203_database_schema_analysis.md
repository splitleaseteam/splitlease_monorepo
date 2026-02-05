# Split Lease Database Schema Analysis
**Generated**: 2026-02-03
**Project**: splitlease-backend-dev
**Purpose**: Complete FK dependency graph and safe reset strategy

---

## Executive Summary

The Split Lease database has a hybrid architecture with:
- **Bubble.io primary tables** (legacy, synced via sync_queue)
- **Supabase-native tables** (new features)
- **Dual reference system** (auth.users UUID + public.user TEXT _id)

Total tables identified: **30+** across multiple schemas

---

## Table Inventory

### Core Bubble-Synced Tables (Primary)
These are the main data tables synced from Bubble.io:

| Table | PK Type | Purpose | Row Count (Est.) |
|-------|---------|---------|------------------|
| `public.user` | TEXT (_id) | User accounts (Bubble legacy) | ? |
| `public.listing` | UUID/TEXT | Property listings | ? |
| `public.bookings_stays` | TEXT (_id) | Individual stay records | ? |
| `public.bookings_leases` | UUID/TEXT | Lease agreements | ? |
| `public.proposal` | TEXT (_id) | Booking proposals | ? |
| `public.visits` | UUID | Property visits | ? |
| `public.properties` | UUID | Property master data | ? |
| `public.documentssent` | TEXT (_id) | Sent documents | ? |
| `reference_table.zat_features_safetyfeature` | ? | Safety features reference | ? |

### Supabase Native Tables

#### Authentication & User Management
| Table | PK | Purpose |
|-------|-----|---------|
| `auth.users` | UUID | Supabase Auth native users |
| `public.user_archetypes` | UUID | Behavioral archetypes (big_spender, high_flexibility, etc.) |
| `public.admin_audit_log` | UUID | Admin action audit trail |

#### Reviews System
| Table | PK | Purpose |
|-------|-----|---------|
| `review` | TEXT (_id) | Host/guest reviews |
| `review_rating_detail` | TEXT (_id) | Review category ratings |

#### Bidding System (Pattern 4: BS+BS)
| Table | PK | Purpose |
|-------|-----|---------|
| `bidding_sessions` | UUID | Competitive bidding sessions |
| `bidding_participants` | UUID | Session participants |
| `bids` | UUID | Individual bid records |
| `bidding_results` | UUID | Session outcomes |
| `bidding_notifications` | UUID | Bidding notifications |

#### Urgency Pricing (Pattern 2)
| Table | PK | Purpose |
|-------|-----|---------|
| `urgency_pricing_cache` | UUID | Cached pricing calculations |
| `market_demand_multipliers` | UUID | Market demand config |
| `event_multipliers` | UUID | Event-based demand spikes |
| `urgency_pricing_config` | UUID | System pricing config |

#### Personalization (Pattern 1)
| Table | PK | Purpose |
|-------|-----|---------|
| `recommendation_logs` | UUID | Recommendation events |
| `archetype_job_logs` | UUID | Background job tracking |

#### Property Operations
| Table | PK | Purpose |
|-------|-----|---------|
| `qr_codes` | UUID | Property check-in/out QR codes |
| `experience_survey` | UUID | Host feedback surveys |

#### Lease Operations (Pattern 3)
| Table | PK | Purpose |
|-------|-----|---------|
| `lease_nights` | UUID | Individual lease night records |
| `daily_counter` | UUID | Daily agreement number counter |
| `pricing_tier_selection` | ? | Pricing tier selections |

#### Document Management
| Table | PK | Purpose |
|-------|-----|---------|
| `document_change_request` | TEXT (_id) | Document change requests |

#### Sync System
| Table | PK | Purpose |
|-------|-----|---------|
| `sync_queue` | ? | Bubble sync queue (implied from docs) |

---

## Foreign Key Dependency Graph

### Level 1: Root Tables (No dependencies - DELETE FIRST)

```
auth.users                    # Supabase Auth (cascade to many tables)
reference_table.*             # Reference data tables
```

### Level 2: Core User Data (Depends on auth.users)

```
public.user                   # Root user table (Bubble legacy)
  └── user_archetypes         # (FK: auth_user_id, bubble_user_id)
  └── admin_audit_log         # (FK: admin_auth_user_id, admin_bubble_user_id)
  └── recommendation_logs     # (FK: auth_user_id, bubble_user_id)
  └── experience_survey       # (FK: user_id → auth.users)
```

### Level 3: Property & Listing Data

```
public.properties             # Property master data
  └── public.listing          # (FK: property_id)
  └── qr_codes                # (FK: property_id, listing_id, visit_id)

public.listing
  └── review                  # (FK: listing_id)
  └── bids                    # (FK: listing_id - implied)
```

### Level 4: Booking & Stay Data

```
public.bookings_leases        # Lease agreements
  └── lease_nights            # (FK: lease_id)
  └── review                  # (FK: lease_id)
  └── pricing_tier_selection  # (FK: lease_id - implied)

public.bookings_stays
  └── review                  # (FK: stay_id)
```

### Level 5: Proposal & Transaction Data

```
public.proposal
  └── [depends on listing, user]

public.visits
  └── qr_codes                # (FK: visit_id)
```

### Level 6: Review System

```
review
  └── review_rating_detail    # (FK: review_id, ON DELETE CASCADE)
```

### Level 7: Bidding System (Self-contained cluster)

```
bidding_sessions
  └── bidding_participants    # (FK: session_id, ON DELETE CASCADE)
  └── bids                    # (FK: session_id, ON DELETE CASCADE)
  └── bidding_results         # (FK: session_id, ON DELETE CASCADE)
  └── bidding_notifications   # (FK: session_id, ON DELETE CASCADE)
```

### Level 8: Pricing System (Self-contained cluster)

```
urgency_pricing_config        # Config table
  └── urgency_pricing_cache   # (No FK to config, but data dependency)
  └── market_demand_multipliers
  └── event_multipliers
```

### Level 9: Document Management

```
public.documentssent
  └── document_change_request # (FK: document_id, user_id)
```

### Level 10: Logging & Metadata

```
archetype_job_logs            # No FK dependencies
daily_counter                 # No FK dependencies
sync_queue                    # No FK dependencies
```

---

## Safe Deletion Order (Bottom-Up)

```
ROUND 1: Child tables with CASCADE dependencies
------------------------------------------------
1. review_rating_detail       # → review (CASCADE)
2. bidding_participants       # → bidding_sessions (CASCADE)
3. bids                       # → bidding_sessions (CASCADE)
4. bidding_results            # → bidding_sessions (CASCADE)
5. bidding_notifications      # → bidding_sessions (CASCADE)

ROUND 2: Transactional data
------------------------------------------------
6. document_change_request    # → documentssent, user
7. qr_codes                   # → properties, listings, visits
8. review                     # → bookings_stays, bookings_leases, user, listing

ROUND 3: Booking & Lease data
------------------------------------------------
9. lease_nights               # → bookings_leases
10. pricing_tier_selection    # → bookings_leases
11. bookings_stays            # → (may have user FK)
12. bookings_leases           # → (may have user FK)

ROUND 4: Bidding & Pricing (after CASCADE cleanup)
------------------------------------------------
13. urgency_pricing_cache
14. market_demand_multipliers
15. event_multipliers
16. bidding_sessions

ROUND 5: Proposal & Property data
------------------------------------------------
17. proposal
18. visits
19. listing
20. properties

ROUND 6: User-related tables
------------------------------------------------
21. recommendation_logs       # → user, auth.users
22. admin_audit_log           # → user, auth.users
23. user_archetypes           # → user, auth.users
24. experience_survey         # → auth.users

ROUND 7: Core documents & users
------------------------------------------------
25. documentssent
26. user

ROUND 8: Configuration & Logging
------------------------------------------------
27. urgency_pricing_config
28. daily_counter
29. archetype_job_logs
30. sync_queue

ROUND 9: Reference data
------------------------------------------------
31. reference_table.*

ROUND 10: Auth (DELETE LAST)
------------------------------------------------
32. auth.users                # Always last - cascade will clean up remaining
```

---

## Critical FK Relationships

### Dual Reference Pattern
Many tables use BOTH auth.users (UUID) AND public.user (TEXT _id):

```sql
-- Pattern example from user_archetypes
auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE CASCADE,
CHECK ((auth_user_id IS NOT NULL) OR (bubble_user_id IS NOT NULL))
```

**Tables affected:**
- user_archetypes
- admin_audit_log
- recommendation_logs

**Deletion implication**: Must delete from user_archetypes, admin_audit_log, recommendation_logs BEFORE deleting from auth.users OR public.user

### Review System FK Chain
```
bookings_stays / bookings_leases
  └── review (_id TEXT)
    └── review_rating_detail (review_id TEXT, ON DELETE CASCADE)
```

### Bidding System Self-Contained
The bidding system has CASCADE on session_id:
```
bidding_sessions
  ├── bidding_participants (ON DELETE CASCADE)
  ├── bids (ON DELETE CASCADE)
  ├── bidding_results (ON DELETE CASCADE)
  └── bidding_notifications (ON DELETE CASCADE)
```

**Implication**: DELETE FROM bidding_sessions will cascade to all 4 child tables automatically.

---

## Test Data Isolation Strategy

### Option 1: Date-Based Isolation (Recommended)
Tag test data with created_at date ranges:

```sql
-- Delete test data from specific date range
DELETE FROM table_name WHERE created_at >= '2026-01-01'::timestamptz;
```

### Option 2: Environment Flag
Add `is_test_data` boolean column to key tables:

```sql
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
DELETE FROM table_name WHERE is_test_data = TRUE;
```

### Option 3: User Email Domain
Target test users by email domain:

```sql
DELETE FROM public.user WHERE email LIKE '%@test.example.com';
```

### Option 4: UUID Prefix (for Supabase-native tables)
Use specific UUID prefixes for test data:

```sql
-- Test data UUIDs start with specific prefix
DELETE FROM table_name WHERE id::text LIKE 'test%';
```

---

## Important Constraints & Triggers

### RLS (Row Level Security)
Most tables have RLS enabled with:
- Service role full access
- User-specific SELECT policies
- User-specific INSERT policies

**Reset implication**: Use service_role key for reset operations to bypass RLS.

### Triggers
- `update_updated_at_column()`: Auto-updates updated_at timestamp
- `increment_daily_counter()`: Atomic counter increment
- Various custom triggers for archetype updates

**Reset implication**: Triggers will fire during DELETE operations (minimal impact).

### Cascade Rules
| Table | FK Action | Behavior on Delete |
|-------|-----------|-------------------|
| review_rating_detail | CASCADE | Auto-deletes when review deleted |
| bidding_participants | CASCADE | Auto-deletes when session deleted |
| bids | CASCADE | Auto-deletes when session deleted |
| bidding_results | CASCADE | Auto-deletes when session deleted |
| bidding_notifications | CASCADE | Auto-deletes when session deleted |
| user_archetypes | CASCADE | Deletes when auth.users OR user deleted |
| experience_survey | CASCADE | Deletes when auth.users deleted |

---

## Known Tables Without Direct Migrations

The following tables are referenced but not in analyzed migrations (likely in Bubble or earlier migrations):

- `sync_queue` - Mentioned in documentation
- `public.inquiries` - Referenced in docs
- `public.photos` - Referenced in docs
- `public.referrals` - Referenced in docs
- `public.host_account` - Referenced in auth handler
- `public.guest_account` - Referenced in auth handler

**Action needed**: Run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` to get complete table list.

---

## Recommendations

1. **For local development**: Use date-based deletion (most flexible)
2. **For production**: Never run reset scripts - use dev environment
3. **For testing**: Create test isolation flag columns before adding data
4. **For safety**: Always wrap DELETEs in transactions with ROLLBACK option
5. **For monitoring**: Log row counts before/after reset operations

---

## Next Steps

1. Run full table inventory against actual database
2. Verify all FK relationships using information_schema
3. Create executable reset script with transaction safety
4. Add test data isolation columns for future testing
5. Document any tables not covered in this analysis

---

**END OF ANALYSIS**
