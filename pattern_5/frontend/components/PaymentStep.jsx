/**
 * PaymentStep Component
 * Stripe Elements integrated payment flow with fee transparency
 *
 * @component PaymentStep
 * @version 1.0.0
 * @production
 */

import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Stack,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Checkbox,
  FormControlLabel,
  Link
} from '@mui/material';
import {
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
  Verified as VerifiedIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { calculateFeeBreakdown, formatCurrency } from '../utils/feeCalculations';
import PriceDisplay from './PriceDisplay';

/**
 * Stripe publishable key (should be in environment variables)
 */
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

/**
 * Payment steps
 */
const PAYMENT_STEPS = [
  'Review Transaction',
  'Payment Information',
  'Confirm & Pay'
];

/**
 * Stripe Card Element styling
 */
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSmoothing: 'antialiased',
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146',
    },
  },
  hidePostalCode: false
};

/**
 * PaymentForm Component (Inner component with Stripe hooks)
 */
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

  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [feeAcknowledged, setFeeAcknowledged] = useState(false);

  // ========================================
  // Payment Processing
  // ========================================
  const handlePayment = async () => {
    if (!stripe || !elements) {
      setError('Stripe has not loaded. Please refresh the page.');
      return;
    }

    if (!termsAccepted || !feeAcknowledged) {
      setError('Please accept the terms and acknowledge the fee breakdown.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          // Add billing details from user profile if available
          name: metadata?.userName || '',
          email: metadata?.userEmail || ''
        }
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Call backend to process payment
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          amount: Math.round(feeBreakdown.totalPrice * 100), // Convert to cents
          currency: 'usd',
          transactionType,
          leaseId,
          userId,
          feeBreakdown: {
            basePrice: feeBreakdown.basePrice,
            platformFee: feeBreakdown.platformFee,
            landlordShare: feeBreakdown.landlordShare,
            totalFee: feeBreakdown.totalFee,
            totalPrice: feeBreakdown.totalPrice
          },
          metadata
        })
      });

      const paymentResult = await response.json();

      if (!response.ok) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // Handle 3D Secure if required
      if (paymentResult.requiresAction && paymentResult.clientSecret) {
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          paymentResult.clientSecret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        if (paymentIntent.status !== 'succeeded') {
          throw new Error('Payment authentication failed');
        }
      }

      // Payment successful
      setSuccess(true);
      setActiveStep(PAYMENT_STEPS.length);

      if (onPaymentSuccess) {
        onPaymentSuccess({
          paymentIntent: paymentResult.paymentIntent,
          feeBreakdown,
          transactionType
        });
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');

      if (onPaymentError) {
        onPaymentError(err);
      }
    } finally {
      setProcessing(false);
    }
  };

  // ========================================
  // Navigation Handlers
  // ========================================
  const handleNext = () => {
    if (activeStep === 0) {
      // Validate fee acknowledgment
      if (!feeAcknowledged) {
        setError('Please acknowledge the fee breakdown before proceeding.');
        return;
      }
      setError(null);
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Validate card information
      if (!cardComplete) {
        setError('Please complete your card information.');
        return;
      }
      setError(null);
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Process payment
      handlePayment();
    }
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  // ========================================
  // Render Step Content
  // ========================================
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        // Step 1: Review Transaction
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Review Transaction Details
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please review the pricing breakdown before proceeding with payment.
            </Typography>

            {/* Price Display */}
            <PriceDisplay
              basePrice={feeBreakdown.basePrice}
              totalPrice={feeBreakdown.totalPrice}
              transactionType={transactionType}
              defaultExpanded={true}
              showComparison={true}
              elevation={0}
            />

            {/* Fee Acknowledgment */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={feeAcknowledged}
                    onChange={(e) => setFeeAcknowledged(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I understand the fee breakdown and agree to pay{' '}
                    <strong>{formatCurrency(feeBreakdown.totalPrice)}</strong>
                  </Typography>
                }
              />
            </Box>
          </Box>
        );

      case 1:
        // Step 2: Payment Information
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Enter Payment Information
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Your payment is secured by Stripe. We never store your card details.
            </Typography>

            {/* Security Badge */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 3, p: 1.5, bgcolor: 'success.50', borderRadius: 1 }}
            >
              <LockIcon color="success" />
              <Typography variant="body2" color="success.dark" fontWeight={600}>
                256-bit SSL Encryption • PCI-DSS Compliant
              </Typography>
            </Stack>

            {/* Card Element */}
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1,
                bgcolor: 'white',
                '&:focus-within': {
                  borderColor: 'primary.main',
                  boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.light}`
                }
              }}
            >
              <CardElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={(e) => {
                  setCardComplete(e.complete);
                  if (e.error) {
                    setError(e.error.message);
                  } else {
                    setError(null);
                  }
                }}
              />
            </Box>

            {/* Payment Summary */}
            <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Transaction Amount:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(feeBreakdown.basePrice)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Platform Fee (1.5%):</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(feeBreakdown.totalFee)}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body1" fontWeight={700}>
                    Total Charge:
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {formatCurrency(feeBreakdown.totalPrice)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        );

      case 2:
        // Step 3: Confirm & Pay
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Confirm Payment
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please review your payment details one final time before completing the transaction.
            </Typography>

            {/* Final Summary */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    TRANSACTION TYPE
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {feeBreakdown.transactionType}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    AMOUNT BREAKDOWN
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Base Amount:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(feeBreakdown.basePrice)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Platform Fee:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(feeBreakdown.totalFee)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={700}>
                    Total:
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {formatCurrency(feeBreakdown.totalPrice)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* Terms and Conditions */}
            <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1, mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" underline="hover">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" target="_blank" underline="hover">
                      Privacy Policy
                    </Link>
                  </Typography>
                }
              />
            </Box>

            {/* Security Notice */}
            <Alert severity="info" icon={<LockIcon />}>
              Your payment will be processed securely through Stripe. You will receive a receipt
              via email immediately after the transaction is complete.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  // ========================================
  // Main Render
  // ========================================
  return (
    <Box>
      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {PAYMENT_STEPS.map((label, index) => (
          <Step key={label}>
            <StepLabel
              StepIconComponent={() => (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor:
                      index < activeStep
                        ? 'success.main'
                        : index === activeStep
                        ? 'primary.main'
                        : 'grey.300',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  {index < activeStep ? (
                    <CheckCircleIcon fontSize="small" />
                  ) : (
                    index + 1
                  )}
                </Box>
              )}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Display */}
      {success ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'success.50' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your payment of {formatCurrency(feeBreakdown.totalPrice)} has been processed successfully.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            A receipt has been sent to your email address.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Step Content */}
          <Box sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Box>

          {/* Navigation Buttons */}
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              disabled={activeStep === 0 || processing}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                processing ||
                (activeStep === 0 && !feeAcknowledged) ||
                (activeStep === 1 && !cardComplete) ||
                (activeStep === 2 && !termsAccepted)
              }
              startIcon={
                processing ? (
                  <CircularProgress size={20} color="inherit" />
                ) : activeStep === 2 ? (
                  <PaymentIcon />
                ) : null
              }
              size="large"
            >
              {processing
                ? 'Processing...'
                : activeStep === 2
                ? `Pay ${formatCurrency(feeBreakdown.totalPrice)}`
                : 'Continue'}
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
};

PaymentForm.propTypes = {
  feeBreakdown: PropTypes.object.isRequired,
  onPaymentSuccess: PropTypes.func,
  onPaymentError: PropTypes.func,
  transactionType: PropTypes.string.isRequired,
  leaseId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  metadata: PropTypes.object
};

/**
 * PaymentStep Component (Wrapper with Stripe Elements)
 */
export const PaymentStep = ({
  basePrice,
  transactionType = 'date_change',
  leaseId,
  userId,
  onPaymentSuccess,
  onPaymentError,
  urgencyMultiplier = 1.0,
  buyoutMultiplier = 1.0,
  metadata = {}
}) => {
  // Calculate fee breakdown
  const feeBreakdown = useMemo(() => {
    return calculateFeeBreakdown(basePrice, transactionType, {
      urgencyMultiplier,
      buyoutMultiplier
    });
  }, [basePrice, transactionType, urgencyMultiplier, buyoutMultiplier]);

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        feeBreakdown={feeBreakdown}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        transactionType={transactionType}
        leaseId={leaseId}
        userId={userId}
        metadata={metadata}
      />
    </Elements>
  );
};

PaymentStep.propTypes = {
  basePrice: PropTypes.number.isRequired,
  transactionType: PropTypes.string,
  leaseId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  onPaymentSuccess: PropTypes.func,
  onPaymentError: PropTypes.func,
  urgencyMultiplier: PropTypes.number,
  buyoutMultiplier: PropTypes.number,
  metadata: PropTypes.object
};

export default PaymentStep;
