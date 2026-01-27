BUBBLE TO CODE MIGRATION: COMPREHENSIVE REQUIREMENTS DOCUMENT  
\_rental-app-manage Page Specification

Document Version: 1.0  
Page Name: \_rental-app-manage  
App: Split Lease Production  
Date: January 21, 2026  
Purpose: Complete technical specification for migrating the Rental Application Management page from Bubble to code

\================================================================================  
EXECUTIVE SUMMARY  
\================================================================================

The \_rental-app-manage page is a comprehensive Rental Application Management interface designed for administrative users to search, filter, view, and manage rental applications submitted by potential tenants. The page displays a searchable and filterable list of rental applications in a repeating group format, with detailed popup views for individual applications.

Key Statistics:  
\- Page Workflows: 18 (across 7 categories)  
\- App Backend Workflows: 296 (note: these are app-wide, not page-specific)  
\- Main Data Type: Rental Application  
\- Related Data Types: Occupant, User (Guest/Creator)  
\- Active Data Display: 224 rental applications (in production preview)

\================================================================================  
1\. PAGE OVERVIEW & BUSINESS PURPOSE  
\================================================================================

1.1 PRIMARY FUNCTION  
This page serves as the central hub for administrators to manage incoming rental applications. Users can:  
\- Search and filter rental applications by multiple criteria  
\- View summary information for all applications in a table format  
\- Access detailed views of individual applications  
\- Edit application information across multiple categories  
\- Sort and organize applications by various fields

1.2 USER PERSONAS  
\- Primary: Split Lease administrators and property managers  
\- Access Level: Authenticated users with appropriate permissions  
\- Use Case: Daily review and processing of rental applications

1.3 KEY BUSINESS RULES  
\- Applications can be filtered by completion status (default: completed applications shown)  
\- Each application belongs to a unique Guest (User)  
\- Applications contain multiple related data entities (personal info, address, employment, references, occupants, accessibility preferences)  
\- The system supports both completed and in-progress applications

\================================================================================  
2\. PAGE STRUCTURE & LAYOUT  
\================================================================================

2.1 PAGE HIERARCHY

