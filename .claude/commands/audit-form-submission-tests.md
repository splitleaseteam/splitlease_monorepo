---
name: audit-form-submission-tests
description: Audit the codebase to find form components (login, booking, search, file upload) that lack proper test coverage using userEvent. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Form Submission Testing Audit

You are conducting a comprehensive audit to identify form components that do not have proper test coverage for validation, submission, and error handling using userEvent.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Login/Signup forms** - Look for:
   - `LoginForm`, `SignupForm` components
   - Email/password inputs
   - Authentication submission

2. **Booking forms** - Look for:
   - Date pickers (check-in/check-out)
   - Guest count selectors
   - Price calculation displays

3. **Listing creation forms** - Look for:
   - Multi-step form wizards
   - Title/description inputs
   - Category/amenity selectors
   - Image upload components

4. **Search/filter forms** - Look for:
   - Search boxes
   - Filter checkboxes
   - Price range inputs
   - Debounced inputs

5. **File upload forms** - Look for:
   - Image/file inputs
   - Drag-and-drop zones
   - Upload progress indicators

6. **Test files** - Check for:
   - `userEvent.setup()` usage
   - Validation error tests
   - Submission state tests
   - Error clearing tests

### What to Check for Each Target

For each form component, check if tests exist for:
- Valid form submission
- Invalid input validation
- Required field validation
- Submission loading state
- Server error handling
- Error clearing on input
- Keyboard navigation (Tab, Enter)
- Multi-step form navigation (if applicable)
- File type/size validation (for uploads)

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-form-submission-tests.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Form Submission Testing Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Form components found: X
- Components needing tests: X
- Missing validation tests: X
- Missing submission tests: X
- Missing error handling tests: X

## Test Infrastructure Check

### userEvent Setup Status
- [ ] `userEvent` imported from `@testing-library/user-event`
- [ ] `userEvent.setup()` called at test start
- [ ] Async `await` used with all userEvent methods
- [ ] No `fireEvent` usage (should use userEvent)

## Critical Gaps (No Tests)

### 1. [Form Name]
- **File:** `path/to/FormComponent.tsx`
- **Form Type:** Login/Booking/Search/Upload
- **Has Test File:** Yes/No
- **Missing Tests:**
  - [ ] Valid submission test
  - [ ] Invalid email validation
  - [ ] Required field validation
  - [ ] Submit button disabled while loading
  - [ ] Server error display
  - [ ] Error clearing on input
  - [ ] Keyboard form submission

### 2. [Form Name]
- **File:** `path/to/FormComponent.tsx`
- **Form Type:** Multi-step wizard
- **Missing Tests:**
  - [ ] Step navigation (next/back)
  - [ ] Step validation before proceeding
  - [ ] Data persistence across steps
  - [ ] Final submission with all data

## Validation Test Gaps

### Forms Without Validation Tests
| Form | Validation Rules | Test File | Validation Tests |
|------|------------------|-----------|------------------|
| LoginForm | Email format, password required | None | Missing |
| BookingForm | Date validation, guest limits | BookingForm.test.tsx | Partial |

### Missing Validation Test Cases
- [ ] Email format validation
- [ ] Password strength validation
- [ ] Date range validation (check-out > check-in)
- [ ] Number range validation (guests, price)
- [ ] File type validation
- [ ] File size validation

## Submission State Test Gaps

### Forms Without Submission State Tests
| Form | Loading State UI | Disabled State | Test |
|------|------------------|----------------|------|
| LoginForm | "Signing in..." | Button disabled | Missing |
| BookingForm | Spinner | Button disabled | Missing |

### Missing Submission State Tests
- [ ] Submit button disabled during submission
- [ ] Loading indicator visible
- [ ] Inputs disabled during submission
- [ ] Button text change during submission

## Error Handling Test Gaps

### Forms Without Error Handling Tests
| Form | Server Error UI | Error Clearing | Test |
|------|-----------------|----------------|------|
| LoginForm | Alert component | On input | Missing |
| BookingForm | Toast | On retry | Missing |

### Missing Error Tests
- [ ] Server error message displayed
- [ ] Error cleared when user types
- [ ] Retry functionality after error
- [ ] Network error handling

## Keyboard Navigation Gaps

### Forms Without Keyboard Tests
| Form | Tab Order | Enter Submit | Test |
|------|-----------|--------------|------|
| LoginForm | ? | ? | Missing |
| SearchForm | ? | ? | Missing |

### Missing Keyboard Tests
- [ ] Tab through fields in order
- [ ] Enter key submits form
- [ ] Focus management after submit

## Multi-Step Form Gaps

### Multi-Step Forms Without Navigation Tests
| Form | Step Count | Back/Next | Validation Per Step | Test |
|------|------------|-----------|---------------------|------|
| CreateListingForm | 4 | Yes | Yes | Missing |

### Missing Multi-Step Tests
- [ ] Proceed to next step
- [ ] Go back to previous step
- [ ] Data preserved on navigation
- [ ] Step validation prevents proceeding
- [ ] Final step review shows all data

## File Upload Form Gaps

### Upload Forms Without Tests
| Form | File Types | Max Size | Multiple | Test |
|------|------------|----------|----------|------|
| ImageUploadForm | image/* | 5MB | Yes | Missing |

### Missing Upload Tests
- [ ] File selection and preview
- [ ] Invalid file type rejected
- [ ] File too large rejected
- [ ] Multiple file selection
- [ ] File removal
- [ ] Upload progress indicator

## Components with Good Coverage (Reference)

List forms that already have proper test coverage as examples.

## Recommended Test Patterns

### Login Form Test
```typescript
describe('LoginForm', () => {
  it('submits with valid credentials', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    })
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()

    render(<LoginForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'invalid-email')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByText(/valid email/i)).toBeInTheDocument()
  })

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => new Promise(r => setTimeout(r, 100)))

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
    })
  })

  it('displays server error message', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i)
    })
  })

  it('clears error when user starts typing', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

    render(<LoginForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/password/i), 'a')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
```

### Booking Form Test
```typescript
describe('BookingForm', () => {
  it('submits booking with selected dates and guests', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<BookingForm listing={mockListing} onSubmit={onSubmit} />)

    await user.click(screen.getByLabelText(/check-in/i))
    await user.click(screen.getByRole('button', { name: /15/i }))

    await user.click(screen.getByLabelText(/check-out/i))
    await user.click(screen.getByRole('button', { name: /20/i }))

    await user.selectOptions(screen.getByLabelText(/guests/i), '2')
    await user.click(screen.getByRole('button', { name: /book now/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        guests: 2,
        nights: 5,
      })
    )
  })

  it('validates check-out after check-in', async () => {
    const user = userEvent.setup()

    render(<BookingForm listing={mockListing} onSubmit={vi.fn()} />)

    await user.click(screen.getByLabelText(/check-in/i))
    await user.click(screen.getByRole('button', { name: /20/i }))

    await user.click(screen.getByLabelText(/check-out/i))
    await user.click(screen.getByRole('button', { name: /15/i }))

    expect(screen.getByText(/check-out must be after check-in/i)).toBeInTheDocument()
  })
})
```

### File Upload Test
```typescript
describe('ImageUploadForm', () => {
  it('uploads selected images', async () => {
    const user = userEvent.setup()
    const onUpload = vi.fn()

    render(<ImageUploadForm onUpload={onUpload} />)

    const file = new File(['image content'], 'photo.jpg', { type: 'image/jpeg' })

    await user.upload(screen.getByLabelText(/upload photos/i), file)

    expect(screen.getByText('photo.jpg')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /upload/i }))

    expect(onUpload).toHaveBeenCalledWith([file])
  })

  it('validates file type', async () => {
    const user = userEvent.setup()

    render(<ImageUploadForm onUpload={vi.fn()} accept="image/*" />)

    const invalidFile = new File(['doc'], 'document.pdf', { type: 'application/pdf' })

    await user.upload(screen.getByLabelText(/upload photos/i), invalidFile)

    expect(screen.getByText(/only images allowed/i)).toBeInTheDocument()
  })
})
```

### Keyboard Navigation Test
```typescript
it('supports keyboard form submission', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()

  render(<LoginForm onSubmit={onSubmit} />)

  await user.type(screen.getByLabelText(/email/i), 'user@example.com')
  await user.tab()
  await user.type(screen.getByLabelText(/password/i), 'password123')
  await user.keyboard('{Enter}')

  expect(onSubmit).toHaveBeenCalled()
})

it('tabs through form fields in order', async () => {
  const user = userEvent.setup()

  render(<ContactForm />)

  await user.tab()
  expect(screen.getByLabelText(/name/i)).toHaveFocus()

  await user.tab()
  expect(screen.getByLabelText(/email/i)).toHaveFocus()

  await user.tab()
  expect(screen.getByLabelText(/message/i)).toHaveFocus()

  await user.tab()
  expect(screen.getByRole('button', { name: /send/i })).toHaveFocus()
})
```

```

---

## Reference: Form Submission Testing Patterns

### Why userEvent Over fireEvent

```typescript
// fireEvent - synthetic events, misses real behavior
fireEvent.change(input, { target: { value: 'text' } })
fireEvent.click(button)

// userEvent - simulates actual user interaction
await user.type(input, 'text')  // Types character by character
await user.click(button)        // Includes focus, mousedown, mouseup
```

`userEvent`:
- Types character by character (catches onChange issues)
- Triggers focus/blur events
- Simulates keyboard navigation
- Respects disabled states
- More closely matches real user behavior

### Core Pattern

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('MyForm', () => {
  it('submits form data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<MyForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' })
  })
})
```

### Testing React Hook Form with Zod

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

describe('React Hook Form', () => {
  it('validates with Zod schema', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<TestForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'invalid')
    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('alert')).toHaveTextContent(/invalid/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
```

### Debounced Search Test

```typescript
it('debounces search input', async () => {
  vi.useFakeTimers()
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  const onSearch = vi.fn()

  render(<SearchForm onSearch={onSearch} debounceMs={300} />)

  await user.type(screen.getByRole('searchbox'), 'test')

  expect(onSearch).not.toHaveBeenCalled()

  await vi.advanceTimersByTimeAsync(300)

  expect(onSearch).toHaveBeenCalledTimes(1)

  vi.useRealTimers()
})
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| `fireEvent.change()` | `await user.type()` |
| `fireEvent.click()` | `await user.click()` |
| Not awaiting userEvent | Always `await user.action()` |
| Forgetting `userEvent.setup()` | Call `setup()` at test start |
| Testing implementation details | Test form behavior and output |
| Skipping validation tests | Test all validation rules |
| Not testing error states | Test server errors and clearing |

## Output Requirements

1. Be thorough - review EVERY form component
2. Be specific - include exact file paths and form types
3. Be actionable - provide test templates
4. Only report gaps - do not list tested forms unless as reference
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-form-submission-tests.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
