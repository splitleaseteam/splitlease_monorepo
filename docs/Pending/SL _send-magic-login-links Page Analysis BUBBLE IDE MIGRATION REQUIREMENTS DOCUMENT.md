BUBBLE IDE MIGRATION REQUIREMENTS DOCUMENT  
\_send-magic-login-links Page Analysis

Document Date: January 13, 2026  
App: Split Lease (Production)  
Page: \_send-magic-login-links

EXECUTIVE SUMMARY

The \_send-magic-login-links page is an administrative tool for generating and sending secure magic login links. This 4-step form allows admins/support staff to:

1\. Search and select specific users from the database  
2\. Choose a destination page where the user will be magically logged in  
3\. Optionally attach relevant data (listings, proposals, leases, house manuals, visits, threads, etc.)  
4\. Send the magic login link with optional phone number override

The page handles 15 different destination pages/workflows for different user types (guests, hosts, admins) and access levels.

PAGE STRUCTURE OVERVIEW

Page Properties:  
\- Name: \_send-magic-login-links  
\- Type: Regular Page (API endpoint)  
\- Responsive Design: Yes (mobile-friendly header)  
\- Theme Color: Purple/Blue corporate branding

Page-Level Statistics:  
\- Total Workflows: 26  
\- Total Form Elements: 15+ input controls  
\- Total Groups/Containers: 8 main groups  
\- Backend Workflows Used: 296+ (app-wide)

MAIN ELEMENTS BREAKDOWN

STEP 1: USER SEARCH & SELECTION

Group: G: search user by any field  
\- Size: W=466, H=67  
\- Elements:  
  1\. IN: Search Anything (Searchbox Input)  
     Placeholder: "Search user using ID, email, name, phone number, etc"  
     Clear button: X icon  
     Filters users by email, name, phone, ID

  2\. I: Clear Search (Link)  
     Resets the search input

Group: G: user selection  
\- Size: W=558, H=439  
\- Elements:  
  1\. D: user selection (Dropdown)  
     Default: "Choose an user..."  
     Populated from filtered user results  
     Shows step "1" indicator with checkmark when selected

  2\. G: Step 1 (Step indicator display)  
  3\. G: Step 1 copy (Backup indicator)

STEP 2: PHONE NUMBER OVERRIDE

Group: G: phone override  
\- Size: W=466, H=67    
\- Optional field  
\- Elements:  
  1\. INL: Phone number override (Multiline Input)  
     Purpose: Alternative phone for SMS redirect  
     Clear button: X icon

  2\. I: Remove date of phone number (Link)  
     Clears the override field

Conditional: Only active after user is selected

STEP 3: PAGE SELECTION

Group: G: page selection step  
\- Size: W=558, H=71  
\- Elements:  
  1\. D: page selection (Dropdown)  
     Default: "Choose a page..."  
     Options: All destination pages in app  
     Shows step "2" indicator with checkmark

  2\. G: Step 2 (Step indicator)  
  3\. G: Step 2 copy (Backup)

Conditional: Enabled after user selection

STEP 4: DATA ATTACHMENT OPTIONS

Group: G: Choose data to send step 3  
\- Size: W=392, H=1684 (VERY LARGE\!)  
\- Purpose: Select optional data to attach  
\- Contains 12+ conditional data selection groups:

  1\. G: Select listing  
     \- Dropdown to select a specific listing

  2\. G: Select proposal    
     \- Two dropdowns: proposal \+ optional thread

  3\. G: Select lease  
     \- Dropdown for lease selection

  4\. G: Select house manual  
     \- Dropdown for house manual

  5\. G: Select visit  
     \- Dropdown for visit/viewing

  6\. G: Select thread  
     \- Optional messaging thread

  7\. G: select user for account page  
     \- User account context

  8\. G: Select virtual meetings  
     \- Virtual meeting link inclusion

  9\. G: favorite listings page sending  
     \- Text: "Favourite listings sending"  
     \- Note: "no need to attach data, just send the link"

  10\. G: Select Date Change Request  
      \- Date change request selection

All visibility is conditional based on selected page

STEP 5: FINAL SEND

Group: G: final sending of link  
\- Purpose: Display and send magic link  
\- Elements:  
  1\. Button: "Send magic login link"  
     \- Purple/Blue color  
     \- Triggers send workflow  
     \- Disabled until all required fields filled

  2\. Step indicator: "4"  
     \- Final step number

  3\. User preview  
     \- Shows selected user's profile photo  
     \- Displays user's first name

PAGE WORKFLOWS (26 Total)

UNCATEGORIZED WORKFLOWS (6):  
1\. Alerts general \[copy\] \- Display general alert messages  
2\. error-alert \[copy\] \[copy\] \- Show error notifications    
3\. information-alert \[copy\] \[copy\] \- Display info messages  
4\. Page is loaded \- Initialization when page loads  
5\. success-alert \[copy\] \[copy\] \- Show success notifications  
6\. warning-alert \[copy\] \[copy\] \- Display warning messages

CUSTOM EVENTS \- MAGIC LOGIN LINK WORKFLOWS (15):  
1\. account-profile-magic-login-link \- Account profile page  
2\. favorite-listings-magic-login-link \- User favorites access  
3\. guest dashboard magic login link \- Guest dashboard  
4\. guest house manual magic login link \- Guest house rules  
5\. guest leases magic login link \- Guest lease access  
6\. host dashboard magic login link \- Host portal  
7\. host house manual magic login link \- Host manual management  
8\. host leases magic login link \- Host lease management  
9\. host-proposals-magic-login-link \- Host proposals/negotiation  
10\. messaging-magic-login-link \- Messaging interface  
11\. purple alert \- Custom alert styling  
12\. rental-app-magic-link \- Rental application access  
13\. self-listing-magic-login-link \- User listing management  
14\. send magic login link (copy) \- Backup send workflow  
15\. view split lease page magic login link \- Split lease browsing

OTHER WORKFLOWS:  
\- Reset Inputs (2) \- Clear form fields, reset selections  
\- Run as User (1) \- Admin assume user context  
\- Send Magic Link (1) \- Primary magic link generation  
\- Set State (1) \- Store page state, maintain form state

KEY CONDITIONALS & EXPRESSIONS

1\. User Search Dropdown:  
   \- Visibility: Based on search input not empty  
   \- Filter: Email contains OR Name contains OR Phone contains OR ID matches  
   \- Updates: Real-time as user types

2\. User Selection Dropdown:  
   \- Default: "Choose an user..."  
   \- Population: Filtered user results  
   \- Conditional: Shows after search has results  
   \- Trigger: Enables page selection when value set

3\. Phone Override Field:  
   \- Conditional: User selected \!= empty  
   \- Optional: Can be left blank  
   \- Type: Multiline text input  
   \- Format: Phone number format (optional validation)

4\. Page Selection Dropdown:  
   \- Conditional: D: user selection \!= empty  
   \- Population: All available destination pages  
   \- Trigger: Determines which data fields appear in Step 4

5\. Data Selection Groups (Step 4):  
   \- Master Conditional: D: page selection \!= empty  
   \- Individual visibility logic:  
     \* If page \= "listing details" → Show "Select Listing"  
     \* If page \= "proposals" → Show "Select Proposal" \+ thread  
     \* If page \= "lease" → Show "Select Lease"  
     \* If page \= "messaging" → Show "Select Thread"  
     \* If page \= "house manual" → Show "Select House Manual"  
     \* And similar for other pages

6\. Send Button:  
   \- Enabled when: User \!= empty AND Page \!= empty  
   \- Validation: Required fields for selected page filled  
   \- Disabled state: While processing

BACKEND INTEGRATION

Total Backend Workflows in App: 296

Key Categories Used:  
\- Core \- Notifications (1) \- Email/SMS sending  
\- Core \- User Management (5) \- Auth, sessions  
\- Data Management (5) \- Data retrieval  
\- Masking & Forwarding (11) \- Phone masking  
\- Messaging System (52) \- Message handling  
\- Proposal Workflows (17) \- Proposal data  
\- Leases Workflows (11) \- Lease management  
\- Listing workflows (15) \- Listing data  
\- Virtual Meetings (6) \- Meeting links  
\- House Manual Visitors (13) \- Access control  
\- And many more supporting categories

ARCHITECTURE NOTES

1\. Magic Link Generation:  
   \- User selection triggers context setup  
   \- Page selection determines data payload  
   \- Data selection provides context  
   \- Backend creates secure token  
   \- Link includes token \+ context ID

2\. Phone Number Override:  
   \- Optional alternative contact method  
   \- Integrates with SMS/notification system  
   \- If set, overrides user's default phone  
   \- Uses masking & forwarding backend

3\. Step Indicators:  
   \- Visual progress tracking  
   \- Numbered 1-4 with checkmarks  
   \- Help user understand form flow  
   \- Show completion status

4\. Data Conditioning:  
   \- Dropdowns populate from related tables  
   \- Example: User \-\> Their Listings, Proposals, Leases  
   \- Access control: Only user's data shown  
   \- Required vs optional based on page

AREAS REQUIRING DETAILED SECOND PASS

1\. Expression Analysis:  
   \- Exact search filter expression  
   \- Dropdown population data sources  
   \- Conditional visibility booleans  
   \- State variable names

2\. Workflow Details:  
   \- Actions within each custom event  
   \- Email/SMS templates  
   \- Token generation algorithm  
   \- Error handling logic

3\. Database:  
   \- Exact tables and relationships  
   \- Filter conditions per dropdown  
   \- Data returned per option

4\. Security:  
   \- Token format and expiration  
   \- Authorization checks  
   \- Rate limiting  
   \- Audit logging

5\. Validation:  
   \- Required field logic per page  
   \- Cross-field validation  
   \- Error messages

CONCLUSION

This page is a sophisticated multi-step form that requires integration with 26 frontend workflows and multiple backend systems. The complexity lies in the conditional data attachment logic where different pages require different data fields. The page successfully abstracts a complex multi-user, multi-destination authentication system into a clean 4-step UI.

For complete code migration, a second pass should focus on extracting the exact expressions, validation logic, and workflow sequences from each custom event.

