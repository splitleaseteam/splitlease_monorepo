"""
Knowledge Search Routes
Blueprint for handling knowledge search requests from Slack
"""
from flask import Blueprint, request, jsonify
import logging
import os
from datetime import datetime

# Initialize logger
logger = logging.getLogger(__name__)

# Create blueprint
bp = Blueprint('knowledge_search', __name__)

# Configuration from environment
SLACK_BOT_TOKEN = os.getenv('SLACK_BOT_TOKEN_KNOWLEDGE')
SLACK_SIGNING_SECRET = os.getenv('SLACK_SIGNING_SECRET_KNOWLEDGE')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Import event handler only if credentials are configured
event_handler = None
if SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET and OPENAI_API_KEY:
    try:
        from .event_handler import KnowledgeSearchHandler
        event_handler = KnowledgeSearchHandler(
            slack_token=SLACK_BOT_TOKEN,
            openai_key=OPENAI_API_KEY
        )
    except Exception as e:
        logger.error(f"Failed to initialize event handler: {e}")


@bp.route('/events', methods=['POST'])
def slack_events():
    """
    Slack Events API endpoint for knowledge search bot

    Handles URL verification challenge and app_mention events
    """
    try:
        payload = request.get_json()

        if not payload:
            logger.warning("No payload received")
            return jsonify({'error': 'No payload received'}), 400

        # Handle URL verification challenge
        if payload.get('type') == 'url_verification':
            challenge = payload.get('challenge')
            logger.info("Responding to URL verification challenge")
            return jsonify({'challenge': challenge}), 200

        # Verify Slack signature for actual events
        from .slack_verification import verify_request_signature

        slack_signature = request.headers.get('X-Slack-Signature', '')
        slack_timestamp = request.headers.get('X-Slack-Request-Timestamp', '')

        if not slack_signature or not slack_timestamp:
            logger.warning("Missing Slack signature headers")
            return jsonify({'error': 'Invalid request'}), 403

        request_body = request.get_data()
        if not verify_request_signature(
            request_body,
            slack_timestamp,
            slack_signature,
            SLACK_SIGNING_SECRET
        ):
            logger.warning("Signature verification failed")
            return jsonify({'error': 'Invalid signature'}), 403

        # Process the event
        event_type = payload.get('event', {}).get('type')

        if event_type == 'app_mention' and event_handler:
            event_data = payload.get('event', {})
            response, status_code = event_handler.handle_mention(event_data)
            return response, status_code

        # Acknowledge other events
        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        logger.error(f"Error in events endpoint: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'module': 'knowledge_search',
        'timestamp': datetime.now().isoformat(),
        'slack_configured': bool(SLACK_BOT_TOKEN),
        'slack_signing_configured': bool(SLACK_SIGNING_SECRET),
        'openai_configured': bool(OPENAI_API_KEY),
        'handler_initialized': event_handler is not None
    }), 200
