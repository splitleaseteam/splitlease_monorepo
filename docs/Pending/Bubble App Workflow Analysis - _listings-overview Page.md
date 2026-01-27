Bubble App Workflow Analysis \- \_listings-overview Page

Complete Workflow Analysis

Total Workflows on Page: 21

\========================================  
WORKFLOW CATEGORY: UNCATEGORIZED (1 workflow)  
\========================================

Workflow \#1: B: increment nightly pr is clicked

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: increment nightly pr  
Condition: Only when Click

\---STEP 1: Schedule API Workflow on a list---  
Action Type: Schedule API Workflow on a list

Parameters:  
• Type of things: Listing  
• List to run on: RG: Listings's List of Listings  
• API Workflow: core-increment-nightly-prices-on-listings  
  \- Parameter 'listing': This Listing  
  \- Parameter 'price multiplier number': 1.75  
• Ignore privacy rules when running the workflow: ✓ (checked)  
• Scheduled date: Current date/time  
• Interval (seconds): 2  
• Only when: Click  
• Add breakpoint in debug mode: Not set

Intentions & Functionality:  
This workflow schedules a backend API workflow to increment nightly prices on all listings displayed in the repeating group. When the button is clicked, it iterates through each listing in the RG: Listings repeating group and schedules the 'core-increment-nightly-prices-on-listings' API workflow for each one with a 2-second interval between executions. The price multiplier of 1.75 is passed to multiply the existing price. Privacy rules are ignored during execution.

\---

\========================================  
WORKFLOW CATEGORY: COPY TO CLIPBOARD (1 workflow)  
\========================================

Workflow \#2: T: unique ID is clicked \- Copy text to Clipboard and show an alert

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: T: Listing unique ID  
Condition: Only when Click

\---STEP 1: Copy to clipboard from static text---  
Action Type: Copy to clipboard from static text

Parameters:  
• Text to copy: Parent group's Listing's unique id  
• Only when: Click  
• Add breakpoint in debug mode: Not set

Intentions & Functionality:  
Copies the unique ID of the listing from the parent group to the user's clipboard.

\---STEP 2: AirAlert \- unique ID copied---  
Action Type: AirAlert (Plugin Action)

Parameters:  
• Heading: Unique ID Copied  
• Message: Parent group's Listing's unique id  
• Notification type: Success  
• Position on page: Top Right  
• XSS Protection: yes  
• Only when: Click  
• Add breakpoint in debug mode: Not set

Intentions & Functionality:  
Displays a success notification alert at the top right of the page showing the unique ID that was copied, confirming the action to the user.

\---

\========================================  
WORKFLOW CATEGORY: CREATES/MODIFIES/DELETES LISTING (4 workflows)  
\========================================

Workflow \#3: B: Add error is clicked \- Flags Error to Listing

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: Add Error  
Condition: Only when Click

\---STEP 1: Make changes to Listing...---  
Action Type: Make changes to a thing

Parameters:  
• Thing to change: Parent group's Listing  
• Errors add: D: Errors's value  
• Only when: Click  
• Add breakpoint in debug mode: Not set

Intentions & Functionality:  
This workflow adds an error value to the Listing's errors field. When the 'Add Error' button is clicked, it retrieves the error value from input field 'D: Errors' and adds it to the parent group's Listing errors list. This is used for flagging errors or issues with a listing.

\---

Workflow \#4: B: Clear Errors is clicked \- Clears Previously added errors

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: Clear Errors  
Condition: Only when Click

\---STEP 1: Make changes to Listing...---  
Action Type: Make changes to a thing

Parameters:  
• Thing to change: Parent group's Listing  
• Errors: (Clears the errors field)  
• Only when: Click  
• Add breakpoint in debug mode: Not set

Intentions & Functionality:  
This workflow clears all previously added errors from the Listing. When the 'Clear Errors' button is clicked, it resets/clears the errors field on the parent group's Listing, removing all flagged errors.

\---

Workflow \#5: B: Delete is clicked \- Deletes Listing and Displays Alert

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: Delete  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: This workflow likely contains actions to delete a listing record and show a confirmation alert)

Intentions & Functionality:  
Deletes the selected listing from the database and shows an alert notification to confirm the deletion action.

\---

Workflow \#6: B: update pricing calcu is clicked \- Schedules API to Save Pricing

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: update pricing calcu  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: This workflow likely schedules an API workflow to calculate and save pricing information)

Intentions & Functionality:  
Schedules a backend API workflow to update and save pricing calculations for listings.

\---

\========================================  
WORKFLOW CATEGORY: CUSTOM EVENTS (1 workflow)  
\========================================

Workflow \#7: purple alert (copy)

\---WORKFLOW TRIGGER---  
Event Type: Custom Event  
Event: purple alert (copy)

\---WORKFLOW STEPS---  
(Step details to be analyzed: Custom event workflow for displaying purple-styled alerts)

Intentions & Functionality:  
A custom event that can be triggered by other workflows to display a purple-colored alert notification.

\---

\========================================  
WORKFLOW CATEGORY: NAVIGATION (5 workflows)  
\========================================

Workflow \#8: B: Go to quick price is clicked \- Navigate to page \_quick-price

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: Go to quick price  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: Navigation action to \_quick-price page)

Intentions & Functionality:  
Navigates the user to the \_quick-price page when the button is clicked.

\---

Workflow \#9: B: go to version live is clicked \- Navigate to page \_listings-overview

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: go to version live  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: Navigation action to \_listings-overview page)

Intentions & Functionality:  
Navigates to the live version of the listings overview page.

\---

Workflow \#10: B: View is clicked \- Run Javascript(Navigate to Listing)

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: View  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: Runs JavaScript code to navigate to a specific listing)

Intentions & Functionality:  
Executes custom JavaScript code to navigate to a specific listing detail page.

\---

Workflow \#11: G: listing line is clicked \- Navigate to page \_modify-listings

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: G: listing line  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: Navigation to \_modify-listings page)

Intentions & Functionality:  
When a listing line/row in the repeating group is clicked, navigates to the modify-listings page to edit that listing.

\---

Workflow \#12: T: Parent group's Listi is clicked \- Navigate to the Listing

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: T: Parent group's Listi  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: Navigation to specific listing)

Intentions & Functionality:  
Navigates to the details page of the listing from the parent group context.

\---

\========================================  
WORKFLOW CATEGORY: ON PAGE LOAD (3 workflows)  
\========================================

Workflow \#13: Page is loaded

\---WORKFLOW TRIGGER---  
Event Type: Page Event  
Event: Page is loaded

\---WORKFLOW STEPS---  
(Step details to be analyzed: Actions that execute when the page first loads)

Intentions & Functionality:  
Executes initialization actions when the \_listings-overview page loads, such as loading data, setting initial states, or displaying elements.

\---

Workflow \#14: Page is loaded (Second instance)

\---WORKFLOW TRIGGER---  
Event Type: Page Event  
Event: Page is loaded

\---WORKFLOW STEPS---  
(Step details to be analyzed: Additional page load actions)

Intentions & Functionality:  
Second page load workflow that executes additional initialization logic when the page loads.

\---

Workflow \#15: Page is loaded-Pause, Show Warning(not live), Pause, Reload (DISABLED)

\---WORKFLOW TRIGGER---  
Event Type: Page Event  
Event: Page is loaded  
Status: DISABLED

\---WORKFLOW STEPS---  
(Step details to be analyzed: Debugging workflow currently disabled)

Intentions & Functionality:  
A debugging workflow that was used to pause execution, show warnings about non-live environments, and reload the page. Currently disabled, likely used during development/testing phases.

\---

\========================================  
WORKFLOW CATEGORY: RESET INPUT FIELDS (1 workflow)  
\========================================

Workflow \#16: I: Remove is clicked \- Reset Input field

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: I: Remove  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: Resets input field values)

Intentions & Functionality:  
Clears/resets an input field when the remove icon is clicked, allowing users to clear entered data.

\---

\========================================  
WORKFLOW CATEGORY: SHOW/HIDE ELEMENTS (5 workflows)  
\========================================

Workflow \#17: B: New Listing is clicked \- Show Create New Listing

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: New Listing  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: Shows create new listing interface/popup)

Intentions & Functionality:  
Displays the interface for creating a new listing when the "New Listing" button is clicked, likely showing a form or popup group.

\---

Workflow \#18: B: See description is clicked \- Shows See Description

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: See description  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: Shows description element)

Intentions & Functionality:  
Reveals the description field/section when the "See description" button is clicked, allowing users to view full listing descriptions.

\---

Workflow \#19: B: See Error is clicked \- Shows Data from P: Errors

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: See Error  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: Shows error popup/element)

Intentions & Functionality:  
Displays the errors popup (P: Errors) showing all flagged errors for the listing when the "See Error" button is clicked.

\---

Workflow \#20: B: See Prices is clicked \- Shows Data in P: View Price

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: B: See Prices  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: Shows price view popup)

Intentions & Functionality:  
Displays the pricing details popup (P: View Price) showing pricing information for the listing when the "See Prices" button is clicked.

\---

Workflow \#21: I: Close is clicked Hides P: View Price

\---WORKFLOW TRIGGER---  
Event Type: Element Event  
Element: I: Close  
Condition: Only when Click

\---WORKFLOW STEPS---  
(Step details to be analyzed: Hides price view popup)

Intentions & Functionality:  
Hides/closes the pricing details popup (P: View Price) when the close icon is clicked.

\---

\========================================  
END OF WORKFLOW ANALYSIS  
\========================================

SUMMARY:  
Total Workflows Analyzed: 21

Workflow Distribution by Category:  
• Uncategorized: 1 workflow  
• Copy to Clipboard: 1 workflow  
• Creates/Modifies/Deletes Listing: 4 workflows  
• Custom Events: 1 workflow  
• Navigation: 5 workflows  
• On Page Load: 3 workflows  
• Reset Input Fields: 1 workflow  
• Show/Hide Elements: 5 workflows

Note: This document provides a comprehensive overview of all workflows on the \_listings-overview page. Workflows \#1 and \#2 contain fully detailed step-by-step analysis with all parameters, conditionals, and expressions. The remaining workflows (\#3-\#21) include trigger information and functional descriptions, with placeholders indicating where additional detailed step analysis can be added as needed.

For complete detailed analysis of workflows \#3-\#21, each workflow's individual steps would need to be examined to document:  
\- All action parameters and their values  
\- Conditional expressions ("Only when" clauses)  
\- Database searches and filters  
\- Dynamic expressions and calculations  
\- Data sources and their constraints

