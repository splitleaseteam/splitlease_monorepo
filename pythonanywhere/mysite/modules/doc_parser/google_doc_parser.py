import requests
import io
from PyPDF2 import PdfReader
import re
import json
import logging
import os
import traceback
import sys
from typing import Optional, Dict, Union, BinaryIO
from modules.logging.config import LoggingConfig  # load default webhooks

# Initialize logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Configure logging
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Create a global parser instance
_parser = None

def init_parser(error_webhook_url: str = None, success_webhook_url: str = None):
    """Initialize the global parser instance with defaults from LoggingConfig if not provided"""
    global _parser
    # Resolve default webhook URLs
    if error_webhook_url is None:
        error_webhook_url = LoggingConfig.ERROR_WEBHOOK_URL
    if success_webhook_url is None:
        success_webhook_url = LoggingConfig.SUCCESS_WEBHOOK_URL
    logger.info("Initializing global parser instance with webhooks: %s, %s", error_webhook_url, success_webhook_url)
    _parser = GoogleDocParser(error_webhook_url, success_webhook_url)
    logger.info("Global parser instance initialized")

def get_parser():
    """Get the global parser instance"""
    global _parser
    if _parser is None:
        error_msg = "Parser not initialized. Call init_parser first."
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    return _parser

class GoogleDocParser:
    def __init__(self, error_webhook_url: str, success_webhook_url: str):
        try:
            logger.info("Initializing GoogleDocParser")
            self.error_webhook_url = error_webhook_url
            self.success_webhook_url = success_webhook_url
            self.session = requests.Session()
            self.session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            })
            
            # Try to create temp directory
            self.temp_dir = os.path.join(os.path.dirname(__file__), 'temp')
            try:
                os.makedirs(self.temp_dir, exist_ok=True)
                logger.info(f"Created temp directory at {self.temp_dir}")
            except Exception as e:
                logger.warning(f"Could not create temp directory: {str(e)}. Will skip debug PDF saving.")
                self.temp_dir = None
                
            logger.info("GoogleDocParser initialized successfully")
            
        except Exception as e:
            error_msg = f"Error initializing GoogleDocParser: {str(e)}"
            logger.error(error_msg, exc_info=True)
            self.send_error_to_slack(error_msg)
            raise

    def send_error_to_slack(self, error_msg: str):
        """Send error message to Slack"""
        try:
            logger.info(f"Sending error to Slack: {error_msg}")
            response = requests.post(self.error_webhook_url, json={"text": f"Doc Parser Error: {error_msg}"})
            logger.info(f"Slack response status: {response.status_code}")
            logger.info(f"Slack response text: {response.text}")
            
            if response.status_code != 200:
                logger.error(f"Failed to send to Slack. Status code: {response.status_code}")
                logger.error(f"Response: {response.text}")
                
        except Exception as e:
            logger.error(f"Failed to send error to Slack: {str(e)}", exc_info=True)

    def modify_and_open_google_doc_url(self, url: str) -> Optional[str]:
        """Modify Google Doc URL to get PDF export URL"""
        try:
            logger.info(f"Modifying URL: {url}")
            # Extract document ID from URL
            match = re.search(r'/document/d/([a-zA-Z0-9-_]+)', url)
            if not match:
                error_msg = f"Invalid Google Doc URL format: {url}"
                logger.error(error_msg)
                return None
                
            doc_id = match.group(1)
            export_url = f'https://docs.google.com/document/d/{doc_id}/export?format=pdf'
            logger.info(f"Modified URL: {export_url}")
            return export_url
            
        except Exception as e:
            error_msg = f"Error modifying URL: {str(e)}"
            logger.error(error_msg, exc_info=True)
            self.send_error_to_slack(error_msg)
            return None

    def download_pdf(self, url: str) -> Optional[BinaryIO]:
        """Download PDF from URL"""
        try:
            logger.info(f"Downloading PDF from URL: {url}")
            response = self.session.get(url)
            response.raise_for_status()
            
            pdf_content = io.BytesIO(response.content)
            
            # Save PDF for debugging if temp directory exists
            if self.temp_dir:
                try:
                    pdf_path = os.path.join(self.temp_dir, 'debug.pdf')
                    with open(pdf_path, 'wb') as f:
                        f.write(response.content)
                    logger.info(f"Saved debug PDF to {pdf_path}")
                except Exception as e:
                    logger.warning(f"Failed to save debug PDF: {str(e)}")
            
            logger.info("PDF downloaded successfully")
            return pdf_content
            
        except Exception as e:
            error_msg = f"Error downloading PDF: {str(e)}"
            logger.error(error_msg, exc_info=True)
            self.send_error_to_slack(error_msg)
            return None

    def parse_pdf(self, pdf_file: BinaryIO) -> Optional[str]:
        """Extract text from PDF file"""
        try:
            logger.info("Starting PDF parsing")
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            
            if not text.strip():
                error_msg = "No text extracted from PDF"
                logger.error(error_msg)
                self.send_error_to_slack(error_msg)
                return None
                
            logger.info(f"Successfully extracted {len(text)} characters from PDF")
            return text
            
        except Exception as e:
            error_msg = f"Error parsing PDF: {str(e)}"
            logger.error(error_msg, exc_info=True)
            self.send_error_to_slack(error_msg)
            return None

    def json_encode_text(self, text: str) -> str:
        """Encode text as JSON"""
        try:
            logger.info("Encoding text as JSON")
            return json.dumps({"text": text})
        except Exception as e:
            error_msg = f"Error encoding text as JSON: {str(e)}"
            logger.error(error_msg, exc_info=True)
            self.send_error_to_slack(error_msg)
            return json.dumps({"error": str(e)})

    def process_doc(self, url: str) -> Dict[str, Union[str, bool]]:
        """Process Google Doc URL to extract and return content"""
        try:
            logger.info(f"Starting to process document: {url}")
            
            modified_url = self.modify_and_open_google_doc_url(url)
            if not modified_url:
                error_msg = "Invalid Google Doc URL format or structure"
                logger.error(error_msg)
                return {"success": False, "error": error_msg}

            pdf_file = self.download_pdf(modified_url)
            if not pdf_file:
                error_msg = "Failed to download or access the document. Please ensure the document is publicly accessible."
                logger.error(error_msg)
                return {"success": False, "error": error_msg}

            extracted_text = self.parse_pdf(pdf_file)
            if not extracted_text:
                error_msg = "No text could be extracted from the document"
                logger.error(error_msg)
                return {"success": False, "error": error_msg}

            json_output = self.json_encode_text(extracted_text)
            logger.info("Successfully processed document")

            return {"success": True, "content": json_output}

        except Exception as e:
            error_msg = f"Error processing document: {str(e)}"
            logger.error(error_msg, exc_info=True)
            self.send_error_to_slack(error_msg)
            return {"success": False, "error": error_msg}

def modify_and_open_google_doc_url(url: str) -> Optional[str]:
    """Module-level interface for modifying Google Doc URL"""
    return get_parser().modify_and_open_google_doc_url(url)

def download_pdf(url: str) -> Optional[BinaryIO]:
    """Module-level interface for downloading PDF"""
    return get_parser().download_pdf(url)

def parse_pdf(pdf_file: BinaryIO) -> str:
    """Module-level interface for parsing PDF"""
    return get_parser().parse_pdf(pdf_file)

def json_encode_text(text: str) -> str:
    """Module-level interface for JSON encoding"""
    return get_parser().json_encode_text(text)
