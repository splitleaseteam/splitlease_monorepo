"""Routes for health monitoring."""
from flask import Blueprint, jsonify, current_app
from modules.core.health import get_health_tracker
import logging

monitoring = Blueprint('monitoring', __name__)
logger = logging.getLogger(__name__)

@monitoring.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint that returns the application's health status.
    
    Returns:
        JSON response containing:
        - Overall status (healthy/degraded)
        - Last check timestamp
        - Service-specific statuses
        - Application uptime
    """
    try:
        health_tracker = get_health_tracker()
        status = health_tracker.get_status()
        return jsonify(status)
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
