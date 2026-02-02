/**
 * HostInfoCard Component
 *
 * Displays host profile information and contact button.
 * Contact button is auth-gated - requires login before opening modal.
 *
 * @component
 * @architecture Presentational Component
 * @performance Memoized
 * @security Contact action is auth-gated at hook level
 */

import { memo } from 'react';
// @ts-ignore - JS module without type declarations
import { formatHostName } from '../../../../logic/processors/display/formatHostName';
import styles from './HostInfoCard.module.css';

<<<<<<<< HEAD:app/src/islands/pages/ViewSplitLeasePage/components/HostInfoCard (1).tsx
interface Host {
    name?: string;
    'First Name'?: string;
    'Last Name'?: string;
    profilePhotoUrl?: string;
    responseTime?: string;
    rating?: number;
    bio?: string;
}

interface HostInfoCardProps {
    host: Host;
========
// ============================================================================
// TYPES
// ============================================================================

interface HostInfoCardProps {
    host: any;
>>>>>>>> dde4e4b5b96fd0926091ebe5f9e47e060b986cb9:app/src/islands/pages/ViewSplitLeasePage/components/HostInfoCard.tsx
    onContactClick: () => void;
    isAuthenticated: boolean;
}

const HostInfoCard = memo(function HostInfoCard({
    host,
    onContactClick,
    isAuthenticated
}: HostInfoCardProps) {

    if (!host) {
        return null;
    }

    const formattedHostName = formatHostName({ fullName: host.name || 'Host' });

    return (
        <section className={styles.hostInfoContainer}>
            <h2 className={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
                Meet your host
            </h2>

            <div className={styles.hostCard}>
                {/* Host Avatar */}
                <div className={styles.hostAvatarSection}>
                    {host.image ? (
                        <img
                            src={host.image}
                            alt={host.name}
                            className={styles.hostAvatar}
                        />
                    ) : (
                        <div className={styles.hostAvatarPlaceholder}>
                            {(host.name || 'H').charAt(0).toUpperCase()}
                        </div>
                    )}

                    {host.verified && (
                        <div className={styles.verifiedBadge} title="Verified Host">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Host Info */}
                <div className={styles.hostInfo}>
                    <h3 className={styles.hostName}>
                        {formattedHostName}
                        {host.verified && (
                            <span className={styles.verifiedText}>Verified</span>
                        )}
                    </h3>

                    {host.joinedDate && (
                        <div className={styles.hostMeta}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>Joined {new Date(host.joinedDate).getFullYear()}</span>
                        </div>
                    )}

                    {host.responseRate && (
                        <div className={styles.hostStat}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            <span>Response rate: {host.responseRate}%</span>
                        </div>
                    )}

                    {host.responseTime && (
                        <div className={styles.hostStat}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>Response time: {host.responseTime}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bio */}
            {host.bio && (
                <div className={styles.hostBio}>
                    <p>{host.bio}</p>
                </div>
            )}

            {/* Contact Button */}
            <button
                onClick={onContactClick}
                className={styles.contactButton}
                aria-label="Contact host"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Contact Host
            </button>

            {!isAuthenticated && (
                <div className={styles.authNotice}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>You'll need to sign in to message the host</span>
                </div>
            )}

            {/* Host Protection Notice */}
            <div className={styles.protectionNotice}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                </svg>
                <p>
                    <strong>To protect your payment</strong>, never transfer money or communicate
                    outside of the Split Lease platform.
                </p>
            </div>
        </section>
    );
});

HostInfoCard.displayName = 'HostInfoCard';

export { HostInfoCard };
