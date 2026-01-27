"""
Logging module for the application.
Provides functions for logging errors and successes to both the console and Slack.
"""
import logging
from .error_logger import log_error
from .success_logger import log_success

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

__all__ = ['log_error', 'log_success']
