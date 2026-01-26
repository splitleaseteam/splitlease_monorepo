# AdminHeader Component - Implementation Specification

**Created**: 2026-01-25
**Target**: OpenCode Implementation
**Scope**: Unified navigation header for 24 internal admin pages
**Based On**: Bubble Corporate Header (exact replication)

---

## Executive Summary

This specification provides a complete, implementation-ready design for the AdminHeader component that will serve as the unified navigation system across all 24 internal admin pages. The design exactly replicates the Bubble Corporate Header's visual specifications while adapting it for React with modern best practices.

**Key Features**:
- Dropdown navigation organizing 24 pages into 2 categories
- Responsive design (desktop 1440px, mobile 375px)
- User authentication awareness
- Exact visual match to Bubble specs

---

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Navigation Configuration](#navigation-configuration)
3. [Visual Specifications](#visual-specifications)
4. [Component Tree](#component-tree)
5. [Props & Interfaces](#props--interfaces)
6. [Dropdown Behavior](#dropdown-behavior)
7. [User Section Logic](#user-section-logic)
8. [Responsive Strategy](#responsive-strategy)
9. [Accessibility Requirements](#accessibility-requirements)
10. [Implementation Checklist](#implementation-checklist)

---

## Component Architecture

### Recommended File Structure

```
app/src/islands/shared/AdminHeader/
├── AdminHeader.jsx              # Main component (entry point)
├── AdminHeader.css              # All styles
├── components/
│   ├── DesktopHeader.jsx       # Desktop layout
│   ├── MobileHeader.jsx        # Mobile layout
│   ├── NavDropdown.jsx         # Reusable dropdown menu
│   ├── NavLink.jsx             # Single navigation link
│   └── UserSection.jsx         # User info/logout
└── config/
    └── navigationConfig.js      # Page definitions (all 24 pages)
```

### Architecture Decisions

**1. State Management**: CSS `:hover` for dropdowns (no React state needed)
- **Rationale**: Simpler, better performance, matches Bubble behavior
- **Implementation**: CSS `.nav-item:hover .dropdown { display: block; }`
- **Fallback**: Add React state only if iOS Safari has hover issues

**2. Responsive Strategy**: Separate components for desktop/mobile
- **Rationale**: Clearer code, easier to maintain, matches Bubble pattern
- **Implementation**: `<DesktopHeader />` and `<MobileHeader />` with media query visibility toggle
- **Breakpoint**: 992px (Desktop's Resolution min from Bubble)

**3. Icon Library**: lucide-react (already in project)
- **Rationale**: Consistent with existing codebase
- **Usage**: Import specific icons per page in navigationConfig.js

**4. Styling Approach**: Single CSS file with CSS custom properties
- **Rationale**: Centralized styling, easy theming, matches project conventions
- **File**: `AdminHeader.css`

**5. Configuration**: Config-driven navigation (navigationConfig.js)
- **Rationale**: Maintainable, scalable, easy to add/remove pages
- **Pattern**: Export arrays of page objects

---

## Navigation Configuration

### File: `config/navigationConfig.js`

```javascript
/**
 * Navigation configuration for AdminHeader
 *
 * Organizes 24 internal admin pages into dropdown categories:
 * - Corporate Pages: Production admin tools (18 pages)
 * - Unit Tests: Development/testing tools (6 pages)
 */

import {
  MessageSquare,
  Users,
  FileText,
  Calendar,
  Settings,
  AlertTriangle,
  Home,
  DollarSign,
  Mail,
  Shield,
  Star,
  UserCheck,
  Building,
  Edit3,
  Send,
  UserPlus,
  Wrench,
  TestTube,
  Bot,
  Sparkles,
  FlaskConical,
  Database,
} from 'lucide-react';

/**
 * Corporate Pages - Production admin tools
 * Alphabetically sorted within category
 */
export const corporatePages = [
  {
    id: 'admin-threads',
    name: 'Admin Threads',
    path: '/_internal/admin-threads',
    icon: MessageSquare,
    description: 'Manage all messaging threads',
    bubbleUrl: 'https://app.split.lease/version-test/_quick-threads-manage'
  },
  {
    id: 'co-host-requests',
    name: 'Co-Host Requests',
    path: '/_internal/co-host-requests',
    icon: UserPlus,
    description: 'Review co-host partnership requests',
    bubbleUrl: 'https://app.split.lease/version-test/_co-host-requests'
  },
  {
    id: 'create-document',
    name: 'Create Document',
    path: '/_internal/create-document',
    icon: FileText,
    description: 'Generate contracts and documents',
    bubbleUrl: 'https://app.split.lease/version-test/_create-document'
  },
  {
    id: 'create-suggested-proposal',
    name: 'Create Suggested Proposal',
    path: '/_internal/create-suggested-proposal',
    icon: Sparkles,
    description: 'Generate AI-suggested booking proposals',
    bubbleUrl: null // No Bubble existence
  },
  {
    id: 'emergency',
    name: 'Emergency Management',
    path: '/_internal/emergency',
    icon: AlertTriangle,
    description: 'Handle emergency reports and incidents',
    bubbleUrl: 'https://app.split.lease/version-test/_internal-emergency'
  },
  {
    id: 'experience-responses',
    name: 'Experience Responses',
    path: '/_internal/experience-responses',
    icon: Star,
    description: 'Review guest experience feedback',
    bubbleUrl: 'https://app.split.lease/version-test/_experience-responses'
  },
  {
    id: 'guest-relationships',
    name: 'Guest Relationships',
    path: '/_internal/guest-relationships',
    icon: Users,
    description: 'Manage guest relationships and history',
    bubbleUrl: 'https://app.split.lease/version-test/_guest-relationships-overview'
  },
  {
    id: 'leases-overview',
    name: 'Leases Overview',
    path: '/_internal/leases-overview',
    icon: FileText,
    description: 'View all active and past leases',
    bubbleUrl: 'https://app.split.lease/version-test/_leases-overview'
  },
  {
    id: 'listings-overview',
    name: 'Listings Overview',
    path: '/_internal/listings-overview',
    icon: Building,
    description: 'Manage all property listings',
    bubbleUrl: 'https://app.split.lease/version-test/_listings-overview'
  },
  {
    id: 'manage-informational-texts',
    name: 'Manage Informational Texts',
    path: '/_internal/manage-informational-texts',
    icon: Edit3,
    description: 'Edit site-wide informational content',
    bubbleUrl: 'https://app.split.lease/version-test/_add-informational-texts'
  },
  {
    id: 'manage-rental-applications',
    name: 'Manage Rental Applications',
    path: '/_internal/manage-rental-applications',
    icon: Shield,
    description: 'Review and process rental applications',
    bubbleUrl: 'https://app.split.lease/version-test/_rental-app-manage'
  },
  {
    id: 'manage-virtual-meetings',
    name: 'Manage Virtual Meetings',
    path: '/_internal/manage-virtual-meetings',
    icon: Calendar,
    description: 'Schedule and manage virtual property tours',
    bubbleUrl: 'https://app.split.lease/version-test/_manage-virtual-meetings'
  },
  {
    id: 'message-curation',
    name: 'Message Curation',
    path: '/_internal/message-curation',
    icon: Mail,
    description: 'Curate and moderate platform messages',
    bubbleUrl: 'https://app.split.lease/version-test/_message-curation'
  },
  {
    id: 'modify-listings',
    name: 'Modify Listings',
    path: '/_internal/modify-listings',
    icon: Settings,
    description: 'Bulk edit listing properties',
    bubbleUrl: 'https://app.split.lease/version-test/_modify-listings'
  },
  {
    id: 'proposal-manage',
    name: 'Proposal Management',
    path: '/_internal/proposal-manage',
    icon: FileText,
    description: 'Manage all booking proposals',
    bubbleUrl: 'https://app.split.lease/version-test/_proposal-manage'
  },
  {
    id: 'quick-price',
    name: 'Quick Price Calculator',
    path: '/_internal/quick-price',
    icon: DollarSign,
    description: 'Calculate pricing scenarios',
    bubbleUrl: 'https://app.split.lease/version-test/_quick-price'
  },
  {
    id: 'send-magic-login-links',
    name: 'Send Magic Login Links',
    path: '/_internal/send-magic-login-links',
    icon: Send,
    description: 'Send passwordless login links to users',
    bubbleUrl: 'https://app.split.lease/version-test/_send-magic-login-links'
  },
  {
    id: 'verify-users',
    name: 'Verify Users',
    path: '/_internal/verify-users',
    icon: UserCheck,
    description: 'Verify user identities and documents',
    bubbleUrl: 'https://app.split.lease/version-test/_verify-users'
  },
];

/**
 * Unit Tests / Development Tools
 * Testing and QA tools, alphabetically sorted
 */
export const unitTestPages = [
  {
    id: 'ai-tools',
    name: 'AI Tools',
    path: '/_internal/ai-tools',
    icon: Bot,
    description: 'AI-powered admin utilities',
    bubbleUrl: null // Reusable element in Bubble
  },
  {
    id: 'email-sms-unit',
    name: 'Email & SMS Unit Tests',
    path: '/_internal/email-sms-unit',
    icon: Mail,
    description: 'Test email templates and SMS messages',
    bubbleUrl: 'https://app.split.lease/version-test/_email-sms-unit'
  },
  {
    id: 'guest-simulation',
    name: 'Guest Simulation',
    path: '/_internal/guest-simulation',
    icon: Users,
    description: 'Simulate guest booking workflows',
    bubbleUrl: 'https://app.split.lease/version-test/simulation-guest-proposals-mobile-day1'
  },
  {
    id: 'internal-test',
    name: 'Internal Test Page',
    path: '/_internal/internal-test',
    icon: TestTube,
    description: 'General testing and QA page',
    bubbleUrl: null // No Bubble URL
  },
  {
    id: 'simulation-admin',
    name: 'Simulation Admin',
    path: '/_internal/simulation-admin',
    icon: Wrench,
    description: 'Admin simulation controls',
    bubbleUrl: 'https://app.split.lease/version-test/_simulation-admin'
  },
  {
    id: 'usability-data-management',
    name: 'Usability Data Management',
    path: '/_internal/usability-data-management',
    icon: Database,
    description: 'Manage usability testing data',
    bubbleUrl: 'https://app.split.lease/version-test/_usability-data'
  },
];

/**
 * Navigation configuration export
 */
export const navigationConfig = {
  corporatePages,
  unitTestPages,
  dropdowns: [
    {
      id: 'corporate-pages',
      label: 'Corporate Pages',
      items: corporatePages,
    },
    {
      id: 'unit-tests',
      label: 'Unit Tests',
      items: unitTestPages,
    },
  ],
};

/**
 * Helper to get current page info
 * @param {string} currentPath - window.location.pathname
 * @returns {object|null} - Page config object or null
 */
export function getCurrentPage(currentPath) {
  const allPages = [...corporatePages, ...unitTestPages];
  return allPages.find(page => page.path === currentPath) || null;
}
```

---

## Visual Specifications

### Colors (Exact Bubble Specs)

```css
/* From Bubble Technical Analysis */
:root {
  /* Primary Colors */
  --admin-header-bg: #0205D3;           /* Primary Blue (Header Background) */
  --admin-header-text: #FFFFFF;         /* White (Text, Borders) */
  --admin-header-button-text: #6D23CF;  /* Purple (Button Text) */
  --admin-header-button-bg: #FFFFFF;    /* White (Button Background) */

  /* Hover States */
  --admin-header-button-shadow: #00539B;  /* Button Shadow (Hover) */
  --admin-header-button-hover: #004480;   /* Button Text (Hover) */

  /* Dropdown */
  --admin-dropdown-bg: #FFFFFF;         /* White (Dropdown Background) */
  --admin-dropdown-shadow: rgba(0, 0, 0, 0.15);  /* Shadow */
  --admin-dropdown-hover-bg: #F5F5F5;   /* Hover background (inferred) */

  /* Mobile */
  --admin-mobile-border: #FFFFFF;       /* Mobile Header Border */
}
```

### Typography (Exact Bubble Specs)

```css
/* Logo Text */
.admin-header__logo-text {
  font-family: 'Avenir Next LT Pro', -apple-system, sans-serif;
  font-weight: 700;  /* Bold */
  font-size: 20px;
  color: var(--admin-header-text);
  line-height: 1.25;
  letter-spacing: 0;
  word-spacing: 0;
}

/* Navigation Menu Text */
.admin-header__nav-text {
  font-family: 'DM Sans', -apple-system, sans-serif;
  font-weight: 400;
  font-size: 18px;
  color: var(--admin-header-text);
  line-height: 1.25;
  letter-spacing: -1px;
  word-spacing: 1px;
  text-align: right;
}

/* User Section - Logged Out */
.admin-header__user-text {
  font-family: 'DM Sans', -apple-system, sans-serif;
  font-weight: 400;
  font-size: 18px;  /* Changes to 14px when logged in */
  color: var(--admin-header-text);
}

/* User Section - Logged In */
.admin-header__user-text--logged-in {
  font-size: 14px;
}

/* CTA Button (if needed) */
.admin-header__cta-button {
  font-family: 'DM Sans', -apple-system, sans-serif;
  font-weight: 400;
  font-size: 18px;
  color: var(--admin-header-button-text);
}
```

### Dimensions (Exact Bubble Specs)

```css
/* Desktop Header Container */
.admin-header__desktop {
  width: 100%;
  max-width: 1440px;
  height: 60px;
  background-color: var(--admin-header-bg);
  padding: 0 48px;
}

/* Logo Image */
.admin-header__logo-img {
  width: 40px;
  height: 40px;
  border-radius: 0;
}

/* Logo Text (hides at 1400px) */
.admin-header__logo-text {
  width: 118px;
  height: 28px;
  min-width: 20%;
}

/* Navigation Dropdown */
.admin-header__dropdown {
  position: absolute;
  width: 449px;
  height: auto;  /* Variable height based on content */
  min-height: 285px;  /* Bubble spec */
  background-color: var(--admin-dropdown-bg);
  border-radius: 0 0 5px 5px;  /* Bottom corners only */
  box-shadow: 0 16px 8px var(--admin-dropdown-shadow);
  top: 100%;
  margin-top: 13px;  /* Offset Top */
  margin-left: -90px;  /* Offset Left */
  z-index: 1000;
}

/* Dropdown Chevron Icon */
.admin-header__dropdown-icon {
  width: 26px;
  height: 22px;
  color: var(--admin-header-text);
}

/* User Profile Image */
.admin-header__profile-img {
  width: 45px;
  height: 39px;
  border-radius: 100%;  /* Fully circular */
  object-fit: cover;
}

/* CTA Button (if needed) */
.admin-header__cta-button {
  width: 180px;
  height: 44px;
  border: 2px solid var(--admin-header-button-bg);
  border-radius: 5px;
  background-color: var(--admin-header-button-bg);
}

/* Mobile Header */
.admin-header__mobile {
  width: 375px;
  height: 70px;
  border: 1px dotted var(--admin-mobile-border);
}
```

### Responsive Breakpoints

```css
/* Desktop Minimum Width */
@media (min-width: 992px) {
  .admin-header__desktop {
    display: flex;
  }
  .admin-header__mobile {
    display: none;
  }
}

/* Mobile Maximum Width */
@media (max-width: 991px) {
  .admin-header__desktop {
    display: none;
  }
  .admin-header__mobile {
    display: flex;
  }
}

/* Logo Text Hide at 1400px */
@media (max-width: 1399px) {
  .admin-header__logo-text {
    display: none;
  }
}
```

---

## Component Tree

```
<AdminHeader>
├── <DesktopHeader> (>= 992px)
│   ├── <div className="admin-header__left">
│   │   ├── <a href="/" className="admin-header__logo">
│   │   │   ├── <img className="admin-header__logo-img" />
│   │   │   └── <span className="admin-header__logo-text">Split Lease</span>
│   │   │
│   │   └── <nav className="admin-header__nav">
│   │       ├── <NavDropdown label="Corporate Pages" items={corporatePages}>
│   │       │   └── <div className="admin-header__dropdown">
│   │       │       └── {items.map(item => <NavLink {...item} />)}
│   │       │
│   │       └── <NavDropdown label="Unit Tests" items={unitTestPages}>
│   │           └── <div className="admin-header__dropdown">
│   │               └── {items.map(item => <NavLink {...item} />)}
│   │
│   └── <div className="admin-header__right">
│       ├── <button className="admin-header__cta-button">(Optional CTA)</button>
│       └── <UserSection user={currentUser} />
│           ├── [When logged out]:
│           │   └── <span className="admin-header__user-text">Log In</span>
│           │
│           └── [When logged in]:
│               ├── <span className="admin-header__user-text--logged-in">
│               │   {firstName}, {email}, admin user: {isAdmin}
│               └── <img className="admin-header__profile-img" />
│
└── <MobileHeader> (< 992px)
    ├── <button className="admin-header__hamburger">
    │   └── <Menu icon />
    │
    ├── <div className="admin-header__mobile-logo">
    │   └── <img className="admin-header__logo-img" />
    │
    └── <MobileMenu isOpen={mobileMenuOpen}>
        ├── <NavDropdown label="Corporate Pages" items={corporatePages} />
        └── <NavDropdown label="Unit Tests" items={unitTestPages} />
```

---

## Props & Interfaces

### Main Component: `AdminHeader.jsx`

```jsx
/**
 * AdminHeader - Unified navigation for internal admin pages
 *
 * @param {object} props
 * @param {object|null} props.user - Current authenticated user (from auth context)
 * @param {string} props.currentPath - Current page path (for active state highlighting)
 * @param {boolean} [props.showCTA=false] - Show optional CTA button (e.g., "Change Prices")
 * @param {string} [props.ctaText] - CTA button text
 * @param {function} [props.onCTAClick] - CTA button click handler
 * @param {string} [props.className] - Additional CSS classes
 */
export default function AdminHeader({
  user = null,
  currentPath = window.location.pathname,
  showCTA = false,
  ctaText = 'Change Prices',
  onCTAClick = () => {},
  className = '',
}) {
  // Implementation
}
```

### Sub-Component: `NavDropdown.jsx`

```jsx
/**
 * NavDropdown - Dropdown menu with page links
 *
 * @param {object} props
 * @param {string} props.label - Dropdown trigger label
 * @param {array} props.items - Array of page config objects
 * @param {string} [props.currentPath] - Current page path (for active highlighting)
 * @param {string} [props.className] - Additional CSS classes
 */
export default function NavDropdown({
  label,
  items,
  currentPath = window.location.pathname,
  className = '',
}) {
  return (
    <div className={`admin-header__nav-item ${className}`}>
      <button className="admin-header__nav-trigger">
        <span>{label}</span>
        <ChevronDown className="admin-header__dropdown-icon" />
      </button>

      <div className="admin-header__dropdown">
        {items.map(item => (
          <NavLink
            key={item.id}
            {...item}
            isActive={currentPath === item.path}
          />
        ))}
      </div>
    </div>
  );
}
```

### Sub-Component: `NavLink.jsx`

```jsx
/**
 * NavLink - Single navigation link in dropdown
 *
 * @param {object} props
 * @param {string} props.name - Display name
 * @param {string} props.path - Target URL path
 * @param {object} props.icon - Lucide icon component
 * @param {string} [props.description] - Tooltip/title text
 * @param {boolean} [props.isActive=false] - Is current page
 */
export default function NavLink({
  name,
  path,
  icon: Icon,
  description = '',
  isActive = false,
}) {
  return (
    <a
      href={path}
      className={`admin-header__dropdown-link ${isActive ? 'admin-header__dropdown-link--active' : ''}`}
      title={description}
    >
      <Icon className="admin-header__dropdown-link-icon" size={18} />
      <span>{name}</span>
    </a>
  );
}
```

### Sub-Component: `UserSection.jsx`

```jsx
/**
 * UserSection - User authentication display
 *
 * @param {object} props
 * @param {object|null} props.user - User object or null if logged out
 * @param {string} [props.user.firstName] - User first name
 * @param {string} [props.user.email] - User email
 * @param {boolean} [props.user.isAdmin] - Admin status
 * @param {string} [props.user.profilePhotoUrl] - Profile photo URL
 */
export default function UserSection({ user }) {
  if (!user) {
    return (
      <div className="admin-header__user-section">
        <span className="admin-header__user-text">Log In</span>
      </div>
    );
  }

  return (
    <div className="admin-header__user-section admin-header__user-section--logged-in">
      <span className="admin-header__user-text admin-header__user-text--logged-in">
        {user.firstName}, {user.email}, admin user: {user.isAdmin.toString()}
      </span>
      {user.profilePhotoUrl && (
        <img
          src={user.profilePhotoUrl}
          alt={user.firstName}
          className="admin-header__profile-img"
        />
      )}
    </div>
  );
}
```

---

## Dropdown Behavior

### Interaction Specifications

**Trigger Mechanism**: CSS `:hover` (no JavaScript required)

```css
.admin-header__nav-item:hover .admin-header__dropdown {
  display: block;
}
```

**Positioning**:
- Position: `absolute`
- Relative to: `.admin-header__nav-item` (parent)
- Top offset: `100%` + `13px` margin
- Left offset: `-90px` margin (to align dropdown with trigger)

**Visibility**:
- Default: `display: none`
- On hover: `display: block`
- Transition: Optional 150ms fade-in for polish

**Click-Outside Behavior**:
- Not required for CSS hover implementation
- If adding React state (e.g., for click-to-open on mobile), use `useClickOutside` hook

**Keyboard Navigation**:
- Tab: Focus next link in dropdown
- Shift+Tab: Focus previous link
- Enter/Space: Activate focused link
- Escape: Close dropdown (if using React state)

**Current Page Indicator**:
```css
.admin-header__dropdown-link--active {
  background-color: var(--admin-dropdown-hover-bg);
  font-weight: 600;
  border-left: 3px solid var(--admin-header-bg);
}
```

**Search/Filter**:
- Not required for initial implementation
- Corporate Pages: 18 items (acceptable without search)
- Unit Tests: 6 items (acceptable without search)
- Consider adding if user feedback requests it

**Grouping Within Dropdowns**:
- Not required initially
- All items in flat list, alphabetically sorted
- Consider adding categories if dropdowns grow beyond 20 items

---

## User Section Logic

### State Handling

**Data Source**:
- User object from `lib/auth.js` → `validateTokenAndFetchUser()`
- Check authentication on component mount

**User Object Shape**:
```javascript
{
  firstName: string,
  email: string,
  isAdmin: boolean,
  profilePhotoUrl: string | null,
  userType: 'Host' | 'Guest'
}
```

**Conditional Rendering**:

```jsx
// Logged Out State
if (!user) {
  return (
    <div className="admin-header__user-section">
      <span className="admin-header__user-text">Log In</span>
    </div>
  );
}

// Logged In State
return (
  <div className="admin-header__user-section admin-header__user-section--logged-in">
    <span className="admin-header__user-text admin-header__user-text--logged-in">
      {user.firstName}, {user.email}, admin user: {user.isAdmin}
    </span>

    {user.profilePhotoUrl && (
      <img
        src={user.profilePhotoUrl}
        alt={user.firstName}
        className="admin-header__profile-img"
      />
    )}
  </div>
);
```

**Logout Interaction**:
- Not required in initial spec (Bubble doesn't show logout in header)
- If adding later: Add dropdown menu on profile image click
- Menu items: "Account Settings", "Logout"

**Admin vs Non-Admin**:
- Currently: Display `isAdmin` status as text
- Future enhancement: Different styling or badges for admin users
- Future enhancement: Hide certain dropdown items for non-admin

---

## Responsive Strategy

### Desktop Header (>= 992px)

**Layout**: Flexbox horizontal layout

```css
.admin-header__desktop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1440px;
  height: 60px;
  background-color: var(--admin-header-bg);
  padding: 0 48px;
}

.admin-header__left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.admin-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}
```

**Dropdowns**: Appear below trigger on hover

### Mobile Header (< 992px)

**Layout**: Hamburger menu with slide-out drawer

```jsx
export default function MobileHeader({ user }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="admin-header__mobile">
      <button
        className="admin-header__hamburger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      <div className="admin-header__mobile-logo">
        <img
          src="/assets/images/split-lease-purple-circle.png"
          alt="Split Lease"
          className="admin-header__logo-img"
        />
      </div>

      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <MobileDropdown label="Corporate Pages" items={corporatePages} />
        <MobileDropdown label="Unit Tests" items={unitTestPages} />
        <UserSection user={user} />
      </MobileMenu>
    </div>
  );
}
```

**Mobile Menu Component**:

```jsx
function MobileMenu({ isOpen, onClose, children }) {
  return (
    <div className={`admin-header__mobile-menu ${isOpen ? 'admin-header__mobile-menu--open' : ''}`}>
      <div className="admin-header__mobile-menu-header">
        <button
          className="admin-header__mobile-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
      </div>

      <div className="admin-header__mobile-menu-content">
        {children}
      </div>
    </div>
  );
}
```

**Mobile Dropdown**: Accordion-style (expand/collapse)

```css
.admin-header__mobile-dropdown {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.admin-header__mobile-dropdown__trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px;
  background: none;
  border: none;
  color: var(--admin-header-text);
  font-size: 18px;
  cursor: pointer;
}

.admin-header__mobile-dropdown__content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.admin-header__mobile-dropdown__content--open {
  max-height: 1000px;  /* Large enough for all items */
}
```

**Transition Between Desktop/Mobile**:

```css
/* Smooth transition when resizing */
.admin-header__desktop,
.admin-header__mobile {
  transition: opacity 0.2s ease;
}

@media (min-width: 992px) {
  .admin-header__desktop {
    opacity: 1;
  }
  .admin-header__mobile {
    opacity: 0;
    pointer-events: none;
  }
}

@media (max-width: 991px) {
  .admin-header__desktop {
    opacity: 0;
    pointer-events: none;
  }
  .admin-header__mobile {
    opacity: 1;
  }
}
```

---

## Accessibility Requirements

### ARIA Labels

```jsx
// Dropdown trigger
<button
  className="admin-header__nav-trigger"
  aria-haspopup="true"
  aria-expanded={isOpen}  // If using React state
  aria-label={`Open ${label} menu`}
>
  {label}
</button>

// Dropdown menu
<div
  className="admin-header__dropdown"
  role="menu"
  aria-label={`${label} pages`}
>
  {items.map(item => (
    <a
      key={item.id}
      role="menuitem"
      href={item.path}
      aria-current={isActive ? 'page' : undefined}
    >
      {item.name}
    </a>
  ))}
</div>

// Mobile hamburger
<button
  className="admin-header__hamburger"
  aria-label="Open navigation menu"
  aria-expanded={isOpen}
>
  <Menu />
</button>
```

### Keyboard Navigation

**Tab Order**:
1. Logo (focusable link)
2. Corporate Pages dropdown trigger
3. Unit Tests dropdown trigger
4. CTA button (if present)
5. User section (if clickable)
6. When dropdown open: Each link in dropdown

**Keyboard Shortcuts**:
- `Tab`: Move focus forward
- `Shift+Tab`: Move focus backward
- `Enter` / `Space`: Activate focused link or toggle dropdown
- `Escape`: Close dropdown (if using React state)
- `Arrow Down`: Move to next item in open dropdown
- `Arrow Up`: Move to previous item in open dropdown
- `Home`: Focus first item in dropdown
- `End`: Focus last item in dropdown

**Focus Management**:

```css
/* Visible focus indicator */
.admin-header__nav-trigger:focus,
.admin-header__dropdown-link:focus {
  outline: 2px solid var(--admin-header-text);
  outline-offset: 2px;
}

/* Remove default outline, use custom */
.admin-header__nav-trigger:focus-visible,
.admin-header__dropdown-link:focus-visible {
  outline: 2px solid var(--admin-header-text);
  outline-offset: 2px;
}
```

### Screen Reader Support

**Landmark Roles**:

```jsx
<header role="banner">
  <nav role="navigation" aria-label="Admin pages navigation">
    {/* Navigation content */}
  </nav>
</header>
```

**Live Regions** (if using React state for notifications):

```jsx
<div
  role="status"
  aria-live="polite"
  className="visually-hidden"
>
  {/* Announce dropdown state changes */}
  {isOpen && `${label} menu opened`}
</div>
```

**Visually Hidden Text**:

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Color Contrast

**WCAG AA Compliance** (4.5:1 for normal text, 3:1 for large text):

- Header background (#0205D3) vs White text (#FFFFFF): **14.8:1** ✅
- Button text (#6D23CF) vs White background (#FFFFFF): **7.4:1** ✅
- Dropdown links: Black text on white: **21:1** ✅

### Skip Links

```jsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--admin-header-bg);
  color: var(--admin-header-text);
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

---

## Implementation Checklist

### Phase 1: Setup & Configuration (30 min)

- [ ] Create file structure:
  - [ ] `app/src/islands/shared/AdminHeader/AdminHeader.jsx`
  - [ ] `app/src/islands/shared/AdminHeader/AdminHeader.css`
  - [ ] `app/src/islands/shared/AdminHeader/components/`
  - [ ] `app/src/islands/shared/AdminHeader/config/navigationConfig.js`

- [ ] Copy `navigationConfig.js` from this spec (all 24 pages defined)

- [ ] Add lucide-react icons if not already installed:
  ```bash
  bun add lucide-react
  ```

### Phase 2: Desktop Header (2 hours)

- [ ] **DesktopHeader.jsx**:
  - [ ] Create component skeleton
  - [ ] Add logo (image + text)
  - [ ] Add navigation dropdowns (Corporate Pages, Unit Tests)
  - [ ] Add UserSection
  - [ ] Optional: Add CTA button

- [ ] **NavDropdown.jsx**:
  - [ ] Create dropdown trigger with label + chevron
  - [ ] Create dropdown menu container
  - [ ] Map items to NavLink components
  - [ ] Add CSS hover behavior

- [ ] **NavLink.jsx**:
  - [ ] Create link with icon + text
  - [ ] Add active state highlighting
  - [ ] Add title attribute with description

- [ ] **UserSection.jsx**:
  - [ ] Conditional rendering (logged out vs logged in)
  - [ ] Display user info (firstName, email, isAdmin)
  - [ ] Display profile image (if available)

### Phase 3: Styling (2 hours)

- [ ] **AdminHeader.css**:
  - [ ] Define CSS custom properties (colors)
  - [ ] Desktop header container styles
  - [ ] Logo styles (image + text)
  - [ ] Navigation styles
  - [ ] Dropdown menu styles (exact Bubble specs)
  - [ ] User section styles
  - [ ] Hover states
  - [ ] Active link highlighting

- [ ] **Verify exact match to Bubble specs**:
  - [ ] Header height: 60px
  - [ ] Header background: #0205D3
  - [ ] Dropdown width: 449px
  - [ ] Dropdown shadow: 0 16px 8px rgba(0, 0, 0, 0.15)
  - [ ] Border radius: 0 0 5px 5px
  - [ ] Profile image: 45×39px, circular
  - [ ] Font sizes, weights, colors

### Phase 4: Mobile Header (2 hours)

- [ ] **MobileHeader.jsx**:
  - [ ] Hamburger button
  - [ ] Mobile logo
  - [ ] MobileMenu component (slide-out drawer)

- [ ] **MobileMenu.jsx**:
  - [ ] Overlay background
  - [ ] Slide-in animation
  - [ ] Close button
  - [ ] Content area with dropdowns

- [ ] **MobileDropdown.jsx**:
  - [ ] Accordion-style expand/collapse
  - [ ] Trigger button
  - [ ] Content area with links
  - [ ] Smooth transitions

- [ ] **Mobile styles**:
  - [ ] Mobile header container (375px × 70px)
  - [ ] Hamburger button
  - [ ] Slide-out menu animation
  - [ ] Accordion dropdown styles

### Phase 5: Responsive Behavior (1 hour)

- [ ] **Media queries**:
  - [ ] Desktop (>= 992px): Show DesktopHeader, hide MobileHeader
  - [ ] Mobile (< 992px): Hide DesktopHeader, show MobileHeader
  - [ ] Logo text: Hide at < 1400px

- [ ] **Test at breakpoints**:
  - [ ] 1440px (desktop max)
  - [ ] 1399px (logo text disappears)
  - [ ] 992px (desktop/mobile switch)
  - [ ] 375px (mobile min)

### Phase 6: Authentication Integration (1 hour)

- [ ] **Fetch user data**:
  - [ ] Import `validateTokenAndFetchUser` from `lib/auth.js`
  - [ ] Call on component mount
  - [ ] Handle loading state
  - [ ] Handle error state

- [ ] **Pass user prop**:
  - [ ] AdminHeader receives user object or null
  - [ ] DesktopHeader forwards to UserSection
  - [ ] MobileHeader forwards to UserSection

### Phase 7: Accessibility (1 hour)

- [ ] **ARIA attributes**:
  - [ ] `aria-haspopup`, `aria-expanded` on dropdown triggers
  - [ ] `role="menu"`, `role="menuitem"` on dropdowns
  - [ ] `aria-current="page"` on active links
  - [ ] `aria-label` on buttons

- [ ] **Keyboard navigation**:
  - [ ] Tab order correct
  - [ ] Enter/Space activate links
  - [ ] Escape closes dropdowns (if using React state)
  - [ ] Arrow keys navigate within dropdown

- [ ] **Focus management**:
  - [ ] Visible focus indicators
  - [ ] Focus trap in mobile menu (optional)

- [ ] **Screen reader**:
  - [ ] Test with NVDA/JAWS
  - [ ] Verify announcements

### Phase 8: Testing (2 hours)

- [ ] **Visual testing**:
  - [ ] Compare side-by-side with Bubble screenshot
  - [ ] Verify all 24 pages appear in correct dropdowns
  - [ ] Check dropdown positioning
  - [ ] Check user section (logged in/out)
  - [ ] Check responsive behavior

- [ ] **Functional testing**:
  - [ ] All links navigate correctly
  - [ ] Dropdowns open/close on hover (desktop)
  - [ ] Mobile menu opens/closes
  - [ ] Mobile accordions expand/collapse
  - [ ] Active page highlighting works

- [ ] **Cross-browser testing**:
  - [ ] Chrome, Firefox, Safari, Edge
  - [ ] Mobile Safari, Mobile Chrome

- [ ] **Accessibility testing**:
  - [ ] Keyboard navigation
  - [ ] Screen reader
  - [ ] Color contrast (automated tools)

### Phase 9: Integration (1 hour)

- [ ] **Add to internal pages**:
  - [ ] Import AdminHeader in each page component
  - [ ] Replace existing simple header
  - [ ] Test on multiple pages

- [ ] **Example integration**:
  ```jsx
  import AdminHeader from 'islands/shared/AdminHeader/AdminHeader';

  export default function AdminThreadsPage() {
    const logic = useAdminThreadsPageLogic();

    return (
      <div>
        <AdminHeader user={logic.user} />
        {/* Page content */}
      </div>
    );
  }
  ```

### Phase 10: Documentation (30 min)

- [ ] **Add README**:
  - [ ] Component overview
  - [ ] Props documentation
  - [ ] Usage examples
  - [ ] Customization guide

- [ ] **Add to CLAUDE.md**:
  - [ ] Update `islands/shared/CLAUDE.md` with AdminHeader entry
  - [ ] Document navigationConfig.js structure

---

## Edge Cases

### Handling Edge Cases

**1. Very Long User Names**:
```css
.admin-header__user-text {
  max-width: 230px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**2. No Profile Photo**:
```jsx
{user.profilePhotoUrl ? (
  <img src={user.profilePhotoUrl} alt={user.firstName} />
) : (
  <div className="admin-header__profile-placeholder">
    {user.firstName.charAt(0).toUpperCase()}
  </div>
)}
```

**3. Network Error Fetching User**:
```jsx
const [user, setUser] = useState(null);
const [authError, setAuthError] = useState(null);

useEffect(() => {
  async function fetchUser() {
    try {
      const userData = await validateTokenAndFetchUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setAuthError(err.message);
      // Still render header, just show "Log In" state
    }
  }
  fetchUser();
}, []);
```

**4. Dropdown Overflows Viewport (Bottom)**:
```css
.admin-header__dropdown {
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}
```

**5. Dropdown Overflows Viewport (Right Edge)**:
```css
@media (max-width: 600px) {
  .admin-header__dropdown {
    right: 0;
    left: auto;
    margin-left: 0;
  }
}
```

**6. Current Page Not in Navigation**:
- No active highlighting
- Normal behavior, no errors

**7. User Object Missing Fields**:
```jsx
<UserSection user={user} />

// Inside UserSection
const firstName = user?.firstName || 'User';
const email = user?.email || '';
const isAdmin = user?.isAdmin ?? false;
```

---

## Testing Strategy

### Manual Testing Checklist

**Desktop (>= 992px)**:
- [ ] Header appears with correct dimensions (1440px × 60px)
- [ ] Logo image displays
- [ ] Logo text displays (and hides at < 1400px)
- [ ] Corporate Pages dropdown appears on hover
- [ ] Unit Tests dropdown appears on hover
- [ ] Dropdowns contain all 24 pages (18 + 6)
- [ ] Links navigate correctly
- [ ] Current page is highlighted
- [ ] User section shows "Log In" when logged out
- [ ] User section shows user info + photo when logged in

**Mobile (< 992px)**:
- [ ] Mobile header appears (375px × 70px)
- [ ] Hamburger button works
- [ ] Mobile menu slides in/out
- [ ] Dropdowns expand/collapse (accordion)
- [ ] All 24 pages accessible
- [ ] Links navigate correctly

**Responsive Transitions**:
- [ ] Smooth transition at 992px breakpoint
- [ ] No flash of wrong layout
- [ ] No layout shift

**Accessibility**:
- [ ] Keyboard navigation works
- [ ] Screen reader announces dropdowns
- [ ] Focus indicators visible
- [ ] Color contrast passes

### Automated Testing

**Unit Tests** (Vitest + React Testing Library):

```javascript
// AdminHeader.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AdminHeader from './AdminHeader';

describe('AdminHeader', () => {
  it('renders logo and navigation', () => {
    render(<AdminHeader user={null} />);
    expect(screen.getByAlt('Split Lease')).toBeInTheDocument();
    expect(screen.getByText('Corporate Pages')).toBeInTheDocument();
    expect(screen.getByText('Unit Tests')).toBeInTheDocument();
  });

  it('shows "Log In" when user is null', () => {
    render(<AdminHeader user={null} />);
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });

  it('shows user info when logged in', () => {
    const user = {
      firstName: 'Igor',
      email: 'igor@splitlease.com',
      isAdmin: true,
    };
    render(<AdminHeader user={user} />);
    expect(screen.getByText(/Igor, igor@splitlease.com/)).toBeInTheDocument();
  });

  it('renders all 24 pages in dropdowns', () => {
    render(<AdminHeader user={null} />);
    // Check that all page names appear
    expect(screen.getByText('Admin Threads')).toBeInTheDocument();
    expect(screen.getByText('Verify Users')).toBeInTheDocument();
    // ... test all 24
  });
});
```

**Visual Regression Testing** (Playwright):

```javascript
// adminHeader.spec.js
import { test, expect } from '@playwright/test';

test.describe('AdminHeader', () => {
  test('desktop layout matches design', async ({ page }) => {
    await page.goto('/_internal/admin-threads');
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('.admin-header__desktop')).toHaveScreenshot();
  });

  test('mobile layout matches design', async ({ page }) => {
    await page.goto('/_internal/admin-threads');
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.admin-header__mobile')).toHaveScreenshot();
  });

  test('dropdown opens on hover', async ({ page }) => {
    await page.goto('/_internal/admin-threads');
    await page.hover('text=Corporate Pages');
    await expect(page.locator('.admin-header__dropdown')).toBeVisible();
  });
});
```

---

## Code Snippets for Complex Logic

### Auto-Detecting Current Page

```jsx
// AdminHeader.jsx
import { useEffect, useState } from 'react';
import { getCurrentPage } from './config/navigationConfig';

export default function AdminHeader({ user }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Update current path on popstate (browser back/forward)
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const currentPage = getCurrentPage(currentPath);

  return (
    <header className="admin-header">
      <DesktopHeader
        currentPath={currentPath}
        currentPage={currentPage}
        user={user}
      />
      <MobileHeader
        currentPath={currentPath}
        currentPage={currentPage}
        user={user}
      />
    </header>
  );
}
```

### Click-Outside Hook (if needed for React state dropdowns)

```jsx
// useClickOutside.js
import { useEffect, useRef } from 'react';

export function useClickOutside(callback) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [callback]);

  return ref;
}

// Usage in NavDropdown.jsx
const dropdownRef = useClickOutside(() => setIsOpen(false));
```

### Fetching User Data

```jsx
// AdminHeader.jsx
import { useEffect, useState } from 'react';
import { validateTokenAndFetchUser } from 'lib/auth';

export default function AdminHeader() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await validateTokenAndFetchUser({ clearOnFailure: false });
        setUser(userData);
      } catch (err) {
        console.error('[AdminHeader] Failed to fetch user:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  if (isLoading) {
    return <div className="admin-header admin-header--loading">Loading...</div>;
  }

  return (
    <header className="admin-header">
      {/* Rest of component */}
    </header>
  );
}
```

---

## Summary

This specification provides everything OpenCode needs to implement the AdminHeader component:

✅ **Complete navigation config** with all 24 pages
✅ **Exact visual specifications** from Bubble
✅ **Component architecture** with recommended file structure
✅ **Props interfaces** for all components
✅ **Dropdown behavior** specifications
✅ **User section logic** with conditional rendering
✅ **Responsive strategy** for desktop + mobile
✅ **Accessibility requirements** (ARIA, keyboard, screen reader)
✅ **Implementation checklist** with time estimates (total: ~12 hours)
✅ **Edge case handling**
✅ **Testing strategy** (manual + automated)
✅ **Code snippets** for complex logic

**Total Estimated Time**: 12-15 hours for complete implementation

**Quality Bar**: No additional questions should be needed - spec is implementation-ready.

---

**End of Specification**
