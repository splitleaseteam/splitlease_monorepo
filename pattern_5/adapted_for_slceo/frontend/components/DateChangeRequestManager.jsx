import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
    Calendar,
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    Clock
} from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Adjust based on target project
import Button from '../Button';
import FeePriceDisplay from '../FeePriceDisplay';
import PaymentStep from '../PaymentStep';
import { useFeeCalculation } from '../hooks/useFeeCalculation';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: var(--padding-xl);
`;

const StepperContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-4xl);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 15px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--border-color);
    z-index: 0;
  }
`;

const StepItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  background: var(--bg-light);
  padding: 0 var(--spacing-md);
`;

const StepCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--text-sm);
  background: ${props => props.active ? 'var(--primary-purple)' : props.completed ? 'var(--success-green)' : 'var(--bg-white)'};
  color: ${props => (props.active || props.completed) ? 'white' : 'var(--text-gray)'};
  border: 2px solid ${props => props.active ? 'var(--primary-purple)' : props.completed ? 'var(--success-green)' : 'var(--border-color)'};
  transition: all 0.3s ease;
`;

const StepLabel = styled.span`
  font-size: var(--text-xs);
  margin-top: var(--spacing-sm);
  color: ${props => props.active ? 'var(--primary-purple)' : 'var(--text-gray)'};
  font-weight: ${props => props.active ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)'};
`;

const ContentCard = styled.div`
  background: white;
  border-radius: var(--rounded-2xl);
  border: 1px solid var(--border-color);
  padding: var(--padding-2xl);
  box-shadow: var(--shadow-sm);
  min-height: 400px;
`;

const StepTitle = styled.h2`
  font-size: var(--text-2xl);
  margin-bottom: var(--spacing-sm);
  color: var(--primary-purple);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

const StepDescription = styled.p`
  color: var(--text-gray);
  margin-bottom: var(--spacing-2xl);
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-xl);
  
  label {
    display: block;
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-sm);
    color: var(--text-dark);
  }
  
  input, textarea {
    width: 100%;
    padding: var(--padding-md);
    border: 1px solid var(--border-color);
    border-radius: var(--rounded-lg);
    font-family: inherit;
    
    &:focus {
      outline: none;
      border-color: var(--primary-purple);
      box-shadow: 0 0 0 3px rgba(49, 19, 93, 0.1);
    }
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-3xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
`;

const SummaryPanel = styled.div`
  background: var(--bg-light);
  border-radius: var(--rounded-lg);
  padding: var(--padding-lg);
  margin-bottom: var(--spacing-xl);
`;

const InfoBar = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--padding-md);
  background: var(--bg-info);
  border-radius: var(--rounded-md);
  color: var(--info-blue);
  font-size: var(--text-sm);
  margin-top: var(--spacing-lg);
`;

const STEPS = ['Select Date', 'Review Fee', 'Payment', 'Confirmation'];

export default function DateChangeRequestManager({ leaseId, userId, landlordId, initialMonthlyRent }) {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [requestId, setRequestId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        newDate: '',
        reason: ''
    });

    const { feeBreakdown, isCalculating } = useFeeCalculation(initialMonthlyRent, 'date_change');

    const handleNext = async () => {
        if (activeStep === 0) {
            if (!formData.newDate) {
                setError('Please select a new move-out date');
                return;
            }
            setActiveStep(1);
        } else if (activeStep === 1) {
            // Create request draft in DB before payment
            setLoading(true);
            try {
                const { data, error: dbError } = await supabase
                    .from('datechangerequest')
                    .insert({
                        lease_id: leaseId,
                        user_id: userId,
                        requested_date: formData.newDate,
                        reason: formData.reason,
                        status: 'pending',
                        fee_breakdown: feeBreakdown,
                        base_price: initialMonthlyRent,
                        total_price: feeBreakdown.totalPrice,
                        payment_status: 'unpaid'
                    })
                    .select()
                    .single();

                if (dbError) throw dbError;
                setRequestId(data._id || data.id);
                setActiveStep(2);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const handlePaymentSuccess = () => {
        setActiveStep(3);
    };

    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return (
                    <>
                        <StepTitle><Calendar /> When would you like to move out?</StepTitle>
                        <StepDescription>Choose your new move-out date. Your landlord will review this request.</StepDescription>

                        <FormGroup>
                            <label>Proposed Move-Out Date</label>
                            <input
                                type="date"
                                value={formData.newDate}
                                onChange={e => setFormData({ ...formData, newDate: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </FormGroup>

                        <FormGroup>
                            <label>Reason for change (Optional)</label>
                            <textarea
                                rows="4"
                                placeholder="Briefly explain why you'd like to change your dates..."
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </FormGroup>

                        <InfoBar>
                            <Clock size={16} />
                            <span>You'll only be charged if your landlord approves.</span>
                        </InfoBar>
                    </>
                );
            case 1:
                return (
                    <>
                        <StepTitle><MessageSquare /> Transparent Fee Breakdown</StepTitle>
                        <StepDescription>Review the pricing for this update. We believe in 100% transparency.</StepDescription>

                        <SummaryPanel>
                            <strong>New Proposed Date:</strong> {new Date(formData.newDate).toLocaleDateString()}
                        </SummaryPanel>

                        <FeePriceDisplay
                            basePrice={initialMonthlyRent}
                            transactionType="date_change"
                        />

                        <InfoBar>
                            <CheckCircle size={16} />
                            <span>This fee covers automated contract generation and protection.</span>
                        </InfoBar>
                    </>
                );
            case 2:
                return (
                    <>
                        <StepTitle><Lock /> Secure Payment</StepTitle>
                        <StepDescription>Enter your payment details to submit the request.</StepDescription>
                        <PaymentStep
                            feeBreakdown={feeBreakdown}
                            transactionType="date_change"
                            leaseId={leaseId}
                            userId={userId}
                            metadata={{ requestId, newDate: formData.newDate }}
                            onPaymentSuccess={handlePaymentSuccess}
                        />
                    </>
                );
            case 3:
                return (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <CheckCircle size={80} color="var(--success-green)" style={{ marginBottom: '24px' }} />
                        <StepTitle style={{ justifyContent: 'center' }}>Request Submitted!</StepTitle>
                        <StepDescription>
                            Your payment has been processed and your landlord has been notified.
                            We'll update you as soon as they respond.
                        </StepDescription>
                        <Button variant="primary" onClick={() => window.location.href = '/dashboard'} style={{ marginTop: '24px' }}>
                            Go to Dashboard
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Container>
            <StepperContainer>
                {STEPS.map((step, index) => (
                    <StepItem key={step}>
                        <StepCircle
                            active={activeStep === index}
                            completed={activeStep > index}
                        >
                            {activeStep > index ? <CheckCircle size={18} /> : index + 1}
                        </StepCircle>
                        <StepLabel active={activeStep === index}>{step}</StepLabel>
                    </StepItem>
                ))}
            </StepperContainer>

            <ContentCard>
                {error && (
                    <div style={{ color: 'red', marginBottom: '16px', padding: '12px', background: '#fee', borderRadius: '8px' }}>
                        <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                        {error}
                    </div>
                )}

                {renderStep()}

                {activeStep < 2 && (
                    <ButtonRow>
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={activeStep === 0 || loading}
                        >
                            Back
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleNext}
                            loading={loading || isCalculating}
                            icon={<ChevronRight size={18} />}
                            iconPosition="right"
                        >
                            {activeStep === 1 ? 'Proceed to Payment' : 'Continue'}
                        </Button>
                    </ButtonRow>
                )}
            </ContentCard>
        </Container>
    );
}
