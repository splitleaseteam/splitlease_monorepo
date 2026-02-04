# Document Review Modal Feature - Implementation Plan

## Executive Summary

This plan outlines the implementation of a **Document Review Modal** feature that allows hosts and guests to request changes to draft documents. The modal will display a list of draft documents, allow users to select a document and provide change requests via freeform text, and send notifications to the Split Lease team via Slack webhook integration.

## Requirements Analysis

Based on the requirements:
1. Create a shared island component (modal) accessible to both hosts and guests
2. Display a list of draft documents that users can select from
3. Include a freeform text input for change requests/comments
4. Allow users to select which document they're requesting changes for
5. Send a Slack notification to the Split Lease team when a change request is submitted
6. Modal should be reusable across different pages

## Codebase Analysis

### Existing Modal Patterns Found

1. **EditPhoneNumberModal** (`app/src/islands/modals/EditPhoneNumberModal.jsx`)
   - Follows POPUP_REPLICATION_PROTOCOL.md design system
   - Monochromatic purple color scheme
   - Mobile bottom sheet behavior (< 480px)
   - Feather icons (stroke-only)
   - Pill-shaped buttons (100px radius)
   - Uses controlled component pattern (isOpen prop)
   - Proper overlay click handling and ESC key support
   - Body scroll prevention when open

2. **MapModal** (`app/src/islands/modals/MapModal.jsx`)
   - Header + Body + Footer structure
   - Close button in header
   - Action buttons in footer
   - Backdrop click handling

3. **NotificationSettingsModal** (`app/src/islands/modals/NotificationSettingsModal.jsx`)
   - Wraps shared island component
   - Header with icon, title, subtitle
   - Modal body contains shared island
   - Proper ARIA attributes

4. **CreateDuplicateListingModal** (`app/src/islands/shared/CreateDuplicateListingModal.jsx`)
   - Multi-view mode pattern (create/copy)
   - Form validation
   - Loading states
   - Toast notifications integration
   - Supabase integration

### Slack Integration Patterns Found

1. **Supabase Slack Integration** (`supabase/functions/_shared/slack.ts`)
   - `sendToSlack(channel, message)` - Fire-and-forget webhook pattern
   - Channels: 'database', 'acquisition', 'general'
   - Environment variables: SLACK_WEBHOOK_DATABASE_WEBHOOK, SLACK_WEBHOOK_ACQUISITION, SLACK_WEBHOOK_GENERAL
   - Simple message format: `{ text: "message" }`

2. **Slack Edge Function** (`supabase/functions/slack/index.ts`)
   - Action-based routing: `{ action, payload }`
   - Example action: `faq_inquiry`
   - CORS headers included
   - Error handling with ValidationError

3. **Frontend Slack Service** (`app/src/lib/slackService.js`)
   - Currently uses Cloudflare Pages Function proxy
   - `sendFaqInquiry()` function
   - Calls `/api/faq-inquiry` endpoint

### Document System Found

1. **Lease Documents Edge Function** (`supabase/functions/lease-documents/index.ts`)
   - Actions: generate_host_payout, generate_supplemental, generate_periodic_tenancy, generate_credit_card_auth, generate_all
   - Google Drive integration for document storage
   - Returns filename, driveUrl, fileId

### Architecture Patterns

- **Islands Architecture**: Each page is an independent React root
- **Hollow Component Pattern**: UI components delegate logic to custom hooks
- **Action-Based Edge Functions**: All Edge Functions use `{ action, payload }` request pattern
- **Shared Utilities**: Located in `app/src/lib/`
- **Toast Notifications**: Available via Toast.jsx component

## Implementation Plan

### 1. Database Schema

**Table: `document_change_requests`**

```sql
CREATE TABLE document_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_type TEXT, -- 'host' or 'guest'
  change_request TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  slack_message_ts TEXT, -- For updating Slack messages if needed
  lease_id TEXT, -- Optional: Associate with a lease if applicable
  listing_id TEXT -- Optional: Associate with a listing if applicable
);

-- Indexes
CREATE INDEX idx_dcr_user_id ON document_change_requests(user_id);
CREATE INDEX idx_dcr_status ON document_change_requests(status);
CREATE INDEX idx_dcr_document_id ON document_change_requests(document_id);
CREATE INDEX idx_dcr_created_at ON document_change_requests(created_at DESC);

-- RLS Policies
ALTER TABLE document_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON document_change_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
  ON document_change_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can do anything"
  ON document_change_requests FOR ALL
  USING (auth.role() = 'service_role');
```

### 2. Files to Create

#### Frontend Files

1. **`app/src/islands/modals/DocumentReviewModal.jsx`**
   - Main modal component following existing modal patterns
   - Document selection dropdown/list
   - Freeform text area for change requests
   - Submit and Cancel buttons
   - Loading and success states
   - Form validation

2. **`app/src/islands/modals/DocumentReviewModal.css`**
   - Modal styling following POPUP_REPLICATION_PROTOCOL.md
   - Monochromatic purple color scheme
   - Mobile bottom sheet behavior
   - Responsive design

3. **`app/src/lib/documentReviewService.js`**
   - API client for document change requests
   - Functions: `submitChangeRequest()`, `fetchDraftDocuments()`
   - Supabase integration

4. **`app/src/logic/processors/documents/processDocumentChangeRequest.js`**
   - Process change request data before submission
   - Format data for Slack notification
   - Four-layer logic architecture compliance

#### Backend Files (Edge Functions)

5. **`supabase/functions/document-change-requests/index.ts`**
   - Main Edge Function entry point
   - Action-based routing
   - CORS headers
   - Error handling

6. **`supabase/functions/document-change-requests/handlers/submitChangeRequest.ts`**
   - Handle change request submission
   - Insert into document_change_requests table
   - Send Slack notification
   - Return success response

7. **`supabase/functions/document-change-requests/deno.json`**
   - Import map for the function

#### Database Migration

8. **`supabase/migrations/YYYYMMDD_create_document_change_requests.sql`**
   - Table creation
   - Indexes
   - RLS policies

### 3. Files to Modify

1. **`app/src/routes.config.js`**
   - No changes needed (modal is a component, not a route)

2. **`supabase/functions/_shared/slack.ts`**
   - Optionally add new channel constant if needed: `SLACK_WEBHOOK_DOCUMENT_REVIEW`

3. **Pages that will use the modal** (implementation-specific):
   - Host pages (e.g., HostProposalsPage, HostLeasesPage)
   - Guest pages (e.g., GuestProposalsPage, GuestLeasesPage)

### 4. Component Hierarchy

```
DocumentReviewModal (shared modal component)
├── Modal Container
│   ├── Header
│   │   ├── Icon (Feather-style)
│   │   ├── Title
│   │   ├── Subtitle
│   │   └── Close Button
│   ├── Body
│   │   ├── Document Selection
│   │   │   ├── Dropdown/Radio Group
│   │   │   └── Document List
│   │   └── Change Request Input
│   │       └── Textarea
│   └── Footer
│       ├── Cancel Button
│       └── Submit Button
└── Toast Notification (on success)
```

### 5. Edge Function Requirements

**Function Name**: `document-change-requests`

**Actions**:
- `submit_change_request` - Submit a document change request

**Request Format**:
```json
{
  "action": "submit_change_request",
  "payload": {
    "document_id": "AGR-12345",
    "document_type": "periodic_tenancy_agreement",
    "document_name": "Periodic Tenancy Agreement - 123 Main St",
    "change_request": "Please update the move-in date to Jan 15, 2026",
    "lease_id": "optional-lease-id",
    "listing_id": "optional-listing-id"
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "request_id": "uuid",
    "status": "pending",
    "created_at": "2026-02-02T12:00:00Z"
  }
}
```

**Slack Message Format**:
```
📄 Document Change Request

*Document:* Periodic Tenancy Agreement - 123 Main St
*Document ID:* AGR-12345
*User:* John Doe (john@example.com)
*Type:* Host
*Lease ID:* LEASE-12345 (if applicable)

*Change Request:*
Please update the move-in date to Jan 15, 2026

*Timestamp:* 2026-02-02 12:00:00
```

**Environment Variables**:
- `SLACK_WEBHOOK_DOCUMENT_REVIEW` - Slack webhook for document change requests

### 6. Implementation Steps in Order

#### Phase 1: Database Setup
1. Create migration file: `supabase/migrations/YYYYMMDD_create_document_change_requests.sql`
2. Run migration locally: `supabase db reset`
3. Verify table creation in Supabase dashboard

#### Phase 2: Backend Implementation
4. Create Edge Function directory: `supabase/functions/document-change-requests/`
5. Create `deno.json` import map
6. Create `index.ts` main entry point with action routing
7. Create `handlers/submitChangeRequest.ts` handler
8. Add Slack integration using `_shared/slack.ts`
9. Test Edge Function locally: `supabase functions serve document-change-requests`

#### Phase 3: Frontend Service Layer
10. Create `app/src/lib/documentReviewService.js`
11. Implement `submitChangeRequest()` function
12. Implement `fetchDraftDocuments()` function (if needed)
13. Add error handling and validation

#### Phase 4: Frontend Logic Layer
14. Create `app/src/logic/processors/documents/processDocumentChangeRequest.js`
15. Implement data processing for change request
16. Format Slack message data

#### Phase 5: Frontend Components
17. Create `app/src/islands/modals/DocumentReviewModal.jsx`
18. Implement modal structure (Header, Body, Footer)
19. Add document selection UI (dropdown or radio list)
20. Add freeform text input for change requests
21. Implement form validation
22. Add loading states
23. Add success/error handling with Toast notifications

#### Phase 6: Styling
24. Create `app/src/islands/modals/DocumentReviewModal.css`
25. Implement modal overlay styling
26. Implement modal container styling
27. Implement mobile bottom sheet behavior
28. Apply monochromatic purple color scheme
29. Add responsive breakpoints

#### Phase 7: Integration
30. Import modal into pages that need it (host/guest pages)
31. Add state management for modal visibility
32. Pass props to modal (documents list, user info)
33. Test integration in context

#### Phase 8: Testing
34. Test modal open/close functionality
35. Test document selection
36. Test form validation
37. Test change request submission
38. Verify Slack notification received
39. Verify database record created
40. Test error scenarios
41. Test mobile responsiveness
42. Test accessibility (keyboard navigation, ARIA attributes)

#### Phase 9: Deployment
43. Deploy Edge Function to Supabase: `supabase functions deploy document-change-requests`
44. Configure environment variables in Supabase dashboard
45. Run production build: `bun run build`
46. Deploy frontend to Cloudflare Pages
47. Test in production environment

### 7. Design Considerations

1. **Accessibility**:
   - ARIA attributes (`role="dialog"`, `aria-modal`, `aria-labelledby`)
   - Keyboard navigation (ESC to close, Tab to focus)
   - Focus management (trap focus within modal)

2. **Mobile Responsiveness**:
   - Bottom sheet behavior on small screens (< 480px)
   - Full-screen modal on very small screens
   - Touch-friendly button sizes

3. **Error Handling**:
   - Display user-friendly error messages
   - Retry mechanism for failed submissions
   - Log errors to Slack for debugging

4. **User Experience**:
   - Loading indicators during submission
   - Success feedback via Toast notifications
   - Clear form validation messages
   - Character count for text input

5. **Security**:
   - RLS policies on database table
   - Input sanitization
   - Rate limiting (consider for Edge Function)

### 8. Extension Points

1. **Document Status Tracking**: Add fields to track document review progress
2. **Admin Dashboard**: Create admin page to view/manage change requests
3. **Notification System**: Expand to email notifications for users
4. **Document Versioning**: Track document versions and changes
5. **Bulk Requests**: Allow multiple documents to be selected for change requests

---

### Critical Files for Implementation

- **`app/src/islands/modals/EditPhoneNumberModal.jsx`** - Primary modal pattern reference for structure, styling, and interaction patterns
- **`app/src/islands/modals/NotificationSettingsModal.jsx`** - Additional modal reference showing how to wrap shared island components
- **`supabase/functions/_shared/slack.ts`** - Slack integration utilities for sending notifications
- **`supabase/functions/slack/index.ts`** - Edge Function pattern for action-based routing and Slack integration
- **`app/src/lib/slackService.js`** - Frontend service pattern for API integration

---

**PLAN STATUS**: Ready for Execution
**ESTIMATED PHASES**: 9
**FILES TO CREATE**: 8
**FILES TO MODIFY**: 3 (implementation-specific)
