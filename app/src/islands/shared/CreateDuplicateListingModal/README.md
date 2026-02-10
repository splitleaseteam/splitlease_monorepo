# CreateDuplicateListingModal

Modal for creating new listings or duplicating existing ones. Converted from Bubble.io element to Supabase architecture.

## What It Does

Two modes:
1. **Create New** — Initializes listing with defaults (inactive, $500 deposit, 1 bed)
2. **Copy Existing** — Copies all properties from a selected existing listing

Creates records directly in `zat_listings` table via Supabase.

## Non-Obvious Behavior

### Authentication-Conditional UI
- `currentUser` provided → Shows both "Create New" and "Copy Existing" buttons
- `currentUser` is null → Shows "Create New" only, hides "Copy Existing"
- Creating a listing without a user is possible (edge case — no user association)

### Profile Completeness Tracking
First listing creation marks a profile completeness step. This updates `tasksCompleted` on the user record.

### Default Values for New Listings
```
active: false
Default Extension Setting: false
damage_deposit: 500
Features - Qty Beds: 1
HOST name: user's full name or first name
Host email: user's email
Operator Last Updated AUT: current timestamp
```

### Host Reference
`user._id` is used directly as `Host User` — there is no separate `account_host` indirection.

## Traps

- Table is `zat_listings` with Bubble-style column names (spaces, emojis in some columns)
- Duplicating a listing copies ALL fields including ones you might not expect — review what gets copied
- CSS is in a separate file: `styles/components/create-listing-modal.css` (must be imported in HTML head)
- Modal uses z-index 9999 — can conflict with other overlays

## Props

`isVisible` (boolean), `onClose` (() => void), `currentUser` (object|null), `existingListings` (array), `onSuccess` ((listing) => void), `onNavigateToListing` ((listingId) => void)
