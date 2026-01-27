import logging
import requests
import os
import dotenv
import sys
import time
from pathlib import Path
from typing import Dict, Any, List

from modules.database_checker.datatypes import validate_all
from modules.database_checker.datatypes.listing_checks import ListingChecks
from modules.database_checker.datatypes.property import PropertyChecks
from modules.database_checker.datatypes.proposal import ProposalChecks
from modules.database_checker.datatypes.user import UserChecks
from modules.database_checker.slack_handler import setup_slack_logging, SlackHandler

# Load module-specific environment
module_env = Path(__file__).parent / '.env'
dotenv.load_dotenv(module_env)

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Configure logging with UTF-8 encoding for file handler
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
# Add file handler with explicit UTF-8 encoding
file_handler = logging.FileHandler(
    os.path.join(os.path.dirname(__file__), 'database_checker.log'),
    encoding='utf-8'
)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logging.getLogger().addHandler(file_handler)

logger = logging.getLogger('database_checker')

# Constants for API requests
PAGE_SIZE = int(os.getenv('PAGE_SIZE', 100))
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds between retries

class BubbleAPIClient:
    def __init__(self):
        self.base_url = os.getenv('BUBBLE_API_URL')
        self.session = requests.Session()
        # Only set Authorization if token exists
        token = os.getenv("BUBBLE_API_TOKEN")
        if token:
            self.session.headers.update({'Authorization': f'Bearer {token}'})

    def fetch_all_data(self, endpoint: str) -> List[Dict[str, Any]]:
        """
        Fetches all data from the specified endpoint using robust pagination with retry mechanism
        
        Args:
            endpoint: API endpoint to fetch data from
            
        Returns:
            List of all data entries from all pages
        """
        all_data = []
        current_cursor = 0

        logger.info(f"Starting to fetch all data from {endpoint}")
        
        while True:
            for attempt in range(MAX_RETRIES):
                try:
                    params = {'limit': PAGE_SIZE}
                    if current_cursor > 0:
                        params['cursor'] = current_cursor
                    
                    logger.info(f"Fetching page with cursor: {current_cursor}")
                    logger.debug(f"Request URL: {self.base_url}/{endpoint}")
                    logger.debug(f"Request params: {params}")
                    
                    response = self.session.get(f'{self.base_url}/{endpoint}', params=params, timeout=30)
                    
                    # Log response details for debugging
                    logger.debug(f"Response status: {response.status_code}")
                    
                    if response.status_code == 400:
                        logger.error(f"Bad Request Error. Response: {response.text}")
                        raise requests.RequestException(f"Bad Request Error: {response.text}")
                    elif response.status_code == 404:
                        logger.error(f"Not Found Error. Response: {response.text}")
                        raise requests.RequestException(f"API endpoint not found: {response.text}")
                    
                    response.raise_for_status()
                    
                    data = response.json()
                    
                    if 'response' not in data:
                        raise ValueError("Invalid API response format: missing 'response'")
                    
                    results = data['response'].get('results', [])
                    logger.info(f"Fetched {len(results)} entries in this batch.")
                    
                    if not results:
                        logger.info("No more entries found. Ending pagination.")
                        return all_data
                    
                    all_data.extend(results)
                    logger.info(f"Total entries fetched so far: {len(all_data)}")
                    
                    if len(results) < PAGE_SIZE:
                        logger.info("Last page reached.")
                        return all_data
                    
                    break
                
                except (requests.RequestException, ValueError) as e:
                    logger.error(f"Error on attempt {attempt + 1}: {str(e)}")
                    
                    if attempt == MAX_RETRIES - 1:
                        logger.error("Maximum retry attempts reached. Aborting.")
                        raise
                    
                    sleep_time = RETRY_DELAY * (attempt + 1)
                    logger.info(f"Retrying after {sleep_time} seconds...")
                    time.sleep(sleep_time)
            
            current_cursor += PAGE_SIZE
            time.sleep(0.5)  # Small delay between pages to avoid overwhelming the API
        
        return all_data

def send_to_slack(message: str):
    """
    Send formatted message to Slack using the webhook URL
    
    Args:
        message: JSON string containing Slack Block Kit blocks
    """
    webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    if not webhook_url:
        logger.error("SLACK_WEBHOOK_URL not found in environment variables")
        return

    try:
        response = requests.post(
            webhook_url,
            headers={"Content-Type": "application/json; charset=utf-8"},
            json={"text": message},
            timeout=10
        )
        response.raise_for_status()
        logger.info("Successfully sent Slack message")
    except requests.RequestException as e:
        logger.error(f"Failed to send Slack message: {str(e)}")

def run_checks(endpoint: str, dry_run: bool = False):
    """
    Fetch data from Bubble API and run appropriate checks based on endpoint
    
    Args:
        endpoint: API endpoint to check (default: listing)
        dry_run: If True, only log output without sending to Slack
    
    Returns:
        The generated report as a string
    """
    logger.info(f"Running {endpoint} checks")
    
    # Fetch all data using the robust pagination method
    # Adjust endpoint capitalization for Bubble API
    api_endpoint = endpoint
    if endpoint == 'proposal':
        api_endpoint = 'Proposal'  # Capitalize for Bubble API
    elif endpoint == 'user':
        api_endpoint = 'user'  # Use lowercase for user endpoint
            
    client = BubbleAPIClient()
    all_data = client.fetch_all_data(api_endpoint)
        
    # Run appropriate checks based on endpoint type
    if endpoint == 'listing':
        # Run listing checks
        check_results = ListingChecks.run_all_checks(all_data)
        report = ListingChecks.generate_report(check_results)
    elif endpoint == 'property':
        # Run property checks
        check_results = PropertyChecks.run_all_checks(all_data)
        report = PropertyChecks.generate_report(check_results)
    elif endpoint == 'proposal':
        # Run proposal checks
        check_results = ProposalChecks.run_all_checks(all_data)
        report = ProposalChecks.generate_report(check_results)
    elif endpoint == 'user':
        # Run user checks
        check_results = UserChecks.run_all_checks(all_data)
        report = UserChecks.generate_report(check_results)
    else:
        # For now, just count the entries for other endpoints
        count = len(all_data)
        report = f"📊 {endpoint.capitalize()} Count Report:\n    - Total {endpoint.capitalize()} Found: {count}"
        logger.info(f"Found {count} {endpoint} entries")
        
    # Log the report
    logger.info(report)
        
    # Always log summary to console
    print(report)
    
    return report  # Return the report instead of sending it to Slack

# Entry point when run as a module
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run database checks on Bubble API data')
    parser.add_argument(
        'endpoint', 
        nargs='?', 
        default='listing',
        choices=['listing', 'property', 'proposal', 'user', 'transaction', 'all'],
        help='API endpoint to check (default: listing). Use "all" to run listing and proposal checks.'
    )
    parser.add_argument(
        '--dry-run', 
        action='store_true',
        help='Run without sending notifications to Slack'
    )
    
    args = parser.parse_args()
    
    if args.endpoint == 'all':
        run_checks('all', args.dry_run)
    else:
        report = run_checks(args.endpoint, args.dry_run)
        if not args.dry_run:
            send_to_slack(report)
            logger.info(f"{args.endpoint.capitalize()} report sent to Slack")
