"""
Calendar Automation Routes
Webhook endpoints for virtual meeting calendar invite automation
"""

from flask import Blueprint, request, jsonify
import os
import threading
import logging
from datetime import datetime
from dateutil import parser as date_parser
from modules.logging.error_logger import log_error
from modules.logging.success_logger import log_success
from .google_calendar_service import GoogleCalendarService
from .bubble_service import BubbleService

# Initialize blueprint
calendar_automation = Blueprint('calendar_automation', __name__)

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize services (will be created on first request)
calendar_service = None
bubble_service = None


def get_calendar_service():
    """Lazy initialization of Google Calendar service"""
    global calendar_service
    if calendar_service is None:
        # Check if we should use OAuth or service account
        use_oauth = os.getenv('USE_OAUTH', 'false').lower() == 'true'

        if use_oauth:
            try:
                from .google_calendar_oauth import GoogleCalendarOAuthService
                calendar_service = GoogleCalendarOAuthService()
                logger.info("✓ Using OAuth for Google Calendar (can create real Meet links)")
            except Exception as e:
                logger.error(f"Failed to initialize OAuth, falling back to service account: {e}")
                calendar_service = GoogleCalendarService()
                logger.info("⚠️  Using service account (limited Meet link support)")
        else:
            calendar_service = GoogleCalendarService()
            logger.info("Using service account for Google Calendar")

    return calendar_service


def get_bubble_service():
    """Lazy initialization of Bubble service"""
    global bubble_service
    if bubble_service is None:
        bubble_service = BubbleService()
    return bubble_service


def normalize_datetime(date_str, timezone='America/New_York'):
    """
    Convert various date formats to ISO 8601 format required by Google Calendar

    Args:
        date_str: Date string in various formats (ISO 8601 or human-readable)
        timezone: Timezone to use if date string doesn't include one (default: America/New_York / EST)

    Returns:
        str: ISO 8601 formatted datetime string
    """
    try:
        # Try to parse the date string
        if isinstance(date_str, str):
            # Parse the date using dateutil parser (handles multiple formats)
            # Use fuzzy=False to ensure strict parsing
            dt = date_parser.parse(date_str, fuzzy=False)

            # If datetime is naive (no timezone), assume EST/EDT
            if dt.tzinfo is None:
                from dateutil import tz
                eastern = tz.gettz(timezone)
                dt = dt.replace(tzinfo=eastern)
                logger.info(f"Added timezone {timezone} to naive datetime: {dt}")

            # Return in ISO 8601 format
            return dt.isoformat()
        else:
            # Already a datetime object
            return date_str.isoformat()
    except Exception as e:
        logger.error(f"Error parsing date '{date_str}': {str(e)}")
        raise ValueError(f"Invalid date format: {date_str}")


@calendar_automation.route('/webhook/bubble-trigger', methods=['POST'])
def bubble_trigger():
    """
    Step 1: Receive webhook from Bubble.io
    Triggers the entire calendar invite creation workflow
    """
    try:
        # Validate request and handle JSON parsing errors
        try:
            data = request.get_json(force=True)
        except Exception as json_error:
            logger.error(f"JSON parsing error: {str(json_error)}")
            logger.error(f"Raw request data: {request.get_data(as_text=True)}")
            log_error("Calendar Automation", f"Invalid JSON format: {str(json_error)}")
            return jsonify({
                'status': 'error',
                'message': 'Invalid JSON format. Please check your request body.'
            }), 400

        if not data:
            logger.error("No JSON data received in webhook")
            log_error("Calendar Automation", "No JSON data in webhook request")
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400

        logger.info(f"Received webhook: {data}")

        # Validate required fields
        required_fields = ['id', 'guest_name', 'guest_email', 'host_name',
                          'host_email', 'booked_date', 'end_of_meeting']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            logger.error(f"Missing required fields: {missing_fields}")
            log_error("Calendar Automation", f"Missing fields: {missing_fields}")
            return jsonify({
                'status': 'error',
                'message': f'Missing required fields: {missing_fields}'
            }), 400

        # Extract data
        thing_id = data['id']
        guest_name = data['guest_name']
        guest_email = data['guest_email']
        host_name = data['host_name']
        host_email = data['host_email']

        # Normalize date formats to ISO 8601
        booked_date = normalize_datetime(data['booked_date'])
        end_of_meeting = normalize_datetime(data['end_of_meeting'])

        logger.info(f"Normalized dates - Start: {booked_date}, End: {end_of_meeting}")

        # Get services
        cal_service = get_calendar_service()
        bub_service = get_bubble_service()

        # Step 2: Create team calendar event with Google Meet link
        logger.info("Step 2: Creating team calendar event with Meet link")
        team_event_summary = f"Virtual Meeting between Split Lease, {guest_name} and {host_name}"
        team_event_description = (
            f"This is the event generated by automation, no attendees or users added to this event, "
            f"still, the google meet link is the same that {guest_name} and {host_name} have. "
            f"Just in case is needed these are their emails: {guest_email} and {host_email}"
        )

        team_event = cal_service.create_event_with_meet(
            calendar_id=os.getenv('GOOGLE_TEAM_CALENDAR_ID'),
            summary=team_event_summary,
            description=team_event_description,
            start_time=booked_date,
            end_time=end_of_meeting,
            attendees=[]
        )

        # Extract meeting link
        meeting_link = cal_service.extract_meet_link(team_event)
        if not meeting_link:
            logger.error("Failed to create Google Meet link")
            log_error("Calendar Automation", "Failed to create Google Meet link")
            return jsonify({
                'status': 'error',
                'message': 'Failed to create Google Meet link'
            }), 500

        logger.info(f"Created team event with Meet link: {meeting_link}")
        log_success(f"Created team event for {guest_name} & {host_name}")

        # Step 3: Update Bubble with meeting link
        logger.info(f"Step 3: Updating Bubble thing {thing_id} with meeting link")
        update_success = bub_service.update_thing(thing_id, {'meeting_link': meeting_link})

        if update_success:
            log_success(f"Updated Bubble with meeting link: {thing_id}")
        else:
            logger.warning("Failed to update Bubble with meeting link, but continuing workflow")
            log_error(f"Failed to update Bubble {thing_id} with meeting link")

        # Step 4: Process guest and host paths (synchronously for stability)
        logger.info("Step 4: Processing guest and host paths")

        # Process guest path
        process_guest_path(thing_id, guest_name, guest_email, host_name,
                          booked_date, end_of_meeting, meeting_link, cal_service, bub_service)

        # Process host path
        process_host_path(thing_id, host_name, host_email, guest_name,
                         booked_date, end_of_meeting, meeting_link, cal_service, bub_service)

        logger.info("Webhook processing completed successfully")
        log_success(f"Completed calendar invites for {guest_name} & {host_name}")

        return jsonify({
            'status': 'success',
            'meeting_link': meeting_link,
            'thing_id': thing_id
        }), 200

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        log_error(f"Webhook error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


def process_guest_path(thing_id, guest_name, guest_email, host_name,
                       booked_date, end_of_meeting, meeting_link, cal_service, bub_service):
    """
    Path A: Guest Calendar Event Creation
    Steps 5, 6, 7
    Creates invitation event and sends email to guest
    """
    try:

        # Step 5: Path Conditions (always run - pass through)
        logger.info(f"Step 5: Guest path conditions (always run) for {guest_email}")

        # Step 6: Create calendar invitation for guest and send email
        logger.info(f"Step 6: Creating calendar event for guest {guest_email}")
        guest_event_summary = f"Virtual Meeting between {guest_name}, Split Lease and {host_name}"

        guest_event = cal_service.create_event_with_existing_meet(
            calendar_id=os.getenv('GOOGLE_SERVICE_CALENDAR_ID'),
            summary=guest_event_summary,
            location=meeting_link,
            start_time=booked_date,
            end_time=end_of_meeting,
            attendees=[{
                'email': guest_email,
                'responseStatus': 'accepted'
            }],
            send_updates='all'  # This sends the email invitation and auto-adds to calendar
        )

        logger.info(f"Created guest calendar event: {guest_event.get('id')}")
        log_success(f"Sent calendar invite to guest: {guest_email}")

        # Step 7: Update Bubble - guest invitation sent
        logger.info(f"Step 7: Updating Bubble - invitation sent to guest {guest_email}")
        update_success = bub_service.update_thing(thing_id, {'invitation_sent_to_guest': True})

        if update_success:
            log_success(f"Updated Bubble - guest invitation flag: {thing_id}")
        else:
            log_error(f"Failed to update Bubble guest flag: {thing_id}")

        logger.info(f"Guest path completed successfully for {guest_email}")

    except Exception as e:
        logger.error(f"Error in guest path for {guest_email}: {str(e)}", exc_info=True)
        log_error(f"Guest path error for {guest_email}: {str(e)}")


def process_host_path(thing_id, host_name, host_email, guest_name,
                      booked_date, end_of_meeting, meeting_link, cal_service, bub_service):
    """
    Path B: Host Calendar Event Creation
    Steps 8, 9, 10
    Creates invitation event and sends email to host
    """
    try:

        # Step 8: Path Conditions (always run - pass through)
        logger.info(f"Step 8: Host path conditions (always run) for {host_email}")

        # Step 9: Create calendar invitation for host and send email
        logger.info(f"Step 9: Creating calendar event for host {host_email}")
        host_event_summary = f"Virtual Meeting between {host_name}, Split Lease and {guest_name}"

        host_event = cal_service.create_event_with_existing_meet(
            calendar_id=os.getenv('GOOGLE_SERVICE_CALENDAR_ID'),
            summary=host_event_summary,
            location=meeting_link,
            start_time=booked_date,
            end_time=end_of_meeting,
            attendees=[{
                'email': host_email,
                'responseStatus': 'accepted'
            }],
            send_updates='all'  # This sends the email invitation and auto-adds to calendar
        )

        logger.info(f"Created host calendar event: {host_event.get('id')}")
        log_success(f"Sent calendar invite to host: {host_email}")

        # Step 10: Update Bubble - host invitation sent
        logger.info(f"Step 10: Updating Bubble - invitation sent to host {host_email}")
        update_success = bub_service.update_thing(thing_id, {'invitation_sent_to_host': True})

        if update_success:
            log_success(f"Updated Bubble - host invitation flag: {thing_id}")
        else:
            log_error(f"Failed to update Bubble host flag: {thing_id}")

        logger.info(f"Host path completed successfully for {host_email}")

    except Exception as e:
        logger.error(f"Error in host path for {host_email}: {str(e)}", exc_info=True)
        log_error(f"Host path error for {host_email}: {str(e)}")


@calendar_automation.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for calendar automation"""
    return jsonify({
        'status': 'healthy',
        'service': 'Calendar Automation'
    }), 200


@calendar_automation.route('/test-config', methods=['GET'])
def test_config():
    """Test endpoint to verify configuration"""
    config_status = {
        'google_team_calendar_id': bool(os.getenv('GOOGLE_TEAM_CALENDAR_ID')),
        'google_service_calendar_id': bool(os.getenv('GOOGLE_SERVICE_CALENDAR_ID')),
        'bubble_api_token': bool(os.getenv('BUBBLE_API_TOKEN')),
        'google_credentials': os.path.exists(os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON', ''))
    }

    all_configured = all(config_status.values())

    return jsonify({
        'status': 'ok' if all_configured else 'incomplete',
        'configuration': config_status,
        'message': 'All configured' if all_configured else 'Some configuration missing'
    }), 200 if all_configured else 500
