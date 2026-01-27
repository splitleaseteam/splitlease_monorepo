# Perplexity Requirements Gathering Prompt - Batch 2

## Task: Create Requirements Documents for Missing Bubble Pages (Part 2 of 2)

You are creating comprehensive requirements documents for 3 internal test pages in the Split Lease Bubble application that currently lack documentation.

### Context
Split Lease is migrating from Bubble.io to a custom code implementation. Some internal test/utility pages (prefixed with "z-") need requirements documents created from the Bubble IDE.

### Your Mission
Access the Split Lease Bubble IDE and create detailed requirements documents for the following 3 pages:

---

## Page 1: z-input-plugin-test-2

**Bubble Access**: Navigate to the "z-input-plugin-test-2" page in the Bubble IDE
**Note**: May also be listed as "z-input_plugin-test-2" (with underscore) in some places

**Document to Create**: `Z_INPUT_PLUGIN_TEST_2_REQUIREMENTS.md`

**What to Document**:
1. **Page Overview & Purpose**: Input plugin testing functionality
2. **Page Configuration**: Dimensions, settings, background, fixed-width status
3. **Element Hierarchy**: Complete list of all UI elements
4. **Plugin Details**: Which input plugin(s) are being tested
5. **Input Types**: What types of inputs (text, date, dropdown, custom, etc.)
6. **Workflows**: All workflow triggers and validation logic
7. **Conditionals**: Validation states, error messages, visibility rules
8. **Testing Scenarios**: How developers test plugin functionality

---

## Page 2: z-schedule-test

**Bubble Access**: Navigate to the "z-schedule-test" page in the Bubble IDE

**Document to Create**: `Z_SCHEDULE_TEST_REQUIREMENTS.md`

**What to Document**:
1. **Page Overview & Purpose**: Schedule/calendar testing functionality
2. **Page Configuration**: Dimensions, settings, background, fixed-width status
3. **Element Hierarchy**: Complete list of all UI elements (calendar, schedule selectors, etc.)
4. **Schedule Components**: Reusable schedule selector components used
5. **Data Model**: How schedules are represented (days, nights, weeks, patterns)
6. **Workflows**: Schedule selection, validation, and save workflows
7. **Visual Patterns**: Day/night toggles (S, M, T, W, T, F, S), weekly patterns
8. **Conditionals**: Visibility and validation rules
9. **Testing Scenarios**: What schedule patterns developers can test

---

## Page 3: z-sharath-test

**Bubble Access**: Navigate to the "z-sharath-test" page in the Bubble IDE
**Note**: "Sharath" may be a team member name - this could be a personal test page

**Document to Create**: `Z_SHARATH_TEST_REQUIREMENTS.md`

**What to Document**:
1. **Page Overview & Purpose**: What functionality is being tested
2. **Page Configuration**: Dimensions, settings, background, fixed-width status
3. **Element Hierarchy**: Complete list of all UI elements
4. **Test Scope**: What features/components are being tested
5. **Workflows**: All workflow triggers and their actions
6. **Data Sources**: What data is being displayed or manipulated
7. **Conditionals**: Any conditional logic
8. **Testing Scenarios**: What use cases this page supports
9. **Special Notes**: Any unique or experimental features

---

## Output Format

For each page, create a comprehensive markdown document following this template:

```markdown
# [PAGE NAME] - COMPREHENSIVE REQUIREMENTS DOCUMENT
**Bubble to Code Migration Specification**
**Page: [page-name]**

---

## 1. PAGE OVERVIEW & PURPOSE

**PAGE NAME:** [name]
**PRIMARY FUNCTION:** [description]
**KEY CAPABILITIES:**
- [capability 1]
- [capability 2]

---

## 2. PAGE CONFIGURATION

**DIMENSIONS:**
- Width: [px]
- Height: [px]
- Fixed-width: [Yes/No]

**PAGE SETTINGS:**
- Native app: [Yes/No]
- Background: [color]
- Opacity: [%]

---

## 3. ELEMENT HIERARCHY

[Complete breakdown of all elements from top to bottom]

---

## 4. WORKFLOWS & EVENT HANDLERS

**TOTAL WORKFLOWS:** [number]

[List each workflow with trigger and actions]

---

## 5. DATA SOURCES & EXPRESSIONS

[All data searches, filters, and dynamic expressions]

---

## 6. CONDITIONALS

[All conditional visibility and styling rules]

---

## 7. TECHNICAL NOTES & MIGRATION RECOMMENDATIONS

[Any special considerations for migration]

---

```

## Access Instructions

**Bubble App URL**: https://bubble.io/page?name=[page-name]&id=splitlease&tab=tabs-1

If you cannot access the Bubble IDE directly:
1. Request screenshots of the page from the user
2. Request the Elements Tree export
3. Request the Workflows tab export
4. Use available context from similar documented pages (z-emails-unit, z-pricing-unit-test, z-search-unit-test, z-unit-payment-records-js)

## Deliverables

Provide 3 complete markdown documents ready to save as:
1. `Z_INPUT_PLUGIN_TEST_2_REQUIREMENTS.md`
2. `Z_SCHEDULE_TEST_REQUIREMENTS.md`
3. `Z_SHARATH_TEST_REQUIREMENTS.md`

Each document should be detailed enough for a developer to implement the page from scratch without seeing the original Bubble page.
