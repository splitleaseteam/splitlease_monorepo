# slack_event_webhook.py
# Complete Slack Event Subscriptions handler for signup automation
from flask import Flask, request, jsonify
import requests
import logging
import json
import hmac
import hashlib
import time
import re
from typing import Dict, Optional
import config
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Get Slack credentials from config
SLACK_SIGNING_SECRET = os.getenv('SLACK_SIGNING_SECRET', '')
SLACK_BOT_TOKEN = os.getenv('SLACK_BOT_TOKEN', '')
SLACK_SIGNUP_CHANNEL = os.getenv('SLACK_SIGNUP_CHANNEL', '')


class SlackVerifier:
    """Handles Slack request verification"""

    @staticmethod
    def verify_slack_request(request_body: str, timestamp: str, signature: str) -> bool:
        """
        Verify that the request came from Slack

        Args:
            request_body: Raw request body string
            timestamp: X-Slack-Request-Timestamp header
            signature: X-Slack-Signature header

        Returns:
            bool: True if signature is valid
        """
        if not SLACK_SIGNING_SECRET:
            logger.warning("SLACK_SIGNING_SECRET not configured")
            return False

        # Check timestamp is recent (within 5 minutes)
        current_timestamp = int(time.time())
        if abs(current_timestamp - int(timestamp)) > 60 * 5:
            logger.warning("Request timestamp too old")
            return False

        # Create signature base string
        sig_basestring = f"v0:{timestamp}:{request_body}"

        # Calculate expected signature
        expected_signature = 'v0=' + hmac.new(
            SLACK_SIGNING_SECRET.encode(),
            sig_basestring.encode(),
            hashlib.sha256
        ).hexdigest()

        # Compare signatures
        is_valid = hmac.compare_digest(expected_signature, signature)

        if not is_valid:
            logger.warning(f"Invalid signature. Expected: {expected_signature}, Got: {signature}")

        return is_valid


class SignupDataExtractor:
    """Extracts signup data from Slack messages"""

    @staticmethod
    def extract_from_text(text: str) -> Optional[Dict]:
        """
        Extract signup data from plain text message

        Supports formats like:
        First Name: John
        Last Name: Doe
        Email: john@example.com
        etc.
        """
        try:
            data = {}

            # Pattern: "Field Name: Value" or "Field Name : Value"
            patterns = {
                'first_name': r'First\s*Name\s*:?\s*(.+?)(?:\n|$)',
                'last_name': r'Last\s*Name\s*:?\s*(.+?)(?:\n|$)',
                'email': r'Email\s*:?\s*(.+?)(?:\n|$)',
                'phone': r'Phone\s*:?\s*(.+?)(?:\n|$)',
                'user_type': r'User\s*Type\s*:?\s*(.+?)(?:\n|$)',
                'version': r'Version\s*:?\s*(.+?)(?:\n|$)'
            }

            for field, pattern in patterns.items():
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    value = match.group(1).strip()
                    # Remove quotes if present
                    value = value.strip('"\'')
                    data[field] = value

            # Validate we have at least email
            if 'email' not in data or not data['email']:
                logger.warning("No email found in message")
                return None

            # Set defaults for missing fields
            if 'user_type' not in data:
                data['user_type'] = 'guest'
            if 'version' not in data:
                data['version'] = 'test'

            logger.info(f"Extracted data from text: {data}")
            return data

        except Exception as e:
            logger.error(f"Error extracting from text: {e}")
            return None

    @staticmethod
    def extract_from_json(text: str) -> Optional[Dict]:
        """
        Extract signup data from JSON in message

        Looks for JSON in code blocks: ```{...}```
        """
        try:
            # Look for JSON in code blocks
            json_match = re.search(r'```\s*(\{.+?\})\s*```', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                data = json.loads(json_str)

                # Normalize field names
                normalized = {}
                for key, value in data.items():
                    # Convert to lowercase and replace spaces with underscores
                    normalized_key = key.lower().replace(' ', '_')
                    normalized[normalized_key] = value

                logger.info(f"Extracted data from JSON: {normalized}")
                return normalized

            return None

        except Exception as e:
            logger.error(f"Error extracting from JSON: {e}")
            return None

    @staticmethod
    def extract(text: str) -> Optional[Dict]:
        """
        Try to extract signup data using all available methods
        """
        # Try JSON first
        data = SignupDataExtractor.extract_from_json(text)
        if data:
            return data

        # Fall back to text extraction
        return SignupDataExtractor.extract_from_text(text)


class SignupProcessor:
    """Handles the signup workflow processing"""

    @staticmethod
    def check_user_exists(email: str) -> bool:
        """Check if user already exists in Bubble"""
        try:
            headers = {
                'Authorization': f'Bearer {config.BUBBLE_API_KEY}',
                'Content-Type': 'application/json'
            }

            params = {
                'constraints': json.dumps([{
                    'key': 'email',
                    'constraint_type': 'equals',
                    'value': email
                }])
            }

            response = requests.get(
                config.BUBBLE_FIND_USER_API,
                headers=headers,
                params=params,
                timeout=10
            )
            response.raise_for_status()

            data = response.json()
            results = data.get('response', {}).get('results', [])
            exists = len(results) > 0

            logger.info(f"User {email} exists: {exists}")
            return exists

        except Exception as e:
            logger.error(f"Error checking user existence: {e}")
            return False

    @staticmethod
    def send_slack_message(channel: str, text: str, thread_ts: str = None):
        """Send message to Slack using Bot Token"""
        try:
            if not SLACK_BOT_TOKEN:
                logger.warning("SLACK_BOT_TOKEN not configured, using webhook")
                return SignupProcessor.send_slack_webhook(text)

            headers = {
                'Authorization': f'Bearer {SLACK_BOT_TOKEN}',
                'Content-Type': 'application/json'
            }

            payload = {
                'channel': channel,
                'text': text
            }

            if thread_ts:
                payload['thread_ts'] = thread_ts

            response = requests.post(
                'https://slack.com/api/chat.postMessage',
                headers=headers,
                json=payload,
                timeout=5
            )
            response.raise_for_status()

            result = response.json()
            if result.get('ok'):
                logger.info(f"Slack message sent successfully")
                return True
            else:
                logger.error(f"Slack API error: {result.get('error')}")
                return False

        except Exception as e:
            logger.error(f"Error sending Slack message: {e}")
            return False

    @staticmethod
    def send_slack_webhook(text: str):
        """Send alert to Slack using webhook (fallback)"""
        try:
            payload = {
                'text': text,
                'username': 'Signup Bot',
                'icon_emoji': ':robot_face:'
            }

            response = requests.post(
                config.SLACK_WEBHOOK_URL,
                json=payload,
                timeout=5
            )
            response.raise_for_status()
            logger.info(f"Slack webhook sent successfully")
            return True

        except Exception as e:
            logger.error(f"Error sending Slack webhook: {e}")
            return False

    @staticmethod
    def get_endpoint(version: str, user_type: str) -> Optional[str]:
        """Determine the correct endpoint based on version and user type"""
        version_key = version.lower().strip()
        user_type_key = user_type.lower().strip()

        if version_key not in ['live', 'test']:
            logger.error(f"Invalid version: {version}")
            return None

        endpoint = config.ENDPOINTS.get(version_key, {}).get(user_type_key)

        if not endpoint:
            logger.error(f"No endpoint found for version '{version}' and user type '{user_type}'")
            return None

        logger.info(f"Using endpoint: {endpoint}")
        return endpoint

    @staticmethod
    def create_user(user_data: Dict) -> bool:
        """Create user via Bubble API"""
        try:
            endpoint = SignupProcessor.get_endpoint(
                user_data['version'],
                user_data['user_type']
            )

            if not endpoint:
                return False

            payload = {
                'fname': user_data.get('first_name', ''),
                'lname': user_data.get('last_name', ''),
                'email': user_data['email'],
                'phone': user_data.get('phone', ''),
                'type of user': user_data['user_type']
            }

            logger.info(f"Creating user: {payload}")

            response = requests.post(
                endpoint,
                data=payload,
                timeout=30
            )
            response.raise_for_status()

            logger.info(f"User created successfully: {user_data['email']}")
            return True

        except Exception as e:
            logger.error(f"Error creating user: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            return False

    @staticmethod
    def process_signup(data: Dict, channel: str = None, thread_ts: str = None) -> Dict:
        """Main processing logic for signup data"""
        try:
            # Normalize data
            user_data = {
                'first_name': data.get('first_name', '').strip(),
                'last_name': data.get('last_name', '').strip(),
                'email': data.get('email', '').strip(),
                'phone': data.get('phone', '').strip(),
                'user_type': data.get('user_type', 'guest').strip().lower(),
                'version': data.get('version', 'test').strip().lower()
            }

            logger.info(f"Processing signup: {user_data['email']}")

            # Validate
            if not user_data['email']:
                return {'success': False, 'message': 'Missing email'}

            valid_user_types = ['guest', 'host', 'trial host']
            if user_data['user_type'] not in valid_user_types:
                return {'success': False, 'message': f"Invalid user type: {user_data['user_type']}"}

            if user_data['version'] not in ['live', 'test']:
                return {'success': False, 'message': f"Invalid version: {user_data['version']}"}

            # Check if exists
            if SignupProcessor.check_user_exists(user_data['email']):
                alert = (
                    f":warning: *User Already Exists*\n"
                    f"*Name:* {user_data['first_name']} {user_data['last_name']}\n"
                    f"*Email:* {user_data['email']}"
                )

                if channel:
                    SignupProcessor.send_slack_message(channel, alert, thread_ts)
                else:
                    SignupProcessor.send_slack_webhook(alert)

                return {'success': False, 'message': f"User already exists: {user_data['email']}"}

            # Create user
            success = SignupProcessor.create_user(user_data)

            if success:
                success_msg = (
                    f":white_check_mark: *New User Created!*\n"
                    f"*Name:* {user_data['first_name']} {user_data['last_name']}\n"
                    f"*Email:* {user_data['email']}\n"
                    f"*Phone:* {user_data['phone']}\n"
                    f"*Type:* {user_data['user_type']}\n"
                    f"*Version:* {user_data['version']}"
                )

                if channel:
                    SignupProcessor.send_slack_message(channel, success_msg, thread_ts)
                else:
                    SignupProcessor.send_slack_webhook(success_msg)

                return {'success': True, 'message': f'User created: {user_data["email"]}'}
            else:
                return {'success': False, 'message': 'Failed to create user'}

        except Exception as e:
            logger.error(f"Error processing signup: {e}")
            return {'success': False, 'message': str(e)}


# Flask Routes

@app.route('/')
def home():
    """Home page"""
    return jsonify({
        'service': 'Split Lease Signup Automation',
        'status': 'running',
        'version': '2.0 - Event Subscriptions',
        'endpoints': {
            '/health': 'Health check',
            '/slack/events': 'Slack Event Subscriptions endpoint',
            '/webhook/signup': 'Direct signup webhook'
        }
    })


@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'slack_configured': bool(SLACK_SIGNING_SECRET and SLACK_BOT_TOKEN)
    }), 200


@app.route('/slack/events', methods=['POST'])
def slack_events():
    """
    Slack Event Subscriptions endpoint
    Receives events from Slack in real-time
    """
    try:
        # Get raw request body for signature verification
        raw_body = request.get_data(as_text=True)

        # Get Slack headers
        timestamp = request.headers.get('X-Slack-Request-Timestamp', '')
        signature = request.headers.get('X-Slack-Signature', '')

        # Verify request came from Slack
        if SLACK_SIGNING_SECRET and not SlackVerifier.verify_slack_request(raw_body, timestamp, signature):
            logger.warning("Invalid Slack signature")
            return jsonify({'error': 'Invalid signature'}), 401

        # Parse JSON
        data = request.get_json()

        # Handle URL verification challenge (first-time setup)
        if data.get('type') == 'url_verification':
            challenge = data.get('challenge')
            logger.info("Responding to Slack URL verification challenge")
            return jsonify({'challenge': challenge}), 200

        # Handle event callbacks
        if data.get('type') == 'event_callback':
            event = data.get('event', {})
            event_type = event.get('type')

            logger.info(f"Received Slack event: {event_type}")

            # Handle message events
            if event_type == 'message' and not event.get('subtype'):
                return handle_message_event(event)

        # Acknowledge other events
        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        logger.error(f"Error handling Slack event: {e}")
        return jsonify({'error': str(e)}), 500


def handle_message_event(event: Dict) -> tuple:
    """Handle incoming Slack message"""
    try:
        # Extract message details
        channel = event.get('channel')
        text = event.get('text', '')
        user = event.get('user')
        ts = event.get('ts')
        thread_ts = event.get('thread_ts') or ts

        # Ignore bot messages
        if event.get('bot_id'):
            logger.info("Ignoring bot message")
            return jsonify({'status': 'ignored'}), 200

        # Only process messages from signup channel (if configured)
        if SLACK_SIGNUP_CHANNEL and channel != SLACK_SIGNUP_CHANNEL:
            logger.info(f"Ignoring message from non-signup channel: {channel}")
            return jsonify({'status': 'ignored'}), 200

        logger.info(f"Processing message from user {user} in channel {channel}")
        logger.debug(f"Message: {text[:100]}")

        # Extract signup data
        signup_data = SignupDataExtractor.extract(text)

        if not signup_data:
            logger.info("No signup data found in message")
            return jsonify({'status': 'no_signup_data'}), 200

        # Process the signup
        result = SignupProcessor.process_signup(signup_data, channel, thread_ts)

        logger.info(f"Signup processing result: {result}")

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error handling message: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/webhook/signup', methods=['POST'])
def webhook_signup():
    """Direct webhook endpoint for manual testing"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        result = SignupProcessor.process_signup(data)

        status_code = 200 if result['success'] else 400
        return jsonify(result), status_code

    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Verify configuration
    if not config.BUBBLE_API_KEY:
        logger.error("BUBBLE_API_KEY is not set")
        exit(1)

    if not SLACK_SIGNING_SECRET:
        logger.warning("SLACK_SIGNING_SECRET not set - signature verification disabled")

    logger.info("=== Signup Event Webhook Server Started ===")
    logger.info(f"Bubble API: Configured")
    logger.info(f"Slack Signing Secret: {'Configured' if SLACK_SIGNING_SECRET else 'Not configured'}")
    logger.info(f"Slack Bot Token: {'Configured' if SLACK_BOT_TOKEN else 'Not configured'}")
    logger.info(f"Signup Channel: {SLACK_SIGNUP_CHANNEL or 'Not configured (all channels)'}")

    app.run(host='0.0.0.0', port=5000, debug=False)
