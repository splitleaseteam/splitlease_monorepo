from .base import DataValidator
from datetime import datetime

class UserDataValidator(DataValidator):
    REQUIRED_FIELDS = ['id', 'email', 'created_date']
    FIELD_TYPES = {
        'id': str,
        'email': str,
        'created_date': datetime
    }

    @classmethod
    def validate(cls, entry: dict) -> dict:
        base_result = super().validate(entry)
        custom_errors = []

        # Custom validation for email format
        if '@' not in entry.get('email', ''):
            custom_errors.append('Invalid email format')

        return {
            'valid': base_result['valid'] and len(custom_errors) == 0,
            'errors': base_result['errors'] + custom_errors
        }
