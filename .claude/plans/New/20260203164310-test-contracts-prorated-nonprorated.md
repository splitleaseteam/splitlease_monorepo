# Plan: Update _test-contracts Credit Card Auth Cases

## Goal
Add prorated and non-prorated credit card authorization test cases on the `_test-contracts` page while keeping calls routed through the `lease-documents` edge function.

## Steps
1. Review the current `_test-contracts` page UI and logic to understand how credit card auth tests are triggered and where the request payload is built.
2. Define two explicit test cases (prorated vs non-prorated) in the page logic, ensuring each builds the correct payload flags/amounts while sharing the same request handler.
3. Update the UI controls to let users run each test case distinctly (labels, buttons, or selectors) without duplicating request logic.
4. Confirm the request handler still targets the `lease-documents` edge function action and does not bypass the proxy.
5. Run the page locally to verify both test cases submit and the edge function receives the expected payload shape.

## Important File References
- `app/public/test-contracts.html`
- `app/src/TestContractsPage.jsx`
- `app/src/routes.config.js`
