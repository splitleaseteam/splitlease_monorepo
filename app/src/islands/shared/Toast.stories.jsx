/**
 * Toast Component Stories
 *
 * Toast notification system for success, error, warning, and info messages.
 * Supports both context-based and global usage patterns.
 */
import { useState } from 'react';
import Toast, { ToastProvider, useToast } from './Toast';

export default {
  title: 'Shared/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## Toast Notification System

A comprehensive toast notification system supporting multiple alert types with auto-dismiss.

### Alert Types

| Type | Color | Use Case |
|------|-------|----------|
| success | Green (#22C55E) | Confirmations, completed actions |
| error | Red (#EF4444) | Failures, validation errors |
| warning | Amber (#F59E0B) | Cautions, attention needed |
| info | Blue (#3B82F6) | Tips, general information |
| default | Gray (#454444) | Fallback when no type |

### Usage with ToastProvider

\`\`\`jsx
// Wrap your app
<ToastProvider>
  <App />
</ToastProvider>

// In any component
function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast({
      title: 'Success!',
      content: 'Your changes have been saved.',
      type: 'success',
      duration: 5000,
    });
  };

  return <button onClick={handleSuccess}>Save</button>;
}
\`\`\`

### Global Usage (outside React components)

\`\`\`jsx
import { showToast } from 'islands/shared/Toast';

showToast({ title: 'Saved!', type: 'success' });
\`\`\`
        `,
      },
    },
    layout: 'fullscreen',
  },
};

// Interactive demo component
function ToastDemo() {
  const { showToast } = useToast();

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '16px', color: '#31135D' }}>Click to show toasts:</h3>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => showToast({
            title: 'Success!',
            content: 'Your changes have been saved.',
            type: 'success',
          })}
          style={{
            padding: '8px 16px',
            backgroundColor: '#22C55E',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Show Success
        </button>
        <button
          onClick={() => showToast({
            title: 'Error',
            content: 'Something went wrong. Please try again.',
            type: 'error',
          })}
          style={{
            padding: '8px 16px',
            backgroundColor: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Show Error
        </button>
        <button
          onClick={() => showToast({
            title: 'Warning',
            content: 'Your session will expire in 5 minutes.',
            type: 'warning',
          })}
          style={{
            padding: '8px 16px',
            backgroundColor: '#F59E0B',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Show Warning
        </button>
        <button
          onClick={() => showToast({
            title: 'Did you know?',
            content: 'You can customize your notification settings.',
            type: 'info',
          })}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Show Info
        </button>
      </div>
    </div>
  );
}

// Interactive demo with provider
export const Interactive = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo - click buttons to trigger different toast types.',
      },
    },
  },
};

// Wrapper components for static toast examples (hooks require proper component names)
function SuccessToastWrapper() {
  const [toasts, setToasts] = useState([
    {
      id: 1,
      title: 'Success!',
      content: 'Your changes have been saved.',
      type: 'success',
      duration: 0,
      showProgress: false,
    },
  ]);

  return (
    <div style={{ minHeight: '100px', position: 'relative' }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

function ErrorToastWrapper() {
  const [toasts, setToasts] = useState([
    {
      id: 1,
      title: 'Error',
      content: 'Failed to save changes. Please try again.',
      type: 'error',
      duration: 0,
      showProgress: false,
    },
  ]);

  return (
    <div style={{ minHeight: '100px', position: 'relative' }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

function WarningToastWrapper() {
  const [toasts, setToasts] = useState([
    {
      id: 1,
      title: 'Warning',
      content: 'Your session will expire in 5 minutes.',
      type: 'warning',
      duration: 0,
      showProgress: false,
    },
  ]);

  return (
    <div style={{ minHeight: '100px', position: 'relative' }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

function InfoToastWrapper() {
  const [toasts, setToasts] = useState([
    {
      id: 1,
      title: 'Did you know?',
      content: 'You can customize your notification settings in your profile.',
      type: 'info',
      duration: 0,
      showProgress: false,
    },
  ]);

  return (
    <div style={{ minHeight: '100px', position: 'relative' }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

function TitleOnlyWrapper() {
  const [toasts, setToasts] = useState([
    {
      id: 1,
      title: 'Saved!',
      content: null,
      type: 'success',
      duration: 0,
      showProgress: false,
    },
  ]);

  return (
    <div style={{ minHeight: '100px', position: 'relative' }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

function WithProgressWrapper() {
  const [toasts, setToasts] = useState([
    {
      id: 1,
      title: 'Processing...',
      content: 'Your request is being handled.',
      type: 'info',
      duration: 10000,
      showProgress: true,
    },
  ]);

  return (
    <div style={{ minHeight: '100px', position: 'relative' }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

function MultipleToastsWrapper() {
  const [toasts, setToasts] = useState([
    {
      id: 1,
      title: 'Profile updated',
      content: 'Your profile changes have been saved.',
      type: 'success',
      duration: 0,
      showProgress: false,
    },
    {
      id: 2,
      title: 'New message',
      content: 'You have a new message from John.',
      type: 'info',
      duration: 0,
      showProgress: false,
    },
    {
      id: 3,
      title: 'Warning',
      content: 'Your subscription expires tomorrow.',
      type: 'warning',
      duration: 0,
      showProgress: false,
    },
  ]);

  return (
    <div style={{ minHeight: '200px', position: 'relative' }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

function AllTypesWrapper() {
  const [toasts, setToasts] = useState([
    {
      id: 1,
      title: 'Success!',
      content: 'Action completed successfully.',
      type: 'success',
      duration: 0,
      showProgress: false,
    },
    {
      id: 2,
      title: 'Error',
      content: 'Something went wrong.',
      type: 'error',
      duration: 0,
      showProgress: false,
    },
    {
      id: 3,
      title: 'Warning',
      content: 'Please review before proceeding.',
      type: 'warning',
      duration: 0,
      showProgress: false,
    },
    {
      id: 4,
      title: 'Info',
      content: 'Here is some helpful information.',
      type: 'info',
      duration: 0,
      showProgress: false,
    },
  ]);

  return (
    <div style={{ minHeight: '300px', position: 'relative' }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

function LongContentWrapper() {
  const [toasts, setToasts] = useState([
    {
      id: 1,
      title: 'Important Notice',
      content: 'This is a longer message that demonstrates how the toast component handles extended content. The toast should expand to accommodate the text while remaining readable and accessible.',
      type: 'info',
      duration: 0,
      showProgress: false,
    },
  ]);

  return (
    <div style={{ minHeight: '120px', position: 'relative' }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}

// Static toast examples for documentation
export const SuccessToast = {
  render: () => <SuccessToastWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Success toast for confirmations and completed actions.',
      },
    },
  },
};

export const ErrorToast = {
  render: () => <ErrorToastWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Error toast for failures and critical issues.',
      },
    },
  },
};

export const WarningToast = {
  render: () => <WarningToastWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Warning toast for cautions and non-critical issues.',
      },
    },
  },
};

export const InfoToast = {
  render: () => <InfoToastWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Info toast for tips and general information.',
      },
    },
  },
};

// Title only (no content)
export const TitleOnly = {
  render: () => <TitleOnlyWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Compact toast with title only, no description.',
      },
    },
  },
};

// With progress bar
export const WithProgress = {
  render: () => <WithProgressWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Toast with progress bar showing auto-dismiss countdown.',
      },
    },
  },
};

// Multiple toasts stacked
export const MultipleToasts = {
  render: () => <MultipleToastsWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Multiple toasts stacked vertically (max 5 visible at once).',
      },
    },
  },
};

// All types gallery
export const AllTypes = {
  render: () => <AllTypesWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'All four toast types displayed together for comparison.',
      },
    },
  },
};

// Long content
export const LongContent = {
  render: () => <LongContentWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Toast with longer content showing text wrapping behavior.',
      },
    },
  },
};
