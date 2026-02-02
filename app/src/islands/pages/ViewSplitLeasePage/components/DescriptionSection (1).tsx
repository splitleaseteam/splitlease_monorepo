/**
 * DescriptionSection Component
 *
 * Displays property description with expand/collapse functionality.
 * Truncates long descriptions and shows "Read more" button.
 *
 * @component
 * @architecture Presentational Component
 * @performance Memoized
 * @security Sanitizes HTML content
 */

import { memo, useMemo } from 'react';
import styles from './DescriptionSection.module.css';

<<<<<<<< HEAD:app/src/islands/pages/ViewSplitLeasePage/components/DescriptionSection (1).tsx
========
// ============================================================================
// TYPES
// ============================================================================

>>>>>>>> dde4e4b5b96fd0926091ebe5f9e47e060b986cb9:app/src/islands/pages/ViewSplitLeasePage/components/DescriptionSection.tsx
interface DescriptionSectionProps {
    description: string;
    isExpanded: boolean;
    onToggle: () => void;
}

const DescriptionSection = memo(function DescriptionSection({
    description,
    isExpanded,
    onToggle
}: DescriptionSectionProps) {

    const CHARACTER_LIMIT = 300;

    // Sanitize and format description
    const formattedDescription = useMemo(() => {
        if (!description) return '';

        // Basic HTML sanitization (remove script tags, etc.)
        const sanitized = description
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

        return sanitized;
    }, [description]);

    const shouldTruncate = formattedDescription.length > CHARACTER_LIMIT;
    const displayText = isExpanded || !shouldTruncate
        ? formattedDescription
        : formattedDescription.substring(0, CHARACTER_LIMIT) + '...';

    if (!formattedDescription) {
        return null;
    }

    return (
        <section className={styles.descriptionContainer}>
            <h2 className={styles.sectionTitle}>About this space</h2>

            <div
                className={styles.descriptionText}
                dangerouslySetInnerHTML={{ __html: displayText }}
            />

            {shouldTruncate && (
                <button
                    onClick={onToggle}
                    className={styles.toggleButton}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Show less' : 'Show more'}
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
                            Show more
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </>
                    )}
                </button>
            )}
        </section>
    );
});

DescriptionSection.displayName = 'DescriptionSection';

export { DescriptionSection };
