/**
 * FileUploadField Component
 *
 * A reusable file upload field with image preview.
 * Used within the IdentityVerification modal.
 *
 * Features:
 * - Click to upload
 * - Image preview after selection
 * - File size display
 * - Remove/replace functionality
 * - Optional help text
 */

import { useRef } from 'react';

// Icons as inline SVG
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * FileUploadField Component
 *
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {boolean} [props.required] - Whether field is required
 * @param {Object} props.fileInfo - File info object { file, preview, size }
 * @param {Function} props.onChange - Change handler for file input
 * @param {Function} [props.onRemove] - Handler to remove the file
 * @param {string} [props.helpText] - Optional help text below the field
 * @param {string} [props.accept] - Accepted file types
 * @param {string} [props.capture] - Capture mode for mobile (user, environment)
 */
export default function FileUploadField({
  label,
  required = false,
  fileInfo,
  onChange,
  onRemove,
  helpText,
  accept = 'image/*',
  capture,
}) {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
    // Clear the input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="file-upload-field">
      <label className="file-upload-field__label">
        {label}
        {required && <span className="file-upload-field__required">*</span>}
      </label>

      <div
        className="file-upload-field__dropzone"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {fileInfo.preview ? (
          <div className="file-upload-field__preview">
            <img
              src={fileInfo.preview}
              alt={`${label} preview`}
              className="file-upload-field__preview-image"
            />
            <div className="file-upload-field__preview-overlay">
              <button
                type="button"
                className="file-upload-field__remove-btn"
                onClick={handleRemove}
                aria-label={`Remove ${label}`}
              >
                <XIcon />
                <span>Remove</span>
              </button>
            </div>
            <div className="file-upload-field__preview-info">
              <span className="file-upload-field__filename">
                {fileInfo.file?.name}
              </span>
              <span className="file-upload-field__filesize">
                ({fileInfo.size})
              </span>
            </div>
          </div>
        ) : (
          <div className="file-upload-field__placeholder">
            <div className="file-upload-field__placeholder-icon">
              <UploadIcon />
            </div>
            <p className="file-upload-field__placeholder-text">
              Click to upload an image
            </p>
            <p className="file-upload-field__placeholder-hint">
              JPG, PNG, WEBP (max 10MB)
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={capture}
        onChange={onChange}
        className="file-upload-field__input"
        aria-label={label}
      />

      {helpText && (
        <div className="file-upload-field__help">
          <span className="file-upload-field__help-icon">
            <InfoIcon />
          </span>
          <p className="file-upload-field__help-text">{helpText}</p>
        </div>
      )}
    </div>
  );
}
