"""
Property checks module for database_checker

This module contains specific validation functions for the property data type.
Each function checks for a specific condition in property data.
"""
import logging
from typing import Dict, Any, List
from .checker_interface import DataCheckerInterface

logger = logging.getLogger('database_checker')

class PropertyChecks(DataCheckerInterface):
    """
    Collection of check functions for properties
    
    Each method performs a specific validation on property data
    and returns a boolean indicating if the check failed.
    """
    
    @staticmethod
    def has_missing_address(property_data: Dict[str, Any]) -> bool:
        """
        Check if a property has missing address information
        
        Returns True if:
        - 'Location - Address' field is missing
        - 'Location - Address' is not a dictionary
        - Required address components are missing
        """
        address = property_data.get('Location - Address')
        
        # Check if field exists
        if address is None:
            return True
            
        # Check if it's a dictionary
        if not isinstance(address, dict):
            return True
            
        # Check if required components exist
        required_components = ['address', 'lat', 'lng']
        for component in required_components:
            if component not in address or not address[component]:
                return True
                
        return False
    
    @staticmethod
    def has_missing_zip_code(property_data: Dict[str, Any]) -> bool:
        """
        Check if a property has missing zip code
        
        Returns True if:
        - 'Location - Zip Code' field is missing or empty
        """
        zip_code = property_data.get('Location - Zip Code')
        return zip_code is None or zip_code == ""
    
    @classmethod
    def run_all_checks(cls, properties: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Run all checks against a list of properties
        
        Args:
            properties: List of property objects to check
            
        Returns:
            Dictionary with counts of properties failing each check
        """
        total_count = len(properties)
        missing_address_count = sum(1 for prop in properties if cls.has_missing_address(prop))
        missing_zip_count = sum(1 for prop in properties if cls.has_missing_zip_code(prop))
        
        # Log counts
        logger.info(f"Found {missing_address_count} properties with missing address out of {total_count} total properties")
        logger.info(f"Found {missing_zip_count} properties with missing zip code out of {total_count} total properties")
        
        return {
            'total': total_count,
            'missing_address': missing_address_count,
            'missing_zip': missing_zip_count
        }
    
    @staticmethod
    def generate_report(check_results: Dict[str, int]) -> str:
        """
        Generate a formatted report based on check results
        
        Args:
            check_results: Dictionary with check counts
            
        Returns:
            Formatted report string
        """
        total = check_results['total']
        missing_address = check_results['missing_address']
        missing_zip = check_results['missing_zip']
        
        # Avoid division by zero
        if total == 0:
            return f"📊 Property Validation Report:\n    - No properties found to validate"
            
        return f'''📊 Property Validation Report:
    - Total Properties Found: {total}
    - Properties With Missing Address: {missing_address} ({(missing_address/total)*100:.1f}% of total)
    - Properties With Missing Zip Code: {missing_zip} ({(missing_zip/total)*100:.1f}% of total)
    '''
