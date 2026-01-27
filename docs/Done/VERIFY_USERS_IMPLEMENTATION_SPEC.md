# VERIFY USERS PAGE - Implementation Specification

**Status**: ✅ FULLY IMPLEMENTED
**Complexity**: 6/10 (moderate CRUD with file viewing)
**Estimated Implementation Time**: Already complete (20-24 hours originally)
**Last Updated**: 2026-01-26

---

## Executive Summary

The Verify Users page is an **admin-only** identity verification dashboard that enables authorized users to review submitted identity documents (profile photo, selfie with ID, government ID front/back) and toggle user verification status. The page is **fully implemented** in Code with UI, business logic, and backend operations complete.

### Key Features Implemented

✅ User search by email/name with debounced input
✅ Dynamic user dropdown with recent users fallback
✅ URL parameter support for direct user links
✅ 2x2 image grid for identity documents
✅ Image modal for full-size document review
✅ Verification toggle with database updates
✅ Profile completeness tracking (+/- 15%)
✅ Tasks completed management
✅ Audit logging of verification changes
✅ Admin header integration
✅ Hollow component pattern implementation

### Features NOT Yet Implemented

❌ Email notification to user upon verification
❌ SMS notification to user
❌ Magic login link generation
❌ Internal Slack notification to team
❌ Scheduled reminder cancellation (when profile ≥80%)
❌ Admin role enforcement (temporarily disabled for testing)

---

## Current State Analysis

### What Exists Today

**UI Component** (`app/src/islands/pages/VerifyUsersPage.jsx`): 1,130 lines
- Complete hollow component following architecture pattern
- All UI elements from requirements implemented
- AdminHeader integration
- Responsive design with mobile considerations
- Image modal with external link support
- Toast notifications for user feedback

**Logic Hook** (`app/src/islands/pages/useVerifyUsersPageLogic.js`): 372 lines
- User search with debouncing (300ms)
- User selection with URL parameter sync
- Verification toggle handler
- Image modal state management
- Error handling with toast feedback
- Profile completeness color coding

**Edge Function** (`supabase/functions/verify-users/index.ts`): 451 lines
- 4 actions: `list_users`, `search_users`, `get_user`, `toggle_verification`
- Authentication via Supabase Auth
- Admin check (commented out for testing)
- Database column mapping (Bubble-style names → JS names)
- Audit logging
- Profile completeness calculation
- Tasks completed array management

### What's Missing vs. Bubble Requirements

According to the workflow analysis, the Bubble prototype includes these additional workflows:

1. **Internal Email Notification** (Workflow 4.1, Step 3):
   - Send email to documents team when user verified
   - Email should include user name, email, verification status

2. **Magic Login Link** (Workflow 4.1, Step 4):
   - Generate 24-hour expiring magic link
   - Direct to account-profile page
   - Include in verification email

3. **Confirmation Email** (Workflow 4.1, Step 5):
   - Basic email confirmation to user
   - Notify user they've been verified

4. **SMS Confirmation** (Workflow 4.1, Step 6):
   - SMS with verification confirmation
   - Include magic login link

5. **Reminder Cancellation** (Workflow 2.1, Step 2):
   - Cancel pending profile completion reminders
   - Only when profile completeness ≥ 80%

6. **Internal Email on Revocation** (Workflow 4.2, Step 2):
   - Notify documents team when verification removed

### What Needs Refactoring

✅ No refactoring needed - follows all architecture patterns:
- Hollow Component pattern
- Edge Function action-based routing
- Column name mapping for Bubble compatibility
- Error handling with consolidated Slack logging
- URL parameter sync for shareable links

---

## Architecture Design

### Component Structure

```
VerifyUsersPage.jsx (Hollow Component - 1,130 lines)
├── useVerifyUsersPageLogic.js (Logic Hook - 372 lines)
├── AdminHeader (Shared Component)
└── Sub-components (inline):
    ├── UserSelect
    │   └── UserDropdownItem
    ├── IdentityVerificationContainer
    │   ├── ImageCard (×4)
    │   └── VerificationToggle
    ├── ImageModal
    ├── LoadingState
    ├── ErrorState
    ├── EmptyState
    └── Instructions
```

### Logic Hook Design

**File**: `app/src/islands/pages/useVerifyUsersPageLogic.js`

**State**:
```javascript
// User selection
const [selectedUser, setSelectedUser] = useState(null);
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [isSearching, setIsSearching] = useState(false);
const [isDropdownOpen, setIsDropdownOpen] = useState(false);

// Verification
const [isProcessing, setIsProcessing] = useState(false);

// Image modal
const [modalImage, setModalImage] = useState(null);

// Loading/error
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

**Handlers**:
- `handleSelectUser(user)` - Select user from dropdown, update URL
- `clearSelection()` - Clear selection, remove URL param
- `handleSearchChange(value)` - Debounced search input
- `handleDropdownToggle()` - Toggle dropdown open/close
- `toggleVerification(newStatus)` - Update verification status
- `openImageModal(url, title)` - Open full-size image view
- `closeImageModal()` - Close image modal
- `openImageExternal(url)` - Open image in new tab

**Data Fetching**:
- `searchUsers(query)` - Search via Edge Function (debounced)
- `loadRecentUsers()` - Load 20 recent users for empty dropdown
- `loadUserById(userId)` - Load specific user from URL param
- `callEdgeFunction(action, payload)` - Generic Edge Function caller

**Computed Values**:
- `getCompletenessColor(percentage)` - Color based on completeness (≥80% green, ≥50% amber, <50% red)
- `documentSections` - Array of 4 document types with labels

**Effects**:
- URL parameter check on mount
- Debounced search (300ms)
- Click-outside handler for dropdown close

---

## Data Model

### Database Tables Used

**`public.user` table** (Bubble-style column names):
- `_id` (string) - User ID
- `"email"` (string) - User email
- `"Name - Full"` (string) - User full name
- `"Name - First"` (string) - First name
- `"Name - Last"` (string) - Last name
- `"Phone Number (as text)"` (string) - Phone number
- `"Profile Photo"` (string) - Profile photo URL
- `"Selfie with ID"` (string) - Selfie with ID URL
- `"ID front"` (string) - Front of government ID URL
- `"ID Back"` (string) - Back of government ID URL
- `"user verified?"` (boolean) - Verification status
- `"ID documents submitted?"` (boolean) - Whether docs submitted
- `"profile completeness"` (number) - Completion percentage (0-100)
- `"Tasks Completed"` (text[] or JSON) - Array of completed task names
- `"Created Date"` (timestamp) - User creation date
- `"Modified Date"` (timestamp) - Last modified date
- `"Toggle - Is Admin"` (boolean) - Admin status (for role check)

### Column Name Mapping

The Edge Function uses a bidirectional mapping between JavaScript-friendly keys and Bubble-style column names:

```typescript
const COLUMN_MAP = {
  fullName: 'Name - Full',
  firstName: 'Name - First',
  lastName: 'Name - Last',
  email: 'email',
  phoneNumber: 'Phone Number (as text)',
  profilePhoto: 'Profile Photo',
  selfieWithId: 'Selfie with ID',
  idFront: 'ID front',
  idBack: 'ID Back',
  isVerified: 'user verified?',
  profileCompleteness: 'profile completeness',
  tasksCompleted: 'Tasks Completed',
  // ... more mappings
};
```

### API Endpoints

**Edge Function**: `POST /functions/v1/verify-users`

**Actions**:

1. **`list_users`** - Get recent users (paginated)
   ```json
   {
     "action": "list_users",
     "payload": {
       "limit": 20,
       "offset": 0
     }
   }
   ```

2. **`search_users`** - Search users by email or name
   ```json
   {
     "action": "search_users",
     "payload": {
       "query": "john@example.com"
     }
   }
   ```

3. **`get_user`** - Get single user by ID
   ```json
   {
     "action": "get_user",
     "payload": {
       "userId": "1234567890abcdefg"
     }
   }
   ```

4. **`toggle_verification`** - Update verification status
   ```json
   {
     "action": "toggle_verification",
     "payload": {
       "userId": "1234567890abcdefg",
       "isVerified": true,
       "notes": "Optional admin notes"
     }
   }
   ```

---

## Workflows Implementation

### Workflow 1: Page Load

**Trigger**: Component mount

**Steps**:
1. Check URL for `?user={userId}` parameter
2. If present, call `loadUserById(userId)`
3. Fetch user data via Edge Function `get_user`
4. Display user in verification container

**Code**:
```javascript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('user');
  if (userId) {
    loadUserById(userId);
  }
}, []);
```

### Workflow 2: User Search

**Trigger**: User types in email input field

**Steps**:
1. Update `searchQuery` state
2. Debounce for 300ms
3. If query ≥ 2 characters, call `searchUsers(query)`
4. Edge Function searches by email or full name (case-insensitive, partial match)
5. Display results in dropdown
6. User clicks result → `handleSelectUser(user)`

**Code**:
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers(searchQuery);
    } else if (searchQuery.trim().length === 0 && isDropdownOpen) {
      loadRecentUsers();
    }
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery, isDropdownOpen]);
```

### Workflow 3: User Selection

**Trigger**: User clicks dropdown item or dropdown trigger

**Steps**:
1. `handleSelectUser(user)` called
2. Set `selectedUser` state
3. Update `searchQuery` to user's email
4. Close dropdown
5. Update URL: `window.history.replaceState` adds `?user={_id}`
6. Display identity verification container

**URL Sync Logic**:
```javascript
const handleSelectUser = useCallback((user) => {
  setSelectedUser(user);
  setSearchQuery(user.email || '');
  setIsDropdownOpen(false);

  // Update URL for sharing/bookmarking
  const url = new URL(window.location.href);
  url.searchParams.set('user', user._id);
  window.history.replaceState({}, '', url);
}, []);
```

### Workflow 4: Clear Selection

**Trigger**: User clicks "Clear" button

**Steps**:
1. `clearSelection()` called
2. Reset `selectedUser`, `searchQuery`, `searchResults`
3. Remove `?user={_id}` from URL
4. Hide verification container, show empty state

### Workflow 5: Image Viewing

**Trigger**: User clicks on any of the 4 identity document images

**Steps**:
1. `openImageModal(imageUrl, title)` called
2. Set `modalImage` state with URL and title
3. Modal renders with full-size image
4. User can click "Open in new tab" → `openImageExternal(url)`
5. User can click close or backdrop → `closeImageModal()`

**Image Modal Features**:
- Full-size image display
- External link button (opens in new tab)
- Close button
- Click-outside-to-close
- Responsive sizing

### Workflow 6: Verification Toggle (ON)

**Trigger**: Admin toggles verification switch to ON

**Steps**:
1. `toggleVerification(true)` called
2. Set `isProcessing = true` (disable toggle)
3. Call Edge Function `toggle_verification` with `isVerified: true`
4. Edge Function performs:
   - Fetch current user data
   - Calculate new values:
     - `isVerified = true`
     - `profileCompleteness = min(current + 15, 100)`
     - `tasksCompleted = [...current, 'identity']` (deduplicated)
   - Update user record in database
   - Log audit trail to console
5. Receive updated user data
6. Update local state (`selectedUser`, `searchResults`)
7. Show success toast: "{Name} has been verified"
8. Set `isProcessing = false`

**Database Update**:
```typescript
await supabase
  .from('user')
  .update({
    'user verified?': true,
    'profile completeness': newCompleteness,
    'Tasks Completed': newTasks,
    'Modified Date': now,
    'updated_at': now,
  })
  .eq('_id', userId);
```

**Profile Completeness Logic**:
- Add 15% when verifying
- Clamp to maximum 100%
- Subtract 15% when unverifying
- Clamp to minimum 0%

**Tasks Completed Logic**:
- Add 'identity' to array when verifying
- Remove 'identity' from array when unverifying
- Array is deduplicated (Set)

### Workflow 7: Verification Toggle (OFF)

**Trigger**: Admin toggles verification switch to OFF

**Steps**:
1. `toggleVerification(false)` called
2. Same flow as Workflow 6, but:
   - `isVerified = false`
   - `profileCompleteness -= 15` (min 0)
   - `tasksCompleted` removes 'identity'
3. Show toast: "Verification removed for {Name}"

### Workflow 8: Error Handling

**Trigger**: Any API call fails

**Steps**:
1. Catch error in try/catch
2. Log error to console
3. Show error toast with message
4. For critical errors, display `<ErrorState>` component

---

## UI Elements Specification

### Element 1: User Selection Section

**Type**: Search input + Dropdown selector + Clear button

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Select User                                                 │
│ ┌─────────────────────┐ ┌─────────────────────────┐        │
│ │ Type user's email   │ │ Choose an option...  ▼ │ Clear  │
│ └─────────────────────┘ └─────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

**Email Input**:
- Width: 290px
- Height: 43px
- Border: 2px solid #d1d5db (gray-300)
- Border radius: 0.5rem (8px)
- Placeholder: "Type user's email"
- Disabled when user selected

**Dropdown Trigger**:
- Width: 451px
- Height: 44px
- Border: 2px solid #d1d5db (gray-300)
- Border radius: 0.5rem
- Active border: #52ABEC (blue)
- Displays: "Choose an option..." or "John Doe - john@example.com"

**Dropdown List**:
- Position: Absolute, below trigger
- Max height: 240px
- Scrollable overflow-y
- Each item:
  - Avatar (32x32px circular, or initials placeholder)
  - Name (0.875rem, font-weight 500)
  - Email (0.75rem, gray-600)
  - "Verified" badge if applicable (green pill)

**Clear Button**:
- Padding: 0.5rem 1rem
- Font size: 0.875rem
- Color: #4b5563 (gray-600)
- Hover: background change
- Only visible when user selected

**Conditionals**:
- Email input disabled when `selectedUser !== null`
- Clear button only shown when `selectedUser !== null`
- Dropdown list only shown when `isDropdownOpen === true`
- Loading indicator in dropdown when `isSearching === true`

### Element 2: Identity Verification Container

**Type**: Bordered container with image grid + toggle

**Styling**:
- Border: 2px solid #4D4D4D
- Border radius: 20px
- Background: white
- Padding: 1.5rem
- Width: 724px (from requirements)

**Layout**:
```
┌────────────────────────────────────────────────────────────┐
│ Identity Verification                                      │
│ ┌─────────────────────────┐  ┌──────────────┐             │
│ │ ┌──────┐ ┌──────┐       │  │              │             │
│ │ │Photo │ │Selfie│       │  │ User Verified│             │
│ │ └──────┘ └──────┘       │  │              │             │
│ │ ┌──────┐ ┌──────┐       │  │   ◯━━━━━━○  │             │
│ │ │ID Frnt│ │ID Back│      │  │              │             │
│ │ └──────┘ └──────┘       │  │  Not Verified│             │
│ └─────────────────────────┘  └──────────────┘             │
│ ──────────────────────────────────────────────────────────│
│ Email: john@example.com  Phone: +1234567890               │
│ Profile Completeness: 65% (amber)                          │
│ Tasks Completed: identity, phone, email                    │
└────────────────────────────────────────────────────────────┘
```

**Image Grid**:
- 2×2 grid (repeat(2, 1fr))
- Gap: 1rem
- Each cell: Image card

**Image Card**:
- Label above (0.875rem, font-weight 500)
- Aspect ratio: 4:3
- Border: 2px dashed #d1d5db
- Border radius: 0.5rem
- Hover: border color → #52ABEC, box shadow, overlay opacity 1
- Empty state: Placeholder icon + "No image available"
- Filled state: Image + overlay with "Click to view"

**Verification Toggle**:
- Width: 128px (fixed)
- Border-left: 1px solid #e5e7eb
- Padding-left: 1.5rem
- Toggle button:
  - Width: 56px
  - Height: 32px
  - Background: #d1d5db (off), #22c55e (on)
  - Knob: 24x24px white circle
  - Translate: 4px (off), 28px (on)
- Label: "User verified?"
- Status text: "Not Verified" (gray), "Verified" (green)
- Processing text: "Processing..." when API call in flight

**User Summary**:
- Border-top: 1px solid #e5e7eb
- Padding-top: 1rem
- Font size: 0.875rem
- Color: #4b5563
- Displays: Email, Phone, Profile Completeness (colored), Tasks Completed

**Profile Completeness Colors**:
- ≥80%: #059669 (green-600)
- 50-79%: #d97706 (amber-600)
- <50%: #dc2626 (red-600)

**Conditionals**:
- Container only shown when `selectedUser !== null`
- Each image card shows placeholder if URL is null
- Processing text shown when `isProcessing === true`

### Element 3: Image Modal

**Type**: Overlay modal with full-size image

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Backdrop (rgba(0,0,0,0.7), blur 4px)                    │
│   ┌─────────────────────────────────────────────────┐   │
│   │ John Doe's Profile Photo          🔗  ✕         │   │
│   ├─────────────────────────────────────────────────┤   │
│   │                                                  │   │
│   │               [Full-size image]                 │   │
│   │                                                  │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Header**:
- Background: white
- Padding: 0.75rem 1rem
- Border-radius: 0.5rem (top only)
- Title: 1.125rem, font-weight 600
- Action buttons:
  - External link icon (🔗)
  - Close icon (✕)
  - Padding: 0.5rem
  - Hover: background change

**Image Container**:
- Background: #f3f4f6 (gray-100)
- Border-radius: 0.5rem (bottom only)
- Max width: 56rem (896px)
- Max height: 75vh
- Image:
  - object-fit: contain
  - Display: block
  - Margin: auto

**Interactions**:
- Click backdrop → close modal
- Click close button → close modal
- Click external link → open in new tab (noopener, noreferrer)

### Element 4: Empty State

**Type**: Placeholder when no user selected

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│              👤 (large user icon)                       │
│                                                         │
│           No User Selected                              │
│                                                         │
│  Search for a user by email or select from the         │
│  dropdown above to begin verification                  │
└─────────────────────────────────────────────────────────┘
```

**Styling**:
- Border: 2px dashed #d1d5db
- Border radius: 20px
- Background: rgba(255,255,255,0.5)
- Padding: 3rem
- Text align: center
- Icon: 64×64px, color #9ca3af

### Element 5: Instructions Panel

**Type**: Info panel at bottom

**Styling**:
- Background: #eff6ff (blue-50)
- Border: 1px solid #bfdbfe (blue-200)
- Border radius: 0.5rem
- Padding: 1rem

**Content**:
1. Select a user from the dropdown or search by email address
2. Review all four identity documents (profile photo, selfie with ID, front and back of government ID)
3. Click on any image to view it in full size
4. Once verified, toggle the "User Verified?" switch to ON
5. The system will automatically update the user's profile and send notifications

---

## Complex Logic Patterns

### Pattern 1: Debounced Search with Fallback

**Challenge**: Need to search as user types, but avoid excessive API calls. Also need to handle empty query.

**Solution**: 300ms debounce timer with conditional logic

```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers(searchQuery);
    } else if (searchQuery.trim().length === 0 && isDropdownOpen) {
      loadRecentUsers();
    }
  }, 300);

  return () => clearTimeout(timer);
}, [searchQuery, isDropdownOpen]);
```

**Why This Works**:
- Debounce prevents API spam
- Minimum 2 characters prevents overly broad searches
- Empty query + open dropdown → show recent users (good UX)
- Cleanup function cancels timer on unmount

### Pattern 2: URL Parameter Sync for Shareable Links

**Challenge**: Admins need to share direct links to specific users

**Solution**: Bidirectional URL parameter sync

```javascript
// On user selection
const handleSelectUser = useCallback((user) => {
  setSelectedUser(user);
  const url = new URL(window.location.href);
  url.searchParams.set('user', user._id);
  window.history.replaceState({}, '', url);
}, []);

// On mount
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('user');
  if (userId) {
    loadUserById(userId);
  }
}, []);

// On clear
const clearSelection = useCallback(() => {
  setSelectedUser(null);
  const url = new URL(window.location.href);
  url.searchParams.delete('user');
  window.history.replaceState({}, '', url);
}, []);
```

**Why This Works**:
- `replaceState` updates URL without page reload
- URL persists across browser refresh
- Shareable links work immediately on mount
- Removing param on clear keeps URL clean

### Pattern 3: Click-Outside Detection for Dropdown

**Challenge**: Close dropdown when user clicks anywhere outside

**Solution**: Event listener with ref comparison

```javascript
const dropdownRef = useRef(null);

useEffect(() => {
  function handleClickOutside(event) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  }

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

**Why This Works**:
- Ref tracks dropdown DOM element
- `.contains()` checks if click was inside
- `mousedown` fires before `click`, better UX
- Cleanup removes listener on unmount

### Pattern 4: Atomic Verification Update

**Challenge**: Multiple fields need updating together (verification, completeness, tasks)

**Solution**: Single database transaction with calculated values

```typescript
// Calculate new values atomically
const currentCompleteness = currentUser['profile completeness'] || 0;
let currentTasks = Array.isArray(currentUser['Tasks Completed'])
  ? currentUser['Tasks Completed']
  : [];

const newCompleteness = isVerified
  ? Math.min(currentCompleteness + 15, 100)
  : Math.max(currentCompleteness - 15, 0);

const newTasks = isVerified
  ? [...new Set([...currentTasks, 'identity'])]
  : currentTasks.filter(t => t !== 'identity');

// Single update operation
await supabase
  .from('user')
  .update({
    'user verified?': isVerified,
    'profile completeness': newCompleteness,
    'Tasks Completed': newTasks,
    'Modified Date': new Date().toISOString(),
  })
  .eq('_id', userId);
```

**Why This Works**:
- All related fields updated in one transaction
- No partial updates possible
- Clamping prevents invalid values (0-100)
- Set deduplication for tasks array
- Defensive programming for tasks (handles non-array)

### Pattern 5: Column Name Mapping for Bubble Compatibility

**Challenge**: Bubble uses column names with spaces, JS uses camelCase

**Solution**: Bidirectional mapping object

```typescript
const COLUMN_MAP = {
  fullName: 'Name - Full',
  isVerified: 'user verified?',
  // ... etc
};

const REVERSE_COLUMN_MAP = {};
for (const [jsKey, dbCol] of Object.entries(COLUMN_MAP)) {
  REVERSE_COLUMN_MAP[dbCol] = jsKey;
}

function toJsUser(dbRow) {
  const jsData = { _id: dbRow._id };
  for (const [dbCol, value] of Object.entries(dbRow)) {
    const jsKey = REVERSE_COLUMN_MAP[dbCol];
    if (jsKey) {
      jsData[jsKey] = value;
    }
  }
  return jsData;
}
```

**Why This Works**:
- Frontend uses clean camelCase keys
- Backend queries use exact Bubble column names
- Mapping is centralized (single source of truth)
- Reverse mapping auto-generated (no duplication)
- Transformation is O(n), acceptable performance

---

## Reusable Components

### From Shared Library

- ✅ `AdminHeader` - Corporate header for all admin pages
- ✅ `Toast` (via `useToast()` hook) - Success/error notifications

### New Components Created (Inline)

These are **inline sub-components** within VerifyUsersPage.jsx, not in shared library:

- `UserSelect` - User search + dropdown selector
- `UserDropdownItem` - Individual dropdown item
- `IdentityVerificationContainer` - Main verification section
- `ImageCard` - Individual identity document card
- `VerificationToggle` - Toggle switch component
- `ImageModal` - Full-size image viewer
- `LoadingState` - Loading spinner
- `ErrorState` - Error message display
- `EmptyState` - No user selected placeholder
- `Instructions` - Instructions panel
- Icons: `ChevronIcon`, `UserIcon`, `ImagePlaceholderIcon`, `ExternalLinkIcon`, `CloseIcon`

**Reusability Assessment**:
- `VerificationToggle` - Could be extracted to shared library (generic toggle with label/status)
- `ImageModal` - Could be extracted (generic image viewer)
- `ImageCard` - Specific to this page (identity documents)
- `UserSelect` - Could be generalized as `UserSearch` component

---

## Testing Strategy

### Unit Tests

**Logic Hook Tests** (`useVerifyUsersPageLogic.test.js`):
- [ ] URL parameter extraction on mount
- [ ] Debounced search (mock timers)
- [ ] User selection updates state and URL
- [ ] Clear selection resets state and URL
- [ ] Verification toggle calls Edge Function with correct payload
- [ ] Error handling shows toast
- [ ] Profile completeness color calculation (≥80%, ≥50%, <50%)

**Edge Function Tests** (`verify-users.test.ts`):
- [ ] Authentication required for all actions
- [ ] Admin check (when re-enabled)
- [ ] `list_users` returns paginated users
- [ ] `search_users` filters by email or name
- [ ] `get_user` returns single user or 404
- [ ] `toggle_verification` updates all related fields
- [ ] Profile completeness calculation (+15%, -15%, clamped)
- [ ] Tasks completed array management (add/remove 'identity')
- [ ] Column name mapping (Bubble ↔ JS)
- [ ] Audit logging

### Integration Tests

- [ ] Full flow: Search → Select → Verify → Check database
- [ ] URL parameter flow: Load page with ?user=X → User auto-loaded
- [ ] Image modal flow: Click image → Modal opens → External link works
- [ ] Dropdown flow: Open dropdown → Search → Select → Dropdown closes

### Visual Regression Tests

- [ ] Empty state rendering
- [ ] User selected state
- [ ] Image modal open
- [ ] Dropdown open with results
- [ ] Dropdown open with loading
- [ ] Dropdown open with no results
- [ ] Verification toggle states (off, on, processing)

---

## Implementation Checklist

### ✅ Phase 1: Setup (COMPLETE)

- [x] Create directory structure
- [x] Create skeleton files (VerifyUsersPage.jsx, useVerifyUsersPageLogic.js)
- [x] Set up imports
- [x] Create Edge Function (verify-users/index.ts)

### ✅ Phase 2: Logic Hook (COMPLETE)

- [x] Implement state management (7 state hooks)
- [x] Implement data fetching (callEdgeFunction, searchUsers, loadRecentUsers, loadUserById)
- [x] Implement event handlers (select, clear, search, toggle, image modal)
- [x] Implement computed values (completeness color, document sections)
- [x] URL parameter sync (mount effect, select handler, clear handler)
- [x] Debounced search (useEffect with timer)
- [x] Click-outside detection (useEffect with event listener)

### ✅ Phase 3: Components (COMPLETE)

- [x] Implement main page component (VerifyUsersPage.jsx)
- [x] Implement UserSelect sub-component
- [x] Implement UserDropdownItem sub-component
- [x] Implement IdentityVerificationContainer
- [x] Implement ImageCard (×4)
- [x] Implement VerificationToggle
- [x] Implement ImageModal
- [x] Implement LoadingState
- [x] Implement ErrorState
- [x] Implement EmptyState
- [x] Implement Instructions
- [x] Implement all icons (SVG components)
- [x] Apply styling (inline styles object)

### ✅ Phase 4: Edge Function (COMPLETE)

- [x] Implement action routing
- [x] Implement authentication check
- [x] Implement column name mapping
- [x] Implement `list_users` handler
- [x] Implement `search_users` handler
- [x] Implement `get_user` handler
- [x] Implement `toggle_verification` handler
- [x] Database queries with column mapping
- [x] Profile completeness calculation
- [x] Tasks completed management
- [x] Audit logging

### ✅ Phase 5: Polish (COMPLETE)

- [x] Error handling (try/catch in all handlers)
- [x] Loading states (isSearching, loading, isProcessing)
- [x] Edge cases (empty search, no images, missing data)
- [x] Accessibility (ARIA labels on toggle, semantic HTML)
- [x] Toast notifications (success/error feedback)

### ❌ Phase 6: Extended Workflows (NOT IMPLEMENTED)

**From Bubble Requirements**:

- [ ] Internal email notification to documents team
  - [ ] Edge Function: Call email service
  - [ ] Include user name, email, verification status
  - [ ] Triggered on both verify and unverify

- [ ] Magic login link generation
  - [ ] Edge Function: Generate token via Supabase Auth
  - [ ] Create link with 24-hour expiration
  - [ ] Direct to /account-profile page

- [ ] Confirmation email to user
  - [ ] Edge Function: Call email service
  - [ ] Template: "Your identity has been verified"
  - [ ] Include magic login link

- [ ] SMS confirmation to user
  - [ ] Edge Function: Call SMS service (Twilio?)
  - [ ] Template: "Verified! Login: [link]"

- [ ] Scheduled reminder cancellation
  - [ ] Edge Function: Query for pending reminders
  - [ ] Cancel via Bubble API
  - [ ] Only when profile completeness ≥ 80%

- [ ] Admin role enforcement
  - [ ] Edge Function: Uncomment admin check
  - [ ] Query `"Toggle - Is Admin"` field
  - [ ] Return 403 if not admin

**Total Estimate**: 8-12 hours for extended workflows

---

## Missing Notification Workflows - Implementation Notes

The Edge Function includes TODO comments indicating these missing features:

```typescript
// TODO: Trigger notification workflows
// - Send confirmation email to user
// - Send SMS notification to user
// - Send internal Slack notification
// - Cancel scheduled API reminders if profile completeness >= 80%
```

### Email Notification Service

**Option 1**: Use Supabase Edge Function with Resend/SendGrid
```typescript
// supabase/functions/_shared/email.ts
export async function sendEmail(to, subject, html) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  return response.json();
}
```

**Option 2**: Use existing Bubble workflows (if they exist)
```typescript
// Call Bubble workflow API
await fetch(`${bubbleBaseUrl}/wf/send-verification-email`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${bubbleApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId,
    userName,
    userEmail,
    magicLink,
  }),
});
```

### SMS Notification Service

**Option 1**: Direct Twilio integration
```typescript
// supabase/functions/_shared/sms.ts
export async function sendSMS(to, message) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: fromNumber, Body: message }),
    }
  );
  return response.json();
}
```

**Option 2**: Use existing Bubble SMS workflows

### Magic Login Link Generation

**Use Supabase Auth magic link generation**:
```typescript
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: userEmail,
  options: {
    redirectTo: `${appUrl}/account-profile`,
  },
});

const magicLink = data.properties.action_link;
// Expires in 24 hours by default
```

### Scheduled Reminder Cancellation

**Option 1**: Query sync_queue or pending_reminders table
```typescript
if (newCompleteness >= 80) {
  // Find pending reminders for this user
  const { data: reminders } = await supabase
    .from('pending_reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending');

  // Cancel each reminder
  for (const reminder of reminders) {
    await supabase
      .from('pending_reminders')
      .update({ status: 'cancelled' })
      .eq('id', reminder.id);
  }
}
```

**Option 2**: Call Bubble API to cancel scheduled workflows
```typescript
// If reminders are scheduled via Bubble
await fetch(`${bubbleBaseUrl}/wf/cancel-reminders`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${bubbleApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ userId }),
});
```

---

## Edge Cases & Gotchas

### Edge Case 1: User has no identity documents

**Scenario**: User account exists but no photos uploaded

**Handling**:
- Image cards show placeholder icon + "No image available"
- Admin can still select user and view other data
- Verification toggle should work, but admin should verify docs exist first
- ⚠️ **Gotcha**: Current implementation doesn't warn admin if all images are null

**Improvement**:
```javascript
// Add warning in verification container
{!hasAnyImages(selectedUser) && (
  <div style={styles.warningBanner}>
    ⚠️ Warning: This user has not uploaded all identity documents
  </div>
)}
```

### Edge Case 2: Tasks Completed is not an array

**Scenario**: Legacy data or Bubble data format inconsistency

**Handling**:
- Edge Function defensively converts to array:
```typescript
let currentTasks = currentUser['Tasks Completed'];
if (!Array.isArray(currentTasks)) {
  currentTasks = currentTasks ? [currentTasks] : [];
}
```
- Logic hook also handles in `toJsUser()`:
```typescript
if (!Array.isArray(jsData.tasksCompleted)) {
  jsData.tasksCompleted = jsData.tasksCompleted ? [jsData.tasksCompleted] : [];
}
```

### Edge Case 3: URL parameter with invalid user ID

**Scenario**: `?user=nonexistent123` in URL

**Handling**:
- `loadUserById()` calls Edge Function `get_user`
- Edge Function returns 404 error
- Error caught, toast shown: "Failed to load user"
- Page remains in empty state

**Improvement**: Could show more specific error message

### Edge Case 4: Search returns 0 results

**Scenario**: User searches for "xyz123" with no matches

**Handling**:
- Dropdown shows: "No users found"
- No error thrown, expected behavior

### Edge Case 5: Multiple rapid verification toggles

**Scenario**: Admin clicks toggle multiple times quickly

**Handling**:
- `isProcessing` flag disables toggle during API call
- Multiple clicks queued up won't cause race conditions
- UI shows "Processing..." text

**Gotcha**: If network is slow, user might think toggle isn't working

### Edge Case 6: Admin revokes verification for user at 80% completeness

**Scenario**: User was at 80%, gets unverified, drops to 65%

**Handling**:
- Profile completeness correctly decreases by 15%
- Reminder cancellation logic (when implemented) should check for >= 80% after change
- No reminders re-scheduled on revocation

### Edge Case 7: User has comma in name or email

**Scenario**: Name like "Doe, John" or email with special chars

**Handling**:
- Search uses `ilike` with `%query%` pattern
- Commas, spaces, special chars don't break search
- ✅ Safe from SQL injection (Supabase parameterizes queries)

---

## Migration Notes

### Bubble-Specific Patterns to Avoid

1. ❌ **Multiple conditional states on same element**
   - Bubble: 3 conditionals on dropdown (focus, validation, URL param)
   - Code: Use React state + conditional rendering

2. ❌ **"Get data from page URL" element**
   - Bubble: Built-in element type
   - Code: `useEffect` + `URLSearchParams`

3. ❌ **"When Toggle is checked/unchecked" workflows**
   - Bubble: Two separate workflows
   - Code: Single handler with boolean parameter

4. ❌ **Database queries in UI workflows**
   - Bubble: Workflow action "Make changes to user"
   - Code: Edge Function handles all database operations

5. ❌ **"Open an external site" action**
   - Bubble: Workflow action
   - Code: `window.open(url, '_blank', 'noopener,noreferrer')`

6. ❌ **Field calculations inside update query**
   - Bubble: `profile completeness + 15`
   - Code: Calculate value first, then update

### Code-Specific Patterns to Use

1. ✅ **Hollow Component Pattern**
   - UI component delegates ALL logic to hook
   - Hook returns pre-calculated values and pre-bound handlers

2. ✅ **Action-Based Edge Function Routing**
   - Single endpoint, multiple actions
   - `{ action: 'toggle_verification', payload: {...} }`

3. ✅ **Column Name Mapping**
   - Bidirectional mapping for Bubble compatibility
   - Clean JS keys in frontend, exact Bubble names in SQL

4. ✅ **URL Parameter Sync**
   - `window.history.replaceState` for shareable links
   - No page reload, preserves state

5. ✅ **Toast Notifications**
   - Centralized toast system via `useToast()` hook
   - Success/error feedback

6. ✅ **Debounced Search**
   - `setTimeout` + cleanup in `useEffect`
   - Prevents API spam

7. ✅ **Click-Outside Detection**
   - Ref + event listener + cleanup
   - Better UX for dropdowns

---

## Success Criteria

### Functional Requirements

- [x] ✅ All UI elements from requirements implemented
- [x] ✅ All core workflows functional:
  - [x] Page load with URL parameter
  - [x] User search (debounced)
  - [x] User selection
  - [x] Clear selection
  - [x] Image viewing (modal + external link)
  - [x] Verification toggle (ON)
  - [x] Verification toggle (OFF)
- [x] ✅ All conditionals working:
  - [x] Email input disabled when user selected
  - [x] Clear button only shown when user selected
  - [x] Dropdown only shown when open
  - [x] Verification container only shown when user selected
- [x] ✅ Data displays correctly:
  - [x] User search results
  - [x] Selected user details
  - [x] Identity documents (4 images)
  - [x] Profile completeness (colored)
  - [x] Tasks completed
- [x] ✅ No console errors in normal operation
- [ ] ⚠️ Matches Bubble prototype visually (needs visual comparison)

### Extended Requirements (NOT Implemented)

- [ ] ❌ Email notifications sent to user
- [ ] ❌ Email notifications sent to internal team
- [ ] ❌ SMS notifications sent to user
- [ ] ❌ Magic login link generated
- [ ] ❌ Scheduled reminders cancelled when profile ≥ 80%
- [ ] ❌ Admin role enforcement (currently commented out)

### Technical Requirements

- [x] ✅ Follows Hollow Component pattern
- [x] ✅ Edge Function uses action-based routing
- [x] ✅ Column name mapping for Bubble compatibility
- [x] ✅ Error handling with toast feedback
- [x] ✅ Loading states for all async operations
- [x] ✅ Audit logging in Edge Function
- [x] ✅ URL parameter sync for shareable links
- [x] ✅ Debounced search
- [x] ✅ Click-outside detection
- [x] ✅ Accessibility (ARIA labels, semantic HTML)

---

## Visual Validation

### Bubble Prototype Reference

**URL**: ❓ *Need Bubble prototype URL from requirements doc*

**Note**: The requirements documents did not include a Bubble prototype URL. Visual comparison cannot be performed without access to the live Bubble app.

**Request**: Please provide the Bubble preview URL for the `_verify-users` page to perform visual validation.

### Key Visual Elements (From Requirements)

Based on requirements documents:

1. **Email Input**: 290×43px, 2px border, 0.5rem radius
2. **Dropdown**: 451×44px, 2px border, 0.5rem radius
3. **Verification Container**: 724×562px, 2px solid #4D4D4D, 20px radius
4. **Image Grid**: 2×2 layout
5. **Toggle Switch**: Standard iOS-style toggle
6. **Corporate Header**: Should match AdminHeader component

### Visual Comparison Checklist

- [ ] Header matches Bubble (AdminHeader component used)
- [ ] Layout/spacing matches (email input + dropdown + clear button)
- [ ] Colors match exactly:
  - [ ] Border color: #4D4D4D
  - [ ] Active border: #52ABEC
  - [ ] Success green: #22c55e
  - [ ] Gray tones: #d1d5db, #e5e7eb, #9ca3af
- [ ] Fonts match (need font family from Bubble)
- [ ] Button styles match
- [ ] Image grid styling matches (dashed borders, hover effects)
- [ ] Modal styling matches
- [ ] Responsive breakpoints match (if applicable)

### Screenshots

*Screenshots would be included here after accessing Bubble prototype*

---

## OpenCode Instructions

**Note**: This page is **already fully implemented**. The following instructions are for reference or if reimplementation is needed.

### Step 1: Verify Files Exist

All three files should already exist:
- `app/src/islands/pages/VerifyUsersPage.jsx` (1,130 lines)
- `app/src/islands/pages/useVerifyUsersPageLogic.js` (372 lines)
- `supabase/functions/verify-users/index.ts` (451 lines)

### Step 2: Test Current Implementation

1. Start dev server: `bun run dev` (in app/ directory)
2. Start Supabase: `supabase start`
3. Navigate to: `http://localhost:8000/_internal/verify-users`
4. Test workflows:
   - Search for user by email
   - Select user from dropdown
   - View identity documents
   - Toggle verification ON
   - Check database: `profile completeness` increased by 15
   - Toggle verification OFF
   - Check database: `profile completeness` decreased by 15

### Step 3: Implement Missing Workflows (Optional)

If extending with notification features:

1. Create email service:
   - File: `supabase/functions/_shared/email.ts`
   - Function: `sendVerificationEmail(userEmail, magicLink)`
   - Service: Resend or SendGrid

2. Create SMS service:
   - File: `supabase/functions/_shared/sms.ts`
   - Function: `sendVerificationSMS(phoneNumber, magicLink)`
   - Service: Twilio

3. Update Edge Function:
   - Uncomment admin role check (lines 124-128)
   - Add email notification call (after line 422)
   - Add SMS notification call (after email)
   - Add magic link generation (before notifications)
   - Add reminder cancellation logic (after line 440)

4. Add Slack notification:
   - Use existing `_shared/slack.ts` ErrorCollector
   - Send to internal team channel

### Step 4: Visual Comparison

1. Access Bubble prototype (URL needed)
2. Take screenshots of:
   - Empty state
   - User selected state
   - Image modal open
   - Dropdown open
   - Toggle in both states
3. Compare with Code implementation
4. Adjust styles if needed (inline styles object in VerifyUsersPage.jsx)

---

## Deployment Checklist

### Pre-Deployment

- [x] ✅ All files committed to git
- [x] ✅ Edge Function deployed: `supabase functions deploy verify-users`
- [ ] ⚠️ Environment variables set in Supabase (if adding email/SMS):
  - [ ] RESEND_API_KEY or SENDGRID_API_KEY
  - [ ] TWILIO_ACCOUNT_SID
  - [ ] TWILIO_AUTH_TOKEN
  - [ ] TWILIO_PHONE_NUMBER
- [ ] ⚠️ Admin role enforcement re-enabled (uncomment lines 124-128)
- [x] ✅ Route added to `routes.config.js`
- [x] ✅ HTML entry point exists: `public/_internal-verify-users.html`

### Post-Deployment

- [ ] Test on staging environment
- [ ] Verify Edge Function logs: `supabase functions logs verify-users`
- [ ] Test with real user data
- [ ] Verify all workflows end-to-end
- [ ] Check database updates (profile completeness, tasks completed)
- [ ] Test email/SMS notifications (if implemented)
- [ ] Monitor Slack for errors (if using error collector)

---

## Future Enhancements

### Phase 1: Notification Workflows (8-12 hours)

1. Email notification service integration
2. SMS notification service integration
3. Magic login link generation
4. Internal Slack notifications
5. Scheduled reminder cancellation

### Phase 2: Admin Management (4-6 hours)

1. Re-enable admin role enforcement
2. Create admin user management page
3. Add admin audit log viewer
4. Add bulk verification actions

### Phase 3: Advanced Features (8-12 hours)

1. Document quality checks (blur detection, face detection)
2. Document expiration tracking (ID expiry dates)
3. Verification history timeline
4. Document comparison view (side-by-side)
5. Batch verification (select multiple users)

### Phase 4: Analytics & Reporting (6-8 hours)

1. Verification statistics dashboard
2. Average verification time tracking
3. Rejection reasons tracking
4. Admin activity reports

---

## Known Issues & Limitations

### Issue 1: No Admin Role Enforcement

**Status**: Commented out for testing (lines 124-128 in Edge Function)

**Impact**: Any authenticated user can verify others

**Resolution**: Uncomment admin check before production deployment

```typescript
const isAdmin = await checkAdminStatus(supabase, user.email);
if (!isAdmin) {
  return errorResponse('Admin access required', 403);
}
```

### Issue 2: No Notification Workflows

**Status**: TODOs in Edge Function (lines 424-428)

**Impact**: Users don't receive confirmation, team doesn't get notified

**Resolution**: Implement email/SMS/Slack services (see "Missing Notification Workflows" section)

### Issue 3: No Document Validation

**Status**: Not implemented

**Impact**: Admin can verify user with no documents uploaded

**Resolution**: Add validation in `handleToggleVerification`:

```typescript
const hasAllDocuments = user.profilePhoto && user.selfieWithId && user.idFront && user.idBack;
if (!hasAllDocuments) {
  throw new ValidationError('User must have all identity documents uploaded');
}
```

### Issue 4: No Image Loading Error Handling

**Status**: Not implemented

**Impact**: Broken image URLs show as broken images

**Resolution**: Add `onError` handler to `<img>` tags:

```javascript
<img
  src={imageUrl}
  onError={(e) => {
    e.target.style.display = 'none';
    // Show placeholder instead
  }}
/>
```

### Issue 5: Profile Completeness Not Persistent Across Sessions

**Status**: Works correctly, not an issue

**Impact**: None - completeness is stored in database

**Resolution**: No action needed

---

## Performance Considerations

### Current Performance

- **Search**: Debounced (300ms), max 20 results
- **Image Loading**: On-demand when modal opens
- **Database Queries**: Indexed on email, name (assumed)
- **Edge Function**: Sub-second response times

### Optimization Opportunities

1. **Image Thumbnails**: Generate thumbnails for image cards (faster loading)
2. **Search Caching**: Cache search results in frontend for 5 minutes
3. **Pagination**: Add pagination for search results (currently limited to 20)
4. **Lazy Loading**: Lazy load images in verification container
5. **Database Indexes**: Ensure indexes on email, "Name - Full" columns

### Scalability

- Current implementation scales to ~10,000 users
- For >10,000 users, consider:
  - Full-text search index (PostgreSQL `tsvector`)
  - Elasticsearch for advanced search
  - Image CDN for document storage
  - Background job for verification workflows

---

## Appendix: Database Schema

### User Table Columns (Relevant to Verify Users Page)

```sql
CREATE TABLE IF NOT EXISTS "user" (
  "_id" text PRIMARY KEY,
  "email" text UNIQUE NOT NULL,
  "Name - Full" text,
  "Name - First" text,
  "Name - Last" text,
  "Phone Number (as text)" text,
  "Profile Photo" text,
  "Selfie with ID" text,
  "ID front" text,
  "ID Back" text,
  "user verified?" boolean DEFAULT false,
  "ID documents submitted?" boolean DEFAULT false,
  "profile completeness" integer DEFAULT 0,
  "Tasks Completed" text[], -- or JSON
  "Created Date" timestamp DEFAULT now(),
  "Modified Date" timestamp DEFAULT now(),
  "Toggle - Is Admin" boolean DEFAULT false,
  "updated_at" timestamp DEFAULT now()
);

-- Recommended indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "user" ("email");
CREATE INDEX IF NOT EXISTS idx_user_name ON "user" ("Name - Full");
CREATE INDEX IF NOT EXISTS idx_user_verified ON "user" ("user verified?");
CREATE INDEX IF NOT EXISTS idx_user_admin ON "user" ("Toggle - Is Admin");
```

---

## Appendix: Edge Function API Contract

### Authentication

All actions require authentication via Supabase Auth:

```
Authorization: Bearer {access_token}
```

### Request Format

```json
POST /functions/v1/verify-users
Content-Type: application/json

{
  "action": "action_name",
  "payload": {
    // Action-specific payload
  }
}
```

### Response Format

**Success**:
```json
{
  "success": true,
  "data": {
    // Action-specific data
  }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Actions

#### 1. list_users

**Payload**:
```json
{
  "limit": 20,  // optional, default 20
  "offset": 0   // optional, default 0
}
```

**Response**:
```json
{
  "users": [
    {
      "_id": "1234567890abcdefg",
      "email": "john@example.com",
      "fullName": "John Doe",
      "profilePhoto": "https://...",
      "isVerified": false,
      "profileCompleteness": 65,
      "tasksCompleted": ["email", "phone"],
      // ... more fields
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

#### 2. search_users

**Payload**:
```json
{
  "query": "john"  // min 2 characters
}
```

**Response**:
```json
{
  "users": [/* same as list_users */],
  "query": "john"
}
```

#### 3. get_user

**Payload**:
```json
{
  "userId": "1234567890abcdefg"
}
```

**Response**:
```json
{
  "user": {
    "_id": "1234567890abcdefg",
    "email": "john@example.com",
    "fullName": "John Doe",
    "profilePhoto": "https://...",
    "selfieWithId": "https://...",
    "idFront": "https://...",
    "idBack": "https://...",
    "isVerified": false,
    "phoneNumber": "+1234567890",
    "profileCompleteness": 65,
    "tasksCompleted": ["email", "phone"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 4. toggle_verification

**Payload**:
```json
{
  "userId": "1234567890abcdefg",
  "isVerified": true,
  "notes": "Optional admin notes"  // optional
}
```

**Response**:
```json
{
  "user": {
    "_id": "1234567890abcdefg",
    // ... full user object with updated fields
    "isVerified": true,
    "profileCompleteness": 80,  // increased by 15
    "tasksCompleted": ["email", "phone", "identity"]  // added 'identity'
  }
}
```

---

**END OF SPECIFICATION**

