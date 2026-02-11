/**
 * ProposalSuccessModal Component Stories
 *
 * Success modal displayed after a proposal is submitted.
 * Provides navigation to Rental Application or Guest Dashboard.
 */

import { useState } from 'react';
import ProposalSuccessModal from './ProposalSuccessModal';

export default {
  title: 'Modals/ProposalSuccessModal',
  component: ProposalSuccessModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## ProposalSuccessModal Component

Displayed after successful proposal submission with CTAs for next steps.

### Features
- Success icon and congratulatory message
- "What's Next?" guidance section
- Primary CTA: Submit Rental Application (if not already submitted)
- Secondary CTA: Go to Guest Dashboard
- Adapts layout based on whether rental app is already submitted

### Usage
\`\`\`jsx
import ProposalSuccessModal from 'islands/modals/ProposalSuccessModal';

<ProposalSuccessModal
  proposalId="proposal-123"
  listingName="Cozy Chelsea Studio"
  onClose={() => setShowModal(false)}
  hasSubmittedRentalApp={false}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    proposalId: {
      control: 'text',
      description: 'ID of the submitted proposal',
    },
    listingName: {
      control: 'text',
      description: 'Name of the listing for display',
    },
    hasSubmittedRentalApp: {
      control: 'boolean',
      description: 'Whether user has already submitted a rental application',
    },
    onClose: {
      action: 'closed',
      description: 'Called when modal is closed',
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
const ProposalSuccessDemo = ({ proposalId, listingName, hasSubmittedRentalApp }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Show Success Modal
        </button>
      </div>

      {isOpen && (
        <ProposalSuccessModal
          proposalId={proposalId}
          listingName={listingName}
          onClose={() => setIsOpen(false)}
          hasSubmittedRentalApp={hasSubmittedRentalApp}
        />
      )}
    </>
  );
};

// Default - Rental App Not Submitted
export const Default = {
  render: () => (
    <ProposalSuccessDemo
      proposalId="proposal-123"
      listingName="Cozy Chelsea Studio"
      hasSubmittedRentalApp={false}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default state when rental application has not been submitted. Shows recommendation to submit rental app.',
      },
    },
  },
};

// Rental App Already Submitted
export const RentalAppSubmitted = {
  render: () => (
    <ProposalSuccessDemo
      proposalId="proposal-456"
      listingName="Sunny Williamsburg Loft"
      hasSubmittedRentalApp={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'When rental application is already on file. Dashboard becomes the primary CTA.',
      },
    },
  },
};

// Long Listing Name
export const LongListingName = {
  render: () => (
    <ProposalSuccessDemo
      proposalId="proposal-789"
      listingName="Beautiful Spacious 2BR Apartment with Amazing City Views in the Heart of Manhattan"
      hasSubmittedRentalApp={false}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'How the modal handles long listing names.',
      },
    },
  },
};

// No Listing Name
export const NoListingName = {
  render: () => (
    <ProposalSuccessDemo
      proposalId="proposal-000"
      listingName={null}
      hasSubmittedRentalApp={false}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'When listing name is not provided, that section is not displayed.',
      },
    },
  },
};

// All Variants Overview
export const AllVariants = {
  render: () => (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '32px', color: '#1f2937', textAlign: 'center' }}>
        ProposalSuccessModal Variants
      </h2>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
        {/* Without Rental App */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '16px',
          }}>
            Rental App Not Submitted
          </div>

          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#dcfce7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="32" height="32" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 style={{ textAlign: 'center', margin: '0 0 8px', color: '#1f2937' }}>
            Proposal Submitted!
          </h3>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', margin: '0 0 16px' }}>
            Your proposal for <span style={{ color: '#7c3aed', fontWeight: '500' }}>Cozy Chelsea Studio</span> has been sent.
          </p>

          <div style={{
            backgroundColor: '#f5f3ff',
            padding: '16px',
            borderRadius: '8px',
            borderLeft: '4px solid #7c3aed',
            marginBottom: '20px',
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#5b21b6', fontSize: '14px' }}>What&apos;s Next?</h4>
            <p style={{ margin: 0, color: '#6d28d9', fontSize: '14px' }}>
              Complete your rental application to increase your chances of approval.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button style={{
              padding: '14px 20px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}>
              Submit Rental Application (Recommended)
            </button>
            <button style={{
              padding: '14px 20px',
              backgroundColor: 'white',
              color: '#7c3aed',
              border: '2px solid #7c3aed',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}>
              Go to Guest Dashboard
            </button>
          </div>
        </div>

        {/* With Rental App */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '16px',
          }}>
            Rental App Already Submitted
          </div>

          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#dcfce7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="32" height="32" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 style={{ textAlign: 'center', margin: '0 0 8px', color: '#1f2937' }}>
            Proposal Submitted!
          </h3>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', margin: '0 0 16px' }}>
            Your proposal for <span style={{ color: '#7c3aed', fontWeight: '500' }}>Cozy Chelsea Studio</span> has been sent.
          </p>

          <div style={{
            backgroundColor: '#f5f3ff',
            padding: '16px',
            borderRadius: '8px',
            borderLeft: '4px solid #7c3aed',
            marginBottom: '20px',
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#5b21b6', fontSize: '14px' }}>What&apos;s Next?</h4>
            <p style={{ margin: 0, color: '#6d28d9', fontSize: '14px' }}>
              Your rental application is already on file. The host will review and get back to you.
            </p>
          </div>

          <button style={{
            width: '100%',
            padding: '14px 20px',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}>
            Go to Guest Dashboard
          </button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of both modal variants.',
      },
    },
  },
};
