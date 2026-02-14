/**
 * DocumentForm - Form for creating and assigning documents
 *
 * Renders:
 * - Policy document selector dropdown
 * - Editable document title input
 * - Host user selector dropdown
 * - Submit button
 *
 * Uses the existing FormDropdown and FormInput patterns from ModifyListingsPage
 */

import './DocumentForm.css';

export default function DocumentForm({
  policyDocuments,
  hostUsers,
  formState,
  formErrors,
  isLoading,
  isSubmitting,
  onFieldChange,
  onSubmit
}) {
  // Convert policy documents to dropdown options
  const policyOptions = policyDocuments.map((policy) => ({
    value: policy.id,
    label: policy.name || 'Unnamed Policy'
  }));

  // Convert host users to dropdown options
  const hostOptions = hostUsers.map((host) => ({
    value: host.id,
    label: host.first_name ? `${host.first_name} ${host.last_name || ''} (${host.email})`.trim() : host.email
  }));

  const handlePolicyChange = (event) => {
    onFieldChange('selectedPolicyId', event.target.value);
  };

  const handleTitleChange = (event) => {
    onFieldChange('documentTitle', event.target.value);
  };

  const handleHostChange = (event) => {
    onFieldChange('selectedHostId', event.target.value);
  };

  if (isLoading) {
    return (
      <div className="create-document-form__loading">
        <p>Loading form data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="create-document-form">
      {/* Policy Document Selector */}
      <div className="create-document-form__field">
        <label htmlFor="selectedPolicyId" className="create-document-form__label">
          Choose document to send
        </label>
        <div className="create-document-form__select-wrapper">
          <select
            id="selectedPolicyId"
            name="selectedPolicyId"
            value={formState.selectedPolicyId}
            onChange={handlePolicyChange}
            disabled={isSubmitting}
            className={`create-document-form__select${formErrors.selectedPolicyId ? ' is-error' : ''}${formState.selectedPolicyId === '' ? ' is-placeholder' : ''}`}
          >
            <option value="" disabled>
              Choose document to send
            </option>
            {policyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronIcon />
        </div>
        {formErrors.selectedPolicyId && (
          <p className="create-document-form__error">{formErrors.selectedPolicyId}</p>
        )}
      </div>

      {/* Document Title Input */}
      <div className="create-document-form__field">
        <label htmlFor="documentTitle" className="create-document-form__label">
          Enter Document name
        </label>
        <input
          id="documentTitle"
          name="documentTitle"
          type="text"
          value={formState.documentTitle}
          onChange={handleTitleChange}
          placeholder="Title"
          disabled={isSubmitting}
          maxLength={255}
          className={`create-document-form__input${formErrors.documentTitle ? ' is-error' : ''}`}
        />
        {formErrors.documentTitle && (
          <p className="create-document-form__error">{formErrors.documentTitle}</p>
        )}
      </div>

      {/* Host User Selector */}
      <div className="create-document-form__field">
        <label htmlFor="selectedHostId" className="create-document-form__label">
          Choose Host
        </label>
        <div className="create-document-form__select-wrapper">
          <select
            id="selectedHostId"
            name="selectedHostId"
            value={formState.selectedHostId}
            onChange={handleHostChange}
            disabled={isSubmitting}
            className={`create-document-form__select${formErrors.selectedHostId ? ' is-error' : ''}${formState.selectedHostId === '' ? ' is-placeholder' : ''}`}
          >
            <option value="" disabled>
              Choose Host
            </option>
            {hostOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronIcon />
        </div>
        {formErrors.selectedHostId && (
          <p className="create-document-form__error">{formErrors.selectedHostId}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="create-document-form__actions">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`create-document-form__submit${isSubmitting ? ' is-disabled' : ''}`}
        >
          {isSubmitting ? 'Creating...' : 'Create Document'}
        </button>
      </div>
    </form>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="create-document-form__chevron"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}
