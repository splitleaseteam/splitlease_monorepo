Z-SHARATH-TEST PAGE \- COMPREHENSIVE REQUIREMENTS DOCUMENT

DATE: January 26, 2026  
SOURCE: Split Lease Production \- Bubble App  
PAGE: z-sharath-test

\=== EXECUTIVE SUMMARY \===

The z-sharath-test page is a comprehensive testing and development page within the Split Lease application. It serves as a testing environment for:  
\- Email template testing (multiple templates)  
\- SMS functionality testing (multiple phone number configurations)  
\- Gemini Nano AI integration testing  
\- File upload and Base64 conversion testing  
\- Database diagram visualization  
\- Various UI component testing

This page is clearly a development/staging tool used for quality assurance and feature validation before deployment to production pages.

\=== PAGE PROPERTIES \===

Page Name: z-sharath-test  
Page Type: Standard page  
Element ID: cskCK1  
Workflows: 32 total workflows

\=== DETAILED PAGE LAYOUT & ELEMENTS \===

The z-sharath-test page is organized into several major sections:

1\. TOP SECTION \- PAGE METADATA:  
   \- Website home URL display (Text element: cuwGK)  
   \- Button U (ID: cuwFm3) \- "...edit me..." button  
   \- Image A (ID: cuwFg3) \- placeholder.png display  
   \- AirDatabaseDiagram A (ID: cuwFs3) \- Link to JPG visualization

2\. MAIN SECTION \- EMAIL TEMPLATE TESTING (Group H \- ID: curzr):  
   Contains 19 email testing buttons arranged in a grid layout:  
     
   Row 1 (Basic Email Templates):  
   \- Send Email basic (ID: cuqvP6)  
   \- Send Email Template 1 (ID: cttjB3)  
   \- Send Email Template Celebratory (ID: cutrT0)  
   \- Send Email Template 2 (ID: cuquw6)  
     
   Row 2 (Advanced Email Templates):  
   \- Send Email Security Gif (ID: cuyAu5)  
   \- Send Email Template 4 (ID: cuqwi)  
   \- Test Feedback Email (ID: curqk7)  
   \- Test Checkout Reminder Email (ID: curra7)  
     
   Row 3 (Transactional Email Tests):  
   \- Test Success Story Testimonial (ID: cusAV)  
   \- Test Rebooking recommendations (ID: cusCk8)  
   \- Test Move Instructions 1 Minimal (ID: cusFA1)  
   \- Test Move Instructions Lite (ID: cusDg)  
     
   Row 4 (Specialized Email Tests):  
   \- Test Proposal Updates(Guest rejection) (ID: cusIS1)  
   \- Test Security/Availability Template (ID: cusJg)  
   \- Test Security 2 (ID: cusKe)  
   \- Test Nearby Suggestions Masked 1 (ID: cuslc)  
     
   Row 5 (Additional Tests):  
   \- Test Nearby Suggestions Masked 2 (ID: cusma2)  
   \- Test Nearby Suggestions Masked 3 (ID: cusmq2)  
   \- Check Date (ID: cuyEi2)

3\. SMS TESTING SECTION (Group I \- ID: cutLC):  
   Contains 4 SMS testing groups:  
     
   GROUP 1 (ID: ctdBy0) \- Full SMS Form:  
   \- Display: "I: From Number's value" (ID: ctdCA0)  
   \- Label: "From Number" (ID: ctdCc0)  
   \- Input: To Number field (ID: ctdCi0) \- readonly, value: "4155692985"  
   \- Label: "To Number" (ID: ctdCF0)  
   \- Input: To Number field (ID: ctdCE0) \- readonly, value: "4155692985"  
   \- Label: "Message Content" (ID: ctdCK0)  
   \- Text area: Message input (ID: ctdCL0) \- readonly  
   \- Button: "Send SMS" (ID: ctdCG0)  
     
   GROUP 2 (ID: cunuk3) \- Email Raw Testing:  
   \- Input: Type here field (ID: cunuq3) \- readonly  
   \- Button: "Send Email Raw" (ID: cunuw3)  
   \- Display: "G: Error body's error" (ID: cunvP3)  
     
   GROUP 3 (ID: ctGrA) \- SMS Form 2:  
   \- Display: "4155692985" (ID: ctGrF)  
   \- Label: "To Number" (ID: ctGrK)  
   \- Input: To Number field (ID: ctGrG) \- readonly  
   \- Label: "Message Content" (ID: ctGrM)  
   \- Text area: Message input (ID: ctGrQ) \- readonly  
   \- Button: "Send SMS" (ID: ctGrL)  
     
   GROUP 4 (ID: ctGqC) \- SMS Form 3:  
   \- Display: "4157670779" (ID: ctGqI)  
   \- Label: "To Number" (ID: ctGqU)  
   \- Input: To Number field (ID: ctGqO) \- readonly  
   \- Label: "Message Content" (ID: ctGqo)  
   \- Text area: Message input (ID: ctGqu) \- readonly  
   \- Button: "Send SMS" (ID: ctGqa)

4\. FILE UPLOAD & PROCESSING SECTION (Group F \- ID: cuvYO1):  
   \- Dropdown: "Choose an option..." (ID: cuvZp1) \- combobox  
   \- Display: "FIUP: PDF's value:first item's URL" (ID: cuvXC1)  
   \- Input: Type here field 1 (ID: cuvYW1) \- readonly  
   \- Input: Type here field 2 (ID: cuvam1) \- readonly  
   \- Input: Type here field 3 (ID: cuvax1) \- readonly  
   \- File Upload Group (ID: cuvWu1) with iframe preview (ID: user\_preview\_iframe)

5\. GEMINI AI TESTING SECTION (in iframe):  
   \- Text: "File \-\> base64"  
   \- Button: "Gemini Nano Banana" (ID: cuvUO)  
   \- Display: "I: Nano Banana's image" (ID: cuvUU)  
   \- Button: "Show popup" (ID: cuvVE)  
   \- Button: "Test Login" (ID: cvARY6)

6\. OVERLAY ELEMENTS:  
   \- ♻️💥ai-room-redesign (reusable element)

\=== COMPREHENSIVE WORKFLOWS ANALYSIS \===

TOTAL: 32 Page Workflows (Uncategorized)

The page contains 32 workflows for testing various email templates, SMS functionality, Gemini AI integration, and other features. Below is the complete list:

1\. Alerts General (copy) \- ID: cuvXr1  
   Purpose: General alerts testing workflow  
   Status: Active

2\. Button Gemini Nano Banana is clicked \- ID: cuvUa (DISABLED)  
   Purpose: Test Gemini Nano AI integration for processing images/text  
   Status: Disabled

3\. Button Gemini Nano Banana is clicked \- ID: cuvYt1 (DISABLED)  
   Purpose: Alternative Gemini Nano test workflow  
   Status: Disabled

4\. Button Gemini Nano Banana is clicked \- ID: cuvaA1  
   Purpose: Active Gemini Nano workflow for AI processing  
   Status: Active

5\. Button Gemini Nano Banana is clicked \- ID: cuvbI1 (DISABLED)  
   Purpose: Additional Gemini Nano test configuration  
   Status: Disabled

6\. Button Send Checkout Reminder is clicked \- ID: currg7  
   Purpose: Triggers checkout reminder email to guests  
   Intent: Automated reminder for incomplete booking checkouts

7\. Button Send Email basic is clicked \- ID: cuqvV6  
   Purpose: Tests basic email template sending  
   Intent: Simple email template validation

8\. Button Send Email Raw is clicked \- ID: cunvC3  
   Purpose: Sends raw/unformatted email for testing  
   Intent: Test email delivery without template formatting

9\. Button Send Email Template is clicked \- ID: cupVi  
   Purpose: Tests primary email template system  
   Intent: Validate standard email template rendering

10\. Button Send Email Template 2 copy is clicked \- ID: cuyBA5  
    Purpose: Tests duplicate/variant of email template 2  
    Intent: A/B testing or template variant testing

11\. Button Send Email Template 2 is clicked \- ID: cuqvC6  
    Purpose: Tests email template version 2  
    Intent: Secondary template format validation

12\. Button Send Email Template 4 is clicked \- ID: cuqwo  
    Purpose: Tests email template version 4  
    Intent: Advanced template features testing

13\. Button Send Email Template Celebratory is clicked \- ID: cutrZ0  
    Purpose: Tests celebratory/success email templates  
    Intent: Positive milestone communications (move-ins, anniversaries)

14\. Button Send SMS is clicked \- ID: ctGqg  
    Purpose: Sends SMS message using configuration 1  
    Intent: Test SMS delivery with phone number 4155692985

15\. Button Send SMS is clicked \- ID: ctGre  
    Purpose: Sends SMS message using configuration 2  
    Intent: Test SMS delivery with phone number 4155692985

16\. Button Send SMS is clicked \- ID: ctdCo0  
    Purpose: Sends SMS message using configuration 3  
    Intent: Test SMS delivery with phone number 4157670779

17\. Button Show popup is clicked \- ID: cuvVU  
    Purpose: Displays popup/modal for testing  
    Intent: Test popup functionality and content

18\. Button Test Feedback Email is clicked \- ID: curqq7  
    Purpose: Tests feedback request email template  
    Intent: Guest/host feedback collection emails

19\. Button Test Login is clicked \- ID: cvARw6  
    Purpose: Tests login functionality  
    Intent: Authentication system testing

20\. Button Test Move Instructions 1 Minimal is clicked \- ID: cusFG1  
    Purpose: Tests minimal version of move-in instructions email  
    Intent: Streamlined move-in guidance for guests

21\. Button Test Move Instructions 2 Lite is clicked \- ID: cusDm  
    Purpose: Tests lite version of move-in instructions  
    Intent: Abbreviated move-in instructions format

22\. Button Test Proposal Updates(Guest rejection) is clicked \- ID: cusFr  
    Purpose: Tests email sent when guest rejects proposal  
    Intent: Handle proposal rejection communications

23\. Button Test Rebooking recommendations is clicked \- ID: cusCq8  
    Purpose: Tests rebooking suggestion email  
    Intent: Encourage repeat bookings with recommendations

24\. Button Test Success Story Testimonial is clicked \- ID: cusCB  
    Purpose: Tests success story/testimonial request email  
    Intent: Collect positive reviews and testimonials

25\. Button U is clicked \- ID: cuwFy3  
    Purpose: Utility/testing button (unclear specific purpose)  
    Intent: Development/debugging utility

26\. Test Nearby Suggestions masked 1 is clicked \- ID: cuslu2  
    Purpose: Tests nearby listing suggestions with masked data (version 1\)  
    Intent: Privacy-protected listing recommendations

27\. Test Nearby Suggestions masked 2 is clicked \- ID: cusmg2  
    Purpose: Tests nearby listing suggestions with masked data (version 2\)  
    Intent: Alternative format for masked recommendations

28\. Test Nearby Suggestions masked 3 copy is clicked \- ID: cuyEo2  
    Purpose: Tests copy/variant of nearby suggestions (version 3\)  
    Intent: A/B testing of suggestion formats

29\. Test Nearby Suggestions masked 3 is clicked \- ID: cusmw2  
    Purpose: Tests nearby listing suggestions with masked data (version 3\)  
    Intent: Third variation of masked recommendations

30\. Test Security/Availability Template is clicked \- ID: cusJm  
    Purpose: Tests security and availability notification template  
    Intent: Inform users about security updates and availability changes

31\. Test Security2 is clicked \- ID: cusKo1  
    Purpose: Tests alternative security notification template  
    Intent: Secondary security alert format

32\. Text G: Error body's error is clicked \- ID: cunvV3  
    Purpose: Tests error handling and error message display  
    Intent: Validate error reporting functionality

\=== BACKEND WORKFLOWS OVERVIEW \===

TOTAL: 396 Backend Workflows across 30+ categories

The application has an extensive backend workflow system organized into the following categories:

1\. Backend Workflows (root folder)  
   \- 12-sttng-saving-address  
   \- 12-sttng-saving-section-2

2\. Bots (2 workflows)  
   Purpose: Automated bot interactions and scheduled tasks

3\. Bulk Fix (48 workflows)  
   Purpose: Data migration, cleanup, and bulk operations  
   Critical: Large-scale data transformation workflows

4\. ChatGPT (7 workflows)  
   Purpose: AI integration for conversational features  
   Intent: ChatGPT API interactions and prompt management

5\. Code: Recent API Calls (54 workflows)  
   Purpose: External API integration management  
   Critical: Highest number of API-related workflows

6\. Core \- Notifications (1 workflow)  
   Purpose: Central notification dispatch system  
   Intent: Unified notification management

7\. Core \- User Management (5 workflows)  
   Purpose: User CRUD operations and authentication  
   Intent: User lifecycle management

8\. Data Management (5 workflows)  
   Purpose: Database operations and data integrity  
   Intent: Data validation, cleanup, and maintenance

9\. date-change-requests (5 workflows)  
   Purpose: Handle booking date modification requests  
   Intent: Coordinate date changes between hosts and guests

10\. Emergency & Safety (5 workflows)  
    Purpose: Emergency reporting and safety protocols  
    Intent: Critical incident management

11\. Hosts Manual Visitors handling (12 workflows)  
    Purpose: Manual visitor check-in/check-out processes  
    Intent: Support hosts with visitor management

12\. Integrations & APIs (15 workflows)  
    Purpose: Third-party service integrations  
    Intent: External platform connectivity

13\. Leases Workflows (11 workflows)  
    Purpose: Lease agreement management  
    Intent: Contract creation, modification, termination

14\. Listing Curation (9 workflows)  
    Purpose: Listing quality control and moderation  
    Intent: Maintain listing standards

15\. Listing Image Check (2 workflows)  
    Purpose: Image validation and moderation  
    Intent: Ensure image quality and appropriateness

16\. Listing workflows (15 workflows)  
    Purpose: Listing CRUD operations  
    Intent: Listing lifecycle management

17\. MAN: Reviews (2 workflows)  
    Purpose: Manual review processing  
    Intent: Human-moderated review management

18\. Masking & Forwarding (11 workflows)  
    Purpose: Phone number masking and call forwarding  
    Intent: Privacy protection for user communications

19\. Masking and Forwarding (FRED) (4 workflows)  
    Purpose: FRED system integration for masking  
    Intent: Alternative masking service implementation

20\. Messaging System (52 workflows)  
    Purpose: In-app messaging infrastructure  
    Critical: Second highest workflow count  
    Intent: Real-time messaging between users

21\. Price Calculations (15 workflows)  
    Purpose: Dynamic pricing algorithms  
    Intent: Calculate booking costs, fees, taxes

22\. Proposal Workflows (17 workflows)  
    Purpose: Booking proposal management  
    Intent: Proposal creation, modification, acceptance/rejection

23\. Reservation Manage (5 workflows)  
    Purpose: Reservation lifecycle management  
    Intent: Booking confirmation, modification, cancellation

24\. Sets (1 workflow)  
    Purpose: Collection/set management  
    Intent: Group-related operations

25\. SignUp & Onboarding (11 workflows)  
    Purpose: User registration and onboarding  
    Intent: New user experience flows

26\. Signup Stack \+ Python \+ Bubble (3 workflows)  
    Purpose: Advanced signup with Python backend  
    Intent: Custom signup logic with external processing

27\. Supabase (1 workflow)  
    Purpose: Supabase database integration  
    Intent: Alternative database operations

28\. System (15 workflows)  
    Purpose: System-level operations and maintenance  
    Intent: Application health, monitoring, utilities

29\. Virtual Meetings (6 workflows)  
    Purpose: Video call scheduling and management  
    Intent: Virtual property tours and meetings

30\. Voiceflow (9 workflows)  
    Purpose: Conversational AI workflow integration  
    Intent: Chatbot and voice assistant features

\=== DATA TYPES & DATABASE SCHEMA \===

Based on the naming conventions and workflow purposes, the page interacts with the following data types:

1\. Users  
   \- Authentication and login functionality  
   \- User profile management  
   \- Host and Guest roles

2\. Listings  
   \- Property/listing information  
   \- Listing curation and moderation  
   \- Image management  
   \- Availability calendars

3\. Proposals/Bookings  
   \- Booking requests and proposals  
   \- Proposal status (pending, accepted, rejected)  
   \- Date change requests  
   \- Pricing calculations

4\. Reservations/Leases  
   \- Active bookings  
   \- Lease agreements  
   \- Check-in/check-out data  
   \- Move-in instructions

5\. Messages  
   \- In-app messaging  
   \- Email templates (multiple variations)  
   \- SMS messages  
   \- Masking and forwarding data

6\. Reviews  
   \- Guest reviews  
   \- Host reviews  
   \- Testimonials  
   \- Feedback requests

7\. Notifications  
   \- Email notifications  
   \- SMS notifications  
   \- In-app alerts  
   \- Security alerts

8\. External Integrations  
   \- ChatGPT API data  
   \- Gemini Nano AI processing  
   \- Voiceflow conversational data  
   \- Third-party API calls

9\. System Data  
   \- Error logs ("G: Error body's error")  
   \- Database diagrams (AirDatabaseDiagram)  
   \- File uploads (Base64 conversion)  
   \- Configuration settings

\=== TECHNICAL SPECIFICATIONS \===

1\. PAGE PROPERTIES:  
   \- Page Name: z-sharath-test  
   \- Page Type: Standard page  
   \- Element ID: cskCK1  
   \- Total Workflows: 32  
   \- Page Title: My Page  
   \- This page is a native app: YES  
   \- Mobile version: Configured  
   \- Type of content: (needs specification)  
   \- Time zone selection: User's current timezone  
   \- Style: None (Custom)  
   \- Opacity: 100%  
   \- Background style: Flat color  
   \- Background color: \#FFFFFF (white)  
   \- Page folder: Backend Pages

2\. RESPONSIVE DESIGN:  
   \- Builder mode: Responsive  
   \- Layout adapts to different screen sizes  
   \- Mobile-first design approach

3\. INTEGRATIONS:  
   \- Gemini Nano AI (Google's on-device AI)  
   \- File to Base64 conversion  
   \- SMS gateway (phone numbers: 4155692985, 4157670779, 6285651571\)  
   \- Email service (multiple template systems)  
   \- AirDatabaseDiagram plugin  
   \- FiletoBase64 plugin

4\. SECURITY & PRIVACY:  
   \- Phone number masking (FRED system)  
   \- Call forwarding  
   \- Error handling and display  
   \- Security/availability templates

5\. UI COMPONENTS USED:  
   \- Buttons (standard blue buttons)  
   \- Text inputs (readonly for testing)  
   \- Text areas (multiline inputs)  
   \- Dropdowns ("Choose an option...")  
   \- File uploaders (drag and drop)  
   \- Iframes (for previews)  
   \- Groups (for organization)  
   \- Repeating groups (possibly for dynamic content)  
   \- Popups (tested with "Show popup" button)

\=== FUNCTIONAL REQUIREMENTS \===

1\. EMAIL TESTING CAPABILITIES:  
   \- Support for 19 different email template variations  
   \- Basic email templates (simple text/HTML)  
   \- Advanced templates (with dynamic content)  
   \- Transactional emails (booking confirmations, reminders)  
   \- Marketing emails (rebooking suggestions, testimonials)  
   \- Notification emails (security alerts, availability updates)  
   \- Specialized emails (move-in instructions, proposal updates)  
   \- Celebratory emails (milestones, anniversaries)  
   \- Raw email sending (unformatted testing)

2\. SMS TESTING CAPABILITIES:  
   \- Multiple phone number configurations  
   \- From number: 4155692985  
   \- To numbers: 4155692985, 4157670779  
   \- Message sender: 6285651571  
   \- Dynamic message content  
   \- Read-only display fields for testing  
   \- SMS delivery confirmation

3\. AI INTEGRATION TESTING:  
   \- Gemini Nano (Google's on-device AI) integration  
   \- Multiple Gemini workflows (some disabled for testing)  
   \- Image processing with AI  
   \- Text extraction from images  
   \- Base64 encoding/decoding

4\. FILE UPLOAD & PROCESSING:  
   \- Drag and drop file upload  
   \- Browse files functionality  
   \- File to Base64 conversion  
   \- PDF processing  
   \- Image preview (original and processed)  
   \- Raw text extraction display

5\. USER INTERACTION TESTING:  
   \- Login functionality testing  
   \- Popup display testing  
   \- Button click workflows  
   \- Form input validation  
   \- Error handling and display

6\. DATABASE VISUALIZATION:  
   \- AirDatabaseDiagram integration  
   \- Visual representation of database schema  
   \- Link to JPG export of diagram

\=== WORKFLOW ACTION PATTERNS \===

Based on naming conventions, workflows likely include:

1\. SEND EMAIL actions:  
   \- Trigger email API  
   \- Pass template ID and parameters  
   \- Insert recipient data  
   \- Log email sent event

2\. SEND SMS actions:  
   \- Trigger SMS gateway  
   \- Pass phone numbers (from/to)  
   \- Insert message content  
   \- Handle masking/forwarding  
   \- Log SMS sent event

3\. API CALL actions:  
   \- Call Gemini Nano API  
   \- Call ChatGPT API  
   \- Call external services  
   \- Handle responses and errors

4\. DATABASE actions:  
   \- Create/read/update/delete operations  
   \- Data validation  
   \- Search and filter  
   \- Bulk operations

5\. NAVIGATION actions:  
   \- Show/hide popups  
   \- Redirect to pages  
   \- Display elements conditionally

6\. STATE MANAGEMENT:  
   \- Set custom states  
   \- Display dynamic data  
   \- Update UI based on conditions

\=== CONDITIONALS & EXPRESSIONS \===

Areas that likely contain conditionals:

1\. Element visibility:  
   \- Show/hide based on user role  
   \- Display based on workflow status  
   \- Conditional rendering of test results

2\. Button states:  
   \- Enabled/disabled based on form validation  
   \- Different workflows for different scenarios  
   \- Multiple Gemini workflows (some disabled)

3\. Dynamic content:  
   \- Phone number displays (expressions showing values)  
   \- Message content (dynamic text)  
   \- Error messages (conditional display)  
   \- File upload results (conditional rendering)

4\. Data filtering:  
   \- Search operations in backend workflows  
   \- Filter listings by criteria  
   \- Sort and organize data

\=== TESTING SCENARIOS \===

1\. EMAIL TEMPLATE TESTING:  
   \- Send each email template variation  
   \- Verify template rendering  
   \- Check dynamic content insertion  
   \- Test different recipient scenarios  
   \- Validate email delivery

2\. SMS FUNCTIONALITY TESTING:  
   \- Send SMS to different numbers  
   \- Test message content variations  
   \- Verify masking/forwarding  
   \- Check delivery status

3\. AI PROCESSING TESTING:  
   \- Upload images for Gemini Nano processing  
   \- Extract text from images  
   \- Generate AI responses  
   \- Test different file types

4\. INTEGRATION TESTING:  
   \- Verify ChatGPT API responses  
   \- Test external API calls  
   \- Validate data synchronization  
   \- Check error handling

5\. UI/UX TESTING:  
   \- Test popup displays  
   \- Verify login flow  
   \- Check responsive design  
   \- Validate form interactions

\=== IMPLEMENTATION NOTES FOR MIGRATION \===

1\. EMAIL SYSTEM:  
   \- Migrate 19 email templates to new system  
   \- Preserve template logic and dynamic content  
   \- Maintain email sending API integration  
   \- Implement template versioning

2\. SMS SYSTEM:  
   \- Migrate SMS gateway integration  
   \- Preserve phone number masking logic  
   \- Implement forwarding rules  
   \- Maintain delivery tracking

3\. AI INTEGRATIONS:  
   \- Migrate Gemini Nano integration  
   \- Preserve AI processing workflows  
   \- Implement fallback mechanisms  
   \- Handle API rate limiting

4\. FILE PROCESSING:  
   \- Migrate file upload functionality  
   \- Preserve Base64 encoding logic  
   \- Implement file type validation  
   \- Maintain preview generation

5\. BACKEND WORKFLOWS:  
   \- Migrate 396 backend workflows  
   \- Preserve workflow categories  
   \- Maintain workflow dependencies  
   \- Implement error handling

\=== AREAS REQUIRING FURTHER INVESTIGATION \===

The following areas need more detailed analysis in a subsequent pass:

1\. WORKFLOW ACTIONS & CONDITIONS:  
   \- Detailed step-by-step workflow actions for each of the 32 workflows  
   \- Conditional logic within each workflow  
   \- Data transformations and calculations  
   \- Error handling and retry logic  
   \- API endpoint configurations  
     
   PROMPT FOR NEXT PASS:  
   "Click on each workflow in the z-sharath-test page and document:  
   \- All actions in sequence  
   \- Conditions for each action  
   \- Data sources and targets  
   \- API calls and parameters  
   \- Error handling steps"

2\. BACKEND WORKFLOW DETAILS:  
   \- Specific actions in each of the 396 backend workflows  
   \- Workflow dependencies and call chains  
   \- Scheduled vs. on-demand workflows  
   \- Recursive workflows  
   \- Data privacy and security measures in workflows  
     
   PROMPT FOR NEXT PASS:  
   "Navigate to Backend Workflows and expand each category. Document:  
   \- Workflow triggers (API, scheduled, database)  
   \- Parameters and return values  
   \- Database operations performed  
   \- External API calls  
   \- Performance optimization techniques"

3\. ELEMENT CONDITIONALS:  
   \- When each element is visible/hidden  
   \- Dynamic styling based on conditions  
   \- Responsive breakpoints  
   \- Custom states and their usage  
   \- Element animations and transitions  
     
   PROMPT FOR NEXT PASS:  
   "Select each element in the Design tab and document:  
   \- Conditional tab settings  
   \- Visibility conditions  
   \- Custom states defined  
   \- Dynamic data bindings  
   \- Responsive behaviors"

4\. DATA SEARCHES & FILTERS:  
   \- Database search configurations  
   \- Filter criteria and constraints  
   \- Sort orders  
   \- Pagination settings  
   \- Search performance optimizations  
     
   PROMPT FOR NEXT PASS:  
   "Examine each element that displays dynamic data and document:  
   \- Data source queries  
   \- Search/filter conditions  
   \- Sort parameters  
   \- Constraints applied  
   \- Do a search for expressions used"

5\. PLUGIN CONFIGURATIONS:  
   \- AirDatabaseDiagram settings and data sources  
   \- FiletoBase64 configuration  
   \- Gemini Nano API keys and parameters  
   \- Other plugin settings and initialization  
     
   PROMPT FOR NEXT PASS:  
   "Navigate to Plugins tab and document:  
   \- All installed plugins  
   \- Configuration settings for each  
   \- API keys and credentials (sanitized)  
   \- Usage patterns across the app"

6\. EMAIL TEMPLATE CONTENT:  
   \- Actual email template HTML/text  
   \- Dynamic field placeholders  
   \- Template variables and their sources  
   \- Styling and branding  
   \- A/B test variations  
     
   PROMPT FOR NEXT PASS:  
   "Navigate to each email template workflow and document:  
   \- Template structure  
   \- Dynamic content sources  
   \- Personalization fields  
   \- Footer/header configurations"

7\. SMS MESSAGE TEMPLATES:  
   \- SMS message content and structure  
   \- Character limits and handling  
   \- Dynamic content insertion  
   \- Multi-part message handling  
     
   PROMPT FOR NEXT PASS:  
   "Examine SMS workflows and document:  
   \- Message templates  
   \- Dynamic content sources  
   \- Character count handling  
   \- Delivery status tracking"

8\. ERROR HANDLING:  
   \- Error display mechanisms  
   \- User-facing error messages  
   \- Logging and monitoring  
   \- Fallback behaviors  
   \- Recovery procedures  
     
   PROMPT FOR NEXT PASS:  
   "Search for error-related elements and workflows, document:  
   \- Error capture mechanisms  
   \- Error display logic  
   \- Logging configurations  
   \- User notification of errors"

9\. SECURITY & PERMISSIONS:  
   \- User role definitions  
   \- Permission checks on workflows  
   \- Data access controls  
   \- Privacy settings  
   \- Audit logging  
     
   PROMPT FOR NEXT PASS:  
   "Navigate to Settings \> Privacy & Security and document:  
   \- User role definitions  
   \- Permission matrices  
   \- Data privacy rules  
   \- Security configurations"

10\. INTEGRATIONS DETAILED CONFIG:  
    \- API endpoints and authentication  
    \- Webhook configurations  
    \- Rate limiting settings  
    \- Fallback and retry logic  
    \- Data synchronization schedules  
      
    PROMPT FOR NEXT PASS:  
    "Navigate to API Connector and document:  
    \- All API endpoints configured  
    \- Authentication methods  
    \- Request/response formats  
    \- Error handling  
    \- Rate limits"

\=== MIGRATION PRIORITY MATRIX \===

CRITICAL (Must migrate first):  
1\. Backend workflows (396 workflows) \- Core business logic  
2\. Email system (19 templates) \- Essential communications  
3\. SMS system \- User notifications  
4\. User authentication \- Login/security

HIGH (Migrate early):  
5\. Database schema and relationships  
6\. File upload and processing  
7\. Error handling system  
8\. API integrations (ChatGPT, external services)

MEDIUM (Migrate mid-phase):  
9\. Gemini Nano AI integration  
10\. Phone masking/forwarding  
11\. Popup and UI interactions  
12\. Database visualization tools

LOW (Can migrate later):  
13\. Testing utilities (Button U, etc.)  
14\. Development/debugging tools  
15\. Optional features

\=== CONCLUSION & SUMMARY \===

The z-sharath-test page is a comprehensive testing and staging environment within the Split Lease application. It serves as a quality assurance and development page for validating:

1\. Email communication systems (19 template variations)  
2\. SMS functionality (3 different phone number configurations)  
3\. AI integrations (Gemini Nano, ChatGPT)  
4\. File processing capabilities  
5\. Database operations and visualization  
6\. User authentication flows  
7\. Error handling mechanisms

With 32 page workflows and access to 396 backend workflows, this page represents a critical testing hub that touches nearly every aspect of the Split Lease platform. The page architecture follows a modular design with:

\- Clear separation of concerns (email, SMS, AI, files)  
\- Reusable components and workflows  
\- Comprehensive error handling  
\- Integration with multiple external services  
\- Support for multiple testing scenarios

For migration to code, the development team should:  
1\. Prioritize backend workflow migration (highest complexity)  
2\. Preserve all email template logic and styling  
3\. Maintain SMS masking/forwarding security features  
4\. Replicate AI integration patterns  
5\. Implement comprehensive testing for each migrated component

The estimated complexity of migration:  
\- Backend workflows: HIGH (396 workflows, complex interdependencies)  
\- Email system: MEDIUM (19 templates, well-structured)  
\- SMS system: MEDIUM (straightforward logic, security considerations)  
\- AI integrations: HIGH (external dependencies, API management)  
\- File processing: LOW (standard upload/conversion logic)  
\- UI components: LOW (standard buttons, forms, groups)

Recommended migration timeline:  
\- Phase 1 (Weeks 1-4): Backend workflow analysis and migration planning  
\- Phase 2 (Weeks 5-8): Email and SMS system migration  
\- Phase 3 (Weeks 9-12): AI integrations and file processing  
\- Phase 4 (Weeks 13-16): UI components and final testing

This document provides a foundation for migration. The detailed workflow analysis (suggested in "Areas Requiring Further Investigation") should be completed before beginning code development to ensure all business logic and edge cases are captured.

\=== DOCUMENT METADATA \===

Document Version: 1.0  
Created: January 26, 2026  
Page Analyzed: z-sharath-test  
Source: Split Lease Production \- Bubble App  
Purpose: Migration from Bubble to custom code  
Completeness: High-level complete, detailed analysis pending  
Next Steps: Complete detailed workflow analysis per prompts above

\--- END OF DOCUMENT \---

