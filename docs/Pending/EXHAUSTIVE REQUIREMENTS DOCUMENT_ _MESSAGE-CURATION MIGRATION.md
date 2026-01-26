\# EXHAUSTIVE REQUIREMENTS DOCUMENT: \_MESSAGE-CURATION MIGRATION

\#\# 1\. PAGE OVERVIEW & PURPOSE  
\- \*\*PAGE NAME\*\*: \`\_message-curation\`  
\- \*\*PRIMARY PURPOSE\*\*: Administrative console for monitoring, redacting, and intervening in communications between Guests and Hosts. Enables "Split Bot" intervention and manual message forwarding.  
\- \*\*NAMING CONVENTION\*\*: \`\_\` prefix indicates an internal/admin-only utility page.

\#\# 2\. COMPREHENSIVE ELEMENT HIERARCHY & SPECIFICATIONS

\#\#\# 2.1 Global Structure  
| Element Name | Bubble Type | Data Binding / Initial Content | Visibility / Conditionals |  
| :--- | :--- | :--- | :--- |  
| \*\*\_message-curation\*\* | Page | N/A | N/A |  
| \*\*Corporate Header A\*\* | Reusable | Dashboard Navigation | Always Visible |  
| \*\*GF: debug\*\* | FloatingGroup | Admin Debug State | \`Only when User is Admin\` |

\#\#\# 2.2 Thread Selection Sidebar  
| Element Name | Bubble Type | Data Binding / Initial Content | Conditionals / Logic |  
| :--- | :--- | :--- | :--- |  
| \*\*D: Choose Thread\*\* | Dropdown | \`Search for \~Thread / Conversations\` | Placeholder: "Choose a thread..." |  
| \*\*T: Search for Threads\*\*| Text | Static Label | Always Visible |  
| \*\*T: Show More\*\* | Text | N/A | Triggers "Load Next" action for RG |  
| \*\*B: delete conversation\*\*| Button | N/A | Red text; triggers thread archival |

\#\#\# 2.3 Feed Dashboard (Thread Metadata)  
| Element Name | Bubble Type | Data Binding / Expression | Purpose |  
| :--- | :--- | :--- | :--- |  
| \*\*T: Guest's Name\*\* | Text | \`D: Choose Thread's value's Guest's Name\` | UI Context |  
| \*\*T: Guest Email\*\* | Text | \`G: Messages's \~Message's Guest's Email\` | Contact Info |  
| \*\*T: Host's Full Name\*\* | Text | \`D: Choose Thread's value's Host's Name\` | UI Context |  
| \*\*T: Host Email\*\* | Text | \`G: Messages's \~Message's Host's Email\` | Contact Info |  
| \*\*T: Listing Name\*\* | Text | \`D: Choose Thread's value's Associated Listing's Title\` | Context |  
| \*\*T: unique id\*\* | Text | \`G: Messages's \~Message's unique id\` | Tech Debugging |

\#\#\# 2.4 Conversation Feed (Repeating Group)  
\- \*\*Element\*\*: \`RG: \~Messages\`  
\- \*\*Type of Content\*\*: \`\~Message\`  
\- \*\*Data Source\*\*: \`Search for \~Messages\`  
  \- \*\*Constraint\*\*: \`Associated Thread \= D: Choose Thread's value\`  
  \- \*\*Sorting\*\*: \`Created Date\` (Descending)  
\- \*\*Conditional Layout\*\*:  
  \- \`G: Guest Message\`: Aligned Left. \`Visible when Sender Type \= Guest\`.  
  \- \`G: Host Message\`: Aligned Right. \`Visible when Sender Type \= Host\`.  
  \- \`G: Split Bot Message\`: Center-aligned. \`Visible when is\_from\_bot \= yes\`.

\#\#\# 2.5 Curation Console (Bottom Sticky)  
| Element Name | Bubble Type | Initial Content / Expression | Conditionals |  
| :--- | :--- | :--- | :--- |  
| \*\*Type here...\*\* | MultilineInput| \`Parent group's \~Message's Message Body\` | Changes on curation |  
| \*\*B: Forward this\*\* | Button | N/A | Triggers Message Forwarding |  
| \*\*B: Send Bot (New)\*\* | Button | N/A | Triggers Backend Bot API |  
| \*\*CTAs Dropdown\*\* | Dropdown | \`Search for Messaging \- Call to Action\` | Multi-select for bot actions |  
| \*\*Quick Text 1\*\* | Text | "say Split bot redacted..." | Pre-fills input on click |  
| \*\*Quick Text 2\*\* | Text | "say please limit number..." | Pre-fills input on click |

\---

\#\# 3\. FRONTEND WORKFLOWS DETAIL

\#\#\# 3.1 Event: D: Choose Thread's value is changed  
\- \*\*Step 1: Display data in G: Messages\*\*  
  \- Data: \`This Dropdown's value's Message list:last item\` (Initial load setup).  
\- \*\*Step 2: Scroll to Bottom\*\*  
  \- Target: \`RG: \~Messages\`. Ensuring newest logs are seen.

\#\#\# 3.2 Event: B: Forward this message is clicked  
\- \*\*Step 1: Trigger custom event \`Message Forwarded\`\*\*  
  \- Logic: Validates permissions and logs the attempt.  
\- \*\*Step 2: Make changes to \~Message\*\*  
  \- Field: \`is Forwarded \= yes\`.  
\- \*\*Step 3: Internal Plugin: AirAlert\*\*  
  \- Shows success "Message Forwarded" toast.  
\- \*\*Step 4: Reset G: Messages\*\*  
  \- Clears the curation console.

\#\#\# 3.3 Event: B: Send as Split Bot (New) is clicked  
\- \*\*Step 1: Call Backend \`Message as Split Bot (Guest/Host)\`\*\*  
  \- \*\*Parameters\*\*:   
    \- \`conversation\`: \`D: Choose Thread's value\`  
    \- \`body\`: \`Multiline Input's value\`  
    \- \`call\_to\_action\`: \`D: CTA's value\`  
\- \*\*Step 2: Log intervention\*\*  
  \- Updates \`\~Thread\` with \`Last Bot Intervention Timestamp\`.

\---

\#\# 4\. BACKEND WORKFLOWS (MESSAGING SYSTEM)

\#\#\# 4.1 Workflow: \`Message as Split Bot (Guest)\`  
\- \*\*Trigger\*\*: API Call.  
\- \*\*Logic\*\*:   
  1\. \`Create a new \~Message\`.  
  2\. \`Set is\_from\_bot \= yes\`.  
  3\. \`Set Body \= parameter body\`.  
  4\. \`Schedule API Workflow: Relay SMS\`.  
  5\. \`Schedule API Workflow: Send Email\`.

\#\#\# 4.2 Workflow: \`mark lease documents are signed\`  
\- \*\*Trigger\*\*: Button \`B: mark lease...\`.  
\- \*\*Logic\*\*:  
  1\. \`Make changes to \~Lease\`: \`status \= Signed\`.  
  2\. \`Make changes to \~Thread\`: \`curation\_status \= Completed\`.  
  3\. \`Trigger Email Template T\`: Sends confirmation to Host/Guest.

\---

\#\# 5\. DATA MODEL & FORMULAS (INFERRED)

\#\#\# 5.1 \~Message Table  
\- \`Body\` (Text)  
\- \`Associated Thread\` (\~Thread)  
\- \`is Forwarded\` (Yes/No)  
\- \`is\_from\_bot\` (Yes/No)  
\- \`Sender Type\` (Guest/Host/Bot)  
\- \`Timestamp\` (Date)

\#\#\# 5.2 \~Thread / Conversations Table  
\- \`Guest\` (User)  
\- \`Host\` (User)  
\- \`Listing\` (\~Listing)  
\- \`Status\` (Open/Closed/Archived)  
\- \`Messages\` (List of \~Messages)

\#\#\# 5.3 Redaction Logic (Regex)  
The curation console pre-fills warnings based on patterns:  
\- \*\*Phone Pattern\*\*: \`(\\d{3})\[-. \]?(\\d{3})\[-. \]?(\\d{4})\`  
\- \*\*Email Pattern\*\*: \`\[A-Za-z0-9.\_%+-\]+@\[A-Za-z0-9.-\]+\\.\[A-Za-z\]{2,}\`

\---

\#\# 6\. DESIGN SYSTEM & AESTHETICS  
\- \*\*Colors\*\*:   
  \- Primary Action: Blue (\#007AFF)  
  \- Warning/Delete: Red (\#FF3B30)  
  \- Success Indicator: Green (\#34C759)  
\- \*\*Typography\*\*: Likely \`Outfit\` or \`Inter\` (Standard Split Lease fonts).  
\- \*\*Layout\*\*: 1500px fixed width, responsive center content.

\---

\#\# 7\. MIGRATION ROADMAP  
1\. \*\*Database Setup\*\*: Replicate \`\~Message\` and \`\~Thread\` in Supabase.  
2\. \*\*Infinite Scroll Feed\*\*: Implement React-based Repeating Group with memoization for performance.  
3\. \*\*Curation Logic\*\*: Build the multiline editor with template support.  
4\. \*\*API Integration\*\*: Connect bot CTA buttons to Edge Functions for Twilio/SendGrid relay.