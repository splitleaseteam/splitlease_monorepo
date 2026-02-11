const WEEKLY_PATTERNS = [
    { value: '', label: 'Select a Weekly Pattern' },
    { value: '1', label: '1 week on, 1 week off' },
    { value: '2', label: '2 weeks on, 2 weeks off' },
    { value: '3', label: '1 week on, 3 weeks off' },
    { value: 'custom', label: 'Custom pattern' },
];

export default function WeeklyPricingForm({
    weeksOffered,
    setWeeksOffered,
    weeklyRate,
    setWeeklyRate,
    isOwner,
    infoRefs,
    onInfoClick,
}) {
    return (
        <div className="pricing-edit-weekly">
            <div className="pricing-edit-field">
                <label>Weeks Offered*</label>
                <select
                    value={weeksOffered}
                    onChange={(e) => setWeeksOffered(e.target.value)}
                    disabled={!isOwner}
                >
                    {WEEKLY_PATTERNS.map((pattern) => (
                        <option key={pattern.value} value={pattern.value}>
                            {pattern.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="pricing-edit-field">
                <label>
                    Weekly Pricing*
                    <button
                        type="button"
                        ref={infoRefs.weeklyPricing}
                        className="pricing-edit-field__help"
                        onClick={onInfoClick('weeklyPricing')}
                        aria-label="Learn more about weekly pricing"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </button>
                </label>
                <input
                    type="number"
                    value={weeklyRate}
                    onChange={(e) => setWeeklyRate(Number(e.target.value))}
                    placeholder="Define Weekly Rent"
                    disabled={!isOwner}
                />
            </div>
        </div>
    );
}
