import requests
import json
import logging
import os
from pathlib import Path

# Add the app directory to the Python path
app_dir = str(Path(__file__).resolve().parent.parent.parent)
import sys
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from config import ERROR_WEBHOOK_URL

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_error_to_webhook(error_message, webhook_url=None):
    """
    Send error message to a webhook
    """
    if webhook_url is None:
        webhook_url = ERROR_WEBHOOK_URL
        
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

    if webhook_url is None:
        webhook_url = ERROR_WEBHOOK_URL
        
    if webhook_url:
        send_error_to_webhook(error_message, webhook_url)
