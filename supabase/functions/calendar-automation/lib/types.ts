/**
 * Calendar Automation - Type Definitions
 * Split Lease - Supabase Edge Functions
 */

// ─────────────────────────────────────────────────────────────
// Request/Response Types
// ─────────────────────────────────────────────────────────────

/**
 * Process Virtual Meeting Payload
 */
export interface ProcessVirtualMeetingPayload {
  readonly virtualMeetingId: string;
}

/**
 * Process Virtual Meeting Response
 */
export interface ProcessVirtualMeetingResponse {
  readonly success: true;
  readonly data: {
    readonly virtualMeetingId: string;
    readonly meetLink: string;
    readonly teamEventId: string;
    readonly guestEventId: string;
    readonly hostEventId: string;
  };
}

/**
 * Health Check Response
 */
export interface HealthResponse {
  readonly success: true;
  readonly data: {
    readonly status: 'healthy';
    readonly timestamp: string;
    readonly service: 'calendar-automation';
  };
}

/**
 * Test Config Response
 */
export interface TestConfigResponse {
  readonly success: true;
  readonly data: {
    readonly googleCredentialsConfigured: boolean;
    readonly calendarIdsConfigured: boolean;
    readonly teamCalendarId: string | null;
    readonly serviceCalendarId: string | null;
  };
}

// ─────────────────────────────────────────────────────────────
// Google Calendar Types
// ─────────────────────────────────────────────────────────────

/**
 * Google Calendar Event
 */
export interface GoogleCalendarEvent {
  readonly id: string;
  readonly summary: string;
  readonly description?: string;
  readonly start: {
    readonly dateTime: string;
    readonly timeZone?: string;
  };
  readonly end: {
    readonly dateTime: string;
    readonly timeZone?: string;
  };
  readonly hangoutLink?: string;
  readonly conferenceData?: {
    readonly createRequest?: {
      readonly requestId: string;
      readonly conferenceSolutionKey: {
        readonly type: string;
      };
    };
    readonly entryPoints?: Array<{
      readonly entryPointType: string;
      readonly uri: string;
    }>;
  };
  readonly location?: string;
  readonly attendees?: Array<{
    readonly email: string;
    readonly responseStatus?: string;
  }>;
}

/**
 * Create Event with Meet Parameters
 */
export interface CreateEventWithMeetParams {
  readonly calendarId: string;
  readonly summary: string;
  readonly description?: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly attendees?: ReadonlyArray<{
    readonly email: string;
    readonly responseStatus?: string;
  }>;
  readonly timeZone?: string;
}

/**
 * Create Event with Existing Meet Parameters
 */
export interface CreateEventWithExistingMeetParams {
  readonly calendarId: string;
  readonly summary: string;
  readonly location: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly attendees?: ReadonlyArray<{
    readonly email: string;
    readonly responseStatus?: string;
  }>;
  readonly timeZone?: string;
  readonly sendUpdates?: 'all' | 'externalOnly' | 'none';
}

// ─────────────────────────────────────────────────────────────
// Database Types
// ─────────────────────────────────────────────────────────────

/**
 * Virtual Meeting Schedule and Link Record
 */
export interface VirtualMeetingRecord {
  readonly id: string;
  readonly 'booked date': string | null;
  readonly 'end of meeting': string | null;
  readonly 'meeting link': string | null;
  readonly confirmedBySplitLease: boolean;
  readonly 'guest email': string;
  readonly 'guest name': string;
  readonly 'host email': string;
  readonly 'host name': string;
  readonly 'invitation sent to guest?': boolean;
  readonly 'invitation sent to host?': boolean;
  readonly 'guest_invite_sent_at': string | null;
  readonly 'host_invite_sent_at': string | null;
  readonly calendar_status: 'pending' | 'meet_link_created' | 'invites_sent' | 'failed';
  readonly calendar_error_message: string | null;
  readonly team_calendar_event_id: string | null;
  readonly guest_calendar_event_id: string | null;
  readonly host_calendar_event_id: string | null;
}

/**
 * Virtual Meeting Update Fields
 */
export type VirtualMeetingUpdate = Partial<{
  readonly 'meeting link': string;
  readonly 'invitation sent to guest?': boolean;
  readonly 'invitation sent to host?': boolean;
  readonly 'guest_invite_sent_at': string;
  readonly 'host_invite_sent_at': string;
  readonly calendar_status: 'pending' | 'meet_link_created' | 'invites_sent' | 'failed';
  readonly calendar_error_message: string | null;
  readonly team_calendar_event_id: string;
  readonly guest_calendar_event_id: string;
  readonly host_calendar_event_id: string;
}>;

// ─────────────────────────────────────────────────────────────
// Error Types
// ─────────────────────────────────────────────────────────────

/**
 * Google Calendar Error
 */
export class GoogleCalendarError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = 'GoogleCalendarError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Configuration Error
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
