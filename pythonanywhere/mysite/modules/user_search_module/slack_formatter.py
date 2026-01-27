"""
Slack Block Kit Message Formatter
Formats user search results into rich Slack messages
"""
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class SlackMessageFormatter:
    """Formats user data into Slack Block Kit messages"""

    @staticmethod
    def format_user_search_results(users: List[Dict], search_term: str, max_results: int = 10, version: str = 'test') -> List[Dict]:
        """
        Format user search results into Slack Block Kit format

        Args:
            users: List of user dictionaries from Bubble API
            search_term: Original search term used
            max_results: Maximum number of results to display
            version: 'live' or 'test' environment indicator

        Returns:
            List of Block Kit blocks for Slack message
        """
        try:
            blocks = []

            # Version indicator emoji
            version_emoji = ":red_circle:" if version == "live" else ":large_blue_circle:"
            version_label = "LIVE" if version == "live" else "TEST"

            # Header section
            if not users:
                blocks.append({
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"{version_label} - No Users Found"
                    }
                })
                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"{version_emoji} *Environment:* {version_label}\n\n:mag: No users found matching *\"{search_term}\"*\n\nTry searching by:\n• Email address\n• First or last name\n• Phone number"
                    }
                })
                return blocks

            # Success header
            result_count = len(users)
            display_count = min(result_count, max_results)

            blocks.append({
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{version_label} - Found {result_count} User{'s' if result_count != 1 else ''}"
                }
            })

            # Search term context with version indicator
            blocks.append({
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"{version_emoji} *Environment:* {version_label} | :mag: Search: *{search_term}* | Showing {display_count} of {result_count} result{'s' if result_count != 1 else ''}"
                    }
                ]
            })

            blocks.append({"type": "divider"})

            # Format each user (limit to max_results)
            for idx, user in enumerate(users[:max_results]):
                user_blocks = SlackMessageFormatter._format_single_user(user, idx + 1)
                blocks.extend(user_blocks)

                # Add divider between users (but not after last one)
                if idx < min(len(users), max_results) - 1:
                    blocks.append({"type": "divider"})

            # Footer if there are more results
            if result_count > max_results:
                remaining = result_count - max_results
                blocks.append({"type": "divider"})
                blocks.append({
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": f":information_source: _+{remaining} more user{'s' if remaining != 1 else ''} not shown. Refine your search for fewer results._"
                        }
                    ]
                })

            logger.info(f"Formatted {display_count} users into Slack blocks")
            return blocks

        except Exception as e:
            logger.error(f"Error formatting user results: {e}")
            return SlackMessageFormatter._format_error_message(str(e))

    @staticmethod
    def _format_single_user(user: Dict, index: int) -> List[Dict]:
        """
        Format a single user into Slack blocks

        Args:
            user: User dictionary from Bubble API
            index: User index in results (for numbering)

        Returns:
            List of blocks for this user
        """
        blocks = []

        # Extract user fields (handle different field name variations)
        first_name = user.get('first name') or user.get('fname') or 'N/A'
        last_name = user.get('last name') or user.get('lname') or 'N/A'
        email = user.get('email') or user.get('Email') or 'N/A'
        phone = user.get('phone') or user.get('Phone') or 'N/A'

        # Optional fields
        user_type = user.get('type of user') or user.get('user_type') or 'N/A'
        status = user.get('status') or user.get('Status') or 'Active'
        created_date = user.get('Created Date') or user.get('created_date') or 'N/A'
        user_id = user.get('_id') or 'N/A'

        # Format created date if it exists
        if created_date and created_date != 'N/A':
            try:
                # Bubble returns timestamps in milliseconds
                from datetime import datetime
                if isinstance(created_date, (int, float)):
                    dt = datetime.fromtimestamp(created_date / 1000)
                    created_date = dt.strftime('%Y-%m-%d %H:%M:%S')
            except Exception as e:
                logger.debug(f"Could not format date: {e}")
                pass

        # User header with number
        full_name = f"{first_name} {last_name}".strip()
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*{index}. {full_name}*"
            }
        })

        # User details in two-column layout
        blocks.append({
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Email:*\n{email}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Phone:*\n{phone}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*User Type:*\n{user_type}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Status:*\n{status}"
                }
            ]
        })

        # Additional info in context
        context_elements = []
        if user_id != 'N/A':
            context_elements.append({
                "type": "mrkdwn",
                "text": f"ID: `{user_id}`"
            })
        if created_date != 'N/A':
            context_elements.append({
                "type": "mrkdwn",
                "text": f"Created: {created_date}"
            })

        if context_elements:
            blocks.append({
                "type": "context",
                "elements": context_elements
            })

        return blocks

    @staticmethod
    def _format_error_message(error_msg: str) -> List[Dict]:
        """
        Format an error message into Slack blocks

        Args:
            error_msg: Error message text

        Returns:
            List of blocks for error message
        """
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "Search Error"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f":x: *An error occurred while searching:*\n\n```{error_msg}```\n\nPlease try again or contact support if the issue persists."
                }
            }
        ]

    @staticmethod
    def format_simple_message(text: str, emoji: str = ":information_source:") -> List[Dict]:
        """
        Format a simple text message into Slack blocks

        Args:
            text: Message text
            emoji: Emoji to display (default: info icon)

        Returns:
            List of blocks for simple message
        """
        return [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"{emoji} {text}"
                }
            }
        ]
