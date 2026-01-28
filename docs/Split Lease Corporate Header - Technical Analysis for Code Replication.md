Split Lease Corporate Header \- Technical Analysis for Code Replication

EXECUTIVE SUMMARY

This document provides a comprehensive technical analysis of the Split Lease Corporate Header reusable element built in [Bubble.io](http://Bubble.io). The analysis covers design specifications, typography, colors, dimensions, conditionals, and functionality to enable accurate code replication.

\================================================================================

1. OVERALL STRUCTURE

The Corporate Header consists of two main sections:

- Desktop Header (G:HeaderDesktop) \- Primary navigation for larger screens  
- \- Mobile Header (G: Mobile Header) \- Secondary navigation for smaller screens

Plus supporting dropdown menus:

- Menu Corporate Pages (floating group)  
- \- Menu Unit Tests (floating group)

\================================================================================

2. DESKTOP HEADER (G:HeaderDesktop)

CONTAINER PROPERTIES:

- Type: Group  
- \- Width: 1440px  
- \- Height: 60px  
- \- Position: X: 0, Y: 0  
- \- Background: Flat color \- Primary Blue (\#0205D3)  
- \- Border: None  
- \- Border Radius: 0  
- \- Shadow: None  
- \- Visible on page load: Yes  
- \- Collapse height when hidden: Yes

CONDITIONAL:

- When: Current page width \< Desktop’s Resolution min (px)  
-   → This element is visible: OFF (hides on mobile)

\================================================================================

3. TYPOGRAPHY SPECIFICATIONS

3.1 LOGO TEXT (“Split Lease”)

- Font Family: Avenir Next LT Pro Bold  
- \- Font Size: 20px  
- \- Font Color: \#FFFFFF (White)  
- \- Text Alignment: Left  
- \- Word Spacing: 0  
- \- Line Spacing: 1.25  
- \- Letter Spacing: 0  
- \- Dimensions: W: 118px, H: 28px, X: 48, Y: 6  
- \- Minimum Width: 20%  
- \- CONDITIONAL: When page width \< 1400px → Hidden

3.2 NAVIGATION MENU TEXT (“Corporate Pages”, “Unit Tests”)

- Font Family: DM Sans  
- \- Font Weight: 400  
- \- Font Size: 18px  
- \- Font Color: \#FFFFFF (White)  
- \- Text Alignment: Right  
- \- Word Spacing: 1  
- \- Line Spacing: 1.25  
- \- Letter Spacing: \-1  
- \- Dimensions (Corporate Pages): W: 154px, H: 28px  
- \- Dimensions (Unit Tests): W: 118px, H: 28px

3.3 LOG IN TEXT

- Font Family: DM Sans  
- \- Font Weight: 400  
- \- Font Size: 18px  
- \- Font Color: \#FFFFFF (White)  
- \- Text Alignment: Left  
- \- Dimensions: W: 230px, H: 56px, X: 1104, Y: 0  
- \- Fixed Width: Yes

CONDITIONAL FOR LOG IN:

- When: Current User is logged in  
-   → Text changes to: “\[User’s First Name\], \[User’s email\], admin user: \[Is Admin formatted as text\]”  
-   → Font size: 14px  
-   → Visible: Yes  
-   → Clickable: No

\================================================================================

4. BUTTON SPECIFICATIONS

4.1 “CHANGE PRICES” BUTTON

- Type: Button  
- \- Text: “Change Prices”  
- \- Font Family: DM Sans  
- \- Font Weight: 400  
- \- Font Size: 18px  
- \- Font Color: \#6D23CF (Purple)  
- \- Background: Flat color \- \#FFFFFF (White)  
- \- Dimensions: W: 180px, H: 44px, X: 917, Y: 8  
- \- Fixed Width: Yes  
- \- Border Style: Solid  
- \- Border Width: 2px  
- \- Border Color: \#FFFFFF (White)  
- \- Border Radius: 5px

CONDITIONALS:

1. When: This Button is hovered  
2.    → Box Shadow Style: Outset  
3.    → Box Shadow Color: \#00539B  
4.    → Font Color: \#004480

2\. When: Current page name is “financial-freedom”  
   → This element is visible: OFF (hidden)

\================================================================================

5. LOGO IMAGE

PROPERTIES:

- Element Type: Image  
- \- Name: I:White logo (Desktop Header)  
- \- Dynamic Image Source: “Small Circle Logo \- White’s Image processed with Imgix”  
- \- Run-mode Rendering: Rescale  
- \- Dimensions: W: 40px, H: 40px, X: 0, Y: 0  
- \- Fixed Width: Yes  
- \- Border: None  
- \- Border Radius: 0  
- \- Shadow: None

\================================================================================

6. DROPDOWN MENU ICONS (Chevron/Arrow)

PROPERTIES:

- Element Type: Icon  
- \- Icon Color: \#FFFFFF (White)  
- \- Dimensions: W: 26px, H: 22px  
- \- Fixed Width: Yes  
- \- Background: None  
- \- Border: None  
- \- Border Radius: 4px  
- \- Clickable: No (serves as visual indicator only)

\================================================================================

7. DROPDOWN MENU (Menu Corporate Pages)

TYPE: Floating Group

POSITIONING:

- Reference Element: “Why Stay With Us” group  
- \- Offset Top: 13px  
- \- Offset Left: \-90px

DIMENSIONS:

- Width: 449px  
- \- Height: 285px

STYLING:

- Background: Flat color \- \#FFFFFF (White)  
- \- Border Style: None (all sides)  
- \- Border Radius:  
-   \- Top-left: 0  
-   \- Top-right: 0  
-   \- Bottom-right: 5px  
-   \- Bottom-left: 5px

SHADOW:

- Style: Outset  
- \- Horizontal Offset: 0  
- \- Vertical Offset: 16px  
- \- Blur Radius: 8px  
- \- Spread Radius: 0  
- \- Color: \#000000 (Black)

\================================================================================

8. PROFILE IMAGE GROUP

PROPERTIES:

- Element Type: Group  
- \- Dimensions: W: 45px, H: 39px, X: 1356, Y: 10  
- \- Fixed Width: Yes  
- \- Border Radius: 100 (fully circular)  
- \- Background: None

CONDITIONAL:

- When: Current User is logged out  
-   → This element is visible: OFF (hidden when logged out)

\================================================================================

9. MOBILE HEADER (G: Mobile Header)

CONTAINER PROPERTIES:

- Type: Group  
- \- Width: 375px  
- \- Height: 70px  
- \- Position: X: 532, Y: 59  
- \- Background: None  
- \- Border Style: Dotted  
- \- Border Width: 1px  
- \- Border Color: Primary contrast (\#FFFFFF)  
- \- Collapse height when hidden: Yes

CONDITIONALS:

1. When: Current page width \> Desktop’s Resolution min (px)  
2.    → This element is visible: OFF (hidden on desktop)

2\. When: This Group is visible  
   → Border style \- all borders: None

\================================================================================

10\. COLOR PALETTE SUMMARY

Primary Colors:

- Primary Blue (Header Background): \#0205D3  
- \- White (Text, Borders): \#FFFFFF  
- \- Purple (Button Text): \#6D23CF  
- \- Black (Shadow): \#000000

Hover States:

- Button Shadow (Hover): \#00539B  
- \- Button Text (Hover): \#004480

\================================================================================

11\. RESPONSIVE BEHAVIOR

BREAKPOINTS:

- Desktop: When page width \>= Desktop’s Resolution min  
- \- Mobile: When page width \< Desktop’s Resolution min

HIDDEN ON MOBILE (\< breakpoint):

- G:HeaderDesktop  
- \- Split Lease text (also hidden when width \< 1400px)

VISIBLE ON MOBILE (\< breakpoint):

- G: Mobile Header

\================================================================================

12\. ELEMENT HIERARCHY

\_Corporate Header (Reusable Element)  
└── Layers  
    ├── G:HeaderDesktop  
    │   └── G: Top part of header  
    │       ├── T: Log In  
    │       ├── B: Change Prices  
    │       ├── G: Profile Image  
    │       └── G: Corporate pages and…  
    │           └── G: Split Lease icon  
    │               ├── I:White logo (Desktop Header)  
    │               ├── Text \[left\]Split Lease\[/left\]  
    │               ├── Why Stay With Us  
    │               │   ├── T: Stay With Us  
    │               │   └── I: stay with us icon  
    │               ├── Host with Us  
    │               └── Text \[left\]FAQ…\[/left\]  
    ├── Mobile Menu  
    │   └── Signup/Login  
    ├── GroupFocus D  
    ├── G: Mobile Header  
    ├── Menu Unit Tests (Floating Group)  
    ├── Menu Corporate Pages (Floating Group)  
    └── Other elements…

\================================================================================

13\. KEY FUNCTIONALITY NOTES FOR CODE REPLICATION

1. The header uses responsive design with two separate layouts (desktop/mobile)  
2. 2\. Navigation dropdowns are implemented as floating groups that appear on hover  
3. 3\. User authentication affects visibility of:  
4.    \- Profile Image (hidden when logged out)  
5.    \- Log In text changes to user info when logged in  
6. 4\. Page-specific conditionals hide certain elements (e.g., Change Prices on financial-freedom page)  
7. 5\. The dropdown menus have offset positioning relative to their trigger elements  
8. 6\. Box shadows provide depth to dropdown menus  
9. 7\. Border radius of 100 creates circular profile image containers

\================================================================================

14\. CSS IMPLEMENTATION SUGGESTIONS

/\* Header Container \*/  
.desktop-header {  
    Width: 100%;  
    Max-width: 1440px;  
    Height: 60px;  
    Background-color: \#0205D3;  
    Display: flex;  
    Align-items: center;  
    Padding: 0 48px;  
}

/\* Logo Text \*/  
.logo-text {  
    Font-family: ‘Avenir Next LT Pro’, sans-serif;  
    Font-weight: 700;  
    Font-size: 20px;  
    Color: \#FFFFFF;  
    Line-height: 1.25;  
}

/\* Navigation Text \*/  
.nav-text {  
    Font-family: ‘DM Sans’, sans-serif;  
    Font-weight: 400;  
    Font-size: 18px;  
    Color: \#FFFFFF;  
    Line-height: 1.25;  
    Letter-spacing: \-1px;  
    Word-spacing: 1px;  
}

/\* CTA Button \*/  
.cta-button {  
    Font-family: ‘DM Sans’, sans-serif;  
    Font-weight: 400;  
    Font-size: 18px;  
    Color: \#6D23CF;  
    Background-color: \#FFFFFF;  
    Border: 2px solid \#FFFFFF;  
    Border-radius: 5px;  
    Padding: 10px 20px;  
    Width: 180px;  
    Height: 44px;  
    Cursor: pointer;  
    Transition: all 0.2s ease;  
}

.cta-button:hover {  
    Box-shadow: 0 0 0 2px \#00539B;  
    Color: \#004480;  
}

/\* Dropdown Menu \*/  
.dropdown-menu {  
    Position: absolute;  
    Width: 449px;  
    Height: 285px;  
    Background-color: \#FFFFFF;  
    Border-radius: 0 0 5px 5px;  
    Box-shadow: 0 16px 8px rgba(0, 0, 0, 0.15);  
    Top: 100%;  
    Margin-top: 13px;  
    Margin-left: \-90px;  
}

/\* Profile Image Container \*/  
.profile-image {  
    Width: 45px;  
    Height: 39px;  
    Border-radius: 100%;  
    Overflow: hidden;  
}

/\* Media Query for Mobile \*/  
@media (max-width: 992px) {    .desktop-header {        display: none;    }    .mobile-header {        display: flex;    }}================================================================================END OF DOCUMENTThis analysis provides the foundational specifications needed to recreate the Split Lease Corporate Header in standard HTML/CSS/JavaScript or any frontend framework.