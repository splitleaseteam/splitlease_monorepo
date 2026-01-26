from .base import DataValidator
import logging

logger = logging.getLogger('database_checker')

class PropertyDataValidator(DataValidator):
    """
    Validator for property data
    
    Only validates essential fields with flexible type handling
    """
    
    # Minimal required fields - only require ID
    REQUIRED_FIELDS = ['_id']
    
    # Core fields with flexible types
    FIELD_TYPES = {
        '_id': (str, int),
        'address': (str, type(None)),
        'city': (str, type(None)),
        'state': (str, type(None)),
        'zip': (str, int, type(None)),
        'country': (str, type(None)),
        'lat': (float, int, str, type(None)),
        'lng': (float, int, str, type(None))
    }
    
    @classmethod
    def validate(cls, entry: dict) -> dict:
        """
        Override the standard validation to add custom rules for properties
        """
        # First run standard validation
        result = super().validate(entry)
        
        # Skip further validation if basic validation already failed
        if not result['valid']:
            return result
            
        errors = result['errors']
        
        # Add any custom property validation logic here
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
