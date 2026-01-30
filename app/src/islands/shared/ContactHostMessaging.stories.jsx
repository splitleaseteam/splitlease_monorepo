/**
 * ContactHostMessaging Component Stories
 *
 * Modal for contacting listing hosts with support for authenticated and guest users.
 */

import { useState } from 'react';
import ContactHostMessaging from './ContactHostMessaging';

// Mock listing data
const mockListing = {
  id: 'listing-123',
  title: 'Cozy Chelsea Studio with City Views',
  host: {
    name: 'Sarah Johnson',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    userId: 'host-user-123',
  },
};

const mockListingNoPhoto = {
  id: 'listing-456',
  title: 'Modern Williamsburg Loft',
  host: {
    name: 'Michael Chen',
    image: null,
    userId: 'host-user-456',
  },
};

const mockListingSingleName = {
  id: 'listing-789',
  title: 'Sunny Brooklyn Heights Apartment',
  host: {
    name: 'Alexandra',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    userId: 'host-user-789',
  },
};

export default {
  title: 'Shared/ContactHostMessaging',
  component: ContactHostMessaging,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## ContactHostMessaging Component

A modal for contacting listing hosts with full accessibility support.

### Features
- Supports authenticated and guest users
- Guest mode: Collects name and email
- Authenticated mode: Uses existing user session
- Quick question chips for common inquiries
- Character count for message (500 max)
- Form validation with error states
- Success state with auto-close
- Focus trap and keyboard navigation
- Mobile-responsive bottom sheet design

### Design
- Follows Popup Redesign Protocol
- Option C (Minimal Warmth) styling
- 48px touch targets per accessibility guidelines

### Usage
\`\`\`jsx
import ContactHostMessaging from 'islands/shared/ContactHostMessaging';

<ContactHostMessaging
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  listing={listing}
  onLoginRequired={() => showLoginModal()}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    listing: {
      control: 'object',
      description: 'Listing data including host info',
    },
    onClose: {
      action: 'closed',
      description: 'Called when modal is closed',
    },
    onLoginRequired: {
      action: 'loginRequired',
      description: 'Called when guest clicks "Log in" link',
    },
  },
};

// Interactive wrapper for demo
const ContactHostDemo = ({ listing = mockListing, ...args }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 24px',
          backgroundColor: '#31135D',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        Contact Host
      </button>
      <ContactHostMessaging
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        listing={listing}
        onLoginRequired={() => {
          setIsOpen(false);
          alert('Login required - would open auth modal');
        }}
        {...args}
      />
    </div>
  );
};

// Default - With Host Photo
export const Default = {
  render: (args) => <ContactHostDemo {...args} />,
  args: {
    listing: mockListing,
  },
};

// Host Without Photo (Shows Initials)
export const HostWithoutPhoto = {
  render: (args) => <ContactHostDemo {...args} listing={mockListingNoPhoto} />,
  args: {
    listing: mockListingNoPhoto,
  },
  parameters: {
    docs: {
      description: {
        story: 'When host has no profile photo, initials are displayed in the avatar.',
      },
    },
  },
};

// Single Name Host
export const SingleNameHost = {
  render: (args) => <ContactHostDemo {...args} listing={mockListingSingleName} />,
  args: {
    listing: mockListingSingleName,
  },
  parameters: {
    docs: {
      description: {
        story: 'Host with a single name shows first two letters as initials.',
      },
    },
  },
};

// Always Open (For Visual Testing)
export const AlwaysOpen = {
  args: {
    isOpen: true,
    listing: mockListing,
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal in always-open state for visual inspection.',
      },
    },
  },
};

// Mobile View
export const MobileView = {
  render: (args) => <ContactHostDemo {...args} />,
  args: {
    listing: mockListing,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile view with bottom sheet animation and drag handle.',
      },
    },
  },
};

// Multiple Listings Demo
const MultipleListingsWrapper = () => {
  const [activeModal, setActiveModal] = useState(null);

  const listings = [mockListing, mockListingNoPhoto, mockListingSingleName];

  return (
    <div style={{ padding: '40px' }}>
      <h3 style={{ margin: '0 0 20px', color: '#1f2937' }}>Available Listings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {listings.map((listing) => (
          <div
            key={listing.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: '500', color: '#1f2937' }}>
                {listing.title}
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Hosted by {listing.host.name}
              </p>
            </div>
            <button
              onClick={() => setActiveModal(listing.id)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#31135D',
                color: 'white',
                border: 'none',
                borderRadius: '100px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Message
            </button>
          </div>
        ))}
      </div>

      {listings.map((listing) => (
        <ContactHostMessaging
          key={listing.id}
          isOpen={activeModal === listing.id}
          onClose={() => setActiveModal(null)}
          listing={listing}
          onLoginRequired={() => alert('Login required')}
        />
      ))}
    </div>
  );
};

export const MultipleListingsDemo = {
  render: () => <MultipleListingsWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Demo showing multiple listings each with their own contact modal.',
      },
    },
  },
};

// Quick Questions Demo
export const QuickQuestionsDemo = {
  render: (args) => (
    <div style={{ padding: '40px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 8px', color: '#1f2937' }}>Quick Questions Feature</h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Click the quick question chips to auto-populate common inquiries:
        </p>
        <ul style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>
          <li>Availability - "Is the space available for my dates?"</li>
          <li>Amenities - "What amenities are included?"</li>
          <li>Flexibility - "Is there flexibility with the schedule?"</li>
        </ul>
      </div>
      <ContactHostDemo {...args} />
    </div>
  ),
  args: {
    listing: mockListing,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the quick question chip feature that pre-fills common questions.',
      },
    },
  },
};
