/**
 * InformationalText Component Stories
 *
 * A tooltip-style informational popup that displays content below a trigger element.
 * Supports expandable content with "Show more" functionality.
 */

import { useRef, useState } from 'react';
import InformationalText from './InformationalText';

export default {
  title: 'Shared/InformationalText',
  component: InformationalText,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## InformationalText Component

A positioned tooltip/popup that shows informational content below a trigger element.

### Features
- Automatic positioning relative to trigger element
- Viewport boundary awareness (adjusts position if would overflow)
- Expandable content with "Show more/less" toggle
- Close on Escape key or click outside
- Legacy pricing tooltip support

### Usage
\`\`\`jsx
import InformationalText from 'islands/shared/InformationalText';

const triggerRef = useRef(null);

<button ref={triggerRef} onClick={() => setIsOpen(true)}>
  Info
</button>

<InformationalText
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  triggerRef={triggerRef}
  title="Important Information"
  content="This is the main informational content."
  expandedContent="Additional details shown when expanded."
  showMoreAvailable={true}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the tooltip is visible',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    title: {
      control: 'text',
      description: 'Title shown at the top of the tooltip',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Information' },
      },
    },
    content: {
      control: 'text',
      description: 'Main content to display',
      table: {
        type: { summary: 'string' },
      },
    },
    expandedContent: {
      control: 'text',
      description: 'Content shown when "Show more" is clicked',
      table: {
        type: { summary: 'string' },
      },
    },
    showMoreAvailable: {
      control: 'boolean',
      description: 'Whether to show the "Show more" button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

// Interactive wrapper for Storybook
const InformationalTextDemo = ({ title, content, expandedContent, showMoreAvailable }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <div style={{ padding: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <p style={{ color: '#6b7280', fontSize: '14px' }}>Click the button below to open the tooltip</p>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          backgroundColor: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#3b82f6">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
        Show Information
      </button>

      <InformationalText
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        title={title}
        content={content}
        expandedContent={expandedContent}
        showMoreAvailable={showMoreAvailable}
      />
    </div>
  );
};

// Default story
export const Default = {
  render: (args) => <InformationalTextDemo {...args} />,
  args: {
    title: 'Information',
    content: 'This is helpful information about the feature you are viewing.',
    expandedContent: null,
    showMoreAvailable: false,
  },
};

// With expanded content
export const WithExpandedContent = {
  render: (args) => <InformationalTextDemo {...args} />,
  args: {
    title: 'Pricing Information',
    content: 'The starting nightly price is $150.00. Pricing varies based on how many nights per week you select.',
    expandedContent: '2 nights/week: $175.00/night\n3 nights/week: $165.00/night\n4 nights/week: $155.00/night\n5 nights/week: $145.00/night\n7 nights/week: $130.00/night',
    showMoreAvailable: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip with expandable content. Click "Show more" to see pricing tiers.',
      },
    },
  },
};

// Long content
export const LongContent = {
  render: (args) => <InformationalTextDemo {...args} />,
  args: {
    title: 'House Rules',
    content: 'Please be respectful of neighbors and keep noise to a minimum after 10pm. No smoking is permitted anywhere on the property. Pets are welcome with prior approval and a $50 pet fee. Check-in is at 3pm and check-out is at 11am. Please ensure all windows and doors are locked when leaving the property.',
    expandedContent: null,
    showMoreAvailable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip with longer content that wraps naturally.',
      },
    },
  },
};

// Custom title
export const CustomTitle = {
  render: (args) => <InformationalTextDemo {...args} />,
  args: {
    title: 'What is Periodic Tenancy?',
    content: 'Periodic tenancy is a rental arrangement where you stay on specific days each week, allowing you to split your time between locations. This flexible approach gives you the freedom of city living while maintaining another home base.',
    expandedContent: 'Benefits include:\n- Lower monthly costs than full-time rental\n- Flexibility to adjust schedule\n- No long-term commitment required\n- Perfect for commuters and digital nomads',
    showMoreAvailable: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip with a custom title and expandable benefits list.',
      },
    },
  },
};

// Static display for closed state
export const ClosedState = {
  render: () => (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        When isOpen is false, the component renders nothing.
      </p>
      <InformationalText
        isOpen={false}
        onClose={() => {}}
        triggerRef={{ current: null }}
        title="Hidden"
        content="This content is not visible"
      />
      <div style={{
        padding: '20px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        color: '#374151'
      }}>
        Component renders null when closed
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'When isOpen is false, the component returns null and renders nothing.',
      },
    },
  },
};
