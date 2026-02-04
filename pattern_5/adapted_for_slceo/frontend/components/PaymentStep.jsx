import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import {
    Lock,
    CreditCard,
    CheckCircle,
    AlertCircle,
    ShieldCheck,
    ChevronRight,
    TrendingDown
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { calculateFeeBreakdown, formatCurrency } from '../logic/feeCalculations';
import Button from './Button';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const Card = styled.div`
  background: white;
  border-radius: var(--rounded-xl);
  border: 1px solid var(--border-color);
  padding: var(--padding-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-lg);
`;

const SectionTitle = styled.h3`
  font-size: var(--text-lg);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--primary-purple);
`;

const SummaryBox = styled.div`
  background: var(--bg-light);
  border-radius: var(--rounded-lg);
  padding: var(--padding-lg);
  margin-bottom: var(--spacing-xl);
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  font-size: var(--text-base);
  
  &.total {
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-color);
    font-weight: var(--font-weight-bold);
    font-size: var(--text-lg);
    color: var(--primary-purple);
  }
`;

const StripeElementContainer = styled.div`
  padding: var(--padding-md);
  border: 1px solid var(--border-color);
  border-radius: var(--rounded-md);
  background: white;
  margin-bottom: var(--spacing-lg);
  
  &:focus-within {
    border-color: var(--accent-blue);
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  }
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: #f0fdf4;
  border-radius: var(--rounded-md);
  margin-bottom: var(--spacing-xl);
  color: #166534;
  font-size: var(--text-xs);
`;

const CheckboxLabel = styled.label`
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-start;
  font-size: var(--text-sm);
  color: var(--text-gray);
  cursor: pointer;
  margin-bottom: var(--spacing-md);
  
  input {
    margin-top: 2px;
  }
`;

const ErrorAlert = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: var(--padding-md);
  border-radius: var(--rounded-md);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-sm);
`;

const SuccessState = styled.div`
  text-align: center;
  padding: var(--padding-2xl);
  
  svg {
    color: var(--success-green);
    margin-bottom: var(--spacing-lg);
  }
`;

const PaymentForm = ({
    feeBreakdown,
    onPaymentSuccess,
    onPaymentError,
    transactionType,
    leaseId,
    userId,
    metadata
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

            const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (pmError) throw new Error(pmError.message);

            // Call the edge function to create payment intent and process
            const { data, error: fetchError } = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.ENV.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    paymentMethodId: paymentMethod.id,
                    requestId: metadata.requestId,
                    amount: Math.round(feeBreakdown.totalPrice * 100),
                    transactionType,
                    leaseId,
                }),
            }).then(res => res.json());

            if (fetchError) throw new Error(fetchError);

            if (data.requiresAction) {
                const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);
                if (confirmError) throw new Error(confirmError.message);
            }

            setSuccess(true);
            if (onPaymentSuccess) onPaymentSuccess(data);
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message);
            if (onPaymentError) onPaymentError(err);
        } finally {
            setProcessing(false);
        }
    };

    if (success) {
        return (
            <SuccessState>
                <CheckCircle size={64} />
                <h2>Payment Successful</h2>
                <p>Your request has been submitted and payment processed.</p>
                <Button variant="primary" fullWidth onClick={() => window.location.href = '/dashboard'} style={{ marginTop: '24px' }}>
                    Back to Dashboard
                </Button>
            </SuccessState>
        );
    }

    return (
        <Container as="form" onSubmit={handleSubmit}>
            <Card>
                <SectionTitle>
                    <CreditCard size={20} />
                    Payment Information
                </SectionTitle>

                <SummaryBox>
                    <SummaryRow>
                        <span>Base Fee</span>
                        <span>{formatCurrency(feeBreakdown.basePrice)}</span>
                    </SummaryRow>
                    <SummaryRow>
                        <span>Platform Service Fee</span>
                        <span>{formatCurrency(feeBreakdown.totalFee)}</span>
                    </SummaryRow>
                    <SummaryRow className="total">
                        <span>Total to Pay</span>
                        <span>{formatCurrency(breakdown.totalPrice)}</span>
                    </SummaryRow>
                </SummaryBox>

                <SecurityBadge>
                    <ShieldCheck size={16} />
                    <span>Secure 256-bit SSL Encrypted Payment. Powered by Stripe.</span>
                </SecurityBadge>

                {error && (
                    <ErrorAlert>
                        <AlertCircle size={16} />
                        {error}
                    </ErrorAlert>
                )}

                <StripeElementContainer>
                    <CardElement options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: 'var(--text-dark)',
                                '::placeholder': { color: 'var(--text-light-gray)' },
                                fontFamily: 'var(--font-inter)',
                            }
                        }
                    }} />
                </StripeElementContainer>

                <CheckboxLabel>
                    <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span>I agree to the Terms of Service and acknowledge the 1.5% transparency fee model.</span>
                </CheckboxLabel>

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={processing}
                    disabled={!termsAccepted || !stripe}
                    icon={<ChevronRight size={18} />}
                    iconPosition="right"
                >
                    Pay {formatCurrency(feeBreakdown.totalPrice)}
                </Button>
            </Card>
        </Container>
    );
};

export const PaymentStep = (props) => (
    <Elements stripe={stripePromise}>
        <PaymentForm {...props} />
    </Elements>
);

export default PaymentStep;
