/**
 * DocumentTypeSelect Component
 *
 * A dropdown select for choosing the type of ID document.
 * Used within the IdentityVerification modal.
 */

// Document types supported for identity verification
const DOCUMENT_TYPES = [
  "Driver's License / State ID",
  "Passport",
  "National ID Card",
  "Residence Permit",
];

/**
 * DocumentTypeSelect Component
 *
 * @param {Object} props
 * @param {string} props.value - Currently selected document type
 * @param {Function} props.onChange - Change handler
 */
export default function DocumentTypeSelect({ value, onChange }) {
  return (
    <div className="document-type-select">
      <label htmlFor="document-type" className="document-type-select__label">
        Document Type
        <span className="document-type-select__required">*</span>
      </label>
      <select
        id="document-type"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="document-type-select__input"
        required
      >
        {DOCUMENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}

// Export document types for use elsewhere
export { DOCUMENT_TYPES };
