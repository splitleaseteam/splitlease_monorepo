"""
Slack Request Verification
Implements HMAC-SHA256 signature verification for incoming Slack webhooks
"""
import hmac
import hashlib
import time
import logging
from functools import wraps
from flask import request, jsonify

logger = logging.getLogger(__name__)


def verify_slack_signature(slack_signing_secret: str):
    """
    Decorator to verify Slack request signatures

    Args:
        slack_signing_secret: The signing secret from Slack app credentials

    Returns:
        Wrapped function that verifies signatures before processing
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get signature headers
            slack_signature = request.headers.get('X-Slack-Signature', '')
            slack_timestamp = request.headers.get('X-Slack-Request-Timestamp', '')

            if not slack_signature or not slack_timestamp:
                logger.warning("Missing Slack signature headers")
                return jsonify({'error': 'Invalid request - missing signature'}), 403

            # Check timestamp to prevent replay attacks (within 5 minutes)
            try:
                request_timestamp = int(slack_timestamp)
                if abs(time.time() - request_timestamp) > 300:
                    logger.warning(f"Request timestamp too old: {slack_timestamp}")
                    return jsonify({'error': 'Invalid request - timestamp expired'}), 403
            except ValueError:
                logger.warning(f"Invalid timestamp format: {slack_timestamp}")
                return jsonify({'error': 'Invalid request - bad timestamp'}), 403

            # Get raw request body (must be exact bytes, not parsed JSON)
            request_body = request.get_data().decode('utf-8')

            # Create signature base string
            sig_basestring = f'v0:{slack_timestamp}:{request_body}'

            # Calculate expected signature
            my_signature = 'v0=' + hmac.new(
                slack_signing_secret.encode(),
                sig_basestring.encode(),
                hashlib.sha256
            ).hexdigest()

            # Compare signatures using constant-time comparison
            if not hmac.compare_digest(my_signature, slack_signature):
                logger.warning("Signature verification failed")
                logger.debug(f"Expected: {my_signature}")
                logger.debug(f"Received: {slack_signature}")
                return jsonify({'error': 'Invalid request - signature mismatch'}), 403

            logger.debug("Signature verified successfully")
            return f(*args, **kwargs)

        return decorated_function
    return decorator


def verify_request_signature(request_data: bytes, timestamp: str, signature: str, signing_secret: str) -> bool:
    """
    Standalone function to verify a Slack request signature

    Args:
        request_data: Raw request body as bytes
        timestamp: X-Slack-Request-Timestamp header value
        signature: X-Slack-Signature header value
        signing_secret: Slack app signing secret

    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Check timestamp
        request_timestamp = int(timestamp)
        if abs(time.time() - request_timestamp) > 300:
            logger.warning("Timestamp too old")
            return False

        # Create signature
        sig_basestring = f'v0:{timestamp}:{request_data.decode("utf-8")}'
        expected_signature = 'v0=' + hmac.new(
            signing_secret.encode(),
            sig_basestring.encode(),
            hashlib.sha256
        ).hexdigest()

        # Compare
        return hmac.compare_digest(expected_signature, signature)

    except Exception as e:
        logger.error(f"Error verifying signature: {e}")
        return False
