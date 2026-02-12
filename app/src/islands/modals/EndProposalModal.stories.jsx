/**
 * EndProposalModal Component Stories
 *
 * Unified modal for confirming proposal cancellation (guest) or rejection (host).
 * Features reason selection with optional custom input for "Other" reasons.
 */

import { useState } from 'react';
import EndProposalModal from './EndProposalModal';

// Mock proposal data
const mockProposal = {
  id: 'proposal-123',
  guestName: 'Sarah Johnson',
  _listing: {
    Name: 'Cozy Chelsea Studio',
    name: 'Cozy Chelsea Studio',
  },
  listing: {
    Name: 'Cozy Chelsea Studio',
    name: 'Cozy Chelsea Studio',
  },
};

// Mock listing data
const mockListing = {
  id: 'listing-456',
  Name: 'Sunny Williamsburg Loft',
  name: 'Sunny Williamsburg Loft',
};

export default {
  title: 'Modals/EndProposalModal',
  component: EndProposalModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## EndProposalModal Component

A confirmation modal for proposal cancellation (guest) or rejection (host).

### Features
- Supports both guest cancellation and host rejection flows
- Dynamic reason selection based on user type
- Custom reason input for "Other" selections
- Portal-based rendering for proper z-index layering
- Mobile bottom sheet design with grab handle
- Monochromatic purple design system

### Usage
\`\`\`jsx
import EndProposalModal from 'islands/modals/EndProposalModal';

<EndProposalModal
  isOpen={showModal}
  proposal={proposal}
  listing={listing}
  userType="guest" // or "host"
  onClose={() => setShowModal(false)}
  onConfirm={(reason) => handleCancel(reason)}
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
    userType: {
      control: 'select',
      options: ['guest', 'host'],
      description: 'Determines cancellation vs rejection flow',
    },
    buttonText: {
      control: 'text',
      description: 'Custom button text (overrides default)',
    },
    onClose: {
      action: 'closed',
      description: 'Called when modal is closed',
    },
    onConfirm: {
      action: 'confirmed',
      description: 'Called with reason when confirmed',
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
const CancelProposalDemo = ({ userType, buttonText, initialOpen = true }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: userType === 'host' ? '#dc2626' : '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Open {userType === 'host' ? 'Rejection' : 'Cancellation'} Modal
        </button>
      </div>

      <EndProposalModal
        isOpen={isOpen}
        proposal={mockProposal}
        listing={mockListing}
        userType={userType}
        buttonText={buttonText}
        onClose={() => setIsOpen(false)}
        onConfirm={(reason) => {
          console.log('Confirmed with reason:', reason);
          setIsOpen(false);
        }}
      />
    </>
  );
};

// Guest Cancellation
export const GuestCancellation = {
  render: () => <CancelProposalDemo userType="guest" />,
  parameters: {
    docs: {
      description: {
        story: 'Guest cancelling their own proposal. Shows guest-specific cancellation reasons.',
      },
    },
  },
};

// Host Rejection
export const HostRejection = {
  render: () => <CancelProposalDemo userType="host" />,
  parameters: {
    docs: {
      description: {
        story: 'Host rejecting a guest proposal. Shows host-specific rejection reasons.',
      },
    },
  },
};

// Decline Counteroffer
export const DeclineCounteroffer = {
  render: () => <CancelProposalDemo userType="guest" buttonText="Decline Counteroffer" />,
  parameters: {
    docs: {
      description: {
        story: 'Guest declining a host counteroffer. Custom button text triggers different modal title.',
      },
    },
  },
};

// Closed State
export const Closed = {
  args: {
    isOpen: false,
    proposal: mockProposal,
    listing: mockListing,
    userType: 'guest',
  },
  parameters: {
    docs: {
      description: {
        story: 'When isOpen is false, the modal renders nothing.',
      },
    },
  },
};

// All States Overview
export const AllStatesOverview = {
  render: () => (
    <div style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '24px', color: '#1f2937' }}>EndProposalModal States</h2>

      <div style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151' }}>Guest Flow</h3>
          <ul style={{ color: '#6b7280', lineHeight: '1.8' }}>
            <li>Title: &quot;Cancel Proposal&quot;</li>
            <li>Message: &quot;Are you sure you want to cancel your proposal for {'{listing name}'}?&quot;</li>
            <li>Reasons: Found another property, Changed move-in dates, Changed budget, etc.</li>
            <li>Confirm button: &quot;Yes, Cancel&quot;</li>
          </ul>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151' }}>Host Flow</h3>
          <ul style={{ color: '#6b7280', lineHeight: '1.8' }}>
            <li>Title: &quot;Reject Proposal&quot;</li>
            <li>Message: &quot;Are you sure you want to reject this proposal from {'{guest name}'}?&quot;</li>
            <li>Reasons: Already have another guest, Price change, Want different schedule, etc.</li>
            <li>Confirm button: &quot;Yes, Reject&quot;</li>
          </ul>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151' }}>Counteroffer Decline</h3>
          <ul style={{ color: '#6b7280', lineHeight: '1.8' }}>
            <li>Title: &quot;Decline Counteroffer&quot;</li>
            <li>Message: &quot;Are you sure you want to decline the host&apos;s counteroffer for {'{listing name}'}?&quot;</li>
            <li>Uses guest reasons</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <CancelProposalDemo userType="guest" initialOpen={false} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all modal states and their differences.',
      },
    },
  },
};
