\_MODIFY-LISTINGS PAGE \- COMPREHENSIVE REQUIREMENTS DOCUMENTATION

APP: Split Lease (Production)  
PAGE NAME: \_modify-listings  
PAGE TYPE: Web Page  
PURPOSE: Comprehensive listing modification interface for hosts to create, edit, and manage property listings with detailed specifications for features, pricing, rules, photos, and reviews.

\=== EXECUTIVE SUMMARY \===

The \_modify-listings page is a complex, multi-section form interface that allows hosts to comprehensively manage property listings. The page contains 6 major functional sections organized in a tabbed/sectional navigation panel on the left: Address, Features, Lease Styles, Pricing, Rules, and Photos. Additionally, there are sidebar sections for Reviews and nested sections for Search Optimising and Status management. The page is loaded with sample data and contains extensive validation, conditional rendering, and backend workflow integration.

\=== PAGE STRUCTURE & LAYOUT \===

VISUAL HIERARCHY:  
\- Header: Corporate Header A (reusable element) with Split Lease branding, navigation menu, and Change Prices button  
\- Main Content Area: Multi-column layout (primary content \+ preview sidebar)  
\- Left Navigation Panel: Navigation bar with section tabs (Address, Features, Lease Styles, Pricing, Rules, Photos, Reviews)  
\- Primary Content: Vertically stacked sections with multiple form inputs  
\- Right Sidebar: "Search Optimising" and "Status" sections, followed by "Space Snapshot" section  
\- Right Panel: Listing preview/preview area

RESPONSIVE BEHAVIOR: Page uses responsive design with breakpoints.

\=== DETAILED SECTION SPECIFICATIONS \===

1\. SPACE SNAPSHOT SECTION (Block name: address)  
   Location: Primary content area, left side of page  
   Purpose: Capture basic property information and location details  
     
   INPUT FIELDS:  
   \- Listing Name (required): Text Input (35 char max)  
   \- Listing Address (required): Text Input (private, not shared)  
   \- Type of Space (required): Dropdown  
   \- Bedrooms (required): Dropdown (value: 2\)  
   \- Type of Kitchen (required): Dropdown  
   \- Beds: Number field (value: 2\)  
   \- Type of Parking (required): Dropdown  
   \- Bathrooms (required): Dropdown (value: 2.5)  
     
   ADDRESS PARSING FIELDS (Auto-calculated):  
   \- Number: Extract from full address  
   \- Street Name: Extract from full address  
   \- City: Extract from full address  
   \- State: Dropdown (NY selected)  
   \- Zip: Extract from full address  
     
   VALIDATION: Google Maps address confirmation button  
   ERROR HANDLING: Red error message if address cannot be located  
   NEIGHBORHOOD: Dropdown auto-populated based on ZIP code  
   SAVE BUTTON: "Save" button at section bottom

2\. FEATURES SECTION (Block name: features)  
   Purpose: Select required and optional amenities for the listing

   INPUT FIELDS:  
   \- Description of Lodging (required): Multiline text input with template loader  
   \- Amenities inside Unit (required): Checkbox list (40+ options)  
   \- Amenities outside Unit (optional): Checkbox list (30+ options)  
   \- Describe Life in the Neighborhood: Multiline text input  
   BUTTONS: Save button, template loaders

3\. LEASE STYLES & PRICING SECTION  
   Three lease model options:  
   \- Nightly: Single night rental  
   \- Weekly: Full week rental    
   \- Monthly: Full month rental (default)  
     
   PRICING FIELDS (based on selected lease style):  
   \- Monthly Host Compensation (read-only)  
   \- Damage Deposit (required): Minimum $500  
   \- Maintenance Fee (optional)  
     
   BUTTONS: Save Pricing & Style button

4\. PHOTOS SECTION (Block name: photos)  
   PURPOSE: Manage property photos with drag-and-drop ordering  
   REQUIREMENTS: Minimum 3 photos required  
     
   FIELDS:  
   \- Upload More Photos button  
   \- Photo Type dropdown for each photo  
   \- Drag-and-drop interface for reordering  
   \- Delete button for individual photos  
   \- Delete All button  
     
   VALIDATION: Please submit at least 3 message  
   BUTTONS: Save button

5\. RULES SECTION (Block name: rules)  
   PURPOSE: Define house rules, cancellation policy, and rental terms  
     
   KEY FIELDS:  
   \- Cancellation Policy (required): Dropdown  
   \- House Rules: Extensive checkbox list (30+ rules)  
   \- Check In Time: Time dropdown (default 2:00 pm)  
   \- Check Out Time: Time dropdown (default 11:00 am)  
   \- Preferred Gender: Dropdown  
   \- \# of Guests (required): Number input  
   \- Secure Storage: Dropdown  
   \- Ideal Lease Term (weeks): Range inputs (6 weeks min, 52 weeks max)  
   \- Ideal number of months: Range inputs (2 months min, 12 months max)  
   \- Block dates for future: Date picker  
   BUTTONS: Save button  
     
6\. REVIEWS AND OPTIONAL SETTINGS SECTION (Block name: reviews)  
   PURPOSE: Display reviews and configure safety features  
     
   FIELDS:  
   \- Safety Features: Checkbox list  
   \- Earliest date someone could rent: Date input  
   \- Entire Place ft²: Number input  
   \- Reviews list with details  
   BUTTONS: Add Review, Preview, Complete House Manual, Save

\=== SIDEBAR SECTIONS \===

7\. SEARCH OPTIMISING SECTION  
   FIELDS:  
   \- Search Ranking: Text input  
   \- Listing Code: Text input    
   \- Click Counter: Text input (read-only)  
   \- Bulk Upload ID: Text input (read-only)

8\. STATUS SECTION  
   FIELDS:  
   \- Approved: Checkbox  
   \- Listing Active: Toggle  
   \- Confirmed Availability: Toggle  
   \- Showcase: Toggle

\=== PAGE WORKFLOWS (106 TOTAL) \===

WORKFLOWS ORGANIZED BY TRIGGER/PURPOSE:

1\. UNCATEGORIZED WORKFLOWS (3):  
   \- B: Save, last save, submit listing copy is clicked  
     Trigger: Button click on save button  
     Actions:   
       Step 1: Trigger purple alert  
       Step 2: Make changes to Listing (clears Features \- Photos list)  
     
   \- C: Approved's value is changed-Emails host with Approved Listings  
     Trigger: Checkbox "Approved" is checked  
     Condition: This Checkbox is checked  
     Action: Email host with approved listing notification  
     
   \- D: Cancellation Policy's value is changed  
     Trigger: Dropdown "Cancellation Policy" value changes  
     Condition: Display is "Additional Host Restrictions"  
     Action: Creates a new Host Restriction

2\. CALENDAR REVIEW UNDERSTAND (6 workflows):  
   Purpose: Handle calendar date management and blocked date configuration

3\. CUSTOM EVENTS (7 workflows):  
   Purpose: Trigger custom application events

4\. DO WHEN CONDITION (1 workflow):  
   Purpose: Conditional logic execution

5\. HIDE ELEMENTS (4 workflows):  
   Purpose: Control element visibility

6\. INFORMATIONAL TEXT (16 workflows):  
   Purpose: Display dynamic informational messages

7\. LISTING (5 workflows):  
   Purpose: Listing-related actions and data changes

8\. LISTING FEATURES (9 workflows):  
   Purpose: Feature selection and validation

9\. LISTING PHOTO (4 workflows):  
   Purpose: Photo upload and management

10\. LISTING SAVE (1 workflow):  
    Purpose: Save listing changes

11\. LISTING-ADDRESS (2 workflows):  
    Purpose: Address input and validation

12\. MAKE CHANGES TO LISTINGS (11 workflows):  
    Purpose: Modify listing properties

13\. MANAGE SCROLL (2 workflows):  
    Purpose: Page scroll behavior

14\. NAVIGATION- IN PAGE (3 workflows):  
    Purpose: Internal page navigation between sections

15\. NEXT BUTTONS (2 workflows):  
    Purpose: Next/previous navigation buttons

16\. ON PAGE LOAD (2 workflows):  
    Purpose: Page initialization

17\. RENTAL TYPE (6 workflows):  
    Purpose: Lease style selection (Nightly/Weekly/Monthly)

18\. REVIEWS (4 workflows):  
    Purpose: Review display and management

19\. SET STATE (9 workflows):  
    Purpose: Application state management

20\. SHOW ELEMENTS (6 workflows):  
    Purpose: Control element visibility display

21\. SYSTEM (1 workflow):  
    Purpose: System-level operations

22\. TOGGLE ACTIONS (2 workflows):  
    Purpose: Toggle UI element states

\=== BACKEND WORKFLOWS (Page-Level: 2\) \===

There are 2 backend workflows specific to this page, located in Uncategorized section:

1\. l2-listing-saving-address  
   Purpose: Handle address validation and processing when address field is saved  
   Trigger: Address input save  
   Actions: Backend processing of address data

2\. l2-listing-saving-section-2    
   Purpose: Handle bulk saving of section 2 data (likely features/amenities section)  
   Trigger: Section 2 save button  
   Actions: Backend processing of features data

NOTE: App has 296 total backend workflows across all pages. For complete backend workflow documentation, refer to Backend Workflows tab in app.

\=== DATA BINDINGS & EXPRESSIONS \===

KEY DATA BINDINGS (Mostly Parent group's Listing):  
\- Listing Name: Parent group's Listing's Name  
\- Listing Address: Parent group's Listing's address    
\- Type of Space: Parent group's Listing's Features \- Type of Space  
\- Bedrooms: Parent group's Listing's Features \- Qty Bedrooms  
\- Beds: Parent group's Listing's Features \- Qty Beds  
\- Bathrooms: Parent group's Listing's Features \- Qty Bathrooms  
\- Bulk Upload ID: Parent group's Listing's bulk\_upload\_id  
\- Check In Time: Parent group's Listing's Hosting preferences \- Check in time  
\- Check Out Time: Parent group's Listing's Hosting preferences \- Check out time

ADDRESS PARSING EXPRESSIONS (Serene Business expressions):  
\- Street Number: SB: Listing Address's value:extract street number  
\- Street Name: SB: Listing Address's value:extract street  
\- City: SB: Listing Address's value:extract city    
\- Zip: SB: Listing Address's value:extract zip code

\=== CONDITIONALS & VISIBILITY \===

Major Conditionals Identified:  
\- Search Ranking visibility: Hidden until certain conditions  
\- Status toggle visibility: Based on listing approval status  
\- House Rules checkboxes: Conditional display based on rules availability  
\- Pricing fields: Dynamic visibility based on lease style selection (Nightly/Weekly/Monthly)  
\- Address validation: Red border on Address field when unable to geocode  
\- Photo requirements: Validation error showing when \< 3 photos submitted

\=== REUSABLE ELEMENTS USED \===

\- Corporate Header A: Top navigation and branding  
\- Informational text RE: Info tooltips throughout  
\- Sign up & Login A: User authentication component  
\- Load-templates-listing RE: Template loader for descriptions  
\- Additional Host Restrictions Policy: Policy management  
\- Listing photos submit RE: Photo upload handler  
\- External Listing Review Management: Review system  
\- Show Reviews RE: Review display  
\- Listing Preview G: Preview display  
\- Nav Tab G: Section navigation  
\- Amenity Suggestion P: Amenity recommendations  
\- Dates blocked calendar P: Date blocking interface  
\- All the Sections G: Master section container

\=== IMPORTANT INFORMATION GAPS & UNKNOWNS \===

DUE TO COMPLEXITY AND PAGINATION, THE FOLLOWING STILL NEED DETAILED SPECIFICATION:

1\. EXACT DROPDOWN OPTIONS  
   \- Type of Space dropdown: Need to specify all available options and data source  
   \- Bedrooms dropdown: Numeric range (1-10?)  
   \- Kitchen types: All available types and categories  
   \- Parking types: All parking options available  
   \- Bathroom numbers: Numeric options including half-baths  
   \- Gender preference dropdown: All gender options  
   \- Cancellation Policy dropdown: All policy types and their descriptions  
   \- Neighborhood dropdown: How is it populated based on ZIP? What table/source?

2\. FEATURE CHECKBOX LISTS  
   \- Complete list of all 40+ Amenities Inside Unit checkboxes and their data bindings  
   \- Complete list of all 30+ Amenities Outside Unit checkboxes  
   \- Complete list of all House Rules (30+ items) and their data bindings  
   \- Complete list of Safety Features checkboxes

3\. PRICING CALCULATIONS  
   \- Formula for Monthly Host Compensation calculation  
   \- Weekly compensation breakdown formula (2 nights through 5 nights calculations)  
   \- How Damage Deposit minimum ($500) is enforced  
   \- Maintenance Fee calculation logic  
   \- How pricing scales with occupancy levels

4\. VALIDATION RULES  
   \- Exact character limits for Listing Name (35 shown, confirm if exact)  
   \- Address geocoding service used (Google Maps confirmed, API key location?)  
   \- Photo validation: How is "at least 3" enforced?  
   \- Lease term range validation: Are 6 weeks and 52 weeks absolute or configurable?  
   \- Month range validation: Are 2-12 months absolute or configurable?

5\. WORKFLOW DETAILS  
   \- Detailed steps for each of the 106 workflows (currently only 3 documented)  
   \- Conditional logic for each Hide Elements / Show Elements workflow  
   \- Set State workflow parameter values and state variable names  
   \- Custom Events: What events are triggered and when?

6\. BACKEND WORKFLOW SPECIFICATIONS    
   \- Detailed steps for l2-listing-saving-address backend workflow  
   \- Detailed steps for l2-listing-saving-section-2 backend workflow  
   \- Error handling and validation in backend workflows  
   \- API calls made during save operations

7\. PAGE STATE & NAVIGATION  
   \- How does page load know which listing ID to display?  
   \- How are section tabs triggered (CSS, Bubble state, Workflow)?  
   \- Are all sections loaded at once or lazy-loaded?  
   \- What happens on form submission/validation errors?  
   \- Auto-save functionality: Is there auto-save or only manual save?

8\. INTEGRATIONS & EXTERNAL SERVICES  
   \- Google Maps API integration details  
   \- Address validation service specifics  
   \- Email service for "Emails host with Approved Listings"  
   \- Template system for description loaders  
   \- Are there any third-party plugins being used?

\=== ADDITIONAL ANALYSIS NEEDED \===

TO COMPLETE THIS DOCUMENTATION IN A SECOND PASS:

1\. Click into each of the 106 workflows and document:  
   \- Exact trigger event  
   \- Conditions (if any)  
   \- Step-by-step actions  
   \- Data modifications

2\. For each dropdown field:  
   \- Click to see all available options  
   \- Note the data source (Options from API, Database, List, etc.)  
   \- Note any dynamic filtering logic

3\. For checkbox lists:  
   \- Count exact number of items  
   \- Document data binding for each item  
   \- Document any conditional visibility

4\. Test the page with actual data:  
   \- Change lease style (Nightly/Weekly/Monthly) and document resulting field visibility  
   \- Upload photos and test drag-and-drop ordering  
   \- Test address validation with valid and invalid addresses  
   \- Trigger Approved checkbox and verify email workflow  
   \- Test Save buttons on each section to understand backend workflows

5\. Inspect advanced Bubble features:  
   \- Check if page uses custom states  
   \- Verify all expressions and their exact syntax  
   \- Document any plugin-specific configurations  
   \- Check Data tab for any data type or API specifications

6\. Performance & UX Considerations:  
   \- Document loading time for page with full data  
   \- Note any lazy-loading or pagination of forms  
   \- Document accessibility features (ARIA labels, keyboard navigation)  
   \- Identify potential performance bottlenecks

\=== SUMMARY OF MIGRATION CONSIDERATIONS \===

For code migration, key considerations:  
\- Database schema needs to match Parent group's Listing structure  
\- Address parsing/validation logic needs equivalent (Google Maps API)  
\- Complex form state management needed for 6 major sections  
\- 106 page-level workflows need to be replicated as event handlers/actions  
\- 2 backend workflows need backend code equivalents  
\- Conditional rendering logic needs careful translation  
\- Real-time validation and error states need implementation  
\- Photo drag-and-drop interface needs to be replicated  
\- Email notifications need equivalent backend service  
