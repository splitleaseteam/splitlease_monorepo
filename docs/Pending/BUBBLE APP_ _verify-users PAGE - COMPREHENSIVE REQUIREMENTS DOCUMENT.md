BUBBLE APP: \_verify-users PAGE \- COMPREHENSIVE REQUIREMENTS DOCUMENT

1\. EXECUTIVE SUMMARY

The \_verify-users page is a user identity verification dashboard within the Split Lease application. It allows administrators or authorized users to select users from the system and verify their identity based on photographic evidence (profile photo, selfie with ID, and both sides of government-issued ID). The page integrates with backend workflows to update user verification status, send notifications, and manage profile completion tracking.

2\. PAGE OVERVIEW & PURPOSE

App: Split Lease (Production)  
Page Name: \_verify-users  
Page Type: Single-page application (SPA)  
Primary Function: User identity verification and management  
Target Users: Administrators or verification personnel

3\. USER INTERFACE STRUCTURE

3.1 Header Section  
\- Reusable Element: Corporate Header A  
\- Displays: Split Lease branding, navigation menu, user profile section

3.2 Main Content Area

3.2.1 User Selection Section  
Heading: "Select User"

Elements:  
a) Email Input Field (IN: Enter user's email)  
   \- Type: Input (Text)  
   \- Placeholder: "Type user's email"  
   \- Purpose: Manual email entry for user lookup  
   \- Properties:  
     \* Content format: Text  
     \* Visible on page load: Yes  
     \* Fixed width: Yes  
     \* Dimensions: W=290, H=43, X=137, Y=198  
   \- Conditionals: 2 conditions on this element  
   \- Auto-binding: Enabled on parent element

b) User Dropdown Selector (D: select user)  
   \- Type: Dropdown  
   \- Placeholder: "Choose an option..."  
   \- Choices Style: Dynamic choices  
   \- Type of Choices: User  
   \- Choices Source: "Search for Users"  
   \- Option Caption: "Current option's Name \- Full and Current option's email"  
   \- Default Value: "Search for Users:first item"  
   \- Dimensions: W=451, H=44, X=437, Y=198  
   \- Conditionals: 3 conditions  
     \* When Dropdown is focused: Border color \#52ABEC  
     \* When Dropdown isn't valid: Border color \#FF0000  
     \* When URL contains user data: Default value from URL parameter

3.2.2 Identity Verification Section  
Heading: "Identity Verification"

Container: "G: verify Users" (Group)  
\- Type of Content: User  
\- Data Source: D: select user's value  
\- Dimensions: W=724, H=562, X=137, Y=290  
\- Styling: Border solid 2px, color \#4D4D4D, roundness 20px  
\- Layout: 2x2 grid for 4 images

Child Elements (4 Photo Sections):

1\. Profile Photo  
   \- Label: "Parent group's User's Name \- Full profile picture"  
   \- Image: IM: User Profile Photo  
   \- Source: Current user's profile photo  
   \- Clickable: Yes \- opens external image viewer

2\. Selfie with ID  
   \- Label: "Parent group's User's Name \- Full Selfie"  
   \- Image: IM: Selfie  
   \- Source: User's selfie with ID photo  
   \- Clickable: Yes \- opens external image viewer

3\. Front ID  
   \- Label: "Parent group's User's Name \- Full Front ID"  
   \- Image: IM: Front Of ID  
   \- Source: Front of government-issued ID  
   \- Clickable: Yes \- opens external image viewer

4\. Back ID  
   \- Label: "Parent group's User's Name \- Full Back ID"  
   \- Image: IM: Back Of ID  
   \- Source: Back of government-issued ID  
   \- Clickable: Yes \- opens external image viewer

3.2.3 Verification Toggle  
Element: "TGL: User Verified?"  
\- Type: IonicToggle  
\- Position: Right side of verification container  
\- Function: Mark user as verified or unverified  
\- Default: Off (unchecked)  
\- Associated Label: "T: User verified?"

4\. WORKFLOWS (PAGE-LEVEL) \- 8 Total

4.1 Page Load Workflow  
Trigger: Page is loaded  
Actions:  
\- Run javascript: HIDE crisp chat on mobile

4.2 Custom State Event: "update profile completeness"  
Parameters:  
\- task to add (text, required)  
\- percentage to add (number, required)  
\- user (User, required)

Steps:  
1\. Make changes to User  
2\. Cancel scheduled API reminder (when profile \>= 80% complete)

4.3 Image Click Workflows (4 total)  
\- IM: Back Of ID is clicked \-\> Open external website  
\- IM: Front Of ID is clicked \-\> Open external website  
\- IM: Selfie is clicked \-\> Open external website  
\- IM: User Profile Photo is clicked \-\> Open external website

4.4 Verification Workflows (2 total)

4.4.1 When Toggle \= ON (User Verified)  
Trigger: TGL: User Verified? is checked  
Steps:  
1\. Make changes to User (mark as verified)  
2\. Schedule API Workflow core-update-user-profile-completeness (if identity task not completed)  
3\. Send email INTERNAL  
4\. Send magic login link to ACCOUNT-PROFILE page  
5\. Schedule API Workflow send\_basic\_email (user confirmation)  
6\. Relay SMS of verification completion

4.4.2 When Toggle \= OFF (User Unverified)  
Trigger: TGL: User Verified? is unchecked  
Action: Reverse verification status

5\. BACKEND WORKFLOWS

5.1 core-update-verify-phone  
\- Type: Public API Workflow  
\- Endpoint: core-update-verify-phone  
\- Parameter: User (required)  
\- Response: JSON Object  
\- Step: Make changes to User (when phone is unique and not empty)

5.2 Other Core Workflows:  
\- core-ai-credits  
\- core-reset-password-react  
\- core-signup-new-user-react  
\- Core-Signup Host Live Zap

6\. DATA BINDING

6.1 Dropdown Data Source  
\- Search Query: "Search for Users"  
\- Returns: List of User objects  
\- Display: User's full name and email

6.2 Group Data Context  
"G: verify Users" bound to selected user enables:  
\- Parent group's User's Profile Photo  
\- Parent group's User's Selfie with ID  
\- Parent group's User's ID front  
\- Parent group's User's ID Back  
\- Parent group's User's Name \- Full  
\- Parent group's User's Tasks Completed

7\. CONDITIONALS & VISIBILITY

7.1 Email Input: 2 conditionals (visibility/state)  
7.2 Dropdown: 3 conditionals (focus, validation, URL param)  
7.3 Group: 1 conditional (visibility when user selected)

8\. URL PARAMETERS

Parameter: "Get user from page URL"  
Function: Pre-loads specific user from URL  
Example: \_verify-users?user=\[user\_id\]

9\. USER JOURNEY

9.1 Initial Load  
1\. Page loads, hides chat widget  
2\. Email input and dropdown visible  
3\. Verification group hidden

9.2 User Selection  
1\. Type email or select from dropdown  
2\. G: verify Users becomes visible  
3\. All 4 images display for selected user

9.3 Review Images  
1\. Click any image to view full-size  
2\. External viewer opens in new window

9.4 Verify User  
1\. Toggle "User verified?" ON  
2\. Workflow triggers:  
   \- User marked verified  
   \- Profile completeness updated  
   \- Internal email sent  
   \- Magic link sent to user  
   \- Confirmation email sent  
   \- SMS sent to user

10\. SEARCH LOGIC

"Search for Users" Query  
\- Data Type: User objects  
\- Returns list of users matching criteria  
NOTE: Exact filtering criteria requires further inspection

11\. STYLING

Header:  
\- Blue background (\#0015B8)  
\- Split Lease logo and navigation

Content:  
\- White/light background  
\- Light gray form elements

Verification Container:  
\- Border: Solid 2px \#4D4D4D  
\- Border radius: 20px  
\- 2x2 image grid layout  
\- Toggle on right side

12\. AREAS REQUIRING FURTHER ANALYSIS

To complete the specification, need to investigate:

1\. SEARCH CRITERIA \- Exact parameters in "Search for Users"  
2\. EMAIL INPUT CONDITIONALS \- Full details of the 2 conditions  
3\. IMAGE OPEN MECHANISM \- Exact URL handling for image viewers  
4\. REMAINING WORKFLOWS \- Email, SMS, profile completeness logic  
5\. ACCESS CONTROL \- Who can access this page?  
6\. MOBILE RESPONSIVENESS \- Layout on smaller screens  
7\. ERROR HANDLING \- What happens with missing images or network errors?  
8\. COMPLETENESS THRESHOLD \- How is 80% calculated for profile completeness?

13\. TESTING CHECKLIST

Functional:  
\- \[ \] Email input validation  
\- \[ \] Dropdown user selection  
\- \[ \] Image click functionality  
\- \[ \] Verification toggle workflow  
\- \[ \] URL parameter loading  
\- \[ \] Email/SMS delivery

Edge Cases:  
\- \[ \] Users with missing images  
\- \[ \] Multiple verification attempts  
\- \[ \] Different profile completeness levels  
\- \[ \] Slow network conditions

14\. KEY COMPONENTS FOR CODE MIGRATION

To Recreate:  
1\. Dynamic user dropdown with search  
2\. Image gallery with click-to-enlarge  
3\. Toggle switch element  
4\. Conditional visibility logic  
5\. Multi-step workflow execution  
6\. Backend API integration  
7\. Email/SMS notification system

Data Models:  
\- User (with verification status, profile images, completeness %)  
\- Tasks Completed (list of completed user tasks)  
\- Verification State (boolean or enum)

15\. SUMMARY

The \_verify-users page is a focused identity verification tool. Administrators select users, review their 4 identity documents, and toggle verification status. On verification, the system automatically updates the database, marks identity as completed in profile tasks, and notifies users via email and SMS. The page uses Bubble's dynamic search, conditional visibility, and workflow automation to manage this process.

End of Document  
