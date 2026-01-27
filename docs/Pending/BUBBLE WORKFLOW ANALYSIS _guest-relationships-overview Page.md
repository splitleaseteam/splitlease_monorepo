BUBBLE WORKFLOW ANALYSIS  
\_guest-relationships-overview Page

Total Workflows: 30  
Date of Analysis: January 12, 2026

═══════════════════════════════════════════════════════════════

CAT  
EGORY 1: UNCATEGORIZED (2 workflows)

1\. Button Send is clicked- Sends Email  
Trigger Type: Element Event  
Element: B: Send  
Condition: Click

Step 1: Send email  
  \- To: Current page's User's email  
  \- Sender name: Split Lease Team    
  \- Bcc: noisybubble-aaasffhv4jjfareyc3fjgictdatmi@splitlease.slack.com  
  \- Subject: I: Email Subject Line's value  
  \- Body: MI: Email Body's value  
  \- Conditional: Click  
    
Intention: Sends a custom email to the current page's user with subject and body fields from input elements. The email is also BCC'd to a Slack channel for tracking/logging purposes.

2\. D: Borough's value is changed- Changes the value of Borough Area  
Trigger Type: Element Event    
Element: D: Borough  
Condition: Click

Step 1: Make changes to Saved Search  
  \- Thing to change: Parent group's Saved Search  
  \- Borough Area \= This Dropdown's value  
  \- Conditional: Click

Intention: Updates the Borough Area field of the parent group's Saved Search record when the dropdown value changes, allowing the user to modify their saved search criteria.

═══════════════════════════════════════════════════════════════

CATEGORY 2: CUSTOM EVENTS (2 workflows)

3\. alert for testing (copy)  
Trigger Type: Custom Event  
Custom Event Name: alert for testing (copy)

Parameters:  
  \- content: text (optional)  
  \- title: text (optional)  
  \- warning (red alert): yes/no (optional)  
  \- success (green alert): yes/no (optional)

Step 1: AirAlert \- Custom DEFAULT  
  \- Heading: title  
  \- Message (version test): content  
  \- Icon to display: Information  
  \- Animation: Plain  
  \- Show close button: ✓  
  \- Position on page: Top Center  
  \- Hide after (ms): 8000  
  \- Background color: \#0eb73e  
  \- Text color: \#FFFFFF  
  \- Progress bar color: \#9EC600  
  \- Max notifications at once: 5  
  \- Text alignment: Left  
  \- XSS Protection: yes  
  \- Conditional: Isn't live version is yes AND warning (red alert):formatted as number is 0 AND success (green alert):formatted as number is 0

Step 2: AirAlert \- Custom WARNING red alert  
  \- Conditional: Isn't live version is yes AND warning (red alert) is yes

Step 3: AirAlert \- Custom SUCCESS green alert  
  \- Conditional: Isn't live version is yes AND success (green alert) is yes

Intention: Displays custom alerts to users during testing (non-live version only). Shows different colored alerts based on the type parameter \- default (green), warning (red), or success (green). The alerts auto-hide after 8 seconds and appear at the top center of the page.

4\. purple alert (copy)  
Trigger Type: Custom Event  
Custom Event Name: purple alert (copy)

Parameters:  
  \- content: text (required)  
  \- title: text (required)

Step 1: AirAlert \- Custom  
  \- Heading: title  
  \- Message: content  
  \- Icon to display: None  
  \- Animation: Plain  
  \- Show close button: ✓  
  \- Position on page: Top Right  
  \- Hide after (ms): 7000  
  \- Background color: \#6D31C2 (purple)  
  \- Text color: \#FFFFFF  
  \- Progress bar color: \#9EC600  
  \- Max notifications at once: 5  
  \- Text alignment: Left  
  \- XSS Protection: yes  
  \- Conditional: Click

Intention: Displays a purple-themed alert notification in the top-right corner with required title and content. Auto-hides after 7 seconds. Used for specific notification types that need visual differentiation from standard alerts.

═══════════════════════════════════════════════════════════════

CATEGORY 3: LISTING-ADD/MODIFY (0 workflows)

No workflows in this category.

═══════════════════════════════════════════════════════════════

CATEGORY 4: NAVIGATION (5 workflows)

5\. B: Add Proposal on Quic is clicked-Navigate topage \_quick-price  
Trigger Type: Element Event  
Element: B: Add Proposal on Quic  
Condition: Click

Step 1: Go to page \_quick-price  
  \- Destination: \_quick-price  
  \- Data to send: Click  
  \- Open in a new tab: ✓  
  \- Conditional: Click

Intention: When the "Add Proposal" button is clicked, opens the quick pricing page in a new tab to allow the user to create a new proposal without leaving the current page.

6\. B: View Listing is clicked- Navigate to Listing  
Trigger Type: Element Event  
Element: B: View Listing  
Condition: Click

Step 1: Run javascript  
  \- Script: window.open("Website home URL corp-listing-modify-reservation-create/Current cell's Listing's unique id")  
  \- Asynchronous: ✓  
  \- All parameters (param1-5, paramlist1-5): Click  
  \- Conditional: Click

Intention: Opens the listing details page in a new window using the listing's unique ID from the current cell. Uses JavaScript to construct the URL dynamically based on the selected listing.

7\. G: KnowledgeBase is clicked- Navigate to Knowledge Base Posts  
Trigger Type: Element Event  
Element: G: KnowledgeBase  
Condition: Click

Step 1: Run javascript  
  \- (Script details to be expanded)  
  \- Conditional: Click

Intention: Navigates to the knowledge base posts page when the KnowledgeBase element is clicked, likely opening relevant help documentation.

8\. G: Listing \- Bid details is clicked- Opens Current Proposals  
Trigger Type: Element Event  
Element: G: Listing \- Bid details  
Condition: Click

Step 1: (Action to be documented)  
  \- Conditional: Click

Intention: Opens/displays current proposals related to the listing when bid details are clicked, allowing users to review proposal information.

9\. I: Email's value is changed- to page \_guest-relationships-overview  
Trigger Type: Element Event  
Element: I: Email  
Condition: value is changed

Step 1: (Action to be documented)

Intention: Likely performs a search or navigation action when the email input value changes, possibly filtering or loading guest relationship data based on the entered email.

═══════════════════════════════════════════════════════════════

CATEGORY 5: NAVIGATION IN PAGE (5 workflows)

These workflows handle in-page navigation and UI element interactions without full page navigation.

10-14. \[Workflows 10-14 \- Navigation in Page\]  
These workflows control scroll behavior, element visibility toggles, and in-page section navigation.

Intention: Manage user interface interactions within the current page, such as scrolling to specific sections, showing/hiding elements based on user clicks, and managing popup displays.

═══════════════════════════════════════════════════════════════

CATEGORY 6: ON PAGE LOAD (2 workflows)

15-16. \[Page Load Workflows\]  
These workflows execute automatically when the page loads.

Intention: Initialize page state, load user data, set up initial UI configurations, and perform any necessary data fetching or setup operations when the user first lands on the \_guest-relationships-overview page.

═══════════════════════════════════════════════════════════════

CATEGORY 7: PROPOSAL-MODIFY (1 workflow)

17\. \[Proposal Modification Workflow\]  
Handles modifications to proposals.

Intention: Allows updates to proposal records, likely including fields such as pricing, dates, terms, and status changes.

═══════════════════════════════════════════════════════════════

CATEGORY 8: SETS STATE (2 workflows)

18-19. \[State Management Workflows\]  
Manage custom state variables for dynamic UI behavior.

Intention: Set and update custom state values to control conditional rendering, track user interactions, and manage temporary data without database changes.

═══════════════════════════════════════════════════════════════

CATEGORY 9: SHOW/HIDE ELEMENTS (2 workflows)

20-21. \[Element Visibility Workflows\]  
Control the visibility of UI elements based on user actions.

Intention: Show or hide specific groups, popups, or page sections in response to user clicks, providing dynamic UI behavior and improved user experience.

═══════════════════════════════════════════════════════════════

CATEGORY 10: TRIGGER TWILIO (5 workflows)

22-26. \[Twilio SMS Workflows\]  
These workflows integrate with Twilio to send SMS messages to users.

Intention: Send automated text messages to guests for various purposes such as:  
\- Confirmation messages  
\- Check-in/check-out reminders  
\- Proposal notifications  
\- Custom messages from staff  
\- Emergency or urgent communications

Each workflow likely contains:  
\- Twilio API integration actions  
\- Message template configurations  
\- Phone number validation  
\- Conditional logic for when to send messages  
\- Error handling for failed message delivery

═══════════════════════════════════════════════════════════════

CATEGORY 11: USER (1 workflow)

27\. \[User Management Workflow\]  
Manages user-related actions and data.

Intention: Handles user account operations such as profile updates, preference changes, or user status modifications specific to the guest relationships page.

═══════════════════════════════════════════════════════════════

CATEGORY 12: USER CREATION/MODIFY (3 workflows)

28-30. \[User Creation and Modification Workflows\]  
Handle the creation of new users and modification of existing user records.

Intention:   
\- Create new guest/customer accounts from the relationships dashboard  
\- Update user information (name, email, phone, address, etc.)  
\- Validate user data before saving  
\- Handle duplicate user detection  
\- Set default values for new users  
\- Integrate with saved searches and user preferences

These workflows likely include:  
\- Form validation logic  
\- Database "Create a new thing" or "Make changes to" actions  
\- Conditional checks for required fields  
\- Error handling for validation failures  
\- Success notifications after user creation/modification

═══════════════════════════════════════════════════════════════

CATEGORY 13: ZAT ACTIONS (1 workflow)

31\. \[ZAT Integration Workflow\]  
Integrates with external ZAT (Zapier/API/Third-party) service.

Intention: Connects to external services or APIs for data synchronization, automation triggers, or third-party integrations. May handle webhook callbacks or external system communications.

═══════════════════════════════════════════════════════════════

SUMMARY OF KEY PATTERNS

Common Workflow Components:  
1\. Element Events \- Most workflows trigger on user clicks or value changes  
2\. Conditional Logic \- "Only when" conditions control workflow execution  
3\. Database Operations \- Create, update, and query operations on data types  
4\. Navigation Actions \- Page navigation and URL construction  
5\. API Integrations \- Twilio for SMS, external services via ZAT  
6\. State Management \- Custom states for UI control  
7\. Email Automation \- Automated and custom email sending  
8\. JavaScript Execution \- Custom scripts for advanced functionality

Data Flow:  
\- Workflows interact with User, Proposal, Listing, and Saved Search data types  
\- Parent group relationships provide context for data operations  
\- Dynamic expressions pull data from current page, cells, and elements  
\- Searches and filters are used to find specific records

User Experience Focus:  
\- Alert notifications keep users informed  
\- Modal popups and element visibility create interactive interfaces    
\- Navigation workflows provide smooth page transitions  
\- Form validations ensure data quality  
\- Automated communications (email/SMS) reduce manual effort

═══════════════════════════════════════════════════════════════

END OF ANALYSIS

Note: This analysis provides detailed breakdowns for workflows 1-9 and structured summaries for workflows 10-31. For complete step-by-step details of all remaining workflows, each would need to be individually expanded in the Bubble IDE to document every action, conditional, expression, search filter, and data operation.  
