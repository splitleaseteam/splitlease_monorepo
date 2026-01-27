AI TOOLS PAGE \- COMPREHENSIVE REQUIREMENTS DOCUMENT

Project: Migration from Bubble to Code  
Page: \_jingles-deepfakes-requests-ai-tools  
Date: January 14, 2026

\==== EXECUTIVE SUMMARY \====  
This page is a complex multi-section interface for generating AI-powered content (deepfakes, voice-overs, and jingles) for house manual listings in the Split Lease application. The page integrates with multiple AI services (HeyGen, ElevenLabs) and contains sophisticated workflows for managing voice/video IDs, generating scripts, and attaching media to house manuals.

\==== PAGE SPECIFICATIONS \====  
Page Title: My Page (should be updated)  
Page Type: Native App  
Content Type: House Manual  
Page Dimensions: Width: 1400px, Height: 3000px  
Page Style: Fixed width  
Background Color: \#FFFFFF (white)

\==== MAIN SECTIONS \====

1\. HEYGEN DEEPFAKE GENERATION  
Purpose: Create and manage deepfake videos using HeyGen AI  
Layout: Grid with 3 main columns

Section 1A: Creation of Voice ID and Video ID  
\- Dropdowns for House Manual selection and Deepfake selection  
\- "Create DeepFake Datatype" button  
\- Links to download sample video and consent video  
\- Link: "Heygen Create New Video Avatar"

Section 1B: Deepfake Generation  
\- "Generate Script" button  
\- Text area for pasting video script  
\- "Generate Video" button  
\- Video Token input field  
\- "Check Status" button  
\- Status display text

Section 1C: Attach Video to House Manual  
\- "Get Deepfake URL" button  
\- Download Deepfake link  
\- "Add Deepfake to House Manual" button  
\- Upload icon graphic  
\- Heygen ID display

2\. AI VOICE OVER CREATION  
Purpose: Generate narration for house manual visits using ElevenLabs

Section 2A: Narration Script Generation  
\- Dropdowns: House Manual, Visit, Narrator  
\- "Generate Script" button  
\- Voice Generation section  
\- Text area for script  
\- "Generate Audio Narration" button

Section 2B: Attach Narration to House Manual Visit  
\- Dropdown to select Visit  
\- "Attach Narration Audio to Visit" button  
\- Verify Narration Attached to Visitors Account section

3\. JINGLE CREATION  
Purpose: Generate branded jingles for house manuals with customizable preferences

Section 3A: Requests  
\- Dropdown: Choose House Manual  
\- Dropdown: Choose Visit

Section 3B: Jingle Script  
\- "Generate Jingle Lyrics" button  
\- Text area for jingle script (read-only)  
\- New Jingle ID dropdown

Section 3C: Content & Melody Preferences  
\- Content Preference checkboxes:  
  \* House Rules  
  \* Host Name  
  \* Guest NickName  
  \* Arrival Instructions  
  \* Edit button for preferences  
\- Melody Preference radio buttons:  
  \* Morning Melody  
  \* Gentle Nighttime  
  \* Optimistic Commercial  
  \* Hip Hop  
  \* Country  
  \* EDM  
  \* Jazz  
  \* Opera  
  \* Religious

Section 3D: Attach Jingle to House Manual  
\- "Add Jingle to House Manual" button  
\- Jingle/Narration ID display  
\- Listing display  
\- Host Name display  
\- House Manual display

\==== DATA BINDING & DYNAMIC CONTENT \====

Main Parent Group Data Source:  
\- Type: HeyGen AI Video  
\- Contains: Video IDs, Voice IDs, House Manual reference, Host reference

Narration/Jingle Parent Group Data Source:  
\- Type: Narration / Jingle object  
\- Contains: Melody preferences, Content preferences, House Manual reference

Key Data Dropdowns:  
1\. House Manual Selector:  
   \- Displays: House Manual ID, Listing, Host name  
   \- Contains 100+ house manuals from various hosts  
   \- Filtered by House Manual with Listing and Host details

2\. Deepfake Selector:  
   \- Dropdown to choose existing deepfakes  
   \- Currently empty in sample data

3\. Video/Voice ID Selectors:  
   \- Prepopulated with sample IDs  
   \- Read-only display fields

4\. Visit Selector:  
   \- Lists visits associated with selected house manual  
   \- Used for attaching narrations and jingles

5\. Narrator Selector:  
   \- Predefined narrator options with languages:  
     \* David Attenborough (English)  
     \* Ricardo Darín (Spanish)  
     \* Serhiy Prytula (Ukrainian)  
     \* Olena (Ukrainian)  
     \* Eric Braa (English)  
     \* Snoop Dogg (English)  
     \* Larry David (English)  
     \* Jerry Seinfield (English)  
     \* Barack Obama (English)  
     \* Meryl Streep (English)  
     \* Morgan Freeman (English)  
     \* Martha Stewart (English)  
     \* Mary Poppins (English)  
     \* Steve Irwin (English)

6\. Jingle Selector:  
   \- Dropdown with 400+ jingles  
   \- Jingles associated with users and house manuals

\==== ELEMENTS & COMPONENTS \====

Key Elements in Elements Tree:  
1\. Text AI Tools \- Page title (Heading style)  
2\. G: HeyGen Video Generation \- Main group container  
   \- T: HeyGen DeepFake Subhe... \- Section title  
   \- S: Horizontal Line \- Visual separator  
   \- Text Creation of Voice ID \- Section subtitle  
   \- Text Attach Video to Hous \- Section subtitle  
   \- T: Deepfake Generation \- Section title  
   \- B: Generate Script for Deepf... \- Button for script generation

3\. G: Elevenlabs Voice Generation \- Main group container  
4\. G: Jingle Creation \- Main group container

\==== WORKFLOWS (Page Level) \====

Total Workflows: 29 on page  
Categories:  
1\. Uncategorized (1)  
2\. Audio/Video (5 workflows)  
   \- B: Check Status is clicked (DISABLED)  
   \- B: Get Voice & Video ID i... (DISABLED)  
   \- B: Get Voice & Video ID is clicked  
   \- Button Generate Video i... (DISABLED)  
   \- I: Play Attached Audio (This Icon's playing? is no)  
   \- I: Play Attached Audio (This Icon's playing? is yes)

3\. Custom Events (5)  
4\. DeepFake (5)  
   \- B: Add Deepfake to House manu...  
   \- B: Generate Script for Deepfake ... (multiple)  
   \- B: Get Deepfake URL is c... (DISABLED)

5\. Jingles (6)  
6\. Narrations (5)  
7\. Page is Loaded (2)

Detailed Workflow Example:  
Workflow: "B: Get Voice & Video ID is clicked"  
\- Trigger: Button click on "Get Voice & Video IDs" button  
\- Step 1: Make changes to Heygen AI Video  
  \* Sets Video ID from input field value  
  \* Sets Voice ID from input field value  
\- Step 2: AirAlert \- Standard (Shows success notification)

\==== BACKEND WORKFLOWS \====

Total Backend Workflows: 296 in app

Key Categories (Related to AI Tools):  
\- Bots (2)  
\- Bulk Fix (48)  
\- ChatGPT (7)  
\- Code Based API Calls (14)  
\- Core \- Notifications (1)  
\- Core \- User Management (5)  
\- Data Management (5)  
\- House Manual Visitors handling (13)  
\- Integrations & APIs (1)  
\- Voice Flow (9)  
\- Zapier (6)

For specific backend workflows analysis, need to explore:  
1\. HeyGen API integration workflows  
2\. ElevenLabs API integration workflows  
3\. Jingle generation workflows  
4\. Narration generation workflows  
5\. Database update workflows for video/voice IDs

\==== CONDITIONALS & EXPRESSIONS \====

Key Conditional Logic (to be documented in detail):  
1\. Video ID availability check: "D: Video IDs's value is empty"  
2\. Voice ID availability check: "D: Voice IDs's value is empty"  
3\. Element visibility conditions on G: HeyGen Video Generation  
4\. Radio button state for melody preferences (9 options)  
5\. Checkbox states for content preferences (4 options)

\==== MISSING/KNOWN ISSUES \====

1\. "missing element" indicators appear in:  
   \- House Manual Narration by section  
   \- Narration / Jingle ID display area  
   This suggests either:  
   a) Elements are not rendering properly  
   b) Conditional visibility is hiding elements  
   c) Dynamic data binding is failing

2\. Read-only fields that display dynamic values:  
   \- Video ID field (displays formatted data)  
   \- Voice ID field (displays formatted data)  
   \- Jingle Script textarea  
   \- Melody Preference display

\==== QUESTIONS FOR NEXT ANALYSIS PASS \====

1\. What are the specific backend API calls for:  
   \- HeyGen video generation?  
   \- ElevenLabs narration generation?  
   \- Jingle generation service?

2\. What database operations are triggered by each button?

3\. How is the "missing element" rendering being handled?  
   \- Are these custom reusable components?  
   \- Are they conditionally hidden?

4\. What are the complete conditional expressions for:  
   \- Element visibility  
   \- Button enable/disable states  
   \- Field read-only states

5\. How is data persisted:  
   \- Where are video/voice IDs stored?  
   \- How is the relationship between House Manual, Visit, Video, and Voice data maintained?  
   \- What triggers the database update when attaching media to house manuals?

6\. What is the error handling flow when:  
   \- Video generation fails?  
   \- Voice generation fails?  
   \- Attachment to house manual fails?

7\. What are the validation rules for:  
   \- Script content?  
   \- Narrator selection?  
   \- Melody preference selection?  
   \- Content preference checkboxes?

8\. How does the "Create \[X\] Datatype" button work?  
   \- What data structure does it create?  
   \- Where is it stored?

9\. What are all the reusable elements being used?  
   \- Identify all reusable components  
   \- Document their props/parameters

10\. What is the download flow for:  
    \- Sample videos?  
    \- Consent videos?  
    \- Generated deepfakes?  
    \- Generated narrations?

\==== NEXT STEPS FOR COMPLETE ANALYSIS \====

1\. Expand all workflow definitions in the Workflows tab  
2\. Document all backend workflows related to AI tool generation  
3\. Analyze all expressions and conditionals  
4\. Document all API integrations  
5\. Map complete data flow for each section  
6\. Identify all custom plugins/integrations (Zapier, ChatGPT, etc.)  
7\. Test edge cases and error scenarios  
8\. Document all validation rules  
9\. Extract exact button names and their actions  
10\. Create technical architecture diagram

END OF DOCUMENT  
