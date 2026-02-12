/**
 * BookingWidget Component
 *
 * Displays schedule selector, move-in date picker, reservation span selector,
 * and pricing breakdown. Validates booking and enables "Create Proposal" button.
 * Shows existing proposal state if user has already created one for this listing.
 *
 * @component
 * @architecture Presentational Component (receives all data via props)
 * @performance Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import ListingScheduleSelector from '../../../shared/ListingScheduleSelector';
import styles from './BookingWidget.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface Day {
    dayOfWeek: number;
    isSelected: boolean;
}

interface BookingWidgetProps {
    listing: any;
    selectedDays: Day[];
    moveInDate: string;
    reservationSpan: number;
    priceBreakdown: any;
    minMoveInDate: string;
    validationErrors: any;
    isValid: boolean;
    formattedPrice: string;
    formattedStartingPrice: string;
    existingProposal: any;
    onScheduleChange: (days: Day[]) => void;
    onMoveInDateChange: (date: string) => void;
    onReservationSpanChange: (weeks: number) => void;
    onSubmit: () => void;
}

const BookingWidget = memo(function BookingWidget({
    listing,
    selectedDays,
    moveInDate,
    reservationSpan,
    priceBreakdown,
    minMoveInDate,
    validationErrors,
    isValid,
    formattedPrice,
    formattedStartingPrice,
    existingProposal,
    onScheduleChange,
    onMoveInDateChange,
    onReservationSpanChange,
    onSubmit
}: BookingWidgetProps) {


    // Reservation span options
    const reservationSpanOptions = [
        { value: 13, label: '13 weeks (3 months)' },
        { value: 20, label: '20 weeks (5 months)' },
        { value: 26, label: '26 weeks (6 months)' },
        { value: 52, label: '52 weeks (1 year)' }
    ];

    // If user already has a proposal for this listing, show view proposal state
    if (existingProposal) {
        return (
            <div className={styles.bookingWidgetContainer}>
                <div className={styles.bookingWidgetInner}>

                    <div className={styles.proposalExistsHeader}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>Proposal Sent</span>
                    </div>

                    <p className={styles.proposalExistsMessage}>
                        You've already sent a proposal for this listing. Check your proposals page for updates.
                    </p>

                    <a
                        href={`/guest-proposals?proposal=${existingProposal.id}`}
                        className={styles.viewProposalButton}
                    >
                        View Proposal
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.bookingWidgetContainer}>
            <div className={styles.bookingWidgetInner}>

                {/* Pricing Header */}
                <div className={styles.pricingHeader}>
                    {priceBreakdown && selectedDays.length > 0 ? (
                        <>
                            <span className={styles.priceAmount}>{formattedPrice}</span>
                            <span className={styles.priceLabel}>/ night</span>
                        </>
                    ) : (
                        <>
                            <span className={styles.priceAmount}>{formattedStartingPrice}</span>
                            <span className={styles.priceLabelDim}>starting price</span>
                        </>
                    )}
                </div>

                {priceBreakdown && selectedDays.length > 0 && (
                    <div className={styles.priceSubtext}>
                        Based on {selectedDays.length} night{selectedDays.length !== 1 ? 's' : ''} per week
                    </div>
                )}

                <div className={styles.dividerLine}></div>

                {/* Schedule Selector */}
                <div className={styles.scheduleSelectorSection}>
                    <label className={styles.sectionLabel}>
                        Select Your Weekly Schedule
                    </label>
                    <div className={styles.scheduleSelectorWrapper}>
                        <ListingScheduleSelector
                            listing={listing}
                            selectedDayObjects={selectedDays}
                            onSelectionChange={onScheduleChange}
                        />
                    </div>
                    {validationErrors.hasErrors && (
                        <div className={styles.validationErrors}>
                            {validationErrors.errors.map((error, idx) => (
                                <div key={idx} className={styles.errorMessage}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {error}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Move-In Date */}
                <div className={styles.inputSection}>
                    <label className={styles.sectionLabel} htmlFor="move-in-date">
                        Move-In Date
                    </label>
                    <input
                        id="move-in-date"
                        type="date"
                        value={moveInDate || ''}
                        min={minMoveInDate}
                        onChange={(e) => onMoveInDateChange(e.target.value)}
                        className={styles.dateInput}
                        required
                        aria-required="true"
                        aria-describedby="move-in-help"
                    />
                    <div id="move-in-help" className={styles.inputHelp}>
                        Minimum 2 weeks from today
                    </div>
                </div>

                {/* Reservation Span */}
                <div className={styles.inputSection}>
                    <label className={styles.sectionLabel} htmlFor="reservation-span">
                        Reservation Length
                    </label>
                    <select
                        id="reservation-span"
                        value={reservationSpan}
                        onChange={(e) => onReservationSpanChange(parseInt(e.target.value))}
                        className={styles.selectInput}
                        aria-describedby="reservation-span-help"
                    >
                        {reservationSpanOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div id="reservation-span-help" className={styles.inputHelp}>
                        How long you plan to stay
                    </div>
                </div>

                {/* Schedule Pattern Info */}
                {listing.weeks_offered_schedule_text && listing.weeks_offered_schedule_text !== 'Every week' && (
                    <div className={styles.schedulePatternBanner}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        </svg>
                        <span className={styles.schedulePatternText}>
                            Pattern: {listing.weeks_offered_schedule_text}
                        </span>
                    </div>
                )}

                <div className={styles.dividerLine}></div>

                {/* Price Breakdown */}
                {priceBreakdown && selectedDays.length > 0 ? (
                    <div className={styles.priceBreakdownSection}>
                        <div className={styles.breakdownHeader}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            <span>Price Breakdown</span>
                        </div>
                        <div className={styles.breakdownRow}>
                            <span className={styles.breakdownLabel}>Per Night</span>
                            <span className={styles.breakdownValue}>${priceBreakdown.pricePerNight.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                            <span className={styles.breakdownLabel}>4-Week Total</span>
                            <span className={styles.breakdownValue}>${priceBreakdown.pricePerFourWeeks.toFixed(2)}</span>
                        </div>
                        <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}>
                            <span className={styles.breakdownLabel}>Est. Booking Total</span>
                            <span className={styles.breakdownValue}>${priceBreakdown.totalPrice.toFixed(2)}</span>
                        </div>
                        <div className={styles.breakdownNote}>
                            For {reservationSpan} weeks
                        </div>
                    </div>
                ) : (
                    <div className={styles.priceBreakdownPlaceholder}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <p>Select your schedule to see pricing</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={onSubmit}
                    disabled={!isValid}
                    className={styles.submitButton}
                    aria-label="Create Proposal"
                    aria-disabled={!isValid}
                >
                    {!isValid && selectedDays.length === 0 ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            Select schedule to continue
                        </>
                    ) : !isValid ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            Complete all fields
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            Create Proposal
                        </>
                    )}
                </button>

                {!isValid && moveInDate && selectedDays.length > 0 && (
                    <div className={styles.submitHelp}>
                        Please fix validation errors above
                    </div>
                )}
            </div>
        </div>
    );
});

BookingWidget.displayName = 'BookingWidget';

export { BookingWidget };
