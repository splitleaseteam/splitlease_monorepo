# Form Submission Tests Opportunity Report

**Generated:** 2026-01-28T09:15:00
**Codebase:** Split Lease

## Executive Summary

| Metric | Count |
|--------|-------|
| Components with forms | 50+ |
| Form submission tests | 0 |
| High priority forms | 12 |
| Medium priority forms | 20+ |

**Overall Status:** Critical gap - No form submission tests exist in the codebase.

## Form Inventory

### Authentication Forms (P0)

| Component | Form Type | Submission Handler | Has Tests |
|-----------|-----------|-------------------|-----------|
| `SignUpLoginModal.jsx` | Login/Signup | Auth Edge Function | No |
| `AccountProfilePage.jsx` | Profile update | Supabase update | No |

### Booking/Proposal Forms (P0)

| Component | Form Type | Submission Handler | Has Tests |
|-----------|-----------|-------------------|-----------|
| `CreateProposalFlowV2.jsx` | Proposal creation | Proposal Edge Function | No |
| `EditProposalModal.jsx` | Proposal edit | Proposal Edge Function | No |
| `GuestEditingProposalModal.jsx` | Proposal modification | Proposal Edge Function | No |

### Listing Forms (P0)

| Component | Form Type | Submission Handler | Has Tests |
|-----------|-----------|-------------------|-----------|
| `SelfListingPage` | Multi-step listing creation | Listing Edge Function | No |
| `EditListingDetails.jsx` | Listing edit | Listing Edge Function | No |
| `ImportListingModal.jsx` | Listing import | Import Edge Function | No |

### Contact/Messaging Forms (P1)

| Component | Form Type | Submission Handler | Has Tests |
|-----------|-----------|-------------------|-----------|
| `ContactHostMessaging.jsx` | Message send | Messages Edge Function | No |
| `MessageThread.jsx` | Reply send | Messages Edge Function | No |
| `AiSignupMarketReport.jsx` | Email signup | Supabase insert | No |

### Virtual Meeting Forms (P1)

| Component | Form Type | Submission Handler | Has Tests |
|-----------|-----------|-------------------|-----------|
| `BookVirtualMeeting.jsx` | Meeting booking | VM Edge Function | No |
| `RespondToVMRequest.jsx` | Meeting response | VM Edge Function | No |
| `CancelVirtualMeetings.jsx` | Meeting cancel | VM Edge Function | No |

### Schedule/Search Forms (P1)

| Component | Form Type | Submission Handler | Has Tests |
|-----------|-----------|-------------------|-----------|
| `SearchScheduleSelector.jsx` | Search filters | URL params | No |
| `ScheduleSelector.jsx` | Day selection | Parent callback | No |

### Admin Forms (P2)

| Component | Form Type | Submission Handler | Has Tests |
|-----------|-----------|-------------------|-----------|
| `PriceEditModal.jsx` | Price adjustment | Admin Edge Function | No |
| `ImportListingReviewsModal.jsx` | Reviews import | Import Edge Function | No |
| `ModifyListingsPage` | Bulk listing edit | Admin Edge Function | No |

## What Should Be Tested

### For Each Form

1. **Valid submission** - Form submits successfully with valid data
2. **Validation errors** - Form shows errors for invalid input
3. **Required fields** - Empty required fields show errors
4. **Loading state** - Submit button disabled during submission
5. **Success handling** - Success message/redirect after submission
6. **Error handling** - Error message shown on failure
7. **Network error** - Graceful handling of network failures

### For Multi-step Forms

8. **Step navigation** - Can move between steps
9. **Draft persistence** - Form data saved between sessions
10. **Validation per step** - Each step validates before proceeding

## Recommended Test Patterns

### Basic Form Submission Test

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUpLoginModal from './SignUpLoginModal';

describe('SignUpLoginModal', () => {
  describe('Login form', () => {
    it('submits login form with valid credentials', async () => {
      const onSuccess = vi.fn();
      render(<SignUpLoginModal isOpen={true} onSuccess={onSuccess} />);

      // Fill form
      await userEvent.type(
        screen.getByLabelText(/email/i),
        'test@example.com'
      );
      await userEvent.type(
        screen.getByLabelText(/password/i),
        'password123'
      );

      // Submit
      await userEvent.click(screen.getByRole('button', { name: /log in/i }));

      // Verify
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('shows validation error for invalid email', async () => {
      render(<SignUpLoginModal isOpen={true} />);

      await userEvent.type(
        screen.getByLabelText(/email/i),
        'invalid-email'
      );
      await userEvent.click(screen.getByRole('button', { name: /log in/i }));

      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });
});
```

### Form with Async Validation

```jsx
it('disables submit during submission', async () => {
  // Mock slow response
  vi.mocked(authService.login).mockImplementation(
    () => new Promise(resolve => setTimeout(resolve, 100))
  );

  render(<SignUpLoginModal isOpen={true} />);

  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'password');

  const submitButton = screen.getByRole('button', { name: /log in/i });
  await userEvent.click(submitButton);

  // Button should be disabled during submission
  expect(submitButton).toBeDisabled();

  // Wait for completion
  await waitFor(() => {
    expect(submitButton).not.toBeDisabled();
  });
});
```

### Form Error Handling

```jsx
it('shows error message on submission failure', async () => {
  vi.mocked(authService.login).mockRejectedValue(
    new Error('Invalid credentials')
  );

  render(<SignUpLoginModal isOpen={true} />);

  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /log in/i }));

  await waitFor(() => {
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
```

### Multi-Step Form Test

```jsx
describe('CreateProposalFlowV2', () => {
  it('navigates through all steps', async () => {
    render(<CreateProposalFlowV2 listing={mockListing} />);

    // Step 1: Review listing
    expect(screen.getByText(/review listing/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: User details
    await waitFor(() => {
      expect(screen.getByText(/your details/i)).toBeInTheDocument();
    });
    await userEvent.type(screen.getByLabelText(/name/i), 'Test User');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: Move-in date
    await waitFor(() => {
      expect(screen.getByText(/move-in date/i)).toBeInTheDocument();
    });
  });

  it('validates required fields before advancing', async () => {
    render(<CreateProposalFlowV2 listing={mockListing} />);

    // Try to advance without filling required fields
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Should show validation error
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});
```

## Priority Test Coverage

### P0 - Critical Forms (Test First)

| Form | Test Cases Needed |
|------|-------------------|
| Login | Valid login, invalid credentials, validation, loading |
| Signup | Valid signup, duplicate email, validation, terms checkbox |
| Create Proposal | All steps, validation per step, submission, error handling |
| Edit Listing | Field updates, save, cancel, validation |

### P1 - Important Forms

| Form | Test Cases Needed |
|------|-------------------|
| Profile Update | Field changes, save, photo upload |
| Contact Host | Message send, validation |
| Virtual Meeting Book | Time selection, confirmation |
| Search Filters | Filter application, URL sync |

### P2 - Standard Forms

| Form | Test Cases Needed |
|------|-------------------|
| Import Listing | Import flow, validation |
| Reviews Import | Import flow, validation |
| Admin Price Edit | Price update, validation |

## Test Utilities Needed

```javascript
// src/test/utils/formTestUtils.js

/**
 * Fill a form field by label
 */
export async function fillField(labelText, value) {
  const field = screen.getByLabelText(new RegExp(labelText, 'i'));
  await userEvent.clear(field);
  await userEvent.type(field, value);
  return field;
}

/**
 * Submit form and wait for loading to complete
 */
export async function submitFormAndWait(buttonText = /submit/i) {
  const button = screen.getByRole('button', { name: buttonText });
  await userEvent.click(button);

  await waitFor(() => {
    expect(button).not.toBeDisabled();
  });
}

/**
 * Assert form validation error
 */
export function expectValidationError(fieldLabel, errorText) {
  const field = screen.getByLabelText(new RegExp(fieldLabel, 'i'));
  expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText(new RegExp(errorText, 'i'))).toBeInTheDocument();
}
```

## Form Library Usage

The codebase uses `react-hook-form` and `zod` for form validation (found in `package.json`):

```json
"@hookform/resolvers": "^5.2.2",
"react-hook-form": "^7.66.1",
"zod": "^4.1.12"
```

However, only 1 file currently uses these libraries (`RefactoringRecommendations.mdx`), suggesting forms are using custom validation logic. This is an opportunity to standardize on react-hook-form.

## Summary

| Finding | Severity | Action |
|---------|----------|--------|
| 0 form submission tests | High | Add tests for auth forms |
| 50+ untested forms | High | Prioritize P0 forms |
| No form test utilities | Medium | Create shared test utils |
| Inconsistent form patterns | Medium | Standardize on react-hook-form |

## Recommendations

### Immediate Actions

- [ ] Add login/signup form tests
- [ ] Add proposal creation tests
- [ ] Create form test utilities
- [ ] Document form testing patterns

### Short-term (Week 1-2)

- [ ] Add tests for all P0 forms (12 forms)
- [ ] Standardize on react-hook-form for new forms
- [ ] Add form validation test coverage

### Medium-term (Week 3-4)

- [ ] Add tests for P1 forms (20+ forms)
- [ ] Migrate existing forms to react-hook-form
- [ ] Add accessibility tests for forms

## Test Effort Estimates

| Priority | Forms | Estimated Hours | Notes |
|----------|-------|-----------------|-------|
| P0 | 12 | 24-36 hrs | 2-3 hrs each |
| P1 | 15 | 22-30 hrs | 1.5-2 hrs each |
| P2 | 20+ | As needed | Lower priority |

**Total for P0+P1:** ~46-66 hours of testing effort

## Conclusion

Form submission testing is a critical gap. Forms are the primary way users interact with the application (login, create proposals, manage listings), yet none are tested. Priority should be:

1. Authentication forms (login, signup)
2. Proposal creation flow
3. Listing management forms
4. Messaging forms

This represents significant testing debt that should be addressed incrementally.

**Severity: High** - Core user interactions are untested.
