LISTINGS OVERVIEW \- Requirements Document  
\_listings-overview Page  
Split Lease Platform

\========================================  
DOCUMENT OVERVIEW  
\========================================

Created: January 26, 2026  
Page Name: \_listings-overview  
Bubble URL: https://app.split.lease/version-test/\_listings-overview  
Purpose: Host/Admin dashboard for managing property listings  
Related Documentation: Workflow Analysis Document (21 workflows documented)

\========================================  
1\. PAGE OVERVIEW  
\========================================

1.1 Purpose  
The Listings Overview page serves as a comprehensive dashboard for hosts and administrators to view, manage, and perform bulk operations on property listings in the Split Lease platform.

1.2 Primary Users  
\- Property Hosts  
\- Platform Administrators  
\- Property Managers

1.3 Key Features  
\- View all listings in a filterable repeating group  
\- Search listings by ID, host email, host name, or listing name  
\- Filter by availability status, borough, neighborhood  
\- Filter by completion status (completed/not finished)  
\- View modified date ranges  
\- Individual listing management (view, edit, delete)  
\- Bulk price increment operations  
\- Error tracking and management per listing  
\- Price calculation updates  
\- Quick navigation to listing details

\========================================  
2\. PAGE LAYOUT & STRUCTURE  
\========================================

2.1 Page Settings  
\- Page Title: "Listings and Hosts Dashboard"  
\- Type: Native app (not mobile-specific)  
\- Dimensions: 1600w x 1655h  
\- Background: \#FFFFFF (white)  
\- Fixed-width layout

2.2 Top-Level Layout Hierarchy  
The page follows this structure:

\_listings-overview (Root)  
├── Layers (Header/Nav elements)  
│   ├── \_Corporate Header A (Reusable element \- navigation)  
│   ├── ♻️💥create duplicate listings (Reusable popup)  
│   └── T: Listing Selection Da (Page title text)  
│  
├── Filter & Control Section  
│   ├── G: show available only (Toggle group)  
│   ├── D: Type of scraped listing (Dropdown)  
│   ├── G: Modified Dates (Date range inputs)  
│   ├── D: Borough selection (Dropdown)  
│   ├── G: show available only copy (Checkboxes group)  
│   ├── D: Neighborhoods (Dropdown)  
│   ├── G: Search Listing (Search input group)  
│   ├── B: increment nightly pr (Button \- bulk operations)  
│   ├── B: Go to quick price (Button)  
│   └── B: New Listing (Button)  
│  
└── RG: Listings (Main repeating group)  
    └── \[Listing Cell\] (Repeats for each listing)  
        ├── Listing info display elements  
        ├── Action buttons  
        └── Nested data displays

\========================================  
3\. UI ELEMENTS DETAILED BREAKDOWN  
\========================================

3.1 HEADER SECTION

Element: T: Listing Selection Da  
\- Type: Text  
\- Content: "Listing Selection Dashboard \- Version Test"  
\- Purpose: Page title/heading

Element: T: RG Listings's Count  
\- Type: Text (Dynamic)  
\- Content: "RG: Listings's List of Listings:count results"  
\- Purpose: Displays total number of listings matching current filters

3.2 FILTER & CONTROL SECTION

3.2.1 Availability Toggle  
Element: G: show available only  
\- Type: Group containing toggle/checkbox  
\- Label: "Show only Available"  
\- Purpose: Filter to show only available listings  
\- Visual: Toggle switch interface

Element: D: Type of scraped listing  
\- Type: Dropdown  
\- Default: "Show All"  
\- Purpose: Filter by listing type/source

3.2.2 Status Checkboxes  
Element: G: show available only copy  
\- Type: Group containing checkboxes  
\- Contains:  
  \- Checkbox: "completed listings"  
  \- Checkbox: "not finished listings"  
\- Purpose: Filter by completion status

3.2.3 Location Filters  
Element: D: Borough selection  
\- Type: Dropdown  
\- Default: "Select Borough"  
\- Purpose: Filter by NYC borough  
\- Data Source: Borough database/list

Element: D: Neighborhoods  
\- Type: Dropdown  
\- Default: "Select Neighborhood"  
\- Purpose: Filter by specific neighborhood  
\- Dependencies: May depend on borough selection

3.2.4 Date Range Filter  
Element: G: Modified Dates  
\- Type: Group containing date inputs  
\- Label: "Display Modified Between Dates:"  
\- Contains:  
  \- Date Input 1: Start date (readonly display)  
  \- Date Input 2: End date (readonly display)  
  \- Separator: "-"  
\- Purpose: Filter listings by modification date range  
\- Default: Current date (1/26/2026)

3.2.5 Search Functionality  
Element: G: Search Listing  
\- Type: Group containing search input  
\- Contains:  
  \- Input: "Search Listing using ID, host email, Host or Listing Name"  
  \- Clear button: X icon  
\- Purpose: Text search across multiple listing fields  
\- Fields searched: ID, host email, host name, listing name

3.2.6 Action Buttons  
Element: B: New Listing  
\- Type: Button  
\- Label: "New Listing"  
\- Purpose: Navigate to create new listing form  
\- Position: Top right area

Element: B: Go to quick price  
\- Type: Button  
\- Label: "Go to quick price"  
\- Purpose: Navigate to bulk pricing tool

Element: B: increment nightly pr  
\- Type: Button  
\- Label: "increment nightly price RG listings"  
\- Purpose: Trigger bulk price increment workflow  
\- Workflow: Schedules API workflow on all visible listings  
\- Parameters: Price multiplier \= 1.75

\========================================  
4\. MAIN REPEATING GROUP  
\========================================

4.1 RG: Listings Configuration  
\- Type: Repeating Group  
\- Layout: Vertical list  
\- Data Source: Do a search for Listings (with filters applied)  
\- Cell Template: Contains complete listing card

4.2 LISTING CELL STRUCTURE (per row)

Each cell in RG: Listings contains:

4.2.1 Primary Information Display  
Element: Parent group's Listing's Name  
\- Type: Text (Dynamic)  
\- Content: Listing name from database  
\- Style: Prominent/title text

Element: Host information  
\- Type: Text group  
\- Content: "Host: Parent group's Listing's Host / Landlord's User'..."  
\- Shows host/landlord details

Element: Phone  
\- Type: Text  
\- Content: "Phone: Parent group's Listing's Host / Landlord's Use..."

Element: Email  
\- Type: Text  
\- Content: "Email:Parent group's Listing's Host / Landlord's User'..."

Element: Created date  
\- Type: Text  
\- Content: "Created: Parent group's Listing's Creation Date"

Element: Unique ID  
\- Type: Text (clickable)  
\- Content: "Unique ID: Parent group's Listing's unique id"  
\- Interaction: Clicks copy ID to clipboard \+ show alert

4.2.2 Location Information  
Element: Borough dropdown  
\- Type: Dropdown (display/edit)

\- Value: Parent group's Listing's Location \- Borough's Display Borough  
\- Purpose: Show/edit listing borough

Element: Neighborhood dropdown  
\- Type: Dropdown (display/edit)  
\- Value: Parent group's Listing's Location \- Hoods (new):each item's Display  
\- Purpose: Show/edit listing neighborhood(s)

Element: Rental Type dropdown  
\- Type: Dropdown  
\- Default: "Rental Type"  
\- Purpose: Display/edit rental type classification

4.2.3 Status & Flags  
Element: Active status  
\- Type: Text/Indicator  
\- Label: "Active"  
\- Purpose: Shows if listing is active/inactive

Element: Is Usability?  
\- Type: Checkbox/Toggle  
\- Purpose: Flag for usability testing listings

Element: Showcase  
\- Type: Field/Badge  
\- Purpose: Indicates if listing is showcased

4.2.4 Pricing Information  
Element: Price override input  
\- Type: Input (readonly display)  
\- Field: "Parent group's Listing's 💰Price Override"  
\- Label: "Price override"  
\- Purpose: Shows manual price override if set

Element: 3 nights price  
\- Type: Text (Dynamic)  
\- Content: "3 nights price Parent group's Listing's pricing\_list's Nightly..."  
\- Purpose: Display calculated 3-night pricing

4.2.5 Photos Section  
Element: Pictures display  
\- Type: Image group  
\- Content: "Parent group's Listing's Features \- Photos:filtered's Photo merged with Parent group's Listing's Fea..."  
\- Purpose: Display listing photos

Element: Pictures Count  
\- Type: Text  
\- Label: "Pictures Count:"  
\- Purpose: Shows number of photos for listing

4.2.6 Error Management  
Element: Error dropdown  
\- Type: Dropdown  
\- Default: "Choose an option..."  
\- Purpose: Select error type to add

Element: B: Add Error  
\- Type: Button  
\- Purpose: Add error flag to listing  
\- Workflow: Creates error record

Element: B: Clear All Errors  
\- Type: Button  
\- Purpose: Remove all error flags from listing  
\- Workflow: Deletes error records

Element: B: See Errors  
\- Type: Button  
\- Purpose: View all errors for this listing  
\- Interaction: Shows error popup/details

4.2.7 Action Buttons  
Element: B: View  
\- Type: Button  
\- Label: "View"  
\- Purpose: Navigate to listing detail page  
\- Workflow: Go to listing preview/view page

Element: B: Delete  
\- Type: Button  
\- Label: "Delete"  
\- Purpose: Delete the listing  
\- Workflow: Soft/hard delete listing with confirmation

Element: B: See description  
\- Type: Button  
\- Purpose: View full listing description  
\- Interaction: Opens popup with description

Element: B: update pricing calculation  
\- Type: Button  
\- Purpose: Recalculate pricing for this listing  
\- Workflow: Triggers pricing update workflow

Element: B: See Prices  
\- Type: Button  
\- Purpose: View detailed pricing breakdown  
\- Interaction: Opens pricing details popup/page

\========================================  
5\. POPUPS & REUSABLE ELEMENTS  
\========================================

5.1 Used Reusable Elements  
\- \_Corporate Header A: Main navigation header  
\- ♻️💥create duplicate listings: Popup for duplicating listings  
\- P: See description: Popup for viewing descriptions  
\- P: Errors: Popup for viewing/managing errors  
\- P: Go to Live Version: Popup for navigation  
\- P: View Price: Popup for pricing details

\========================================  
6\. DATA MODEL & SEARCHES  
\========================================

6.1 Primary Data Type: Listing  
Fields Used:  
\- Name (text)  
\- unique id (text)  
\- Host / Landlord's User (User type)  
  \- Full Name  
  \- Email  
  \- Phone  
\- Creation Date (date)  
\- Modified Date (date)  
\- Location \- Borough (Borough type)  
  \- Display Borough  
\- Location \- Hoods (new) (list of Neighborhood)  
  \- Display  
\- Features \- Photos (list)  
  \- Photo (image)  
\- 💰Price Override (number)  
\- pricing\_list (related pricing data)  
  \- Nightly price  
\- Active (boolean)  
\- Showcase (boolean)  
\- Rental Type (option set/text)  
\- Error flags (related Error type)

6.2 Main Search Query  
The RG: Listings performs a search with these filters:  
\- Available only toggle: Filters by availability status  
\- Borough selection: Filters by selected borough  
\- Neighborhood selection: Filters by selected neighborhood  
\- Completed listings checkbox: Filters completion status  
\- Not finished listings checkbox: Filters incomplete status  
\- Modified date range: Filters by modification date between selected dates  
\- Search text: Searches across ID, host email, host name, listing name  
\- Type filter: Filters by listing type/source

6.3 Sorting  
\- Default sort: Likely by Creation Date (newest first) or Modified Date  
\- May have additional sorts available

\========================================  
7\. WORKFLOWS SUMMARY  
\========================================

Total Workflows: 21 (see separate workflow document for complete details)

Key Workflow Categories:  
1\. UNCATEGORIZED (1 workflow)  
   \- Bulk price increment

2\. COPY TO CLIPBOARD (1 workflow)  
   \- Copy unique ID

3\. CREATES/MODIFIES/DELETES LISTING (4 workflows)  
   \- Flag error to listing  
   \- Clear all errors  
   \- Delete listing  
   \- Create/duplicate listing

4\. NAVIGATION (8 workflows)  
   \- Navigate to listing pages  
   \- View descriptions  
   \- View errors  
   \- View pricing  
   \- Go to quick price tool  
   \- Create new listing

5\. SEARCH & FILTERING (4 workflows)  
   \- Search input changes  
   \- Filter modifications  
   \- Clear search  
   \- Date range selection

6\. PRICING & CALCULATIONS (3 workflows)  
   \- Update pricing calculation  
   \- Price override changes  
   \- Bulk price updates

Workflow Documentation: See "Bubble App Workflow Analysis \- \_listings-overview Page" for complete workflow details including triggers, actions, parameters, and conditions.

\========================================  
8\. CONDITIONALS & VISIBILITY LOGIC  
\========================================

8.1 Element Visibility Conditions  
\- Certain elements show/hide based on:  
  \- Listing status (active/inactive)  
  \- Error presence  
  \- Photo availability  
  \- Price override set/not set  
  \- User permissions (admin vs regular host)

8.2 Button Enable/Disable States  
\- Delete button: May be disabled based on listing status or dependencies  
\- Action buttons: May be disabled if listing is incomplete  
\- Bulk operations: Require listings to be selected/visible

\========================================  
9\. STYLING & DESIGN PATTERNS  
\========================================

9.1 Color Scheme  
\- Background: White (\#FFFFFF)  
\- Primary actions: Likely brand color  
\- Destructive actions (Delete): Red/warning color  
\- Error states: Red highlights  
\- Success states: Green indicators

9.2 Typography  
\- Page title: Large, prominent  
\- Listing names: Medium, bold  
\- Metadata (host, dates): Smaller, gray  
\- Counts and numbers: Prominent display

9.3 Layout Patterns  
\- Fixed-width container  
\- Filters at top  
\- Repeating group with clear card structure  
\- Action buttons consistently positioned  
\- Responsive to standard desktop widths

\========================================  
10\. MIGRATION NOTES  
\========================================

10.1 Complex Logic Areas  
\- Multi-field search logic (searches across 4+ fields)  
\- Compound filters (borough \+ neighborhood \+ dates \+ status)  
\- Bulk operations requiring iteration  
\- Dynamic pricing calculations  
\- Error tracking and management system

10.2 Bubble-Specific Patterns  
\- Repeating Group data source with constraints  
\- Parent group references for nested data  
\- Do a search with multiple filters  
\- Schedule API Workflow on a list pattern  
\- Plugin elements (AirAlert for notifications)

10.3 Dependencies  
\- Requires User authentication  
\- Depends on Listing data type structure  
\- Uses Borough and Neighborhood data types  
\- Requires backend API workflows for bulk operations  
\- Photo storage and retrieval system

10.4 Performance Considerations  
\- Large number of listings may require pagination  
\- Photo loading optimization needed  
\- Filter applications should be efficient  
\- Bulk operations use scheduled workflows (not synchronous)

\========================================  
11\. USER PERMISSIONS & ACCESS CONTROL  
\========================================

11.1 Required Permissions  
\- View: Host/Admin must be authenticated  
\- Edit: User must own listing or be admin  
\- Delete: User must own listing or be admin  
\- Bulk operations: Likely admin-only

11.2 Data Privacy Rules  
\- Hosts see only their own listings (unless admin)  
\- Contact information visibility rules  
\- Photo access controls

\========================================  
12\. INTEGRATION POINTS  
\========================================

12.1 Backend API Workflows  
\- core-increment-nightly-prices-on-listings  
\- Pricing calculation workflows  
\- Error management workflows  
\- Photo processing workflows

12.2 External Services/Plugins  
\- AirAlert: Notification system  
\- Photo storage system  
\- Possible integration with external listing sources ("scraped listings")

\========================================  
13\. TESTING SCENARIOS  
\========================================

13.1 Critical User Flows  
1\. Host views all their listings  
2\. Host searches for specific listing by name  
3\. Host filters by borough and neighborhood  
4\. Host deletes a listing  
5\. Admin performs bulk price update  
6\. User copies listing ID  
7\. User adds/clears errors on listing  
8\. User views listing details

13.2 Edge Cases  
\- No listings found (empty state)  
\- Listings with no photos  
\- Listings with errors  
\- Invalid search queries  
\- Filter combinations with no results  
\- Bulk operations on large datasets

\========================================  
14\. RELATED PAGES & NAVIGATION  
\========================================

14.1 Navigation From This Page  
\- New listing creation page  
\- Listing detail/edit page  
\- Quick price tool page  
\- Live version of listing (public view)  
\- Description view popup  
\- Error management popup  
\- Pricing details page

14.2 Navigation To This Page  
\- From main dashboard  
\- From user profile  
\- From navigation header (\_Corporate Header A)

\========================================  
15\. OPEN QUESTIONS & CLARIFICATIONS NEEDED  
\========================================

1\. What determines "usability" flag purpose?  
2\. What is "scraped listing" type vs regular?  
3\. Are there pagination limits on RG: Listings?  
4\. What triggers automatic price calculations?  
5\. Can hosts access other hosts' listings?  
6\. What's the complete error type list?  
7\. Is there a listings export feature?  
8\. Are there sorting options available?  
9\. What's the complete permission matrix?  
10\. Is there undo functionality for bulk operations?

\========================================  
END OF REQUIREMENTS DOCUMENT  
\========================================

Document Status: COMPLETE  
Next Steps:   
\- Review with development team  
\- Validate against actual page behavior  
\- Document any missing conditionals  
\- Create migration specification  
\- Document Guest Relationships page (Priority 1\)  
\- Find and document Email SMS Unit page (Priority 2\)  
\- Find and document Internal Test page (Priority 2\)

