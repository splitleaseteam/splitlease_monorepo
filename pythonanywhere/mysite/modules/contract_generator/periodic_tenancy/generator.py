import os
import datetime
import io
import base64
import logging
from typing import Dict, Any, Optional
from docxtpl import DocxTemplate, InlineImage
from docx import Document
from docx.shared import Inches
import requests
from modules.google_drive.uploader import GoogleDriveUploader
from modules.logging.error_logger import log_error
from modules.logging.success_logger import log_success

logger = logging.getLogger(__name__)

class PeriodicTenancyGenerator:
    def __init__(self, base_dir: str):
        """Initialize the periodic tenancy generator.
        
        Args:
            base_dir: Base directory for the project (project root)
        """
        self.base_dir = base_dir
        self.module_name = 'periodic_tenancy'
        self.temp_dir = os.path.join(base_dir, 'temp', self.module_name)
        # Note: base_dir is now the project root, so we need to include 'modules' in the path
        self.template_dir = os.path.join(base_dir, 'modules', 'templates', self.module_name)
        self.log_dir = os.path.join(base_dir, 'logs')
        
        # Create necessary directories
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.template_dir, exist_ok=True)
        os.makedirs(self.log_dir, exist_ok=True)
        
        # Configure logging
        self.setup_logging()
        
        # Template path - using template_dir to avoid path duplication
        self.template_path = os.path.join(self.template_dir, 'periodictenancyagreement.docx')
        
        # Verify template exists
        if not os.path.exists(self.template_path):
            error_msg = f"Template file not found at {self.template_path}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)

    def setup_logging(self):
        """Configure logging to both file and Slack"""
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        
        # File handler
        file_handler = logging.FileHandler(os.path.join(self.log_dir, 'periodic_tenancy.log'))
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
        logger.setLevel(logging.DEBUG)

    def get_date(self, date_str: str) -> Optional[datetime.datetime]:
        """Convert date string to datetime object"""
        try:
            return datetime.datetime.strptime(date_str, '%m/%d/%y')
        except ValueError as e:
            logger.error(f"Date parsing error: {str(e)}")
            return None

    def get_formatted_date(self, date_str: str) -> str:
        """Format date string to readable format"""
        if not date_str or date_str.strip() == '':
            return ''
        date = self.get_date(date_str)
        return date.strftime('%B %d, %Y') if date else ''

    def remove_empty_rows(self, table):
        """Remove empty rows from a table"""
        try:
            for row in table.rows[::-1]:
                if row.cells[0].text.strip() == '':
                    table._element.remove(row._element)
        except Exception as e:
            logger.error(f"Error removing empty rows: {str(e)}")

    def process_images(self, doc: DocxTemplate, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process and prepare images for the document"""
        images = {}
        try:
            for i in range(1, 4):
                image_key = f'image{i}'
                if image_key in data and data[image_key]:
                    image_data = base64.b64decode(data[image_key])
                    image_stream = io.BytesIO(image_data)
                    images[image_key] = InlineImage(doc, image_stream, width=Inches(0.5))
            return images
        except Exception as e:
            logger.error(f"Error processing images: {str(e)}")
            return {}

    def format_house_rules(self, house_rules) -> str:
        """Format house rules as a bulleted list string or return N/A if empty"""
        if not house_rules:
            return "N/A"
            
        # If house_rules is a string, try to convert to list
        if isinstance(house_rules, str):
            # Check if it might be a JSON string
            if house_rules.startswith('[') and house_rules.endswith(']'):
                try:
                    import json
                    rules_list = json.loads(house_rules)
                except Exception as e:
                    logger.warning(f"Failed to parse house rules as JSON: {e}")
                    # Treat as a single rule
                    rules_list = [house_rules]
            else:
                # Split by newlines or commas if present
                if '\n' in house_rules:
                    rules_list = [rule.strip() for rule in house_rules.split('\n') if rule.strip()]
                elif ',' in house_rules:
                    rules_list = [rule.strip() for rule in house_rules.split(',') if rule.strip()]
                else:
                    # Treat as a single rule
                    rules_list = [house_rules]
        else:
            # Assume it's already a list-like object
            rules_list = house_rules
            
        # If list is empty after processing, return N/A
        if not rules_list:
            return "N/A"
            
        # Format as a bulleted list
        formatted_rules = ""
        for rule in rules_list:
            if rule.strip():
                formatted_rules += f"• {rule.strip()}\n"
                
        return formatted_rules.strip()

    def create_agreement(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new periodic tenancy agreement"""
        file_path = None
        try:
            logger.info(f"Starting agreement creation for {data.get('Agreement Number', 'UNKNOWN')}")
            
            if not os.path.exists(self.template_path):
                error_msg = f"Template file not found at {self.template_path}"
                logger.error(error_msg)
                log_error(error_msg)
                return {
                    'success': False, 
                    'error': error_msg,
                    'returned_error': 'yes'
                }

            # Process template
            try:
                doc = DocxTemplate(self.template_path)
                logger.info("Template loaded successfully")
            except Exception as e:
                error_msg = f"Failed to load template: {str(e)}"
                logger.error(error_msg)
                return {
                    'success': False, 
                    'error': error_msg,
                    'returned_error': 'yes'
                }
            
            # Process images
            try:
                images = self.process_images(doc, data)
                logger.info("Images processed successfully")
            except Exception as e:
                error_msg = f"Failed to process images: {str(e)}"
                logger.error(error_msg)
                return {
                    'success': False, 
                    'error': error_msg,
                    'returned_error': 'yes'
                }
            
            # Prepare template data
            template_data = {
                'agreement_number': data.get('Agreement Number', ''),
                'start_date': self.get_formatted_date(data.get('Check in Date', '')),
                'end_date': self.get_formatted_date(data.get('Check Out Date', '')),
                'last_date': self.get_formatted_date(data.get('Check Out Date', '')),
                'check_in': data.get('Check In Day', ''),
                'check_out': data.get('Check Out Day', ''),
                'week_duration': data.get('Number of weeks', ''),
                'guests_allowed': data.get('Guests Allowed', ''),
                'host_name': data.get('Host name', ''),
                'guest_name': data.get('Guest name', ''),
                'supplemental_number': data.get('Supplemental Number', ''),
                'credit_card_form_number': data.get('Authorization Card Number', ''),
                'payout_number': data.get('Host Payout Schedule Number', ''),
                'cancellation_policy_rest': data.get('Extra Requests on Cancellation Policy', '') or 'N/A',
                'damage_deposit': data.get('Damage Deposit', ''),
                'listing_title': data.get('Listing Title', ''),
                'spacedetails': data.get('Space Details', ''),
                'listing_description': data.get('Listing Description', ''),
                'location': data.get('Location', ''),
                'type_of_space': data.get('Type of Space', ''),
                'House_rules_items': self.format_house_rules(data.get('House Rules', '')),
                **images
            }

            # Create document
            try:
                # Render template
                doc.render(template_data)
                logger.info("Template rendered successfully")

                # Process the rendered document
                output = io.BytesIO()
                doc.save(output)
                output.seek(0)

                # Create final document
                document = Document(output)
                for table in document.tables:
                    self.remove_empty_rows(table)

                # Save final document
                agreement_number = data.get('Agreement Number', 'unknown')
                filename = f'periodic_tenancy_agreement-{agreement_number}.docx'
                file_path = os.path.join(self.temp_dir, filename)
                document.save(file_path)
                os.chmod(file_path, 0o666)
                logger.info(f"Document saved successfully: {filename}")

            except Exception as e:
                error_msg = f"Failed to create document: {str(e)}"
                logger.error(error_msg)
                return {
                    'success': False, 
                    'error': error_msg,
                    'returned_error': 'yes'
                }

            # Upload to Google Drive
            try:
                uploader = GoogleDriveUploader(self.base_dir)
                mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                upload_result = uploader.upload_file(file_path, filename, mime_type)
                
                if not upload_result.get('success'):
                    error_msg = f"Failed to upload to Google Drive: {upload_result.get('error')}"
                    logger.error(error_msg)
                    log_error(error_msg)
                    return {
                        'success': True,  # Document was created successfully
                        'filename': filename,
                        'file_path': file_path,
                        'drive_upload_error': error_msg,
                        'returned_error': 'no'
                    }
                
                success_msg = f"Successfully created and uploaded periodic tenancy agreement: {filename}"
                logger.info(success_msg)
                log_success(success_msg)
                
                return {
                    'success': True,
                    'filename': filename,
                    'file_path': file_path,
                    'web_view_link': upload_result.get('web_view_link'),
                    'file_id': upload_result.get('file_id'),
                    'returned_error': 'no'
                }
                
            except Exception as upload_error:
                error_msg = f"Error uploading to Google Drive: {str(upload_error)}"
                logger.error(error_msg)
                log_error(error_msg)
                return {
                    'success': True,  # Document was created successfully
                    'filename': filename,
                    'file_path': file_path,
                    'drive_upload_error': error_msg,
                    'returned_error': 'no'
                }

        except Exception as e:
            error_msg = f"Error creating periodic tenancy agreement: {str(e)}"
            logger.error(error_msg)
            log_error(error_msg)
            
            # Clean up temporary file in case of error
            try:
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Cleaned up temporary file after error: {file_path}")
            except Exception as cleanup_error:
                logger.warning(f"Failed to clean up temporary file {file_path}: {str(cleanup_error)}")
            
            return {
                'success': False,
                'error': error_msg,
                'returned_error': 'yes'
            }
