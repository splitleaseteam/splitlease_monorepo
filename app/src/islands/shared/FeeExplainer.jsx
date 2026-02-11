import { X, ShieldCheck, Zap, Clock, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../logic/calculators/feeCalculations';
import './FeeExplainer.css';

export default function FeeExplainer({ onClose, savings }) {
    return (
        <div className="fee-explainer-overlay" onClick={onClose}>
            <div className="fee-explainer-modal" onClick={e => e.stopPropagation()}>
                <div className="fee-explainer-header">
                    <h3 className="fee-explainer-title">Why this fee?</h3>
                    <button className="fee-explainer-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="fee-explainer-content">
                    <div className="value-prop-list">
                        <div className="value-prop-item">
                            <div className="icon-wrapper"><ShieldCheck size={24} /></div>
                            <div className="prop-text">
                                <h4>Protection & Support</h4>
                                <p>Covers insurance, verification, and 24/7 dedicated support for your transaction.</p>
                            </div>
                        </div>

                        <div className="value-prop-item">
                            <div className="icon-wrapper"><Zap size={24} /></div>
                            <div className="prop-text">
                                <h4>Split Model Efficiency</h4>
                                <p>We split the cost between you and the landlord to keep individual fees world-class low.</p>
                            </div>
                        </div>

                        <div className="value-prop-item">
                            <div className="icon-wrapper"><Clock size={24} /></div>
                            <div className="prop-text">
                                <h4>Automated Handling</h4>
                                <p>Instant legal documentation updates and secure payment processing via Stripe.</p>
                            </div>
                        </div>
                    </div>

                    {savings > 0 && (
                        <div className="comparison-box">
                            <TrendingDown size={32} className="comparison-icon" />
                            <div className="comparison-text">
                                <span className="comparison-label">Industry Leading Rates</span>
                                <p>You&apos;re saving around {formatCurrency(savings)} compared to traditional platforms.</p>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '24px' }}>
                        <button
                            className="btn-primary btn-full-width"
                            onClick={onClose}
                            style={{ padding: '12px' }}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
