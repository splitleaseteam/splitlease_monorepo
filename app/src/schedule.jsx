/**
 * Schedule Dashboard Entry Point
 *
 * Islands Architecture: Independent React root for schedule management.
 * Route: /schedule/:leaseId
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ScheduleDashboard from './islands/pages/ScheduleDashboard/index.jsx';
import './styles/main.css';
import './styles/components/schedule-dashboard.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ScheduleDashboard />
  </React.StrictMode>
);
