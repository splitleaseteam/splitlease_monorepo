# Sync Architecture

This document describes the bidirectional data synchronization between Supabase and Bubble.io.

## Sync Overview

Split Lease is migrating from Bubble.io to Supabase. During the transition, data must stay synchronized between both systems.

```mermaid
flowchart TB
    subgraph "Supabase (Source of Truth)"
        SB[(Supabase DB)]
        EF[Edge Functions]
        Queue[(sync_queue)]
    end

    subgraph "Sync Layer"
        Cron[bubble_sync Cron]
        Webhook[Bubble Webhooks]
    end

    subgraph "Bubble.io (Legacy)"
        BB[(Bubble DB)]
        BW[Bubble Workflows]
    end

    EF -->|write| SB
    SB -->|trigger| Queue
    Queue -->|read| Cron
    Cron -->|API| BB

    BB -->|webhook| Webhook
    Webhook -->|upsert| SB
```

## Sync Queue Pattern

```mermaid
sequenceDiagram
    participant App as Application
    participant EF as Edge Function
    participant DB as Supabase DB
    participant Queue as sync_queue
    participant Cron as bubble_sync
    participant Bubble as Bubble.io

    App->>EF: Create/Update record
    EF->>DB: INSERT/UPDATE table
    DB-->>EF: Success

    EF->>Queue: INSERT sync item
    Note over Queue: {table, id, operation, payload}
    EF-->>App: Success

    Note over Cron: Every 5 minutes

    Cron->>Queue: SELECT pending items
    Queue-->>Cron: Items to sync

    loop For each item
        Cron->>Bubble: POST/PATCH API
        alt Success
            Bubble-->>Cron: 200 OK
            Cron->>Queue: UPDATE status = 'completed'
        else Failure
            Bubble-->>Cron: Error
            Cron->>Queue: UPDATE status = 'failed', retry_count++
        end
    end
```

## Sync Queue Schema

```sql
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL,  -- 'create', 'update', 'delete'
    payload JSONB,
    status TEXT DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    CONSTRAINT valid_operation CHECK (operation IN ('create', 'update', 'delete')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);
```

## Tables Synchronized

| Supabase Table | Bubble Thing | Sync Direction |
|----------------|--------------|----------------|
| `user` | User | Bidirectional |
| `listing` | Listing | Bidirectional |
| `proposal` | Proposal | Bidirectional |
| `lease` | Lease | Bidirectional |
| `virtual_meeting` | Virtual Meeting | Bidirectional |
| `account_host` | Account Host | Supabase to Bubble |
| `account_guest` | Account Guest | Supabase to Bubble |

## Supabase to Bubble Sync

```mermaid
flowchart TB
    subgraph "Edge Function"
        Action[Handle Action]
        Write[Write to Supabase]
        Enqueue[Enqueue Sync]
    end

    subgraph "sync_queue"
        Pending[Pending Items]
    end

    subgraph "bubble_sync Function"
        Poll[Poll Queue]
        Process[Process Item]
        API[Call Bubble API]
        Update[Update Status]
    end

    subgraph "Bubble.io"
        Create[Create Thing]
        Modify[Modify Thing]
    end

    Action --> Write
    Write --> Enqueue
    Enqueue --> Pending

    Poll --> Pending
    Pending --> Process
    Process --> API

    API -->|create| Create
    API -->|update| Modify

    Create --> Update
    Modify --> Update
    Update --> Poll
```

## Bubble to Supabase Sync

```mermaid
sequenceDiagram
    participant Bubble as Bubble.io
    participant Webhook as Webhook Handler
    participant EF as Edge Function
    participant DB as Supabase DB

    Note over Bubble: Data changes in Bubble

    Bubble->>Webhook: POST webhook
    Note over Webhook: {type, data, trigger}

    Webhook->>EF: Route to handler
    EF->>EF: Validate payload
    EF->>EF: Transform data

    EF->>DB: UPSERT record
    Note over DB: ON CONFLICT DO UPDATE

    DB-->>EF: Success
    EF-->>Webhook: 200 OK
    Webhook-->>Bubble: Acknowledged
```

## Day Index Conversion

All day indices must be converted at sync boundaries:

```mermaid
flowchart LR
    subgraph "Supabase (0-indexed)"
        JS[0=Sun, 1=Mon, ... 6=Sat]
    end

    subgraph "Conversion Layer"
        ToB[adaptDaysToBubble]
        FromB[adaptDaysFromBubble]
    end

    subgraph "Bubble (1-indexed)"
        BB[1=Sun, 2=Mon, ... 7=Sat]
    end

    JS -->|"+1"| ToB
    ToB --> BB

    BB -->|"-1"| FromB
    FromB --> JS
```

```javascript
// Supabase to Bubble
export function adaptDaysToBubble({ jsDays }) {
  return jsDays.map(day => day + 1);
}

// Bubble to Supabase
export function adaptDaysFromBubble({ bubbleDays }) {
  return bubbleDays.map(day => day - 1);
}
```

## Conflict Resolution

```mermaid
flowchart TB
    subgraph "Conflict Detection"
        Check[Check timestamps]
        Compare[Compare values]
    end

    subgraph "Resolution Strategy"
        SBWins[Supabase Wins]
        Merge[Field-level Merge]
        Manual[Manual Review]
    end

    subgraph "Outcome"
        Apply[Apply Resolution]
        Log[Log Conflict]
    end

    Check --> Compare

    Compare -->|Same values| Skip[No action needed]
    Compare -->|SB newer| SBWins
    Compare -->|BB newer| Merge
    Compare -->|Can't determine| Manual

    SBWins --> Apply
    Merge --> Apply
    Manual --> Log
```

## Retry Logic

```mermaid
stateDiagram-v2
    [*] --> Pending: Enqueued

    Pending --> Processing: Cron picks up
    Processing --> Completed: Success
    Processing --> Failed: Error

    Failed --> Pending: retry_count < max_retries
    Failed --> Abandoned: retry_count >= max_retries

    Completed --> [*]
    Abandoned --> [*]: Alert admin
```

## Sync Monitoring

```mermaid
flowchart TB
    subgraph "Metrics"
        QueueSize[Queue Size]
        FailRate[Failure Rate]
        Latency[Sync Latency]
    end

    subgraph "Alerts"
        HighQueue[Queue > 100]
        HighFail[Fail > 10%]
        HighLatency[Latency > 5min]
    end

    subgraph "Actions"
        Slack[Slack Alert]
        Email[Email Admin]
        Auto[Auto-retry]
    end

    QueueSize --> HighQueue
    FailRate --> HighFail
    Latency --> HighLatency

    HighQueue --> Slack
    HighFail --> Email
    HighLatency --> Auto
```

## Key Sync Functions

| Function | File | Purpose |
|----------|------|---------|
| `enqueueSyncItem` | `_shared/sync.ts` | Add item to sync queue |
| `bubble_sync` | `bubble_sync/index.ts` | Process sync queue |
| `adaptDaysToBubble` | `processors/external/` | Day conversion |
| `adaptDaysFromBubble` | `processors/external/` | Day conversion |

## Edge Function Sync Pattern

```typescript
// Example: Creating a listing
async function handleCreateListing(payload, supabaseAdmin) {
  // 1. Generate ID
  const { data: newId } = await supabaseAdmin.rpc('generate_bubble_id');

  // 2. Insert into Supabase
  const { data, error } = await supabaseAdmin
    .from('listing')
    .insert({ _id: newId, ...payload })
    .select()
    .single();

  if (error) throw error;

  // 3. Enqueue sync to Bubble
  await enqueueSyncItem(supabaseAdmin, {
    table_name: 'listing',
    record_id: newId,
    operation: 'create',
    payload: adaptToBubbleFormat(data)
  });

  return data;
}
```

## Migration Status

| Entity | Supabase | Bubble | Sync Status |
|--------|----------|--------|-------------|
| Users | Primary | Secondary | Bidirectional |
| Listings | Primary | Secondary | Bidirectional |
| Proposals | Primary | Secondary | Bidirectional |
| Messages | Primary | None | Supabase only |
| Rental Apps | Primary | None | Supabase only |

## Future State (Post-Migration)

```mermaid
flowchart LR
    subgraph "Target Architecture"
        App[Application]
        SB[(Supabase)]
    end

    App -->|All operations| SB

    subgraph "Deprecated"
        Bubble[Bubble.io]
        Sync[Sync Layer]
    end

    style Bubble fill:#f9f,stroke:#333,stroke-dasharray: 5 5
    style Sync fill:#f9f,stroke:#333,stroke-dasharray: 5 5
```

Once migration is complete:
1. Disable sync queue processing
2. Remove Bubble webhook handlers
3. Archive Bubble data
4. Remove sync-related code
