\_internal-emergency Page \- Comprehensive Requirements Document

Application: Split Lease (Production)  
Page Path: \_internal-emergency  
Page Type: Staff/Admin Dashboard  
App ID: upgradefromstr

EXECUTIVE SUMMARY

The \_internal-emergency page is a comprehensive emergency management dashboard for internal staff. It displays emergency reports associated with property reservations, allowing staff to review emergency details, communicate with guests and hosts, assign emergencies to team members, and manage the resolution process. The page serves as a central hub for handling emergency incidents reported by guests during their stays.

PAGE OVERVIEW & FUNCTIONALITY

Page Title: Emergencies Dashboard  
Purpose: Internal dashboard for managing emergency reports from guests  
Primary Users: Staff/Admin team members  
Key Actions:  
\- View and filter emergency reports  
\- Display emergency details (agreement number, guest info, host info, emergency type, description, photos)  
\- Assign emergencies to team members  
\- Send SMS/Text messages to guests  
\- Send emails to guests with CC/BCC options  
\- View message/email threads  
\- Update emergency status and add guidance/instructions

PAGE LAYOUT & VISUAL STRUCTURE

The page uses a responsive grid layout with:  
\- Header: Corporate header with navigation and user profile section  
\- Main content area: Split into two columns  
  \- Left column: Emergency form/details display (60% width)  
  \- Right column: Emergency list sidebar (40% width)  
\- Footer: Standard page footer

Page Dimensions: 1786px x 2826px (custom responsive layout)  
Background Color: \#E1E1EF (light purple)  
Overflow Behavior: Collapse height when hidden, animate collapse operation

ELEMENT TREE HIERARCHY

\_internal-emergency (Page Container)  
├── Corporate Header A (Reusable component \- site navigation)  
├── T: Title of the internal page (Text element)  
├── Logged In Header Avatar (Reusable component \- user profile)  
├── G: Emergency Report (Repeating Group \- Main content container)  
│   ├── T: Listing Address: label  
│   ├── T: Emergency Report  
│   ├── T: Agreement Number  
│   ├── T: Agreement Number-Label  
│   ├── T: Guest Phone Number  
│   ├── T: Guest Email  
│   ├── T: Guest Name  
│   ├── T: Guest Information-Label  
│   ├── T: Host Email  
│   ├── T: Host Phone Number  
│   ├── T: Host Name  
│   ├── T: Host Information: Label  
│   ├── T: Type of Emergency: Label  
│   ├── T: Photos uploaded by customers  
│   ├── T: Type of emergency: Report  
│   ├── IM: Photo 1 (Image element)  
│   ├── IM: Photo 2 (Image element)  
│   ├── IN: Team Member Assigned (Text Input)  
│   ├── A: You have alerted the team (Alert message)  
│   └── \[Additional form elements and input fields\]  
├── FG: choose a different message (Floating Group \- Message selector)  
│   └── \[Dropdown or selection component for alternative messages\]  
└── G: Communication (Group \- Communication section)  
    ├── Text Customer (Text label)  
    ├── IN: Type Message (Multiline input for SMS)  
    ├── B: Send (Button \- SMS send action)  
    ├── Preset Messages (Click to send) (Buttons for templated messages)  
    ├── Email Customer (Text label)  
    ├── IN: Type Email (Multiline input for email body)  
    ├── B: Send (Button \- Email send action)  
    ├── Preset Emails (Click to send) (Buttons for templated emails)  
    ├── CC Email (Text input)  
    ├── BCC Email (Text input)  
    ├── Select Desired Person (Dropdown \- Team member selection)  
    ├── Message thread (Message history display)  
    ├── Emails (Email history display)  
    ├── Last Updated On (Timestamp display)  
    └── \[Additional communication-related elements\]

DATA SOURCES & BINDINGS

Primary Data Source: Emergency Reports (Custom Data Type)  
Data Context: G: Emergency Report's selected emergency report

Key Data Bindings:  
1\. Agreement Number Display  
   \- Source: G: Emergency Report's selected emergency report's Reservation's Agreement Number  
   \- Element: Agreement Number text field  
   \- Binding Type: Dynamic text display

2\. Guest Information  
   \- Guest Name: Emergency Report's Reservation's Guest's Name \- Full  
   \- Guest Phone: Emergency Report's Reservation's Guest's phone number  
   \- Guest Email: Emergency Report's Reservation's Guest's email  
   \- Guest Information Label: Static text "Guest Information:"

3\. Host Information  
   \- Host Name: Emergency Report's Reservation's Host's User's Name \- Full  
   \- Host Phone: Emergency Report's Reservation's Host's phone number  
   \- Host Email: Emergency Report's Reservation's Host's User's email  
   \- Host Information Label: Static text "Host Information:"

4\. Listing Details  
   \- Listing Address: Emergency Report's Reservation's Listing's Location \- Address

5\. Emergency Details  
   \- Type of Emergency: Emergency Report's Type of emergency reported  
   \- Description: Emergency Report's Description of emergency  
   \- Photo 1: Emergency Report's Photo 1 of emergency's URL  
   \- Photo 2: Emergency Report's Photo 2 of emergency's URL

6\. Assignment & Status  
   \- Team Member Assigned: IN: Team Member Assigned's value  
   \- Guidance/Instructions: Emergency Report's Guidance / Instructions

PAGE-LEVEL WORKFLOWS (Frontend Events & Actions)

1\. Page is loaded  
   Event: Page is loaded  
   Actions:  
   \- Step 1: Run javascript \- HIDE crisp chat on mobile  
     Script: window.$crisp.push(\["do", "chat:hide"\]);  
     Purpose: Hides Crisp chat widget on mobile devices for cleaner interface

2\. B: Assign & Submit is clicked  
   Event: B: Assign & Submit button click  
   Trigger Condition: Only when IN: Team Member Assigned's value is not empty  
   Actions:  
   \- Step 1: Send Slack message in Dynamic Tasks Channel  
     Recipient: dynamic-task's email address  
     Sender Name: Internal Emergency Comms  
     Subject: Emergency Assigned to \[IN: Team Member Assigned's value\]  
     Body Template:  
       \[IN: Team Member Assigned's value\]  
       Please go to \[This URL\] and handle the below emergency.  
       Agreement \#: Parent group's Emergency Reports's Agreement Number  
       Reported By: Parent group's Emergency Reports's reported by's Name \- Full  
       Date Reported: Parent group's Emergency Reports's Creation Date (formatted as 1/13/26)  
       Guidance / Instructions: Parent group's Emergency Reports's Guidance / Instructions  
   \- Step 2: Show message in A: You have alerted the team  
     Message: Confirmation to staff that team has been notified  
   \- Step 3: Make changes to Emergency Reports...  
     Action: Update the selected emergency report (likely setting assigned staff member)

3\. B: Choose emergency by agreement...  
   Event: Selection or filter event  
   Purpose: Allows filtering emergency list by agreement number  
   (Details require further investigation in Bubble console)

4\. B: Update Status is clicked \- Mak...  
   Event: Update Status button click  
   Purpose: Updates the status of the emergency report  
   (Details require further investigation in Bubble console)

Workflow Organization:  
\- Uncategorized: 1 workflow  
\- Custom Events: \[Folder containing custom event definitions\]  
\- Emergency: 3 workflows (covered above)  
\- Page is Loaded: 1 workflow (covered above \- separate from Page is loaded event trigger)  
\- Send text/email: 2 workflows  
\- Show/Hide Elements: 2 workflows  
\- Unnamed Folder: \[Additional workflows\]

COMMUNICATION FEATURES ARCHITECTURE

SMS/Text Communication:  
\- Send to: Guest's phone number (pre-populated from reservation data)  
\- Custom Message: User can type custom SMS message  
\- Preset Messages: Quick-select templated messages for common scenarios  
\- Add Number to Text: Ability to add additional phone numbers to message  
\- Send Button: Submits SMS via backend  
\- Message History: Displays all sent/received messages with timestamps

Email Communication:  
\- Send to: Guest's email address (pre-populated)  
\- Custom Email: User can compose custom email body  
\- Preset Emails: Quick-select templated emails  
\- CC Email: Add additional recipients  
\- BCC Email: Add blind-copy recipients  
\- Send Button: Submits email via backend  
\- Email History: Displays all sent/received emails with timestamps

Internal Team Communication:  
\- Slack Integration: Automated Slack notifications when emergencies are assigned  
\- Message Slack Channel: Dynamic Tasks Channel (dynamic-task's email address)  
\- Content: Emergency details, assignment info, guidance

Communication Context:  
\- All communication references current selected emergency report  
\- User can select different team members via "Communicate with: Select Desired Person"  
\- "hide emergency" link allows hiding emergency from view  
\- "show emergency" link allows re-displaying hidden emergency

MISSING INFORMATION & INVESTIGATION NEEDED

The following areas require deeper investigation for complete documentation:

1\. Repeating Group Data Source Logic  
   \- How is the emergency list filtered/sorted on the right sidebar?  
   \- What is the sort order? (Latest first, oldest first, priority-based?)  
   \- Are there any filters applied beyond showing all emergencies?

2\. Emergency Selection Mechanism  
   \- How is the "current cell" referenced when emergency is selected?  
   \- Is there a custom field value that drives the selection?  
   \- How does selection persist across page interactions?

3\. B: Choose emergency by agreement workflow  
   \- What specific action does this workflow execute?  
   \- Is this a filter/search mechanism?  
   \- What inputs/parameters are involved?

4\. B: Update Status workflow  
   \- What status values are available?  
   \- How are statuses stored in the Emergency Reports data type?  
   \- Are there conditional actions based on status change?

5\. Message/Email Template Logic  
   \- How are preset messages/emails defined?  
   \- Are these stored as separate records or hardcoded?  
   \- Can team members customize templates?

6\. Team Member Dropdown  
   \- What is the data source for "Select Desired Person"?  
   \- How are team members retrieved?  
   \- Is this filtered by role/permission?

7\. Photo Upload & Display  
   \- Are photos stored on page load or uploaded during emergency creation?  
   \- What format are photos stored in (URL vs base64)?  
   \- Are there size limitations?

8\. Slack Integration Details  
   \- What is "dynamic-task's email address" \- is this a Slack webhook?  
   \- How are rich message blocks formatted for Slack?  
   \- Are there retry mechanisms for failed sends?

9\. TwilioBot Integration  
   \- What is the exact message content sent via Twilio?  
   \- How are phone numbers validated?  
   \- Are there rate limits or queuing mechanisms?

10\. Page Load Performance  
    \- How many emergency reports are loaded initially?  
    \- Is pagination implemented for large datasets?  
    \- Are there any lazy-loading mechanisms?

11\. Responsive Design Specifics  
    \- Mobile layout differences (if any)  
    \- Tablet layout optimization  
    \- Touch interaction handling

12\. Error Handling  
    \- What happens if Slack message fails to send?  
    \- What happens if email/SMS fails?  
    \- Are there user-facing error messages?

RECOMMENDED NEXT STEPS FOR COMPLETE DOCUMENTATION:

To fill these gaps, perform:  
1\. Click through each workflow in the Bubble editor  
2\. Examine the repeating group's data source configuration  
3\. Check each conditional's complete expression  
4\. Review message/email presets for content and triggers  
5\. Investigate backend workflow parameters and responses  
6\. Test page behavior with different user roles/permissions  
7\. Monitor browser console for JavaScript errors during interactions  
8\. Check Bubble's Debug logs for workflow execution details  
9\. Verify API endpoint documentation in Bubble settings  
10\. Review any custom JavaScript in the page footer/header

TECHNICAL SPECIFICATIONS FOR CODE MIGRATION

Data Types Referenced:  
\- Emergency Reports (Primary data type)  
  \- Fields: Agreement Number, Description of emergency, Photo 1 URL, Photo 2 URL, reported by (User reference), Reservation (Booking reference), Type of emergency reported, Guidance / Instructions, Creation Date, Status (inferred)

\- Bookings/Leases (Referenced for reservation data)  
  \- Relationships: One-to-many with Emergency Reports

\- Users (Referenced for staff/team members)  
  \- Fields: Name \- Full, email, phone number

\- Reservations (Connected to Bookings)  
  \- Contains: Guest info, Host info, Agreement Number, Associated Listing

\- Listings (Property information)  
  \- Fields: Location \- Address

External Integrations:  
1\. Slack API  
   \- Channel: Dynamic Tasks Channel  
   \- Method: Likely Slack Incoming Webhooks  
   \- Trigger: When emergency assigned, emergency created  
   \- Message Format: Structured with agreement, reporter, date, guidance

2\. Twilio API  
   \- Method: SMS/Voice messaging  
   \- Trigger: When emergency created (if user logged in)  
   \- Recipients: Guest phone numbers

3\. Email System  
   \- Method: Built-in Bubble email or SMTP integration  
   \- Trigger: When emergency created or assigned  
   \- Recipients: Guest emails with CC/BCC support

4\. Crisp Chat Widget  
   \- Integration: Third-party chat tool  
   \- Control: JavaScript API to hide/show on mobile

Dependencies:  
\- Emergency Reports data type MUST exist with specified fields  
\- User authentication system required  
\- Slack workspace setup and webhook configuration  
\- Twilio account and phone number configuration  
\- Email delivery system  
\- Custom data type relationships properly configured

WORKFLOW EXECUTION FLOW

User Journey for Emergency Management:

1\. Page Load  
   \- "Page is loaded" event triggers  
   \- JavaScript runs to hide Crisp chat on mobile  
   \- Emergency reports repeating group fetches data from database  
   \- List of emergencies displays on right sidebar

2\. Emergency Selection  
   \- User clicks on emergency in "All Emergencies" list  
   \- Selected emergency highlighted with blue indicator  
   \- G: Emergency Report repeating group updates to display selected report's data  
   \- All form fields auto-populate with emergency details  
   \- Photos display (if available)

3\. Team Assignment  
   \- User types team member name in "Assign this Emergency to Team Member" field  
   \- User clicks "Assign" button  
   \- "B: Assign & Submit is clicked" workflow executes:  
     a) Slack notification sent to Dynamic Tasks Channel  
     b) Confirmation message displayed to user  
     c) Emergency report updated with assignment

4\. Communication with Guest  
   \- User composes text message in "Type Message..." field  
   \- User clicks "Send" button (or uses preset message)  
   \- SMS sent via Twilio backend workflow  
   \- Message appears in message thread history  
   \- OR  
   \- User composes email in "Type Email..." field  
   \- User adds optional CC/BCC recipients  
   \- User clicks "Send" button (or uses preset email)  
   \- Email sent via email backend workflow  
   \- Email appears in email history

5\. Status Updates  
   \- User clicks "Update Status" button  
   \- Emergency status updated in database  
   \- Change persists across page navigation

6\. Emergency Hiding/Visibility  
   \- User clicks "hide emergency" link  
   \- Emergency removed from main view  
   \- User clicks "show emergency" link  
   \- Emergency reappears in view

MIGRATION CHALLENGES & CONSIDERATIONS

1\. State Management  
   \- Bubble automatically manages form state with data bindings  
   \- Code migration requires explicit state management (React Context, Redux, etc.)  
   \- Challenge: Complex conditional logic for element visibility

2\. Dynamic Data Relationships  
   \- Bubble's data type system is flexible with nested relationships  
   \- Challenge: Ensuring foreign key relationships are properly modeled in SQL/code

3\. Real-time Updates  
   \- Bubble has built-in real-time data synchronization  
   \- Challenge: Implementing WebSocket or polling mechanism for real-time updates

4\. Third-party Integrations  
   \- Slack, Twilio, Email systems integrate seamlessly in Bubble  
   \- Challenge: Setting up proper OAuth, API keys, and error handling in code

5\. Responsive Design  
   \- Bubble's responsive engine automatically adjusts layouts  
   \- Challenge: Implementing responsive CSS and media queries in code

6\. Permission & Privacy  
   \- Bubble has built-in privacy rules for data access control  
   \- Challenge: Implementing row-level security in backend code

7\. API Endpoint Behavior  
   \- Bubble API workflows are event-driven  
   \- Challenge: Creating equivalent RESTful or GraphQL endpoints

ESTIMATED SCOPE FOR CODE IMPLEMENTATION

Components to Build:  
1\. Emergency dashboard page component  
   \- Estimate: 800-1200 lines of code (JSX \+ TypeScript)

2\. Emergency list/sidebar component  
   \- Estimate: 200-400 lines

3\. Communication section (SMS \+ Email)  
   \- Estimate: 600-900 lines

4\. Workflow orchestration layer  
   \- Estimate: 400-600 lines

5\. Backend API endpoints  
   \- core-create-emergency-report-react endpoint  
   \- Other emergency management endpoints  
   \- Estimate: 800-1200 lines (Node.js/Express or similar)

6\. Database models and migrations  
   \- Emergency Reports table/collection  
   \- Relationships and constraints  
   \- Estimate: 200-400 lines

7\. Integration layers (Slack, Twilio, Email)  
   \- Estimate: 300-500 lines

8\. Tests  
   \- Unit tests for components and logic  
   \- Integration tests for workflows  
   \- Estimate: 500-800 lines

Total Estimated Code: 4,200-6,600 lines

Development Phases:  
1\. Phase 1: Database schema and models (Week 1\)  
2\. Phase 2: Backend API endpoints (Week 1-2)  
3\. Phase 3: Frontend component structure (Week 2\)  
4\. Phase 4: Data binding and state management (Week 2-3)  
5\. Phase 5: Workflow orchestration and interactions (Week 3\)  
6\. Phase 6: Third-party integrations (Week 3-4)  
7\. Phase 7: Testing and refinement (Week 4\)  
8\. Phase 8: Deployment and monitoring (Week 4-5)

CONCLUSION

The \_internal-emergency page is a well-structured Bubble application that manages emergency reports with a sophisticated workflow system. The page effectively combines:

\- Data display and selection mechanisms  
\- Complex form interactions with conditional logic  
\- Multi-channel communication (SMS, Email, Slack)  
\- Real-time notifications and team coordination  
\- Integration with external services

Successful migration to code requires:  
1\. Careful mapping of all data relationships  
2\. Implementation of state management for complex interactions  
3\. Recreation of all conditional logic and workflows  
4\. Proper setup of all third-party integrations  
5\. Comprehensive testing of all user journeys  
6\. Performance optimization for large datasets

The recommended approach is iterative development following the phases outlined above, with regular testing and validation against the original Bubble application.

\--- END OF DOCUMENT \---  
