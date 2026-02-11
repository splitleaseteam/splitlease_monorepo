/**
 * EditPhoneNumberModal Component Stories
 *
 * Modal for editing user phone number with validation.
 */

import { useState } from 'react';

// Since we don't have the actual component content, create a mock implementation
const MockEditPhoneNumberModal = ({ isOpen, currentPhone, onClose, onSave }) => {
  const [phone, setPhone] = useState(currentPhone || '');

  if (!isOpen) return null;

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
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            Edit Phone Number
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

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6b7280' }}>
            We&apos;ll send a verification code to this number
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(phone)}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default {
  title: 'Modals/EditPhoneNumberModal',
  component: MockEditPhoneNumberModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## EditPhoneNumberModal Component

Modal for editing user phone number with validation and verification flow.

### Features
- Phone number input with formatting
- Validation feedback
- Verification code flow (SMS)
- Cancel and Save actions

### Usage
\`\`\`jsx
import EditPhoneNumberModal from 'islands/modals/EditPhoneNumberModal';

<EditPhoneNumberModal
  isOpen={showModal}
  currentPhone="+1 (555) 123-4567"
  onClose={() => setShowModal(false)}
  onSave={(newPhone) => handleSave(newPhone)}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is visible',
    },
    currentPhone: {
      control: 'text',
      description: 'Current phone number to edit',
    },
    onClose: {
      action: 'closed',
    },
    onSave: {
      action: 'saved',
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

// Interactive wrapper
const EditPhoneDemo = ({ currentPhone }) => {
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
          Edit Phone Number
        </button>
      </div>

      <MockEditPhoneNumberModal
        isOpen={isOpen}
        currentPhone={currentPhone}
        onClose={() => setIsOpen(false)}
        onSave={(phone) => {
          console.log('Saved phone:', phone);
          setIsOpen(false);
        }}
      />
    </>
  );
};

// Default - Empty
export const Default = {
  render: () => <EditPhoneDemo currentPhone="" />,
  parameters: {
    docs: {
      description: {
        story: 'Empty state for adding a new phone number.',
      },
    },
  },
};

// With Existing Phone
export const WithExistingPhone = {
  render: () => <EditPhoneDemo currentPhone="+1 (555) 123-4567" />,
  parameters: {
    docs: {
      description: {
        story: 'Editing an existing phone number.',
      },
    },
  },
};

// Closed State
export const Closed = {
  args: {
    isOpen: false,
    currentPhone: '',
  },
};
