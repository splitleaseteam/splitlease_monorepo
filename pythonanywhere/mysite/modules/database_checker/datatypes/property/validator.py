"""
Property data validator module

Provides validation for property data from the Bubble API.
"""
from ..base import DataValidator
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
        'zip_code': (str, int, type(None))
    }
    
    @classmethod
    def validate(cls, entry):
        """
        Validate a property entry
        
        Uses flexible type validation to handle variations in property data
        """
        return super().validate(entry)
