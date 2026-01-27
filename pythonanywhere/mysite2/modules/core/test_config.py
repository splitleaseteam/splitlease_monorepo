"""
Configuration for health check tests and monitoring
"""
import sys
from pathlib import Path

# Add the app directory to the Python path
app_dir = str(Path(__file__).resolve().parent.parent.parent)
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from config import BASE_URL, SUCCESS_WEBHOOK_URL, ERROR_WEBHOOK_URL

# Health check configuration
HEALTH_CHECK_CONFIG = {
    'max_retries': 3,
    'retry_delay': 1,
    'timeout': 10
}

# Slack configuration
SLACK_CONFIG = {
    'webhook_url': SUCCESS_WEBHOOK_URL,
    'error_webhook_url': ERROR_WEBHOOK_URL
}

# Base URL for production environment
BASE_URL = BASE_URL

# Endpoint test configurations
ENDPOINT_TESTS = {
    '/': {
        'method': 'GET',
        'expected_status': 302  # Redirect status code
    },
    '/qr': {
        'method': 'GET',
        'expected_status': 200
    },
    '/shorten': {
        'method': 'POST',
        'data': {
            'url': 'https://example.com'
        },
        'expected_status': 200
    }
}
