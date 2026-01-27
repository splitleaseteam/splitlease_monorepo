import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_success_to_webhook(success_message, webhook_url):
    """
    Send success message to a webhook
    """
    payload = {
        "text": f"Operation successful: {success_message}"
    }

    try:
        response = requests.post(
            webhook_url,
            data=json.dumps(payload),
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        logger.info(f"Success message sent to webhook: {success_message}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send success message to webhook: {str(e)}")

def log_success(success_message, webhook_url=None):
    """
    Log success message and optionally send to webhook
    """
    logger.info(success_message)

    if webhook_url:
        send_success_to_webhook(success_message, webhook_url)
