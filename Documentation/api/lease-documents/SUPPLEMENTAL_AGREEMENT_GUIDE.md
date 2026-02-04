# Supplemental Agreement - Comprehensive API Guide

**Version**: 1.0
**Created**: 2026-02-04
**Last Updated**: 2026-02-04
**Supabase Edge Function**: `lease-documents`
**Action**: `generateSupplemental`
**Template**: `supplementalagreement.docx`

---

## Table of Contents

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [API Reference](#api-reference)
4. [Field Reference](#field-reference)
5. [Implementation Guide](#implementation-guide)
6. [Image Embedding](#image-embedding)
7. [Validation Rules](#validation-rules)
8. [Testing & Examples](#testing--examples)
9. [Troubleshooting](#troubleshooting)
10. [Related Documentation](#related-documentation)

---

## Overview

### What is the Supplemental Agreement?

The **Supplemental Agreement** is a legal document that supplements the main Periodic Tenancy Agreement with additional property-specific details, including:

- Listing description and amenities
- Property images (up to 3)
- Space details and type
- Location information
- House rules and restrictions
- Lease duration and guest capacity

This document provides visual and descriptive context about the rental property and is referenced in the main tenancy agreement.

### Document Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUPPLEMENTAL AGREEMENT LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. LEASE CREATION                                                          │
│     └─ Proposal accepted → bookings_leases record created                   │
│                                                                              │
│  2. DOCUMENT GENERATION TRIGGER                                             │
│     └─ POST /lease-documents                                                │
│        └─ action: "generateSupplemental"                                    │
│                                                                              │
│  3. DATA COLLECTION                                                         │
│     ├─ Fetch listing details (title, description, images)                   │
│     ├─ Fetch proposal dates and guest capacity                              │
│     ├─ Fetch host information                                               │
│     └─ Format and validate payload                                          │
│                                                                              │
│  4. DOCUMENT RENDERING                                                      │
│     ├─ Download template from Supabase Storage                              │
│     ├─ Render with docxtpl (Python-compatible variables)                    │
│     ├─ Embed property images (up to 3)                                      │
│     └─ Generate supplement_agreement-{AGREEMENT_NUMBER}.docx                │
│                                                                              │
│  5. UPLOAD & DISTRIBUTION                                                   │
│     ├─ Upload to Google Drive                                               │
│     ├─ Upload to Supabase Storage (fallback/backup)                         │
│     ├─ Return webViewLink for host/guest access                             │
│     └─ Send Slack notification                                              │
│                                                                              │
│  6. REFERENCE IN PERIODIC TENANCY                                           │
│     └─ Supplemental Number referenced in main agreement                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Business Context

### When is this Document Generated?

The Supplemental Agreement is generated:
- **Timing**: Immediately after proposal acceptance during lease finalization
- **Trigger**: Part of the 4-document suite (Host Payout, Supplemental, Periodic Tenancy, Credit Card Auth)
- **Frequency**: Once per lease (no revisions unless lease is amended)

### Why is this Document Needed?

1. **Legal Context**: Provides property-specific terms referenced by the main agreement
2. **Visual Representation**: Gives guests a clear view of the property via embedded images
3. **Transparency**: Documents exact listing details at the time of lease signing
4. **House Rules**: Formalizes host restrictions and property rules

### Business Rules

| Rule | Description |
|------|-------------|
| **Required Field** | Only `Agreement Number` is strictly required |
| **Image Limit** | Maximum 3 images embedded in document |
| **Image Format** | URLs pointing to publicly accessible images (Bubble storage, Supabase Storage) |
| **Number Format** | Supplemental Number follows pattern: `SUP-{Agreement Number}` |
| **Template Variable Naming** | Uses snake_case (e.g., `agreement_number`, `start_date`) for Python compatibility |
| **Date Formatting** | All dates formatted as MM/DD/YYYY |
| **Optional Fields** | Missing fields render as empty strings (no fallback values) |

---

## API Reference

### Endpoint

```
POST https://splitlease-backend.supabase.co/functions/v1/lease-documents
```

### Headers

```http
Content-Type: application/json
Authorization: Bearer {SUPABASE_AUTH_TOKEN}
apikey: {SUPABASE_ANON_KEY}
```

### Request Body

```json
{
  "action": "generateSupplemental",
  "payload": {
    "Agreement Number": "LSE-2026-001234",
    "Check in Date": "2026-03-01T00:00:00Z",
    "Check Out Date": "2026-06-01T00:00:00Z",
    "Number of weeks": "12",
    "Guests Allowed": "2",
    "Host Name": "John Smith",
    "Supplemental Number": "SUP-LSE-2026-001234",
    "Location": "123 Main St, Brooklyn, NY 11201",
    "Type of Space": "Private Room",
    "Listing Title": "Cozy Brooklyn Room Near Subway",
    "Listing Description": "Bright and comfortable private room in a shared apartment...",
    "Space Details": "Queen bed, desk, closet, shared bathroom and kitchen access",
    "image1": "https://storage.supabase.co/listing-images/abc123.jpg",
    "image2": "https://storage.supabase.co/listing-images/def456.jpg",
    "image3": "https://storage.supabase.co/listing-images/ghi789.jpg"
  }
}
```

### Success Response

**HTTP Status**: 200 OK

```json
{
  "success": true,
  "data": {
    "success": true,
    "filename": "supplement_agreement-LSE-2026-001234.docx",
    "driveUrl": "https://drive.google.com/file/d/abc123/view",
    "drive_url": "https://drive.google.com/file/d/abc123/view",
    "web_view_link": "https://drive.google.com/file/d/abc123/view",
    "fileId": "abc123",
    "file_id": "abc123",
    "returned_error": "no"
  }
}
```

### Error Response

**HTTP Status**: 200 OK (with `success: false`)

```json
{
  "success": false,
  "error": "Agreement Number is required"
}
```

**Common Error Codes**:
- `Agreement Number is required` - Missing required field
- `Failed to download template` - Template file missing from Supabase Storage
- `Failed to upload Supplemental Agreement` - Both Drive and Supabase uploads failed
- `Invalid date format` - Date fields not in ISO 8601 format

---

## Field Reference

### Required Fields

| Field Name | Type | Description | Example | Validation |
|------------|------|-------------|---------|------------|
| `Agreement Number` | string | Unique lease identifier | `"LSE-2026-001234"` | Required, non-empty |

### Core Information Fields

| Field Name | Type | Description | Example | Source Table |
|------------|------|-------------|---------|--------------|
| `Host Name` | string | Full name of host | `"John Smith"` | user (via Host FK) |
| `Supplemental Number` | string | Document identifier | `"SUP-LSE-2026-001234"` | Generated: `SUP-{Agreement Number}` |

### Date & Duration Fields

| Field Name | Type | Description | Format | Source Table |
|------------|------|-------------|--------|--------------|
| `Check in Date` | string (ISO 8601) | Lease start date | `"2026-03-01T00:00:00Z"` | proposal.`hc move in date` |
| `Check Out Date` | string (ISO 8601) | Lease end date | `"2026-06-01T00:00:00Z"` | proposal.`Move-out` |
| `Number of weeks` | string | Total lease duration | `"12"` | proposal.`Reservation Span (Weeks)` |
| `Guests Allowed` | string | Maximum occupancy | `"2"` | listing.`guests allowed` |

### Listing Details Fields

| Field Name | Type | Description | Example | Source Table |
|------------|------|-------------|---------|--------------|
| `Listing Title` | string | Property headline | `"Cozy Brooklyn Room"` | listing.`title` |
| `Listing Description` | string | Full property description | `"Bright and comfortable..."` | listing.`description` |
| `Location` | string | Full property address | `"123 Main St, Brooklyn, NY"` | listing.`address` |
| `Type of Space` | string | Room classification | `"Private Room"` | listing.`type of space` |
| `Space Details` | string | Additional amenities/features | `"Queen bed, desk, closet..."` | listing.`description` (or custom field) |

### Image Fields

| Field Name | Type | Description | Format | Source Table |
|------------|------|-------------|--------|--------------|
| `image1` | string (URL) | First property image | `"https://storage.supabase.co/..."` | listing.`images[0]` |
| `image2` | string (URL) | Second property image | `"https://storage.supabase.co/..."` | listing.`images[1]` |
| `image3` | string (URL) | Third property image | `"https://storage.supabase.co/..."` | listing.`images[2]` |

### Template Variable Mapping

The handler maps payload fields (space-separated keys) to template variables (snake_case):

| Payload Field (Input) | Template Variable (docxtpl) | Transform |
|----------------------|----------------------------|-----------|
| `Agreement Number` | `agreement_number` | Direct |
| `Check in Date` | `start_date` | formatDate() → MM/DD/YYYY |
| `Check Out Date` | `end_date` | formatDate() → MM/DD/YYYY |
| `Number of weeks` | `weeks_number` | Direct (or empty string) |
| `Guests Allowed` | `guest_allowed` AND `guests_allowed` | Direct (duplicated for template compatibility) |
| `Host Name` | `host_name` | Direct (or empty string) |
| `Listing Description` | `listing_description` | Direct (or empty string) |
| `Listing Title` | `listing_title` | Direct (or empty string) |
| `Space Details` | `spacedetails` | Direct (or empty string) |
| `Location` | `location` | Direct (or empty string) |
| `Type of Space` | `type_of_space` | Direct (or empty string) |
| `Supplemental Number` | `supplement_number` | Direct (or empty string) |
| `image1` | `image1` | Direct URL (or empty string) |
| `image2` | `image2` | Direct URL (or empty string) |
| `image3` | `image3` | Direct URL (or empty string) |

---

## Implementation Guide

### Step 1: Fetch Lease Data

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch lease with related entities
const { data: lease, error: leaseError } = await supabase
  .from('bookings_leases')
  .select(`
    _id,
    "Agreement Number",
    Proposal,
    Listing,
    Guest,
    Host
  `)
  .eq('_id', leaseId)
  .single();

if (leaseError) {
  throw new Error(`Failed to fetch lease: ${leaseError.message}`);
}

console.log('✅ Lease fetched:', lease['Agreement Number']);
```

### Step 2: Fetch Proposal (Dates & Duration)

```typescript
const { data: proposal, error: proposalError } = await supabase
  .from('proposal')
  .select(`
    "hc move in date",
    "Move-out",
    "Reservation Span (Weeks)"
  `)
  .eq('_id', lease.Proposal)
  .single();

if (proposalError) {
  throw new Error(`Failed to fetch proposal: ${proposalError.message}`);
}

const moveInDate = proposal['hc move in date'];    // ISO 8601 timestamptz
const moveOutDate = proposal['Move-out'];           // ISO 8601 text
const numberOfWeeks = proposal['Reservation Span (Weeks)'];  // integer
```

### Step 3: Fetch Listing Details

```typescript
const { data: listing, error: listingError } = await supabase
  .from('listing')
  .select(`
    title,
    address,
    description,
    "type of space",
    "guests allowed",
    images
  `)
  .eq('_id', lease.Listing)
  .single();

if (listingError) {
  throw new Error(`Failed to fetch listing: ${listingError.message}`);
}

// Images are stored as array of URLs
const image1 = listing.images?.[0] || '';
const image2 = listing.images?.[1] || '';
const image3 = listing.images?.[2] || '';
```

### Step 4: Fetch Host Information

```typescript
const { data: host, error: hostError } = await supabase
  .from('user')
  .select('_id, name')
  .eq('_id', lease.Host)
  .single();

if (hostError) {
  console.warn('⚠️ Host fetch failed:', hostError.message);
}

const hostName = host?.name || '';
```

### Step 5: Build Payload

```typescript
interface SupplementalPayload {
  'Agreement Number': string;
  'Check in Date': string;
  'Check Out Date': string;
  'Number of weeks': string;
  'Guests Allowed': string;
  'Host Name': string;
  'Listing Title': string;
  'Listing Description': string;
  'Location': string;
  'Type of Space': string;
  'Space Details': string;
  'Supplemental Number': string;
  'image1'?: string;
  'image2'?: string;
  'image3'?: string;
}

const supplementalPayload: SupplementalPayload = {
  'Agreement Number': lease['Agreement Number'],
  'Check in Date': moveInDate,
  'Check Out Date': moveOutDate,
  'Number of weeks': numberOfWeeks?.toString() || '',
  'Guests Allowed': listing['guests allowed']?.toString() || '',
  'Host Name': hostName,
  'Listing Title': listing.title || '',
  'Listing Description': listing.description || '',
  'Location': listing.address || '',
  'Type of Space': listing['type of space'] || '',
  'Space Details': listing.description || '',  // Can be customized
  'Supplemental Number': `SUP-${lease['Agreement Number']}`,
  'image1': image1,
  'image2': image2,
  'image3': image3,
};

console.log('✅ Supplemental payload built');
```

### Step 6: Call Edge Function

```typescript
const { data, error } = await supabase.functions.invoke('lease-documents', {
  body: {
    action: 'generateSupplemental',
    payload: supplementalPayload,
  },
});

if (error) {
  console.error('❌ Edge function error:', error);
  throw new Error(`Document generation failed: ${error.message}`);
}

if (!data.success) {
  console.error('❌ Document generation failed:', data.error);
  throw new Error(data.error);
}

console.log('✅ Supplemental Agreement generated:', data.filename);
console.log('📄 Drive URL:', data.driveUrl);
```

### Step 7: Handle Result

```typescript
// Store document URLs in database (optional)
const { error: updateError } = await supabase
  .from('bookings_leases')
  .update({
    'Supplemental Agreement URL': data.driveUrl,
    'Supplemental Agreement File ID': data.fileId,
  })
  .eq('_id', leaseId);

if (updateError) {
  console.warn('⚠️ Failed to update lease record:', updateError.message);
}

// Return document URL to frontend
return {
  success: true,
  documentUrl: data.driveUrl,
  filename: data.filename,
};
```

---

## Image Embedding

### How Image Embedding Works

The Supplemental Agreement template supports embedding up to 3 property images directly into the document.

#### Image Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          IMAGE EMBEDDING FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. PAYLOAD VALIDATION                                                      │
│     └─ Extract image1, image2, image3 URLs from payload                     │
│                                                                              │
│  2. URL PREPARATION                                                         │
│     └─ Build imageUrls object: { image1: "url", image2: "url", ... }       │
│                                                                              │
│  3. TEMPLATE RENDERING                                                      │
│     └─ downloadAndRenderTemplate(..., { useImages: true, imageUrls })       │
│        ├─ Fetch each image URL                                              │
│        ├─ Convert to base64                                                 │
│        ├─ Embed in docx via InlineImage placeholders                        │
│        └─ Resize/scale to fit document layout                               │
│                                                                              │
│  4. DOCUMENT OUTPUT                                                         │
│     └─ Images embedded as binary data in .docx file                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Image Requirements

| Requirement | Specification |
|-------------|---------------|
| **Format** | JPEG, PNG, WebP (most common web formats) |
| **Accessibility** | Publicly accessible URLs (no authentication required) |
| **Size** | Recommended max 2MB per image for performance |
| **Dimensions** | Recommended 1200x800px or similar aspect ratio |
| **Quantity** | Maximum 3 images per document |
| **URL Format** | Full HTTPS URLs (e.g., `https://storage.supabase.co/...`) |

### Example Image URLs

```typescript
// ✅ GOOD - Valid image URLs
const validImages = {
  'image1': 'https://storage.supabase.co/object/public/listing-images/abc123.jpg',
  'image2': 'https://res.cloudinary.com/splitlease/image/upload/v123/room.png',
  'image3': 'https://splitlease.bubble.io/f1234567890_image.jpg',
};

// ❌ BAD - Invalid or problematic URLs
const invalidImages = {
  'image1': '/relative/path/image.jpg',           // Relative path
  'image2': 'file:///C:/local/image.jpg',         // Local file
  'image3': 'http://example.com/image.jpg',       // HTTP (not HTTPS)
};
```

### Handling Missing Images

If an image URL is missing or invalid:
- The handler logs a warning but **does not fail**
- The template renders with empty placeholders for missing images
- Document generation continues successfully

```typescript
// Example with partial images
const partialPayload = {
  'Agreement Number': 'LSE-2026-001234',
  // ... other fields ...
  'image1': 'https://storage.supabase.co/image1.jpg',  // ✅ Provided
  'image2': '',                                         // ⚠️ Empty (no image)
  'image3': undefined,                                  // ⚠️ Undefined (no image)
};

// Result: Document generated with only image1 embedded
```

### Image Embedding Code Reference

From `generateSupplemental.ts` (lines 43-71):

```typescript
// Extract and log image URLs
console.log('[generateSupplemental] 📷 IMAGE URL EXTRACTION:');
console.log('[generateSupplemental] 📷 Raw payload image1:', validatedPayload['image1'] || '(not provided)');
console.log('[generateSupplemental] 📷 Raw payload image2:', validatedPayload['image2'] || '(not provided)');
console.log('[generateSupplemental] 📷 Raw payload image3:', validatedPayload['image3'] || '(not provided)');

const imageUrls: Record<string, string> = {};
if (validatedPayload['image1']) {
  imageUrls.image1 = validatedPayload['image1'];
}
if (validatedPayload['image2']) {
  imageUrls.image2 = validatedPayload['image2'];
}
if (validatedPayload['image3']) {
  imageUrls.image3 = validatedPayload['image3'];
}

console.log('[generateSupplemental] 📷 Final imageUrls object:', JSON.stringify(imageUrls));
console.log('[generateSupplemental] 📷 Number of images to embed:', Object.keys(imageUrls).length);

// Render template with images
const documentContent = await downloadAndRenderTemplate(
  supabase,
  TEMPLATE_PATHS.supplemental,
  templateData,
  {
    useImages: true,
    imageUrls,
  }
);
```

---

## Validation Rules

### Pre-Call Validation

Before calling the edge function, validate:

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateSupplementalPayload(payload: SupplementalPayload): ValidationResult {
  const errors: string[] = [];

  // Required field
  if (!payload['Agreement Number'] || payload['Agreement Number'].trim() === '') {
    errors.push('Agreement Number is required');
  }

  // Date validation (if provided)
  if (payload['Check in Date']) {
    const checkInDate = new Date(payload['Check in Date']);
    if (isNaN(checkInDate.getTime())) {
      errors.push('Check in Date must be a valid ISO 8601 date');
    }
  }

  if (payload['Check Out Date']) {
    const checkOutDate = new Date(payload['Check Out Date']);
    if (isNaN(checkOutDate.getTime())) {
      errors.push('Check Out Date must be a valid ISO 8601 date');
    }

    // Check out must be after check in
    if (payload['Check in Date']) {
      const checkInDate = new Date(payload['Check in Date']);
      if (checkOutDate <= checkInDate) {
        errors.push('Check Out Date must be after Check in Date');
      }
    }
  }

  // Number of weeks validation
  if (payload['Number of weeks']) {
    const weeks = parseInt(payload['Number of weeks'], 10);
    if (isNaN(weeks) || weeks <= 0) {
      errors.push('Number of weeks must be a positive integer');
    }
  }

  // Guests allowed validation
  if (payload['Guests Allowed']) {
    const guests = parseInt(payload['Guests Allowed'], 10);
    if (isNaN(guests) || guests <= 0) {
      errors.push('Guests Allowed must be a positive integer');
    }
  }

  // Image URL validation (if provided)
  ['image1', 'image2', 'image3'].forEach((imageKey) => {
    const imageUrl = payload[imageKey];
    if (imageUrl && !imageUrl.startsWith('https://')) {
      errors.push(`${imageKey} must be a valid HTTPS URL`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### Runtime Validation (Edge Function)

The edge function performs these validations (from `validators.ts`):

1. **Payload Type Check**: Ensures payload is an object
2. **Agreement Number Required**: Fails if missing or empty
3. **String Coercion**: Converts all non-string values to strings
4. **Optional Field Handling**: Missing fields become empty strings

```typescript
// From validateSupplementalPayload (validators.ts lines 116-145)
export function validateSupplementalPayload(payload: unknown): SupplementalPayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload is required and must be an object');
  }

  const p = payload as Record<string, unknown>;

  // Only Agreement Number is strictly required
  if (!p['Agreement Number']) {
    throw new ValidationError('Agreement Number is required');
  }

  return {
    'Agreement Number': requireString(p['Agreement Number'], 'Agreement Number'),
    'Check in Date': optionalString(p['Check in Date']),
    'Check Out Date': optionalString(p['Check Out Date']),
    'Number of weeks': optionalString(p['Number of weeks']),
    'Guests Allowed': optionalString(p['Guests Allowed']),
    'Host Name': optionalString(p['Host Name']),
    'Listing Title': optionalString(p['Listing Title']),
    'Listing Description': optionalString(p['Listing Description']),
    'Location': optionalString(p['Location']),
    'Type of Space': optionalString(p['Type of Space']),
    'Space Details': optionalString(p['Space Details']),
    'Supplemental Number': optionalString(p['Supplemental Number']),
    'image1': optionalStringOrUndefined(p['image1']),
    'image2': optionalStringOrUndefined(p['image2']),
    'image3': optionalStringOrUndefined(p['image3']),
  };
}
```

---

## Testing & Examples

### Test Case 1: Minimal Payload

**Scenario**: Generate document with only required field

```typescript
const minimalPayload = {
  'Agreement Number': 'LSE-TEST-001',
};

const { data, error } = await supabase.functions.invoke('lease-documents', {
  body: {
    action: 'generateSupplemental',
    payload: minimalPayload,
  },
});

// Expected: Success with empty fields in document
expect(data.success).toBe(true);
expect(data.filename).toBe('supplement_agreement-LSE-TEST-001.docx');
```

### Test Case 2: Complete Payload with Images

**Scenario**: Generate document with all fields populated

```typescript
const completePayload = {
  'Agreement Number': 'LSE-2026-001234',
  'Check in Date': '2026-03-01T00:00:00Z',
  'Check Out Date': '2026-06-01T00:00:00Z',
  'Number of weeks': '12',
  'Guests Allowed': '2',
  'Host Name': 'Jane Doe',
  'Supplemental Number': 'SUP-LSE-2026-001234',
  'Location': '123 Main St, Brooklyn, NY 11201',
  'Type of Space': 'Private Room',
  'Listing Title': 'Cozy Brooklyn Room Near Subway',
  'Listing Description': 'Bright and comfortable private room in a shared apartment with easy access to the L train.',
  'Space Details': 'Queen bed, desk, closet, shared bathroom and kitchen access. WiFi included.',
  'image1': 'https://storage.supabase.co/object/public/listings/room1.jpg',
  'image2': 'https://storage.supabase.co/object/public/listings/room2.jpg',
  'image3': 'https://storage.supabase.co/object/public/listings/common.jpg',
};

const { data, error } = await supabase.functions.invoke('lease-documents', {
  body: {
    action: 'generateSupplemental',
    payload: completePayload,
  },
});

// Expected: Success with all fields populated and images embedded
expect(data.success).toBe(true);
expect(data.filename).toBe('supplement_agreement-LSE-2026-001234.docx');
expect(data.driveUrl).toMatch(/^https:\/\/drive\.google\.com/);
```

### Test Case 3: Partial Images

**Scenario**: Only some images provided

```typescript
const partialImagesPayload = {
  'Agreement Number': 'LSE-2026-005678',
  'Check in Date': '2026-04-15T00:00:00Z',
  'Check Out Date': '2026-07-15T00:00:00Z',
  'Number of weeks': '13',
  'Guests Allowed': '1',
  'Host Name': 'Mike Johnson',
  'Listing Title': 'Studio Apartment in Manhattan',
  'Listing Description': 'Modern studio with city views',
  'Location': '456 Park Ave, Manhattan, NY 10022',
  'Type of Space': 'Entire Place',
  'Space Details': 'Full kitchen, bathroom, queen bed, balcony',
  'Supplemental Number': 'SUP-LSE-2026-005678',
  'image1': 'https://storage.supabase.co/object/public/listings/studio.jpg',
  // image2 and image3 omitted
};

const { data, error } = await supabase.functions.invoke('lease-documents', {
  body: {
    action: 'generateSupplemental',
    payload: partialImagesPayload,
  },
});

// Expected: Success with only image1 embedded
expect(data.success).toBe(true);
```

### Test Case 4: Invalid Date Format

**Scenario**: Invalid date triggers validation error

```typescript
const invalidDatePayload = {
  'Agreement Number': 'LSE-2026-999999',
  'Check in Date': 'not-a-date',  // ❌ Invalid
  'Check Out Date': '2026-06-01T00:00:00Z',
};

const { data, error } = await supabase.functions.invoke('lease-documents', {
  body: {
    action: 'generateSupplemental',
    payload: invalidDatePayload,
  },
});

// Expected: Failure (date formatting error)
// Note: Edge function may still succeed but document will have malformed dates
```

### Test Case 5: Missing Agreement Number

**Scenario**: Missing required field

```typescript
const missingRequiredPayload = {
  'Check in Date': '2026-03-01T00:00:00Z',
  'Host Name': 'Test Host',
  // Agreement Number omitted ❌
};

const { data, error } = await supabase.functions.invoke('lease-documents', {
  body: {
    action: 'generateSupplemental',
    payload: missingRequiredPayload,
  },
});

// Expected: Validation error
expect(data.success).toBe(false);
expect(data.error).toContain('Agreement Number is required');
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "Agreement Number is required"

**Symptoms**:
```json
{
  "success": false,
  "error": "Agreement Number is required"
}
```

**Cause**: Payload missing `Agreement Number` field or value is empty string

**Solution**:
```typescript
// ❌ BAD
const payload = {
  'Agreement Number': '',  // Empty string
};

// ✅ GOOD
const payload = {
  'Agreement Number': 'LSE-2026-001234',
};
```

---

#### Issue 2: Images Not Embedding

**Symptoms**: Document generates successfully but images are missing

**Cause**: Image URLs are not publicly accessible or have invalid format

**Debug Steps**:
1. Check edge function logs for image processing messages:
   ```
   [generateSupplemental] 📷 IMAGE URL EXTRACTION:
   [generateSupplemental] 📷 Raw payload image1: https://...
   [generateSupplemental] 📷 Number of images to embed: 3
   ```

2. Verify image URLs are accessible:
   ```typescript
   const testImageUrl = payload['image1'];
   const response = await fetch(testImageUrl);
   console.log('Image accessible:', response.ok);
   ```

3. Ensure URLs use HTTPS:
   ```typescript
   // ❌ BAD
   'image1': 'http://example.com/image.jpg'  // HTTP not HTTPS

   // ✅ GOOD
   'image1': 'https://storage.supabase.co/object/public/image.jpg'
   ```

---

#### Issue 3: Dates Rendering Incorrectly

**Symptoms**: Dates appear as "NaN/NaN/NaN" or invalid format in document

**Cause**: Date strings not in valid ISO 8601 format

**Solution**:
```typescript
// ❌ BAD - Non-ISO formats
const badDates = {
  'Check in Date': '03/01/2026',           // MM/DD/YYYY
  'Check Out Date': '2026-06-01',          // Missing time
};

// ✅ GOOD - ISO 8601 format
const goodDates = {
  'Check in Date': '2026-03-01T00:00:00Z',
  'Check Out Date': '2026-06-01T00:00:00Z',
};
```

From `formatters.ts`, dates are converted using:
```typescript
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;  // Output: "03/01/2026"
}
```

---

#### Issue 4: "Failed to upload Supplemental Agreement"

**Symptoms**:
```json
{
  "success": false,
  "error": "Failed to upload Supplemental Agreement: Drive (error1) | Supabase (error2)",
  "returned_error": "yes"
}
```

**Cause**: Both Google Drive and Supabase Storage uploads failed

**Debug Steps**:
1. Check Google Drive API credentials and permissions
2. Verify Supabase Storage bucket exists and is accessible
3. Check edge function logs for specific upload errors

**Fail-Safe Logic** (from `generateSupplemental.ts` lines 90-98):
```typescript
// If both uploads fail, document generation fails
if (!driveUploadResult.success && !storageUploadResult.success) {
  const errorMsg = `Failed to upload Supplemental Agreement: Drive (${driveUploadResult.error}) | Supabase (${storageUploadResult.error})`;
  await notifySlack(errorMsg, true);
  return {
    success: false,
    error: errorMsg,
    returned_error: 'yes',
  };
}

// If only Drive fails, fall back to Supabase URL
if (!driveUploadResult.success) {
  await notifySlack(`[WARNING] Supplemental Agreement uploaded to Supabase ONLY (Drive failed): ${filename}`, true);
}
```

---

#### Issue 5: Template Not Found

**Symptoms**: "Failed to download template" error

**Cause**: Template file `supplementalagreement.docx` missing from Supabase Storage

**Solution**:
1. Verify template exists in Supabase Storage bucket `lease-templates`
2. Check template path constant:
   ```typescript
   // From templateRenderer.ts
   export const TEMPLATE_PATHS = {
     supplemental: 'supplementalagreement.docx',
     // ...
   };
   ```
3. Re-upload template if missing

---

#### Issue 6: "Payload is required and must be an object"

**Symptoms**:
```json
{
  "success": false,
  "error": "Payload is required and must be an object"
}
```

**Cause**: Request body malformed or payload field missing

**Solution**:
```typescript
// ❌ BAD
const badRequest = {
  action: 'generateSupplemental',
  // payload field missing
};

// ❌ BAD
const badRequest2 = {
  action: 'generateSupplemental',
  payload: null,  // null instead of object
};

// ✅ GOOD
const goodRequest = {
  action: 'generateSupplemental',
  payload: {
    'Agreement Number': 'LSE-2026-001234',
    // ... other fields
  },
};
```

---

## Related Documentation

### Internal Documentation

- **[FIELDS_FOR_LEASE_DOCUMENTS_MAPPING.md](./FIELDS_FOR_LEASE_DOCUMENTS_MAPPING.md)** - Complete field mapping guide from database tables to document payloads
- **[PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md](./PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md)** - Payment calculation workflow (referenced by Periodic Tenancy)
- **[HOST_PAYMENT_RECORDS_CALCULATION_GUIDE.md](./HOST_PAYMENT_RECORDS_CALCULATION_GUIDE.md)** - Host payout specifics

### API Documentation

- **[Documentation/api/README.md](../README.md)** - Main API documentation index
- **[Documentation/api/edge-functions/README.md](../edge-functions/README.md)** - Complete Edge Functions reference

### Source Code References

| File | Purpose | Lines |
|------|---------|-------|
| [generateSupplemental.ts](../../../supabase/functions/lease-documents/handlers/generateSupplemental.ts) | Handler implementation | 1-151 |
| [types.ts](../../../supabase/functions/lease-documents/lib/types.ts) | Type definitions | 91-108, 230-247 |
| [validators.ts](../../../supabase/functions/lease-documents/lib/validators.ts) | Payload validation | 116-145 |
| [formatters.ts](../../../supabase/functions/lease-documents/lib/formatters.ts) | Date formatting | N/A |
| [templateRenderer.ts](../../../supabase/functions/lease-documents/lib/templateRenderer.ts) | Document rendering with images | N/A |

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-04 | 1.0 | Initial creation - comprehensive Supplemental Agreement guide |

---

**Maintained by**: Engineering Team
**Support**: support@split.lease
**Slack**: #engineering-internal
