/**
 * LoadingOverlay Component Stories
 *
 * Full-screen loading indicator with Lottie animation for AI processing.
 */

import { LoadingOverlay } from './LoadingOverlay';

export default {
  title: 'AIRoomRedesign/LoadingOverlay',
  component: LoadingOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## LoadingOverlay Component

A full-screen loading overlay with animated spinner for AI processing tasks.

### Features
- Backdrop blur effect
- Lottie animation spinner
- Customizable loading message
- Bouncing dot indicators
- Fade-in animation

### Usage
\`\`\`jsx
import { LoadingOverlay } from 'islands/shared/AIRoomRedesign/LoadingOverlay';

<LoadingOverlay
  isVisible={isProcessing}
  message="Generating your redesign..."
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Whether the overlay is visible',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    message: {
      control: 'text',
      description: 'Loading message to display',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Generating your redesign...' },
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '40px' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ margin: '0 0 16px', color: '#1f2937' }}>Background Content</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            This content is behind the loading overlay when it's visible.
            The overlay uses backdrop-blur for a frosted glass effect.
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Default - Visible
export const Default = {
  args: {
    isVisible: true,
    message: 'Generating your redesign...',
  },
};

// Custom Message
export const CustomMessage = {
  args: {
    isVisible: true,
    message: 'Analyzing room layout...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading overlay with a custom message.',
      },
    },
  },
};

// Processing Upload
export const ProcessingUpload = {
  args: {
    isVisible: true,
    message: 'Processing your photo...',
  },
};

// Applying Style
export const ApplyingStyle = {
  args: {
    isVisible: true,
    message: 'Applying Modern Minimalist style...',
  },
};

// Hidden
export const Hidden = {
  args: {
    isVisible: false,
    message: 'This should not be visible',
  },
  parameters: {
    docs: {
      description: {
        story: 'When isVisible is false, the component renders nothing.',
      },
    },
  },
};

// All Messages
export const AllMessages = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ margin: 0, color: '#1f2937' }}>Common Loading Messages</h3>
      <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', lineHeight: '2' }}>
        <li>"Generating your redesign..."</li>
        <li>"Processing your photo..."</li>
        <li>"Analyzing room layout..."</li>
        <li>"Applying [Style Name] style..."</li>
        <li>"Creating virtual staging..."</li>
        <li>"Enhancing image quality..."</li>
        <li>"Almost done..."</li>
      </ul>
      <p style={{ margin: '16px 0 0', color: '#9ca3af', fontSize: '14px' }}>
        Toggle isVisible in the controls above to see the overlay.
      </p>
    </div>
  ),
  args: {
    isVisible: false,
  },
};
