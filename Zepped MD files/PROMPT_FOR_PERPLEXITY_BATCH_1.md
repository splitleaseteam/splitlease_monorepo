# Perplexity Requirements Gathering Prompt - Batch 1

## Task: Create Requirements Documents for Missing Bubble Pages (Part 1 of 2)

You are creating comprehensive requirements documents for 3 internal test pages in the Split Lease Bubble application that currently lack documentation.

### Context
Split Lease is migrating from Bubble.io to a custom code implementation. Some internal test/utility pages (prefixed with "z-") need requirements documents created from the Bubble IDE.

### Your Mission
Access the Split Lease Bubble IDE and create detailed requirements documents for the following 3 pages:

---

## Page 1: z-unit-chatgpt-models

**Bubble Access**: Navigate to the "z-unit-chatgpt-models" page in the Bubble IDE

**Document to Create**: `Z_UNIT_CHATGPT_MODELS_REQUIREMENTS.md`

**What to Document**:
1. **Page Overview & Purpose**: What this page does, why it exists
2. **Page Configuration**: Dimensions, settings, background, fixed-width status
3. **Element Hierarchy**: Complete list of all UI elements (buttons, inputs, text, repeating groups, etc.)
4. **Workflows**: All workflow triggers and their actions
5. **Data Sources**: What data types are displayed, searches/filters used
6. **Conditionals**: Any conditional visibility or styling rules
7. **API/Plugin Usage**: Any ChatGPT/GPT model integrations
8. **Testing Scenarios**: What use cases this page supports

---

## Page 2: z-alerts-test

**Bubble Access**: Navigate to the "z-alerts-test" page in the Bubble IDE

**Document to Create**: `Z_ALERTS_TEST_REQUIREMENTS.md`

**What to Document**:
1. **Page Overview & Purpose**: Alert/notification testing functionality
2. **Page Configuration**: Dimensions, settings, background, fixed-width status
3. **Element Hierarchy**: Complete list of all UI elements
4. **Workflows**: All workflow triggers (especially alert/toast notification triggers)
5. **Alert Types**: What types of alerts can be tested (success, error, warning, info)
6. **Custom Events**: Any "alerts general custom event" or similar
7. **Conditionals**: Visibility and styling rules
8. **Testing Scenarios**: How developers test different alert scenarios

---

## Page 3: z-icons-test-ide

**Bubble Access**: Navigate to the "z-icons-test-ide" page in the Bubble IDE

**Document to Create**: `Z_ICONS_TEST_IDE_REQUIREMENTS.md`

**What to Document**:
1. **Page Overview & Purpose**: Icon library testing/preview functionality
2. **Page Configuration**: Dimensions, settings, background, fixed-width status
3. **Element Hierarchy**: Complete list of all UI elements (icon displays, selectors, etc.)
4. **Icon Sources**: Where icons come from (Font Awesome, custom SVG, icon plugin, etc.)
5. **Display Patterns**: Repeating groups, grids, or lists showing icons
6. **Workflows**: Any search, filter, or selection workflows
7. **Conditionals**: Visibility and styling rules
8. **Testing Scenarios**: How developers browse and test icons

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
1. `Z_UNIT_CHATGPT_MODELS_REQUIREMENTS.md`
2. `Z_ALERTS_TEST_REQUIREMENTS.md`
3. `Z_ICONS_TEST_IDE_REQUIREMENTS.md`

Each document should be detailed enough for a developer to implement the page from scratch without seeing the original Bubble page.
