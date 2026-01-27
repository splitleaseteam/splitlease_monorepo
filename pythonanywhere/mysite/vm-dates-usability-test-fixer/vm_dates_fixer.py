"""
VM Dates Fixer - Daily Scheduled Webhook
Replaces Zapier workflow for fixing VM dates for testers
Designed for PythonAnywhere scheduled tasks (run daily at 7:00 AM)
"""

import requests
import logging
from datetime import datetime
from time import sleep
import sys
import os

# ============================================================================
# CONFIGURATION
# ============================================================================

# API Configuration
API_ENDPOINT = os.getenv(
    'VM_FIXER_ENDPOINT',
    'https://app.split.lease/api/1.1/wf/l3-fix-vm-dates-for-testers'
)

# Retry Configuration
RETRY_ATTEMPTS = int(os.getenv('VM_FIXER_RETRY_ATTEMPTS', '3'))
RETRY_DELAY = int(os.getenv('VM_FIXER_RETRY_DELAY', '60'))  # seconds
REQUEST_TIMEOUT = int(os.getenv('VM_FIXER_TIMEOUT', '30'))  # seconds

# Logging Configuration
LOG_FILE = os.getenv('VM_FIXER_LOG_FILE', 'vm_dates_fixer.log')
LOG_LEVEL = os.getenv('VM_FIXER_LOG_LEVEL', 'INFO')

# ============================================================================
# LOGGING SETUP
# ============================================================================

# Create logger
logger = logging.getLogger('VMDatesFixer')
logger.setLevel(getattr(logging, LOG_LEVEL))

# File handler
file_handler = logging.FileHandler(LOG_FILE)
file_handler.setLevel(logging.INFO)

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)

# Formatter
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add handlers
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# ============================================================================
# CORE FUNCTIONALITY
# ============================================================================

def make_webhook_call():
    """
    Make HTTP POST request to fix VM dates endpoint.

    Returns:
        bool: True if successful, False otherwise
    """
    headers = {
        'Content-Type': 'application/json'
    }

    # Empty JSON body as per Zapier configuration
    payload = {}

    logger.info(f"Making POST request to: {API_ENDPOINT}")

    try:
        response = requests.post(
            API_ENDPOINT,
            json=payload,
            headers=headers,
            timeout=REQUEST_TIMEOUT
        )

        # Log response details
        logger.info(f"Response status code: {response.status_code}")
        logger.info(f"Response body: {response.text[:500]}")  # Log first 500 chars

        # Check if successful (2xx status codes)
        if 200 <= response.status_code < 300:
            logger.info("✓ Webhook call successful")
            return True
        else:
            logger.error(f"✗ Webhook call failed with status {response.status_code}")
            return False

    except requests.exceptions.Timeout:
        logger.error(f"✗ Request timeout after {REQUEST_TIMEOUT} seconds")
        return False

    except requests.exceptions.ConnectionError as e:
        logger.error(f"✗ Connection error: {str(e)}")
        return False

    except requests.exceptions.RequestException as e:
        logger.error(f"✗ Request exception: {str(e)}")
        return False

    except Exception as e:
        logger.error(f"✗ Unexpected error: {str(e)}")
        return False


def execute_with_retry():
    """
    Execute webhook call with retry logic and exponential backoff.

    Returns:
        bool: True if any attempt succeeded, False if all failed
    """
    logger.info("=" * 70)
    logger.info("VM Dates Fixer - Execution Started")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    logger.info("=" * 70)

    for attempt in range(1, RETRY_ATTEMPTS + 1):
        logger.info(f"Attempt {attempt} of {RETRY_ATTEMPTS}")

        success = make_webhook_call()

        if success:
            logger.info("=" * 70)
            logger.info("VM Dates Fixer - Execution Completed Successfully")
            logger.info("=" * 70)
            return True

        # If not successful and not the last attempt, wait before retrying
        if attempt < RETRY_ATTEMPTS:
            # Exponential backoff: delay * (2 ^ (attempt - 1))
            wait_time = RETRY_DELAY * (2 ** (attempt - 1))
            logger.warning(f"Retrying in {wait_time} seconds...")
            sleep(wait_time)

    # All attempts failed
    logger.error("=" * 70)
    logger.error("VM Dates Fixer - All Attempts Failed")
    logger.error("=" * 70)
    return False


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    """
    Main entry point for the script.
    Designed to be run as a PythonAnywhere scheduled task daily at 7:00 AM.
    """
    try:
        success = execute_with_retry()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("Execution interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.critical(f"Critical error: {str(e)}", exc_info=True)
        sys.exit(1)
