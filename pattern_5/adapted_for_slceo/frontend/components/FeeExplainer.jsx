import React from 'react';
import styled from 'styled-components';
import { X, ShieldCheck, Zap, Clock, TrendingDown, Target } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(4px);
`;

const Modal = styled.div`
  background: white;
  width: 90%;
  max-width: 500px;
  border-radius: var(--rounded-2xl);
  overflow: hidden;
  box-shadow: var(--shadow-2xl);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const Header = styled.div`
  padding: var(--padding-xl);
  background: var(--gradient-purple-primary);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  margin: 0;
  color: white;
  font-size: var(--text-xl);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: none;
  }
`;

const Content = styled.div`
  padding: var(--padding-xl);
`;

const ValuePropList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
`;

const ValuePropItem = styled.div`
  display: flex;
  gap: var(--spacing-lg);
`;

const IconWrapper = styled.div`
  color: var(--primary-purple);
  background: rgba(49, 19, 93, 0.05);
  padding: 10px;
  border-radius: var(--rounded-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  height: fit-content;
`;

const PropText = styled.div`
  h4 {
    margin: 0 0 4px 0;
    font-size: var(--text-base);
    color: var(--text-dark);
  }
  p {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-gray);
    line-height: var(--line-height-relaxed);
  }
`;

const ComparisonBox = styled.div`
  margin-top: var(--spacing-2xl);
  padding: var(--padding-lg);
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--rounded-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
`;

const ComparisonText = styled.div`
  span {
    display: block;
    font-size: var(--text-xs);
    color: var(--success-teal);
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
    margin-bottom: 2px;
  }
  p {
    margin: 0;
    font-size: var(--text-base);
    color: #166534;
    font-weight: var(--font-weight-semibold);
  }
`;

export default function FeeExplainer({ onClose, savings }) {
    return (
        <Overlay onClick={onClose}>
            <Modal onClick={e => e.stopPropagation()}>
                <Header>
                    <Title>Why this fee?</Title>
                    <CloseButton onClick={onClose}>
                        <X size={24} />
                    </CloseButton>
                </Header>
                <Content>
                    <ValuePropList>
                        <ValuePropItem>
                            <IconWrapper><ShieldCheck size={24} /></IconWrapper>
                            <PropText>
                                <h4>Protection & Support</h4>
                                <p>Covers insurance, verification, and 24/7 dedicated support for your transaction.</p>
                            </PropText>
                        </ValuePropItem>

                        <ValuePropItem>
                            <IconWrapper><Zap size={24} /></IconWrapper>
                            <PropText>
                                <h4>Split Model Efficiency</h4>
                                <p>We split the cost between you and the landlord to keep individual fees world-class low.</p>
                            </PropText>
                        </ValuePropItem>

                        <ValuePropItem>
                            <IconWrapper><Clock size={24} /></IconWrapper>
                            <PropText>
                                <h4>Automated Handling</h4>
                                <p>Instant legal documentation updates and secure payment processing via Stripe.</p>
                            </PropText>
                        </ValuePropItem>
                    </ValuePropList>

                    {savings > 0 && (
                        <ComparisonBox>
                            <TrendingDown size={32} style={{ color: 'var(--success-green)' }} />
                            <ComparisonText>
                                <span>Industry Leading Rates</span>
                                <p>You're saving around {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(savings)} compared to traditional platforms.</p>
                            </ComparisonText>
                        </ComparisonBox>
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
                </Content>
            </Modal>
        </Overlay>
    );
}
