# OpenCode Implementation Prompt

## Task: Implement z-emails-unit Page

You are implementing the **z-emails-unit** page for the Split Lease application as part of a Bubble-to-Code migration.

### Requirements Document
Read the full requirements from: `docs/Pending/Z_EMAILS_UNIT_REQUIREMENTS.md`

### Implementation Instructions

**Page Route**: `/_internal/z-emails-unit`

**Auth Requirements**: SKIP ALL AUTH CHECKS. This is an internal test page - assume full admin access.

**Implementation Pattern**:
1. Create a **Hollow Component** at `app/src/islands/pages/ZEmailsUnitPage/ZEmailsUnitPage.jsx`
2. Create a **Logic Hook** at `app/src/islands/pages/ZEmailsUnitPage/useZEmailsUnitPageLogic.js`
3. Add route to the appropriate routing file

**Design Requirements**:
- **Visual Match**: Achieve 95%+ visual fidelity with the original Bubble page
- **Fixed Width**: 1650px as specified in requirements
- **Background**: White (#FFFFFF)
- **Page Title**: "Email Unit Test | Admin"

**Functional Requirements**:
- Email template testing interface
- Recipient selection
- Email type dropdown
- Preview functionality
- Send test email capability

**Code Quality**:
- No console errors
- Clean separation between presentation (component) and logic (hook)
- Follow existing Split Lease code patterns
- Use existing UI components where possible

**Testing**:
- Verify the page loads without errors
- Check that all interactive elements are functional
- Validate visual appearance matches Bubble original

### Next Steps After Implementation
1. Test the page locally at `http://localhost:4040/_internal/z-emails-unit`
2. Take a screenshot for visual comparison
3. Report any blockers or questions
