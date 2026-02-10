# LoggedInAvatar

Authenticated user dropdown menu component. Shared island component used in Header.

## What It Does

Renders a user avatar that opens a dropdown menu with navigation items. Menu items are **conditional on user type** (HOST, GUEST, TRIAL_HOST) and show notification badge counts.

## Non-Obvious Behavior

### Smart Routing
Navigation paths vary based on user data, not just user type:

- **My Listings**: >1 listing → `/host-overview` | 1 listing → `/host-dashboard` | 0 → `/host-overview`
- **House Manuals**: HOST with 1 → `/host-house-manual` | HOST with 0 or >1 → `/host-overview` | GUEST → `/guest-house-manual`
- **Virtual Meetings**: HOST → `/host-overview` | GUEST → `/guest-proposals`
- **My Leases**: HOST → `/host-leases` | GUEST → `/guest-leases`

### Menu Differences
- HOST/TRIAL_HOST get "My Proposals"
- GUEST gets "Suggested Proposal" instead

### Badge Colors
- Purple badges (`#31135D`) for most items
- Red badge (`#FF0000`) for Messages (unread count)

## Traps

- Component expects icon SVGs in `/icons/` — missing icons will break menu items silently
- `currentPath` must match route exactly for active page highlighting (orange left border)
- Dropdown closes on click-outside via document event listener — can conflict with other click-outside handlers

## Files

- `LoggedInAvatar.jsx` — Main component with `getMenuItems()` logic
- `LoggedInAvatar.css` — Styles (z-index uses box-shadow overlay)
- `useLoggedInAvatarData.js` — Data fetching hook

## Props

`user` (object), `currentPath` (string), `onNavigate` (path => void), `onLogout` (() => void)

User object requires: `id`, `name`, `email`, `userType`, and count fields (`proposalsCount`, `listingsCount`, `virtualMeetingsCount`, `houseManualsCount`, `leasesCount`, `favoritesCount`, `unreadMessagesCount`). Optional: `avatarUrl`.
