from flask import Blueprint, request, jsonify, send_file, make_response
from .generator import HostPayoutGenerator
import logging
import os
import json
import traceback

host_payout_blueprint = Blueprint('host_payout', __name__)
logger = logging.getLogger(__name__)

# Initialize generator with base directory
# Point to the project root instead of the modules directory
base_dir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
generator = HostPayoutGenerator(base_dir)

@host_payout_blueprint.route('/host_payout', methods=['POST'])
def generate_schedule():
    """
    Generate a host payout schedule

    Expected JSON body should contain all necessary fields:
    {
        "Agreement Number": "string",
        "Host Name": "string",
        "Host Email": "string",
        "Host Phone": "string",
        "Address": "string",
        "Payout Number": "string",
        "Maintenance Fee": "string",
        "Date1": "mm/dd/yy",
        "Rent1": "string",
        "Total1": "string"
    }
    """
    try:
        # Log request details
        logger.info("=== New Host Payout Schedule Request ===")
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
            return jsonify({'success': False, 'error': error_msg, 'returned_error': 'yes'}), 400

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
                'error': error_msg,
                'returned_error': 'yes'
            }), 400

        # Validate at least one payment entry
        has_payment = False
        for i in range(1, 14):
            if (data.get(f'Date{i}') and
                data.get(f'Rent{i}') and
                data.get(f'Total{i}')):
                has_payment = True
                break

        if not has_payment:
            error_msg = 'At least one complete payment entry (Date, Rent, Total) is required'
            logger.error(error_msg)
            return jsonify({
                'success': False,
                'error': error_msg,
                'returned_error': 'yes'
            }), 400

        # Generate schedule
        result = generator.create_schedule(data)
        logger.info(f"Generator result: {json.dumps({k:v for k,v in result.items() if k != 'file_path'}, indent=2)}")

        if not result['success']:
            return jsonify(result), 500

        # Always return a JSON response with success status and drive link
        # This ensures the client always gets a consistent response format
        response_data = {
            'success': True,
            'filename': result['filename'],
            'returned_error': 'no'
        }
        
        # Add Google Drive information if available
        if 'web_view_link' in result:
            response_data['drive_url'] = result['web_view_link']
            response_data['file_id'] = result.get('file_id', '')
        
        logger.info("=== Request Complete ===")
        return jsonify(response_data)

    except Exception as e:
        error_msg = f"Error processing request: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        return jsonify({'success': False, 'error': error_msg, 'returned_error': 'yes'}), 500

@host_payout_blueprint.route('/host_payout_download', methods=['POST'])
def download_schedule():
    """
    Generate a host payout schedule and return the file for download
    Uses the same request format as the main endpoint
    """
    try:
        data = request.get_json()
        if not data:
            error_msg = "No data provided in request"
            logger.error(error_msg)
            return jsonify({'success': False, 'error': error_msg, 'returned_error': 'yes'}), 400
            
        # Generate schedule
        result = generator.create_schedule(data)
        
        if not result['success']:
            return jsonify(result), 500
            
        # Prepare file response
        file_response = send_file(
            result['file_path'],
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=result['filename']
        )
        
        # Add success metadata to headers
        file_response.headers['X-Success'] = 'true'
        file_response.headers['X-Returned-Error'] = 'no'
        
        # Add Google Drive link to response headers if available
        if 'web_view_link' in result:
            file_response.headers['X-Google-Drive-Link'] = result['web_view_link']
            file_response.headers['X-File-ID'] = result.get('file_id', '')
        
        logger.info("=== File Download Complete ===")
        return file_response
        
    except Exception as e:
        error_msg = f"Error processing download request: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        return jsonify({'success': False, 'error': error_msg, 'returned_error': 'yes'}), 500

@host_payout_blueprint.route('/template', methods=['GET'])
def get_template():
    """Get the template structure for the host payout schedule"""
    template = {
        "Agreement Number": "string - Unique identifier for the agreement",
        "Host Name": "string - Name of the host",
        "Host Email": "string - Email address of the host",
        "Host Phone": "string - Phone number of the host",
        "Address": "string - Property address",
        "Payout Number": "string - Unique payout schedule identifier",
        "Maintenance Fee": "string - Maintenance fee amount",
    }

    # Add payment schedule entries
    for i in range(1, 14):
        template.update({
            f"Date{i}": f"string - Payment date {i} (Format: mm/dd/yy)",
            f"Rent{i}": f"string - Rent amount for payment {i}",
            f"Total{i}": f"string - Total amount for payment {i}"
        })

    return jsonify(template)

# Export the Blueprint with the correct name
host_payout = host_payout_blueprint
