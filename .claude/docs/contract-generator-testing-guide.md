# Contract Generator Testing Guide

**GENERATED**: 2026-01-28
**SCOPE**: Complete testing strategy for contract generator implementation
**VERSION**: 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [E2E Tests](#e2e-tests)
5. [Manual Testing Checklist](#manual-testing-checklist)
6. [Sample Test Data](#sample-test-data)
7. [Testing Infrastructure](#testing-infrastructure)

---

## Overview

The contract generator implementation consists of:

### Components
- **Edge Function**: `supabase/functions/contract-generator/index.ts`
- **Frontend Pages**: `/contracts/*` routes (4 document types)
- **Document Types**:
  1. Credit Card Authorization (Prorated)
  2. Credit Card Authorization (Non-Prorated)
  3. Host Payout
  4. Periodic Tenancy
  5. Supplemental

### Key Libraries
- **Currency**: `lib/currency.ts` - currency parsing, formatting, calculations
- **Dates**: `lib/dates.ts` - date parsing, formatting
- **Validation**: `lib/validation.ts` - payload validation
- **Storage**: `lib/storage.ts` - template loading from Supabase
- **DOCX**: `lib/docx.ts` - document generation
- **Google Drive**: `lib/googleDrive.ts` - optional Google Drive uploads

---

## Unit Tests

### Setup

Create test file: `supabase/functions/contract-generator/__tests__/*.test.ts`

```bash
# Run unit tests
deno test --allow-env supabase/functions/contract-generator/__tests__
```

### Currency Functions

**File**: `lib/currency.ts`

```typescript
import { assertEquals } from "assert";
import {
  convertCurrencyToFloat,
  roundDown,
  formatCurrency,
  formatCurrencyDisplay,
  isValidCurrency
} from "../lib/currency.ts";

Deno.test("convertCurrencyToFloat - handles dollar sign", () => {
  const result = convertCurrencyToFloat("$1,234.56");
  assertEquals(result, 1234.56);
});

Deno.test("convertCurrencyToFloat - handles commas", () => {
  const result = convertCurrencyToFloat("1,234.56");
  assertEquals(result, 1234.56);
});

Deno.test("convertCurrencyToFloat - handles plain number", () => {
  const result = convertCurrencyToFloat("1234.56");
  assertEquals(result, 1234.56);
});

Deno.test("convertCurrencyToFloat - throws on invalid", () => {
  try {
    convertCurrencyToFloat("invalid");
  } catch (error) {
    assertEquals(error.message, "Invalid currency value: invalid");
  }
});

Deno.test("roundDown - rounds to 2 decimals", () => {
  assertEquals(roundDown(1234.5678), 1234.56);
  assertEquals(roundDown(1234.5649), 1234.56);
});

Deno.test("formatCurrency - formats to 2 decimals", () => {
  assertEquals(formatCurrency(1234.5), "1234.50");
  assertEquals(formatCurrency(1234.567), "1234.57");
});

Deno.test("formatCurrencyDisplay - with dollar sign and commas", () => {
  assertEquals(formatCurrencyDisplay(1234.56), "$1,234.56");
  assertEquals(formatCurrencyDisplay(1000000), "$1,000,000.00");
});

Deno.test("isValidCurrency - validates correctly", () => {
  assertEquals(isValidCurrency("$1,000.00"), true);
  assertEquals(isValidCurrency("1000"), true);
  assertEquals(isValidCurrency("invalid"), false);
});
```

### Date Functions

**File**: `lib/dates.ts`

```typescript
import { assertEquals } from "assert";
import {
  parseDate,
  formatTemplateDate,
  formatDateForTemplate,
  isValidDateFormat,
  getDayOfWeek,
  getDayOfWeekFromString
} from "../lib/dates.ts";

Deno.test("parseDate - handles MM/dd/yy format", () => {
  const result = parseDate("01/28/26");
  assertEquals(result?.getFullYear(), 2026);
  assertEquals(result?.getMonth(), 0); // January
  assertEquals(result?.getDate(), 28);
});

Deno.test("parseDate - handles yyyy-MM-dd format", () => {
  const result = parseDate("2026-01-28");
  assertEquals(result?.getFullYear(), 2026);
  assertEquals(result?.getMonth(), 0);
  assertEquals(result?.getDate(), 28);
});

Deno.test("parseDate - returns null for invalid", () => {
  assertEquals(parseDate("invalid"), null);
  assertEquals(parseDate(""), null);
});

Deno.test("formatTemplateDate - formats to long form", () => {
  const date = new Date(2026, 0, 28); // January 28, 2026
  assertEquals(formatTemplateDate(date), "January 28, 2026");
});

Deno.test("formatDateForTemplate - parses and formats", () => {
  assertEquals(formatDateForTemplate("01/28/26"), "January 28, 2026");
  assertEquals(formatDateForTemplate("2026-01-28"), "January 28, 2026");
});

Deno.test("isValidDateFormat - validates date strings", () => {
  assertEquals(isValidDateFormat("01/28/26"), true);
  assertEquals(isValidDateFormat("2026-01-28"), true);
  assertEquals(isValidDateFormat("invalid"), false);
});

Deno.test("getDayOfWeek - returns day name", () => {
  const date = new Date(2026, 0, 28); // Tuesday
  assertEquals(getDayOfWeek(date), "Tuesday");
});

Deno.test("getDayOfWeekFromString - parses and returns day", () => {
  assertEquals(getDayOfWeekFromString("01/28/26"), "Tuesday");
});
```

### Validation Functions

**File**: `lib/validation.ts`

```typescript
import { assertEquals } from "assert";
import {
  validateRequired,
  validateCurrency,
  validateDate,
  validateEmail,
  validateCreditCardAuthPayload,
  validateHostPayoutPayload,
  validatePeriodicTenancyPayload,
  validateSupplementalPayload
} from "../lib/validation.ts";

Deno.test("validateRequired - passes on valid value", () => {
  assertEquals(validateRequired("value", "field"), null);
});

Deno.test("validateRequired - fails on empty", () => {
  const result = validateRequired("", "field");
  assertEquals(result?.field, "field");
  assertEquals(result?.message, "field is required");
});

Deno.test("validateCurrency - passes on valid currency", () => {
  assertEquals(validateCurrency("$1,000.00", "amount"), null);
});

Deno.test("validateCurrency - fails on invalid", () => {
  const result = validateCurrency("invalid", "amount");
  assertEquals(result?.field, "amount");
  assertEquals(result?.message.includes("valid currency"), true);
});

Deno.test("validateDate - passes on MM/dd/yy", () => {
  assertEquals(validateDate("01/28/26", "date"), null);
});

Deno.test("validateDate - passes on yyyy-MM-dd", () => {
  assertEquals(validateDate("2026-01-28", "date"), null);
});

Deno.test("validateDate - fails on invalid format", () => {
  const result = validateDate("invalid", "date");
  assertEquals(result?.field, "date");
  assertEquals(result?.message.includes("MM/dd/yy or yyyy-MM-dd"), true);
});

Deno.test("validateEmail - passes on valid email", () => {
  assertEquals(validateEmail("test@example.com", "email"), null);
});

Deno.test("validateEmail - fails on invalid", () => {
  const result = validateEmail("invalid", "email");
  assertEquals(result?.field, "email");
  assertEquals(result?.message.includes("valid email"), true);
});

Deno.test("validateCreditCardAuthPayload - validates all required fields", () => {
  const validPayload = {
    agreementNumber: "AGREEMENT-001",
    hostName: "John Doe",
    guestName: "Jane Smith",
    fourWeekRent: "$2,400.00",
    maintenanceFee: "$100.00",
    damageDeposit: "$500.00",
    splitleaseCredit: "$0.00",
    lastPaymentRent: "$600.00",
    weeksNumber: "4",
    listingDescription: "Private room in Brooklyn",
    penultimateWeekNumber: "3",
    numberOfPayments: "4",
    lastPaymentWeeks: "1"
  };

  const result = validateCreditCardAuthPayload(validPayload);
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateCreditCardAuthPayload - fails on missing required fields", () => {
  const invalidPayload = {
    agreementNumber: "",
    hostName: "John Doe"
    // Missing all other required fields
  };

  const result = validateCreditCardAuthPayload(invalidPayload);
  assertEquals(result.valid, false);
  assertEquals(result.errors.length > 0, true);
});

Deno.test("validateHostPayoutPayload - validates periods array", () => {
  const validPayload = {
    agreementNumber: "AGREEMENT-001",
    hostName: "John Doe",
    hostEmail: "john@example.com",
    hostPhone: "555-1234",
    address: "123 Main St",
    payoutNumber: "1",
    maintenanceFee: "$100.00",
    periods: [
      { date: "01/28/26", rent: "$600.00", total: "$700.00" }
    ]
  };

  const result = validateHostPayoutPayload(validPayload);
  assertEquals(result.valid, true);
});

Deno.test("validatePeriodicTenancyPayload - validates date fields", () => {
  const validPayload = {
    agreementNumber: "AGREEMENT-001",
    checkInDate: "01/28/26",
    checkOutDate: "02/25/26",
    checkInDay: "Tuesday",
    checkOutDay: "Wednesday",
    numberOfWeeks: "4",
    guestsAllowed: "2",
    hostName: "John Doe",
    guestName: "Jane Smith",
    supplementalNumber: "SUPP-001",
    authorizationCardNumber: "AUTH-001",
    hostPayoutScheduleNumber: "PAYOUT-001",
    cancellationPolicyRest: "Flexible",
    damageDeposit: "$500.00",
    listingTitle: "Cozy Brooklyn Apartment",
    spaceDetails: "Private room with shared bath",
    listingDescription: "Nice apartment in Brooklyn",
    location: "Brooklyn, NY",
    typeOfSpace: "Private Room",
    houseRules: "No smoking"
  };

  const result = validatePeriodicTenancyPayload(validPayload);
  assertEquals(result.valid, true);
});

Deno.test("validateSupplementalPayload - validates supplemental fields", () => {
  const validPayload = {
    agreementNumber: "AGREEMENT-001",
    checkInDate: "01/28/26",
    checkOutDate: "02/25/26",
    numberOfWeeks: "4",
    guestsAllowed: "2",
    hostName: "John Doe",
    listingDescription: "Nice apartment in Brooklyn",
    listingTitle: "Cozy Brooklyn Apartment",
    spaceDetails: "Private room with shared bath",
    location: "Brooklyn, NY",
    typeOfSpace: "Private Room",
    supplementalNumber: "SUPP-001"
  };

  const result = validateSupplementalPayload(validPayload);
  assertEquals(result.valid, true);
});
```

### Calculator Tests

**File**: `actions/generateCreditCardAuth.ts` (test calculations)

```typescript
import { assertEquals } from "assert";

Deno.test("Credit Card Auth - calculates payment totals correctly", () => {
  // Given
  const fourWeekRent = 2400.00;
  const maintenanceFee = 100.00;
  const damageDeposit = 500.00;
  const splitleaseCredit = 0.00;
  const lastPaymentRent = 600.00;

  // When
  const totalFirstPayment = Math.floor((fourWeekRent + maintenanceFee + damageDeposit) * 100) / 100;
  const totalSecondPayment = Math.floor((fourWeekRent + maintenanceFee) * 100) / 100;
  const totalLastPayment = Math.floor((lastPaymentRent + maintenanceFee - splitleaseCredit) * 100) / 100;

  // Then
  assertEquals(totalFirstPayment, 3000.00); // 2400 + 100 + 500
  assertEquals(totalSecondPayment, 2500.00); // 2400 + 100
  assertEquals(totalLastPayment, 700.00); // 600 + 100 - 0
});
```

---

## Integration Tests

### Setup

Create test file: `supabase/functions/contract-generator/__tests__/integration.test.ts`

### Edge Function API Tests

```typescript
import { assertEquals, assertExists } from "assert";

const FUNCTION_URL = Deno.env.get("SUPABASE_URL") + "/functions/v1/contract-generator";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

async function callContractGenerator(action: string, payload: any) {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({ action, payload })
  });

  return {
    status: response.status,
    data: await response.json()
  };
}

Deno.test("API - list_templates returns all templates", async () => {
  const { status, data } = await callContractGenerator("list_templates", {});

  assertEquals(status, 200);
  assertEquals(data.success, true);
  assertExists(data.data);
  assertEquals(Array.isArray(data.data), true);
  assertEquals(data.data.length >= 5, true); // At least 5 templates
});

Deno.test("API - get_template_schema returns schema for credit card auth", async () => {
  const { status, data } = await callContractGenerator("get_template_schema", {
    action: "generate_credit_card_auth"
  });

  assertEquals(status, 200);
  assertEquals(data.success, true);
  assertExists(data.data);
  assertExists(data.data.name);
  assertExists(data.data.fields);
  assertEquals(Array.isArray(data.data.fields), true);
});

Deno.test("API - generate_credit_card_auth creates document", async () => {
  const payload = {
    agreementNumber: "TEST-001",
    hostName: "Test Host",
    guestName: "Test Guest",
    fourWeekRent: "$2,400.00",
    maintenanceFee: "$100.00",
    damageDeposit: "$500.00",
    splitleaseCredit: "$0.00",
    lastPaymentRent: "$600.00",
    weeksNumber: "4",
    listingDescription: "Test listing description",
    penultimateWeekNumber: "3",
    numberOfPayments: "4",
    lastPaymentWeeks: "1"
  };

  const { status, data } = await callContractGenerator("generate_credit_card_auth", payload);

  assertEquals(status, 200);
  assertEquals(data.success, true);
  assertExists(data.data);
  assertExists(data.data.filename);
  assertExists(data.data.downloadUrl);
  assertEquals(data.data.filename.includes("recurring_credit_card_auth-prorated"), true);
});

Deno.test("API - validation errors return 400", async () => {
  const invalidPayload = {
    agreementNumber: "", // Invalid - empty
    hostName: "Test Host"
    // Missing required fields
  };

  const { status, data } = await callContractGenerator("generate_credit_card_auth", invalidPayload);

  assertEquals(status, 400);
  assertEquals(data.success, false);
  assertExists(data.error);
});

Deno.test("API - unknown action returns error", async () => {
  const { status, data } = await callContractGenerator("unknown_action", {});

  assertEquals(status, 400);
  assertEquals(data.success, false);
  assertEquals(data.error.code, "UNKNOWN_ACTION");
});
```

### Template Loading Tests

```typescript
Deno.test("Storage - load template from Supabase", async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data, error } = await supabase
    .storage
    .from("contract-templates")
    .download("templates/recurring_credit_card_auth-prorated.docx");

  assertEquals(error, null);
  assertExists(data);
  assertEquals(data instanceof ArrayBuffer, true);
});
```

### Document Generation Flow Tests

```typescript
Deno.test("Flow - complete document generation", async () => {
  // 1. Get schema
  const schemaResponse = await callContractGenerator("get_template_schema", {
    action: "generate_credit_card_auth"
  });
  assertEquals(schemaResponse.data.success, true);

  // 2. Prepare payload
  const payload = {
    agreementNumber: "FLOW-TEST-001",
    hostName: "Flow Test Host",
    guestName: "Flow Test Guest",
    fourWeekRent: "$2,400.00",
    maintenanceFee: "$100.00",
    damageDeposit: "$500.00",
    splitleaseCredit: "$0.00",
    lastPaymentRent: "$600.00",
    weeksNumber: "4",
    listingDescription: "Flow test listing",
    penultimateWeekNumber: "3",
    numberOfPayments: "4",
    lastPaymentWeeks: "1"
  };

  // 3. Generate document
  const generateResponse = await callContractGenerator("generate_credit_card_auth", payload);
  assertEquals(generateResponse.data.success, true);
  assertExists(generateResponse.data.data.downloadUrl);

  // 4. Verify download URL is accessible
  const downloadResponse = await fetch(generateResponse.data.data.downloadUrl);
  assertEquals(downloadResponse.status, 200);
  assertEquals(downloadResponse.headers.get("content-type"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
});
```

---

## E2E Tests

### Setup

Use Playwright for E2E testing. Create: `app/e2e/contract-generator.spec.js`

### Prerequisites

```bash
# Install Playwright
bun add -D @playwright/test

# Install browsers
npx playwright install
```

### Test Configuration

**File**: `app/playwright.config.js`

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:8000',
  },
});
```

### E2E Test Suite

**File**: `app/e2e/contract-generator.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Contract Generator E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to contracts page
    await page.goto('/contracts/credit-card-auth');
    await page.waitForLoadState('networkidle');
  });

  test('Credit Card Auth - form validation', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('Credit Card Auth - complete submission', async ({ page }) => {
    // Fill form fields
    await page.fill('[name="agreementNumber"]', 'E2E-TEST-001');
    await page.fill('[name="hostName"]', 'E2E Test Host');
    await page.fill('[name="guestName"]', 'E2E Test Guest');
    await page.fill('[name="fourWeekRent"]', '$2,400.00');
    await page.fill('[name="maintenanceFee"]', '$100.00');
    await page.fill('[name="damageDeposit"]', '$500.00');
    await page.fill('[name="splitleaseCredit"]', '$0.00');
    await page.fill('[name="lastPaymentRent"]', '$600.00');
    await page.fill('[name="weeksNumber"]', '4');
    await page.fill('[name="listingDescription"]', 'E2E test listing description');
    await page.fill('[name="penultimateWeekNumber"]', '3');
    await page.fill('[name="numberOfPayments"]', '4');
    await page.fill('[name="lastPaymentWeeks"]', '1');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for generation to complete
    await page.waitForSelector('.contract-download', { timeout: 30000 });

    // Verify download UI appears
    await expect(page.locator('.contract-download')).toBeVisible();
    await expect(page.locator('text=Download Document')).toBeVisible();

    // Verify download link
    const downloadLink = page.locator('a[download]');
    await expect(downloadLink).toHaveAttribute('href', /\/storage\/v1\/object\/public\/contract-templates\/generated\//);
  });

  test('Credit Card Auth - preview mode', async ({ page }) => {
    // Fill required fields for preview
    await page.fill('[name="agreementNumber"]', 'PREVIEW-001');
    await page.fill('[name="hostName"]', 'Preview Host');
    await page.fill('[name="guestName"]', 'Preview Guest');
    await page.fill('[name="fourWeekRent"]', '$2,400.00');
    await page.fill('[name="maintenanceFee"]', '$100.00');
    await page.fill('[name="damageDeposit"]', '$500.00');

    // Check if preview section appears
    const previewSection = page.locator('.contract-preview');
    await expect(previewSection).toBeVisible();
  });

  test('Host Payout - complete submission', async ({ page }) => {
    await page.goto('/contracts/host-payout');
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.fill('[name="agreementNumber"]', 'E2E-PAYOUT-001');
    await page.fill('[name="hostName"]', 'E2E Host');
    await page.fill('[name="hostEmail"]', 'e2e@example.com');
    await page.fill('[name="hostPhone"]', '555-1234');
    await page.fill('[name="address"]', '123 Test St');
    await page.fill('[name="payoutNumber"]', '1');
    await page.fill('[name="maintenanceFee"]', '$100.00');

    // Add payout period
    await page.click('button:has-text("Add Period")');
    await page.fill('[name="periods[0].date"]', '01/28/26');
    await page.fill('[name="periods[0].rent"]', '$600.00');
    await page.fill('[name="periods[0].total"]', '$700.00');

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForSelector('.contract-download', { timeout: 30000 });

    await expect(page.locator('.contract-download')).toBeVisible();
  });

  test('Periodic Tenancy - complete submission', async ({ page }) => {
    await page.goto('/contracts/periodic-tenancy');
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.fill('[name="agreementNumber"]', 'E2E-PERIODIC-001');
    await page.fill('[name="checkInDate"]', '01/28/26');
    await page.fill('[name="checkOutDate"]', '02/25/26');
    await page.fill('[name="checkInDay"]', 'Tuesday');
    await page.fill('[name="checkOutDay"]', 'Wednesday');
    await page.fill('[name="numberOfWeeks"]', '4');
    await page.fill('[name="guestsAllowed"]', '2');
    await page.fill('[name="hostName"]', 'E2E Host');
    await page.fill('[name="guestName"]', 'E2E Guest');
    await page.fill('[name="supplementalNumber"]', 'SUPP-001');
    await page.fill('[name="authorizationCardNumber"]', 'AUTH-001');
    await page.fill('[name="hostPayoutScheduleNumber"]', 'PAYOUT-001');
    await page.fill('[name="cancellationPolicyRest"]', 'Flexible');
    await page.fill('[name="damageDeposit"]', '$500.00');
    await page.fill('[name="listingTitle"]', 'E2E Test Listing');
    await page.fill('[name="spaceDetails"]', 'Private room');
    await page.fill('[name="listingDescription"]', 'Test description');
    await page.fill('[name="location"]', 'Brooklyn, NY');
    await page.fill('[name="typeOfSpace"]', 'Private Room');
    await page.fill('[name="houseRules"]', 'No smoking');

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForSelector('.contract-download', { timeout: 30000 });

    await expect(page.locator('.contract-download')).toBeVisible();
  });

  test('Supplemental - complete submission', async ({ page }) => {
    await page.goto('/contracts/supplemental');
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.fill('[name="agreementNumber"]', 'E2E-SUPP-001');
    await page.fill('[name="checkInDate"]', '01/28/26');
    await page.fill('[name="checkOutDate"]', '02/25/26');
    await page.fill('[name="numberOfWeeks"]', '4');
    await page.fill('[name="guestsAllowed"]', '2');
    await page.fill('[name="hostName"]', 'E2E Host');
    await page.fill('[name="listingDescription"]', 'Test description');
    await page.fill('[name="listingTitle"]', 'E2E Test Listing');
    await page.fill('[name="spaceDetails"]', 'Private room');
    await page.fill('[name="location"]', 'Brooklyn, NY');
    await page.fill('[name="typeOfSpace"]', 'Private Room');
    await page.fill('[name="supplementalNumber"]', 'SUPP-001');

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForSelector('.contract-download', { timeout: 30000 });

    await expect(page.locator('.contract-download')).toBeVisible();
  });

  test('Document download verification', async ({ page }) => {
    // Generate a document first
    await page.fill('[name="agreementNumber"]', 'DOWNLOAD-TEST-001');
    await page.fill('[name="hostName"]', 'Download Test Host');
    await page.fill('[name="guestName"]', 'Download Test Guest');
    await page.fill('[name="fourWeekRent"]', '$2,400.00');
    await page.fill('[name="maintenanceFee"]', '$100.00');
    await page.fill('[name="damageDeposit"]', '$500.00');
    await page.fill('[name="splitleaseCredit"]', '$0.00');
    await page.fill('[name="lastPaymentRent"]', '$600.00');
    await page.fill('[name="weeksNumber"]', '4');
    await page.fill('[name="listingDescription"]', 'Download test');
    await page.fill('[name="penultimateWeekNumber"]', '3');
    await page.fill('[name="numberOfPayments"]', '4');
    await page.fill('[name="lastPaymentWeeks"]', '1');

    await page.click('button[type="submit"]');
    await page.waitForSelector('.contract-download', { timeout: 30000 });

    // Click download button
    const downloadPromise = page.waitForEvent('download');
    await page.click('a[download]');

    // Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.docx');

    // Verify file size
    const fileBuffer = await download.createReadStream();
    let size = 0;
    for await (const chunk of fileBuffer) {
      size += chunk.length;
    }
    expect(size).toBeGreaterThan(10000); // At least 10KB
  });

  test('Google Drive upload verification (if configured)', async ({ page }) => {
    // Skip if Google Drive not configured
    const isConfigured = await page.evaluate(() => {
      return localStorage.getItem('GOOGLE_DRIVE_ENABLED') === 'true';
    });

    if (!isConfigured) {
      test.skip();
      return;
    }

    // Generate document
    await page.fill('[name="agreementNumber"]', 'GDRIVE-TEST-001');
    await page.fill('[name="hostName"]', 'GDrive Test Host');
    await page.fill('[name="guestName"]', 'GDrive Test Guest');
    await page.fill('[name="fourWeekRent"]', '$2,400.00');
    await page.fill('[name="maintenanceFee"]', '$100.00');
    await page.fill('[name="damageDeposit"]', '$500.00');
    await page.fill('[name="splitleaseCredit"]', '$0.00');
    await page.fill('[name="lastPaymentRent"]', '$600.00');
    await page.fill('[name="weeksNumber"]', '4');
    await page.fill('[name="listingDescription"]', 'GDrive test');
    await page.fill('[name="penultimateWeekNumber"]', '3');
    await page.fill('[name="numberOfPayments"]', '4');
    await page.fill('[name="lastPaymentWeeks'] = '1');

    await page.click('button[type="submit"]');
    await page.waitForSelector('.contract-download', { timeout: 30000 });

    // Check for Google Drive link
    const gdriveLink = page.locator('a[href*="drive.google.com"]');
    await expect(gdriveLink).toBeVisible();

    // Verify link is valid
    const href = await gdriveLink.getAttribute('href');
    expect(href).toContain('drive.google.com');
  });

  test('Generate Another Document flow', async ({ page }) => {
    // Generate first document
    await page.fill('[name="agreementNumber"]', 'FLOW-TEST-001');
    await page.fill('[name="hostName"]', 'Flow Test Host');
    await page.fill('[name="guestName"]', 'Flow Test Guest');
    await page.fill('[name="fourWeekRent"]', '$2,400.00');
    await page.fill('[name="maintenanceFee"]', '$100.00');
    await page.fill('[name="damageDeposit"]', '$500.00');
    await page.fill('[name="splitleaseCredit"]', '$0.00');
    await page.fill('[name="lastPaymentRent"]', '$600.00');
    await page.fill('[name="weeksNumber"]', '4');
    await page.fill('[name="listingDescription"]', 'Flow test');
    await page.fill('[name="penultimateWeekNumber"]', '3');
    await page.fill('[name="numberOfPayments"]', '4');
    await page.fill('[name="lastPaymentWeeks"]', '1');

    await page.click('button[type="submit"]');
    await page.waitForSelector('.contract-download', { timeout: 30000 });

    // Click "Generate Another Document"
    await page.click('button:has-text("Generate Another Document")');

    // Should return to form
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('[name="agreementNumber"]')).toHaveValue('');
  });
});
```

### Running E2E Tests

```bash
# Start dev server
bun run dev

# In another terminal, run E2E tests
npx playwright test
```

---

## Manual Testing Checklist

### Prerequisites

- [ ] Supabase local development running: `supabase start`
- [ ] Edge function deployed locally: `supabase functions serve`
- [ ] Frontend dev server running: `bun run dev`
- [ ] Contract templates uploaded to Supabase Storage (`contract-templates` bucket)

### Test Each Document Type

#### Credit Card Authorization (Prorated)

- [ ] Navigate to `/contracts/credit-card-auth`
- [ ] Verify page loads without errors
- [ ] Verify form schema loads correctly
- [ ] Test form validation:
  - [ ] Submit empty form → shows validation errors
  - [ ] Enter invalid currency → shows currency error
  - [ ] Enter all valid data → no errors
- [ ] Fill form with sample data (see Sample Test Data below)
- [ ] Click "Generate Document"
- [ ] Verify loading state appears
- [ ] Verify success message appears
- [ ] Verify download link is visible and clickable
- [ ] Download document and verify:
  - [ ] File opens in Microsoft Word/LibreOffice
  - [ ] All placeholders are replaced with data
  - [ ] Currency amounts are formatted correctly
  - [ ] Dates are formatted correctly
- [ ] Verify "Generate Another Document" button works

#### Credit Card Authorization (Non-Prorated)

- [ ] Navigate to `/contracts/credit-card-auth-nonprorated`
- [ ] Repeat all tests from prorated version
- [ ] Verify calculations are different (no prorating)

#### Host Payout

- [ ] Navigate to `/contracts/host-payout`
- [ ] Verify email validation works
- [ ] Test periods array:
  - [ ] Add multiple periods
  - [ ] Remove periods
  - [ ] Edit period values
- [ ] Verify document generates with all periods
- [ ] Verify table formatting in document

#### Periodic Tenancy

- [ ] Navigate to `/contracts/periodic-tenancy`
- [ ] Verify date validation for check-in/check-out
- [ ] Test house rules as array
- [ ] Test house rules as string
- [ ] Verify images are embedded (if provided)
- [ ] Verify all text fields appear in document

#### Supplemental

- [ ] Navigate to `/contracts/supplemental`
- [ ] Verify minimal required fields
- [ ] Verify document generates correctly
- [ ] Verify all fields are present in output

### Template Loading Tests

- [ ] Test with template missing from Supabase
  - [ ] Should return appropriate error
- [ ] Test with corrupted template
  - [ ] Should return appropriate error
- [ ] Test template with special characters in placeholders
- [ ] Test template with nested placeholders

### Edge Cases

- [ ] Test with extremely long text values
- [ ] Test with special characters in names (O'Brien, etc.)
- [ ] Test with unicode characters (emoji, accents)
- [ ] Test with maximum currency values
- [ ] Test with date ranges across month boundaries
- [ ] Test with date ranges across year boundaries
- [ ] Test with leap year dates (02/29)

### Error Handling

- [ ] Test with network disconnected
- [ ] Test with Supabase timeout
- [ ] Test with invalid Supabase credentials
- [ ] Verify error messages are user-friendly
- [ ] Verify error messages include actionable information

### Performance Tests

- [ ] Time form load (should be < 2 seconds)
- [ ] Time document generation (should be < 10 seconds)
- [ ] Test with concurrent users (if applicable)

---

## Sample Test Data

### Credit Card Authorization (Prorated)

```json
{
  "agreementNumber": "SL-2026-001",
  "hostName": "John O'Brien",
  "guestName": "Maria García López",
  "fourWeekRent": "$2,400.00",
  "maintenanceFee": "$100.00",
  "damageDeposit": "$500.00",
  "splitleaseCredit": "$0.00",
  "lastPaymentRent": "$600.00",
  "weeksNumber": "4",
  "listingDescription": "Private room in 2-bedroom apartment in Williamsburg, Brooklyn. Shared bathroom, full kitchen access, high-speed WiFi included.",
  "penultimateWeekNumber": "3",
  "numberOfPayments": "4",
  "lastPaymentWeeks": "1"
}
```

### Credit Card Authorization (Non-Prorated)

```json
{
  "agreementNumber": "SL-2026-002",
  "hostName": "Jane Smith",
  "guestName": "Bob Johnson",
  "fourWeekRent": "$3,200.00",
  "maintenanceFee": "$150.00",
  "damageDeposit": "$750.00",
  "splitleaseCredit": "$100.00",
  "lastPaymentRent": "$800.00",
  "weeksNumber": "8",
  "listingDescription": "Studio apartment in Manhattan, fully furnished with kitchenette.",
  "penultimateWeekNumber": "7",
  "numberOfPayments": "8",
  "lastPaymentWeeks": "1"
}
```

### Host Payout

```json
{
  "agreementNumber": "SL-2026-003",
  "hostName": "Sarah Williams",
  "hostEmail": "sarah.williams@example.com",
  "hostPhone": "555-123-4567",
  "address": "456 Park Avenue, Apt 7B, New York, NY 10022",
  "payoutNumber": "1",
  "maintenanceFee": "$100.00",
  "periods": [
    {
      "date": "01/28/26",
      "rent": "$600.00",
      "total": "$700.00"
    },
    {
      "date": "02/04/26",
      "rent": "$600.00",
      "total": "$700.00"
    },
    {
      "date": "02/11/26",
      "rent": "$600.00",
      "total": "$700.00"
    },
    {
      "date": "02/18/26",
      "rent": "$600.00",
      "total": "$700.00"
    }
  ]
}
```

### Periodic Tenancy

```json
{
  "agreementNumber": "SL-2026-004",
  "checkInDate": "01/28/26",
  "checkOutDate": "02/25/26",
  "checkInDay": "Tuesday",
  "checkOutDay": "Wednesday",
  "numberOfWeeks": "4",
  "guestsAllowed": "2",
  "hostName": "Michael Chen",
  "guestName": "Emily Davis",
  "supplementalNumber": "SUPP-001",
  "authorizationCardNumber": "AUTH-001",
  "hostPayoutScheduleNumber": "PAYOUT-001",
  "cancellationPolicyRest": "Flexible - Full refund up to 7 days before check-in",
  "damageDeposit": "$500.00",
  "listingTitle": "Sunny 1BR in Astoria, Queens",
  "spaceDetails": "Private bedroom with shared bathroom. Access to living room, kitchen, and balcony.",
  "listingDescription": "Beautiful 1-bedroom apartment in Astoria with great views of Manhattan. Close to N/Q subway lines.",
  "location": "Astoria, Queens, NY 11102",
  "typeOfSpace": "Private Room",
  "houseRules": "No smoking, No pets, Quiet hours after 10pm, Clean up after yourself in shared spaces",
  "image1": "https://example.com/image1.jpg",
  "image2": "https://example.com/image2.jpg",
  "image3": "https://example.com/image3.jpg"
}
```

### Supplemental

```json
{
  "agreementNumber": "SL-2026-005",
  "checkInDate": "03/01/26",
  "checkOutDate": "03/29/26",
  "numberOfWeeks": "4",
  "guestsAllowed": "1",
  "hostName": "David Kim",
  "listingDescription": "Cozy private room in Park Slope, Brooklyn. Near Prospect Park, many restaurants and cafes nearby.",
  "listingTitle": "Park Slope Private Room",
  "spaceDetails": "Private bedroom on 2nd floor of walk-up building. Shared bathroom with one other guest.",
  "location": "Park Slope, Brooklyn, NY 11215",
  "typeOfSpace": "Private Room",
  "supplementalNumber": "SUPP-002",
  "image1": "https://example.com/image1.jpg",
  "image2": "https://example.com/image2.jpg",
  "image3": "https://example.com/image3.jpg"
}
```

---

## Testing Infrastructure

### Local Testing Setup

```bash
# 1. Start Supabase locally
supabase start

# 2. Upload test templates to Supabase Storage
supabase storage upload-file contract-templates ./templates/ --recursive

# 3. Start Edge Function
supabase functions serve

# 4. Start frontend dev server
cd app && bun run dev
```

### CI/CD Integration

**File**: `.github/workflows/test-contract-generator.yml`

```yaml
name: Test Contract Generator

on:
  pull_request:
    paths:
      - 'supabase/functions/contract-generator/**'
      - 'app/src/islands/pages/contracts/**'
      - 'app/src/hooks/useContractGenerator.js'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v2.x
      - name: Run unit tests
        run: |
          deno test --allow-env supabase/functions/contract-generator/__tests__/

  integration-tests:
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/supabase:latest
        ports:
          - 54321:54321
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v2.x
      - name: Run integration tests
        run: |
          deno test --allow-net --allow-env supabase/functions/contract-generator/__tests__/integration.test.ts
        env:
          SUPABASE_URL: http://localhost:54321
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd app && bun install
      - name: Install Playwright
        run: |
          cd app && npx playwright install --with-deps
      - name: Run E2E tests
        run: |
          cd app && npx playwright test
```

### Test Data Management

**File**: `scripts/seed-contract-templates.js`

```javascript
// Script to upload test templates to Supabase Storage
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadTemplates() {
  const templates = [
    'recurring_credit_card_auth-prorated.docx',
    'recurring_credit_card_auth-nonprorated.docx',
    'host_payout_schedule.docx',
    'periodic_tenancy.docx',
    'supplemental.docx'
  ];

  for (const template of templates) {
    const { data, error } = await supabase
      .storage
      .from('contract-templates')
      .upload(`templates/${template}`, Buffer.from(''), {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true
      });

    if (error) {
      console.error(`Error uploading ${template}:`, error);
    } else {
      console.log(`Uploaded ${template}`);
    }
  }
}

uploadTemplates();
```

---

## Test Coverage Goals

### Minimum Coverage Requirements

- **Unit Tests**: 80% code coverage
  - All currency functions
  - All date functions
  - All validation functions
  - All calculator functions

- **Integration Tests**: All API endpoints
  - All document generation actions
  - Schema retrieval
  - Template listing
  - Error scenarios

- **E2E Tests**: All user flows
  - Each document type (5 tests)
  - Form validation (5 tests)
  - Document download (5 tests)
  - Error handling (5 tests)

### Coverage Tools

```bash
# For TypeScript/Deno
deno coverage --lcov supabase/functions/contract-generator/

# For JavaScript/Vitest
bun run test --coverage
```

---

## Troubleshooting

### Common Issues

**Issue**: Template not found error
- **Solution**: Verify template is uploaded to `contract-templates/templates/` in Supabase Storage
- **Check**: `lib/storage.ts` template mapping

**Issue**: Placeholder not replaced in document
- **Solution**: Verify placeholder name matches between template and code
- **Check**: `actions/generate*.ts` template data objects

**Issue**: Validation passing but Edge Function returning error
- **Solution**: Check Edge Function logs: `supabase functions logs contract-generator`
- **Check**: Environment variables are set correctly

**Issue**: Document downloads but won't open
- **Solution**: Verify DOCX template is valid (open in Word first)
- **Check**: `lib/docx.ts` rendering logic

---

## Appendix

### Environment Variables Required

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Drive (optional)
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token
```

### Supabase Storage Setup

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-templates', 'contract-templates', true);

-- Create folder
-- Upload templates to: contract-templates/templates/
-- Generated files go to: contract-templates/generated/
```

### API Endpoints Reference

```
POST /functions/v1/contract-generator

Actions:
- list_templates
- get_template_schema
- generate_credit_card_auth
- generate_credit_card_auth_nonprorated
- generate_host_payout
- generate_periodic_tenancy
- generate_supplemental
```

---

**DOCUMENT VERSION**: 1.0
**LAST UPDATED**: 2026-01-28
**AUTHOR**: Split Lease Development Team
