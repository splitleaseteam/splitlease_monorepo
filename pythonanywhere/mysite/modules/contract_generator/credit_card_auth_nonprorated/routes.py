from flask import Blueprint, request, jsonify, send_file
from .generator import CreditCardAuthNonProratedGenerator
import logging
import os
import json
import traceback

credit_card_auth_nonprorated = Blueprint('credit_card_auth_nonprorated', __name__)
logger = logging.getLogger(__name__)

# Initialize generator with base directory
base_dir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
generator = CreditCardAuthNonProratedGenerator(base_dir)

@credit_card_auth_nonprorated.route('/recurring_card_auth_nonprorated', methods=['POST'])
def generate_authorization():
    """
    Generate a recurring credit card authorization form (non-prorated) and upload to Google Drive

    Expected JSON body should contain all necessary fields:
    {
        "Agreement Number": "string",
        "Host Name": "string",
        "Guest Name": "string",
        "Four Week Rent": "string",
        "Maintenance Fee": "string",
        "Damage Deposit": "string",
        "Splitlease Credit": "string",
        "Last Payment Rent": "string",
        "Weeks Number": "string",
        "Listing Description": "string",
        "Penultimate Week Number": "string",
        "Number of Payments": "string",
        "Last Payment Weeks": "string"
    }

    Returns:
        JSON response with file details and Google Drive link
    """
    try:
        # Log request details
        logger.info("=== New Recurring Card Auth Non-Prorated Request ===")
        logger.info(f"Content-Type: {request.headers.get('Content-Type', 'Not specified')}")
        logger.info(f"Request Headers: {dict(request.headers)}")
        
        # Log raw request data for debugging
        raw_data = request.get_data(as_text=True)
        logger.info(f"Raw request data: {raw_data}")
        
        data = request.get_json()
        
        # Log sanitized request data
        safe_data = {k: v for k, v in data.items() if not any(sensitive in k.lower() for sensitive in ['password', 'token', 'key'])}
        logger.info(f"Parsed request data: {json.dumps(safe_data, indent=2)}")

        if not data:
            error_msg = "No data provided in request"
            logger.error(error_msg)
            return jsonify({'success': False, 'error': error_msg}), 400

        # Required fields validation
        required_fields = [
            'Agreement Number'
        ]

        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            error_msg = f'Missing required fields: {", ".join(missing_fields)}'
            logger.error(error_msg)
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400

        # Validate currency fields
        currency_fields = [
            'Four Week Rent',
            'Maintenance Fee',
            'Damage Deposit',
            'Splitlease Credit',
            'Last Payment Rent'
        ]

        for field in currency_fields:
            try:
                generator.convert_currency_to_float(data[field])
            except ValueError:
                error_msg = f'Invalid currency value for {field}: {data[field]}'
                logger.error(error_msg)
                return jsonify({
                    'success': False,
                    'error': error_msg
                }), 400

        # Generate authorization and upload to Drive
        result = generator.create_authorization(data)
        logger.info(f"Generator result: {json.dumps({k:v for k,v in result.items() if k != 'file_path'}, indent=2)}")

        if not result['success']:
            return jsonify(result), 500

        # Create response with file details and Drive link
        response_data = {
            'success': True,
            'filename': result['filename']
        }

        # Add Google Drive information if available
        if 'web_view_link' in result:
            response_data['drive_url'] = result['web_view_link']
            response_data['file_id'] = result['file_id']
        elif 'drive_upload_error' in result:
            response_data['drive_upload_error'] = result['drive_upload_error']

        # Clean up temporary file
        try:
            os.remove(result['file_path'])
            logger.info(f"Cleaned up temporary file: {result['file_path']}")
        except Exception as e:
            logger.warning(f"Failed to clean up temporary file {result['file_path']}: {str(e)}")

        logger.info("=== Request Complete ===")
        return jsonify(response_data)

    except Exception as e:
        error_msg = f"Error processing request: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500

@credit_card_auth_nonprorated.route('/template', methods=['GET'])
def get_template():
    """Get the template structure for the recurring credit card authorization form"""
    template = {
        "Agreement Number": "string - Unique identifier for the agreement",
        "Host Name": "string - Name of the host",
        "Guest Name": "string - Name of the guest",
        "Four Week Rent": "string - Four week rent amount (e.g., '1000' or '1,000')",
        "Maintenance Fee": "string - Maintenance fee amount",
        "Damage Deposit": "string - Damage deposit amount",
        "Splitlease Credit": "string - Splitlease credit amount",
        "Last Payment Rent": "string - Last payment rent amount",
        "Weeks Number": "string - Total number of weeks",
        "Listing Description": "string - Description of the listing",
        "Penultimate Week Number": "string - Week number of the penultimate payment",
        "Number of Payments": "string - Total number of payments",
        "Last Payment Weeks": "string - Number of weeks in the last payment"
    }

    return jsonify(template)
