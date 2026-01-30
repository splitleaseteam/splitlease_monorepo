/**
 * Pricing Unit Test Page Entry Point
 *
 * Internal test page for pricing engine validation.
 * Tests pricing calculations across different configurations.
 *
 * Route: /_pricing-unit-test
 * Auth: None (internal test page)
 */

import { createRoot } from 'react-dom/client';
import ZPricingUnitTestPage from './islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<ZPricingUnitTestPage />);
