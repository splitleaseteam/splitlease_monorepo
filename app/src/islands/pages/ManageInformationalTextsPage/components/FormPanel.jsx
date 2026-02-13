/**
 * FormPanel - Create/edit form for Manage Informational Texts
 */
import { FormField } from './FormField.jsx';
import { CloseIcon } from './Icons.jsx';
import '../ManageInformationalTextsPage.css';

export function FormPanel({
  mode,
  formData,
  formErrors,
  isSubmitting,
  canSubmit,
  onFieldChange,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="mit-panel">
      {/* Panel Header */}
      <div className="mit-panel-header">
        <h2 className="mit-panel-title">
          {mode === 'create' ? 'Create New Entry' : 'Edit Entry'}
        </h2>
        <button onClick={onCancel} className="mit-btn-icon" title="Cancel">
          <CloseIcon />
        </button>
      </div>

      {/* Form Fields */}
      <div className="mit-form">
        {/* Tag Title */}
        <FormField
          label="Tag Title"
          required
          error={formErrors.information_tag_title}
        >
          <input
            type="text"
            value={formData.information_tag_title}
            onChange={(e) => onFieldChange('information_tag_title', e.target.value)}
            placeholder="e.g., How It Works"
            className={`mit-input ${formErrors.information_tag_title ? 'mit-input-error' : ''}`}
          />
        </FormField>

        {/* Desktop Content */}
        <FormField
          label="Desktop Content"
          required
          error={formErrors.desktop_copy}
        >
          <textarea
            value={formData.desktop_copy}
            onChange={(e) => onFieldChange('desktop_copy', e.target.value)}
            placeholder="Main content displayed on desktop screens"
            rows={4}
            className={`mit-textarea ${formErrors.desktop_copy ? 'mit-input-error' : ''}`}
          />
        </FormField>

        {/* Desktop+ Content */}
        <FormField
          label="Desktop+ Content"
          hint="Extended content for larger screens (optional)"
        >
          <textarea
            value={formData.desktop_copy_legacy}
            onChange={(e) => onFieldChange('desktop_copy_legacy', e.target.value)}
            placeholder="Leave empty to use desktop content"
            rows={3}
            className="mit-textarea"
          />
        </FormField>

        {/* Mobile Content */}
        <FormField
          label="Mobile Content"
          hint="Content for mobile screens (optional)"
        >
          <textarea
            value={formData.mobile_copy}
            onChange={(e) => onFieldChange('mobile_copy', e.target.value)}
            placeholder="Leave empty to use desktop content"
            rows={3}
            className="mit-textarea"
          />
        </FormField>

        {/* iPad Content */}
        <FormField
          label="iPad Content"
          hint="Content for iPad screens (optional)"
        >
          <textarea
            value={formData.ipad_copy}
            onChange={(e) => onFieldChange('ipad_copy', e.target.value)}
            placeholder="Leave empty to use desktop content"
            rows={3}
            className="mit-textarea"
          />
        </FormField>

        {/* Toggles */}
        <div className="mit-toggle-row">
          <label className="mit-toggle">
            <input
              type="checkbox"
              checked={formData.show_more_available}
              onChange={(e) => onFieldChange('show_more_available', e.target.checked)}
            />
            <span>Show More Available</span>
          </label>

          <label className="mit-toggle">
            <input
              type="checkbox"
              checked={formData.link}
              onChange={(e) => onFieldChange('link', e.target.checked)}
            />
            <span>Has Link</span>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="mit-form-actions">
          <button
            onClick={onCancel}
            className="mit-btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="mit-btn-primary"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : mode === 'create'
                ? 'Create Entry'
                : 'Save Changes'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
