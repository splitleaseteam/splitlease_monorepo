/**
 * Button Component Stories
 *
 * A versatile button component supporting multiple variants, sizes, and states.
 * Used throughout the application for primary actions, form submissions, and navigation.
 */
import Button from './Button';
import { Search, Plus, ChevronRight, Download } from 'lucide-react';

export default {
  title: 'Shared/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## Button Component

A reusable button component that supports multiple variants, sizes, loading states, and icons.

### Usage

\`\`\`jsx
import Button from 'islands/shared/Button';

<Button variant="primary" size="medium" onClick={handleClick}>
  Click Me
</Button>
\`\`\`

### Variants
- **primary**: Brand purple background, white text (default)
- **secondary**: Light purple background, purple text
- **ghost**: Transparent background, purple text on hover
- **outline**: White background with purple border

### Sizes
- **small**: Compact size for inline actions
- **medium**: Default size for most use cases
- **large**: Prominent CTAs and form submissions
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline'],
      description: 'Visual style variant of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'medium' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables interaction',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables button interaction',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes button span full container width',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Position of icon relative to text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'left' },
      },
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type attribute',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'button' },
      },
    },
    children: {
      control: 'text',
      description: 'Button text content',
    },
    onClick: {
      action: 'clicked',
      description: 'Click event handler',
    },
  },
};

// Default story
export const Default = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'medium',
  },
};

// Variants
export const Primary = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Ghost = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Outline = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

// Sizes
export const Small = {
  args: {
    children: 'Small Button',
    size: 'small',
  },
};

export const Medium = {
  args: {
    children: 'Medium Button',
    size: 'medium',
  },
};

export const Large = {
  args: {
    children: 'Large Button',
    size: 'large',
  },
};

// States
export const Loading = {
  args: {
    children: 'Loading...',
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button in loading state shows a spinner and is disabled.',
      },
    },
  },
};

export const Disabled = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const FullWidth = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// With Icons
export const WithIconLeft = {
  args: {
    children: 'Search',
    icon: <Search size={18} />,
    iconPosition: 'left',
  },
};

export const WithIconRight = {
  args: {
    children: 'Next',
    icon: <ChevronRight size={18} />,
    iconPosition: 'right',
  },
};

export const IconOnlyButton = {
  args: {
    children: '',
    icon: <Plus size={18} />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with only an icon, useful for compact actions.',
      },
    },
  },
};

// All Variants Grid
export const AllVariants = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ marginBottom: '12px', color: '#374151' }}>Variants</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
        </div>
      </div>
      <div>
        <h3 style={{ marginBottom: '12px', color: '#374151' }}>Sizes</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
        </div>
      </div>
      <div>
        <h3 style={{ marginBottom: '12px', color: '#374151' }}>States</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button>Normal</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>
      <div>
        <h3 style={{ marginBottom: '12px', color: '#374151' }}>With Icons</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button icon={<Search size={18} />}>Search</Button>
          <Button icon={<Plus size={18} />}>Add New</Button>
          <Button icon={<Download size={18} />} variant="secondary">Download</Button>
          <Button icon={<ChevronRight size={18} />} iconPosition="right">Continue</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete overview of all button variants, sizes, states, and icon configurations.',
      },
    },
  },
};

// Mobile View
export const MobileView = {
  args: {
    children: 'Mobile Button',
    fullWidth: true,
    size: 'large',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};
