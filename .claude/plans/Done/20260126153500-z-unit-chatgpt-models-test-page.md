# Implementation Plan: Z-Unit ChatGPT Models Test Page

## Overview
Create a new internal test harness page at `/_internal/z-unit-chatgpt-models` that allows manual testing and comparison of multiple OpenAI GPT models (4o-mini, o1-mini, o1) with freeform prompts, plus a GPT-4.1-mini image URL parsing test section. This follows the established Hollow Component Pattern used by existing Z-unit test pages.

## Success Criteria
- [ ] Page accessible at `/_internal/z-unit-chatgpt-models`
- [ ] Four independent test sections with separate inputs, buttons, and response displays
- [ ] Section 1: Freeform 4o-mini test
- [ ] Section 2: Freeform o1-mini test
- [ ] Section 3: Freeform o1 test (with note: "did not work as of 1/13/25")
- [ ] Section 4: GPT-4.1-mini Image Parse with pre-filled URL
- [ ] Independent loading states per section
- [ ] Independent error handling per section (red text styling)
- [ ] Buttons disabled during API calls
- [ ] Fixed 1200px width container with light gray/white background
- [ ] No authentication required
- [ ] API calls through ai-gateway Edge Function with 500 token limit

## Context & References

### Relevant Files
| File | Purpose | Changes Needed |
|------|---------|----------------|
| `app/src/routes.config.js` | Route registry | Add new route entry |
| `app/public/z-unit-chatgpt-models.html` | HTML entry point | Create new file |
| `app/src/z-unit-chatgpt-models.jsx` | React entry point | Create new file |
| `app/src/islands/pages/ZUnitChatgptModelsPage/ZUnitChatgptModelsPage.jsx` | Page component | Create new file |
| `app/src/islands/pages/ZUnitChatgptModelsPage/useZUnitChatgptModelsPageLogic.js` | Logic hook | Create new file |
| `app/src/islands/pages/ZUnitChatgptModelsPage/ZUnitChatgptModelsPage.css` | Page styles | Create new file |
| `app/src/islands/pages/ZUnitChatgptModelsPage/index.js` | Barrel export | Create new file |
| `supabase/functions/ai-gateway/index.ts` | AI gateway function | Reference only (no changes) |

### Related Documentation
- `.claude/Documentation/miniCLAUDE.md` - Codebase patterns and conventions
- `app/src/islands/pages/ZPricingUnitTestPage/` - Reference implementation pattern
- `app/src/islands/pages/ZSearchUnitTestPage/` - Reference implementation pattern

### Existing Patterns to Follow
- **Hollow Component Pattern**: Page component contains NO logic, delegates everything to `useZUnitChatgptModelsPageLogic` hook
- **CSS Class Prefix**: Use `zucm-` prefix (Z-Unit-ChatGPT-Models) for all CSS classes
- **Route Registry Pattern**: Add route to `routes.config.js` with `cloudflareInternal: true`
- **Edge Function Pattern**: Use `supabase.functions.invoke('ai-gateway', { body: { action, payload } })`
- **Error Display Pattern**: Red text styling matching existing error states

## Implementation Steps

### Step 1: Add Route to Registry
**Files:** `app/src/routes.config.js`
**Purpose:** Register the new route so it's available in dev server and Cloudflare Pages
**Details:**
- Add new route entry after the existing z-pricing-unit-test entry (around line 720)
- Use path `/_internal/z-unit-chatgpt-models`
- Set `cloudflareInternal: true` and `internalName: 'z-unit-chatgpt-models-view'`
- Set `protected: false` (no auth required)
- Set `hasDynamicSegment: false`

**Code to add:**
```javascript
// ===== Z-UNIT CHATGPT MODELS (INTERNAL) =====
{
  path: '/_internal/z-unit-chatgpt-models',
  file: 'z-unit-chatgpt-models.html',
  aliases: ['/_internal/z-unit-chatgpt-models.html'],
  protected: false,
  cloudflareInternal: true,
  internalName: 'z-unit-chatgpt-models-view',
  hasDynamicSegment: false
},
```

**Validation:** Run `bun run generate-routes` after this step to regenerate `_redirects` and `_routes.json`

### Step 2: Create HTML Entry Point
**Files:** `app/public/z-unit-chatgpt-models.html`
**Purpose:** HTML shell that loads the React entry point
**Details:**
- Follow exact pattern from `z-pricing-unit-test.html`
- Set title to "Z-Unit ChatGPT Models Test - Split Lease Admin"
- Set meta description to "Internal ChatGPT models testing page"
- Add `noindex, nofollow` robots meta
- Mount React at `#root`

**Full file content:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Z-Unit ChatGPT Models Test - Split Lease Admin</title>
  <meta name="description" content="Internal ChatGPT models testing page">
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/png" href="/assets/images/split-lease-purple-circle.png">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/z-unit-chatgpt-models.jsx"></script>
</body>
</html>
```

**Validation:** File exists and references correct JSX entry point

### Step 3: Create React Entry Point
**Files:** `app/src/z-unit-chatgpt-models.jsx`
**Purpose:** Mount the React page component to the DOM
**Details:**
- Import React and createRoot
- Import the page component from islands/pages
- Create root and render component

**Full file content:**
```jsx
/**
 * Z-Unit ChatGPT Models Test Page Entry Point
 *
 * Internal test page for comparing multiple ChatGPT models.
 * Tests different models with freeform prompts and image parsing.
 *
 * Route: /_internal/z-unit-chatgpt-models
 * Auth: None (internal test page)
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ZUnitChatgptModelsPage from './islands/pages/ZUnitChatgptModelsPage/ZUnitChatgptModelsPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<ZUnitChatgptModelsPage />);
```

**Validation:** File follows exact pattern from z-pricing-unit-test.jsx

### Step 4: Create Page Directory and Index
**Files:** `app/src/islands/pages/ZUnitChatgptModelsPage/index.js`
**Purpose:** Barrel export for the page module
**Details:**
- Export default page component
- Export named logic hook

**Full file content:**
```javascript
export { default } from './ZUnitChatgptModelsPage.jsx';
export { useZUnitChatgptModelsPageLogic } from './useZUnitChatgptModelsPageLogic.js';
```

**Validation:** Exports match component and hook file names

### Step 5: Create Logic Hook
**Files:** `app/src/islands/pages/ZUnitChatgptModelsPage/useZUnitChatgptModelsPageLogic.js`
**Purpose:** All business logic for the page - manages state for 4 independent test sections
**Details:**
- Create state for each of the 4 test sections (prompt, response, loading, error)
- Create handler functions for each section's test execution
- Use `supabase.functions.invoke('ai-gateway', ...)` for API calls
- Set max_tokens to 500 for all requests
- Pre-fill image URL for section 4: `https://m.media-amazon.com/images/I/518brvoz-bL.jpg`
- Model mapping: Section 1 = `gpt-4o-mini`, Section 2 = `o1-mini`, Section 3 = `o1`, Section 4 = `gpt-4.1-mini`

**Key implementation details:**
```javascript
// State structure per section
const [section1, setSection1] = useState({
  prompt: '',
  response: '',
  loading: false,
  error: null
});
// Similar for sections 2, 3, 4

// API call pattern for each section
const handleSection1Test = async () => {
  if (!section1.prompt.trim() || section1.loading) return;

  setSection1(prev => ({ ...prev, loading: true, error: null, response: '' }));

  try {
    const { data, error } = await supabase.functions.invoke('ai-gateway', {
      body: {
        action: 'complete',
        payload: {
          prompt_key: 'echo-test', // Use existing public prompt
          variables: {
            message: section1.prompt
          },
          options: {
            model: 'gpt-4o-mini',
            max_tokens: 500
          }
        }
      }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Request failed');

    setSection1(prev => ({ ...prev, response: data.data.content, loading: false }));
  } catch (err) {
    setSection1(prev => ({ ...prev, error: err.message, loading: false }));
  }
};

// Section 4 uses image parsing - will need specific prompt handling
// Pre-fill URL: https://m.media-amazon.com/images/I/518brvoz-bL.jpg
```

**Full hook structure to implement:**
- State for 4 sections (prompt, response, loading, error each)
- Pre-filled image URL for section 4
- 4 handler functions (one per section)
- Return all state and handlers

**Validation:** Hook returns all necessary state and handlers, follows Hollow Component Pattern

### Step 6: Create Page Component
**Files:** `app/src/islands/pages/ZUnitChatgptModelsPage/ZUnitChatgptModelsPage.jsx`
**Purpose:** UI rendering only - uses hook for all logic
**Details:**
- Import the logic hook
- Import CSS file
- Create LoadingSpinner and ErrorMessage helper components
- Create TestSection component for reuse across all 4 sections
- Main page layout with fixed 1200px width
- 4 test sections in a vertical stack

**Component structure:**
```jsx
// Helper components
function LoadingSpinner() { ... }
function ErrorMessage({ message }) { ... }

// Reusable test section component
function TestSection({
  title,
  subtitle,
  prompt,
  onPromptChange,
  response,
  loading,
  error,
  onTest,
  isImageTest = false,
  imageUrl,
  onImageUrlChange
}) { ... }

// Main page component
export default function ZUnitChatgptModelsPage() {
  const {
    section1, section2, section3, section4,
    handleSection1PromptChange, handleSection2PromptChange,
    handleSection3PromptChange, handleSection4PromptChange,
    handleSection4ImageUrlChange,
    handleSection1Test, handleSection2Test,
    handleSection3Test, handleSection4Test
  } = useZUnitChatgptModelsPageLogic();

  return (
    <div className="zucm-page">
      <header className="zucm-header">
        <h1>Z-Unit ChatGPT Models Test</h1>
        <p>Internal testing page for comparing multiple ChatGPT models</p>
      </header>

      <div className="zucm-container">
        {/* Section 1: Freeform 4o-mini */}
        <TestSection
          title="Freeform 4o-mini"
          subtitle="Functional test"
          prompt={section1.prompt}
          onPromptChange={handleSection1PromptChange}
          response={section1.response}
          loading={section1.loading}
          error={section1.error}
          onTest={handleSection1Test}
        />

        {/* Section 2: Freeform o1-mini */}
        <TestSection
          title="Freeform o1-mini"
          subtitle="Functional test"
          prompt={section2.prompt}
          onPromptChange={handleSection2PromptChange}
          response={section2.response}
          loading={section2.loading}
          error={section2.error}
          onTest={handleSection2Test}
        />

        {/* Section 3: Freeform o1 */}
        <TestSection
          title="Freeform o1"
          subtitle="(did not work as of 1/13/25)"
          prompt={section3.prompt}
          onPromptChange={handleSection3PromptChange}
          response={section3.response}
          loading={section3.loading}
          error={section3.error}
          onTest={handleSection3Test}
        />

        {/* Section 4: GPT-4.1-mini Image Parse */}
        <TestSection
          title="GPT-4.1-mini Image Parse"
          subtitle="Image URL parsing test"
          prompt={section4.prompt}
          onPromptChange={handleSection4PromptChange}
          response={section4.response}
          loading={section4.loading}
          error={section4.error}
          onTest={handleSection4Test}
          isImageTest={true}
          imageUrl={section4.imageUrl}
          onImageUrlChange={handleSection4ImageUrlChange}
        />
      </div>
    </div>
  );
}
```

**Validation:** Component has zero business logic, all delegated to hook

### Step 7: Create CSS Styles
**Files:** `app/src/islands/pages/ZUnitChatgptModelsPage/ZUnitChatgptModelsPage.css`
**Purpose:** Page styling with fixed 1200px width and light gray/white background
**Details:**
- Use `zucm-` prefix for all classes
- Fixed 1200px container width (centered)
- Light gray background for page (#FAFAFA)
- White background for panels
- Error text in red (#991B1B)
- Disabled button state styling
- Loading spinner animation
- Responsive behavior at smaller widths

**Key CSS patterns to follow from ZPricingUnitTestPage.css:**
- `.zucm-page` - min-height 100vh, white background, Inter font
- `.zucm-header` - padding, border-bottom, background #FAFAFA
- `.zucm-container` - max-width 1200px, margin auto, padding
- `.zucm-panel` - white background, border-radius, border
- `.zucm-error` - red text color, red border
- `.zucm-btn:disabled` - opacity reduction, cursor not-allowed
- `.zucm-spinner` - animation for loading state

**Validation:** All classes prefixed with `zucm-`, width is 1200px, error text is red

### Step 8: Run Route Generation
**Files:** None (command execution)
**Purpose:** Generate Cloudflare routing files from updated routes.config.js
**Details:**
- Run `bun run generate-routes` from app/ directory
- This updates `public/_redirects` and `public/_routes.json`

**Command:**
```bash
cd app && bun run generate-routes
```

**Validation:** Command completes without errors, verify _redirects contains new route

## Edge Cases & Error Handling
- **Empty prompt**: Button should be clickable but no API call made (check in handler)
- **API timeout**: Standard Edge Function timeout handling (show error message)
- **API error response**: Display error message in red text
- **Network failure**: Display connection error message
- **Invalid model**: Let API return error, display to user
- **Loading state**: Button disabled, show spinner, prevent double-clicks

## Testing Considerations
- Test each of the 4 sections independently
- Verify loading state prevents multiple API calls
- Verify error messages display in red
- Verify response displays correctly
- Test with various prompt lengths
- Test with empty prompts (should not make API call)
- Verify 500 token limit is applied
- Test the pre-filled image URL in section 4
- Verify page layout at 1200px width
- Verify responsive behavior below 1200px

## Rollback Strategy
- Delete created files:
  - `app/public/z-unit-chatgpt-models.html`
  - `app/src/z-unit-chatgpt-models.jsx`
  - `app/src/islands/pages/ZUnitChatgptModelsPage/` (entire directory)
- Remove route entry from `app/src/routes.config.js`
- Run `bun run generate-routes` to regenerate routing files

## Dependencies & Blockers
- Requires `supabase` client available from `app/src/lib/supabase.js`
- Requires `ai-gateway` Edge Function deployed and working
- Requires `echo-test` prompt registered in ai-gateway (already exists per code review)
- Note: The `o1` model (section 3) may not work - this is expected and noted in the UI

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Model not available | Medium | Low | Error displayed to user, expected for o1 |
| Token limit too restrictive | Low | Low | Can be adjusted in hook if needed |
| Route conflicts | Low | Medium | Checked routes.config.js, no conflicts |
| CSS class conflicts | Low | Low | Using unique `zucm-` prefix |

## Files Summary
| File Path | Action | Purpose |
|-----------|--------|---------|
| `app/src/routes.config.js` | Modify | Add route entry |
| `app/public/z-unit-chatgpt-models.html` | Create | HTML entry point |
| `app/src/z-unit-chatgpt-models.jsx` | Create | React entry point |
| `app/src/islands/pages/ZUnitChatgptModelsPage/index.js` | Create | Barrel export |
| `app/src/islands/pages/ZUnitChatgptModelsPage/ZUnitChatgptModelsPage.jsx` | Create | Page component |
| `app/src/islands/pages/ZUnitChatgptModelsPage/useZUnitChatgptModelsPageLogic.js` | Create | Logic hook |
| `app/src/islands/pages/ZUnitChatgptModelsPage/ZUnitChatgptModelsPage.css` | Create | Page styles |

---

**Plan Version:** 1.0
**Created:** 2026-01-26
**Author:** Implementation Planner
