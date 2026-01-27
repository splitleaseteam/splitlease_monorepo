\# z-unit-chatgpt-models \- COMPREHENSIVE REQUIREMENTS DOCUMENT  
\*\*Bubble to Code Migration Specification\*\*  
\*\*Page: z-unit-chatgpt-models\*\*

\---

\#\# 1\. PAGE OVERVIEW & PURPOSE

\*\*PAGE NAME:\*\* z-unit-chatgpt-models  
\*\*PRIMARY FUNCTION:\*\* Internal test harness to manually exercise and compare several GPT-based models (o1-mini, 4o-mini, o1, and gpt-4.1-mini image parsing) for free-form prompts and an image URL.

\*\*KEY CAPABILITIES:\*\*  
\- Accepts arbitrary freeform text prompts for different GPT models via multiple textarea inputs  
\- Displays structured "Response" and "Error" fields for each model to validate responses and error handling  
\- Accepts an image URL to test gpt-4.1-mini image parsing and show a generated template plus error body  
\- Tests four different AI models: o1-mini, 4o-mini, o1 (marked as non-functional as of 1/13/25), and gpt-4.1-mini for image parsing

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

\#\#\# Layers Structure:

1\. \*\*G: free form text uploader\*\* (4o-mini)  
   \- Heading: "Freeform 4o"  
   \- Textarea ID: cqqVy7  
   \- Button: "Test 4o-mini" (ID: cqqVz7)  
   \- Response and Error text elements

2\. \*\*G: free form text uploader\*\* (o1-mini)  
   \- Heading: "Freeform 01-mini"  
   \- Textarea ID: cqqSC7  
   \- Button: "Test o1-mini" (ID: cqqSD7)  
   \- Response and Error text elements

3\. \*\*G: free form text uploader\*\* (o1)  
   \- Heading: "Freeform o1 (did not work as of 1/13/25)"  
   \- Textarea ID: cqqWW7  
   \- Button: "Test o1" (ID: cqqWX7)  
   \- Response and Error text elements

4\. \*\*G: 4.1-mini Image parse\*\*  
   \- Heading: "GPT 4.1 \- Image Parse"  
   \- Input ID: crtAF  
   \- Pre-filled URL: https://m.media-amazon.com/images/I/518brvoz-bL.jpg  
   \- Button: "Test gpt-4.1-mini Image Parse" (ID: crtAG)  
   \- Response and Error text elements

\---

\#\# 4\. WORKFLOWS & EVENT HANDLERS

\*\*TOTAL WORKFLOWS:\*\* 4

\#\#\# Workflow 1: B: 4o mini test is clicked  
\- Trigger: Button "Test 4o-mini" clicked  
\- Actions:  
  \- Step 1: API Call "call o1-mini, to create suggestions"  
    \- (body) Prompt: Arbitrary text/formatted as JSON-safe  
    \- (body) Token: 500  
    \- (body) Model: gpt-4o(now gpt 4.1)'s Model Name  
  \- Step 2: "give errors" \- Error handling

\#\#\# Workflow 2-4: Similar patterns for o1 full test and o1 mini test  
\- Each workflow calls its respective GPT model  
\- Displays response or error based on API result

\---

\#\# 5\. DATA SOURCES & EXPRESSIONS

\#\#\# Static / Input Data:  
\- Freeform textarea values for o1-mini, 4o-mini, and o1  
\- Single-line input for image URL (gpt-4.1-mini)  
\- Default image URL pre-populated

\#\#\# Dynamic Text Expressions:  
\- Response elements bound to API call results  
\- Error elements bound to error outputs  
\- Model references by name

\#\#\# API Integration:  
\- ChatGPT/OpenAI API for all models  
\- Fixed token limit: 500  
\- Model-specific endpoints

\#\#\# Persistent Data:  
\- No database searches  
\- All data ephemeral (session only)

\---

\#\# 6\. CONDITIONALS

\#\#\# Recommended Implementation:  
1\. Response/Error visibility based on API completion  
2\. Error text styling (red for errors)  
3\. Button disabled states during API calls  
4\. Loading indicators  
5\. Warning for o1 model (non-functional)

\---

\#\# 7\. TECHNICAL NOTES & MIGRATION RECOMMENDATIONS

\#\#\# API Configuration:  
\- Centralize GPT model configuration  
\- Implement abstraction layer for API calls  
\- Use server-side config for credentials

\#\#\# Model Management:  
\- Preserve o1 "did not work" note as feature flag  
\- Implement model status checking

\#\#\# State Management:  
\- Separate loading states per model  
\- Prevent concurrent calls to same model  
\- Clear previous responses on new test

\#\#\# Security & Logging:  
\- Log prompts/responses securely with PII redaction  
\- Internal-only access  
\- Request/response logging with timestamps  
\- Rate limiting for API quota management

\#\#\# Error Handling:  
\- Network failures  
\- API timeout  
\- Invalid responses  
\- Rate limits  
\- Authentication failures

\#\#\# Testing Scenarios:  
1\. Basic: Enter prompt, click test, verify response  
2\. Image parsing: Valid/invalid URLs  
3\. Concurrent operations: Multiple simultaneous tests  
4\. Error conditions: Invalid credentials, timeouts

\#\#\# Performance:  
\- Token limit: 500 per request  
\- Variable response times by model  
\- Consider adding: response time display, token counter, cost estimation

\#\#\# Migration Checklist:  
\- \[ \] Extract API endpoints and auth  
\- \[ \] Document request/response formats  
\- \[ \] Identify Bubble plugins  
\- \[ \] Map element IDs  
\- \[ \] Implement error handling  
\- \[ \] Create unit tests  
\- \[ \] Confirm access controls  
\- \[ \] Set up monitoring

\---

\#\# 8\. ADDITIONAL OBSERVATIONS

\#\#\# Design Patterns:  
\- Consistent structure across all test groups  
\- Clear visual hierarchy  
\- Descriptive labeling

\#\#\# User Experience:  
\- Simple interface  
\- Immediate feedback  
\- Parallel testing support

\#\#\# Known Limitations:  
\- o1 model non-functional (1/13/25)  
\- No input validation  
\- No response history

\#\#\# Future Enhancements:  
\- Response time metrics  
\- Test history/comparison  
\- Save test scenarios  
\- Token usage tracking  
\- Batch testing  
\- Quality scoring

\---

\*\*Document Version:\*\* 1.0  
\*\*Last Updated:\*\* January 26, 2026  
\*\*Status:\*\* Ready for Migration  
