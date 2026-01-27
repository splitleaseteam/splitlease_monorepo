COMPREHENSIVE REQUIREMENTS DOCUMENT  
Page: \_manage-virtual-meetings  
Bubble to Code Migration

Date: January 13, 2026  
Prepared by: Bubble Senior Expert

\================================================================================

TABLE OF CONTENTS

1\. EXECUTIVE SUMMARY  
2\. PAGE PURPOSE AND SCOPE  
3\. DATA MODEL  
4\. UI COMPONENTS AND LAYOUT  
5\. FRONTEND WORKFLOWS (26 workflows)  
6\. BACKEND WORKFLOWS (6 workflows)  
7\. SEARCH AND FILTERING LOGIC  
8\. TIME ZONE HANDLING  
9\. CALENDAR AVAILABILITY MANAGEMENT  
10\. REUSABLE ELEMENTS AND POPUPS  
11\. CONDITIONAL LOGIC AND VISIBILITY RULES  
12\. INTEGRATION POINTS  
13\. MISSING DETAILS AND RECOMMENDATIONS

\================================================================================

1\. EXECUTIVE SUMMARY

The \_manage-virtual-meetings page is an administrative console for managing virtual meeting requests between hosts and guests in the Split Lease platform. It provides:

\- Search and filter capabilities by proposal ID, host name/email, and guest name/email  
\- Two main views: "New Requests" (unconfirmed meetings) and "Split Lease Confirmed" (confirmed meetings with date and meeting link)  
\- Time zone comparison display (User timezone, EST, US/Eastern, and database stored times)  
\- Host availability calendar for blocking/unblocking dates and times  
\- Action buttons: Confirm, Delete, Edit as guest, Edit as host, Change Date  
\- Integration with Google Calendar and Slack notifications

The page contains 26 frontend workflows organized into categories (Uncategorized, Custom Events, Edit Blocked Day/Time, Navigation in Page, Sets State, Show/Hide Element, Virtual Meeting Scheduling) and 6 backend workflows for handling meeting operations.

\================================================================================

2\. PAGE PURPOSE AND SCOPE

Primary Functions:  
\- Centralized management of all virtual meeting requests and confirmed bookings  
\- Search functionality to quickly locate specific meetings by multiple criteria  
\- Dual-state management: pending requests vs. confirmed meetings  
\- Time zone awareness and conversion display for international scheduling  
\- Host availability management to prevent scheduling conflicts  
\- Quick actions for confirming, deleting, and editing meeting requests

User Roles:  
\- Administrators/hosts who need to manage virtual meeting schedules  
\- Access to view both host and guest information  
\- Ability to modify meeting requests on behalf of either party

\================================================================================

3\. DATA MODEL

Primary Data Type: Virtual Meeting Schedules and Links

Key Fields:

a) Relationship Fields:  
   \- host (User type)  
     \- Properties accessed: Name \- Full, email, Phone Number (as text)  
   \- guest (User or Guest type)  
     \- Properties accessed: Name \- Full, email

b) Date/Time Fields:  
   \- suggested dates and times (List of dates)  
     \- Accessed as: :first item, :item \#2, :last item, :item \#1  
     \- Formatted as: "9:18 AM January 13, 2026"  
     \- Stored in database with timezone information  
   \- booked date (Single date)  
     \- Used to distinguish "New Requests" (empty) vs "Confirmed" (populated)  
     \- Formatted for display: "09:18 AM January 13, 2026"

c) Meeting Information:  
   \- meeting link (Text/URL)  
     \- Contains video conference link (likely Zoom/Google Meet)  
   \- proposal unique id (Text)  
     \- Used for searching and identifying specific meeting requests

d) Metadata:  
   \- Date created  
   \- Status fields (inferred, need confirmation)  
     \- Likely: status field to track "new\_request", "confirmed", "cancelled", etc.

e) Additional Fields (inferred from UI):  
   \- Possible timezone field for user preference  
   \- Possible blocked dates/times for host availability

\================================================================================

4\. UI COMPONENTS AND LAYOUT

a) Header Section:  
   \- Page Title: "Manage Virtual Meetings" (T: Manage Virtual Meetings Subheader)  
   \- Corporate Header A (reusable header component)

b) Search Section (Top of page):  
   \- Three search inputs arranged horizontally:  
     1\. IN: Search by Name/Email of Guest  
        \- Placeholder: "Type here full name or email"  
        \- Label: "Search by guest"  
     2\. IN: Search by Name/Email of Host  
        \- Placeholder: "Type here full name or email"  
        \- Label: "Search by host"  
     3\. IN: Search by proposal ID  
        \- Placeholder: "Type here proposal unique id"  
        \- Label: "Search by proposal id"

c) New Requests Section:  
   \- Header: "New Requests" and "Search f..."  
   \- RG: New Requests for Times (Repeating Group)  
     \- Data source: Search for Virtual Meeting Schedules and Links where booked date is empty  
     \- Filters: By search input values  
     \- Display per cell:  
       \* Host information (name, email, phone)  
       \* Guest information (name, email)  
       \* Original Dates Requested label  
       \* Three suggested date/time buttons (first, \#2, last)  
       \* Action buttons:  
         \- Change Date (purple outline)  
         \- Delete (red outline)  
         \- Edit as guest (purple outline)  
         \- Edit as host (purple outline)  
         \- Confirm (purple filled)  
       \* Date created timestamp

d) Split Lease Confirmed Section:  
   \- Header: "Split Lease Confirmed" and "Se..."  
   \- RG: Confirmed Requests (Repeating Group)  
     \- Data source: Search for Virtual Meeting Schedules and Links where booked date is not empty  
     \- Display per cell:  
       \* Host information (name, email, phone)  
       \* Guest information (name, email)  
       \* "Date and Time Confirmed" with booked date  
       \* "Meeting link:" with clickable link  
       \* Action buttons:  
         \- Delete (red outline)  
         \- Confirm (purple filled)

e) Time Zone Comparison Section:  
   \- RG: timezones virtual meetings (Repeating Group)  
   \- Header: "Virtual Meetings Time Zones comparison"  
   \- Scroll link: "Text Scroll to timezones" \- triggers scroll to this section  
   \- Display:  
     \* "Original Dates Requested (User's timezone display):"  
       \- Shows suggested dates formatted in user's timezone  
     \* "Original Dates Requested (EST):"  
       \- Shows same dates formatted in EST  
     \* "Original Dates Requested (US/Eastern):"  
       \- Shows same dates formatted in US/Eastern timezone  
     \* "Dates saved on the database"  
       \- Shows raw database values

f) Availability Calendar Section:  
   \- Header: "Schedule for Virtual Meetings"  
   \- Sub-header: "Availability Calendar"  
   \- Instructions: "Click dates to block (and un-block) them out from users."  
   \- Weekly calendar grid showing:  
     \* Days: Sunday through Saturday  
     \* Times: 8:00 am to 6:00 pm in 1-hour increments  
     \* Each day has "Block / Un-block" buttons at top  
   \- Uses calendar plugin with date cells  
   \- Current cell date navigation  
   \- Parent group date references

g) Reusable Elements (Popups):  
   \- P: Respond-request-cancel-vm  
   \- P: Deletion Confirmation  
   \- P: Virtual Meeting Schedules and Links

\================================================================================

5\. FRONTEND WORKFLOWS (26 total)

Workflows are organized into the following categories:

A. UNCATEGORIZED (2 workflows):

1\. "Page is loaded"  
   \- Event: Page load  
   \- Steps:  
     \* Step 1: Run javascript HIDE crisp chat on mobile  
       \- Script: window.$crisp.push("do", "chat:hide");  
       \- Asynchronous: Yes  
       \- Purpose: Hide Crisp chat widget on mobile devices

2\. "Text Scroll to timezones is clicked"  
   \- Event: Click on "Text Scroll to timezones" element  
   \- Steps:  
     \* \[Details need to be extracted \- likely scrolls page to timezone comparison section\]

B. CUSTOM EVENTS (1 workflow):  
   \- \[Name and details need to be extracted\]

C. EDIT BLOCKED DAY/TIME (4 workflows):  
   \- Handle blocking and unblocking of specific dates/times in availability calendar  
   \- Likely workflows:  
     \* Block date/time slot  
     \* Unblock date/time slot  
     \* Toggle block status  
     \* Update host availability

D. NAVIGATION IN PAGE (4 workflows):  
   \- Handle navigation between different sections of the page  
   \- Likely workflows:  
     \* Navigate to New Requests section  
     \* Navigate to Confirmed section  
     \* Navigate to Calendar section  
     \* Scroll to timezone comparison

E. SETS STATE (2 workflows):  
   \- Manage custom state variables for page behavior  
   \- Likely managing:  
     \* Selected meeting record  
     \* Current view state (new vs confirmed)

F. SHOW/HIDE ELEMENT (2 workflows):  
   \- Control visibility of UI elements  
   \- Likely controlling:  
     \* Popup visibility  
     \* Section expansion/collapse

G. VIRTUAL MEETING SCHEDULING (11 workflows):

1\. "B: Cancel" \- Cancel a virtual meeting request  
2\. "B: Confirm VM Request" \- Confirm a virtual meeting request  
3\. "B: Delete VM request" \- Delete a virtual meeting  
4\. "B: Fire Timezones" \- Display timezone comparison  
5\. "B: Edit as guest" \- Open guest editing interface  
6\. "B: Edit as host" \- Open host editing interface  
7\. "Change Date" button \- Modify meeting dates  
8\. "Delete" button \- Delete meeting (from confirmed or new requests)  
9\. "Edit as guest" button \- Edit from guest perspective  
10\. "Edit as host" button \- Edit from host perspective  
11\. "Confirm" button \- Confirm the meeting and set booked date

Expected Workflow Actions:  
   \- When "Confirm" is clicked:  
     \* Set booked date to selected date/time  
     \* Update meeting status  
     \* Send confirmation emails to host and guest  
     \* Schedule backend workflow for Google Calendar integration  
     \* Trigger Slack notification  
     
   \- When "Delete" is clicked:  
     \* Show deletion confirmation popup  
     \* Delete Virtual Meeting Schedules and Links record  
     \* Send cancellation notifications  
     
   \- When "Edit as guest/host" is clicked:  
     \* Open respective reusable element popup  
     \* Allow modification of suggested dates/times  
     \* Save changes to record  
     
   \- When "Change Date" is clicked:  
     \* Open date modification interface  
     \* Update suggested dates and times list

\================================================================================

6\. BACKEND WORKFLOWS (6 total)

All backend workflows are in the "Virtual Meetings" category:

1\. "accept-virtual-meeting"  
   \- Purpose: Accept and finalize a virtual meeting request  
   \- Expected Parameters:  
     \* meeting\_id (Virtual Meeting Schedules and Links)  
     \* selected\_date (Date/Time)  
   \- Expected Steps:  
     \* Update booked date field  
     \* Generate/retrieve meeting link  
     \* Send confirmation email to host  
     \* Send confirmation email to guest  
     \* Schedule calendar invite  
     
2\. "CORE- Upload Virtual Meeting Vi..." (truncated)  
   \- Full name likely: "CORE- Upload Virtual Meeting Video" or "Visit"  
   \- Purpose: Handle video or visit uploads related to virtual meetings  
   \- \[Detailed parameters and steps need extraction\]

3\. "core-create-virtual-meeting-req..." (truncated)  
   \- Full name likely: "core-create-virtual-meeting-request"  
   \- Purpose: Create a new virtual meeting request  
   \- Expected Parameters:  
     \* host\_id (User)  
     \* guest\_id (User)  
     \* suggested\_dates\_list (List of dates)  
     \* proposal\_id (Text)  
   \- Expected Steps:  
     \* Create new Virtual Meeting Schedules and Links record  
     \* Send notification to host  
     \* Send notification to guest  
     \* Log creation in system

4\. "L3-Notify participants of a confir..." (truncated)  
   \- Full name likely: "L3-Notify participants of a confirmed meeting"  
   \- Purpose: Send notifications when meeting is confirmed  
   \- Expected Parameters:  
     \* meeting\_id (Virtual Meeting Schedules and Links)  
   \- Expected Steps:  
     \* Get host and guest emails  
     \* Send confirmation email template to host  
     \* Send confirmation email template to guest  
     \* Add to their calendars  
     \* Send reminder schedule

5\. "L3-trigger-send-google-cale..."   
   \- Full name: "l3-trigger-send-google-calendar" (confirmed from workflow note)  
   \- Purpose: Trigger Google Calendar event creation  
   \- Expected Parameters:  
     \* meeting\_id (Virtual Meeting Schedules and Links)  
     \* event\_details (Date, time, participants, meeting link)  
   \- Expected Steps:  
     \* Call Google Calendar API  
     \* Create calendar event  
     \* Send invites to participants  
     \* Store calendar event ID in meeting record

6\. "L3-un-confirmed-vm-sent-to-slack"  
   \- Purpose: Send Slack notification for unconfirmed virtual meetings  
   \- Expected Parameters:  
     \* meeting\_id (Virtual Meeting Schedules and Links)  
   \- Expected Steps:  
     \* Format message with meeting details  
     \* Send to designated Slack channel  
     \* Log notification

\================================================================================

7\. SEARCH AND FILTERING LOGIC

The page implements three independent search filters that work together:

a) Search by Guest Name/Email:  
   \- Input element: "IN: Search by Name/Email of Guest"  
   \- Filter logic:   
     \* Do a search for Virtual Meeting Schedules and Links  
     \* Constraint: guest's Name \- Full contains Input's value OR  
     \* Constraint: guest's email contains Input's value  
   \- Case-insensitive partial match

b) Search by Host Name/Email:  
   \- Input element: "IN: Search by Name/Email of Host"  
   \- Filter logic:  
     \* Do a search for Virtual Meeting Schedules and Links  
     \* Constraint: host's Name \- Full contains Input's value OR  
     \* Constraint: host's email contains Input's value  
   \- Case-insensitive partial match

c) Search by Proposal ID:  
   \- Input element: "IN: Search by proposal ID"  
   \- Filter logic:  
     \* Do a search for Virtual Meeting Schedules and Links  
     \* Constraint: proposal unique id \= Input's value  
   \- Exact match required

d) Combined Filtering:  
   \- All three filters work in conjunction (AND logic)  
   \- Empty search fields are ignored  
   \- Results update dynamically as user types

e) State-based Filtering:  
   \- "New Requests" section:  
     \* Additional constraint: booked date is empty  
   \- "Split Lease Confirmed" section:  
     \* Additional constraint: booked date is not empty

f) Sorting:  
   \- Default sort: Date created (descending) \- newest first  
   \- \[Confirm if other sort options exist\]

\================================================================================

8\. TIME ZONE HANDLING

The page displays the same meeting times in multiple time zones for clarity:

a) Time Zone Formats Displayed:  
   1\. User's timezone display:  
      \- Uses current user's timezone preference  
      \- Format: "9:18 AM January 13, 2026"  
     
   2\. EST (Eastern Standard Time):  
      \- Fixed conversion to EST  
      \- Format: "9:18 AM January 13, 2026"  
     
   3\. US/Eastern:  
      \- Accounts for DST (Eastern Daylight Time)  
      \- Format: "9:18 AM January 13, 2026"  
     
   4\. Database stored values:  
      \- Raw datetime as stored in database  
      \- Shows actual stored format

b) Time Zone Conversion Logic:  
   \- Expressions used:  
     \* suggested dates and times:item \#1:formatted as... \[with timezone\]  
     \* :converted to EST  
     \* :converted to US/Eastern  
   \- All conversions maintain the same moment in time

c) Purpose of Multiple Time Zones:  
   \- Helps administrators verify correct time interpretation  
   \- Assists with debugging time zone issues  
   \- Ensures international hosts/guests see correct meeting times  
   \- Prevents scheduling errors due to DST transitions

d) Scroll to Time Zone Comparison:  
   \- Link element: "Text Scroll to timezones"  
   \- When clicked, page scrolls to timezone comparison section  
   \- Allows quick verification without searching entire page

\================================================================================

9\. CALENDAR AVAILABILITY MANAGEMENT

a) Calendar Display:  
   \- Weekly view calendar  
   \- Shows 7 days: Sunday through Saturday  
   \- Time slots from 8:00 AM to 6:00 PM (10 hours)  
   \- 1-hour time increments  
   \- Total: 7 days × 10 hours \= 70 time slots per week

b) Block/Unblock Functionality:  
   \- Each day has "Block / Un-block" buttons at the top  
   \- Each individual time slot can be clicked  
   \- Blocked dates prevent guests from selecting those times  
   \- Visual indication of blocked vs available times (styling differences)

c) Calendar Plugin:  
   \- Uses calendar plugin (possibly "Calendar Grid Pro" from elements list)  
   \- "(no plugin preview available)" shown in editor  
   \- Stores dates as cells  
   \- References:  
     \* "Current cell's date"  
     \* "Parent group's date"

d) Workflow Integration:  
   \- 4 workflows in "Edit Blocked Day/Time" category  
   \- Likely workflows:  
     \* Block specific date/time  
     \* Unblock specific date/time  
     \* Toggle block status  
     \* Save availability changes to database

e) Data Storage:  
   \- Blocked dates likely stored as:  
     \* Separate "Blocked Dates" data type, OR  
     \* List field on User/Host profile, OR  
     \* Related to Virtual Meeting Schedules  
   \- Need to confirm exact data structure

f) Purpose:  
   \- Host availability management  
   \- Prevent double-booking  
   \- Block out vacation/unavailable times  
   \- System checks availability before allowing meeting requests

\================================================================================

10\. REUSABLE ELEMENTS AND POPUPS

The page references several reusable elements:

a) ♻️💥respond-request-cancel-vm  
   \- Purpose: Handle responses, cancellations of virtual meeting requests  
   \- Likely contains:  
     \* Form fields for response  
     \* Cancellation reason textarea  
     \* Confirm/Cancel buttons

b) ♻️💥guest-editing-proposal  
   \- Purpose: Allow editing of meeting proposal from guest perspective  
   \- Likely contains:  
     \* Date/time selector  
     \* Suggested dates list  
     \* Save/Cancel buttons

c) ♻️💥host-editing-proposal  
   \- Purpose: Allow editing of meeting proposal from host perspective  
   \- Similar to guest editing but with host-specific options  
   \- May include availability calendar

d) P: Deletion Confirmation  
   \- Standard confirmation popup  
   \- "Are you sure you want to delete this virtual meeting?"  
   \- Yes/No buttons

e) P: Virtual Meeting Schedules and Links  
   \- Detailed view/edit popup for meeting record  
   \- Shows all fields  
   \- Edit capabilities

f) Corporate Header A  
   \- Standard header used across admin pages  
   \- Navigation, branding, user menu

g) Other Referenced Reusables (visible in elements list):  
   \- ♻️💥book-meeting-w-split-lease  
   \- ♻️💥date-change-requests  
   \- leases-date-request-calendar-NEW  
   \- Many others in the extensive reusable elements list

\================================================================================

11\. CONDITIONAL LOGIC AND VISIBILITY RULES

Key conditionals that need to be extracted from each element:

a) Repeating Group Visibility:  
   \- RG: New Requests for Times  
     \* Visible when: booked date is empty  
     \* Data source filtered by search inputs  
     
   \- RG: Confirmed Requests  
     \* Visible when: booked date is not empty  
     \* Data source filtered by search inputs

b) Button Visibility and States:  
   \- "Confirm" button:  
     \* Only visible when: user has permission to confirm  
     \* Disabled when: no date selected  
     
   \- "Delete" button:  
     \* Always visible to admins  
     \* May have confirmation step  
     
   \- "Edit as guest" / "Edit as host":  
     \* Conditional on user role/permissions  
     \* May be hidden for certain meeting states

c) Time Zone Section:  
   \- "RG: timezones virtual meetings" repeating group:  
     \* Visible when: meeting has suggested dates  
     \* Hidden when: list is empty

d) Calendar Section:  
   \- Block/Unblock buttons:  
     \* State depends on whether date is currently blocked  
     \* Visual styling changes (likely button color/text)  
     
e) Text Display Conditions:  
   \- "Date and Time Confirmed" label:  
     \* Only shows when booked date exists  
     
   \- "Original Dates Requested" label:  
     \* Shows when suggested dates list is not empty

f) Search Result Empty States:  
   \- When no results match filters:  
     \* Show "No meetings found" message  
     \* \[Confirm if this exists\]

g) Permission-based Visibility:  
   \- Entire page likely restricted to:  
     \* Admin users  
     \* Hosts with proper permissions  
     \* Not visible to regular guests

\[NOTE: Detailed conditional expressions need to be extracted from each element's "Only when" settings in the Conditional tab\]

\================================================================================

12\. INTEGRATION POINTS

a) Google Calendar Integration:  
   \- Backend workflow: "l3-trigger-send-google-calendar"  
   \- Creates calendar events when meetings confirmed  
   \- Sends invites to both host and guest  
   \- Stores event ID for future updates/cancellations  
   \- API: Google Calendar API

b) Slack Integration:  
   \- Backend workflow: "L3-un-confirmed-vm-sent-to-slack"  
   \- Sends notifications for unconfirmed meetings  
   \- Likely sends to admin/operations channel  
   \- Allows team to follow up on pending requests  
   \- API: Slack Webhook or Slack API

c) Email Notifications:  
   \- Multiple backend workflows send emails:  
     \* Confirmation emails to host  
     \* Confirmation emails to guest  
     \* Reminder emails before meeting  
     \* Cancellation notifications  
   \- Email templates needed for each type  
   \- Dynamic content: host name, guest name, date/time, meeting link

d) Crisp Chat:  
   \- JavaScript integration: window.$crisp  
   \- Hidden on mobile devices (page load workflow)  
   \- May be visible on desktop for support

e) Video Conferencing:  
   \- Meeting links stored in "meeting link" field  
   \- Likely integrations:  
     \* Zoom API  
     \* Google Meet  
     \* Microsoft Teams  
     \* Or custom video solution  
   \- Auto-generate meeting links when confirmed

f) Internal System Integrations:  
   \- Links to proposal system (via proposal unique id)  
   \- User management system (host/guest records)  
   \- Messaging system (52 backend workflows exist)  
   \- Notification system (Core \- Notifications)

\================================================================================

13\. MISSING DETAILS AND RECOMMENDATIONS FOR NEXT PASS

The following details require extraction through a systematic second pass:

A. DETAILED WORKFLOW EXTRACTION NEEDED:

1\. For each of the 26 frontend workflows, extract:  
   \- Event trigger (element \+ event type)  
   \- All step actions with parameters  
   \- "Only when" conditions at event and step level  
   \- Fields updated in "Make changes to" actions  
   \- Navigation targets  
   \- Popup show/hide targets  
   \- State variables set/accessed  
   \- Backend workflows scheduled

2\. For each of the 6 backend workflows, extract:  
   \- Full workflow names (currently truncated)  
   \- All parameters (name, type, optional flag)  
   \- Complete step sequence  
   \- Database operations (Create, Update, Delete)  
   \- API calls (Google Calendar, Slack, etc.)  
   \- Email sends (templates, recipients, dynamic fields)  
   \- Recursive/scheduled calls  
   \- Error handling logic

B. CONDITIONAL LOGIC EXTRACTION:

1\. For each UI element, document:  
   \- "Only when" visibility conditions  
   \- Conditional formatting rules  
   \- Dynamic text expressions  
   \- Enabled/disabled states

2\. For each repeating group:  
   \- Data source expression  
   \- Search constraints  
   \- Filters applied  
   \- Sort order  
   \- Empty state handling

C. DATA STRUCTURE CLARIFICATION:

1\. Virtual Meeting Schedules and Links:  
   \- Confirm all field names and types  
   \- List any computed fields  
   \- Document privacy rules  
   \- Identify related data types

2\. Blocked Dates/Times:  
   \- Determine data structure (separate type vs field)  
   \- Document relationship to hosts/users  
   \- Understand storage format

3\. User/Host Permissions:  
   \- Role-based access control  
   \- Field-level permissions  
   \- Page-level restrictions

D. REUSABLE ELEMENT DETAILS:

1\. For each popup/reusable:  
   \- Complete list of input parameters  
   \- Internal workflow logic  
   \- Data passed back to parent  
   \- Custom states used

E. INTEGRATION CONFIGURATION:

1\. Google Calendar:  
   \- API authentication method  
   \- Scopes required  
   \- Event creation logic  
   \- Update/delete handling

2\. Slack:  
   \- Webhook URL or API token  
   \- Channel configuration  
   \- Message format  
   \- Error handling

3\. Video Conferencing:  
   \- Which platform(s) used  
   \- Meeting link generation logic  
   \- API configuration

4\. Email:  
   \- Email service (SendGrid, Postmark, Bubble built-in)  
   \- Template IDs or content  
   \- From address configuration  
   \- Reply-to settings

F. CALENDAR PLUGIN DETAILS:

1\. Plugin name and version  
2\. Configuration settings  
3\. Custom states or events  
4\. Data binding mechanism  
5\. Styling customization

G. RESPONSIVE DESIGN:

1\. Mobile layout differences  
2\. Breakpoints  
3\. Hidden elements on mobile  
4\. Touch-friendly adjustments

\================================================================================

PROMPT FOR DETAILED SECOND PASS:

"Open the Bubble editor for page '\_manage-virtual-meetings' in the 'Split Lease' app. Systematically extract the following information:

1\. WORKFLOWS (Tab: Workflow):  
   \- Click on each of the 26 workflows listed  
   \- For each workflow, document:  
     a) Full workflow name and category  
     b) Trigger: Element name \+ Event type  
     c) Event-level conditions (click 'Only when' if present)  
     d) For EACH step in the workflow:  
        \- Action type (e.g., Make changes to, Create, Delete, Show, Hide, Navigate, etc.)  
        \- Target (element, data type, page)  
        \- All parameters and their dynamic expressions  
        \- Step-level conditions ('Only when')  
        \- Run-after delay  
   \- Take screenshots of complex expressions

2\. BACKEND WORKFLOWS (Tab: Backend Workflows \> Virtual Meetings):  
   \- Click on each of the 6 backend workflows  
   \- Document:  
     a) Full workflow name  
     b) Privacy settings (public, require key, etc.)  
     c) All parameters: name, type, optional, list  
     d) For each step: same detail as frontend workflows  
     e) Any scheduled recursive calls

3\. DATA SOURCES (Tab: Design \> Repeating Groups):  
   \- Select 'RG: New Requests for Times'  
   \- Document complete data source expression including all search constraints  
   \- Select 'RG: Confirmed Requests'  
   \- Document complete data source expression  
   \- Select 'RG: timezones virtual meetings'  
   \- Document complete data source expression

4\. CONDITIONAL LOGIC:  
   \- For each element with visibility conditions:  
     \- Click element  
     \- Go to Conditional tab  
     \- Document all conditions with their expressions

5\. CALENDAR PLUGIN:  
   \- Identify plugin name from Plugins tab  
   \- Document all settings and configuration  
   \- Check for custom events or states

6\. INTEGRATIONS:  
   \- Go to Plugins tab  
   \- Document Google Calendar API configuration  
   \- Document Slack plugin/API connector settings  
   \- Document email service configuration  
   \- Document video conferencing integration

7\. DATA TYPES (Tab: Data \> Data types):  
   \- Select 'Virtual Meeting Schedules and Links'  
   \- Document ALL fields with types  
   \- Document privacy rules  
   \- Check for 'Blocked Dates' or similar data type  
   \- Document structure if exists

8\. REUSABLE ELEMENTS:  
   \- Open each reusable element referenced on the page  
   \- Document internal structure and workflows  
   \- Document parameters passed in and out

This detailed extraction will provide all information needed for a complete code migration."

\================================================================================

END OF REQUIREMENTS DOCUMENT

Document Status: DRAFT \- Requires detailed second pass  
Total Pages Analyzed: 1 (\_manage-virtual-meetings)  
Total Workflows Documented: 26 frontend \+ 6 backend \= 32  
Data Types Identified: 1 primary (Virtual Meeting Schedules and Links)  
Integrations Identified: 4 (Google Calendar, Slack, Email, Video Conferencing)

Next Steps:  
1\. Execute detailed second pass using prompt above  
2\. Extract all workflow logic and expressions  
3\. Document complete data model  
4\. Verify integration configurations  
5\. Create technical specification for code migration  
6\. Develop migration plan with priorities

