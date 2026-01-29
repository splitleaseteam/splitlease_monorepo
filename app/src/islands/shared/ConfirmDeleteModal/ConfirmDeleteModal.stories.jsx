/**
 * ConfirmDeleteModal Component Stories
 *
 * A confirmation modal for delete actions with danger styling.
 */

import { useState } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import './ConfirmDeleteModal.css';

export default {
  title: 'Modals/ConfirmDeleteModal',
  component: ConfirmDeleteModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## ConfirmDeleteModal Component

A confirmation modal for destructive delete actions following the Popup Replication Protocol.

### Features
- Monochromatic purple color scheme
- Danger variant with outlined red button
- Mobile bottom sheet behavior (< 480px)
- Feather icons (stroke-only)
- Pill-shaped buttons (100px radius)
- Fixed header/footer with scrollable body
- Escape key to close
- Backdrop click to close
- Loading state for confirm button

### Design Protocol
- Red is OUTLINED ONLY (per protocol rules)
- No green/yellow colors
- Consistent with Split Lease design system

### Usage
\`\`\`jsx
import ConfirmDeleteModal from 'islands/shared/ConfirmDeleteModal/ConfirmDeleteModal';

<ConfirmDeleteModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={handleDelete}
  title="Delete Listing"
  itemName="Cozy Chelsea Studio"
  warning="This listing has active proposals."
  isLoading={isDeleting}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls modal visibility',
    },
    title: {
      control: 'text',
      description: 'Modal title',
    },
    itemName: {
      control: 'text',
      description: 'Name of item being deleted',
    },
    message: {
      control: 'text',
      description: 'Custom message (optional)',
    },
    warning: {
      control: 'text',
      description: 'Warning text for additional context',
    },
    confirmText: {
      control: 'text',
      description: 'Text for confirm button',
    },
    cancelText: {
      control: 'text',
      description: 'Text for cancel button',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state for confirm button',
    },
    onClose: { action: 'closed' },
    onConfirm: { action: 'confirmed' },
  },
};

// Interactive wrapper
const DeleteModalDemo = ({ initialOpen = false, ...args }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsOpen(false);
      console.log('Item deleted!');
    }, 1500);
  };

  return (
    <div style={{ padding: '40px' }}>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 24px',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        Delete Item
      </button>
      <ConfirmDeleteModal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </div>
  );
};

// Default
export const Default = {
  render: (args) => <DeleteModalDemo {...args} />,
  args: {
    title: 'Delete Listing',
    itemName: 'Cozy Chelsea Studio',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  },
};

// With Warning
export const WithWarning = {
  render: (args) => <DeleteModalDemo {...args} />,
  args: {
    title: 'Delete Listing',
    itemName: 'Sunny Williamsburg Loft',
    warning: 'This listing has 3 active proposals. Deleting it will automatically cancel all pending proposals.',
    confirmText: 'Delete Anyway',
    cancelText: 'Keep Listing',
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with warning banner for items with dependencies.',
      },
    },
  },
};

// Custom Message
export const CustomMessage = {
  render: (args) => <DeleteModalDemo {...args} />,
  args: {
    title: 'Remove Photo',
    itemName: 'Living Room Photo',
    message: 'This photo will be permanently removed from your listing. Are you sure you want to continue?',
    confirmText: 'Remove Photo',
    cancelText: 'Keep Photo',
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with custom message text.',
      },
    },
  },
};

// Loading State
export const LoadingState = {
  args: {
    isOpen: true,
    title: 'Delete Account',
    itemName: 'John Smith Account',
    warning: 'All your data, listings, and proposals will be permanently deleted.',
    confirmText: 'Delete Account',
    cancelText: 'Cancel',
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal in loading state showing spinner on confirm button.',
      },
    },
  },
};

// Always Open (For Visual Testing)
export const AlwaysOpen = {
  args: {
    isOpen: true,
    title: 'Delete Listing',
    itemName: 'Cozy Chelsea Studio',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    isLoading: false,
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
  args: {
    isOpen: true,
    title: 'Delete Listing',
    itemName: 'Cozy Chelsea Studio',
    warning: 'This listing has active reservations.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile view with bottom sheet styling and grab handle.',
      },
    },
  },
};

// No Item Name
export const NoItemName = {
  render: (args) => <DeleteModalDemo {...args} />,
  args: {
    title: 'Clear All Data',
    message: 'Are you sure you want to clear all cached data? This will log you out of the application.',
    confirmText: 'Clear Data',
    cancelText: 'Cancel',
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal without item name preview - uses only message.',
      },
    },
  },
};

// Delete User Scenario
export const DeleteUserAccount = {
  render: (args) => <DeleteModalDemo {...args} />,
  args: {
    title: 'Delete Account',
    itemName: 'sarah.johnson@email.com',
    message: 'Deleting your account will permanently remove all your data, including:',
    warning: '- All listings you have created\n- All proposals (sent and received)\n- All messages and conversations\n- Payment history and invoices',
    confirmText: 'Delete My Account',
    cancelText: 'Keep Account',
  },
  parameters: {
    docs: {
      description: {
        story: 'Account deletion scenario with detailed warning.',
      },
    },
  },
};

// Delete Proposal Scenario
export const DeleteProposal = {
  render: (args) => <DeleteModalDemo {...args} />,
  args: {
    title: 'Cancel Proposal',
    itemName: 'Proposal #12345',
    message: 'Are you sure you want to cancel this proposal? The host will be notified.',
    confirmText: 'Cancel Proposal',
    cancelText: 'Keep Proposal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Proposal cancellation scenario.',
      },
    },
  },
};

// All Variations
const AllVariationsWrapper = () => {
  const [openModal, setOpenModal] = useState(null);

  const scenarios = [
    {
      id: 'listing',
      button: 'Delete Listing',
      props: {
        title: 'Delete Listing',
        itemName: 'Chelsea Studio',
      },
    },
    {
      id: 'photo',
      button: 'Remove Photo',
      props: {
        title: 'Remove Photo',
        itemName: 'Bedroom Photo',
        confirmText: 'Remove',
      },
    },
    {
      id: 'proposal',
      button: 'Cancel Proposal',
      props: {
        title: 'Cancel Proposal',
        itemName: 'Proposal #12345',
        confirmText: 'Cancel Proposal',
      },
    },
    {
      id: 'account',
      button: 'Delete Account',
      props: {
        title: 'Delete Account',
        itemName: 'user@email.com',
        warning: 'This action cannot be undone.',
        confirmText: 'Delete Account',
      },
    },
  ];

  return (
    <div style={{ padding: '40px' }}>
      <h3 style={{ margin: '0 0 20px', color: '#1f2937' }}>Delete Scenarios</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => setOpenModal(scenario.id)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {scenario.button}
          </button>
        ))}
      </div>

      {scenarios.map((scenario) => (
        <ConfirmDeleteModal
          key={scenario.id}
          isOpen={openModal === scenario.id}
          onClose={() => setOpenModal(null)}
          onConfirm={() => {
            console.log(`Confirmed: ${scenario.id}`);
            setOpenModal(null);
          }}
          {...scenario.props}
        />
      ))}
    </div>
  );
};

export const AllVariations = {
  render: () => <AllVariationsWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Demo showing multiple delete scenarios. Click each button to see the appropriate modal.',
      },
    },
  },
};
