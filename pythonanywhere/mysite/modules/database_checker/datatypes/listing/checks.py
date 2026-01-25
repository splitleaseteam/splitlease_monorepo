"""
Listing checks module for database_checker

This module contains specific validation functions for the listing data type.
Each function checks for a specific condition in listing data.
"""
import logging
import os
from typing import Dict, Any, List, Tuple
from ..checker_interface import DataCheckerInterface

logger = logging.getLogger('database_checker')

class ListingChecks(DataCheckerInterface):
    """
    Collection of check functions for listings
    
    Each method performs a specific validation on listing data
    and returns a boolean indicating if the check failed.
    """
    
    @staticmethod
    def has_empty_photos(listing: Dict[str, Any]) -> bool:
        """
        Check if a listing has empty 'Features - Photos' field
        
        Returns True if:
        - Field is missing
        - Field is empty list
        - Field is not a list type
        """
        photos = listing.get('Features - Photos')
        
        # Check if field exists
        if photos is None:
            return True
            
        # Check if it's a list
        if not isinstance(photos, list):
            return True
            
        # Check if it's empty
        return len(photos) == 0
    
    @staticmethod
    def has_no_user_creator(listing: Dict[str, Any]) -> bool:
        """
        Check if a listing has 'Created By' value equal to 'no_user'
        
        Returns True if:
        - 'Created By' field exists and equals 'no_user'
        """
        created_by = listing.get('Created By')
        return created_by == 'no_user'
    
    @staticmethod
    def has_empty_rental_type(listing: Dict[str, Any]) -> bool:
        """
        Check if a listing has empty 'rental type' field
        
        Returns True if:
        - Field is missing
        - Field is empty string
        - Field is None
        """
        rental_type = listing.get('rental type')
        
        # Check if field exists and has content
        if rental_type is None or rental_type == "":
            return True
            
        return False
    
    @staticmethod
    def has_empty_pricing_list(listing: Dict[str, Any]) -> bool:
        """
        Check if a listing has empty 'pricing_list' field
        
        Returns True if:
        - Field is missing
        - Field is empty string
        - Field is None
        """
        pricing_list = listing.get('pricing_list')
        
        # Check if field exists and has content
        if pricing_list is None or pricing_list == "":
            return True
            
        return False

    @classmethod
    def run_all_checks(cls, listings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Run all checks against a list of listings
        
        Args:
            listings: List of listing objects to check
            
        Returns:
            Dictionary with counts of listings failing each check and IDs for specific checks
        """
        total_count = len(listings)
        empty_photos_count = sum(1 for listing in listings if cls.has_empty_photos(listing))
        no_user_count = sum(1 for listing in listings if cls.has_no_user_creator(listing))
        empty_pricing_list_count = sum(1 for listing in listings if cls.has_empty_pricing_list(listing))
        
        # For empty rental type, collect both count and listing IDs
        empty_rental_type_listings = []
        for listing in listings:
            if cls.has_empty_rental_type(listing):
                # If listing has _id, add it to the list
                if '_id' in listing:
                    empty_rental_type_listings.append(listing['_id'])
        
        empty_rental_type_count = len(empty_rental_type_listings)
        
        # Debug print to see what IDs we've collected
        print(f"\n[DEBUG] Found {empty_rental_type_count} listings with empty rental type")
        print(f"[DEBUG] ID list contains {len(empty_rental_type_listings)} items")
        if empty_rental_type_listings:
            print(f"[DEBUG] First few IDs: {empty_rental_type_listings[:5]}")
        
        # URL to view and edit listings with missing rental types
        rental_type_url = os.getenv('LISTINGS_URL')
        # Format as plain URL for console and logs
        rental_type_link = rental_type_url
        # Format as Slack-clickable link for the report - using exact Slack markup format
        slack_link = f"<{rental_type_url}|Click here to view & edit listings>"
        
        # Log counts
        logger.info(f"Found {empty_photos_count} listings without photos out of {total_count} total listings")
        logger.info(f"Found {no_user_count} listings created by 'no_user' out of {total_count} total listings")
        logger.info(f"Found {empty_rental_type_count} listings with empty rental type out of {total_count} total listings")
        logger.info(f"Found {empty_pricing_list_count} listings with empty pricing list out of {total_count} total listings")
        logger.info(f"Listings with empty rental type can be viewed and edited at: {rental_type_link}")
        
        # IMPORTANT: Direct console output for immediate visibility - using print statements
        print("\n" + "="*80)
        print(f"FOUND {empty_rental_type_count} LISTINGS WITH MISSING RENTAL TYPE")
        print(f"View and edit these listings at: {rental_type_link}")
        print("="*80)
        
        # Explicitly print IDs of listings with empty rental type
        if empty_rental_type_listings:
            print("\nLISTING IDs WITH MISSING RENTAL TYPE:")
            for idx, listing_id in enumerate(empty_rental_type_listings, 1):
                print(f"{idx}. {listing_id}")
            
            # Also log it
            id_list = ", ".join(empty_rental_type_listings)
            logger.info(f"Listing IDs with empty rental type: {id_list}")
            
            # Print a separator for better visibility
            print("="*80 + "\n")
        
        return {
            'total': total_count,
            'empty_photos': empty_photos_count,
            'no_user': no_user_count,
            'empty_rental_type': empty_rental_type_count,
            'empty_rental_type_ids': empty_rental_type_listings,
            'empty_pricing_list': empty_pricing_list_count,
            'rental_type_link': rental_type_link,
            'slack_link': slack_link
        }
    
    @staticmethod
    def generate_report(check_results: Dict[str, Any]) -> str:
        """
        Generate a formatted report based on check results
        
        Args:
            check_results: Dictionary with check counts and IDs
            
        Returns:
            Formatted report string
        """
        total = check_results['total']
        empty_photos = check_results['empty_photos']
        no_user = check_results['no_user']
        empty_rental_type = check_results['empty_rental_type']
        empty_pricing_list = check_results.get('empty_pricing_list', 0)
        
        # Get the URL for viewing listings
        url = os.getenv('LISTINGS_URL')
        
        # Base report without links at the top
        report = f'''📊 *Listing Count Report* 

    - Total Listings Found: {total}
    - Listings Without Photos: {empty_photos} ({(empty_photos/total)*100:.1f}% of total)
    - Listings with no attached users: {no_user} ({(no_user/total)*100:.1f}% of total)
    - Listings with empty rental type: {empty_rental_type} ({(empty_rental_type/total)*100:.1f}% of total)
    - Listings with empty pricing list: {empty_pricing_list} ({(empty_pricing_list/total)*100:.1f}% of total)'''
        
        # Add a warning section if there are listings with empty rental type
        if empty_rental_type > 0:
            report += f'''

⚠️ *ATTENTION: {empty_rental_type} LISTINGS WITH MISSING RENTAL TYPE* ⚠️
{url}'''
        
        return report
