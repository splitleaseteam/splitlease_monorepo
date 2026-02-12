/**
 * VirtualMeetingModal Component Stories
 *
 * 5-state workflow modal for scheduling and managing virtual meetings.
 * States: request, respond, details, cancel, alternative
 */

import { useState } from 'react';
import VirtualMeetingModal from './VirtualMeetingModal';

// Mock data
const mockProposal = {
  id: 'proposal-123',
  Guest: 'guest-user-456',
  _listing: {
    'Created By': 'host-user-789',
    Name: 'Cozy Chelsea Studio',
  },
};

const mockCurrentUser = {
  id: 'guest-user-456',
  name: 'Sarah Johnson',
  email: 'sarah@example.com',
};

const mockVirtualMeeting = {
  id: 'vm-123',
  'booked date': new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  'requested by': 'guest-user-456',
  'meeting declined': false,
  'confirmedBySplitLease': true,
  'meeting link': 'https://meet.google.com/abc-defg-hij',
};

const mockDeclinedMeeting = {
  ...mockVirtualMeeting,
  'meeting declined': true,
  'confirmedBySplitLease': false,
  'meeting link': null,
};

export default {
  title: 'Modals/VirtualMeetingModal',
  component: VirtualMeetingModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## VirtualMeetingModal Component

A multi-state modal for the complete virtual meeting workflow.

### States
1. **request** - Guest/Host requests a new meeting
2. **respond** - Other party responds to a meeting request
3. **details** - View confirmed meeting details
4. **cancel** - Cancel an existing meeting
5. **alternative** - Suggest alternative time after decline

### Usage
\`\`\`jsx
import VirtualMeetingModal from 'islands/modals/VirtualMeetingModal';

<VirtualMeetingModal
  proposal={proposal}
  virtualMeeting={virtualMeeting}
  currentUser={currentUser}
  view="request" // 'request' | 'respond' | 'details' | 'cancel' | 'alternative'
  onClose={() => setShowModal(false)}
  onSuccess={() => refreshData()}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    view: {
      control: 'select',
      options: ['request', 'respond', 'details', 'cancel', 'alternative'],
      description: 'Current view/state of the modal',
    },
    onClose: {
      action: 'closed',
    },
    onSuccess: {
      action: 'success',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '40px' }}>
        <Story />
      </div>
    ),
  ],
};

// Interactive wrapper
const VirtualMeetingDemo = ({ view, hasVirtualMeeting = false, isDeclined = false }) => {
  const [isOpen, setIsOpen] = useState(true);

  const virtualMeeting = hasVirtualMeeting
    ? (isDeclined ? mockDeclinedMeeting : mockVirtualMeeting)
    : null;

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
          Open Modal ({view} view)
        </button>
      </div>

      {isOpen && (
        <VirtualMeetingModal
          proposal={mockProposal}
          virtualMeeting={virtualMeeting}
          currentUser={mockCurrentUser}
          view={view}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            console.log('Success!');
            setIsOpen(false);
          }}
        />
      )}
    </>
  );
};

// Request View - New Meeting
export const RequestNewMeeting = {
  render: () => <VirtualMeetingDemo view="request" />,
  parameters: {
    docs: {
      description: {
        story: 'Initial request view for scheduling a new virtual meeting. User selects date and time.',
      },
    },
  },
};

// Respond View - Accept/Decline Request
export const RespondToRequest = {
  render: () => <VirtualMeetingDemo view="respond" hasVirtualMeeting />,
  parameters: {
    docs: {
      description: {
        story: 'Response view for accepting or declining a meeting request from the other party.',
      },
    },
  },
};

// Details View - Confirmed Meeting
export const MeetingDetails = {
  render: () => <VirtualMeetingDemo view="details" hasVirtualMeeting />,
  parameters: {
    docs: {
      description: {
        story: 'Details view showing confirmed meeting time and link.',
      },
    },
  },
};

// Cancel View - Cancel Existing
export const CancelMeeting = {
  render: () => <VirtualMeetingDemo view="cancel" hasVirtualMeeting />,
  parameters: {
    docs: {
      description: {
        story: 'Cancellation confirmation view with warning about the irreversible action.',
      },
    },
  },
};

// Alternative View - Suggest New Time
export const SuggestAlternative = {
  render: () => <VirtualMeetingDemo view="alternative" hasVirtualMeeting isDeclined />,
  parameters: {
    docs: {
      description: {
        story: 'Alternative time suggestion view after the previous time was declined.',
      },
    },
  },
};

// All Views Overview
export const AllViewsOverview = {
  render: () => (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px', color: '#1f2937', textAlign: 'center' }}>
        Virtual Meeting Modal - All States
      </h2>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {[
          {
            view: 'request',
            title: '1. Request',
            description: 'Guest or host requests a new virtual meeting',
            features: ['Date picker', 'Time picker', 'Optional notes', 'Submit Request button'],
          },
          {
            view: 'respond',
            title: '2. Respond',
            description: 'Other party responds to meeting request',
            features: ['Shows proposed time', 'Shows requester', 'Accept button', 'Decline button'],
          },
          {
            view: 'details',
            title: '3. Details',
            description: 'View confirmed meeting information',
            features: ['Meeting time', 'Meeting link', 'Confirmation status', 'Close button'],
          },
          {
            view: 'cancel',
            title: '4. Cancel',
            description: 'Cancel an existing meeting',
            features: ['Confirmation message', 'Warning notice', 'Cancel Meeting button', 'Go Back option'],
          },
          {
            view: 'alternative',
            title: '5. Alternative',
            description: 'Suggest different time after decline',
            features: ['Decline notice', 'Date picker', 'Time picker', 'Submit button'],
          },
        ].map((state) => (
          <div
            key={state.view}
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{
              display: 'inline-block',
              padding: '4px 8px',
              backgroundColor: '#f3e8ff',
              color: '#7c3aed',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '8px',
            }}>
              {state.view}
            </div>
            <h3 style={{ margin: '0 0 8px', color: '#1f2937', fontSize: '16px' }}>{state.title}</h3>
            <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: '14px' }}>{state.description}</p>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#9ca3af', fontSize: '13px' }}>
              {state.features.map((feature, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#fef3c7', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 8px', color: '#92400e' }}>Workflow Flow</h4>
        <p style={{ margin: 0, color: '#b45309', fontSize: '14px' }}>
          <strong>New Meeting:</strong> request → respond → details<br />
          <strong>Declined:</strong> request → respond (decline) → alternative → respond → details<br />
          <strong>Cancellation:</strong> details → cancel → (removed)
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete overview of all 5 states in the virtual meeting workflow.',
      },
    },
  },
};
