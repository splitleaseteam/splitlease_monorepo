import HostScheduleSelector from '../../../../shared/HostScheduleSelector/HostScheduleSelector.jsx';

export default function NightlyPricingForm({
    selectedNights,
    onNightSelectionChange,
    onSelectAllNights,
    minNights,
    setMinNights,
    maxNights,
    setMaxNights,
    nightlyPricing,
    setNightlyPricing,
    calculateNightlyRate,
    formatCurrency,
    isOwner,
    infoRefs,
    onInfoClick,
}) {
    return (
        <div className="pricing-edit-nightly">
            {/* Schedule Selector */}
            <div className="pricing-edit-schedule">
                <div className="pricing-edit-schedule__header">
                    <label>Select Available Nights</label>
                    <button
                        type="button"
                        className="pricing-edit-schedule__select-all"
                        onClick={onSelectAllNights}
                        disabled={!isOwner}
                    >
                        Select All Nights
                    </button>
                </div>
                <HostScheduleSelector
                    selectedNights={selectedNights}
                    onSelectionChange={onNightSelectionChange}
                    isClickable={isOwner}
                    mode="normal"
                />
                <div className="pricing-edit-schedule__legend">
                    <div className="pricing-edit-schedule__legend-item">
                        <span className="pricing-edit-schedule__legend-dot pricing-edit-schedule__legend-dot--selected" />
                        <span>{selectedNights.length} Nights Available</span>
                    </div>
                    <div className="pricing-edit-schedule__legend-item">
                        <span className="pricing-edit-schedule__legend-dot pricing-edit-schedule__legend-dot--unselected" />
                        <span>
                            {7 - selectedNights.length} Nights Not Available
                        </span>
                    </div>
                </div>
            </div>

            {/* Min/Max nights */}
            <div className="pricing-edit-nights-range">
                <label>
                    Ideal # of Nights Per Week
                    <button
                        type="button"
                        ref={infoRefs.nightsPerWeek}
                        className="pricing-edit-field__help"
                        onClick={onInfoClick('nightsPerWeek')}
                        aria-label="Learn more about nights per week"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </button>
                </label>
                <div className="pricing-edit-nights-range__inputs">
                    <input
                        type="number"
                        value={minNights}
                        onChange={(e) => setMinNights(Number(e.target.value))}
                        min={2}
                        max={6}
                        disabled={!isOwner}
                    />
                    <span>to</span>
                    <input
                        type="number"
                        value={maxNights}
                        onChange={(e) => setMaxNights(Number(e.target.value))}
                        min={minNights}
                        max={7}
                        disabled={!isOwner}
                    />
                </div>
            </div>

            {/* Compensation Calculator */}
            <div className="pricing-edit-compensation">
                <h3>Weekly Compensation Rates</h3>
                <div className="pricing-edit-compensation__grid">
                    {[2, 3, 4, 5].map((nights) => {
                        if (selectedNights.length < nights) return null;
                        return (
                            <div key={nights} className="pricing-edit-compensation__item">
                                <label>
                                    Your Compensation / Week @ {nights} nights / week occupancy
                                    <button
                                        type="button"
                                        ref={infoRefs.weeklyComp?.[nights]}
                                        className="pricing-edit-field__help"
                                        onClick={onInfoClick(`weeklyComp${nights}`)}
                                        aria-label={`Learn more about ${nights}-night pricing`}
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
                                    value={nightlyPricing[nights]}
                                    onChange={(e) =>
                                        setNightlyPricing((prev) => ({
                                            ...prev,
                                            [nights]: Number(e.target.value),
                                        }))
                                    }
                                    placeholder={`$${nights * 100} (weekly)`}
                                    disabled={!isOwner}
                                />
                                <span className="pricing-edit-compensation__rate">
                                    {formatCurrency(calculateNightlyRate(nightlyPricing[nights], nights))}
                                    /night
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
