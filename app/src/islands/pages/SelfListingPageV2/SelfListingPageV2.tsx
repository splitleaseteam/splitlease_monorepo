/**
 * SelfListingPageV2 - Simplified 8-step listing creation flow
 *
 * Steps:
 * 1. Host Type - resident, liveout, coliving, agent
 * 2. Market Strategy - private (concierge) or public (marketplace)
 * 3. Listing Strategy - nightly/weekly/monthly with conditional content
 * 4. Pricing Strategy - V5 Calculator (nightly only)
 * 5. Financials - rent, utilities, deposit, cleaning (weekly/monthly only)
 * 6. Space & Time - property type, location, bedrooms, bathrooms
 * 7. Photos - optional photo upload
 * 8. Review & Activate - preview and submit
 */

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Header from '../../shared/Header.jsx';
import SignUpLoginModal from '../../shared/AuthSignupLoginOAuthResetFlowModal';
import Toast from '../../shared/Toast.jsx';
import InformationalText from '../../shared/InformationalText.jsx';
import { useSelfListingV2Logic } from './useSelfListingV2Logic';
import {
  Step1HostType,
  Step2MarketStrategy,
  Step3ListingStrategy,
  Step4NightlyPricing,
  Step5Financials,
  Step6SpaceAndTime,
  Step7Photos,
  Step8Review,
} from './steps';
import './styles/SelfListingPageV2.css';
import '../../../styles/components/toast.css';

// Declare google as a global for TypeScript
declare global {
  interface Window {
    google: typeof google;
  }
}

export function SelfListingPageV2() {
  const logic = useSelfListingV2Logic();

  // Render current step
  const renderCurrentStep = () => {
    switch (logic.currentStep) {
      case 1:
        return (
          <Step1HostType
            formData={logic.formData}
            updateFormData={logic.updateFormData}
            onNext={logic.nextStep}
          />
        );
      case 2:
        return (
          <Step2MarketStrategy
            formData={logic.formData}
            updateFormData={logic.updateFormData}
            onNext={logic.nextStep}
            onBack={logic.prevStep}
          />
        );
      case 3:
        return (
          <Step3ListingStrategy
            formData={logic.formData}
            updateFormData={logic.updateFormData}
            validationErrors={logic.validationErrors}
            setValidationErrors={logic.setValidationErrors}
            handleNightSelectionChange={logic.handleNightSelectionChange}
            getScheduleText={logic.getScheduleText}
            handleInfoClick={logic.handleInfoClick}
            leaseStyleNightlyInfoRef={logic.leaseStyleNightlyInfoRef}
            leaseStyleWeeklyInfoRef={logic.leaseStyleWeeklyInfoRef}
            leaseStyleMonthlyInfoRef={logic.leaseStyleMonthlyInfoRef}
            onNext={logic.nextStep}
            onBack={logic.prevStep}
          />
        );
      case 4:
        return (
          <Step4NightlyPricing
            formData={logic.formData}
            updateFormData={logic.updateFormData}
            nightlyPricesRef={logic.nightlyPricesRef}
            getPlatformMultiplier={logic.getPlatformMultiplier}
            handleInfoClick={logic.handleInfoClick}
            baseNightlyRateInfoRef={logic.baseNightlyRateInfoRef}
            longStayDiscountInfoRef={logic.longStayDiscountInfoRef}
            damageDepositInfoRef={logic.damageDepositInfoRef}
            cleaningFeeInfoRef={logic.cleaningFeeInfoRef}
            onNext={logic.nextStep}
            onBack={logic.prevStep}
          />
        );
      case 5:
        return (
          <Step5Financials
            formData={logic.formData}
            updateFormData={logic.updateFormData}
            validationErrors={logic.validationErrors}
            setValidationErrors={logic.setValidationErrors}
            handleInfoClick={logic.handleInfoClick}
            desiredRentInfoRef={logic.desiredRentInfoRef}
            securityDepositInfoRef={logic.securityDepositInfoRef}
            cleaningFeeInfoRef={logic.cleaningFeeInfoRef}
            onNext={logic.nextStep}
            onBack={logic.prevStep}
          />
        );
      case 6:
        return (
          <Step6SpaceAndTime
            formData={logic.formData}
            updateFormData={logic.updateFormData}
            validationErrors={logic.validationErrors}
            setValidationErrors={logic.setValidationErrors}
            addressInputRef={logic.addressInputRef}
            addressError={logic.addressError}
            isAddressValid={logic.isAddressValid}
            handleAddressInputChange={logic.handleAddressInputChange}
            onNext={logic.nextStep}
            onBack={logic.prevStep}
          />
        );
      case 7:
        return (
          <Step7Photos
            formData={logic.formData}
            updateFormData={logic.updateFormData}
            isMobile={logic.isMobile}
            handleContinueOnPhone={logic.handleContinueOnPhone}
            onNext={logic.nextStep}
            onSkip={logic.skipStep}
            onBack={logic.prevStep}
          />
        );
      case 8:
        return (
          <Step8Review
            formData={logic.formData}
            nightlyPricesRef={logic.nightlyPricesRef}
            getScheduleText={logic.getScheduleText}
            handleInfoClick={logic.handleInfoClick}
            scheduleInfoRef={logic.scheduleInfoRef}
            isSubmitting={logic.isSubmitting}
            handleSubmit={logic.handleSubmit}
            onBack={logic.prevStep}
          />
        );
      default:
        return (
          <Step1HostType
            formData={logic.formData}
            updateFormData={logic.updateFormData}
            onNext={logic.nextStep}
          />
        );
    }
  };

  // Success Modal
  const renderSuccessModal = () => (
    <div className="success-modal-overlay">
      <div className="success-modal">
        <div className="success-icon">✓</div>
        <h2>Success!</h2>
        <p>Your request has been sent to our concierge team.</p>
        <div className="success-actions">
          <a href={logic.createdListingId ? `/listing-dashboard?id=${logic.createdListingId}` : '/listing-dashboard'} className="btn-next">Go to My Dashboard</a>
          {logic.createdListingId && (
            <a
              href={`/preview-split-lease?id=${logic.createdListingId}`}
              className="btn-next btn-secondary"
            >
              Preview Listing
            </a>
          )}
          <a
            href="/host-proposals"
            className="btn-next btn-secondary"
          >
            View Your Proposals
          </a>
        </div>
      </div>
    </div>
  );

  // Continue on Phone Modal
  const renderContinueOnPhoneModal = () => {
    const copyToClipboard = () => {
      if (!logic.continueOnPhoneLink) return;
      navigator.clipboard.writeText(logic.continueOnPhoneLink).then(() => {
        logic.showToast('Link copied to clipboard!', 'success', 3000);
      }).catch(() => {
        logic.showToast('Failed to copy link', 'error', 3000);
      });
    };

    const handleCloseModal = () => {
      logic.setShowContinueOnPhoneModal(false);
      logic.setContinueOnPhoneLink(null);
    };

    const formatPhoneNumber = (value: string) => {
      const digits = value.replace(/\D/g, '');
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      logic.setPhoneNumber(formatted);
    };

    const handleSendLink = () => {
      const cleanPhone = logic.phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        logic.showToast('Please enter a valid 10-digit phone number', 'error', 4000);
        return;
      }
      logic.showToast('Magic link will be sent to your phone shortly!', 'success', 4000);
    };

    return (
      <div className="success-modal-overlay" onClick={handleCloseModal}>
        <div className="continue-phone-modal" onClick={(e) => e.stopPropagation()}>
          <button
            className="modal-close-btn"
            onClick={handleCloseModal}
            aria-label="Close modal"
          >
            ×
          </button>
          <h2>Continue on Your Phone</h2>
          <p>
            {logic.isSavingDraft
              ? 'Saving your progress...'
              : 'Your progress has been saved! Scan the QR code or enter your phone number to receive a magic link.'}
          </p>

          {/* QR Code Section */}
          <div className="qr-placeholder">
            <div className="qr-code-box">
              {logic.isSavingDraft ? (
                <div className="qr-loading">
                  <div className="spinner"></div>
                  <p>Saving your progress...</p>
                </div>
              ) : logic.continueOnPhoneLink ? (
                <>
                  <QRCodeSVG
                    value={logic.continueOnPhoneLink}
                    size={160}
                    level="M"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#1f2937"
                  />
                  <p className="qr-hint">Scan to upload photos from your phone</p>
                </>
              ) : (
                <div className="qr-error">
                  <p>Failed to generate QR code</p>
                  <button onClick={logic.saveDraftAndGenerateLink} className="btn-retry">
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Phone Number Input Section */}
          <div className="phone-input-section">
            <label>Or send link to your phone:</label>
            <div className="phone-input-row">
              <input
                type="tel"
                value={logic.phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(555) 555-5555"
                className="phone-input"
                maxLength={14}
              />
              <button
                type="button"
                className="btn-send-link"
                onClick={handleSendLink}
                disabled={logic.isSavingDraft || !logic.continueOnPhoneLink}
              >
                Send Link
              </button>
            </div>
            {logic.userPhoneNumber && logic.phoneNumber === logic.userPhoneNumber && (
              <p className="phone-hint">Using your account phone number</p>
            )}
          </div>

          {/* Copy Link Section */}
          <div className="continue-link-section">
            <label>Or copy this link:</label>
            <div className="link-copy-row">
              <input
                type="text"
                value={logic.continueOnPhoneLink || 'Generating link...'}
                readOnly
                className="continue-link-input"
              />
              <button
                type="button"
                className="btn-copy"
                onClick={copyToClipboard}
                disabled={!logic.continueOnPhoneLink}
              >
                Copy
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="btn-next btn-secondary"
              onClick={handleCloseModal}
            >
              Continue Here Instead
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show loading state while checking access
  if (logic.isCheckingAccess) {
    return (
      <div className="self-listing-v2-page">
        <Header />
        <main className="self-listing-v2-main">
          <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="self-listing-v2-page">
      <Header key={logic.headerKey} autoShowLogin={false} />

      <main className="self-listing-v2-main">
        <div className="container">
          <div className="header-section">
            <h1>Listing Setup</h1>
            <p>Let's find your perfect match.</p>
          </div>

          <div className="progress-container">
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${logic.progressPercentage}%` }} />
            </div>
            <div className="step-indicator">
              Step {logic.getDisplayStep(logic.currentStep)} of 7
            </div>
          </div>

          {renderCurrentStep()}
        </div>
      </main>

      {logic.showAuthModal && (
        <SignUpLoginModal
          isOpen={logic.showAuthModal}
          onClose={() => {
            logic.setShowAuthModal(false);
            logic.setPendingSubmit(false);
          }}
          initialView="identity"
          defaultUserType="host"
          skipReload={true}
          onAuthSuccess={logic.handleAuthSuccess}
        />
      )}

      {logic.submitSuccess && renderSuccessModal()}

      {logic.showContinueOnPhoneModal && renderContinueOnPhoneModal()}

      {/* Toast Notifications */}
      <Toast toasts={logic.toasts} onRemove={logic.removeToast} />

      {/* Informational Text Tooltips */}
      <InformationalText
        isOpen={logic.activeInfoTooltip === 'leaseStyleNightly'}
        onClose={() => logic.setActiveInfoTooltip(null)}
        triggerRef={logic.leaseStyleNightlyInfoRef}
        title={logic.getInfoContent('leaseStyleNightly').title}
        content={logic.getInfoContent('leaseStyleNightly').content}
        expandedContent={logic.getInfoContent('leaseStyleNightly').expandedContent}
        showMoreAvailable={logic.getInfoContent('leaseStyleNightly').showMore}
      />

      <InformationalText
        isOpen={logic.activeInfoTooltip === 'leaseStyleWeekly'}
        onClose={() => logic.setActiveInfoTooltip(null)}
        triggerRef={logic.leaseStyleWeeklyInfoRef}
        title={logic.getInfoContent('leaseStyleWeekly').title}
        content={logic.getInfoContent('leaseStyleWeekly').content}
        expandedContent={logic.getInfoContent('leaseStyleWeekly').expandedContent}
        showMoreAvailable={logic.getInfoContent('leaseStyleWeekly').showMore}
      />

      <InformationalText
        isOpen={logic.activeInfoTooltip === 'leaseStyleMonthly'}
        onClose={() => logic.setActiveInfoTooltip(null)}
        triggerRef={logic.leaseStyleMonthlyInfoRef}
        title={logic.getInfoContent('leaseStyleMonthly').title}
        content={logic.getInfoContent('leaseStyleMonthly').content}
        expandedContent={logic.getInfoContent('leaseStyleMonthly').expandedContent}
        showMoreAvailable={logic.getInfoContent('leaseStyleMonthly').showMore}
      />

      <InformationalText
        isOpen={logic.activeInfoTooltip === 'baseNightlyRate'}
        onClose={() => logic.setActiveInfoTooltip(null)}
        triggerRef={logic.baseNightlyRateInfoRef}
        title={logic.getInfoContent('baseNightlyRate').title}
        content={logic.getInfoContent('baseNightlyRate').content}
        expandedContent={logic.getInfoContent('baseNightlyRate').expandedContent}
        showMoreAvailable={logic.getInfoContent('baseNightlyRate').showMore}
      />

      <InformationalText
        isOpen={logic.activeInfoTooltip === 'longStayDiscount'}
        onClose={() => logic.setActiveInfoTooltip(null)}
        triggerRef={logic.longStayDiscountInfoRef}
        title={logic.getInfoContent('longStayDiscount').title}
        content={logic.getInfoContent('longStayDiscount').content}
        expandedContent={logic.getInfoContent('longStayDiscount').expandedContent}
        showMoreAvailable={logic.getInfoContent('longStayDiscount').showMore}
      />

      <InformationalText
        isOpen={logic.activeInfoTooltip === 'damageDeposit'}
        onClose={() => logic.setActiveInfoTooltip(null)}
        triggerRef={logic.damageDepositInfoRef}
        title={logic.getInfoContent('damageDeposit').title}
        content={logic.getInfoContent('damageDeposit').content}
        expandedContent={logic.getInfoContent('damageDeposit').expandedContent}
        showMoreAvailable={logic.getInfoContent('damageDeposit').showMore}
      />

      <InformationalText
        isOpen={logic.activeInfoTooltip === 'cleaningFee'}
        onClose={() => logic.setActiveInfoTooltip(null)}
        triggerRef={logic.cleaningFeeInfoRef}
        title={logic.getInfoContent('cleaningFee').title}
        content={logic.getInfoContent('cleaningFee').content}
        expandedContent={logic.getInfoContent('cleaningFee').expandedContent}
        showMoreAvailable={logic.getInfoContent('cleaningFee').showMore}
      />

      <InformationalText
        isOpen={logic.activeInfoTooltip === 'desiredRent'}
        onClose={() => logic.setActiveInfoTooltip(null)}
        triggerRef={logic.desiredRentInfoRef}
        title={logic.getInfoContent('desiredRent').title}
        content={logic.getInfoContent('desiredRent').content}
        expandedContent={logic.getInfoContent('desiredRent').expandedContent}
        showMoreAvailable={logic.getInfoContent('desiredRent').showMore}
      />

      <InformationalText
        isOpen={logic.activeInfoTooltip === 'securityDeposit'}
        onClose={() => logic.setActiveInfoTooltip(null)}
        triggerRef={logic.securityDepositInfoRef}
        title={logic.getInfoContent('securityDeposit').title}
        content={logic.getInfoContent('securityDeposit').content}
        expandedContent={logic.getInfoContent('securityDeposit').expandedContent}
        showMoreAvailable={logic.getInfoContent('securityDeposit').showMore}
      />

      <InformationalText
        isOpen={logic.activeInfoTooltip === 'utilities'}
        onClose={() => logic.setActiveInfoTooltip(null)}
        triggerRef={logic.utilitiesInfoRef}
        title={logic.getInfoContent('utilities').title}
        content={logic.getInfoContent('utilities').content}
        expandedContent={logic.getInfoContent('utilities').expandedContent}
        showMoreAvailable={logic.getInfoContent('utilities').showMore}
      />

      <InformationalText
        isOpen={logic.activeInfoTooltip === 'schedule'}
        onClose={() => logic.setActiveInfoTooltip(null)}
        triggerRef={logic.scheduleInfoRef}
        title={logic.getInfoContent('schedule').title}
        content={logic.getInfoContent('schedule').content}
        expandedContent={logic.getInfoContent('schedule').expandedContent}
        showMoreAvailable={logic.getInfoContent('schedule').showMore}
      />
    </div>
  );
}

export default SelfListingPageV2;
