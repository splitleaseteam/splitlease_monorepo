/**
 * FormField - Reusable form field wrapper for Manage Informational Texts
 */
import '../ManageInformationalTextsPage.css';

export function FormField({ label, required, hint, error, children }) {
  return (
    <div className="mit-field">
      <label className="mit-label">
        {label}
        {required && <span className="mit-required">*</span>}
      </label>
      {hint && <span className="mit-hint">{hint}</span>}
      {children}
      {error && <span className="mit-error-text">{error}</span>}
    </div>
  );
}
