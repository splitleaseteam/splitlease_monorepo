# Payment Flow Architecture

This document describes the payment system in Split Lease.

## Payment Overview

Split Lease handles two types of payments:
1. **Guest Payments** - Rent payments from guests to Split Lease
2. **Host Compensation** - Payouts from Split Lease to hosts

```mermaid
flowchart LR
    subgraph "Guest"
        GP[Guest Payment]
    end

    subgraph "Split Lease"
        SL[Split Lease Platform]
        Fee[Platform Fee]
    end

    subgraph "Host"
        HC[Host Compensation]
    end

    GP -->|Rent Payment| SL
    SL -->|17% Fee| Fee
    SL -->|83% - Fees| HC
```

## Payment Timeline

```mermaid
gantt
    title Payment Schedule
    dateFormat  YYYY-MM-DD
    section Initial
    Lease Activated           :milestone, m1, 2024-01-01, 0d
    Initial Payment Due       :crit, ip, 2024-01-01, 1d
    Host First Payout         :hp1, 2024-01-03, 1d
    section Recurring
    4-Week Payment Due        :p1, 2024-01-29, 1d
    Host Payout               :hp2, 2024-01-31, 1d
    4-Week Payment Due        :p2, 2024-02-26, 1d
    Host Payout               :hp3, 2024-02-28, 1d
```

## Guest Payment Flow

```mermaid
sequenceDiagram
    participant Guest
    participant Page as GuestProposalsPage
    participant EF as guest-payment-records
    participant Stripe
    participant DB as Supabase DB
    participant Slack

    Guest->>Page: View proposal (Awaiting Payment)
    Page->>Page: Show payment CTA

    Guest->>Page: Click "Submit Payment"
    Page->>EF: {action: 'create_payment_intent'}
    EF->>Stripe: Create PaymentIntent
    Note over Stripe: Amount: 4-week rent + fees
    Stripe-->>EF: {client_secret, payment_intent_id}
    EF-->>Page: Payment form data

    Page->>Page: Render Stripe Elements
    Guest->>Page: Enter card details
    Page->>Stripe: confirmPayment()

    alt Payment Succeeds
        Stripe-->>Page: {paymentIntent: 'succeeded'}
        Page->>EF: {action: 'record_payment'}
        EF->>DB: INSERT INTO guest_payment_record
        EF->>DB: UPDATE proposal SET status
        EF->>Slack: Notify payment received
        EF-->>Page: Success
        Page-->>Guest: Payment confirmed
    else Payment Fails
        Stripe-->>Page: {error}
        Page-->>Guest: Show error message
    end
```

## Payment Breakdown Calculation

```mermaid
flowchart TB
    subgraph "Input"
        Rate[Nightly Rate]
        Nights[Nights per Week]
        Weeks[Reservation Weeks]
    end

    subgraph "Calculations"
        FWR[4-Week Rent]
        Total[Total Rent]
        Markup[17% Site Markup]
        Discount[13% Full-time Discount]
    end

    subgraph "Output"
        GuestPays[Guest Total]
        HostGets[Host Compensation]
        SLFee[Platform Fee]
    end

    Rate --> FWR
    Nights --> FWR
    FWR -->|"rate * nights * 4"| Total
    Weeks --> Total

    Total --> Markup
    Nights -->|"if 7 nights"| Discount

    Total --> GuestPays
    Markup --> GuestPays
    Discount --> GuestPays

    GuestPays --> SLFee
    SLFee -->|"17%"| HostGets
```

### Pricing Formula

```javascript
// 4-Week Rent = nightly rate * nights per week * 4
const fourWeekRent = nightlyRate * nightsPerWeek * 4;

// Full-time discount (7 nights only)
const discount = nightsPerWeek === 7 ? fourWeekRent * 0.13 : 0;

// Site markup
const markup = (fourWeekRent - discount) * 0.17;

// Guest total = base + markup - discount
const guestTotal = fourWeekRent + markup - discount;

// Host compensation = base - discount (no markup)
const hostCompensation = fourWeekRent - discount;
```

## Host Compensation Flow

```mermaid
sequenceDiagram
    participant System as Payment System
    participant EF as host-payment-records
    participant DB as Supabase DB
    participant Stripe
    participant Host
    participant Bank as Host's Bank

    Note over System: Payment received from guest

    System->>EF: Process host payout
    EF->>DB: SELECT host.stripe_account_id
    DB-->>EF: Host Stripe account

    EF->>EF: Calculate compensation
    Note over EF: Base rent - platform fee

    EF->>Stripe: Create Transfer
    Note over Stripe: Transfer to connected account
    Stripe-->>EF: {transfer_id}

    EF->>DB: INSERT INTO host_payment_record
    EF-->>Host: Payment notification

    Stripe->>Bank: Payout (2-3 days)
    Bank-->>Host: Funds received
```

## Recurring Payment Schedule

```mermaid
flowchart TB
    subgraph "Lease Start"
        Activate[Lease Activated]
        Initial[Initial Payment]
    end

    subgraph "4-Week Cycle"
        Due[Payment Due Date]
        Remind[Send Reminder]
        Collect[Collect Payment]
        Payout[Host Payout]
    end

    subgraph "End of Lease"
        Final[Final Payment]
        Security[Return Security Deposit]
        Close[Close Lease]
    end

    Activate --> Initial
    Initial --> Due

    Due --> Remind
    Remind -->|3 days before| Due
    Due --> Collect
    Collect --> Payout
    Payout --> Due

    Due -->|Last cycle| Final
    Final --> Security
    Security --> Close
```

## Payment Reminder System

```mermaid
sequenceDiagram
    participant Cron as reminder-scheduler
    participant DB as Supabase DB
    participant SMS as send-sms
    participant Email as send-email
    participant Guest

    loop Daily Check
        Cron->>DB: SELECT upcoming payments
        DB-->>Cron: Payments due in 3 days

        loop For each payment
            Cron->>DB: Check reminder sent
            alt Not yet reminded
                Cron->>SMS: Send SMS reminder
                Cron->>Email: Send email reminder
                SMS-->>Guest: Payment reminder
                Email-->>Guest: Payment reminder
                Cron->>DB: Mark reminder sent
            end
        end
    end
```

## Payment States

```mermaid
stateDiagram-v2
    [*] --> Pending: Payment due

    Pending --> Processing: Guest initiates
    Processing --> Succeeded: Stripe confirms
    Processing --> Failed: Payment fails

    Failed --> Pending: Retry
    Failed --> Overdue: After grace period

    Overdue --> Pending: Guest pays
    Overdue --> Escalated: Admin intervention

    Succeeded --> [*]: Complete

    Escalated --> Resolved: Issue resolved
    Escalated --> LeaseTerminated: Non-payment
```

## Fee Structure

| Component | Rate | Description |
|-----------|------|-------------|
| Base Rent | - | Nightly rate x nights x weeks |
| Site Markup | 17% | Added to guest total |
| Full-time Discount | 13% | Applied for 7-night stays |
| Cleaning Fee | Variable | One-time, set by host |
| Damage Deposit | Variable | Refundable, set by host |

## Payment Edge Functions

| Function | Purpose |
|----------|---------|
| `guest-payment-records` | Process guest payments |
| `host-payment-records` | Process host payouts |
| `pricing` | Calculate pricing breakdowns |
| `pricing-admin` | Admin pricing tools |

## Security Considerations

1. **PCI Compliance**: Card details never touch our servers (Stripe Elements)
2. **Webhook Verification**: Stripe webhooks verified with signing secret
3. **Idempotency**: Payment operations are idempotent
4. **Audit Trail**: All payments logged with timestamps
5. **Escrow**: Platform holds funds before host payout

## Error Handling

```mermaid
flowchart TB
    subgraph "Payment Errors"
        CardDeclined[Card Declined]
        InsufficientFunds[Insufficient Funds]
        NetworkError[Network Error]
        FraudDetected[Fraud Detected]
    end

    subgraph "Recovery Actions"
        Retry[Prompt Retry]
        UpdateCard[Update Card]
        Contact[Contact Support]
        Review[Manual Review]
    end

    CardDeclined --> UpdateCard
    InsufficientFunds --> Retry
    NetworkError --> Retry
    FraudDetected --> Review

    UpdateCard --> Retry
    Review --> Contact
```

## Key Files

| File | Purpose |
|------|---------|
| `logic/calculators/pricing/` | Pricing calculations |
| `supabase/functions/guest-payment-records/` | Guest payments |
| `supabase/functions/host-payment-records/` | Host payouts |
| `supabase/functions/pricing/` | Pricing API |
