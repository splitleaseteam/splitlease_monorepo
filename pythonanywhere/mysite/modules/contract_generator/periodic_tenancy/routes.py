from flask import Blueprint, request, jsonify, send_file
from .generator import PeriodicTenancyGenerator
import logging
import os
import traceback
import json
from modules.logging.error_logger import log_error
from modules.logging.success_logger import log_success

periodic_tenancy = Blueprint('periodic_tenancy', __name__)
logger = logging.getLogger(__name__)

# Initialize generator with base directory (pointing to project root, not modules directory)
base_dir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
generator = PeriodicTenancyGenerator(base_dir)

@periodic_tenancy.route('/periodic_tenancy', methods=['POST'])
def generate_agreement():
    """
    Generate a periodic tenancy agreement and upload to Google Drive
    """
    file_path = None
    try:
        # Log request details
        logger.info("=== New Request ===")
        logger.info(f"Content-Type: {request.headers.get('Content-Type', 'Not specified')}")
        logger.info(f"Request Headers: {dict(request.headers)}")

        # Validate content type
        if not request.is_json:
            error_msg = "Request Content-Type must be application/json"
            logger.error(error_msg)
            log_error(error_msg)
            return jsonify({
                'success': False,
                'error': error_msg,
                'returned_error': 'yes'
            }), 400

        try:
            data = request.get_json()
            # Log sanitized request data (remove sensitive info)
            safe_data = {k: v for k, v in data.items() if not any(sensitive in k.lower() for sensitive in ['password', 'token', 'key'])}
            logger.info(f"Request data: {json.dumps(safe_data, indent=2)}")
        except Exception as e:
            error_msg = f"Failed to parse JSON request: {str(e)}"
            logger.error(f"{error_msg}\nRequest data: {request.get_data(as_text=True)}")
            log_error(error_msg)
            return jsonify({
                'success': False,
                'error': error_msg,
                'returned_error': 'yes'
            }), 400

        if not data:
            error_msg = "No data provided in request body"
            logger.error(error_msg)
            log_error(error_msg)
            return jsonify({
                'success': False,
                'error': error_msg,
                'returned_error': 'yes'
            }), 400

        # Required fields validation
        required_fields = [
            'Agreement Number'
        ]

        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            error_msg = f'Missing required fields: {", ".join(missing_fields)}'
            logger.error(f"{error_msg}\nProvided fields: {list(data.keys())}")
            log_error(error_msg)
            return jsonify({
                'success': False,
                'error': error_msg,
                'returned_error': 'yes'
            }), 400

        # Data type validation
        date_fields = ['Check in Date', 'Check Out Date']
        for field in date_fields:
            if field in data and not isinstance(data[field], str):
                error_msg = f"Field '{field}' must be a string"
                logger.error(f"{error_msg}. Got type: {type(data[field])}")
                log_error(error_msg)
                return jsonify({
                    'success': False,
                    'error': error_msg,
                    'returned_error': 'yes'
                }), 400

        # Generate agreement
        try:
            logger.info("Calling generator.create_agreement")
            result = generator.create_agreement(data)
            logger.info(f"Generator result: {json.dumps({k:v for k,v in result.items() if k != 'file_path'}, indent=2)}")
        except Exception as e:
            error_msg = f"Generator error: {str(e)}"
            logger.error(f"{error_msg}\n{traceback.format_exc()}")
            log_error(error_msg)
            return jsonify({
                'success': False,
                'error': error_msg,
                'returned_error': 'yes'
            }), 500

        if not result['success']:
            logger.error(f"Generator returned error: {result.get('error', 'Unknown error')}")
            log_error(f"Generator returned error: {result.get('error', 'Unknown error')}")
            return jsonify(result), 500

        # Store file_path for cleanup
        file_path = result.get('file_path')

        # Create response with file details and Drive link
        response_data = {
            'success': True,
            'filename': result['filename'],
            'returned_error': 'no'
        }

        # Add Google Drive information if available
        if 'web_view_link' in result:
            logger.info("Google Drive upload successful")
            log_success("Periodic tenancy agreement generated and uploaded successfully")
            response_data['drive_url'] = result['web_view_link']
            response_data['file_id'] = result['file_id']
        elif 'drive_upload_error' in result:
            logger.warning(f"Drive upload failed: {result['drive_upload_error']}")
            log_error(f"Periodic tenancy agreement generated but Drive upload failed: {result['drive_upload_error']}")
            response_data['drive_upload_error'] = result['drive_upload_error']

        # Return the response before cleaning up the file
        response = jsonify(response_data)

        # Clean up temporary file
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
        except Exception as cleanup_error:
            logger.warning(f"Failed to clean up temporary file {file_path}: {str(cleanup_error)}")

        logger.info("=== Request Complete ===")
        return response

    except Exception as e:
        # Log the full error with traceback
        error_msg = f"Error processing request: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        log_error(error_msg)

        # Clean up temporary file if it exists
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up temporary file after error: {file_path}")
        except Exception as cleanup_error:
            logger.warning(f"Failed to clean up temporary file {file_path}: {str(cleanup_error)}")

        return jsonify({
            'success': False,
            'error': error_msg,
            'returned_error': 'yes'
        }), 500

@periodic_tenancy.route('/template', methods=['GET'])
def get_template():
    """Get the template structure for the periodic tenancy agreement"""
    template = {
        "Agreement Number": "string - Unique identifier for the agreement",
        "Check in Date": "string - Format: mm/dd/yy",
        "Check Out Date": "string - Format: mm/dd/yy",
        "Check In Day": "string - Day of check-in",
        "Check Out Day": "string - Day of check-out",
        "Number of weeks": "string - Duration in weeks",
        "Guests Allowed": "string - Number of guests allowed",
        "Host name": "string - Name of the host",
        "Guest name": "string - Name of the guest",
        "Supplemental Number": "string - Supplemental agreement number",
        "Authorization Card Number": "string - Credit card authorization form number",
        "Host Payout Schedule Number": "string - Payout schedule number",
        "Extra Requests on Cancellation Policy": "string - Additional cancellation terms",
        "Damage Deposit": "string - Damage deposit amount",
        "Listing Title": "string - Title of the listing",
        "Space Details": "string - Details about the space",
        "Listing Description": "string - Full description of the listing",
        "Location": "string - Property location",
        "Type of Space": "string - Type of property/space",
        "image1": "string (optional) - Base64 encoded image",
        "image2": "string (optional) - Base64 encoded image",
        "image3": "string (optional) - Base64 encoded image"
    }

    return jsonify(template)
