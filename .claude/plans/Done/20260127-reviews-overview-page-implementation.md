# Reviews Overview Page Implementation Plan

## Overview

The Reviews Overview page is a central hub for managing reviews in the Split Lease platform. It provides a three-tab interface allowing users to view **Pending Reviews** (reviews they need to write), **Received Reviews** (reviews others have written about them), and **Submitted Reviews** (reviews they have already written). The page supports both Guest and Host users, implementing a two-way review system where Hosts review Guests and Guests review Hosts/Properties after completed stays.

**URL**: `/reviews-overview`
**Access**: Authenticated users only (Guest or Host)
**Primary Data Source**: Supabase PostgreSQL
**Related Entities**: `bookings_stays`, `review`, `review_rating_detail`, `user`

---

## Phase 1: Database Schema

### 1.1 New Tables

#### Table: `review`
The main review entity containing the comment, overall rating, and links to reviewer/reviewee.

```sql
-- Migration: 20260127_create_review_tables.sql

-- MAIN REVIEW TABLE
CREATE TABLE IF NOT EXISTS review (
  _id TEXT PRIMARY KEY DEFAULT generate_bubble_id(),

  -- Relationships
  stay_id TEXT NOT NULL REFERENCES bookings_stays(_id),
  lease_id TEXT REFERENCES bookings_leases(_id),
  reviewer_id TEXT NOT NULL REFERENCES "user"(_id),
  reviewee_id TEXT NOT NULL REFERENCES "user"(_id),
  listing_id TEXT REFERENCES listing(_id),

  -- Review Content
  review_type TEXT NOT NULL CHECK (review_type IN ('host_reviews_guest', 'guest_reviews_host')),
  comment TEXT,
  overall_rating NUMERIC(2,1) CHECK (overall_rating >= 1 AND overall_rating <= 5),
  would_recommend BOOLEAN,

  -- Metadata
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Bubble Sync Fields
  bubble_id TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  bubble_sync_error TEXT,

  -- Constraints
  UNIQUE(stay_id, reviewer_id)
);

-- Indexes for common queries
CREATE INDEX idx_review_reviewer_id ON review(reviewer_id);
CREATE INDEX idx_review_reviewee_id ON review(reviewee_id);
CREATE INDEX idx_review_stay_id ON review(stay_id);
CREATE INDEX idx_review_listing_id ON review(listing_id);
CREATE INDEX idx_review_type ON review(review_type);
CREATE INDEX idx_review_created_at ON review(created_at DESC);
```

#### Table: `review_rating_detail`
Individual category ratings for a review (e.g., cleanliness, communication, house rules).

```sql
-- RATING DETAIL TABLE (belongs to review)
CREATE TABLE IF NOT EXISTS review_rating_detail (
  _id TEXT PRIMARY KEY DEFAULT generate_bubble_id(),

  -- Parent Review
  review_id TEXT NOT NULL REFERENCES review(_id) ON DELETE CASCADE,

  -- Rating Data
  category TEXT NOT NULL,
  category_label TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(review_id, category)
);

-- Indexes
CREATE INDEX idx_rating_detail_review_id ON review_rating_detail(review_id);
```

### 1.2 Review Categories Constants

Host reviewing Guest categories (from existing `reviewCategories.js`):
- `check_in_out` - Check-in/Check-out Etiquette
- `communication` - Communication
- `cleanliness` - Cleanliness
- `payment` - Payment Reliability
- `house_rules` - House Rules Compliance
- `noise` - Noise Consideration
- `amenity_usage` - Amenity Usage
- `trash` - Trash & Recycling
- `neighbor_respect` - Neighbor Respect
- `property_care` - Property Care
- `guest_behavior` - Guest Behavior
- `recommendation` - Would Recommend

Guest reviewing Host/Property categories (new):
- `accuracy` - Listing Accuracy
- `cleanliness` - Cleanliness
- `communication` - Host Communication
- `check_in` - Check-in Process
- `location` - Location
- `value` - Value for Money

### 1.3 Modify `bookings_stays` Table

Add review status tracking columns to the existing stays table:

```sql
-- Migration: 20260127_add_review_tracking_to_stays.sql

ALTER TABLE bookings_stays
ADD COLUMN IF NOT EXISTS review_by_host_id TEXT REFERENCES review(_id),
ADD COLUMN IF NOT EXISTS review_by_guest_id TEXT REFERENCES review(_id),
ADD COLUMN IF NOT EXISTS review_by_host_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS review_by_guest_submitted_at TIMESTAMPTZ;

-- Add indexes for efficient review queries
CREATE INDEX IF NOT EXISTS idx_stays_review_by_host ON bookings_stays(review_by_host_id) WHERE review_by_host_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stays_review_by_guest ON bookings_stays(review_by_guest_id) WHERE review_by_guest_id IS NOT NULL;
```

---

## Phase 2: Edge Function

### 2.1 Create `reviews-overview` Edge Function

**Location**: `supabase/functions/reviews-overview/index.ts`

The Edge Function follows the standard `{ action, payload }` pattern and handles all review-related operations.

### 2.2 Actions

#### Action: `get_pending_reviews`
Fetches stays where the current user has not submitted a review.

```typescript
interface GetPendingReviewsPayload {
  // No additional payload needed - uses auth token
}

interface PendingReviewItem {
  stayId: string;
  leaseId: string;
  listingId: string;
  listingName: string;
  listingImageUrl: string | null;
  checkInDate: string;
  checkOutDate: string;
  weekNumber: number;
  revieweeId: string;
  revieweeName: string;
  revieweeType: 'host' | 'guest';
  daysUntilExpiry: number | null;
}

interface GetPendingReviewsResponse {
  success: boolean;
  data: {
    reviews: PendingReviewItem[];
    totalCount: number;
  };
}
```

**Logic**:
1. Get current user from auth token
2. Determine user type (Host or Guest)
3. Query `bookings_stays` joined with `bookings_leases`, `listing`, `user`:
   - For Hosts: stays where `review_by_host_id IS NULL` AND stay status = 'completed' AND host is current user
   - For Guests: stays where `review_by_guest_id IS NULL` AND stay status = 'completed' AND guest is current user
4. Return transformed data with relevant context

#### Action: `get_received_reviews`
Fetches reviews written about the current user.

```typescript
interface GetReceivedReviewsPayload {
  limit?: number;
  offset?: number;
}

interface ReceivedReviewItem {
  reviewId: string;
  stayId: string;
  leaseId: string;
  listingName: string;
  listingImageUrl: string | null;
  checkInDate: string;
  checkOutDate: string;
  reviewerId: string;
  reviewerName: string;
  reviewerImageUrl: string | null;
  overallRating: number;
  comment: string | null;
  wouldRecommend: boolean | null;
  ratingDetails: Array<{
    category: string;
    categoryLabel: string;
    rating: number;
  }>;
  createdAt: string;
}

interface GetReceivedReviewsResponse {
  success: boolean;
  data: {
    reviews: ReceivedReviewItem[];
    totalCount: number;
    averageRating: number | null;
  };
}
```

**Logic**:
1. Get current user from auth token
2. Query `review` where `reviewee_id = current_user`
3. Join with `review_rating_detail`, `bookings_stays`, `listing`, `user` (reviewer)
4. Calculate average rating across all received reviews
5. Return paginated results

#### Action: `get_submitted_reviews`
Fetches reviews the current user has written.

```typescript
interface GetSubmittedReviewsPayload {
  limit?: number;
  offset?: number;
}

interface SubmittedReviewItem {
  reviewId: string;
  stayId: string;
  leaseId: string;
  listingName: string;
  listingImageUrl: string | null;
  checkInDate: string;
  checkOutDate: string;
  revieweeId: string;
  revieweeName: string;
  revieweeImageUrl: string | null;
  overallRating: number;
  comment: string | null;
  wouldRecommend: boolean | null;
  ratingDetails: Array<{
    category: string;
    categoryLabel: string;
    rating: number;
  }>;
  createdAt: string;
}

interface GetSubmittedReviewsResponse {
  success: boolean;
  data: {
    reviews: SubmittedReviewItem[];
    totalCount: number;
  };
}
```

#### Action: `create_review`
Submit a new review for a stay.

```typescript
interface CreateReviewPayload {
  stayId: string;
  overallRating: number;
  comment?: string;
  wouldRecommend?: boolean;
  ratings: Array<{
    category: string;
    rating: number;
  }>;
}

interface CreateReviewResponse {
  success: boolean;
  data: {
    reviewId: string;
    message: string;
  };
}
```

**Logic**:
1. Validate auth token
2. Validate stay exists and user is authorized to review
3. Check review doesn't already exist for this stay/reviewer combo
4. Insert into `review` table
5. Insert rating details into `review_rating_detail` table
6. Update `bookings_stays` with review reference
7. Enqueue Bubble sync if needed
8. Return success

#### Action: `get_review_details`
Get full details of a specific review.

```typescript
interface GetReviewDetailsPayload {
  reviewId: string;
}

interface GetReviewDetailsResponse {
  success: boolean;
  data: {
    review: ReceivedReviewItem | SubmittedReviewItem;
  };
}
```

### 2.3 Edge Function File Structure

```
supabase/functions/reviews-overview/
├── index.ts                    # Main entry point with action routing
├── handlers/
│   ├── getPendingReviews.ts    # Handler for get_pending_reviews
│   ├── getReceivedReviews.ts   # Handler for get_received_reviews
│   ├── getSubmittedReviews.ts  # Handler for get_submitted_reviews
│   ├── createReview.ts         # Handler for create_review
│   └── getReviewDetails.ts     # Handler for get_review_details
├── lib/
│   ├── queries.ts              # Reusable Supabase query builders
│   ├── transformers.ts         # Data transformation functions
│   └── validators.ts           # Input validation functions
└── deno.json                   # Import map
```

### 2.4 Main Entry Point

```typescript
// supabase/functions/reviews-overview/index.ts

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { createErrorCollector } from "../_shared/slack.ts";
import { ValidationError, AuthenticationError } from "../_shared/errors.ts";

import { handleGetPendingReviews } from "./handlers/getPendingReviews.ts";
import { handleGetReceivedReviews } from "./handlers/getReceivedReviews.ts";
import { handleGetSubmittedReviews } from "./handlers/getSubmittedReviews.ts";
import { handleCreateReview } from "./handlers/createReview.ts";
import { handleGetReviewDetails } from "./handlers/getReviewDetails.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const collector = createErrorCollector("reviews-overview", "request");

  try {
    const { action, payload } = await req.json();

    if (!action) {
      throw new ValidationError("Missing action parameter");
    }

    // Auth required for all actions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new AuthenticationError("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthenticationError("Invalid or expired token");
    }

    collector.setContext({ userId: user.id, action });

    switch (action) {
      case "get_pending_reviews":
        return await handleGetPendingReviews(supabase, user, payload);
      case "get_received_reviews":
        return await handleGetReceivedReviews(supabase, user, payload);
      case "get_submitted_reviews":
        return await handleGetSubmittedReviews(supabase, user, payload);
      case "create_review":
        return await handleCreateReview(supabase, user, payload, collector);
      case "get_review_details":
        return await handleGetReviewDetails(supabase, user, payload);
      default:
        throw new ValidationError(`Unknown action: ${action}`);
    }

  } catch (error) {
    collector.add(error as Error, "request processing");
    collector.reportToSlack();

    const statusCode = error instanceof ValidationError ? 400
                     : error instanceof AuthenticationError ? 401
                     : 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
        code: (error as { code?: string }).code || "UNKNOWN_ERROR"
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
```

---

## Phase 3: Business Logic Layer

Following the four-layer architecture pattern.

### 3.1 Calculators (`app/src/logic/calculators/reviews/`)

#### `calculateOverallRating.js`
```javascript
/**
 * Calculate overall rating from individual category ratings.
 * @param {Array<{rating: number}>} ratings - Array of rating objects
 * @returns {number} Average rating rounded to 1 decimal place
 */
export function calculateOverallRating({ ratings }) {
  if (!ratings || ratings.length === 0) return 0;

  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}
```

#### `calculateReviewExpiryDays.js`
```javascript
/**
 * Calculate days remaining until review window expires.
 * Review window is 14 days after stay completion.
 * @param {string} checkOutDate - Stay check-out date
 * @returns {number|null} Days remaining or null if expired
 */
export function calculateReviewExpiryDays({ checkOutDate }) {
  if (!checkOutDate) return null;

  const expiryDate = new Date(checkOutDate);
  expiryDate.setDate(expiryDate.getDate() + 14);

  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : null;
}
```

#### `calculateAverageReceivedRating.js`
```javascript
/**
 * Calculate average rating from all received reviews.
 * @param {Array<{overallRating: number}>} reviews - Array of review objects
 * @returns {number|null} Average rating or null if no reviews
 */
export function calculateAverageReceivedRating({ reviews }) {
  if (!reviews || reviews.length === 0) return null;

  const sum = reviews.reduce((acc, r) => acc + r.overallRating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
```

### 3.2 Rules (`app/src/logic/rules/reviews/`)

#### `canSubmitReview.js`
```javascript
/**
 * Determine if user can submit a review for a stay.
 * @param {Object} params
 * @param {Object} params.stay - Stay object
 * @param {string} params.userId - Current user ID
 * @param {string} params.userType - 'Host' or 'Guest'
 * @returns {boolean}
 */
export function canSubmitReview({ stay, userId, userType }) {
  if (!stay || !userId || !userType) return false;

  // Stay must be completed
  if (stay.status !== 'completed') return false;

  // Check if review already submitted
  if (userType === 'Host' && stay.reviewByHostId) return false;
  if (userType === 'Guest' && stay.reviewByGuestId) return false;

  // Check review window (14 days)
  const checkOutDate = new Date(stay.checkOutDate);
  const now = new Date();
  const daysSinceCheckout = Math.floor((now - checkOutDate) / (1000 * 60 * 60 * 24));

  return daysSinceCheckout <= 14;
}
```

#### `isReviewVisible.js`
```javascript
/**
 * Determine if a review should be visible to the user.
 * Reviews are only visible after both parties have submitted OR after window expires.
 * @param {Object} params
 * @param {Object} params.review - Review object
 * @param {Object} params.stay - Stay object
 * @returns {boolean}
 */
export function isReviewVisible({ review, stay }) {
  if (!review || !stay) return false;

  // Both reviews submitted - visible
  if (stay.reviewByHostId && stay.reviewByGuestId) return true;

  // Review window expired - visible
  const checkOutDate = new Date(stay.checkOutDate);
  const now = new Date();
  const daysSinceCheckout = Math.floor((now - checkOutDate) / (1000 * 60 * 60 * 24));

  return daysSinceCheckout > 14;
}
```

#### `hasValidRatings.js`
```javascript
/**
 * Validate that all required ratings are provided and within range.
 * @param {Object} params
 * @param {Array<{category: string, rating: number}>} params.ratings
 * @param {string} params.reviewType - 'host_reviews_guest' or 'guest_reviews_host'
 * @returns {boolean}
 */
export function hasValidRatings({ ratings, reviewType }) {
  if (!ratings || !Array.isArray(ratings)) return false;

  // All ratings must be 1-5
  const allValid = ratings.every(r =>
    r.rating >= 1 && r.rating <= 5 && typeof r.category === 'string'
  );

  if (!allValid) return false;

  // Must have at least one rating (overall is calculated)
  return ratings.length >= 1;
}
```

### 3.3 Processors (`app/src/logic/processors/reviews/`)

#### `reviewAdapter.js` (extend existing)
Add new functions to the existing file:

```javascript
/**
 * Adapt API review list to UI format for pending reviews.
 * @param {Object} params
 * @param {Array} params.apiReviews - Raw API data
 * @returns {Array} UI-formatted pending reviews
 */
export function adaptPendingReviewsFromApi({ apiReviews }) {
  if (!apiReviews) return [];

  return apiReviews.map(item => ({
    stayId: item.stay_id,
    leaseId: item.lease_id,
    listingId: item.listing_id,
    listingName: item.listing_name,
    listingImageUrl: item.listing_image_url,
    checkInDate: item.check_in_date,
    checkOutDate: item.check_out_date,
    weekNumber: item.week_number,
    revieweeId: item.reviewee_id,
    revieweeName: item.reviewee_name,
    revieweeType: item.reviewee_type,
    daysUntilExpiry: item.days_until_expiry
  }));
}

/**
 * Adapt API review list to UI format for received/submitted reviews.
 * @param {Object} params
 * @param {Array} params.apiReviews - Raw API data
 * @returns {Array} UI-formatted reviews
 */
export function adaptReviewListFromApi({ apiReviews }) {
  if (!apiReviews) return [];

  return apiReviews.map(item => ({
    reviewId: item.review_id || item._id,
    stayId: item.stay_id,
    leaseId: item.lease_id,
    listingName: item.listing_name,
    listingImageUrl: item.listing_image_url,
    checkInDate: item.check_in_date,
    checkOutDate: item.check_out_date,
    reviewerId: item.reviewer_id,
    reviewerName: item.reviewer_name,
    reviewerImageUrl: item.reviewer_image_url,
    revieweeId: item.reviewee_id,
    revieweeName: item.reviewee_name,
    revieweeImageUrl: item.reviewee_image_url,
    overallRating: item.overall_rating,
    comment: item.comment,
    wouldRecommend: item.would_recommend,
    ratingDetails: (item.rating_details || []).map(rd => ({
      category: rd.category,
      categoryLabel: rd.category_label,
      rating: rd.rating
    })),
    createdAt: item.created_at
  }));
}
```

### 3.4 Workflows (`app/src/logic/workflows/reviews/`)

#### `loadReviewsOverviewWorkflow.js`
```javascript
import { adaptPendingReviewsFromApi, adaptReviewListFromApi } from '../../processors/reviews/reviewAdapter.js';
import { calculateAverageReceivedRating } from '../../calculators/reviews/calculateAverageReceivedRating.js';

/**
 * Load all data needed for the reviews overview page.
 * @param {Object} params
 * @param {Function} params.fetchPendingReviews - API function
 * @param {Function} params.fetchReceivedReviews - API function
 * @param {Function} params.fetchSubmittedReviews - API function
 * @param {string} params.activeTab - Currently active tab
 * @returns {Promise<Object>} Loaded data
 */
export async function loadReviewsOverviewWorkflow({
  fetchPendingReviews,
  fetchReceivedReviews,
  fetchSubmittedReviews,
  activeTab = 'pending'
}) {
  const results = {
    pending: { reviews: [], totalCount: 0 },
    received: { reviews: [], totalCount: 0, averageRating: null },
    submitted: { reviews: [], totalCount: 0 },
    error: null
  };

  try {
    // Fetch data based on active tab (lazy loading)
    if (activeTab === 'pending') {
      const pendingData = await fetchPendingReviews();
      results.pending = {
        reviews: adaptPendingReviewsFromApi({ apiReviews: pendingData.data?.reviews }),
        totalCount: pendingData.data?.totalCount || 0
      };
    } else if (activeTab === 'received') {
      const receivedData = await fetchReceivedReviews();
      const reviews = adaptReviewListFromApi({ apiReviews: receivedData.data?.reviews });
      results.received = {
        reviews,
        totalCount: receivedData.data?.totalCount || 0,
        averageRating: calculateAverageReceivedRating({ reviews })
      };
    } else if (activeTab === 'submitted') {
      const submittedData = await fetchSubmittedReviews();
      results.submitted = {
        reviews: adaptReviewListFromApi({ apiReviews: submittedData.data?.reviews }),
        totalCount: submittedData.data?.totalCount || 0
      };
    }

    return results;

  } catch (error) {
    console.error('[loadReviewsOverviewWorkflow] Error:', error);
    results.error = error.message || 'Failed to load reviews';
    return results;
  }
}
```

#### `submitReviewWorkflow.js`
```javascript
import { calculateOverallRating } from '../../calculators/reviews/calculateOverallRating.js';
import { hasValidRatings } from '../../rules/reviews/hasValidRatings.js';
import { adaptReviewForSubmission } from '../../processors/reviews/reviewAdapter.js';

/**
 * Submit a review for a stay.
 * @param {Object} params
 * @param {string} params.stayId - Stay ID
 * @param {Array} params.ratings - Category ratings
 * @param {string} params.comment - Review comment
 * @param {boolean} params.wouldRecommend - Would recommend flag
 * @param {string} params.reviewType - 'host_reviews_guest' or 'guest_reviews_host'
 * @param {Function} params.createReview - API function
 * @returns {Promise<Object>} Result
 */
export async function submitReviewWorkflow({
  stayId,
  ratings,
  comment,
  wouldRecommend,
  reviewType,
  createReview
}) {
  // Validate ratings
  if (!hasValidRatings({ ratings, reviewType })) {
    throw new Error('Invalid ratings provided');
  }

  // Calculate overall rating
  const overallRating = calculateOverallRating({ ratings });

  // Prepare payload
  const payload = {
    stayId,
    overallRating,
    comment: comment?.trim() || null,
    wouldRecommend,
    ratings: ratings.map(r => ({
      category: r.category,
      rating: r.rating
    }))
  };

  // Submit review
  const response = await createReview(payload);

  if (!response.success) {
    throw new Error(response.error || 'Failed to submit review');
  }

  return response.data;
}
```

---

## Phase 4: UI Components

### 4.1 Component Tree

```
ReviewsOverviewPage/
├── ReviewsOverviewPage.jsx          # Main hollow component
├── ReviewsOverviewPage.css          # Page styles
├── useReviewsOverviewPageLogic.js   # Logic hook
├── components/
│   ├── TabNavigation.jsx            # Three-tab navigation
│   ├── TabNavigation.css
│   ├── PendingReviewCard.jsx        # Card for pending reviews
│   ├── PendingReviewCard.css
│   ├── ReceivedReviewCard.jsx       # Card for received reviews
│   ├── ReceivedReviewCard.css
│   ├── SubmittedReviewCard.jsx      # Card for submitted reviews
│   ├── SubmittedReviewCard.css
│   ├── ReviewStarDisplay.jsx        # Read-only star rating display
│   ├── ReviewStarDisplay.css
│   ├── EmptyState.jsx               # Empty state for each tab
│   ├── EmptyState.css
│   ├── RatingBreakdown.jsx          # Category rating breakdown
│   └── RatingBreakdown.css
├── modals/
│   ├── CreateReviewModal.jsx        # Modal for creating new reviews
│   ├── CreateReviewModal.css
│   ├── ViewReviewModal.jsx          # Modal for viewing review details
│   └── ViewReviewModal.css
└── index.js                         # Barrel export
```

### 4.2 Component Specifications

#### `ReviewsOverviewPage.jsx`
Main hollow component following the established pattern.

```jsx
/**
 * ReviewsOverviewPage - Hollow component (presentational only)
 *
 * All logic lives in useReviewsOverviewPageLogic hook.
 * This component only renders UI based on state from the hook.
 *
 * Three-tab interface for managing reviews:
 * - Pending: Reviews user needs to write
 * - Received: Reviews others wrote about user
 * - Submitted: Reviews user has written
 */

import React from 'react';
import { useReviewsOverviewPageLogic } from './useReviewsOverviewPageLogic';
import Header from '../../shared/Header';
import Footer from '../../shared/Footer';
import TabNavigation from './components/TabNavigation';
import PendingReviewCard from './components/PendingReviewCard';
import ReceivedReviewCard from './components/ReceivedReviewCard';
import SubmittedReviewCard from './components/SubmittedReviewCard';
import EmptyState from './components/EmptyState';
import CreateReviewModal from './modals/CreateReviewModal';
import ViewReviewModal from './modals/ViewReviewModal';
import './ReviewsOverviewPage.css';

export default function ReviewsOverviewPage() {
  const logic = useReviewsOverviewPageLogic();

  const {
    // Auth state
    authState,
    user,

    // Tab state
    activeTab,
    handleTabChange,

    // Data
    pendingReviews,
    receivedReviews,
    submittedReviews,
    averageReceivedRating,

    // Loading/error
    isLoading,
    error,
    handleRetry,

    // Modal state
    createReviewModal,
    viewReviewModal,
    handleOpenCreateReview,
    handleCloseCreateReview,
    handleSubmitReview,
    handleOpenViewReview,
    handleCloseViewReview,

    // Counts
    pendingCount,
    receivedCount,
    submittedCount
  } = logic;

  // Loading state
  if (authState.isChecking || isLoading) {
    return (
      <div className="reviews-overview-page">
        <Header />
        <main className="reviews-overview-page__container">
          <div className="reviews-overview-page__loading">
            <div className="reviews-overview-page__spinner" />
            <p>Loading reviews...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="reviews-overview-page">
        <Header />
        <main className="reviews-overview-page__container">
          <div className="reviews-overview-page__error">
            <p>{error}</p>
            <button onClick={handleRetry} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Determine which content to render based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'pending':
        return pendingReviews.length > 0 ? (
          <div className="reviews-overview-page__list">
            {pendingReviews.map(review => (
              <PendingReviewCard
                key={review.stayId}
                review={review}
                onCreateReview={() => handleOpenCreateReview(review)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="pending"
            message="You're all caught up!"
            subMessage="No pending reviews at this time."
          />
        );

      case 'received':
        return receivedReviews.length > 0 ? (
          <>
            {averageReceivedRating && (
              <div className="reviews-overview-page__summary">
                <span className="reviews-overview-page__average-label">Your Average Rating</span>
                <span className="reviews-overview-page__average-value">{averageReceivedRating}</span>
                <span className="reviews-overview-page__average-stars">/ 5</span>
              </div>
            )}
            <div className="reviews-overview-page__list">
              {receivedReviews.map(review => (
                <ReceivedReviewCard
                  key={review.reviewId}
                  review={review}
                  onViewDetails={() => handleOpenViewReview(review)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            type="received"
            message="No reviews yet"
            subMessage="Reviews from hosts/guests will appear here after your stays."
          />
        );

      case 'submitted':
        return submittedReviews.length > 0 ? (
          <div className="reviews-overview-page__list">
            {submittedReviews.map(review => (
              <SubmittedReviewCard
                key={review.reviewId}
                review={review}
                onViewDetails={() => handleOpenViewReview(review)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="submitted"
            message="No reviews submitted"
            subMessage="Your submitted reviews will appear here."
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="reviews-overview-page">
      <Header />

      <main className="reviews-overview-page__container">
        <header className="reviews-overview-page__header">
          <h1 className="reviews-overview-page__title">Reviews</h1>
        </header>

        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={{
            pending: pendingCount,
            received: receivedCount,
            submitted: submittedCount
          }}
        />

        <section className="reviews-overview-page__content">
          {renderTabContent()}
        </section>
      </main>

      <Footer />

      {/* Create Review Modal */}
      {createReviewModal.isOpen && (
        <CreateReviewModal
          isOpen={createReviewModal.isOpen}
          review={createReviewModal.review}
          userType={user?.userType}
          onClose={handleCloseCreateReview}
          onSubmit={handleSubmitReview}
        />
      )}

      {/* View Review Modal */}
      {viewReviewModal.isOpen && (
        <ViewReviewModal
          isOpen={viewReviewModal.isOpen}
          review={viewReviewModal.review}
          onClose={handleCloseViewReview}
        />
      )}
    </div>
  );
}
```

#### `TabNavigation.jsx`
Tab navigation component with badge counts.

```jsx
import React from 'react';
import { Clock, MessageSquare, CheckCircle } from 'lucide-react';
import './TabNavigation.css';

const TABS = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'received', label: 'Received', icon: MessageSquare },
  { id: 'submitted', label: 'Submitted', icon: CheckCircle }
];

export default function TabNavigation({ activeTab, onTabChange, counts }) {
  return (
    <nav className="reviews-tab-nav">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const count = counts[tab.id] || 0;

        return (
          <button
            key={tab.id}
            className={`reviews-tab-nav__tab ${activeTab === tab.id ? 'reviews-tab-nav__tab--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-selected={activeTab === tab.id}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
            {count > 0 && (
              <span className="reviews-tab-nav__badge">{count}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
```

#### `PendingReviewCard.jsx`
Card for pending reviews with "Create Review" action.

```jsx
import React from 'react';
import { Calendar, Star, Clock } from 'lucide-react';
import './PendingReviewCard.css';

export default function PendingReviewCard({ review, onCreateReview }) {
  const {
    listingName,
    listingImageUrl,
    checkInDate,
    checkOutDate,
    weekNumber,
    revieweeName,
    revieweeType,
    daysUntilExpiry
  } = review;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <article className="pending-review-card">
      <div className="pending-review-card__image">
        {listingImageUrl ? (
          <img src={listingImageUrl} alt={listingName} />
        ) : (
          <div className="pending-review-card__image-placeholder" />
        )}
      </div>

      <div className="pending-review-card__content">
        <h3 className="pending-review-card__title">{listingName}</h3>

        <div className="pending-review-card__meta">
          <span className="pending-review-card__dates">
            <Calendar size={14} />
            {formatDate(checkInDate)} - {formatDate(checkOutDate)}
          </span>
          {weekNumber && (
            <span className="pending-review-card__week">Week {weekNumber}</span>
          )}
        </div>

        <p className="pending-review-card__reviewee">
          Review for: <strong>{revieweeName}</strong> ({revieweeType})
        </p>

        {daysUntilExpiry && (
          <div className="pending-review-card__expiry">
            <Clock size={14} />
            <span>{daysUntilExpiry} days left to review</span>
          </div>
        )}
      </div>

      <div className="pending-review-card__actions">
        <button
          className="btn btn-primary"
          onClick={onCreateReview}
        >
          <Star size={16} />
          Create Review
        </button>
      </div>
    </article>
  );
}
```

#### `ReceivedReviewCard.jsx`
Card for received reviews with star rating display.

```jsx
import React from 'react';
import { Calendar, Eye, User } from 'lucide-react';
import ReviewStarDisplay from './ReviewStarDisplay';
import './ReceivedReviewCard.css';

export default function ReceivedReviewCard({ review, onViewDetails }) {
  const {
    listingName,
    listingImageUrl,
    checkInDate,
    checkOutDate,
    reviewerName,
    reviewerImageUrl,
    overallRating,
    comment,
    createdAt
  } = review;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <article className="received-review-card">
      <div className="received-review-card__header">
        <div className="received-review-card__reviewer">
          {reviewerImageUrl ? (
            <img src={reviewerImageUrl} alt={reviewerName} className="received-review-card__avatar" />
          ) : (
            <div className="received-review-card__avatar-placeholder">
              <User size={20} />
            </div>
          )}
          <div className="received-review-card__reviewer-info">
            <span className="received-review-card__reviewer-name">{reviewerName}</span>
            <span className="received-review-card__date">{formatDate(createdAt)}</span>
          </div>
        </div>

        <ReviewStarDisplay rating={overallRating} />
      </div>

      <div className="received-review-card__listing">
        <Calendar size={14} />
        <span>{listingName} ({formatDate(checkInDate)} - {formatDate(checkOutDate)})</span>
      </div>

      {comment && (
        <p className="received-review-card__comment">
          "{comment.length > 150 ? `${comment.substring(0, 150)}...` : comment}"
        </p>
      )}

      <button
        className="received-review-card__view-btn"
        onClick={onViewDetails}
      >
        <Eye size={16} />
        View Full Review
      </button>
    </article>
  );
}
```

#### `CreateReviewModal.jsx`
Modal for creating new reviews with star rating input.

```jsx
import React, { useState, useEffect } from 'react';
import { X, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { REVIEW_CATEGORIES } from '../../../../logic/constants/reviewCategories.js';
import { GUEST_REVIEW_CATEGORIES } from '../../../../logic/constants/guestReviewCategories.js';
import './CreateReviewModal.css';

function StarRatingInput({ value, onChange, label, question }) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="star-rating-input">
      <label className="star-rating-input__label">{label}</label>
      {question && <p className="star-rating-input__question">{question}</p>}
      <div className="star-rating-input__stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-rating-input__star ${star <= (hoverValue || value) ? 'star-rating-input__star--filled' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star size={24} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CreateReviewModal({ isOpen, review, userType, onClose, onSubmit }) {
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get categories based on user type
  const categories = userType === 'Host' ? REVIEW_CATEGORIES : GUEST_REVIEW_CATEGORIES;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRatings({});
      setComment('');
      setWouldRecommend(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRatingChange = (categoryId, value) => {
    setRatings(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate at least one rating
    if (Object.keys(ratings).length === 0) {
      return;
    }

    setIsSubmitting(true);

    const ratingsArray = Object.entries(ratings).map(([category, rating]) => ({
      category,
      rating
    }));

    try {
      await onSubmit({
        stayId: review.stayId,
        ratings: ratingsArray,
        comment: comment.trim(),
        wouldRecommend
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="create-review-modal__backdrop" onClick={handleBackdropClick}>
      <div className="create-review-modal" role="dialog" aria-modal="true">
        <header className="create-review-modal__header">
          <h2>Review {review.revieweeName}</h2>
          <button className="create-review-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <form className="create-review-modal__body" onSubmit={handleSubmit}>
          <div className="create-review-modal__context">
            <p>{review.listingName}</p>
            <p className="create-review-modal__dates">
              {new Date(review.checkInDate).toLocaleDateString()} - {new Date(review.checkOutDate).toLocaleDateString()}
            </p>
          </div>

          <div className="create-review-modal__ratings">
            {categories.map(category => (
              <StarRatingInput
                key={category.id}
                value={ratings[category.id] || 0}
                onChange={(value) => handleRatingChange(category.id, value)}
                label={category.title}
                question={category.question}
              />
            ))}
          </div>

          <div className="create-review-modal__comment">
            <label htmlFor="review-comment">Written Review (Optional)</label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              maxLength={1000}
            />
            <span className="create-review-modal__char-count">{comment.length}/1000</span>
          </div>

          <div className="create-review-modal__recommend">
            <label>Would you recommend?</label>
            <div className="create-review-modal__recommend-buttons">
              <button
                type="button"
                className={`create-review-modal__recommend-btn ${wouldRecommend === true ? 'create-review-modal__recommend-btn--yes' : ''}`}
                onClick={() => setWouldRecommend(true)}
              >
                <ThumbsUp size={18} />
                Yes
              </button>
              <button
                type="button"
                className={`create-review-modal__recommend-btn ${wouldRecommend === false ? 'create-review-modal__recommend-btn--no' : ''}`}
                onClick={() => setWouldRecommend(false)}
              >
                <ThumbsDown size={18} />
                No
              </button>
            </div>
          </div>
        </form>

        <footer className="create-review-modal__footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(ratings).length === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </footer>
      </div>
    </div>
  );
}
```

---

## Phase 5: Page Assembly

### 5.1 Logic Hook (`useReviewsOverviewPageLogic.js`)

```javascript
/**
 * Reviews Overview Page Logic Hook
 *
 * Follows the Hollow Component Pattern:
 * - This hook contains ALL business logic
 * - The component contains ONLY JSX rendering
 *
 * Features:
 * - Authentication check (any authenticated user)
 * - Tab navigation state
 * - Fetch reviews by tab (lazy loading)
 * - Create review modal management
 * - View review modal management
 */

import { useState, useEffect, useCallback } from 'react';
import { checkAuthStatus, validateTokenAndFetchUser } from '../../../lib/auth.js';
import { supabase } from '../../../lib/supabase.js';
import { useToast } from '../../shared/Toast';
import { loadReviewsOverviewWorkflow } from '../../../logic/workflows/reviews/loadReviewsOverviewWorkflow.js';
import { submitReviewWorkflow } from '../../../logic/workflows/reviews/submitReviewWorkflow.js';

// API functions
async function fetchPendingReviews() {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reviews-overview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({ action: 'get_pending_reviews', payload: {} })
  });
  return response.json();
}

async function fetchReceivedReviews(limit = 20, offset = 0) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reviews-overview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({ action: 'get_received_reviews', payload: { limit, offset } })
  });
  return response.json();
}

async function fetchSubmittedReviews(limit = 20, offset = 0) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reviews-overview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({ action: 'get_submitted_reviews', payload: { limit, offset } })
  });
  return response.json();
}

async function createReview(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reviews-overview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({ action: 'create_review', payload })
  });
  return response.json();
}

export function useReviewsOverviewPageLogic() {
  const { showToast } = useToast();

  // Auth state
  const [authState, setAuthState] = useState({
    isChecking: true,
    isAuthenticated: false,
    shouldRedirect: false,
    redirectReason: null
  });

  // User state
  const [user, setUser] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('pending');

  // Data state
  const [pendingReviews, setPendingReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [averageReceivedRating, setAverageReceivedRating] = useState(null);

  // Counts (for badges)
  const [pendingCount, setPendingCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);

  // Loading/error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [createReviewModal, setCreateReviewModal] = useState({
    isOpen: false,
    review: null
  });
  const [viewReviewModal, setViewReviewModal] = useState({
    isOpen: false,
    review: null
  });

  // ============================================================================
  // AUTHENTICATION CHECK
  // ============================================================================

  useEffect(() => {
    async function checkAuth() {
      console.log('🔐 Reviews Overview: Checking authentication...');

      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        console.log('❌ Reviews Overview: User not authenticated, redirecting');
        setAuthState({
          isChecking: false,
          isAuthenticated: false,
          shouldRedirect: true,
          redirectReason: 'NOT_AUTHENTICATED'
        });
        window.location.href = '/';
        return;
      }

      const userData = await validateTokenAndFetchUser({ clearOnFailure: false });

      if (userData) {
        console.log('✅ Reviews Overview: User authenticated:', userData.userType);
        setUser(userData);
        setAuthState({
          isChecking: false,
          isAuthenticated: true,
          shouldRedirect: false,
          redirectReason: null
        });
      } else {
        // Fallback to session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser({
            _id: session.user.id,
            email: session.user.email,
            firstName: session.user.user_metadata?.first_name || 'User',
            lastName: session.user.user_metadata?.last_name || '',
            userType: session.user.user_metadata?.user_type
          });
          setAuthState({
            isChecking: false,
            isAuthenticated: true,
            shouldRedirect: false,
            redirectReason: null
          });
        } else {
          window.location.href = '/';
        }
      }
    }

    checkAuth();
  }, []);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const loadTabData = useCallback(async (tab) => {
    if (authState.isChecking || authState.shouldRedirect || !user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await loadReviewsOverviewWorkflow({
        fetchPendingReviews,
        fetchReceivedReviews,
        fetchSubmittedReviews,
        activeTab: tab
      });

      if (results.error) {
        throw new Error(results.error);
      }

      if (tab === 'pending') {
        setPendingReviews(results.pending.reviews);
        setPendingCount(results.pending.totalCount);
      } else if (tab === 'received') {
        setReceivedReviews(results.received.reviews);
        setReceivedCount(results.received.totalCount);
        setAverageReceivedRating(results.received.averageRating);
      } else if (tab === 'submitted') {
        setSubmittedReviews(results.submitted.reviews);
        setSubmittedCount(results.submitted.totalCount);
      }

    } catch (err) {
      console.error('❌ Reviews Overview: Error loading data:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [authState.isChecking, authState.shouldRedirect, user]);

  // Load data when auth completes or tab changes
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleRetry = useCallback(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  const handleOpenCreateReview = useCallback((review) => {
    setCreateReviewModal({ isOpen: true, review });
  }, []);

  const handleCloseCreateReview = useCallback(() => {
    setCreateReviewModal({ isOpen: false, review: null });
  }, []);

  const handleSubmitReview = useCallback(async (formData) => {
    try {
      const reviewType = user?.userType === 'Host' ? 'host_reviews_guest' : 'guest_reviews_host';

      await submitReviewWorkflow({
        stayId: formData.stayId,
        ratings: formData.ratings,
        comment: formData.comment,
        wouldRecommend: formData.wouldRecommend,
        reviewType,
        createReview
      });

      showToast({
        title: 'Review Submitted',
        message: 'Thank you for your feedback!',
        type: 'success'
      });

      handleCloseCreateReview();

      // Refresh pending reviews
      loadTabData('pending');

    } catch (err) {
      console.error('❌ Reviews Overview: Error submitting review:', err);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to submit review. Please try again.',
        type: 'error'
      });
    }
  }, [user, showToast, handleCloseCreateReview, loadTabData]);

  const handleOpenViewReview = useCallback((review) => {
    setViewReviewModal({ isOpen: true, review });
  }, []);

  const handleCloseViewReview = useCallback(() => {
    setViewReviewModal({ isOpen: false, review: null });
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Auth state
    authState,
    user,

    // Tab state
    activeTab,
    handleTabChange,

    // Data
    pendingReviews,
    receivedReviews,
    submittedReviews,
    averageReceivedRating,

    // Counts
    pendingCount,
    receivedCount,
    submittedCount,

    // Loading/error
    isLoading,
    error,
    handleRetry,

    // Modal state
    createReviewModal,
    viewReviewModal,
    handleOpenCreateReview,
    handleCloseCreateReview,
    handleSubmitReview,
    handleOpenViewReview,
    handleCloseViewReview
  };
}
```

### 5.2 Route Configuration

Add to `app/src/routes.config.js`:

```javascript
// ===== REVIEWS OVERVIEW =====
{
  path: '/reviews-overview',
  file: 'reviews-overview.html',
  aliases: ['/reviews-overview.html', '/reviews', '/my-reviews'],
  protected: true,
  cloudflareInternal: true,
  internalName: 'reviews-overview-view',
  hasDynamicSegment: false
},
```

---

## Implementation Order

### Step 1: Database Schema (Day 1)
1. Create migration file `20260127_create_review_tables.sql`
2. Run migration locally with `supabase db reset`
3. Verify tables created correctly
4. Add indexes for performance

### Step 2: Constants and Logic Layer (Day 1)
1. Create `app/src/logic/constants/guestReviewCategories.js` (Guest reviewing Host categories)
2. Create `app/src/logic/calculators/reviews/calculateOverallRating.js`
3. Create `app/src/logic/calculators/reviews/calculateReviewExpiryDays.js`
4. Create `app/src/logic/calculators/reviews/calculateAverageReceivedRating.js`
5. Create `app/src/logic/rules/reviews/canSubmitReview.js`
6. Create `app/src/logic/rules/reviews/isReviewVisible.js`
7. Create `app/src/logic/rules/reviews/hasValidRatings.js`
8. Extend `app/src/logic/processors/reviews/reviewAdapter.js`
9. Create `app/src/logic/workflows/reviews/loadReviewsOverviewWorkflow.js`
10. Create `app/src/logic/workflows/reviews/submitReviewWorkflow.js`

### Step 3: Edge Function (Day 2)
1. Create `supabase/functions/reviews-overview/index.ts`
2. Create `supabase/functions/reviews-overview/deno.json`
3. Create `supabase/functions/reviews-overview/handlers/getPendingReviews.ts`
4. Create `supabase/functions/reviews-overview/handlers/getReceivedReviews.ts`
5. Create `supabase/functions/reviews-overview/handlers/getSubmittedReviews.ts`
6. Create `supabase/functions/reviews-overview/handlers/createReview.ts`
7. Create `supabase/functions/reviews-overview/handlers/getReviewDetails.ts`
8. Create `supabase/functions/reviews-overview/lib/queries.ts`
9. Create `supabase/functions/reviews-overview/lib/transformers.ts`
10. Create `supabase/functions/reviews-overview/lib/validators.ts`
11. Test locally with `supabase functions serve reviews-overview`

### Step 4: UI Components (Day 3)
1. Create `app/src/islands/pages/ReviewsOverviewPage/` directory
2. Create `TabNavigation.jsx` and `TabNavigation.css`
3. Create `ReviewStarDisplay.jsx` and `ReviewStarDisplay.css`
4. Create `EmptyState.jsx` and `EmptyState.css`
5. Create `RatingBreakdown.jsx` and `RatingBreakdown.css`
6. Create `PendingReviewCard.jsx` and `PendingReviewCard.css`
7. Create `ReceivedReviewCard.jsx` and `ReceivedReviewCard.css`
8. Create `SubmittedReviewCard.jsx` and `SubmittedReviewCard.css`

### Step 5: Modals (Day 3-4)
1. Create `CreateReviewModal.jsx` and `CreateReviewModal.css`
2. Create `ViewReviewModal.jsx` and `ViewReviewModal.css`

### Step 6: Page Assembly (Day 4)
1. Create `ReviewsOverviewPage.jsx`
2. Create `ReviewsOverviewPage.css`
3. Create `useReviewsOverviewPageLogic.js`
4. Create `index.js` (barrel export)

### Step 7: Routing and Entry Points (Day 4)
1. Create `app/public/reviews-overview.html`
2. Create `app/src/reviews-overview.jsx` (entry point)
3. Add route to `app/src/routes.config.js`
4. Run `bun run generate-routes`

### Step 8: Testing and Integration (Day 5)
1. Test all Edge Function actions with Postman/curl
2. Test UI with mock data
3. Test full integration with live data
4. Test responsive design
5. Test error states and edge cases
6. Deploy Edge Function with `supabase functions deploy reviews-overview`

---

## Files to Create

### Database
- `supabase/migrations/20260127_create_review_tables.sql`

### Edge Function
- `supabase/functions/reviews-overview/index.ts`
- `supabase/functions/reviews-overview/deno.json`
- `supabase/functions/reviews-overview/handlers/getPendingReviews.ts`
- `supabase/functions/reviews-overview/handlers/getReceivedReviews.ts`
- `supabase/functions/reviews-overview/handlers/getSubmittedReviews.ts`
- `supabase/functions/reviews-overview/handlers/createReview.ts`
- `supabase/functions/reviews-overview/handlers/getReviewDetails.ts`
- `supabase/functions/reviews-overview/lib/queries.ts`
- `supabase/functions/reviews-overview/lib/transformers.ts`
- `supabase/functions/reviews-overview/lib/validators.ts`

### Business Logic
- `app/src/logic/constants/guestReviewCategories.js`
- `app/src/logic/calculators/reviews/calculateOverallRating.js`
- `app/src/logic/calculators/reviews/calculateReviewExpiryDays.js`
- `app/src/logic/calculators/reviews/calculateAverageReceivedRating.js`
- `app/src/logic/rules/reviews/canSubmitReview.js`
- `app/src/logic/rules/reviews/isReviewVisible.js`
- `app/src/logic/rules/reviews/hasValidRatings.js`
- `app/src/logic/workflows/reviews/loadReviewsOverviewWorkflow.js`
- `app/src/logic/workflows/reviews/submitReviewWorkflow.js`

### UI Components
- `app/src/islands/pages/ReviewsOverviewPage/ReviewsOverviewPage.jsx`
- `app/src/islands/pages/ReviewsOverviewPage/ReviewsOverviewPage.css`
- `app/src/islands/pages/ReviewsOverviewPage/useReviewsOverviewPageLogic.js`
- `app/src/islands/pages/ReviewsOverviewPage/index.js`
- `app/src/islands/pages/ReviewsOverviewPage/components/TabNavigation.jsx`
- `app/src/islands/pages/ReviewsOverviewPage/components/TabNavigation.css`
- `app/src/islands/pages/ReviewsOverviewPage/components/PendingReviewCard.jsx`
- `app/src/islands/pages/ReviewsOverviewPage/components/PendingReviewCard.css`
- `app/src/islands/pages/ReviewsOverviewPage/components/ReceivedReviewCard.jsx`
- `app/src/islands/pages/ReviewsOverviewPage/components/ReceivedReviewCard.css`
- `app/src/islands/pages/ReviewsOverviewPage/components/SubmittedReviewCard.jsx`
- `app/src/islands/pages/ReviewsOverviewPage/components/SubmittedReviewCard.css`
- `app/src/islands/pages/ReviewsOverviewPage/components/ReviewStarDisplay.jsx`
- `app/src/islands/pages/ReviewsOverviewPage/components/ReviewStarDisplay.css`
- `app/src/islands/pages/ReviewsOverviewPage/components/EmptyState.jsx`
- `app/src/islands/pages/ReviewsOverviewPage/components/EmptyState.css`
- `app/src/islands/pages/ReviewsOverviewPage/components/RatingBreakdown.jsx`
- `app/src/islands/pages/ReviewsOverviewPage/components/RatingBreakdown.css`
- `app/src/islands/pages/ReviewsOverviewPage/modals/CreateReviewModal.jsx`
- `app/src/islands/pages/ReviewsOverviewPage/modals/CreateReviewModal.css`
- `app/src/islands/pages/ReviewsOverviewPage/modals/ViewReviewModal.jsx`
- `app/src/islands/pages/ReviewsOverviewPage/modals/ViewReviewModal.css`

### Entry Points
- `app/public/reviews-overview.html`
- `app/src/reviews-overview.jsx`

---

## Files to Modify

### Route Configuration
- `app/src/routes.config.js` - Add reviews-overview route

### Logic Layer (extend existing)
- `app/src/logic/processors/reviews/reviewAdapter.js` - Add new adapter functions

### Navigation (optional future enhancement)
- `app/src/islands/shared/AdminHeader/config/navigationConfig.js` - Add Reviews link to admin nav
- `app/src/islands/shared/Header.jsx` - Add Reviews link to user dropdown menu

---

## Dependencies and References

### Existing Components to Reference
- `app/src/islands/pages/HostLeasesPage/modals/GuestReviewModal.jsx` - Star rating pattern
- `app/src/islands/pages/guest-leases/StaysTable.jsx` - Star icon usage
- `app/src/islands/pages/guest-leases/LeaseCard.jsx` - Expandable card pattern
- `app/src/islands/pages/HostLeasesPage/components/EmptyState.jsx` - Empty state pattern
- `app/src/islands/pages/ListingDashboardPage/components/NavigationHeader.jsx` - Tab navigation
- `app/src/logic/constants/reviewCategories.js` - Host review categories

### Existing Logic to Reference
- `app/src/logic/processors/reviews/reviewAdapter.js` - Review data transformation
- `app/src/logic/rules/reviews/reviewValidation.js` - Review validation rules

### Edge Function Patterns to Follow
- `supabase/functions/experience-survey/index.ts` - Similar survey submission pattern
- `supabase/functions/lease/index.ts` - Standard action-based routing

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-27 | Claude | Initial plan creation |
