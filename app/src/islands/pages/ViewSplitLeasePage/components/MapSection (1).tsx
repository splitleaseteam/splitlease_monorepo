/**
 * MapSection Component
 *
 * Lazy-loaded Google Map with neighborhood information.
 * Uses Intersection Observer to load map only when scrolled into view.
 * Auto-zooms to listing marker on initial load.
 *
 * @component
 * @architecture Presentational Component
 * @performance Lazy-loaded via Intersection Observer
 */

import { memo, useEffect, useRef } from 'react';
import GoogleMap from '../../../shared/GoogleMap.jsx';
import styles from './MapSection.module.css';

<<<<<<<< HEAD:app/src/islands/pages/ViewSplitLeasePage/components/MapSection (1).tsx
========
// ============================================================================
// TYPES
// ============================================================================

>>>>>>>> dde4e4b5b96fd0926091ebe5f9e47e060b986cb9:app/src/islands/pages/ViewSplitLeasePage/components/MapSection.tsx
interface Coordinates {
    lat: number;
    lng: number;
}

interface MapSectionProps {
    coordinates: Coordinates;
    listingName: string;
    neighborhood: string;
    shouldLoad: boolean;
    onLoadMap: () => void;
    mapRef: React.RefObject<any>;
}

const MapSection = memo(function MapSection({
    coordinates,
    listingName,
    neighborhood,
    shouldLoad,
    onLoadMap,
    mapRef
}: MapSectionProps) {

    const containerRef = useRef(null);
    const hasAutoZoomedRef = useRef(false);

    // Set up Intersection Observer for lazy loading
    useEffect(() => {
        if (!containerRef.current || shouldLoad) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        onLoadMap();
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '200px',
                threshold: 0
            }
        );

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [shouldLoad, onLoadMap]);

    // Auto-zoom on initial map load
    useEffect(() => {
        if (shouldLoad && mapRef.current && coordinates && !hasAutoZoomedRef.current) {
            // Wait for map to fully initialize
            setTimeout(() => {
                if (mapRef.current && mapRef.current.zoomToListing) {
                    mapRef.current.zoomToListing(listingName);
                    hasAutoZoomedRef.current = true;
                }
            }, 500);
        }
    }, [shouldLoad, coordinates, listingName, mapRef]);

    if (!coordinates || !coordinates.lat || !coordinates.lng) {
        return null;
    }

    return (
        <section className={styles.mapContainer} ref={containerRef}>
            <h2 className={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
                Where you'll be
            </h2>

            {neighborhood && (
                <p className={styles.neighborhoodInfo}>
                    <strong>{neighborhood}</strong>
                </p>
            )}

            <div className={styles.mapWrapper}>
                {shouldLoad ? (
                    // @ts-ignore - GoogleMap is a .jsx component without type definitions
                    <GoogleMap
                        ref={mapRef}
                        listings={[{
                            id: listingName,
                            title: listingName,
                            coordinates: coordinates
                        }]}
                        filteredListings={[]}
                        selectedListing={null}
                        selectedBorough={null}
                        onMarkerClick={() => { }}
                        simpleMode={true}
                        initialZoom={17}
                    />
                ) : (
                    <div className={styles.mapPlaceholder}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <p>Scroll to load map</p>
                    </div>
                )}
            </div>

            <div className={styles.mapDisclaimer}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Exact location provided after booking confirmation</span>
            </div>
        </section>
    );
});

MapSection.displayName = 'MapSection';

export { MapSection };
