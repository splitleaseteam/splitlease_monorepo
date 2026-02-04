# Add "Request Date Change" Button to Guest LeaseCard

## Goal
Add a visible button in the Guest LeaseCard.jsx so users can initiate a date change request.

---

## File: `app/src/islands/pages/guest-leases/LeaseCard.jsx`

### BEFORE (Lines 250-263)
```jsx
          {/* Date Change Requests */}
          {dateChangeRequests.length > 0 && (
            <section className="lease-card__section">
              <h3 className="lease-card__section-title">Date Change Requests</h3>
              <DateChangeRequestsTable
                requests={dateChangeRequests}
                currentUserId={currentUserId}
                onApprove={onDateChangeApprove}
                onReject={onDateChangeReject}
                onRequestChanges={onRequestDateChange}
              />
            </section>
          )}
```

### AFTER (Show section always, add button)
```jsx
          {/* Date Change Requests */}
          <section className="lease-card__section">
            <div className="lease-card__section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 className="lease-card__section-title" style={{ margin: 0 }}>Date Change Requests</h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onRequestDateChange(lease)}
              >
                <Calendar size={16} style={{ marginRight: '4px' }} />
                Request Date Change
              </button>
            </div>
            {dateChangeRequests.length > 0 ? (
              <DateChangeRequestsTable
                requests={dateChangeRequests}
                currentUserId={currentUserId}
                onApprove={onDateChangeApprove}
                onReject={onDateChangeReject}
                onRequestChanges={onRequestDateChange}
              />
            ) : (
              <p className="text-muted" style={{ fontSize: '0.9rem', color: '#666' }}>
                No date change requests yet.
              </p>
            )}
          </section>
```

---

## What Changed

1. **Section is now always visible** (removed the `{dateChangeRequests.length > 0 &&` wrapper)
2. **Added header row** with title on left and button on right
3. **Button calls** `onRequestDateChange(lease)` to open the modal
4. **Shows "No date change requests yet"** when list is empty

---

## How to Apply

Replace lines 251-263 in `LeaseCard.jsx` with the AFTER code above.
