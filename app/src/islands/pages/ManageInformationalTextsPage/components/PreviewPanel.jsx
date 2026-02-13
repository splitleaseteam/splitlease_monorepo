/**
 * PreviewPanel - Device preview for Manage Informational Texts
 */
import { InfoIcon, ChevronDownIcon } from './Icons.jsx';
import '../ManageInformationalTextsPage.css';

export function PreviewPanel({ formData, previewDevice, setPreviewDevice, getPreviewContent }) {
  const devices = [
    { key: 'desktop', label: 'Desktop' },
    { key: 'desktopPlus', label: 'Desktop+' },
    { key: 'ipad', label: 'iPad' },
    { key: 'mobile', label: 'Mobile' },
  ];

  return (
    <div className="mit-panel">
      <div className="mit-panel-header">
        <h2 className="mit-panel-title">Preview</h2>
      </div>

      {/* Device Tabs */}
      <div className="mit-device-tabs">
        {devices.map(device => (
          <button
            key={device.key}
            onClick={() => setPreviewDevice(device.key)}
            className={`mit-device-tab ${previewDevice === device.key ? 'mit-device-tab-active' : ''}`}
          >
            {device.label}
          </button>
        ))}
      </div>

      {/* Preview Box */}
      <div className="mit-preview-box">
        <div className="mit-preview-header">
          <div className="mit-preview-icon">
            <InfoIcon />
          </div>
          <h3 className="mit-preview-title">
            {formData.information_tag_title || 'Information'}
          </h3>
        </div>
        <div className="mit-preview-content">
          <p className="mit-preview-text">
            {getPreviewContent()}
          </p>
        </div>
        {formData.show_more_available && (
          <button className="mit-show-more-button">
            Show more
            <ChevronDownIcon />
          </button>
        )}
      </div>

      {/* Content Status */}
      <div className="mit-content-status">
        <StatusItem
          label="Desktop"
          hasContent={!!formData.desktop_copy}
          required
        />
        <StatusItem
          label="Desktop+"
          hasContent={!!formData.desktop_copy_legacy}
          fallback="desktop"
        />
        <StatusItem
          label="iPad"
          hasContent={!!formData.ipad_copy}
          fallback="desktop"
        />
        <StatusItem
          label="Mobile"
          hasContent={!!formData.mobile_copy}
          fallback="desktop"
        />
      </div>
    </div>
  );
}

function StatusItem({ label, hasContent, required, fallback }) {
  return (
    <div className="mit-status-item">
      <span className="mit-status-label">{label}</span>
      {hasContent ? (
        <span className="mit-status-green">Custom</span>
      ) : required ? (
        <span className="mit-status-red">Required</span>
      ) : (
        <span className="mit-status-gray">Uses {fallback}</span>
      )}
    </div>
  );
}
