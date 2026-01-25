"""
Slack Events API Routes
Universal endpoint for receiving Slack event subscriptions
"""

from flask import Blueprint, request, jsonify
import os
import logging
import hashlib
import hmac
import time
from modules.logging.error_logger import log_error
from modules.logging.success_logger import log_success
from .event_handler import SlackEventHandler

# Initialize blueprint
slack_events = Blueprint('slack_events', __name__)

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize event handler (lazy initialization)
event_handler = None


def get_event_handler():
    """Lazy initialization of Slack Event Handler"""
    global event_handler
    if event_handler is None:
        event_handler = SlackEventHandler()
    return event_handler


def verify_slack_signature(request_body, timestamp, signature):
    """
    Verify that requests are genuinely coming from Slack

    Args:
        request_body: Raw request body bytes
        timestamp: X-Slack-Request-Timestamp header
        signature: X-Slack-Signature header

    Returns:
        bool: True if signature is valid, False otherwise
    """
    # Get signing secret from environment
    signing_secret = os.getenv('SLACK_SIGNING_SECRET_SIGNUP', '')

    if not signing_secret:
        logger.warning("SLACK_SIGNING_SECRET_SIGNUP not configured - skipping signature verification")
        return True  # Allow for development, but log warning

    # Verify timestamp is recent (within 5 minutes)
    current_timestamp = int(time.time())
    if abs(current_timestamp - int(timestamp)) > 60 * 5:
        logger.error("Request timestamp is too old")
        return False

    # Compute expected signature
    sig_basestring = f"v0:{timestamp}:{request_body.decode('utf-8')}"
    expected_signature = 'v0=' + hmac.new(
        signing_secret.encode(),
        sig_basestring.encode(),
        hashlib.sha256
    ).hexdigest()

    # Compare signatures
    if hmac.compare_digest(expected_signature, signature):
        return True
    else:
        logger.error("Invalid Slack signature")
        return False


@slack_events.route('/events', methods=['POST'])
def handle_events():
    """
    Universal endpoint for Slack Events API
    Handles URL verification, event routing, and signature verification
    """
    try:
        # Get request data
        try:
            data = request.get_json(force=True)
        except Exception as json_error:
            logger.error(f"JSON parsing error: {str(json_error)}")
            logger.error(f"Raw request data: {request.get_data(as_text=True)}")
            log_error("Slack Events", f"Invalid JSON format: {str(json_error)}")
            return jsonify({
                'status': 'error',
                'message': 'Invalid JSON format'
            }), 400

        if not data:
            logger.error("No JSON data received in Slack event")
            log_error("Slack Events", "No JSON data in request")
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400

        # Verify Slack signature (security)
        slack_signature = request.headers.get('X-Slack-Signature', '')
        slack_timestamp = request.headers.get('X-Slack-Request-Timestamp', '')

        if slack_signature and slack_timestamp:
            request_body = request.get_data()
            if not verify_slack_signature(request_body, slack_timestamp, slack_signature):
                logger.error("Slack signature verification failed")
                log_error("Slack Events", "Invalid request signature")
                return jsonify({'status': 'error', 'message': 'Invalid signature'}), 401

        # Log incoming event
        event_type = data.get('type', 'unknown')
        logger.info(f"Received Slack event: type={event_type}")
        logger.debug(f"Full event data: {data}")

        # Handle URL verification challenge
        if event_type == 'url_verification':
            challenge = data.get('challenge')
            logger.info(f"URL verification challenge received: {challenge}")
            log_success("Slack Events - URL verification successful")
            return jsonify({'challenge': challenge}), 200

        # Handle event callback
        if event_type == 'event_callback':
            event = data.get('event', {})
            event_subtype = event.get('type', 'unknown')
            team_id = data.get('team_id', 'unknown')
            api_app_id = data.get('api_app_id', 'unknown')

            logger.info(f"Event callback: subtype={event_subtype}, team={team_id}, app={api_app_id}")

            # Log to Slack success channel
            log_success(
                f"Slack Event Received - Type: {event_subtype}, "
                f"Team: {team_id}, App: {api_app_id}"
            )

            # Process the event through handler
            handler = get_event_handler()
            result = handler.process_event(
                event_type=event_subtype,
                event_data=event,
                team_id=team_id,
                api_app_id=api_app_id,
                full_payload=data
            )

            if result['status'] == 'success':
                logger.info(f"Event processed successfully: {result.get('message', '')}")
                # Slack expects a 200 OK response quickly
                return jsonify({'status': 'ok'}), 200
            else:
                logger.error(f"Event processing failed: {result.get('message', '')}")
                log_error("Slack Events", f"Processing failed: {result.get('message', '')}")
                # Still return 200 to prevent Slack from retrying
                return jsonify({'status': 'ok'}), 200

        # Handle app_rate_limited events
        if event_type == 'app_rate_limited':
            logger.warning(f"App rate limited: {data}")
            log_error("Slack Events", f"Rate limited: {data.get('minute_rate_limited')}")
            return jsonify({'status': 'ok'}), 200

        # Unknown event type
        logger.warning(f"Unknown Slack event type: {event_type}")
        log_error("Slack Events", f"Unknown event type: {event_type}")
        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        logger.error(f"Error processing Slack event: {str(e)}", exc_info=True)
        log_error("Slack Events", f"Error: {str(e)}")
        # Return 200 to prevent Slack from retrying
        return jsonify({'status': 'ok'}), 200


@slack_events.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Slack events"""
    return jsonify({
        'status': 'healthy',
        'service': 'Slack Events'
    }), 200


@slack_events.route('/test-config', methods=['GET'])
def test_config():
    """Test endpoint to verify Slack configuration"""
    config_status = {
        'slack_signing_secret': bool(os.getenv('SLACK_SIGNING_SECRET')),
        'slack_bot_token': bool(os.getenv('SLACK_BOT_TOKEN')),
        'slack_app_token': bool(os.getenv('SLACK_APP_TOKEN'))
    }

    all_configured = config_status['slack_signing_secret']  # Minimum requirement

    return jsonify({
        'status': 'ok' if all_configured else 'incomplete',
        'configuration': config_status,
        'message': 'Signing secret configured' if all_configured else 'Missing signing secret'
    }), 200 if all_configured else 500
