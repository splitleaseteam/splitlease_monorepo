"""
Listing checks module for database_checker

This module contains specific validation functions for the listing data type.
Each function checks for a specific condition in listing data.
"""
import logging
import os
from typing import Dict, Any, List, Tuple
from .checker_interface import DataCheckerInterface

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
        Check if a listing has empty 'Pricing List' field
        
        Returns True if:
        - Field is missing
        - Field is empty list
        - Field is not a list type
        """
        pricing_list = listing.get('Pricing List')
        
        # Check if field exists
        if pricing_list is None:
            return True
            
        # Check if it's a list
        if not isinstance(pricing_list, list):
            return True
            
        # Check if it's empty
        return len(pricing_list) == 0

    @staticmethod
    def is_null_or_zero(value: Any) -> bool:
        """Helper to check if a value is None or zero."""
        return value is None or value == 0

    @staticmethod
    def check_field_if_complete(listing: Dict[str, Any], field_name: str, check_for_zero: bool = False) -> bool:
        """
        Generic check for a field if the listing is 'Complete'.
        Returns True if the check fails (field is null, or null/zero if specified).
        """
        if not listing.get("Complete", False):  # Only check if "Complete" is true
            return False

        value = listing.get(field_name)
        if check_for_zero:
            return ListingChecks.is_null_or_zero(value)
        return value is None

    @staticmethod
    def has_null_borough_if_complete(listing: Dict[str, Any]) -> bool:
        return ListingChecks.check_field_if_complete(listing, "Location - Borough")

    @staticmethod
    def has_null_or_zero_guests_if_complete(listing: Dict[str, Any]) -> bool:
        return ListingChecks.check_field_if_complete(listing, "Features - Qty Guests", check_for_zero=True)

    @staticmethod
    def has_null_or_zero_bedrooms_if_complete(listing: Dict[str, Any]) -> bool:
        return ListingChecks.check_field_if_complete(listing, "Features - Qty Bedrooms", check_for_zero=True)

    @staticmethod
    def has_null_or_zero_beds_if_complete(listing: Dict[str, Any]) -> bool:
        return ListingChecks.check_field_if_complete(listing, "Features - Qty Beds", check_for_zero=True)

    @staticmethod
    def has_null_or_zero_bathrooms_if_complete(listing: Dict[str, Any]) -> bool:
        return ListingChecks.check_field_if_complete(listing, "Features - Qty Bathrooms", check_for_zero=True)

    @staticmethod
    def has_null_state_if_complete(listing: Dict[str, Any]) -> bool:
        return ListingChecks.check_field_if_complete(listing, "Location - State")

    @staticmethod
    def has_null_hood_if_complete(listing: Dict[str, Any]) -> bool:
        return ListingChecks.check_field_if_complete(listing, "Location - Hood")

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

        # Initialize lists for new checks
        empty_rental_type_listings = []
        null_borough_listings = []
        null_or_zero_guests_listings = []
        null_or_zero_bedrooms_listings = []
        null_or_zero_beds_listings = []
        null_or_zero_bathrooms_listings = []
        null_state_listings = []
        null_hood_listings = []
        for listing in listings:
            if cls.has_empty_rental_type(listing):
                if '_id' in listing:
                    empty_rental_type_listings.append(listing['_id'])
            
            # New checks (only if 'Complete' is true)
            if listing.get("Complete", False):
                if cls.has_null_borough_if_complete(listing):
                    if '_id' in listing: null_borough_listings.append(listing['_id'])
                if cls.has_null_or_zero_guests_if_complete(listing):
                    if '_id' in listing: null_or_zero_guests_listings.append(listing['_id'])
                if cls.has_null_or_zero_bedrooms_if_complete(listing):
                    if '_id' in listing: null_or_zero_bedrooms_listings.append(listing['_id'])
                if cls.has_null_or_zero_beds_if_complete(listing):
                    if '_id' in listing: null_or_zero_beds_listings.append(listing['_id'])
                if cls.has_null_or_zero_bathrooms_if_complete(listing):
                    if '_id' in listing: null_or_zero_bathrooms_listings.append(listing['_id'])
                if cls.has_null_state_if_complete(listing):
                    if '_id' in listing: null_state_listings.append(listing['_id'])
                if cls.has_null_hood_if_complete(listing):
                    if '_id' in listing: null_hood_listings.append(listing['_id'])
        
        empty_rental_type_count = len(empty_rental_type_listings)
        null_borough_count = len(null_borough_listings)
        null_or_zero_guests_count = len(null_or_zero_guests_listings)
        null_or_zero_bedrooms_count = len(null_or_zero_bedrooms_listings)
        null_or_zero_beds_count = len(null_or_zero_beds_listings)
        null_or_zero_bathrooms_count = len(null_or_zero_bathrooms_listings)
        null_state_count = len(null_state_listings)
        null_hood_count = len(null_hood_listings)

        # Debug print to see what IDs we've collected
        print(f"\n[DEBUG] Found {empty_rental_type_count} listings with empty rental type")
        print(f"[DEBUG] ID list contains {len(empty_rental_type_listings)} items")
        if empty_rental_type_listings:
            print(f"[DEBUG] First few IDs: {empty_rental_type_listings[:5]}")
        
        # URL to view and edit listings with missing rental types
        rental_type_url = os.getenv("LISTINGS_URL")
        # Format as plain URL for console and logs
        rental_type_link = rental_type_url
        # Format as Slack-clickable link for the report - using exact Slack markup format
        slack_link = f"<{rental_type_url}|Click here to view & edit listings>"
        
        # Log counts
        logger.info(f"Found {empty_photos_count} listings without photos out of {total_count} total listings")
        logger.info(f"Found {no_user_count} listings created by 'no_user' out of {total_count} total listings")
        logger.info(f"Found {empty_rental_type_count} listings with empty rental type out of {total_count} total listings")
        logger.info(f"Found {empty_pricing_list_count} listings with empty pricing list out of {total_count} total listings")
        logger.info(f"Found {null_borough_count} 'Complete' listings with null Borough out of {total_count} total listings")
        logger.info(f"Found {null_or_zero_guests_count} 'Complete' listings with null/0 Guests out of {total_count} total listings")
        logger.info(f"Found {null_or_zero_bedrooms_count} 'Complete' listings with null/0 Bedrooms out of {total_count} total listings")
        logger.info(f"Found {null_or_zero_beds_count} 'Complete' listings with null/0 Beds out of {total_count} total listings")
        logger.info(f"Found {null_or_zero_bathrooms_count} 'Complete' listings with null/0 Bathrooms out of {total_count} total listings")
        logger.info(f"Found {null_state_count} 'Complete' listings with null State out of {total_count} total listings")
        logger.info(f"Found {null_hood_count} 'Complete' listings with null Hood out of {total_count} total listings")
        logger.info(f"Listings with empty rental type can be viewed and edited at: {rental_type_link}")
        
        # IMPORTANT: Direct console output for immediate visibility - using print statements
        print("\n" + "="*80)
        print(f"FOUND {empty_rental_type_count} LISTINGS WITH MISSING RENTAL TYPE")
        print(f"FOUND {null_borough_count} 'COMPLETE' LISTINGS WITH NULL 'Location - Borough'")
        print(f"FOUND {null_or_zero_guests_count} 'COMPLETE' LISTINGS WITH NULL/0 'Features - Qty Guests'")
        print(f"FOUND {null_or_zero_bedrooms_count} 'COMPLETE' LISTINGS WITH NULL/0 'Features - Qty Bedrooms'")
        print(f"FOUND {null_or_zero_beds_count} 'COMPLETE' LISTINGS WITH NULL/0 'Features - Qty Beds'")
        print(f"FOUND {null_or_zero_bathrooms_count} 'COMPLETE' LISTINGS WITH NULL/0 'Features - Qty Bathrooms'")
        print(f"FOUND {null_state_count} 'COMPLETE' LISTINGS WITH NULL 'Location - State'")
        print(f"FOUND {null_hood_count} 'COMPLETE' LISTINGS WITH NULL 'Location - Hood'")
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
            'null_borough_count': null_borough_count,
            'null_borough_ids': null_borough_listings,
            'null_or_zero_guests_count': null_or_zero_guests_count,
            'null_or_zero_guests_ids': null_or_zero_guests_listings,
            'null_or_zero_bedrooms_count': null_or_zero_bedrooms_count,
            'null_or_zero_bedrooms_ids': null_or_zero_bedrooms_listings,
            'null_or_zero_beds_count': null_or_zero_beds_count,
            'null_or_zero_beds_ids': null_or_zero_beds_listings,
            'null_or_zero_bathrooms_count': null_or_zero_bathrooms_count,
            'null_or_zero_bathrooms_ids': null_or_zero_bathrooms_listings,
            'null_state_count': null_state_count,
            'null_state_ids': null_state_listings,
            'null_hood_count': null_hood_count,
            'null_hood_ids': null_hood_listings,
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
        empty_rental_type_ids = check_results.get('empty_rental_type_ids', [])

        null_borough_count = check_results.get('null_borough_count', 0)
        null_or_zero_guests_count = check_results.get('null_or_zero_guests_count', 0)
        null_or_zero_bedrooms_count = check_results.get('null_or_zero_bedrooms_count', 0)
        null_or_zero_beds_count = check_results.get('null_or_zero_beds_count', 0)
        null_or_zero_bathrooms_count = check_results.get('null_or_zero_bathrooms_count', 0)
        null_state_count = check_results.get('null_state_count', 0)
        null_hood_count = check_results.get('null_hood_count', 0)
        
        # Use Slack formatted link if available, otherwise create a default one
        if 'slack_link' in check_results:
            slack_link = check_results['slack_link']
        else:
            url = os.getenv('LISTINGS_URL')
            slack_link = f"<{url}|Click here to view & edit listings>"
        
        # Base report without links at the top
        report = f'''📊 *Listing Count Report*

    - Total Listings Found: {total}
    - Listings Without Photos: {empty_photos} ({((empty_photos/total)*100 if total > 0 else 0.0):.1f}% of total)
    - Listings with no attached users: {no_user} ({((no_user/total)*100 if total > 0 else 0.0):.1f}% of total)
    - Listings with empty rental type: {empty_rental_type} ({((empty_rental_type/total)*100 if total > 0 else 0.0):.1f}% of total)
    - Listings with empty pricing list: {empty_pricing_list} ({((empty_pricing_list/total)*100 if total > 0 else 0.0):.1f}% of total)
    - 'Complete' listings with null 'Location - Borough': {null_borough_count} ({((null_borough_count/total)*100 if total > 0 else 0.0):.1f}% of total)
    - 'Complete' listings with null/0 'Features - Qty Guests': {null_or_zero_guests_count} ({((null_or_zero_guests_count/total)*100 if total > 0 else 0.0):.1f}% of total)
    - 'Complete' listings with null/0 'Features - Qty Bedrooms': {null_or_zero_bedrooms_count} ({((null_or_zero_bedrooms_count/total)*100 if total > 0 else 0.0):.1f}% of total)
    - 'Complete' listings with null/0 'Features - Qty Beds': {null_or_zero_beds_count} ({((null_or_zero_beds_count/total)*100 if total > 0 else 0.0):.1f}% of total)
    - 'Complete' listings with null/0 'Features - Qty Bathrooms': {null_or_zero_bathrooms_count} ({((null_or_zero_bathrooms_count/total)*100 if total > 0 else 0.0):.1f}% of total)
    - 'Complete' listings with null 'Location - State': {null_state_count} ({((null_state_count/total)*100 if total > 0 else 0.0):.1f}% of total)
    - 'Complete' listings with null 'Location - Hood': {null_hood_count} ({((null_hood_count/total)*100 if total > 0 else 0.0):.1f}% of total)'''
        
        # Add a warning section if there are listings with empty rental type
        if empty_rental_type > 0 or empty_photos > 0 or no_user > 0 or empty_pricing_list > 0 or \
           null_borough_count > 0 or null_or_zero_guests_count > 0 or null_or_zero_bedrooms_count > 0 or \
           null_or_zero_beds_count > 0 or null_or_zero_bathrooms_count > 0 or null_state_count > 0 or \
           null_hood_count > 0:
            report += '\n\n⚠️ *ATTENTION: DATA QUALITY ISSUES FOUND* ⚠️\n'
            if empty_photos > 0:
                report += f"• {empty_photos} listings without photos\n"
            if no_user > 0:
                report += f"• {no_user} listings with no attached users\n"
            if empty_rental_type > 0:
                report += f"• {empty_rental_type} listings with empty rental type\n"
            if empty_pricing_list > 0:
                report += f"• {empty_pricing_list} listings with empty pricing list\n"
            if null_borough_count > 0:
                report += f"• {null_borough_count} 'Complete' listings with null 'Location - Borough'\n"
            if null_or_zero_guests_count > 0:
                report += f"• {null_or_zero_guests_count} 'Complete' listings with null/0 'Features - Qty Guests'\n"
            if null_or_zero_bedrooms_count > 0:
                report += f"• {null_or_zero_bedrooms_count} 'Complete' listings with null/0 'Features - Qty Bedrooms'\n"
            if null_or_zero_beds_count > 0:
                report += f"• {null_or_zero_beds_count} 'Complete' listings with null/0 'Features - Qty Beds'\n"
            if null_or_zero_bathrooms_count > 0:
                report += f"• {null_or_zero_bathrooms_count} 'Complete' listings with null/0 'Features - Qty Bathrooms'\n"
            if null_state_count > 0:
                report += f"• {null_state_count} 'Complete' listings with null 'Location - State'\n"
            if null_hood_count > 0:
                report += f"• {null_hood_count} 'Complete' listings with null 'Location - Hood'\n"
            report += f"\n{slack_link}"
        
        return report
