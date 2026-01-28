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
          error={formErrors.tagTitle}
        >
          <input
            type="text"
            value={formData.tagTitle}
            onChange={(e) => onFieldChange('tagTitle', e.target.value)}
            placeholder="e.g., How It Works"
            className={`mit-input ${formErrors.tagTitle ? 'mit-input-error' : ''}`}
          />
        </FormField>

        {/* Desktop Content */}
        <FormField
          label="Desktop Content"
          required
          error={formErrors.desktop}
        >
          <textarea
            value={formData.desktop}
            onChange={(e) => onFieldChange('desktop', e.target.value)}
            placeholder="Main content displayed on desktop screens"
            rows={4}
            className={`mit-textarea ${formErrors.desktop ? 'mit-input-error' : ''}`}
          />
        </FormField>

        {/* Desktop+ Content */}
        <FormField
          label="Desktop+ Content"
          hint="Extended content for larger screens (optional)"
        >
          <textarea
            value={formData.desktopPlus}
            onChange={(e) => onFieldChange('desktopPlus', e.target.value)}
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
            value={formData.mobile}
            onChange={(e) => onFieldChange('mobile', e.target.value)}
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
            value={formData.ipad}
            onChange={(e) => onFieldChange('ipad', e.target.value)}
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
              checked={formData.showMore}
              onChange={(e) => onFieldChange('showMore', e.target.checked)}
            />
            <span>Show More Available</span>
          </label>

          <label className="mit-toggle">
            <input
              type="checkbox"
              checked={formData.hasLink}
              onChange={(e) => onFieldChange('hasLink', e.target.checked)}
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
