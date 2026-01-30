# Error Handling Patterns

Complete guide to error handling in the Split Lease API, including error types, status codes, and best practices.

---

## Overview

Split Lease follows a "No Fallback" philosophy - all errors fail fast without fallback logic or default values. This ensures transparency and helps identify issues quickly.

**Key Principles**:
- Fail fast - don't hide errors
- Return actual error messages - no generic fallbacks
- Log full error details for debugging
- Provide actionable error messages to clients
- Never add fallback mechanisms

---

## HTTP Status Codes

### Success Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 OK | Request succeeded | All successful operations |
| 201 Created | Resource created | POST operations that create resources |
| 204 No Content | Success with no response body | DELETE operations |

---

### Client Error Codes (4xx)

| Code | Meaning | Usage |
|------|---------|-------|
| 400 Bad Request | Invalid input | Validation errors, malformed data |
| 401 Unauthorized | Authentication required | Missing or invalid token |
| 403 Forbidden | Insufficient permissions | Authenticated but not authorized |
| 404 Not Found | Resource not found | Invalid IDs, missing resources |
| 409 Conflict | Database constraint violation | Duplicate keys, foreign key violations |

---

### Server Error Codes (5xx)

| Code | Meaning | Usage |
|------|---------|-------|
| 500 Internal Server Error | Server error | Unhandled exceptions, database errors |
| 502 Bad Gateway | Upstream error | Bubble API failures |
| 503 Service Unavailable | Service temporarily unavailable | Maintenance, rate limiting |

---

## Error Types

### ValidationError

**Status**: 400 Bad Request
**When**: Input validation fails

**Error Response**:
```json
{
  "success": false,
  "error": "Email is required"
}
```

**Common Causes**:
- Missing required fields
- Invalid email format
- Invalid phone number format
- Password too short
- Date range invalid

**Example**:
```typescript
import { ValidationError } from 'supabase/functions/_shared/errors.ts';

if (!email) {
  throw new ValidationError('Email is required');
}

if (!validateEmail(email)) {
  throw new ValidationError('Invalid email format');
}

if (password.length < 4) {
  throw new ValidationError('Password must be at least 4 characters long');
}

if (password !== retype) {
  throw new ValidationError('The two passwords do not match!');
}
```

---

### AuthenticationError

**Status**: 401 Unauthorized
**When**: Authentication fails or is missing

**Error Response**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Common Causes**:
- Missing authorization header
- Invalid or expired token
- Failed login attempt
- Invalid credentials

**Example**:
```typescript
import { AuthenticationError } from 'supabase/functions/_shared/errors.ts';

if (!user) {
  throw new AuthenticationError('Authentication required');
}

if (tokenExpired) {
  throw new AuthenticationError('Token has expired. Please log in again.');
}
```

---

### BubbleApiError

**Status**: Variable (400-500)
**When**: Bubble API call fails

**Error Response**:
```json
{
  "success": false,
  "error": "Bubble API request failed: Invalid parameters"
}
```

**Common Causes**:
- Invalid Bubble API parameters
- Bubble API rate limiting
- Bubble API downtime
- Network issues

**Example**:
```typescript
import { BubbleApiError } from 'supabase/functions/_shared/errors.ts';

try {
  const response = await fetch(`${bubbleBaseUrl}/wf/workflow`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${bubbleApiKey}` },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new BubbleApiError(
      'Bubble API request failed',
      response.status,
      errorData
    );
  }
} catch (error) {
  if (error instanceof BubbleApiError) {
    console.error('Bubble API error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Response:', error.bubbleResponse);
    throw error;
  }
  throw error;
}
```

---

### SupabaseSyncError

**Status**: 500 Internal Server Error
**When**: Supabase database operation fails

**Error Response**:
```json
{
  "success": false,
  "error": "Database error: Duplicate key value violates unique constraint"
}
```

**Common Causes**:
- Duplicate key violations
- Foreign key constraint violations
- Check constraint violations
- Connection issues

**Example**:
```typescript
import { SupabaseSyncError } from 'supabase/functions/_shared/errors.ts';

try {
  const { data, error } = await supabase
    .from('proposal')
    .insert(proposalData)
    .select()
    .single();

  if (error) {
    throw new SupabaseSyncError('Failed to create proposal', error);
  }

  return data;
} catch (error) {
  if (error instanceof SupabaseSyncError) {
    console.error('Supabase sync error:', error.message);
    console.error('Original error:', error.originalError);
    throw error;
  }
  throw error;
}
```

---

### OpenAIError

**Status**: Variable (400-500)
**When**: OpenAI API call fails

**Error Response**:
```json
{
  "success": false,
  "error": "OpenAI API request failed: Rate limit exceeded"
}
```

**Common Causes**:
- Rate limiting
- Invalid API key
- Model not available
- Prompt too long

**Example**:
```typescript
import { OpenAIError } from 'supabase/functions/_shared/errors.ts';

try {
  const response = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      prompt: prompt
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new OpenAIError(
      'OpenAI API request failed',
      response.status,
      errorData
    );
  }
} catch (error) {
  if (error instanceof OpenAIError) {
    console.error('OpenAI error:', error.message);
    console.error('Status:', error.statusCode);
    throw error;
  }
  throw error;
}
```

---

## Error Response Format

All errors follow the standard response format:

```typescript
interface ErrorResponse {
  success: false;
  error: string;
}
```

**Example**:
```json
{
  "success": false,
  "error": "Detailed error message describing what went wrong"
}
```

**No Generic Fallbacks**:
- ❌ Bad: `"An error occurred"`
- ✅ Good: `"Failed to create proposal: Invalid date range - check-out must be after check-in"`

---

## Error Handling in Edge Functions

### Standard Error Handler

Use the `formatErrorResponse` utility for consistent error responses:

```typescript
import { formatErrorResponse, getStatusCodeFromError } from 'supabase/functions/_shared/errors.ts';

Deno.serve(async (req: Request) => {
  try {
    // ... operation logic
    const result = await doSomething();

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[Operation] Error:', error);

    const errorResponse = formatErrorResponse(error);
    const statusCode = getStatusCodeFromError(error);

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

---

### Error Collection Pattern

Use `ErrorCollector` for consolidating multiple errors:

```typescript
import { createErrorCollector } from 'supabase/functions/_shared/slack.ts';

const collector = createErrorCollector('function-name', 'action-name');

try {
  // Operation 1
  try {
    await operation1();
  } catch (error) {
    collector.add(error, 'Operation 1 failed');
  }

  // Operation 2
  try {
    await operation2();
  } catch (error) {
    collector.add(error, 'Operation 2 failed');
  }

  // Check if any errors occurred
  if (collector.hasErrors()) {
    collector.reportToSlack();
    throw new Error('Operations completed with errors');
  }

} catch (error) {
  collector.add(error, 'Overall operation failed');
  collector.reportToSlack();
  throw error;
}
```

---

## Client-Side Error Handling

### Standard Error Handler

```javascript
async function makeApiRequest(endpoint, action, payload, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, payload })
    });

    const result = await response.json();

    // HTTP error (4xx, 5xx)
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Application error
    if (!result.success) {
      throw new Error(result.error || 'Request failed');
    }

    return result.data;

  } catch (error) {
    // Network error or other exception
    console.error('API request failed:', error);
    throw error;
  }
}
```

---

### Error Display Pattern

```javascript
async function handleProposalCreation(proposalData) {
  try {
    const proposal = await makeApiRequest(
      'proposal',
      'create',
      proposalData,
      localStorage.getItem('access_token')
    );

    console.log('Proposal created:', proposal.proposalId);
    return proposal;

  } catch (error) {
    console.error('Failed to create proposal:', error.message);

    // Show user-friendly error message
    if (error.message.includes('Authentication')) {
      showError('Please log in to create a proposal');
      // Redirect to login
      window.location.href = '/signup-login';
    } else if (error.message.includes('Invalid')) {
      showError('Please check your input and try again');
    } else if (error.message.includes('dates')) {
      showError('Invalid date range. Check-out must be after check-in.');
    } else {
      showError('Failed to create proposal. Please try again.');
    }

    // Log to error tracking service
    logError('proposal_creation_failed', error);

    // Re-throw for further handling if needed
    throw error;
  }
}
```

---

### Retry Logic

```javascript
async function makeApiRequestWithRetry(endpoint, action, payload, token = null, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await makeApiRequest(endpoint, action, payload, token);

    } catch (error) {
      lastError = error;

      // Don't retry on auth errors or validation errors
      if (error.message.includes('Authentication') ||
          error.message.includes('Invalid') ||
          error.message.includes('validation')) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      }
    }
  }

  // All retries failed
  console.error(`Failed after ${maxRetries} attempts:`, lastError.message);
  throw lastError;
}
```

---

## Common Error Scenarios

### Authentication Errors

**Scenario**: User token expired

**Error Response**:
```json
{
  "success": false,
  "error": "Token has expired. Please log in again."
}
```

**Client Handling**:
```javascript
try {
  const result = await makeApiRequest('proposal', 'create', data, token);
} catch (error) {
  if (error.message.includes('expired')) {
    // Clear expired token
    clearAuthToken();

    // Redirect to login with message
    window.location.href = '/signup-login?session=expired';
  }
}
```

---

### Validation Errors

**Scenario**: Invalid date range

**Error Response**:
```json
{
  "success": false,
  "error": "Invalid date range: Check-out date (2026-02-01) must be after check-in date (2026-02-28)"
}
```

**Client Handling**:
```javascript
try {
  const result = await makeApiRequest('proposal', 'create', proposalData, token);
} catch (error) {
  if (error.message.includes('date range')) {
    // Show validation error inline
    showInlineError('checkOutDate', error.message);
    highlightField('checkOutDate');
  }
}
```

---

### Database Constraint Errors

**Scenario**: Duplicate proposal

**Error Response**:
```json
{
  "success": false,
  "error": "Database error: Duplicate key value violates unique constraint 'proposal_listing_guest_dates'"
}
```

**Client Handling**:
```javascript
try {
  const result = await makeApiRequest('proposal', 'create', proposalData, token);
} catch (error) {
  if (error.message.includes('Duplicate key')) {
    // Check if proposal already exists
    const existingProposal = await checkExistingProposal(proposalData);

    if (existingProposal) {
      // Redirect to existing proposal
      window.location.href = `/guest-proposals?proposal=${existingProposal._id}`;
    } else {
      showError('A proposal for these dates already exists.');
    }
  }
}
```

---

### Network Errors

**Scenario**: Connection timeout

**Error Response**:
```javascript
{
  "name": "TypeError",
  "message": "Failed to fetch"
}
```

**Client Handling**:
```javascript
try {
  const result = await makeApiRequest('proposal', 'create', proposalData, token);
} catch (error) {
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    // Network error - show retry option
    showError('Network error. Please check your connection and try again.');
    showRetryButton();
  }
}
```

---

## Error Logging

### Server-Side Logging

```typescript
import { createErrorCollector } from 'supabase/functions/_shared/slack.ts';

Deno.serve(async (req: Request) => {
  const collector = createErrorCollector('function-name', 'action-name');

  try {
    // ... operation logic
    const result = await doSomething();

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    collector.add(error, 'Operation failed');

    // Log to console for debugging
    console.error('[Function Name] Error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    // Report to Slack
    await collector.reportToSlack();

    // Return error response
    const errorResponse = formatErrorResponse(error);
    const statusCode = getStatusCodeFromError(error);

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

---

### Client-Side Logging

```javascript
function logError(context, error) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error(`[${context}] Error:`, error);
  }

  // Send to error tracking service (e.g., Sentry, LogRocket)
  if (window.errorTracker) {
    window.errorTracker.captureException(error, {
      context: context,
      userId: getUserId(),
      timestamp: new Date().toISOString()
    });
  }

  // Send to Slack for critical errors
  if (isCriticalError(error)) {
    sendSlackNotification(`Critical error in ${context}: ${error.message}`);
  }
}

function isCriticalError(error) {
  const criticalKeywords = [
    'authentication',
    'authorization',
    'security',
    'payment',
    'database'
  ];

  return criticalKeywords.some(keyword =>
    error.message.toLowerCase().includes(keyword)
  );
}
```

---

## Error Prevention

### Input Validation

Always validate input before sending to API:

```javascript
function validateProposalData(proposalData) {
  const errors = [];

  // Check required fields
  if (!proposalData.listingId) {
    errors.push('Listing ID is required');
  }

  if (!proposalData.checkInDate) {
    errors.push('Check-in date is required');
  }

  if (!proposalData.checkOutDate) {
    errors.push('Check-out date is required');
  }

  // Validate date range
  if (proposalData.checkInDate && proposalData.checkOutDate) {
    const checkIn = new Date(proposalData.checkInDate);
    const checkOut = new Date(proposalData.checkOutDate);

    if (checkOut <= checkIn) {
      errors.push('Check-out date must be after check-in date');
    }

    if (checkIn < new Date()) {
      errors.push('Check-in date cannot be in the past');
    }
  }

  // Validate selected days
  if (!proposalData.selectedDays || proposalData.selectedDays.length === 0) {
    errors.push('At least one day must be selected');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  return true;
}

// Usage
try {
  validateProposalData(proposalData);
  const proposal = await makeApiRequest('proposal', 'create', proposalData, token);
} catch (error) {
  showError(error.message);
}
```

---

### Type Checking

Use TypeScript for compile-time type checking:

```typescript
interface ProposalCreateRequest {
  listingId: string;
  checkInDate: string;
  checkOutDate: string;
  selectedDays: number[];
  guestMessage?: string;
  rentalApplicationId?: string;
}

function validateProposalData(data: any): data is ProposalCreateRequest {
  return (
    typeof data.listingId === 'string' &&
    typeof data.checkInDate === 'string' &&
    typeof data.checkOutDate === 'string' &&
    Array.isArray(data.selectedDays) &&
    data.selectedDays.every((day: any) => typeof day === 'number')
  );
}

// Usage
const proposalData: any = { /* ... */ };

if (!validateProposalData(proposalData)) {
  throw new ValidationError('Invalid proposal data');
}

// Now TypeScript knows proposalData is ProposalCreateRequest
const result = await createProposal(proposalData);
```

---

## Best Practices

### DO ✅

1. **Fail fast** - Let errors propagate without fallback logic
2. **Return specific error messages** - Help clients understand what went wrong
3. **Log full error details** - Include stack traces and context
4. **Use appropriate HTTP status codes** - Match error type to status code
5. **Validate input early** - Catch errors before they reach the API
6. **Implement retry logic** - For transient network errors
7. **Show user-friendly messages** - Translate technical errors for users
8. **Log errors for debugging** - But don't expose sensitive data
9. **Use TypeScript** - Catch errors at compile time
10. **Test error paths** - Ensure error handling works correctly

### DON'T ❌

1. **Don't hide errors** - Never use generic fallback messages
2. **Don't add fallback logic** - Let errors fail fast
3. **Don't expose sensitive data** - Don't include passwords, tokens in error messages
4. **Don't ignore errors** - Always handle or log errors
5. **Don't retry validation errors** - These won't succeed on retry
6. **Don't retry auth errors** - User needs to re-authenticate
7. **Don't use alert()** - Use proper error UI components
8. **Don't swallow exceptions** - Always log or re-throw
9. **Don't return different error formats** - Keep error response consistent
10. **Don't log before checking error type** - Some errors are expected

---

## See Also

- [Edge Functions Reference](../edge-functions/README.md)
- [Authentication Flows](../authentication/README.md)
- [Code Examples](../examples/README.md)
- [TypeScript Types](../types/README.md)
