# Contract Generation Test Analysis

## Document Purpose

Analysis of the PythonAnywhere contract generation test implementation to guide creation of a similar test page for the Supabase Edge Functions.

---

## 1. PythonAnywhere Test Structure

### 1.1 Test Implementation Type

The PythonAnywhere codebase uses **automated health checks** rather than a UI test page. Testing is implemented via:

1. **Test Configuration File**: `modules/core/monitoring/test_config.py`
2. **Health Checker Runner**: `modules/core/monitoring/run_tests.py`
3. **Health Checker Class**: `modules/core/monitoring/health_checker.py`

### 1.2 Test Architecture

```
pythonAnywhere/mysite/
├── modules/core/monitoring/
│   ├── test_config.py          # Test data payloads for all endpoints
│   ├── health_checker.py       # Makes HTTP requests, validates responses
│   ├── run_tests.py            # Script to execute all tests
│   └── routes.py               # /api/health endpoint
```

The test system:
- Runs tests **concurrently** (3 concurrent checks)
- Supports **retry logic** (3 retries with 3-second delays)
- Reports results to **Slack** (success/error webhooks)
- Groups tests by **service category**

---

## 2. Contract Types Tested

### 2.1 Host Payout Schedule

**Endpoint**: `POST /contract/host_payout`

**Sample Payload**:
```json
{
    "Address": "123 Main St",
    "Agreement Number": "AG123",
    "Date1": "2024-01-01",
    "Date2": "2024-02-01",
    "Date3": "2024-03-01",
    "Date4": "2024-04-01",
    "Date5": "2024-05-01",
    "Date6": "2024-06-01",
    "Date7": "2024-07-01",
    "Date8": "2024-08-01",
    "Date9": "2024-09-01",
    "Date10": "2024-10-01",
    "Date11": "2024-11-01",
    "Date12": "2024-12-01",
    "Date13": "2025-01-01",
    "Host Email": "host@example.com",
    "Host Name": "John Doe",
    "Host Phone": "555-1234",
    "Maintenance Fee": "$100",
    "Payout Number": "PN123",
    "Rent1": "$1000",
    "Rent2": "$1000",
    "Rent3": "$1000",
    "Rent4": "$1000",
    "Rent5": "$1000",
    "Rent6": "$1000",
    "Rent7": "$1000",
    "Rent8": "$1000",
    "Rent9": "$1000",
    "Rent10": "$1000",
    "Rent11": "$1000",
    "Rent12": "$1000",
    "Rent13": "$1000",
    "Total1": "$1100",
    "Total2": "$1100",
    "Total3": "$1100",
    "Total4": "$1100",
    "Total5": "$1100",
    "Total6": "$1100",
    "Total7": "$1100",
    "Total8": "$1100",
    "Total9": "$1100",
    "Total10": "$1100",
    "Total11": "$1100",
    "Total12": "$1100",
    "Total13": "$1100",
    "TotalHostPayments": "$14300"
}
```

---

### 2.2 Periodic Tenancy Agreement

**Endpoint**: `POST /contract/periodic_tenancy`

**Sample Payload**:
```json
{
    "Agreement Number": "AGR12345",
    "Check in Date": "09/10/24",
    "Check Out Date": "12/10/24",
    "Check In Day": "Monday",
    "Check Out Day": "Wednesday",
    "Number of weeks": 2,
    "Guests Allowed": 4,
    "Host name": "John Doe",
    "Guest name": "Jane Smith",
    "Supplemental Number": "SUP6789",
    "Authorization Card Number": "AUTH9876",
    "Host Payout Schedule Number": "PAY5432",
    "Extra Requests on Cancellation Policy": "Full refund if cancelled 7 days before check-in",
    "Damage Deposit": "$500",
    "Location": "Middle Earth",
    "Type of Space": "Shared Room",
    "House Rules": [
        "No smoking",
        "No pets",
        "No parties",
        "Quiet hours 10 PM - 7 AM",
        "No shoes inside"
    ],
    "Listing Title": "New age Listing",
    "Listing Description": "Enjoy a relaxing stay in our centrally located 2-bedroom apartment...",
    "Capacity": "2 Bed Rooms",
    "Amenity In Unit": [
        "Wi-Fi",
        "Air Conditioning",
        "Kitchen",
        "TV",
        "Washer",
        "Dryer"
    ],
    "Amenity Building": [
        "Elevator",
        "Gym",
        "Pool",
        "Parking"
    ],
    "Space Details": "Full"
}
```

---

### 2.3 Supplemental Agreement

**Endpoint**: `POST /contract/supplemental`

**Sample Payload**:
```json
{
    "Agreement Number": "AGR-2024-001",
    "Check in Date": "09/15/24",
    "Check Out Date": "09/29/24",
    "Number of weeks": 2,
    "Guests Allowed": 4,
    "Host Name": "Jane Smith",
    "Supplemental Number": "SUP-2024-001",
    "Location": "New York City",
    "Type of Space": "Shared Room",
    "Listing Title": "New age Listing",
    "Listing Description": "Enjoy a relaxing stay in our centrally located 2-bedroom apartment...",
    "Space Details": "2 Bed Rooms",
    "image1": "https://www.travelandleisure.com/thmb/_XsBCRprdQriog2hTCkuiT3f7lc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/TAL-airbnb-listing-NEWAIRBNB1123-a67a0e07c4e846e2ae4e653d201e47af.jpg",
    "image2": "https://hospitable.com/wp-content/uploads/2023/06/Airbnb-luxury.jpg",
    "image3": "https://www.androidauthority.com/wp-content/uploads/2021/03/airbnb-example-home-scaled-e1644903817613.jpg"
}
```

---

### 2.4 Credit Card Authorization (Prorated)

**Endpoint**: `POST /contract/recurring_card_auth_prorated`

**Sample Payload**:
```json
{
    "Agreement Number": "12345",
    "Host Name": "John Doe",
    "Guest Name": "Jane Smith",
    "Weeks Number": "16",
    "Listing Description": "Cozy 2-bedroom apartment in downtown",
    "Number of Payments": "4",
    "Four Week Rent": "2000.00",
    "Damage Deposit": "1000.00",
    "Maintenance Fee": "50.00",
    "Total First Payment": "3050.00",
    "Penultimate Week Number": "15",
    "Total Second Payment": "2050.00",
    "Last Payment Rent": "500.00",
    "Splitlease Credit": "100.00",
    "Last Payment Weeks": 4
}
```

---

### 2.5 Credit Card Authorization (Non-Prorated)

**Endpoint**: `POST /contract/recurring_card_auth_nonprorated`

Same payload structure as prorated version.

---

## 3. Google Drive Testing

### 3.1 Status Endpoint

**Endpoint**: `GET /google_drive/status`

Tests OAuth credential validity without uploading.

**Expected Response**:
```json
{
    "success": true,
    "status": "connected",
    "scopes": ["https://www.googleapis.com/auth/drive.file", ...]
}
```

### 3.2 How Document Upload Was Tested

1. **Integration Testing**: Contract endpoints automatically upload to Google Drive
2. **Status Check**: Validates OAuth credentials are valid
3. **Response Verification**: Tests check for `drive_url` and `file_id` in response
4. **No Mock Uploads**: Tests create real documents in Google Drive

---

## 4. Test Response Validation

### 4.1 Expected Response Structure (Success)

```json
{
    "success": true,
    "filename": "host_payout_schedule-AG123.docx",
    "drive_url": "https://drive.google.com/...",
    "file_id": "abc123",
    "returned_error": "no"
}
```

### 4.2 Expected Response Structure (Failure)

```json
{
    "success": false,
    "error": "Description of what went wrong",
    "returned_error": "yes"
}
```

### 4.3 Expected Status Codes

| Endpoint | Expected Status |
|----------|-----------------|
| `/contract/host_payout` | 200 |
| `/contract/periodic_tenancy` | 200 |
| `/contract/supplemental` | 200 |
| `/contract/recurring_card_auth_prorated` | 200 |
| `/contract/recurring_card_auth_nonprorated` | 200 |
| `/google_drive/status` | 200 |

---

## 5. Edge Function Comparison

### 5.1 Current Edge Function Actions

| Action | Description |
|--------|-------------|
| `generate_host_payout` | Host Payout Schedule Form |
| `generate_supplemental` | Supplemental Agreement |
| `generate_periodic_tenancy` | Periodic Tenancy Agreement |
| `generate_credit_card_auth` | Credit Card Authorization (supports `Is Prorated` flag) |
| `generate_all` | Generate all 4 documents at once |

### 5.2 Edge Function Request Format

```json
{
    "action": "generate_host_payout",
    "payload": {
        "Agreement Number": "AG123",
        ...
    }
}
```

### 5.3 Key Differences

| Feature | PythonAnywhere | Edge Function |
|---------|----------------|---------------|
| Auth | OAuth (user-based) | Service Account (server-to-server) |
| Prorated/Non-prorated | Separate endpoints | Single endpoint with `Is Prorated` flag |
| Bulk generation | Not available | `generate_all` action |
| Status check | `/google_drive/status` | Not implemented |

---

## 6. Test Page Recommendations for Edge Functions

### 6.1 Suggested Test Page Features

1. **Action Selector**: Dropdown to select which document to generate
2. **Payload Editor**: JSON textarea with sample payloads pre-filled
3. **Test Button**: Execute the action and display results
4. **Response Viewer**: Show success/failure status, Drive URL, errors
5. **Batch Test**: Run all document types sequentially
6. **Environment Toggle**: Switch between dev/prod Edge Functions

### 6.2 Sample Test Payloads to Include

The Edge Function test page should include the same sample payloads from `test_config.py` (documented above), with these modifications:

1. **Add `Is Prorated` flag** to credit card auth payload
2. **Add `generate_all` payload** combining all 4 document types

### 6.3 Test Flow

```
1. User selects action from dropdown
2. Sample payload auto-fills in JSON editor
3. User can modify payload if needed
4. User clicks "Generate Document"
5. Request sent to Edge Function
6. Response displayed with:
   - Success/Failure status
   - Generated filename
   - Google Drive link (clickable)
   - Error message (if failed)
   - Response time
```

---

## 7. Key Files Reference

### PythonAnywhere

| File | Purpose |
|------|---------|
| `modules/core/monitoring/test_config.py` | Test payloads and endpoint config |
| `modules/core/monitoring/health_checker.py` | Test execution logic |
| `modules/google_drive/uploader.py` | Google Drive OAuth integration |

### Edge Functions

| File | Purpose |
|------|---------|
| `supabase/functions/lease-documents/index.ts` | Main entry point |
| `supabase/functions/lease-documents/lib/types.ts` | Payload type definitions |
| `supabase/functions/lease-documents/handlers/*.ts` | Document generators |
| `supabase/functions/lease-documents/lib/googleDrive.ts` | Service Account upload |

---

## 8. Implementation Notes

### 8.1 Health Check Approach (PythonAnywhere)

The PythonAnywhere tests are designed for automated health monitoring:
- Runs on a schedule (cron job)
- Reports to Slack channels
- No user interaction required
- Validates both API availability and Google Drive connectivity

### 8.2 Test Page Approach (Recommended for Edge Functions)

For manual testing during development, a UI test page is recommended:
- Interactive testing for developers
- Easy payload modification
- Immediate visual feedback
- Can verify Google Drive links in browser

---

## Document Metadata

- **Created**: 2026-02-03 14:30:00
- **Author**: Claude (Context Lookup)
- **Purpose**: Test implementation analysis for Edge Function development
