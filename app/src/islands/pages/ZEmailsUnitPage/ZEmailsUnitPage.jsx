/**
 * Z-Emails Unit Page
 *
 * Internal email template testing page.
 * Follows the Hollow Component pattern - all logic in useZEmailsUnitPageLogic.js
 *
 * Route: /_internal/z-emails-unit
 * Auth: None (internal test page)
 */

import useZEmailsUnitPageLogic from './useZEmailsUnitPageLogic.js';
import './ZEmailsUnitPage.css';

const RECIPIENT_FIELDS = [
  { key: '$$to$$', label: 'To' },
  { key: '$$cc$$', label: 'CC' },
  { key: '$$bcc$$', label: 'BCC' }
];

function MultiEmailField({ label, emails, onChange, onAdd, onRemove }) {
  return (
    <div className="zeu-multi-field">
      <span className="zeu-label">{label}</span>
      <div className="zeu-multi-list">
        {emails.map((email, index) => (
          <div key={`${label}-${index}`} className="zeu-multi-row">
            <input
              type="email"
              value={email}
              onChange={(event) => onChange(index, event.target.value)}
              className="zeu-input zeu-input--multi"
              placeholder="name@example.com"
            />
            {emails.length > 1 && (
              <button
                type="button"
                className="zeu-icon-button zeu-icon-button--remove"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${label} email`}
              >
                -
              </button>
            )}
            {index === emails.length - 1 && (
              <button
                type="button"
                className="zeu-icon-button zeu-icon-button--add"
                onClick={onAdd}
                aria-label={`Add ${label} email`}
              >
                +
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ZEmailsUnitPage() {
  const {
    templates,
    selectedTemplateId,
    selectedTemplate,
    placeholders,
    placeholderValues,
    multiEmailValues,
    previewHtml,
    loading,
    error,
    canSendEmail,
    sending,
    sendResult,
    fromEmail,
    handleTemplateChange,
    handlePlaceholderChange,
    handleMultiEmailChange,
    addMultiEmail,
    removeMultiEmail,
    updatePreview,
    sendEmail,
    clearSendResult
  } = useZEmailsUnitPageLogic();

  if (loading) {
    return (
      <div className="zeu-state">
        <div className="zeu-state-card">
          <p>Loading email templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="zeu-state">
        <div className="zeu-state-card zeu-state-card--error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="zeu-page">
      <header className="zeu-header">
        <h1>Email Unit Test | Admin</h1>
        <p>Review templates, preview output, and send test emails.</p>
      </header>

      <div className="zeu-container">
        <section className="zeu-panel">
          <div className="zeu-section">
            <span className="zeu-section-title">Email Template</span>
            <label className="zeu-label" htmlFor="zeu-template-select">
              Email Type
            </label>
            <select
              id="zeu-template-select"
              className="zeu-select"
              value={selectedTemplateId || ''}
              onChange={(event) => handleTemplateChange(event.target.value)}
            >
              <option value="">Select a template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.Name || template.Description || template.id}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <p className="zeu-description">
                {selectedTemplate.Description || 'No description available.'}
              </p>
            )}
          </div>

          {selectedTemplate && (
            <div className="zeu-section">
              <span className="zeu-section-title">Recipients</span>
              {RECIPIENT_FIELDS.map((field) => (
                <MultiEmailField
                  key={field.key}
                  label={field.label}
                  emails={multiEmailValues[field.key] || ['']}
                  onChange={(index, value) => handleMultiEmailChange(field.key, index, value)}
                  onAdd={() => addMultiEmail(field.key)}
                  onRemove={(index) => removeMultiEmail(field.key, index)}
                />
              ))}
            </div>
          )}

          {selectedTemplate && (
            <div className="zeu-section">
              <span className="zeu-section-title">Sender</span>
              <label className="zeu-label" htmlFor="zeu-from-email">
                From Email
              </label>
              <input
                id="zeu-from-email"
                type="text"
                className="zeu-input zeu-input--disabled"
                value={fromEmail}
                disabled
              />
            </div>
          )}

          {selectedTemplate && placeholders.length > 0 && (
            <div className="zeu-section">
              <span className="zeu-section-title">Template Placeholders</span>
              {placeholders.map((placeholder, index) => {
                const inputId = `zeu-placeholder-${index}`;
                return (
                  <div key={placeholder.key} className="zeu-field">
                    <label className="zeu-label" htmlFor={inputId}>
                      {placeholder.label}
                    </label>
                    {placeholder.key.toLowerCase().includes('body') ||
                    placeholder.key.toLowerCase().includes('text') ? (
                      <textarea
                        id={inputId}
                        className="zeu-textarea"
                        rows={3}
                        value={placeholderValues[placeholder.key] || ''}
                        onChange={(event) => handlePlaceholderChange(placeholder.key, event.target.value)}
                        placeholder={`Enter ${placeholder.label}`}
                      />
                    ) : (
                      <input
                        id={inputId}
                        className="zeu-input"
                        type="text"
                        value={placeholderValues[placeholder.key] || ''}
                        onChange={(event) => handlePlaceholderChange(placeholder.key, event.target.value)}
                        placeholder={`Enter ${placeholder.label}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedTemplate && placeholders.length === 0 && (
            <div className="zeu-empty">
              <p>No placeholders available for this template.</p>
            </div>
          )}

          {selectedTemplate && (
            <div className="zeu-actions">
              {sendResult && (
                <button
                  type="button"
                  className={`zeu-result ${sendResult.success ? 'zeu-result--success' : 'zeu-result--error'}`}
                  onClick={clearSendResult}
                >
                  {sendResult.message}
                  <span>Click to dismiss</span>
                </button>
              )}
              <div className="zeu-actions-row">
                <button type="button" className="zeu-button zeu-button--secondary" onClick={updatePreview}>
                  Update Preview
                </button>
                <button
                  type="button"
                  className={`zeu-button zeu-button--primary ${(!canSendEmail || sending) ? 'zeu-button--disabled' : ''}`}
                  onClick={sendEmail}
                  disabled={!canSendEmail || sending}
                >
                  {sending ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="zeu-preview">
          <div className="zeu-preview-header">
            <h2>Email Preview</h2>
            <p>Preview renders with the placeholder values you provide.</p>
          </div>
          <div className="zeu-preview-frame">
            {previewHtml ? (
              <iframe
                title="Email Preview"
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="zeu-preview-empty">
                <p>
                  {selectedTemplate
                    ? 'Click "Update Preview" to render the template.'
                    : 'Select an email template to start.'}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
