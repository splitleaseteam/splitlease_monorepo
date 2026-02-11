export default function MonthlyPricingForm({
    monthlyRate,
    setMonthlyRate,
    monthlyAgreement,
    setMonthlyAgreement,
    isOwner,
    infoRefs,
    onInfoClick,
}) {
    return (
        <div className="pricing-edit-monthly">
            <div className="pricing-edit-field">
                <label>
                    Monthly Host Compensation*
                    <button
                        type="button"
                        ref={infoRefs.monthlyComp}
                        className="pricing-edit-field__help"
                        onClick={onInfoClick('monthlyComp')}
                        aria-label="Learn more about monthly compensation"
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
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(Number(e.target.value))}
                    placeholder="Define Monthly Rent"
                    min={1000}
                    max={10000}
                    disabled={!isOwner}
                />
                <span className="pricing-edit-field__hint">
                    Please set an amount between $1,000 and $10,000 for your listing
                </span>
            </div>

            {/* Agreement Section */}
            <div className="pricing-edit-agreement">
                <div className="pricing-edit-agreement__info">
                    <p>
                        Our Split Lease &apos;Monthly&apos; model helps guests meet rent obligations through a subsidy.
                        For financial stability, we may need to sublease unused nights. If this isn&apos;t ideal,
                        our other models might be more fitting for you, as they don&apos;t require this provision.
                    </p>
                    <button
                        type="button"
                        ref={infoRefs.monthlyAgreement}
                        className="pricing-edit-agreement__help"
                        onClick={onInfoClick('monthlyAgreement')}
                        aria-label="Learn more about monthly model agreement"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Learn more
                    </button>
                </div>
                <div className="pricing-edit-agreement__checkbox">
                    <label>
                        <input
                            type="checkbox"
                            checked={monthlyAgreement === 'agree'}
                            onChange={(e) => setMonthlyAgreement(e.target.checked ? 'agree' : '')}
                            disabled={!isOwner}
                        />
                        <span>I understand and agree to the above provision</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
