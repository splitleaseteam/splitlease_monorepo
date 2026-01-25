"""
Daily Login Check Script
Replacement for Zapier workflow that:
1. Runs daily at 9:30 AM
2. Calls Split Lease API to check user logins
3. Sends notification to Slack
"""

import os
import requests
import schedule
import time
from datetime import datetime
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('daily_login_check.log'),
        logging.StreamHandler()
    ]
)

# Configuration
API_URL = os.getenv('SPLIT_LEASE_API_URL')
API_KEY = os.getenv('SPLIT_LEASE_API_KEY')
SLACK_WEBHOOK_URL = os.getenv('SLACK_WEBHOOK_URL')


def call_split_lease_api():
    """
    Makes a POST request to the Split Lease API
    Equivalent to the Webhooks by Zapier step

    Returns:
        tuple: (success: bool, result: dict or str)
    """
    try:
        logging.info("Calling Split Lease API...")

        response = requests.post(
            API_URL,
            timeout=30
        )

        response.raise_for_status()

        logging.info(f"API call successful. Status: {response.status_code}")

        # Try to parse JSON, but accept empty responses
        try:
            result = response.json()
        except:
            result = {"status": "success", "message": "API returned empty response"}

        return True, result

    except requests.exceptions.RequestException as e:
        logging.error(f"API call failed: {str(e)}")
        return False, str(e)


def send_slack_notification(success=True, error_message=None):
    """
    Sends a notification to Slack using webhook
    Equivalent to the Slack Send Channel Message step

    Args:
        success: Whether the API call was successful
        error_message: Error message if API call failed

    Returns:
        bool: Whether Slack notification was sent successfully
    """
    try:
        if success:
            message = "Daily login check for users finished"
        else:
            message = f"Daily login check for users failed: {error_message}"

        payload = {
            "text": message
        }

        response = requests.post(
            SLACK_WEBHOOK_URL,
            json=payload,
            timeout=10
        )

        response.raise_for_status()

        logging.info("Slack notification sent successfully via webhook")
        return True

    except requests.exceptions.RequestException as e:
        logging.error(f"Slack notification failed: {str(e)}")
        return False


def run_daily_check():
    """
    Main function that orchestrates the workflow
    Equivalent to the complete Zap execution
    """
    logging.info("=" * 50)
    logging.info("Starting daily login check workflow...")
    logging.info(f"Execution time: {datetime.now()}")

    # Step 1: Call the API
    success, result = call_split_lease_api()

    # Step 2: Send Slack notification
    send_slack_notification(success=success, error_message=result if not success else None)

    logging.info("Workflow completed")
    logging.info("=" * 50)


def main():
    """
    Sets up the schedule and runs the script
    Equivalent to Schedule by Zapier trigger (Every day at 9:30 AM)
    """
    # Schedule the job to run every day at 9:30 AM
    schedule.every().day.at("09:30").do(run_daily_check)

    logging.info("Daily Login Check Script Started")
    logging.info("Scheduled to run every day at 9:30 AM")
    logging.info("Press Ctrl+C to stop")

    # Optional: Run immediately on startup for testing
    # Uncomment the line below to test the workflow immediately
    # run_daily_check()

    # Keep the script running
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        logging.info("Script stopped by user")


if __name__ == "__main__":
    main()
