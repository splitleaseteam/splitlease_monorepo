/**
 * NotificationToggle Component Stories
 *
 * iOS-style toggle switch for notification preferences with keyboard accessibility.
 */

import { useState } from 'react';
import NotificationToggle from './NotificationToggle';
import './NotificationToggle.css';

export default {
  title: 'NotificationSettingsIsland/NotificationToggle',
  component: NotificationToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## NotificationToggle Component

An iOS-style toggle switch for notification preferences.

### Features
- Smooth state transitions with CSS animations
- Full keyboard accessibility (Enter/Space to toggle)
- Disabled state support
- ARIA attributes for screen readers
- CSS classes following design system protocol

### Color Scheme
- **Enabled**: #31135D (Protocol Primary Purple)
- **Disabled/Off**: #E0E0E0 (Light Gray)

### Usage
\`\`\`jsx
import NotificationToggle from 'islands/shared/NotificationSettingsIsland/NotificationToggle';

<NotificationToggle
  checked={isEnabled}
  onChange={(newValue) => setIsEnabled(newValue)}
  disabled={false}
  ariaLabel="Enable email notifications"
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Current toggle state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the toggle is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for screen readers',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Toggle notification' },
      },
    },
    onChange: {
      action: 'changed',
      description: 'Called when toggle state changes',
    },
  },
};

// Interactive wrapper for stories
const ToggleDemo = ({ initialChecked = false, ...args }) => {
  const [checked, setChecked] = useState(initialChecked);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <NotificationToggle
        {...args}
        checked={checked}
        onChange={(newValue) => {
          setChecked(newValue);
          console.log('Toggle changed to:', newValue);
        }}
      />
      <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
        Status: {checked ? 'On' : 'Off'}
      </p>
    </div>
  );
};

// Default - Off State
export const Default = {
  render: (args) => <ToggleDemo {...args} />,
  args: {
    disabled: false,
    ariaLabel: 'Toggle notification',
  },
};

// Enabled State
export const Enabled = {
  render: (args) => <ToggleDemo {...args} initialChecked={true} />,
  args: {
    disabled: false,
    ariaLabel: 'Toggle notification',
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle in the enabled (checked) state with purple background.',
      },
    },
  },
};

// Disabled Off
export const DisabledOff = {
  args: {
    checked: false,
    disabled: true,
    ariaLabel: 'Toggle notification (disabled)',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled toggle in the off state. Cannot be interacted with.',
      },
    },
  },
};

// Disabled On
export const DisabledOn = {
  args: {
    checked: true,
    disabled: true,
    ariaLabel: 'Toggle notification (disabled)',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled toggle in the on state. Shows enabled but cannot be changed.',
      },
    },
  },
};

// In Form Context
const InFormContextWrapper = () => {
  const [preferences, setPreferences] = useState({
    sms: true,
    email: false,
    push: true,
  });

  const handleToggle = (key) => (newValue) => {
    setPreferences((prev) => ({ ...prev, [key]: newValue }));
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      width: '320px',
    }}>
      <h3 style={{ margin: '0 0 20px', color: '#1f2937', fontSize: '16px' }}>
        Notification Preferences
      </h3>

      {[
        { key: 'sms', label: 'SMS Notifications' },
        { key: 'email', label: 'Email Notifications' },
        { key: 'push', label: 'Push Notifications' },
      ].map(({ key, label }) => (
        <div key={key} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>
          <NotificationToggle
            checked={preferences[key]}
            onChange={handleToggle(key)}
            ariaLabel={`Toggle ${label.toLowerCase()}`}
          />
        </div>
      ))}

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#6b7280',
      }}>
        Active: {Object.entries(preferences).filter(([, v]) => v).map(([k]) => k.toUpperCase()).join(', ') || 'None'}
      </div>
    </div>
  );
};

export const InFormContext = {
  render: () => <InFormContextWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Multiple toggles used in a notification preferences form context.',
      },
    },
  },
};

// All States Comparison
export const AllStates = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ width: '120px', fontSize: '14px', color: '#374151' }}>Off:</span>
        <NotificationToggle checked={false} onChange={() => {}} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ width: '120px', fontSize: '14px', color: '#374151' }}>On:</span>
        <NotificationToggle checked={true} onChange={() => {}} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ width: '120px', fontSize: '14px', color: '#374151' }}>Disabled Off:</span>
        <NotificationToggle checked={false} disabled={true} onChange={() => {}} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ width: '120px', fontSize: '14px', color: '#374151' }}>Disabled On:</span>
        <NotificationToggle checked={true} disabled={true} onChange={() => {}} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all toggle states.',
      },
    },
  },
};

// Keyboard Accessibility Demo
export const KeyboardAccessibility = {
  render: (args) => (
    <div style={{ textAlign: 'center' }}>
      <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
        Focus the toggle and press Enter or Space to change state:
      </p>
      <ToggleDemo {...args} />
      <p style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af' }}>
        Tab to focus, Enter/Space to toggle, works with screen readers
      </p>
    </div>
  ),
  args: {
    disabled: false,
    ariaLabel: 'Demo toggle - press Enter or Space to change',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates keyboard accessibility. Tab to focus, then use Enter or Space to toggle.',
      },
    },
  },
};
