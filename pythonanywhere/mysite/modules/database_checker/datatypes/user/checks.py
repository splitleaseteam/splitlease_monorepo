"""
User checks module for database_checker

This module contains specific validation functions for the user data type.
Each function checks for a specific condition in user data.
"""
import logging
from typing import Dict, Any, List
from ..checker_interface import DataCheckerInterface

logger = logging.getLogger('database_checker')

class UserChecks(DataCheckerInterface):
    """
    Collection of check functions for users
    
    Each method performs a specific validation on user data
    and returns a boolean indicating if the check failed.
    """
    
    @staticmethod
    def has_missing_email(user_data: Dict[str, Any]) -> bool:
        """
        Check if a user has missing email
        
        Returns True if:
        - 'Email' field is missing or empty
        """
        email = user_data.get('Email')
        return email is None or email == ""
    
    @staticmethod
    def has_incomplete_profile(user_data: Dict[str, Any]) -> bool:
        """
        Check if a user has incomplete profile
        
        Returns True if:
        - Required profile fields are missing or empty
        """
        # Define required profile fields
        required_fields = ['First Name', 'Last Name', 'Phone']
        
        # Check each required field
        for field in required_fields:
            value = user_data.get(field)
            if value is None or value == "":
                return True
                
        return False
    
    @classmethod
    def run_all_checks(cls, users: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Run all checks against a list of users
        
        Args:
            users: List of user objects to check
            
        Returns:
            Dictionary with counts of users failing each check
        """
        total_count = len(users)
        missing_email_count = sum(1 for user in users if cls.has_missing_email(user))
        incomplete_profile_count = sum(1 for user in users if cls.has_incomplete_profile(user))
        
        # Log counts
        logger.info(f"Found {missing_email_count} users with missing email out of {total_count} total users")
        logger.info(f"Found {incomplete_profile_count} users with incomplete profiles out of {total_count} total users")
        
        return {
            'total': total_count,
            'missing_email': missing_email_count,
            'incomplete_profile': incomplete_profile_count
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
        missing_email = check_results['missing_email']
        incomplete_profile = check_results['incomplete_profile']
        
        # Avoid division by zero
        if total == 0:
            return f"📊 User Validation Report:\n    - No users found to validate"
            
        return f'''📊 User Validation Report:
    - Total Users Found: {total}
    - Users With Missing Email: {missing_email} ({(missing_email/total)*100:.1f}% of total)
    - Users With Incomplete Profiles: {incomplete_profile} ({(incomplete_profile/total)*100:.1f}% of total)
    '''
