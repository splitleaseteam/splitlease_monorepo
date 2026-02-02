/**
 * COMPETITIVE BIDDING STORYBOOK STORIES
 *
 * Visual documentation and interactive examples of all components
 * in the Pattern 4 competitive bidding system.
 *
 * @version 1.0.0
 */

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CompetitiveBiddingManager } from '../index';
import { BiddingInterface } from '../components/BiddingInterface';
import { CompetitorIndicator } from '../components/CompetitorIndicator';
import { CountdownTimer } from '../components/CountdownTimer';
import { BiddingHistory } from '../components/BiddingHistory';
import { WinnerAnnouncement } from '../components/WinnerAnnouncement';
import { BiddingSession, Bid, BiddingParticipant } from '../types/biddingTypes';

// Mock data
const mockParticipants: BiddingParticipant[] = [
  {
    userId: 'user_123',
    name: 'John Smith',
    archetype: 'big_spender',
    currentBid: 2835,
    maxAutoBid: 3500,
    lastBidAt: new Date('2026-01-28T14:30:00Z'),
    isWinner: false,
    compensation: 0
  },
  {
    userId: 'user_789',
    name: 'Sarah Johnson',
    archetype: 'big_spender',
    currentBid: 3100,
    maxAutoBid: null,
    lastBidAt: new Date('2026-01-28T14:45:00Z'),
    isWinner: false,
    compensation: 0
  }
];

const mockBids: Bid[] = [
  {
    bidId: 'bid_1',
    userId: 'user_123',
    userName: 'John Smith',
    amount: 2835,
    timestamp: new Date('2026-01-28T14:00:00Z'),
    isAutoBid: false,
    round: 1
  },
  {
    bidId: 'bid_2',
    userId: 'user_789',
    userName: 'Sarah Johnson',
    amount: 3000,
    timestamp: new Date('2026-01-28T14:20:00Z'),
    isAutoBid: false,
    round: 1
  },
  {
    bidId: 'bid_3',
    userId: 'user_123',
    userName: 'John Smith',
    amount: 3100,
    timestamp: new Date('2026-01-28T14:30:00Z'),
    isAutoBid: true,
    round: 2
  }
];

const mockSession: BiddingSession = {
  sessionId: 'bid_abc123',
  targetNight: new Date('2026-10-15'),
  propertyId: 'prop_456',
  participants: mockParticipants,
  currentHighBid: mockBids[mockBids.length - 1],
  biddingHistory: mockBids,
  status: 'active',
  startedAt: new Date('2026-01-28T14:00:00Z'),
  expiresAt: new Date(Date.now() + 1800000), // 30 minutes from now
  maxRounds: 3,
  roundDuration: 3600,
  minimumIncrement: 310
};

// Meta configuration
const meta: Meta<typeof CompetitiveBiddingManager> = {
  title: 'Pattern 4/Competitive Bidding',
  component: CompetitiveBiddingManager,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'BS+BS Competitive Bidding System - Real-time auction interface for when both roommates are Big Spenders competing for the same night.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof CompetitiveBiddingManager>;

// ========================================
// FULL MANAGER STORIES
// ========================================

export const ActiveSession: Story = {
  args: {
    sessionId: 'bid_abc123',
    currentUserId: 'user_123',
    targetNight: new Date('2026-10-15'),
    propertyId: 'prop_456',
    initialSession: mockSession
  },
  parameters: {
    docs: {
      description: {
        story: 'Active bidding session where user is currently losing'
      }
    }
  }
};

export const Winning: Story = {
  args: {
    ...ActiveSession.args,
    initialSession: {
      ...mockSession,
      currentHighBid: {
        ...mockBids[0],
        userId: 'user_123'
      }
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'User is currently winning the bidding session'
      }
    }
  }
};

export const HighUrgency: Story = {
  args: {
    ...ActiveSession.args,
    initialSession: {
      ...mockSession,
      expiresAt: new Date(Date.now() + 240000) // 4 minutes
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Less than 5 minutes remaining - critical urgency'
      }
    }
  }
};

export const MaxRoundsReached: Story = {
  args: {
    ...ActiveSession.args,
    initialSession: {
      ...mockSession,
      biddingHistory: [
        ...mockBids,
        { ...mockBids[0], bidId: 'bid_4', userId: 'user_123', round: 3 }
      ]
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'User has reached maximum bid limit (3 rounds)'
      }
    }
  }
};

// ========================================
// COMPONENT STORIES
// ========================================

export const BiddingInterfaceStory: Story = {
  render: () => (
    <BiddingInterface
      session={mockSession}
      currentUserId="user_123"
      targetNight={new Date('2026-10-15')}
      onPlaceBid={async (amount) => console.log('Bid placed:', amount)}
      onWithdraw={async () => console.log('Withdrawn')}
      isSubmitting={false}
      error={null}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Main bidding interface with form, validation, and controls'
      }
    }
  }
};

export const CompetitorIndicatorStory: Story = {
  render: () => (
    <CompetitorIndicator
      session={mockSession}
      currentUserId="user_123"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Head-to-head competitor display showing both participants'
      }
    }
  }
};

export const CountdownTimerStory: Story = {
  render: () => (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <CountdownTimer
        expiresAt={new Date(Date.now() + 1800000)}
        onExpire={() => console.log('Timer expired')}
        showMilliseconds={false}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Live countdown timer with urgency indicators'
      }
    }
  }
};

export const CountdownCritical: Story = {
  render: () => (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <CountdownTimer
        expiresAt={new Date(Date.now() + 240000)} // 4 minutes
        onExpire={() => console.log('Timer expired')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Critical urgency - less than 5 minutes remaining'
      }
    }
  }
};

export const BiddingHistoryStory: Story = {
  render: () => (
    <BiddingHistory
      history={mockBids}
      currentUserId="user_123"
      participants={mockParticipants}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Chronological list of all bids placed in session'
      }
    }
  }
};

export const EmptyHistory: Story = {
  render: () => (
    <BiddingHistory
      history={[]}
      currentUserId="user_123"
      participants={mockParticipants}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no bids have been placed yet'
      }
    }
  }
};

export const WinnerAnnouncementStory: Story = {
  render: () => (
    <WinnerAnnouncement
      session={{
        ...mockSession,
        status: 'completed',
        currentHighBid: { ...mockBids[0], userId: 'user_123', amount: 3500 }
      }}
      currentUserId="user_123"
      targetNight={new Date('2026-10-15')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Winner view - user won the bidding session'
      }
    }
  }
};

export const LoserAnnouncement: Story = {
  render: () => (
    <WinnerAnnouncement
      session={{
        ...mockSession,
        status: 'completed',
        currentHighBid: { ...mockBids[0], userId: 'user_789', amount: 3500 }
      }}
      currentUserId="user_123"
      targetNight={new Date('2026-10-15')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loser view - user lost but receives compensation'
      }
    }
  }
};

// ========================================
// STATE STORIES
// ========================================

export const ConnectionError: Story = {
  render: () => (
    <div className="competitive-bidding-error">
      <div className="error-icon">⚠️</div>
      <h3>Connection Lost</h3>
      <p>Unable to connect to bidding server. Please check your connection.</p>
      <button onClick={() => window.location.reload()}>
        Retry Connection
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state when WebSocket connection fails'
      }
    }
  }
};

export const LoadingState: Story = {
  render: () => (
    <div className="competitive-bidding-loading">
      <div className="loading-spinner" />
      <p>Loading bidding session...</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state while session initializes'
      }
    }
  }
};

// ========================================
// INTERACTION STORIES
// ========================================

export const BidSubmissionFlow: Story = {
  render: () => {
    const [submitted, setSubmitted] = React.useState(false);
    const [amount, setAmount] = React.useState<number | null>(null);

    return (
      <div>
        <BiddingInterface
          session={mockSession}
          currentUserId="user_123"
          targetNight={new Date('2026-10-15')}
          onPlaceBid={async (amt) => {
            setAmount(amt);
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 2000);
          }}
          onWithdraw={async () => console.log('Withdrawn')}
          isSubmitting={submitted}
          error={null}
        />
        {submitted && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#E8F5E9',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            ✅ Bid of ${amount} submitted successfully!
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive bid submission with feedback'
      }
    }
  }
};

export const AutoBidSetup: Story = {
  render: () => {
    const [autoEnabled, setAutoEnabled] = React.useState(false);
    const [maxAmount, setMaxAmount] = React.useState('');

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="auto-bid-section">
          <label className="auto-bid-toggle">
            <input
              type="checkbox"
              checked={autoEnabled}
              onChange={(e) => setAutoEnabled(e.target.checked)}
            />
            <span className="toggle-label">
              Enable Auto-Bid (max amount)
            </span>
            <span className="info-icon" title="Automatically bid up to your max if outbid">
              ℹ️
            </span>
          </label>

          {autoEnabled && (
            <div className="max-bid-input-group">
              <label htmlFor="max-autobid">Maximum Auto-Bid</label>
              <div className="currency-input">
                <span className="currency-symbol">$</span>
                <input
                  id="max-autobid"
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="3500"
                />
              </div>
              <p className="auto-bid-explainer">
                We'll automatically bid up to ${maxAmount || '___'} if outbid.
                Works like eBay proxy bidding.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive auto-bid setup interface'
      }
    }
  }
};

// ========================================
// MOBILE STORIES
// ========================================

export const MobileView: Story = {
  args: ActiveSession.args,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile-optimized responsive layout'
      }
    }
  }
};

export const TabletView: Story = {
  args: ActiveSession.args,
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Tablet layout with adjusted grid'
      }
    }
  }
};
