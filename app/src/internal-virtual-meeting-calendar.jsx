/**
 * Internal Virtual Meeting Calendar Page Entry Point
 * Split Lease - Calendar Automation Dashboard
 *
 * Mounts InternalVirtualMeetingCalendarPage component to DOM
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import InternalVirtualMeetingCalendarPage from './islands/pages/InternalVirtualMeetingCalendarPage/InternalVirtualMeetingCalendarPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<InternalVirtualMeetingCalendarPage />);
