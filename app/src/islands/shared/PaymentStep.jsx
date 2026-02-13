import { useState } from 'react';
import {
    Lock,
    CreditCard,
    CheckCircle,
    AlertCircle,
    ShieldCheck,
    ChevronRight
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { formatCurrency } from '../../logic/calculators/feeCalculations';
import Button from './Button';
import './PaymentStep.css';

// Initialize Stripe with publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
}
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Card element styling options
const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#1a1a2e',
            '::placeholder': { color: '#9ca3af' },
            fontFamily: 'Inter, system-ui, sans-serif',
        },
        invalid: {
            color: '#b91c1c',
        }
    }
};

/**
 * PaymentForm - Internal form component with Stripe integration
 * Wrapped by Elements provider in PaymentStep
 */
const PaymentForm = ({
    feeBreakdown,
    onPaymentSuccess,
    onPaymentError,
    onBack,
    transactionType,
    leaseId,
    _userId,
    metadata = {}
}) => {
    const stripe = useStripe();
    const elements = useElements();

    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) return;
        if (!termsAccepted) {
            setError('Please accept the terms and conditions');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const cardElement = elements.getElement(CardElement);

            // Create payment method with card details
            const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (pmError) throw new Error(pmError.message);

            // Call edge function to create payment intent
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({
                        paymentMethodId: paymentMethod.id,
                        requestId: metadata.requestId,
                        amount: Math.round(feeBreakdown.totalPrice * 100), // Convert to cents
                        transactionType,
                        leaseId,
                        feeBreakdown,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Payment failed');
            }

            // Handle 3D Secure authentication if required
            if (data.requiresAction) {
                const { error: confirmError } = await stripe.confirmCardPayment(
                    data.clientSecret
                );
                if (confirmError) throw new Error(confirmError.message);
            }

            setSuccess(true);
            if (onPaymentSuccess) {
                onPaymentSuccess({
                    paymentIntentId: data.paymentIntentId,
                    amount: feeBreakdown.totalPrice,
                    ...data
                });
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message);
            if (onPaymentError) onPaymentError(err);
        } finally {
            setProcessing(false);
        }
    };

    // Success state
    if (success) {
        return (
            <div className="payment-success-state">
                <CheckCircle size={64} />
                <h2>Payment Successful</h2>
                <p>Your request has been submitted and payment processed.</p>
                <Button
                    variant="primary"
                    fullWidth
                    onClick={() => window.location.href = '/dashboard'}
                    style={{ marginTop: '24px' }}
                >
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <form
            className={`payment-step-container ${processing ? 'payment-processing' : ''}`}
            onSubmit={handleSubmit}
        >
            <div className="payment-step-card">
                <h3 className="payment-section-title">
                    <CreditCard size={20} />
                    Payment Information
                </h3>

                {/* Fee Summary */}
                <div className="payment-summary-box">
                    <div className="payment-summary-row">
                        <span>Base Fee</span>
                        <span>{formatCurrency(feeBreakdown.basePrice)}</span>
                    </div>
                    <div className="payment-summary-row">
                        <span>Platform Service Fee</span>
                        <span>{formatCurrency(feeBreakdown.totalFee)}</span>
                    </div>
                    <div className="payment-summary-row total">
                        <span>Total to Pay</span>
                        <span>{formatCurrency(feeBreakdown.totalPrice)}</span>
                    </div>
                </div>

                {/* Security Badge */}
                <div className="payment-security-badge">
                    <ShieldCheck size={16} />
                    <span>Secure 256-bit SSL Encrypted Payment. Powered by Stripe.</span>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="payment-error-alert">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Stripe Card Element */}
                <div className="stripe-element-container">
                    <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>

                {/* Terms Checkbox */}
                <label className="payment-checkbox-label">
                    <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span>
                        I agree to the Terms of Service and acknowledge the 1.5%
                        transparency fee model.
                    </span>
                </label>

                {/* Action Buttons */}
                <div className="payment-submit-button">
                    {onBack && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onBack}
                            disabled={processing}
                            style={{ marginRight: '12px' }}
                        >
                            Back
                        </Button>
                    )}
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth={!onBack}
                        loading={processing}
                        disabled={!termsAccepted || !stripe || processing}
                        icon={<ChevronRight size={18} />}
                        iconPosition="right"
                    >
                        {processing ? 'Processing...' : `Pay ${formatCurrency(feeBreakdown.totalPrice)}`}
                    </Button>
                </div>
            </div>
        </form>
    );
};

/**
 * PaymentStep - Main component wrapping PaymentForm with Stripe Elements
 *
 * @param {Object} feeBreakdown - Fee calculation breakdown from useFeeCalculation
 * @param {Function} onPaymentSuccess - Callback when payment succeeds
 * @param {Function} onPaymentError - Callback when payment fails
 * @param {Function} onBack - Optional callback to go back
 * @param {string} transactionType - Type of transaction (date_change, etc.)
 * @param {string} leaseId - Associated lease ID
 * @param {string} userId - User making the payment
 * @param {Object} metadata - Additional metadata (requestId, etc.)
 */
export const PaymentStep = (props) => (
    <Elements stripe={stripePromise}>
        <PaymentForm {...props} />
    </Elements>
);

export default PaymentStep;
