"""
Listing data validator module

Provides validation for listing data from the Bubble API.
"""
from ..base import DataValidator
import logging

logger = logging.getLogger('database_checker')

class ListingDataValidator(DataValidator):
    """
    Validator for listing data
    
    Simplified to only count listings without performing complex validation
    """
    
    # Minimal required fields - only need ID to count as a valid listing
    REQUIRED_FIELDS = ['_id']
    
    # Core fields - simplified to just validate ID exists
    FIELD_TYPES = {
        '_id': (str, int)
    }
    
    @classmethod
    def validate(cls, entry):
        """
        Validate a listing entry with minimal requirements
        
        This is a simplified validator that only checks essential fields
        """
        return super().validate(entry)
