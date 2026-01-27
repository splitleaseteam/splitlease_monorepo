\# z-icons-test-ide \- COMPREHENSIVE REQUIREMENTS DOCUMENT  
\*\*Bubble to Code Migration Specification\*\*  
\*\*Page: z-icons-test-ide\*\*

\---

\#\# 1\. PAGE OVERVIEW & PURPOSE

\*\*PAGE NAME:\*\* z-icons-test-ide  
\*\*PRIMARY FUNCTION:\*\* Internal icon exploration and QA page to preview and validate the icon sets used across the Split Lease UI, including different icon libraries and plugin-provided icons.

\*\*KEY CAPABILITIES:\*\*  
\- Displays a gallery of icons used across the Split Lease application  
\- Supports multiple icon libraries (Font Awesome, Material, Ionic, Iconify)  
\- Supports custom SVG icons (⚛️ Contact Us Icons, ⚛️ Listing Card – Current, etc.)  
\- Provides metadata for icons (name, library, category)  
\- Allows developers to preview icon styles and sizes

\---

\#\# 2\. PAGE CONFIGURATION

\*\*DIMENSIONS:\*\*  
\- Width: 1200 px  
\- Height: Dynamic, vertical scrolling enabled  
\- Fixed-width: Yes

\*\*PAGE SETTINGS:\*\*  
\- Native app: No  
\- Background: Light gray or white  
\- Opacity: 100%

\---

\#\# 3\. ELEMENT HIERARCHY

\#\#\# Page: z-icons-test-ide

\#\#\#\# Elements Structure:  
1\. \*\*Gallery Container\*\*  
   \- Repeating Group (for displaying icons in a grid)  
   \- Layout: Multi-column grid  
   \- Data Source: Icon collection/Option Set

2\. \*\*Icon Library Categories:\*\*  
   \- Font Awesome (Bubble built-in)  
   \- Material Icons  
   \- Ionic Icons  
   \- Iconify Plugin Icons  
   \- Custom SVG Collections:  
     \- ⚛️ Contact Us Icons  
     \- ⚛️ Listing Card \- Current

3\. \*\*Preview Components:\*\*  
   \- Icon Display (Visual element)  
   \- Icon Name (Text label)  
   \- Copy Reference Button (Air copy to clipboard)

\*\*Layout:\*\* Gallery-style grid with icons and their names listed.

\---

\#\# 4\. WORKFLOWS & EVENT HANDLERS

\#\#\# Core Workflows:  
1\. \*\*Search/Filter Workflow:\*\*  
   \- Filters the gallery based on name or category  
2\. \*\*Selection Workflow:\*\*  
   \- Clicking an icon shows detailed metadata  
3\. \*\*Copy to Clipboard:\*\*  
   \- Copies the icon token or class name for development use

\---

\#\# 5\. DATA SOURCES & EXPRESSIONS

\#\#\# Icon Sources:  
\- Bubble's internal Icon library (Font Awesome 4/5)  
\- Material Icons plugin  
\- Ionic Icons plugin  
\- Custom SVG data stored in reusables or option sets

\---

\#\# 6\. CONDITIONALS

\#\#\# Typical Implementations:  
1\. Highlight selected icon  
2\. Visibility based on library filter  
3\. Responsive sizing adjustments

\---

\#\# 7\. TECHNICAL NOTES & MIGRATION RECOMMENDATIONS

\#\#\# Component Library:  
\- Map Bubble icons to your new UI library (e.g., Lucide, FontAwesome React, Heroicons)  
\- Create a central icon registry or mapping file  
\- Maintain consistent naming for custom SVGs

\#\#\# Optimization:  
\- Use SVG sprites or icon fonts for performance  
\- Ensure icons are accessible (ARIA labels)  
\- Implement consistent sizing (16px, 24px, 32px etc.)

\#\#\# Testing:  
\- Verify all icons render correctly in the new stack  
\- Check alignment and color overrides  
\- Test copy-to-clipboard functionality

\---

\*\*Document Version:\*\* 1.0  
\*\*Last Updated:\*\* January 26, 2026  
\*\*Status:\*\* Ready for Migration  
