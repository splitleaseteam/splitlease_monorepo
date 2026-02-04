/**
 * PriceDisplay Component Stories
 *
 * Displays price breakdown for selected nights including base price,
 * nightly rate, discounts, fees, and totals.
 */
import { PriceDisplay } from './PriceDisplay';

export default {
  title: 'Shared/PriceDisplay',
  component: PriceDisplay,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## PriceDisplay Component

Displays a detailed price breakdown for a booking reservation.
Shows base price, nightly rate, discounts, fees, and various totals.

### Price Breakdown Object

| Property | Type | Description |
|----------|------|-------------|
| numberOfNights | number | Total nights in reservation |
| basePrice | number | Base price before adjustments |
| nightlyRate | number | Per-night rate |
| discountAmount | number | Total discount applied |
| markupAmount | number | Fees and markups added |
| totalPrice | number | Final total price |
| pricePerNight | number | Effective per-night price |
| fourWeekRent | number | (Optional) 4-week equivalent |
| initialPayment | number | (Optional) First payment amount |

### Usage

\`\`\`jsx
import { PriceDisplay } from 'islands/shared/PriceDisplay';

<PriceDisplay
  priceBreakdown={{
    numberOfNights: 3,
    basePrice: 450,
    nightlyRate: 150,
    discountAmount: 0,
    markupAmount: 50,
    totalPrice: 500,
    pricePerNight: 166.67,
  }}
  currency="USD"
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    priceBreakdown: {
      description: 'Object containing all pricing information',
      table: {
        type: { summary: 'object' },
      },
    },
    currency: {
      control: 'select',
      options: ['USD', 'EUR', 'GBP'],
      description: 'Currency code for formatting',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'USD' },
      },
    },
  },
};

// Standard booking
export const Default = {
  args: {
    priceBreakdown: {
      numberOfNights: 3,
      basePrice: 450,
      nightlyRate: 150,
      discountAmount: 0,
      markupAmount: 0,
      totalPrice: 450,
      pricePerNight: 150,
    },
    currency: 'USD',
  },
};

// With discount
export const WithDiscount = {
  args: {
    priceBreakdown: {
      numberOfNights: 7,
      basePrice: 1050,
      nightlyRate: 150,
      discountAmount: 105,
      markupAmount: 0,
      totalPrice: 945,
      pricePerNight: 135,
    },
    currency: 'USD',
  },
  parameters: {
    docs: {
      description: {
        story: 'Booking with a 10% weekly discount applied.',
      },
    },
  },
};

// With fees/markup
export const WithFees = {
  args: {
    priceBreakdown: {
      numberOfNights: 4,
      basePrice: 600,
      nightlyRate: 150,
      discountAmount: 0,
      markupAmount: 90,
      totalPrice: 690,
      pricePerNight: 172.50,
    },
    currency: 'USD',
  },
  parameters: {
    docs: {
      description: {
        story: 'Booking with service fees and cleaning charges added.',
      },
    },
  },
};

// With discount and fees
export const WithDiscountAndFees = {
  args: {
    priceBreakdown: {
      numberOfNights: 14,
      basePrice: 2100,
      nightlyRate: 150,
      discountAmount: 315,
      markupAmount: 150,
      totalPrice: 1935,
      pricePerNight: 138.21,
    },
    currency: 'USD',
  },
  parameters: {
    docs: {
      description: {
        story: 'Longer stay with 15% discount and cleaning fee.',
      },
    },
  },
};

// With 4-week rent display
export const WithFourWeekRent = {
  args: {
    priceBreakdown: {
      numberOfNights: 28,
      basePrice: 4200,
      nightlyRate: 150,
      discountAmount: 630,
      markupAmount: 0,
      totalPrice: 3570,
      pricePerNight: 127.50,
      fourWeekRent: 3570,
    },
    currency: 'USD',
  },
  parameters: {
    docs: {
      description: {
        story: 'Monthly stay showing 4-week equivalent rent.',
      },
    },
  },
};

// With initial payment
export const WithInitialPayment = {
  args: {
    priceBreakdown: {
      numberOfNights: 30,
      basePrice: 4500,
      nightlyRate: 150,
      discountAmount: 675,
      markupAmount: 200,
      totalPrice: 4025,
      pricePerNight: 134.17,
      fourWeekRent: 3743,
      initialPayment: 2012.50,
    },
    currency: 'USD',
  },
  parameters: {
    docs: {
      description: {
        story: 'Long-term stay with split payment showing initial deposit.',
      },
    },
  },
};

// Zero nights (should render nothing)
export const ZeroNights = {
  args: {
    priceBreakdown: {
      numberOfNights: 0,
      basePrice: 0,
      nightlyRate: 150,
      discountAmount: 0,
      markupAmount: 0,
      totalPrice: 0,
      pricePerNight: 0,
    },
    currency: 'USD',
  },
  parameters: {
    docs: {
      description: {
        story: 'When no nights are selected, component renders nothing.',
      },
    },
  },
};

// Premium listing
export const PremiumListing = {
  args: {
    priceBreakdown: {
      numberOfNights: 5,
      basePrice: 1750,
      nightlyRate: 350,
      discountAmount: 0,
      markupAmount: 200,
      totalPrice: 1950,
      pricePerNight: 390,
    },
    currency: 'USD',
  },
  parameters: {
    docs: {
      description: {
        story: 'High-end listing with premium nightly rate.',
      },
    },
  },
};

// Budget listing
export const BudgetListing = {
  args: {
    priceBreakdown: {
      numberOfNights: 4,
      basePrice: 200,
      nightlyRate: 50,
      discountAmount: 0,
      markupAmount: 25,
      totalPrice: 225,
      pricePerNight: 56.25,
    },
    currency: 'USD',
  },
  parameters: {
    docs: {
      description: {
        story: 'Budget-friendly listing with lower nightly rate.',
      },
    },
  },
};

// Different currency
export const EuroCurrency = {
  args: {
    priceBreakdown: {
      numberOfNights: 3,
      basePrice: 390,
      nightlyRate: 130,
      discountAmount: 0,
      markupAmount: 45,
      totalPrice: 435,
      pricePerNight: 145,
    },
    currency: 'EUR',
  },
  parameters: {
    docs: {
      description: {
        story: 'Price display using Euro currency formatting.',
      },
    },
  },
};

// Complete example with all fields
export const CompleteBreakdown = {
  args: {
    priceBreakdown: {
      numberOfNights: 21,
      basePrice: 3150,
      nightlyRate: 150,
      discountAmount: 472.50,
      markupAmount: 175,
      totalPrice: 2852.50,
      pricePerNight: 135.83,
      fourWeekRent: 3800,
      initialPayment: 1426.25,
    },
    currency: 'USD',
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete breakdown with all pricing fields populated.',
      },
    },
  },
};

// Comparison view
export const ComparisonView = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1', minWidth: '280px' }}>
        <h4 style={{ marginBottom: '12px', color: '#374151' }}>Weekend Stay</h4>
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 2,
            basePrice: 300,
            nightlyRate: 150,
            discountAmount: 0,
            markupAmount: 30,
            totalPrice: 330,
            pricePerNight: 165,
          }}
          currency="USD"
        />
      </div>
      <div style={{ flex: '1', minWidth: '280px' }}>
        <h4 style={{ marginBottom: '12px', color: '#374151' }}>Week Stay (10% off)</h4>
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 7,
            basePrice: 1050,
            nightlyRate: 150,
            discountAmount: 105,
            markupAmount: 50,
            totalPrice: 995,
            pricePerNight: 142.14,
          }}
          currency="USD"
        />
      </div>
      <div style={{ flex: '1', minWidth: '280px' }}>
        <h4 style={{ marginBottom: '12px', color: '#374151' }}>Month Stay (20% off)</h4>
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 28,
            basePrice: 4200,
            nightlyRate: 150,
            discountAmount: 840,
            markupAmount: 100,
            totalPrice: 3460,
            pricePerNight: 123.57,
            fourWeekRent: 3460,
          }}
          currency="USD"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of different stay lengths showing volume discounts.',
      },
    },
  },
};
