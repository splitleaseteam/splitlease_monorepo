import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, TrendingDown } from 'lucide-react';
import { calculateFeeBreakdown, formatCurrency } from '../../logic/calculators/feeCalculations';
import FeeExplainer from './FeeExplainer';
import './FeePriceDisplay.css';

export default function FeePriceDisplay({ basePrice, transactionType = 'date_change' }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showExplainer, setShowExplainer] = useState(false);

    const breakdown = calculateFeeBreakdown(basePrice, transactionType);

    if (!breakdown) return null;

    return (
        <div className="fee-price-display">
            <div className="fee-price-title">
                <span>Price Summary</span>
                <Info
                    size={16}
                    className="info-icon"
                    onClick={() => setShowExplainer(true)}
                />
            </div>

            <div className="price-row">
                <span>Base Rate</span>
                <span>{formatCurrency(breakdown.basePrice)}</span>
            </div>

            <div className="price-row">
                <span>Platform & Service Fee</span>
                <span>{formatCurrency(breakdown.totalFee)}</span>
            </div>

            <button
                className="fee-breakdown-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                View Breakdown
            </button>

            {isExpanded && (
                <div className="expanded-breakdown">
                    <div className="breakdown-item">
                        <span>Platform Fee ({breakdown.effectiveRate}%)</span>
                        <span>{formatCurrency(breakdown.platformFee)}</span>
                    </div>
                    <div className="breakdown-item">
                        <span>Landlord Share</span>
                        <span>{formatCurrency(breakdown.landlordShare)}</span>
                    </div>
                    <div className="breakdown-item breakdown-total">
                        <span><strong>Total Fee Paid by You</strong></span>
                        <span><strong>{formatCurrency(breakdown.totalFee)}</strong></span>
                    </div>
                    <button
                        className="why-link"
                        onClick={() => setShowExplainer(true)}
                    >
                        What does this cover?
                    </button>
                </div>
            )}

            <div className="price-row price-row-total">
                <span>Total Price</span>
                <span>{formatCurrency(breakdown.totalPrice)}</span>
            </div>

            {breakdown.savingsVsTraditional > 0 && (
                <div className="price-row price-row-savings">
                    <div className="savings-content">
                        <TrendingDown size={16} />
                        <span>You&apos;re saving {formatCurrency(breakdown.savingsVsTraditional)} vs. competitors</span>
                    </div>
                </div>
            )}

            {showExplainer && (
                <FeeExplainer
                    onClose={() => setShowExplainer(false)}
                    savings={breakdown.savingsVsTraditional}
                />
            )}
        </div>
    );
}
