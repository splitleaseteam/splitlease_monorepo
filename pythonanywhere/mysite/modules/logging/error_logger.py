import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_error_to_webhook(error_message, webhook_url):
    """
    Send error message to a webhook
    """
    payload = {
        "text": f"Error occurred: {error_message}"
    }

    try:
        response = requests.post(
            webhook_url,
            data=json.dumps(payload),
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        logger.info(f"Error message sent to webhook: {error_message}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send error to webhook: {str(e)}")

def log_error(error_message, webhook_url=None):
    """
    Log error message and optionally send to webhook
    """
    logger.error(error_message)

    if webhook_url:
        send_error_to_webhook(error_message, webhook_url)
