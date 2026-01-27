#!/usr/bin/env python3
import sys
from pathlib import Path
import argparse
import logging

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from modules.database_checker.main import run_checks, send_to_slack, setup_slack_logging
logger = logging.getLogger(__name__)

def main():
    """Parse command line arguments and run database checks"""
    parser = argparse.ArgumentParser(description='Run database checks')
    parser.add_argument('--dry-run', action='store_true', help='Run without sending notifications')
    parser.add_argument('--check-type', choices=['all', 'listing', 'proposal', 'user'], 
                        default='all', help='Specify which data type to check')
    args = parser.parse_args()
    
    try:
        # Setup Slack integration if not in dry-run mode
        if not args.dry_run:
            setup_slack_logging(logger)
        else:
            logger.info("Running in dry-run mode (no Slack notifications)")
        
        if args.check_type == 'all':
            # Run all checks and collect reports
            listing_report = run_checks(endpoint='listing', dry_run=True)  # Set dry_run=True to prevent individual sending
            proposal_report = run_checks(endpoint='proposal', dry_run=True)
            user_report = run_checks(endpoint='user', dry_run=True)
            
            # Combine reports
            combined_report = f"{listing_report}\n\n{proposal_report}\n\n{user_report}"
        else:
            # Run only the specified check
            combined_report = run_checks(endpoint=args.check_type, dry_run=True)
        
        # Log the report
        logger.info("Report generated")
        
        # Send the report to Slack if not in dry-run mode
        if not args.dry_run:
            send_to_slack(combined_report)
            logger.info("Report sent to Slack")
    except Exception as e:
        logger.error(f"Fatal error occurred: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
