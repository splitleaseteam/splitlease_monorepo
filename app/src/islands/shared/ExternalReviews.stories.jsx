/**
 * ExternalReviews Component Stories
 *
 * Displays verified reviews from external platforms like Airbnb, VRBO, and Booking.com.
 * Shows platform badges, reviewer info, ratings, and truncated descriptions.
 */

import ExternalReviews from './ExternalReviews';

// Mock data for stories - component fetches from Supabase so we mock that behavior
const mockReviews = {
  airbnb: [
    {
      id: '1',
      platform: 'Airbnb',
      reviewer_name: 'Sarah M.',
      reviewer_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      rating: 5,
      description: 'Amazing stay! The apartment was exactly as described, clean and comfortable. The host was very responsive and helpful with local recommendations.',
      review_date: '2024-01-15',
      original_url: 'https://airbnb.com/reviews/123',
    },
    {
      id: '2',
      platform: 'Airbnb',
      reviewer_name: 'John D.',
      reviewer_photo: null,
      rating: 4,
      description: 'Great location and very comfortable bed. Would definitely stay again.',
      review_date: '2024-02-20',
      original_url: null,
    },
  ],
  vrbo: [
    {
      id: '3',
      platform: 'VRBO',
      reviewer_name: 'Emily R.',
      reviewer_photo: 'https://randomuser.me/api/portraits/women/65.jpg',
      rating: 9,
      description: 'Perfect for our family vacation! Spacious, well-equipped kitchen, and the kids loved the location. This was exactly what we were looking for and exceeded our expectations in every way.',
      review_date: '2024-03-10',
      original_url: 'https://vrbo.com/reviews/456',
    },
  ],
  bookingcom: [
    {
      id: '4',
      platform: 'Booking.com',
      reviewer_name: 'Michael T.',
      reviewer_photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      rating: 8,
      description: 'Clean, central, and affordable. Everything you need for a city break.',
      review_date: '2024-01-28',
      original_url: 'https://booking.com/reviews/789',
    },
  ],
};

export default {
  title: 'Shared/ExternalReviews',
  component: ExternalReviews,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## ExternalReviews Component

Displays reviews imported from external booking platforms (Airbnb, VRBO, Booking.com).

### Features
- Platform badges with distinct colors
- Star rating display
- Reviewer photo or initial fallback
- Truncated description with "View on {platform}" link
- Grouped by platform
- "Show more" for platforms with many reviews

### Usage
\`\`\`jsx
import ExternalReviews from 'islands/shared/ExternalReviews';

<ExternalReviews listingId="listing-123" />
\`\`\`

Note: This component fetches data from Supabase. In Storybook, we show the loading and empty states.
        `,
      },
    },
  },
  argTypes: {
    listingId: {
      control: 'text',
      description: 'ID of the listing to fetch reviews for',
      table: {
        type: { summary: 'string' },
      },
    },
  },
};

// Default - Loading State (since component fetches data)
export const Loading = {
  args: {
    listingId: 'listing-123',
  },
  parameters: {
    docs: {
      description: {
        story: 'The component shows a loading skeleton while fetching reviews from Supabase.',
      },
    },
  },
};

// No Listing ID - Won't fetch
export const NoListingId = {
  args: {
    listingId: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'When no listing ID is provided, the component returns early without fetching.',
      },
    },
  },
};

// Static Mock Display - For visual reference
export const MockDisplay = {
  render: () => {
    // Static rendering to show what the component looks like with data
    const reviews = [...mockReviews.airbnb, ...mockReviews.vrbo, ...mockReviews.bookingcom];

    const groupedReviews = reviews.reduce((acc, review) => {
      if (!acc[review.platform]) acc[review.platform] = [];
      acc[review.platform].push(review);
      return acc;
    }, {});

    const platformColors = {
      'Airbnb': 'bg-red-100 text-red-700',
      'VRBO': 'bg-blue-100 text-blue-700',
      'Booking.com': 'bg-green-100 text-green-700',
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    };

    const renderStars = (rating) => {
      const normalizedRating = rating > 5 ? rating / 2 : rating;
      const stars = Math.round(normalizedRating);
      return (
        <div style={{ display: 'flex', gap: '2px' }}>
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              style={{ width: '16px', height: '16px', color: i < stars ? '#facc15' : '#d1d5db' }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      );
    };

    return (
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px', maxWidth: '500px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
          External Reviews ({reviews.length})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(groupedReviews).map(([platform, platformReviews]) => (
            <div key={platform} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  borderRadius: '4px',
                  backgroundColor: platform === 'Airbnb' ? '#fee2e2' : platform === 'VRBO' ? '#dbeafe' : '#dcfce7',
                  color: platform === 'Airbnb' ? '#b91c1c' : platform === 'VRBO' ? '#1d4ed8' : '#15803d'
                }}>
                  {platform}
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {platformReviews.length} {platformReviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              {platformReviews.map((review) => (
                <div key={review.id} style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    {review.reviewer_photo ? (
                      <img
                        src={review.reviewer_photo}
                        alt={review.reviewer_name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#4b5563',
                        fontWeight: '500'
                      }}>
                        {review.reviewer_name.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>
                          {review.reviewer_name}
                        </p>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {formatDate(review.review_date)}
                        </span>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', margin: 0 }}>
                    {review.description.length > 200 ? review.description.slice(0, 200) + '...' : review.description}
                  </p>
                  {review.original_url && (
                    <a
                      href={review.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#7c3aed',
                        textDecoration: 'none'
                      }}
                    >
                      View on {platform}
                      <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Static mock display showing what the component looks like with review data from multiple platforms.',
      },
    },
  },
};
