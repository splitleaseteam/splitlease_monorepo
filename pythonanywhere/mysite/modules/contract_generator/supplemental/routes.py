from flask import Blueprint, request, jsonify, send_file
from modules.contract_generator.supplemental.generator import SupplementalAgreementGenerator
import logging
import os
import json
import traceback
from modules.logging.error_logger import log_error
from modules.logging.success_logger import log_success

supplemental_agreement = Blueprint('supplemental_agreement', __name__)
logger = logging.getLogger(__name__)

# Initialize generator with base directory (pointing to project root, not modules directory)
base_dir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
generator = SupplementalAgreementGenerator(base_dir)

@supplemental_agreement.route('/supplemental', methods=['POST'])
def generate_agreement():
    try:
        # Log request details
        logger.info("=== New Supplemental Agreement Request ===")
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

        # Validate date fields
        date_fields = ['Check in Date', 'Check Out Date']
        for field in date_fields:
            if field in data and data[field]:
                try:
                    generator.get_date(data[field])
                except ValueError:
                    error_msg = f'Invalid date format for {field}. Expected format: mm/dd/yy'
                    logger.error(error_msg)
                    return jsonify({
                        'success': False,
                        'error': error_msg
                    }), 400

        # Generate agreement
        result = generator.create_agreement(data)
        logger.info(f"Generator result: {json.dumps({k:v for k,v in result.items() if k != 'file_path'}, indent=2)}")

        if not result['success']:
            log_error(f"Failed to generate supplemental agreement: {result.get('error')}")
            return jsonify(result), 500

        # Return Google Drive URL in response body
        if 'web_view_link' in result:
            log_success("Supplemental agreement generated and uploaded successfully")
            return jsonify({
                'success': True,
                'message': 'Supplemental agreement generated successfully',
                'web_view_link': result['web_view_link'],
                'file_path': result['file_path'],
                'filename': result['filename']
            })
        elif 'drive_error' in result:
            log_error(f"Supplemental agreement generated but Drive upload failed: {result.get('drive_error')}")
            return jsonify({
                'success': True,
                'message': 'Supplemental agreement generated successfully but failed to upload to Drive',
                'drive_error': result['drive_error'],
                'file_path': result['file_path'],
                'filename': result['filename']
            })

        logger.info("=== Request Complete ===")

    except Exception as e:
        error_msg = f"Error processing request: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        log_error(error_msg)
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500

@supplemental_agreement.route('/template', methods=['GET'])
def get_template():
    """Return the template file for download"""
    try:
        template_path = generator.template_path
        if not os.path.exists(template_path):
            error_msg = f"Template file not found at {template_path}"
            logger.error(error_msg)
            log_error(error_msg)
            return jsonify({'success': False, 'error': error_msg}), 404
            
        return send_file(
            template_path,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name='supplementalagreement_template.docx'
        )
    except Exception as e:
        error_msg = f"Error retrieving template: {str(e)}"
        logger.error(error_msg)
        log_error(error_msg)
        return jsonify({'success': False, 'error': error_msg}), 500
