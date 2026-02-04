# Routing Simplification Report & Plan

I have analyzed the current routing setup, the documentation, and the known "wonky behaviors" with Cloudflare (specifically 308 redirects and binary downloads). I've identified opportunities to reduce complexity and prevent errors by automating the manual steps defined in `ROUTING_GUIDE.md`.

## Findngs

### 1. Manual Header Configuration is a Failure Point
*   **Current State:** The `ROUTING_GUIDE.md` states: *"Routes using `cloudflareInternal: true` MUST have explicit Content-Type headers in `app/public/_headers`"*. This requires manual editing for every new internal route.
*   **Issue:** If forgotten, Cloudflare serves files as `application/octet-stream` (binary download) instead of HTML.
*   **Solution:** Automate this. The `generate-redirects.js` script already iterates over all routes. It can programmatically generate the `_headers` content for these routes.

### 2. Documentation is Outdated (Vite Inputs)
*   **Current State:** `ROUTING_GUIDE.md` (Step 4) instructs developers to manually add new pages to `vite.config.js` rollup inputs.
*   **Reality:** I verified `app/vite.config.js` (lines 264-267), and it **already uses automation**:
    ```javascript
    input: buildRollupInputs(resolve(__dirname, 'public')),
    ```
*   **Solution:** Remove this manual step from the documentation.

### 3. Route Creation is Repetitive
*   **Current State:** Adding a page requires creating 3 separate files/entries manually.
*   **Solution:** A scaffolding script could automate this, but fixing #1 and #2 yields the highest immediate value.

## Proposed Actions

I propose resolving the user complexity by implementing the following changes:

### A. Automate `_headers` Generation (High Impact)
Modify `app/scripts/generate-redirects.js` to:
1.  Read the existing static headers (e.g., global cache rules) from a template or base file.
2.  Iterate through the `routes` array.
3.  For every route with `cloudflareInternal: true`, automatically append the `Content-Type: text/html` rules.
4.  Write the final `_headers` file to `app/public/_headers`.

**Benefit:** You never have to manually edit `_headers` for routing again.

### B. Cleanup Documentation
Update `ROUTING_GUIDE.md` to:
1.  Remove the "Add to Vite Build Inputs" step.
2.  Update the "Troubleshooting" section to reflect that headers are now auto-generated.

### C. (Optional) Scaffolding Script
Create `scripts/add-route.js` to automate file creation.

## Next Steps
Please authorize me to proceed with **Action A** (Automating Headers) and **Action B** (Docs Cleanup). This effectively "patches" the hole where LLMs or developers forget the crucial Cloudflare workaround.
