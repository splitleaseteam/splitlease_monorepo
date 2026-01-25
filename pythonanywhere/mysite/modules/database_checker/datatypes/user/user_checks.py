"""
User checks module for database_checker

This module contains specific validation functions for the user data type.
Each function checks for a specific condition in user data.
"""
import logging
import os
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
    def has_trailing_space_in_first_name(user: Dict[str, Any]) -> bool:
        """
        Check if a user has trailing spaces in their 'Name - First' field
        
        Returns True if:
        - The 'Name - First' field exists and ends with a space
        """
        first_name = user.get('Name - First', '')
        
        # Skip if first name is None or empty
        if not first_name:
            return False
            
        # Check if the first name ends with a space
        return isinstance(first_name, str) and first_name.endswith(' ')
    
    @staticmethod
    def has_multiple_words_in_first_name(user: Dict[str, Any]) -> bool:
        """
        Check if a user has multiple space-separated words in their 'Name - First' field
        
        Returns True if:
        - The 'Name - First' field exists and contains at least one space between words
        """
        first_name = user.get('Name - First', '')
        
        # Skip if first name is None or empty
        if not first_name or not isinstance(first_name, str):
            return False
            
        # Trim leading and trailing spaces, then check if there are still spaces
        # This indicates multiple words
        trimmed = first_name.strip()
        return ' ' in trimmed

    @staticmethod
    def has_invalid_first_name(user: Dict[str, Any]) -> bool:
        """
        Check if a user has an invalid first name (empty or less than 2 chars)

        Returns True if:
        - 'Name - First' is missing, None, or an empty string
        - 'Name - First' has fewer than 2 characters
        """
        first_name = user.get('Name - First')
        if not first_name or not isinstance(first_name, str):
            return True  # Treat missing or non-string names as invalid
        
        return len(first_name.strip()) < 2

    @staticmethod
    def has_invalid_full_name(user: Dict[str, Any]) -> bool:
        """
        Check if a user has an invalid full name (empty or less than 3 chars)

        Returns True if:
        - 'Name - Full' is missing, None, or an empty string
        - 'Name - Full' has fewer than 3 characters
        """
        full_name = user.get('Name - Full')
        if not full_name or not isinstance(full_name, str):
            return True  # Treat missing or non-string names as invalid
        
        return len(full_name.strip()) < 3
    
    @classmethod
    def run_all_checks(cls, users: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Run all checks against a list of users
        
        Args:
            users: List of user objects to check
            
        Returns:
            Dictionary with counts of users failing each check and IDs for specific checks
        """
        total_count = len(users)
        
        # For users with trailing spaces in first name, collect both count and user IDs
        trailing_space_users = []
        multiple_words_users = []
        invalid_first_name_users = []
        invalid_full_name_users = []
        
        for user in users:
            # First check for multiple words in first name
            has_multiple_words = cls.has_multiple_words_in_first_name(user)
            
            if has_multiple_words:
                # If user has _id, add it to the list of multiple words users
                if '_id' in user:
                    user_id = user['_id']
                    first_name = user.get('Name - First', '')
                    multiple_words_users.append({
                        'id': user_id,
                        'first_name': first_name
                    })
            else:
                # Only check for trailing spaces if the name doesn't have multiple words
                if cls.has_trailing_space_in_first_name(user):
                    # If user has _id, add it to the list
                    if '_id' in user:
                        user_id = user['_id']
                        first_name = user.get('Name - First', '')
                        trailing_space_users.append({
                            'id': user_id,
                            'first_name': first_name
                        })

            # Check for invalid first name
            if cls.has_invalid_first_name(user):
                if '_id' in user:
                    invalid_first_name_users.append({
                        'id': user['_id'],
                        'first_name': user.get('Name - First', '')
                    })

            # Check for invalid full name
            if cls.has_invalid_full_name(user):
                if '_id' in user:
                    invalid_full_name_users.append({
                        'id': user['_id'],
                        'full_name': user.get('Name - Full', '')
                    })
        
        trailing_space_count = len(trailing_space_users)
        multiple_words_count = len(multiple_words_users)
        invalid_first_name_count = len(invalid_first_name_users)
        invalid_full_name_count = len(invalid_full_name_users)
        
        # Debug print for trailing spaces
        print(f"\n[DEBUG] Found {trailing_space_count} users with trailing spaces in first name")
        if trailing_space_users:
            print(f"[DEBUG] First few users with trailing spaces:")
            for i, user_data in enumerate(trailing_space_users[:5], 1):
                print(f"  {i}. ID: {user_data['id']}, First Name: '{user_data['first_name']}'")
        
        # Debug print for multiple words
        print(f"\n[DEBUG] Found {multiple_words_count} users with multiple words in first name")
        if multiple_words_users:
            print(f"[DEBUG] First few users with multiple words:")
            for i, user_data in enumerate(multiple_words_users[:5], 1):
                print(f"  {i}. ID: {user_data['id']}, First Name: '{user_data['first_name']}'")
        
        # URL to view and edit users
        users_url = os.getenv("USERS_URL")
        # Format as plain URL for console and logs
        users_link = users_url
        # Format as Slack-clickable link for the report - using exact Slack markup format
        slack_link = f"<{users_url}|Click here to view & edit users>"
        
        # Log counts
        logger.info(f"Found {trailing_space_count} users with trailing spaces in first name out of {total_count} total users")
        logger.info(f"Found {multiple_words_count} users with multiple words in first name out of {total_count} total users")
        logger.info(f"Found {invalid_first_name_count} users with invalid first names out of {total_count} total users")
        logger.info(f"Found {invalid_full_name_count} users with invalid full names out of {total_count} total users")
        logger.info(f"Users can be viewed and edited at: {users_link}")
        
        # IMPORTANT: Direct console output for immediate visibility - using print statements
        print("\n" + "="*80)
        print(f"FOUND {trailing_space_count} USERS WITH TRAILING SPACES IN FIRST NAME")
        print(f"FOUND {multiple_words_count} USERS WITH MULTIPLE WORDS IN FIRST NAME")
        print(f"FOUND {invalid_first_name_count} USERS WITH INVALID FIRST NAME (EMPTY OR < 2 CHARS)")
        print(f"FOUND {invalid_full_name_count} USERS WITH INVALID FULL NAME (EMPTY OR < 3 CHARS)")
        print(f"View and edit these users at: {users_link}")
        print("="*80)
        
        # Explicitly print IDs and names of users with trailing spaces in first name
        if trailing_space_users:
            print("\nUSER IDs WITH TRAILING SPACES IN FIRST NAME:")
            for idx, user_data in enumerate(trailing_space_users, 1):
                print(f"{idx}. ID: {user_data['id']}, First Name: '{user_data['first_name']}'")
            
            # Also log it
            logger.info(f"Found {trailing_space_count} users with trailing spaces in first name")
        
        # Explicitly print IDs and names of users with multiple words in first name
        if multiple_words_users:
            print("\nUSER IDs WITH MULTIPLE WORDS IN FIRST NAME:")
            for idx, user_data in enumerate(multiple_words_users, 1):
                print(f"{idx}. ID: {user_data['id']}, First Name: '{user_data['first_name']}'")
            
            # Also log it
            logger.info(f"Found {multiple_words_count} users with multiple words in first name")

        # Explicitly print IDs and names of users with invalid first names
        if invalid_first_name_users:
            print("\nUSER IDs WITH INVALID FIRST NAME:")
            for idx, user_data in enumerate(invalid_first_name_users, 1):
                print(f"{idx}. ID: {user_data['id']}, First Name: '{user_data['first_name']}'")
            logger.info(f"Found {invalid_first_name_count} users with invalid first names")

        # Explicitly print IDs and names of users with invalid full names
        if invalid_full_name_users:
            print("\nUSER IDs WITH INVALID FULL NAME:")
            for idx, user_data in enumerate(invalid_full_name_users, 1):
                print(f"{idx}. ID: {user_data['id']}, Full Name: '{user_data['full_name']}'")
            logger.info(f"Found {invalid_full_name_count} users with invalid full names")
            
        # Print a separator for better visibility
        print("="*80 + "\n")
        
        return {
            'total': total_count,
            'trailing_space_first_name': trailing_space_count,
            'trailing_space_users': trailing_space_users,
            'multiple_words_first_name': multiple_words_count,
            'multiple_words_users': multiple_words_users,
            'invalid_first_name_count': invalid_first_name_count,
            'invalid_first_name_users': invalid_first_name_users,
            'invalid_full_name_count': invalid_full_name_count,
            'invalid_full_name_users': invalid_full_name_users,
            'users_link': users_link,
            'slack_link': slack_link
        }
    
    @staticmethod
    def generate_report(check_results: Dict[str, Any]) -> str:
        total = check_results['total']
        trailing_space_count = check_results['trailing_space_first_name']
        multiple_words_count = check_results['multiple_words_first_name']
        invalid_first_name_count = check_results['invalid_first_name_count']
        invalid_full_name_count = check_results['invalid_full_name_count']

        # Avoid division by zero
        trailing_percentage = (trailing_space_count / total) * 100 if total > 0 else 0
        multiple_words_percentage = (multiple_words_count / total) * 100 if total > 0 else 0
        invalid_first_name_percentage = (invalid_first_name_count / total) * 100 if total > 0 else 0
        invalid_full_name_percentage = (invalid_full_name_count / total) * 100 if total > 0 else 0

        report = (
            f"📊 *User Data Quality Report*\n"
            f"\n• Total Users Found: {total}"
            f"\n• Users with trailing spaces in first name: {trailing_space_count} ({trailing_percentage:.1f}% of total)"
            f"\n• Users with multiple words in first name: {multiple_words_count} ({multiple_words_percentage:.1f}% of total)"
            f"\n• Users with invalid first name (< 2 chars): {invalid_first_name_count} ({invalid_first_name_percentage:.1f}% of total)"
            f"\n• Users with invalid full name (< 3 chars): {invalid_full_name_count} ({invalid_full_name_percentage:.1f}% of total)"
        )

        if trailing_space_count > 0 or multiple_words_count > 0 or invalid_first_name_count > 0 or invalid_full_name_count > 0:
            report += f"\n\n⚠️ *ATTENTION: USER DATA NEEDS CLEANUP* ⚠️"
            if trailing_space_count > 0:
                report += f"\n• {trailing_space_count} users have trailing spaces in first name"
            if multiple_words_count > 0:
                report += f"\n• {multiple_words_count} users have multiple words in first name"
            if invalid_first_name_count > 0:
                report += f"\n• {invalid_first_name_count} users have an invalid first name"
            if invalid_full_name_count > 0:
                report += f"\n• {invalid_full_name_count} users have an invalid full name"
            report += f"\n{check_results['slack_link']}"
        
        return report
