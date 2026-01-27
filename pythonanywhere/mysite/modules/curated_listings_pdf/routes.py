from flask import Blueprint, request, jsonify, make_response
from .curated_listings_generator import CuratedListingsGenerator
from .config import CuratedListingsConfig
import logging
import os
from datetime import datetime
from dotenv import load_dotenv
from ..logging.logger import log_success, log_error

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(env_path)

logger = logging.getLogger(__name__)

curated_listings_generator = Blueprint('curated_listings_generator', __name__)

@curated_listings_generator.route(CuratedListingsConfig.generate_listings_endpoint, methods=['POST'])
def generate_curated_listings():
    """
    Generate a curated listings PDF from the provided data (synchronous version).
    This endpoint maintains backward compatibility and doesn't support translation.
    """
    try:
        data = request.json
        if not data:
            error_msg = "No data provided"
            logger.error(error_msg)
            log_error(f"Curated Listings PDF - API Error: {error_msg}")
            return jsonify({'error': error_msg}), 400

        # Generate the PDF
        try:
            pdf_buffer = CuratedListingsGenerator().create_listings(data)

            # Generate a filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f'curated_listings_{timestamp}.pdf'

            response = make_response(pdf_buffer.getvalue())
            response.mimetype = 'application/pdf'
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename={filename}'

            log_success(f"Curated Listings PDF - Successfully generated PDF via sync endpoint")
            return response

        except Exception as e:
            error_msg = f"Error generating curated listings: {str(e)}"
            logger.error(error_msg)
            log_error(f"Curated Listings PDF - Generation Error: {error_msg}")
            return jsonify({'error': error_msg}), 500

    except Exception as e:
        error_msg = f"API Error: {str(e)}"
        logger.error(error_msg)
        log_error(f"Curated Listings PDF - API Error: {error_msg}")
        return jsonify({'error': error_msg}), 400

@curated_listings_generator.route(CuratedListingsConfig.generate_listings_translated_endpoint, methods=['POST'])
async def generate_translated_listings():
    """
    Generate a translated curated listings PDF from the provided data (async version).
    This endpoint supports translation based on the 'language' field in the request.

    Expected request format:
    {
        "language": "es_ES",  # Language code (optional, defaults to en_US)
        "title": "Property Listings",  # Content in English
        "property_details": "Details about the property...",  # Content in English
        ...
    }
    """
    try:
        data = request.json
        if not data:
            error_msg = "No data provided"
            logger.error(error_msg)
            log_error(f"Curated Listings PDF - API Error: {error_msg}")
            return jsonify({'error': error_msg}), 400

        # Validate required fields
        required_fields = ['title', 'property_details', 'location']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(error_msg)
            log_error(f"Curated Listings PDF - Validation Error: {error_msg}")
            return jsonify({'error': error_msg}), 400

        try:
            # Generate the translated PDF
            pdf_buffer = await CuratedListingsGenerator().create_listings_async(data)

            # Generate a filename with timestamp and language
            language = data.get('language', 'en_US')
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f'curated_listings_{language}_{timestamp}.pdf'

            response = make_response(pdf_buffer.getvalue())
            response.mimetype = 'application/pdf'
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename={filename}'

            log_success(f"Curated Listings PDF - Successfully generated translated PDF for language: {language}")
            return response

        except ValueError as ve:
            # Handle validation errors from the generator
            error_msg = str(ve)
            logger.error(error_msg)
            log_error(f"Curated Listings PDF - Validation Error: {error_msg}")
            return jsonify({'error': error_msg}), 400

        except Exception as e:
            # Handle other generator errors
            error_msg = f"Error generating translated curated listings: {str(e)}"
            logger.error(error_msg)
            log_error(f"Curated Listings PDF - Generation Error: {error_msg}")
            return jsonify({'error': error_msg}), 500

    except Exception as e:
        error_msg = f"API Error: {str(e)}"
        logger.error(error_msg)
        log_error(f"Curated Listings PDF - API Error: {error_msg}")
        return jsonify({'error': error_msg}), 400

@curated_listings_generator.route(CuratedListingsConfig.template_endpoint, methods=['GET'])
def get_template():
    """Get the template structure for the curated listings"""
    template = {
        "language": "string - Language code (en_US, es_ES, fr_FR, etc.)",
        "title": "string - Listings title",
        "property_details": "string - Property details and description",
        "location": "string - Property location and address",
        "pricing": "string - Pricing information",
        "amenities": "string - Property amenities (comma-separated)",
        "neighborhood": "string - Neighborhood information",
        "transportation": "string - Public transportation options",
        "schools": "string - Nearby schools information",
        "shopping": "string - Shopping and dining options",
        "utilities": "string - Utilities information",
        "pet_policy": "string - Pet policy details",
        "lease_terms": "string - Lease terms and conditions",
        "application_process": "string - Application process details",
        "contact_info": "string - Contact information"
    }

    # Add available languages
    languages = {
        "available_languages": list(CuratedListingsConfig.LANGUAGE_NAMES.keys()),
        "template": template
    }

    return jsonify(languages)
