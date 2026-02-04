/**
 * ProfileCard Component Stories
 *
 * Reusable card wrapper with consistent styling for profile content sections.
 * Supports optional header actions and subtitles.
 */
import ProfileCard from './ProfileCard';

export default {
  title: 'AccountProfile/ProfileCard',
  component: ProfileCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## ProfileCard Component

A consistent card wrapper used throughout the Account Profile page.
Provides standardized styling with optional header actions.

### Usage

\`\`\`jsx
import ProfileCard from './ProfileCard';

<ProfileCard
  id="about-section"
  title="About Me"
  subtitle="Tell others about yourself"
  headerAction={<Button variant="ghost">Edit</Button>}
>
  <p>Profile content goes here...</p>
</ProfileCard>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'HTML id attribute for the card (used for scroll anchoring)',
    },
    title: {
      control: 'text',
      description: 'Card header title',
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle below the title',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    headerAction: {
      description: 'Optional action element in the header (e.g., Edit button)',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    children: {
      description: 'Card content',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '600px', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

// Default card
export const Default = {
  args: {
    title: 'Profile Section',
    children: (
      <div style={{ padding: '16px 0' }}>
        <p style={{ color: '#374151' }}>
          This is the card content. It can contain any React nodes.
        </p>
      </div>
    ),
  },
};

// With subtitle
export const WithSubtitle = {
  args: {
    title: 'About Me',
    subtitle: 'Share a bit about yourself with other members',
    children: (
      <div style={{ padding: '16px 0' }}>
        <p style={{ color: '#374151' }}>
          Hi, I'm a software developer looking for a flexible living arrangement in NYC.
          I work remotely and travel frequently.
        </p>
      </div>
    ),
  },
};

// With header action
export const WithHeaderAction = {
  args: {
    title: 'Personal Information',
    headerAction: (
      <button
        style={{
          padding: '6px 12px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#6D31C2',
        }}
      >
        Edit
      </button>
    ),
    children: (
      <div style={{ padding: '16px 0' }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Full Name</label>
            <p style={{ margin: 0, color: '#374151' }}>John Smith</p>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Email</label>
            <p style={{ margin: 0, color: '#374151' }}>john@example.com</p>
          </div>
        </div>
      </div>
    ),
  },
};

// With ID for scroll anchoring
export const WithScrollAnchor = {
  args: {
    id: 'requirements-section',
    title: 'My Requirements',
    subtitle: "What you're looking for in a rental",
    children: (
      <div style={{ padding: '16px 0' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Private room', 'Pet friendly', 'Laundry', 'Near subway'].map((tag) => (
            <span
              key={tag}
              style={{
                padding: '4px 12px',
                background: '#f3f4f6',
                borderRadius: '16px',
                fontSize: '14px',
                color: '#374151',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Card with ID attribute for URL hash navigation (e.g., /profile#requirements-section).',
      },
    },
  },
};

// Multiple cards stacked
export const StackedCards = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <ProfileCard title="Basic Information" subtitle="Your account details">
        <div style={{ padding: '16px 0' }}>
          <p style={{ color: '#374151' }}>Name, email, phone number...</p>
        </div>
      </ProfileCard>

      <ProfileCard
        title="Schedule Preferences"
        headerAction={
          <button style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
            Edit
          </button>
        }
      >
        <div style={{ padding: '16px 0' }}>
          <p style={{ color: '#374151' }}>Weekdays only, flexible check-in...</p>
        </div>
      </ProfileCard>

      <ProfileCard title="Verification Status">
        <div style={{ padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#22C55E' }}>✓</span>
            <span style={{ color: '#374151' }}>Email verified</span>
          </div>
        </div>
      </ProfileCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple ProfileCards stacked as they appear on the profile page.',
      },
    },
  },
};

// With complex content
export const ComplexContent = {
  args: {
    title: 'My Listings',
    subtitle: 'Properties you have listed on Split Lease',
    headerAction: (
      <button
        style={{
          padding: '6px 12px',
          background: '#6D31C2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Add New
      </button>
    ),
    children: (
      <div style={{ padding: '16px 0' }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          {[
            { name: 'Cozy Studio in Brooklyn', status: 'Active', price: '$150/night' },
            { name: 'Sunny 1BR in Manhattan', status: 'Paused', price: '$200/night' },
          ].map((listing, i) => (
            <div
              key={i}
              style={{
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: '#374151' }}>{listing.name}</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>{listing.price}</p>
              </div>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: listing.status === 'Active' ? '#dcfce7' : '#f3f4f6',
                  color: listing.status === 'Active' ? '#16a34a' : '#6b7280',
                }}
              >
                {listing.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
};
