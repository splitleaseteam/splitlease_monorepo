/**
 * Z-Sharath Test Page Entry Point
 *
 * Internal test page for dev utilities.
 * Route: /_internal/z-sharath-test
 * Auth: None (internal test page)
 */

import { createRoot } from 'react-dom/client';
import ZSharathTestPage from './islands/pages/ZSharathTestPage/ZSharathTestPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<ZSharathTestPage />);
