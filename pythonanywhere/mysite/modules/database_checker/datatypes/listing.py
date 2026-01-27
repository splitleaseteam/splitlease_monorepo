from .base import DataValidator
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
    def validate(cls, entry: dict) -> dict:
        """
        Override the standard validation to simply count listings
        """
        # Check if the entry has an ID - if it does, count it as valid
        if isinstance(entry, dict) and '_id' in entry:
            return {
                'valid': True,
                'errors': []
            }
        else:
            return {
                'valid': False,
                'errors': ["Entry missing '_id' field"]
            }
