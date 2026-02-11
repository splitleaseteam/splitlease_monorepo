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
