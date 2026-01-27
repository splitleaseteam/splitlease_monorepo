"""
Event Handler for Knowledge Search
Handles app_mention events and generates AI summaries
"""
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List
from flask import jsonify
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from openai import OpenAI

logger = logging.getLogger(__name__)


class KnowledgeSearchHandler:
    """Handles knowledge search workflow"""

    def __init__(self, slack_token: str, openai_key: str):
        """
        Initialize handler with API clients

        Args:
            slack_token: Slack bot token
            openai_key: OpenAI API key
        """
        self.slack_client = WebClient(token=slack_token)
        self.openai_client = OpenAI(api_key=openai_key)
        self.search_days = int(os.getenv('KNOWLEDGE_SEARCH_DAYS', '30'))
        self.max_messages = int(os.getenv('KNOWLEDGE_MAX_MESSAGES', '100'))

    def handle_mention(self, event: Dict) -> tuple:
        """
        Handle app_mention event

        Args:
            event: Slack event data

        Returns:
            tuple: (response_dict, status_code)
        """
        try:
            channel = event.get('channel')
            user = event.get('user')
            text = event.get('text', '')
            ts = event.get('ts')

            logger.info(f"Knowledge search mention from {user} in {channel}: {text}")

            # Send immediate acknowledgment
            self._send_acknowledgment(channel, user, ts)

            # Extract query (remove bot mention)
            query = self._extract_query(text)

            if not query:
                self._send_error(channel, ts, "Please include a question after mentioning me!")
                return jsonify({'status': 'no_query'}), 200

            # Search channel history
            messages = self._search_channel_history(channel, query)

            if not messages:
                self._send_response(
                    channel, ts,
                    f"I couldn't find any relevant discussions about '{query}' in the last {self.search_days} days."
                )
                return jsonify({'status': 'no_results'}), 200

            # Generate AI summary
            summary = self._generate_summary(query, messages)

            # Send summary
            self._send_response(channel, ts, summary)

            return jsonify({'status': 'ok', 'messages_found': len(messages)}), 200

        except Exception as e:
            logger.error(f"Error handling mention: {e}", exc_info=True)
            if 'channel' in locals() and 'ts' in locals():
                self._send_error(channel, ts, "Sorry, I encountered an error. Please try again.")
            return jsonify({'error': str(e)}), 500

    def _extract_query(self, text: str) -> str:
        """Extract the actual query from mention text"""
        # Remove bot mention (format: <@BOTID> query)
        import re
        cleaned = re.sub(r'<@[A-Z0-9]+>', '', text).strip()
        return cleaned

    def _search_channel_history(self, channel: str, query: str) -> List[Dict]:
        """
        Search channel history for relevant messages

        Args:
            channel: Channel ID
            query: Search query

        Returns:
            List of relevant messages
        """
        try:
            # Calculate time range
            oldest = (datetime.now() - timedelta(days=self.search_days)).timestamp()

            # Fetch recent messages
            response = self.slack_client.conversations_history(
                channel=channel,
                oldest=str(oldest),
                limit=self.max_messages
            )

            all_messages = response.get('messages', [])
            logger.info(f"Retrieved {len(all_messages)} messages from channel")

            # Filter relevant messages using keywords
            keywords = self._extract_keywords(query)
            relevant_messages = []

            for msg in all_messages:
                text = msg.get('text', '').lower()
                # Skip bot messages
                if msg.get('bot_id'):
                    continue
                # Check if any keyword appears in message
                if any(keyword in text for keyword in keywords):
                    relevant_messages.append({
                        'text': msg.get('text'),
                        'user': msg.get('user', 'unknown'),
                        'timestamp': msg.get('ts')
                    })

            logger.info(f"Found {len(relevant_messages)} relevant messages")
            return relevant_messages[:20]  # Limit to most recent 20

        except SlackApiError as e:
            logger.error(f"Slack API error: {e.response['error']}")
            return []
        except Exception as e:
            logger.error(f"Error searching history: {e}")
            return []

    def _extract_keywords(self, query: str) -> List[str]:
        """Extract keywords from query for filtering"""
        # Simple keyword extraction - split and lowercase
        words = query.lower().split()
        # Remove common words
        stop_words = {'what', 'when', 'where', 'who', 'why', 'how', 'did', 'we', 'discuss', 'about', 'the', 'a', 'an'}
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        return keywords if keywords else words

    def _generate_summary(self, query: str, messages: List[Dict]) -> str:
        """
        Generate AI summary of messages

        Args:
            query: User's question
            messages: Relevant messages

        Returns:
            AI-generated summary
        """
        try:
            # Prepare context from messages
            context = "\n\n".join([
                f"User {msg['user']}: {msg['text']}"
                for msg in messages
            ])

            # Determine which model to use
            is_simple = len(messages) < 5 and len(context) < 500
            model = "gpt-4o-mini" if is_simple else "gpt-4o"

            logger.info(f"Using {model} for {len(messages)} messages")

            # Call OpenAI
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that summarizes Slack channel discussions. Provide concise, accurate summaries based on the conversation history provided."
                    },
                    {
                        "role": "user",
                        "content": f"Question: {query}\n\nRelevant channel messages:\n{context}\n\nPlease provide a clear, concise summary that answers the question based on these messages."
                    }
                ],
                max_tokens=500,
                temperature=0.7
            )

            summary = response.choices[0].message.content
            logger.info(f"Generated summary with {model}")

            return summary

        except Exception as e:
            logger.error(f"Error generating summary: {e}", exc_info=True)
            return "I encountered an error while generating the summary. Please try again."

    def _send_acknowledgment(self, channel: str, user: str, thread_ts: str):
        """Send immediate acknowledgment"""
        try:
            self.slack_client.chat_postMessage(
                channel=channel,
                thread_ts=thread_ts,
                text=f"Hi <@{user}>! Searching through channel history... 🔍"
            )
        except Exception as e:
            logger.error(f"Error sending acknowledgment: {e}")

    def _send_response(self, channel: str, thread_ts: str, text: str):
        """Send response message"""
        try:
            self.slack_client.chat_postMessage(
                channel=channel,
                thread_ts=thread_ts,
                text=text
            )
        except Exception as e:
            logger.error(f"Error sending response: {e}")

    def _send_error(self, channel: str, thread_ts: str, error_msg: str):
        """Send error message"""
        try:
            self.slack_client.chat_postMessage(
                channel=channel,
                thread_ts=thread_ts,
                text=f"❌ {error_msg}"
            )
        except Exception as e:
            logger.error(f"Error sending error message: {e}")
