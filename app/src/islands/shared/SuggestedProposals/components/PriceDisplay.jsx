/**
 * PriceDisplay
 *
 * Shows nightly price and total price for the reservation.
 */

import { formatCurrency as formatPrice } from '../../../../lib/formatters.js';

/**
 * @param {Object} props
 * @param {number} props.nightlyPrice - Price per night
 * @param {number} props.totalPrice - Total reservation price
 */
export default function PriceDisplay({ nightlyPrice, totalPrice }) {
  return (
    <div className="sp-pricing">
      <div className="sp-pricing-row">
        <span className="sp-pricing-label">Nightly Rate</span>
        <span className="sp-pricing-value">{formatPrice(nightlyPrice)}</span>
      </div>
      <div className="sp-pricing-row sp-pricing-row--total">
        <span className="sp-pricing-label">Total</span>
        <span className="sp-pricing-value sp-pricing-value--total">
          {formatPrice(totalPrice)}
        </span>
      </div>
    </div>
  );
}
