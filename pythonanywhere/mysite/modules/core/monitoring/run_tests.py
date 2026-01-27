#!/usr/bin/env python3
"""Script to run health checks for all endpoints"""
import os
import sys
import logging
from pathlib import Path

# Add the app directory to the Python path
app_dir = str(Path(__file__).resolve().parent.parent.parent.parent)
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(app_dir, 'logs', 'health_checks.log'))
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Run all health checks"""
    try:
        # Import monitoring components
        from modules.core.monitoring import (
            HealthChecker,
            BASE_URL,
            ENDPOINT_TESTS,
            HEALTH_CHECK_CONFIG,
            SERVICE_GROUP_ORDER
        )
        from modules.logging.config import LoggingConfig  # use native LoggingConfig for webhooks
        
        # Initialize health checker using LoggingConfig for Slack webhooks
        checker = HealthChecker(
            base_url=BASE_URL,
            error_webhook=LoggingConfig.ERROR_WEBHOOK_URL,
            success_webhook=LoggingConfig.SUCCESS_WEBHOOK_URL,
            config=HEALTH_CHECK_CONFIG
        )
        
        # Run tests and send report
        results = checker.check_health(ENDPOINT_TESTS, SERVICE_GROUP_ORDER)
        
        # Log summary
        if results:
            logger.info("Health check complete")
            return True
        else:
            logger.error("Health check failed")
            return False
        
    except Exception as e:
        logger.error(f"Error running health checks: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
