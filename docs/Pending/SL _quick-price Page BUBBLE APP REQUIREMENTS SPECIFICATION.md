BUBBLE APP REQUIREMENTS SPECIFICATION: \_quick-price Page

Application: Split Lease \- Production  
Page: \_quick-price (Quick Price Modification Dashboard)  
Analysis Date: January 13, 2026  
Target Migration: From Bubble to Code

COMPREHENSIVE PAGE SPECIFICATION

1\. OVERVIEW

The \_quick-price page is a Quick Price Modification Dashboard used for managing and updating pricing for rental listings in the Split Lease application. It serves as an administrative interface for hosts/landlords to quickly modify pricing across multiple listings and control overall site-wide pricing parameters.

KEY OBJECTIVES:  
\- Search and filter listings by rental type, name, host, borough, and location  
\- Sort listings by creation date  
\- Manage global pricing multipliers  
\- View detailed pricing information for individual listings  
\- Activate/deactivate individual listings  
\- Delete listings  
\- Modify individual listing rental types  
\- Update price lists for all listings at once

2\. PAGE ELEMENT STRUCTURE & DATA HIERARCHY

TOP-LEVEL LAYOUT:  
\- Corporate Header A (Reusable)  
\- Title: "Quick Price Modification Dashboard"  
\- User Display Section  
\- Three Main Sections:  
  A. Filter/Search Controls (Left)  
  B. Sort & Date Range Controls (Center)  
  C. Global Pricing Configuration (Right Sidebar)  
  D. Listings Repeating Group (Main Content Area)

ELEMENT TREE:  
\_quick-price (Page)  
├── Corporate Header A  
├── G: Main page group  
│   ├── T: Header  
│   ├── G: Site Wide Price Configuration  
│   ├── G: ZAT-Price Configuration  
│   ├── D: Select Rental Type (Dropdown)  
│   ├── Pick: First Date (Date Picker)  
│   ├── Pick: Second Date (Date Picker)  
│   └── RG: Listings (Repeating Group)  
└── Popups & Overlays

3\. DATA SOURCES & DEPENDENCIES

PRIMARY DATA OBJECT: Listing  
FIELDS USED:  
\- Name (String) \- displayed and used for search  
\- Unique ID (UUID) \- unique identifier  
\- Host (User Reference) \- links to user/host  
\- Active (Boolean) \- status flag  
\- Unit Markup (Number) \- pricing multiplier  
\- Weekly Host Rate (Currency) \- $/week  
\- Monthly Host Rate (Currency) \- $/month  
\- Nightly Host Rate for 5 nights (Currency)  
\- Nightly Host Rate for 4 nights (Currency)  
\- Nightly Host Rate for 3 nights (Currency)  
\- Nightly Host Rate for 2 nights (Currency)  
\- Cleaning Cost / Maintenance Fee (Currency)  
\- Damage Deposit (Currency)  
\- Price Override (Currency) \- manual override  
\- Receptivity Override (Number) \- custom threshold  
\- Location Hood (Text) \- neighborhood  
\- Location/Borough (Location/Geographic reference)  
\- Rental Type (Dropdown) \- property type  
\- Creation Date (Date) \- when listed was created

GLOBAL PRICING CONFIGURATION DATA:  
From ZAT-Price Configuration object:  
\- Weekly Markup (Percentage) \- site-wide weekly multiplier  
\- Unused Nights Discount Multiplier (Percentage)  
\- Full Time Discount (7 nights) (Percentage)  
\- Overall Site Markup (Percentage) \- base markup

4\. FRONTEND WORKFLOWS (Client-Side Event Handlers)

TOTAL WORKFLOWS: 19 workflows on this page

CRITICAL WORKFLOWS:  
1\. Page is loaded \- Hides Crisp chat on mobile  
2\. B: Visit Listing \- Navigates to listing detail with URL parameters  
3\. T: Change Listing \- Navigates to edit listing page  
4\. B: delete listing is clicked \- Conditional logic based on Active status  
5\. B: Make Listing Active \- Sets listing as active  
6\. B: Yes, delete is clicked \- Completes deletion process

OTHER CATEGORIES (13 workflows):  
\- JavaScript, Listing Modify, Money, Navigation, On Page Load  
\- Reset Field (6 workflows for filter controls)  
\- Show/Hide Elements, ZEP, Custom Events

KEY CONDITIONAL LOGIC:  
\- Delete operations check if listing is Active/Inactive  
\- Inactive listings can be deleted immediately  
\- Active listings show confirmation popup first

5\. BACKEND WORKFLOWS

BACKEND WORKFLOW COUNT: 296 workflows in the application

MAJOR CATEGORIES:  
\- Listing workflows (15) \- Core operations  
\- Listing Curation (3) \- Verification  
\- Data Management (5) \- Consistency  
\- Code Based API Calls (14) \- External integrations  
\- Messaging System (52) \- Communications

KEY BACKEND FUNCTIONS:  
1\. Listing update/modification logic  
2\. Price calculations  
3\. Listing activation/deactivation  
4\. Listing deletion  
5\. Data validation  
6\. Audit logging for price changes

6\. SEARCH & FILTER FUNCTIONALITY

FILTER CONTROLS:  
1\. Select Rental Type \- Property type filter  
2\. Search Listing \- Search by listing name  
3\. Search Host \- Search by host email  
4\. Select Borough \- Geographic filter  
5\. Select Location Hood \- Neighborhood filter

SORT FUNCTIONALITY:  
\- Primary: Listing Creation Date  
\- Direction: Ascending/Descending toggle  
\- Date Range: Two date pickers

7\. FORM ELEMENTS

TEXT INPUTS (Read-only Display):  
\- Unit Markup, Monthly/Weekly/Nightly prices  
\- Cleaning Cost, Damage Deposit  
\- Unique ID, Host email, Location Hood

DROPDOWNS:  
\- Select Rental Type per row  
\- Borough selection

BUTTONS:  
\- \\"Go to listings overview\\" (Navigation)  
\- \\"visit listing\\" per row (Navigation)  
\- \\"make active\\" per row (Action)  
\- \\"delete listing\\" per row (Destructive)  
\- \\"Update price lists for all listings\\" (Bulk)  
\- \\"Change Prices\\" (Top navigation)

DATE PICKERS:  
\- Pick: First Date (start filter)  
\- Pick: Second Date (end filter)

8\. CONDITIONAL RENDERING & LOGIC

CONDITIONAL BEHAVIORS:  
\- Delete button: Behavior depends on listing Active status  
\- \\"make active\\" button: Appears for inactive listings  
\- Popup visibility: Changes based on listing state  
\- Form fields: All read-only (display only, no input)

9\. STYLING & APPEARANCE

COLOR SCHEME:  
\- Header: Blue background  
\- Primary buttons: Purple  
\- Secondary buttons: Blue  
\- Text: Black/Gray labels

LAYOUT:  
\- Responsive design  
\- Left sidebar: Filters  
\- Right sidebar: Pricing configuration  
\- Central area: Listing table with rows  
\- Horizontal scroll: Pricing columns

10\. KEY UNKNOWNS & AREAS FOR FURTHER INVESTIGATION

FIELDS TO CLARIFY:  
1\. What backend queries execute when filters change?  
2\. How is the repeating group data source bound to filters?  
3\. Exact conditional expressions for show/hide logic  
4\. What validation rules exist for price inputs?  
5\. How are pricing calculations performed on backend?  
6\. Are there cascading deletes when listing is deleted?  
7\. What audit trail exists for price changes?  
8\. How are permissions enforced (who can edit what)?  
9\. What happens when \\"Update price lists for all listings\\" is clicked?  
10\. Are there any real-time refresh mechanisms?

11\. INTEGRATION POINTS

EXTERNAL DEPENDENCIES:  
\- AirAlert component for notifications  
\- Crisp chat integration (hidden on mobile)  
\- Corporate Header reusable element  
\- Various location/geographic data sources  
\- User/Host database  
\- Listing database  
\- Price Configuration database

NAVIGATION POINTS:  
\- Links to: Listing detail page  
\- Links to: Listing edit page  
\- Links to: Listings overview  
\- Links to: Change Prices page

12\. MIGRATION RECOMMENDATIONS

FROM BUBBLE TO CODE MIGRATION STRATEGY:

FRONTEND (React/Vue/Angular recommended):  
\- Component Structure: Create reusable ListingTable component  
\- Filter Controls: Implement custom filter component with state management  
\- Forms: Replace read-only Bubble inputs with controlled form inputs  
\- Buttons: Create button components for actions  
\- Modal/Popup: Implement delete confirmation modal  
\- Date Range: Use date picker library (e.g., react-dates, day-js)

STATE MANAGEMENT:  
\- Filters: rental\_type, listing\_search, host\_search, borough, location\_hood, date\_range  
\- Sort: sort\_field, sort\_direction  
\- Listings: list of listings data  
\- Global Pricing: pricing config values  
\- UI State: modal visibility, loading state

API ENDPOINTS NEEDED:  
\- GET /api/listings?filters=... \- Fetch filtered listings  
\- POST /api/listings/{id}/activate \- Activate listing  
\- DELETE /api/listings/{id} \- Delete listing  
\- PUT /api/listings/{id} \- Update listing (rental type)  
\- POST /api/price-config/update-all \- Bulk price update  
\- GET /api/price-config \- Get global pricing  
\- GET /api/rental-types \- Get rental type options  
\- GET /api/boroughs \- Get borough options

DATABASE:  
\- Use same Listing table structure  
\- Ensure indexes on: name, active, host\_id, borough, location\_hood, created\_at  
\- Consider denormalizing pricing fields if not already

BACKEND (Node/Python/Ruby):  
\- Price calculation engine: Move Bubble price logic to backend service  
\- Validation: Implement price validation rules  
\- Permissions: Enforce authorization (who can edit)  
\- Audit logging: Log all price and listing changes  
\- Cascading deletes: Handle listing deletion properly

STEPS FOR MIGRATION:  
1\. Extract data schema from Bubble  
2\. Create database migrations  
3\. Build backend API endpoints  
4\. Build React components  
5\. Implement state management  
6\. Connect frontend to API  
7\. Test all workflows  
8\. Implement error handling  
9\. Add loading states  
10\. Deploy and monitor

END OF REQUIREMENTS DOCUMENT

