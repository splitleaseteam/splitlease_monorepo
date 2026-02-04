# Guest Experience Review Page - Implementation Plan

**Created**: 2026-01-27
**Source**: Bubble to Code Migration Requirements Document
**Classification**: BUILD
**Complexity**: Medium-High (Multi-step form with database integration)

---

## Executive Summary

This plan details the migration of Bubble's `guest-experience-review` page to the Split Lease React/Vite codebase. The page implements an **11-step progressive survey** that collects guest feedback, stores it in the existing `experiencesurvey` table, sends notifications, and includes a referral feature.

**Key Discovery**: The `experiencesurvey` table already exists in Supabase with all required fields. No database migration needed.

---

## Architecture Mapping

### Bubble → Split Lease Pattern Translation

| Bubble Concept | Split Lease Implementation |
|----------------|---------------------------|
| Custom State `order` (1-11) | React state `currentStep` in page logic hook |
| Group visibility conditions | Conditional rendering based on `currentStep` |
| B: Back / B: Next buttons | Navigation handlers in logic hook |
| Create Experience Survey | Direct Supabase insert or Edge Function |
| AirAlert plugin | Toast system (`useToast()`) |
| Referral creation | Edge Function via `bubble-proxy` with `submit_referral` action |
| Send email | `send-email` Edge Function |
| Slack notification | `sendToSlack()` utility |

---

## File Structure

```
app/
├── public/
│   └── guest-experience-review.html           # HTML entry point
├── src/
│   ├── guest-experience-review.jsx            # React mount entry
│   └── islands/
│       └── pages/
│           └── GuestExperienceReviewPage/
│               ├── index.js                   # Re-export
│               ├── GuestExperienceReviewPage.jsx        # Hollow component
│               ├── useGuestExperienceReviewPageLogic.js # All logic
│               ├── GuestExperienceReviewPage.css        # Styles
│               ├── components/
│               │   ├── StepIndicator.jsx      # Progress indicator (optional)
│               │   ├── NavigationButtons.jsx  # Back/Next buttons
│               │   └── ReferralSection.jsx    # Step 11 referral UI
│               └── steps/
│                   ├── WelcomeStep.jsx        # Step 1: Intro
│                   ├── NameStep.jsx           # Step 2: Name input
│                   ├── ExperienceStep.jsx     # Step 3: Experience description
│                   ├── ChallengeStep.jsx      # Step 4: Biggest challenge
│                   ├── FeelingsStep.jsx       # Step 5: How challenge made them feel
│                   ├── ChangeStep.jsx         # Step 6: What changed
│                   ├── ServiceStep.jsx        # Step 7: What stood out
│                   ├── AdditionalServiceStep.jsx  # Step 8: Desired services
│                   ├── RecommendStep.jsx      # Step 9: NPS slider (1-10)
│                   ├── StaffAndQuestionsStep.jsx  # Step 10: Staff + questions
│                   └── ShareAndReferralStep.jsx   # Step 11: Consent + referral

supabase/
└── functions/
    └── experience-survey/                     # NEW Edge Function
        └── index.ts                           # Submit survey + send notifications
```

---

## Phase 1: Route Configuration

### Task 1.1: Add Route to Registry

**File**: `app/src/routes.config.js`

Add after the existing routes (around line 680, after `/_experience-responses`):

```javascript
// ===== GUEST EXPERIENCE REVIEW (PUBLIC-FACING) =====
{
  path: '/guest-experience-review',
  file: 'guest-experience-review.html',
  aliases: ['/guest-experience-review.html', '/guest-experience', '/experience-review'],
  protected: true,  // Requires authentication
  cloudflareInternal: true,
  internalName: 'guest-experience-review-view',
  hasDynamicSegment: false
},
```

**Notes**:
- `protected: true` because survey requires logged-in user (Current User's Name is pre-filled)
- Multiple aliases for flexibility
- No dynamic segment needed

### Task 1.2: Generate Route Files

After adding route, run:
```bash
bun run generate-routes
```

This will update:
- `app/public/_redirects`
- `app/public/_routes.json`

---

## Phase 2: HTML Entry Point

### Task 2.1: Create HTML File

**File**: `app/public/guest-experience-review.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Guest Experience Review | Split Lease</title>
  <meta name="description" content="Share your experience with Split Lease and help us improve." />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/guest-experience-review.jsx"></script>
</body>
</html>
```

---

## Phase 3: React Entry Point

### Task 3.1: Create JSX Entry

**File**: `app/src/guest-experience-review.jsx`

```javascript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './islands/shared/Toast';
import GuestExperienceReviewPage from './islands/pages/GuestExperienceReviewPage';
import './styles/global.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ToastProvider>
      <GuestExperienceReviewPage />
    </ToastProvider>
  </React.StrictMode>
);
```

---

## Phase 4: Page Logic Hook (Core Implementation)

### Task 4.1: Create Logic Hook

**File**: `app/src/islands/pages/GuestExperienceReviewPage/useGuestExperienceReviewPageLogic.js`

This is the **central logic file** following the Hollow Component pattern.

#### State Structure

```javascript
// Step management
const [currentStep, setCurrentStep] = useState(1);  // 1-11

// Form data (maps to experiencesurvey columns)
const [formData, setFormData] = useState({
  name: '',                  // Name
  experience: '',            // Experience
  challenge: '',             // Challenge
  challengeExperience: '',   // Challenge Experience
  change: '',                // Change
  service: '',               // Service
  additionalService: '',     // Additional Service
  recommend: 5,              // Recommend (1-10, default middle)
  staff: '',                 // Split Lease Staff
  questions: '',             // Questions
  canShare: null,            // Share (boolean)
});

// Referral
const [referralEmail, setReferralEmail] = useState('');
const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

// Submission
const [isSubmitting, setIsSubmitting] = useState(false);
const [isComplete, setIsComplete] = useState(false);
```

#### Step Configuration

```javascript
const STEPS = [
  { id: 1, label: 'Welcome', component: 'WelcomeStep' },
  { id: 2, label: 'Name', component: 'NameStep', field: 'name' },
  { id: 3, label: 'Experience', component: 'ExperienceStep', field: 'experience' },
  { id: 4, label: 'Challenge', component: 'ChallengeStep', field: 'challenge' },
  { id: 5, label: 'Feelings', component: 'FeelingsStep', field: 'challengeExperience' },
  { id: 6, label: 'Change', component: 'ChangeStep', field: 'change' },
  { id: 7, label: 'Service', component: 'ServiceStep', field: 'service' },
  { id: 8, label: 'More Services', component: 'AdditionalServiceStep', field: 'additionalService' },
  { id: 9, label: 'Recommend', component: 'RecommendStep', field: 'recommend' },
  { id: 10, label: 'Staff & Questions', component: 'StaffAndQuestionsStep', fields: ['staff', 'questions'] },
  { id: 11, label: 'Share & Refer', component: 'ShareAndReferralStep', field: 'canShare' },
];

const TOTAL_STEPS = 11;
```

#### Navigation Handlers

```javascript
const handleNext = useCallback(async () => {
  if (currentStep < TOTAL_STEPS) {
    // Simple progression
    setCurrentStep(prev => prev + 1);
  } else if (currentStep === TOTAL_STEPS) {
    // Final step - submit survey
    await handleSubmitSurvey();
  }
}, [currentStep]);

const handleBack = useCallback(() => {
  if (currentStep > 1) {
    setCurrentStep(prev => prev - 1);
  }
}, [currentStep]);
```

#### Survey Submission

```javascript
const handleSubmitSurvey = useCallback(async () => {
  setIsSubmitting(true);

  try {
    // Get current user ID
    const userId = getUserId();

    // Generate Bubble-compatible ID
    const { data: surveyId, error: idError } = await supabase.rpc('generate_bubble_id');
    if (idError) throw new Error('Failed to generate survey ID');

    const now = new Date().toISOString();

    // Insert into experiencesurvey table
    const { error: insertError } = await supabase
      .from('experiencesurvey')
      .insert({
        '_id': surveyId,
        'Name': formData.name,
        'Experience': formData.experience,
        'Challenge': formData.challenge,
        'Challenge Experience': formData.challengeExperience,
        'Change': formData.change,
        'Service': formData.service,
        'Additional Service': formData.additionalService,
        'Recommend': formData.recommend,
        'Split Lease Staff': formData.staff,
        'Questions': formData.questions,
        'Share': formData.canShare,
        'Type': 'Guest',  // Hardcoded as per Bubble spec
        'Created Date': now,
        'Modified Date': now,
        'Created By': userId,
      });

    if (insertError) throw insertError;

    // Send notification email to team (fire-and-forget)
    sendNotificationEmail(formData, surveyId);

    // Send Slack notification (fire-and-forget)
    sendSlackNotification(formData);

    showToast({ title: 'Thank you!', content: 'Your feedback has been submitted.', type: 'success' });
    setIsComplete(true);

    // Redirect to index after short delay
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);

  } catch (error) {
    console.error('[GuestExperienceReview] Submit error:', error);
    showToast({ title: 'Submission failed', content: error.message, type: 'error' });
  } finally {
    setIsSubmitting(false);
  }
}, [formData, showToast]);
```

#### Referral Handler

```javascript
const handleSubmitReferral = useCallback(async () => {
  if (!referralEmail.trim()) {
    showToast({ title: 'Email required', content: 'Please enter your friend\'s email address.', type: 'warning' });
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(referralEmail)) {
    showToast({ title: 'Invalid email', content: 'Please enter a valid email address.', type: 'error' });
    return;
  }

  setIsSubmittingReferral(true);

  try {
    // Use bubble-proxy Edge Function for referral submission
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bubble-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'submit_referral',
          payload: {
            referred_email: referralEmail.toLowerCase().trim(),
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (result.error?.includes('duplicate') || result.error?.includes('already exists')) {
        showToast({ title: 'Already referred', content: 'This email has already been referred.', type: 'info' });
      } else {
        throw new Error(result.error || 'Referral failed');
      }
    } else {
      showToast({ title: 'Referral sent!', content: 'Your friend will receive an invitation email.', type: 'success' });
      setReferralEmail('');  // Clear input
    }

  } catch (error) {
    console.error('[GuestExperienceReview] Referral error:', error);
    showToast({ title: 'Referral failed', content: error.message, type: 'error' });
  } finally {
    setIsSubmittingReferral(false);
  }
}, [referralEmail, showToast]);
```

#### Pre-fill User Name on Mount

```javascript
useEffect(() => {
  const initializeUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch user's first name from user table
        const { data: userData } = await supabase
          .from('user')
          .select('"Name - First"')
          .eq('email', user.email?.toLowerCase())
          .maybeSingle();

        if (userData?.['Name - First']) {
          setFormData(prev => ({ ...prev, name: userData['Name - First'] }));
        }
      }
    } catch (error) {
      console.error('[GuestExperienceReview] Failed to fetch user data:', error);
    }
  };

  initializeUserData();
}, []);
```

---

## Phase 5: Page Component (Hollow)

### Task 5.1: Create Page Component

**File**: `app/src/islands/pages/GuestExperienceReviewPage/GuestExperienceReviewPage.jsx`

```jsx
/**
 * GuestExperienceReviewPage - Hollow component (presentational only)
 *
 * All logic lives in useGuestExperienceReviewPageLogic hook.
 * This component only renders UI based on state from the hook.
 */

import React from 'react';
import { useGuestExperienceReviewPageLogic } from './useGuestExperienceReviewPageLogic';
import Header from '../../shared/Header';
import NavigationButtons from './components/NavigationButtons';

// Step components
import WelcomeStep from './steps/WelcomeStep';
import NameStep from './steps/NameStep';
import ExperienceStep from './steps/ExperienceStep';
import ChallengeStep from './steps/ChallengeStep';
import FeelingsStep from './steps/FeelingsStep';
import ChangeStep from './steps/ChangeStep';
import ServiceStep from './steps/ServiceStep';
import AdditionalServiceStep from './steps/AdditionalServiceStep';
import RecommendStep from './steps/RecommendStep';
import StaffAndQuestionsStep from './steps/StaffAndQuestionsStep';
import ShareAndReferralStep from './steps/ShareAndReferralStep';

import './GuestExperienceReviewPage.css';

const STEP_COMPONENTS = {
  1: WelcomeStep,
  2: NameStep,
  3: ExperienceStep,
  4: ChallengeStep,
  5: FeelingsStep,
  6: ChangeStep,
  7: ServiceStep,
  8: AdditionalServiceStep,
  9: RecommendStep,
  10: StaffAndQuestionsStep,
  11: ShareAndReferralStep,
};

export default function GuestExperienceReviewPage() {
  const logic = useGuestExperienceReviewPageLogic();

  const {
    currentStep,
    formData,
    updateField,
    handleBack,
    handleNext,
    isSubmitting,
    isComplete,
    // Referral
    referralEmail,
    setReferralEmail,
    handleSubmitReferral,
    isSubmittingReferral,
  } = logic;

  // Get current step component
  const StepComponent = STEP_COMPONENTS[currentStep];

  if (isComplete) {
    return (
      <div className="guest-experience-review-page">
        <Header />
        <main className="survey-container survey-complete">
          <h1>Thank You!</h1>
          <p>Your feedback helps us improve Split Lease for everyone.</p>
          <p>Redirecting to homepage...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="guest-experience-review-page">
      <Header />

      <main className="survey-container">
        <h1 className="survey-title">Guest Experience</h1>

        {/* Progress indicator (optional) */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / 11) * 100}%` }}
          />
        </div>
        <p className="step-counter">Step {currentStep} of 11</p>

        {/* Current step content */}
        <div className="step-content">
          <StepComponent
            formData={formData}
            updateField={updateField}
            // Pass referral props for step 11
            referralEmail={referralEmail}
            setReferralEmail={setReferralEmail}
            handleSubmitReferral={handleSubmitReferral}
            isSubmittingReferral={isSubmittingReferral}
          />
        </div>

        {/* Navigation */}
        <NavigationButtons
          currentStep={currentStep}
          totalSteps={11}
          onBack={handleBack}
          onNext={handleNext}
          isSubmitting={isSubmitting}
          isLastStep={currentStep === 11}
        />
      </main>
    </div>
  );
}
```

---

## Phase 6: Step Components

### Task 6.1: Create Step Components

Each step component is a simple presentational component. Example for Step 3:

**File**: `app/src/islands/pages/GuestExperienceReviewPage/steps/ExperienceStep.jsx`

```jsx
import React from 'react';

export default function ExperienceStep({ formData, updateField }) {
  return (
    <div className="step experience-step">
      <h2 className="step-question">
        Please describe your experience with Split Lease.
      </h2>

      <textarea
        className="step-textarea"
        placeholder="Type here..."
        value={formData.experience}
        onChange={(e) => updateField('experience', e.target.value)}
        rows={5}
      />
    </div>
  );
}
```

### Step Component Summary

| Step | Component | Input Type | Field(s) |
|------|-----------|------------|----------|
| 1 | WelcomeStep | None (intro text) | - |
| 2 | NameStep | Text input | `name` |
| 3 | ExperienceStep | Textarea | `experience` |
| 4 | ChallengeStep | Textarea | `challenge` |
| 5 | FeelingsStep | Textarea | `challengeExperience` |
| 6 | ChangeStep | Textarea | `change` |
| 7 | ServiceStep | Textarea | `service` |
| 8 | AdditionalServiceStep | Textarea | `additionalService` |
| 9 | RecommendStep | Slider (1-10) | `recommend` |
| 10 | StaffAndQuestionsStep | Text + Textarea | `staff`, `questions` |
| 11 | ShareAndReferralStep | Radio + Email input | `canShare`, `referralEmail` |

---

## Phase 7: Navigation Buttons Component

### Task 7.1: Create Navigation Component

**File**: `app/src/islands/pages/GuestExperienceReviewPage/components/NavigationButtons.jsx`

```jsx
import React from 'react';

export default function NavigationButtons({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isSubmitting,
  isLastStep,
}) {
  return (
    <div className="navigation-buttons">
      {currentStep > 1 && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </button>
      )}

      <button
        type="button"
        className={`btn ${isLastStep ? 'btn-success' : 'btn-primary'}`}
        onClick={onNext}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : isLastStep ? 'Submit' : 'Next'}
      </button>
    </div>
  );
}
```

---

## Phase 8: Edge Function (Optional Enhancement)

### Decision Point

**Option A: Direct Supabase Insert** (Simpler)
- Insert directly from frontend using authenticated Supabase client
- Suitable if no complex server-side logic needed
- Email/Slack notifications via separate fire-and-forget calls

**Option B: Dedicated Edge Function** (More Robust)
- Atomic operation: insert + email + Slack in one transaction
- Better error handling and logging
- Follows existing pattern (`proposal`, `rental-application`)

**Recommendation**: Start with **Option A** for MVP, migrate to **Option B** if needed.

### If Option B is chosen:

**File**: `supabase/functions/experience-survey/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { sendToSlack } from '../_shared/slack.ts';
import { sendEmail, EMAIL_TEMPLATES } from '../_shared/emailUtils.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    if (action === 'submit') {
      // Implementation here
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## Phase 9: Styling

### Task 9.1: Create CSS

**File**: `app/src/islands/pages/GuestExperienceReviewPage/GuestExperienceReviewPage.css`

Key styling requirements from Bubble spec:
- Container width: ~1240px (responsive)
- Column layout for steps
- Progress bar visualization
- Brand colors (purple/blue)
- Back button: blue outlined
- Next button: blue outlined (steps 1-10), gray filled (step 11)
- Mobile responsive

---

## Phase 10: Notifications

### Task 10.1: Email Notification

Use existing `send-email` Edge Function:

```javascript
const sendNotificationEmail = async (formData, surveyId) => {
  try {
    await supabase.functions.invoke('send-email', {
      body: {
        action: 'send',
        payload: {
          template_id: EMAIL_TEMPLATES.BASIC_EMAIL,
          to_email: 'team@splitlease.com',  // Or specific recipient
          from_email: 'no-reply@split.lease',
          from_name: 'Split Lease',
          subject: `New Guest Experience Survey: ${formData.name}`,
          variables: {
            title: 'New Guest Experience Survey',
            bodytext: `
              Name: ${formData.name}
              Recommend Score: ${formData.recommend}/10
              Experience: ${formData.experience}
              Staff Mentioned: ${formData.staff || 'None'}
            `,
          },
          bcc_emails: INTERNAL_BCC_EMAILS,
        },
      },
    });
  } catch (error) {
    console.error('[GuestExperienceReview] Email notification failed:', error);
    // Non-blocking - don't throw
  }
};
```

### Task 10.2: Slack Notification

```javascript
import { sendToSlack } from '../../lib/slack';  // If client-side helper exists

// Or via Edge Function call
const sendSlackNotification = async (formData) => {
  // Fire-and-forget to acquisition channel
  // Implementation depends on Slack webhook access from frontend
};
```

---

## Database Schema Reference

### Existing `experiencesurvey` Table

| Column | Type | Maps to Form Field |
|--------|------|-------------------|
| `_id` | text (PK) | Generated via `generate_bubble_id` |
| `Name` | text | `formData.name` |
| `Type` | text | Hardcoded: `'Guest'` |
| `Experience` | text | `formData.experience` |
| `Challenge` | text | `formData.challenge` |
| `Challenge Experience` | text | `formData.challengeExperience` |
| `Change` | text | `formData.change` |
| `Service` | text | `formData.service` |
| `Additional Service` | text | `formData.additionalService` |
| `Recommend` | integer | `formData.recommend` (1-10) |
| `Split Lease Staff` | text | `formData.staff` |
| `Questions` | text | `formData.questions` |
| `Share` | boolean | `formData.canShare` |
| `Created Date` | timestamp | Auto-set on insert |
| `Modified Date` | timestamp | Auto-set on insert |
| `Created By` | text (FK to user) | Current user's `_id` |

**No migration needed** - table already exists and matches requirements.

---

## Implementation Checklist

### Phase 1: Setup (30 min)
- [ ] Add route to `routes.config.js`
- [ ] Run `bun run generate-routes`
- [ ] Create HTML entry point
- [ ] Create JSX entry point

### Phase 2: Core Logic (2-3 hours)
- [ ] Create page directory structure
- [ ] Implement `useGuestExperienceReviewPageLogic.js`
- [ ] Implement step state management
- [ ] Implement form data handling
- [ ] Implement navigation handlers
- [ ] Implement survey submission
- [ ] Implement user data pre-fill

### Phase 3: Components (2-3 hours)
- [ ] Create hollow page component
- [ ] Create all 11 step components
- [ ] Create NavigationButtons component
- [ ] Create ReferralSection component (for step 11)
- [ ] Create StepIndicator/ProgressBar component

### Phase 4: Styling (1-2 hours)
- [ ] Create CSS file
- [ ] Style step containers
- [ ] Style inputs (text, textarea, slider, radio)
- [ ] Style navigation buttons
- [ ] Style progress bar
- [ ] Add responsive breakpoints

### Phase 5: Notifications (1 hour)
- [ ] Implement email notification
- [ ] Implement Slack notification (if applicable)
- [ ] Test notifications

### Phase 6: Referral Feature (1 hour)
- [ ] Implement referral submission via `bubble-proxy`
- [ ] Handle duplicate referral errors
- [ ] Add success/error toasts

### Phase 7: Testing (1-2 hours)
- [ ] Test full survey flow (all 11 steps)
- [ ] Test form validation
- [ ] Test survey submission
- [ ] Test referral submission
- [ ] Test notifications
- [ ] Test mobile responsiveness
- [ ] Test with logged-in user
- [ ] Test redirect after completion

---

## Dependencies

### Existing Code to Reuse
- `app/src/lib/supabase.js` - Supabase client
- `app/src/lib/auth.js` - Authentication utilities
- `app/src/islands/shared/Toast.jsx` - Toast notifications
- `app/src/islands/shared/Header.jsx` - Page header
- `supabase/functions/send-email/` - Email sending
- `supabase/functions/bubble-proxy/` - Referral submission

### New Code Required
- Page component + logic hook
- 11 step components
- Navigation component
- CSS styles

---

## Open Questions

1. **Step Indicator Style**: Should we use a numbered step indicator (like RentalApplicationWizard) or just a progress bar?

2. **Validation**: Should steps require input before proceeding, or allow skipping? Bubble spec shows no explicit validation.

3. **Referral Integration**: Need to verify `bubble-proxy` action `submit_referral` still works and what payload it expects.

4. **Email Recipients**: Who should receive the notification email? The Bubble spec says "NEEDS INVESTIGATION".

5. **Mobile Layout**: Bubble spec mentions "Minimum Width: 20%" - need to clarify responsive behavior.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Referral API changed | Medium | Medium | Test `submit_referral` action before implementation |
| Email template missing | Low | Low | Use existing `BASIC_EMAIL` template |
| Slider component needed | Low | Low | Use native HTML5 range input or existing component |
| Auth redirect issues | Low | Medium | Follow existing protected page pattern |

---

## Success Criteria

1. User can navigate through all 11 steps
2. Form data persists across step navigation
3. Survey is saved to `experiencesurvey` table with correct data
4. Email notification is sent to team
5. User can submit referral on step 11
6. User is redirected to index after submission
7. Page works on mobile devices
8. Existing `/_experience-responses` page shows new submissions

---

**Plan Status**: Ready for Implementation
**Estimated Effort**: 8-12 hours
**Priority**: Medium (Feature migration)
