"""
Slack Request Verification
Verifies requests are actually from Slack using HMAC-SHA256 signature
"""
import hmac
import hashlib
import time
import logging

logger = logging.getLogger(__name__)


def verify_request_signature(request_body: bytes, timestamp: str, signature: str, signing_secret: str) -> bool:
    """
    Verify that request came from Slack

    Args:
        request_body: Raw request body as bytes
        timestamp: X-Slack-Request-Timestamp header
        signature: X-Slack-Signature header
        signing_secret: Your Slack app's signing secret

    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Check timestamp to prevent replay attacks
        current_timestamp = int(time.time())
        if abs(current_timestamp - int(timestamp)) > 60 * 5:
            logger.warning(f"Request timestamp too old: {timestamp}")
            return False

        # Create signature base string
        sig_basestring = f"v0:{timestamp}:".encode('utf-8') + request_body

        # Calculate expected signature
        my_signature = 'v0=' + hmac.new(
            signing_secret.encode('utf-8'),
            sig_basestring,
            hashlib.sha256
        ).hexdigest()

        # Compare signatures
        is_valid = hmac.compare_digest(my_signature, signature)

        if not is_valid:
            logger.warning(f"Signature mismatch. Expected: {my_signature[:20]}..., Got: {signature[:20]}...")

        return is_valid

    except Exception as e:
        logger.error(f"Error verifying signature: {e}")
        return False
