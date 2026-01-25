class DataValidator:
    REQUIRED_FIELDS = []
    FIELD_TYPES = {}

    @classmethod
    def validate(cls, entry: dict) -> dict:
        """
        Base validation method for data entries
        
        Args:
            entry: Dictionary containing data to validate
            
        Returns:
            dict: Validation results with valid flag and errors list
        """
        errors = []
        
        # Ensure entry is a dictionary
        if not isinstance(entry, dict):
            return {
                'valid': False,
                'errors': [f'Expected dict but got {type(entry).__name__}']
            }

        # Check required fields
        for field in cls.REQUIRED_FIELDS:
            if field not in entry:
                errors.append(f'Missing required field: {field}')

        # Check field types
        for field, allowed_types in cls.FIELD_TYPES.items():
            # Skip validation if field is not present
            if field not in entry:
                continue
                
            value = entry.get(field)
            
            # Convert single type to tuple if necessary
            if isinstance(allowed_types, type):
                allowed_types = (allowed_types,)
            
            # Skip validation for None values if allowed
            if value is None and type(None) in allowed_types:
                continue
                
            # For string values that should be numeric
            if isinstance(value, str) and any(t in allowed_types for t in (int, float)):
                try:
                    # Check if string can be converted to a number
                    float(value.replace('$', '').replace(',', ''))
                    continue
                except (ValueError, TypeError):
                    pass
                    
            # For numeric values that should be boolean
            if isinstance(value, (int, float)) and bool in allowed_types:
                continue
                
            # For string values that should be boolean
            if isinstance(value, str) and bool in allowed_types:
                if value.lower() in ('true', 'false', 'yes', 'no', '1', '0'):
                    continue
            
            # Standard type check
            if not isinstance(value, allowed_types):
                type_names = [t.__name__ for t in allowed_types if t != type(None)]
                error_msg = f'Invalid type for {field}: expected {" or ".join(type_names)}'
                if isinstance(value, (dict, list)):
                    error_msg += f', got {type(value).__name__} with {len(value)} items'
                else:
                    error_msg += f', got {type(value).__name__}'
                errors.append(error_msg)

        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
