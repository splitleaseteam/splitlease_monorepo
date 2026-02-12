/**
 * Type definitions for Virtual Meeting Edge Function
 * Split Lease - Supabase Edge Functions
 */

export interface CreateVirtualMeetingInput {
  proposalId: string;           // Required: FK to proposal.id
  timesSelected: string[];      // Required: Array of ISO 8601 datetime strings (exactly 3)
  requestedById: string;        // Required: FK to user.id (current user)
  timezoneString?: string;      // Optional: default 'America/New_York'
  isAlternativeTimes?: boolean; // Optional: true if suggesting alternative times
}

export interface CreateVirtualMeetingResponse {
  virtualMeetingId: string;
  proposalId: string;
  requestedById: string;
  createdAt: string;
}

export interface ProposalData {
  id: string;
  Guest: string;
  Listing: string;
  'Host User': string;
}

export interface ListingData {
  id: string;
  'Host User': string;
  'Created By': string;
}

export interface UserData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  notification_preference_setting?: string;
}

export interface HostAccountData {
  id: string;
  User: string;
}

export interface VirtualMeetingRecord {
  id: string;
  'Created By': string;
  'Created Date': string;
  'Modified Date': string;
  host: string;
  guest: string;
  proposal: string;
  'requested by': string;
  'meeting duration': number;
  'suggested dates and times': string[];
  'booked date': string | null;
  confirmedBySplitLease: boolean;
  'meeting declined': boolean;
  'meeting link': string | null;
  'guest email': string | null;
  'guest name': string | null;
  'host email': string | null;
  'host name': string | null;
  'invitation sent to guest?': boolean;
  'invitation sent to host?': boolean;
  'end of meeting': string | null;
  'Listing (for Co-Host feature)': string | null;
  pending: boolean;
}

export interface UserContext {
  id: string;
  email: string;
}

export interface DeleteVirtualMeetingInput {
  virtualMeetingId: string;  // Required: _id of the virtual meeting to delete
  proposalId: string;        // Required: _id of the associated proposal
}

export interface DeleteVirtualMeetingResponse {
  deleted: boolean;
  virtualMeetingId: string;
  proposalId: string;
  deletedAt: string;
}

// Accept Virtual Meeting
export interface AcceptVirtualMeetingInput {
  proposalId: string;           // Required: FK to proposal.id
  bookedDate: string;           // Required: ISO 8601 datetime (selected time slot)
  userAcceptingId: string;      // Required: FK to user.id (user accepting)
}

export interface AcceptVirtualMeetingResponse {
  success: boolean;
  virtualMeetingId: string;
  proposalId: string;
  bookedDate: string;
  updatedAt: string;
}

// Decline Virtual Meeting
export interface DeclineVirtualMeetingInput {
  proposalId: string;           // Required: FK to proposal.id
}

export interface DeclineVirtualMeetingResponse {
  success: boolean;
  proposalId: string;
  declinedAt: string;
}

// Send Calendar Invite
export interface SendCalendarInviteInput {
  proposalId: string;           // Required: FK to proposal.id
  userId: string;               // Required: FK to user.id (recipient)
}

export interface SendCalendarInviteResponse {
  success: boolean;
  proposalId: string;
  userId: string;
  triggeredAt: string;
}

// Notify Participants
export interface NotifyParticipantsInput {
  hostId: string;               // Required: FK to user.id
  guestId: string;              // Required: FK to user.id
  virtualMeetingId: string;     // Required: FK to virtualmeetingschedulesandlinks.id
}

export interface NotifyParticipantsResponse {
  success: boolean;
  virtualMeetingId: string;
  notifiedAt: string;
}
