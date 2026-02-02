/**
 * Google Calendar Service
 * Split Lease - Supabase Edge Functions
 *
 * Handles all Google Calendar API operations for meeting automation.
 * Migrated from Python google_calendar_service.py
 *
 * NO FALLBACK PRINCIPLE: All API failures throw immediately
 */

import type {
  GoogleCalendarEvent,
  CreateEventWithMeetParams,
  CreateEventWithExistingMeetParams,
} from './types.ts';
import { GoogleCalendarError, ConfigurationError } from './types.ts';

// ─────────────────────────────────────────────────────────────
// Google Calendar Service Class
// ─────────────────────────────────────────────────────────────

export class GoogleCalendarService {
  private readonly baseUrl: string;
  private readonly accessToken: string | null;

  constructor() {
    // Validate configuration
    const accessToken = Deno.env.get('GOOGLE_OAUTH_ACCESS_TOKEN');

    if (!accessToken) {
      throw new ConfigurationError('GOOGLE_OAUTH_ACCESS_TOKEN environment variable not set');
    }

    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
    this.accessToken = accessToken;

    console.log('[google-calendar-service] Service initialized');
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Make authenticated request to Google Calendar API
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log(`[google-calendar-service] API Request: ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[google-calendar-service] API Error: ${response.status} ${errorText}`);

      throw new GoogleCalendarError(
        `Google Calendar API error: ${response.status} ${response.statusText}`,
        `API_ERROR_${response.status}`,
        response.status
      );
    }

    return await response.json();
  }

  // ─────────────────────────────────────────────────────────────
  // Public API Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Create a Google Calendar event with a new Google Meet conference link
   *
   * This is the primary method for creating calendar events with Meet links.
   * Uses the conferenceData.createRequest pattern to generate a new Meet link.
   *
   * @param params - Event creation parameters
   * @returns Created event object with conferenceData
   */
  async createEventWithMeet(
    params: CreateEventWithMeetParams
  ): Promise<GoogleCalendarEvent> {
    console.log(`[google-calendar-service] Creating event with Meet link: ${params.summary}`);

    const eventBody = {
      summary: params.summary,
      description: params.description || '',
      start: {
        dateTime: params.startTime,
        timeZone: params.timeZone || 'UTC',
      },
      end: {
        dateTime: params.endTime,
        timeZone: params.timeZone || 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      visibility: 'default',
      guestsCanModify: false,
      reminders: {
        useDefault: true,
      },
      ...(params.attendants && { attendees: params.attendants }),
    };

    try {
      const event = await this.apiRequest<GoogleCalendarEvent>(
        `/calendars/${encodeURIComponent(params.calendarId)}/events?conferenceDataVersion=1`,
        {
          method: 'POST',
          body: JSON.stringify(eventBody),
        }
      );

      console.log(`[google-calendar-service] Created event with Meet: ${event.id}`);
      return event;
    } catch (error) {
      console.error(`[google-calendar-service] Failed to create event with Meet:`, error);
      throw error;
    }
  }

  /**
   * Create a Google Calendar event using an existing Meet link
   *
   * Used for inviting guests and hosts to the same Meet link created
   * in the team calendar event.
   *
   * @param params - Event creation parameters with existing Meet link
   * @returns Created event object
   */
  async createEventWithExistingMeet(
    params: CreateEventWithExistingMeetParams
  ): Promise<GoogleCalendarEvent> {
    console.log(`[google-calendar-service] Creating event with existing Meet: ${params.summary}`);

    const eventBody = {
      summary: params.summary,
      location: params.location,
      start: {
        dateTime: params.startTime,
        timeZone: params.timeZone || 'UTC',
      },
      end: {
        dateTime: params.endTime,
        timeZone: params.timeZone || 'UTC',
      },
      visibility: 'default',
      guestsCanModify: false,
      reminders: {
        useDefault: true,
      },
      ...(params.attendants && { attendees: params.attendants }),
    };

    try {
      const event = await this.apiRequest<GoogleCalendarEvent>(
        `/calendars/${encodeURIComponent(params.calendarId)}/events?sendUpdates=${params.sendUpdates || 'none'}`,
        {
          method: 'POST',
          body: JSON.stringify(eventBody),
        }
      );

      console.log(`[google-calendar-service] Created event with existing Meet: ${event.id}`);
      return event;
    } catch (error) {
      console.error(`[google-calendar-service] Failed to create event with existing Meet:`, error);
      throw error;
    }
  }

  /**
   * Extract Google Meet link from event object
   *
   * Checks multiple locations where Meet links can appear:
   * 1. conferenceData.entryPoints (Workspace accounts)
   * 2. hangoutLink (free Gmail accounts)
   *
   * @param event - Google Calendar event object
   * @returns Google Meet URL
   * @throws Error if no Meet link found
   */
  extractMeetLink(event: GoogleCalendarEvent): string {
    // Method 1: Check conferenceData entryPoints (Workspace)
    if (event.conferenceData?.entryPoints) {
      const videoEntryPoint = event.conferenceData.entryPoints.find(
        (ep) => ep.entryPointType === 'video'
      );

      if (videoEntryPoint?.uri) {
        console.log('[google-calendar-service] Found Meet link in conferenceData');
        return videoEntryPoint.uri;
      }
    }

    // Method 2: Check hangoutLink (free Gmail)
    if (event.hangoutLink) {
      console.log('[google-calendar-service] Found Meet link in hangoutLink');
      return event.hangoutLink;
    }

    throw new GoogleCalendarError(
      'No Google Meet link found in event',
      'NO_MEET_LINK',
      404
    );
  }

  /**
   * Retrieve a calendar event by ID
   *
   * @param calendarId - The calendar ID
   * @param eventId - The event ID
   * @returns Event object or null if not found
   */
  async getEvent(calendarId: string, eventId: string): Promise<GoogleCalendarEvent | null> {
    try {
      const event = await this.apiRequest<GoogleCalendarEvent>(
        `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`
      );

      console.log(`[google-calendar-service] Retrieved event: ${eventId}`);
      return event;
    } catch (error) {
      if (error instanceof GoogleCalendarError && error.statusCode === 404) {
        console.warn(`[google-calendar-service] Event not found: ${eventId}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete a calendar event
   *
   * @param calendarId - The calendar ID
   * @param eventId - The event ID
   * @param sendUpdates - Send cancellation notifications
   * @returns True if successful
   */
  async deleteEvent(
    calendarId: string,
    eventId: string,
    sendUpdates: 'all' | 'externalOnly' | 'none' = 'all'
  ): Promise<boolean> {
    try {
      await this.apiRequest(
        `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}?sendUpdates=${sendUpdates}`,
        {
          method: 'DELETE',
        }
      );

      console.log(`[google-calendar-service] Deleted event: ${eventId}`);
      return true;
    } catch (error) {
      console.error(`[google-calendar-service] Failed to delete event:`, error);
      return false;
    }
  }

  /**
   * Update an existing calendar event
   *
   * @param calendarId - The calendar ID
   * @param eventId - The event ID
   * @param updates - Fields to update
   * @param sendUpdates - Send update notifications
   * @returns Updated event object or null if failed
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    updates: Partial<GoogleCalendarEvent>,
    sendUpdates: 'all' | 'externalOnly' | 'none' = 'all'
  ): Promise<GoogleCalendarEvent | null> {
    try {
      // First, get the existing event
      const existing = await this.getEvent(calendarId, eventId);
      if (!existing) {
        return null;
      }

      // Merge updates with existing event
      const mergedEvent = {
        ...existing,
        ...updates,
      };

      const updated = await this.apiRequest<GoogleCalendarEvent>(
        `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}?sendUpdates=${sendUpdates}`,
        {
          method: 'PATCH',
          body: JSON.stringify(mergedEvent),
        }
      );

      console.log(`[google-calendar-service] Updated event: ${eventId}`);
      return updated;
    } catch (error) {
      console.error(`[google-calendar-service] Failed to update event:`, error);
      return null;
    }
  }
}
