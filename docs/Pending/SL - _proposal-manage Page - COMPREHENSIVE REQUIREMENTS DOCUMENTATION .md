COMPREHENSIVE REQUIREMENTS DOCUMENTATION \- \_proposal-manage Page

\=== EXECUTIVE SUMMARY \===

The \_proposal-manage page is a comprehensive proposal management interface for the Split Lease platform.  
 It serves as the central hub for viewing, filtering, sorting, and managing rental proposals between guests and hosts. The page displays a list of active proposals with detailed information and allows quick creation of new suggested proposals.

Page Title: "Quick Proposal Modifier"  
Page URL: app.split.lease/\_proposal-manage  
Database Content Type: Proposal  
Database Query: "Search for Proposals"

\=== PAGE SECTIONS \===

1\. HEADER AREA  
   \- Page title/heading: "Proposals: RG: Proposals's List of Proposals:count results"  
   \- Displays dynamic count of current proposals  
   \- Button: "Create Suggested Proposal" (blue button)  
   \- Button: "Go to relationships" (purple outline button)  
   \- Also has a "Change Prices" button in the top right (white button)

2\. FILTERING SECTION  
   Structured as a bordered container with multiple filter inputs arranged in a grid:  
     
   Row 1 \- Four parallel filters:  
   a) Filter by Guest  
      \- Element: Searchbox  
      \- Placeholder: "Search Guest Name, email, phone number"  
      \- Type: Searchbox with autocomplete  
      \- Clear button: X icon  
      \- Bindings: Likely bound to RG: Proposals source search  
        
   b) Filter by host  
      \- Element: Searchbox  
      \- Placeholder: "Search Host Name, email, phone number"  
      \- Type: Searchbox with autocomplete  
      \- Clear button: X icon  
      \- Bindings: Likely bound to RG: Proposals source search  
        
   c) Filter for proposal status  
      \- Element: Dropdown  
      \- Default/placeholder: "Filter by proposal status"  
      \- Options (15 total):  
        \* Proposal Submitted for guest by Split Lease \- Awaiting Rental Application  
        \* Proposal Submitted by guest \- Awaiting Rental Application  
        \* Proposal Submitted for guest by Split Lease \- Pending Confirmation  
        \* Host Review  
        \* Host Counteroffer Submitted / Awaiting Guest Review  
        \* Proposal or Counteroffer Accepted / Drafting Lease Documents  
        \* Lease Documents Sent for Review  
        \* Lease Documents Sent for Signatures  
        \* Lease Documents Signed / Awaiting Initial payment  
        \* Initial Payment Submitted / Lease activated  
        \* Proposal Cancelled by Guest  
        \* Proposal Rejected by Host  
        \* Proposal Cancelled by Split Lease  
        \* Guest Ignored Suggestion  
        \* (empty option)  
      \- Clear button: X icon  
        
   d) Sort by Proposal Modified Date area  
      \- Label: "Sort by Proposal Modified Date"  
      \- Direction controls: Up/down arrow buttons  
      \- Date range display: "Display Proposal Modified Between Dates:"  
        
   Row 2 \- Two additional filters:  
   e) Filter by Proposal unique ID  
      \- Label: "Filter by Proposal unique ID"  
      \- Element: Textbox  
      \- Placeholder: "search by ID"  
      \- Attributes: readonly  
      \- Note: Despite readonly attribute, this appears to be functional in the interface  
        
   f) Filter by listing (name, rental type, unique id)  
      \- Label: "Filter by listing (name, rental type, unique id)"  
      \- Element: Searchbox  
      \- Placeholder: "Search Listing by name, unique id, rental type"  
      \- Type: Searchbox with autocomplete  
      \- Clear button: X icon  
     
   Row 3:  
   g) Clear all button  
      \- Type: Button with border  
      \- Text: "Clear all"  
      \- Function: Resets all filters to default values

3\. DATE RANGE FILTER  
   \- Label: "Display Proposal Modified Between Dates:"  
   \- Start date: Date picker (readonly) \- current value: 1/13/2026  
   \- End date: Date picker (readonly) \- current value: 11/14/2025  
   \- Separator: "-" (hyphen)  
   \- Note: Both date pickers are set to readonly, indicating dates may be set programmatically

4\. MAIN CONTENT AREA \- PROPOSALS LIST  
   \- Container: RG: Proposals (Repeating Group)  
   \- Data type: Proposal  
   \- Data source: "Search for Proposals" (dynamic query)  
   \- Layout: Single column, full-width rows  
   \- Each row displays:  
     \* Guest information (profile photo, name, email, phone, usability tester status)  
     \* Guest's about/bio text  
     \* Nightly price  
     \* Total price for reservation  
     \* Weekly schedule (days of week: S, M, T, W, T, F, S)  
     \* Reservation span in weeks  
     \* Move-in date  
     \* Proposal status (dropdown showing current status)  
     \* Proposal ID  
     \* Modified and Created dates  
     \* Host information (profile photo, name, email, phone, usability tester status)  
     \* Listing name  
     \* Address  
     \* Damage deposit amount  
     \* Cleaning cost amount  
     \* Host compensation  
     \* Total compensation  
     \* Listing last modified date  
     \* Listing unique ID  
     
   \- Action buttons per proposal:  
     \* "View listing (internal)" \- link button  
     \* "Modify Terms as Host" \- action button  
     \* "Modify Terms as Guest" \- action button  
     \* "Send reminder to guest" \- action button  
     \* "Send reminder to host" \- action button  
     \* "Cancel Proposal by SplitLease" \- red danger button

5\. QUICK PROPOSAL CREATION SECTION  
   \- Container: G: creation of proposal suggested (Group)  
   \- Title: "Quick Proposal Creation"  
   \- Two-column layout with step indicators (1 and 2\)  
   \- Step 1 (Left column):  
     \* Circle badge: "1"  
     \* Label: "Filter by host name, email, listing name, unique id of listing, etc"  
     \* Searchbox: "Search Host Name, email, listing name, unique id, rental type"  
     \* Display area showing:  
       \- Parent group's Listing's Name  
       \- Parent group's Listing's Features \- Photos:first item's Photo  
       \- Parent group's Listing's Features \- Photos:last item's Photo  
     
   \- Step 2 (Right column):  
     \* Circle badge with checkmark: "✓" and number "2"  
     \* Label: "Filter by Guest"  
     \* Searchbox: "Search Guest Name, email, phone number"  
     \* Display area showing:  
       \- Parent group's User's Name \- First  
       \- Parent group's User's Profile Photo  
     \* "Select User" button (purple button)  
     
   \- Additional sections within the creation flow:  
     \* "Tell us about \[Guest's Name\]:" \- text input  
       \- Placeholder: "Parent User's About Me / Bio"  
     \* "Why does \[Guest's Name\] want this space?" \- text area  
       \- Placeholder: "Parent User's need for Space"  
     \* "Write \[Guest's Name\] unique requirements" \- text area  
       \- Placeholder: "Parent User's special needs"  
     \* "Proposal status" dropdown  
       \- Options: Same as main filter dropdown  
     \* "Move-in From" date picker (readonly)  
     \* "Move-in Range" \- Reservation Span selector  
     \* "Select Full Time" button/control  
     \* Checkbox: "Strict (no negotiation on exact move in)"  
     \* "Reservation Span" input \- \# of Weeks  
     \* Pricing display section:  
       \- Price per night (calculated)  
       \- Guest Desired Pattern display  
       \- 4 x weeks' rent calculation  
       \- Actual Reservation Span  
       \- Actual \# of Weeks during 4 weeks  
       \- Initial Payment amount  
       \- Nightly price  
       \- Total Reservation Price  
       \- Reservation price breakdown (nested table)  
       \- Number of nights  
       \- Price per night  
       \- Number of weeks  
       \- Total price for Reservation  
       \- Price per 4 weeks  
       \- Security Deposit  
       \- Cleaning Cost  
       \- Price to book first month  
     \* "create proposal" button  
     \* Confirmation section after creation:  
       \- "Recently Created Proposal ID: \[ID\]"  
       \- "Recently Create Thread ID: \[ID\]"  
       \- "Go To Create Another Proposal" button  
     \* "Confirm Proposal Creation" button

\=== ELEMENT TREE STRUCTURE \===

Main Page: \_proposal-manage  
├── Overlays  
│   ├── \*P: Proposal Delete  
│   ├── \*P: reminder to guest and host  
│   └── \_Corporate Header A  
├── Reusable Elements (instances)  
│   ├── ♻️💥host-editing-proposal A  
│   ├── ♻️💥guest-editing-proposal A  
│   └── ♻️💥create-proposal-flow A  
├── FG: Main page group (Main container group)  
│   ├── Layers section containing:  
│   ├── G: creation of proposal suggested (Step 1 & 2 proposal creation)  
│   │   ├── T: Quick Proposal Creation (Title)  
│   │   ├── G: listing selection (Search for host/listing)  
│   │   ├── G: user selection (Search for guest/user)  
│   │   └── G: suggested proposal whole section  
│   │       ├── "Tell us about" text input  
│   │       ├── "Why wants space" text area  
│   │       ├── "Unique requirements" text area  
│   │       ├── Proposal status dropdown  
│   │       ├── Move-in date picker  
│   │       ├── Reservation Span section  
│   │       │   ├── Date range calendar selector  
│   │       │   ├── Select Full Time button  
│   │       │   ├── \# of Weeks input  
│   │       │   └── Pricing information displays  
│   │       ├── "create proposal" button  
│   │       ├── "Confirm Proposal Creation" button  
│   │       └── Confirmation/success messages  
│   │  
│   └── RG: Proposals (Main repeating group \- displays proposal list)  
│       ├── Filtering section (above RG)  
│       │   ├── Filter by Guest (searchbox)  
│       │   ├── Filter by host (searchbox)  
│       │   ├── Filter for proposal status (dropdown)  
│       │   ├── Sort by Proposal Modified Date area  
│       │   ├── Filter by Proposal unique ID (textbox)  
│       │   ├── Filter by listing (searchbox)  
│       │   ├── Date range filter (start \- end date)  
│       │   └── Clear all button  
│       │  
│       └── Proposal item rows (repeated for each proposal)  
│           ├── Guest section  
│           │   ├── Profile photo  
│           │   ├── Name \- First \+ Last  
│           │   ├── Email  
│           │   ├── Phone Number  
│           │   ├── Is Usability Tester status  
│           │   └── About/Bio text  
│           ├── Listing section  
│           │   ├── Listing Name  
│           │   ├── Listing Features (Photos)  
│           │   ├── Address  
│           │   ├── Damage Deposit  
│           │   ├── Cleaning Cost  
│           │   └── Listing unique ID  
│           ├── Pricing section  
│           │   ├── Nightly Price  
│           │   ├── Total Price for Reservation  
│           │   ├── Host Compensation  
│           │   └── Total Compensation  
│           ├── Schedule/Dates section  
│           │   ├── Weekly Schedule (S,M,T,W,T,F,S days)  
│           │   ├── Check-in date  
│           │   ├── Check-out date  
│           │   └── Reservation Span (weeks)  
│           ├── Move-in information  
│           │   └── Move-in From date  
│           ├── Proposal Status section  
│           │   ├── Status label  
│           │   ├── Status dropdown  
│           │   ├── Proposal ID  
│           │   ├── Modified date  
│           │   └── Created date  
│           ├── Host section  
│           │   ├── Profile photo  
│           │   ├── Name \- First \+ Last  
│           │   ├── Email  
│           │   ├── Phone Number  
│           │   └── Is Usability Tester status  
│           ├── House Rules section  
│           │   └── Repeating group of rules with names  
│           └── Action buttons  
│               ├── View listing (internal) link  
│               ├── Modify Terms as Host button  
│               ├── Modify Terms as Guest button  
│               ├── Send reminder to guest button  
│               ├── Send reminder to host button  
│               └── Cancel Proposal by SplitLease button

\=== UI ELEMENTS SUMMARY \===

Searchboxes (Autocomplete enabled):  
1\. Filter by Guest \- triggers RG: Proposals search  
2\. Filter by host \- triggers RG: Proposals search  
3\. Filter by listing \- triggers RG: Proposals search  
4\. Listing selection in creation flow \- for selecting host/listing  
5\. User selection in creation flow \- for selecting guest

Dropdowns:  
1\. Filter for proposal status \- filters RG: Proposals  
2\. Proposal status \- within each proposal item row  
3\. Proposal status \- within creation flow

Date Pickers:  
1\. Start date for date range filter (readonly)  
2\. End date for date range filter (readonly)  
3\. Move-in From \- within proposal item rows  
4\. Move-in From \- within creation flow

Textboxes/Text Inputs:  
1\. Filter by Proposal unique ID (readonly)  
2\. "Tell us about" field  
3\. "Why wants space" field  
4\. "Unique requirements" field  
5\. \# of Weeks input

Text Areas:  
1\. "Why does \[Guest\] want this space?"  
2\. "Write \[Guest\] unique requirements"

Checkbox:  
1\. "Strict (no negotiation on exact move in)"

Buttons:  
1\. Create Suggested Proposal (blue, primary)  
2\. Go to relationships (purple outline)  
3\. Clear all (border button)  
4\. Select User (purple, in creation flow)  
5\. Select Full Time (in creation flow)  
6\. create proposal (in creation flow)  
7\. Confirm Proposal Creation (in creation flow)  
8\. Go To Create Another Proposal (in creation flow)  
9\. View listing (internal) (link button)  
10\. Modify Terms as Host (action button)  
11\. Modify Terms as Guest (action button)  
12\. Send reminder to guest (action button)  
13\. Send reminder to host (action button)  
14\. Cancel Proposal by SplitLease (red danger button)

\=== WORKFLOWS (ON THIS PAGE) \===

Total page workflows: 49  
Breakdown by category:

UNCATEGORIZED: 18  
\- B: create proposal FINAL is clicked  
\- B: create proposal reusable is clicked  
\- B: go to create another proposal is clicked (2x)  
\- B: Modify Proposal Terms as HOST is clicked  
\- B: send reminder is clicked  
\- Button Select User is clicked  
\- D: Reservation Span view listing's value is changed- Filter Listings by Reservation Span  
\- Dropdown B value changed  
\- I: clear listing search is clicked  
\- I: hide suggested proposals is clicked  
\- I: Reservation Span is clicked \-Set Focus on Reservation Span View Listing  
\- IN: Enter \# of Weeks's value is changed-Filter Proposals by Reservation Span in Weeks  
\- MD: search listings SUGGESTED value changed  
\- Page is loaded (Get proposal from page URL is not empty)  
\- T: guest info is clicked  
\- T: host info is clicked  
\- T: Select Full Time is clicked

CATEGORIZED WORKFLOWS:  
\- Copy to Clipboard: 2  
\- Custom Events: 4  
\- Notifications: 2  
\- Page is loaded: 2  
\- Proposal-Create/Modify: 1  
\- Proposal-Delete: 5  
\- Reset Fields: 5  
\- Set State: 4  
\- Show/Hide Elements: 6

KEY WORKFLOWS OBSERVED:

1\. Page is loaded (when "Get proposal from page URL is not empty")  
   Actions:  
   \- Scroll to RG: Proposals  
   \- Scroll to entry of RG: Proposals  
   Purpose: Auto-navigates to the proposals list when a proposal ID is passed via URL parameter

2\. Filter by Guest search (searchbox value changed)  
   Purpose: Dynamically filters the RG: Proposals datasource based on guest search input

3\. Filter by host search (searchbox value changed)  
   Purpose: Dynamically filters the RG: Proposals datasource based on host search input

4\. Dropdown B value changed (Proposal status filter)  
   Purpose: Filters proposals by selected status

5\. Clear all button clicked  
   Purpose: Resets all filter values to defaults

6\. Sort controls  
   Purpose: Sorts proposals by modified date (ascending/descending)

7\. Create Proposed Proposal Final (B: create proposal FINAL is clicked)  
   Purpose: Main trigger for creating a new proposal with all the filled information  
   Expected actions: Validation, data submission, success/error handling

8\. Modify Terms as Host (B: Modify Proposal Terms as HOST is clicked)  
   Purpose: Opens the host-editing-proposal reusable element

9\. Send Reminder workflows  
   Purpose: Triggers reminder notifications to guest or host

10\. Cancel Proposal workflow  
    Purpose: Cancels the proposal and updates status

11\. Date range filter workflows  
    Purpose: Filters proposals by modified date range

\=== BACKEND WORKFLOWS \===

Total app backend workflows: 296 (Note: This is app-wide, not just this page)

KEY CATEGORIES FOR PROPOSAL MANAGEMENT:  
1\. Proposal Workflows: 17 workflows  
2\. Leases Workflows: 11 workflows  
3\. Price Calculations: 15 workflows  
4\. Messaging System: 52 workflows  
5\. Data Management: 5 workflows  
6\. Code Based API Calls: 14 workflows

Other relevant categories:  
\- Core \- User Management: 5  
\- Core \- Notifications: 1  
\- Bulk Fix: 48  
\- ChatGPT: 7  
\- Date change requests: 9  
\- House Manual Visitors handling: 13  
\- Listing workflows: 15  
\- System: 15  
\- Masking & Forwarding: 11

\=== DATA BINDINGS & EXPRESSIONS \===

RG: Proposals Data Source:  
\- Query: "Search for Proposals"  
\- Filters applied dynamically based on:  
  1\. Guest filter value (searchbox)  
  2\. Host filter value (searchbox)  
  3\. Status filter value (dropdown)  
  4\. Proposal ID filter value (textbox)  
  5\. Listing filter value (searchbox)  
  6\. Date range (start and end dates)  
  7\. Sort order and sort field

Display expressions within proposal rows:  
\- Guest Name: Parent group's Proposal's Guest's Name \- First/Last  
\- Guest Email: Parent group's Proposal's Guest's email  
\- Guest Phone: Parent group's Proposal's Guest's Phone Number (as text)  
\- Host Name: Parent group's Proposal's Listing's Host / Landlord's User's Name \- First/Last  
\- Host Email: Parent group's Proposal's Listing's Host / Landlord's User's email  
\- Listing Name: Parent group's Proposal's Listing's Name  
\- Address: Parent group's Proposal's Listing's Location \- Address's formatted address  
\- Proposal Status: Parent group's Proposal's Status's Display  
\- Proposal ID: Parent group's Proposal's unique id  
\- Modified Date: Parent group's Proposal's Modified Date  
\- Created Date: Parent group's Proposal's Creation Date  
\- Damage Deposit: Parent group's Proposal's Listing's 💰Damage Deposit  
\- Cleaning Cost: Parent group's Proposal's Listing's 💰Cleaning Cost / Maintenance Fee  
\- Nightly Price: Parent group's Proposal's Listing Nightly Price  
\- Total Reservation Price: Parent group's Proposal's Total Reservation Price  
\- Host Compensation: Calculated from listing and reservation details  
\- Reservation Span: Parent group's Proposal's Reservation Span's Weeks in this Period  
\- Check-in: Parent group's Proposal's check in day's Display  
\- Check-out: Parent group's Proposal's check out day's Display  
\- Weekly Schedule: Seven day cells displaying selected days

Creation Flow Expressions:  
\- Parent group's Listing's Name  
\- Parent group's Listing's Features \- Photos:first item's Photo  
\- Parent group's Listing's Features \- Photos:last item's Photo  
\- Parent group's User's Name \- First  
\- Parent group's User's Profile Photo  
\- Clone2-listing schedule selector-right panel's Listing's unique id  
\- Clone2-listing schedule selector-right panel's Guest Desired Pattern's Display  
\- Clone2-listing schedule selector-right panel's 4 Week Rent  
\- Clone2-listing schedule selector-right panel's Actual Weeks During Reservation Span  
\- Clone2-listing schedule selector-right panel's Initial Reservation Payment  
\- Clone2-listing schedule selector-right panel's Listing Nightly Price  
\- Clone2-listing schedule selector-right panel's Total Reservation Price  
\- G: Weeks in the selection period's number

\=== CONDITIONAL LOGIC \===

Key conditional elements identified:

1\. Proposal Status Dropdown  
   \- Shows current proposal status  
   \- Conditional: Displays different status options based on proposal state  
   \- Type: Conditional visibility/display based on current proposal status

2\. Filter visibility  
   \- Clear all button: Shows when at least one filter has a value  
   \- Filter sections: May have conditional visibility

3\. Creation flow sections  
   \- Conditional display based on step completion  
   \- Guest info section shows only after guest is selected  
   \- Proposal details show only after both host/listing and guest are selected

4\. Button visibility on proposal rows  
   \- "Modify Terms as Host" \- may be conditional on proposal status  
   \- "Cancel Proposal" \- may be conditional on proposal status  
   \- "Modify Terms as Guest" \- may be conditional on user role/status

5\. Date picker conditionals  
   \- Move-in date: set based on selected dates in reservation span  
   \- Date range filters: readonly attributes suggest programmatic setting

\=== IMPORTANT NOTES & UNKNOWNS \===

What I'm confident about:  
1\. Page structure and layout  
2\. Element hierarchy and naming conventions  
3\. Filter types and interactions  
4\. Workflow event triggers and naming  
5\. Data source and basic bindings  
6\. Button actions and navigation flows  
7\. Repeating group setup and content  
8\. Backend workflow categories

What requires additional investigation:  
1\. EXACT conditions for each workflow (detailed conditions on each action)  
2\. Precise filter expressions in RG: Proposals datasource  
3\. Conditional visibility rules for specific elements  
4\. Custom JavaScript or plugin usage within elements  
5\. All action steps within each workflow (some only show triggers)  
6\. Specific API calls or data operations triggered by buttons  
7\. State management and page-level state usage  
8\. Plugin usage (Calendar, custom components, etc.)  
9\. Exact validation rules for proposal creation form  
10\. Specific messaging/notification content and triggers  
11\. Error handling and edge case behaviors  
12\. Performance optimization (lazy loading, caching strategies)  
13\. Specific expressions used in sorting logic  
14\. Privacy/permission checks on proposal visibility  
15\. Role-based access control (who can see/modify what)

TO COMPLETE THIS DOCUMENTATION:

1\. Click on each workflow individually and document:  
   \- All conditions (if-then logic)  
   \- All action steps in sequence  
   \- Any nested workflows or API calls  
   \- Error handling  
   \- Data validations

2\. For RG: Proposals, document:  
   \- Complete search filters and conditions  
   \- Sort specifications  
   \- Performance settings (lazy load, etc.)

3\. For each filter element, document:  
   \- Binding/value source  
   \- Change event workflow  
   \- Reset/clear logic  
   \- Validation

4\. For creation flow sections, document:  
   \- Step progression logic  
   \- Data collection and validation  
   \- Step skip logic  
   \- Error handling on submission

5\. Test the page with various:  
   \- Filter combinations  
   \- Proposal statuses  
   \- User roles  
   \- Edge cases (no results, invalid dates, etc.)

6\. Document any plugins used:  
   \- Names and versions  
   \- Configuration  
   \- Custom functionality

7\. Review backend workflows related to proposals:  
   \- Creation flow  
   \- Modification flow  
   \- Deletion flow  
   \- Status change flow  
   \- Reminder sending

This documentation provides a strong foundation for migration planning. The next pass should focus on workflow conditions and detailed action steps to complete the comprehensive specification.  
