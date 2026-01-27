"""
Google Calendar OAuth Service
Uses OAuth credentials instead of service account to enable Meet link creation on free Gmail
"""

import os
import uuid
import logging
import pickle
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


class GoogleCalendarOAuthService:
    """Service class using OAuth for Google Calendar (works with free Gmail)"""

    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ]

    def __init__(self):
        """Initialize Google Calendar service with OAuth credentials"""
        self.credentials = self._get_oauth_credentials()
        self.service = build('calendar', 'v3', credentials=self.credentials)
        logger.info("Google Calendar OAuth service initialized")

    def _get_oauth_credentials(self):
        """Load OAuth credentials from token file or initiate OAuth flow"""
        creds = None
        token_path = os.getenv('GOOGLE_OAUTH_TOKEN_PATH', 'token.pickle')

        # Try to load existing token
        if os.path.exists(token_path):
            with open(token_path, 'rb') as token:
                creds = pickle.load(token)

        # If no valid credentials, refresh or get new ones
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
                logger.info("Refreshed OAuth credentials")
            else:
                # This requires manual OAuth flow - use credentials file
                credentials_path = os.getenv('GOOGLE_OAUTH_CREDENTIALS_JSON')
                if not credentials_path or not os.path.exists(credentials_path):
                    raise ValueError("OAuth credentials file not found")

                flow = InstalledAppFlow.from_client_secrets_file(
                    credentials_path, self.SCOPES)
                creds = flow.run_local_server(port=0)
                logger.info("Obtained new OAuth credentials")

            # Save the credentials for the next run
            with open(token_path, 'wb') as token:
                pickle.dump(creds, token)

        return creds

    def create_event_with_meet(self, calendar_id, summary, description, start_time,
                               end_time, attendees=None, time_zone='UTC'):
        """
        Create a Google Calendar event with Google Meet link using OAuth

        This works with free Gmail accounts because we're acting as the user,
        not as a service account.
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

            # Create event with OAuth (works on free Gmail!)
            event = self.service.events().insert(
                calendarId=calendar_id,
                body=event_body,
                conferenceDataVersion=1
            ).execute()

            logger.info(f"Created calendar event with Meet link (OAuth): {event.get('id')}")
            return event

        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            raise
        except Exception as e:
            logger.error(f"Error creating calendar event: {str(e)}")
            raise

    def create_event_with_existing_meet(self, calendar_id, summary, location,
                                       start_time, end_time, attendees=None,
                                       time_zone='UTC', send_updates='all'):
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

            # Create event with OAuth - can send invitations!
            event = self.service.events().insert(
                calendarId=calendar_id,
                body=event_body,
                sendUpdates=send_updates
            ).execute()

            logger.info(f"Created calendar event with existing Meet link (OAuth): {event.get('id')}")
            return event

        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            raise
        except Exception as e:
            logger.error(f"Error creating calendar event with existing Meet: {str(e)}")
            raise

    def extract_meet_link(self, event):
        """Extract Google Meet link from event"""
        try:
            if 'conferenceData' in event and 'entryPoints' in event['conferenceData']:
                for entry_point in event['conferenceData']['entryPoints']:
                    if entry_point.get('entryPointType') == 'video':
                        return entry_point.get('uri')

            if 'hangoutLink' in event:
                return event['hangoutLink']

            logger.warning("No Google Meet link found in event")
            return None

        except Exception as e:
            logger.error(f"Error extracting Meet link: {str(e)}")
            return None
