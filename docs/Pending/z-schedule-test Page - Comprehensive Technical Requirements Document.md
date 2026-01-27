z-schedule-test Page \- Comprehensive Technical Requirements Document

Page Overview

Page Name: z-schedule-test  
Purpose: Unit testing page for pricing workflows and schedule selector components  
Intention: Test and validate different pricing scenarios, reservation spans, and schedule selections across three different schedule selector types (Host, Search/Clone, and Listing)

High-Level Architecture

This page acts as a comprehensive testing dashboard for the Split Lease application's pricing and scheduling system. It contains three primary schedule selectors that allow testing of:  
1\. Host-side reservation selection and pricing  
2\. Guest/Search-side schedule selection with various patterns  
3\. Listing-specific schedule management

The page displays intermediate calculation results, pricing multipliers, and various pricing model outputs to validate the correct functioning of the pricing workflows.

Page Structure & Element Hierarchy

THE COMPLETE ELEMENT LIST:

Layers:  
\- T: check out day  
\- ⛴ Logged In Header Avatar  
\- T: check in day  
\- T: selection in nights  
\- T: nights  
\- G: Host Selector (main group)  
\- T: current user name  
\- Multiple MI (Multiline Input) elements for Host Schedule Selector properties  
\- T: Log In as Frederick  
\- T: limit 5 nights  
\- T: error click count  
\- T: selection in days  
\- G: Host Listing  
\- T: not selected nights  
\- Multiple MI elements for error tracking and selection states  
\- T: Login as Sharath  
\- T: Autobind Listing  
\- T: clicked on  
\- T: Non Selected days  
\- B: JavaScript test for Contiguous Nights  
\- T: Selected Start Night / Selected End Night  
\- T: (Listing) \- Not Available Days/Nights  
\- T: Listing  
\- T: not clickable  
\- Text BZZ  
\- D: Not Selectable / Clickable \- Host Selector  
\- JS2B: checkContiguousNights  
\- Search Schedule Selector Group (G: search selector)  
\- Clone Listing Schedule Selector (clone2-)  
\- G: Guest Request Pattern / Guest Desired Pattern  
\- G: Reservation Span groups (weeks/months)  
\- G: Actual Weeks calculations  
\- Price calculation groups  
\- Host reservation guideline groups  
\- Split Lease settings groups  
\- Days/Nights Option Set groups

DATA SOURCES & SEARCHES:

Listing Data Source:  
\- Type of content: Listing  
\- Data source: "Search for Listing's first item"  
\- This searches the Listing database table  
\- Filters: Based on unique ID selected in dropdown

Price Configurations:  
\- Type: Price Configurations (database, most recent)  
\- Displays: Full Time (7 Nights), Average days per month, Weekly Markup, Site Wide Markup  
\- Values shown in preview: 0.13, 31, 0, 0.17

Option Sets:  
\- Nights Option Set: Contains all nights of week with properties (Display, Bubble Number, Check-In Day, Check-Out Day, 3 Letters abbreviation)  
\- Days Option Set: Contains all days of week with similar properties

KEY PRICING FIELDS DISPLAYED:

Host Side:  
\- Damage Deposit  
\- Cleaning Deposit    
\- Monthly Host Rate  
\- Weekly Host Rate  
\- Selected Nightly Price  
\- 2/3/4/5 night Host Rates  
\- 4 Week Rent  
\- Listing Nightly Price

Reservation Guidelines:  
\- Minimum Nights/Days Desired by Host  
\- Maximum Nights/Days Desired by Host  
\- Min/Max Desired Reservation Term (Weeks)  
\- Host Comp Style  
\- Unused Nights

Split Lease Settings:  
\- Unused Nights Discount  
\- SL Discount Rate  
\- SL Price Discount  
\- Nightly Discount Rate (Weekly)  
\- SL Unit Markup  
\- Price Override

Calculated Fields:  
\- Prorated Nightly Price (Weekly/Monthly)  
\- Total Reservation Price  
\- Initial Reservation Payment  
\- Weeks Offered  
\- Nights/Wk available  
\- Actual Weeks During Reservation Span  
\- Actual Weeks 4 Weeks  
\- Reservation Span in Months  
\- Nightly/Weekly/Monthly rental type Night price multipliers

WORKFLOWS DETAILED:

1\. JavaScript test for Contiguous Nights:  
   \- Extracts nights from Host Schedule Selector  
   \- Validates array not empty  
   \- Maps night names to indices (Mon=0, Tue=1, etc.)  
   \- Sorts by indices  
   \- Checks if consecutive (currentIndex \=== prevIndex \+ 1\)  
   \- Exports boolean result to Bubble state  
   \- Used to validate guest selection is contiguous

2\. Set/Choose Reservation Span workflows:  
   \- Handle dropdown changes  
   \- Calculate actual weeks in span  
   \- Determine monthly vs weekly pricing model  
   \- Update all dependent price calculations

3\. Guest Pattern workflows:  
   \- Set required/desired patterns  
   \- Options: Every week, alternating, 2-on-2-off, 1-on-3-off  
   \- Affects availability calculations  
   \- Updates pricing based on pattern

4\. Listing Selection:  
   \- Changes active listing being tested  
   \- Refreshes all listing-specific data  
   \- Updates unavailable days/nights  
   \- Recalculates all pricing

5\. User Context Switches:  
   \- Login as Frederick/Sharath  
   \- Changes permissions and data visibility  
   \- For testing different user scenarios

6\. Display Toggle workflows:  
   \- Hide/show day/night option sets  
   \- For cleaner testing interface

BACKEND WORKFLOWS OVERVIEW:

Total: 296 backend workflows across 27 categories

Key Categories Relevant to Pricing:  
1\. Price Calculations (15 workflows) \- Core pricing logic  
2\. Listing workflows (15) \- Listing data management  
3\. Leases Workflows (11) \- Lease/reservation processing  
4\. Data Management (5) \- Database operations  
5\. System (15) \- System-level operations

Other Categories:  
\- Messaging System (52) \- Largest category  
\- Bulk Fix (48)  
\- Proposal Workflows (17)  
\- Code Based API Calls (14)  
\- House Manual Visitors handling (13)  
\- SignUp & Onboarding (11)  
\- Masking & Forwarding (11+4)  
\- VoiceFlow (9)  
\- date change requests (9)  
\- ChatGPT (7)  
\- Virtual Meetings (6)  
\- Core \- User Management (5)  
\- And 15 more categories

CONDITIONALS & EXPRESSIONS:

Host Selector Group:  
\- Conditional: When "This Group is visible" \-\> Border style \= None

Schedule Selector Elements:  
\- Display conditionals based on selected nights/days  
\- Visibility toggles for various debug fields  
\- Calculations using Bubble's expression language  
\- Filters on listing unavailable dates  
\- Formatted displays for currency, dates, numbers

Key Expression Patterns:  
\- Host Schedule Selector's Selected Nights:sorted by Bubble Number's Display  
\- Host Schedule Selector's Selected Days:each item's Display    
\- Search Schedule Selector's Not Selected Days:each item's First 3 letters  
\- Listing's Unavailable Days/Nights  
\- Price calculations with markups/discounts  
\- Actual Weeks calculations for reservations  
\- Prorated pricing formulas

REUSABLE ELEMENTS & PLUGINS:

Schedule Selector Plugin:  
\- Custom reusable element (likely plugin)  
\- Used in three instances: Host, Search/Clone, Listing  
\- Contains calendar logic for day/night selection  
\- Manages state for selected/unselected days/nights  
\- Exposes properties: Selected Nights, Selected Days, Check-in/out, etc.  
\- Has configurable properties: autobind listing, limit nights, error tracking

JS2/JS2B Elements:  
\- JavaScript to Bubble bridge  
\- Allows custom JavaScript execution  
\- Results exported to Bubble custom states  
\- Used for complex logic like contiguity checking

PLUGINS USED:  
\- Air copy to clipboard  
\- AirDatabaseDiagram    
\- Audio Recorder  
\- BN \- Addressbook, app info, Authenticator, Contact, Device variable, GPS location  
\- BN \- In app (Android/iOS)  
\- BN \- List Template  
\- Various chart plugins (Apex, Bar/Line, Boxplot, Bubble, Candlestick, Funnel, Geo Map, Heatmap, Mixed, Pie/Donut, Polar, Radar, Range Bar, Scatter, Treemap)  
\- Calendar plugins (Month, Timeslots, Tool, Week)  
\- Calculate Age from DOB  
\- Chasing Dots Loader  
\- CSS Lift  
\- Data Range Builder  
\- Easy list  
\- Expression  
\- Facebook Like/Page  
\- File to Base64  
\- Floppy Date Range Processor, Expression Watcher, Hacker, Reader, Rehydrator  
\- Get UserID from HEAP Analytics  
\- google map (bdk)  
\- Hide Scrollbar ID  
\- HTML Drag & Drop Builder  
\- Iconify  
\- And many more

ARES OF UNCERTAINTY & NEED FOR CLARIFICATION:

1\. EXACT PRICING FORMULAS:  
   \- Need detailed breakdown of how each price field is calculated  
   \- What are the exact formulas for:  
     \* Prorated Nightly Price (Weekly)  
     \* Prorated Nightly Price (Monthly)  
     \* Total Reservation Price  
     \* Initial Reservation Payment  
     \* How unused nights discount is applied  
     \* How markups cascade (unit vs site-wide)  
   \- When does monthly vs weekly vs nightly model kick in?  
   \- Thresholds for each pricing model

2\. SCHEDULE SELECTOR PLUGIN INTERNALS:  
   \- What is the internal state management?  
   \- How does it handle date unavailability from listing?  
   \- What triggers the custom states to update?  
   \- Event handlers and their parameters  
   \- How does "autobind listing" work exactly?

3\. BACKEND WORKFLOW DETAILS:  
   \- Which of the 296 backend workflows are called from this page?  
   \- What are the 15 Price Calculation workflows doing specifically?  
   \- When are they triggered?  
   \- What parameters do they accept?  
   \- What do they return?

4\. DATA MODEL RELATIONSHIPS:  
   \- What are all the fields on the Listing data type?  
   \- How does Price Configurations relate to Listings?  
   \- Are there Reservation/Booking data types?  
   \- How do Days and Nights option sets relate to availability?

5\. STATE MANAGEMENT:  
   \- What custom states exist on each element?  
   \- How do states flow between the three selectors?  
   \- When does the page refresh/recalculate?  
   \- What triggers state changes?

6\. TESTING SCENARIOS:  
   \- What are the expected test cases for this page?  
   \- What values should be tested for each selector?  
   \- What are the edge cases?  
   \- How to verify calculations are correct?

7\. GUEST PATTERNS:  
   \- How exactly do the 4 guest patterns affect availability?  
   \- What's the algorithm for "One week on, one week off"?  
   \- How does it interact with host availability?

FOLLOW-UP PROMPT FOR DETAILED ANALYSIS:

"I need you to perform a second-pass analysis on the z-schedule-test page in the Bubble IDE. Focus on:

1\. Open each of the 13 workflows and document:  
   \- Every action in detail  
   \- All conditions on each action  
   \- All parameters and their dynamic expressions  
   \- Expected outcomes

2\. Click on EVERY major element (each Group, each display field) and document:  
   \- All dynamic expressions in the 'Appearance' tab  
   \- All conditionals and what they change  
   \- Data sources and their search constraints  
   \- Any custom states

3\. Specifically for the three schedule selectors:  
   \- Document every exposed property  
   \- Document every configurable option  
   \- Document what each MI (Multiline Input) displays and its source expression  
   \- Test in preview: select different dates and document what changes

4\. Navigate to the Data tab and document:  
   \- Full Listing data type structure (all fields)  
   \- Price Configurations structure  
   \- Days and Nights option sets (all values)

5\. In Backend Workflows:  
   \- Open the Price Calculations category  
   \- Document each of the 15 workflows:  
     \* Name and purpose  
     \* Parameters it accepts  
     \* Actions it performs  
     \* Return values/effects

6\. Run through test scenarios:  
   \- Select 3 contiguous nights in Host selector  
   \- Select 3 non-contiguous nights  
   \- Change reservation span to different values  
   \- Change guest patterns  
   \- Select different listings  
   \- Document all calculated values at each step

7\. Create a data flow diagram showing:  
   \- How data flows from Listing database  
   \- Through schedule selectors  
   \- Into pricing calculations  
   \- To final displayed prices"

SUMMARY & IMPLEMENTATION NOTES:

This z-schedule-test page is a critical testing interface for the Split Lease pricing engine. It provides real-time visibility into:

1\. Three parallel schedule selection workflows (Host, Guest/Search, Listing)  
2\. Complex pricing calculations with multiple models (nightly, weekly, monthly)  
3\. Availability management with contiguity checks  
4\. Discount and markup cascading logic  
5\. Reservation pattern matching  
6\. Intermediate calculation verification

For migration to code, you will need to:

A. Replicate the Schedule Selector component:  
   \- Calendar-based day/night selection UI  
   \- State management for selections  
   \- Integration with availability data  
   \- Custom state exposures

B. Implement pricing calculation engine:  
   \- All formulas from backend workflows  
   \- Prorating logic for different models  
   \- Markup/discount cascading  
   \- Model threshold logic

C. Build data layer:  
   \- Listing database queries  
   \- Price configuration lookups  
   \- Unavailable dates filtering  
   \- Option set data

D. Create testing UI:  
   \- Three selector instances  
   \- Real-time calculated field displays  
   \- Pattern selectors  
   \- Reservation span controls  
   \- Debug/validation displays

E. Add JavaScript validation:  
   \- Contiguity checking algorithm  
   \- Custom validation rules  
   \- Error state management

CRITICAL SUCCESS FACTORS:

\- Exact replication of pricing formulas is essential  
\- State synchronization between components  
\- Real-time calculation updates  
\- Comprehensive test coverage  
\- Validation of edge cases

Document created on: 2026-01-26  
Bubble App: Split Lease Production  
Page: z-schedule-test  
Purpose: Pricing workflow testing and validation

