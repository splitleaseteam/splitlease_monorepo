# uploader.py
import os
import io
import logging
from typing import Tuple, Optional, Dict, Any, Union
from datetime import datetime
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaFileUpload
from google.auth.transport.requests import Request
import requests
from dotenv import load_dotenv
from modules.logging.logger import log_error, log_success

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

logger = logging.getLogger(__name__)

class GoogleDriveUploader:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        # Use config directory from environment variable
        self.config_dir = os.environ.get('GOOGLE_DRIVE_CONFIG_DIR', '/home/SplitLease/mysite/modules/google_drive')
        self.log_dir = os.path.join(base_dir, 'logs')

        # Create necessary directories
        os.makedirs(self.log_dir, exist_ok=True)

        # Configure logging
        self.setup_logging()

        # Google Drive configuration with absolute paths
        self.CLIENT_SECRETS_FILE = os.path.join(self.config_dir, 'client_secret.json')
        self.TOKEN_FILE = os.path.join(self.config_dir, 'token.json')
        self.SCOPES = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/drive.file',
            'openid'
        ]
        self.FOLDER_ID = os.environ.get('GOOGLE_DRIVE_FOLDER_ID')

        # Log configuration paths for debugging
        logger.info(f"Google Drive config directory: {self.config_dir}")
        logger.info(f"Looking for client secrets at: {self.CLIENT_SECRETS_FILE}")
        
        # Check if files exist (but don't raise exception during init)
        if not os.path.exists(self.CLIENT_SECRETS_FILE):
            logger.warning(f"Client secrets file not found at {self.CLIENT_SECRETS_FILE}")
            logger.warning("Google Drive functionality will not be available until client_secret.json is added")
        elif not os.access(self.CLIENT_SECRETS_FILE, os.R_OK):
            logger.warning(f"Client secrets file not readable at {self.CLIENT_SECRETS_FILE}")
            logger.warning("Please check file permissions")


    def setup_logging(self):
        """Configure logging to both file and Slack"""
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

        # File handler
        file_handler = logging.FileHandler(os.path.join(self.log_dir, 'google_drive.log'))
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        logger.setLevel(logging.DEBUG)

    def save_credentials(self, creds: Credentials):
        """Save credentials to token file"""
        try:
            with open(self.TOKEN_FILE, 'w') as token:
                token.write(creds.to_json())
            logger.info("Credentials saved successfully")
        except Exception as e:
            error_msg = f"Error saving credentials: {str(e)}"
            logger.error(error_msg)
            log_error(error_msg)
            raise

    def get_credentials(self) -> Optional[Credentials]:
        """Get or refresh Google Drive credentials"""
        try:
            creds = None
            if os.path.exists(self.TOKEN_FILE):
                creds = Credentials.from_authorized_user_file(self.TOKEN_FILE, self.SCOPES)

            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    try:
                        creds.refresh(Request())
                        self.save_credentials(creds)
                    except Exception as e:
                        logger.error(f"Error refreshing credentials: {str(e)}")
                        return None
                else:
                    logger.error("No valid credentials available and no refresh token")
                    return None

            return creds
        except Exception as e:
            logger.error(f"Error in get_credentials: {str(e)}")
            return None

    def _prepare_upload(self, file_name: str) -> Tuple[Optional[Any], Optional[str]]:
        """Prepare Google Drive service and handle authentication"""
        try:
            creds = self.get_credentials()
            if not creds:
                error_msg = "Google Drive authentication failed"
                logger.error(error_msg)
                log_error(error_msg)
                return None, error_msg

            service = build('drive', 'v3', credentials=creds, cache_discovery=False)
            return service, None

        except Exception as e:
            error_msg = f"Error preparing upload for {file_name}: {str(e)}"
            logger.error(error_msg)
            log_error(error_msg)
            return None, error_msg

    def upload_file(self,
                   file: Union[str, io.BytesIO],
                   file_name: str,
                   mime_type: str) -> Dict[str, Any]:
        """
        Upload a file to Google Drive

        Args:
            file: Either a file path (str) or a BytesIO object
            file_name: Name of the file in Google Drive
            mime_type: MIME type of the file
        """
        try:
            service, error = self._prepare_upload(file_name)
            if error:
                return {'success': False, 'error': error}

            # Prepare file metadata
            file_metadata = {
                'name': file_name,
                'parents': [self.FOLDER_ID]
            }

            # Prepare media based on input type
            if isinstance(file, str):
                if not os.path.exists(file):
                    error_msg = f"File not found: {file}"
                    logger.error(error_msg)
                    log_error(error_msg)
                    return {'success': False, 'error': error_msg}
                media = MediaFileUpload(file, mimetype=mime_type, resumable=True)
            else:
                media = MediaIoBaseUpload(file, mimetype=mime_type, resumable=True)

            # Upload file
            file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,name,webViewLink'
            ).execute()

            success_msg = f"Successfully uploaded file to Google Drive: {file_name}"
            logger.info(success_msg)
            log_success(success_msg)

            return {
                'success': True,
                'file_id': file.get('id'),
                'file_name': file.get('name'),
                'web_view_link': file.get('webViewLink')
            }

        except Exception as e:
            error_msg = f"Error uploading file to Google Drive: {str(e)}"
            logger.error(error_msg)
            log_error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
