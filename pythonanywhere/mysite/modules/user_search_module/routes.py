"""
User Search Routes
Blueprint for handling user search requests from Slack
"""
from flask import Blueprint, request, jsonify
import logging
import os
from typing import Dict
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

from .slack_verification import verify_slack_signature
from .bubble_api import BubbleAPIClient
from .slack_formatter import SlackMessageFormatter

# Initialize logger
logger = logging.getLogger(__name__)

# Create blueprint
bp = Blueprint('user_search', __name__)

# Configuration from environment
BUBBLE_API_KEY = os.getenv('BUBBLE_API_KEY')
SLACK_BOT_TOKEN = os.getenv('SLACK_BOT_TOKEN_SEARCH')
SLACK_SIGNING_SECRET = os.getenv('SLACK_SIGNING_SECRET_SEARCH')
BUBBLE_FIND_USER_API = os.getenv('BUBBLE_FIND_USER_API', 'https://app.split.lease/api/1.1/obj/user')
BUBBLE_API_TIMEOUT = int(os.getenv('BUBBLE_API_TIMEOUT', 10))
MAX_RESULTS_TO_DISPLAY = int(os.getenv('MAX_RESULTS_TO_DISPLAY', 10))

# Initialize Slack client
slack_client = WebClient(token=SLACK_BOT_TOKEN) if SLACK_BOT_TOKEN else None

# Initialize Bubble API client
bubble_client = BubbleAPIClient(
    api_key=BUBBLE_API_KEY,
    base_url=BUBBLE_FIND_USER_API,
    timeout=BUBBLE_API_TIMEOUT
) if BUBBLE_API_KEY else None


class UserSearchProcessor:
    """Handles user search workflow processing"""

    @staticmethod
    def search_users(search_term: str) -> Dict:
        """
        Search for users using Bubble API

        Args:
            search_term: Search query from Slack user

        Returns:
            Dict with 'success', 'users', and optional 'error' keys
        """
        try:
            if not bubble_client:
                return {
                    'success': False,
                    'error': 'Bubble API not configured',
                    'users': []
                }

            logger.info(f"Processing search for: {search_term}")

            # Validate search term
            search_term = search_term.strip()
            if not search_term:
                return {
                    'success': False,
                    'error': 'Search term is required',
                    'users': []
                }

            if len(search_term) < 2:
                return {
                    'success': False,
                    'error': 'Search term must be at least 2 characters',
                    'users': []
                }

            # Search users
            users = bubble_client.search_users(search_term)

            return {
                'success': True,
                'users': users,
                'count': len(users)
            }

        except Exception as e:
            logger.error(f"Error searching users: {e}")
            return {
                'success': False,
                'error': str(e),
                'users': []
            }

    @staticmethod
    def send_slack_message(channel: str, blocks: list, text: str = None):
        """
        Send a message to Slack channel

        Args:
            channel: Slack channel ID
            blocks: Block Kit blocks for rich formatting
            text: Fallback text for notifications
        """
        try:
            if not slack_client:
                logger.error("Slack client not configured")
                return

            response = slack_client.chat_postMessage(
                channel=channel,
                blocks=blocks,
                text=text or "User search results"
            )

            logger.info(f"Message sent to channel {channel}: {response['ts']}")

        except SlackApiError as e:
            logger.error(f"Slack API error: {e.response['error']}")
            raise
        except Exception as e:
            logger.error(f"Error sending Slack message: {e}")
            raise


def handle_search_message(search_data: Dict) -> tuple:
    """
    Handle a search request from event handler
    Calls Bubble backend workflow which handles search and email

    Args:
        search_data: Dict with search_constraint, version, channel_id, user_id

    Returns:
        tuple: (response_dict, status_code)
    """
    import requests

    try:
        search_constraint = search_data.get('search_constraint', '').strip()
        version = search_data.get('version', 'test').strip().lower()
        channel_id = search_data.get('channel_id', '').strip()
        user_id = search_data.get('user_id', 'unknown')

        if not search_constraint:
            return jsonify({'error': 'search_constraint is required'}), 400

        if not channel_id:
            return jsonify({'error': 'channel_id is required'}), 400

        # Validate version
        if version not in ['live', 'test']:
            logger.warning(f"Invalid version '{version}', defaulting to 'test'")
            version = 'test'

        # Bubble workflow URL based on version
        bubble_workflow_url = f'https://app.split.lease/version-{version}/api/1.1/wf/findusers'

        # Log the search request
        logger.info(
            f"User search request - "
            f"User: {user_id}, "
            f"Version: {version}, "
            f"Constraint: '{search_constraint}', "
            f"Channel: {channel_id}"
        )

        # Call Bubble backend workflow
        try:
            logger.info(f"Calling Bubble workflow: {bubble_workflow_url}")

            workflow_payload = {
                'text_to_find': search_constraint
            }

            logger.info(f"Workflow payload: {workflow_payload}")
            logger.info(f"Using API key: {BUBBLE_API_KEY[:10]}..." if BUBBLE_API_KEY else "No API key")

            response = requests.post(
                bubble_workflow_url,
                json=workflow_payload,
                headers={
                    'Authorization': f'Bearer {BUBBLE_API_KEY}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )

            logger.info(f"Bubble response status: {response.status_code}")
            logger.info(f"Bubble response text: {response.text}")

            response.raise_for_status()

            bubble_response = response.json()
            logger.info(f"Bubble workflow response: {bubble_response}")

            # Send confirmation to Slack
            confirmation_message = f":mag: Search request submitted for '{search_constraint}' in {version.upper()} environment. Results will be emailed shortly."

            UserSearchProcessor.send_slack_message(
                channel=channel_id,
                blocks=[{
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": confirmation_message
                    }
                }],
                text=confirmation_message
            )

            return jsonify({
                'status': 'ok',
                'search_constraint': search_constraint,
                'version': version,
                'message': 'Workflow triggered successfully'
            }), 200

        except Exception as e:
            logger.error(f"Error calling Bubble workflow: {e}")
            error_msg = f"Failed to trigger search: {str(e)}"

            UserSearchProcessor.send_slack_message(
                channel=channel_id,
                blocks=[{
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f":x: {error_msg}"
                    }
                }],
                text=error_msg
            )

            return jsonify({'error': error_msg}), 500

    except Exception as e:
        logger.error(f"Error handling search message: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/webhook/slack', methods=['POST'])
@verify_slack_signature(SLACK_SIGNING_SECRET)
def slack_webhook():
    """
    Main webhook endpoint for Slack Workflow Builder

    This endpoint receives data from a Slack Workflow that includes a form.
    The workflow calls Bubble backend workflow instead of searching directly.

    Expects JSON payload with:
    - search_constraint: User search query (can be email, phone, name, etc.)
    - version: 'live' or 'test' to determine which Bubble environment to query
    - channel_id: Slack channel to post results to (automatically provided by Workflow)
    - user_id: User who triggered the workflow (optional, for logging)
    - workflow_id: Unique workflow execution ID (optional)
    """
    try:
        # Get JSON payload from Slack Workflow
        payload = request.get_json()

        if not payload:
            logger.warning("No payload received")
            return jsonify({'error': 'No payload received'}), 400

        logger.info(f"Received workflow webhook payload: {payload}")

        # Extract parameters from Workflow form
        search_constraint = payload.get('search_constraint', '').strip()
        version = payload.get('version', 'test').strip().lower()
        channel_id = payload.get('channel_id', '').strip()
        user_id = payload.get('user_id', 'unknown')
        workflow_id = payload.get('workflow_id', 'unknown')

        # Prepare search data and call the workflow handler
        search_data = {
            'search_constraint': search_constraint,
            'version': version,
            'channel_id': channel_id,
            'user_id': user_id
        }

        # Call the same handler used by event processor
        return handle_search_message(search_data)

    except Exception as e:
        logger.error(f"Error in webhook handler: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/search', methods=['POST'])
def search_users_direct():
    """
    Direct search endpoint (no signature verification)
    Useful for testing or internal use

    POST body:
    {
        "search_term": "user search query"
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        search_term = data.get('search_term', '').strip()

        if not search_term:
            return jsonify({'error': 'search_term is required'}), 400

        # Search for users
        result = UserSearchProcessor.search_users(search_term)

        return jsonify(result), 200 if result['success'] else 400

    except Exception as e:
        logger.error(f"Error in direct search: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'module': 'user_search',
        'bubble_configured': bool(BUBBLE_API_KEY),
        'slack_configured': bool(SLACK_BOT_TOKEN),
        'slack_signing_configured': bool(SLACK_SIGNING_SECRET)
    }), 200


@bp.route('/events', methods=['POST'])
def slack_events():
    """
    Slack Events API endpoint

    This endpoint receives messages posted to channels where the bot is present.
    It watches for the __SEARCH_USER_BUBBLE__ trigger text that the workflow posts.

    Note: This endpoint does NOT use signature verification decorator because
    Slack Events API sends a challenge on first setup that needs immediate response.
    We verify the signature inside the function instead.
    """
    try:
        # Get the payload
        payload = request.get_json()

        if not payload:
            logger.warning("No payload received")
            return jsonify({'error': 'No payload received'}), 400

        # Handle URL verification challenge (happens when setting up Events API)
        if payload.get('type') == 'url_verification':
            challenge = payload.get('challenge')
            logger.info(f"Responding to URL verification challenge")
            return jsonify({'challenge': challenge}), 200

        # Verify signature for actual events
        slack_signature = request.headers.get('X-Slack-Signature', '')
        slack_timestamp = request.headers.get('X-Slack-Request-Timestamp', '')

        if not slack_signature or not slack_timestamp:
            logger.warning("Missing Slack signature headers")
            return jsonify({'error': 'Invalid request'}), 403

        # Import verification function
        from .slack_verification import verify_request_signature

        # Verify the signature
        request_body = request.get_data()
        if not verify_request_signature(
            request_body,
            slack_timestamp,
            slack_signature,
            SLACK_SIGNING_SECRET
        ):
            logger.warning("Signature verification failed for event")
            return jsonify({'error': 'Invalid signature'}), 403

        # Process the event
        event_type = payload.get('event', {}).get('type')

        if event_type == 'message':
            event_data = payload.get('event', {})

            # Import event handler
            from .event_handler import process_search_event

            # Process the search event
            response, status_code = process_search_event(event_data)
            return response, status_code

        # For other event types, just acknowledge
        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        logger.error(f"Error in events endpoint: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/test-search', methods=['GET'])
def test_search():
    """
    Test endpoint to verify Bubble API connectivity
    Usage: GET /api/test-search?term=test@example.com
    """
    try:
        search_term = request.args.get('term', 'test')

        if not bubble_client:
            return jsonify({'error': 'Bubble API not configured'}), 500

        result = UserSearchProcessor.search_users(search_term)

        return jsonify({
            'test': 'search_functionality',
            'search_term': search_term,
            'result': result
        }), 200

    except Exception as e:
        logger.error(f"Error in test search: {e}")
        return jsonify({'error': str(e)}), 500
