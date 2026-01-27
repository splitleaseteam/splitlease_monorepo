GUEST RELATIONSHIPS \- Requirements Document

Page: \_guest-relationships-overview  
Platform: Split Lease  
Created: January 26, 2026

DOCUMENT OVERVIEW  
Purpose: CRM dashboard for managing guest relationships, communications, proposals, and history  
Related Doc: BUBBLE WORKFLOW ANALYSIS (30 workflows)

KEY SECTIONS OF THIS PAGE:

1\. CREATE CUSTOMER \- Form to add new customers with name, email, phone, birth date, user type

2\. SEARCH/SELECT GUEST \- Three search methods:  
   \- By name (dropdown)  
   \- By phone (dropdown)  
   \- By email (text input)

3\. GUEST DISPLAY \- Main area showing:  
   \- Profile photo and contact info  
   \- User information fields  
   \- Saved search details  
   \- Contract information  
   \- Personal address

4\. COMMUNICATIONS:  
   a) Custom Email Section:  
      \- Subject line and body inputs  
      \- Send button  
      \- Preset email buttons (Send Check in/out, Confirm Pricing, etc.)  
      \- Gmail integration link  
     
   b) Text Guest Section:  
      \- Message input  
      \- Send button  
      \- Custom and preset messages  
      \- Phone number display

5\. KNOWLEDGE BASE ARTICLES:  
   \- Article dropdown selector  
   \- Add/Remove buttons  
   \- Display with headline and subtext

6\. PROPOSALS MANAGEMENT:  
   a) Current Proposals (Repeating Group):  
      \- Listing photo, name, host name  
      \- Move-in date, nights selected, duration  
      \- Proposal ID and pricing  
      \- Remove/Add buttons  
     
   b) Suggested Proposals:  
      \- Add Suggested Proposal button  
      \- Listing cards with photo, name, rental type  
      \- View Listing and Remove buttons

7\. CURATED LISTINGS:  
   \- Listing dropdown/search  
   \- Add Listing button

8\. MULTIPLE USERS (Bulk Operations):  
   \- Multi-select dropdown  
   \- Select all/Deselect all buttons  
   \- Add listings to all selected users  
   \- Send messages to multiple users  
   \- Add knowledge articles to multiple users

9\. COMMUNICATION HISTORY:  
   \- Displays all emails, texts, and in-app messages  
   \- Timestamp and page visited information  
   \- Filter by communication type

DATA TYPES USED:  
\- User (guest/customer profiles)  
\- Proposal (rental proposals)  
\- Listing (property listings)  
\- KnowledgeBase (articles)  
\- Message (communications)  
\- \~Message (in-app messages)

WORKFLOWS: 30 total (see separate analysis doc)  
Categories: Email sending, SMS, Search, Proposal management, Listing operations, Bulk user operations

COMPLEX FEATURES:  
\- Multi-channel communication (email, SMS, in-app)  
\- Proposal lifecycle management  
\- Bulk operations on multiple users  
\- Gmail integration for tracking  
\- Knowledge base content distribution  
\- Communication history aggregation

MIGRATION NOTES:  
\- Complex state management between search/selection and display  
\- Multiple repeating groups with nested data  
\- External integrations (Gmail, SMS service)  
\- Conditional visibility based on user selection  
\- Real-time communication logging

END OF REQUIREMENTS DOCUMENT  
Status: COMPLETE  
