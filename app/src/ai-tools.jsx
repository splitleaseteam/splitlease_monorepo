/**
 * AI Tools Page Entry Point
 * Split Lease - Islands Architecture
 *
 * Admin-only page for HeyGen deepfake generation, ElevenLabs narration,
 * and jingle creation workflows.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import AiToolsPage from './islands/pages/AiToolsPage';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AiToolsPage />
    </ErrorBoundary>
  </React.StrictMode>
);
