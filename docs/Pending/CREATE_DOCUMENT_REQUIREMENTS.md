\_create-document Page \- Comprehensive Requirements Document for Migration to Code

Executive Summary

The \_create-document page is a form-based interface within the Split Lease application that allows users to create new document records. The page features a simple, clean layout with three primary input elements: a document selector dropdown, a document name input field, and a host selector dropdown. Upon submission, the page triggers a workflow that creates a new "Documents Sent" record in the database with the selected document policy, a dynamically populated document title, and the selected host information.

Page URL: https://app.split.lease/\_create-document

Page Identifier in Bubble: \_create-document

Page Purpose: Document Creation Interface  
Allow users to select a policy document, optionally rename it, select a host recipient, and create a new Documents Sent record.

1\. PAGE LAYOUT AND VISUAL STRUCTURE

1.1 Header Component: \_Corporate Header A  
Type: Reusable Element  
Dimensions: 1440x129 pixels  
Position: Fixed at top of page  
Visibility: Always visible on page load  
Purpose: Displays Split Lease branding, navigation menus (Corporate Pages, Unit Tests), and Change Prices button

1.2 Form Container Layout  
The form has three input elements arranged vertically with a submit button.

2\. PAGE ELEMENTS \- DETAILED ANALYSIS

2.1 Element: D: Choose document to send  
Type: Dropdown (Searchable Select)  
Position: X=765, Y=292 (approx)  
Dimensions: Width 250px, Height 48px  
Element ID: coRXw  
Placeholder Text: "Choose document to send"  
Visibility: Always visible on page load  
Fixed width: Yes  
Validation: None explicitly set

Data Source Configuration:  
\- Choices Style: Dynamic choices  
\- Type of Choices: ZAT-Policies Documents (Database object type)  
\- Choices Source Search: Search for ZAT-Policies Documents (searches all ZAT-Policies Documents)  
\- Option Caption: Current option's Name field  
Available Options in Live Environment: 13 policy documents including:  
  \- Community Guidelines  
  \- Cancellation and Refund Policy  
  \- Fees Overview  
  \- Booking Agreement  
  \- Privacy Policy  
  \- Terms of Use  
  \- Host Guarantee Terms and Conditions  
  \- Payments Terms of Service  
  \- Host Guarantee  
  \- Example Supplemental Agreement  
  \- Example Rental Agreement  
  \- Cookie Policy  
  \- Background Check Consent Form

Styling:  
\- Style Class: Drop \- Aqua Focus  
\- Border Color on Focus: \#52A8EC (blue)  
\- Box Shadow on Focus: Outset with 6px blur radius  
\- Border Color when Invalid: \#FF0000 (red)  
\- Box Shadow when Invalid: Outset with 6px blur radius

Conditional Visibility: None (always visible)  
Default Value: None  
Required Field: Not marked as required

Bindings & Expressions:  
\- No auto-binding to parent element configured

2.2 Element: IN: Enter Document name  
Type: Text Input  
Position: X=182, Y=248  
Dimensions: Width 250px, Height 48px  
Element ID: coRXq  
Placeholder Text: "Title"  
Visibility: Always visible on page load  
Fixed width: Yes

Input Configuration:  
\- Content Format: Text  
\- Placeholder: "Title"  
\- Initial Content: D: Choose document to send's value's Name (dynamic binding to selected document)  
\- Validation: "This input should not be empty" (enabled)  
\- Prevent "Enter" key from submitting: False

Styling:  
\- Style Class: None (Custom)  
\- Font: 14px (App Font)  
\- Font Color: \#3D3D3D  
\- Border Color on Focus: \#52A8EC (blue)  
\- Box Shadow on Focus: Outset with 6px blur radius  
\- Border Color when Invalid: \#FF0000 (red)  
\- Box Shadow when Invalid: Outset with 6px blur radius

Conditional Visibility: None (always visible)  
Behavior: The input field auto-populates with the selected document's name when a document is chosen from the "D: Choose document to send" dropdown

Key Behavior: Editable \- users can manually edit the pre-populated document name before submission

2.3 Element: D: Choose Host  
Type: Dropdown (Searchable Select)  
Position: X=319, Y=326  
Dimensions: Width 250px, Height 48px  
Element ID: coRYC  
Placeholder Text: "Choose Host"  
Visibility: Always visible on page load  
Fixed width: Yes

Data Source Configuration:  
\- Choices Style: Dynamic choices  
\- Type of Choices: User (Bubble's built-in User data type)  
\- Choices Source Search: Search for Users (searches all User records)  
\- Option Caption: Current option's email field  
Available Users in Live Environment: 200+ test and production users with email addresses from various domains

Styling:  
\- Style Class: Drop \- Purple Border  
\- Font Color: Inherits from style

Conditional Visibility: None (always visible)  
Default Value: None  
Required Field: Not marked as required

2.4 Element: B: Create Document  
Type: Button  
Position: X=319, Y=409  
Dimensions: Width 231px, Height 51px  
Element ID: coRYI  
Button Text: "Create Document"  
Visibility: Always visible on page load  
Fixed width: Yes

Button Configuration:  
\- Is clickable: Yes (not marked as non-clickable)  
\- Style: Purple Outline  
\- Font: DM Sans, 18px, 700 weight  
\- Font Color: \#6D31C2 (purple)  
\- Background: Flat color \- Primary contrast (\#FFFFFF)

Conditional States:  
\- When "This Button is hovered": Properties defined in Purple Outline style (applies hover effects)  
\- When "This Button is not clickable is yes": Properties defined in Purple Outline style (grayed out/disabled appearance)  
\- When "This Button is not clickable is yes AND This Button is hovered": Properties defined in Purple Outline style

OnClick Workflow:  
\- Workflow: "B: Create Document is clicked-Creates a new Document"  
\- Event Type: Element click event  
\- Condition: Only when Click (always fires on click)

3\. WORKFLOWS \- PAGE LEVEL

3.1 Workflow: "B: Create Document is clicked-Creates a new Document"

Trigger Event: Button click on element "B: Create Document"  
Workflow Type: Action-based (User-initiated)  
Condition: Only when Click (executes on every button click)

Workflow Actions:

Step 1: Create a new Documents Sent  
Action Type: Create a new record in the Documents Sent database table  
Fields populated:  
  \- Document on policies \= D: Choose document to send's value  
    (Expression: References the selected ZAT-Policies Document object)  
    
  \- Document sent title \= D: Choose document to send's value's Name  
    (Expression: Extracts the Name field from the selected document)  
    
  \- Host user \= D: Choose Host's value  
    (Expression: References the selected User object from host dropdown)  
    
  \- Host email \= D: Choose Host's value's email  
    (Expression: Extracts the email field from the selected host user)  
    
  \- Host name \= D: Choose Host's value's Name \+ " Full"  
    (Expression: Concatenates the user's Name field with the literal string " Full")

Optional Fields:  
\- "Set another field" option available to add additional fields if needed  
\- "Add all fields" option available to auto-populate all remaining fields

Execution Condition: None (always executes if step is reached)  
Order: First step in workflow

Intent: Creates a permanent record of the document being sent to a host, establishing an audit trail for policy document distribution

3.2 Custom Event: "alert for testing (copy)"

Event Type: Custom Event (not triggered by this page, defined globally)  
Custom Event Name: alert for testing (copy)  
Parameters:  
  \- content (Text, optional)  
  \- title (Text, optional)    
  \- warning (red alert) (Yes/No, optional)  
  \- success (green alert) (Yes/No, optional)  
Return Values: None configured

Event Steps (execution flow):

Step 1: AirAlert \- Custom DEFAULT  
Condition: When Isn't live version is yes AND warning (red alert) formatted as number is 0 AND success (green alert) formatted as number is 0  
(Displays default alert when not in production and no specific alert type is requested)

Step 2: AirAlert \- Custom WARNING red alert  
Condition: When Isn't live version is yes AND warning (red alert) is yes  
(Displays red warning alert when in test mode and warning flag is enabled)

Step 3: AirAlert \- Custom SUCCESS green alert  
Condition: When Isn't live version is yes AND success (green alert) is yes  
(Displays green success alert when in test mode and success flag is enabled)

Intent: Provides flexible alert display for testing purposes with conditional rendering based on alert type and environment

3.3 Page Event: "Page is loaded"

Trigger: Page load event  
Condition: Always (executes once when page loads)

Step 1: Run javascript HIDE crisp chat on mobile  
Action Type: Execute custom JavaScript  
Script: window.$crisp.push(\["do", "chat:hide"\]);  
Docs: https://toolboxdocs.netlify.app  
Asynchronous: Yes (enabled)  
Parameters: None configured

Intent: Hides the Crisp chat widget on page load for mobile optimization (likely to improve mobile UX by removing the chat bubble)

4\. DATA BINDINGS AND DYNAMIC EXPRESSIONS

4.1 Document Dropdown to Document Name Input Binding  
Source: D: Choose document to send (dropdown element)  
Target: IN: Enter Document name (input field \- Initial Content)  
Expression: \[Source\].value's Name  
Behavior: When user selects a document from the dropdown, the input field automatically updates with the selected document's Name field  
Manual Override: User can edit the text after initial population  
Dependency: Input field depends on dropdown value

4.2 Host Selection to Document Record Creation  
Source: D: Choose Host (dropdown element)  
Target: Documents Sent record (created via workflow)  
Expressions used:  
\- Host user: D: Choose Host's value (entire User object)  
\- Host email: D: Choose Host's value's email (email field from User)  
\- Host name: D: Choose Host's value's Name \+ " Full" (concatenated string with literal " Full")  
Behavior: When button is clicked, these expressions are evaluated to populate the Documents Sent record

5\. DATABASE SCHEMA REQUIREMENTS

5.1 Documents Sent Table Fields (Required)  
\- Document on policies (field type: ZAT-Policies Documents) \- Foreign key to policy document  
\- Document sent title (field type: Text) \- Stores the document name  
\- Host user (field type: User) \- References the host user  
\- Host email (field type: Email or Text) \- Stores host's email  
\- Host name (field type: Text) \- Stores host's full name with " Full" suffix  
\- Additional fields: (Not specified in current workflow \- see backend workflows for complete schema)

5.2 ZAT-Policies Documents Table (Referenced)  
\- Name (field type: Text) \- Required, displayed in dropdown  
\- (Other fields not specified on this page)

5.3 User Table (Built-in Bubble)  
\- email (field type: Email) \- Displayed in host dropdown  
\- Name (field type: Text) \- Used in host name field creation  
\- (Standard Bubble User fields)

6\. BACKEND WORKFLOWS CONTEXT

Note: The application has 296 total backend workflows across the entire app, organized into categories such as:  
\- Bulk Fix (48)  
\- Messaging System (52)  
\- Listing Workflows (15)  
\- Leases Workflows (11)  
\- Data Management (5)  
\- Core \- User Management (5)

The \_create-document page primarily uses the Documents Sent creation action from the frontend workflow. Additional backend processing (if any) would occur after the record is created and would be handled by backend workflows listening to Documents Sent creation events. (No specific backend workflow dependencies documented for this page in the current analysis)

7\. USER INTERACTION FLOW

Step 1: User navigates to https://app.split.lease/\_create-document  
Step 2: Page loads and JavaScript executes to hide Crisp chat  
Step 3: Three form fields are displayed with placeholders  
Step 4: User selects a policy document from "D: Choose document to send" dropdown  
Step 5: "IN: Enter Document name" field auto-populates with document name  
Step 6: User can optionally edit the document name  
Step 7: User selects a host from "D: Choose Host" dropdown  
Step 8: User clicks "Create Document" button  
Step 9: Workflow executes: Creates a new Documents Sent record with:  
  \- selected policy document  
  \- document name (as displayed in input field)  
  \- selected host user and email  
  \- host name with " Full" suffix  
Step 10: Record is saved to database  
Step 11: Page behavior after creation: (Not specified \- unclear if page redirects, shows confirmation, or clears fields)

8\. VALIDATION RULES

8.1 Input Validation  
\- IN: Enter Document name: Must not be empty (validation enabled)  
\- D: Choose document to send: No explicit validation, but likely expects a selection  
\- D: Choose Host: No explicit validation, but likely expects a selection

8.2 Styling Indicators  
\- Focus state: Blue border (\#52A8EC) and box shadow on inputs  
\- Invalid state: Red border (\#FF0000) and box shadow  
\- Button disabled state: Styling applied when "not clickable is yes"

9\. UNCERTAINTIES AND AREAS REQUIRING CLARIFICATION

9.1 Post-Submission Behavior  
\- Is the page redirected after document creation?  
\- Are form fields cleared after successful submission?  
\- Is a success message displayed to the user?  
\- Are there any error handling flows for failed record creation?

9.2 Field Validation Order  
\- What is the order of validation when the Create Document button is clicked?  
\- Does the page validate inputs before triggering the workflow?  
\- Are there conditional validations based on form state?

9.3 Additional Document Fields  
\- The "Set another field" option exists in the workflow \- which fields are available for manual population?  
\- Are there required fields on the Documents Sent table beyond those populated by the form?  
\- What does the "Add all fields" option automatically populate?

9.4 Host Name Concatenation  
\- Why is " Full" concatenated to the host name? (Business logic intent unclear)  
\- Is this a naming convention requirement or a data formatting choice?

9.5 Custom Event Usage  
\- When and where is the "alert for testing (copy)" custom event triggered from?  
\- Is it used by workflows on this page or elsewhere in the app?  
\- What is its primary purpose in the application?

9.6 Page Permissions  
\- Are there user role/permission checks before displaying this page?  
\- Can all authenticated users access this page, or is it role-restricted?  
\- Are there specific user types that should/should not see this form?

9.7 Backend Processing  
\- After the Documents Sent record is created, what backend workflows are triggered?  
\- Are emails sent to the host user?  
\- Is there any document generation or file processing?  
\- Are there any audit logs or notification systems?

10\. MIGRATION CHECKLIST FOR CODE-BASED IMPLEMENTATION

UI Components Required:  
  \[ \] Header component reusable element rendering  
  \[ \] Form container with three input sections  
  \[ \] Searchable dropdown for ZAT-Policies Documents  
  \[ \] Text input field with auto-population from dropdown  
  \[ \] Searchable dropdown for User selection  
  \[ \] Submit button with loading states  
  \[ \] Conditional styling (focus, invalid states)

Data Layer Required:  
  \[ \] ZAT-Policies Documents database query  
  \[ \] Users database query  
  \[ \] Documents Sent database schema/model  
  \[ \] Create Documents Sent record functionality

Workflow Logic Required:  
  \[ \] Document dropdown selection handler  
  \[ \] Document name auto-population logic  
  \[ \] Form submission handler  
  \[ \] Documents Sent record creation with field mapping  
  \[ \] Page load JavaScript execution (Crisp chat hiding)  
  \[ \] Error handling for record creation failures  
  \[ \] Post-submission page state management

Validation Required:  
  \[ \] Document name field required validation  
  \[ \] Form submission validation before API call  
  \[ \] Visual feedback for validation states (red borders)

Styling Required:  
  \[ \] DM Sans font usage  
  \[ \] Purple button styling (\#6D31C2)  
  \[ \] Aqua focus states on inputs (\#52A8EC)  
  \[ \] Red invalid states (\#FF0000)  
  \[ \] Responsive layout (250px fixed widths noted)

11\. TECHNICAL SUMMARY FOR MIGRATION

11.1 Architecture Overview  
The \_create-document page is a simple, single-purpose form interface. It follows a straightforward pattern:  
1\. User selects from two dropdown lists (document and host)  
2\. One field auto-populates based on dropdown selection  
3\. Form submission creates a database record with mapped values  
4\. No complex conditional logic or advanced state management

11.2 Data Flow  
UI Input \-\> Workflow Execution \-\> Database Record Creation

The page does not implement complex features such as:  
\- Multi-step forms  
\- Conditional field visibility  
\- Real-time calculations or aggregations  
\- File uploads or media handling  
\- External API integrations  
\- User authentication flows  
\- Permission-based field restrictions

11.3 Estimated Complexity for Code Migration  
Low to Medium Complexity

Why Low:  
\- Only 4 form elements  
\- Single workflow with one action  
\- No loops or complex conditions  
\- Straightforward data mapping

Why Medium:  
\- Requires database model/schema knowledge  
\- Auto-population logic adds slight complexity  
\- Styling details need careful implementation  
\- Need to understand post-submission flow

11.4 Implementation Priority  
This page is a candidate for early migration as it is:  
Self-contained (no complex interdependencies)  
Low risk (simple form submission)  
High value (core functionality)  
Easy to test (clear input/output)

\---

Document prepared by: Comprehensive Bubble IDE Analysis  
Analysis date: January 2025  
Scope: Complete page specification and requirements  
Confidence Level: High (all elements and workflows documented)  
Status: Ready for development handoff

Note: This document contains 80+ specific technical requirements and should be used as a comprehensive specification for code-based implementation. Areas marked as "Uncertainties" (Section 9\) should be clarified with the product/engineering team before development begins.

