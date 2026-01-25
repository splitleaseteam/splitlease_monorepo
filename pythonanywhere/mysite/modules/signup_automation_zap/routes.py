"""
Signup Automation Routes - Updated with Trigger Code
Blueprint for handling signup events from Slack
Only processes messages containing the trigger code
"""
from flask import Blueprint, request, jsonify
import requests
import logging
import json
import os
import re
from typing import Dict, Optional

# Initialize logger
logger = logging.getLogger(__name__)

# Create blueprint
bp = Blueprint('signup_automation', __name__)

# Configuration from environment
BUBBLE_API_KEY = os.getenv('BUBBLE_API_KEY')
SLACK_WEBHOOK_URL = os.getenv('SLACK_WEBHOOK_URL')
SLACK_SIGNUP_CHANNEL = os.getenv('SLACK_SIGNUP_CHANNEL')
SIGNUP_TRIGGER_CODE = os.getenv('SIGNUP_TRIGGER_CODE', '__SIGNUP_TRIGGER_EXECUTE__')

# Bubble endpoints
BUBBLE_FIND_USER_API = 'https://app.split.lease/api/1.1/obj/user'
ENDPOINTS = {
    'live': {
        'guest': 'https://app.split.lease/version-live/api/1.1/wf/signupuserzapier',
        'host': 'https://app.split.lease/version-live/api/1.1/wf/signuplandlord',
        'trial host': 'https://app.split.lease/version-live/api/1.1/wf/signuptrialhost'
    },
    'test': {
        'guest': 'https://app.split.lease/version-test/api/1.1/wf/signupuserzapier',
        'host': 'https://app.split.lease/version-test/api/1.1/wf/signuplandlord',
        'trial host': 'https://app.split.lease/version-test/api/1.1/wf/signuptrialhost'
    }
}


class SignupDataExtractor:
    """Extracts signup data from Slack messages"""

    @staticmethod
    def extract_from_text(text: str) -> Optional[Dict]:
        """Extract signup data from plain text message"""
        try:
            data = {}
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
                    value = match.group(1).strip().strip('"\'')
                    # Clean Slack mailto format: <mailto:email@example.com|email@example.com> -> email@example.com
                    if field == 'email' and '<mailto:' in value:
                        email_match = re.search(r'<mailto:([^|>]+)', value)
                        if email_match:
                            value = email_match.group(1)
                    data[field] = value

            if 'email' not in data or not data['email']:
                return None

            # Set defaults
            if 'user_type' not in data:
                data['user_type'] = 'guest'
            if 'version' not in data:
                data['version'] = 'test'

            logger.info(f"Extracted data: {data}")
            return data

        except Exception as e:
            logger.error(f"Error extracting from text: {e}")
            return None

    @staticmethod
    def extract_from_json(text: str) -> Optional[Dict]:
        """Extract signup data from JSON in code blocks"""
        try:
            json_match = re.search(r'```\s*(\{.+?\})\s*```', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                data = json.loads(json_str)

                # Normalize field names
                normalized = {}
                for key, value in data.items():
                    normalized_key = key.lower().replace(' ', '_')
                    normalized[normalized_key] = value

                logger.info(f"Extracted JSON data: {normalized}")
                return normalized
            return None
        except Exception as e:
            logger.error(f"Error extracting JSON: {e}")
            return None

    @staticmethod
    def extract(text: str) -> Optional[Dict]:
        """Try to extract signup data using all methods"""
        data = SignupDataExtractor.extract_from_json(text)
        if data:
            return data
        return SignupDataExtractor.extract_from_text(text)


class SignupProcessor:
    """Handles signup workflow processing"""

    @staticmethod
    def check_user_exists(email: str) -> bool:
        """Check if user exists in Bubble"""
        try:
            headers = {
                'Authorization': f'Bearer {BUBBLE_API_KEY}',
                'Content-Type': 'application/json'
            }
            params = {
                'constraints': json.dumps([{
                    'key': 'email',
                    'constraint_type': 'equals',
                    'value': email
                }])
            }
            response = requests.get(BUBBLE_FIND_USER_API, headers=headers, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            results = data.get('response', {}).get('results', [])
            exists = len(results) > 0

            logger.info(f"User {email} exists: {exists}")
            return exists
        except Exception as e:
            logger.error(f"Error checking user: {e}")
            return False

    @staticmethod
    def send_slack_notification(text: str):
        """Send notification to Slack"""
        try:
            payload = {'text': text, 'username': 'Signup Bot', 'icon_emoji': ':robot_face:'}
            response = requests.post(SLACK_WEBHOOK_URL, json=payload, timeout=5)
            response.raise_for_status()
            logger.info("Slack notification sent")
        except Exception as e:
            logger.error(f"Error sending Slack notification: {e}")

    @staticmethod
    def get_endpoint(version: str, user_type: str) -> Optional[str]:
        """Get correct Bubble endpoint"""
        version_key = version.lower().strip()
        user_type_key = user_type.lower().strip()

        if version_key not in ['live', 'test']:
            return None

        endpoint = ENDPOINTS.get(version_key, {}).get(user_type_key)
        logger.info(f"Endpoint: {endpoint}")
        return endpoint

    @staticmethod
    def create_user(user_data: Dict) -> bool:
        """Create user in Bubble"""
        try:
            endpoint = SignupProcessor.get_endpoint(user_data['version'], user_data['user_type'])
            if not endpoint:
                return False

            payload = {
                'fname': user_data.get('first_name', ''),
                'lname': user_data.get('last_name', ''),
                'email': user_data['email'],
                'phone': user_data.get('phone', '')
            }

            logger.info(f"Creating user with endpoint: {endpoint}")
            logger.info(f"Payload: {payload}")

            # Bubble workflows expect POST with form data
            response = requests.post(endpoint, data=payload, timeout=30)
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response body: {response.text[:500]}")  # First 500 chars for debugging
            response.raise_for_status()

            logger.info(f"User created successfully: {user_data['email']}")
            return True

        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return False

    @staticmethod
    def process_signup(data: Dict) -> Dict:
        """Main signup processing logic"""
        try:
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

            valid_types = ['guest', 'host', 'trial host']
            if user_data['user_type'] not in valid_types:
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
                SignupProcessor.send_slack_notification(alert)
                return {'success': False, 'message': f"User exists: {user_data['email']}"}

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
                SignupProcessor.send_slack_notification(success_msg)
                return {'success': True, 'message': f'User created: {user_data["email"]}'}
            else:
                return {'success': False, 'message': 'Failed to create user'}

        except Exception as e:
            logger.error(f"Error processing signup: {e}")
            return {'success': False, 'message': str(e)}


def handle_signup_message(event: Dict) -> tuple:
    """Handle signup message from Slack - ONLY with trigger code"""
    try:
        channel = event.get('channel')
        text = event.get('text', '')
        user = event.get('user')

        # Ignore bot messages
        if event.get('bot_id'):
            logger.debug("Ignoring bot message")
            return jsonify({'status': 'ignored'}), 200

        # Only process from signup channel (if configured)
        if SLACK_SIGNUP_CHANNEL and channel != SLACK_SIGNUP_CHANNEL:
            logger.debug(f"Ignoring message from channel {channel}, expected {SLACK_SIGNUP_CHANNEL}")
            return jsonify({'status': 'ignored_wrong_channel'}), 200

        # **CRITICAL: Only process if message contains the trigger code**
        if SIGNUP_TRIGGER_CODE not in text:
            logger.debug(f"Message does not contain trigger code '{SIGNUP_TRIGGER_CODE}', ignoring")
            return jsonify({'status': 'no_trigger_code'}), 200

        logger.info(f"🔥 TRIGGER CODE DETECTED - Processing signup from user {user} in channel {channel}")

        # Extract signup data
        signup_data = SignupDataExtractor.extract(text)

        if not signup_data:
            logger.warning("Trigger code found but no valid signup data in message")
            return jsonify({'status': 'no_signup_data'}), 200

        # Process signup
        result = SignupProcessor.process_signup(signup_data)
        logger.info(f"Signup result: {result}")

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error handling signup message: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/process', methods=['POST'])
def process_signup_webhook():
    """Direct webhook for manual signup processing"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        result = SignupProcessor.process_signup(data)
        status_code = 200 if result['success'] else 400
        return jsonify(result), status_code

    except Exception as e:
        logger.error(f"Error in webhook: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'module': 'signup_automation',
        'channel': SLACK_SIGNUP_CHANNEL,
        'trigger_code': SIGNUP_TRIGGER_CODE,
        'bubble_configured': bool(BUBBLE_API_KEY),
        'slack_configured': bool(SLACK_WEBHOOK_URL)
    }), 200
