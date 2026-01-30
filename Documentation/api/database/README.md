# Database Schema Reference

Complete database schema documentation for the Split Lease platform, including all tables, relationships, indexes, and RLS policies.

---

## Overview

Split Lease uses Supabase (PostgreSQL) as its primary database with Row Level Security (RLS) enabled for data access control.

### Architecture

```
PostgreSQL (Supabase)
├── public schema (application tables)
├── auth schema (Supabase Auth users)
├── storage schema (file storage)
└── extensions (pg_cron, etc.)
```

### Key Patterns

- **Primary Keys**: `_id` TEXT (Bubble-compatible IDs) or `id` UUID (native tables)
- **Timestamps**: `TIMESTAMPTZ` for all time fields (UTC)
- **Soft Deletes**: `deleted_at` column (nullable)
- **Audit Trail**: `created_at`, `updated_at` on all tables
- **Bubble Sync**: `bubble_id`, `sync_status`, `bubble_sync_error` columns

---

## Core Tables

### user

**Description**: Core user account table combining host and guest profiles.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key (Bubble-compatible ID) |
| `email` | TEXT | No | User email address |
| `first_name` | TEXT | Yes | First name |
| `last_name` | TEXT | Yes | Last name |
| `full_name` | TEXT | Yes | Full name (computed) |
| `user_type` | TEXT | No | 'Host' or 'Guest' |
| `profile_photo` | TEXT | Yes | Profile photo URL |
| `phone_number` | TEXT | Yes | Phone number |
| `birth_date` | DATE | Yes | Date of birth |
| `about_me` | TEXT | Yes | User bio/description |
| `need_for_space` | TEXT | Yes | Why user needs space |
| `special_needs` | TEXT | Yes | Special requirements |
| `is_usability_tester` | BOOLEAN | No | Usability testing participant |
| `has_submitted_rental_app` | BOOLEAN | No | Rental application submitted |
| `identity_document_type` | TEXT | Yes | ID document type |
| `selfie_url` | TEXT | Yes | Identity selfie URL |
| `front_id_url` | TEXT | Yes | Front of ID URL |
| `back_id_url` | TEXT | Yes | Back of ID URL |
| `identity_verified` | BOOLEAN | No | Identity verification status |
| `identity_submitted_at` | TIMESTAMPTZ | Yes | Identity submission timestamp |
| `identity_verified_at` | TIMESTAMPTZ | Yes | Identity verification timestamp |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |
| `bubble_id` | TEXT | Yes | Bubble.io object ID |
| `sync_status` | TEXT | No | Sync status (pending/synced/failed) |
| `bubble_sync_error` | TEXT | Yes | Sync error message |

**Indexes**:
- `idx_user_email` on `email`
- `idx_user_identity_submitted_pending` on `identity_submitted_at` WHERE `identity_submitted_at IS NOT NULL AND identity_verified = FALSE`

**Relationships**:
- One-to-many with `listing` (hosts)
- One-to-many with `proposal` (guests)
- One-to-many with `review` (reviewer and reviewee)

**RLS Policies**:
- Users can read their own profile
- Users can update their own profile
- Public read access for profile photos (via view)

---

### listing

**Description**: Property listings created by hosts.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key |
| `host_account_id` | TEXT | No | Foreign key to user._id |
| `title` | TEXT | Yes | Listing title |
| `description` | TEXT | Yes | Listing description |
| `building_name` | TEXT | Yes | Building name |
| `street_address` | TEXT | Yes | Street address |
| `city` | TEXT | Yes | City |
| `state` | TEXT | Yes | State |
| `zip_code` | TEXT | Yes | ZIP code |
| `borough_id` | TEXT | Yes | Foreign key to borough |
| `neighborhood_id` | TEXT | Yes | Foreign key to neighborhood |
| `latitude` | NUMERIC | Yes | Latitude |
| `longitude` | NUMERIC | Yes | Longitude |
| `pricing_list_id` | TEXT | Yes | Foreign key to pricing_list |
| `base_nightly_rate` | NUMERIC | Yes | Base nightly rate |
| `base_weekly_rate` | NUMERIC | Yes | Base weekly rate |
| `base_four_week_rate` | NUMERIC | Yes | Base 4-week rate |
| `available_days` | TEXT[] | Yes | Available days [0-6] |
| `blocked_dates` | TEXT[] | Yes | Blocked dates array |
| `amenities` | TEXT[] | Yes | Amenity IDs |
| `photos` | TEXT[] | Yes | Photo URLs |
| `status` | TEXT | No | Listing status |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |
| `bubble_id` | TEXT | Yes | Bubble.io object ID |
| `sync_status` | TEXT | No | Sync status |
| `bubble_sync_error` | TEXT | Yes | Sync error message |

**Indexes**:
- `idx_listing_host_account_id` on `host_account_id`
- `idx_listing_location` on `(latitude, longitude)`
- `idx_listing_status` on `status`
- `idx_listing_pricing_list` on `pricing_list_id`

**Relationships**:
- Many-to-one with `user` (host)
- One-to-many with `proposal`
- One-to-many with `review`
- One-to-one with `pricing_list`

---

### proposal

**Description**: Booking proposals from guests to hosts.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key |
| `listing_id` | TEXT | No | Foreign key to listing._id |
| `guest_account_id` | TEXT | No | Foreign key to user._id |
| `host_account_id` | TEXT | No | Foreign key to user._id |
| `check_in_date` | DATE | No | Check-in date |
| `check_out_date` | DATE | No | Check-out date |
| `selected_days` | TEXT[] | No | Selected days [0-6] |
| `nightly_rate` | NUMERIC | No | Calculated nightly rate |
| `weekly_rate` | NUMERIC | Yes | Calculated weekly rate |
| `four_week_rate` | NUMERIC | Yes | Calculated 4-week rate |
| `total_rent` | NUMERIC | No | Total rent |
| `service_fee` | NUMERIC | No | Service fee |
| `total` | NUMERIC | No | Total amount |
| `status` | TEXT | No | Proposal status |
| `guest_message` | TEXT | Yes | Guest message to host |
| `host_message` | TEXT | Yes | Host message to guest |
| `rental_application_id` | TEXT | Yes | Foreign key to rental_application |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |
| `bubble_id` | TEXT | Yes | Bubble.io object ID |
| `sync_status` | TEXT | No | Sync status |
| `bubble_sync_error` | TEXT | Yes | Sync error message |

**Indexes**:
- `idx_proposal_listing_id` on `listing_id`
- `idx_proposal_guest_account_id` on `guest_account_id`
- `idx_proposal_host_account_id` on `host_account_id`
- `idx_proposal_status` on `status`
- `idx_proposal_dates` on `(check_in_date, check_out_date)`

**Relationships**:
- Many-to-one with `listing`
- Many-to-one with `user` (guest)
- Many-to-one with `user` (host)
- One-to-one with `rental_application`

**Proposal Status Values**:
- `pending`: Initial state
- `accepted`: Host accepted
- `rejected`: Host rejected
- `expired`: Time limit passed
- `cancelled`: User cancelled
- `counteroffered`: Host sent counteroffer

---

### rental_application

**Description**: Guest rental applications for profile verification.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key |
| `user_id` | TEXT | No | Foreign key to user._id |
| `first_name` | TEXT | No | First name |
| `last_name` | TEXT | No | Last name |
| `email` | TEXT | No | Email address |
| `phone_number` | TEXT | No | Phone number |
| `birth_date` | DATE | No | Date of birth |
| `about_me` | TEXT | Yes | User bio |
| `need_for_space` | TEXT | Yes | Space requirements |
| `special_needs` | TEXT | Yes | Special needs |
| `profile_photo` | TEXT | Yes | Profile photo URL |
| `submitted_at` | TIMESTAMPTZ | No | Submission timestamp |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |
| `bubble_id` | TEXT | Yes | Bubble.io object ID |
| `sync_status` | TEXT | No | Sync status |
| `bubble_sync_error` | TEXT | Yes | Sync error message |

**Indexes**:
- `idx_rental_application_user_id` on `user_id`

**Relationships**:
- Many-to-one with `user`
- One-to-many with `proposal`

---

## Messaging Tables

### messages

**Description**: Real-time messages between users.

**Primary Key**: `id` UUID

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `thread_id` | UUID | No | Thread identifier |
| `sender_id` | TEXT | No | Foreign key to user._id |
| `recipient_id` | TEXT | No | Foreign key to user._id |
| `proposal_id` | TEXT | Yes | Foreign key to proposal._id |
| `message` | TEXT | No | Message content |
| `read_at` | TIMESTAMPTZ | Yes | Read receipt timestamp |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |

**Indexes**:
- `idx_messages_thread_id` on `thread_id`
- `idx_messages_sender_id` on `sender_id`
- `idx_messages_recipient_id` on `recipient_id`
- `idx_messages_proposal_id` on `proposal_id`

**Relationships**:
- Many-to-one with `user` (sender)
- Many-to-one with `user` (recipient)
- Many-to-one with `proposal`

---

## Booking & Lease Tables

### bookings_stays

**Description**: Actual stay records from accepted proposals.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key |
| `proposal_id` | TEXT | No | Foreign key to proposal._id |
| `lease_id` | TEXT | Yes | Foreign key to bookings_leases |
| `guest_id` | TEXT | No | Foreign key to user._id |
| `host_id` | TEXT | No | Foreign key to user._id |
| `listing_id` | TEXT | No | Foreign key to listing._id |
| `check_in_date` | DATE | No | Check-in date |
| `check_out_date` | DATE | No | Check-out date |
| `status` | TEXT | No | Stay status |
| `review_by_host_id` | TEXT | Yes | Foreign key to review |
| `review_by_guest_id` | TEXT | Yes | Foreign key to review |
| `review_by_host_submitted_at` | TIMESTAMPTZ | Yes | Host review timestamp |
| `review_by_guest_submitted_at` | TIMESTAMPTZ | Yes | Guest review timestamp |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

**Indexes**:
- `idx_stays_proposal_id` on `proposal_id`
- `idx_stays_guest_id` on `guest_id`
- `idx_stays_host_id` on `host_id`
- `idx_stays_listing_id` on `listing_id`
- `idx_stays_status` on `status`
- `idx_stays_review_by_host` on `review_by_host_id` WHERE `review_by_host_id IS NOT NULL`
- `idx_stays_review_by_guest` on `review_by_guest_id` WHERE `review_by_guest_id IS NOT NULL`
- `idx_stays_pending_host_review` on `host_id` WHERE `review_by_host_id IS NULL AND status = 'completed'`
- `idx_stays_pending_guest_review` on `guest_id` WHERE `review_by_guest_id IS NULL AND status = 'completed'`

**Relationships**:
- One-to-one with `proposal`
- Many-to-one with `bookings_leases`
- Many-to-one with `user` (guest)
- Many-to-one with `user` (host)
- Many-to-one with `listing`
- One-to-one with `review` (host review)
- One-to-one with `review` (guest review)

---

### bookings_leases

**Description**: Lease agreements for accepted proposals.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key |
| `proposal_id` | TEXT | No | Foreign key to proposal._id |
| `guest_id` | TEXT | No | Foreign key to user._id |
| `host_id` | TEXT | No | Foreign key to user._id |
| `listing_id` | TEXT | No | Foreign key to listing._id |
| `lease_start_date` | DATE | No | Lease start date |
| `lease_end_date` | DATE | No | Lease end date |
| `monthly_rent` | NUMERIC | No | Monthly rent |
| `status` | TEXT | No | Lease status |
| `contract_url` | TEXT | Yes | Contract document URL |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

**Indexes**:
- `idx_leases_proposal_id` on `proposal_id`
- `idx_leases_guest_id` on `guest_id`
- `idx_leases_host_id` on `host_id`
- `idx_leases_listing_id` on `listing_id`
- `idx_leases_status` on `status`

**Relationships**:
- One-to-one with `proposal`
- Many-to-one with `user` (guest)
- Many-to-one with `user` (host)
- Many-to-one with `listing`
- One-to-many with `bookings_stays`

---

## Review Tables

### review

**Description**: Two-way reviews between hosts and guests.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key |
| `stay_id` | TEXT | No | Foreign key to bookings_stays |
| `lease_id` | TEXT | Yes | Foreign key to bookings_leases |
| `reviewer_id` | TEXT | No | Foreign key to user._id |
| `reviewee_id` | TEXT | No | Foreign key to user._id |
| `listing_id` | TEXT | Yes | Foreign key to listing |
| `review_type` | TEXT | No | 'host_reviews_guest' or 'guest_reviews_host' |
| `comment` | TEXT | Yes | Review comment |
| `overall_rating` | NUMERIC(2,1) | Yes | Overall rating 1-5 |
| `would_recommend` | BOOLEAN | Yes | Would recommend |
| `status` | TEXT | No | 'draft', 'published', 'hidden' |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |
| `bubble_id` | TEXT | Yes | Bubble.io object ID |
| `sync_status` | TEXT | No | Sync status |
| `bubble_sync_error` | TEXT | Yes | Sync error message |

**Constraints**:
- `UNIQUE(stay_id, reviewer_id)` - One review per user per stay

**Indexes**:
- `idx_review_reviewer_id` on `reviewer_id`
- `idx_review_reviewee_id` on `reviewee_id`
- `idx_review_stay_id` on `stay_id`
- `idx_review_listing_id` on `listing_id`
- `idx_review_type` on `review_type`
- `idx_review_created_at` on `created_at DESC`
- `idx_review_status` on `status` WHERE `status = 'published'`

**Relationships**:
- Many-to-one with `bookings_stays`
- Many-to-one with `bookings_leases`
- Many-to-one with `user` (reviewer)
- Many-to-one with `user` (reviewee)
- Many-to-one with `listing`
- One-to-many with `review_rating_detail`

**RLS Policies**:
- Users can read reviews they're involved in
- Users can insert reviews for their stays
- Users can update their draft reviews

---

### review_rating_detail

**Description**: Individual category ratings for each review.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key |
| `review_id` | TEXT | No | Foreign key to review._id |
| `category` | TEXT | No | Rating category (e.g., cleanliness) |
| `category_label` | TEXT | No | Display label for category |
| `rating` | SMALLINT | No | Rating 1-5 |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |

**Constraints**:
- `UNIQUE(review_id, category)` - One rating per category per review

**Indexes**:
- `idx_rating_detail_review_id` on `review_id`

**Relationships**:
- Many-to-one with `review`

**Rating Categories**:
- Cleanliness
- Communication
- Check-in
- Accuracy
- Location
- Value

---

## Pricing Tables

### pricing_list

**Description**: Dynamic pricing lists for listings.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key |
| `listing_id` | TEXT | Yes | Foreign key to listing |
| `name` | TEXT | No | Pricing list name |
| `base_nightly_rate` | NUMERIC | No | Base nightly rate |
| `base_weekly_rate` | NUMERIC | Yes | Base weekly rate |
| `base_four_week_rate` | NUMERIC | Yes | Base 4-week rate |
| `scalar_monday` | NUMERIC | Yes | Monday multiplier |
| `scalar_tuesday` | NUMERIC | Yes | Tuesday multiplier |
| `scalar_wednesday` | NUMERIC | Yes | Wednesday multiplier |
| `scalar_thursday` | NUMERIC | Yes | Thursday multiplier |
| `scalar_friday` | NUMERIC | Yes | Friday multiplier |
| `scalar_saturday` | NUMERIC | Yes | Saturday multiplier |
| `scalar_sunday` | NUMERIC | Yes | Sunday multiplier |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

**Indexes**:
- `idx_pricing_list_listing_id` on `listing_id`

**Relationships**:
- One-to-one with `listing`

---

## Utility Tables

### qr_codes

**Description**: QR codes for property check-in/out and information.

**Primary Key**: `id` UUID

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `use_case` | TEXT | No | 'check_in', 'check_out', 'emergency', 'general_info' |
| `display_text` | TEXT | Yes | Human-readable label |
| `information_content` | TEXT | Yes | Custom message |
| `visit_id` | UUID | Yes | Foreign key to visits |
| `listing_id` | UUID | Yes | Foreign key to listings |
| `property_id` | UUID | Yes | Foreign key to properties |
| `host_phone` | TEXT | Yes | Host phone number |
| `guest_phone` | TEXT | Yes | Guest phone number |
| `host_name` | TEXT | Yes | Host name |
| `guest_name` | TEXT | Yes | Guest name |
| `property_name` | TEXT | Yes | Property name |
| `is_active` | BOOLEAN | No | Active status |
| `scan_count` | INTEGER | No | Scan count |
| `last_scanned_at` | TIMESTAMPTZ | Yes | Last scan timestamp |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

**Indexes**:
- `idx_qr_codes_visit_id` on `visit_id`
- `idx_qr_codes_listing_id` on `listing_id`
- `idx_qr_codes_property_id` on `property_id`
- `idx_qr_codes_is_active` on `is_active` WHERE `is_active = true`

**RLS Policies**:
- Public read access for active QR codes
- Authenticated users can create/update/delete

---

### sync_queue

**Description**: Queue for async Bubble.io sync operations.

**Primary Key**: `id` UUID

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `correlation_id` | TEXT | No | Correlation ID for grouping |
| `sequence` | INTEGER | No | Sequence order |
| `table` | TEXT | No | Target table name |
| `record_id` | TEXT | No | Record ID to sync |
| `operation` | TEXT | No | INSERT, UPDATE, DELETE, SIGNUP_ATOMIC |
| `payload` | JSONB | Yes | Data payload |
| `status` | TEXT | No | pending, processing, completed, failed |
| `error_message` | TEXT | Yes | Error message |
| `attempts` | INTEGER | No | Retry attempts |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

**Indexes**:
- `idx_sync_queue_status` on `status`
- `idx_sync_queue_created_at` on `created_at`
- `idx_sync_queue_correlation` on `correlation_id, sequence`

**Usage**: Processed by `bubble_sync` Edge Function every 5 minutes via cron.

---

### experience_survey

**Description**: Experience survey responses from guests and hosts.

**Primary Key**: `id` UUID

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `user_id` | TEXT | No | Foreign key to user |
| `stay_id` | TEXT | Yes | Foreign key to bookings_stays |
| `survey_type` | TEXT | No | Survey type |
| `responses` | JSONB | No | Survey responses |
| `rating` | INTEGER | Yes | Overall rating |
| `feedback` | TEXT | Yes | Feedback text |
| `submitted_at` | TIMESTAMPTZ | No | Submission timestamp |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |

**Indexes**:
- `idx_experience_survey_user_id` on `user_id`
- `idx_experience_survey_stay_id` on `stay_id`

---

## Reference Data Tables

### borough

**Description**: NYC boroughs for location filtering.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key |
| `name` | TEXT | No | Borough name |

**Values**:
- Manhattan
- Brooklyn
- Queens
- Bronx
- Staten Island

---

### neighborhood

**Description**: NYC neighborhoods for location filtering.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key |
| `borough_id` | TEXT | No | Foreign key to borough |
| `name` | TEXT | No | Neighborhood name |

**Relationships**:
- Many-to-one with `borough`

---

### amenities

**Description**: Amenity options for listings.

**Primary Key**: `_id` TEXT

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | TEXT | No | Primary key |
| `name` | TEXT | No | Amenity name |
| `icon` | TEXT | Yes | Icon URL |
| `category` | TEXT | Yes | Amenity category |

**Examples**:
- WiFi
- Kitchen
- Laundry
- Air Conditioning
- Parking

---

## Database Views

### v_listing_details

**Description**: Denormalized view with listing details, pricing, and location.

**Columns**: All listing columns + host name, neighborhood name, borough name, average rating

**Usage**: Search results, listing detail pages

---

### v_user_profile

**Description**: Denormalized view with user profile and stats.

**Columns**: All user columns + proposal count, review count, average rating

**Usage**: Profile pages, user cards

---

### v_proposal_summary

**Description**: Denormalized view with proposal details and related data.

**Columns**: All proposal columns + listing title, guest name, host name

**Usage**: Proposal lists, dashboard

---

## Row Level Security (RLS)

### RLS Enabled Tables

All user-facing tables have RLS enabled:
- `user`
- `listing`
- `proposal`
- `rental_application`
- `messages`
- `bookings_stays`
- `bookings_leases`
- `review`
- `review_rating_detail`
- `qr_codes`

### Common RLS Patterns

**Users can read their own data**:
```sql
CREATE POLICY "Users can read own data"
  ON table_name FOR SELECT
  USING (auth.uid()::text = user_id);
```

**Users can insert their own data**:
```sql
CREATE POLICY "Users can insert own data"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);
```

**Users can update their own data**:
```sql
CREATE POLICY "Users can update own data"
  ON table_name FOR UPDATE
  USING (auth.uid()::text = user_id);
```

**Public read access for some data**:
```sql
CREATE POLICY "Public read access"
  ON table_name FOR SELECT
  TO public
  USING (true);
```

---

## Database Functions

### generate_bubble_id()

**Description**: Generate Bubble-compatible unique ID.

**Returns**: TEXT (17-character alphanumeric)

**Usage**:
```sql
SELECT generate_bubble_id();
-- Returns: 'a1b2c3d4e5f6g7h8i'
```

---

## Triggers

### updated_at Trigger

**Description**: Automatically update `updated_at` column on row modification.

**Tables**: All tables with `updated_at` column

```sql
CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Performance Indexes

### Composite Indexes

- `(latitude, longitude)` on `listing` for location queries
- `(check_in_date, check_out_date)` on `proposal` for date range queries
- `(correlation_id, sequence)` on `sync_queue` for queue processing

### Partial Indexes

- `idx_user_identity_submitted_pending` - Only unverified identity submissions
- `idx_stays_pending_host_review` - Only completed stays without host review
- `idx_stays_pending_guest_review` - Only completed stays without guest review
- `idx_review_status` - Only published reviews
- `idx_qr_codes_is_active` - Only active QR codes

---

## Data Migration

### Bubble Sync Pattern

All Bubble-synced tables follow this pattern:

1. Create in Bubble (source of truth)
2. Fetch from Bubble Data API
3. Insert to Supabase with Bubble metadata

**Sync Columns**:
- `bubble_id` - Bubble object ID
- `sync_status` - pending, synced, failed
- `bubble_sync_error` - Error message if failed

**Sync Queue**:
- `sync_queue` table tracks pending sync operations
- Processed by `bubble_sync` Edge Function
- Retries failed operations automatically

---

## See Also

- [Edge Functions Reference](../edge-functions/README.md)
- [Authentication Flows](../authentication/README.md)
- [TypeScript Types](../types/README.md)
