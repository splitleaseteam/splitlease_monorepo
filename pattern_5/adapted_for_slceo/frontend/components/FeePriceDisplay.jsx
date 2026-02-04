import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown, ChevronUp, Info, CheckCircle, TrendingDown } from 'lucide-react';
import { calculateFeeBreakdown, formatCurrency } from '../logic/feeCalculations';
import FeeExplainer from './FeeExplainer';

const Container = styled.div`
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--rounded-lg);
  padding: var(--padding-lg);
  margin-bottom: var(--spacing-lg);
`;

const Title = styled.h4`
  font-size: var(--text-md);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  font-size: var(--text-base);
  
  &.total {
    border-top: 1px solid var(--border-color);
    margin-top: var(--spacing-sm);
    padding-top: var(--spacing-md);
    font-weight: var(--font-weight-bold);
    color: var(--primary-purple);
  }
  
  &.savings {
    color: var(--success-green);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    background: #f0fdf4;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--rounded-md);
    margin-top: var(--spacing-md);
  }
`;

const FeeBreakdownToggle = styled.button`
  background: none;
  border: none;
  color: var(--accent-blue);
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0;
  margin-top: var(--spacing-sm);
  
  &:hover {
    color: var(--accent-blue-hover);
    text-decoration: underline;
    transform: none;
  }
`;

const ExpandedBreakdown = styled.div`
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-light);
  border-radius: var(--rounded-md);
  font-size: var(--text-sm);
`;

const BreakdownItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  color: var(--text-gray);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const WhyLink = styled.button`
  background: none;
  border: none;
  color: var(--text-gray);
  font-size: var(--text-xs);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  
  &:hover {
    color: var(--primary-purple);
    transform: none;
  }
`;

export default function FeePriceDisplay({ basePrice, transactionType = 'date_change' }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showExplainer, setShowExplainer] = useState(false);

    const breakdown = calculateFeeBreakdown(basePrice, transactionType);

    if (!breakdown) return null;

    return (
        <Container>
            <Title>
                <span>Price Summary</span>
                <Info
                    size={16}
                    style={{ cursor: 'pointer', color: 'var(--text-light-gray)' }}
                    onClick={() => setShowExplainer(true)}
                />
            </Title>

            <PriceRow>
                <span>Base Rate</span>
                <span>{formatCurrency(breakdown.basePrice)}</span>
            </PriceRow>

            <PriceRow>
                <span>Platform & Service Fee</span>
                <span>{formatCurrency(breakdown.totalFee)}</span>
            </PriceRow>

            <FeeBreakdownToggle onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                View Breakdown
            </FeeBreakdownToggle>

            {isExpanded && (
                <ExpandedBreakdown>
                    <BreakdownItem>
                        <span>Platform Fee ({breakdown.effectiveRate}%)</span>
                        <span>{formatCurrency(breakdown.platformFee)}</span>
                    </BreakdownItem>
                    <BreakdownItem>
                        <span>Landlord Share</span>
                        <span>{formatCurrency(breakdown.landlordShare)}</span>
                    </BreakdownItem>
                    <BreakdownItem style={{ marginTop: '8px', borderTop: '1px dashed #ccc', paddingTop: '8px' }}>
                        <span><strong>Total Fee Paid by You</strong></span>
                        <span><strong>{formatCurrency(breakdown.totalFee)}</strong></span>
                    </BreakdownItem>
                    <WhyLink onClick={() => setShowExplainer(true)}>
                        What does this cover?
                    </WhyLink>
                </ExpandedBreakdown>
            )}

            <PriceRow className="total">
                <span>Total Price</span>
                <span>{formatCurrency(breakdown.totalPrice)}</span>
            </PriceRow>

            {breakdown.savingsVsTraditional > 0 && (
                <PriceRow className="savings">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingDown size={16} />
                        <span>You're saving {formatCurrency(breakdown.savingsVsTraditional)} vs. competitors</span>
                    </div>
                </PriceRow>
            )}

            {showExplainer && (
                <FeeExplainer
                    onClose={() => setShowExplainer(false)}
                    savings={breakdown.savingsVsTraditional}
                />
            )}
        </Container>
    );
}
