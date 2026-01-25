"""
Bubble API Service
Handles all Bubble.io API operations for virtual meeting database updates
"""

import os
import requests
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class BubbleService:
    """Service class for Bubble.io API operations"""

    def __init__(self):
        """Initialize Bubble API client with configuration"""
        self.api_token = os.getenv('BUBBLE_API_TOKEN')
        self.app_id = os.getenv('BUBBLE_APP_ID', 'upgradefromstr')
        self.app_version = os.getenv('BUBBLE_APP_VERSION', 'version-test')
        self.base_url = f"https://{self.app_id}.bubbleapps.io/{self.app_version}/api/1.1"
        self.data_type = 'virtual_meeting_schedules_and_links'

        if not self.api_token:
            logger.error("BUBBLE_API_TOKEN environment variable not set")
            raise ValueError("BUBBLE_API_TOKEN is required")

        logger.info(f"Bubble service initialized for app: {self.app_id}, version: {self.app_version}")

    def _get_headers(self) -> Dict[str, str]:
        """
        Get headers for Bubble API requests

        Returns:
            dict: Request headers with authorization
        """
        return {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }

    def update_thing(self, thing_id: str, data: Dict[str, Any],
                     max_retries: int = 3) -> bool:
        """
        Update a Bubble database object (Thing)

        Args:
            thing_id: The unique ID of the object to update
            data: Dictionary of fields to update
            max_retries: Maximum number of retry attempts

        Returns:
            bool: True if successful, False otherwise
        """
        url = f"{self.base_url}/obj/{self.data_type}/{thing_id}"

        for attempt in range(max_retries):
            try:
                logger.info(f"Updating Bubble thing {thing_id} (attempt {attempt + 1}/{max_retries})")
                logger.debug(f"Update data: {data}")

                response = requests.patch(
                    url,
                    json=data,
                    headers=self._get_headers(),
                    timeout=30
                )

                # Check response status
                if response.status_code in [200, 204]:
                    logger.info(f"Successfully updated Bubble thing {thing_id}")
                    return True
                elif response.status_code == 404:
                    logger.error(f"Bubble thing not found: {thing_id}")
                    return False
                elif response.status_code == 401:
                    logger.error("Bubble API authentication failed - check API token")
                    return False
                else:
                    logger.warning(
                        f"Bubble API returned status {response.status_code}: {response.text}"
                    )

                    # Retry on server errors
                    if response.status_code >= 500 and attempt < max_retries - 1:
                        logger.info(f"Retrying after server error...")
                        continue
                    else:
                        return False

            except requests.exceptions.Timeout:
                logger.error(f"Bubble API request timed out (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    continue
                return False

            except requests.exceptions.RequestException as e:
                logger.error(f"Bubble API request error: {str(e)}")
                if attempt < max_retries - 1:
                    continue
                return False

            except Exception as e:
                logger.error(f"Unexpected error updating Bubble thing: {str(e)}")
                return False

        logger.error(f"Failed to update Bubble thing {thing_id} after {max_retries} attempts")
        return False

    def get_thing(self, thing_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a Bubble database object (Thing)

        Args:
            thing_id: The unique ID of the object to retrieve

        Returns:
            dict: Object data if successful, None otherwise
        """
        url = f"{self.base_url}/obj/{self.data_type}/{thing_id}"

        try:
            logger.info(f"Retrieving Bubble thing {thing_id}")

            response = requests.get(
                url,
                headers=self._get_headers(),
                timeout=30
            )

            if response.status_code == 200:
                logger.info(f"Successfully retrieved Bubble thing {thing_id}")
                return response.json()
            elif response.status_code == 404:
                logger.error(f"Bubble thing not found: {thing_id}")
                return None
            else:
                logger.error(
                    f"Bubble API returned status {response.status_code}: {response.text}"
                )
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Bubble API request error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error retrieving Bubble thing: {str(e)}")
            return None

    def create_thing(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new Bubble database object (Thing)

        Args:
            data: Dictionary of fields for the new object

        Returns:
            dict: Created object data including ID, or None if failed
        """
        url = f"{self.base_url}/obj/{self.data_type}"

        try:
            logger.info(f"Creating new Bubble thing")
            logger.debug(f"Create data: {data}")

            response = requests.post(
                url,
                json=data,
                headers=self._get_headers(),
                timeout=30
            )

            if response.status_code in [200, 201]:
                result = response.json()
                logger.info(f"Successfully created Bubble thing: {result.get('id')}")
                return result
            else:
                logger.error(
                    f"Bubble API returned status {response.status_code}: {response.text}"
                )
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Bubble API request error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error creating Bubble thing: {str(e)}")
            return None
