# VirtualMeetingManager - LLM Reference

**SCOPE**: Virtual meeting management system with 4-view modal workflow
**PARENT**: app/src/islands/shared/

---

## FILES

12 files: VirtualMeetingManager.jsx, RespondToVMRequest.jsx, BookVirtualMeeting.jsx, CancelVirtualMeetings.jsx, DetailsOfProposalAndVM.jsx, BookTimeSlot.jsx, virtualMeetingService.js, dateUtils.js, index.js, VirtualMeetingManager.css, BookTimeSlot.css, CLAUDE.md

---

## VIEW_STATE_MACHINE

```
'' (hidden/unmounted)
    | (initialView prop)
+---------------------------------------------+
| 'respond' --(suggest alt)--> 'request'      |
|     |                              |         |
|     | (confirm time)               | (submit)|
|     v                              v         |
| 'details'                       onClose()    |
|     |                                        |
|     | (close)                                |
|     v                                        |
| onClose()                                    |
|                                              |
| 'cancel' ----(confirm/cancel)---> onClose()  |
+---------------------------------------------+
```

[STATE_CONTROL]: Parent controls visibility via initialView prop (empty string hides modal)
[VIEW_NAVIGATION]: Internal state transitions handled by VirtualMeetingManager component

---

## CRITICAL_RULES

[RULE_1]: currentUser MUST have _id (or id) and typeUserSignup (or type_user_signup) fields
[RULE_2]: proposal MUST have _id (or id) for API calls
[RULE_3]: virtualMeeting field can be virtualMeeting, 'virtual meeting', or virtual_meeting (handle all variants)
[RULE_4]: ALL times displayed in EST timezone with (EST) suffix
[RULE_5]: Exactly 3 time slots REQUIRED for request/suggest views
[RULE_6]: Parent controls visibility via initialView prop (empty string '' hides component entirely)
[RULE_7]: Handle field name variations throughout (camelCase, snake_case, 'space case', Pascal Case)
[RULE_8]: All API calls go through Supabase Edge Functions
[RULE_9]: Component returns null if initialView is empty string (unmounted state)
[RULE_10]: Success/error messages auto-dismiss after 5 seconds

---

## FIELD_NAME_VARIANTS

[VIRTUAL_MEETING]: virtualMeeting | 'virtual meeting' | virtual_meeting
[BOOKED_DATE]: bookedDate | 'booked date' | booked_date
[MEETING_LINK]: googleMeetLink | 'meeting link' | meetingLink
[USER_TYPE]: typeUserSignup | type_user_signup
[GUEST_NAME]: guest.firstName | guest.name | guest.['firstName']
[HOST_NAME]: host.name | host.firstName
[LISTING_NAME]: listing.name | _listing.name
[PROFILE_PHOTO]: guest.profilePhoto | guest.['profile photo']
[NIGHTS]: proposal.nights | proposal.Nights
[RESERVATION_SPAN]: proposal.reservationSpan | proposal['reservation span'] | proposal.reservationspan

---

## TIMEZONE_HANDLING

[TIMEZONE]: America/New_York (EST)
[DISPLAY_FORMAT]: All times shown with (EST) suffix
[CONVERSION]: toEST() converts UTC to EST, toUTC() converts EST to UTC
[API_FORMAT]: ISO string format for all API requests (toISOString())
[CALENDAR_GENERATION]: generateTimeSlots() creates slots in local time, assumes EST context
[GOOGLE_CALENDAR]: URL includes ctz=America/New_York parameter

---

## EDGE_FUNCTION_ACTIONS

| Action | Description |
|--------|-------------|
| accept | Accept meeting request and set booked date. Params: proposal, booked_date_sel, user_accepting |
| create | Create new meeting request with 3 proposed time slots. Params: proposal, times_selected, requested_by, is_alternative_times, timezone_string |
| decline | Decline meeting request. Params: proposal |
| cancel | Cancel existing scheduled meeting. Params: meeting_id, proposal |

All actions are called through the `virtual-meeting` Supabase Edge Function with action-based routing. The service layer (virtualMeetingService.js) returns standardized `{status, data?, message?}` responses and includes `retryApiCall()` with exponential backoff.

---

**VERSION**: 2.0
