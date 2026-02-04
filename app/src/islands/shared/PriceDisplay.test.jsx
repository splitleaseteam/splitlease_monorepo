import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceDisplay } from './PriceDisplay.jsx';

describe('PriceDisplay Component', () => {
  // ========================================
  // RENDERING TESTS
  // ========================================
  describe('Rendering', () => {
    it('renders nothing when numberOfNights is 0', () => {
      const { container } = render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 0,
            basePrice: 100,
            nightlyRate: 50,
            totalPrice: 100,
            pricePerNight: 50
          }}
        />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders price breakdown when numberOfNights is greater than 0', () => {
      render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 2,
            basePrice: 100,
            nightlyRate: 50,
            totalPrice: 100,
            pricePerNight: 50
          }}
        />
      );
      expect(screen.getByText('Price Breakdown')).toBeInTheDocument();
    });

    it('renders all required price rows', () => {
      render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 3,
            basePrice: 150,
            nightlyRate: 50,
            totalPrice: 150,
            pricePerNight: 50
          }}
        />
      );

      expect(screen.getByText(/Base Price.*3 nights/)).toBeInTheDocument();
      expect(screen.getByText('Nightly Rate:')).toBeInTheDocument();
      expect(screen.getByText('Total Price:')).toBeInTheDocument();
      expect(screen.getByText('Per Night:')).toBeInTheDocument();
    });
  });

  // ========================================
  // PRICE FORMATTING TESTS
  // ========================================
  describe('Price Formatting', () => {
    it('formats prices in USD currency by default', () => {
      render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 1234.56,
            nightlyRate: 1234.56,
            totalPrice: 1234.56,
            pricePerNight: 1234.56
          }}
        />
      );
      // USD format should include $ and commas
      expect(screen.getAllByText(/\$1,234\.56/)).toHaveLength(4);
    });

    it('formats prices in EUR currency when specified', () => {
      render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 100,
            nightlyRate: 100,
            totalPrice: 100,
            pricePerNight: 100
          }}
          currency="EUR"
        />
      );
      // EUR format - use regex to match the currency symbol
      expect(screen.getAllByText(/€100\.00/)).toHaveLength(4);
    });

    it('handles zero prices correctly', () => {
      render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 0,
            nightlyRate: 0,
            totalPrice: 0,
            pricePerNight: 0
          }}
        />
      );
      expect(screen.getAllByText('$0.00')).toHaveLength(4);
    });

    it('handles large numbers correctly', () => {
      render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 999999.99,
            nightlyRate: 999999.99,
            totalPrice: 999999.99,
            pricePerNight: 999999.99
          }}
        />
      );
      expect(screen.getAllByText('$999,999.99')).toHaveLength(4);
    });

    it('rounds decimal prices correctly', () => {
      render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 99.999,
            nightlyRate: 99.999,
            totalPrice: 99.999,
            pricePerNight: 99.999
          }}
        />
      );
      // Intl.NumberFormat should round to 2 decimal places
      expect(screen.getAllByText('$100.00')).toHaveLength(4);
    });
  });

  // ========================================
  // CONDITIONAL ROWS TESTS
  // ========================================
  describe('Conditional Rows', () => {
    describe('Discount Amount', () => {
      it('shows discount row when discountAmount is greater than 0', () => {
        render(
          <PriceDisplay
            priceBreakdown={{
              numberOfNights: 1,
              basePrice: 100,
              nightlyRate: 100,
              totalPrice: 90,
              pricePerNight: 90,
              discountAmount: 10
            }}
          />
        );
        expect(screen.getByText('Discounts:')).toBeInTheDocument();
        expect(screen.getByText('-$10.00')).toBeInTheDocument();
      });

      it('does not show discount row when discountAmount is 0', () => {
        render(
          <PriceDisplay
            priceBreakdown={{
              numberOfNights: 1,
              basePrice: 100,
              nightlyRate: 100,
              totalPrice: 100,
              pricePerNight: 100,
              discountAmount: 0
            }}
          />
        );
        expect(screen.queryByText('Discounts:')).not.toBeInTheDocument();
      });

      it('does not show discount row when discountAmount is undefined', () => {
        render(
          <PriceDisplay
            priceBreakdown={{
              numberOfNights: 1,
              basePrice: 100,
              nightlyRate: 100,
              totalPrice: 100,
              pricePerNight: 100
            }}
          />
        );
        expect(screen.queryByText('Discounts:')).not.toBeInTheDocument();
      });
    });

    describe('Markup Amount', () => {
      it('shows markup row when markupAmount is greater than 0', () => {
        render(
          <PriceDisplay
            priceBreakdown={{
              numberOfNights: 1,
              basePrice: 100,
              nightlyRate: 100,
              totalPrice: 115,
              pricePerNight: 115,
              markupAmount: 15
            }}
          />
        );
        expect(screen.getByText('Fees & Markups:')).toBeInTheDocument();
        expect(screen.getByText('+$15.00')).toBeInTheDocument();
      });

      it('does not show markup row when markupAmount is 0', () => {
        render(
          <PriceDisplay
            priceBreakdown={{
              numberOfNights: 1,
              basePrice: 100,
              nightlyRate: 100,
              totalPrice: 100,
              pricePerNight: 100,
              markupAmount: 0
            }}
          />
        );
        expect(screen.queryByText('Fees & Markups:')).not.toBeInTheDocument();
      });
    });

    describe('Four Week Rent', () => {
      it('shows 4-week rent row when fourWeekRent is greater than 0', () => {
        render(
          <PriceDisplay
            priceBreakdown={{
              numberOfNights: 28,
              basePrice: 1400,
              nightlyRate: 50,
              totalPrice: 1400,
              pricePerNight: 50,
              fourWeekRent: 1400
            }}
          />
        );
        expect(screen.getByText('4-Week Rent:')).toBeInTheDocument();
        // Use getAllByText since the same price may appear multiple times
        expect(screen.getAllByText('$1,400.00').length).toBeGreaterThan(0);
      });

      it('does not show 4-week rent row when fourWeekRent is 0', () => {
        render(
          <PriceDisplay
            priceBreakdown={{
              numberOfNights: 1,
              basePrice: 100,
              nightlyRate: 100,
              totalPrice: 100,
              pricePerNight: 100,
              fourWeekRent: 0
            }}
          />
        );
        expect(screen.queryByText('4-Week Rent:')).not.toBeInTheDocument();
      });

      it('does not show 4-week rent row when fourWeekRent is undefined', () => {
        render(
          <PriceDisplay
            priceBreakdown={{
              numberOfNights: 1,
              basePrice: 100,
              nightlyRate: 100,
              totalPrice: 100,
              pricePerNight: 100
            }}
          />
        );
        expect(screen.queryByText('4-Week Rent:')).not.toBeInTheDocument();
      });
    });

    describe('Initial Payment', () => {
      it('shows initial payment row when initialPayment is greater than 0', () => {
        render(
          <PriceDisplay
            priceBreakdown={{
              numberOfNights: 1,
              basePrice: 100,
              nightlyRate: 100,
              totalPrice: 100,
              pricePerNight: 100,
              initialPayment: 250
            }}
          />
        );
        expect(screen.getByText('Initial Payment:')).toBeInTheDocument();
        expect(screen.getByText('$250.00')).toBeInTheDocument();
      });

      it('does not show initial payment row when initialPayment is 0', () => {
        render(
          <PriceDisplay
            priceBreakdown={{
              numberOfNights: 1,
              basePrice: 100,
              nightlyRate: 100,
              totalPrice: 100,
              pricePerNight: 100,
              initialPayment: 0
            }}
          />
        );
        expect(screen.queryByText('Initial Payment:')).not.toBeInTheDocument();
      });
    });
  });

  // ========================================
  // CSS CLASS TESTS
  // ========================================
  describe('CSS Classes', () => {
    it('applies price-display class to container', () => {
      const { container } = render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 100,
            nightlyRate: 100,
            totalPrice: 100,
            pricePerNight: 100
          }}
        />
      );
      expect(container.querySelector('.price-display')).toBeInTheDocument();
    });

    it('applies correct class to price rows', () => {
      const { container } = render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 100,
            nightlyRate: 100,
            totalPrice: 100,
            pricePerNight: 100
          }}
        />
      );
      expect(container.querySelectorAll('.price-row')).toHaveLength(4);
    });

    it('applies total class to total price row', () => {
      const { container } = render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 100,
            nightlyRate: 100,
            totalPrice: 100,
            pricePerNight: 100
          }}
        />
      );
      expect(container.querySelector('.price-row.total')).toBeInTheDocument();
    });

    it('applies discount class to discount row', () => {
      const { container } = render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 100,
            nightlyRate: 100,
            totalPrice: 90,
            pricePerNight: 90,
            discountAmount: 10
          }}
        />
      );
      expect(container.querySelector('.price-row.discount')).toBeInTheDocument();
    });

    it('applies markup class to markup row', () => {
      const { container } = render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 100,
            nightlyRate: 100,
            totalPrice: 110,
            pricePerNight: 110,
            markupAmount: 10
          }}
        />
      );
      expect(container.querySelector('.price-row.markup')).toBeInTheDocument();
    });

    it('applies initial-payment class to initial payment row', () => {
      const { container } = render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 100,
            nightlyRate: 100,
            totalPrice: 100,
            pricePerNight: 100,
            initialPayment: 50
          }}
        />
      );
      expect(container.querySelector('.price-row.initial-payment')).toBeInTheDocument();
    });

    it('applies per-night class to per night row', () => {
      const { container } = render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 100,
            nightlyRate: 100,
            totalPrice: 100,
            pricePerNight: 100
          }}
        />
      );
      expect(container.querySelector('.price-row.per-night')).toBeInTheDocument();
    });
  });

  // ========================================
  // COMPLETE BREAKDOWN TESTS
  // ========================================
  describe('Complete Price Breakdown', () => {
    it('displays complete breakdown with all optional fields', () => {
      render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 7,
            basePrice: 700,
            nightlyRate: 100,
            discountAmount: 70,
            markupAmount: 35,
            totalPrice: 665,
            pricePerNight: 95,
            fourWeekRent: 2660,
            initialPayment: 332.50
          }}
        />
      );

      expect(screen.getByText('Price Breakdown')).toBeInTheDocument();
      expect(screen.getByText(/Base Price.*7 nights/)).toBeInTheDocument();
      expect(screen.getByText('$700.00')).toBeInTheDocument();
      expect(screen.getByText('Nightly Rate:')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('Discounts:')).toBeInTheDocument();
      expect(screen.getByText('-$70.00')).toBeInTheDocument();
      expect(screen.getByText('Fees & Markups:')).toBeInTheDocument();
      expect(screen.getByText('+$35.00')).toBeInTheDocument();
      expect(screen.getByText('Total Price:')).toBeInTheDocument();
      expect(screen.getByText('$665.00')).toBeInTheDocument();
      expect(screen.getByText('Per Night:')).toBeInTheDocument();
      expect(screen.getByText('$95.00')).toBeInTheDocument();
      expect(screen.getByText('4-Week Rent:')).toBeInTheDocument();
      expect(screen.getByText('$2,660.00')).toBeInTheDocument();
      expect(screen.getByText('Initial Payment:')).toBeInTheDocument();
      expect(screen.getByText('$332.50')).toBeInTheDocument();
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    it('handles negative values (refunds)', () => {
      render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: -50,
            nightlyRate: -50,
            totalPrice: -50,
            pricePerNight: -50
          }}
        />
      );
      // Negative values should still display with formatting
      expect(screen.getAllByText('-$50.00')).toHaveLength(4);
    });

    it('handles very small decimal values', () => {
      render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 0.01,
            nightlyRate: 0.01,
            totalPrice: 0.01,
            pricePerNight: 0.01
          }}
        />
      );
      expect(screen.getAllByText('$0.01')).toHaveLength(4);
    });

    it('handles single night correctly', () => {
      render(
        <PriceDisplay
          priceBreakdown={{
            numberOfNights: 1,
            basePrice: 100,
            nightlyRate: 100,
            totalPrice: 100,
            pricePerNight: 100
          }}
        />
      );
      expect(screen.getByText(/Base Price.*1 nights/)).toBeInTheDocument();
    });
  });
});
