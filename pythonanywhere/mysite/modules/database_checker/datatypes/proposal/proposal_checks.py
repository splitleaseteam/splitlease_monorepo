"""
Proposal checks module for database_checker

This module contains specific validation functions for the proposal data type.
Each function checks for a specific condition in proposal data.
"""
import logging
import json
import os  # Added to fetch PROPOSALS_URL from environment
from typing import Dict, Any, List, Tuple
from ..checker_interface import DataCheckerInterface

logger = logging.getLogger('database_checker')

class ProposalChecks(DataCheckerInterface):
    """
    Collection of check functions for proposals
    
    Each method performs a specific validation on proposal data
    and returns a boolean indicating if the check failed.
    """
    
    @staticmethod
    def has_empty_host_and_listing(proposal: Dict[str, Any]) -> bool:
        """
        Check if a proposal has both empty 'Host - Account' and 'Listing' fields
        
        Returns True if:
        - Both fields are missing, None, or empty string
        """
        host_account = proposal.get('Host - Account')
        listing = proposal.get('Listing')
        
        # Check if both fields are empty (None or empty string)
        host_empty = host_account is None or host_account == ""
        listing_empty = listing is None or listing == ""
        
        return host_empty and listing_empty
    
    @classmethod
    def run_all_checks(cls, proposals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Run all checks against a list of proposals
        
        Args:
            proposals: List of proposal objects to check
            
        Returns:
            Dictionary with counts of proposals failing each check and IDs for specific checks
        """
        total_count = len(proposals)
        
        # For empty host and listing, collect both count and proposal IDs
        empty_host_listing_proposals = []
        for proposal in proposals:
            if cls.has_empty_host_and_listing(proposal):
                # If proposal has _id, add it to the list
                if '_id' in proposal:
                    empty_host_listing_proposals.append(proposal['_id'])
        
        empty_host_listing_count = len(empty_host_listing_proposals)
        
        # Debug print to see what IDs we've collected
        print(f"\n[DEBUG] Found {empty_host_listing_count} proposals with empty Host and Listing")
        print(f"[DEBUG] ID list contains {len(empty_host_listing_proposals)} items")
        if empty_host_listing_proposals:
            print(f"[DEBUG] First few IDs: {empty_host_listing_proposals[:5]}")
        
        # Read proposals URL from environment
        proposals_url = os.getenv('PROPOSALS_URL')
        # Format as plain URL for console and logs
        proposals_link = proposals_url
        # Format as Slack-clickable link for the report - using exact Slack markup format
        slack_link = f"<{proposals_url}|Click here to view & edit proposals>"
        
        # Log counts
        logger.info(f"Found {empty_host_listing_count} proposals with empty Host and Listing out of {total_count} total proposals")
        logger.info(f"Proposals with empty Host and Listing can be viewed and edited at: {proposals_link}")
        
        # IMPORTANT: Direct console output for immediate visibility - using print statements
        print("\n" + "="*80)
        print(f"FOUND {empty_host_listing_count} PROPOSALS WITH MISSING HOST AND LISTING")
        print(f"View and edit these proposals at: {proposals_link}")
        print("="*80)
        
        # Explicitly print IDs of proposals with empty host and listing
        if empty_host_listing_proposals:
            print("\nPROPOSAL IDs WITH MISSING HOST AND LISTING:")
            for idx, proposal_id in enumerate(empty_host_listing_proposals, 1):
                print(f"{idx}. {proposal_id}")
            
            # Also log it
            id_list = ", ".join(empty_host_listing_proposals)
            logger.info(f"Proposal IDs with empty Host and Listing: {id_list}")
            
            # Print a separator for better visibility
            print("="*80 + "\n")
        
        return {
            'total': total_count,
            'empty_host_listing': empty_host_listing_count,
            'empty_host_listing_ids': empty_host_listing_proposals,
            'proposals_link': proposals_link,
            'slack_link': slack_link
        }
    
    @staticmethod
    def generate_report(check_results: Dict[str, Any]) -> str:
        total = check_results['total']
        empty_host_listing = check_results['empty_host_listing']
        # Read proposals URL from environment
        url = os.getenv('PROPOSALS_URL')
        
        report = (
            f"📊 *Proposal Count Report*\n"
            f"\n• Total Proposals Found: {total}"
            f"\n• Proposals with empty Host and Listing: {empty_host_listing} ({(empty_host_listing/total)*100:.1f}% of total)"
        )
        
        if empty_host_listing > 0:
            report += f"\n\n⚠️ *ATTENTION: {empty_host_listing} PROPOSALS NEED REVIEW* ⚠️\n{url}"
        
        return report
