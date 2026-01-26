from flask import Blueprint, request, jsonify
import logging
import requests
import traceback
from . import google_doc_parser
from modules.logging.logger import log_error, log_success

# Initialize logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Configure logging
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Create blueprint
bp = Blueprint('doc_parser', __name__)

# Test Slack webhooks
def test_slack_webhooks():
    try:
        logger.info("Testing Slack webhooks...")
        # Test error webhook
        log_error("Server Reloaded(Error Test Message from Doc Parser routes )")
        
        # Test log webhook
        log_success("Server Reloaded(Log Test Message from Doc Parser routes )")

    except Exception as e:
        logger.error(f"Failed to test webhooks: {str(e)}", exc_info=True)

# Test webhooks on module load
test_slack_webhooks()

# Initialize parser on module load
logger.info("Initializing Google Doc parser...")
# Removed direct import of webhook URLs; parser now uses module defaults
google_doc_parser.init_parser()
logger.info("Google Doc parser initialized")

@bp.route('/parse', methods=['POST'])
def process_doc():
    """Process a Google Doc URL and return its content"""
    try:
        logger.info("Received request to process document")
        data = request.get_json()
        if not data:
            error_msg = "No JSON data received"
            logger.error(error_msg)
            log_error(f"Doc Parser Error: {error_msg}")
            return jsonify({"error": error_msg}), 400

        pdf_url = data.get('pdf_url')
        if not pdf_url:
            error_msg = "No PDF URL provided"
            logger.error(error_msg)
            log_error(f"Doc Parser Error: {error_msg}")
            return jsonify({"error": error_msg}), 400

        logger.info(f"Processing document URL: {pdf_url}")
        log_success(f"Processing document: {pdf_url}")

        # Get the parser instance
        logger.info("Getting parser instance...")
        parser = google_doc_parser.get_parser()
        logger.info("Parser instance retrieved")

        # Use the process_doc method which handles the entire flow
        logger.info("Starting document processing...")
        result = parser.process_doc(pdf_url)
        logger.info("Document processing completed")

        if result["success"]:
            success_msg = f"Successfully processed document: {pdf_url}"
            logger.info(success_msg)
            log_success(success_msg)
            return jsonify({"content": result["content"]}), 200
        else:
            error_msg = f"Failed to process document: {result['error']}"
            logger.error(error_msg)
            log_error(f"Doc Parser Error: {error_msg}")
            return jsonify({"error": result["error"]}), 400

    except Exception as e:
        error_msg = f"Error processing document: {str(e)}"
        logger.error(error_msg, exc_info=True)
        log_error(f"Doc Parser Error: {error_msg}\n{traceback.format_exc()}")
        return jsonify({"error": error_msg}), 500
