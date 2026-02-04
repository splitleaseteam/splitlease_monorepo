/**
 * HostProfileModal Component Stories
 *
 * Modal displaying host profile information, reviews, and verification status.
 */

import { useState } from 'react';

// Mock Host Profile Modal implementation
const MockHostProfileModal = ({ isOpen, host, onClose, onContactHost }) => {
  if (!isOpen) return null;

  const {
    name = 'Host Name',
    photo = null,
    memberSince = '2022',
    responseRate = 98,
    responseTime = '< 1 hour',
    verified = true,
    superhost = false,
    bio = 'Welcome to my listing! I love hosting guests from around the world.',
    languages = ['English'],
    totalReviews = 42,
    rating = 4.9,
  } = host || {};

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '0',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            About the Host
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 180px)' }}>
          {/* Profile Header */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            {photo ? (
              <img
                src={photo}
                alt={name}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: '600',
                color: '#6b7280',
              }}>
                {name.charAt(0)}
              </div>
            )}
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                {name}
              </h3>
              <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>
                Host since {memberSince}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {verified && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
                {superhost && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    ⭐ Superhost
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            marginBottom: '24px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{totalReviews}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Reviews</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{rating}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Rating</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{responseRate}%</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Response</div>
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              About
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
              {bio}
            </p>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#6b7280' }}>Response time</span>
              <span style={{ color: '#1f2937', fontWeight: '500' }}>{responseTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#6b7280' }}>Languages</span>
              <span style={{ color: '#1f2937', fontWeight: '500' }}>{languages.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
        }}>
          <button
            onClick={onContactHost}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Contact Host
          </button>
        </div>
      </div>
    </div>
  );
};

export default {
  title: 'Modals/HostProfileModal',
  component: MockHostProfileModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## HostProfileModal Component

Displays detailed host profile information including stats, bio, and verification status.

### Features
- Host photo and name
- Member since date
- Verification badges (Verified, Superhost)
- Stats grid (Reviews, Rating, Response Rate)
- Bio/About section
- Response time and languages
- Contact Host CTA

### Usage
\`\`\`jsx
import HostProfileModal from 'islands/modals/HostProfileModal';

<HostProfileModal
  isOpen={showModal}
  host={hostData}
  onClose={() => setShowModal(false)}
  onContactHost={() => handleContact()}
/>
\`\`\`
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <Story />
      </div>
    ),
  ],
};

// Mock host data
const mockHost = {
  name: 'Sarah Johnson',
  photo: 'https://randomuser.me/api/portraits/women/44.jpg',
  memberSince: '2019',
  responseRate: 98,
  responseTime: 'Within an hour',
  verified: true,
  superhost: true,
  bio: 'Hi! I\'m Sarah, a native New Yorker with a passion for hospitality. I love helping guests discover the best of the city - from hidden coffee shops to the best pizza spots. My apartment is my pride and joy, and I\'ve designed every corner to make guests feel at home.',
  languages: ['English', 'Spanish'],
  totalReviews: 156,
  rating: 4.97,
};

const basicHost = {
  name: 'John Smith',
  photo: null,
  memberSince: '2023',
  responseRate: 85,
  responseTime: 'Within a day',
  verified: true,
  superhost: false,
  bio: 'Welcome to my listing! Looking forward to hosting you.',
  languages: ['English'],
  totalReviews: 12,
  rating: 4.5,
};

// Interactive wrapper
const HostProfileDemo = ({ host }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          View Host Profile
        </button>
      </div>

      <MockHostProfileModal
        isOpen={isOpen}
        host={host}
        onClose={() => setIsOpen(false)}
        onContactHost={() => {
          console.log('Contact host clicked');
          setIsOpen(false);
        }}
      />
    </>
  );
};

// Superhost with Photo
export const Superhost = {
  render: () => <HostProfileDemo host={mockHost} />,
  parameters: {
    docs: {
      description: {
        story: 'Superhost profile with photo, high ratings, and detailed bio.',
      },
    },
  },
};

// Basic Host
export const BasicHost = {
  render: () => <HostProfileDemo host={basicHost} />,
  parameters: {
    docs: {
      description: {
        story: 'Basic verified host without superhost status and no photo (shows initial).',
      },
    },
  },
};

// New Host
export const NewHost = {
  render: () => <HostProfileDemo host={{
    name: 'Emily Chen',
    photo: 'https://randomuser.me/api/portraits/women/65.jpg',
    memberSince: '2024',
    responseRate: 100,
    responseTime: 'Within an hour',
    verified: false,
    superhost: false,
    bio: 'Excited to start my hosting journey! I work remotely and love meeting new people.',
    languages: ['English', 'Mandarin'],
    totalReviews: 2,
    rating: 5.0,
  }} />,
  parameters: {
    docs: {
      description: {
        story: 'New host with few reviews but excellent early ratings.',
      },
    },
  },
};
