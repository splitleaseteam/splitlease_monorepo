import logging
import os
import json
import requests
from typing import Dict, Any

class SlackHandler(logging.Handler):
    """
    A custom logging handler for sending log messages to Slack
    """
    def __init__(self, webhook_url: str, channel: str = "#database-alerts", username: str = "Database Checker"):
        """Initialize Slack webhook handler"""
        super().__init__()
        self.webhook_url = webhook_url
        self.channel = channel
        self.username = username
        
    def emit(self, record: logging.LogRecord) -> None:
        """Send the log record to Slack"""
        try:
            # Format log message
            log_entry = self.format(record)
            
            # Set emoji based on log level
            emoji = ":information_source:"
            if record.levelno >= logging.ERROR:
                emoji = ":red_circle:"
            elif record.levelno >= logging.WARNING:
                emoji = ":warning:"
                
            # Build payload
            payload = {
                "channel": self.channel,
                "username": self.username,
                "text": f"{emoji} *{record.levelname}*: {log_entry}",
                "icon_emoji": ":robot_face:"
            }
            
            # Only send WARNING and above to Slack by default
            if record.levelno >= logging.WARNING:
                # Send the payload to the webhook
                requests.post(
                    self.webhook_url,
                    data=json.dumps(payload),
                    headers={"Content-Type": "application/json"}
                )
        except Exception as e:
            # Don't raise exceptions inside a logging handler
            print(f"Error sending to Slack: {str(e)}")

def setup_slack_logging(logger: logging.Logger, webhook_url: str = None) -> None:
    """
    Configure a logger to send messages to Slack
    
    Args:
        logger: The logger to configure
        webhook_url: Slack webhook URL (defaults to env var SLACK_WEBHOOK_URL)
    """
    # Get webhook URL from environment if not provided
    if webhook_url is None:
        webhook_url = os.getenv('SLACK_WEBHOOK_URL')
        
    if not webhook_url:
        logger.warning("SLACK_WEBHOOK_URL not configured, skipping Slack integration")
        return
        
    # Create and add Slack handler
    slack_handler = SlackHandler(webhook_url)
    
    # Set formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    slack_handler.setFormatter(formatter)
    
    # Only send warnings and above to Slack
    slack_handler.setLevel(logging.WARNING)
    
    # Add handler to logger
    logger.addHandler(slack_handler)
    logger.info("Slack logging integration configured")
