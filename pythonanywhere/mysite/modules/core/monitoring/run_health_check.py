#!/usr/bin/env python3
"""
Command-line script to run health checks.
Usage: python run_health_check.py [base_url]
"""

import os
import sys
import asyncio
import logging
from typing import Optional

# Add the root directory to Python path
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, root_dir)

from modules.core.monitoring.health_check import EndpointHealthChecker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_health_check(base_url: Optional[str] = None) -> int:
    """Run health checks and return exit code."""
    try:
        # Initialize health checker
        checker = EndpointHealthChecker(base_url) if base_url else EndpointHealthChecker()
        logger.info(f"Starting endpoint health checks for {base_url or 'localhost'}")
        
        # Run checks
        results = await checker.check_all_endpoints()
        
        # Report results
        checker.report_to_slack(results)
        
        # Return appropriate exit code
        return 1 if any(not res['success'] for res in results.values()) else 0
        
    except Exception as e:
        logger.error(f"Health check script failed: {str(e)}")
        return 1

def main():
    """Main entry point for the script."""
    # Get base URL from command line if provided
    base_url = sys.argv[1] if len(sys.argv) > 1 else None
    
    # Run health checks
    exit_code = asyncio.run(run_health_check(base_url))
    sys.exit(exit_code)

if __name__ == '__main__':
    main()
