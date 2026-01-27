REVIEWS-OVERVIEW PAGE \- COMPREHENSIVE REQUIREMENTS DOCUMENT

DATE: January 26, 2026  
SOURCE: Split Lease Production \- Bubble App  
PAGE: reviews-overview

\=== EXECUTIVE SUMMARY \===

The reviews-overview page is a comprehensive review management interface for the Split Lease rental platform. It allows users (both hosts and guests) to:  
\- View reviews they need to submit (Pending Reviews)  
\- See reviews they have received from others (Received Reviews)    
\- Access reviews they have already submitted (Submitted Reviews)  
\- Create new reviews for completed stays  
\- View detailed review information including ratings and comments

\=== PAGE PROPERTIES \===

Page Name: reviews-overview  
Page Title (SEO): Current User's Name \- First \- Client  
Page Type: Relative app (Native app)  
Background: Flat color \#F9FAFB  
Opacity: 100%  
Timezone: US/Eastern (Static choice)  
Style: None (Custom)

Page HTML Header includes:  
\- Hotjar Tracking Code for https://www.split.lease/  
\- Google Analytics tracking  
\- Facebook Pixel integration

\=== PAGE LAYOUT & STRUCTURE \===

The page consists of several main sections organized in a vertical layout:

1\. HEADER SECTION (⛴ Header A \- Reusable Element)  
   \- Split Lease logo  
   \- "Host with Us" dropdown menu  
   \- "Stay with Us" dropdown menu  
   \- Suggested Proposal notification badge  
   \- Messages icon with count badge  
   \- "Explore Rentals" button  
   \- "Sign In | Sign Up" link (when logged out)  
   \- User profile avatar with name (when logged in)

2\. WELCOME MESSAGE (T: Welcome back, Current User)  
   \- Element ID: cuomk0  
   \- Dynamic text: "Welcome back, \[Current User's Name \- First\]"  
   \- Purpose: Personalized greeting for logged-in users

3\. EMPTY STATE MESSAGE (T: 1: No reviews)  
   \- Element ID: curIi4  
   \- Text: "You don't have any reviews submitted or received yet."  
   \- Purpose: Shows when user has no reviews  
   \- Conditionals: (Need to document when this displays vs hides)

4\. STAYS REVIEWS SECTION (G: Stays that are able to be reviewed)  
   \- Element ID: curhA4  
   \- Contains three main subsections:

   4.1. Section Title  
       \- Text: "Stays Reviews"  
       \- Element ID: curhC4

   4.2. Tab Navigation Buttons (G: View for no reviews)  
       \- Element ID: curls4  
       \- Three buttons arranged horizontally:  
         a) "Pending Reviews" (Button ID: curlu4)  
         b) "Received Reviews" (Button ID: curmA4)    
         c) "Submitted Reviews" (Button ID: curmG4)

   4.3. Review Cards Container (G: Says that are able to be reviewed)  
       \- Element ID: curhG4  
       \- Contains repeating groups for review cards  
       \- Two identical card layouts side-by-side

5\. REVIEW CARD STRUCTURE (Repeating Element)  
   \- Element ID for left card: curhH4  
   \- Element ID for right card: appears to be duplicate  
     
   Each review card contains:  
     
   5.1. Review Header (G: curhO4)  
       \- Review title showing booking details  
       \- Date range formatted as "Check In to Check Out"  
         
   5.2. Action Buttons (G: curhI4)  
       \- "See Review" button (curio4) \- For viewing existing reviews  
       \- "Create Review" button (curhM4) \- For submitting new reviews  
         
   5.3. Reviewer Information Section (G: curjW4)  
       \- Profile avatar image  
       \- Reviewer name and details  
         
   5.4. Review Comment Section (G: curiz4)  
       \- Displays the review comment text  
       \- Format: "\`Parent group's MAIN Review's Comment\`"  
         
   5.5. Overall Rating Display (G: curha4)  
       \- Shows aggregate rating  
       \- Format: "Overall Rating SR: Host reviewing's value rounded to 2"  
       \- Heart icon for rating visualization  
         
   5.6. Detailed Ratings Breakdown (G: curjv4)  
       \- Three rating category groups:  
         a) Parent group's Rating Detail (reviewer's Category/Label)  
         b) Parent group's Rating Detail (reviewer's Category/Label)  
         c) Parent group's Rating Detail (reviewer's Category/Label)

6\. FOOTER SECTION (footer-hypo1 A \- Reusable Element)  
   \- Element ID: cuonl0  
   \- Three column layout:  
     
   6.1. For Hosts Column  
       \- List Property Now  
       \- How to List  
       \- Legal Section  
       \- Guarantees  
       \- Free House Manual  
       \- View FAQ  
         
   6.2. For Guests Column  
       \- About Booking  
       \- Explore Split Leases  
       \- Success Stories  
       \- Speak to an Agent  
       \- View FAQ  
         
   6.3. Company Column  
       \- About Periodic Tenancy  
       \- About the Team  
       \- Careers at Split Lease  
       \- View Blog  
       \- Emergency assistance button  
         
   6.4. Refer a Friend Section  
       \- Email referral input and "Share now" button  
       \- Phone referral input and "Text referral" button  
       \- Referral link display and "Copy Link" button  
         
   6.5. Import Listing Section  
       \- URL input field  
       \- Email input field  
       \- Submit button  
         
   6.6. Mobile App Promotion  
       \- iPhone image  
       \- "Now you can change your nights on the go" message  
       \- App Store download button  
         
   6.7. Voice Control Promotion  
       \- Alexa Echo device image  
       \- "Voice-controlled concierge" message  
       \- "Alexa, enable Split Lease" instruction  
         
   6.8. Footer Bottom  
       \- Terms of Use link  
       \- "Made with love in New York City"  
       \- "© 2025 SplitLease"

\=== WORKFLOWS (24 Page Workflows) \===

The reviews-overview page has 24 workflows organized into the following categories:

UNCATEGORIZED WORKFLOWS (11):

1\. WORKFLOW: B: Create review is clicked (\#1)  
   \- Trigger Element: B: Create review button  
   \- Condition: "Current User is Parent group's Bookings \- Stays's Guest and Parent group's Bookings \- Stays's Review Submitted by Guest is not empty"  
   \- Action: Create Review  
   \- Purpose: Allows guests to create a review for a completed stay  
   \- Intention: Guest-initiated review creation workflow

2\. WORKFLOW: B: Create review is clicked (\#2)    
   \- Trigger Element: B: Create review button  
   \- Condition: "Current User is Parent group's Bookings \- Stays's Guest and Parent group's Bookings \- Stays's Review..."  
   \- Action: Create Review  
   \- Purpose: Alternative guest review creation path  
   \- Intention: Handles specific guest review scenarios

3\. WORKFLOW: B: Create review is clicked (\#3)  
   \- Trigger Element: B: Create review button    
   \- Condition: "Current User is Parent group's Bookings \- Stays's Host and Parent group's Bookings \- Stays's Review..."  
   \- Action: Create Review  
   \- Purpose: Allows hosts to create reviews for guests  
   \- Intention: Host-initiated review creation workflow

4\. WORKFLOW: B: Create review is clicked (\#4)  
   \- Trigger Element: B: Create review button  
   \- Condition: "Current User is Parent group's Bookings \- Stays's Host and Parent group's Bookings \- Stays's Review..."  
   \- Action: Create Review  
   \- Purpose: Alternative host review creation path  
   \- Intention: Handles specific host review scenarios

5\. WORKFLOW: B: See Review is clicked  
   \- Trigger Element: B: See Review button (curkS4)  
   \- Condition: (To be documented)  
   \- Action: Likely opens review popup or navigates to review detail page  
   \- Purpose: Displays existing review details  
   \- Intention: View submitted or received review

6\. WORKFLOW: Button Pending Reviews is clicked  
   \- Trigger Element: Button Pending Reviews (curmM4)  
   \- Condition: (To be documented)  
   \- Action: Filters/displays pending reviews  
   \- Purpose: Shows reviews that need to be submitted  
   \- Intention: Tab navigation to pending reviews view

7\. WORKFLOW: Button Received Reviews is clicked  
   \- Trigger Element: Button Received Reviews (curmX4)  
   \- Condition: (To be documented)  
   \- Action: Filters/displays received reviews  
   \- Purpose: Shows reviews received from others  
   \- Intention: Tab navigation to received reviews view

8\. WORKFLOW: Button Submitted Reviews is clicked  
   \- Trigger Element: Button Submitted Reviews (curmi4)  
   \- Condition: (To be documented)  
   \- Action: Filters/displays submitted reviews  
   \- Purpose: Shows reviews already submitted by user  
   \- Intention: Tab navigation to submitted reviews view

9\. WORKFLOW: Group MAIN Review is clicked (\#1)  
   \- Trigger Element: Group MAIN Review (curmq4)  
   \- Condition: "RG: Each rating detail of the review's all ratings expanded? is no"  
   \- Action: Expand rating details  
   \- Purpose: Shows detailed rating breakdown  
   \- Intention: Toggle to expand rating categories

10\. WORKFLOW: Group MAIN Review is clicked (\#2)  
    \- Trigger Element: Group MAIN Review (curnH4)  
    \- Condition: "RG: Each rating detail of the review's all ratings expanded? is yes"  
    \- Action: Collapse rating details  
    \- Purpose: Hides detailed rating breakdown  
    \- Intention: Toggle to collapse rating categories

11\. WORKFLOW: Alerts General  
    \- Category: General alerts  
    \- Purpose: Handles general alert notifications  
    \- Intention: System-wide alert management

CUSTOM EVENTS (10):  
(To be documented \- requires clicking through each custom event)

DO WHEN ACTIONS CONDITIONS (1):  
(To be documented \- requires examining the condition)

LISTING CATEGORY:  
(To be documented)

LISTING-SLACK CATEGORY:  
(To be documented)

NAVIGATION CATEGORY:  
(To be documented)

PAGE LOADED (1):  
\- Workflow triggers when page loads  
\- Purpose: Initialize page state, load data  
\- Intention: Set up initial view based on user state

SHOW/HIDE ELEMENTS (1):  
\- Workflow controls element visibility  
\- Purpose: Dynamic UI adjustments  
\- Intention: Conditional display logic

\=== BACKEND WORKFLOWS (24 Total) \===

The application has 24 backend workflows (API workflows). Key workflows visible:

1\. Do when Current User is logged out  
   \- Trigger: User logs out  
   \- Purpose: Cleanup and redirect logic  
   \- Intention: Handle logout state management

2\. go to host-dashboard-page  
   \- Purpose: Navigate to host dashboard  
   \- Intention: Backend navigation workflow

3\. go to self-listing-page  
   \- Purpose: Navigate to listing management  
   \- Intention: Backend navigation workflow

4\. Group MAIN Review is clicked (Backend version)  
   \- Purpose: Handle review interaction backend logic  
   \- Intention: Process review clicks

5\. Page is loaded  
   \- Purpose: Backend initialization on page load  
   \- Intention: Load user-specific data

6\. set\_discounts  
   \- Purpose: Calculate and apply discounts  
   \- Intention: Pricing logic

7\. suggestion\_nightly  
   \- Purpose: Generate nightly stay suggestions  
   \- Intention: Recommendation engine

8\. suggestion\_weekly  
   \- Purpose: Generate weekly stay suggestions  
   \- Intention: Recommendation engine

9\. User is logged out: Show Sign-up  
   \- Purpose: Display signup modal  
   \- Intention: User acquisition funnel

10\. ZEP- alert for testing (copy)  
    \- Purpose: Testing alerts  
    \- Intention: Development/testing workflow

11\. ZEP- error-alert ((copy) (copy)  
    \- Purpose: Error notifications  
    \- Intention: Error handling

12\. ZEP- Information alert (copy) (copy)  
    \- Purpose: Info notifications  
    \- Intention: User communication

13\. ZEP- success-alert ((copy) (copy)  
    \- Purpose: Success notifications  
    \- Intention: Positive feedback

(Additional 11 backend workflows to be documented in detail)

\=== DATA TYPES & DATABASE STRUCTURE \===

Key data types involved in the reviews-overview page:

1\. BOOKINGS \- STAYS  
   \- Main booking entity  
   \- Fields include:  
     \* Guest (User reference)  
     \* Host (User reference)  
     \* Lease's Agreement Number  
     \* Check In (night) \- Date field  
     \* Check Out (day) \- Date field  
     \* Review Submitted by Guest \- Review reference  
     \* Review Submitted by Host \- Review reference  
     \* Lease's Host's User's Name

2\. REVIEW (MAIN Review)  
   \- Central review entity  
   \- Fields include:  
     \* Reviewer's Name \- First  
     \* Reviewer's Name \- Last  
     \* Comment \- Text field  
     \* Creation Date  
     \* Overall Rating SR (Host reviewing's value rounded to 2\)  
     \* All ratings expanded? \- Boolean field

3\. RATING DETAIL (reviewer's)  
   \- Individual rating categories  
   \- Fields include:  
     \* Category/Label \- Text  
     \* Rating value \- Number  
     \* Associated review reference

4\. USER (Current User)  
   \- User entity  
   \- Fields include:  
     \* Name \- First  
     \* Name \- Last  
     \* Unique id  
     \* Proposals List:filtered:count  
     \* Number of messages

5\. PROPOSALS  
   \- Booking proposals  
   \- Referenced in header badge count

6\. MESSAGES  
   \- User messages  
   \- Referenced in header icon count

\=== KEY FUNCTIONAL REQUIREMENTS \===

1\. REVIEW TAB NAVIGATION  
   \- Three-tab system: Pending / Received / Submitted  
   \- Tab state management via workflows  
   \- Filter bookings based on review status  
   \- Dynamic content loading per tab

2\. REVIEW CREATION FLOW  
   \- Conditional "Create Review" button visibility  
   \- Separate workflows for Guest vs Host reviews  
   \- Validation: Only show button when review not yet submitted  
   \- Modal/popup integration (likely using reusable element "♻️💥Review for Stays NEW")

3\. REVIEW VIEWING  
   \- "See Review" button for completed reviews  
   \- Display reviewer information  
   \- Show overall rating (rounded to 2 decimals)  
   \- Expandable detailed rating breakdown  
   \- Toggle expand/collapse with conditional workflows

4\. EMPTY STATE HANDLING  
   \- Display message when no reviews exist  
   \- Conditional visibility logic  
   \- User guidance messaging

5\. DATA FILTERING & SEARCHES  
   \- Filter bookings by:  
     \* Current User is Guest AND review not submitted by guest  
     \* Current User is Guest AND review submitted by guest  
     \* Current User is Host AND review not submitted by host  
     \* Current User is Host AND review submitted by host  
   \- Date-based filtering (check-in/check-out dates)

6\. RESPONSIVE DESIGN  
   \- Mobile version handling  
   \- Adaptive layout for different screen sizes  
   \- Two-column review card layout

\=== REUSABLE ELEMENTS USED \===

1\. ⛴ Header A  
   \- Main navigation header  
   \- Contains logo, menus, notifications, user avatar

2\. ♻️💥Sign up & Login A  
   \- Authentication modal  
   \- Login/signup functionality

3\. FG: Config  
   \- Configuration floating group  
   \- Purpose needs documentation

4\. ♻️ Host Review Guest  
   \- Review submission interface for hosts  
   \- Rating and comment inputs

5\. ♻️💥visit-reviewer-house-manual  
   \- House manual viewing for review context

6\. ♻️💥Review for Stays NEW  
   \- Primary review creation interface  
   \- Likely contains:  
     \* Rating inputs (multiple categories)  
     \* Comment text area  
     \* Submit button  
     \* Validation logic

7\. footer-hypo1 A  
   \- Site-wide footer  
   \- Links, referral tools, app promotion

\=== TECHNICAL IMPLEMENTATION NOTES \===

1\. ELEMENT NAMING CONVENTIONS  
   \- T: prefix \= Text elements  
   \- G: prefix \= Group elements  
   \- B: prefix \= Button elements  
   \- RG: prefix \= Repeating Group elements  
   \- FG: prefix \= Floating Group elements  
   \- ♻️ prefix \= Reusable elements  
   \- 💥 prefix \= Active/featured reusable elements  
   \- ⛴ prefix \= Header/navigation elements

2\. ELEMENT ID STRUCTURE  
   \- Base62 encoding (e.g., cuolQ0, curIi4, curhA4)  
   \- Hierarchical naming for organization  
   \- IDs maintain parent-child relationships

3\. CONDITIONAL LOGIC PATTERNS  
   \- Display conditionals based on user role (Guest vs Host)  
   \- Review submission status checks  
   \- Empty state vs populated state logic  
   \- Expand/collapse state management

4\. DATA BINDING  
   \- Parent group's context for nested elements  
   \- Dynamic text interpolation with backticks  
   \- Formatted dates ("formatted as Monday, January 26, 2026")  
   \- Rounded numbers ("rounded to 2")

5\. STYLING  
   \- Custom Styles: "Paragraph \- Block 14 (Overridden)"  
   \- Flat color backgrounds  
   \- Font: Default appears to be system font  
   \- Colors: Purple theme (\#specific codes need documentation)  
   \- Border radius: Roundness style

\=== AREAS REQUIRING FURTHER DOCUMENTATION \===

For a complete migration to code, the following details need to be captured:

1\. DETAILED WORKFLOW ACTIONS  
   \- Complete action sequences for each workflow  
   \- All parameters for Create Review action  
   \- Navigation targets and parameters  
   \- Custom state updates  
   \- API call details

2\. COMPLETE CONDITIONAL EXPRESSIONS  
   \- Full conditional logic for each element  
   \- Visibility rules  
   \- Enable/disable conditions  
   \- Dynamic styling conditions

3\. DATA SOURCE QUERIES  
   \- Exact search filters for each repeating group  
   \- Sort orders  
   \- Constraints and advanced filters  
   \- Data source for each element

4\. BACKEND WORKFLOW DETAILS  
   \- All 24 backend workflows need full documentation  
   \- Parameters, privacy rules, return types  
   \- Action sequences within each workflow  
   \- Scheduling and recurring logic

5\. REVIEW CREATION MODAL SPEC  
   \- Complete form field specifications  
   \- Validation rules  
   \- Rating scale (1-5? 1-10?)  
   \- Rating categories list  
   \- Required vs optional fields  
   \- Submit button logic

6\. DATA PRIVACY RULES  
   \- Who can view reviews (public? users only?)  
   \- Who can edit/delete reviews  
   \- Privacy settings on data types

7\. API INTEGRATIONS  
   \- External services (Hotjar, Google Analytics, Facebook Pixel)  
   \- API keys and configuration  
   \- Webhook endpoints

8\. CUSTOM EVENTS DETAIL  
   \- All 10 custom events need documentation  
   \- Event parameters  
   \- Trigger conditions  
   \- Actions performed

9\. PLUGIN CONFIGURATIONS  
   \- List of all plugins used  
   \- Plugin settings  
   \- Custom code in plugins

10\. RESPONSIVE BREAKPOINTS  
    \- Exact breakpoint values  
    \- Element behavior at each breakpoint  
    \- Mobile-specific conditionals

\=== NEXT PASS INSTRUCTIONS \===

To complete this requirements document and fill in all missing details, follow these steps:

1\. DETAILED WORKFLOW DOCUMENTATION  
   Prompt: "For each of the 24 workflows in the reviews-overview page, document:  
   \- The complete sequence of actions  
   \- All parameters for each action  
   \- Conditional logic for each action  
   \- Navigation destinations with parameters  
   \- Custom state changes  
   \- Database operations (create, update, delete)  
   \- Click through each workflow in the Bubble IDE and capture full details"

2\. ELEMENT CONDITIONALS DEEP DIVE  
   Prompt: "For every element on the reviews-overview page, document:  
   \- All conditional visibility rules  
   \- Dynamic styling conditions  
   \- Enable/disable logic  
   \- Click on each element in the Design tab and examine the Conditional tab  
   \- Capture the full expression for each conditional"

3\. DATA SOURCE SPECIFICATIONS  
   Prompt: "For each repeating group and dynamic element:  
   \- Document the exact data source query  
   \- List all constraints and filters  
   \- Specify sort orders  
   \- Document how data flows from parent to child elements  
   \- Examine each repeating group's data source settings"

4\. BACKEND WORKFLOWS COMPLETE SPEC  
   Prompt: "For all 24 backend workflows:  
   \- Document each workflow's purpose and trigger  
   \- List all parameters (name, type, required/optional)  
   \- Document privacy rules  
   \- List all actions in sequence with parameters  
   \- Capture any scheduling or recurring logic  
   \- Navigate to Backend Workflows tab and click through each one"

5\. REVIEW MODAL COMPLETE SPECIFICATION  
   Prompt: "Open the '♻️💥Review for Stays NEW' reusable element and document:  
   \- All form fields (name, type, validation)  
   \- Rating categories (list all)  
   \- Rating scale (min/max values)  
   \- Required vs optional field rules  
   \- Submit button workflow  
   \- Cancel/close logic  
   \- Success/error handling"

6\. DATA TYPE SCHEMAS  
   Prompt: "Go to the Data tab and document:  
   \- Complete field list for Bookings \- Stays  
   \- Complete field list for Review  
   \- Complete field list for Rating Detail  
   \- Complete field list for User  
   \- All relationships between data types  
   \- Field types, defaults, privacy rules"

7\. CUSTOM EVENTS DOCUMENTATION  
   Prompt: "For each of the 10 custom events:  
   \- Document the event name  
   \- List all parameters  
   \- Document where it's triggered  
   \- Document what actions it performs  
   \- Find references across the application"

8\. STYLING SYSTEM  
   Prompt: "Document the complete styling system:  
   \- All style names used  
   \- Font families, sizes, weights  
   \- Color palette (all colors with hex codes)  
   \- Spacing system  
   \- Border radius values  
   \- Shadow definitions  
   \- Go to Styles tab and capture all definitions"

9\. RESPONSIVE BEHAVIOR  
   Prompt: "Switch to Responsive tab and document:  
   \- All breakpoint values  
   \- Element positioning rules  
   \- Visibility changes at breakpoints  
   \- Size/spacing adjustments  
   \- Mobile-specific layouts"

10\. INTEGRATION CONFIGURATIONS  
    Prompt: "Go to Settings and Plugins tabs to document:  
    \- All installed plugins  
    \- Plugin settings and API keys  
    \- External service integrations  
    \- Webhook configurations  
    \- Environment variables"

\=== MIGRATION READINESS CHECKLIST \===

☐ All 24 page workflows fully documented  
☐ All element conditionals captured  
☐ All data sources and filters specified  
☐ All 24 backend workflows documented  
☐ Review creation modal fully specified  
☐ Complete data type schemas captured  
☐ All 10 custom events documented  
☐ Styling system fully defined  
☐ Responsive behavior documented  
☐ Integration configurations captured  
☐ Privacy rules documented  
☐ User permissions mapped  
☐ Testing scenarios identified  
☐ Edge cases documented  
☐ Error handling specified

\=== SUMMARY \===

This document provides a comprehensive overview of the reviews-overview page in the Split Lease Bubble application. It covers:

\- Page structure and layout  
\- All major UI components and their element IDs  
\- Workflow organization (24 workflows categorized)  
\- Backend workflow inventory (24 workflows)  
\- Data types and their relationships  
\- Key functional requirements  
\- Reusable elements and their purposes  
\- Technical implementation patterns  
\- Areas requiring additional documentation

The document is structured to support a complete migration from Bubble to custom code by capturing both the current implementation and identifying gaps that need further investigation.

For developers implementing this in code, this document serves as:  
1\. A functional specification  
2\. A data model reference  
3\. A workflow logic guide  
4\. A UI/UX blueprint  
5\. A checklist for feature completeness

Next steps involve following the "Next Pass Instructions" to fill in all detailed specifications that require clicking through each individual workflow, conditional, and configuration in the Bubble IDE.

