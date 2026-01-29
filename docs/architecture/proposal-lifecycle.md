# Proposal Lifecycle Architecture

This document describes the complete lifecycle of a proposal in Split Lease.

## Proposal Status Overview

Split Lease proposals go through multiple stages from creation to lease activation.

```mermaid
stateDiagram-v2
    [*] --> ProposalSubmitted: Guest creates proposal

    ProposalSubmitted --> RentalAppSubmitted: Submit rental app
    ProposalSubmitted --> CancelledByGuest: Guest cancels

    state "Split Lease Suggested" as SLSuggested {
        PendingConfirmation --> AwaitingRentalApp: Guest confirms
        PendingConfirmation --> CancelledByGuest: Guest declines
    }

    RentalAppSubmitted --> HostReview: App processed
    AwaitingRentalApp --> HostReview: Submit rental app

    HostReview --> Counteroffer: Host counters
    HostReview --> Accepted: Host accepts
    HostReview --> RejectedByHost: Host rejects
    HostReview --> CancelledByGuest: Guest cancels

    Counteroffer --> Accepted: Guest accepts counter
    Counteroffer --> CancelledByGuest: Guest declines

    Accepted --> ReviewingDocs: Drafting documents
    ReviewingDocs --> LeaseDocsSent: Docs ready

    LeaseDocsSent --> LeaseDocsSigned: Both parties sign
    LeaseDocsSigned --> AwaitingPayment: Sign complete

    AwaitingPayment --> LeaseActivated: Payment received

    LeaseActivated --> [*]: Lease complete

    CancelledByGuest --> [*]: Terminal
    RejectedByHost --> [*]: Terminal
    Expired --> [*]: Terminal
```

## Status Configuration

Each status has specific properties and available actions:

| Status | Stage | Usual Order | Available Actions |
|--------|-------|-------------|-------------------|
| Proposal Submitted - Awaiting Rental App | 1 | 0 | submit_rental_app, cancel, request_vm, message |
| SL Suggested - Pending Confirmation | 1 | 0 | confirm, submit_rental_app, cancel |
| SL Suggested - Awaiting Rental App | 1 | 0 | submit_rental_app, cancel |
| Rental Application Submitted | 2 | 1 | request_vm, cancel, message |
| Host Review | 3 | 1 | request_vm, cancel, message |
| Counteroffer Submitted | 3 | 2 | accept, decline, request_vm, message |
| Accepted - Drafting Lease | 4 | 3 | request_vm, message |
| Reviewing Documents | 4 | 3 | review_documents, request_vm |
| Lease Documents Sent for Review | 4 | 4 | review_documents, request_vm |
| Lease Documents Sent for Signatures | 5 | 5 | sign_documents, request_vm |
| Awaiting Initial Payment | 6 | 6 | submit_payment, request_vm |
| Lease Activated | 6 | 7 | view_lease, view_house_manual |
| Cancelled by Guest | - | 99 | view_listing, explore_rentals |
| Rejected by Host | - | 99 | view_listing, explore_rentals |
| Expired | - | 99 | view_listing, explore_rentals |

## Proposal Creation Flow

```mermaid
sequenceDiagram
    participant Guest
    participant ViewSplit as ViewSplitLeasePage
    participant Modal as CreateProposalFlowV2
    participant Logic as Proposal Logic
    participant EF as proposal Edge Function
    participant DB as Supabase DB

    Guest->>ViewSplit: Click "Book Now"
    ViewSplit->>Modal: Open modal

    Guest->>Modal: Step 1 - Select Schedule
    Modal->>Logic: calculateNightsFromDays()
    Modal->>Logic: calculateFourWeekRent()
    Logic-->>Modal: Price breakdown

    Guest->>Modal: Step 2 - Choose Move-in Date
    Modal->>Logic: validateMoveInDateWorkflow()
    Logic-->>Modal: Valid/Invalid

    Guest->>Modal: Step 3 - Review & Submit
    Modal->>Logic: Validate all inputs
    Logic-->>Modal: Ready to submit

    Guest->>Modal: Confirm Submission
    Modal->>EF: create proposal
    EF->>DB: INSERT INTO proposal
    EF->>DB: INSERT INTO sync_queue
    DB-->>EF: {proposalId}
    EF-->>Modal: Success

    Modal->>Guest: Navigate to /guest-proposals
```

## Counteroffer Flow

```mermaid
sequenceDiagram
    participant Host
    participant HostPage as HostProposalsPage
    participant EF as proposal Edge Function
    participant DB as Supabase DB
    participant Guest
    participant GuestPage as GuestProposalsPage

    Host->>HostPage: View proposal
    Host->>HostPage: Click "Counter"
    HostPage->>HostPage: Open counteroffer modal

    Host->>HostPage: Modify terms
    Note over Host,HostPage: Can change: price, schedule, dates

    Host->>HostPage: Submit counter
    HostPage->>EF: {action: 'counteroffer'}
    EF->>DB: UPDATE proposal SET status, counter_*
    EF->>DB: INSERT INTO sync_queue
    DB-->>EF: Success
    EF-->>HostPage: Confirmed

    Note over Guest: Guest notified

    Guest->>GuestPage: View counteroffer
    GuestPage->>GuestPage: Show original vs counter

    alt Guest accepts
        Guest->>GuestPage: Click "Accept"
        GuestPage->>EF: {action: 'accept_counteroffer'}
        EF->>DB: UPDATE proposal SET status = 'Accepted'
        EF-->>GuestPage: Success
    else Guest declines
        Guest->>GuestPage: Click "Decline"
        GuestPage->>EF: {action: 'cancel'}
        EF->>DB: UPDATE proposal SET status = 'Cancelled'
        EF-->>GuestPage: Cancelled
    end
```

## Rental Application Flow

```mermaid
flowchart TB
    subgraph "Guest Actions"
        Submit[Submit Proposal]
        Fill[Fill Rental App]
        SendApp[Submit Application]
    end

    subgraph "Application Data"
        Profile[Profile Info]
        Employment[Employment History]
        References[References]
        Documents[ID Documents]
    end

    subgraph "Processing"
        Validate[Validate Form]
        Link[Link to Proposal]
        Forward[Forward to Host]
    end

    subgraph "Status Updates"
        S1[Awaiting Rental App]
        S2[Rental App Submitted]
        S3[Host Review]
    end

    Submit --> S1
    S1 --> Fill

    Fill --> Profile
    Fill --> Employment
    Fill --> References
    Fill --> Documents

    SendApp --> Validate
    Validate --> Link
    Link --> S2
    S2 --> Forward
    Forward --> S3
```

## Virtual Meeting Integration

```mermaid
sequenceDiagram
    participant Guest
    participant Host
    participant GuestPage as GuestProposalsPage
    participant HostPage as HostProposalsPage
    participant VM as virtual-meeting EF
    participant DB as Supabase DB
    participant Cal as Calendar Service

    Guest->>GuestPage: Click "Request Meeting"
    GuestPage->>VM: {action: 'request'}
    VM->>DB: INSERT INTO virtual_meeting
    VM-->>GuestPage: Meeting requested

    Host->>HostPage: See meeting request
    Host->>HostPage: Propose times
    HostPage->>VM: {action: 'propose_times'}
    VM->>DB: UPDATE virtual_meeting
    VM-->>HostPage: Times sent

    Guest->>GuestPage: Select time
    GuestPage->>VM: {action: 'confirm_time'}
    VM->>DB: UPDATE virtual_meeting SET confirmed
    VM->>Cal: Create calendar event
    Cal-->>VM: Event created
    VM-->>GuestPage: Meeting scheduled

    Note over Guest,Host: Both receive confirmation
```

## Document Signing Flow

```mermaid
sequenceDiagram
    participant SL as Split Lease Admin
    participant Host
    participant Guest
    participant EF as document Edge Function
    participant DB as Supabase DB
    participant DocuSign as Document Service

    SL->>EF: Generate lease documents
    EF->>EF: Populate template
    EF->>DB: Store document references
    EF->>DB: UPDATE proposal status

    Note over Host,Guest: Documents sent for review

    Host->>EF: Review documents
    Guest->>EF: Review documents

    SL->>EF: Send for signatures
    EF->>DocuSign: Create signing session
    DocuSign-->>Host: Sign request
    DocuSign-->>Guest: Sign request

    Host->>DocuSign: Sign
    Guest->>DocuSign: Sign

    DocuSign->>EF: Webhook: All signed
    EF->>DB: UPDATE proposal status = 'Awaiting Payment'
    EF->>DB: INSERT INTO sync_queue
```

## Payment Flow

```mermaid
sequenceDiagram
    participant Guest
    participant GuestPage as GuestProposalsPage
    participant EF as payment Edge Function
    participant Stripe
    participant DB as Supabase DB
    participant Host

    GuestPage->>Guest: Show payment CTA
    Guest->>GuestPage: Click "Submit Payment"

    GuestPage->>EF: Create payment intent
    EF->>Stripe: Create PaymentIntent
    Stripe-->>EF: {client_secret}
    EF-->>GuestPage: Payment form ready

    Guest->>GuestPage: Enter card details
    GuestPage->>Stripe: Confirm payment
    Stripe-->>GuestPage: Payment successful

    GuestPage->>EF: Record payment
    EF->>DB: INSERT INTO guest_payment_record
    EF->>DB: UPDATE proposal SET status = 'Lease Activated'
    EF->>DB: INSERT INTO lease

    Note over Host: Host notified of activation

    EF->>DB: Calculate host compensation
    EF->>DB: Schedule host payout
```

## Terminal Status Rules

```mermaid
flowchart TB
    subgraph "Active Statuses"
        Active[Any Active Status]
    end

    subgraph "Terminal Conditions"
        Cancel[Guest Cancels]
        Reject[Host Rejects]
        Expire[Proposal Expires]
        SLCancel[SL Admin Cancels]
    end

    subgraph "Terminal Statuses"
        CG[Cancelled by Guest]
        RH[Rejected by Host]
        EX[Expired]
        CSL[Cancelled by Split Lease]
    end

    subgraph "No Actions Allowed"
        NoEdit[Cannot Edit]
        NoCancel[Cannot Cancel Again]
        NoAccept[Cannot Accept]
    end

    Active --> Cancel --> CG
    Active --> Reject --> RH
    Active --> Expire --> EX
    Active --> SLCancel --> CSL

    CG --> NoEdit
    RH --> NoEdit
    EX --> NoEdit
    CSL --> NoEdit
```

## Proposal Rules Functions

Key business rule functions in `logic/rules/proposals/`:

| Function | Purpose |
|----------|---------|
| `canCancelProposal()` | Check if guest can cancel |
| `canAcceptProposal()` | Check if counteroffer can be accepted |
| `canModifyProposal()` | Check if proposal can be edited |
| `canSubmitRentalApplication()` | Check if rental app is needed |
| `canRequestVirtualMeeting()` | Check if VM can be requested |
| `isProposalActive()` | Check if proposal is in active flow |
| `isLeaseActivated()` | Check if lease is complete |
| `needsRentalApplicationSubmission()` | Check if rental app missing |
| `canConfirmSuggestedProposal()` | Check if SL suggestion can be confirmed |

## Status Transition Matrix

```
From Status                              | Valid Next Statuses
-----------------------------------------|--------------------
Proposal Submitted - Awaiting Rental App | Rental App Submitted, Cancelled
SL Suggested - Pending Confirmation      | SL Suggested - Awaiting App, Cancelled
SL Suggested - Awaiting Rental App       | Host Review, Cancelled
Rental App Submitted                     | Host Review, Cancelled
Host Review                              | Counteroffer, Accepted, Rejected, Cancelled
Counteroffer Submitted                   | Accepted, Cancelled
Accepted - Drafting                      | Reviewing Documents, Cancelled
Reviewing Documents                      | Lease Docs Sent, Cancelled
Lease Docs Sent for Review               | Lease Docs for Signatures, Cancelled
Lease Docs Sent for Signatures           | Awaiting Payment, Cancelled
Awaiting Initial Payment                 | Lease Activated, Cancelled
Lease Activated                          | (Terminal - no transitions)
Cancelled/Rejected/Expired               | (Terminal - no transitions)
```

## Key Files

| File | Purpose |
|------|---------|
| `logic/constants/proposalStatuses.js` | Status configuration |
| `logic/rules/proposals/proposalRules.js` | Proposal business rules |
| `logic/rules/proposals/canAcceptProposal.js` | Accept rule |
| `logic/rules/proposals/canCancelProposal.js` | Cancel rule |
| `supabase/functions/proposal/` | Proposal Edge Function |
