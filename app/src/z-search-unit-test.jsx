/**
 * Z-Search Unit Test Page Entry Point
 *
 * Internal test page for search algorithm validation.
 * Tests listing filtering by geography, availability, and attributes.
 *
 * Route: /_internal/z-search-unit-test
 * Auth: None (internal test page)
 */

import { createRoot } from 'react-dom/client';
import ZSearchUnitTestPage from './islands/pages/ZSearchUnitTestPage/ZSearchUnitTestPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<ZSearchUnitTestPage />);
