/**
 * Z-Unit ChatGPT Models Test Page Entry Point
 *
 * Internal test page for comparing multiple ChatGPT models.
 * Tests different models with freeform prompts and image parsing.
 *
 * Route: /_internal/z-unit-chatgpt-models
 * Auth: None (internal test page)
 */

import { createRoot } from 'react-dom/client';
import ZUnitChatgptModelsPage from './islands/pages/ZUnitChatgptModelsPage/ZUnitChatgptModelsPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<ZUnitChatgptModelsPage />);
