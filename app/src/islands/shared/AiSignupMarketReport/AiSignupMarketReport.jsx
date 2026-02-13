import Toast from '../Toast.jsx';
import { FreeformInput, ContactForm } from './MarketReportFormElements.jsx';
import { ParsingStage, LoadingStage, FinalMessage, EmailExistsMessage, NavigationButtons } from './MarketReportStages.jsx';
import { useMarketReportLogic } from './useMarketReportLogic.js';
import './AiSignupMarketReport.css';

/**
 * AiSignupMarketReport - Advanced AI-powered market research signup modal
 *
 * Features:
 * - Smart email/phone/name extraction from freeform text
 * - Auto-correction for common email typos
 * - Incomplete phone number handling
 * - Automatic user account creation with generated password (SL{name}77)
 * - Three Lottie animations (parsing, loading, success)
 * - Dynamic form flow based on data quality
 * - Integrated with Bubble.io workflow
 *
 * Props:
 * - isOpen: boolean - Whether the modal is open
 * - onClose: function - Callback when modal is closed
 * - onSubmit: function (optional) - Custom submit handler
 */

export default function AiSignupMarketReport({ isOpen, onClose, _onSubmit }) {
  const {
    state,
    toasts,
    removeToast,
    updateFormData,
    handleNext,
    handleBack,
    handleSubmit,
    handleLoginClick,
    getButtonText,
  } = useMarketReportLogic({ isOpen, onClose });

  if (!isOpen) return null;

  const showNavigation = state.currentSection !== 'final' &&
                        state.currentSection !== 'loading' &&
                        state.currentSection !== 'parsing' &&
                        state.currentSection !== 'emailExists';

  return (
    <div
      className="ai-signup-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="ai-signup-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="modal-grab-handle" aria-hidden="true" />

        {/* Header */}
        <div className="ai-signup-header">
          <div className="ai-signup-icon-wrapper">
            <svg
              className="ai-signup-icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h2 id="modal-title" className="ai-signup-title">
            <span className="title-desktop">Market Research for Lodging, Storage, Transport, Restaurants and more</span>
            <span className="title-mobile">Market Research</span>
          </h2>
          <button
            className="ai-signup-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content Sections */}
        <div className="ai-signup-content">
          {state.currentSection === 'freeform' && (
            <FreeformInput
              value={state.formData.marketResearchText || ''}
              onChange={(text) => updateFormData({ marketResearchText: text })}
            />
          )}

          {state.currentSection === 'contact' && (
            <ContactForm
              email={state.formData.email || ''}
              phone={state.formData.phone || ''}
              onEmailChange={(email) => updateFormData({ email })}
              onPhoneChange={(phone) => updateFormData({ phone })}
            />
          )}

          {state.currentSection === 'parsing' && <ParsingStage />}
          {state.currentSection === 'loading' && <LoadingStage message="We are processing your request" />}
          {state.currentSection === 'emailExists' && (
            <EmailExistsMessage
              email={state.existingEmail}
              onLoginClick={handleLoginClick}
            />
          )}
          {state.currentSection === 'final' && (
            <FinalMessage
              message="Your account has been created successfully!"
              isAsync={state.isAsyncProcessing}
            />
          )}
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="ai-signup-error" role="alert">
            <strong>Error:</strong> {state.error}
          </div>
        )}

        {/* Navigation Buttons */}
        {showNavigation && (
          <NavigationButtons
            showBack={state.currentSection === 'contact'}
            onBack={handleBack}
            onNext={state.currentSection === 'contact' ? handleSubmit : handleNext}
            nextLabel={getButtonText()}
            isLoading={state.isLoading}
          />
        )}

        {/* Final close button */}
        {state.currentSection === 'final' && (
          <div className="ai-signup-final-button-wrapper">
            <button
              className="ai-signup-final-close-button"
              onClick={() => { window.location.reload(); }}
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Toast notifications (rendered here as fallback when no ToastProvider) */}
      {toasts && toasts.length > 0 && <Toast toasts={toasts} onRemove={removeToast} />}
    </div>
  );
}
