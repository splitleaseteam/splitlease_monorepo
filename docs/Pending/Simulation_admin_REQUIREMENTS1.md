BUBBLE IDE MIGRATION REQUIREMENTS DOCUMENT  
\_simulation-admin Page Specification

Document Overview  
This document comprehensively specifies the \_simulation-admin page from the Split Lease Bubble application. The page is designed as an admin/testing interface for managing usability testing sessions and simulating user scenarios.

\=== PAGE METADATA \===  
Page Name: \_simulation-admin  
Page Title: Simulation Admin  
App Type: Native App  
Environment: Production (Live)  
Debug Mode: Enabled  
Base URL: https://app.split.lease/\_simulation-admin?debug\_mode=true

\=== OVERALL PAGE PURPOSE \===  
The \_simulation-admin page serves as a testing/administrative interface with the following functions:  
1\. Select a specific User (from Usability testing accounts)  
2\. View detailed information about the selected user  
3\. Reset the user's usability progress  
4\. Advance the user to Day 2 of the testing sequence  
This page appears to be part of the Split Lease usability testing and QA workflow.

\=== PAGE STRUCTURE & VISUAL HIERARCHY \===

HEADER SECTION  
\- Reusable Element: \_Corporate Header A (floating overlay)  
  \- Type: Reusable component \- probably contains navigation  
  \- Positioning: Vertically float relative to Top, Horizontally float relative to Left  
  \- Floating zindex: Above elements  
  \- Dimensions: 1440px width x 129px height  
  \- Contains: Split Lease logo, Corporate Pages dropdown, Unit Tests dropdown, Change Prices button

MAIN CONTENT AREA  
\- Container: Group A  
  \- Type: Group container  
  \- Dimensions: 90% width, 300px \- infinite height  
  \- Background: \#FFFFFF (white)  
  \- Border: None with 0 roundness  
  \- Shadow: None  
  \- Position: Center of page

\=== DETAILED ELEMENT SPECIFICATIONS \===

1\. D: SELECT USABILITY ACCOUNT (Dropdown Input)

Element ID: D: Select Usability Account  
Element Type: Dropdown (Dynamic Choices)

Functionality:  
\- Type of Choices: User  
\- Choices Source: Search for Users  
\- This search dynamically queries the Users database  
\- Choice Display: Arbitrary text (configured to show user information)  
\- Placeholder Text: "Select Usability Account"

Conditional Logic (3 conditions):  
  Condition 1: When "This Dropdown is focused"  
    \- Property: Border color \- all borders  
    \- Value: \#52ABEC (light blue)  
    \- Effect: Blue highlight when focused

  Condition 2: When "This Dropdown isn't valid"  
    \- Property: Border color \- all borders  
    \- Value: \#FF0000 (red)  
    \- Effect: Red error border when invalid selection

  Condition 3: When "Get tester from page URL is not empty"  
    \- Property: Default value  
    \- Value: "Search for Users/tester Item"  
    \- Effect: Auto-populates dropdown if URL parameter exists

APPearance Settings:  
\- Enable auto-binding on parent element's thing: Enabled  
\- Placeholder: "Select Usability Account"  
\- Font: App Font (Lato), 14px, weight 400  
\- Font Color: \#252525  
\- Placeholder Color: \#9C9C0C

Data Binding:  
\- The dropdown searches the Users database  
\- Returns User records with properties for display

2\. TEXT A (Dynamic Information Display)

Element ID: Text A  
Element Type: Text element with dynamic data binding

Content Expression (Complex Multi-line):  
The text displays dynamic information about the selected dropdown choice:  
  Line 1: "D: Select Usability Account's value's AI Credits,"  
  Line 2: "Name: D: Select Usability Account's value's Name \- First,"  
  Line 3: "Tester Type: Current User's Type \- User Current's Display,"  
  Line 4: "Usability Step: Current User's Usability Step"

Data Bindings Explained:  
\- Accesses the selected User record from the D dropdown  
\- Displays user's AI Credits field  
\- Displays user's Name (First name specifically)  
\- Shows current user's Tester Type with display formatting  
\- Shows current user's Usability Step field

Styling:  
\- Paragraph Style: Black 14 (Overridden from default)  
\- Font: Lato, 400 weight, 14px size  
\- Font Color: \#424242 (dark gray)  
\- Word Spacing: 0  
\- Line Spacing: 1.25 (1.25x multiplier)  
\- Letter Spacing: 0  
\- Center Text Vertically: Enabled  
\- Background Style: None  
\- Recognizes Links and Emails: Enabled  
\- HTML Tag: normal (SEO)  
\- This element is not clickable

Conditional Logic: None defined

Purpose: Acts as an information display showing the selected user's key attributes

3\. BUTTON RESET USABILITY (Primary Action Button)

Element ID: Button Reset Usability  
Element Type: Button with Label text

Button Label: "Reset Usability"  
Button Type: Label (displays text only)

Functionality:  
When clicked, this button triggers:  
\- A confirmation popup appears  
\- The popup asks user to confirm they want to reset the selected user's progress  
\- If confirmed, the system resets that user's usability testing progress to initial state

Styling:  
\- Background Style: Flat color  
\- Background Color: \#7F95EB (soft blue)  
\- Font: App Font (Lato), 14px, weight 400  
\- Font Color: \#FFFFFF (white text)  
\- Border: None with 3px roundness (subtle rounded corners)  
\- Opacity: 100%  
\- Word Spacing: 0  
\- Line Spacing: 1  
\- Letter Spacing: 0

Conditional Logic (2 conditions \- interactive states):  
  Hover Condition: When "This Button is hovered"  
    \- Property: Background color  
    \- Value: \#90A9E8 (lighter blue)  
    \- Effect: Lighten button on hover for visual feedback

  Pressed Condition: When "This Button is pressed"  
    \- Property: Background color  
    \- Value: \#6C7FEB (darker blue)  
    \- Effect: Darker blue when clicked/pressed

UX Behavior:  
\- Clickable: Yes  
\- Visual feedback on interaction through conditional colors  
\- Click handler: Likely triggers backend workflow "reset-usability" operation

4\. BUTTON START DAY 2 (Secondary Action Button)

Element ID: Button Start Day 2  
Element Type: Button with Label text  
Button Label: "Start Day 2"  
Button Type: Label (displays text only)

Functionality:  
When clicked, this button triggers:  
\- Advances the selected user's testing to Day 2  
\- Likely updates the user's Usability Step field to "Day 2" or equivalent  
\- May trigger backend workflows to update testing timeline

Styling:  
\- Identical styling to "Button Reset Usability"  
\- Background Color: \#7F95EB (soft blue)  
\- Font: Lato, 14px, weight 400, \#FFFFFF  
\- Border: None with 3px roundness  
\- Opacity: 100%

Conditional Logic:  
\- Same 2 hover/pressed conditions as Button Reset Usability  
\- Hover: \#90A9E8 (lighter blue)  
\- Pressed: \#6C7FEB (darker blue)

UX Note: Both buttons have identical visual appearance and behavior patterns,  
differentiating only by their function (reset vs. advance)

\=== MODAL POPUP: CONFIRMATION DIALOG \===

Element ID: Popup A  
Element Type: Popup (Modal Dialog)

Popup Behavior:  
\- Modal: Yes (blocks background interaction)  
\- Cannot be closed by pressing Escape key  
\- Appears when "Reset Usability" button is clicked  
\- Requires explicit user action via confirmation buttons

Styling:  
\- Style Preset: Popup \- Rounded 10 \- TO THIS (Overridden)  
\- Background Color: \#FFFFFF (white)  
\- Opacity: 100%  
\- Border: None with 10px roundness (rounded corners)  
\- Shadow Style: Outset (shadow below popup)  
\- Horizontal Offset: 0  
\- Vertical Offset: 50  
\- Blur Radius: 80  
\- Grayout Color: \#ABA9A9 (gray overlay)  
\- Grayout Blur: 0

Content Structure:  
\- Text Label: Confirmation message  
\- Group B: Contains two action buttons

Popup Content \- Text Label:  
Content: "Are you sure you want to reset D: Select Usability Account's value's Name \- First's Usability progress?"  
This is a dynamic message that includes the selected user's name

5\. GROUP B (Confirmation Button Container)

Element ID: Group B  
Element Type: Container Group

Purpose: Holds the two confirmation/action buttons in the popup

Layout:  
\- Horizontal arrangement of buttons  
\- Contains two buttons (noted with identical names, likely a naming issue)

Buttons in Group B:  
  a) Button Reset Day 1 (first button)  
     \- Label: "Reset Day 1"  
     \- Background: \#7F95EB (soft blue)  
     \- Function: Likely confirms the reset action  
     \- Styling: Matches main action buttons

  b) Button Reset Day 1 (second button)  
     \- Label: "Reset Day 1" (appears to be duplicate name)  
     \- Function: May serve as cancel/close or secondary action  
     \- NOTE: These appear to have the same name but should have different functions  
             Button 1: Confirm reset  
             Button 2: Cancel/Close popup

Standard Button Styling:  
\- Both buttons use same color scheme (\#7F95EB, hover: \#90A9E8, pressed: \#6C7FEB)  
\- Font: Lato, 14px, weight 400, \#FFFFFF  
\- Border: None with 3px roundness

\=== WORKFLOW ANALYSIS \===

Page-Level Workflows:  
The Workflow tab shows "ON THIS PAGE: 0" indicating NO page-level workflows defined.  
This means all event handling is likely through element properties (click handlers)  
rather than explicit workflow definitions.

Expected Click Handlers:  
1\. "Button Reset Usability" Click  
   \- Action: Show Popup A (modal confirmation dialog)  
   \- No other actions appear defined

2\. "Button Start Day 2" Click  
   \- Action: Likely calls a backend workflow to advance user to Day 2  
   \- May update the User's Usability Step field  
   \- May refresh the page or display success message

3\. Popup A Confirmation Buttons  
   \- First Button (Reset confirmation): Calls backend workflow to reset user progress  
   \- Second Button (Cancel): Closes the popup without action

\=== BACKEND WORKFLOWS OVERVIEW \===

This Bubble app has extensive backend workflows organized by category.  
For this page, the likely backend workflows involved are:

Possible Relevant Categories:  
1\. "Core \- User Management" (5 workflows)  
   \- May contain user update/reset operations

2\. "Data Management" (5 workflows)  
   \- May handle user data state updates

3\. "System" (15 workflows)  
   \- May contain utility operations for testing/simulation

KEY UNKNOWNS REQUIRING FURTHER INVESTIGATION:  
1\. What specific backend workflow is called by "Reset Usability" button?  
2\. What specific backend workflow is called by "Start Day 2" button?  
3\. What User fields are modified by these operations?  
4\. Are there any email notifications triggered?  
5\. What logging occurs for these admin actions?

\=== DATA STRUCTURES INVOLVED \===

User Database Type:  
The page interacts with the Users database type. Key fields referenced:  
\- Type (field name appears as "Type" with display format "User Current's Display")  
\- Name (specifically "Name \- First" for first name)  
\- AI Credits (numeric field tracking some resource)  
\- Usability Step (field tracking user's position in testing workflow)

Search Constraints:  
The dropdown performs a "Search for Users" which may have filters:  
\- May filter for users with specific role/type (e.g., Testers)  
\- May exclude certain users (e.g., already completed testing)

\=== RESPONSIVE DESIGN NOTES \===

The page structure uses:  
\- Main container: 90% width (responsive, scales with screen)  
\- Header: Fixed floating overlay (1440px x 129px)  
\- Layout appears mobile-responsive but limited to portrait orientation for native app

\=== COLOR SCHEME & VISUAL DESIGN \===

Color Palette:  
\- Primary Interactive: \#7F95EB (soft blue)  
\- Interactive Hover: \#90A9E8 (lighter blue)  
\- Interactive Active: \#6C7FEB (darker blue)  
\- Focus State: \#52ABEC (bright blue)  
\- Error State: \#FF0000 (red)  
\- Text Primary: \#252525 (very dark gray)  
\- Text Secondary: \#424242 (dark gray)  
\- Text Placeholder: \#9C9C0C (olive/tan)  
\- Background: \#FFFFFF (white)  
\- Modal Overlay: \#ABA9A9 (medium gray)

Font System:  
\- Primary Font: Lato (Open source, clean, readable)  
\- Sizes: 14px standard, 11px used in some contexts  
\- Weight: 400 (regular) standard

\=== IMPLEMENTATION RECOMMENDATIONS FOR CODE MIGRATION \===

1\. COMPONENT ARCHITECTURE  
   \- Create a UserSelector component (dropdown with search)  
   \- Create a ConfirmationModal component (reusable confirmation dialog)  
   \- Create an ActionButton component (with hover/pressed states)

2\. STATE MANAGEMENT  
   \- Track selected user state  
   \- Track popup visibility state  
   \- Track loading states for API calls

3\. API ENDPOINTS NEEDED  
   \- GET /api/users (with search) \- for dropdown population  
   \- GET /api/users/{userId} \- for detailed info display  
   \- POST /api/users/{userId}/reset-usability \- reset operation  
   \- POST /api/users/{userId}/advance-day \- day advancement  
   \- Likely needs authentication/authorization checks

4\. VALIDATION REQUIREMENTS  
   \- Dropdown must have selection before buttons become active  
   \- Confirmation required for destructive reset operation  
   \- Proper error handling for failed API calls

5\. FORM INPUT HANDLING  
   \- Dropdown change event triggers data refresh  
   \- Button clicks need proper event listeners  
   \- Modal buttons need proper close/confirm handlers

\=== STYLING FRAMEWORK SUGGESTIONS \===

For CSS-in-JS (e.g., styled-components, emotion):  
\- Create a color constants file  
\- Define button component variations (default, hover, active)  
\- Use consistent spacing system  
\- Implement focus states for accessibility

Accessibility Considerations:  
\- Ensure keyboard navigation works  
\- Add proper ARIA labels  
\- Ensure color contrast meets WCAG standards  
\- Modal should trap focus  
\- Escape key should close modal (though currently disabled in Bubble)

\=== DEBUGGING & TESTING NOTES \===

During preview testing at https://app.split.lease/\_simulation-admin?debug\_mode=true:  
\- Debug mode is enabled (visible in URL parameter)  
\- Page header loaded correctly with navigation  
\- Dropdown element loaded but appeared empty (no User options visible)  
\- Possible reasons:  
  1\. No users exist in the test database  
  2\. Search query has filters that exclude all users  
  3\. User must be authenticated with appropriate permissions  
  4\. Test data may need to be seeded before testing

The debugger at bottom of preview shows:  
\- "Debugger" controls with Normal/Slow/Step-by-step options  
\- "Inspect" button for element inspection  
\- This indicates development/testing mode is active

\=== OUTSTANDING QUESTIONS FOR FURTHER INVESTIGATION \===

These items could not be fully determined from design analysis alone:

1\. WORKFLOW INTEGRATIONS  
   ? Which specific backend workflow is executed by "Reset Usability" button click?  
   ? Which specific backend workflow is executed by "Start Day 2" button click?  
   ? Do these workflows send notifications (email, SMS, in-app)?  
   ? What error handling/rollback exists if workflows fail?

2\. DATA OPERATIONS  
   ? What User fields are actually modified by reset operation?  
   ? What is the exact definition of "Usability Step"?  
   ? Are there any related records that must be updated in cascade?  
   ? What is the history/audit trail for these admin actions?

3\. SECURITY & PERMISSIONS  
   ? Who has access to this admin page?  
   ? Are there any permission checks on the buttons?  
   ? Is the user's identity logged with these admin actions?  
   ? Are there rate limits on these operations?

4\. BUTTON HANDLERS  
   ? Why do the two popup buttons appear to have the same name "Reset Day 1"?  
   ? Should they have different names and functions?  
   ? What is the exact action of the second button (confirm vs cancel)?

5\. SEARCH PARAMETERS  
   ? What is "Get tester from page URL"? (referenced in dropdown conditional)  
   ? Does this page accept URL parameters for pre-selection?  
   ? What format should the parameter be?

6\. STYLING EDGE CASES  
   ? How does the layout respond on very small screens?  
   ? How does the layout respond on very large screens?  
   ? Are there any mobile-specific considerations?  
   ? What happens on touch devices with hover states?

\=== DOCUMENT VERSION \===  
Created: 2026-01-13  
Analyzed Bubble App Version: Live (Production)  
Page Name: \_simulation-admin  
Bubble IDE: Standard Web Version

\=== NEXT STEPS FOR MIGRATION \===

1\. Access button click handler configurations in Bubble editor  
   \- Check "Reset Usability" button's click action  
   \- Check "Start Day 2" button's click action  
   \- Check popup buttons' click actions

2\. Examine backend workflow implementations  
   \- Open "Core \- User Management" workflows  
   \- Look for workflows named with "reset" or "usability"  
   \- Look for workflows named with "day" or "advance"

3\. Review database schema  
   \- Document all User type fields  
   \- Document any related database tables  
   \- Understand Usability Step field structure

4\. Test with actual data  
   \- Seed test users into database  
   \- Verify dropdown population works  
   \- Test full workflow: select user → view info → reset/advance  
   \- Test confirmation dialog flow  
   \- Test error scenarios

5\. Documentation of unclear elements  
   \- The duplicate button name "Reset Day 1" needs clarification  
   \- Confirm what "Reset Usability" actually resets  
   \- Confirm what "Start Day 2" actually advances

\=== COMPREHENSIVE SUMMARY \===

PAGE PURPOSE:  
The \_simulation-admin page is an internal admin/testing interface for the Split Lease application, specifically designed to manage usability testing scenarios. It allows administrators to:  
1\. Search and select specific test user accounts  
2\. View key user attributes (AI Credits, Name, Type, Usability Step)  
3\. Reset a user's progress (with confirmation)  
4\. Advance a user to the next testing phase (Day 2\)

PRIMARY USE CASE:  
Usability testing and QA staff can use this page to:  
\- Manage test user states during ongoing usability studies  
\- Reset users who need to restart the testing flow  
\- Progress users through testing phases for workflow validation  
\- View user testing status at a glance

ARCHITECTURE OVERVIEW:  
\- Simple, focused single-page interface  
\- No client-side workflows (0 page-level workflows)  
\- All complex logic deferred to backend workflows  
\- Responsive layout using percentage-based widths  
\- Modal confirmation for destructive operations

KEY ELEMENTS SUMMARY TABLE:  
┌─────────────────────┬──────────────────┬─────────────────────────┐  
│ Element             │ Type             │ Function                │  
├─────────────────────┼──────────────────┼─────────────────────────┤  
│ D: Select Usability │ Dropdown Search  │ User selection with     │  
│ Account             │                  │ database query          │  
├─────────────────────┼──────────────────┼─────────────────────────┤  
│ Text A              │ Dynamic Text     │ Display selected user   │  
│                     │                  │ information             │  
├─────────────────────┼──────────────────┼─────────────────────────┤  
│ Button Reset        │ Action Button    │ Trigger reset workflow  │  
│ Usability           │                  │ with confirmation       │  
├─────────────────────┼──────────────────┼─────────────────────────┤  
│ Button Start Day 2  │ Action Button    │ Advance user to Day 2   │  
├─────────────────────┼──────────────────┼─────────────────────────┤  
│ Popup A             │ Modal Dialog     │ Confirmation prompt     │  
│                     │                  │ for reset action        │  
├─────────────────────┼──────────────────┼─────────────────────────┤  
│ Group B             │ Button Container │ Holds confirmation      │  
│                     │                  │ action buttons          │  
└─────────────────────┴──────────────────┴─────────────────────────┘

CRITICAL MIGRATION POINTS:  
1\. Dropdown search functionality must query Users database  
2\. Dynamic text binding must access related User fields  
3\. Modal popup must block background interaction  
4\. Button click handlers must execute backend workflows  
5\. All styling must match the color palette and typography

EXPECTED BEHAVIOR FLOW:  
  User opens page  
       ↓  
  User clicks dropdown  
       ↓  
  Dropdown loads Users from search  
       ↓  
  User selects a user  
       ↓  
  Text A updates with selected user's info  
       ↓  
  User clicks "Reset Usability" or "Start Day 2"  
       ↓  
  If Reset clicked:  
       ↓  
  Popup A shows confirmation  
       ↓  
  User confirms (or cancels)  
       ↓  
  Backend workflow executes (reset-usability or advance-day)  
       ↓  
  Success/Error feedback

\=== TECHNICAL DEBT & IMPROVEMENTS \===

Items to address during migration:

1\. NAMING CONVENTIONS  
   \- Buttons in popup have same label but different functions  
   \- Consider renaming to "Confirm" and "Cancel" for clarity  
   \- Element names use prefix notation (D:, Button, etc.) which is good

2\. COMPONENT REUSABILITY  
   \- Buttons are duplicated (Reset and Start Day 2\)  
   \- Could create a reusable Button component with variants  
   \- Modal is reusable but could be parameterized further

3\. FORM VALIDATION  
   \- Dropdown marked as "should not be empty"  
   \- Consider disabling action buttons until valid selection  
   \- Add visual indicators for required fields

4\. ERROR HANDLING  
   \- No visible error states beyond border color  
   \- Add toast notifications for operation results  
   \- Add retry mechanisms for failed operations

5\. LOADING STATES  
   \- Dropdown shows loading spinner  
   \- Button should show loading state during operation  
   \- Add disabled state to prevent double-submissions

6\. INTERNATIONALIZATION  
   \- All text is hardcoded in English  
   \- Plan for translation if app expands globally  
   \- Use i18n framework from start

\=== END OF REQUIREMENTS DOCUMENT \===

This document represents a comprehensive specification of the \_simulation-admin page  
from the Bubble IDE. All information has been extracted through:  
\- Visual element inspection  
\- Property analysis  
\- Conditional logic documentation  
\- Style configuration review  
\- User interaction testing

For additional clarification on any items marked with "?", refer to the  
"OUTSTANDING QUESTIONS" section above.

