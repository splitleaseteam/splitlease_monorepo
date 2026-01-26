from flask import Blueprint, request, jsonify, redirect, url_for, session, current_app
from .uploader import GoogleDriveUploader
from google_auth_oauthlib.flow import Flow
import logging
import os
import io
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

google_drive = Blueprint('google_drive', __name__)
logger = logging.getLogger(__name__)

# Initialize uploader lazily to avoid startup errors
base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
uploader = None

def get_uploader():
    """Get or create the GoogleDriveUploader instance"""
    global uploader
    if uploader is None:
        try:
            uploader = GoogleDriveUploader(base_dir)
        except Exception as e:
            logger.error(f"Failed to initialize GoogleDriveUploader: {str(e)}")
            raise
    return uploader

@google_drive.route('/authorize')
def authorize():
    """Initiate OAuth2 authorization flow"""
    try:
        # Get uploader instance
        try:
            drive_uploader = get_uploader()
        except Exception as e:
            error_msg = f"Failed to initialize Google Drive: {str(e)}"
            logger.error(error_msg)
            return jsonify({'success': False, 'error': error_msg}), 500
        
        # Verify client secrets file exists
        if not os.path.exists(drive_uploader.CLIENT_SECRETS_FILE):
            error_msg = f"Client secrets file not found at {drive_uploader.CLIENT_SECRETS_FILE}"
            logger.error(error_msg)
            return jsonify({'success': False, 'error': error_msg}), 500

        flow = Flow.from_client_secrets_file(
            drive_uploader.CLIENT_SECRETS_FILE,
            scopes=drive_uploader.SCOPES
        )

        # Use redirect URI from environment variable
        redirect_uri = os.environ.get('GOOGLE_DRIVE_REDIRECT_URI')
        flow.redirect_uri = redirect_uri

        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )

        session['state'] = state
        logger.info(f"Authorization URL generated: {authorization_url}")
        return redirect(authorization_url)

    except Exception as e:
        error_msg = f"Error in authorize: {str(e)}"
        logger.error(error_msg)
        return jsonify({'success': False, 'error': error_msg}), 500

@google_drive.route('/oauth2callback')
def oauth2callback():
    """Handle OAuth2 callback"""
    try:
        # Get uploader instance
        try:
            drive_uploader = get_uploader()
        except Exception as e:
            error_msg = f"Failed to initialize Google Drive: {str(e)}"
            logger.error(error_msg)
            return jsonify({'success': False, 'error': error_msg}), 500
            
        state = session.get('state')
        if not state:
            error_msg = "No state found in session. Please restart authorization."
            logger.error(error_msg)
            return jsonify({'success': False, 'error': error_msg}), 400
            
        flow = Flow.from_client_secrets_file(
            drive_uploader.CLIENT_SECRETS_FILE,
            scopes=drive_uploader.SCOPES,
            state=state
        )

        # Use redirect URI from environment variable
        redirect_uri = os.environ.get('GOOGLE_DRIVE_REDIRECT_URI')
        flow.redirect_uri = redirect_uri

        authorization_response = request.url
        flow.fetch_token(authorization_response=authorization_response)

        # Save credentials
        drive_uploader.save_credentials(flow.credentials)

        success_msg = "Authorization successful. You can now use the Google Drive API."
        logger.info(success_msg)

        return success_msg

    except Exception as e:
        error_msg = f"Error in oauth2callback: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500

@google_drive.route('/upload', methods=['POST'])
def upload_file():
    """Upload a file to Google Drive"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400

        file = request.files['file']
        if not file.filename:
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400

        # Read file into memory
        file_stream = io.BytesIO(file.read())

        # Get uploader instance
        try:
            drive_uploader = get_uploader()
        except Exception as e:
            error_msg = f"Failed to initialize Google Drive: {str(e)}"
            logger.error(error_msg)
            return jsonify({'success': False, 'error': error_msg}), 500
            
        # Upload to Google Drive
        result = drive_uploader.upload_file(
            file=file_stream,
            file_name=file.filename,
            mime_type=file.content_type or 'application/octet-stream'
        )

        if not result['success']:
            return jsonify(result), 500

        return jsonify(result)

    except Exception as e:
        error_msg = f"Error processing upload request: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500

@google_drive.route('/status', methods=['GET'])
def get_status():
    """Check Google Drive connection status"""
    try:
        # Get uploader instance
        try:
            drive_uploader = get_uploader()
        except Exception as e:
            error_msg = f"Failed to initialize Google Drive: {str(e)}"
            logger.error(error_msg)
            return jsonify({'success': False, 'error': error_msg}), 500
            
        creds = drive_uploader.get_credentials()
        if creds and creds.valid:
            return jsonify({
                'success': True,
                'status': 'connected',
                'scopes': creds.scopes
            })
        else:
            return jsonify({
                'success': False,
                'status': 'disconnected',
                'error': 'Not authenticated with Google Drive'
            }), 401

    except Exception as e:
        error_msg = f"Error checking Google Drive status: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            'success': False,
            'status': 'error',
            'error': error_msg
        }), 500
