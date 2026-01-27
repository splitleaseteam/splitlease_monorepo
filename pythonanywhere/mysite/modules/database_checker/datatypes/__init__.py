from .base import DataValidator
from .listing import ListingDataValidator, ListingChecks
from .property import PropertyDataValidator, PropertyChecks
from .user import UserChecks
from .checker_interface import DataCheckerInterface
import logging

logger = logging.getLogger('database_checker')

__all__ = [
    'DataValidator', 
    'ListingDataValidator', 
    'PropertyDataValidator', 
    'validate_all', 
    'DataCheckerInterface',
    'ListingChecks',
    'PropertyChecks',
    'UserChecks'
]

def validate_all(entries: list) -> dict:
    """
    Validate multiple entries using the appropriate validator based on entry type
    
    Args:
        entries: List of data entries to validate
        
    Returns:
        dict: Validation results with counts and errors
    """
    results = {
        'total': len(entries),
        'success_rate': 0.0,
        'error_count': 0,
        'errors': []
    }

    if not entries:
        return results

    for entry in entries:
        # Determine the appropriate validator for this entry
        validator = _select_validator(entry)
        
        # Validate the entry
        validation_result = validator.validate(entry)
        
        if not validation_result['valid']:
            results['error_count'] += 1
            results['errors'].extend(validation_result['errors'])

    if results['total'] > 0:
        results['success_rate'] = (results['total'] - results['error_count']) / results['total']
    
    return results

def _select_validator(entry):
    """
    Select the appropriate validator based on entry structure
    
    This function examines the entry to determine if it's a listing, property,
    or other data type and returns the appropriate validator class.
    """
    # Default to listing validator for safety
    validator = ListingDataValidator
    
    # Simple heuristic: 
    # If it has 'address' as a top-level field but no 'Name', it's probably a property
    if isinstance(entry, dict):
        if 'address' in entry and 'Name' not in entry:
            validator = PropertyDataValidator
    
    return validator
