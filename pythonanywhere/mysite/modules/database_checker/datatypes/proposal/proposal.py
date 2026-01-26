"""
Proposal data validator module

This module contains the validator for proposal data.
"""
from ..base import DataValidator
import logging

logger = logging.getLogger('database_checker')

class ProposalDataValidator(DataValidator):
    """
    Validator for proposal data
    
    Simplified to only validate basic structure while being tolerant of variations
    """
    
    # Minimal required fields
    REQUIRED_FIELDS = ['_id']
    
    # Core fields - simplified validation
    FIELD_TYPES = {
        '_id': (str, int)
    }
    
    @classmethod
    def validate(cls, entry: dict) -> dict:
        """
        Validate a proposal entry
        
        Returns a dictionary with validation results and any errors
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
