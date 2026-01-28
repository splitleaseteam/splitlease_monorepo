/**
 * Z-Sharath Test Page
 *
 * Internal testing dashboard for email, SMS, AI, and file workflows.
 * Follows the Hollow Component Pattern - all logic in useZSharathTestPageLogic hook.
 *
 * Route: /_internal/z-sharath-test
 * Auth: None (internal test page)
 */

import useZSharathTestPageLogic from './useZSharathTestPageLogic.js';
import './ZSharathTestPage.css';

const EMAIL_BUTTONS = [
  'Send Email basic',
  'Send Email Template 1',
  'Send Email Template Celebratory',
  'Send Email Template 2',
  'Send Email Security Gif',
  'Send Email Template 4',
  'Test Feedback Email',
  'Test Checkout Reminder Email',
  'Test Success Story Testimonial',
  'Test Rebooking recommendations',
  'Test Move Instructions 1 Minimal',
  'Test Move Instructions Lite',
  'Test Proposal Updates (Guest rejection)',
  'Test Security/Availability Template',
  'Test Security 2',
  'Test Nearby Suggestions Masked 1',
  'Test Nearby Suggestions Masked 2',
  'Test Nearby Suggestions Masked 3',
  'Check Date'
];

const SMS_GROUPS = [
  {
    title: 'SMS Form 1',
    from: '4155692985',
    to: '4155692985'
  },
  {
    title: 'SMS Form 2',
    from: '4155692985',
    to: '4155692985'
  },
  {
    title: 'SMS Form 3',
    from: '6285651571',
    to: '4157670779'
  }
];

export default function ZSharathTestPage() {
  const {
    homeUrl,
    selectedOption,
    filePreviewUrl,
    fileBase64,
    fileName,
    geminiImageUrl,
    popupVisible,
    statusMessage,
    errorMessage,
    handleEmailTest,
    handleSmsTest,
    handleRawEmail,
    handleOptionChange,
    handleFileChange,
    handleGeminiTest,
    handleShowPopup,
    handleTestLogin
  } = useZSharathTestPageLogic();

  return (
    <div className="zstp-page">
      <header className="zstp-header">
        <h1>My Page</h1>
        <p>Internal QA and development utilities for Split Lease.</p>
      </header>

      <main className="zstp-container">
        <section className="zstp-section">
          <div className="zstp-meta-grid">
            <div className="zstp-card">
              <span className="zstp-card-title">Page Metadata</span>
              <p className="zstp-meta-row"><span>Home URL</span>{homeUrl}</p>
              <button type="button" className="zstp-button" onClick={() => handleEmailTest('Button U')}>
                Button U
              </button>
            </div>
            <div className="zstp-card">
              <span className="zstp-card-title">Placeholder Image</span>
              <img
                className="zstp-image"
                src="/assets/images/placeholder.png"
                alt="Placeholder"
              />
            </div>
            <div className="zstp-card">
              <span className="zstp-card-title">Database Diagram</span>
              <a className="zstp-link" href="/assets/images/placeholder.png" target="_blank" rel="noreferrer">
                Open AirDatabaseDiagram JPG
              </a>
            </div>
          </div>
        </section>

        <section className="zstp-section">
          <div className="zstp-section-header">
            <h2>Email Template Testing</h2>
            <p>Run all email template workflows from this panel.</p>
          </div>
          <div className="zstp-grid">
            {EMAIL_BUTTONS.map((label) => (
              <button
                key={label}
                type="button"
                className="zstp-button zstp-button--grid"
                onClick={() => handleEmailTest(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="zstp-section">
          <div className="zstp-section-header">
            <h2>SMS Testing</h2>
            <p>Validate SMS flows and phone number masking.</p>
          </div>
          <div className="zstp-sms-grid">
            {SMS_GROUPS.map((group) => (
              <div key={group.title} className="zstp-card">
                <span className="zstp-card-title">{group.title}</span>
                <label className="zstp-label">From Number</label>
                <input className="zstp-input" value={group.from} readOnly />
                <label className="zstp-label">To Number</label>
                <input className="zstp-input" value={group.to} readOnly />
                <label className="zstp-label">Message Content</label>
                <textarea
                  className="zstp-textarea"
                  value="Test message content"
                  readOnly
                  rows={3}
                />
                <button
                  type="button"
                  className="zstp-button"
                  onClick={() => handleSmsTest(group.title)}
                >
                  Send SMS
                </button>
              </div>
            ))}
            <div className="zstp-card">
              <span className="zstp-card-title">Raw Email Test</span>
              <label className="zstp-label">Type here</label>
              <input className="zstp-input" value="" readOnly placeholder="Readonly" />
              <button type="button" className="zstp-button" onClick={handleRawEmail}>
                Send Email Raw
              </button>
              <p className="zstp-muted">{errorMessage || 'No error logged.'}</p>
            </div>
          </div>
        </section>

        <section className="zstp-section">
          <div className="zstp-section-header">
            <h2>File Upload and Base64</h2>
            <p>Upload a file to preview and convert to base64.</p>
          </div>
          <div className="zstp-file-grid">
            <div className="zstp-card">
              <label className="zstp-label" htmlFor="zstp-option">
                Choose an option
              </label>
              <select
                id="zstp-option"
                className="zstp-select"
                value={selectedOption}
                onChange={(event) => handleOptionChange(event.target.value)}
              >
                <option value="">Choose an option...</option>
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
                <option value="text">Text</option>
              </select>
              <label className="zstp-label">File URL</label>
              <input className="zstp-input" value={filePreviewUrl || ''} readOnly />
              <label className="zstp-label">File Name</label>
              <input className="zstp-input" value={fileName || ''} readOnly />
              <label className="zstp-label">Base64</label>
              <textarea className="zstp-textarea" value={fileBase64 || ''} readOnly rows={4} />
            </div>
            <div className="zstp-card">
              <span className="zstp-card-title">File Upload</span>
              <input type="file" className="zstp-file" onChange={handleFileChange} />
              <div className="zstp-preview">
                {filePreviewUrl ? (
                  <iframe title="file-preview" src={filePreviewUrl} />
                ) : (
                  <p>No file selected.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="zstp-section">
          <div className="zstp-section-header">
            <h2>Gemini Nano + UI Tests</h2>
            <p>Run Gemini Nano AI and UI popup tests.</p>
          </div>
          <div className="zstp-ai-grid">
            <div className="zstp-card">
              <span className="zstp-card-title">Gemini Nano</span>
              <p className="zstp-muted">File -&gt; base64</p>
              <button type="button" className="zstp-button" onClick={handleGeminiTest}>
                Gemini Nano Banana
              </button>
              {geminiImageUrl && (
                <img className="zstp-image" src={geminiImageUrl} alt="Gemini output" />
              )}
            </div>
            <div className="zstp-card">
              <span className="zstp-card-title">Popup + Login</span>
              <button type="button" className="zstp-button" onClick={handleShowPopup}>
                Show popup
              </button>
              <button type="button" className="zstp-button" onClick={handleTestLogin}>
                Test Login
              </button>
              {popupVisible && (
                <div className="zstp-popup">
                  <p>Popup is visible.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="zstp-section">
          <div className="zstp-card zstp-status">
            <span className="zstp-card-title">Status</span>
            <p className="zstp-status-text">{statusMessage || 'No actions yet.'}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
