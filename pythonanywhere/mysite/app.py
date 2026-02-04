from flask import Flask
import os
from dotenv import load_dotenv
from pathlib import Path
# Load .env from project root explicitly
project_root = Path(__file__).parent
load_dotenv(dotenv_path=project_root / '.env')
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
import logging
import tempfile

# Import Google Doc Parser Dependancies
from modules.doc_parser.routes import bp as doc_parser_bp

# Imports House Manual PDF Creator Dependancies
from modules.house_manual_pdf.routes import house_manual_generator

# Imports Log Forwarders to Slack for Logs Channel and Errors into noisybubble
from modules.logging.error_logger import log_error
from modules.logging.success_logger import log_success

# Legacy contract generation has moved to Supabase Edge Functions
from modules.google_drive.routes import google_drive
from modules.core.monitoring import monitoring

# Imports Curated Listings PDF Creator Dependencies
from modules.curated_listings_pdf.routes import curated_listings_generator

# Import Calendar Automation
from modules.calendar_automation.routes import calendar_automation

# Import Slack Events
from modules.slack_events import slack_events
from modules.signup_automation_zap import bp as signup_bp
# Imports search user slack - python - bubble - slack
from modules.user_search_module.routes import bp as user_search_bp
from modules.knowledge_search_module import bp as knowledge_search_bp

# Initialize logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Configure logging
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Initialize SQLAlchemy
db = SQLAlchemy()

def create_app():
    """Create and configure the Flask application"""
    try:
        logger.info("Creating Flask app...")
        app = Flask(__name__)

        # Configure session handling for PythonAnywhere
        app.config.update(
            SECRET_KEY='123456',  # Use a static secret key
            SESSION_TYPE='filesystem',
            SESSION_FILE_DIR=tempfile.gettempdir(),
            SESSION_PERMANENT=False,
            PERMANENT_SESSION_LIFETIME=1800
        )
        Session(app)

        # Configure SQLAlchemy
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///splitlease.db')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

        # Initialize extensions
        db.init_app(app)

        # Register blueprints
        logger.info("Registering blueprints...")
        app.register_blueprint(doc_parser_bp, url_prefix='/docs')
        app.register_blueprint(house_manual_generator, url_prefix='/housemanual')
        app.register_blueprint(google_drive, url_prefix='/google_drive')
        app.register_blueprint(monitoring)
        app.register_blueprint(curated_listings_generator, url_prefix='/curatedlistings')
        app.register_blueprint(calendar_automation, url_prefix='/calendar')  # NEW
        app.register_blueprint(slack_events, url_prefix='/slack')  # NEW
        app.register_blueprint(signup_bp, url_prefix='/signup')
        app.register_blueprint(user_search_bp, url_prefix='/api/user-search')
        app.register_blueprint(knowledge_search_bp, url_prefix='/api/knowledge-search')

        # Create database tables
        with app.app_context():
            logger.info("Creating database tables...")
            db.create_all()

        logger.info("Flask app created successfully")
        return app

    except Exception as e:
        logger.error(f"Error creating Flask app: {str(e)}", exc_info=True)
        raise


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
