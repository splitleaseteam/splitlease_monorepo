/**
 * AmenitiesGrid Component
 *
 * Displays listing amenities and safety features in a grid layout.
 * Groups amenities by category and shows icons where available.
 *
 * @component
 * @architecture Presentational Component
 * @performance Memoized
 */

import { memo } from 'react';
import styles from './AmenitiesGrid.module.css';

<<<<<<<< HEAD:app/src/islands/pages/ViewSplitLeasePage/components/AmenitiesGrid (1).tsx
========
// ============================================================================
// TYPES
// ============================================================================

>>>>>>>> dde4e4b5b96fd0926091ebe5f9e47e060b986cb9:app/src/islands/pages/ViewSplitLeasePage/components/AmenitiesGrid.tsx
interface Amenity {
    name: string;
    icon?: string;
}

interface AmenitiesGridProps {
<<<<<<<< HEAD:app/src/islands/pages/ViewSplitLeasePage/components/AmenitiesGrid (1).tsx
    amenities?: Amenity[];
    safetyFeatures?: Amenity[];
    isExpanded?: boolean;
========
    amenities: Amenity[];
    safetyFeatures: Amenity[];
    isExpanded: boolean;
>>>>>>>> dde4e4b5b96fd0926091ebe5f9e47e060b986cb9:app/src/islands/pages/ViewSplitLeasePage/components/AmenitiesGrid.tsx
    onToggle: () => void;
}

const AmenitiesGrid = memo(function AmenitiesGrid({
    amenities = [],
    safetyFeatures = [],
    isExpanded = false,
    onToggle
}: AmenitiesGridProps) {

    const INITIAL_DISPLAY_COUNT = 6;

    const hasAmenities = amenities.length > 0;
    const hasSafetyFeatures = safetyFeatures.length > 0;

    if (!hasAmenities && !hasSafetyFeatures) {
        return null;
    }

    const displayedAmenities = isExpanded
        ? amenities
        : amenities.slice(0, INITIAL_DISPLAY_COUNT);

    const shouldShowToggle = amenities.length > INITIAL_DISPLAY_COUNT;

    return (
        <section className={styles.amenitiesContainer}>
            {/* Amenities */}
            {hasAmenities && (
                <div className={styles.amenitiesSection}>
                    <h2 className={styles.sectionTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Amenities
                    </h2>

                    <div className={styles.amenitiesGrid}>
                        {displayedAmenities.map((amenity, index) => (
                            <div key={index} className={styles.amenityItem}>
                                {amenity.icon ? (
                                    <span className={styles.amenityIcon} dangerouslySetInnerHTML={{ __html: amenity.icon }} />
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                                <span className={styles.amenityName}>{amenity.name}</span>
                            </div>
                        ))}
                    </div>

                    {shouldShowToggle && (
                        <button
                            onClick={onToggle}
                            className={styles.toggleButton}
                            aria-expanded={isExpanded}
                        >
                            {isExpanded ? (
                                <>
                                    Show less
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="18 15 12 9 6 15" />
                                    </svg>
                                </>
                            ) : (
                                <>
                                    Show all {amenities.length} amenities
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Safety Features */}
            {hasSafetyFeatures && (
                <div className={styles.safetySection}>
                    <h2 className={styles.sectionTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Safety Features
                    </h2>

                    <div className={styles.safetyGrid}>
                        {safetyFeatures.map((feature, index) => (
                            <div key={index} className={styles.safetyItem}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                <span className={styles.safetyName}>{feature.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
});

AmenitiesGrid.displayName = 'AmenitiesGrid';

export { AmenitiesGrid };
