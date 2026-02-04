# Foreign Key Dependency Graph - Visual Reference

**Split Lease Database - splitlease-backend-dev**
**Generated**: 2026-02-03

---

## Legend

```
[A] → [B]    = A references B (A has FK to B)
[A] ⇒ [B]    = A references B with ON DELETE CASCADE
[A] ⋸ [B]    = A and B have circular reference (rare)
[ROOT]       = No dependencies (safe to delete first)
[LEAF]       = No dependents (safe to delete last)
```

---

## Complete Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ROOT TABLES (Level 1)                          │
│                   Delete LAST (or let CASCADE handle)                      │
└─────────────────────────────────────────────────────────────────────────────┘

    auth.users (UUID)                     reference_table.*
         │                                         │
         │                                         │
         └─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            LEVEL 2: User Data                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  public.user (_id TEXT) ──────────────────────────────────────────────┐    │
│     │                                                                   │    │
│     ├── user_archetypes (auth_user_id UUID, bubble_user_id TEXT)       │    │
│     │    └── [override_by_auth_user_id, override_by_bubble_user_id]    │    │
│     │                                                                   │    │
│     ├── admin_audit_log (admin_auth_user_id, admin_bubble_user_id)     │    │
│     │    └── [target_auth_user_id, target_bubble_user_id]              │    │
│     │                                                                   │    │
│     ├── recommendation_logs (auth_user_id, bubble_user_id)             │    │
│     │    └── [roommate_auth_user_id, roommate_bubble_user_id]          │    │
│     │                                                                   │    │
│     └── experience_survey (user_id → auth.users)                       │    │
│         └── [via auth.users CASCADE]                                   │    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LEVEL 3: Property Data                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  public.properties (UUID)                                                  │
│     │                                                                       │
│     ├── public.listing (property_id)                                       │
│     │    │                                                                 │
│     │    └── [used by: review, proposals, etc.]                           │
│     │                                                                       │
│     └── qr_codes (property_id, listing_id, visit_id)                       │
│          └── [visit_id → visits]                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LEVEL 4: Booking Data                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  bookings_leases (UUID/TEXT)                                               │
│     │                                                                       │
│     ├── lease_nights (lease_id)                                            │
│     │    └── [pricing_tier_selection → lease_id]                          │
│     │                                                                       │
│     └── review (lease_id)                                                  │
│          └── [reviewee_id, reviewer_id → user]                            │
│                                                                             │
│  bookings_stays (_id TEXT)                                                 │
│     │                                                                       │
│     └── review (stay_id)                                                   │
│          └── [review_by_host_id, review_by_guest_id → review]              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LEVEL 5: Review System                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  review (_id TEXT)                                                          │
│     │                                                                       │
│     ├── review_rating_detail (review_id) ⇒ [CASCADE]                       │
│     │    └── [auto-deletes when review deleted]                            │
│     │                                                                       │
│     ├── [stay_id → bookings_stays]                                         │
│     ├── [lease_id → bookings_leases]                                       │
│     ├── [listing_id → listing]                                             │
│     ├── [reviewer_id → user]                                               │
│     └── [reviewee_id → user]                                               │
│                                                                             │
│  bookings_stays                                                             │
│     └── [review_by_host_id, review_by_guest_id → review]                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LEVEL 6: Bidding System (Self-Contained)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  bidding_sessions (UUID) ──────────────────────────────────────────────┐    │
│     │                                                                   │    │
│     ├── bidding_participants (session_id) ⇒ [CASCADE]                   │    │
│     │    └── [user_id, user_name, user_archetype]                      │    │
│     │                                                                   │    │
│     ├── bids (session_id) ⇒ [CASCADE]                                   │    │
│     │    └── [user_id, amount, round_number]                            │    │
│     │                                                                   │    │
│     ├── bidding_results (session_id) ⇒ [CASCADE]                        │    │
│     │    └── [winner_user_id, loser_user_id]                            │    │
│     │                                                                   │    │
│     └── bidding_notifications (session_id) ⇒ [CASCADE]                  │    │
│          └── [user_id, notification_type]                               │    │
│                                                                             │
│  All child tables auto-delete when bidding_sessions is deleted            │
│  due to ON DELETE CASCADE                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LEVEL 7: Document Management                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  documentssent (_id TEXT)                                                  │
│     │                                                                       │
│     └── document_change_request (document_id, user_id)                     │
│          └── [user_id → user]                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LEVEL 8: Pricing & Urgency (Independent)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  urgency_pricing_config (UUID) ──┐                                         │
│                                  │ [No FK, config data]                    │
│  urgency_pricing_cache ◄─────────┘                                         │
│  market_demand_multipliers                                               │
│  event_multipliers                                                       │
│                                                                             │
│  These tables are mostly independent with no FK dependencies               │
│  Delete in any order after dependent tables are cleared                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LEVEL 9: Logging & Metadata                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  daily_counter (UUID)          [No dependencies]                           │
│  archetype_job_logs (UUID)     [No dependencies]                           │
│  sync_queue (?)                [No dependencies]                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Simplified Deletion Order

```
DELETE FROM THIS ──────────────► BEFORE DELETING FROM THIS
═══════════════════════════════════════════════════════════════════════════════

Round 1: Child Tables (CASCADE)
════════════════════════════════
review_rating_detail           → review
  [auto-deleted, but listed for clarity]

Round 2: Transactional Data
════════════════════════════════
document_change_request        → documentssent, user
qr_codes                       → properties, listings, visits, user
review                         → bookings_stays, bookings_leases, user, listing

Round 3: Booking & Lease Data
════════════════════════════════
lease_nights                   → bookings_leases
pricing_tier_selection         → bookings_leases
bookings_stays                 → user (potentially)
bookings_leases                → user (potentially)

Round 4: Bidding & Pricing
════════════════════════════════
urgency_pricing_cache          → [no FK]
market_demand_multipliers      → [no FK]
event_multipliers              → [no FK]
bidding_sessions               → [CASCADE to 4 children]

Round 5: Proposal & Property
════════════════════════════════
proposal                       → listing, user
visits                         → [no FK or minimal]
listing                        → properties
properties                     → [no FK]

Round 6: User-Related Tables
════════════════════════════════
recommendation_logs            → user, auth.users
admin_audit_log                → user, auth.users
user_archetypes                → user, auth.users
experience_survey              → auth.users

Round 7: Core Data
════════════════════════════════
documentssent                  → [no FK]
user                           → [no FK, but referenced by many]

Round 8: Configuration
════════════════════════════════
urgency_pricing_config         → [no FK]
daily_counter                  → [no FK]
archetype_job_logs             → [no FK]
sync_queue                     → [no FK]

Round 9: Reference Data
════════════════════════════════
reference_table.*              → [never delete]

Round 10: Auth (DELETE LAST)
════════════════════════════════
auth.users                     → [CASCADE to many tables]
```

---

## Critical Paths

### Path 1: User Cascade (Most Dangerous)
```
auth.users (CASCADE) →
  ├── user_archetypes
  ├── experience_survey
  └── [other tables with auth_user_id]

Deleting auth.users will CASCADE to all tables referencing it.
USE WITH EXTREME CAUTION.
```

### Path 2: Review Chain
```
bookings_stays/bookings_leases
  └── review
      └── review_rating_detail (CASCADE)

Delete order: review_rating_detail (auto) → review → stays/leases
```

### Path 3: Bidding Cluster (Self-Contained)
```
bidding_sessions (CASCADE to all)
  ├── bidding_participants
  ├── bids
  ├── bidding_results
  └── bidding_notifications

Delete only: bidding_sessions (children auto-delete via CASCADE)
```

### Path 4: User Dual Reference Pattern
```
Tables with BOTH auth.users AND public.user references:
  ├── user_archetypes (auth_user_id OR bubble_user_id)
  ├── admin_audit_log (admin_auth_user_id OR admin_bubble_user_id)
  └── recommendation_logs (auth_user_id OR bubble_user_id)

Must delete from these BEFORE deleting from user OR auth.users
```

---

## FK Reference Summary

### References to auth.users (UUID)
| Table | FK Column | Action |
|-------|-----------|--------|
| user_archetypes | auth_user_id | CASCADE |
| admin_audit_log | admin_auth_user_id | CASCADE |
| admin_audit_log | target_auth_user_id | SET NULL |
| recommendation_logs | auth_user_id | CASCADE |
| recommendation_logs | roommate_auth_user_id | none |
| experience_survey | user_id | CASCADE |

### References to public.user (TEXT _id)
| Table | FK Column | Action |
|-------|-----------|--------|
| user_archetypes | bubble_user_id | CASCADE |
| admin_audit_log | admin_bubble_user_id | CASCADE |
| admin_audit_log | target_bubble_user_id | SET NULL |
| recommendation_logs | bubble_user_id | CASCADE |
| recommendation_logs | roommate_bubble_user_id | none |
| review | reviewer_id | none |
| review | reviewee_id | none |
| document_change_request | user_id | CASCADE |
| [many others] | user_id | varies |

### CASCADE Relationships (Auto-Delete)
| Parent | Child | Action |
|--------|-------|--------|
| review | review_rating_detail | DELETE parent CASCADEs to child |
| bidding_sessions | bidding_participants | DELETE parent CASCADEs to child |
| bidding_sessions | bids | DELETE parent CASCADEs to child |
| bidding_sessions | bidding_results | DELETE parent CASCADES to child |
| bidding_sessions | bidding_notifications | DELETE parent CASCADEs to child |
| auth.users | user_archetypes | DELETE parent CASCADEs to child |
| auth.users | experience_survey | DELETE parent CASCADEs to child |

---

## Quick Reference Tables

### Tables with NO FK Dependencies (Safe to delete first)
- daily_counter
- archetype_job_logs
- sync_queue
- urgency_pricing_config
- market_demand_multipliers
- event_multipliers
- urgency_pricing_cache
- reference_table.*

### Tables referenced by MANY others (Delete LAST)
- auth.users (referenced by 10+ tables)
- public.user (referenced by 20+ tables)
- public.listing
- public.properties

### Self-Contained Clusters (Can delete independently)
- Bidding system: {bidding_sessions, bidding_participants, bids, bidding_results, bidding_notifications}
- Pricing system: {urgency_pricing_cache, market_demand_multipliers, event_multipliers, urgency_pricing_config}

---

## Visual Deletion Order (ASCII Art)

```
                    ┌─────────────────────┐
                    │   START DELETE      │
                    └──────────┬──────────┘
                               │
                               ▼
              ┌───────────────────────────────┐
              │  Round 1: CASCADE Children   │
              │  (review_rating_detail)       │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Round 2: Transactional      │
              │  (qr_codes, review,           │
              │   document_change_request)    │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Round 3: Bookings & Leases  │
              │  (lease_nights, stays)       │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Round 4: Bidding & Pricing  │
              │  (bidding_sessions, cache)   │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Round 5: Properties         │
              │  (listing, properties)       │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Round 6: User Data          │
              │  (archetypes, logs, surveys) │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Round 7: Core Data          │
              │  (user, documents)           │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Round 8: Config & Logs      │
              │  (counters, job_logs)        │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Round 9: Reference Data     │
              │  (SKIP - never delete)       │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Round 10: Auth Users        │
              │  (SKIP or use Dashboard)     │
              └───────────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   DELETE COMPLETE   │
                    └─────────────────────┘
```

---

**END OF DEPENDENCY GRAPH**
