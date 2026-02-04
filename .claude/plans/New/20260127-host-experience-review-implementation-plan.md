# Host Experience Review Page - Implementation Plan

**Created**: January 27, 2026
**Classification**: BUILD
**Complexity**: High (11-step wizard, database, email integration)
**Estimated Files**: 20-25 new files

---

## Executive Summary

This plan converts the Bubble.io "host-experience-review" page into a React-based implementation following Split Lease's Islands Architecture. The page is an 11-step survey wizard that collects detailed feedback from hosts about their Split Lease experience.

---

## 1. REQUIREMENTS ANALYSIS

### 1.1 Core Functionality (from Bubble Requirements)

| Step | Group Name | Purpose | Input Type |
|------|-----------|---------|------------|
| 1 | G: Name | Collect host's name | Single-line text input |
| 2 | G: Experience | Describe overall experience | Multi-line text (required) |
| 3 | G: Prior to Split Lease | Biggest challenge before SL | Multi-line text |
| 4 | G: Challenge | How challenge impacted them | Multi-line text |
| 5 | G: What Changed | What changed after using SL | Multi-line text |
| 6 | G: What stood out | What stood out about service | Multi-line text |
| 7 | G: Additional Service | Need for additional services | Text/Selection |
| 8 | G: Publicly Share | Permission to share publicly | Boolean (checkbox/toggle) |
| 9 | G: Recommend | NPS-style recommendation (1-10) | Slider/Rating scale |
| 10 | G: Anyone to thank | Staff appreciation | Multi-line text |
| 11 | G: Any Questions | Final questions for SL team | Multi-line text |

### 1.2 Technical Requirements

- **State Management**: URL parameter `?order=N` tracks current step (1-11)
- **Navigation**: Back/Next buttons with step validation
- **Persistence**: Create `experience_survey` record on final submission
- **Email**: Send confirmation email after submission
- **Styling**: Card-based layout with purple-bordered inputs (matches existing theme)

### 1.3 Business Rules Extracted

1. Step 2 (Experience) is REQUIRED - cannot be empty
2. Steps are navigated sequentially (no skip-ahead)
3. All data saved atomically on final submission (Step 11)
4. Email sent to admin/staff after successful submission
5. Redirect to index page after completion

---

## 2. ARCHITECTURE MAPPING

### 2.1 File Structure

```
app/
├── public/
│   └── host-experience-review.html              # HTML entry point
├── src/
│   ├── host-experience-review.jsx               # JSX entry point
│   └── islands/
│       └── pages/
│           └── HostExperienceReviewPage/
│               ├── HostExperienceReviewPage.jsx           # Hollow component
│               ├── HostExperienceReviewPage.css           # Page styles
│               ├── useHostExperienceReviewPageLogic.js    # Logic hook
│               ├── constants.js                           # Step config, validation rules
│               └── components/
│                   ├── StepProgress.jsx                   # Progress indicator (11 steps)
│                   ├── StepProgress.css
│                   ├── NavigationButtons.jsx              # Back/Next/Submit buttons
│                   ├── NavigationButtons.css
│                   └── steps/
│                       ├── NameStep.jsx                   # Step 1
│                       ├── ExperienceStep.jsx             # Step 2
│                       ├── PriorChallengeStep.jsx         # Step 3
│                       ├── ChallengeImpactStep.jsx        # Step 4
│                       ├── WhatChangedStep.jsx            # Step 5
│                       ├── WhatStoodOutStep.jsx           # Step 6
│                       ├── AdditionalServiceStep.jsx      # Step 7
│                       ├── PublicShareStep.jsx            # Step 8
│                       ├── RecommendationStep.jsx         # Step 9
│                       ├── ThankSomeoneStep.jsx           # Step 10
│                       ├── QuestionsStep.jsx              # Step 11
│                       └── steps.css                      # Shared step styles
│
├── logic/
│   ├── rules/
│   │   └── experienceSurvey/
│   │       ├── isStepComplete.js                # Per-step validation
│   │       └── isSurveyComplete.js              # Full form validation
│   └── processors/
│       └── experienceSurvey/
│           └── formatSurveyPayload.js           # Clean/transform data for API

supabase/
├── migrations/
│   └── 20260127000000_create_experience_survey_table.sql
└── functions/
    └── experience-survey/
        └── index.ts                             # Edge Function handler
```

### 2.2 Route Configuration

Add to `app/src/routes.config.js`:

```javascript
{
  path: '/host-experience-review',
  file: 'host-experience-review.html',
  aliases: ['/host-experience-review.html'],
  protected: true,                    // Requires authentication
  cloudflareInternal: true,           // Prevents 308 redirects that strip params
  internalName: 'host-experience-review-view',
  hasDynamicSegment: false
}
```

---

## 3. DATABASE SCHEMA

### 3.1 Migration File

**File**: `supabase/migrations/20260127000000_create_experience_survey_table.sql`

```sql
-- Experience Survey Table
-- Stores host feedback collected via the 11-step survey wizard

CREATE TABLE experience_survey (
  -- Primary key
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Step 1: Name
  host_name TEXT,

  -- Step 2: Experience (REQUIRED)
  experience_description TEXT NOT NULL,

  -- Step 3: Prior Challenge
  prior_challenge TEXT,

  -- Step 4: Challenge Impact
  challenge_impact TEXT,

  -- Step 5: What Changed
  what_changed TEXT,

  -- Step 6: What Stood Out
  what_stood_out TEXT,

  -- Step 7: Additional Service
  additional_service_needed TEXT,

  -- Step 8: Public Share Permission
  can_share_publicly BOOLEAN DEFAULT false,

  -- Step 9: Recommendation Score (NPS 1-10)
  recommendation_score INTEGER CHECK (recommendation_score >= 1 AND recommendation_score <= 10),

  -- Step 10: Staff Appreciation
  staff_to_thank TEXT,

  -- Step 11: Questions
  additional_questions TEXT,

  -- Metadata
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted')),
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_experience_survey_user_id ON experience_survey(user_id);
CREATE INDEX idx_experience_survey_status ON experience_survey(status);
CREATE INDEX idx_experience_survey_created_at ON experience_survey(created_at DESC);

-- Row Level Security
ALTER TABLE experience_survey ENABLE ROW LEVEL SECURITY;

-- Users can only read their own surveys
CREATE POLICY "Users can read own surveys"
  ON experience_survey FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own surveys
CREATE POLICY "Users can insert own surveys"
  ON experience_survey FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_experience_survey_updated_at
  BEFORE UPDATE ON experience_survey
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE experience_survey IS 'Host experience feedback collected via 11-step survey wizard';
COMMENT ON COLUMN experience_survey.recommendation_score IS 'NPS-style score: 1-10 scale';
COMMENT ON COLUMN experience_survey.can_share_publicly IS 'Permission to use feedback in marketing';
```

### 3.2 Bubble Sync (Optional)

If survey data needs to sync to Bubble, add to `sync_queue`:

```sql
-- Optional: Queue for Bubble sync if needed
-- Add to sync_queue after survey submission
INSERT INTO sync_queue (
  correlation_id,
  table_name,
  record_id,
  operation,
  payload,
  status
) VALUES (
  'experience_survey:' || NEW._id,
  'experience_survey',
  NEW._id,
  'INSERT',
  row_to_json(NEW),
  'pending'
);
```

---

## 4. EDGE FUNCTION IMPLEMENTATION

### 4.1 Function Handler

**File**: `supabase/functions/experience-survey/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { createErrorCollector } from "../_shared/slack.ts";
import { ValidationError, AuthenticationError } from "../_shared/errors.ts";
import { sendEmail, EMAIL_TEMPLATES, INTERNAL_BCC_EMAILS } from "../_shared/emailUtils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SurveyPayload {
  hostName: string;
  experienceDescription: string;
  priorChallenge: string;
  challengeImpact: string;
  whatChanged: string;
  whatStoodOut: string;
  additionalServiceNeeded: string;
  canSharePublicly: boolean;
  recommendationScore: number;
  staffToThank: string;
  additionalQuestions: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const collector = createErrorCollector("experience-survey", "submit");

  try {
    // Parse request
    const { action, payload } = await req.json();

    if (!action) {
      throw new ValidationError("Missing action parameter");
    }

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new AuthenticationError("Missing authorization header");
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthenticationError("Invalid or expired token");
    }

    switch (action) {
      case "submit":
        return await handleSubmit(supabase, user, payload as SurveyPayload, req, collector);

      default:
        throw new ValidationError(`Unknown action: ${action}`);
    }

  } catch (error) {
    collector.add(error, "request processing");
    await collector.reportToSlack();

    const statusCode = error instanceof ValidationError ? 400
                     : error instanceof AuthenticationError ? 401
                     : 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        code: error.code || "UNKNOWN_ERROR"
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

async function handleSubmit(
  supabase: any,
  user: any,
  payload: SurveyPayload,
  req: Request,
  collector: any
): Promise<Response> {

  // 1. Validate required fields
  if (!payload.experienceDescription?.trim()) {
    throw new ValidationError("Experience description is required");
  }

  if (payload.recommendationScore && (payload.recommendationScore < 1 || payload.recommendationScore > 10)) {
    throw new ValidationError("Recommendation score must be between 1 and 10");
  }

  // 2. Get client metadata
  const ipAddress = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || null;
  const userAgent = req.headers.get("user-agent") || null;

  // 3. Insert survey record
  const { data: survey, error: insertError } = await supabase
    .from("experience_survey")
    .insert({
      user_id: user.id,
      host_name: payload.hostName?.trim() || null,
      experience_description: payload.experienceDescription.trim(),
      prior_challenge: payload.priorChallenge?.trim() || null,
      challenge_impact: payload.challengeImpact?.trim() || null,
      what_changed: payload.whatChanged?.trim() || null,
      what_stood_out: payload.whatStoodOut?.trim() || null,
      additional_service_needed: payload.additionalServiceNeeded?.trim() || null,
      can_share_publicly: payload.canSharePublicly ?? false,
      recommendation_score: payload.recommendationScore || null,
      staff_to_thank: payload.staffToThank?.trim() || null,
      additional_questions: payload.additionalQuestions?.trim() || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: "submitted"
    })
    .select()
    .single();

  if (insertError) {
    console.error("[experience-survey] Insert error:", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
    throw new Error(`Failed to save survey: ${insertError.message}`);
  }

  console.log("[experience-survey] Survey saved:", survey._id);

  // 4. Send confirmation email to user
  try {
    await sendEmail({
      templateId: EMAIL_TEMPLATES.BASIC_EMAIL,
      toEmail: user.email,
      toName: payload.hostName || user.email,
      subject: "Thank you for your feedback!",
      variables: {
        firstName: payload.hostName || "Host",
        messageBody: `Thank you for taking the time to share your experience with Split Lease. Your feedback helps us improve our service for all hosts.\n\nIf you have any questions, our team will reach out to you soon.`
      },
      bccEmails: INTERNAL_BCC_EMAILS
    });
    console.log("[experience-survey] Confirmation email sent to:", user.email);
  } catch (emailError) {
    // Log but don't fail the request if email fails
    console.error("[experience-survey] Email error:", emailError);
    collector.add(emailError, "send confirmation email");
  }

  // 5. Send notification to admin about new survey (especially if NPS is low)
  if (payload.recommendationScore && payload.recommendationScore <= 6) {
    try {
      await sendEmail({
        templateId: EMAIL_TEMPLATES.BASIC_EMAIL,
        toEmail: "team@splitlease.com",
        toName: "Split Lease Team",
        subject: `[Attention] Low NPS Score (${payload.recommendationScore}/10) - Host Feedback`,
        variables: {
          firstName: "Team",
          messageBody: `A host has submitted feedback with a low recommendation score.\n\nHost: ${payload.hostName || user.email}\nScore: ${payload.recommendationScore}/10\nExperience: ${payload.experienceDescription.substring(0, 200)}...\n\nPlease review and follow up as needed.`
        }
      });
    } catch (emailError) {
      console.error("[experience-survey] Admin notification error:", emailError);
    }
  }

  // 6. Return success
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        surveyId: survey._id,
        message: "Survey submitted successfully"
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}
```

---

## 5. FRONTEND IMPLEMENTATION

### 5.1 HTML Entry Point

**File**: `app/public/host-experience-review.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Host Experience Review - Split Lease</title>
  <meta name="description" content="Share your experience as a Split Lease host">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/host-experience-review.jsx"></script>
</body>
</html>
```

### 5.2 JSX Entry Point

**File**: `app/src/host-experience-review.jsx`

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import HostExperienceReviewPage from './islands/pages/HostExperienceReviewPage';
import './styles/global.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <HostExperienceReviewPage />
  </React.StrictMode>
);
```

### 5.3 Constants Configuration

**File**: `app/src/islands/pages/HostExperienceReviewPage/constants.js`

```javascript
/**
 * Host Experience Review Survey Configuration
 * Defines all 11 steps, their fields, and validation rules
 */

export const TOTAL_STEPS = 11;

export const STEP_CONFIG = {
  1: {
    id: 'name',
    title: 'What is your name?',
    subtitle: 'Let us know who we're speaking with',
    fields: ['hostName'],
    required: false
  },
  2: {
    id: 'experience',
    title: 'Please describe your experience',
    subtitle: 'Tell us about your overall experience using Split Lease',
    fields: ['experienceDescription'],
    required: true
  },
  3: {
    id: 'priorChallenge',
    title: 'Prior to Split Lease',
    subtitle: 'What was your biggest challenge before using our platform?',
    fields: ['priorChallenge'],
    required: false
  },
  4: {
    id: 'challengeImpact',
    title: 'How did that challenge affect you?',
    subtitle: 'Describe how this challenge impacted your hosting experience',
    fields: ['challengeImpact'],
    required: false
  },
  5: {
    id: 'whatChanged',
    title: 'What changed after using Split Lease?',
    subtitle: 'How has your experience improved since joining us?',
    fields: ['whatChanged'],
    required: false
  },
  6: {
    id: 'whatStoodOut',
    title: 'What stood out to you?',
    subtitle: 'Was there anything particularly memorable about our service?',
    fields: ['whatStoodOut'],
    required: false
  },
  7: {
    id: 'additionalService',
    title: 'Additional Services',
    subtitle: 'Is there any service you wish we offered?',
    fields: ['additionalServiceNeeded'],
    required: false
  },
  8: {
    id: 'publicShare',
    title: 'Share Your Story',
    subtitle: 'Would you be comfortable with us sharing your feedback publicly?',
    fields: ['canSharePublicly'],
    required: false,
    inputType: 'boolean'
  },
  9: {
    id: 'recommend',
    title: 'How likely are you to recommend Split Lease?',
    subtitle: 'On a scale of 1-10, how likely would you recommend us to a friend?',
    fields: ['recommendationScore'],
    required: false,
    inputType: 'slider',
    min: 1,
    max: 10
  },
  10: {
    id: 'thankSomeone',
    title: 'Anyone to thank?',
    subtitle: 'Is there anyone at Split Lease you want to thank for excellent service?',
    fields: ['staffToThank'],
    required: false
  },
  11: {
    id: 'questions',
    title: 'Any questions?',
    subtitle: 'Do you have any questions regarding our service?',
    fields: ['additionalQuestions'],
    required: false
  }
};

export const INITIAL_FORM_STATE = {
  hostName: '',
  experienceDescription: '',
  priorChallenge: '',
  challengeImpact: '',
  whatChanged: '',
  whatStoodOut: '',
  additionalServiceNeeded: '',
  canSharePublicly: false,
  recommendationScore: 8, // Default to 8 for positive bias
  staffToThank: '',
  additionalQuestions: ''
};

export const LOCAL_STORAGE_KEY = 'hostExperienceReviewDraft';
```

### 5.4 Logic Hook

**File**: `app/src/islands/pages/HostExperienceReviewPage/useHostExperienceReviewPageLogic.js`

```javascript
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { TOTAL_STEPS, STEP_CONFIG, INITIAL_FORM_STATE, LOCAL_STORAGE_KEY } from './constants.js';
import { isStepComplete } from '../../../logic/rules/experienceSurvey/isStepComplete.js';
import { formatSurveyPayload } from '../../../logic/processors/experienceSurvey/formatSurveyPayload.js';

/**
 * Logic hook for Host Experience Review Page
 * Manages all state, validation, navigation, and submission logic
 */
export function useHostExperienceReviewPageLogic() {
  // ─────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // ─────────────────────────────────────────────────────────────
  // URL Parameter Sync
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('order');

    if (!orderParam) {
      // No order param - redirect to step 1
      window.history.replaceState({}, '', '?order=1');
      setCurrentStep(1);
    } else {
      const step = parseInt(orderParam, 10);
      if (step >= 1 && step <= TOTAL_STEPS) {
        setCurrentStep(step);
      } else {
        // Invalid step - reset to 1
        window.history.replaceState({}, '', '?order=1');
        setCurrentStep(1);
      }
    }
  }, []);

  // Update URL when step changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (parseInt(params.get('order'), 10) !== currentStep) {
      window.history.pushState({}, '', `?order=${currentStep}`);
    }
  }, [currentStep]);

  // ─────────────────────────────────────────────────────────────
  // Authentication Check
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function checkUser() {
      setIsLoadingUser(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${returnUrl}`;
        return;
      }

      setUser(currentUser);
      setIsLoadingUser(false);
    }

    checkUser();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Auto-save to localStorage
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSubmitted) return; // Don't save after submission

    const draftData = {
      formData,
      currentStep,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draftData));
  }, [formData, currentStep, isSubmitted]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const { formData: savedFormData, currentStep: savedStep, savedAt } = JSON.parse(saved);

        // Check if draft is less than 7 days old
        const savedDate = new Date(savedAt);
        const daysSinceSave = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceSave < 7) {
          setFormData(savedFormData);
          // Only restore step if no URL parameter was set
          const params = new URLSearchParams(window.location.search);
          if (!params.get('order')) {
            setCurrentStep(savedStep);
          }
        } else {
          // Clear stale draft
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      } catch (e) {
        console.error('[HostExperienceReview] Failed to load draft:', e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Derived State
  // ─────────────────────────────────────────────────────────────
  const currentStepConfig = useMemo(() => STEP_CONFIG[currentStep], [currentStep]);

  const isCurrentStepValid = useMemo(() => {
    return isStepComplete(currentStep, formData);
  }, [currentStep, formData]);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOTAL_STEPS;

  const progress = useMemo(() => {
    return Math.round((currentStep / TOTAL_STEPS) * 100);
  }, [currentStep]);

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────
  const handleFieldChange = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error for this field
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  }, [fieldErrors]);

  const validateCurrentStep = useCallback(() => {
    const errors = {};
    const stepConfig = STEP_CONFIG[currentStep];

    if (stepConfig.required) {
      for (const field of stepConfig.fields) {
        const value = formData[field];

        if (typeof value === 'string' && !value.trim()) {
          errors[field] = 'This field is required';
        } else if (typeof value === 'undefined' || value === null) {
          errors[field] = 'This field is required';
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentStep, formData]);

  const goToNextStep = useCallback(() => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, validateCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= currentStep) {
      // Can only go back to completed steps
      setCurrentStep(step);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Format payload
      const payload = formatSurveyPayload(formData);

      // Submit to Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/experience-survey`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'submit',
            payload
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit survey');
      }

      // Success!
      console.log('[HostExperienceReview] Survey submitted:', result.data.surveyId);

      // Clear localStorage draft
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      setIsSubmitted(true);

      // Redirect to thank you page or home after delay
      setTimeout(() => {
        window.location.href = '/?survey=complete';
      }, 3000);

    } catch (error) {
      console.error('[HostExperienceReview] Submit error:', error);
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateCurrentStep]);

  // ─────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────
  return {
    // State
    currentStep,
    currentStepConfig,
    formData,
    fieldErrors,
    isSubmitting,
    submitError,
    isSubmitted,
    user,
    isLoadingUser,

    // Derived
    isCurrentStepValid,
    isFirstStep,
    isLastStep,
    progress,
    totalSteps: TOTAL_STEPS,

    // Handlers
    handleFieldChange,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    handleSubmit
  };
}
```

### 5.5 Main Page Component (Hollow)

**File**: `app/src/islands/pages/HostExperienceReviewPage/HostExperienceReviewPage.jsx`

```jsx
import React from 'react';
import { useHostExperienceReviewPageLogic } from './useHostExperienceReviewPageLogic.js';
import StepProgress from './components/StepProgress.jsx';
import NavigationButtons from './components/NavigationButtons.jsx';

// Step Components
import NameStep from './components/steps/NameStep.jsx';
import ExperienceStep from './components/steps/ExperienceStep.jsx';
import PriorChallengeStep from './components/steps/PriorChallengeStep.jsx';
import ChallengeImpactStep from './components/steps/ChallengeImpactStep.jsx';
import WhatChangedStep from './components/steps/WhatChangedStep.jsx';
import WhatStoodOutStep from './components/steps/WhatStoodOutStep.jsx';
import AdditionalServiceStep from './components/steps/AdditionalServiceStep.jsx';
import PublicShareStep from './components/steps/PublicShareStep.jsx';
import RecommendationStep from './components/steps/RecommendationStep.jsx';
import ThankSomeoneStep from './components/steps/ThankSomeoneStep.jsx';
import QuestionsStep from './components/steps/QuestionsStep.jsx';

import './HostExperienceReviewPage.css';

const STEP_COMPONENTS = {
  1: NameStep,
  2: ExperienceStep,
  3: PriorChallengeStep,
  4: ChallengeImpactStep,
  5: WhatChangedStep,
  6: WhatStoodOutStep,
  7: AdditionalServiceStep,
  8: PublicShareStep,
  9: RecommendationStep,
  10: ThankSomeoneStep,
  11: QuestionsStep
};

/**
 * Host Experience Review Page
 * 11-step survey wizard for collecting host feedback
 *
 * HOLLOW COMPONENT: All logic delegated to useHostExperienceReviewPageLogic
 */
export default function HostExperienceReviewPage() {
  const logic = useHostExperienceReviewPageLogic();

  // Loading state
  if (logic.isLoadingUser) {
    return (
      <div className="host-experience-review host-experience-review--loading">
        <div className="host-experience-review__loader">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Success state
  if (logic.isSubmitted) {
    return (
      <div className="host-experience-review host-experience-review--success">
        <div className="host-experience-review__success-card">
          <div className="host-experience-review__success-icon">✓</div>
          <h1>Thank You!</h1>
          <p>Your feedback has been submitted successfully.</p>
          <p className="host-experience-review__redirect-notice">
            Redirecting you to the homepage...
          </p>
        </div>
      </div>
    );
  }

  // Get current step component
  const CurrentStepComponent = STEP_COMPONENTS[logic.currentStep];

  return (
    <div className="host-experience-review">
      <div className="host-experience-review__container">
        {/* Header */}
        <header className="host-experience-review__header">
          <h1 className="host-experience-review__title">Host Experience Review</h1>
          <p className="host-experience-review__subtitle">
            Help us improve by sharing your experience
          </p>
        </header>

        {/* Progress Indicator */}
        <StepProgress
          currentStep={logic.currentStep}
          totalSteps={logic.totalSteps}
          progress={logic.progress}
          onStepClick={logic.goToStep}
        />

        {/* Error Banner */}
        {logic.submitError && (
          <div className="host-experience-review__error-banner">
            <span className="host-experience-review__error-icon">⚠️</span>
            <span>{logic.submitError}</span>
          </div>
        )}

        {/* Step Content */}
        <main className="host-experience-review__content">
          <div className="host-experience-review__card">
            <CurrentStepComponent
              formData={logic.formData}
              fieldErrors={logic.fieldErrors}
              onFieldChange={logic.handleFieldChange}
              stepConfig={logic.currentStepConfig}
            />
          </div>
        </main>

        {/* Navigation */}
        <NavigationButtons
          isFirstStep={logic.isFirstStep}
          isLastStep={logic.isLastStep}
          isSubmitting={logic.isSubmitting}
          onBack={logic.goToPreviousStep}
          onNext={logic.goToNextStep}
          onSubmit={logic.handleSubmit}
        />
      </div>
    </div>
  );
}
```

### 5.6 Step Progress Component

**File**: `app/src/islands/pages/HostExperienceReviewPage/components/StepProgress.jsx`

```jsx
import React from 'react';
import './StepProgress.css';

/**
 * Visual progress indicator for multi-step wizard
 * Shows completed, current, and pending steps
 */
export default function StepProgress({
  currentStep,
  totalSteps,
  progress,
  onStepClick
}) {
  return (
    <div className="step-progress">
      {/* Progress Bar */}
      <div className="step-progress__bar">
        <div
          className="step-progress__bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Counter */}
      <div className="step-progress__counter">
        Step {currentStep} of {totalSteps}
      </div>

      {/* Step Dots (optional - for visual indicator) */}
      <div className="step-progress__dots">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <button
              key={stepNumber}
              className={`step-progress__dot ${
                isCompleted ? 'step-progress__dot--completed' : ''
              } ${
                isCurrent ? 'step-progress__dot--current' : ''
              }`}
              onClick={() => isCompleted && onStepClick(stepNumber)}
              disabled={!isCompleted}
              aria-label={`Step ${stepNumber}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
            >
              {isCompleted ? '✓' : stepNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### 5.7 Navigation Buttons Component

**File**: `app/src/islands/pages/HostExperienceReviewPage/components/NavigationButtons.jsx`

```jsx
import React from 'react';
import './NavigationButtons.css';

/**
 * Back/Next/Submit navigation for wizard
 */
export default function NavigationButtons({
  isFirstStep,
  isLastStep,
  isSubmitting,
  onBack,
  onNext,
  onSubmit
}) {
  return (
    <div className="navigation-buttons">
      <button
        type="button"
        className="navigation-buttons__back"
        onClick={onBack}
        disabled={isFirstStep || isSubmitting}
      >
        ← Back
      </button>

      {isLastStep ? (
        <button
          type="button"
          className="navigation-buttons__submit"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      ) : (
        <button
          type="button"
          className="navigation-buttons__next"
          onClick={onNext}
          disabled={isSubmitting}
        >
          Next →
        </button>
      )}
    </div>
  );
}
```

### 5.8 Example Step Component (Step 2 - Experience)

**File**: `app/src/islands/pages/HostExperienceReviewPage/components/steps/ExperienceStep.jsx`

```jsx
import React from 'react';
import './steps.css';

/**
 * Step 2: Experience Description (REQUIRED)
 */
export default function ExperienceStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const hasError = !!fieldErrors.experienceDescription;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__field">
        <label htmlFor="experienceDescription" className="survey-step__label">
          Your Experience
          <span className="survey-step__required">*</span>
        </label>

        <textarea
          id="experienceDescription"
          className={`survey-step__textarea ${hasError ? 'survey-step__textarea--error' : ''}`}
          value={formData.experienceDescription}
          onChange={(e) => onFieldChange('experienceDescription', e.target.value)}
          placeholder="Tell us about your experience using Split Lease..."
          rows={6}
          required
        />

        {hasError && (
          <span className="survey-step__error">
            {fieldErrors.experienceDescription}
          </span>
        )}
      </div>
    </div>
  );
}
```

### 5.9 Recommendation Step (Slider)

**File**: `app/src/islands/pages/HostExperienceReviewPage/components/steps/RecommendationStep.jsx`

```jsx
import React from 'react';
import './steps.css';

/**
 * Step 9: NPS Recommendation Score (1-10 Slider)
 */
export default function RecommendationStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const score = formData.recommendationScore || 5;

  // NPS category based on score
  const getScoreLabel = (value) => {
    if (value >= 9) return 'Promoter';
    if (value >= 7) return 'Passive';
    return 'Detractor';
  };

  const getScoreColor = (value) => {
    if (value >= 9) return '#22c55e'; // green
    if (value >= 7) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__slider-container">
        {/* Score Display */}
        <div
          className="survey-step__score-display"
          style={{ color: getScoreColor(score) }}
        >
          <span className="survey-step__score-number">{score}</span>
          <span className="survey-step__score-label">{getScoreLabel(score)}</span>
        </div>

        {/* Slider */}
        <input
          type="range"
          id="recommendationScore"
          className="survey-step__slider"
          min="1"
          max="10"
          step="1"
          value={score}
          onChange={(e) => onFieldChange('recommendationScore', parseInt(e.target.value, 10))}
        />

        {/* Scale Labels */}
        <div className="survey-step__slider-labels">
          <span>1 - Not likely</span>
          <span>10 - Very likely</span>
        </div>
      </div>
    </div>
  );
}
```

### 5.10 Public Share Step (Boolean Toggle)

**File**: `app/src/islands/pages/HostExperienceReviewPage/components/steps/PublicShareStep.jsx`

```jsx
import React from 'react';
import './steps.css';

/**
 * Step 8: Permission to Share Publicly (Boolean)
 */
export default function PublicShareStep({
  formData,
  fieldErrors,
  onFieldChange,
  stepConfig
}) {
  const canShare = formData.canSharePublicly;

  return (
    <div className="survey-step">
      <h2 className="survey-step__title">{stepConfig.title}</h2>
      <p className="survey-step__subtitle">{stepConfig.subtitle}</p>

      <div className="survey-step__toggle-container">
        <button
          type="button"
          className={`survey-step__toggle-option ${canShare ? 'survey-step__toggle-option--selected' : ''}`}
          onClick={() => onFieldChange('canSharePublicly', true)}
        >
          <span className="survey-step__toggle-icon">✓</span>
          <span>Yes, you can share my feedback</span>
        </button>

        <button
          type="button"
          className={`survey-step__toggle-option ${!canShare ? 'survey-step__toggle-option--selected' : ''}`}
          onClick={() => onFieldChange('canSharePublicly', false)}
        >
          <span className="survey-step__toggle-icon">✗</span>
          <span>No, keep my feedback private</span>
        </button>
      </div>

      <p className="survey-step__privacy-note">
        If you agree, we may use your feedback in marketing materials,
        testimonials, or case studies. Your personal information will
        never be shared without your consent.
      </p>
    </div>
  );
}
```

---

## 6. LOGIC LAYER IMPLEMENTATION

### 6.1 Step Validation Rule

**File**: `app/src/logic/rules/experienceSurvey/isStepComplete.js`

```javascript
import { STEP_CONFIG } from '../../../islands/pages/HostExperienceReviewPage/constants.js';

/**
 * Validates if a specific step is complete
 *
 * @param {number} stepNumber - The step number (1-11)
 * @param {object} formData - Current form data
 * @returns {boolean} - Whether the step is complete
 */
export function isStepComplete(stepNumber, formData) {
  const stepConfig = STEP_CONFIG[stepNumber];

  if (!stepConfig) {
    return false;
  }

  // If step is not required, it's always complete
  if (!stepConfig.required) {
    return true;
  }

  // Check all required fields
  for (const field of stepConfig.fields) {
    const value = formData[field];

    // Handle different types
    if (typeof value === 'string') {
      if (!value.trim()) return false;
    } else if (typeof value === 'boolean') {
      // Booleans are always valid (true or false)
      continue;
    } else if (typeof value === 'number') {
      if (isNaN(value)) return false;
    } else if (value === undefined || value === null) {
      return false;
    }
  }

  return true;
}
```

### 6.2 Survey Payload Processor

**File**: `app/src/logic/processors/experienceSurvey/formatSurveyPayload.js`

```javascript
/**
 * Formats and sanitizes survey form data for API submission
 *
 * @param {object} formData - Raw form data
 * @returns {object} - Cleaned payload for Edge Function
 */
export function formatSurveyPayload(formData) {
  return {
    hostName: sanitizeText(formData.hostName),
    experienceDescription: sanitizeText(formData.experienceDescription),
    priorChallenge: sanitizeText(formData.priorChallenge),
    challengeImpact: sanitizeText(formData.challengeImpact),
    whatChanged: sanitizeText(formData.whatChanged),
    whatStoodOut: sanitizeText(formData.whatStoodOut),
    additionalServiceNeeded: sanitizeText(formData.additionalServiceNeeded),
    canSharePublicly: Boolean(formData.canSharePublicly),
    recommendationScore: parseScore(formData.recommendationScore),
    staffToThank: sanitizeText(formData.staffToThank),
    additionalQuestions: sanitizeText(formData.additionalQuestions)
  };
}

/**
 * Sanitizes text input - trims whitespace and normalizes empty strings to null
 */
function sanitizeText(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Parses and validates recommendation score
 */
function parseScore(value) {
  const score = parseInt(value, 10);
  if (isNaN(score) || score < 1 || score > 10) {
    return null;
  }
  return score;
}
```

---

## 7. STYLING

### 7.1 Main Page Styles

**File**: `app/src/islands/pages/HostExperienceReviewPage/HostExperienceReviewPage.css`

```css
.host-experience-review {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fc 0%, #eef2ff 100%);
  padding: 2rem 1rem;
}

.host-experience-review__container {
  max-width: 680px;
  margin: 0 auto;
}

/* Header */
.host-experience-review__header {
  text-align: center;
  margin-bottom: 2rem;
}

.host-experience-review__title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.host-experience-review__subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

/* Card */
.host-experience-review__card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
  margin-bottom: 1.5rem;
}

/* Error Banner */
.host-experience-review__error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #dc2626;
}

/* Loading State */
.host-experience-review--loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.host-experience-review__loader {
  text-align: center;
  color: #64748b;
}

/* Success State */
.host-experience-review--success {
  display: flex;
  align-items: center;
  justify-content: center;
}

.host-experience-review__success-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  text-align: center;
  max-width: 400px;
}

.host-experience-review__success-icon {
  width: 80px;
  height: 80px;
  background: #22c55e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2.5rem;
  color: white;
}

.host-experience-review__redirect-notice {
  font-size: 0.875rem;
  color: #94a3b8;
  margin-top: 1rem;
}
```

### 7.2 Step Progress Styles

**File**: `app/src/islands/pages/HostExperienceReviewPage/components/StepProgress.css`

```css
.step-progress {
  margin-bottom: 2rem;
}

.step-progress__bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.step-progress__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.step-progress__counter {
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.step-progress__dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.step-progress__dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.step-progress__dot--completed {
  background: #8b5cf6;
  border-color: #8b5cf6;
  color: white;
  cursor: pointer;
}

.step-progress__dot--completed:hover {
  transform: scale(1.1);
}

.step-progress__dot--current {
  border-color: #8b5cf6;
  color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}
```

### 7.3 Step Content Styles

**File**: `app/src/islands/pages/HostExperienceReviewPage/components/steps/steps.css`

```css
.survey-step {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.survey-step__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.survey-step__subtitle {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0 0 1.5rem;
}

.survey-step__field {
  margin-bottom: 1rem;
}

.survey-step__label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.5rem;
}

.survey-step__required {
  color: #ef4444;
  margin-left: 0.25rem;
}

.survey-step__input,
.survey-step__textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  font-family: inherit;
}

.survey-step__input:focus,
.survey-step__textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}

.survey-step__input--error,
.survey-step__textarea--error {
  border-color: #ef4444;
}

.survey-step__input--error:focus,
.survey-step__textarea--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.survey-step__textarea {
  resize: vertical;
  min-height: 120px;
}

.survey-step__error {
  display: block;
  font-size: 0.8125rem;
  color: #ef4444;
  margin-top: 0.375rem;
}

/* Slider Styles (Step 9) */
.survey-step__slider-container {
  padding: 1rem 0;
}

.survey-step__score-display {
  text-align: center;
  margin-bottom: 1.5rem;
}

.survey-step__score-number {
  font-size: 4rem;
  font-weight: 700;
  line-height: 1;
  display: block;
}

.survey-step__score-label {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.8;
}

.survey-step__slider {
  width: 100%;
  height: 8px;
  appearance: none;
  background: #e2e8f0;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}

.survey-step__slider::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  background: #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4);
  transition: transform 0.2s ease;
}

.survey-step__slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.survey-step__slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Toggle Styles (Step 8) */
.survey-step__toggle-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.survey-step__toggle-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  text-align: left;
}

.survey-step__toggle-option:hover {
  border-color: #cbd5e1;
}

.survey-step__toggle-option--selected {
  border-color: #8b5cf6;
  background: #f5f3ff;
}

.survey-step__toggle-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #64748b;
}

.survey-step__toggle-option--selected .survey-step__toggle-icon {
  background: #8b5cf6;
  color: white;
}

.survey-step__privacy-note {
  font-size: 0.8125rem;
  color: #94a3b8;
  line-height: 1.5;
}
```

### 7.4 Navigation Button Styles

**File**: `app/src/islands/pages/HostExperienceReviewPage/components/NavigationButtons.css`

```css
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.navigation-buttons__back,
.navigation-buttons__next,
.navigation-buttons__submit {
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.navigation-buttons__back {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  color: #64748b;
}

.navigation-buttons__back:hover:not(:disabled) {
  border-color: #cbd5e1;
  color: #475569;
}

.navigation-buttons__back:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.navigation-buttons__next {
  background: #8b5cf6;
  border: 2px solid #8b5cf6;
  color: white;
  margin-left: auto;
}

.navigation-buttons__next:hover:not(:disabled) {
  background: #7c3aed;
  border-color: #7c3aed;
}

.navigation-buttons__submit {
  background: #22c55e;
  border: 2px solid #22c55e;
  color: white;
  margin-left: auto;
}

.navigation-buttons__submit:hover:not(:disabled) {
  background: #16a34a;
  border-color: #16a34a;
}

.navigation-buttons__submit:disabled,
.navigation-buttons__next:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
```

---

## 8. TESTING PLAN

### 8.1 Manual Testing Checklist

- [ ] Page loads with `?order=1` URL parameter
- [ ] Progress bar updates correctly as user advances
- [ ] Back button disabled on Step 1
- [ ] Next button validates required fields (Step 2)
- [ ] URL updates when navigating between steps
- [ ] Form data persists in localStorage
- [ ] Form data survives page refresh
- [ ] Draft auto-loads on return visit
- [ ] Recommendation slider works (1-10)
- [ ] Public share toggle works
- [ ] Submit button appears on Step 11
- [ ] Submission creates database record
- [ ] Confirmation email sent to user
- [ ] Low NPS score triggers admin notification
- [ ] Success screen displays after submission
- [ ] Redirect to homepage after 3 seconds
- [ ] localStorage cleared after successful submission

### 8.2 Edge Cases

- [ ] User not authenticated → redirects to login
- [ ] Session expires mid-form → graceful error handling
- [ ] Network failure during submit → error message, form state preserved
- [ ] Invalid step number in URL → resets to Step 1
- [ ] Stale draft (>7 days old) → cleared automatically
- [ ] Mobile responsive layout
- [ ] Keyboard navigation works (Tab, Enter)

---

## 9. DEPLOYMENT CHECKLIST

### 9.1 Pre-Deployment

1. [ ] Add route to `app/src/routes.config.js`
2. [ ] Run `bun run generate-routes`
3. [ ] Create all component files
4. [ ] Create Edge Function
5. [ ] Create database migration
6. [ ] Run migration: `supabase migration up`
7. [ ] Test locally with `bun run dev`
8. [ ] Test Edge Function: `supabase functions serve experience-survey`

### 9.2 Deployment

1. [ ] Deploy Edge Function: `supabase functions deploy experience-survey`
2. [ ] Build frontend: `bun run build`
3. [ ] Deploy to Cloudflare: `npx wrangler pages deploy dist --project-name splitlease`
4. [ ] Verify in production

### 9.3 Post-Deployment

1. [ ] Test full flow in production
2. [ ] Verify email delivery
3. [ ] Check Slack notifications for errors
4. [ ] Monitor database for new records

---

## 10. FUTURE ENHANCEMENTS (Out of Scope)

- Draft saving to database (for cross-device continuity)
- Analytics integration (track drop-off rates per step)
- A/B testing different question orders
- Admin dashboard for viewing survey responses
- Export survey data to CSV
- NPS trend reporting

---

## 11. FILES TO CREATE SUMMARY

| Category | File Count |
|----------|------------|
| HTML/JSX Entry Points | 2 |
| Page Component + Logic | 3 |
| Step Components (11 steps) | 11 |
| Supporting Components | 4 |
| CSS Files | 5 |
| Logic Layer | 2 |
| Edge Function | 1 |
| Database Migration | 1 |
| **TOTAL** | **29 files** |

---

## Approval Request

This plan covers the complete implementation of the Host Experience Review page, mapping all 11 Bubble steps to React components following Split Lease's Islands Architecture.

**Ready for execution when approved.**

---

*Plan created by Claude Opus 4.5*
*January 27, 2026*
