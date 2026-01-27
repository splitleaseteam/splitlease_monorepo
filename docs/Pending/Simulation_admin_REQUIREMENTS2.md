**COMPREHENSIVE REQUIREMENTS DOCUMENT**

**Split Lease \- Simulation Admin Page (\_simulation-admin)**  
**Bubble to Code Migration**

**Document Created: January 13, 2026**  
**Page URL: app.split.lease/\_simulation-admin**

**\==================================================**

**TABLE OF CONTENTS**

**1\. PAGE OVERVIEW**  
**2\. PAGE PROPERTIES**  
**3\. ELEMENT HIERARCHY AND STRUCTURE**  
**4\. DETAILED ELEMENT SPECIFICATIONS**  
**5\. DATA SOURCES AND EXPRESSIONS**  
**6\. CONDITIONALS AND DYNAMIC BEHAVIOR**  
**7\. WORKFLOWS (PAGE LEVEL)**  
**8\. BACKEND WORKFLOWS (APPLICATION LEVEL)**  
**9\. REUSABLE ELEMENTS**  
**10\. UNCERTAINTIES AND FOLLOW-UP REQUIREMENTS**  
**11\. MIGRATION NOTES**

**\==================================================**

**1\. PAGE OVERVIEW**

**Page Name: \_simulation-admin**  
**Page Title: Simulation Admin**  
**Purpose: Administrative interface for managing usability testing simulations. This page allows administrators to:**  
**\- Select usability test accounts from a dropdown**  
**\- View key account information (AI Credits, Name, User Type, Usability Step)**  
**\- Reset usability testing state**  
**\- Advance simulation to Day 2**

**Access Level: Admin/Internal Use Only**  
**Page Type: Native App Page**

**2\. PAGE PROPERTIES**

**Background Color: \#FFFFFF (white)**  
**Background Style: Flat color**  
**Style: None (Custom)**  
**Opacity: 100%**  
**Type of Content: (Default)**  
**Time Zone Selection: User's current timezone**  
**Mobile Version: No**  
**This Page is a Native App: Yes**

**SEO Properties:**  
**\- Title (for SEO / FB): Not specified**  
**\- Description (for SEO / FB): Not specified**

**\==================================================**

**3\. ELEMENT HIERARCHY AND STRUCTURE**

**Page: \_simulation-admin**  
**├── Overlays**  
**│   ├── ⛴\_Corporate Header A (Reusable Element)**  
**│   └── Popup A**  
**└── Layers**  
    **└── Group A (Main Content Container)**  
        **├── D: Select Usability Account (Dropdown)**  
        **├── Text A (Display Field)**  
        **├── Button Reset Usability**  
        **└── Button Start Day 2**

**\==================================================**

**4\. DETAILED ELEMENT SPECIFICATIONS**

**4.1 GROUP A (Main Content Container)**  
**\-------------------------------------**  
**Element ID: cudlQ**  
**Element Name: Group A**  
**Type: Group**

**Layout Properties:**  
**\- Type of content: (Not specified)**  
**\- Data source: Click (to set)**  
**\- Width: 90%**  
**\- Height: 300px \- inf (flexible height)**  
**\- Background style: Flat color**  
**\- Background color: \#FFFFFF (white)**  
**\- Border style \- all borders: None**  
**\- Border roundness: 0**  
**\- Shadow style: None**  
**\- Opacity: 100%**  
**\- This element isn't clickable: Yes**

**Position: Centered on page**

**4.2 D: SELECT USABILITY ACCOUNT (Dropdown)**  
**\-------------------------------------------**  
**Element ID: cudkc**  
**Element Name: D: Select Usability Account**  
**Type: Dropdown**  
**Parent: Group A**

**Appearance Properties:**  
**\- Placeholder: "Select Usability Account"**  
**\- Choices style: Dynamic choices**  
**\- Type of choices: User**  
**\- Choices source: Search for Users (see Data Sources section)**  
**\- Option caption: Arbitrary text (see Data Sources section)**  
**\- Enable auto-binding on parent element's thing: Yes (checked)**  
**\- Default value: Click (conditionally set \- see Conditionals section)**  
**\- This input should not be empty: Yes (checked)**  
**\- This input is disabled: Yes (checked)**

**Styling:**  
**\- Style: None (Custom)**  
**\- Font: App Font (Lato), weight 400**  
**\- Font size: 14px**  
**\- Font color: \#252525**  
**\- Word spacing: 0**  
**\- Letter spacing: 0**  
**\- Placeholder color: \#9C9C9C**  
**\- Background style: Flat color**  
**\- Background color: \#E6E6E6**  
**\- Opacity: 100%**

**Conditionals: 3 (see Section 6\)**

**4.3 TEXT A (Display Field)**  
**\--------------------------**  
**Element ID: cudki**  
**Element Name: Text A**  
**Type: Text**  
**Parent: Group A**

**Content (Dynamic Text):**  
**Line 1: D: Select Usability Account's value's AI Credits,**  
**Line 2: Name: D: Select Usability Account's value's Name \- First,**  
**Line 3: Tester Type: Current User's Type \- User Current's Display,**  
**Line 4: Usability Step: Current User's Usability Step**

**Styling:**  
**\- Style: ...Paragraph \- Black 14 \[Overridden\]**  
**\- Font: Lato, weight 400**  
**\- Font size: 14px**  
**\- Font color: \#424242**  
**\- Canvas placeholder: No**  
**\- Do not apply bb-code: No**  
**\- Recognize links and emails: Yes**  
**\- HTML tag for this element (SEO): normal**  
**\- This element isn't clickable: Yes**

**4.4 BUTTON RESET USABILITY**  
**\---------------------------**  
**Element ID: cudko**  
**Element Name: Button Reset Usability**  
**Type: Button**  
**Parent: Group A**

**Appearance:**  
**\- Button type: Label**  
**\- Label: "Reset Usability"**  
**\- This element isn't clickable: No**

**Styling:**  
**\- Style: None (Custom)**  
**\- Font: App Font (Lato), weight 400**  
**\- Font size: 14px**  
**\- Font color: \#FFFFFF (white)**  
**\- Word spacing: 0**  
**\- Line spacing: 1**  
**\- Letter spacing: 0**  
**\- Background style: Flat color**  
**\- Background color: \#7F95EB (blue/purple)**  
**\- Opacity: 100%**

**Conditionals: 2 (see Section 6\)**  
**Workflows: None defined on this element**

**4.5 BUTTON START DAY 2**  
**\-----------------------**  
**Element ID: cudli**  
**Element Name: Button Start Day 2**  
**Type: Button**  
**Parent: Group A**

**Appearance:**  
**\- Button type: Label**  
**\- Label: "Start Day 2"**  
**\- This element isn't clickable: No**

**Styling:**  
**\- Style: None (Custom)**  
**\- Font: App Font (Lato), weight 400**  
**\- Font size: 14px**  
**\- Font color: \#FFFFFF (white)**  
**\- Word spacing: 0**  
**\- Line spacing: 1**  
**\- Letter spacing: 0**  
**\- Background style: Flat color**  
**\- Background color: \#7F95EB (blue/purple)**  
**\- Opacity: 100%**

**Conditionals: 2 (see Section 6\)**  
**Workflows: None defined on this element**

**\==================================================**

**5\. DATA SOURCES AND EXPRESSIONS**

**5.1 DROPDOWN CHOICES SOURCE**  
**\----------------------------**  
**Data Source: Search for Users**

**Query Configuration:**  
**Type: User**  
**Constraints:**  
  **1\. is usability tester \= "yes"**  
  **2\. Usability Step \>= 1**

**Sorting:**  
**\- Sort by: Created Date**  
**\- Order: Descending (yes)**

**Limits:**  
**\- Sorted lists return a maximum of 50,000 results**  
**\- Ignore empty constraints: Yes (checked)**

**Purpose: Retrieves all User records where the user is marked as a usability tester (is usability tester field \= "yes") and has progressed to at least Usability Step 1 or higher. Results are sorted by creation date in descending order (newest first).**

**5.2 DROPDOWN OPTION CAPTION**  
**\----------------------------**  
**Display Expression: Arbitrary text**  
**Note: The exact field structure was not fully captured but appears to be a complex expression showing user identification data.**

**INVESTIGATION NEEDED: Click on "Arbitrary text" in the Option caption field to see the full expression used to display each user option in the dropdown.**

**5.3 TEXT A DYNAMIC CONTENT**  
**\---------------------------**  
**The text element displays a concatenated string of multiple dynamic fields:**

**Field 1: D: Select Usability Account's value's AI Credits**  
**Field 2: D: Select Usability Account's value's Name \- First**    
**Field 3: Current User's Type \- User Current's Display**  
**Field 4: Current User's Usability Step**

**Purpose: Displays key information about the selected usability account and current user's testing state.**

**\==================================================**

**6\. CONDITIONALS AND DYNAMIC BEHAVIOR**

**6.1 DROPDOWN (D: Select Usability Account) \- 3 CONDITIONALS**  
**\--------------------------------------------------------------**

**CONDITIONAL 1: When "This Dropdown is focused"**  
**Trigger: Dropdown gains focus (user clicks/tabs into it)**  
**Changes Applied:**  
**\- Border color \- all borders: \#52A8EC (blue)**  
**\- Horizontal offset: 0**  
**\- Boxshadow style: Outset**  
**\- Boxshadow blur radius: 6**  
**\- Boxshadow color: \#52A8EC (blue)**  
**\- Vertical offset: 0**  
**Purpose: Provides visual feedback when dropdown is active/focused**

**CONDITIONAL 2: When "This Dropdown isn't valid"**  
**Trigger: Dropdown validation fails (e.g., required field not filled, or validation rules not met)**  
**Changes Applied:**  
**\- Border color \- all borders: \#FF0000 (red)**  
**\- Horizontal offset: 0**  
**\- Boxshadow style: Outset**  
**\- Boxshadow blur radius: 6**  
**\- Boxshadow color: \#FF0000 (red)**  
**\- Vertical offset: 0**  
**Purpose: Indicates error state to user**

**CONDITIONAL 3: When "Get tester from page URL is not empty"**  
**Trigger: URL parameter contains tester information**  
**Changes Applied:**  
**\- Default value: Search for Users:last item**  
**Purpose: Auto-populates dropdown with last user from the filtered search when tester parameter exists in URL**

**INVESTIGATION NEEDED: Determine the exact URL parameter name for "Get tester from page URL" expression.**

**6.2 BUTTON CONDITIONALS (Both Reset Usability & Start Day 2\) \- 2 CONDITIONALS**  
**\------------------------------------------------------------------------------**

**Both buttons share identical conditional behavior:**

**CONDITIONAL 1: When "This Button is hovered"**  
**Trigger: Mouse cursor hovers over the button**  
**Changes Applied:**  
**\- Background color: \#9DADE8 (lighter blue)**  
**Purpose: Hover state feedback**

**CONDITIONAL 2: When "This Button is pressed"**  
**Trigger: Button is actively being clicked (mouse down state)**  
**Changes Applied:**  
**\- Background color: \#6C7FEB (darker blue)**  
**Purpose: Active/pressed state feedback**

**\==================================================**

**7\. WORKFLOWS (PAGE LEVEL)**

**Page Workflows: NONE**

**The \_simulation-admin page has NO workflows defined at the page level. This indicates that:**  
**1\. Button actions may trigger backend workflows directly**  
**2\. Workflows may be defined in the Corporate Header reusable element**  
**3\. The page may rely entirely on backend API workflows**

**INVESTIGATION NEEDED:**  
**\- Check the Corporate Header reusable element for workflows**  
**\- Check if buttons trigger backend workflows via API calls**  
**\- Determine actual functionality of Reset Usability and Start Day 2 buttons**

**\==================================================**

**8\. BACKEND WORKFLOWS (APPLICATION LEVEL)**

**Total Backend Workflows in App: 296**

**The application contains an extensive backend workflow system organized into 25+ folders:**

**1\. Backend Workflows (2 workflows)**  
   **\- l2-listing-saving-address**  
   **\- l2-listing-saving-section-2**

**2\. Bots (2 workflows)**  
**3\. Bulk Fix (48 workflows)**  
**4\. ChatGPT (7 workflows)**  
**5\. Code Based API Calls (14 workflows)**  
**6\. Core \- Notifications (1 workflow)**  
**7\. Core \- User Management (5 workflows)**  
**8\. Data Management (5 workflows)**  
**9\. date change requests (3 workflows)**  
**10\. Emergency & Safety (2 workflows)**  
**11\. House Manual Visitors handling (13 workflows)**  
**12\. Integrations & APIs (1 workflow)**  
**13\. Leases Workflows (11 workflows)**  
**14\. Listing Curation (3 workflows)**  
**15\. Listing Image Check (2 workflows)**  
**16\. Listing workflows (15 workflows)**  
**17\. MAIN Reviews (2 workflows)**  
**18\. Masking & Forwarding (11 workflows)**  
**19\. Masking and Forwarding (FRED) (4 workflows)**  
**20\. Messaging System (52 workflows)**  
**21\. Price Calculations (15 workflows)**  
**22\. Proposal Workflows (17 workflows)**  
**23\. Reservation Manage (2 workflows)**  
**24\. Sales (1 workflow)**  
**25\. SignUp & Onboarding (11 workflows)**  
**26\. Signup Slack \+ Python \+ Bubble (3 workflows)**  
**27\. Supabase (1 workflow)**  
**28\. System (15 workflows)**  
**29\. Virtual Meetings (6 workflows)**  
**30\. VoiceFlow (9 workflows)**  
**31\. Zapier (6 workflows)**  
**32\. ZEPPED (1 workflow)**

**INVESTIGATION NEEDED: For each backend workflow category relevant to usability testing/simulation, document:**  
**\- Workflow names**  
**\- Input parameters**  
**\- Actions performed**  
**\- Output/return values**  
**\- Trigger conditions**

**Specifically for this page, investigate:**  
**\- Core \- User Management workflows (likely related to usability testing)**  
**\- System workflows (may handle simulation state management)**

**\==================================================**

**9\. REUSABLE ELEMENTS**

**9.1 ⛴\_CORPORATE HEADER A**  
**\-------------------------**  
**Element ID: cudlc**  
**Type: Reusable Element**  
**Location: Overlay layer (appears on top of page content)**

**Conditionals: None on the reusable element itself**

**INVESTIGATION NEEDED:**  
**\- Navigate to the Corporate Header reusable element definition**  
**\- Document its internal structure, elements, and styling**  
**\- Document any workflows defined within the reusable element**  
**\- Document any data it receives from parent pages**  
**\- Check if it contains navigation elements (Unit Tests, Corporate Pages menus visible in design)**

**9.2 POPUP A**  
**\-----------**  
**Element ID: Not captured**  
**Type: Popup**  
**Location: Overlay layer**

**Status: Not visible in current page state**

**INVESTIGATION NEEDED:**  
**\- Document Popup A structure and content**  
**\- Determine trigger conditions for showing the popup**  
**\- Document any workflows associated with the popup**

**\==================================================**

**10\. UNCERTAINTIES AND FOLLOW-UP REQUIREMENTS**

**The following items require further investigation to complete the requirements specification:**

**10.1 CRITICAL MISSING INFORMATION**  
**\-----------------------------------**

**1\. DROPDOWN OPTION CAPTION EXPRESSION**  
   **Location: D: Select Usability Account \> Appearance \> Option caption**  
   **Action Required: Click on "Arbitrary text" link to view the full dynamic expression**  
   **Why Critical: Need to know exactly how users are displayed in the dropdown list**

**2\. URL PARAMETER FOR TESTER**  
   **Location: Dropdown Conditional 3 \> "Get tester from page URL"**  
   **Action Required: Click on the expression to see the exact URL parameter name**  
   **Why Critical: Need to implement URL-based auto-population of dropdown**

**3\. BUTTON WORKFLOWS/ACTIONS**  
   **Location: Button Reset Usability & Button Start Day 2**  
   **Action Required: Determine what happens when these buttons are clicked**  
   **Options to investigate:**  
   **\- Check if they have "Start/Edit workflow" actions**  
   **\- Check if they trigger backend API workflows**  
   **\- Check if they modify database records directly**  
   **\- Check URL navigation or popup triggers**  
   **Why Critical: Core functionality of the page depends on these buttons**

**4\. CORPORATE HEADER ELEMENT DETAILS**  
   **Location: Reusable Elements \> ⛴\_Corporate Header A**  
   **Action Required:**

   **\- Open the reusable element editor**  
   **\- Document all internal elements and their properties**  
   **\- Document all workflows within the reusable element**  
   **\- Identify what data it exposes or requires from parent pages**  
   **Why Critical: Header is likely shared across multiple pages and may contain common workflows**

**5\. USER DATA MODEL**  
   **Action Required: Document the User data type structure**  
   **Fields to capture:**  
   **\- is usability tester (text/boolean)**  
   **\- Usability Step (number)**  
   **\- AI Credits (number)**  
   **\- Name \- First (text)**  
   **\- Type \- User (text/option set)**  
   **\- Any other fields referenced in expressions**  
   **Why Critical: Required for database schema design**

**6\. PAGE ACCESS CONTROLS**  
   **Action Required: Document page privacy settings and access rules**  
   **Check: Who can view this page? Admin role? Specific user conditions?**  
   **Why Critical: Security requirements for code implementation**

**10.2 RECOMMENDED TESTING APPROACH**  
**\----------------------------------**

**To fill gaps, perform the following test sequence:**

**1\. Preview the page with a test user account**  
**2\. Select different usability accounts from dropdown**  
**3\. Click "Reset Usability" and observe behavior**  
**4\. Click "Start Day 2" and observe behavior**  
**5\. Check browser network tab for API calls**  
**6\. Check Bubble debugger for workflow execution**  
**7\. Test with URL parameters (e.g., ?tester=123)**

**10.3 FOLLOW-UP PROMPT FOR BUBBLE EXPERT**  
**\----------------------------------------**

**Use this prompt to gather remaining critical information:**

**"Please analyze the \_simulation-admin page in Bubble and provide the following missing details:**

**1\. Click on the 'D: Select Usability Account' dropdown, go to Appearance tab, and click on 'Arbitrary text' under Option caption. Provide the complete expression shown.**

**2\. Go to the Conditional tab of the dropdown, click on Conditional 3 ('When Get tester from page URL is not empty'), and click on the 'Get tester from page URL' expression. What is the exact URL parameter name being checked?**

**3\. Select 'Button Reset Usability', check if there's an 'Edit workflow' option. If yes, document all actions in the workflow. If no, explain what clicking does (database changes, API calls, etc.).**

**4\. Do the same for 'Button Start Day 2' \- document its complete workflow or action sequence.**

**5\. Navigate to the Reusable Elements section and open '⛴\_Corporate Header A'. Document its complete structure including all child elements, their properties, and any workflows.**

**6\. Go to Data tab \> Data types \> User. List all field names and their types, especially: is usability tester, Usability Step, AI Credits, Name \- First, Type \- User.**

**7\. Check Page Settings \> Workflow tab (or Privacy/General tab) \- what are the access controls for who can view this page?"**

**\==================================================**

**11\. MIGRATION NOTES**

**11.1 TECHNOLOGY STACK RECOMMENDATIONS**  
**\--------------------------------------**

**Frontend:**  
**\- React or Vue.js for component-based UI**  
**\- TailwindCSS or similar for styling (matches custom styling approach)**  
**\- React Query or similar for API data fetching**  
**\- Form library (React Hook Form/Formik) for dropdown and validation**

**Backend:**  
**\- Node.js/Express, Python/Django, or similar RESTful API**  
**\- Database: PostgreSQL or MySQL**  
**\- Authentication/Authorization middleware**

**11.2 KEY IMPLEMENTATION CONSIDERATIONS**  
**\--------------------------------------**

**1\. DROPDOWN IMPLEMENTATION**  
   **\- Implement server-side filtering for User search**  
   **\- Apply constraints (is usability tester \= yes, Usability Step \>= 1\)**  
   **\- Sort by Created Date descending**  
   **\- Consider pagination if \> 50 results (Bubble limit is 50,000)**  
   **\- Implement debounced search if adding search functionality**

**2\. CONDITIONAL STYLING**  
   **\- Use CSS classes or styled-components for hover/focus/error states**  
   **\- Implement form validation for required fields**  
   **\- Blue focus state (\#52A8EC), Red error state (\#FF0000)**

**3\. URL PARAMETERS**  
   **\- Parse URL query parameters for auto-population**  
   **\- Implement routing with React Router or similar**

**4\. BUTTON FUNCTIONALITY**  
   **\- Requires API endpoints for Reset Usability and Start Day 2 actions**  
   **\- Implement loading states during async operations**  
   **\- Add confirmation dialogs if actions are destructive**

**5\. REUSABLE COMPONENTS**  
   **\- Create Header component matching Corporate Header functionality**  
   **\- Ensure Header can be reused across multiple pages**

**11.3 DATABASE SCHEMA REQUIREMENTS**  
**\----------------------------------**

**Users Table:**  
**\- id (primary key)**  
**\- is\_usability\_tester (boolean or varchar)**  
**\- usability\_step (integer)**  
**\- ai\_credits (integer or decimal)**  
**\- name\_first (varchar)**  
**\- user\_type (varchar or foreign key to types table)**  
**\- created\_at (timestamp)**  
**\- \[Additional fields per User data type investigation\]**

**11.4 API ENDPOINTS NEEDED**  
**\-------------------------**

**GET /api/users/usability-testers**  
  **Query Parameters: ?tester={id} (optional)**  
  **Filters: is\_usability\_tester \= true, usability\_step \>= 1**  
  **Sort: created\_at DESC**  
  **Returns: Array of user objects**

**POST /api/usability/reset**  
  **Body: { user\_id: string }**  
  **Action: Reset usability testing state for user**  
  **Returns: Success/failure status**

**POST /api/usability/start-day-2**  
  **Body: { user\_id: string }**  
  **Action: Advance simulation to Day 2**  
  **Returns: Success/failure status**

**11.5 TESTING REQUIREMENTS**  
**\-------------------------**

**1\. Unit tests for all components**  
**2\. Integration tests for API endpoints**  
**3\. E2E tests for critical user flows:**  
   **\- Select user from dropdown**  
   **\- Reset usability**  
   **\- Start Day 2**  
   **\- URL parameter auto-population**  
**4\. Accessibility testing (keyboard navigation, screen readers)**  
**5\. Cross-browser testing**

**\==================================================**

**END OF REQUIREMENTS DOCUMENT**

**Document Status: DRAFT \- Requires completion of Section 10 investigations**  
**Next Steps: Execute follow-up prompt to gather missing critical information**  
**Created: January 13, 2026**  
**Last Updated: January 13, 2026**  
