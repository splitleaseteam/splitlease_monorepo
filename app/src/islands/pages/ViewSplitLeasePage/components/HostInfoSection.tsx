/**
 * HostInfoSection Component
 *
 * Renders the host profile card with message and profile buttons.
 *
 * @component
 * @architecture Presentational Component - receives all data via props
 */

import { COLORS } from '../../../../lib/constants.js';

interface HostInfoSectionProps {
  listing: any;
  isMobile: boolean;
  onContactHost: () => void;
}

export function HostInfoSection({
  listing,
  isMobile,
  onContactHost,
}: HostInfoSectionProps) {
  if (!listing.host) return null;

  return (
    <section style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
      <h2 style={{
        fontSize: isMobile ? '1rem' : '1.125rem',
        fontWeight: '600',
        marginBottom: isMobile ? '0.5rem' : '0.75rem',
        color: COLORS.TEXT_DARK
      }}>
        Meet Your Host
      </h2>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: isMobile ? '0.75rem' : '1rem',
        background: COLORS.BG_LIGHT,
        borderRadius: isMobile ? '8px' : '10px'
      }}>
        {listing.host.profile_photo_url && (
          <img
            src={listing.host.profile_photo_url}
            alt={listing.host.first_name}
            style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isMobile ? '0.875rem' : '0.9375rem', fontWeight: '600', marginBottom: '0.125rem' }}>
            {listing.host.first_name} {listing.host.last_name?.charAt(0)}.
          </div>
          <div style={{ color: COLORS.TEXT_LIGHT, fontSize: isMobile ? '0.75rem' : '0.8125rem' }}>Host</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onContactHost}
            style={{
              padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 1rem',
              background: COLORS.PRIMARY,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '0.8125rem' : '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: '0 2px 6px rgba(49, 19, 93, 0.2)'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement;
              target.style.background = COLORS.PRIMARY_HOVER;
              target.style.transform = 'translateY(-1px)';
              target.style.boxShadow = '0 3px 8px rgba(49, 19, 93, 0.25)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLElement;
              target.style.background = COLORS.PRIMARY;
              target.style.transform = '';
              target.style.boxShadow = '0 2px 6px rgba(49, 19, 93, 0.2)';
            }}
          >
            <svg
              width={isMobile ? '14' : '16'}
              height={isMobile ? '14' : '16'}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Message</span>
          </button>
          {listing.host?.userId && (
            <button
              onClick={() => window.location.href = `/account-profile/${listing.host.userId}`}
              style={{
                padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 1rem',
                background: 'transparent',
                color: COLORS.PRIMARY,
                border: `1.5px solid ${COLORS.PRIMARY}`,
                borderRadius: '6px',
                fontSize: isMobile ? '0.8125rem' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.PRIMARY;
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = COLORS.PRIMARY;
                e.currentTarget.style.transform = '';
              }}
            >
              <svg
                width={isMobile ? '14' : '16'}
                height={isMobile ? '14' : '16'}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profile</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
