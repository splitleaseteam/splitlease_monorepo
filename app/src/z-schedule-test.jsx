/**
 * Z-Schedule Test Page Entry Point
 *
 * Internal test page for schedule selector validation.
 * Route: /_internal/z-schedule-test
 * Auth: None (internal test page)
 */

import { createRoot } from 'react-dom/client';
import ZScheduleTestPage from './islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<ZScheduleTestPage />);
