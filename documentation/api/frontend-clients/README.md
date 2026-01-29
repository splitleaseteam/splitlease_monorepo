# Frontend API Clients

Complete reference for frontend API client modules in the Split Lease application.

---

## Overview

The Split Lease frontend uses a modular API client architecture located in `app/src/lib/`. All API calls go through Supabase Edge Functions, never directly to external APIs.

**Location**: `app/src/lib/`

**Key Modules**:
- `auth.js` - Authentication operations
- `supabase.js` - Supabase client initialization
- `bubbleAPI.js` - Bubble API proxy (deprecated, use Edge Functions)
- `secureStorage.js` - Encrypted localStorage wrapper

---

## Core API Clients

### supabase.js

**Location**: `app/src/lib/supabase.js`

**Description**: Supabase client initialization and configuration.

**Exports**:
```javascript
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**Usage**:
```javascript
import { supabase } from 'lib/supabase.js';

// Query database
const { data, error } = await supabase
  .from('listing')
  .select('*')
  .eq('_id', listingId);

// Auth operations
const { data: { session } } = await supabase.auth.getSession();
```

---

### auth.js

**Location**: `app/src/lib/auth.js`

**Description**: Authentication and session management functions.

**Key Exports**:

#### loginUser(email, password)

Authenticate user with email/password.

**Parameters**:
- `email` (string): User email
- `password` (string): User password

**Returns**: Promise<Object>
```javascript
{
  success: boolean,
  user_id?: string,
  supabase_user_id?: string,
  user_type?: 'Host' | 'Guest',
  host_account_id?: string,
  guest_account_id?: string,
  expires_in?: number,
  error?: string
}
```

**Example**:
```javascript
import { loginUser } from 'lib/auth.js';

const result = await loginUser('john@example.com', 'password123');

if (result.success) {
  console.log('Logged in as:', result.user_type);
  console.log('User ID:', result.user_id);
} else {
  console.error('Login failed:', result.error);
}
```

---

#### signupUser(email, password, retype, additionalData)

Register new user account.

**Parameters**:
- `email` (string): User email
- `password` (string): User password (min 4 characters)
- `retype` (string): Password confirmation
- `additionalData` (Object, optional):
  - `firstName` (string): User's first name
  - `lastName` (string): User's last name
  - `userType` (string): 'Host' or 'Guest'
  - `birthDate` (string): ISO date string
  - `phoneNumber` (string): Phone number

**Returns**: Promise<Object>
```javascript
{
  success: boolean,
  user_id?: string,
  supabase_user_id?: string,
  user_type?: string,
  error?: string
}
```

**Example**:
```javascript
import { signupUser } from 'lib/auth.js';

const result = await signupUser(
  'john@example.com',
  'password123',
  'password123',
  {
    firstName: 'John',
    lastName: 'Doe',
    userType: 'Guest',
    birthDate: '1990-01-01',
    phoneNumber: '+1234567890'
  }
);

if (result.success) {
  console.log('Account created:', result.user_id);
} else {
  console.error('Signup failed:', result.error);
}
```

---

#### logoutUser()

Logout current user and clear session.

**Returns**: Promise<Object>
```javascript
{
  success: boolean,
  message?: string
}
```

**Example**:
```javascript
import { logoutUser } from 'lib/auth.js';

await logoutUser();
// User logged out, redirected if needed
```

---

#### checkAuthStatus()

Check if user is authenticated.

**Returns**: Promise<boolean>

**Example**:
```javascript
import { checkAuthStatus } from 'lib/auth.js';

const isAuthenticated = await checkAuthStatus();

if (isAuthenticated) {
  console.log('User is logged in');
} else {
  console.log('User is not logged in');
}
```

---

#### validateTokenAndFetchUser(options)

Validate token and fetch user data.

**Parameters**:
- `options` (Object, optional):
  - `clearOnFailure` (boolean): Clear auth data on validation failure (default: true)

**Returns**: Promise<Object|null>
```javascript
{
  userId: string,
  firstName: string | null,
  fullName: string | null,
  email: string | null,
  profilePhoto: string | null,
  userType: string | null,
  accountHostId: string | null,
  aboutMe: string | null,
  needForSpace: string | null,
  specialNeeds: string | null,
  proposalCount: number,
  hasSubmittedRentalApp: boolean,
  isUsabilityTester: boolean,
  phoneNumber: string | null
}
```

**Example**:
```javascript
import { validateTokenAndFetchUser } from 'lib/auth.js';

const userData = await validateTokenAndFetchUser();

if (userData) {
  console.log('User:', userData.fullName);
  console.log('Type:', userData.userType);
  console.log('Proposals:', userData.proposalCount);
}
```

---

#### initiateLinkedInOAuth(userType)

Initiate LinkedIn OAuth signup flow.

**Parameters**:
- `userType` (string): 'Host' or 'Guest'

**Returns**: Promise<Object>

**Example**:
```javascript
import { initiateLinkedInOAuth } from 'lib/auth.js';

await initiateLinkedInOAuth('Guest');
// Redirects to LinkedIn
```

---

#### handleLinkedInOAuthCallback()

Handle LinkedIn OAuth callback after redirect.

**Returns**: Promise<Object>

**Example**:
```javascript
import { handleLinkedInOAuthCallback } from 'lib/auth.js';

const result = await handleLinkedInOAuthCallback();

if (result.success) {
  console.log('LinkedIn signup successful:', result.data.user_id);
  console.log('Is new user:', result.isNewUser);
} else if (result.isDuplicate) {
  console.log('Email already exists:', result.existingEmail);
}
```

---

#### requestPasswordReset(email)

Send password reset email.

**Parameters**:
- `email` (string): User email

**Returns**: Promise<Object>
```javascript
{
  success: boolean,
  message: string
}
```

**Example**:
```javascript
import { requestPasswordReset } from 'lib/auth.js';

await requestPasswordReset('john@example.com');
console.log('If an account exists, a reset link has been sent.');
```

---

#### updatePassword(newPassword)

Update password after clicking reset link.

**Parameters**:
- `newPassword` (string): New password (min 4 characters)

**Returns**: Promise<Object>

**Example**:
```javascript
import { updatePassword } from 'lib/auth.js';

const result = await updatePassword('new_password123');

if (result.success) {
  console.log('Password updated successfully');
} else {
  console.error('Update failed:', result.error);
}
```

---

### secureStorage.js

**Location**: `app/src/lib/secureStorage.js`

**Description**: Encrypted localStorage wrapper for sensitive data.

**Key Exports**:

#### setSecureItem(key, value)

Store encrypted value in localStorage.

**Parameters**:
- `key` (string): Storage key
- `value` (string): Value to encrypt and store

**Example**:
```javascript
import { setSecureItem } from 'lib/secureStorage.js';

setSecureItem('splitlease_auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
```

---

#### getSecureItem(key)

Retrieve and decrypt value from localStorage.

**Parameters**:
- `key` (string): Storage key

**Returns**: string | null

**Example**:
```javascript
import { getSecureItem } from 'lib/secureStorage.js';

const token = getSecureItem('splitlease_auth_token');
```

---

#### removeSecureItem(key)

Remove encrypted value from localStorage.

**Parameters**:
- `key` (string): Storage key

**Example**:
```javascript
import { removeSecureItem } from 'lib/secureStorage.js';

removeSecureItem('splitlease_auth_token');
```

---

### dataLookups.js

**Location**: `app/src/lib/dataLookups.js`

**Description**: Fetch reference data from Supabase tables.

**Key Exports**:

#### fetchBoroughs()

Fetch all NYC boroughs.

**Returns**: Promise<Array<Object>>

**Example**:
```javascript
import { fetchBoroughs } from 'lib/dataLookups.js';

const boroughs = await fetchBoroughs();
// [{ _id: 'borough_1', name: 'Manhattan' }, ...]
```

---

#### fetchNeighborhoods(boroughId)

Fetch neighborhoods for a borough.

**Parameters**:
- `boroughId` (string, optional): Filter by borough

**Returns**: Promise<Array<Object>>

**Example**:
```javascript
import { fetchNeighborhoods } from 'lib/dataLookups.js';

const neighborhoods = await fetchNeighborhoods('borough_1');
```

---

#### fetchAmenities()

Fetch all amenities.

**Returns**: Promise<Array<Object>>

**Example**:
```javascript
import { fetchAmenities } from 'lib/dataLookups.js';

const amenities = await fetchAmenities();
```

---

### bubbleAPI.js

**Location**: `app/src/lib/bubbleAPI.js`

**Description**: Bubble API proxy client (DEPRECATED - use Edge Functions instead).

**Status**: ⚠️ Deprecated - All Bubble API calls should go through Edge Functions

**Migration**: Replace Bubble API calls with Edge Function calls:
```javascript
// OLD (deprecated)
import { bubbleAPI } from 'lib/bubbleAPI.js';
const listing = await bubbleAPI.getListing(listingId);

// NEW (use Edge Functions)
const response = await fetch(`${SUPABASE_URL}/functions/v1/listing`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get',
    payload: { listingId }
  })
});
const result = await response.json();
```

---

## Specialized Clients

### proposalDataFetcher.js

**Location**: `app/src/lib/proposalDataFetcher.js`

**Description**: Fetch proposal data with related entities.

**Key Exports**:

#### fetchProposalData(proposalId)

Fetch proposal with listing, user, and meeting data.

**Parameters**:
- `proposalId` (string): Proposal ID

**Returns**: Promise<Object>

**Example**:
```javascript
import { fetchProposalData } from 'lib/proposalDataFetcher.js';

const proposal = await fetchProposalData('proposal_abc123');
console.log('Proposal:', proposal);
console.log('Listing:', proposal.listing);
console.log('Guest:', proposal.guest);
console.log('Host:', proposal.host);
```

---

### listingDataFetcher.js

**Location**: `app/src/lib/listingDataFetcher.js`

**Description**: Fetch listing data from Supabase.

**Key Exports**:

#### fetchListingById(listingId)

Fetch listing by ID.

**Parameters**:
- `listingId` (string): Listing ID

**Returns**: Promise<Object>

**Example**:
```javascript
import { fetchListingById } from 'lib/listingDataFetcher.js';

const listing = await fetchListingById('listing_abc123');
```

---

### listingService.js

**Location**: `app/src/lib/listingService.js`

**Description**: Listing business operations.

**Key Exports**:

#### createListing(listingData)

Create new listing.

**Parameters**:
- `listingData` (Object): Listing data

**Returns**: Promise<Object>

**Example**:
```javascript
import { createListing } from 'lib/listingService.js';

const listing = await createListing({
  title: 'Beautiful Brooklyn Apartment',
  baseNightlyRate: 150,
  availableDays: [1, 2, 3, 4, 5]
});
```

---

## Utility Modules

### constants.js

**Location**: `app/src/lib/constants.js`

**Description**: Application-wide constants.

**Key Exports**:

#### DAYS

Day of week constants (JavaScript 0-based).

```javascript
export const DAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};
```

---

#### DAY_NAMES

Day name array.

```javascript
export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];
```

---

#### SCHEDULE_PATTERNS

Schedule pattern constants.

```javascript
export const SCHEDULE_PATTERNS = {
  FULL_WEEK: [0, 1, 2, 3, 4, 5, 6],
  WEEKDAYS: [1, 2, 3, 4, 5],
  WEEKENDS: [0, 6]
};
```

---

#### PRICE_TIERS

Price tier ranges.

```javascript
export const PRICE_TIERS = {
  BUDGET: { min: 0, max: 100 },
  STANDARD: { min: 100, max: 200 },
  PREMIUM: { min: 200, max: Infinity }
};
```

---

### urlParams.js

**Location**: `app/src/lib/urlParams.js`

**Description**: URL parameter parsing utilities.

**Key Exports**:

#### getUrlParam(name)

Get URL parameter value.

**Parameters**:
- `name` (string): Parameter name

**Returns**: string | null

**Example**:
```javascript
import { getUrlParam } from 'lib/urlParams.js';

const proposalId = getUrlParam('proposalId');
```

---

#### setUrlParams(params)

Set URL parameters.

**Parameters**:
- `params` (Object): Parameter key-value pairs

**Example**:
```javascript
import { setUrlParams } from 'lib/urlParams.js';

setUrlParams({ proposalId: 'abc123', status: 'pending' });
// URL becomes: ?proposalId=abc123&status=pending
```

---

### slackService.js

**Location**: `app/src/lib/slackService.js`

**Description**: Slack notification integration.

**Key Exports**:

#### sendSlackNotification(message, channel)

Send notification to Slack.

**Parameters**:
- `message` (string): Message text
- `channel` (string): Slack channel

**Returns**: Promise<boolean>

**Example**:
```javascript
import { sendSlackNotification } from 'lib/slackService.js';

await sendSlackNotification('New proposal created!', '#acquisition');
```

---

## Integration Patterns

### Making Authenticated Requests

All authenticated requests should use the access token from secure storage:

```javascript
import { supabase } from 'lib/supabase.js';

// Get current session
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  // Redirect to login
  window.location.href = '/signup-login';
  return;
}

// Make authenticated request
const response = await fetch('/functions/v1/proposal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'create',
    payload: { /* data */ }
  })
});

const result = await response.json();
```

---

### Error Handling Pattern

Use consistent error handling across all API calls:

```javascript
import { supabase } from 'lib/supabase.js';

async function makeApiCall(endpoint, action, payload) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action, payload })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;

  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Usage
try {
  const proposal = await makeApiCall('proposal', 'create', {
    listingId: 'listing_abc123',
    checkInDate: '2026-02-01',
    checkOutDate: '2026-02-28',
    selectedDays: [1, 2, 3, 4, 5]
  });

  console.log('Proposal created:', proposal.proposalId);

} catch (error) {
  // Show error to user
  alert(`Failed to create proposal: ${error.message}`);
}
```

---

### Query Building Pattern

When querying Supabase directly:

```javascript
import { supabase } from 'lib/supabase.js';

// Simple query
const { data, error } = await supabase
  .from('listing')
  .select('*')
  .eq('_id', listingId)
  .single();

// Query with join
const { data, error } = await supabase
  .from('proposal')
  .select(`
    *,
    listing:listing_id (*),
    guest:guest_account_id (*),
    host:host_account_id (*)
  `)
  .eq('guest_account_id', userId)
  .order('created_at', { ascending: false });

// Query with filtering
const { data, error } = await supabase
  .from('listing')
  .select('*')
  .gte('base_nightly_rate', minPrice)
  .lte('base_nightly_rate', maxPrice)
  .contains('available_days', [1, 2, 3, 4, 5]);
```

---

## Migration Guide

### From Direct Bubble API to Edge Functions

**Before** (deprecated):
```javascript
import { bubbleAPI } from 'lib/bubbleAPI.js';

const listing = await bubbleAPI.getListing(listingId);
```

**After** (current):
```javascript
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/listing`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'get',
    payload: { listingId }
  })
});

const result = await response.json();
const listing = result.data;
```

---

## Best Practices

1. **Always use Edge Functions**: Never call Bubble API directly from frontend
2. **Handle errors gracefully**: Always wrap API calls in try-catch
3. **Show loading states**: Display loading indicators during API calls
4. **Validate input**: Validate data before sending to API
5. **Use secure storage**: Store sensitive data in encrypted localStorage
6. **Check authentication**: Verify user is authenticated before protected operations
7. **Log errors**: Log errors for debugging, but don't expose sensitive data
8. **Retry on network errors**: Implement retry logic for transient failures
9. **Cache reference data**: Cache boroughs, neighborhoods, amenities
10. **Use TypeScript types**: Leverage type definitions for better code quality

---

## See Also

- [Edge Functions Reference](../edge-functions/README.md)
- [Authentication Flows](../authentication/README.md)
- [Code Examples](../examples/README.md)
