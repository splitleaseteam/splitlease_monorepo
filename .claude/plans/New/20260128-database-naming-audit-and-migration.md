# Database Naming Convention Audit & Migration Plan

**Date**: 2026-01-28
**Status**: ✅ ANALYSIS COMPLETE - AWAITING APPROVAL
**Target Database**: splitlease-backend-dev
**Scope**: Comprehensive audit of all tables and columns

---

## Executive Summary

This audit identifies **ALL** column and table names in the Split Lease database that violate PostgreSQL naming conventions. These naming issues originated from Bubble.io migration and cause:

1. **PostgREST parsing failures** - Hyphens interpreted as negation operators in `.or()` filters
2. **Query complexity** - All non-standard names require double-quote escaping
3. **Maintenance burden** - Inconsistent naming across 40+ files

### Impact Statistics

| Category | Count | Severity |
|----------|-------|----------|
| Columns with leading hyphens | **5** | 🔴 CRITICAL |
| Columns with leading tildes | **3** | 🟠 HIGH |
| Columns with emojis | **12** | 🟠 HIGH |
| Columns with spaces | **150+** | 🟡 MEDIUM |
| Columns with special chars (/, ?, #, :, ()) | **30+** | 🟡 MEDIUM |
| Tables with leading underscore | **1** | 🟢 LOW |

---

## Category 1: CRITICAL - Leading Hyphens (Breaks PostgREST)

These columns **break PostgREST `.or()` filters** because the hyphen is interpreted as a negation operator.

### TABLE: `thread`

| Current Name | Proposed Name | Data Type | Notes |
|--------------|---------------|-----------|-------|
| `-Host User` | `host_user_id` | text (FK) | References user._id |
| `-Guest User` | `guest_user_id` | text (FK) | References user._id |

### TABLE: `_message`

| Current Name | Proposed Name | Data Type | Notes |
|--------------|---------------|-----------|-------|
| `-Guest User` | `guest_user_id` | text (FK) | References user._id |
| `-Host User` | `host_user_id` | text (FK) | References user._id |
| `-Originator User` | `originator_user_id` | text (FK) | References user._id |

**Why Critical**: The leading hyphen makes these columns impossible to use in PostgREST `.or()` filters without RPC workarounds. Currently, `useLoggedInAvatarData.js` uses `count_user_threads()` RPC specifically to avoid this issue.

---

## Category 2: HIGH - Leading Tildes

### TABLE: `thread`

| Current Name | Proposed Name | Data Type |
|--------------|---------------|-----------|
| `~Last Message` | `last_message_id` | text (FK) |
| `~Date Last Message` | `last_message_at` | timestamp |

### TABLE: `_message`

| Current Name | Proposed Name | Data Type |
|--------------|---------------|-----------|
| `~previous Message` | `previous_message_id` | text (FK) |

---

## Category 3: HIGH - Emoji Prefixed Columns

### TABLE: `listing` (Pricing Columns)

| Current Name | Proposed Name | Data Type |
|--------------|---------------|-----------|
| `💰Nightly Host Rate for 2 nights` | `nightly_rate_2_nights` | numeric |
| `💰Nightly Host Rate for 3 nights` | `nightly_rate_3_nights` | numeric |
| `💰Nightly Host Rate for 4 nights` | `nightly_rate_4_nights` | numeric |
| `💰Nightly Host Rate for 5 nights` | `nightly_rate_5_nights` | numeric |
| `💰Nightly Host Rate for 7 nights` | `nightly_rate_7_nights` | numeric |
| `💰Weekly Host Rate` | `weekly_host_rate` | numeric |
| `💰Monthly Host Rate` | `monthly_host_rate` | numeric |
| `💰Cleaning Cost / Maintenance Fee` | `cleaning_fee` | numeric |
| `💰Damage Deposit` | `damage_deposit` | numeric |
| `💰Unit Markup` | `unit_markup` | numeric |
| `💰Price Override` | `price_override` | numeric |
| `Standarized Minimum Nightly Price (Filter)` | `standardized_min_price` | numeric |

---

## Category 4: MEDIUM - Space-Separated Column Names

### TABLE: `user` (35 columns affected)

| Current Name | Proposed Name |
|--------------|---------------|
| `Name - Full` | `name_full` |
| `Name - First` | `name_first` |
| `Name - Last` | `name_last` |
| `email as text` | `email_text` |
| `Phone Number (as text)` | `phone_number` |
| `Profile Photo` | `profile_photo_url` |
| `Date of Birth` | `date_of_birth` |
| `Type - User Current` | `user_type_current` |
| `Type - User Signup` | `user_type_signup` |
| `User Sub Type` | `user_sub_type` |
| `Account - Guest` | `account_guest_id` |
| `Account - Host / Landlord` | `account_host_id` |
| `Toggle - Is Admin` | `is_admin` |
| `Toggle - Is Corporate User` | `is_corporate_user` |
| `is email confirmed` | `is_email_confirmed` |
| `user verified?` | `is_user_verified` |
| `Verify - Phone` | `is_phone_verified` |
| `Verify - Linked In ID` | `linkedin_id` |
| `Google ID` | `google_id` |
| `Preferred Borough` | `preferred_borough_id` |
| `Preferred Hoods` | `preferred_hoods` |
| `Preferred weekly schedule` | `preferred_weekly_schedule` |
| `Mobile Notifications On` | `mobile_notifications_enabled` |
| `Notification Settings OS(lisits)` | `notification_settings_id` |
| `Favorited Listings` | `favorited_listings` |
| `Proposals List` | `proposals_list` |
| `Chat - Threads` | `chat_threads` |
| `Recent Days Selected` | `recent_days_selected` |
| `Created Date` | `created_at` |
| `Modified Date` | `updated_at` |
| `Users with permission to see sensitive info` | `users_with_permission` |
| `StripeCustomerID` | `stripe_customer_id` |

### TABLE: `listing` (60+ columns affected)

| Current Name | Proposed Name |
|--------------|---------------|
| `Host / Landlord` | `host_account_id` |
| `Host email` | `host_email` |
| `host name` | `host_name` |
| `Created By` | `created_by_id` |
| `Location - Address` | `address` |
| `Location - City` | `city_id` |
| `Location - State` | `state` |
| `Location - Borough` | `borough_id` |
| `Location - Hood` | `hood_id` |
| `Location - Hoods (new)` | `hoods` |
| `Location - Zip Code` | `zip_code` |
| `Location - Coordinates` | `coordinates` |
| `neighborhood (manual input by user)` | `neighborhood_manual` |
| `Features - Type of Space` | `space_type_id` |
| `Features - Qty Bedrooms` | `qty_bedrooms` |
| `Features - Qty Beds` | `qty_beds` |
| `Features - Qty Bathrooms` | `qty_bathrooms` |
| `Features - Qty Guests` | `qty_guests` |
| `Features - SQFT Area` | `sqft_area` |
| `Features - SQFT of Room` | `sqft_room` |
| `Features - Trial Periods Allowed` | `trial_periods_allowed` |
| `Kitchen Type` | `kitchen_type_id` |
| `Features - Parking type` | `parking_type_id` |
| `Features - Secure Storage Option` | `storage_type_id` |
| `Features - Amenities In-Unit` | `amenities_in_unit` |
| `Features - Amenities In-Building` | `amenities_in_building` |
| `Features - House Rules` | `house_rules` |
| `Features - Safety` | `safety_features` |
| `Features - Photos` | `photo_ids` |
| `Days Available (List of Days)` | `days_available` |
| `Days Not Available` | `days_not_available` |
| `Dates - Blocked` | `blocked_dates` |
| `Nights Available (List of Nights)` | `nights_available` |
| `Nights Not Available` | `nights_not_available` |
| ` First Available` | `first_available` |
| `Last Available` | `last_available` |
| `# of nights available` | `nights_available_count` |
| `weeks out to available` | `weeks_out_to_available` |
| `Minimum Nights` | `minimum_nights` |
| `Minimum Weeks` | `minimum_weeks` |
| `Minimum Months` | `minimum_months` |
| `Maximum Nights` | `maximum_nights` |
| `Maximum Weeks` | `maximum_weeks` |
| `Maximum Months` | `maximum_months` |
| `NEW Date Check-in Time` | `check_in_time` |
| `NEW Date Check-out Time` | `check_out_time` |
| `House manual` | `house_manual_id` |
| `host restrictions` | `host_restrictions_id` |
| `Cancellation Policy` | `cancellation_policy_id` |
| `Users that favorite` | `favorited_by_users` |
| `AI Suggestions List` | `ai_suggestions` |
| `users with permission` | `users_with_permission` |
| `Created Date` | `created_at` |
| `Modified Date` | `updated_at` |
| `confirmedAvailability` | `confirmed_availability` |

### TABLE: `proposal` (50+ columns affected)

| Current Name | Proposed Name |
|--------------|---------------|
| `Host - Account` | `host_account_id` |
| `Created By` | `created_by_id` |
| `Move in range start` | `move_in_range_start` |
| `Move in range end` | `move_in_range_end` |
| `Reservation Span` | `reservation_span` |
| `Reservation Span (Weeks)` | `reservation_span_weeks` |
| `Nights Selected (Nights list)` | `nights_selected` |
| `Days Selected` | `days_selected` |
| `Days Available` | `days_available` |
| `Complementary Nights` | `complementary_nights` |
| `Complementary Days` | `complementary_days` |
| `check in day` | `check_in_day` |
| `check out day` | `check_out_day` |
| `4 week rent` | `four_week_rent` |
| `4 week compensation` | `four_week_compensation` |
| `proposal nightly price` | `nightly_price` |
| `Total Price for Reservation (guest)` | `total_price_guest` |
| `Total Compensation (proposal - host)` | `total_compensation_host` |
| `cleaning fee` | `cleaning_fee` |
| `damage deposit` | `damage_deposit` |
| `hc 4 week rent` | `hc_four_week_rent` |
| `hc check in day` | `hc_check_in_day` |
| `hc check out day` | `hc_check_out_day` |
| `hc cleaning fee` | `hc_cleaning_fee` |
| `hc damage deposit` | `hc_damage_deposit` |
| `hc days selected` | `hc_days_selected` |
| `hc move in date` | `hc_move_in_date` |
| `hc nightly price` | `hc_nightly_price` |
| `hc nights per week` | `hc_nights_per_week` |
| `hc nights selected` | `hc_nights_selected` |
| `hc reservation span (weeks)` | `hc_reservation_span_weeks` |
| `hc total price` | `hc_total_price` |
| `Is Finalized` | `is_finalized` |
| `counter offer happened` | `counter_offer_happened` |
| `reason for cancellation` | `cancellation_reason` |
| `Guest email` | `guest_email` |
| `Guest flexibility` | `guest_flexibility` |
| `About yourself` | `about_yourself` |
| `Special needs` | `special_needs` |
| `need for space` | `need_for_space` |
| `preferred gender` | `preferred_gender` |
| `rental type` | `rental_type` |
| `rental application` | `rental_application_id` |
| `virtual meeting` | `virtual_meeting_id` |
| `Drafts List` | `drafts_list` |
| `Negotiation Summary` | `negotiation_summary` |
| `Created Date` | `created_at` |
| `Modified Date` | `updated_at` |

### TABLE: `bookings_leases`

| Current Name | Proposed Name |
|--------------|---------------|
| `Agreement Number` | `agreement_number` |
| `Created By` | `created_by_id` |
| `Lease Status` | `lease_status` |
| `Reservation Period : Start` | `reservation_start` |
| `Reservation Period : End` | `reservation_end` |
| `current week number` | `current_week_number` |
| `total week count` | `total_week_count` |
| `Lease signed?` | `is_lease_signed` |
| `Total Rent` | `total_rent` |
| `Total Compensation` | `total_compensation` |
| `Paid to Date from Guest` | `paid_to_date_guest` |
| `List of Stays` | `stays_list` |
| `List of Booked Dates` | `booked_dates` |
| `Payment Records Guest-SL` | `payment_records_guest` |
| `Payment Records SL-Hosts` | `payment_records_host` |
| `Date Change Requests` | `date_change_requests` |

### TABLE: `co_hostrequest`

| Current Name | Proposed Name |
|--------------|---------------|
| `Co-Host User` | `cohost_user_id` |
| `Host - Landlord` | `host_landlord_id` |
| `Created By` | `created_by_id` |

### TABLE: `_message`

| Current Name | Proposed Name |
|--------------|---------------|
| `Associated Thread/Conversation` | `thread_id` |
| `Call to Action` | `call_to_action` |
| `Communication Mode` | `communication_mode` |
| `Created By` | `created_by_id` |
| `Created Date` | `created_at` |
| `Message Body` | `message_body` |
| `Modified Date` | `updated_at` |
| `Split Bot Warning` | `split_bot_warning` |
| `Unread Users` | `unread_users` |
| `is Forwarded` | `is_forwarded` |
| `is Split Bot` | `is_split_bot` |
| `is Visible to Guest` | `is_visible_to_guest` |
| `is Visible to Host` | `is_visible_to_host` |
| `is deleted (is hidden)` | `is_deleted` |

### TABLE: `thread`

| Current Name | Proposed Name |
|--------------|---------------|
| `Thread Subject` | `thread_subject` |
| `Created By` | `created_by_id` |
| `Created Date` | `created_at` |
| `Modified Date` | `updated_at` |

---

## Category 5: LOW - Table Naming Issues

| Current Name | Proposed Name | Issue |
|--------------|---------------|-------|
| `_message` | `message` | Leading underscore non-standard |

---

## Codebase Impact Analysis

### Files Requiring Updates (40+ files)

#### Critical Priority (Direct `.or()` filter usage)

| File | Lines | Issue |
|------|-------|-------|
| `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js` | 227-278 | RPC workaround for `-Host User`, `-Guest User` |
| `app/src/islands/pages/ListingsOverviewPage/api.js` | 79-139 | Mixed quoting in `.or()` filters |
| `app/src/islands/pages/CreateSuggestedProposalPage/suggestedProposalService.js` | 129, 212 | Inconsistent quoting |
| `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` | 454-457 | RPC workaround comments |

#### High Priority (Extensive column references)

| File | Column References |
|------|-------------------|
| `app/src/islands/pages/useSearchPageLogic.js` | 40+ |
| `app/src/islands/pages/AccountProfilePage/useAccountProfilePageLogic.js` | 40+ |
| `app/src/lib/proposals/userProposalQueries.js` | 35+ |
| `app/src/lib/listingDataFetcher.js` | 30+ |
| `app/src/lib/listingService.js` | 25+ |
| `app/src/lib/constants/listingFields.js` | 20+ (exports field constants) |

#### Medium Priority (Edge Functions)

| Directory | Files Affected |
|-----------|---------------|
| `supabase/functions/auth-user/handlers/` | All files |
| `supabase/functions/messages/handlers/` | All files |
| `supabase/functions/proposal/actions/` | All files |
| `supabase/functions/guest-management/actions/` | searchGuests.ts |
| `supabase/functions/lease/handlers/` | Multiple files |
| `supabase/functions/_shared/messagingHelpers.ts` | 1 file |

---

## Migration SQL Scripts

### Script 1: CRITICAL - Fix Leading Hyphen Columns

```sql
-- ============================================================
-- CRITICAL: Fix Leading Hyphen Columns (Breaks PostgREST)
-- Run this FIRST - these columns cause immediate query failures
-- ============================================================

BEGIN;

-- Table: thread
ALTER TABLE thread RENAME COLUMN "-Host User" TO host_user_id;
ALTER TABLE thread RENAME COLUMN "-Guest User" TO guest_user_id;

-- Table: _message
ALTER TABLE _message RENAME COLUMN "-Guest User" TO guest_user_id;
ALTER TABLE _message RENAME COLUMN "-Host User" TO host_user_id;
ALTER TABLE _message RENAME COLUMN "-Originator User" TO originator_user_id;

COMMIT;
```

### Script 2: HIGH - Fix Leading Tilde Columns

```sql
-- ============================================================
-- HIGH: Fix Leading Tilde Columns
-- ============================================================

BEGIN;

-- Table: thread
ALTER TABLE thread RENAME COLUMN "~Last Message" TO last_message_id;
ALTER TABLE thread RENAME COLUMN "~Date Last Message" TO last_message_at;

-- Table: _message
ALTER TABLE _message RENAME COLUMN "~previous Message" TO previous_message_id;

COMMIT;
```

### Script 3: HIGH - Fix Emoji Columns

```sql
-- ============================================================
-- HIGH: Fix Emoji-Prefixed Columns (listing table)
-- ============================================================

BEGIN;

ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 2 nights" TO nightly_rate_2_nights;
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 3 nights" TO nightly_rate_3_nights;
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 4 nights" TO nightly_rate_4_nights;
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 5 nights" TO nightly_rate_5_nights;
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 7 nights" TO nightly_rate_7_nights;
ALTER TABLE listing RENAME COLUMN "💰Weekly Host Rate" TO weekly_host_rate;
ALTER TABLE listing RENAME COLUMN "💰Monthly Host Rate" TO monthly_host_rate;
ALTER TABLE listing RENAME COLUMN "💰Cleaning Cost / Maintenance Fee" TO cleaning_fee;
ALTER TABLE listing RENAME COLUMN "💰Damage Deposit" TO damage_deposit;
ALTER TABLE listing RENAME COLUMN "💰Unit Markup" TO unit_markup;
ALTER TABLE listing RENAME COLUMN "💰Price Override" TO price_override;
ALTER TABLE listing RENAME COLUMN "Standarized Minimum Nightly Price (Filter)" TO standardized_min_price;

COMMIT;
```

### Script 4: MEDIUM - Fix User Table Columns

```sql
-- ============================================================
-- MEDIUM: Fix User Table Space-Separated Columns
-- ============================================================

BEGIN;

ALTER TABLE "user" RENAME COLUMN "Name - Full" TO name_full;
ALTER TABLE "user" RENAME COLUMN "Name - First" TO name_first;
ALTER TABLE "user" RENAME COLUMN "Name - Last" TO name_last;
ALTER TABLE "user" RENAME COLUMN "email as text" TO email_text;
ALTER TABLE "user" RENAME COLUMN "Phone Number (as text)" TO phone_number;
ALTER TABLE "user" RENAME COLUMN "Profile Photo" TO profile_photo_url;
ALTER TABLE "user" RENAME COLUMN "Date of Birth" TO date_of_birth;
ALTER TABLE "user" RENAME COLUMN "Type - User Current" TO user_type_current;
ALTER TABLE "user" RENAME COLUMN "Type - User Signup" TO user_type_signup;
ALTER TABLE "user" RENAME COLUMN "User Sub Type" TO user_sub_type;
ALTER TABLE "user" RENAME COLUMN "Account - Guest" TO account_guest_id;
ALTER TABLE "user" RENAME COLUMN "Account - Host / Landlord" TO account_host_id;
ALTER TABLE "user" RENAME COLUMN "Toggle - Is Admin" TO is_admin;
ALTER TABLE "user" RENAME COLUMN "Toggle - Is Corporate User" TO is_corporate_user;
ALTER TABLE "user" RENAME COLUMN "is email confirmed" TO is_email_confirmed;
ALTER TABLE "user" RENAME COLUMN "user verified?" TO is_user_verified;
ALTER TABLE "user" RENAME COLUMN "Verify - Phone" TO is_phone_verified;
ALTER TABLE "user" RENAME COLUMN "Verify - Linked In ID" TO linkedin_id;
ALTER TABLE "user" RENAME COLUMN "Google ID" TO google_id;
ALTER TABLE "user" RENAME COLUMN "Preferred Borough" TO preferred_borough_id;
ALTER TABLE "user" RENAME COLUMN "Preferred Hoods" TO preferred_hoods;
ALTER TABLE "user" RENAME COLUMN "Preferred weekly schedule" TO preferred_weekly_schedule;
ALTER TABLE "user" RENAME COLUMN "Mobile Notifications On" TO mobile_notifications_enabled;
ALTER TABLE "user" RENAME COLUMN "Notification Settings OS(lisits)" TO notification_settings_id;
ALTER TABLE "user" RENAME COLUMN "Favorited Listings" TO favorited_listings;
ALTER TABLE "user" RENAME COLUMN "Proposals List" TO proposals_list;
ALTER TABLE "user" RENAME COLUMN "Chat - Threads" TO chat_threads;
ALTER TABLE "user" RENAME COLUMN "Recent Days Selected" TO recent_days_selected;
ALTER TABLE "user" RENAME COLUMN "Created Date" TO created_at;
ALTER TABLE "user" RENAME COLUMN "Modified Date" TO updated_at;
ALTER TABLE "user" RENAME COLUMN "Users with permission to see sensitive info" TO users_with_permission;
ALTER TABLE "user" RENAME COLUMN "StripeCustomerID" TO stripe_customer_id;

COMMIT;
```

### Script 5: MEDIUM - Fix Listing Table Columns

```sql
-- ============================================================
-- MEDIUM: Fix Listing Table Space-Separated Columns
-- ============================================================

BEGIN;

ALTER TABLE listing RENAME COLUMN "Host / Landlord" TO host_account_id;
ALTER TABLE listing RENAME COLUMN "Host email" TO host_email;
ALTER TABLE listing RENAME COLUMN "host name" TO host_name;
ALTER TABLE listing RENAME COLUMN "Created By" TO created_by_id;
ALTER TABLE listing RENAME COLUMN "Location - Address" TO address;
ALTER TABLE listing RENAME COLUMN "Location - City" TO city_id;
ALTER TABLE listing RENAME COLUMN "Location - State" TO state;
ALTER TABLE listing RENAME COLUMN "Location - Borough" TO borough_id;
ALTER TABLE listing RENAME COLUMN "Location - Hood" TO hood_id;
ALTER TABLE listing RENAME COLUMN "Location - Hoods (new)" TO hoods;
ALTER TABLE listing RENAME COLUMN "Location - Zip Code" TO zip_code;
ALTER TABLE listing RENAME COLUMN "Location - Coordinates" TO coordinates;
ALTER TABLE listing RENAME COLUMN "neighborhood (manual input by user)" TO neighborhood_manual;
ALTER TABLE listing RENAME COLUMN "Features - Type of Space" TO space_type_id;
ALTER TABLE listing RENAME COLUMN "Features - Qty Bedrooms" TO qty_bedrooms;
ALTER TABLE listing RENAME COLUMN "Features - Qty Beds" TO qty_beds;
ALTER TABLE listing RENAME COLUMN "Features - Qty Bathrooms" TO qty_bathrooms;
ALTER TABLE listing RENAME COLUMN "Features - Qty Guests" TO qty_guests;
ALTER TABLE listing RENAME COLUMN "Features - SQFT Area" TO sqft_area;
ALTER TABLE listing RENAME COLUMN "Features - SQFT of Room" TO sqft_room;
ALTER TABLE listing RENAME COLUMN "Features - Trial Periods Allowed" TO trial_periods_allowed;
ALTER TABLE listing RENAME COLUMN "Kitchen Type" TO kitchen_type_id;
ALTER TABLE listing RENAME COLUMN "Features - Parking type" TO parking_type_id;
ALTER TABLE listing RENAME COLUMN "Features - Secure Storage Option" TO storage_type_id;
ALTER TABLE listing RENAME COLUMN "Features - Amenities In-Unit" TO amenities_in_unit;
ALTER TABLE listing RENAME COLUMN "Features - Amenities In-Building" TO amenities_in_building;
ALTER TABLE listing RENAME COLUMN "Features - House Rules" TO house_rules;
ALTER TABLE listing RENAME COLUMN "Features - Safety" TO safety_features;
ALTER TABLE listing RENAME COLUMN "Features - Photos" TO photo_ids;
ALTER TABLE listing RENAME COLUMN "Days Available (List of Days)" TO days_available;
ALTER TABLE listing RENAME COLUMN "Days Not Available" TO days_not_available;
ALTER TABLE listing RENAME COLUMN "Dates - Blocked" TO blocked_dates;
ALTER TABLE listing RENAME COLUMN "Nights Available (List of Nights)" TO nights_available;
ALTER TABLE listing RENAME COLUMN "Nights Not Available" TO nights_not_available;
ALTER TABLE listing RENAME COLUMN " First Available" TO first_available;
ALTER TABLE listing RENAME COLUMN "Last Available" TO last_available;
ALTER TABLE listing RENAME COLUMN "# of nights available" TO nights_available_count;
ALTER TABLE listing RENAME COLUMN "weeks out to available" TO weeks_out_to_available;
ALTER TABLE listing RENAME COLUMN "Minimum Nights" TO minimum_nights;
ALTER TABLE listing RENAME COLUMN "Minimum Weeks" TO minimum_weeks;
ALTER TABLE listing RENAME COLUMN "Minimum Months" TO minimum_months;
ALTER TABLE listing RENAME COLUMN "Maximum Nights" TO maximum_nights;
ALTER TABLE listing RENAME COLUMN "Maximum Weeks" TO maximum_weeks;
ALTER TABLE listing RENAME COLUMN "Maximum Months" TO maximum_months;
ALTER TABLE listing RENAME COLUMN "NEW Date Check-in Time" TO check_in_time;
ALTER TABLE listing RENAME COLUMN "NEW Date Check-out Time" TO check_out_time;
ALTER TABLE listing RENAME COLUMN "House manual" TO house_manual_id;
ALTER TABLE listing RENAME COLUMN "host restrictions" TO host_restrictions_id;
ALTER TABLE listing RENAME COLUMN "Cancellation Policy" TO cancellation_policy_id;
ALTER TABLE listing RENAME COLUMN "Users that favorite" TO favorited_by_users;
ALTER TABLE listing RENAME COLUMN "AI Suggestions List" TO ai_suggestions;
ALTER TABLE listing RENAME COLUMN "users with permission" TO users_with_permission;
ALTER TABLE listing RENAME COLUMN "Created Date" TO created_at;
ALTER TABLE listing RENAME COLUMN "Modified Date" TO updated_at;
ALTER TABLE listing RENAME COLUMN "confirmedAvailability" TO confirmed_availability;

COMMIT;
```

### Script 6: MEDIUM - Fix Proposal Table Columns

```sql
-- ============================================================
-- MEDIUM: Fix Proposal Table Space-Separated Columns
-- ============================================================

BEGIN;

ALTER TABLE proposal RENAME COLUMN "Host - Account" TO host_account_id;
ALTER TABLE proposal RENAME COLUMN "Created By" TO created_by_id;
ALTER TABLE proposal RENAME COLUMN "Move in range start" TO move_in_range_start;
ALTER TABLE proposal RENAME COLUMN "Move in range end" TO move_in_range_end;
ALTER TABLE proposal RENAME COLUMN "Reservation Span" TO reservation_span;
ALTER TABLE proposal RENAME COLUMN "Reservation Span (Weeks)" TO reservation_span_weeks;
ALTER TABLE proposal RENAME COLUMN "Nights Selected (Nights list)" TO nights_selected;
ALTER TABLE proposal RENAME COLUMN "Days Selected" TO days_selected;
ALTER TABLE proposal RENAME COLUMN "Days Available" TO days_available;
ALTER TABLE proposal RENAME COLUMN "Complementary Nights" TO complementary_nights;
ALTER TABLE proposal RENAME COLUMN "Complementary Days" TO complementary_days;
ALTER TABLE proposal RENAME COLUMN "check in day" TO check_in_day;
ALTER TABLE proposal RENAME COLUMN "check out day" TO check_out_day;
ALTER TABLE proposal RENAME COLUMN "4 week rent" TO four_week_rent;
ALTER TABLE proposal RENAME COLUMN "4 week compensation" TO four_week_compensation;
ALTER TABLE proposal RENAME COLUMN "proposal nightly price" TO nightly_price;
ALTER TABLE proposal RENAME COLUMN "Total Price for Reservation (guest)" TO total_price_guest;
ALTER TABLE proposal RENAME COLUMN "Total Compensation (proposal - host)" TO total_compensation_host;
ALTER TABLE proposal RENAME COLUMN "cleaning fee" TO cleaning_fee;
ALTER TABLE proposal RENAME COLUMN "damage deposit" TO damage_deposit;
ALTER TABLE proposal RENAME COLUMN "hc 4 week rent" TO hc_four_week_rent;
ALTER TABLE proposal RENAME COLUMN "hc check in day" TO hc_check_in_day;
ALTER TABLE proposal RENAME COLUMN "hc check out day" TO hc_check_out_day;
ALTER TABLE proposal RENAME COLUMN "hc cleaning fee" TO hc_cleaning_fee;
ALTER TABLE proposal RENAME COLUMN "hc damage deposit" TO hc_damage_deposit;
ALTER TABLE proposal RENAME COLUMN "hc days selected" TO hc_days_selected;
ALTER TABLE proposal RENAME COLUMN "hc move in date" TO hc_move_in_date;
ALTER TABLE proposal RENAME COLUMN "hc nightly price" TO hc_nightly_price;
ALTER TABLE proposal RENAME COLUMN "hc nights per week" TO hc_nights_per_week;
ALTER TABLE proposal RENAME COLUMN "hc nights selected" TO hc_nights_selected;
ALTER TABLE proposal RENAME COLUMN "hc reservation span (weeks)" TO hc_reservation_span_weeks;
ALTER TABLE proposal RENAME COLUMN "hc total price" TO hc_total_price;
ALTER TABLE proposal RENAME COLUMN "Is Finalized" TO is_finalized;
ALTER TABLE proposal RENAME COLUMN "counter offer happened" TO counter_offer_happened;
ALTER TABLE proposal RENAME COLUMN "reason for cancellation" TO cancellation_reason;
ALTER TABLE proposal RENAME COLUMN "Guest email" TO guest_email;
ALTER TABLE proposal RENAME COLUMN "Guest flexibility" TO guest_flexibility;
ALTER TABLE proposal RENAME COLUMN "About yourself" TO about_yourself;
ALTER TABLE proposal RENAME COLUMN "Special needs" TO special_needs;
ALTER TABLE proposal RENAME COLUMN "need for space" TO need_for_space;
ALTER TABLE proposal RENAME COLUMN "preferred gender" TO preferred_gender;
ALTER TABLE proposal RENAME COLUMN "rental type" TO rental_type;
ALTER TABLE proposal RENAME COLUMN "rental application" TO rental_application_id;
ALTER TABLE proposal RENAME COLUMN "virtual meeting" TO virtual_meeting_id;
ALTER TABLE proposal RENAME COLUMN "Drafts List" TO drafts_list;
ALTER TABLE proposal RENAME COLUMN "Negotiation Summary" TO negotiation_summary;
ALTER TABLE proposal RENAME COLUMN "Created Date" TO created_at;
ALTER TABLE proposal RENAME COLUMN "Modified Date" TO updated_at;

COMMIT;
```

### Script 7: MEDIUM - Fix Other Tables

```sql
-- ============================================================
-- MEDIUM: Fix Remaining Tables
-- ============================================================

BEGIN;

-- Table: bookings_leases
ALTER TABLE bookings_leases RENAME COLUMN "Agreement Number" TO agreement_number;
ALTER TABLE bookings_leases RENAME COLUMN "Created By" TO created_by_id;
ALTER TABLE bookings_leases RENAME COLUMN "Lease Status" TO lease_status;
ALTER TABLE bookings_leases RENAME COLUMN "Reservation Period : Start" TO reservation_start;
ALTER TABLE bookings_leases RENAME COLUMN "Reservation Period : End" TO reservation_end;
ALTER TABLE bookings_leases RENAME COLUMN "current week number" TO current_week_number;
ALTER TABLE bookings_leases RENAME COLUMN "total week count" TO total_week_count;
ALTER TABLE bookings_leases RENAME COLUMN "Lease signed?" TO is_lease_signed;
ALTER TABLE bookings_leases RENAME COLUMN "Total Rent" TO total_rent;
ALTER TABLE bookings_leases RENAME COLUMN "Total Compensation" TO total_compensation;
ALTER TABLE bookings_leases RENAME COLUMN "Paid to Date from Guest" TO paid_to_date_guest;
ALTER TABLE bookings_leases RENAME COLUMN "List of Stays" TO stays_list;
ALTER TABLE bookings_leases RENAME COLUMN "List of Booked Dates" TO booked_dates;
ALTER TABLE bookings_leases RENAME COLUMN "Payment Records Guest-SL" TO payment_records_guest;
ALTER TABLE bookings_leases RENAME COLUMN "Payment Records SL-Hosts" TO payment_records_host;
ALTER TABLE bookings_leases RENAME COLUMN "Date Change Requests" TO date_change_requests;

-- Table: co_hostrequest
ALTER TABLE co_hostrequest RENAME COLUMN "Co-Host User" TO cohost_user_id;
ALTER TABLE co_hostrequest RENAME COLUMN "Host - Landlord" TO host_landlord_id;
ALTER TABLE co_hostrequest RENAME COLUMN "Created By" TO created_by_id;

-- Table: _message
ALTER TABLE _message RENAME COLUMN "Associated Thread/Conversation" TO thread_id;
ALTER TABLE _message RENAME COLUMN "Call to Action" TO call_to_action;
ALTER TABLE _message RENAME COLUMN "Communication Mode" TO communication_mode;
ALTER TABLE _message RENAME COLUMN "Created By" TO created_by_id;
ALTER TABLE _message RENAME COLUMN "Created Date" TO created_at;
ALTER TABLE _message RENAME COLUMN "Message Body" TO message_body;
ALTER TABLE _message RENAME COLUMN "Modified Date" TO updated_at;
ALTER TABLE _message RENAME COLUMN "Split Bot Warning" TO split_bot_warning;
ALTER TABLE _message RENAME COLUMN "Unread Users" TO unread_users;
ALTER TABLE _message RENAME COLUMN "is Forwarded" TO is_forwarded;
ALTER TABLE _message RENAME COLUMN "is Split Bot" TO is_split_bot;
ALTER TABLE _message RENAME COLUMN "is Visible to Guest" TO is_visible_to_guest;
ALTER TABLE _message RENAME COLUMN "is Visible to Host" TO is_visible_to_host;
ALTER TABLE _message RENAME COLUMN "is deleted (is hidden)" TO is_deleted;

-- Table: thread
ALTER TABLE thread RENAME COLUMN "Thread Subject" TO thread_subject;
ALTER TABLE thread RENAME COLUMN "Created By" TO created_by_id;
ALTER TABLE thread RENAME COLUMN "Created Date" TO created_at;
ALTER TABLE thread RENAME COLUMN "Modified Date" TO updated_at;

COMMIT;
```

### Script 8: LOW - Rename Table

```sql
-- ============================================================
-- LOW: Rename _message table to message
-- ============================================================

BEGIN;

ALTER TABLE _message RENAME TO message;

COMMIT;
```

---

## Rollback Scripts

### Rollback Script 1: CRITICAL Columns

```sql
-- ============================================================
-- ROLLBACK: Critical Leading Hyphen Columns
-- ============================================================

BEGIN;

-- Table: thread
ALTER TABLE thread RENAME COLUMN host_user_id TO "-Host User";
ALTER TABLE thread RENAME COLUMN guest_user_id TO "-Guest User";

-- Table: _message (or message if renamed)
ALTER TABLE _message RENAME COLUMN guest_user_id TO "-Guest User";
ALTER TABLE _message RENAME COLUMN host_user_id TO "-Host User";
ALTER TABLE _message RENAME COLUMN originator_user_id TO "-Originator User";

COMMIT;
```

### Rollback Script 2: Tilde Columns

```sql
-- ============================================================
-- ROLLBACK: Tilde Columns
-- ============================================================

BEGIN;

-- Table: thread
ALTER TABLE thread RENAME COLUMN last_message_id TO "~Last Message";
ALTER TABLE thread RENAME COLUMN last_message_at TO "~Date Last Message";

-- Table: _message
ALTER TABLE _message RENAME COLUMN previous_message_id TO "~previous Message";

COMMIT;
```

### Rollback Script 3: Emoji Columns

```sql
-- ============================================================
-- ROLLBACK: Emoji Columns
-- ============================================================

BEGIN;

ALTER TABLE listing RENAME COLUMN nightly_rate_2_nights TO "💰Nightly Host Rate for 2 nights";
ALTER TABLE listing RENAME COLUMN nightly_rate_3_nights TO "💰Nightly Host Rate for 3 nights";
ALTER TABLE listing RENAME COLUMN nightly_rate_4_nights TO "💰Nightly Host Rate for 4 nights";
ALTER TABLE listing RENAME COLUMN nightly_rate_5_nights TO "💰Nightly Host Rate for 5 nights";
ALTER TABLE listing RENAME COLUMN nightly_rate_7_nights TO "💰Nightly Host Rate for 7 nights";
ALTER TABLE listing RENAME COLUMN weekly_host_rate TO "💰Weekly Host Rate";
ALTER TABLE listing RENAME COLUMN monthly_host_rate TO "💰Monthly Host Rate";
ALTER TABLE listing RENAME COLUMN cleaning_fee TO "💰Cleaning Cost / Maintenance Fee";
ALTER TABLE listing RENAME COLUMN damage_deposit TO "💰Damage Deposit";
ALTER TABLE listing RENAME COLUMN unit_markup TO "💰Unit Markup";
ALTER TABLE listing RENAME COLUMN price_override TO "💰Price Override";
ALTER TABLE listing RENAME COLUMN standardized_min_price TO "Standarized Minimum Nightly Price (Filter)";

COMMIT;
```

---

## Code Update Mapping

### Pattern: Find and Replace

After running migrations, update codebase with these replacements:

#### Critical Replacements (Thread/Message Tables)

| Old Pattern | New Pattern | Files Affected |
|-------------|-------------|----------------|
| `"-Host User"` | `host_user_id` | 15+ |
| `"-Guest User"` | `guest_user_id` | 15+ |
| `"-Originator User"` | `originator_user_id` | 5+ |
| `"~Last Message"` | `last_message_id` | 3+ |
| `"~Date Last Message"` | `last_message_at` | 3+ |

#### High Priority Replacements (User Table)

| Old Pattern | New Pattern |
|-------------|-------------|
| `"Name - First"` | `name_first` |
| `"Name - Last"` | `name_last` |
| `"Name - Full"` | `name_full` |
| `"Phone Number (as text)"` | `phone_number` |
| `"Profile Photo"` | `profile_photo_url` |
| `"Type - User Current"` | `user_type_current` |

---

## Execution Plan

### Phase 1: CRITICAL (Immediate - 1 day)
1. ✅ Create this audit document
2. ⏳ Run Script 1 (Critical hyphen columns) on dev
3. ⏳ Update all code references to hyphen columns
4. ⏳ Test all affected flows (messaging, threads)
5. ⏳ Deploy to production

### Phase 2: HIGH (Week 1)
1. Run Scripts 2-3 (tilde and emoji columns)
2. Update code references
3. Test pricing displays and thread queries
4. Deploy to production

### Phase 3: MEDIUM (Week 2-3)
1. Run Scripts 4-7 (space-separated columns)
2. Update code references systematically
3. Comprehensive regression testing
4. Deploy to production

### Phase 4: LOW (Week 4)
1. Run Script 8 (table rename)
2. Update all `_message` references to `message`
3. Final testing
4. Deploy to production

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Data loss | ALTER RENAME is metadata-only; no data modification |
| FK constraint breaks | Constraints follow column renames automatically |
| Index invalidation | Indexes follow column renames automatically |
| View breakage | Views using old column names will break - must update |
| RLS policy breakage | Policies using old column names will break - must update |
| Application downtime | Coordinate code deploy immediately after DB migration |

---

## Pre-Migration Checklist

- [ ] Backup database before each phase
- [ ] Test migration on dev database first
- [ ] Verify all RLS policies reference new column names
- [ ] Update all database views
- [ ] Update all RPC functions
- [ ] Update all Edge Functions
- [ ] Update all frontend code
- [ ] Run comprehensive test suite
- [ ] Have rollback scripts ready

---

## Appendix: Complete File List

### Files with 20+ Column References

1. `app/src/islands/pages/useSearchPageLogic.js` (40+)
2. `app/src/islands/pages/AccountProfilePage/useAccountProfilePageLogic.js` (40+)
3. `app/src/lib/proposals/userProposalQueries.js` (35+)
4. `app/src/lib/listingDataFetcher.js` (30+)
5. `app/src/lib/listingService.js` (25+)
6. `app/src/lib/constants/listingFields.js` (20+)
7. `supabase/functions/auth-user/handlers/*.ts` (combined 50+)
8. `supabase/functions/messages/handlers/*.ts` (combined 30+)

### Files with RPC Workarounds (Remove After Migration)

1. `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js` - `count_user_threads()`
2. `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` - `get_host_listings()`

---

**Document Status**: ✅ COMPLETE
**Next Action**: Review and approve migration plan
**Estimated Effort**: 2-4 weeks for full migration
