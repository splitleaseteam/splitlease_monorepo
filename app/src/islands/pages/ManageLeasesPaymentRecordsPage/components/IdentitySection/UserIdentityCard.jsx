/**
 * UserIdentityCard - Display identity documents for a user
 */
import { useState } from 'react';
import { User, CheckCircle, XCircle, Maximize2, X } from 'lucide-react';

export default function UserIdentityCard({ title, user }) {
  const [modalImage, setModalImage] = useState(null);

  if (!user) {
    return (
      <div className="mlpr-identity-card" style={{ opacity: 0.6 }}>
        <div className="mlpr-identity-header">
          <h4>{title}</h4>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem',
          color: '#9ca3af'
        }}>
          <User size={32} />
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>No user data available</p>
        </div>
      </div>
    );
  }

  const images = [
    { label: 'Selfie with ID', url: user.selfieUrl || user.selfie_with_id_photo_url },
    { label: 'ID Front', url: user.frontIdUrl || user.id_document_front_photo_url },
    { label: 'ID Back', url: user.backIdUrl || user.id_document_back_photo_url },
    { label: 'Profile Photo', url: user.avatarUrl || user.profile_photo_url },
  ];

  const isVerified = user.isVerified || user.identityVerified || user.is_user_verified;
  const fullName = user.fullName ||
                   (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null) ||
                   `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                   'Unknown';

  return (
    <>
      <div className="mlpr-identity-card">
        <div className="mlpr-identity-header">
          <h4>{title}</h4>
          <span className={`mlpr-verification-status ${isVerified ? 'verified' : 'pending'}`}>
            {isVerified ? (
              <>
                <CheckCircle size={14} />
                Verified
              </>
            ) : (
              <>
                <XCircle size={14} />
                Not Verified
              </>
            )}
          </span>
        </div>

        <div className="mlpr-identity-name">{fullName}</div>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '-0.5rem 0 0.75rem 0' }}>
          {user.email}
        </p>

        <div className="mlpr-identity-images">
          {images.map(({ label, url }) => (
            <div key={label} className="mlpr-identity-image-wrapper">
              <span className="mlpr-identity-image-label">{label}</span>
              {url ? (
                <div
                  className="mlpr-identity-image"
                  onClick={() => setModalImage({ url, label })}
                >
                  <img src={url} alt={label} />
                  <div className="mlpr-identity-image-overlay">
                    <Maximize2 size={16} />
                  </div>
                </div>
              ) : (
                <div className="mlpr-identity-image-placeholder">
                  <User size={24} />
                  <span>Not provided</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
          onClick={() => setModalImage(null)}
        >
          <button
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              padding: '0.5rem',
              cursor: 'pointer',
              color: 'white'
            }}
            onClick={() => setModalImage(null)}
          >
            <X size={24} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>
              {fullName} - {modalImage.label}
            </h3>
            <img
              src={modalImage.url}
              alt={modalImage.label}
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: '0.5rem'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
