import requests
import logging
from datetime import datetime
from .config import LoggingConfig

logger = logging.getLogger(__name__)

def log_success(message: str, webhook_url: str = None) -> None:
    """Log success message to Slack and application logs"""
    try:
        webhook = webhook_url or LoggingConfig.SUCCESS_WEBHOOK_URL
        logger.info(message)
        
        payload = {
            'text': f"✅ SUCCESS: {message}",
            'timestamp': datetime.now().isoformat()
        }
        
        response = requests.post(webhook, json=payload)
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to log success: {str(e)}")

def log_error(message: str, webhook_url: str = None) -> None:
    """Log error message to Slack and application logs"""
    try:
        webhook = webhook_url or LoggingConfig.ERROR_WEBHOOK_URL
        logger.error(message)
        
        payload = {
            'text': f"❌ ERROR: {message}",
            'timestamp': datetime.now().isoformat()
        }
        
        response = requests.post(webhook, json=payload)
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to log error: {str(e)}")
