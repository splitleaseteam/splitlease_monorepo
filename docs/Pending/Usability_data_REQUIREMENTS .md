BUBBLE APP REQUIREMENTS \- \_usability-data PAGE

OVERVIEW

This is a comprehensive migration specification for the \_usability-data page from Bubble to code. The page is designed as a testing utility for usability testing and data management within the Split Lease application.

PAGE TITLE  
"Usability Test Data Deletion & Creation"

PAGE DIMENSIONS  
Width: 1440px  
Height: 2015px  
Fixedwidth layout

SECTION 1: DELETE HOST ACCOUNT DATA

Purpose: Enable bulk deletion of host account data for testing purposes

Elements:  
1\. Dropdown: "Choose A Host Account"  
   \- Type: Combobox  
   \- Placeholder: "Choose A Host Account"  
   \- Dynamic data source: Database search  
   \- Triggers workflow when changed

2\. Email Display Field: "Insert Host Email Address"  
   \- Type: Text input (readonly)  
   \- Displays email of selected host  
   \- Auto-populated from dropdown selection

3\. Button: "Clear threads, proposals and data on selected Host"  
   \- Color: Dark purple (\#2B1D5F approximately)  
   \- Action: Triggers backend workflow to delete all associated data  
   \- Position: Right side of form

4\. Button: "Delete Listings of selected Host"  
   \- Color: Dark blue/navy  
   \- Action: Triggers workflow to delete all listings  
   \- Position: Far right

5\. Button: "Delete Host Usability Test Status & Steps"  
   \- Color: Dark purple  
   \- Action: Clears test status tracking data  
   \- Position: Below email field

SECTION 2: DELETE GUEST ACCOUNT DATA

Purpose: Mirror functionality for guest accounts

Elements:  
1\. Dropdown: "Choose a Guest Account"  
   \- Similar to host dropdown  
   \- Dynamic data source

2\. Email Display Field: "Insert Guest Email Address"  
   \- Readonly text display  
   \- Auto-populated from selection

3\. Button: "Clear Threads, Proposals & Data on Selected Guest"  
   \- Dark purple background  
   \- Right-aligned

4\. Button: "Delete Guest Usability Test Status & Steps"  
   \- Dark purple  
   \- Below email field

SECTION 3: QUICK PROPOSAL CREATION

Purpose: Create test proposals for usability testing with custom parameters

Core Input Fields:

1\. Listing Selection  
   \- Input: "Enter Listing ID" (text field)  
   \- Label: "listing unique ID \- START BY SELECTING A LISTING"  
   \- Action: Populated by user or search

2\. Guest Selection  
   \- Dropdown: "Choose a guest"  
   \- Dynamic user search  
   \- Selection triggers: Email field population

3\. Guest Email  
   \- Input: "insert guest email"  
   \- Type: Readonly text field  
   \- Auto-populated from guest selection

4\. Move-in Date  
   \- Input: "Move-in From"  
   \- Type: Date picker  
   \- Icon: Calendar icon

5\. Reservation Days Selector  
   \- Buttons for days of week: S, M, T, W, T, F, S  
   \- Each button is toggleable  
   \- "Select Full Time" link: Selects all days

6\. Reservation Span Dropdown  
   \- Options: "Reservation Span" (default shown as "13 weeks (3 months)")  
   \- Dropdown trigger changes proposal calculations  
   \- Set Button: Calculation trigger  
   \- Message: "You need to click on this button or change the dropdown above in order to calculate proposal prices properly"

Calculated Display Fields (Right Panel):

1\. "Guest Desired Pattern:" \- Displays selected day pattern  
2\. "T: 4 x weeks' rent:" \- Shows 4-week rent calculation (displays: "4 weeks rent: 0")  
3\. "Actual Reservation Span" \- Text field showing span  
4\. "Actual \# of Weeks" \- Numeric display  
5\. "Initial Payment" \- Calculated numeric (shows: "0")  
6\. "Nightly price" \- Extracted from listing  
7\. "Total Reservation Price:" \- Final calculation (shows: "0")

Metadata Display:  
\- "Recently Created Proposal ID: Search for Proposals:first item's unique id"  
\- "Recently Create Thread ID: Search for \~Thread / Conversations:first item's unique id"

Create Button:  
\- "create proposal reusable element" (dark purple)  
\- Launches reusable element popup for proposal creation

Listing Preview (Right Side):  
\- Displays first photo from listing features  
\- Displays last photo from listing features    
\- Displays listing name  
\- Shows "Parent group's Listing's Features \- Photos"

SECTION 4: QUICK PROPOSAL DELETION

Purpose: Quick deletion of test proposals

Elements:  
1\. Input: "Enter Proposal ID"  
   \- Textarea for proposal identifier  
   \- Readonly display

2\. Label: "Enter ID of Proposal you want to delete:"

3\. Button: "Delete"  
   \- Bright red background  
   \- Action: Triggers deletion workflow

PAGE LAYOUT STRUCTURE

Elements Tree:  
\- T: Usability Test Data Deletion & Creation (main heading)  
\- ♻️💥create-proposal-flow A (reusable element popup)  
\- T: Delete Host Account Data (section heading)  
\- G: Delete data from host account (group container)  
\- T: Delete Guest Account Data (section heading)  
\- G: Delete Guest Account Data (group container)  
\- G: Listing (listing preview group)  
\- T: Quick Proposal Creation (section heading)  
\- G: Listing Unique ID (group)  
\- G: Listing Guest (group)  
\- T: Proposal Deletion (section heading)  
\- G: Delete Proposal (group container)

FRONTEND WORKFLOWS (On This Page)

Workflow 1: Page is loaded  
Event: Page is loaded  
Steps:  
1\. Run javascript HIDE crisp chat on mobile  
   \- Script: window.$crisp.push(\["do", "chat:hide"\]);  
   \- Purpose: Hide Crisp chat widget on mobile devices  
   \- Async: Yes

Workflow 2: Custom Event \- "purple alert (copy)"  
Event: purple alert (copy) is triggered  
Parameters:  
\- content (text, required): Alert body message  
\- title (text, required): Alert title/header  
Steps:  
1\. AirAlert \- Custom: Display custom alert with parameters  
   \- Uses the purple alert styling

Workflow 3: B: Create proposal reusable is clicked  
Event: B: create proposal reusable is clicked    
Elements: B: create proposal reusable button  
Condition: None (always triggers)  
Steps:  
1\. Set state days selected of ♻️💥 create-proposal-flow A  
   \- Sets initial state for day selection  
   \- No specific value shown in UI

2\. Set state guest user... of ♻️💥 create-proposal-flow A  
   \- Custom state: "guest user"  
   \- Value: Search for Users:first item  
   \- Condition: Only when IN: insert guest email's value is not empty

3\. Show ♻️💥 create-proposal-flow A  
   \- Action: Display the proposal creation reusable element popup

Workflow 4: B: Delete Proposal is clicked-Delete...  
Event: B: Delete Proposal button clicked (inferred from name)  
Action: Delete proposal based on entered ID

Workflow 5: Set Focus to  
Event/Category: Set Focus to (1 workflow)  
Purpose: Focus management on form inputs

Workflow 6: Set Reservation  
Event/Category: Set Reservation (3 workflows)  
Purpose: Manage reservation span calculations and updates

Workflow 7: Set State  
Event/Category: Set State (1 workflow)  
Purpose: Update component state variables

Workflow 8: User Data-Modify  
Event/Category: User Data-Modify (5 workflows)  
Purpose: Backend data modification workflows triggered from UI

BACKEND WORKFLOWS (Called by this page)

Note: The app has 296 total backend workflows. The \_usability-data page likely calls:

1\. Data deletion workflows for hosts and guests  
2\. Proposal creation workflow  
3\. Proposal deletion workflow  
4\. User data modification workflows  
5\. Thread/Conversation creation workflows

Specific backend workflows not fully detailed in this spec \- requires examination of the backend workflow definitions.

CONDITIONAL RENDERING & STATE MANAGEMENT

Reusable Element: ♻️💥create-proposal-flow A  
\- Type: Popup (cannot be closed with Escape key)  
\- Width: 490px  
\- Height: 2034px  
\- Grayout: Black (\#000000), blur 0  
\- ID Attribute: "popupeffect"  
\- Purpose: Main proposal creation form  
\- Contains: Full proposal calculation and creation interface

DROPDOWN DATA SOURCES

1\. Host Account Dropdown  
   \- Source: Database query for User/Account records  
   \- Filters: Likely user type \= "Host"  
   \- Display: Email or account identifier

2\. Guest Account Dropdown  
   \- Source: Database query for User/Account records  
   \- Filters: Likely user type \= "Guest"  
   \- Display: Email or name

3\. Listing Dropdown/Autocomplete  
   \- Source: Listings database  
   \- Input: Listing ID  
   \- Returns: Listing object with name, photos, pricing

DATA BINDING & EXPRESSIONS

Email Fields:  
\- Bind to: Dropdown selection value's email property  
\- Update: Reactive \- changes when dropdown changes

Proposal Calculations:  
\- 4 weeks rent: \[Listing nightly\_price \* selected\_days\_per\_week \* 4\]  
\- Actual Reservation Span: User selection or calculated  
\- Initial Payment: \[Listing min\_initial\_payment or calculated\]  
\- Total Reservation Price: \[4\_weeks\_rent \+ additional\_weeks\]

Guest Pattern Display:  
\- Binds to: Selected days of week buttons state  
\- Format: "SMTWTFS" with selected days highlighted

UI INTERACTIONS & EXPECTED BEHAVIOR

1\. Host Deletion Flow:  
   \- User selects host from dropdown  
   \- Email auto-populates  
   \- User clicks "Clear threads..."  
   \- Confirmation or direct execution  
   \- Data deleted from backend

2\. Guest Deletion Flow:  
   \- Mirror of host flow  
   \- Separate buttons for different data types

3\. Proposal Creation Flow:  
   \- User enters/selects listing ID  
   \- Selects guest  
   \- Chooses move-in date  
   \- Selects days of week  
   \- Sets reservation span  
   \- Clicks Set button  
   \- Prices calculate  
   \- Clicks create button  
   \- Popup opens with form  
   \- Proposal is created in backend

4\. Proposal Deletion Flow:  
   \- User enters proposal ID  
   \- Clicks Delete button  
   \- Proposal deleted

VISUAL STYLING

Color Scheme:  
\- Primary Buttons: Dark purple (\#2B1D5F approx)  
\- Danger Button (Delete Proposal): Red  
\- Input Fields: Light gray background  
\- Text: Dark gray/black  
\- Container Borders: Light gray

Typography:  
\- Section Headings: Bold, larger font  
\- Labels: Regular, smaller font  
\- Button Text: Bold, white or light text

SPACING & LAYOUT  
\- Two-column layout for host/guest sections  
\- Right sidebar for proposal details and listing preview  
\- Vertical stacking of sections

RESPONSIVE BEHAVIOR

The page uses "Responsive" toggle in Bubble editor  
Page is marked as native app (non-responsive mobile version)  
Desktop-first design  
Breakpoints: Not detailed in this spec

INTENT & FUNCTION SUMMARY

This page serves as a development/testing utility for:  
1\. Rapid test data cleanup (bulk deletion of accounts and associated data)  
2\. Quick proposal generation with custom parameters for usability testing  
3\. Testing edge cases in proposal creation and calculation  
4\. Managing test user data and threads

CRITICAL UNKNOWNS FOR FULL IMPLEMENTATION

1\. Backend Workflow Details:  
   \- Exact endpoints and parameters for deletion workflows  
   \- Search filters used in dropdowns (host vs guest identification)  
   \- Cascade deletion logic (what gets deleted with an account)

2\. Data Model Details:  
   \- User table structure and type field  
   \- Listing table structure and fields  
   \- Proposal table structure and relationships  
   \- Pricing calculation formulas (nightly rate, deposit, etc.)

3\. Validation & Error Handling:  
   \- What happens when invalid IDs are entered  
   \- Confirmation dialogs for destructive operations  
   \- Error messages and user feedback

4\. State Variables:  
   \- Complete definition of custom states in reusable element  
   \- Default values  
   \- State persistence

5\. Search Queries:  
   \- Exact search expressions for dropdowns  
   \- Filtering and sorting logic  
   \- Performance considerations for large datasets

NEXT STEPS FOR DETAILED REQUIREMENTS

1\. Examine each backend workflow individually:  
   \- Click into "Backend Workflows" section  
   \- Filter or search for workflows called by this page  
   \- Document each workflow's trigger, parameters, and actions

2\. Examine the reusable element "create-proposal-flow A":  
   \- Document all internal workflows within the reusable element  
   \- Document all custom states and their purposes  
   \- Document all binding expressions

3\. Perform test interactions:  
   \- Test each dropdown to see search behavior  
   \- Test proposal creation with various inputs  
   \- Check calculation accuracy  
   \- Test error cases

4\. Extract search expressions:  
   \- For each dropdown, get the exact search query  
   \- Document constraints and filters  
   \- Note any custom sorting

5\. Data flow documentation:  
   \- Create a diagram of data relationships  
   \- Document which fields are required vs optional  
   \- Note any data transformations

