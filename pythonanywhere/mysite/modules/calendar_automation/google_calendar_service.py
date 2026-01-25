"""
Google Calendar Service
Handles all Google Calendar API operations for meeting automation
"""

import os
import uuid
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


class GoogleCalendarService:
    """Service class for Google Calendar API operations"""

    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ]

    def __init__(self):
        """Initialize Google Calendar service with credentials"""
        self.credentials = self._get_credentials()
        self.service = build('calendar', 'v3', credentials=self.credentials)
        logger.info("Google Calendar service initialized")

    def _get_credentials(self):
        """Load service account credentials from JSON file"""
        try:
            credentials_path = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON')
            if not credentials_path:
                raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set")

            if not os.path.exists(credentials_path):
                raise FileNotFoundError(f"Credentials file not found: {credentials_path}")

            credentials = service_account.Credentials.from_service_account_file(
                credentials_path,
                scopes=self.SCOPES
            )

            logger.info("Google Calendar credentials loaded successfully")
            return credentials

        except Exception as e:
            logger.error(f"Error loading Google Calendar credentials: {str(e)}")
            raise

    def create_event_with_meet(self, calendar_id, summary, description, start_time,
                               end_time, attendees=None, time_zone='UTC'):
        """
        Create a Google Calendar event with a new Google Meet conference link

        Args:
            calendar_id: The calendar ID to create the event in
            summary: Event title/summary
            description: Event description
            start_time: ISO 8601 datetime string
            end_time: ISO 8601 datetime string
            attendees: List of attendee dicts (optional)
            time_zone: Time zone (default: UTC)

        Returns:
            dict: Created event object with conferenceData
        """
        try:
            event_body = {
                'summary': summary,
                'description': description,
                'start': {
                    'dateTime': start_time,
                    'timeZone': time_zone
                },
                'end': {
                    'dateTime': end_time,
                    'timeZone': time_zone
                },
                'conferenceData': {
                    'createRequest': {
                        'requestId': str(uuid.uuid4()),
                        'conferenceSolutionKey': {
                            'type': 'hangoutsMeet'
                        }
                    }
                },
                'visibility': 'default',
                'guestsCanModify': False,
                'reminders': {
                    'useDefault': True
                }
            }

            if attendees:
                event_body['attendees'] = attendees

            # Method 1: Try with conferenceData (works with Workspace)
            try:
                event = self.service.events().insert(
                    calendarId=calendar_id,
                    body=event_body,
                    conferenceDataVersion=1
                ).execute()
                logger.info(f"Created calendar event with Meet link (conferenceData): {event.get('id')}")
                return event

            except HttpError as meet_error:
                if 'Invalid conference type value' in str(meet_error):
                    logger.info("conferenceData failed, trying alternative methods...")

                    # Method 2: Try using sendNotifications=true (triggers automatic Meet link)
                    try:
                        del event_body['conferenceData']
                        if attendees:
                            event = self.service.events().insert(
                                calendarId=calendar_id,
                                body=event_body,
                                sendNotifications=True,
                                sendUpdates='all'
                            ).execute()

                            # Fetch the event again to get the auto-generated hangoutLink
                            event = self.service.events().get(
                                calendarId=calendar_id,
                                eventId=event['id']
                            ).execute()

                            if 'hangoutLink' in event:
                                logger.info(f"Created event with auto-generated Meet link: {event.get('id')}")
                                return event
                    except Exception as e:
                        logger.warning(f"Method 2 failed: {e}")

                    # Method 3: Create event and manually add hangoutLink
                    try:
                        # Create basic event
                        event = self.service.events().insert(
                            calendarId=calendar_id,
                            body=event_body
                        ).execute()

                        # Update with hangoutLink request
                        event['hangoutLink'] = 'auto'
                        updated_event = self.service.events().update(
                            calendarId=calendar_id,
                            eventId=event['id'],
                            body=event
                        ).execute()

                        if 'hangoutLink' in updated_event:
                            logger.info(f"Created event with hangoutLink: {updated_event.get('id')}")
                            return updated_event
                    except Exception as e:
                        logger.warning(f"Method 3 failed: {e}")

                    # Method 4: Fallback - create without Meet link
                    logger.warning("All Meet link methods failed. Creating event without Meet link.")
                    event = self.service.events().insert(
                        calendarId=calendar_id,
                        body=event_body
                    ).execute()

                    logger.info(f"Created calendar event without Meet link: {event.get('id')}")
                    event['placeholder_meet_link'] = f"https://meet.google.com/new"
                    return event
                else:
                    raise

        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            raise
        except Exception as e:
            logger.error(f"Error creating calendar event with Meet: {str(e)}")
            raise

    def create_event_with_existing_meet(self, calendar_id, summary, location,
                                       start_time, end_time, attendees=None,
                                       time_zone='UTC', send_updates='none'):
        """
        Create a Google Calendar event using an existing Meet link

        Args:
            calendar_id: The calendar ID to create the event in
            summary: Event title/summary
            location: Meeting link URL
            start_time: ISO 8601 datetime string
            end_time: ISO 8601 datetime string
            attendees: List of attendee dicts (optional)
            time_zone: Time zone (default: UTC)
            send_updates: Send email notifications ('all', 'externalOnly', 'none')
                         Note: Service accounts should use 'none' to avoid 403 errors

        Returns:
            dict: Created event object
        """
        try:
            event_body = {
                'summary': summary,
                'location': location,
                'start': {
                    'dateTime': start_time,
                    'timeZone': time_zone
                },
                'end': {
                    'dateTime': end_time,
                    'timeZone': time_zone
                },
                'visibility': 'default',
                'guestsCanModify': False,
                'reminders': {
                    'useDefault': True
                }
            }

            if attendees:
                event_body['attendees'] = attendees

            # Create event without sending notifications (service account limitation)
            # Service accounts cannot send invites without Domain-Wide Delegation
            event = self.service.events().insert(
                calendarId=calendar_id,
                body=event_body,
                sendUpdates=send_updates
            ).execute()

            logger.info(f"Created calendar event with existing Meet link: {event.get('id')}")
            return event

        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            raise
        except Exception as e:
            logger.error(f"Error creating calendar event with existing Meet: {str(e)}")
            raise

    def extract_meet_link(self, event):
        """
        Extract Google Meet link from event object

        Args:
            event: Google Calendar event object

        Returns:
            str: Google Meet URL or placeholder if not found
        """
        try:
            # Method 1: Check for Meet link in conferenceData (Workspace)
            if 'conferenceData' in event and 'entryPoints' in event['conferenceData']:
                for entry_point in event['conferenceData']['entryPoints']:
                    if entry_point.get('entryPointType') == 'video':
                        logger.info("Found Meet link in conferenceData")
                        return entry_point.get('uri')

            # Method 2: Check for hangoutLink (free Gmail)
            if 'hangoutLink' in event:
                logger.info("Found Meet link in hangoutLink")
                return event['hangoutLink']

            # Method 3: Check for placeholder link
            if 'placeholder_meet_link' in event:
                logger.info("Using placeholder Meet link")
                return event['placeholder_meet_link']

            # If no link at all, return new meeting link
            logger.warning("No Google Meet link found, returning meet.google.com/new")
            return "https://meet.google.com/new"

        except Exception as e:
            logger.error(f"Error extracting Meet link: {str(e)}")
            return "https://meet.google.com/new"

    def get_event(self, calendar_id, event_id):
        """
        Retrieve a calendar event by ID

        Args:
            calendar_id: The calendar ID
            event_id: The event ID

        Returns:
            dict: Event object or None if not found
        """
        try:
            event = self.service.events().get(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()

            logger.info(f"Retrieved event: {event_id}")
            return event

        except HttpError as error:
            if error.resp.status == 404:
                logger.warning(f"Event not found: {event_id}")
                return None
            logger.error(f"Google Calendar API error: {error}")
            raise
        except Exception as e:
            logger.error(f"Error retrieving event: {str(e)}")
            raise

    def delete_event(self, calendar_id, event_id, send_updates='all'):
        """
        Delete a calendar event

        Args:
            calendar_id: The calendar ID
            event_id: The event ID
            send_updates: Send cancellation notifications ('all', 'externalOnly', 'none')

        Returns:
            bool: True if successful
        """
        try:
            self.service.events().delete(
                calendarId=calendar_id,
                eventId=event_id,
                sendUpdates=send_updates
            ).execute()

            logger.info(f"Deleted event: {event_id}")
            return True

        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return False
        except Exception as e:
            logger.error(f"Error deleting event: {str(e)}")
            return False

    def update_event(self, calendar_id, event_id, updates, send_updates='all'):
        """
        Update an existing calendar event

        Args:
            calendar_id: The calendar ID
            event_id: The event ID
            updates: Dictionary of fields to update
            send_updates: Send update notifications ('all', 'externalOnly', 'none')

        Returns:
            dict: Updated event object or None if failed
        """
        try:
            # First, get the existing event
            event = self.get_event(calendar_id, event_id)
            if not event:
                return None

            # Apply updates
            event.update(updates)

            # Update the event
            updated_event = self.service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=event,
                sendUpdates=send_updates
            ).execute()

            logger.info(f"Updated event: {event_id}")
            return updated_event

        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return None
        except Exception as e:
            logger.error(f"Error updating event: {str(e)}")
            return None
