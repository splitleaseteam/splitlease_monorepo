/**
 * Z-Unit Payment Records JS Test Page Entry Point
 *
 * Internal test page for payment records management and validation.
 * Compares JavaScript-calculated vs. Bubble native payment schedules.
 *
 * Route: /_internal/z-unit-payment-records-js
 * Auth: None (internal test page)
 */

import { createRoot } from 'react-dom/client';
import ZUnitPaymentRecordsJsPage from './islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<ZUnitPaymentRecordsJsPage />);
