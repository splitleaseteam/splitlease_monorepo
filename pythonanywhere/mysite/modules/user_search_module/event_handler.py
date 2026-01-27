"""
Event Handler for User Search Messages
Watches for __SEARCH_USER_BUBBLE__ trigger text from Slack Workflow
"""
import logging
import re
from flask import jsonify
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Trigger text that Slack workflow posts
SEARCH_TRIGGER_TEXT = "__SEARCH_USER_BUBBLE__"


def extract_search_data_from_message(text: str) -> Optional[Dict]:
    """
    Extract search parameters from the workflow message

    Expected format after form submission:
    __SEARCH_USER_BUBBLE__
    Version: test
    Search Constraint: john@example.com

    Args:
        text: The message text from Slack

    Returns:
        Dict with search_constraint and version, or None if not valid
    """
    try:
        # Check if message contains trigger text
        if SEARCH_TRIGGER_TEXT not in text:
            return None

        logger.info(f"Found trigger text in message: {SEARCH_TRIGGER_TEXT}")
        logger.info(f"Full message text: {repr(text)}")

        # Extract version
        version_match = re.search(r'Version:\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
        version = version_match.group(1).strip().lower() if version_match else 'test'
        logger.info(f"Extracted version: {version}")

        # Extract search constraint
        constraint_match = re.search(r'Search\s*Constraint:\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
        search_constraint = constraint_match.group(1).strip() if constraint_match else None
        logger.info(f"Constraint match result: {constraint_match}")
        logger.info(f"Extracted search_constraint: {search_constraint}")

        if not search_constraint:
            logger.warning("Search constraint not found in message")
            return None

        # Validate version
        if version not in ['live', 'test']:
            logger.warning(f"Invalid version '{version}', defaulting to 'test'")
            version = 'test'

        data = {
            'search_constraint': search_constraint,
            'version': version
        }

        logger.info(f"Extracted search data: {data}")
        return data

    except Exception as e:
        logger.error(f"Error extracting search data: {e}")
        return None


def should_process_message(event: dict) -> bool:
    """
    Check if message should be processed as a search request

    Args:
        event: Slack message event

    Returns:
        True if message should be processed
    """
    # Ignore bot messages to prevent loops
    if event.get('bot_id') or event.get('bot_profile'):
        logger.debug(f"Ignoring bot message: bot_id={event.get('bot_id')}, bot_profile={event.get('bot_profile')}")
        return False

    # Ignore messages with subtypes (like message_changed, message_deleted, etc.)
    if event.get('subtype'):
        logger.debug(f"Ignoring message with subtype: {event.get('subtype')}")
        return False

    # Check if message contains trigger text
    text = event.get('text', '')
    if SEARCH_TRIGGER_TEXT not in text:
        return False

    return True


# Track processed messages to prevent duplicates
_processed_messages = set()
_processed_messages_max_size = 100

def process_search_event(event: dict) -> tuple:
    """
    Process a Slack message event for user search

    This function is called by the main slack_events handler
    when it detects the __SEARCH_USER_BUBBLE__ trigger text

    Args:
        event: Slack message event data

    Returns:
        tuple: (response_dict, status_code)
    """
    try:
        logger.info("User search event handler triggered")

        # Check if should process
        if not should_process_message(event):
            logger.debug("Message should not be processed")
            return ({'status': 'ignored'}, 200)

        # Get unique message identifier (timestamp + channel)
        message_id = f"{event.get('channel')}_{event.get('ts')}"

        # Check if already processed
        if message_id in _processed_messages:
            logger.info(f"Skipping duplicate message: {message_id}")
            return ({'status': 'duplicate_ignored'}, 200)

        # Mark as processed
        _processed_messages.add(message_id)

        # Keep set size reasonable
        if len(_processed_messages) > _processed_messages_max_size:
            _processed_messages.clear()
            logger.debug("Cleared processed messages cache")

        # Extract data from message
        search_data = extract_search_data_from_message(event.get('text', ''))

        if not search_data:
            logger.warning("Could not extract search data from message")
            return ({'status': 'no_search_data'}, 200)

        # Add channel and user info
        search_data['channel_id'] = event.get('channel')
        search_data['user_id'] = event.get('user')
        search_data['message_ts'] = event.get('ts')  # Message timestamp for threading

        # Import here to avoid circular dependency
        from .routes import handle_search_message

        # Process the search
        return handle_search_message(search_data)

    except Exception as e:
        logger.error(f"Error in user search event handler: {e}", exc_info=True)
        return ({'error': str(e)}, 500)


def format_workflow_message(version: str, search_constraint: str) -> str:
    """
    Format the message that Slack Workflow should post
    This is for documentation purposes - shows what format to use in workflow

    Args:
        version: 'live' or 'test'
        search_constraint: The search query

    Returns:
        Formatted message string
    """
    return f"""{SEARCH_TRIGGER_TEXT}
Version: {version}
Search Constraint: {search_constraint}"""
