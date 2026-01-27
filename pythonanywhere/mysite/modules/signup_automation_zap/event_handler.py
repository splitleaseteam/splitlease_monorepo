"""
Event Handler for Signup Messages
Integrates with existing slack_events module
"""
import logging
from .routes import handle_signup_message

logger = logging.getLogger(__name__)


def process_signup_event(event: dict) -> dict:
    """
    Process a Slack message event for signup automation

    This function is called by the main slack_events handler
    when it detects a signup-related message

    Args:
        event: Slack message event data

    Returns:
        dict: Result with status and message
    """
    try:
        logger.info("Signup event handler triggered")
        response, status_code = handle_signup_message(event)
        # Convert Flask response to dict for slack_events handler
        return {'status': 'success' if status_code == 200 else 'error', 'message': 'Signup processed'}
    except Exception as e:
        logger.error(f"Error in signup event handler: {e}")
        return {'status': 'error', 'message': str(e)}
