/**
 * NotificationCategoryRow Component Stories
 *
 * Single category row with SMS and Email toggle columns for notification preferences.
 */

import { useState } from 'react';
import NotificationCategoryRow from './NotificationCategoryRow';
import './NotificationCategoryRow.css';

// Mock category data
const messageForwardingCategory = {
  id: 'message_forwarding',
  label: 'Message Forwarding',
  description: 'Receive forwarded messages via your preferred channel',
};

const paymentRemindersCategory = {
  id: 'payment_reminders',
  label: 'Payment Reminders',
  description: 'Billing and payment notifications',
};

const promotionalCategory = {
  id: 'promotional',
  label: 'Promotional',
  description: 'Marketing and promotional content',
};

const reservationUpdatesCategory = {
  id: 'reservation_updates',
  label: 'Reservation Updates',
  description: 'Changes to your bookings',
};

export default {
  title: 'NotificationSettingsIsland/NotificationCategoryRow',
  component: NotificationCategoryRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## NotificationCategoryRow Component

A single notification category row with SMS and Email toggle columns.

### Features
- Category label and description
- Two toggles: SMS and Email
- Pending state support for each toggle
- Last row variant (no bottom border)
- CSS classes following design protocol

### Layout
- Left: Label section (title + description)
- Right: Toggle section (SMS column + Email column)

### Usage
\`\`\`jsx
import NotificationCategoryRow from 'islands/shared/NotificationSettingsIsland/NotificationCategoryRow';

<NotificationCategoryRow
  category={{ label: 'Payment Reminders', description: 'Billing notifications' }}
  smsEnabled={true}
  emailEnabled={false}
  onToggleSms={(checked) => handleSmsToggle(checked)}
  onToggleEmail={(checked) => handleEmailToggle(checked)}
  smsPending={false}
  emailPending={false}
  isLast={false}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    smsEnabled: {
      control: 'boolean',
      description: 'SMS toggle state',
    },
    emailEnabled: {
      control: 'boolean',
      description: 'Email toggle state',
    },
    smsPending: {
      control: 'boolean',
      description: 'SMS toggle pending state',
    },
    emailPending: {
      control: 'boolean',
      description: 'Email toggle pending state',
    },
    isLast: {
      control: 'boolean',
      description: 'Whether this is the last row (removes bottom border)',
    },
    onToggleSms: { action: 'smsToggled' },
    onToggleEmail: { action: 'emailToggled' },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '600px', backgroundColor: 'white', padding: '24px', borderRadius: '12px' }}>
        {/* Header row with column labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '24px',
          marginBottom: '8px',
          paddingRight: '8px',
        }}>
          <span style={{ width: '60px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
            SMS
          </span>
          <span style={{ width: '60px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
            Email
          </span>
        </div>
        <Story />
      </div>
    ),
  ],
};

// Interactive wrapper
const CategoryRowDemo = ({ category, ...args }) => {
  const [smsEnabled, setSmsEnabled] = useState(args.smsEnabled || false);
  const [emailEnabled, setEmailEnabled] = useState(args.emailEnabled || false);

  return (
    <NotificationCategoryRow
      category={category}
      smsEnabled={smsEnabled}
      emailEnabled={emailEnabled}
      onToggleSms={(checked) => {
        setSmsEnabled(checked);
        console.log(`${category.label} SMS:`, checked);
      }}
      onToggleEmail={(checked) => {
        setEmailEnabled(checked);
        console.log(`${category.label} Email:`, checked);
      }}
      {...args}
    />
  );
};

// Default
export const Default = {
  render: (args) => <CategoryRowDemo {...args} category={messageForwardingCategory} />,
  args: {
    smsEnabled: false,
    emailEnabled: false,
    smsPending: false,
    emailPending: false,
    isLast: false,
  },
};

// Both Enabled
export const BothEnabled = {
  render: (args) => <CategoryRowDemo {...args} category={paymentRemindersCategory} smsEnabled={true} emailEnabled={true} />,
  args: {
    smsPending: false,
    emailPending: false,
    isLast: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Row with both SMS and Email enabled.',
      },
    },
  },
};

// SMS Only
export const SmsOnly = {
  render: (args) => <CategoryRowDemo {...args} category={reservationUpdatesCategory} smsEnabled={true} emailEnabled={false} />,
  args: {
    smsPending: false,
    emailPending: false,
    isLast: false,
  },
};

// Email Only
export const EmailOnly = {
  render: (args) => <CategoryRowDemo {...args} category={promotionalCategory} smsEnabled={false} emailEnabled={true} />,
  args: {
    smsPending: false,
    emailPending: false,
    isLast: false,
  },
};

// Pending State
export const PendingState = {
  args: {
    category: messageForwardingCategory,
    smsEnabled: true,
    emailEnabled: false,
    smsPending: true,
    emailPending: false,
    isLast: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'SMS toggle in pending state (disabled during API call).',
      },
    },
  },
};

// Last Row (No Border)
export const LastRow = {
  render: (args) => <CategoryRowDemo {...args} category={promotionalCategory} isLast={true} />,
  args: {
    smsEnabled: false,
    emailEnabled: true,
    smsPending: false,
    emailPending: false,
    isLast: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Last row in the list (no bottom border).',
      },
    },
  },
};

// Multiple Rows
const MultipleRowsWrapper = () => {
  const categories = [
    messageForwardingCategory,
    paymentRemindersCategory,
    reservationUpdatesCategory,
    promotionalCategory,
  ];

  const [preferences, setPreferences] = useState({
    message_forwarding: { sms: true, email: true },
    payment_reminders: { sms: true, email: false },
    reservation_updates: { sms: false, email: true },
    promotional: { sms: false, email: false },
  });

  const handleToggle = (categoryId, type) => (checked) => {
    setPreferences((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [type]: checked,
      },
    }));
  };

  return (
    <>
      {categories.map((category, index) => (
        <NotificationCategoryRow
          key={category.id}
          category={category}
          smsEnabled={preferences[category.id].sms}
          emailEnabled={preferences[category.id].email}
          onToggleSms={handleToggle(category.id, 'sms')}
          onToggleEmail={handleToggle(category.id, 'email')}
          isLast={index === categories.length - 1}
        />
      ))}
    </>
  );
};

export const MultipleRows = {
  render: () => <MultipleRowsWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Multiple category rows as they would appear in the settings form.',
      },
    },
  },
};

// Full Settings Panel
const FullSettingsPanelWrapper = () => {
  const categories = [
    { id: 'message_forwarding', label: 'Message Forwarding', description: 'Receive forwarded messages via your preferred channel' },
    { id: 'payment_reminders', label: 'Payment Reminders', description: 'Billing and payment notifications' },
    { id: 'promotional', label: 'Promotional', description: 'Marketing and promotional content' },
    { id: 'reservation_updates', label: 'Reservation Updates', description: 'Changes to your bookings' },
    { id: 'lease_requests', label: 'Lease Requests', description: 'Lease-related inquiries' },
    { id: 'checkin_checkout', label: 'Check-in/Check-out', description: 'Guest arrival and departure alerts' },
  ];

  const [preferences, setPreferences] = useState(
    categories.reduce((acc, cat) => ({
      ...acc,
      [cat.id]: { sms: false, email: true },
    }), {})
  );

  const handleToggle = (categoryId, type) => (checked) => {
    setPreferences((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [type]: checked,
      },
    }));
  };

  const smsCount = Object.values(preferences).filter((p) => p.sms).length;
  const emailCount = Object.values(preferences).filter((p) => p.email).length;

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '16px' }}>
        Notification Preferences
      </h3>

      {categories.map((category, index) => (
        <NotificationCategoryRow
          key={category.id}
          category={category}
          smsEnabled={preferences[category.id].sms}
          emailEnabled={preferences[category.id].email}
          onToggleSms={handleToggle(category.id, 'sms')}
          onToggleEmail={handleToggle(category.id, 'email')}
          isLast={index === categories.length - 1}
        />
      ))}

      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#6b7280',
      }}>
        Summary: {smsCount} SMS enabled, {emailCount} Email enabled
      </div>
    </div>
  );
};

export const FullSettingsPanel = {
  render: () => <FullSettingsPanelWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Full notification settings panel with multiple categories.',
      },
    },
  },
};
