/**
 * Z-Unit ChatGPT Models Test Page
 *
 * Internal test page for comparing multiple ChatGPT models.
 * Follows the Hollow Component Pattern - ALL logic in useZUnitChatgptModelsPageLogic hook.
 *
 * Route: /_internal/z-unit-chatgpt-models
 * Auth: None (internal test page)
 *
 * Test Sections:
 * 1. Freeform 4o - Functional test (uses 4o-mini model)
 * 2. Freeform 01-mini - Functional test
 * 3. Freeform o1 - (did not work as of 1/13/25)
 * 4. GPT 4.1 - Image Parse - Image URL parsing test (uses gpt-4.1-mini)
 */

import { useZUnitChatgptModelsPageLogic } from './useZUnitChatgptModelsPageLogic.js';
import './ZUnitChatgptModelsPage.css';

// Loading component with spinner animation
function LoadingSpinner() {
  return (
    <div className="zucm-loading">
      <div className="zucm-spinner"></div>
      <span>Processing...</span>
    </div>
  );
}

// Error message component with red styling
function ErrorMessage({ message }) {
  return (
    <div className="zucm-error">
      {message}
    </div>
  );
}

// Response display component
function ResponseDisplay({ response }) {
  if (!response) {
    return null;
  }

  return (
    <div className="zucm-response">
      <div className="zucm-response-label">Response:</div>
      <div className="zucm-response-content">{response}</div>
    </div>
  );
}

/**
 * Reusable test section component
 * @param {Object} props - Component props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle/description
 * @param {string} props.prompt - Current prompt value
 * @param {Function} props.onPromptChange - Prompt change handler
 * @param {string} props.response - API response text
 * @param {boolean} props.loading - Loading state
 * @param {string|null} props.error - Error message
 * @param {Function} props.onTest - Test button click handler
 * @param {boolean} [props.isImageTest=false] - Whether this is an image test section
 * @param {string} [props.imageUrl] - Image URL (for image test sections)
 * @param {Function} [props.onImageUrlChange] - Image URL change handler
 * @param {string} [props.buttonLabel] - Custom button label (overrides default)
 */
function TestSection({
  title,
  subtitle,
  prompt,
  onPromptChange,
  response,
  loading,
  error,
  onTest,
  isImageTest = false,
  imageUrl,
  onImageUrlChange,
  buttonLabel: customButtonLabel
}) {
  const buttonLabel = customButtonLabel || (isImageTest ? 'Test gpt-4.1-mini Image Parse' : `Test ${title.split(' ').pop()}`);

  return (
    <div className="zucm-section">
      <div className="zucm-section-header">
        <h2 className="zucm-section-title">{title}</h2>
        {subtitle && <p className="zucm-section-subtitle">{subtitle}</p>}
      </div>

      <div className="zucm-section-body">
        {/* Image URL input for image test sections */}
        {isImageTest && (
          <div className="zucm-form-group">
            <label className="zucm-label">Image URL</label>
            <input
              type="text"
              className="zucm-input"
              placeholder="Enter image URL..."
              value={imageUrl || ''}
              onChange={(e) => onImageUrlChange(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        {/* Prompt textarea */}
        <div className="zucm-form-group">
          <label className="zucm-label">
            {isImageTest ? 'Prompt (optional - defaults to describe image)' : 'Prompt'}
          </label>
          <textarea
            className="zucm-textarea"
            placeholder={isImageTest ? 'Enter prompt or leave empty for default...' : 'Enter your test prompt...'}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            disabled={loading}
            rows={4}
          />
        </div>

        {/* Test button */}
        <button
          type="button"
          className="zucm-btn zucm-btn-primary"
          onClick={onTest}
          disabled={loading || (isImageTest ? !imageUrl?.trim() : !prompt?.trim())}
        >
          {loading ? 'Processing...' : buttonLabel}
        </button>

        {/* Loading state */}
        {loading && <LoadingSpinner />}

        {/* Error display */}
        {error && !loading && <ErrorMessage message={error} />}

        {/* Response display */}
        {!loading && !error && response && <ResponseDisplay response={response} />}
      </div>
    </div>
  );
}

/**
 * Main page component (Hollow Component - UI only)
 */
export default function ZUnitChatgptModelsPage() {
  const {
    // Section states
    section1,
    section2,
    section3,
    section4,

    // Section 1 handlers
    handleSection1PromptChange,
    handleSection1Test,

    // Section 2 handlers
    handleSection2PromptChange,
    handleSection2Test,

    // Section 3 handlers
    handleSection3PromptChange,
    handleSection3Test,

    // Section 4 handlers
    handleSection4PromptChange,
    handleSection4ImageUrlChange,
    handleSection4Test
  } = useZUnitChatgptModelsPageLogic();

  return (
    <div className="zucm-page">
      {/* Header */}
      <header className="zucm-header">
        <h1>Z-Unit ChatGPT Models Test</h1>
        <p>Internal testing page for comparing multiple ChatGPT models</p>
      </header>

      {/* Main content container */}
      <div className="zucm-container">
        {/* Section 1: Freeform 4o */}
        <TestSection
          title="Freeform 4o"
          subtitle="Functional test"
          prompt={section1.prompt}
          onPromptChange={handleSection1PromptChange}
          response={section1.response}
          loading={section1.loading}
          error={section1.error}
          onTest={handleSection1Test}
          buttonLabel="Test 4o-mini"
        />

        {/* Section 2: Freeform 01-mini */}
        <TestSection
          title="Freeform 01-mini"
          subtitle="Functional test"
          prompt={section2.prompt}
          onPromptChange={handleSection2PromptChange}
          response={section2.response}
          loading={section2.loading}
          error={section2.error}
          onTest={handleSection2Test}
          buttonLabel="Test o1-mini"
        />

        {/* Section 3: Freeform o1 */}
        <TestSection
          title="Freeform o1"
          subtitle="(did not work as of 1/13/25)"
          prompt={section3.prompt}
          onPromptChange={handleSection3PromptChange}
          response={section3.response}
          loading={section3.loading}
          error={section3.error}
          onTest={handleSection3Test}
        />

        {/* Section 4: GPT 4.1 - Image Parse */}
        <TestSection
          title="GPT 4.1 - Image Parse"
          subtitle="Image URL parsing test"
          prompt={section4.prompt}
          onPromptChange={handleSection4PromptChange}
          response={section4.response}
          loading={section4.loading}
          error={section4.error}
          onTest={handleSection4Test}
          isImageTest={true}
          imageUrl={section4.imageUrl}
          onImageUrlChange={handleSection4ImageUrlChange}
        />
      </div>
    </div>
  );
}
