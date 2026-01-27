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
