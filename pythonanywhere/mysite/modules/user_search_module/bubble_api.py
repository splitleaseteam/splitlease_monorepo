"""
Bubble API Integration
Handles user search queries to Bubble database
"""
import requests
import logging
import json
from typing import Dict, List, Optional
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class BubbleAPIClient:
    """Client for interacting with Bubble.io API"""

    def __init__(self, api_key: str, base_url: str, timeout: int = 10):
        """
        Initialize Bubble API client

        Args:
            api_key: Bubble API key
            base_url: Base URL for Bubble API (e.g., https://www.split.lease/api/1.1/obj/user)
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Create a requests session with retry logic"""
        session = requests.Session()
        retry = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"]
        )
        adapter = HTTPAdapter(max_retries=retry)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        return session

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Bubble API requests"""
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

    def search_users(self, search_term: str) -> List[Dict]:
        """
        Search for users in Bubble database

        The search will look for matches in:
        - Email (exact or contains)
        - First name (contains)
        - Last name (contains)
        - Phone (contains)

        Args:
            search_term: Search term from Slack user

        Returns:
            List of user dictionaries with user data
        """
        try:
            logger.info(f"Searching for users with term: {search_term}")

            # Build constraints for search
            # For non-email searches, we get all users and filter client-side
            # (Bubble's OR logic is complex, so we do it this way)
            params = {
                'limit': 100  # Get more results for filtering
            }

            # Don't add constraints - get all users and filter client-side
            # This allows us to do proper OR logic across all fields

            response = self.session.get(
                self.base_url,
                headers=self._get_headers(),
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()

            data = response.json()
            results = data.get('response', {}).get('results', [])

            logger.info(f"Found {len(results)} users from Bubble API")

            # Filter results based on search term (client-side filtering for OR logic)
            filtered_results = self._filter_results(results, search_term)

            logger.info(f"Filtered to {len(filtered_results)} matching users")
            return filtered_results

        except requests.exceptions.Timeout:
            logger.error("Bubble API request timed out")
            raise Exception("Search timed out - please try again")
        except requests.exceptions.RequestException as e:
            logger.error(f"Bubble API request failed: {e}")
            raise Exception(f"Failed to search users: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error searching users: {e}")
            raise

    def _filter_results(self, results: List[Dict], search_term: str) -> List[Dict]:
        """
        Filter results based on search term (client-side OR logic)

        Args:
            results: Raw results from Bubble API
            search_term: Original search term

        Returns:
            Filtered list of users matching the search term
        """
        if not search_term:
            return results

        search_lower = search_term.lower().strip()
        filtered = []

        for user in results:
            # Debug: Log what fields this user actually has
            logger.info(f"User fields: {list(user.keys())}")

            # Get user fields (handle missing fields gracefully)
            email = (user.get('email') or '').lower()
            first_name = (user.get('first name') or user.get('fname') or '').lower()
            last_name = (user.get('last name') or user.get('lname') or '').lower()
            phone = (user.get('phone') or user.get('Phone') or '').lower()
            full_name = f"{first_name} {last_name}".strip()

            # Check if search term matches any field
            if (search_lower in email or
                search_lower in first_name or
                search_lower in last_name or
                search_lower in full_name or
                search_lower in phone or
                search_lower in phone.replace('-', '').replace('(', '').replace(')', '').replace(' ', '')):
                filtered.append(user)

        return filtered

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """
        Get a specific user by email address

        Args:
            email: User email address

        Returns:
            User dict if found, None otherwise
        """
        try:
            logger.info(f"Looking up user by email: {email}")

            constraints = [{
                'key': 'email',
                'constraint_type': 'equals',
                'value': email.lower()
            }]

            params = {
                'constraints': json.dumps(constraints)
            }

            response = self.session.get(
                self.base_url,
                headers=self._get_headers(),
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()

            data = response.json()
            results = data.get('response', {}).get('results', [])

            if results:
                logger.info(f"Found user: {email}")
                return results[0]
            else:
                logger.info(f"No user found with email: {email}")
                return None

        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
