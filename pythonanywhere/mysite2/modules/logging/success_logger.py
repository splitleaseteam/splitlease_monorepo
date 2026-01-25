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

from config import SUCCESS_WEBHOOK_URL

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_success_to_webhook(success_message, webhook_url=None):
    """
    Send success message to a webhook
    """
    if webhook_url is None:
        webhook_url = SUCCESS_WEBHOOK_URL
        
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

    if webhook_url is None:
        webhook_url = SUCCESS_WEBHOOK_URL
        
    if webhook_url:
        send_success_to_webhook(success_message, webhook_url)
