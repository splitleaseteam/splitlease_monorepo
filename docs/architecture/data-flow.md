# Data Flow Architecture

This document describes how data flows through the Split Lease application.

## Core Data Flow Pattern

```mermaid
flowchart TB
    subgraph "User Interface"
        UI[React Component]
        State[Component State]
    end

    subgraph "Business Logic"
        Hook[usePageLogic Hook]
        Calc[Calculators]
        Rules[Rules]
        Proc[Processors]
    end

    subgraph "API Layer"
        Lib[lib/supabase.js]
        EF[Edge Function]
    end

    subgraph "Data Storage"
        DB[(Supabase PostgreSQL)]
        LS[localStorage]
        Bubble[(Bubble.io)]
    end

    UI -->|user action| Hook
    Hook -->|setState| State
    State -->|render| UI

    Hook -->|calculate| Calc
    Hook -->|validate| Rules
    Hook -->|transform| Proc

    Hook -->|API call| Lib
    Lib -->|invoke| EF
    EF -->|query/mutate| DB
    EF -->|sync| Bubble

    Hook -->|cache| LS
    LS -->|read| Hook
```

## Listing Search Flow

```mermaid
sequenceDiagram
    participant User
    participant SearchPage
    participant useSearchPageLogic
    participant supabase.js
    participant DB as Supabase DB
    participant URL as Browser URL

    User->>SearchPage: Visit /search
    SearchPage->>useSearchPageLogic: Initialize
    useSearchPageLogic->>URL: Parse URL params
    URL-->>useSearchPageLogic: {borough, priceTier, weekPattern}

    useSearchPageLogic->>supabase.js: fetchListings(filters)
    supabase.js->>DB: SELECT from listing WHERE...
    DB-->>supabase.js: Listing rows
    supabase.js-->>useSearchPageLogic: Listing array

    useSearchPageLogic->>useSearchPageLogic: Apply client-side filters
    useSearchPageLogic->>useSearchPageLogic: Sort results
    useSearchPageLogic-->>SearchPage: {listings, loading, filters}
    SearchPage-->>User: Render listing cards

    User->>SearchPage: Change filter
    SearchPage->>useSearchPageLogic: handleFilterChange
    useSearchPageLogic->>URL: updateUrlParams(newFilters)
    useSearchPageLogic->>useSearchPageLogic: Re-filter listings
    useSearchPageLogic-->>SearchPage: Updated listings
```

## Proposal Creation Flow

```mermaid
sequenceDiagram
    participant Guest
    participant ViewSplit as ViewSplitLeasePage
    participant Modal as CreateProposalFlow
    participant Logic as useCreateProposalLogic
    participant EF as proposal Edge Function
    participant DB as Supabase DB
    participant Sync as sync_queue

    Guest->>ViewSplit: Click "Book Now"
    ViewSplit->>Modal: Open modal
    Modal->>Logic: Initialize with listing

    Guest->>Modal: Select days
    Modal->>Logic: handleDayToggle(dayIndex)
    Logic->>Logic: calculatePricing()
    Logic-->>Modal: Update pricing display

    Guest->>Modal: Select move-in date
    Modal->>Logic: handleMoveInChange(date)
    Logic->>Logic: Validate date
    Logic-->>Modal: Update calendar

    Guest->>Modal: Submit proposal
    Modal->>Logic: handleSubmit()
    Logic->>EF: invoke('proposal', {action: 'create', payload})
    EF->>EF: Validate JWT
    EF->>DB: INSERT INTO proposal
    DB-->>EF: New proposal row
    EF->>Sync: INSERT INTO sync_queue
    EF-->>Logic: {success: true, proposalId}

    Logic-->>Modal: Close & redirect
    Modal-->>Guest: Navigate to /guest-proposals
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Header
    participant LoginModal
    participant auth.js
    participant EF as auth-user Edge Function
    participant SB as Supabase Auth
    participant DB as Supabase DB
    participant SS as secureStorage

    User->>Header: Click "Login"
    Header->>LoginModal: Open modal

    User->>LoginModal: Enter credentials
    LoginModal->>auth.js: loginUser(email, password)

    auth.js->>EF: POST {action: 'login', payload}
    EF->>DB: SELECT FROM user WHERE email
    DB-->>EF: User record
    EF->>EF: Verify password hash
    EF->>SB: signIn (creates session)
    SB-->>EF: {access_token, refresh_token}
    EF-->>auth.js: {success, tokens, user_id}

    auth.js->>SS: setAuthToken(encrypted)
    auth.js->>SS: setSessionId(encrypted)
    auth.js->>SS: setAuthState(true, userId)
    auth.js-->>LoginModal: Success

    LoginModal->>Header: Close & refresh
    Header->>auth.js: checkAuthStatus()
    auth.js->>SS: getAuthState()
    SS-->>auth.js: {isLoggedIn: true}
    auth.js-->>Header: User is authenticated
    Header-->>User: Show LoggedInAvatar
```

## Database Sync Flow (Supabase to Bubble)

```mermaid
sequenceDiagram
    participant EF as Edge Function
    participant DB as Supabase DB
    participant Queue as sync_queue
    participant Cron as bubble_sync
    participant Bubble as Bubble.io

    EF->>DB: INSERT/UPDATE record
    DB-->>EF: Success

    EF->>Queue: INSERT INTO sync_queue
    Note over Queue: {table, record_id, operation, payload}

    loop Every 5 minutes
        Cron->>Queue: SELECT pending items
        Queue-->>Cron: Items to sync

        loop For each item
            Cron->>Bubble: POST /api/create or PATCH /api/update
            Bubble-->>Cron: Success/Error
            Cron->>Queue: UPDATE status
        end
    end
```

## Real-time Messaging Flow

```mermaid
sequenceDiagram
    participant Sender
    participant Messages as MessagesPage
    participant Realtime as Supabase Realtime
    participant DB as Supabase DB
    participant EF as messages Edge Function
    participant Receiver

    Sender->>Messages: Type message
    Sender->>Messages: Click Send
    Messages->>EF: invoke('messages', {action: 'send'})
    EF->>DB: INSERT INTO message
    DB-->>EF: New message row
    EF-->>Messages: Success

    DB->>Realtime: Broadcast INSERT
    Realtime->>Receiver: New message notification
    Receiver->>Messages: Display new message
```

## State Management Pattern

```mermaid
flowchart LR
    subgraph "Sources of Truth"
        URL[URL Parameters]
        LS[localStorage]
        DB[(Database)]
    end

    subgraph "Component State"
        CS[useState]
        Ref[useRef]
    end

    subgraph "Derived State"
        Calc[Calculated Values]
        Filter[Filtered Results]
    end

    URL -->|parseUrlToFilters| CS
    LS -->|getAuthState| CS
    DB -->|useEffect fetch| CS

    CS -->|compute| Calc
    CS -->|apply filters| Filter

    Filter -->|render| UI[Component UI]
    Calc -->|render| UI
```

## Error Handling Flow

```mermaid
flowchart TB
    subgraph "Frontend"
        Hook[usePageLogic]
        Toast[Toast Notification]
        Error[Error State]
    end

    subgraph "API Layer"
        EF[Edge Function]
        Catch[try/catch]
    end

    subgraph "Logging"
        Console[Console.log]
        Slack[Slack Webhook]
    end

    Hook -->|API call| EF
    EF -->|error| Catch
    Catch -->|log| Console
    Catch -->|notify| Slack
    Catch -->|return| Error

    Error -->|display| Toast
    Error -->|setState| Hook
```

## Key Data Entities

| Entity | Primary Table | Sync to Bubble | Description |
|--------|---------------|----------------|-------------|
| User | `user` | Yes | User accounts (guests and hosts) |
| Listing | `listing` | Yes | Property listings |
| Proposal | `proposal` | Yes | Booking proposals |
| Lease | `lease` | Yes | Active leases |
| Message | `message` | No | In-app messaging |
| Virtual Meeting | `virtual_meeting` | Yes | Scheduled meetings |
| Rental Application | `rental_application` | No | Guest applications |
