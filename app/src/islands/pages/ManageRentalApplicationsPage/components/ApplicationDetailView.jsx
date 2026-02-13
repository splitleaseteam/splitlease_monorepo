/**
 * ApplicationDetailView - Detailed view of a single rental application
 *
 * Props:
 * - application: The application object with all details
 * - isLoading: Loading state
 * - onBack: Handler to return to list view
 * - onEdit: Handler to open edit modal (receives section name)
 * - onUpdateStatus: Handler to update application status
 * - statusOptions: Available status options
 */

import { useCallback } from 'react';

// Format currency
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Format datetime
function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Format phone number
function formatPhone(phone) {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Get status badge class
function getStatusClass(status) {
  const statusMap = {
    'draft': 'status-badge--draft',
    'in-progress': 'status-badge--in-progress',
    'submitted': 'status-badge--submitted',
    'under-review': 'status-badge--under-review',
    'approved': 'status-badge--approved',
    'conditionally-approved': 'status-badge--conditionally-approved',
    'denied': 'status-badge--denied',
    'withdrawn': 'status-badge--withdrawn',
    'expired': 'status-badge--expired'
  };
  return statusMap[status] || 'status-badge--default';
}

// Format address object to string
function formatAddress(address) {
  if (!address) return '-';
  const parts = [
    address.street,
    address.unit && `Unit ${address.unit}`,
    address.city,
    address.state,
    address.zip
  ].filter(Boolean);
  return parts.join(', ') || '-';
}

// Section header with edit button
function SectionHeader({ title, onEdit, section }) {
  return (
    <div className="detail-section__header">
      <h3>{title}</h3>
      {onEdit && (
        <button
          className="detail-section__edit-btn"
          onClick={() => onEdit(section)}
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
      )}
    </div>
  );
}

// Detail field component
function DetailField({ label, value, fullWidth = false }) {
  return (
    <div className={`detail-field ${fullWidth ? 'detail-field--full' : ''}`}>
      <span className="detail-field__label">{label}</span>
      <span className="detail-field__value">{value || '-'}</span>
    </div>
  );
}

// Boolean field with check/x icon
function BooleanField({ label, value }) {
  return (
    <div className="detail-field detail-field--boolean">
      <span className="detail-field__label">{label}</span>
      <span className={`detail-field__value ${value ? 'value--yes' : 'value--no'}`}>
        {value ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
        {value ? 'Yes' : 'No'}
      </span>
    </div>
  );
}

export default function ApplicationDetailView({
  application,
  isLoading,
  onBack,
  onEdit,
  onUpdateStatus,
  statusOptions
}) {
  const handleStatusChange = useCallback((e) => {
    onUpdateStatus(e.target.value);
  }, [onUpdateStatus]);

  // Loading state
  if (isLoading) {
    return (
      <div className="application-detail application-detail--loading">
        <div className="spinner" />
        <p>Loading application details...</p>
      </div>
    );
  }

  // No application
  if (!application) {
    return (
      <div className="application-detail application-detail--empty">
        <p>No application selected.</p>
        <button className="btn btn--primary" onClick={onBack}>
          Back to List
        </button>
      </div>
    );
  }

  const personalInfo = application.personal_info || {};
  // Note: 'permanent address' is JSONB { address: string }
  const permanentAddress = application.permanent_address;
  const currentAddressString = typeof permanentAddress === 'string'
    ? permanentAddress
    : (permanentAddress?.address || '');
  const emergencyContact = application.emergency_contact || {};
  const accessibility = application.accessibility || {};

  return (
    <div className="application-detail">
      {/* Header */}
      <div className="application-detail__header">
        <button className="back-btn" onClick={onBack} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to List
        </button>

        <div className="application-detail__title">
          <h2>
            {application.applicant_name || personalInfo.name || 'Application'}
          </h2>
          <span className="application-id">{application.unique_id || application.id}</span>
        </div>

        {/* Status Control */}
        <div className="application-detail__status-control">
          <label htmlFor="status-select">Status:</label>
          <select
            id="status-select"
            value={application.status}
            onChange={handleStatusChange}
            className={`status-select ${getStatusClass(application.status)}`}
          >
            {statusOptions.filter(opt => opt.value).map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="application-detail__progress">
        <div className="progress-info">
          <span>Completion Progress</span>
          <span>{application.completion_percentage || 0}%</span>
        </div>
        <div className="progress-bar progress-bar--large">
          <div
            className="progress-bar__fill"
            style={{ width: `${application.completion_percentage || 0}%` }}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="application-detail__content">
        {/* Personal Information */}
        <section className="detail-section">
          <SectionHeader title="Personal Information" onEdit={onEdit} section="personal" />
          <div className="detail-grid">
            <DetailField label="Full Name" value={application.name || personalInfo.name} fullWidth />
            <DetailField label="Email" value={application.email || personalInfo.email} />
            <DetailField label="Phone" value={formatPhone(application.phone_number || personalInfo.phone)} />
            <DetailField label="Date of Birth" value={formatDate(application.dob || personalInfo.dateOfBirth)} />
          </div>
        </section>

        {/* Current Address */}
        <section className="detail-section">
          <SectionHeader title="Current Address" onEdit={onEdit} section="address" />
          <div className="detail-grid">
            <DetailField label="Address" value={currentAddressString} fullWidth />
            <DetailField label="Unit/Apt" value={application.apartment_number} />
            <DetailField label="Length Resided" value={application.length_resided} />
            <BooleanField label="Currently Renting" value={application.renting} />
          </div>
        </section>

        {/* Employment & Income */}
        <section className="detail-section">
          <SectionHeader title="Employment & Income" onEdit={onEdit} section="employment" />
          <div className="detail-grid">
            <DetailField label="Employment Status" value={application.employment_status} />
            <DetailField label="Monthly Income" value={formatCurrency(application.monthly_income)} />
          </div>

          {/* Employed fields */}
          {(application.employment_status === 'full-time' || application.employment_status === 'part-time') && (
            <div className="detail-subsection">
              <h4>Employer Details</h4>
              <div className="detail-grid">
                <DetailField label="Employer Name" value={application.employer_name} />
                <DetailField label="Job Title" value={application.job_title} />
                <DetailField label="Employer Phone" value={formatPhone(application.employer_phone_number)} />
              </div>
            </div>
          )}

          {/* Self-employed fields */}
          {(application.employment_status === 'business-owner' || application.employment_status === 'self-employed') && (
            <div className="detail-subsection">
              <h4>Business Details</h4>
              <div className="detail-grid">
                <DetailField label="Business Name" value={application.business_legal_name} />
                <DetailField label="Year Established" value={application.year_business_was_created} />
                <DetailField label="State Registered" value={application.state_business_registered} />
              </div>
            </div>
          )}
        </section>

        {/* Special Requirements */}
        <section className="detail-section">
          <SectionHeader title="Special Requirements" onEdit={onEdit} section="requirements" />
          <div className="detail-grid detail-grid--booleans">
            <BooleanField label="Has Pets" value={application.pets} />
            <BooleanField label="Smoker" value={application.smoking} />
            <BooleanField label="Needs Parking" value={application.parking} />
          </div>
        </section>

        {/* Occupants */}
        <section className="detail-section">
          <SectionHeader title="Occupants" onEdit={onEdit} section="occupants" />
          {application.occupants_list && application.occupants_list.length > 0 ? (
            <div className="occupants-list">
              {application.occupants_list.map((occupant, index) => (
                <div key={occupant.id || index} className="occupant-item">
                  <span className="occupant-name">
                    {occupant.name || '-'}
                  </span>
                  <span className="occupant-details">
                    {occupant.relationship && <span>{occupant.relationship}</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No occupants listed</p>
          )}
        </section>

        {/* References */}
        <section className="detail-section">
          <SectionHeader title="References" onEdit={onEdit} section="references" />
          {application.references && application.references.length > 0 ? (
            <div className="references-list">
              {application.references.map((ref, index) => (
                <div key={ref.id || index} className="reference-item">
                  <div className="detail-grid">
                    <DetailField label="Name" value={ref.name} />
                    <DetailField label="Relationship" value={ref.relationship} />
                    <DetailField label="Phone" value={formatPhone(ref.phone)} />
                    <DetailField label="Email" value={ref.email} />
                    <DetailField label="Years Known" value={ref.years_known} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No references listed</p>
          )}
        </section>

        {/* Emergency Contact */}
        <section className="detail-section">
          <SectionHeader title="Emergency Contact" onEdit={onEdit} section="emergency" />
          <div className="detail-grid">
            <DetailField label="Name" value={emergencyContact.name} />
            <DetailField label="Relationship" value={emergencyContact.relationship} />
            <DetailField label="Phone" value={formatPhone(emergencyContact.phone)} />
            <DetailField label="Email" value={emergencyContact.email} />
          </div>
        </section>

        {/* Consents & Signatures */}
        <section className="detail-section">
          <SectionHeader title="Consents & Signatures" />
          <div className="detail-grid detail-grid--booleans">
            <BooleanField label="Background Check Consent" value={application.background_check_consent} />
            <BooleanField label="Credit Check Consent" value={application.credit_check_consent} />
            <BooleanField label="Terms Accepted" value={application.terms_accepted} />
          </div>
          <div className="detail-grid">
            <DetailField label="Signature Date" value={formatDateTime(application.signature_date)} />
          </div>
        </section>

        {/* Accessibility Needs */}
        {accessibility && Object.keys(accessibility).length > 0 && (
          <section className="detail-section">
            <SectionHeader title="Accessibility Needs" onEdit={onEdit} section="accessibility" />
            <div className="detail-grid">
              <BooleanField label="Has Accessibility Needs" value={accessibility.hasNeeds} />
              <DetailField label="Description" value={accessibility.description} fullWidth />
            </div>
          </section>
        )}

        {/* Metadata */}
        <section className="detail-section detail-section--metadata">
          <h4>Application Metadata</h4>
          <div className="detail-grid">
            <DetailField label="Created" value={formatDateTime(application.created_at)} />
            <DetailField label="Last Updated" value={formatDateTime(application.updated_at)} />
            <DetailField label="Submitted" value={formatDateTime(application.submitted_at)} />
            <DetailField label="Application ID" value={application.id} />
            <DetailField label="Guest ID" value={application.guest_id} />
            <DetailField label="Listing ID" value={application.listing_id || 'Not linked'} />
          </div>
        </section>
      </div>
    </div>
  );
}
