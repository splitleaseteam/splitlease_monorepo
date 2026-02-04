/**
 * GuestExperienceReviewPage - Hollow component (presentational only)
 *
 * All logic lives in useGuestExperienceReviewPageLogic hook.
 * This component only renders UI based on state from the hook.
 *
 * 11-step survey wizard for collecting guest feedback.
 */

import React from 'react';
import { useGuestExperienceReviewPageLogic } from './useGuestExperienceReviewPageLogic';
import Header from '../../shared/Header';
import NavigationButtons from './components/NavigationButtons';
import StepIndicator from './components/StepIndicator';

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

export default function GuestExperienceReviewPage({ requireAuth = true, isAuthenticated = false }) {
  const logic = useGuestExperienceReviewPageLogic();

  const {
    currentStep,
    totalSteps,
    steps,
    formData,
    updateField,
    handleBack,
    handleNext,
    isSubmitting,
    isComplete,
    isLoading,
    // Referral
    referralEmail,
    setReferralEmail,
    handleSubmitReferral,
    isSubmittingReferral,
  } = logic;

  // Get current step component
  const StepComponent = STEP_COMPONENTS[currentStep];

  // Show completion state
  if (isComplete) {
    return (
      <div className="guest-experience-review-page">
        <Header autoShowLogin={requireAuth && !isAuthenticated} />
        <main className="survey-container survey-complete">
          <div className="completion-content">
            <div className="completion-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1>Thank You!</h1>
            <p className="completion-message">
              Your feedback helps us improve Split Lease for everyone.
            </p>
            <p className="redirect-notice">Redirecting to homepage...</p>
          </div>
        </main>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="guest-experience-review-page">
        <Header autoShowLogin={requireAuth && !isAuthenticated} />
        <main className="survey-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="guest-experience-review-page">
      <Header autoShowLogin={requireAuth && !isAuthenticated} />

      <main className="survey-container">
        <div className="survey-content">
          <h1 className="survey-title">Guest Experience Review</h1>

          {/* Step indicator (numbered steps like rental application wizard) */}
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            steps={steps}
          />

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
            totalSteps={totalSteps}
            onBack={handleBack}
            onNext={handleNext}
            isSubmitting={isSubmitting}
            isLastStep={currentStep === totalSteps}
          />
        </div>
      </main>
    </div>
  );
}
