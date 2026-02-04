# Claude Code Implementation Prompt

## Task: Implement z-search-unit-test Page

You are implementing the **z-search-unit-test** page for the Split Lease application as part of a Bubble-to-Code migration.

### Requirements Document
Read the full requirements from: `docs/Pending/Z_SEARCH_UNIT_TEST_REQUIREMENTS.md`

### Implementation Instructions

**Page Route**: `/_internal/z-search-unit-test`

**Auth Requirements**: SKIP ALL AUTH CHECKS. This is an internal test page - assume full admin access.

**Implementation Pattern**:
1. Create a **Hollow Component** at `app/src/islands/pages/ZSearchUnitTestPage/ZSearchUnitTestPage.jsx`
2. Create a **Logic Hook** at `app/src/islands/pages/ZSearchUnitTestPage/useZSearchUnitTestPageLogic.js`
3. Add route to the appropriate routing file

**Design Requirements**:
- **Visual Match**: Achieve 95%+ visual fidelity with the original Bubble page
- **Background**: White (#FFFFFF)
- **Page Purpose**: Unit testing page for search and listing filtering functionality

**Functional Requirements**:
- Geographic filters (Boroughs and Neighborhoods dropdowns)
- Temporal filters (Days/Nights availability)
- Schedule pattern selection (reusable component)
- Listing attribute filters (Active, Approved, Complete, Default)
- Repeating group for listings display
- Sorting and price filtering

**Search Algorithm** (from requirements):
```
SEARCH Listings WHERE:
  Location-Borough = [Selected Borough]
  AND Nights_Available CONTAINS [Selected Nights]
  AND Nights_Not_Available NOT_OVERLAPS [Selected Nights]
  AND Days_Available CONTAINS [Selected Days]
  AND Days_Not_Available NOT_OVERLAPS [Selected Days]
  AND [Weekly Pattern Match]
ORDER BY [Sort Option]
```

**Code Quality**:
- No console errors
- Clean separation between presentation (component) and logic (hook)
- Follow existing Split Lease code patterns
- Reuse existing Search Schedule Selector component if available
- Use existing data fetching patterns for listings

**Testing**:
- Verify all filters work correctly
- Check that listings display properly
- Validate search logic matches requirements
- Ensure visual appearance matches Bubble original

### Next Steps After Implementation
1. Test the page locally at `http://localhost:4040/_internal/z-search-unit-test`
2. Test all filter combinations
3. Take a screenshot for visual comparison
4. Report any blockers or questions
