\# z-alerts-test \- COMPREHENSIVE REQUIREMENTS DOCUMENT  
\*\*Bubble to Code Migration Specification\*\*  
\*\*Page: z-alerts-test\*\*

\---

\#\# 1\. PAGE OVERVIEW & PURPOSE

\*\*PAGE NAME:\*\* z-alerts-test  
\*\*PRIMARY FUNCTION:\*\* Internal utility page to test, preview, and refine different alert and toast notification styles and behaviors used across the Split Lease app.

\*\*KEY CAPABILITIES:\*\*  
\- Provides controls for triggering success, error, warning, and informational alerts  
\- Tests both native Bubble Alert elements and custom toast notification system  
\- Exposes reusable custom event "Alerts general" that can be triggered from other pages  
\- Includes version-test-only button for testing production vs development environments  
\- Tests "No Alert Type" scenario

\---

\#\# 2\. PAGE CONFIGURATION

\*\*DIMENSIONS:\*\*  
\- Width: 1200 px (fixed desktop layout)  
\- Height: Dynamic, vertical scroll allowed  
\- Fixed-width: Yes

\*\*PAGE SETTINGS:\*\*  
\- Native app: No  
\- Background: Light gray or white (to contrast colored alerts)  
\- Opacity: 100%

\---

\#\# 3\. ELEMENT HIERARCHY

\#\#\# Page: z-alerts-test

\#\#\#\# Layers Structure:  
1\. \*\*Button Success\*\* (green background)  
   \- Color: Green (\#4CAF50 or similar)  
   \- Text: "Success"  
   \- Purpose: Trigger success alert

2\. \*\*Button Information\*\* (blue background)  
   \- Color: Blue (\#2196F3 or similar)  
   \- Text: "Information"  
   \- Purpose: Trigger info alert

3\. \*\*Button Warning\*\* (orange/yellow background)  
   \- Color: Orange/Yellow (\#FFC107 or similar)  
   \- Text: "Warning"  
   \- Purpose: Trigger warning alert

4\. \*\*Button Error\*\* (red background)  
   \- Color: Red (\#F44336 or similar)  
   \- Text: "Error"  
   \- Purpose: Trigger error alert

5\. \*\*Button No Alert Type\*\* (white with border)  
   \- Color: White background with border  
   \- Text: "No Alert Type"  
   \- Purpose: Test alert without specific type

6\. \*\*Button version-test only\*\* (purple background)  
   \- Color: Purple/Dark purple  
   \- Text: "version-test only"  
   \- Purpose: Test alerts in development environment only

\*\*Layout:\*\* All buttons are stacked vertically with consistent spacing.

\---

\#\# 4\. WORKFLOWS & EVENT HANDLERS

\*\*TOTAL WORKFLOWS:\*\* 8

\#\#\# Custom Event: Alerts general  
\- \*\*Type:\*\* Custom Event (reusable across the app)  
\- \*\*Trigger:\*\* Can be triggered from any workflow  
\- \*\*Parameters:\*\*  
  \- \*\*title\*\* (text, required): Alert title  
  \- \*\*content\*\* (text, optional): Alert body message  
  \- \*\*time (ms)\*\* (number, optional): Duration in milliseconds  
  \- \*\*alert type\*\* (Alert Type, optional): Type of alert (success, error, warning, info)  
  \- \*\*Show on Live?\*\* (yes/no, optional): Whether to show in production

\- \*\*Actions:\*\*  
  \- Step 1: Custom Toast (Only when alert type is not empty and alert type is Live? is yes)  
  \- Step 2: Custom Toast (conditional)  
  \- Step 3: Custom Toast (conditional)  
  \- Step 4: Custom Toast (conditional)  
  \- Step 5: Custom Toast (conditional)  
  \- Step 6: Custom Toast Version-Test ONLY (Only when Isn't live version is yes and Show on Live?:formatted as number is 0\)

\#\#\# Workflow 1: Button Success is clicked  
\- \*\*Trigger:\*\* Button "Success" is clicked  
\- \*\*Actions:\*\*  
  \- Trigger custom event "Alerts general"  
  \- Pass parameters: title="Success", alert type=success

\#\#\# Workflow 2: Button Information is clicked  
\- \*\*Trigger:\*\* Button "Information" is clicked  
\- \*\*Actions:\*\*  
  \- Trigger custom event "Alerts general"  
  \- Pass parameters: title="Information", alert type=info

\#\#\# Workflow 3: Button Warning is clicked  
\- \*\*Trigger:\*\* Button "Warning" is clicked  
\- \*\*Actions:\*\*  
  \- Trigger custom event "Alerts general"  
  \- Pass parameters: title="Warning", alert type=warning

\#\#\# Workflow 4: Button Error is clicked  
\- \*\*Trigger:\*\* Button "Error" is clicked  
\- \*\*Actions:\*\*  
  \- Trigger custom event "Alerts general"  
  \- Pass parameters: title="Error", alert type=error

\#\#\# Workflow 5: Button No Alert Type is clicked  
\- \*\*Trigger:\*\* Button "No Alert Type" is clicked  
\- \*\*Actions:\*\*  
  \- Trigger custom event "Alerts general"  
  \- Pass parameters: title="No Alert Type", alert type=empty

\#\#\# Workflow 6: Button version-test only is clicked  
\- \*\*Trigger:\*\* Button "version-test only" is clicked  
\- \*\*Actions:\*\*  
  \- Trigger custom event "Alerts general"  
  \- Pass parameters: title="Version Test", Show on Live?=no  
  \- Only shows in development/test environment

\#\#\# Workflow: Alerts general old (DISABLED)  
\- \*\*Status:\*\* Disabled  
\- \*\*Note:\*\* Previous version of the custom event, kept for reference

\---

\#\# 5\. DATA SOURCES & EXPRESSIONS

\#\#\# Static Data:  
\- Button labels are static text  
\- Alert types defined in option set or data type "Alert Type"  
\- Default alert parameters (title, content, timing)

\#\#\# Dynamic Expressions:  
\- Environment detection ("Isn't live version is yes")  
\- "Show on Live?:formatted as number" comparison  
\- Alert type conditionals for styling

\#\#\# Persistent Data:  
\- No database searches or persistent storage  
\- All alerts are ephemeral  
\- Optional: Could log alert history for debugging

\---

\#\# 6\. CONDITIONALS

\#\#\# Workflow Conditionals:  
1\. \*\*Custom Toast display conditions:\*\*  
   \- "Only when alert type is not empty"  
   \- "Only when alert type is Live? is yes"  
   \- "Only when Isn't live version is yes and Show on Live?:formatted as number is 0"

2\. \*\*Environment-specific alerts:\*\*  
   \- Version-test toast only shows when not in live/production mode  
   \- Standard toasts show based on "Show on Live?" parameter

\#\#\# Element Conditionals (if any):  
\- Button states (hover, active)  
\- Alert visibility based on trigger

\---

\#\# 7\. TECHNICAL NOTES & MIGRATION RECOMMENDATIONS

\#\#\# Alert System Architecture:  
\- \*\*Centralize alert logic\*\* in the "Alerts general" custom event  
\- Implement a shared notification service that mirrors this custom event structure  
\- All other pages should call this central alert system rather than creating alerts directly

\#\#\# Toast Plugin:  
\- The page uses a "Custom Toast" plugin/action (likely a Bubble plugin)  
\- Identify the specific toast plugin used (e.g., "Toastify", "Air Toast", or custom implementation)  
\- Document all toast parameters: position, duration, styling, animations

\#\#\# Environment Detection:  
\- \*\*"Isn't live version"\*\* check must be replicated in new codebase  
\- Implement environment variable or build flag: \`IS\_PRODUCTION\`, \`IS\_STAGING\`, \`IS\_DEV\`  
\- "Show on Live?" parameter controls production visibility

\#\#\# Alert Types:  
\- Define AlertType enum: SUCCESS, ERROR, WARNING, INFO, NONE  
\- Each type has associated styling (colors, icons)  
\- Map option set values to new enum

\#\#\# Reusability:  
\- The "Alerts general" custom event is critical infrastructure  
\- Other pages likely depend on this event  
\- Maintain exact parameter signature during migration  
\- Consider creating TypeScript interface for alert parameters

\#\#\# Testing Requirements:  
1\. \*\*Functional tests:\*\*  
   \- Click each button → Verify correct alert appears  
   \- Test with/without optional parameters  
   \- Test in different environments (dev, staging, prod)

2\. \*\*Visual tests:\*\*  
   \- Verify colors match design system  
   \- Test alert positioning  
   \- Test multiple simultaneous alerts  
   \- Test alert dismissal

3\. \*\*Environment tests:\*\*  
   \- "version-test only" should ONLY appear in non-production  
   \- "Show on Live?=no" alerts should not appear in production

\#\#\# Migration Checklist:  
\- \[ \] Identify toast plugin and document API  
\- \[ \] Create central notification service  
\- \[ \] Define AlertType enum/type  
\- \[ \] Implement environment detection  
\- \[ \] Map all alert styling (colors, fonts, sizes)  
\- \[ \] Test each alert type  
\- \[ \] Test environment-specific behavior  
\- \[ \] Document usage for other developers  
\- \[ \] Create unit tests for notification service  
\- \[ \] Ensure accessibility (ARIA labels, keyboard navigation)

\---

\#\# 8\. ADDITIONAL OBSERVATIONS

\#\#\# Design System Integration:  
\- Alert colors should match global design system  
\- Consider creating alert component library  
\- Standardize spacing, typography, iconography

\#\#\# User Experience:  
\- Auto-dismiss after duration  
\- Manual dismiss option (X button)  
\- Stack multiple alerts if needed  
\- Prevent alert spam (rate limiting)

\#\#\# Accessibility:  
\- ARIA role="alert" for screen readers  
\- Keyboard dismissal (Escape key)  
\- Sufficient color contrast  
\- Icon \+ text (not icon-only)

\#\#\# Performance:  
\- Limit max concurrent alerts (e.g., 5\)  
\- Queue excessive alerts  
\- Animate efficiently (CSS transforms)

\#\#\# Future Enhancements:  
\- Add alert history/log viewer  
\- Add custom alert sounds  
\- Add desktop notifications integration  
\- Add action buttons in alerts (e.g., "Undo")  
\- Add alert templates for common scenarios

\---

\*\*Document Version:\*\* 1.0  
\*\*Last Updated:\*\* January 26, 2026  
\*\*Status:\*\* Ready for Migration  
