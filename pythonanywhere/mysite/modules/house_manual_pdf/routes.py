from flask import Blueprint, request, jsonify, make_response
from .house_manual_generator import HouseManualGenerator
import logging
from datetime import datetime
from ..logging.logger import log_success, log_error

logger = logging.getLogger(__name__)

house_manual_generator = Blueprint('house_manual_generator', __name__)
generator = HouseManualGenerator()

@house_manual_generator.route('/generate_manual', methods=['POST'])
def generate_house_manual():
    """
    Generate a house manual PDF from the provided data (synchronous version).
    This endpoint maintains backward compatibility and doesn't support translation.
    """
    try:
        data = request.json
        if not data:
            error_msg = "No data provided"
            logger.error(error_msg)
            log_error(f"House Manual PDF - API Error: {error_msg}")
            return jsonify({'error': error_msg}), 400

        # Generate the PDF
        try:
            pdf_buffer = generator.create_manual(data)

            # Generate a filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f'house_manual_{timestamp}.pdf'

            response = make_response(pdf_buffer.getvalue())
            response.mimetype = 'application/pdf'
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename={filename}'

            log_success(f"House Manual PDF - Successfully generated PDF via sync endpoint")
            return response

        except Exception as e:
            error_msg = f"Error generating house manual: {str(e)}"
            logger.error(error_msg)
            log_error(f"House Manual PDF - Generation Error: {error_msg}")
            return jsonify({'error': error_msg}), 500

    except Exception as e:
        error_msg = f"API Error: {str(e)}"
        logger.error(error_msg)
        log_error(f"House Manual PDF - API Error: {error_msg}")
        return jsonify({'error': error_msg}), 400

@house_manual_generator.route('/generate_manual_translated', methods=['POST'])
async def generate_translated_manual():
    """
    Generate a translated house manual PDF from the provided data (async version).
    This endpoint supports translation based on the 'language' field in the request.

    Expected request format:
    {
        "language": "es_ES",  # Language code (optional, defaults to en_US)
        "title": "Welcome to Our House",  # Content in English
        "checkin": "Here's how to check in...",  # Content in English
        ...
    }
    """
    try:
        data = request.json
        if not data:
            error_msg = "No data provided"
            logger.error(error_msg)
            log_error(f"House Manual PDF - API Error: {error_msg}")
            return jsonify({'error': error_msg}), 400

        # Validate required fields
        required_fields = ['address']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(error_msg)
            log_error(f"House Manual PDF - Validation Error: {error_msg}")
            return jsonify({'error': error_msg}), 400

        try:
            # Generate the translated PDF
            pdf_buffer = await generator.create_manual_async(data)

            # Generate a filename with timestamp and language
            language = data.get('language', 'en_US')
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f'house_manual_{language}_{timestamp}.pdf'

            response = make_response(pdf_buffer.getvalue())
            response.mimetype = 'application/pdf'
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename={filename}'

            log_success(f"House Manual PDF - Successfully generated translated PDF for language: {language}")
            return response

        except ValueError as ve:
            # Handle validation errors from the generator
            error_msg = str(ve)
            logger.error(error_msg)
            log_error(f"House Manual PDF - Validation Error: {error_msg}")
            return jsonify({'error': error_msg}), 400

        except Exception as e:
            # Handle other generator errors
            error_msg = f"Error generating translated house manual: {str(e)}"
            logger.error(error_msg)
            log_error(f"House Manual PDF - Generation Error: {error_msg}")
            return jsonify({'error': error_msg}), 500

    except Exception as e:
        error_msg = f"API Error: {str(e)}"
        logger.error(error_msg)
        log_error(f"House Manual PDF - API Error: {error_msg}")
        return jsonify({'error': error_msg}), 400

@house_manual_generator.route('/template', methods=['GET'])
def get_template():
    """Get the template structure for the house manual"""
    template = {
        "language": "string - Language code (en_US, es_ES, fr_FR, etc.)",
        "title": "string - Manual title",
        "checkin": "string - Check-in instructions",
        "address": "string - Property address",
        "specificguidelines": "string - Specific guidelines for the property",
        "guidelinename": "string - Custom name for guidelines section",
        "destinationnavigation": "string - Navigation tips",
        "availableparking": "string - Available parking info",
        "parkingtips": "string - Parking tips",
        "recordingdevices": "string - Recording devices info",
        "firstaid": "string - First aid information",
        "securitysettings": "string - Security procedures",
        "firesafety": "string - Fire safety info",
        "houserules": "string - House rules (comma-separated)",
        "hostrequests": "string - Host requests",
        "furniture": "string - Furniture policy",
        "grievances": "string - Issue resolution process",
        "spaceforbelongings": "string - Storage information",
        "offlimitareas": "string - Off-limit areas",
        "additionalhouserules": "string - Additional rules",
        "thingstoknow": "string - Important information",
        "wifiname": "string - WiFi network name",
        "wifipassword": "string - WiFi password",
        "entertainment": "string - Entertainment guide",
        "trash": "string - Trash guidelines",
        "laundry": "string - Laundry information",
        "thermostatguide": "string - Temperature control guide",
        "kitchenguide": "string - Kitchen usage guide",
        "diningtips": "string - Dining information",
        "amenitiestips": "string - Amenities usage guide",
        "thingstodo": "string - Local activities",
        "checkingout": "string - Checkout instructions",
        "departurechecklist": "string - Departure checklist (comma-separated)"
    }

    # Add available languages
    languages = {
        "available_languages": list(generator.LANGUAGE_NAMES.keys()),
        "template": template
    }

    return jsonify(languages)
