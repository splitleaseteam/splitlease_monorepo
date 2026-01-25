"""Test configuration for endpoint health monitoring."""
from typing import Dict, Any, List, Union
import sys
from pathlib import Path

# Add the app directory to the Python path
app_dir = str(Path(__file__).resolve().parent.parent.parent.parent)
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from config import BASE_URL, MONITORING_ERROR_WEBHOOK, MONITORING_SUCCESS_WEBHOOK

# Test data for each endpoint
ENDPOINT_TESTS = {
    # QR Generator endpoints
    '/qr/generate': {
        'method': 'POST',
        'data': {
            "data": "https://leasesplit.com/ViyXDj",
            "text": "Sharath's House Manual"
        },
        'expected_status': [200, 201],
        'service_group': 'QR Services'
    },

    # URL Shortener endpoints
    '/shorten': {
        'method': 'POST',
        'data': {
            "url": "https://bubble.io/appeditor/authenticate_as/upgradefromstr/test/1728565824611x556619365341324740/true/host-house-manual"
        },
        'expected_status': [200, 201],
        'service_group': 'Shorten Services'
    },

    # Health check endpoint
    '/api/health': {
        'method': 'GET',
        'expected_status': [200],
        'service_group': 'Health Services'
    }
}

# Health check configuration
HEALTH_CHECK_CONFIG = {
    'max_retries': 3,
    'retry_delay': 3,  # seconds
    'timeout': 30,     # seconds
    'concurrent_checks': 3  # number of concurrent checks
}

# Slack configuration
SLACK_CONFIG = {
    'error_webhook': MONITORING_ERROR_WEBHOOK,
    'success_webhook': MONITORING_SUCCESS_WEBHOOK
}

# Service group order for report
SERVICE_GROUP_ORDER = [
    'QR Services',
    'Shorten Services'
]
