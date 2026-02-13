import React from 'react';
import { createRoot } from 'react-dom/client';
import CreateDocumentPage from './islands/pages/CreateDocumentPage/CreateDocumentPage.jsx';
import { ToastProvider } from './islands/shared/Toast.jsx';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';
import './styles/main.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <CreateDocumentPage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
